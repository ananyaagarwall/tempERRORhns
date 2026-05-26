"""
Scan Azure Blob Storage and insert NEW images into BOTH Neon and local
PostgreSQL media tables. Safe to run repeatedly — skips blobs already
present in each DB independently.

Supported blob path formats:
  projects/{id}/cover/hero.jpg
  projects/{id}/gallery/img1.jpg
  projects/{id}/floor_plans/2bhk.jpg
  projects/{id}/plans/3bhk.jpg
  builders/{rera_id}/logo/logo.jpg
  builders/{rera_id}/banner/banner.jpg
  builders/{rera_id}/cover/cover.jpg
  builders/{rera_id}/gallery/img1.jpg
  builders/{rera_id}/certificates/cert.jpg
  blogs/{id}/featured/hero.jpg
  blogs/{id}/gallery/img1.jpg

Usage:
    cd backend
    python scripts/sync_azure_to_media.py
    python scripts/sync_azure_to_media.py --dry-run
    python scripts/sync_azure_to_media.py --no-backfill
"""

import os
import sys
import re
import json
import argparse
from datetime import datetime, timezone

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, BACKEND_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(BACKEND_DIR, '.env'))

from azure.storage.blob import BlobServiceClient
from sqlalchemy import create_engine, text

# ── Config ─────────────────────────────────────────────────────────────────────
CONN_STR  = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
CONTAINER = os.getenv('AZURE_STORAGE_CONTAINER', 'hns-media')
ACCOUNT   = 'hnsblob001'
NEON_URL  = os.getenv('DATABASE_URL', '')
LOCAL_URL = os.getenv('DATABASE_URL_FALLBACK', '')

# ── Folder → media_type maps ───────────────────────────────────────────────────
_BUILDER_FOLDER_MAP = {
    'logo': 'logo',         'logos': 'logo',
    'banner': 'cover',      'banners': 'cover',
    'cover': 'cover',       'covers': 'cover',
    'cert': 'certificate',  'certs': 'certificate',  'certificates': 'certificate',
    'gallery': 'gallery',   'images': 'gallery',     'photos': 'gallery',
}
_PROJECT_FOLDER_MAP = {
    'cover': 'cover',
    'image': 'gallery',     'images': 'gallery',
    'gallery': 'gallery',   'photos': 'gallery',
    'floor': 'floor_plan',  'floor-plans': 'floor_plan',
    'floor_plans': 'floor_plan', 'floorplans': 'floor_plan', 'plans': 'floor_plan',
}
_BLOG_FOLDER_MAP = {
    'featured': 'featured_image', 'cover': 'featured_image',
    'gallery': 'gallery',         'images': 'gallery',
}

# ── Helpers ────────────────────────────────────────────────────────────────────
def _slugify(text):
    s = text.lower().strip()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

def _blob_url(name):
    return f"https://{ACCOUNT}.blob.core.windows.net/{CONTAINER}/{name}"

def _make_engine(url, label):
    if not url:
        return None
    try:
        engine = create_engine(url, pool_pre_ping=True, pool_size=2, max_overflow=0)
        with engine.connect() as c:
            c.execute(text("SELECT 1"))
        print(f"  [{label}] connected OK")
        return engine
    except Exception as e:
        print(f"  [{label}] UNREACHABLE — {e}")
        return None

# ── Entity lookups ─────────────────────────────────────────────────────────────
def _load_lookups(engine):
    """Return (builders_map, projects_map, blogs_map) from the given DB."""
    builders, projects, blogs = {}, {}, {}
    with engine.connect() as c:
        for row in c.execute(text("SELECT rera_id, company_name, brand_name FROM builder")):
            rera_id, company, brand = row
            builders[rera_id.lower()] = rera_id
            if company:
                builders[_slugify(company)] = rera_id
            if brand:
                builders[_slugify(brand)] = rera_id

        for row in c.execute(text("SELECT id, title, primary_slug FROM builder_project")):
            pid, title, slug = row
            projects[str(pid)] = str(pid)
            if title:
                projects[_slugify(title)] = str(pid)
            if slug:
                projects[_slugify(slug)] = str(pid)

        for row in c.execute(text("SELECT id, slug FROM blog")):
            bid, slug = row
            blogs[str(bid)] = str(bid)
            if slug:
                blogs[_slugify(slug)] = str(bid)

    return builders, projects, blogs

