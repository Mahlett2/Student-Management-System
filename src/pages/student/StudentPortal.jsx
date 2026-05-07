import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useResults } from "../../data/resultsStore";
import { useAddDrop } from "../../data/addDropStore";
import { useAnnouncements } from "../../data/announcementsStore";
import { useSettings } from "../../data/settingsStore";
import StudentGrades from "./Grades";
import AddDrop from "./AddDrop";
import AnnouncementPage from "../Announcement";
import Profile from "./Profile";
import Attendance from "./Attendance";
import Register from "./Register";
import Timetable from "./Timetable";
import ChangePassword from "./ChangePassword";
import MealPlan from "./MealPlan";
import { apiGet, clearTokens } from "../../api/client";

const NAV = [
  { id: "home",           icon: "🏠", label: "Dashboard" },
  { id: "profile",        icon: "👤", label: "My Profile" },
  { id: "grades",         icon: "📊", label: "My Grades" },
  { id: "attendance",     icon: "📅", label: "My Attendance" },
  { id: "timetable",      icon: "🗓️", label: "My Timetable" },
  { id: "register",       icon: "📚", label: "Course Registration" },
  { id: "adddrop",        icon: "📋", label: "Add / Drop" },
  { id: "announcements",  icon: "📢", label: "Announcements" },
  { id: "mealplan",       icon: "🍽️", label: "Meal Plan" },
  { id: "changepassword", icon: "🔒", label: "Change Password" },
];

