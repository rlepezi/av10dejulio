// ESTÁNDARES UNIFICADOS PARA EMPRESAS Y SOLICITUDES
// Archivo: src/utils/empresaStandards.js

// ========================================
// ESTADOS ESTÁNDAR UNIFICADOS
// ========================================

export const ESTADOS_EMPRESA = {
  // ESTADOS INICIALES (Catastro masivo)
  CATALOGADA: 'catalogada',           // Empresa del catastro inicial (200+ empresas)
  INGRESADA: 'ingresada',             // Empresa ingresada manualmente por admin
  PENDIENTE_VALIDACION: 'pendiente_validacion', // Asignada a agente para validación
  
  // ESTADOS DE VALIDACIÓN
  EN_VISITA: 'en_visita',             // Agente programó visita
  VALIDADA: 'validada',               // Agente validó en terreno
  RECHAZADA: 'rechazada',             // No cumple requisitos
  
  // ESTADOS OPERATIVOS
  ACTIVA: 'activa',                   // Visible en home y operativa
  SUSPENDIDA: 'suspendida',           // Temporalmente desactivada
  INACTIVA: 'inactiva'                // Permanentemente desactivada
};

export const ESTADOS_SOLICITUD = {
  PENDIENTE: 'pendiente',             // Solicitud nueva de proveedor
  EN_REVISION: 'en_revision',         // Bajo revisión administrativa
  APROBADA: 'aprobada',               // Aprobada para validación por agente
  RECHAZADA: 'rechazada'              // Rechazada administrativamente
};

// ========================================
// FLUJO DE VIDA COMPLETO DE EMPRESA
// ========================================

export const FLUJO_EMPRESA = {
  // FLUJO 1: CATÁSTRO INICIAL (Admin)
  CATALOGADA: {
    descripcion: 'Empresa del catastro inicial (200+ empresas)',
    visible_en_home: false,
    puede_gestionar: false,
    proximo_paso: 'Asignar a agente para validación',
    transiciones: ['pendiente_validacion']
  },
  
  // FLUJO 1.5: EMPRESAS INGRESADAS MANUALMENTE (Admin)
  INGRESADA: {
    descripcion: 'Empresa ingresada manualmente por administrador',
    visible_en_home: false,
    puede_gestionar: false,
    proximo_paso: 'Admin puede activar directamente o asignar a agente',
    transiciones: ['activa', 'pendiente_validacion', 'rechazada']
  },
  
  // FLUJO 2: VALIDACIÓN POR AGENTE
  PENDIENTE_VALIDACION: {
    descripcion: 'Asignada a agente para validación en terreno',
    visible_en_home: false,
    puede_gestionar: false,
    proximo_paso: 'Agente programa visita',
    transiciones: ['en_visita', 'rechazada']
  },
  
  EN_VISITA: {
    descripcion: 'Agente programó visita de validación',
    visible_en_home: false,
    puede_gestionar: false,
    proximo_paso: 'Agente valida en terreno',
    transiciones: ['validada', 'rechazada']
  },
  
  VALIDADA: {
    descripcion: 'Agente validó empresa en terreno',
    visible_en_home: true,
    puede_gestionar: false,
    proximo_paso: 'Admin activa completamente',
    transiciones: ['activa', 'rechazada']
  },
  
  // FLUJO 3: OPERACIÓN
  ACTIVA: {
    descripcion: 'Empresa visible y operativa en el sistema',
    visible_en_home: true,
    puede_gestionar: true,
    proximo_paso: 'Operación normal',
    transiciones: ['suspendida', 'inactiva']
  },
  
  SUSPENDIDA: {
    descripcion: 'Temporalmente desactivada por admin',
    visible_en_home: false,
    puede_gestionar: false,
    proximo_paso: 'Reactivar o desactivar permanentemente',
    transiciones: ['activa', 'inactiva']
  },
  
  INACTIVA: {
    descripcion: 'Permanentemente desactivada',
    visible_en_home: false,
    puede_gestionar: false,
    proximo_paso: 'Estado final',
    transiciones: []
  },
  
  RECHAZADA: {
    descripcion: 'No cumple requisitos de validación',
    visible_en_home: false,
    puede_gestionar: false,
    proximo_paso: 'Estado final',
    transiciones: []
  }
};

