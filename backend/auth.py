import os
import sys
import re
from dotenv import load_dotenv

# Forces the backend directory into the top of the search path
# This fixes runtime "ModuleNotFoundError" across all environments
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BACKEND_DIR)
load_dotenv(dotenv_path=os.path.join(BACKEND_DIR, ".env"))

import json
from functools import wraps
from flask import request, jsonify, g, session
import jwt
from clerk_backend_api import Clerk
from clerk_backend_api.security import authenticate_request, AuthenticateRequestOptions
from sqlalchemy import inspect
from sqlalchemy.exc import DataError, IntegrityError, OperationalError, SQLAlchemyError
from extensions import db
from models import User

EMAIL_MAX_LENGTH = 120
USERNAME_MAX_LENGTH = 80
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
USERNAME_SANITIZER = re.compile(r"[^a-zA-Z0-9_.-]+")


def _normalize_email(email):
    if email is None:
        return None
    value = str(email).strip().lower()
    if not value or len(value) > EMAIL_MAX_LENGTH:
        return None
    return value if EMAIL_REGEX.match(value) else None


def _sanitize_username(base, fallback_seed):
    seed = str(fallback_seed or "user")
    candidate = (base or f"hns_user_{seed[:8]}").strip()
    candidate = USERNAME_SANITIZER.sub("_", candidate)
    candidate = re.sub(r"_+", "_", candidate).strip("._-")
    candidate = candidate[:USERNAME_MAX_LENGTH]
    if candidate:
        return candidate
    return f"hns_user_{seed[:8]}"


def _find_conflicting_user(field_name, value, exclude_user_id=None):
    if value in (None, ""):
        return None

    query = User.query.filter(getattr(User, field_name) == value)
    if exclude_user_id is not None:
        query = query.filter(User.id != exclude_user_id)
    return query.first()


def _ensure_unique_username(base, fallback_seed, local_user_id=None):
    base = _sanitize_username(base, fallback_seed)
    candidate = base
    counter = 1
    while _find_conflicting_user("username", candidate, exclude_user_id=local_user_id):
        suffix = f"_{counter}"
        candidate = f"{base[: max(1, USERNAME_MAX_LENGTH - len(suffix))]}{suffix}"
        counter += 1
    return candidate

def _safe_json_list(raw):
    try:
        if not raw:
            return []
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _first_non_empty(*values):
    for value in values:
        if value is None:
            continue
        if isinstance(value, str):
            trimmed = value.strip()
            if trimmed:
                return trimmed
            continue
        return value
    return None


def _model_or_dict_get(obj, key, default=None):
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def _table_has_column(table_name, column_name):
    try:
        inspector = inspect(db.engine)
        if not inspector.has_table(table_name):
            return False
        return any(column['name'] == column_name for column in inspector.get_columns(table_name))
    except Exception:
        return False


def _extract_email_from_clerk_user(clerk_user_data):
    email_addresses = _model_or_dict_get(clerk_user_data, 'email_addresses', []) or []
    primary_email_id = _model_or_dict_get(clerk_user_data, 'primary_email_address_id')

    for item in email_addresses:
        item_id = _model_or_dict_get(item, 'id')
        email_value = _model_or_dict_get(item, 'email_address')
        if primary_email_id and item_id == primary_email_id and email_value:
            return email_value

    for item in email_addresses:
        email_value = _model_or_dict_get(item, 'email_address')
        if email_value:
            return email_value

    return None


def _extract_email_from_payload(payload):
    payload = payload or {}

    direct_email = _first_non_empty(
        _model_or_dict_get(payload, 'email'),
        _model_or_dict_get(payload, 'email_address'),
        _model_or_dict_get(payload, 'primary_email_address'),
        _model_or_dict_get(payload, 'https://clerk.dev/email'),
        _model_or_dict_get(payload, 'https://clerk.com/email'),
    )
    if direct_email:
        return direct_email

    claims = _model_or_dict_get(payload, 'claims', {}) or {}
    nested_email = _first_non_empty(
        _model_or_dict_get(claims, 'email'),
        _model_or_dict_get(claims, 'email_address'),
        _model_or_dict_get(claims, 'primary_email_address'),
        _model_or_dict_get(claims, 'https://clerk.dev/email'),
        _model_or_dict_get(claims, 'https://clerk.com/email'),
    )
    if nested_email:
        return nested_email

    for container in (payload, claims):
        email_addresses = _model_or_dict_get(container, 'email_addresses', []) or []
        for item in email_addresses:
            value = _model_or_dict_get(item, 'email_address')
            if value:
                return value

    return None


