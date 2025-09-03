import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, addDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { db, auth } from '../firebase';
import HeaderMenu from '../components/HeaderMenu';
import SubscriptionStatus from '../components/SubscriptionStatus';
import MembershipLimitations from '../components/MembershipLimitations';
import UsageMetrics from '../components/UsageMetrics';

export default function DashboardProveedorInterno() {
  const { empresaId: empresaIdParam } = useParams();
  const [empresa, setEmpresa] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);
  const [productos, setProductos] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [metricas, setMetricas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [productForm, setProductForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    marca: '',
    stock: '',
    imagen: null
  });
  const [campaignForm, setCampaignForm] = useState({
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    presupuesto: '',
    tipo: 'promocional'
  });
  const [submitting, setSubmitting] = useState(false);
  const [solicitudesProductos, setSolicitudesProductos] = useState([]);
  const [solicitudesCampanas, setSolicitudesCampanas] = useState([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [showNotificaciones, setShowNotificaciones] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [mensajesChat, setMensajesChat] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [agenteAsignado, setAgenteAsignado] = useState(null);
  const [historialCambios, setHistorialCambios] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [reportes, setReportes] = useState({
    solicitudesDelMes: 0,
    solicitudesAprobadas: 0,
    solicitudesRechazadas: 0,
    tiempoPromedioRespuesta: 0,
    productosActivos: 0,
    campanasActivas: 0
  });
  const [loadingReportes, setLoadingReportes] = useState(false);
  const [filtroReporte, setFiltroReporte] = useState({
    fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    tipo: 'todos',
    estado: 'todos'
  });
  const [showReporteModal, setShowReporteModal] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [recordatorios, setRecordatorios] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [vistaCalendario, setVistaCalendario] = useState('mes'); // 'mes', 'semana', 'dia'
  const [showEventoModal, setShowEventoModal] = useState(false);
  const [eventoForm, setEventoForm] = useState({
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    tipo: 'general',
    prioridad: 'normal',
    recordatorio: true,
    recordatorioAntes: '1_dia'
  });

  // Estados para acciones de usuario
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showAssignCredentialsModal, setShowAssignCredentialsModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [emailForm, setEmailForm] = useState({
    currentEmail: '',
    newEmail: '',
    confirmEmail: '',
    password: ''
  });
  const [twoFAForm, setTwoFAForm] = useState({
    isEnabled: false,
    method: 'sms', // 'sms' o 'app'
    phoneNumber: '',
  });

  // Estados para membresías
  const [membresia, setMembresia] = useState({
    plan: 'free',
    fechaInicio: null,
    fechaVencimiento: null,
    estado: 'activa',
    caracteristicas: [],
    limitaciones: []
  });
  const [loadingMembresia, setLoadingMembresia] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [assignCredentialsForm, setAssignCredentialsForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    isProvisional: true
  });

  // Funciones para acciones de usuario
  const handleAssignCredentials = async (e) => {
    e.preventDefault();
    
    if (assignCredentialsForm.password !== assignCredentialsForm.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    if (assignCredentialsForm.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      // Crear el usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        getAuth(), 
        assignCredentialsForm.email, 
        assignCredentialsForm.password
      );
      
      const user = userCredential.user;
      
      // Actualizar las credenciales en Firestore con el UID del usuario creado
      await updateDoc(doc(db, "empresas", empresaId), {
        'credenciales.email': assignCredentialsForm.email,
        'credenciales.password': assignCredentialsForm.password,
        'credenciales.esProvisoria': assignCredentialsForm.isProvisional,
        'credenciales.fechaAsignacion': new Date(),
        'credenciales.fechaUltimoCambio': new Date(),
        'credenciales.uid': user.uid,
        'credenciales.estado': 'activa'
      });
      
      // Crear un documento de usuario en la colección 'usuarios' si no existe
      try {
        await setDoc(doc(db, "usuarios", user.uid), {
          email: assignCredentialsForm.email,
          rol: 'proveedor',
          empresaId: empresaId,
          fechaCreacion: new Date(),
          ultimoAcceso: new Date(),
          estado: 'activo'
        }, { merge: true });
      } catch (userError) {
        console.log('Usuario ya existe o error al crear documento de usuario:', userError);
      }
      
      // Recargar los datos de la empresa
      await fetchEmpresa();
      
      alert('Credenciales asignadas exitosamente. El usuario puede iniciar sesión ahora.');
      setShowAssignCredentialsModal(false);
      setAssignCredentialsForm({
        email: '',
        password: '',
        confirmPassword: '',
        isProvisional: true
      });
    } catch (error) {
      console.error('Error asignando credenciales:', error);
      
      // Manejar errores específicos de Firebase Auth
      let errorMessage = 'Error al asignar credenciales';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'El email ya está en uso por otro usuario';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del email no es válido';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es demasiado débil';
      } else {
        errorMessage += ': ' + error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validaciones
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        alert('❌ Las contraseñas no coinciden');
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        alert('❌ La nueva contraseña debe tener al menos 6 caracteres');
        return;
      }

      // Reautenticar usuario
      const user = auth.currentUser;
      if (!user) {
        alert('❌ No hay usuario autenticado');
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Cambiar contraseña
      await updatePassword(user, passwordForm.newPassword);

      // Actualizar en Firestore
      const empresaRef = doc(db, 'empresas', empresaId);
      await updateDoc(empresaRef, {
        'credenciales.password': passwordForm.newPassword,
        'credenciales.fechaUltimoCambio': new Date()
      });

      // Limpiar formulario y cerrar modal
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowChangePasswordModal(false);
      alert('✅ Contraseña cambiada exitosamente');

      // Recargar datos de la empresa
      fetchEmpresa();

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      if (error.code === 'auth/wrong-password') {
        alert('❌ La contraseña actual es incorrecta');
      } else if (error.code === 'auth/weak-password') {
        alert('❌ La contraseña es muy débil');
      } else {
        alert('❌ Error al cambiar la contraseña: ' + error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validaciones
      if (emailForm.newEmail !== emailForm.confirmEmail) {
        alert('❌ Los emails no coinciden');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailForm.newEmail)) {
        alert('❌ Formato de email inválido');
        return;
      }

      // Reautenticar usuario
      const user = auth.currentUser;
      if (!user) {
        alert('❌ No hay usuario autenticado');
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, emailForm.password);
      await reauthenticateWithCredential(user, credential);

      // Cambiar email
      await updateEmail(user, emailForm.newEmail);

      // Actualizar en Firestore
      const empresaRef = doc(db, 'empresas', empresaId);
      await updateDoc(empresaRef, {
        'credenciales.email': emailForm.newEmail,
        'credenciales.fechaUltimoCambioEmail': new Date()
      });

      // Limpiar formulario y cerrar modal
      setEmailForm({
        currentEmail: '',
        newEmail: '',
        confirmEmail: '',
        password: ''
      });
      setShowChangeEmailModal(false);
      alert('✅ Email cambiado exitosamente. Verifica tu nuevo email para confirmar el cambio.');

      // Recargar datos de la empresa
      fetchEmpresa();

    } catch (error) {
      console.error('Error cambiando email:', error);
      if (error.code === 'auth/wrong-password') {
        alert('❌ La contraseña es incorrecta');
      } else if (error.code === 'auth/email-already-in-use') {
        alert('❌ Este email ya está en uso');
      } else {
        alert('❌ Error al cambiar el email: ' + error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetup2FA = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Generar códigos de respaldo
      const backupCodes = [];
      for (let i = 0; i < 10; i++) {
        backupCodes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
      }

      // Actualizar configuración 2FA en Firestore
      const empresaRef = doc(db, 'empresas', empresaId);
      await updateDoc(empresaRef, {
        'configuracion2FA': {
          habilitado: twoFAForm.isEnabled,
          metodo: twoFAForm.method,
          telefono: twoFAForm.phoneNumber,
          codigosRespaldo: backupCodes,
          fechaConfiguracion: new Date()
        }
      });

      // Actualizar estado local
      setTwoFAForm({
        ...twoFAForm,
        backupCodes: backupCodes
      });

      if (twoFAForm.isEnabled) {
        alert('✅ Autenticación de dos factores configurada exitosamente!\n\nCódigos de respaldo generados. Guárdalos en un lugar seguro.');
      } else {
        alert('✅ Autenticación de dos factores deshabilitada');
      }

      // Recargar datos de la empresa
      fetchEmpresa();

    } catch (error) {
      console.error('Error configurando 2FA:', error);
      alert('❌ Error al configurar la autenticación de dos factores: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    console.log('🚀 useEffect ejecutado con empresaIdParam:', empresaIdParam);
    console.log('👤 Usuario autenticado:', auth.currentUser);
    
    // Determinar el empresaId correcto
    let idEmpresa = empresaIdParam;
    
    // Si no hay empresaId en los parámetros, usar el UID del usuario autenticado
    if (!idEmpresa && auth.currentUser) {
      idEmpresa = auth.currentUser.uid;
      console.log('🔑 Usando UID del usuario autenticado como empresaId:', idEmpresa);
    }
    
    if (idEmpresa) {
      setEmpresaId(idEmpresa);
      setLoading(true);
      setError('');
      fetchEmpresa(idEmpresa);
    } else {
      console.error('❌ No se puede determinar el empresaId');
      setError('No se puede determinar la empresa. Verifica tu autenticación.');
      setLoading(false);
    }
  }, [empresaIdParam]);

  // Solo cargar datos adicionales cuando la empresa esté cargada
  useEffect(() => {
    if (empresa && !loading) {
      console.log('📊 Cargando datos adicionales para empresa:', empresa.id);
      fetchProductos();
      fetchCampanas();
      fetchClientes();
      fetchMetricas();
      fetchSolicitudesProductos();
      fetchSolicitudesCampanas();
      fetchNotificaciones();
      fetchAgenteAsignado();
      fetchHistorialCambios();
      fetchEventos();
      fetchRecordatorios();
      fetchMembresia();
    }
  }, [empresa, loading]);

  const fetchEmpresa = async (idEmpresa) => {
    try {
      console.log('🔍 Buscando empresa con ID:', idEmpresa);
      console.log('📊 Usuario actual:', auth.currentUser?.email, 'UID:', auth.currentUser?.uid);
      
      if (!idEmpresa) {
        console.error('❌ No hay empresaId proporcionado');
        setError('No se proporcionó ID de empresa');
        setLoading(false);
        return;
      }

      // Agregar timeout para evitar que se quede colgado
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: La conexión tardó demasiado')), 15000);
      });

      const docRef = doc(db, 'empresas', idEmpresa);
      console.log('📄 Referencia del documento:', docRef);
      console.log('🔍 Buscando en colección "empresas" con ID:', idEmpresa);
      
      // Usar Promise.race para implementar timeout
      const docSnap = await Promise.race([
        getDoc(docRef),
        timeoutPromise
      ]);
      
      console.log('📋 Documento encontrado:', docSnap.exists());
      
      if (docSnap.exists()) {
        const empresaData = { id: docSnap.id, ...docSnap.data() };
        console.log('✅ Datos de empresa cargados:', empresaData);
        setEmpresa(empresaData);
      } else {
        console.error('❌ Empresa no encontrada en Firestore');
        console.log('🔍 Intentando buscar por email del usuario...');
        
        // Intentar buscar la empresa por email del usuario
        await buscarEmpresaPorEmail();
      }
    } catch (error) {
      console.error('❌ Error cargando empresa:', error);
      
      let errorMessage = 'Error al cargar la empresa';
      
      if (error.message.includes('Timeout')) {
        errorMessage = 'La conexión tardó demasiado. Verifica tu conexión a internet.';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet o VPN.';
      } else if (error.message.includes('permission-denied')) {
        errorMessage = 'No tienes permisos para acceder a esta empresa.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar acceso a funcionalidades según el plan
  const canAccessFeature = (feature) => {
    switch (feature) {
      case 'metricas':
        return membresia.plan !== 'free';
      case 'reportes':
        return membresia.plan !== 'free';
      case 'clientes':
        return membresia.plan !== 'free';
      case 'herramientas':
        return membresia.plan !== 'free';
      case 'productos':
        if (membresia.plan === 'free') return productos.length < 5;
        if (membresia.plan === 'premium') return productos.length < 25;
        return true; // corporate: ilimitado
      case 'campanas':
        if (membresia.plan === 'free') return campanas.length < 2;
        if (membresia.plan === 'premium') return campanas.length < 10;
        return true; // corporate: ilimitado
      default:
        return true;
    }
  };

  // Función para obtener el límite según el plan
  const getLimit = (feature) => {
    switch (feature) {
      case 'productos':
        if (membresia.plan === 'free') return 5;
        if (membresia.plan === 'premium') return 25;
        return '∞';
      case 'campanas':
        if (membresia.plan === 'free') return 2;
        if (membresia.plan === 'premium') return 10;
        return '∞';
      default:
        return 0;
    }
  };

  // Función para cargar información de membresía
  const fetchMembresia = async () => {
    try {
      setLoadingMembresia(true);
      
      // Por ahora, usar datos simulados. En el futuro, esto vendría de Firestore
      const membresiaData = {
        plan: empresa?.membresia?.plan || 'free',
        fechaInicio: empresa?.membresia?.fechaInicio || new Date(),
        fechaVencimiento: empresa?.membresia?.fechaVencimiento || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        estado: empresa?.membresia?.estado || 'activa',
        caracteristicas: empresa?.membresia?.caracteristicas || [
          'Perfil básico visible',
          'Hasta 5 productos',
          'Hasta 2 campañas por mes',
          'Soporte por email'
        ],
        limitaciones: empresa?.membresia?.limitaciones || [
          'Sin acceso a métricas avanzadas',
          'Sin prioridad en búsquedas',
          'Sin acceso a herramientas premium'
        ]
      };
      
      setMembresia(membresiaData);
      console.log('✅ Membresía cargada:', membresiaData);
      
    } catch (error) {
      console.error('❌ Error cargando membresía:', error);
    } finally {
      setLoadingMembresia(false);
    }
  };

  // Función para buscar empresa por email del usuario
  const buscarEmpresaPorEmail = async () => {
    try {
      const userEmail = auth.currentUser?.email;
      if (!userEmail) {
        console.error('❌ No hay email de usuario disponible');
        setError('No se puede determinar el email del usuario');
        return;
      }

      console.log('🔍 Buscando empresa por email:', userEmail);
      
      // Buscar en la colección empresas por email (campo usuario_empresa.email)
      const empresasQuery = query(
        collection(db, 'empresas'),
        where('usuario_empresa.email', '==', userEmail)
      );
      
      const empresasSnapshot = await getDocs(empresasQuery);
      console.log('📊 Empresas encontradas por email:', empresasSnapshot.size);
      
      if (!empresasSnapshot.empty) {
        const empresaDoc = empresasSnapshot.docs[0];
        const empresaData = { id: empresaDoc.id, ...empresaDoc.data() };
        console.log('✅ Empresa encontrada por usuario_empresa.email:', empresaData);
        console.log('⚠️ UID de empresa:', empresaDoc.id, 'vs UID de usuario:', auth.currentUser?.uid);
        
        setEmpresa(empresaData);
        setEmpresaId(empresaDoc.id);
        setError('');
      } else {
        // Intentar buscar por email directo también
        console.log('🔍 No encontrado por usuario_empresa.email, intentando por email directo...');
        const empresasQueryDirecto = query(
          collection(db, 'empresas'),
          where('email', '==', userEmail)
        );
        
        const empresasSnapshotDirecto = await getDocs(empresasQueryDirecto);
        console.log('📊 Empresas encontradas por email directo:', empresasSnapshotDirecto.size);
        
        if (!empresasSnapshotDirecto.empty) {
          const empresaDoc = empresasSnapshotDirecto.docs[0];
          const empresaData = { id: empresaDoc.id, ...empresaDoc.data() };
          console.log('✅ Empresa encontrada por email directo:', empresaData);
        
        setEmpresa(empresaData);
        setEmpresaId(empresaDoc.id);
        setError('');
      } else {
        // Buscar en la colección usuarios para ver si hay algún registro
        console.log('🔍 Buscando en colección usuarios...');
        const usuariosQuery = query(
          collection(db, 'usuarios'),
          where('email', '==', userEmail)
        );
        
        const usuariosSnapshot = await getDocs(usuariosQuery);
        console.log('📊 Usuarios encontrados por email:', usuariosSnapshot.size);
        
        if (!usuariosSnapshot.empty) {
          const usuarioDoc = usuariosSnapshot.docs[0];
          const usuarioData = usuarioDoc.data();
          console.log('📋 Datos del usuario:', usuarioData);
          
          if (usuarioData.empresaId) {
            console.log('🔍 Usuario tiene empresaId, buscando empresa...');
            await fetchEmpresa(usuarioData.empresaId);
            return;
          }
        }
        
        console.error('❌ No se encontró empresa por email ni por empresaId');
        setError('No se encontró empresa asociada a tu cuenta. Contacta al administrador.');
        }
      }
    } catch (error) {
      console.error('❌ Error buscando empresa por email:', error);
      setError('Error al buscar empresa por email: ' + error.message);
    }
  };

  // Función para crear una empresa de prueba
  const crearEmpresaPrueba = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('No hay usuario autenticado');
        return;
      }

      const empresaPrueba = {
        uid: user.uid,
        email: user.email,
        usuario_empresa: {
          uid: user.uid,
          email: user.email,
          admin_asignador: 'admin',
          fecha_asignacion: new Date()
        },
        nombre: 'Empresa de Prueba',
        rut: '12345678-9',
        telefono: '+56912345678',
        direccion: 'Av. Principal 123, Santiago',
        comuna: 'Santiago',
        region: 'Metropolitana',
        descripcion: 'Empresa de prueba para testing del sistema',
        horario_atencion: 'Lunes a Viernes 9:00-18:00',
        representante: {
          nombres: 'Juan',
          apellidos: 'Pérez',
          email: user.email,
          telefono: '+56912345678',
          cargo: 'Propietario'
        },
        categorias: ['Repuestos', 'Mantenimiento'],
        marcas_atendidas: ['Toyota', 'Honda', 'Nissan'],
        fecha_registro: new Date(),
        estado_validacion: 'activo',
        tipo_usuario: 'proveedor',
        fecha_activacion: new Date(),
        verificado: true,
        acepta_notificaciones: true,
        visible_en_busqueda: true,
        acepta_servicios_emergencia: false,
        total_servicios_completados: 0
      };

      console.log('🏢 Creando empresa de prueba:', empresaPrueba);
      
      // Crear la empresa en Firestore
      const docRef = doc(db, 'empresas', user.uid);
      await setDoc(docRef, empresaPrueba);
      
      console.log('✅ Empresa de prueba creada exitosamente');
      
      // Recargar la página para mostrar la empresa
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Error creando empresa de prueba:', error);
      alert('Error al crear empresa de prueba: ' + error.message);
    }
  };

  // Función para debug de estructura de empresa
  const debugEmpresaStructure = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('No hay usuario autenticado');
        return;
      }

      console.log('🔍 === DEBUG ESTRUCTURA EMPRESA ===');
      console.log('👤 Usuario actual:', {
        email: user.email,
        uid: user.uid
      });

      // Buscar todas las empresas que contengan el email del usuario
      const empresasQuery = query(collection(db, 'empresas'));
      const empresasSnapshot = await getDocs(empresasQuery);
      
      console.log('📊 Total de empresas en la base de datos:', empresasSnapshot.size);
      
      let empresasEncontradas = [];
      
      empresasSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`\n🏢 Empresa ID: ${doc.id}`);
        console.log('📋 Datos completos:', data);
        
        // Verificar si tiene usuario_empresa.email
        if (data.usuario_empresa && data.usuario_empresa.email === user.email) {
          console.log('✅ COINCIDENCIA: usuario_empresa.email coincide');
          empresasEncontradas.push({ id: doc.id, data, tipo: 'usuario_empresa.email' });
        }
        
        // Verificar si tiene email directo
        if (data.email === user.email) {
          console.log('✅ COINCIDENCIA: email directo coincide');
          empresasEncontradas.push({ id: doc.id, data, tipo: 'email' });
        }
        
        // Verificar si tiene uid que coincida
        if (data.uid === user.uid) {
          console.log('✅ COINCIDENCIA: uid coincide');
          empresasEncontradas.push({ id: doc.id, data, tipo: 'uid' });
        }
      });
      
      console.log('\n🎯 EMPRESAS ENCONTRADAS:', empresasEncontradas);
      
      if (empresasEncontradas.length > 0) {
        const primeraEmpresa = empresasEncontradas[0];
        console.log('\n🚀 CARGANDO PRIMERA EMPRESA ENCONTRADA:', primeraEmpresa);
        setEmpresa(primeraEmpresa.data);
        setEmpresaId(primeraEmpresa.id);
        setError('');
        alert(`Empresa encontrada y cargada! Tipo: ${primeraEmpresa.tipo}`);
      } else {
        console.log('\n❌ NO SE ENCONTRARON EMPRESAS');
        alert('No se encontraron empresas con tu email. Revisa la consola para más detalles.');
      }
      
    } catch (error) {
      console.error('❌ Error en debug de estructura:', error);
      alert('Error en debug: ' + error.message);
    }
  };

  const fetchProductos = async () => {
    try {
      const q = query(
        collection(db, 'productos'),
        where('empresaId', '==', empresaId),
        orderBy('fechaCreacion', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      setProductos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const fetchCampanas = async () => {
    try {
      const q = query(
        collection(db, 'campañas'),
        where('empresaId', '==', empresaId),
        orderBy('fechaCreacion', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      setCampanas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error cargando campañas:', error);
    }
  };

  const fetchClientes = async () => {
    try {
      const q = query(
        collection(db, 'clientes'),
        where('empresaId', '==', empresaId),
        orderBy('fechaCreacion', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      setClientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const fetchMetricas = async () => {
    try {
      console.log('📈 Cargando métricas...');
      // Simular métricas por ahora
      setMetricas({
        visitasPerfil: 1250,
        productosVendidos: 89,
        clientesNuevos: 23,
        calificacionPromedio: 4.7,
        conversionRate: 12.5,
        engagementRate: 8.3
      });
      console.log('✅ Métricas cargadas');
    } catch (error) {
      console.error('❌ Error cargando métricas:', error);
    }
  };

  const fetchSolicitudesProductos = async () => {
    try {
      setLoadingSolicitudes(true);
      const q = query(
        collection(db, 'solicitudes_producto'),
        where('empresaId', '==', empresaId),
        orderBy('fechaSolicitud', 'desc')
      );
      const snapshot = await getDocs(q);
      setSolicitudesProductos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error cargando solicitudes de productos:', error);
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  const fetchSolicitudesCampanas = async () => {
    try {
      const q = query(
        collection(db, 'solicitudes_campana'),
        where('empresaId', '==', empresaId),
        orderBy('fechaSolicitud', 'desc')
      );
      const snapshot = await getDocs(q);
      setSolicitudesCampanas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error cargando solicitudes de campañas:', error);
    }
  };

  const fetchNotificaciones = async () => {
    try {
      const q = query(
        collection(db, 'notificaciones'),
        where('empresaId', '==', empresaId),
        where('leida', '==', false),
        orderBy('fechaCreacion', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      setNotificaciones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  const fetchAgenteAsignado = async () => {
    try {
      // Buscar si hay algún agente asignado a alguna solicitud
      const q = query(
        collection(db, 'solicitudes_producto'),
        where('empresaId', '==', empresaId),
        where('agenteAsignado', '!=', null)
      );
      const snapshot = await getDocs(q);
      if (snapshot.docs.length > 0) {
        setAgenteAsignado(snapshot.docs[0].data().agenteAsignado);
      }
    } catch (error) {
      console.error('Error cargando agente asignado:', error);
    }
  };

  const enviarMensajeChat = async () => {
    if (!nuevoMensaje.trim()) return;
    
    try {
      const mensaje = {
        empresaId: empresaId,
        empresaNombre: empresa.nombre,
        agenteId: agenteAsignado,
        mensaje: nuevoMensaje,
        fechaEnvio: new Date(),
        enviadoPor: 'empresa',
        leido: false
      };
      
      await addDoc(collection(db, 'chat_empresa_agente'), mensaje);
      setNuevoMensaje('');
      
      // Agregar mensaje localmente
      setMensajesChat(prev => [...prev, mensaje]);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  const marcarNotificacionLeida = async (notificacionId) => {
    try {
      const notifRef = doc(db, 'notificaciones', notificacionId);
      await updateDoc(notifRef, { leida: true });
      
      // Remover de la lista local
      setNotificaciones(prev => prev.filter(n => n.id !== notificacionId));
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const fetchHistorialCambios = async () => {
    try {
      setLoadingHistorial(true);
      const q = query(
        collection(db, 'historial_cambios'),
        where('empresaId', '==', empresaId),
        orderBy('fechaCambio', 'desc'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      setHistorialCambios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error cargando historial de cambios:', error);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const cambiarPrioridadSolicitud = async (solicitudId, tipo, nuevaPrioridad) => {
    try {
      const coleccion = tipo === 'producto' ? 'solicitudes_producto' : 'solicitudes_campana';
      const solicitudRef = doc(db, coleccion, solicitudId);
      
      await updateDoc(solicitudRef, { 
        prioridad: nuevaPrioridad,
        fechaCambioPrioridad: new Date()
      });

      // Agregar al historial
      const cambio = {
        empresaId: empresaId,
        empresaNombre: empresa.nombre,
        solicitudId: solicitudId,
        tipoSolicitud: tipo,
        tipoCambio: 'cambio_prioridad',
        descripcion: `Prioridad cambiada a: ${nuevaPrioridad}`,
        fechaCambio: new Date(),
        usuario: 'empresa'
      };

      await addDoc(collection(db, 'historial_cambios'), cambio);

      // Recargar solicitudes
      if (tipo === 'producto') {
        fetchSolicitudesProductos();
      } else {
        fetchSolicitudesCampanas();
      }

      // Recargar historial
      fetchHistorialCambios();

      alert(`✅ Prioridad cambiada a: ${nuevaPrioridad}`);
    } catch (error) {
      console.error('Error cambiando prioridad:', error);
      alert('❌ Error al cambiar la prioridad');
    }
  };

  const cancelarSolicitud = async (solicitudId, tipo) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta solicitud?')) return;

    try {
      const coleccion = tipo === 'producto' ? 'solicitudes_producto' : 'solicitudes_campana';
      const solicitudRef = doc(db, coleccion, solicitudId);
      
      await updateDoc(solicitudRef, { 
        estado: 'cancelada',
        fechaCancelacion: new Date()
      });

      // Agregar al historial
      const cambio = {
        empresaId: empresaId,
        empresaNombre: empresa.nombre,
        solicitudId: solicitudId,
        tipoSolicitud: tipo,
        tipoCambio: 'cancelacion',
        descripcion: 'Solicitud cancelada por la empresa',
        fechaCambio: new Date(),
        usuario: 'empresa'
      };

      await addDoc(collection(db, 'historial_cambios'), cambio);

      // Recargar solicitudes
      if (tipo === 'producto') {
        fetchSolicitudesProductos();
      } else {
        fetchSolicitudesCampanas();
      }

      // Recargar historial
      fetchHistorialCambios();

      alert('✅ Solicitud cancelada exitosamente');
    } catch (error) {
      console.error('Error cancelando solicitud:', error);
      alert('❌ Error al cancelar la solicitud');
    }
  };

  const generarReportes = async () => {
    try {
      setLoadingReportes(true);
      
      const fechaInicio = new Date(filtroReporte.fechaInicio);
      const fechaFin = new Date(filtroReporte.fechaFin);
      fechaFin.setHours(23, 59, 59, 999); // Incluir todo el día final

      // Consultar solicitudes de productos
      const queryProductos = query(
        collection(db, 'solicitudes_producto'),
        where('empresaId', '==', empresaId),
        where('fechaSolicitud', '>=', fechaInicio),
        where('fechaSolicitud', '<=', fechaFin)
      );
      const snapshotProductos = await getDocs(queryProductos);

      // Consultar solicitudes de campañas
      const queryCampanas = query(
        collection(db, 'solicitudes_campana'),
        where('empresaId', '==', empresaId),
        where('fechaSolicitud', '>=', fechaInicio),
        where('fechaSolicitud', '<=', fechaFin)
      );
      const snapshotCampanas = await getDocs(queryCampanas);

      // Combinar todas las solicitudes
      const todasSolicitudes = [
        ...snapshotProductos.docs.map(doc => ({ id: doc.id, tipo: 'producto', ...doc.data() })),
        ...snapshotCampanas.docs.map(doc => ({ id: doc.id, tipo: 'campana', ...doc.data() }))
      ];

      // Filtrar por tipo si es necesario
      let solicitudesFiltradas = todasSolicitudes;
      if (filtroReporte.tipo !== 'todos') {
        solicitudesFiltradas = todasSolicitudes.filter(s => s.tipo === filtroReporte.tipo);
      }

      // Filtrar por estado si es necesario
      if (filtroReporte.estado !== 'todos') {
        solicitudesFiltradas = solicitudesFiltradas.filter(s => s.estado === filtroReporte.estado);
      }

      // Calcular métricas
      const solicitudesAprobadas = solicitudesFiltradas.filter(s => s.estado === 'aprobado').length;
      const solicitudesRechazadas = solicitudesFiltradas.filter(s => s.estado === 'rechazado').length;
      const solicitudesPendientes = solicitudesFiltradas.filter(s => s.estado === 'pendiente').length;

      // Calcular tiempo promedio de respuesta (solo para solicitudes aprobadas/rechazadas)
      const solicitudesResueltas = solicitudesFiltradas.filter(s => s.estado === 'aprobado' || s.estado === 'rechazado');
      let tiempoPromedioRespuesta = 0;
      
      if (solicitudesResueltas.length > 0) {
        const tiemposRespuesta = solicitudesResueltas
          .filter(s => s.fechaRespuesta && s.fechaSolicitud)
          .map(s => {
            const inicio = s.fechaSolicitud.toDate();
            const fin = s.fechaRespuesta.toDate();
            return (fin - inicio) / (1000 * 60 * 60 * 24); // Días
          });
        
        if (tiemposRespuesta.length > 0) {
          tiempoPromedioRespuesta = tiemposRespuesta.reduce((a, b) => a + b, 0) / tiemposRespuesta.length;
        }
      }

      // Consultar productos y campañas activos
      const queryProductosActivos = query(
        collection(db, 'productos'),
        where('empresaId', '==', empresaId),
        where('estado', '==', 'activo')
      );
      const snapshotProductosActivos = await getDocs(queryProductosActivos);

      const queryCampanasActivas = query(
        collection(db, 'campanas'),
        where('empresaId', '==', empresaId),
        where('estado', '==', 'activa')
      );
      const snapshotCampanasActivas = await getDocs(queryCampanasActivas);

      setReportes({
        solicitudesDelMes: solicitudesFiltradas.length,
        solicitudesAprobadas,
        solicitudesRechazadas,
        solicitudesPendientes,
        tiempoPromedioRespuesta: Math.round(tiempoPromedioRespuesta * 10) / 10,
        productosActivos: snapshotProductosActivos.size,
        campanasActivas: snapshotCampanasActivas.size,
        detalles: {
          solicitudesPorTipo: {
            productos: solicitudesFiltradas.filter(s => s.tipo === 'producto').length,
            campanas: solicitudesFiltradas.filter(s => s.tipo === 'campana').length
          },
          solicitudesPorPrioridad: {
            urgente: solicitudesFiltradas.filter(s => s.prioridad === 'urgente').length,
            alta: solicitudesFiltradas.filter(s => s.prioridad === 'alta').length,
            normal: solicitudesFiltradas.filter(s => s.prioridad === 'normal').length,
            baja: solicitudesFiltradas.filter(s => s.prioridad === 'baja').length
          }
        }
      });

    } catch (error) {
      console.error('Error generando reportes:', error);
      alert('❌ Error al generar los reportes');
    } finally {
      setLoadingReportes(false);
    }
  };

  const exportarReporte = (formato) => {
    if (formato === 'pdf') {
      // Simular exportación a PDF
      alert('📄 Generando reporte en PDF...\n\nEsta funcionalidad estará disponible próximamente.');
    } else if (formato === 'excel') {
      // Simular exportación a Excel
      alert('📊 Generando reporte en Excel...\n\nEsta funcionalidad estará disponible próximamente.');
    }
  };

  const fetchEventos = async () => {
    try {
      const q = query(
        collection(db, 'eventos_empresa'),
        where('empresaId', '==', empresaId),
        orderBy('fechaInicio', 'asc')
      );
      const snapshot = await getDocs(q);
      setEventos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error cargando eventos:', error);
    }
  };

  const fetchRecordatorios = async () => {
    try {
      const q = query(
        collection(db, 'recordatorios_empresa'),
        where('empresaId', '==', empresaId),
        where('activo', '==', true),
        orderBy('fechaRecordatorio', 'asc')
      );
      const snapshot = await getDocs(q);
      setRecordatorios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error cargando recordatorios:', error);
    }
  };

  const crearEvento = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const evento = {
        empresaId: empresaId,
        empresaNombre: empresa.nombre,
        titulo: eventoForm.titulo,
        descripcion: eventoForm.descripcion,
        fechaInicio: new Date(eventoForm.fechaInicio),
        fechaFin: new Date(eventoForm.fechaFin),
        tipo: eventoForm.tipo,
        prioridad: eventoForm.prioridad,
        recordatorio: eventoForm.recordatorio,
        recordatorioAntes: eventoForm.recordatorioAntes,
        fechaCreacion: new Date(),
        activo: true
      };

      // Guardar evento
      const docRef = await addDoc(collection(db, 'eventos_empresa'), evento);
      
      // Crear recordatorio si está habilitado
      if (eventoForm.recordatorio) {
        const fechaRecordatorio = new Date(eventoForm.fechaInicio);
        const diasAntes = parseInt(eventoForm.recordatorioAntes.split('_')[0]);
        fechaRecordatorio.setDate(fechaRecordatorio.getDate() - diasAntes);
        
        const recordatorio = {
          empresaId: empresaId,
          empresaNombre: empresa.nombre,
          eventoId: docRef.id,
          titulo: `Recordatorio: ${eventoForm.titulo}`,
          descripcion: eventoForm.descripcion,
          fechaEvento: new Date(eventoForm.fechaInicio),
          fechaRecordatorio: fechaRecordatorio,
          tipo: 'evento',
          activo: true,
          enviado: false
        };
        
        await addDoc(collection(db, 'recordatorios_empresa'), recordatorio);
      }

      // Limpiar formulario y cerrar modal
      setEventoForm({
        titulo: '',
        descripcion: '',
        fechaInicio: '',
        fechaFin: '',
        tipo: 'general',
        prioridad: 'normal',
        recordatorio: true,
        recordatorioAntes: '1_dia'
      });
      setShowEventoModal(false);
      
      // Recargar eventos y recordatorios
      fetchEventos();
      fetchRecordatorios();
      
      alert('✅ Evento creado exitosamente');
    } catch (error) {
      console.error('Error creando evento:', error);
      alert('❌ Error al crear el evento');
    } finally {
      setSubmitting(false);
    }
  };

  const eliminarEvento = async (eventoId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) return;
    
    try {
      // Eliminar evento
      await deleteDoc(doc(db, 'eventos_empresa', eventoId));
      
      // Eliminar recordatorios asociados
      const q = query(
        collection(db, 'recordatorios_empresa'),
        where('eventoId', '==', eventoId)
      );
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
      
      // Recargar eventos y recordatorios
      fetchEventos();
      fetchRecordatorios();
      
      alert('✅ Evento eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando evento:', error);
      alert('❌ Error al eliminar el evento');
    }
  };

  const obtenerEventosDelDia = (fecha) => {
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);
    
    return eventos.filter(evento => {
      const eventoFecha = evento.fechaInicio.toDate();
      return eventoFecha >= fechaInicio && eventoFecha <= fechaFin;
    });
  };

  const obtenerEventosDeLaSemana = (fecha) => {
    const inicioSemana = new Date(fecha);
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    inicioSemana.setHours(0, 0, 0, 0);
    
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(finSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);
    
    return eventos.filter(evento => {
      const eventoFecha = evento.fechaInicio.toDate();
      return eventoFecha >= inicioSemana && eventoFecha <= finSemana;
    });
  };

  const generarCalendarioMensual = (fecha) => {
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();
    
    const calendario = [];
    let semana = [];
    
    // Agregar días del mes anterior para completar la primera semana
    for (let i = 0; i < primerDiaSemana; i++) {
      const diaAnterior = new Date(año, mes, -primerDiaSemana + i + 1);
      semana.push({
        fecha: diaAnterior,
        esDelMes: false,
        eventos: obtenerEventosDelDia(diaAnterior)
      });
    }
    
    // Agregar días del mes actual
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fechaActual = new Date(año, mes, dia);
      semana.push({
        fecha: fechaActual,
        esDelMes: true,
        eventos: obtenerEventosDelDia(fechaActual)
      });
      
      if (semana.length === 7) {
        calendario.push(semana);
        semana = [];
      }
    }
    
    // Completar la última semana si es necesario
    if (semana.length > 0) {
      while (semana.length < 7) {
        const diaSiguiente = new Date(año, mes + 1, semana.length);
        semana.push({
          fecha: diaSiguiente,
          esDelMes: false,
          eventos: obtenerEventosDelDia(diaSiguiente)
        });
      }
      calendario.push(semana);
    }
    
    return calendario;
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const solicitudProducto = {
        empresaId: empresaId,
        empresaNombre: empresa.nombre,
        nombre: productForm.nombre,
        descripcion: productForm.descripcion,
        precio: parseFloat(productForm.precio),
        categoria: productForm.categoria,
        marca: productForm.marca,
        stock: parseInt(productForm.stock),
        estado: 'pendiente',
        fechaSolicitud: new Date(),
        tipo: 'producto',
        revisado: false,
        aprobado: false,
        comentariosAdmin: '',
        agenteAsignado: null
      };

      // Guardar en la colección de solicitudes
      const docRef = await addDoc(collection(db, 'solicitudes_producto'), solicitudProducto);
      
      console.log('✅ Solicitud de producto enviada:', docRef.id);
      
      // Limpiar formulario y cerrar modal
      setProductForm({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: '',
        marca: '',
        stock: '',
        imagen: null
      });
      setShowProductModal(false);
      
             // Mostrar mensaje de éxito
       alert('✅ Solicitud de producto enviada exitosamente. Será revisada por nuestro equipo.');
       
       // Recargar solicitudes
       fetchSolicitudesProductos();
       
     } catch (error) {
      console.error('❌ Error enviando solicitud de producto:', error);
      alert('❌ Error al enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCampaignSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const solicitudCampana = {
        empresaId: empresaId,
        empresaNombre: empresa.nombre,
        titulo: campaignForm.titulo,
        descripcion: campaignForm.descripcion,
        fechaInicio: campaignForm.fechaInicio,
        fechaFin: campaignForm.fechaFin,
        presupuesto: parseFloat(campaignForm.presupuesto),
        tipo: campaignForm.tipo,
        estado: 'pendiente',
        fechaSolicitud: new Date(),
        revisado: false,
        aprobado: false,
        comentariosAdmin: '',
        agenteAsignado: null
      };

      // Guardar en la colección de solicitudes de campaña
      const docRef = await addDoc(collection(db, 'solicitudes_campana'), solicitudCampana);
      
      console.log('✅ Solicitud de campaña enviada:', docRef.id);
      
      // Limpiar formulario y cerrar modal
      setCampaignForm({
        titulo: '',
        descripcion: '',
        fechaInicio: '',
        fechaFin: '',
        presupuesto: '',
        tipo: 'promocional'
      });
      setShowCampaignModal(false);
      
             // Mostrar mensaje de éxito
       alert('✅ Solicitud de campaña enviada exitosamente. Será revisada por nuestro equipo.');
       
       // Recargar solicitudes
       fetchSolicitudesCampanas();
       
     } catch (error) {
      console.error('❌ Error enviando solicitud de campaña:', error);
      alert('❌ Error al enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForms = () => {
    setProductForm({
      nombre: '',
      descripcion: '',
      precio: '',
      categoria: '',
      marca: '',
      stock: '',
      imagen: null
    });
    setCampaignForm({
      titulo: '',
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      presupuesto: '',
      tipo: 'promocional'
    });
  };

  const mostrarVistaPreviaProducto = (solicitud) => {
    // Aquí podrías abrir un modal con la vista previa del producto
    alert(`Vista previa del producto: ${solicitud.nombre}\n\nCategoría: ${solicitud.categoria}\nMarca: ${solicitud.marca}\nPrecio: $${solicitud.precio?.toLocaleString()}\n\nDescripción: ${solicitud.descripcion}\n\nEsta es una simulación de cómo se verá el producto una vez aprobado en la plataforma.`);
  };

  const mostrarVistaPreviaCampana = (solicitud) => {
    // Aquí podrías abrir un modal con la vista previa de la campaña
    alert(`Vista previa de la campaña: ${solicitud.titulo}\n\nTipo: ${solicitud.tipo}\nPresupuesto: $${solicitud.presupuesto?.toLocaleString() || 'N/A'}\nDuración: ${solicitud.fechaInicio} - ${solicitud.fechaFin}\n\nDescripción: ${solicitud.descripcion}\n\nEsta es una simulación de cómo se verá la campaña una vez aprobada en la plataforma.`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cargando dashboard empresarial</h2>
          <p className="text-gray-600 mb-4">Conectando con la base de datos...</p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h3 className="font-medium text-blue-900 mb-2">📊 Procesando:</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>Información de la empresa</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                <span>Productos y campañas</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-300 rounded-full mr-2"></div>
                <span>Métricas y estadísticas</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-xs text-gray-500">
            <p>ID de empresa: {empresaId || 'No proporcionado'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Error al cargar el dashboard</h1>
            <p className="text-gray-700 mb-4">{error}</p>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-gray-900 mb-2">📋 Información de depuración:</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">ID de empresa:</span> {empresaId || 'No proporcionado'}</p>
              <p><span className="font-medium">URL actual:</span> {window.location.href}</p>
              <p><span className="font-medium">Timestamp:</span> {new Date().toLocaleString()}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => {
                setError('');
                setLoading(true);
                fetchEmpresa();
              }}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              🔄 Reintentar conexión
            </button>
            
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors font-medium"
            >
              🔃 Recargar página completa
            </button>
            
            <button 
              onClick={() => window.history.back()} 
              className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              ⬅️ Volver atrás
            </button>
          </div>
          
          <div className="mt-6 text-xs text-gray-500">
            <p>Si el problema persiste, verifica:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Conexión a internet</li>
              <li>Configuración de VPN</li>
              <li>Permisos de la empresa</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-500 max-w-2xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Empresa no encontrada</h1>
          <p className="mb-4">No se pudo cargar la información de la empresa.</p>
          
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left text-sm text-gray-700">
            <h3 className="font-semibold mb-2">🔍 Información de Debug:</h3>
            <p><strong>ID de empresa:</strong> {empresaId || 'No proporcionado'}</p>
            <p><strong>Usuario autenticado:</strong> {auth.currentUser?.email || 'No autenticado'}</p>
            <p><strong>UID del usuario:</strong> {auth.currentUser?.uid || 'No disponible'}</p>
            <p><strong>Estado de carga:</strong> {loading ? 'Cargando...' : 'Completado'}</p>
            <p><strong>Error:</strong> {error || 'Ninguno'}</p>
          </div>
          
          <div className="mt-6 space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Recargar Página
            </button>
            <button
              onClick={() => {
                console.log('🔍 Debug Info:', {
                  empresaId,
                  userEmail: auth.currentUser?.email,
                  userUID: auth.currentUser?.uid,
                  loading,
                  error
                });
                alert('Información de debug enviada a la consola. Presiona F12 para verla.');
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors ml-3"
            >
              🐛 Ver Debug en Consola
            </button>
            <button
              onClick={crearEmpresaPrueba}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors ml-3"
            >
              🏢 Crear Empresa de Prueba
            </button>
            <button
              onClick={debugEmpresaStructure}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors ml-3"
            >
              🔍 Debug Estructura Empresa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <HeaderMenu />
      <div className="min-h-screen bg-gray-50">
        {/* Header del Dashboard */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {empresa.nombre?.charAt(0)?.toUpperCase() || 'E'}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Dashboard de {empresa.nombre}
                  </h1>
                  <p className="text-gray-600">
                    Panel de gestión empresarial - Red AV 10 de Julio
                  </p>
                </div>
              </div>
                             <div className="flex items-center space-x-3">
                 <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                   ✓ Empresa Validada
                 </span>
                 <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                   🌟 Sello de Calidad
                 </span>
                 <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                   🟢 Conexión Activa
                 </span>
                 
                 {/* Botón de Notificaciones */}
                 <button
                   onClick={() => setShowNotificaciones(true)}
                   className="relative inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                 >
                   🔔 Notificaciones
                   {notificaciones.length > 0 && (
                     <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                       {notificaciones.length}
                     </span>
                   )}
                 </button>
                 
                 {/* Botón de Chat con Agente */}
                 {agenteAsignado && (
                   <button
                     onClick={() => setShowChat(true)}
                     className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
                   >
                     💬 Chat con Agente
                   </button>
                 )}
               </div>
            </div>
          </div>
        </div>

        {/* Navegación por Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
                                             {[
                  { id: 'overview', name: 'Resumen', icon: '📊' },
                  { id: 'productos', name: 'Productos', icon: '📦' },
                  { id: 'campanas', name: 'Campañas', icon: '📢' },
                  { id: 'solicitudes', name: 'Solicitudes', icon: '📋' },
                  { id: 'historial', name: 'Historial', icon: '📜' },
                  { id: 'reportes', name: 'Reportes', icon: '📊', premium: true },
                  { id: 'calendario', name: 'Calendario', icon: '📅' },
                  { id: 'clientes', name: 'Clientes', icon: '👥', premium: true },
                  { id: 'metricas', name: 'Métricas', icon: '📈', premium: true },
                  { id: 'membresias', name: 'Membresías', icon: '💎' },
                  { id: 'red', name: 'Red AV 10', icon: '🌐' },
                  { id: 'herramientas', name: 'Herramientas', icon: '🛠️', premium: true },
                  { id: 'usuario', name: 'Usuario', icon: '👤' }
                ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                  {tab.premium && membresia.plan === 'free' && (
                    <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      💎
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenido de los Tabs */}
          <div className="space-y-6">
            {/* Tab: Resumen */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Header con Bienvenida */}
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">¡Bienvenido de vuelta!</h1>
                      <p className="text-blue-100 text-lg">Gestiona tu empresa y haz crecer tu negocio</p>
                      <div className="mt-4 flex items-center space-x-4">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                          🏢 {empresa?.nombre || 'Empresa'}
                        </span>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                          💎 Plan {membresia.plan.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl mb-2">📊</div>
                      <p className="text-blue-100">Dashboard</p>
                    </div>
                  </div>
                </div>

                {/* Métricas Principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Visitas al Perfil</p>
                        <p className="text-3xl font-bold text-gray-900">{metricas.visitasPerfil?.toLocaleString() || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">👥</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-600">
                      <span>↗️ +12%</span>
                      <span className="ml-2">vs mes anterior</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Productos Activos</p>
                        <p className="text-3xl font-bold text-gray-900">{productos.length || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-blue-600">
                      <span>📈 {productos.length > 0 ? 'Activos' : 'Sin productos'}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Campañas Activas</p>
                        <p className="text-3xl font-bold text-gray-900">{campanas.length || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📢</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-yellow-600">
                      <span>🎯 {campanas.length > 0 ? 'En ejecución' : 'Sin campañas'}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Solicitudes</p>
                        <p className="text-3xl font-bold text-gray-900">{(solicitudesProductos.length + solicitudesCampanas.length) || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📋</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-purple-600">
                      <span>⏳ Pendientes de revisión</span>
                    </div>
                  </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">⚡ Acciones Rápidas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <button 
                      onClick={() => setActiveTab('productos')}
                      className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-lg border border-blue-200"
                    >
                      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">📦</div>
                      <div className="font-bold text-gray-900 mb-2">Gestionar Productos</div>
                      <div className="text-sm text-gray-600">Agregar, editar y organizar tu catálogo</div>
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('campanas')}
                      className="group p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-lg border border-green-200"
                    >
                      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">📢</div>
                      <div className="font-bold text-gray-900 mb-2">Crear Campaña</div>
                      <div className="text-sm text-gray-600">Lanza promociones y ofertas</div>
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('solicitudes')}
                      className="group p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl hover:from-yellow-100 hover:to-yellow-200 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-lg border border-yellow-200"
                    >
                      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">📋</div>
                      <div className="font-bold text-gray-900 mb-2">Ver Solicitudes</div>
                      <div className="text-sm text-gray-600">Revisa el estado de tus solicitudes</div>
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('membresias')}
                      className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-lg border border-purple-200"
                    >
                      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">💎</div>
                      <div className="font-bold text-gray-900 mb-2">Mejorar Plan</div>
                      <div className="text-sm text-gray-600">Desbloquea funcionalidades avanzadas</div>
                    </button>
                  </div>
                </div>

                {/* Estado de la Cuenta */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-gray-900">💎 Plan de Membresía</h4>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        membresia.estado === 'activa' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {membresia.estado === 'activa' ? '✅ Activa' : '⚠️ Pendiente'}
                      </span>
                    </div>
                    <div className="text-center mb-4">
                      <div className="text-4xl font-bold text-gray-900 mb-2">{membresia.plan.toUpperCase()}</div>
                      <p className="text-gray-600">
                        {membresia.plan === 'free' ? 'Plan gratuito' :
                         membresia.plan === 'premium' ? '$29.99/mes' :
                         '$99.99/mes'}
                      </p>
                    </div>
                    
                    {/* Límites del Plan */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-700 mb-2">📊 Límites del Plan</h5>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Productos:</span>
                          <span className={`font-medium ${
                            productos.length >= getLimit('productos') ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {productos.length} / {getLimit('productos')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Campañas:</span>
                          <span className={`font-medium ${
                            campanas.length >= getLimit('campanas') ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {campanas.length} / {getLimit('campanas')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {membresia.plan === 'free' && (
                        <>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="text-green-500 mr-2">✓</span>
                            Hasta 5 productos
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="text-green-500 mr-2">✓</span>
                            Hasta 2 campañas por mes
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="text-green-500 mr-2">✓</span>
                            Perfil básico visible
                          </div>
                        </>
                      )}
                    </div>
                    {membresia.plan === 'free' && (
                      <button 
                        onClick={() => setActiveTab('membresias')}
                        className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                      >
                        🚀 Actualizar a Premium
                      </button>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-gray-900">🔐 Credenciales</h4>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        empresa?.credenciales?.email && empresa?.credenciales?.password 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {empresa?.credenciales?.email && empresa?.credenciales?.password 
                          ? '✅ Configuradas' 
                          : '⚠️ Pendientes'}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{empresa?.credenciales?.email || 'No configurado'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Contraseña:</span>
                        <span className="font-medium">{empresa?.credenciales?.password ? '••••••••' : 'No configurado'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Último acceso:</span>
                        <span className="font-medium">{empresa?.ultimoAcceso ? new Date(empresa.ultimoAcceso.toDate()).toLocaleDateString('es-ES') : 'Nunca'}</span>
                      </div>
                    </div>
                    {(!empresa?.credenciales?.email || !empresa?.credenciales?.password) && (
                      <button 
                        onClick={() => setShowAssignCredentialsModal(true)}
                        className="w-full mt-4 bg-orange-600 text-white py-3 rounded-xl font-medium hover:bg-orange-700 transition-all duration-300"
                      >
                        🔑 Configurar Credenciales
                      </button>
                    )}
                  </div>
                </div>

                {/* Información de la Empresa */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">🏢 Información de la Empresa</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <div className="text-4xl mb-3">🏪</div>
                      <div className="font-bold text-gray-900 text-lg mb-2">{empresa?.nombre || 'Nombre no disponible'}</div>
                      <div className="text-gray-600">Empresa</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                      <div className="text-4xl mb-3">📍</div>
                      <div className="font-bold text-gray-900 text-lg mb-2">{empresa?.direccion || 'Dirección no disponible'}</div>
                      <div className="text-gray-600">Ubicación</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                      <div className="text-4xl mb-3">📞</div>
                      <div className="font-bold text-gray-900 text-lg mb-2">{empresa?.telefono || 'Teléfono no disponible'}</div>
                      <div className="text-gray-600">Contacto</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Productos */}
            {activeTab === 'productos' && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Gestión de Productos</h3>
                                         <button 
                       onClick={() => setShowProductModal(true)}
                       disabled={!canAccessFeature('productos')}
                       className={`px-4 py-2 rounded-md transition-colors ${
                         canAccessFeature('productos')
                           ? 'bg-blue-600 text-white hover:bg-blue-700'
                           : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                       }`}
                       title={!canAccessFeature('productos') ? `Límite alcanzado: ${getLimit('productos')} productos` : 'Agregar nuevo producto'}
                     >
                       + Nuevo Producto
                       {!canAccessFeature('productos') && (
                         <span className="ml-2 text-xs">({getLimit('productos')})</span>
                       )}
                     </button>
                  </div>
                </div>
                <div className="p-6">
                  {productos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {productos.map((producto) => (
                        <div key={producto.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-medium text-gray-900 mb-2">{producto.nombre}</h4>
                          <p className="text-sm text-gray-600 mb-3">{producto.descripcion}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-green-600">
                              ${producto.precio?.toLocaleString() || 'N/A'}
                            </span>
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
                              <button className="text-red-600 hover:text-red-800 text-sm">Eliminar</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No hay productos registrados aún.</p>
                      <button className="mt-2 text-blue-600 hover:text-blue-800">Crear primer producto</button>
                    </div>
                  )}
                </div>
              </div>
            )}

                         {/* Tab: Campañas */}
             {activeTab === 'campanas' && (
               <div className="bg-white shadow rounded-lg">
                 <div className="px-6 py-4 border-b border-gray-200">
                   <div className="flex items-center justify-between">
                     <h3 className="text-lg font-medium text-gray-900">Gestión de Campañas</h3>
                                          <button 
                        onClick={() => setShowCampaignModal(true)}
                        disabled={!canAccessFeature('campanas')}
                        className={`px-4 py-2 rounded-md transition-colors ${
                          canAccessFeature('campanas')
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        }`}
                        title={!canAccessFeature('campanas') ? `Límite alcanzado: ${getLimit('campanas')} campañas` : 'Crear nueva campaña'}
                      >
                        + Nueva Campaña
                        {!canAccessFeature('campanas') && (
                          <span className="ml-2 text-xs">({getLimit('campanas')})</span>
                        )}
                      </button>
                   </div>
                 </div>
                 <div className="p-6">
                   {campanas.length > 0 ? (
                     <div className="space-y-4">
                       {campanas.map((campana) => (
                         <div key={campana.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                           <div className="flex items-center justify-between">
                             <div>
                               <h4 className="font-medium text-gray-900">{campana.titulo}</h4>
                               <p className="text-sm text-gray-600">{campana.descripcion}</p>
                               <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                 <span>📅 {campana.fechaInicio}</span>
                                 <span>📅 {campana.fechaFin}</span>
                                 <span>💰 ${campana.presupuesto?.toLocaleString() || 'N/A'}</span>
                               </div>
                             </div>
                             <div className="flex space-x-2">
                               <button className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
                               <button className="text-green-600 hover:text-green-800 text-sm">Activar</button>
                               <button className="text-red-600 hover:text-red-800 text-sm">Pausar</button>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center py-8 text-gray-500">
                       <p>No hay campañas activas.</p>
                       <button className="mt-2 text-blue-600 hover:text-blue-800">Crear primera campaña</button>
                     </div>
                   )}
                 </div>
               </div>
             )}

             {/* Tab: Solicitudes */}
             {activeTab === 'solicitudes' && (
               <div className="space-y-6">
                 {/* Solicitudes de Productos */}
                 <div className="bg-white shadow rounded-lg">
                   <div className="px-6 py-4 border-b border-gray-200">
                     <h3 className="text-lg font-medium text-gray-900">📦 Solicitudes de Productos</h3>
                     <p className="text-sm text-gray-600 mt-1">Estado de tus solicitudes de productos pendientes de aprobación</p>
                   </div>
                   <div className="p-6">
                     {loadingSolicitudes ? (
                       <div className="text-center py-8">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                         <p className="text-gray-500 mt-2">Cargando solicitudes...</p>
                       </div>
                     ) : solicitudesProductos.length > 0 ? (
                       <div className="space-y-4">
                         {solicitudesProductos.map((solicitud) => (
                           <div key={solicitud.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                             <div className="flex items-start justify-between">
                               <div className="flex-1">
                                                                   <div className="flex items-center space-x-3 mb-3">
                                    <h4 className="font-medium text-gray-900">{solicitud.nombre}</h4>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      solicitud.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                      solicitud.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                                      solicitud.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {solicitud.estado === 'pendiente' ? '⏳ Pendiente' :
                                       solicitud.estado === 'aprobado' ? '✅ Aprobado' :
                                       solicitud.estado === 'rechazado' ? '❌ Rechazado' :
                                       solicitud.estado}
                                    </span>
                                    {/* Indicador de Prioridad */}
                                    {solicitud.prioridad && (
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        solicitud.prioridad === 'urgente' ? 'bg-red-100 text-red-800' :
                                        solicitud.prioridad === 'alta' ? 'bg-orange-100 text-orange-800' :
                                        solicitud.prioridad === 'normal' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                      }`}>
                                        {solicitud.prioridad === 'urgente' ? '🔴 Urgente' :
                                         solicitud.prioridad === 'alta' ? '🟠 Alta' :
                                         solicitud.prioridad === 'normal' ? '🟡 Normal' :
                                         '🟢 Baja'}
                                      </span>
                                    )}
                                  </div>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                   <div className="text-sm">
                                     <span className="font-medium text-gray-700">Categoría:</span>
                                     <span className="ml-2 text-gray-600">{solicitud.categoria}</span>
                                   </div>
                                   <div className="text-sm">
                                     <span className="font-medium text-gray-700">Marca:</span>
                                     <span className="ml-2 text-gray-600">{solicitud.marca}</span>
                                   </div>
                                   <div className="text-sm">
                                     <span className="font-medium text-gray-700">Precio:</span>
                                     <span className="ml-2 text-gray-600">${solicitud.precio?.toLocaleString()}</span>
                                   </div>
                                 </div>
                                 
                                 <p className="text-sm text-gray-600 mb-3">{solicitud.descripcion}</p>
                                 
                                 {solicitud.comentariosAdmin && (
                                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                     <p className="text-sm text-blue-800">
                                       <span className="font-medium">💬 Comentarios del Admin:</span> {solicitud.comentariosAdmin}
                                     </p>
                                   </div>
                                 )}
                                 
                                                                   <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>📅 Solicitado: {solicitud.fechaSolicitud?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
                                    {solicitud.agenteAsignado && (
                                      <span>👤 Agente: {solicitud.agenteAsignado}</span>
                                    )}
                                  </div>
                                  
                                  {/* Selector de Prioridad */}
                                  {solicitud.estado === 'pendiente' && (
                                    <div className="mt-3">
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Prioridad:
                                      </label>
                                      <select
                                        value={solicitud.prioridad || 'normal'}
                                        onChange={(e) => cambiarPrioridadSolicitud(solicitud.id, 'producto', e.target.value)}
                                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      >
                                        <option value="baja">🟢 Baja</option>
                                        <option value="normal">🟡 Normal</option>
                                        <option value="alta">🟠 Alta</option>
                                        <option value="urgente">🔴 Urgente</option>
                                      </select>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="ml-4 flex flex-col space-y-2">
                                  <button 
                                    onClick={() => mostrarVistaPreviaProducto(solicitud)}
                                    className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
                                  >
                                    👁️ Vista Previa
                                  </button>
                                  {solicitud.estado === 'pendiente' && (
                                    <button 
                                      onClick={() => cancelarSolicitud(solicitud.id, 'producto')}
                                      className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-300 rounded hover:bg-red-50"
                                    >
                                      ❌ Cancelar
                                    </button>
                                  )}
                                </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-center py-8 text-gray-500">
                         <p>No hay solicitudes de productos pendientes.</p>
                         <button 
                           onClick={() => setShowProductModal(true)}
                           className="mt-2 text-blue-600 hover:text-blue-800"
                         >
                           Solicitar primer producto
                         </button>
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Solicitudes de Campañas */}
                 <div className="bg-white shadow rounded-lg">
                   <div className="px-6 py-4 border-b border-gray-200">
                     <h3 className="text-lg font-medium text-gray-900">📢 Solicitudes de Campañas</h3>
                     <p className="text-sm text-gray-600 mt-1">Estado de tus solicitudes de campañas pendientes de aprobación</p>
                   </div>
                   <div className="p-6">
                     {solicitudesCampanas.length > 0 ? (
                       <div className="space-y-4">
                         {solicitudesCampanas.map((solicitud) => (
                           <div key={solicitud.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                             <div className="flex items-start justify-between">
                               <div className="flex-1">
                                                                   <div className="flex items-center space-x-3 mb-3">
                                    <h4 className="font-medium text-gray-900">{solicitud.titulo}</h4>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      solicitud.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                      solicitud.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                                      solicitud.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {solicitud.estado === 'pendiente' ? '⏳ Pendiente' :
                                       solicitud.estado === 'aprobado' ? '✅ Aprobado' :
                                       solicitud.estado === 'rechazado' ? '❌ Rechazado' :
                                       solicitud.estado}
                                    </span>
                                    {/* Indicador de Prioridad */}
                                    {solicitud.prioridad && (
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        solicitud.prioridad === 'urgente' ? 'bg-red-100 text-red-800' :
                                        solicitud.prioridad === 'alta' ? 'bg-orange-100 text-orange-800' :
                                        solicitud.prioridad === 'normal' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                      }`}>
                                        {solicitud.prioridad === 'urgente' ? '🔴 Urgente' :
                                         solicitud.prioridad === 'alta' ? '🟠 Alta' :
                                         solicitud.prioridad === 'normal' ? '🟡 Normal' :
                                         '🟢 Baja'}
                                      </span>
                                    )}
                                  </div>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                   <div className="text-sm">
                                     <span className="font-medium text-gray-700">Tipo:</span>
                                     <span className="ml-2 text-gray-600 capitalize">{solicitud.tipo}</span>
                                   </div>
                                   <div className="text-sm">
                                     <span className="font-medium text-gray-700">Presupuesto:</span>
                                     <span className="ml-2 text-gray-600">${solicitud.presupuesto?.toLocaleString()}</span>
                                   </div>
                                   <div className="text-sm">
                                     <span className="font-medium text-gray-700">Duración:</span>
                                     <span className="ml-2 text-gray-600">
                                       {solicitud.fechaInicio} - {solicitud.fechaFin}
                                     </span>
                                   </div>
                                 </div>
                                 
                                 <p className="text-sm text-gray-600 mb-3">{solicitud.descripcion}</p>
                                 
                                 {solicitud.comentariosAdmin && (
                                   <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                                     <p className="text-sm text-green-800">
                                       <span className="font-medium">💬 Comentarios del Admin:</span> {solicitud.comentariosAdmin}
                                     </p>
                                   </div>
                                 )}
                                 
                                                                   <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>📅 Solicitado: {solicitud.fechaSolicitud?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
                                    {solicitud.agenteAsignado && (
                                      <span>👤 Agente: {solicitud.agenteAsignado}</span>
                                    )}
                                  </div>
                                  
                                  {/* Selector de Prioridad */}
                                  {solicitud.estado === 'pendiente' && (
                                    <div className="mt-3">
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Prioridad:
                                      </label>
                                      <select
                                        value={solicitud.prioridad || 'normal'}
                                        onChange={(e) => cambiarPrioridadSolicitud(solicitud.id, 'campana', e.target.value)}
                                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      >
                                        <option value="baja">🟢 Baja</option>
                                        <option value="normal">🟡 Normal</option>
                                        <option value="alta">🟠 Alta</option>
                                        <option value="urgente">🔴 Urgente</option>
                                      </select>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="ml-4 flex flex-col space-y-2">
                                  <button 
                                    onClick={() => mostrarVistaPreviaCampana(solicitud)}
                                    className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
                                  >
                                    👁️ Vista Previa
                                  </button>
                                  {solicitud.estado === 'pendiente' && (
                                    <button 
                                      onClick={() => cancelarSolicitud(solicitud.id, 'campana')}
                                      className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-300 rounded hover:bg-red-50"
                                    >
                                      ❌ Cancelar
                                    </button>
                                  )}
                                </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-center py-8 text-gray-500">
                         <p>No hay solicitudes de campañas pendientes.</p>
                         <button 
                           onClick={() => setShowCampaignModal(true)}
                           className="mt-2 text-blue-600 hover:text-blue-800"
                         >
                           Solicitar primera campaña
                         </button>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
                           )}

             {/* Tab: Historial */}
             {activeTab === 'historial' && (
               <div className="space-y-6">
                 <div className="bg-white shadow rounded-lg">
                   <div className="px-6 py-4 border-b border-gray-200">
                     <h3 className="text-lg font-medium text-gray-900">📜 Historial de Cambios</h3>
                     <p className="text-sm text-gray-600 mt-1">Registro de todas las modificaciones realizadas en tus solicitudes</p>
                   </div>
                   <div className="p-6">
                     {loadingHistorial ? (
                       <div className="text-center py-8">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                         <p className="text-gray-500 mt-2">Cargando historial...</p>
                       </div>
                     ) : historialCambios.length > 0 ? (
                       <div className="space-y-4">
                         {historialCambios.map((cambio) => (
                           <div key={cambio.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                             <div className="flex items-start justify-between">
                               <div className="flex-1">
                                 <div className="flex items-center space-x-3 mb-2">
                                   <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                     cambio.tipoCambio === 'cambio_prioridad' ? 'bg-blue-100 text-blue-800' :
                                     cambio.tipoCambio === 'cancelacion' ? 'bg-red-100 text-red-800' :
                                     cambio.tipoCambio === 'aprobacion' ? 'bg-green-100 text-green-800' :
                                     cambio.tipoCambio === 'rechazo' ? 'bg-orange-100 text-orange-800' :
                                     'bg-gray-100 text-gray-800'
                                   }`}>
                                     {cambio.tipoCambio === 'cambio_prioridad' ? '🔄 Cambio Prioridad' :
                                      cambio.tipoCambio === 'cancelacion' ? '❌ Cancelación' :
                                      cambio.tipoCambio === 'aprobacion' ? '✅ Aprobación' :
                                      cambio.tipoCambio === 'rechazo' ? '⚠️ Rechazo' :
                                      cambio.tipoCambio}
                                   </span>
                                   <span className="text-xs text-gray-500">
                                     {cambio.fechaCambio?.toDate?.()?.toLocaleDateString() || 'N/A'}
                                   </span>
                                   <span className="text-xs text-gray-500">
                                     {cambio.fechaCambio?.toDate?.()?.toLocaleTimeString() || 'N/A'}
                                   </span>
                                 </div>
                                 
                                 <h4 className="font-medium text-gray-900 mb-2">{cambio.descripcion}</h4>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 text-sm">
                                   <div>
                                     <span className="font-medium text-gray-700">Tipo:</span>
                                     <span className="ml-2 text-gray-600 capitalize">{cambio.tipoSolicitud}</span>
                                   </div>
                                   <div>
                                     <span className="font-medium text-gray-700">Solicitud ID:</span>
                                     <span className="ml-2 text-gray-600 font-mono text-xs">{cambio.solicitudId}</span>
                                   </div>
                                   <div>
                                     <span className="font-medium text-gray-700">Usuario:</span>
                                     <span className="ml-2 text-gray-600 capitalize">{cambio.usuario}</span>
                                   </div>
                                 </div>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-center py-8 text-gray-500">
                         <p>No hay cambios registrados aún.</p>
                         <p className="text-sm mt-1">El historial se actualiza automáticamente con cada modificación.</p>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             )}

                         {/* Tab: Reportes */}
            {activeTab === 'reportes' && (
              !canAccessFeature('reportes') ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="text-6xl mb-6">📊</div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Reportes Avanzados Premium</h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Los reportes detallados están disponibles solo para planes Premium y Corporate.
                    <br />
                    Actualiza tu plan para acceder a análisis y reportes personalizados.
                  </p>
                  <button 
                    onClick={() => setActiveTab('membresias')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                  >
                    🚀 Ver Planes Disponibles
                  </button>
                </div>
              ) : (
               <div className="space-y-6">
                 {/* Filtros de Reporte */}
                 <div className="bg-white shadow rounded-lg">
                   <div className="px-6 py-4 border-b border-gray-200">
                     <h3 className="text-lg font-medium text-gray-900">📊 Generador de Reportes</h3>
                     <p className="text-sm text-gray-600 mt-1">Analiza el rendimiento de tu empresa con reportes personalizados</p>
                   </div>
                   <div className="p-6">
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Fecha Inicio
                         </label>
                         <input
                           type="date"
                           value={filtroReporte.fechaInicio}
                           onChange={(e) => setFiltroReporte({...filtroReporte, fechaInicio: e.target.value})}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Fecha Fin
                         </label>
                         <input
                           type="date"
                           value={filtroReporte.fechaFin}
                           onChange={(e) => setFiltroReporte({...filtroReporte, fechaFin: e.target.value})}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Tipo
                         </label>
                         <select
                           value={filtroReporte.tipo}
                           onChange={(e) => setFiltroReporte({...filtroReporte, tipo: e.target.value})}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         >
                           <option value="todos">Todos</option>
                           <option value="producto">Productos</option>
                           <option value="campana">Campañas</option>
                         </select>
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Estado
                         </label>
                         <select
                           value={filtroReporte.estado}
                           onChange={(e) => setFiltroReporte({...filtroReporte, estado: e.target.value})}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         >
                           <option value="todos">Todos</option>
                           <option value="pendiente">Pendiente</option>
                           <option value="aprobado">Aprobado</option>
                           <option value="rechazado">Rechazado</option>
                         </select>
                       </div>
                     </div>
                     
                     <div className="flex space-x-3">
                       <button
                         onClick={generarReportes}
                         disabled={loadingReportes}
                         className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                       >
                         {loadingReportes ? 'Generando...' : '📊 Generar Reporte'}
                       </button>
                       
                       <button
                         onClick={() => setShowReporteModal(true)}
                         className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                       >
                         📄 Exportar
                       </button>
                     </div>
                   </div>
                 </div>

                 {/* Métricas Principales */}
                 {reportes.solicitudesDelMes > 0 && (
                   <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                     <div className="bg-white p-4 rounded-lg shadow">
                       <div className="flex items-center">
                         <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                           📝
                         </div>
                         <div className="ml-4">
                           <h3 className="text-lg font-semibold text-gray-900">{reportes.solicitudesDelMes}</h3>
                           <p className="text-sm text-gray-600">Solicitudes</p>
                         </div>
                       </div>
                     </div>

                     <div className="bg-white p-4 rounded-lg shadow">
                       <div className="flex items-center">
                         <div className="p-3 rounded-full bg-green-100 text-green-600">
                           ✅
                         </div>
                         <div className="ml-4">
                           <h3 className="text-lg font-semibold text-gray-900">{reportes.solicitudesAprobadas}</h3>
                           <p className="text-sm text-gray-600">Aprobadas</p>
                         </div>
                       </div>
                     </div>

                     <div className="bg-white p-4 rounded-lg shadow">
                       <div className="flex items-center">
                         <div className="p-3 rounded-full bg-red-100 text-red-600">
                           ❌
                         </div>
                         <div className="ml-4">
                           <h3 className="text-lg font-semibold text-gray-900">{reportes.solicitudesRechazadas}</h3>
                           <p className="text-sm text-gray-600">Rechazadas</p>
                         </div>
                       </div>
                     </div>

                     <div className="bg-white p-4 rounded-lg shadow">
                       <div className="flex items-center">
                         <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                           ⏳
                         </div>
                         <div className="ml-4">
                           <h3 className="text-lg font-semibold text-gray-900">{reportes.solicitudesPendientes || 0}</h3>
                           <p className="text-sm text-gray-600">Pendientes</p>
                         </div>
                       </div>
                     </div>

                     <div className="bg-white p-4 rounded-lg shadow">
                       <div className="flex items-center">
                         <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                           📦
                         </div>
                         <div className="ml-4">
                           <h3 className="text-lg font-semibold text-gray-900">{reportes.productosActivos}</h3>
                           <p className="text-sm text-gray-600">Productos Activos</p>
                         </div>
                       </div>
                     </div>

                     <div className="bg-white p-4 rounded-lg shadow">
                       <div className="flex items-center">
                         <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                           📢
                         </div>
                         <div className="ml-4">
                           <h3 className="text-lg font-semibold text-gray-900">{reportes.campanasActivas}</h3>
                           <p className="text-sm text-gray-600">Campañas Activas</p>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}

                 {/* Gráficos y Análisis Detallado */}
                 {reportes.detalles && (
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* Distribución por Tipo */}
                     <div className="bg-white shadow rounded-lg">
                       <div className="px-6 py-4 border-b border-gray-200">
                         <h3 className="text-lg font-medium text-gray-900">📋 Distribución por Tipo</h3>
                       </div>
                       <div className="p-6">
                         <div className="space-y-4">
                           <div className="flex items-center justify-between">
                             <span className="text-sm text-gray-600">📦 Productos</span>
                             <div className="flex items-center space-x-2">
                               <div className="w-32 bg-gray-200 rounded-full h-2">
                                 <div 
                                   className="bg-blue-600 h-2 rounded-full" 
                                   style={{width: `${reportes.solicitudesDelMes > 0 ? (reportes.detalles.solicitudesPorTipo.productos / reportes.solicitudesDelMes) * 100 : 0}%`}}
                                 ></div>
                               </div>
                               <span className="text-sm font-medium text-gray-900">{reportes.detalles.solicitudesPorTipo.productos}</span>
                             </div>
                           </div>
                           <div className="flex items-center justify-between">
                             <span className="text-sm text-gray-600">📢 Campañas</span>
                             <div className="flex items-center space-x-2">
                               <div className="w-32 bg-gray-200 rounded-full h-2">
                                 <div 
                                   className="bg-green-600 h-2 rounded-full" 
                                   style={{width: `${reportes.solicitudesDelMes > 0 ? (reportes.detalles.solicitudesPorTipo.campanas / reportes.solicitudesDelMes) * 100 : 0}%`}}
                                 ></div>
                               </div>
                               <span className="text-sm font-medium text-gray-900">{reportes.detalles.solicitudesPorTipo.campanas}</span>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* Distribución por Prioridad */}
                     <div className="bg-white shadow rounded-lg">
                       <div className="px-6 py-4 border-b border-gray-200">
                         <h3 className="text-lg font-medium text-gray-900">🎯 Distribución por Prioridad</h3>
                       </div>
                       <div className="p-6">
                         <div className="space-y-4">
                           <div className="flex items-center justify-between">
                             <span className="text-sm text-gray-600">🔴 Urgente</span>
                             <div className="flex items-center space-x-2">
                               <div className="w-32 bg-gray-200 rounded-full h-2">
                                 <div 
                                   className="bg-red-600 h-2 rounded-full" 
                                   style={{width: `${reportes.solicitudesDelMes > 0 ? (reportes.detalles.solicitudesPorPrioridad.urgente / reportes.solicitudesDelMes) * 100 : 0}%`}}
                                 ></div>
                               </div>
                               <span className="text-sm font-medium text-gray-900">{reportes.detalles.solicitudesPorPrioridad.urgente}</span>
                             </div>
                           </div>
                           <div className="flex items-center justify-between">
                             <span className="text-sm text-gray-600">🟠 Alta</span>
                             <div className="flex items-center space-x-2">
                               <div className="w-32 bg-gray-200 rounded-full h-2">
                                 <div 
                                   className="bg-orange-600 h-2 rounded-full" 
                                   style={{width: `${reportes.solicitudesDelMes > 0 ? (reportes.detalles.solicitudesPorPrioridad.alta / reportes.solicitudesDelMes) * 100 : 0}%`}}
                                 ></div>
                               </div>
                               <span className="text-sm font-medium text-gray-900">{reportes.detalles.solicitudesPorPrioridad.alta}</span>
                             </div>
                           </div>
                           <div className="flex items-center justify-between">
                             <span className="text-sm text-gray-600">🟡 Normal</span>
                             <div className="flex items-center space-x-2">
                               <div className="w-32 bg-gray-200 rounded-full h-2">
                                 <div 
                                   className="bg-yellow-600 h-2 rounded-full" 
                                   style={{width: `${reportes.solicitudesDelMes > 0 ? (reportes.detalles.solicitudesPorPrioridad.normal / reportes.solicitudesDelMes) * 100 : 0}%`}}
                                 ></div>
                               </div>
                               <span className="text-sm font-medium text-gray-900">{reportes.detalles.solicitudesPorPrioridad.normal}</span>
                             </div>
                           </div>
                           <div className="flex items-center justify-between">
                             <span className="text-sm text-gray-600">🟢 Baja</span>
                             <div className="flex items-center space-x-2">
                               <div className="w-32 bg-gray-200 rounded-full h-2">
                                 <div 
                                   className="bg-green-600 h-2 rounded-full" 
                                   style={{width: `${reportes.solicitudesDelMes > 0 ? (reportes.detalles.solicitudesPorPrioridad.baja / reportes.solicitudesDelMes) * 100 : 0}%`}}
                                 ></div>
                               </div>
                               <span className="text-sm font-medium text-gray-900">{reportes.detalles.solicitudesPorPrioridad.baja}</span>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}

                 {/* Métricas de Rendimiento */}
                 {reportes.tiempoPromedioRespuesta > 0 && (
                   <div className="bg-white shadow rounded-lg">
                     <div className="px-6 py-4 border-b border-gray-200">
                       <h3 className="text-lg font-medium text-gray-900">⏱️ Métricas de Rendimiento</h3>
                     </div>
                     <div className="p-6">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="text-center">
                           <div className="text-3xl font-bold text-blue-600">{reportes.tiempoPromedioRespuesta}</div>
                           <div className="text-sm text-gray-600 mt-1">Días promedio de respuesta</div>
                         </div>
                         <div className="text-center">
                           <div className="text-3xl font-bold text-green-600">
                             {reportes.solicitudesDelMes > 0 ? Math.round((reportes.solicitudesAprobadas / reportes.solicitudesDelMes) * 100) : 0}%
                           </div>
                           <div className="text-sm text-gray-600 mt-1">Tasa de aprobación</div>
                         </div>
                         <div className="text-center">
                           <div className="text-3xl font-bold text-purple-600">
                             {reportes.productosActivos + reportes.campanasActivas}
                           </div>
                           <div className="text-sm text-gray-600 mt-1">Total elementos activos</div>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
               </div>
             )
           )}

            {/* Tab: Clientes */}
            {activeTab === 'clientes' && (
              !canAccessFeature('clientes') ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="text-6xl mb-6">👥</div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Gestión de Clientes Premium</h2>
                  <p className="text-lg text-gray-600 mb-8">
                    La gestión avanzada de clientes está disponible solo para planes Premium y Corporate.
                    <br />
                    Actualiza tu plan para acceder a herramientas de CRM y gestión de relaciones.
                  </p>
                  <button 
                    onClick={() => setActiveTab('membresias')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                  >
                    🚀 Ver Planes Disponibles
                  </button>
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Gestión de Clientes</h3>
                  </div>
                  <div className="p-6">
                    {clientes.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cliente
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {clientes.map((cliente) => (
                              <tr key={cliente.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {cliente.nombre || 'Sin nombre'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{cliente.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    Activo
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button className="text-blue-600 hover:text-blue-900 mr-3">Ver</button>
                                  <button className="text-green-600 hover:text-green-900">Contactar</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No hay clientes registrados aún.</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Tab: Métricas */}
            {activeTab === 'metricas' && (
              !canAccessFeature('metricas') ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="text-6xl mb-6">💎</div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Funcionalidad Premium</h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Las métricas avanzadas están disponibles solo para planes Premium y Corporate.
                    <br />
                    Actualiza tu plan para acceder a análisis detallados de rendimiento.
                  </p>
                  <button 
                    onClick={() => setActiveTab('membresias')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                  >
                    🚀 Ver Planes Disponibles
                  </button>
                </div>
              ) : (
              <div className="space-y-6">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Métricas de Rendimiento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{metricas.visitasPerfil?.toLocaleString() || 0}</div>
                      <div className="text-sm text-gray-500">Visitas al Perfil</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{metricas.productosVendidos || 0}</div>
                      <div className="text-sm text-gray-500">Productos Vendidos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">{metricas.clientesNuevos || 0}</div>
                      <div className="text-sm text-gray-500">Clientes Nuevos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{metricas.calificacionPromedio || 0}</div>
                      <div className="text-sm text-gray-500">Calificación Promedio</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-indigo-600">{metricas.conversionRate || 0}%</div>
                      <div className="text-sm text-gray-500">Tasa de Conversión</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-pink-600">{metricas.engagementRate || 0}%</div>
                      <div className="text-sm text-gray-500">Tasa de Engagement</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recomendaciones para Mejorar</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <span className="text-green-500 text-lg">✓</span>
                      <div>
                        <p className="font-medium text-gray-900">Optimizar descripciones de productos</p>
                        <p className="text-sm text-gray-600">Mejora las descripciones para aumentar la conversión</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-yellow-500 text-lg">⚠</span>
                      <div>
                        <p className="font-medium text-gray-900">Aumentar presencia en redes sociales</p>
                        <p className="text-sm text-gray-600">Mejora tu visibilidad online</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-blue-500 text-lg">💡</span>
                      <div>
                        <p className="font-medium text-gray-900">Crear campañas estacionales</p>
                        <p className="text-sm text-gray-600">Aprovecha las tendencias del mercado</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )
            )}

            {/* Tab: Membresías */}
            {activeTab === 'membresias' && (
              <div className="space-y-8">
                {/* Header de Membresías */}
                <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl p-8 text-white text-center">
                  <h1 className="text-4xl font-bold mb-4">💎 Gestión de Membresía</h1>
                  <p className="text-xl text-purple-100">Administra tu plan y optimiza tu presencia en la plataforma</p>
                </div>

                {/* Componentes de Membresía */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Estado de la Membresía */}
                  <div className="lg:col-span-1">
                    <SubscriptionStatus empresaId={empresaId} />
                        </div>
                        
                  {/* Métricas de Uso */}
                  <div className="lg:col-span-1">
                    <UsageMetrics empresaId={empresaId} />
                          </div>
                        </div>

                {/* Limitaciones del Plan */}
                <div className="lg:col-span-2">
                  <MembershipLimitations empresaId={empresaId} />
                          </div>
              </div>
            )}

            {/* Tab: Usuario */}
            {activeTab === 'usuario' && (
              <div className="space-y-6">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">👤 Información del Usuario</h3>
                  <p className="text-sm text-gray-600 mb-6">Credenciales de acceso y configuración de la cuenta</p>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Contenido de la sección de usuario */}
                      <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email de la empresa
                  </label>
                  <input
                          type="email"
                          value={empresa?.email || ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre de la empresa
                  </label>
                  <input
                    type="text"
                          value={empresa?.nombre || ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
                </div>

                    <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado de la cuenta
                  </label>
                        <div className="flex items-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            empresa?.estado === 'activo' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {empresa?.estado || 'Pendiente'}
                           </span>
                         </div>
                       </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de registro
                   </label>
                   <input
                     type="text"
                          value={empresa?.fecha_registro ? new Date(empresa.fecha_registro.toDate()).toLocaleDateString() : 'N/A'}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                   />
                 </div>
                 </div>
                 </div>
           </div>
         </div>
       )}
             </div>
                 </div>
                 </div>
     </>
   );
 }
