import os
import sqlite3

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import text

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
    db.session.execute(
        text(
            f"""
            SELECT setval(
                pg_get_serial_sequence('{table_name}', '{pk_column}'),
                COALESCE((SELECT MAX({pk_column}) FROM {table_name}), 1),
                true
            )
            """
        )
    )
    db.session.commit()


def migrate_data():
    # 1. Source (SQLite)
    basedir = os.path.abspath(os.path.dirname(__file__))
    sqlite_path = os.path.join(basedir, "instance", "hns.db")

    if not os.path.exists(sqlite_path):
        print(f"SQLite database not found at {sqlite_path}")
        return

    # 2. Destination (Postgres)
    pg_url = os.getenv("DATABASE_URL")
    if not pg_url or not pg_url.startswith("postgresql"):
        print("DATABASE_URL not set or not a Postgres URL in .env")
        return

    print("Starting migration from SQLite to PostgreSQL...")

    with app.app_context():
        print("Creating tables in PostgreSQL...")
        db.create_all()

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
        ]

        sqlite_conn = sqlite3.connect(sqlite_path)
        try:
            for model in models_to_migrate:
                table_name = model.__tablename__
                print(f"Migrating table: {table_name}...")

                try:
                    df = pd.read_sql(f"SELECT * FROM {table_name}", sqlite_conn)
                    if df.empty:
                        print(f"  - Table {table_name} is empty. Skipping.")
                        continue

                    # Make reruns safe by skipping rows that already exist by id.
                    if "id" in df.columns:
                        existing_ids_df = pd.read_sql(f"SELECT id FROM {table_name}", db.engine)
                        if not existing_ids_df.empty:
                            df = df[~df["id"].isin(existing_ids_df["id"])]

                    if df.empty:
                        print(f"  - No new rows for {table_name}. Skipping.")
                        continue

                    df.to_sql(table_name, db.engine, if_exists="append", index=False, method="multi")
                    print(f"  - Successfully migrated {len(df)} records.")

                    if "id" in df.columns:
                        _resync_sequence(table_name, "id")

                except Exception as e:
                    print(f"  - Error migrating {table_name}: {e}")
        finally:
            sqlite_conn.close()

        print("\nRelational data migration complete!")

        print("\nShifting to Vector Sync (generating embeddings in Postgres)...")
        from chatbot.rag_service import sync_properties_to_vectordb

        try:
            sync_properties_to_vectordb()
            print("Vector sync complete!")
        except Exception as e:
            print(f"Vector sync failed: {e}")
            print("Note: Ensure you have 'CREATE EXTENSION vector;' run in your Postgres DB.")


if __name__ == "__main__":
    migrate_data()
