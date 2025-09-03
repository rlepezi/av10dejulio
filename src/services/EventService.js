// Servicio de Eventos y Capacitaciones AV 10 de Julio
// Basado en el documento del proyecto - Beneficios para Proveedores

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

export class EventService {
  
  // Tipos de eventos según el documento
  static EVENT_TYPES = {
    TRAINING: 'capacitacion',
    NETWORKING: 'networking',
    WORKSHOP: 'taller',
    CONFERENCE: 'conferencia',
    PRODUCT_LAUNCH: 'lanzamiento_producto',
    TRADE_SHOW: 'feria_comercial',
    MASTERCLASS: 'masterclass',
    CERTIFICATION: 'certificacion',
    EXCLUSIVE_EVENT: 'evento_exclusivo'
  };

  // Categorías de eventos
  static EVENT_CATEGORIES = {
    BUSINESS: 'negocios',
    TECHNICAL: 'tecnico',
    MARKETING: 'marketing',
    SALES: 'ventas',
    CUSTOMER_SERVICE: 'atencion_cliente',
    DIGITAL_TRANSFORMATION: 'transformacion_digital',
    INDUSTRY_TRENDS: 'tendencias_industria',
    REGULATORY: 'regulatorio'
  };

  // Estados del evento
  static EVENT_STATUS = {
    DRAFT: 'borrador',
    PUBLISHED: 'publicado',
    REGISTRATION_OPEN: 'inscripcion_abierta',
    REGISTRATION_CLOSED: 'inscripcion_cerrada',
    IN_PROGRESS: 'en_progreso',
    COMPLETED: 'completado',
    CANCELLED: 'cancelado'
  };

  // Niveles de acceso según membresía
  static ACCESS_LEVELS = {
    FREE: 'gratuito',
    PREMIUM: 'premium',
    CORPORATE: 'corporativo',
    ALL: 'todos'
  };

