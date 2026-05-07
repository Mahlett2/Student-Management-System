/**
 * Auth store — now backed by the Django REST API.
 * Replaces the old localStorage-only implementation.
 *
 * login()  → POST /api/auth/login/  → stores JWT tokens + user
 * logout() → POST /api/auth/logout/ → blacklists refresh token
 * can()    → checks role-based page access
 */

import { createContext, useContext, useState, useCallback } from "react";
import { apiPost, saveTokens, clearTokens, getAccessToken } from "../api/client";

// ── Role → allowed pages mapping (mirrors backend roles) ─────────────────
export const ROLE_PERMISSIONS = {
  admin:   ["students", "teachers", "classes", "subjects", "timetable", "results", "attendance", "announcements", "users", "settings"],
  teacher: ["classes", "subjects", "timetable", "results", "attendance", "announcements"],
  student: ["results", "attendance", "announcements"],
};

// ── Load persisted user from localStorage ─────────────────────────────────
function loadUser() {
  try {
    const s = localStorage.getItem("current_user");
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [currentAdmin, setCurrentAdmin] = useState(() => loadUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Login — calls POST /api/auth/login/
   * Returns true on success, false on failure.
   */
  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost("/auth/login/", { username, password }, { auth: false });
      if (!data) throw new Error("No response from server");

      // Save JWT tokens
      saveTokens({ access: data.access, refresh: data.refresh });

      // Normalise user shape to match what the rest of the app expects
      const user = {
        ...data.user,
        fullName: data.user.full_name,   // alias for legacy components
      };

      setCurrentAdmin(user);
      localStorage.setItem("current_user", JSON.stringify(user));

      // Also store role for legacy checks (TeacherPortal, StudentPortal)
      localStorage.setItem("role", user.role);

      return true;
    } catch (err) {
      setError(err.message || "Invalid credentials");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout — blacklists the refresh token then clears local state.
   */
  const logout = useCallback(async () => {
    try {
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        await apiPost("/auth/logout/", { refresh });
      }
    } catch {
      // Ignore errors — clear locally regardless
    }
    clearTokens();
    localStorage.removeItem("current_user");
    localStorage.removeItem("role");
    setCurrentAdmin(null);
  }, []);

  /**
   * Check if the current user has access to a given page/section.
   */
  const can = useCallback((page) => {
    if (!currentAdmin) return false;
    const role = currentAdmin.role;
    return (ROLE_PERMISSIONS[role] || []).includes(page);
  }, [currentAdmin]);

  /**
   * Check if a valid access token exists (used by ProtectedRoute).
   */
  const isAuthenticated = Boolean(currentAdmin && getAccessToken());

  return (
    <AdminContext.Provider value={{
      currentAdmin,
      login,
      logout,
      can,
      isAuthenticated,
      loading,
      error,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
