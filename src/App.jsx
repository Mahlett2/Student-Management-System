import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import StudentPortal from "./pages/Student/StudentPortal";
import Dashboard from "./pages/Dashboard";

import StudentProfile from "./pages/Student/Profile";
import StudentGrades from "./pages/Student/Grades";
import StudentRegister from "./pages/Student/Register";
import AddDrop from "./pages/Student/AddDrop";
import AnnouncementPage from "./pages/Announcement";

import TeacherPortal from "./pages/Teacher/TeacherPortal";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/login" element={<Login />} />
      <Route path="/student-login" element={<Login />} />

      {/* STUDENT PORTAL */}
      <Route
        path="/student-portal"
        element={
          <ProtectedRoute>
            <StudentPortal />
          </ProtectedRoute>
        }
      />

      {/* STUDENT SUB PAGES */}
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute>
            <StudentProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/grades"
        element={
          <ProtectedRoute>
            <StudentGrades />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/register"
        element={
          <ProtectedRoute>
            <StudentRegister />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/adddrop"
        element={
          <ProtectedRoute>
            <AddDrop />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/announcements"
        element={
          <ProtectedRoute>
            <AnnouncementPage role="student" />
          </ProtectedRoute>
        }
      />

      {/* TEACHER PORTAL */}
      <Route
        path="/teacher-portal"
        element={
          <ProtectedRoute>
            <TeacherPortal />
          </ProtectedRoute>
        }
      />

      {/* DASHBOARD */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* FALLBACK */}
      <Route path="*" element={<Login />} />
    </Routes>
  );
}

export default App;
