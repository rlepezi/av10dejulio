// Constantes centralizadas para evitar strings hardcodeados

export const FIREBASE_COLLECTIONS = {
  USUARIOS: 'usuarios',
  EMPRESAS: 'empresas',
  SOLICITUDES_EMPRESA: 'solicitudes_empresa',
  SOLICITUDES_CLIENTE: 'solicitudes_cliente',
  PRODUCTOS: 'productos',
  CAMPANAS: 'campañas',
  AGENTES: 'agentes',
  VEHICULOS: 'vehiculos',
  RECORDATORIOS: 'recordatorios',
  NOTIFICACIONES: 'notificaciones',
  RESEÑAS: 'reseñas',
  MARCAS: 'marcas',
  AUDIT_LOGS: 'audit_logs',
  COMPANIAS_SEGUROS: 'companias_seguros',
  CENTROS_REVISION: 'centros_revision',
  VULCANIZADORAS: 'vulcanizadoras',
  TIPOS_SEGUROS: 'tipos_seguros',
  PUSH_TOKENS: 'push_tokens'
};

export const USER_ROLES = {
  ADMIN: 'admin',
  AGENTE: 'agente',
  PROVEEDOR: 'proveedor',
  CLIENTE: 'cliente',
  MECANICO: 'mecanico'
};

export const ESTADOS = {
  ACTIVO: 'activo',
  ACTIVA: 'Activa',
  INACTIVO: 'inactivo',
  PENDIENTE: 'pendiente',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
  VALIDADO: 'validado',
  EN_REVISION: 'en_revision'
};

export const TIPOS_EMPRESA = {
  EMPRENDIMIENTO: 'emprendimiento',
  PYME: 'pyme',
  EMPRESA: 'empresa',
  LOCAL: 'local'
};

export const ETAPAS_VALIDACION = {
  INICIAL: 'inicial',
  DOCUMENTOS: 'documentos',
  VISITA: 'visita',
  FINAL: 'final'
};

export const TIPOS_NOTIFICACION = {
  INFO: 'info',
  WARNING: 'warning',
  SUCCESS: 'success',
  ERROR: 'error',
  VALIDACION: 'validacion',
  RECORDATORIO: 'recordatorio',
  PROMOCION: 'promocion'
};

export const LOCAL_STORAGE_KEYS = {
  NOTIFICATIONS_ENABLED: (userId) => `notifications_${userId}`,
  LAST_SERVICE_INIT: 'lastServiceInit',
  USER_PREFERENCES: (userId) => `preferences_${userId}`,
  THEME: 'theme'
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  AGENTE: '/agente',
  REGISTRO_CLIENTE: '/registro-cliente',
  REGISTRO_PROVEEDOR: '/registro-proveedor',
  REGISTRO_AGENTE: '/registro-agente',
  SOLICITUD_COMUNIDAD: '/solicitud-comunidad',
  PROVEEDORES: '/proveedores',
  PROVEEDORES_LOCALES: '/proveedores-locales',
  PYMES_LOCALES: '/pymes-locales'
};

export const API_ENDPOINTS = {
  EXTRACT_LOGO: '/api/extract-logo',
  VALIDATE_WEBSITE: '/api/validate-website'
};

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+56|56)?[2-9]\d{8}$/,
  RUT: /^(\d{1,2}\.\d{3}\.\d{3}-[\dkK]|\d{7,8}-[\dkK])$/
};

export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es obligatorio',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Teléfono inválido',
  INVALID_RUT: 'RUT inválido',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 6 caracteres',
  PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
  GENERIC_ERROR: 'Ha ocurrido un error. Intenta nuevamente.'
};
