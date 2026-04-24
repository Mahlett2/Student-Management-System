import { Link } from "react-router-dom";
import "../styles/layout.css";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h2>University System</h2>

      <Link to="/">Dashboard</Link>
      <Link to="/students">Students</Link>
      <Link to="/courses">Courses</Link>
      <Link to="/attendance">Attendance</Link>
      <Link to="/grades">Grades</Link>
    </div>
  );
}
