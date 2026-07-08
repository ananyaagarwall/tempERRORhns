/**
 * Central query layer — Properties
 *
 * All components must import query keys from here.
 * Consistent keys enable automatic deduplication and cache sharing.
 */

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const propertyKeys = {
  /** Root key — invalidates everything property-related */
  all: () => ['properties'],

  /** Filtered search — key is the serialised filter object */
  search: (filters) => ['properties', 'search', filters ?? {}],

  /** Single property by ID */
  byId: (id) => ['properties', 'detail', String(id ?? '')],

  /** All properties for a specific location (NearYou tabs) */
  byLocation: (locationName) => ['properties', 'location', locationName ?? ''],

  /** Multi-location query */
  multiLocation: (locations) => [
    'properties',
    'multi-location',
    Array.isArray(locations) ? [...locations].sort().join(',') : String(locations ?? ''),
  ],

  /** Property filter options (amenities, status, society types) */
  filters: (locationName) => ['properties', 'filters', locationName ?? ''],

  /** Points of Interest near a property */
  pois: (propertyId, opts) => [
    'properties',
    'pois',
    String(propertyId ?? ''),
    opts ?? {},
  ],
};

// ─── Query Functions ─────────────────────────────────────────────────────────
// Re-export from services/api so components only need one import.
export {
  fetchProperties,
  fetchPropertyById,
  fetchPropertiesByLocation,
  fetchPropertiesByMultipleLocations,
  fetchPropertyFilters,
  fetchPropertyPois,
} from '../services/api';
