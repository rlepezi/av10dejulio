import React from 'react';
import { useAuth } from './AuthProvider';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';

// Utilidad recursiva para mostrar todos los campos y tipos

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

  // Utilidad recursiva para mostrar todos los campos y tipos
  function renderAllFields(obj, parentKey = '') {
    if (obj === null) {
      return (
        <div className="mb-1"><span className="font-mono text-gray-700">{parentKey || 'null'}</span>: <span className="text-red-700">null</span></div>
      );
    }
    if (typeof obj === 'boolean') {
      return (
        <div className="mb-1"><span className="font-mono text-gray-700">{parentKey}</span>: <span className={obj ? 'text-green-700' : 'text-red-700'}>{obj ? 'true' : 'false'}</span> <span className="text-gray-400">(boolean)</span></div>
      );
    }
    if (typeof obj === 'number') {
      return (
        <div className="mb-1"><span className="font-mono text-gray-700">{parentKey}</span>: <span className="text-blue-700">{obj}</span> <span className="text-gray-400">(number)</span></div>
      );
    }
    if (typeof obj === 'string') {
      // Si es base64 de imagen, mostrar preview
      if (parentKey && (parentKey.toLowerCase().includes('logo') || parentKey.toLowerCase().includes('imagen')) && obj.startsWith('data:image')) {
        return (
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-gray-700">{parentKey}</span>:
            <img src={obj} alt={parentKey} className="h-12 w-12 object-contain border rounded bg-white" />
            <span className="text-gray-400">(imagen)</span>
          </div>
        );
      }
      return (
        <div className="mb-1"><span className="font-mono text-gray-700">{parentKey}</span>: <span className="text-gray-900">{obj || <span className="text-red-700">'""'</span>}</span> <span className="text-gray-400">(string)</span></div>
      );
    }
    if (Array.isArray(obj)) {
      // Si es galería de imágenes, mostrar previews
      if (parentKey && (parentKey.toLowerCase().includes('galeria') || parentKey.toLowerCase().includes('imagenes'))) {
        return (
          <div className="mb-2">
            <span className="font-medium">Descripción:</span> {
              solicitud.datos_solicitud?.descripcionCompleta ||
              solicitud.datos_solicitud?.descripcion ||
              solicitud.descripcionCompleta ||
              solicitud.descripcion ||
              <span className="text-red-700">[sin descripción]</span>
            }
            <div className="mt-2">
              {obj.length === 0 ? (
                <span className="text-red-700">[vacío]</span>
              ) : (
                obj.map((img, idx) => {
                  if (typeof img === 'string' && img.startsWith('data:image')) {
                    return <img key={idx} src={img} alt={`img${idx}`} className="h-12 w-12 object-cover border rounded bg-white" />;
                  }
                  if (img && typeof img === 'object' && img.base64) {
                    return <img key={idx} src={img.base64} alt={img.name || `img${idx}`} className="h-12 w-12 object-cover border rounded bg-white" />;
                  }
                  if (typeof img === 'string' && (img.startsWith('http') || img.startsWith('/'))) {
                    return <img key={idx} src={img} alt={`img${idx}`} className="h-12 w-12 object-cover border rounded bg-white" />;
                  }
                  return <span key={idx} className="text-gray-400">(no imagen)</span>;
                })
              )}
            </div>
          </div>
        );
      }
      return (
        <div className="mb-1">
          <span className="font-mono text-gray-700">{parentKey}</span>: <span className="text-gray-400">(array, {obj.length} items)</span>
          <div className="ml-4 border-l-2 border-gray-200 pl-2">
            {obj.length === 0 ? <span className="text-red-700">[vacío]</span> : obj.map((item, idx) => (
              <div key={idx}>{renderAllFields(item, `[${idx}]`)}</div>
            ))}
          </div>
        </div>
      );
    }
    if (typeof obj === 'object') {
      // Firestore Timestamp special handling
      if (obj && typeof obj.toDate === 'function') {
        const date = obj.toDate();
        return (
          <div className="mb-1"><span className="font-mono text-gray-700">{parentKey}</span>: <span className="text-purple-700">{date.toLocaleString()}</span> <span className="text-gray-400">(timestamp)</span></div>
        );
      }
      // File data special handling (logo, galeria)
      if (obj && obj.base64 && obj.name) {
        return (
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-gray-700">{parentKey}</span>:
            <img src={obj.base64} alt={obj.name} className="h-12 w-12 object-contain border rounded bg-white" />
            <span className="text-pink-700">Archivo: {obj.name} ({(obj.size/1024/1024).toFixed(2)} MB)</span>
          </div>
        );
      }
      // General object/map
      return (
        <div className="mb-1">
          <span className="font-mono text-gray-700">{parentKey}</span>: <span className="text-gray-400">(map)</span>
          <div className="ml-4 border-l-2 border-gray-200 pl-2">
            {Object.keys(obj).length === 0 ? <span className="text-red-700">[vacío]</span> : Object.entries(obj).map(([key, value]) => (
              <div key={key}>{renderAllFields(value, key)}</div>
            ))}
          </div>
        </div>
      );
    }
    // Fallback
    return (
      <div className="mb-1"><span className="font-mono text-gray-700">{parentKey}</span>: <span className="text-gray-400">(tipo desconocido)</span></div>
    );
  }
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
      console.log('🔍 DEBUG: Iniciando carga de solicitudes...');
      
      // Primero obtengamos todos los documentos sin orderBy para debug
      const allDocsQuery = query(collection(db, 'solicitudes_empresa'));
      const allSnapshot = await getDocs(allDocsQuery);
      console.log('🔍 DEBUG: TOTAL documentos en solicitudes_empresa (sin filtros):', allSnapshot.docs.length);
      
      // Debuggeamos cada documento completo
      allSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`🔍 DEBUG DOC ${index + 1}:`, {
          id: doc.id,
          nombre_empresa: data.nombre_empresa || data.nombre,
          estado: data.estado,
          fecha_solicitud: data.fecha_solicitud || data.fecha_registro,
          hasDateField: !!(data.fecha_solicitud || data.fecha_registro),
          dateType: typeof (data.fecha_solicitud || data.fecha_registro),
          dateValue: data.fecha_solicitud || data.fecha_registro,
          origen: data.origen || 'no especificado',
          allFields: Object.keys(data)
        });
      });
      
      // Ahora intentemos con orderBy - probamos ambos campos de fecha
      console.log('🔍 DEBUG: Intentando query con orderBy...');
      let q;
      try {
        // Primero intentamos con fecha_registro (nueva estructura)
        q = query(collection(db, 'solicitudes_empresa'), orderBy('fecha_registro', 'desc'));
        const snapshot = await getDocs(q);
        console.log('🔍 DEBUG: Query con orderBy (fecha_registro) exitoso, docs:', snapshot.docs.length);
        
        const solicitudesData = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('🔍 DEBUG: Documento en resultado final:', { 
            id: doc.id,
            estado: data.estado,
            fecha: data.fecha_registro || data.fecha_solicitud,
            nombre: data.nombre || data.nombre_empresa 
          });
          
          // Normalizar datos para compatibilidad con componente
          return {
            id: doc.id,
            ...data,
            // Campos compatibles con estructura anterior
            nombre_empresa: data.nombre || data.nombre_empresa,
            email_empresa: data.email || data.email_empresa,
            telefono_empresa: data.telefono || data.telefono_empresa,
            direccion_empresa: data.direccion || data.direccion_empresa,
            rut_empresa: data.rut || data.rut_empresa,
            web_actual: data.web || data.web_actual,
            fecha_solicitud: data.fecha_registro || data.fecha_solicitud,
            // Representante normalizado
            nombres_representante: data.representante?.nombre || data.nombres_representante,
            apellidos_representante: data.representante?.apellidos || data.apellidos_representante,
            email_representante: data.representante?.email || data.email_representante,
            telefono_representante: data.representante?.telefono || data.telefono_representante,
            cargo_representante: data.representante?.cargo || data.cargo_representante
          };
        });
        
        console.log('🔍 DEBUG: Total solicitudes cargadas:', solicitudesData.length);
        setSolicitudes(solicitudesData);
      } catch (orderByError) {
        console.error('❌ ERROR con orderBy fecha_registro, intentando fecha_solicitud:', orderByError);
        try {
          // Fallback con fecha_solicitud (estructura anterior)
          q = query(collection(db, 'solicitudes_empresa'), orderBy('fecha_solicitud', 'desc'));
          const snapshot = await getDocs(q);
          console.log('🔍 DEBUG: Query con orderBy (fecha_solicitud) exitoso, docs:', snapshot.docs.length);
          
          const solicitudesData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Normalizar para ambas estructuras
              nombre_empresa: data.nombre || data.nombre_empresa,
              email_empresa: data.email || data.email_empresa,
              telefono_empresa: data.telefono || data.telefono_empresa,
              direccion_empresa: data.direccion || data.direccion_empresa,
              rut_empresa: data.rut || data.rut_empresa,
              web_actual: data.web || data.web_actual,
              fecha_solicitud: data.fecha_registro || data.fecha_solicitud,
              nombres_representante: data.representante?.nombre || data.nombres_representante,
              apellidos_representante: data.representante?.apellidos || data.apellidos_representante,
              email_representante: data.representante?.email || data.email_representante,
              telefono_representante: data.representante?.telefono || data.telefono_representante,
              cargo_representante: data.representante?.cargo || data.cargo_representante
            };
          });
          
          setSolicitudes(solicitudesData);
        } catch (fallbackError) {
          console.error('❌ ERROR con orderBy fecha_solicitud también:', fallbackError);
          console.log('🔄 Intentando sin orderBy...');
          
          // Fallback sin orderBy
          const simpleSnapshot = await getDocs(allDocsQuery);
          const solicitudesData = simpleSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Normalizar para ambas estructuras
              nombre_empresa: data.nombre || data.nombre_empresa,
              email_empresa: data.email || data.email_empresa,
              telefono_empresa: data.telefono || data.telefono_empresa,
              direccion_empresa: data.direccion || data.direccion_empresa,
              rut_empresa: data.rut || data.rut_empresa,
              web_actual: data.web || data.web_actual,
              fecha_solicitud: data.fecha_registro || data.fecha_solicitud,
              nombres_representante: data.representante?.nombre || data.nombres_representante,
              apellidos_representante: data.representante?.apellidos || data.apellidos_representante,
              email_representante: data.representante?.email || data.email_representante,
              telefono_representante: data.representante?.telefono || data.telefono_representante,
              cargo_representante: data.representante?.cargo || data.cargo_representante
            };
          });
          
          console.log('🔍 DEBUG: Solicitudes cargadas sin orderBy:', solicitudesData.length);
          setSolicitudes(solicitudesData);
        }
      }
    } catch (error) {
      console.error('❌ Error cargando solicitudes:', error);
      console.error('❌ Error completo:', error.message, error.code);
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
        // Heredar rubro y tipoEmpresa de todas las variantes posibles
        rubro: solicitud.rubro || solicitud.datos_solicitud?.rubro || solicitud.categoria || '',
        tipoEmpresa: solicitud.tipoEmpresa || solicitud.datos_solicitud?.tipoEmpresa || '',
        
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
        descripcion: descripcion_completa,
        descripcion_completa: descripcion_completa,

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
        // Heredar tipoEmpresa y rubro de todas las variantes posibles
        tipoEmpresa: solicitud.tipoEmpresa || solicitud.datos_solicitud?.tipoEmpresa || solicitud["tipo_empresa"] || solicitud.tipo_empresa || '',
        rubro: solicitud.rubro || solicitud.datos_solicitud?.rubro || solicitud.categoria || '',
        // Heredar descripción, servicios, marcas, logo e imágenes de la solicitud
        descripcion: solicitud.descripcion || solicitud.descripcionCompleta || solicitud.datos_solicitud?.descripcion || '',
        descripcionCompleta: solicitud.descripcionCompleta || solicitud.descripcion || solicitud.descripcionCompleta || solicitud.datos_solicitud?.descripcionCompleta || solicitud.datos_solicitud?.descripcion || '',
        servicios: solicitud.servicios || solicitud.categorias_servicios || solicitud.datos_solicitud?.servicios || [],
        marcas: (solicitud.marcas && solicitud.marcas.length > 0 && solicitud.marcas)
          || (solicitud.marcas_vehiculos && solicitud.marcas_vehiculos.length > 0 && solicitud.marcas_vehiculos)
          || (solicitud.datos_solicitud && Array.isArray(solicitud.datos_solicitud.marcas) && solicitud.datos_solicitud.marcas.length > 0 && solicitud.datos_solicitud.marcas)
          || (solicitud.perfil_publico && Array.isArray(solicitud.perfil_publico.marcas) && solicitud.perfil_publico.marcas.length > 0 && solicitud.perfil_publico.marcas)
          || [],
        logo: solicitud.logo || solicitud.logo_file_data || solicitud.datos_solicitud?.logo_file_data || solicitud.perfil_publico?.logo || '',
        galeria: solicitud.galeria || solicitud.galeria_files_data || solicitud.datos_solicitud?.galeria_files_data || solicitud.perfil_publico?.galeria || [],
        // Representante
        representante: {
          nombre: solicitud.nombres_representante || solicitud.representante_nombre || '',
          apellidos: solicitud.apellidos_representante || solicitud.representante_apellidos || '',
          cargo: solicitud.cargo_representante || '',
          email: solicitud.email_representante || '',
          telefono: solicitud.telefono_representante || ''
        },
        // Estado y configuración - PRIMERA ETAPA
        estado: 'activa',
        etapa_proceso: 'activada_sin_credenciales',
        categoria: solicitud.categoria || 'Sin categoría',
        fecha_registro: new Date(),
        fecha_activacion: new Date(),
        admin_activador: user?.email,
        solicitud_origen_id: solicitudId,
        // Configuraciones por defecto
        logoAsignado: !!(solicitud.logo || solicitud.logo_file_data || solicitud.datos_solicitud?.logo_file_data || solicitud.perfil_publico?.logo),
        webValidada: !!solicitud.web_actual,
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

      // 1. Crear usuario en Firebase Auth
      let userCredential = null;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, credencialesForm.email, credencialesForm.password);
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          // Si el usuario ya existe, continuar con la asignación de credenciales
          console.warn('El usuario ya existe en Firebase Auth, se asignarán credenciales igualmente.');
        } else {
          throw authError;
        }
      }

      // 1b. Crear documento en Firestore 'usuarios' para el nuevo usuario
      let nuevoUid = null;
      if (userCredential && userCredential.user) {
        nuevoUid = userCredential.user.uid;
        const nuevoUsuario = {
          uid: nuevoUid,
          email: credencialesForm.email,
          rol: 'empresa', // o 'proveedor', según tu lógica
          nombre_empresa: credencialesForm.nombre_empresa || '',
          fecha_creacion: new Date(),
          activo: true
        };
        await addDoc(collection(db, 'usuarios'), nuevoUsuario);
      }

      // 2. Actualizar la solicitud a estado "credenciales_asignadas"
      await updateDoc(doc(db, 'solicitudes_empresa', solicitudId), {
        estado: 'credenciales_asignadas',
        fecha_credenciales_asignadas: new Date(),
        admin_credenciales: user?.email,
        usuario_asignado: {
          email: credencialesForm.email,
          fecha_asignacion: new Date()
        }
      });

      // 3. Buscar y actualizar la empresa correspondiente
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
          fecha_credenciales_asignadas: new Date(),
          uid_auth: nuevoUid || null // <-- Guardar el UID generado por Auth
        });
      }

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

  // Función de debug para crear solicitud de prueba
  const crearSolicitudDebug = async () => {
    try {
      console.log('🧪 DEBUG: Creando solicitud de prueba...');
      
      const solicitudPrueba = {
        nombre_empresa: 'Empresa Debug Test',
        email_empresa: 'debug@test.com',
        telefono_empresa: '123456789',
        direccion_empresa: 'Calle Debug 123',
        web_actual: 'https://debug.com',
        comuna: 'Santiago',
        region: 'Metropolitana',
        categoria: 'Tecnología',
        descripcion_empresa: 'Empresa de prueba para debug',
        anos_funcionamiento: '5',
        logo_url: '',
        redes_sociales: {
          facebook: '',
          instagram: '',
          linkedin: '',
          twitter: ''
        },
        representante: {
          nombres_representante: 'Juan',
          apellidos_representante: 'Pérez',
          email_representante: 'juan@debug.com',
          telefono_representante: '987654321',
          cargo_representante: 'Gerente'
        },
        fecha_solicitud: new Date(),
        fecha_registro: new Date(),
        fecha_actualizacion: new Date(),
        estado: 'pendiente',
        origen: 'debug_admin'
      };
      
      console.log('🧪 DEBUG: Datos de solicitud de prueba:', solicitudPrueba);
      
      // Normalizar usando normalizeSolicitudData para preservar fecha_solicitud
      const solicitudNormalizada = normalizeSolicitudData(solicitudPrueba);
      console.log('🧪 DEBUG: Datos normalizados:', solicitudNormalizada);
      console.log('🧪 DEBUG: fecha_solicitud:', solicitudNormalizada.fecha_solicitud);
      
      const docRef = await addDoc(collection(db, 'solicitudes_empresa'), solicitudNormalizada);
      console.log('✅ DEBUG: Solicitud de prueba creada con ID:', docRef.id);
      
      alert('Solicitud de prueba creada exitosamente!');
      await cargarSolicitudes();
      
    } catch (error) {
      console.error('❌ ERROR creando solicitud de prueba:', error);
      alert('Error creando solicitud de prueba: ' + error.message);
    }
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

      {/* Botón de Debug */}
      <div className="mb-6">
        <button
          onClick={crearSolicitudDebug}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          🧪 Crear Solicitud de Prueba (Debug)
        </button>
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
                  Días
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origen
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(() => {
                      const fecha = solicitud.fecha_solicitud?.toDate?.() || solicitud.fecha_registro?.toDate?.();
                      if (!fecha) return 'N/A';
                      const hoy = new Date();
                      const diff = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
                      return diff + ' días';
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {solicitud.origen || solicitud.datos_solicitud?.origen || 'N/A'}
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
        <div className="fixed inset-0 z-50 flex">
          {/* Fondo oscuro */}
          <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" onClick={() => setMostrandoModal(false)}></div>
          {/* Drawer lateral */}
          <div className="relative ml-auto w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col animate-slideInRight">
            {/* Cabecera fija */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold text-blue-900 truncate pr-4">
                Detalles de Solicitud
                <span className="block text-base font-normal text-gray-700">{solicitudSeleccionada.nombre_empresa}</span>
              </h3>
              <button
                onClick={() => setMostrandoModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
                aria-label="Cerrar"
              >✕</button>
            </div>
            {/* Contenido scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Sección Empresa */}
              <details open className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <summary className="font-semibold text-blue-900 cursor-pointer mb-2">🏢 Información de la Empresa</summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="font-medium text-gray-700">Nombre:</span> <span className="text-gray-900">{solicitudSeleccionada.nombre_empresa || 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">RUT:</span> <span className="text-gray-900">{solicitudSeleccionada.rut_empresa || 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">Dirección:</span> <span className="text-gray-900">{solicitudSeleccionada.direccion_empresa || 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">Comuna:</span> <span className="text-gray-900">{solicitudSeleccionada.comuna || 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">Región:</span> <span className="text-gray-900">{solicitudSeleccionada.region || 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">Teléfono:</span> <span className="text-gray-900">{solicitudSeleccionada.telefono_empresa || 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-900">{solicitudSeleccionada.email_empresa || 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">Sitio Web:</span> <span className="text-gray-900">{solicitudSeleccionada.web_actual ? (<a href={solicitudSeleccionada.web_actual} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{solicitudSeleccionada.web_actual}</a>) : 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">Rubro:</span> <span className="text-gray-900">{solicitudSeleccionada.rubro || 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">Tipo de empresa:</span> <span className="text-gray-900">{solicitudSeleccionada.tipoEmpresa || 'No especificado'}</span></div>
                </div>
              </details>

              {/* Sección Representante */}
              <details className="bg-green-50 border border-green-200 rounded-lg p-4">
                <summary className="font-semibold text-green-900 cursor-pointer mb-2">👤 Representante Legal</summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="font-medium text-gray-700">Nombres:</span> <span className="text-gray-900">{solicitudSeleccionada.nombres_representante || solicitudSeleccionada.representante?.nombre || 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">Apellidos:</span> <span className="text-gray-900">{solicitudSeleccionada.apellidos_representante || solicitudSeleccionada.representante?.apellidos || 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">RUT:</span> <span className="text-gray-900">{solicitudSeleccionada.rut_representante || solicitudSeleccionada.representante?.rut_representante || 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">Cargo:</span> <span className="text-gray-900">{solicitudSeleccionada.cargo_representante || solicitudSeleccionada.representante?.cargo || 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">Fecha de nacimiento:</span> <span className="text-gray-900">{solicitudSeleccionada.fecha_nacimiento_representante || 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-900">{solicitudSeleccionada.email_representante || solicitudSeleccionada.representante?.email || 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">Teléfono:</span> <span className="text-gray-900">{solicitudSeleccionada.telefono_representante || solicitudSeleccionada.representante?.telefono || 'No especificado'}</span></div>
                </div>
              </details>

              {/* Sección Negocio */}
              <details className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <summary className="font-semibold text-purple-900 cursor-pointer mb-2">💼 Información del Negocio</summary>
                <div className="space-y-3 text-sm">
                  <div><span className="font-medium text-gray-700">Descripción:</span> <span className="text-gray-900">{solicitudSeleccionada.descripcionCompleta || solicitudSeleccionada.datos_solicitud?.descripcion || 'No especificado'}</span></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><span className="font-medium text-gray-700">Años de funcionamiento:</span> <span className="text-gray-900">{solicitudSeleccionada.anos_funcionamiento || solicitudSeleccionada.datos_solicitud?.anos_funcionamiento || 'No especificado'}</span></div>
                    <div><span className="font-medium text-gray-700">Número de empleados:</span> <span className="text-gray-900">{solicitudSeleccionada.numero_empleados || solicitudSeleccionada.datos_solicitud?.numero_empleados || 'No especificado'}</span></div>
                  </div>
                </div>
              </details>

              {/* Sección Multimedia */}
              <details className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <summary className="font-semibold text-pink-900 cursor-pointer mb-2">📸 Archivos Multimedia</summary>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Logo de la empresa:</h5>
                    {solicitudSeleccionada.logo || solicitudSeleccionada.datos_solicitud?.logo_file_data ? (
                      <div className="bg-white p-2 rounded border">
                        <img 
                          src={solicitudSeleccionada.logo || solicitudSeleccionada.datos_solicitud?.logo_file_data?.base64} 
                          alt="Logo empresa" 
                          className="h-16 w-16 object-cover rounded border"
                        />
                        {solicitudSeleccionada.datos_solicitud?.logo_file_data && (
                          <p className="text-xs text-gray-600 mt-1">
                            {solicitudSeleccionada.datos_solicitud.logo_file_data.name} 
                            ({(solicitudSeleccionada.datos_solicitud.logo_file_data.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm">No hay logo subido</p>
                    )}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Galería de imágenes:</h5>
                    {(solicitudSeleccionada.galeria && solicitudSeleccionada.galeria.length > 0) || 
                     (solicitudSeleccionada.datos_solicitud?.galeria_files_data && solicitudSeleccionada.datos_solicitud.galeria_files_data.length > 0) ? (
                      <div className="grid grid-cols-3 gap-2">
                        {(solicitudSeleccionada.galeria || solicitudSeleccionada.datos_solicitud?.galeria_files_data?.map(f => f.base64) || []).map((imagen, index) => (
                          <img 
                            key={index}
                            src={imagen} 
                            alt={`Galería ${index + 1}`} 
                            className="h-16 w-16 object-cover rounded border"
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm">No hay imágenes en la galería</p>
                    )}
                  </div>
                </div>
              </details>

              {/* Sección Términos y Control */}
              <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer mb-2">📋 Términos y Control</summary>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className={`w-4 h-4 mr-2 rounded ${(solicitudSeleccionada.datos_solicitud?.acepta_terminos ?? solicitudSeleccionada.acepta_terminos) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Acepta términos y condiciones: {(solicitudSeleccionada.datos_solicitud?.acepta_terminos ?? solicitudSeleccionada.acepta_terminos) ? 'Sí' : 'No'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`w-4 h-4 mr-2 rounded ${(solicitudSeleccionada.datos_solicitud?.acepta_notificaciones ?? solicitudSeleccionada.acepta_notificaciones) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Acepta notificaciones: {(solicitudSeleccionada.datos_solicitud?.acepta_notificaciones ?? solicitudSeleccionada.acepta_notificaciones) ? 'Sí' : 'No'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`w-4 h-4 mr-2 rounded ${(solicitudSeleccionada.datos_solicitud?.acepta_visita_agente ?? solicitudSeleccionada.acepta_visita_campo) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Acepta visita de agente: {(solicitudSeleccionada.datos_solicitud?.acepta_visita_agente ?? solicitudSeleccionada.acepta_visita_campo) ? 'Sí' : 'No'}</span>
                  </div>
                  <div><span className="font-medium text-gray-700">Estado actual:</span> <span className="text-gray-900">{solicitudSeleccionada.estado || 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">Etapa del proceso:</span> <span className="text-gray-900">{solicitudSeleccionada.etapa_proceso || 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">Fecha de registro:</span> <span className="text-gray-900">{solicitudSeleccionada.fecha_registro?.toDate?.()?.toLocaleDateString() || solicitudSeleccionada.fecha_solicitud?.toDate?.()?.toLocaleDateString() || 'No especificado'}</span></div>
                  <div><span className="font-medium text-gray-700">Admin activador:</span> <span className="text-gray-900">{solicitudSeleccionada.admin_activador || 'Pendiente'}</span></div>
                  {solicitudSeleccionada.comentario_admin && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                      <span className="font-semibold text-red-900">💬 Comentarios del Administrador:</span>
                      <p className="text-sm text-red-800 bg-white p-2 rounded border mt-1">{solicitudSeleccionada.comentario_admin}</p>
                    </div>
                  )}
                </div>
              </details>
            </div>
            {/* Footer fijo con acciones */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end space-x-3">
              <button
                onClick={() => setMostrandoModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >Cerrar</button>
              {solicitudSeleccionada.estado === 'en_revision' && (
                <button
                  onClick={activarConPerfilCompleto}
                  disabled={procesando}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  🎯 Activar empresa
                </button>
              )}
              {solicitudSeleccionada.estado === 'pendiente' && (
                <button
                  onClick={async () => {
                    setProcesando(true);
                    try {
                      await cambiarEstadoSolicitud(
                        solicitudSeleccionada.id,
                        'en_revision',
                        'Solicitud pasada a revisión por el administrador.'
                      );
                      await cargarSolicitudes();
                      setMostrandoModal(false);
                    } catch (error) {
                      alert('Error al pasar a revisión: ' + error.message);
                    } finally {
                      setProcesando(false);
                    }
                  }}
                  disabled={procesando}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  🔍 Pasar a revisión
                </button>
              )}
              {solicitudSeleccionada.estado === 'activada' && (
                <button
                  onClick={() => setMostrandoModalCredenciales(true)}
                  disabled={procesando}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  🔑 Asignar Credenciales
                </button>
              )}
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
                    <p className="text-yellow-800 text-sm font-medium">
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
