import React from "react";
import { useAuth } from "./AuthProvider";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const { user, rol } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    auth.signOut();
    navigate("/login");
  }

  return (
    <header className="flex items-center justify-between bg-blue-50 border-b px-8 h-16">
      <div className="font-bold text-blue-900 text-lg">Panel {rol === "admin" ? "Administrador" : "Proveedor"}</div>
      <div className="flex items-center gap-4">
        <span className="text-blue-800">{user?.email}</span>
        
      </div>
    </header>
  );
}