import { collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Servicio de notificaciones para la plataforma AV10 de Julio
 * Maneja notificaciones en app, email, SMS y push notifications
 */

export class NotificationService {
  // Crear notificación en la app
  static async createInAppNotification(userId, tipo, titulo, mensaje, metadatos = {}) {
    try {
      const notificacion = {
        userId,
        tipo, // 'validacion', 'recordatorio', 'promocion', 'sistema'
        titulo,
        mensaje,
        metadatos,
        leida: false,
        fechaCreacion: new Date(),
        fechaVencimiento: metadatos.fechaVencimiento || null
      };

      const docRef = await addDoc(collection(db, 'notificaciones'), notificacion);
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Obtener notificaciones del usuario
  static async getUserNotifications(userId, limit_count = 10) {
    try {
      const notificacionesQuery = query(
        collection(db, 'notificaciones'),
        where('userId', '==', userId),
        orderBy('fechaCreacion', 'desc'),
        limit(limit_count)
      );
      
      const snapshot = await getDocs(notificacionesQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Marcar notificación como leída
  static async markAsRead(notificationId) {
    try {
      await updateDoc(doc(db, 'notificaciones', notificationId), {
        leida: true,
        fechaLectura: new Date()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Obtener contador de notificaciones no leídas
  static async getUnreadCount(userId) {
    try {
      const notificacionesQuery = query(
        collection(db, 'notificaciones'),
        where('userId', '==', userId),
        where('leida', '==', false)
      );
      
      const snapshot = await getDocs(notificacionesQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Notificaciones específicas para validación de clientes
  static async notifyClientValidationStatus(userId, estado, observaciones = '') {
    const mensajes = {
      'activo': {
        titulo: '¡Perfil Validado! 🎉',
        mensaje: 'Tu perfil ha sido validado exitosamente. Ya puedes acceder a todos nuestros servicios y gestionar tus vehículos.',
        tipo: 'validacion'
      },
      'rechazado': {
        titulo: 'Perfil Rechazado ❌',
        mensaje: `Tu perfil ha sido rechazado. ${observaciones ? `Motivo: ${observaciones}` : 'Por favor, revisa los datos ingresados y vuelve a intentar.'}`,
        tipo: 'validacion'
      },
      'suspendido': {
        titulo: 'Perfil Suspendido ⚠️',
        mensaje: `Tu perfil ha sido suspendido temporalmente. ${observaciones ? `Motivo: ${observaciones}` : 'Contacta con soporte para más información.'}`,
        tipo: 'validacion'
      }
    };

    if (mensajes[estado]) {
      await this.createInAppNotification(
        userId,
        mensajes[estado].tipo,
        mensajes[estado].titulo,
        mensajes[estado].mensaje,
        { estado, observaciones, origen: 'validacion_cliente' }
      );
    }

    // TODO: Integrar con servicio de email/SMS
    await this.sendEmailNotification(userId, estado, observaciones);
  }

  // Notificaciones para recordatorios de vehículos
  static async notifyVehicleReminder(userId, vehiculo, tipoRecordatorio, fechaVencimiento) {
    const tipos = {
      'permiso_circulacion': {
        titulo: '🚗 Renovar Permiso de Circulación',
        mensaje: `Tu ${vehiculo.marca} ${vehiculo.modelo} necesita renovar el permiso de circulación.`
      },
      'revision_tecnica': {
        titulo: '🔧 Revisión Técnica Pendiente',
        mensaje: `Tu ${vehiculo.marca} ${vehiculo.modelo} debe hacer la revisión técnica.`
      },
      'soap': {
        titulo: '📋 SOAP Vencido',
        mensaje: `Tu ${vehiculo.marca} ${vehiculo.modelo} tiene el SOAP vencido.`
      },
      'seguro': {
        titulo: '🛡️ Renovar Seguro',
        mensaje: `Tu ${vehiculo.marca} ${vehiculo.modelo} necesita renovar el seguro.`
      }
    };

    if (tipos[tipoRecordatorio]) {
      await this.createInAppNotification(
        userId,
        'recordatorio',
        tipos[tipoRecordatorio].titulo,
        tipos[tipoRecordatorio].mensaje,
        { 
          vehiculoId: vehiculo.id,
          tipoRecordatorio,
          fechaVencimiento,
          patente: vehiculo.patente
        }
      );
    }
  }

  // Simular envío de email (en producción integrar con SendGrid, etc.)
  static async sendEmailNotification(userId, estado, observaciones) {
    try {
      // En producción aquí iría la integración real con servicio de email
      console.log(`Email notification sent to user ${userId}:`, { estado, observaciones });
      
      // Registrar el envío en la base de datos
      await addDoc(collection(db, 'email_logs'), {
        userId,
        tipo: 'validacion_cliente',
        estado,
        observaciones,
        fechaEnvio: new Date(),
        proveedor: 'sistema_interno' // En producción: 'sendgrid', 'mailgun', etc.
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  // Notificaciones para promociones y ofertas
  static async notifyPromotion(userId, titulo, mensaje, tipoVehiculo = null) {
    await this.createInAppNotification(
      userId,
      'promocion',
      titulo,
      mensaje,
      { 
        tipoVehiculo,
        origen: 'marketing',
        fechaVencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
      }
    );
  }

  // Notificaciones del sistema
  static async notifySystemUpdate(userId, titulo, mensaje) {
    await this.createInAppNotification(
      userId,
      'sistema',
      titulo,
      mensaje,
      { origen: 'sistema' }
    );
  }

  // Crear recordatorios masivos (para admin)
  static async createMassiveReminders(tipoRecordatorio, criterios = {}) {
    try {
      const vehiculosQuery = collection(db, 'vehiculos');
      const vehiculosSnapshot = await getDocs(vehiculosQuery);
      
      let notificacionesCreadas = 0;
      
      for (const doc of vehiculosSnapshot.docs) {
        const vehiculo = { id: doc.id, ...doc.data() };
        
        // Aplicar filtros si es necesario
        if (criterios.marca && vehiculo.marca !== criterios.marca) continue;
        if (criterios.año && vehiculo.año !== criterios.año) continue;
        
        // Crear recordatorio
        await this.notifyVehicleReminder(
          vehiculo.userId,
          vehiculo,
          tipoRecordatorio,
          criterios.fechaVencimiento
        );
        
        notificacionesCreadas++;
      }
      
      return notificacionesCreadas;
    } catch (error) {
      console.error('Error creating massive reminders:', error);
      throw error;
    }
  }
}

export default NotificationService;
