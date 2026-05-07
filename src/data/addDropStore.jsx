/**
 * addDropStore — backed by Django REST API.
 * GET /api/add-drop/
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiGet } from "../api/client";

const AddDropContext = createContext(null);

export function AddDropProvider({ children }) {
  const [requests, setRequestsState] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (!role) return;
    setLoading(true);
    apiGet("/add-drop/?page_size=500")
      .then((data) => {
        if (data) {
          const list = data.results ?? data;
          const normalized = list.map((r) => ({
            ...r,
            studentName: r.student_name || r.studentName || "",
            studentId:   r.student_code || r.studentId || "",
            // normalize type/course field names
            type:        r.request_type || r.type || "",
            course:      r.subject      || r.course || "",
            submittedAt: r.submitted_at || r.submittedAt || "",
          }));
          setRequestsState(normalized);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setRequests = useCallback((updater) => {
    setRequestsState((prev) =>
      typeof updater === "function" ? updater(prev) : updater
    );
  }, []);

  return (
    <AddDropContext.Provider value={{ requests, setRequests, loading }}>
      {children}
    </AddDropContext.Provider>
  );
}

export function useAddDrop() {
  return useContext(AddDropContext);
}
