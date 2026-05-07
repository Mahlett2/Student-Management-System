import { useState } from "react";
import { useSettings } from "../../data/settingsStore";

// Courses per department per semester (pre-assigned by curriculum)
const CURRICULUM = {
  "Computer Science": {
    "Year 1 - Semester 1": [
      { code: "CS101", name: "Introduction to Programming", credits: 3, type: "Core" },
      { code: "CS102", name: "Discrete Mathematics", credits: 3, type: "Core" },
      { code: "CS103", name: "Computer Fundamentals", credits: 2, type: "Core" },
      { code: "GEN101", name: "Technical Writing", credits: 2, type: "Core" },
      { code: "GEN102", name: "Calculus I", credits: 3, type: "Core" },
    ],
    "Year 1 - Semester 2": [
      { code: "CS104", name: "Object-Oriented Programming", credits: 3, type: "Core" },
      { code: "CS105", name: "Data Structures", credits: 3, type: "Core" },
      { code: "GEN103", name: "Calculus II", credits: 3, type: "Core" },
      { code: "GEN104", name: "Physics", credits: 3, type: "Core" },
    ],
    "Year 2 - Semester 1": [
      { code: "CS201", name: "Algorithms", credits: 3, type: "Core" },
      { code: "CS202", name: "Database Systems", credits: 3, type: "Core" },
      { code: "CS203", name: "Computer Architecture", credits: 3, type: "Core" },
      { code: "CS204", name: "Linear Algebra", credits: 3, type: "Core" },
    ],
    "Year 2 - Semester 2": [
      { code: "CS205", name: "Operating Systems", credits: 3, type: "Core" },
      { code: "CS206", name: "Computer Networks", credits: 3, type: "Core" },
      { code: "CS207", name: "Software Engineering", credits: 3, type: "Core" },
      { code: "CS208", name: "Statistics", credits: 3, type: "Core" },
    ],
    "Year 3 - Semester 1": [
      { code: "CS301", name: "Artificial Intelligence", credits: 3, type: "Core" },
      { code: "CS302", name: "Web Development", credits: 3, type: "Core" },
      { code: "CS303", name: "Compiler Design", credits: 3, type: "Core" },
      { code: "CS304", name: "Mobile Development", credits: 3, type: "Elective" },
    ],
    "Year 3 - Semester 2": [
      { code: "CS305", name: "Machine Learning", credits: 3, type: "Core" },
      { code: "CS306", name: "Cybersecurity", credits: 3, type: "Core" },
      { code: "CS307", name: "Cloud Computing", credits: 3, type: "Elective" },
      { code: "CS308", name: "Research Methods", credits: 2, type: "Core" },
    ],
    "Year 4 - Semester 1": [
      { code: "CS401", name: "Senior Project I", credits: 4, type: "Project" },
      { code: "CS402", name: "Distributed Systems", credits: 3, type: "Core" },
      { code: "CS403", name: "Data Science", credits: 3, type: "Elective" },
    ],
    "Year 4 - Semester 2": [
      { code: "CS404", name: "Senior Project II", credits: 4, type: "Project" },
      { code: "CS405", name: "Ethics in Computing", credits: 2, type: "Core" },
      { code: "CS406", name: "Internship", credits: 3, type: "Core" },
    ],
  },
  "Software Engineering": {
    "Year 1 - Semester 1": [
      { code: "SE101", name: "Introduction to Programming", credits: 3, type: "Core" },
      { code: "SE102", name: "Discrete Mathematics", credits: 3, type: "Core" },
      { code: "GEN101", name: "Technical Writing", credits: 2, type: "Core" },
      { code: "GEN102", name: "Calculus I", credits: 3, type: "Core" },
    ],
    "Year 2 - Semester 1": [
      { code: "SE201", name: "Software Design Patterns", credits: 3, type: "Core" },
      { code: "SE202", name: "Database Systems", credits: 3, type: "Core" },
      { code: "SE203", name: "Web Development", credits: 3, type: "Core" },
      { code: "SE204", name: "Agile Methods", credits: 2, type: "Core" },
    ],
    "Year 3 - Semester 1": [
      { code: "SE301", name: "Software Testing", credits: 3, type: "Core" },
      { code: "SE302", name: "DevOps", credits: 3, type: "Core" },
      { code: "SE303", name: "Project Management", credits: 2, type: "Core" },
      { code: "SE304", name: "Mobile Development", credits: 3, type: "Elective" },
    ],
  },
  "Information Technology": {
    "Year 1 - Semester 1": [
      { code: "IT101", name: "IT Fundamentals", credits: 3, type: "Core" },
      { code: "IT102", name: "Networking Basics", credits: 3, type: "Core" },
      { code: "GEN101", name: "Technical Writing", credits: 2, type: "Core" },
      { code: "GEN102", name: "Mathematics", credits: 3, type: "Core" },
    ],
    "Year 2 - Semester 1": [
      { code: "IT201", name: "Network Administration", credits: 3, type: "Core" },
      { code: "IT202", name: "Cybersecurity Fundamentals", credits: 3, type: "Core" },
      { code: "IT203", name: "Database Administration", credits: 3, type: "Core" },
    ],
    "Year 3 - Semester 1": [
      { code: "IT301", name: "Cloud Services", credits: 3, type: "Core" },
      { code: "IT302", name: "Digital Forensics", credits: 3, type: "Core" },
      { code: "IT303", name: "IT Project Management", credits: 2, type: "Core" },
    ],
  },
  "Information Systems": {
    "Year 1 - Semester 1": [
      { code: "IS101", name: "Introduction to IS", credits: 3, type: "Core" },
      { code: "IS102", name: "Business Computing", credits: 3, type: "Core" },
      { code: "GEN101", name: "Technical Writing", credits: 2, type: "Core" },
    ],
    "Year 2 - Semester 1": [
      { code: "IS201", name: "Systems Analysis & Design", credits: 3, type: "Core" },
      { code: "IS202", name: "Business Intelligence", credits: 3, type: "Core" },
      { code: "IS203", name: "ERP Systems", credits: 3, type: "Core" },
    ],
    "Year 3 - Semester 1": [
      { code: "IS301", name: "Data Warehousing", credits: 3, type: "Core" },
      { code: "IS302", name: "IS Strategy", credits: 3, type: "Core" },
      { code: "IS303", name: "Research Methods", credits: 2, type: "Core" },
    ],
  },
};

