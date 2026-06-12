"""
Child-DB-only: schema migration + seed data for unit_config and unit_room_detail.
Data sourced from PDF floor plans:
  - R6 Floor Plan.pdf        → Aurum Islands, Tower R6
  - The Trellis Unit Plans   → Wing A and Wing B

Usage:
    cd backend
    python scripts/seed_unit_configs_sandbox.py
"""

import os
import sys

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, BACKEND_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(BACKEND_DIR, '.env'))

import psycopg2
from urllib.parse import urlparse

TARGET_URL = os.getenv('DATABASE_URL_CHILD') or os.getenv('DATABASE_URL_SANDBOX', '')
if not TARGET_URL:
    print("ERROR: DATABASE_URL_CHILD (or DATABASE_URL_SANDBOX) not set in .env")
    sys.exit(1)


def _parse(url):
    p = urlparse(url.split('?')[0])
    return {
        'host':     p.hostname,
        'port':     p.port or 5432,
        'user':     p.username,
        'password': (p.password or '').replace('%40', '@'),
        'dbname':   p.path.lstrip('/'),
    }


cfg = _parse(TARGET_URL)
print(f"Target (child DB): {cfg['host']}/{cfg['dbname']}")
print()
confirm = input("Type 'yes' to apply schema + seed: ").strip().lower()
if confirm != 'yes':
    print("Aborted.")
    sys.exit(0)


def make_conn():
    """Fresh connection with keepalives — safe against Neon pooler idle drops."""
    c = psycopg2.connect(
        host=cfg['host'], port=cfg['port'],
        user=cfg['user'], password=cfg['password'],
        dbname=cfg['dbname'],
        sslmode='require',
        keepalives=1,
        keepalives_idle=10,
        keepalives_interval=5,
        keepalives_count=3,
    )
    c.autocommit = True
    x = c.cursor()
    x.execute("SET search_path TO public")
    return c, x


conn, cur = make_conn()

