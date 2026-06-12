// Centralized API configuration.
// In dev, Vite proxies /api/* to the backend (configured in vite.config.js).
// In production, VITE_API_BASE_URL can be set to the backend origin.
const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const normalizeApiBaseUrl = (url) =>
  String(url || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");

const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL);
export const API_API_URL = `${API_BASE_URL}/api`;

export default API_BASE_URL;
