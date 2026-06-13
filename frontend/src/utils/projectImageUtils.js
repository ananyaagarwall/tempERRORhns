import API_BASE_URL from '../config';
import { normalizeImageUrl } from './imageUtils';

const AZURE_MEDIA_BASE = 'https://hnsblob001.blob.core.windows.net/hns-media';

const withBackendOrigin = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const looksLikeUrl = (val) => {
  if (!val || typeof val !== 'string') return false;
  const s = val.trim().toLowerCase();
  return s.startsWith('http') || s.startsWith('/uploads/') || s.includes('.') || s.includes('/');
};

function parseImageList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = typeof value === 'string' && value.trim().startsWith('[')
      ? JSON.parse(value)
      : String(value).split(',');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return looksLikeUrl(String(value)) ? [String(value)] : [];
  }
}

export function pickProjectImage(project, property) {
  const propertyImage = property?.builder_project_image;
  if (propertyImage) return normalizeImageUrl(propertyImage) || withBackendOrigin(propertyImage);

  if (project?.project_image) {
    return normalizeImageUrl(project.project_image) || withBackendOrigin(project.project_image);
  }

  for (const url of parseImageList(project?.image_urls)) {
    if (looksLikeUrl(String(url))) {
      return normalizeImageUrl(String(url).trim()) || withBackendOrigin(String(url).trim());
    }
  }

  if (Array.isArray(project?.floor_plans) && project.floor_plans.length > 0) {
    const firstPlan = String(project.floor_plans[0]);
    if (looksLikeUrl(firstPlan)) {
      return normalizeImageUrl(firstPlan) || withBackendOrigin(firstPlan);
    }
  }

  if (project?.id) {
    return `${AZURE_MEDIA_BASE}/projects/${project.id}/gallery/img1.jpg`;
  }

  return '/building.webp';
}

export function pickFloorPlanPreview(mediaItems = []) {
  const first = (mediaItems || []).find((item) => item?.blob_url);
  return first ? normalizeImageUrl(first.blob_url) : null;
}
