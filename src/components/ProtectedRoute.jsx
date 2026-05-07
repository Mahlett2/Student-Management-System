import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // Use sessionStorage so auth clears on every new tab/refresh
  const auth = sessionStorage.getItem("auth");
  if (auth !== "true") return <Navigate to="/login" replace />;
  return children;
}
