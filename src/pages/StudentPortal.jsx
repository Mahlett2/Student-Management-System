import { useState } from "react";
import Profile from "./student/Profile";
import Grades from "./student/Grades";
import Register from "./student/Register";
import AddDrop from "./student/AddDrop";
import "../styles/layout.css";

export default function StudentPortal() {
  const [page, setPage] = useState("dashboard");

  return (
    <div className="layout">
      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>University System</h2>

        <button onClick={() => setPage("dashboard")}>Dashboard</button>
        <button onClick={() => setPage("profile")}>Student Profile</button>
        <button onClick={() => setPage("grades")}>Grades</button>
        <button onClick={() => setPage("register")}>Registration</button>
        <button onClick={() => setPage("adddrop")}>Add / Drop</button>
      </div>

      {/* MAIN CONTENT */}
      <div className="content">
        {/* DASHBOARD HOME */}
        {page === "dashboard" && (
          <div>
            <h1>University Dashboard</h1>

            <div className="cards">
              <div className="card blue">Students: 1240</div>
              <div className="card green">Courses: 58</div>
              <div className="card orange">Lecturers: 87</div>
              <div className="card red">Departments: 12</div>
            </div>

            <div className="panel">
              <h3>Recent Activity</h3>
              <p>✔ New student added</p>
              <p>✔ Grades published</p>
              <p>✔ Course updated</p>
            </div>
          </div>
        )}

        {/* OTHER PAGES */}
        {page === "profile" && <Profile />}
        {page === "grades" && <Grades />}
        {page === "register" && <Register />}
        {page === "adddrop" && <AddDrop />}
      </div>
    </div>
  );
}
