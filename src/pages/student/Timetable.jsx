import { useState, useEffect, useMemo } from "react";
import { apiGet } from "../../api/client";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = [
  "8:00 - 9:00", "9:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
  "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00",
  "16:00 - 17:00",
];

const SLOT_COLORS = [
  { bg: "#DBEAFE", text: "#1D4ED8", border: "#93C5FD" },
  { bg: "#DCFCE7", text: "#15803D", border: "#86EFAC" },
  { bg: "#FEF9C3", text: "#A16207", border: "#FDE047" },
  { bg: "#FCE7F3", text: "#9D174D", border: "#F9A8D4" },
  { bg: "#FFEDD5", text: "#C2410C", border: "#FED7AA" },
  { bg: "#F3E8FF", text: "#7E22CE", border: "#D8B4FE" },
  { bg: "#E0F2FE", text: "#0369A1", border: "#7DD3FC" },
];

export default function Timetable() {
  const stored = localStorage.getItem("current_user");
  const user = stored ? JSON.parse(stored) : {};

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/timetable/")
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        // Normalize API field names
        const normalized = list.map((e) => ({
          ...e,
          subject:      e.subject_name || e.subject || "",
          teacher:      e.teacher_name || e.teacher || "",
          timeSlot:     e.time_slot || e.timeSlot || "",
          classSection: e.class_section || e.classSection || "",
          department:   typeof e.department === "object" ? e.department?.name : e.department || "",
        }));
        setEntries(normalized);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filter entries for this student's department
  const myEntries = useMemo(() => {
    const dept = user.department || "";
    return entries.filter((e) => !dept || e.department === dept);
  }, [entries, user.department]);

  // Build a color map per subject (consistent colors)
  const subjectColors = useMemo(() => {
    const map = {};
    let idx = 0;
    myEntries.forEach((e) => {
      if (!map[e.subject]) {
        map[e.subject] = SLOT_COLORS[idx % SLOT_COLORS.length];
        idx++;
      }
    });
    return map;
  }, [myEntries]);

  const getCell = (day, slot) =>
    myEntries.find((e) => e.day === day && e.timeSlot === slot);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayEntries = myEntries
    .filter((e) => e.day === today)
    .sort((a, b) => TIME_SLOTS.indexOf(a.timeSlot) - TIME_SLOTS.indexOf(b.timeSlot));

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#0369A1" }}>
        ⏳ Loading timetable...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ color: "#E0F2FE", margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>🗓️ My Timetable</h2>
          <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.82rem" }}>
            {user.department}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: "#38BDF8", fontWeight: "700", margin: 0, fontSize: "0.875rem" }}>{today}</p>
          <p style={{ color: "#64748B", margin: "2px 0 0", fontSize: "0.78rem" }}>
            {todayEntries.length} class{todayEntries.length !== 1 ? "es" : ""} today
          </p>
        </div>
      </div>

      {myEntries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC", borderRadius: "14px", color: "#0369A1" }}>
          <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>📭</p>
          <p style={{ fontWeight: "600" }}>No timetable assigned yet.</p>
          <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
            The admin will assign your class schedule. Check back later.
          </p>
        </div>
      ) : (
        <>
          {/* Today's classes */}
          {todayEntries.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ color: "#0C4A6E", margin: "0 0 10px", fontSize: "0.9rem", fontWeight: "700" }}>
                📌 Today's Classes — {today}
              </h3>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {todayEntries.map((e) => {
                  const col = subjectColors[e.subject] || SLOT_COLORS[0];
                  return (
                    <div key={e.id} style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: "10px", padding: "12px 16px", minWidth: "160px" }}>
                      <p style={{ fontWeight: "700", color: col.text, margin: "0 0 3px", fontSize: "0.875rem" }}>{e.subject}</p>
                      <p style={{ color: col.text, fontSize: "0.78rem", margin: "0 0 2px", opacity: 0.85 }}>⏰ {e.timeSlot}</p>
                      {e.room && <p style={{ color: col.text, fontSize: "0.78rem", margin: 0, opacity: 0.85 }}>📍 {e.room}</p>}
                      {e.teacher && <p style={{ color: col.text, fontSize: "0.78rem", margin: "2px 0 0", opacity: 0.85 }}>👤 {e.teacher}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weekly grid */}
          <h3 style={{ color: "#0C4A6E", margin: "0 0 10px", fontSize: "0.9rem", fontWeight: "700" }}>
            📅 Weekly Schedule
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
              <thead>
                <tr>
                  <th style={{ ...th, background: "#0C4A6E", color: "#BAE6FD", width: "100px" }}>Time</th>
                  {DAYS.map((d) => (
                    <th key={d} style={{ ...th, background: d === today ? "#0F172A" : "#1E293B", color: d === today ? "#38BDF8" : "#BAE6FD", textAlign: "center", borderBottom: d === today ? "3px solid #38BDF8" : "none" }}>
                      {d}
                      {d === today && <span style={{ display: "block", fontSize: "0.65rem", color: "#38BDF8", fontWeight: "400" }}>Today</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot, si) => (
                  <tr key={slot} style={{ background: si % 2 === 0 ? "#BAE6FD" : "#7DD3FC" }}>
                    <td style={{ padding: "8px 10px", fontWeight: "700", fontSize: "0.75rem", color: "#0C4A6E", background: "#E0F2FE", whiteSpace: "nowrap", borderRight: "2px solid rgba(14,165,233,0.2)" }}>
                      {slot}
                    </td>
                    {DAYS.map((day) => {
                      const cell = getCell(day, slot);
                      const col = cell ? (subjectColors[cell.subject] || SLOT_COLORS[0]) : null;
                      return (
                        <td key={day} style={{ padding: "6px 8px", textAlign: "center", verticalAlign: "top", minWidth: "120px", border: "1px solid rgba(14,165,233,0.15)", background: day === today ? "rgba(56,189,248,0.05)" : "transparent" }}>
                          {cell ? (
                            <div style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: "8px", padding: "6px 8px", textAlign: "left" }}>
                              <p style={{ fontWeight: "700", margin: "0 0 2px", color: col.text, fontSize: "0.78rem" }}>{cell.subject}</p>
                              {cell.room && <p style={{ margin: 0, color: col.text, fontSize: "0.7rem", opacity: 0.85 }}>📍 {cell.room}</p>}
                              {cell.teacher && <p style={{ margin: "2px 0 0", color: col.text, fontSize: "0.7rem", opacity: 0.85 }}>👤 {cell.teacher}</p>}
                            </div>
                          ) : (
                            <span style={{ color: "rgba(14,165,233,0.2)", fontSize: "0.7rem" }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subject legend */}
          {Object.keys(subjectColors).length > 0 && (
            <div style={{ marginTop: "1.25rem", background: "#7DD3FC", borderRadius: "12px", padding: "14px 18px", border: "1px solid rgba(14,165,233,0.2)" }}>
              <p style={{ color: "#0C4A6E", fontWeight: "700", fontSize: "0.8rem", margin: "0 0 8px", textTransform: "uppercase" }}>Subjects</p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {Object.entries(subjectColors).map(([subject, col]) => (
                  <span key={subject} style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}`, padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "600" }}>
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const th = { padding: "12px 14px", textAlign: "left", fontWeight: "700", fontSize: "0.8rem" };
