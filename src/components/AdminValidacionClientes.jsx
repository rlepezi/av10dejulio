import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import { NotificationService } from '../utils/notificationService';

export default function AdminValidacionClientes() {
  const { rol } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('pendiente_validacion');
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    pendientes: 0,
    activos: 0,
    rechazados: 0,
    suspendidos: 0
  });

  useEffect(() => {
    if (rol === 'admin') {
      loadSolicitudes();
      loadEstadisticas();
    }
  }, [rol, filtro]);

  const loadSolicitudes = async () => {
    try {
      setLoading(true);
      
      let solicitudesQuery;
      if (filtro === 'todas') {
        solicitudesQuery = query(
          collection(db, 'perfiles_clientes'),
          orderBy('fechaRegistro', 'desc')
        );
      } else {
        solicitudesQuery = query(
          collection(db, 'perfiles_clientes'),
          where('estado', '==', filtro),
          orderBy('fechaRegistro', 'desc')
        );
      }
      
      const solicitudesSnapshot = await getDocs(solicitudesQuery);
      const solicitudesData = solicitudesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setSolicitudes(solicitudesData);
      
    } catch (error) {
      console.error('Error loading solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEstadisticas = async () => {
    try {
      const todasQuery = query(collection(db, 'perfiles_clientes'));
      const todasSnapshot = await getDocs(todasQuery);
      const todas = todasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const stats = {
        total: todas.length,
        pendientes: todas.filter(p => p.estado === 'pendiente_validacion').length,
        activos: todas.filter(p => p.estado === 'activo').length,
        rechazados: todas.filter(p => p.estado === 'rechazado').length,
        suspendidos: todas.filter(p => p.estado === 'suspendido').length
      };
      
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const validarCliente = async (solicitudId, estado, obs = '') => {
    try {
      const solicitud = solicitudes.find(s => s.id === solicitudId);
      
      await updateDoc(doc(db, 'perfiles_clientes', solicitudId), {
        estado,
        validadoPor: 'admin', // En producción usar user.uid
        fechaValidacion: new Date(),
        observaciones: obs
      });
      
      // Enviar notificación al cliente
      await NotificationService.notifyClientValidationStatus(
        solicitud.userId,
        estado,
        obs
      );
      
      await loadSolicitudes();
      await loadEstadisticas();
      setShowModal(false);
      setObservaciones('');
      setSelectedSolicitud(null);
      
      // Mostrar mensaje de confirmación
      const mensajes = {
        'activo': 'Cliente validado exitosamente. Se ha enviado una notificación.',
        'rechazado': 'Cliente rechazado. Se ha enviado una notificación con el motivo.',
        'suspendido': 'Cliente suspendido. Se ha enviado una notificación.'
      };
      
      alert(mensajes[estado] || 'Estado actualizado');
      
    } catch (error) {
      console.error('Error validating client:', error);
      alert('Error al validar cliente');
    }
  };

  const handleValidacion = (solicitud, estado) => {
    setSelectedSolicitud(solicitud);
    if (estado === 'rechazado') {
      setShowModal(true);
    } else {
      validarCliente(solicitud.id, estado);
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'pendiente_validacion': 'bg-yellow-100 text-yellow-800',
      'activo': 'bg-green-100 text-green-800',
      'rechazado': 'bg-red-100 text-red-800',
      'suspendido': 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      'pendiente_validacion': 'Pendiente',
      'activo': 'Activo',
      'rechazado': 'Rechazado',
      'suspendido': 'Suspendido'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badges[estado]}`}>
        {labels[estado]}
      </span>
    );
  };

  const calcularDiasEspera = (fechaRegistro) => {
    const fecha = new Date(fechaRegistro.seconds * 1000);
    const hoy = new Date();
    const diferencia = hoy - fecha;
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  };

  if (rol !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Validación de Clientes</h1>
            <p className="text-gray-600">Gestiona las solicitudes de ingreso a la comunidad</p>
          </div>
        </div>

        {/* Panel de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Clientes</p>
                <p className="text-2xl font-bold text-blue-800">{estadisticas.total}</p>
              </div>
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-800">{estadisticas.pendientes}</p>
              </div>
              <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Activos</p>
                <p className="text-2xl font-bold text-green-800">{estadisticas.activos}</p>
              </div>
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Rechazados</p>
                <p className="text-2xl font-bold text-red-800">{estadisticas.rechazados}</p>
              </div>
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Suspendidos</p>
                <p className="text-2xl font-bold text-gray-800">{estadisticas.suspendidos}</p>
              </div>
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
          </div>
        </div>
          
        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          <select
            className="border rounded px-3 py-2"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          >
            <option value="pendiente_validacion">Pendientes</option>
            <option value="activo">Activos</option>
            <option value="rechazado">Rechazados</option>
            <option value="suspendido">Suspendidos</option>
            <option value="todas">Todas</option>
          </select>
        </div>

        {/* Lista de solicitudes */}
        <div className="space-y-4">
          {solicitudes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay solicitudes con el filtro seleccionado.</p>
            </div>
          ) : (
            solicitudes.map(solicitud => (
              <div key={solicitud.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {solicitud.nombres} {solicitud.apellidos}
                      </h3>
                      {getEstadoBadge(solicitud.estado)}
                      {solicitud.creado_desde_solicitud && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          📝 Desde solicitud
                        </span>
                      )}
                      {solicitud.estado === 'pendiente_validacion' && (
                        <span className="text-xs text-orange-600">
                          {calcularDiasEspera(solicitud.fechaRegistro)} días esperando
                        </span>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">RUT:</span>
                        <p className="font-medium">{solicitud.rut}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-medium">{solicitud.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Teléfono:</span>
                        <p className="font-medium">{solicitud.telefono}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Ubicación:</span>
                        <p className="font-medium">{solicitud.comuna}, {solicitud.region}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Tipo:</span>
                        <p className="font-medium">{solicitud.tipoCliente}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Fecha registro:</span>
                        <p className="font-medium">
                          {new Date(solicitud.fechaRegistro.seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {solicitud.motivoRegistro && (
                      <div className="mt-3 bg-gray-50 p-3 rounded">
                        <span className="text-sm font-medium text-gray-700">Motivo de registro:</span>
                        <p className="text-sm text-gray-600 mt-1">{solicitud.motivoRegistro}</p>
                      </div>
                    )}
                    
                    {solicitud.creado_desde_solicitud && solicitud.solicitud_original_id && (
                      <div className="mt-3 bg-blue-50 p-3 rounded">
                        <span className="text-sm font-medium text-blue-700">Cliente creado desde solicitud:</span>
                        <a 
                          href={`/admin/solicitudes-cliente?highlight=${solicitud.solicitud_original_id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 underline ml-2"
                          target="_blank"
                        >
                          Ver solicitud original →
                        </a>
                      </div>
                    )}
                    
                    {solicitud.observaciones && (
                      <div className="mt-3 bg-red-50 p-3 rounded">
                        <span className="text-sm font-medium text-red-700">Observaciones:</span>
                        <p className="text-sm text-red-600 mt-1">{solicitud.observaciones}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Acciones */}
                {solicitud.estado === 'pendiente_validacion' && (
                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      onClick={() => handleValidacion(solicitud, 'activo')}
                    >
                      ✅ Aprobar
                    </button>
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                      onClick={() => handleValidacion(solicitud, 'rechazado')}
                    >
                      ❌ Rechazar
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                      📧 Contactar
                    </button>
                    <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                      📋 Ver Historial
                    </button>
                  </div>
                )}
                
                {solicitud.estado === 'activo' && (
                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                      onClick={() => handleValidacion(solicitud, 'suspendido')}
                    >
                      ⏸️ Suspender
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                      👁️ Ver Actividad
                    </button>
                  </div>
                )}
                
                {solicitud.estado === 'suspendido' && (
                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      onClick={() => handleValidacion(solicitud, 'activo')}
                    >
                      ▶️ Reactivar
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal para observaciones de rechazo */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Motivo del Rechazo</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Explica el motivo del rechazo:
              </label>
              <textarea
                rows="4"
                className="w-full border rounded px-3 py-2"
                placeholder="Especifica las razones por las cuales no se puede aprobar esta solicitud..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                required
              />
            </div>
            
            <div className="flex gap-2">
              <button
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50"
                onClick={() => {
                  setShowModal(false);
                  setObservaciones('');
                  setSelectedSolicitud(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                onClick={() => {
                  if (observaciones.trim()) {
                    validarCliente(selectedSolicitud.id, 'rechazado', observaciones);
                  } else {
                    alert('Debes especificar el motivo del rechazo');
                  }
                }}
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
