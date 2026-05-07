import { useState, useEffect } from "react";
import { createClass, updateClass, deleteClass } from "../api/operations";
import { apiGet } from "../api/client";

const DEPARTMENTS = [
  "Software Engineering", "Computer Science",
  "Information Systems", "Information Technology",
  "Civil Engineering", "Electrical Engineering",
  "Mechanical Engineering", "Chemical Engineering",
];
const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];
const SEMESTERS = ["Semester 1", "Semester 2"];

const EMPTY = { name: "", section: "", department: "", year: "", semester: "", capacity: "", room: "" };

export default function ClassesManagement({ goBack }) {
  const [classes, setClasses] = useState([]);
  const [view, setView] = useState("list");
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");

  useEffect(() => {
    apiGet("/classes/?page_size=500")
      .then((data) => {
        if (data) {
          const list = data.results ?? data;
          const normalized = list.map((c) => ({
            ...c,
            department: typeof c.department === "object" ? c.department?.name : c.department ?? "",
          }));
          setClasses(normalized);
        }
      })
      .catch(() => {
        const s = localStorage.getItem("classes");
        if (s) setClasses(JSON.parse(s));
      });
  }, []);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: undefined })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Class name is required";
    if (!form.department) e.department = "Department is required";
    if (!form.year) e.year = "Year is required";
    if (!form.semester) e.semester = "Semester is required";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      if (editId) {
        await updateClass(editId, form);
        setClasses((p) => p.map((c) => c.id === editId ? { ...c, ...form } : c));
      } else {
        const created = await createClass(form);
        if (created) setClasses((p) => [...p, { ...form, id: created.id }]);
      }
    } catch (err) { alert(err.data ? JSON.stringify(err.data) : err.message); return; }
    setForm(EMPTY); setEditId(null); setErrors({}); setView("list");
  };

  const handleEdit = (c) => { setForm({ ...c }); setEditId(c.id); setView("form"); };
  const handleDelete = async (id) => {
    if (window.confirm("Delete this class?")) {
      try { await deleteClass(id); setClasses((p) => p.filter((c) => c.id !== id)); }
      catch (err) { alert("Delete failed: " + err.message); }
    }
  };

  const filtered = classes.filter((c) => {
    const q = search.toLowerCase();
    return (!q || c.name.toLowerCase().includes(q) || c.room?.toLowerCase().includes(q)) &&
      (!filterDept || c.department === filterDept);
  });

  if (view === "form") return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <button onClick={() => { setView("list"); setEditId(null); setForm(EMPTY); setErrors({}); }} style={backBtn}>⬅ Back</button>
      <div style={card}>
        <h2 style={heading}>{editId ? "✏️ Edit Class" : "➕ Add New Class"}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
          <F label="Class Name *" err={errors.name}><input style={inp(errors.name)} placeholder="e.g. CS301" value={form.name} onChange={set("name")} /></F>
          <F label="Section" err={errors.section}><input style={inp(false)} placeholder="e.g. A" value={form.section} onChange={set("section")} /></F>
          <F label="Department *" err={errors.department}>
            <select style={inp(errors.department)} value={form.department} onChange={set("department")}>
              <option value="">Select...</option>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </F>
          <F label="Year *" err={errors.year}>
            <select style={inp(errors.year)} value={form.year} onChange={set("year")}>
              <option value="">Select...</option>
              {YEARS.map((y) => <option key={y}>{y}</option>)}
            </select>
          </F>
          <F label="Semester *" err={errors.semester}>
            <select style={inp(errors.semester)} value={form.semester} onChange={set("semester")}>
              <option value="">Select...</option>
              {SEMESTERS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </F>
          <F label="Capacity"><input style={inp(false)} placeholder="e.g. 40" value={form.capacity} onChange={set("capacity")} /></F>
          <div style={{ gridColumn: "1/-1" }}>
            <F label="Room / Hall"><input style={inp(false)} placeholder="e.g. Room 204" value={form.room} onChange={set("room")} /></F>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button onClick={handleSave} style={saveBtn}>💾 {editId ? "Update" : "Save Class"}</button>
          <button onClick={() => { setView("list"); setEditId(null); setForm(EMPTY); setErrors({}); }} style={cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={headerRow}>
        <div>
          <h2 style={heading}>🏫 Classes Management</h2>
          <p style={sub}>{classes.length} class section{classes.length !== 1 ? "s" : ""} registered</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setErrors({}); setView("form"); }} style={saveBtn}>➕ Add Class</button>
          <button onClick={goBack} style={backBtn}>⬅ Back</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input placeholder="🔍 Search by name or room..." value={search} onChange={(e) => setSearch(e.target.value)} style={searchInput} />
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} style={filterSelect}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      {filtered.length === 0 ? (
        <div style={emptyState}>
          <p style={{ fontSize: "2rem" }}>🏫</p>
          <p>{classes.length === 0 ? 'No classes yet. Click "Add Class" to get started.' : "No classes match your search."}</p>
        </div>
      ) : (
        <div style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#8b5cf6", color: "white" }}>
                {["Class", "Section", "Department", "Year", "Semester", "Room", "Capacity", "Actions"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? "white" : "#faf5ff", borderBottom: "1px solid #f3f4f6" }}>
                  <td style={td}><span style={{ fontWeight: "600", color: "#5b21b6" }}>{c.name}</span></td>
                  <td style={td}>{c.section || "—"}</td>
                  <td style={td}><span style={badge}>{c.department}</span></td>
                  <td style={td}>{c.year}</td>
                  <td style={td}>{c.semester}</td>
                  <td style={td}>{c.room || "—"}</td>
                  <td style={td}>{c.capacity || "—"}</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => handleEdit(c)} style={editBtn}>✏️</button>
                      <button onClick={() => handleDelete(c.id)} style={delBtn}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
const editBtn = { padding: "6px 10px", background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const delBtn = { padding: "6px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const badge = { background: "#ede9fe", color: "#5b21b6", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "500" };
const tableWrap = { background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 6px #e9d5ff" };
const th = { padding: "12px 16px", textAlign: "left", fontWeight: "600", fontSize: "0.85rem" };
const td = { padding: "12px 16px" };
const searchInput = { flex: 1, minWidth: "200px", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem" };
const filterSelect = { padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem", minWidth: "180px" };
const emptyState = { textAlign: "center", padding: "3rem", background: "white", borderRadius: "12px", color: "#6b7280" };
