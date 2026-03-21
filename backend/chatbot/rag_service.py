import os
import json
import re
from datetime import datetime
from enum import Enum
from collections import Counter
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_postgres import PGVector
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.chains import ConversationalRetrievalChain
from models import Property, Blog, BuilderProject, UserPreference, Builder, UserInteraction, ChatSession, db
from flask import current_app
import threading

# --- 1. SETUP ---
load_dotenv()

print("📂 Vector store: PostgreSQL (pgvector)")

# --- 2. EMBEDDINGS SETUP ---
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# --- 3. PGVECTOR STORE SETUP ---
# Requires the 'vector' extension in your Postgres DB:
#   CREATE EXTENSION IF NOT EXISTS vector;
PG_CONNECTION_STRING = os.getenv("DATABASE_URL", "postgresql://localhost/hns_db")
COLLECTION_NAME = "real_estate_unified"

vectorstore = PGVector(
    embeddings=embeddings,
    collection_name=COLLECTION_NAME,
    connection=PG_CONNECTION_STRING,
    use_jsonb=True,
)


# ============================================
# ENHANCED INTENT CLASSIFICATION
# ============================================

class UserIntent(Enum):
    """User intent types"""
    SEARCH_PROPERTIES = "search_properties"
    SEARCH_BUILDERS = "search_builders"
    COMPARE_PROPERTIES = "compare"
    GET_DETAILS = "details"
    ASK_GENERAL = "general"
    FILTER_REFINE = "filter"
    CONTACT_US = "contact"


def classify_intent(user_message):
    """
    Enhanced intent classification for properties vs builders
    Returns: UserIntent enum
    """
    msg_lower = user_message.lower()
    
    # Pattern 1: Contact/Support queries
    contact_keywords = ['contact', 'support', 'help me', 'reach out', 'get in touch', 
                        'phone', 'email', 'call', 'speak to']
    if any(keyword in msg_lower for keyword in contact_keywords):
        return UserIntent.CONTACT_US
    
    # Pattern 2: Builder search (PRIORITY CHECK)
    builder_keywords = ['builder', 'builders', 'developer', 'developers', 
                        'construction company', 'who built', 'building company']
    if any(keyword in msg_lower for keyword in builder_keywords):
        return UserIntent.SEARCH_BUILDERS
    
    # Pattern 3: Property search
    search_keywords = ['show', 'find', 'looking for', 'need', 'want', 'search', 
                       'available', 'options', 'properties', 'property', 'list', 
                       'display', 'apartment', 'flat', 'house', 'bhk']
    if any(keyword in msg_lower for keyword in search_keywords):
        return UserIntent.SEARCH_PROPERTIES
    
    # Pattern 4: Comparison
    compare_keywords = ['compare', 'difference', 'vs', 'versus', 'better', 
                        'which one', 'between']
    if any(keyword in msg_lower for keyword in compare_keywords):
        return UserIntent.COMPARE_PROPERTIES
    
    # Pattern 5: Get specific details
    detail_keywords = ['details', 'tell me more', 'about', 'info', 'specific',
                       'what is', 'explain']
    if any(keyword in msg_lower for keyword in detail_keywords):
        return UserIntent.GET_DETAILS
    
    # Pattern 6: Refine filters (follow-up queries)
    filter_keywords = ['other', 'different', 'else', 'more', 'another',
                       'cheaper', 'expensive', 'bigger', 'smaller']
    if any(keyword in msg_lower for keyword in filter_keywords):
        return UserIntent.FILTER_REFINE
    
    # Default: General query
    return UserIntent.ASK_GENERAL


# ============================================
# SMART FILTERING (Keep existing)
# ============================================

class SmartFilter:
    """Apply business logic to filter and rank properties"""
    
    @staticmethod
    def parse_price(price_str):
        """Convert price string to float in Crores"""
        if not price_str:
            return 0
        
        s = str(price_str).lower().replace(',', '')
        try:
            # Check for Lac/Lakh
            is_lakh = 'lakh' in s or 'lac' in s
            
            import re
            match = re.search(r'(\d+(\.\d+)?)', s)
            if match:
                val = float(match.group(1))
                if is_lakh:
                    return val / 100
                return val
            return 0
        except:
            return 0
    
    @staticmethod
    def filter_by_budget(properties, user_budget, buffer_percent=20):
        """Remove properties significantly above budget"""
        if not user_budget:
            return properties
        
        max_budget = user_budget * (1 + buffer_percent/100)
        filtered = []
        
        for prop in properties:
            prop_price = SmartFilter.parse_price(
                prop.metadata.get('price', '0')
            )
            if prop_price <= max_budget:
                filtered.append(prop)
        
        return filtered
    
    @staticmethod
    def filter_by_bhk(properties, desired_bhk):
        """Filter properties that match BHK configuration"""
        if not desired_bhk:
            return properties
        
        filtered = []
        desired_bhk_str = str(desired_bhk).replace('BHK','').strip()
        
        for prop in properties:
            config_str = prop.metadata.get('configuration', '')
            if desired_bhk_str in str(config_str):
                filtered.append(prop)
        
        return filtered
    
    @staticmethod
    def rank_by_value(properties):
        """Rank properties by value-for-money"""
        return sorted(properties, 
                     key=lambda p: SmartFilter.parse_price(
                         p.metadata.get('price', '999')
                     ))


# ============================================
# STATE MACHINE (Keep existing)
# ============================================

def determine_conversation_state(session_id, user_message, chat_history):
    """Determine current conversation state"""
    session = ChatSession.query.get(session_id) if session_id else None
    if not session:
        return 'initial'
    
    current_state = session.state or 'initial'
    msg_lower = user_message.lower()
    
    if current_state == 'initial':
        if any(word in msg_lower for word in ['show', 'find', 'looking', 'need', 'want']):
            return 'gathering'
    
    elif current_state == 'gathering':
        if any(word in msg_lower for word in ['bhk', 'budget', 'location', 'price']):
            return 'gathering'
        elif len(chat_history) > 1:
            return 'showing'
    
    elif current_state == 'showing':
        if any(word in msg_lower for word in ['tell me more', 'details', 'about', 'specific']):
            return 'drilling'
        elif any(word in msg_lower for word in ['other', 'more', 'else', 'different']):
            return 'showing'
    
    elif current_state == 'drilling':
        if any(word in msg_lower for word in ['visit', 'schedule', 'contact', 'interested', 'book']):
            return 'closed'
    
    return current_state


def update_session_state(session_id, new_state):
    """Update session state in database"""
    if not session_id:
        return
    
    session = ChatSession.query.get(session_id)
    if session:
        session.state = new_state
        session.last_state_change = datetime.utcnow()
        
        if new_state == 'drilling':
            session.lead_quality = 'warm'
        elif new_state == 'closed':
            session.lead_quality = 'hot'
        
        db.session.commit()


# ============================================
# CONVERSATIONAL MEMORY
# ============================================

