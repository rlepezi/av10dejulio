import React, { useState, useEffect } from 'react';
import { NotificationService } from '../utils/notificationService';
import { useAuth } from './AuthProvider';

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
      
      // Polling cada 30 segundos para nuevas notificaciones
      const interval = setInterval(() => {
        loadUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const notifications = await NotificationService.getUserNotifications(user.uid, 20);
      setNotificaciones(notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await NotificationService.getUnreadCount(user.uid);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId);
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.leida) {
      markAsRead(notification.id);
    }
    
    // Manejar acciones específicas según el tipo
    switch (notification.tipo) {
      case 'validacion':
        if (notification.metadatos?.estado === 'activo') {
          window.location.href = '/dashboard/cliente';
        }
        break;
      case 'recordatorio':
        if (notification.metadatos?.vehiculoId) {
          window.location.href = '/dashboard/cliente/vehiculos';
        }
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (tipo) => {
    const icons = {
      'validacion': '✅',
      'recordatorio': '⏰',
      'promocion': '🎁',
      'sistema': '🔧'
    };
    return icons[tipo] || '📢';
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('es-CL');
  };

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Badge de contador */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
          <div className="p-3 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Notificaciones</h3>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer
              </p>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm">No hay notificaciones</p>
              </div>
            ) : (
              notificaciones.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.leida ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.tipo)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium text-gray-900 ${!notification.leida ? 'font-semibold' : ''}`}>
                        {notification.titulo}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.mensaje}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatFecha(notification.fechaCreacion)}
                      </p>
                    </div>
                    {!notification.leida && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {notificaciones.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  // TODO: Ir a página de todas las notificaciones
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay para cerrar dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
}
