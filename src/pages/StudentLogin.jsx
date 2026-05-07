import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentsDB } from "../data/studentsDB";
import "../styles/login.css";

export default function StudentLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = () => {
    const student = studentsDB.find(
      (s) => s.username === username && s.password === password,
    );

    if (student) {
      // 🔐 SAVE LOGIN STATE (VERY IMPORTANT)
      localStorage.setItem("auth", "true");
      localStorage.setItem("student", JSON.stringify(student));

      // 🚀 redirect to student portal
      navigate("/student-portal");
    } else {
      alert("Invalid username or password");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Student Login</h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={login}>Login</button>

        <p className="hint">Demo: john / 1234 OR jane / 5678</p>
      </div>
    </div>
  );
}
