import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import DashboardLayout from './DashboardLayout';
import NotificationManager from './NotificationManager';
import pushNotificationService from '../services/PushNotificationService';

export default function DashboardAgente() {
  // ...existing code...
  const getEstadoPrioridad = (empresa) => {
    const diasAsignacion = empresa.fecha_asignacion_agente 
      ? Math.floor((new Date() - empresa.fecha_asignacion_agente.toDate()) / (1000 * 60 * 60 * 24))
      : 0;
    if (diasAsignacion > 7) return 'URGENTE';
    if (diasAsignacion > 3) return 'ALTA';
    return 'NORMAL';
  };
  // ...existing code...
  // ...existing code...
  return (
    <DashboardLayout>
      {rol !== 'agente' ? (
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600">Solo agentes de campo pueden acceder a esta sección.</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {/* Mensaje de depuración para confirmar el dashboard avanzado */}
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
              <strong>DEBUG:</strong> Estás viendo el <b>Dashboard avanzado del agente</b> desde <code>src/components/DashboardAgente.jsx</code>.
              <br />Usuario: {user?.email || 'No autenticado'} | Rol: {rol}
            </div>
            {/* Header del Agente */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Panel de Agente de Campo
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {agente?.nombre} - Zona: {agente?.zona}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Última actividad</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {agente?.fecha_ultima_actividad?.toDate()?.toLocaleDateString() || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
            {/* ...resto del dashboard... */}
            {/* Estadísticas, formularios, tablas, etc. */}
            {/* ...existing code... */}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
