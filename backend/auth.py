import os
import sys
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
from extensions import db
from models import User

def _ensure_unique_username(base, clerk_user_id):
    base = (base or f"hns_user_{clerk_user_id[:8]}").strip()
    candidate = base
    counter = 1
    while User.query.filter_by(username=candidate).first():
        candidate = f"{base}_{counter}"
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

                clerk_user_id = payload.get('sub')
                g.clerk_session_id = payload.get('sid')

                # 3. Database Lookup
                user = User.query.filter_by(clerk_user_id=clerk_user_id).first()

                if not user:
                    clerk_user_data = None

                    # Prefer claims already present in the session token so local user sync
                    # does not depend entirely on an extra Clerk API call.
                    email = _first_non_empty(
                        payload.get('email'),
                        payload.get('email_address'),
                        payload.get('primary_email_address'),
                    )
                    raw_username = _first_non_empty(
                        payload.get('username'),
                        payload.get('preferred_username'),
                        payload.get('given_name'),
                        payload.get('name'),
                    )

                    # Fetch profile from Clerk for missing data
                    try:
                        clerk_user_data = sdk.users.get(user_id=clerk_user_id)
                    except Exception as e:
                        print(f"Clerk User Fetch Error: {str(e)}")
                    
                    # --- HANDLING NULL CONSTRAINTS (THE SAFETY NET) ---
                    # A. Email Fallback
                    if not email:
                        email = _extract_email_from_clerk_user(clerk_user_data)
                    
                    if not email:
                        return jsonify({"error": "Unauthorized", "reason": "User must have a valid email address."}), 401

                    # B. Username Fallback
                    raw_username = _first_non_empty(raw_username, _model_or_dict_get(clerk_user_data, 'username'))
                    first_name = _first_non_empty(
                        payload.get('given_name'),
                        payload.get('first_name'),
                        _model_or_dict_get(clerk_user_data, 'first_name'),
                    )
                    email_prefix = email.split('@')[0] if email else None

                    final_username = raw_username or first_name or email_prefix or f"hns_user_{clerk_user_id[:8]}"
                    final_username = _ensure_unique_username(final_username, clerk_user_id)

                    # If a user exists with this email, attach Clerk ID and use it
                    existing_by_email = User.query.filter_by(email=email).first()
                    if existing_by_email:
                        if not existing_by_email.clerk_user_id:
                            existing_by_email.clerk_user_id = clerk_user_id
                            if not existing_by_email.username:
                                existing_by_email.username = _ensure_unique_username(
                                    final_username, clerk_user_id
                                )
                            db.session.add(existing_by_email)
                            try:
                                db.session.commit()
                            except Exception as db_err:
                                db.session.rollback()
                                print(f"Database Save Error: {db_err}")
                                return jsonify({"error": "Failed to sync user to local DB"}), 500
                        user = existing_by_email
                    else:
                        # C. Create User with defaults for all NOT NULL fields
                        user = User(
                            clerk_user_id=clerk_user_id,
                            email=email,
                            username=final_username,
                            password="", # Provided an empty string to satisfy NOT NULL
                            role='customer',
                            is_active=True,
                            phone=None
                        )
                        db.session.add(user)
                        try:
                            db.session.commit()
                        except Exception as db_err:
                            db.session.rollback()
                            print(f"Database Save Error: {db_err}")
                            return jsonify({"error": "Failed to sync user to local DB"}), 500
                
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
