import { useState, useMemo } from "react";
import { useResults } from "../../data/resultsStore";

// Convert numeric score to letter grade
function toLetterGrade(g) {
  const n = Number(g);
  if (isNaN(n)) return g;
  if (n >= 90) return "A";
  if (n >= 85) return "A-";
  if (n >= 80) return "B+";
  if (n >= 75) return "B";
  if (n >= 70) return "B-";
  if (n >= 65) return "C+";
  if (n >= 60) return "C";
  if (n >= 50) return "D";
  return "F";
}

// Convert letter grade to GPA points (4.0 scale)
function toGpaPoints(g) {
  const letter = toLetterGrade(g);
  const map = { A: 4.0, "A-": 3.7, "B+": 3.3, B: 3.0, "B-": 2.7, "C+": 2.3, C: 2.0, "C-": 1.7, "D+": 1.3, D: 1.0, F: 0.0 };
  return map[letter] ?? null;
}

function gradeColor(g) {
  const letter = toLetterGrade(g);
  if (["A", "A-"].includes(letter)) return { bg: "#DCFCE7", text: "#15803D" };
  if (["B+", "B", "B-"].includes(letter)) return { bg: "#DBEAFE", text: "#1D4ED8" };
  if (["C+", "C"].includes(letter)) return { bg: "#FEF9C3", text: "#A16207" };
  if (letter === "D") return { bg: "#FFEDD5", text: "#C2410C" };
  return { bg: "#FEE2E2", text: "#DC2626" };
}

