import React, { useState, useEffect } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { MEMBERSHIP_PLANS, formatPrice, getPlanColor } from '../constants/membershipPlans';

export default function SubscriptionStatus({ empresaId }) {
  const { 
    subscription, 
    loading, 
    error, 
    getCurrentPlan, 
    isSubscriptionActive, 
    getDaysUntilExpiry,
    getUsageStats 
  } = useSubscription(empresaId);
  
  const [usageStats, setUsageStats] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (empresaId) {
      loadUsageStats();
    }
  }, [empresaId]);

  const loadUsageStats = async () => {
    const stats = await getUsageStats();
    setUsageStats(stats);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error al cargar información de membresía: {error}</p>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();
  const isActive = isSubscriptionActive();
  const daysUntilExpiry = getDaysUntilExpiry();
  const planColor = getPlanColor(currentPlan.id);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Estado de Membresía</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isActive ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      {/* Plan Actual */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-3 h-3 rounded-full bg-${planColor}-500`}></div>
          <h4 className="text-xl font-bold text-gray-900">{currentPlan.name}</h4>
          {currentPlan.popular && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              Popular
            </span>
          )}
        </div>
        <p className="text-gray-600 mb-2">{currentPlan.description}</p>
        <div className="text-2xl font-bold text-gray-900">
          {formatPrice(currentPlan.price)}
          {currentPlan.price > 0 && (
            <span className="text-sm font-normal text-gray-500">/mes</span>
          )}
        </div>
      </div>

      {/* Estadísticas de Uso */}
      {usageStats && (
        <div className="mb-6">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Uso Actual</h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Productos</span>
                <span>{usageStats.productos}/{usageStats.productosLimit === -1 ? '∞' : usageStats.productosLimit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`bg-${planColor}-500 h-2 rounded-full transition-all duration-300`}
                  style={{ 
                    width: `${usageStats.productosLimit === -1 ? 0 : Math.min((usageStats.productos / usageStats.productosLimit) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Campañas</span>
                <span>{usageStats.campanas}/{usageStats.campanasLimit === -1 ? '∞' : usageStats.campanasLimit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`bg-${planColor}-500 h-2 rounded-full transition-all duration-300`}
                  style={{ 
                    width: `${usageStats.campanasLimit === -1 ? 0 : Math.min((usageStats.campanas / usageStats.campanasLimit) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información de Expiración */}
      {daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <p className="text-yellow-800 text-sm">
              Tu membresía expira en {daysUntilExpiry} día{daysUntilExpiry !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Características del Plan */}
      <div className="mb-6">
        <h5 className="text-sm font-medium text-gray-700 mb-3">Características Incluidas</h5>
        <div className="space-y-2">
          {currentPlan.features.slice(0, 5).map((feature, index) => (
            <div key={index} className="flex items-center text-sm text-gray-600">
              <span className="text-green-500 mr-2">✓</span>
              {feature}
            </div>
          ))}
          {currentPlan.features.length > 5 && (
            <p className="text-xs text-gray-500">
              +{currentPlan.features.length - 5} características más
            </p>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3">
        {currentPlan.id === 'free' ? (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Actualizar Plan
          </button>
        ) : (
          <>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Cambiar Plan
            </button>
            <button
              onClick={() => {/* Implementar cancelación */}}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </>
        )}
      </div>

      {/* Modal de Actualización */}
      {showUpgradeModal && (
        <UpgradeModal 
          currentPlan={currentPlan}
          onClose={() => setShowUpgradeModal(false)}
          empresaId={empresaId}
        />
      )}
    </div>
  );
}

// Componente Modal para actualización de plan
function UpgradeModal({ currentPlan, onClose, empresaId }) {
  const { upgradeSubscription } = useSubscription(empresaId);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('mensual');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    try {
      const result = await upgradeSubscription(selectedPlan.id, billingCycle);
      if (result.success) {
        alert('¡Plan actualizado exitosamente!');
        onClose();
      } else {
        alert('Error al actualizar el plan: ' + result.error);
      }
    } catch (error) {
      alert('Error al actualizar el plan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const availablePlans = Object.values(MEMBERSHIP_PLANS).filter(plan => 
    plan.id !== currentPlan.id
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Actualizar Plan de Membresía</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Planes Disponibles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {availablePlans.map((plan) => (
            <div
              key={plan.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedPlan?.id === plan.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPlan(plan)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                {plan.popular && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    Popular
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
              <div className="text-2xl font-bold text-gray-900 mb-3">
                {formatPrice(plan.price)}
                {plan.price > 0 && (
                  <span className="text-sm font-normal text-gray-500">/mes</span>
                )}
              </div>
              <div className="space-y-1">
                {plan.features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Ciclo de Facturación */}
        {selectedPlan && selectedPlan.price > 0 && (
          <div className="mb-6">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Ciclo de Facturación</h5>
            <div className="flex gap-3">
              {[
                { value: 'mensual', label: 'Mensual', discount: 0 },
                { value: 'anual', label: 'Anual', discount: 20 }
              ].map((cycle) => (
                <label key={cycle.value} className="flex items-center">
                  <input
                    type="radio"
                    name="billingCycle"
                    value={cycle.value}
                    checked={billingCycle === cycle.value}
                    onChange={(e) => setBillingCycle(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    {cycle.label}
                    {cycle.discount > 0 && (
                      <span className="text-green-600 font-medium ml-1">
                        (-{cycle.discount}%)
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpgrade}
            disabled={!selectedPlan || loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : 'Actualizar Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
