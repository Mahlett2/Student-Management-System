import { useState, useEffect } from "react";

export default function CafeteriaMonitor({ goBack }) {
  const [requests, setRequests] = useState(() =>
    JSON.parse(localStorage.getItem("cafeteria_requests") || "[]")
  );
  const [filterChoice, setFilterChoice] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    localStorage.setItem("cafeteria_requests", JSON.stringify(requests));
  }, [requests]);

  const updateStatus = (id, status) => {
    setRequests((p) => p.map((r) => r.id === id ? { ...r, status } : r));
  };

  const filtered = requests.filter((r) => {
    const q = search.toLowerCase();
    return (
      (!q || r.studentName?.toLowerCase().includes(q) || r.studentId?.toLowerCase().includes(q)) &&
      (!filterChoice || r.choice === filterChoice)
    );
  });

  const cafe = requests.filter((r) => r.choice === "Cafe").length;
  const nonCafe = requests.filter((r) => r.choice === "Non-Cafe").length;
  const pending = requests.filter((r) => r.status === "Pending").length;

  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ color: "#0C4A6E", margin: 0 }}>🍽️ Cafeteria Requests</h2>
          <p style={{ color: "#0369A1", margin: "4px 0 0", fontSize: "0.85rem" }}>
            {requests.length} total · {pending > 0 && <span style={{ color: "#A16207", fontWeight: "700" }}>⏳ {pending} pending</span>}
          </p>
        </div>
        <button onClick={goBack} style={{ padding: "8px 16px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>⬅ Back</button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "1.25rem" }}>
        {[
          { label: "Cafe", value: cafe, icon: "🍽️", bg: "#DCFCE7", text: "#15803D" },
          { label: "Non-Cafe", value: nonCafe, icon: "🏠", bg: "#FEF9C3", text: "#A16207" },
          { label: "Pending", value: pending, icon: "⏳", bg: "#DBEAFE", text: "#1D4ED8" },
        ].map((c) => (
          <div key={c.label} style={{ background: c.bg, borderRadius: "12px", padding: "14px", textAlign: "center", border: `1px solid ${c.text}30` }}>
            <p style={{ fontSize: "1.5rem", margin: 0 }}>{c.icon}</p>
            <p style={{ fontWeight: "800", color: c.text, fontSize: "1.4rem", margin: "4px 0 2px" }}>{c.value}</p>
            <p style={{ fontSize: "0.75rem", color: c.text, fontWeight: "600", textTransform: "uppercase", margin: 0 }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input placeholder="🔍 Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem", outline: "none" }} />
        <select value={filterChoice} onChange={(e) => setFilterChoice(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem", outline: "none", minWidth: "150px" }}>
          <option value="">All Choices</option>
          <option value="Cafe">Cafe</option>
          <option value="Non-Cafe">Non-Cafe</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC", borderRadius: "12px", color: "#0369A1" }}>
          <p style={{ fontSize: "2rem" }}>🍽️</p>
          <p>{requests.length === 0 ? "No cafeteria requests yet." : "No requests match your filters."}</p>
        </div>
      ) : (
        <div style={{ background: "#7DD3FC", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(14,165,233,0.2)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
                {["Student", "ID", "Department", "Year", "Semester", "Choice", "Date", "Status", "Action"].map((h) => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "#38BDF8", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 === 0 ? "#7DD3FC" : "#BAE6FD", borderBottom: "1px solid rgba(14,165,233,0.12)" }}>
                  <td style={{ padding: "11px 14px", fontWeight: "600", color: "#0C4A6E" }}>{r.studentName}</td>
                  <td style={{ padding: "11px 14px", fontFamily: "monospace", color: "#0369A1", fontSize: "0.82rem" }}>{r.studentId}</td>
                  <td style={{ padding: "11px 14px", color: "#0C4A6E", fontSize: "0.82rem" }}>{r.department}</td>
                  <td style={{ padding: "11px 14px", color: "#0369A1" }}>{r.year}</td>
                  <td style={{ padding: "11px 14px", color: "#0369A1", fontSize: "0.82rem" }}>{r.semester}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ background: r.choice === "Cafe" ? "#DCFCE7" : "#FEF9C3", color: r.choice === "Cafe" ? "#15803D" : "#A16207", padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>
                      {r.choice === "Cafe" ? "🍽️" : "🏠"} {r.choice}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px", color: "#0369A1", fontSize: "0.78rem" }}>{fmt(r.submittedAt)}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ background: r.status === "Approved" ? "#DCFCE7" : r.status === "Rejected" ? "#FEE2E2" : "#FEF9C3", color: r.status === "Approved" ? "#15803D" : r.status === "Rejected" ? "#DC2626" : "#A16207", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {r.status !== "Approved" && (
                        <button onClick={() => updateStatus(r.id, "Approved")} style={{ padding: "4px 10px", background: "#DCFCE7", color: "#15803D", border: "1px solid #86EFAC", borderRadius: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: "600" }}>✅</button>
                      )}
                      {r.status !== "Rejected" && (
                        <button onClick={() => updateStatus(r.id, "Rejected")} style={{ padding: "4px 10px", background: "#FEE2E2", color: "#DC2626", border: "1px solid #FCA5A5", borderRadius: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: "600" }}>❌</button>
                      )}
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
