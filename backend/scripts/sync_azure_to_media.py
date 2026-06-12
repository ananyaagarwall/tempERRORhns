"""
Sync Azure Blob Storage → child Neon DB media table (bi-directional).

  ADD   : blobs present in Azure but missing from media table → inserted
  REMOVE: media rows whose blob no longer exists in Azure     → deleted

Also backfills entity fields after every sync:
  builder.builder_logo / cover_banner
  builder_project.project_image / image_urls / floor_plans
  blog.featured_image

Supported blob path formats:
  projects/{id}/cover/hero.jpg
  projects/{id}/gallery/img1.jpg
  projects/{id}/floor_plans/2bhk.jpg
  projects/{id}/plans/3bhk.jpg
  builders/{id}/logo/logo.jpg          ← id is builder.id (integer)
  builders/{name-slug}/logo/logo.jpg   ← name slug also accepted
  builders/{id}/banner/banner.jpg
  builders/{id}/cover/cover.jpg
  builders/{id}/gallery/img1.jpg
  builders/{id}/certificates/cert.jpg
  blogs/{id}/featured/hero.jpg
  blogs/{id}/gallery/img1.jpg

Usage:
    cd backend
    python scripts/sync_azure_to_media.py
    python scripts/sync_azure_to_media.py --dry-run
    python scripts/sync_azure_to_media.py --no-backfill
    python scripts/sync_azure_to_media.py --no-delete
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
DB_URL    = os.getenv('DATABASE_URL_CHILD', '')

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
    'image': 'gallery',      'images': 'gallery',
    'gallery': 'gallery',    'photos': 'gallery',
    'floor': 'floor_plan',   'floor-plans': 'floor_plan',
    'floor_plans': 'floor_plan', 'floorplans': 'floor_plan', 'plans': 'floor_plan',
}
_BLOG_FOLDER_MAP = {
    'featured': 'featured_image', 'cover': 'featured_image',
    'gallery': 'gallery',         'images': 'gallery',
}


def _slugify(s):
    s = s.lower().strip()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def _blob_url(name):
    return f"https://{ACCOUNT}.blob.core.windows.net/{CONTAINER}/{name}"


def _make_engine(url):
    if not url:
        print("ERROR: DATABASE_URL_CHILD not set in .env")
        sys.exit(1)
    try:
        engine = create_engine(url, pool_pre_ping=True, pool_size=2, max_overflow=0)
        with engine.connect() as c:
            c.execute(text("SELECT 1"))
        print("  [child DB] connected OK")
        return engine
    except Exception as e:
        print(f"  [child DB] UNREACHABLE — {e}")
        sys.exit(1)


# ── Entity lookups — keyed by integer builder.id (as string) ──────────────────
def _load_lookups(engine):
    """
    Returns:
      builders_map : slug/id-string → str(builder.id)
      projects_map : slug/id-string → str(project.id)
      blogs_map    : slug/id-string → str(blog.id)
    """
    builders, projects, blogs = {}, {}, {}
    with engine.connect() as c:
        # builder: id is the PK, no rera_id column
        for row in c.execute(text("SELECT id, company_name, brand_name FROM builder")):
            bid, company, brand = row
            sid = str(bid)
            builders[sid] = sid                          # numeric id string
            if company:
                builders[_slugify(company)] = sid
            if brand:
                builders[_slugify(brand)] = sid

        for row in c.execute(text("SELECT id, title, primary_slug FROM builder_project")):
            pid, title, slug = row
            sid = str(pid)
            projects[sid] = sid
            if title:
                projects[_slugify(title)] = sid
            if slug:
                projects[_slugify(slug)] = sid

        try:
            for row in c.execute(text("SELECT id, slug FROM blog")):
                bid, slug = row
                sid = str(bid)
                blogs[sid] = sid
                if slug:
                    blogs[_slugify(slug)] = sid
        except Exception:
            pass  # blog table may not exist in child DB yet

    return builders, projects, blogs


# ── Path parser ────────────────────────────────────────────────────────────────
def _parse_path(name, builders, projects, blogs):
    """Return (entity_type, entity_id_str, media_type) or None."""
    parts = name.strip('/').split('/')
    if len(parts) < 3:
        return None
    top = parts[0].lower()

    if top in ('builders', 'builder'):
        raw = parts[1]
        bid = builders.get(raw) or builders.get(_slugify(raw))
        if not bid:
            return None
        folder = parts[2].lower()
        return ('builder', bid, _BUILDER_FOLDER_MAP.get(folder, 'gallery'))

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


# ── Backfill entity fields ─────────────────────────────────────────────────────
def _backfill(engine):
    print("\n  Backfilling entity fields …")
    changed = 0
    with engine.begin() as c:
        # builder_logo — use integer id
        for row in c.execute(text("""
            SELECT DISTINCT ON (entity_id) entity_id, blob_url
            FROM media
            WHERE entity_type='builder' AND media_type='logo' AND is_featured=true
            ORDER BY entity_id, display_order
        """)):
            c.execute(text("UPDATE builder SET builder_logo=:url WHERE id=:bid"),
                      dict(url=row[1], bid=int(row[0])))
            changed += 1

        # cover_banner
        for row in c.execute(text("""
            SELECT DISTINCT ON (entity_id) entity_id, blob_url
            FROM media
            WHERE entity_type='builder' AND media_type='cover' AND is_featured=true
            ORDER BY entity_id, display_order
        """)):
            c.execute(text("UPDATE builder SET cover_banner=:url WHERE id=:bid"),
                      dict(url=row[1], bid=int(row[0])))
            changed += 1

        # builder: NULL out fields where no media rows remain
        for row in c.execute(text("""
            SELECT b.id FROM builder b
            WHERE b.builder_logo IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM media m
                WHERE m.entity_type='builder' AND m.entity_id=b.id::text
                  AND m.media_type='logo'
              )
        """)):
            c.execute(text("UPDATE builder SET builder_logo=NULL WHERE id=:bid"),
                      dict(bid=row[0]))
            changed += 1

        for row in c.execute(text("""
            SELECT b.id FROM builder b
            WHERE b.cover_banner IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM media m
                WHERE m.entity_type='builder' AND m.entity_id=b.id::text
                  AND m.media_type='cover'
              )
        """)):
            c.execute(text("UPDATE builder SET cover_banner=NULL WHERE id=:bid"),
                      dict(bid=row[0]))
            changed += 1

        # project_image (cover)
        for row in c.execute(text("""
            SELECT DISTINCT ON (entity_id) entity_id, blob_url
            FROM media
            WHERE entity_type='project' AND media_type='cover' AND is_featured=true
            ORDER BY entity_id, display_order
        """)):
            c.execute(text("UPDATE builder_project SET project_image=:url WHERE id=:pid"),
                      dict(url=row[1], pid=int(row[0])))
            changed += 1

        # NULL out project_image where no cover media remains
        for row in c.execute(text("""
            SELECT bp.id FROM builder_project bp
            WHERE bp.project_image IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM media m
                WHERE m.entity_type='project' AND m.entity_id=bp.id::text
                  AND m.media_type='cover'
              )
        """)):
            c.execute(text("UPDATE builder_project SET project_image=NULL WHERE id=:pid"),
                      dict(pid=row[0]))
            changed += 1

        # image_urls (gallery JSON array)
        for row in c.execute(text("""
            SELECT entity_id, json_agg(blob_url ORDER BY display_order) AS urls
            FROM media
            WHERE entity_type='project' AND media_type='gallery'
            GROUP BY entity_id
        """)):
            c.execute(text("UPDATE builder_project SET image_urls=:urls WHERE id=:pid"),
                      dict(urls=json.dumps(row[1]), pid=int(row[0])))
            changed += 1

        # NULL out image_urls where no gallery media remains
        for row in c.execute(text("""
            SELECT bp.id FROM builder_project bp
            WHERE bp.image_urls IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM media m
                WHERE m.entity_type='project' AND m.entity_id=bp.id::text
                  AND m.media_type='gallery'
              )
        """)):
            c.execute(text("UPDATE builder_project SET image_urls=NULL WHERE id=:pid"),
                      dict(pid=row[0]))
            changed += 1

        # floor_plans (JSON array)
        for row in c.execute(text("""
            SELECT entity_id, json_agg(blob_url ORDER BY display_order) AS urls
            FROM media
            WHERE entity_type='project' AND media_type='floor_plan'
            GROUP BY entity_id
        """)):
            c.execute(text("UPDATE builder_project SET floor_plans=:urls WHERE id=:pid"),
                      dict(urls=json.dumps(row[1]), pid=int(row[0])))
            changed += 1

        # NULL out floor_plans where no floor_plan media remains
        for row in c.execute(text("""
            SELECT bp.id FROM builder_project bp
            WHERE bp.floor_plans IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM media m
                WHERE m.entity_type='project' AND m.entity_id=bp.id::text
                  AND m.media_type='floor_plan'
              )
        """)):
            c.execute(text("UPDATE builder_project SET floor_plans=NULL WHERE id=:pid"),
                      dict(pid=row[0]))
            changed += 1

        # blog featured_image
        try:
            for row in c.execute(text("""
                SELECT DISTINCT ON (entity_id) entity_id, blob_url
                FROM media
                WHERE entity_type='blog' AND media_type='featured_image' AND is_featured=true
                ORDER BY entity_id, display_order
            """)):
                c.execute(text("UPDATE blog SET featured_image=:url WHERE id=:bid"),
                          dict(url=row[1], bid=int(row[0])))
                changed += 1
        except Exception:
            pass

    print(f"  Backfilled/nulled {changed} field(s).")


# ── Main ───────────────────────────────────────────────────────────────────────
def main(dry_run=False, backfill=True, do_delete=True, assignments_file=''):
    if not CONN_STR:
        print("ERROR: AZURE_STORAGE_CONNECTION_STRING not set in .env")
        sys.exit(1)

    manual = {}
    if assignments_file and os.path.isfile(assignments_file):
        with open(assignments_file, encoding='utf-8') as f:
            manual = json.load(f)
        print(f"Loaded {len(manual)} manual assignment(s) from {assignments_file}\n")

    print("\n── Connecting to child DB ────────────────────")
    engine = _make_engine(DB_URL)

    print("\n── Loading entity lookups ────────────────────")
    builders, projects, blogs = _load_lookups(engine)
    print(f"  builders={len(set(builders.values()))}  "
          f"projects={len(set(projects.values()))}  "
          f"blogs={len(set(blogs.values()))}")

    # Current media rows in DB
    with engine.connect() as c:
        rows = c.execute(text("SELECT blob_url FROM media"))
        db_urls = {r[0] for r in rows}
    print(f"  {len(db_urls)} existing media record(s) in DB")

    # List all blobs in Azure
    print(f"\n── Scanning Azure container '{CONTAINER}' ─────")
    svc = BlobServiceClient.from_connection_string(CONN_STR)
    blobs = list(svc.get_container_client(CONTAINER).list_blobs())
    azure_urls = {_blob_url(b.name) for b in blobs}
    print(f"  Found {len(blobs)} blob(s) in Azure")

    # ── DELETIONS: media rows whose blob no longer exists in Azure ─────────────
    stale_urls = db_urls - azure_urls
    print(f"\n── Deletions: {len(stale_urls)} stale media row(s) to remove ──")
    if stale_urls and not dry_run and do_delete:
        with engine.begin() as c:
            for url in stale_urls:
                c.execute(text("DELETE FROM media WHERE blob_url=:url"), dict(url=url))
                print(f"  [DEL] {url}")
        print(f"  Deleted {len(stale_urls)} stale record(s).")
    elif stale_urls and dry_run:
        for url in stale_urls:
            print(f"  [DRY-DEL] {url}")
    elif not stale_urls:
        print("  Nothing to delete.")

    # ── INSERTIONS: blobs not yet in media table ───────────────────────────────
    to_insert = []
    unmatched = []
    _feat_seen = set()

    for blob in blobs:
        name = blob.name
        url  = _blob_url(name)

        if url in db_urls:
            continue  # already present, skip

        parsed = _parse_path(name, builders, projects, blogs)

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
            entity_id=entity_id,
            blob_url=url,
            media_type=mt,
            is_featured=is_feat,
            original_filename=os.path.basename(name),
        ))

    print(f"\n── Insertions: {len(to_insert)} new blob(s) to add ──")
    if unmatched:
        print(f"  Unmatched (no entity found): {len(unmatched)}")
        for n in unmatched:
            print(f"    {n}")

    if dry_run:
        print("\n[DRY-RUN] Would insert:")
        for r in to_insert:
            print(f"  {r['entity_type']}[{r['entity_id']}] {r['media_type']} feat={r['is_featured']}  {r['blob_url']}")
    elif to_insert:
        with engine.begin() as c:
            for r in to_insert:
                existing_count = c.execute(text("""
                    SELECT COUNT(*) FROM media
                    WHERE entity_type=:et AND entity_id=:eid AND media_type=:mt
                """), dict(et=r['entity_type'], eid=r['entity_id'], mt=r['media_type'])).scalar()

                c.execute(text("""
                    INSERT INTO media
                      (entity_type, entity_id, blob_url, media_type,
                       is_featured, display_order, original_filename, created_at, updated_at)
                    VALUES
                      (:et, :eid, :url, :mt,
                       :feat, :ord, :fname, :now, :now)
                    ON CONFLICT DO NOTHING
                """), dict(
                    et=r['entity_type'], eid=r['entity_id'], url=r['blob_url'], mt=r['media_type'],
                    feat=r['is_featured'], ord=existing_count,
                    fname=r['original_filename'], now=datetime.now(timezone.utc),
                ))
                print(f"  [ADD] {r['entity_type']}[{r['entity_id']}] {r['media_type']} feat={r['is_featured']}")
        print(f"  Inserted {len(to_insert)} record(s).")
    else:
        print("  Nothing to insert.")

    # ── Backfill entity fields ─────────────────────────────────────────────────
    if backfill and not dry_run and (to_insert or stale_urls):
        _backfill(engine)
    elif backfill and not dry_run:
        print("\n  No changes — skipping backfill.")

    print("\n── Done ──────────────────────────────────────")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Sync Azure blobs ↔ child DB media table (add + remove)'
    )
    parser.add_argument('--dry-run',      action='store_true', help='Preview only, no DB writes')
    parser.add_argument('--no-backfill',  action='store_true', help='Skip entity field backfill')
    parser.add_argument('--no-delete',    action='store_true', help='Skip deletion of stale rows')
    parser.add_argument('--assignments',  default='',          help='Path to blob_assignments.json')
    args = parser.parse_args()
    main(
        dry_run=args.dry_run,
        backfill=not args.no_backfill,
        do_delete=not args.no_delete,
        assignments_file=args.assignments,
    )
