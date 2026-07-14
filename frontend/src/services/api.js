/**
 * services/api.js — Central API Service Layer
 *
 * All HTTP calls go through the `api` Axios instance (apiInstance.js)
 * so that auth tokens and guest-ID headers are injected automatically
 * by the request interceptor.
 *
 * Function signatures are backward-compatible with the previous fetch-based
 * implementation so all existing call-sites (other pages) still work.
 */

import api from './apiInstance';

// ─── Builders ─────────────────────────────────────────────────────────────────

export const fetchBuilderProjectById = async (id) => {
  const { data } = await api.get(`/projects/${id}`);
  return data;
};

export const fetchBuilderByName = async (name) => {
  const { data } = await api.get(`/builders/name/${encodeURIComponent(name)}`);
  return data;
};

export const fetchBuilderById = async (builderId) => {
  const { data } = await api.get(`/builders/${builderId}`);
  return data;
};

// Kept for backwards compatibility — prefer fetchBuilderById
export const fetchBuilderByReraId = fetchBuilderById;

export const fetchBuilderProjects = async (builderId, status = '') => {
  const params = status ? { status } : {};
  const { data } = await api.get(`/builders/${builderId}/projects`, { params });
  return data;
};

export const fetchBuilders = async (location = '') => {
  const params = {};
  if (location) params.location = location;
  const { data } = await api.get('/builders', { params });
  // Normalise: endpoint may return an array directly or {builders: [...]}
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.builders)) return data.builders;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

// ─── Properties ──────────────────────────────────────────────────────────────

export const fetchProperties = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.location) params.append('location', filters.location);

  // priceRange (desktop slider) is in Lakhs → convert to Crores
  if (filters.priceRange && filters.priceRange > 0) {
    params.append('price', (filters.priceRange / 100).toFixed(2));
  }

  // minBudget & maxBudget (mobile) in Lakhs → Crores
  if (filters.minBudget !== null && filters.minBudget !== undefined) {
    params.append('min_price', (filters.minBudget / 100).toFixed(2));
  }
  if (filters.maxBudget !== null && filters.maxBudget !== undefined) {
    params.append('max_price', (filters.maxBudget / 100).toFixed(2));
  }

  if (filters.bhkTypes && Array.isArray(filters.bhkTypes)) {
    filters.bhkTypes.forEach((type) => params.append('type', type));
  }

  if (filters.bhkSearch) params.append('bhk_search', filters.bhkSearch);

  if (filters.amenities && Array.isArray(filters.amenities)) {
    filters.amenities.forEach((amenity) => params.append('amenities', amenity));
  }

  if (filters.amenityCategories && Array.isArray(filters.amenityCategories)) {
    filters.amenityCategories.forEach((cat) => params.append('amenity_category', cat));
  }

  if (filters.propertyStatus && Array.isArray(filters.propertyStatus)) {
    filters.propertyStatus.forEach((s) => params.append('property_status', s));
  }

  if (filters.societyTypes && Array.isArray(filters.societyTypes)) {
    filters.societyTypes.forEach((t) => params.append('society_type', t));
  }

  const { data } = await api.get(`/properties/search?${params.toString()}`);
  // Normalise: backend may return array or {properties: [...]}
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.properties)) return data.properties;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export const fetchPropertyFilters = async (location = '') => {
  const params = location ? { location } : {};
  const { data } = await api.get('/properties/filters', { params });
  return data;
};

export const fetchPropertyById = async (id) => {
  const { data } = await api.get(`/properties/${id}`);
  return data;
};

/**
 * Properties for a single location — used by NearYouSection and BuildersSection.
 * Each unique locationName is a separate TanStack Query cache entry.
 */
export const fetchPropertiesByLocation = async (locationName) => {
  const safe = String(locationName || '').trim();
  if (!safe) return [];
  const { data } = await api.get(`/properties/location/${encodeURIComponent(safe)}`);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.properties)) return data.properties;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export const fetchNearestNodes = async (location) => {
  const safeLocation = String(location || '').trim();
  if (!safeLocation) {
    return { primaryLocation: '', foundInArray: false, nearestNodes: [] };
  }
  const { data } = await api.get(`/nearest-nodes/${encodeURIComponent(safeLocation)}`);
  return data;
};

export const fetchPropertiesByMultipleLocations = async (locations = []) => {
  const locationsArray = Array.isArray(locations) ? locations : [locations];
  const cleaned = locationsArray.map((loc) => String(loc || '').trim()).filter(Boolean);
  if (cleaned.length === 0) return [];
  const { data } = await api.get('/properties/multiple-locations', {
    params: { locations: cleaned.join(',') },
  });
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.properties)) return data.properties;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export const fetchPropertyPois = async (propertyId, options = {}) => {
  const params = {};
  if (options.radius_m) params.radius_m = String(options.radius_m);
  if (options.types) {
    params.types = Array.isArray(options.types)
      ? options.types.join(',')
      : String(options.types);
  }
  const { data } = await api.get(`/properties/${propertyId}/pois`, { params });
  return data;
};

export const createProperty = async (propertyData) => {
  const { data } = await api.post('/properties', propertyData);
  return data;
};

// ─── Blogs ───────────────────────────────────────────────────────────────────

export const fetchBlogs = async () => {
  const { data } = await api.get('/blogs');
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.blogs)) return data.blogs;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

// ─── Geolocation (used by LandingPage) ───────────────────────────────────────

export const reverseGeocode = async ({ latitude, longitude }) => {
  const { data } = await api.post('/geolocation', { latitude, longitude });
  return data;
};
