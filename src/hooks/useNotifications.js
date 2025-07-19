import { useState, useEffect } from 'react';
import { messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// VAPID Key - se debe configurar en .env como VITE_VAPID_KEY
const VAPID_KEY = import.meta.env.VITE_VAPID_KEY || 'BEl62iUYgUivxIhf6Ydtwqr2oXIFOOcNVKqF8sD_ECGRt1Ue6kf0lKrKQK2BdHWnU_0XEU1LoXOQ';

export const useNotifications = (user) => {
  const [permission, setPermission] = useState(Notification.permission);
  const [token, setToken] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verificar soporte para notificaciones
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
  }, []);

  // Solicitar permiso para notificaciones
  const requestPermission = async () => {
    if (!isSupported) {
      console.log('Notificaciones no soportadas en este navegador');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        await getNotificationToken();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error);
      return false;
    }
  };

  // Obtener token de notificación
  const getNotificationToken = async () => {
    if (!messaging || permission !== 'granted') return null;

    try {
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });

      if (currentToken) {
        setToken(currentToken);
        
        // Guardar token en el perfil del usuario
        if (user) {
          await saveTokenToDatabase(currentToken, user.uid);
        }
        
        return currentToken;
      } else {
        console.log('No se pudo obtener el token de notificación');
        return null;
      }
    } catch (error) {
      console.error('Error al obtener token de notificación:', error);
      return null;
    }
  };

  // Guardar token en la base de datos
  const saveTokenToDatabase = async (token, userId) => {
    try {
      const userRef = doc(db, 'usuarios', userId);
      await updateDoc(userRef, {
        notificationToken: token,
        notificationsEnabled: true,
        lastTokenUpdate: new Date()
      });
    } catch (error) {
      console.error('Error al guardar token en base de datos:', error);
    }
  };

  // Configurar listener para mensajes en primer plano
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Mensaje recibido en primer plano:', payload);
      
      // Mostrar notificación personalizada o toast
      if (payload.notification) {
        showInAppNotification(payload.notification);
      }
    });

    return () => unsubscribe();
  }, []);

  // Mostrar notificación dentro de la app
  const showInAppNotification = (notification) => {
    // Aquí puedes integrar con tu sistema de toast/alertas
    console.log('Notificación en app:', notification);
    
    // Ejemplo simple con alert (reemplazar por toast library)
    if (document.visibilityState === 'visible') {
      // Solo mostrar si la página está visible
      const message = `${notification.title}\n${notification.body}`;
      // alert(message); // Reemplazar por toast
    }
  };

  // Enviar notificación de prueba (solo para testing)
  const sendTestNotification = async () => {
    if (!token) {
      console.log('No hay token disponible');
      return;
    }

    try {
      // Aquí normalmente harías una llamada a tu backend
      // que use Firebase Admin SDK para enviar la notificación
      console.log('Enviando notificación de prueba con token:', token);
      
      // Por ahora solo log
      alert('Token de notificación copiado al console. Úsalo en Firebase Console para enviar una prueba.');
    } catch (error) {
      console.error('Error al enviar notificación de prueba:', error);
    }
  };

  return {
    permission,
    token,
    isSupported,
    requestPermission,
    getNotificationToken,
    sendTestNotification
  };
};

export default useNotifications;
