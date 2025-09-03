// Servicio de Pagos y Suscripciones AV 10 de Julio
// Basado en el documento del proyecto - Monetización

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';

export class PaymentService {
  
  // Estados de suscripción según el documento
  static SUBSCRIPTION_STATUS = {
    ACTIVE: 'activa',
    EXPIRED: 'expirada',
    CANCELLED: 'cancelada',
    PENDING: 'pendiente',
    TRIAL: 'en_prueba',
    PAST_DUE: 'vencida',
    SUSPENDED: 'suspendida'
  };

  // Tipos de pago
  static PAYMENT_TYPES = {
    SUBSCRIPTION: 'suscripcion',
    ONE_TIME: 'pago_unico',
    UPGRADE: 'upgrade',
    RENEWAL: 'renovacion',
    REFUND: 'reembolso'
  };

  // Estados de pago
  static PAYMENT_STATUS = {
    PENDING: 'pendiente',
    PROCESSING: 'procesando',
    COMPLETED: 'completado',
    FAILED: 'fallido',
    CANCELLED: 'cancelado',
    REFUNDED: 'reembolsado'
  };

  // Métodos de pago
  static PAYMENT_METHODS = {
    CREDIT_CARD: 'tarjeta_credito',
    DEBIT_CARD: 'tarjeta_debito',
    BANK_TRANSFER: 'transferencia_bancaria',
    WEBPAY: 'webpay',
    PAYPAL: 'paypal',
    CASH: 'efectivo'
  };

  // Ciclos de facturación
  static BILLING_CYCLES = {
    MONTHLY: 'mensual',
    YEARLY: 'anual',
    QUARTERLY: 'trimestral',
    SEMI_ANNUAL: 'semestral'
  };

