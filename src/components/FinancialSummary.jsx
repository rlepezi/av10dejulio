import React, { useState, useEffect } from 'react';
import { PaymentService } from '../services/PaymentService';
import { formatPrice } from '../constants/membershipPlans';

export default function FinancialSummary({ empresaId }) {
  const [financialData, setFinancialData] = useState({
    currentMonth: {
      revenue: 0,
      expenses: 0,
      profit: 0,
      subscriptions: 0,
      pendingPayments: 0
    },
    previousMonth: {
      revenue: 0,
      expenses: 0,
      profit: 0
    },
    yearToDate: {
      revenue: 0,
      expenses: 0,
      profit: 0,
      growth: 0
    },
    projections: {
      nextMonth: 0,
      nextQuarter: 0
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (empresaId) {
      loadFinancialData();
    }
  }, [empresaId]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      // Simular carga de datos financieros
      // En producción, esto vendría de PaymentService y otros servicios
      const mockData = {
        currentMonth: {
          revenue: 2500000,
          expenses: 800000,
          profit: 1700000,
          subscriptions: 3,
          pendingPayments: 450000
        },
        previousMonth: {
          revenue: 2200000,
          expenses: 750000,
          profit: 1450000
        },
        yearToDate: {
          revenue: 28500000,
          expenses: 9200000,
          profit: 19300000,
          growth: 15.8
        },
        projections: {
          nextMonth: 2800000,
          nextQuarter: 8500000
        }
      };
      
      setFinancialData(mockData);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return '📈';
    if (growth < 0) return '📉';
    return '➡️';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando resumen financiero...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen Financiero Principal */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">💰 Resumen Financiero</h2>
        
        {/* Métricas del Mes Actual */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-lg inline-block mb-3">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Ingresos del Mes</h3>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(financialData.currentMonth.revenue, 'CLP')}
            </p>
            <div className="flex items-center justify-center mt-1">
              <span className={`text-xs ${getGrowthColor(financialData.yearToDate.growth)}`}>
                {getGrowthIcon(financialData.yearToDate.growth)} {financialData.yearToDate.growth}%
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="p-3 bg-red-100 rounded-lg inline-block mb-3">
              <span className="text-2xl">💸</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Gastos del Mes</h3>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(financialData.currentMonth.expenses, 'CLP')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {((financialData.currentMonth.expenses / financialData.currentMonth.revenue) * 100).toFixed(1)}% de ingresos
            </p>
          </div>

          <div className="text-center">
            <div className="p-3 bg-blue-100 rounded-lg inline-block mb-3">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Beneficio del Mes</h3>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(financialData.currentMonth.profit, 'CLP')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {((financialData.currentMonth.profit / financialData.currentMonth.revenue) * 100).toFixed(1)}% margen
            </p>
          </div>

          <div className="text-center">
            <div className="p-3 bg-yellow-100 rounded-lg inline-block mb-3">
              <span className="text-2xl">⏳</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Pagos Pendientes</h3>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(financialData.currentMonth.pendingPayments, 'CLP')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {financialData.currentMonth.subscriptions} suscripciones activas
            </p>
          </div>
        </div>

        {/* Comparación con Mes Anterior */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Comparación con Mes Anterior</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Ingresos</span>
                <span className={`text-sm font-medium ${getGrowthColor(financialData.currentMonth.revenue - financialData.previousMonth.revenue)}`}>
                  {getGrowthIcon(financialData.currentMonth.revenue - financialData.previousMonth.revenue)}
                </span>
              </div>
              <div className="mt-2 flex items-baseline">
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(financialData.currentMonth.revenue, 'CLP')}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  vs {formatPrice(financialData.previousMonth.revenue, 'CLP')}
                </span>
              </div>
              <div className="mt-1">
                <span className={`text-xs ${getGrowthColor(((financialData.currentMonth.revenue - financialData.previousMonth.revenue) / financialData.previousMonth.revenue) * 100)}`}>
                  {((financialData.currentMonth.revenue - financialData.previousMonth.revenue) / financialData.previousMonth.revenue * 100).toFixed(1)}% vs mes anterior
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Gastos</span>
                <span className={`text-sm font-medium ${getGrowthColor(financialData.currentMonth.expenses - financialData.previousMonth.expenses)}`}>
                  {getGrowthIcon(financialData.currentMonth.expenses - financialData.previousMonth.expenses)}
                </span>
              </div>
              <div className="mt-2 flex items-baseline">
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(financialData.currentMonth.expenses, 'CLP')}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  vs {formatPrice(financialData.previousMonth.expenses, 'CLP')}
                </span>
              </div>
              <div className="mt-1">
                <span className={`text-xs ${getGrowthColor(((financialData.currentMonth.expenses - financialData.previousMonth.expenses) / financialData.previousMonth.expenses) * 100)}`}>
                  {((financialData.currentMonth.expenses - financialData.previousMonth.expenses) / financialData.previousMonth.expenses * 100).toFixed(1)}% vs mes anterior
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Beneficio</span>
                <span className={`text-sm font-medium ${getGrowthColor(financialData.currentMonth.profit - financialData.previousMonth.profit)}`}>
                  {getGrowthIcon(financialData.currentMonth.profit - financialData.previousMonth.profit)}
                </span>
              </div>
              <div className="mt-2 flex items-baseline">
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(financialData.currentMonth.profit, 'CLP')}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  vs {formatPrice(financialData.previousMonth.profit, 'CLP')}
                </span>
              </div>
              <div className="mt-1">
                <span className={`text-xs ${getGrowthColor(((financialData.currentMonth.profit - financialData.previousMonth.profit) / financialData.previousMonth.profit) * 100)}`}>
                  {((financialData.currentMonth.profit - financialData.previousMonth.profit) / financialData.previousMonth.profit * 100).toFixed(1)}% vs mes anterior
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen Anual y Proyecciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen Anual */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">📅 Resumen Anual</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ingresos Totales</span>
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(financialData.yearToDate.revenue, 'CLP')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Gastos Totales</span>
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(financialData.yearToDate.expenses, 'CLP')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Beneficio Total</span>
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(financialData.yearToDate.profit, 'CLP')}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Crecimiento Anual</span>
                <span className={`text-lg font-bold ${getGrowthColor(financialData.yearToDate.growth)}`}>
                  {getGrowthIcon(financialData.yearToDate.growth)} {financialData.yearToDate.growth}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Proyecciones */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🔮 Proyecciones</h3>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Próximo Mes</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatPrice(financialData.projections.nextMonth, 'CLP')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Basado en tendencias actuales y suscripciones activas
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Próximo Trimestre</span>
                <span className="text-lg font-bold text-green-600">
                  {formatPrice(financialData.projections.nextQuarter, 'CLP')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Proyección de 3 meses considerando crecimiento estacional
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights y Recomendaciones */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">💡 Insights y Recomendaciones</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Oportunidad de Crecimiento</h4>
                <p className="text-sm text-gray-600">
                  Tu margen de beneficio del {((financialData.currentMonth.profit / financialData.currentMonth.revenue) * 100).toFixed(1)}% está por encima del promedio del sector. Considera invertir en marketing para aumentar ingresos.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Atención Requerida</h4>
                <p className="text-sm text-gray-600">
                  Tienes {formatPrice(financialData.currentMonth.pendingPayments, 'CLP')} en pagos pendientes. Revisa las suscripciones que requieren renovación.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



