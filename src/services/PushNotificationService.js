// Servicio de Notificaciones Push - AV10 de Julio
// Integración con Firebase Cloud Messaging

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Configuración Firebase (usar la misma que en firebase.js)
const firebaseConfig = {
  // Se importará de firebase.js
};

class PushNotificationService {
  constructor() {
    this.messaging = null;
    this.isSupported = false;
    this.init();
  }

  async init() {
    // Verificar soporte del navegador
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    
    if (!this.isSupported) {
      console.warn('Push notifications no soportadas en este navegador');
      return;
    }

    try {
      // Registrar Service Worker
      await this.registerServiceWorker();
      
      // Inicializar Firebase Messaging
      if (typeof window !== 'undefined') {
        this.messaging = getMessaging();
        this.setupMessageHandling();
      }
    } catch (error) {
      console.error('Error inicializando notificaciones:', error);
    }
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Firebase Service Worker registrado:', registration);
        return registration;
      } catch (error) {
        console.error('Error registrando Firebase Service Worker:', error);
        throw error;
      }
    }
  }

  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Notificaciones no soportadas');
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Permiso de notificaciones concedido');
      return true;
    } else if (permission === 'denied') {
      console.log('Permiso de notificaciones denegado');
      return false;
    } else {
      console.log('Permiso de notificaciones no decidido');
      return false;
    }
  }

  async getRegistrationToken() {
    if (!this.messaging) {
      throw new Error('Firebase Messaging no inicializado');
    }

    try {
      const token = await getToken(this.messaging, {
        vapidKey: import.meta.env.VITE_VAPID_KEY || 'BEl62iUYgUivxIhf6Ydtwqr2oXIFOOcNVKqF8sD_ECGRt1Ue6kf0lKrKQK2BdHWnU_0XEU1LoXOQ'
      });
      
      if (token) {
        console.log('Token de registro obtenido:', token);
        return token;
      } else {
        console.log('No se pudo obtener el token de registro');
        return null;
      }
    } catch (error) {
      console.error('Error obteniendo token:', error);
      throw error;
    }
  }

  setupMessageHandling() {
    if (!this.messaging) return;

    // Manejar mensajes cuando la app está en primer plano
    onMessage(this.messaging, (payload) => {
      console.log('Mensaje recibido en primer plano:', payload);
      
      // Mostrar notificación personalizada
      this.showForegroundNotification(payload);
    });
  }

  showForegroundNotification(payload) {
    const { title, body, icon } = payload.notification || {};
    
    // Crear notificación visual en la app
    this.showInAppNotification({
      title: title || 'AV10 de Julio',
      body: body || 'Nueva notificación',
      icon: icon || '/logo192.png',
      data: payload.data
    });
  }

  showInAppNotification(notification) {
    // Crear elemento de notificación en la interfaz
    const notificationEl = document.createElement('div');
    notificationEl.className = 'fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    notificationEl.innerHTML = `
      <div class="flex items-start">
        <img src="${notification.icon}" alt="Icon" class="w-8 h-8 mr-3 rounded">
        <div class="flex-1">
          <h4 class="font-semibold">${notification.title}</h4>
          <p class="text-sm opacity-90">${notification.body}</p>
        </div>
        <button class="ml-2 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          ×
        </button>
      </div>
    `;

    document.body.appendChild(notificationEl);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      if (notificationEl.parentElement) {
        notificationEl.remove();
      }
    }, 5000);
  }

  // Métodos para diferentes tipos de notificaciones
  async sendRecordatorioMantenimiento(userId, vehiculoInfo) {
    const notification = {
      title: '🔧 Recordatorio de Mantenimiento',
      body: `Es hora de realizar el mantenimiento de tu ${vehiculoInfo.marca} ${vehiculoInfo.modelo}`,
      icon: '/logo192.png',
      data: {
        type: 'recordatorio_mantenimiento',
        userId,
        vehiculoId: vehiculoInfo.id,
        url: `/vehiculos/${vehiculoInfo.id}/servicios`
      }
    };

    return this.sendNotification(notification);
  }

  async sendEstadoSolicitud(userId, tipo, estado) {
    const notification = {
      title: '📋 Actualización de Solicitud',
      body: `Tu solicitud de ${tipo} ha sido ${estado}`,
      icon: '/logo192.png',
      data: {
        type: 'estado_solicitud',
        userId,
        solicitudTipo: tipo,
        estado,
        url: '/dashboard'
      }
    };

    return this.sendNotification(notification);
  }

  async sendNuevaEmpresaAsignada(agenteId, empresaInfo) {
    const notification = {
      title: '🏢 Nueva Empresa Asignada',
      body: `Se te ha asignado ${empresaInfo.nombre} para validación`,
      icon: '/logo192.png',
      data: {
        type: 'nueva_empresa_asignada',
        agenteId,
        empresaId: empresaInfo.id,
        url: '/dashboard/agente'
      }
    };

    return this.sendNotification(notification);
  }

  async sendNotification(notification) {
    // En un entorno real, esto enviaría la notificación a través del servidor
    // Por ahora, mostraremos una notificación local para testing
    if (this.isSupported && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        data: notification.data
      });
    }
  }

  // Suscribir usuario a notificaciones
  async subscribeUser(userId, userType) {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Permisos de notificación no concedidos');
      }

      const token = await this.getRegistrationToken();
      if (!token) {
        throw new Error('No se pudo obtener token de registro');
      }

      // Guardar token en Firestore asociado al usuario
      await this.saveTokenToFirestore(userId, token, userType);

      return { success: true, token };
    } catch (error) {
      console.error('Error suscribiendo usuario:', error);
      return { success: false, error: error.message };
    }
  }

  async saveTokenToFirestore(userId, token, userType) {
    // Importar dinámicamente para evitar problemas de SSR
    const { doc, setDoc, getFirestore } = await import('firebase/firestore');
    const db = getFirestore();

    const tokenData = {
      token,
      userId,
      userType,
      createdAt: new Date(),
      active: true,
      platform: this.getPlatform()
    };

    await setDoc(doc(db, 'push_tokens', `${userId}_${token.slice(-10)}`), tokenData);
  }

  getPlatform() {
    const userAgent = navigator.userAgent;
    if (/android/i.test(userAgent)) return 'android';
    if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios';
    return 'web';
  }

  // Desuscribir usuario
  async unsubscribeUser(userId) {
    try {
      // Marcar tokens como inactivos en Firestore
      const { collection, query, where, getDocs, updateDoc, getFirestore } = await import('firebase/firestore');
      const db = getFirestore();

      const tokensRef = collection(db, 'push_tokens');
      const q = query(tokensRef, where('userId', '==', userId), where('active', '==', true));
      
      const snapshot = await getDocs(q);
      const updates = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { active: false, unsubscribedAt: new Date() })
      );

      await Promise.all(updates);
      return { success: true };
    } catch (error) {
      console.error('Error desuscribiendo usuario:', error);
      return { success: false, error: error.message };
    }
  }
}

// Crear instancia singleton
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;
