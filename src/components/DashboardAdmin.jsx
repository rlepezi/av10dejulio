import React from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardAdmin() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-white to-blue-100 py-10">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-green-900 mb-6 text-center">
          Panel del Administradorx
        </h2>
        <div className="flex flex-col gap-4">
          <button
            className="bg-green-600 hover:bg-green-800 text-white px-4 py-2 rounded font-semibold"
            onClick={() => navigate("/admin/solicitudes-empresas")}
          >
            Gestionar Empresas
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-800 text-white px-4 py-2 rounded font-semibold"
            onClick={() => navigate("/admin/solicitudes-campanas")}
          >
            Gestionar Campañas
          </button>
          <button
            className="bg-purple-600 hover:bg-purple-800 text-white px-4 py-2 rounded font-semibold"
            onClick={() => navigate("/admin/solicitudes-productos")}
          >
            Gestionar Productos
          </button>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-green-900 px-4 py-2 rounded font-semibold"
            onClick={() => navigate("/admin")}
          >
            Ir al Dashboard General
          </button>
        </div>
      </div>
    </div>
  );
}