/**
 * resultsStore — backed by Django REST API.
 * GET/POST/PUT/DELETE /api/results/
 * Keeps the same { results, setResults } interface.
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiGet } from "../api/client";

const ResultsContext = createContext(null);

export function ResultsProvider({ children }) {
  const [results, setResultsState] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (!role) return;
    setLoading(true);
    apiGet("/results/?page_size=1000")
      .then((data) => {
        if (data) {
          // Normalise API shape → legacy shape used by components
          const normalised = (data.results ?? data).map((r) => ({
            ...r,
            studentName:     r.student_name      ?? r.studentName     ?? "",
            studentId:       r.student_code      ?? r.studentId       ?? "",
            uploadedBy:      r.uploaded_by_name  ?? r.uploadedBy      ?? "",
            assessmentType:  r.assessment_type   ?? r.assessmentType  ?? "",
            total:           r.total             ?? r.score           ?? null,
            // Score components — support both camelCase and snake_case
            scoreAssignment: r.scoreAssignment   ?? r.score_assignment ?? "",
            scoreTest1:      r.scoreTest1        ?? r.score_test1      ?? "",
            scoreMid:        r.scoreMid          ?? r.score_mid        ?? "",
            scoreProject:    r.scoreProject      ?? r.score_project    ?? "",
            scoreFinal:      r.scoreFinal        ?? r.score_final      ?? "",
          }));
          setResultsState(normalised);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setResults = useCallback((updater) => {
    setResultsState((prev) =>
      typeof updater === "function" ? updater(prev) : updater
    );
  }, []);

  return (
    <ResultsContext.Provider value={{ results, setResults, loading }}>
      {children}
    </ResultsContext.Provider>
  );
}

export function useResults() {
  return useContext(ResultsContext);
}