export default function StudentPortal() {
  const [page, setPage] = useState("home");
  const [student, setStudent] = useState(() => {
    const stored = localStorage.getItem("student");
    return stored ? JSON.parse(stored) : {};
  });
  const navigate = useNavigate();
  const { results } = useResults();
  const { requests } = useAddDrop();
  const { announcements } = useAnnouncements();
  const { settings } = useSettings();
  const [attendanceRate, setAttendanceRate] = useState(null);

  // Load student profile from API on mount
  useEffect(() => {
    apiGet("/students/me/")
      .then((data) => {
        if (data) {
          const profile = {
            name:       data.full_name ?? data.name ?? "",
            studentId:  data.student_id ?? data.studentId ?? "",
            department: data.department_name ?? data.department ?? "",
            year:       data.year ?? "",
            semester:   data.semester ?? "",
            email:      data.email ?? "",
            id:         data.id,
          };
          setStudent(profile);
          localStorage.setItem("student", JSON.stringify(profile));
        }
      })
      .catch(() => {});
  }, []);

  // Load attendance rate from API
  useEffect(() => {
    apiGet("/attendance/sessions/")
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        const myName = student.name?.toLowerCase() || "";
        let total = 0, present = 0;
        list.forEach((sess) => {
          const rec = (sess.records || []).find(
            (r) => (r.student_name || r.studentName || "").toLowerCase() === myName
          );
          if (rec) { total++; if (rec.status === "Present") present++; }
        });
        setAttendanceRate(total > 0 ? Math.round((present / total) * 100) : null);
      })
      .catch(() => {});
  }, [student.name]);

  const logout = () => {
    clearTokens();
    sessionStorage.removeItem("auth");
    localStorage.removeItem("role");
    localStorage.removeItem("student");
    localStorage.removeItem("current_user");
    navigate("/login");
  };

  // My grades
  const myGrades = results.filter(
    (r) => r.studentName?.toLowerCase() === student.name?.toLowerCase()
  );

  // GPA calc (numeric grades only)
  const numericGrades = myGrades.filter((g) => !isNaN(Number(g.grade)));
  const gpa = numericGrades.length > 0
    ? (numericGrades.reduce((s, g) => s + Number(g.grade), 0) / numericGrades.length).toFixed(1)
    : "—";

  // Pending add/drop
  const pendingRequests = requests.filter(
    (r) => r.studentName === student.name && r.status === "Pending"
  ).length;

  // Unread announcements (visible to students)
  const myAnnouncements = announcements.filter(
    (a) => a.audience === "All" || a.audience === "Students Only"
  ).length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#BAE6FD", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>

      {/* SIDEBAR */}
      <div style={{
        width: "230px", minHeight: "100vh", position: "fixed", left: 0, top: 0,
        background: "linear-gradient(180deg,#0B1120,#0F172A)",
        display: "flex", flexDirection: "column",
        borderRight: "1px solid rgba(56,189,248,0.1)",
        boxShadow: "4px 0 20px rgba(0,0,0,0.4)", zIndex: 100,
        overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid rgba(56,189,248,0.1)", marginBottom: "8px" }}>
          <p style={{ color: "#E0F2FE", fontWeight: "700", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>
            Wollo University<br />
            <span style={{ color: "#38BDF8", fontWeight: "400", fontSize: "11px" }}>Student Portal</span>
          </p>
        </div>

        {/* Nav */}
        {NAV.map((n) => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "9px 16px", margin: "1px 6px", border: "none",
            borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem", fontWeight: "500",
            background: page === n.id ? "linear-gradient(135deg,#0F172A,#1E293B)" : "transparent",
            color: page === n.id ? "#38BDF8" : "#94A3B8",
            textAlign: "left", transition: "all 0.18s",
            boxShadow: page === n.id ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
          }}>
            <span>{n.icon}</span><span>{n.label}</span>
          </button>
        ))}

        <div style={{ height: "1px", background: "rgba(56,189,248,0.08)", margin: "10px 16px" }} />

        {/* Student info */}
        <div style={{ padding: "10px 16px", marginBottom: "4px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#0EA5E9,#38BDF8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: "#0C4A6E", fontSize: "1rem", marginBottom: "8px" }}>
            {student.name?.charAt(0).toUpperCase()}
          </div>
          <p style={{ color: "#E0F2FE", fontWeight: "600", fontSize: "0.82rem", margin: 0 }}>{student.name}</p>
          <p style={{ color: "#64748B", fontSize: "0.75rem", margin: "2px 0 0" }}>{student.studentId}</p>
        </div>

        <button onClick={logout} style={{
          margin: "auto 8px 16px", padding: "8px 14px", border: "none",
          borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600",
          background: "rgba(239,68,68,0.12)", color: "#FCA5A5",
          display: "flex", alignItems: "center", gap: "8px",
        }}>🚪 Logout</button>
      </div>

      {/* MAIN */}
      <div style={{ marginLeft: "230px", padding: "24px 28px", flex: 1 }}>

        {/* ── HOME DASHBOARD ── */}
        {page === "home" && (
          <div>
            {/* Welcome banner */}
            <div style={{
              background: "linear-gradient(135deg,#0F172A,#1E293B)",
              borderRadius: "16px", padding: "24px 28px", marginBottom: "20px",
              border: "1px solid rgba(56,189,248,0.15)",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem",
            }}>
              <div>
                <h1 style={{ color: "#E0F2FE", margin: "0 0 6px", fontSize: "1.5rem", fontWeight: "800" }}>
                  Welcome back, {student.name?.split(" ")[0]} 👋
                </h1>
                <p style={{ color: "#64748B", margin: 0, fontSize: "0.875rem" }}>
                  {settings.academicYear} · {settings.currentSemester || student.semester}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: "#38BDF8", fontWeight: "700", margin: 0, fontSize: "0.875rem" }}>{student.department}</p>
                <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.82rem" }}>{student.year}</p>
              </div>
            </div>

            {/* Info cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "14px", marginBottom: "20px" }}>
              {[
                { label: "Student ID", value: student.studentId, icon: "🪪", color: "#0EA5E9" },
                { label: "Department", value: student.department, icon: "🏛️", color: "#6366F1" },
                { label: "Year", value: student.year, icon: "📅", color: "#10B981" },
                { label: "Semester", value: student.semester, icon: "🗓️", color: "#F59E0B" },
              ].map((c) => (
                <div key={c.label} style={{
                  background: "#7DD3FC", borderRadius: "12px", padding: "16px",
                  border: "1px solid rgba(14,165,233,0.25)",
                  display: "flex", alignItems: "center", gap: "14px",
                }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: `${c.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>
                    {c.icon}
                  </div>
                  <div>
                    <p style={{ color: "#0369A1", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px", margin: 0 }}>{c.label}</p>
                    <p style={{ color: "#0C4A6E", fontWeight: "700", margin: "3px 0 0", fontSize: "0.9rem" }}>{c.value || "—"}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick summary stats */}
            <h3 style={{ color: "#0C4A6E", margin: "0 0 12px", fontSize: "0.95rem", fontWeight: "700" }}>Quick Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "GPA / Avg Score", value: gpa, icon: "📊", bg: "linear-gradient(135deg,#0F172A,#1E293B)", val: "#38BDF8" },
                { label: "Attendance Rate", value: attendanceRate !== null ? `${attendanceRate}%` : "—", icon: "✅", bg: attendanceRate !== null && attendanceRate < 75 ? "linear-gradient(135deg,#7F1D1D,#991B1B)" : "linear-gradient(135deg,#0F172A,#1E293B)", val: attendanceRate !== null && attendanceRate < 75 ? "#FCA5A5" : "#38BDF8" },
                { label: "Pending Requests", value: pendingRequests, icon: "⏳", bg: "linear-gradient(135deg,#0F172A,#1E293B)", val: pendingRequests > 0 ? "#FCD34D" : "#38BDF8" },
                { label: "Announcements", value: myAnnouncements, icon: "📢", bg: "linear-gradient(135deg,#0F172A,#1E293B)", val: "#38BDF8" },
              ].map((s) => (
                <div key={s.label} style={{
                  background: s.bg, borderRadius: "12px", padding: "16px 14px",
                  border: "1px solid rgba(56,189,248,0.15)", textAlign: "center",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "6px" }}>{s.icon}</div>
                  <p style={{ color: s.val, fontWeight: "800", fontSize: "1.4rem", margin: "0 0 4px" }}>{s.value}</p>
                  <p style={{ color: "#64748B", fontSize: "0.72rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.4px", margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Recent grades */}
            <div style={{ background: "#7DD3FC", borderRadius: "14px", padding: "18px", border: "1px solid rgba(14,165,233,0.25)", marginBottom: "16px" }}>
              <h3 style={{ color: "#0C4A6E", margin: "0 0 12px", fontSize: "0.9rem", fontWeight: "700" }}>📊 Recent Grades</h3>
              {myGrades.length === 0 ? (
                <p style={{ color: "#0369A1", fontSize: "0.875rem" }}>No grades uploaded yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {myGrades.slice(0, 4).map((g) => (
                    <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#BAE6FD", borderRadius: "8px", padding: "10px 14px" }}>
                      <div>
                        <p style={{ fontWeight: "600", color: "#0C4A6E", margin: 0, fontSize: "0.875rem" }}>{g.subject}</p>
                        <p style={{ color: "#0369A1", fontSize: "0.75rem", margin: "2px 0 0" }}>{g.period}</p>
                      </div>
                      <span style={{ fontWeight: "800", color: "#0C4A6E", fontSize: "1rem" }}>{g.grade}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
              {[
                { label: "View All Grades", icon: "📊", page: "grades" },
                { label: "Add / Drop Course", icon: "📋", page: "adddrop" },
                { label: "Announcements", icon: "📢", page: "announcements" },
              ].map((a) => (
                <button key={a.page} onClick={() => setPage(a.page)} style={{
                  padding: "14px", background: "linear-gradient(135deg,#0F172A,#1E293B)",
                  border: "1px solid rgba(56,189,248,0.2)", borderRadius: "12px",
                  color: "#38BDF8", fontWeight: "600", fontSize: "0.855rem",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  transition: "all 0.2s",
                }}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {page === "grades" && <StudentGrades />}
        {page === "profile" && <Profile />}
        {page === "attendance" && <Attendance />}
        {page === "timetable" && <Timetable />}
        {page === "register" && <Register />}
        {page === "adddrop" && <AddDrop />}
        {page === "announcements" && <AnnouncementPage role="student" />}
        {page === "mealplan" && <MealPlan />}
        {page === "changepassword" && <ChangePassword />}
      </div>
    </div>
  );
}
