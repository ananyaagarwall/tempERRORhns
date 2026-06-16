import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import requests
import re
from models import (
    User,
    Property,
    PropertyPoiCache,
    Enquiry,
    Review,
    Builder,
    BuilderProject,
    UnitConfig,
    ProjectAmenity,
    Blog,
    Slug,
    UserInteraction,
    Favorite,
    Media,
)
import media_service

from flask import Flask, request, jsonify, send_from_directory, redirect, g

#flash
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime
from itertools import groupby
from werkzeug.utils import secure_filename
import json
import storage
from flask_migrate import Migrate
import sys
from slugify import slugify
from sqlalchemy import inspect, text
from extensions import db 
import logging
import threading



# Set UTF-8 encoding for stdout
sys.stdout.reconfigure(encoding='utf-8')

# Configure logging for security events
# NOTE: File logging disabled during development to prevent huge log files
# Uncomment FileHandler line for production security auditing
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        # logging.FileHandler('security.log'),  # Disabled - was creating 30k+ line files
        logging.StreamHandler()  # Console logging only
    ]
)
security_logger = logging.getLogger('security')

app = Flask(__name__)

LOCAL_DEV_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

PRODUCTION_ORIGINS = [
    "https://ashy-wave-040cecb00.4.azurestaticapps.net",
    "https://www.housenseek.com",
    "https://housenseek.com",
]

ALL_ORIGINS = LOCAL_DEV_ORIGINS + PRODUCTION_ORIGINS

# Single CORS init with route scoping
CORS(
    app,
    supports_credentials=True,
    origins=ALL_ORIGINS,
    resources={
        r"/api/*":       {"origins": ALL_ORIGINS},
        r"/auth/*":      {"origins": ALL_ORIGINS},
        r"/query":       {"origins": ALL_ORIGINS},
        r"/build_index": {"origins": ALL_ORIGINS},
        r"/health":      {"origins": ALL_ORIGINS},
    },
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Guest-ID", "x-guest-id"],
)

# Single after_request
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin and origin in ALL_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = (
            "Content-Type, Authorization, X-Guest-ID, x-guest-id"
        )
        response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        )
    return response

# Preflight short-circuit — must come before any auth checks
@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        return app.make_default_options_response()

# Configure Flask to use UTF-8
app.config['JSON_AS_ASCII'] = False
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

# Configure Clerk Auth
CLERK_SECRET_KEY = os.getenv('CLERK_SECRET_KEY')
from auth import (
    clerk_required,
    admin_only,
    clear_admin_session,
    has_verified_admin_session,
    is_primary_admin_email,
    mark_admin_session_verified,
)
# Map the old jwt_required to clerk_required
def jwt_required(fn=None):
    if fn is None:
        return clerk_required(optional=False)
    return clerk_required(optional=False)(fn)

# Get absolute path to the backend folder (where app.py lives)
basedir = os.path.abspath(os.path.dirname(__file__))
dotenv_path = os.path.join(basedir, '.env')
load_dotenv(dotenv_path=dotenv_path)
PRIMARY_ADMIN_EMAIL = (os.getenv('PRIMARY_ADMIN_EMAIL') or 'chaitraliwaikar.hns.06@gmail.com').strip().lower()
ADMIN_SETUP_KEY = (os.getenv('ADMIN_SETUP_KEY') or '').strip()

# Create 'instance' folder if it doesn't exist
instance_dir = os.path.join(basedir, 'instance')
os.makedirs(instance_dir, exist_ok=True)  # This line fixes most issues


# Use Neon (primary) with local PostgreSQL as fallback.
# Set USE_CHILD=true in .env to point the backend at DATABASE_URL_CHILD (child branch) instead.
def _resolve_db_url():
    import socket
    from urllib.parse import urlparse

    def rewrite(url):
        return url.replace('postgres://', 'postgresql://', 1) if url.startswith('postgres://') else url

    def is_reachable(url, label):
        try:
            parsed = urlparse(url)
            host = parsed.hostname
            port = parsed.port or 5432
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(3)
            sock.connect((host, port))
            sock.close()
            print(f"DB: {label} reachable — using host={host}")
            return True
        except (socket.gaierror, socket.timeout, OSError):
            print(f"DB: {label} unreachable — falling back")
            return False

    use_child = os.getenv('USE_CHILD', '').strip().lower() == 'true'
    if use_child:
        child = rewrite(os.getenv('DATABASE_URL_CHILD', ''))
        if child and is_reachable(child, "child Neon"):
            return child
        if not child:
            print("DB: USE_CHILD=true but DATABASE_URL_CHILD not set — falling through")

    primary  = rewrite(os.getenv('DATABASE_URL', ''))
    fallback = rewrite(os.getenv('DATABASE_URL_FALLBACK', f"sqlite:///{os.path.join(instance_dir, 'hns.db')}"))

    if primary and is_reachable(primary, "primary Neon"):
        return primary

    return fallback

_db_url = _resolve_db_url()
app.config['SQLALCHEMY_DATABASE_URI'] = _db_url
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 280,
    'pool_size': 5,
    'max_overflow': 10,
}
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY') or os.getenv('SECRET_KEY') or CLERK_SECRET_KEY or 'dev-admin-session-secret'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = os.getenv('SESSION_COOKIE_SECURE', 'false').strip().lower() == 'true'

# Import the db instance from extensions
from extensions import db

# Initialize the db with the app
db.init_app(app)  # <-- Use the imported db instance

# Then initialize Flask-Migrate
migrate = Migrate(app, db)

# Chatbot globals
_index_lock = threading.Lock()
_emb_index = None

# Add these configurations
UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def _table_has_column(table_name, column_name):
    inspector = inspect(db.engine)
    if not inspector.has_table(table_name):
        return False
    return any(column['name'] == column_name for column in inspector.get_columns(table_name))


def _parse_json_list(raw):
    try:
        if not raw:
            return []
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _merge_unique_sequence(*groups):
    merged = []
    seen = set()

    for group in groups:
        for item in group or []:
            if isinstance(item, (dict, list)):
                marker = json.dumps(item, sort_keys=True, default=str)
            else:
                marker = str(item)
            if marker in seen:
                continue
            seen.add(marker)
            merged.append(item)

    return merged


def _dedupe_favorite_session_rows(owner_field):
    owner_column = getattr(Favorite, owner_field)
    rows = (
        Favorite.query
        .filter(owner_column.isnot(None), Favorite.property_id.is_(None))
        .order_by(owner_column.asc(), Favorite.id.asc())
        .all()
    )

    merged_groups = 0
    removed_rows = 0

    for _, grouped_rows in groupby(rows, key=lambda row: getattr(row, owner_field)):
        group = list(grouped_rows)
        if len(group) <= 1:
            continue

        keeper = group[0]
        keeper.cart_snapshot = json.dumps(
            _merge_unique_sequence(*[_parse_json_list(row.cart_snapshot) for row in group])
        )
        keeper.change_log = json.dumps(
            _merge_unique_sequence(*[_parse_json_list(row.change_log) for row in group])
        )

        for duplicate in group[1:]:
            db.session.delete(duplicate)
            removed_rows += 1

        merged_groups += 1

    return merged_groups, removed_rows


def _dedupe_favorite_item_rows(owner_field):
    owner_column = getattr(Favorite, owner_field)
    rows = (
        Favorite.query
        .filter(owner_column.isnot(None), Favorite.property_id.isnot(None))
        .order_by(owner_column.asc(), Favorite.property_id.asc(), Favorite.id.asc())
        .all()
    )

    removed_rows = 0

    for _, grouped_rows in groupby(rows, key=lambda row: (getattr(row, owner_field), row.property_id)):
        group = list(grouped_rows)
        if len(group) <= 1:
            continue
        for duplicate in group[1:]:
            db.session.delete(duplicate)
            removed_rows += 1

    return removed_rows


def _dedupe_favorite_rows():
    user_session_groups, removed_user_sessions = _dedupe_favorite_session_rows("user_id")
    guest_session_groups, removed_guest_sessions = _dedupe_favorite_session_rows("guest_id")
    removed_user_items = _dedupe_favorite_item_rows("user_id")
    removed_guest_items = _dedupe_favorite_item_rows("guest_id")

    total_removed = (
        removed_user_sessions
        + removed_guest_sessions
        + removed_user_items
        + removed_guest_items
    )
    total_merged_groups = user_session_groups + guest_session_groups

    if total_removed:
        print(
            "Normalized favorite rows before index hardening: "
            f"merged_session_groups={total_merged_groups}, removed_rows={total_removed}"
        )

    return total_removed


def _safe_json_load(value, default=None):
    if value in (None, ""):
        return [] if default is None else default
    if isinstance(value, (list, dict)):
        return value
    try:
        return json.loads(value)
    except Exception:
        return [] if default is None else default


def _coerce_list(value):
    if value in (None, ""):
        return []
    parsed = _safe_json_load(value, default=None)
    if parsed is None:
        if isinstance(value, str):
            parts = [part.strip() for part in re.split(r"[\r\n,;|]+", value) if part.strip()]
            return parts or [value.strip()]
        return [value]
    if isinstance(parsed, list):
        return parsed
    if isinstance(parsed, dict):
        return [parsed]
    return [parsed]


def _json_list_or_none(value):
    items = _coerce_list(value)
    return json.dumps(items) if items else None


def _parse_float(value):
    if value in (None, ""):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text_value = str(value).strip()
    if not text_value:
        return None
    match = re.search(r"-?\d+(?:\.\d+)?", text_value.replace(",", ""))
    if not match:
        return None
    try:
        return float(match.group(0))
    except Exception:
        return None


def _format_number(value):
    if value is None:
        return None
    try:
        return f"{float(value):.2f}".rstrip("0").rstrip(".")
    except Exception:
        return str(value)


def _parse_price_values_to_crore(value):
    if value in (None, ""):
        return []
    if isinstance(value, (int, float)):
        return [float(value)]

    values = []
    text_value = str(value).lower().replace(",", " ")
    for number, unit in re.findall(r"(\d+(?:\.\d+)?)\s*(cr|crore|l|lac|lakh)?", text_value):
        try:
            amount = float(number)
        except Exception:
            continue
        if unit in ("l", "lac", "lakh"):
            amount /= 100.0
        values.append(amount)
    return values


def _parse_area_values(value):
    if value in (None, ""):
        return []
    if isinstance(value, (int, float)):
        return [float(value)]

    values = []
    text_value = str(value).lower().replace(",", " ")
    for number in re.findall(r"\d+(?:\.\d+)?", text_value):
        try:
            values.append(float(number))
        except Exception:
            continue
    return values


def _normalize_bhk_label(value):
    if value in (None, ""):
        return None

    if isinstance(value, dict):
        value = (
            value.get("bhk_type")
            or value.get("type")
            or value.get("label")
            or value.get("name")
        )

    text_value = str(value).strip()
    if not text_value:
        return None

    compact = re.sub(r"\s+", " ", text_value).strip()
    compact = compact.replace("bhk", "BHK").replace("Bhk", "BHK")

    combo_match = re.match(r"^(\d+)\s*\+\s*(\d+)(?:\s*BHK)?(?:\s*\(([^)]+)\))?$", compact, re.IGNORECASE)
    if combo_match:
        left, right, suffix = combo_match.groups()
        label = f"{left}+{right} BHK"
        if suffix:
            label += f" ({suffix.strip()})"
        return label

    bare_match = re.match(r"^(\d+)(?:\s*BHK)?$", compact, re.IGNORECASE)
    if bare_match:
        return f"{bare_match.group(1)} BHK"

    return compact


def _expand_bhk_labels(value):
    label = _normalize_bhk_label(value)
    if not label:
        return []

    combo_match = re.match(r"^\d+\s*\+\s*\d+(?:\s*BHK)?(?:\s*\([^)]+\))?$", label, re.IGNORECASE)
    if combo_match:
        return [label]

    if "/" in label and "BHK" in label.upper():
        numbers = re.findall(r"\d+", label)
        expanded = []
        seen = set()
        for number in numbers:
            candidate = f"{number} BHK"
            if candidate in seen:
                continue
            seen.add(candidate)
            expanded.append(candidate)
        if expanded:
            return expanded

    return [label]


def _format_area_range(area_min, area_max, unit="sqft"):
    if area_min is None and area_max is None:
        return None
    if area_min is not None and area_max is not None:
        if abs(float(area_min) - float(area_max)) < 0.001:
            return f"{_format_number(area_min)} {unit}"
        return f"{_format_number(area_min)} to {_format_number(area_max)} {unit}"
    single = area_min if area_min is not None else area_max
    return f"{_format_number(single)} {unit}"


def _format_price_range_crore(price_min, price_max, price_label=None):
    if price_min is None and price_max is None:
        return None

    if price_min is not None and price_max is not None:
        if abs(float(price_min) - float(price_max)) < 0.001:
            text_value = f"{_format_number(price_min)} Cr"
        else:
            text_value = f"{_format_number(price_min)} - {_format_number(price_max)} Cr"
    else:
        single = price_min if price_min is not None else price_max
        text_value = f"{_format_number(single)} Cr"

    if price_label:
        return f"{text_value} {price_label}".strip()
    return text_value


def _serialize_unit_configs(rows):
    serialized = []
    for row in rows or []:
        serialized.append({
            "type": row.bhk_type,
            "carpet_area_min": row.carpet_area_min,
            "carpet_area_max": row.carpet_area_max,
            "rera_carpet_area": row.rera_carpet_area,
            "deck_area": row.deck_area,
            "area_unit": row.area_unit,
            "price_from": row.price_from,
            "price_to": row.price_to,
            "price_label": row.price_label,
        })
    return serialized


def _get_project_configuration_labels(project):
    rows = list(getattr(project, "unit_configs", []) or [])
    if rows:
        labels = []
        seen = set()
        for row in rows:
            label = _normalize_bhk_label(row.bhk_type)
            if not label or label in seen:
                continue
            seen.add(label)
            labels.append(label)
        return labels

    configs = _coerce_list(getattr(project, "configuration", None))
    labels = []
    seen = set()
    for item in configs:
        label = _normalize_bhk_label(item)
        if not label or label in seen:
            continue
        seen.add(label)
        labels.append(label)
    return labels


def _get_project_amenity_names(project):
    rows = list(getattr(project, "project_amenities", []) or [])
    if rows:
        return [row.name for row in rows if row.name]
    return [name for name in _coerce_list(getattr(project, "amenities", None)) if str(name).strip()]


def _normalize_project_amenity_names(value):
    raw_items = _coerce_list(value)
    canonical_map = {
        "club house": "Clubhouse",
        "clubhouse": "Clubhouse",
        "gymnasium": "Gymnasium",
        "gym": "Gymnasium",
        "pool": "Swimming Pool",
        "swimming pool": "Swimming Pool",
        "kids play area": "Kids Play Area",
        "children play area": "Kids Play Area",
        "indoor games": "Indoor Games",
        "indoor gaming zone": "Indoor Games",
        "party lawn": "Party Lawn",
        "community hall": "Community Hall",
        "multipurpose court": "Multipurpose Court",
        "intercom": "Intercom",
        "video door phone": "Video Door Phone",
        "senior citizen area": "Senior Citizen Area",
        "garden": "Garden",
        "jogging track": "Jogging Track",
    }

    normalized = []
    seen = set()

    for item in raw_items:
        if isinstance(item, dict):
            candidate = item.get("name") or item.get("label") or item.get("title")
        else:
            candidate = item

        if candidate in (None, ""):
            continue

        for part in re.split(r",|\sand\s|\s&\s|/", str(candidate), flags=re.IGNORECASE):
            cleaned = part.strip().strip("-").strip()
            if not cleaned:
                continue
            low = cleaned.lower()
            label = canonical_map.get(low, cleaned.title())
            marker = label.lower()
            if marker in seen:
                continue
            seen.add(marker)
            normalized.append(label)

    return normalized


def _infer_project_amenity_category(name):
    low = str(name or "").lower()
    if any(token in low for token in ("pool", "garden", "lawn", "jogging", "kids", "senior", "club", "gym", "games")):
        return "Lifestyle"
    if any(token in low for token in ("court", "tennis", "basketball")):
        return "Sports"
    if any(token in low for token in ("intercom", "video door", "security")):
        return "Safety"
    return "General"


def _infer_project_amenity_icon(name):
    low = str(name or "").lower()
    mapping = {
        "pool": "pool",
        "garden": "garden",
        "game": "indoor-games",
        "club": "clubhouse",
        "hall": "hall",
        "court": "court",
        "intercom": "intercom",
        "video door": "video-door",
        "senior": "senior",
        "kids": "kids",
        "gym": "gym",
        "lawn": "lawn",
        "jogging": "track",
    }
    for token, icon in mapping.items():
        if token in low:
            return icon
    return None


