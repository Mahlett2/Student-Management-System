import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username === "admin" && password === "1234") {
      localStorage.setItem("auth", "true");
      navigate("/");
    } else {
      alert("Invalid username or password");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>University System</h2>
        <p>Sign in to continue</p>

        <input
          type="text"
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>Login</button>

        <p className="hint">Hint: admin / 1234</p>
      </div>
    </div>
  );
}
