import React, { useState } from 'react';
import { StarIcon, HeartIcon, ShoppingCartIcon, EyeIcon } from '@heroicons/react/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/solid';
import StarRating from './StarRating';
import ProviderBadges from './ProviderBadges';

const ProductCard = ({ 
  product, 
  onViewDetail, 
  onAddToFavorites, 
  isFavorite = false,
  showProviderInfo = true 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Precio no disponible';
    
    // Asegurarse de que price sea un número
    let numericPrice = price;
    if (typeof price === 'string') {
      numericPrice = parseFloat(price.replace(/[^0-9.-]+/g, ""));
    }
    
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return 'Precio no disponible';
    }
    
    try {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
      }).format(numericPrice);
    } catch (error) {
      return `$${numericPrice.toLocaleString('es-CL')}`;
    }
  };

  const getImageSrc = () => {
    if (imageError) return '/images/no-image-placeholder.png';
    if (product.imagenes && product.imagenes.length > 0) {
      const img = product.imagenes[0];
      if (img.startsWith('http')) {
        return img;
      } else {
        // Decodificar primero en caso de que ya esté codificado
        let fileName = img;
        try {
          fileName = decodeURIComponent(img);
        } catch (e) {
          // Si ya no está codificado, usar tal como está
          fileName = img;
        }
        return `/images/${fileName}`;
      }
    }
    return '/images/no-image-placeholder.png';
  };

  const getConditionBadge = () => {
    if (!product.condicion) return null;
    
    const conditionColors = {
      'nuevo': 'bg-green-100 text-green-800',
      'usado': 'bg-yellow-100 text-yellow-800',
      'reacondicionado': 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded-full ${
        conditionColors[product.condicion?.toLowerCase()] || 'bg-gray-100 text-gray-800'
      }`}>
        {product.condicion}
      </span>
    );
  };

  const getStockStatus = () => {
    const stock = product.stock;
    if (stock === undefined || stock === null) return null;
    
    // Convertir a número si es string
    let numericStock = stock;
    if (typeof stock === 'string') {
      numericStock = parseInt(stock);
      if (isNaN(numericStock)) return null;
    }
    
    if (numericStock === 0) {
      return (
        <span className="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          Agotado
        </span>
      );
    }
    
    if (numericStock <= 5) {
      return (
        <span className="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
          Pocas unidades
        </span>
      );
    }
    
    return null;
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group ${
        isHovered ? 'transform -translate-y-1' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={getImageSrc()}
          alt={product.nombre}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
          loading="lazy"
        />
        
        {getConditionBadge()}
        {getStockStatus()}
        
        {/* Overlay Actions */}
        <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center space-x-2 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetail(product.id);
            }}
            className="bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            title="Ver detalles"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToFavorites(product.id);
            }}
            className="bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            {isFavorite ? (
              <HeartSolid className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5" />
            )}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Función de agregar al carrito
            }}
            className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            title="Agregar al carrito"
            disabled={product.stock === 0 || product.stock === '0'}
          >
            <ShoppingCartIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 leading-tight">
          {product.nombre}
        </h3>

        {/* Rating and Reviews */}
        {product.rating && (
          <div className="flex items-center space-x-2 mb-2">
            <StarRating value={product.rating} readonly size="sm" showValue={false} />
            <span className="text-sm text-gray-500">
              ({product.reviewCount || 0} reseñas)
            </span>
          </div>
        )}

        {/* Description */}
        {product.descripcion && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.descripcion}
          </p>
        )}

        {/* Categories/Tags */}
        {product.categorias && product.categorias.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.categorias.slice(0, 2).map((categoria, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {categoria}
              </span>
            ))}
            {product.categorias.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{product.categorias.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Provider Info */}
        {showProviderInfo && product.empresa && (
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              {product.empresa.logo && (
                <img
                  src={product.empresa.logo}
                  alt={product.empresa.nombre}
                  className="w-6 h-6 rounded-full object-cover"
                />
              )}
              <span className="text-sm text-gray-600 truncate">
                {product.empresa.nombre}
              </span>
            </div>
            <ProviderBadges provider={product.empresa} size="sm" />
          </div>
        )}

        {/* Price and Stock */}
        <div className="flex items-center justify-between">
          <div>
            {product.precio && (
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(product.precio)}
                </span>
                {product.precioAnterior && product.precioAnterior > product.precio && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.precioAnterior)}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {product.stock !== undefined && product.stock !== null && (
            <div className="text-right">
              <span className="text-xs text-gray-500 block">Stock</span>
              <span className={`text-sm font-medium ${
                product.stock === 0 ? 'text-red-600' : 
                product.stock <= 5 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {product.stock === 0 ? 'Agotado' : `${product.stock} unidades`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
