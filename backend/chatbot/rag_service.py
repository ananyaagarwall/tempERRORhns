import os
import json
import re
import hashlib
from datetime import datetime
from enum import Enum
from collections import Counter
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_postgres import PGVector
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_classic.chains import ConversationalRetrievalChain
from models import Property, Blog, BuilderProject, UserPreference, Builder, UserInteraction, ChatSession, User, db
from flask import current_app
import threading

try:
    from langchain_openai import AzureChatOpenAI
except ImportError:
    AzureChatOpenAI = None

# --- 1. SETUP ---
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(dotenv_path=os.path.join(BACKEND_DIR, ".env"))

print("Vector store: PostgreSQL (pgvector)")

# --- 2. EMBEDDINGS SETUP ---
HF_MODEL_NAME = os.getenv("HF_EMBED_MODEL", "all-MiniLM-L6-v2")
HF_LOCAL_ONLY = os.getenv("HF_LOCAL_FILES_ONLY", "true").lower() in ("1", "true", "yes", "on")
FALLBACK_EMBED_DIM = int(os.getenv("FALLBACK_EMBED_DIM", "384"))
AZURE_OPENAI_KEY = (os.getenv("AZURE_OPENAI_KEY") or os.getenv("AZURE_OPENAI_API_KEY") or "").strip()
AZURE_OPENAI_ENDPOINT = (
    os.getenv("AZURE_OPENAI_ENDPOINT")
    or os.getenv("AZURE_OPENAI_BASE_URL")
    or os.getenv("OPENAI_API_BASE")
    or ""
).strip()
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-10-21")
AZURE_OPENAI_CHAT_DEPLOYMENT = (
    os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT")
    or os.getenv("AZURE_OPENAI_DEPLOYMENT")
    or os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    or ""
).strip()
AZURE_OPENAI_MODEL = (os.getenv("AZURE_OPENAI_MODEL") or os.getenv("OPENAI_MODEL") or "gpt-4o-mini").strip()


def get_azure_openai_health():
    missing = []
    if not AZURE_OPENAI_KEY:
        missing.append("AZURE_OPENAI_KEY")
    if not AZURE_OPENAI_ENDPOINT:
        missing.append("AZURE_OPENAI_ENDPOINT")
    if not AZURE_OPENAI_CHAT_DEPLOYMENT:
        missing.append("AZURE_OPENAI_CHAT_DEPLOYMENT")

    return {
        "provider": "azure_openai",
        "configured": not missing and AzureChatOpenAI is not None,
        "sdk_installed": AzureChatOpenAI is not None,
        "missing": missing,
        "endpoint_configured": bool(AZURE_OPENAI_ENDPOINT),
        "deployment": AZURE_OPENAI_CHAT_DEPLOYMENT or None,
        "model": AZURE_OPENAI_MODEL or None,
        "api_version": AZURE_OPENAI_API_VERSION or None,
    }


def _create_chat_llm(*, temperature, max_output_tokens):
    """
    Create the Azure OpenAI chat model used by the chatbot.
    """
    health = get_azure_openai_health()
    if not health["sdk_installed"]:
        raise RuntimeError(
            "Azure OpenAI is configured for chatbot responses, but langchain-openai is not installed."
        )

    if health["missing"]:
        raise RuntimeError(
            "Azure OpenAI chatbot configuration is incomplete. Missing: "
            + ", ".join(health["missing"])
        )

    return AzureChatOpenAI(
        azure_endpoint=AZURE_OPENAI_ENDPOINT,
        api_key=AZURE_OPENAI_KEY,
        api_version=AZURE_OPENAI_API_VERSION,
        azure_deployment=AZURE_OPENAI_CHAT_DEPLOYMENT,
        model=AZURE_OPENAI_MODEL,
        temperature=temperature,
        max_tokens=max_output_tokens,
    )


class LocalFallbackEmbeddings:
    """
    Lightweight deterministic embedding fallback for offline/startup resilience.
    """
    def __init__(self, dim=384):
        self.dim = dim

    def _embed(self, text):
        seed = hashlib.sha256((text or "").encode("utf-8")).digest()
        values = []

        while len(values) < self.dim:
            seed = hashlib.sha256(seed).digest()
            for i in range(0, len(seed), 4):
                chunk = seed[i:i + 4]
                if len(chunk) < 4:
                    continue
                raw = int.from_bytes(chunk, "big", signed=False) / 4294967295.0
                values.append((raw * 2.0) - 1.0)
                if len(values) >= self.dim:
                    break

        norm = sum(v * v for v in values) ** 0.5
        if norm > 0:
            values = [v / norm for v in values]
        return values

    def embed_documents(self, texts):
        return [self._embed(text) for text in texts]

    def embed_query(self, text):
        return self._embed(text)


# --- 3. PGVECTOR STORE SETUP ---
# Requires the 'vector' extension in your Postgres DB:
#   CREATE EXTENSION IF NOT EXISTS vector;
PG_CONNECTION_STRING = os.getenv("DATABASE_URL", "postgresql://localhost/hns_db")
COLLECTION_NAME = "real_estate_unified"

_vectorstore = None
_vectorstore_lock = threading.Lock()


def _create_embeddings():
    """Create HF embeddings, with offline/local-first + deterministic fallback."""
    model_kwargs = {}
    if HF_LOCAL_ONLY:
        model_kwargs["local_files_only"] = True

    try:
        return HuggingFaceEmbeddings(model_name=HF_MODEL_NAME, model_kwargs=model_kwargs)
    except Exception as e:
        print(f"Embedding model load failed ({e}). Using local deterministic fallback embeddings.")
        return LocalFallbackEmbeddings(dim=FALLBACK_EMBED_DIM)


def get_vectorstore():
    """Lazy PGVector initialization to prevent import-time startup failures."""
    global _vectorstore
    if _vectorstore is None:
        with _vectorstore_lock:
            if _vectorstore is None:
                embeddings = _create_embeddings()
                _vectorstore = PGVector(
                    embeddings=embeddings,
                    collection_name=COLLECTION_NAME,
                    connection=PG_CONNECTION_STRING,
                    use_jsonb=True,
                )
    return _vectorstore


class _LazyVectorStore:
    """Proxy that initializes PGVector only on first use."""
    def __getattr__(self, item):
        return getattr(get_vectorstore(), item)


vectorstore = _LazyVectorStore()


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


def _contains_any(msg_lower, keywords):
    return any(keyword in msg_lower for keyword in keywords)


def _has_compare_intent(msg_lower):
    compare_keywords = [
        'compare', 'difference', 'vs', 'versus', 'better',
        'which one', 'between', 'suggest between', 'recommend between',
        'which is better', 'which would you', 'which should i',
    ]
    return _contains_any(msg_lower, compare_keywords)


def _is_refinement_only_message(user_message, params=None):
    """
    Detect short follow-up filter messages like "under 2 cr" or "3 bhk in thane"
    without forcing the conversation back into comparison mode.
    """
    msg_lower = (user_message or "").lower().strip()
    params = params or sync_extract_params(user_message)
    if not any(params.values()):
        return False

    # A fresh location usually means the user is starting a new property search,
    # not asking to keep the previous comparison thread going.
    if params.get('location'):
        return False

    blocker_keywords = [
        'compare', 'difference', 'vs', 'versus', 'better', 'which one', 'between',
        'builder', 'builders', 'developer', 'developers', 'construction company',
        'who built', 'building company', 'details', 'tell me more', 'specific',
        'what is', 'explain', 'contact', 'support', 'help me', 'reach out',
        'get in touch', 'phone', 'email', 'call', 'speak to', 'show', 'find',
        'looking for', 'need', 'want', 'search', 'available', 'options',
        'properties', 'property', 'list', 'display', 'apartment', 'flat', 'house'
    ]
    return not _contains_any(msg_lower, blocker_keywords)


