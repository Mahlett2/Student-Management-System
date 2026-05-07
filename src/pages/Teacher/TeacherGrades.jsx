import { useState, useMemo, useEffect } from "react";
import { useResults } from "../../data/resultsStore";
import { useStudents } from "../../data/studentsStore";
import { createResult, updateResult, deleteResult } from "../../api/operations";
import { apiGet } from "../../api/client";

const PERIODS = [
  "Semester 1 2024",
  "Semester 2 2024",
  "Semester 1 2025",
  "Semester 2 2025",
  "Semester 1 2026",
  "Semester 2 2026",
];

// Score components with their max marks
const SCORE_COMPONENTS = [
  { key: "scoreAssignment", label: "Assignment", max: 10 },
  { key: "scoreTest1",      label: "Test 1",     max: 10 },
  { key: "scoreMid",        label: "Mid",        max: 30 },
  { key: "scoreProject",    label: "Project",    max: 10 },
  { key: "scoreFinal",      label: "Final",      max: 40 },
];

const EMPTY_SCORES = {
  scoreAssignment: "",
  scoreTest1: "",
  scoreMid: "",
  scoreProject: "",
  scoreFinal: "",
};

const EMPTY_FORM = {
  studentName: "",
  studentId: "",
  subject: "",
  period: "",
  ...EMPTY_SCORES,
};

