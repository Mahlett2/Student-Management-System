import "../styles/dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      <h1 className="title">University Dashboard</h1>

      {/* CARDS */}
      <div className="cards">
        <div className="card blue">
          <h3>Students</h3>
          <p>1,240</p>
        </div>

        <div className="card green">
          <h3>Courses</h3>
          <p>58</p>
        </div>

        <div className="card orange">
          <h3>Lecturers</h3>
          <p>87</p>
        </div>

        <div className="card red">
          <h3>Departments</h3>
          <p>12</p>
        </div>
      </div>

      {/* LOWER SECTION */}
      <div className="bottom-section">
        <div className="activity">
          <h2>Recent Activity</h2>
          <ul>
            <li>✔ New student John Doe added</li>
            <li>✔ Course CS101 updated</li>
            <li>✔ Lecturer assigned to IT department</li>
            <li>✔ Grades published for Semester 1</li>
          </ul>
        </div>

        <div className="notice">
          <h2>University Notice</h2>
          <p>Midterm exams will start next week. Please check your schedule.</p>
        </div>
      </div>
    </div>
  );
}
