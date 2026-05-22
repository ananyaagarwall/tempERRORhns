import API_BASE_URL from '../config';

/**
 * Normalise any image URL stored in the DB so it's safe to use in an <img src>.
 *
 * Handles three storage eras:
 *  1. Azure Blob URL  (https://…blob.core.windows.net/…) → pass through
 *  2. Relative path   (/uploads/filename.jpg)             → prepend API_BASE_URL
 *  3. Bare filename   (filename.jpg)  — legacy blog storage → prepend API_BASE_URL/uploads/
 *
 * Returns null when url is falsy so callers can use  src={normalizeImageUrl(u) || fallback}.
 */
export function normalizeImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/uploads/${url}`;
}
