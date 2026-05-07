import { useState } from "react";
import { validatePassword, passwordStrength } from "../../utils/validators";

const DEPARTMENTS = [
  "Software Engineering", "Computer Science",
  "Information Systems", "Information Technology",
  "Civil Engineering", "Electrical Engineering",
  "Mechanical Engineering", "Chemical Engineering",
];

export default function TeacherProfile() {
  const stored = localStorage.getItem("teacher");
  const teacher = stored ? JSON.parse(stored) : {};
  const profileKey = `teacher_profile_${teacher.id || teacher.username}`;

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(profileKey);
    return saved ? JSON.parse(saved) : {
      email: teacher.email || "",
      phone: "",
      department: teacher.department || "",
      qualification: "",
      specialization: "",
      officeRoom: "",
      officeHours: "",
      address: "",
      gender: "",
      dob: "",
      joinDate: "",
    };
  });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  // Password change state
  const [showPassSection, setShowPassSection] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [passErrors, setPassErrors] = useState({});
  const [passSaved, setPassSaved] = useState(false);

  const strength = passwordStrength(newPass);

  const set = (k) => (e) => {
    setDraft((d) => ({ ...d, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!draft.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(draft.email)) e.email = "Invalid email";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setProfile(draft);
    localStorage.setItem(profileKey, JSON.stringify(draft));
    // Update teacher in localStorage
    const updated = { ...teacher, ...draft };
    localStorage.setItem("teacher", JSON.stringify(updated));
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePasswordChange = () => {
    const e = {};
    if (!currentPass) e.currentPass = "Current password is required";
    else if (currentPass !== teacher.password) e.currentPass = "Current password is incorrect";
    const passErr = validatePassword(newPass);
    if (passErr) e.newPass = passErr;
    else if (newPass === currentPass) e.newPass = "New password must differ from current";
    if (!confirmPass) e.confirmPass = "Please confirm new password";
    else if (confirmPass !== newPass) e.confirmPass = "Passwords do not match";
    if (Object.keys(e).length) { setPassErrors(e); return; }

    const updatedTeacher = { ...teacher, password: newPass };
    localStorage.setItem("teacher", JSON.stringify(updatedTeacher));
    setCurrentPass(""); setNewPass(""); setConfirmPass(""); setPassErrors({});
    setPassSaved(true);
    setTimeout(() => setPassSaved(false), 3000);
  };

  const data = editing ? draft : profile;

  const F = ({ label, k, type = "text", options, placeholder, required }) => (
    <div style={{ marginBottom: "1rem" }}>
      <label style={lbl}>{label}{required && <span style={{ color: "#EF4444" }}> *</span>}</label>
      {editing ? (
        options ? (
          <select style={{ ...inp, borderColor: errors[k] ? "#EF4444" : "rgba(14,165,233,0.35)" }} value={data[k]} onChange={set(k)}>
            <option value="">Select...</option>
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} style={{ ...inp, borderColor: errors[k] ? "#EF4444" : "rgba(14,165,233,0.35)" }} value={data[k]} onChange={set(k)} placeholder={placeholder || ""} />
        )
      ) : (
        <p style={val}>{data[k] || <span style={{ color: "#94A3B8", fontStyle: "italic" }}>Not provided</span>}</p>
      )}
      {editing && errors[k] && <p style={errStyle}>{errors[k]}</p>}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg,#0EA5E9,#38BDF8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.3rem", color: "#0C4A6E", flexShrink: 0 }}>
            {teacher.name?.charAt(0).toUpperCase() || "T"}
          </div>
          <div>
            <h2 style={{ color: "#E0F2FE", margin: 0, fontSize: "1.15rem", fontWeight: "800" }}>{teacher.name}</h2>
            <p style={{ color: "#38BDF8", margin: "3px 0 0", fontSize: "0.8rem" }}>{teacher.department}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {!editing ? (
            <button onClick={() => { setDraft(profile); setEditing(true); setErrors({}); }} style={editBtn}>✏️ Edit Profile</button>
          ) : (
            <>
              <button onClick={handleSave} style={saveBtn}>💾 Save</button>
              <button onClick={() => { setDraft(profile); setEditing(false); setErrors({}); }} style={cancelBtn}>Cancel</button>
            </>
          )}
        </div>
      </div>

      {saved && <div style={successBanner}>✅ Profile saved successfully!</div>}

      {/* Profile info */}
      <div style={{ background: "#7DD3FC", borderRadius: "14px", padding: "24px", border: "1px solid rgba(14,165,233,0.25)", marginBottom: "1.25rem" }}>
        <h3 style={{ color: "#0C4A6E", margin: "0 0 1.25rem", fontWeight: "700", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Personal Information</h3>

        {/* Read-only fields from login */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem", marginBottom: "1rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={lbl}>Full Name</label>
            <p style={{ ...val, background: "#BAE6FD", padding: "9px 12px", borderRadius: "8px" }}>{teacher.name}</p>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={lbl}>Username</label>
            <p style={{ ...val, background: "#BAE6FD", padding: "9px 12px", borderRadius: "8px", fontFamily: "monospace" }}>{teacher.username}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
          <F label="Email *" k="email" type="email" placeholder="teacher@wu.edu.et" required />
          <F label="Phone" k="phone" placeholder="+251 9xx xxx xxx" />
          <F label="Department" k="department" options={DEPARTMENTS} />
          <F label="Qualification" k="qualification" placeholder="e.g. PhD, MSc, BSc" />
          <F label="Specialization" k="specialization" placeholder="e.g. Machine Learning, Networks" />
          <F label="Office Room" k="officeRoom" placeholder="e.g. Room 204, Block B" />
          <F label="Office Hours" k="officeHours" placeholder="e.g. Mon-Wed 2:00-4:00 PM" />
          <F label="Gender" k="gender" options={["Male", "Female"]} />
          <F label="Date of Birth" k="dob" type="date" />
          <F label="Join Date" k="joinDate" type="date" />
          <div style={{ gridColumn: "1/-1" }}>
            <F label="Address" k="address" placeholder="City, Region" />
          </div>
        </div>

        {editing && (
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button onClick={handleSave} style={saveBtn}>💾 Save Profile</button>
            <button onClick={() => { setDraft(profile); setEditing(false); setErrors({}); }} style={cancelBtn}>Cancel</button>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div style={{ background: "#7DD3FC", borderRadius: "14px", padding: "20px 24px", border: "1px solid rgba(14,165,233,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showPassSection ? "1.25rem" : 0 }}>
          <h3 style={{ color: "#0C4A6E", margin: 0, fontWeight: "700", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>🔒 Change Password</h3>
          <button onClick={() => setShowPassSection((s) => !s)} style={{ padding: "6px 14px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.82rem" }}>
            {showPassSection ? "Hide" : "Change Password"}
          </button>
        </div>

        {passSaved && <div style={successBanner}>✅ Password changed successfully!</div>}

        {showPassSection && (
          <div style={{ maxWidth: "420px" }}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={lbl}>Current Password *</label>
              <input type="password" style={{ ...inp, borderColor: passErrors.currentPass ? "#EF4444" : "rgba(14,165,233,0.35)" }} value={currentPass} onChange={(e) => { setCurrentPass(e.target.value); setPassErrors((er) => ({ ...er, currentPass: undefined })); }} placeholder="Enter current password" />
              {passErrors.currentPass && <p style={errStyle}>{passErrors.currentPass}</p>}
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={lbl}>New Password *</label>
              <div style={{ position: "relative" }}>
                <input type={showNew ? "text" : "password"} style={{ ...inp, borderColor: passErrors.newPass ? "#EF4444" : "rgba(14,165,233,0.35)", paddingRight: "42px" }} value={newPass} onChange={(e) => { setNewPass(e.target.value); setPassErrors((er) => ({ ...er, newPass: undefined })); }} placeholder="Enter new strong password" />
                <button type="button" onClick={() => setShowNew((s) => !s)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}>
                  {showNew ? "🙈" : "👁️"}
                </button>
              </div>
              {newPass && (
                <div style={{ marginTop: "5px" }}>
                  <div style={{ display: "flex", gap: "3px", marginBottom: "2px" }}>
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} style={{ flex: 1, height: "4px", borderRadius: "99px", background: i <= strength.score ? strength.color : "rgba(14,165,233,0.2)" }} />
                    ))}
                  </div>
                  {strength.label && <p style={{ fontSize: "0.72rem", color: strength.color, margin: 0, fontWeight: "600" }}>{strength.label}</p>}
                </div>
              )}
              {passErrors.newPass && <p style={errStyle}>{passErrors.newPass}</p>}
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={lbl}>Confirm New Password *</label>
              <input type="password" style={{ ...inp, borderColor: passErrors.confirmPass ? "#EF4444" : "rgba(14,165,233,0.35)" }} value={confirmPass} onChange={(e) => { setConfirmPass(e.target.value); setPassErrors((er) => ({ ...er, confirmPass: undefined })); }} placeholder="Re-enter new password" />
              {newPass && confirmPass && (
                <p style={{ fontSize: "0.75rem", margin: "3px 0 0", fontWeight: "600", color: newPass === confirmPass ? "#15803D" : "#DC2626" }}>
                  {newPass === confirmPass ? "✅ Passwords match" : "❌ Passwords do not match"}
                </p>
              )}
              {passErrors.confirmPass && <p style={errStyle}>{passErrors.confirmPass}</p>}
            </div>
            <button onClick={handlePasswordChange} style={saveBtn}>🔒 Update Password</button>
          </div>
        )}
      </div>
    </div>
  );
}

const lbl = { display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#0C4A6E", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" };
const val = { color: "#0C4A6E", fontWeight: "500", margin: 0, fontSize: "0.875rem", padding: "8px 0" };
const inp = { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" };
const errStyle = { color: "#EF4444", fontSize: "0.72rem", margin: "3px 0 0" };
const saveBtn = { padding: "9px 18px", background: "linear-gradient(135deg,#0EA5E9,#38BDF8)", color: "#0C4A6E", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.875rem" };
const cancelBtn = { padding: "9px 18px", background: "rgba(239,68,68,0.12)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", cursor: "pointer", fontWeight: "600" };
const editBtn = { padding: "9px 18px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.875rem" };
const successBanner = { background: "#DCFCE7", color: "#15803D", padding: "10px 16px", borderRadius: "8px", marginBottom: "1rem", fontWeight: "600", fontSize: "0.875rem", border: "1px solid #86EFAC" };