// ========================================
// FLUJO DE SOLICITUDES NUEVAS
// ========================================

export const FLUJO_SOLICITUD = {
  PENDIENTE: {
    descripcion: 'Solicitud nueva de proveedor',
    proximo_paso: 'Revisión administrativa',
    transiciones: ['en_revision', 'rechazada']
  },
  
  EN_REVISION: {
    descripcion: 'Bajo revisión administrativa',
    proximo_paso: 'Aprobar para validación por agente',
    transiciones: ['aprobada', 'rechazada']
  },
  
  APROBADA: {
    descripcion: 'Aprobada para validación por agente',
    proximo_paso: 'Asignar a agente',
    transiciones: [] // Se convierte en empresa con estado 'pendiente_validacion'
  },
  
  RECHAZADA: {
    descripcion: 'Rechazada administrativamente',
    proximo_paso: 'Estado final',
    transiciones: []
  }
};

// ========================================
// FUNCIONES DE TRANSICIÓN
// ========================================

export const puedeTransicionar = (estadoActual, nuevoEstado, esSolicitud = false) => {
  const flujo = esSolicitud ? FLUJO_SOLICITUD : FLUJO_EMPRESA;
  const estado = flujo[estadoActual];
  return estado?.transiciones?.includes(nuevoEstado) || false;
};

export const obtenerSiguientesEstados = (estadoActual, esSolicitud = false) => {
  const flujo = esSolicitud ? FLUJO_SOLICITUD : FLUJO_EMPRESA;
  return flujo[estadoActual]?.transiciones || [];
};

export const obtenerDescripcionEstado = (estado, esSolicitud = false) => {
  const flujo = esSolicitud ? FLUJO_SOLICITUD : FLUJO_EMPRESA;
  return flujo[estado]?.descripcion || 'Estado desconocido';
};

// ========================================
// CAMPOS ESTÁNDAR (SNAKE_CASE)
// ========================================

export const CAMPOS_EMPRESA = {
  // Información básica
  NOMBRE: 'nombre_empresa',
  EMAIL: 'email_empresa',
  TELEFONO: 'telefono_empresa', 
  RUT: 'rut_empresa',
  DIRECCION: 'direccion_empresa',
  WEB: 'web_empresa',
  COMUNA: 'comuna',
  REGION: 'region',
  CATEGORIA: 'categoria',
  DESCRIPCION: 'descripcion_empresa',
  
  // Información adicional
  ANOS_FUNCIONAMIENTO: 'anos_funcionamiento',
  LOGO_URL: 'logo_url',
  
  // Redes sociales
  REDES_SOCIALES: 'redes_sociales'
};

export const CAMPOS_REPRESENTANTE = {
  NOMBRES: 'nombres_representante',
  APELLIDOS: 'apellidos_representante', 
  EMAIL: 'email_representante',
  TELEFONO: 'telefono_representante',
  CARGO: 'cargo_representante'
};

export const CAMPOS_FECHA = {
  REGISTRO: 'fecha_registro',
  ACTIVACION: 'fecha_activacion',
  ACTUALIZACION: 'fecha_actualizacion', 
  SUSPENSION: 'fecha_suspension',
  RECHAZO: 'fecha_rechazo',
  VALIDACION: 'fecha_validacion',
  VISITA: 'fecha_visita'
};

// ========================================
// FUNCIONES DE NORMALIZACIÓN
// ========================================

/**
 * Normaliza datos de empresa a formato estándar
 * Maneja diferentes variantes de nombres de campos
 */
