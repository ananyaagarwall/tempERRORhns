"""
Pull every blob from the Azure container into the media table.

Handles both:
  A) App-convention paths  builders/{rera_id}/logo/...
                           projects/{id}/images/...
  B) Manually-organised paths  builders/HiranandaniGroup/logo.jpg
                               (matched by fuzzy company-name slug)
  C) Flat-file blobs mapped via --assignments JSON file

Usage:
    cd backend
    python scripts/import_from_azure.py [--dry-run] [--prefix builders/]
    python scripts/import_from_azure.py --backfill
    python scripts/import_from_azure.py --list-entities
    python scripts/import_from_azure.py --assignments scripts/blob_assignments.json --backfill

--dry-run       : print what WOULD be inserted, touch nothing
--prefix X      : only scan blobs whose name starts with X
--backfill      : after import, update entity fields (builder_logo, project_image …)
                  from the featured Media record so existing API responses keep working
--list-entities : print all builder RERA IDs and project IDs from DB then exit
--assignments F : path to a JSON file that manually maps flat blob names to entities
                  Format: {"blob_name.jpg": {"entity_type": "builder",
                                             "entity_id": "RERA123",
                                             "media_type": "logo"},
                           "skip_me.svg": "skip"}
"""

import os
import sys
import argparse
import re
import json

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, BACKEND_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(BACKEND_DIR, '.env'))

# ── imports that trigger app startup (creates media table if missing) ──────────
from app import app, db
from models import Builder, BuilderProject, Blog, Property, Media
import media_service
import storage

# ── Azure client ───────────────────────────────────────────────────────────────
from azure.storage.blob import BlobServiceClient

CONN_STR  = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
CONTAINER = os.getenv('AZURE_STORAGE_CONTAINER', 'hns-media')
ACCOUNT   = 'hnsblob001'  # derived from connection string

def _blob_url(blob_name: str) -> str:
    return f"https://{ACCOUNT}.blob.core.windows.net/{CONTAINER}/{blob_name}"


# ── path → (entity_type, entity_id, media_type) ────────────────────────────────
_BUILDER_FOLDER_MAP = {
    'logo':         'logo',
    'logos':        'logo',
    'banner':       'cover',
    'banners':      'cover',
    'cover':        'cover',
    'covers':       'cover',
    'cert':         'certificate',
    'certs':        'certificate',
    'certificates': 'certificate',
    'gallery':      'gallery',
    'images':       'gallery',
    'photos':       'gallery',
}
_PROJECT_FOLDER_MAP = {
    'cover':       'cover',
    'image':       'gallery',
    'images':      'gallery',
    'gallery':     'gallery',
    'photos':      'gallery',
    'floor':       'floor_plan',
    'floor-plans': 'floor_plan',
    'floor_plans': 'floor_plan',
    'floorplans':  'floor_plan',
    'plans':       'floor_plan',
}

# Cached lookup tables (populated inside app_context)
_builder_by_id   = {}   # id.lower() → id
_builder_by_slug   = {}   # slug            → id
_project_by_id     = {}   # str(id)         → id
_blog_by_slug      = {}   # slug            → id


def _slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')


def _load_lookups():
    for b in Builder.query.all():
        _builder_by_id[str(b.id).lower()] = str(b.id)
        _builder_by_slug[_slugify(b.company_name or '')] = str(b.id)
        if b.brand_name:
            _builder_by_slug[_slugify(b.brand_name)] = str(b.id)
    for p in BuilderProject.query.all():
        _project_by_id[str(p.id)] = str(p.id)
        if p.primary_slug:
            _project_by_id[_slugify(p.primary_slug)] = str(p.id)
        if p.title:
            _project_by_id[_slugify(p.title)] = str(p.id)
    for blog in Blog.query.all():
        _blog_by_slug[str(blog.id)] = str(blog.id)
        if blog.slug:
            _blog_by_slug[_slugify(blog.slug)] = blog.id


