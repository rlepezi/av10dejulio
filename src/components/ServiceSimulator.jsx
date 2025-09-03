import React, { useState } from 'react';
import { useClientMembership } from '../hooks/useClientMembership';

export default function ServiceSimulator({ clienteId }) {
  const { registrarServicio, puntos, membership } = useClientMembership(clienteId);
  const [simulating, setSimulating] = useState(false);
  const [lastService, setLastService] = useState(null);

  const services = [
    {
      id: 'mantenimiento',
      nombre: 'Mantenimiento Preventivo',
      descripcion: 'Cambio de aceite, filtros y revisión general',
      monto: 45000,
      puntos: 25,
      icon: '🔧'
    },
    {
      id: 'reparacion',
      nombre: 'Reparación de Frenos',
      descripcion: 'Cambio de pastillas y discos de freno',
      monto: 120000,
      puntos: 35,
      icon: '🛑'
    },
    {
      id: 'diagnostico',
      nombre: 'Diagnóstico Computarizado',
      descripcion: 'Revisión completa del sistema electrónico',
      monto: 25000,
      puntos: 15,
      icon: '💻'
    },
    {
      id: 'neumaticos',
      nombre: 'Cambio de Neumáticos',
      descripcion: 'Instalación de neumáticos nuevos',
      monto: 180000,
      puntos: 40,
      icon: '🛞'
    },
    {
      id: 'electrico',
      nombre: 'Reparación Sistema Eléctrico',
      descripcion: 'Reparación de alternador y batería',
      monto: 85000,
      puntos: 30,
      icon: '⚡'
    },
    {
      id: 'estetica',
      nombre: 'Lavado Premium',
      descripcion: 'Lavado completo con encerado',
      monto: 15000,
      puntos: 10,
      icon: '✨'
    }
  ];

  const handleSimulateService = async (service) => {
    try {
      setSimulating(true);
      
      const serviceData = {
        tipo: service.id,
        nombre: service.nombre,
        descripcion: service.descripcion,
        monto: service.monto,
        fecha: new Date(),
        empresa: 'Taller Demo',
        empresaPremium: Math.random() > 0.5 // Simular empresa premium aleatoriamente
      };

      const result = await registrarServicio(serviceData);
      
      if (result.success) {
        setLastService({
          ...service,
          puntosGanados: result.puntosGanados,
          ahorroEstimado: result.ahorroEstimado
        });
        
        // Mostrar notificación de éxito
        setTimeout(() => {
          setLastService(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Error simulating service:', error);
      alert('Error al simular servicio');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Simulador de Servicios</h3>
        <div className="text-right">
          <div className="text-sm text-gray-600">Puntos actuales</div>
          <div className="text-xl font-bold text-blue-600">{puntos || 0}</div>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Simula servicios para ganar puntos y probar el sistema de membresías
      </p>

      {/* Notificación de último servicio */}
      {lastService && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{lastService.icon}</span>
            <div>
              <h4 className="font-medium text-green-900">¡Servicio simulado exitosamente!</h4>
              <p className="text-sm text-green-700">
                {lastService.nombre} - +{lastService.puntosGanados} puntos ganados
              </p>
              <p className="text-xs text-green-600">
                Ahorro estimado: ${lastService.ahorroEstimado?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.map((service) => (
          <div key={service.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{service.icon}</span>
                <h4 className="font-medium text-gray-900">{service.nombre}</h4>
              </div>
              <span className="text-sm font-medium text-blue-600">+{service.puntos} pts</span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{service.descripcion}</p>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                ${service.monto.toLocaleString()}
              </span>
              <button
                onClick={() => handleSimulateService(service)}
                disabled={simulating}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {simulating ? 'Simulando...' : 'Simular'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Información sobre puntos */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h5 className="font-medium text-blue-900 mb-2">¿Cómo ganar puntos?</h5>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Servicios básicos: 10-15 puntos</p>
          <p>• Servicios de mantenimiento: 20-25 puntos</p>
          <p>• Servicios de reparación: 25-35 puntos</p>
          <p>• Bonificación por monto alto: +10-20 puntos</p>
          <p>• Bonificación empresa premium: +15 puntos</p>
        </div>
      </div>
    </div>
  );
}
