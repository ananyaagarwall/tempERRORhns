/**
 * Central query layer — Nearest Nodes (location graph)
 */

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const nodeKeys = {
  /** Nearest location nodes for a given user location */
  nearest: (location) => ['nodes', 'nearest', String(location ?? '')],
};

// ─── Query Functions ─────────────────────────────────────────────────────────
export { fetchNearestNodes } from '../services/api';
