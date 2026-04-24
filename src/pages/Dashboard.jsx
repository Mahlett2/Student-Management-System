import { Link } from "react-router-dom";
import "../styles/dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <h2 className="logo">University System</h2>

        <Link to="/" className="nav-link">
          Dashboard
        </Link>
        <Link to="/student-portal" className="nav-link">
          Student Portal
        </Link>
        <Link to="/teacher-portal" className="nav-link">
          Teacher Portal
        </Link>

        <div className="divider"></div>

        <h4 className="section-title">Student Features</h4>

        <Link to="/student/profile" className="nav-link">
          Profile
        </Link>
        <Link to="/student/grades" className="nav-link">
          Grades
        </Link>
        <Link to="/student/register" className="nav-link">
          Register
        </Link>
        <Link to="/student/adddrop" className="nav-link">
          Add / Drop
        </Link>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <h1>Dashboard</h1>
      </div>
    </div>
  );
}
