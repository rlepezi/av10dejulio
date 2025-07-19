import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';

const SistemaRecordatorios = () => {
  const { user } = useAuth();
  const [recordatorios, setRecordatorios] = useState([]);
  const [configuracion, setConfiguracion] = useState({
    notificaciones_email: true,
    notificaciones_push: true,
    anticipacion_dias: 30
  });

  // Tipos de recordatorios con lógica estacional
  const tiposRecordatorios = {
    permiso_circulacion: {
      nombre: "Permiso de Circulación",
      mes_vencimiento: 3, // Marzo
      icono: "📋",
      color: "red",
      recordatorios: [60, 30, 15, 7, 1], // días antes
      requisitos: ["revision_tecnica", "seguro_obligatorio", "multas_pagadas"],
      proveedores: ["municipalidad", "gestores_automotrices"]
    },
    
    seguro_obligatorio: {
      nombre: "Seguro Obligatorio",
      mes_vencimiento: 3, // Marzo
      icono: "🛡️",
      color: "blue",
      recordatorios: [45, 20, 10, 5],
      requisitos: ["vehiculo_vigente"],
      proveedores: ["compañias_seguro"]
    },
    
    revision_tecnica: {
      nombre: "Revisión Técnica",
      tipo: "anual", // o "bianual" para autos nuevos
      icono: "🔧",
      color: "green",
      recordatorios: [60, 30, 15, 7],
      requisitos: ["vehiculo_operativo"],
      proveedores: ["plantas_revision"]
    },
    
    mantenimiento_preventivo: {
      nombre: "Mantenimiento Preventivo",
      tipo: "km_o_tiempo",
      icono: "⚙️",
      color: "orange",
      intervalos: {
        aceite: { km: 5000, meses: 6 },
        filtros: { km: 15000, meses: 12 },
        frenos: { km: 20000, meses: 18 },
        neumaticos: { km: 40000, años: 4 }
      }
    }
  };

  const recordatoriosActivos = [
    {
      id: 1,
      tipo: "permiso_circulacion",
      vehiculo: "Toyota Corolla 2018 - ABCD12",
      fecha_vencimiento: "2025-03-31",
      dias_restantes: 45,
      estado: "pendiente",
      acciones_requeridas: [
        { tarea: "Renovar revisión técnica", completada: false, vencimiento: "2025-02-28" },
        { tarea: "Renovar seguro obligatorio", completada: false, vencimiento: "2025-03-15" },
        { tarea: "Verificar multas pendientes", completada: true, fecha_completada: "2025-01-10" }
      ]
    },
    {
      id: 2,
      tipo: "seguro_obligatorio",
      vehiculo: "Toyota Corolla 2018 - ABCD12",
      fecha_vencimiento: "2025-03-15",
      dias_restantes: 30,
      estado: "pendiente",
      cotizaciones_disponibles: [
        { compañia: "Mapfre", precio: 45000, cobertura: "SOAP" },
        { compañia: "Liberty", precio: 42000, cobertura: "SOAP" },
        { compañia: "HDI", precio: 47000, cobertura: "SOAP + RC" }
      ]
    },
    {
      id: 3,
      tipo: "mantenimiento_preventivo",
      vehiculo: "Toyota Corolla 2018 - ABCD12",
      servicio: "Cambio de aceite",
      km_actual: 87500,
      km_proximo: 90000,
      fecha_estimada: "2025-02-20",
      dias_restantes: 15,
      estado: "urgente"
    }
  ];

  const getColorClass = (tipo, estado) => {
    if (estado === 'urgente') return 'border-red-500 bg-red-50';
    if (estado === 'proximo') return 'border-yellow-500 bg-yellow-50';
    return 'border-gray-300 bg-white';
  };

  const getIconoEstado = (dias_restantes) => {
    if (dias_restantes <= 7) return '🚨';
    if (dias_restantes <= 15) return '⚠️';
    if (dias_restantes <= 30) return '⏰';
    return '📅';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg mb-6">
          <h1 className="text-2xl font-bold">🔔 Centro de Recordatorios AV10</h1>
          <p className="mt-2">Mantén tu vehículo al día con recordatorios inteligentes</p>
        </div>

        {/* Resumen Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <h3 className="text-lg font-semibold text-red-600">🚨 Urgentes</h3>
            <p className="text-2xl font-bold">2</p>
            <p className="text-sm text-gray-600">Requieren atención inmediata</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold text-yellow-600">⚠️ Próximos</h3>
            <p className="text-2xl font-bold">3</p>
            <p className="text-sm text-gray-600">En los próximos 30 días</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-green-600">✅ Completados</h3>
            <p className="text-2xl font-bold">8</p>
            <p className="text-sm text-gray-600">Este año</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-blue-600">💰 Ahorrado</h3>
            <p className="text-2xl font-bold">$85,000</p>
            <p className="text-sm text-gray-600">En multas evitadas</p>
          </div>
        </div>

        {/* Lista de Recordatorios */}
        <div className="space-y-4">
          {recordatoriosActivos.map((recordatorio) => (
            <div
              key={recordatorio.id}
              className={`rounded-lg border-2 p-6 shadow-sm ${getColorClass(recordatorio.tipo, recordatorio.estado)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getIconoEstado(recordatorio.dias_restantes)}</span>
                    <div>
                      <h3 className="text-lg font-bold">
                        {tiposRecordatorios[recordatorio.tipo]?.icono} {tiposRecordatorios[recordatorio.tipo]?.nombre}
                      </h3>
                      <p className="text-sm text-gray-600">{recordatorio.vehiculo}</p>
                    </div>
                  </div>

                  {/* Información específica del recordatorio */}
                  {recordatorio.tipo === 'permiso_circulacion' && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">📋 Acciones Requeridas:</h4>
                      <div className="space-y-2">
                        {recordatorio.acciones_requeridas.map((accion, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={accion.completada}
                              className="rounded"
                              readOnly
                            />
                            <span className={accion.completada ? 'line-through text-gray-500' : ''}>
                              {accion.tarea}
                            </span>
                            {accion.vencimiento && !accion.completada && (
                              <span className="text-red-600 text-sm">
                                (Vence: {accion.vencimiento})
                              </span>
                            )}
                            {accion.completada && (
                              <span className="text-green-600 text-sm">
                                ✓ {accion.fecha_completada}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recordatorio.tipo === 'seguro_obligatorio' && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">💰 Cotizaciones Disponibles:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {recordatorio.cotizaciones_disponibles.map((cotizacion, index) => (
                          <div key={index} className="border rounded p-3 bg-white">
                            <h5 className="font-semibold">{cotizacion.compañia}</h5>
                            <p className="text-green-600 font-bold">${cotizacion.precio.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">{cotizacion.cobertura}</p>
                            <button className="w-full bg-blue-600 text-white px-3 py-1 rounded text-sm mt-2 hover:bg-blue-700">
                              Contratar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recordatorio.tipo === 'mantenimiento_preventivo' && (
                    <div className="mt-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-sm text-gray-600">KM Actual:</span>
                          <span className="font-bold ml-1">{recordatorio.km_actual.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Próximo servicio:</span>
                          <span className="font-bold ml-1">{recordatorio.km_proximo.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Faltan:</span>
                          <span className="font-bold ml-1 text-orange-600">
                            {recordatorio.km_proximo - recordatorio.km_actual} km
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">Vence en:</span>
                    <p className="text-xl font-bold text-red-600">{recordatorio.dias_restantes} días</p>
                    <p className="text-sm text-gray-600">{recordatorio.fecha_vencimiento || recordatorio.fecha_estimada}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 w-full">
                      Ver Proveedores
                    </button>
                    <button className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 w-full">
                      Programar
                    </button>
                    <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-100 w-full">
                      Posponer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Calendario de Marzo */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">📅 Calendario Marzo 2025 - Renovaciones</h2>
          
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <h3 className="font-bold text-red-800">🚨 ¡Mes Crítico para Renovaciones!</h3>
            <p className="text-red-700">
              En marzo vencen permisos de circulación y seguros obligatorios. 
              Programa tus trámites con anticipación para evitar multas.
            </p>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {/* Headers días */}
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dia => (
              <div key={dia} className="font-bold p-2 bg-gray-100 rounded">
                {dia}
              </div>
            ))}
            
            {/* Días del mes */}
            {Array.from({length: 31}, (_, i) => i + 1).map(dia => (
              <div 
                key={dia} 
                className={`p-2 border rounded ${
                  dia === 15 ? 'bg-blue-100 border-blue-500' : 
                  dia === 31 ? 'bg-red-100 border-red-500' : 
                  'border-gray-200'
                }`}
              >
                <div className="font-semibold">{dia}</div>
                {dia === 15 && <div className="text-xs text-blue-700">Seguros</div>}
                {dia === 31 && <div className="text-xs text-red-700">Permisos</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SistemaRecordatorios;
