import { useState, useMemo } from "react";
import { useAnnouncements } from "../data/announcementsStore";

const CATEGORY_STYLE = {
  General:  { bg: "#DBEAFE", text: "#1D4ED8", border: "#93C5FD" },
  Academic: { bg: "#DCFCE7", text: "#15803D", border: "#86EFAC" },
  Exam:     { bg: "#FEF9C3", text: "#A16207", border: "#FDE047" },
  Event:    { bg: "#FCE7F3", text: "#9D174D", border: "#F9A8D4" },
  Urgent:   { bg: "#FEE2E2", text: "#DC2626", border: "#FCA5A5" },
};

export default function AnnouncementPage({ role = "student" }) {
  const { announcements } = useAnnouncements();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  // Filter by audience
  const visible = useMemo(() =>
    announcements.filter((a) => {
      if (a.audience === "All") return true;
      if (role === "student" && a.audience === "Students Only") return true;
      if (role === "teacher" && a.audience === "Teachers Only") return true;
      return false;
    }),
    [announcements, role]
  );

  // Apply search + category filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return visible.filter((a) =>
      (!q || a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)) &&
      (!filterCat || a.category === filterCat)
    );
  }, [visible, search, filterCat]);

  const urgent = visible.filter((a) => a.category === "Urgent").length;
  const categories = [...new Set(visible.map((a) => a.category))];

  const fmt = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ color: "#E0F2FE", margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>📢 Announcements</h2>
          <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.82rem" }}>
            {visible.length} announcement{visible.length !== 1 ? "s" : ""} for you
          </p>
        </div>
        {urgent > 0 && (
          <span style={{ background: "#FEE2E2", color: "#DC2626", padding: "6px 14px", borderRadius: "20px", fontWeight: "700", fontSize: "0.82rem", border: "1px solid #FCA5A5" }}>
            🚨 {urgent} Urgent
          </span>
        )}
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC", borderRadius: "14px", color: "#0369A1" }}>
          <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>📭</p>
          <p style={{ fontWeight: "600" }}>No announcements yet.</p>
          <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>Check back later for updates from the admin.</p>
        </div>
      ) : (
        <>
          {/* Search & filter */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <input placeholder="🔍 Search announcements..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: "200px", padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem", outline: "none" }} />
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem", outline: "none", minWidth: "150px" }}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", background: "#7DD3FC", borderRadius: "12px", color: "#0369A1" }}>
              <p>No announcements match your search.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filtered.map((a) => {
                const cat = CATEGORY_STYLE[a.category] || CATEGORY_STYLE.General;
                return (
                  <div key={a.id} style={{ background: "#7DD3FC", borderRadius: "14px", padding: "18px 20px", border: `1px solid ${cat.border}`, borderLeft: `4px solid ${cat.text}` }}>
                    {/* Category + date */}
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "8px", alignItems: "center" }}>
                      <span style={{ background: cat.bg, color: cat.text, padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" }}>
                        {a.category}
                      </span>
                      <span style={{ color: "#64748B", fontSize: "0.75rem" }}>
                        {fmt(a.updatedAt || a.createdAt)}
                      </span>
                    </div>
                    {/* Title */}
                    <h3 style={{ color: "#0C4A6E", margin: "0 0 6px", fontSize: "1rem", fontWeight: "700" }}>{a.title}</h3>
                    {/* Body */}
                    <p style={{ color: "#0369A1", margin: 0, lineHeight: "1.65", fontSize: "0.875rem", whiteSpace: "pre-wrap" }}>{a.body}</p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
