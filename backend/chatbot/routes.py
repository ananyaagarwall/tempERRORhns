from flask import Blueprint, request, jsonify, g
from models import Builder, ChatSession, ChatMessage, UserInteraction, Property, User
from extensions import db 
from sqlalchemy.exc import DataError, IntegrityError, OperationalError
from sqlalchemy import text, inspect
import re
from .rag_service import (
    get_chatbot_response, 
    get_azure_openai_health,
    sync_properties_to_vectordb, 
    determine_conversation_state,
    update_session_state,
    ConversationMemory,
    classify_intent,
    UserIntent,
    format_property_details,
    format_builder_details,
    compare_properties,
    compare_builders,
)

chatbot_bp = Blueprint('chatbot', __name__)
from auth import clerk_required

# Session-level tracking (in-memory)
# For production, consider Redis or database storage
session_tracking = {}


def _resolve_local_user_id(raw_user_id=None):
    """
    Normalize request/auth user identifiers to the local integer user.id.
    Accepts a local integer id and still tolerates a Clerk user id string
    for backward compatibility.
    """
    current_user = getattr(g, 'current_user', None)
    if current_user:
        return current_user.id

    if raw_user_id in (None, ""):
        return None

    value = str(raw_user_id).strip()
    if not value:
        return None

    if value.isdigit():
        user = User.query.get(int(value))
        if user:
            return user.id

    user = User.query.filter_by(clerk_user_id=value).first()
    return user.id if user else None


def _get_table_columns(table_name):
    inspector = inspect(db.engine)
    if not inspector.has_table(table_name):
        return {}
    return {column['name']: column for column in inspector.get_columns(table_name)}


def _resync_sequence(table_name, pk_column="id"):
    """
    Repair PostgreSQL sequence drift for SERIAL/BIGSERIAL PKs.
    """
    db.session.execute(
        text(
            f"""
            SELECT setval(
                pg_get_serial_sequence('{table_name}', '{pk_column}'),
                COALESCE((SELECT MAX({pk_column}) FROM {table_name}), 1),
                true
            )
            """
        )
    )
    db.session.commit()


def _resync_chat_session_sequence():
    """
    Fix PostgreSQL sequence drift for chat_session.id so next inserts don't collide.
    Safe no-op for empty table; only intended for PostgreSQL backends.
    """
    _resync_sequence("chat_session", "id")


def _save_chat_messages(session_id, user_content=None, assistant_content=None):
    """
    Persist chat messages with one automatic retry on chat_message sequence drift.
    """
    payloads = []
    if user_content:
        payloads.append({"role": "user", "content": user_content})
    if assistant_content:
        payloads.append({"role": "assistant", "content": assistant_content})
    if not payloads:
        return

    def _insert_messages():
        for item in payloads:
            db.session.add(
                ChatMessage(
                    session_id=session_id,
                    role=item["role"],
                    content=item["content"]
                )
            )
        db.session.commit()

    try:
        _insert_messages()
    except IntegrityError as e:
        db.session.rollback()
        err_text = str(e).lower()
        if "chat_message_pkey" in err_text and "duplicate key value" in err_text:
            try:
                _resync_sequence("chat_message", "id")
                _insert_messages()
                return
            except Exception as retry_error:
                db.session.rollback()
                print(f"Failed saving chat messages after sequence resync: {retry_error}")
                return
        print(f"Failed saving chat messages: {e}")
    except Exception as e:
        db.session.rollback()
        print(f"Failed saving chat messages: {e}")


def _extract_reference_positions(user_message):
    msg_lower = (user_message or "").lower()
    positions = []

    explicit_matches = re.findall(
        r"\b(?:prop(?:erty)?|builder|proj(?:ect)?|project|card|result)\b\s*#?\s*(\d+)\b",
        msg_lower,
    )
    positions.extend(int(value) for value in explicit_matches)

    suffix_matches = re.findall(r"\b(\d+)(?:st|nd|rd|th)\b", msg_lower)
    positions.extend(int(value) for value in suffix_matches)

    ord_map = {
        'first': 1,
        'second': 2,
        'third': 3,
        'fourth': 4,
        'fifth': 5,
    }
    for word, index in ord_map.items():
        if re.search(rf"\b{word}\b", msg_lower):
            positions.append(index)

    ordered = []
    seen = set()
    for index in positions:
        if index < 1 or index in seen:
            continue
        seen.add(index)
        ordered.append(index)
    return ordered[:5]


def _infer_session_result_type(session_data, user_message=None):
    msg_lower = (user_message or "").lower()

    if any(token in msg_lower for token in ['builder', 'builders', 'developer', 'developers']):
        return 'builder'
    if any(token in msg_lower for token in ['property', 'properties', 'project', 'projects', 'flat', 'apartment', 'home']):
        return 'property'

    last_result_type = session_data.get('last_result_type')
    if last_result_type in ['property', 'builder']:
        return last_result_type

    last_intent = session_data.get('last_intent')
    if last_intent == 'search_builders':
        return 'builder'
    if last_intent in ['search_properties', 'compare', 'get_details']:
        if session_data.get('last_shown_builders') and not session_data.get('last_shown_properties'):
            return 'builder'
        return 'property'

    if session_data.get('last_shown_builders') and not session_data.get('last_shown_properties'):
        return 'builder'
    if session_data.get('last_shown_properties'):
        return 'property'
    return None


