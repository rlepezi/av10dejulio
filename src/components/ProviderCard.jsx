import React, { useState } from 'react';
import { 
  LocationMarkerIcon, 
  PhoneIcon, 
  ClockIcon, 
  StarIcon,
  EyeIcon,
  ExternalLinkIcon
} from '@heroicons/react/outline';
import ProviderBadges from './ProviderBadges';
import StarRating from './StarRating';

const ProviderCard = ({ 
  provider, 
  onViewDetail, 
  onViewLocation, 
  showDetailedInfo = true 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getImageSrc = () => {
    if (imageError) return '/images/provider-placeholder.png';
    const imagen = provider.imagenURL || provider.imagenUrl || provider.imagen || '';
    if (imagen) {
      if (imagen.startsWith('http')) {
        return imagen;
      } else {
        // Decodificar primero en caso de que ya esté codificado
        let fileName = imagen;
        try {
          fileName = decodeURIComponent(imagen);
        } catch (e) {
          // Si ya no está codificado, usar tal como está
          fileName = imagen;
        }
        return `/images/${fileName}`;
      }
    }
    return '/images/provider-placeholder.png';
  };

  const getLogoSrc = () => {
    const logo = provider.logoURL || provider.logoUrl || provider.logo || '';
    if (logo) {
      if (logo.startsWith('http')) {
        return logo;
      } else {
        // Decodificar primero en caso de que ya esté codificado
        let fileName = logo;
        try {
          fileName = decodeURIComponent(logo);
        } catch (e) {
          // Si ya no está codificado, usar tal como está
          fileName = logo;
        }
        return `/images/${fileName}`;
      }
    }
    return null;
  };

  const formatAddress = (address) => {
    if (!address) return 'Dirección no disponible';
    if (address.length > 60) {
      return address.substring(0, 60) + '...';
    }
    return address;
  };

  const formatPhone = (phone) => {
    if (!phone) return null;
    // Format Chilean phone numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `+56 ${cleaned.substring(0, 1)} ${cleaned.substring(1, 5)} ${cleaned.substring(5)}`;
    }
    return phone;
  };

  const getStatusColor = () => {
    if (!provider.estado) return 'text-gray-500';
    switch (provider.estado.toLowerCase()) {
      case 'activa': return 'text-green-600';
      case 'inactiva': return 'text-red-600';
      case 'pendiente': return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group ${
        isHovered ? 'transform -translate-y-1' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header Image */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600">
        <img
          src={getImageSrc()}
          alt={provider.nombre}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
          loading="lazy"
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm ${getStatusColor()}`}>
            {provider.estado || 'activa'}
          </span>
        </div>

        {/* Logo */}
        {getLogoSrc() && (
          <div className="absolute bottom-0 left-4 transform translate-y-1/2">
            <img
              src={getLogoSrc()}
              alt={`Logo ${provider.nombre}`}
              className="w-16 h-16 rounded-full border-4 border-white shadow-lg object-cover bg-white"
            />
          </div>
        )}

        {/* Hover overlay */}
        <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center space-x-2 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetail(provider.id);
            }}
            className="bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            title="Ver detalles"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          
          {provider.ubicacion && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewLocation(provider);
              }}
              className="bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
              title="Ver ubicación"
            >
              <LocationMarkerIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-8">
        {/* Provider Name */}
        <div className="mb-3">
          <h3 className="font-bold text-xl text-gray-900 mb-1">
            {provider.nombre}
          </h3>
          <ProviderBadges provider={provider} />
        </div>

        {/* Rating */}
        {provider.rating && (
          <div className="flex items-center space-x-2 mb-3">
            <StarRating value={provider.rating} readonly size="sm" showValue={false} />
            <span className="text-sm text-gray-500">
              ({provider.reviewCount || 0} reseñas)
            </span>
          </div>
        )}

        {/* Description */}
        {provider.descripcion && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {provider.descripcion}
          </p>
        )}

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {provider.direccion && (
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <LocationMarkerIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{formatAddress(provider.direccion)}</span>
            </div>
          )}
          
          {provider.telefono && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <PhoneIcon className="h-4 w-4" />
              <a 
                href={`tel:${provider.telefono}`}
                className="hover:text-blue-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {formatPhone(provider.telefono)}
              </a>
            </div>
          )}
          
          {provider.horario && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <ClockIcon className="h-4 w-4" />
              <span>{provider.horario}</span>
            </div>
          )}
        </div>

        {/* Brands and Categories */}
        {showDetailedInfo && (
          <div className="space-y-2 mb-4">
            {provider.marcas && provider.marcas.length > 0 && (
              <div>
                <span className="text-xs text-gray-500 block mb-1">Marcas:</span>
                <div className="flex flex-wrap gap-1">
                  {provider.marcas.slice(0, 3).map((marca, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {marca}
                    </span>
                  ))}
                  {provider.marcas.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{provider.marcas.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {provider.categorias && provider.categorias.length > 0 && (
              <div>
                <span className="text-xs text-gray-500 block mb-1">Servicios:</span>
                <div className="flex flex-wrap gap-1">
                  {provider.categorias.slice(0, 2).map((categoria, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                    >
                      {categoria}
                    </span>
                  ))}
                  {provider.categorias.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{provider.categorias.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => onViewDetail(provider.id)}
            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Ver detalles
          </button>
          
          {provider.website && (
            <a
              href={provider.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              title="Visitar sitio web"
            >
              <ExternalLinkIcon className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderCard;