def _build_unit_config_payloads(project, payload=None, related_properties=None):
    payload = payload or {}
    related_properties = list(related_properties or [])
    primary_property = related_properties[0] if related_properties else None

    if "unit_configs" in payload:
        source_configs = payload.get("unit_configs")
    elif "configuration" in payload:
        source_configs = payload.get("configuration")
    elif getattr(project, "configuration", None):
        source_configs = project.configuration
    elif primary_property and primary_property.Existing_Configurations:
        source_configs = primary_property.Existing_Configurations
    else:
        source_configs = []

    config_items = _coerce_list(source_configs)
    if not config_items:
        return []

    shared_area_values = []
    if payload.get("carpetAreaMin") is not None:
        shared_area_values.append(_parse_float(payload.get("carpetAreaMin")))
    if payload.get("carpetAreaMax") is not None:
        shared_area_values.append(_parse_float(payload.get("carpetAreaMax")))
    if not shared_area_values:
        shared_area_values = [project.carpet_area_min, project.carpet_area_max]
    if not any(value is not None for value in shared_area_values) and primary_property:
        area_values = _parse_area_values(primary_property.Carpet_Area)
        if area_values:
            shared_area_values = [min(area_values), max(area_values)]

    shared_price_values = []
    if payload.get("priceMin") is not None:
        shared_price_values.append(_parse_float(payload.get("priceMin")))
    if payload.get("priceMax") is not None:
        shared_price_values.append(_parse_float(payload.get("priceMax")))
    if not shared_price_values:
        shared_price_values = _parse_price_values_to_crore(project.price_range)
    if not shared_price_values and primary_property:
        shared_price_values = _parse_price_values_to_crore(primary_property.Price_Starting_From)

    shared_price_label = (
        payload.get("price_label")
        or payload.get("priceLabel")
        or payload.get("Pricing")
        or (primary_property.Pricing if primary_property else None)
    )

    prepared_items = []
    for item in config_items:
        source = item if isinstance(item, dict) else {"type": item}
        labels = _expand_bhk_labels(source)
        if not labels:
            continue
        prepared_items.append((source, labels))

    total_labels = sum(len(labels) for _, labels in prepared_items)
    use_shared_project_values = total_labels == 1

    shared_area_min = next((value for value in shared_area_values if value is not None), None)
    shared_area_max = next((value for value in reversed(shared_area_values) if value is not None), shared_area_min)
    shared_price_min = min(shared_price_values) if shared_price_values else None
    shared_price_max = max(shared_price_values) if shared_price_values else None

    payloads = []
    seen = set()

    for source, labels in prepared_items:
        explicit_area_min = _parse_float(
            source.get("carpet_area_min")
            or source.get("min_area")
            or source.get("area_min")
            or source.get("carpetAreaMin")
        )
        explicit_area_max = _parse_float(
            source.get("carpet_area_max")
            or source.get("max_area")
            or source.get("area_max")
            or source.get("carpetAreaMax")
        )
        explicit_price_from = _parse_float(source.get("price_from") or source.get("priceFrom"))
        explicit_price_to = _parse_float(source.get("price_to") or source.get("priceTo"))
        explicit_price_label = source.get("price_label") or source.get("priceLabel")

        area_min = explicit_area_min
        area_max = explicit_area_max
        price_from = explicit_price_from
        price_to = explicit_price_to
        price_label = explicit_price_label

        if use_shared_project_values:
            if area_min is None:
                area_min = shared_area_min
            if area_max is None:
                area_max = shared_area_max
            if price_from is None:
                price_from = shared_price_min
            if price_to is None:
                price_to = shared_price_max
            if not price_label:
                price_label = shared_price_label

        for bhk_type in labels:
            if not bhk_type or bhk_type in seen:
                continue
            seen.add(bhk_type)

            payloads.append({
                "bhk_type": bhk_type,
                "carpet_area_min": area_min,
                "carpet_area_max": area_max,
                "rera_carpet_area": _parse_float(source.get("rera_carpet_area") or source.get("reraCarpetArea")),
                "deck_area": _parse_float(source.get("deck_area") or source.get("deckArea")),
                "area_unit": source.get("area_unit") or source.get("areaUnit") or "sqft",
                "price_from": price_from,
                "price_to": price_to,
                "price_label": price_label,
            })

    return payloads


def _sync_unit_configs(project, payload=None, related_properties=None, replace=False):
    payload = payload or {}
    related_properties = list(related_properties or [])

    if replace:
        for row in list(project.unit_configs):
            db.session.delete(row)
        db.session.flush()

    current_rows = UnitConfig.query.filter_by(project_id=project.id).all()
    if current_rows and not replace:
        rows = current_rows
    else:
        rows = []
        for item in _build_unit_config_payloads(project, payload=payload, related_properties=related_properties):
            row = UnitConfig(project_id=project.id, **item)
            db.session.add(row)
            rows.append(row)
        db.session.flush()

    rows = UnitConfig.query.filter_by(project_id=project.id).order_by(UnitConfig.id.asc()).all()

    if rows:
        project.configuration = json.dumps(_serialize_unit_configs(rows))
        carpet_mins = [row.carpet_area_min for row in rows if row.carpet_area_min is not None]
        carpet_maxs = [row.carpet_area_max for row in rows if row.carpet_area_max is not None]
        price_mins = [row.price_from for row in rows if row.price_from is not None]
        price_maxs = [row.price_to for row in rows if row.price_to is not None]
        if carpet_mins and (replace or project.carpet_area_min is None):
            project.carpet_area_min = min(carpet_mins)
        if carpet_maxs and (replace or project.carpet_area_max is None):
            project.carpet_area_max = max(carpet_maxs)
        generated_price_range = _format_price_range_crore(
            min(price_mins) if price_mins else None,
            max(price_maxs) if price_maxs else (max(price_mins) if price_mins else None),
            next((row.price_label for row in rows if row.price_label), None),
        )
        if generated_price_range and (replace or not project.price_range):
            project.price_range = generated_price_range

        jodi_labels = [row.bhk_type for row in rows if row.bhk_type and "+" in row.bhk_type]
        if jodi_labels and not project.jodi_options:
            project.jodi_options = json.dumps(jodi_labels)
    elif replace:
        project.configuration = None

    return rows


def _build_project_amenity_payloads(project, payload=None, related_properties=None):
    payload = payload or {}
    related_properties = list(related_properties or [])
    primary_property = related_properties[0] if related_properties else None

    if "project_amenities" in payload:
        source = payload.get("project_amenities")
    elif "amenities" in payload:
        source = payload.get("amenities")
    elif getattr(project, "amenities", None):
        source = project.amenities
    elif primary_property and primary_property.Key_Highlights:
        source = primary_property.Key_Highlights
    else:
        source = []

    raw_items = _coerce_list(source)
    payloads = []
    seen = set()

    for item in raw_items:
        if isinstance(item, dict):
            name = item.get("name") or item.get("label") or item.get("title")
            if not name:
                continue
            normalized_name = _normalize_project_amenity_names([name])
            if not normalized_name:
                continue
            normalized_name = normalized_name[0]
            marker = normalized_name.lower()
            if marker in seen:
                continue
            seen.add(marker)
            payloads.append({
                "name": normalized_name,
                "category": item.get("category") or _infer_project_amenity_category(normalized_name),
                "icon_key": item.get("icon_key") or item.get("iconKey") or _infer_project_amenity_icon(normalized_name),
            })
            continue

        for normalized_name in _normalize_project_amenity_names([item]):
            marker = normalized_name.lower()
            if marker in seen:
                continue
            seen.add(marker)
            payloads.append({
                "name": normalized_name,
                "category": _infer_project_amenity_category(normalized_name),
                "icon_key": _infer_project_amenity_icon(normalized_name),
            })

    return payloads


def _sync_project_amenities(project, payload=None, related_properties=None, replace=False):
    payload = payload or {}
    related_properties = list(related_properties or [])

    if replace:
        for row in list(project.project_amenities):
            db.session.delete(row)
        db.session.flush()

    current_rows = ProjectAmenity.query.filter_by(project_id=project.id).all()
    if current_rows and not replace:
        rows = current_rows
    else:
        rows = []
        for item in _build_project_amenity_payloads(project, payload=payload, related_properties=related_properties):
            row = ProjectAmenity(project_id=project.id, **item)
            db.session.add(row)
            rows.append(row)
        db.session.flush()

    rows = ProjectAmenity.query.filter_by(project_id=project.id).order_by(ProjectAmenity.id.asc()).all()
    project.amenities = json.dumps([row.name for row in rows]) if rows else None
    return rows


def _sync_project_scalar_fields(project, payload=None, related_properties=None):
    payload = payload or {}
    related_properties = list(related_properties or [])
    builder = Builder.query.get(project.builder_id) if project.builder_id else None
    primary_property = related_properties[0] if related_properties else None

    if not project.builder_name and builder:
        project.builder_name = builder.company_name

    if not project.development_group:
        project.development_group = project.builder_name or (builder.company_name if builder else None)

    if not project.structure_description:
        if project.construction_status:
            project.structure_description = project.construction_status
        else:
            pieces = []
            if project.towers:
                pieces.append(f"Towers: {project.towers}")
            if project.floors_per_tower:
                pieces.append(f"Floors per tower: {project.floors_per_tower}")
            if pieces:
                project.structure_description = ", ".join(pieces)

    if not project.elevation and project.floors_per_tower:
        project.elevation = f"G+{int(project.floors_per_tower)}"

    if not project.highlights and primary_property and primary_property.Highlights:
        project.highlights = primary_property.Highlights

    if not project.usps:
        if primary_property and primary_property.Highlights:
            project.usps = primary_property.Highlights
        elif project.highlights:
            project.usps = project.highlights

    if not project.full_address and primary_property and primary_property.Address:
        project.full_address = primary_property.Address

    if not project.location and primary_property and primary_property.Location:
        project.location = primary_property.Location

    if not project.property_status and primary_property and primary_property.Project_Status:
        project.property_status = primary_property.Project_Status

    if not project.status and primary_property and primary_property.Project_Status:
        project.status = project.property_status or primary_property.Project_Status

    if not project.possession_date and primary_property and primary_property.Possession_Date:
        try:
            project.possession_date = datetime.fromisoformat(str(primary_property.Possession_Date)).date()
        except Exception:
            pass


def _sync_property_from_project(project, prop):
    config_rows = UnitConfig.query.filter_by(project_id=project.id).order_by(UnitConfig.id.asc()).all()
    amenity_rows = ProjectAmenity.query.filter_by(project_id=project.id).order_by(ProjectAmenity.id.asc()).all()
    config_blob = _serialize_unit_configs(config_rows)
    amenity_names = [row.name for row in amenity_rows if row.name]

    if project.title and not prop.Property_Name:
        prop.Property_Name = project.title
    if project.location and not prop.Location:
        prop.Location = project.location
    if project.builder_name and not prop.Builder_Name:
        prop.Builder_Name = project.builder_name
    if project.full_address and not prop.Address:
        prop.Address = project.full_address
    if project.latitude is not None and prop.latitude is None:
        prop.latitude = project.latitude
    if project.longitude is not None and prop.longitude is None:
        prop.longitude = project.longitude
    if (project.location_source or (project.latitude is not None and project.longitude is not None)) and not prop.location_source:
        prop.location_source = project.location_source or 'manual'
    if (project.property_status or project.status) and not prop.Project_Status:
        prop.Project_Status = project.property_status or project.status
    if project.possession_date and not prop.Possession_Date:
        prop.Possession_Date = project.possession_date.isoformat()

    if config_blob:
        prop.Existing_Configurations = json.dumps(config_blob)
        if not prop.Carpet_Area:
            prop.Carpet_Area = _format_area_range(project.carpet_area_min, project.carpet_area_max)
        if not prop.Price_Starting_From and project.price_range:
            prop.Price_Starting_From = project.price_range

    if amenity_names:
        prop.Key_Highlights = json.dumps(amenity_names)

    if not prop.Highlights:
        project_highlights = _safe_json_load(project.highlights, default=[])
        project_usps = _safe_json_load(project.usps, default=[])
        merged = _merge_unique_sequence(project_highlights, project_usps)
        if merged:
            prop.Highlights = json.dumps(merged)


def _sync_project_related_data(project, payload=None, replace_unit_configs=False, replace_amenities=False, sync_properties=True):
    related_properties = Property.query.filter_by(project_id=project.id).order_by(Property.id.asc()).all()
    _sync_project_scalar_fields(project, payload=payload, related_properties=related_properties)
    _sync_unit_configs(project, payload=payload, related_properties=related_properties, replace=replace_unit_configs)
    _sync_project_amenities(project, payload=payload, related_properties=related_properties, replace=replace_amenities)

    if sync_properties:
        for prop in related_properties:
            _sync_property_from_project(project, prop)


def _ensure_schema_compatibility():
    """
    Best-effort additive schema repair.
    - Always runs `db.create_all()` to ensure new tables exist.
    - Adds missing columns for known drift where possible.
    """
    # Create any tables defined in models that don't exist yet (e.g. media).
    db.create_all()

    dialect = db.engine.dialect.name
    inspector = inspect(db.engine)

    def _add_column_if_missing(table_name, column_name, column_type):
        if not inspector.has_table(table_name):
            return
        existing_columns = {column['name'] for column in inspector.get_columns(table_name)}
        if column_name in existing_columns:
            return

        if dialect == 'postgresql':
            db.session.execute(text(
                f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {column_name} {column_type}"
            ))
        else:
            db.session.execute(text(
                f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
            ))
        print(f"Applied schema repair: added {table_name}.{column_name}")

    if inspector.has_table('user_interaction'):
        existing_columns = {column['name'] for column in inspector.get_columns('user_interaction')}
        if 'guest_id' not in existing_columns:
            _add_column_if_missing('user_interaction', 'guest_id', 'VARCHAR(100)')
            
            # // Add indexes for user_interaction after schema repair

        db.session.execute(text("CREATE INDEX IF NOT EXISTS ix_user_interaction_user_id ON user_interaction (user_id)"))
        db.session.execute(text("CREATE INDEX IF NOT EXISTS ix_user_interaction_guest_id ON user_interaction (guest_id)"))
        db.session.execute(text("CREATE INDEX IF NOT EXISTS ix_user_interaction_property_id ON user_interaction (property_id)"))
        db.session.execute(text("CREATE INDEX IF NOT EXISTS ix_user_interaction_session_id ON user_interaction (session_id)"))

    # media table — new table; db.create_all() above creates it.
    # Add indexes explicitly so they exist even without a full migration run.
    if inspector.has_table('media') and dialect == 'postgresql':
        db.session.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_media_entity "
            "ON media (entity_type, entity_id)"
        ))
        db.session.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_media_entity_type "
            "ON media (entity_type, entity_id, media_type)"
        ))

    if inspector.has_table('unit_config'):
        unit_config_columns = [
            ('unit_type', 'VARCHAR(30)'),
            ('wing', 'VARCHAR(20)'),
            ('floor_range_raw', 'VARCHAR(100)'),
            ('balcony_area', 'FLOAT'),
            ('enclosed_balcony_area', 'FLOAT'),
            ('service_area', 'FLOAT'),
            ('ceiling_height', 'VARCHAR(50)'),
            ('main_door_facing', 'VARCHAR(50)'),
            ('modular_kitchen', 'BOOLEAN'),
            ('kitchen_type', 'VARCHAR(50)'),
            ('is_combination', 'BOOLEAN'),
        ]
        for column_name, column_type in unit_config_columns:
            _add_column_if_missing('unit_config', column_name, column_type)

    if inspector.has_table('unit_room_detail'):
        unit_room_detail_columns = [
            ('room_name', 'VARCHAR(50)'),
            ('length', 'FLOAT'),
            ('width', 'FLOAT'),
            ('area', 'FLOAT'),
            ('area_unit', 'VARCHAR(10)'),
            ('notes', 'TEXT'),
        ]
        for column_name, column_type in unit_room_detail_columns:
            _add_column_if_missing('unit_room_detail', column_name, column_type)

    if dialect == 'postgresql' and inspector.has_table('favorite'):
        _dedupe_favorite_rows()
        db.session.flush()

        db.session.execute(text("CREATE INDEX IF NOT EXISTS ix_favorite_user_id ON favorite (user_id)"))
        db.session.execute(text("CREATE INDEX IF NOT EXISTS ix_favorite_guest_id ON favorite (guest_id)"))
        db.session.execute(text("CREATE INDEX IF NOT EXISTS ix_favorite_property_id ON favorite (property_id)"))
        db.session.execute(text("DROP INDEX IF EXISTS ix_favorite_user_property"))
        db.session.execute(text("DROP INDEX IF EXISTS ix_favorite_guest_property"))
        db.session.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_favorite_user_session "
            "ON favorite (user_id) "
            "WHERE user_id IS NOT NULL AND property_id IS NULL"
        ))
        db.session.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_favorite_guest_session "
            "ON favorite (guest_id) "
            "WHERE guest_id IS NOT NULL AND property_id IS NULL"
        ))
        db.session.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_favorite_user_property "
            "ON favorite (user_id, property_id) "
            "WHERE user_id IS NOT NULL AND property_id IS NOT NULL"
        ))
        db.session.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_favorite_guest_property "
            "ON favorite (guest_id, property_id) "
            "WHERE guest_id IS NOT NULL AND property_id IS NOT NULL"
        ))

    # pg_trgm — used for fuzzy autocomplete on live tables
    if dialect == 'postgresql':
        db.session.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))

    db.session.commit()