def classify_intent(user_message):
    """
    Enhanced intent classification for properties vs builders
    Returns: UserIntent enum
    """
    msg_lower = user_message.lower()

    # Pattern 1: Contact/Support queries
    contact_keywords = ['contact', 'support', 'help me', 'reach out', 'get in touch',
                        'phone', 'email', 'call', 'speak to']
    if _contains_any(msg_lower, contact_keywords):
        return UserIntent.CONTACT_US

    # Pattern 2: Opinion / recommendation requests — must be checked BEFORE compare
    # because phrases like "which do you think is better between them?" contain compare
    # keywords ('better', 'between') but the user wants the LLM's opinion, not a table.
    opinion_patterns = [
        r'\bdo\s+you\s+think\b',
        r'\bwhat\s+do\s+you\s+think\b',
        r'\bin\s+your\s+opinion\b',
        r"\bwhat('s|is)\s+your\s+(opinion|view|take|pick|choice)\b",
        r'\bwould\s+you\s+(choose|pick|prefer|recommend|suggest)\b',
        r'\bwhich\s+(one\s+)?do\s+you\s+(think|feel|prefer|recommend|suggest)\b',
        r'\byour\s+(recommendation|suggestion|opinion|pick|choice)\b',
        r'\bwhat\s+would\s+you\s+(suggest|recommend|pick|choose|prefer)\b',
    ]
    for pattern in opinion_patterns:
        if re.search(pattern, msg_lower):
            return UserIntent.ASK_GENERAL

    # Pattern 3: Comparison wins over advisory/search — "suggest between X and Y"
    # or "compare X vs Y" should show the comparison table.
    if _has_compare_intent(msg_lower):
        return UserIntent.COMPARE_PROPERTIES

    # Pattern 3: Advisory / general knowledge questions — checked BEFORE search keywords
    # because these phrases use words like "bhk", "budget", "property" but are asking
    # for advice, not a property listing.
    # NOTE: words like "suggest/recommend" that appear with compare-intent keywords are
    # already handled above, so they only reach here in a pure advisory context
    # (e.g. "what budget would you suggest for a 2 BHK?").
    advisory_patterns = [
        r'\bwhat\s+(should|is|are|would)\b',
        r'\bhow\s+much\b',
        r'\baverage\s+(budget|price|cost|rate)\b',
        r'\b(budget|price|cost)\s+(for|of|range)\b',
        r'\btell\s+me\s+(what|how|about|the)\b',
        r'\badvise\b',
        r'\badvice\b',
        r'\bsuggestion\b',
        r'\bsuggest\b',
        r'\brecommend\b',
        r'\btypical(ly)?\b',
        r'\bgenerally\b',
        r'\busually\b',
        r'\bmarket\s+(rate|price|value)\b',
        r'\bprice\s+trend\b',
        r'\bguide(line)?\b',
    ]
    for pattern in advisory_patterns:
        if re.search(pattern, msg_lower):
            return UserIntent.ASK_GENERAL

    # Pattern 4: Builder search
    builder_keywords = ['builder', 'builders', 'developer', 'developers',
                        'construction company', 'who built', 'building company']
    if _contains_any(msg_lower, builder_keywords):
        return UserIntent.SEARCH_BUILDERS

    # Pattern 5: Property search — only explicit listing/search verbs trigger this.
    # Broad nouns like 'bhk', 'house', 'apartment' alone must NOT trigger a listing
    # because they appear in advisory questions too.
    explicit_search_keywords = ['show', 'find', 'looking for', 'search',
                                'available', 'list', 'display', 'prop', 'props']
    if _contains_any(msg_lower, explicit_search_keywords):
        return UserIntent.SEARCH_PROPERTIES

    # Noun-only search keywords — only classify as search if no advisory pattern matched above
    noun_search_keywords = ['properties', 'property', 'apartment', 'flat',
                            'house', 'bhk', 'options']
    if _contains_any(msg_lower, noun_search_keywords):
        # Extra guard: "need/want" with a noun is a search, but "what/how" already
        # caught above, so safe to classify as search here.
        return UserIntent.SEARCH_PROPERTIES

    # Pattern 6: Get specific details
    detail_keywords = ['details', 'tell me more', 'about', 'info', 'specific',
                       'what is', 'explain']
    if _contains_any(msg_lower, detail_keywords):
        return UserIntent.GET_DETAILS

    # Pattern 7: Refine filters (follow-up queries)
    filter_keywords = ['other', 'different', 'else', 'more', 'another',
                       'cheaper', 'expensive', 'bigger', 'smaller']
    if _contains_any(msg_lower, filter_keywords):
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
            # Check for Lac/Lakh/L (standalone 'l' as used in "28 L")
            is_lakh = 'lakh' in s or 'lac' in s or bool(re.search(r'\bl\b', s))

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
    def parse_price_range(price_str):
        """Return (min_price_cr, max_price_cr) from a range string like '₹72 L – ₹2.0 Cr'."""
        if not price_str:
            return 0, 0
        s = str(price_str).lower().replace(',', '')
        try:
            parts = re.split(r'[-–—]|(?<=\d)\s+to\s+(?=\d)', s)
            prices = []
            for part in parts:
                part = part.strip()
                is_lakh = 'lakh' in part or 'lac' in part or bool(re.search(r'\bl\b', part))
                is_cr = 'crore' in part or bool(re.search(r'\bcr\b', part))
                m = re.search(r'(\d+(?:\.\d+)?)', part)
                if m:
                    val = float(m.group(1))
                    if is_lakh:
                        prices.append(val / 100)
                    elif is_cr:
                        prices.append(val)
            if prices:
                return min(prices), max(prices)
        except Exception:
            pass
        p = SmartFilter.parse_price(price_str)
        return p, p

    @staticmethod
    def filter_by_budget(properties, user_budget, buffer_percent=5):
        """Remove properties whose starting price exceeds the budget"""
        if not user_budget:
            return properties

        max_budget = user_budget * (1 + buffer_percent/100)
        filtered = []

        for prop in properties:
            min_price, max_price = SmartFilter.parse_price_range(
                prop.metadata.get('price', '0')
            )
            prop_price = min_price if min_price > 0 else SmartFilter.parse_price(prop.metadata.get('price', '0'))
            if prop_price <= max_budget and (max_price == 0 or max_price <= float(user_budget) * 1.1):
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
    
    # 2. Detect explicit "any range / any budget / any price" — user wants no budget filter.
    # Set a sentinel so callers know to ignore saved-preference budgets.
    if re.search(r'\b(any\s+(range|budget|price|cost)|no\s+(budget|price)\s+limit|all\s+range|regardless\s+of\s+(price|budget|cost))\b', q_lower):
        params['budget_any'] = True

    # 3. Extract Budget — also capture "above/over/more than" as a min-price direction
    budget_match = re.search(
        r'(under|below|max|upto|above|over|more\s+than|minimum|min|at\s+least|starting\s+from)?\s*'
        r'(\d+(?:\.\d+)?)\s*(cr|crore|lakh|l|lac|k)',
        q_lower,
    )
    if budget_match and not params.get('budget_any'):
        try:
            qualifier = (budget_match.group(1) or "").replace(" ", "")
            val = float(budget_match.group(2))
            unit = budget_match.group(3)
            if unit in ['cr', 'crore']:
                amount = val
            elif unit in ['lakh', 'l', 'lac']:
                amount = val / 100.0
            elif unit == 'k':
                amount = val / 100000.0
            else:
                amount = val

            if qualifier in ('above', 'over', 'morethan', 'minimum', 'min', 'atleast', 'startingfrom'):
                params['budget_min'] = amount
            else:
                params['budget'] = amount
        except:
            pass

    # 4. Extract Location — only capture the first word after the preposition.
    # Multi-word locations (e.g. "kopar khairane", "navi mumbai") are handled
    # by the canonical fallback list below, so greedy two-word capture here
    # just causes false positives like "koparkhairane will" or "koparkhairane of".
    _loc_ignored = {
        'mumbai', 'india', 'details', 'information', 'comparison', 'search',
        'properties', 'builder', 'builders', 'project', 'projects',
        'any', 'all', 'a', 'an', 'the',
        # pronouns / determiners that are not locations
        'that', 'this', 'those', 'these', 'there', 'here', 'which', 'what',
        'same', 'some', 'such', 'my', 'your', 'our', 'their',
        # filler words that follow prepositions
        'range', 'price', 'budget', 'area', 'location', 'place',
    }
    # Scan all matches so a filler word like "that" doesn't shadow the real location.
    for loc_match in re.finditer(r'\b(in|at|near|from)\s+([a-zA-Z]+)', q_lower):
        raw = loc_match.group(2).strip()
        if raw not in _loc_ignored and len(raw) > 2:
            params['location'] = raw
            break

    # Fallback: if query includes a known location without a preposition.
    # Each entry is (canonical_name, [variants]) — variants are matched as
    # whole words and the canonical name is stored so the rest of the code
    # always sees a single consistent value.
    if not params.get('location'):
        common_locations = [
            ('ghansoli',       ['ghansoli']),
            ('airoli',         ['airoli']),
            ('nerul',          ['nerul']),
            ('vashi',          ['vashi']),
            ('kharghar',       ['kharghar']),
            ('kopar khairane', ['kopar khairane', 'koparkhairane']),
            ('belapur',        ['belapur']),
            ('panvel',         ['panvel']),
            ('seawoods',       ['seawoods']),
            ('thane',          ['thane']),
            ('navi mumbai',    ['navi mumbai']),
            ('mumbai',         ['mumbai']),
            ('kalyan',         ['kalyan']),
            ('dombivli',       ['dombivli']),
        ]
        for canonical, variants in common_locations:
            for variant in variants:
                if re.search(rf'\b{re.escape(variant)}\b', q_lower):
                    params['location'] = canonical
                    break
            if params.get('location'):
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

    def resolve_coreference(self, message):
        """Resolve references like 'it', 'the first one', or 'property 2'."""
        msg_lower = (message or "").lower()
        property_ids = [str(pid) for pid in self.entities.get('property_ids', []) if pid not in (None, "")]
        if not property_ids:
            return None

        explicit_ref = re.search(
            r'\b(?:prop(?:erty)?|project|home|listing|option)\s*#?\s*(\d+)\b',
            msg_lower
        )
        if explicit_ref:
            index = int(explicit_ref.group(1)) - 1
            if 0 <= index < len(property_ids):
                return property_ids[index]

        ordinal_map = {
            'first': 0,
            '1st': 0,
            'second': 1,
            '2nd': 1,
            'third': 2,
            '3rd': 2,
            'fourth': 3,
            '4th': 3,
            'fifth': 4,
            '5th': 4,
        }
        for token, index in ordinal_map.items():
            if re.search(rf'\b{re.escape(token)}\b', msg_lower):
                if 0 <= index < len(property_ids):
                    return property_ids[index]

        if re.search(r'\b(last|latest|recent|latter)\b', msg_lower):
            return property_ids[-1]

        if 'former' in msg_lower and len(property_ids) >= 2:
            return property_ids[0]

        if re.search(r'\b(it|this|that|this one|that one|same one|same property|the property|the project)\b', msg_lower):
            return property_ids[-1]

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
    """
    Build a unified preference profile from:
      1. UserPreference rows (explicit prefs stated in past chats)
      2. UserInteraction rows (properties the user has clicked/viewed)
    Returns a dict the rest of the code can act on directly.
    """
    user_id = _resolve_local_user_id(user_id)
    if not user_id:
        return None

    profile = {
        'preferred_builders': [],
        'preferred_locations': [],
        'preferred_bhk': None,
        'price_range': {'minimum': 0, 'maximum': 0, 'avg': 0},
        'explicit_budget': None,
        'explicit_location': None,
        'explicit_bhk': None,
    }

    # --- 1. Explicit preferences saved from past chat sessions ---
    try:
        prefs = UserPreference.query.filter_by(user_id=user_id).all()
        for p in prefs:
            key = (p.pref_key or '').lower()
            val = (p.pref_value or '').strip()
            if not val:
                continue
            if key == 'budget':
                try:
                    profile['explicit_budget'] = float(val)
                except ValueError:
                    numbers = re.findall(r'\d+\.?\d*', val)
                    if numbers:
                        profile['explicit_budget'] = float(numbers[0])
            elif key == 'location':
                profile['explicit_location'] = val
            elif key == 'bhk':
                profile['explicit_bhk'] = val
    except Exception as e:
        print(f"analyze_user_behavior: error reading preferences: {e}")

    # --- 2. Behavioral footprint from viewed/clicked properties ---
    try:
        interactions = UserInteraction.query.filter_by(user_id=user_id)\
                        .order_by(UserInteraction.timestamp.desc())\
                        .limit(50).all()
        viewed_properties = [i.property for i in interactions if getattr(i, 'property', None)]

        builders = [p.Builder_Name for p in viewed_properties if p.Builder_Name]
        profile['preferred_builders'] = [b for b, _ in Counter(builders).most_common(3)]

        locations = [p.Location for p in viewed_properties if p.Location]
        profile['preferred_locations'] = [l for l, _ in Counter(locations).most_common(3)]

        prices = [
            SmartFilter.parse_price(p.Price_Starting_From)
            for p in viewed_properties
            if SmartFilter.parse_price(p.Price_Starting_From) > 0
        ]
        if prices:
            profile['price_range'] = {
                'minimum': min(prices),
                'maximum': max(prices),
                'avg': sum(prices) / len(prices),
            }

        # Infer preferred BHK from viewed properties
        bhk_counts = Counter()
        for p in viewed_properties:
            for m in re.findall(r'(\d)\s*bhk', str(p.Existing_Configurations).lower()):
                bhk_counts[m] += 1
        if bhk_counts:
            profile['preferred_bhk'] = bhk_counts.most_common(1)[0][0]
    except Exception as e:
        print(f"analyze_user_behavior: error reading interactions: {e}")

    has_data = (
        profile['preferred_builders']
        or profile['preferred_locations']
        or profile['explicit_budget']
        or profile['explicit_location']
        or profile['explicit_bhk']
    )
    return profile if has_data else None


