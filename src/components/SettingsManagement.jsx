import { useState } from "react";
import { useSettings } from "../data/settingsStore";

const SEMESTERS_LIST = ["Semester 1", "Semester 2"];
const SEMESTER_STATUSES = ["Active", "Upcoming", "Completed"];
const EMPTY_SEM = { name: "", startDate: "", endDate: "", status: "Upcoming" };

export default function SettingsManagement({ goBack }) {
  const { settings, updateSettings } = useSettings();
  const [tab, setTab] = useState("general"); // general | academic | semesters
  const [general, setGeneral] = useState({
    universityName: settings.universityName,
    campusName: settings.campusName,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    website: settings.website,
  });
  const [academic, setAcademic] = useState({
    academicYear: settings.academicYear,
    currentSemester: settings.currentSemester,
  });
  const [semesters, setSemesters] = useState(settings.semesters || []);
  const [semForm, setSemForm] = useState(EMPTY_SEM);
  const [semEditId, setSemEditId] = useState(null);
  const [semErrors, setSemErrors] = useState({});
  const [saved, setSaved] = useState("");

  const showSaved = (msg) => { setSaved(msg); setTimeout(() => setSaved(""), 2500); };

  const saveGeneral = () => {
    updateSettings(general);
    showSaved("General settings saved.");
  };

  const saveAcademic = () => {
    updateSettings(academic);
    showSaved("Academic settings saved.");
  };

  const validateSem = () => {
    const e = {};
    if (!semForm.name.trim()) e.name = "Name is required";
    if (!semForm.startDate) e.startDate = "Start date is required";
    if (!semForm.endDate) e.endDate = "End date is required";
    else if (semForm.startDate && semForm.endDate <= semForm.startDate) e.endDate = "End date must be after start date";
    return e;
  };

  const saveSemester = () => {
    const e = validateSem();
    if (Object.keys(e).length) { setSemErrors(e); return; }
    let updated;
    if (semEditId) {
      updated = semesters.map((s) => s.id === semEditId ? { ...s, ...semForm } : s);
    } else {
      updated = [...semesters, { id: Date.now(), ...semForm }];
    }
    setSemesters(updated);
    updateSettings({ semesters: updated });
    setSemForm(EMPTY_SEM); setSemEditId(null); setSemErrors({});
    showSaved("Semester saved.");
  };

  const deleteSemester = (id) => {
    if (!window.confirm("Delete this semester?")) return;
    const updated = semesters.filter((s) => s.id !== id);
    setSemesters(updated);
    updateSettings({ semesters: updated });
  };

  const editSemester = (s) => {
    setSemForm({ name: s.name, startDate: s.startDate, endDate: s.endDate, status: s.status });
    setSemEditId(s.id);
  };

  const setActiveSemester = (id) => {
    const updated = semesters.map((s) => ({ ...s, status: s.id === id ? "Active" : s.status === "Active" ? "Upcoming" : s.status }));
    setSemesters(updated);
    updateSettings({ semesters: updated });
    showSaved("Active semester updated.");
  };

  const statusColor = { Active: { bg: "#dcfce7", text: "#15803d" }, Upcoming: { bg: "#dbeafe", text: "#1d4ed8" }, Completed: { bg: "#f3f4f6", text: "#6b7280" } };

  const tabs = [
    { id: "general", label: "🏛️ General" },
    { id: "academic", label: "📅 Academic Year" },
    { id: "semesters", label: "🗓️ Semesters" },
  ];

  return (
    <div style={{ maxWidth: "780px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ color: "#5b21b6", margin: 0 }}>⚙️ Settings</h2>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "0.85rem" }}>
            {settings.universityName} — {settings.campusName}
          </p>
        </div>
        <button onClick={goBack} style={backBtn}>⬅ Back</button>
      </div>

      {saved && (
        <div style={{ background: "#dcfce7", color: "#15803d", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontWeight: "500" }}>
          ✅ {saved}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "2px solid #ede9fe", paddingBottom: "0" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
            fontWeight: tab === t.id ? "700" : "400",
            color: tab === t.id ? "#5b21b6" : "#6b7280",
            borderBottom: tab === t.id ? "3px solid #8b5cf6" : "3px solid transparent",
            fontSize: "0.9rem", marginBottom: "-2px",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── GENERAL TAB ── */}
      {tab === "general" && (
        <div style={card}>
          <h3 style={{ color: "#5b21b6", marginBottom: "1.5rem" }}>🏛️ University Information</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
            <F label="University Name">
              <input style={inp(false)} value={general.universityName} onChange={(e) => setGeneral((g) => ({ ...g, universityName: e.target.value }))} />
            </F>
            <F label="Campus Name">
              <input style={inp(false)} value={general.campusName} onChange={(e) => setGeneral((g) => ({ ...g, campusName: e.target.value }))} />
            </F>
            <F label="Email">
              <input style={inp(false)} value={general.email} onChange={(e) => setGeneral((g) => ({ ...g, email: e.target.value }))} />
            </F>
            <F label="Phone">
              <input style={inp(false)} value={general.phone} onChange={(e) => setGeneral((g) => ({ ...g, phone: e.target.value }))} />
            </F>
            <F label="Website">
              <input style={inp(false)} value={general.website} onChange={(e) => setGeneral((g) => ({ ...g, website: e.target.value }))} />
            </F>
            <F label="Address">
              <input style={inp(false)} value={general.address} onChange={(e) => setGeneral((g) => ({ ...g, address: e.target.value }))} />
            </F>
          </div>

          {/* Preview card */}
          <div style={{ background: "linear-gradient(135deg,#8b5cf6,#5b21b6)", borderRadius: "12px", padding: "1.5rem", color: "white", marginTop: "1rem", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.2rem" }}>{general.universityName}</h3>
            <p style={{ margin: "0 0 0.75rem", opacity: 0.85 }}>{general.campusName}</p>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.82rem", opacity: 0.9 }}>
              <span>📧 {general.email}</span>
              <span>📞 {general.phone}</span>
              <span>🌐 {general.website}</span>
            </div>
          </div>

          <button onClick={saveGeneral} style={saveBtn}>💾 Save General Settings</button>
        </div>
      )}

      {/* ── ACADEMIC YEAR TAB ── */}
      {tab === "academic" && (
        <div style={card}>
          <h3 style={{ color: "#5b21b6", marginBottom: "1.5rem" }}>📅 Academic Year Configuration</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
            <F label="Current Academic Year">
              <input style={inp(false)} placeholder="e.g. 2024/2025" value={academic.academicYear}
                onChange={(e) => setAcademic((a) => ({ ...a, academicYear: e.target.value }))} />
            </F>
            <F label="Current Semester">
              <select style={inp(false)} value={academic.currentSemester}
                onChange={(e) => setAcademic((a) => ({ ...a, currentSemester: e.target.value }))}>
                {SEMESTERS_LIST.map((s) => <option key={s}>{s}</option>)}
              </select>
            </F>
          </div>

          <div style={{ background: "#faf5ff", borderRadius: "12px", padding: "1.25rem", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
            <p style={{ margin: "0 0 0.5rem", fontWeight: "600", color: "#5b21b6" }}>Current Configuration</p>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>Academic Year</p>
                <p style={{ fontWeight: "700", color: "#374151", margin: "4px 0 0", fontSize: "1.1rem" }}>{academic.academicYear}</p>
              </div>
              <div>
                <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>Active Semester</p>
                <p style={{ fontWeight: "700", color: "#374151", margin: "4px 0 0", fontSize: "1.1rem" }}>{academic.currentSemester}</p>
              </div>
            </div>
          </div>

          <button onClick={saveAcademic} style={saveBtn}>💾 Save Academic Settings</button>
        </div>
      )}

      {/* ── SEMESTERS TAB ── */}
      {tab === "semesters" && (
        <div>
          {/* Add/Edit form */}
          <div style={{ ...card, marginBottom: "1.5rem" }}>
            <h3 style={{ color: "#5b21b6", marginBottom: "1rem" }}>{semEditId ? "✏️ Edit Semester" : "➕ Add Semester"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
              <F label="Semester Name *" err={semErrors.name}>
                <input style={inp(semErrors.name)} placeholder="e.g. Semester 1" value={semForm.name}
                  onChange={(e) => { setSemForm((f) => ({ ...f, name: e.target.value })); setSemErrors((er) => ({ ...er, name: undefined })); }} />
              </F>
              <F label="Status">
                <select style={inp(false)} value={semForm.status} onChange={(e) => setSemForm((f) => ({ ...f, status: e.target.value }))}>
                  {SEMESTER_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </F>
              <F label="Start Date *" err={semErrors.startDate}>
                <input type="date" style={inp(semErrors.startDate)} value={semForm.startDate}
                  onChange={(e) => { setSemForm((f) => ({ ...f, startDate: e.target.value })); setSemErrors((er) => ({ ...er, startDate: undefined })); }} />
              </F>
              <F label="End Date *" err={semErrors.endDate}>
                <input type="date" style={inp(semErrors.endDate)} value={semForm.endDate}
                  onChange={(e) => { setSemForm((f) => ({ ...f, endDate: e.target.value })); setSemErrors((er) => ({ ...er, endDate: undefined })); }} />
              </F>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={saveSemester} style={saveBtn}>💾 {semEditId ? "Update" : "Add Semester"}</button>
              {semEditId && <button onClick={() => { setSemForm(EMPTY_SEM); setSemEditId(null); setSemErrors({}); }} style={cancelBtn}>Cancel</button>}
            </div>
          </div>

          {/* Semesters list */}
          {semesters.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", background: "white", borderRadius: "12px", color: "#6b7280" }}>
              <p>No semesters configured yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {semesters.map((s) => {
                const sc = statusColor[s.status] || statusColor.Upcoming;
                return (
                  <div key={s.id} style={{ background: "white", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 1px 6px #e9d5ff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                        <h4 style={{ margin: 0, color: "#1f2937" }}>{s.name}</h4>
                        <span style={{ background: sc.bg, color: sc.text, padding: "2px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" }}>{s.status}</span>
                      </div>
                      <p style={{ margin: 0, color: "#6b7280", fontSize: "0.85rem" }}>
                        📅 {s.startDate} → {s.endDate}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {s.status !== "Active" && (
                        <button onClick={() => setActiveSemester(s.id)} style={{ padding: "6px 12px", background: "#dcfce7", color: "#15803d", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}>
                          ✅ Set Active
                        </button>
                      )}
                      <button onClick={() => editSemester(s)} style={editBtn}>✏️ Edit</button>
                      <button onClick={() => deleteSemester(s.id)} style={delBtn}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
const inp = (err) => ({ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${err ? "#ef4444" : "#d1d5db"}`, fontSize: "0.9rem", outline: "none", boxSizing: "border-box" });
const saveBtn = { padding: "9px 18px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" };
const cancelBtn = { padding: "9px 18px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer" };
const backBtn = { padding: "8px 16px", background: "#ede9fe", color: "#5b21b6", border: "none", borderRadius: "8px", cursor: "pointer", marginBottom: "1rem", display: "inline-block" };
const editBtn = { padding: "6px 10px", background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const delBtn = { padding: "6px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