def _resolve_session_compare_items(session_data, user_message):
    result_type = _infer_session_result_type(session_data, user_message)
    if result_type not in ['property', 'builder']:
        return None, []

    source_ids = (
        session_data.get('last_shown_properties', [])
        if result_type == 'property'
        else session_data.get('last_shown_builders', [])
    )
    source_ids = [value for value in source_ids if value not in (None, "")]
    if len(source_ids) < 2:
        return result_type, []

    msg_lower = (user_message or "").lower()
    positions = _extract_reference_positions(user_message)

    if positions:
        selected_ids = [
            source_ids[index - 1]
            for index in positions
            if 1 <= index <= len(source_ids)
        ]
    elif any(token in msg_lower for token in ['them', 'these', 'those', 'both', 'two', 'all', 'vs', 'versus', 'better', 'difference']):
        limit = 2 if any(token in msg_lower for token in ['both', 'two']) else min(5, len(source_ids))
        selected_ids = source_ids[:limit]
    else:
        selected_ids = []

    deduped_ids = []
    seen = set()
    for value in selected_ids:
        key = str(value)
        if key in seen:
            continue
        seen.add(key)
        deduped_ids.append(value)

    if result_type == 'property':
        items = []
        for value in deduped_ids:
            try:
                prop = Property.query.get(int(value))
            except (TypeError, ValueError):
                prop = None
            if prop:
                items.append(prop)
    else:
        items = []
        for value in deduped_ids:
            builder = Builder.query.get(str(value))
            if builder:
                items.append(builder)

    return result_type, items[:5]


@chatbot_bp.route('/sync', methods=['POST'])
def sync_db():
    """Admin endpoint to force sync SQL -> Vector DB"""
    try:
        sync_properties_to_vectordb()
        return jsonify({"message": "Synchronization complete."}), 200
    except Exception as e:
        print(f"Sync Error: {str(e)}")
        return jsonify({"error": "Failed to sync database."}), 500


