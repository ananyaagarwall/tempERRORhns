"""
One-time script: populate the `media` table from blob/local URLs already
stored in the Builder, BuilderProject, Blog, and Property entity fields.

Run AFTER migrate_to_azure.py so that entity fields contain Azure URLs.
Also works with local /uploads/ paths (dev environments without Azure).

    cd backend
    python scripts/populate_media_table.py [--dry-run] [--verbose]

The script is idempotent — re-running skips URLs already in the media table.

Why "registered=0"?
  The script only maps URLs that already exist in entity image fields
  (builder_logo, cover_banner, project_image, image_urls, floor_plans …).
  If those fields are NULL, there is nothing to map yet.  Upload images via
  the admin interface or POST /api/media/<type>/<id> to create Media records.
  Use --verbose to see the raw field values found in each row.
"""

import os
import sys
import argparse
import json

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, BACKEND_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(BACKEND_DIR, '.env'))

from app import app, db          # noqa: E402 — also calls db.create_all()
from models import Builder, BuilderProject, Blog, Property, Media
import media_service              # noqa: E402

# ── counters ──────────────────────────────────────────────────────────────────
_stats = {'registered': 0, 'skipped': 0, 'null_fields': 0}


# ── helpers ───────────────────────────────────────────────────────────────────

def _is_valid_url(url):
    """Return True for URLs worth registering: absolute, /uploads/ path, or bare filename."""
    if not url or not isinstance(url, str):
        return False
    url = url.strip()
    if not url:
        return False
    # Azure / external absolute URL
    if url.startswith('http://') or url.startswith('https://'):
        return True
    # Relative path stored by the local upload handlers
    if url.startswith('/uploads/'):
        return True
    # Bare filename (legacy blog image storage) — must have an extension
    if '.' in url and ' ' not in url and ':' not in url:
        return True
    return False


def _reg(entity_type, entity_id, url, mt,
         featured=False, order=0, dry_run=False, verbose=False):
    if not _is_valid_url(url):
        if url is not None and verbose:
            print(f"    [NULL/INVALID] {entity_type}[{entity_id}].{mt} = {url!r}")
        if url is None:
            _stats['null_fields'] += 1
        return

    url = url.strip()
    if dry_run:
        exists = Media.query.filter_by(
            entity_type=entity_type, entity_id=str(entity_id), blob_url=url).first()
        if exists:
            print(f"  [SKIP]  {entity_type}[{entity_id}] {mt}: {url}")
            _stats['skipped'] += 1
        else:
            print(f"  [WOULD] {entity_type}[{entity_id}] {mt}: {url}")
            _stats['registered'] += 1
        return

    existing = Media.query.filter_by(
        entity_type=entity_type, entity_id=str(entity_id), blob_url=url).first()
    if existing:
        _stats['skipped'] += 1
        if verbose:
            print(f"  [SKIP]  {entity_type}[{entity_id}] {mt}: already registered")
        return

    media_service.register_url(
        entity_type, str(entity_id), url, mt,
        is_featured=featured, display_order=order,
    )
    _stats['registered'] += 1
    print(f"  [OK]    {entity_type}[{entity_id}] {mt}: {url}")


def _safe_list(raw):
    if isinstance(raw, list):
        return raw
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, list) else []
        except Exception:
            return []
    return []


# ── entity processors ─────────────────────────────────────────────────────────

def _process_builders(dry_run, verbose):
    builders = Builder.query.all()
    null_logos  = sum(1 for b in builders if not b.builder_logo)
    null_covers = sum(1 for b in builders if not b.cover_banner)
    print(f"\n=== Builders ({len(builders)}) — "
          f"logo: {len(builders)-null_logos} set / {null_logos} NULL, "
          f"cover: {len(builders)-null_covers} set / {null_covers} NULL ===")
    for b in builders:
        if verbose:
            print(f"  builder[{b.rera_id}] logo={b.builder_logo!r} cover={b.cover_banner!r}")
        _reg('builder', b.rera_id, b.builder_logo, 'logo',  featured=True, dry_run=dry_run, verbose=verbose)
        _reg('builder', b.rera_id, b.cover_banner, 'cover', featured=True, dry_run=dry_run, verbose=verbose)
        for i, cert in enumerate(_safe_list(b.certificates)):
            _reg('builder', b.rera_id, cert, 'certificate', order=i, dry_run=dry_run, verbose=verbose)


