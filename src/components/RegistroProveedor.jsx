import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import { useNavigate, useLocation } from 'react-router-dom';
import { NotificationService } from '../utils/notificationService';
import { getRegiones, getComunas } from '../utils/regionesComunas';

// Componente para registro sin autenticación
function RegistroProveedorSinAuth() {
  // Valida formato de teléfono chileno: +56XXXXXXXXX (9 dígitos después de +56)
  function isValidTelefonoEmpresa(telefono) {
    return /^\+56\d{9}$/.test(telefono);
  }
  // Formatea el RUT chileno: 50000000-1, 50000000-K, etc.
  function formatRut(raw) {
    let rut = raw.replace(/[^0-9kK]/g, '').toUpperCase();
    if (rut.length > 9) rut = rut.slice(0, 9);
    if (rut.length <= 1) return rut;
    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1);
    // Agrega puntos cada 3 dígitos desde la derecha
    let cuerpoFmt = '';
    for (let i = cuerpo.length; i > 0; i -= 3) {
      const start = Math.max(i - 3, 0);
      cuerpoFmt = (start > 0 ? '.' : '') + cuerpo.slice(start, i) + cuerpoFmt;
    }
    return `${cuerpoFmt}-${dv}`;
  }

  // Valida el formato del RUT chileno (máximo 9 dígitos, último dígito numérico o K)
  function isValidRut(rut) {
    const rutClean = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
    if (!/^\d{7,9}[0-9K]$/.test(rutClean)) return false;
    return true;
  }
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Información de la Empresa
    nombre_empresa: '',
    rut_empresa: '',
    direccion_empresa: '',
    comuna: '',
    ciudad: 'Santiago',
    region: 'Metropolitana',
    telefono_empresa: '',
    email_empresa: '',
    web_actual: '',
    // Clasificación de empresa
    rubro: '',
    tipoEmpresa: '', // Se determinará según la ruta
    // Información del Representante
    nombres_representante: '',
    apellidos_representante: '',
    cargo_representante: '',
    fecha_nacimiento_representante: '',
    telefono_representante: '',
    email_representante: '',
    rut_representante: '',
    // Información del Negocio
    descripcion_negocio: '',
    anos_funcionamiento: '',
    numero_empleados: '',
    horario_atencion: '',
    categorias_servicios: [],
    marcas_vehiculos: [],
    // Horarios predefinidos para edición visual
    horarios: {
      lunes: { activo: true, inicio: '09:00', fin: '18:00' },
      martes: { activo: true, inicio: '09:00', fin: '18:00' },
      miercoles: { activo: true, inicio: '09:00', fin: '18:00' },
      jueves: { activo: true, inicio: '09:00', fin: '18:00' },
      viernes: { activo: true, inicio: '09:00', fin: '18:00' },
      sabado: { activo: true, inicio: '09:00', fin: '14:00' },
      domingo: { activo: false, inicio: '10:00', fin: '14:00' }
    },
    // Servicios Web que necesita
    necesita_pagina_web: false,
    tipo_pagina_web: '', // 'basica', 'intermedia', 'completa'
    tiene_redes_sociales: false,
    redes_sociales: {
      facebook: '',
      instagram: '',
      whatsapp: '',
      tiktok: ''
    },
    // Credenciales para cuenta futura
    password: '',
    confirm_password: '',
    // Términos y condiciones
    acepta_terminos: false,
    acepta_notificaciones: true,
    acepta_visita_campo: true
  });
  
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);
  const [regionesDisponibles, setRegionesDisponibles] = useState([]);
  const [comunasDisponibles, setComunasDisponibles] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Logo
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  // Manejo de archivo de logo
  const handleLogoFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoFile(file);
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Opciones de rubro para PyMEs
  const rubrosDisponibles = [
    'Vulcanización',
    'Lavado',
    'Talleres mecánicos',
    'Pintura',
    'Lubricentro',
    'Accesorios',
    'Grúas',
    'Repuestos',
    'Neumáticos',
    'Baterías',
    'Frenos',
    'Eléctrico',
    'Carrocería',
    'Escapes',
    'Filtros',
    'Herramientas',
    'Diagnóstico',
    'Mantención',
    'Seguros',
    'Audio y Alarmas',
    'Climatización',
    'Transmisión',
    'Suspensión',
    'Otros'
  ];

  // Determinar tipo de empresa según la ruta
  useEffect(() => {
    const pathname = location.pathname;
    let tipoDetectado = '';
    
    if (pathname.includes('pyme') || pathname.includes('emprendimiento')) {
      tipoDetectado = 'pyme';
    } else if (pathname.includes('proveedor')) {
      tipoDetectado = 'proveedor';
    } else if (pathname.includes('proveedores-locales')) {
      // Si viene de la página de PyMEs locales, es PyME
      tipoDetectado = 'pyme';
    } else {
      // Por defecto, si viene de /registro-proveedor, es proveedor
      tipoDetectado = 'proveedor';
    }
    
    setFormData(prev => ({
      ...prev,
      tipoEmpresa: tipoDetectado
    }));
  }, [location.pathname]);

  // Cargar datos iniciales
  useEffect(() => {
    setRegionesDisponibles(getRegiones());
  }, []);

  // Actualizar comunas cuando cambie la región
  useEffect(() => {
    if (formData.region) {
      setComunasDisponibles(getComunas(formData.region));
      setFormData(prev => ({ ...prev, comuna: '' }));
    } else {
      setComunasDisponibles([]);
      setFormData(prev => ({ ...prev, comuna: '' }));
    }
  }, [formData.region]);

  // Cargar categorías y marcas desde Firebase
  useEffect(() => {
    async function cargarDatos() {
      try {
        // Cargar categorías
        const categoriasSnap = await getDocs(collection(db, 'categorias'));
        const categoriasList = categoriasSnap.docs.map(doc => doc.data().nombre);
        setCategoriasDisponibles(categoriasList);

        // Cargar marcas
        const marcasSnap = await getDocs(collection(db, 'marcas'));
        const marcasList = marcasSnap.docs.map(doc => doc.data().nombre);
        setMarcasDisponibles(marcasList);
      } catch (error) {
        console.error('Error loading categories and brands:', error);
      }
    }
    cargarDatos();
  }, []);

  const regiones = [
    "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso",
    "Metropolitana", "O'Higgins", "Maule", "Ñuble", "Biobío", "La Araucanía",
    "Los Ríos", "Los Lagos", "Aysén", "Magallanes"
  ];

  const opcionesPaginaWeb = [
    {
      tipo: 'basica',
      nombre: 'Página Básica',
      precio: '$299.990',
      descripcion: 'Sitio web simple con información básica de tu empresa',
      incluye: [
        'Página principal con información de contacto',
        'Galería de servicios básica',
        'Formulario de contacto',
        'Responsive (adaptable a móviles)',
        'Hosting incluido por 1 año'
      ]
    },
    {
      tipo: 'intermedia',
      nombre: 'Página Intermedia',
      precio: '$549.990',
      descripcion: 'Sitio web completo con funcionalidades avanzadas',
      incluye: [
        'Todo lo de la página básica',
        'Catálogo de productos/servicios',
        'Sistema de citas online',
        'Integración con redes sociales',
        'Chat en vivo',
        'Blog/noticias',
        'SEO básico'
      ]
    },
    {
      tipo: 'completa',
      nombre: 'Página Completa',
      precio: '$899.990',
      descripcion: 'Plataforma e-commerce completa para tu negocio',
      incluye: [
        'Todo lo de la página intermedia',
        'Tienda online completa',
        'Sistema de pagos integrado',
        'Gestión de inventario',
        'Dashboard administrativo',
        'App móvil básica',
        'SEO avanzado y marketing digital',
        'Soporte prioritario por 6 meses'
      ]
    }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'categorias_servicios') {
        setFormData(prev => ({
          ...prev,
          categorias_servicios: checked 
            ? [...prev.categorias_servicios, value]
            : prev.categorias_servicios.filter(c => c !== value)
        }));
      } else if (name === 'marcas_vehiculos') {
        setFormData(prev => ({
          ...prev,
          marcas_vehiculos: checked 
            ? [...prev.marcas_vehiculos, value]
            : prev.marcas_vehiculos.filter(m => m !== value)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else if (name.startsWith('redes_sociales.')) {
      const redSocial = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        redes_sociales: {
          ...prev.redes_sociales,
          [redSocial]: value
        }
      }));
    } else if (name === 'rut_empresa' || name === 'rut_representante') {
      setFormData(prev => ({
        ...prev,
        [name]: formatRut(value)
      }));
    } else if (name === 'telefono_empresa' || name === 'telefono_representante') {
      // Solo permitir +56 y hasta 9 dígitos adicionales
      let val = value.replace(/[^\d]/g, '');
      if (val.startsWith('56')) val = val.slice(2);
      val = val.slice(0, 9);
      const newValue = '+56' + val;
      setFormData(prev => ({ ...prev, [name]: newValue }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      // Información de la empresa
      if (!formData.nombre_empresa.trim()) newErrors.nombre_empresa = 'El nombre de la empresa es obligatorio';
      if (!formData.rut_empresa.trim()) newErrors.rut_empresa = 'El RUT de la empresa es obligatorio';
      else if (!isValidRut(formData.rut_empresa)) newErrors.rut_empresa = 'RUT inválido. Debe tener hasta 9 dígitos y terminar en número o K';
      else {
        // Validar que el RUT empresa sea mayor a 50.000.000
        const rutClean = formData.rut_empresa.replace(/\./g, '').replace(/-/g, '').toUpperCase();
        const cuerpo = parseInt(rutClean.slice(0, -1), 10);
        if (isNaN(cuerpo) || cuerpo <= 50000000) {
          newErrors.rut_empresa = 'El RUT de la empresa debe ser mayor a 50.000.000';
        }
      }
      if (!formData.direccion_empresa.trim()) newErrors.direccion_empresa = 'La dirección es obligatoria';
      if (!formData.telefono_empresa.trim()) newErrors.telefono_empresa = 'El teléfono es obligatorio';
      else if (!isValidTelefonoEmpresa(formData.telefono_empresa)) newErrors.telefono_empresa = 'Debe ingresar +56 seguido de 9 dígitos (ej: +56912345678)';
      if (!formData.email_empresa.trim()) newErrors.email_empresa = 'El email de la empresa es obligatorio';
      if (!formData.rubro.trim()) newErrors.rubro = 'El rubro específico es obligatorio';
      if (formData.email_empresa && !/\S+@\S+\.\S+/.test(formData.email_empresa)) {
        newErrors.email_empresa = 'El email no es válido';
      }
    } else if (currentStep === 2) {
      // Información del representante
      if (!formData.nombres_representante.trim()) newErrors.nombres_representante = 'Los nombres del representante son obligatorios';
      if (!formData.apellidos_representante.trim()) newErrors.apellidos_representante = 'Los apellidos del representante son obligatorios';
      if (!formData.rut_representante || !formData.rut_representante.trim()) {
        newErrors.rut_representante = 'El RUT del representante es obligatorio';
      } else if (!isValidRut(formData.rut_representante)) {
        newErrors.rut_representante = 'RUT inválido. Debe tener hasta 9 dígitos y terminar en número o K';
      } else {
        // Validar que el RUT representante sea menor a 50.000.000
        const rutClean = formData.rut_representante.replace(/\./g, '').replace(/-/g, '').toUpperCase();
        const cuerpo = parseInt(rutClean.slice(0, -1), 10);
        if (isNaN(cuerpo) || cuerpo >= 50000000) {
          newErrors.rut_representante = 'El RUT del representante debe ser menor a 50.000.000';
        }
      }
      if (!formData.email_representante.trim()) newErrors.email_representante = 'El email del representante es obligatorio';
      if (formData.email_representante && !/\S+@\S+\.\S+/.test(formData.email_representante)) {
        newErrors.email_representante = 'El email no es válido';
      }
      // Validación de teléfono del representante (opcional, pero si se ingresa debe ser válido)
      if (formData.telefono_representante && formData.telefono_representante.trim()) {
        if (!isValidTelefonoEmpresa(formData.telefono_representante)) {
          newErrors.telefono_representante = 'Debe ingresar +56 seguido de 9 dígitos (ej: +56912345678)';
        }
      }
      if (!formData.fecha_nacimiento_representante) newErrors.fecha_nacimiento_representante = 'La fecha de nacimiento es obligatoria';
    } else if (currentStep === 3) {
      // Información del negocio
      if (!formData.descripcion_negocio.trim()) newErrors.descripcion_negocio = 'La descripción del negocio es obligatoria';
      if (!formData.anos_funcionamiento) newErrors.anos_funcionamiento = 'Los años de funcionamiento son obligatorios';
      // Validación de horario: al menos un día activo y con horas válidas
      const horarios = formData.horarios || {};
      const diasActivos = Object.values(horarios).filter(h => h.activo);
      const horarioValido = diasActivos.length > 0 && diasActivos.every(h => h.inicio && h.fin);
      if (!horarioValido) newErrors.horario_atencion = 'Debes ingresar al menos un día activo y sus horas de inicio/fin';
      if (formData.categorias_servicios.length === 0) newErrors.categorias_servicios = 'Selecciona al menos una categoría de servicio';
      if (formData.marcas_vehiculos.length === 0) newErrors.marcas_vehiculos = 'Selecciona al menos una marca de vehículo';
    } else if (currentStep === 4) {
      // Servicios web (opcional, solo validar si seleccionó que necesita)
      if (formData.necesita_pagina_web && !formData.tipo_pagina_web) {
        newErrors.tipo_pagina_web = 'Selecciona el tipo de página web que necesitas';
      }
    } else if (currentStep === 5) {
      // Credenciales y términos
      if (!formData.password) newErrors.password = 'La contraseña es obligatoria';
      if (formData.password && formData.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      if (formData.password !== formData.confirm_password) newErrors.confirm_password = 'Las contraseñas no coinciden';
      if (!formData.acepta_terminos) newErrors.acepta_terminos = 'Debes aceptar los términos y condiciones';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    // Forzar re-render y debug visual
    const valid = validateStep();
    if (valid) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Debug: mostrar errores en consola
      console.log('Errores de validación:', errors);
      // Forzar scroll al primer error visible
      setTimeout(() => {
        const errorElem = document.querySelector('.text-red-500');
        if (errorElem) {
          errorElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      // Forzar actualización de estado para mostrar errores
      setErrors(e => ({ ...e }));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) {
      return;
    }
    setIsSubmitting(true);
    try {
      // Verificar si el email ya existe
      const emailQuery = query(
        collection(db, 'solicitudes_empresa'),
        where('email_empresa', '==', formData.email_empresa)
      );
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        setErrors({ email_empresa: 'Ya existe una solicitud con este email de empresa' });
        setIsSubmitting(false);
        return;
      }
      // Procesar logo
      let logoData = null;
      if (logoPreview) {
        logoData = logoPreview;
      }
      // Crear solicitud con estructura extendida
      const solicitudData = {
        // Campos principales
        nombre: formData.nombre_empresa,
        rut: formData.rut_empresa,
        direccion: formData.direccion_empresa,
        comuna: formData.comuna,
        ciudad: formData.ciudad,
        region: formData.region,
        telefono: formData.telefono_empresa,
        email: formData.email_empresa,
        web: formData.web_actual,
        categoria: formData.rubro,
        tipoEmpresa: formData.tipoEmpresa,
        destacado: false,
        perfilCompleto: false,
        estado: 'pendiente',
        etapa_proceso: 'revision_inicial',
        fecha_registro: new Date(),
        fecha_actualizacion: new Date(),
        fecha_ultima_actualizacion: new Date(),
        fecha_activacion: null,
        comentario_admin: '',
        admin_activador: null,
        admin_responsable: 'admin@av10dejulio.cl',
        contactoAdicional: '',
        solicitud_origen_id: null,
        origen: 'cliente', // Campo adicional solicitado
        // Subobjetos
        representante: {
          nombre: formData.nombres_representante,
          apellidos: formData.apellidos_representante,
          cargo: formData.cargo_representante,
          email: formData.email_representante,
          telefono: formData.telefono_representante,
          rut_representante: formData.rut_representante
        },
        datos_solicitud: {
          acepta_terminos: formData.acepta_terminos,
          acepta_notificaciones: formData.acepta_notificaciones,
          acepta_visita_agente: formData.acepta_visita_campo,
          necesita_pagina_web: formData.necesita_pagina_web,
          tipo_pagina_web: formData.tipo_pagina_web,
          tiene_redes_sociales: formData.tiene_redes_sociales,
          anos_funcionamiento: formData.anos_funcionamiento,
          numero_empleados: formData.numero_empleados,
          password_hash: btoa(formData.password),
          redes_sociales: formData.redes_sociales,
          descripcion: formData.descripcion_negocio,
          descripcionCompleta: formData.descripcion_negocio,
          galeria_files_data: [],
          logo_file_data: logoData,
          rut_representante: formData.rut_representante,
          rubro: formData.rubro
        },
        servicios: formData.categorias_servicios,
        marcas: formData.marcas_vehiculos,
        horarios: {
          lunes: { activo: true, inicio: '09:00', fin: '18:00' },
          martes: { activo: true, inicio: '09:00', fin: '18:00' },
          miercoles: { activo: true, inicio: '09:00', fin: '18:00' },
          jueves: { activo: true, inicio: '09:00', fin: '18:00' },
          viernes: { activo: true, inicio: '09:00', fin: '18:00' },
          sabado: { activo: false, inicio: '09:00', fin: '13:00' },
          domingo: { activo: false, inicio: '10:00', fin: '14:00' }
        },
        imagenLocal: '',
        logo: '',
        logoAsignado: false,
        tiene_credenciales_asignadas: false,
        usuario_empresa: null,
        webValidada: false,
        galeria: [],
        metadatos: {
          ip_registro: window.location.hostname,
          user_agent: navigator.userAgent,
          referencia: 'web_directa',
          tipo_registro: 'proveedor_sin_auth',
          timestamp: new Date().toISOString()
        },
        etapas_proceso: {
          revision_inicial: {
            estado: 'pendiente',
            fecha_inicio: new Date(),
            fecha_fin: null,
            comentarios: '',
            responsable: null
          },
          validacion_documentos: {
            estado: 'pendiente',
            fecha_inicio: null,
            fecha_fin: null,
            comentarios: '',
            responsable: null
          },
          verificacion_ubicacion: {
            estado: 'pendiente',
            fecha_inicio: null,
            fecha_fin: null,
            comentarios: '',
            responsable: null
          },
          visita_campo: {
            estado: 'pendiente',
            fecha_inicio: null,
            fecha_fin: null,
            fecha_programada: null,
            agente_asignado: null,
            comentarios: '',
            responsable: null
          },
          aprobacion_final: {
            estado: 'pendiente',
            fecha_inicio: null,
            fecha_fin: null,
            comentarios: '',
            responsable: null
          }
        }
      };
      const docRef = await addDoc(collection(db, 'solicitudes_empresa'), {
        ...solicitudData,
        fecha_nacimiento_representante: formData.fecha_nacimiento_representante
      });
      // Notificación admin
      await NotificationService.createInAppNotification(
        'admin',
        'validacion',
        'Nueva Solicitud de Proveedor',
        `${formData.nombre_empresa} (${formData.nombres_representante} ${formData.apellidos_representante}) ha enviado una solicitud de registro`,
        {
          solicitudId: docRef.id,
          empresaNombre: formData.nombre_empresa,
          representante: `${formData.nombres_representante} ${formData.apellidos_representante}`,
          fechaNacimiento: formData.fecha_nacimiento_representante,
          email: formData.email_empresa,
          necesitaWeb: formData.necesita_pagina_web,
          tipoWeb: formData.tipo_pagina_web,
          etapaActual: 'revision_inicial',
          origen: 'registro_proveedor'
        }
      );
      setSolicitudEnviada(true);
      // Redirección
      const countdownInterval = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            navigate('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error creating provider request:', error);
      alert('Error al enviar la solicitud. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (solicitudEnviada) {
    return (
      <div className="text-center space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            ¡Solicitud de proveedor enviada exitosamente!
          </h2>
          <p className="text-green-700 mb-4">
            Hemos recibido tu solicitud para unirte como proveedor en AV10 de Julio. 
            Tu empresa será revisada en las próximas 48-72 horas.
          </p>
          
          <div className="bg-white border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-green-800 mb-2">¿Qué sigue ahora?</h3>
            <div className="text-sm text-green-700 text-left space-y-1">
              <p>1. 📋 Revisaremos la información de tu empresa</p>
              <p>2. 📞 Te contactaremos para validar datos y coordinar</p>
              <p>3. 📍 Verificaremos la ubicación de tu establecimiento</p>
              <p>4. 👥 Un agente de campo visitará tu negocio</p>
              {formData.necesita_pagina_web && (
                <p>5. 💻 Te enviaremos el presupuesto para tu página web ({formData.tipo_pagina_web})</p>
              )}
              <p>{formData.necesita_pagina_web ? '6' : '5'}. ✅ Una vez aprobado, activaremos tu cuenta de proveedor</p>
            </div>
          </div>

          {formData.necesita_pagina_web && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-800 mb-2">Servicio de Página Web Solicitado</h3>
              <p className="text-sm text-blue-700">
                Has solicitado una <strong>página web {formData.tipo_pagina_web}</strong>. 
                Nuestro equipo de desarrollo te contactará con un presupuesto detallado y cronograma.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-green-600">
              📧 Te enviaremos actualizaciones a: <strong>{formData.email_empresa}</strong>
            </p>
            <p className="text-sm text-green-600">
              📱 Y también al representante: <strong>{formData.email_representante}</strong>
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-blue-800 text-center">
                🔄 Serás redirigido al inicio en <strong>{redirectCountdown}</strong> segundos...
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Ir al Inicio Ahora
              </button>
              <button
                onClick={() => navigate('/registro-cliente')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Registrar Cliente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Registro de Proveedor - AV10 de Julio
        </h1>
        <p className="text-gray-600">
          Únete a la red de proveedores más grande del sector automotriz
        </p>
      </div>

      <form onSubmit={currentStep === 5 ? handleSubmit : (e) => { e.preventDefault(); handleNextStep(); }}>
        {/* Paso 1: Información de la Empresa */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Información de la Empresa</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Empresa *</label>
                <input
                  type="text"
                  name="nombre_empresa"
                  value={formData.nombre_empresa}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.nombre_empresa ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Repuestos Chile S.A."
                />
                {errors.nombre_empresa && <p className="text-red-500 text-sm mt-1">{errors.nombre_empresa}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RUT de la Empresa *</label>
                <input
                  type="text"
                  name="rut_empresa"
                  value={formData.rut_empresa}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.rut_empresa ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="50.000.000-1"
                />
                {errors.rut_empresa && <p className="text-red-500 text-sm mt-1">{errors.rut_empresa}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección del Establecimiento *</label>
                <input
                  type="text"
                  name="direccion_empresa"
                  value={formData.direccion_empresa}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.direccion_empresa ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Dirección completa donde los clientes pueden encontrarte"
                />
                {errors.direccion_empresa && <p className="text-red-500 text-sm mt-1">{errors.direccion_empresa}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Región *</label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona una región</option>
                  {regionesDisponibles.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comuna *</label>
                <select
                  name="comuna"
                  value={formData.comuna}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.region}
                >
                  <option value="">{formData.region ? 'Selecciona una comuna' : 'Selecciona primero una región'}</option>
                  {comunasDisponibles.map(comuna => (
                    <option key={comuna} value={comuna}>{comuna}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono de la Empresa *</label>
                <input
                  type="tel"
                  name="telefono_empresa"
                  value={formData.telefono_empresa}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.telefono_empresa ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+56 2 1234 5678"
                />
                {errors.telefono_empresa && <p className="text-red-500 text-sm mt-1">{errors.telefono_empresa}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email de la Empresa *</label>
                <input
                  type="email"
                  name="email_empresa"
                  value={formData.email_empresa}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email_empresa ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="contacto@tuempresa.com"
                />
                {errors.email_empresa && <p className="text-red-500 text-sm mt-1">{errors.email_empresa}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Página Web (Opcional)</label>
                <input
                  type="url"
                  name="web_actual"
                  value={formData.web_actual}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.tuempresa.com (si tienes una)"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Si no tienes página web, ¡no te preocupes! Te ayudamos a crear una en los siguientes pasos.
                </p>
              </div>

              {/* Logo de la empresa */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo de la Empresa (opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFile}
                  className="block w-full md:w-auto text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {logoPreview && (
                  <div className="mt-3 flex items-center gap-4">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-24 h-24 object-contain border rounded-lg bg-white shadow"
                    />
                    <button
                      type="button"
                      onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Quitar logo
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Puedes subir un logo en formato PNG, JPG o SVG.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rubro Específico *</label>
                <select
                  name="rubro"
                  value={formData.rubro}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.rubro ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona tu rubro específico</option>
                  {rubrosDisponibles.map(rubro => (
                    <option key={rubro} value={rubro}>{rubro}</option>
                  ))}
                </select>
                {errors.rubro && <p className="text-red-500 text-sm mt-1">{errors.rubro}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Empresa</label>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="tipoEmpresa"
                      value="proveedor"
                      checked={formData.tipoEmpresa === 'proveedor'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      Proveedor
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="tipoEmpresa"
                      value="pyme"
                      checked={formData.tipoEmpresa === 'pyme'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      PyME
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="tipoEmpresa"
                      value="emprendimiento"
                      checked={formData.tipoEmpresa === 'emprendimiento'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      Emprendimiento
                    </label>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Este campo se preselecciona según la forma en que accediste al formulario.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Paso 2: Información del Representante */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Información del Representante</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombres del Representante *</label>
                <input
                  type="text"
                  name="nombres_representante"
                  value={formData.nombres_representante}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nombres_representante ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Nombres del propietario o gerente"
                />
                {errors.nombres_representante && <p className="text-red-500 text-sm mt-1">{errors.nombres_representante}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos del Representante *</label>
                <input
                  type="text"
                  name="apellidos_representante"
                  value={formData.apellidos_representante}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.apellidos_representante ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Apellidos del propietario o gerente"
                />
                {errors.apellidos_representante && <p className="text-red-500 text-sm mt-1">{errors.apellidos_representante}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RUT del Representante *</label>
                <input
                  type="text"
                  name="rut_representante"
                  value={formData.rut_representante}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.rut_representante ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="12.345.678-9"
                />
                {errors.rut_representante && <p className="text-red-500 text-sm mt-1">{errors.rut_representante}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cargo del Representante</label>
                <input
                  type="text"
                  name="cargo_representante"
                  value={formData.cargo_representante}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  placeholder="Ej: Gerente, Dueño, Administrador"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email del Representante *</label>
                <input
                  type="email"
                  name="email_representante"
                  value={formData.email_representante}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email_representante ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="email@representante.com"
                />
                {errors.email_representante && <p className="text-red-500 text-sm mt-1">{errors.email_representante}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono del Representante</label>
                <input
                  type="tel"
                  name="telefono_representante"
                  value={formData.telefono_representante}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.telefono_representante ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="+56 9 123456789"
                  maxLength={12}
                />
                <p className="text-xs text-gray-500 mt-1">Ejemplo: +56912345678</p>
                {errors.telefono_representante && <p className="text-red-500 text-sm mt-1">{errors.telefono_representante}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento del Representante *</label>
                <input
                  type="date"
                  name="fecha_nacimiento_representante"
                  value={formData.fecha_nacimiento_representante || ''}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fecha_nacimiento_representante ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="dd/mm/aaaa"
                />
                {errors.fecha_nacimiento_representante && <p className="text-red-500 text-sm mt-1">{errors.fecha_nacimiento_representante}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Paso 3: Información del Negocio */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Información del Negocio</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción del Negocio *</label>
                <textarea
                  name="descripcion_negocio"
                  value={formData.descripcion_negocio}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.descripcion_negocio ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Describe brevemente tu negocio, servicios, experiencia, etc."
                  rows={4}
                />
                {errors.descripcion_negocio && <p className="text-red-500 text-sm mt-1">{errors.descripcion_negocio}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Años de Funcionamiento *</label>
                <select
                  name="anos_funcionamiento"
                  value={formData.anos_funcionamiento}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.anos_funcionamiento ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="0-1">0 a 1 año</option>
                  <option value="1-3">1 a 3 años</option>
                  <option value="3-5">3 a 5 años</option>
                  <option value="5-10">5 a 10 años</option>
                  <option value="10-20">10 a 20 años</option>
                  <option value=">20">Más de 20 años</option>
                </select>
                {errors.anos_funcionamiento && <p className="text-red-500 text-sm mt-1">{errors.anos_funcionamiento}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de Empleados</label>
                <select
                  name="numero_empleados"
                  value={formData.numero_empleados}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                >
                  <option value="">Selecciona una opción</option>
                  <option value="1-5">1 a 5</option>
                  <option value="6-10">6 a 10</option>
                  <option value="11-20">11 a 20</option>
                  <option value="21-50">21 a 50</option>
                  <option value="51-100">51 a 100</option>
                  <option value=">100">Más de 100</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Horario de Atención *</label>
                <div className="overflow-x-auto">
                  <table className="min-w-full border rounded-lg bg-white">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">Día</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">Activo</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">Hora Inicio</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">Hora Fin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 'lunes', label: 'Lunes' },
                        { key: 'martes', label: 'Martes' },
                        { key: 'miercoles', label: 'Miércoles' },
                        { key: 'jueves', label: 'Jueves' },
                        { key: 'viernes', label: 'Viernes' },
                        { key: 'sabado', label: 'Sábado' },
                        { key: 'domingo', label: 'Domingo' },
                      ].map(({ key, label }) => (
                        <tr key={key} className="border-t">
                          <td className="px-2 py-2 text-sm text-gray-700">{label}</td>
                          <td className="px-2 py-2">
                            <input
                              type="checkbox"
                              checked={formData.horarios?.[key]?.activo || false}
                              onChange={e => {
                                setFormData(prev => ({
                                  ...prev,
                                  horarios: {
                                    ...prev.horarios,
                                    [key]: {
                                      ...prev.horarios?.[key],
                                      activo: e.target.checked
                                    }
                                  }
                                }));
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="time"
                              value={formData.horarios?.[key]?.inicio || ''}
                              disabled={!formData.horarios?.[key]?.activo}
                              onChange={e => {
                                setFormData(prev => ({
                                  ...prev,
                                  horarios: {
                                    ...prev.horarios,
                                    [key]: {
                                      ...prev.horarios?.[key],
                                      inicio: e.target.value
                                    }
                                  }
                                }));
                              }}
                              className="w-28 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="time"
                              value={formData.horarios?.[key]?.fin || ''}
                              disabled={!formData.horarios?.[key]?.activo}
                              onChange={e => {
                                setFormData(prev => ({
                                  ...prev,
                                  horarios: {
                                    ...prev.horarios,
                                    [key]: {
                                      ...prev.horarios?.[key],
                                      fin: e.target.value
                                    }
                                  }
                                }));
                              }}
                              className="w-28 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-2">Activa los días y selecciona el horario de atención para cada uno.</p>
                {errors.horario_atencion && <p className="text-red-500 text-sm mt-1">{errors.horario_atencion}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Categorías de Servicios que Ofreces *</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {categoriasDisponibles.map(cat => (
                    <span
                      key={cat}
                      className={`px-3 py-2 rounded-full border text-sm cursor-pointer select-none transition-colors shadow-sm ${formData.categorias_servicios.includes(cat) ? 'bg-blue-600 text-white border-blue-600 font-semibold' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          categorias_servicios: prev.categorias_servicios.includes(cat)
                            ? prev.categorias_servicios.filter(c => c !== cat)
                            : [...prev.categorias_servicios, cat]
                        }));
                        if (errors.categorias_servicios) setErrors(prev => ({ ...prev, categorias_servicios: '' }));
                      }}
                    >
                      {formData.categorias_servicios.includes(cat) ? '✓ ' : '+ '}{cat}
                    </span>
                  ))}
                </div>
                {errors.categorias_servicios && <p className="text-red-500 text-sm mt-1">{errors.categorias_servicios}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Marcas de Vehículos que Atiendes *</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {marcasDisponibles.map(marca => (
                    <span
                      key={marca}
                      className={`px-3 py-2 rounded-full border text-sm cursor-pointer select-none transition-colors shadow-sm ${formData.marcas_vehiculos.includes(marca) ? 'bg-green-600 text-white border-green-600 font-semibold' : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'}`}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          marcas_vehiculos: prev.marcas_vehiculos.includes(marca)
                            ? prev.marcas_vehiculos.filter(m => m !== marca)
                            : [...prev.marcas_vehiculos, marca]
                        }));
                        if (errors.marcas_vehiculos) setErrors(prev => ({ ...prev, marcas_vehiculos: '' }));
                      }}
                    >
                      {formData.marcas_vehiculos.includes(marca) ? '✓ ' : '+ '}{marca}
                    </span>
                  ))}
                </div>
                {errors.marcas_vehiculos && <p className="text-red-500 text-sm mt-1">{errors.marcas_vehiculos}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Paso 4: Servicios Web */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">¿Necesitas una Página Web?</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">🌐 ¡Te ayudamos a tener presencia digital!</h3>
              <p className="text-blue-800 mb-4">
                Si no tienes página web o quieres mejorar la que tienes, ofrecemos servicios completos de desarrollo web
                especializados para empresas del sector automotriz.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
                <div>
                  <p>✅ Diseño profesional y moderno</p>
                  <p>✅ Optimizado para móviles</p>
                  <p>✅ Integración con redes sociales</p>
                </div>
                <div>
                  <p>✅ SEO para aparecer en Google</p>
                  <p>✅ Sistema de citas online</p>
                  <p>✅ Hosting y dominio incluidos</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="necesita_pagina_web"
                  checked={formData.necesita_pagina_web}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-lg font-medium text-gray-700">
                  Sí, quiero que me ayuden con una página web
                </label>
              </div>

              {formData.necesita_pagina_web && (
                <div className="space-y-4 ml-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Elige el plan que mejor se adapte a tu negocio:</h3>
                  
                  <div className="grid gap-6">
                    {opcionesPaginaWeb.map(opcion => (
                      <div key={opcion.tipo} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="tipo_pagina_web"
                            value={opcion.tipo}
                            checked={formData.tipo_pagina_web === opcion.tipo}
                            onChange={handleInputChange}
                            className="mt-1 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{opcion.nombre}</h4>
                              <span className="text-2xl font-bold text-blue-600">{opcion.precio}</span>
                            </div>
                            <p className="text-gray-600 mb-3">{opcion.descripcion}</p>
                            <div className="grid md:grid-cols-2 gap-1">
                              {opcion.incluye.map((item, index) => (
                                <p key={index} className="text-sm text-gray-700">✓ {item}</p>
                              ))}
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.tipo_pagina_web && <p className="text-red-500 text-sm mt-1">{errors.tipo_pagina_web}</p>}
                </div>
              )}

              {/* Redes Sociales */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="tiene_redes_sociales"
                    checked={formData.tiene_redes_sociales}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-lg font-medium text-gray-700">
                    Tengo redes sociales para mi negocio
                  </label>
                </div>

                {formData.tiene_redes_sociales && (
                  <div className="ml-6 grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                      <input
                        type="url"
                        name="redes_sociales.facebook"
                        value={formData.redes_sociales.facebook}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://facebook.com/tu-negocio"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                      <input
                        type="url"
                        name="redes_sociales.instagram"
                        value={formData.redes_sociales.instagram}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://instagram.com/tu-negocio"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Business</label>
                      <input
                        type="tel"
                        name="redes_sociales.whatsapp"
                        value={formData.redes_sociales.whatsapp}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+56 9 1234 5678"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">TikTok</label>
                      <input
                        type="url"
                        name="redes_sociales.tiktok"
                        value={formData.redes_sociales.tiktok}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://tiktok.com/@tu-negocio"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Paso 5: Credenciales y Confirmación */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Credenciales y Confirmación</h2>
            
            {/* Configurar contraseña para cuenta futura */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Configura tu contraseña</h3>
              <p className="text-sm text-blue-800">
                Esta contraseña se usará para crear tu cuenta de proveedor una vez que tu solicitud sea aprobada.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Mínimo 6 caracteres"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña *</label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.confirm_password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Repite tu contraseña"
                />
                {errors.confirm_password && <p className="text-red-500 text-sm mt-1">{errors.confirm_password}</p>}
              </div>
            </div>

            {/* Resumen de información */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4">Resumen de tu solicitud:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Empresa:</span> {formData.nombre_empresa}</p>
                  <p><span className="font-medium">RUT:</span> {formData.rut_empresa}</p>
                  <p><span className="font-medium">Representante:</span> {formData.nombres_representante} {formData.apellidos_representante}</p>
                  <p><span className="font-medium">Fecha Nacimiento:</span> {formData.fecha_nacimiento_representante}</p>
                  <p><span className="font-medium">Email empresa:</span> {formData.email_empresa}</p>
                  <p><span className="font-medium">Teléfono:</span> {formData.telefono_empresa}</p>
                </div>
                <div>
                  <p><span className="font-medium">Dirección:</span> {formData.direccion_empresa}</p>
                  <p><span className="font-medium">Comuna:</span> {formData.comuna}</p>
                  <p><span className="font-medium">Región:</span> {formData.region}</p>
                  <p><span className="font-medium">Servicios:</span> {formData.categorias_servicios.length} categorías</p>
                  {formData.necesita_pagina_web && (
                    <p><span className="font-medium">Página web:</span> {formData.tipo_pagina_web}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Términos y condiciones */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="acepta_terminos"
                  checked={formData.acepta_terminos}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">
                  Acepto los <a href="/terminos" target="_blank" className="text-blue-600 hover:underline">términos y condiciones</a> para proveedores de AV10 de Julio *
                </label>
              </div>
              {errors.acepta_terminos && <p className="text-red-500 text-sm">{errors.acepta_terminos}</p>}

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="acepta_notificaciones"
                  checked={formData.acepta_notificaciones}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">
                  Acepto recibir notificaciones sobre nuevos clientes, promociones y novedades de la plataforma
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="acepta_visita_campo"
                  checked={formData.acepta_visita_campo}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">
                  Acepto que un agente de campo visite mi establecimiento para verificar la información (requerido para aprobar la solicitud)
                </label>
              </div>
            </div>

            {/* Información del proceso */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">¿Qué sigue después?</h4>
              <div className="text-sm text-green-800 space-y-1">
                <p>1. Recibirás un email de confirmación inmediatamente</p>
                <p>2. Revisaremos tu solicitud en 48-72 horas</p>
                <p>3. Te contactaremos para coordinar la visita de verificación</p>
                <p>4. Un agente visitará tu establecimiento para validar la información</p>
                {formData.necesita_pagina_web && (
                  <p>5. Te enviaremos el presupuesto detallado para tu página web</p>
                )}
                <p>{formData.necesita_pagina_web ? '6' : '5'}. Una vez aprobado, activaremos tu cuenta de proveedor</p>
              </div>
            </div>
          </div>
        )}

        {/* Navegación */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
            >
              ← Anterior
            </button>
          )}
          <div className="flex-1"></div>
          
          {/* Indicador de progreso */}
          <div className="flex-1 flex justify-center items-center">
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map(step => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="ml-3 text-sm text-gray-600">
              Paso {currentStep} de 5
            </span>
          </div>

          <div className="flex-1 flex justify-end">
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Siguiente →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando Solicitud...' : '🏪 Enviar Solicitud'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default function RegistroProveedor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [perfilProveedor, setPerfilProveedor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar si el usuario ya tiene un perfil de proveedor o solicitud
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Verificar perfil existente
        const perfilQuery = query(
          collection(db, 'empresas'),
          where('uid', '==', user.uid)
        );
        const perfilSnapshot = await getDocs(perfilQuery);
        
        if (!perfilSnapshot.empty) {
          setPerfilProveedor(perfilSnapshot.docs[0].data());
          setLoading(false);
          return;
        }

        // Verificar solicitud pendiente
        const solicitudQuery = query(
          collection(db, 'solicitudes_empresa'),
          where('email_empresa', '==', user.email)
        );
        const solicitudSnapshot = await getDocs(solicitudQuery);
        
        if (!solicitudSnapshot.empty) {
          const solicitudData = solicitudSnapshot.docs[0].data();
          setPerfilProveedor({ ...solicitudData, tipo: 'solicitud_pendiente' });
        }
      } catch (error) {
        console.error('Error checking existing profile:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingProfile();
  }, [user]);

  if (!user) {
    // Usuario no autenticado - mostrar formulario de registro sin auth
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto">
          <RegistroProveedorSinAuth />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando información del proveedor...</p>
        </div>
      </div>
    );
  }

  if (perfilProveedor) {
    if (perfilProveedor.tipo === 'solicitud_pendiente') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Solicitud en Proceso
            </h2>
            <p className="text-gray-600 mb-4">
              Ya tienes una solicitud de proveedor en proceso de revisión. 
              Te contactaremos pronto con el estado de tu solicitud.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Estado: <span className="font-medium">{perfilProveedor.estado}</span></p>
              <p>Etapa: <span className="font-medium">{perfilProveedor.etapa_actual}</span></p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Ya eres un Proveedor!
            </h2>
            <p className="text-gray-600 mb-4">
              Tu empresa <strong>{perfilProveedor.nombre}</strong> ya está registrada como proveedor en nuestra plataforma.<br />
              <span className="block mt-2">Fecha de nacimiento del representante: <strong>{perfilProveedor.fecha_nacimiento_representante || perfilProveedor.fechaNacimiento || 'No disponible'}</strong></span>
            </p>
            <button
              onClick={() => navigate('/dashboard/proveedor')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  // Usuario autenticado pero sin perfil - mostrar formulario normal
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto">
        <RegistroProveedorSinAuth />
      </div>
    </div>
  );
}