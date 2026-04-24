import { Link } from "react-router-dom";

export default function StudentPortal() {
  return (
    <div>
      <h1>Student Portal</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <Link to="/student/profile">My Profile</Link>
        <Link to="/student/grades">My Grades</Link>
        <Link to="/student/register">Course Registration</Link>
        <Link to="/student/adddrop">Add / Drop Courses</Link>
      </div>
    </div>
  );
}
