import React, { useState } from 'react';
import { CLIENT_MEMBERSHIP_PLANS, formatPrice } from '../constants/membershipPlans';

export default function ClientMembershipPlans({ currentPlan, onUpgrade, loading = false }) {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleUpgrade = () => {
    if (selectedPlan && onUpgrade) {
      onUpgrade(selectedPlan);
    }
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'premium': return '👑';
      case 'basic': return '🔰';
      default: return '⭐';
    }
  };

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'premium': return 'border-purple-500 bg-purple-50';
      case 'basic': return 'border-gray-300 bg-gray-50';
      default: return 'border-blue-300 bg-blue-50';
    }
  };

  const getButtonColor = (planId) => {
    switch (planId) {
      case 'premium': return 'bg-purple-600 hover:bg-purple-700';
      case 'basic': return 'bg-gray-600 hover:bg-gray-700';
      default: return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Planes de Membresía</h2>
        <p className="text-gray-600">
          Elige el plan que mejor se adapte a tus necesidades y comienza a disfrutar de beneficios exclusivos
        </p>
      </div>

      {/* Planes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.values(CLIENT_MEMBERSHIP_PLANS).map((plan) => (
          <div
            key={plan.id}
            className={`relative border-2 rounded-lg p-6 transition-all ${
              currentPlan?.id === plan.id
                ? 'border-green-500 bg-green-50'
                : selectedPlan?.id === plan.id
                ? getPlanColor(plan.id)
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Badge para plan actual */}
            {currentPlan?.id === plan.id && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Plan Actual
                </span>
              </div>
            )}

            {/* Badge para plan popular */}
            {plan.id === 'premium' && (
              <div className="absolute -top-3 right-4">
                <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium">
                  Más Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <div className="text-4xl mb-3">{getPlanIcon(plan.id)}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formatPrice(plan.price, plan.currency)}
              </div>
              {plan.price > 0 && (
                <p className="text-sm text-gray-600">por mes</p>
              )}
              <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
            </div>

            {/* Características */}
            <div className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span className="text-gray-700 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* Botón de acción */}
            {currentPlan?.id === plan.id ? (
              <button
                disabled
                className="w-full py-3 px-4 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium"
              >
                Plan Actual
              </button>
            ) : (
              <button
                onClick={() => setSelectedPlan(plan)}
                className={`w-full py-3 px-4 text-white rounded-lg font-medium transition-colors ${getButtonColor(plan.id)}`}
              >
                {plan.price === 0 ? 'Seleccionar Gratis' : 'Actualizar Plan'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Comparación de planes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparación de Planes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Característica</th>
                {Object.values(CLIENT_MEMBERSHIP_PLANS).map((plan) => (
                  <th key={plan.id} className="text-center py-3 px-4 font-medium text-gray-900">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-3 px-4 text-gray-700">Promociones personalizadas</td>
                <td className="text-center py-3 px-4">
                  <span className="text-red-500">✗</span>
                </td>
                <td className="text-center py-3 px-4">
                  <span className="text-green-500">✓</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Recordatorios automáticos</td>
                <td className="text-center py-3 px-4">
                  <span className="text-red-500">✗</span>
                </td>
                <td className="text-center py-3 px-4">
                  <span className="text-green-500">✓</span>
                </td>
              </tr>
              <tr>
                <td className="text-center py-3 px-4 text-gray-700">Eventos exclusivos</td>
                <td className="text-center py-3 px-4">
                  <span className="text-red-500">✗</span>
                </td>
                <td className="text-center py-3 px-4">
                  <span className="text-green-500">✓</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Asesoría personalizada</td>
                <td className="text-center py-3 px-4">
                  <span className="text-red-500">✗</span>
                </td>
                <td className="text-center py-3 px-4">
                  <span className="text-green-500">✓</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Descuentos especiales</td>
                <td className="text-center py-3 px-4">
                  <span className="text-red-500">✗</span>
                </td>
                <td className="text-center py-3 px-4">
                  <span className="text-green-500">✓</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan seleccionado y confirmación */}
      {selectedPlan && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Plan seleccionado: {selectedPlan.name}</h4>
              <p className="text-sm text-gray-600">
                {selectedPlan.price === 0 ? 'Gratis' : `${formatPrice(selectedPlan.price, selectedPlan.currency)}/mes`}
              </p>
              <p className="text-sm text-gray-600 mt-1">{selectedPlan.description}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedPlan(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Procesando...' : 'Confirmar Cambio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-3">¿Cómo funciona el sistema de puntos?</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Acumula Puntos</h5>
            <p>Gana puntos por cada servicio realizado en talleres de la comunidad</p>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Sube de Nivel</h5>
            <p>Con más puntos accedes a beneficios exclusivos y descuentos especiales</p>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Canjea Ofertas</h5>
            <p>Usa tus puntos para canjear ofertas exclusivas de talleres participantes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