/** Sum all entered numeric scores */
function computeTotal(form) {
  return SCORE_COMPONENTS.reduce((sum, c) => {
    const v = parseFloat(form[c.key]);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);
}

/** Derive letter grade from total out of 100 */
function totalToGrade(total) {
  if (total >= 90) return "A+";
  if (total >= 85) return "A";
  if (total >= 80) return "A-";
  if (total >= 75) return "B+";
  if (total >= 70) return "B";
  if (total >= 65) return "B-";
  if (total >= 60) return "C+";
  if (total >= 55) return "C";
  if (total >= 50) return "C-";
  if (total >= 45) return "D";
  return "F";
}

function gradeColor(grade) {
  if (["A+", "A", "A-"].includes(grade)) return { bg: "#DCFCE7", text: "#15803D" };
  if (["B+", "B", "B-"].includes(grade)) return { bg: "#DBEAFE", text: "#1D4ED8" };
  if (["C+", "C", "C-"].includes(grade)) return { bg: "#FEF9C3", text: "#A16207" };
  if (grade === "D") return { bg: "#FFEDD5", text: "#C2410C" };
  return { bg: "#FEE2E2", text: "#DC2626" };
}

function totalColor(total) {
  if (total > 90)  return "#15803D";  // A+
  if (total >= 85) return "#15803D";  // A
  if (total >= 80) return "#15803D";  // A-
  if (total >= 75) return "#1D4ED8";  // B+
  if (total >= 70) return "#1D4ED8";  // B
  if (total >= 65) return "#1D4ED8";  // B-
  if (total >= 60) return "#A16207";  // C+
  if (total >= 55) return "#A16207";  // C
  if (total >= 50) return "#A16207";  // C-
  if (total >= 45) return "#C2410C";  // D
  return "#DC2626";                   // F
}

export default function TeacherGrades() {
  const { results, setResults } = useResults();
  const { students: adminStudents } = useStudents();

  const stored = localStorage.getItem("current_user");
  const teacher = stored ? JSON.parse(stored) : {};
  const teacherName    = teacher.full_name        || teacher.name        || "";
  const teacherDept    = teacher.assignedDepartment || teacher.department || "";
  const teacherSection = teacher.assignedSection  || "";
  const teacherYear    = teacher.assignedYear     || "";
  // Subject and semester are fixed from admin assignment
  const assignedSubject  = teacher.assignedSubject  || "";
  const assignedSemester = teacher.assignedSemester || "";

  const [view, setView] = useState("list");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Students in this teacher's assigned section + department + year
  const myStudents = useMemo(
    () => adminStudents.filter((s) => {
      const deptMatch = !teacherDept    || s.department === teacherDept || teacherDept === "Fresh";
      const secMatch  = !teacherSection || s.section    === teacherSection;
      const yearMatch = !teacherYear    || s.year       === teacherYear;
      return deptMatch && secMatch && yearMatch;
    }),
    [adminStudents, teacherDept, teacherSection, teacherYear]
  );

  // Only results uploaded by this teacher
  const myResults = useMemo(
    () => results.filter((r) => r.uploadedBy === teacherName),
    [results, teacherName]
  );

  const uniqueSubjects = [...new Set(myResults.map((r) => r.subject))].filter(Boolean);
  const uniquePeriods  = [...new Set(myResults.map((r) => r.period))].filter(Boolean);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return myResults.filter(
      (r) =>
        (!q ||
          r.studentName?.toLowerCase().includes(q) ||
          r.studentId?.toLowerCase().includes(q) ||
          r.subject?.toLowerCase().includes(q)) &&
        (!filterPeriod  || r.period  === filterPeriod)
    );
  }, [myResults, search, filterPeriod]);

  // Live total & grade from current form values
  const liveTotal = computeTotal(form);
  const liveGrade = totalToGrade(liveTotal);
  const allScoresEntered = SCORE_COMPONENTS.every((c) => form[c.key] !== "");

  // ── handlers ──
  const setField = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const handleStudentSelect = (e) => {
    const name = e.target.value;
    const s = myStudents.find((st) => (st.fullName || st.name) === name);
    setForm((f) => ({
      ...f,
      studentName: name,
      studentId: s ? (s.studentId || "") : "",
      // Auto-fill subject and period from assignment
      subject: assignedSubject || f.subject,
      period:  assignedSemester ? `${assignedSemester} ${new Date().getFullYear()}` : f.period,
    }));
    setErrors((er) => ({ ...er, studentName: undefined }));
    setShowStudentDropdown(false);
  };

  const validate = () => {
    const e = {};
    if (!form.studentName.trim()) e.studentName = "Student is required";
    if (!form.subject)            e.subject     = "Subject is required";
    if (!form.period)             e.period      = "Period is required";

    SCORE_COMPONENTS.forEach((c) => {
      const v = form[c.key];
      if (v === "") return; // blank = not entered yet, allowed
      const n = parseFloat(v);
      if (isNaN(n) || n < 0 || n > c.max)
        e[c.key] = `Must be 0 – ${c.max}`;
    });
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const total = computeTotal(form);
    const grade = totalToGrade(total);

    const entry = {
      studentName:     form.studentName,
      studentId:       form.studentId,
      studentCode:     form.studentId,
      subject:         assignedSubject || form.subject,
      period:          form.period || (assignedSemester ? `${assignedSemester} ${new Date().getFullYear()}` : ""),
      assessmentType:  "Final",
      score:           total,
      scoreAssignment: form.scoreAssignment,
      scoreTest1:      form.scoreTest1,
      scoreMid:        form.scoreMid,
      scoreProject:    form.scoreProject,
      scoreFinal:      form.scoreFinal,
      total,
      grade,
      department:  teacherDept,
      uploadedBy:  teacherName,
    };

    try {
      if (editId) {
        await updateResult(editId, { ...entry, assessmentType: "Final" });
        setResults((p) => p.map((r) => (r.id === editId ? { ...r, ...entry } : r)));
      } else {
        const created = await createResult(entry);
        setResults((p) => [...p, { id: created?.id ?? Date.now(), ...entry }]);
      }
    } catch (err) {
      alert(err.data ? JSON.stringify(err.data) : err.message);
      return;
    }

    setForm(EMPTY_FORM);
    setEditId(null);
    setErrors({});
    setView("list");
  };

  const handleEdit = (r) => {
    setForm({
      studentName:     r.studentName,
      studentId:       r.studentId || "",
      subject:         r.subject,
      period:          r.period,
      scoreAssignment: r.scoreAssignment ?? "",
      scoreTest1:      r.scoreTest1      ?? "",
      scoreMid:        r.scoreMid        ?? "",
      scoreProject:    r.scoreProject    ?? "",
      scoreFinal:      r.scoreFinal      ?? "",
    });
    setEditId(r.id);
    setView("form");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this result?")) {
      try {
        await deleteResult(id);
        setResults((p) => p.filter((r) => r.id !== id));
      } catch (err) {
        alert("Delete failed: " + (err.message || "Unknown error"));
      }
    }
  };

  /* ════════════════════════════════════════
     FORM VIEW
  ════════════════════════════════════════ */
  if (view === "form") return (
    <div style={{ maxWidth: "760px" }}>
      <button onClick={() => { setView("list"); setEditId(null); setForm(EMPTY_FORM); setErrors({}); }} style={backBtn}>
        ⬅ Back
      </button>

      <div style={card}>
        <h2 style={{ color: "#0C4A6E", marginBottom: "1.5rem", fontWeight: "800" }}>
          {editId ? "✏️ Edit Result" : "📤 Upload Result"}
        </h2>

        {/* ── Student + Subject + Period ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
          <F label="Student *" err={errors.studentName}>
            <div style={{ position: "relative" }}>
              <input
                style={inp(errors.studentName)}
                placeholder="Click to select student..."
                value={form.studentName}
                onFocus={() => setShowStudentDropdown(true)}
                onChange={(e) => {
                  setForm((f) => ({ ...f, studentName: e.target.value, studentId: "" }));
                  setShowStudentDropdown(true);
                  setErrors((er) => ({ ...er, studentName: undefined }));
                }}
                autoComplete="off"
              />
              {showStudentDropdown && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #d1d5db", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 100, maxHeight: "200px", overflowY: "auto" }}>
                  {myStudents
                    .filter((s) => !form.studentName || (s.fullName || s.name)?.toLowerCase().includes(form.studentName.toLowerCase()))
                    .map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleStudentSelect({ target: { value: s.fullName || s.name } })}
                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                      >
                        <span style={{ fontWeight: "500", color: "#374151" }}>{s.fullName || s.name}</span>
                        <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#6b7280" }}>{s.studentId}</span>
                      </div>
                    ))
                  }
                  {myStudents.length === 0 && (
                    <div style={{ padding: "12px 14px", color: "#6b7280", fontSize: "0.85rem" }}>No students in assigned class</div>
                  )}
                </div>
              )}
            </div>
          </F>

          <F label="Student ID">
            <input
              style={{ ...inp(false), background: "#E0F2FE", color: "#0369A1", cursor: "default" }}
              placeholder="Auto-filled when student selected"
              value={form.studentId}
              readOnly
            />
          </F>

          {/* Subject — auto-filled from assignment, read-only */}
          <F label="Subject">
            <input
              style={{ ...inp(false), background: "#E0F2FE", color: "#0369A1", cursor: "default" }}
              value={assignedSubject || form.subject || ""}
              readOnly
              placeholder="Auto-filled from assignment"
            />
          </F>

          {/* Period — auto-filled from assignment, read-only */}
          <F label="Period">
            <input
              style={{ ...inp(false), background: "#E0F2FE", color: "#0369A1", cursor: "default" }}
              value={form.period || (assignedSemester ? `${assignedSemester} ${new Date().getFullYear()}` : "")}
              readOnly
              placeholder="Auto-filled from assignment"
            />
          </F>
        </div>

        {/* ── Score components ── */}
        <div style={{ margin: "1.25rem 0 0.5rem", borderTop: "1px solid rgba(14,165,233,0.25)", paddingTop: "1.25rem" }}>
          <p style={{ color: "#0C4A6E", fontWeight: "700", fontSize: "0.85rem", margin: "0 0 1rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            📝 Score Components
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem" }}>
            {SCORE_COMPONENTS.map((c) => (
              <div key={c.key}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#0C4A6E",
                  marginBottom: "4px", textTransform: "uppercase" }}>
                  {c.label}
                  <span style={{ color: "#0369A1", fontWeight: "400", marginLeft: "4px" }}>/ {c.max}</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max={c.max}
                  step="0.5"
                  placeholder={`0–${c.max}`}
                  value={form[c.key]}
                  onChange={setField(c.key)}
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    borderRadius: "8px",
                    border: `1px solid ${errors[c.key] ? "#EF4444" : "rgba(14,165,233,0.35)"}`,
                    background: "#BAE6FD",
                    color: "#0C4A6E",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                    textAlign: "center",
                    fontWeight: "700",
                  }}
                />
                {errors[c.key] && (
                  <p style={{ color: "#EF4444", fontSize: "0.68rem", margin: "2px 0 0" }}>{errors[c.key]}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Live total + grade preview ── */}
        <div style={{
          marginTop: "1.25rem",
          background: "linear-gradient(135deg,#0F172A,#1E293B)",
          borderRadius: "12px",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}>
          <div>
            <p style={{ color: "#64748B", fontSize: "0.75rem", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Running Total
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ color: totalColor(liveTotal), fontWeight: "800", fontSize: "2rem", lineHeight: 1 }}>
                {liveTotal.toFixed(1)}
              </span>
              <span style={{ color: "#64748B", fontSize: "0.85rem" }}>/ 100</span>
            </div>
            {/* Progress bar */}
            <div style={{ width: "200px", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "99px", marginTop: "8px" }}>
              <div style={{
                width: `${Math.min(liveTotal, 100)}%`,
                height: "100%",
                borderRadius: "99px",
                background: totalColor(liveTotal),
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#64748B", fontSize: "0.75rem", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Grade
            </p>
            {allScoresEntered ? (
              <span style={{
                ...gradeColor(liveGrade),
                padding: "8px 20px",
                borderRadius: "12px",
                fontWeight: "800",
                fontSize: "1.4rem",
                display: "inline-block",
              }}>
                {liveGrade}
              </span>
            ) : (
              <span style={{ color: "#64748B", fontSize: "0.85rem" }}>Enter all scores</span>
            )}
          </div>

          <div style={{ fontSize: "0.75rem", color: "#64748B", lineHeight: "1.8" }}>
            {SCORE_COMPONENTS.map((c) => {
              const v = parseFloat(form[c.key]);
              return (
                <div key={c.key} style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                  <span>{c.label}</span>
                  <span style={{ color: isNaN(v) ? "#475569" : "#38BDF8", fontWeight: "600" }}>
                    {isNaN(v) ? "—" : `${v} / ${c.max}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
          <button onClick={handleSave} style={saveBtn}>
            💾 {editId ? "Update Result" : "Save Result"}
          </button>
          <button onClick={() => { setView("list"); setEditId(null); setErrors({}); }} style={cancelBtn}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════
     LIST VIEW
  ════════════════════════════════════════ */
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ color: "#0C4A6E", margin: 0, fontWeight: "800" }}>📊 Upload Results</h2>
          <p style={{ color: "#0369A1", margin: "4px 0 0", fontSize: "0.85rem" }}>
            {teacherDept} · {myResults.length} result{myResults.length !== 1 ? "s" : ""} uploaded
          </p>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setEditId(null); setErrors({}); setView("form"); }} style={saveBtn}>
          📤 Upload Result
        </button>
      </div>

      {/* Student progress cards */}
      {myStudents.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
          gap: "10px", marginBottom: "1.5rem" }}>
          {myStudents.slice(0, 8).map((s) => {
            const name = s.fullName || s.name;
            const sResults = myResults.filter((r) => r.studentName === name);
            const subjects = [...new Set(sResults.map((r) => r.subject))];
            return (
              <div key={s.id} style={{
                background: "linear-gradient(135deg,#0F172A,#1E293B)",
                border: sResults.length > 0 ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(56,189,248,0.15)",
                borderRadius: "10px", padding: "12px 14px",
              }}>
                <p style={{ color: "#E0F2FE", fontWeight: "700", fontSize: "0.82rem",
                  margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {name}
                </p>
                <p style={{ color: "#64748B", fontSize: "0.7rem", margin: "0 0 6px", fontFamily: "monospace" }}>
                  {s.studentId || "—"}
                </p>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {subjects.length === 0
                    ? <span style={{ fontSize: "0.65rem", color: "#475569" }}>No results yet</span>
                    : subjects.map((sub) => {
                        const r = sResults.find((x) => x.subject === sub);
                        const col = r ? gradeColor(r.grade) : { bg: "rgba(100,116,139,0.2)", text: "#64748B" };
                        return (
                          <span key={sub} style={{
                            fontSize: "0.62rem", padding: "2px 6px", borderRadius: "8px",
                            fontWeight: "700", background: col.bg, color: col.text,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "80px",
                          }} title={sub}>
                            {sub.length > 8 ? sub.slice(0, 8) + "…" : sub}: {r?.grade || "—"}
                          </span>
                        );
                      })
                  }
                </div>
              </div>
            );
          })}
          {myStudents.length > 8 && (
            <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)",
              border: "1px solid rgba(56,189,248,0.15)", borderRadius: "10px", padding: "12px 14px",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#64748B", fontSize: "0.82rem" }}>
              +{myStudents.length - 8} more
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input placeholder="🔍 Search by student, ID or subject..." value={search}
          onChange={(e) => setSearch(e.target.value)} style={{
            flex: 1, minWidth: "200px", padding: "9px 12px", borderRadius: "8px",
            border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD",
            color: "#0C4A6E", fontSize: "0.875rem", outline: "none",
          }} />
        <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} style={filterSel}>
          <option value="">All Periods</option>
          {uniquePeriods.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC",
          borderRadius: "14px", color: "#0369A1" }}>
          <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>📊</p>
          <p style={{ fontWeight: "600" }}>
            {myResults.length === 0
              ? 'No results yet. Click "Upload Result" to start.'
              : "No results match your filters."}
          </p>
        </div>
      ) : (
        <div style={{ background: "#7DD3FC", borderRadius: "12px", overflowX: "auto",
          border: "1px solid rgba(14,165,233,0.2)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "820px" }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
                {["Student", "ID", "Subject", "Period",
                  "Assign\n/10", "Test1\n/10", "Mid\n/30", "Project\n/10", "Final\n/40",
                  "Total", "Grade", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "11px 10px", textAlign: "center",
                    color: "#38BDF8", fontSize: "0.7rem", fontWeight: "700",
                    textTransform: "uppercase", whiteSpace: "pre-line", lineHeight: "1.3" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const col = gradeColor(r.grade);
                const tc  = totalColor(r.total ?? 0);
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "#7DD3FC" : "#BAE6FD",
                    borderBottom: "1px solid rgba(14,165,233,0.12)" }}>
                    <td style={{ padding: "10px 10px", fontWeight: "600", color: "#0C4A6E", whiteSpace: "nowrap" }}>
                      {r.studentName}
                    </td>
                    <td style={{ padding: "10px 10px", fontFamily: "monospace", color: "#0369A1",
                      fontSize: "0.78rem", textAlign: "center" }}>
                      {r.studentId || "—"}
                    </td>
                    <td style={{ padding: "10px 10px", color: "#0C4A6E", fontSize: "0.82rem" }}>
                      {r.subject}
                    </td>
                    <td style={{ padding: "10px 10px", color: "#0369A1", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                      {r.period}
                    </td>
                    {/* Score cells */}
                    {SCORE_COMPONENTS.map((c) => (
                      <td key={c.key} style={{ padding: "10px 8px", textAlign: "center",
                        fontWeight: "700", color: "#0C4A6E", fontSize: "0.85rem" }}>
                        {r[c.key] !== "" && r[c.key] != null ? r[c.key] : <span style={{ color: "#94A3B8" }}>—</span>}
                      </td>
                    ))}
                    {/* Total */}
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                      <span style={{ color: tc, fontWeight: "800", fontSize: "0.95rem" }}>
                        {r.total != null ? Number(r.total).toFixed(1) : "—"}
                      </span>
                    </td>
                    {/* Grade badge */}
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                      <span style={{ background: col.bg, color: col.text,
                        padding: "3px 10px", borderRadius: "20px", fontWeight: "800", fontSize: "0.82rem" }}>
                        {r.grade || "—"}
                      </span>
                    </td>
                    {/* Actions */}
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        <button onClick={() => handleEdit(r)} style={editBtn}>✏️</button>
                        <button onClick={() => handleDelete(r.id)} style={delBtn}>🗑️</button>
                      </div>
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

/* ── shared sub-components & styles ── */
const F = ({ label, err, children }) => (
  <div style={{ marginBottom: "1rem" }}>
    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#0C4A6E",
      marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
      {label}
    </label>
    {children}
    {err && <p style={{ color: "#EF4444", fontSize: "0.72rem", margin: "3px 0 0" }}>{err}</p>}
  </div>
);

const card = { background: "#7DD3FC", borderRadius: "14px", padding: "24px",
  border: "1px solid rgba(14,165,233,0.25)" };
const inp = (err) => ({
  width: "100%", padding: "9px 12px", borderRadius: "8px",
  border: `1px solid ${err ? "#EF4444" : "rgba(14,165,233,0.35)"}`,
  background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem",
  outline: "none", boxSizing: "border-box",
});
const saveBtn = { padding: "9px 18px", background: "linear-gradient(135deg,#0F172A,#1E293B)",
  color: "#38BDF8", border: "none", borderRadius: "8px", cursor: "pointer",
  fontWeight: "700", fontSize: "0.875rem" };
const cancelBtn = { padding: "9px 18px", background: "rgba(239,68,68,0.12)", color: "#DC2626",
  border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", cursor: "pointer", fontWeight: "600" };
const backBtn = { padding: "8px 16px", background: "linear-gradient(135deg,#0F172A,#1E293B)",
  color: "#38BDF8", border: "none", borderRadius: "8px", cursor: "pointer",
  fontWeight: "600", marginBottom: "1rem", display: "inline-block" };
const editBtn = { padding: "6px 10px", background: "#DBEAFE", color: "#1D4ED8",
  border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const delBtn  = { padding: "6px 10px", background: "#FEE2E2", color: "#DC2626",
  border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const filterSel = { padding: "9px 12px", borderRadius: "8px",
  border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD",
  color: "#0C4A6E", fontSize: "0.875rem", outline: "none", minWidth: "140px" };
