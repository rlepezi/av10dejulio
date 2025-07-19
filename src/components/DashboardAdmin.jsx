import React from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboardStats from "./AdminDashboardStats";

export default function DashboardAdmin() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Estadísticas principales */}
      <AdminDashboardStats />
      
      {/* Panel de acciones rápidas */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Acciones Rápidas de Administración
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-semibold flex items-center gap-3 transition-colors"
              onClick={() => navigate("/admin/solicitudes-empresas")}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Gestionar Empresas
            </button>
            
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold flex items-center gap-3 transition-colors"
              onClick={() => navigate("/admin/solicitudes-campanas")}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              Gestionar Campañas
            </button>
            
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg font-semibold flex items-center gap-3 transition-colors"
              onClick={() => navigate("/admin/solicitudes-productos")}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Gestionar Productos
            </button>
            
            <button
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-4 rounded-lg font-semibold flex items-center gap-3 transition-colors"
              onClick={() => navigate("/admin/validacion-clientes")}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Validar Clientes
            </button>
            
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-lg font-semibold flex items-center gap-3 transition-colors"
              onClick={() => navigate("/admin/marcas")}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Gestionar Marcas
            </button>
            
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-lg font-semibold flex items-center gap-3 transition-colors"
              onClick={() => navigate("/admin/tipos-empresa")}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Tipos de Empresa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}