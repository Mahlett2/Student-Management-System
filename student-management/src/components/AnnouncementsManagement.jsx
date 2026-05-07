import { useState } from "react";
import { useAnnouncements } from "../data/announcementsStore";
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from "../api/operations";

const AUDIENCES = ["All", "Students Only", "Teachers Only"];
const CATEGORIES = ["General", "Academic", "Exam", "Event", "Urgent"];

const EMPTY = { title: "", body: "", audience: "All", category: "General" };

const categoryStyle = {
  General:  { bg: "#f3f4f6", text: "#374151" },
  Academic: { bg: "#dbeafe", text: "#1d4ed8" },
  Exam:     { bg: "#fef9c3", text: "#a16207" },
  Event:    { bg: "#dcfce7", text: "#15803d" },
  Urgent:   { bg: "#fee2e2", text: "#dc2626" },
};

const audienceIcon = { "All": "🌐", "Students Only": "🎓", "Teachers Only": "👨‍🏫", "Students": "🎓", "Teachers": "👨‍🏫", "Admin": "🛡️" };

// Map backend values → display labels
const audienceLabel = (a) => {
  const map = { "Students": "Students Only", "Teachers": "Teachers Only" };
  return map[a] || a;
};

export default function AnnouncementsManagement({ goBack }) {
  const { announcements, setAnnouncements } = useAnnouncements();
  const [view, setView] = useState("list"); // list | form
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterAud, setFilterAud] = useState("");

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.body.trim()) e.body = "Content is required";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      if (editId) {
        const updated = await updateAnnouncement(editId, form);
        if (updated) setAnnouncements((p) => p.map((a) => a.id === editId ? { ...a, ...form } : a));
      } else {
        const created = await createAnnouncement(form);
        if (created) setAnnouncements((p) => [{ ...form, id: created.id, posted_at: created.posted_at }, ...p]);
      }
    } catch (err) {
      alert(err.data ? JSON.stringify(err.data) : err.message);
      return;
    }
    setForm(EMPTY); setEditId(null); setErrors({}); setView("list");
  };

  const handleEdit = (a) => {
    // Map backend values back to frontend labels for the dropdown
    const audienceMap = { "Students": "Students Only", "Teachers": "Teachers Only" };
    setForm({
      title: a.title,
      body: a.body,
      audience: audienceMap[a.audience] || a.audience,
      category: a.category,
    });
    setEditId(a.id);
    setView("form");
  };
  const handleDelete = async (id) => {
    if (window.confirm("Delete this announcement?")) {
      try {
        await deleteAnnouncement(id);
        setAnnouncements((p) => p.filter((a) => a.id !== id));
      } catch (err) {
        alert("Delete failed: " + (err.message || "Unknown error"));
      }
    }
  };

  const filtered = announcements.filter((a) => {
    const q = search.toLowerCase();
    return (
      (!q || a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)) &&
      (!filterCat || a.category === filterCat) &&
      (!filterAud || a.audience === filterAud)
    );
  });

  const fmt = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  /* ── FORM VIEW ── */
  if (view === "form") return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <button onClick={() => { setView("list"); setEditId(null); setForm(EMPTY); setErrors({}); }} style={backBtn}>⬅ Back</button>
      <div style={card}>
        <h2 style={{ color: "#5b21b6", marginBottom: "1.5rem" }}>
          {editId ? "✏️ Edit Announcement" : "📢 New Announcement"}
        </h2>

        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Title *</label>
          <input style={inp(errors.title)} placeholder="Announcement title..." value={form.title} onChange={set("title")} />
          {errors.title && <p style={errText}>{errors.title}</p>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem", marginBottom: "1rem" }}>
          <div>
            <label style={labelStyle}>Category</label>
            <select style={inp(false)} value={form.category} onChange={set("category")}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Visible To</label>
            <select style={inp(false)} value={form.audience} onChange={set("audience")}>
              {AUDIENCES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Content *</label>
          <textarea
            style={{ ...inp(errors.body), resize: "vertical", minHeight: "140px" }}
            placeholder="Write the announcement content here..."
            value={form.body} onChange={set("body")}
          />
          {errors.body && <p style={errText}>{errors.body}</p>}
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={handleSave} style={saveBtn}>📢 {editId ? "Update" : "Post Announcement"}</button>
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
          <h2 style={{ color: "#5b21b6", margin: 0 }}>📢 Announcements</h2>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "0.85rem" }}>
            {announcements.length} announcement{announcements.length !== 1 ? "s" : ""}
            {filtered.length !== announcements.length && ` · ${filtered.length} shown`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setErrors({}); setView("form"); }} style={saveBtn}>
            ➕ New Announcement
          </button>
          <button onClick={goBack} style={backBtn}>⬅ Back</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Search announcements..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
        />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={filterSel}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={filterAud} onChange={(e) => setFilterAud(e.target.value)} style={filterSel}>
          <option value="">All Audiences</option>
          {AUDIENCES.map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "12px", color: "#6b7280" }}>
          <p style={{ fontSize: "2rem" }}>📢</p>
          <p>{announcements.length === 0 ? 'No announcements yet. Click "New Announcement" to post one.' : "No announcements match your search."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filtered.map((a) => {
            const cat = categoryStyle[a.category] || categoryStyle.General;
            return (
              <div key={a.id} style={{ background: "white", borderRadius: "14px", padding: "1.5rem", boxShadow: "0 1px 6px #e9d5ff", borderLeft: `4px solid ${cat.text}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                      <span style={{ background: cat.bg, color: cat.text, padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" }}>
                        {a.category}
                      </span>
                      <span style={{ background: "#ede9fe", color: "#5b21b6", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem" }}>
                        {audienceIcon[a.audience] || "🌐"} {audienceLabel(a.audience)}
                      </span>
                      <span style={{ color: "#9ca3af", fontSize: "0.78rem" }}>{fmt(a.updatedAt || a.createdAt)}</span>
                    </div>
                    <h3 style={{ color: "#1f2937", margin: "0 0 0.5rem", fontSize: "1rem" }}>{a.title}</h3>
                    <p style={{ color: "#4b5563", margin: 0, lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{a.body}</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                    <button onClick={() => handleEdit(a)} style={editBtn}>✏️</button>
                    <button onClick={() => handleDelete(a.id)} style={delBtn}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const card = { background: "white", borderRadius: "16px", padding: "2rem", boxShadow: "0 2px 12px #e9d5ff" };
const inp = (err) => ({ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${err ? "#ef4444" : "#d1d5db"}`, fontSize: "0.9rem", outline: "none", boxSizing: "border-box" });
const saveBtn = { padding: "9px 18px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" };
const cancelBtn = { padding: "9px 18px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer" };
const backBtn = { padding: "8px 16px", background: "#ede9fe", color: "#5b21b6", border: "none", borderRadius: "8px", cursor: "pointer", marginBottom: "1rem", display: "inline-block" };
const editBtn = { padding: "6px 10px", background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const delBtn = { padding: "6px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const filterSel = { padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem", minWidth: "160px" };
const labelStyle = { display: "block", fontSize: "0.8rem", color: "#6b7280", marginBottom: "4px" };
const errText = { color: "#ef4444", fontSize: "0.75rem", marginTop: "2px" };
