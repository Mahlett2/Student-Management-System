import { useState, useMemo, useEffect } from "react";
import { useSettings } from "../../data/settingsStore";
import { apiGet, apiPost } from "../../api/client";

const STATUS_COLOR = {
  Pending:  { bg: "#FEF9C3", text: "#A16207", icon: "⏳" },
  Approved: { bg: "#DCFCE7", text: "#15803D", icon: "✅" },
  Rejected: { bg: "#FEE2E2", text: "#DC2626", icon: "❌" },
};

export default function AddDrop() {
  const { settings } = useSettings();
  const stored = localStorage.getItem("current_user");
  const user = stored ? JSON.parse(stored) : {};

  const currentSemester = settings.currentSemester || "Semester 1";
  const currentAcYear = settings.academicYear || "2024/2025";

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Load existing requests from API on mount
  useEffect(() => {
    apiGet("/add-drop/")
      .then((data) => {
        if (data) setRequests(Array.isArray(data) ? data : (data.results || []));
      })
      .catch(() => {})
      .finally(() => setLoadingRequests(false));
  }, []);

  // Get available courses from admin subjects
  const adminSubjects = JSON.parse(localStorage.getItem("subjects") || "[]");
  const deptCourses = adminSubjects.map((s) => s.name);

  const FALLBACK_COURSES = [
    "Data Structures", "Algorithms", "Database Systems", "Web Development",
    "Software Engineering", "Computer Networks", "Operating Systems",
    "Artificial Intelligence", "Mobile Development", "Cybersecurity",
    "Digital Logic", "Calculus", "Linear Algebra", "Physics",
    "Engineering Drawing", "Thermodynamics", "Circuit Analysis",
    "Research Methods", "Technical Writing", "Ethics in Technology",
  ];

  const availableCourses = deptCourses.length > 0 ? deptCourses : FALLBACK_COURSES;

  const [tab, setTab] = useState("submit");
  const [type, setType] = useState("Add");
  const [course, setCourse] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Show only this student's requests (API already filters by auth user)
  const myRequests = useMemo(() =>
    [...requests].sort((a, b) => new Date(b.submitted_at || b.submittedAt) - new Date(a.submitted_at || a.submittedAt)),
    [requests]
  );

  const pending  = myRequests.filter((r) => r.status === "Pending").length;
  const approved = myRequests.filter((r) => r.status === "Approved").length;
  const rejected = myRequests.filter((r) => r.status === "Rejected").length;

  const validate = () => {
    const e = {};
    if (!course) e.course = "Please select a course";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    try {
      const created = await apiPost("/add-drop/", {
        request_type: type,
        subject: course,
        reason: reason.trim(),
      });
      setRequests((p) => [created, ...p]);
      setCourse(""); setReason(""); setErrors({});
      setSuccess(`Your ${type} request for "${course}" has been submitted. The admin will review it.`);      setTimeout(() => setSuccess(""), 4000);
      setTab("history");
    } catch (err) {
      setErrors({ course: err.message || "Failed to submit request. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ color: "#E0F2FE", margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>📋 Add / Drop Courses</h2>
          <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.82rem" }}>
            {currentAcYear} · {currentSemester}
          </p>
        </div>
        {myRequests.length > 0 && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <span style={{ background: "#FEF9C3", color: "#A16207", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>⏳ {pending} Pending</span>
            <span style={{ background: "#DCFCE7", color: "#15803D", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>✅ {approved} Approved</span>
            {rejected > 0 && <span style={{ background: "#FEE2E2", color: "#DC2626", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>❌ {rejected} Rejected</span>}
          </div>
        )}
      </div>

      {success && (
        <div style={{ background: "#DCFCE7", color: "#15803D", padding: "12px 16px", borderRadius: "10px", marginBottom: "1rem", fontWeight: "500", fontSize: "0.875rem", border: "1px solid #86EFAC" }}>
          ✅ {success}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "1.25rem", background: "#7DD3FC", padding: "5px", borderRadius: "12px", border: "1px solid rgba(14,165,233,0.2)" }}>
        {[
          { id: "submit",  label: "📤 New Request" },
          { id: "history", label: `📋 My Requests (${myRequests.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer",
            fontWeight: "700", fontSize: "0.85rem",
            background: tab === t.id ? "linear-gradient(135deg,#0F172A,#1E293B)" : "transparent",
            color: tab === t.id ? "#38BDF8" : "#0369A1",
            transition: "all 0.18s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── SUBMIT REQUEST ── */}
      {tab === "submit" && (
        <div style={{ background: "#7DD3FC", borderRadius: "14px", padding: "24px", border: "1px solid rgba(14,165,233,0.25)", maxWidth: "560px" }}>
          <h3 style={{ color: "#0C4A6E", margin: "0 0 1.25rem", fontWeight: "700" }}>Submit a New Request</h3>

          {/* Type toggle */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={lbl}>Request Type *</label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {["Add", "Drop"].map((t) => (
                <button key={t} onClick={() => { setType(t); setCourse(""); }} style={{
                  flex: 1, padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "0.875rem",
                  background: type === t ? "linear-gradient(135deg,#0F172A,#1E293B)" : "#BAE6FD",
                  color: type === t ? "#38BDF8" : "#0369A1",
                  boxShadow: type === t ? "0 3px 10px rgba(0,0,0,0.2)" : "none",
                  transition: "all 0.18s",
                }}>
                  {t === "Add" ? "➕" : "➖"} {t} Course
                </button>
              ))}
            </div>
            <p style={{ color: "#0369A1", fontSize: "0.75rem", margin: "6px 0 0" }}>
              {type === "Add" ? "Request to add a new course to your current registration." : "Request to drop a course from your current registration."}
            </p>
          </div>

          {/* Course */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={lbl}>Course *</label>
            <select value={course} onChange={(e) => { setCourse(e.target.value); setErrors((er) => ({ ...er, course: undefined })); }}
              style={{ ...inp, borderColor: errors.course ? "#EF4444" : "rgba(14,165,233,0.35)" }}>
              <option value="">Select a course...</option>
              {availableCourses.map((c) => <option key={c}>{c}</option>)}
            </select>
            {errors.course && <p style={errStyle}>{errors.course}</p>}
          </div>

          {/* Reason */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={lbl}>Reason <span style={{ color: "#64748B", fontWeight: "400" }}>(optional)</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly explain why you want to add or drop this course..."
              style={{ ...inp, minHeight: "80px", resize: "vertical" }} />
          </div>

          <button onClick={submit} disabled={submitting} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "10px", cursor: submitting ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "0.9rem", boxShadow: "0 3px 12px rgba(0,0,0,0.2)", opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "⏳ Submitting..." : `📤 Submit ${type} Request`}
          </button>
        </div>
      )}

      {/* ── REQUEST HISTORY ── */}
      {tab === "history" && (
        <>
          {loadingRequests ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#0369A1" }}>⏳ Loading requests...</div>
          ) : myRequests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC", borderRadius: "14px", color: "#0369A1" }}>
              <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>📭</p>
              <p style={{ fontWeight: "600" }}>No requests submitted yet.</p>
              <button onClick={() => setTab("submit")} style={{ marginTop: "1rem", padding: "9px 20px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>
                Submit a Request
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {myRequests.map((r) => {
                const sc = STATUS_COLOR[r.status] || STATUS_COLOR.Pending;
                const submittedAt = r.submitted_at || r.submittedAt;
                const acYear = r.academic_year || r.academicYear;
                return (
                  <div key={r.id} style={{ background: "#7DD3FC", borderRadius: "12px", padding: "16px 18px", border: `1px solid ${r.status === "Rejected" ? "rgba(239,68,68,0.25)" : r.status === "Approved" ? "rgba(16,185,129,0.25)" : "rgba(14,165,233,0.2)"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "5px", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: "700", color: "#0C4A6E", fontSize: "0.95rem" }}>{r.subject || r.course}</span>
                          <span style={{ background: (r.request_type || r.type) === "Add" ? "#DCFCE7" : "#FEE2E2", color: (r.request_type || r.type) === "Add" ? "#15803D" : "#DC2626", padding: "2px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: "700" }}>
                            {(r.request_type || r.type) === "Add" ? "➕" : "➖"} {r.request_type || r.type}
                          </span>
                        </div>
                        {r.reason && (
                          <p style={{ color: "#0369A1", fontSize: "0.82rem", margin: "0 0 4px", fontStyle: "italic" }}>"{r.reason}"</p>
                        )}
                        <p style={{ color: "#64748B", fontSize: "0.75rem", margin: 0 }}>
                          Submitted: {fmt(submittedAt)}
                        </p>
                      </div>
                      <span style={{ background: sc.bg, color: sc.text, padding: "5px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: "700", whiteSpace: "nowrap" }}>
                        {sc.icon} {r.status}
                      </span>
                    </div>
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

const lbl = { display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#0C4A6E", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" };
const inp = { width: "100%", padding: "10px 13px", borderRadius: "8px", border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" };
const errStyle = { color: "#EF4444", fontSize: "0.72rem", margin: "3px 0 0" };
