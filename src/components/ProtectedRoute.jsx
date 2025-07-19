import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ children, rol }) {
  const { user, rol: userRol, loading } = useAuth();
  
  console.log("ProtectedRoute - User:", user?.email, "Required rol:", rol, "User rol:", userRol, "Loading:", loading);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Verificando permisos...</div>
      </div>
    );
  }
  
  if (!user) {
    console.log("ProtectedRoute - Redirecting to login: no user");
    return <Navigate to="/login" />;
  }
  
  if (rol && userRol !== rol) {
    console.log(`ProtectedRoute - Access denied: required ${rol}, user has ${userRol}`);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">
            Se requiere rol '{rol}' pero tienes rol '{userRol || 'ninguno'}'
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }
  
  console.log("ProtectedRoute - Access granted");
  return children;
}