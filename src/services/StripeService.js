import { loadStripe } from '@stripe/stripe-js';
import { doc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Inicializar Stripe con la clave pública
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

class StripeService {
  constructor() {
    this.stripe = null;
    this.initializeStripe();
  }

  async initializeStripe() {
    this.stripe = await stripePromise;
  }

  // Crear sesión de pago para membresía
  async createCheckoutSession(planId, userId, userType = 'client') {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId,
          userType,
          successUrl: `${import.meta.env.VITE_BASE_URL || window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${import.meta.env.VITE_BASE_URL || window.location.origin}/dashboard?payment=cancelled`
        }),
      });

      const session = await response.json();
      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Procesar pago de membresía
  async processMembershipPayment(planId, userId, userType = 'client') {
    try {
      if (!this.stripe) {
        await this.initializeStripe();
      }

      const session = await this.createCheckoutSession(planId, userId, userType);
      
      const { error } = await this.stripe.redirectToCheckout({
        sessionId: session.id
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false, error: error.message };
    }
  }

  // Crear método de pago para suscripciones recurrentes
  async createPaymentMethod(cardElement) {
    try {
      if (!this.stripe) {
        await this.initializeStripe();
      }

      const { error, paymentMethod } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, paymentMethod };
    } catch (error) {
      console.error('Error creating payment method:', error);
      return { success: false, error: error.message };
    }
  }

  // Crear suscripción recurrente
  async createSubscription(planId, userId, userType = 'client', paymentMethodId) {
    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId,
          userType,
          paymentMethodId
        }),
      });

      const subscription = await response.json();
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Cancelar suscripción
  async cancelSubscription(subscriptionId) {
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Obtener métodos de pago del usuario
  async getPaymentMethods(customerId) {
    try {
      const response = await fetch(`/api/payment-methods/${customerId}`);
      const methods = await response.json();
      return methods;
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  }

  // Actualizar método de pago por defecto
  async updateDefaultPaymentMethod(customerId, paymentMethodId) {
    try {
      const response = await fetch('/api/update-default-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId, paymentMethodId }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating default payment method:', error);
      throw error;
    }
  }

  // Registrar transacción en Firestore
  async recordTransaction(transactionData) {
    try {
      const transactionRef = await addDoc(collection(db, 'transacciones'), {
        ...transactionData,
        fecha: new Date(),
        estado: 'completada'
      });

      return { success: true, transactionId: transactionRef.id };
    } catch (error) {
      console.error('Error recording transaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Verificar estado de pago
  async verifyPaymentStatus(sessionId) {
    try {
      const response = await fetch(`/api/verify-payment/${sessionId}`);
      const status = await response.json();
      return status;
    } catch (error) {
      console.error('Error verifying payment status:', error);
      throw error;
    }
  }

  // Obtener historial de pagos
  async getPaymentHistory(userId, userType = 'client') {
    try {
      const response = await fetch(`/api/payment-history/${userId}?type=${userType}`);
      const history = await response.json();
      return history;
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw error;
    }
  }

  // Procesar reembolso
  async processRefund(transactionId, amount = null) {
    try {
      const response = await fetch('/api/process-refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionId, amount }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }
}

export default new StripeService();
