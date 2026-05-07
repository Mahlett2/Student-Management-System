import { useSettings } from "../../data/settingsStore";

export default function MealPlan() {
  const { settings } = useSettings();

  // Re-read from localStorage every render to get latest cafeteria choice
  const stored = localStorage.getItem("student");
  const student = stored ? JSON.parse(stored) : {};

  // Cafeteria status is set by the student during course registration
  const cafeStatus = student.cafeteria || null;

  const isCafe = cafeStatus === "Cafe";
  const isNonCafe = cafeStatus === "Non-Cafe";

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
        {cafeStatus && (
          <span style={{
            background: isCafe ? "#DCFCE7" : "#FEF9C3",
            color: isCafe ? "#15803D" : "#A16207",
            padding: "8px 18px", borderRadius: "20px", fontWeight: "800", fontSize: "0.9rem",
            border: `1px solid ${isCafe ? "#86EFAC" : "#FDE047"}`,
          }}>
            {isCafe ? "✅ Cafe Student" : "🏠 Non-Cafe Student"}
          </span>
        )}
      </div>

      {/* Status not set yet */}
      {!cafeStatus && (
        <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC", borderRadius: "14px", color: "#0369A1" }}>
          <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>🍽️</p>
          <p style={{ fontWeight: "600" }}>Cafeteria status not set yet.</p>
          <p style={{ fontSize: "0.85rem", opacity: 0.8, lineHeight: "1.6" }}>
            Go to <strong>Course Registration</strong> and register for this semester.<br />
            You will be asked to choose Cafe or Non-Cafe during registration.
          </p>
        </div>
      )}

      {/* Cafe student */}
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
                { label: "Meal Plan", value: "Full Board", color: "#1D4ED8", bg: "#DBEAFE" },
                { label: "Academic Year", value: settings.academicYear || "2024/2025", color: "#0C4A6E", bg: "#BAE6FD" },
                { label: "Semester", value: settings.currentSemester || student.semester, color: "#0C4A6E", bg: "#BAE6FD" },
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

      {/* Non-cafe student */}
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
