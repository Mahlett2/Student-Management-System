import { useState, useEffect, useMemo } from "react";
import { apiGet } from "../../api/client";

const LOW_THRESHOLD = 75;

export default function Attendance() {
  const stored = localStorage.getItem("current_user");
  const user = stored ? JSON.parse(stored) : {};

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState("summary"); // summary | history

  // Use /api/attendance/my/ — returns records for the logged-in student only
  useEffect(() => {
    apiGet("/attendance/my/?page_size=1000")
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        // Normalize field names from StudentAttendanceSerializer
        const normalized = list.map((r) => ({
          id:        r.id,
          date:      r.session_date || r.date || "",
          className: r.class_name   || r.className || "",
          subject:   r.subject      || "—",
          status:    r.status       || "Absent",
        }));
        setRecords(normalized.sort((a, b) => new Date(b.date) - new Date(a.date)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group by subject
  const bySubject = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      const key = r.subject !== "—" ? r.subject : r.className;
      if (!map[key]) map[key] = { subject: key, sessions: [] };
      map[key].sessions.push(r);
    });
    return Object.values(map).map((sub) => {
      const total   = sub.sessions.length;
      const present = sub.sessions.filter((s) => s.status === "Present").length;
      const late    = sub.sessions.filter((s) => s.status === "Late").length;
      const absent  = sub.sessions.filter((s) => s.status === "Absent").length;
      const rate    = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;
      return { ...sub, total, present, late, absent, rate };
    }).sort((a, b) => a.rate - b.rate);
  }, [records]);

  // Overall stats
  const totalSessions = records.length;
  const totalPresent  = records.filter((s) => s.status === "Present").length;
  const totalLate     = records.filter((s) => s.status === "Late").length;
  const totalAbsent   = records.filter((s) => s.status === "Absent").length;
  const overallRate   = totalSessions > 0
    ? Math.round(((totalPresent + totalLate * 0.5) / totalSessions) * 100)
    : null;

  const flagged = bySubject.filter((s) => s.rate < LOW_THRESHOLD);

  const rateColor = (rate) => {
    if (rate >= 90) return { bg: "#DCFCE7", text: "#15803D", bar: "#10B981" };
    if (rate >= LOW_THRESHOLD) return { bg: "#FEF9C3", text: "#A16207", bar: "#F59E0B" };
    return { bg: "#FEE2E2", text: "#DC2626", bar: "#EF4444" };
  };

  const statusBadge = (status) => {
    if (status === "Present") return { bg: "#DCFCE7", text: "#15803D" };
    if (status === "Late")    return { bg: "#FEF9C3", text: "#A16207" };
    return { bg: "#FEE2E2", text: "#DC2626" };
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#0369A1" }}>⏳ Loading attendance...</div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ color: "#E0F2FE", margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>📅 My Attendance</h2>
          <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.82rem" }}>{user.full_name}</p>
        </div>
        {overallRate !== null && (
          <div style={{ textAlign: "center", background: "rgba(56,189,248,0.1)", borderRadius: "12px", padding: "10px 20px", border: `1px solid ${overallRate < LOW_THRESHOLD ? "rgba(239,68,68,0.3)" : "rgba(56,189,248,0.2)"}` }}>
            <p style={{ color: "#64748B", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", margin: 0 }}>Overall Rate</p>
            <p style={{ color: overallRate < LOW_THRESHOLD ? "#EF4444" : "#38BDF8", fontSize: "1.8rem", fontWeight: "800", margin: "2px 0 0" }}>{overallRate}%</p>
            <p style={{ color: "#64748B", fontSize: "0.72rem", margin: 0 }}>
              {overallRate >= 90 ? "Excellent" : overallRate >= LOW_THRESHOLD ? "Acceptable" : "⚠️ Below Minimum"}
            </p>
          </div>
        )}
      </div>

      {/* Warning */}
      {flagged.length > 0 && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.3rem" }}>⚠️</span>
          <div>
            <p style={{ color: "#DC2626", fontWeight: "700", margin: 0, fontSize: "0.875rem" }}>Low Attendance Warning</p>
            <p style={{ color: "#DC2626", margin: "2px 0 0", fontSize: "0.82rem", opacity: 0.85 }}>
              {flagged.length} subject{flagged.length > 1 ? "s" : ""} below {LOW_THRESHOLD}% minimum.
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      {totalSessions > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "1.5rem" }}>
          {[
            { label: "Total Sessions", value: totalSessions, icon: "📋", color: "#38BDF8" },
            { label: "Present",        value: totalPresent,  icon: "✅", color: "#10B981" },
            { label: "Late",           value: totalLate,     icon: "🕐", color: "#F59E0B" },
            { label: "Absent",         value: totalAbsent,   icon: "❌", color: "#EF4444" },
          ].map((c) => (
            <div key={c.label} style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(56,189,248,0.15)", textAlign: "center" }}>
              <p style={{ fontSize: "1.3rem", margin: 0 }}>{c.icon}</p>
              <p style={{ color: c.color, fontWeight: "800", fontSize: "1.3rem", margin: "4px 0 2px" }}>{c.value}</p>
              <p style={{ color: "#64748B", fontSize: "0.7rem", fontWeight: "600", textTransform: "uppercase", margin: 0 }}>{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {records.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC", borderRadius: "14px", color: "#0369A1" }}>
          <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>📭</p>
          <p style={{ fontWeight: "600" }}>No attendance records found.</p>
          <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>Your attendance will appear here once the teacher marks it.</p>
        </div>
      ) : (
        <>
          {/* View tabs */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "1.25rem", background: "#7DD3FC", padding: "5px", borderRadius: "12px", border: "1px solid rgba(14,165,233,0.2)" }}>
            {[
              { id: "summary", label: "📊 By Subject" },
              { id: "history", label: `📋 Full History (${records.length})` },
            ].map((t) => (
              <button key={t.id} onClick={() => setView(t.id)} style={{
                flex: 1, padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer",
                fontWeight: "700", fontSize: "0.85rem",
                background: view === t.id ? "linear-gradient(135deg,#0F172A,#1E293B)" : "transparent",
                color: view === t.id ? "#38BDF8" : "#0369A1",
                transition: "all 0.18s",
              }}>{t.label}</button>
            ))}
          </div>

          {/* By Subject view */}
          {view === "summary" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {bySubject.map((sub) => {
                const col = rateColor(sub.rate);
                const isFlagged = sub.rate < LOW_THRESHOLD;
                return (
                  <div key={sub.subject} style={{ background: isFlagged ? "rgba(254,226,226,0.5)" : "#7DD3FC", borderRadius: "12px", padding: "16px 18px", border: `1px solid ${isFlagged ? "rgba(239,68,68,0.3)" : "rgba(14,165,233,0.2)"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "10px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {isFlagged && <span>⚠️</span>}
                          <h4 style={{ color: "#0C4A6E", margin: 0, fontWeight: "700" }}>📖 {sub.subject}</h4>
                        </div>
                        <p style={{ color: "#0369A1", fontSize: "0.78rem", margin: "3px 0 0" }}>{sub.total} sessions</p>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <span style={{ background: "#DCFCE7", color: "#15803D", padding: "2px 8px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "600" }}>✅ {sub.present}</span>
                        <span style={{ background: "#FEF9C3", color: "#A16207", padding: "2px 8px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "600" }}>🕐 {sub.late}</span>
                        <span style={{ background: "#FEE2E2", color: "#DC2626", padding: "2px 8px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "600" }}>❌ {sub.absent}</span>
                        <span style={{ background: col.bg, color: col.text, padding: "4px 14px", borderRadius: "20px", fontWeight: "800", fontSize: "0.9rem" }}>{sub.rate}%</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ background: "rgba(14,165,233,0.15)", borderRadius: "99px", height: "8px" }}>
                      <div style={{ width: `${sub.rate}%`, background: col.bar, borderRadius: "99px", height: "8px", transition: "width 0.4s" }} />
                    </div>
                    {isFlagged && <p style={{ color: "#DC2626", fontSize: "0.72rem", margin: "4px 0 0", fontWeight: "600" }}>⚠️ Below {LOW_THRESHOLD}% minimum</p>}

                    {/* Per-day breakdown */}
                    <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {sub.sessions.map((s, i) => {
                        const sc = statusBadge(s.status);
                        return (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#BAE6FD", borderRadius: "6px", padding: "6px 10px" }}>
                            <span style={{ color: "#0C4A6E", fontSize: "0.82rem", fontWeight: "500" }}>{s.date}</span>
                            <span style={{ background: sc.bg, color: sc.text, padding: "2px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" }}>{s.status}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full history view */}
          {view === "history" && (
            <div style={{ background: "#7DD3FC", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(14,165,233,0.2)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
                    {["Date", "Subject", "Class", "Status"].map((h) => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "#38BDF8", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((s, i) => {
                    const sc = statusBadge(s.status);
                    return (
                      <tr key={s.id} style={{ background: i % 2 === 0 ? "#7DD3FC" : "#BAE6FD", borderBottom: "1px solid rgba(14,165,233,0.12)" }}>
                        <td style={{ padding: "10px 14px", color: "#0C4A6E", fontWeight: "500" }}>{s.date}</td>
                        <td style={{ padding: "10px 14px", color: "#0C4A6E", fontWeight: "600" }}>{s.subject}</td>
                        <td style={{ padding: "10px 14px", color: "#0369A1", fontSize: "0.82rem" }}>{s.className}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ background: sc.bg, color: sc.text, padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>
                            {s.status}
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
    </div>
  );
}
