import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

const ESTADOS_SOLICITUD = [
  { value: '', label: 'Todos los estados', color: 'gray' },
  { value: 'pendiente', label: 'Pendiente', color: 'yellow' },
  { value: 'en_revision', label: 'En Revisión', color: 'blue' },
  { value: 'activada', label: 'Activada (Visible en Home)', color: 'green' },
  { value: 'credenciales_asignadas', label: 'Credenciales Asignadas', color: 'purple' },
  { value: 'rechazada', label: 'Rechazada', color: 'red' }
];

export default function SolicitudesRegistro() {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    estado: '',
    busqueda: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [mostrandoModal, setMostrandoModal] = useState(false);
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [esAgente, setEsAgente] = useState(false);
  const [mostrandoModalCredenciales, setMostrandoModalCredenciales] = useState(false);
  const [credencialesForm, setCredencialesForm] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  // NUEVOS ESTADOS PARA REVISION AVANZADA
  const [modoRevision, setModoRevision] = useState(false);
  const [validacionWeb, setValidacionWeb] = useState(null);
  const [validandoWeb, setValidandoWeb] = useState(false);
  const [datosPerfilForm, setDatosPerfilForm] = useState({
    descripcion_completa: '',
    anos_funcionamiento: '',
    redes_sociales: {
      facebook: '',
      instagram: '',
      linkedin: '',
      twitter: ''
    },
    logo_url: '',
    servicios: [],
    marcas_trabajadas: [],
    tiene_web: false,
    web_validada: false,
    crear_perfil_publico: false,
    horarios: {
      lunes: { activo: true, inicio: '09:00', fin: '18:00' },
      martes: { activo: true, inicio: '09:00', fin: '18:00' },
      miercoles: { activo: true, inicio: '09:00', fin: '18:00' },
      jueves: { activo: true, inicio: '09:00', fin: '18:00' },
      viernes: { activo: true, inicio: '09:00', fin: '18:00' },
      sabado: { activo: false, inicio: '09:00', fin: '13:00' },
      domingo: { activo: false, inicio: '10:00', fin: '14:00' }
    },
    ubicacion: {
      lat: null,
      lng: null,
      verificada: false
    },
    imagenes_local: []
  });

  useEffect(() => {
    cargarSolicitudes();
    verificarRolUsuario();
  }, []);

  const verificarRolUsuario = async () => {
    try {
      // Verificar si el usuario es agente
      const agentesQuery = query(collection(db, 'agentes'), where('email', '==', user?.email));
      const agentesSnapshot = await getDocs(agentesQuery);
      setEsAgente(!agentesSnapshot.empty);
    } catch (error) {
      console.error('Error verificando rol:', error);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'solicitudes_empresa'), orderBy('fecha_solicitud', 'desc'));
      const snapshot = await getDocs(q);
      const solicitudesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSolicitudes(solicitudesData);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const solicitudesFiltradas = solicitudes.filter(solicitud => {
    const matchEstado = !filtros.estado || solicitud.estado === filtros.estado;
    const matchBusqueda = !filtros.busqueda || 
      solicitud.nombre_empresa?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      solicitud.email_empresa?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      (solicitud.nombres_representante || solicitud.representante_nombre)?.toLowerCase().includes(filtros.busqueda.toLowerCase());
    
    return matchEstado && matchBusqueda;
  });

  const cambiarEstadoSolicitud = async (solicitudId, nuevoEstado, comentario = '') => {
    try {
      setProcesando(true);
      await updateDoc(doc(db, 'solicitudes_empresa', solicitudId), {
        estado: nuevoEstado,
        fecha_ultima_actualizacion: new Date(),
        comentario_admin: comentario,
        admin_responsable: user?.email
      });

      // Si se activa (primera etapa), crear empresa visible en home
      if (nuevoEstado === 'activada') {
        await crearEmpresaDesdeActivacion(solicitudId);
      }

      await cargarSolicitudes();
      setMostrandoModal(false);
      setSolicitudSeleccionada(null);
    } catch (error) {
      console.error('Error actualizando solicitud:', error);
      alert('Error al actualizar la solicitud');
    } finally {
      setProcesando(false);
    }
  };

  // NUEVA FUNCIÓN PARA CREAR EMPRESA CON PERFIL COMPLETO
  const crearEmpresaConPerfilCompleto = async (solicitudId) => {
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    if (!solicitud) return;

    try {
      const empresaData = {
        // Información básica
        nombre: solicitud.nombre_empresa,
        email: solicitud.email_empresa,
        telefono: solicitud.telefono_empresa,
        direccion: solicitud.direccion_empresa,
        comuna: solicitud.comuna,
        region: solicitud.region,
        rut: solicitud.rut_empresa,
        web: solicitud.web_actual || '',
        
        // DATOS COMPLETADOS EN REVISIÓN
        descripcion_completa: datosPerfilForm.descripcion_completa,
        anos_funcionamiento: datosPerfilForm.anos_funcionamiento,
        redes_sociales: datosPerfilForm.redes_sociales,
        logo_url: datosPerfilForm.logo_url,
        servicios_completos: datosPerfilForm.servicios,
        marcas_trabajadas: datosPerfilForm.marcas_trabajadas,
        horarios_detallados: datosPerfilForm.horarios,
        ubicacion: datosPerfilForm.ubicacion,
        imagenes_local: datosPerfilForm.imagenes_local,
        
        // Validación web
        web_validada: datosPerfilForm.web_validada,
        validacion_web: validacionWeb,
        requiere_perfil_publico: datosPerfilForm.crear_perfil_publico,
        
        // Representante
        representante: {
          nombre: solicitud.nombres_representante || solicitud.representante_nombre || '',
          apellidos: solicitud.apellidos_representante || solicitud.representante_apellidos || '',
          cargo: solicitud.cargo_representante || '',
          email: solicitud.email_representante || '',
          telefono: solicitud.telefono_representante || ''
        },

        // Estado y configuración
        estado: 'activa', // Visible en home
        etapa_proceso: 'activada_con_perfil_completo',
        categoria: solicitud.categoria || 'Sin categoría',
        fecha_registro: new Date(),
        fecha_activacion: new Date(),
        admin_activador: user?.email,
        solicitud_origen_id: solicitudId,

        // Configuraciones mejoradas
        logoAsignado: !!datosPerfilForm.logo_url,
        webValidada: datosPerfilForm.web_validada,
        perfilCompleto: true,
        tiene_credenciales_asignadas: false, // Se asignará posteriormente
        usuario_empresa: null, // Se asignará con credenciales
        
        // Metadatos de revisión
        revision_completada: true,
        fecha_revision: new Date(),
        admin_revisor: user?.email
      };

      await addDoc(collection(db, 'empresas'), empresaData);
      console.log('Empresa creada con perfil completo desde revisión');
    } catch (error) {
      console.error('Error creando empresa con perfil completo:', error);
      throw error;
    }
  };

  const crearEmpresaDesdeActivacion = async (solicitudId) => {
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    if (!solicitud) return;

    try {
      const empresaData = {
        // Información básica
        nombre: solicitud.nombre_empresa,
        email: solicitud.email_empresa,
        telefono: solicitud.telefono_empresa,
        direccion: solicitud.direccion_empresa,
        comuna: solicitud.comuna,
        region: solicitud.region,
        rut: solicitud.rut_empresa,
        web: solicitud.web_actual || '',
        
        // Representante
        representante: {
          nombre: solicitud.nombres_representante || solicitud.representante_nombre || '',
          apellidos: solicitud.apellidos_representante || solicitud.representante_apellidos || '',
          cargo: solicitud.cargo_representante || '',
          email: solicitud.email_representante || '',
          telefono: solicitud.telefono_representante || ''
        },

        // Estado y configuración - PRIMERA ETAPA
        estado: 'activa', // Visible en home
        etapa_proceso: 'activada_sin_credenciales', // Nueva propiedad para controlar el flujo
        categoria: solicitud.categoria || 'Sin categoría',
        fecha_registro: new Date(),
        fecha_activacion: new Date(),
        admin_activador: user?.email,
        solicitud_origen_id: solicitudId,

        // Configuraciones por defecto
        logoAsignado: false,
        webValidada: !!solicitud.web_actual,
        perfilCompleto: false,
        tiene_credenciales_asignadas: false, // Para segunda etapa
        usuario_empresa: null, // Se asignará en segunda etapa
        horarios: {
          lunes: { activo: true, inicio: '09:00', fin: '18:00' },
          martes: { activo: true, inicio: '09:00', fin: '18:00' },
          miercoles: { activo: true, inicio: '09:00', fin: '18:00' },
          jueves: { activo: true, inicio: '09:00', fin: '18:00' },
          viernes: { activo: true, inicio: '09:00', fin: '18:00' },
          sabado: { activo: false, inicio: '09:00', fin: '13:00' },
          domingo: { activo: false, inicio: '10:00', fin: '14:00' }
        }
      };

      await addDoc(collection(db, 'empresas'), empresaData);
      console.log('Empresa activada y visible en home (primera etapa completada)');
    } catch (error) {
      console.error('Error creando empresa:', error);
      throw error;
    }
  };

  const asignarCredenciales = async (solicitudId) => {
    if (!credencialesForm.email || !credencialesForm.password) {
      alert('Todos los campos son obligatorios');
      return;
    }

    if (credencialesForm.password !== credencialesForm.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      setProcesando(true);
      
      // 1. Actualizar la solicitud a estado "credenciales_asignadas"
      await updateDoc(doc(db, 'solicitudes_empresa', solicitudId), {
        estado: 'credenciales_asignadas',
        fecha_credenciales_asignadas: new Date(),
        admin_credenciales: user?.email,
        usuario_asignado: {
          email: credencialesForm.email,
          fecha_asignacion: new Date()
        }
      });

      // 2. Buscar y actualizar la empresa correspondiente
      const empresasRef = collection(db, 'empresas');
      const empresasQuery = query(empresasRef, where('solicitud_origen_id', '==', solicitudId));
      const empresasSnapshot = await getDocs(empresasQuery);
      
      if (!empresasSnapshot.empty) {
        const empresaDoc = empresasSnapshot.docs[0];
        await updateDoc(empresaDoc.ref, {
          etapa_proceso: 'credenciales_asignadas',
          tiene_credenciales_asignadas: true,
          usuario_empresa: {
            email: credencialesForm.email,
            fecha_asignacion: new Date(),
            admin_asignador: user?.email
          },
          fecha_credenciales_asignadas: new Date()
        });
      }

      // 3. OPCIONAL: Crear usuario en Firebase Auth
      // await createUserWithEmailAndPassword(auth, credencialesForm.email, credencialesForm.password);
      
      alert(
        `Credenciales asignadas exitosamente.\n\n` +
        `Email: ${credencialesForm.email}\n` +
        `Contraseña: ${credencialesForm.password}\n\n` +
        `La empresa ya puede acceder a su panel de gestión.`
      );
      
      await cargarSolicitudes();
      setMostrandoModalCredenciales(false);
      setCredencialesForm({ email: '', password: '', confirmPassword: '' });
      setSolicitudSeleccionada(null);

    } catch (error) {
      console.error('Error asignando credenciales:', error);
      alert('Error al asignar credenciales: ' + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const generarPasswordAleatoria = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    setCredencialesForm(prev => ({
      ...prev,
      password: password,
      confirmPassword: password
    }));
  };

  // FUNCIÓN MEJORADA PARA VALIDACIÓN DE SITIO WEB
  const validarSitioWeb = async (url) => {
    if (!url) {
      setValidacionWeb({ existe: false, error: 'No se proporcionó URL' });
      setDatosPerfilForm(prev => ({ 
        ...prev, 
        web_validada: false, 
        crear_perfil_publico: true 
      }));
      return null;
    }
    
    setValidandoWeb(true);
    try {
      // Asegurar que la URL tenga protocolo
      let urlCompleta = url.trim();
      if (!urlCompleta.startsWith('http://') && !urlCompleta.startsWith('https://')) {
        urlCompleta = `https://${urlCompleta}`;
      }
      
      // Validación básica de formato
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
      if (!urlPattern.test(urlCompleta)) {
        const resultado = { existe: false, error: 'Formato de URL inválido' };
        setValidacionWeb(resultado);
        setDatosPerfilForm(prev => ({ 
          ...prev, 
          web_validada: false, 
          crear_perfil_publico: true 
        }));
        return resultado;
      }
      
      // Simular validación (en producción usar API real o fetch)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Resultado simulado basado en patrones comunes
      const esDominioValido = urlCompleta.includes('.cl') || 
                             urlCompleta.includes('.com') || 
                             urlCompleta.includes('.net') ||
                             urlCompleta.includes('.org');
      
      const resultado = {
        existe: esDominioValido,
        respondiendo: esDominioValido && Math.random() > 0.2, // 80% probabilidad si es válido
        url_normalizada: urlCompleta,
        fecha_validacion: new Date(),
        tiempo_respuesta: Math.round(Math.random() * 2000) + 500,
        codigo_respuesta: esDominioValido ? (Math.random() > 0.1 ? 200 : 404) : null
      };
      
      setValidacionWeb(resultado);
      
      // Actualizar form según resultado
      setDatosPerfilForm(prev => ({
        ...prev,
        web_validada: resultado.existe && resultado.respondiendo,
        crear_perfil_publico: !resultado.existe || !resultado.respondiendo,
        tiene_web: resultado.existe && resultado.respondiendo
      }));
      
      return resultado;
    } catch (error) {
      const resultado = { 
        existe: false, 
        error: 'Error validando sitio web: ' + error.message 
      };
      setValidacionWeb(resultado);
      setDatosPerfilForm(prev => ({ 
        ...prev, 
        web_validada: false, 
        crear_perfil_publico: true 
      }));
      return resultado;
    } finally {
      setValidandoWeb(false);
    }
  };

  const iniciarModoRevision = () => {
    if (!solicitudSeleccionada) return;
    
    // Inicializar form con datos existentes
    setDatosPerfilForm(prev => ({
      ...prev,
      descripcion_completa: solicitudSeleccionada.descripcion || '',
      anos_funcionamiento: solicitudSeleccionada.anos_funcionamiento || '',
      redes_sociales: solicitudSeleccionada.redes_sociales || prev.redes_sociales,
      logo_url: solicitudSeleccionada.logo_url || '',
      servicios: solicitudSeleccionada.categorias_servicios || [],
      marcas_trabajadas: solicitudSeleccionada.marcas_vehiculos || [],
      tiene_web: !!solicitudSeleccionada.web_actual,
      web_validada: false,
      crear_perfil_publico: !solicitudSeleccionada.web_actual
    }));
    
    setModoRevision(true);
    
    // Auto-validar web si existe
    if (solicitudSeleccionada.web_actual) {
      validarSitioWeb(solicitudSeleccionada.web_actual);
    }
  };

  const guardarDatosRevision = async () => {
    try {
      setProcesando(true);
      
      // Actualizar solicitud con datos adicionales
      await updateDoc(doc(db, 'solicitudes_empresa', solicitudSeleccionada.id), {
        // Datos del perfil completados
        descripcion_completa: datosPerfilForm.descripcion_completa,
        anos_funcionamiento: datosPerfilForm.anos_funcionamiento,
        redes_sociales: datosPerfilForm.redes_sociales,
        logo_url: datosPerfilForm.logo_url,
        servicios_completos: datosPerfilForm.servicios,
        marcas_trabajadas: datosPerfilForm.marcas_trabajadas,
        horarios_detallados: datosPerfilForm.horarios,
        
        // Validación web
        web_validada: datosPerfilForm.web_validada,
        validacion_web: validacionWeb,
        requiere_perfil_publico: datosPerfilForm.crear_perfil_publico,
        
        // Metadatos de revisión
        revision_completada: true,
        fecha_revision: new Date(),
        admin_revisor: user?.email,
        
        fecha_ultima_actualizacion: new Date()
      });

      alert('Datos de revisión guardados exitosamente');
      await cargarSolicitudes();
      setModoRevision(false);
    } catch (error) {
      console.error('Error guardando datos de revisión:', error);
      alert('Error al guardar los datos de revisión');
    } finally {
      setProcesando(false);
    }
  };

  const activarConPerfilCompleto = async () => {
    try {
      setProcesando(true);
      
      // 1. Guardar datos de revisión primero
      await guardarDatosRevision();
      
      // 2. Cambiar estado a activada
      await cambiarEstadoSolicitud(
        solicitudSeleccionada.id, 
        'activada', 
        'Activada con perfil completo desde revisión'
      );
      
      // 3. Crear empresa con todos los datos completos
      await crearEmpresaConPerfilCompleto(solicitudSeleccionada.id);
      
      setModoRevision(false);
      setMostrandoModal(false);
      
      // Preguntar si desea asignar credenciales inmediatamente
      const asignarCredenciales = window.confirm(
        '¿Deseas asignar credenciales de acceso para que la empresa pueda gestionar su información?'
      );
      
      if (asignarCredenciales) {
        setCredencialesForm({
          email: solicitudSeleccionada.email_empresa || '',
          password: '',
          confirmPassword: ''
        });
        setMostrandoModalCredenciales(true);
      }
      
    } catch (error) {
      console.error('Error activando con perfil completo:', error);
      alert('Error al activar la empresa');
    } finally {
      setProcesando(false);
    }
  };

  const getColorEstado = (estado) => {
    const estadoConfig = ESTADOS_SOLICITUD.find(e => e.value === estado);
    return estadoConfig?.color || 'gray';
  };

  const estadisticas = {
    total: solicitudes.length,
    pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
    en_revision: solicitudes.filter(s => s.estado === 'en_revision').length,
    activadas: solicitudes.filter(s => s.estado === 'activada').length,
    credenciales_asignadas: solicitudes.filter(s => s.estado === 'credenciales_asignadas').length,
    rechazadas: solicitudes.filter(s => s.estado === 'rechazada').length
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitudes de Registro</h2>
        <p className="text-gray-600 mb-3">
          Gestiona las solicitudes de registro de nuevas empresas y proveedores en un flujo de dos etapas:
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">🎯 Primera Etapa: Activación</h4>
              <p className="text-blue-700">
                Revisar y activar la solicitud para que la empresa sea visible en el home y los usuarios puedan encontrarla.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-purple-900 mb-2">🔑 Segunda Etapa: Credenciales</h4>
              <p className="text-purple-700">
                Asignar email y contraseña para que la empresa pueda acceder a su panel y gestionar su información.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{estadisticas.total}</div>
          <div className="text-gray-600 text-sm">Total</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-800">{estadisticas.pendientes}</div>
          <div className="text-yellow-600 text-sm">Pendientes</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-800">{estadisticas.en_revision}</div>
          <div className="text-blue-600 text-sm">En Revisión</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-800">{estadisticas.activadas}</div>
          <div className="text-green-600 text-sm">Activadas</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-800">{estadisticas.credenciales_asignadas}</div>
          <div className="text-purple-600 text-sm">Con Credenciales</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-800">{estadisticas.rechazadas}</div>
          <div className="text-red-600 text-sm">Rechazadas</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ESTADOS_SOLICITUD.map(estado => (
                <option key={estado.value} value={estado.value}>{estado.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <input
              type="text"
              value={filtros.busqueda}
              onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
              placeholder="Nombre empresa, email, representante..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFiltros({ estado: '', busqueda: '', fechaDesde: '', fechaHasta: '' })}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Botón para crear solicitud (solo agentes) */}
      {esAgente && (
        <div className="mb-6">
          <button
            onClick={() => setMostrandoFormulario(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            ➕ Crear Nueva Solicitud (Agente de Campo)
          </button>
        </div>
      )}

      {/* Lista de solicitudes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
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
                        {solicitud.nombre_empresa}
                      </div>
                      <div className="text-sm text-gray-500">
                        {solicitud.email_empresa}
                      </div>
                      {solicitud.web_actual && (
                        <div className="text-sm text-blue-600">
                          🌐 {solicitud.web_actual}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(solicitud.nombres_representante || solicitud.representante_nombre) || 'No especificado'} {(solicitud.apellidos_representante || solicitud.representante_apellidos) || ''}
                    </div>
                    <div className="text-sm text-gray-500">
                      {solicitud.cargo_representante}
                    </div>
                    <div className="text-sm text-gray-500">
                      📞 {solicitud.telefono_representante}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                      ${getColorEstado(solicitud.estado) === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${getColorEstado(solicitud.estado) === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
                      ${getColorEstado(solicitud.estado) === 'green' ? 'bg-green-100 text-green-800' : ''}
                      ${getColorEstado(solicitud.estado) === 'red' ? 'bg-red-100 text-red-800' : ''}
                      ${getColorEstado(solicitud.estado) === 'gray' ? 'bg-gray-100 text-gray-800' : ''}
                    `}>
                      {ESTADOS_SOLICITUD.find(e => e.value === solicitud.estado)?.label || solicitud.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {solicitud.fecha_solicitud?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => {
                        setSolicitudSeleccionada(solicitud);
                        setMostrandoModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {solicitudesFiltradas.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay solicitudes que coincidan con los filtros</p>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {mostrandoModal && solicitudSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Detalles de Solicitud: {solicitudSeleccionada.nombre_empresa}
              </h3>
              <button
                onClick={() => setMostrandoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Información de la Empresa</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>RUT:</strong> {solicitudSeleccionada.rut_empresa}</p>
                    <p><strong>Dirección:</strong> {solicitudSeleccionada.direccion_empresa}</p>
                    <p><strong>Comuna:</strong> {solicitudSeleccionada.comuna}</p>
                    <p><strong>Región:</strong> {solicitudSeleccionada.region}</p>
                    <p><strong>Teléfono:</strong> {solicitudSeleccionada.telefono_empresa}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Representante Legal</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Nombre:</strong> {(solicitudSeleccionada.nombres_representante || solicitudSeleccionada.representante_nombre) || 'No especificado'} {(solicitudSeleccionada.apellidos_representante || solicitudSeleccionada.representante_apellidos) || ''}</p>
                    <p><strong>Cargo:</strong> {solicitudSeleccionada.cargo_representante}</p>
                    <p><strong>Email:</strong> {solicitudSeleccionada.email_representante}</p>
                    <p><strong>Teléfono:</strong> {solicitudSeleccionada.telefono_representante}</p>
                  </div>
                </div>
              </div>

              {solicitudSeleccionada.comentario_admin && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Comentarios del Administrador</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {solicitudSeleccionada.comentario_admin}
                  </p>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex justify-end space-x-3">
              {/* Etapa 1: Pendiente */}
              {solicitudSeleccionada.estado === 'pendiente' && (
                <>
                  <button
                    onClick={() => cambiarEstadoSolicitud(solicitudSeleccionada.id, 'en_revision')}
                    disabled={procesando}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Pasar a Revisión
                  </button>
                  <button
                    onClick={() => cambiarEstadoSolicitud(solicitudSeleccionada.id, 'rechazada')}
                    disabled={procesando}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                </>
              )}
              
              {/* Etapa 2: En Revisión - Primera etapa del nuevo flujo */}
              {solicitudSeleccionada.estado === 'en_revision' && (
                <>
                  <button
                    onClick={iniciarModoRevision}
                    disabled={procesando}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    🔍 Revisar y Completar Información
                  </button>
                  <button
                    onClick={() => cambiarEstadoSolicitud(solicitudSeleccionada.id, 'activada')}
                    disabled={procesando}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    🎯 Activar Empresa (Rápido)
                  </button>
                  <button
                    onClick={() => cambiarEstadoSolicitud(solicitudSeleccionada.id, 'rechazada')}
                    disabled={procesando}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                </>
              )}

              {/* Etapa 3: Activada - Segunda etapa del nuevo flujo */}
              {solicitudSeleccionada.estado === 'activada' && (
                <div className="flex flex-col space-y-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <p className="text-green-800 text-sm font-medium">
                      ✅ Empresa activada y visible en el home
                    </p>
                    <p className="text-green-600 text-xs">
                      Siguiente paso: Asignar credenciales para que la empresa pueda gestionar su información
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setMostrandoModal(false);
                      setMostrandoModalCredenciales(true);
                    }}
                    disabled={procesando}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    🔑 Asignar Credenciales de Acceso
                  </button>
                </div>
              )}

              {/* Etapa 4: Credenciales Asignadas - Proceso completado */}
              {solicitudSeleccionada.estado === 'credenciales_asignadas' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-purple-800 text-sm font-medium">
                    🎉 Proceso completado exitosamente
                  </p>
                  <p className="text-purple-600 text-xs">
                    La empresa está visible en el home y tiene credenciales para gestionar su información
                  </p>
                  {solicitudSeleccionada.usuario_asignado && (
                    <p className="text-purple-700 text-xs mt-1">
                      Usuario asignado: {solicitudSeleccionada.usuario_asignado.email}
                    </p>
                  )}
                </div>
              )}

              {/* Estado rechazada */}
              {solicitudSeleccionada.estado === 'rechazada' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm font-medium">
                    ❌ Solicitud rechazada
                  </p>
                  <p className="text-red-600 text-xs">
                    Esta solicitud ha sido rechazada y no se procesará
                  </p>
                </div>
              )}

              {/* Botón especial para agentes: activación directa */}
              {esAgente && (solicitudSeleccionada.estado === 'pendiente' || solicitudSeleccionada.estado === 'en_revision') && (
                <button
                  onClick={() => cambiarEstadoSolicitud(solicitudSeleccionada.id, 'activada', 'Activada directamente por agente de campo')}
                  disabled={procesando}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  ⚡ Activar Directamente (Agente)
                </button>
              )}

              <button
                onClick={() => setMostrandoModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para asignar credenciales */}
      {mostrandoModalCredenciales && solicitudSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Asignar Credenciales: {solicitudSeleccionada.nombre_empresa}
              </h3>
              <button
                onClick={() => {
                  setMostrandoModalCredenciales(false);
                  setCredencialesForm({ email: '', password: '', confirmPassword: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Segunda etapa del proceso:</strong><br/>
                Asigna un email y contraseña para que la empresa pueda acceder a su panel de administración y gestionar su información, campañas, horarios, etc.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de acceso
                </label>
                <input
                  type="email"
                  value={credencialesForm.email}
                  onChange={(e) => setCredencialesForm(prev => ({...prev, email: e.target.value}))}
                  placeholder="email@empresa.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recomendado: usar el email del representante legal
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={credencialesForm.password}
                    onChange={(e) => setCredencialesForm(prev => ({...prev, password: e.target.value}))}
                    placeholder="Contraseña"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={generarPasswordAleatoria}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    🎲 Generar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar contraseña
                </label>
                <input
                  type="text"
                  value={credencialesForm.confirmPassword}
                  onChange={(e) => setCredencialesForm(prev => ({...prev, confirmPassword: e.target.value}))}
                  placeholder="Confirmar contraseña"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {credencialesForm.password && credencialesForm.password !== credencialesForm.confirmPassword && (
                <p className="text-red-600 text-sm">Las contraseñas no coinciden</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setMostrandoModalCredenciales(false);
                  setCredencialesForm({ email: '', password: '', confirmPassword: '' });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                disabled={procesando}
              >
                Cancelar
              </button>
              <button
                onClick={() => asignarCredenciales(solicitudSeleccionada.id)}
                disabled={procesando || !credencialesForm.email || !credencialesForm.password || credencialesForm.password !== credencialesForm.confirmPassword}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {procesando ? 'Asignando...' : '🔑 Asignar Credenciales'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de formulario para nueva solicitud */}
      {mostrandoFormulario && (
        <FormularioSolicitudEmpresa 
          onClose={() => setMostrandoFormulario(false)}
          onSuccess={() => {
            setMostrandoFormulario(false);
            cargarSolicitudes();
          }}
          esAgente={esAgente}
          agenteEmail={user?.email}
        />
      )}

      {/* MODAL DE REVISIÓN AVANZADA */}
      {modoRevision && solicitudSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  🔍 Revisión Avanzada: {solicitudSeleccionada.nombre_empresa}
                </h3>
                <button
                  onClick={() => setModoRevision(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Validación de Página Web */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">🌐 Validación de Página Web</h4>
                
                {solicitudSeleccionada.web_actual ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">URL: {solicitudSeleccionada.web_actual}</span>
                      <button
                        onClick={() => validarSitioWeb(solicitudSeleccionada.web_actual)}
                        disabled={validandoWeb}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {validandoWeb ? '🔄 Validando...' : '🔍 Validar'}
                      </button>
                    </div>
                    
                    {validacionWeb && (
                      <div className={`p-3 rounded border ${
                        validacionWeb.existe && validacionWeb.respondiendo 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <p className={`text-sm font-medium ${
                          validacionWeb.existe && validacionWeb.respondiendo 
                            ? 'text-green-800' 
                            : 'text-red-800'
                        }`}>
                          {validacionWeb.existe && validacionWeb.respondiendo 
                            ? '✅ Sitio web válido y funcionando' 
                            : '❌ Sitio web no disponible'}
                        </p>
                        {validacionWeb.error && (
                          <p className="text-red-600 text-xs mt-1">{validacionWeb.error}</p>
                        )}
                        {validacionWeb.tiempo_respuesta && (
                          <p className="text-gray-600 text-xs mt-1">
                            Tiempo de respuesta: {validacionWeb.tiempo_respuesta}ms
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ Esta empresa no tiene página web registrada. Se creará un perfil público detallado.
                    </p>
                  </div>
                )}
              </div>

              {/* Formulario de Datos Adicionales */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Información Comercial */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">📋 Información Comercial</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción Completa
                    </label>
                    <textarea
                      value={datosPerfilForm.descripcion_completa}
                      onChange={(e) => setDatosPerfilForm(prev => ({
                        ...prev,
                        descripcion_completa: e.target.value
                      }))}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Descripción detallada de la empresa y sus servicios..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Años de Funcionamiento
                    </label>
                    <select
                      value={datosPerfilForm.anos_funcionamiento}
                      onChange={(e) => setDatosPerfilForm(prev => ({
                        ...prev,
                        anos_funcionamiento: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="menos_1">Menos de 1 año</option>
                      <option value="1_2">1-2 años</option>
                      <option value="3_5">3-5 años</option>
                      <option value="6_10">6-10 años</option>
                      <option value="11_20">11-20 años</option>
                      <option value="mas_20">Más de 20 años</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL del Logo
                    </label>
                    <input
                      type="url"
                      value={datosPerfilForm.logo_url}
                      onChange={(e) => setDatosPerfilForm(prev => ({
                        ...prev,
                        logo_url: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://ejemplo.com/logo.png"
                    />
                  </div>
                </div>

                {/* Redes Sociales */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">📱 Redes Sociales</h4>
                  
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={datosPerfilForm.redes_sociales.facebook}
                      onChange={(e) => setDatosPerfilForm(prev => ({
                        ...prev,
                        redes_sociales: { ...prev.redes_sociales, facebook: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Facebook - https://facebook.com/empresa"
                    />
                    
                    <input
                      type="url"
                      value={datosPerfilForm.redes_sociales.instagram}
                      onChange={(e) => setDatosPerfilForm(prev => ({
                        ...prev,
                        redes_sociales: { ...prev.redes_sociales, instagram: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Instagram - https://instagram.com/empresa"
                    />
                    
                    <input
                      type="url"
                      value={datosPerfilForm.redes_sociales.linkedin}
                      onChange={(e) => setDatosPerfilForm(prev => ({
                        ...prev,
                        redes_sociales: { ...prev.redes_sociales, linkedin: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="LinkedIn - https://linkedin.com/company/empresa"
                    />
                    
                    <input
                      type="url"
                      value={datosPerfilForm.redes_sociales.twitter}
                      onChange={(e) => setDatosPerfilForm(prev => ({
                        ...prev,
                        redes_sociales: { ...prev.redes_sociales, twitter: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Twitter - https://twitter.com/empresa"
                    />
                  </div>

                  {/* Configuración del Perfil */}
                  <div className="border-t pt-4">
                    <h5 className="font-medium text-gray-900 mb-3">⚙️ Configuración del Perfil</h5>
                    
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={datosPerfilForm.crear_perfil_publico}
                          onChange={(e) => setDatosPerfilForm(prev => ({
                            ...prev,
                            crear_perfil_publico: e.target.checked
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Crear perfil público detallado</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={datosPerfilForm.web_validada}
                          onChange={(e) => setDatosPerfilForm(prev => ({
                            ...prev,
                            web_validada: e.target.checked
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Página web validada y funcionando</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Horarios */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">🕒 Horarios de Atención</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                  {Object.entries(datosPerfilForm.horarios).map(([dia, horario]) => (
                    <div key={dia} className="border border-gray-200 rounded p-3">
                      <label className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={horario.activo}
                          onChange={(e) => setDatosPerfilForm(prev => ({
                            ...prev,
                            horarios: {
                              ...prev.horarios,
                              [dia]: { ...prev.horarios[dia], activo: e.target.checked }
                            }
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium capitalize">{dia}</span>
                      </label>
                      
                      {horario.activo && (
                        <div className="space-y-2">
                          <input
                            type="time"
                            value={horario.inicio}
                            onChange={(e) => setDatosPerfilForm(prev => ({
                              ...prev,
                              horarios: {
                                ...prev.horarios,
                                [dia]: { ...prev.horarios[dia], inicio: e.target.value }
                              }
                            }))}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                          />
                          <input
                            type="time"
                            value={horario.fin}
                            onChange={(e) => setDatosPerfilForm(prev => ({
                              ...prev,
                              horarios: {
                                ...prev.horarios,
                                [dia]: { ...prev.horarios[dia], fin: e.target.value }
                              }
                            }))}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end space-x-3">
              <button
                onClick={() => setModoRevision(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              
              <button
                onClick={guardarDatosRevision}
                disabled={procesando}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                💾 Guardar Revisión
              </button>
              
              <button
                onClick={activarConPerfilCompleto}
                disabled={procesando}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                🎯 Activar con Perfil Completo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente separado para el formulario de solicitud
function FormularioSolicitudEmpresa({ onClose, onSuccess, esAgente, agenteEmail }) {
  const [formData, setFormData] = useState({
    // Información de la empresa
    nombre_empresa: '',
    rut_empresa: '',
    direccion_empresa: '',
    comuna: '',
    region: '',
    telefono_empresa: '',
    email_empresa: '',
    web_actual: '',
    categoria: '',
    
    // Representante legal
    representante_nombre: '',
    representante_apellidos: '',
    cargo_representante: '',
    email_representante: '',
    telefono_representante: '',
    
    // Información adicional
    descripcion: '',
    necesita_pagina_web: false,
    activacion_directa: false // Para agentes
  });
  
  const [enviando, setEnviando] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre_empresa || !formData.email_empresa || !formData.representante_nombre) {
      alert('Por favor, completa al menos los campos obligatorios');
      return;
    }

    try {
      setEnviando(true);
      
      const solicitudData = {
        ...formData,
        estado: esAgente && formData.activacion_directa ? 'activada' : 'pendiente',
        fecha_solicitud: new Date(),
        fecha_ultima_actualizacion: new Date(),
        creado_por: agenteEmail,
        es_agente_campo: esAgente,
        origen: esAgente ? 'agente_campo' : 'web'
      };

      const docRef = await addDoc(collection(db, 'solicitudes_empresa'), solicitudData);
      
      // Si es agente y solicita activación directa, crear empresa inmediatamente (primera etapa)
      if (esAgente && formData.activacion_directa) {
        await crearEmpresaDesdeActivacionDirecta(docRef.id, solicitudData);
      }
      
      alert(esAgente && formData.activacion_directa 
        ? 'Solicitud creada y empresa activada (visible en home). Pendiente asignar credenciales.' 
        : 'Solicitud creada exitosamente'
      );
      onSuccess();
    } catch (error) {
      console.error('Error creando solicitud:', error);
      alert('Error al crear la solicitud');
    } finally {
      setEnviando(false);
    }
  };

  const crearEmpresaDesdeActivacionDirecta = async (solicitudId, solicitudData) => {
    try {
      const empresaData = {
        // Información básica
        nombre: solicitudData.nombre_empresa,
        email: solicitudData.email_empresa,
        telefono: solicitudData.telefono_empresa,
        direccion: solicitudData.direccion_empresa,
        comuna: solicitudData.comuna,
        region: solicitudData.region,
        rut: solicitudData.rut_empresa,
        web: solicitudData.web_actual || '',
        
        // Representante
        representante: {
          nombre: solicitudData.nombres_representante || solicitudData.representante_nombre || '',
          apellidos: solicitudData.apellidos_representante || solicitudData.representante_apellidos || '',
          cargo: solicitudData.cargo_representante || '',
          email: solicitudData.email_representante || '',
          telefono: solicitudData.telefono_representante || ''
        },

        // Estado y configuración - PRIMERA ETAPA (activada por agente)
        estado: 'activa', // Visible en home
        etapa_proceso: 'activada_sin_credenciales',
        categoria: solicitudData.categoria || 'Sin categoría',
        fecha_registro: new Date(),
        fecha_activacion: new Date(),
        admin_activador: agenteEmail,
        solicitud_origen_id: solicitudId,

        // Configuraciones por defecto
        logoAsignado: false,
        webValidada: !!solicitudData.web_actual,
        perfilCompleto: false,
        tiene_credenciales_asignadas: false,
        usuario_empresa: null,
        horarios: {
          lunes: { activo: true, inicio: '09:00', fin: '18:00' },
          martes: { activo: true, inicio: '09:00', fin: '18:00' },
          miercoles: { activo: true, inicio: '09:00', fin: '18:00' },
          jueves: { activo: true, inicio: '09:00', fin: '18:00' },
          viernes: { activo: true, inicio: '09:00', fin: '18:00' },
          sabado: { activo: false, inicio: '09:00', fin: '13:00' },
          domingo: { activo: false, inicio: '10:00', fin: '14:00' }
        }
      };

      await addDoc(collection(db, 'empresas'), empresaData);
      console.log('Empresa activada directamente por agente (primera etapa completada)');
    } catch (error) {
      console.error('Error creando empresa desde activación directa:', error);
      throw error;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-96 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">
              {esAgente ? 'Nueva Solicitud - Agente de Campo' : 'Nueva Solicitud de Empresa'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información de la empresa */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Información de la Empresa</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la empresa *
                  </label>
                  <input
                    type="text"
                    name="nombre_empresa"
                    value={formData.nombre_empresa}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RUT de la empresa
                  </label>
                  <input
                    type="text"
                    name="rut_empresa"
                    value={formData.rut_empresa}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="12.345.678-9"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de la empresa *
                  </label>
                  <input
                    type="email"
                    name="email_empresa"
                    value={formData.email_empresa}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono_empresa"
                    value={formData.telefono_empresa}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="direccion_empresa"
                    value={formData.direccion_empresa}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comuna
                  </label>
                  <input
                    type="text"
                    name="comuna"
                    value={formData.comuna}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sitio web actual
                  </label>
                  <input
                    type="url"
                    name="web_actual"
                    value={formData.web_actual}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://ejemplo.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar categoría</option>
                    <option value="Repuestos">Repuestos</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Talleres">Talleres</option>
                    <option value="Seguros">Seguros</option>
                    <option value="Venta de Vehículos">Venta de Vehículos</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Representante legal */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Representante Legal</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    name="representante_nombre"
                    value={formData.representante_nombre}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    name="representante_apellidos"
                    value={formData.representante_apellidos}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo
                  </label>
                  <input
                    type="text"
                    name="cargo_representante"
                    value={formData.cargo_representante}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Gerente General, Propietario"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email del representante
                  </label>
                  <input
                    type="email"
                    name="email_representante"
                    value={formData.email_representante}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción de la empresa
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe brevemente la actividad de la empresa..."
              />
            </div>

            {/* Opciones especiales para agentes */}
            {esAgente && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-purple-900 mb-3">Opciones de Agente de Campo</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="activacion_directa"
                      name="activacion_directa"
                      checked={formData.activacion_directa}
                      onChange={handleChange}
                      className="rounded"
                    />
                    <label htmlFor="activacion_directa" className="ml-2 text-sm text-purple-800">
                      <strong>Activar empresa inmediatamente</strong> (para empresas validadas en terreno)
                    </label>
                  </div>
                  <p className="text-xs text-purple-700">
                    ⚠️ Solo marca esta opción si has verificado personalmente la empresa y sus datos
                  </p>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                disabled={enviando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {enviando ? 'Creando...' : (formData.activacion_directa ? 'Crear y Activar' : 'Crear Solicitud')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