export const normalizeEmpresaData = (data) => {
  const normalized = {};
  
  // Información básica de empresa
  normalized[CAMPOS_EMPRESA.NOMBRE] = data.nombre_empresa || data.nombreEmpresa || data.nombre || '';
  normalized[CAMPOS_EMPRESA.EMAIL] = data.email_empresa || data.emailEmpresa || data.email || '';
  normalized[CAMPOS_EMPRESA.TELEFONO] = data.telefono_empresa || data.telefonoEmpresa || data.telefono || '';
  normalized[CAMPOS_EMPRESA.RUT] = data.rut_empresa || data.rutEmpresa || data.rut || '';
  normalized[CAMPOS_EMPRESA.DIRECCION] = data.direccion_empresa || data.direccionEmpresa || data.direccion || '';
  normalized[CAMPOS_EMPRESA.WEB] = data.web_empresa || data.web_actual || data.web || '';
  normalized[CAMPOS_EMPRESA.COMUNA] = data.comuna || '';
  normalized[CAMPOS_EMPRESA.REGION] = data.region || '';
  normalized[CAMPOS_EMPRESA.CATEGORIA] = data.categoria || 'Sin categoría';
  normalized[CAMPOS_EMPRESA.DESCRIPCION] = data.descripcion_empresa || data.descripcion || '';
  
  // Información adicional
  normalized[CAMPOS_EMPRESA.ANOS_FUNCIONAMIENTO] = data.anos_funcionamiento || '';
  normalized[CAMPOS_EMPRESA.LOGO_URL] = data.logo_url || '';
  normalized[CAMPOS_EMPRESA.REDES_SOCIALES] = data.redes_sociales || {
    facebook: '',
    instagram: '', 
    linkedin: '',
    twitter: ''
  };
  
  // Representante - normalizar diferentes variantes
  normalized.representante = {
    [CAMPOS_REPRESENTANTE.NOMBRES]: data.nombres_representante || data.representante_nombre || '',
    [CAMPOS_REPRESENTANTE.APELLIDOS]: data.apellidos_representante || data.representante_apellidos || '',
    [CAMPOS_REPRESENTANTE.EMAIL]: data.email_representante || data.representante_email || '',
    [CAMPOS_REPRESENTANTE.TELEFONO]: data.telefono_representante || data.representante_telefono || '',
    [CAMPOS_REPRESENTANTE.CARGO]: data.cargo_representante || data.representante_cargo || ''
  };
  
  // Fechas - normalizar diferentes variantes
  normalized[CAMPOS_FECHA.REGISTRO] = data.fecha_registro || data.fechaRegistro || data.fechaCreacion || new Date();
  normalized[CAMPOS_FECHA.ACTIVACION] = data.fecha_activacion || data.fechaActivacion || null;
  normalized[CAMPOS_FECHA.ACTUALIZACION] = data.fecha_actualizacion || data.fechaActualizacion || new Date();
  
  // Estado - normalizar a minúscula y usar estados unificados
  const estadoOriginal = data.estado || 'pendiente';
  normalized.estado = normalizarEstado(estadoOriginal);
  
  return normalized;
};

/**
 * Normaliza estado a formato unificado
 */
export const normalizarEstado = (estado) => {
  const estadoLower = estado.toLowerCase();
  
  // Mapeo de estados antiguos a nuevos
  const mapeoEstados = {
    'enviada': ESTADOS_EMPRESA.CATALOGADA,
    'enviado': ESTADOS_EMPRESA.CATALOGADA,
    'pendiente': ESTADOS_EMPRESA.PENDIENTE_VALIDACION,
    'en revisión': ESTADOS_EMPRESA.PENDIENTE_VALIDACION,
    'en_revision': ESTADOS_EMPRESA.PENDIENTE_VALIDACION,
    'validada': ESTADOS_EMPRESA.VALIDADA,
    'validado': ESTADOS_EMPRESA.VALIDADA,
    'activa': ESTADOS_EMPRESA.ACTIVA,
    'activo': ESTADOS_EMPRESA.ACTIVA,
    'activada': ESTADOS_EMPRESA.ACTIVA,
    'suspendida': ESTADOS_EMPRESA.SUSPENDIDA,
    'inactiva': ESTADOS_EMPRESA.INACTIVA,
    'inactivo': ESTADOS_EMPRESA.INACTIVA,
    'rechazada': ESTADOS_EMPRESA.RECHAZADA,
    'rechazado': ESTADOS_EMPRESA.RECHAZADA
  };
  
  return mapeoEstados[estadoLower] || ESTADOS_EMPRESA.PENDIENTE_VALIDACION;
};

