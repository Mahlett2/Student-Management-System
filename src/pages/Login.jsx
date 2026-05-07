import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../data/adminStore";
import { studentsDB } from "../data/studentsDB";
import { validatePassword, passwordStrength, validateStudentId, formatStudentIdInput } from "../utils/validators";
import "../styles/login.css";

const ROLES = [
  { id: "admin",   label: "Admin",   icon: "🛡️" },
  { id: "student", label: "Student", icon: "🎓" },
  { id: "teacher", label: "Teacher", icon: "👨‍🏫" },
];

const TEACHERS_DB = [
  { id: 1, username: "teacher1", password: "Teach@123!", name: "Dr. Abebe Kebede", department: "Computer Science" },
  { id: 2, username: "teacher2", password: "Teach@456!", name: "Dr. Sara Ahmed",   department: "Software Engineering" },
];

const HINTS = {
  admin:   "Username: admin  |  Password: Admin@123!",
  student: "Username: john  |  ID: WOUR/1234/15  |  Password: John@1234",
  teacher: "Username: teacher1  |  Password: Teach@123!",
};

export default function Login() {
  const [role, setRole] = useState("admin");
  const [username, setUsername] = useState("");
  const [studentId, setStudentId] = useState("WOUR/");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAdmin();
  const navigate = useNavigate();

  const strength = passwordStrength(password);

  const reset = () => {
    setErrors({}); setLoginError("");
    setUsername(""); setPassword(""); setStudentId("WOUR/");
  };

  const handleStudentIdChange = (e) => {
    const formatted = formatStudentIdInput(e.target.value);
    setStudentId(formatted);
    setErrors((er) => ({ ...er, studentId: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = "Username is required";
    if (role === "student") {
      const idErr = validateStudentId(studentId);
      if (idErr) e.studentId = idErr;
    }
    const passErr = validatePassword(password);
    if (passErr) e.password = passErr;
    return e;
  };

  const handleLogin = () => {
    setLoginError("");
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (role === "admin") {
        const ok = login(username, password);
        if (ok) { sessionStorage.setItem("auth", "true"); localStorage.setItem("role", "admin"); navigate("/"); }
        else setLoginError("Invalid admin credentials or account inactive.");
      } else if (role === "student") {
        const s = studentsDB.find(
          (s) => s.username === username && s.studentId === studentId.trim() && s.password === password
        );
        if (s) { sessionStorage.setItem("auth", "true"); localStorage.setItem("role", "student"); localStorage.setItem("student", JSON.stringify(s)); navigate("/student-portal"); }
        else setLoginError("Invalid username, Student ID, or password.");
      } else {
        const t = TEACHERS_DB.find((t) => t.username === username && t.password === password);
        if (t) { sessionStorage.setItem("auth", "true"); localStorage.setItem("role", "teacher"); localStorage.setItem("teacher", JSON.stringify(t)); navigate("/teacher-portal"); }
        else setLoginError("Invalid teacher credentials.");
      }
    }, 400);
  };

  return (
    <div className="login-page">
      {/* Left branding panel */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-logo">🎓</div>
          <h1>Wollo University</h1>
          <p>Kombolcha Campus</p>
          <div className="login-divider" />
          <div className="login-features">
            <div className="login-feature">📊 Academic Management</div>
            <div className="login-feature">👥 Student &amp; Staff Portal</div>
            <div className="login-feature">📋 Results &amp; Attendance</div>
            <div className="login-feature">📢 Announcements</div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-right">
        <div className="login-box">
          <h2>Welcome Back</h2>
          <p>Sign in to your portal</p>

          {/* Role tabs */}
          <div className="role-tabs">
            {ROLES.map((r) => (
              <button key={r.id} onClick={() => { setRole(r.id); reset(); }}
                className={`role-tab ${role === r.id ? "active" : ""}`}>
                <span>{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>

          <div className="login-form">
            {/* Username */}
            <div className="input-group">
              <label>Username</label>
              <input type="text" placeholder={`Enter ${role} username`}
                value={username} onChange={(e) => { setUsername(e.target.value); setErrors((er) => ({ ...er, username: undefined })); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{ borderColor: errors.username ? "#EF4444" : undefined }} />
              {errors.username && <p className="field-error">{errors.username}</p>}
            </div>

            {/* Student ID */}
            {role === "student" && (
              <div className="input-group">
                <label>Student ID</label>
                <input type="text" placeholder="WOUR/XXXX/YY"
                  value={studentId} onChange={handleStudentIdChange}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  maxLength={12}
                  style={{ borderColor: errors.studentId ? "#EF4444" : undefined, fontFamily: "monospace", letterSpacing: "1px" }} />
                {errors.studentId
                  ? <p className="field-error">{errors.studentId}</p>
                  : <p className="field-hint">Format: WOUR/1234/15</p>}
              </div>
            )}

            {/* Password */}
            <div className="input-group">
              <label>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} placeholder="Enter strong password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((er) => ({ ...er, password: undefined })); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  style={{ borderColor: errors.password ? "#EF4444" : undefined, paddingRight: "42px" }} />
                <button type="button" onClick={() => setShowPass((s) => !s)}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#0369A1", fontSize: "1rem" }}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
              {/* Strength meter */}
              {password && (
                <div style={{ marginTop: "6px" }}>
                  <div style={{ display: "flex", gap: "3px", marginBottom: "3px" }}>
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} style={{ flex: 1, height: "4px", borderRadius: "99px", background: i <= strength.score ? strength.color : "rgba(14,165,233,0.2)", transition: "background 0.2s" }} />
                    ))}
                  </div>
                  {strength.label && <p style={{ fontSize: "0.72rem", color: strength.color, margin: 0, fontWeight: "600" }}>{strength.label}</p>}
                </div>
              )}
              {errors.password && <p className="field-error">{errors.password}</p>}
              {!errors.password && (
                <p className="field-hint">Min 8 chars · Uppercase · Lowercase · Number · Special char</p>
              )}
            </div>

            {loginError && <div className="login-error">⚠️ {loginError}</div>}

            <button className="login-btn" onClick={handleLogin} disabled={loading}>
              {loading ? "Signing in..." : `Sign in as ${ROLES.find((r2) => r2.id === role)?.label}`}
            </button>

            <p className="hint">{HINTS[role]}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
