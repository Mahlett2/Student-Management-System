import { useState, useMemo } from "react";
import { useStudents } from "../../data/studentsStore";

const DEPARTMENTS = [
  "Software Engineering", "Computer Science",
  "Information Systems", "Information Technology",
  "Civil Engineering", "Electrical Engineering",
  "Mechanical Engineering", "Chemical Engineering",
];

const STATUS_CYCLE = ["Present", "Absent", "Late"];

export default function TeacherAttendance() {
  const { students } = useStudents();

  const [step, setStep] = useState("select"); // select | mark | done
  const [dept, setDept] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState([]); // [{studentId, studentName, status}]
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  // Unique sections for selected dept
  const sections = useMemo(() => {
    const filtered = students.filter((s) => s.department === dept);
    return [...new Set(filtered.map((s) => s.year || "Year 1"))].sort();
  }, [students, dept]);

  // Students in selected dept + section
  const classStudents = useMemo(() => {
    return students.filter(
      (s) => s.department === dept && (s.year || "Year 1") === section
    );
  }, [students, dept, section]);

  const validateSelect = () => {
    const e = {};
    if (!dept) e.dept = "Select a department";
    if (!section) e.section = "Select a section/year";
    if (!subject.trim()) e.subject = "Enter subject name";
    if (!date) e.date = "Select a date";
    return e;
  };

  const handleStart = () => {
    const e = validateSelect();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (classStudents.length === 0) {
      setErrors({ dept: "No students found in this department and section. Add students first." });
      return;
    }
    // Initialize all as Present
    setRecords(classStudents.map((s) => ({
      studentId: s.studentId || s.id,
      studentName: s.fullName || s.name,
      status: "Present",
    })));
    setErrors({});
    setStep("mark");
  };

  const toggleStatus = (idx) => {
    setRecords((prev) => prev.map((r, i) => {
      if (i !== idx) return r;
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(r.status) + 1) % STATUS_CYCLE.length];
      return { ...r, status: next };
    }));
  };

  const setAll = (status) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleSave = () => {
    const session = {
      id: Date.now(),
      date,
      className: `${dept} - ${section}`,
      subject,
      department: dept,
      section,
      records,
    };
    const existing = JSON.parse(localStorage.getItem("attendance_sessions") || "[]");
    localStorage.setItem("attendance_sessions", JSON.stringify([...existing, session]));
    setSaved(true);
    setStep("done");
  };

  const reset = () => {
    setStep("select"); setDept(""); setSection(""); setSubject("");
    setDate(new Date().toISOString().split("T")[0]);
    setRecords([]); setSaved(false); setErrors({});
  };

  const present = records.filter((r) => r.status === "Present").length;
  const absent = records.filter((r) => r.status === "Absent").length;
  const late = records.filter((r) => r.status === "Late").length;

  const statusStyle = (s) => {
    if (s === "Present") return { bg: "#DCFCE7", text: "#15803D", border: "#86EFAC" };
    if (s === "Late")    return { bg: "#FEF9C3", text: "#A16207", border: "#FDE047" };
    return                      { bg: "#FEE2E2", text: "#DC2626", border: "#FCA5A5" };
  };

  const inp = (err) => ({
    width: "100%", padding: "10px 13px", borderRadius: "8px",
    border: `1px solid ${err ? "#EF4444" : "rgba(14,165,233,0.35)"}`,
    background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem",
    outline: "none", boxSizing: "border-box",
  });

  /* ── DONE ── */
  if (step === "done") return (
    <div style={{ maxWidth: "500px", margin: "0 auto", textAlign: "center", padding: "3rem 1rem" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
      <h2 style={{ color: "#0C4A6E", marginBottom: "0.5rem" }}>Attendance Saved!</h2>
      <p style={{ color: "#0369A1", marginBottom: "0.5rem" }}>{dept} · {section} · {subject}</p>
      <p style={{ color: "#0369A1", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
        {present} Present · {absent} Absent · {late} Late — {date}
      </p>
      <button onClick={reset} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>
        ➕ Mark Another Session
      </button>
    </div>
  );

  /* ── MARK ATTENDANCE ── */
  if (step === "mark") return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "14px", padding: "16px 20px", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h3 style={{ color: "#E0F2FE", margin: 0, fontWeight: "700" }}>✅ Mark Attendance</h3>
          <p style={{ color: "#64748B", margin: "3px 0 0", fontSize: "0.82rem" }}>
            {dept} · {section} · {subject} · {date}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span style={{ background: "#DCFCE7", color: "#15803D", padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>✅ {present}</span>
          <span style={{ background: "#FEE2E2", color: "#DC2626", padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>❌ {absent}</span>
          <span style={{ background: "#FEF9C3", color: "#A16207", padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>🕐 {late}</span>
        </div>
      </div>

      {/* Bulk actions */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <span style={{ color: "#0369A1", fontSize: "0.82rem", alignSelf: "center", fontWeight: "600" }}>Mark all:</span>
        {["Present", "Absent", "Late"].map((s) => {
          const sc = statusStyle(s);
          return (
            <button key={s} onClick={() => setAll(s)} style={{ padding: "6px 14px", background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.8rem" }}>
              {s}
            </button>
          );
        })}
        <span style={{ color: "#0369A1", fontSize: "0.78rem", alignSelf: "center", marginLeft: "auto" }}>
          Click a student's status to toggle
        </span>
      </div>

      {/* Student list */}
      <div style={{ background: "#7DD3FC", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(14,165,233,0.2)", marginBottom: "1rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
              {["#", "Student Name", "Student ID", "Status"].map((h) => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "#38BDF8", fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => {
              const sc = statusStyle(r.status);
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? "#7DD3FC" : "#BAE6FD", borderBottom: "1px solid rgba(14,165,233,0.12)" }}>
                  <td style={{ padding: "11px 14px", color: "#0369A1", fontWeight: "600" }}>{i + 1}</td>
                  <td style={{ padding: "11px 14px", fontWeight: "600", color: "#0C4A6E" }}>{r.studentName}</td>
                  <td style={{ padding: "11px 14px", color: "#0369A1", fontFamily: "monospace", fontSize: "0.82rem" }}>{r.studentId}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <button onClick={() => toggleStatus(i)} style={{
                      padding: "6px 18px", background: sc.bg, color: sc.text,
                      border: `1px solid ${sc.border}`, borderRadius: "20px",
                      cursor: "pointer", fontWeight: "700", fontSize: "0.82rem",
                      transition: "all 0.15s", minWidth: "90px",
                    }}>
                      {r.status === "Present" ? "✅" : r.status === "Absent" ? "❌" : "🕐"} {r.status}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button onClick={handleSave} style={{ padding: "11px 24px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.9rem" }}>
          💾 Save Attendance ({records.length} students)
        </button>
        <button onClick={() => setStep("select")} style={{ padding: "11px 18px", background: "#BAE6FD", color: "#0C4A6E", border: "1px solid rgba(14,165,233,0.3)", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
          ⬅ Back
        </button>
      </div>
    </div>
  );

  /* ── SELECT STEP ── */
  return (
    <div style={{ maxWidth: "560px" }}>
      <h2 style={{ color: "#0C4A6E", margin: "0 0 1.5rem", fontSize: "1.1rem", fontWeight: "800" }}>
        📅 Mark Attendance — Select Class
      </h2>

      <div style={{ background: "#7DD3FC", borderRadius: "14px", padding: "24px", border: "1px solid rgba(14,165,233,0.25)" }}>
        {/* Department */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={lbl}>Department *</label>
          <select style={inp(errors.dept)} value={dept} onChange={(e) => { setDept(e.target.value); setSection(""); setErrors((er) => ({ ...er, dept: undefined })); }}>
            <option value="">Select department...</option>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
          {errors.dept && <p style={err}>{errors.dept}</p>}
        </div>

        {/* Section / Year */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={lbl}>Section / Year *</label>
          <select style={inp(errors.section)} value={section} onChange={(e) => { setSection(e.target.value); setErrors((er) => ({ ...er, section: undefined })); }} disabled={!dept}>
            <option value="">{dept ? "Select section..." : "Select department first"}</option>
            {sections.map((s) => <option key={s}>{s}</option>)}
          </select>
          {errors.section && <p style={err}>{errors.section}</p>}
          {dept && section && (
            <p style={{ color: "#0369A1", fontSize: "0.75rem", margin: "4px 0 0" }}>
              {classStudents.length} student{classStudents.length !== 1 ? "s" : ""} in this section
            </p>
          )}
        </div>

        {/* Subject */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={lbl}>Subject *</label>
          <input style={inp(errors.subject)} placeholder="e.g. Data Structures" value={subject}
            onChange={(e) => { setSubject(e.target.value); setErrors((er) => ({ ...er, subject: undefined })); }} />
          {errors.subject && <p style={err}>{errors.subject}</p>}
        </div>

        {/* Date */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={lbl}>Date *</label>
          <input type="date" style={inp(errors.date)} value={date}
            onChange={(e) => { setDate(e.target.value); setErrors((er) => ({ ...er, date: undefined })); }} />
          {errors.date && <p style={err}>{errors.date}</p>}
        </div>

        <button onClick={handleStart} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "0.95rem" }}>
          ▶ Start Marking Attendance
        </button>
      </div>
    </div>
  );
}

const lbl = { display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#0C4A6E", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" };
const err = { color: "#EF4444", fontSize: "0.72rem", margin: "3px 0 0" };
