/**
 * announcementsStore — backed by Django REST API.
 * GET /api/announcements/ (filtered by role on the backend)
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiGet } from "../api/client";

const AnnouncementsContext = createContext(null);

export function AnnouncementsProvider({ children }) {
  const [announcements, setAnnouncementsState] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (!role) return;
    setLoading(true);
    apiGet("/announcements/?page_size=100")
      .then((data) => {
        if (data) {
          const list = data.results ?? data;
          const normalized = list.map((a) => ({
            ...a,
            // normalize date fields
            createdAt:  a.created_at  || a.createdAt  || "",
            updatedAt:  a.updated_at  || a.updatedAt  || "",
            postedAt:   a.posted_at   || a.postedAt   || "",
            // normalize audience field
            audience:   a.audience || "All",
            category:   a.category || "General",
          }));
          setAnnouncementsState(normalized);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setAnnouncements = useCallback((updater) => {
    setAnnouncementsState((prev) =>
      typeof updater === "function" ? updater(prev) : updater
    );
  }, []);

  return (
    <AnnouncementsContext.Provider value={{ announcements, setAnnouncements, loading }}>
      {children}
    </AnnouncementsContext.Provider>
  );
}

export function useAnnouncements() {
  return useContext(AnnouncementsContext);
}
