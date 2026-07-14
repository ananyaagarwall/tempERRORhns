/**
 * Central query layer — Properties
 *
 * All components must import query hooks from here.
 * Consistent keys enable automatic deduplication and cache sharing.
 *
 * staleTime guide:
 *   - search results         2 min  (user expects reasonably fresh data)
 *   - single property detail 10 min (rarely changes during a session)
 *   - location listing       5 min  (NearYou tabs — acceptable small lag)
 *   - filter options         12 hr  (amenity/status lists barely change)
 *   - budget snapshot        10 min (price bracket classification)
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchProperties,
  fetchPropertyById,
  fetchPropertiesByLocation,
  fetchPropertiesByMultipleLocations,
  fetchPropertyFilters,
  fetchPropertyPois,
} from '../services/api';

// ─── Query Keys ──────────────────────────────────────────────────────────────

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

  /** Budget snapshot — same data as search({}) but named for clarity */
  budget: () => ['properties', 'search', {}],
};

// ─── Query Hooks ─────────────────────────────────────────────────────────────

/**
 * Filtered property search.
 * Debounce the filters object before calling this hook to prevent
 * per-keystroke API calls.
 */
export function useProperties(filters = {}) {
  return useQuery({
    queryKey: propertyKeys.search(filters),
    queryFn: () => fetchProperties(filters),
    staleTime: 2 * 60 * 1000,        // 2 min
    gcTime: 10 * 60 * 1000,          // 10 min garbage collection
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Single property detail by ID.
 * Long staleTime — detail pages are fetched when user navigates in.
 */
export function usePropertyById(id) {
  return useQuery({
    queryKey: propertyKeys.byId(id),
    queryFn: () => fetchPropertyById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,       // 10 min
    gcTime: 30 * 60 * 1000,          // 30 min
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Properties for a single location (NearYou tabs, BuildersSection tabs).
 * Each unique locationName is a separate cache entry.
 */
export function usePropertiesByLocation(locationName) {
  return useQuery({
    queryKey: propertyKeys.byLocation(locationName),
    queryFn: () => fetchPropertiesByLocation(locationName),
    enabled: !!locationName,
    staleTime: 5 * 60 * 1000,        // 5 min
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Properties for multiple locations at once.
 */
export function usePropertiesByMultipleLocations(locations) {
  const sorted = Array.isArray(locations) ? [...locations].sort() : [];
  return useQuery({
    queryKey: propertyKeys.multiLocation(sorted),
    queryFn: () => fetchPropertiesByMultipleLocations(sorted),
    enabled: sorted.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Property filter options (amenities, society types, statuses).
 * staleTime 12h — these rarely change.
 */
export function usePropertyFilters(locationName = '') {
  return useQuery({
    queryKey: propertyKeys.filters(locationName),
    queryFn: () => fetchPropertyFilters(locationName),
    staleTime: 12 * 60 * 60 * 1000, // 12 hr
    gcTime: 24 * 60 * 60 * 1000,    // 24 hr
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Budget section snapshot — fetches full property list but exposes only
 * {Price_Starting_From, Location} via `select` so BudgetSection doesn't
 * re-render when unrelated fields change.
 *
 * Shares the same cache key as useProperties({}) so there is no duplicate
 * network call if PropertiesSection has already fetched the default list.
 */
export function usePropertiesBudget() {
  return useQuery({
    queryKey: propertyKeys.budget(),
    queryFn: () => fetchProperties({}),
    staleTime: 10 * 60 * 1000,       // 10 min
    gcTime: 20 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    select: (data) =>
      Array.isArray(data)
        ? data.map((p) => ({
            Price_Starting_From: p.Price_Starting_From || p.Pricing || '',
            Location: p.Location || '',
          }))
        : [],
  });
}

/**
 * Points of Interest near a property.
 */
export function usePropertyPois(propertyId, options = {}) {
  return useQuery({
    queryKey: propertyKeys.pois(propertyId, options),
    queryFn: () => fetchPropertyPois(propertyId, options),
    enabled: !!propertyId,
    staleTime: 30 * 60 * 1000,       // 30 min — POIs are very stable
    gcTime: 60 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// ─── Re-export raw fetch functions ──────────────────────────────────────────
// Kept for backwards compatibility — other pages that import directly from
// services/api still work; pages that import from queries/properties.js
// can use either the hooks above or these raw functions.
export {
  fetchProperties,
  fetchPropertyById,
  fetchPropertiesByLocation,
  fetchPropertiesByMultipleLocations,
  fetchPropertyFilters,
  fetchPropertyPois,
};
