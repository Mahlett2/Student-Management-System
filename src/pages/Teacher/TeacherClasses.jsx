import { useState, useEffect, useMemo } from "react";
import { apiGet } from "../../api/client";

export default function TeacherClasses() {
  const stored = localStorage.getItem("current_user");
  const teacher = stored ? JSON.parse(stored) : {};

  // Teacher's assigned info from admin
  const assignedDept    = teacher.assignedDepartment || teacher.department || "";
  const assignedSection = teacher.assignedSection    || "";
  const assignedSubject = teacher.assignedSubject    || "";
  const assignedSemester = teacher.assignedSemester  || "";
  const assignedYear    = teacher.assignedYear       || "";

  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  useEffect(() => {
    apiGet("/students/?page_size=1000")
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        setStudents(list.map((s) => ({
          ...s,
          fullName:   s.full_name   || s.fullName   || "",
          studentId:  s.student_id  || s.studentId  || "",
          department: typeof s.department === "object" ? s.department?.name : s.department || "",
          section:    s.section     || "",
          year:       s.year        || "",
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filter students by assigned department + section
  const classStudents = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((s) => {
      const deptMatch = !assignedDept || s.department === assignedDept || assignedDept === "Fresh";
      const secMatch  = !assignedSection || s.section === assignedSection;
      const yearMatch = !assignedYear || s.year === assignedYear;
      const searchMatch = !q || s.fullName?.toLowerCase().includes(q) || s.studentId?.toLowerCase().includes(q);
      return deptMatch && secMatch && yearMatch && searchMatch;
    });
  }, [students, assignedDept, assignedSection, search]);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#0369A1" }}>
      ⏳ Loading class...
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px" }}>
        <h2 style={{ color: "#E0F2FE", margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>🏫 My Class</h2>
        <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: "0.82rem" }}>
          {assignedDept || "Not assigned"} · {assignedSection || "—"} · {classStudents.length} students
        </p>
      </div>

      {/* Assignment card */}
      {(assignedDept || assignedSubject) ? (
        <div style={{ background: "#7DD3FC", borderRadius: "12px", padding: "16px 18px", marginBottom: "1.25rem", border: "1px solid rgba(14,165,233,0.2)" }}>
          <h3 style={{ color: "#0C4A6E", margin: "0 0 12px", fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase" }}>📚 Your Teaching Assignment</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }}>
            {[
              { label: "Department", value: assignedDept    || "—", icon: "🏛️" },
              { label: "Year",       value: assignedYear    || "—", icon: "📅" },
              { label: "Section",    value: assignedSection || "—", icon: "🏫" },
              { label: "Subject",    value: assignedSubject || "—", icon: "📖" },
              { label: "Semester",   value: assignedSemester || "—", icon: "🗓️" },
            ].map((c) => (
              <div key={c.label} style={{ background: "#BAE6FD", borderRadius: "10px", padding: "12px 14px" }}>
                <p style={{ fontSize: "0.72rem", color: "#0369A1", fontWeight: "700", textTransform: "uppercase", margin: "0 0 4px" }}>{c.icon} {c.label}</p>
                <p style={{ fontWeight: "700", color: "#0C4A6E", margin: 0, fontSize: "0.9rem" }}>{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: "#FEF9C3", border: "1px solid #FDE047", borderRadius: "10px", padding: "12px 16px", marginBottom: "1.25rem", fontSize: "0.85rem", color: "#92400e" }}>
          ⚠️ No teaching assignment yet. The admin will assign your department, section, and subject.
        </div>
      )}

      {/* Student list */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <input
          placeholder="🔍 Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem", outline: "none" }}
        />
      </div>

      <h3 style={{ color: "#0C4A6E", margin: "0 0 10px", fontSize: "0.9rem", fontWeight: "700" }}>
        👥 Students in {assignedDept} · {assignedSection} ({classStudents.length})
      </h3>

      {classStudents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2.5rem", background: "#7DD3FC", borderRadius: "12px", color: "#0369A1" }}>
          <p style={{ fontSize: "2rem" }}>👥</p>
          <p>{!assignedDept ? "No assignment yet." : "No students found in this class."}</p>
        </div>
      ) : (
        <div style={{ background: "#7DD3FC", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(14,165,233,0.2)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
                {["#", "Student Name", "Student ID", "Year", "Section", "Status"].map((h) => (
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
                        {s.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: "600", color: "#0C4A6E" }}>{s.fullName}</span>
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px", fontFamily: "monospace", color: "#0369A1", fontSize: "0.82rem" }}>{s.studentId || "—"}</td>
                  <td style={{ padding: "11px 14px", color: "#0C4A6E" }}>{s.year || "—"}</td>
                  <td style={{ padding: "11px 14px", color: "#0C4A6E" }}>{s.section || "—"}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ background: "#DCFCE7", color: "#15803D", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" }}>
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
}