# ── Path parser ────────────────────────────────────────────────────────────────
def _parse_path(name, builders, projects, blogs):
    """Return (entity_type, entity_id, media_type) or None."""
    parts = name.strip('/').split('/')
    if len(parts) < 3:
        return None
    top = parts[0].lower()

    if top in ('builders', 'builder'):
        raw = parts[1]
        rera = builders.get(raw.lower()) or builders.get(_slugify(raw))
        if not rera:
            return None
        folder = parts[2].lower()
        return ('builder', rera, _BUILDER_FOLDER_MAP.get(folder, 'gallery'))

    if top in ('projects', 'project'):
        raw = parts[1]
        pid = projects.get(raw) or projects.get(_slugify(raw))
        if not pid:
            return None
        folder = parts[2].lower()
        return ('project', pid, _PROJECT_FOLDER_MAP.get(folder, 'gallery'))

    if top in ('blogs', 'blog'):
        raw = parts[1]
        bid = blogs.get(raw) or blogs.get(_slugify(raw))
        if not bid:
            return None
        folder = parts[2].lower()
        return ('blog', bid, _BLOG_FOLDER_MAP.get(folder, 'gallery'))

    return None

# ── Already-in-DB check ────────────────────────────────────────────────────────
def _existing_urls(engine):
    """Return a set of blob_urls already in the media table."""
    with engine.connect() as c:
        rows = c.execute(text("SELECT blob_url FROM media"))
        return {r[0] for r in rows}

# ── Insert ─────────────────────────────────────────────────────────────────────
def _insert_record(conn, entity_type, entity_id, blob_url, media_type,
                   is_featured, display_order, original_filename):
    conn.execute(text("""
        INSERT INTO media
          (entity_type, entity_id, blob_url, media_type,
           is_featured, display_order, original_filename, created_at, updated_at)
        VALUES
          (:et, :eid, :url, :mt,
           :feat, :ord, :fname, :now, :now)
        ON CONFLICT DO NOTHING
    """), dict(
        et=entity_type, eid=str(entity_id), url=blob_url, mt=media_type,
        feat=is_featured, ord=display_order,
        fname=original_filename, now=datetime.now(timezone.utc),
    ))

# ── Backfill entity fields ─────────────────────────────────────────────────────
def _backfill(engine, label):
    print(f"\n  [{label}] Back-filling entity fields …")
    changed = 0
    with engine.begin() as c:
        # builder_logo
        for row in c.execute(text("""
            SELECT DISTINCT ON (entity_id) entity_id, blob_url
            FROM media WHERE entity_type='builder' AND media_type='logo' AND is_featured=true
            ORDER BY entity_id, display_order
        """)):
            c.execute(text("UPDATE builder SET builder_logo=:url WHERE rera_id=:rid"),
                      dict(url=row[1], rid=row[0]))
            changed += 1

        # cover_banner
        for row in c.execute(text("""
            SELECT DISTINCT ON (entity_id) entity_id, blob_url
            FROM media WHERE entity_type='builder' AND media_type='cover' AND is_featured=true
            ORDER BY entity_id, display_order
        """)):
            c.execute(text("UPDATE builder SET cover_banner=:url WHERE rera_id=:rid"),
                      dict(url=row[1], rid=row[0]))
            changed += 1

        # project_image (cover)
        for row in c.execute(text("""
            SELECT DISTINCT ON (entity_id) entity_id, blob_url
            FROM media WHERE entity_type='project' AND media_type='cover' AND is_featured=true
            ORDER BY entity_id, display_order
        """)):
            c.execute(text("UPDATE builder_project SET project_image=:url WHERE id=:pid"),
                      dict(url=row[1], pid=int(row[0])))
            changed += 1

        # image_urls (gallery JSON array)
        for row in c.execute(text("""
            SELECT entity_id, json_agg(blob_url ORDER BY display_order) AS urls
            FROM media WHERE entity_type='project' AND media_type='gallery'
            GROUP BY entity_id
        """)):
            c.execute(text("UPDATE builder_project SET image_urls=:urls WHERE id=:pid"),
                      dict(urls=json.dumps(row[1]), pid=int(row[0])))
            changed += 1

        # floor_plans (JSON array)
        for row in c.execute(text("""
            SELECT entity_id, json_agg(blob_url ORDER BY display_order) AS urls
            FROM media WHERE entity_type='project' AND media_type='floor_plan'
            GROUP BY entity_id
        """)):
            c.execute(text("UPDATE builder_project SET floor_plans=:urls WHERE id=:pid"),
                      dict(urls=json.dumps(row[1]), pid=int(row[0])))
            changed += 1

        # blog featured_image
        for row in c.execute(text("""
            SELECT DISTINCT ON (entity_id) entity_id, blob_url
            FROM media WHERE entity_type='blog' AND media_type='featured_image' AND is_featured=true
            ORDER BY entity_id, display_order
        """)):
            c.execute(text("UPDATE blog SET featured_image=:url WHERE id=:bid"),
                      dict(url=row[1], bid=int(row[0])))
            changed += 1

    print(f"  [{label}] Back-filled {changed} field(s).")

