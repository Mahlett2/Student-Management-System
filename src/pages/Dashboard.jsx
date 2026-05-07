import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
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
  Legend,
  LineChart,
  Line,
} from "recharts";
import StudentManagement from "../components/StudentManagement";
import TeacherManagement from "../components/TeacherManagement";
import ResultsManagement from "../components/ResultsManagement";
import ClassesManagement from "../components/ClassesManagement";
import SubjectsManagement from "../components/SubjectsManagement";
import TimetableManagement from "../components/TimetableManagement";
import AttendanceManagement from "../components/AttendanceManagement";
import AnnouncementsManagement from "../components/AnnouncementsManagement";
import UserManagement from "../components/UserManagement";
import SettingsManagement from "../components/SettingsManagement";
import AddDropMonitor from "../components/AddDropMonitor";
import CafeteriaMonitor from "../components/CafeteriaMonitor";
import { useAdmin } from "../data/adminStore";
import { useSettings } from "../data/settingsStore";
import { apiGet } from "../api/client";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [page, setPage] = useState("dashboard");
  const { currentAdmin, logout, can } = useAdmin();
  const { settings } = useSettings();

  // Real counts from API
  const [counts, setCounts] = useState({
    students: "—",
    teachers: "—",
    classes:  "—",
    subjects: "—",
  });

  useEffect(() => {
    // Fetch all counts in parallel
    Promise.all([
      apiGet("/students/?page_size=1"),
      apiGet("/teachers/?page_size=1"),
      apiGet("/classes/?page_size=1"),
      apiGet("/subjects/?page_size=1"),
    ]).then(([students, teachers, classes, subjects]) => {
      setCounts({
        students: students?.count ?? (Array.isArray(students) ? students.length : "—"),
        teachers: teachers?.count ?? (Array.isArray(teachers) ? teachers.length : "—"),
        classes:  classes?.count  ?? (Array.isArray(classes)  ? classes.length  : "—"),
        subjects: subjects?.count ?? (Array.isArray(subjects) ? subjects.length : "—"),
      });
    }).catch(() => {});
  }, []);

  // MAIN STATS — now using real API counts
  const stats = [
    { label: "Total Students", value: counts.students, icon: "🎓" },
    { label: "Total Teachers", value: counts.teachers, icon: "👨‍🏫" },
    { label: "Classes",        value: counts.classes,  icon: "🏫" },
    { label: "Subjects",       value: counts.subjects, icon: "📚" },
  ];

  // ENROLLMENT TRENDS — per semester, split by faculty
  const enrollmentTrends = [
    { semester: "Sem 1 '23", Engineering: 310, Informatics: 280 },
    { semester: "Sem 2 '23", Engineering: 325, Informatics: 295 },
    { semester: "Sem 1 '24", Engineering: 340, Informatics: 310 },
    { semester: "Sem 2 '24", Engineering: 355, Informatics: 330 },
    { semester: "Sem 1 '25", Engineering: 370, Informatics: 350 },
  ];

  // PASS / FAIL RATES — per Informatics department
  const passFailData = [
    { dept: "Software", pass: 88, fail: 12 },
    { dept: "Comp. Sci", pass: 84, fail: 16 },
    { dept: "Info. Systems", pass: 79, fail: 21 },
    { dept: "Info. Tech", pass: 82, fail: 18 },
    { dept: "Engineering", pass: 76, fail: 24 },
  ];

  // PIE — overall pass/fail
  const overallPassFail = [
    { name: "Pass", value: 82 },
    { name: "Fail", value: 18 },
  ];
  const PIE_COLORS = ["#8b5cf6", "#f87171"];

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <h2 className="logo" style={{ fontSize: "16px", lineHeight: "1.4" }}>
          {settings.universityName}<br />
          <span style={{ fontSize: "13px", fontWeight: "400", opacity: 0.8 }}>{settings.campusName}</span>
        </h2>

        <span className="nav-link" style={{ cursor: "pointer" }} onClick={() => setPage("dashboard")}>🏠 Dashboard</span>
        <span className="nav-link" style={{ cursor: "pointer" }} onClick={() => setPage("student")}>🎓 Students</span>
        <span className="nav-link" style={{ cursor: "pointer" }} onClick={() => setPage("teacher")}>👨‍🏫 Teachers</span>

        <p style={{ fontSize: "0.72rem", color: "#7c3aed", textTransform: "uppercase", margin: "12px 0 4px 10px", fontWeight: "700" }}>Academic</p>
        <span className="nav-link" style={{ cursor: "pointer" }} onClick={() => setPage("classes")}>🏫 Classes</span>
        <span className="nav-link" style={{ cursor: "pointer" }} onClick={() => setPage("subjects")}>📚 Subjects</span>
        <span className="nav-link" style={{ cursor: "pointer" }} onClick={() => setPage("timetable")}>🗓️ Timetable</span>

        <p style={{ fontSize: "0.72rem", color: "#7c3aed", textTransform: "uppercase", margin: "12px 0 4px 10px", fontWeight: "700" }}>Records</p>
        <span className="nav-link" style={{ cursor: "pointer" }} onClick={() => setPage("results")}>📊 Results</span>
        <span className="nav-link" style={{ cursor: "pointer" }} onClick={() => setPage("attendance")}>📅 Attendance</span>
        <span className="nav-link" style={{ cursor: "pointer" }} onClick={() => setPage("adddrop")}>📋 Add/Drop Requests</span>
        <span className="nav-link" style={{ cursor: "pointer" }} onClick={() => setPage("cafeteria")}>🍽️ Cafeteria Requests</span>

        <p style={{ fontSize: "0.72rem", color: "#7c3aed", textTransform: "uppercase", margin: "12px 0 4px 10px", fontWeight: "700" }}>Communication</p>
        <span className="nav-link" style={{ cursor: "pointer" }} onClick={() => setPage("announcements")}>📢 Announcements</span>

        {can("users") && <>
          <p style={{ fontSize: "0.72rem", color: "#7c3aed", textTransform: "uppercase", margin: "12px 0 4px 10px", fontWeight: "700" }}>Admin</p>
          <span className="nav-link" style={{ cursor: "pointer" }} onClick={() => setPage("users")}>👥 User Management</span>
          <span className="nav-link" style={{ cursor: "pointer" }} onClick={() => setPage("settings")}>⚙️ Settings</span>
        </>}

        <div className="divider"></div>
        {currentAdmin && (
          <div style={{ padding: "8px 10px", fontSize: "0.82rem", color: "#5b21b6", marginBottom: "4px" }}>
            👤 {currentAdmin.fullName}<br />
            <span style={{ fontSize: "0.75rem", color: "#7c3aed" }}>{currentAdmin.role}</span>
          </div>
        )}
        <span className="nav-link" style={{ cursor: "pointer", color: "#dc2626" }} onClick={() => { logout(); sessionStorage.removeItem("auth"); localStorage.removeItem("role"); window.location.href = "/login"; }}>🚪 Logout</span>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        {/* ================= DASHBOARD VIEW ================= */}
        {page === "dashboard" && (
          <>
            <h1 className="title">Admin Dashboard — {settings.universityName}, {settings.campusName}</h1>

            {/* STAT CARDS */}
            <div className="stats-grid">
              {stats.map((item, i) => (
                <div key={i} className="stat-card">
                  <div style={{ fontSize: "1.6rem" }}>{item.icon}</div>
                  <h2>{item.value}</h2>
                  <p>{item.label}</p>
                </div>
              ))}
            </div>

            {/* ENROLLMENT TRENDS */}
            <div className="section">
              <h2>📈 Enrollment Trends by Faculty</h2>
              <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "1rem" }}>
                Students enrolled per semester — Engineering vs Informatics
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={enrollmentTrends}>
                  <XAxis dataKey="semester" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Engineering" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Informatics" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* PASS / FAIL RATES */}
            <div className="section">
              <h2>📊 Pass / Fail Rates by Department</h2>
              <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "1rem" }}>
                Current semester — percentage of students
              </p>
              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
                {/* Grouped bar chart */}
                <div style={{ flex: 2, minWidth: "300px" }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={passFailData} barCategoryGap="30%">
                      <XAxis dataKey="dept" tick={{ fontSize: 12 }} />
                      <YAxis unit="%" />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Legend />
                      <Bar dataKey="pass" name="Pass %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="fail" name="Fail %" fill="#f87171" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Overall pie */}
                <div style={{ flex: 1, minWidth: "200px", textAlign: "center" }}>
                  <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Overall</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={overallPassFail}
                        dataKey="value"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {overallPassFail.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="section">
              <h2>🔥 Quick Actions</h2>
              <div className="action-grid">
                <div className="action-card" onClick={() => setPage("student")}>➕ Add Student</div>
                <div className="action-card" onClick={() => setPage("teacher")}>👨‍🏫 Add Teacher</div>
                <div className="action-card" onClick={() => setPage("classes")}>🏫 Manage Classes</div>
                <div className="action-card" onClick={() => setPage("subjects")}>📚 Manage Subjects</div>
                <div className="action-card" onClick={() => setPage("timetable")}>🗓️ Timetable</div>
                <div className="action-card" onClick={() => setPage("results")}>📊 Results</div>
                <div className="action-card" onClick={() => setPage("attendance")}>📅 Attendance</div>
              </div>
            </div>

            {/* EVENTS */}
            <div className="section">
              <h2>📅 Upcoming Events</h2>
              <ul className="list">
                <li>📌 Midterm Exams — Next Week</li>
                <li>🎓 Graduation Ceremony — June 2025</li>
                <li>📢 Faculty Meeting — Friday</li>
              </ul>
            </div>

            {/* NOTIFICATIONS */}
            <div className="section">
              <h2>📌 Notifications</h2>
              <ul className="list">
                <li>🆕 25 new student registrations pending</li>
                <li>📢 New announcement posted</li>
                <li>⚠️ System maintenance scheduled Saturday</li>
              </ul>
            </div>
          </>
        )}

        {page === "student" && <StudentManagement goBack={() => setPage("dashboard")} />}
        {page === "teacher" && <TeacherManagement goBack={() => setPage("dashboard")} />}
        {page === "results" && <ResultsManagement goBack={() => setPage("dashboard")} />}
        {page === "classes" && <ClassesManagement goBack={() => setPage("dashboard")} />}
        {page === "subjects" && <SubjectsManagement goBack={() => setPage("dashboard")} />}
        {page === "timetable" && <TimetableManagement goBack={() => setPage("dashboard")} />}
        {page === "attendance" && <AttendanceManagement goBack={() => setPage("dashboard")} />}
        {page === "adddrop" && <AddDropMonitor goBack={() => setPage("dashboard")} />}
        {page === "cafeteria" && <CafeteriaMonitor goBack={() => setPage("dashboard")} />}
        {page === "announcements" && <AnnouncementsManagement goBack={() => setPage("dashboard")} />}
        {page === "users" && <UserManagement goBack={() => setPage("dashboard")} />}
        {page === "settings" && <SettingsManagement goBack={() => setPage("dashboard")} />}
      </div>
    </div>
  );
}
