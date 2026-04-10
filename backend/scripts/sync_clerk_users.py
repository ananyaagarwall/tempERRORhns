import argparse
import os
import sys

from dotenv import load_dotenv
from clerk_backend_api import Clerk

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

from app import app  # noqa: E402
from models import User  # noqa: E402
from extensions import db  # noqa: E402


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


def ensure_unique_username(base, clerk_user_id):
    base = (base or f"hns_user_{clerk_user_id[:8]}").strip()
    candidate = base
    counter = 1
    while User.query.filter(User.username == candidate, User.clerk_user_id != clerk_user_id).first():
        candidate = f"{base}_{counter}"
        counter += 1
    return candidate


def upsert_clerk_user(clerk_user):
    clerk_user_id = model_or_dict_get(clerk_user, "id")
    email = extract_email(clerk_user)

    if not clerk_user_id or not email:
        return ("skipped", clerk_user_id, email)

    raw_username = first_non_empty(
        model_or_dict_get(clerk_user, "username"),
        model_or_dict_get(clerk_user, "first_name"),
        email.split("@")[0],
    )
    username = ensure_unique_username(raw_username, clerk_user_id)

    user = User.query.filter_by(clerk_user_id=clerk_user_id).first()
    if user is None:
        user = User.query.filter_by(email=email).first()

    if user is None:
        user = User()
        user.clerk_user_id = clerk_user_id
        user.email = email
        user.username = username
        user.password = ""
        user.role = "customer"
        user.is_active = True
        user.phone = None
        db.session.add(user)
        action = "created"
    else:
        action = "updated"
        user.clerk_user_id = clerk_user_id
        user.email = email
        if not user.username:
            user.username = username
        if user.role is None:
            user.role = "customer"
        if user.is_active is None:
            user.is_active = True

    return (action, clerk_user_id, email)


def main():
    parser = argparse.ArgumentParser(description="Sync Clerk users into the local Postgres user table.")
    parser.add_argument("--email", help="Sync only a single Clerk user by email.")
    parser.add_argument("--limit", type=int, default=100, help="Page size for Clerk user listing.")
    args = parser.parse_args()

    clerk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

    with app.app_context():
        users = []
        if args.email:
            users = clerk.users.list(request={"email_address": [args.email], "limit": 1, "offset": 0})
        else:
            offset = 0
            while True:
                batch = clerk.users.list(request={"limit": args.limit, "offset": offset})
                if not batch:
                    break
                users.extend(batch)
                if len(batch) < args.limit:
                    break
                offset += args.limit

        # --- Delete users from Postgres that no longer exist in Clerk ---
        clerk_user_ids = set()
        for clerk_user in users:
            clerk_user_id = model_or_dict_get(clerk_user, "id")
            if clerk_user_id:
                clerk_user_ids.add(clerk_user_id)

        # Query all users with a clerk_user_id in Postgres
        all_pg_users = User.query.filter(User.clerk_user_id.isnot(None)).all()
        deleted = 0
        for pg_user in all_pg_users:
            if pg_user.clerk_user_id not in clerk_user_ids:
                db.session.delete(pg_user)
                deleted += 1
        if deleted:
            print(f"Deleted {deleted} users from Postgres not found in Clerk.")

        if not users:
            print("No Clerk users matched the requested sync.")
            db.session.commit()
            print(f"Sync complete. created=0 updated=0 skipped=0 deleted={deleted}")
            return

        created = 0
        updated = 0
        skipped = 0

        for clerk_user in users:
            action, clerk_user_id, email = upsert_clerk_user(clerk_user)
            print(f"{action}: {email or '<missing-email>'} ({clerk_user_id})")
            if action == "created":
                created += 1
            elif action == "updated":
                updated += 1
            else:
                skipped += 1

        db.session.commit()
        print(f"Sync complete. created={created} updated={updated} skipped={skipped} deleted={deleted}")


if __name__ == "__main__":
    main()
