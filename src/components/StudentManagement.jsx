import { useState, useEffect } from "react";
import { validateStudentId, formatStudentIdInput } from "../utils/validators";
import { useStudents } from "../data/studentsStore";

const DEPARTMENTS = [
  "Software Engineering",
  "Computer Science",
  "Information Systems",
  "Information Technology",
  "Civil Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Chemical Engineering",
];

const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];
const STATUSES = ["Active", "Inactive", "Graduated", "Suspended"];

const EMPTY = {
  fullName: "", studentId: "", email: "", phone: "",
  department: "", year: "", status: "Active",
  gender: "", dob: "", address: "", enrollmentDate: "",
  cafeteria: "",
};

export default function StudentManagement({ goBack }) {
  const { students, setStudents } = useStudents();
  const [view, setView] = useState("list"); // list | form | profile
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterStatus, setFilterStatus] = useState("");



  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.studentId.trim()) e.studentId = "Student ID is required";
    else { const idErr = validateStudentId(form.studentId); if (idErr) e.studentId = idErr; }
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.department) e.department = "Department is required";
    if (!form.year) e.year = "Year is required";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editId) {
      setStudents((p) => p.map((s) => s.id === editId ? { ...s, ...form } : s));
    } else {
      setStudents((p) => [...p, { id: Date.now(), ...form }]);
    }
    setForm(EMPTY); setEditId(null); setErrors({}); setView("list");
  };

  const handleEdit = (s) => { setForm({ ...s }); setEditId(s.id); setView("form"); };
  const handleDelete = (id) => {
    if (window.confirm("Delete this student?"))
      setStudents((p) => p.filter((s) => s.id !== id));
  };
  const openProfile = (s) => { setSelected(s); setView("profile"); };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (!q || s.fullName.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)) &&
      (!filterDept || s.department === filterDept) &&
      (!filterYear || s.year === filterYear) &&
      (!filterStatus || s.status === filterStatus)
    );
  });

  const statusColor = {
    Active: { bg: "#dcfce7", text: "#15803d" },
    Inactive: { bg: "#f3f4f6", text: "#6b7280" },
    Graduated: { bg: "#dbeafe", text: "#1d4ed8" },
    Suspended: { bg: "#fee2e2", text: "#dc2626" },
  };

  /* ── PROFILE VIEW ── */
  if (view === "profile" && selected) return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <button onClick={() => setView("list")} style={backBtn}>⬅ Back to List</button>
      <div style={card}>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginBottom: "1.5rem" }}>
          <div style={avatarStyle}>{selected.fullName.charAt(0).toUpperCase()}</div>
          <div>
            <h2 style={{ color: "#5b21b6", margin: 0 }}>{selected.fullName}</h2>
            <p style={{ color: "#6b7280", margin: "4px 0" }}>{selected.department} — {selected.year}</p>
            <span style={{
              background: statusColor[selected.status]?.bg || "#f3f4f6",
              color: statusColor[selected.status]?.text || "#374151",
              padding: "3px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "600"
            }}>{selected.status}</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[
            ["🪪 Student ID", selected.studentId],
            ["📧 Email", selected.email],
            ["📞 Phone", selected.phone || "—"],
            ["⚧ Gender", selected.gender || "—"],
            ["🎂 Date of Birth", selected.dob || "—"],
            ["📅 Enrolled", selected.enrollmentDate || "—"],
            ["📍 Address", selected.address || "—"],
            ["🍽️ Cafeteria", selected.cafeteria || "—"],
          ].map(([label, val]) => (
            <div key={label} style={{ background: "#faf5ff", borderRadius: "10px", padding: "0.75rem" }}>
              <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>{label}</p>
              <p style={{ fontWeight: "600", margin: "4px 0 0", color: "#374151", wordBreak: "break-word" }}>{val}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
          <button onClick={() => { handleEdit(selected); }} style={editBtn}>✏️ Edit</button>
          <button onClick={() => { handleDelete(selected.id); setView("list"); }} style={delBtn}>🗑️ Delete</button>
        </div>
      </div>
    </div>
  );

  /* ── FORM VIEW ── */
  if (view === "form") return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <button onClick={() => { setView("list"); setEditId(null); setForm(EMPTY); setErrors({}); }} style={backBtn}>⬅ Back</button>
      <div style={card}>
        <h2 style={{ color: "#5b21b6", marginBottom: "1.5rem" }}>
          {editId ? "✏️ Edit Student" : "➕ Add New Student"}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
          <F label="Full Name *" err={errors.fullName}>
            <input style={inp(errors.fullName)} placeholder="e.g. Abebe Kebede" value={form.fullName} onChange={set("fullName")} />
          </F>
          <F label="Student ID *" err={errors.studentId}>
            <input
              placeholder="WOUR/XXXX/YY"
              value={form.studentId}
              onChange={(e) => { set("studentId")({ target: { value: formatStudentIdInput(e.target.value) } }); }}
              maxLength={12}
              style={{ ...inp(errors.studentId), fontFamily: "monospace", letterSpacing: "1px" }} />
          </F>
          <F label="Email *" err={errors.email}>
            <input style={inp(errors.email)} placeholder="student@university.edu" value={form.email} onChange={set("email")} />
          </F>
          <F label="Phone">
            <input style={inp(false)} placeholder="+251 9xx xxx xxx" value={form.phone} onChange={set("phone")} />
          </F>
          <F label="Department *" err={errors.department}>
            <select style={inp(errors.department)} value={form.department} onChange={set("department")}>
              <option value="">Select department...</option>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </F>
          <F label="Year *" err={errors.year}>
            <select style={inp(errors.year)} value={form.year} onChange={set("year")}>
              <option value="">Select year...</option>
              {YEARS.map((y) => <option key={y}>{y}</option>)}
            </select>
          </F>
          <F label="Enrollment Status">
            <select style={inp(false)} value={form.status} onChange={set("status")}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </F>
          <F label="Gender">
            <select style={inp(false)} value={form.gender} onChange={set("gender")}>
              <option value="">Select...</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </F>
          <F label="Date of Birth">
            <input type="date" style={inp(false)} value={form.dob} onChange={set("dob")} />
          </F>
          <F label="Enrollment Date">
            <input type="date" style={inp(false)} value={form.enrollmentDate} onChange={set("enrollmentDate")} />
          </F>
          <F label="Cafeteria Status">
            <select style={inp(false)} value={form.cafeteria} onChange={set("cafeteria")}>
              <option value="">Select...</option>
              <option value="Cafe">Cafe (University Cafeteria)</option>
              <option value="Non-Cafe">Non-Cafe (Self-catering)</option>
            </select>
          </F>
          <div style={{ gridColumn: "1/-1" }}>
            <F label="Address">
              <input style={inp(false)} placeholder="City, Country" value={form.address} onChange={set("address")} />
            </F>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button onClick={handleSave} style={saveBtn}>💾 {editId ? "Update Student" : "Save Student"}</button>
          <button onClick={() => { setView("list"); setEditId(null); setForm(EMPTY); setErrors({}); }} style={cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );

  /* ── LIST VIEW ── */
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ color: "#5b21b6", margin: 0 }}>🎓 Student Management</h2>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "0.85rem" }}>
            {students.length} student{students.length !== 1 ? "s" : ""} registered
            {filtered.length !== students.length && ` · ${filtered.length} shown`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setErrors({}); setView("form"); }} style={saveBtn}>➕ Add Student</button>
          <button onClick={goBack} style={backBtn}>⬅ Back</button>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Search by name, ID or email..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
        />
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} style={filterSel}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={filterSel}>
          <option value="">All Years</option>
          {YEARS.map((y) => <option key={y}>{y}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={filterSel}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "12px", color: "#6b7280" }}>
          <p style={{ fontSize: "2rem" }}>🎓</p>
          <p>{students.length === 0 ? 'No students yet. Click "Add Student" to get started.' : "No students match your filters."}</p>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 6px #e9d5ff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#8b5cf6", color: "white" }}>
                {["Student", "ID", "Department", "Year", "Status", "Email", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", fontSize: "0.85rem" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 === 0 ? "white" : "#faf5ff", borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ ...avatarStyle, width: "36px", height: "36px", fontSize: "0.9rem" }}>
                        {s.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: "500" }}>{s.fullName}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "0.85rem", fontFamily: "monospace" }}>{s.studentId}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: "#ede9fe", color: "#5b21b6", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "500" }}>
                      {s.department}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#374151" }}>{s.year}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      background: statusColor[s.status]?.bg || "#f3f4f6",
                      color: statusColor[s.status]?.text || "#374151",
                      padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600"
                    }}>{s.status}</span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "0.85rem" }}>{s.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => openProfile(s)} style={{ padding: "6px 10px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>👁 View</button>
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

const avatarStyle = {
  width: "52px", height: "52px", borderRadius: "50%",
  background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
  color: "white", display: "flex", alignItems: "center",
  justifyContent: "center", fontWeight: "bold", fontSize: "1.2rem", flexShrink: 0,
};
const card = { background: "white", borderRadius: "16px", padding: "2rem", boxShadow: "0 2px 12px #e9d5ff" };
const inp = (err) => ({ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${err ? "#ef4444" : "#d1d5db"}`, fontSize: "0.9rem", outline: "none" });
const saveBtn = { padding: "9px 18px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" };
const cancelBtn = { padding: "9px 18px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer" };
const backBtn = { padding: "8px 16px", background: "#ede9fe", color: "#5b21b6", border: "none", borderRadius: "8px", cursor: "pointer", marginBottom: "1rem", display: "inline-block" };
const editBtn = { padding: "6px 10px", background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const delBtn = { padding: "6px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const filterSel = { padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem", minWidth: "150px" };
