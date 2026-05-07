import { useState, useEffect } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api/client";

const DEPARTMENTS = [
  "Fresh",  // first-year students (no department yet)
  "Software Engineering", "Computer Science",
  "Information Systems", "Information Technology",
  "Civil Engineering", "Electrical Engineering",
  "Mechanical Engineering", "Chemical Engineering",
];

const SECTIONS  = ["Section A", "Section B", "Section C", "Section D", "Section E"];
const SEMESTERS = ["Semester 1", "Semester 2"];
const YEARS     = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];

function deriveUsername(fullName) {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].toLowerCase();
  return `${parts[0]}.${parts[1]}`.toLowerCase();
}

const EMPTY = {
  fullName:           "",
  initialPassword:    "",
  assignedDepartment: "",
  assignedSection:    "",
  assignedSubject:    "",
  assignedSemester:   "",
  assignedYear:       "",
};

export default function TeacherManagement({ goBack }) {
  const [teachers, setTeachers]   = useState([]);
  const [view, setView]           = useState("list");
  const [form, setForm]           = useState(EMPTY);
  const [editId, setEditId]       = useState(null);
  const [errors, setErrors]       = useState({});
  const [search, setSearch]       = useState("");
  const [filterDept, setFilterDept]     = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [selected, setSelected]   = useState(null);
  const [showPass, setShowPass]   = useState(false);

  useEffect(() => {
    apiGet("/teachers/?page_size=500")
      .then((data) => {
        if (data) {
          const list = data.results ?? data;
          setTeachers(list.map(normalize));
        }
      })
      .catch(() => {});
  }, []);

  function normalize(t) {
    return {
      ...t,
      fullName:           t.full_name            ?? t.fullName           ?? "",
      teacherId:          t.teacher_id           ?? t.teacherId          ?? "",
      username:           t.username             ?? "",
      department:         typeof t.department === "object" ? t.department?.name : t.department ?? "",
      assignedDepartment: t.assigned_department  ?? t.assignedDepartment ?? "",
      assignedSection:    t.assigned_section     ?? t.assignedSection    ?? "",
      assignedSubject:    t.assigned_subject     ?? t.assignedSubject    ?? "",
      assignedSemester:   t.assigned_semester    ?? t.assignedSemester   ?? "",
      assignedYear:       t.assigned_year        ?? t.assignedYear       ?? "",
    };
  }

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) {
      e.fullName = "Full name is required";
    } else {
      const parts = form.fullName.trim().split(/\s+/);
      if (parts.length < 3) e.fullName = "Please enter first name, father's name and grandfather's name";
    }
    if (!editId && !form.initialPassword.trim()) e.initialPassword = "Password is required";
    if (!form.assignedDepartment) e.assignedDepartment = "Department is required";
    if (!form.assignedYear)       e.assignedYear       = "Year is required";
    if (!form.assignedSection)    e.assignedSection    = "Section is required";
    if (!form.assignedSubject.trim()) e.assignedSubject = "Subject/Course is required";
    if (!form.assignedSemester)   e.assignedSemester   = "Semester is required";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const payload = {
      full_name:            form.fullName,
      assigned_department:  form.assignedDepartment,
      assigned_year:        form.assignedYear,
      assigned_section:     form.assignedSection,
      assigned_subject:     form.assignedSubject,
      assigned_semester:    form.assignedSemester,
      ...(form.initialPassword ? { initial_password: form.initialPassword } : {}),
    };

    try {
      if (editId) {
        const updated = await apiPatch(`/teachers/${editId}/`, payload);
        if (updated) {
          setTeachers((p) => p.map((t) => t.id === editId ? { ...t, ...normalize(updated) } : t));
        }
      } else {
        const created = await apiPost("/teachers/", { ...payload, initial_password: form.initialPassword });
        if (created) setTeachers((p) => [...p, normalize(created)]);
      }
    } catch (err) {
      alert(err.data ? JSON.stringify(err.data) : err.message);
      return;
    }
    setForm(EMPTY); setEditId(null); setErrors({}); setView("list");
  };

  const handleEdit = (t) => {
    setForm({
      fullName:           t.fullName,
      initialPassword:    "",
      assignedDepartment: t.assignedDepartment,
      assignedYear:       t.assignedYear,
      assignedSection:    t.assignedSection,
      assignedSubject:    t.assignedSubject,
      assignedSemester:   t.assignedSemester,
    });
    setEditId(t.id);
    setView("form");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this teacher? This will also delete their login account.")) {
      try {
        await apiDelete(`/teachers/${id}/`);
        setTeachers((p) => p.filter((t) => t.id !== id));
      } catch (err) {
        alert("Delete failed: " + (err.message || "Unknown error"));
      }
    }
  };

  const openProfile = (t) => { setSelected(t); setView("profile"); };

  const filtered = teachers.filter((t) => {
    const q = search.toLowerCase();
    return (
      (!q || t.fullName?.toLowerCase().includes(q) || t.teacherId?.toLowerCase().includes(q)) &&
      (!filterDept    || t.assignedDepartment === filterDept) &&
      (!filterSection || t.assignedSection    === filterSection)
    );
  });

  const previewUsername = deriveUsername(form.fullName);

  /* ── PROFILE VIEW ── */
  if (view === "profile" && selected) return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      <button onClick={() => setView("list")} style={backBtn}>⬅ Back to List</button>
      <div style={card}>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginBottom: "1.5rem" }}>
          <div style={avatarStyle}>{selected.fullName?.charAt(0).toUpperCase() || "T"}</div>
          <div>
            <h2 style={{ color: "#5b21b6", margin: 0 }}>{selected.fullName}</h2>
            <p style={{ color: "#6b7280", margin: "4px 0", fontFamily: "monospace", fontSize: "0.9rem" }}>{selected.teacherId}</p>
          </div>
        </div>

        {/* Teaching assignment */}
        <div style={{ background: "#ede9fe", borderRadius: "10px", padding: "14px 16px", marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.78rem", fontWeight: "700", color: "#5b21b6", margin: "0 0 10px", textTransform: "uppercase" }}>
            📚 Teaching Assignment
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {[
              ["🏛️ Department", selected.assignedDepartment || "—"],
              ["📅 Year",        selected.assignedYear       || "—"],
              ["🏫 Section",    selected.assignedSection    || "—"],
              ["📖 Subject",    selected.assignedSubject    || "—"],
              ["🗓️ Semester",   selected.assignedSemester   || "—"],
            ].map(([label, val]) => (
              <div key={label} style={{ background: "white", borderRadius: "8px", padding: "10px 12px" }}>
                <p style={{ fontSize: "0.72rem", color: "#6b7280", margin: 0 }}>{label}</p>
                <p style={{ fontWeight: "600", margin: "3px 0 0", color: "#374151" }}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {[
            ["🪪 Teacher ID", selected.teacherId],
            ["👤 Username",   selected.username || deriveUsername(selected.fullName || "")],
          ].map(([label, val]) => (
            <div key={label} style={{ background: "#faf5ff", borderRadius: "10px", padding: "0.75rem" }}>
              <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>{label}</p>
              <p style={{ fontWeight: "600", margin: "4px 0 0", color: "#374151", fontFamily: "monospace" }}>{val || "—"}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => handleEdit(selected)} style={editBtn}>✏️ Edit</button>
          <button onClick={() => { handleDelete(selected.id); setView("list"); }} style={delBtn}>🗑️ Delete</button>
        </div>
      </div>
    </div>
  );

  /* ── FORM VIEW ── */
  if (view === "form") return (
    <div style={{ maxWidth: "620px", margin: "0 auto" }}>
      <button onClick={() => { setView("list"); setEditId(null); setForm(EMPTY); setErrors({}); }} style={backBtn}>⬅ Back</button>
      <div style={card}>
        <h2 style={{ color: "#5b21b6", marginBottom: "0.5rem" }}>
          {editId ? "✏️ Edit Teacher" : "➕ Add New Teacher"}
        </h2>
        <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          Enter the teacher's name, set a password, and assign their teaching details.
        </p>

        {/* Full Name */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={lbl}>Full Name (First · Father · Grandfather) *</label>
          <input style={inp(errors.fullName)} placeholder="e.g. Abebe Kebede Alemu" value={form.fullName} onChange={set("fullName")} />
          {errors.fullName && <p style={errText}>{errors.fullName}</p>}
        </div>

        {/* Password — only on create */}
        {!editId && (
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={lbl}>Initial Password * <span style={{ color: "#6b7280", fontWeight: "400" }}>(same for all teachers)</span></label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                style={{ ...inp(errors.initialPassword), paddingRight: "42px" }}
                placeholder="e.g. Teacher@123"
                value={form.initialPassword}
                onChange={set("initialPassword")}
              />
              <button type="button" onClick={() => setShowPass((s) => !s)}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "#5b21b6" }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.initialPassword && <p style={errText}>{errors.initialPassword}</p>}
          </div>
        )}

        {/* Teaching Assignment section */}
        <div style={{ borderTop: "1px solid #e9d5ff", paddingTop: "1.25rem", marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.82rem", fontWeight: "700", color: "#5b21b6", margin: "0 0 1rem", textTransform: "uppercase" }}>
            📚 Teaching Assignment
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>

            {/* Department */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={lbl}>Department * <span style={{ color: "#6b7280", fontWeight: "400" }}>("Fresh" = Year 1)</span></label>
              <select style={inp(errors.assignedDepartment)} value={form.assignedDepartment} onChange={set("assignedDepartment")}>
                <option value="">Select department...</option>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
              {errors.assignedDepartment && <p style={errText}>{errors.assignedDepartment}</p>}
            </div>

            {/* Year */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={lbl}>Year *</label>
              <select style={inp(errors.assignedYear)} value={form.assignedYear} onChange={set("assignedYear")}>
                <option value="">Select year...</option>
                {YEARS.map((y) => <option key={y}>{y}</option>)}
              </select>
              {errors.assignedYear && <p style={errText}>{errors.assignedYear}</p>}
            </div>

            {/* Section */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={lbl}>Section *</label>
              <select style={inp(errors.assignedSection)} value={form.assignedSection} onChange={set("assignedSection")}>
                <option value="">Select section...</option>
                {SECTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
              {errors.assignedSection && <p style={errText}>{errors.assignedSection}</p>}
            </div>

            {/* Subject */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={lbl}>Subject / Course *</label>
              <input
                style={inp(errors.assignedSubject)}
                placeholder="e.g. Data Structures"
                value={form.assignedSubject}
                onChange={set("assignedSubject")}
              />
              {errors.assignedSubject && <p style={errText}>{errors.assignedSubject}</p>}
            </div>

            {/* Semester */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={lbl}>Semester *</label>
              <select style={inp(errors.assignedSemester)} value={form.assignedSemester} onChange={set("assignedSemester")}>
                <option value="">Select semester...</option>
                {SEMESTERS.map((s) => <option key={s}>{s}</option>)}
              </select>
              {errors.assignedSemester && <p style={errText}>{errors.assignedSemester}</p>}
            </div>
          </div>
        </div>

        {/* Credentials preview */}
        {form.fullName.trim() && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "10px", padding: "14px 16px", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: "0.78rem", fontWeight: "700", color: "#15803d", margin: "0 0 8px", textTransform: "uppercase" }}>
              ✅ Auto-generated Login Credentials
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <p style={{ fontSize: "0.72rem", color: "#6b7280", margin: 0 }}>Username</p>
                <p style={{ fontWeight: "700", color: "#374151", margin: "2px 0 0", fontFamily: "monospace" }}>{previewUsername || "—"}</p>
              </div>
              <div>
                <p style={{ fontSize: "0.72rem", color: "#6b7280", margin: 0 }}>Teacher ID</p>
                <p style={{ fontWeight: "700", color: "#374151", margin: "2px 0 0", fontFamily: "monospace" }}>Auto-generated (TCH-XXXX)</p>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={handleSave} style={saveBtn}>💾 {editId ? "Update Teacher" : "Save Teacher"}</button>
          <button onClick={() => { setView("list"); setEditId(null); setForm(EMPTY); setErrors({}); }} style={cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );

  /* ── LIST VIEW ── */
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ color: "#5b21b6", margin: 0 }}>👨‍🏫 Teacher Management</h2>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "0.85rem" }}>
            {teachers.length} teacher{teachers.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setErrors({}); setView("form"); }} style={saveBtn}>➕ Add Teacher</button>
          <button onClick={goBack} style={backBtn}>⬅ Back</button>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
        />
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} style={filterSel}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} style={filterSel}>
          <option value="">All Sections</option>
          {SECTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "12px", color: "#6b7280" }}>
          <p style={{ fontSize: "2rem" }}>👨‍🏫</p>
          <p>{teachers.length === 0 ? 'No teachers yet. Click "Add Teacher" to get started.' : "No teachers match your search."}</p>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 6px #e9d5ff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#8b5cf6", color: "white" }}>
                {["Teacher Name", "ID", "Department", "Year", "Section", "Subject", "Semester", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: "600", fontSize: "0.82rem" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.id} style={{ background: i % 2 === 0 ? "white" : "#faf5ff", borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ ...avatarStyle, width: "34px", height: "34px", fontSize: "0.85rem" }}>
                        {t.fullName?.charAt(0).toUpperCase() || "T"}
                      </div>
                      <span style={{ fontWeight: "500" }}>{t.fullName}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: "0.82rem", fontFamily: "monospace" }}>{t.teacherId || "—"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    {t.assignedDepartment
                      ? <span style={{ background: t.assignedDepartment === "Fresh" ? "#fef9c3" : "#ede9fe", color: t.assignedDepartment === "Fresh" ? "#a16207" : "#5b21b6", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "500" }}>
                          {t.assignedDepartment}
                        </span>
                      : <span style={{ color: "#9ca3af" }}>—</span>
                    }
                  </td>
                  <td style={{ padding: "12px 14px", color: "#374151", fontSize: "0.85rem" }}>{t.assignedYear || "—"}</td>
                  <td style={{ padding: "12px 14px", color: "#374151", fontSize: "0.85rem" }}>{t.assignedSection || "—"}</td>
                  <td style={{ padding: "12px 14px", color: "#374151", fontSize: "0.85rem" }}>{t.assignedSubject || "—"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    {t.assignedSemester
                      ? <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "500" }}>{t.assignedSemester}</span>
                      : <span style={{ color: "#9ca3af" }}>—</span>
                    }
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => openProfile(t)} style={{ padding: "6px 10px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>👁</button>
                      <button onClick={() => handleEdit(t)} style={editBtn}>✏️</button>
                      <button onClick={() => handleDelete(t.id)} style={delBtn}>🗑️</button>
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

const avatarStyle = {
  width: "52px", height: "52px", borderRadius: "50%",
  background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
  color: "white", display: "flex", alignItems: "center",
  justifyContent: "center", fontWeight: "bold", fontSize: "1.2rem", flexShrink: 0,
};
const card = { background: "white", borderRadius: "16px", padding: "2rem", boxShadow: "0 2px 12px #e9d5ff" };
const lbl = { display: "block", fontSize: "0.8rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" };
const inp = (err) => ({ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${err ? "#ef4444" : "#d1d5db"}`, fontSize: "0.9rem", outline: "none", boxSizing: "border-box" });
const saveBtn = { padding: "9px 18px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" };
const cancelBtn = { padding: "9px 18px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer" };
const backBtn = { padding: "8px 16px", background: "#ede9fe", color: "#5b21b6", border: "none", borderRadius: "8px", cursor: "pointer", marginBottom: "1rem", display: "inline-block" };
const editBtn = { padding: "6px 10px", background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const delBtn = { padding: "6px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const filterSel = { padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem", minWidth: "150px" };
const errText = { color: "#ef4444", fontSize: "0.75rem", marginTop: "2px" };
