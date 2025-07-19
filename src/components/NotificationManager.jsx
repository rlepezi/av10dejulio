// Componente para gestionar notificaciones push en la interfaz
import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import pushNotificationService from '../services/PushNotificationService';

export default function NotificationManager() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    // Verificar estado inicial de permisos
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Verificar si el usuario ya está suscrito
    checkSubscriptionStatus();
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    try {
      // Verificar en localStorage si está suscrito
      const subscriptionStatus = localStorage.getItem(`notifications_${user.uid}`);
      setIsSubscribed(subscriptionStatus === 'true');
    } catch (error) {
      console.error('Error verificando estado de suscripción:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      alert('Debes estar logueado para recibir notificaciones');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await pushNotificationService.subscribeUser(user.uid, user.rol);
      
      if (result.success) {
        setIsSubscribed(true);
        setNotificationPermission('granted');
        localStorage.setItem(`notifications_${user.uid}`, 'true');
        
        // Mostrar notificación de bienvenida
        pushNotificationService.showInAppNotification({
          title: '🔔 Notificaciones Activadas',
          body: 'Ahora recibirás notificaciones importantes sobre tu cuenta',
          icon: '/logo192.png'
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error suscribiendo a notificaciones:', error);
      alert('Error al activar notificaciones: ' + error.message);
    }
    
    setIsLoading(false);
  };

  const handleUnsubscribe = async () => {
    if (!user) return;

    setIsLoading(true);
    
    try {
      const result = await pushNotificationService.unsubscribeUser(user.uid);
      
      if (result.success) {
        setIsSubscribed(false);
        localStorage.removeItem(`notifications_${user.uid}`);
        
        pushNotificationService.showInAppNotification({
          title: '🔕 Notificaciones Desactivadas',
          body: 'Ya no recibirás notificaciones push',
          icon: '/logo192.png'
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error desuscribiendo notificaciones:', error);
      alert('Error al desactivar notificaciones: ' + error.message);
    }
    
    setIsLoading(false);
  };

  const getNotificationTypesByRole = (role) => {
    const types = {
      cliente: [
        '🔧 Recordatorios de mantenimiento',
        '📋 Estado de solicitudes',
        '🏪 Nuevos proveedores en tu área',
        '💰 Ofertas especiales'
      ],
      proveedor: [
        '📬 Nuevas solicitudes de clientes',
        '📊 Reportes de rendimiento',
        '🎯 Nuevas campañas disponibles',
        '✅ Estado de validaciones'
      ],
      agente: [
        '🏢 Nuevas empresas asignadas',
        '📍 Recordatorios de visitas',
        '📊 Reportes de actividad',
        '🎯 Objetivos y metas'
      ],
      admin: [
        '🚨 Alertas del sistema',
        '📈 Reportes automáticos',
        '👥 Actividad de usuarios',
        '🔄 Estados de procesos'
      ]
    };
    
    return types[role] || types.cliente;
  };

  if (!pushNotificationService.isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Las notificaciones push no están disponibles en este navegador.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (notificationPermission === 'denied') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Las notificaciones están bloqueadas. Para habilitarlas, ve a la configuración de tu navegador.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🔔 Notificaciones Push
        </h3>
        <div className="flex items-center">
          {isSubscribed ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Activas
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Inactivas
            </span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">
          Recibe notificaciones importantes directamente en tu dispositivo:
        </p>
        
        <ul className="text-sm text-gray-600 space-y-1">
          {getNotificationTypesByRole(user?.rol).map((type, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2">•</span>
              <span>{type}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex space-x-3">
        {!isSubscribed ? (
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Activando...
              </div>
            ) : (
              'Activar Notificaciones'
            )}
          </button>
        ) : (
          <button
            onClick={handleUnsubscribe}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Desactivando...
              </div>
            ) : (
              'Desactivar Notificaciones'
            )}
          </button>
        )}
        
        {/* Botón de prueba solo en desarrollo */}
        {import.meta.env.VITE_NODE_ENV === 'development' && isSubscribed && (
          <button
            onClick={() => {
              pushNotificationService.showInAppNotification({
                title: '🧪 Notificación de Prueba',
                body: 'Esta es una notificación de prueba para verificar el funcionamiento del sistema',
                icon: '/logo192.png'
              });
            }}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Prueba
          </button>
        )}
      </div>

      {notificationPermission === 'default' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 <strong>Tip:</strong> Al activar las notificaciones, tu navegador te pedirá permiso. 
            Asegúrate de hacer clic en "Permitir" para recibir las notificaciones.
          </p>
        </div>
      )}
    </div>
  );
}
