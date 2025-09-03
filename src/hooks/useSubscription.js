import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { MEMBERSHIP_PLANS, SUBSCRIPTION_STATUS, BILLING_CYCLES, getPlanById, formatPrice } from '../constants/membershipPlans';

export function useSubscription(empresaId) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!empresaId) {
      setLoading(false);
      return;
    }

    fetchSubscription();
  }, [empresaId]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar suscripción en la colección subscriptions
      const subscriptionRef = doc(db, 'subscriptions', empresaId);
      const subscriptionSnap = await getDoc(subscriptionRef);

      if (subscriptionSnap.exists()) {
        const subscriptionData = subscriptionSnap.data();
        setSubscription({
          id: subscriptionSnap.id,
          ...subscriptionData
        });
      } else {
        // Si no existe suscripción, crear una por defecto (FREE)
        const defaultSubscription = {
          empresaId,
          planId: 'free',
          status: SUBSCRIPTION_STATUS.ACTIVE,
          startDate: new Date(),
          endDate: null, // Plan gratuito no expira
          billingCycle: BILLING_CYCLES.MONTHLY,
          autoRenew: false,
          features: getPlanById('free').features,
          limitations: getPlanById('free').limitations,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await setDoc(subscriptionRef, defaultSubscription);
        setSubscription({
          id: subscriptionSnap.id,
          ...defaultSubscription
        });
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const upgradeSubscription = async (newPlanId, billingCycle = BILLING_CYCLES.MONTHLY) => {
    try {
      setError(null);
      
      const newPlan = getPlanById(newPlanId);
      const subscriptionRef = doc(db, 'subscriptions', empresaId);
      
      const endDate = new Date();
      if (billingCycle === BILLING_CYCLES.MONTHLY) {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (billingCycle === BILLING_CYCLES.YEARLY) {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else if (billingCycle === BILLING_CYCLES.QUARTERLY) {
        endDate.setMonth(endDate.getMonth() + 3);
      }

      const updatedSubscription = {
        planId: newPlanId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startDate: new Date(),
        endDate: newPlanId === 'free' ? null : endDate,
        billingCycle,
        autoRenew: newPlanId !== 'free',
        features: newPlan.features,
        limitations: newPlan.limitations,
        updatedAt: new Date()
      };

      await updateDoc(subscriptionRef, updatedSubscription);
      
      // Actualizar estado local
      setSubscription(prev => ({
        ...prev,
        ...updatedSubscription
      }));

      return { success: true };
    } catch (err) {
      console.error('Error upgrading subscription:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const cancelSubscription = async () => {
    try {
      setError(null);
      
      const subscriptionRef = doc(db, 'subscriptions', empresaId);
      
      await updateDoc(subscriptionRef, {
        status: SUBSCRIPTION_STATUS.CANCELLED,
        autoRenew: false,
        cancelledAt: new Date(),
        updatedAt: new Date()
      });

      // Actualizar estado local
      setSubscription(prev => ({
        ...prev,
        status: SUBSCRIPTION_STATUS.CANCELLED,
        autoRenew: false,
        cancelledAt: new Date()
      }));

      return { success: true };
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const getCurrentPlan = () => {
    if (!subscription) return getPlanById('free');
    return getPlanById(subscription.planId);
  };

  const canAccessFeature = (feature) => {
    if (!subscription) return false;
    
    const plan = getCurrentPlan();
    return plan.limitations[feature] === true;
  };

  const getUsageStats = async () => {
    try {
      if (!empresaId) return null;

      // Obtener estadísticas de uso
      const [productosSnapshot, campanasSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'productos'),
          where('empresaId', '==', empresaId),
          where('estado', '==', 'aprobado')
        )),
        getDocs(query(
          collection(db, 'campanas'),
          where('empresaId', '==', empresaId),
          where('estado', '==', 'aprobada')
        ))
      ]);

      const productosCount = productosSnapshot.docs.length;
      const campanasCount = campanasSnapshot.docs.length;

      return {
        productos: productosCount,
        campanas: campanasCount,
        productosLimit: getCurrentPlan().limitations.maxProducts,
        campanasLimit: getCurrentPlan().limitations.maxCampaigns
      };
    } catch (err) {
      console.error('Error getting usage stats:', err);
      return null;
    }
  };

  const isSubscriptionActive = () => {
    if (!subscription) return false;
    
    if (subscription.planId === 'free') return true;
    if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) return false;
    
    if (subscription.endDate) {
      return new Date() < subscription.endDate.toDate();
    }
    
    return true;
  };

  const getDaysUntilExpiry = () => {
    if (!subscription || !subscription.endDate || subscription.planId === 'free') {
      return null;
    }
    
    const now = new Date();
    const endDate = subscription.endDate.toDate();
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  return {
    subscription,
    loading,
    error,
    upgradeSubscription,
    cancelSubscription,
    getCurrentPlan,
    canAccessFeature,
    getUsageStats,
    isSubscriptionActive,
    getDaysUntilExpiry,
    refetch: fetchSubscription
  };
}