import { useState, useEffect } from "react";

const DEPARTMENTS = [
  "Software Engineering", "Computer Science",
  "Information Systems", "Information Technology",
  "Civil Engineering", "Electrical Engineering",
  "Mechanical Engineering", "Chemical Engineering",
];
const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];
const SEMESTERS = ["Semester 1", "Semester 2"];
const TYPES = ["Core", "Elective", "Lab", "Project"];

const EMPTY = { code: "", name: "", department: "", year: "", semester: "", type: "", credits: "", description: "" };

export default function SubjectsManagement({ goBack }) {
  const [subjects, setSubjects] = useState([]);
  const [view, setView] = useState("list");
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    const s = localStorage.getItem("subjects");
    if (s) setSubjects(JSON.parse(s));
  }, []);
  useEffect(() => { localStorage.setItem("subjects", JSON.stringify(subjects)); }, [subjects]);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: undefined })); };

  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = "Subject code is required";
    if (!form.name.trim()) e.name = "Subject name is required";
    if (!form.department) e.department = "Department is required";
    if (!form.year) e.year = "Year is required";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editId) {
      setSubjects((p) => p.map((s) => s.id === editId ? { ...s, ...form } : s));
    } else {
      setSubjects((p) => [...p, { id: Date.now(), ...form }]);
    }
    setForm(EMPTY); setEditId(null); setErrors({}); setView("list");
  };

  const handleEdit = (s) => { setForm({ ...s }); setEditId(s.id); setView("form"); };
  const handleDelete = (id) => { if (window.confirm("Delete this subject?")) setSubjects((p) => p.filter((s) => s.id !== id)); };

  const filtered = subjects.filter((s) => {
    const q = search.toLowerCase();
    return (!q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) &&
      (!filterDept || s.department === filterDept) &&
      (!filterType || s.type === filterType);
  });

  const typeColor = { Core: "#dbeafe", Elective: "#dcfce7", Lab: "#fef9c3", Project: "#fce7f3" };
  const typeText = { Core: "#1d4ed8", Elective: "#15803d", Lab: "#a16207", Project: "#9d174d" };

  if (view === "form") return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <button onClick={() => { setView("list"); setEditId(null); setForm(EMPTY); setErrors({}); }} style={backBtn}>⬅ Back</button>
      <div style={card}>
        <h2 style={heading}>{editId ? "✏️ Edit Subject" : "➕ Add New Subject"}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
          <F label="Subject Code *" err={errors.code}><input style={inp(errors.code)} placeholder="e.g. CS301" value={form.code} onChange={set("code")} /></F>
          <F label="Subject Name *" err={errors.name}><input style={inp(errors.name)} placeholder="e.g. Data Structures" value={form.name} onChange={set("name")} /></F>
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
          <F label="Type">
            <select style={inp(false)} value={form.type} onChange={set("type")}>
              <option value="">Select...</option>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </F>
          <F label="Credit Hours"><input style={inp(false)} placeholder="e.g. 3" value={form.credits} onChange={set("credits")} /></F>
          <div style={{ gridColumn: "1/-1" }}>
            <F label="Description">
              <textarea style={{ ...inp(false), resize: "vertical", minHeight: "70px" }}
                placeholder="Brief description of the subject..." value={form.description} onChange={set("description")} />
            </F>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button onClick={handleSave} style={saveBtn}>💾 {editId ? "Update" : "Save Subject"}</button>
          <button onClick={() => { setView("list"); setEditId(null); setForm(EMPTY); setErrors({}); }} style={cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={headerRow}>
        <div>
          <h2 style={heading}>📚 Subjects / Course Catalog</h2>
          <p style={sub}>{subjects.length} subject{subjects.length !== 1 ? "s" : ""} in catalog</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setErrors({}); setView("form"); }} style={saveBtn}>➕ Add Subject</button>
          <button onClick={goBack} style={backBtn}>⬅ Back</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input placeholder="🔍 Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} style={searchInput} />
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} style={filterSelect}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={filterSelect}>
          <option value="">All Types</option>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      {filtered.length === 0 ? (
        <div style={emptyState}>
          <p style={{ fontSize: "2rem" }}>📚</p>
          <p>{subjects.length === 0 ? 'No subjects yet. Click "Add Subject" to get started.' : "No subjects match your search."}</p>
        </div>
      ) : (
        <div style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#8b5cf6", color: "white" }}>
                {["Code", "Subject Name", "Department", "Year", "Semester", "Type", "Credits", "Actions"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 === 0 ? "white" : "#faf5ff", borderBottom: "1px solid #f3f4f6" }}>
                  <td style={td}><span style={{ fontWeight: "700", color: "#5b21b6", fontFamily: "monospace" }}>{s.code}</span></td>
                  <td style={td}><span style={{ fontWeight: "500" }}>{s.name}</span></td>
                  <td style={td}><span style={badge}>{s.department}</span></td>
                  <td style={td}>{s.year}</td>
                  <td style={td}>{s.semester || "—"}</td>
                  <td style={td}>
                    {s.type && (
                      <span style={{ background: typeColor[s.type] || "#f3f4f6", color: typeText[s.type] || "#374151", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "500" }}>
                        {s.type}
                      </span>
                    )}
                  </td>
                  <td style={td}>{s.credits ? `${s.credits} hrs` : "—"}</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => handleEdit(s)} style={editBtn}>✏️</button>
                      <button onClick={() => handleDelete(s.id)} style={delBtn}>🗑️</button>
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
const filterSelect = { padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem", minWidth: "160px" };
const emptyState = { textAlign: "center", padding: "3rem", background: "white", borderRadius: "12px", color: "#6b7280" };