  /**
   * Crear nueva suscripción
   */
  static async createSubscription(userId, planData, paymentData) {
    try {
      const suscripcion = {
        userId,
        planId: planData.id,
        planName: planData.name,
        precio: planData.price,
        moneda: planData.currency || 'CLP',
        cicloFacturacion: paymentData.billingCycle || this.BILLING_CYCLES.MONTHLY,
        fechaInicio: serverTimestamp(),
        fechaProximoPago: this.calculateNextPaymentDate(paymentData.billingCycle),
        estado: this.SUBSCRIPTION_STATUS.ACTIVE,
        metodoPago: paymentData.paymentMethod,
        datosPago: paymentData.paymentDetails,
        historialPagos: [],
        beneficios: planData.features || [],
        limitaciones: planData.limitations || {},
        trialDays: planData.trialDays || 0,
        esTrial: planData.trialDays > 0
      };

      const docRef = await addDoc(collection(db, 'suscripciones'), suscripcion);
      console.log('✅ Suscripción creada:', docRef.id);
      
      // Crear primer pago
      await this.createPayment(docRef.id, {
        monto: planData.price,
        moneda: planData.currency || 'CLP',
        tipo: this.PAYMENT_TYPES.SUBSCRIPTION,
        metodo: paymentData.paymentMethod,
        datos: paymentData.paymentDetails,
        descripcion: `Suscripción ${planData.name}`
      });

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error creando suscripción:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calcular fecha del próximo pago
   */
  static calculateNextPaymentDate(billingCycle) {
    const fechaActual = new Date();
    let fechaProximoPago = new Date(fechaActual);

    switch (billingCycle) {
      case this.BILLING_CYCLES.MONTHLY:
        fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1);
        break;
      case this.BILLING_CYCLES.QUARTERLY:
        fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 3);
        break;
      case this.BILLING_CYCLES.SEMI_ANNUAL:
        fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 6);
        break;
      case this.BILLING_CYCLES.YEARLY:
        fechaProximoPago.setFullYear(fechaProximoPago.getFullYear() + 1);
        break;
      default:
        fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1);
    }

    return Timestamp.fromDate(fechaProximoPago);
  }

  /**
   * Crear pago
   */
  static async createPayment(suscripcionId, paymentData) {
    try {
      const pago = {
        suscripcionId,
        monto: paymentData.monto,
        moneda: paymentData.moneda || 'CLP',
        tipo: paymentData.tipo,
        metodo: paymentData.metodo,
        datos: paymentData.datos,
        descripcion: paymentData.descripcion,
        fechaCreacion: serverTimestamp(),
        estado: this.PAYMENT_STATUS.PENDING,
        referencia: paymentData.referencia || null,
        comprobante: paymentData.comprobante || null
      };

      const docRef = await addDoc(collection(db, 'pagos'), pago);
      console.log('✅ Pago creado:', docRef.id);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error creando pago:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Procesar pago
   */
  static async processPayment(pagoId, resultado) {
    try {
      const pagoRef = doc(db, 'pagos', pagoId);
      
      await updateDoc(pagoRef, {
        estado: resultado.exitoso ? this.PAYMENT_STATUS.COMPLETED : this.PAYMENT_STATUS.FAILED,
        fechaProcesamiento: serverTimestamp(),
        resultado: resultado,
        transaccionId: resultado.transaccionId || null
      });

      // Si el pago fue exitoso, actualizar la suscripción
      if (resultado.exitoso) {
        const pagoDoc = await getDoc(pagoRef);
        const pago = pagoDoc.data();
        
        await this.updateSubscriptionAfterPayment(pago.suscripcionId, pago);
      }

      console.log('✅ Pago procesado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar suscripción después del pago exitoso
   */
  static async updateSubscriptionAfterPayment(suscripcionId, pago) {
    try {
      const suscripcionRef = doc(db, 'suscripciones', suscripcionId);
      const suscripcionDoc = await getDoc(suscripcionRef);
      
      if (!suscripcionDoc.exists()) {
        throw new Error('Suscripción no encontrada');
      }

      const suscripcion = suscripcionDoc.data();
      
      // Agregar pago al historial
      await updateDoc(suscripcionRef, {
        historialPagos: arrayUnion({
          pagoId: pago.id,
          monto: pago.monto,
          fecha: pago.fechaCreacion,
          estado: pago.estado
        }),
        ultimoPago: pago.fechaCreacion,
        proximoPago: this.calculateNextPaymentDate(suscripcion.cicloFacturacion)
      });

      console.log('✅ Suscripción actualizada después del pago');
      return { success: true };
    } catch (error) {
      console.error('❌ Error actualizando suscripción:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener suscripciones de un usuario
   */
  static async getUserSubscriptions(userId, estado = null) {
    try {
      let q = query(
        collection(db, 'suscripciones'),
        where('userId', '==', userId),
        orderBy('fechaCreacion', 'desc')
      );

      if (estado) {
        q = query(q, where('estado', '==', estado));
      }

      const snapshot = await getDocs(q);
      const suscripciones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, suscripciones };
    } catch (error) {
      console.error('❌ Error obteniendo suscripciones:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener suscripción activa de un usuario
   */
  static async getActiveSubscription(userId) {
    try {
      const q = query(
        collection(db, 'suscripciones'),
        where('userId', '==', userId),
        where('estado', '==', this.SUBSCRIPTION_STATUS.ACTIVE),
        orderBy('fechaCreacion', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { success: true, suscripcion: null };
      }

      const suscripcion = {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };

      return { success: true, suscripcion };
    } catch (error) {
      console.error('❌ Error obteniendo suscripción activa:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancelar suscripción
   */
  static async cancelSubscription(suscripcionId, motivo = '') {
    try {
      const suscripcionRef = doc(db, 'suscripciones', suscripcionId);
      
      await updateDoc(suscripcionRef, {
        estado: this.SUBSCRIPTION_STATUS.CANCELLED,
        fechaCancelacion: serverTimestamp(),
        motivoCancelacion: motivo
      });

      console.log('✅ Suscripción cancelada');
      return { success: true };
    } catch (error) {
      console.error('❌ Error cancelando suscripción:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Renovar suscripción
   */
  static async renewSubscription(suscripcionId, paymentData) {
    try {
      const suscripcionRef = doc(db, 'suscripciones', suscripcionId);
      const suscripcionDoc = await getDoc(suscripcionRef);
      
      if (!suscripcionDoc.exists()) {
        throw new Error('Suscripción no encontrada');
      }

      const suscripcion = suscripcionDoc.data();
      
      // Crear nuevo pago
      const pago = await this.createPayment(suscripcionId, {
        monto: suscripcion.precio,
        moneda: suscripcion.moneda,
        tipo: this.PAYMENT_TYPES.RENEWAL,
        metodo: paymentData.paymentMethod,
        datos: paymentData.paymentDetails,
        descripcion: `Renovación ${suscripcion.planName}`
      });

      if (pago.success) {
        // Actualizar suscripción
        await updateDoc(suscripcionRef, {
          estado: this.SUBSCRIPTION_STATUS.ACTIVE,
          fechaRenovacion: serverTimestamp(),
          proximoPago: this.calculateNextPaymentDate(suscripcion.cicloFacturacion)
        });
      }

      console.log('✅ Suscripción renovada');
      return { success: true };
    } catch (error) {
      console.error('❌ Error renovando suscripción:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upgrade de suscripción
   */
  static async upgradeSubscription(suscripcionId, nuevoPlan, paymentData) {
    try {
      const suscripcionRef = doc(db, 'suscripciones', suscripcionId);
      const suscripcionDoc = await getDoc(suscripcionRef);
      
      if (!suscripcionDoc.exists()) {
        throw new Error('Suscripción no encontrada');
      }

      const suscripcion = suscripcionDoc.data();
      
      // Calcular diferencia de precio
      const diferenciaPrecio = nuevoPlan.price - suscripcion.precio;
      
      if (diferenciaPrecio > 0) {
        // Crear pago por la diferencia
        const pago = await this.createPayment(suscripcionId, {
          monto: diferenciaPrecio,
          moneda: suscripcion.moneda,
          tipo: this.PAYMENT_TYPES.UPGRADE,
          metodo: paymentData.paymentMethod,
          datos: paymentData.paymentDetails,
          descripcion: `Upgrade a ${nuevoPlan.name}`
        });

        if (!pago.success) {
          throw new Error('Error creando pago por upgrade');
        }
      }

      // Actualizar suscripción
      await updateDoc(suscripcionRef, {
        planId: nuevoPlan.id,
        planName: nuevoPlan.name,
        precio: nuevoPlan.price,
        beneficios: nuevoPlan.features || [],
        limitaciones: nuevoPlan.limitations || {},
        fechaUpgrade: serverTimestamp(),
        upgradeAnterior: {
          planId: suscripcion.planId,
          planName: suscripcion.planName,
          precio: suscripcion.precio
        }
      });

      console.log('✅ Suscripción actualizada');
      return { success: true };
    } catch (error) {
      console.error('❌ Error actualizando suscripción:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener historial de pagos de una suscripción
   */
  static async getSubscriptionPaymentHistory(suscripcionId) {
    try {
      const q = query(
        collection(db, 'pagos'),
        where('suscripcionId', '==', suscripcionId),
        orderBy('fechaCreacion', 'desc')
      );

      const snapshot = await getDocs(q);
      const pagos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, pagos };
    } catch (error) {
      console.error('❌ Error obteniendo historial de pagos:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear factura
   */
  static async createInvoice(suscripcionId, pagoId) {
    try {
      const pagoDoc = await getDoc(doc(db, 'pagos', pagoId));
      const suscripcionDoc = await getDoc(doc(db, 'suscripciones', suscripcionId));
      
      if (!pagoDoc.exists() || !suscripcionDoc.exists()) {
        throw new Error('Pago o suscripción no encontrada');
      }

      const pago = pagoDoc.data();
      const suscripcion = suscripcionDoc.data();

      const factura = {
        numero: this.generateInvoiceNumber(),
        suscripcionId,
        pagoId,
        userId: suscripcion.userId,
        monto: pago.monto,
        moneda: pago.moneda,
        descripcion: `Factura por ${suscripcion.planName}`,
        fechaCreacion: serverTimestamp(),
        fechaVencimiento: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 días
        estado: 'emitida',
        items: [
          {
            descripcion: suscripcion.planName,
            cantidad: 1,
            precioUnitario: pago.monto,
            total: pago.monto
          }
        ],
        subtotal: pago.monto,
        impuestos: 0,
        total: pago.monto
      };

      const docRef = await addDoc(collection(db, 'facturas'), factura);
      console.log('✅ Factura creada:', docRef.id);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error creando factura:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generar número de factura
   */
  static generateInvoiceNumber() {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const numero = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `FAC-${año}${mes}-${numero}`;
  }

  /**
   * Obtener estadísticas de pagos
   */
  static async getPaymentStats(empresaId = null) {
    try {
      let q = collection(db, 'pagos');
      
      if (empresaId) {
        // Filtrar por empresa si es necesario
        q = query(q, where('empresaId', '==', empresaId));
      }

      const snapshot = await getDocs(q);
      const pagos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const stats = {
        total: pagos.length,
        porEstado: {},
        porTipo: {},
        porMetodo: {},
        montoTotal: 0,
        montoPromedio: 0,
        pagosExitosos: 0,
        pagosFallidos: 0
      };

      let montoTotal = 0;
      let pagosExitosos = 0;

      pagos.forEach(pago => {
        // Contar por estado
        if (!stats.porEstado[pago.estado]) {
          stats.porEstado[pago.estado] = 0;
        }
        stats.porEstado[pago.estado]++;

        // Contar por tipo
        if (!stats.porTipo[pago.tipo]) {
          stats.porTipo[pago.tipo] = 0;
        }
        stats.porTipo[pago.tipo]++;

        // Contar por método
        if (!stats.porMetodo[pago.metodo]) {
          stats.porMetodo[pago.metodo] = 0;
        }
        stats.porMetodo[pago.metodo]++;

        // Sumar montos
        montoTotal += pago.monto;

        // Contar pagos exitosos
        if (pago.estado === this.PAYMENT_STATUS.COMPLETED) {
          pagosExitosos++;
        }
      });

      stats.montoTotal = montoTotal;
      stats.montoPromedio = pagos.length > 0 ? montoTotal / pagos.length : 0;
      stats.pagosExitosos = pagosExitosos;
      stats.pagosFallidos = pagos.length - pagosExitosos;

      return { success: true, stats };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de pagos:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear reembolso
   */
  static async createRefund(pagoId, motivo, montoReembolso) {
    try {
      const pagoRef = doc(db, 'pagos', pagoId);
      const pagoDoc = await getDoc(pagoRef);
      
      if (!pagoDoc.exists()) {
        throw new Error('Pago no encontrado');
      }

      const pago = pagoDoc.data();
      
      // Crear registro de reembolso
      const reembolso = await addDoc(collection(db, 'reembolsos'), {
        pagoId,
        montoOriginal: pago.monto,
        montoReembolso,
        motivo,
        fechaCreacion: serverTimestamp(),
        estado: 'pendiente'
      });

      // Actualizar estado del pago
      await updateDoc(pagoRef, {
        estado: this.PAYMENT_STATUS.REFUNDED,
        reembolsoId: reembolso.id
      });

      console.log('✅ Reembolso creado');
      return { success: true, id: reembolso.id };
    } catch (error) {
      console.error('❌ Error creando reembolso:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar si una suscripción está activa
   */
  static async isSubscriptionActive(userId) {
    try {
      const suscripcion = await this.getActiveSubscription(userId);
      
      if (!suscripcion.success || !suscripcion.suscripcion) {
        return { success: true, activa: false };
      }

      const ahora = new Date();
      const proximoPago = suscripcion.suscripcion.proximoPago.toDate();
      
      return { 
        success: true, 
        activa: ahora <= proximoPago,
        diasRestantes: Math.ceil((proximoPago - ahora) / (1000 * 60 * 60 * 24))
      };
    } catch (error) {
      console.error('❌ Error verificando suscripción activa:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== MÉTODOS PARA LOS COMPONENTES DEL DASHBOARD =====

  /**
   * Obtener métodos de pago de una empresa
   */
  static async getPaymentMethods(empresaId) {
    try {
      // Simular datos para desarrollo
      const mockMethods = [
        {
          id: '1',
          type: 'credit_card',
          brand: 'visa',
          last4: '4242',
          cardholderName: 'Juan Pérez',
          expiryDate: '12/25',
          isDefault: true,
          empresaId
        },
        {
          id: '2',
          type: 'credit_card',
          brand: 'mastercard',
          last4: '8888',
          cardholderName: 'Juan Pérez',
          expiryDate: '06/26',
          isDefault: false,
          empresaId
        }
      ];

      return mockMethods;
    } catch (error) {
      console.error('Error getting payment methods:', error);
      return [];
    }
  }

  /**
   * Agregar método de pago
   */
  static async addPaymentMethod(methodData) {
    try {
      // Simular operación para desarrollo
      const newMethod = {
        id: Date.now().toString(),
        ...methodData,
        createdAt: new Date()
      };

      return { success: true, paymentMethod: newMethod };
    } catch (error) {
      console.error('Error adding payment method:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Eliminar método de pago
   */
  static async removePaymentMethod(methodId) {
    try {
      // Simular operación para desarrollo
      return { success: true };
    } catch (error) {
      console.error('Error removing payment method:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Establecer método de pago predeterminado
   */
  static async setDefaultPaymentMethod(empresaId, methodId) {
    try {
      // Simular operación para desarrollo
      return { success: true };
    } catch (error) {
      console.error('Error setting default payment method:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener historial de transacciones
   */
  static async getTransactionHistory(empresaId, filters = {}) {
    try {
      // Simular datos para desarrollo
      const mockTransactions = [
        {
          id: 'txn_001',
          description: 'Suscripción Premium Mensual',
          type: 'subscription',
          amount: 29990,
          currency: 'CLP',
          status: 'completed',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          fee: 1499
        },
        {
          id: 'txn_002',
          description: 'Upgrade a Plan Enterprise',
          type: 'upgrade',
          amount: 50000,
          currency: 'CLP',
          status: 'completed',
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          fee: 2500
        },
        {
          id: 'txn_003',
          description: 'Renovación Suscripción Premium',
          type: 'renewal',
          amount: 29990,
          currency: 'CLP',
          status: 'pending',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          fee: 1499
        }
      ];

      return mockTransactions;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  /**
   * Obtener facturas de una empresa
   */
  static async getInvoices(empresaId, filters = {}) {
    try {
      // Simular datos para desarrollo
      const mockInvoices = [
        {
          id: 'inv_001',
          number: 'FAC-202412-0001',
          description: 'Suscripción Premium Diciembre 2024',
          type: 'subscription',
          amount: 29990,
          currency: 'CLP',
          tax: 5698,
          status: 'paid',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          paymentMethod: {
            type: 'credit_card',
            last4: '4242'
          }
        },
        {
          id: 'inv_002',
          number: 'FAC-202412-0002',
          description: 'Upgrade a Plan Enterprise',
          type: 'upgrade',
          amount: 50000,
          currency: 'CLP',
          tax: 9500,
          status: 'paid',
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          paymentMethod: {
            type: 'credit_card',
            last4: '4242'
          }
        },
        {
          id: 'inv_003',
          number: 'FAC-202412-0003',
          description: 'Suscripción Premium Enero 2025',
          type: 'subscription',
          amount: 29990,
          currency: 'CLP',
          tax: 5698,
          status: 'pending',
          date: new Date(Date.now()),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ];

      return mockInvoices;
    } catch (error) {
      console.error('Error getting invoices:', error);
      return [];
    }
  }

  /**
   * Descargar factura
   */
  static async downloadInvoice(invoiceId) {
    try {
      // Simular operación para desarrollo
      return { success: true };
    } catch (error) {
      console.error('Error downloading invoice:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar factura por email
   */
  static async sendInvoice(invoiceId) {
    try {
      // Simular operación para desarrollo
      return { success: true };
    } catch (error) {
      console.error('Error sending invoice:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener planes de suscripción disponibles
   */
  static async getSubscriptionPlans() {
    try {
      // Simular datos para desarrollo
      const mockPlans = [
        {
          id: 'basic',
          name: 'Plan Básico',
          tier: 'basic',
          price: 0,
          originalPrice: 0,
          currency: 'CLP',
          billingCycle: 'monthly',
          popular: false
        },
        {
          id: 'premium',
          name: 'Plan Premium',
          tier: 'premium',
          price: 29990,
          originalPrice: 29990,
          currency: 'CLP',
          billingCycle: 'monthly',
          popular: true
        },
        {
          id: 'enterprise',
          name: 'Plan Enterprise',
          tier: 'enterprise',
          price: 99990,
          originalPrice: 99990,
          currency: 'CLP',
          billingCycle: 'monthly',
          popular: false
        }
      ];

      return mockPlans;
    } catch (error) {
      console.error('Error getting subscription plans:', error);
      return [];
    }
  }

  /**
   * Actualizar suscripción (upgrade/downgrade)
   */
  static async upgradeSubscription(empresaId, planId) {
    try {
      // Simular operación para desarrollo
      return { success: true };
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      return { success: false, error: error.message };
    }
  }
}

export default PaymentService;
