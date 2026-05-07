import { useState, useMemo } from "react";
import { useResults } from "../data/resultsStore";

const DEPARTMENTS = [
  "Software Engineering", "Computer Science",
  "Information Systems", "Information Technology",
  "Civil Engineering", "Electrical Engineering",
  "Mechanical Engineering", "Chemical Engineering",
];

const SCORE_COMPONENTS = [
  { key: "scoreAssignment", label: "Assign", max: 10 },
  { key: "scoreTest1",      label: "Test1",  max: 10 },
  { key: "scoreMid",        label: "Mid",    max: 30 },
  { key: "scoreProject",    label: "Project",max: 10 },
  { key: "scoreFinal",      label: "Final",  max: 40 },
];

// Convert numeric grade to letter
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

function gradeColor(g) {
  const letter = toLetterGrade(g);
  if (["A", "A-"].includes(letter)) return { bg: "#dcfce7", text: "#15803d" };
  if (["B+", "B", "B-"].includes(letter)) return { bg: "#dbeafe", text: "#1d4ed8" };
  if (["C+", "C"].includes(letter)) return { bg: "#fef9c3", text: "#a16207" };
  if (letter === "D") return { bg: "#ffedd5", text: "#c2410c" };
  return { bg: "#fee2e2", text: "#dc2626" };
}