def _parse(blob_name: str):
    """
    Return (entity_type, entity_id, media_type) or None.
    entity_id is always a string here.
    """
    parts = blob_name.strip('/').split('/')
    if not parts:
        return None
    top = parts[0].lower()

    # ── builders/ ──────────────────────────────────────────────────────────────
    if top in ('builders', 'builder') and len(parts) >= 2:
        raw_id = parts[1]
        id = (_builder_by_id.get(raw_id.lower())
                   or _builder_by_slug.get(_slugify(raw_id)))
        if not id:
            return None
        folder = parts[2].lower() if len(parts) >= 3 else 'gallery'
        mt = _BUILDER_FOLDER_MAP.get(folder, 'gallery')
        return ('builder', id, mt)

    # ── projects/ ──────────────────────────────────────────────────────────────
    if top in ('projects', 'project') and len(parts) >= 2:
        raw_id = parts[1]
        proj_id = _project_by_id.get(raw_id) or _project_by_id.get(_slugify(raw_id))
        if not proj_id:
            return None
        folder = parts[2].lower() if len(parts) >= 3 else 'gallery'
        mt = _PROJECT_FOLDER_MAP.get(folder, 'gallery')
        return ('project', str(proj_id), mt)

    # ── blogs/ ─────────────────────────────────────────────────────────────────
    if top in ('blogs', 'blog') and len(parts) >= 2:
        raw_id = parts[1]
        blog_id = _blog_by_slug.get(raw_id) or _blog_by_slug.get(_slugify(raw_id))
        if not blog_id:
            return None
        folder = parts[2].lower() if len(parts) >= 3 else 'featured_image'
        mt = 'featured_image' if 'featured' in folder else 'gallery'
        return ('blog', str(blog_id), mt)

    return None


def _is_featured(blob_name: str, mt: str) -> bool:
    return mt in ('logo', 'cover', 'featured_image')


# ── list entities helper ───────────────────────────────────────────────────────

def list_entities():
    with app.app_context():
        print("\n── Builders ─────────────────────────────────")
        for b in Builder.query.order_by(Builder.id).all():
            print(f"  id={b.id!r:40s}  name={b.company_name or b.brand_name!r}")
        print("\n── Projects ─────────────────────────────────")
        for p in BuilderProject.query.order_by(BuilderProject.id).all():
            print(f"  id={p.id:<6}  title={p.title!r}")
        print("\n── Blogs ────────────────────────────────────")
        for bl in Blog.query.order_by(Blog.id).all():
            print(f"  id={bl.id:<6}  slug={bl.slug!r}")
    print()


# ── main ───────────────────────────────────────────────────────────────────────