@chatbot_bp.route('/ask', methods=['POST'])
@clerk_required()
def ask_bot():
    """
    Enhanced chatbot endpoint with improved pagination
    - Retrieves up to 20 results
    - Shows first 10 initially
    - Provides "show more" option
    """
    data = request.json
    user_message = data.get('message')
    user_id = _resolve_local_user_id(data.get('user_id'))
    session_id = data.get('session_id')

    if not user_message:
        return jsonify({"error": "Message required"}), 400

    # Initialize session tracking
    if session_id and session_id not in session_tracking:
        session_tracking[session_id] = {
            'shown_ids': set(),
            'conversation_count': 0,
            'memory': ConversationMemory(session_id),
            'all_properties': [],
            'all_builders': [],
            'last_shown_properties': [],
            'last_shown_builders': [],
            'last_result_type': None,
            'current_page': 0,
            'properties_offset': 0,
            'builders_offset': 0
        }
    
    session_data = session_tracking.get(session_id, {
        'shown_ids': set(),
        'conversation_count': 0,
        'memory': ConversationMemory(session_id) if session_id else None,
        'all_properties': [],
        'all_builders': [],
        'last_shown_properties': [],
        'last_shown_builders': [],
        'last_result_type': None,
        'current_page': 0,
        'properties_offset': 0,
        'builders_offset': 0
    })

    if session_id and user_id is not None:
        session_row = ChatSession.query.get(session_id)
        if session_row and session_row.user_id != user_id:
            session_row.user_id = user_id
            db.session.commit()
    
    session_data['conversation_count'] += 1
    
    # Extract entities
    if session_data.get('memory'):
        memory = session_data['memory']
        memory.entities['property_ids'] = [str(pid) for pid in session_data.get('last_shown_properties', []) if pid not in (None, "")]
        memory.extract_entities_from_message(user_message)
        resolved_property_id = memory.resolve_coreference(user_message)
        if resolved_property_id:
            print(f"Resolved reference to property: {resolved_property_id}")

    # Prepare Chat History
    chat_history = []
    if session_id:
        recent_msgs = ChatMessage.query.filter_by(session_id=session_id)\
                        .order_by(ChatMessage.created_at.asc())\
                        .limit(10).all()
        
        temp_user_msg = None
        for msg in recent_msgs:
            if msg.role == 'user':
                temp_user_msg = msg.content
            elif msg.role == 'assistant' and temp_user_msg:
                chat_history.append((temp_user_msg, msg.content))
                temp_user_msg = None

    # Determine conversation state
    if session_id:
        new_state = determine_conversation_state(session_id, user_message, chat_history)
        update_session_state(session_id, new_state)

    # INTENT PRE-HANDLING: If user asked for DETAILS referencing a shown card (e.g., "prop 1", "first one"),
    # resolve it using session tracking and return the DB-sourced detailed text immediately.
    intent = classify_intent(user_message)
    if intent == UserIntent.GET_DETAILS and session_id:
        # numeric reference like 'prop 1' or 'property #2' or 'builder 2'
        m = re.search(r"\b(prop(?:erty)?|property|builder|proj|project)\b\s*#?\s*(\d+)", user_message.lower())
        if not m:
            # ordinal words 'first', 'second', etc.
            ord_map = {'first':1,'second':2,'third':3,'fourth':4,'fifth':5}
            for word, idx in ord_map.items():
                if word in user_message.lower():
                    m = (None, None)
                    ord_idx = idx
                    break
            else:
                ord_idx = None
        else:
            ord_idx = int(m.group(2)) if m else None

        # If we detected a numeric/ordinal reference, attempt to resolve
        if ord_idx is not None and ord_idx >= 1:
            last_props = session_data.get('last_shown_properties', [])
            last_builders = session_data.get('last_shown_builders', [])

            # Determine which type user referenced
            referenced_type = None
            if m and m[1]:
                token = m[1]
                if 'prop' in token or 'property' in token:
                    referenced_type = 'property'
                elif 'build' in token:
                    referenced_type = 'builder'
                elif 'proj' in token or 'project' in token:
                    referenced_type = 'property'

            # If no explicit token, infer from last intent
            if not referenced_type:
                last_type = session_tracking.get(session_id, {}).get('last_result_type')
                last_int = session_tracking.get(session_id, {}).get('last_intent')
                if last_type == 'property' or last_int == 'search_properties':
                    referenced_type = 'property'
                elif last_type == 'builder' or last_int == 'search_builders':
                    referenced_type = 'builder'

            # Resolve the item id from last_shown lists
            if referenced_type == 'property' and len(last_props) >= ord_idx:
                pid = last_props[ord_idx-1]
                prop = Property.query.get(int(pid))
                if prop:
                    detailed = format_property_details(prop)
                    # mark shown
                    session_data['shown_ids'].add(str(prop.id))
                    session_data['last_shown_properties'] = [str(prop.id)]
                    session_data['last_shown_builders'] = []
                    session_data['last_result_type'] = 'property'

                    # Save chat messages
                    if session_id:
                        _save_chat_messages(session_id, user_message, detailed)

                    return jsonify({
                        "response": detailed,
                        "last_intent": 'get_details',
                        "properties": [prop.to_dict()],
                        "builders": [],
                        "has_more": len([p for p in session_data.get('all_properties', []) if str(p.get('id')) not in session_data['shown_ids']]) > 0
                    })

            if referenced_type == 'builder' and len(last_builders) >= ord_idx:
                bid = last_builders[ord_idx-1]
                builder = Builder.query.get(bid)
                if builder:
                    detailed = format_builder_details(builder)
                    session_data['shown_ids'].add(str(bid))
                    session_data['last_shown_builders'] = [str(bid)]
                    session_data['last_shown_properties'] = []
                    session_data['last_result_type'] = 'builder'

                    if session_id:
                        _save_chat_messages(session_id, user_message, detailed)

                    return jsonify({
                        "response": detailed,
                        "last_intent": 'get_details',
                        "properties": [],
                        "builders": [builder.to_dict()],
                        "has_more": len([b for b in session_data.get('all_builders', []) if str(b.get('id')) not in session_data['shown_ids']]) > 0
                    })

    if intent == UserIntent.COMPARE_PROPERTIES and session_id:
        compare_type, compare_items = _resolve_session_compare_items(session_data, user_message)
        if len(compare_items) >= 2:
            comparison_text = (
                compare_properties(compare_items)
                if compare_type == 'property'
                else compare_builders(compare_items)
            )

            session_data['last_intent'] = 'compare'
            session_data['last_result_type'] = compare_type
            session_data['current_page'] = 0
            session_data['properties_offset'] = len(compare_items) if compare_type == 'property' else 0
            session_data['builders_offset'] = len(compare_items) if compare_type == 'builder' else 0

            if compare_type == 'property':
                for item in compare_items:
                    session_data['shown_ids'].add(str(item.id))
                session_data['all_properties'] = [item.to_dict() for item in compare_items]
                session_data['all_builders'] = []
                session_data['last_shown_properties'] = [item.id for item in compare_items]
                session_data['last_shown_builders'] = []
                properties_payload = [item.to_dict() for item in compare_items]
                builders_payload = []
            else:
                for item in compare_items:
                    session_data['shown_ids'].add(str(item.id))

                session_data['all_properties'] = []
                session_data['all_builders'] = [item.to_dict() for item in compare_items]
                session_data['last_shown_properties'] = []
                session_data['last_shown_builders'] = [item.id for item in compare_items]

                properties_payload = []
                builders_payload = [item.to_dict() for item in compare_items]

            if session_id:
                _save_chat_messages(session_id, user_message, comparison_text)

            return jsonify({
                "response": comparison_text,
                "last_intent": 'compare',
                "properties": properties_payload,
                "builders": builders_payload,
                "has_more": False,
                "current_page": 0,
                "total_results": {
                    "properties": len(properties_payload),
                    "builders": len(builders_payload),
                },
                "stats": {
                    "properties_shown": len(properties_payload),
                    "builders_shown": len(builders_payload),
                    "conversation_count": session_data['conversation_count'],
                },
                "buffered_responses": [],
            })

    # Call RAG Service
    try:
        ai_response, updated_shown_ids, all_properties, all_builders, last_intent, buffered_responses = get_chatbot_response(
            user_message,
            user_id,
            chat_history,
            session_shown_ids=session_data['shown_ids'],
            conversation_memory=session_data.get('memory'),
            last_intent=session_data.get('last_intent'),
            last_result_type=session_data.get('last_result_type'),
        )

        # Save last intent for this session
        session_data['last_intent'] = last_intent

        # Update session data with ALL results (convert to dict immediately to avoid SQLAlchemy session issues)
        session_data['shown_ids'] = updated_shown_ids
        session_data['all_properties'] = [p.to_dict() for p in all_properties]
        session_data['all_builders'] = [b.to_dict() for b in all_builders]
        session_data['current_page'] = 0  # Reset to first page

        # For a fresh query always display the first 10 from the current result set.
        # Filtering by shown_ids here causes previously-seen properties to be invisible
        # even when the user has refined their search (e.g. adding a budget filter).
        properties_to_show = session_data['all_properties'][:10]
        builders_to_show = session_data['all_builders'][:10]

        # Reset shown_ids to reflect only the current result set so that
        # subsequent "load more" paginates correctly from this new query.
        session_data['shown_ids'] = set(str(p.get('id')) for p in properties_to_show)
        session_data['shown_ids'].update(str(b.get('id')) for b in builders_to_show)

        # Store last shown order for reference (e.g., 'prop 1' -> this mapping).
        # IMPORTANT: for advisory / general intents (ASK_GENERAL) the RAG service returns
        # no property cards — the response is a text answer about the previously-discussed
        # properties. Do NOT overwrite last_shown_* in that case, so the next follow-up
        # like "compare these two again" still knows what was being discussed.
        if properties_to_show or last_intent not in ('general', 'get_details'):
            session_data['last_shown_properties'] = [p.get('id') for p in properties_to_show]
        if builders_to_show or last_intent not in ('general', 'get_details'):
            session_data['last_shown_builders'] = [b.get('id') for b in builders_to_show]
        if session_data.get('memory'):
            session_data['memory'].entities['property_ids'] = [str(pid) for pid in session_data['last_shown_properties'] if pid not in (None, "")]
        # Enforce intent-specific visibility: if user asked for properties only, don't show builders and vice versa
        if last_intent == 'search_properties':
            builders_to_show = []
        elif last_intent == 'search_builders':
            properties_to_show = []

        if builders_to_show and not properties_to_show:
            session_data['last_result_type'] = 'builder'
        elif properties_to_show and not builders_to_show:
            session_data['last_result_type'] = 'property'
        elif all_builders and not all_properties:
            session_data['last_result_type'] = 'builder'
        elif all_properties:
            session_data['last_result_type'] = 'property'

        # Track cursor offsets for robust pagination per latest result set
        session_data['properties_offset'] = len(properties_to_show)
        session_data['builders_offset'] = len(builders_to_show)

        # Add displayed items to shown_ids so 'show more' won't return duplicates
        for p in properties_to_show:
            session_data['shown_ids'].add(str(p.get('id')))
        for b in builders_to_show:
            session_data['shown_ids'].add(str(b.get('id')))

        # Check if there are more unseen results available for the requested type only
        remaining_props = [p for p in session_data['all_properties'] if str(p.get('id')) not in session_data['shown_ids']]
        remaining_builders = [b for b in session_data['all_builders'] if str(b.get('id')) not in session_data['shown_ids']]
        if last_intent == 'search_properties':
            has_more = len(remaining_props) > 0
        elif last_intent == 'search_builders':
            has_more = len(remaining_builders) > 0
        else:
            has_more = len(remaining_props) > 0 or len(remaining_builders) > 0
        
        # Save to DB
        if session_id:
            _save_chat_messages(session_id, user_message, ai_response)

        # PROCESS BUFFERED RESPONSES (Serialize objects)
        final_buffered = []
        if buffered_responses:
            for item in buffered_responses:
                payload = item.get('payload', {})
                
                # Convert properties to dicts
                if 'properties' in payload:
                    payload['properties'] = [p.to_dict() if hasattr(p, 'to_dict') else p for p in payload['properties']]
                
                if 'all_properties' in payload:
                    payload['all_properties'] = [p.to_dict() if hasattr(p, 'to_dict') else p for p in payload['all_properties']]
                
                # Convert builders to dicts
                if 'builders' in payload:
                    payload['builders'] = [b.to_dict() if hasattr(b, 'to_dict') else b for b in payload['builders']]
                
                if 'all_builders' in payload:
                    payload['all_builders'] = [b.to_dict() if hasattr(b, 'to_dict') else b for b in payload['all_builders']]
                
                # Ensure structure matches regular response
                if 'has_more' not in payload: payload['has_more'] = False
                if 'total_results' not in payload:
                    payload['total_results'] = {
                        "properties": len(payload.get('all_properties', payload.get('properties', []))),
                        "builders": len(payload.get('all_builders', payload.get('builders', [])))
                    }
                
                item['payload'] = payload
                final_buffered.append(item)
        return jsonify({
            "response": ai_response,
            "last_intent": session_data.get('last_intent'),
            "properties": [p.to_dict() if hasattr(p, 'to_dict') else p for p in properties_to_show],
            "builders": [b.to_dict() if hasattr(b, 'to_dict') else b for b in builders_to_show],
            "has_more": has_more,
            "total_results": {
                "properties": len(all_properties),
                "builders": len(all_builders)
            },
            "current_page": session_data.get('current_page', 0),
            "stats": {
                "properties_shown": len(properties_to_show),  # Only count what's actually shown
                "conversation_count": session_data['conversation_count']
            },
            "buffered_responses": final_buffered
        })
    
    except Exception as e:
        error_str = str(e).lower()
        
        if 'quota' in error_str or 'resource_exhausted' in error_str or '429' in error_str:
            error_message = (
                "I'm currently experiencing high demand. "
                "Please try again in a moment, or contact our support team for immediate assistance."
            )
            
            if session_id:
                _save_chat_messages(session_id, assistant_content=error_message)
            
            return jsonify({
                "response": error_message,
                "properties": [],
                "builders": [],
                "error_type": "quota_exceeded",
                "contact_info": {
                    "location": "Mumbai, India",
                    "email": "hello@housenseek.com",
                    "phone": "+91 123-456-7890"
                }
            }), 200
        
        db.session.rollback()
        print(f"Chat Error: {e}")
        import traceback
        print(traceback.format_exc())
        
        return jsonify({
            "response": "I apologize, but I'm having trouble right now. Please try again.",
            "properties": [],
            "builders": [],
            "error": str(e)
        }), 500

