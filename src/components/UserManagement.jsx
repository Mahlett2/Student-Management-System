import { useState } from "react";
import { useAdmin, ROLE_PERMISSIONS } from "../data/adminStore";

const ROLES = ["Super Admin", "Staff"];
const STATUSES = ["Active", "Inactive"];
const EMPTY = { username: "", password: "", fullName: "", email: "", role: "Staff", status: "Active" };

export default function UserManagement({ goBack }) {
  const { admins, setAdmins, currentAdmin } = useAdmin();
  const isSuperAdmin = currentAdmin?.role === "Super Admin";

  const [view, setView] = useState("list"); // list | form
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: undefined })); };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.username.trim()) e.username = "Username is required";
    else if (!editId && admins.find((a) => a.username === form.username)) e.username = "Username already exists";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!editId && !form.password.trim()) e.password = "Password is required";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editId) {
      setAdmins((p) => p.map((a) => a.id === editId ? { ...a, ...form, password: form.password || a.password } : a));
    } else {
      setAdmins((p) => [...p, { id: Date.now(), ...form }]);
    }
    setForm(EMPTY); setEditId(null); setErrors({}); setView("list");
  };

  const handleEdit = (a) => { setForm({ ...a, password: "" }); setEditId(a.id); setView("form"); };
  const handleDelete = (id) => {
    if (id === currentAdmin?.id) return alert("You cannot delete your own account.");
    if (window.confirm("Delete this admin account?")) setAdmins((p) => p.filter((a) => a.id !== id));
  };
  const toggleStatus = (id) => {
    if (id === currentAdmin?.id) return alert("You cannot deactivate your own account.");
    setAdmins((p) => p.map((a) => a.id === id ? { ...a, status: a.status === "Active" ? "Inactive" : "Active" } : a));
  };

  const filtered = admins.filter((a) => {
    const q = search.toLowerCase();
    return !q || a.fullName.toLowerCase().includes(q) || a.username.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
  });

  const roleColor = { "Super Admin": { bg: "#ede9fe", text: "#5b21b6" }, "Staff": { bg: "#dbeafe", text: "#1d4ed8" } };
  const statusColor = { Active: { bg: "#dcfce7", text: "#15803d" }, Inactive: { bg: "#fee2e2", text: "#dc2626" } };

  if (!isSuperAdmin) return (
    <div style={{ textAlign: "center", padding: "4rem", background: "white", borderRadius: "16px" }}>
      <p style={{ fontSize: "2rem" }}>🔒</p>
      <h3 style={{ color: "#5b21b6" }}>Access Restricted</h3>
      <p style={{ color: "#6b7280" }}>Only Super Admins can manage user accounts.</p>
      <button onClick={goBack} style={backBtn}>⬅ Back</button>
    </div>
  );

  /* ── FORM VIEW ── */
  if (view === "form") return (
    <div style={{ maxWidth: "620px", margin: "0 auto" }}>
      <button onClick={() => { setView("list"); setEditId(null); setForm(EMPTY); setErrors({}); }} style={backBtn}>⬅ Back</button>
      <div style={card}>
        <h2 style={{ color: "#5b21b6", marginBottom: "1.5rem" }}>{editId ? "✏️ Edit Admin Account" : "➕ Add Admin Account"}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
          <F label="Full Name *" err={errors.fullName}><input style={inp(errors.fullName)} placeholder="e.g. Abebe Kebede" value={form.fullName} onChange={set("fullName")} /></F>
          <F label="Username *" err={errors.username}><input style={inp(errors.username)} placeholder="e.g. abebe.k" value={form.username} onChange={set("username")} /></F>
          <F label="Email *" err={errors.email}><input style={inp(errors.email)} placeholder="admin@university.edu" value={form.email} onChange={set("email")} /></F>
          <F label={editId ? "New Password (leave blank to keep)" : "Password *"} err={errors.password}>
            <input type="password" style={inp(errors.password)} placeholder="••••••••" value={form.password} onChange={set("password")} />
          </F>
          <F label="Role">
            <select style={inp(false)} value={form.role} onChange={set("role")}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </F>
          <F label="Status">
            <select style={inp(false)} value={form.status} onChange={set("status")}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </F>
        </div>

        {/* Permissions preview */}
        <div style={{ background: "#faf5ff", borderRadius: "10px", padding: "1rem", marginTop: "0.5rem" }}>
          <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "0 0 0.5rem", fontWeight: "600" }}>Permissions for {form.role}:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {(ROLE_PERMISSIONS[form.role] || []).map((p) => (
              <span key={p} style={{ background: "#ede9fe", color: "#5b21b6", padding: "2px 10px", borderRadius: "20px", fontSize: "0.75rem", textTransform: "capitalize" }}>{p}</span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button onClick={handleSave} style={saveBtn}>💾 {editId ? "Update Account" : "Create Account"}</button>
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
          <h2 style={{ color: "#5b21b6", margin: 0 }}>👥 User & Access Management</h2>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "0.85rem" }}>{admins.length} admin account{admins.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setErrors({}); setView("form"); }} style={saveBtn}>➕ Add Account</button>
          <button onClick={goBack} style={backBtn}>⬅ Back</button>
        </div>
      </div>

      <input placeholder="🔍 Search by name, username or email..." value={search} onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", maxWidth: "400px", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem", marginBottom: "1.25rem" }} />

      <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 6px #e9d5ff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#8b5cf6", color: "white" }}>
              {["Admin", "Username", "Email", "Role", "Permissions", "Status", "Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", fontSize: "0.85rem" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => {
              const rc = roleColor[a.role] || roleColor.Staff;
              const sc = statusColor[a.status] || statusColor.Active;
              const isMe = a.id === currentAdmin?.id;
              return (
                <tr key={a.id} style={{ background: i % 2 === 0 ? "white" : "#faf5ff", borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={avatar}>{a.fullName.charAt(0).toUpperCase()}</div>
                      <div>
                        <p style={{ margin: 0, fontWeight: "500" }}>{a.fullName}</p>
                        {isMe && <span style={{ fontSize: "0.7rem", color: "#8b5cf6" }}>● You</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#374151", fontSize: "0.85rem" }}>{a.username}</td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "0.85rem" }}>{a.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: rc.bg, color: rc.text, padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" }}>{a.role}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>{(ROLE_PERMISSIONS[a.role] || []).length} modules</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => toggleStatus(a.id)} style={{ background: sc.bg, color: sc.text, border: "none", borderRadius: "20px", padding: "3px 10px", fontSize: "0.75rem", fontWeight: "600", cursor: isMe ? "not-allowed" : "pointer" }}>
                      {a.status}
                    </button>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => handleEdit(a)} style={editBtn}>✏️</button>
                      <button onClick={() => handleDelete(a.id)} style={{ ...delBtn, opacity: isMe ? 0.4 : 1, cursor: isMe ? "not-allowed" : "pointer" }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role legend */}
      <div style={{ marginTop: "1.5rem", background: "white", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 1px 6px #e9d5ff" }}>
        <p style={{ fontWeight: "600", color: "#5b21b6", marginBottom: "0.75rem" }}>Role Permissions</p>
        {ROLES.map((role) => (
          <div key={role} style={{ marginBottom: "0.75rem" }}>
            <span style={{ fontWeight: "600", fontSize: "0.85rem", color: "#374151" }}>{role}: </span>
            <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>{(ROLE_PERMISSIONS[role] || []).join(", ")}</span>
          </div>
        ))}
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
const inp = (err) => ({ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${err ? "#ef4444" : "#d1d5db"}`, fontSize: "0.9rem", outline: "none" });
const saveBtn = { padding: "9px 18px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" };
const cancelBtn = { padding: "9px 18px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer" };
const backBtn = { padding: "8px 16px", background: "#ede9fe", color: "#5b21b6", border: "none", borderRadius: "8px", cursor: "pointer", marginBottom: "1rem", display: "inline-block" };
const editBtn = { padding: "6px 10px", background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const delBtn = { padding: "6px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const avatar = { width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.9rem", flexShrink: 0 };
