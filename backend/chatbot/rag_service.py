import os
import json
import re
from datetime import datetime
from enum import Enum
from collections import Counter
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.chains import ConversationalRetrievalChain
from models import Property, Blog, BuilderProject, UserPreference, Builder, UserInteraction, ChatSession, db

# --- 1. SETUP PATHS ---
load_dotenv()
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
VECTOR_DB_PATH = os.path.join(BACKEND_DIR, "chroma_db")

print(f"📂 Vector DB Path set to: {VECTOR_DB_PATH}")


# --- 3. EMBEDDINGS SETUP ---
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

vectorstore = Chroma(
    persist_directory=VECTOR_DB_PATH,
    embedding_function=embeddings,
    collection_name="real_estate_unified"
)


# ============================================
# ADVANCED FEATURE 1: INTENT CLASSIFICATION
# ============================================

class UserIntent(Enum):
    """User intent types"""
    SEARCH_PROPERTIES = "search"
    COMPARE_PROPERTIES = "compare"
    GET_DETAILS = "details"
    ASK_GENERAL = "general"
    FILTER_REFINE = "filter"


def classify_intent(user_message):
    """
    Determines what the user wants to do
    Returns: UserIntent enum
    """
    msg_lower = user_message.lower()
    
    # Pattern 1: Property search
    search_keywords = ['show', 'find', 'looking for', 'need', 'want', 'search', 
                       'available', 'options', 'properties', 'list', 'display']
    if any(keyword in msg_lower for keyword in search_keywords):
        return UserIntent.SEARCH_PROPERTIES
    
    # Pattern 2: Comparison
    compare_keywords = ['compare', 'difference', 'vs', 'versus', 'better', 
                        'which one', 'between']
    if any(keyword in msg_lower for keyword in compare_keywords):
        return UserIntent.COMPARE_PROPERTIES
    
    # Pattern 3: Get specific details
    detail_keywords = ['details', 'tell me more', 'about', 'info', 'specific',
                       'what is', 'explain']
    if any(keyword in msg_lower for keyword in detail_keywords):
        return UserIntent.GET_DETAILS
    
    # Pattern 4: Refine filters (follow-up queries)
    filter_keywords = ['other', 'different', 'else', 'more', 'another',
                       'cheaper', 'expensive', 'bigger', 'smaller']
    if any(keyword in msg_lower for keyword in filter_keywords):
        return UserIntent.FILTER_REFINE
    
    # Default: General query
    return UserIntent.ASK_GENERAL


# ============================================
# ADVANCED FEATURE 2: SMART FILTERING
# ============================================

class SmartFilter:
    """Apply business logic to filter and rank properties"""
    
    @staticmethod
    def parse_price(price_str):
        """Convert price string to float in Crores"""
        if not price_str:
            return 0
        
        price_clean = str(price_str).replace('₹','').replace(',','').replace('+','').strip().lower()
        try:
            if 'cr' in price_clean:
                return float(price_clean.replace('cr','').strip())
            elif 'lakh' in price_clean:
                return float(price_clean.replace('lakh','').strip()) / 100
            else:
                return float(price_clean)
        except:
            return 0
    
    @staticmethod
    def filter_by_budget(properties, user_budget, buffer_percent=20):
        """
        Remove properties significantly above budget
        buffer_percent: Allow 20% above budget
        """
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
    def extract_bhk_from_config(config_str):
        """Extract BHK number from configuration string"""
        if not config_str:
            return []
        try:
            configs = json.loads(config_str)
            if isinstance(configs, list):
                return [str(c).replace('BHK','').strip() for c in configs]
        except:
            pass
        return []
    
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
        """
        Rank properties by value-for-money
        Lower price = better rank (simple heuristic)
        """
        return sorted(properties, 
                     key=lambda p: SmartFilter.parse_price(
                         p.metadata.get('price', '999')
                     ))


# ============================================
# ADVANCED FEATURE 3: STATE MACHINE
# ============================================

