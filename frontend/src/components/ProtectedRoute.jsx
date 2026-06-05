import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem("jwtToken");
  const storedUser = localStorage.getItem("user");
  const role = storedUser ? JSON.parse(storedUser).role : null;
  const location = useLocation();

  if (!token || !role || !allowedRoles.includes(role)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
