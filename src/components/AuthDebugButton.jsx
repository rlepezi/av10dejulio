import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

export default function AuthDebugButton() {
  const { user, rol, loading, error } = useAuth();
  const [showDebug, setShowDebug] = useState(false);

  if (!user) return null; // Solo mostrar si hay usuario autenticado

  return (
    <>
      {/* Botón flotante discreto */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-4 left-4 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-50 hover:opacity-100 transition-opacity z-40"
        title="Debug AuthProvider"
      >
        🔧 Auth
      </button>

      {/* Modal de debug */}
      {showDebug && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Debug AuthProvider</h3>
              <button
                onClick={() => setShowDebug(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Estado de carga */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Estado de Carga</h4>
                <div className="bg-gray-100 p-3 rounded">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                  {loading ? 'Cargando...' : 'Cargado'}
                </div>
              </div>

              {/* Usuario */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Usuario</h4>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  {user ? (
                    <div className="space-y-1">
                      <p><strong>UID:</strong> {user.uid}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>Email Verificado:</strong> {user.emailVerified ? 'Sí' : 'No'}</p>
                      <p><strong>Proveedor:</strong> {user.providerData?.[0]?.providerId || 'N/A'}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">No autenticado</p>
                  )}
                </div>
              </div>

              {/* Rol */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Rol</h4>
                <div className="bg-gray-100 p-3 rounded">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    rol === 'admin' ? 'bg-red-100 text-red-800' :
                    rol === 'agente' ? 'bg-blue-100 text-blue-800' :
                    rol === 'cliente' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {rol || 'Sin rol asignado'}
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Error</h4>
                  <div className="bg-red-100 border border-red-200 p-3 rounded text-sm text-red-800">
                    {error}
                  </div>
                </div>
              )}

              {/* Información adicional */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Información Adicional</h4>
                <div className="bg-gray-100 p-3 rounded text-sm space-y-1">
                  <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
                  <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</p>
                  <p><strong>URL:</strong> {window.location.href}</p>
                </div>
              </div>

              {/* Acciones de debug */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Acciones</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      console.log('AuthProvider Debug Info:', {
                        user,
                        rol,
                        loading,
                        error,
                        timestamp: new Date().toISOString()
                      });
                      alert('Información enviada a la consola');
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700"
                  >
                    📋 Log a Consola
                  </button>
                  
                  <button
                    onClick={() => {
                      const debugInfo = {
                        user: user ? {
                          uid: user.uid,
                          email: user.email,
                          emailVerified: user.emailVerified,
                          provider: user.providerData?.[0]?.providerId
                        } : null,
                        rol,
                        loading,
                        error,
                        timestamp: new Date().toISOString(),
                        url: window.location.href
                      };
                      
                      navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
                      alert('Información copiada al portapapeles');
                    }}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded text-sm hover:bg-green-700"
                  >
                    📋 Copiar Info
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
