"""
Cleanup child Neon DB: remove specific builders and/or projects plus all linked data.

Configured below:
  REMOVE_BUILDER_IDS  — removes these builders AND every project/property they own
  REMOVE_EXTRA_PROJECT_IDS — removes these specific projects (even if their builder is kept)

Target: DATABASE_URL_CHILD only.

Usage:
    cd backend
    python scripts/cleanup_child_db.py            # dry run
    python scripts/cleanup_child_db.py --execute  # deletes (asks confirmation)
"""

import os
import sys
import argparse

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, BACKEND_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(BACKEND_DIR, '.env'))

import psycopg2
from urllib.parse import urlparse

CHILD_URL = os.getenv('DATABASE_URL_CHILD', '')
if not CHILD_URL:
    print("ERROR: DATABASE_URL_CHILD not set in .env")
    sys.exit(1)

parser = argparse.ArgumentParser()
parser.add_argument('--execute', action='store_true',
                    help='Actually delete data (default is dry-run)')
args = parser.parse_args()

# ── Configure what to remove ──────────────────────────────────────────────────
REMOVE_BUILDER_IDS       = [1]        # builder 1 + all its projects/properties
REMOVE_EXTRA_PROJECT_IDS = [19]       # project 19 specifically (builder 9 is kept)
PROTECT_PROJECT_IDS      = [41, 42]   # never delete these even if their builder is removed
# ─────────────────────────────────────────────────────────────────────────────


def _parse(url):
    p = urlparse(url.split('?')[0])
    return {
        'host':     p.hostname,
        'port':     p.port or 5432,
        'user':     p.username,
        'password': (p.password or '').replace('%40', '@'),
        'dbname':   p.path.lstrip('/'),
    }


cfg = _parse(CHILD_URL)
print(f"Target (child): {cfg['host']}/{cfg['dbname']}")
print(f"Mode  : {'EXECUTE' if args.execute else 'DRY RUN'}")
print()

conn = psycopg2.connect(
    host=cfg['host'], port=cfg['port'],
    user=cfg['user'], password=cfg['password'],
    dbname=cfg['dbname'], sslmode='require',
)
conn.autocommit = False
cur = conn.cursor()

