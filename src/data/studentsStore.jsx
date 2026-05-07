/**
 * studentsStore — backed by Django REST API.
 * GET/POST/PUT/DELETE /api/students/
 * Keeps the same { students, setStudents } interface so components don't change.
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "../api/client";

const StudentsContext = createContext(null);

export function StudentsProvider({ children }) {
  const [students, setStudentsState] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load all students from API on mount
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") return; // only admin fetches the full list
    setLoading(true);
    apiGet("/students/?page_size=1000")
      .then((data) => {
        if (data) {
          const list = data.results ?? data;
          // Normalize API snake_case → camelCase used by components
          const normalized = list.map((s) => ({
            ...s,
            fullName:       s.full_name       ?? s.fullName       ?? "",
            studentId:      s.student_id      ?? s.studentId      ?? "",
            enrollmentDate: s.enrollment_date ?? s.enrollmentDate ?? "",
            department:     typeof s.department === "object" ? s.department?.name : s.department ?? "",
            username:       s.username        ?? "",
            section:        s.section         ?? "",
            year:           s.year            ?? "",
          }));
          setStudentsState(normalized);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /**
   * setStudents — accepts either a new array or an updater function.
   * Mirrors the old localStorage pattern so components work unchanged.
   * For actual persistence, components should call the API directly;
   * this keeps local state in sync for optimistic updates.
   */
  const setStudents = useCallback((updater) => {
    setStudentsState((prev) =>
      typeof updater === "function" ? updater(prev) : updater
    );
  }, []);

  return (
    <StudentsContext.Provider value={{ students, setStudents, loading }}>
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  return useContext(StudentsContext);
}
