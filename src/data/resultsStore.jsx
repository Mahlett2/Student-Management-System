import { createContext, useContext, useState, useEffect } from "react";

/**
 * Result record shape:
 * {
 *   id: number,
 *   studentName: string,
 *   studentId: string,        // WOUR/XXXX/YY — auto-filled from student list
 *   department: string,
 *   subject: string,
 *   period: string,
 *   uploadedBy: string,       // teacher name
 *
 *   // Component scores (each stored as a number string or "")
 *   scoreAssignment: string,  // max 10
 *   scoreTest1: string,       // max 10
 *   scoreMid: string,         // max 30
 *   scoreProject: string,     // max 10
 *   scoreFinal: string,       // max 40
 *
 *   // Computed — stored for quick display, always re-derivable
 *   total: number,            // sum of entered scores
 *   grade: string,            // letter grade derived from total
 * }
 */

const ResultsContext = createContext(null);

export function ResultsProvider({ children }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const s = localStorage.getItem("results_data");
    if (s) setResults(JSON.parse(s));
  }, []);

  useEffect(() => {
    localStorage.setItem("results_data", JSON.stringify(results));
  }, [results]);

  return (
    <ResultsContext.Provider value={{ results, setResults }}>
      {children}
    </ResultsContext.Provider>
  );
}

export function useResults() {
  return useContext(ResultsContext);
}
