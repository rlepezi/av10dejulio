import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { auth } from "../firebase";

export default function HeaderMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, rol } = useAuth();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  // Para subrayar el link activo
  const activeClass = (path) =>
    location.pathname === path ? "underline font-bold" : "hover:underline";

  // Solo admin logueado y en proveedores: empresas, campañas, productos
  const isInProveedores =
    location.pathname === "/proveedores" ||
    location.pathname.startsWith("/proveedores/");

  // Proveedores: envía al Dashboard correcto según el rol
  const handleProveedoresClick = () => {
    if (rol === "admin") {
      navigate("/admin");
    } else if (rol === "proveedor") {
      navigate("/dashboard/proveedor");
    } else {
      navigate("/proveedores");
    }
  };

  return (
    <nav className="w-full bg-blue-800 text-white flex items-center px-6 py-3 shadow justify-between z-20">
      <div className="flex items-center gap-4">
        <button className={activeClass("/")} onClick={() => navigate("/")}>
          Inicio
        </button>
        <button
          className={activeClass("/proveedores")}
          onClick={handleProveedoresClick}
        >
          Proveedores
        </button>
        {/* Solo admin logueado y en proveedores: empresas, campañas, productos */}
        {user && rol === "admin" && isInProveedores && (
          <>
            <button
              className="hover:underline"
              onClick={() => navigate("/admin/ingresar-empresa")}
            >
              Ingresar empresa
            </button>
            <button
              className="hover:underline"
              onClick={() => navigate("/admin/ingresar-campana")}
            >
              Ingresar campaña
            </button>
            <button
              className="hover:underline"
              onClick={() => navigate("/admin/ingresar-producto")}
            >
              Ingresar producto
            </button>
          </>
        )}
      </div>
      <div>
        {!user && (
          <button
            className="bg-white text-blue-800 rounded px-4 py-1 font-semibold"
            onClick={() => navigate("/login?tipo=proveedor")}
          >
            Iniciar sesión
          </button>
        )}
        {user && (
          <button
            className="bg-red-600 hover:bg-red-800 text-white rounded px-4 py-1 font-semibold"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        )}
      </div>
    </nav>
  );
}