def determine_conversation_state(session_id, user_message, chat_history):
    """
    Determine current conversation state
    Returns: New state string
    """
    session = ChatSession.query.get(session_id) if session_id else None
    if not session:
        return 'initial'
    
    current_state = session.state or 'initial'
    msg_lower = user_message.lower()
    
    # State transition logic
    if current_state == 'initial':
        # User has started asking about properties
        if any(word in msg_lower for word in ['show', 'find', 'looking', 'need', 'want']):
            return 'gathering'
    
    elif current_state == 'gathering':
        # User has specified preferences
        if any(word in msg_lower for word in ['bhk', 'budget', 'location', 'price']):
            return 'gathering'  # Still collecting
        # We've shown them properties
        elif len(chat_history) > 1:
            return 'showing'
    
    elif current_state == 'showing':
        # User is asking about specific properties
        if any(word in msg_lower for word in ['tell me more', 'details', 'about', 'specific']):
            return 'drilling'
        # User wants more options
        elif any(word in msg_lower for word in ['other', 'more', 'else', 'different']):
            return 'showing'
    
    elif current_state == 'drilling':
        # User is very interested
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
        
        # Assess lead quality based on state
        if new_state == 'drilling':
            session.lead_quality = 'warm'
        elif new_state == 'closed':
            session.lead_quality = 'hot'
        
        db.session.commit()


# ============================================
# ADVANCED FEATURE 4: RICH FORMATTING
# ============================================

def format_property_card(property_data):
    """
    Generate rich formatted response for a single property
    property_data: dict from Property.to_dict()
    """
    highlights = format_list_items(property_data.get('Key_Highlights', []))
    
    return f"""
🏢 **{property_data.get('Property_Name', 'Property')}**
👷 By {property_data.get('Builder_Name', 'Builder')}

📍 **Location:** {property_data.get('Location', 'Not specified')}
💰 **Price:** {property_data.get('Price_Starting_From', 'Not specified')}
🏠 **Configurations:** {property_data.get('Existing_Configurations', 'Not specified')}
📅 **Status:** {property_data.get('Project_Status', 'Not specified')}
🔑 **Possession:** {property_data.get('Possession_Date', 'Not specified')}

✨ **Key Highlights:**
{highlights}

---
"""


def format_list_items(items):
    """Format JSON list into bullet points"""
    if not items:
        return "Not specified"
    
    try:
        if isinstance(items, str):
            items = json.loads(items)
        if isinstance(items, list):
            return "\n".join([f"• {item}" for item in items[:5]])  # Limit to 5
        return str(items)
    except:
        return str(items)


def format_multiple_properties(properties_list):
    """
    Format multiple properties as a numbered list
    properties_list: List of Property objects or dicts
    """
    if not properties_list:
        return "I couldn't find any properties matching your criteria."
    
    formatted = f"I found **{len(properties_list)} properties** for you:\n\n"
    
    for i, prop in enumerate(properties_list[:5], 1):  # Limit to 5
        if hasattr(prop, 'to_dict'):
            prop_data = prop.to_dict()
        else:
            prop_data = prop if isinstance(prop, dict) else {}
        
        formatted += f"**{i}. {prop_data.get('Property_Name', 'Property')}**\n"
        formatted += f"   📍 {prop_data.get('Location', 'N/A')}\n"
        formatted += f"   💰 {prop_data.get('Price_Starting_From', 'N/A')}\n"
        formatted += f"   🏠 {prop_data.get('Existing_Configurations', 'N/A')}\n"
        formatted += f"   📅 {prop_data.get('Project_Status', 'N/A')}\n\n"
    
    formatted += "\n💬 Would you like detailed information about any of these? Just ask!"
    return formatted