with app.app_context():
    try:
        _ensure_schema_compatibility()
    except Exception as e:
        print(f"Error during database initialization: {str(e)}")
        db.session.rollback()

#--------------------------------------------- AUTHENTICATION HANDLED BY CLERK ---------------------------------------------
# Removed /api/auth/signup, /api/auth/login, /api/auth/refresh, /api/auth/logout routes
# as these are now fully managed by Clerk's frontend UI components and backend token verification.

#--------------------------------------------- ROUTERS AND API ENDPOINTS ---------------------------------------------
@app.route('/api/properties/location/<string:loc>', methods=['GET'])
def get_properties_by_location(loc):
    properties = Property.query.filter(Property.Location.like(f'%{loc}%')).all()
    return jsonify([property.to_dict() for property in properties])

@app.route('/api/properties', methods=['GET'])
def get_properties():
    properties = Property.query.all()
    return jsonify([property.to_dict() for property in properties])

@app.route('/api/locations', methods=['GET']) 
@jwt_required()
def get_locations(): 
    locations = db.session.query(Property.Location).distinct().all() 
    unique_locations = [loc[0].strip() for loc in locations if loc[0] and loc[0].strip()] 
    unique_locations = sorted(set(unique_locations))
    return jsonify(unique_locations)

# Excluded nodes for the "near you" feature (kept as an empty set for now so all areas are eligible).
EXCLUDED_NEAR_YOU_NODES = set()

# Ordered list of key nodes/areas used for the "nearest nodes" API.
# This is used as a logical sequence (roughly along the Navi Mumbai / Thane belt)
# to compute nearby locations. Update this list if you add more areas.
ORDERED_AREAS = [
    "Airoli",
    "Rabale",
    "Ghansoli",
    "Kopar Khairane",
    "Vashi",
    "Sanpada",
    "Juinagar",
    "Nerul",
    "Seawoods",
    "Belapur",
    "Kharghar",
    "Mansarovar",
    "Khandeshwar",
    "Panvel",
    "Thane",
    "Kalyan Subdistrict",
    "Kalyan-Dombivli",
    "Mumbai",
    "Navi Mumbai",
]

#yaha se nearyou till.. 

def has_properties_for_location(loc_name):
    """Check if a location has any properties in the database."""
    # Also check if the location is in the excluded list
    if loc_name in EXCLUDED_NEAR_YOU_NODES:
        return False
    count = Property.query.filter(Property.Location.ilike(f'%{loc_name}%')).count()
    return count > 0

@app.route('/api/nearest-nodes/<string:location>', methods=['GET'])
def get_nearest_nodes(location):
    """Get 4 nearest nodes based on the primary location from ORDERED_AREAS.
    Returns the location's position and 4 nearest nodes that have property data available.
    Only includes nodes that actually have properties to display.
    """
    # Normalize the input location for matching
    location_lower = location.lower().strip()
    
    # Find the index of the location in ORDERED_AREAS (case-insensitive partial match)
    found_index = -1
    for i, area in enumerate(ORDERED_AREAS):
        if area.lower() == location_lower or location_lower in area.lower() or area.lower() in location_lower:
            found_index = i
            break
    
    # If location not found, find first 4 areas with properties as fallback
    if found_index == -1:
        nearest = []
        for area in ORDERED_AREAS:
            if has_properties_for_location(area):
                nearest.append(area)
                if len(nearest) >= 4:
                    break
        return jsonify({
            'primaryLocation': location,
            'foundInArray': False,
            'nearestNodes': nearest
        })
    
    # Calculate nearest nodes that have properties.
    # Collect ALL valid candidates with their offset distance, then pick
    # the 4 closest ordered by position in ORDERED_AREAS.
    total_areas = len(ORDERED_AREAS)
    candidates = []  # list of (absolute_offset, index_in_ORDERED_AREAS)

    for i, area in enumerate(ORDERED_AREAS):
        if i == found_index:
            continue  # skip the user's own location
        if has_properties_for_location(area):
            candidates.append((abs(i - found_index), i))

    # Sort by offset distance (closest first), then by actual index for stable ordering
    candidates.sort(key=lambda x: (x[0], x[1]))

    # Take the 4 closest; re-sort by original index to preserve geographic order
    closest_four = sorted(candidates[:4], key=lambda x: x[1])
    nearest = [ORDERED_AREAS[idx] for _, idx in closest_four]
    
    return jsonify({
        'primaryLocation': ORDERED_AREAS[found_index],
        'foundInArray': True,
        'primaryIndex': found_index,
        'nearestNodes': nearest
    })

@app.route('/api/properties/multiple-locations', methods=['GET'])
def get_properties_by_multiple_locations():
    """Get properties from multiple locations.
    Query param: locations (comma-separated list of location names)
    """
    locations_param = request.args.get('locations', '')
    if not locations_param:
        return jsonify([]), 200
    
    locations_list = [loc.strip() for loc in locations_param.split(',') if loc.strip()]
    
    # Query properties matching any of the locations
    all_properties = []
    for loc in locations_list:
        properties = Property.query.filter(Property.Location.ilike(f'%{loc}%')).all()
        for prop in properties:
            prop_dict = prop.to_dict()
            if prop_dict not in all_properties:
                all_properties.append(prop_dict)
    
    return jsonify(all_properties)

# yaha tak nearyou. 

@app.route('/api/properties/<int:id>', methods=['GET'])
def get_property(id):
    property = Property.query.get_or_404(id)
    return jsonify(property.to_dict())

@app.route('/api/properties/<int:id>', methods=['PATCH'])
@admin_only
def patch_property(id):
    prop = Property.query.get_or_404(id)
    data = request.get_json(silent=True) or {}

    has_lat = 'latitude' in data or 'Latitude' in data
    has_lng = 'longitude' in data or 'Longitude' in data
    has_source = 'location_source' in data or 'locationSource' in data

    # Allow no-op PATCH (useful for future expansion)
    if not (has_lat or has_lng or has_source):
        return jsonify(prop.to_dict()), 200

    lat = _safe_float(data.get('latitude') if 'latitude' in data else data.get('Latitude'))
    lng = _safe_float(data.get('longitude') if 'longitude' in data else data.get('Longitude'))

    # Allow explicitly clearing coordinates by sending null/empty for both.
    lat_raw = data.get('latitude') if 'latitude' in data else data.get('Latitude') if 'Latitude' in data else None
    lng_raw = data.get('longitude') if 'longitude' in data else data.get('Longitude') if 'Longitude' in data else None
    clearing_coords = (lat_raw in (None, '') and lng_raw in (None, '')) and (has_lat or has_lng)

    if not clearing_coords:
        if has_lat and lat is None:
            return jsonify({'error': 'invalid_latitude'}), 400
        if has_lng and lng is None:
            return jsonify({'error': 'invalid_longitude'}), 400
        if (has_lat and not has_lng) or (has_lng and not has_lat):
            return jsonify({'error': 'latitude_and_longitude_required_together'}), 400

    prev_lat = prop.latitude
    prev_lng = prop.longitude

    if clearing_coords:
        prop.latitude = None
        prop.longitude = None
        prop.location_source = data.get('location_source') or data.get('locationSource') or prop.location_source
    else:
        if has_lat:
            prop.latitude = lat
        if has_lng:
            prop.longitude = lng
        if has_source:
            prop.location_source = data.get('location_source') or data.get('locationSource')
        if not prop.location_source and prop.latitude is not None and prop.longitude is not None:
            prop.location_source = 'manual'

    # If coordinates changed, clear POI cache so the next fetch recomputes.
    coords_changed = (prev_lat != prop.latitude) or (prev_lng != prop.longitude)
    if coords_changed and getattr(prop, 'poi_cache', None):
        try:
            db.session.delete(prop.poi_cache)
        except Exception:
            pass

    db.session.commit()
    return jsonify(prop.to_dict()), 200

@app.route('/api/properties', methods=['POST'])
@admin_only
def create_property():
    data = request.json
    new_property = Property(
        Property_Name=data.get('Property_Name'),
        Location=data.get('Location'),
        latitude=data.get('latitude') if data.get('latitude') is not None else data.get('Latitude'),
        longitude=data.get('longitude') if data.get('longitude') is not None else data.get('Longitude'),
        location_source=data.get('location_source') or data.get('locationSource'),
        Carpet_Area=data.get('Carpet_Area'),
        Price_Starting_From=data.get('Price_Starting_From'),
        Pricing=data.get('Pricing'),
        Highlights=json.dumps(data.get('Highlights')),
        Extra_Charges=data.get('Extra_Charges'),
        Builder_Name=data.get('Builder_Name'),
        Builder_Details=json.dumps(data.get('Builder_Details')),
        Existing_Configurations=json.dumps(data.get('Existing_Configurations')),
        Built_up_Area=data.get('Built_up_Area'),
        Main_Door_Facing=data.get('Main_Door_Facing'),
        Ceiling_Height=data.get('Ceiling_Height'),
        Kitchen=data.get('Kitchen'),
        Key_Highlights=json.dumps(data.get('Key_Highlights')),
        Address=data.get('Address'),
        Flat_Details=json.dumps(data.get('Flat_Details')),
        Loan_Availability=json.dumps(data.get('Loan_Availability')),
        Approved_by_Authorities=json.dumps(data.get('Approved_by_Authorities')),
        Project_Status=data.get('Project_Status'),
        Possession_Date=data.get('Possession_Date'),
        RERA_ID=data.get('RERA_ID'),
        Vastu_Compliant=data.get('Vastu_Compliant'),
        Parking=data.get('Parking'),
        Lift_Availability=data.get('Lift_Availability'),
        Security=data.get('Security'),
        Connectivity=json.dumps(data.get('Connectivity')),
        user_id=data['user_id'],
        project_id=data.get('project_id')
    )
    if (
        not new_property.location_source
        and new_property.latitude is not None
        and new_property.longitude is not None
    ):
        new_property.location_source = 'manual'
    db.session.add(new_property)
    db.session.flush()
    if new_property.project_id:
        project = BuilderProject.query.get(new_property.project_id)
        if project:
            _sync_property_from_project(project, new_property)
            _sync_project_related_data(project)
    db.session.commit()
    return jsonify(new_property.to_dict()), 201


NOMINATIM_SEARCH_URL = os.getenv('NOMINATIM_SEARCH_URL', 'https://nominatim.openstreetmap.org/search')
OVERPASS_INTERPRETER_URL = os.getenv('OVERPASS_INTERPRETER_URL', 'https://overpass-api.de/api/interpreter')
POI_CACHE_TTL_SECONDS = int(os.getenv('POI_CACHE_TTL_SECONDS', str(14 * 24 * 60 * 60)))  # 14 days


def _safe_float(value):
    try:
        if value is None or value == '':
            return None
        return float(value)
    except Exception:
        return None


def _overpass_query(lat, lng, radius_m, poi_types):
    # Supported types -> tag filters
    type_filters = {
        'school': [('amenity', 'school')],
        'hospital': [('amenity', 'hospital')],
        'clinic': [('amenity', 'clinic')],
        'pharmacy': [('amenity', 'pharmacy')],
        'supermarket': [('shop', 'supermarket')],
        'park': [('leisure', 'park')],
        'bus_stop': [('highway', 'bus_stop')],
    }

    clauses = []
    for poi_type in poi_types:
        filters = type_filters.get(poi_type)
        if not filters:
            continue
        for key, value in filters:
            clauses.append(f'node["{key}"="{value}"](around:{radius_m},{lat},{lng});')
            clauses.append(f'way["{key}"="{value}"](around:{radius_m},{lat},{lng});')
            clauses.append(f'relation["{key}"="{value}"](around:{radius_m},{lat},{lng});')

    body = "\n".join(clauses)
    return f"""
[out:json][timeout:25];
(
{body}
);
out center 50;
""".strip()


def _extract_overpass_pois(payload, allowed_types):
    type_filters = {
        ('amenity', 'school'): 'school',
        ('amenity', 'hospital'): 'hospital',
        ('amenity', 'clinic'): 'clinic',
        ('amenity', 'pharmacy'): 'pharmacy',
        ('shop', 'supermarket'): 'supermarket',
        ('leisure', 'park'): 'park',
        ('highway', 'bus_stop'): 'bus_stop',
    }

    results = {t: [] for t in allowed_types}
    elements = payload.get('elements') if isinstance(payload, dict) else None
    if not isinstance(elements, list):
        return results

    seen = set()
    for element in elements:
        if not isinstance(element, dict):
            continue
        tags = element.get('tags') or {}
        if not isinstance(tags, dict):
            tags = {}

        poi_type = None
        for (k, v), normalized in type_filters.items():
            if normalized not in allowed_types:
                continue
            if tags.get(k) == v:
                poi_type = normalized
                break

        if not poi_type:
            continue

        center = element.get('center') if isinstance(element.get('center'), dict) else None
        lat = element.get('lat') if element.get('lat') is not None else (center.get('lat') if center else None)
        lng = element.get('lon') if element.get('lon') is not None else (center.get('lon') if center else None)
        lat = _safe_float(lat)
        lng = _safe_float(lng)
        if lat is None or lng is None:
            continue

        osm_id = f"{element.get('type')}:{element.get('id')}"
        if osm_id in seen:
            continue
        seen.add(osm_id)

        results[poi_type].append({
            'id': osm_id,
            'name': tags.get('name') or 'Unnamed',
            'lat': lat,
            'lng': lng,
            'tags': {k: tags.get(k) for k in ('amenity', 'shop', 'leisure', 'highway') if tags.get(k)},
        })

    # Keep response small and predictable
    for poi_type in results:
        results[poi_type] = results[poi_type][:25]
    return results


@app.route('/api/geocode', methods=['GET'])
def geocode_address():
    query = (request.args.get('q') or '').strip()
    if not query:
        return jsonify({'error': 'q is required'}), 400

    try:
        resp = requests.get(
            NOMINATIM_SEARCH_URL,
            params={
                'q': query,
                'format': 'jsonv2',
                'limit': 5,
                'addressdetails': 1,
            },
            headers={
                'User-Agent': 'HouseNseeK/1.0 (geocoding; contact: admin@housenseek.local)',
            },
            timeout=12,
        )
        if resp.status_code != 200:
            return jsonify({'error': 'geocoding_failed'}), 502
        data = resp.json()
        if not isinstance(data, list):
            return jsonify([]), 200

        cleaned = []
        for item in data:
            if not isinstance(item, dict):
                continue
            lat = _safe_float(item.get('lat'))
            lng = _safe_float(item.get('lon'))
            if lat is None or lng is None:
                continue
            cleaned.append({
                'display_name': item.get('display_name'),
                'lat': lat,
                'lng': lng,
                'type': item.get('type'),
                'class': item.get('class'),
            })
        return jsonify(cleaned), 200
    except Exception as e:
        return jsonify({'error': 'geocoding_error', 'detail': str(e)}), 500


