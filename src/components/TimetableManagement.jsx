import { useState, useEffect } from "react";
import { createTimetableEntry, updateTimetableEntry, deleteTimetableEntry } from "../api/operations";
import { apiGet } from "../api/client";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = [
  "8:00 - 9:00", "9:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
  "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00",
  "16:00 - 17:00",
];
const DEPARTMENTS = [
  "Software Engineering", "Computer Science",
  "Information Systems", "Information Technology",
  "Civil Engineering", "Electrical Engineering",
  "Mechanical Engineering", "Chemical Engineering",
];

const EMPTY = { subject: "", teacher: "", room: "", day: "", timeSlot: "", department: "", classSection: "" };

const SLOT_COLORS = [
  "#ede9fe", "#dbeafe", "#dcfce7", "#fef9c3",
  "#fce7f3", "#ffedd5", "#e0f2fe", "#f0fdf4",
];

export default function TimetableManagement({ goBack }) {
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState("grid"); // grid | form | list
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [filterDept, setFilterDept] = useState(DEPARTMENTS[0]);

  useEffect(() => {
    apiGet("/timetable/?page_size=500")
      .then((data) => {
        if (data) {
          const normalised = (data.results ?? data).map((e) => ({
            ...e,
            timeSlot: e.time_slot ?? e.timeSlot ?? "",
            classSection: e.class_section ?? e.classSection ?? "",
            teacher: e.teacher_name ?? e.teacher ?? "",
          }));
          setEntries(normalised);
        }
      })
      .catch(() => {
        const s = localStorage.getItem("timetable");
        if (s) setEntries(JSON.parse(s));
      });
  }, []);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: undefined })); };

  const validate = () => {
    const e = {};
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.day) e.day = "Day is required";
    if (!form.timeSlot) e.timeSlot = "Time slot is required";
    if (!form.department) e.department = "Department is required";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      if (editId) {
        await updateTimetableEntry(editId, form);
        setEntries((p) => p.map((en) => en.id === editId ? { ...en, ...form } : en));
      } else {
        const created = await createTimetableEntry(form);
        if (created) setEntries((p) => [...p, { ...form, id: created.id }]);
      }
    } catch (err) { alert(err.data ? JSON.stringify(err.data) : err.message); return; }
    setForm(EMPTY); setEditId(null); setErrors({}); setView("grid");
  };

  const handleEdit = (en) => { setForm({ ...en }); setEditId(en.id); setView("form"); };
  const handleDelete = async (id) => {
    if (window.confirm("Remove this slot?")) {
      try { await deleteTimetableEntry(id); setEntries((p) => p.filter((en) => en.id !== id)); }
      catch (err) { alert("Delete failed: " + err.message); }
    }
  };

  // Build grid: day × timeSlot for selected dept
  const deptEntries = entries.filter((en) => en.department === filterDept);
  const getCell = (day, slot) => deptEntries.find((en) => en.day === day && en.timeSlot === slot);

  if (view === "form") return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <button onClick={() => { setView("grid"); setEditId(null); setForm(EMPTY); setErrors({}); }} style={backBtn}>⬅ Back</button>
      <div style={card}>
        <h2 style={heading}>{editId ? "✏️ Edit Schedule Slot" : "➕ Add Schedule Slot"}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
          <F label="Subject *" err={errors.subject}><input style={inp(errors.subject)} placeholder="e.g. Data Structures" value={form.subject} onChange={set("subject")} /></F>
          <F label="Teacher"><input style={inp(false)} placeholder="e.g. Dr. Abebe" value={form.teacher} onChange={set("teacher")} /></F>
          <F label="Department *" err={errors.department}>
            <select style={inp(errors.department)} value={form.department} onChange={set("department")}>
              <option value="">Select...</option>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </F>
          <F label="Class / Section"><input style={inp(false)} placeholder="e.g. CS301-A" value={form.classSection} onChange={set("classSection")} /></F>
          <F label="Day *" err={errors.day}>
            <select style={inp(errors.day)} value={form.day} onChange={set("day")}>
              <option value="">Select...</option>
              {DAYS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </F>
          <F label="Time Slot *" err={errors.timeSlot}>
            <select style={inp(errors.timeSlot)} value={form.timeSlot} onChange={set("timeSlot")}>
              <option value="">Select...</option>
              {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </F>
          <div style={{ gridColumn: "1/-1" }}>
            <F label="Room"><input style={inp(false)} placeholder="e.g. Room 204" value={form.room} onChange={set("room")} /></F>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button onClick={handleSave} style={saveBtn}>💾 {editId ? "Update Slot" : "Add to Timetable"}</button>
          <button onClick={() => { setView("grid"); setEditId(null); setForm(EMPTY); setErrors({}); }} style={cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={headerRow}>
        <div>
          <h2 style={heading}>🗓️ Timetable / Schedule</h2>
          <p style={sub}>{entries.length} slot{entries.length !== 1 ? "s" : ""} scheduled</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setErrors({}); setView("form"); }} style={saveBtn}>➕ Add Slot</button>
          <button onClick={goBack} style={backBtn}>⬅ Back</button>
        </div>
      </div>

      {/* Dept filter */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>View timetable for:</span>
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} style={filterSelect}>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Grid timetable */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
          <thead>
            <tr>
              <th style={{ ...th, background: "#5b21b6", color: "white", width: "110px" }}>Time</th>
              {DAYS.map((d) => (
                <th key={d} style={{ ...th, background: "#8b5cf6", color: "white", textAlign: "center" }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot, si) => (
              <tr key={slot} style={{ background: si % 2 === 0 ? "white" : "#faf5ff" }}>
                <td style={{ ...td, fontWeight: "600", fontSize: "0.8rem", color: "#5b21b6", background: "#ede9fe", whiteSpace: "nowrap" }}>
                  {slot}
                </td>
                {DAYS.map((day) => {
                  const cell = getCell(day, slot);
                  return (
                    <td key={day} style={{ ...td, textAlign: "center", verticalAlign: "top", minWidth: "120px", border: "1px solid #f3f4f6" }}>
                      {cell ? (
                        <div style={{
                          background: SLOT_COLORS[DEPARTMENTS.indexOf(cell.department) % SLOT_COLORS.length],
                          borderRadius: "8px", padding: "6px 8px", fontSize: "0.78rem", textAlign: "left",
                        }}>
                          <p style={{ fontWeight: "700", margin: "0 0 2px", color: "#374151" }}>{cell.subject}</p>
                          {cell.teacher && <p style={{ margin: "0 0 2px", color: "#6b7280" }}>👤 {cell.teacher}</p>}
                          {cell.room && <p style={{ margin: "0 0 4px", color: "#6b7280" }}>📍 {cell.room}</p>}
                          <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                            <button onClick={() => handleEdit(cell)} style={{ ...editBtn, padding: "2px 6px", fontSize: "0.7rem" }}>✏️</button>
                            <button onClick={() => handleDelete(cell.id)} style={{ ...delBtn, padding: "2px 6px", fontSize: "0.7rem" }}>🗑️</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setForm({ ...EMPTY, day, timeSlot: slot, department: filterDept }); setEditId(null); setErrors({}); setView("form"); }}
                          style={{ background: "none", border: "1px dashed #d1d5db", borderRadius: "8px", color: "#9ca3af", cursor: "pointer", padding: "6px 10px", fontSize: "0.75rem", width: "100%" }}
                        >+ Add</button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const F = ({ label, err, children }) => (
  <div style={{ marginBottom: "1rem" }}>
    <label style={{ display: "block", fontSize: "0.8rem", color: "#6b7280", marginBottom: "4px" }}>{label}</label>
    {children}
    {err && <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "2px" }}>{err}</p>}
  </div>
);

const card = { background: "white", borderRadius: "16px", padding: "2rem", boxShadow: "0 2px 12px #e9d5ff" };
const heading = { color: "#5b21b6", margin: "0 0 1.5rem" };
const sub = { color: "#6b7280", margin: "4px 0 0", fontSize: "0.85rem" };
const headerRow = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" };
const inp = (err) => ({ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${err ? "#ef4444" : "#d1d5db"}`, fontSize: "0.9rem", outline: "none" });
const saveBtn = { padding: "9px 18px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" };
const cancelBtn = { padding: "9px 18px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer" };
const backBtn = { padding: "8px 16px", background: "#ede9fe", color: "#5b21b6", border: "none", borderRadius: "8px", cursor: "pointer", marginBottom: "1rem", display: "inline-block" };
const editBtn = { background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "6px", cursor: "pointer" };
const delBtn = { background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer" };
const filterSelect = { padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem", minWidth: "200px" };
const th = { padding: "12px 16px", textAlign: "left", fontWeight: "600", fontSize: "0.85rem" };
const td = { padding: "8px 10px" };