def get_user_search_defaults(user_id):
    """
    Return (location, budget, bhk) inferred from user history/preferences.
    Used to fill in missing params when the current query doesn't specify them.
    Explicit DB prefs take priority over behavioral footprint.
    """
    behavior = analyze_user_behavior(user_id)
    if not behavior:
        return None, None, None

    location = (
        behavior.get('explicit_location')
        or (behavior['preferred_locations'][0] if behavior['preferred_locations'] else None)
    )
    budget = (
        behavior.get('explicit_budget')
        or (behavior['price_range'].get('avg') or None)
    )
    bhk = (
        behavior.get('explicit_bhk')
        or behavior.get('preferred_bhk')
    )
    return location, budget, bhk


def enhance_context_with_behavior(user_id, context_blocks):
    """Add behavioral insights to the LLM prompt context so it can personalise its answer."""
    if not user_id:
        return context_blocks

    behavior = analyze_user_behavior(user_id)
    if not behavior:
        return context_blocks

    parts = ["USER PROFILE (use this to personalise your answer):"]

    if behavior.get('explicit_location'):
        parts.append(f"- Preferred location (stated): {behavior['explicit_location']}")
    elif behavior.get('preferred_locations'):
        parts.append(f"- Frequently browses: {', '.join(behavior['preferred_locations'][:2])}")

    if behavior.get('explicit_bhk'):
        parts.append(f"- Preferred BHK (stated): {behavior['explicit_bhk']} BHK")
    elif behavior.get('preferred_bhk'):
        parts.append(f"- Most-viewed BHK type: {behavior['preferred_bhk']} BHK")

    if behavior.get('explicit_budget'):
        parts.append(f"- Budget (stated): Rs {behavior['explicit_budget']:.2f} Cr")
    else:
        pr = behavior.get('price_range', {})
        if pr.get('avg', 0) > 0:
            parts.append(f"- Typical budget based on views: Rs {pr['avg']:.2f} Cr "
                         f"(range Rs {pr.get('minimum', 0):.2f}–{pr.get('maximum', 0):.2f} Cr)")

    if behavior.get('preferred_builders'):
        parts.append(f"- Builders user has shown interest in: {', '.join(behavior['preferred_builders'][:2])}")

    context_blocks.append("\n".join(parts))
    return context_blocks


# ============================================
# DOCUMENT FACTORY & SYNC (Keep existing)
# ============================================

def create_unified_document(record):
    """Factory to convert SQL objects into Vector Documents"""
    metadata = {}
    content = ""
    unique_id = ""

    def _project_unit_labels(project):
        rows = list(getattr(project, 'unit_configs', []) or [])
        if rows:
            labels = []
            seen = set()
            for row in rows:
                label = getattr(row, 'bhk_type', None)
                if not label or label in seen:
                    continue
                seen.add(label)
                labels.append(label)
            return labels

        configs = clean_json_field(getattr(project, 'configuration', ''))
        if isinstance(configs, list):
            labels = []
            seen = set()
            for item in configs:
                if isinstance(item, dict):
                    label = item.get('type') or item.get('bhk_type')
                else:
                    label = item
                if not label or label in seen:
                    continue
                seen.add(label)
                labels.append(str(label))
            return labels
        return [str(configs)] if configs else []

    def _project_amenity_names(project):
        rows = list(getattr(project, 'project_amenities', []) or [])
        if rows:
            return [row.name for row in rows if getattr(row, 'name', None)]

        amenities = clean_json_field(getattr(project, 'amenities', ''))
        if isinstance(amenities, list):
            return [str(item) for item in amenities if item]
        return [str(amenities)] if amenities else []

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
        configuration_labels = _project_unit_labels(record)
        amenity_names = _project_amenity_names(record)
        unique_id = f"proj_{record.id}"
        metadata = {
            "id": str(record.id),
            "type": "project",
            "name": record.title,
            "builder": record.builder_name,
            "city": record.city,
            "location": record.location,
            "configuration": configuration_labels or record.configuration,
            "price": record.price_range
        }
        content = f"""Type: New Project Launch
Name: {record.title} by {record.builder_name}
Location: {record.location}, {record.city}
Status: {record.status}
Price Range: {record.price_range}
Configuration: {", ".join(configuration_labels) if configuration_labels else record.configuration}
Amenities: {", ".join(amenity_names) if amenity_names else clean_json_field(record.amenities)}
Description: {record.description}"""

    elif isinstance(record, Builder):
        unique_id = f"builder_{record.id}"
        metadata = {"id": str(record.id), "type": "builder", "city": record.city or "Unknown"}
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
        if isinstance(data, list):
            parts = []
            for item in data:
                if isinstance(item, dict):
                    # For unit configs, show a human-readable summary
                    bhk = item.get('type') or item.get('bhk_type') or ''
                    area_min = item.get('carpet_area_min')
                    area_max = item.get('carpet_area_max')
                    price_from = item.get('price_from')
                    price_to = item.get('price_to')
                    unit = item.get('area_unit') or 'sqft'
                    label = bhk
                    if area_min and area_max and area_min != area_max:
                        label += f" ({area_min}–{area_max} {unit})"
                    elif area_min:
                        label += f" ({area_min} {unit})"
                    if price_from and price_to and price_from != price_to:
                        label += f" ₹{price_from}–{price_to} Cr"
                    elif price_from:
                        label += f" ₹{price_from} Cr"
                    parts.append(label.strip())
                else:
                    parts.append(str(item))
            return ", ".join(parts) if parts else "Not Specified"
        if isinstance(data, dict):
            return str(data)
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
            print(f"  Warning: could not fetch existing IDs ({exc}); will upsert all.")
    except Exception:
        existing_ids = set()

    new_docs = [d for d, uid in zip(all_docs, all_ids) if uid not in existing_ids]
    new_ids  = [uid for uid in all_ids if uid not in existing_ids]

    if not new_docs:
        print("All data is already up to date in PGVector.")
        return

    print(f"Syncing {len(new_docs)} new items to PGVector...")
    BATCH_SIZE = 50
    for i in range(0, len(new_docs), BATCH_SIZE):
        batch_docs = new_docs[i:i + BATCH_SIZE]
        batch_ids  = new_ids[i:i + BATCH_SIZE]
        try:
            vectorstore.add_documents(documents=batch_docs, ids=batch_ids)
            print(f"  Batch {i // BATCH_SIZE + 1} ok ({len(batch_docs)} docs)")
        except Exception as e:
            print(f"  Batch {i // BATCH_SIZE + 1} error: {e}")
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
    sync_prefs = sync_extract_params(user_message)
    if sync_prefs:
        update_user_preferences_db(user_id, sync_prefs)

    llm = _create_chat_llm(temperature=0.0, max_output_tokens=300)
    prompt = """Analyze the message for Real Estate preferences.
Extract ONLY: location, budget, bhk, possession.
Return valid JSON.
Message: "{message}" """
    
    try:
        response = llm.invoke(prompt.format(message=user_message))
        content = response.content.strip().replace("```json", "").replace("```", "")
        data = json.loads(content)
        if data:
            print(f"Learned preferences: {data}")
            
            if 'budget' in data and isinstance(data['budget'], dict):
                if 'max' in data['budget']:
                    data['budget'] = data['budget']['max']
                elif 'min' in data['budget']:
                    data['budget'] = data['budget']['min']
                else:
                    data['budget'] = str(data['budget'])
            
            merged = dict(sync_prefs or {})
            merged.update(data)
            update_user_preferences_db(user_id, merged)
    except Exception as e:
        print(f"Auto-learn error: {e}")


