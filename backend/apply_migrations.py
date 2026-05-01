"""
apply_migrations.py
-------------------
Standalone script to apply the new schema changes to PostgreSQL.
Adds 6 new columns to builder_project and creates the
unit_config + project_amenity tables.

Usage:
    python apply_migrations.py
    -- or with an explicit DB URL --
    python apply_migrations.py postgresql://user:pass@host/dbname
"""
import sys
import os

# ── 1. Resolve DATABASE_URL ────────────────────────────────────────────────
# Priority: CLI arg > env var > .env file
db_url = None

if len(sys.argv) > 1:
    db_url = sys.argv[1]

if not db_url:
    db_url = os.environ.get("DATABASE_URL")

if not db_url:
    # Try to read from .env file in the same directory
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("DATABASE_URL"):
                    _, _, val = line.partition("=")
                    db_url = val.strip().strip('"').strip("'")
                    break

if not db_url:
    print("❌  Could not find DATABASE_URL.")
    print("   Pass it as: python apply_migrations.py postgresql://user:pass@host/db")
    sys.exit(1)

# Heroku-style URL fix
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

print(f"🔗  Connecting to: {db_url[:db_url.index('@') + 1]}***")

# ── 2. Connect with psycopg2 (or sqlalchemy as fallback) ──────────────────
# ── 2. Connect with psycopg2 ──────────────────────────────────────────────
# Parse URL into components so special chars in passwords (e.g. @/%40) don't
# confuse psycopg2's DSN parser.
try:
    import psycopg2
    from urllib.parse import urlparse, unquote

    parsed = urlparse(db_url)
    conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        dbname=parsed.path.lstrip("/"),
        user=unquote(parsed.username or ""),
        password=unquote(parsed.password or ""),
        connect_timeout=15,
    )
    conn.autocommit = False
    cur = conn.cursor()
    # Set a lock timeout so we don't hang indefinitely if the server is holding a lock.
    cur.execute("SET lock_timeout = '10s';")
    USE_PSYCOPG2 = True
    print("   Connected via psycopg2 ✅ (Lock timeout set to 10s)")
except ImportError:
    print("psycopg2 not found, falling back to SQLAlchemy...")
    USE_PSYCOPG2 = False
except Exception as e:
    print(f"❌  psycopg2 connection failed: {e}")
    sys.exit(1)

# ── Helper ────────────────────────────────────────────────────────────────
def run(sql, label=""):
    if USE_PSYCOPG2:
        try:
            cur.execute(sql)
            if label:
                print(f"   ✅  {label}")
        except Exception as e:
            print(f"   ⚠️  {label or sql[:60]} → {e}")
    else:
        try:
            conn.execute(text(sql))
            if label:
                print(f"   ✅  {label}")
        except Exception as e:
            print(f"   ⚠️  {label or sql[:60]} → {e}")

# ── 3. builder_project — add 6 new columns ────────────────────────────────
print("\n📋  BUILDER_PROJECT — adding new columns...")

new_bp_cols = {
    "development_group":     "VARCHAR(150)",
    "elevation":             "VARCHAR(100)",
    "structure_description": "TEXT",
    "jodi_options":          "TEXT",
    "usps":                  "TEXT",
    "highlights":            "TEXT",
}

for col, col_type in new_bp_cols.items():
    run(
        f"ALTER TABLE builder_project ADD COLUMN IF NOT EXISTS {col} {col_type};",
        label=f"builder_project.{col} ({col_type})",
    )

# ── 4. Create unit_config table ───────────────────────────────────────────
print("\n📋  Creating unit_config table...")
run("""
CREATE TABLE IF NOT EXISTS unit_config (
    id               SERIAL PRIMARY KEY,
    project_id       INTEGER NOT NULL REFERENCES builder_project(id) ON DELETE CASCADE,
    bhk_type         VARCHAR(20),
    carpet_area_min  FLOAT,
    carpet_area_max  FLOAT,
    rera_carpet_area FLOAT,
    deck_area        FLOAT,
    area_unit        VARCHAR(10) DEFAULT 'sqft',
    price_from       FLOAT,
    price_to         FLOAT,
    price_label      VARCHAR(50)
);
""", label="unit_config table")

run(
    "CREATE INDEX IF NOT EXISTS ix_unit_config_project_id ON unit_config (project_id);",
    label="unit_config index on project_id",
)

# ── 5. Create project_amenity table ──────────────────────────────────────
print("\n📋  Creating project_amenity table...")
run("""
CREATE TABLE IF NOT EXISTS project_amenity (
    id         SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES builder_project(id) ON DELETE CASCADE,
    name       VARCHAR(150) NOT NULL,
    category   VARCHAR(100),
    icon_key   VARCHAR(100)
);
""", label="project_amenity table")

run(
    "CREATE INDEX IF NOT EXISTS ix_project_amenity_project_id ON project_amenity (project_id);",
    label="project_amenity index on project_id",
)

# ── 6. Commit ─────────────────────────────────────────────────────────────
if USE_PSYCOPG2:
    conn.commit()
    cur.close()
    conn.close()
else:
    conn.commit()
    conn.close()

print("\n🎉  All migrations applied successfully!\n")
print("Tables / columns added:")
print("  builder_project  → development_group, elevation, structure_description,")
print("                     jodi_options, usps, highlights")
print("  unit_config      → new table (BHK-level configs)")
print("  project_amenity  → new table (queryable amenity rows)")