def sync_extract_params(query):
    """
    Synchronously extract basic search params using regex for immediate use
    Returns: dict with 'location', 'budget', 'bhk'
    """
    params = {}
    q_lower = query.lower()
    
    # 1. Extract BHK
    bhk_match = re.search(r'(\d+(\.\d)?)\s*bhk', q_lower)
    if bhk_match:
        params['bhk'] = bhk_match.group(1)
    
    # 2. Extract Budget
    budget_match = re.search(r'(under|below|max|upto)?\s*(\d+(\.\d)?)\s*(cr|crore|lakh|l|lac|k)', q_lower)
    if budget_match:
        try:
            val = float(budget_match.group(2))
            unit = budget_match.group(4)
            if unit in ['cr', 'crore']:
                params['budget'] = val
            elif unit in ['lakh', 'l', 'lac']:
                params['budget'] = val / 100.0
            elif unit == 'k':
                params['budget'] = val / 100000.0
        except:
            pass
            
    # 3. Extract Location (Naive)
    # Improved: Look for "in [Location]", "at [Location]", "near [Location]"
    
    loc_match = re.search(r'\b(in|at|near)\s+([a-zA-Z]+(\s+[a-zA-Z]+)?)', q_lower)
    if loc_match:
        ignored = ['mumbai', 'india', 'details', 'information', 'comparison', 'search', 'properties', 'builder', 'builders', 'project', 'projects']
        candidate = loc_match.group(2).strip()
        if candidate not in ignored and len(candidate) > 2:
            params['location'] = candidate

    # Fallback: if query includes a known location without "in/at/near"
    if not params.get('location'):
        common_locations = [
            'ghansoli', 'airoli', 'nerul', 'vashi', 'kharghar',
            'kopar khairane', 'belapur', 'panvel', 'seawoods',
            'thane', 'mumbai', 'navi mumbai', 'kalyan', 'dombivli'
        ]
        for loc in common_locations:
            if re.search(rf'\b{re.escape(loc)}\b', q_lower):
                params['location'] = loc
                break
            
    return params


def _normalize_for_match(value):
    if not value:
        return ""
    return re.sub(r'[^a-z0-9\s]+', ' ', str(value).lower()).strip()


def _matches_location(candidate_values, requested_location):
    """
    Strict-ish location match helper:
    - Direct substring match
    - Or all meaningful tokens from requested location are present
    """
    if not requested_location:
        return True

    req = _normalize_for_match(requested_location)
    if not req:
        return True

    req_tokens = [t for t in req.split() if len(t) > 2]
    for value in candidate_values:
        text = _normalize_for_match(value)
        if not text:
            continue
        if req in text:
            return True
        if req_tokens and all(tok in text for tok in req_tokens):
            return True

    return False


class ConversationMemory:
    """Enhanced memory for entity tracking"""
    
    def __init__(self, session_id):
        self.session_id = session_id
        self.entities = {
            'locations': [],
            'budgets': [],
            'bhk_configs': [],
            'builders': [],
            'property_ids': [],
            'property_names': []
        }
    
    def extract_entities_from_message(self, message):
        """Extract key entities from user message"""
        msg_lower = message.lower()
        
        # Extract BHK
        bhk_match = re.search(r'(\d+(\.\d)?)\s*bhk', msg_lower)
        if bhk_match:
            self.entities['bhk_configs'].append(bhk_match.group(1))
            
        # Extract Budget (Same logic as sync_extract_params for consistency)
        budget_match = re.search(r'(under|below|max|upto)?\s*(\d+(\.\d)?)\s*(cr|crore|lakh|l|lac|k)', msg_lower)
        if budget_match:
             try:
                val = float(budget_match.group(2))
                unit = budget_match.group(4)
                if unit in ['cr', 'crore']:
                    self.entities['budgets'].append(val)
                elif unit in ['lakh', 'l', 'lac']:
                    self.entities['budgets'].append(val / 100.0)
             except:
                pass

    def update_from_sync_params(self, params):
        """Update memory immediately from synchronous params"""
        if params.get('location'):
            # Only append if different from last
            if not self.entities['locations'] or self.entities['locations'][-1] != params['location']:
                self.entities['locations'].append(params['location'])
        
        if params.get('budget'):
            self.entities['budgets'].append(params['budget'])
            
        if params.get('bhk'):
             self.entities['bhk_configs'].append(params['bhk'])
             
    def resolve_coreference(self, user_message):
        
        # Extract budget
        budget_patterns = [
            r'(\d+\.?\d*)\s*cr',
            r'(\d+\.?\d*)\s*crore',
            r'(\d+)\s*lakh'
        ]
        for pattern in budget_patterns:
            match = re.search(pattern, msg_lower)
            if match:
                budget = float(match.group(1))
                if 'lakh' in pattern:
                    budget = budget / 100
                self.entities['budgets'].append(budget)
        
        # Extract locations
        common_locations = ['ghansoli', 'airoli', 'nerul', 'vashi', 'kharghar', 
                           'kopar khairane', 'belapur', 'panvel', 'seawoods', 'thane', 'mumbai', 'navi mumbai']
        for loc in common_locations:
            if loc in msg_lower:
                self.entities['locations'].append(loc.title())
    
    def resolve_coreference(self, message):
        """Handle pronouns like 'it', 'that', 'the first one'"""
        msg_lower = message.lower()
        
        if any(word in msg_lower for word in ['it', 'that', 'this']):
            if self.entities['property_ids']:
                return self.entities['property_ids'][-1]
        
        if 'first' in msg_lower:
            if self.entities['property_ids']:
                return self.entities['property_ids'][0]
        
        if 'second' in msg_lower:
            if len(self.entities['property_ids']) > 1:
                return self.entities['property_ids'][1]
        
        return None
    
    def get_current_preferences(self):
        """Get most recent preferences from memory"""
        return {
            'location': self.entities['locations'][-1] if self.entities['locations'] else None,
            'budget': self.entities['budgets'][-1] if self.entities['budgets'] else None,
            'bhk': self.entities['bhk_configs'][-1] if self.entities['bhk_configs'] else None
        }


# ============================================
# BEHAVIORAL LEARNING (Keep existing)
# ============================================

def analyze_user_behavior(user_id):
    """Learn from user's past actions"""
    if not user_id:
        return None
    
    interactions = UserInteraction.query.filter_by(user_id=user_id)\
                    .order_by(UserInteraction.timestamp.desc())\
                    .limit(50).all()
    
    if not interactions:
        return None
    
    viewed_properties = [i.property for i in interactions if i.property]
    
    builders = [p.Builder_Name for p in viewed_properties if p.Builder_Name]
    preferred_builders = Counter(builders).most_common(3)
    
    prices = []
    for p in viewed_properties:
        price = SmartFilter.parse_price(p.Price_Starting_From)
        if price > 0:
            prices.append(price)
    
    if prices:
        avg_price = sum(prices) / len(prices)
        min_price = min(prices)
        max_price = max(prices)
    else:
        avg_price = min_price = max_price = 0
    
    locations = [p.Location for p in viewed_properties if p.Location]
    preferred_locations = Counter(locations).most_common(3)
    
    return {
        'preferred_builders': [b[0] for b in preferred_builders],
        'price_range': {
            'minimum': min_price,
            'maximum': max_price,
            'avg': avg_price
        },
        'preferred_locations': [l[0] for l in preferred_locations]
    }


