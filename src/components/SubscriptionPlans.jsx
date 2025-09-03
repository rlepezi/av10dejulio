import React, { useState, useEffect } from 'react';
import { PaymentService } from '../services/PaymentService';
import { formatPrice } from '../constants/membershipPlans';

export default function SubscriptionPlans({ empresaId, currentPlan, onPlanChange }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    loadSubscriptionPlans();
  }, []);

  const loadSubscriptionPlans = async () => {
    try {
      setLoading(true);
      const availablePlans = await PaymentService.getSubscriptionPlans();
      setPlans(availablePlans);
    } catch (error) {
      console.error('Error loading subscription plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    try {
      setUpgradeLoading(true);
      const result = await PaymentService.upgradeSubscription(empresaId, selectedPlan.id);
      
      if (result.success) {
        alert('✅ Plan actualizado exitosamente');
        setShowUpgradeModal(false);
        if (onPlanChange) {
          onPlanChange(selectedPlan);
        }
      } else {
        alert('❌ Error al actualizar el plan: ' + result.message);
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('❌ Error al actualizar el plan');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const getPlanFeatures = (plan) => {
    const baseFeatures = [
      'Perfil de empresa destacado',
      'Soporte por email',
      'Estadísticas básicas'
    ];

    switch (plan.tier) {
      case 'basic':
        return baseFeatures;
      case 'premium':
        return [
          ...baseFeatures,
          'Perfil premium con más fotos',
          'Soporte prioritario',
          'Estadísticas avanzadas',
          'Campañas promocionales',
          'Chat con agentes'
        ];
      case 'enterprise':
        return [
          ...baseFeatures,
          'Perfil enterprise completo',
          'Soporte 24/7',
          'Analytics completo',
          'Campañas personalizadas',
          'Chat con agentes',
          'API de integración',
          'Reportes personalizados',
          'Capacitaciones exclusivas'
        ];
      default:
        return baseFeatures;
    }
  };

  const getPlanIcon = (tier) => {
    switch (tier) {
      case 'basic': return '⭐';
      case 'premium': return '💎';
      case 'enterprise': return '🏆';
      default: return '⭐';
    }
  };

  const getPlanColor = (tier) => {
    switch (tier) {
      case 'basic': return 'border-gray-200 bg-gray-50';
      case 'premium': return 'border-blue-200 bg-blue-50';
      case 'enterprise': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getCurrentPlanBadge = (planId) => {
    if (currentPlan && currentPlan.id === planId) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Plan Actual
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando planes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">📋 Planes de Suscripción</h2>
        <p className="text-gray-600">
          Elige el plan que mejor se adapte a las necesidades de tu empresa
        </p>
      </div>

      {/* Planes Disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative border-2 rounded-lg p-6 ${getPlanColor(plan.tier)} ${
              currentPlan && currentPlan.id === plan.id ? 'ring-2 ring-green-500' : ''
            }`}
          >
            {/* Badge del Plan Actual */}
            {getCurrentPlanBadge(plan.id)}

            {/* Header del Plan */}
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{getPlanIcon(plan.tier)}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formatPrice(plan.price, plan.currency)}
              </div>
              <p className="text-sm text-gray-600">
                {plan.billingCycle === 'monthly' ? 'por mes' : 'por año'}
              </p>
              {plan.originalPrice && plan.originalPrice > plan.price && (
                <p className="text-sm text-red-600 line-through">
                  {formatPrice(plan.originalPrice, plan.currency)}
                </p>
              )}
            </div>

            {/* Características del Plan */}
            <div className="space-y-3 mb-6">
              {getPlanFeatures(plan).map((feature, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* Botón de Acción */}
            <div className="text-center">
              {currentPlan && currentPlan.id === plan.id ? (
                <button
                  disabled
                  className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
                >
                  Plan Actual
                </button>
              ) : (
                <button
                  onClick={() => handlePlanSelect(plan)}
                  className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                    plan.tier === 'basic'
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : plan.tier === 'premium'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {currentPlan && currentPlan.price < plan.price ? 'Actualizar' : 'Seleccionar'}
                </button>
              )}
            </div>

            {/* Información Adicional */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Más Popular
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Información Adicional */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">💡 Información Importante</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-blue-600">ℹ️</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Cambio de Plan</p>
                <p className="text-xs text-gray-600">
                  Puedes cambiar tu plan en cualquier momento. Los cambios se aplican inmediatamente.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-600">💰</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Facturación</p>
                <p className="text-xs text-gray-600">
                  La facturación se realiza al inicio de cada período. No hay cargos ocultos.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-purple-600">🔄</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Renovación</p>
                <p className="text-xs text-gray-600">
                  Tu suscripción se renueva automáticamente. Puedes cancelar en cualquier momento.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-orange-600">🎁</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Descuentos</p>
                <p className="text-xs text-gray-600">
                  Planes anuales incluyen un descuento del 20% sobre el precio mensual.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Actualización */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {currentPlan && currentPlan.price < selectedPlan.price ? 'Actualizar Plan' : 'Seleccionar Plan'}
            </h3>
            
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Plan Seleccionado:</span>
                  <span className="text-lg font-bold text-blue-600">{selectedPlan.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Precio:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(selectedPlan.price, selectedPlan.currency)}
                    <span className="text-sm text-gray-500 ml-1">
                      /{selectedPlan.billingCycle === 'monthly' ? 'mes' : 'año'}
                    </span>
                  </span>
                </div>
                {currentPlan && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Plan Actual:</span>
                      <span className="text-gray-900">{currentPlan.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Diferencia:</span>
                      <span className={`font-medium ${
                        selectedPlan.price > currentPlan.price ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {selectedPlan.price > currentPlan.price ? '+' : ''}
                        {formatPrice(selectedPlan.price - currentPlan.price, selectedPlan.currency)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <p className="text-sm text-gray-600">
                  El cambio se aplicará inmediatamente
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <p className="text-sm text-gray-600">
                  No hay cargos por cambio de plan
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <p className="text-sm text-gray-600">
                  Acceso inmediato a todas las funciones
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpgrade}
                disabled={upgradeLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {upgradeLoading ? 'Procesando...' : 'Confirmar Cambio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



