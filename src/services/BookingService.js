// Servicio de Reservas y Comisiones AV 10 de Julio
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
  arrayRemove,
  getDoc,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';

export class BookingService {
  
  // Estados de reserva según el documento
  static BOOKING_STATUS = {
    PENDING: 'pendiente',
    CONFIRMED: 'confirmada',
    IN_PROGRESS: 'en_progreso',
    COMPLETED: 'completada',
    CANCELLED: 'cancelada',
    NO_SHOW: 'no_show',
    EXPIRED: 'expirada'
  };

  // Tipos de servicio
  static SERVICE_TYPES = {
    MAINTENANCE: 'mantenimiento',
    REPAIR: 'reparacion',
    INSPECTION: 'inspeccion',
    CLEANING: 'limpieza',
    TUNING: 'tuning',
    DIAGNOSTIC: 'diagnostico',
    EMERGENCY: 'emergencia',
    CONSULTATION: 'consulta'
  };

  // Estados de pago de reserva
  static PAYMENT_STATUS = {
    PENDING: 'pendiente',
    PARTIAL: 'parcial',
    COMPLETED: 'completado',
    REFUNDED: 'reembolsado',
    FAILED: 'fallido'
  };

  // Tipos de comisión
  static COMMISSION_TYPES = {
    BOOKING: 'reserva',
    SERVICE: 'servicio',
    PRODUCT: 'producto',
    REFERRAL: 'referido',
    PREMIUM: 'premium'
  };

