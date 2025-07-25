import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  OfficeBuildingIcon as BuildingOfficeIcon, 
  ShoppingBagIcon, 
  SpeakerphoneIcon,
  LocationMarkerIcon as MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
  StarIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/outline';

export default function ResultadosUnificados({ resultados, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!resultados || resultados.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron resultados</h3>
        <p className="text-gray-600">
          Intenta ajustar los términos de búsqueda o los filtros
        </p>
      </div>
    );
  }

  // Agrupar resultados por tipo
  const empresas = resultados.filter(r => r.tipo === 'empresa');
  const productos = resultados.filter(r => r.tipo === 'producto');
  const campañas = resultados.filter(r => r.tipo === 'campaña');

  const handleItemClick = (item) => {
    if (item.url) {
      navigate(item.url);
    }
  };

  const renderEmpresa = (empresa) => (
    <div
      key={empresa.id}
      className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => handleItemClick(empresa)}
    >
      <div className="p-6">
        {/* Header con tipo de empresa y badges */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">
              {empresa.tipoEmpresa?.charAt(0).toUpperCase() + empresa.tipoEmpresa?.slice(1) || 'Empresa'}
            </span>
          </div>
          
          <div className="flex gap-2">
            {empresa.origen === 'nuevo' && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                Nuevo
              </span>
            )}
            {empresa.verificado && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                ✓ Verificado
              </span>
            )}
            {empresa.premium && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                ⭐ Premium
              </span>
            )}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex gap-4">
          {/* Imagen o placeholder */}
          <div className="w-16 h-16 flex-shrink-0">
            {empresa.imagen ? (
              <img
                src={empresa.imagen}
                alt={empresa.titulo}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏪</span>
              </div>
            )}
          </div>

          {/* Información */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
              {empresa.titulo}
            </h3>
            
            {empresa.subtitulo && (
              <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                {empresa.subtitulo}
              </p>
            )}

            {empresa.descripcion && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{empresa.descripcion}</span>
              </div>
            )}

            {/* Rating si existe */}
            {empresa.rating > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(empresa.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {empresa.rating.toFixed(1)}
                </span>
              </div>
            )}

            {/* Categorías y marcas */}
            <div className="flex flex-wrap gap-1">
              {empresa.categorias?.slice(0, 2).map((categoria, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                >
                  {categoria}
                </span>
              ))}
              {empresa.marcas?.slice(0, 2).map((marca, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  {marca}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProducto = (producto) => (
    <div
      key={producto.id}
      className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => handleItemClick(producto)}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <ShoppingBagIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">Producto</span>
          </div>
          
          {producto.precio && (
            <span className="text-lg font-bold text-green-600">
              ${parseInt(producto.precio).toLocaleString()}
            </span>
          )}
        </div>

        {/* Contenido principal */}
        <div className="flex gap-4">
          {/* Imagen */}
          <div className="w-16 h-16 flex-shrink-0">
            {producto.imagen ? (
              <img
                src={producto.imagen}
                alt={producto.titulo}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            )}
          </div>

          {/* Información */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
              {producto.titulo}
            </h3>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span className="font-medium">{producto.subtitulo}</span>
              {producto.categoria && (
                <>
                  <span>•</span>
                  <span>{producto.categoria}</span>
                </>
              )}
            </div>

            {producto.descripcion && (
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {producto.descripcion}
              </p>
            )}

            {producto.empresa && (
              <p className="text-blue-600 text-sm font-medium">
                {producto.empresa}
              </p>
            )}

            {/* Estado de disponibilidad */}
            <div className="mt-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                producto.disponible !== false
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {producto.disponible !== false ? 'Disponible' : 'No disponible'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCampaña = (campaña) => (
    <div
      key={campaña.id}
      className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => handleItemClick(campaña)}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <SpeakerphoneIcon className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-600">Campaña</span>
          </div>
          
          <div className="flex gap-2">
            {campaña.descuento && (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-bold rounded-full">
                -{campaña.descuento}%
              </span>
            )}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              campaña.activa
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {campaña.activa ? 'Activa' : 'Finalizada'}
            </span>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex gap-4">
          {/* Imagen */}
          <div className="w-16 h-16 flex-shrink-0">
            {campaña.imagen ? (
              <img
                src={campaña.imagen}
                alt={campaña.titulo}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            )}
          </div>

          {/* Información */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
              {campaña.titulo}
            </h3>
            
            {campaña.subtitulo && (
              <p className="text-blue-600 text-sm font-medium mb-2">
                {campaña.subtitulo}
              </p>
            )}

            {campaña.descripcion && (
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {campaña.descripcion}
              </p>
            )}

            {/* Fechas */}
            {(campaña.fechaInicio || campaña.fechaFin) && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ClockIcon className="w-4 h-4" />
                <span>
                  {campaña.fechaInicio && new Date(campaña.fechaInicio).toLocaleDateString()}
                  {campaña.fechaInicio && campaña.fechaFin && ' - '}
                  {campaña.fechaFin && new Date(campaña.fechaFin).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Resumen de resultados */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {resultados.length} {resultados.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
        </h2>
        
        <div className="flex gap-4 text-sm text-gray-600">
          {empresas.length > 0 && (
            <span>{empresas.length} {empresas.length === 1 ? 'empresa' : 'empresas'}</span>
          )}
          {productos.length > 0 && (
            <span>{productos.length} {productos.length === 1 ? 'producto' : 'productos'}</span>
          )}
          {campañas.length > 0 && (
            <span>{campañas.length} {campañas.length === 1 ? 'campaña' : 'campañas'}</span>
          )}
        </div>
      </div>

      {/* Empresas */}
      {empresas.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
            Empresas ({empresas.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {empresas.map(renderEmpresa)}
          </div>
        </div>
      )}

      {/* Productos */}
      {productos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingBagIcon className="w-5 h-5 text-green-600" />
            Productos ({productos.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {productos.map(renderProducto)}
          </div>
        </div>
      )}

      {/* Campañas */}
      {campañas.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <SpeakerphoneIcon className="w-5 h-5 text-purple-600" />
            Campañas ({campañas.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {campañas.map(renderCampaña)}
          </div>
        </div>
      )}
    </div>
  );
}
