import { useState, useEffect, useMemo } from "react";
import { useSettings } from "../../data/settingsStore";
import { apiGet, apiPost } from "../../api/client";

const TYPE_COLORS = {
  Core:     { bg: "#DBEAFE", text: "#1D4ED8" },
  Elective: { bg: "#DCFCE7", text: "#15803D" },
  Lab:      { bg: "#FEF9C3", text: "#A16207" },
  Project:  { bg: "#FCE7F3", text: "#9D174D" },
};

export default function Register() {
  const { settings } = useSettings();

  // Load current user (student) info
  const stored = localStorage.getItem("current_user");
  const user = stored ? JSON.parse(stored) : {};

  const currentSemester = settings.currentSemester || "Semester 1";
  const currentAcYear   = settings.academicYear    || "2024/2025";

  // Student profile from API
  const [student, setStudent]     = useState(null);
  const [subjects, setSubjects]   = useState([]);   // from /api/subjects/
  const [teachers, setTeachers]   = useState([]);   // from /api/teachers/
  const [loading, setLoading]     = useState(true);

  // Registration state
  const [tab, setTab]             = useState("register");
  const [registered, setRegistered] = useState(false);
  const [cafeChoice, setCafeChoice] = useState("");
  const [showCafeModal, setShowCafeModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    // Load student profile + subjects + teachers in parallel
    Promise.all([
      apiGet("/students/me/"),
      apiGet("/subjects/?page_size=500"),
      apiGet("/teachers/?page_size=500"),
    ]).then(([stuData, subData, tchData]) => {
      if (stuData) {
        setStudent({
          name:       stuData.full_name    || user.full_name || "",
          studentId:  stuData.student_id   || "",
          department: typeof stuData.department === "object"
            ? stuData.department?.name
            : stuData.department || "",
          year:       stuData.year         || "",
          section:    stuData.section      || "",
          semester:   currentSemester,
        });
      }

      const subList = Array.isArray(subData) ? subData : (subData?.results || []);
      setSubjects(subList.map((s) => ({
        ...s,
        department: typeof s.department === "object" ? s.department?.name : s.department || "",
      })));

      const tchList = Array.isArray(tchData) ? tchData : (tchData?.results || []);
      setTeachers(tchList.map((t) => ({
        ...t,
        fullName:           t.full_name            || t.fullName           || "",
        assignedSubject:    t.assigned_subject     || t.assignedSubject    || "",
        assignedDepartment: t.assigned_department  || t.assignedDepartment || "",
        assignedSemester:   t.assigned_semester    || t.assignedSemester   || "",
      })));
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filter subjects for this student's department + year + current semester
  const semesterCourses = useMemo(() => {
    if (!student) return [];
    const dept = student.department;
    const year = student.year;
    const sem  = currentSemester;

    // Match subjects by department, year, and semester
    const filtered = subjects.filter((s) => {
      const deptMatch = !dept || s.department === dept || s.department === "Fresh" || !s.department;
      const yearMatch = !year || !s.year || s.year === year;
      const semMatch  = !sem  || !s.semester || s.semester === sem;
      return deptMatch && yearMatch && semMatch;
    });

    // Attach teacher info to each subject
    return filtered.map((subj) => {
      const teacher = teachers.find((t) =>
        t.assignedSubject?.toLowerCase() === subj.name?.toLowerCase() ||
        t.assignedSubject?.toLowerCase() === subj.code?.toLowerCase()
      );
      return {
        ...subj,
        teacherName: teacher?.fullName || "—",
      };
    });
  }, [subjects, teachers, student, currentSemester]);

  const totalCredits = semesterCourses.reduce((s, c) => s + (Number(c.credits) || 0), 0);
  const isRegistered = registered;

  const handleRegisterAll = () => {
    if (isRegistered) return;
    setShowCafeModal(true);
  };

  const confirmRegistration = async () => {
    if (!cafeChoice) return;
    setSubmitting(true);
    try {
      // Submit cafeteria request
      await apiPost("/cafeteria/", { choice: cafeChoice });
    } catch {
      // Ignore if already submitted
    }
    setRegistrations(semesterCourses);
    setShowCafeModal(false);
    setRegistered(true);
    setTab("registered");
    setSubmitting(false);
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#0369A1" }}>
      ⏳ Loading courses...
    </div>
  );

  return (
    <div>
      {/* Cafeteria choice modal */}
      {showCafeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#BAE6FD", borderRadius: "16px", padding: "32px", maxWidth: "440px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", border: "1px solid rgba(14,165,233,0.3)" }}>
            <h3 style={{ color: "#0C4A6E", margin: "0 0 8px", fontSize: "1.1rem", fontWeight: "800" }}>🍽️ Cafeteria Preference</h3>
            <p style={{ color: "#0369A1", margin: "0 0 1.5rem", fontSize: "0.875rem", lineHeight: "1.6" }}>
              Before completing your registration, please select your cafeteria preference for <strong>{currentSemester} {currentAcYear}</strong>.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.5rem" }}>
              {[
                { value: "Cafe",     label: "🍽️ Cafe",     desc: "I will use the university cafeteria for meals" },
                { value: "Non-Cafe", label: "🏠 Non-Cafe", desc: "I will arrange my own meals (self-catering)" },
              ].map((opt) => (
                <button key={opt.value} onClick={() => setCafeChoice(opt.value)} style={{
                  padding: "14px 18px", borderRadius: "10px",
                  border: `2px solid ${cafeChoice === opt.value ? "#0EA5E9" : "rgba(14,165,233,0.3)"}`,
                  background: cafeChoice === opt.value ? "linear-gradient(135deg,#0F172A,#1E293B)" : "#7DD3FC",
                  cursor: "pointer", textAlign: "left", transition: "all 0.18s",
                }}>
                  <p style={{ fontWeight: "700", color: cafeChoice === opt.value ? "#38BDF8" : "#0C4A6E", margin: "0 0 3px", fontSize: "0.95rem" }}>{opt.label}</p>
                  <p style={{ color: cafeChoice === opt.value ? "#94A3B8" : "#0369A1", margin: 0, fontSize: "0.8rem" }}>{opt.desc}</p>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={confirmRegistration} disabled={!cafeChoice || submitting} style={{ flex: 1, padding: "11px", background: cafeChoice ? "linear-gradient(135deg,#0F172A,#1E293B)" : "#94A3B8", color: cafeChoice ? "#38BDF8" : "#E2E8F0", border: "none", borderRadius: "8px", cursor: cafeChoice ? "pointer" : "not-allowed", fontWeight: "700", fontSize: "0.875rem" }}>
                {submitting ? "⏳ Registering..." : "✅ Confirm Registration"}
              </button>
              <button onClick={() => setShowCafeModal(false)} style={{ padding: "11px 18px", background: "rgba(239,68,68,0.12)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ color: "#E0F2FE", margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>📚 Course Registration</h2>
          <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.82rem" }}>
            {currentAcYear} · {currentSemester}
            {student?.department && ` · ${student.department}`}
            {student?.year && ` · ${student.year}`}
          </p>
        </div>
        {isRegistered && (
          <div style={{ textAlign: "center", background: "rgba(16,185,129,0.1)", borderRadius: "12px", padding: "10px 18px", border: "1px solid rgba(16,185,129,0.3)" }}>
            <p style={{ color: "#10B981", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", margin: 0 }}>Registered</p>
            <p style={{ color: "#10B981", fontSize: "1.5rem", fontWeight: "800", margin: "2px 0 0" }}>{registrations.length} courses</p>
            <p style={{ color: "#64748B", fontSize: "0.72rem", margin: 0 }}>{totalCredits} credit hrs</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "1.25rem", background: "#7DD3FC", padding: "5px", borderRadius: "12px", border: "1px solid rgba(14,165,233,0.2)" }}>
        {[
          { id: "register",   label: "📋 This Semester's Courses" },
          { id: "registered", label: `✅ My Registrations (${registrations.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer",
            fontWeight: "700", fontSize: "0.85rem",
            background: tab === t.id ? "linear-gradient(135deg,#0F172A,#1E293B)" : "transparent",
            color: tab === t.id ? "#38BDF8" : "#0369A1",
            transition: "all 0.18s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── THIS SEMESTER'S COURSES ── */}
      {tab === "register" && (
        <>
          {semesterCourses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC", borderRadius: "14px", color: "#0369A1" }}>
              <p style={{ fontSize: "2rem" }}>📭</p>
              <p style={{ fontWeight: "600" }}>No courses assigned for this semester yet.</p>
              <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                The admin will assign courses for {student?.year} · {currentSemester}.
              </p>
            </div>
          ) : (
            <>
              <div style={{ background: "#7DD3FC", borderRadius: "12px", padding: "14px 18px", marginBottom: "1rem", border: "1px solid rgba(14,165,233,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                <div>
                  <p style={{ color: "#0C4A6E", fontWeight: "700", margin: 0 }}>
                    {semesterCourses.length} courses · {totalCredits} credit hours
                  </p>
                  <p style={{ color: "#0369A1", fontSize: "0.82rem", margin: "3px 0 0" }}>
                    {student?.year} · {currentSemester} · {student?.department}
                  </p>
                </div>
                {!isRegistered ? (
                  <button onClick={handleRegisterAll} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.875rem", boxShadow: "0 3px 10px rgba(0,0,0,0.2)" }}>
                    ✅ Register for All Courses
                  </button>
                ) : (
                  <span style={{ background: "#DCFCE7", color: "#15803D", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "0.875rem" }}>
                    ✅ Already Registered
                  </span>
                )}
              </div>

              {/* Course table with teacher and credit hours */}
              <div style={{ background: "#7DD3FC", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(14,165,233,0.2)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
                      {["#", "Code", "Course Name", "Type", "Credits", "Teacher"].map((h) => (
                        <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "#38BDF8", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {semesterCourses.map((c, i) => {
                      const tc = TYPE_COLORS[c.type] || TYPE_COLORS.Core;
                      return (
                        <tr key={c.id || c.code} style={{ background: i % 2 === 0 ? "#7DD3FC" : "#BAE6FD", borderBottom: "1px solid rgba(14,165,233,0.12)" }}>
                          <td style={{ padding: "11px 14px", color: "#0369A1", fontWeight: "600" }}>{i + 1}</td>
                          <td style={{ padding: "11px 14px", fontFamily: "monospace", fontWeight: "700", color: "#0C4A6E" }}>{c.code}</td>
                          <td style={{ padding: "11px 14px", fontWeight: "600", color: "#0C4A6E" }}>{c.name}</td>
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{ background: tc.bg, color: tc.text, padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" }}>
                              {c.type || "Core"}
                            </span>
                          </td>
                          <td style={{ padding: "11px 14px", color: "#0369A1", fontWeight: "600" }}>
                            {c.credits ? `${c.credits} hrs` : "—"}
                          </td>
                          <td style={{ padding: "11px 14px", color: "#0C4A6E", fontSize: "0.85rem" }}>
                            {c.teacherName !== "—"
                              ? <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#0EA5E9,#38BDF8)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: "#0C4A6E", fontSize: "0.75rem", flexShrink: 0 }}>
                                    {c.teacherName.charAt(0).toUpperCase()}
                                  </span>
                                  {c.teacherName}
                                </span>
                              : <span style={{ color: "#94A3B8", fontStyle: "italic" }}>Not assigned</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
                      <td colSpan={4} style={{ padding: "10px 14px", color: "#64748B", fontSize: "0.82rem", fontWeight: "600" }}>
                        Total
                      </td>
                      <td style={{ padding: "10px 14px", color: "#38BDF8", fontWeight: "800" }}>
                        {totalCredits} hrs
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ── MY REGISTRATIONS ── */}
      {tab === "registered" && (
        <>
          {registrations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC", borderRadius: "14px", color: "#0369A1" }}>
              <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>📭</p>
              <p style={{ fontWeight: "600" }}>Not registered yet for {currentSemester}.</p>
              <button onClick={() => setTab("register")} style={{ marginTop: "1rem", padding: "9px 20px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>
                Go to Registration
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "1.25rem" }}>
                {[
                  { label: "Courses",      value: registrations.length, icon: "📚" },
                  { label: "Credit Hours", value: totalCredits,          icon: "⏱️" },
                  { label: "Semester",     value: currentSemester,       icon: "🗓️" },
                ].map((c) => (
                  <div key={c.label} style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(56,189,248,0.15)", textAlign: "center" }}>
                    <p style={{ fontSize: "1.3rem", margin: 0 }}>{c.icon}</p>
                    <p style={{ color: "#38BDF8", fontWeight: "800", fontSize: "1.1rem", margin: "4px 0 2px" }}>{c.value}</p>
                    <p style={{ color: "#64748B", fontSize: "0.7rem", fontWeight: "600", textTransform: "uppercase", margin: 0 }}>{c.label}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: "#7DD3FC", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(14,165,233,0.2)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
                      {["#", "Code", "Course Name", "Type", "Credits", "Teacher"].map((h) => (
                        <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "#38BDF8", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((r, i) => {
                      const tc = TYPE_COLORS[r.type] || TYPE_COLORS.Core;
                      return (
                        <tr key={r.id || r.code} style={{ background: i % 2 === 0 ? "#7DD3FC" : "#BAE6FD", borderBottom: "1px solid rgba(14,165,233,0.12)" }}>
                          <td style={{ padding: "11px 14px", color: "#0369A1", fontWeight: "600" }}>{i + 1}</td>
                          <td style={{ padding: "11px 14px", fontFamily: "monospace", fontWeight: "700", color: "#0C4A6E" }}>{r.code}</td>
                          <td style={{ padding: "11px 14px", fontWeight: "600", color: "#0C4A6E" }}>{r.name}</td>
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{ background: tc.bg, color: tc.text, padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" }}>
                              {r.type || "Core"}
                            </span>
                          </td>
                          <td style={{ padding: "11px 14px", color: "#0369A1", fontWeight: "600" }}>
                            {r.credits ? `${r.credits} hrs` : "—"}
                          </td>
                          <td style={{ padding: "11px 14px", color: "#0C4A6E", fontSize: "0.85rem" }}>
                            {r.teacherName !== "—"
                              ? r.teacherName
                              : <span style={{ color: "#94A3B8", fontStyle: "italic" }}>Not assigned</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
