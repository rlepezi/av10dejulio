// Sistema de Membresías AV 10 de Julio
// Basado en el documento del proyecto

export const MEMBERSHIP_PLANS = {
  FREE: {
    id: 'free',
    name: 'Plan Gratuito',
    price: 0,
    currency: 'CLP',
    description: 'Perfil público básico para empresas validadas',
    features: [
      'Perfil público en la plataforma',
      'Hasta 5 productos activos',
      'Hasta 2 campañas mensuales',
      'Métricas básicas de visitas',
      'Sello de empresa validada AV 10 de Julio',
      'Soporte por email'
    ],
    limitations: {
      maxProducts: 5,
      maxCampaigns: 2,
      maxCampaignsPerMonth: 2,
      analyticsLevel: 'basic',
      supportLevel: 'email',
      customBranding: false,
      advancedCampaigns: false,
      prioritySupport: false,
      advisorAccess: false,
      eventAccess: false,
      discountServices: false
    },
    color: 'gray',
    popular: false
  },
  
  PREMIUM: {
    id: 'premium',
    name: 'Plan Premium',
    price: 29990,
    currency: 'CLP',
    description: 'Herramientas avanzadas para crecimiento empresarial',
    features: [
      'Perfil destacado en la plataforma',
      'Productos y campañas ilimitadas',
      'Campañas avanzadas (segmentadas, automatizadas)',
      'Métricas avanzadas y reportes personalizados',
      'Asesoría mensual con especialista',
      'Participación en campañas masivas',
      'Acceso a capacitaciones y eventos',
      'Soporte prioritario',
      'Descuentos en servicios extra (branding, herramientas)',
      'Sello de calidad premium',
      'Analytics avanzados por marca/modelo'
    ],
    limitations: {
      maxProducts: -1, // Ilimitado
      maxCampaigns: -1, // Ilimitado
      maxCampaignsPerMonth: -1, // Ilimitado
      analyticsLevel: 'advanced',
      supportLevel: 'priority',
      customBranding: true,
      advancedCampaigns: true,
      prioritySupport: true,
      advisorAccess: true,
      eventAccess: true,
      discountServices: true
    },
    color: 'blue',
    popular: true
  },
  
  CORPORATE: {
    id: 'corporate',
    name: 'Plan Marca/Corporativo',
    price: 59990,
    currency: 'CLP',
    description: 'Solución completa para franquicias y grandes empresas',
    features: [
      'Todo del plan Premium',
      'Reportes por marca/modelo específicos',
      'Integraciones avanzadas con sistemas existentes',
      'Condiciones especiales para franquicias/sucursales',
      'API de integración',
      'Dashboard multi-empresa',
      'Gestión centralizada de campañas',
      'Soporte dedicado 24/7',
      'Capacitaciones personalizadas',
      'Eventos exclusivos corporativos',
      'Descuentos especiales en servicios premium'
    ],
    limitations: {
      maxProducts: -1, // Ilimitado
      maxCampaigns: -1, // Ilimitado
      maxCampaignsPerMonth: -1, // Ilimitado
      analyticsLevel: 'enterprise',
      supportLevel: 'dedicated',
      customBranding: true,
      advancedCampaigns: true,
      prioritySupport: true,
      advisorAccess: true,
      eventAccess: true,
      discountServices: true,
      apiAccess: true,
      multiCompany: true,
      centralManagement: true
    },
    color: 'purple',
    popular: false
  }
};

export const CLIENT_MEMBERSHIP_PLANS = {
  BASIC: {
    id: 'basic',
    name: 'Plan Básico',
    price: 0,
    currency: 'CLP',
    description: 'Perfil básico con promociones generales',
    features: [
      'Perfil de cliente y vehículo',
      'Promociones generales del sector',
      'Acceso a empresas validadas',
      'Historial básico de servicios',
      'Notificaciones por email'
    ],
    limitations: {
      personalizedPromos: false,
      autoReminders: false,
      exclusiveEvents: false,
      advisorAccess: false,
      specialDiscounts: false
    }
  },
  
  PREMIUM: {
    id: 'premium',
    name: 'Plan Premium',
    price: 4990,
    currency: 'CLP',
    description: 'Experiencia personalizada y exclusiva',
    features: [
      'Promociones personalizadas según vehículo',
      'Recordatorios automáticos de mantenimiento',
      'Eventos exclusivos para clientes premium',
      'Asesoría personalizada',
      'Descuentos especiales en servicios',
      'Notificaciones push',
      'Acceso prioritario a nuevas funciones',
      'Historial completo de servicios'
    ],
    limitations: {
      personalizedPromos: true,
      autoReminders: true,
      exclusiveEvents: true,
      advisorAccess: true,
      specialDiscounts: true
    }
  }
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'activa',
  EXPIRED: 'expirada',
  CANCELLED: 'cancelada',
  PENDING: 'pendiente',
  TRIAL: 'en_prueba'
};

export const BILLING_CYCLES = {
  MONTHLY: 'mensual',
  YEARLY: 'anual',
  QUARTERLY: 'trimestral'
};

export const METRICS_TYPES = {
  BASIC: 'basic',
  ADVANCED: 'advanced',
  ENTERPRISE: 'enterprise'
};

export const SUPPORT_LEVELS = {
  EMAIL: 'email',
  PRIORITY: 'priority',
  DEDICATED: 'dedicated'
};

// Funciones de utilidad
export const getPlanById = (planId) => {
  return MEMBERSHIP_PLANS[planId.toUpperCase()] || MEMBERSHIP_PLANS.FREE;
};

export const getClientPlanById = (planId) => {
  return CLIENT_MEMBERSHIP_PLANS[planId.toUpperCase()] || CLIENT_MEMBERSHIP_PLANS.BASIC;
};

export const canUpgrade = (currentPlan, targetPlan) => {
  const plans = Object.values(MEMBERSHIP_PLANS);
  const currentIndex = plans.findIndex(p => p.id === currentPlan);
  const targetIndex = plans.findIndex(p => p.id === targetPlan);
  return targetIndex > currentIndex;
};

export const getPlanLimits = (planId) => {
  const plan = getPlanById(planId);
  return plan.limitations;
};

export const formatPrice = (price, currency = 'CLP') => {
  if (price === 0) return 'Gratis';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency
  }).format(price);
};

export const getPlanColor = (planId) => {
  const plan = getPlanById(planId);
  return plan.color;
};

export const isPopularPlan = (planId) => {
  const plan = getPlanById(planId);
  return plan.popular;
};
