import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  XCircleIcon,
  ChatIcon,
  EyeIcon,
  CalendarIcon
} from '@heroicons/react/outline';

const UserTicketsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchUserTickets();
    }
  }, [user, filter]);

  const fetchUserTickets = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let q = query(
        collection(db, 'tickets'),
        where('email', '==', user.email),
        orderBy('fechaCreacion', 'desc')
      );

      const snapshot = await getDocs(q);
      let ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Aplicar filtros
      if (filter !== 'all') {
        ticketsData = ticketsData.filter(ticket => {
          switch (filter) {
            case 'abierto':
              return ticket.estado === 'abierto';
            case 'en_proceso':
              return ticket.estado === 'en_proceso';
            case 'resuelto':
              return ticket.estado === 'resuelto';
            case 'cerrado':
              return ticket.estado === 'cerrado';
            default:
              return true;
          }
        });
      }

      setTickets(ticketsData);
    } catch (error) {
      console.error('Error fetching user tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'abierto':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'en_proceso':
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />;
      case 'resuelto':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'cerrado':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (estado) => {
    switch (estado) {
      case 'abierto':
        return 'Abierto';
      case 'en_proceso':
        return 'En Proceso';
      case 'resuelto':
        return 'Resuelto';
      case 'cerrado':
        return 'Cerrado';
      default:
        return 'Sin estado';
    }
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'abierto':
        return 'bg-blue-100 text-blue-800';
      case 'en_proceso':
        return 'bg-yellow-100 text-yellow-800';
      case 'resuelto':
        return 'bg-green-100 text-green-800';
      case 'cerrado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (tipo) => {
    switch (tipo) {
      case 'general':
        return 'Consulta General';
      case 'suggestion':
        return 'Sugerencia';
      case 'complaint':
        return 'Reclamo';
      case 'support':
        return 'Soporte Técnico';
      default:
        return 'Otro';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Sin fecha';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso Requerido
          </h2>
          <p className="text-gray-600">
            Debes iniciar sesión para ver tus tickets y feedback.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Mis Consultas y Feedback
          </h1>
          <p className="text-gray-600 mt-2">
            Aquí puedes ver el estado de todas tus consultas, sugerencias y reclamos.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('abierto')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'abierto'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Abiertos
            </button>
            <button
              onClick={() => setFilter('en_proceso')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'en_proceso'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En Proceso
            </button>
            <button
              onClick={() => setFilter('resuelto')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'resuelto'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Resueltos
            </button>
            <button
              onClick={() => setFilter('cerrado')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'cerrado'
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cerrados
            </button>
          </div>
        </div>

        {/* Lista de Tickets */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando tus consultas...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <ChatIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes consultas registradas
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Tienes alguna pregunta o sugerencia? ¡Contáctanos!
            </p>
            <a
              href="/contacto"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Enviar Consulta
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(ticket.estado)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.estado)}`}>
                        {getStatusText(ticket.estado)}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {getTypeText(ticket.tipo)}
                      </span>
                      {ticket.prioridad === 'alta' && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          Alta Prioridad
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {ticket.asunto}
                    </h3>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {ticket.mensaje}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {formatDate(ticket.fechaCreacion)}
                      </div>
                      {ticket.respuestas && ticket.respuestas.length > 0 && (
                        <div className="flex items-center gap-1">
                          <ChatIcon className="h-4 w-4" />
                          {ticket.respuestas.length} respuesta{ticket.respuestas.length !== 1 ? 's' : ''}
                        </div>
                      )}
                      {ticket.visto && (
                        <div className="flex items-center gap-1 text-green-600">
                          <EyeIcon className="h-4 w-4" />
                          Visto por admin
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Respuestas */}
                {ticket.respuestas && ticket.respuestas.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Respuestas:</h4>
                    <div className="space-y-3">
                      {ticket.respuestas.map((respuesta, index) => (
                        <div key={index} className="bg-gray-50 rounded-md p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              Administrador
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(respuesta.fecha)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{respuesta.mensaje}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mensaje de agradecimiento para tickets resueltos */}
                {ticket.estado === 'resuelto' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <p className="text-sm text-green-700">
                        ¡Gracias por tu consulta! Hemos marcado este ticket como resuelto. 
                        Si necesitas ayuda adicional, no dudes en contactarnos nuevamente.
                      </p>
                    </div>
                  </div>
                )}

                {/* Mensaje de seguimiento para tickets en proceso */}
                {ticket.estado === 'en_proceso' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center">
                      <ExclamationCircleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                      <p className="text-sm text-yellow-700">
                        Estamos trabajando en tu consulta. Te mantendremos informado sobre el progreso.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserTicketsPage;
