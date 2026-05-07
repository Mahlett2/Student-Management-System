import { useState, useMemo, useEffect } from "react";
import { apiGet } from "../../api/client";

const YEARS     = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];
const SEMESTERS = ["Semester 1", "Semester 2"];

const GPA_MAP = { "A+": 4.0, A: 4.0, "A-": 3.7, "B+": 3.3, B: 3.0, "B-": 2.7, "C+": 2.3, C: 2.0, "C-": 1.7, D: 1.0, F: 0.0 };

const SCORE_COMPONENTS = [
  { key: "scoreAssignment", label: "Assign", max: 10 },
  { key: "scoreTest1",      label: "Test1",  max: 10 },
  { key: "scoreMid",        label: "Mid",    max: 30 },
  { key: "scoreProject",    label: "Project",max: 10 },
  { key: "scoreFinal",      label: "Final",  max: 40 },
];

function toLetterGrade(g) {
  const n = Number(g);
  if (isNaN(n)) return g || "—";
  if (n > 90)  return "A+";
  if (n >= 85) return "A";
  if (n >= 80) return "A-";
  if (n >= 75) return "B+";
  if (n >= 70) return "B";
  if (n >= 65) return "B-";
  if (n >= 60) return "C+";
  if (n >= 55) return "C";
  if (n >= 50) return "C-";
  if (n >= 45) return "D";
  return "F";
}

function gradeColor(g) {
  const l = toLetterGrade(g);
  if (["A+","A","A-"].includes(l)) return { bg: "#DCFCE7", text: "#15803D" };
  if (["B+","B","B-"].includes(l)) return { bg: "#DBEAFE", text: "#1D4ED8" };
  if (["C+","C","C-"].includes(l)) return { bg: "#FEF9C3", text: "#A16207" };
  if (l === "D") return { bg: "#FFEDD5", text: "#C2410C" };
  return { bg: "#FEE2E2", text: "#DC2626" };
}

