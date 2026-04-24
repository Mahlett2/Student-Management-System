import { useState } from "react";
import "../styles/layout.css";
import "../styles/students.css";

export default function Students() {
  const [students, setStudents] = useState([
    { id: 1, name: "John Doe", email: "john@mail.com", dept: "CS" },
    { id: 2, name: "Jane Smith", email: "jane@mail.com", dept: "IT" },
  ]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    dept: "",
  });

  const addStudent = () => {
    setStudents([...students, { id: Date.now(), ...form }]);
    setForm({ name: "", email: "", dept: "" });
  };

  const deleteStudent = (id) => {
    setStudents(students.filter((s) => s.id !== id));
  };

  return (
    <div className="content">
      <h2>Students</h2>

      {/* FORM */}
      <div style={{ marginTop: "15px" }}>
        <input
          placeholder="Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Dept"
          onChange={(e) => setForm({ ...form, dept: e.target.value })}
        />

        <button className="btn btn-add" onClick={addStudent}>
          Add Student
        </button>
      </div>

      {/* TABLE */}
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Dept</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>{s.dept}</td>
              <td>
                <button
                  className="btn btn-delete"
                  onClick={() => deleteStudent(s.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
