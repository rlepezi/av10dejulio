import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  CLIENT_MEMBERSHIP_PLANS, 
  SUBSCRIPTION_STATUS, 
  getClientPlanById,
  formatPrice
} from '../constants/membershipPlans';

export const useClientMembership = (clienteId) => {
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [puntos, setPuntos] = useState(0);
  const [beneficios, setBeneficios] = useState([]);

  // Cargar membresía del cliente
  useEffect(() => {
    if (!clienteId) {
      setLoading(false);
      return;
    }

    const loadMembership = async () => {
      try {
        setLoading(true);
        
        // Buscar membresía existente
        const membershipRef = doc(db, 'membresias_clientes', clienteId);
        const membershipSnap = await getDoc(membershipRef);

        if (membershipSnap.exists()) {
          const membershipData = { id: membershipSnap.id, ...membershipSnap.data() };
          setMembership(membershipData);
          setPuntos(membershipData.puntos || 0);
          setBeneficios(membershipData.beneficios || []);
        } else {
          // Crear membresía básica por defecto
          const defaultMembership = {
            clienteId,
            planId: 'basic',
            status: SUBSCRIPTION_STATUS.ACTIVE,
            puntos: 0,
            nivel: 'basico',
            beneficios: getClientPlanById('basic').features || [],
            fechaCreacion: new Date(),
            fechaUltimaActividad: new Date(),
            historialActividad: [],
            ofertasCanjeadas: [],
            serviciosRealizados: 0,
            ahorroTotal: 0
          };

          await setDoc(membershipRef, defaultMembership);
          setMembership(defaultMembership);
          setPuntos(0);
          setBeneficios(defaultMembership.beneficios);
        }
      } catch (err) {
        console.error('Error loading client membership:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMembership();
  }, [clienteId]);

  // Actualizar puntos del cliente
  const updatePuntos = async (nuevosPuntos, razon) => {
    try {
      if (!membership) return;

      const puntosAnteriores = membership.puntos;
      const puntosTotales = puntosAnteriores + nuevosPuntos;
      
      // Determinar nuevo nivel basado en puntos
      const nuevoNivel = calcularNivel(puntosTotales);
      const nuevosBeneficios = getClientPlanById(nuevoNivel).features || [];

      const updateData = {
        puntos: puntosTotales,
        nivel: nuevoNivel,
        beneficios: nuevosBeneficios,
        fechaUltimaActividad: new Date(),
        historialActividad: [
          ...(membership.historialActividad || []),
          {
            fecha: new Date(),
            accion: razon,
            puntosGanados: nuevosPuntos,
            puntosAnteriores,
            puntosTotales
          }
        ]
      };

      const membershipRef = doc(db, 'membresias_clientes', clienteId);
      await updateDoc(membershipRef, updateData);
      
      setMembership(prev => ({ ...prev, ...updateData }));
      setPuntos(puntosTotales);
      setBeneficios(nuevosBeneficios);

      return { success: true, nuevoNivel, puntosTotales };
    } catch (err) {
      console.error('Error updating points:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Calcular nivel basado en puntos
  const calcularNivel = (puntos) => {
    if (puntos >= 500) return 'premium';
    if (puntos >= 200) return 'intermedio';
    return 'basico';
  };

  // Canjear oferta
  const canjearOferta = async (ofertaId, puntosRequeridos) => {
    try {
      if (!membership || membership.puntos < puntosRequeridos) {
        return { success: false, error: 'Puntos insuficientes' };
      }

      const nuevosPuntos = membership.puntos - puntosRequeridos;
      const nuevoNivel = calcularNivel(nuevosPuntos);
      const nuevosBeneficios = getClientPlanById(nuevoNivel).features || [];

      const updateData = {
        puntos: nuevosPuntos,
        nivel: nuevoNivel,
        beneficios: nuevosBeneficios,
        ofertasCanjeadas: [
          ...(membership.ofertasCanjeadas || []),
          {
            ofertaId,
            fechaCanje: new Date(),
            puntosGastados: puntosRequeridos
          }
        ],
        fechaUltimaActividad: new Date()
      };

      const membershipRef = doc(db, 'membresias_clientes', clienteId);
      await updateDoc(membershipRef, updateData);
      
      setMembership(prev => ({ ...prev, ...updateData }));
      setPuntos(nuevosPuntos);
      setBeneficios(nuevosBeneficios);

      return { success: true, puntosRestantes: nuevosPuntos };
    } catch (err) {
      console.error('Error redeeming offer:', err);
      return { success: false, error: err.message };
    }
  };

  // Registrar servicio realizado
  const registrarServicio = async (servicioData) => {
    try {
      if (!membership) return;

      const puntosGanados = calcularPuntosServicio(servicioData);
      const ahorroEstimado = calcularAhorro(servicioData);

      const updateData = {
        serviciosRealizados: (membership.serviciosRealizados || 0) + 1,
        ahorroTotal: (membership.ahorroTotal || 0) + ahorroEstimado,
        fechaUltimaActividad: new Date()
      };

      const membershipRef = doc(db, 'membresias_clientes', clienteId);
      await updateDoc(membershipRef, updateData);

      // Actualizar puntos
      await updatePuntos(puntosGanados, `Servicio realizado: ${servicioData.tipo}`);

      setMembership(prev => ({ ...prev, ...updateData }));

      return { success: true, puntosGanados, ahorroEstimado };
    } catch (err) {
      console.error('Error registering service:', err);
      return { success: false, error: err.message };
    }
  };

  // Calcular puntos por servicio
  const calcularPuntosServicio = (servicioData) => {
    let puntosBase = 10; // Puntos base por servicio
    
    // Bonificaciones por tipo de servicio
    switch (servicioData.tipo) {
      case 'mantenimiento':
        puntosBase += 15;
        break;
      case 'reparacion':
        puntosBase += 25;
        break;
      case 'diagnostico':
        puntosBase += 5;
        break;
      default:
        puntosBase += 10;
    }

    // Bonificación por monto
    if (servicioData.monto > 100000) puntosBase += 20;
    else if (servicioData.monto > 50000) puntosBase += 10;

    // Bonificación por empresa premium
    if (servicioData.empresaPremium) puntosBase += 15;

    return puntosBase;
  };

  // Calcular ahorro estimado
  const calcularAhorro = (servicioData) => {
    const descuentoBase = membership?.nivel === 'premium' ? 0.20 : 
                         membership?.nivel === 'intermedio' ? 0.10 : 0.05;
    
    return Math.round(servicioData.monto * descuentoBase);
  };

  // Obtener plan actual
  const getCurrentPlan = () => {
    if (!membership) return CLIENT_MEMBERSHIP_PLANS.BASIC;
    return getClientPlanById(membership.nivel);
  };

  // Obtener progreso hacia el siguiente nivel
  const getProgressToNextLevel = () => {
    if (!membership) return { current: 0, target: 200, percentage: 0 };

    const niveles = [
      { nivel: 'basico', puntos: 0 },
      { nivel: 'intermedio', puntos: 200 },
      { nivel: 'premium', puntos: 500 }
    ];

    const currentIndex = niveles.findIndex(n => n.nivel === membership.nivel);
    const nextIndex = currentIndex + 1;

    if (nextIndex >= niveles.length) {
      return { current: membership.puntos, target: membership.puntos, percentage: 100 };
    }

    const current = membership.puntos;
    const target = niveles[nextIndex].puntos;
    const percentage = Math.min((current / target) * 100, 100);

    return { current, target, percentage, nextLevel: niveles[nextIndex].nivel };
  };

  // Verificar si puede acceder a beneficio
  const canAccessBenefit = (benefitKey) => {
    if (!membership) return false;
    
    // Beneficios especiales que requieren nivel premium
    const premiumBenefits = ['consultaVehiculo', 'gestionGastos', 'personalizedPromos', 'autoReminders', 'exclusiveEvents', 'advisorAccess', 'specialDiscounts'];
    
    if (premiumBenefits.includes(benefitKey)) {
      return membership.nivel === 'premium';
    }
    
    const plan = getCurrentPlan();
    return plan.limitations[benefitKey] === true;
  };

  // Obtener ofertas disponibles
  const getAvailableOffers = async () => {
    try {
      // Por ahora usar datos de prueba
      const { getOffersByMembershipLevel } = await import('../utils/mockOffers');
      return getOffersByMembershipLevel(membership?.nivel || 'basico', membership?.puntos || 0);
      
      // TODO: Implementar con Firestore cuando esté listo
      // const ofertasQuery = query(
      //   collection(db, 'ofertas_exclusivas'),
      //   where('activa', '==', true),
      //   where('puntosRequeridos', '<=', membership?.puntos || 0)
      // );
      // 
      // const ofertasSnapshot = await getDocs(ofertasQuery);
      // return ofertasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error getting offers:', err);
      return [];
    }
  };

  // Obtener historial de actividad
  const getActivityHistory = () => {
    if (!membership) return [];
    return membership.historialActividad || [];
  };

  // Obtener estadísticas de membresía
  const getMembershipStats = () => {
    if (!membership) return null;

    return {
      nivel: membership.nivel,
      puntos: membership.puntos,
      serviciosRealizados: membership.serviciosRealizados || 0,
      ahorroTotal: membership.ahorroTotal || 0,
      ofertasCanjeadas: membership.ofertasCanjeadas?.length || 0,
      fechaCreacion: membership.fechaCreacion,
      fechaUltimaActividad: membership.fechaUltimaActividad,
      progreso: getProgressToNextLevel()
    };
  };

  return {
    membership,
    loading,
    error,
    puntos,
    beneficios,
    updatePuntos,
    canjearOferta,
    registrarServicio,
    getCurrentPlan,
    getProgressToNextLevel,
    canAccessBenefit,
    getAvailableOffers,
    getActivityHistory,
    getMembershipStats
  };
};