def format_comparison_table(prop1_data, prop2_data):
    """Side-by-side comparison of two properties"""
    return f"""
📊 **Property Comparison**

| Feature | {prop1_data.get('Property_Name', 'Property 1')} | {prop2_data.get('Property_Name', 'Property 2')} |
|---------|------------------------------------------|------------------------------------------|
| 💰 Price | {prop1_data.get('Price_Starting_From', 'N/A')} | {prop2_data.get('Price_Starting_From', 'N/A')} |
| 📍 Location | {prop1_data.get('Location', 'N/A')} | {prop2_data.get('Location', 'N/A')} |
| 🏠 Config | {prop1_data.get('Existing_Configurations', 'N/A')} | {prop2_data.get('Existing_Configurations', 'N/A')} |
| 📅 Status | {prop1_data.get('Project_Status', 'N/A')} | {prop2_data.get('Project_Status', 'N/A')} |
| 🔑 Possession | {prop1_data.get('Possession_Date', 'N/A')} | {prop2_data.get('Possession_Date', 'N/A')} |

💡 **Analysis:** Both properties offer good value. Choose based on your location preference and timeline!
"""


# ============================================
# ADVANCED FEATURE 5: BEHAVIORAL LEARNING
# ============================================

def analyze_user_behavior(user_id):
    """
    Learn from user's past actions
    Returns: Dict of implicit preferences
    """
    if not user_id:
        return None
    
    interactions = UserInteraction.query.filter_by(user_id=user_id)\
                    .order_by(UserInteraction.timestamp.desc())\
                    .limit(50).all()
    
    if not interactions:
        return None
    
    # Extract patterns
    viewed_properties = [i.property for i in interactions if i.property]
    
    # Most viewed builders
    builders = [p.Builder_Name for p in viewed_properties if p.Builder_Name]
    preferred_builders = Counter(builders).most_common(3)
    
    # Price range analysis
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
    
    # Location preferences
    locations = [p.Location for p in viewed_properties if p.Location]
    preferred_locations = Counter(locations).most_common(3)
    
    return {
        'preferred_builders': [b[0] for b in preferred_builders],
        'price_range': {
            'min': min_price,
            'max': max_price,
            'avg': avg_price
        },
        'preferred_locations': [l[0] for l in preferred_locations]
    }


def enhance_context_with_behavior(user_id, context_blocks):
    """Add behavioral insights to context"""
    if not user_id:
        return context_blocks
    
    behavior = analyze_user_behavior(user_id)
    if behavior and behavior['preferred_builders']:
        behavior_text = f"""
LEARNED USER BEHAVIOR (Based on past views):
- Frequently views: {', '.join(behavior['preferred_builders'][:2])} properties
- Typical budget: ₹{behavior['price_range']['avg']:.2f}Cr
- Preferred areas: {', '.join(behavior['preferred_locations'][:2])}
"""
        context_blocks.append(behavior_text)
    return context_blocks


# ============================================
# ADVANCED FEATURE 6: CONVERSATIONAL MEMORY
# ============================================

class ConversationMemory:
    """Enhanced memory for entity tracking and coreference resolution"""
    
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
        bhk_match = re.search(r'(\d+)\s*bhk', msg_lower)
        if bhk_match:
            self.entities['bhk_configs'].append(bhk_match.group(1))
        
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
                    budget = budget / 100  # Convert to Cr
                self.entities['budgets'].append(budget)
        
        # Extract locations (simple approach - can be enhanced)
        common_locations = ['ghansoli', 'airoli', 'nerul', 'vashi', 'kharghar', 
                           'kopar khairane', 'belapur', 'panvel', 'seawoods']
        for loc in common_locations:
            if loc in msg_lower:
                self.entities['locations'].append(loc.title())
    
    def resolve_coreference(self, message):
        """
        Handle pronouns like "it", "that", "the first one"
        Returns: Resolved property ID or None
        """
        msg_lower = message.lower()
        
        # "it" or "that" refers to last mentioned property
        if any(word in msg_lower for word in ['it', 'that', 'this']):
            if self.entities['property_ids']:
                return self.entities['property_ids'][-1]
        
        # "the first property" or "first one"
        if 'first' in msg_lower:
            if self.entities['property_ids']:
                return self.entities['property_ids'][0]
        
        # "the second property"
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
# ADVANCED FEATURE 7: PROACTIVE SUGGESTIONS
# ============================================

