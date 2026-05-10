/**
 * Centralized API client for the Student Management System backend.
 * All requests go through here — handles base URL, JWT tokens, and token refresh.
 */

const BASE_URL = "http://127.0.0.1:8000/api";

// ── Token helpers ─────────────────────────────────────────────────────────

export function getAccessToken() {
  return localStorage.getItem("access_token");
}

export function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

export function saveTokens({ access, refresh }) {
  localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("current_user");
}

// ── Core fetch wrapper ────────────────────────────────────────────────────

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("No refresh token");

  const res = await fetch(`${BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearTokens();
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  const data = await res.json();
  saveTokens({ access: data.access, refresh: data.refresh });
  return data.access;
}

/**
 * Main API call function.
 * Automatically attaches the JWT token and retries once on 401.
 *
 * @param {string} path  - e.g. "/students/" or "/auth/login/"
 * @param {object} opts  - fetch options (method, body, etc.)
 * @param {boolean} auth - whether to attach Authorization header (default true)
 */
export async function api(path, opts = {}, auth = true) {
  const headers = { "Content-Type": "application/json", ...opts.headers };

  if (auth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...opts, headers });
  } catch (networkErr) {
    // Backend is not reachable at all (connection refused, etc.)
    const err = new Error("Cannot connect to backend. Make sure it is running: python manage.py runserver 8000");
    err.status = 0;
    err.isBackendDown = true;
    throw err;
  }

  // Token expired — try to refresh once
  if (res.status === 401 && auth) {
    try {
      const newToken = await refreshAccessToken();
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...opts, headers });
    } catch {
      return null;
    }
  }

  // No content (DELETE, etc.)
  if (res.status === 204) return null;

  // Check content type — if HTML is returned, the backend is not running
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const err = new Error("Backend server is not running. Please start it with: python manage.py runserver 8000");
    err.status = res.status;
    err.isBackendDown = true;
    throw err;
  }

  const data = await res.json();

  if (!res.ok) {
    // Throw a structured error with the response body
    const err = new Error(data?.detail || JSON.stringify(data) || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ── Convenience methods ───────────────────────────────────────────────────

export const apiGet    = (path, opts)              => api(path, { method: "GET",    ...opts });
export const apiPost   = (path, body, opts)        => {
  const { auth, ...rest } = opts || {};
  return api(path, { method: "POST", body: JSON.stringify(body), ...rest }, auth !== undefined ? auth : true);
};
export const apiPut    = (path, body, opts)        => api(path, { method: "PUT",    body: JSON.stringify(body), ...opts });
export const apiPatch  = (path, body, opts)        => api(path, { method: "PATCH",  body: JSON.stringify(body), ...opts });
export const apiDelete = (path, opts)              => api(path, { method: "DELETE", ...opts });