def _placeholder_email_for_clerk_user(clerk_user_id):
    safe_user_id = ''.join(ch for ch in str(clerk_user_id or '') if ch.isalnum()).lower() or 'unknown'
    return f"{safe_user_id}@clerk.local"


def _fetch_clerk_user(clerk_user_id):
    if not clerk_user_id:
        return None
    try:
        return sdk.users.get(user_id=clerk_user_id)
    except Exception as e:
        print(f"Clerk User Fetch Error: {str(e)}")
        return None


def _build_local_user_identity(payload, clerk_user_data, clerk_user_id):
    email = _normalize_email(_first_non_empty(
        _extract_email_from_payload(payload),
        _extract_email_from_clerk_user(clerk_user_data),
    ))
    if not email:
        email = _placeholder_email_for_clerk_user(clerk_user_id)

    raw_username = _first_non_empty(
        _model_or_dict_get(payload, 'username'),
        _model_or_dict_get(payload, 'preferred_username'),
        _model_or_dict_get(payload, 'given_name'),
        _model_or_dict_get(payload, 'name'),
        _model_or_dict_get(clerk_user_data, 'username'),
        _model_or_dict_get(clerk_user_data, 'first_name'),
        email.split('@')[0],
        f"hns_user_{clerk_user_id[:8]}",
    )
    final_username = _sanitize_username(raw_username, clerk_user_id)
    return email, final_username


def _save_user(user):
    db.session.add(user)
    try:
        db.session.commit()
        return True, None
    except IntegrityError as db_err:
        db.session.rollback()
        print(f"Database Save IntegrityError: {db_err}")
        return False, "A duplicate or conflicting user record blocked the save."
    except DataError as db_err:
        db.session.rollback()
        print(f"Database Save DataError: {db_err}")
        return False, "User data failed validation before save."
    except OperationalError as db_err:
        db.session.rollback()
        print(f"Database Save OperationalError: {db_err}")
        return False, "The database was temporarily unavailable while saving the user."
    except SQLAlchemyError as db_err:
        db.session.rollback()
        print(f"Database Save Error: {db_err}")
        return False, "The database rejected the user update."


def _get_or_create_local_user(payload):
    clerk_user_id = _model_or_dict_get(payload, 'sub')
    if not clerk_user_id:
        return None, ('Unauthorized', 'Missing Clerk user id in token.')

    user = User.query.filter_by(clerk_user_id=clerk_user_id).first()
    clerk_user_data = None

    # If the local DB row is missing or incomplete, pull the Clerk profile as fallback.
    if (
        not user
        or not getattr(user, 'email', None)
        or not getattr(user, 'username', None)
    ):
        clerk_user_data = _fetch_clerk_user(clerk_user_id)

    email, final_username = _build_local_user_identity(payload, clerk_user_data, clerk_user_id)

    if not user:
        user = User.query.filter_by(email=email).first()

    if user:
        final_username = _ensure_unique_username(final_username, clerk_user_id, local_user_id=user.id)
        conflicting_clerk = _find_conflicting_user("clerk_user_id", clerk_user_id, exclude_user_id=user.id)
        if conflicting_clerk:
            return None, ('Failed to sync user to local DB', 'Another local user already owns this Clerk identity.')
        conflicting_email = _find_conflicting_user("email", email, exclude_user_id=user.id)
        if conflicting_email:
            return None, ('Failed to sync user to local DB', 'Another local user already owns this email address.')

        changed = False
        if user.clerk_user_id != clerk_user_id:
            user.clerk_user_id = clerk_user_id
            changed = True
        if (
            not user.email
            or str(user.email).endswith('@clerk.local')
        ) and email:
            user.email = email
            changed = True
        if not user.username:
            user.username = final_username
            changed = True
        if user.password is None:
            user.password = ""
            changed = True
        if user.role is None:
            user.role = 'customer'
            changed = True
        if user.is_active is None:
            user.is_active = True
            changed = True

        if changed:
            ok, err = _save_user(user)
            if not ok:
                return None, ('Failed to sync user to local DB', err)
        return user, None

    final_username = _ensure_unique_username(final_username, clerk_user_id)
    if _find_conflicting_user("clerk_user_id", clerk_user_id):
        return None, ('Failed to sync user to local DB', 'Another local user already owns this Clerk identity.')
    if _find_conflicting_user("email", email):
        return None, ('Failed to sync user to local DB', 'Another local user already owns this email address.')

    user = User(
        clerk_user_id=clerk_user_id,
        email=email,
        username=final_username,
        password="",
        role='customer',
        is_active=True,
        phone=None,
    )
    ok, err = _save_user(user)
    if not ok:
        return None, ('Failed to sync user to local DB', err)
    return user, None

