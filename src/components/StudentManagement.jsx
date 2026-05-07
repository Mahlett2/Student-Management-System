import { useState } from "react";
import { validateStudentId, formatStudentIdInput } from "../utils/validators";
import { useStudents } from "../data/studentsStore";
import { apiPost, apiPatch, apiDelete } from "../api/client";

const DEPARTMENTS = [
  "Software Engineering", "Computer Science",
  "Information Systems", "Information Technology",
  "Civil Engineering", "Electrical Engineering",
  "Mechanical Engineering", "Chemical Engineering",
];

const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];
const SECTIONS = ["Section A", "Section B", "Section C", "Section D", "Section E"];

/**
 * Derive username from full name: "Abebe Kebede Alemu" → "abebe.kebede"
 */
function deriveUsername(fullName) {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].toLowerCase();
  return `${parts[0]}.${parts[1]}`.toLowerCase();
}

const EMPTY = { fullName: "", studentId: "", year: "Year 1", section: "", department: "" };

export default function StudentManagement({ goBack }) {
  const { students, setStudents } = useStudents();
  const [view, setView] = useState("list"); // list | form | profile
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterSection, setFilterSection] = useState("");

  const isFirstYear = form.year === "Year 1";
  const previewUsername = deriveUsername(form.fullName);

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm((f) => {
      const updated = { ...f, [k]: val };
      // Clear department when switching to Year 1
      if (k === "year" && val === "Year 1") updated.department = "";
      return updated;
    });
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
    if (!form.studentId.trim()) e.studentId = "Student ID is required";
    else { const idErr = validateStudentId(form.studentId); if (idErr) e.studentId = idErr; }
    if (!form.year) e.year = "Year is required";
    if (!form.section) e.section = "Section is required";
    if (!isFirstYear && !form.department) e.department = "Department is required for Year 2 and above";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const payload = {
      full_name:  form.fullName,
      student_id: form.studentId,
      year:       form.year,
      section:    form.section,
      department: isFirstYear ? null : (form.department || null),
    };

    try {
      if (editId) {
        const updated = await apiPatch(`/students/${editId}/`, payload);
        if (updated) {
          setStudents((p) => p.map((s) => s.id === editId
            ? {
                ...s,
                fullName:   form.fullName,
                studentId:  form.studentId,
                year:       form.year,
                section:    form.section,
                department: isFirstYear ? "" : form.department,
              }
            : s
          ));
        }
      } else {
        const created = await apiPost("/students/", payload);
        if (created) {
          setStudents((p) => [...p, {
            id:         created.id,
            fullName:   created.full_name  ?? form.fullName,
            studentId:  created.student_id ?? form.studentId,
            year:       created.year       ?? form.year,
            section:    created.section    ?? form.section,
            department: typeof created.department === "object"
              ? created.department?.name
              : created.department ?? (isFirstYear ? "" : form.department),
            username:   created.username   ?? previewUsername,
          }]);
        }
      }
    } catch (err) {
      alert(err.data ? JSON.stringify(err.data) : err.message);
      return;
    }
    setForm(EMPTY); setEditId(null); setErrors({}); setView("list");
  };

  const handleEdit = (s) => {
    setForm({
      fullName:   s.fullName,
      studentId:  s.studentId,
      year:       s.year || "Year 1",
      section:    s.section || "",
      department: s.department || "",
    });
    setEditId(s.id);
    setView("form");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this student? This will also delete their login account.")) {
      try {
        await apiDelete(`/students/${id}/`);
        setStudents((p) => p.filter((s) => s.id !== id));
      } catch (err) {
        alert("Delete failed: " + (err.message || "Unknown error"));
      }
    }
  };

  const openProfile = (s) => { setSelected(s); setView("profile"); };

  // Filtered list
  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (!q || s.fullName?.toLowerCase().includes(q) || s.studentId?.toLowerCase().includes(q)) &&
      (!filterYear || s.year === filterYear) &&
      (!filterDept || s.department === filterDept) &&
      (!filterSection || s.section === filterSection)
    );
  });

  /* ── PROFILE VIEW ── */
  if (view === "profile" && selected) return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      <button onClick={() => setView("list")} style={backBtn}>⬅ Back to List</button>
      <div style={card}>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginBottom: "1.5rem" }}>
          <div style={avatarStyle}>{selected.fullName?.charAt(0).toUpperCase()}</div>
          <div>
            <h2 style={{ color: "#5b21b6", margin: 0 }}>{selected.fullName}</h2>
            <p style={{ color: "#6b7280", margin: "4px 0", fontFamily: "monospace", fontSize: "0.9rem" }}>{selected.studentId}</p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
              <span style={badge}>{selected.year}</span>
              {selected.section && <span style={badge}>{selected.section}</span>}
              {selected.department && <span style={{ ...badge, background: "#ede9fe", color: "#5b21b6" }}>{selected.department}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {[
            ["🪪 Student ID", selected.studentId],
            ["👤 Username", selected.username || deriveUsername(selected.fullName || "")],
            ["🔑 Default Password", selected.studentId, true],
            ["📅 Year", selected.year],
            ["🏫 Section", selected.section || "—"],
            ["🏛️ Department", selected.department || "Not assigned (Year 1)"],
          ].map(([label, val, mono]) => (
            <div key={label} style={{ background: "#faf5ff", borderRadius: "10px", padding: "0.75rem" }}>
              <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>{label}</p>
              <p style={{ fontWeight: "600", margin: "4px 0 0", color: "#374151", fontFamily: mono ? "monospace" : "inherit", wordBreak: "break-word" }}>{val || "—"}</p>
            </div>
          ))}
        </div>
        <div style={{ background: "#fef9c3", borderRadius: "8px", padding: "10px 14px", marginBottom: "1.25rem", fontSize: "0.82rem", color: "#92400e" }}>
          ℹ️ The student logs in with their <strong>username</strong> and uses their <strong>Student ID as the default password</strong>.
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
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <button onClick={() => { setView("list"); setEditId(null); setForm(EMPTY); setErrors({}); }} style={backBtn}>⬅ Back</button>
      <div style={card}>
        <h2 style={{ color: "#5b21b6", marginBottom: "0.5rem" }}>
          {editId ? "✏️ Edit Student" : "➕ Add New Student"}
        </h2>
        <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          {isFirstYear
            ? "Year 1 students don't have a department yet — they choose it in Year 2."
            : "Year 2+ students must have a department assigned."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
          {/* Full Name — full width */}
          <div style={{ gridColumn: "1/-1", marginBottom: "1.25rem" }}>
            <label style={lbl}>Full Name (First · Father · Grandfather) *</label>
            <input
              style={inp(errors.fullName)}
              placeholder="e.g. Abebe Kebede Alemu"
              value={form.fullName}
              onChange={set("fullName")}
            />
            {errors.fullName && <p style={errText}>{errors.fullName}</p>}
          </div>

          {/* Student ID */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={lbl}>Student ID *</label>
            <input
              placeholder="WOUR/XXXX/YY"
              value={form.studentId}
              onChange={(e) => {
                set("studentId")({ target: { value: formatStudentIdInput(e.target.value) } });
              }}
              maxLength={12}
              style={{ ...inp(errors.studentId), fontFamily: "monospace", letterSpacing: "1px" }}
            />
            {errors.studentId && <p style={errText}>{errors.studentId}</p>}
          </div>

          {/* Year */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={lbl}>Year *</label>
            <select style={inp(errors.year)} value={form.year} onChange={set("year")}>
              <option value="">Select year...</option>
              {YEARS.map((y) => <option key={y}>{y}</option>)}
            </select>
            {errors.year && <p style={errText}>{errors.year}</p>}
          </div>

          {/* Section */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={lbl}>Section *</label>
            <select style={inp(errors.section)} value={form.section} onChange={set("section")}>
              <option value="">Select section...</option>
              {SECTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
            {errors.section && <p style={errText}>{errors.section}</p>}
          </div>

          {/* Department — only for Year 2+ */}
          {!isFirstYear && (
            <div style={{ gridColumn: "1/-1", marginBottom: "1.25rem" }}>
              <label style={lbl}>Department * <span style={{ color: "#6b7280", fontWeight: "400" }}>(required for Year 2+)</span></label>
              <select style={inp(errors.department)} value={form.department} onChange={set("department")}>
                <option value="">Select department...</option>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
              {errors.department && <p style={errText}>{errors.department}</p>}
            </div>
          )}

          {isFirstYear && (
            <div style={{ gridColumn: "1/-1", marginBottom: "1.25rem" }}>
              <div style={{ background: "#dbeafe", borderRadius: "8px", padding: "10px 14px", fontSize: "0.82rem", color: "#1d4ed8" }}>
                ℹ️ <strong>Year 1 students</strong> don't have a department yet. Department will be assigned when they move to Year 2.
              </div>
            </div>
          )}
        </div>

        {/* Auto-generated credentials preview */}
        {form.fullName.trim() && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "10px", padding: "14px 16px", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: "0.78rem", fontWeight: "700", color: "#15803d", margin: "0 0 8px", textTransform: "uppercase" }}>
              ✅ Auto-generated Login Credentials
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <p style={{ fontSize: "0.72rem", color: "#6b7280", margin: 0 }}>Username</p>
                <p style={{ fontWeight: "700", color: "#374151", margin: "2px 0 0", fontFamily: "monospace" }}>
                  {previewUsername || "—"}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "0.72rem", color: "#6b7280", margin: 0 }}>Default Password</p>
                <p style={{ fontWeight: "700", color: "#374151", margin: "2px 0 0", fontFamily: "monospace" }}>
                  {form.studentId || "(Student ID)"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={handleSave} style={saveBtn}>💾 {editId ? "Update Student" : "Save Student"}</button>
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
          placeholder="🔍 Search by name or student ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
        />
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={filterSel}>
          <option value="">All Years</option>
          {YEARS.map((y) => <option key={y}>{y}</option>)}
        </select>
        <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} style={filterSel}>
          <option value="">All Sections</option>
          {SECTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} style={filterSel}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
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
                {["Student Name", "Student ID", "Year", "Section", "Department", "Username", "Actions"].map((h) => (
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
                        {s.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: "500" }}>{s.fullName}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "0.85rem", fontFamily: "monospace" }}>{s.studentId}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={badge}>{s.year || "—"}</span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#374151" }}>{s.section || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {s.department
                      ? <span style={{ ...badge, background: "#ede9fe", color: "#5b21b6" }}>{s.department}</span>
                      : <span style={{ color: "#9ca3af", fontSize: "0.82rem" }}>Year 1 (not yet)</span>
                    }
                  </td>
                  <td style={{ padding: "12px 16px", color: "#374151", fontFamily: "monospace", fontSize: "0.85rem" }}>
                    {s.username || deriveUsername(s.fullName || "")}
                  </td>
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

const avatarStyle = {
  width: "52px", height: "52px", borderRadius: "50%",
  background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
  color: "white", display: "flex", alignItems: "center",
  justifyContent: "center", fontWeight: "bold", fontSize: "1.2rem", flexShrink: 0,
};
const badge = { background: "#f3f4f6", color: "#374151", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "500" };
const card = { background: "white", borderRadius: "16px", padding: "2rem", boxShadow: "0 2px 12px #e9d5ff" };
const lbl = { display: "block", fontSize: "0.8rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" };
const inp = (err) => ({ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${err ? "#ef4444" : "#d1d5db"}`, fontSize: "0.9rem", outline: "none", boxSizing: "border-box" });
const saveBtn = { padding: "9px 18px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" };
const cancelBtn = { padding: "9px 18px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer" };
const backBtn = { padding: "8px 16px", background: "#ede9fe", color: "#5b21b6", border: "none", borderRadius: "8px", cursor: "pointer", marginBottom: "1rem", display: "inline-block" };
const editBtn = { padding: "6px 10px", background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const delBtn = { padding: "6px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const filterSel = { padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem", minWidth: "130px" };
const errText = { color: "#ef4444", fontSize: "0.75rem", marginTop: "2px" };
