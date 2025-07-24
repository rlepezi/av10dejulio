import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import FormularioAgenteEmpresa from './FormularioAgenteEmpresa';

export default function PanelAgente() {
  const { user } = useAuth();
  const [vistaActual, setVistaActual] = useState('dashboard');
  const [solicitudes, setSolicitudes] = useState([]);
  const [empresasActivadas, setEmpresasActivadas] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      cargarDatosAgente();
    }
  }, [user]);

  // Recargar datos cada vez que cambia la vista
  useEffect(() => {
    if (user && vistaActual === 'dashboard') {
      cargarDatosAgente();
    }
  }, [vistaActual, user]);

  const cargarDatosAgente = async () => {
    try {
      setLoading(true);
      
      // Primero, buscar los datos del agente usando su uid
      const qAgente = query(
        collection(db, 'agentes'),
        where('uid', '==', user.uid)
      );
      const agenteSnapshot = await getDocs(qAgente);
      
      if (agenteSnapshot.empty) {
        console.error('No se encontró el agente con uid:', user.uid);
        setLoading(false);
        return;
      }
      
      const agenteDoc = agenteSnapshot.docs[0];
      const agenteId = agenteDoc.id;
      const agenteData = agenteDoc.data();
      
      // Verificar permisos
      if (!agenteData.activo) {
        console.error('Agente desactivado');
        setLoading(false);
        return;
      }
      
      // Cargar solicitudes del agente usando el ID correcto
      const qSolicitudes = query(
        collection(db, 'solicitudes_empresa'),
        where('agente_id', '==', agenteId),
        orderBy('fecha_solicitud', 'desc')
      );
      const solicitudesSnapshot = await getDocs(qSolicitudes);
      const solicitudesData = solicitudesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSolicitudes(solicitudesData);

      // Cargar empresas activadas por el agente usando el ID correcto
      const qEmpresas = query(
        collection(db, 'empresas'),
        where('agente_id', '==', agenteId),
        orderBy('fecha_activacion', 'desc')
      );
      const empresasSnapshot = await getDocs(qEmpresas);
      const empresasData = empresasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmpresasActivadas(empresasData);

      // Calcular estadísticas
      const stats = {
        total_solicitudes: solicitudesData.length,
        pendientes: solicitudesData.filter(s => s.estado === 'pendiente').length,
        aprobadas: solicitudesData.filter(s => s.estado === 'aprobada').length,
        empresas_activas: empresasData.filter(e => e.estado === 'activa').length,
        empresas_inactivas: empresasData.filter(e => e.estado === 'inactiva').length
      };
      setEstadisticas(stats);

    } catch (error) {
      console.error('Error cargando datos del agente:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de agente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Panel de Agente</h1>
          <p className="text-gray-600">Gestiona solicitudes y empresas desde terreno</p>
        </div>
        <button
          onClick={cargarDatosAgente}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Actualizar</span>
        </button>
      </div>

      {/* Navegación */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setVistaActual('dashboard')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            vistaActual === 'dashboard' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setVistaActual('nuevo')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            vistaActual === 'nuevo' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ➕ Nueva Empresa
        </button>
        <button
          onClick={() => setVistaActual('solicitudes')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            vistaActual === 'solicitudes' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📋 Mis Solicitudes
        </button>
        <button
          onClick={() => setVistaActual('empresas')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            vistaActual === 'empresas' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🏢 Empresas Activadas
        </button>
      </div>

      {/* Contenido según vista */}
      {vistaActual === 'dashboard' && (
        <div className="space-y-6">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800">Total Solicitudes</h3>
              <p className="text-3xl font-bold text-blue-600">{estadisticas.total_solicitudes || 0}</p>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-800">Pendientes</h3>
              <p className="text-3xl font-bold text-yellow-600">{estadisticas.pendientes || 0}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-800">Empresas Activas</h3>
              <p className="text-3xl font-bold text-green-600">{estadisticas.empresas_activas || 0}</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-800">Aprobadas</h3>
              <p className="text-3xl font-bold text-purple-600">{estadisticas.aprobadas || 0}</p>
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Actividad Reciente</h3>
            </div>
            <div className="p-6">
              {solicitudes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay solicitudes registradas. ¡Comienza registrando tu primera empresa!
                </p>
              ) : (
                <div className="space-y-4">
                  {solicitudes.slice(0, 5).map(solicitud => (
                    <div key={solicitud.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-800">{solicitud.nombre}</h4>
                        <p className="text-sm text-gray-600">
                          {solicitud.categoria} • {formatearFecha(solicitud.fecha_solicitud)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        solicitud.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        solicitud.estado === 'aprobada' ? 'bg-green-100 text-green-800' :
                        solicitud.estado === 'rechazada' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {solicitud.estado}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {vistaActual === 'nuevo' && (
        <FormularioAgenteEmpresa 
          onSolicitudCreada={() => {
            // Refrescar datos cuando se crea una nueva solicitud
            cargarDatosAgente();
            // Cambiar a la vista de solicitudes para ver la nueva
            setVistaActual('solicitudes');
          }}
        />
      )}

      {vistaActual === 'solicitudes' && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">Mis Solicitudes</h3>
          </div>
          <div className="p-6">
            {solicitudes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay solicitudes registradas</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Empresa</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Categoría</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Contacto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudes.map(solicitud => (
                      <tr key={solicitud.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-800">{solicitud.nombre}</p>
                            <p className="text-sm text-gray-600">{solicitud.direccion}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{solicitud.categoria}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            solicitud.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                            solicitud.estado === 'aprobada' ? 'bg-green-100 text-green-800' :
                            solicitud.estado === 'rechazada' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {solicitud.estado}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {formatearFecha(solicitud.fecha_solicitud)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <p className="text-gray-800">{solicitud.email}</p>
                            <p className="text-gray-600">{solicitud.telefono}</p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {vistaActual === 'empresas' && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">Empresas Activadas</h3>
          </div>
          <div className="p-6">
            {empresasActivadas.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay empresas activadas</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {empresasActivadas.map(empresa => (
                  <div key={empresa.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-800">{empresa.nombre}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        empresa.estado === 'activa' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {empresa.estado}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Categoría:</span> {empresa.categoria}</p>
                      <p><span className="font-medium">Dirección:</span> {empresa.direccion}</p>
                      <p><span className="font-medium">Teléfono:</span> {empresa.telefono}</p>
                      <p><span className="font-medium">Activada:</span> {formatearFecha(empresa.fecha_activacion)}</p>
                    </div>
                    {empresa.web ? (
                      <a 
                        href={empresa.web.startsWith('http') ? empresa.web : `https://${empresa.web}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Ver sitio web →
                      </a>
                    ) : (
                      <a 
                        href={`/empresa/${empresa.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Ver perfil público →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
