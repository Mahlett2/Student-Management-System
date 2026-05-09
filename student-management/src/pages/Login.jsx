import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../data/adminStore";
import { apiPost, saveTokens } from "../api/client";
import { validatePassword, passwordStrength, validateStudentId, formatStudentIdInput } from "../utils/validators";
import "../styles/login.css";

const ROLES = [
  { id: "admin",   label: "Admin",   icon: "🛡️" },
  { id: "student", label: "Student", icon: "🎓" },
  { id: "teacher", label: "Teacher", icon: "👨‍🏫" },
];

const HINTS = {
  admin:   "Username: admin  |  Password: Admin@123!",
  student: "Username: firstname.fathername  |  Password: Student ID (e.g. WOUR/1234/20)",
  teacher: "Username: firstname.fathername  |  Password: (password set by admin)",
};

export default function Login() {
  const [role, setRole] = useState("admin");
  const [username, setUsername] = useState("");
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
    setUsername(""); setPassword("");
  };

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = "Username is required";
    if (!password.trim()) e.password = "Password is required";
    return e;
  };

  const handleLogin = async () => {
    setLoginError("");
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setLoading(true);
    try {
      // All roles use the same login endpoint — the backend returns the role
      const data = await apiPost("/auth/login/", { username, password }, { auth: false });

      if (!data) {
        setLoginError("No response from server. Is the backend running?");
        return;
      }

      // Verify the role matches what the user selected
      if (data.user.role !== role) {
        setLoginError(`This account is a ${data.user.role}, not a ${role}. Please select the correct role.`);
        return;
      }

      // Save tokens
      saveTokens({ access: data.access, refresh: data.refresh });

      // Save user to context + localStorage
      const user = { ...data.user, fullName: data.user.full_name };
      localStorage.setItem("current_user", JSON.stringify(user));
      localStorage.setItem("role", user.role);
      sessionStorage.setItem("auth", "true");

      // Store teacher/student profile for portal pages (legacy support)
      if (user.role === "teacher") {
        localStorage.setItem("teacher", JSON.stringify({
          name: user.full_name,
          email: user.email,
          department: "",   // will be loaded from /api/teachers/me/
        }));
      }
      if (user.role === "student") {
        localStorage.setItem("student", JSON.stringify({
          name: user.full_name,
          email: user.email,
        }));
      }

      // Also call the store's login to update React context
      await login(username, password);

      // Navigate based on role
      if (user.role === "admin")   navigate("/");
      if (user.role === "teacher") navigate("/teacher-portal");
      if (user.role === "student") navigate("/student-portal");

    } catch (err) {
      if (err.isBackendDown) {
        setLoginError("Backend server is not running. Start it with: python manage.py runserver 8000");
      } else if (err.status === 400 || err.status === 401) {
        setLoginError("Invalid username or password.");
      } else {
        setLoginError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
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
                value={username}
                onChange={(e) => { setUsername(e.target.value); setErrors((er) => ({ ...er, username: undefined })); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{ borderColor: errors.username ? "#EF4444" : undefined }} />
              {errors.username && <p className="field-error">{errors.username}</p>}
            </div>

            {/* Password */}
            <div className="input-group">
              <label>Password</label>
              <div style={{ position: "relative", width: "100%" }}>
                <input type={showPass ? "text" : "password"} placeholder="Enter password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((er) => ({ ...er, password: undefined })); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  style={{ borderColor: errors.password ? "#EF4444" : undefined, paddingRight: "42px", width: "100%", boxSizing: "border-box" }} />
                <button type="button" onClick={() => setShowPass((s) => !s)}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#0369A1", fontSize: "1rem" }}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
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