def update_user_preferences_db(user_id, prefs):
    """Update user preferences in database"""
    from extensions import db
    try:
        resolved_user_id = _resolve_local_user_id(user_id)
        if not resolved_user_id:
            print(f"Skipping preference update; could not resolve local user id from {user_id!r}")
            return

        for k, v in prefs.items():
            if not v: continue
            existing = UserPreference.query.filter_by(user_id=resolved_user_id, pref_key=k).first()
            if existing: 
                existing.pref_value = str(v)
            else: 
                db.session.add(UserPreference(user_id=resolved_user_id, pref_key=k, pref_value=str(v)))
        db.session.commit()
    except Exception as e:
        print(f"Error updating preferences: {e}")
        db.session.rollback()


def _resolve_local_user_id(user_id):
    """
    Normalize a local integer id or Clerk id string to the local user.id.
    """
    if user_id in (None, ""):
        return None

    if isinstance(user_id, int):
        return user_id if User.query.get(user_id) else None

    value = str(user_id).strip()
    if not value:
        return None

    if value.isdigit():
        user = User.query.get(int(value))
        if user:
            return user.id

    user = User.query.filter_by(clerk_user_id=value).first()
    return user.id if user else None


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


def _format_budget_label(user_budget):
    if user_budget in (None, ""):
        return None
    try:
        value = float(user_budget)
    except (TypeError, ValueError):
        return str(user_budget)

    if value >= 1:
        return f"{value:g} Cr"
    return f"{round(value * 100):g} L"


def _is_direct_listing_query(user_query, target="property"):
    text = _normalize_for_match(user_query)
    if not text:
        return False

    tokens = [token for token in text.split() if token]
    if len(tokens) > 6:
        return False

    common_tokens = {
        'show', 'find', 'list', 'search', 'in', 'at', 'near', 'me', 'all',
        'available', 'with', 'under', 'below', 'upto'
    }
    property_tokens = {'prop', 'props', 'property', 'properties', 'project', 'projects', 'flat', 'flats', 'home', 'homes', 'apartment', 'apartments', 'bhk'}
    builder_tokens = {'builder', 'builders', 'developer', 'developers'}

    target_tokens = property_tokens if target == "property" else builder_tokens
    if not any(token in target_tokens for token in tokens):
        return False

    question_tokens = {'why', 'how', 'which', 'better', 'best', 'compare', 'difference', 'details', 'about', 'tell', 'explain'}
    if any(token in question_tokens for token in tokens):
        return False

    return True


def summarize_property_search_results(props, location=None, budget=None, budget_min=None, bhk=None, user_query=None):
    if not props:
        filters = []
        if bhk:
            filters.append(f"{bhk} BHK")
        if location:
            filters.append(f"in {str(location).title()}")
        if budget_min:
            filters.append(f"above {_format_budget_label(budget_min)}")
        elif budget:
            filters.append(f"within {_format_budget_label(budget)}")

        if _is_direct_listing_query(user_query, target="property"):
            if filters:
                return "No properties found " + " ".join(filters) + "."
            return "No matching properties found."

        if filters:
            return (
                "I couldn't find matching properties "
                + " ".join(filters)
                + ". Try relaxing the budget, BHK, or location filters."
            )
        return "I couldn't find matching properties for that query. Try adding a location, budget, or BHK."

    if _is_direct_listing_query(user_query, target="property"):
        parts = [f"Showing {len(props)}"]
        if bhk:
            parts.append(f"{bhk} BHK")
        parts.append("properties")
        if location:
            parts.append(f"in {str(location).title()}")
        if budget_min:
            parts.append(f"above {_format_budget_label(budget_min)}")
        elif budget:
            parts.append(f"within {_format_budget_label(budget)}")
        return " ".join(parts) + "."

    scope = []
    if bhk:
        scope.append(f"{bhk} BHK")
    scope.append("properties")
    if location:
        scope.append(f"in {str(location).title()}")
    if budget_min:
        scope.append(f"above {_format_budget_label(budget_min)}")
    elif budget:
        scope.append(f"within {_format_budget_label(budget)}")

    response = [f"I found {len(props)} matching {' '.join(scope)}."]

    price_samples = [
        str(getattr(prop, 'Price_Starting_From', '')).strip()
        for prop in props[:3]
        if getattr(prop, 'Price_Starting_From', None)
    ]
    if price_samples:
        response.append(f"Some of the strongest matches start around {price_samples[0]}.")

    response.append("I'm sharing the most relevant property cards below. Ask for details on any card if you want a deeper breakdown.")
    return " ".join(response)


def summarize_builder_search_results(builders, location=None, user_query=None):
    if not builders:
        if _is_direct_listing_query(user_query, target="builder"):
            if location:
                return f"No builders found in {str(location).title()}."
            return "No matching builders found."

        if location:
            return f"I couldn't find matching builders in {str(location).title()} for that query. Try another city or area."
        return "I couldn't find matching builders for that query. Try adding a builder name or location."

    if _is_direct_listing_query(user_query, target="builder"):
        if location:
            return f"Showing {len(builders)} builders in {str(location).title()}."
        return f"Showing {len(builders)} builders."

    location_label = f" in {str(location).title()}" if location else ""
    top_names = [
        getattr(builder, 'company_name', None)
        for builder in builders[:3]
        if getattr(builder, 'company_name', None)
    ]
    strongest = builders[0]
    strongest_projects = (
        f"{getattr(strongest, 'completed_projects', 0) or 0} completed"
        if getattr(strongest, 'completed_projects', None) is not None
        else None
    )

    lines = [f"I found {len(builders)} strong builder matches{location_label}."]
    if top_names:
        lines.append(f"Top names include {', '.join(top_names)}.")
    if strongest_projects and top_names:
        lines.append(f"{top_names[0]} stands out with {strongest_projects} projects.")
    lines.append("I’m loading the most relevant builder cards below, and I can compare any two if you want.")
    return "\n".join(lines)


def compare_builders(builders):
    """
    Return a concise comparison intro for up to 5 builders.
    The frontend renders the point-wise comparison table.
    """
    builders = [b for b in (builders or []) if b][:5]
    if not builders:
        return "I need builders to compare. Could you specify which ones?"
    if len(builders) < 2:
        return "I found only one builder to compare. Share another builder name or ask for builders in a city."

    def _builder_name(b):
        if hasattr(b, 'company_name'):
            return b.company_name or getattr(b, 'brand_name', None)
        if isinstance(b, dict):
            return b.get('company_name') or b.get('brand_name') or b.get('name')
        return None

    names = [n for n in (_builder_name(b) for b in builders) if n]

    if len(names) >= 2:
        if len(names) == 2:
            intro = f"Here's how {names[0]} compares to {names[1]}."
        else:
            intro = f"I compared {', '.join(names[:-1])} and {names[-1]} side by side."
    else:
        intro = f"I compared {len(builders)} builders point by point."

    return intro + (
        " The table below highlights their experience, footprint, project counts, "
        "RERA status, and verification."
    )


