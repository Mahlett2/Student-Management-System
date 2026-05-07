import { useState } from "react";
import { validatePassword, passwordStrength } from "../../utils/validators";
import { studentsDB } from "../../data/studentsDB";

export default function ChangePassword() {
  const stored = localStorage.getItem("student");
  const student = stored ? JSON.parse(stored) : {};

  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const strength = passwordStrength(newPass);

  const validate = () => {
    const e = {};
    if (!current) e.current = "Current password is required";
    else {
      // Check against stored password
      const storedPass = student.password;
      if (current !== storedPass) e.current = "Current password is incorrect";
    }
    const passErr = validatePassword(newPass);
    if (passErr) e.newPass = passErr;
    else if (newPass === current) e.newPass = "New password must be different from current password";
    if (!confirm) e.confirm = "Please confirm your new password";
    else if (confirm !== newPass) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = () => {
    setSuccess(false);
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    // Update in localStorage
    const updated = { ...student, password: newPass };
    localStorage.setItem("student", JSON.stringify(updated));

    // Update in studentsDB array in memory (for current session)
    const idx = studentsDB.findIndex((s) => s.id === student.id);
    if (idx !== -1) studentsDB[idx].password = newPass;

    // Also update in students_admin localStorage if exists
    const adminStudents = JSON.parse(localStorage.getItem("students_admin") || "[]");
    const adminIdx = adminStudents.findIndex((s) => s.studentId === student.studentId);
    if (adminIdx !== -1) {
      adminStudents[adminIdx].password = newPass;
      localStorage.setItem("students_admin", JSON.stringify(adminStudents));
    }

    setCurrent(""); setNewPass(""); setConfirm(""); setErrors({});
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
  };

  const Field = ({ label, value, onChange, show, onToggle, error, placeholder }) => (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={lbl}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => { onChange(e.target.value); setErrors((er) => ({ ...er })); }}
          placeholder={placeholder}
          style={{ ...inp, borderColor: error ? "#EF4444" : "rgba(14,165,233,0.35)", paddingRight: "42px" }}
        />
        <button type="button" onClick={onToggle} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "#0369A1" }}>
          {show ? "🙈" : "👁️"}
        </button>
      </div>
      {error && <p style={errStyle}>{error}</p>}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px" }}>
        <h2 style={{ color: "#E0F2FE", margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>🔒 Change Password</h2>
        <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.82rem" }}>
          {student.name} · {student.studentId}
        </p>
      </div>

      {success && (
        <div style={{ background: "#DCFCE7", color: "#15803D", padding: "12px 16px", borderRadius: "10px", marginBottom: "1.25rem", fontWeight: "600", fontSize: "0.875rem", border: "1px solid #86EFAC" }}>
          ✅ Password changed successfully! Use your new password next time you log in.
        </div>
      )}

      <div style={{ background: "#7DD3FC", borderRadius: "14px", padding: "28px", border: "1px solid rgba(14,165,233,0.25)", maxWidth: "480px" }}>
        <Field
          label="Current Password *"
          value={current}
          onChange={setCurrent}
          show={showCurrent}
          onToggle={() => setShowCurrent((s) => !s)}
          error={errors.current}
          placeholder="Enter your current password"
        />

        <Field
          label="New Password *"
          value={newPass}
          onChange={(v) => { setNewPass(v); setErrors((er) => ({ ...er, newPass: undefined })); }}
          show={showNew}
          onToggle={() => setShowNew((s) => !s)}
          error={errors.newPass}
          placeholder="Enter new strong password"
        />

        {/* Strength meter */}
        {newPass && (
          <div style={{ marginTop: "-0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", gap: "3px", marginBottom: "3px" }}>
              {[1,2,3,4,5].map((i) => (
                <div key={i} style={{ flex: 1, height: "5px", borderRadius: "99px", background: i <= strength.score ? strength.color : "rgba(14,165,233,0.2)", transition: "background 0.2s" }} />
              ))}
            </div>
            {strength.label && <p style={{ fontSize: "0.72rem", color: strength.color, margin: 0, fontWeight: "600" }}>{strength.label}</p>}
            <p style={{ fontSize: "0.7rem", color: "#0369A1", margin: "3px 0 0" }}>
              Min 8 chars · Uppercase · Lowercase · Number · Special character
            </p>
          </div>
        )}

        <Field
          label="Confirm New Password *"
          value={confirm}
          onChange={(v) => { setConfirm(v); setErrors((er) => ({ ...er, confirm: undefined })); }}
          show={showConfirm}
          onToggle={() => setShowConfirm((s) => !s)}
          error={errors.confirm}
          placeholder="Re-enter new password"
        />

        {/* Password match indicator */}
        {newPass && confirm && (
          <p style={{ fontSize: "0.78rem", margin: "-0.75rem 0 1rem", fontWeight: "600", color: newPass === confirm ? "#15803D" : "#DC2626" }}>
            {newPass === confirm ? "✅ Passwords match" : "❌ Passwords do not match"}
          </p>
        )}

        <button onClick={handleSubmit} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "0.9rem", boxShadow: "0 3px 12px rgba(0,0,0,0.2)" }}>
          🔒 Change Password
        </button>
      </div>

      {/* Security tips */}
      <div style={{ marginTop: "1.25rem", background: "#7DD3FC", borderRadius: "12px", padding: "14px 18px", border: "1px solid rgba(14,165,233,0.2)", maxWidth: "480px" }}>
        <p style={{ color: "#0C4A6E", fontWeight: "700", fontSize: "0.8rem", margin: "0 0 8px", textTransform: "uppercase" }}>🛡️ Password Tips</p>
        <ul style={{ color: "#0369A1", fontSize: "0.78rem", margin: 0, paddingLeft: "1.25rem", lineHeight: "1.8" }}>
          <li>Use at least 8 characters</li>
          <li>Mix uppercase and lowercase letters</li>
          <li>Include numbers and special characters (!@#$%)</li>
          <li>Don't reuse your old password</li>
          <li>Never share your password with anyone</li>
        </ul>
      </div>
    </div>
  );
}

const lbl = { display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#0C4A6E", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" };
const inp = { width: "100%", padding: "10px 13px", borderRadius: "8px", border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" };
const errStyle = { color: "#EF4444", fontSize: "0.72rem", margin: "3px 0 0" };
