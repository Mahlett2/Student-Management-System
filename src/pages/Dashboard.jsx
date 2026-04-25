import { Link } from "react-router-dom";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [activeChart, setActiveChart] = useState(null);

  // MAIN STATS
  const stats = [
    { name: "Students", value: 1200 },
    { name: "Teachers", value: 85 },
    { name: "Classes", value: 40 },
    { name: "Subjects", value: 18 },
  ];

  // ANALYTICS DATA
  const analytics = [
    { name: "Attendance", value: 92 },
    { name: "Pass Rate", value: 87 },
    { name: "Fail Rate", value: 13 },
    { name: "Revenue", value: 65 },
  ];

  const COLORS = ["#a78bfa", "#c4b5fd", "#8b5cf6", "#ddd6fe"];

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <h2 className="logo">University System</h2>

        <Link to="/" className="nav-link">
          Dashboard
        </Link>
        <Link to="/students" className="nav-link">
          Students
        </Link>
        <Link to="/teachers" className="nav-link">
          Teachers
        </Link>
        <Link to="/classes" className="nav-link">
          Classes
        </Link>
        <Link to="/subjects" className="nav-link">
          Subjects
        </Link>
        <Link to="/results" className="nav-link">
          Results
        </Link>
        <Link to="/events" className="nav-link">
          Events
        </Link>
        <Link to="/announcements" className="nav-link">
          Announcements
        </Link>

        <div className="divider"></div>

        <Link to="/profile" className="nav-link">
          Profile
        </Link>
        <Link to="/settings" className="nav-link">
          Settings
        </Link>
        <Link to="/logout" className="nav-link">
          Logout
        </Link>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <h1 className="title">Dashboard Overview</h1>

        {/* STATS */}
        <div className="stats-grid">
          {stats.map((item, index) => (
            <div
              key={index}
              className="stat-card"
              onClick={() => setActiveChart(item.name)}
            >
              <h2>{item.value}</h2>
              <p>{item.name}</p>
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div className="section">
          <h2>🔥 Quick Actions</h2>
          <div className="action-grid">
            <div className="action-card">➕ Add Student</div>
            <div className="action-card">👨‍🏫 Add Teacher</div>
            <div className="action-card">📤 Upload Results</div>
          </div>
        </div>

        {/* EVENTS */}
        <div className="section">
          <h2>📅 Events</h2>
          <ul className="list">
            <li>📌 Midterm Exams - Next Week</li>
            <li>🎓 Graduation Ceremony</li>
            <li>📢 Parent Meeting</li>
          </ul>
        </div>

        {/* NOTIFICATIONS */}
        <div className="section">
          <h2>📌 Notifications</h2>
          <ul className="list">
            <li>🆕 25 new student registrations</li>
            <li>📢 New announcement posted</li>
            <li>⚠️ System update scheduled</li>
          </ul>
        </div>

        {/* ANALYTICS */}
        <div className="section">
          <h2>📈 Advanced Analytics</h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#a78bfa" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CHART ON CLICK */}
        <div className="section">
          <h2>📊 Detailed View</h2>

          {!activeChart && <p>Click a stat box to view details</p>}

          {activeChart === "Students" && (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats} dataKey="value" outerRadius={100} label>
                  {stats.map((_, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
