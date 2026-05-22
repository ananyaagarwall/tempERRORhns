import { API_API_URL as API_URL } from '../config';

/**
 * Fetch all Media records for an entity.
 *
 * @param {string} entityType  'builder' | 'project' | 'property' | 'blog'
 * @param {string|number} entityId
 * @param {string} [mediaType]  optional filter: 'gallery' | 'floor_plan' | 'logo' | …
 * @returns {Promise<Array>}  array of media objects
 */
export async function fetchEntityMedia(entityType, entityId, mediaType = null) {
  if (!entityType || !entityId) return [];
  const params = new URLSearchParams();
  if (mediaType) params.append('media_type', mediaType);
  const qs = params.toString() ? `?${params}` : '';
  try {
    const res = await fetch(`${API_URL}/media/${entityType}/${entityId}${qs}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Upload a file and create a Media record.
 * Requires admin auth token in localStorage.
 */
export async function uploadMedia(entityType, entityId, file, options = {}) {
  const form = new FormData();
  form.append('file', file);
  form.append('media_type', options.mediaType ?? 'gallery');
  if (options.isFeatured)    form.append('is_featured', 'true');
  if (options.altText)       form.append('alt_text', options.altText);
  if (options.displayOrder != null) form.append('display_order', String(options.displayOrder));

  const res = await fetch(`${API_URL}/media/${entityType}/${entityId}`, {
    method: 'POST',
    body: form,
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

/** Patch display_order, is_featured, or alt_text on an existing Media record. */
export async function updateMedia(mediaId, updates) {
  const res = await fetch(`${API_URL}/media/${mediaId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
  return res.json();
}

/** Delete a Media record (and its Azure blob). */
export async function deleteMedia(mediaId) {
  const res = await fetch(`${API_URL}/media/${mediaId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return res.json();
}

/**
 * Apply a new ordering to a set of media items.
 * @param {number[]} orderedIds  IDs in the desired display order
 */
export async function reorderMedia(entityType, entityId, mediaType, orderedIds) {
  const res = await fetch(`${API_URL}/media/${entityType}/${entityId}/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
    body: JSON.stringify({ media_type: mediaType, ordered_ids: orderedIds }),
  });
  if (!res.ok) throw new Error(`Reorder failed: ${res.status}`);
  return res.json();
}