def generate_proactive_suggestions(user_context, shown_properties):
    """
    Generate helpful suggestions user hasn't asked for
    Returns: List of suggestion strings
    """
    suggestions = []
    
    # Budget-based suggestions
    if user_context.get('budget'):
        budget = user_context['budget']
        lower_budget = budget * 0.8
        higher_budget = budget * 1.2
        
        suggestions.append(
            f"💡 **Value Tip**: I also found properties around ₹{lower_budget:.1f}Cr "
            f"that offer excellent value in {user_context.get('location', 'this area')}!"
        )
    
    # Location-based suggestions
    if user_context.get('location'):
        location = user_context['location']
        
        # Nearby locations mapping
        nearby_map = {
            'ghansoli': ['Airoli', 'Kopar Khairane'],
            'airoli': ['Ghansoli', 'Rabale'],
            'nerul': ['Seawoods', 'Belapur'],
            'vashi': ['Nerul', 'Sanpada'],
            'kharghar': ['Kamothe', 'Taloja']
        }
        
        nearby = nearby_map.get(location.lower(), [])
        if nearby:
            suggestions.append(
                f"💡 **Alternative Locations**: {nearby[0]} and {nearby[1]} have "
                f"similar properties with potentially better prices."
            )
    
    # Possession timing suggestion
    if shown_properties:
        ready_to_move = any(
            'completed' in str(p.metadata.get('status', '')).lower() or 
            'ready' in str(p.metadata.get('status', '')).lower()
            for p in shown_properties
        )
        if not ready_to_move:
            suggestions.append(
                "💡 **Immediate Move**: Need to move soon? "
                "I can show you ready-to-move properties!"
            )
    
    # Market insight
    if user_context.get('location'):
        suggestions.append(
            f"📊 **Market Insight**: Properties in {user_context.get('location')} "
            f"have shown consistent appreciation. Good time to invest!"
        )
    
    # Limit to 2-3 suggestions
    return suggestions[:3]


# ============================================
# DOCUMENT FACTORY & SYNC (EXISTING)
# ============================================

def create_unified_document(record):
    """Factory to convert SQL objects into Vector Documents"""
    metadata = {}
    content = ""
    unique_id = ""

    # === CASE A: PROPERTY ===
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

    # === CASE B: BLOG ===
    elif isinstance(record, Blog):
        unique_id = f"blog_{record.id}"
        metadata = {"id": str(record.id), "type": "blog", "keywords": record.focus_keywords}
        content = f"""Type: Real Estate Guide / Blog
Title: {record.title}
Summary: {record.intro_paragraph}
Content: {record.content1} {record.content2}"""

    # === CASE C: PROJECT ===
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

    # === CASE D: BUILDER ===
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
    """Sync database to vector store"""
    print("--- Starting Unified Smart Sync ---")
    all_records = []
    try:
        all_records.extend(Property.query.all())
        all_records.extend(Blog.query.all())
        all_records.extend(BuilderProject.query.all())
        all_records.extend(Builder.query.all())
    except Exception as e:
        print(f"Error fetching SQL: {e}")
        return

    if not all_records: 
        print("No records to sync")
        return

    print(f"Checking existing records in: {VECTOR_DB_PATH}")
    try:
        existing_ids = set(vectorstore.get()['ids'])
    except:
        existing_ids = set()
    
    new_docs = []
    new_ids = []
    
    for record in all_records:
        doc, unique_id = create_unified_document(record)
        if unique_id not in existing_ids:
            new_docs.append(doc)
            new_ids.append(unique_id)

    if not new_docs:
        print("✅ All data is up to date!")
        return

    print(f"Found {len(new_docs)} new items. Syncing...")
    BATCH_SIZE = 50
    for i in range(0, len(new_docs), BATCH_SIZE):
        try:
            vectorstore.add_documents(
                documents=new_docs[i:i+BATCH_SIZE], 
                ids=new_ids[i:i+BATCH_SIZE]
            )
            print(f"Batch {i//BATCH_SIZE + 1} success.")
        except Exception as e:
            print(f"Batch {i//BATCH_SIZE + 1} error: {e}")
    print("--- Sync Complete ---")


