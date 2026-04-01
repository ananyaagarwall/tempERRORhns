import os
import sqlite3
from datetime import date, datetime

from dotenv import load_dotenv
from sqlalchemy import Boolean, Date, DateTime, Float, Integer, Numeric, String, inspect, text
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app import app
from extensions import db
from models import (
    Agent,
    Blog,
    Builder,
    BuilderProject,
    ChatMessage,
    ChatSession,
    Enquiry,
    Favorite,
    Property,
    Review,
    Slug,
    User,
    UserInteraction,
    UserPreference,
)

load_dotenv()


def _resync_sequence(table_name, pk_column="id"):
    """Align Postgres sequences after explicit-ID inserts."""
    quoted_table = f'"{table_name}"'
    quoted_pk = f'"{pk_column}"'
    db.session.execute(
        text(
            f"""
            SELECT setval(
                pg_get_serial_sequence('{quoted_table}', '{pk_column}'),
                COALESCE((SELECT MAX({quoted_pk}) FROM {quoted_table}), 1),
                true
            )
            """
        )
    )
    db.session.commit()


def _normalize_postgres_url(url):
    if not url:
        return url
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


def _sqlite_table_exists(sqlite_conn, table_name):
    row = sqlite_conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name = ?",
        (table_name,),
    ).fetchone()
    return row is not None


def _sqlite_columns(sqlite_conn, table_name):
    rows = sqlite_conn.execute(f'PRAGMA table_info("{table_name}")').fetchall()
    return [row[1] for row in rows]


def _coerce_value(value, column):
    if value is None:
        return None

    if value == "":
        if isinstance(column.type, (Integer, Float, Numeric, Date, DateTime, Boolean)):
            return None
        return value

    if isinstance(column.type, Boolean):
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return bool(value)
        normalized = str(value).strip().lower()
        if normalized in {"1", "true", "t", "yes", "y"}:
            return True
        if normalized in {"0", "false", "f", "no", "n"}:
            return False

    if isinstance(column.type, Integer):
        if isinstance(value, bool):
            return int(value)
        if isinstance(value, int):
            return value
        try:
            return int(value)
        except (TypeError, ValueError):
            return value

    if isinstance(column.type, (Float, Numeric)):
        if isinstance(value, (int, float)):
            return value
        try:
            return float(value)
        except (TypeError, ValueError):
            return value

    if isinstance(column.type, DateTime) and isinstance(value, str):
        normalized = value.strip()
        try:
            return datetime.fromisoformat(normalized.replace("Z", "+00:00"))
        except ValueError:
            return value

    if isinstance(column.type, Date) and isinstance(value, str):
        normalized = value.strip()
        try:
            return date.fromisoformat(normalized)
        except ValueError:
            return value

    if isinstance(column.type, String):
        return str(value)

    return value


def _fetch_sqlite_rows(sqlite_conn, model):
    table_name = model.__tablename__

    if not _sqlite_table_exists(sqlite_conn, table_name):
        print(f"  - Source table {table_name} does not exist in SQLite. Skipping.")
        return []

    source_columns = set(_sqlite_columns(sqlite_conn, table_name))
    destination_columns = [column.name for column in model.__table__.columns]
    transferable_columns = [name for name in destination_columns if name in source_columns]

    if not transferable_columns:
        print(f"  - No matching columns found for {table_name}. Skipping.")
        return []

    column_sql = ", ".join(f'"{column}"' for column in transferable_columns)
    sqlite_conn.row_factory = sqlite3.Row
    rows = sqlite_conn.execute(f'SELECT {column_sql} FROM "{table_name}"').fetchall()

    prepared_rows = []
    model_columns = {column.name: column for column in model.__table__.columns}
    for row in rows:
        item = {}
        for column_name in transferable_columns:
            item[column_name] = _coerce_value(row[column_name], model_columns[column_name])
        prepared_rows.append(item)

    return prepared_rows


def _chunked(items, size):
    for start in range(0, len(items), size):
        yield items[start:start + size]


