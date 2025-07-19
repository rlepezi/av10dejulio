import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy, where, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import { NotificationService } from '../utils/notificationService';

export default function AdminSolicitudesProveedor() {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtros, setFiltros] = useState({
    estado: '',
    etapa: '',
    necesita_web: '',
    busqueda: ''
  });
  const [loading, setLoading] = useState(true);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [mostrandoModal, setMostrandoModal] = useState(false);

  // Función para crear datos de prueba (solo para desarrollo)
  const crearSolicitudPrueba = async () => {
    try {
      const solicitudPrueba = {
        nombre_empresa: "Empresa de Prueba SPA",
        rut_empresa: "12.345.678-9",
        direccion_empresa: "Av. Principal 123",
        comuna: "Las Condes",
        region: "Región Metropolitana",
        telefono_empresa: "+56912345678",
        email_empresa: "contacto@empresaprueba.cl",
        web_actual: "www.empresaprueba.cl",
        nombres_representante: "Juan",
        apellidos_representante: "Pérez",
        cargo_representante: "Gerente General",
        email_representante: "juan.perez@empresaprueba.cl",
        telefono_representante: "+56987654321",
        necesita_pagina_web: true,
        tipo_pagina_web: "E-commerce",
        estado_general: "enviada",
        etapa_actual: "revision_inicial",
        progreso_porcentaje: 20,
        fecha_solicitud: new Date(),
        fecha_ultima_actualizacion: new Date(),
        etapas: {
          revision_inicial: {
            estado: "en_proceso",
            fecha_inicio: new Date(),
            responsable: user?.email || "admin@test.com"
          }
        }
      };

      await addDoc(collection(db, 'solicitudes_proveedor'), solicitudPrueba);
      console.log('Solicitud de prueba creada');
      window.location.reload();
    } catch (error) {
      console.error('Error creando solicitud de prueba:', error);
    }
  };

  // Cargar solicitudes de proveedores
  useEffect(() => {
    const cargarSolicitudes = async () => {
      try {
        console.log('🔍 Iniciando carga de solicitudes de proveedores...');
        console.log('📊 Base de datos:', db);
        
        // Verificar primero si podemos acceder a la colección
        const solicitudesCollection = collection(db, 'solicitudes_proveedor');
        console.log('📁 Colección obtenida:', solicitudesCollection);
        
        const solicitudesQuery = query(
          solicitudesCollection,
          orderBy('fecha_solicitud', 'desc')
        );
        console.log('🔎 Query creada:', solicitudesQuery);
        
        const snapshot = await getDocs(solicitudesQuery);
        console.log('📊 Snapshot obtenido:', {
          size: snapshot.size,
          empty: snapshot.empty,
          docs: snapshot.docs.length
        });
        
        if (snapshot.empty) {
          console.log('⚠️ La colección está vacía o no existe');
          setSolicitudes([]);
          return;
        }
        
        const solicitudesList = snapshot.docs.map(doc => {
          const data = { id: doc.id, ...doc.data() };
          console.log('📄 Solicitud procesada:', {
            id: data.id,
            empresa: data.nombre_empresa,
            estado: data.estado_general
          });
          return data;
        });
        
        console.log('✅ Solicitudes cargadas exitosamente:', {
          total: solicitudesList.length,
          primeras3: solicitudesList.slice(0, 3).map(s => s.nombre_empresa)
        });
        
        setSolicitudes(solicitudesList);
      } catch (error) {
        console.error('❌ Error detallado loading provider requests:', {
          error: error,
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        
        // Mostrar error más específico
        let errorMessage = 'Error desconocido al cargar las solicitudes';
        if (error.code === 'permission-denied') {
          errorMessage = 'Sin permisos para acceder a las solicitudes';
        } else if (error.code === 'unavailable') {
          errorMessage = 'Servicio de Firebase no disponible';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        alert('Error al cargar las solicitudes: ' + errorMessage);
      } finally {
        console.log('🏁 Finalizando carga de solicitudes');
        setLoading(false);
      }
    };

    cargarSolicitudes();
  }, []);

  // Filtrar solicitudes
  const solicitudesFiltradas = solicitudes.filter(solicitud => {
    const matchEstado = !filtros.estado || solicitud.estado_general === filtros.estado;
    const matchEtapa = !filtros.etapa || solicitud.etapa_actual === filtros.etapa;
    const matchWeb = !filtros.necesita_web || solicitud.necesita_pagina_web.toString() === filtros.necesita_web;
    const matchBusqueda = !filtros.busqueda || 
      solicitud.nombre_empresa.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      solicitud.nombres_representante.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      solicitud.apellidos_representante.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      solicitud.email_empresa.toLowerCase().includes(filtros.busqueda.toLowerCase());

    return matchEstado && matchEtapa && matchWeb && matchBusqueda;
  });

  // Actualizar etapa de solicitud
  const actualizarEtapa = async (solicitudId, nuevaEtapa, comentarios = '') => {
    try {
      const solicitud = solicitudes.find(s => s.id === solicitudId);
      if (!solicitud) return;

      const etapas = { ...solicitud.etapas };
      
      // Marcar la etapa anterior como completada
      if (solicitud.etapa_actual && etapas[solicitud.etapa_actual]) {
        etapas[solicitud.etapa_actual] = {
          ...etapas[solicitud.etapa_actual],
          estado: 'completada',
          fecha_fin: new Date(),
          responsable: user.email
        };
      }

      // Iniciar la nueva etapa
      if (etapas[nuevaEtapa]) {
        etapas[nuevaEtapa] = {
          ...etapas[nuevaEtapa],
          estado: 'en_proceso',
          fecha_inicio: new Date(),
          comentarios: comentarios,
          responsable: user.email
        };
      }

      // Calcular progreso
      const etapasOrden = ['revision_inicial', 'validacion_documentos', 'verificacion_ubicacion', 'visita_campo', 'aprobacion_final'];
      const indiceEtapa = etapasOrden.indexOf(nuevaEtapa);
      const progreso = Math.round(((indiceEtapa + 1) / etapasOrden.length) * 100);

      const docRef = doc(db, 'solicitudes_proveedor', solicitudId);
      await updateDoc(docRef, {
        etapa_actual: nuevaEtapa,
        progreso_porcentaje: progreso,
        etapas: etapas,
        fecha_ultima_actualizacion: new Date()
      });

      // Enviar notificación al proveedor
      await NotificationService.createInAppNotification(
        solicitud.email_representante,
        'validacion',
        'Actualización de tu Solicitud de Proveedor',
        `Tu solicitud ha avanzado a la etapa: ${nuevaEtapa.replace('_', ' ')}`,
        {
          solicitudId: solicitudId,
          nuevaEtapa: nuevaEtapa,
          progreso: progreso,
          comentarios: comentarios,
          origen: 'admin_solicitudes_proveedor'
        }
      );

      // Actualizar estado local
      setSolicitudes(prev => prev.map(s => 
        s.id === solicitudId 
          ? { ...s, etapa_actual: nuevaEtapa, progreso_porcentaje: progreso, etapas }
          : s
      ));

      alert('Etapa actualizada exitosamente');
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Error al actualizar la etapa');
    }
  };

  // Aprobar solicitud
  const aprobarSolicitud = async (solicitudId) => {
    try {
      const solicitud = solicitudes.find(s => s.id === solicitudId);
      if (!solicitud) {
        alert('Solicitud no encontrada');
        return;
      }

      console.log('🚀 Iniciando aprobación de solicitud:', solicitudId);

      // 1. Actualizar el estado de la solicitud a aprobada
      const docRef = doc(db, 'solicitudes_proveedor', solicitudId);
      await updateDoc(docRef, {
        estado_general: 'aprobada',
        etapa_actual: 'aprobacion_final',
        progreso_porcentaje: 100,
        fecha_aprobacion: new Date()
      });

      console.log('✅ Solicitud actualizada a aprobada');

      // 2. Crear empresa en la colección 'empresas' con estado 'Activa'
      const nuevaEmpresa = {
        // Información básica de la empresa
        nombre: solicitud.nombre_empresa,
        email: solicitud.email_empresa,
        telefono: solicitud.telefono_empresa,
        direccion: solicitud.direccion_empresa,
        comuna: solicitud.comuna,
        region: solicitud.region,
        web: solicitud.web_actual || '',
        rut: solicitud.rut_empresa,
        
        // Información del representante
        representante: {
          nombres: solicitud.nombres_representante,
          apellidos: solicitud.apellidos_representante,
          cargo: solicitud.cargo_representante,
          email: solicitud.email_representante,
          telefono: solicitud.telefono_representante
        },
        
        // Información del negocio
        descripcion: solicitud.descripcion_negocio || '',
        anos_funcionamiento: solicitud.anos_funcionamiento || 0,
        numero_empleados: solicitud.numero_empleados || 0,
        horario_atencion: solicitud.horario_atencion || '',
        
        // Servicios y marcas
        categorias: solicitud.categorias_servicios || [],
        marcas: solicitud.marcas_vehiculos || [],
        
        // Estado y fechas
        estado: 'Activa',
        fecha_postulacion: solicitud.fecha_solicitud,
        fecha_aprobacion: new Date(),
        fecha_registro: new Date(),
        
        // Información web (si aplica)
        necesita_pagina_web: solicitud.necesita_pagina_web || false,
        tipo_pagina_web: solicitud.tipo_pagina_web || '',
        redes_sociales: solicitud.redes_sociales || {},
        
        // Metadatos de la solicitud
        solicitud_id: solicitudId,
        aprobado_por: user.email,
        
        // Campos requeridos por el sistema existente
        logo: '', // Se puede actualizar después
        valoracion: 0,
        reviews: 0,
        verificado: true,
        destacado: false
      };

      const empresaRef = await addDoc(collection(db, 'empresas'), nuevaEmpresa);
      console.log('✅ Empresa creada en colección empresas:', empresaRef.id);

      // 3. Actualizar la solicitud con el ID de la empresa creada
      await updateDoc(docRef, {
        empresa_id: empresaRef.id,
        empresa_activa: true
      });

      console.log('✅ Solicitud vinculada con empresa');
      
      // 4. Enviar notificación de aprobación
      await NotificationService.createInAppNotification(
        solicitud.email_representante,
        'validacion',
        '¡Felicidades! Tu solicitud de proveedor ha sido aprobada',
        `${solicitud.nombre_empresa} ya está activo como proveedor en AV10 de Julio y aparece en la lista pública de proveedores.`,
        {
          solicitudId: solicitudId,
          empresaId: empresaRef.id,
          empresaNombre: solicitud.nombre_empresa,
          estado: 'aprobada',
          origen: 'admin_aprobacion_proveedor'
        }
      );

      // 5. Actualizar estado local
      setSolicitudes(prev => prev.map(s => 
        s.id === solicitudId 
          ? { 
              ...s, 
              estado_general: 'aprobada', 
              progreso_porcentaje: 100,
              empresa_id: empresaRef.id,
              empresa_activa: true
            }
          : s
      ));

      alert(`¡Solicitud aprobada exitosamente! ${solicitud.nombre_empresa} ahora aparece como proveedor activo.`);
    } catch (error) {
      console.error('❌ Error approving request:', error);
      alert('Error al aprobar la solicitud: ' + error.message);
    }
  };

  // Rechazar solicitud
  const rechazarSolicitud = async (solicitudId, motivo) => {
    try {
      const solicitud = solicitudes.find(s => s.id === solicitudId);
      if (!solicitud) {
        alert('Solicitud no encontrada');
        return;
      }

      console.log('🚫 Iniciando rechazo de solicitud:', solicitudId);

      // 1. Actualizar el estado de la solicitud a rechazada
      const docRef = doc(db, 'solicitudes_proveedor', solicitudId);
      await updateDoc(docRef, {
        estado_general: 'rechazada',
        motivo_rechazo: motivo,
        fecha_rechazo: new Date()
      });

      console.log('✅ Solicitud actualizada a rechazada');

      // 2. Si la empresa ya estaba activa, desactivarla
      if (solicitud.empresa_id && solicitud.empresa_activa) {
        console.log('🔄 Desactivando empresa asociada:', solicitud.empresa_id);
        
        const empresaRef = doc(db, 'empresas', solicitud.empresa_id);
        await updateDoc(empresaRef, {
          estado: 'Inactiva',
          fecha_desactivacion: new Date(),
          motivo_desactivacion: `Solicitud rechazada: ${motivo}`,
          desactivado_por: user.email
        });

        // Actualizar la solicitud para reflejar que la empresa fue desactivada
        await updateDoc(docRef, {
          empresa_activa: false
        });

        console.log('✅ Empresa desactivada');
      }
      
      // 3. Enviar notificación de rechazo
      await NotificationService.createInAppNotification(
        solicitud.email_representante,
        'validacion',
        'Solicitud de proveedor no aprobada',
        `Lamentamos informarte que tu solicitud para ${solicitud.nombre_empresa} no ha sido aprobada. Motivo: ${motivo}`,
        {
          solicitudId: solicitudId,
          empresaNombre: solicitud.nombre_empresa,
          motivo: motivo,
          estado: 'rechazada',
          origen: 'admin_rechazo_proveedor'
        }
      );

      // 4. Actualizar estado local
      setSolicitudes(prev => prev.map(s => 
        s.id === solicitudId 
          ? { 
              ...s, 
              estado_general: 'rechazada', 
              motivo_rechazo: motivo,
              empresa_activa: false
            }
          : s
      ));

      const mensaje = solicitud.empresa_activa 
        ? `Solicitud rechazada y empresa desactivada`
        : `Solicitud rechazada`;
      
      alert(mensaje);
    } catch (error) {
      console.error('❌ Error rejecting request:', error);
      alert('Error al rechazar la solicitud: ' + error.message);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const abrirModal = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setMostrandoModal(true);
  };

  const cerrarModal = () => {
    setSolicitudSeleccionada(null);
    setMostrandoModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Cargando solicitudes de proveedores...</p>
          <p className="text-sm text-gray-400">Conectando con Firebase...</p>
          <p className="text-xs text-gray-400 mt-2">Revisa la consola (F12) para logs detallados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Solicitudes de Proveedores
          </h1>
          <p className="text-gray-600">
            Administra y revisa las solicitudes de nuevos proveedores
          </p>
        </div>
        {solicitudes.length === 0 && (
          <div className="flex gap-2">
            <button
              onClick={crearSolicitudPrueba}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              + Crear Solicitud de Prueba
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              🔄 Recargar
            </button>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-800">
            {solicitudes.filter(s => s.estado_general === 'enviada').length}
          </div>
          <div className="text-yellow-600">Nuevas</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-800">
            {solicitudes.filter(s => s.estado_general === 'en_revision').length}
          </div>
          <div className="text-blue-600">En Revisión</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-800">
            {solicitudes.filter(s => s.estado_general === 'aprobada').length}
          </div>
          <div className="text-green-600">Aprobadas</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-800">
            {solicitudes.filter(s => s.necesita_pagina_web).length}
          </div>
          <div className="text-purple-600">Requieren Web</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              name="estado"
              value={filtros.estado}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="enviada">Enviada</option>
              <option value="en_revision">En Revisión</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
            <select
              name="etapa"
              value={filtros.etapa}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              <option value="revision_inicial">Revisión Inicial</option>
              <option value="validacion_documentos">Validación Documentos</option>
              <option value="verificacion_ubicacion">Verificación Ubicación</option>
              <option value="visita_campo">Visita Campo</option>
              <option value="aprobacion_final">Aprobación Final</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Necesita Web</label>
            <select
              name="necesita_web"
              value={filtros.necesita_web}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              name="busqueda"
              value={filtros.busqueda}
              onChange={handleFiltroChange}
              placeholder="Empresa, representante, email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Lista de solicitudes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            Solicitudes ({solicitudesFiltradas.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Representante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Etapa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progreso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Página Web
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado Empresa
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
              {solicitudesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <div className="text-4xl mb-4">📋</div>
                      <div className="text-lg font-medium mb-2">No hay solicitudes de proveedores</div>
                      <div className="text-sm">
                        {solicitudes.length === 0 
                          ? "Aún no se han recibido solicitudes de proveedores"
                          : "No hay solicitudes que coincidan con los filtros aplicados"
                        }
                      </div>
                      {solicitudes.length > 0 && (
                        <button
                          onClick={() => setFiltros({ estado: '', etapa: '', necesita_web: '', busqueda: '' })}
                          className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                solicitudesFiltradas.map((solicitud) => (
                <tr key={solicitud.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {solicitud.nombre_empresa}
                      </div>
                      <div className="text-sm text-gray-500">
                        {solicitud.email_empresa}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {solicitud.nombres_representante} {solicitud.apellidos_representante}
                    </div>
                    <div className="text-sm text-gray-500">
                      {solicitud.email_representante}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      solicitud.estado_general === 'enviada' ? 'bg-yellow-100 text-yellow-800' :
                      solicitud.estado_general === 'en_revision' ? 'bg-blue-100 text-blue-800' :
                      solicitud.estado_general === 'aprobada' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {solicitud.estado_general}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {solicitud.etapa_actual?.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${solicitud.progreso_porcentaje || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {solicitud.progreso_porcentaje || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {solicitud.necesita_pagina_web ? (
                      <div className="text-sm">
                        <span className="text-green-600">✓ {solicitud.tipo_pagina_web}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No requiere</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {solicitud.empresa_activa ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        ✓ Activa
                      </span>
                    ) : solicitud.estado_general === 'aprobada' ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        ⏳ Pendiente
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                        - Sin empresa
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(solicitud.fecha_solicitud?.toDate?.() || solicitud.fecha_solicitud).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => abrirModal(solicitud)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalles */}
      {mostrandoModal && solicitudSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-screen overflow-y-auto p-6 m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Detalles de {solicitudSeleccionada.nombre_empresa}
              </h2>
              <button
                onClick={cerrarModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información de la empresa */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900">Información de la Empresa</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Nombre:</span> {solicitudSeleccionada.nombre_empresa}</p>
                  <p><span className="font-medium">RUT:</span> {solicitudSeleccionada.rut_empresa}</p>
                  <p><span className="font-medium">Dirección:</span> {solicitudSeleccionada.direccion_empresa}</p>
                  <p><span className="font-medium">Comuna:</span> {solicitudSeleccionada.comuna}</p>
                  <p><span className="font-medium">Región:</span> {solicitudSeleccionada.region}</p>
                  <p><span className="font-medium">Teléfono:</span> {solicitudSeleccionada.telefono_empresa}</p>
                  <p><span className="font-medium">Email:</span> {solicitudSeleccionada.email_empresa}</p>
                  <p><span className="font-medium">Web actual:</span> {solicitudSeleccionada.web_actual || 'No tiene'}</p>
                </div>
              </div>

              {/* Información del representante */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900">Representante</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Nombre:</span> {solicitudSeleccionada.nombres_representante} {solicitudSeleccionada.apellidos_representante}</p>
                  <p><span className="font-medium">Cargo:</span> {solicitudSeleccionada.cargo_representante}</p>
                  <p><span className="font-medium">Email:</span> {solicitudSeleccionada.email_representante}</p>
                  <p><span className="font-medium">Teléfono:</span> {solicitudSeleccionada.telefono_representante}</p>
                </div>
              </div>

              {/* Información del negocio */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="font-semibold text-lg text-gray-900">Información del Negocio</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Descripción:</span> {solicitudSeleccionada.descripcion_negocio}</p>
                  <p><span className="font-medium">Años funcionando:</span> {solicitudSeleccionada.anos_funcionamiento}</p>
                  <p><span className="font-medium">Empleados:</span> {solicitudSeleccionada.numero_empleados}</p>
                  <p><span className="font-medium">Horario:</span> {solicitudSeleccionada.horario_atencion}</p>
                  <p><span className="font-medium">Servicios:</span> {solicitudSeleccionada.categorias_servicios?.join(', ')}</p>
                  <p><span className="font-medium">Marcas:</span> {solicitudSeleccionada.marcas_vehiculos?.join(', ')}</p>
                </div>
              </div>

              {/* Servicios web */}
              {solicitudSeleccionada.necesita_pagina_web && (
                <div className="md:col-span-2 space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900">Servicios Web Solicitados</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-medium text-blue-900">Página Web: {solicitudSeleccionada.tipo_pagina_web}</p>
                    {solicitudSeleccionada.tiene_redes_sociales && (
                      <div className="mt-2 text-sm">
                        <p className="font-medium">Redes Sociales:</p>
                        {Object.entries(solicitudSeleccionada.redes_sociales || {}).map(([red, url]) => 
                          url && <p key={red}>• {red}: {url}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="mt-8 flex flex-wrap gap-4">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const comentarios = prompt('Comentarios (opcional):');
                    actualizarEtapa(solicitudSeleccionada.id, e.target.value, comentarios || '');
                    e.target.value = '';
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Cambiar Etapa</option>
                <option value="revision_inicial">Revisión Inicial</option>
                <option value="validacion_documentos">Validación Documentos</option>
                <option value="verificacion_ubicacion">Verificación Ubicación</option>
                <option value="visita_campo">Visita Campo</option>
                <option value="aprobacion_final">Aprobación Final</option>
              </select>

              <button
                onClick={() => aprobarSolicitud(solicitudSeleccionada.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Aprobar Solicitud
              </button>

              <button
                onClick={() => {
                  const motivo = prompt('Motivo del rechazo:');
                  if (motivo) {
                    rechazarSolicitud(solicitudSeleccionada.id, motivo);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Rechazar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón para crear solicitud de prueba (solo en desarrollo) */}
      {user?.email === 'admin@test.com' && (
        <div className="mt-8">
          <button
            onClick={crearSolicitudPrueba}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Crear Solicitud de Prueba
          </button>
        </div>
      )}
    </div>
  );
}
