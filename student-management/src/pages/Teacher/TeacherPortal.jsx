import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TeacherAttendance from "./TeacherAttendance";
import TeacherProfile from "./TeacherProfile";
import TeacherClasses from "./TeacherClasses";
import TeacherGrades from "./TeacherGrades";
import TeacherAttendanceHistory from "./TeacherAttendanceHistory";
import TeacherTimetable from "./TeacherTimetable";
import AnnouncementPage from "../Announcement";
import { apiGet } from "../../api/client";
import { clearTokens } from "../../api/client";

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
  const [teacher, setTeacher] = useState(() => {
    const stored = localStorage.getItem("current_user");
    return stored ? JSON.parse(stored) : {};
  });
  const [deptStudentCount, setDeptStudentCount] = useState(0);
  const [recentSessions, setRecentSessions]     = useState([]);
  const [todaySessionCount, setTodaySessionCount] = useState(0);
  const [totalSessionCount, setTotalSessionCount] = useState(0);
  const navigate = useNavigate();

  // Load teacher profile from API on mount
  useEffect(() => {
    apiGet("/teachers/me/")
      .then((data) => {
        if (data) {
          const profile = {
            name:               data.full_name           ?? data.name          ?? "",
            full_name:          data.full_name           ?? "",
            department:         data.department_name     ?? data.department    ?? "",
            email:              data.email               ?? "",
            teacherId:          data.teacher_id          ?? "",
            subject:            data.assigned_subject    ?? data.subject       ?? "",
            assignedDepartment: data.assigned_department ?? "",
            assignedSection:    data.assigned_section    ?? "",
            assignedSubject:    data.assigned_subject    ?? "",
            assignedSemester:   data.assigned_semester   ?? "",
            assignedYear:       data.assigned_year       ?? "",
            id:                 data.id,
          };
          setTeacher(profile);
          localStorage.setItem("current_user", JSON.stringify({ ...JSON.parse(localStorage.getItem("current_user") || "{}"), ...profile }));
        }
      })
      .catch(() => {});
  }, []);

  // Load attendance sessions from API
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    apiGet("/attendance/sessions/")
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        const normalized = list.map((s) => ({
          ...s,
          className: s.class_name || s.className || "",
          records: (s.records || []).map((r) => ({
            studentName: r.student_name || r.studentName || "",
            status: r.status || "Present",
          })),
        }));
        setTotalSessionCount(normalized.length);
        setTodaySessionCount(normalized.filter((s) => s.date === today).length);
        setRecentSessions(
          [...normalized].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
        );
      })
      .catch(() => {});
  }, []);

  // Load student count for assigned class (dept + section + year)
  useEffect(() => {
    apiGet("/students/?page_size=1000")
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        const assignedDept    = teacher.assignedDepartment || teacher.department || "";
        const assignedSection = teacher.assignedSection    || "";
        const assignedYear    = teacher.assignedYear       || "";
        const filtered = list.filter((s) => {
          const dept = typeof s.department === "object" ? s.department?.name : s.department || "";
          const deptMatch = !assignedDept    || dept === assignedDept || assignedDept === "Fresh";
          const secMatch  = !assignedSection || s.section === assignedSection;
          const yearMatch = !assignedYear    || s.year    === assignedYear;
          return deptMatch && secMatch && yearMatch;
        });
        setDeptStudentCount(filtered.length);
      })
      .catch(() => {});
  }, [teacher.assignedDepartment, teacher.assignedSection, teacher.assignedYear, teacher.department]);

  const logout = () => {
    clearTokens();
    sessionStorage.removeItem("auth");
    localStorage.removeItem("role");
    localStorage.removeItem("current_user");
    navigate("/login");
  };

  const today = new Date().toISOString().split("T")[0];

  const stats = [
    {
      label: "Students in My Class",
      value: deptStudentCount,
      icon: "🎓",
      color: "#38BDF8",
      desc: `${teacher.assignedDepartment || teacher.department || "—"} · ${teacher.assignedSection || "—"}`,
    },
    {
      label: "Sessions Today",
      value: todaySessionCount,
      icon: "📅",
      color: todaySessionCount > 0 ? "#10B981" : "#64748B",
      desc: today,
    },
    {
      label: "Total Sessions",
      value: totalSessionCount,
      icon: "📋",
      color: "#A78BFA",
      desc: "All time",
    },
    {
      label: "Attendance Tracked",
      value: recentSessions.length > 0 ? "✓" : "—",
      icon: "⏳",
      color: "#10B981",
      desc: recentSessions.length > 0 ? "Sessions recorded" : "No sessions yet",
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
                  Welcome, {(teacher.full_name || teacher.name)?.split(" ")[0] || "Teacher"} 👋
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

            {/* Teaching Assignment Card */}
            {(teacher.assignedDepartment || teacher.assignedSubject) && (
              <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "14px", padding: "18px 22px", marginBottom: "20px", border: "1px solid rgba(56,189,248,0.2)" }}>
                <p style={{ color: "#38BDF8", fontWeight: "700", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px" }}>📚 Your Teaching Assignment</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
                  {[
                    { label: "Department", value: teacher.assignedDepartment || "—", icon: "🏛️", color: teacher.assignedDepartment === "Fresh" ? "#FCD34D" : "#A78BFA" },
                    { label: "Year",       value: teacher.assignedYear       || "—", icon: "📅", color: "#34D399" },
                    { label: "Section",    value: teacher.assignedSection    || "—", icon: "🏫", color: "#60A5FA" },
                    { label: "Subject",    value: teacher.assignedSubject    || "—", icon: "📖", color: "#F87171" },
                    { label: "Semester",   value: teacher.assignedSemester   || "—", icon: "🗓️", color: "#FBBF24" },
                  ].map((c) => (
                    <div key={c.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "12px 14px", border: "1px solid rgba(56,189,248,0.1)" }}>
                      <p style={{ color: "#64748B", fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", margin: "0 0 4px" }}>{c.icon} {c.label}</p>
                      <p style={{ color: c.color, fontWeight: "700", fontSize: "0.9rem", margin: 0 }}>{c.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    {todaySessionCount === 0 ? "No sessions marked today" : `${todaySessionCount} session${todaySessionCount > 1 ? "s" : ""} marked`}
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