def compare_properties(props):
    """
    Return a concise comparison intro for up to 5 properties.
    The frontend renders the point-wise comparison table.
    """
    props = [p for p in (props or []) if p][:5]
    if not props:
        return "I need properties to compare. Could you specify which ones?"
    if len(props) < 2:
        return "I found only one property to compare. Share another property name or refine the query."

    def _prop_name(p):
        if hasattr(p, 'Property_Name'):
            return p.Property_Name
        if isinstance(p, dict):
            return p.get('Property_Name') or p.get('name')
        return None

    names = [n for n in (_prop_name(p) for p in props) if n]

    if len(names) >= 2:
        if len(names) == 2:
            intro = f"Here's how {names[0]} compares to {names[1]}."
        else:
            intro = f"I compared {', '.join(names[:-1])} and {names[-1]} side by side."
    else:
        intro = f"I compared {len(props)} properties point by point."

    return intro + (
        " The table below covers builder, location, starting price, configuration, "
        "status, possession, carpet area, highlights, and RERA."
    )


def _property_matches_filters(prop, location=None, bhk=None, budget=None, budget_min=None):
    if not prop:
        return False

    if location and not _matches_location([prop.Location, prop.Address], location):
        return False

    if bhk:
        config_text = _normalize_for_match(clean_json_field(getattr(prop, 'Existing_Configurations', '')))
        target = _normalize_for_match(str(bhk).replace('BHK', '').strip())
        if target and target not in config_text and f"{target} bhk" not in config_text:
            return False

    if budget or budget_min:
        try:
            min_price, max_price = SmartFilter.parse_price_range(getattr(prop, 'Price_Starting_From', None))
            price_value = min_price if min_price > 0 else SmartFilter.parse_price(getattr(prop, 'Price_Starting_From', None))

            if budget:
                # Exclude properties whose starting price exceeds the max budget (5% rounding tolerance)
                if price_value and price_value > float(budget) * 1.05:
                    return False
                # Exclude if the full price range goes significantly beyond the budget
                if max_price > 0 and max_price > float(budget) * 1.1:
                    return False

            if budget_min:
                # Exclude properties entirely below the minimum budget
                effective_price = max_price if max_price > 0 else price_value
                if effective_price and effective_price < float(budget_min) * 0.95:
                    return False
        except Exception:
            pass

    return True


def _merge_unique_records(primary_records, secondary_records=None, key_func=None, limit=20):
    secondary_records = secondary_records or []
    key_func = key_func or (lambda item: getattr(item, 'id', None))

    merged = []
    seen = set()
    for record in list(primary_records or []) + list(secondary_records or []):
        if not record:
            continue
        key = key_func(record)
        if key in (None, "") or key in seen:
            continue
        seen.add(key)
        merged.append(record)
        if len(merged) >= limit:
            break
    return merged


def _clean_compare_segment(segment, location=None, bhk=None):
    text = _normalize_for_match(segment)
    if not text:
        return ""

    text = re.sub(
        r"\b(compare|comparing|comparison|between|versus|vs|with|please|show|tell|me|which|one|is|better|best)\b",
        " ",
        text,
    )
    text = re.sub(
        r"\b(property|properties|project|projects|builder|builders|developer|developers)\b",
        " ",
        text,
    )

    if location:
        loc = _normalize_for_match(location)
        if loc:
            text = re.sub(rf"\b(?:in|at|near)\s+{re.escape(loc)}\b", " ", text)
            text = re.sub(rf"\b{re.escape(loc)}\b", " ", text)

    if bhk:
        bhk_text = _normalize_for_match(str(bhk))
        if bhk_text:
            text = re.sub(rf"\b{re.escape(bhk_text)}\s*bhk\b", " ", text)
            text = re.sub(rf"\b{re.escape(bhk_text)}\b", " ", text)

    text = re.sub(
        r"\b(?:under|below|max|upto)\s+\d+(?:\.\d+)?\s*(?:cr|crore|lakh|lac|l|k)\b",
        " ",
        text,
    )
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _extract_compare_segments(user_query, location=None, bhk=None):
    original = str(user_query or "")
    if not original.strip():
        return []

    quoted_segments = [
        _clean_compare_segment(match[0] or match[1], location=location, bhk=bhk)
        for match in re.findall(r'"([^"]+)"|\'([^\']+)\'', original)
    ]
    quoted_segments = [segment for segment in quoted_segments if segment]
    if len(quoted_segments) >= 2:
        return quoted_segments[:5]

    working = _normalize_for_match(original)
    if " between " in working:
        working = working.split(" between ", 1)[1]
        working = re.sub(r"\band\b", "|", working)
    elif " compare " in f" {working} ":
        working = re.split(r"\bcompare\b", working, maxsplit=1)[-1]

    working = re.sub(r"\bversus\b|\bvs\b|&", "|", working)
    working = re.sub(r"\s*,\s*", "|", working)
    if "|" not in working and " and " in working:
        working = working.replace(" and ", "|")

    segments = []
    seen = set()
    for part in working.split("|"):
        cleaned = _clean_compare_segment(part, location=location, bhk=bhk)
        if not cleaned or cleaned in seen:
            continue
        seen.add(cleaned)
        segments.append(cleaned)

    return segments[:5]


def _score_phrase_against_aliases(phrase, aliases):
    phrase_norm = _normalize_for_match(phrase)
    if not phrase_norm:
        return 0

    phrase_tokens = [token for token in phrase_norm.split() if len(token) > 1]
    best_score = 0

    for alias in aliases:
        alias_norm = _normalize_for_match(alias)
        if not alias_norm:
            continue

        alias_tokens = [token for token in alias_norm.split() if len(token) > 1]
        token_overlap = sum(1 for token in phrase_tokens if token in alias_tokens)
        score = 0

        if phrase_norm == alias_norm:
            score = 150 + len(alias_tokens)
        elif phrase_norm in alias_norm or alias_norm in phrase_norm:
            score = 120 + min(len(alias_norm), len(phrase_norm))
        elif phrase_tokens and all(token in alias_tokens for token in phrase_tokens):
            score = 95 + (token_overlap * 8)
        elif token_overlap >= 2:
            score = 70 + (token_overlap * 8)
        elif token_overlap == 1 and len(phrase_tokens) == 1 and len(phrase_norm) >= 5:
            score = 55 + len(phrase_norm)

        if score > best_score:
            best_score = score

    return best_score


def _resolve_specific_builder_candidates(user_query, location=None, limit=5):
    builders = Builder.query.all()
    if not builders:
        return [], []

    segments = _extract_compare_segments(user_query, location=location)
    if not segments:
        return [], []

    resolved = []
    used_ids = set()

    for segment in segments:
        best_builder = None
        best_score = 0
        for builder in builders:
            builder_id = getattr(builder, 'id', None)
            if not builder_id or builder_id in used_ids:
                continue

            aliases = [
                getattr(builder, 'company_name', ''),
                getattr(builder, 'brand_name', ''),
            ]
            score = _score_phrase_against_aliases(segment, aliases)
            if score > best_score:
                best_score = score
                best_builder = builder

        if best_builder and best_score >= 60:
            used_ids.add(best_builder.id)
            resolved.append(best_builder)
            if len(resolved) >= limit:
                break

    return segments, resolved


def _resolve_specific_property_candidates(user_query, location=None, bhk=None, limit=5):
    properties = Property.query.all()
    if not properties:
        return [], []

    segments = _extract_compare_segments(user_query, location=location, bhk=bhk)
    if not segments:
        return [], []

    resolved = []
    used_ids = set()

    for segment in segments:
        best_property = None
        best_score = 0
        for prop in properties:
            prop_id = getattr(prop, 'id', None)
            if not prop_id or prop_id in used_ids:
                continue

            aliases = [
                getattr(prop, 'Property_Name', ''),
                f"{getattr(prop, 'Property_Name', '')} {getattr(prop, 'Builder_Name', '')}".strip(),
            ]
            score = _score_phrase_against_aliases(segment, aliases)
            if score > best_score:
                best_score = score
                best_property = prop

        if best_property and best_score >= 60:
            used_ids.add(best_property.id)
            resolved.append(best_property)
            if len(resolved) >= limit:
                break

    return segments, resolved


def _infer_compare_target(user_query, last_intent=None, last_result_type=None):
    msg_lower = (user_query or "").lower()

    if any(token in msg_lower for token in ['builder', 'builders', 'developer', 'developers', 'construction']):
        return 'builder'
    if any(token in msg_lower for token in ['property', 'properties', 'project', 'projects', 'apartment', 'flat', 'home', 'homes']):
        return 'property'

    if last_result_type in ['builder', 'property']:
        return last_result_type

    if last_intent == UserIntent.SEARCH_BUILDERS.value:
        return 'builder'
    if last_intent in [UserIntent.SEARCH_PROPERTIES.value, UserIntent.COMPARE_PROPERTIES.value]:
        return 'property'

    return 'property'


