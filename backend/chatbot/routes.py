from flask import Blueprint, request, jsonify
from models import ChatSession, ChatMessage, UserInteraction, Property
from extensions import db 
from .rag_service import (
    get_chatbot_response, 
    sync_properties_to_vectordb, 
    get_direct_sql_results,
    determine_conversation_state,
    update_session_state,
    ConversationMemory
)

chatbot_bp = Blueprint('chatbot', __name__)

# Session-level tracking (in-memory)
# For production, consider Redis or database storage
session_tracking = {}


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
def ask_bot():
    """
    Main chatbot endpoint with all 7 advanced features:
    1. Intent classification ✅
    2. Smart filtering ✅
    3. State machine ✅
    4. Rich formatting ✅
    5. Behavioral learning ✅
    6. Conversational context retention ✅
    7. Proactive suggestions ✅
    """
    data = request.json
    user_message = data.get('message')
    user_id = data.get('user_id') 
    session_id = data.get('session_id')

    if not user_message:
        return jsonify({"error": "Message required"}), 400

    # --- Initialize session tracking ---
    if session_id and session_id not in session_tracking:
        session_tracking[session_id] = {
            'shown_ids': set(),
            'conversation_count': 0,
            'memory': ConversationMemory(session_id)  # FEATURE 6: Memory
        }
    
    session_data = session_tracking.get(session_id, {
        'shown_ids': set(),
        'conversation_count': 0,
        'memory': ConversationMemory(session_id) if session_id else None
    })
    
    session_data['conversation_count'] += 1
    
    # FEATURE 6: Extract entities from current message
    if session_data.get('memory'):
        memory = session_data['memory']
        memory.extract_entities_from_message(user_message)
        
        # Check for coreferences
        resolved_property_id = memory.resolve_coreference(user_message)
        if resolved_property_id:
            print(f"🔗 Resolved reference to property: {resolved_property_id}")
        
        # Get current preferences from memory
        current_prefs = memory.get_current_preferences()
        print(f"💭 Memory preferences: {current_prefs}")

    # --- Prepare Chat History ---
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

    # FEATURE 3: Determine conversation state
    if session_id:
        new_state = determine_conversation_state(session_id, user_message, chat_history)
        update_session_state(session_id, new_state)
        print(f"📊 Session state: {new_state}")

    # --- Call RAG Service ---
    try:
        ai_response, updated_shown_ids = get_chatbot_response(
            user_message, 
            user_id, 
            chat_history,
            session_shown_ids=session_data['shown_ids'],
            conversation_memory=session_data.get('memory')
        )
        
        # Update tracked IDs
        session_data['shown_ids'] = updated_shown_ids
        
        # --- SQL Fallback if response seems incomplete ---
        if ("I found only one property" in ai_response or 
            "only 1 option" in ai_response.lower() or
            "couldn't find" in ai_response.lower()) and \
           ("all" in user_message.lower() or "other" in user_message.lower() or "more" in user_message.lower()):
            
            print("⚠️ Triggering SQL fallback for more results")
            
            # Extract location/BHK from preferences or message
            location = None
            bhk = None
            
            # Try to get from user preferences
            if user_id:
                from models import UserPreference
                loc_pref = UserPreference.query.filter_by(user_id=user_id, pref_key='location').first()
                bhk_pref = UserPreference.query.filter_by(user_id=user_id, pref_key='bhk').first()
                if loc_pref: 
                    location = loc_pref.pref_value
                if bhk_pref: 
                    bhk = bhk_pref.pref_value
            
            # Extract from current message if not in preferences
            if not location:
                import re
                # Simple location extraction
                words = user_message.lower().split()
                for i, word in enumerate(words):
                    if word in ['in', 'at', 'near'] and i + 1 < len(words):
                        location = words[i + 1].strip('?,.')
                        break
            
            if not bhk:
                import re
                bhk_match = re.search(r'(\d+)\s*bhk', user_message.lower())
                if bhk_match:
                    bhk = bhk_match.group(1)
            
            # Get SQL results
            sql_results = get_direct_sql_results(location=location, bhk=bhk, max_results=10)
            
            if sql_results and "No properties found" not in sql_results:
                ai_response = f"{ai_response}\n\n**📋 Additional options from our database:**\n\n{sql_results}"
        
        # --- Save to DB ---
        if session_id:
            user_msg_entry = ChatMessage(
                session_id=session_id, 
                role='user', 
                content=user_message
            )
            ai_msg_entry = ChatMessage(
                session_id=session_id, 
                role='assistant', 
                content=ai_response
            )
            
            db.session.add(user_msg_entry)
            db.session.add(ai_msg_entry)
            db.session.commit()

        return jsonify({
            "response": ai_response,
            "stats": {
                "properties_shown": len(session_data['shown_ids']),
                "conversation_count": session_data['conversation_count']
            }
        })
    
    except Exception as e:
        db.session.rollback()
        print(f"Chat Error: {e}")
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": "Something went wrong processing your request"}), 500


@chatbot_bp.route('/session/new', methods=['POST'])
def create_session():
    """Create a new chat session"""
    try:
        data = request.json
        user_id = data.get('user_id')
        
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
            'memory': ConversationMemory(new_session.id)
        }
        
        return jsonify({
            "session_id": new_session.id,
            "message": "Session created successfully"
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error creating session: {e}")
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/session/<int:session_id>/history', methods=['GET'])
def get_session_history(session_id):
    """Get full chat history for a session"""
    try:
        session = ChatSession.query.get_or_404(session_id)
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
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/session/<int:session_id>/reset', methods=['POST'])
def reset_session(session_id):
    """Clear shown properties tracking for fresh recommendations"""
    try:
        if session_id in session_tracking:
            session_tracking[session_id]['shown_ids'] = set()
            return jsonify({"message": "Session tracking reset successfully"})
        return jsonify({"message": "Session not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/session/<int:session_id>/state', methods=['GET'])
def get_session_state(session_id):
    """Get current state of the conversation"""
    try:
        session = ChatSession.query.get_or_404(session_id)
        
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
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/preferences/<int:user_id>', methods=['GET'])
def get_user_preferences(user_id):
    """Get learned preferences for a user"""
    try:
        from models import UserPreference
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


@chatbot_bp.route('/preferences/<int:user_id>', methods=['PUT'])
def update_user_preference(user_id):
    """Manually update user preferences"""
    try:
        from models import UserPreference
        data = request.json
        
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
    """
    Track when user views/clicks a property
    FEATURE 5: Behavioral Learning
    """
    try:
        data = request.json
        
        interaction = UserInteraction(
            user_id=data.get('user_id'),
            property_id=data.get('property_id'),
            action=data.get('action', 'viewed'),
            duration_seconds=data.get('duration'),
            session_id=data.get('session_id')
        )
        
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

@chatbot_bp.route('/sessions/list', methods=['GET'])
def list_sessions():
    """List all sessions (with optional user filter)"""
    try:
        user_id = request.args.get('user_id', type=int)
        
        query = ChatSession.query
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        sessions = query.order_by(ChatSession.created_at.desc()).limit(50).all()
        
        return jsonify({
            "sessions": [s.to_dict() for s in sessions]
        })
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
        
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "active_sessions": len(session_tracking)
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500
