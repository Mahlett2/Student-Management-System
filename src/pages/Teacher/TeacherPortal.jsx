import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherAttendance from "./TeacherAttendance";
import TeacherProfile from "./TeacherProfile";
import TeacherClasses from "./TeacherClasses";
import TeacherGrades from "./TeacherGrades";
import TeacherAttendanceHistory from "./TeacherAttendanceHistory";
import TeacherTimetable from "./TeacherTimetable";
import AnnouncementPage from "../Announcement";

const NAV = [
  { id: "home",          icon: "🏠", label: "Dashboard" },
  { id: "profile",       icon: "👤", label: "My Profile" },
  { id: "classes",       icon: "🏫", label: "My Classes" },
  { id: "timetable",     icon: "🗓️", label: "My Timetable" },
  { id: "grades",        icon: "📊", label: "Upload Grades" },
  { id: "attendance",    icon: "📅", label: "Mark Attendance" },
  { id: "history",       icon: "📋", label: "Attendance History" },
  { id: "announcements", icon: "📢", label: "Announcements" },
];

export default function TeacherPortal() {
  const [page, setPage] = useState("home");
  const navigate = useNavigate();

  const stored = localStorage.getItem("teacher");
  const teacher = stored ? JSON.parse(stored) : {};

  const logout = () => {
    sessionStorage.removeItem("auth");
    localStorage.removeItem("role");
    localStorage.removeItem("teacher");
    navigate("/login");
  };

  // ── Stats calculations ──
  const today = new Date().toISOString().split("T")[0];

  // All attendance sessions
  const allSessions = JSON.parse(localStorage.getItem("attendance_sessions") || "[]");

  // Sessions marked by this teacher (by department match)
  const mySessions = allSessions.filter(
    (s) => s.department === teacher.department
  );

  // Sessions marked today
  const todaySessions = mySessions.filter((s) => s.date === today);

  // Total unique students across all my sessions
  const studentSet = new Set();
  mySessions.forEach((s) => s.records.forEach((r) => studentSet.add(r.studentName)));
  const totalStudents = studentSet.size;

  // Students in my department from admin store
  const adminStudents = JSON.parse(localStorage.getItem("students_admin") || "[]");
  const myDeptStudents = adminStudents.filter((s) => s.department === teacher.department).length;

  // Pending grades — students in my dept who have no grade uploaded yet
  const results = JSON.parse(localStorage.getItem("results_data") || "[]");
  const gradedStudents = new Set(results.filter((r) => r.department === teacher.department).map((r) => r.studentName));
  const pendingGrades = myDeptStudents > 0
    ? Math.max(0, myDeptStudents - gradedStudents.size)
    : 0;

  // Recent sessions (last 5)
  const recentSessions = [...mySessions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const stats = [
    {
      label: "Students in My Dept",
      value: myDeptStudents || totalStudents,
      icon: "🎓",
      color: "#38BDF8",
      desc: teacher.department,
    },
    {
      label: "Sessions Today",
      value: todaySessions.length,
      icon: "📅",
      color: todaySessions.length > 0 ? "#10B981" : "#64748B",
      desc: today,
    },
    {
      label: "Total Sessions",
      value: mySessions.length,
      icon: "📋",
      color: "#A78BFA",
      desc: "All time",
    },
    {
      label: "Pending Grades",
      value: pendingGrades,
      icon: "⏳",
      color: pendingGrades > 0 ? "#F59E0B" : "#10B981",
      desc: pendingGrades > 0 ? "Need uploading" : "All up to date",
    },
  ];

  const sidebar = (
    <div style={{ width: "230px", minHeight: "100vh", position: "fixed", left: 0, top: 0, background: "linear-gradient(180deg,#0B1120,#0F172A)", display: "flex", flexDirection: "column", borderRight: "1px solid rgba(56,189,248,0.1)", boxShadow: "4px 0 20px rgba(0,0,0,0.4)", zIndex: 100, overflowY: "auto" }}>
      <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid rgba(56,189,248,0.1)", marginBottom: "8px" }}>
        <p style={{ color: "#E0F2FE", fontWeight: "700", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>
          Wollo University<br />
          <span style={{ color: "#38BDF8", fontWeight: "400", fontSize: "11px" }}>Teacher Portal</span>
        </p>
      </div>

      {NAV.map((n) => (
        <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 16px", margin: "1px 6px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem", fontWeight: "500", background: page === n.id ? "linear-gradient(135deg,#0F172A,#1E293B)" : "transparent", color: page === n.id ? "#38BDF8" : "#94A3B8", textAlign: "left", transition: "all 0.18s", boxShadow: page === n.id ? "0 2px 8px rgba(0,0,0,0.2)" : "none" }}>
          <span>{n.icon}</span><span>{n.label}</span>
        </button>
      ))}

      <div style={{ height: "1px", background: "rgba(56,189,248,0.08)", margin: "10px 16px" }} />

      <div style={{ padding: "10px 16px", marginBottom: "4px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#0EA5E9,#38BDF8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: "#0C4A6E", fontSize: "1rem", marginBottom: "8px" }}>
          {teacher.name?.charAt(0).toUpperCase() || "T"}
        </div>
        <p style={{ color: "#E0F2FE", fontWeight: "600", fontSize: "0.82rem", margin: 0 }}>{teacher.name || "Teacher"}</p>
        <p style={{ color: "#64748B", fontSize: "0.75rem", margin: "2px 0 0" }}>{teacher.department || ""}</p>
      </div>

      <button onClick={logout} style={{ margin: "auto 8px 16px", padding: "8px 14px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600", background: "rgba(239,68,68,0.12)", color: "#FCA5A5", display: "flex", alignItems: "center", gap: "8px" }}>
        🚪 Logout
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#BAE6FD", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      {sidebar}

      <div style={{ marginLeft: "230px", padding: "24px 28px", flex: 1 }}>

        {/* ── HOME DASHBOARD ── */}
        {page === "home" && (
          <div>
            {/* Welcome banner */}
            <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "16px", padding: "24px 28px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", border: "1px solid rgba(56,189,248,0.15)" }}>
              <div>
                <h1 style={{ color: "#E0F2FE", margin: "0 0 6px", fontSize: "1.4rem", fontWeight: "800" }}>
                  Welcome, {teacher.name?.split(" ")[0] || "Teacher"} 👋
                </h1>
                <p style={{ color: "#64748B", margin: 0, fontSize: "0.875rem" }}>
                  {teacher.department} · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: "#38BDF8", fontWeight: "700", margin: 0, fontSize: "0.875rem" }}>Teacher Portal</p>
                <p style={{ color: "#64748B", margin: "2px 0 0", fontSize: "0.78rem" }}>Wollo University</p>
              </div>
            </div>

            {/* Summary stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "20px" }}>
              {stats.map((s) => (
                <div key={s.label} style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "12px", padding: "18px 16px", border: "1px solid rgba(56,189,248,0.15)", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
                  <div style={{ fontSize: "1.6rem", marginBottom: "8px" }}>{s.icon}</div>
                  <p style={{ color: s.color, fontWeight: "800", fontSize: "1.8rem", margin: "0 0 4px", lineHeight: 1 }}>{s.value}</p>
                  <p style={{ color: "#E0F2FE", fontWeight: "600", fontSize: "0.8rem", margin: "0 0 3px" }}>{s.label}</p>
                  <p style={{ color: "#64748B", fontSize: "0.72rem", margin: 0 }}>{s.desc}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
              <button onClick={() => setPage("attendance")} style={{ padding: "20px", background: "linear-gradient(135deg,#0F172A,#1E293B)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "14px", color: "#38BDF8", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", transition: "all 0.2s" }}>
                <span style={{ fontSize: "1.8rem" }}>📅</span>
                <div style={{ textAlign: "left" }}>
                  <p style={{ margin: 0, fontWeight: "700" }}>Mark Attendance</p>
                  <p style={{ margin: "3px 0 0", fontSize: "0.78rem", color: "#64748B" }}>Select class and mark students</p>
                </div>
              </button>
              <div style={{ padding: "20px", background: "linear-gradient(135deg,#0F172A,#1E293B)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.8rem" }}>📊</span>
                <div>
                  <p style={{ margin: 0, fontWeight: "700", color: "#38BDF8" }}>Today's Sessions</p>
                  <p style={{ margin: "3px 0 0", fontSize: "0.78rem", color: "#64748B" }}>
                    {todaySessions.length === 0 ? "No sessions marked today" : `${todaySessions.length} session${todaySessions.length > 1 ? "s" : ""} marked`}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent attendance sessions */}
            <div style={{ background: "#7DD3FC", borderRadius: "14px", padding: "18px", border: "1px solid rgba(14,165,233,0.25)" }}>
              <h3 style={{ color: "#0C4A6E", margin: "0 0 14px", fontSize: "0.9rem", fontWeight: "700" }}>
                📋 Recent Attendance Sessions
              </h3>
              {recentSessions.length === 0 ? (
                <p style={{ color: "#0369A1", fontSize: "0.875rem", margin: 0 }}>No sessions marked yet. Click "Mark Attendance" to get started.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {recentSessions.map((s) => {
                    const present = s.records.filter((r) => r.status === "Present").length;
                    const total = s.records.length;
                    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
                    return (
                      <div key={s.id} style={{ background: "#BAE6FD", borderRadius: "10px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                          <p style={{ fontWeight: "700", color: "#0C4A6E", margin: 0, fontSize: "0.875rem" }}>{s.className}</p>
                          <p style={{ color: "#0369A1", fontSize: "0.78rem", margin: "2px 0 0" }}>{s.subject || s.department} · {s.date}</p>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <span style={{ color: "#15803D", fontSize: "0.78rem", fontWeight: "600" }}>✅ {present}/{total}</span>
                          <span style={{ background: rate >= 75 ? "#DCFCE7" : "#FEE2E2", color: rate >= 75 ? "#15803D" : "#DC2626", padding: "2px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" }}>
                            {rate}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {page === "attendance" && <TeacherAttendance />}
        {page === "profile" && <TeacherProfile />}
        {page === "classes" && <TeacherClasses />}
        {page === "grades" && <TeacherGrades />}
        {page === "history" && <TeacherAttendanceHistory />}
        {page === "timetable" && <TeacherTimetable />}
        {page === "announcements" && <AnnouncementPage role="teacher" />}
      </div>
    </div>
  );
}