def _search_builders_from_vector(user_query, location=None, limit=20, search_k=25, fetch_k=50):
    try:
        retriever = vectorstore.as_retriever(
            search_type="mmr",
            search_kwargs={"k": search_k, "fetch_k": fetch_k, "lambda_mult": 0.7},
        )
        docs = retriever.get_relevant_documents(user_query)
    except Exception as e:
        print(f"Builder vector search error: {e}")
        return []

    results = []
    seen = set()
    for doc in docs:
        if doc.metadata.get('type') != 'builder':
            continue

        builder_id = doc.metadata.get('id')
        if not builder_id:
            continue

        builder = Builder.query.get(builder_id)
        if not builder:
            continue

        builder_id = getattr(builder, 'id', None)

        if not builder_id or builder_id in seen:
            continue

        if location and not _matches_location(
            [builder.city, builder.location, builder.corporate_address],
            location,
        ):
            continue

        seen.add(builder_id)
        results.append(builder)
        if len(results) >= limit:
            break

    return results


def _search_builders_from_db(user_query, location=None, limit=10):
    query_text = (user_query or "").strip().lower()
    location_text = (location or "").strip()

    builders = Builder.query.all()
    if not builders:
        return []

    query_tokens = [
        token for token in re.findall(r"[a-z0-9]+", query_text)
        if len(token) > 2 and token not in {
            'show', 'find', 'builder', 'builders', 'developer', 'developers',
            'company', 'companies', 'realty', 'projects', 'project', 'best',
            'top', 'me', 'in', 'at', 'near', 'for'
        }
    ]

    scored = []
    for builder in builders:
        haystacks = [
            getattr(builder, 'company_name', ''),
            getattr(builder, 'brand_name', ''),
            getattr(builder, 'city', ''),
            getattr(builder, 'location', ''),
            getattr(builder, 'corporate_address', ''),
            getattr(builder, 'short_description', ''),
            getattr(builder, 'detailed_description', ''),
        ]
        normalized = " ".join(_normalize_for_match(value) for value in haystacks if value)

        score = 0
        matched_location = False
        matched_query = False
        if location_text and _matches_location(
            [builder.city, builder.location, builder.corporate_address],
            location_text,
        ):
            score += 6
            matched_location = True

        if query_tokens:
            for token in query_tokens:
                if token in normalized:
                    score += 4
                    matched_query = True

        if not query_tokens and not location_text:
            score += 2
        elif not matched_query and not matched_location:
            continue

        score += min(int(getattr(builder, 'completed_projects', 0) or 0), 100) / 20
        score += min(int(getattr(builder, 'ongoing_projects', 0) or 0), 50) / 25
        if getattr(builder, 'verified', False):
            score += 1.5
        if getattr(builder, 'rera_registered', False):
            score += 1

        if score > 0:
            scored.append((score, builder))

    scored.sort(
        key=lambda item: (
            -item[0],
            -(getattr(item[1], 'completed_projects', 0) or 0),
            getattr(item[1], 'company_name', '') or '',
        )
    )
    results = []
    seen = set()

    for _, builder in scored:
        bid = getattr(builder, 'id', None)

        if not bid or bid in seen:
            continue

        seen.add(bid)
        results.append(builder)

        if len(results) >= limit:
            break

    return results


def _search_properties_from_vector(user_query, location=None, bhk=None, budget=None, budget_min=None, limit=20, search_k=25, fetch_k=50):
    try:
        retriever = vectorstore.as_retriever(
            search_type="mmr",
            search_kwargs={"k": search_k, "fetch_k": fetch_k, "lambda_mult": 0.7},
        )
        docs = retriever.get_relevant_documents(user_query)
    except Exception as e:
        print(f"Property vector search error: {e}")
        return []

    results = []
    seen = set()
    for doc in docs:
        if doc.metadata.get('type') != 'property':
            continue

        prop_id = doc.metadata.get('id')
        if not prop_id:
            continue

        try:
            prop = Property.query.get(int(prop_id))
        except (TypeError, ValueError):
            prop = None

        if not prop or prop.id in seen:
            continue
        if not _property_matches_filters(prop, location=location, bhk=bhk, budget=budget, budget_min=budget_min):
            continue

        seen.add(prop.id)
        results.append(prop)
        if len(results) >= limit:
            break

    return results


def _search_properties_from_db(user_query, location=None, bhk=None, budget=None, budget_min=None, limit=20):
    query_text = (user_query or "").strip().lower()
    location_text = (location or "").strip()

    properties = Property.query.all()
    if not properties:
        return []

    query_tokens = [
        token for token in re.findall(r"[a-z0-9]+", query_text)
        if len(token) > 2 and not token.isdigit() and token not in {
            'show', 'find', 'property', 'properties', 'project', 'projects', 'compare',
            'difference', 'versus', 'better', 'between', 'builder', 'builders',
            'developer', 'developers', 'flat', 'flats', 'home', 'homes',
            'apartment', 'apartments', 'bhk', 'under', 'below', 'near', 'best',
            'top', 'available', 'options', 'list', 'display', 'me', 'in', 'at', 'for'
        }
    ]

    scored = []
    for prop in properties:
        if not _property_matches_filters(prop, location=location, bhk=bhk, budget=budget, budget_min=budget_min):
            continue

        haystacks = [
            getattr(prop, 'Property_Name', ''),
            getattr(prop, 'Builder_Name', ''),
            getattr(prop, 'Location', ''),
            getattr(prop, 'Address', ''),
            clean_json_field(getattr(prop, 'Highlights', '')),
            clean_json_field(getattr(prop, 'Key_Highlights', '')),
            clean_json_field(getattr(prop, 'Existing_Configurations', '')),
            getattr(prop, 'Project_Status', ''),
        ]
        normalized = " ".join(_normalize_for_match(value) for value in haystacks if value)

        score = 0
        matched_location = False
        matched_query = False

        if location_text and _matches_location([prop.Location, prop.Address], location_text):
            score += 6
            matched_location = True

        if bhk:
            score += 4

        if budget:
            try:
                price_value = SmartFilter.parse_price(getattr(prop, 'Price_Starting_From', None))
                if price_value:
                    if price_value <= float(budget):
                        score += 4
                    else:
                        score += 1
            except Exception:
                pass

        if query_tokens:
            for token in query_tokens:
                if token in normalized:
                    score += 3
                    matched_query = True

        if not query_tokens and not location_text and not bhk and not budget:
            score += 1
        elif not matched_query and not matched_location and not bhk and not budget:
            continue

        scored.append((score, prop))

    scored.sort(
        key=lambda item: (
            -item[0],
            SmartFilter.parse_price(getattr(item[1], 'Price_Starting_From', None)) or float('inf'),
            getattr(item[1], 'Property_Name', '') or '',
        )
    )

    results = []
    seen = set()
    for _, prop in scored:
        pid = getattr(prop, 'id', None)
        if pid in seen or pid is None:
            continue
        seen.add(pid)
        results.append(prop)
        if len(results) >= limit:
            break

    return results


def _get_memory_property_candidates(conversation_memory, limit=5):
    if not conversation_memory:
        return []

    property_ids = [
        str(pid) for pid in conversation_memory.entities.get('property_ids', [])
        if pid not in (None, "")
    ]
    if not property_ids:
        return []

    seen = set()
    props = []
    for pid in property_ids:
        if pid in seen:
            continue
        seen.add(pid)
        try:
            prop = Property.query.get(int(pid))
        except (TypeError, ValueError):
            prop = None
        if prop:
            props.append(prop)
        if len(props) >= limit:
            break
    return props


# ============================================
# ENHANCED MAIN CHATBOT RESPONSE
# ============================================