# Configure Clerk Auth
CLERK_SECRET_KEY = os.getenv('CLERK_SECRET_KEY')
sdk = Clerk(bearer_auth=CLERK_SECRET_KEY)
PRIMARY_ADMIN_EMAIL = (os.getenv('PRIMARY_ADMIN_EMAIL') or 'chaitraliwaikar.hns.06@gmail.com').strip().lower()
ADMIN_SESSION_USER_KEY = 'admin_verified_user_id'
ADMIN_SESSION_EMAIL_KEY = 'admin_verified_email'
ADMIN_SESSION_CLERK_KEY = 'admin_verified_clerk_session_id'

class FlaskRequestWrapper:
    def __init__(self, request):
        self.headers = request.headers


def is_primary_admin_email(email):
    return (email or '').strip().lower() == PRIMARY_ADMIN_EMAIL


def has_verified_admin_session(user):
    if not user or not is_primary_admin_email(getattr(user, 'email', '')):
        return False

    current_clerk_session_id = getattr(g, 'clerk_session_id', None)
    return (
        session.get(ADMIN_SESSION_USER_KEY) == user.id
        and session.get(ADMIN_SESSION_EMAIL_KEY) == user.email
        and current_clerk_session_id
        and session.get(ADMIN_SESSION_CLERK_KEY) == current_clerk_session_id
    )


def mark_admin_session_verified(user):
    if not user:
        return

    session[ADMIN_SESSION_USER_KEY] = user.id
    session[ADMIN_SESSION_EMAIL_KEY] = user.email
    session[ADMIN_SESSION_CLERK_KEY] = getattr(g, 'clerk_session_id', None)


def clear_admin_session():
    session.pop(ADMIN_SESSION_USER_KEY, None)
    session.pop(ADMIN_SESSION_EMAIL_KEY, None)
    session.pop(ADMIN_SESSION_CLERK_KEY, None)

