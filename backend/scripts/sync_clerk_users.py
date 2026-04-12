import argparse
import os
import re
import sys

from dotenv import load_dotenv
from clerk_backend_api import Clerk
from sqlalchemy.exc import DataError, IntegrityError, OperationalError, SQLAlchemyError

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

from app import app  # noqa: E402
from models import User  # noqa: E402
from extensions import db  # noqa: E402

EMAIL_MAX_LENGTH = 120
USERNAME_MAX_LENGTH = 80
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
USERNAME_SANITIZER = re.compile(r"[^a-zA-Z0-9_.-]+")


def first_non_empty(*values):
    for value in values:
        if value is None:
            continue
        if isinstance(value, str):
            value = value.strip()
            if value:
                return value
            continue
        return value
    return None


def model_or_dict_get(obj, key, default=None):
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def extract_email(clerk_user):
    email_addresses = model_or_dict_get(clerk_user, "email_addresses", []) or []
    primary_email_id = model_or_dict_get(clerk_user, "primary_email_address_id")

    for item in email_addresses:
        item_id = model_or_dict_get(item, "id")
        email_value = model_or_dict_get(item, "email_address")
        if primary_email_id and item_id == primary_email_id and email_value:
            return email_value

    for item in email_addresses:
        email_value = model_or_dict_get(item, "email_address")
        if email_value:
            return email_value

    return None


def normalize_email(email):
    if email is None:
        return None
    value = str(email).strip().lower()
    if not value or len(value) > EMAIL_MAX_LENGTH:
        return None
    return value if EMAIL_REGEX.match(value) else None


def sanitize_username(base, fallback_seed):
    seed = str(fallback_seed or "user")
    candidate = (base or f"hns_user_{seed[:8]}").strip()
    candidate = USERNAME_SANITIZER.sub("_", candidate)
    candidate = re.sub(r"_+", "_", candidate).strip("._-")
    candidate = candidate[:USERNAME_MAX_LENGTH]
    if candidate:
        return candidate
    return f"hns_user_{seed[:8]}"


def find_conflicting_user(field_name, value, exclude_user_id=None):
    if value in (None, ""):
        return None

    query = User.query.filter(getattr(User, field_name) == value)
    if exclude_user_id is not None:
        query = query.filter(User.id != exclude_user_id)
    return query.first()


def ensure_unique_username(base, fallback_seed, local_user_id=None):
    base = sanitize_username(base, fallback_seed)
    candidate = base
    counter = 1
    while find_conflicting_user("username", candidate, exclude_user_id=local_user_id):
        suffix = f"_{counter}"
        candidate = f"{base[: max(1, USERNAME_MAX_LENGTH - len(suffix))]}{suffix}"
        counter += 1
    return candidate


def validate_clerk_user_payload(external_auth_id, email):
    if not external_auth_id:
        return "Missing Clerk user id."
    if not email:
        return "Missing or invalid email address."
    return None


def commit_session(context):
    try:
        db.session.commit()
        return None
    except IntegrityError as exc:
        db.session.rollback()
        return f"IntegrityError during {context}: {exc}"
    except DataError as exc:
        db.session.rollback()
        return f"DataError during {context}: {exc}"
    except OperationalError as exc:
        db.session.rollback()
        return f"OperationalError during {context}: {exc}"
    except SQLAlchemyError as exc:
        db.session.rollback()
        return f"Database error during {context}: {exc}"


def upsert_clerk_user(clerk_user):
    external_auth_id = str(model_or_dict_get(clerk_user, "id", "")).strip()
    email = normalize_email(extract_email(clerk_user))
    validation_error = validate_clerk_user_payload(external_auth_id, email)
    if validation_error:
        return {
            "action": "skipped",
            "local_user_id": None,
            "external_auth_id": external_auth_id or None,
            "email": email,
            "reason": validation_error,
        }

    raw_username = first_non_empty(
        model_or_dict_get(clerk_user, "username"),
        model_or_dict_get(clerk_user, "first_name"),
        email.split("@")[0],
    )

    user = User.query.filter_by(clerk_user_id=external_auth_id).first()
    if user is None:
        user = User.query.filter_by(email=email).first()

    local_user_id = user.id if user else None
    username = ensure_unique_username(raw_username, external_auth_id, local_user_id=local_user_id)

    conflicting_clerk = find_conflicting_user("clerk_user_id", external_auth_id, exclude_user_id=local_user_id)
    if conflicting_clerk:
        return {
            "action": "skipped",
            "local_user_id": local_user_id,
            "external_auth_id": external_auth_id,
            "email": email,
            "reason": f"Clerk identity already linked to local user {conflicting_clerk.id}.",
        }

    conflicting_email = find_conflicting_user("email", email, exclude_user_id=local_user_id)
    if conflicting_email:
        return {
            "action": "skipped",
            "local_user_id": local_user_id,
            "external_auth_id": external_auth_id,
            "email": email,
            "reason": f"Email already linked to local user {conflicting_email.id}.",
        }

    if user is None:
        user = User(
            clerk_user_id=external_auth_id,
            email=email,
            username=username,
            password="",
            role="customer",
            is_active=True,
            phone=None,
        )
        db.session.add(user)
        action = "created"
    else:
        action = "updated"
        user.clerk_user_id = external_auth_id
        user.email = email
        if not user.username:
            user.username = username
        if user.role is None:
            user.role = "customer"
        if user.is_active is None:
            user.is_active = True
        if user.password is None:
            user.password = ""

    return {
        "action": action,
        "local_user_id": user.id,
        "external_auth_id": external_auth_id,
        "email": email,
        "user": user,
    }


