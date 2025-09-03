import React, { useState, useEffect } from 'react';

export default function MapaEmpresa({ direccion, nombreEmpresa }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [showFullMap, setShowFullMap] = useState(false);

  // Función para obtener coordenadas aproximadas basadas en la dirección
  const getCoordinatesFromAddress = (address) => {
    // Coordenadas por defecto para Santiago, Chile
    const defaultCoords = { lat: -33.4489, lng: -70.6693 };
    
    // Mapeo básico de direcciones comunes en Santiago
    const addressMappings = {
      'santiago': { lat: -33.4489, lng: -70.6693 },
      'providencia': { lat: -33.4255, lng: -70.6067 },
      'las condes': { lat: -33.4172, lng: -70.5500 },
      'ñuñoa': { lat: -33.4569, lng: -70.6000 },
      'maipú': { lat: -33.5100, lng: -70.7500 },
      'puente alto': { lat: -33.6167, lng: -70.5833 },
      'la florida': { lat: -33.5167, lng: -70.5667 },
      'san miguel': { lat: -33.4833, lng: -70.6500 },
      'san joaquín': { lat: -33.4833, lng: -70.6167 },
      'la reina': { lat: -33.4500, lng: -70.5500 },
      'vitacura': { lat: -33.4000, lng: -70.5500 },
      'lo barnechea': { lat: -33.3500, lng: -70.5167 }
    };

    const addressLower = address.toLowerCase();
    
    // Buscar coincidencias en el mapeo
    for (const [key, coords] of Object.entries(addressMappings)) {
      if (addressLower.includes(key)) {
        return coords;
      }
    }
    
    return defaultCoords;
  };

  useEffect(() => {
    if (direccion) {
      const coords = getCoordinatesFromAddress(direccion);
      setCoordinates(coords);
      
      // Simular carga del mapa
      setTimeout(() => {
        setMapLoaded(true);
      }, 1000);
    }
  }, [direccion]);

  if (!direccion) return null;

  const coords = coordinates || { lat: -33.4489, lng: -70.6693 };
  const bbox = `${coords.lng - 0.01},${coords.lat - 0.01},${coords.lng + 0.01},${coords.lat + 0.01}`;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📍 Ubicación</h3>
            <p className="text-gray-600">{direccion}</p>
          </div>
          <button
            onClick={() => setShowFullMap(!showFullMap)}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {showFullMap ? '🔽 Minimizar' : '🔼 Expandir'}
          </button>
        </div>
      </div>
      
      <div className={`relative bg-gray-100 transition-all duration-300 ${showFullMap ? 'h-96' : 'h-64'}`}>
        {!mapLoaded ? (
          // Indicador de carga
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Cargando mapa...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Mapa usando OpenStreetMap */}
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lng}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Mapa de ${nombreEmpresa}`}
            ></iframe>
            
            {/* Overlay con botones de acción */}
            <div className="absolute top-4 right-4 flex flex-col space-y-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg shadow-md text-sm font-medium transition-colors flex items-center"
              >
                <span className="mr-2">🗺️</span>
                Google Maps
              </a>
              <a
                href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(direccion)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg shadow-md text-sm font-medium transition-colors flex items-center"
              >
                <span className="mr-2">🧭</span>
                OpenStreetMap
              </a>
            </div>
            
            {/* Información de coordenadas */}
            <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-md">
              <p className="text-xs text-gray-600">
                📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </p>
            </div>
          </>
        )}
      </div>
      
      {/* Información adicional del mapa */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="flex items-center">
            <span className="mr-2">📍</span>
            {direccion}
          </span>
          <div className="flex space-x-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(direccion)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <span className="mr-1">🚗</span>
              Cómo llegar
            </a>
            <a
              href={`https://www.google.com/maps/place/${encodeURIComponent(direccion)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <span className="mr-1">ℹ️</span>
              Más info
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <span className="mr-1">📱</span>
              Abrir en app
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
