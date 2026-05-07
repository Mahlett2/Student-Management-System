import { useState, useEffect } from "react";

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

const EMPTY_FORM = {
  fullName: "", teacherId: "", email: "", phone: "",
  department: "", subject: "", gender: "", dob: "", address: "", photo: null,
};

export default function TeacherManagement({ goBack }) {
  const [teachers, setTeachers] = useState([]);
  const [view, setView] = useState("list"); // list | form | profile
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("teachers");
    if (saved) setTeachers(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("teachers", JSON.stringify(teachers));
  }, [teachers]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.teacherId.trim()) e.teacherId = "Teacher ID is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.department) e.department = "Department is required";
    if (!form.subject.trim()) e.subject = "Subject is required";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    if (editId) {
      setTeachers((prev) =>
        prev.map((t) => t.id === editId ? { ...t, ...form } : t)
      );
    } else {
      setTeachers((prev) => [...prev, { id: Date.now(), ...form }]);
    }
    setForm(EMPTY_FORM);
    setEditId(null);
    setErrors({});
    setView("list");
  };

  const handleEdit = (t) => {
    setForm({ ...t });
    setEditId(t.id);
    setView("form");
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this teacher?"))
      setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  const openProfile = (t) => { setSelected(t); setView("profile"); };

  const filtered = teachers.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.fullName.toLowerCase().includes(q) ||
      t.teacherId.toLowerCase().includes(q) || t.email.toLowerCase().includes(q);
    const matchDept = !filterDept || t.department === filterDept;
    return matchSearch && matchDept;
  });

  const Field = ({ label, error, children }) => (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "0.8rem", color: "#6b7280", marginBottom: "4px" }}>
        {label}
      </label>
      {children}
      {error && <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "2px" }}>{error}</p>}
    </div>
  );

  const inputStyle = (hasErr) => ({
    width: "100%", padding: "9px 12px", borderRadius: "8px",
    border: `1px solid ${hasErr ? "#ef4444" : "#d1d5db"}`,
    fontSize: "0.9rem", outline: "none",
  });

  /* ── PROFILE VIEW ── */
  if (view === "profile" && selected) return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <button onClick={() => setView("list")} style={backBtnStyle}>⬅ Back to List</button>
      <div style={{ background: "white", borderRadius: "16px", padding: "2rem", boxShadow: "0 2px 12px #e9d5ff" }}>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginBottom: "1.5rem" }}>
          <div style={avatarStyle}>{selected.fullName.charAt(0).toUpperCase()}</div>
          <div>
            <h2 style={{ color: "#5b21b6", margin: 0 }}>{selected.fullName}</h2>
            <p style={{ color: "#6b7280", margin: "4px 0" }}>{selected.department}</p>
            <span style={badgeStyle}>{selected.subject}</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {[
            ["🪪 Teacher ID", selected.teacherId],
            ["📧 Email", selected.email],
            ["📞 Phone", selected.phone || "—"],
            ["⚧ Gender", selected.gender || "—"],
            ["🎂 Date of Birth", selected.dob || "—"],
            ["📍 Address", selected.address || "—"],
          ].map(([label, val]) => (
            <div key={label} style={{ background: "#faf5ff", borderRadius: "10px", padding: "0.75rem" }}>
              <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>{label}</p>
              <p style={{ fontWeight: "600", margin: "4px 0 0", color: "#374151" }}>{val}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
          <button onClick={() => handleEdit(selected)} style={editBtnStyle}>✏️ Edit</button>
          <button onClick={() => { handleDelete(selected.id); setView("list"); }} style={deleteBtnStyle}>🗑️ Delete</button>
        </div>
      </div>
    </div>
  );

  /* ── FORM VIEW ── */
  if (view === "form") return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <button onClick={() => { setView("list"); setEditId(null); setForm(EMPTY_FORM); setErrors({}); }} style={backBtnStyle}>
        ⬅ Back
      </button>
      <div style={{ background: "white", borderRadius: "16px", padding: "2rem", boxShadow: "0 2px 12px #e9d5ff" }}>
        <h2 style={{ color: "#5b21b6", marginBottom: "1.5rem" }}>
          {editId ? "✏️ Edit Teacher" : "➕ Add New Teacher"}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
          <Field label="Full Name *" error={errors.fullName}>
            <input style={inputStyle(errors.fullName)} placeholder="e.g. Dr. Abebe Kebede"
              value={form.fullName} onChange={set("fullName")} />
          </Field>
          <Field label="Teacher ID *" error={errors.teacherId}>
            <input style={inputStyle(errors.teacherId)} placeholder="e.g. TCH-001"
              value={form.teacherId} onChange={set("teacherId")} />
          </Field>
          <Field label="Email *" error={errors.email}>
            <input style={inputStyle(errors.email)} placeholder="teacher@university.edu"
              value={form.email} onChange={set("email")} />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <input style={inputStyle(false)} placeholder="+251 9xx xxx xxx"
              value={form.phone} onChange={set("phone")} />
          </Field>
          <Field label="Department *" error={errors.department}>
            <select style={inputStyle(errors.department)} value={form.department} onChange={set("department")}>
              <option value="">Select department...</option>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Subject *" error={errors.subject}>
            <input style={inputStyle(errors.subject)} placeholder="e.g. Data Structures"
              value={form.subject} onChange={set("subject")} />
          </Field>
          <Field label="Gender">
            <select style={inputStyle(false)} value={form.gender} onChange={set("gender")}>
              <option value="">Select...</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </Field>
          <Field label="Date of Birth">
            <input type="date" style={inputStyle(false)} value={form.dob} onChange={set("dob")} />
          </Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Address">
              <input style={inputStyle(false)} placeholder="City, Country"
                value={form.address} onChange={set("address")} />
            </Field>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button onClick={handleSave} style={saveBtnStyle}>💾 {editId ? "Update Teacher" : "Save Teacher"}</button>
          <button onClick={() => { setView("list"); setEditId(null); setForm(EMPTY_FORM); setErrors({}); }}
            style={{ ...saveBtnStyle, background: "#e5e7eb", color: "#374151" }}>Cancel</button>
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
          <h2 style={{ color: "#5b21b6", margin: 0 }}>👨‍🏫 Teacher Management</h2>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "0.85rem" }}>
            {teachers.length} teacher{teachers.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => { setForm(EMPTY_FORM); setEditId(null); setErrors({}); setView("form"); }} style={saveBtnStyle}>
            ➕ Add Teacher
          </button>
          <button onClick={goBack} style={backBtnStyle}>⬅ Back</button>
        </div>
      </div>

      {/* Search & Filter */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Search by name, ID or email..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
        />
        <select
          value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem", minWidth: "180px" }}
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "12px", color: "#6b7280" }}>
          <p style={{ fontSize: "2rem" }}>👨‍🏫</p>
          <p>{teachers.length === 0 ? "No teachers added yet. Click \"Add Teacher\" to get started." : "No teachers match your search."}</p>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 6px #e9d5ff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#8b5cf6", color: "white" }}>
                {["Teacher", "ID", "Department", "Subject", "Email", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", fontSize: "0.85rem" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.id} style={{ background: i % 2 === 0 ? "white" : "#faf5ff", borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ ...avatarStyle, width: "36px", height: "36px", fontSize: "0.9rem" }}>
                        {t.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: "500" }}>{t.fullName}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "0.85rem" }}>{t.teacherId}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ ...badgeStyle, fontSize: "0.75rem" }}>{t.department}</span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#374151" }}>{t.subject}</td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "0.85rem" }}>{t.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => openProfile(t)} style={viewBtnStyle}>👁 View</button>
                      <button onClick={() => handleEdit(t)} style={editBtnStyle}>✏️</button>
                      <button onClick={() => handleDelete(t.id)} style={deleteBtnStyle}>🗑️</button>
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

/* ── Shared styles ── */
const avatarStyle = {
  width: "52px", height: "52px", borderRadius: "50%",
  background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
  color: "white", display: "flex", alignItems: "center",
  justifyContent: "center", fontWeight: "bold", fontSize: "1.2rem", flexShrink: 0,
};
const badgeStyle = {
  background: "#ede9fe", color: "#5b21b6", padding: "3px 10px",
  borderRadius: "20px", fontSize: "0.8rem", fontWeight: "500",
};
const saveBtnStyle = {
  padding: "9px 18px", background: "#8b5cf6", color: "white",
  border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500",
};
const backBtnStyle = {
  padding: "8px 16px", background: "#ede9fe", color: "#5b21b6",
  border: "none", borderRadius: "8px", cursor: "pointer", marginBottom: "1rem", display: "inline-block",
};
const editBtnStyle = {
  padding: "6px 10px", background: "#dbeafe", color: "#1d4ed8",
  border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem",
};
const deleteBtnStyle = {
  padding: "6px 10px", background: "#fee2e2", color: "#dc2626",
  border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem",
};
const viewBtnStyle = {
  padding: "6px 10px", background: "#f3f4f6", color: "#374151",
  border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem",
};
