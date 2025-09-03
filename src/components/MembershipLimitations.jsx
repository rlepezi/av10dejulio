import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { MEMBERSHIP_PLANS } from '../constants/membershipPlans';

export default function MembershipLimitations({ empresaId }) {
  const { getCurrentPlan, canAccessFeature } = useSubscription(empresaId);
  
  const currentPlan = getCurrentPlan();
  const limitations = currentPlan.limitations;

  const limitationItems = [
    {
      key: 'maxProducts',
      label: 'Productos Máximos',
      value: limitations.maxProducts === -1 ? 'Ilimitados' : limitations.maxProducts,
      icon: '📦'
    },
    {
      key: 'maxCampaigns',
      label: 'Campañas Máximas',
      value: limitations.maxCampaigns === -1 ? 'Ilimitadas' : limitations.maxCampaigns,
      icon: '🎯'
    },
    {
      key: 'analyticsLevel',
      label: 'Nivel de Analytics',
      value: limitations.analyticsLevel,
      icon: '📊'
    },
    {
      key: 'supportLevel',
      label: 'Nivel de Soporte',
      value: limitations.supportLevel,
      icon: '🛠️'
    },
    {
      key: 'customBranding',
      label: 'Branding Personalizado',
      value: limitations.customBranding ? 'Incluido' : 'No incluido',
      icon: '🎨'
    },
    {
      key: 'advancedCampaigns',
      label: 'Campañas Avanzadas',
      value: limitations.advancedCampaigns ? 'Disponible' : 'No disponible',
      icon: '⚡'
    },
    {
      key: 'prioritySupport',
      label: 'Soporte Prioritario',
      value: limitations.prioritySupport ? 'Incluido' : 'No incluido',
      icon: '⭐'
    },
    {
      key: 'advisorAccess',
      label: 'Acceso a Asesor',
      value: limitations.advisorAccess ? 'Incluido' : 'No incluido',
      icon: '👨‍💼'
    },
    {
      key: 'eventAccess',
      label: 'Acceso a Eventos',
      value: limitations.eventAccess ? 'Incluido' : 'No incluido',
      icon: '🎪'
    },
    {
      key: 'discountServices',
      label: 'Descuentos en Servicios',
      value: limitations.discountServices ? 'Disponible' : 'No disponible',
      icon: '💰'
    }
  ];

  const getValueColor = (key, value) => {
    if (key === 'maxProducts' || key === 'maxCampaigns') {
      return value === 'Ilimitados' || value === 'Ilimitadas' ? 'text-green-600' : 'text-gray-600';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'text-green-600' : 'text-gray-400';
    }
    
    if (value === 'Incluido' || value === 'Disponible') {
      return 'text-green-600';
    }
    
    if (value === 'No incluido' || value === 'No disponible') {
      return 'text-gray-400';
    }
    
    return 'text-gray-600';
  };

  const getValueIcon = (key, value) => {
    if (key === 'maxProducts' || key === 'maxCampaigns') {
      return value === 'Ilimitados' || value === 'Ilimitadas' ? '✅' : '📊';
    }
    
    if (typeof value === 'boolean') {
      return value ? '✅' : '❌';
    }
    
    if (value === 'Incluido' || value === 'Disponible') {
      return '✅';
    }
    
    if (value === 'No incluido' || value === 'No disponible') {
      return '❌';
    }
    
    return '📊';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Limitaciones del Plan</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${currentPlan.color}-100 text-${currentPlan.color}-800`}>
          {currentPlan.name}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {limitationItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">{item.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className={`text-sm ${getValueColor(item.key, item.value)}`}>
                  {getValueIcon(item.key, item.value)} {item.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">💡 Información Importante</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Los límites se renuevan mensualmente</li>
          <li>• Puedes actualizar tu plan en cualquier momento</li>
          <li>• Las campañas avanzadas incluyen segmentación y automatización</li>
          <li>• El soporte prioritario incluye respuesta en menos de 24 horas</li>
        </ul>
      </div>
    </div>
  );
}
