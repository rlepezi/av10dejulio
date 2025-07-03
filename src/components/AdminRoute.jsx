import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";


export default function AdminRoute({ children }) {
  const { user, rol, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  return user && rol === "admin" ? children : <Navigate to="/login" />;
}