import React, { useState, useEffect } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export default function UsageMetrics({ empresaId }) {
  const { getCurrentPlan, getUsageStats } = useSubscription(empresaId);
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (empresaId) {
      loadUsageStats();
    }
  }, [empresaId]);

  const loadUsageStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const stats = await getUsageStats();
      setUsageStats(stats);

      // Cargar estadísticas adicionales
      const [productosSnapshot, campanasSnapshot, solicitudesSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'productos'),
          where('empresaId', '==', empresaId),
          where('estado', '==', 'aprobado')
        )),
        getDocs(query(
          collection(db, 'campanas'),
          where('empresaId', '==', empresaId),
          where('estado', '==', 'aprobada')
        )),
        getDocs(query(
          collection(db, 'solicitudes_productos'),
          where('empresaId', '==', empresaId),
          orderBy('fechaCreacion', 'desc'),
          limit(10)
        ))
      ]);

      const productos = productosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const campanas = campanasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const solicitudes = solicitudesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calcular estadísticas adicionales
      const totalVisitas = productos.reduce((sum, producto) => sum + (producto.visitas || 0), 0);
      const totalInteracciones = campanas.reduce((sum, campana) => sum + (campana.interacciones || 0), 0);
      const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente').length;

      setUsageStats(prev => ({
        ...prev,
        totalVisitas,
        totalInteracciones,
        solicitudesPendientes,
        productosDetalle: productos,
        campanasDetalle: campanas
      }));

    } catch (err) {
      console.error('Error loading usage stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error al cargar métricas: {error}</p>
      </div>
    );
  }

  if (!usageStats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">No hay datos de uso disponibles</p>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();
  const productosPercentage = currentPlan.limitations.maxProducts === -1 
    ? 0 
    : Math.min((usageStats.productos / currentPlan.limitations.maxProducts) * 100, 100);
  
  const campanasPercentage = currentPlan.limitations.maxCampaigns === -1 
    ? 0 
    : Math.min((usageStats.campanas / currentPlan.limitations.maxCampaigns) * 100, 100);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Métricas de Uso</h3>
        <button
          onClick={loadUsageStats}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{usageStats.productos}</div>
          <div className="text-sm text-blue-800">Productos Activos</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{usageStats.campanas}</div>
          <div className="text-sm text-green-800">Campañas Activas</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{usageStats.totalVisitas}</div>
          <div className="text-sm text-purple-800">Total Visitas</div>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{usageStats.totalInteracciones}</div>
          <div className="text-sm text-orange-800">Interacciones</div>
        </div>
      </div>

      {/* Barras de Progreso */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Productos</span>
            <span className="text-gray-600">
              {usageStats.productos}/{currentPlan.limitations.maxProducts === -1 ? '∞' : currentPlan.limitations.maxProducts}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${productosPercentage}%` }}
            ></div>
          </div>
          {productosPercentage >= 80 && (
            <p className="text-xs text-orange-600 mt-1">
              ⚠️ Estás cerca del límite de productos
            </p>
          )}
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Campañas</span>
            <span className="text-gray-600">
              {usageStats.campanas}/{currentPlan.limitations.maxCampaigns === -1 ? '∞' : currentPlan.limitations.maxCampaigns}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${campanasPercentage}%` }}
            ></div>
          </div>
          {campanasPercentage >= 80 && (
            <p className="text-xs text-orange-600 mt-1">
              ⚠️ Estás cerca del límite de campañas
            </p>
          )}
        </div>
      </div>

      {/* Productos Recientes */}
      {usageStats.productosDetalle && usageStats.productosDetalle.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Productos Recientes</h4>
          <div className="space-y-2">
            {usageStats.productosDetalle.slice(0, 3).map((producto) => (
              <div key={producto.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-900">{producto.nombre}</p>
                  <p className="text-xs text-gray-500">{producto.categoria}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{producto.visitas || 0} visitas</p>
                  <p className="text-xs text-gray-500">
                    {new Date(producto.fechaCreacion?.toDate()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campañas Recientes */}
      {usageStats.campanasDetalle && usageStats.campanasDetalle.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Campañas Recientes</h4>
          <div className="space-y-2">
            {usageStats.campanasDetalle.slice(0, 3).map((campana) => (
              <div key={campana.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-900">{campana.nombre}</p>
                  <p className="text-xs text-gray-500">{campana.tipo}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{campana.interacciones || 0} interacciones</p>
                  <p className="text-xs text-gray-500">
                    {new Date(campana.fechaCreacion?.toDate()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solicitudes Pendientes */}
      {usageStats.solicitudesPendientes > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">📋</span>
            <p className="text-yellow-800 text-sm">
              Tienes {usageStats.solicitudesPendientes} solicitud{usageStats.solicitudesPendientes !== 1 ? 'es' : ''} pendiente{usageStats.solicitudesPendientes !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
