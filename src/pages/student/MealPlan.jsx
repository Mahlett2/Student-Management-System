import { useState, useEffect } from "react";
import { useSettings } from "../../data/settingsStore";
import { apiGet, apiPost } from "../../api/client";

export default function MealPlan() {
  const { settings } = useSettings();

  const [cafeteriaRequest, setCafeteriaRequest] = useState(null); // most recent request from API
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Load the student's cafeteria requests from API
  useEffect(() => {
    apiGet("/cafeteria/")
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        if (list.length > 0) {
          // Most recent request
          const sorted = [...list].sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));
          setCafeteriaRequest(sorted[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Also check student profile cafeteria field as fallback
  const stored = localStorage.getItem("current_user");
  const user = stored ? JSON.parse(stored) : {};

  const requestStatus = cafeteriaRequest?.status || null;
  const isCafe = (requestStatus === "Approved" && cafeteriaRequest?.choice === "Cafe") || (!cafeteriaRequest && user.cafeteria === "Cafe");
  const isPending = requestStatus === "Pending";
  const isRejected = requestStatus === "Rejected";
  const isNonCafe = !cafeteriaRequest && user.cafeteria === "Non-Cafe";

  const handleRequestCafeteria = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const created = await apiPost("/cafeteria/", {
        choice: "Cafe",
      });
      setCafeteriaRequest(created);
      setSubmitSuccess("Your cafeteria request has been submitted. The admin will review it.");
      setTimeout(() => setSubmitSuccess(""), 5000);
    } catch (err) {
      setSubmitError(err.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#0369A1" }}>
        ⏳ Loading cafeteria status...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ color: "#E0F2FE", margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>🍽️ Cafeteria / Meal Plan</h2>
          <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.82rem" }}>
            {settings.academicYear} · {settings.currentSemester}
          </p>
        </div>
        {(isCafe || isPending || isRejected) && (
          <span style={{
            background: isCafe ? "#DCFCE7" : isPending ? "#FEF9C3" : "#FEE2E2",
            color: isCafe ? "#15803D" : isPending ? "#A16207" : "#DC2626",
            padding: "8px 18px", borderRadius: "20px", fontWeight: "800", fontSize: "0.9rem",
            border: `1px solid ${isCafe ? "#86EFAC" : isPending ? "#FDE047" : "#FCA5A5"}`,
          }}>
            {isCafe ? "✅ Cafe Student" : isPending ? "⏳ Pending Approval" : "❌ Request Rejected"}
          </span>
        )}
      </div>

      {submitSuccess && (
        <div style={{ background: "#DCFCE7", color: "#15803D", padding: "12px 16px", borderRadius: "10px", marginBottom: "1rem", fontWeight: "500", fontSize: "0.875rem", border: "1px solid #86EFAC" }}>
          ✅ {submitSuccess}
        </div>
      )}
      {submitError && (
        <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "12px 16px", borderRadius: "10px", marginBottom: "1rem", fontWeight: "500", fontSize: "0.875rem", border: "1px solid #FCA5A5" }}>
          ❌ {submitError}
        </div>
      )}

      {/* No request yet */}
      {!cafeteriaRequest && !isNonCafe && (
        <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC", borderRadius: "14px", color: "#0369A1" }}>
          <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>🍽️</p>
          <p style={{ fontWeight: "600" }}>You haven't requested cafeteria enrollment yet.</p>
          <p style={{ fontSize: "0.85rem", opacity: 0.8, lineHeight: "1.6", marginBottom: "1.5rem" }}>
            Submit a request below and the admin will approve or reject it.
          </p>
          <button onClick={handleRequestCafeteria} disabled={submitting} style={{ padding: "11px 28px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "10px", cursor: submitting ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "0.9rem", opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "⏳ Submitting..." : "🍽️ Request Cafeteria Enrollment"}
          </button>
        </div>
      )}

      {/* Pending */}
      {isPending && (
        <div style={{ background: "#7DD3FC", borderRadius: "14px", padding: "28px", border: "1px solid rgba(14,165,233,0.25)", textAlign: "center" }}>
          <p style={{ fontSize: "3rem", margin: "0 0 0.75rem" }}>⏳</p>
          <h3 style={{ color: "#0C4A6E", margin: "0 0 8px", fontWeight: "800" }}>Request Pending</h3>
          <p style={{ color: "#0369A1", margin: "0 0 1rem", fontSize: "0.875rem", lineHeight: "1.6" }}>
            Your cafeteria enrollment request is under review.<br />
            The admin will approve or reject it shortly.
          </p>
          <p style={{ color: "#64748B", fontSize: "0.78rem" }}>
            Submitted: {cafeteriaRequest?.submitted_at ? new Date(cafeteriaRequest.submitted_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
          </p>
        </div>
      )}

      {/* Rejected */}
      {isRejected && (
        <div style={{ background: "#7DD3FC", borderRadius: "14px", padding: "28px", border: "1px solid rgba(239,68,68,0.25)", textAlign: "center" }}>
          <p style={{ fontSize: "3rem", margin: "0 0 0.75rem" }}>❌</p>
          <h3 style={{ color: "#DC2626", margin: "0 0 8px", fontWeight: "800" }}>Request Rejected</h3>
          <p style={{ color: "#0369A1", margin: "0 0 1.5rem", fontSize: "0.875rem", lineHeight: "1.6" }}>
            Your cafeteria enrollment request was rejected.<br />
            Please contact the Student Affairs office for more information.
          </p>
          <button onClick={handleRequestCafeteria} disabled={submitting} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "10px", cursor: submitting ? "not-allowed" : "pointer", fontWeight: "700", opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "⏳ Submitting..." : "🔄 Submit New Request"}
          </button>
        </div>
      )}

      {/* Approved / Cafe student */}
      {isCafe && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Status card */}
          <div style={{ background: "#7DD3FC", borderRadius: "14px", padding: "24px", border: "1px solid rgba(14,165,233,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "1.25rem" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg,#10B981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", flexShrink: 0 }}>
                🍽️
              </div>
              <div>
                <h3 style={{ color: "#0C4A6E", margin: 0, fontWeight: "800" }}>University Cafeteria</h3>
                <p style={{ color: "#0369A1", margin: "4px 0 0", fontSize: "0.875rem" }}>
                  You are registered as a <strong>Cafe Student</strong>
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { label: "Status", value: "✅ Active", color: "#15803D", bg: "#DCFCE7" },
                { label: "Meal Plan", value: cafeteriaRequest?.choice || "Cafe", color: "#1D4ED8", bg: "#DBEAFE" },
                { label: "Academic Year", value: settings.academicYear || "2024/2025", color: "#0C4A6E", bg: "#BAE6FD" },
                { label: "Semester", value: settings.currentSemester || "Semester 1", color: "#0C4A6E", bg: "#BAE6FD" },
              ].map((c) => (
                <div key={c.label} style={{ background: c.bg, borderRadius: "10px", padding: "12px 14px" }}>
                  <p style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase", margin: 0 }}>{c.label}</p>
                  <p style={{ fontWeight: "700", color: c.color, margin: "4px 0 0" }}>{c.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Meal schedule */}
          <div style={{ background: "#7DD3FC", borderRadius: "14px", padding: "20px", border: "1px solid rgba(14,165,233,0.25)" }}>
            <h3 style={{ color: "#0C4A6E", margin: "0 0 14px", fontWeight: "700", fontSize: "0.95rem" }}>🕐 Daily Meal Schedule</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { meal: "Breakfast", time: "6:30 AM – 8:00 AM", icon: "🌅" },
                { meal: "Lunch",     time: "12:00 PM – 2:00 PM", icon: "☀️" },
                { meal: "Dinner",    time: "6:00 PM – 8:00 PM",  icon: "🌙" },
              ].map((m) => (
                <div key={m.meal} style={{ background: "#BAE6FD", borderRadius: "8px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.2rem" }}>{m.icon}</span>
                    <span style={{ fontWeight: "700", color: "#0C4A6E" }}>{m.meal}</span>
                  </div>
                  <span style={{ color: "#0369A1", fontSize: "0.875rem", fontWeight: "500" }}>{m.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div style={{ background: "#7DD3FC", borderRadius: "14px", padding: "20px", border: "1px solid rgba(14,165,233,0.25)" }}>
            <h3 style={{ color: "#0C4A6E", margin: "0 0 10px", fontWeight: "700", fontSize: "0.95rem" }}>📋 Cafeteria Rules</h3>
            <ul style={{ color: "#0369A1", fontSize: "0.875rem", margin: 0, paddingLeft: "1.25rem", lineHeight: "1.9" }}>
              <li>Present your student ID card at every meal</li>
              <li>Meals are only valid for the registered student</li>
              <li>No food is allowed to be taken outside the cafeteria</li>
              <li>Maintain cleanliness and respect cafeteria staff</li>
              <li>Report any issues to the cafeteria management</li>
            </ul>
          </div>
        </div>
      )}

      {/* Non-cafe student (from profile) */}
      {isNonCafe && (
        <div style={{ background: "#7DD3FC", borderRadius: "14px", padding: "28px", border: "1px solid rgba(14,165,233,0.25)", textAlign: "center" }}>
          <p style={{ fontSize: "3rem", margin: "0 0 0.75rem" }}>🏠</p>
          <h3 style={{ color: "#0C4A6E", margin: "0 0 8px", fontWeight: "800" }}>Non-Cafe Student</h3>
          <p style={{ color: "#0369A1", margin: "0 0 1.5rem", fontSize: "0.875rem", lineHeight: "1.6" }}>
            You are registered as a <strong>Non-Cafe</strong> student.<br />
            You are responsible for your own meals and are not enrolled in the university cafeteria meal plan.
          </p>
          <div style={{ background: "#BAE6FD", borderRadius: "10px", padding: "14px 18px", display: "inline-block", textAlign: "left" }}>
            <p style={{ color: "#0C4A6E", fontWeight: "700", margin: "0 0 6px", fontSize: "0.85rem" }}>ℹ️ Note</p>
            <p style={{ color: "#0369A1", margin: 0, fontSize: "0.82rem", lineHeight: "1.6" }}>
              If you wish to enroll in the cafeteria meal plan, please contact the Student Affairs office or the admin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