try:
    # ─────────────────────────────────────────────────────────────────────────
    # 1. Add new columns to unit_config (idempotent)
    # ─────────────────────────────────────────────────────────────────────────
    print("\n[1/5] Checking unit_config columns...")
    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'unit_config'
    """)
    existing_cols = {r[0] for r in cur.fetchall()}

    for col, col_type in [
        ("unit_type",             "VARCHAR(30)"),
        ("wing",                  "VARCHAR(20)"),
        ("floor_range_raw",       "VARCHAR(100)"),
        ("balcony_area",          "FLOAT"),
        ("enclosed_balcony_area", "FLOAT"),
        ("service_area",          "FLOAT"),
        ("ceiling_height",        "VARCHAR(50)"),
        ("main_door_facing",      "VARCHAR(50)"),
        ("modular_kitchen",       "BOOLEAN"),
        ("kitchen_type",          "VARCHAR(50)"),
        ("is_combination",        "BOOLEAN DEFAULT FALSE"),
    ]:
        if col not in existing_cols:
            cur.execute(f"ALTER TABLE public.unit_config ADD COLUMN {col} {col_type}")
            print(f"  Added: {col}")
        else:
            print(f"  OK:    {col}")

    # ─────────────────────────────────────────────────────────────────────────
    # 2. Create unit_room_detail (idempotent)
    # ─────────────────────────────────────────────────────────────────────────
    print("\n[2/5] Creating unit_room_detail table if needed...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS public.unit_room_detail (
            id              SERIAL PRIMARY KEY,
            unit_config_id  INTEGER NOT NULL
                            REFERENCES public.unit_config(id) ON DELETE CASCADE,
            room_name       VARCHAR(50) NOT NULL,
            length          FLOAT,
            width           FLOAT,
            area_sqm        FLOAT,
            area_unit       VARCHAR(10) DEFAULT 'sqft'
        )
    """)
    print("  unit_room_detail ready.")

    # ─────────────────────────────────────────────────────────────────────────
    # 3. Use the real project IDs already in builder_project
    # ─────────────────────────────────────────────────────────────────────────
    print("\n[3/5] Using existing builder_project rows...")

    # Aurum Q Islands R6 → id=12,  The Trellis → id=16
    AURUM_ID   = 12
    TRELLIS_ID = 16

    for pid, title in [(AURUM_ID, "Aurum Q Islands R6"), (TRELLIS_ID, "The Trellis")]:
        cur.execute("SELECT id, title FROM public.builder_project WHERE id = %s", (pid,))
        row = cur.fetchone()
        if not row:
            raise RuntimeError(f"builder_project id={pid} not found — check the DB.")
        print(f"  Confirmed: id={row[0]}  '{row[1]}'")

    aurum_id   = AURUM_ID
    trellis_id = TRELLIS_ID

    # Delete any placeholder rows we inserted previously (ids 43, 44)
    cur.execute("""
        DELETE FROM public.builder_project
        WHERE id IN (43, 44)
          AND builder_name IS NULL
    """)
    print("  Removed placeholder rows (43, 44) if present.")

    # ─────────────────────────────────────────────────────────────────────────
    # 4. Clear existing unit_config rows for these two projects (clean reseed)
    # ─────────────────────────────────────────────────────────────────────────
    print("\n[4/5] Clearing existing unit_config rows...")
    for pid, name in [(aurum_id, "Aurum Q Islands R6"), (trellis_id, "The Trellis")]:
        cur.execute("DELETE FROM public.unit_config WHERE project_id = %s", (pid,))
        print(f"  Cleared: {name}")

    # ─────────────────────────────────────────────────────────────────────────
    # 5. Seed — one fresh connection per unit to avoid Neon idle-txn drops
    # ─────────────────────────────────────────────────────────────────────────
    print("\n[5/5] Seeding unit_config + unit_room_detail...")

    def seed_unit(project_id, bhk_type, unit_type, wing, floor_range_raw,
                  rera_sqm, rooms,
                  balcony_area=None, enclosed_balcony_area=None,
                  service_area=None, is_combination=False):
        c, x = make_conn()
        try:
            x.execute(
                """
                INSERT INTO public.unit_config
                  (project_id, bhk_type, unit_type, wing, floor_range_raw,
                   rera_carpet_area, area_unit,
                   balcony_area, enclosed_balcony_area, service_area,
                   is_combination, price_from, price_to)
                VALUES (%s,%s,%s,%s,%s, %s,'sqm', %s,%s,%s, %s, NULL,NULL)
                RETURNING id
                """,
                (project_id, bhk_type, unit_type, wing, floor_range_raw,
                 rera_sqm, balcony_area, enclosed_balcony_area, service_area,
                 is_combination),
            )
            uid = x.fetchone()[0]
            for room_name, length, width in rooms:
                x.execute(
                    """
                    INSERT INTO public.unit_room_detail
                      (unit_config_id, room_name, length, width, area_unit)
                    VALUES (%s, %s, %s, %s, 'sqft')
                    """,
                    (uid, room_name, length, width),
                )
            return uid
        finally:
            x.close(); c.close()

    # Shared room lists
    rooms_a2_type1_2 = [
        ('Bedroom 1', 10.0, 13.3),  ('Bedroom 2',  9.6, 10.0),
        ('Living',    10.0, 17.2),  ('Dining',      3.1, 10.3),
        ('Kitchen',    7.1, 10.0),  ('Toilet 1',    4.3,  7.0),
        ('Toilet 2',   8.6,  4.1),
    ]
    rooms_a2_type3_4 = [
        ('Bedroom 1', 10.0, 13.11), ('Bedroom 2',  9.6, 10.8),
        ('Living',    10.0, 19.11), ('Dining',      3.1, 10.3),
        ('Kitchen',    7.1, 10.8),  ('Toilet 1',    4.3,  7.0),
        ('Toilet 2',   8.6,  4.1),
    ]
    rooms_a2_type8 = [
        ('Bedroom 1',  9.6, 12.0),  ('Bedroom 2', 10.0, 15.3),
        ('Living',    10.0, 22.10), ('Dining',     3.11, 10.6),
        ('Kitchen',    7.1, 12.0),  ('Toilet 1',   4.3,   7.3),
        ('Toilet 2',   8.6,  4.1),
    ]

    # ── Aurum Islands — Tower R6 ─────────────────────────────────────────────
    seed_unit(aurum_id, '2 BHK', None, 'R6', '3-29', 64.60,
        [('Living Room',     11.0, 17.0),  ('Dining',              4.0,  6.8),
         ('Master Bedroom',  11.0, 12.5),  ('Children Bedroom',   10.0, 11.6),
         ('Kitchen',          9.9,  6.11), ('Utility',             3.3,  5.7),
         ('Passage',         10.6,  3.1),  ('Entrance Lobby',      4.6,  3.4),
         ('Toilet',           7.6,  4.5),  ('Master Toilet',       4.4,  7.5),
         ('Balcony',         10.4,  4.1)],
        balcony_area=3.83, service_area=2.01)
    print("  Aurum R6 2 BHK — done (11 rooms)")

    seed_unit(aurum_id, '4.5 BHK', None, 'R6', '30-37,39', 130.84,
        [('Living',               22.9, 17.0),  ('Dining',              4.0,  6.8),
         ('Master Bedroom 1',     11.0, 12.5),  ('Master Bedroom 2',   11.0, 12.5),
         ('Children Bedroom 1',   10.0, 11.8),  ('Children Bedroom 2', 10.0, 11.8),
         ('Kitchen',               9.9,  6.11), ('Study',               9.9,  6.11),
         ('Utility 1',             3.3,  5.7),  ('Utility 2',           3.3,  5.7),
         ('Passage 1',            10.6,  3.1),  ('Passage 2',          10.6,  3.1),
         ('Entrance Lobby',        4.7,  3.4),  ('Toilet 1',            7.6,  4.5),
         ('Toilet 2',              7.6,  4.5),  ('Master Toilet 1',     4.4,  7.5),
         ('Master Toilet 2',       4.4,  7.5),  ('Balcony',             4.1, 21.9)],
        balcony_area=8.06, service_area=4.02)
    print("  Aurum R6 4.5 BHK — done (18 rooms)")

    # ── The Trellis — Wing A — 2 BHK ────────────────────────────────────────
    seed_unit(trellis_id, '2 BHK', 'Type 1',  'Wing A', '8',                    60.124, rooms_a2_type1_2)
    print("  Trellis Wing A 2BHK Type 1  — done (7 rooms)")
    seed_unit(trellis_id, '2 BHK', 'Type 2',  'Wing A', '8',                    60.143, rooms_a2_type1_2)
    print("  Trellis Wing A 2BHK Type 2  — done (7 rooms)")
    seed_unit(trellis_id, '2 BHK', 'Type 3A', 'Wing A', '9-18',                 64.576, rooms_a2_type3_4)
    print("  Trellis Wing A 2BHK Type 3A — done (7 rooms)")
    seed_unit(trellis_id, '2 BHK', 'Type 3B', 'Wing A', '9-18',                 64.576, rooms_a2_type3_4)
    print("  Trellis Wing A 2BHK Type 3B — done (7 rooms)")
    seed_unit(trellis_id, '2 BHK', 'Type 4',  'Wing A', '9-18',                 64.595, rooms_a2_type3_4)
    print("  Trellis Wing A 2BHK Type 4  — done (7 rooms)")

    seed_unit(trellis_id, '2 BHK', 'Type 5', 'Wing A', '4-7,9-12,14-17,19-22,24', 67.868,
        [('Bedroom 1',  9.6, 12.0),  ('Bedroom 2', 10.0, 15.3),
         ('Living',    10.0, 19.6),  ('Dining',    3.11, 10.2),
         ('Kitchen',    7.1, 12.0),  ('Toilet 1',  4.1,   6.11),
         ('Toilet 2',   8.6,  4.1)])
    print("  Trellis Wing A 2BHK Type 5  — done (7 rooms)")

    seed_unit(trellis_id, '2 BHK', 'Type 8A', 'Wing A', '4-24', 71.411, rooms_a2_type8)
    print("  Trellis Wing A 2BHK Type 8A — done (7 rooms)")
    seed_unit(trellis_id, '2 BHK', 'Type 8B', 'Wing A', '4-24', 71.411, rooms_a2_type8)
    print("  Trellis Wing A 2BHK Type 8B — done (7 rooms, mirror of 8A)")

    # ── The Trellis — Wing A — 3 BHK ────────────────────────────────────────
    seed_unit(trellis_id, '3 BHK', 'Type 1', 'Wing A', '5-24', 100.145,
        [('Master Bedroom', 10.2, 15.7), ('Bedroom 2',    14.1, 11.0),
         ('Bedroom 3',      14.6,  9.6), ('Living',       11.0, 22.5),
         ('Dining',          4.6, 13.7), ('Kitchen',       7.7, 12.0),
         ('Walk-in Closet',  5.7,  9.0), ('Toilet 1',      4.3,  9.0),
         ('Toilet 2',        7.7,  4.3), ('Toilet 3',      7.7,  4.3)])
    print("  Trellis Wing A 3BHK Type 1  — done (10 rooms)")

    seed_unit(trellis_id, '3 BHK', 'Type 3', 'Wing A', '4-24', 110.225,
        [('Master Bedroom',   10.0, 15.7), ('Bedroom 2',       13.7, 10.0),
         ('Bedroom 3',        13.4, 12.8), ('Living',          11.0, 21.10),
         ('Dining',            8.4, 10.6), ('Kitchen',          8.0, 11.0),
         ('Walk-in Closet',    5.5,  9.2), ('Balcony',         19.6,  4.7),
         ('Enclosed Balcony', 13.4,  2.9), ('Lobby',            5.1,  6.7),
         ('Toilet 1',          4.3,  9.2), ('Toilet 2',         7.10, 4.7),
         ('Toilet 3',         10.0,  4.3)],
        balcony_area=8.33, enclosed_balcony_area=3.46)
    print("  Trellis Wing A 3BHK Type 3  — done (13 rooms)")

    # ── The Trellis — Wing B — 2 BHK ────────────────────────────────────────
    seed_unit(trellis_id, '2 BHK', 'Type 3C', 'Wing B', '15-22', 64.576,
        [('Bedroom 1', 10.0, 13.11), ('Bedroom 2',  9.6, 10.8),
         ('Living',    10.0, 22.0),  ('Dining',      3.1, 10.3),
         ('Kitchen',    7.1, 10.8),  ('Toilet 1',    4.3,  7.0),
         ('Toilet 2',   8.6,  4.1)])
    print("  Trellis Wing B 2BHK Type 3C — done (7 rooms)")

    seed_unit(trellis_id, '2 BHK', 'Type 6', 'Wing B', '6-25', 68.164,
        [('Bedroom 1', 10.0, 14.3),  ('Bedroom 2',  9.6, 11.0),
         ('Living',    10.0, 22.0),  ('Dining',     3.11, 10.8),
         ('Kitchen',    7.1, 11.0),  ('Toilet 1',   4.3,   7.5),
         ('Toilet 2',   8.6,  4.1)])
    print("  Trellis Wing B 2BHK Type 6  — done (7 rooms)")

    seed_unit(trellis_id, '2 BHK', 'Type 7', 'Wing B', '6-25', 68.608,
        [('Bedroom 1', 10.5, 14.3),  ('Bedroom 2',  9.6, 11.0),
         ('Living',    10.0, 22.0),  ('Dining',     3.11, 10.8),
         ('Kitchen',    7.1, 11.0),  ('Toilet 1',   4.3,   7.5),
         ('Toilet 2',   8.2,  4.1)])
    print("  Trellis Wing B 2BHK Type 7  — done (7 rooms)")

    # ── The Trellis — Wing B — 3 BHK ────────────────────────────────────────
    seed_unit(trellis_id, '3 BHK', 'Type 2', 'Wing B', '6-25', 106.884,
        [('Master Bedroom', 10.0, 13.11), ('Bedroom 2',    15.2, 10.0),
         ('Bedroom 3',      12.0, 14.5),  ('Living',       11.0, 22.2),
         ('Dining',          5.8, 10.6),  ('Kitchen',      7.10, 11.4),
         ('Walk-in Closet',  5.5,  8.10), ('Lobby',         5.1,  7.2),
         ('Toilet 1',        4.3,  8.10), ('Toilet 2',     7.10,  4.7),
         ('Toilet 3',        8.10, 4.7)])
    print("  Trellis Wing B 3BHK Type 2  — done (11 rooms)")

    # ── The Trellis — Combination units (no rooms) ───────────────────────────
    for unit_type, wing, rera, bal, enc_bal in [
        ('Combination 01', 'Wing A', 181.636, 8.33, 3.46),
        ('Combination 02', 'Wing B', 175.492, None, None),
        ('Combination 03', 'Wing A', 142.822, None, None),
        ('Combination 04', 'Wing B', 136.772, None, None),
    ]:
        seed_unit(trellis_id, None, unit_type, wing, None, rera, [],
                  balcony_area=bal, enclosed_balcony_area=enc_bal,
                  is_combination=True)
        print(f"  Trellis {unit_type} ({wing}) — done (combination, no rooms)")

    print("\nAll rows written to child DB.")

    # ─────────────────────────────────────────────────────────────────────────
    # Verification
    # ─────────────────────────────────────────────────────────────────────────
    vc, vx = make_conn()
    vx.execute("""
        SELECT p.title, u.bhk_type, u.unit_type, u.wing,
               COUNT(r.id) AS room_count
        FROM   public.unit_config u
        JOIN   public.builder_project p ON p.id = u.project_id
        LEFT JOIN public.unit_room_detail r ON r.unit_config_id = u.id
        WHERE  p.id IN (12, 16)
        GROUP  BY p.title, u.bhk_type, u.unit_type, u.wing
        ORDER  BY p.title, u.bhk_type NULLS LAST, u.unit_type
    """)
    rows = vx.fetchall()
    vx.close(); vc.close()

    print(f"\n  {'Project':<22} {'BHK':<10} {'Unit Type':<16} {'Wing':<12} Rooms")
    print(f"  {'-'*22} {'-'*10} {'-'*16} {'-'*12} -----")
    for title, bhk, utype, wing, room_count in rows:
        print(f"  {(title or ''):<22} {(bhk or ''):<10} {(utype or ''):<16} {(wing or ''):<12} {room_count}")
    print(f"\n  Total unit_config rows: {len(rows)}")

except Exception as e:
    print(f"\nERROR: {e}")
    import traceback; traceback.print_exc()
    sys.exit(1)
finally:
    try:
        cur.close(); conn.close()
    except Exception:
        pass
