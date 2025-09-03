import React, { useState, useEffect } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { MEMBERSHIP_PLANS, formatPrice, getPlanColor, isPopularPlan } from '../constants/membershipPlans';
import { PaymentService } from '../services/PaymentService';

export default function SubscriptionManager({ empresaId }) {
  const { 
    subscription, 
    loading, 
    error, 
    createSubscription, 
    updateSubscription, 
    cancelSubscription,
    reactivateSubscription,
    isSubscriptionActive,
    isInTrial,
    isExpired,
    getCurrentPlan,
    getCurrentPlanLimits
  } = useSubscription(empresaId);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState({
    type: 'credit_card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    if (empresaId) {
      loadPaymentHistory();
      loadInvoices();
    }
  }, [empresaId]);

  const loadPaymentHistory = async () => {
    try {
      const history = await PaymentService.getPaymentHistory(empresaId);
      setPaymentHistory(history);
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const invoiceList = await PaymentService.getInvoices(empresaId);
      setInvoices(invoiceList);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const handlePlanSelection = (planId) => {
    setSelectedPlan(MEMBERSHIP_PLANS[planId]);
    setShowUpgradeModal(true);
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    try {
      setProcessingPayment(true);
      
      // Simular procesamiento de pago
      const paymentResult = await PaymentService.processPayment({
        empresaId,
        planId: selectedPlan.id,
        amount: selectedPlan.price,
        currency: selectedPlan.currency,
        paymentMethod: paymentMethod.type,
        description: `Upgrade to ${selectedPlan.name}`
      });

      if (paymentResult.success) {
        // Crear nueva suscripción
        await createSubscription(selectedPlan.id, paymentMethod);
        
        // Crear factura
        await PaymentService.createInvoice({
          empresaId,
          subscriptionId: subscription?.id,
          amount: selectedPlan.price,
          currency: selectedPlan.currency,
          description: `${selectedPlan.name} - Monthly Subscription`,
          status: 'paid'
        });

        alert(`✅ ¡Felicidades! Has sido actualizado al plan ${selectedPlan.name}`);
        setShowUpgradeModal(false);
        setSelectedPlan(null);
        setPaymentMethod({
          type: 'credit_card',
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: ''
        });
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('❌ Error al procesar el pago. Por favor, intenta nuevamente.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm('¿Estás seguro de que quieres cancelar tu suscripción? Perderás acceso a las funciones premium.')) {
      try {
        await cancelSubscription();
        alert('✅ Suscripción cancelada. Tu plan gratuito seguirá activo.');
      } catch (error) {
        console.error('Error canceling subscription:', error);
        alert('❌ Error al cancelar la suscripción.');
      }
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      await reactivateSubscription();
      alert('✅ ¡Bienvenido de vuelta! Tu suscripción ha sido reactivada.');
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      alert('❌ Error al reactivar la suscripción.');
    }
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const invoice = await PaymentService.downloadInvoice(invoiceId);
      // En un entorno real, esto descargaría un PDF
      alert(`📄 Factura ${invoiceId} descargada`);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('❌ Error al descargar la factura.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando suscripción...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();
  const planLimits = getCurrentPlanLimits();

  return (
    <div className="space-y-6">
      {/* Estado Actual de la Suscripción */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Estado de Suscripción</h2>
          <div className="flex space-x-2">
            {isSubscriptionActive() && (
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
              >
                Cancelar Suscripción
              </button>
            )}
            {isExpired() && (
              <button
                onClick={handleReactivateSubscription}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Reactivar
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
              getPlanColor(currentPlan?.id) === 'blue' ? 'bg-blue-100' : 
              getPlanColor(currentPlan?.id) === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
            }`}>
              <span className="text-2xl">⭐</span>
            </div>
            <h3 className="font-medium text-gray-900">{currentPlan?.name || 'Plan Gratuito'}</h3>
            <p className="text-sm text-gray-600">
              {isInTrial() ? 'Período de Prueba' : 
               isExpired() ? 'Expirado' : 
               isSubscriptionActive() ? 'Activo' : 'Inactivo'}
            </p>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(currentPlan?.price || 0, currentPlan?.currency || 'CLP')}
            </div>
            <p className="text-sm text-gray-600">por mes</p>
            {subscription?.nextPayment && (
              <p className="text-xs text-gray-500">
                Próximo pago: {new Date(subscription.nextPayment).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {subscription?.status === 'activa' ? '✅' : '❌'}
            </div>
            <p className="text-sm text-gray-600">Estado</p>
            {subscription?.trialEndsAt && (
              <p className="text-xs text-gray-500">
                Prueba hasta: {new Date(subscription.trialEndsAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Límites del Plan */}
        {planLimits && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Límites del Plan Actual</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {planLimits.maxProducts === -1 ? '∞' : planLimits.maxProducts}
                </div>
                <p className="text-sm text-gray-600">Productos</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {planLimits.maxCampaigns === -1 ? '∞' : planLimits.maxCampaigns}
                </div>
                <p className="text-sm text-gray-600">Campañas</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {planLimits.analyticsLevel === 'basic' ? 'Básico' : 
                   planLimits.analyticsLevel === 'advanced' ? 'Avanzado' : 'Empresarial'}
                </div>
                <p className="text-sm text-gray-600">Analytics</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {planLimits.supportLevel === 'email' ? 'Email' : 
                   planLimits.supportLevel === 'priority' ? 'Prioritario' : 'Dedicado'}
                </div>
                <p className="text-sm text-gray-600">Soporte</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Planes Disponibles */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Planes Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(MEMBERSHIP_PLANS).map((plan) => (
            <div
              key={plan.id}
              className={`relative border-2 rounded-lg p-6 ${
                currentPlan?.id === plan.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isPopularPlan(plan.id) ? 'ring-2 ring-yellow-400' : ''}`}
            >
              {isPopularPlan(plan.id) && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium">
                    Más Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {formatPrice(plan.price, plan.currency)}
                </div>
                <p className="text-sm text-gray-600">por mes</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.slice(0, 5).map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
                {plan.features.length > 5 && (
                  <li className="text-sm text-blue-600">
                    +{plan.features.length - 5} características más
                  </li>
                )}
              </ul>

              {currentPlan?.id === plan.id ? (
                <button
                  disabled
                  className="w-full py-2 px-4 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
                >
                  Plan Actual
                </button>
              ) : (
                <button
                  onClick={() => handlePlanSelection(plan.id)}
                  className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                    plan.price === 0
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.price === 0 ? 'Seleccionar Gratis' : 'Actualizar Plan'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Historial de Pagos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Historial de Pagos</h2>
        {paymentHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentHistory.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(payment.amount, payment.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.status === 'completed' ? 'Completado' :
                         payment.status === 'pending' ? 'Pendiente' : 'Fallido'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No hay historial de pagos disponible.</p>
        )}
      </div>

      {/* Facturas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Facturas</h2>
        {invoices.length > 0 ? (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{invoice.description}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(invoice.date).toLocaleDateString()} - {invoice.status}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-semibold text-gray-900">
                    {formatPrice(invoice.amount, invoice.currency)}
                  </span>
                  <button
                    onClick={() => downloadInvoice(invoice.id)}
                    className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                  >
                    Descargar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No hay facturas disponibles.</p>
        )}
      </div>

      {/* Modal de Actualización */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Actualizar a {selectedPlan.name}
            </h3>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Precio: {formatPrice(selectedPlan.price, selectedPlan.currency)}/mes</p>
              <p className="text-sm text-gray-500">Se procesará un pago de {formatPrice(selectedPlan.price, selectedPlan.currency)}</p>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Tarjeta
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={paymentMethod.cardNumber}
                  onChange={(e) => setPaymentMethod({...paymentMethod, cardNumber: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Expiración
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={paymentMethod.expiryDate}
                    onChange={(e) => setPaymentMethod({...paymentMethod, expiryDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={paymentMethod.cvv}
                    onChange={(e) => setPaymentMethod({...paymentMethod, cvv: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Titular
                </label>
                <input
                  type="text"
                  placeholder="Juan Pérez"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={paymentMethod.cardholderName}
                  onChange={(e) => setPaymentMethod({...paymentMethod, cardholderName: e.target.value})}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpgrade}
                disabled={processingPayment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {processingPayment ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