def fetch_clerk_users(clerk, email_filter=None, limit=100):
    seen_ids = set()
    users = []

    if email_filter:
        batch = clerk.users.list(request={"email_address": [email_filter], "limit": 1, "offset": 0})
        for clerk_user in batch or []:
            external_auth_id = str(model_or_dict_get(clerk_user, "id", "")).strip()
            if external_auth_id and external_auth_id not in seen_ids:
                seen_ids.add(external_auth_id)
                users.append(clerk_user)
        return users

    offset = 0
    while True:
        batch = clerk.users.list(request={"limit": limit, "offset": offset})
        if not batch:
            break
        for clerk_user in batch:
            external_auth_id = str(model_or_dict_get(clerk_user, "id", "")).strip()
            if external_auth_id and external_auth_id not in seen_ids:
                seen_ids.add(external_auth_id)
                users.append(clerk_user)
        if len(batch) < limit:
            break
        offset += limit

    return users


def prune_missing_users(external_auth_ids, dry_run=False):
    if not external_auth_ids:
        print("Skipping prune because the Clerk sync returned no users.")
        return 0

    stale_users = User.query.filter(
        User.clerk_user_id.isnot(None),
        ~User.clerk_user_id.in_(external_auth_ids),
    ).all()

    if dry_run:
        for user in stale_users:
            print(f"dry-run prune: local_id={user.id} email={user.email} external_auth_id={user.clerk_user_id}")
        db.session.rollback()
        return len(stale_users)

    for user in stale_users:
        db.session.delete(user)

    prune_error = commit_session("pruning missing Clerk users")
    if prune_error:
        print(prune_error)
        return 0

    return len(stale_users)


def main():
    parser = argparse.ArgumentParser(description="Sync Clerk users into the local Postgres user table.")
    parser.add_argument("--email", help="Sync only a single Clerk user by email.")
    parser.add_argument("--limit", type=int, default=100, help="Page size for Clerk user listing.")
    parser.add_argument(
        "--prune-missing",
        action="store_true",
        help="Delete local Clerk-linked users missing from a full Clerk sync.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without committing them.",
    )
    args = parser.parse_args()

    limit = max(1, min(args.limit, 500))
    secret_key = os.getenv("CLERK_SECRET_KEY")
    if not secret_key:
        raise SystemExit("CLERK_SECRET_KEY is required to run this sync.")

    if args.email:
        normalized_email = normalize_email(args.email)
        if not normalized_email:
            raise SystemExit("Provide a valid email address for --email.")
        args.email = normalized_email

    clerk = Clerk(bearer_auth=secret_key)

    with app.app_context():
        users = fetch_clerk_users(clerk, email_filter=args.email, limit=limit)

        deleted = 0
        if args.prune_missing and args.email:
            print("Skipping prune because --email targets only one Clerk user.")
        elif args.prune_missing:
            external_auth_ids = {
                str(model_or_dict_get(clerk_user, "id", "")).strip()
                for clerk_user in users
                if model_or_dict_get(clerk_user, "id")
            }
            deleted = prune_missing_users(external_auth_ids, dry_run=args.dry_run)
            if deleted:
                print(f"{'Would delete' if args.dry_run else 'Deleted'} {deleted} local users not found in Clerk.")

        if not users:
            print("No Clerk users matched the requested sync.")
            print(f"Sync complete. created=0 updated=0 skipped=0 errors=0 deleted={deleted}")
            return

        created = 0
        updated = 0
        skipped = 0
        errors = 0

        for clerk_user in users:
            result = upsert_clerk_user(clerk_user)
            action = result["action"]

            if action == "skipped":
                skipped += 1
                db.session.rollback()
                print(
                    f"skipped: {result['email'] or '<missing-email>'} "
                    f"(external_auth_id={result['external_auth_id']}) reason={result['reason']}"
                )
                continue

            if args.dry_run:
                if action == "created":
                    created += 1
                else:
                    updated += 1
                db.session.rollback()
                print(
                    f"dry-run {action}: {result['email']} "
                    f"(local_id={result['local_user_id']}, external_auth_id={result['external_auth_id']})"
                )
                continue

            error = commit_session(f"syncing {result['email']}")
            if error:
                errors += 1
                print(
                    f"error: {result['email']} "
                    f"(external_auth_id={result['external_auth_id']}) reason={error}"
                )
                continue

            local_user_id = result["user"].id
            if action == "created":
                created += 1
            else:
                updated += 1

            print(
                f"{action}: {result['email']} "
                f"(local_id={local_user_id}, external_auth_id={result['external_auth_id']})"
            )

        print(
            f"Sync complete. created={created} updated={updated} skipped={skipped} "
            f"errors={errors} deleted={deleted}"
        )


if __name__ == "__main__":
    main()
