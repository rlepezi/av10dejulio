import ReactGA from 'react-ga4';

class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';
  }

  // Inicializar Google Analytics
  initialize() {
    if (this.isInitialized) return;

    try {
      ReactGA.initialize(this.measurementId, {
        gtagOptions: {
          send_page_view: false // Deshabilitar envío automático de páginas
        }
      });
      this.isInitialized = true;
      console.log('✅ Google Analytics inicializado');
    } catch (error) {
      console.error('❌ Error inicializando Google Analytics:', error);
    }
  }

  // Enviar evento de página vista
  trackPageView(pagePath, pageTitle) {
    if (!this.isInitialized) this.initialize();

    try {
      ReactGA.send({
        hitType: 'pageview',
        page: pagePath,
        title: pageTitle
      });
      console.log(`📊 Page view tracked: ${pagePath}`);
    } catch (error) {
      console.error('❌ Error tracking page view:', error);
    }
  }

  // Enviar evento personalizado
  trackEvent(eventName, parameters = {}) {
    if (!this.isInitialized) this.initialize();

    try {
      ReactGA.event({
        action: eventName,
        category: parameters.category || 'General',
        label: parameters.label || '',
        value: parameters.value || 0,
        ...parameters
      });
      console.log(`📊 Event tracked: ${eventName}`, parameters);
    } catch (error) {
      console.error('❌ Error tracking event:', error);
    }
  }

  // Eventos específicos del sistema

  // Registro de usuarios
  trackUserRegistration(userType, method = 'email') {
    this.trackEvent('user_registration', {
      category: 'User',
      user_type: userType,
      registration_method: method
    });
  }

  // Login de usuarios
  trackUserLogin(userType, method = 'email') {
    this.trackEvent('user_login', {
      category: 'User',
      user_type: userType,
      login_method: method
    });
  }

  // Logout de usuarios
  trackUserLogout(userType) {
    this.trackEvent('user_logout', {
      category: 'User',
      user_type: userType
    });
  }

  // Navegación en dashboard
  trackDashboardNavigation(section, userType) {
    this.trackEvent('dashboard_navigation', {
      category: 'Navigation',
      section: section,
      user_type: userType
    });
  }

  // Interacciones con membresías
  trackMembershipAction(action, planId, userType) {
    this.trackEvent('membership_action', {
      category: 'Membership',
      action: action, // 'view_plans', 'upgrade', 'downgrade', 'cancel'
      plan_id: planId,
      user_type: userType
    });
  }

  // Pagos y transacciones
  trackPayment(paymentType, amount, currency, planId, userType) {
    this.trackEvent('payment', {
      category: 'Ecommerce',
      payment_type: paymentType, // 'subscription', 'one_time', 'upgrade'
      value: amount,
      currency: currency,
      plan_id: planId,
      user_type: userType
    });
  }

  // Consultas de vehículos (funcionalidad premium)
  trackVehicleConsultation(marca, modelo, año, userType) {
    this.trackEvent('vehicle_consultation', {
      category: 'Premium Features',
      marca: marca,
      modelo: modelo,
      año: año,
      user_type: userType
    });
  }

  // Gestión de gastos vehiculares
  trackExpenseManagement(action, category, amount, userType) {
    this.trackEvent('expense_management', {
      category: 'Premium Features',
      action: action, // 'add_expense', 'view_expenses', 'export_report'
      expense_category: category,
      amount: amount,
      user_type: userType
    });
  }

  // Interacciones con empresas
  trackCompanyInteraction(action, companyId, userType) {
    this.trackEvent('company_interaction', {
      category: 'Business',
      action: action, // 'view_profile', 'contact', 'review', 'book_service'
      company_id: companyId,
      user_type: userType
    });
  }

  // Búsquedas
  trackSearch(searchTerm, resultsCount, userType) {
    this.trackEvent('search', {
      category: 'Search',
      search_term: searchTerm,
      results_count: resultsCount,
      user_type: userType
    });
  }

  // Formularios
  trackFormSubmission(formName, success, userType) {
    this.trackEvent('form_submission', {
      category: 'Forms',
      form_name: formName,
      success: success,
      user_type: userType
    });
  }

  // Errores
  trackError(errorType, errorMessage, page, userType) {
    this.trackEvent('error', {
      category: 'Error',
      error_type: errorType,
      error_message: errorMessage,
      page: page,
      user_type: userType
    });
  }

  // Conversiones (objetivos del negocio)
  trackConversion(conversionType, value, userType) {
    this.trackEvent('conversion', {
      category: 'Conversion',
      conversion_type: conversionType, // 'membership_upgrade', 'service_booking', 'company_registration'
      value: value,
      user_type: userType
    });
  }

  // Tiempo en página
  trackTimeOnPage(page, timeSpent, userType) {
    this.trackEvent('time_on_page', {
      category: 'Engagement',
      page: page,
      time_spent: timeSpent,
      user_type: userType
    });
  }

  // Scroll depth
  trackScrollDepth(page, scrollDepth, userType) {
    this.trackEvent('scroll_depth', {
      category: 'Engagement',
      page: page,
      scroll_depth: scrollDepth,
      user_type: userType
    });
  }

  // Click en elementos específicos
  trackElementClick(elementName, location, userType) {
    this.trackEvent('element_click', {
      category: 'Interaction',
      element_name: elementName,
      location: location,
      user_type: userType
    });
  }

  // Descarga de archivos
  trackFileDownload(fileName, fileType, userType) {
    this.trackEvent('file_download', {
      category: 'Downloads',
      file_name: fileName,
      file_type: fileType,
      user_type: userType
    });
  }

  // Compartir contenido
  trackContentShare(contentType, method, userType) {
    this.trackEvent('content_share', {
      category: 'Social',
      content_type: contentType,
      share_method: method,
      user_type: userType
    });
  }

  // Notificaciones
  trackNotification(notificationType, action, userType) {
    this.trackEvent('notification', {
      category: 'Notifications',
      notification_type: notificationType,
      action: action, // 'sent', 'opened', 'clicked', 'dismissed'
      user_type: userType
    });
  }

  // Métricas de rendimiento
  trackPerformance(metric, value, page) {
    this.trackEvent('performance', {
      category: 'Performance',
      metric: metric, // 'page_load_time', 'api_response_time', 'bundle_size'
      value: value,
      page: page
    });
  }

  // Configurar usuario
  setUserId(userId, userType) {
    if (!this.isInitialized) this.initialize();

    try {
      ReactGA.set({
        user_id: userId,
        custom_map: {
          user_type: userType
        }
      });
      console.log(`📊 User ID set: ${userId} (${userType})`);
    } catch (error) {
      console.error('❌ Error setting user ID:', error);
    }
  }

  // Obtener ID de cliente
  getClientId() {
    try {
      return ReactGA.ga.getAll()[0].get('clientId');
    } catch (error) {
      console.error('❌ Error getting client ID:', error);
      return null;
    }
  }

  // Habilitar/deshabilitar analytics
  setEnabled(enabled) {
    if (enabled) {
      this.initialize();
    } else {
      // No hay método directo para deshabilitar, pero podemos dejar de enviar eventos
      this.isInitialized = false;
    }
  }

  // Verificar si está habilitado
  isEnabled() {
    return this.isInitialized;
  }
}

export default new AnalyticsService();