# ── Main ───────────────────────────────────────────────────────────────────────
def main(dry_run=False, backfill=True, assignments_file=''):
    if not CONN_STR:
        print("ERROR: AZURE_STORAGE_CONNECTION_STRING not set in .env")
        sys.exit(1)

    # Load manual assignments for flat blobs
    manual = {}
    if assignments_file and os.path.isfile(assignments_file):
        with open(assignments_file, encoding='utf-8') as f:
            manual = json.load(f)
        print(f"Loaded {len(manual)} manual assignment(s) from {assignments_file}\n")

    print("\n── Connecting to databases ───────────────────")
    neon_engine  = _make_engine(NEON_URL,  'Neon')
    local_engine = _make_engine(LOCAL_URL, 'Local')

    engines = [(e, lbl) for e, lbl in [(neon_engine, 'Neon'), (local_engine, 'Local')] if e]
    if not engines:
        print("ERROR: No database reachable.")
        sys.exit(1)

    # Load entity lookups from first available DB
    primary_engine = engines[0][0]
    print("\n── Loading entity lookups ────────────────────")
    builders, projects, blogs = _load_lookups(primary_engine)
    print(f"  builders={len(builders)//2}  projects={len(projects)//3 or len(projects)}  blogs={len(blogs)//2 or len(blogs)}")

    # Get existing blob_urls per DB so we skip what's already there
    existing = {lbl: _existing_urls(e) for e, lbl in engines}
    for lbl, urls in existing.items():
        print(f"  [{lbl}] {len(urls)} existing media record(s)")

    # List all Azure blobs
    print(f"\n── Scanning Azure container '{CONTAINER}' ─────")
    svc = BlobServiceClient.from_connection_string(CONN_STR)
    blobs = list(svc.get_container_client(CONTAINER).list_blobs())
    print(f"  Found {len(blobs)} blob(s)\n")

    # Parse and categorise
    to_insert   = []   # list of dicts for new records
    unmatched   = []
    _feat_seen  = set()

    for blob in blobs:
        name = blob.name
        url  = _blob_url(name)
        parsed = _parse_path(name, builders, projects, blogs)

        # Fall back to manual assignments for flat blobs
        if parsed is None and name in manual:
            entry = manual[name]
            if entry == 'skip':
                continue
            et  = entry.get('entity_type')
            eid = entry.get('entity_id')
            mt  = entry.get('media_type', 'gallery')
            if et and eid:
                parsed = (et, str(eid), mt)

        if parsed is None:
            unmatched.append(name)
            continue

        entity_type, entity_id, mt = parsed
        feat_key = (entity_type, entity_id, mt)
        is_feat  = mt in ('logo', 'cover', 'featured_image') and feat_key not in _feat_seen
        if is_feat:
            _feat_seen.add(feat_key)

        to_insert.append(dict(
            entity_type=entity_type,
            entity_id=str(entity_id),
            blob_url=url,
            media_type=mt,
            is_featured=is_feat,
            original_filename=os.path.basename(name),
        ))

    print(f"  Matched   : {len(to_insert)}")
    print(f"  Unmatched : {len(unmatched)}")
    if unmatched:
        print("  Unmatched blobs (no entity found in DB):")
        for n in unmatched:
            print(f"    {n}")

    if dry_run:
        print("\n[DRY-RUN] Would insert:")
        for r in to_insert:
            print(f"  {r['entity_type']}[{r['entity_id']}] {r['media_type']} feat={r['is_featured']}  {r['blob_url']}")
        return

    # Insert into each DB — only rows not already present
    print()
    for engine, label in engines:
        already = existing[label]
        new_rows = [r for r in to_insert if r['blob_url'] not in already]
        print(f"── [{label}] inserting {len(new_rows)} new record(s) ──")

        if not new_rows:
            print(f"  [{label}] Nothing new to insert.")
            continue

        with engine.begin() as conn:
            for r in new_rows:
                # compute display_order = count of same entity+media_type already in DB
                existing_count = conn.execute(text("""
                    SELECT COUNT(*) FROM media
                    WHERE entity_type=:et AND entity_id=:eid AND media_type=:mt
                """), dict(et=r['entity_type'], eid=r['entity_id'], mt=r['media_type'])).scalar()

                _insert_record(
                    conn,
                    r['entity_type'], r['entity_id'], r['blob_url'], r['media_type'],
                    r['is_featured'], existing_count, r['original_filename'],
                )
                print(f"  [OK] {r['entity_type']}[{r['entity_id']}] {r['media_type']} feat={r['is_featured']}")

        print(f"  [{label}] committed {len(new_rows)} record(s).")

    # Backfill entity fields (builder_logo, project_image, image_urls, floor_plans)
    if backfill:
        for engine, label in engines:
            _backfill(engine, label)

    print("\n── Done ──────────────────────────────────────")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Sync Azure blobs → media table (both DBs)')
    parser.add_argument('--dry-run',     action='store_true', help='Preview only, no DB writes')
    parser.add_argument('--no-backfill',  action='store_true', help='Skip updating entity fields after insert')
    parser.add_argument('--assignments',  default='', help='Path to blob_assignments.json for flat blobs')
    args = parser.parse_args()
    main(dry_run=args.dry_run, backfill=not args.no_backfill, assignments_file=args.assignments)
