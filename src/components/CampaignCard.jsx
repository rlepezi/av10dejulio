import React, { useState } from 'react';
import { CalendarIcon, TagIcon, EyeIcon, ClockIcon } from '@heroicons/react/outline';

const CampaignCard = ({ campaign, onViewDetail }) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getImageSrc = () => {
    if (imageError) return '/images/campaign-placeholder.png';
    const imagen = campaign.imagenURL || campaign.imagenUrl || '';
    if (imagen) {
      if (imagen.startsWith('http')) {
        return imagen;
      } else {
        // Decodificar primero en caso de que ya esté codificado, luego volver a codificar
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
    return '/images/campaign-placeholder.png';
  };

  const getLogoSrc = () => {
    const logo = campaign.logoURL || campaign.logoUrl || '';
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

  const formatDate = (date) => {
    if (!date) return '';
    let dateObj;
    if (typeof date === 'object' && date.seconds) {
      dateObj = new Date(date.seconds * 1000);
    } else {
      dateObj = new Date(date);
    }
    return dateObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isExpiringSoon = () => {
    if (!campaign.fechaFin) return false;
    let finDate;
    if (typeof campaign.fechaFin === 'object' && campaign.fechaFin.seconds) {
      finDate = new Date(campaign.fechaFin.seconds * 1000);
    } else {
      finDate = new Date(campaign.fechaFin);
    }
    const today = new Date();
    const diffTime = finDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const getDaysRemaining = () => {
    if (!campaign.fechaFin) return null;
    let finDate;
    if (typeof campaign.fechaFin === 'object' && campaign.fechaFin.seconds) {
      finDate = new Date(campaign.fechaFin.seconds * 1000);
    } else {
      finDate = new Date(campaign.fechaFin);
    }
    const today = new Date();
    const diffTime = finDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();
  const expiringSoon = isExpiringSoon();

  return (
    <div 
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer ${
        isHovered ? 'transform -translate-y-2' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetail(campaign.id)}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
        <img
          src={getImageSrc()}
          alt={campaign.titulo}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
          loading="lazy"
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            campaign.estado === 'Activa' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}>
            {campaign.estado || 'Activa'}
          </span>
        </div>

        {/* Urgency Badge */}
        {expiringSoon && (
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 flex items-center space-x-1">
              <ClockIcon className="h-3 w-3" />
              <span>¡Últimos días!</span>
            </span>
          </div>
        )}

        {/* Logo overlay */}
        {getLogoSrc() && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
            <img
              src={getLogoSrc()}
              alt="Logo"
              className="w-16 h-16 rounded-full border-4 border-white shadow-lg object-cover bg-white"
            />
          </div>
        )}

        {/* Hover overlay */}
        <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button className="bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors flex items-center space-x-2">
            <EyeIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Ver campaña</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pt-8">
        {/* Title */}
        <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2 leading-tight">
          {campaign.titulo}
        </h3>

        {/* Description */}
        {campaign.descripcion && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
            {campaign.descripcion}
          </p>
        )}

        {/* Brands and Categories */}
        <div className="space-y-3 mb-4">
          {campaign.marcas && campaign.marcas.length > 0 && (
            <div className="flex items-center space-x-2">
              <TagIcon className="h-4 w-4 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {campaign.marcas.slice(0, 3).map((marca, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                  >
                    {marca}
                  </span>
                ))}
                {campaign.marcas.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{campaign.marcas.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {campaign.categorias && campaign.categorias.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {campaign.categorias.slice(0, 3).map((categoria, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                >
                  {categoria}
                </span>
              ))}
              {campaign.categorias.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{campaign.categorias.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="space-y-2">
          {campaign.fechaInicio && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <CalendarIcon className="h-4 w-4" />
              <span>Inicio: {formatDate(campaign.fechaInicio)}</span>
            </div>
          )}
          
          {campaign.fechaFin && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <CalendarIcon className="h-4 w-4" />
                <span>Fin: {formatDate(campaign.fechaFin)}</span>
              </div>
              
              {daysRemaining !== null && daysRemaining > 0 && (
                <div className={`text-sm font-medium ${
                  expiringSoon ? 'text-red-600' : 'text-green-600'
                }`}>
                  {daysRemaining === 1 ? '1 día restante' : `${daysRemaining} días restantes`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Discount Badge (if applicable) */}
        {campaign.descuento && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-lg text-center">
              <span className="font-bold text-lg">¡{campaign.descuento}% OFF!</span>
              <div className="text-xs opacity-90">En productos seleccionados</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignCard;