@chatbot_bp.route('/load-more', methods=['POST'])
@clerk_required()
def load_more():
    """
    Load next batch of 10 properties/builders
    """
    try:
        data = request.json
        session_id = data.get('session_id')
        
        print(f"Load more request - session ID: {session_id}")
        
        if not session_id or session_id not in session_tracking:
            print(f"Invalid session: {session_id}")
            print(f"Available sessions: {list(session_tracking.keys())}")
            return jsonify({"error": "Invalid session"}), 400
        
        session_data = session_tracking[session_id]
        current_page = session_data.get('current_page', 0)
        
        # These are already dictionaries (converted when stored)
        all_properties = session_data.get('all_properties', [])
        all_builders = session_data.get('all_builders', [])
        shown_ids = session_data.get('shown_ids', set())

        # Page using explicit offsets from the current result set.
        # This avoids false "no more" when shown_ids includes items from older turns.
        properties_offset = int(session_data.get('properties_offset', 0) or 0)
        builders_offset = int(session_data.get('builders_offset', 0) or 0)

        print(
            f"Total properties: {len(all_properties)} (offset: {properties_offset}); "
            f"Total builders: {len(all_builders)} (offset: {builders_offset})"
        )

        # Decide which type to load based on last intent
        last_intent = session_data.get('last_intent')
        if last_intent == 'search_properties':
            properties_to_show = all_properties[properties_offset:properties_offset + 10]
            builders_to_show = []
        elif last_intent == 'search_builders':
            properties_to_show = []
            builders_to_show = all_builders[builders_offset:builders_offset + 10]
        else:
            properties_to_show = all_properties[properties_offset:properties_offset + 10]
            builders_to_show = all_builders[builders_offset:builders_offset + 10]

        # If nothing unseen, return empty and indicate no more
        if not properties_to_show and not builders_to_show:
            print("No more unseen items to load for this intent.")
            has_more = False
            return jsonify({
                "properties": [],
                "builders": [],
                "has_more": False,
                "current_page": session_data['current_page']
            })

        # Update shown_ids and page only for items we are returning
        for p in properties_to_show:
            shown_ids.add(str(p.get('id')))
        for b in builders_to_show:
            shown_ids.add(str(b.get('id')))

        # Advance offsets by what we returned
        session_data['properties_offset'] = properties_offset + len(properties_to_show)
        session_data['builders_offset'] = builders_offset + len(builders_to_show)

        session_data['shown_ids'] = shown_ids
        session_data['current_page'] = current_page + 1

        # Store last shown order for 'details by index' references
        session_data['last_shown_properties'] = [p.get('id') for p in properties_to_show]
        session_data['last_shown_builders'] = [b.get('id') for b in builders_to_show]
        if builders_to_show and not properties_to_show:
            session_data['last_result_type'] = 'builder'
        elif properties_to_show and not builders_to_show:
            session_data['last_result_type'] = 'property'

        # Check if more results available for this intent
        if last_intent == 'search_properties':
            has_more = session_data['properties_offset'] < len(all_properties)
        elif last_intent == 'search_builders':
            has_more = session_data['builders_offset'] < len(all_builders)
        else:
            has_more = (
                session_data['properties_offset'] < len(all_properties) or
                session_data['builders_offset'] < len(all_builders)
            )
        
        print(f"Returning {len(properties_to_show)} properties, {len(builders_to_show)} builders")
        print(f"Has more: {has_more}")
        
        return jsonify({
            "last_intent": session_data.get('last_intent'),
            "properties": properties_to_show,
            "builders": builders_to_show,
            "has_more": has_more,
            "current_page": session_data['current_page'],
            "debug_pagination": {
                "properties_offset": session_data.get('properties_offset', 0),
                "builders_offset": session_data.get('builders_offset', 0),
                "total_properties": len(all_properties),
                "total_builders": len(all_builders)
            },
            "total_results": {
                "properties": len(all_properties),
                "builders": len(all_builders)
            }
        })
    
    except Exception as e:
        print(f"Error in load_more: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@chatbot_bp.route('/session/new', methods=['POST'])
@clerk_required()
def create_session():
    """Create a new chat session"""
    try:
        data = request.get_json(silent=True) or {}
        raw_user_id = data.get('user_id')
        user_id = _resolve_local_user_id(raw_user_id)

        if raw_user_id not in (None, "") and user_id is None:
            return jsonify({"error": "Invalid user_id. Use a local user.id. Clerk ids are only accepted for backward compatibility."}), 400
        
        new_session = ChatSession(
            user_id=user_id, 
            title="New Chat",
            state='initial',
            status='active'
        )
        
        db.session.add(new_session)
        db.session.commit()
        
        # Initialize tracking
        session_tracking[new_session.id] = {
            'shown_ids': set(),
            'conversation_count': 0,
            'memory': ConversationMemory(new_session.id),
            'all_properties': [],
            'all_builders': [],
            'last_shown_properties': [],
            'last_shown_builders': [],
            'last_result_type': None,
            'current_page': 0,
            'properties_offset': 0,
            'builders_offset': 0
        }
        
        return jsonify({
            "session_id": new_session.id,
            "message": "Session created successfully"
        })
    except (IntegrityError, DataError) as e:
        db.session.rollback()
        err_text = str(e).lower()
        print(f"Error creating session (data/integrity): {e}")

        # Auto-heal common PostgreSQL issue:
        # duplicate key on chat_session_pkey due to sequence behind MAX(id).
        if "chat_session_pkey" in err_text and "duplicate key value" in err_text:
            try:
                _resync_chat_session_sequence()
                # Retry once after sequence repair.
                retry_session = ChatSession(
                    user_id=user_id,
                    title="New Chat",
                    state='initial',
                    status='active'
                )
                db.session.add(retry_session)
                db.session.commit()

                session_tracking[retry_session.id] = {
                    'shown_ids': set(),
                    'conversation_count': 0,
                    'memory': ConversationMemory(retry_session.id),
                    'all_properties': [],
                    'all_builders': [],
                    'last_shown_properties': [],
                    'last_shown_builders': [],
                    'last_result_type': None,
                    'current_page': 0,
                    'properties_offset': 0,
                    'builders_offset': 0
                }

                return jsonify({
                    "session_id": retry_session.id,
                    "message": "Session created successfully"
                })
            except Exception as retry_error:
                db.session.rollback()
                print(f"Session retry after sequence resync failed: {retry_error}")

        return jsonify({"error": "Invalid session payload."}), 400
    except OperationalError as e:
        db.session.rollback()
        print(f"Error creating session (db operational): {e}")
        return jsonify({"error": "Database schema issue. Ensure chat tables are migrated/created."}), 500
    except Exception as e:
        db.session.rollback()
        print(f"Error creating session: {e}")
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/session/<int:session_id>/history', methods=['GET'])
def get_session_history(session_id):
    """Get full chat history for a session"""
    try:
        session = ChatSession.query.get_or_404(session_id)
        
        if not session:
            return jsonify({"error": "Session not found"}), 404
        
        messages = ChatMessage.query.filter_by(session_id=session_id)\
                    .order_by(ChatMessage.created_at.asc()).all()
        
        return jsonify({
            "session_id": session_id,
            "session_info": session.to_dict(),
            "messages": [
                {
                    "id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.created_at.isoformat() if msg.created_at else None
                } for msg in messages
            ]
        })
    except Exception as e:
        print(f"Error in get_session_history: {str(e)}")
        return jsonify({"error": str(e)}), 500
    

@chatbot_bp.route('/session/<int:session_id>/reset', methods=['POST'])
def reset_session(session_id):
    """Clear shown properties tracking for fresh recommendations"""
    try:
        if session_id in session_tracking:
            session_tracking[session_id]['shown_ids'] = set()
            session_tracking[session_id]['all_properties'] = []
            session_tracking[session_id]['all_builders'] = []
            session_tracking[session_id]['last_shown_properties'] = []
            session_tracking[session_id]['last_shown_builders'] = []
            session_tracking[session_id]['last_result_type'] = None
            session_tracking[session_id]['current_page'] = 0
            session_tracking[session_id]['properties_offset'] = 0
            session_tracking[session_id]['builders_offset'] = 0
            return jsonify({"message": "Session tracking reset successfully"})
        return jsonify({"message": "Session not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/session/<int:session_id>/state', methods=['GET'])
def get_session_state(session_id):
    """Get current state of the conversation"""
    try:
        session = ChatSession.query.get_or_404(session_id)
        
        if not session:
            return jsonify({"error": "Session not found"}), 404
        
        tracking_data = session_tracking.get(session_id, {})
        
        return jsonify({
            "session_id": session_id,
            "state": session.state,
            "lead_quality": session.lead_quality,
            "status": session.status,
            "properties_shown": len(tracking_data.get('shown_ids', [])),
            "conversation_count": tracking_data.get('conversation_count', 0),
            "last_state_change": session.last_state_change.isoformat() if session.last_state_change else None
        })
    except Exception as e:
        print(f"Error in get_session_state: {str(e)}")
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/preferences/<user_ref>', methods=['GET'])
def get_user_preferences(user_ref):
    """Get learned preferences for a user"""
    try:
        from models import UserPreference
        user_id = _resolve_local_user_id(user_ref)
        if user_id is None:
            return jsonify({"error": "Valid user reference required"}), 400
        prefs = UserPreference.query.filter_by(user_id=user_id).all()
        return jsonify({
            "user_id": user_id,
            "preferences": {
                p.pref_key: {
                    "value": p.pref_value,
                    "confidence": p.confidence,
                    "updated_at": p.updated_at.isoformat() if p.updated_at else None
                } for p in prefs
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/preferences/<user_ref>', methods=['PUT'])
def update_user_preference(user_ref):
    """Manually update user preferences"""
    try:
        from models import UserPreference
        data = request.get_json(silent=True) or {}
        user_id = _resolve_local_user_id(user_ref)
        if user_id is None:
            return jsonify({"error": "Valid user reference required"}), 400
        
        pref_key = data.get('pref_key')
        pref_value = data.get('pref_value')
        
        if not pref_key or not pref_value:
            return jsonify({"error": "pref_key and pref_value required"}), 400
        
        existing = UserPreference.query.filter_by(user_id=user_id, pref_key=pref_key).first()
        
        if existing:
            existing.pref_value = str(pref_value)
            existing.confidence = data.get('confidence', 1.0)
        else:
            new_pref = UserPreference(
                user_id=user_id,
                pref_key=pref_key,
                pref_value=str(pref_value),
                confidence=data.get('confidence', 1.0)
            )
            db.session.add(new_pref)
        
        db.session.commit()
        return jsonify({"message": "Preference updated successfully"})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ============================================
# FEATURE 5: BEHAVIORAL TRACKING ENDPOINT
# ============================================

@chatbot_bp.route('/track', methods=['POST'])
def track_interaction():
    """Track when user views/clicks a property"""
    try:
        data = request.get_json(silent=True) or {}
        table_columns = _get_table_columns('user_interaction')
        if not table_columns:
            return jsonify({"error": "user_interaction table not found"}), 500

        local_user_id = _resolve_local_user_id(data.get('user_id'))
        guest_id = data.get('guest_id') or request.headers.get('X-Guest-ID') or request.headers.get('x-guest-id')
        property_id = data.get('property_id')
        duration_value = data.get('duration_seconds', data.get('duration'))
        session_value = data.get('session_id')

        if property_id in (None, ""):
            return jsonify({"error": "property_id required"}), 400
        try:
            property_id = int(property_id)
        except (TypeError, ValueError):
            return jsonify({"error": "property_id must be an integer"}), 400

        if not Property.query.get(property_id):
            return jsonify({"error": f"property_id {property_id} does not exist"}), 404

        duration_seconds = None
        if duration_value not in (None, ""):
            try:
                duration_seconds = int(duration_value)
            except (TypeError, ValueError):
                return jsonify({"error": "duration_seconds must be an integer"}), 400

        session_id = None
        if session_value not in (None, ""):
            try:
                session_id = int(session_value)
            except (TypeError, ValueError):
                return jsonify({"error": "session_id must be an integer"}), 400

        if local_user_id is None and session_id is not None:
            session_row = ChatSession.query.get(session_id)
            if session_row and session_row.user_id is not None:
                local_user_id = session_row.user_id

        user_id_column = table_columns.get('user_id')
        guest_id_column = table_columns.get('guest_id')
        if local_user_id is None and user_id_column and not user_id_column.get('nullable', True):
            if guest_id and not guest_id_column:
                return jsonify({
                    "error": "user_interaction in hns.db requires a valid local user_id; guest_id is not available in this schema"
                }), 400
            return jsonify({"error": "user_id required"}), 400

        interaction_payload = {
            'property_id': property_id,
            'action': str(data.get('action') or 'viewed'),
            'duration_seconds': duration_seconds,
            'session_id': session_id,
        }
        if local_user_id is not None:
            interaction_payload['user_id'] = local_user_id
        if guest_id_column and guest_id:
            interaction_payload['guest_id'] = str(guest_id)

        interaction = UserInteraction(**interaction_payload)
        
        db.session.add(interaction)
        db.session.commit()
        
        return jsonify({"message": "Interaction tracked successfully"})
    except Exception as e:
        db.session.rollback()
        print(f"Error tracking interaction: {e}")
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/interactions/<int:user_id>', methods=['GET'])
def get_user_interactions(user_id):
    """Get user's interaction history"""
    try:
        interactions = UserInteraction.query.filter_by(user_id=user_id)\
                        .order_by(UserInteraction.timestamp.desc())\
                        .limit(50).all()
        
        return jsonify({
            "user_id": user_id,
            "interactions": [i.to_dict() for i in interactions]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================
# ANALYTICS & INSIGHTS
# ============================================

@chatbot_bp.route('/analytics/user/<int:user_id>', methods=['GET'])
def get_user_analytics(user_id):
    """Get comprehensive analytics for a user"""
    try:
        from models import UserPreference
        from .rag_service import analyze_user_behavior
        
        # Get preferences
        prefs = UserPreference.query.filter_by(user_id=user_id).all()
        
        # Get behavioral analysis
        behavior = analyze_user_behavior(user_id)
        
        # Get sessions
        sessions = ChatSession.query.filter_by(user_id=user_id).all()
        
        return jsonify({
            "user_id": user_id,
            "explicit_preferences": {
                p.pref_key: p.pref_value for p in prefs
            },
            "behavioral_insights": behavior,
            "session_stats": {
                "total_sessions": len(sessions),
                "active_sessions": len([s for s in sessions if s.status == 'active']),
                "hot_leads": len([s for s in sessions if s.lead_quality == 'hot']),
                "warm_leads": len([s for s in sessions if s.lead_quality == 'warm'])
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/analytics/sessions', methods=['GET'])
def get_all_sessions_analytics():
    """Get analytics across all sessions (admin view)"""
    try:
        from datetime import datetime, timedelta
        
        # Get sessions from last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_sessions = ChatSession.query.filter(
            ChatSession.created_at >= thirty_days_ago
        ).all()
        
        # Calculate stats
        total_sessions = len(recent_sessions)
        active_sessions = len([s for s in recent_sessions if s.status == 'active'])
        
        state_distribution = {}
        for session in recent_sessions:
            state = session.state or 'initial'
            state_distribution[state] = state_distribution.get(state, 0) + 1
        
        lead_quality_distribution = {}
        for session in recent_sessions:
            quality = session.lead_quality or 'unknown'
            lead_quality_distribution[quality] = lead_quality_distribution.get(quality, 0) + 1
        
        return jsonify({
            "period": "last_30_days",
            "total_sessions": total_sessions,
            "active_sessions": active_sessions,
            "state_distribution": state_distribution,
            "lead_quality_distribution": lead_quality_distribution,
            "conversion_metrics": {
                "to_drilling": state_distribution.get('drilling', 0),
                "to_closed": state_distribution.get('closed', 0),
                "conversion_rate": (state_distribution.get('closed', 0) / total_sessions * 100) if total_sessions > 0 else 0
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================
# UTILITY ENDPOINTS
# ============================================

@chatbot_bp.route('/sessions', methods=['GET'])
def get_sessions():
    """Get all sessions for a user"""
    try:
        raw_user_id = request.args.get('user_id')
        user_id = _resolve_local_user_id(raw_user_id)
        if user_id is None:
            return jsonify({"error": "user_id query parameter required"}), 400
        
        sessions = ChatSession.query.filter_by(user_id=user_id).order_by(ChatSession.created_at.desc()).all()
        
        return jsonify({
            "sessions": [s.to_dict() for s in sessions]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chatbot_bp.route('/sessions/list', methods=['GET'])
def list_sessions():
    """List all sessions (with optional user filter)"""
    try:
        raw_user_id = request.args.get('user_id')
        user_id = _resolve_local_user_id(raw_user_id) if raw_user_id not in (None, "") else None
        
        query = ChatSession.query
        if user_id is not None:
            query = query.filter_by(user_id=user_id)
        
        sessions = query.order_by(ChatSession.created_at.desc()).limit(50).all()
        
        return jsonify({
            "sessions": [s.to_dict() for s in sessions]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chatbot_bp.route('/session/<int:session_id>', methods=['GET'])
def get_session(session_id):
    """Get specific session details"""
    try:
        session = ChatSession.query.get(session_id)
        if not session:
            return jsonify({"error": "Session not found"}), 404
        
        return jsonify(session.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chatbot_bp.route('/session/<int:session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a session and all its messages"""
    try:
        session = ChatSession.query.get_or_404(session_id)
        
        # Remove from tracking
        if session_id in session_tracking:
            del session_tracking[session_id]
        
        # Delete from database (cascade will delete messages)
        db.session.delete(session)
        db.session.commit()
        
        return jsonify({"message": "Session deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        from models import Property
        Property.query.first()
        azure_health = get_azure_openai_health()
        status = "healthy" if azure_health["configured"] else "degraded"
        status_code = 200 if azure_health["configured"] else 503
        
        return jsonify({
            "status": status,
            "database": "connected",
            "active_sessions": len(session_tracking),
            "chatbot": azure_health,
        }), status_code
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500