def run(dry_run=False, prefix='', backfill=False, assignments_file=''):
    # Load manual assignments if provided
    manual: dict = {}
    if assignments_file and os.path.isfile(assignments_file):
        with open(assignments_file, encoding='utf-8') as f:
            manual = json.load(f)
        print(f"Loaded {len(manual)} manual assignment(s) from {assignments_file}\n")

    svc = BlobServiceClient.from_connection_string(CONN_STR)
    container_client = svc.get_container_client(CONTAINER)

    print(f"Listing blobs in container '{CONTAINER}'" +
          (f" with prefix '{prefix}'" if prefix else "") + " …\n")

    blobs = list(container_client.list_blobs(name_starts_with=prefix or None))
    print(f"Found {len(blobs)} blob(s).\n")

    registered  = 0
    skipped     = 0
    unmatched   = []

    with app.app_context():
        _load_lookups()
        print(f"Loaded {len(_builder_by_id)} builders, "
              f"{len(_project_by_id)} project keys, "
              f"{len(_blog_by_slug)} blog keys from DB.\n")

        _featured_seen: set = set()

        for blob in blobs:
            name = blob.name
            url  = _blob_url(name)

            # ── try path-based parse first ─────────────────────────────────────
            parsed = _parse(name)

            # ── fall back to manual assignments ───────────────────────────────
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
            is_feat  = _is_featured(name, mt) and feat_key not in _featured_seen
            if is_feat:
                _featured_seen.add(feat_key)

            if dry_run:
                print(f"  [WOULD] {entity_type}[{entity_id}] {mt} feat={is_feat} → {url}")
                registered += 1
                continue

            existing = Media.query.filter_by(
                entity_type=entity_type, entity_id=str(entity_id), blob_url=url).first()
            if existing:
                skipped += 1
                continue

            order = Media.query.filter_by(
                entity_type=entity_type, entity_id=str(entity_id),
                media_type=mt).count()

            media_service.register_url(
                entity_type, entity_id, url, mt,
                is_featured=is_feat,
                display_order=order,
                original_filename=os.path.basename(name),
            )
            registered += 1
            print(f"  [OK]    {entity_type}[{entity_id}] {mt} feat={is_feat}")

        if not dry_run:
            db.session.commit()
            print(f"\nCommitted {registered} new Media record(s).")

        if backfill and not dry_run:
            _backfill_entity_fields()

    label = "[DRY-RUN] " if dry_run else ""
    print(f"\n{label}── Summary ───────────────────────────────────")
    print(f"  registered : {registered}")
    print(f"  skipped    : {skipped}  (already in media table)")
    print(f"  unmatched  : {len(unmatched)}  (could not map to an entity)")

    if unmatched:
        print("\n  Unmatched blobs:")
        for n in unmatched:
            print(f"    {n}")
        if not assignments_file:
            print("\n  → Run with --list-entities to see available IDs,")
            print("    then fill in scripts/blob_assignments.json and re-run with")
            print("    --assignments scripts/blob_assignments.json")


def _backfill_entity_fields():
    print("\n── Back-filling entity fields ────────────────")
    changed = 0

    for b in Builder.query.all():
        logo   = media_service.get_featured('builder', b.id, 'logo')
        cover  = media_service.get_featured('builder', b.id, 'cover')
        if logo   and b.builder_logo  != logo.blob_url:
            b.builder_logo  = logo.blob_url;  changed += 1
        if cover  and b.cover_banner  != cover.blob_url:
            b.cover_banner  = cover.blob_url; changed += 1

    for p in BuilderProject.query.all():
        cover = media_service.get_featured('project', p.id, 'cover')
        if cover and p.project_image != cover.blob_url:
            p.project_image = cover.blob_url; changed += 1
        gallery = media_service.get_media('project', p.id, 'gallery')
        if gallery:
            urls = [m.blob_url for m in gallery]
            p.image_urls = json.dumps(urls); changed += 1
        plans = media_service.get_media('project', p.id, 'floor_plan')
        if plans:
            p.floor_plans = json.dumps([m.blob_url for m in plans]); changed += 1

    for blog in Blog.query.all():
        featured = media_service.get_featured('blog', blog.id, 'featured_image')
        if featured and blog.featured_image != featured.blob_url:
            blog.featured_image = featured.blob_url; changed += 1

    db.session.commit()
    print(f"  Back-filled {changed} entity field(s).")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Import existing Azure blobs into the media table.')
    parser.add_argument('--dry-run',       action='store_true',
                        help='Print what would happen without writing anything.')
    parser.add_argument('--prefix',        default='',
                        help='Only scan blobs starting with this prefix.')
    parser.add_argument('--backfill',      action='store_true',
                        help='Copy featured Media URLs back to entity fields after import.')
    parser.add_argument('--list-entities', action='store_true',
                        help='Print all builder IDs and project IDs then exit.')
    parser.add_argument('--assignments',   default='',
                        help='Path to a JSON file mapping flat blob names to entities.')
    args = parser.parse_args()

    if args.list_entities:
        list_entities()
        sys.exit(0)

    run(dry_run=args.dry_run, prefix=args.prefix,
        backfill=args.backfill, assignments_file=args.assignments)
