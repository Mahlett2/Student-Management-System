import { useState, useEffect, useMemo } from "react";
import { apiGet } from "../api/client";

const ROLE_LABELS = {
  admin:   { label: "Admin",   bg: "#ede9fe", text: "#5b21b6" },
  teacher: { label: "Teacher", bg: "#dbeafe", text: "#1d4ed8" },
  student: { label: "Student", bg: "#dcfce7", text: "#15803d" },
};

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
  if (["A+","A","A-"].includes(l)) return { bg: "#dcfce7", text: "#15803d" };
  if (["B+","B","B-"].includes(l)) return { bg: "#dbeafe", text: "#1d4ed8" };
  if (["C+","C","C-"].includes(l)) return { bg: "#fef9c3", text: "#a16207" };
  if (l === "D") return { bg: "#ffedd5", text: "#c2410c" };
  return { bg: "#fee2e2", text: "#dc2626" };
}

// ── Student Grade Detail View ─────────────────────────────────────────────
function StudentGradeDetail({ student, onBack }) {
  const [grades, setGrades]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear]         = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);

  const gpaMap = { "A+": 4.0, A: 4.0, "A-": 3.7, "B+": 3.3, B: 3.0, "B-": 2.7, "C+": 2.3, C: 2.0, "C-": 1.7, D: 1.0, F: 0.0 };

  useEffect(() => {
    apiGet("/results/?page_size=1000")
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        const normalized = list.map((r) => ({
          ...r,
          studentName:     r.student_name     || r.studentName    || "",
          studentId:       r.student_code     || r.studentId      || "",
          uploadedBy:      r.uploaded_by_name || r.uploadedBy     || "",
          assessmentType:  r.assessment_type  || r.assessmentType || "",
          scoreAssignment: r.scoreAssignment  ?? r.score_assignment ?? "",
          scoreTest1:      r.scoreTest1       ?? r.score_test1      ?? "",
          scoreMid:        r.scoreMid         ?? r.score_mid        ?? "",
          scoreProject:    r.scoreProject     ?? r.score_project    ?? "",
          scoreFinal:      r.scoreFinal       ?? r.score_final      ?? "",
        }));
        const myGrades = normalized.filter((r) =>
          r.studentName?.toLowerCase() === student.fullName?.toLowerCase() ||
          r.studentId === student.studentId
        );
        setGrades(myGrades);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [student]);

  // Extract unique calendar years from periods → map to "Year 1", "Year 2"...
  const academicYears = useMemo(() => {
    const calYears = new Set();
    grades.forEach((g) => {
      const match = (g.period || "").match(/\d{4}/);
      if (match) calYears.add(match[0]);
    });
    return [...calYears].sort().map((calYear, idx) => ({
      label: `Year ${idx + 1}`,
      calYear,
    }));
  }, [grades]);

  // Grades for selected year + semester
  const filteredGrades = useMemo(() => {
    if (!selectedYear || !selectedSemester) return [];
    return grades.filter((g) => {
      const p = g.period || "";
      return p.includes(selectedSemester) && p.includes(selectedYear.calYear);
    });
  }, [grades, selectedYear, selectedSemester]);

  // Overall GPA
  const allGpa = grades.map((g) => gpaMap[toLetterGrade(g.grade)]).filter((v) => v !== undefined);
  const overallGpa = allGpa.length > 0 ? (allGpa.reduce((s, v) => s + v, 0) / allGpa.length).toFixed(2) : null;

  // Semester GPA & avg for filtered set
  const semGpaVals = filteredGrades.map((g) => gpaMap[toLetterGrade(g.grade)]).filter((v) => v !== undefined);
  const semGpa = semGpaVals.length > 0 ? (semGpaVals.reduce((s, v) => s + v, 0) / semGpaVals.length).toFixed(2) : null;
  const semTotals = filteredGrades.filter((g) => !isNaN(Number(g.total)));
  const semAvg = semTotals.length > 0
    ? (semTotals.reduce((s, g) => s + Number(g.total), 0) / semTotals.length).toFixed(1)
    : null;

  return (
    <div>
      <button onClick={onBack} style={backBtn}>⬅ Back to Users</button>

      {/* Student header */}
      <div style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ ...avatarStyle, width: "52px", height: "52px", fontSize: "1.3rem" }}>
            {student.fullName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ color: "white", margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>{student.fullName}</h2>
            <p style={{ color: "rgba(255,255,255,0.7)", margin: "4px 0 0", fontSize: "0.82rem" }}>
              {student.studentId} · {student.year} · {student.section} · {student.department || "Year 1"}
            </p>
          </div>
        </div>
        {overallGpa && (
          <div style={{ textAlign: "center", background: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "10px 20px" }}>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", margin: 0 }}>Overall GPA</p>
            <p style={{ color: "white", fontSize: "1.8rem", fontWeight: "800", margin: "2px 0 0" }}>{overallGpa}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>⏳ Loading grades...</div>
      ) : grades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "12px", color: "#6b7280" }}>
          <p style={{ fontSize: "2rem" }}>📊</p>
          <p>No grades uploaded yet for this student.</p>
        </div>
      ) : (
        <>
          {/* Step 1: Select Academic Year */}
          <div style={{ marginBottom: "1.25rem" }}>
            <p style={{ color: "#5b21b6", fontWeight: "700", fontSize: "0.82rem", textTransform: "uppercase", margin: "0 0 10px" }}>
              📅 Select Academic Year
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {academicYears.map((yr) => (
                <button
                  key={yr.calYear}
                  onClick={() => { setSelectedYear(yr); setSelectedSemester(null); }}
                  style={{
                    padding: "10px 24px", borderRadius: "10px", border: "none", cursor: "pointer",
                    fontWeight: "700", fontSize: "0.9rem",
                    background: selectedYear?.calYear === yr.calYear
                      ? "linear-gradient(135deg,#5b21b6,#7c3aed)"
                      : "#ede9fe",
                    color: selectedYear?.calYear === yr.calYear ? "white" : "#5b21b6",
                    boxShadow: selectedYear?.calYear === yr.calYear ? "0 3px 10px rgba(91,33,182,0.3)" : "none",
                    transition: "all 0.18s",
                  }}
                >
                  {yr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Semester */}
          {selectedYear && (
            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ color: "#5b21b6", fontWeight: "700", fontSize: "0.82rem", textTransform: "uppercase", margin: "0 0 10px" }}>
                🗓️ Select Semester
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                {["Semester 1", "Semester 2"].map((sem) => {
                  const hasGrades = grades.some(
                    (g) => g.period?.includes(sem) && g.period?.includes(selectedYear.calYear)
                  );
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
                          ? "linear-gradient(135deg,#5b21b6,#7c3aed)"
                          : hasGrades ? "#ede9fe" : "#f3f4f6",
                        color: selectedSemester === sem ? "white" : hasGrades ? "#5b21b6" : "#9ca3af",
                        opacity: hasGrades ? 1 : 0.5,
                        transition: "all 0.18s",
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
              {/* Summary bar */}
              <div style={{ background: "#ede9fe", borderRadius: "12px", padding: "14px 18px", marginBottom: "1rem", border: "1px solid #c4b5fd", display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <p style={{ color: "#5b21b6", fontWeight: "700", margin: 0 }}>
                    {selectedYear.label} · {selectedSemester}
                  </p>
                  <p style={{ color: "#7c3aed", fontSize: "0.82rem", margin: "3px 0 0" }}>
                    {filteredGrades.length} course{filteredGrades.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {semGpa && (
                  <div style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed)", borderRadius: "10px", padding: "8px 16px", textAlign: "center" }}>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", margin: 0 }}>Semester GPA</p>
                    <p style={{ color: "white", fontWeight: "800", fontSize: "1.2rem", margin: "2px 0 0" }}>{semGpa}</p>
                  </div>
                )}
                {semAvg && (
                  <div style={{ background: "#ddd6fe", borderRadius: "10px", padding: "8px 16px", textAlign: "center" }}>
                    <p style={{ color: "#5b21b6", fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", margin: 0 }}>Avg Score</p>
                    <p style={{ color: "#5b21b6", fontWeight: "800", fontSize: "1.2rem", margin: "2px 0 0" }}>{semAvg}%</p>
                  </div>
                )}
              </div>

              {filteredGrades.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", background: "white", borderRadius: "12px", color: "#6b7280" }}>
                  <p>No grades for {selectedSemester} of {selectedYear.label}.</p>
                </div>
              ) : (
                <div style={{ background: "white", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 12px #e9d5ff" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                      <thead>
                        <tr style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed)" }}>
                          {["#", "Subject", "Teacher", ...SCORE_COMPONENTS.map((c) => `${c.label}\n/${c.max}`), "Total", "Grade", "Status"].map((h) => (
                            <th key={h} style={{ padding: "11px 10px", textAlign: "center", color: "white", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", whiteSpace: "pre-line", lineHeight: "1.3" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGrades.map((g, i) => {
                          const letter = toLetterGrade(g.grade);
                          const col = gradeColor(g.grade);
                          const passed = letter !== "F";
                          return (
                            <tr key={g.id || i} style={{ background: i % 2 === 0 ? "white" : "#faf5ff", borderBottom: "1px solid #f3f4f6" }}>
                              <td style={{ padding: "10px 10px", textAlign: "center", color: "#6b7280", fontWeight: "600" }}>{i + 1}</td>
                              <td style={{ padding: "10px 12px", fontWeight: "600", color: "#374151" }}>{g.subject}</td>
                              <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: "0.82rem" }}>{g.uploadedBy || "—"}</td>
                              {SCORE_COMPONENTS.map((c) => (
                                <td key={c.key} style={{ padding: "10px 8px", textAlign: "center", color: "#374151", fontSize: "0.85rem", fontWeight: "600" }}>
                                  {g[c.key] !== "" && g[c.key] != null ? g[c.key] : <span style={{ color: "#d1d5db" }}>—</span>}
                                </td>
                              ))}
                              <td style={{ padding: "10px 8px", textAlign: "center" }}>
                                <span style={{ fontWeight: "800", fontSize: "0.95rem", color: Number(g.total) >= 85 ? "#15803d" : Number(g.total) >= 50 ? "#1d4ed8" : "#dc2626" }}>
                                  {g.total != null ? Number(g.total).toFixed(1) : "—"}
                                </span>
                              </td>
                              <td style={{ padding: "10px 8px", textAlign: "center" }}>
                                <span style={{ background: col.bg, color: col.text, padding: "3px 10px", borderRadius: "20px", fontWeight: "800", fontSize: "0.82rem" }}>
                                  {letter}
                                </span>
                              </td>
                              <td style={{ padding: "10px 8px", textAlign: "center" }}>
                                <span style={{ background: passed ? "#dcfce7" : "#fee2e2", color: passed ? "#15803d" : "#dc2626", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" }}>
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
              )}
            </>
          )}

          {!selectedYear && (
            <div style={{ textAlign: "center", padding: "2rem", background: "#ede9fe", borderRadius: "12px", color: "#5b21b6" }}>
              <p style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>☝️</p>
              <p style={{ fontWeight: "600" }}>Select an academic year above to view grades.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main UserManagement Component ─────────────────────────────────────────
export default function UserManagement({ goBack }) {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    Promise.all([
      apiGet("/students/?page_size=1000"),
      apiGet("/teachers/?page_size=500"),
    ]).then(([stuData, tchData]) => {
      const students = (Array.isArray(stuData) ? stuData : stuData?.results || []).map((s) => ({
        id:         `stu-${s.id}`,
        rawId:      s.id,
        fullName:   s.full_name   || s.fullName   || "",
        username:   s.username    || "",
        email:      s.email       || "—",
        role:       "student",
        studentId:  s.student_id  || s.studentId  || "",
        year:       s.year        || "",
        section:    s.section     || "",
        department: typeof s.department === "object" ? s.department?.name : s.department || "",
      }));

      const teachers = (Array.isArray(tchData) ? tchData : tchData?.results || []).map((t) => ({
        id:         `tch-${t.id}`,
        fullName:   t.full_name   || t.fullName   || "",
        username:   t.username    || "",
        email:      t.email       || "—",
        role:       "teacher",
        teacherId:  t.teacher_id  || t.teacherId  || "",
        assignedDepartment: t.assigned_department || "",
        assignedSubject:    t.assigned_subject    || "",
      }));

      setUsers([...students, ...teachers]);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // If a student is selected, show their grade detail
  if (selectedStudent) {
    return <StudentGradeDetail student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (!q || u.fullName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q)) &&
      (!filterRole || u.role === filterRole)
    );
  });

  const studentCount = users.filter((u) => u.role === "student").length;
  const teacherCount = users.filter((u) => u.role === "teacher").length;

  if (loading) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
      ⏳ Loading user accounts...
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ color: "#5b21b6", margin: 0 }}>👥 User Management</h2>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "0.85rem" }}>
            All login accounts — {studentCount} students · {teacherCount} teachers
          </p>
        </div>
        <button onClick={goBack} style={backBtn}>⬅ Back</button>
      </div>

      {/* Info banner */}
      <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: "10px", padding: "10px 16px", marginBottom: "1.25rem", fontSize: "0.85rem", color: "#92400e" }}>
        ℹ️ Click on a <strong>student name</strong> to view their full grade report (year by year, semester by semester).
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Accounts", value: users.length,   icon: "👥", bg: "#ede9fe", text: "#5b21b6" },
          { label: "Students",       value: studentCount,   icon: "🎓", bg: "#dcfce7", text: "#15803d" },
          { label: "Teachers",       value: teacherCount,   icon: "👨‍🏫", bg: "#dbeafe", text: "#1d4ed8" },
        ].map((c) => (
          <div key={c.label} style={{ background: c.bg, borderRadius: "12px", padding: "16px", textAlign: "center", border: `1px solid ${c.text}30` }}>
            <p style={{ fontSize: "1.5rem", margin: 0 }}>{c.icon}</p>
            <p style={{ fontWeight: "800", color: c.text, fontSize: "1.6rem", margin: "4px 0 2px" }}>{c.value}</p>
            <p style={{ fontSize: "0.78rem", color: c.text, fontWeight: "600", textTransform: "uppercase", margin: 0 }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Search by name or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
        />
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem", minWidth: "150px" }}>
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "12px", color: "#6b7280" }}>
          <p style={{ fontSize: "2rem" }}>👥</p>
          <p>{users.length === 0 ? "No user accounts yet." : "No accounts match your search."}</p>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 6px #e9d5ff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#8b5cf6", color: "white" }}>
                {["Full Name", "Username", "Role", "ID / Details", "Email"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", fontSize: "0.85rem" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const rc = ROLE_LABELS[u.role] || ROLE_LABELS.student;
                const isStudent = u.role === "student";
                return (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? "white" : "#faf5ff", borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={avatarStyle}>{u.fullName?.charAt(0).toUpperCase() || "?"}</div>
                        {isStudent ? (
                          <button
                            onClick={() => setSelectedStudent(u)}
                            style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "600", color: "#5b21b6", fontSize: "0.9rem", textDecoration: "underline", padding: 0 }}
                          >
                            {u.fullName || "—"}
                          </button>
                        ) : (
                          <span style={{ fontWeight: "500" }}>{u.fullName || "—"}</span>
                        )}
                        {isStudent && <span style={{ fontSize: "0.7rem", color: "#8b5cf6", background: "#ede9fe", padding: "1px 6px", borderRadius: "10px" }}>📊 View Grades</span>}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#374151", fontSize: "0.85rem" }}>{u.username || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: rc.bg, color: rc.text, padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" }}>
                        {rc.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "0.82rem" }}>
                      {u.role === "student" && (
                        <span>
                          {u.studentId && <span style={{ fontFamily: "monospace" }}>{u.studentId}</span>}
                          {u.year && <span style={{ marginLeft: "6px" }}>· {u.year}</span>}
                          {u.section && <span style={{ marginLeft: "4px" }}>· {u.section}</span>}
                          {u.department && <span style={{ marginLeft: "4px" }}>· {u.department}</span>}
                        </span>
                      )}
                      {u.role === "teacher" && (
                        <span>
                          {u.teacherId && <span style={{ fontFamily: "monospace" }}>{u.teacherId}</span>}
                          {u.assignedDepartment && <span style={{ marginLeft: "6px" }}>· {u.assignedDepartment}</span>}
                          {u.assignedSubject && <span style={{ marginLeft: "4px" }}>· {u.assignedSubject}</span>}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "0.85rem" }}>
                      {u.email !== "—" ? u.email : <span style={{ color: "#d1d5db" }}>Not set</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Note */}
      <div style={{ marginTop: "1.25rem", background: "white", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 1px 6px #e9d5ff", fontSize: "0.85rem", color: "#6b7280" }}>
        <p style={{ fontWeight: "600", color: "#5b21b6", margin: "0 0 8px" }}>🔑 Default Login Credentials</p>
        <p style={{ margin: "0 0 4px" }}>• <strong>Students:</strong> Username = <code>firstname.fathername</code> · Password = Student ID</p>
        <p style={{ margin: 0 }}>• <strong>Teachers:</strong> Username = <code>firstname.fathername</code> · Password = set by admin</p>
      </div>
    </div>
  );
}

const avatarStyle = {
  width: "36px", height: "36px", borderRadius: "50%",
  background: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
  color: "white", display: "flex", alignItems: "center",
  justifyContent: "center", fontWeight: "bold", fontSize: "0.9rem", flexShrink: 0,
};
const backBtn = { padding: "8px 16px", background: "#ede9fe", color: "#5b21b6", border: "none", borderRadius: "8px", cursor: "pointer", display: "inline-block", marginBottom: "1rem" };
