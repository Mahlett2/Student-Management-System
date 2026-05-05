import { useState, useMemo } from "react";

export default function TeacherClasses() {
  const stored = localStorage.getItem("teacher");
  const teacher = stored ? JSON.parse(stored) : {};

  const [selectedClass, setSelectedClass] = useState(null);
  const [search, setSearch] = useState("");

  // Get timetable entries assigned to this teacher
  const timetable = JSON.parse(localStorage.getItem("timetable") || "[]");
  const myTimetableEntries = timetable.filter(
    (e) => e.teacher?.toLowerCase() === teacher.name?.toLowerCase() ||
           e.department === teacher.department
  );

  // Get subjects assigned to teacher's department
  const adminSubjects = JSON.parse(localStorage.getItem("subjects") || "[]");
  const mySubjects = adminSubjects.filter((s) => s.department === teacher.department);

  // Get classes from admin classes store
  const adminClasses = JSON.parse(localStorage.getItem("classes") || "[]");
  const myClasses = adminClasses.filter((c) => c.department === teacher.department);

  // Get students in teacher's department
  const adminStudents = JSON.parse(localStorage.getItem("students_admin") || "[]");
  const myStudents = adminStudents.filter((s) => s.department === teacher.department);

  // Build class list — combine from timetable + admin classes
  const classMap = {};

  // From timetable
  myTimetableEntries.forEach((e) => {
    const key = `${e.department}-${e.classSection || e.department}`;
    if (!classMap[key]) {
      classMap[key] = {
        id: key,
        name: e.classSection || e.department,
        department: e.department,
        subjects: new Set(),
        schedule: [],
      };
    }
    classMap[key].subjects.add(e.subject);
    classMap[key].schedule.push({ day: e.day, time: e.timeSlot, subject: e.subject, room: e.room });
  });

  // From admin classes
  myClasses.forEach((c) => {
    const key = `${c.department}-${c.name}`;
    if (!classMap[key]) {
      classMap[key] = {
        id: key,
        name: c.name,
        department: c.department,
        year: c.year,
        semester: c.semester,
        room: c.room,
        capacity: c.capacity,
        subjects: new Set(),
        schedule: [],
      };
    }
  });

  // If no classes found, create one from department
  if (Object.keys(classMap).length === 0 && teacher.department) {
    classMap["default"] = {
      id: "default",
      name: teacher.department,
      department: teacher.department,
      subjects: new Set(mySubjects.map((s) => s.name)),
      schedule: [],
    };
  }

  const classList = Object.values(classMap).map((c) => ({
    ...c,
    subjects: [...c.subjects],
    studentCount: myStudents.filter((s) => !c.year || s.year === c.year).length,
  }));

  // Students for selected class
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    const cls = classList.find((c) => c.id === selectedClass);
    if (!cls) return [];
    let students = myStudents;
    if (cls.year) students = students.filter((s) => s.year === cls.year);
    const q = search.toLowerCase();
    if (q) students = students.filter((s) =>
      (s.fullName || s.name)?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q)
    );
    return students;
  }, [selectedClass, search, myStudents, classList]);

  const selectedClassData = classList.find((c) => c.id === selectedClass);

  if (selectedClass) return (
    <div>
      <button onClick={() => { setSelectedClass(null); setSearch(""); }} style={backBtn}>⬅ Back to Classes</button>

      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ color: "#E0F2FE", margin: 0, fontSize: "1.15rem", fontWeight: "800" }}>
            🏫 {selectedClassData?.name}
          </h2>
          <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.82rem" }}>
            {selectedClassData?.department}
            {selectedClassData?.year && ` · ${selectedClassData.year}`}
            {selectedClassData?.semester && ` · ${selectedClassData.semester}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {selectedClassData?.subjects?.length > 0 && selectedClassData.subjects.map((s) => (
            <span key={s} style={{ background: "#DBEAFE", color: "#1D4ED8", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "600" }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Schedule */}
      {selectedClassData?.schedule?.length > 0 && (
        <div style={{ background: "#7DD3FC", borderRadius: "12px", padding: "16px 18px", marginBottom: "1.25rem", border: "1px solid rgba(14,165,233,0.2)" }}>
          <h3 style={{ color: "#0C4A6E", margin: "0 0 10px", fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase" }}>📅 Schedule</h3>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {selectedClassData.schedule.map((s, i) => (
              <div key={i} style={{ background: "#BAE6FD", borderRadius: "8px", padding: "8px 12px", fontSize: "0.8rem" }}>
                <p style={{ fontWeight: "700", color: "#0C4A6E", margin: 0 }}>{s.subject}</p>
                <p style={{ color: "#0369A1", margin: "2px 0 0" }}>{s.day} · {s.time}</p>
                {s.room && <p style={{ color: "#0369A1", margin: "2px 0 0" }}>📍 {s.room}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student list */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <input placeholder="🔍 Search students..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem", outline: "none" }} />
      </div>

      <h3 style={{ color: "#0C4A6E", margin: "0 0 10px", fontSize: "0.9rem", fontWeight: "700" }}>
        👥 Students ({classStudents.length})
      </h3>

      {classStudents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2.5rem", background: "#7DD3FC", borderRadius: "12px", color: "#0369A1" }}>
          <p style={{ fontSize: "2rem" }}>👥</p>
          <p>{myStudents.length === 0 ? "No students registered in this department yet." : "No students match your search."}</p>
        </div>
      ) : (
        <div style={{ background: "#7DD3FC", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(14,165,233,0.2)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
                {["#", "Student Name", "Student ID", "Year", "Status"].map((h) => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "#38BDF8", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classStudents.map((s, i) => (
                <tr key={s.id || i} style={{ background: i % 2 === 0 ? "#7DD3FC" : "#BAE6FD", borderBottom: "1px solid rgba(14,165,233,0.12)" }}>
                  <td style={{ padding: "11px 14px", color: "#0369A1", fontWeight: "600" }}>{i + 1}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg,#0EA5E9,#38BDF8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: "#0C4A6E", fontSize: "0.85rem", flexShrink: 0 }}>
                        {(s.fullName || s.name)?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: "600", color: "#0C4A6E" }}>{s.fullName || s.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px", fontFamily: "monospace", color: "#0369A1", fontSize: "0.82rem" }}>{s.studentId || "—"}</td>
                  <td style={{ padding: "11px 14px", color: "#0C4A6E" }}>{s.year || "—"}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ background: s.status === "Active" || !s.status ? "#DCFCE7" : "#FEF9C3", color: s.status === "Active" || !s.status ? "#15803D" : "#A16207", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" }}>
                      {s.status || "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px" }}>
        <h2 style={{ color: "#E0F2FE", margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>🏫 My Classes & Assigned Courses</h2>
        <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.82rem" }}>
          {teacher.department} · {classList.length} class{classList.length !== 1 ? "es" : ""} · {myStudents.length} students
        </p>
      </div>

      {/* Subjects assigned */}
      {mySubjects.length > 0 && (
        <div style={{ background: "#7DD3FC", borderRadius: "12px", padding: "16px 18px", marginBottom: "1.25rem", border: "1px solid rgba(14,165,233,0.2)" }}>
          <h3 style={{ color: "#0C4A6E", margin: "0 0 10px", fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase" }}>📚 Assigned Subjects</h3>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {mySubjects.map((s) => (
              <span key={s.id} style={{ background: "#DBEAFE", color: "#1D4ED8", padding: "5px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: "600" }}>
                <span style={{ fontFamily: "monospace", marginRight: "6px", opacity: 0.7 }}>{s.code}</span>{s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Class cards */}
      {classList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "#7DD3FC", borderRadius: "14px", color: "#0369A1" }}>
          <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>🏫</p>
          <p style={{ fontWeight: "600" }}>No classes assigned yet.</p>
          <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>The admin will assign classes to your department. Once added, they'll appear here.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "14px" }}>
          {classList.map((cls) => (
            <div key={cls.id} style={{ background: "#7DD3FC", borderRadius: "14px", padding: "18px", border: "1px solid rgba(14,165,233,0.25)", cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => setSelectedClass(cls.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div>
                  <h3 style={{ color: "#0C4A6E", margin: 0, fontWeight: "800", fontSize: "1rem" }}>{cls.name}</h3>
                  <p style={{ color: "#0369A1", margin: "3px 0 0", fontSize: "0.78rem" }}>{cls.department}</p>
                </div>
                <span style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>
                  👥 {cls.studentCount}
                </span>
              </div>
              {cls.year && <p style={{ color: "#0369A1", fontSize: "0.78rem", margin: "0 0 8px" }}>{cls.year}{cls.semester && ` · ${cls.semester}`}</p>}
              {cls.subjects.length > 0 && (
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "10px" }}>
                  {cls.subjects.slice(0, 3).map((s) => (
                    <span key={s} style={{ background: "#BAE6FD", color: "#0C4A6E", padding: "2px 8px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: "600" }}>{s}</span>
                  ))}
                  {cls.subjects.length > 3 && <span style={{ color: "#0369A1", fontSize: "0.72rem" }}>+{cls.subjects.length - 3} more</span>}
                </div>
              )}
              <button style={{ width: "100%", padding: "8px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.82rem" }}>
                View Students →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const backBtn = { padding: "8px 16px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", marginBottom: "1rem", display: "inline-block" };
