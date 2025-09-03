import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

export default function AdminDashboardStats() {
  const { rol } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    clientes: {
      total: 0,
      pendientes: 0,
      activos: 0,
      rechazados: 0,
      suspendidos: 0
    },
    vehiculos: {
      total: 0,
      porMarca: {},
      porAño: {},
      promedioAño: 0
    },
    notificaciones: {
      total: 0,
      porTipo: {},
      noLeidas: 0
    },
    actividad: {
      registrosHoy: 0,
      registrosUltimaSemana: 0,
      registrosUltimoMes: 0
    }
  });

  useEffect(() => {
    if (rol === 'admin') {
      loadStats();
    }
  }, [rol]);

  const loadStats = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando estadísticas del admin...');
      
      // Estadísticas de clientes - probar diferentes colecciones
      let clientes = [];
      try {
        const clientesSnapshot = await getDocs(collection(db, 'clientes'));
        clientes = clientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('👥 Clientes encontrados:', clientes.length);
      } catch (error) {
        console.log('⚠️ No se encontró colección "clientes", probando "perfiles_clientes"');
        try {
          const perfilesSnapshot = await getDocs(collection(db, 'perfiles_clientes'));
          clientes = perfilesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('👥 Perfiles de clientes encontrados:', clientes.length);
        } catch (error2) {
          console.log('⚠️ No se encontró colección "perfiles_clientes"');
        }
      }
      
      // Estadísticas de empresas
      let empresas = [];
      try {
        const empresasSnapshot = await getDocs(collection(db, 'empresas'));
        empresas = empresasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('🏢 Empresas encontradas:', empresas.length);
      } catch (error) {
        console.log('⚠️ No se encontró colección "empresas"');
      }
      
      // Estadísticas de vehículos
      let vehiculos = [];
      try {
        const vehiculosSnapshot = await getDocs(collection(db, 'vehiculos'));
        vehiculos = vehiculosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('🚗 Vehículos encontrados:', vehiculos.length);
      } catch (error) {
        console.log('⚠️ No se encontró colección "vehiculos"');
      }
      
      // Estadísticas de notificaciones
      let notificaciones = [];
      try {
        const notificacionesSnapshot = await getDocs(collection(db, 'notificaciones'));
        notificaciones = notificacionesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('🔔 Notificaciones encontradas:', notificaciones.length);
      } catch (error) {
        console.log('⚠️ No se encontró colección "notificaciones"');
      }
      
      // Calcular fechas
      const ahora = new Date();
      const ayer = new Date(ahora);
      ayer.setDate(ayer.getDate() - 1);
      const hace7dias = new Date(ahora);
      hace7dias.setDate(hace7dias.getDate() - 7);
      const hace30dias = new Date(ahora);
      hace30dias.setDate(hace30dias.getDate() - 30);

      // Procesar datos
      const statsClientes = processClientStats(clientes);
      const statsVehiculos = processVehicleStats(vehiculos);
      const statsNotificaciones = processNotificationStats(notificaciones);
      const statsActividad = processActivityStats([...clientes, ...empresas], ahora, ayer, hace7dias, hace30dias);
      
      const nuevasStats = {
        clientes: statsClientes,
        vehiculos: statsVehiculos,
        notificaciones: statsNotificaciones,
        actividad: statsActividad,
        empresas: {
          total: empresas.length,
          activas: empresas.filter(e => e.estado === 'activa' || e.estado === 'Activa').length,
          pendientes: empresas.filter(e => e.estado === 'pendiente' || e.estado === 'en_revision').length
        }
      };
      
      console.log('✅ Estadísticas procesadas:', nuevasStats);
      setStats(nuevasStats);
      
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const processClientStats = (clientes) => {
    return {
      total: clientes.length,
      pendientes: clientes.filter(c => c.estado === 'pendiente_validacion').length,
      activos: clientes.filter(c => c.estado === 'activo').length,
      rechazados: clientes.filter(c => c.estado === 'rechazado').length,
      suspendidos: clientes.filter(c => c.estado === 'suspendido').length
    };
  };

  const processVehicleStats = (vehiculos) => {
    const porMarca = {};
    const porAño = {};
    let sumaAños = 0;

    vehiculos.forEach(vehiculo => {
      // Por marca
      if (vehiculo.marca) {
        porMarca[vehiculo.marca] = (porMarca[vehiculo.marca] || 0) + 1;
      }
      
      // Por año
      if (vehiculo.año) {
        const año = vehiculo.año.toString();
        porAño[año] = (porAño[año] || 0) + 1;
        sumaAños += parseInt(vehiculo.año);
      }
    });

    return {
      total: vehiculos.length,
      porMarca,
      porAño,
      promedioAño: vehiculos.length > 0 ? Math.round(sumaAños / vehiculos.length) : 0
    };
  };

  const processNotificationStats = (notificaciones) => {
    const porTipo = {};
    let noLeidas = 0;

    notificaciones.forEach(notif => {
      if (notif.tipo) {
        porTipo[notif.tipo] = (porTipo[notif.tipo] || 0) + 1;
      }
      if (!notif.leida) {
        noLeidas++;
      }
    });

    return {
      total: notificaciones.length,
      porTipo,
      noLeidas
    };
  };

  const processActivityStats = (clientes, ahora, ayer, hace7dias, hace30dias) => {
    return {
      registrosHoy: clientes.filter(c => {
        if (!c.fechaRegistro) return false;
        const fecha = c.fechaRegistro.toDate ? c.fechaRegistro.toDate() : new Date(c.fechaRegistro);
        return fecha.toDateString() === ahora.toDateString();
      }).length,
      registrosUltimaSemana: clientes.filter(c => {
        if (!c.fechaRegistro) return false;
        const fecha = c.fechaRegistro.toDate ? c.fechaRegistro.toDate() : new Date(c.fechaRegistro);
        return fecha >= hace7dias;
      }).length,
      registrosUltimoMes: clientes.filter(c => {
        if (!c.fechaRegistro) return false;
        const fecha = c.fechaRegistro.toDate ? c.fechaRegistro.toDate() : new Date(c.fechaRegistro);
        return fecha >= hace30dias;
      }).length
    };
  };

  const getTopItems = (obj, limit = 5) => {
    return Object.entries(obj)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit);
  };

  if (rol !== 'admin') {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-bold text-red-600">Acceso Denegado</h2>
        <p className="text-gray-600">Solo administradores pueden ver estas estadísticas.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Administrativo</h1>
            <p className="text-gray-600">Métricas y estadísticas del sistema</p>
          </div>
          <button
            onClick={loadStats}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>

        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Clientes */}
          <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Clientes</p>
                <p className="text-3xl font-bold text-blue-800">{stats.clientes.total}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {stats.clientes.pendientes} pendientes
                </p>
              </div>
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>

          {/* Vehículos */}
          <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Vehículos</p>
                <p className="text-3xl font-bold text-green-800">{stats.vehiculos.total}</p>
                <p className="text-xs text-green-600 mt-1">
                  Año promedio: {stats.vehiculos.promedioAño}
                </p>
              </div>
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14l-1.2 4.8a2 2 0 01-1.9 1.2H8.1a2 2 0 01-1.9-1.2L5 8zm5-3V3a1 1 0 011-1h2a1 1 0 011 1v2m-4 0h4" />
              </svg>
            </div>
          </div>

          {/* Notificaciones */}
          <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Notificaciones</p>
                <p className="text-3xl font-bold text-yellow-800">{stats.notificaciones.total}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  {stats.notificaciones.noLeidas} sin leer
                </p>
              </div>
              <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>

          {/* Actividad */}
          <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Registros Hoy</p>
                <p className="text-3xl font-bold text-purple-800">{stats.actividad.registrosHoy}</p>
                <p className="text-xs text-purple-600 mt-1">
                  {stats.actividad.registrosUltimaSemana} esta semana
                </p>
              </div>
              <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Gráficos y Detalles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Marcas de Vehículos */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Top Marcas de Vehículos</h3>
            <div className="space-y-3">
              {getTopItems(stats.vehiculos.porMarca).map(([marca, cantidad]) => (
                <div key={marca} className="flex justify-between items-center">
                  <span className="font-medium">{marca}</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-200 h-2 rounded" style={{ width: `${(cantidad / Math.max(...Object.values(stats.vehiculos.porMarca))) * 100}px` }}></div>
                    <span className="text-sm text-gray-600">{cantidad}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribución de Estados de Clientes */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Estados de Clientes</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-green-600">✅ Activos</span>
                <span className="font-semibold">{stats.clientes.activos}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-600">⏳ Pendientes</span>
                <span className="font-semibold">{stats.clientes.pendientes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-600">❌ Rechazados</span>
                <span className="font-semibold">{stats.clientes.rechazados}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">⚠️ Suspendidos</span>
                <span className="font-semibold">{stats.clientes.suspendidos}</span>
              </div>
            </div>
          </div>

          {/* Tipos de Notificaciones */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Tipos de Notificaciones</h3>
            <div className="space-y-3">
              {getTopItems(stats.notificaciones.porTipo).map(([tipo, cantidad]) => (
                <div key={tipo} className="flex justify-between items-center">
                  <span className="font-medium capitalize">{tipo.replace('_', ' ')}</span>
                  <span className="text-sm text-gray-600">{cantidad}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>📅 Registros hoy</span>
                <span className="font-semibold">{stats.actividad.registrosHoy}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>📅 Esta semana</span>
                <span className="font-semibold">{stats.actividad.registrosUltimaSemana}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>📅 Este mes</span>
                <span className="font-semibold">{stats.actividad.registrosUltimoMes}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="mt-8 flex flex-wrap gap-4">
          <button
            onClick={() => window.location.href = '/admin/validacion-clientes'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Validar Clientes
          </button>
          <button
            onClick={() => window.location.href = '/admin/marcas'}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Gestionar Marcas
          </button>
          <button
            onClick={() => window.location.href = '/admin/tipos-empresa'}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Tipos de Empresa
          </button>
        </div>
      </div>
    </div>
  );
}
