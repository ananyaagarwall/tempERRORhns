// Centralized API configuration.
// `VITE_API_BASE_URL` may be provided either as the backend origin
// (`https://backend.example.com`) or already suffixed with `/api`.
const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

const normalizeApiBaseUrl = (url) =>
  String(url || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");

const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL);
export const API_API_URL = `${API_BASE_URL}/api`;

export default API_BASE_URL;