def enhance_context_with_behavior(user_id, context_blocks):
    """Add behavioral insights to context"""
    if not user_id:
        return context_blocks
    
    behavior = analyze_user_behavior(user_id)
    if behavior and behavior.get('preferred_builders'):
        price_range = behavior.get('price_range', {})
        avg_price = price_range.get('avg', 0)
        min_price = price_range.get('minimum', 0)
        max_price = price_range.get('maximum', 0)
        
        behavior_parts = [
            "LEARNED USER BEHAVIOR (Based on past views):",
            f"- Frequently views: {', '.join(behavior['preferred_builders'][:2])} properties"
        ]
        
        if avg_price > 0:
            behavior_parts.append(f"- Typical budget: Rs {avg_price:.2f} Crore")
        if min_price > 0 and max_price > 0:
            behavior_parts.append(f"- Price range: Rs {min_price:.2f}Cr to Rs {max_price:.2f}Cr")
        
        if behavior.get('preferred_locations'):
            behavior_parts.append(f"- Preferred areas: {', '.join(behavior['preferred_locations'][:2])}")
        
        behavior_text = "\n".join(behavior_parts)
        context_blocks.append(behavior_text)
    
    return context_blocks


# ============================================
# DOCUMENT FACTORY & SYNC (Keep existing)
# ============================================

def create_unified_document(record):
    """Factory to convert SQL objects into Vector Documents"""
    metadata = {}
    content = ""
    unique_id = ""

    if isinstance(record, Property):
        unique_id = f"prop_{record.id}"
        metadata = {
            "id": str(record.id),
            "type": "property",
            "name": record.Property_Name,
            "builder": record.Builder_Name,
            "price": record.Price_Starting_From,
            "location": record.Location,
            "configuration": record.Existing_Configurations,
            "status": record.Project_Status,
            "city": record.Location.split(',')[-1].strip() if record.Location else "Unknown"
        }
        highlights = clean_json_field(record.Highlights)
        amenities = clean_json_field(record.Key_Highlights)
        content = f"""Type: Property Listing
Name: {record.Property_Name}
Builder: {record.Builder_Name}
Location: {record.Location}
Price: {record.Price_Starting_From}
Configuration: {record.Existing_Configurations}
Status: {record.Project_Status}
Possession: {record.Possession_Date}
Amenities: {amenities}
Description: {highlights}"""

    elif isinstance(record, Blog):
        unique_id = f"blog_{record.id}"
        metadata = {"id": str(record.id), "type": "blog", "keywords": record.focus_keywords}
        content = f"""Type: Real Estate Guide / Blog
Title: {record.title}
Summary: {record.intro_paragraph}
Content: {record.content1} {record.content2}"""

    elif isinstance(record, BuilderProject):
        unique_id = f"proj_{record.id}"
        metadata = {
            "id": str(record.id),
            "type": "project",
            "name": record.title,
            "builder": record.builder_name,
            "city": record.city,
            "location": record.location,
            "configuration": record.configuration,
            "price": record.price_range
        }
        amenities = clean_json_field(record.amenities)
        content = f"""Type: New Project Launch
Name: {record.title} by {record.builder_name}
Location: {record.location}, {record.city}
Status: {record.status}
Price Range: {record.price_range}
Configuration: {record.configuration}
Amenities: {amenities}
Description: {record.description}"""

    elif isinstance(record, Builder):
        unique_id = f"builder_{record.rera_id}"
        metadata = {"id": str(record.rera_id), "type": "builder", "city": record.city or "Unknown"}
        content = f"""Type: Builder Profile
Company: {record.company_name} (Brand: {record.brand_name})
Established: {record.established_year}
Headquarters: {record.city}, {record.state}
Description: {record.short_description} {record.detailed_description}"""

    return Document(page_content=content, metadata=metadata), unique_id


def clean_json_field(field_value):
    if not field_value: return "Not Specified"
    try:
        data = json.loads(field_value)
        if isinstance(data, list): return ", ".join([str(x) for x in data])
        return str(data)
    except:
        return str(field_value)


def sync_properties_to_vectordb():
    """Sync database records to the PGVector store (full upsert)."""
    print("--- Starting Unified Smart Sync (PGVector) ---")
    all_records = []
    try:
        all_records.extend(Property.query.all())
        all_records.extend(Blog.query.all())
        all_records.extend(BuilderProject.query.all())
        all_records.extend(Builder.query.all())
    except Exception as e:
        print(f"Error fetching SQL records: {e}")
        return

    if not all_records:
        print("No records to sync.")
        return

    # Build docs + ids for all records
    all_docs = []
    all_ids = []
    for record in all_records:
        doc, unique_id = create_unified_document(record)
        all_docs.append(doc)
        all_ids.append(unique_id)

    print(f"Found {len(all_docs)} total records. Fetching existing IDs from PGVector...")

    # Retrieve IDs that already exist so we skip them
    try:
        # PGVector stores IDs in the embedding_store table; query via SQLAlchemy raw or
        # use the get_by_ids helper if available, otherwise fall back to upsert all.
        existing_ids = set()
        try:
            from sqlalchemy import text
            with db.engine.connect() as conn:
                rows = conn.execute(
                    text("SELECT custom_id FROM langchain_pg_embedding WHERE collection_id = "
                         "(SELECT uuid FROM langchain_pg_collection WHERE name = :name)"),
                    {"name": COLLECTION_NAME}
                ).fetchall()
            existing_ids = {row[0] for row in rows}
        except Exception as exc:
            print(f"  ⚠️  Could not fetch existing IDs ({exc}); will upsert all.")
    except Exception:
        existing_ids = set()

    new_docs = [d for d, uid in zip(all_docs, all_ids) if uid not in existing_ids]
    new_ids  = [uid for uid in all_ids if uid not in existing_ids]

    if not new_docs:
        print("✅ All data is already up to date in PGVector!")
        return

    print(f"Syncing {len(new_docs)} new items to PGVector...")
    BATCH_SIZE = 50
    for i in range(0, len(new_docs), BATCH_SIZE):
        batch_docs = new_docs[i:i + BATCH_SIZE]
        batch_ids  = new_ids[i:i + BATCH_SIZE]
        try:
            vectorstore.add_documents(documents=batch_docs, ids=batch_ids)
            print(f"  Batch {i // BATCH_SIZE + 1} ✅ ({len(batch_docs)} docs)")
        except Exception as e:
            print(f"  Batch {i // BATCH_SIZE + 1} ❌ Error: {e}")
    print("--- PGVector Sync Complete ---")


# ============================================
# AUTO-LEARNING (Keep existing with fix)
# ============================================

