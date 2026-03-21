import os
from dotenv import load_dotenv
from extensions import db
from models import (
    User, Agent, Property, Enquiry, Review, Builder, 
    BuilderProject, Blog, Slug, ChatSession, ChatMessage, 
    UserPreference, UserInteraction
)
from app import app
import sqlite3
import pandas as pd

load_dotenv()

def migrate_data():
    # 1. Source (SQLite)
    basedir = os.path.abspath(os.path.dirname(__file__))
    sqlite_path = os.path.join(basedir, 'instance', 'hns.db')
    
    if not os.path.exists(sqlite_path):
        print(f"❌ SQLite database not found at {sqlite_path}")
        return

    # 2. Destination (Postgres)
    pg_url = os.getenv('DATABASE_URL')
    if not pg_url or not pg_url.startswith('postgresql'):
        print("❌ DATABASE_URL not set or not a Postgres URL in .env")
        return

    print("🚀 Starting migration from SQLite to PostgreSQL...")

    # Initialize Flask app context
    with app.app_context():
        # Create tables in Postgres
        print("Creating tables in PostgreSQL...")
        db.create_all()
        
        # Connect to SQLite for raw reading if needed, or use SQLAlchemy
        # We'll use SQLAlchemy for high-level migration
        
        models_to_migrate = [
            User, Agent, Builder, BuilderProject, Property, 
            Enquiry, Review, Blog, Slug, ChatSession, 
            ChatMessage, UserPreference, UserInteraction
        ]

        # Note: We migrate in an order that respects foreign keys
        # Users -> Builders -> Projects -> Properties -> etc.
        
        sqlite_conn = sqlite3.connect(sqlite_path)
        
        for model in models_to_migrate:
            table_name = model.__tablename__
            print(f"📦 Migrating table: {table_name}...")
            
            try:
                # Read from SQLite using pandas for simplicity with column mapping
                df = pd.read_sql(f"SELECT * FROM {table_name}", sqlite_conn)
                
                if df.empty:
                    print(f"  - Table {table_name} is empty. Skipping.")
                    continue
                
                # Write to Postgres
                # We use 'append' because create_all already created schema
                # We use sqlalchemy engine directly from flask-sqlalchemy
                df.to_sql(table_name, db.engine, if_exists='append', index=False, method='multi')
                print(f"  ✅ Successfully migrated {len(df)} records.")
                
            except Exception as e:
                print(f"  ❌ Error migrating {table_name}: {e}")

        sqlite_conn.close()
        print("\n🎉 Relational data migration complete!")
        
        # 4. Sync Vector Store
        print("\n🤖 Shifting to Vector Sync (generating embeddings in Postgres)...")
        from chatbot.rag_service import sync_properties_to_vectordb
        try:
            sync_properties_to_vectordb()
            print("✅ Vector sync complete!")
        except Exception as e:
            print(f"❌ Vector sync failed: {e}")
            print("Note: Ensure you have 'CREATE EXTENSION vector;' run in your Postgres DB.")

if __name__ == "__main__":
    migrate_data()
