import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ children, rol }) {
  const { user, rol: userRol } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (rol && userRol !== rol) return <Navigate to="/login" />;
  return children;
}