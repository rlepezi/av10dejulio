import AnalyticsService from '../AnalyticsService';

// Mock de ReactGA
jest.mock('react-ga4', () => ({
  initialize: jest.fn(),
  send: jest.fn(),
  event: jest.fn(),
  set: jest.fn(),
  ga: {
    getAll: jest.fn(() => [{
      get: jest.fn(() => 'test-client-id')
    }])
  }
}));

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset del estado de inicialización
    AnalyticsService.isInitialized = false;
  });

  test('initializes Google Analytics', () => {
    AnalyticsService.initialize();
    expect(AnalyticsService.isInitialized).toBe(true);
  });

  test('tracks page view', () => {
    const ReactGA = require('react-ga4');
    AnalyticsService.initialize();
    
    AnalyticsService.trackPageView('/test-page', 'Test Page');
    
    expect(ReactGA.send).toHaveBeenCalledWith({
      hitType: 'pageview',
      page: '/test-page',
      title: 'Test Page'
    });
  });

  test('tracks custom event', () => {
    const ReactGA = require('react-ga4');
    AnalyticsService.initialize();
    
    AnalyticsService.trackEvent('test_event', {
      category: 'Test',
      label: 'Test Label',
      value: 100
    });
    
    expect(ReactGA.event).toHaveBeenCalledWith({
      action: 'test_event',
      category: 'Test',
      label: 'Test Label',
      value: 100
    });
  });

  test('tracks user registration', () => {
    const ReactGA = require('react-ga4');
    AnalyticsService.initialize();
    
    AnalyticsService.trackUserRegistration('cliente', 'email');
    
    expect(ReactGA.event).toHaveBeenCalledWith({
      action: 'user_registration',
      category: 'User',
      user_type: 'cliente',
      registration_method: 'email'
    });
  });

  test('tracks user login', () => {
    const ReactGA = require('react-ga4');
    AnalyticsService.initialize();
    
    AnalyticsService.trackUserLogin('proveedor', 'google');
    
    expect(ReactGA.event).toHaveBeenCalledWith({
      action: 'user_login',
      category: 'User',
      user_type: 'proveedor',
      login_method: 'google'
    });
  });

  test('tracks membership action', () => {
    const ReactGA = require('react-ga4');
    AnalyticsService.initialize();
    
    AnalyticsService.trackMembershipAction('upgrade', 'premium', 'cliente');
    
    expect(ReactGA.event).toHaveBeenCalledWith({
      action: 'membership_action',
      category: 'Membership',
      action: 'upgrade',
      plan_id: 'premium',
      user_type: 'cliente'
    });
  });

  test('tracks payment', () => {
    const ReactGA = require('react-ga4');
    AnalyticsService.initialize();
    
    AnalyticsService.trackPayment('subscription', 29990, 'CLP', 'premium', 'cliente');
    
    expect(ReactGA.event).toHaveBeenCalledWith({
      action: 'payment',
      category: 'Ecommerce',
      payment_type: 'subscription',
      value: 29990,
      currency: 'CLP',
      plan_id: 'premium',
      user_type: 'cliente'
    });
  });

  test('tracks vehicle consultation', () => {
    const ReactGA = require('react-ga4');
    AnalyticsService.initialize();
    
    AnalyticsService.trackVehicleConsultation('Toyota', 'Corolla', '2020', 'cliente');
    
    expect(ReactGA.event).toHaveBeenCalledWith({
      action: 'vehicle_consultation',
      category: 'Premium Features',
      marca: 'Toyota',
      modelo: 'Corolla',
      año: '2020',
      user_type: 'cliente'
    });
  });

  test('tracks expense management', () => {
    const ReactGA = require('react-ga4');
    AnalyticsService.initialize();
    
    AnalyticsService.trackExpenseManagement('add_expense', 'mantenimiento', 50000, 'cliente');
    
    expect(ReactGA.event).toHaveBeenCalledWith({
      action: 'expense_management',
      category: 'Premium Features',
      action: 'add_expense',
      expense_category: 'mantenimiento',
      amount: 50000,
      user_type: 'cliente'
    });
  });

  test('tracks company interaction', () => {
    const ReactGA = require('react-ga4');
    AnalyticsService.initialize();
    
    AnalyticsService.trackCompanyInteraction('view_profile', 'company123', 'cliente');
    
    expect(ReactGA.event).toHaveBeenCalledWith({
      action: 'company_interaction',
      category: 'Business',
      action: 'view_profile',
      company_id: 'company123',
      user_type: 'cliente'
    });
  });

  test('tracks search', () => {
    const ReactGA = require('react-ga4');
    AnalyticsService.initialize();
    
    AnalyticsService.trackSearch('taller mecánico', 15, 'cliente');
    
    expect(ReactGA.event).toHaveBeenCalledWith({
      action: 'search',
      category: 'Search',
      search_term: 'taller mecánico',
      results_count: 15,
      user_type: 'cliente'
    });
  });

  test('tracks form submission', () => {
    const ReactGA = require('react-ga4');
    AnalyticsService.initialize();
    
    AnalyticsService.trackFormSubmission('contact_form', true, 'cliente');
    
    expect(ReactGA.event).toHaveBeenCalledWith({
      action: 'form_submission',
      category: 'Forms',
      form_name: 'contact_form',
      success: true,
      user_type: 'cliente'
    });
  });

  test('tracks error', () => {
    const ReactGA = require('react-ga4');
    AnalyticsService.initialize();
    
    AnalyticsService.trackError('validation_error', 'Email is required', '/contacto', 'cliente');
    
    expect(ReactGA.event).toHaveBeenCalledWith({
      action: 'error',
      category: 'Error',
      error_type: 'validation_error',
      error_message: 'Email is required',
      page: '/contacto',
      user_type: 'cliente'
    });
  });

  test('tracks conversion', () => {
    const ReactGA = require('react-ga4');
    AnalyticsService.initialize();
    
    AnalyticsService.trackConversion('membership_upgrade', 29990, 'cliente');
    
    expect(ReactGA.event).toHaveBeenCalledWith({
      action: 'conversion',
      category: 'Conversion',
      conversion_type: 'membership_upgrade',
      value: 29990,
      user_type: 'cliente'
    });
  });

  test('sets user ID', () => {
    const ReactGA = require('react-ga4');
    AnalyticsService.initialize();
    
    AnalyticsService.setUserId('user123', 'cliente');
    
    expect(ReactGA.set).toHaveBeenCalledWith({
      user_id: 'user123',
      custom_map: {
        user_type: 'cliente'
      }
    });
  });

  test('gets client ID', () => {
    const clientId = AnalyticsService.getClientId();
    expect(clientId).toBe('test-client-id');
  });

  test('handles errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const ReactGA = require('react-ga4');
    
    // Simular error en ReactGA.event
    ReactGA.event.mockImplementation(() => {
      throw new Error('GA Error');
    });
    
    AnalyticsService.initialize();
    AnalyticsService.trackEvent('test_event');
    
    expect(consoleSpy).toHaveBeenCalledWith('❌ Error tracking event:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });
});