  /**
   * Crear nueva reserva
   */
  static async createBooking(bookingData) {
    try {
      const reserva = {
        clienteId: bookingData.clienteId,
        empresaId: bookingData.empresaId,
        servicioId: bookingData.servicioId,
        tipoServicio: bookingData.tipoServicio,
        fechaReserva: Timestamp.fromDate(new Date(bookingData.fechaReserva)),
        horaReserva: bookingData.horaReserva,
        duracionEstimada: bookingData.duracionEstimada || 60, // minutos
        descripcion: bookingData.descripcion,
        vehiculoId: bookingData.vehiculoId,
        prioridad: bookingData.prioridad || 'normal',
        estado: this.BOOKING_STATUS.PENDING,
        estadoPago: this.PAYMENT_STATUS.PENDING,
        precioEstimado: bookingData.precioEstimado || 0,
        precioFinal: 0,
        comision: 0,
        fechaCreacion: serverTimestamp(),
        notas: bookingData.notas || '',
        recordatorios: [],
        historial: []
      };

      const docRef = await addDoc(collection(db, 'reservas'), reserva);
      console.log('✅ Reserva creada:', docRef.id);
      
      // Crear recordatorio automático
      await this.createBookingReminder(docRef.id, reserva);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error creando reserva:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear recordatorio automático para la reserva
   */
  static async createBookingReminder(bookingId, reserva) {
    try {
      const fechaReserva = reserva.fechaReserva.toDate();
      const fechaRecordatorio = new Date(fechaReserva);
      fechaRecordatorio.setDate(fechaRecordatorio.getDate() - 1); // 1 día antes

      const recordatorio = {
        reservaId: bookingId,
        tipo: 'reserva_proxima',
        titulo: 'Recordatorio de Reserva',
        descripcion: `Tienes una reserva mañana a las ${reserva.horaReserva}`,
        fechaRecordatorio: Timestamp.fromDate(fechaRecordatorio),
        estado: 'pendiente',
        enviado: false
      };

      await addDoc(collection(db, 'recordatorios_reservas'), recordatorio);
      console.log('✅ Recordatorio de reserva creado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error creando recordatorio:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Confirmar reserva
   */
  static async confirmBooking(bookingId, confirmacionData) {
    try {
      const reservaRef = doc(db, 'reservas', bookingId);
      
      await updateDoc(reservaRef, {
        estado: this.BOOKING_STATUS.CONFIRMED,
        fechaConfirmacion: serverTimestamp(),
        confirmadoPor: confirmacionData.confirmadoPor,
        comentariosConfirmacion: confirmacionData.comentarios || '',
        historial: arrayUnion({
          accion: 'confirmada',
          fecha: serverTimestamp(),
          usuario: confirmacionData.confirmadoPor,
          comentarios: confirmacionData.comentarios || ''
        })
      });

      // Enviar notificación al cliente
      await this.sendBookingNotification(bookingId, 'confirmada');

      console.log('✅ Reserva confirmada');
      return { success: true };
    } catch (error) {
      console.error('❌ Error confirmando reserva:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Iniciar servicio (cambiar a en progreso)
   */
  static async startService(bookingId, datosInicio) {
    try {
      const reservaRef = doc(db, 'reservas', bookingId);
      
      await updateDoc(reservaRef, {
        estado: this.BOOKING_STATUS.IN_PROGRESS,
        fechaInicio: serverTimestamp(),
        iniciadoPor: datosInicio.iniciadoPor,
        notasInicio: datosInicio.notas || '',
        historial: arrayUnion({
          accion: 'iniciado',
          fecha: serverTimestamp(),
          usuario: datosInicio.iniciadoPor,
          comentarios: datosInicio.notas || ''
        })
      });

      console.log('✅ Servicio iniciado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error iniciando servicio:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Completar servicio
   */
  static async completeService(bookingId, datosCompletado) {
    try {
      const reservaRef = doc(db, 'reservas', bookingId);
      
      const reservaDoc = await getDoc(reservaRef);
      if (!reservaDoc.exists()) {
        throw new Error('Reserva no encontrada');
      }

      const reserva = reservaDoc.data();
      
      // Calcular comisión
      const comision = this.calculateCommission(reserva.precioFinal, reserva.empresaId);
      
      await updateDoc(reservaRef, {
        estado: this.BOOKING_STATUS.COMPLETED,
        fechaCompletado: serverTimestamp(),
        completadoPor: datosCompletado.completadoPor,
        precioFinal: datosCompletado.precioFinal || reserva.precioEstimado,
        comision: comision,
        notasCompletado: datosCompletado.notas || '',
        historial: arrayUnion({
          accion: 'completado',
          fecha: serverTimestamp(),
          usuario: datosCompletado.completadoPor,
          comentarios: datosCompletado.notas || '',
          precioFinal: datosCompletado.precioFinal || reserva.precioEstimado
        })
      });

      // Crear comisión
      await this.createCommission(bookingId, comision, 'servicio');

      // Enviar notificación al cliente
      await this.sendBookingNotification(bookingId, 'completada');

      console.log('✅ Servicio completado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error completando servicio:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calcular comisión según el plan de la empresa
   */
  static async calculateCommission(precioFinal, empresaId) {
    try {
      // Obtener plan de la empresa
      const empresaDoc = await getDoc(doc(db, 'empresas', empresaId));
      if (!empresaDoc.exists()) {
        return 0;
      }

      const empresa = empresaDoc.data();
      const plan = empresa.plan || 'free';
      
      // Porcentajes de comisión según el plan
      const porcentajesComision = {
        'free': 0.15, // 15%
        'premium': 0.10, // 10%
        'corporate': 0.05 // 5%
      };

      const porcentaje = porcentajesComision[plan] || 0.15;
      return Math.round(precioFinal * porcentaje);
    } catch (error) {
      console.error('❌ Error calculando comisión:', error);
      return 0;
    }
  }

  /**
   * Crear comisión
   */
  static async createCommission(bookingId, monto, tipo) {
    try {
      const comision = {
        reservaId: bookingId,
        tipo: tipo,
        monto: monto,
        fechaCreacion: serverTimestamp(),
        estado: 'pendiente',
        procesada: false,
        fechaProcesamiento: null
      };

      const docRef = await addDoc(collection(db, 'comisiones'), comision);
      console.log('✅ Comisión creada:', docRef.id);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error creando comisión:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancelar reserva
   */
  static async cancelBooking(bookingId, motivo, canceladoPor) {
    try {
      const reservaRef = doc(db, 'reservas', bookingId);
      
      await updateDoc(reservaRef, {
        estado: this.BOOKING_STATUS.CANCELLED,
        fechaCancelacion: serverTimestamp(),
        canceladoPor: canceladoPor,
        motivoCancelacion: motivo,
        historial: arrayUnion({
          accion: 'cancelada',
          fecha: serverTimestamp(),
          usuario: canceladoPor,
          comentarios: motivo
        })
      });

      // Enviar notificación al cliente
      await this.sendBookingNotification(bookingId, 'cancelada');

      console.log('✅ Reserva cancelada');
      return { success: true };
    } catch (error) {
      console.error('❌ Error cancelando reserva:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener reservas de una empresa
   */
  static async getCompanyBookings(empresaId, estado = null, fechaInicio = null, fechaFin = null) {
    try {
      let q = query(
        collection(db, 'reservas'),
        where('empresaId', '==', empresaId),
        orderBy('fechaReserva', 'desc')
      );

      if (estado) {
        q = query(q, where('estado', '==', estado));
      }

      if (fechaInicio && fechaFin) {
        q = query(
          q,
          where('fechaReserva', '>=', Timestamp.fromDate(new Date(fechaInicio))),
          where('fechaReserva', '<=', Timestamp.fromDate(new Date(fechaFin)))
        );
      }

      const snapshot = await getDocs(q);
      const reservas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, reservas };
    } catch (error) {
      console.error('❌ Error obteniendo reservas de empresa:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener reservas de un cliente
   */
  static async getClientBookings(clienteId, estado = null) {
    try {
      let q = query(
        collection(db, 'reservas'),
        where('clienteId', '==', clienteId),
        orderBy('fechaReserva', 'desc')
      );

      if (estado) {
        q = query(q, where('estado', '==', estado));
      }

      const snapshot = await getDocs(q);
      const reservas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, reservas };
    } catch (error) {
      console.error('❌ Error obteniendo reservas del cliente:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener reservas próximas (próximas 7 días)
   */
  static async getUpcomingBookings(empresaId = null, dias = 7) {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + dias);

      let q = query(
        collection(db, 'reservas'),
        where('estado', 'in', [this.BOOKING_STATUS.CONFIRMED, this.BOOKING_STATUS.PENDING]),
        where('fechaReserva', '>=', Timestamp.fromDate(new Date())),
        where('fechaReserva', '<=', Timestamp.fromDate(fechaLimite)),
        orderBy('fechaReserva', 'asc')
      );

      if (empresaId) {
        q = query(q, where('empresaId', '==', empresaId));
      }

      const snapshot = await getDocs(q);
      const reservas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, reservas };
    } catch (error) {
      console.error('❌ Error obteniendo reservas próximas:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener estadísticas de reservas
   */
  static async getBookingStats(empresaId = null, fechaInicio = null, fechaFin = null) {
    try {
      let q = collection(db, 'reservas');
      
      if (empresaId) {
        q = query(q, where('empresaId', '==', empresaId));
      }

      if (fechaInicio && fechaFin) {
        q = query(
          q,
          where('fechaCreacion', '>=', Timestamp.fromDate(new Date(fechaInicio))),
          where('fechaCreacion', '<=', Timestamp.fromDate(new Date(fechaFin)))
        );
      }

      const snapshot = await getDocs(q);
      const reservas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const stats = {
        total: reservas.length,
        porEstado: {},
        porTipo: {},
        ingresosTotales: 0,
        comisionesTotales: 0,
        reservasConfirmadas: 0,
        reservasCompletadas: 0,
        reservasCanceladas: 0,
        promedioPrecio: 0,
        reservasPorDia: {},
        reservasPorMes: {}
      };

      let ingresosTotales = 0;
      let comisionesTotales = 0;

      reservas.forEach(reserva => {
        // Contar por estado
        if (!stats.porEstado[reserva.estado]) {
          stats.porEstado[reserva.estado] = 0;
        }
        stats.porEstado[reserva.estado]++;

        // Contar por tipo
        if (!stats.porTipo[reserva.tipoServicio]) {
          stats.porTipo[reserva.tipoServicio] = 0;
        }
        stats.porTipo[reserva.tipoServicio]++;

        // Sumar ingresos y comisiones
        if (reserva.precioFinal > 0) {
          ingresosTotales += reserva.precioFinal;
        }
        if (reserva.comision > 0) {
          comisionesTotales += reserva.comision;
        }

        // Contar por estado específico
        if (reserva.estado === this.BOOKING_STATUS.CONFIRMED) {
          stats.reservasConfirmadas++;
        } else if (reserva.estado === this.BOOKING_STATUS.COMPLETED) {
          stats.reservasCompletadas++;
        } else if (reserva.estado === this.BOOKING_STATUS.CANCELLED) {
          stats.reservasCanceladas++;
        }

        // Agrupar por día
        if (reserva.fechaReserva) {
          const fecha = reserva.fechaReserva.toDate();
          const dia = fecha.toISOString().split('T')[0];
          if (!stats.reservasPorDia[dia]) {
            stats.reservasPorDia[dia] = 0;
          }
          stats.reservasPorDia[dia]++;
        }

        // Agrupar por mes
        if (reserva.fechaReserva) {
          const fecha = reserva.fechaReserva.toDate();
          const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
          if (!stats.reservasPorMes[mes]) {
            stats.reservasPorMes[mes] = 0;
          }
          stats.reservasPorMes[mes]++;
        }
      });

      stats.ingresosTotales = ingresosTotales;
      stats.comisionesTotales = comisionesTotales;
      stats.promedioPrecio = reservas.length > 0 ? ingresosTotales / reservas.length : 0;

      return { success: true, stats };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de reservas:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener comisiones de una empresa
   */
  static async getCompanyCommissions(empresaId, estado = null) {
    try {
      // Obtener reservas de la empresa
      const reservas = await this.getCompanyBookings(empresaId);
      
      if (!reservas.success) {
        return reservas;
      }

      // Filtrar reservas con comisiones
      const reservasConComision = reservas.reservas.filter(
        reserva => reserva.comision > 0
      );

      // Obtener comisiones de la colección de comisiones
      let q = query(
        collection(db, 'comisiones'),
        where('reservaId', 'in', reservasConComision.map(r => r.id))
      );

      if (estado) {
        q = query(q, where('estado', '==', estado));
      }

      q = query(q, orderBy('fechaCreacion', 'desc'));
      const snapshot = await getDocs(q);
      
      const comisiones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, comisiones };
    } catch (error) {
      console.error('❌ Error obteniendo comisiones de empresa:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Procesar comisión
   */
  static async processCommission(comisionId, datosProcesamiento) {
    try {
      const comisionRef = doc(db, 'comisiones', comisionId);
      
      await updateDoc(comisionRef, {
        estado: 'procesada',
        procesada: true,
        fechaProcesamiento: serverTimestamp(),
        procesadoPor: datosProcesamiento.procesadoPor,
        metodoPago: datosProcesamiento.metodoPago,
        referencia: datosProcesamiento.referencia || null,
        notas: datosProcesamiento.notas || ''
      });

      console.log('✅ Comisión procesada');
      return { success: true };
    } catch (error) {
      console.error('❌ Error procesando comisión:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar notificación de reserva
   */
  static async sendBookingNotification(bookingId, tipo) {
    try {
      const reservaDoc = await getDoc(doc(db, 'reservas', bookingId));
      if (!reservaDoc.exists()) {
        return { success: false, error: 'Reserva no encontrada' };
      }

      const reserva = reservaDoc.data();
      
      const notificacion = {
        userId: reserva.clienteId,
        tipo: `reserva_${tipo}`,
        titulo: `Reserva ${tipo}`,
        mensaje: this.generateNotificationMessage(tipo, reserva),
        fechaCreacion: serverTimestamp(),
        leida: false,
        datos: {
          reservaId: bookingId,
          empresaId: reserva.empresaId,
          fechaReserva: reserva.fechaReserva
        }
      };

      await addDoc(collection(db, 'notificaciones'), notificacion);
      console.log('✅ Notificación enviada');
      return { success: true };
    } catch (error) {
      console.error('❌ Error enviando notificación:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generar mensaje de notificación
   */
  static generateNotificationMessage(tipo, reserva) {
    const fecha = reserva.fechaReserva.toDate().toLocaleDateString('es-CL');
    const hora = reserva.horaReserva;

    switch (tipo) {
      case 'confirmada':
        return `Tu reserva para el ${fecha} a las ${hora} ha sido confirmada.`;
      case 'completada':
        return `Tu servicio del ${fecha} ha sido completado. Gracias por confiar en nosotros.`;
      case 'cancelada':
        return `Tu reserva para el ${fecha} a las ${hora} ha sido cancelada.`;
      default:
        return `Actualización en tu reserva del ${fecha}.`;
    }
  }

  /**
   * Verificar disponibilidad de horario
   */
  static async checkAvailability(empresaId, fecha, hora, duracion = 60) {
    try {
      const fechaInicio = new Date(fecha);
      fechaInicio.setHours(parseInt(hora.split(':')[0]), parseInt(hora.split(':')[1]), 0);
      
      const fechaFin = new Date(fechaInicio);
      fechaFin.setMinutes(fechaFin.getMinutes() + duracion);

      const q = query(
        collection(db, 'reservas'),
        where('empresaId', '==', empresaId),
        where('estado', 'in', [this.BOOKING_STATUS.CONFIRMED, this.BOOKING_STATUS.IN_PROGRESS]),
        where('fechaReserva', '>=', Timestamp.fromDate(fechaInicio)),
        where('fechaReserva', '<', Timestamp.fromDate(fechaFin))
      );

      const snapshot = await getDocs(q);
      const reservasConflictivas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { 
        success: true, 
        disponible: reservasConflictivas.length === 0,
        conflictos: reservasConflictivas
      };
    } catch (error) {
      console.error('❌ Error verificando disponibilidad:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener horarios disponibles de una empresa
   */
  static async getAvailableSlots(empresaId, fecha, duracion = 60) {
    try {
      const horariosDisponibles = [];
      const horaInicio = 8; // 8:00 AM
      const horaFin = 18; // 6:00 PM
      
      for (let hora = horaInicio; hora < horaFin; hora++) {
        for (let minuto = 0; minuto < 60; minuto += 30) { // Slots de 30 minutos
          const horaSlot = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
          
          const disponibilidad = await this.checkAvailability(empresaId, fecha, horaSlot, duracion);
          
          if (disponibilidad.success && disponibilidad.disponible) {
            horariosDisponibles.push(horaSlot);
          }
        }
      }

      return { success: true, horarios: horariosDisponibles };
    } catch (error) {
      console.error('❌ Error obteniendo horarios disponibles:', error);
      return { success: false, error: error.message };
    }
  }
}

export default BookingService;



