import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

function AdminSolicitudesCampana() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');

  useEffect(() => {
    console.log('🔍 AdminSolicitudesCampana montado, cargando solicitudes...');
    cargarSolicitudes();
  }, [filter]);

  const cargarSolicitudes = async () => {
    try {
      console.log('🔄 Cargando solicitudes de campañas con filtro:', filter);
      setLoading(true);
      let q;
      
      if (filter === 'todos') {
        q = collection(db, 'solicitudes_campana');
        console.log('🔍 Consultando todas las solicitudes de campañas');
      } else {
        q = query(
          collection(db, 'solicitudes_campana'),
          where('estado', '==', filter)
        );
        console.log('🔍 Consultando solicitudes de campañas con estado:', filter);
      }
      
      const snapshot = await getDocs(q);
      console.log('📢 Solicitudes de campañas encontradas:', snapshot.size);
      
      const solicitudesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('📢 Datos de solicitudes de campañas:', solicitudesData);
      
      // Ordenar por fecha de solicitud (más recientes primero)
      solicitudesData.sort((a, b) => {
        if (a.fechaSolicitud && b.fechaSolicitud) {
          return new Date(b.fechaSolicitud.toDate()) - new Date(a.fechaSolicitud.toDate());
        }
        return 0;
      });
      
      setSolicitudes(solicitudesData);
    } catch (error) {
      console.error('Error cargando solicitudes de campañas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (solicitudId, nuevoEstado) => {
    try {
      const solicitudRef = doc(db, 'solicitudes_campana', solicitudId);
      await updateDoc(solicitudRef, {
        estado: nuevoEstado,
        fecha_revision: new Date(),
        revisado_por: 'admin'
      });
      
      // Recargar solicitudes
      cargarSolicitudes();
      
      // Mostrar mensaje de éxito
      alert(`Solicitud de campaña ${nuevoEstado === 'aprobado' ? 'aprobada' : 'rechazada'} exitosamente`);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado de la solicitud');
    }
  };

  const eliminarSolicitud = async (solicitudId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta solicitud de campaña?')) {
      try {
        await deleteDoc(doc(db, 'solicitudes_campana', solicitudId));
        cargarSolicitudes();
        alert('Solicitud de campaña eliminada exitosamente');
      } catch (error) {
        console.error('Error eliminando solicitud:', error);
        alert('Error al eliminar la solicitud');
      }
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_revision':
        return 'bg-blue-100 text-blue-800';
      case 'aprobado':
        return 'bg-green-100 text-green-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_revision':
        return 'En Revisión';
      case 'aprobado':
        return 'Aprobado';
      case 'rechazado':
        return 'Rechazado';
      default:
        return estado || 'Sin estado';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando solicitudes de campañas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_revision">En Revisión</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
          </select>
          
          <button
            onClick={cargarSolicitudes}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {solicitudes.filter(s => s.estado === 'pendiente').length}
          </div>
          <div className="text-sm text-gray-600">Pendientes</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">
            {solicitudes.filter(s => s.estado === 'en_revision').length}
          </div>
          <div className="text-sm text-gray-600">En Revisión</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">
            {solicitudes.filter(s => s.estado === 'aprobado').length}
          </div>
          <div className="text-sm text-gray-600">Aprobadas</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">
            {solicitudes.filter(s => s.estado === 'rechazado').length}
          </div>
          <div className="text-sm text-gray-600">Rechazadas</div>
        </div>
      </div>

      {/* Lista de solicitudes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Solicitudes de Campañas ({solicitudes.length})
          </h3>
        </div>
        
        {solicitudes.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No hay solicitudes de campañas para mostrar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaña
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {solicitudes.map((solicitud) => (
                  <tr key={solicitud.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {solicitud.nombre || solicitud.nombre_campana || solicitud.titulo || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {solicitud.descripcion || 'Sin descripción'}
                        </div>
                        {solicitud.tipo && (
                          <div className="text-sm text-gray-500">
                            Tipo: {solicitud.tipo}
                          </div>
                        )}
                        {solicitud.presupuesto && (
                          <div className="text-sm text-gray-500">
                            Presupuesto: ${solicitud.presupuesto.toLocaleString()}
                          </div>
                        )}
                        {solicitud.fechaInicio && (
                          <div className="text-sm text-gray-500">
                            Inicio: {new Date(solicitud.fechaInicio.toDate()).toLocaleDateString('es-ES')}
                          </div>
                        )}
                        {solicitud.fechaFin && (
                          <div className="text-sm text-gray-500">
                            Fin: {new Date(solicitud.fechaFin.toDate()).toLocaleDateString('es-ES')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {solicitud.nombre_empresa || solicitud.nombre_proveedor || solicitud.empresaNombre || 'Sin nombre'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {solicitud.email_proveedor || solicitud.email_empresa || solicitud.email || 'Sin email'}
                      </div>
                      {solicitud.empresaId && (
                        <div className="text-xs text-gray-400">
                          ID: {solicitud.empresaId}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(solicitud.estado)}`}>
                        {getEstadoTexto(solicitud.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {solicitud.fechaSolicitud ? 
                        new Date(solicitud.fechaSolicitud.toDate()).toLocaleDateString('es-ES') : 
                        'Sin fecha'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {solicitud.estado === 'pendiente' && (
                          <>
                            <button
                              onClick={() => cambiarEstado(solicitud.id, 'aprobado')}
                              className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-1 rounded text-xs"
                            >
                              ✅ Aprobar
                            </button>
                            <button
                              onClick={() => cambiarEstado(solicitud.id, 'rechazado')}
                              className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2 py-1 rounded text-xs"
                            >
                              ❌ Rechazar
                            </button>
                          </>
                        )}
                        {solicitud.estado === 'en_revision' && (
                          <>
                            <button
                              onClick={() => cambiarEstado(solicitud.id, 'aprobado')}
                              className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-1 rounded text-xs"
                            >
                              ✅ Aprobar
                            </button>
                            <button
                              onClick={() => cambiarEstado(solicitud.id, 'rechazado')}
                              className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2 py-1 rounded text-xs"
                            >
                              ❌ Rechazar
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => eliminarSolicitud(solicitud.id)}
                          className="text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs"
                        >
                          🗑️ Eliminar
                        </button>
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
  );
}

export default AdminSolicitudesCampana;

