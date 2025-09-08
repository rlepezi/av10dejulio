import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import AnalyticsService from '../services/AnalyticsService';

export const useAnalytics = () => {
  const location = useLocation();
  const { user, rol } = useAuth();

  // Inicializar analytics al montar el componente
  useEffect(() => {
    AnalyticsService.initialize();
  }, []);

  // Configurar usuario cuando cambie
  useEffect(() => {
    if (user && rol) {
      AnalyticsService.setUserId(user.uid, rol);
    }
  }, [user, rol]);

  // Trackear cambios de página
  useEffect(() => {
    const pagePath = location.pathname + location.search;
    const pageTitle = document.title;
    
    AnalyticsService.trackPageView(pagePath, pageTitle);
  }, [location]);

  // Funciones de tracking específicas
  const trackEvent = useCallback((eventName, parameters = {}) => {
    const userType = rol || 'guest';
    AnalyticsService.trackEvent(eventName, { ...parameters, user_type: userType });
  }, [rol]);

  const trackUserAction = useCallback((action, category = 'User', additionalParams = {}) => {
    const userType = rol || 'guest';
    AnalyticsService.trackEvent(action, {
      category,
      user_type: userType,
      ...additionalParams
    });
  }, [rol]);

  const trackBusinessAction = useCallback((action, businessType, additionalParams = {}) => {
    const userType = rol || 'guest';
    AnalyticsService.trackEvent(action, {
      category: 'Business',
      business_type: businessType,
      user_type: userType,
      ...additionalParams
    });
  }, [rol]);

  const trackMembershipAction = useCallback((action, planId, additionalParams = {}) => {
    const userType = rol || 'guest';
    AnalyticsService.trackMembershipAction(action, planId, userType);
  }, [rol]);

  const trackPayment = useCallback((paymentType, amount, currency, planId) => {
    const userType = rol || 'guest';
    AnalyticsService.trackPayment(paymentType, amount, currency, planId, userType);
  }, [rol]);

  const trackError = useCallback((errorType, errorMessage, page) => {
    const userType = rol || 'guest';
    AnalyticsService.trackError(errorType, errorMessage, page, userType);
  }, [rol]);

  const trackConversion = useCallback((conversionType, value) => {
    const userType = rol || 'guest';
    AnalyticsService.trackConversion(conversionType, value, userType);
  }, [rol]);

  const trackFormSubmission = useCallback((formName, success) => {
    const userType = rol || 'guest';
    AnalyticsService.trackFormSubmission(formName, success, userType);
  }, [rol]);

  const trackSearch = useCallback((searchTerm, resultsCount) => {
    const userType = rol || 'guest';
    AnalyticsService.trackSearch(searchTerm, resultsCount, userType);
  }, [rol]);

  const trackElementClick = useCallback((elementName, location) => {
    const userType = rol || 'guest';
    AnalyticsService.trackElementClick(elementName, location, userType);
  }, [rol]);

  const trackDashboardNavigation = useCallback((section) => {
    const userType = rol || 'guest';
    AnalyticsService.trackDashboardNavigation(section, userType);
  }, [rol]);

  const trackVehicleConsultation = useCallback((marca, modelo, año) => {
    const userType = rol || 'guest';
    AnalyticsService.trackVehicleConsultation(marca, modelo, año, userType);
  }, [rol]);

  const trackExpenseManagement = useCallback((action, category, amount) => {
    const userType = rol || 'guest';
    AnalyticsService.trackExpenseManagement(action, category, amount, userType);
  }, [rol]);

  const trackCompanyInteraction = useCallback((action, companyId) => {
    const userType = rol || 'guest';
    AnalyticsService.trackCompanyInteraction(action, companyId, userType);
  }, [rol]);

  const trackNotification = useCallback((notificationType, action) => {
    const userType = rol || 'guest';
    AnalyticsService.trackNotification(notificationType, action, userType);
  }, [rol]);

  const trackPerformance = useCallback((metric, value, page) => {
    AnalyticsService.trackPerformance(metric, value, page);
  }, []);

  const trackTimeOnPage = useCallback((page, timeSpent) => {
    const userType = rol || 'guest';
    AnalyticsService.trackTimeOnPage(page, timeSpent, userType);
  }, [rol]);

  const trackScrollDepth = useCallback((page, scrollDepth) => {
    const userType = rol || 'guest';
    AnalyticsService.trackScrollDepth(page, scrollDepth, userType);
  }, [rol]);

  return {
    trackEvent,
    trackUserAction,
    trackBusinessAction,
    trackMembershipAction,
    trackPayment,
    trackError,
    trackConversion,
    trackFormSubmission,
    trackSearch,
    trackElementClick,
    trackDashboardNavigation,
    trackVehicleConsultation,
    trackExpenseManagement,
    trackCompanyInteraction,
    trackNotification,
    trackPerformance,
    trackTimeOnPage,
    trackScrollDepth
  };
};

export default useAnalytics;