def extract_and_save_preferences(user_message, user_id):
    """Extract preferences from message and save to DB (Async wrapper)"""
    if not user_id: 
        return
    
    # Capture the real application object from the proxy
    app = current_app._get_current_object()
    
    def task(app_obj, msg, uid):
        with app_obj.app_context():
            try:
                _extract_preferences_logic(msg, uid)
            except Exception as e:
                print(f"Async pred extraction error: {e}")

    # Run in background thread to avoid blocking response
    thread = threading.Thread(target=task, args=(app, user_message, user_id))
    thread.daemon = True
    thread.start()


def _extract_preferences_logic(user_message, user_id):
    """Actual logic for extracting preferences"""
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash", 
        temperature=0.0,
        google_api_key=os.getenv("GOOGLE_API_KEY")
    )
    prompt = """Analyze the message for Real Estate preferences.
Extract ONLY: location, budget, bhk, possession.
Return valid JSON.
Message: "{message}" """
    
    try:
        response = llm.invoke(prompt.format(message=user_message))
        content = response.content.strip().replace("```json", "").replace("```", "")
        data = json.loads(content)
        if data:
            print(f"🧠 Learned: {data}")
            
            if 'budget' in data and isinstance(data['budget'], dict):
                if 'max' in data['budget']:
                    data['budget'] = data['budget']['max']
                elif 'min' in data['budget']:
                    data['budget'] = data['budget']['min']
                else:
                    data['budget'] = str(data['budget'])
            
            update_user_preferences_db(user_id, data)
    except Exception as e:
        print(f"Auto-learn error: {e}")


def update_user_preferences_db(user_id, prefs):
    """Update user preferences in database"""
    from extensions import db
    try:
        for k, v in prefs.items():
            if not v: continue
            existing = UserPreference.query.filter_by(user_id=user_id, pref_key=k).first()
            if existing: 
                existing.pref_value = str(v)
            else: 
                db.session.add(UserPreference(user_id=user_id, pref_key=k, pref_value=str(v)))
        db.session.commit()
    except Exception as e:
        print(f"Error updating preferences: {e}")
        db.session.rollback()


# ============================================
# HELPERS FOR DETAILED RESPONSES & COMPARISONS
# ============================================

def format_property_details(prop):
    """Return a detailed multi-line description for a Property object."""
    if not prop:
        return "Sorry, I couldn't find details for that property."

    name = getattr(prop, 'Property_Name', 'Unknown')
    builder = getattr(prop, 'Builder_Name', 'Unknown')
    location = getattr(prop, 'Location', 'Unknown')
    price = getattr(prop, 'Price_Starting_From', 'Not specified')
    config = clean_json_field(getattr(prop, 'Existing_Configurations', 'Not specified'))
    status = getattr(prop, 'Project_Status', 'Not specified')
    possession = getattr(prop, 'Possession_Date', 'Not specified')
    highlights = clean_json_field(getattr(prop, 'Highlights', ''))
    amenities = clean_json_field(getattr(prop, 'Key_Highlights', ''))

    parts = [
        f"{name} by {builder}",
        f"Location: {location}",
        f"Price: {price}",
        f"Configuration: {config}",
        f"Status: {status} | Possession: {possession}",
        f"Key Highlights: {highlights}",
        f"Amenities: {amenities}",
        "If you'd like, I can help schedule a visit, provide a comparison, or show similar options."
    ]

    return "\n".join([p for p in parts if p])


def format_builder_details(builder):
    """Return a detailed multi-line description for a Builder object (and a few of their projects)."""
    if not builder:
        return "Sorry, I couldn't find that builder."

    name = getattr(builder, 'company_name', getattr(builder, 'brand_name', 'Unknown'))
    established = getattr(builder, 'established_year', 'Not specified')
    city = getattr(builder, 'city', 'Unknown')
    short = getattr(builder, 'short_description', '')
    detailed = getattr(builder, 'detailed_description', '')

    parts = [
        f"{name} (Established: {established})",
        f"Headquarters: {city}",
        f"Profile: {short} {detailed}".strip()
    ]

    # Grab up to 3 recent projects for this builder
    try:
        recent_projects = BuilderProject.query.filter(BuilderProject.builder_name.ilike(f"%{name}%"))\
                            .order_by(BuilderProject.id.desc()).limit(3).all()
        if recent_projects:
            proj_lines = [f"- {p.title} ({p.location} — {p.price_range})" for p in recent_projects]
            parts.append("Notable projects:\n" + "\n".join(proj_lines))
    except Exception:
        pass

    parts.append("I can fetch project brochures, compare builders, or contact them on your behalf.")
    return "\n".join([p for p in parts if p])


def compare_builders(builders):
    """
    Return a detailed comparison of up to 5 builders.
    """
    if not builders:
        return "I need builders to compare. Could you specify which ones?"

    lines = [f"Here is a detailed comparison of the top {len(builders)} builders matching your criteria:\n"]
    
    for i, b in enumerate(builders, 1):
        name = getattr(b, 'company_name', getattr(b, 'brand_name', 'Unknown'))
        est = getattr(b, 'established_year', 'N/A')
        city = getattr(b, 'city', 'Unknown')
        completed = getattr(b, 'completed_projects', 0)
        ongoing = getattr(b, 'ongoing_projects', 0)
        rera = getattr(b, 'rera_id', 'N/A')
        desc = getattr(b, 'short_description', '') or 'No description available.'
        
        lines.append(f"{i}. {name}")
        lines.append(f"   - 🏢 Established: {est}")
        lines.append(f"   - 📍 Headquarters: {city}")
        lines.append(f"   - 🏗 Projects: {completed} Completed | {ongoing} Ongoing")
        lines.append(f"   - 📜 RERA ID: {rera}")
        lines.append(f"   - 📝 Overview: {desc}")
        lines.append("")

    lines.append("Which of these builders would you like to explore further? I can show their active projects.")
    return "\n".join(lines)


def compare_properties(props):
    """
    Return a detailed comparison of up to 5 properties.
    """
    if not props:
        return "I need properties to compare. Could you specify which ones?"

    lines = [f"Here is a detailed comparison of the top {len(props)} properties matching your criteria:\n"]
    
    for i, p in enumerate(props, 1):
        name = getattr(p, 'Property_Name', 'Unknown')
        builder = getattr(p, 'Builder_Name', 'Unknown')
        loc = getattr(p, 'Location', 'Unknown')
        price = getattr(p, 'Price_Starting_From', 'Ask for Price')
        bhk = clean_json_field(getattr(p, 'Existing_Configurations', 'Not specified'))
        status = getattr(p, 'Project_Status', 'Not specified')
        poss = getattr(p, 'Possession_Date', 'Not specified')
        carpet = getattr(p, 'Carpet_Area', 'Not specified')
        rera = getattr(p, 'RERA_ID', 'Not specified')
        
        # Parse amenities to show top 3
        amenities = clean_json_field(getattr(p, 'Key_Highlights', ''))
        top_amenities = amenities.split(',')[:3] if amenities else ["Not specified"]
        amenities_str = ", ".join(top_amenities) + ("..." if len(top_amenities) < len(amenities.split(',')) else "")

        lines.append(f"{i}. {name} by {builder}")
        lines.append(f"   - 📍 Location: {loc}")
        lines.append(f"   - 💰 Price: {price}")
        lines.append(f"   - 🏠 Config: {bhk}")
        lines.append(f"   - 🏗 Status: {status} (Possession: {poss})")
        lines.append(f"   - 📏 Carpet Area: {carpet}")
        lines.append(f"   - ✨ Highlights: {amenities_str}")
        lines.append(f"   - 📜 RERA: {rera}")
        lines.append("")

    lines.append("Which of these would you like to explore further? I can schedule a visit or provide brochure details.")
    return "\n".join(lines)


