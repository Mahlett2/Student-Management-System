import { useState, useEffect, useMemo } from "react";
import { apiGet } from "../api/client";
import {
  createAttendanceSession,
  updateAttendanceSession,
  deleteAttendanceSession,
} from "../api/operations";

const DEPARTMENTS = [
  "Software Engineering", "Computer Science",
  "Information Systems", "Information Technology",
  "Civil Engineering", "Electrical Engineering",
  "Mechanical Engineering", "Chemical Engineering",
];

const LOW_THRESHOLD = 75;

export default function AttendanceManagement({ goBack }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | mark | summary
  const [sessionForm, setSessionForm] = useState({ date: "", className: "", department: "" });
  const [sessionErrors, setSessionErrors] = useState({});
  const [activeSession, setActiveSession] = useState(null);
  const [studentRows, setStudentRows] = useState([]);
  const [newStudent, setNewStudent] = useState({ studentName: "", studentId: "" });
  const [filterDept, setFilterDept] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Load sessions from API on mount
  useEffect(() => {
    apiGet("/attendance/sessions/")
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        // Normalize field names
        const normalized = list.map((s) => ({
          ...s,
          className: s.class_name || s.className || "",
          records: (s.records || []).map((r) => ({
            studentName: r.student_name || r.studentName || "",
            studentId:   r.student_code || r.studentId || "",
            status:      r.status || "Present",
          })),
        }));
        setSessions(normalized);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Summary: per student across all sessions ──
  const summary = useMemo(() => {
    const map = {};
    sessions.forEach((sess) => {
      sess.records.forEach((rec) => {
        const key = rec.studentId || rec.studentName;
        if (!map[key]) map[key] = { name: rec.studentName, id: rec.studentId, department: sess.department, total: 0, present: 0 };
        map[key].total += 1;
        if (rec.status === "Present") map[key].present += 1;
      });
    });
    return Object.values(map).map((s) => ({
      ...s,
      rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    })).sort((a, b) => a.rate - b.rate);
  }, [sessions]);

  const filteredSummary = useMemo(() => {
    const q = search.toLowerCase();
    return summary.filter((s) =>
      (!q || s.name.toLowerCase().includes(q) || s.id?.toLowerCase().includes(q)) &&
      (!filterDept || s.department === filterDept)
    );
  }, [summary, search, filterDept]);

  const flagged = filteredSummary.filter((s) => s.rate < LOW_THRESHOLD);

  // ── Start a new session ──
  const validateSession = () => {
    const e = {};
    if (!sessionForm.date) e.date = "Date is required";
    if (!sessionForm.className.trim()) e.className = "Class name is required";
    if (!sessionForm.department) e.department = "Department is required";
    return e;
  };

  const startSession = () => {
    const e = validateSession();
    if (Object.keys(e).length) { setSessionErrors(e); return; }
    const sess = { id: null, ...sessionForm, records: [] }; // id=null means new
    setActiveSession(sess);
    setStudentRows([]);
    setSessionErrors({});
    setSaveError("");
    setView("mark");
  };

  const addStudentRow = () => {
    if (!newStudent.studentName.trim()) return;
    setStudentRows((p) => [...p, { ...newStudent, status: "Present" }]);
    setNewStudent({ studentName: "", studentId: "" });
  };

  const toggleStatus = (idx) => {
    setStudentRows((p) => p.map((r, i) => i === idx
      ? { ...r, status: r.status === "Present" ? "Absent" : r.status === "Absent" ? "Late" : "Present" }
      : r
    ));
  };

  const removeRow = (idx) => setStudentRows((p) => p.filter((_, i) => i !== idx));

  const saveSession = async () => {
    if (studentRows.length === 0) return;
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        date:       activeSession.date,
        className:  activeSession.className,
        department: activeSession.department,
        records:    studentRows,
      };

      if (activeSession.id) {
        // Update existing
        const updated = await updateAttendanceSession(activeSession.id, payload);
        const normalized = {
          ...updated,
          className: updated.class_name || updated.className || activeSession.className,
          records: (updated.records || studentRows).map((r) => ({
            studentName: r.student_name || r.studentName || "",
            studentId:   r.student_code || r.studentId || "",
            status:      r.status || "Present",
          })),
        };
        setSessions((p) => p.map((s) => s.id === activeSession.id ? normalized : s));
      } else {
        // Create new
        const created = await createAttendanceSession(payload);
        const normalized = {
          ...created,
          className: created.class_name || created.className || activeSession.className,
          records: (created.records || studentRows).map((r) => ({
            studentName: r.student_name || r.studentName || "",
            studentId:   r.student_code || r.studentId || "",
            status:      r.status || "Present",
          })),
        };
        setSessions((p) => [...p, normalized]);
      }

      setActiveSession(null);
      setStudentRows([]);
      setView("list");
    } catch (err) {
      setSaveError(err.message || "Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const deleteSession = async (id) => {
    if (!window.confirm("Delete this attendance session?")) return;
    try {
      await deleteAttendanceSession(id);
      setSessions((p) => p.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete session.");
    }
  };

  const editSession = (sess) => {
    setSessionForm({ date: sess.date, className: sess.className, department: sess.department });
    setActiveSession(sess);
    setStudentRows([...sess.records]);
    setSaveError("");
    setView("mark");
  };

  const statusStyle = (status) => {
    if (status === "Present") return { bg: "#dcfce7", text: "#15803d" };
    if (status === "Absent")  return { bg: "#fee2e2", text: "#dc2626" };
    return { bg: "#fef9c3", text: "#a16207" };
  };

  const rateColor = (rate) => {
    if (rate >= 90) return { bg: "#dcfce7", text: "#15803d" };
    if (rate >= LOW_THRESHOLD) return { bg: "#fef9c3", text: "#a16207" };
    return { bg: "#fee2e2", text: "#dc2626" };
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
        ⏳ Loading attendance sessions...
      </div>
    );
  }

  /* ── MARK ATTENDANCE VIEW ── */
  if (view === "mark") return (
    <div style={{ maxWidth: "780px", margin: "0 auto" }}>
      <button onClick={() => { setView("list"); setActiveSession(null); setStudentRows([]); }} style={backBtn}>⬅ Back</button>
      <div style={card}>
        <h2 style={{ color: "#5b21b6", marginBottom: "0.25rem" }}>✅ Mark Attendance</h2>
        <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          {activeSession?.className} · {activeSession?.department} · {activeSession?.date}
        </p>

        {saveError && (
          <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.875rem" }}>
            ❌ {saveError}
          </div>
        )}

        {/* Add student row */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <input style={{ ...inp(false), flex: 1, minWidth: "160px" }} placeholder="Student Name *"
            value={newStudent.studentName} onChange={(e) => setNewStudent((n) => ({ ...n, studentName: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && addStudentRow()} />
          <input style={{ ...inp(false), flex: 1, minWidth: "140px" }} placeholder="Student ID (optional)"
            value={newStudent.studentId} onChange={(e) => setNewStudent((n) => ({ ...n, studentId: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && addStudentRow()} />
          <button onClick={addStudentRow} style={saveBtn}>➕ Add</button>
        </div>

        {studentRows.length === 0 ? (
          <p style={{ color: "#9ca3af", textAlign: "center", padding: "1.5rem" }}>Add students above to mark attendance</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1rem" }}>
            <thead>
              <tr style={{ background: "#8b5cf6", color: "white" }}>
                {["#", "Student Name", "ID", "Status", "Toggle", "Remove"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "0.85rem" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentRows.map((row, i) => {
                const col = statusStyle(row.status);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#faf5ff", borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 14px", color: "#6b7280" }}>{i + 1}</td>
                    <td style={{ padding: "10px 14px", fontWeight: "500" }}>{row.studentName}</td>
                    <td style={{ padding: "10px 14px", color: "#6b7280", fontFamily: "monospace", fontSize: "0.85rem" }}>{row.studentId || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ background: col.bg, color: col.text, padding: "3px 12px", borderRadius: "20px", fontWeight: "600", fontSize: "0.8rem" }}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={() => toggleStatus(i)} style={{ padding: "5px 12px", background: "#ede9fe", color: "#5b21b6", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>
                        Toggle
                      </button>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={() => removeRow(i)} style={{ padding: "5px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button onClick={saveSession} style={{ ...saveBtn, opacity: (studentRows.length === 0 || saving) ? 0.6 : 1, cursor: (studentRows.length === 0 || saving) ? "not-allowed" : "pointer" }} disabled={studentRows.length === 0 || saving}>
            {saving ? "⏳ Saving..." : `💾 Save Attendance (${studentRows.length} students)`}
          </button>
          <button onClick={() => { setView("list"); setActiveSession(null); setStudentRows([]); }} style={cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );

  /* ── SUMMARY VIEW ── */
  if (view === "summary") return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ color: "#5b21b6", margin: 0 }}>📊 Attendance Summary</h2>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "0.85rem" }}>
            {flagged.length > 0 && <span style={{ color: "#dc2626", fontWeight: "600" }}>⚠️ {flagged.length} student{flagged.length !== 1 ? "s" : ""} below {LOW_THRESHOLD}% · </span>}
            {summary.length} student{summary.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <button onClick={() => setView("list")} style={backBtn}>⬅ Back</button>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input placeholder="🔍 Search student..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem" }} />
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} style={filterSel}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {filteredSummary.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "12px", color: "#6b7280" }}>
          <p style={{ fontSize: "2rem" }}>📊</p>
          <p>No attendance data yet. Mark attendance sessions first.</p>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 6px #e9d5ff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#8b5cf6", color: "white" }}>
                {["Student", "ID", "Department", "Present", "Total", "Rate", "Status"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", fontSize: "0.85rem" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSummary.map((s, i) => {
                const col = rateColor(s.rate);
                const isFlagged = s.rate < LOW_THRESHOLD;
                return (
                  <tr key={s.id || s.name} style={{ background: isFlagged ? "#fff7f7" : i % 2 === 0 ? "white" : "#faf5ff", borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {isFlagged && <span title="Low attendance">⚠️</span>}
                        <span style={{ fontWeight: "500" }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontFamily: "monospace", fontSize: "0.85rem" }}>{s.id || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: "#ede9fe", color: "#5b21b6", padding: "3px 8px", borderRadius: "20px", fontSize: "0.75rem" }}>{s.department || "—"}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#15803d", fontWeight: "600" }}>{s.present}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>{s.total}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ flex: 1, background: "#f3f4f6", borderRadius: "99px", height: "8px", minWidth: "60px" }}>
                          <div style={{ width: `${s.rate}%`, background: col.text, borderRadius: "99px", height: "8px", transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontWeight: "700", fontSize: "0.85rem", color: col.text }}>{s.rate}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: col.bg, color: col.text, padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" }}>
                        {isFlagged ? "⚠️ Low" : s.rate >= 90 ? "✅ Good" : "🟡 Fair"}
                      </span>
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

  /* ── SESSION LIST VIEW ── */
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ color: "#5b21b6", margin: 0 }}>📅 Attendance</h2>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "0.85rem" }}>{sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button onClick={() => setView("summary")} style={{ ...saveBtn, background: "#6d28d9" }}>📊 View Summary</button>
          <button onClick={goBack} style={backBtn}>⬅ Back</button>
        </div>
      </div>

      {/* New session form */}
      <div style={{ ...card, marginBottom: "1.5rem" }}>
        <h3 style={{ color: "#5b21b6", marginBottom: "1rem" }}>➕ New Attendance Session</h3>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: "140px" }}>
            <label style={labelStyle}>Date *</label>
            <input type="date" style={inp(sessionErrors.date)} value={sessionForm.date}
              onChange={(e) => { setSessionForm((f) => ({ ...f, date: e.target.value })); setSessionErrors((er) => ({ ...er, date: undefined })); }} />
            {sessionErrors.date && <p style={errText}>{sessionErrors.date}</p>}
          </div>
          <div style={{ flex: 1, minWidth: "160px" }}>
            <label style={labelStyle}>Class Name *</label>
            <input style={inp(sessionErrors.className)} placeholder="e.g. CS301-A" value={sessionForm.className}
              onChange={(e) => { setSessionForm((f) => ({ ...f, className: e.target.value })); setSessionErrors((er) => ({ ...er, className: undefined })); }} />
            {sessionErrors.className && <p style={errText}>{sessionErrors.className}</p>}
          </div>
          <div style={{ flex: 1, minWidth: "180px" }}>
            <label style={labelStyle}>Department *</label>
            <select style={inp(sessionErrors.department)} value={sessionForm.department}
              onChange={(e) => { setSessionForm((f) => ({ ...f, department: e.target.value })); setSessionErrors((er) => ({ ...er, department: undefined })); }}>
              <option value="">Select...</option>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
            {sessionErrors.department && <p style={errText}>{sessionErrors.department}</p>}
          </div>
          <div style={{ paddingTop: "1.4rem" }}>
            <button onClick={startSession} style={saveBtn}>▶ Start Session</button>
          </div>
        </div>
      </div>

      {/* Past sessions */}
      {sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "12px", color: "#6b7280" }}>
          <p style={{ fontSize: "2rem" }}>📅</p>
          <p>No sessions yet. Create one above to start marking attendance.</p>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 6px #e9d5ff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#8b5cf6", color: "white" }}>
                {["Date", "Class", "Department", "Students", "Present", "Absent", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", fontSize: "0.85rem" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...sessions].reverse().map((sess, i) => {
                const present = sess.records.filter((r) => r.status === "Present").length;
                const absent  = sess.records.filter((r) => r.status === "Absent").length;
                return (
                  <tr key={sess.id} style={{ background: i % 2 === 0 ? "white" : "#faf5ff", borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "500" }}>{sess.date}</td>
                    <td style={{ padding: "12px 16px" }}>{sess.className}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: "#ede9fe", color: "#5b21b6", padding: "3px 8px", borderRadius: "20px", fontSize: "0.75rem" }}>{sess.department}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#374151" }}>{sess.records.length}</td>
                    <td style={{ padding: "12px 16px", color: "#15803d", fontWeight: "600" }}>{present}</td>
                    <td style={{ padding: "12px 16px", color: "#dc2626", fontWeight: "600" }}>{absent}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button onClick={() => editSession(sess)} style={editBtn}>✏️ Edit</button>
                        <button onClick={() => deleteSession(sess.id)} style={delBtn}>🗑️</button>
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

const inp = (err) => ({ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${err ? "#ef4444" : "#d1d5db"}`, fontSize: "0.9rem", outline: "none", boxSizing: "border-box" });
const card = { background: "white", borderRadius: "16px", padding: "2rem", boxShadow: "0 2px 12px #e9d5ff" };
const saveBtn = { padding: "9px 18px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" };
const cancelBtn = { padding: "9px 18px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer" };
const backBtn = { padding: "8px 16px", background: "#ede9fe", color: "#5b21b6", border: "none", borderRadius: "8px", cursor: "pointer", marginBottom: "1rem", display: "inline-block" };
const editBtn = { padding: "6px 10px", background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const delBtn = { padding: "6px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const filterSel = { padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem", minWidth: "180px" };
const labelStyle = { display: "block", fontSize: "0.8rem", color: "#6b7280", marginBottom: "4px" };
const errText = { color: "#ef4444", fontSize: "0.75rem", marginTop: "2px" };
