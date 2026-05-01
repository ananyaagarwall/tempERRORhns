// Centralized API configuration.
// `VITE_API_BASE_URL` may be provided either as the backend origin
// (`https://backend.example.com`) or already suffixed with `/api`.
const DEFAULT_HOST =
  typeof window !== "undefined" && window.location && window.location.hostname
    ? window.location.hostname
    : "127.0.0.1";

const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${DEFAULT_HOST}:5000`;

const normalizeApiBaseUrl = (url) =>
  String(url || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");

const isLoopbackHost = (host) => {
  const value = String(host || "").trim().toLowerCase();
  return value === "localhost" || value === "127.0.0.1";
};

const alignLoopbackHostToFrontend = (baseUrl) => {
  if (typeof window === "undefined" || !window.location) {
    return baseUrl;
  }

  const frontendHost = window.location.hostname;
  if (!isLoopbackHost(frontendHost)) {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);
    if (isLoopbackHost(url.hostname) && url.hostname !== frontendHost) {
      url.hostname = frontendHost;
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    // Ignore URL parse failures and fall back to the raw string.
  }

  return baseUrl;
};

const API_BASE_URL = alignLoopbackHostToFrontend(normalizeApiBaseUrl(RAW_API_BASE_URL));
export const API_API_URL = `${API_BASE_URL}/api`;

export default API_BASE_URL;