  /**
   * Crear un nuevo evento
   */
  static async createEvent(eventData) {
    try {
      const event = {
        ...eventData,
        fechaCreacion: serverTimestamp(),
        estado: this.EVENT_STATUS.DRAFT,
        inscritos: [],
        capacidadActual: 0,
        ratingPromedio: 0,
        totalEvaluaciones: 0
      };

      const docRef = await addDoc(collection(db, 'eventos'), event);
      console.log('✅ Evento creado:', docRef.id);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error creando evento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener eventos disponibles según el plan de membresía
   */
  static async getAvailableEvents(userPlan = 'free', categoria = null) {
    try {
      let q = query(
        collection(db, 'eventos'),
        where('estado', 'in', [this.EVENT_STATUS.PUBLISHED, this.EVENT_STATUS.REGISTRATION_OPEN]),
        orderBy('fechaInicio', 'asc')
      );

      if (categoria) {
        q = query(q, where('categoria', '==', categoria));
      }

      const snapshot = await getDocs(q);
      const eventos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filtrar por nivel de acceso según el plan
      const eventosDisponibles = eventos.filter(evento => {
        if (evento.nivelAcceso === this.ACCESS_LEVELS.ALL) return true;
        if (evento.nivelAcceso === this.ACCESS_LEVELS.FREE) return true;
        if (evento.nivelAcceso === this.ACCESS_LEVELS.PREMIUM && 
            (userPlan === 'premium' || userPlan === 'corporate')) return true;
        if (evento.nivelAcceso === this.ACCESS_LEVELS.CORPORATE && 
            userPlan === 'corporate') return true;
        return false;
      });

      return { success: true, eventos: eventosDisponibles };
    } catch (error) {
      console.error('❌ Error obteniendo eventos:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener eventos por empresa organizadora
   */
  static async getEventsByOrganizer(empresaId) {
    try {
      const q = query(
        collection(db, 'eventos'),
        where('empresaOrganizadora', '==', empresaId),
        orderBy('fechaCreacion', 'desc')
      );

      const snapshot = await getDocs(q);
      const eventos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, eventos };
    } catch (error) {
      console.error('❌ Error obteniendo eventos por organizador:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener eventos próximos (próximos 30 días)
   */
  static async getUpcomingEvents(dias = 30) {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + dias);

      const q = query(
        collection(db, 'eventos'),
        where('estado', 'in', [this.EVENT_STATUS.PUBLISHED, this.EVENT_STATUS.REGISTRATION_OPEN]),
        where('fechaInicio', '>=', Timestamp.fromDate(new Date())),
        where('fechaInicio', '<=', Timestamp.fromDate(fechaLimite)),
        orderBy('fechaInicio', 'asc')
      );

      const snapshot = await getDocs(q);
      const eventos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, eventos };
    } catch (error) {
      console.error('❌ Error obteniendo eventos próximos:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Inscribir usuario a un evento
   */
  static async registerUserToEvent(eventoId, userId, userData) {
    try {
      const eventoRef = doc(db, 'eventos', eventoId);
      const eventoDoc = await getDoc(eventoRef);
      
      if (!eventoDoc.exists()) {
        return { success: false, error: 'Evento no encontrado' };
      }

      const evento = eventoDoc.data();
      
      // Verificar si hay cupos disponibles
      if (evento.capacidadMaxima && evento.capacidadActual >= evento.capacidadMaxima) {
        return { success: false, error: 'Evento sin cupos disponibles' };
      }

      // Verificar si el usuario ya está inscrito
      if (evento.inscritos.some(inscrito => inscrito.userId === userId)) {
        return { success: false, error: 'Usuario ya inscrito en este evento' };
      }

      // Agregar usuario a la lista de inscritos
      await updateDoc(eventoRef, {
        inscritos: arrayUnion({
          userId,
          nombre: userData.nombre || userData.email,
          email: userData.email,
          fechaInscripcion: serverTimestamp(),
          empresaId: userData.empresaId || null,
          plan: userData.plan || 'free'
        }),
        capacidadActual: evento.capacidadActual + 1
      });

      // Crear registro de inscripción
      await addDoc(collection(db, 'inscripciones_eventos'), {
        eventoId,
        userId,
        userData,
        fechaInscripcion: serverTimestamp(),
        estado: 'confirmada'
      });

      console.log('✅ Usuario inscrito al evento');
      return { success: true };
    } catch (error) {
      console.error('❌ Error inscribiendo usuario:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancelar inscripción a un evento
   */
  static async cancelEventRegistration(eventoId, userId) {
    try {
      const eventoRef = doc(db, 'eventos', eventoId);
      const eventoDoc = await getDoc(eventoRef);
      
      if (!eventoDoc.exists()) {
        return { success: false, error: 'Evento no encontrado' };
      }

      const evento = eventoDoc.data();
      
      // Remover usuario de la lista de inscritos
      const inscritosActualizados = evento.inscritos.filter(
        inscrito => inscrito.userId !== userId
      );

      await updateDoc(eventoRef, {
        inscritos: inscritosActualizados,
        capacidadActual: evento.capacidadActual - 1
      });

      // Actualizar estado de inscripción
      const inscripcionesRef = collection(db, 'inscripciones_eventos');
      const inscripcionQuery = query(
        inscripcionesRef,
        where('eventoId', '==', eventoId),
        where('userId', '==', userId)
      );
      const inscripcionSnapshot = await getDocs(inscripcionQuery);
      
      if (!inscripcionSnapshot.empty) {
        const inscripcionDoc = inscripcionSnapshot.docs[0];
        await updateDoc(doc(db, 'inscripciones_eventos', inscripcionDoc.id), {
          estado: 'cancelada',
          fechaCancelacion: serverTimestamp()
        });
      }

      console.log('✅ Inscripción cancelada');
      return { success: true };
    } catch (error) {
      console.error('❌ Error cancelando inscripción:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener eventos en los que está inscrito un usuario
   */
  static async getUserRegisteredEvents(userId) {
    try {
      const q = query(
        collection(db, 'inscripciones_eventos'),
        where('userId', '==', userId),
        where('estado', '==', 'confirmada'),
        orderBy('fechaInscripcion', 'desc')
      );

      const snapshot = await getDocs(q);
      const inscripciones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Obtener detalles de los eventos
      const eventos = [];
      for (const inscripcion of inscripciones) {
        const eventoDoc = await getDoc(doc(db, 'eventos', inscripcion.eventoId));
        if (eventoDoc.exists()) {
          eventos.push({
            ...eventoDoc.data(),
            id: eventoDoc.id,
            inscripcion: inscripcion
          });
        }
      }

      return { success: true, eventos };
    } catch (error) {
      console.error('❌ Error obteniendo eventos del usuario:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Evaluar un evento (solo para usuarios inscritos)
   */
  static async rateEvent(eventoId, userId, rating, comentario = '') {
    try {
      // Verificar si el usuario está inscrito
      const inscripcionQuery = query(
        collection(db, 'inscripciones_eventos'),
        where('eventoId', '==', eventoId),
        where('userId', '==', userId),
        where('estado', '==', 'confirmada')
      );
      const inscripcionSnapshot = await getDocs(inscripcionQuery);
      
      if (inscripcionSnapshot.empty) {
        return { success: false, error: 'Usuario no inscrito en este evento' };
      }

      // Crear evaluación
      await addDoc(collection(db, 'evaluaciones_eventos'), {
        eventoId,
        userId,
        rating,
        comentario,
        fechaEvaluacion: serverTimestamp()
      });

      // Actualizar rating promedio del evento
      const eventoRef = doc(db, 'eventos', eventoId);
      const eventoDoc = await getDoc(eventoRef);
      const evento = eventoDoc.data();
      
      const nuevoTotal = evento.totalEvaluaciones + 1;
      const nuevoPromedio = ((evento.ratingPromedio * evento.totalEvaluaciones) + rating) / nuevoTotal;

      await updateDoc(eventoRef, {
        ratingPromedio: Math.round(nuevoPromedio * 10) / 10,
        totalEvaluaciones: nuevoTotal
      });

      console.log('✅ Evento evaluado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error evaluando evento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener estadísticas de eventos
   */
  static async getEventStats(empresaId = null) {
    try {
      let q = collection(db, 'eventos');
      
      if (empresaId) {
        q = query(q, where('empresaOrganizadora', '==', empresaId));
      }

      const snapshot = await getDocs(q);
      const eventos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const stats = {
        total: eventos.length,
        porEstado: {},
        porTipo: {},
        porCategoria: {},
        inscripcionesTotales: 0,
        ratingPromedio: 0,
        eventosProximos: 0
      };

      let totalRating = 0;
      let eventosConRating = 0;
      const fechaActual = new Date();

      eventos.forEach(evento => {
        // Contar por estado
        if (!stats.porEstado[evento.estado]) {
          stats.porEstado[evento.estado] = 0;
        }
        stats.porEstado[evento.estado]++;

        // Contar por tipo
        if (!stats.porTipo[evento.tipo]) {
          stats.porTipo[evento.tipo] = 0;
        }
        stats.porTipo[evento.tipo]++;

        // Contar por categoría
        if (!stats.porCategoria[evento.categoria]) {
          stats.porCategoria[evento.categoria] = 0;
        }
        stats.porCategoria[evento.categoria]++;

        // Sumar inscripciones
        stats.inscripcionesTotales += evento.capacidadActual || 0;

        // Calcular rating promedio
        if (evento.ratingPromedio > 0) {
          totalRating += evento.ratingPromedio;
          eventosConRating++;
        }

        // Contar eventos próximos
        if (evento.fechaInicio && evento.fechaInicio.toDate() > fechaActual) {
          stats.eventosProximos++;
        }
      });

      if (eventosConRating > 0) {
        stats.ratingPromedio = Math.round((totalRating / eventosConRating) * 10) / 10;
      }

      return { success: true, stats };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de eventos:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear evento de capacitación automático (para empresas premium)
   */
  static async createTrainingEvent(empresaId, datos) {
    try {
      const evento = {
        titulo: datos.titulo || 'Capacitación Personalizada',
        descripcion: datos.descripcion || 'Capacitación especializada para tu empresa',
        tipo: this.EVENT_TYPES.TRAINING,
        categoria: datos.categoria || this.EVENT_CATEGORIES.BUSINESS,
        fechaInicio: Timestamp.fromDate(new Date(datos.fechaInicio)),
        fechaFin: Timestamp.fromDate(new Date(datos.fechaFin)),
        ubicacion: datos.ubicacion || 'Online',
        modalidad: datos.modalidad || 'presencial',
        empresaOrganizadora: empresaId,
        nivelAcceso: this.ACCESS_LEVELS.PREMIUM,
        capacidadMaxima: datos.capacidadMaxima || 20,
        precio: datos.precio || 0,
        instructor: datos.instructor || 'Equipo AV 10 de Julio',
        temario: datos.temario || [],
        materiales: datos.materiales || [],
        certificacion: datos.certificacion || false
      };

      return await this.createEvent(evento);
    } catch (error) {
      console.error('❌ Error creando evento de capacitación:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Publicar evento
   */
  static async publishEvent(eventoId) {
    try {
      const eventoRef = doc(db, 'eventos', eventoId);
      await updateDoc(eventoRef, {
        estado: this.EVENT_STATUS.PUBLISHED,
        fechaPublicacion: serverTimestamp()
      });

      console.log('✅ Evento publicado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error publicando evento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar evento
   */
  static async updateEvent(eventoId, datosActualizacion) {
    try {
      const eventoRef = doc(db, 'eventos', eventoId);
      await updateDoc(eventoRef, {
        ...datosActualizacion,
        fechaActualizacion: serverTimestamp()
      });

      console.log('✅ Evento actualizado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error actualizando evento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Eliminar evento
   */
  static async deleteEvent(eventoId) {
    try {
      await deleteDoc(doc(db, 'eventos', eventoId));
      console.log('✅ Evento eliminado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error eliminando evento:', error);
      return { success: false, error: error.message };
    }
  }
}

export default EventService;