export default function Grades() {
  const stored = localStorage.getItem("current_user");
  const user = stored ? JSON.parse(stored) : {};
  const studentName = user.full_name || user.username || "";

  const [allGrades, setAllGrades] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedYear, setSelectedYear]         = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);

  useEffect(() => {
    apiGet("/results/?page_size=1000")
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        const normalized = list
          .filter((r) => {
            const name = r.student_name || r.studentName || "";
            return name.toLowerCase() === studentName.toLowerCase();
          })
          .map((r) => ({
            ...r,
            studentName:    r.student_name     || r.studentName    || "",
            uploadedBy:     r.uploaded_by_name || r.uploadedBy     || "",
            subject:        r.subject          || "",
            period:         r.period           || "",
            grade:          r.grade            || "",
            total:          r.total            ?? null,
            scoreAssignment: r.scoreAssignment ?? r.score_assignment ?? "",
            scoreTest1:      r.scoreTest1      ?? r.score_test1      ?? "",
            scoreMid:        r.scoreMid        ?? r.score_mid        ?? "",
            scoreProject:    r.scoreProject    ?? r.score_project    ?? "",
            scoreFinal:      r.scoreFinal      ?? r.score_final      ?? "",
          }));
        setAllGrades(normalized);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentName]);

  // Extract unique years from grade periods (e.g. "Semester 1 2024" → infer year from student's year)
  // Group by period string — periods look like "Semester 1 2024"
  const periods = useMemo(() => [...new Set(allGrades.map((g) => g.period))].sort(), [allGrades]);

  // For year/semester navigation, parse periods
  // Period format: "Semester 1 2024" or "Semester 2 2025"
  // We group by year-index based on order of unique academic years
  const academicYears = useMemo(() => {
    const yearSet = new Set();
    periods.forEach((p) => {
      const match = p.match(/\d{4}/);
      if (match) yearSet.add(match[0]);
    });
    return [...yearSet].sort();
  }, [periods]);

  // Grades for selected year + semester
  const filteredGrades = useMemo(() => {
    if (!selectedYear || !selectedSemester) return [];
    return allGrades.filter((g) => {
      const p = g.period || "";
      return p.includes(selectedSemester) && p.includes(selectedYear);
    });
  }, [allGrades, selectedYear, selectedSemester]);

  // GPA for filtered set
  const gpaValues = filteredGrades.map((g) => GPA_MAP[toLetterGrade(g.grade)]).filter((v) => v !== undefined);
  const semGpa = gpaValues.length > 0 ? (gpaValues.reduce((s, v) => s + v, 0) / gpaValues.length).toFixed(2) : null;
  const semAvg = filteredGrades.filter((g) => !isNaN(Number(g.total))).reduce((s, g, _, a) => s + Number(g.total) / a.length, 0);

  // Overall GPA
  const allGpaValues = allGrades.map((g) => GPA_MAP[toLetterGrade(g.grade)]).filter((v) => v !== undefined);
  const overallGpa = allGpaValues.length > 0 ? (allGpaValues.reduce((s, v) => s + v, 0) / allGpaValues.length).toFixed(2) : null;

  if (loading) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#0369A1" }}>⏳ Loading grades...</div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ color: "#E0F2FE", margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>📊 My Grades</h2>
          <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.82rem" }}>{studentName}</p>
        </div>
        {overallGpa && (
          <div style={{ textAlign: "center", background: "rgba(56,189,248,0.1)", borderRadius: "12px", padding: "10px 20px", border: "1px solid rgba(56,189,248,0.2)" }}>
            <p style={{ color: "#64748B", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", margin: 0 }}>Overall GPA</p>
            <p style={{ color: "#38BDF8", fontSize: "1.8rem", fontWeight: "800", margin: "2px 0 0" }}>{overallGpa}</p>
          </div>
        )}
      </div>

      {allGrades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC", borderRadius: "14px", color: "#0369A1" }}>
          <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>📭</p>
          <p style={{ fontWeight: "600" }}>No grades uploaded yet.</p>
          <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>Your grades will appear here once the teacher uploads them.</p>
        </div>
      ) : (
        <>
          {/* Step 1: Select Academic Year */}
          <div style={{ marginBottom: "1.25rem" }}>
            <p style={{ color: "#0C4A6E", fontWeight: "700", fontSize: "0.85rem", textTransform: "uppercase", margin: "0 0 10px" }}>
              📅 Select Academic Year
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {academicYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => { setSelectedYear(yr); setSelectedSemester(null); }}
                  style={{
                    padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer",
                    fontWeight: "700", fontSize: "0.9rem",
                    background: selectedYear === yr ? "linear-gradient(135deg,#0F172A,#1E293B)" : "#BAE6FD",
                    color: selectedYear === yr ? "#38BDF8" : "#0C4A6E",
                    boxShadow: selectedYear === yr ? "0 3px 10px rgba(0,0,0,0.2)" : "none",
                    transition: "all 0.18s",
                  }}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Semester */}
          {selectedYear && (
            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ color: "#0C4A6E", fontWeight: "700", fontSize: "0.85rem", textTransform: "uppercase", margin: "0 0 10px" }}>
                🗓️ Select Semester
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                {SEMESTERS.map((sem) => {
                  const hasGrades = allGrades.some((g) => g.period?.includes(sem) && g.period?.includes(selectedYear));
                  return (
                    <button
                      key={sem}
                      onClick={() => setSelectedSemester(sem)}
                      disabled={!hasGrades}
                      style={{
                        padding: "10px 24px", borderRadius: "10px", border: "none",
                        cursor: hasGrades ? "pointer" : "not-allowed",
                        fontWeight: "700", fontSize: "0.9rem",
                        background: selectedSemester === sem
                          ? "linear-gradient(135deg,#0F172A,#1E293B)"
                          : hasGrades ? "#BAE6FD" : "#E2E8F0",
                        color: selectedSemester === sem ? "#38BDF8" : hasGrades ? "#0C4A6E" : "#94A3B8",
                        boxShadow: selectedSemester === sem ? "0 3px 10px rgba(0,0,0,0.2)" : "none",
                        transition: "all 0.18s",
                        opacity: hasGrades ? 1 : 0.5,
                      }}
                    >
                      {sem}
                      {!hasGrades && <span style={{ fontSize: "0.72rem", marginLeft: "6px" }}>(no grades)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Show grades table */}
          {selectedYear && selectedSemester && (
            <>
              {/* Summary */}
              <div style={{ background: "#7DD3FC", borderRadius: "12px", padding: "14px 18px", marginBottom: "1rem", border: "1px solid rgba(14,165,233,0.2)", display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <p style={{ color: "#0C4A6E", fontWeight: "700", margin: 0 }}>{selectedYear} · {selectedSemester}</p>
                  <p style={{ color: "#0369A1", fontSize: "0.82rem", margin: "3px 0 0" }}>{filteredGrades.length} course{filteredGrades.length !== 1 ? "s" : ""}</p>
                </div>
                {semGpa && (
                  <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "10px", padding: "8px 16px", textAlign: "center" }}>
                    <p style={{ color: "#64748B", fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", margin: 0 }}>Semester GPA</p>
                    <p style={{ color: "#38BDF8", fontWeight: "800", fontSize: "1.2rem", margin: "2px 0 0" }}>{semGpa}</p>
                  </div>
                )}
                {semAvg > 0 && (
                  <div style={{ background: "#BAE6FD", borderRadius: "10px", padding: "8px 16px", textAlign: "center" }}>
                    <p style={{ color: "#0369A1", fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", margin: 0 }}>Avg Score</p>
                    <p style={{ color: "#0C4A6E", fontWeight: "800", fontSize: "1.2rem", margin: "2px 0 0" }}>{semAvg.toFixed(1)}%</p>
                  </div>
                )}
              </div>

              {filteredGrades.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", background: "#7DD3FC", borderRadius: "12px", color: "#0369A1" }}>
                  <p>No grades for {selectedSemester} {selectedYear}.</p>
                </div>
              ) : (
                <div style={{ background: "#7DD3FC", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(14,165,233,0.2)", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                    <thead>
                      <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
                        {["#", "Subject", "Teacher", ...SCORE_COMPONENTS.map((c) => `${c.label}\n/${c.max}`), "Total", "Grade", "Letter", "Status"].map((h) => (
                          <th key={h} style={{ padding: "11px 10px", textAlign: "center", color: "#38BDF8", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", whiteSpace: "pre-line", lineHeight: "1.3" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGrades.map((g, i) => {
                        const letter = toLetterGrade(g.grade);
                        const col = gradeColor(g.grade);
                        const passed = letter !== "F";
                        return (
                          <tr key={g.id || i} style={{ background: i % 2 === 0 ? "#7DD3FC" : "#BAE6FD", borderBottom: "1px solid rgba(14,165,233,0.12)" }}>
                            <td style={{ padding: "10px 10px", textAlign: "center", color: "#0369A1", fontWeight: "600" }}>{i + 1}</td>
                            <td style={{ padding: "10px 10px", fontWeight: "600", color: "#0C4A6E" }}>{g.subject}</td>
                            <td style={{ padding: "10px 10px", color: "#0369A1", fontSize: "0.82rem" }}>{g.uploadedBy || "—"}</td>
                            {SCORE_COMPONENTS.map((c) => (
                              <td key={c.key} style={{ padding: "10px 8px", textAlign: "center", color: "#0C4A6E", fontWeight: "600", fontSize: "0.85rem" }}>
                                {g[c.key] !== "" && g[c.key] != null ? g[c.key] : <span style={{ color: "#94A3B8" }}>—</span>}
                              </td>
                            ))}
                            <td style={{ padding: "10px 8px", textAlign: "center" }}>
                              <span style={{ fontWeight: "800", fontSize: "0.95rem", color: Number(g.total) >= 85 ? "#15803D" : Number(g.total) >= 50 ? "#1D4ED8" : "#DC2626" }}>
                                {g.total != null ? Number(g.total).toFixed(1) : "—"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 8px", textAlign: "center", fontWeight: "700", color: "#0C4A6E" }}>{g.grade || "—"}</td>
                            <td style={{ padding: "10px 8px", textAlign: "center" }}>
                              <span style={{ background: col.bg, color: col.text, padding: "3px 10px", borderRadius: "20px", fontWeight: "800", fontSize: "0.82rem" }}>{letter}</span>
                            </td>
                            <td style={{ padding: "10px 8px", textAlign: "center" }}>
                              <span style={{ background: passed ? "#DCFCE7" : "#FEE2E2", color: passed ? "#15803D" : "#DC2626", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" }}>
                                {passed ? "✅ Pass" : "❌ Fail"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {!selectedYear && (
            <div style={{ textAlign: "center", padding: "2rem", background: "#7DD3FC", borderRadius: "12px", color: "#0369A1" }}>
              <p style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>☝️</p>
              <p style={{ fontWeight: "600" }}>Select an academic year above to view your grades.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
