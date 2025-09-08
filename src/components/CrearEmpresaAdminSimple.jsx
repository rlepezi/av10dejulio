import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CrearEmpresaAdminSimple() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Crear Nueva Empresa</h1>
            <button
              onClick={() => navigate('/admin/empresas')}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              ← Volver a Empresas
            </button>
          </div>

          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Formulario de Creación de Empresa
            </h2>
            <p className="text-gray-600 mb-8">
              Esta página está funcionando correctamente. El formulario completo se cargará aquí.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">✅ Página Funcionando</h3>
              <p className="text-blue-700">
                La ruta <code className="bg-blue-100 px-2 py-1 rounded">/admin/crear-empresa</code> está configurada correctamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