const TYPE_COLORS = {
  Core:     { bg: "#DBEAFE", text: "#1D4ED8" },
  Elective: { bg: "#DCFCE7", text: "#15803D" },
  Lab:      { bg: "#FEF9C3", text: "#A16207" },
  Project:  { bg: "#FCE7F3", text: "#9D174D" },
};

export default function Register() {
  const { settings } = useSettings();
  const stored = localStorage.getItem("student");
  const student = stored ? JSON.parse(stored) : {};

  const regKey = `registrations_${student.id || student.username}`;
  const regVersion = `reg_version_${student.id || student.username}`;

  const [registrations, setRegistrations] = useState(() => {
    // If old registration data exists without cafeteria choice, clear it
    const version = localStorage.getItem(regVersion);
    if (version !== "v2") {
      localStorage.removeItem(regKey);
      localStorage.setItem(regVersion, "v2");
      return [];
    }
    const s = localStorage.getItem(regKey);
    return s ? JSON.parse(s) : [];
  });

  const [tab, setTab] = useState("register");
  const [registered, setRegistered] = useState(false);
  const [cafeChoice, setCafeChoice] = useState(""); // "Cafe" | "Non-Cafe"
  const [showCafeModal, setShowCafeModal] = useState(false);
  // Track cafeteria status reactively (re-read from localStorage)
  const [savedCafe, setSavedCafe] = useState(() => {
    const s = localStorage.getItem("student");
    return s ? JSON.parse(s).cafeteria || "" : "";
  });

  const currentSemester = settings.currentSemester || "Semester 1";
  const currentAcYear = settings.academicYear || "2024/2025";
  const year = student.year || "Year 1";

  // Build the curriculum key: "Year 3 - Semester 1"
  const semNum = currentSemester.includes("2") ? "2" : "1";
  const currKey = `${year} - Semester ${semNum}`;
  const semKey = `${currentAcYear} - ${currentSemester}`;

  // Get courses for this student's dept + year + semester
  const deptCurriculum = CURRICULUM[student.department] || {};

  // Also check admin-added subjects
  const adminSubjects = JSON.parse(localStorage.getItem("subjects") || "[]");
  const adminCourses = adminSubjects
    .filter((s) => s.department === student.department && s.year === year && (!s.semester || s.semester === currentSemester))
    .map((s) => ({ code: s.code, name: s.name, credits: Number(s.credits) || 3, type: s.type || "Core" }));

  const semesterCourses = adminCourses.length > 0
    ? adminCourses
    : (deptCurriculum[currKey] || []);

  // Already registered this semester?
  const myRegistrations = registrations.filter((r) => r.semKey === semKey);
  const isRegistered = myRegistrations.length > 0;
  const totalCredits = myRegistrations.reduce((s, r) => s + (r.credits || 0), 0);

  const handleRegisterAll = () => {
    if (isRegistered) return;
    // Show cafeteria choice modal first
    setShowCafeModal(true);
  };

  const confirmRegistration = () => {
    if (!cafeChoice) return;
    const newRegs = semesterCourses.map((c) => ({
      ...c, semKey, registeredAt: new Date().toISOString(),
    }));
    const updated = [...registrations, ...newRegs];
    setRegistrations(updated);
    localStorage.setItem(regKey, JSON.stringify(updated));

    // Save cafeteria choice to student localStorage
    const updatedStudent = { ...student, cafeteria: cafeChoice };
    localStorage.setItem("student", JSON.stringify(updatedStudent));

    // Save cafeteria request for admin to see
    const cafeRequests = JSON.parse(localStorage.getItem("cafeteria_requests") || "[]");
    cafeRequests.push({
      id: Date.now(),
      studentName: student.name,
      studentId: student.studentId,
      department: student.department,
      year: student.year,
      semester: currentSemester,
      academicYear: currentAcYear,
      choice: cafeChoice,
      submittedAt: new Date().toISOString(),
      status: "Pending",
    });
    localStorage.setItem("cafeteria_requests", JSON.stringify(cafeRequests));

    setShowCafeModal(false);
    setRegistered(true);
    setSavedCafe(cafeChoice);
    setTab("registered");
  };

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
                { value: "Cafe", label: "🍽️ Cafe", desc: "I will use the university cafeteria for meals" },
                { value: "Non-Cafe", label: "🏠 Non-Cafe", desc: "I will arrange my own meals (self-catering)" },
              ].map((opt) => (
                <button key={opt.value} onClick={() => setCafeChoice(opt.value)} style={{
                  padding: "14px 18px", borderRadius: "10px", border: `2px solid ${cafeChoice === opt.value ? "#0EA5E9" : "rgba(14,165,233,0.3)"}`,
                  background: cafeChoice === opt.value ? "linear-gradient(135deg,#0F172A,#1E293B)" : "#7DD3FC",
                  cursor: "pointer", textAlign: "left", transition: "all 0.18s",
                }}>
                  <p style={{ fontWeight: "700", color: cafeChoice === opt.value ? "#38BDF8" : "#0C4A6E", margin: "0 0 3px", fontSize: "0.95rem" }}>{opt.label}</p>
                  <p style={{ color: cafeChoice === opt.value ? "#94A3B8" : "#0369A1", margin: 0, fontSize: "0.8rem" }}>{opt.desc}</p>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={confirmRegistration} disabled={!cafeChoice} style={{ flex: 1, padding: "11px", background: cafeChoice ? "linear-gradient(135deg,#0F172A,#1E293B)" : "#94A3B8", color: cafeChoice ? "#38BDF8" : "#E2E8F0", border: "none", borderRadius: "8px", cursor: cafeChoice ? "pointer" : "not-allowed", fontWeight: "700", fontSize: "0.875rem" }}>
                ✅ Confirm Registration
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
            {currentAcYear} · {currentSemester} · {student.department} · {year}
          </p>
        </div>
        {isRegistered && (
          <div style={{ textAlign: "center", background: "rgba(16,185,129,0.1)", borderRadius: "12px", padding: "10px 18px", border: "1px solid rgba(16,185,129,0.3)" }}>
            <p style={{ color: "#10B981", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", margin: 0 }}>Registered</p>
            <p style={{ color: "#10B981", fontSize: "1.5rem", fontWeight: "800", margin: "2px 0 0" }}>{myRegistrations.length} courses</p>
            <p style={{ color: "#64748B", fontSize: "0.72rem", margin: 0 }}>{totalCredits} credit hrs</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "1.25rem", background: "#7DD3FC", padding: "5px", borderRadius: "12px", border: "1px solid rgba(14,165,233,0.2)" }}>
        {[
          { id: "register",   label: "📋 This Semester's Courses" },
          { id: "registered", label: `✅ My Registrations (${myRegistrations.length})` },
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
              <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>The admin will assign courses for {year} - {currentSemester}.</p>
            </div>
          ) : (
            <>
              <div style={{ background: "#7DD3FC", borderRadius: "12px", padding: "14px 18px", marginBottom: "1rem", border: "1px solid rgba(14,165,233,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                <div>
                  <p style={{ color: "#0C4A6E", fontWeight: "700", margin: 0 }}>
                    {semesterCourses.length} courses assigned for {year} · {currentSemester}
                  </p>
                  <p style={{ color: "#0369A1", fontSize: "0.82rem", margin: "3px 0 0" }}>
                    Total: {semesterCourses.reduce((s, c) => s + (c.credits || 0), 0)} credit hours
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

              <div style={{ background: "#7DD3FC", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(14,165,233,0.2)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
                      {["#", "Code", "Course Name", "Type", "Credits"].map((h) => (
                        <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "#38BDF8", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {semesterCourses.map((c, i) => {
                      const tc = TYPE_COLORS[c.type] || TYPE_COLORS.Core;
                      return (
                        <tr key={c.code} style={{ background: i % 2 === 0 ? "#7DD3FC" : "#BAE6FD", borderBottom: "1px solid rgba(14,165,233,0.12)" }}>
                          <td style={{ padding: "11px 14px", color: "#0369A1", fontWeight: "600" }}>{i + 1}</td>
                          <td style={{ padding: "11px 14px", fontFamily: "monospace", fontWeight: "700", color: "#0C4A6E" }}>{c.code}</td>
                          <td style={{ padding: "11px 14px", fontWeight: "600", color: "#0C4A6E" }}>{c.name}</td>
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{ background: tc.bg, color: tc.text, padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" }}>{c.type}</span>
                          </td>
                          <td style={{ padding: "11px 14px", color: "#0369A1", fontWeight: "600" }}>{c.credits} hrs</td>
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

      {/* ── MY REGISTRATIONS ── */}
      {tab === "registered" && (
        <>
          {myRegistrations.length === 0 ? (
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
                  { label: "Courses", value: myRegistrations.length, icon: "📚" },
                  { label: "Credit Hours", value: totalCredits, icon: "⏱️" },
                  { label: "Semester", value: currentSemester, icon: "🗓️" },
                ].map((c) => (
                  <div key={c.label} style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(56,189,248,0.15)", textAlign: "center" }}>
                    <p style={{ fontSize: "1.3rem", margin: 0 }}>{c.icon}</p>
                    <p style={{ color: "#38BDF8", fontWeight: "800", fontSize: "1.1rem", margin: "4px 0 2px" }}>{c.value}</p>
                    <p style={{ color: "#64748B", fontSize: "0.7rem", fontWeight: "600", textTransform: "uppercase", margin: 0 }}>{c.label}</p>
                  </div>
                ))}
              </div>

              {/* Cafeteria choice display */}
              {savedCafe && (
                <div style={{ background: savedCafe === "Cafe" ? "#DCFCE7" : "#FEF9C3", borderRadius: "12px", padding: "14px 18px", marginBottom: "1.25rem", border: `1px solid ${savedCafe === "Cafe" ? "#86EFAC" : "#FDE047"}`, display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "1.8rem" }}>{savedCafe === "Cafe" ? "🍽️" : "🏠"}</span>
                  <div>
                    <p style={{ fontWeight: "700", color: savedCafe === "Cafe" ? "#15803D" : "#A16207", margin: 0, fontSize: "0.95rem" }}>
                      Cafeteria Choice: {savedCafe}
                    </p>
                    <p style={{ color: savedCafe === "Cafe" ? "#15803D" : "#A16207", margin: "3px 0 0", fontSize: "0.82rem", opacity: 0.85 }}>
                      {savedCafe === "Cafe"
                        ? "You will use the university cafeteria for meals this semester."
                        : "You will arrange your own meals (self-catering) this semester."}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ background: "#7DD3FC", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(14,165,233,0.2)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
                      {["#", "Code", "Course Name", "Type", "Credits"].map((h) => (
                        <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "#38BDF8", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myRegistrations.map((r, i) => {
                      const tc = TYPE_COLORS[r.type] || TYPE_COLORS.Core;
                      return (
                        <tr key={r.code} style={{ background: i % 2 === 0 ? "#7DD3FC" : "#BAE6FD", borderBottom: "1px solid rgba(14,165,233,0.12)" }}>
                          <td style={{ padding: "11px 14px", color: "#0369A1", fontWeight: "600" }}>{i + 1}</td>
                          <td style={{ padding: "11px 14px", fontFamily: "monospace", fontWeight: "700", color: "#0C4A6E" }}>{r.code}</td>
                          <td style={{ padding: "11px 14px", fontWeight: "600", color: "#0C4A6E" }}>{r.name}</td>
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{ background: tc.bg, color: tc.text, padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" }}>{r.type}</span>
                          </td>
                          <td style={{ padding: "11px 14px", color: "#0369A1", fontWeight: "600" }}>{r.credits} hrs</td>
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
