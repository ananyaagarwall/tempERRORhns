/**
 * Central query layer — Builders
 *
 * staleTime guide:
 *   - builders list    10 min  (changes rarely during a session)
 *   - builder detail   15 min  (very stable)
 *   - builder projects  5 min  (may update as projects progress)
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchBuilders,
  fetchBuilderById,
  fetchBuilderByName,
  fetchBuilderProjects,
  fetchBuilderProjectById,
} from '../services/api';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const builderKeys = {
  /** Root key — all builder queries */
  all: () => ['builders'],

  /** Builders list, optionally scoped to a location */
  list: (location) => ['builders', 'list', location ?? ''],

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

// ─── Query Hooks ─────────────────────────────────────────────────────────────

/**
 * Full builders list, optional location filter applied server-side.
 * 10-min staleTime — builders list rarely changes within a session.
 */
export function useBuilders(location = '') {
  return useQuery({
    queryKey: builderKeys.list(location),
    queryFn: () => fetchBuilders(location),
    staleTime: 10 * 60 * 1000,       // 10 min
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Single builder by ID.
 */
export function useBuilderById(builderId) {
  return useQuery({
    queryKey: builderKeys.byId(builderId),
    queryFn: () => fetchBuilderById(builderId),
    enabled: !!builderId,
    staleTime: 15 * 60 * 1000,       // 15 min
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Builder lookup by name.
 */
export function useBuilderByName(name) {
  return useQuery({
    queryKey: builderKeys.byName(name),
    queryFn: () => fetchBuilderByName(name),
    enabled: !!name,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Projects for a given builder, optionally filtered by status.
 */
export function useBuilderProjects(builderId, status = '') {
  return useQuery({
    queryKey: builderKeys.projects(builderId, status),
    queryFn: () => fetchBuilderProjects(builderId, status),
    enabled: !!builderId,
    staleTime: 5 * 60 * 1000,        // 5 min
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Single builder project by project ID.
 */
export function useBuilderProjectById(projectId) {
  return useQuery({
    queryKey: builderKeys.projectById(projectId),
    queryFn: () => fetchBuilderProjectById(projectId),
    enabled: !!projectId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// ─── Re-export raw fetch functions ──────────────────────────────────────────
export {
  fetchBuilders,
  fetchBuilderById,
  fetchBuilderByName,
  fetchBuilderProjects,
  fetchBuilderProjectById,
};
