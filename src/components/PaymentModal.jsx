import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import StripeService from '../services/StripeService';
import { MEMBERSHIP_PLANS, CLIENT_MEMBERSHIP_PLANS, formatPrice } from '../constants/membershipPlans';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

const CheckoutForm = ({ planId, userId, userType, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Crear método de pago
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });

      if (paymentMethodError) {
        setError(paymentMethodError.message);
        setLoading(false);
        return;
      }

      // Crear suscripción
      const subscription = await StripeService.createSubscription(
        planId,
        userId,
        userType,
        paymentMethod.id
      );

      if (subscription.success) {
        // Registrar transacción
        await StripeService.recordTransaction({
          userId,
          userType,
          planId,
          amount: subscription.amount,
          currency: 'clp',
          paymentMethodId: paymentMethod.id,
          subscriptionId: subscription.id,
          status: 'completed'
        });

        onSuccess(subscription);
      } else {
        setError(subscription.error || 'Error al procesar el pago');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Información de Pago</h3>
        <CardElement options={cardElementOptions} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
        >
          {loading ? 'Procesando...' : 'Pagar Ahora'}
        </button>
      </div>
    </form>
  );
};

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  planId, 
  userId, 
  userType = 'client',
  onSuccess 
}) {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (planId) {
      const plans = userType === 'client' ? CLIENT_MEMBERSHIP_PLANS : MEMBERSHIP_PLANS;
      setPlan(plans[planId.toUpperCase()]);
    }
  }, [planId, userType]);

  if (!isOpen || !plan) return null;

  const handleSuccess = (subscription) => {
    onSuccess(subscription);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Confirmar Pago</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <p className="text-gray-600 mb-2">{plan.description}</p>
              <div className="text-2xl font-bold text-blue-600">
                {formatPrice(plan.price, plan.currency)}
                {plan.price > 0 && <span className="text-sm text-gray-500">/mes</span>}
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold mb-2">Beneficios incluidos:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Elements stripe={stripePromise}>
            <CheckoutForm
              planId={planId}
              userId={userId}
              userType={userType}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
}