/**
 * Normaliza datos de solicitud a formato estándar
 * Prioriza estructura de colección 'empresas' pero agrega campos de compatibilidad
 */
export const normalizeSolicitudData = (data) => {
  const normalized = normalizeEmpresaData(data);
  
  // Campos específicos de solicitud
  normalized.fecha_solicitud = data.fecha_solicitud || data.fechaSolicitud || new Date();
  normalized.tipo_solicitud = data.tipo_solicitud || 'empresa';
  normalized.agente_creador = data.agente_creador || null;
  normalized.requiere_visita = data.requiere_visita || false;
  
  // ESTRUCTURA PRINCIPAL: Seguir formato de colección 'empresas'
  // Campos principales que deben seguir el formato de 'empresas'
  normalized.nombre = normalized[CAMPOS_EMPRESA.NOMBRE] || '';
  normalized.email = normalized[CAMPOS_EMPRESA.EMAIL] || '';
  normalized.telefono = normalized[CAMPOS_EMPRESA.TELEFONO] || '';
  normalized.direccion = normalized[CAMPOS_EMPRESA.DIRECCION] || '';
  normalized.categoria = normalized[CAMPOS_EMPRESA.CATEGORIA] || 'Sin categoría';
  normalized.descripcion = normalized[CAMPOS_EMPRESA.DESCRIPCION] || '';
  normalized.web = normalized[CAMPOS_EMPRESA.WEB] || '';
  normalized.logo = normalized[CAMPOS_EMPRESA.LOGO_URL] || '';
  
  // Campos adicionales de estructura 'empresas'
  normalized.rubro = normalized.categoria; // rubro = categoria en empresas
  normalized.tipoEmpresa = data.tipoEmpresa || 'proveedor';
  normalized.destacado = data.destacado || false;
  normalized.fechaRegistro = normalized[CAMPOS_FECHA.REGISTRO];
  
  // Campos de redes sociales (formato empresas)
  normalized.instagram = data.instagram || data.redes_sociales?.instagram || '';
  normalized.whatsapp = data.whatsapp || data.telefono || normalized.telefono;
  
  // Campos adicionales que pueden venir de diferentes fuentes
  normalized.servicios = data.servicios || [];
  normalized.galeria = data.galeria || [];
  normalized.imagenLocal = data.imagenLocal || '';
  normalized.contactoAdicional = data.contactoAdicional || {};
  normalized.descripcionCompleta = data.descripcionCompleta || normalized.descripcion;
  
  // CAMPOS DE COMPATIBILIDAD CON ADMIN_ACTIVADOR
  // Estos campos se agregan para compatibilidad pero no prevalecen
  normalized.comuna = normalized[CAMPOS_EMPRESA.COMUNA] || '';
  normalized.region = normalized[CAMPOS_EMPRESA.REGION] || '';
  normalized.etapa_proceso = data.etapa_proceso || 'revision_inicial';
  normalized.fecha_activacion = data.fecha_activacion || null;
  normalized.logoAsignado = !!normalized.logo;
  normalized.webValidada = !!normalized.web;
  normalized.perfilCompleto = data.perfilCompleto || false;
  normalized.tiene_credenciales_asignadas = data.tiene_credenciales_asignadas || false;
  normalized.usuario_empresa = data.usuario_empresa || null;
  normalized.solicitud_origen_id = data.solicitud_origen_id || null;
  
  // REPRESENTANTE: Mantener tanto estructura anidada como campos planos
  if (normalized.representante) {
    // Campos planos para compatibilidad con tabla admin (SOLO para compatibilidad)
    normalized.nombres_representante = normalized.representante[CAMPOS_REPRESENTANTE.NOMBRES] || '';
    normalized.apellidos_representante = normalized.representante[CAMPOS_REPRESENTANTE.APELLIDOS] || '';
    normalized.email_representante = normalized.representante[CAMPOS_REPRESENTANTE.EMAIL] || '';
    normalized.telefono_representante = normalized.representante[CAMPOS_REPRESENTANTE.TELEFONO] || '';
    normalized.cargo_representante = normalized.representante[CAMPOS_REPRESENTANTE.CARGO] || '';
  }
  
  // CAMPOS DE COMPATIBILIDAD CON TABLA ADMIN (no prevalecen en estructura final)
  normalized.web_actual = normalized.web; // Solo para compatibilidad con tabla
  normalized.nombre_empresa = normalized.nombre; // Solo para compatibilidad con tabla
  normalized.email_empresa = normalized.email; // Solo para compatibilidad con tabla
  normalized.telefono_empresa = normalized.telefono; // Solo para compatibilidad con tabla
  normalized.direccion_empresa = normalized.direccion; // Solo para compatibilidad con tabla
  normalized.descripcion_empresa = normalized.descripcion; // Solo para compatibilidad con tabla
  normalized.rut_empresa = normalized.rut || ''; // Solo para compatibilidad con tabla
  
  // Horarios estándar si no existen
  if (!normalized.horarios) {
    normalized.horarios = {
      lunes: { activo: true, inicio: '09:00', fin: '18:00' },
      martes: { activo: true, inicio: '09:00', fin: '18:00' },
      miercoles: { activo: true, inicio: '09:00', fin: '18:00' },
      jueves: { activo: true, inicio: '09:00', fin: '18:00' },
      viernes: { activo: true, inicio: '09:00', fin: '18:00' },
      sabado: { activo: false, inicio: '09:00', fin: '13:00' },
      domingo: { activo: false, inicio: '10:00', fin: '14:00' }
    };
  }
  
  return normalized;
};

