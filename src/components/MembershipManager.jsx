import React, { useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { MEMBERSHIP_PLANS, SUBSCRIPTION_STATUS } from '../constants/membershipPlans';

export default function MembershipManager({ empresaId }) {
  const {
    subscription,
    loading,
    error,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    reactivateSubscription,
    canCreateNewProduct,
    canCreateNewCampaign,
    getCurrentPlanLimits,
    getCurrentPlan,
    isSubscriptionActive,
    isInTrial,
    isExpired
  } = useSubscription(empresaId);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [upgrading, setUpgrading] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          <p className="font-medium">Error al cargar la membresía:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();
  const currentLimits = getCurrentPlanLimits();

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    try {
      setUpgrading(true);
      await createSubscription(selectedPlan.id);
      setShowUpgradeModal(false);
      setSelectedPlan(null);
      // Mostrar mensaje de éxito
    } catch (err) {
      console.error('Error upgrading subscription:', err);
      // Mostrar mensaje de error
    } finally {
      setUpgrading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case SUBSCRIPTION_STATUS.ACTIVE:
        return 'text-green-600 bg-green-100';
      case SUBSCRIPTION_STATUS.TRIAL:
        return 'text-blue-600 bg-blue-100';
      case SUBSCRIPTION_STATUS.PENDING:
        return 'text-yellow-600 bg-yellow-100';
      case SUBSCRIPTION_STATUS.CANCELLED:
        return 'text-red-600 bg-red-100';
      case SUBSCRIPTION_STATUS.EXPIRED:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case SUBSCRIPTION_STATUS.ACTIVE:
        return 'Activa';
      case SUBSCRIPTION_STATUS.TRIAL:
        return 'Período de Prueba';
      case SUBSCRIPTION_STATUS.PENDING:
        return 'Pendiente';
      case SUBSCRIPTION_STATUS.CANCELLED:
        return 'Cancelada';
      case SUBSCRIPTION_STATUS.EXPIRED:
        return 'Expirada';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan Actual */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Tu Membresía Actual</h2>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Cambiar Plan
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Información del Plan */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{currentPlan?.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{currentPlan?.name}</h3>
                <p className="text-gray-600">{currentPlan?.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription?.status)}`}>
                  {getStatusText(subscription?.status)}
                </span>
              </div>

              {subscription?.startDate && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Fecha de inicio:</span>
                  <span className="text-gray-900">
                    {new Date(subscription.startDate.toDate()).toLocaleDateString('es-CL')}
                  </span>
                </div>
              )}

              {subscription?.endDate && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Próximo pago:</span>
                  <span className="text-gray-900">
                    {new Date(subscription.endDate.toDate()).toLocaleDateString('es-CL')}
                  </span>
                </div>
              )}

              {isInTrial() && subscription?.trialEndsAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Prueba termina:</span>
                  <span className="text-blue-600 font-medium">
                    {new Date(subscription.trialEndsAt.toDate()).toLocaleDateString('es-CL')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Límites del Plan */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Límites del Plan</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Productos:</span>
                <span className="text-gray-900">
                  {currentLimits?.products === -1 ? 'Ilimitado' : `${currentLimits?.products} productos`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Campañas mensuales:</span>
                <span className="text-gray-900">
                  {currentLimits?.campaignsPerMonth === -1 ? 'Ilimitado' : `${currentLimits?.campaignsPerMonth} campañas`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Métricas:</span>
                <span className="text-gray-900 capitalize">
                  {currentLimits?.metrics}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Soporte:</span>
                <span className="text-gray-900 capitalize">
                  {currentLimits?.support}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones del Plan */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-3">
            {subscription?.status === SUBSCRIPTION_STATUS.ACTIVE && (
              <button
                onClick={cancelSubscription}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              >
                Cancelar Suscripción
              </button>
            )}

            {subscription?.status === SUBSCRIPTION_STATUS.CANCELLED && (
              <button
                onClick={reactivateSubscription}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Reactivar Suscripción
              </button>
            )}

            {isExpired() && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Renovar Suscripción
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Upgrade */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Cambiar Plan de Membresía</h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {Object.values(MEMBERSHIP_PLANS).map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPlan?.id === plan.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{plan.icon}</div>
                    <h4 className="font-semibold text-gray-900 mb-1">{plan.name}</h4>
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {plan.price === 0 ? 'Gratis' : `$${plan.price.toLocaleString('es-CL')}`}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                    
                    <ul className="text-xs text-gray-600 space-y-1 text-left">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-blue-600">+{plan.features.length - 3} características más</li>
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {selectedPlan && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Plan seleccionado: {selectedPlan.name}</h4>
                    <p className="text-sm text-gray-600">
                      {selectedPlan.price === 0 ? 'Gratis' : `$${selectedPlan.price.toLocaleString('es-CL')}/mes`}
                    </p>
                  </div>
                  <button
                    onClick={handleUpgrade}
                    disabled={upgrading || selectedPlan.id === currentPlan?.id}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {upgrading ? 'Procesando...' : 'Confirmar Cambio'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



