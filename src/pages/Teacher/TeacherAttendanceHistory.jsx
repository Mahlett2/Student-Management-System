import { useState, useMemo, useEffect } from "react";
import { apiGet } from "../../api/client";

const LOW = 75;

export default function TeacherAttendanceHistory() {
  const stored = localStorage.getItem("current_user");
  const teacher = stored ? JSON.parse(stored) : {};

  const [view, setView] = useState("summary"); // summary | sessions | detail
  const [selectedSession, setSelectedSession] = useState(null);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [mySessions, setMySessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load sessions from API on mount
  useEffect(() => {
    apiGet("/attendance/sessions/")
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        // Normalize API response fields to match component expectations
        const normalized = list.map((s) => ({
          ...s,
          className: s.class_name || s.className || "",
          records: (s.records || []).map((r) => ({
            studentName: r.student_name || r.studentName || "",
            studentId:   r.student_code || r.studentId || "",
            status:      r.status || "Present",
          })),
        }));
        // Sort newest first
        normalized.sort((a, b) => new Date(b.date) - new Date(a.date));
        setMySessions(normalized);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Unique classes
  const classes = [...new Set(mySessions.map((s) => s.className))];

  // Filtered sessions
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return mySessions.filter((s) =>
      (!q || s.className?.toLowerCase().includes(q) || s.subject?.toLowerCase().includes(q) || s.date?.includes(q)) &&
      (!filterClass || s.className === filterClass)
    );
  }, [mySessions, search, filterClass]);

  // Summary per class
  const classSummary = useMemo(() => {
    const map = {};
    mySessions.forEach((s) => {
      const key = s.className;
      if (!map[key]) map[key] = { className: key, department: s.department, sessions: 0, totalStudents: 0, totalPresent: 0, totalAbsent: 0, totalLate: 0 };
      map[key].sessions += 1;
      s.records.forEach((r) => {
        map[key].totalStudents += 1;
        if (r.status === "Present") map[key].totalPresent += 1;
        else if (r.status === "Absent") map[key].totalAbsent += 1;
        else if (r.status === "Late") map[key].totalLate += 1;
      });
    });
    return Object.values(map).map((c) => ({
      ...c,
      avgRate: c.totalStudents > 0 ? Math.round(((c.totalPresent + c.totalLate * 0.5) / c.totalStudents) * 100) : 0,
    }));
  }, [mySessions]);

  const rateColor = (r) => {
    if (r >= 90) return { bg: "#DCFCE7", text: "#15803D", bar: "#10B981" };
    if (r >= LOW) return { bg: "#FEF9C3", text: "#A16207", bar: "#F59E0B" };
    return { bg: "#FEE2E2", text: "#DC2626", bar: "#EF4444" };
  };

  const statusBadge = (s) => {
    if (s === "Present") return { bg: "#DCFCE7", text: "#15803D" };
    if (s === "Late") return { bg: "#FEF9C3", text: "#A16207" };
    return { bg: "#FEE2E2", text: "#DC2626" };
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#0369A1" }}>
        ⏳ Loading attendance history...
      </div>
    );
  }

  // Session detail view
  if (view === "detail" && selectedSession) {
    const sess = mySessions.find((s) => s.id === selectedSession);
    if (!sess) return null;
    const present = sess.records.filter((r) => r.status === "Present").length;
    const absent  = sess.records.filter((r) => r.status === "Absent").length;
    const late    = sess.records.filter((r) => r.status === "Late").length;
    const rate = sess.records.length > 0 ? Math.round(((present + late * 0.5) / sess.records.length) * 100) : 0;
    const col = rateColor(rate);

    return (
      <div>
        <button onClick={() => { setView("sessions"); setSelectedSession(null); }} style={backBtn}>⬅ Back to Sessions</button>
        <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "14px", padding: "18px 22px", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h2 style={{ color: "#E0F2FE", margin: 0, fontWeight: "800" }}>{sess.className}</h2>
            <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.82rem" }}>
              {sess.subject || sess.department} · {sess.date}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <span style={{ background: "#DCFCE7", color: "#15803D", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>✅ {present}</span>
            <span style={{ background: "#FEE2E2", color: "#DC2626", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>❌ {absent}</span>
            <span style={{ background: "#FEF9C3", color: "#A16207", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>🕐 {late}</span>
            <span style={{ background: col.bg, color: col.text, padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "800" }}>{rate}%</span>
          </div>
        </div>

        <div style={{ background: "#7DD3FC", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(14,165,233,0.2)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
                {["#", "Student Name", "Student ID", "Status"].map((h) => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "#38BDF8", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sess.records.map((r, i) => {
                const sc = statusBadge(r.status);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#7DD3FC" : "#BAE6FD", borderBottom: "1px solid rgba(14,165,233,0.12)" }}>
                    <td style={{ padding: "11px 14px", color: "#0369A1", fontWeight: "600" }}>{i + 1}</td>
                    <td style={{ padding: "11px 14px", fontWeight: "600", color: "#0C4A6E" }}>{r.studentName}</td>
                    <td style={{ padding: "11px 14px", fontFamily: "monospace", color: "#0369A1", fontSize: "0.82rem" }}>{r.studentId || "—"}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ background: sc.bg, color: sc.text, padding: "3px 12px", borderRadius: "20px", fontWeight: "700", fontSize: "0.82rem" }}>{r.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ color: "#E0F2FE", margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>📋 Attendance History</h2>
          <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.82rem" }}>
            {mySessions.length} session{mySessions.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px", background: "rgba(56,189,248,0.1)", padding: "4px", borderRadius: "10px" }}>
          {[{ id: "summary", label: "📊 Summary" }, { id: "sessions", label: "📋 All Sessions" }].map((t) => (
            <button key={t.id} onClick={() => setView(t.id)} style={{ padding: "7px 14px", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "700", fontSize: "0.82rem", background: view === t.id ? "linear-gradient(135deg,#0F172A,#1E293B)" : "transparent", color: view === t.id ? "#38BDF8" : "#94A3B8", transition: "all 0.18s" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SUMMARY VIEW ── */}
      {view === "summary" && (
        <>
          {classSummary.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC", borderRadius: "14px", color: "#0369A1" }}>
              <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>📋</p>
              <p style={{ fontWeight: "600" }}>No attendance sessions yet.</p>
              <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>Mark attendance sessions to see the summary here.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {classSummary.map((c) => {
                const col = rateColor(c.avgRate);
                return (
                  <div key={c.className} style={{ background: "#7DD3FC", borderRadius: "12px", padding: "16px 18px", border: "1px solid rgba(14,165,233,0.2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "10px" }}>
                      <div>
                        <h3 style={{ color: "#0C4A6E", margin: 0, fontWeight: "700" }}>{c.className}</h3>
                        <p style={{ color: "#0369A1", fontSize: "0.78rem", margin: "3px 0 0" }}>{c.sessions} session{c.sessions !== 1 ? "s" : ""} marked</p>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <span style={{ background: "#DCFCE7", color: "#15803D", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" }}>✅ {c.totalPresent}</span>
                        <span style={{ background: "#FEE2E2", color: "#DC2626", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" }}>❌ {c.totalAbsent}</span>
                        <span style={{ background: "#FEF9C3", color: "#A16207", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" }}>🕐 {c.totalLate}</span>
                        <span style={{ background: col.bg, color: col.text, padding: "4px 14px", borderRadius: "20px", fontWeight: "800", fontSize: "0.9rem" }}>{c.avgRate}%</span>
                      </div>
                    </div>
                    <div style={{ background: "rgba(14,165,233,0.15)", borderRadius: "99px", height: "8px" }}>
                      <div style={{ width: `${c.avgRate}%`, background: col.bar, borderRadius: "99px", height: "8px", transition: "width 0.4s" }} />
                    </div>
                    <p style={{ color: "#0369A1", fontSize: "0.72rem", margin: "4px 0 0" }}>
                      Average attendance rate across {c.sessions} session{c.sessions !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── ALL SESSIONS VIEW ── */}
      {view === "sessions" && (
        <>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <input placeholder="🔍 Search by class, subject or date..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: "200px", padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem", outline: "none" }} />
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem", outline: "none", minWidth: "160px" }}>
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC", borderRadius: "14px", color: "#0369A1" }}>
              <p style={{ fontSize: "2rem" }}>📭</p>
              <p>{mySessions.length === 0 ? "No sessions marked yet." : "No sessions match your search."}</p>
            </div>
          ) : (
            <div style={{ background: "#7DD3FC", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(14,165,233,0.2)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
                    {["Date", "Class", "Subject", "Students", "Present", "Absent", "Rate", "Action"].map((h) => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "#38BDF8", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => {
                    const present = s.records.filter((r) => r.status === "Present").length;
                    const absent  = s.records.filter((r) => r.status === "Absent").length;
                    const late    = s.records.filter((r) => r.status === "Late").length;
                    const rate = s.records.length > 0 ? Math.round(((present + late * 0.5) / s.records.length) * 100) : 0;
                    const col = rateColor(rate);
                    return (
                      <tr key={s.id} style={{ background: i % 2 === 0 ? "#7DD3FC" : "#BAE6FD", borderBottom: "1px solid rgba(14,165,233,0.12)" }}>
                        <td style={{ padding: "11px 14px", fontWeight: "500", color: "#0C4A6E" }}>{s.date}</td>
                        <td style={{ padding: "11px 14px", fontWeight: "600", color: "#0C4A6E" }}>{s.className}</td>
                        <td style={{ padding: "11px 14px", color: "#0369A1", fontSize: "0.82rem" }}>{s.subject || "—"}</td>
                        <td style={{ padding: "11px 14px", color: "#0C4A6E" }}>{s.records.length}</td>
                        <td style={{ padding: "11px 14px", color: "#15803D", fontWeight: "600" }}>{present}</td>
                        <td style={{ padding: "11px 14px", color: "#DC2626", fontWeight: "600" }}>{absent}</td>
                        <td style={{ padding: "11px 14px" }}>
                          <span style={{ background: col.bg, color: col.text, padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" }}>{rate}%</span>
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <button onClick={() => { setSelectedSession(s.id); setView("detail"); }} style={{ padding: "5px 12px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600" }}>
                            View →
                          </button>
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
    </div>
  );
}

const backBtn = { padding: "8px 16px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", marginBottom: "1rem", display: "inline-block" };