# ============================================
# ENHANCED MAIN CHATBOT RESPONSE
# ============================================

def get_chatbot_response(user_query, user_id=None, chat_history=[], session_shown_ids=None, conversation_memory=None, last_intent=None):
    """
    Enhanced chatbot with intent-based responses
    Returns: (response_text, shown_ids, all_properties, all_builders, intent, buffered_responses)
    """
    
    if session_shown_ids is None:
        session_shown_ids = set()
    
    # SYNC UPDATE MEMORY FIRST
    params = sync_extract_params(user_query)
    if conversation_memory:
        conversation_memory.update_from_sync_params(params)
    
    # CLASSIFY INTENT FIRST
    intent = classify_intent(user_query)
    
    # Context Override: If we were comparing and user provided budget/bhk details
    if last_intent == UserIntent.COMPARE_PROPERTIES.value:
         # Check if current query is just filters (BHK/Budget)
         if params.get('budget') or params.get('bhk'):
             intent = UserIntent.COMPARE_PROPERTIES

    print(f"🎯 Detected intent: {intent.value}")
    
    # Handle contact intent immediately
    if intent == UserIntent.CONTACT_US:
        contact_response = """I'd be happy to connect you with our team!

📍 Location: Mumbai, India
📧 Email: hello@housenseek.com
📞 Phone: +91 123-456-7890

Our team is available to assist you with any questions or schedule property visits!"""
        return contact_response, session_shown_ids, [], [], intent.value, []

    # Quick handler: If user asked for DETAILS, try to fetch exact DB record and return a longer answer
    if intent == UserIntent.GET_DETAILS:
        try:
            small_retriever = vectorstore.as_retriever(
                search_type="mmr",
                search_kwargs={"k": 5, "fetch_k": 20, "lambda_mult": 0.7}
            )
            small_docs = []
            try:
                # get_relevant_documents works on LangChain retrievers
                small_docs = small_retriever.get_relevant_documents(user_query)
            except Exception:
                # Fall back to calling retriever via the QA chain if direct method isn't available
                llm_tmp = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2, max_output_tokens=500, google_api_key=os.getenv("GOOGLE_API_KEY"), convert_system_message_to_human=True)
                tmp_retriever = vectorstore.as_retriever(search_type="mmr", search_kwargs={"k": 8, "fetch_k": 40, "lambda_mult": 0.7})
                tmp_chain = ConversationalRetrievalChain.from_llm(llm=llm_tmp, retriever=tmp_retriever, condense_question_prompt=PromptTemplate.from_template("Q:{question}\nStandalone:"), combine_docs_chain_kwargs={"prompt": PromptTemplate.from_template("Context: {context}\nQuestion: {question}\n" )}, return_source_documents=True)
                tmp_res = tmp_chain.invoke({"question": user_query, "chat_history": chat_history})
                small_docs = tmp_res.get('source_documents', [])

            # Prefer property/project docs for details
            for doc in small_docs:
                t = doc.metadata.get('type')
                if t in ['property', 'project']:
                    pid = doc.metadata.get('id')
                    if pid:
                        prop = Property.query.get(int(pid))
                        if prop:
                            detailed = format_property_details(prop)
                            session_shown_ids.add(str(prop.id))
                            if user_id:
                                extract_and_save_preferences(user_query, user_id)
                            return detailed, session_shown_ids, [prop], [], intent.value, []
                elif t == 'builder':
                    bid = doc.metadata.get('id')
                    if bid:
                        try:
                            builder = Builder.query.get(bid)
                        except Exception:
                            builder = None
                        if builder:
                            detailed = format_builder_details(builder)
                            session_shown_ids.add(str(bid))
                            if user_id:
                                extract_and_save_preferences(user_query, user_id)
                            return detailed, session_shown_ids, [], [builder], intent.value, []

            # If we didn't find a direct DB item, ask the LLM for a detailed answer using retrieved context
            try:
                small_ctx = "\n\n---\n\n".join([d.page_content for d in small_docs[:6]])
                llm_detailed = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2, max_output_tokens=800, google_api_key=os.getenv("GOOGLE_API_KEY"), convert_system_message_to_human=True)
                detailed_prompt = f"You are an expert real estate assistant. Using ONLY the context provided, answer the question in a detailed, factual manner (5-8 sentences). Do not invent facts.\n\nContext:\n{small_ctx}\n\nQuestion: {user_query}\n\nDetailed answer:"
                res = llm_detailed.invoke(detailed_prompt)
                answer = getattr(res, 'content', '')
                if answer:
                    if user_id:
                        extract_and_save_preferences(user_query, user_id)
                    return answer.strip(), session_shown_ids, [], [], intent.value, []
            except Exception:
                pass
        except Exception as e:
            print(f"GET_DETAILS handling error: {e}")

    # Enhanced Comparison Handler
    if intent == UserIntent.COMPARE_PROPERTIES:
        try:
            # Detect if user wants to compare BUILDERS
            is_builder_compare = any(k in user_query.lower() for k in ['builder', 'developer', 'construction'])
            
            if is_builder_compare:
                # 1. Try to fetch specific builders first
                comp_retriever = vectorstore.as_retriever(search_type="mmr", search_kwargs={"k": 5, "fetch_k": 20})
                try:
                    comp_docs = comp_retriever.get_relevant_documents(user_query)
                except Exception:
                    comp_docs = []
                
                specific_builders = []
                for d in comp_docs:
                    if d.metadata.get('type') == 'builder':
                        bid = d.metadata.get('id')
                        if bid:
                            b = Builder.query.get(bid)
                            if b and b.rera_id not in [sb.rera_id for sb in specific_builders]:
                                specific_builders.append(b)
                
                if len(specific_builders) >= 2:
                    comparison = compare_builders(specific_builders)
                    for b in specific_builders:
                        session_shown_ids.add(str(b.rera_id))
                    return comparison, session_shown_ids, [], specific_builders, intent.value, []

                # 2. General / City-Based Builder Comparison
                prefs = conversation_memory.get_current_preferences() if conversation_memory else {}
                city_pref = prefs.get('location')  # Utilizing location as city for builders
                
                if not city_pref:
                    return "Which city's builders would you like to compare? (e.g. 'Compare builders in Mumbai')", session_shown_ids, [], [], intent.value, []

                # Search builders in DB
                candidates = Builder.query.filter(
                    (Builder.city.ilike(f'%{city_pref}%')) | 
                    (Builder.location.ilike(f'%{city_pref}%'))
                ).all()
                
                # Sort by reputation (completed projects desc)
                candidates.sort(key=lambda x: (x.completed_projects or 0), reverse=True)
                top_5 = candidates[:5]
                
                if top_5:
                    comparison = compare_builders(top_5)
                    for b in top_5:
                        session_shown_ids.add(str(b.rera_id))
                    if user_id: extract_and_save_preferences(user_query, user_id)
                    return comparison, session_shown_ids, [], top_5, intent.value, []
                else:
                     return f"I couldn't find any top builders in {city_pref}. Would you like to search in another city?", session_shown_ids, [], [], intent.value, []

            # PROPERTY COMPARISON LOGIC (Default)
            
            # 1. specific properties check...
            comp_retriever = vectorstore.as_retriever(search_type="mmr", search_kwargs={"k": 5, "fetch_k": 20})
            try:
                comp_docs = comp_retriever.get_relevant_documents(user_query)
            except Exception:
                comp_docs = []

            specific_props = []
            for d in comp_docs:
                if d.metadata.get('type') == 'property':
                    p_name = d.metadata.get('name', '').lower()
                    # Naively check if property name is part of the query
                    if p_name and p_name in user_query.lower():
                        pid = d.metadata.get('id')
                        if pid:
                            p = Property.query.get(int(pid))
                            if p and p.id not in [x.id for x in specific_props]:
                                specific_props.append(p)

            if len(specific_props) >= 2:
                comparison = compare_properties(specific_props)
                for p in specific_props:
                    session_shown_ids.add(str(p.id))
                return comparison, session_shown_ids, specific_props, [], intent.value, []

            # 2. General / Location-Based Comparison
            params = sync_extract_params(user_query)
            
            # Merge with memory
            mem_prefs = conversation_memory.get_current_preferences() if conversation_memory else {}
            
            loc = params.get('location') or mem_prefs.get('location')
            budget = params.get('budget') or mem_prefs.get('budget')
            bhk = params.get('bhk') or mem_prefs.get('bhk')

            # Force follow-up if ANY key preference is missing (Location is mandatory, plus budget OR bhk)
            if not loc:
                 return "To compare the best properties, I need to know the Location. Which area are you interested in?", session_shown_ids, [], [], intent.value, []

            if not budget and not bhk:
                 return f"I can find properties in {loc}, but to give you a meaningful comparison, could you tell me your Budget range or preferred BHK?", session_shown_ids, [], [], intent.value, []
            
            # Search DB with filters
            candidates = Property.query.filter(Property.Location.ilike(f'%{loc}%')).all()
            
            filtered = []
            for p in candidates:
                # Budget filter (Heavy check: Only show if strictly within or close to budget)
                if budget:
                    p_price = SmartFilter.parse_price(p.Price_Starting_From)
                    if p_price > float(budget) * 1.25: # 25% buffer
                         continue
                
                # BHK filter (Strict check)
                if bhk:
                    target = str(bhk).strip()
                    if target not in str(p.Existing_Configurations):
                        continue
                
                filtered.append(p)
            
            # Sort by price ascending
            filtered.sort(key=lambda x: SmartFilter.parse_price(x.Price_Starting_From))
            
            top_5 = filtered[:5]
            
            if top_5:
                comparison = compare_properties(top_5)
                for p in top_5:
                    session_shown_ids.add(str(p.id))
                
                if user_id: extract_and_save_preferences(user_query, user_id)
                # FORCE RETURN text here to bypass LLM
                return comparison, session_shown_ids, top_5, [], intent.value, []
            else:
                return f"I found properties in {loc}, but none matched your exact Budget/BHK criteria. Would you like to throw a wider net?", session_shown_ids, [], [], intent.value, []

        except Exception as e:
            print(f"COMPARE handler error: {e}")

    # Adjust retrieval based on intent
    if intent == UserIntent.SEARCH_BUILDERS:
        search_k = 25
        fetch_k = 50
        filter_type = "builder"
    elif intent == UserIntent.SEARCH_PROPERTIES:
        search_k = 25
        fetch_k = 50
        filter_type = "property"
        
        # EXPERIMENTAL: If search properties AND we have location/criteria, try DB fetch and detailed text response
        # This handles user request for "text response with details" even for search
        try:
             # Use current params OR memory
             mem_prefs = conversation_memory.get_current_preferences() if conversation_memory else {}
             loc = params.get('location') or mem_prefs.get('location')
             bhk = params.get('bhk') or mem_prefs.get('bhk')
             budget = params.get('budget') or mem_prefs.get('budget')
             
             # If we have ANY specific filter (Loc, BHK, Budget), try to do a detailed search
             if loc or bhk or budget:
                 # Start query
                 query = Property.query
                 if loc:
                     query = query.filter(Property.Location.ilike(f'%{loc}%'))
                     
                 candidates = query.all()
                 
                 # Apply filters
                 filtered = []
                 for p in candidates:
                    if budget:
                        p_price = SmartFilter.parse_price(p.Price_Starting_From)
                        if p_price > float(budget) * 1.25: 
                             continue
                    if bhk:
                        target = str(bhk).strip()
                        if target not in str(p.Existing_Configurations):
                            continue
                    filtered.append(p)
                 
                 candidates = filtered[:6] # Top 6
                 
                 if candidates:
                     # Create detailed list using comparison format
                     detailed_list = compare_properties(candidates)
                     for p in candidates:
                         session_shown_ids.add(str(p.id))
                     
                     if user_id: extract_and_save_preferences(user_query, user_id)
                     return detailed_list, session_shown_ids, candidates, [], intent.value, []
        except Exception as e:
             print(f"Search fallback error: {e}")

    elif intent == UserIntent.COMPARE_PROPERTIES:
        # Fallback if DB logic fails
        search_k = 10
        fetch_k = 30
        filter_type = None
    else:
        search_k = 20
        fetch_k = 40
        filter_type = None
    
    # --- BUILD CONTEXT STRING ---
    context_blocks = []
    
    user_budget = None
    user_bhk = None
    user_location = None
    
    if user_id:
        prefs = UserPreference.query.filter_by(user_id=user_id).all()
        if prefs:
            p_text = ", ".join([f"{p.pref_key}: {p.pref_value}" for p in prefs])
            context_blocks.append(f"KNOWN USER PREFERENCES: {p_text}")
            
            for p in prefs:
                if p.pref_key == 'budget':
                    try:
                        budget_val = p.pref_value
                        if isinstance(budget_val, str):
                            try:
                                parsed = json.loads(budget_val)
                                if isinstance(parsed, dict):
                                    user_budget = float(parsed.get('maximum', parsed.get('max', parsed.get('minimum', parsed.get('min', 0)))))
                                else:
                                    user_budget = float(budget_val)
                            except:
                                import re
                                numbers = re.findall(r'\d+\.?\d*', budget_val)
                                if numbers:
                                    user_budget = float(numbers[0])
                        else:
                            user_budget = float(budget_val)
                    except Exception as e:
                        print(f"Error parsing budget: {e}")
                elif p.pref_key == 'bhk':
                    user_bhk = p.pref_value
                elif p.pref_key == 'location':
                    user_location = p.pref_value

    if conversation_memory:
        current_prefs = conversation_memory.get_current_preferences()
        if current_prefs['budget'] and not user_budget:
            user_budget = current_prefs['budget']
        if current_prefs['bhk'] and not user_bhk:
            user_bhk = current_prefs['bhk']
        if current_prefs['location'] and not user_location:
            user_location = current_prefs['location']

    # Current query location should override older memory/preferences
    query_location = params.get('location') or user_location

    if chat_history:
        history_text = "\n".join([f"User: {h[0]}\nAI: {h[1]}" for h in chat_history[-5:]])
        context_blocks.append(f"RECENT CONVERSATION:\n{history_text}")
    
    if session_shown_ids:
        context_blocks.append(f"ALREADY SHOWN PROPERTY IDs: {list(session_shown_ids)}")
    
    context_blocks = enhance_context_with_behavior(user_id, context_blocks)

    full_system_context = "\n\n".join(context_blocks)
    full_system_context = full_system_context.replace('{', '{{').replace('}', '}}')

    # INTENT-SPECIFIC PROMPTS
    condense_template = """Given the chat history and follow-up question, rephrase it to be a standalone search query.

Chat History: {chat_history}
Follow Up: {question}
Standalone Question:"""
    CONDENSE_PROMPT = PromptTemplate.from_template(condense_template)

    if intent == UserIntent.SEARCH_BUILDERS:
        answer_template = """You are a helpful Real Estate Assistant.

The user is asking about BUILDERS/DEVELOPERS.

CRITICAL INSTRUCTIONS:
1. Keep response to 2-3 lines maximum
2. NO markdown formatting
3. Builder cards will be shown separately
4. Just say something like "Here are the top builders" or "I found these developers for you"
5. Do NOT list builder names - they appear as cards

Context: {context}
Question: {question}

Brief response (2-3 lines, no formatting):"""
    
    elif intent == UserIntent.SEARCH_PROPERTIES:
        answer_template = """You are a helpful Real Estate Assistant.

The user is asking about PROPERTIES.

CRITICAL INSTRUCTIONS:
1. Keep response CONCISE but informative (4-5 lines).
2. NO markdown formatting.
3. Property cards will be shown separately.
4. Mention key highlights (e.g., "I found stunning options in Thane starting at 1.5Cr").
5. Do NOT list property names in a list - they appear as cards.

Context: {context}
Question: {question}

Response (4-5 lines, no formatting):"""

    elif intent == UserIntent.COMPARE_PROPERTIES:
        answer_template = """You are a helpful Real Estate Assistant.

The user wants a COMPARISON of properties or builders.

CRITICAL INSTRUCTIONS:
1. Provide a DETAILED comparison based on the context.
2. You can use multiple paragraphs.
3. Compare features like Price, Location, Amenities, Status.
4. Do not hold back on text length. give a full response.

Context: {context}
Question: {question}

Detailed Comparison:"""
    
    else:
        answer_template = """You are a helpful Real Estate Assistant.

CRITICAL INSTRUCTIONS:
1. Provide a helpful, conversational response (4-6 lines).
2. You can explain things clearly, do not be too brief.
3. NO markdown formatting.
4. Cards will be shown separately if applicable.

Context: {context}
Question: {question}

Response (4-6 lines, no formatting):"""

    ANSWER_PROMPT = PromptTemplate(template=answer_template, input_variables=["context", "question"])

    # --- SETUP LLM ---
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.4,
        max_output_tokens=700,
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        convert_system_message_to_human=True
    )
    
    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": search_k,
            "fetch_k": fetch_k,
            "lambda_mult": 0.7
        }
    )

    qa_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        condense_question_prompt=CONDENSE_PROMPT,
        combine_docs_chain_kwargs={"prompt": ANSWER_PROMPT},
        return_source_documents=True
    )

    # --- EXECUTE ---
    result = qa_chain.invoke({"question": user_query, "chat_history": chat_history})
    ai_answer = result['answer']
    
    ai_answer = ai_answer.replace('**', '').replace('*', '').replace('#', '')
    
    source_docs = result.get('source_documents', [])
    
    # Apply smart filters
    if user_budget:
        source_docs = SmartFilter.filter_by_budget(source_docs, user_budget)
    if user_bhk:
        source_docs = SmartFilter.filter_by_bhk(source_docs, user_bhk)
    
    source_docs = SmartFilter.rank_by_value(source_docs)
    
    # FILTER BY INTENT
    property_docs = []
    builder_docs = []
    
    for doc in source_docs:
        doc_type = doc.metadata.get('type')
        if filter_type == "builder" and doc_type == "builder":
            builder_docs.append(doc)
        elif filter_type == "property" and doc_type in ['property', 'project']:
            property_docs.append(doc)
        elif filter_type is None:
            if doc_type in ['property', 'project']:
                property_docs.append(doc)
            elif doc_type == 'builder':
                builder_docs.append(doc)
    
    # Fetch objects - GET UP TO 20 for pagination
    # IMPORTANT: Fetch ALL matching results first, then handle shown tracking
    all_properties = []
    all_builders = []
    
    print(f"📦 Processing {len(property_docs)} property docs, {len(builder_docs)} builder docs")
    
    # Fetch up to 20 properties (regardless of shown status)
    # We'll track shown IDs separately for the FIRST 10
    property_count = 0
    for doc in property_docs[:50]:  # Check more docs to get 20 valid properties
        if property_count >= 20:  # Limit to 20 total
            break
        prop_id = doc.metadata.get('id')
        if prop_id:
            prop = Property.query.get(int(prop_id))
            if prop:
                all_properties.append(prop)
                property_count += 1
    
    # Fetch up to 20 builders
    builder_count = 0
    for doc in builder_docs[:50]:
        if builder_count >= 20:
            break
        builder_id = doc.metadata.get('id')
        if builder_id:
            builder = Builder.query.get(builder_id)
            if builder:
                all_builders.append(builder)
                builder_count += 1
    
    # Mark the FIRST 10 as shown (these will be displayed immediately)
    for prop in all_properties[:10]:
        session_shown_ids.add(str(prop.id))
    for b in all_builders[:10]:
        # Builders use rera_id as primary key
        rid = getattr(b, 'rera_id', None)
        if rid:
            session_shown_ids.add(str(rid))
    
    # Hard-filter final card results by requested location so cards match user query intent.
    if query_location:
        all_properties = [
            p for p in all_properties
            if _matches_location([p.Location, p.Address], query_location)
        ]
        all_builders = [
            b for b in all_builders
            if _matches_location([b.city, b.location, b.corporate_address], query_location)
        ]

        # Keep text response aligned with card payload when user asked location-specific results.
        if intent == UserIntent.SEARCH_PROPERTIES:
            if all_properties:
                ai_answer = (
                    f"I found {len(all_properties)} property option(s) in {query_location.title()}. "
                    "Sharing the most relevant matching cards below."
                )
            else:
                ai_answer = (
                    f"I couldn't find matching properties in {query_location.title()} for this query. "
                    "Try nearby areas or relax your budget/BHK filters."
                )
        elif intent == UserIntent.SEARCH_BUILDERS:
            if all_builders:
                ai_answer = (
                    f"I found {len(all_builders)} builder option(s) in {query_location.title()}. "
                    "Sharing the best matching builder cards below."
                )
            else:
                ai_answer = (
                    f"I couldn't find matching builders in {query_location.title()} for this query. "
                    "Try nearby locations or a broader builder search."
                )

    print(f"✅ Retrieved {len(all_properties)} properties, {len(all_builders)} builders")
    print(f"📊 Will show 10 initially, {max(0, len(all_properties) - 10)} available for 'load more'")
    
    # Auto-learn
    if user_id:
        extract_and_save_preferences(user_query, user_id)
    
    # GENERATE BUFFERED RESPONSES
    buffered_responses = generate_buffered_responses(all_properties, all_builders, intent.value)
    
    return ai_answer, session_shown_ids, all_properties, all_builders, intent.value, buffered_responses