def clerk_required(optional=False):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # 1. Verify Clerk Request
                # In v5, authenticate_request is a standalone function
                # It expects an object with a 'headers' property (Requestish)
                request_state = authenticate_request(
                    FlaskRequestWrapper(request),
                    AuthenticateRequestOptions(secret_key=CLERK_SECRET_KEY)
                )
                
                if not request_state.is_signed_in:
                    if optional:
                        g.current_user = None
                        return f(*args, **kwargs)
                    return jsonify({
                        'error': 'Unauthorized',
                        'reason': str(request_state.reason)
                    }), 401
                
                # 2. Extract Data
                # In v5, request_state.payload might contain the claims directly
                payload = getattr(request_state, 'payload', None)
                if not payload and hasattr(request_state, 'token'):
                    payload = jwt.decode(request_state.token, options={"verify_signature": False})
                
                if not payload:
                    return jsonify({'error': 'Unauthorized', 'reason': 'No token payload found'}), 401

                g.clerk_session_id = payload.get('sid')

                # 3. Always resolve to a local DB user, creating one if needed.
                user, user_error = _get_or_create_local_user(payload)
                if user_error:
                    error_title, error_detail = user_error
                    status_code = 401 if error_title == 'Unauthorized' else 500
                    return jsonify({
                        'error': error_title,
                        'reason': str(error_detail),
                    }), status_code
                
                # 4. Attach to Global Context
                g.current_user = user

                # Prevent a verified admin browser session from carrying across
                # to a different authenticated user in the same browser.
                if session.get(ADMIN_SESSION_USER_KEY) and session.get(ADMIN_SESSION_USER_KEY) != user.id:
                    clear_admin_session()
                elif session.get(ADMIN_SESSION_EMAIL_KEY) and session.get(ADMIN_SESSION_EMAIL_KEY) != user.email:
                    clear_admin_session()
                elif session.get(ADMIN_SESSION_CLERK_KEY) and session.get(ADMIN_SESSION_CLERK_KEY) != g.clerk_session_id:
                    clear_admin_session()
                
                # 5. Merge Guest Activity (Liked Properties)
                guest_id = request.headers.get('X-Guest-ID')
                if guest_id and user:
                    from models import Favorite
                    guest_favorites = Favorite.query.filter_by(guest_id=guest_id).all()
                    
                    if guest_favorites:
                        user_session = Favorite.query.filter_by(user_id=user.id, property_id=None).first()

                        for fav in guest_favorites:
                            # Session row: attach to user, or merge if user session already exists
                            if fav.property_id is None:
                                if user_session and user_session.id != fav.id:
                                    user_cart = _safe_json_list(user_session.cart_snapshot)
                                    guest_cart = _safe_json_list(fav.cart_snapshot)
                                    for pid in guest_cart:
                                        if pid not in user_cart:
                                            user_cart.append(pid)
                                    user_session.cart_snapshot = json.dumps(user_cart)

                                    user_changes = _safe_json_list(user_session.change_log)
                                    guest_changes = _safe_json_list(fav.change_log)
                                    if guest_changes:
                                        user_session.change_log = json.dumps(user_changes + guest_changes)

                                    db.session.delete(fav)
                                else:
                                    fav.user_id = user.id
                                    fav.guest_id = None
                                    user_session = fav
                                continue

                            # Legacy row: move ownership to user (or drop if duplicate)
                            existing = Favorite.query.filter_by(user_id=user.id, property_id=fav.property_id).first()
                            if existing:
                                db.session.delete(fav)
                            else:
                                fav.user_id = user.id
                                fav.guest_id = None
                        
                        # Merge User Interactions
                        if _table_has_column('user_interaction', 'guest_id'):
                            try:
                                from models import UserInteraction
                                UserInteraction.query.filter_by(guest_id=guest_id).update({
                                    'user_id': user.id,
                                    'guest_id': None
                                })
                            except Exception as ie:
                                print(f"Interaction merge error: {ie}")

                        try:
                            db.session.commit()
                        except Exception as e:
                            db.session.rollback()
                            print(f"Guest merge error: {e}")

                return f(*args, **kwargs)
            except Exception as e:
                print(f"Critical Auth Error: {str(e)}")
                import traceback
                traceback.print_exc()
                return jsonify({'error': 'Authentication server error', 'details': str(e)}), 500

        return decorated_function
    return decorator

def admin_only(fn):
    @wraps(fn)
    @clerk_required(optional=False)
    def wrapper(*args, **kwargs):
        if not g.current_user or g.current_user.role != 'admin':
            return jsonify({"error": "Forbidden", "message": "Admin role required"}), 403
        if not is_primary_admin_email(g.current_user.email):
            clear_admin_session()
            return jsonify({"error": "Forbidden", "message": "Only the primary admin account can access this resource"}), 403
        if not has_verified_admin_session(g.current_user):
            return jsonify({"error": "Forbidden", "message": "Admin setup verification is required"}), 403
        return fn(*args, **kwargs)
    return wrapper
