"""
Reusable service layer for the Media table.
All business logic for media (upload, fetch, delete, ordering) lives here.
Endpoints in app.py are thin wrappers around these functions.
"""

import storage
from models import Media, db


# ── Reads ─────────────────────────────────────────────────────────────────────

def get_media(entity_type: str, entity_id: str,
              media_type: str | None = None) -> list[Media]:
    """Return all Media records for an entity, ordered by display_order then id."""
    q = Media.query.filter_by(entity_type=entity_type, entity_id=str(entity_id))
    if media_type:
        q = q.filter_by(media_type=media_type)
    return q.order_by(Media.display_order.asc(), Media.id.asc()).all()


def get_featured(entity_type: str, entity_id: str,
                 media_type: str | None = None) -> Media | None:
    """Return the featured Media record, or the first one if none is marked featured."""
    q = Media.query.filter_by(entity_type=entity_type, entity_id=str(entity_id),
                               is_featured=True)
    if media_type:
        q = q.filter_by(media_type=media_type)
    result = q.first()
    if result:
        return result
    # Fall back to lowest-order record
    return get_media(entity_type, entity_id, media_type)[0] if get_media(entity_type, entity_id, media_type) else None


# ── Writes ────────────────────────────────────────────────────────────────────

def add_media(entity_type: str, entity_id: str, file_obj,
              media_type: str = 'gallery',
              is_featured: bool = False,
              alt_text: str | None = None,
              display_order: int | None = None) -> Media:
    """Upload *file_obj* to Azure and create a Media record."""
    blob_prefix = f"{entity_type}/{entity_id}/{media_type}"
    private = media_type == 'certificate'
    url = storage.upload_file(file_obj, blob_prefix, private=private)

    if display_order is None:
        display_order = Media.query.filter_by(
            entity_type=entity_type, entity_id=str(entity_id),
            media_type=media_type).count()

    if is_featured:
        _clear_featured(entity_type, entity_id, media_type)

    record = Media(
        entity_type=entity_type,
        entity_id=str(entity_id),
        blob_url=url,
        media_type=media_type,
        is_featured=is_featured,
        display_order=display_order,
        alt_text=alt_text,
        original_filename=getattr(file_obj, 'filename', None),
        mime_type=getattr(file_obj, 'content_type', None),
    )
    db.session.add(record)
    db.session.commit()
    return record


def register_url(entity_type: str, entity_id: str, url: str,
                 media_type: str = 'gallery',
                 is_featured: bool = False,
                 alt_text: str | None = None,
                 display_order: int = 0,
                 original_filename: str | None = None) -> Media:
    """
    Create a Media record for an already-hosted URL without uploading.
    Idempotent — returns the existing record if the URL is already registered.
    Used by the population migration script and admin tools.
    """
    existing = Media.query.filter_by(
        entity_type=entity_type, entity_id=str(entity_id), blob_url=url).first()
    if existing:
        return existing

    if is_featured:
        _clear_featured(entity_type, entity_id, media_type)

    record = Media(
        entity_type=entity_type,
        entity_id=str(entity_id),
        blob_url=url,
        media_type=media_type,
        is_featured=is_featured,
        display_order=display_order,
        alt_text=alt_text,
        original_filename=original_filename,
    )
    db.session.add(record)
    db.session.commit()
    return record


def update_media(media_id: int,
                 display_order: int | None = None,
                 is_featured: bool | None = None,
                 alt_text: str | None = None) -> Media:
    """Patch display_order, featured flag, or alt_text on an existing record."""
    record = db.session.get(Media, media_id)
    if record is None:
        raise ValueError(f"Media {media_id} not found")

    if display_order is not None:
        record.display_order = display_order
    if alt_text is not None:
        record.alt_text = alt_text
    if is_featured is not None:
        if is_featured:
            _clear_featured(record.entity_type, record.entity_id, record.media_type)
        record.is_featured = is_featured

    db.session.commit()
    return record


def delete_media(media_id: int) -> None:
    """Remove the DB record and attempt to delete the blob from Azure."""
    record = db.session.get(Media, media_id)
    if record is None:
        raise ValueError(f"Media {media_id} not found")
    url = record.blob_url
    db.session.delete(record)
    db.session.commit()
    try:
        storage.delete_file_by_url(url)
    except Exception as e:
        print(f"[media_service] blob delete failed for {url}: {e}")


def reorder(entity_type: str, entity_id: str,
            media_type: str, ordered_ids: list[int]) -> list[Media]:
    """
    Apply a new display_order to the listed Media IDs.
    IDs not in the list are left unchanged.
    """
    records = {m.id: m for m in get_media(entity_type, entity_id, media_type)}
    for i, mid in enumerate(ordered_ids):
        if mid in records:
            records[mid].display_order = i
    db.session.commit()
    return get_media(entity_type, entity_id, media_type)


# ── Internal helpers ──────────────────────────────────────────────────────────

def _clear_featured(entity_type: str, entity_id: str, media_type: str) -> None:
    """Unset is_featured on every record matching entity+media_type."""
    Media.query.filter_by(
        entity_type=entity_type,
        entity_id=str(entity_id),
        media_type=media_type,
        is_featured=True,
    ).update({'is_featured': False})
