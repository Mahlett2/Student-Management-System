import { Navigate } from "react-router-dom";
import { getAccessToken } from "../api/client";

/**
 * Checks both sessionStorage auth flag AND a valid JWT token.
 * If either is missing, redirect to /login.
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const auth = sessionStorage.getItem("auth");
  const token = getAccessToken();
  const role = localStorage.getItem("role");

  // Must have both the auth flag and a token
  if (auth !== "true" || !token) {
    return <Navigate to="/login" replace />;
  }

  // Optional role check — e.g. requiredRole="admin" blocks teachers/students
  if (requiredRole && role !== requiredRole) {
    // Redirect to the correct portal based on actual role
    if (role === "teacher") return <Navigate to="/teacher-portal" replace />;
    if (role === "student") return <Navigate to="/student-portal" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