try:
    # ── Builders being removed ────────────────────────────────────────────────
    cur.execute("""
        SELECT id, company_name FROM builder
        WHERE id = ANY(%s) ORDER BY id
    """, (REMOVE_BUILDER_IDS,))
    remove_builders = cur.fetchall()
    remove_builder_ids = [r[0] for r in remove_builders]

    print("Builders to REMOVE:")
    for bid, bname in remove_builders:
        print(f"  id={bid}  {bname!r}")
    print()

    # ── Projects to remove: from removed builders + extra list ───────────────
    if remove_builder_ids:
        cur.execute("""
            SELECT id, builder_id, title FROM builder_project
            WHERE builder_id = ANY(%s) ORDER BY id
        """, (remove_builder_ids,))
        projects_via_builder = cur.fetchall()
    else:
        projects_via_builder = []

    # Filter out any protected projects from both lists
    projects_via_builder = [r for r in projects_via_builder if r[0] not in PROTECT_PROJECT_IDS]

    extra_project_ids = [p for p in REMOVE_EXTRA_PROJECT_IDS
                         if p not in [r[0] for r in projects_via_builder]
                         and p not in PROTECT_PROJECT_IDS]
    if extra_project_ids:
        cur.execute("""
            SELECT id, builder_id, title FROM builder_project
            WHERE id = ANY(%s) ORDER BY id
        """, (extra_project_ids,))
        projects_via_extra = cur.fetchall()
    else:
        projects_via_extra = []

    all_remove_projects = projects_via_builder + projects_via_extra
    remove_project_ids  = [r[0] for r in all_remove_projects]

    if PROTECT_PROJECT_IDS:
        print(f"Projects PROTECTED (will not be deleted): {PROTECT_PROJECT_IDS}")
        print()

    print(f"Projects to REMOVE ({len(remove_project_ids)}):")
    for pid, bldr_id, title in projects_via_builder:
        print(f"  id={pid}  builder_id={bldr_id}  {title!r}  (via builder)")
    for pid, bldr_id, title in projects_via_extra:
        print(f"  id={pid}  builder_id={bldr_id}  {title!r}  (extra)")
    print()

    # ── Properties linked to removed projects ─────────────────────────────────
    if remove_project_ids:
        cur.execute("""
            SELECT id, "Property_Name" FROM property
            WHERE project_id = ANY(%s) ORDER BY id
        """, (remove_project_ids,))
        props_via_project = cur.fetchall()
    else:
        props_via_project = []

    # Orphan properties whose Builder_Name matches a removed builder
    if remove_builder_ids:
        cur.execute("""
            SELECT p.id, p."Property_Name", p."Builder_Name"
            FROM property p
            JOIN builder b ON LOWER(TRIM(p."Builder_Name")) = LOWER(TRIM(b.company_name))
            WHERE p.project_id IS NULL AND b.id = ANY(%s)
            ORDER BY p.id
        """, (remove_builder_ids,))
        props_orphan = cur.fetchall()
    else:
        props_orphan = []

    remove_property_ids = (
        [r[0] for r in props_via_project] +
        [r[0] for r in props_orphan]
    )

    print(f"Properties to REMOVE ({len(remove_property_ids)}):")
    for pid, pname in props_via_project:
        print(f"  id={pid}  {pname!r}  (via project)")
    for pid, pname, bname in props_orphan:
        print(f"  id={pid}  {pname!r}  (orphan, builder={bname!r})")
    print()

    # ── Count dependent rows ──────────────────────────────────────────────────
    def _count(table, col, ids):
        if not ids:
            return 0
        cur.execute(f"SELECT COUNT(*) FROM {table} WHERE {col} = ANY(%s)", (ids,))
        row = cur.fetchone()
        return row[0] if row else 0

    def _count_media(entity_type, ids):
        if not ids:
            return 0
        cur.execute("""
            SELECT COUNT(*) FROM media
            WHERE entity_type = %s AND entity_id = ANY(%s)
        """, (entity_type, [str(i) for i in ids]))
        row = cur.fetchone()
        return row[0] if row else 0

    def _count_slug(target_type, ids):
        if not ids:
            return 0
        cur.execute("""
            SELECT COUNT(*) FROM slug
            WHERE target_type = %s AND target_id = ANY(%s)
        """, (target_type, ids))
        row = cur.fetchone()
        return row[0] if row else 0

    urd_count = 0
    if remove_project_ids:
        cur.execute("""
            SELECT COUNT(*) FROM unit_room_detail
            WHERE unit_config_id IN (
                SELECT id FROM unit_config WHERE project_id = ANY(%s)
            )
        """, (remove_project_ids,))
        row = cur.fetchone()
        urd_count = row[0] if row else 0

    print("Dependent rows to DELETE:")
    counts = {
        'user_interaction':   _count('user_interaction',  'property_id', remove_property_ids),
        'favorite':           _count('favorite',          'property_id', remove_property_ids),
        'review':             _count('review',            'property_id', remove_property_ids),
        'enquiry':            _count('enquiry',           'property_id', remove_property_ids),
        'property_poi_cache': _count('property_poi_cache','property_id', remove_property_ids),
        'media(property)':    _count_media('property', remove_property_ids),
        'slug(property)':     _count_slug('property', remove_property_ids),
        'property':           len(remove_property_ids),
        'unit_room_detail':   urd_count,
        'unit_config':        _count('unit_config',     'project_id', remove_project_ids),
        'project_amenity':    _count('project_amenity', 'project_id', remove_project_ids),
        'media(project)':     _count_media('project', remove_project_ids),
        'slug(project)':      _count_slug('project', remove_project_ids),
        'builder_project':    len(remove_project_ids),
        'media(builder)':     _count_media('builder', remove_builder_ids),
        'builder':            len(remove_builder_ids),
    }
    for k, v in counts.items():
        print(f"  {k:<25} {v}")
    print(f"\n  TOTAL  {sum(counts.values())} rows")
    print()

    if not args.execute:
        print("DRY RUN complete — no changes made.")
        print("Re-run with --execute to apply deletions.")
        sys.exit(0)

    # ── Confirm ───────────────────────────────────────────────────────────────
    print("WARNING: This permanently deletes the rows above from DATABASE_URL_CHILD.")
    confirm = input("Type 'yes' to proceed: ").strip().lower()
    if confirm != 'yes':
        print("Aborted.")
        sys.exit(0)

    # ── Delete in FK-safe order ───────────────────────────────────────────────
    def _delete(table, col, ids, label=None):
        if not ids:
            return
        cur.execute(f"DELETE FROM {table} WHERE {col} = ANY(%s)", (ids,))
        print(f"  Deleted {cur.rowcount:4d} rows from {label or table}")

    def _delete_media(entity_type, ids):
        if not ids:
            return
        cur.execute("""
            DELETE FROM media WHERE entity_type = %s AND entity_id = ANY(%s)
        """, (entity_type, [str(i) for i in ids]))
        print(f"  Deleted {cur.rowcount:4d} rows from media({entity_type})")

    def _delete_slug(target_type, ids):
        if not ids:
            return
        cur.execute("""
            DELETE FROM slug WHERE target_type = %s AND target_id = ANY(%s)
        """, (target_type, ids))
        print(f"  Deleted {cur.rowcount:4d} rows from slug({target_type})")

    print("\nDeleting...")

    _delete('user_interaction',  'property_id', remove_property_ids)
    _delete('favorite',          'property_id', remove_property_ids)
    _delete('review',            'property_id', remove_property_ids)
    _delete('enquiry',           'property_id', remove_property_ids)
    _delete('property_poi_cache','property_id', remove_property_ids)
    _delete_media('property', remove_property_ids)
    _delete_slug('property', remove_property_ids)
    _delete('property', 'id', remove_property_ids)

    if remove_project_ids:
        cur.execute("""
            DELETE FROM unit_room_detail
            WHERE unit_config_id IN (
                SELECT id FROM unit_config WHERE project_id = ANY(%s)
            )
        """, (remove_project_ids,))
        print(f"  Deleted {cur.rowcount:4d} rows from unit_room_detail")

    _delete('unit_config',     'project_id', remove_project_ids)
    _delete('project_amenity', 'project_id', remove_project_ids)
    _delete_media('project', remove_project_ids)
    _delete_slug('project', remove_project_ids)
    _delete('builder_project', 'id', remove_project_ids)

    # Reassign protected projects away from removed builders before deleting builders.
    # Aurum Islands (41) and The Trellis (42) belong to Aurum Ventures (id=12).
    if PROTECT_PROJECT_IDS and remove_builder_ids:
        cur.execute("""
            UPDATE builder_project
            SET builder_id = 12
            WHERE id = ANY(%s) AND builder_id = ANY(%s)
        """, (PROTECT_PROJECT_IDS, remove_builder_ids))
        if cur.rowcount:
            print(f"  Reassigned {cur.rowcount} protected project(s) to builder id=12 (Aurum Ventures)")

    _delete_media('builder', remove_builder_ids)
    _delete('builder', 'id', remove_builder_ids)

    conn.commit()
    print("\nDone.")

except Exception as e:
    conn.rollback()
    print(f"\nERROR — rolled back: {e}")
    import traceback; traceback.print_exc()
    sys.exit(1)
finally:
    cur.close()
    conn.close()
