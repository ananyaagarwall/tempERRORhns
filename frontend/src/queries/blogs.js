/**
 * Central query layer — Blogs
 *
 * staleTime: 1 hr — blog lists update rarely.
 * The `useBlogsLanding` hook uses `select` to expose only the fields
 * BlogSection needs, preventing re-renders from unrelated field changes.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchBlogs } from '../services/api';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const blogKeys = {
  /** All blogs list */
  all: () => ['blogs'],
};

// ─── Query Hooks ─────────────────────────────────────────────────────────────

/**
 * Full blogs list — used by BlogLanding and BlogDetail pages.
 */
export function useBlogs() {
  return useQuery({
    queryKey: blogKeys.all(),
    queryFn: fetchBlogs,
    staleTime: 60 * 60 * 1000,   // 1 hr
    gcTime: 2 * 60 * 60 * 1000,  // 2 hr
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Landing-page-optimised blog hook.
 * Uses `select` so the component only subscribes to the minimal shape:
 *   { id, title, slug, subtitle, img }
 * BlogSection won't re-render when unrelated blog fields change.
 */
export function useBlogsLanding() {
  return useQuery({
    queryKey: blogKeys.all(),  // shares cache with useBlogs()
    queryFn: fetchBlogs,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    select: (data) =>
      Array.isArray(data)
        ? data.map((b) => ({
            id: b._id || b.id || b.slug || '',
            title: b.title || b.Title || '',
            slug: b.slug || b.Slug || '',
            subtitle: b.subtitle || b.Subtitle || b.description || b.excerpt || '',
            img: b.cover_image || b.image || b.img || '',
          }))
        : [],
  });
}

// ─── Re-export raw fetch function ────────────────────────────────────────────
export { fetchBlogs };
