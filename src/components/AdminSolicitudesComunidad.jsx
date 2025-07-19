import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc,
  query, 
  orderBy, 
  where 
} from 'firebase/firestore';

export default function AdminSolicitudesComunidad() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'solicitudes_comunidad'), 
      orderBy('fecha_solicitud', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const solicitudesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSolicitudes(solicitudesData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const actualizarEstado = async (solicitudId, nuevoEstado, etapa = null) => {
    try {
      const updateData = {
        estado_general: nuevoEstado,
        fecha_actualizacion: new Date()
      };

      // Actualizar progreso basado en el estado
      switch (nuevoEstado) {
        case 'en_revision':
          updateData.progreso_porcentaje = 50;
          break;
        case 'documentos_aprobados':
          updateData.progreso_porcentaje = 75;
          if (etapa) {
            updateData[`etapas.${etapa}`] = 'completada';
          }
          break;
        case 'aprobada':
          updateData.progreso_porcentaje = 100;
          updateData.etapas = {
            documentos: 'completada',
            validacion_comercial: 'completada',
            visita_campo: 'completada',
            decision_final: 'completada'
          };
          break;
        case 'rechazada':
          updateData.progreso_porcentaje = 0;
          break;
        default:
          break;
      }

      await updateDoc(doc(db, 'solicitudes_comunidad', solicitudId), updateData);

      // Si se aprueba, crear la empresa en la comunidad
      if (nuevoEstado === 'aprobada') {
        await crearEmpresaComunidad(solicitudId);
      }

      alert('Estado actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar el estado');
    }
  };

  const crearEmpresaComunidad = async (solicitudId) => {
    try {
      const solicitud = solicitudes.find(s => s.id === solicitudId);
      if (!solicitud) return;

      // Crear empresa en la comunidad
      const empresaData = {
        nombre: solicitud.nombre_empresa,
        rut: solicitud.rut_empresa,
        direccion: solicitud.direccion,
        telefono: solicitud.telefono,
        email: solicitud.email,
        sitio_web: solicitud.sitio_web,
        categoria: solicitud.categoria,
        marcas: solicitud.marcas,
        descripcion: solicitud.descripcion_servicios,
        horario_atencion: solicitud.horario_atencion,
        logo_url: solicitud.logo_url,
        
        // Datos del representante
        representante_legal: {
          nombre: solicitud.nombre_representante,
          rut: solicitud.rut_representante,
          cargo: solicitud.cargo_representante,
          telefono: solicitud.telefono_representante,
          email: solicitud.email_representante
        },

        // Estado y configuración
        estado: 'activa',
        tipo_empresa: 'comunidad',
        es_comunidad: true,
        fecha_ingreso_comunidad: new Date(),
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
        solicitud_origen_id: solicitudId,

        // Información adicional
        años_experiencia: solicitud.años_experiencia,
        numero_empleados: solicitud.numero_empleados,
        documentacion: {
          constitucion: solicitud.documento_constitucion,
          vigencia: solicitud.certificado_vigencia,
          autorizacion_sectorial: solicitud.autorizacion_sectorial
        }
      };

      await addDoc(collection(db, 'empresas'), empresaData);
      
      // También crear usuario para la empresa si no existe
      // Esto se podría hacer en un endpoint separado
      
      console.log('Empresa creada exitosamente en la comunidad');
    } catch (error) {
      console.error('Error creando empresa en comunidad:', error);
      throw error;
    }
  };

  const agregarObservacion = async (solicitudId, observacion) => {
    try {
      await updateDoc(doc(db, 'solicitudes_comunidad', solicitudId), {
        observaciones_admin: observacion,
        fecha_actualizacion: new Date()
      });
      alert('Observación agregada exitosamente');
      setMostrarModal(false);
    } catch (error) {
      console.error('Error agregando observación:', error);
      alert('Error al agregar la observación');
    }
  };

  const solicitudesFiltradas = solicitudes.filter(solicitud => {
    if (!filtroEstado) return true;
    return solicitud.estado_general === filtroEstado;
  });

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente_revision':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_revision':
        return 'bg-blue-100 text-blue-800';
      case 'documentos_aprobados':
        return 'bg-purple-100 text-purple-800';
      case 'aprobada':
        return 'bg-green-100 text-green-800';
      case 'rechazada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'pendiente_revision':
        return 'Pendiente Revisión';
      case 'en_revision':
        return 'En Revisión';
      case 'documentos_aprobados':
        return 'Documentos Aprobados';
      case 'aprobada':
        return 'Aprobada';
      case 'rechazada':
        return 'Rechazada';
      default:
        return estado;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Solicitudes para Unirse a la Comunidad
        </h2>
        <p className="text-gray-600">
          Gestiona las solicitudes de empresas que quieren formar parte de la comunidad AV10 de Julio.
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente_revision">Pendiente Revisión</option>
          <option value="en_revision">En Revisión</option>
          <option value="documentos_aprobados">Documentos Aprobados</option>
          <option value="aprobada">Aprobadas</option>
          <option value="rechazada">Rechazadas</option>
        </select>

        <div className="text-sm text-gray-600">
          Total: {solicitudesFiltradas.length} solicitudes
        </div>
      </div>

      {/* Lista de solicitudes */}
      <div className="grid gap-6">
        {solicitudesFiltradas.map(solicitud => (
          <div key={solicitud.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-1">
                  {solicitud.nombre_empresa}
                </h3>
                <p className="text-gray-600">RUT: {solicitud.rut_empresa}</p>
                <p className="text-gray-600">
                  Fecha: {solicitud.fecha_solicitud?.toDate?.()?.toLocaleDateString() || 'N/A'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(solicitud.estado_general)}`}>
                  {getEstadoTexto(solicitud.estado_general)}
                </span>
                <div className="text-sm text-gray-600">
                  {solicitud.progreso_porcentaje}% completado
                </div>
              </div>
            </div>

            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Categoría</p>
                <p className="text-gray-600">{solicitud.categoria}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Dirección</p>
                <p className="text-gray-600">{solicitud.direccion}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Representante</p>
                <p className="text-gray-600">{solicitud.nombre_representante}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-gray-600">{solicitud.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Teléfono</p>
                <p className="text-gray-600">{solicitud.telefono}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Experiencia</p>
                <p className="text-gray-600">{solicitud.años_experiencia} años</p>
              </div>
            </div>

            {/* Progreso de etapas */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Progreso de Validación</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(solicitud.etapas || {}).map(([etapa, estado]) => (
                  <div key={etapa} className="text-center">
                    <div className={`h-2 rounded-full mb-1 ${
                      estado === 'completada' ? 'bg-green-500' : 
                      estado === 'en_proceso' ? 'bg-yellow-500' : 'bg-gray-300'
                    }`}></div>
                    <p className="text-xs text-gray-600 capitalize">
                      {etapa.replace('_', ' ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Observaciones */}
            {solicitud.observaciones_admin && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm font-medium text-yellow-800 mb-1">Observaciones:</p>
                <p className="text-sm text-yellow-700">{solicitud.observaciones_admin}</p>
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSolicitudSeleccionada(solicitud);
                  setMostrarModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Ver Detalles
              </button>

              {solicitud.estado_general === 'pendiente_revision' && (
                <button
                  onClick={() => actualizarEstado(solicitud.id, 'en_revision')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
                >
                  Iniciar Revisión
                </button>
              )}

              {solicitud.estado_general === 'en_revision' && (
                <>
                  <button
                    onClick={() => actualizarEstado(solicitud.id, 'documentos_aprobados', 'documentos')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                  >
                    Aprobar Documentos
                  </button>
                  <button
                    onClick={() => actualizarEstado(solicitud.id, 'rechazada')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    Rechazar
                  </button>
                </>
              )}

              {solicitud.estado_general === 'documentos_aprobados' && (
                <button
                  onClick={() => actualizarEstado(solicitud.id, 'aprobada')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  Aprobar e Integrar a Comunidad
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {solicitudesFiltradas.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No hay solicitudes que coincidan con los filtros seleccionados.</p>
        </div>
      )}

      {/* Modal de detalles */}
      {mostrarModal && solicitudSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Detalles de {solicitudSeleccionada.nombre_empresa}
              </h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Información completa de la solicitud */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Información de la Empresa</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nombre:</strong> {solicitudSeleccionada.nombre_empresa}</p>
                    <p><strong>RUT:</strong> {solicitudSeleccionada.rut_empresa}</p>
                    <p><strong>Dirección:</strong> {solicitudSeleccionada.direccion}</p>
                    <p><strong>Teléfono:</strong> {solicitudSeleccionada.telefono}</p>
                    <p><strong>Email:</strong> {solicitudSeleccionada.email}</p>
                    <p><strong>Sitio Web:</strong> {solicitudSeleccionada.sitio_web}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Representante Legal</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nombre:</strong> {solicitudSeleccionada.nombre_representante}</p>
                    <p><strong>RUT:</strong> {solicitudSeleccionada.rut_representante}</p>
                    <p><strong>Cargo:</strong> {solicitudSeleccionada.cargo_representante}</p>
                    <p><strong>Teléfono:</strong> {solicitudSeleccionada.telefono_representante}</p>
                    <p><strong>Email:</strong> {solicitudSeleccionada.email_representante}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Descripción de Servicios</h4>
                <p className="text-sm text-gray-600">{solicitudSeleccionada.descripcion_servicios}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Motivación</h4>
                <p className="text-sm text-gray-600">{solicitudSeleccionada.motivacion}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Beneficios Esperados</h4>
                <p className="text-sm text-gray-600">{solicitudSeleccionada.beneficios_esperados}</p>
              </div>

              {/* Documentación */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Documentación</h4>
                <div className="space-y-2 text-sm">
                  {solicitudSeleccionada.logo_url && (
                    <p><strong>Logo:</strong> <a href={solicitudSeleccionada.logo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ver logo</a></p>
                  )}
                  {solicitudSeleccionada.documento_constitucion && (
                    <p><strong>Constitución:</strong> <a href={solicitudSeleccionada.documento_constitucion} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ver documento</a></p>
                  )}
                  {solicitudSeleccionada.certificado_vigencia && (
                    <p><strong>Vigencia:</strong> <a href={solicitudSeleccionada.certificado_vigencia} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ver certificado</a></p>
                  )}
                  {solicitudSeleccionada.autorizacion_sectorial && (
                    <p><strong>Autorización:</strong> <a href={solicitudSeleccionada.autorizacion_sectorial} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ver autorización</a></p>
                  )}
                </div>
              </div>

              {/* Agregar observación */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Agregar Observación</h4>
                <textarea
                  placeholder="Escriba una observación para la empresa..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  onChange={(e) => {
                    // Guardar en estado temporal
                    document.getElementById('observacion-temp').value = e.target.value;
                  }}
                />
                <button
                  onClick={() => {
                    const observacion = document.getElementById('observacion-temp').value;
                    if (observacion.trim()) {
                      agregarObservacion(solicitudSeleccionada.id, observacion);
                    }
                  }}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Agregar Observación
                </button>
                <input type="hidden" id="observacion-temp" />
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-6 border-t">
              <button
                onClick={() => setMostrarModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
