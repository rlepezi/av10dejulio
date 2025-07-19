import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  BellIcon, 
  ExclamationCircleIcon,
  ChatIcon 
} from '@heroicons/react/outline';
import { useAuth } from './AuthProvider';

const TicketNotifications = () => {
  const { rol } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (rol === 'admin') {
      fetchNotifications();
    }
  }, [rol]);

  const fetchNotifications = async () => {
    try {
      // Obtener tickets sin ver
      const unreadQuery = query(
        collection(db, 'tickets'),
        where('visto', '==', false),
        orderBy('fechaCreacion', 'desc'),
        limit(5)
      );

      const unreadSnapshot = await getDocs(unreadQuery);
      const unreadTickets = unreadSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'unread'
      }));

      // Obtener tickets de alta prioridad
      const urgentQuery = query(
        collection(db, 'tickets'),
        where('prioridad', '==', 'urgente'),
        where('estado', '!=', 'cerrado'),
        orderBy('fechaCreacion', 'desc'),
        limit(3)
      );

      const urgentSnapshot = await getDocs(urgentQuery);
      const urgentTickets = urgentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'urgent'
      }));

      // Combinar y eliminar duplicados
      const allNotifications = [...unreadTickets, ...urgentTickets];
      const uniqueNotifications = allNotifications.filter((ticket, index, self) =>
        index === self.findIndex((t) => t.id === ticket.id)
      );

      setNotifications(uniqueNotifications.slice(0, 5));
      setUnreadCount(unreadTickets.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Sin fecha';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    if (diffDays <= 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES');
  };

  const getTypeIcon = (tipo) => {
    switch (tipo) {
      case 'complaint':
        return <ExclamationCircleIcon className="h-4 w-4 text-red-500" />;
      case 'support':
        return <ChatIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <ChatIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  if (rol !== 'admin' || loading) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">
                Notificaciones de Tickets
              </h3>
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No hay notificaciones nuevas
              </div>
            ) : (
              <>
                {notifications.map((ticket) => (
                  <a
                    key={ticket.id}
                    href={`/admin/gestion-tickets?ticket=${ticket.id}`}
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3 mt-1">
                        {getTypeIcon(ticket.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {ticket.asunto}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          De: {ticket.nombre}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">
                            {formatDate(ticket.fechaCreacion)}
                          </span>
                          <div className="flex items-center gap-1">
                            {ticket.type === 'unread' && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                Nuevo
                              </span>
                            )}
                            {ticket.prioridad === 'urgente' && (
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                Urgente
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}

                <div className="border-t border-gray-200">
                  <a
                    href="/admin/gestion-tickets"
                    className="block px-4 py-2 text-sm text-blue-600 hover:text-blue-800 text-center"
                    onClick={() => setShowDropdown(false)}
                  >
                    Ver todos los tickets
                  </a>
                </div>
              </>
            )}
          </div>
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
};

export default TicketNotifications;
