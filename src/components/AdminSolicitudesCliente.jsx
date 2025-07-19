import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import { NotificationService } from '../utils/notificationService';
import { UserCreationService } from '../utils/userCreationService';

export default function AdminSolicitudesCliente() {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [procesandoEtapa, setProcesandoEtapa] = useState(false);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      const q = query(
        collection(db, 'solicitudes_cliente'),
        orderBy('fecha_solicitud', 'desc')
      );
      const snapshot = await getDocs(q);
      const solicitudesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSolicitudes(solicitudesData);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const actualizarEtapa = async (solicitudId, etapaKey, nuevoEstado, comentarios = '') => {
    setProcesandoEtapa(true);
    try {
      const solicitud = solicitudes.find(s => s.id === solicitudId);
      const etapasActualizadas = { ...solicitud.etapas };
      
      // Actualizar la etapa actual
      etapasActualizadas[etapaKey] = {
        ...etapasActualizadas[etapaKey],
        estado: nuevoEstado,
        fecha_fin: nuevoEstado === 'completada' ? new Date() : null,
        comentarios,
        responsable: user.email
      };

      // Calcular nuevo progreso - Solo 2 etapas: validacion_datos y confirmacion_final
      const etapasOrdenadas = ['validacion_datos', 'confirmacion_final'];
      const etapasCompletadas = etapasOrdenadas.filter(key => 
        etapasActualizadas[key]?.estado === 'completada'
      ).length;
      const nuevoPorcentaje = Math.round((etapasCompletadas / etapasOrdenadas.length) * 100);

      // Determinar estado general
      let estadoGeneral = 'en_revision';
      if (nuevoEstado === 'rechazada') {
        estadoGeneral = 'rechazada';
      } else if (etapaKey === 'confirmacion_final' && nuevoEstado === 'completada') {
        estadoGeneral = 'aprobada';
      }

      // Si se aprueba la solicitud final, crear el usuario
      if (etapaKey === 'confirmacion_final' && nuevoEstado === 'completada') {
        const resultadoCreacion = await UserCreationService.createClientUser({
          ...solicitud,
          id: solicitudId
        });

        if (resultadoCreacion.success) {
          // Actualizar la solicitud con la información del usuario creado
          await updateDoc(doc(db, 'solicitudes_cliente', solicitudId), {
            etapas: etapasActualizadas,
            progreso_porcentaje: 100,
            estado_general: 'aprobada',
            etapa_actual: 'confirmacion_final',
            usuario_creado: true,
            uid_usuario: resultadoCreacion.uid,
            fecha_activacion: new Date(),
            perfil_id: resultadoCreacion.profileId
          });

          // Notificar al cliente que su cuenta está lista
          await NotificationService.createInAppNotification(
            resultadoCreacion.uid,
            'validacion',
            '¡Cuenta activada! Bienvenido a AV10 de Julio',
            'Tu cuenta de cliente ha sido creada exitosamente. Ya puedes iniciar sesión y gestionar tus vehículos.',
            {
              solicitudId,
              uid: resultadoCreacion.uid,
              email: resultadoCreacion.email,
              origen: 'cuenta_activada'
            }
          );

          alert(`Usuario creado exitosamente para ${solicitud.nombres} ${solicitud.apellidos}`);
        } else {
          // Error al crear usuario
          alert(`Error al crear usuario: ${resultadoCreacion.error}`);
          return;
        }
      } else {
        // Actualización normal de etapa
        await updateDoc(doc(db, 'solicitudes_cliente', solicitudId), {
          etapas: etapasActualizadas,
          progreso_porcentaje: nuevoPorcentaje,
          estado_general: estadoGeneral,
          etapa_actual: etapaKey
        });
      }

      // Enviar notificación al cliente
      await NotificationService.createInAppNotification(
        solicitud.uid || solicitud.email,
        'validacion',
        'Actualización en tu solicitud',
        `La etapa "${etapaKey}" ha sido ${nuevoEstado === 'completada' ? 'completada' : 'actualizada'}`,
        {
          solicitudId,
          etapa: etapaKey,
          estado: nuevoEstado,
          origen: 'admin_solicitudes_cliente'
        }
      );

      // Recargar solicitudes
      await cargarSolicitudes();
      
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Error al actualizar la etapa: ' + error.message);
    } finally {
      setProcesandoEtapa(false);
    }
  };

  const solicitudesFiltradas = solicitudes.filter(solicitud => {
    if (filter === 'all') return true;
    return solicitud.estado_general === filter;
  });

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'enviada': return 'bg-blue-100 text-blue-800';
      case 'en_revision': return 'bg-yellow-100 text-yellow-800';
      case 'aprobada': return 'bg-green-100 text-green-800';
      case 'rechazada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Cliente</h1>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">Todas las solicitudes</option>
            <option value="enviada">Enviadas</option>
            <option value="en_revision">En revisión</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: solicitudes.length, color: 'bg-blue-500' },
          { label: 'Pendientes', value: solicitudes.filter(s => s.estado_general === 'enviada').length, color: 'bg-yellow-500' },
          { label: 'En Revisión', value: solicitudes.filter(s => s.estado_general === 'en_revision').length, color: 'bg-orange-500' },
          { label: 'Aprobadas', value: solicitudes.filter(s => s.estado_general === 'aprobada').length, color: 'bg-green-500' }
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full ${stat.color} mr-3`}></div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lista de solicitudes */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Etapa Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progreso
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
              {solicitudesFiltradas.map((solicitud) => (
                <tr key={solicitud.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {solicitud.nombres} {solicitud.apellidos}
                      </div>
                      <div className="text-sm text-gray-500">{solicitud.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(solicitud.estado_general)}`}>
                      {solicitud.estado_general}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {solicitud.etapa_actual?.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${solicitud.progreso_porcentaje || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{solicitud.progreso_porcentaje || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {solicitud.fecha_solicitud?.toDate ? 
                      solicitud.fecha_solicitud.toDate().toLocaleDateString() : 
                      'N/A'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSolicitudSeleccionada(solicitud)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalles */}
      {solicitudSeleccionada && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Detalle de Solicitud - {solicitudSeleccionada.nombres} {solicitudSeleccionada.apellidos}
              </h3>
              <button
                onClick={() => setSolicitudSeleccionada(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Información del cliente */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Información Personal</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">RUT:</span> {solicitudSeleccionada.rut}</p>
                  <p><span className="font-medium">Email:</span> {solicitudSeleccionada.email}</p>
                  <p><span className="font-medium">Teléfono:</span> {solicitudSeleccionada.telefono}</p>
                  <p><span className="font-medium">Dirección:</span> {solicitudSeleccionada.direccion}</p>
                  <p><span className="font-medium">Comuna:</span> {solicitudSeleccionada.comuna}</p>
                  <p><span className="font-medium">Región:</span> {solicitudSeleccionada.region}</p>
                  {solicitudSeleccionada.profesion && (
                    <p><span className="font-medium">Profesión:</span> {solicitudSeleccionada.profesion}</p>
                  )}
                  {solicitudSeleccionada.empresa && (
                    <p><span className="font-medium">Empresa:</span> {solicitudSeleccionada.empresa}</p>
                  )}
                </div>

                {solicitudSeleccionada.servicios_interes?.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Servicios de Interés</h5>
                    <div className="flex flex-wrap gap-1">
                      {solicitudSeleccionada.servicios_interes.map(servicio => (
                        <span key={servicio} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {servicio}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {solicitudSeleccionada.motivo_registro && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Motivo de Registro</h5>
                    <p className="text-sm text-gray-600">{solicitudSeleccionada.motivo_registro}</p>
                  </div>
                )}
              </div>

              {/* Gestión de etapas */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Gestión de Etapas</h4>
                
                {/* Solo mostrar las 2 etapas simplificadas */}
                {['validacion_datos', 'confirmacion_final'].map((etapaKey) => {
                  const etapa = solicitudSeleccionada.etapas?.[etapaKey] || { estado: 'pendiente' };
                  const etapaNombres = {
                    validacion_datos: 'Validación de Datos',
                    confirmacion_final: 'Confirmación Final'
                  };

                  return (
                    <div key={etapaKey} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium text-gray-900">{etapaNombres[etapaKey]}</h5>
                        <span className={`px-2 py-1 rounded text-xs ${
                          etapa.estado === 'completada' ? 'bg-green-100 text-green-800' :
                          etapa.estado === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                          etapa.estado === 'rechazada' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {etapa.estado}
                        </span>
                      </div>
                      
                      {etapaKey === 'validacion_datos' && (
                        <div className="text-sm text-gray-600 mb-2">
                          Revisar datos personales, documentos de identidad y dirección
                        </div>
                      )}
                      
                      {etapaKey === 'confirmacion_final' && (
                        <div className="text-sm text-gray-600 mb-2">
                          Aprobar solicitud y crear cuenta de usuario en el sistema
                        </div>
                      )}
                      
                      {etapa.estado === 'pendiente' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => actualizarEtapa(solicitudSeleccionada.id, etapaKey, 'completada')}
                            disabled={procesandoEtapa}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                          >
                            Completar
                          </button>
                          <button
                            onClick={() => actualizarEtapa(solicitudSeleccionada.id, etapaKey, 'rechazada', 'Rechazada por admin')}
                            disabled={procesandoEtapa}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}

                      {etapa.comentarios && (
                        <p className="text-xs text-gray-600 mt-2">{etapa.comentarios}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