export default function ResultsManagement({ goBack }) {
  const { results } = useResults();
  const [view, setView] = useState("list"); // list | report
  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");  const [reportStudent, setReportStudent] = useState("");

  const periods = useMemo(
    () => [...new Set(results.map((r) => r.period))].sort(),
    [results]
  );
  const teachers = useMemo(
    () => [...new Set(results.map((r) => r.uploadedBy).filter(Boolean))].sort(),
    [results]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return results.filter(
      (r) =>
        (!q ||
          r.studentName?.toLowerCase().includes(q) ||
          r.subject?.toLowerCase().includes(q) ||
          r.studentId?.toLowerCase().includes(q)) &&
        (!filterPeriod || r.period === filterPeriod) &&
        (!filterDept || r.department === filterDept) &&
        (!filterTeacher || r.uploadedBy === filterTeacher)
    );
  }, [results, search, filterPeriod, filterDept, filterType, filterTeacher]);

  // Report: group by student
  const reportData = useMemo(() => {
    const q = reportStudent.toLowerCase();
    const relevant = results.filter(
      (r) =>
        !q ||
        r.studentName?.toLowerCase().includes(q) ||
        r.studentId?.toLowerCase().includes(q)
    );
    const map = {};
    relevant.forEach((r) => {
      const key = r.studentId || r.studentName;
      if (!map[key])
        map[key] = {
          name: r.studentName,
          id: r.studentId,
          department: r.department,
          grades: [],
        };
      map[key].grades.push(r);
    });
    return Object.values(map);
  }, [results, reportStudent]);

  const printReport = () => window.print();

  /* ── REPORT VIEW ── */
  if (view === "report")
    return (
      <div>
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ color: "#5b21b6", margin: 0 }}>📋 Grade Reports</h2>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={printReport} style={saveBtn}>
              🖨️ Print Report
            </button>
            <button onClick={() => setView("list")} style={backBtn}>
              ⬅ Back
            </button>
          </div>
        </div>

        <div className="no-print" style={{ marginBottom: "1.25rem" }}>
          <input
            placeholder="🔍 Search student by name or ID..."
            value={reportStudent}
            onChange={(e) => setReportStudent(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "0.9rem",
            }}
          />
        </div>

        {reportData.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              background: "white",
              borderRadius: "12px",
              color: "#6b7280",
            }}
          >
            <p style={{ fontSize: "2rem" }}>📋</p>
            <p>No results found. Teachers need to upload results first.</p>
          </div>
        ) : (
          reportData.map((student) => {
            const numericGrades = student.grades.filter(
              (g) => !isNaN(Number(g.grade))
            );
            const avg =
              numericGrades.length > 0
                ? numericGrades.reduce((sum, g) => sum + Number(g.grade), 0) /
                  numericGrades.length
                : null;

            return (
              <div
                key={student.id || student.name}
                style={{ ...card, marginBottom: "1.5rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "1rem",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    <h3 style={{ color: "#5b21b6", margin: 0 }}>{student.name}</h3>
                    <p
                      style={{
                        color: "#6b7280",
                        margin: "4px 0 0",
                        fontSize: "0.85rem",
                      }}
                    >
                      {student.id && `ID: ${student.id} · `}
                      {student.department || ""}
                    </p>
                  </div>
                  {avg !== null && (
                    <div
                      style={{
                        background: "#ede9fe",
                        borderRadius: "10px",
                        padding: "0.5rem 1rem",
                        textAlign: "center",
                      }}
                    >
                      <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>
                        Average
                      </p>
                      <p
                        style={{
                          fontWeight: "700",
                          color: "#5b21b6",
                          margin: 0,
                          fontSize: "1.2rem",
                        }}
                      >
                        {avg.toFixed(1)}
                      </p>
                    </div>
                  )}
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#8b5cf6", color: "white" }}>
                      {["Subject", "Period", "Type", "Grade", "Letter", "Uploaded By"].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              padding: "10px 14px",
                              textAlign: "left",
                              fontSize: "0.85rem",
                            }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {student.grades.map((g, i) => {
                      const letter = toLetterGrade(g.grade);
                      const col = gradeColor(g.grade);
                      return (
                        <tr
                          key={g.id}
                          style={{
                            background: i % 2 === 0 ? "white" : "#faf5ff",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                        >
                          <td style={{ padding: "10px 14px", fontWeight: "500" }}>
                            {g.subject}
                          </td>
                          <td
                            style={{
                              padding: "10px 14px",
                              color: "#6b7280",
                              fontSize: "0.85rem",
                            }}
                          >
                            {g.period}
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            {g.assessmentType && (
                              <span
                                style={{
                                  background: "#ede9fe",
                                  color: "#5b21b6",
                                  padding: "2px 8px",
                                  borderRadius: "20px",
                                  fontSize: "0.75rem",
                                  fontWeight: "600",
                                }}
                              >
                                {g.assessmentType}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "10px 14px" }}>{g.grade}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <span
                              style={{
                                background: col.bg,
                                color: col.text,
                                padding: "3px 10px",
                                borderRadius: "20px",
                                fontSize: "0.8rem",
                                fontWeight: "700",
                              }}
                            >
                              {letter}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "10px 14px",
                              color: "#6b7280",
                              fontSize: "0.82rem",
                            }}
                          >
                            {g.uploadedBy || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>
    );

  /* ── LIST VIEW ── */
  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div>
          <h2 style={{ color: "#5b21b6", margin: 0 }}>📊 Results & Grades</h2>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "0.85rem" }}>
            {results.length} result{results.length !== 1 ? "s" : ""} uploaded by teachers
            {filtered.length !== results.length && ` · ${filtered.length} shown`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setView("report")}
            style={{ ...saveBtn, background: "#6d28d9" }}
          >
            📋 Grade Reports
          </button>
          <button onClick={goBack} style={backBtn}>
            ⬅ Back
          </button>
        </div>
      </div>

      {/* Read-only notice */}
      <div
        style={{
          background: "#fef9c3",
          border: "1px solid #fde68a",
          borderRadius: "10px",
          padding: "10px 16px",
          marginBottom: "1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.85rem",
          color: "#92400e",
        }}
      >
        <span>👁️</span>
        <span>
          <strong>View only.</strong> Results are uploaded and managed by teachers. Contact the
          relevant teacher to make changes.
        </span>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        <input
          placeholder="🔍 Search by name, ID or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "9px 12px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "0.9rem",
          }}
        />
        <select
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          style={filterSel}
        >
          <option value="">All Periods</option>
          {periods.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          style={filterSel}
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select
          value={filterTeacher}
          onChange={(e) => setFilterTeacher(e.target.value)}
          style={filterSel}
        >
          <option value="">All Teachers</option>
          {teachers.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            background: "white",
            borderRadius: "12px",
            color: "#6b7280",
          }}
        >
          <p style={{ fontSize: "2rem" }}>📊</p>
          <p>
            {results.length === 0
              ? "No results yet. Teachers upload results from their portal."
              : "No results match your filters."}
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 1px 6px #e9d5ff",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#8b5cf6", color: "white" }}>
                {[
                  "Student", "ID", "Department", "Subject", "Period",
                  "Assign\n/10", "Test1\n/10", "Mid\n/30", "Project\n/10", "Final\n/40",
                  "Total", "Grade", "Uploaded By",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 10px",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "0.78rem",
                      whiteSpace: "pre-line",
                      lineHeight: "1.3",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const col = gradeColor(r.grade);
                return (
                  <tr
                    key={r.id}
                    style={{
                      background: i % 2 === 0 ? "white" : "#faf5ff",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    <td style={{ padding: "10px 10px", fontWeight: "500" }}>
                      {r.studentName}
                    </td>
                    <td
                      style={{
                        padding: "10px 10px",
                        color: "#6b7280",
                        fontSize: "0.85rem",
                        fontFamily: "monospace",
                        textAlign: "center",
                      }}
                    >
                      {r.studentId || "—"}
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "center" }}>
                      {r.department && (
                        <span
                          style={{
                            background: "#ede9fe",
                            color: "#5b21b6",
                            padding: "3px 8px",
                            borderRadius: "20px",
                            fontSize: "0.72rem",
                          }}
                        >
                          {r.department}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "10px 10px", fontSize: "0.85rem" }}>{r.subject}</td>
                    <td
                      style={{
                        padding: "10px 10px",
                        color: "#6b7280",
                        fontSize: "0.82rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.period}
                    </td>
                    {/* Score cells */}
                    {SCORE_COMPONENTS.map((c) => (
                      <td key={c.key} style={{ padding: "10px 8px", textAlign: "center",
                        fontWeight: "600", color: "#374151", fontSize: "0.85rem" }}>
                        {r[c.key] !== "" && r[c.key] != null
                          ? r[c.key]
                          : <span style={{ color: "#d1d5db" }}>—</span>}
                      </td>
                    ))}
                    {/* Total */}
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                      <span style={{ fontWeight: "800", fontSize: "0.95rem",
                        color: r.total >= 85 ? "#15803d" : r.total >= 50 ? "#1d4ed8" : "#dc2626" }}>
                        {r.total != null ? Number(r.total).toFixed(1) : "—"}
                      </span>
                    </td>
                    {/* Grade */}
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                      <span
                        style={{
                          background: col.bg,
                          color: col.text,
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontWeight: "700",
                          fontSize: "0.82rem",
                        }}
                      >
                        {r.grade}
                      </span>
                    </td>
                    {/* Uploaded by */}
                    <td
                      style={{
                        padding: "10px 10px",
                        color: "#6b7280",
                        fontSize: "0.82rem",
                        textAlign: "center",
                      }}
                    >
                      {r.uploadedBy ? (
                        <span
                          style={{
                            background: "#f3f4f6",
                            padding: "3px 8px",
                            borderRadius: "20px",
                            fontSize: "0.75rem",
                          }}
                        >
                          👤 {r.uploadedBy}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const card = {
  background: "white",
  borderRadius: "16px",
  padding: "2rem",
  boxShadow: "0 2px 12px #e9d5ff",
};
const saveBtn = {
  padding: "9px 18px",
  background: "#8b5cf6",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "500",
};
const backBtn = {
  padding: "8px 16px",
  background: "#ede9fe",
  color: "#5b21b6",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  marginBottom: "1rem",
  display: "inline-block",
};
const filterSel = {
  padding: "9px 12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "0.9rem",
  minWidth: "140px",
};
