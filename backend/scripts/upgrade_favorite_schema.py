import sys
from pathlib import Path

from sqlalchemy import text

# Ensure backend folder is on sys.path when run from scripts/
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import app  # noqa: E402
from extensions import db  # noqa: E402


def _run_postgres_migration():
    # Make property_id nullable for guest session rows
    db.session.execute(text("ALTER TABLE favorite ALTER COLUMN property_id DROP NOT NULL;"))

    # Add new columns if missing
    db.session.execute(text("ALTER TABLE favorite ADD COLUMN IF NOT EXISTS cart_snapshot TEXT;"))
    db.session.execute(text("ALTER TABLE favorite ADD COLUMN IF NOT EXISTS change_log TEXT;"))
    db.session.execute(text("ALTER TABLE favorite ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;"))

    # Backfill updated_at for existing rows
    db.session.execute(
        text("UPDATE favorite SET updated_at = COALESCE(updated_at, created_at, NOW());")
    )
    db.session.commit()


def main():
    with app.app_context():
        dialect = db.engine.dialect.name
        if dialect != "postgresql":
            print(
                f"Unsupported dialect for this migration: {dialect}. "
                "This script is intended for PostgreSQL."
            )
            return
        _run_postgres_migration()
        print("Favorite schema migration complete.")


if __name__ == "__main__":
    main()
