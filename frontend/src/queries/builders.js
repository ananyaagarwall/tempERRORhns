/**
 * Central query layer — Builders
 */

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const builderKeys = {
  /** Root key — all builder queries */
  all: () => ['builders'],

  /** Single builder by ID */
  byId: (id) => ['builders', 'detail', String(id ?? '')],

  /** Builder lookup by name (fallback) */
  byName: (name) => ['builders', 'name', String(name ?? '')],

  /** Projects belonging to a builder, optionally filtered by status */
  projects: (builderId, status) => [
    'builders',
    'projects',
    String(builderId ?? ''),
    status ?? '',
  ],

  /** A single builder project by its own ID */
  projectById: (projectId) => ['builders', 'project', String(projectId ?? '')],
};

// ─── Query Functions ─────────────────────────────────────────────────────────
export {
  fetchBuilders,
  fetchBuilderById,
  fetchBuilderByName,
  fetchBuilderProjects,
  fetchBuilderProjectById,
} from '../services/api';