def generate_buffered_responses(current_properties, current_builders, current_intent):
    """
    Generate follow-up suggestions and their pre-calculated responses.
    This creates 'buffer memory' for the next likely interactions.
    """
    suggestions = []
    
    # 1. Logic for Properties
    if current_properties:
        # Analyze BHK distributions
        bhk_counts = {}
        # Count BHKs
        for p in current_properties:
            configs = str(p.Existing_Configurations).replace("'", "").replace('"', "")
            import re
            matches = re.findall(r'(\d)\s*BHK', configs, re.IGNORECASE)
            for m in matches:
                if m not in bhk_counts: bhk_counts[m] = 0
                bhk_counts[m] += 1
        
        # Suggest top 2 BHK types
        sorted_bhks = sorted(bhk_counts.items(), key=lambda x: x[1], reverse=True)
        
        for bhk, count in sorted_bhks[:2]:
            # Suggest only if this filter refines the list (counts < total)
            # OR if we have many properties and this splits them
            if count < len(current_properties) or (len(current_properties) > 3 and count > 1):
                label = f"Show {bhk} BHK homes"
                
                # Create the filtered response
                filtered = []
                for p in current_properties:
                    if f"{bhk} BHK" in str(p.Existing_Configurations).replace("'", "").replace('"', ""):
                        filtered.append(p)
                
                if filtered:
                    suggestions.append({
                        "label": label,
                        "type": "property_filter",
                        "payload": {
                            "response": f"Here are the {bhk} BHK properties I found for you.",
                            "properties": [p for p in filtered], # Passed as objects, routes.py converts
                            "builders": [],
                            "last_intent": "filter_refine",
                            "stats": {"properties_shown": len(filtered)}
                        }
                    })

        # Suggest Price Filter (e.g. Under Average)
        prices = []
        for p in current_properties:
             val = SmartFilter.parse_price(str(p.Price_Starting_From))
             if val > 0: prices.append(val)
        
        if prices and len(prices) > 2:
            avg_price = sum(prices) / len(prices)
            # Find a nice round number close to average (e.g. 1.5Cr, 2.0Cr)
            
            # Suggest "Under [Avg]" if there are properties under avg
            under_avg = [p for p in current_properties if SmartFilter.parse_price(str(p.Price_Starting_From)) <= avg_price]
            
            if under_avg and len(under_avg) < len(current_properties):
                # Format price nice (e.g. 1.5 Cr instead of 1.54332)
                limit_disp = round(avg_price * 10) / 10
                label = f"Show under {limit_disp} Cr"
                
                suggestions.append({
                    "label": label,
                    "type": "property_filter",
                    "payload": {
                        "response": f"Here are the properties under {limit_disp} Cr.",
                        "properties": [p for p in under_avg],
                        "builders": [],
                        "last_intent": "filter_refine",
                         "stats": {"properties_shown": len(under_avg)}
                    }
                })

    # 2. Logic for Builders
    if current_builders:
         # Suggest comparing top 2 if available
         if len(current_builders) >= 2:
             top_2 = current_builders[:2]
             names = [getattr(b, 'company_name', 'Builder') for b in top_2]
             label = f"Compare {names[0]} vs {names[1]}"
             
             comparison_text = compare_builders(top_2)
             
             suggestions.append({
                 "label": label,
                 "type": "builder_compare",
                 "payload": {
                     "response": comparison_text,
                     "properties": [],
                     "builders": [b for b in top_2],
                     "last_intent": "compare",
                      "stats": {"builders_shown": len(top_2)}
                 }
             })

    # 3. ALWAYS ADD GENERAL FALLBACKS (Buffered with real data to avoid API calls)
    # Fetch 20 to support "Show More" without API calls
    top_props = Property.query.limit(20).all()
    top_builders = Builder.query.limit(20).all()

    suggestions.append({
        "label": "Search properties",
        "type": "buffered_response",
        "payload": {
            "response": "I'd be happy to help you find a property! Here are some of our top-featured listings to get you started. To narrow down the search, could you tell me which Location or BHK you are interested in?",
            "properties": [p for p in top_props[:10]],
            "all_properties": [p for p in top_props], # Buffer for local "Show More"
            "builders": [],
            "last_intent": "search_properties",
            "has_more": len(top_props) > 10,
            "total_results": {"properties": len(top_props), "builders": 0}
        }
    })
    
    suggestions.append({
        "label": "Find builders",
        "type": "buffered_response",
        "payload": {
            "response": "I can definitely help you find the right developer! Here are some of the most reputable builders currently active. Do you have a specific builder name in mind?",
            "properties": [],
            "builders": [b for b in top_builders[:10]],
            "all_builders": [b for b in top_builders], # Buffer for local "Show More"
            "last_intent": "search_builders",
            "has_more": len(top_builders) > 10,
            "total_results": {"properties": 0, "builders": len(top_builders)}
        }
    })

    return suggestions[:5]



# ============================================
# SQL FALLBACK (EXISTING)
# ============================================

def get_direct_sql_results(location=None, bhk=None, max_results=10):
    """
    Direct SQL query fallback if vector search fails.
    Returns formatted property list.
    """
    query = Property.query
    
    if location:
        query = query.filter(Property.Location.ilike(f"%{location}%"))
    
    if bhk:
        query = query.filter(Property.Existing_Configurations.ilike(f"%{bhk}%"))
    
    results = query.limit(max_results).all()
    
    if not results:
        return null
    
    formatted = f"Found {len(results)} properties:\n\n"
    for i, prop in enumerate(results, 1):
        formatted += f"{i}. {prop.Property_Name} by {prop.Builder_Name}\n"
        formatted += f"   📍 Location: {prop.Location}\n"
        formatted += f"   💰 Price: {prop.Price_Starting_From}\n"
        formatted += f"   🏠 Config: {clean_json_field(prop.Existing_Configurations)}\n"
        formatted += f"   📅 Status: {prop.Project_Status}\n\n"
    
    return formatted
