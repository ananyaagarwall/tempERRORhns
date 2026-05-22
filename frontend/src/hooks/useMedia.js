import { useState, useEffect } from 'react';
import { fetchEntityMedia } from '../services/mediaService';

/**
 * Fetch Media records for an entity from the /api/media endpoint.
 *
 * @param {string}         entityType  'builder' | 'project' | 'property' | 'blog'
 * @param {string|number}  entityId    RERA ID (string) or numeric DB id
 * @param {string|null}    mediaType   optional filter ('gallery', 'floor_plan', …)
 *
 * @returns {{
 *   media:       Array,   // full Media record objects sorted by display_order
 *   loading:     boolean,
 *   featuredUrl: string|null,  // blob_url of the is_featured record, else first
 *   urls:        string[],     // ordered list of all blob_urls
 * }}
 *
 * Usage (detail page gallery):
 *   const { urls, loading } = useMedia('project', projectData?.id, 'gallery');
 *
 * Usage (featured image):
 *   const { featuredUrl } = useMedia('builder', builderData?.rera_id, 'logo');
 */
export function useMedia(entityType, entityId, mediaType = null) {
  const [media,   setMedia]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entityType || !entityId) {
      setMedia([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchEntityMedia(entityType, String(entityId), mediaType)
      .then(data => { if (!cancelled) setMedia(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setMedia([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [entityType, entityId, mediaType]);

  const featuredUrl = media.find(m => m.is_featured)?.blob_url
                   ?? media[0]?.blob_url
                   ?? null;

  const urls = media.map(m => m.blob_url);

  return { media, loading, featuredUrl, urls };
}
