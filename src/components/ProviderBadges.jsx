import React from 'react';

const ProviderBadges = ({ empresa, size = 'md' }) => {
  const badges = [];

  // Tamaños
  const sizes = {
    sm: {
      text: 'text-xs',
      padding: 'px-1.5 py-0.5',
      icon: 'text-xs'
    },
    md: {
      text: 'text-xs',
      padding: 'px-2 py-1',
      icon: 'text-sm'
    },
    lg: {
      text: 'text-sm',
      padding: 'px-3 py-1.5',
      icon: 'text-base'
    }
  };

  const currentSize = sizes[size];

  // Determinar si es PyME (basado en criterios)
  const isPyme = () => {
    if (!empresa) return false;
    
    // Criterios para PyME:
    // 1. Empresa nueva (menos de 2 años registrada)
    // 2. Marcado explícitamente como PyME
    // 3. Número reducido de productos (menos de 50)
    
    const fechaRegistro = empresa.fechaRegistro || empresa.fechaCreacion;
    const esNueva = fechaRegistro && 
      (new Date() - (fechaRegistro.toDate ? fechaRegistro.toDate() : new Date(fechaRegistro))) < (2 * 365 * 24 * 60 * 60 * 1000);
    
    return empresa.esPyme || esNueva || (empresa.numeroProductos && empresa.numeroProductos < 50);
  };

  // Determinar si es emprendimiento
  const isEmprendimiento = () => {
    if (!empresa) return false;
    
    const fechaRegistro = empresa.fechaRegistro || empresa.fechaCreacion;
    const esMuyNueva = fechaRegistro && 
      (new Date() - (fechaRegistro.toDate ? fechaRegistro.toDate() : new Date(fechaRegistro))) < (6 * 30 * 24 * 60 * 60 * 1000); // 6 meses
    
    return empresa.esEmprendimiento || esMuyNueva || (empresa.numeroProductos && empresa.numeroProductos < 10);
  };

  // Determinar si es local
  const isLocal = () => {
    if (!empresa) return false;
    return empresa.esLocal || 
           (empresa.region && empresa.region.toLowerCase().includes('metropolitana')) ||
           (empresa.ciudad && ['santiago', 'providencia', 'las condes', 'vitacura'].includes(empresa.ciudad.toLowerCase()));
  };

  // Agregar badges según criterios
  if (isEmprendimiento()) {
    badges.push({
      text: '🚀 Emprendimiento',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-300'
    });
  } else if (isPyme()) {
    badges.push({
      text: '⭐ PyME',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-300'
    });
  }

  if (isLocal()) {
    badges.push({
      text: '📍 Local',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-300'
    });
  }

  // Badge de nuevo proveedor
  if (empresa && empresa.esNuevo) {
    badges.push({
      text: '✨ Nuevo',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-300'
    });
  }

  // Badge de verificado
  if (empresa && empresa.verificado) {
    badges.push({
      text: '✓ Verificado',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-800',
      borderColor: 'border-emerald-300'
    });
  }

  // Badge de calidad premium
  if (empresa && empresa.esPremium) {
    badges.push({
      text: '👑 Premium',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-300'
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((badge, index) => (
        <span
          key={index}
          className={`
            ${currentSize.text} ${currentSize.padding} 
            ${badge.bgColor} ${badge.textColor} ${badge.borderColor}
            border rounded-full font-medium whitespace-nowrap
            inline-flex items-center gap-1
          `}
        >
          {badge.text}
        </span>
      ))}
    </div>
  );
};

export default ProviderBadges;