# ============================================
# AUTO-LEARNING (EXISTING)
# ============================================

def extract_and_save_preferences(user_message, user_id):
    """Extract preferences from message and save to DB"""
    if not user_id: 
        return
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", 
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
# MAIN CHATBOT (ENHANCED WITH ALL FEATURES)
# ============================================

def get_chatbot_response(user_query, user_id=None, chat_history=[], session_shown_ids=None, conversation_memory=None):
    """
    Enhanced chatbot with all 7 advanced features:
    1. Intent classification
    2. Smart filtering
    3. State machine (handled in routes)
    4. Rich formatting
    5. Behavioral learning
    6. Conversational context retention
    7. Proactive suggestions
    """
    
    if session_shown_ids is None:
        session_shown_ids = set()
    
    # FEATURE 1: Classify intent first
    intent = classify_intent(user_query)
    print(f"🎯 Detected intent: {intent.value}")
    
    # Adjust retrieval strategy based on intent
    if intent == UserIntent.COMPARE_PROPERTIES:
        search_k = 10
        fetch_k = 30
    elif intent == UserIntent.SEARCH_PROPERTIES or intent == UserIntent.FILTER_REFINE:
        search_k = 20
        fetch_k = 50
    elif intent == UserIntent.GET_DETAILS:
        search_k = 3
        fetch_k = 10
    else:
        search_k = 10
        fetch_k = 25
    
    # --- BUILD CONTEXT STRING ---
    context_blocks = []
    
    # User Preferences (explicit)
    user_budget = None
    user_bhk = None
    user_location = None
    
    if user_id:
        prefs = UserPreference.query.filter_by(user_id=user_id).all()
        if prefs:
            p_text = ", ".join([f"{p.pref_key}: {p.pref_value}" for p in prefs])
            context_blocks.append(f"KNOWN USER PREFERENCES: {p_text}")
            
            # Extract for later use
            for p in prefs:
                if p.pref_key == 'budget':
                    try:
                        user_budget = float(p.pref_value)
                    except:
                        pass
                elif p.pref_key == 'bhk':
                    user_bhk = p.pref_value
                elif p.pref_key == 'location':
                    user_location = p.pref_value

    # FEATURE 6: Conversational memory
    if conversation_memory:
        current_prefs = conversation_memory.get_current_preferences()
        if current_prefs['budget'] and not user_budget:
            user_budget = current_prefs['budget']
        if current_prefs['bhk'] and not user_bhk:
            user_bhk = current_prefs['bhk']
        if current_prefs['location'] and not user_location:
            user_location = current_prefs['location']

    # Chat History Summary
    if chat_history:
        history_text = "\n".join([f"User: {h[0]}\nAI: {h[1]}" for h in chat_history[-5:]])
        context_blocks.append(f"RECENT CONVERSATION:\n{history_text}")
    
    # Previously Shown Properties
    if session_shown_ids:
        context_blocks.append(f"ALREADY SHOWN PROPERTY IDs: {list(session_shown_ids)}")
    
    # FEATURE 5: Behavioral learning
    context_blocks = enhance_context_with_behavior(user_id, context_blocks)

    full_system_context = "\n\n".join(context_blocks)

    # --- PROMPTS ---
    condense_template = """Given the chat history and follow-up question, rephrase it to be a standalone search query.
If the user says "show me OTHER options" or "what else", include their previous preferences (location, BHK, etc.) in the query.

Chat History: {chat_history}
Follow Up: {question}
Standalone Question:"""
    CONDENSE_PROMPT = PromptTemplate.from_template(condense_template)

    # FEATURE 4: Rich formatting in prompt
    answer_template = f"""You are an expert Real Estate Agent for HnS.

SYSTEM DATA (Use this for context about previous messages):
{full_system_context}

FORMATTING INSTRUCTIONS:
1. When showing multiple properties, use numbered lists
2. Use emojis for better readability: 🏢 💰 📍 🏠 📅 ✨
3. Keep each property description concise (4-5 lines max)
4. After listing properties, always end with a friendly question
5. For comparisons, use table format if asked

CRITICAL INSTRUCTIONS:
1. If user asks "show me ALL options" or "show OTHER options", list at least 3-5 properties
2. NEVER repeat properties from "ALREADY SHOWN PROPERTY IDs"
3. If only 1-2 properties match, explicitly say so and suggest alternatives
4. Include: Name, Builder, Location, Price, Config, Status for each property
5. Be conversational and helpful

Context from database:
{{context}}

Question: {{question}}

Answer (use formatting guidelines):"""
    
    ANSWER_PROMPT = PromptTemplate(template=answer_template, input_variables=["context", "question"])

    # --- SETUP LLM ---
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.3,
        max_output_tokens=2000,
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        convert_system_message_to_human=True
    )
    
    retriever = vectorstore.as_retriever(
        search_type="mmr",  # Maximum Marginal Relevance for diversity
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
    
    # Get source documents
    source_docs = result.get('source_documents', [])
    
    # FEATURE 2: Apply smart filters
    if user_budget:
        source_docs = SmartFilter.filter_by_budget(source_docs, user_budget)
    if user_bhk:
        source_docs = SmartFilter.filter_by_bhk(source_docs, user_bhk)
    
    # Rank by value
    source_docs = SmartFilter.rank_by_value(source_docs)
    
    # If filters removed too many results, add explanation
    if len(source_docs) < 3 and (user_budget or user_bhk):
        ai_answer += f"\n\n💡 **Note**: I filtered results based on your preferences. "
        if user_budget:
            ai_answer += f"Budget: ₹{user_budget}Cr. "
        if user_bhk:
            ai_answer += f"Configuration: {user_bhk}BHK. "
        ai_answer += "Try adjusting your criteria for more options."
    
    # Track shown property IDs
    print(f"DEBUG: Total source_docs = {len(source_docs)}")
    for doc in source_docs:
        print(f"DEBUG: doc.metadata = {doc.metadata}")
        doc_type = doc.metadata.get('type')  # ADD THIS LINE
        doc_id = doc.metadata.get('id')  # ADD THIS LINE
        print(f"DEBUG: type='{doc_type}', id='{doc_id}'")
        if doc_type in ['property', 'project']: 
            session_shown_ids.add(doc_id)
            print(f"DEBUG: Added ID {doc_id}")
    print(f"DEBUG: session_shown_ids = {session_shown_ids}")
    
    # FEATURE 7: Add proactive suggestions
    user_context = {
        'budget': user_budget,
        'location': user_location,
        'bhk': user_bhk
    }
    
    suggestions = generate_proactive_suggestions(user_context, source_docs)
    if suggestions:
        ai_answer += "\n\n" + "\n".join(suggestions)
    
    # Auto-learn preferences
    if user_id:
        extract_and_save_preferences(user_query, user_id)
    
    return ai_answer, session_shown_ids


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
        return "No properties found matching your criteria."
    
    formatted = f"Found {len(results)} properties:\n\n"
    for i, prop in enumerate(results, 1):
        formatted += f"{i}. **{prop.Property_Name}** by {prop.Builder_Name}\n"
        formatted += f"   📍 Location: {prop.Location}\n"
        formatted += f"   💰 Price: {prop.Price_Starting_From}\n"
        formatted += f"   🏠 Config: {clean_json_field(prop.Existing_Configurations)}\n"
        formatted += f"   📅 Status: {prop.Project_Status}\n\n"
    
    return formatted
