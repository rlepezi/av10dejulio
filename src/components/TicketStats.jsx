import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  ChatIcon,
  LightBulbIcon,
  ExclamationCircleIcon,
  CogIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon
} from '@heroicons/react/outline';

const TicketStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    abiertos: 0,
    enProceso: 0,
    resueltos: 0,
    sinVer: 0,
    suggestions: 0,
    complaints: 0,
    support: 0,
    general: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const ticketsSnapshot = await getDocs(collection(db, 'tickets'));
      const tickets = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const newStats = {
        total: tickets.length,
        abiertos: tickets.filter(t => t.estado === 'abierto').length,
        enProceso: tickets.filter(t => t.estado === 'en_proceso').length,
        resueltos: tickets.filter(t => t.estado === 'resuelto').length,
        sinVer: tickets.filter(t => !t.visto).length,
        suggestions: tickets.filter(t => t.tipo === 'suggestion').length,
        complaints: tickets.filter(t => t.tipo === 'complaint').length,
        support: tickets.filter(t => t.tipo === 'support').length,
        general: tickets.filter(t => t.tipo === 'general').length
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching ticket stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Tickets',
      value: stats.total,
      icon: ChatIcon,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      iconColor: 'text-blue-500'
    },
    {
      title: 'Sin Ver',
      value: stats.sinVer,
      icon: EyeIcon,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      iconColor: 'text-red-500',
      urgent: stats.sinVer > 0
    },
    {
      title: 'Abiertos',
      value: stats.abiertos,
      icon: ClockIcon,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      iconColor: 'text-yellow-500'
    },
    {
      title: 'Resueltos',
      value: stats.resueltos,
      icon: CheckCircleIcon,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      iconColor: 'text-green-500'
    },
    {
      title: 'Sugerencias',
      value: stats.suggestions,
      icon: LightBulbIcon,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      iconColor: 'text-purple-500'
    },
    {
      title: 'Reclamos',
      value: stats.complaints,
      icon: ExclamationCircleIcon,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      iconColor: 'text-orange-500'
    },
    {
      title: 'Soporte',
      value: stats.support,
      icon: CogIcon,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      iconColor: 'text-indigo-500'
    },
    {
      title: 'Consultas',
      value: stats.general,
      icon: ChatIcon,
      color: 'gray',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      iconColor: 'text-gray-500'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Estadísticas de Tickets
        </h3>
        <button
          onClick={fetchStats}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div 
              key={index} 
              className={`${card.bgColor} rounded-lg p-4 relative ${
                card.urgent ? 'ring-2 ring-red-200 animate-pulse' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    {card.title}
                  </p>
                  <p className={`text-2xl font-bold ${card.textColor}`}>
                    {card.value}
                  </p>
                </div>
                <Icon className={`h-8 w-8 ${card.iconColor}`} />
              </div>
              {card.urgent && (
                <div className="absolute -top-1 -right-1">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Barra de progreso de resolución */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Tasa de Resolución
          </span>
          <span className="text-sm text-gray-500">
            {stats.total > 0 ? Math.round((stats.resueltos / stats.total) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
            style={{ 
              width: `${stats.total > 0 ? (stats.resueltos / stats.total) * 100 : 0}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          <a
            href="/admin/gestion-tickets"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Ver Todos los Tickets
          </a>
          {stats.sinVer > 0 && (
            <a
              href="/admin/gestion-tickets?filter=sin_respuesta"
              className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
            >
              {stats.sinVer} Sin Ver
            </a>
          )}
          {stats.abiertos > 0 && (
            <a
              href="/admin/gestion-tickets?filter=abierto"
              className="inline-flex items-center px-3 py-2 border border-yellow-300 text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors"
            >
              {stats.abiertos} Abiertos
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketStats;