@app.route('/api/properties/<int:id>/pois', methods=['GET'])
def get_property_pois(id):
    prop = Property.query.get_or_404(id)
    lat = _safe_float(getattr(prop, 'latitude', None))
    lng = _safe_float(getattr(prop, 'longitude', None))

    if lat is None or lng is None:
        return jsonify({'property_id': id, 'latitude': None, 'longitude': None, 'radius_m': None, 'types': [], 'pois': {}}), 200

    radius_m = request.args.get('radius_m')
    radius_m = int(radius_m) if str(radius_m or '').isdigit() else 2000
    radius_m = max(250, min(radius_m, 5000))

    requested_types = (request.args.get('types') or 'school,hospital,pharmacy,supermarket').split(',')
    requested_types = [t.strip().lower() for t in requested_types if t.strip()]
    allowed = {'school', 'hospital', 'clinic', 'pharmacy', 'supermarket', 'park', 'bus_stop'}
    poi_types = [t for t in requested_types if t in allowed]
    if not poi_types:
        poi_types = ['school', 'hospital']

    now = datetime.utcnow()
    cache = PropertyPoiCache.query.filter_by(property_id=prop.id).first()

    def _cache_fresh(existing):
        if not existing or not existing.fetched_at:
            return False
        if existing.latitude is None or existing.longitude is None:
            return False
        if abs(existing.latitude - lat) > 0.0001 or abs(existing.longitude - lng) > 0.0001:
            return False
        if int(existing.radius_m or 0) != int(radius_m):
            return False
        try:
            cached_types = json.loads(existing.poi_types) if existing.poi_types else []
        except Exception:
            cached_types = []
        if sorted(cached_types) != sorted(poi_types):
            return False
        return (now - existing.fetched_at).total_seconds() < POI_CACHE_TTL_SECONDS

    if _cache_fresh(cache):
        try:
            return jsonify({
                'property_id': prop.id,
                'latitude': lat,
                'longitude': lng,
                'radius_m': radius_m,
                'types': poi_types,
                'cached': True,
                'fetched_at': cache.fetched_at.isoformat() if cache.fetched_at else None,
                'pois': json.loads(cache.data) if cache.data else {},
            }), 200
        except Exception:
            pass

    query = _overpass_query(lat, lng, radius_m, poi_types)
    try:
        resp = requests.post(
            OVERPASS_INTERPRETER_URL,
            data=query.encode('utf-8'),
            headers={'Content-Type': 'text/plain; charset=utf-8', 'User-Agent': 'HouseNseeK/1.0 (poi fetch)'},
            timeout=30,
        )
        if resp.status_code != 200:
            raise RuntimeError(f"Overpass status {resp.status_code}")
        payload = resp.json()
        pois = _extract_overpass_pois(payload, poi_types)
    except Exception as e:
        # If Overpass fails, serve stale cache if present.
        if cache and cache.data:
            try:
                return jsonify({
                    'property_id': prop.id,
                    'latitude': lat,
                    'longitude': lng,
                    'radius_m': radius_m,
                    'types': poi_types,
                    'cached': True,
                    'stale': True,
                    'error': str(e),
                    'fetched_at': cache.fetched_at.isoformat() if cache.fetched_at else None,
                    'pois': json.loads(cache.data),
                }), 200
            except Exception:
                pass
        return jsonify({'error': 'poi_fetch_failed', 'detail': str(e)}), 502

    if not cache:
        cache = PropertyPoiCache(property_id=prop.id)
        db.session.add(cache)

    cache.latitude = lat
    cache.longitude = lng
    cache.radius_m = radius_m
    cache.poi_types = json.dumps(poi_types)
    cache.data = json.dumps(pois)
    cache.fetched_at = now
    db.session.commit()

    return jsonify({
        'property_id': prop.id,
        'latitude': lat,
        'longitude': lng,
        'radius_m': radius_m,
        'types': poi_types,
        'cached': False,
        'fetched_at': cache.fetched_at.isoformat() if cache.fetched_at else None,
        'pois': pois,
    }), 200

