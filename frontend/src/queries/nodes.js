/**
 * Central query layer — Nearest Nodes (location graph)
 *
 * staleTime: 15 min — the location graph almost never changes.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchNearestNodes } from '../services/api';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const nodeKeys = {
  /** Nearest location nodes for a given user location */
  nearest: (location) => ['nodes', 'nearest', String(location ?? '')],
};

// ─── Query Hooks ─────────────────────────────────────────────────────────────

/**
 * Nearest location nodes for NearYouSection tab generation.
 * Result is cached per location string — same location = 0 duplicate calls.
 * `enabled: !!location` prevents firing with an empty string.
 */
export function useNearestNodes(location) {
  return useQuery({
    queryKey: nodeKeys.nearest(location),
    queryFn: () => fetchNearestNodes(location),
    enabled: !!location,
    staleTime: 15 * 60 * 1000,   // 15 min — graph rarely changes
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// ─── Re-export raw fetch function ────────────────────────────────────────────
export { fetchNearestNodes };
