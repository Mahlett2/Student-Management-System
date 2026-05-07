import { useState, useMemo } from "react";
import { useAddDrop } from "../data/addDropStore";

const STATUSES = ["Pending", "Approved", "Rejected"];

export default function AddDropMonitor({ goBack }) {
  const { requests, setRequests } = useAddDrop();
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter((r) =>
      (!q || r.studentName.toLowerCase().includes(q) || r.course.toLowerCase().includes(q) || r.studentId?.toLowerCase().includes(q)) &&
      (!filterStatus || r.status === filterStatus) &&
      (!filterType || r.type === filterType)
    );
  }, [requests, search, filterStatus, filterType]);

  const pending = requests.filter((r) => r.status === "Pending").length;

  const updateStatus = (id, status) => {
    setRequests((p) => p.map((r) => r.id === id ? { ...r, status, reviewedAt: new Date().toISOString() } : r));
  };

  const deleteRequest = (id) => {
    if (window.confirm("Delete this request?"))
      setRequests((p) => p.filter((r) => r.id !== id));
  };

  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const statusColor = {
    Pending:  { bg: "#FEF9C3", text: "#A16207" },
    Approved: { bg: "#DCFCE7", text: "#15803D" },
    Rejected: { bg: "#FEE2E2", text: "#DC2626" },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ color: "#0C4A6E", margin: 0 }}>📋 Add / Drop Requests</h2>
          <p style={{ color: "#0369A1", margin: "4px 0 0", fontSize: "0.85rem" }}>
            {requests.length} total request{requests.length !== 1 ? "s" : ""}
            {pending > 0 && <span style={{ color: "#A16207", fontWeight: "700" }}> · ⏳ {pending} pending</span>}
          </p>
        </div>
        <button onClick={goBack} style={backBtn}>⬅ Back</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "1.5rem" }}>
        {[
          { label: "Pending", count: requests.filter((r) => r.status === "Pending").length, bg: "#FEF9C3", text: "#A16207" },
          { label: "Approved", count: requests.filter((r) => r.status === "Approved").length, bg: "#DCFCE7", text: "#15803D" },
          { label: "Rejected", count: requests.filter((r) => r.status === "Rejected").length, bg: "#FEE2E2", text: "#DC2626" },
        ].map((s) => (
          <div key={s.label} style={{ background: s.bg, borderRadius: "12px", padding: "1rem", textAlign: "center", border: `1px solid ${s.text}30` }}>
            <p style={{ fontSize: "1.6rem", fontWeight: "800", color: s.text, margin: 0 }}>{s.count}</p>
            <p style={{ fontSize: "0.78rem", color: s.text, fontWeight: "600", margin: "4px 0 0", textTransform: "uppercase" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input placeholder="🔍 Search by student, ID or course..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem", outline: "none" }} />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={sel}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={sel}>
          <option value="">Add & Drop</option>
          <option>Add</option>
          <option>Drop</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC", borderRadius: "12px", color: "#0369A1" }}>
          <p style={{ fontSize: "2rem" }}>📋</p>
          <p>{requests.length === 0 ? "No requests submitted yet." : "No requests match your filters."}</p>
        </div>
      ) : (
        <div style={{ background: "#7DD3FC", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 10px rgba(14,165,233,0.15)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
                {["Student", "ID", "Type", "Course", "Reason", "Submitted", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#38BDF8", fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const sc = statusColor[r.status] || statusColor.Pending;
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "#7DD3FC" : "#BAE6FD", borderBottom: "1px solid rgba(14,165,233,0.15)" }}>
                    <td style={{ padding: "11px 14px", fontWeight: "600", color: "#0C4A6E" }}>{r.studentName}</td>
                    <td style={{ padding: "11px 14px", color: "#0369A1", fontFamily: "monospace", fontSize: "0.82rem" }}>{r.studentId || "—"}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ background: r.type === "Add" ? "#DCFCE7" : "#FEE2E2", color: r.type === "Add" ? "#15803D" : "#DC2626", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" }}>{r.type}</span>
                    </td>
                    <td style={{ padding: "11px 14px", color: "#0C4A6E", fontWeight: "500" }}>{r.course}</td>
                    <td style={{ padding: "11px 14px", color: "#0369A1", fontSize: "0.82rem", maxWidth: "160px" }}>{r.reason || "—"}</td>
                    <td style={{ padding: "11px 14px", color: "#0369A1", fontSize: "0.82rem", whiteSpace: "nowrap" }}>{fmt(r.submittedAt)}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ background: sc.bg, color: sc.text, padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" }}>{r.status}</span>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                        {r.status !== "Approved" && (
                          <button onClick={() => updateStatus(r.id, "Approved")}
                            style={{ padding: "5px 10px", background: "#DCFCE7", color: "#15803D", border: "1px solid #86EFAC", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}>
                            ✅ Approve
                          </button>
                        )}
                        {r.status !== "Rejected" && (
                          <button onClick={() => updateStatus(r.id, "Rejected")}
                            style={{ padding: "5px 10px", background: "#FEE2E2", color: "#DC2626", border: "1px solid #FCA5A5", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}>
                            ❌ Reject
                          </button>
                        )}
                        <button onClick={() => deleteRequest(r.id)}
                          style={{ padding: "5px 8px", background: "rgba(239,68,68,0.1)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem" }}>
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const backBtn = { padding: "8px 16px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" };
const sel = { padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem", minWidth: "140px", outline: "none" };