def _process_projects(dry_run, verbose):
    projects = BuilderProject.query.all()
    null_covers = sum(1 for p in projects if not p.project_image)
    has_gallery = sum(1 for p in projects if p.image_urls and p.image_urls not in ('[]', 'null'))
    has_plans   = sum(1 for p in projects if p.floor_plans and p.floor_plans not in ('[]', 'null'))
    print(f"\n=== BuilderProjects ({len(projects)}) — "
          f"cover: {len(projects)-null_covers} set / {null_covers} NULL, "
          f"gallery: {has_gallery}, floor_plans: {has_plans} ===")
    for p in projects:
        if verbose:
            print(f"  project[{p.id}] img={p.project_image!r} "
                  f"image_urls={p.image_urls!r:.80} "
                  f"floor_plans={p.floor_plans!r:.60}")
        _reg('project', p.id, p.project_image, 'cover', featured=True, dry_run=dry_run, verbose=verbose)
        for i, url in enumerate(_safe_list(p.image_urls)):
            _reg('project', p.id, url, 'gallery', order=i, dry_run=dry_run, verbose=verbose)
        for i, url in enumerate(_safe_list(p.floor_plans)):
            _reg('project', p.id, url, 'floor_plan', order=i, dry_run=dry_run, verbose=verbose)


def _process_blogs(dry_run, verbose):
    blogs = Blog.query.all()
    print(f"\n=== Blogs ({len(blogs)}) ===")
    for blog in blogs:
        _reg('blog', blog.id, blog.featured_image, 'featured_image',
             featured=True, dry_run=dry_run, verbose=verbose)
        for i, url in enumerate(filter(None, [blog.image1, blog.image2, blog.image3])):
            _reg('blog', blog.id, url, 'gallery', order=i, dry_run=dry_run, verbose=verbose)


def _process_properties(dry_run, verbose):
    props = Property.query.all()
    has_img = sum(1 for p in props if getattr(p, 'builder_project_image', None))
    print(f"\n=== Properties ({len(props)}) — cover image set: {has_img} / {len(props)} ===")
    for prop in props:
        url = getattr(prop, 'builder_project_image', None)
        _reg('property', prop.id, url, 'cover', featured=True, dry_run=dry_run, verbose=verbose)


# ── main ──────────────────────────────────────────────────────────────────────

def run(dry_run=False, verbose=False):
    label = "[DRY-RUN] " if dry_run else ""
    print(f"{label}Populating media table from entity image fields...\n"
          f"(Use --verbose to see raw field values for NULL debugging)\n")

    with app.app_context():
        _process_builders(dry_run, verbose)
        if not dry_run:
            db.session.commit()

        _process_projects(dry_run, verbose)
        if not dry_run:
            db.session.commit()

        _process_blogs(dry_run, verbose)
        if not dry_run:
            db.session.commit()

        _process_properties(dry_run, verbose)
        if not dry_run:
            db.session.commit()

    print(f"\n{label}── Summary ──────────────────────────────────")
    print(f"  registered : {_stats['registered']}")
    print(f"  skipped    : {_stats['skipped']}  (already in media table)")
    print(f"  null fields: {_stats['null_fields']}  (entity fields with no URL — nothing to map yet)")
    if _stats['registered'] == 0 and _stats['null_fields'] > 0:
        print(
            "\n  → All image fields are NULL.  To fix:\n"
            "    1. Upload images via the admin interface (POST /api/builders, admin dashboard)\n"
            "    2. OR directly via the media endpoint: POST /api/media/<entity_type>/<id>\n"
            "    3. Then re-run this script.\n"
            "  Note: migrate_to_azure.py only migrates files that exist in backend/uploads/.\n"
            "        If no files were ever uploaded locally, that script also produces 0 changes."
        )


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Seed the media table from existing entity image URL fields.')
    parser.add_argument('--dry-run',  action='store_true',
                        help='Print what would happen without writing to the DB.')
    parser.add_argument('--verbose',  action='store_true',
                        help='Print raw field values for each entity row (useful for debugging NULL fields).')
    args = parser.parse_args()
    run(dry_run=args.dry_run, verbose=args.verbose)
