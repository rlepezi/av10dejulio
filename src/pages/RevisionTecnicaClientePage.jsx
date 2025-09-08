import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import AgendarRevisionTecnica from '../components/AgendarRevisionTecnica';

const RevisionTecnicaClientePage = () => {
  const navigate = useNavigate();
  const { user, rol } = useAuth();

  // Verificar si el usuario está autenticado y tiene rol de cliente
  if (!user || rol !== 'cliente') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-4">Esta funcionalidad es solo para clientes autenticados</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🔧 Revisión Técnica
              </h1>
              <p className="text-gray-600">
                Agenda tu cita de revisión técnica
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/dashboard/cliente')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                ← Volver al Dashboard
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Ir al Sitio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AgendarRevisionTecnica />
      </div>
    </div>
  );
};

export default RevisionTecnicaClientePage;

