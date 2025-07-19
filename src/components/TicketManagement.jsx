import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  updateDoc, 
  doc,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

const TicketManagement = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'tickets'),
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
            case 'alta_prioridad':
              return ticket.prioridad === 'alta' || ticket.prioridad === 'urgente';
            case 'sin_respuesta':
              return !ticket.respuestas || ticket.respuestas.length === 0;
            default:
              return true;
          }
        });
      }

      setTickets(ticketsData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketClick = async (ticket) => {
    setSelectedTicket(ticket);
    
    // Marcar como visto
    if (!ticket.visto) {
      try {
        await updateDoc(doc(db, 'tickets', ticket.id), {
          visto: true,
          fechaActualizacion: serverTimestamp()
        });
        
        setTickets(prev => prev.map(t => 
          t.id === ticket.id ? { ...t, visto: true } : t
        ));
      } catch (error) {
        console.error('Error marking ticket as seen:', error);
      }
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        estado: newStatus,
        fechaActualizacion: serverTimestamp(),
        ...(newStatus === 'resuelto' && { resuelto: true })
      });

      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, estado: newStatus } : t
      ));

      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, estado: newStatus }));
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleSendResponse = async () => {
    if (!response.trim() || !selectedTicket) return;

    setResponding(true);
    try {
      const responseData = {
        mensaje: response.trim(),
        autor: user.displayName || user.email,
        autorId: user.uid,
        fecha: serverTimestamp(),
        esAdmin: true
      };

      // Agregar respuesta al ticket
      const updatedResponses = selectedTicket.respuestas || [];
      updatedResponses.push(responseData);

      await updateDoc(doc(db, 'tickets', selectedTicket.id), {
        respuestas: updatedResponses,
        estado: 'en_proceso',
        fechaActualizacion: serverTimestamp()
      });

      // Actualizar estado local
      setSelectedTicket(prev => ({
        ...prev,
        respuestas: updatedResponses,
        estado: 'en_proceso'
      }));

      setTickets(prev => prev.map(t => 
        t.id === selectedTicket.id 
          ? { ...t, respuestas: updatedResponses, estado: 'en_proceso' }
          : t
      ));

      setResponse('');
    } catch (error) {
      console.error('Error sending response:', error);
    } finally {
      setResponding(false);
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

  const getPriorityColor = (prioridad) => {
    switch (prioridad) {
      case 'baja':
        return 'text-green-600';
      case 'media':
        return 'text-yellow-600';
      case 'alta':
        return 'text-orange-600';
      case 'urgente':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (fecha) => {
    if (!fecha) return '';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleString();
  };

  const getStats = () => {
    const total = tickets.length;
    const abiertos = tickets.filter(t => t.estado === 'abierto').length;
    const enProceso = tickets.filter(t => t.estado === 'en_proceso').length;
    const resueltos = tickets.filter(t => t.estado === 'resuelto').length;
    const sinRespuesta = tickets.filter(t => !t.respuestas || t.respuestas.length === 0).length;
    
    return { total, abiertos, enProceso, resueltos, sinRespuesta };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panel izquierdo - Lista de tickets */}
      <div className="lg:col-span-2">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-3 rounded-lg shadow-sm text-center">
            <div className="text-xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm text-center">
            <div className="text-xl font-bold text-blue-600">{stats.abiertos}</div>
            <div className="text-xs text-gray-600">Abiertos</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm text-center">
            <div className="text-xl font-bold text-yellow-600">{stats.enProceso}</div>
            <div className="text-xs text-gray-600">En Proceso</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm text-center">
            <div className="text-xl font-bold text-green-600">{stats.resueltos}</div>
            <div className="text-xs text-gray-600">Resueltos</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm text-center">
            <div className="text-xl font-bold text-red-600">{stats.sinRespuesta}</div>
            <div className="text-xs text-gray-600">Sin Respuesta</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'abierto', label: 'Abiertos' },
              { key: 'en_proceso', label: 'En Proceso' },
              { key: 'resuelto', label: 'Resueltos' },
              { key: 'alta_prioridad', label: 'Alta Prioridad' },
              { key: 'sin_respuesta', label: 'Sin Respuesta' }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-3 py-1 rounded text-sm ${
                  filter === filterOption.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de tickets */}
        <div className="space-y-3">
          {tickets.map(ticket => (
            <div
              key={ticket.id}
              onClick={() => handleTicketClick(ticket)}
              className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow ${
                selectedTicket?.id === ticket.id ? 'ring-2 ring-blue-500' : ''
              } ${!ticket.visto ? 'border-l-4 border-l-blue-500' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {ticket.asunto}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{ticket.nombre}</span>
                    <span>•</span>
                    <span>{ticket.email}</span>
                    <span>•</span>
                    <span>{formatDate(ticket.fechaCreacion)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.estado)}`}>
                    {ticket.estado}
                  </span>
                  <span className={`text-xs font-medium ${getPriorityColor(ticket.prioridad)}`}>
                    {ticket.prioridad}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 line-clamp-2">
                {ticket.mensaje}
              </p>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {ticket.tipo}
                  </span>
                  {ticket.categoria && (
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                      {ticket.categoria}
                    </span>
                  )}
                </div>
                {ticket.respuestas && ticket.respuestas.length > 0 && (
                  <span className="text-xs text-green-600 font-medium">
                    {ticket.respuestas.length} respuesta(s)
                  </span>
                )}
              </div>
            </div>
          ))}

          {tickets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay tickets para mostrar
            </div>
          )}
        </div>
      </div>

      {/* Panel derecho - Detalle del ticket */}
      <div className="lg:col-span-1">
        {selectedTicket ? (
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedTicket.asunto}
              </h2>
              
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(selectedTicket.estado)}`}>
                  {selectedTicket.estado}
                </span>
                <select
                  value={selectedTicket.estado}
                  onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="abierto">Abierto</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="resuelto">Resuelto</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>De:</strong> {selectedTicket.nombre}</div>
                <div><strong>Email:</strong> {selectedTicket.email}</div>
                {selectedTicket.telefono && (
                  <div><strong>Teléfono:</strong> {selectedTicket.telefono}</div>
                )}
                <div><strong>Tipo:</strong> {selectedTicket.tipo}</div>
                {selectedTicket.categoria && (
                  <div><strong>Categoría:</strong> {selectedTicket.categoria}</div>
                )}
                <div><strong>Prioridad:</strong> 
                  <span className={getPriorityColor(selectedTicket.prioridad)}>
                    {' ' + selectedTicket.prioridad}
                  </span>
                </div>
                <div><strong>Fecha:</strong> {formatDate(selectedTicket.fechaCreacion)}</div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Mensaje:</h3>
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                {selectedTicket.mensaje}
              </div>
            </div>

            {/* Respuestas anteriores */}
            {selectedTicket.respuestas && selectedTicket.respuestas.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Respuestas:</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedTicket.respuestas.map((resp, index) => (
                    <div key={index} className="bg-blue-50 p-3 rounded text-sm">
                      <div className="font-medium text-blue-900 mb-1">
                        {resp.autor} - {formatDate(resp.fecha)}
                      </div>
                      <div className="text-blue-800">{resp.mensaje}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enviar respuesta */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Responder:</h3>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Escribe tu respuesta..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
              <button
                onClick={handleSendResponse}
                disabled={!response.trim() || responding}
                className="w-full mt-2 bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {responding ? 'Enviando...' : 'Enviar Respuesta'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
            Selecciona un ticket para ver los detalles
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketManagement;