/**
 * Valida que los datos de empresa tengan los campos requeridos
 */
export const validateEmpresaData = (data) => {
  const errors = [];
  
  // Campos obligatorios
  if (!data[CAMPOS_EMPRESA.NOMBRE]?.trim()) {
    errors.push('Nombre de empresa es obligatorio');
  }
  
  if (!data[CAMPOS_EMPRESA.EMAIL]?.trim()) {
    errors.push('Email de empresa es obligatorio');
  }
  
  if (!data[CAMPOS_EMPRESA.TELEFONO]?.trim()) {
    errors.push('Teléfono de empresa es obligatorio');
  }
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data[CAMPOS_EMPRESA.EMAIL] && !emailRegex.test(data[CAMPOS_EMPRESA.EMAIL])) {
    errors.push('Email de empresa no es válido');
  }
  
  // Validar representante si está presente
  if (data.representante) {
    if (!data.representante[CAMPOS_REPRESENTANTE.NOMBRES]?.trim()) {
      errors.push('Nombre del representante es obligatorio');
    }
    
    if (data.representante[CAMPOS_REPRESENTANTE.EMAIL] && 
        !emailRegex.test(data.representante[CAMPOS_REPRESENTANTE.EMAIL])) {
      errors.push('Email del representante no es válido');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Crea estructura estándar para nueva empresa
 * Sigue formato de colección 'empresas' con campos adicionales de admin_activador
 */
export const createEmpresaTemplate = (solicitudData = {}) => {
  const normalized = normalizeSolicitudData(solicitudData);
  
  return {
    // ESTRUCTURA PRINCIPAL: Formato colección 'empresas'
    nombre: normalized.nombre,
    email: normalized.email,
    telefono: normalized.telefono,
    direccion: normalized.direccion,
    categoria: normalized.categoria,
    rubro: normalized.categoria, // rubro = categoria en empresas
    descripcion: normalized.descripcion,
    descripcionCompleta: normalized.descripcionCompleta || normalized.descripcion,
    web: normalized.web,
    logo: normalized.logo,
    
    // Campos específicos de empresas
    tipoEmpresa: normalized.tipoEmpresa || 'proveedor',
    destacado: normalized.destacado || false,
    fechaRegistro: new Date(),
    servicios: normalized.servicios || [],
    galeria: normalized.galeria || [],
    imagenLocal: normalized.imagenLocal || '',
    instagram: normalized.instagram || '',
    whatsapp: normalized.whatsapp || normalized.telefono,
    contactoAdicional: normalized.contactoAdicional || {},
    
    // Estado y configuración (compatible con admin_activador)
    estado: ESTADOS_EMPRESA.ACTIVA,
    etapa_proceso: 'activada_sin_credenciales',
    fecha_activacion: new Date(),
    logoAsignado: !!normalized.logo,
    webValidada: !!normalized.web,
    perfilCompleto: false,
    tiene_credenciales_asignadas: false,
    usuario_empresa: null,
    
    // Campos adicionales de admin_activador
    comuna: normalized.comuna || '',
    region: normalized.region || '',
    solicitud_origen_id: normalized.id || null,
    
    // Representante (estructura anidada como en admin_activador)
    representante: normalized.representante || {
      [CAMPOS_REPRESENTANTE.NOMBRES]: '',
      [CAMPOS_REPRESENTANTE.APELLIDOS]: '',
      [CAMPOS_REPRESENTANTE.EMAIL]: '',
      [CAMPOS_REPRESENTANTE.TELEFONO]: '',
      [CAMPOS_REPRESENTANTE.CARGO]: ''
    },
    
    // Horarios estándar
    horarios: normalized.horarios || {
      lunes: { activo: true, inicio: '09:00', fin: '18:00' },
      martes: { activo: true, inicio: '09:00', fin: '18:00' },
      miercoles: { activo: true, inicio: '09:00', fin: '18:00' },
      jueves: { activo: true, inicio: '09:00', fin: '18:00' },
      viernes: { activo: true, inicio: '09:00', fin: '18:00' },
      sabado: { activo: false, inicio: '09:00', fin: '13:00' },
      domingo: { activo: false, inicio: '10:00', fin: '14:00' }
    }
  };
};

/**
 * Crea estructura estándar para nueva solicitud
 */
export const createSolicitudTemplate = (formData = {}, esAgente = false, agenteEmail = null) => {
  const normalized = normalizeSolicitudData(formData);
  
  return {
    ...normalized,
    
    // Estado y metadatos
    estado: ESTADOS_SOLICITUD.PENDIENTE,
    fecha_solicitud: new Date(),
    tipo_solicitud: esAgente ? 'agente' : 'proveedor',
    agente_creador: agenteEmail,
    
    // Configuraciones por defecto
    requiere_visita: !esAgente,
    prioridad: esAgente ? 'alta' : 'normal',
    documentacion_validada: false,
    
    // Campos específicos de agente
    ...(esAgente && {
      validacion_presencial_completada: formData.documentacion_validada || false,
      documento_empresa_verificado: formData.documento_empresa_verificado || false,
      firma_acuerdo_obtenida: formData.firma_acuerdo_obtenida || false,
      direccion_verificada_presencial: formData.direccion_verificada || false
    })
  };
};

// ========================================  
// UTILIDADES DE CONSULTA
// ========================================

/**
 * Obtiene consulta estándar para empresas activas
 */
export const getEmpresasActivasQuery = () => {
  return {
    collection: 'empresas',
    where: [
      ['estado', '==', ESTADOS_EMPRESA.ACTIVA]
    ],
    orderBy: [CAMPOS_FECHA.REGISTRO, 'desc'],
    limit: 50
  };
};

/**
 * Obtiene consulta estándar para solicitudes pendientes
 */
export const getSolicitudesPendientesQuery = () => {
  return {
    collection: 'solicitudes_empresa',
    where: [
      ['estado', 'in', [ESTADOS_SOLICITUD.PENDIENTE, ESTADOS_SOLICITUD.EN_REVISION]]
    ],
    orderBy: ['fecha_solicitud', 'desc']
  };
};

export default {
  ESTADOS_SOLICITUD,
  ESTADOS_EMPRESA,
  FLUJO_EMPRESA,
  FLUJO_SOLICITUD,
  CAMPOS_EMPRESA,
  CAMPOS_REPRESENTANTE,
  CAMPOS_FECHA,
  puedeTransicionar,
  obtenerSiguientesEstados,
  obtenerDescripcionEstado,
  normalizarEstado,
  normalizeEmpresaData,
  normalizeSolicitudData,
  validateEmpresaData,
  createEmpresaTemplate,
  createSolicitudTemplate,
  getEmpresasActivasQuery,
  getSolicitudesPendientesQuery
};
