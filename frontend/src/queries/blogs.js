/**
 * Central query layer — Blogs
 */

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const blogKeys = {
  /** All blogs list */
  all: () => ['blogs'],
};

// ─── Query Functions ─────────────────────────────────────────────────────────
export { fetchBlogs } from '../services/api';