export default function Grades() {
  const { results } = useResults();
  const stored = localStorage.getItem("student");
  const student = stored ? JSON.parse(stored) : {};

  const [filterSemester, setFilterSemester] = useState("");

  // All grades for this student
  const myGrades = useMemo(() =>
    results.filter((r) => r.studentName?.toLowerCase() === student.name?.toLowerCase()),
    [results, student.name]
  );

  // Unique semesters
  const semesters = useMemo(() =>
    [...new Set(myGrades.map((g) => g.period))].sort(),
    [myGrades]
  );

  // Filtered grades
  const filtered = useMemo(() =>
    filterSemester ? myGrades.filter((g) => g.period === filterSemester) : myGrades,
    [myGrades, filterSemester]
  );

  // GPA for filtered set
  const gpaGrades = filtered.filter((g) => toGpaPoints(g.grade) !== null);
  const gpa = gpaGrades.length > 0
    ? (gpaGrades.reduce((s, g) => s + toGpaPoints(g.grade), 0) / gpaGrades.length).toFixed(2)
    : null;

  // Overall GPA
  const allGpaGrades = myGrades.filter((g) => toGpaPoints(g.grade) !== null);
  const overallGpa = allGpaGrades.length > 0
    ? (allGpaGrades.reduce((s, g) => s + toGpaPoints(g.grade), 0) / allGpaGrades.length).toFixed(2)
    : null;

  // Numeric average
  const numericGrades = filtered.filter((g) => !isNaN(Number(g.grade)));
  const avg = numericGrades.length > 0
    ? (numericGrades.reduce((s, g) => s + Number(g.grade), 0) / numericGrades.length).toFixed(1)
    : null;

  // Group by semester for display
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((g) => {
      if (!map[g.period]) map[g.period] = [];
      map[g.period].push(g);
    });
    return map;
  }, [filtered]);

  const gpaLabel = (g) => {
    if (g >= 3.7) return "Excellent";
    if (g >= 3.0) return "Very Good";
    if (g >= 2.0) return "Good";
    if (g >= 1.0) return "Satisfactory";
    return "Fail";
  };

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ color: "#E0F2FE", margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>📊 My Grades</h2>
          <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.82rem" }}>{student.name} · {student.department}</p>
        </div>
        {overallGpa && (
          <div style={{ textAlign: "center", background: "rgba(56,189,248,0.1)", borderRadius: "12px", padding: "10px 20px", border: "1px solid rgba(56,189,248,0.2)" }}>
            <p style={{ color: "#64748B", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", margin: 0 }}>Overall GPA</p>
            <p style={{ color: "#38BDF8", fontSize: "1.8rem", fontWeight: "800", margin: "2px 0 0" }}>{overallGpa}</p>
            <p style={{ color: "#64748B", fontSize: "0.72rem", margin: 0 }}>{gpaLabel(Number(overallGpa))}</p>
          </div>
        )}
      </div>

      {/* Filter + summary */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}
            style={{ width: "100%", padding: "10px 13px", borderRadius: "8px", border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem", outline: "none" }}>
            <option value="">All Semesters</option>
            {semesters.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Summary cards */}
        {[
          { label: "Subjects", value: filtered.length, icon: "📚" },
          { label: filterSemester ? "Semester GPA" : "Overall GPA", value: gpa ?? "—", icon: "🎯" },
          { label: "Avg Score", value: avg ? `${avg}%` : "—", icon: "📈" },
        ].map((c) => (
          <div key={c.label} style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "10px", padding: "10px 16px", border: "1px solid rgba(56,189,248,0.15)", textAlign: "center", minWidth: "100px" }}>
            <p style={{ fontSize: "1.1rem", margin: 0 }}>{c.icon}</p>
            <p style={{ color: "#38BDF8", fontWeight: "800", fontSize: "1.1rem", margin: "2px 0" }}>{c.value}</p>
            <p style={{ color: "#64748B", fontSize: "0.7rem", fontWeight: "600", textTransform: "uppercase", margin: 0 }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Grades */}
      {myGrades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC", borderRadius: "14px", color: "#0369A1" }}>
          <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>📭</p>
          <p style={{ fontWeight: "600" }}>No grades uploaded yet.</p>
          <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>Your grades will appear here once the admin uploads them.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", background: "#7DD3FC", borderRadius: "14px", color: "#0369A1" }}>
          <p>No grades found for the selected semester.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([semester, grades]) => {
          const semGpaGrades = grades.filter((g) => toGpaPoints(g.grade) !== null);
          const semGpa = semGpaGrades.length > 0
            ? (semGpaGrades.reduce((s, g) => s + toGpaPoints(g.grade), 0) / semGpaGrades.length).toFixed(2)
            : null;
          const semNumeric = grades.filter((g) => !isNaN(Number(g.grade)));
          const semAvg = semNumeric.length > 0
            ? (semNumeric.reduce((s, g) => s + Number(g.grade), 0) / semNumeric.length).toFixed(1)
            : null;

          return (
            <div key={semester} style={{ marginBottom: "1.5rem" }}>
              {/* Semester header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <h3 style={{ color: "#0C4A6E", margin: 0, fontSize: "0.95rem", fontWeight: "700" }}>
                  🗓️ {semester}
                </h3>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  {semGpa && (
                    <span style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>
                      GPA: {semGpa}
                    </span>
                  )}
                  {semAvg && (
                    <span style={{ background: "#BAE6FD", color: "#0C4A6E", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>
                      Avg: {semAvg}%
                    </span>
                  )}
                </div>
              </div>

              {/* Grades table */}
              <div style={{ background: "#7DD3FC", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(14,165,233,0.2)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
                      {["Subject", "Score", "Letter", "GPA Points", "Status"].map((h) => (
                        <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "#38BDF8", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g, i) => {
                      const letter = toLetterGrade(g.grade);
                      const col = gradeColor(g.grade);
                      const pts = toGpaPoints(g.grade);
                      const passed = letter !== "F";
                      return (
                        <tr key={g.id} style={{ background: i % 2 === 0 ? "#7DD3FC" : "#BAE6FD", borderBottom: "1px solid rgba(14,165,233,0.12)" }}>
                          <td style={{ padding: "11px 14px", fontWeight: "600", color: "#0C4A6E" }}>{g.subject}</td>
                          <td style={{ padding: "11px 14px", color: "#0C4A6E", fontFamily: "monospace", fontWeight: "700" }}>{g.grade}</td>
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{ background: col.bg, color: col.text, padding: "3px 12px", borderRadius: "20px", fontWeight: "800", fontSize: "0.85rem" }}>
                              {letter}
                            </span>
                          </td>
                          <td style={{ padding: "11px 14px", color: "#0C4A6E", fontWeight: "700" }}>
                            {pts !== null ? pts.toFixed(1) : "—"}
                          </td>
                          <td style={{ padding: "11px 14px" }}>
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
            </div>
          );
        })
      )}

      {/* GPA scale legend */}
      <div style={{ background: "#7DD3FC", borderRadius: "12px", padding: "14px 18px", border: "1px solid rgba(14,165,233,0.2)", marginTop: "1rem" }}>
        <p style={{ color: "#0C4A6E", fontWeight: "700", fontSize: "0.8rem", margin: "0 0 8px", textTransform: "uppercase" }}>GPA Scale Reference</p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {[["A", "4.0", "#15803D"], ["A-", "3.7", "#15803D"], ["B+", "3.3", "#1D4ED8"], ["B", "3.0", "#1D4ED8"], ["B-", "2.7", "#1D4ED8"], ["C+", "2.3", "#A16207"], ["C", "2.0", "#A16207"], ["D", "1.0", "#C2410C"], ["F", "0.0", "#DC2626"]].map(([l, p, c]) => (
            <span key={l} style={{ fontSize: "0.75rem", color: c, fontWeight: "600" }}>{l} = {p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
