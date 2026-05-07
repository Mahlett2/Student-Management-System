import { useState, useEffect, useMemo } from "react";
import { apiGet } from "../../api/client";
import { createAttendanceSession } from "../../api/operations";

const STATUS_CYCLE = ["Present", "Absent", "Late"];

export default function TeacherAttendance() {
  const stored = localStorage.getItem("current_user");
  const teacher = stored ? JSON.parse(stored) : {};

  // Use admin-assigned values — no manual selection needed
  const assignedDept    = teacher.assignedDepartment || teacher.department || "";
  const assignedSection = teacher.assignedSection    || "";
  const assignedSubject = teacher.assignedSubject    || "";
  const assignedYear    = teacher.assignedYear       || "";

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [step, setStep]   = useState("mark"); // mark | done
  const [date, setDate]   = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState([]);
  const [saving, setSaving]   = useState(false);
  const [saveError, setSaveError] = useState("");

  // Load students in assigned department + section
  useEffect(() => {
    apiGet("/students/?page_size=1000")
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        const normalized = list.map((s) => ({
          ...s,
          fullName:   s.full_name   || s.fullName   || "",
          studentId:  s.student_id  || s.studentId  || "",
          department: typeof s.department === "object" ? s.department?.name : s.department || "",
          section:    s.section     || "",
        }));
        // Filter by assigned dept + section
        const filtered = normalized.filter((s) => {
          const deptMatch = !assignedDept || s.department === assignedDept || assignedDept === "Fresh";
          const secMatch  = !assignedSection || s.section === assignedSection;
          const yearMatch = !assignedYear || s.year === assignedYear;
          return deptMatch && secMatch && yearMatch;
        });
        setStudents(filtered);
        // Initialize all as Present
        setRecords(filtered.map((s) => ({
          studentId:   s.studentId || s.id,
          studentName: s.fullName,
          status:      "Present",
        })));
      })
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, [assignedDept, assignedSection]);

  const toggleStatus = (idx) => {
    setRecords((prev) => prev.map((r, i) => {
      if (i !== idx) return r;
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(r.status) + 1) % STATUS_CYCLE.length];
      return { ...r, status: next };
    }));
  };

  const setAll = (status) => setRecords((prev) => prev.map((r) => ({ ...r, status })));

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await createAttendanceSession({
        date,
        className: `${assignedDept} - ${assignedSection}`,
        subject:   assignedSubject,
        department: assignedDept,
        section:   assignedSection,
        records,
      });
      setStep("done");
    } catch (err) {
      setSaveError(err.message || "Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep("mark");
    setDate(new Date().toISOString().split("T")[0]);
    setRecords(students.map((s) => ({
      studentId:   s.studentId || s.id,
      studentName: s.fullName,
      status:      "Present",
    })));
    setSaveError("");
  };

  const present = records.filter((r) => r.status === "Present").length;
  const absent  = records.filter((r) => r.status === "Absent").length;
  const late    = records.filter((r) => r.status === "Late").length;

  const statusStyle = (s) => {
    if (s === "Present") return { bg: "#DCFCE7", text: "#15803D", border: "#86EFAC" };
    if (s === "Late")    return { bg: "#FEF9C3", text: "#A16207", border: "#FDE047" };
    return                      { bg: "#FEE2E2", text: "#DC2626", border: "#FCA5A5" };
  };

  // No assignment yet
  if (!assignedDept && !assignedSection) return (
    <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC", borderRadius: "14px", color: "#0369A1" }}>
      <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>⚠️</p>
      <p style={{ fontWeight: "600" }}>No teaching assignment yet.</p>
      <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>The admin will assign your department, section, and subject.</p>
    </div>
  );

  /* ── DONE ── */
  if (step === "done") return (
    <div style={{ maxWidth: "500px", margin: "0 auto", textAlign: "center", padding: "3rem 1rem" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
      <h2 style={{ color: "#0C4A6E", marginBottom: "0.5rem" }}>Attendance Saved!</h2>
      <p style={{ color: "#0369A1", marginBottom: "0.5rem" }}>{assignedDept} · {assignedSection} · {assignedSubject}</p>
      <p style={{ color: "#0369A1", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
        {present} Present · {absent} Absent · {late} Late — {date}
      </p>
      <button onClick={reset} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>
        ➕ Mark Another Session
      </button>
    </div>
  );

  /* ── MARK ATTENDANCE ── */
  return (
    <div>
      {/* Header — shows assigned info, no selection needed */}
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "14px", padding: "16px 20px", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h3 style={{ color: "#E0F2FE", margin: 0, fontWeight: "700" }}>✅ Mark Attendance</h3>
          <p style={{ color: "#64748B", margin: "3px 0 0", fontSize: "0.82rem" }}>
            {assignedDept} · {assignedSection} · {assignedSubject}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ background: "#DCFCE7", color: "#15803D", padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>✅ {present}</span>
          <span style={{ background: "#FEE2E2", color: "#DC2626", padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>❌ {absent}</span>
          <span style={{ background: "#FEF9C3", color: "#A16207", padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>🕐 {late}</span>
        </div>
      </div>

      {/* Date picker */}
      <div style={{ background: "#7DD3FC", borderRadius: "10px", padding: "14px 16px", marginBottom: "1rem", border: "1px solid rgba(14,165,233,0.2)", display: "flex", alignItems: "center", gap: "1rem" }}>
        <label style={{ color: "#0C4A6E", fontWeight: "700", fontSize: "0.82rem", textTransform: "uppercase", whiteSpace: "nowrap" }}>📅 Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem", outline: "none" }}
        />
      </div>

      {saveError && (
        <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px 14px", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.875rem", fontWeight: "500" }}>
          ❌ {saveError}
        </div>
      )}

      {loadingStudents ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#0369A1" }}>⏳ Loading students...</div>
      ) : records.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2.5rem", background: "#7DD3FC", borderRadius: "12px", color: "#0369A1" }}>
          <p style={{ fontSize: "2rem" }}>👥</p>
          <p>No students found in {assignedDept} · {assignedSection}.</p>
        </div>
      ) : (
        <>
          {/* Bulk actions */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ color: "#0369A1", fontSize: "0.82rem", fontWeight: "600" }}>Mark all:</span>
            {["Present", "Absent", "Late"].map((s) => {
              const sc = statusStyle(s);
              return (
                <button key={s} onClick={() => setAll(s)} style={{ padding: "6px 14px", background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.8rem" }}>
                  {s}
                </button>
              );
            })}
            <span style={{ color: "#0369A1", fontSize: "0.78rem", marginLeft: "auto" }}>
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

          <button onClick={handleSave} disabled={saving} style={{ padding: "11px 24px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "8px", cursor: saving ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "0.9rem", opacity: saving ? 0.7 : 1 }}>
            {saving ? "⏳ Saving..." : `💾 Save Attendance (${records.length} students)`}
          </button>
        </>
      )}
    </div>
  );
}
