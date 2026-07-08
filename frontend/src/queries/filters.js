/**
 * Central query layer — Property Filters
 *
 * staleTime recommendation: 12 hours
 * Amenity, society-type, and status filter lists change very rarely.
 * Configure this at the call site (useQuery options) rather than here.
 */

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const filterKeys = {
  /** Filter options for a given location (or global when location is empty) */
  byLocation: (location) => ['filters', String(location ?? '')],
};

// ─── Query Functions ─────────────────────────────────────────────────────────
export { fetchPropertyFilters } from '../services/api';
