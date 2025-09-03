// Servicio de Recordatorios Automáticos AV 10 de Julio
// Basado en el documento del proyecto - Beneficios para Clientes

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
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export class ReminderService {
  
  // Tipos de recordatorios según el documento
  static REMINDER_TYPES = {
    MAINTENANCE: 'mantenimiento',
    TECHNICAL_REVIEW: 'revision_tecnica',
    INSURANCE: 'seguro',
    LICENSE: 'licencia',
    TIRE_CHANGE: 'cambio_neumaticos',
    OIL_CHANGE: 'cambio_aceite',
    BRAKE_CHECK: 'revision_frenos',
    FILTER_CHANGE: 'cambio_filtros',
    CUSTOM: 'personalizado'
  };

  // Frecuencias de recordatorios
  static FREQUENCIES = {
    DAILY: 'diario',
    WEEKLY: 'semanal',
    MONTHLY: 'mensual',
    QUARTERLY: 'trimestral',
    SEMI_ANNUAL: 'semestral',
    ANNUAL: 'anual',
    CUSTOM: 'personalizado'
  };

  // Estados del recordatorio
  static STATUS = {
    ACTIVE: 'activo',
    COMPLETED: 'completado',
    CANCELLED: 'cancelado',
    EXPIRED: 'expirado'
  };

  /**
   * Crear un nuevo recordatorio
   */
  static async createReminder(reminderData) {
    try {
      const reminder = {
        ...reminderData,
        fechaCreacion: serverTimestamp(),
        estado: this.STATUS.ACTIVE,
        notificacionesEnviadas: 0,
        ultimaNotificacion: null
      };

      const docRef = await addDoc(collection(db, 'recordatorios'), reminder);
      console.log('✅ Recordatorio creado:', docRef.id);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error creando recordatorio:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear recordatorios automáticos basados en el vehículo del cliente
   */
  static async createAutomaticReminders(clienteId, vehiculoData) {
    try {
      const recordatorios = [];
      const fechaActual = new Date();

      // Recordatorio de cambio de aceite (cada 5,000 km o 6 meses)
      if (vehiculoData.kilometraje) {
        const proximoCambioAceite = vehiculoData.kilometraje + 5000;
        recordatorios.push({
          clienteId,
          vehiculoId: vehiculoData.id,
          tipo: this.REMINDER_TYPES.OIL_CHANGE,
          titulo: 'Cambio de Aceite',
          descripcion: `Cambio de aceite recomendado a los ${proximoCambioAceite.toLocaleString()} km`,
          fechaLimite: Timestamp.fromDate(new Date(fechaActual.getTime() + 6 * 30 * 24 * 60 * 60 * 1000)),
          kilometrajeLimite: proximoCambioAceite,
          frecuencia: this.FREQUENCIES.CUSTOM,
          prioridad: 'alta',
          empresaId: vehiculoData.empresaId || null
        });
      }

      // Recordatorio de revisión técnica (anual)
      if (vehiculoData.fechaRevisionTecnica) {
        const fechaRevision = vehiculoData.fechaRevisionTecnica.toDate();
        const proximaRevision = new Date(fechaRevision);
        proximaRevision.setFullYear(proximaRevision.getFullYear() + 1);
        
        recordatorios.push({
          clienteId,
          vehiculoId: vehiculoData.id,
          tipo: this.REMINDER_TYPES.TECHNICAL_REVIEW,
          titulo: 'Revisión Técnica',
          descripcion: 'Revisión técnica anual obligatoria',
          fechaLimite: Timestamp.fromDate(proximaRevision),
          frecuencia: this.FREQUENCIES.ANNUAL,
          prioridad: 'alta',
          empresaId: vehiculoData.empresaId || null
        });
      }

      // Recordatorio de cambio de neumáticos (cada 40,000 km o 4 años)
      if (vehiculoData.kilometraje) {
        const proximoCambioNeumaticos = vehiculoData.kilometraje + 40000;
        recordatorios.push({
          clienteId,
          vehiculoId: vehiculoData.id,
          tipo: this.REMINDER_TYPES.TIRE_CHANGE,
          titulo: 'Cambio de Neumáticos',
          descripcion: `Cambio de neumáticos recomendado a los ${proximoCambioNeumaticos.toLocaleString()} km`,
          fechaLimite: Timestamp.fromDate(new Date(fechaActual.getTime() + 4 * 365 * 24 * 60 * 60 * 1000)),
          kilometrajeLimite: proximoCambioNeumaticos,
          frecuencia: this.FREQUENCIES.CUSTOM,
          prioridad: 'media',
          empresaId: vehiculoData.empresaId || null
        });
      }

      // Recordatorio de revisión de frenos (cada 20,000 km)
      if (vehiculoData.kilometraje) {
        const proximaRevisionFrenos = vehiculoData.kilometraje + 20000;
        recordatorios.push({
          clienteId,
          vehiculoId: vehiculoData.id,
          tipo: this.REMINDER_TYPES.BRAKE_CHECK,
          titulo: 'Revisión de Frenos',
          descripcion: `Revisión de sistema de frenos a los ${proximaRevisionFrenos.toLocaleString()} km`,
          fechaLimite: Timestamp.fromDate(new Date(fechaActual.getTime() + 3 * 30 * 24 * 60 * 60 * 1000)),
          kilometrajeLimite: proximaRevisionFrenos,
          frecuencia: this.FREQUENCIES.CUSTOM,
          prioridad: 'alta',
          empresaId: vehiculoData.empresaId || null
        });
      }

      // Crear todos los recordatorios
      const resultados = [];
      for (const recordatorio of recordatorios) {
        const resultado = await this.createReminder(recordatorio);
        resultados.push(resultado);
      }

      console.log(`✅ ${resultados.filter(r => r.success).length} recordatorios automáticos creados`);
      return { success: true, recordatorios: resultados };
    } catch (error) {
      console.error('❌ Error creando recordatorios automáticos:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener recordatorios de un cliente
   */
  static async getClientReminders(clienteId, estado = null) {
    try {
      let q = query(
        collection(db, 'recordatorios'),
        where('clienteId', '==', clienteId),
        orderBy('fechaLimite', 'asc')
      );

      if (estado) {
        q = query(q, where('estado', '==', estado));
      }

      const snapshot = await getDocs(q);
      const recordatorios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, recordatorios };
    } catch (error) {
      console.error('❌ Error obteniendo recordatorios:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener recordatorios próximos a vencer (para notificaciones)
   */
  static async getUpcomingReminders(diasAnticipacion = 7) {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion);

      const q = query(
        collection(db, 'recordatorios'),
        where('estado', '==', this.STATUS.ACTIVE),
        where('fechaLimite', '<=', Timestamp.fromDate(fechaLimite)),
        orderBy('fechaLimite', 'asc')
      );

      const snapshot = await getDocs(q);
      const recordatorios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, recordatorios };
    } catch (error) {
      console.error('❌ Error obteniendo recordatorios próximos:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Marcar recordatorio como completado
   */
  static async completeReminder(recordatorioId, datosCompletado = {}) {
    try {
      const recordatorioRef = doc(db, 'recordatorios', recordatorioId);
      await updateDoc(recordatorioRef, {
        estado: this.STATUS.COMPLETED,
        fechaCompletado: serverTimestamp(),
        datosCompletado: {
          ...datosCompletado,
          completadoPor: datosCompletado.completadoPor || 'cliente'
        }
      });

      console.log('✅ Recordatorio marcado como completado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error completando recordatorio:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancelar recordatorio
   */
  static async cancelReminder(recordatorioId, motivo = '') {
    try {
      const recordatorioRef = doc(db, 'recordatorios', recordatorioId);
      await updateDoc(recordatorioRef, {
        estado: this.STATUS.CANCELLED,
        fechaCancelacion: serverTimestamp(),
        motivoCancelacion: motivo
      });

      console.log('✅ Recordatorio cancelado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error cancelando recordatorio:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar recordatorio
   */
  static async updateReminder(recordatorioId, datosActualizacion) {
    try {
      const recordatorioRef = doc(db, 'recordatorios', recordatorioId);
      await updateDoc(recordatorioRef, {
        ...datosActualizacion,
        fechaActualizacion: serverTimestamp()
      });

      console.log('✅ Recordatorio actualizado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error actualizando recordatorio:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Eliminar recordatorio
   */
  static async deleteReminder(recordatorioId) {
    try {
      await deleteDoc(doc(db, 'recordatorios', recordatorioId));
      console.log('✅ Recordatorio eliminado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error eliminando recordatorio:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear recordatorio personalizado
   */
  static async createCustomReminder(clienteId, vehiculoId, datos) {
    try {
      const recordatorio = {
        clienteId,
        vehiculoId,
        tipo: this.REMINDER_TYPES.CUSTOM,
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        fechaLimite: Timestamp.fromDate(new Date(datos.fechaLimite)),
        frecuencia: datos.frecuencia || this.FREQUENCIES.CUSTOM,
        prioridad: datos.prioridad || 'media',
        empresaId: datos.empresaId || null,
        kilometrajeLimite: datos.kilometrajeLimite || null,
        notas: datos.notas || ''
      };

      return await this.createReminder(recordatorio);
    } catch (error) {
      console.error('❌ Error creando recordatorio personalizado:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener estadísticas de recordatorios de un cliente
   */
  static async getClientReminderStats(clienteId) {
    try {
      const recordatorios = await this.getClientReminders(clienteId);
      
      if (!recordatorios.success) {
        return recordatorios;
      }

      const stats = {
        total: recordatorios.recordatorios.length,
        activos: recordatorios.recordatorios.filter(r => r.estado === this.STATUS.ACTIVE).length,
        completados: recordatorios.recordatorios.filter(r => r.estado === this.STATUS.COMPLETED).length,
        cancelados: recordatorios.recordatorios.filter(r => r.estado === this.STATUS.CANCELLED).length,
        proximosVencer: recordatorios.recordatorios.filter(r => {
          if (r.estado !== this.STATUS.ACTIVE) return false;
          const fechaLimite = r.fechaLimite.toDate();
          const hoy = new Date();
          const diasRestantes = Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24));
          return diasRestantes <= 7 && diasRestantes >= 0;
        }).length,
        porTipo: {}
      };

      // Contar por tipo
      recordatorios.recordatorios.forEach(r => {
        if (!stats.porTipo[r.tipo]) {
          stats.porTipo[r.tipo] = 0;
        }
        stats.porTipo[r.tipo]++;
      });

      return { success: true, stats };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar si un cliente tiene plan premium para recordatorios automáticos
   */
  static async checkPremiumAccess(clienteId) {
    try {
      // Verificar si el cliente tiene plan premium
      const clienteRef = doc(db, 'perfiles_clientes', clienteId);
      const clienteDoc = await getDoc(clienteRef);
      
      if (!clienteDoc.exists()) {
        return { success: false, error: 'Cliente no encontrado' };
      }

      const clienteData = clienteDoc.data();
      const tienePlanPremium = clienteData.plan === 'premium' || clienteData.membresia === 'premium';

      return { 
        success: true, 
        tienePlanPremium,
        puedeCrearRecordatorios: tienePlanPremium || clienteData.plan === 'basic'
      };
    } catch (error) {
      console.error('❌ Error verificando acceso premium:', error);
      return { success: false, error: error.message };
    }
  }
}

export default ReminderService;



