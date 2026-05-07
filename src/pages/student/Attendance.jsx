import { useMemo } from "react";

const LOW_THRESHOLD = 75;

export default function Attendance() {
  const stored = localStorage.getItem("student");
  const student = stored ? JSON.parse(stored) : {};

  // Read attendance sessions from localStorage (set by admin)
  const sessions = JSON.parse(localStorage.getItem("attendance_sessions") || "[]");

  // Find all sessions where this student appears
  const mySessions = useMemo(() => {
    return sessions
      .filter((sess) =>
        sess.records.some(
          (r) => r.studentName?.toLowerCase() === student.name?.toLowerCase()
        )
      )
      .map((sess) => {
        const rec = sess.records.find(
          (r) => r.studentName?.toLowerCase() === student.name?.toLowerCase()
        );
        return {
          id: sess.id,
          date: sess.date,
          className: sess.className,
          department: sess.department,
          status: rec?.status || "Absent",
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sessions, student.name]);

  // Group by class
  const byClass = useMemo(() => {
    const map = {};
    mySessions.forEach((s) => {
      const key = s.className;
      if (!map[key]) map[key] = { className: s.className, department: s.department, sessions: [] };
      map[key].sessions.push(s);
    });
    return Object.values(map).map((c) => {
      const total = c.sessions.length;
      const present = c.sessions.filter((s) => s.status === "Present").length;
      const late = c.sessions.filter((s) => s.status === "Late").length;
      const absent = c.sessions.filter((s) => s.status === "Absent").length;
      const rate = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;
      return { ...c, total, present, late, absent, rate };
    }).sort((a, b) => a.rate - b.rate);
  }, [mySessions]);

  // Overall stats
  const totalSessions = mySessions.length;
  const totalPresent = mySessions.filter((s) => s.status === "Present").length;
  const totalLate = mySessions.filter((s) => s.status === "Late").length;
  const totalAbsent = mySessions.filter((s) => s.status === "Absent").length;
  const overallRate = totalSessions > 0
    ? Math.round(((totalPresent + totalLate * 0.5) / totalSessions) * 100)
    : null;

  const flagged = byClass.filter((c) => c.rate < LOW_THRESHOLD);

  const rateColor = (rate) => {
    if (rate >= 90) return { bg: "#DCFCE7", text: "#15803D", bar: "#10B981" };
    if (rate >= LOW_THRESHOLD) return { bg: "#FEF9C3", text: "#A16207", bar: "#F59E0B" };
    return { bg: "#FEE2E2", text: "#DC2626", bar: "#EF4444" };
  };

  const statusBadge = (status) => {
    if (status === "Present") return { bg: "#DCFCE7", text: "#15803D" };
    if (status === "Late") return { bg: "#FEF9C3", text: "#A16207" };
    return { bg: "#FEE2E2", text: "#DC2626" };
  };

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ color: "#E0F2FE", margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>📅 My Attendance</h2>
          <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.82rem" }}>{student.name} · {student.department}</p>
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

      {/* Warning banner */}
      {flagged.length > 0 && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.3rem" }}>⚠️</span>
          <div>
            <p style={{ color: "#DC2626", fontWeight: "700", margin: 0, fontSize: "0.875rem" }}>
              Low Attendance Warning
            </p>
            <p style={{ color: "#DC2626", margin: "2px 0 0", fontSize: "0.82rem", opacity: 0.85 }}>
              You have {flagged.length} class{flagged.length > 1 ? "es" : ""} below the {LOW_THRESHOLD}% minimum attendance requirement.
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      {totalSessions > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "1.5rem" }}>
          {[
            { label: "Total Sessions", value: totalSessions, icon: "📋", color: "#38BDF8" },
            { label: "Present", value: totalPresent, icon: "✅", color: "#10B981" },
            { label: "Late", value: totalLate, icon: "🕐", color: "#F59E0B" },
            { label: "Absent", value: totalAbsent, icon: "❌", color: "#EF4444" },
          ].map((c) => (
            <div key={c.label} style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(56,189,248,0.15)", textAlign: "center" }}>
              <p style={{ fontSize: "1.3rem", margin: 0 }}>{c.icon}</p>
              <p style={{ color: c.color, fontWeight: "800", fontSize: "1.3rem", margin: "4px 0 2px" }}>{c.value}</p>
              <p style={{ color: "#64748B", fontSize: "0.7rem", fontWeight: "600", textTransform: "uppercase", margin: 0 }}>{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Per-class breakdown */}
      {mySessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC", borderRadius: "14px", color: "#0369A1" }}>
          <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>📭</p>
          <p style={{ fontWeight: "600" }}>No attendance records found.</p>
          <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>Your attendance will appear here once the admin marks it.</p>
        </div>
      ) : (
        <>
          <h3 style={{ color: "#0C4A6E", margin: "0 0 12px", fontSize: "0.9rem", fontWeight: "700" }}>
            Attendance by Class ({byClass.length} class{byClass.length !== 1 ? "es" : ""})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "1.5rem" }}>
            {byClass.map((c) => {
              const col = rateColor(c.rate);
              const flagged = c.rate < LOW_THRESHOLD;
              return (
                <div key={c.className} style={{ background: "#7DD3FC", borderRadius: "12px", padding: "16px 18px", border: `1px solid ${flagged ? "rgba(239,68,68,0.3)" : "rgba(14,165,233,0.2)"}`, background: flagged ? "rgba(254,226,226,0.5)" : "#7DD3FC" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "10px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {flagged && <span title="Below 75%">⚠️</span>}
                        <h4 style={{ color: "#0C4A6E", margin: 0, fontWeight: "700" }}>{c.className}</h4>
                      </div>
                      <p style={{ color: "#0369A1", fontSize: "0.78rem", margin: "3px 0 0" }}>{c.department}</p>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.78rem" }}>
                        <span style={{ background: "#DCFCE7", color: "#15803D", padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>✅ {c.present}</span>
                        <span style={{ background: "#FEF9C3", color: "#A16207", padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>🕐 {c.late}</span>
                        <span style={{ background: "#FEE2E2", color: "#DC2626", padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>❌ {c.absent}</span>
                      </div>
                      <span style={{ background: col.bg, color: col.text, padding: "4px 14px", borderRadius: "20px", fontWeight: "800", fontSize: "0.9rem" }}>
                        {c.rate}%
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ background: "rgba(14,165,233,0.15)", borderRadius: "99px", height: "8px" }}>
                    <div style={{ width: `${c.rate}%`, background: col.bar, borderRadius: "99px", height: "8px", transition: "width 0.4s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                    <p style={{ color: "#0369A1", fontSize: "0.72rem", margin: 0 }}>{c.present + c.late} / {c.total} sessions attended</p>
                    {flagged && <p style={{ color: "#DC2626", fontSize: "0.72rem", margin: 0, fontWeight: "600" }}>⚠️ Below {LOW_THRESHOLD}% minimum</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Session history */}
          <h3 style={{ color: "#0C4A6E", margin: "0 0 12px", fontSize: "0.9rem", fontWeight: "700" }}>
            Session History ({mySessions.length} sessions)
          </h3>
          <div style={{ background: "#7DD3FC", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(14,165,233,0.2)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
                  {["Date", "Class", "Status"].map((h) => (
                    <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "#38BDF8", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mySessions.map((s, i) => {
                  const sc = statusBadge(s.status);
                  return (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? "#7DD3FC" : "#BAE6FD", borderBottom: "1px solid rgba(14,165,233,0.12)" }}>
                      <td style={{ padding: "10px 14px", color: "#0C4A6E", fontWeight: "500" }}>{s.date}</td>
                      <td style={{ padding: "10px 14px", color: "#0C4A6E" }}>{s.className}</td>
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
        </>
      )}
    </div>
  );
}