def _upsert_rows(model, rows, batch_size=500):
    if not rows:
        return 0

    table = model.__table__
    primary_key_columns = [column.name for column in table.primary_key.columns]
    updatable_columns = [
        column.name for column in table.columns if column.name not in primary_key_columns
    ]

    total_written = 0
    with db.engine.begin() as connection:
        for batch in _chunked(rows, batch_size):
            statement = pg_insert(table).values(batch)

            if primary_key_columns and updatable_columns:
                statement = statement.on_conflict_do_update(
                    index_elements=primary_key_columns,
                    set_={
                        column_name: getattr(statement.excluded, column_name)
                        for column_name in updatable_columns
                    },
                )
            elif primary_key_columns:
                statement = statement.on_conflict_do_nothing(index_elements=primary_key_columns)

            connection.execute(statement)
            total_written += len(batch)

    return total_written


def _ensure_postgres_migration_compatibility():
    """
    Repair known PostgreSQL schema mismatches that block SQLite imports.
    """
    if db.engine.dialect.name != "postgresql":
        return

    inspector = inspect(db.engine)

    if inspector.has_table("builder_project"):
        columns = {
            column["name"]: column
            for column in inspector.get_columns("builder_project")
        }
        property_status = columns.get("property_status")
        current_length = getattr(property_status.get("type"), "length", None) if property_status else None
        if current_length is not None and current_length < 50:
            db.session.execute(
                text(
                    """
                    ALTER TABLE builder_project
                    ALTER COLUMN property_status TYPE VARCHAR(50)
                    """
                )
            )
            db.session.commit()
            print("Adjusted schema: builder_project.property_status -> VARCHAR(50)")


def migrate_data():
  
    basedir = os.path.abspath(os.path.dirname(__file__))
    sqlite_path = os.path.join(basedir, "instance", "hns.db")

    if not os.path.exists(sqlite_path):
        print(f"SQLite database not found at {sqlite_path}")
        return

    pg_url = _normalize_postgres_url(os.getenv("DATABASE_URL"))
    if not pg_url:
        print("DATABASE_URL is not set.")
        return

    # ✅ Force the app to use the Postgres URL before entering context
    app.config["SQLALCHEMY_DATABASE_URI"] = pg_url
    print(f"Forced app DB to: {pg_url}")

    print("Starting migration from SQLite to PostgreSQL...")
    print(f"SQLite source: {sqlite_path}")

    with app.app_context():
        if db.engine.dialect.name != "postgresql":
            print(
                "Destination database is not PostgreSQL. "
                f"Current SQLAlchemy dialect: {db.engine.dialect.name}"
            )
            return

        print("Creating tables in PostgreSQL...")
        db.create_all()
        _ensure_postgres_migration_compatibility()

        models_to_migrate = [
            User,
            Agent,
            Builder,
            BuilderProject,
            Property,
            Enquiry,
            Review,
            Blog,
            Slug,
            ChatSession,
            ChatMessage,
            UserPreference,
            UserInteraction,
            Favorite,
        ]

        sqlite_conn = sqlite3.connect(sqlite_path)
        try:
            for model in models_to_migrate:
                table_name = model.__tablename__
                print(f"Migrating table: {table_name}...")

                try:
                    rows = _fetch_sqlite_rows(sqlite_conn, model)
                    if not rows:
                        print(f"  - No rows found for {table_name}.")
                        continue

                    written_count = _upsert_rows(model, rows)
                    print(f"  - Upserted {written_count} records.")

                    integer_primary_key = next(
                        (
                            column
                            for column in model.__table__.primary_key.columns
                            if isinstance(column.type, Integer)
                        ),
                        None,
                    )
                    if integer_primary_key is not None:
                        _resync_sequence(table_name, integer_primary_key.name)

                except Exception as exc:
                    db.session.rollback()
                    print(f"  - Error migrating {table_name}: {exc}")
        finally:
            sqlite_conn.close()

        print("\nRelational data migration complete!")
        print("\nShifting to Vector Sync (generating embeddings in Postgres)...")

        from chatbot.rag_service import sync_properties_to_vectordb

        try:
            sync_properties_to_vectordb()
            print("Vector sync complete!")
        except Exception as exc:
            print(f"Vector sync failed: {exc}")
            print("Note: Ensure you have 'CREATE EXTENSION vector;' run in your Postgres DB.")


if __name__ == "__main__":
    migrate_data()