def get_chatbot_response(user_query, user_id=None, chat_history=[], session_shown_ids=None, conversation_memory=None, last_intent=None, last_result_type=None):
    """
    Enhanced chatbot with intent-based responses
    Returns: (response_text, shown_ids, all_properties, all_builders, intent, buffered_responses)
    """
    
    user_id = _resolve_local_user_id(user_id)

    if session_shown_ids is None:
        session_shown_ids = set()
    
    # SYNC UPDATE MEMORY FIRST
    params = sync_extract_params(user_query)

    # If current message has no location, try to recover one from recent chat history
    if not params.get('location') and chat_history:
        for past_user_msg, _ in reversed(chat_history[-5:]):
            past_params = sync_extract_params(past_user_msg)
            if past_params.get('location'):
                params['location'] = past_params['location']
                break

    if conversation_memory:
        conversation_memory.update_from_sync_params(params)
    
    # CLASSIFY INTENT FIRST
    intent = classify_intent(user_query)
    
    print(f"Detected intent: {intent.value}")
    
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
                llm_tmp = _create_chat_llm(temperature=0.2, max_output_tokens=500)
                tmp_retriever = vectorstore.as_retriever(search_type="mmr", search_kwargs={"k": 8, "fetch_k": 40, "lambda_mult": 0.7})
                tmp_chain = ConversationalRetrievalChain.from_llm(llm=llm_tmp, retriever=tmp_retriever, condense_question_prompt=PromptTemplate.from_template("Q:{question}\nStandalone:"), combine_docs_chain_kwargs={"prompt": PromptTemplate.from_template("Context: {context}\nQuestion: {question}\n" )}, return_source_documents=True)
                tmp_res = tmp_chain.invoke({"question": user_query, "chat_history": chat_history})
                small_docs = tmp_res.get('source_documents', [])

            # Extract meaningful name tokens from the user query so we can
            # verify the vector result actually matches what was asked for.
            # Strip generic words and keep the specific name fragments.
            _detail_stop = {
                'tell', 'me', 'more', 'about', 'details', 'of', 'on', 'the',
                'property', 'properties', 'project', 'projects', 'flat', 'apartment',
                'home', 'builder', 'buildings', 'info', 'information', 'give',
                'show', 'what', 'is', 'are', 'find', 'explain', 'describe',
            }
            query_name_tokens = [
                t for t in re.findall(r'[a-z0-9]+', user_query.lower())
                if t not in _detail_stop and len(t) > 1
            ]

            def _name_score(candidate_name):
                """How many query tokens appear in the candidate name."""
                if not candidate_name:
                    return 0
                cn = re.sub(r'[^a-z0-9\s]', ' ', candidate_name.lower())
                cn_tokens = set(cn.split())
                return sum(1 for t in query_name_tokens if t in cn_tokens)

            # Prefer property/project docs that match the queried name.
            # Score all candidates and pick the best match (min score 1).
            best_prop, best_prop_score = None, 0
            best_builder, best_builder_score = None, 0

            for doc in small_docs:
                t = doc.metadata.get('type')
                if t in ['property', 'project']:
                    pid = doc.metadata.get('id')
                    if not pid:
                        continue
                    try:
                        prop = Property.query.get(int(pid))
                    except (TypeError, ValueError):
                        prop = None
                    if not prop:
                        continue
                    score = _name_score(prop.Property_Name)
                    if score > best_prop_score:
                        best_prop_score, best_prop = score, prop
                elif t == 'builder':
                    bid = doc.metadata.get('id')
                    if not bid:
                        continue
                    try:
                        builder = Builder.query.get(bid)
                    except Exception:
                        builder = None
                    if not builder:
                        continue
                    score = _name_score(builder.company_name or builder.brand_name)
                    if score > best_builder_score:
                        best_builder_score, best_builder = score, builder

            # Return the best-matching item (prefer property over builder when tied)
            if best_prop and best_prop_score >= 1:
                detailed = format_property_details(best_prop)
                session_shown_ids.add(str(best_prop.id))
                if user_id:
                    extract_and_save_preferences(user_query, user_id)
                return detailed, session_shown_ids, [best_prop], [], intent.value, []

            if best_builder and best_builder_score >= 1:
                detailed = format_builder_details(best_builder)
                session_shown_ids.add(str(best_builder.id))
                if user_id:
                    extract_and_save_preferences(user_query, user_id)
                return detailed, session_shown_ids, [], [best_builder], intent.value, []

            # No name match from vector results — try a direct DB name search before
            # giving up. This handles properties that are in the DB but not yet indexed
            # in the vector store, or where the vector search ranked them too low.
            if not best_prop and query_name_tokens:
                all_props = Property.query.all()
                db_best, db_best_score = None, 0
                for p in all_props:
                    s = _name_score(p.Property_Name)
                    if s > db_best_score:
                        db_best_score, db_best = s, p
                if db_best and db_best_score >= 2:
                    detailed = format_property_details(db_best)
                    session_shown_ids.add(str(db_best.id))
                    if user_id:
                        extract_and_save_preferences(user_query, user_id)
                    return detailed, session_shown_ids, [db_best], [], intent.value, []

            if not best_builder and query_name_tokens:
                all_builders = Builder.query.all()
                db_best_b, db_best_b_score = None, 0
                for b in all_builders:
                    s = _name_score(b.company_name or b.brand_name)
                    if s > db_best_b_score:
                        db_best_b_score, db_best_b = s, b
                if db_best_b and db_best_b_score >= 2:
                    detailed = format_builder_details(db_best_b)
                    session_shown_ids.add(str(db_best_b.id))
                    if user_id:
                        extract_and_save_preferences(user_query, user_id)
                    return detailed, session_shown_ids, [], [db_best_b], intent.value, []

            # If we didn't find a direct DB item, ask the LLM for a detailed answer using retrieved context
            try:
                small_ctx = "\n\n---\n\n".join([d.page_content for d in small_docs[:6]])
                llm_detailed = _create_chat_llm(temperature=0.2, max_output_tokens=800)
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
            mem_prefs = conversation_memory.get_current_preferences() if conversation_memory else {}
            loc = params.get('location') or mem_prefs.get('location')
            budget = params.get('budget') or mem_prefs.get('budget')
            bhk = params.get('bhk') or mem_prefs.get('bhk')
            compare_target = _infer_compare_target(
                user_query,
                last_intent=last_intent,
                last_result_type=last_result_type,
            )
            explicit_builder_segments, explicit_builder_matches = _resolve_specific_builder_candidates(
                user_query,
                location=loc,
                limit=5,
            )
            explicit_property_segments, explicit_property_matches = _resolve_specific_property_candidates(
                user_query,
                location=loc,
                bhk=bhk,
                limit=5,
            )

            if compare_target == 'property' and len(explicit_builder_matches) >= 2 and len(explicit_property_matches) < 2:
                compare_target = 'builder'
            elif compare_target == 'builder' and len(explicit_property_matches) >= 2 and len(explicit_builder_matches) < 2:
                compare_target = 'property'

            if compare_target == 'builder':
                explicit_builder_mode = len(explicit_builder_segments) >= 2 and len(explicit_builder_matches) > 0
                if len(explicit_builder_matches) >= 2:
                    comparison = compare_builders(explicit_builder_matches)
                    for builder in explicit_builder_matches:
                        session_shown_ids.add(str(builder.id))
                    if user_id:
                        extract_and_save_preferences(user_query, user_id)
                    return comparison, session_shown_ids, [], explicit_builder_matches, intent.value, []

                if explicit_builder_mode:
                    return (
                        "I matched only one of the builder names you asked to compare. Please share the exact second builder name and I'll compare only those builders.",
                        session_shown_ids,
                        [],
                        explicit_builder_matches,
                        intent.value,
                        [],
                    )

                builder_candidates = _merge_unique_records(
                    _search_builders_from_db(user_query, location=loc, limit=10),
                    _search_builders_from_vector(user_query, location=loc, limit=10, search_k=10, fetch_k=30),
                    key_func=lambda builder: getattr(builder, 'id', None),
                    limit=5,
                )

                if len(builder_candidates) >= 2:
                    comparison = compare_builders(builder_candidates)
                    for builder in builder_candidates:
                        session_shown_ids.add(str(builder.id))
                    if user_id:
                        extract_and_save_preferences(user_query, user_id)
                    return comparison, session_shown_ids, [], builder_candidates, intent.value, []

                if len(builder_candidates) == 1:
                    return (
                        "I found only one clear builder match. Add another builder name or city and I'll compare them side by side.",
                        session_shown_ids,
                        [],
                        builder_candidates,
                        intent.value,
                        [],
                    )

                if loc:
                    return (
                        f"I couldn't find enough builders to compare in {str(loc).title()}. Try another city or mention builder names.",
                        session_shown_ids,
                        [],
                        [],
                        intent.value,
                        [],
                    )

                return (
                    "Tell me which builders or city you want compared, and I'll line up the top 5 best fits.",
                    session_shown_ids,
                    [],
                    [],
                    intent.value,
                    [],
                )

            explicit_property_mode = len(explicit_property_segments) >= 2 and len(explicit_property_matches) > 0
            if len(explicit_property_matches) >= 2:
                comparison = compare_properties(explicit_property_matches)
                for prop in explicit_property_matches:
                    session_shown_ids.add(str(prop.id))
                if user_id:
                    extract_and_save_preferences(user_query, user_id)
                return comparison, session_shown_ids, explicit_property_matches, [], intent.value, []

            if explicit_property_mode:
                return (
                    "I matched only one of the property names you asked to compare. Please share the exact second property name and I'll compare only those properties.",
                    session_shown_ids,
                    explicit_property_matches,
                    [],
                    intent.value,
                    [],
                )

            strict_candidates = _merge_unique_records(
                _search_properties_from_db(user_query, location=loc, bhk=bhk, budget=budget, limit=10),
                _search_properties_from_vector(user_query, location=loc, bhk=bhk, budget=budget, limit=10, search_k=10, fetch_k=30),
                key_func=lambda prop: getattr(prop, 'id', None),
                limit=5,
            )

            relaxed_candidates = []
            if len(strict_candidates) < 2:
                relaxed_candidates = _merge_unique_records(
                    _search_properties_from_db(user_query, location=loc, bhk=bhk, budget=None, limit=10),
                    _search_properties_from_vector(user_query, location=loc, bhk=bhk, budget=None, limit=10, search_k=10, fetch_k=30),
                    key_func=lambda prop: getattr(prop, 'id', None),
                    limit=5,
                )

            top_5 = strict_candidates if len(strict_candidates) >= 2 else relaxed_candidates

            if len(top_5) >= 2:
                comparison = compare_properties(top_5)
                for prop in top_5:
                    session_shown_ids.add(str(prop.id))
                if user_id:
                    extract_and_save_preferences(user_query, user_id)
                return comparison, session_shown_ids, top_5, [], intent.value, []

            if len(top_5) == 1:
                return (
                    "I found only one clear property match. Share another property name, location, budget, or BHK and I'll compare them properly.",
                    session_shown_ids,
                    top_5,
                    [],
                    intent.value,
                    [],
                )

            if loc:
                return (
                    f"I couldn't find enough properties to compare in {str(loc).title()}. Try widening the budget, BHK, or area.",
                    session_shown_ids,
                    [],
                    [],
                    intent.value,
                    [],
                )

            return (
                "Tell me which properties or area you want compared, and I'll bring back the top 5 best fits.",
                session_shown_ids,
                [],
                [],
                intent.value,
                [],
            )

        except Exception as e:
            print(f"COMPARE handler error: {e}")

    # Adjust retrieval based on intent
    if intent == UserIntent.SEARCH_BUILDERS:
        search_k = 25
        fetch_k = 50
        filter_type = "builder"
        loc = None
        try:
            mem_prefs = conversation_memory.get_current_preferences() if conversation_memory else {}
            loc = params.get('location') or mem_prefs.get('location')
            builders_from_vector = _search_builders_from_vector(
                user_query,
                location=loc,
                limit=20,
                search_k=search_k,
                fetch_k=fetch_k,
            )

            if builders_from_vector:
                for builder in builders_from_vector[:10]:
                    if getattr(builder, 'id', None):
                        session_shown_ids.add(str(builder.id))

                if user_id:
                    extract_and_save_preferences(user_query, user_id)

                return (
                    summarize_builder_search_results(builders_from_vector, location=loc, user_query=user_query),
                    session_shown_ids,
                    [],
                    builders_from_vector,
                    intent.value,
                    generate_buffered_responses([], builders_from_vector, intent.value),
                )

            builders_from_db = _search_builders_from_db(user_query, location=loc, limit=20)

            if builders_from_db:
                for builder in builders_from_db[:10]:
                    if getattr(builder, 'id', None):
                        session_shown_ids.add(str(builder.id))

                if user_id:
                    extract_and_save_preferences(user_query, user_id)

                return (
                    summarize_builder_search_results(builders_from_db, location=loc, user_query=user_query),
                    session_shown_ids,
                    [],
                    builders_from_db,
                    intent.value,
                    generate_buffered_responses([], builders_from_db, intent.value),
                )

            return (
                summarize_builder_search_results([], location=loc, user_query=user_query),
                session_shown_ids,
                [],
                [],
                intent.value,
                [],
            )
        except Exception as e:
            print(f"Builder DB fallback error: {e}")
            return (
                summarize_builder_search_results([], location=loc, user_query=user_query),
                session_shown_ids,
                [],
                [],
                intent.value,
                [],
            )
    elif intent == UserIntent.SEARCH_PROPERTIES:
        search_k = 25
        fetch_k = 50
        filter_type = "property"
        loc = None
        bhk = None
        budget = None

        # Fast path: direct search + deterministic summary so common property
        # lookups do not need an LLM round-trip.
        try:
             mem_prefs = conversation_memory.get_current_preferences() if conversation_memory else {}

             # Fall back to user history / saved preferences when the current query
             # doesn't specify a param and conversation memory doesn't have one either.
             hist_loc, hist_budget, hist_bhk = get_user_search_defaults(user_id)

             loc        = params.get('location')   or mem_prefs.get('location') or hist_loc
             bhk        = params.get('bhk')        or mem_prefs.get('bhk')      or hist_bhk
             # If user said "any range/budget", ignore all saved budget preferences
             if params.get('budget_any'):
                 budget     = None
                 budget_min = None
             else:
                 budget     = params.get('budget')     or mem_prefs.get('budget')   or hist_budget
                 budget_min = params.get('budget_min') or None

             candidates = _merge_unique_records(
                 _search_properties_from_db(user_query, location=loc, bhk=bhk, budget=budget, budget_min=budget_min, limit=20),
                 _search_properties_from_vector(user_query, location=loc, bhk=bhk, budget=budget, budget_min=budget_min, limit=20, search_k=search_k, fetch_k=fetch_k),
                 key_func=lambda prop: getattr(prop, 'id', None),
                 limit=20,
             )

             if candidates:
                 search_summary = summarize_property_search_results(
                     candidates,
                     location=loc,
                     budget=budget,
                     budget_min=budget_min,
                     bhk=bhk,
                     user_query=user_query,
                 )
                 for prop in candidates[:10]:
                     session_shown_ids.add(str(prop.id))

                 if user_id:
                     extract_and_save_preferences(user_query, user_id)

                 return (
                     search_summary,
                     session_shown_ids,
                     candidates,
                     [],
                     intent.value,
                     generate_buffered_responses(candidates, [], intent.value),
                 )

             return (
                 summarize_property_search_results(
                     [],
                     location=loc,
                     budget=budget,
                     budget_min=budget_min,
                     bhk=bhk,
                     user_query=user_query,
                 ),
                 session_shown_ids,
                 [],
                 [],
                 intent.value,
                 [],
             )
        except Exception as e:
             print(f"Search fallback error: {e}")
             return (
                 summarize_property_search_results(
                     [],
                     location=loc,
                     budget=budget,
                     bhk=bhk,
                     user_query=user_query,
                 ),
                 session_shown_ids,
                 [],
                 [],
                 intent.value,
                 [],
             )

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
        shown_snippets = []
        for pid in list(session_shown_ids)[:10]:
            try:
                prop = Property.query.get(int(pid))
                if prop:
                    shown_snippets.append(
                        f"- {prop.Property_Name} | Location: {prop.Location} | "
                        f"Price: {prop.Price_Starting_From} | Config: {clean_json_field(prop.Existing_Configurations)}"
                    )
            except Exception:
                pass
        if shown_snippets:
            context_blocks.append("PROPERTIES CURRENTLY SHOWN TO USER:\n" + "\n".join(shown_snippets))
        else:
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
        answer_template = """You are a helpful Real Estate Assistant with access to the user's profile and history.

CRITICAL INSTRUCTIONS:
1. Read the USER PROFILE section in the context carefully — it contains the user's preferred location, BHK, budget, and builders they have shown interest in.
2. Personalise your answer using that profile. For example, if the user asks "what should my budget be for a 2 BHK?" and their profile shows they browse properties in Ghansoli at Rs 0.80 Cr, reference that.
3. If you are suggesting or recommending a property type, lean towards what matches their history.
4. IMPORTANT: If the context contains a "PROPERTIES CURRENTLY SHOWN TO USER" section, use ONLY those exact names and prices when referring to specific properties. Do NOT contradict or second-guess prices listed there.
5. Provide a helpful, conversational response (4-6 lines).
6. NO markdown formatting.
7. Property cards will be shown separately if applicable.

Context: {context}
Question: {question}

Personalised Response (4-6 lines, no formatting):"""

    ANSWER_PROMPT = PromptTemplate(template=answer_template, input_variables=["context", "question"])

    # --- SETUP LLM ---
    llm = _create_chat_llm(temperature=0.4, max_output_tokens=700)

    # For ASK_GENERAL/opinion intents, bypass the vector-retrieval chain entirely.
    # The chain fills {context} only from vector search docs — it never injects
    # full_system_context (user profile + shown property details).  Calling the LLM
    # directly with full_system_context guarantees the model sees the real prices and
    # names of the cards currently on screen.
    if intent == UserIntent.ASK_GENERAL:
        direct_prompt = answer_template.replace("{context}", full_system_context).replace("{question}", user_query)
        try:
            direct_res = llm.invoke(direct_prompt)
            ai_answer = getattr(direct_res, 'content', str(direct_res)).strip()
        except Exception as e:
            print(f"ASK_GENERAL direct LLM call failed: {e}")
            ai_answer = "I'm sorry, I couldn't generate a response right now. Please try again."
        ai_answer = ai_answer.replace('**', '').replace('*', '').replace('#', '')
        if user_id:
            extract_and_save_preferences(user_query, user_id)
        return ai_answer, session_shown_ids, [], [], intent.value, []

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
    
    print(f"Processing {len(property_docs)} property docs, {len(builder_docs)} builder docs")
    
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
        # Builders use id as primary key
        bid = getattr(b, 'id', None)
        if bid:
            session_shown_ids.add(str(bid))
    
    # Hard-filter final card results by requested location so cards match user query intent.
    # Skip this filter for ASK_GENERAL / opinion intents — those responses are about
    # whatever properties are in the conversation context, not tied to a specific location.
    if query_location and intent not in (UserIntent.ASK_GENERAL, UserIntent.GET_DETAILS):
        all_properties = [
            p for p in all_properties
            if _matches_location([p.Location, p.Address], query_location)
        ]
        all_builders = [
            b for b in all_builders
            if _matches_location([b.city, b.location, b.corporate_address], query_location)
        ]

    # For advisory / opinion intents the LLM answer IS the response — we must not
    # attach random vector-search property cards to it.  The user is asking for the
    # agent's opinion, not a new property listing.
    if intent in (UserIntent.ASK_GENERAL, UserIntent.GET_DETAILS):
        all_properties = []
        all_builders = []

    print(f"Retrieved {len(all_properties)} properties, {len(all_builders)} builders")
    print(f"Will show 10 initially, {max(0, len(all_properties) - 10)} available for 'load more'")

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
