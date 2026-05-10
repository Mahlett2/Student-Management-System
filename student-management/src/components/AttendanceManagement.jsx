import { useState, useEffect, useMemo } from "react";
import { apiGet, apiDelete } from "../api/client";

const DEPARTMENTS = [
  "Fresh",
  "Software Engineering", "Computer Science",
  "Information Systems", "Information Technology",
  "Civil Engineering", "Electrical Engineering",
  "Mechanical Engineering", "Chemical Engineering",
];

const LOW_THRESHOLD = 75;

export default function AttendanceManagement({ goBack }) {
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState("sessions"); // sessions | students | detail
  const [selectedSession, setSelectedSession] = useState(null);
  const [filterDept, setFilterDept]   = useState("");
  const [filterDate, setFilterDate]   = useState("");
  const [search, setSearch]           = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [filterStudentDept, setFilterStudentDept] = useState("");

  useEffect(() => {
    apiGet("/attendance/sessions/?page_size=1000")
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        const normalized = list.map((s) => ({
          ...s,
          className:      s.class_name       || s.className      || "",
          departmentName: s.department_name  || s.department     || "",
          markedBy:       s.marked_by_name   || s.markedBy       || "—",
          records: (s.records || []).map((r) => ({
            studentName: r.student_name || r.studentName || "",
            studentId:   r.student_code || r.studentId   || "",
            status:      r.status       || "Absent",
          })),
        }));
        setSessions(normalized.sort((a, b) => new Date(b.date) - new Date(a.date)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Per-student summary across all sessions ──
  const studentSummary = useMemo(() => {
    const map = {};
    sessions.forEach((sess) => {
      sess.records.forEach((rec) => {
        const key = rec.studentId || rec.studentName;
        if (!map[key]) {
          map[key] = {
            name:       rec.studentName,
            id:         rec.studentId,
            department: sess.departmentName,
            total: 0, present: 0, absent: 0, late: 0,
          };
        }
        map[key].total += 1;
        if (rec.status === "Present") map[key].present += 1;
        else if (rec.status === "Absent") map[key].absent += 1;
        else if (rec.status === "Late")   map[key].late   += 1;
      });
    });
    return Object.values(map).map((s) => ({
      ...s,
      rate: s.total > 0 ? Math.round(((s.present + s.late * 0.5) / s.total) * 100) : 0,
    })).sort((a, b) => a.rate - b.rate);
  }, [sessions]);

  const flaggedCount = studentSummary.filter((s) => s.rate < LOW_THRESHOLD).length;

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    const q = search.toLowerCase();
    return sessions.filter((s) =>
      (!q || s.className.toLowerCase().includes(q) || s.markedBy.toLowerCase().includes(q)) &&
      (!filterDept || s.departmentName === filterDept) &&
      (!filterDate || s.date === filterDate)
    );
  }, [sessions, search, filterDept, filterDate]);

  // Filtered student summary
  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase();
    return studentSummary.filter((s) =>
      (!q || s.name.toLowerCase().includes(q) || s.id?.toLowerCase().includes(q)) &&
      (!filterStudentDept || s.department === filterStudentDept)
    );
  }, [studentSummary, studentSearch, filterStudentDept]);

  const handleDeleteSession = async (id) => {
    if (!window.confirm("Delete this attendance session? This cannot be undone.")) return;
    try {
      await apiDelete(`/attendance/sessions/${id}/`);
      setSessions((p) => p.filter((s) => s.id !== id));
      if (selectedSession?.id === id) { setSelectedSession(null); setView("sessions"); }
    } catch (err) {
      alert("Delete failed: " + (err.message || "Unknown error"));
    }
  };

  const statusBadge = (status) => {
    if (status === "Present") return { bg: "#dcfce7", text: "#15803d" };
    if (status === "Late")    return { bg: "#fef9c3", text: "#a16207" };
    return { bg: "#fee2e2", text: "#dc2626" };
  };

  const rateColor = (rate) => {
    if (rate >= 90) return { bg: "#dcfce7", text: "#15803d", bar: "#10b981" };
    if (rate >= LOW_THRESHOLD) return { bg: "#fef9c3", text: "#a16207", bar: "#f59e0b" };
    return { bg: "#fee2e2", text: "#dc2626", bar: "#ef4444" };
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>⏳ Loading attendance data...</div>
  );

  /* ══════════════════════════════════════════
     SESSION DETAIL VIEW
  ══════════════════════════════════════════ */
  if (view === "detail" && selectedSession) {
    const present = selectedSession.records.filter((r) => r.status === "Present").length;
    const absent  = selectedSession.records.filter((r) => r.status === "Absent").length;
    const late    = selectedSession.records.filter((r) => r.status === "Late").length;
    const rate    = selectedSession.records.length > 0
      ? Math.round(((present + late * 0.5) / selectedSession.records.length) * 100)
      : 0;

    return (
      <div>
        <button onClick={() => { setView("sessions"); setSelectedSession(null); }} style={backBtn}>
          ⬅ Back to Sessions
        </button>

        {/* Session header */}
        <div style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ color: "white", margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>
              📅 {selectedSession.className}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.75)", margin: "4px 0 0", fontSize: "0.85rem" }}>
              {selectedSession.date} · {selectedSession.departmentName} · Marked by: {selectedSession.markedBy}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {[
              { label: "Present", value: present, color: "#dcfce7", text: "#15803d" },
              { label: "Absent",  value: absent,  color: "#fee2e2", text: "#dc2626" },
              { label: "Late",    value: late,     color: "#fef9c3", text: "#a16207" },
              { label: "Rate",    value: `${rate}%`, color: "rgba(255,255,255,0.2)", text: "white" },
            ].map((c) => (
              <div key={c.label} style={{ background: c.color, borderRadius: "10px", padding: "8px 16px", textAlign: "center" }}>
                <p style={{ color: c.text, fontWeight: "800", fontSize: "1.2rem", margin: 0 }}>{c.value}</p>
                <p style={{ color: c.text, fontSize: "0.7rem", fontWeight: "600", textTransform: "uppercase", margin: 0, opacity: 0.8 }}>{c.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Records table */}
        <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 6px #e9d5ff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#8b5cf6", color: "white" }}>
                {["#", "Student Name", "Student ID", "Status"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", fontSize: "0.85rem" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selectedSession.records.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No records in this session.</td></tr>
              ) : (
                selectedSession.records.map((r, i) => {
                  const sc = statusBadge(r.status);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#faf5ff", borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 16px", color: "#9ca3af" }}>{i + 1}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "500", color: "#374151" }}>{r.studentName}</td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#6b7280", fontSize: "0.85rem" }}>{r.studentId || "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: sc.bg, color: sc.text, padding: "3px 12px", borderRadius: "20px", fontWeight: "600", fontSize: "0.8rem" }}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     STUDENT SUMMARY VIEW
  ══════════════════════════════════════════ */
  if (view === "students") return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ color: "#5b21b6", margin: 0 }}>👥 Student Attendance Summary</h2>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "0.85rem" }}>
            {flaggedCount > 0 && (
              <span style={{ color: "#dc2626", fontWeight: "600" }}>⚠️ {flaggedCount} student{flaggedCount !== 1 ? "s" : ""} below {LOW_THRESHOLD}% · </span>
            )}
            {studentSummary.length} student{studentSummary.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <button onClick={() => setView("sessions")} style={backBtn}>⬅ Back</button>
      </div>

      {/* Low attendance alert */}
      {flaggedCount > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.3rem" }}>⚠️</span>
          <div>
            <p style={{ color: "#dc2626", fontWeight: "700", margin: 0 }}>Low Attendance Alert</p>
            <p style={{ color: "#dc2626", margin: "2px 0 0", fontSize: "0.85rem", opacity: 0.85 }}>
              {flaggedCount} student{flaggedCount !== 1 ? "s are" : " is"} below the {LOW_THRESHOLD}% minimum and may be barred from exams.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Search by name or student ID..."
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
        />
        <select value={filterStudentDept} onChange={(e) => setFilterStudentDept(e.target.value)} style={filterSel}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {filteredStudents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "12px", color: "#6b7280" }}>
          <p style={{ fontSize: "2rem" }}>📊</p>
          <p>No attendance data yet. Teachers need to mark attendance first.</p>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 6px #e9d5ff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#8b5cf6", color: "white" }}>
                {["Student", "ID", "Department", "Present", "Absent", "Late", "Total", "Rate", "Status"].map((h) => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: "600", fontSize: "0.82rem" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, i) => {
                const col = rateColor(s.rate);
                const isFlagged = s.rate < LOW_THRESHOLD;
                return (
                  <tr key={s.id || s.name} style={{ background: isFlagged ? "#fff7f7" : i % 2 === 0 ? "white" : "#faf5ff", borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {isFlagged && <span title="Low attendance">⚠️</span>}
                        <span style={{ fontWeight: "500", color: "#374151" }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px", fontFamily: "monospace", color: "#6b7280", fontSize: "0.82rem" }}>{s.id || "—"}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ background: "#ede9fe", color: "#5b21b6", padding: "2px 8px", borderRadius: "20px", fontSize: "0.75rem" }}>
                        {s.department || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px", color: "#15803d", fontWeight: "600" }}>{s.present}</td>
                    <td style={{ padding: "11px 14px", color: "#dc2626", fontWeight: "600" }}>{s.absent}</td>
                    <td style={{ padding: "11px 14px", color: "#a16207", fontWeight: "600" }}>{s.late}</td>
                    <td style={{ padding: "11px 14px", color: "#6b7280" }}>{s.total}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "60px", background: "#f3f4f6", borderRadius: "99px", height: "7px" }}>
                          <div style={{ width: `${s.rate}%`, background: col.bar, borderRadius: "99px", height: "7px" }} />
                        </div>
                        <span style={{ fontWeight: "700", fontSize: "0.85rem", color: col.text }}>{s.rate}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
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

  /* ══════════════════════════════════════════
     SESSIONS LIST VIEW (default)
  ══════════════════════════════════════════ */
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ color: "#5b21b6", margin: 0 }}>📅 Attendance Overview</h2>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "0.85rem" }}>
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded by teachers
            {flaggedCount > 0 && (
              <span style={{ color: "#dc2626", fontWeight: "600", marginLeft: "8px" }}>
                · ⚠️ {flaggedCount} student{flaggedCount !== 1 ? "s" : ""} with low attendance
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => setView("students")} style={{ ...actionBtn, background: "#6d28d9" }}>
            👥 Student Summary
          </button>
          <button onClick={goBack} style={backBtn}>⬅ Back</button>
        </div>
      </div>

      {/* Summary stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Sessions",    value: sessions.length,    icon: "📋", color: "#5b21b6", bg: "#ede9fe" },
          { label: "Students Tracked",  value: studentSummary.length, icon: "👥", color: "#1d4ed8", bg: "#dbeafe" },
          { label: "Low Attendance",    value: flaggedCount,       icon: "⚠️", color: "#dc2626", bg: "#fee2e2" },
          { label: "Teachers Reporting",value: [...new Set(sessions.map((s) => s.markedBy).filter(Boolean))].length, icon: "👨‍🏫", color: "#15803d", bg: "#dcfce7" },
        ].map((c) => (
          <div key={c.label} style={{ background: c.bg, borderRadius: "12px", padding: "16px", border: `1px solid ${c.color}30`, textAlign: "center" }}>
            <p style={{ fontSize: "1.4rem", margin: 0 }}>{c.icon}</p>
            <p style={{ fontWeight: "800", color: c.color, fontSize: "1.6rem", margin: "4px 0 2px" }}>{c.value}</p>
            <p style={{ fontSize: "0.75rem", color: c.color, fontWeight: "600", textTransform: "uppercase", margin: 0 }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Low attendance alert banner */}
      {flaggedCount > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.3rem" }}>⚠️</span>
            <div>
              <p style={{ color: "#dc2626", fontWeight: "700", margin: 0 }}>Low Attendance Warning</p>
              <p style={{ color: "#dc2626", margin: "2px 0 0", fontSize: "0.85rem", opacity: 0.85 }}>
                {flaggedCount} student{flaggedCount !== 1 ? "s are" : " is"} below {LOW_THRESHOLD}% — may be barred from exams.
              </p>
            </div>
          </div>
          <button onClick={() => setView("students")} style={{ padding: "7px 16px", background: "#dc2626", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem" }}>
            View Students →
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Search by class or teacher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
        />
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} style={filterSel}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
        />
        {(filterDept || filterDate || search) && (
          <button onClick={() => { setFilterDept(""); setFilterDate(""); setSearch(""); }}
            style={{ padding: "9px 14px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem" }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Sessions table */}
      {filteredSessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "12px", color: "#6b7280" }}>
          <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>📅</p>
          <p style={{ fontWeight: "600" }}>
            {sessions.length === 0
              ? "No attendance sessions yet. Teachers need to mark attendance from their portal."
              : "No sessions match your filters."}
          </p>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 6px #e9d5ff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#8b5cf6", color: "white" }}>
                {["Date", "Class", "Department", "Marked By", "Students", "Present", "Absent", "Rate", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: "600", fontSize: "0.82rem" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((sess, i) => {
                const present = sess.records.filter((r) => r.status === "Present").length;
                const absent  = sess.records.filter((r) => r.status === "Absent").length;
                const late    = sess.records.filter((r) => r.status === "Late").length;
                const total   = sess.records.length;
                const rate    = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;
                const col     = rateColor(rate);
                return (
                  <tr key={sess.id} style={{ background: i % 2 === 0 ? "white" : "#faf5ff", borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 14px", fontWeight: "500", color: "#374151" }}>{sess.date}</td>
                    <td style={{ padding: "12px 14px", color: "#374151" }}>{sess.className}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: "#ede9fe", color: "#5b21b6", padding: "2px 8px", borderRadius: "20px", fontSize: "0.75rem" }}>
                        {sess.departmentName || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: "0.85rem" }}>{sess.markedBy}</td>
                    <td style={{ padding: "12px 14px", color: "#374151" }}>{total}</td>
                    <td style={{ padding: "12px 14px", color: "#15803d", fontWeight: "600" }}>{present}</td>
                    <td style={{ padding: "12px 14px", color: "#dc2626", fontWeight: "600" }}>{absent}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: col.bg, color: col.text, padding: "2px 10px", borderRadius: "20px", fontWeight: "700", fontSize: "0.8rem" }}>
                        {rate}%
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button
                          onClick={() => { setSelectedSession(sess); setView("detail"); }}
                          style={{ padding: "6px 12px", background: "#ede9fe", color: "#5b21b6", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}
                        >
                          👁 View
                        </button>
                        <button
                          onClick={() => handleDeleteSession(sess.id)}
                          style={{ padding: "6px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}
                          title="Delete session"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Info note */}
      <div style={{ marginTop: "1.25rem", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "10px", padding: "12px 16px", fontSize: "0.85rem", color: "#15803d" }}>
        ℹ️ Attendance is marked by teachers from their portal. The admin can view all sessions, monitor student attendance rates, and delete incorrect sessions if needed.
      </div>
    </div>
  );
}

/* ── Shared styles ── */
const backBtn   = { padding: "8px 16px", background: "#ede9fe", color: "#5b21b6", border: "none", borderRadius: "8px", cursor: "pointer", display: "inline-block" };
const actionBtn = { padding: "9px 18px", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.875rem" };
const filterSel = { padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem", minWidth: "180px" };