@app.route('/api/builders', methods=['GET'])
def get_builders():
    builder_columns = set()
    try:
        inspector = inspect(db.engine)
        if inspector.has_table('builder'):
            builder_columns = {column['name'] for column in inspector.get_columns('builder')}
    except Exception as e:
        print(f"Error inspecting builder schema: {str(e)}")
        db.session.rollback()

    if 'id' in builder_columns:
        try:
            print("Fetching builders...")  # Debug log
            builders = Builder.query.all()
            print(f"Found {len(builders)} builders")  # Debug log

            builders_data = [builder.to_dict() for builder in builders]
            return jsonify(builders_data)
        except Exception as e:
            print(f"Error in get_builders with ORM: {str(e)}")  # Debug log
            db.session.rollback()

    try:
        legacy_rows = db.session.execute(text("""
            SELECT
                b.id AS id,
                b.id AS rera_id,
                b.user_id,
                b.company_name,
                b.brand_name,
                b.established_year,
                b.builder_type,
                b.rera_registered,
                b.corporate_address,
                b.city,
                b.state,
                b.pin_code,
                b.contact_email,
                b.contact_number,
                b.website_url,
                b.builder_logo,
                b.cover_banner,
                b.certificates,
                COALESCE(b.location, MIN(bp.location)) AS location,
                b.short_description,
                b.detailed_description,
                b.completed_projects,
                b.ongoing_projects,
                b.awards,
                b.verified,
                MIN(bp.project_image) AS project_image,
                COUNT(bp.id) AS project_count
            FROM builder b
            LEFT JOIN builder_project bp ON bp.builder_id = b.id
            GROUP BY
                b.id,
                b.user_id,
                b.company_name,
                b.brand_name,
                b.established_year,
                b.builder_type,
                b.rera_registered,
                b.corporate_address,
                b.city,
                b.state,
                b.pin_code,
                b.contact_email,
                b.contact_number,
                b.website_url,
                b.builder_logo,
                b.cover_banner,
                b.certificates,
                b.location,
                b.short_description,
                b.detailed_description,
                b.completed_projects,
                b.ongoing_projects,
                b.awards,
                b.verified
            ORDER BY b.company_name
        """)).mappings().all()

        if legacy_rows:
            return jsonify([dict(row) for row in legacy_rows])

    except Exception as e:
        print(f"Error in get_builders legacy fallback: {str(e)}")
        db.session.rollback()

    try:
        project_rows = db.session.execute(text("""
            SELECT
                bp.builder_id AS id,
                bp.builder_id AS rera_id,
                COALESCE(NULLIF(bp.builder_name, ''), CAST(bp.builder_id AS TEXT)) AS company_name,
                COALESCE(NULLIF(bp.builder_name, ''), CAST(bp.builder_id AS TEXT)) AS brand_name,
                MIN(bp.location) AS location,
                MIN(bp.project_image) AS project_image,
                COUNT(bp.id) AS project_count
            FROM builder_project bp
            WHERE bp.builder_id IS NOT NULL
            GROUP BY bp.builder_id, bp.builder_name
            ORDER BY company_name
        """)).mappings().all()

        return jsonify([dict(row) for row in project_rows])

    except Exception as e:
        print(f"Error in get_builders project fallback: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/builders/search', methods=['GET'])
def search_builders_by_query():
    """Search builders by name, city, or project name with fuzzy matching."""
    q = request.args.get('q', '', type=str).strip()
    if not q:
        builders = Builder.query.all()
        return jsonify([b.to_dict() for b in builders])
    try:
        from sqlalchemy import or_
        # Direct ILIKE match on builder fields + project titles via JOIN
        matched = Builder.query.outerjoin(
            BuilderProject, BuilderProject.builder_id == Builder.id
        ).filter(
            or_(
                Builder.company_name.ilike(f'%{q}%'),
                Builder.brand_name.ilike(f'%{q}%'),
                Builder.city.ilike(f'%{q}%'),
                Builder.state.ilike(f'%{q}%'),
                BuilderProject.title.ilike(f'%{q}%'),
                BuilderProject.location.ilike(f'%{q}%'),
            )
        ).distinct().all()

        # pg_trgm fuzzy fallback if no results
        if not matched and db.engine.dialect.name == 'postgresql':
            fuzzy_ids = db.session.execute(text("""
                SELECT DISTINCT b.id FROM builder b
                LEFT JOIN builder_project bp ON bp.builder_id = b.id
                WHERE b.company_name % :q OR b.brand_name % :q
                   OR b.city % :q OR bp.title % :q
            """), {'q': q}).fetchall()
            ids = [r[0] for r in fuzzy_ids]
            if ids:
                matched = Builder.query.filter(Builder.id.in_(ids)).all()

        return jsonify([b.to_dict() for b in matched])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# New endpoint to fetch builder by company_name
@app.route('/api/builders/name/<company_name>', methods=['GET'])
# 6 @jwt_required()
def get_builder_by_name(company_name):
    """
    Get builder by company name (case-insensitive, handles URL-encoded names)
    """
    try:
        # Decode URL-encoded name and normalize (replace hyphens/underscores with spaces)
        normalized_name = company_name.replace('-', ' ').replace('_', ' ').strip()
        
        print(f"Searching for builder: '{normalized_name}'")  # Debug log
        
        # Try exact match first (case-insensitive)
        builder = Builder.query.filter(
            Builder.company_name.ilike(normalized_name)
        ).first()
        
        # If not found, try partial match
        if not builder:
            builder = Builder.query.filter(
                Builder.company_name.ilike(f'%{normalized_name}%')
            ).first()
        
        # If still not found, try matching individual words
        if not builder:
            words = normalized_name.split()
            for word in words:
                if len(word) > 3:  # Only search meaningful words
                    builder = Builder.query.filter(
                        Builder.company_name.ilike(f'%{word}%')
                    ).first()
                    if builder:
                        break
        
        if not builder:
            print(f"Builder not found for name: '{normalized_name}'")  # Debug log
            # List all available builders for debugging
            all_builders = Builder.query.all()
            available_names = [b.company_name for b in all_builders]
            print(f"Available builders: {available_names}")
            
            return jsonify({
                'error': 'Builder not found',
                'searched_name': normalized_name,
                'available_builders': available_names[:5]  # Return first 5 for reference
            }), 404
        
        print(f"Builder found: {builder.company_name}")  # Debug log
        return jsonify(builder.to_dict())
        
    except Exception as e:
        print(f"Error in get_builder_by_name: {str(e)}")  # Debug log
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ── Fuzzy autocomplete — sourced directly from live DB tables ──────────────────
# Pulls from property, builder_project, project_amenity, unit_config so the
# suggestions are always in sync with real data — no separate seed step needed.
@app.route('/api/search/suggest', methods=['GET'])
def get_search_suggestions():
    q = request.args.get('q', '').strip()
    if len(q) < 2:
        return jsonify([])
    try:
        if db.engine.dialect.name == 'postgresql':
            rows = db.session.execute(text("""
                WITH candidates AS (
                    -- Locations from property table
                    SELECT DISTINCT "Location" AS phrase FROM property
                        WHERE "Location" IS NOT NULL AND "Location" <> ''
                    UNION
                    -- Project names from property table
                    SELECT DISTINCT "Property_Name" FROM property
                        WHERE "Property_Name" IS NOT NULL AND "Property_Name" <> ''
                    UNION
                    -- Project status (e.g. "Under Construction", "Ready to Move")
                    SELECT DISTINCT "Project_Status" FROM property
                        WHERE "Project_Status" IS NOT NULL AND "Project_Status" <> ''
                    UNION
                    -- Builder project titles (e.g. "The Trellis")
                    SELECT DISTINCT title FROM builder_project
                        WHERE title IS NOT NULL AND title <> ''
                    UNION
                    -- Builder project locations
                    SELECT DISTINCT location FROM builder_project
                        WHERE location IS NOT NULL AND location <> ''
                    UNION
                    -- Amenity names (e.g. "Swimming Pool", "Gym")
                    SELECT DISTINCT name FROM project_amenity
                        WHERE name IS NOT NULL AND name <> ''
                    UNION
                    -- BHK types (e.g. "2 BHK", "3 BHK")
                    SELECT DISTINCT bhk_type FROM unit_config
                        WHERE bhk_type IS NOT NULL AND bhk_type <> ''
                    UNION
                    -- Builder company names
                    SELECT DISTINCT company_name FROM builder
                        WHERE company_name IS NOT NULL AND company_name <> ''
                    UNION
                    -- Builder brand names
                    SELECT DISTINCT brand_name FROM builder
                        WHERE brand_name IS NOT NULL AND brand_name <> ''
                    UNION
                    -- Builder cities
                    SELECT DISTINCT city FROM builder
                        WHERE city IS NOT NULL AND city <> ''
                )
                SELECT phrase FROM candidates
                WHERE phrase ILIKE :prefix   -- prefix match (fast, works for short input)
                   OR phrase % :q            -- trigram fuzzy match (typo tolerance)
                ORDER BY
                    CASE WHEN LOWER(phrase) LIKE LOWER(:prefix) THEN 0 ELSE 1 END,
                    phrase <-> :q
                LIMIT 6
            """), {'q': q, 'prefix': f'%{q}%'}).fetchall()
        else:
            # SQLite fallback: simple LIKE (no pg_trgm)
            rows = db.session.execute(text("""
                SELECT "Location" AS phrase FROM property
                    WHERE "Location" LIKE :pat
                UNION
                SELECT "Property_Name" FROM property
                    WHERE "Property_Name" LIKE :pat
                UNION
                SELECT title FROM builder_project
                    WHERE title LIKE :pat
                UNION
                SELECT name FROM project_amenity
                    WHERE name LIKE :pat
                LIMIT 6
            """), {'pat': f'%{q}%'}).fetchall()

        seen = set()
        results = []
        for r in rows:
            phrase = (r[0] or '').strip()
            if phrase and phrase.lower() not in seen:
                seen.add(phrase.lower())
                results.append(phrase)
        return jsonify(results), 200
    except Exception:
        return jsonify([]), 200



@app.route('/api/builders/<int:builder_id>', methods=['GET'])
def get_builder(builder_id):
    try:
        builder = Builder.query.get_or_404(builder_id)
        return jsonify(builder.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/builders', methods=['POST'])
@admin_only
def create_builder():
    try:
        user_id = request.form.get('user_id')
        if not user_id:
            return jsonify({'message': 'User ID is required'}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        # Check duplicate by company name
        company_name = request.form.get('companyName', '').strip()
        if company_name and Builder.query.filter(Builder.company_name.ilike(company_name)).first():
            return jsonify({'message': 'Builder with this company name already exists'}), 400

        # Handle file uploads — use a temp prefix until id is known
        builder_logo = request.files.get('builderLogo')
        cover_banner = request.files.get('coverBanner')
        certificates = request.files.getlist('certificates')

        logo_path = None
        if builder_logo and allowed_file(builder_logo.filename):
            filename = secure_filename(f"logo_{builder_logo.filename}")
            logo_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            builder_logo.save(logo_path)

        banner_path = None
        if cover_banner and allowed_file(cover_banner.filename):
            filename = secure_filename(f"banner_{cover_banner.filename}")
            banner_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            cover_banner.save(banner_path)

        certificate_paths = []
        for cert in certificates:
            if cert and allowed_file(cert.filename):
                filename = secure_filename(f"cert_{cert.filename}")
                cert_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                cert.save(cert_path)
                certificate_paths.append(cert_path)

        # Create new builder
        new_builder = Builder(
            user_id=user_id,
            company_name=request.form.get('companyName'),
            brand_name=request.form.get('brandName'),
            established_year=request.form.get('establishedYear'),
            builder_type=request.form.get('builderType'),
            rera_registered=request.form.get('reraRegistered') == 'true',
            corporate_address=request.form.get('corporateAddress'),
            city=request.form.get('city'),
            state=request.form.get('state'),
            pin_code=request.form.get('pinCode'),
            contact_email=request.form.get('contactEmail'),
            contact_number=request.form.get('contactNumber'),
            website_url=request.form.get('websiteUrl'),
            builder_logo=logo_path,
            cover_banner=banner_path,
            certificates=json.dumps(certificate_paths),
            location=request.form.get('location'),
            short_description=request.form.get('shortDescription'),
            detailed_description=request.form.get('detailedDescription'),
            completed_projects=request.form.get('completedProjects'),
            ongoing_projects=request.form.get('ongoingProjects'),
            awards=request.form.get('awards'),
            verified=False
        )
    
        db.session.add(new_builder)
        db.session.commit()
    
        return jsonify({
            'message': 'Builder profile created successfully',
            'builder': new_builder.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating builder: {str(e)}")
        return jsonify({'message': f'Error creating builder profile: {str(e)}'}), 500

@app.route('/api/builders/<int:builder_id>', methods=['PUT'])
def update_builder(builder_id):
    try:
        builder = Builder.query.get_or_404(builder_id)
        data = request.get_json()

        # Update builder fields
        for field in ['company_name', 'brand_name', 'established_year', 'builder_type',
                     'rera_registered', 'corporate_address', 'city', 'state',
                     'pin_code', 'contact_email', 'contact_number', 'website_url',
                     'location', 'short_description', 'detailed_description',
                     'completed_projects', 'ongoing_projects', 'verified']:
            if field in data:
                setattr(builder, field, data[field])

        db.session.commit()
        return jsonify({'message': 'Builder updated successfully', 'builder': builder.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/builders/<int:builder_id>', methods=['DELETE'])
def delete_builder(builder_id):
    try:
        builder = Builder.query.get_or_404(builder_id)
        db.session.delete(builder)
        db.session.commit()
        return jsonify({'message': 'Builder deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/builders/<int:builder_id>/projects', methods=['GET'])
def get_builder_projects(builder_id):
    try:
        status = request.args.get('status')
        query = BuilderProject.query.filter_by(builder_id=builder_id)
        if status:
            # Allow partial, case-insensitive match for status
            query = query.filter(BuilderProject.status.ilike(f"%{status}%"))
        projects = query.order_by(BuilderProject.id.asc()).all()
        unique_projects = []
        seen_keys = set()
        for project in projects:
            key = (
                (project.title or '').strip().lower(),
                (project.location or '').strip().lower(),
                (project.builder_name or '').strip().lower(),
            )
            if key in seen_keys:
                continue
            seen_keys.add(key)
            unique_projects.append(project)
        return jsonify([project.to_dict() for project in unique_projects])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def _create_property_for_project(project, user_id, data):
    config_blob = _serialize_unit_configs(list(project.unit_configs or []))
    amenity_names = _get_project_amenity_names(project)
    project_highlights = _merge_unique_sequence(
        _safe_json_load(project.highlights, default=[]),
        _safe_json_load(project.usps, default=[]),
        _coerce_list(data.get('Highlights')),
    )

    new_property = Property(
        Property_Name=project.title,
        Location=project.location,
        latitude=project.latitude,
        longitude=project.longitude,
        location_source=project.location_source or ('manual' if project.latitude is not None and project.longitude is not None else None),
        Builder_Name=project.builder_name,
        Project_Status=project.property_status or project.status,
        Possession_Date=project.possession_date.isoformat() if project.possession_date else None,
        user_id=user_id,
        project_id=project.id,
        RERA_ID=data.get('RERA_ID'),
        Carpet_Area=data.get('Carpet_Area') or _format_area_range(project.carpet_area_min, project.carpet_area_max),
        Price_Starting_From=data.get('Price_Starting_From') or project.price_range,
        Pricing=data.get('Pricing'),
        Highlights=json.dumps(project_highlights) if project_highlights else None,
        Extra_Charges=data.get('Extra_Charges'),
        Builder_Details=json.dumps(data.get('Builder_Details')),
        Existing_Configurations=json.dumps(data.get('Existing_Configurations')) if data.get('Existing_Configurations') is not None else (json.dumps(config_blob) if config_blob else None),
        Built_up_Area=data.get('Built_up_Area'),
        Main_Door_Facing=data.get('Main_Door_Facing'),
        Ceiling_Height=data.get('Ceiling_Height'),
        Kitchen=data.get('Kitchen'),
        Key_Highlights=json.dumps(data.get('Key_Highlights')) if data.get('Key_Highlights') is not None else (json.dumps(amenity_names) if amenity_names else None),
        Address=data.get('Address') or project.full_address,
        Flat_Details=json.dumps(data.get('Flat_Details')),
        Loan_Availability=json.dumps(data.get('Loan_Availability')),
        Approved_by_Authorities=json.dumps(data.get('Approved_by_Authorities')),
        Vastu_Compliant=data.get('Vastu_Compliant'),
        Parking=data.get('Parking'),
        Lift_Availability=data.get('Lift_Availability'),
        Security=data.get('Security'),
        Connectivity=json.dumps(data.get('Connectivity'))
    )
    db.session.add(new_property)
    db.session.flush()
    _sync_property_from_project(project, new_property)
    return new_property
    

#-----------------STEP 1 ROUTING FETCHING DETAILS FROM FRONTEND AND PUSHING TO DATABASE------------------------
@app.route('/api/builders/<int:builder_id>/projects/step1', methods=['POST'])
@admin_only
def create_project_step1(builder_id):
    data = request.json
    title = data['title']
    location = data['location']
    builder_name = data.get('builder_name')
    if not builder_name:
        builder = Builder.query.get(builder_id)
        builder_name = builder.company_name if builder else None
    new_project = BuilderProject(
        builder_id=builder_id,
        builder_name=builder_name,
        title=title,
        description=data.get('description'),
        location=location,
        property_type=data.get('property_type'),
        sub_type=data.get('sub_type'),
        property_status=data.get('property_status'),
        possession_date=None, # handled elsewhere
        configuration=json.dumps(data.get('configuration')) if data.get('configuration') else None,
        total_units=data.get('total_units'),
        price_range=data.get('price_range'),
        completion_date=None, # handled elsewhere
        status=data.get('status'),
        image_urls=data.get('image_urls'),
        form_status=data.get('form_status', 'draft'),
        full_address=data.get('full_address'),
        state=data.get('state'),
        city=data.get('city'),
        locality=data.get('locality'),
        landmark=data.get('landmark'),
        towers=data.get('towers'),
        floors_per_tower=data.get('floors_per_tower'),
        construction_status=data.get('construction_status'),
        development_group=data.get('development_group'),
        elevation=data.get('elevation'),
        structure_description=data.get('structure_description'),
        jodi_options=_json_list_or_none(data.get('jodi_options')),
        usps=_json_list_or_none(data.get('usps')),
        highlights=_json_list_or_none(data.get('highlights')),
    )
    db.session.add(new_project)
    db.session.flush()
    _sync_project_related_data(
        new_project,
        payload=data,
        replace_unit_configs=("unit_configs" in data or "configuration" in data),
        replace_amenities=("project_amenities" in data or "amenities" in data),
        sync_properties=False,
    )
    db.session.commit()
    return jsonify(new_project.to_dict()), 201

@app.route('/api/builders/<int:builder_id>/projects/step2', methods=['POST'])
@admin_only
def create_project_step2(builder_id):
    data = request.json
    project_id = data.get('project_id')
    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400
    project = BuilderProject.query.filter_by(id=project_id, builder_id=builder_id).first_or_404()
    # Update fields for step 2
    project.total_units = data.get('totalUnits')
    project.price_range = f"{data.get('priceMin', '')} - {data.get('priceMax', '')}"
    project.price_per_sqft = data.get('pricePerSqft')
    project.carpet_area_min = data.get('carpetAreaMin')
    project.carpet_area_max = data.get('carpetAreaMax')
    project.booking_amount = data.get('bookingAmount')
    project.flat_number = data.get('flat_number')
    project.form_status = 'step2_complete'
    _sync_project_related_data(
        project,
        payload=data,
        replace_unit_configs=True,
        sync_properties=False,
    )
    db.session.commit()
    return jsonify(project.to_dict()), 200

@app.route('/api/builders/<int:builder_id>/projects/step4', methods=['POST'])
@admin_only
def create_project_step4(builder_id):
    # Handle both form data and JSON data
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form
    else:
        data = request.json
    
    project_id = data.get('project_id')
    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400
    
    # Allow updating any project, not just from the current builder
    project = BuilderProject.query.filter_by(id=project_id).first_or_404()
    
    # Handle file uploads for floor plans
    floor_plan_urls = []
    if 'floor_plans' in request.files:
        files = request.files.getlist('floor_plans')
        for file in files:
            if file and allowed_file(file.filename):
                filename = save_image(file)
                if filename:
                    floor_plan_urls.append(f'/uploads/{filename}')
    
    # Update fields for step 4
    project.towers = int(data.get('towers')) if data.get('towers') else None
    project.floors_per_tower = int(data.get('floors_per_tower')) if data.get('floors_per_tower') else None
    project.construction_status = data.get('construction_status')
    project.floor_plans = json.dumps(floor_plan_urls)
    project.form_status = 'step4_complete'
    
    db.session.commit()
    return jsonify(project.to_dict()), 200

@app.route('/api/builders/<int:builder_id>/projects/step5', methods=['POST'])
@admin_only
def create_project_step5(builder_id):
    data = request.json
    project_id = data.get('project_id')
    user_id = data.get('user_id')

    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    
    # Allow updating any project, not just from the current builder
    project = BuilderProject.query.filter_by(id=project_id).first_or_404()
    
    # Update fields for step 5
    project.form_status = 'step5_complete'

    _create_property_for_project(project, user_id, data)
    _sync_project_related_data(
        project,
        payload=data,
        replace_unit_configs=("unit_configs" in data or "configuration" in data),
        replace_amenities=("project_amenities" in data or "amenities" in data),
        sync_properties=True,
    )
    db.session.commit()

    return jsonify(project.to_dict()), 200

def generate_slug_with_perplexity(project, api_key):
    """
    Calls Perplexity AI to generate a slug for a builder project.
    Fallbacks to slugify if the API call fails.
    """
    import requests
#-----------------------------------------PROMPTING WITH AI-----------------------------------------------
    
    prompt = (
        f"Generate a short, SEO-friendly, unique URL slug for a real estate project. "
        f"Only return the slug, no extra text. "
        f"Builder: {project.builder_name}\n"
        f"Project Title: {project.title}\n"
        f"Description: {project.description}\n"
        f"Property Type: {project.property_type}\n"
        f"Sub Type: {project.sub_type}\n"
        f"Locality: {project.locality}\n"
        f"City: {project.city}\n"
        f"Price Range: {project.price_range}\n"
        f"Configuration: {project.configuration}"
    )
    url = "https://api.perplexity.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "pplx-70b-online",  
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 20,
        "temperature": 0.2
    }
    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        response.raise_for_status()
        slug = response.json()['choices'][0]['message']['content'].strip()
        # Sanitize slug: lowercase, replace spaces/underscores with hyphens, remove non-url chars
        slug = slug.lower()
        slug = re.sub(r'[^a-z0-9\- ]', '', slug)
        slug = slug.replace(' ', '-').replace('_', '-')
        slug = re.sub(r'-+', '-', slug).strip('-')
        return slug
    except Exception as e:
        # Fallback to slugify
        return slugify(f"{project.title}-{project.locality}-{project.city}")

@app.route('/api/builders/<int:builder_id>/projects/<int:project_id>', methods=['PATCH'])
def update_project_step(builder_id, project_id):
    try:
        data = request.json
        project = BuilderProject.query.filter_by(id=project_id, builder_id=builder_id).first_or_404()
        replace_unit_configs = 'unit_configs' in data or 'configuration' in data
        replace_amenities = 'project_amenities' in data or 'amenities' in data
        # Update only provided fields
        for key, value in data.items():
            if key in {'unit_configs', 'project_amenities'}:
                continue
            if key == 'floor_plans':
                # Always save as JSON array
                if isinstance(value, str):
                    try:
                        parsed = json.loads(value)
                        if not isinstance(parsed, list):
                            parsed = [parsed]
                        value = json.dumps(parsed)
                    except Exception:
                        value = json.dumps([value])
                elif isinstance(value, list):
                    value = json.dumps(value)
                setattr(project, key, value)
            elif key == 'amenities':
                if isinstance(value, str):
                    try:
                        parsed = json.loads(value)
                        if not isinstance(parsed, list):
                            parsed = [parsed]
                        value = json.dumps(parsed)
                    except Exception:
                        value = json.dumps([value])
                elif isinstance(value, list):
                    value = json.dumps(value)
                setattr(project, key, value)
            elif key == 'configuration':
                if isinstance(value, str):
                    try:
                        parsed = json.loads(value)
                        value = json.dumps(parsed)
                    except Exception:
                        value = json.dumps(_coerce_list(value))
                else:
                    value = json.dumps(_coerce_list(value))
                setattr(project, key, value)
            elif key in {'jodi_options', 'usps', 'highlights'}:
                setattr(project, key, _json_list_or_none(value))
            elif hasattr(project, key):
                setattr(project, key, value)
        _sync_project_related_data(
            project,
            payload=data,
            replace_unit_configs=replace_unit_configs,
            replace_amenities=replace_amenities,
            sync_properties=True,
        )
        # Optionally update form_status
        if 'form_status' in data:
            project.form_status = data['form_status']
        db.session.commit()
        # After step 3, generate slugs if all required fields are present
        required_fields = [project.configuration, project.property_type, project.locality, project.builder_name, project.city, project.price_range]
        if all(required_fields):
            # Use Perplexity AI to generate the primary slug
            api_key = os.getenv('PERPLEXITY_API_KEY')
            primary_slug = generate_slug_with_perplexity(project, api_key)
            # Optionally, generate alias slugs using variations (fallback to slugify for aliases)
            config_labels = _get_project_configuration_labels(project)
            bhk = str(config_labels[0]) if config_labels else ''
            property_type = str(project.property_type or '')
            locality = str(project.locality or '')
            builder = str(project.builder_name or '')
            city = str(project.city or '')
            price_range = str(project.price_range or '')
            property_type_variant = str(project.sub_type or property_type)
            bhk_as_text = f"{bhk}-bedroom" if bhk else ''
            alias_slugs = [
                slugify(f"/project/{bhk}-{locality}-{property_type}"),
                slugify(f"/project/{locality}-{bhk}-{property_type_variant}-{builder}"),
                slugify(f"/project/{bhk_as_text}-{property_type}-in-{city}"),
                slugify(f"/project/{bhk}-in-{locality}-under-{price_range}"),
                slugify(f"/project/{locality}-{property_type}-{bhk}-{builder}")
            ]
            project.primary_slug = primary_slug
            project.alias_slugs = json.dumps(alias_slugs)
            db.session.commit()
            # Remove old slugs for this project
            Slug.query.filter_by(target_type='project', target_id=project.id).delete()
            db.session.commit()
            db.session.add(Slug(slug=primary_slug, target_type='project', target_id=project.id, is_primary=True))
            for alias in alias_slugs:
                db.session.add(Slug(slug=alias, target_type='project', target_id=project.id, is_primary=False))
            db.session.commit()
            # Return slugs in response
            result = project.to_dict()
            result['primary_slug'] = primary_slug
            result['alias_slugs'] = alias_slugs
            return jsonify(result), 200
        return jsonify(project.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
@admin_only
def delete_project(project_id):
    project = BuilderProject.query.get_or_404(project_id)
    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Project deleted successfully'})

#--------------------------------------------- ADMIN ROUTES ---------------------------------------------
#--------------------------------------------- DONT EVEN THINK TO TOUCH THIS  ---------------------------------------------
#----------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------
@app.route('/api/admin/stats', methods=['GET'])
@admin_only
def get_admin_stats():
    try:
        print("Starting to fetch admin stats...")  # Debug log
        
        # Get total users
        total_users = User.query.count()
        print(f"Total users: {total_users}")  # Debug log
        
        # Get total properties
        total_properties = Property.query.count()
        print(f"Total properties: {total_properties}")  # Debug log
        
        # Get total enquiries
        total_enquiries = Enquiry.query.count()
        print(f"Total enquiries: {total_enquiries}")  # Debug log
        
        # Get total reviews
        total_reviews = Review.query.count()
        print(f"Total reviews: {total_reviews}")  # Debug log
        
        # Get recent activities
        print("Fetching recent activities...")  # Debug log
        recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
        recent_properties = Property.query.order_by(Property.created_at.desc()).limit(5).all()
        recent_enquiries = Enquiry.query.order_by(Enquiry.timestamp.desc()).limit(5).all()
        
        # Combine and sort activities
        activities = []
        
        for user in recent_users:
            activities.append({
                'type': 'user',
                'title': user.username,
                'description': 'New user registered',
                'timestamp': user.created_at.isoformat() if user.created_at else None
            })
            
        for property in recent_properties:
            activities.append({
                'type': 'property',
                'title': property.Property_Name,
                'description': 'New property listed',
                'timestamp': property.created_at.isoformat() if property.created_at else None
            })
            
        for enquiry in recent_enquiries:
            activities.append({
                'type': 'enquiry',
                'title': f'Enquiry for Property #{enquiry.property_id}',
                'description': 'New enquiry received',
                'timestamp': enquiry.timestamp.isoformat() if enquiry.timestamp else None
            })
        
        # Sort activities by timestamp
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        # Take only the 5 most recent activities
        recent_activities = activities[:5]
        print(f"Recent activities count: {len(recent_activities)}")  # Debug log
        
        response_data = {
            'totalUsers': total_users,
            'totalProperties': total_properties,
            'totalEnquiries': total_enquiries,
            'totalReviews': total_reviews,
            'recentActivities': recent_activities
        }
        print("Successfully prepared response data")  # Debug log
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error in get_admin_stats: {str(e)}")  # Debug log
        import traceback
        print(traceback.format_exc())  # Print full stack trace
        return jsonify({'error': str(e)}), 500

#--------------------------------------------- USER MANAGEMENT ROUTES ---------------------------------------------
@app.route('/api/users', methods=['GET'])
@admin_only
def get_users():
    try:
        # Get the token from the Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No authorization token provided'}), 401

        # Get all users
        users = User.query.all()
        users_data = [{
            'id': user.id,
            'name': user.username,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active if hasattr(user, 'is_active') else True,
            'created_at': user.created_at.isoformat() if user.created_at else None
        } for user in users]
        
        return jsonify(users_data)
    except Exception as e:
        print(f"Error in get_users: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:id>', methods=['GET'])
@jwt_required()
def get_user(id):
    try:
        user = User.query.get_or_404(id)
        return jsonify({
            'id': user.id,
            'name': user.username,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active if hasattr(user, 'is_active') else True,
            'created_at': user.created_at.isoformat() if user.created_at else None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/projects/<int:project_id>', methods=['GET'])
def get_builder_project_by_id(project_id):
    project = BuilderProject.query.get(project_id)
    if not project:
        return jsonify({'error': 'Builder project not found'}), 404
    return jsonify(project.to_dict())

@app.route('/api/users/<int:id>', methods=['PUT'])
@admin_only
def update_user(id):
    try:
        user = User.query.get_or_404(id)
        data = request.get_json()

        # Update user fields
        if 'name' in data:
            user.username = data['name']
        if 'email' in data:
            user.email = data['email']
        if 'role' in data:
            user.role = data['role']
        if 'is_active' in data:
            user.is_active = data['is_active']
        # Add more fields as needed

        db.session.commit()
        return jsonify({
            'message': 'User updated successfully',
            'user': {
                'id': user.id,
                'name': user.username,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active if hasattr(user, 'is_active') else True,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:id>', methods=['DELETE'])
@admin_only
def delete_user(id):
    try:
        user = User.query.get_or_404(id)
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Utility to generate slug from title
import re
from unicodedata import normalize

def generate_slug(title):
    slug = normalize('NFKD', title).encode('ascii', 'ignore').decode('ascii')
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', slug).lower()
    slug = re.sub(r'\s+', '-', slug).strip('-')
    return slug

# Utility to save uploaded images
def save_image(file):
    if file and allowed_file(file.filename):
        # Check file size (5MB limit per image)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > 5 * 1024 * 1024:  # 5MB limit
            return None  # File too large
        
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return filename  # Only return the filename, not the full path
    return None

# API to create a blog (multipart/form-data)
@app.route('/api/blogs', methods=['POST'])
@admin_only
def create_blog():
    try:
        data = request.form
        files = request.files
        title = data.get('title')
        intro_paragraph1 = data.get('introParagraph')
        subheading1 = data.get('subheading1')
        content1 = data.get('content1')
        subheading2 = data.get('subheading2')
        content2 = data.get('content2')
        subheading3 = data.get('subheading3')
        content3 = data.get('content3')
        meta_description = data.get('metaDescription')
        focus_keywords = data.get('focusKeywords')
        slug = data.get('slug') or generate_slug(title)
        featured_image_alt = data.get('featuredImageAlt')
        alt_text1 = data.get('altText1')
        alt_text2 = data.get('altText2')
        alt_text3 = data.get('altText3')
        interlinks = data.get('interlinks')  # JSON string
        external_links = data.get('externalLinks')  # JSON string

        # Save images
        featured_image = save_image(files.get('featuredImage'))
        image1 = save_image(files.get('image1'))
        image2 = save_image(files.get('image2'))
        image3 = save_image(files.get('image3'))

        # Ensure slug is unique
        if Blog.query.filter_by(slug=slug).first():
            return jsonify({'error': 'Slug already exists'}), 400

        blog = Blog(
            title=title,
            intro_paragraph=intro_paragraph1,
            subheading1=subheading1,
            content1=content1,
            image1=image1,
            alt_text1=alt_text1,
            subheading2=subheading2,
            content2=content2,
            image2=image2,
            alt_text2=alt_text2,
            subheading3=subheading3,
            content3=content3,
            image3=image3,
            alt_text3=alt_text3,
            featured_image=featured_image,
            featured_image_alt=featured_image_alt,
            interlinks=interlinks,
            external_links=external_links,
            meta_description=meta_description,
            focus_keywords=focus_keywords,
            slug=slug
        )
        db.session.add(blog)
        db.session.commit()
        return jsonify({'success': True, 'blog': blog.to_dict()}), 201
    except Exception as e:
        return jsonify({'error': f'Blog creation failed: {str(e)}'}), 500

# API to list all blogs (for admin dashboard)
@app.route('/api/blogs', methods=['GET'])
@jwt_required()
def list_blogs():
    blogs = Blog.query.order_by(Blog.created_at.desc()).all()
    print(f"Found {len(blogs)} blogs")
    for blog in blogs:
        print(f"Blog: {blog.title} - Slug: {blog.slug}")
    return jsonify([b.to_dict() for b in blogs])

# Get a single blog by ID
@app.route('/api/blogs/<int:blog_id>', methods=['GET'])
@jwt_required()
def get_blog(blog_id):
    blog = Blog.query.get_or_404(blog_id)
    return jsonify(blog.to_dict())

# Get a single blog by slug
@app.route('/api/blogs/slug/<slug>', methods=['GET'])
@jwt_required()
def get_blog_by_slug(slug):
    print(f"Fetching blog with slug: {slug}")
    blog = Blog.query.filter_by(slug=slug).first()
    if not blog:
        print(f"Blog not found for slug: {slug}")
        return jsonify({'error': 'Blog not found'}), 404
    print(f"Blog found: {blog.title}")
    return jsonify(blog.to_dict())

# Update a blog by ID (multipart/form-data for images)
@app.route('/api/blogs/<int:blog_id>', methods=['PUT'])
def update_blog(blog_id):
    blog = Blog.query.get_or_404(blog_id)
    data = request.form
    files = request.files
    blog.title = data.get('title', blog.title)
    blog.intro_paragraph = data.get('introParagraph', blog.intro_paragraph)
    blog.subheading1 = data.get('subheading1', blog.subheading1)
    blog.content1 = data.get('content1', blog.content1)
    blog.subheading2 = data.get('subheading2', blog.subheading2)
    blog.content2 = data.get('content2', blog.content2)
    blog.subheading3 = data.get('subheading3', blog.subheading3)
    blog.content3 = data.get('content3', blog.content3)
    blog.meta_description = data.get('metaDescription', blog.meta_description)
    blog.focus_keywords = data.get('focusKeywords', blog.focus_keywords)
    blog.slug = data.get('slug', blog.slug)
    blog.featured_image_alt = data.get('featuredImageAlt', blog.featured_image_alt)
    blog.alt_text1 = data.get('altText1', blog.alt_text1)
    blog.alt_text2 = data.get('altText2', blog.alt_text2)
    blog.alt_text3 = data.get('altText3', blog.alt_text3)
    blog.interlinks = data.get('interlinks', blog.interlinks)
    blog.external_links = data.get('externalLinks', blog.external_links)
    # Update images if new files are uploaded
    if files.get('featuredImage'):
        blog.featured_image = save_image(files.get('featuredImage'))
    if files.get('image1'):
        blog.image1 = save_image(files.get('image1'))
    if files.get('image2'):
        blog.image2 = save_image(files.get('image2'))
    if files.get('image3'):
        blog.image3 = save_image(files.get('image3'))
    db.session.commit()
    return jsonify({'success': True, 'blog': blog.to_dict()})

# Delete a blog by ID (and its images)
@app.route('/api/blogs/<int:blog_id>', methods=['DELETE'])
def delete_blog(blog_id):
    blog = Blog.query.get_or_404(blog_id)
    # Optionally, delete image files from disk
    for img_field in ['featured_image', 'image1', 'image2', 'image3']:
        img = getattr(blog, img_field)
        if img:
            img_path = os.path.join(app.config['UPLOAD_FOLDER'], img)
            if os.path.exists(img_path):
                try:
                    os.remove(img_path)
                except Exception:
                    pass
    db.session.delete(blog)
    db.session.commit()
    return jsonify({'success': True})

# Serve SEO-friendly blog page
from flask import render_template_string
@app.route('/blog/<slug>', methods=['GET'])
def serve_blog(slug):
    blog = Blog.query.filter_by(slug=slug).first_or_404()
    # Render interlinks and external links
    interlinks_html = ''
    if blog.interlinks:
        links = json.loads(blog.interlinks)
        if links:
            interlinks_html = '<h3>Related Articles</h3><ul>' + ''.join(f'<li><a href="{l}">{l}</a></li>' for l in links) + '</ul>'
    external_links_html = ''
    if blog.external_links:
        links = json.loads(blog.external_links)
        if links:
            external_links_html = '<h3>External Resources</h3><ul>' + ''.join(f'<li><a href="{l}" target="_blank" rel="noopener noreferrer">{l}</a></li>' for l in links) + '</ul>'
    html = f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{blog.title}</title>
        <meta name="description" content="{blog.meta_description or ''}">
        <meta property="og:title" content="{blog.title}">
        <meta property="og:description" content="{blog.meta_description or ''}">
        <meta property="og:type" content="article">
        <meta property="og:url" content="{{request.url}}">
        <meta name="keywords" content="{blog.focus_keywords or ''}">
    </head>
    <body>
        <h1>{blog.title}</h1>
        <p>{blog.intro_paragraph}</p>
        {'<img src="/' + blog.featured_image + '" alt="' + (blog.featured_image_alt or '') + '" style="max-width:400px;">' if blog.featured_image else ''}
        <h2>{blog.subheading1 or ''}</h2>
        <p>{blog.content1 or ''}</p>
        {'<img src="/' + blog.image1 + '" alt="' + (blog.alt_text1 or '') + '" style="max-width:400px;">' if blog.image1 else ''}
        <h2>{blog.subheading2 or ''}</h2>
        <p>{blog.content2 or ''}</p>
        {'<img src="/' + blog.image2 + '" alt="' + (blog.alt_text2 or '') + '" style="max-width:400px;">' if blog.image2 else ''}
        <h2>{blog.subheading3 or ''}</h2>
        <p>{blog.content3 or ''}</p>
        {'<img src="/' + blog.image3 + '" alt="' + (blog.alt_text3 or '') + '" style="max-width:400px;">' if blog.image3 else ''}
        {interlinks_html}
        {external_links_html}
    </body>
    </html>
    '''
    return render_template_string(html)

# Serve uploaded images
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Remove this endpoint since we're using the existing /uploads/<filename> endpoint

# Update /api/projects/slug/<slug> to handle BuilderProject slugs
@app.route('/api/projects/slug/<slug>', methods=['GET'])
def get_project_by_slug(slug):
    slug_entry = Slug.query.filter_by(slug=slug, target_type='project').first()
    if not slug_entry:
        return jsonify({'error': 'Project not found'}), 404
    project = BuilderProject.query.get(slug_entry.target_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    if not slug_entry.is_primary:
        primary_entry = Slug.query.filter_by(target_type='project', target_id=project.id, is_primary=True).first()
        if primary_entry:
            return redirect(f"/api/projects/slug/{primary_entry.slug}", code=301)
    return jsonify(project.to_dict())

# 3. Redirect alias slugs to primary in /api/properties/slug/<slug>
@app.route('/api/properties/slug/<slug>', methods=['GET'])
@jwt_required()
def get_property_by_slug(slug):
    slug_entry = Slug.query.filter_by(slug=slug, target_type='property').first()
    if not slug_entry:
        return jsonify({'error': 'Property not found'}), 404
    property = Property.query.get(slug_entry.target_id)
    if not property:
        return jsonify({'error': 'Property not found'}), 404
    if not slug_entry.is_primary:
        # Redirect to canonical slug
        primary_entry = Slug.query.filter_by(target_type='property', target_id=property.id, is_primary=True).first()
        if primary_entry:
            return redirect(f"/api/properties/slug/{primary_entry.slug}", code=301)
    return jsonify(property.to_dict())

@app.route('/api/projects', methods=['GET'])
def get_all_projects():
    try:
        projects = BuilderProject.query.all()
        return jsonify([p.to_dict() for p in projects])
    except Exception as exc:
        app.logger.exception("Failed to fetch projects")
        db.session.rollback()
        return jsonify({
            'error': 'Failed to fetch projects',
            'details': str(exc) if app.debug else None
        }), 500

@app.route('/api/builders/<int:builder_id>/projects/upload-image', methods=['POST'])
@admin_only
def upload_project_image(builder_id):
    print(f"Upload project image called with builder_id: {builder_id}")
    print(f"Request form data: {request.form}")
    print(f"Request files: {request.files}")
    
    # Accepts multipart/form-data with project_id and project_image
    project_id = request.form.get('project_id')
    print(f"Project ID from form: {project_id}")
    
    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400
    if 'project_image' not in request.files:
        return jsonify({'error': 'project_image file is required'}), 400
    
    file = request.files['project_image']
    print(f"File received: {file.filename}")
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    # Save the image file to uploads folder
    filename = save_image(file)
    print(f"Saved filename: {filename}")
    
    if not filename:
        return jsonify({'error': 'Failed to save image'}), 500
    
    # Update the project
    project = BuilderProject.query.filter_by(id=project_id).first_or_404()
    print(f"Found project: {project.title}")
    
    # Store the image URL in the project_image field
    project.project_image = f'/uploads/{filename}'
    print(f"Setting project_image to: {project.project_image}")
    
    db.session.commit()
    print(f"Database updated successfully")
    
    return jsonify(project.to_dict()), 200

# ---------------------------------------------------------------------GEO LOCATION -----------------------------------------------------------------------


@app.route('/api/geolocation', methods=['POST'])
def receive_geolocation():
    data = request.get_json()
    lat = data.get('latitude')
    lon = data.get('longitude')
    district = None
    full_address = None
    # Reverse geocode using OpenStreetMap Nominatim
    try:
        url = 'https://nominatim.openstreetmap.org/reverse'
        params = {
            'lat': lat,
            'lon': lon,
            'format': 'json',
            'zoom': 10,
            'addressdetails': 1
        }
        headers = {'User-Agent': 'HnSApp/1.0'}
        resp = requests.get(url, params=params, headers=headers, timeout=5)
        if resp.status_code == 200:
            data_json = resp.json()
            address = data_json.get('address', {})
            district = address.get('district') or address.get('county') or address.get('state_district')
            full_address = data_json.get('display_name')
    except Exception as e:
        print(f"Reverse geocoding failed: {e}")
    print(f"Received geolocation: latitude={lat}, longitude={lon}, district={district}, address={full_address}")
    # Store latest
    global latest_geolocation
    latest_geolocation = {'latitude': lat, 'longitude': lon, 'district': district, 'full_address': full_address}
    return jsonify({
        'status': 'success',
        'message': 'Coordinates and location received',
        'received': {'latitude': lat, 'longitude': lon, 'district': district, 'full_address': full_address}
    }), 200

# ---------------------------------------------------------------------GEO LOCATION admin dashboard-----------------------------------------------------------------------

# Security audit endpoint for admins
@app.route('/api/admin/security-audit', methods=['GET'])
@admin_only
def get_security_audit():
    """Get recent security events for admin review"""
    try:
        # Read the last 100 lines from security.log
        log_file = 'security.log'
        if not os.path.exists(log_file):
            return jsonify({'events': [], 'message': 'No security log found'})
        
        with open(log_file, 'r') as f:
            lines = f.readlines()
            # Get last 100 lines
            recent_lines = lines[-100:] if len(lines) > 100 else lines
        
        events = []
        for line in recent_lines:
            if line.strip():
                # Parse log line (basic parsing)
                parts = line.split(' - ')
                if len(parts) >= 4:
                    events.append({
                        'timestamp': parts[0],
                        'logger': parts[1],
                        'level': parts[2],
                        'message': ' - '.join(parts[3:]).strip()
                    })
        
        return jsonify({
            'events': events,
            'total_events': len(events)
        })
    except Exception as e:
        security_logger.error(f"Error reading security audit: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/latest-geolocation', methods=['GET'])
@admin_only
def get_latest_geolocation():
    global latest_geolocation
    # If latest_geolocation is not set, return a default empty response
    try:
        return jsonify(latest_geolocation)
    except Exception:
        return jsonify({'latitude': None, 'longitude': None, 'district': None, 'full_address': None})
    

# ------------------------------------------------------- AI Blog Summarization -------------------------------------------------- ---

@app.route('/api/blogs/<slug>/summary', methods=['GET'])
@clerk_required()
def summarize_blog(slug):
    api_key = os.getenv('PERPLEXITY_API_KEY')
    blog = Blog.query.filter_by(slug=slug).first()
    if not blog:
        return jsonify({'error': 'Blog not found'}), 404

    # If no API key, return a simple summary
    if not api_key:
        content_parts = []
        if blog.title:
            content_parts.append(blog.title)
        if blog.intro_paragraph:
            content_parts.append(blog.intro_paragraph)
        
        # Create a simple summary from the first 200 characters
        content = '\n'.join([str(part) for part in content_parts if part])
        simple_summary = content[:200] + "..." if len(content) > 200 else content
        return jsonify({'summary': simple_summary})

    content_parts = []
    if blog.title:
        content_parts.append(blog.title)
    if blog.intro_paragraph:
        content_parts.append(blog.intro_paragraph)
    if blog.subheading1:
        content_parts.append(blog.subheading1)
    if blog.content1:
        content_parts.append(blog.content1)
    if blog.subheading2:
        content_parts.append(blog.subheading2)
    if blog.content2:
        content_parts.append(blog.content2)
    if blog.subheading3:
        content_parts.append(blog.subheading3)
    if blog.content3:
        content_parts.append(blog.content3)

    content = '\n'.join([str(part) for part in content_parts if part])
    prompt = f"Summarize the following real estate blog for a user in 3-5 sentences.\n\n{content}"
    url = "https://api.perplexity.ai/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "sonar",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 200,
        "temperature": 0.2
    }
    try:
        response = requests.post(url, headers=headers, json=data, timeout=20)
        response.raise_for_status()
        summary = response.json()['choices'][0]['message']['content'].strip()
        return jsonify({'summary': summary})
    except Exception as e:
        # Fallback to simple summary if API fails
        simple_summary = content[:200] + "..." if len(content) > 200 else content
        return jsonify({'summary': simple_summary})


# ------------------------------------------------------- Property Search API -------------------------------------------------- ---


# ---- Helpers for amenities/status normalization and society type derivation ----
def _normalize_amenities(value):
    try:
        if not value:
            return []
        # Accept JSON list or plain string
        if isinstance(value, list):
            raw = value
        elif isinstance(value, str):
            try:
                parsed = json.loads(value)
                raw = parsed if isinstance(parsed, list) else [str(parsed)]
            except Exception:
                raw = [value]
        else:
            raw = [str(value)]

        result = []
        for item in raw:
            if not item:
                continue
            text = str(item)
            # Split only on commas or explicit conjunctions that usually combine two amenities in one index
            # Avoid splitting multi-word amenities like "kids play area"
            parts = []
            for part in re.split(r",|\sand\s|\s&\s|/", text, flags=re.IGNORECASE):
                part = part.strip().strip('-').strip()
                if part:
                    parts.append(part)
            for p in parts:
                normalized = p.lower()
                # Canonical mappings with synonym grouping
                canonical = {
                    # Security-related (kept for completeness though society types come from Property.Security)
                    'cctv security': 'cctv',
                    'cctv': 'cctv',
                    'security': 'security',
                    'manned security': 'security',
                    'multi-tier security': 'security',
                    'access control': 'security',

                    # Club/Gym
                    'club house': 'clubhouse',
                    'clubhouse': 'clubhouse',
                    'gymnasium': 'gym',
                    'gym': 'gym',

                    # Kids area
                    'kids play area': 'kids play area',
                    'children play area': 'kids play area',

                    # Pools (group variants under swimming pool)
                    'swimming pool': 'swimming pool',
                    'pool': 'swimming pool',
                    'podium pool': 'swimming pool',
                    'rooftop pool': 'swimming pool',

                    # Amphitheatre
                    'amphitheatre': 'amphitheatre',
                    'open-air amphitheatre': 'amphitheatre',

                    # Sky amenities
                    'sky deck': 'sky deck',
                    'sky park': 'sky deck',

                    # Party spaces
                    'party hall': 'party hall',
                    'party lawn': 'party hall',

                    # Courts and tracks
                    'jogging track': 'jogging track',
                    'tennis court': 'tennis court',
                    'badminton court': 'badminton court',
                    'basketball court': 'basketball court',

                    # Other amenities
                    'indoor games': 'indoor games',
                    'library': 'library',
                    'yoga room': 'yoga room',
                    'spa': 'spa',
                    'sauna': 'sauna',
                    'multipurpose hall': 'multipurpose hall',
                    'landscaped garden': 'landscaped garden',
                    'gated community': 'gated community',
                    'intercom': 'intercom',
                    'power backup': 'power backup',
                    'lift': 'lift',
                    'elevator': 'lift',
                    'parking': 'covered parking',
                    'covered parking': 'covered parking',
                    'mini-golf': 'mini golf',
                }.get(normalized, normalized)
                result.append(canonical)
        # Deduplicate while preserving order
        seen = set()
        deduped = []
        for x in result:
            if x and x not in seen:
                seen.add(x)
                deduped.append(x)
        return deduped
    except Exception:
        return []

def _derive_society_types(amenities_list):
    items = [a.lower() for a in amenities_list or []]
    derived = set()
    if any(x in items for x in ['gated community', 'access control']):
        derived.add('Gated')
    if any(x in items for x in ['security', 'cctv']):
        derived.add('Advanced Security')
    if any(x in items for x in ['clubhouse', 'community hall', 'multipurpose hall']):
        derived.add('Lounge')
    if any(x in items for x in ['senior citizen area']):
        derived.add('Senior Citizen')
    return sorted(list(derived))

def _normalize_security_types(value):
    try:
        if not value:
            return []
        # Accept list or string
        if isinstance(value, list):
            raw = value
        else:
            raw = [value]
        tokens = []
        for item in raw:
            if not item:
                continue
            text = str(item)
            parts = re.split(r",|\sand\s|\s&\s|/", text, flags=re.IGNORECASE)
            for p in parts:
                p = p.strip().strip('-').strip()
                if p:
                    tokens.append(p)
        # Canonical minimal mapping while preserving descriptive labels
        mapped = []
        for t in tokens:
            low = t.lower()
            canonical = {
                'cctv security': 'CCTV',
                'cctv': 'CCTV',
                'manned security': 'Manned Security',
                'multi-tier security': 'Advanced Security',
                'access control': 'Access Control',
                'gated community': 'Gated',
                'security': 'Advanced Security',
            }.get(low, t.title())
            mapped.append(canonical)
        # Dedupe preserving order
        seen = set()
        result = []
        for x in mapped:
            if x and x not in seen:
                seen.add(x)
                result.append(x)
        return result
    except Exception:
        return []

def _canonical_property_status(value: str) -> str:
    try:
        if not value:
            return ''
        text = str(value).strip().lower()
        # Explicit mappings first
        explicit = {
            'completed': 'Completed',
            'completed/ready': 'Completed',
            'ready to move': 'Completed',
            'ready-to-move': 'Completed',
            'ready': 'Completed',
            'ongoing': 'Ongoing',
            'mixed': 'Mixed',
            'ongoing/completed': 'Ongoing/Completed',
            'ongoing/completed (varies)': 'Ongoing/Completed',
            'ongoing/ready': 'Ongoing/Completed',
        }
        if text in explicit:
            return explicit[text]
        # Heuristics
        if 'mixed' in text:
            return 'Mixed'
        if 'ongoing' in text and ('completed' in text or 'ready' in text or 'varies' in text):
            return 'Ongoing/Completed'
        if 'ongoing' in text:
            return 'Ongoing'
        if 'ready' in text or 'completed' in text:
            return 'Completed'
        # Fallback to title case original
        return str(value).strip().title()
    except Exception:
        return ''

@app.route('/api/properties/filters', methods=['GET'])
def get_filters():
    """Return unique filter options sourced from BuilderProject and Property tables.
    Includes amenities (normalized), property_status, project status, and derived society types.
    Optional query: location= filters to projects/properties matching location.
    """
    location = request.args.get('location', '', type=str)

    # Collect amenities from BuilderProject
    project_query = BuilderProject.query
    if location:
        project_query = project_query.filter(BuilderProject.location.ilike(f"%{location}%"))
    projects = project_query.all()

    amenities_all = []
    amenity_categories_all = []
    property_status_all = []
    society_types_all = []

    for prj in projects:
        amenities_all.extend(_normalize_amenities(_get_project_amenity_names(prj)))
        for row in list(getattr(prj, 'project_amenities', []) or []):
            if row.category:
                amenity_categories_all.append(str(row.category).strip())
        # property status is sourced from Property table per requirements

    # Collect from Property table for status and society types
    prop_query = Property.query
    if location:
        prop_query = prop_query.filter(Property.Location.ilike(f"%{location}%"))
    for prop in prop_query.all():
        if prop.Project_Status:
            property_status_all.append(_canonical_property_status(prop.Project_Status))
        if prop.Security:
            society_types_all.extend(_normalize_security_types(prop.Security))

    # Build unique, nicely-cased amenities list
    amen_set = []
    seen = set()
    for a in sorted(set(amenities_all)):
        label = a.title() if a.isalpha() or ' ' in a else a
        if label not in seen:
            seen.add(label)
            amen_set.append(label)

    # Society types come from Property.Security
    society_types = sorted(set([s for s in society_types_all if s]))

    return jsonify({
        'amenities': amen_set,
        'amenityCategories': sorted(set([c for c in amenity_categories_all if c])),
        'propertyStatus': sorted(set([s for s in property_status_all if s])),
        'societyTypes': society_types,
    })

# Simplified property search endpoint: direct filtering only
@app.route('/api/properties/search', methods=['GET'])
def search_properties():
    location = request.args.get('location', '', type=str).strip()
    price = request.args.get('price', 0, type=float)  # price in Cr (desktop slider)
    min_price = request.args.get('min_price', 0, type=float)
    max_price = request.args.get('max_price', 0, type=float)
    bhk_types = request.args.getlist('type')  # e.g., ['1bhk', '2bhk'] from BHK dropdown
    bhk_search = request.args.get('bhk_search', '', type=str).strip()  # e.g., '2 BHK' from search bar

    # ---- COMPOUND QUERY PARSING ----
    # Handles inputs like "2bhk in ghansoli", "3 BHK koparkhairane", "swimming pool vashi"
    # Splits into separate bhk_search + location terms so both filters apply.
    import re as _re
    if location and not bhk_search:
        # Strip connector words
        _clean = _re.sub(r'\bin\b|\bnear\b|\bat\b', ' ', location, flags=_re.IGNORECASE).strip()
        _bhk_match = _re.search(r'(\d[\d.]*\s*(?:\+\s*\d+)?\s*bhk|\bstudio\b|\bpenthouse\b|\bduplex\b)', _clean, _re.IGNORECASE)
        if _bhk_match:
            bhk_search = _bhk_match.group(0).strip()
            location = _clean[:_bhk_match.start()].strip() + ' ' + _clean[_bhk_match.end():].strip()
            location = location.strip()
    amenities_filter = [a.lower().strip() for a in request.args.getlist('amenities') if a]
    amenity_category_filter = [c.lower().strip() for c in request.args.getlist('amenity_category') if c]
    property_status_filter = [s.lower().strip() for s in request.args.getlist('property_status') if s]
    # Canonicalize requested property status values
    property_status_filter_canonical = set(_canonical_property_status(s) for s in property_status_filter)
    society_type_filter = [t.lower().strip() for t in request.args.getlist('society_type') if t]

    from sqlalchemy import or_

    def _query_by_term(term):
        """Search properties by location, name, status, or project title."""
        return Property.query.outerjoin(
            BuilderProject, Property.project_id == BuilderProject.id
        ).filter(
            or_(
                Property.Location.ilike(f"%{term}%"),
                Property.Property_Name.ilike(f"%{term}%"),
                Property.Project_Status.ilike(f"%{term}%"),
                BuilderProject.title.ilike(f"%{term}%"),
            )
        ).all()

    results = _query_by_term(location) if location else Property.query.all()

    # ---- AMENITY SEARCH FALLBACK ----
    # If location search returned nothing, check if the term matches an amenity name.
    # This means typing "Swimming Pool" or "Gym" in the search bar will work.
    if location and not results:
        try:
            matched_project_ids = set(
                r[0] for r in db.session.execute(
                    text("SELECT DISTINCT project_id FROM project_amenity WHERE LOWER(name) LIKE :pat"),
                    {'pat': f'%{location.lower()}%'}
                ).fetchall()
            )
            if matched_project_ids:
                results = Property.query.filter(
                    Property.project_id.in_(matched_project_ids)
                ).all()
        except Exception:
            pass

    # ---- BHK SEARCH FALLBACK ----
    # If still nothing, check if term matches a BHK type (e.g. "2 BHK").
    if location and not results:
        try:
            matched_project_ids = set(
                r[0] for r in db.session.execute(
                    text("SELECT DISTINCT project_id FROM unit_config WHERE LOWER(bhk_type) LIKE :pat"),
                    {'pat': f'%{location.lower()}%'}
                ).fetchall()
            )
            if matched_project_ids:
                results = Property.query.filter(
                    Property.project_id.in_(matched_project_ids)
                ).all()
        except Exception:
            pass

    # ---- FUZZY TYPO FALLBACK (pg_trgm) ----
    # If still nothing, find the closest trigram match across all candidate phrases.
    if location and not results and db.engine.dialect.name == 'postgresql':
        try:
            fuzzy_row = db.session.execute(
                text("""
                    WITH candidates AS (
                        SELECT DISTINCT "Location" AS phrase FROM property WHERE "Location" IS NOT NULL
                        UNION SELECT DISTINCT "Property_Name" FROM property WHERE "Property_Name" IS NOT NULL
                        UNION SELECT DISTINCT title FROM builder_project WHERE title IS NOT NULL
                        UNION SELECT DISTINCT name FROM project_amenity WHERE name IS NOT NULL
                        UNION SELECT DISTINCT bhk_type FROM unit_config WHERE bhk_type IS NOT NULL
                    )
                    SELECT phrase FROM candidates
                    WHERE phrase % :loc
                    ORDER BY phrase <-> :loc
                    LIMIT 1
                """),
                {'loc': location}
            ).fetchone()
            if fuzzy_row:
                corrected = fuzzy_row[0]
                results = _query_by_term(corrected)
                # Also check amenity/BHK if corrected term still yields nothing via location
                if not results:
                    try:
                        pids = set(r[0] for r in db.session.execute(
                            text("SELECT DISTINCT project_id FROM project_amenity WHERE LOWER(name) LIKE :pat"),
                            {'pat': f'%{corrected.lower()}%'}
                        ).fetchall())
                        if not pids:
                            pids = set(r[0] for r in db.session.execute(
                                text("SELECT DISTINCT project_id FROM unit_config WHERE LOWER(bhk_type) LIKE :pat"),
                                {'pat': f'%{corrected.lower()}%'}
                            ).fetchall())
                        if pids:
                            results = Property.query.filter(Property.project_id.in_(pids)).all()
                    except Exception:
                        pass
        except Exception:
            pass

    # Use 'price' param as max_price if max_price is not explicitly provided (desktop compatibility)
    if not max_price and price > 0:
        max_price = price

    # ---- PRICE FILTER ----
    if (min_price and min_price > 0) or (max_price and max_price > 0):
        def price_matches(prop, min_p, max_p):
            val = getattr(prop, "Price_Starting_From", "") or ""
            # Handle ranges like "70 L - 2.5 Cr" - take the starting price
            first_part = val.split('–')[0].split('-')[0].strip()
            val_clean = first_part.replace('₹','').replace(',','').replace('+','').strip().lower()
            
            try:
                # Handle "Cr" or "Crore"
                if 'cr' in val_clean or 'crore' in val_clean:
                    price_val = float(val_clean.replace('crore','').replace('cr','').strip())
                # Handle "L" or "Lakh"
                elif 'l' in val_clean or 'lakh' in val_clean:
                    price_val = float(val_clean.replace('lakh','').replace('l','').strip()) / 100  # Lakh → Cr
                else:
                    price_val = float(val_clean)

                meets_min = True
                if min_p > 0:
                    meets_min = price_val >= (min_p - 0.001)  # Small epsilon for float comparison

                meets_max = True
                if max_p > 0:
                    meets_max = price_val <= (max_p + 0.001)

                return meets_min and meets_max
            except Exception:
                return False

        results = [p for p in results if price_matches(p, min_price, max_price)]

    # ---- BHK FILTER ----
    # Uses Flat_Details (e.g. '["2 BHK – 650–750 sq.ft."]') as primary source.
    # bhk_search: raw string from search bar e.g. "2 BHK"
    # bhk_types: IDs from BHK dropdown e.g. ['2bhk', '3bhk']
    if bhk_search or (bhk_types and any(bhk_types)):
        if bhk_search:
            search_terms = [bhk_search.lower()]
        else:
            # Map dropdown IDs to number strings: '2bhk' → '2', '4plus' → '4+'
            search_terms = [
                bt.lower().replace('bhk', '').replace('plus', '+').strip()
                for bt in bhk_types
            ]

        def matches_bhk(prop):
            # Primary: check Flat_Details JSON (e.g. ["2 BHK – 650 sq.ft."])
            try:
                flat = json.loads(prop.Flat_Details) if prop.Flat_Details else []
                flat_text = ' '.join(str(f) for f in flat).lower()
                if any(term in flat_text for term in search_terms):
                    return True
            except Exception:
                pass
            # Fallback: check Existing_Configurations JSON field
            try:
                configs = json.loads(prop.Existing_Configurations) if prop.Existing_Configurations else []
                for c in configs:
                    val = (c.get('type', '') or c.get('bhk_type', '') if isinstance(c, dict) else str(c)).lower()
                    if any(term in val for term in search_terms):
                        return True
            except Exception:
                pass
            return False

        results = [p for p in results if matches_bhk(p)]

    # ---- AMENITIES / PROPERTY STATUS / SOCIETY TYPE FILTERS ----
    if amenities_filter or amenity_category_filter or property_status_filter or society_type_filter:
        def get_matching_project(prop):
            # Prefer explicit relationship, else best-effort match by builder and title
            if prop.project_id:
                return BuilderProject.query.get(prop.project_id)
            if prop.Property_Name and prop.Builder_Name:
                return BuilderProject.query.filter_by(
                    title=prop.Property_Name.strip(),
                    builder_name=prop.Builder_Name.strip()
                ).first()
            return None

        def matches_extra_filters(prop):
            prj = get_matching_project(prop)
            prj_amenities = _normalize_amenities(_get_project_amenity_names(prj)) if prj else []
            prj_amenity_categories = set()
            if prj:
                prj_amenity_categories = set([
                    str(row.category or '').strip().lower()
                    for row in list(getattr(prj, 'project_amenities', []) or [])
                    if str(row.category or '').strip()
                ])
            # Property Status must be from Property.Project_Status
            # Canonicalize property status value for comparison
            prop_status_value = _canonical_property_status(prop.Project_Status) if prop.Project_Status else None

            # Amenities: any match is enough when from search bar (single amenity);
            # require all if multiple explicitly selected via filter panel.
            if amenities_filter:
                prj_amen_lower = set([a.lower() for a in prj_amenities])
                # Also do substring match so "Swimming Pool" matches "pool"
                def amen_matches(requested, available_set):
                    req = requested.lower()
                    return req in available_set or any(req in a for a in available_set) or any(a in req for a in available_set)
                if len(amenities_filter) == 1:
                    if not amen_matches(amenities_filter[0], prj_amen_lower):
                        return False
                else:
                    if not all(amen_matches(a, prj_amen_lower) for a in amenities_filter):
                        return False

            if amenity_category_filter:
                if not all(category in prj_amenity_categories for category in amenity_category_filter):
                    return False

            # Property status: match against Property.Project_Status only
            if property_status_filter_canonical:
                if (prop_status_value or '') not in property_status_filter_canonical:
                    return False

            # Society type derived from Property.Security values
            if society_type_filter:
                derived = _normalize_security_types(prop.Security)
                derived_lower = set([d.lower() for d in derived])
                if not all(t in derived_lower for t in society_type_filter):
                    return False

            return True

        results = [p for p in results if matches_extra_filters(p)]

    # Return JSON
    return jsonify([p.to_dict() for p in results])



@app.route('/health', methods=['GET'])
def health():
    from chatbot.rag_service import get_azure_openai_health

    azure_health = get_azure_openai_health()
    status = "ok" if azure_health["configured"] else "degraded"
    return jsonify({
        "status": status,
        "chatbot": azure_health,
    }), 200

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")  # Set your actual Google Client ID here

@app.route('/api/auth/google-signin', methods=['POST'])
def google_signin():
    data = request.json
    id_token = data.get('id_token')
    if not id_token:
        return jsonify({'error': 'Missing id_token'}), 400

    # Verify id_token with Google
    resp = requests.get(
        f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
    )
    if resp.status_code != 200:
        return jsonify({'error': 'Invalid Google token'}), 401
    info = resp.json()

    # Client ID check - SECURITY (always verify this)
    if info.get('aud') != GOOGLE_CLIENT_ID:
        return jsonify({'error': 'Invalid Google client ID'}), 401

    # User info from Google response
    email = info.get('email')
    username = info.get('name', email)

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(
            username=username,
            email=email,
            password='',  # No password needed for Google users
            role='customer',
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
    
    access_token = create_access_token(identity={'username': user.username, 'role': user.role, 'user_id': user.id, 'email': user.email})
    refresh_token = create_refresh_token(identity={'username': user.username, 'role': user.role, 'user_id': user.id, 'email': user.email})

    response = jsonify({'message': 'Login successful', 'user': user.to_dict()})
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)
    return response, 200

# ------------------------------------------------------- Favorites & Merge -------------------------------------------------- ---

def _safe_json_list(raw):
    try:
        if not raw:
            return []
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    except Exception:
        return []

def _get_or_create_guest_cart_session(guest_id):
    session_row = Favorite.query.filter_by(guest_id=guest_id, property_id=None).first()
    if not session_row:
        legacy_favs = Favorite.query.filter_by(guest_id=guest_id).filter(Favorite.property_id.isnot(None)).all()
        legacy_ids = []
        for fav in legacy_favs:
            if fav.property_id is not None and fav.property_id not in legacy_ids:
                legacy_ids.append(fav.property_id)
        session_row = Favorite(
            guest_id=guest_id,
            property_id=None,
            cart_snapshot=json.dumps(legacy_ids),
            change_log=json.dumps([])
        )
        db.session.add(session_row)
        for fav in legacy_favs:
            db.session.delete(fav)
    return session_row

def _get_or_create_user_cart_session(user_id):
    session_row = Favorite.query.filter_by(user_id=user_id, property_id=None).first()
    if not session_row:
        legacy_favs = Favorite.query.filter_by(user_id=user_id).filter(Favorite.property_id.isnot(None)).all()
        legacy_ids = []
        for fav in legacy_favs:
            if fav.property_id is not None and fav.property_id not in legacy_ids:
                legacy_ids.append(fav.property_id)
        session_row = Favorite(
            user_id=user_id,
            guest_id=None,
            property_id=None,
            cart_snapshot=json.dumps(legacy_ids),
            change_log=json.dumps([])
        )
        db.session.add(session_row)
        for fav in legacy_favs:
            db.session.delete(fav)
    return session_row

def _append_cart_change(session_row, action, property_id):
    changes = _safe_json_list(session_row.change_log)
    changes.append({
        'action': action,
        'property_id': property_id,
        'at': datetime.utcnow().isoformat()
    })
    session_row.change_log = json.dumps(changes)

@app.route('/api/favorites', methods=['POST'])
@clerk_required(optional=True)
def add_favorite():
    data = request.json or {}
    property_id = data.get('property_id')
    # Accept guest id from body or header to support anonymous favorites
    guest_id = data.get('guest_id') or request.headers.get('X-Guest-ID') or request.headers.get('x-guest-id')

    if not property_id:
        return jsonify({'error': 'property_id is required'}), 400
    try:
        property_id = int(property_id)
    except (TypeError, ValueError):
        return jsonify({'error': 'property_id must be an integer'}), 400

    if g.current_user:
        session_row = _get_or_create_user_cart_session(g.current_user.id)
        cart_snapshot = _safe_json_list(session_row.cart_snapshot)
        if property_id in cart_snapshot:
            return jsonify({'message': 'Already in user cart', 'session': session_row.to_dict()}), 200

        cart_snapshot.append(property_id)
        session_row.cart_snapshot = json.dumps(cart_snapshot)
        _append_cart_change(session_row, 'add', property_id)
        db.session.commit()
        return jsonify({'message': 'User cart updated', 'session': session_row.to_dict()}), 200

    if not guest_id:
        return jsonify({'error': 'Authentication or guest_id required'}), 401

    session_row = _get_or_create_guest_cart_session(guest_id)
    cart_snapshot = _safe_json_list(session_row.cart_snapshot)
    if property_id in cart_snapshot:
        return jsonify({'message': 'Already in guest cart', 'session': session_row.to_dict()}), 200

    cart_snapshot.append(property_id)
    session_row.cart_snapshot = json.dumps(cart_snapshot)
    _append_cart_change(session_row, 'add', property_id)
    db.session.commit()
    return jsonify({'message': 'Guest cart updated', 'session': session_row.to_dict()}), 200

@app.route('/api/favorites', methods=['GET'])
@clerk_required(optional=True)
def get_favorites():
    guest_id = request.args.get('guest_id') or request.headers.get('X-Guest-ID') or request.headers.get('x-guest-id')
    
    if g.current_user:
        session_row = _get_or_create_user_cart_session(g.current_user.id)
        return jsonify([session_row.to_dict()] if session_row else [])
    if guest_id:
        session_row = Favorite.query.filter_by(guest_id=guest_id, property_id=None).first()
        return jsonify([session_row.to_dict()] if session_row else [])
    return jsonify({'favorites': []}), 200


@app.route('/api/favorites', methods=['DELETE'])
@clerk_required(optional=True)
def remove_favorite():
    data = request.json or {}
    property_id = data.get('property_id') or request.args.get('property_id')
    guest_id = data.get('guest_id') or request.headers.get('X-Guest-ID') or request.headers.get('x-guest-id')

    if not property_id:
        return jsonify({'error': 'property_id is required'}), 400
    try:
        property_id = int(property_id)
    except (TypeError, ValueError):
        return jsonify({'error': 'property_id must be an integer'}), 400

    if g.current_user:
        session_row = _get_or_create_user_cart_session(g.current_user.id)

        cart_snapshot = _safe_json_list(session_row.cart_snapshot)
        if property_id not in cart_snapshot:
            return jsonify({'message': 'Property not in user cart (noop)', 'session': session_row.to_dict()}), 200

        cart_snapshot = [pid for pid in cart_snapshot if pid != property_id]
        session_row.cart_snapshot = json.dumps(cart_snapshot)
        _append_cart_change(session_row, 'remove', property_id)
        db.session.commit()
        return jsonify({'message': 'User cart updated', 'session': session_row.to_dict()}), 200
    elif guest_id:
        session_row = Favorite.query.filter_by(guest_id=guest_id, property_id=None).first()
        if not session_row:
            return jsonify({'message': 'Guest cart not found (noop)'}), 200

        cart_snapshot = _safe_json_list(session_row.cart_snapshot)
        if property_id not in cart_snapshot:
            return jsonify({'message': 'Property not in guest cart (noop)', 'session': session_row.to_dict()}), 200

        cart_snapshot = [pid for pid in cart_snapshot if pid != property_id]
        session_row.cart_snapshot = json.dumps(cart_snapshot)
        _append_cart_change(session_row, 'remove', property_id)
        db.session.commit()
        return jsonify({'message': 'Guest cart updated', 'session': session_row.to_dict()}), 200
    else:
        return jsonify({'error': 'Authentication or guest_id required'}), 401

@app.route('/api/auth/merge-guest', methods=['POST'])
@clerk_required()
def merge_guest_data():
    data = request.json
    guest_id = (data or {}).get('guest_id') or request.headers.get('X-Guest-ID') or request.headers.get('x-guest-id')
    
    if not guest_id:
        return jsonify({'error': 'guest_id required for merge'}), 400

    user_session = Favorite.query.filter_by(user_id=g.current_user.id, property_id=None).first()

    # Merge guest session rows into user session (or promote guest session to user)
    session_rows = Favorite.query.filter_by(guest_id=guest_id, property_id=None).all()
    for session_row in session_rows:
        if user_session and user_session.id != session_row.id:
            user_cart = _safe_json_list(user_session.cart_snapshot)
            guest_cart = _safe_json_list(session_row.cart_snapshot)
            for pid in guest_cart:
                if pid not in user_cart:
                    user_cart.append(pid)
            user_session.cart_snapshot = json.dumps(user_cart)

            user_changes = _safe_json_list(user_session.change_log)
            guest_changes = _safe_json_list(session_row.change_log)
            if guest_changes:
                user_session.change_log = json.dumps(user_changes + guest_changes)

            db.session.delete(session_row)
        else:
            session_row.user_id = g.current_user.id
            session_row.guest_id = None
            user_session = session_row

    # Promote legacy guest rows (property_id NOT NULL) to user
    legacy_guest_rows = Favorite.query.filter_by(guest_id=guest_id).filter(Favorite.property_id.isnot(None)).all()
    for fav in legacy_guest_rows:
        existing = Favorite.query.filter_by(user_id=g.current_user.id, property_id=fav.property_id).first()
        if existing:
            db.session.delete(fav)
        else:
            fav.user_id = g.current_user.id
            fav.guest_id = None
    
    # Update interactions
    # This is best-effort: your DB schema may not have `user_interaction.guest_id`
    # (migration drift), which would otherwise cause a 500 and break the entire merge.
    db.session.commit()
    if _table_has_column('user_interaction', 'guest_id'):
        try:
            UserInteraction.query.filter_by(guest_id=guest_id).update({
                'user_id': g.current_user.id,
                'guest_id': None
            })
            db.session.commit()
        except Exception as ie:
            db.session.rollback()
            print(f"Interaction merge error (best-effort): {ie}")
    
    return jsonify({'message': 'Data merged successfully'}), 200


# ------------------------------------------------------------------ Media API
VALID_ENTITY_TYPES = {'builder', 'project', 'property', 'blog'}
VALID_MEDIA_TYPES = {'logo', 'cover', 'gallery', 'floor_plan', 'certificate', 'featured_image'}


@app.route('/api/media/<entity_type>/<entity_id>', methods=['GET'])
def get_entity_media(entity_type, entity_id):
    """List all media for an entity. Optional ?media_type= filter."""
    if entity_type not in VALID_ENTITY_TYPES:
        return jsonify({'error': f'Unknown entity_type: {entity_type}'}), 400
    mt = request.args.get('media_type')
    items = media_service.get_media(entity_type, entity_id, mt)
    return jsonify([m.to_dict() for m in items])


@app.route('/api/media/<entity_type>/<entity_id>', methods=['POST'])
@admin_only
def upload_entity_media(entity_type, entity_id):
    """Upload a file and create a Media record. Requires multipart/form-data."""
    if entity_type not in VALID_ENTITY_TYPES:
        return jsonify({'error': f'Unknown entity_type: {entity_type}'}), 400

    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'file is required (multipart/form-data)'}), 400

    mt = (request.form.get('media_type') or 'gallery').strip()
    if mt not in VALID_MEDIA_TYPES:
        return jsonify({'error': f'Unknown media_type: {mt}'}), 400

    is_featured = (request.form.get('is_featured') or 'false').lower() == 'true'
    alt_text = request.form.get('alt_text')
    raw_order = request.form.get('display_order')
    display_order = int(raw_order) if raw_order and str(raw_order).isdigit() else None

    if not storage.is_enabled():
        return jsonify({'error': 'Azure Blob Storage is not configured on this server'}), 503

    try:
        record = media_service.add_media(
            entity_type, entity_id, file, mt,
            is_featured=is_featured, alt_text=alt_text, display_order=display_order,
        )
        return jsonify(record.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/media/<int:media_id>', methods=['PATCH'])
@admin_only
def update_entity_media(media_id):
    """Update display_order, is_featured, or alt_text."""
    data = request.json or {}
    try:
        record = media_service.update_media(
            media_id,
            display_order=data.get('display_order'),
            is_featured=data.get('is_featured'),
            alt_text=data.get('alt_text'),
        )
        return jsonify(record.to_dict())
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/media/<int:media_id>', methods=['DELETE'])
@admin_only
def delete_entity_media(media_id):
    """Delete a Media record and its Azure blob."""
    try:
        media_service.delete_media(media_id)
        return jsonify({'message': 'deleted'}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/media/<entity_type>/<entity_id>/reorder', methods=['POST'])
@admin_only
def reorder_entity_media(entity_type, entity_id):
    """Apply a new display_order. Body: { media_type: str, ordered_ids: [int, ...] }"""
    data = request.json or {}
    ordered_ids = [int(i) for i in data.get('ordered_ids', []) if str(i).isdigit()]
    mt = (data.get('media_type') or 'gallery').strip()
    if mt not in VALID_MEDIA_TYPES:
        return jsonify({'error': f'Unknown media_type: {mt}'}), 400
    items = media_service.reorder(entity_type, entity_id, mt, ordered_ids)
    return jsonify([m.to_dict() for m in items])

from chatbot.routes import chatbot_bp

# Register the Blueprintcd..
app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')

# Note: The db.create_all() inside your existing main block will 
# automatically create the new chatbot tables because we imported them above.



# ------------------------------------------------------------------ Admin Auth
@app.route('/api/auth/me', methods=['GET'])
@clerk_required()
def get_current_user_profile():
    """
    Returns the current authenticated user's profile from the local DB.
    Used by the frontend AdminRoute to verify if the user has admin role.
    The role comes from the database — not from email or client-side logic.
    """
    user = g.current_user
    primary_admin = is_primary_admin_email(user.email)
    return jsonify({
        'id': user.id,
        'email': user.email,
        'username': user.username,
        'role': user.role,
        'is_active': user.is_active,
        'is_primary_admin': primary_admin,
        'admin_session_verified': has_verified_admin_session(user),
    }), 200


@app.route('/api/auth/promote-admin', methods=['POST'])
@clerk_required()
def promote_to_admin():
    """
    Enhanced Admin Setup/Login:
    Requires:
    1. Authenticated Clerk user must be the configured primary admin email
    2. Submitted admin email must match the configured primary admin email
    3. Local database password check
    4. Matching setup key
    """
    data = request.json or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password', '')
    provided_key = (data.get('setup_key') or '').strip()
    current_email = (g.current_user.email or '').strip().lower()

    if not is_primary_admin_email(current_email):
        clear_admin_session()
        security_logger.warning(f"Blocked admin setup attempt by non-primary account: {current_email}")
        return jsonify({'error': 'Only the primary admin account can access admin setup.'}), 403

    if not email or not password or not provided_key:
        return jsonify({'error': 'Admin email, password, and setup key are all required.'}), 400

    if email != PRIMARY_ADMIN_EMAIL:
        security_logger.warning(f"Blocked admin setup attempt with wrong submitted email by {current_email}")
        return jsonify({'error': 'Unauthorized email for admin access.'}), 403

    if not ADMIN_SETUP_KEY:
        security_logger.error('ADMIN_SETUP_KEY is not configured on the server.')
        return jsonify({'error': 'Admin setup is not configured on the server.'}), 500

    if provided_key != ADMIN_SETUP_KEY:
        security_logger.warning(f"Failed admin setup key attempt for {current_email}")
        return jsonify({'error': 'Invalid setup key.'}), 401

    # Check Database Password (Stored in local User table)
    from models import User
    admin_db_user = User.query.filter_by(email=PRIMARY_ADMIN_EMAIL).first()
    if not admin_db_user or not admin_db_user.check_password(password):
        security_logger.warning(f"Failed admin password attempt for {current_email}")
        return jsonify({'error': 'Invalid admin password.'}), 401

    # Success: keep the DB role in sync and mark this browser session as verified.
    g.current_user.role = 'admin'
    db.session.commit()
    mark_admin_session_verified(g.current_user)

    security_logger.info(f"Admin access granted to {current_email}")
    return jsonify({
        'message': 'Admin access verified.',
        'role': g.current_user.role,
        'admin_session_verified': True,
    }), 200


if __name__ == '__main__':
    app.run(host='::', port=5002, debug=True, use_reloader=False)
