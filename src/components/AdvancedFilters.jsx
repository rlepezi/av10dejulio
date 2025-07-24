import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const AdvancedFilters = ({ 
  onFiltersChange, 
  initialFilters = {},
  showRegionFilter = true,
  showTypeFilter = true,
  showVerificationFilter = true 
}) => {
  const navigate = useNavigate();
  const { user, rol } = useAuth();

  const [filters, setFilters] = useState({
    region: '',
    ciudad: '',
    tipoProveedor: '',
    tipoEmpresa: '',
    verificado: '',
    esLocal: false,
    esPyme: false,
    esEmprendimiento: false,
    esPremium: false,
    ...initialFilters
  });

  const [regiones, setRegiones] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [expanded, setExpanded] = useState(false);

  // Regiones de Chile
  const regionesChile = [
    'Región de Arica y Parinacota',
    'Región de Tarapacá',
    'Región de Antofagasta',
    'Región de Atacama',
    'Región de Coquimbo',
    'Región de Valparaíso',
    'Región Metropolitana',
    'Región del Libertador General Bernardo O\'Higgins',
    'Región del Maule',
    'Región de Ñuble',
    'Región del Biobío',
    'Región de La Araucanía',
    'Región de Los Ríos',
    'Región de Los Lagos',
    'Región Aysén del General Carlos Ibáñez del Campo',
    'Región de Magallanes y de la Antártica Chilena'
  ];

  useEffect(() => {
    fetchRegionesYCiudades();
  }, []);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const fetchRegionesYCiudades = async () => {
    try {
      const empresasSnapshot = await getDocs(collection(db, 'empresas'));
      const empresasData = empresasSnapshot.docs.map(doc => doc.data());
      
      // Extraer regiones únicas
      const regionesUnicas = [...new Set(empresasData
        .filter(e => e.region)
        .map(e => e.region)
      )].sort();
      
      // Extraer ciudades únicas
      const ciudadesUnicas = [...new Set(empresasData
        .filter(e => e.ciudad)
        .map(e => e.ciudad)
      )].sort();
      
      setRegiones(regionesUnicas);
      setCiudades(ciudadesUnicas);
    } catch (error) {
      console.error('Error fetching regiones y ciudades:', error);
      // Fallback a regiones predefinidas
      setRegiones(regionesChile);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    const clearedFilters = {
      region: '',
      ciudad: '',
      tipoProveedor: '',
      tipoEmpresa: '',
      verificado: '',
      esLocal: false,
      esPyme: false,
      esEmprendimiento: false,
      esPremium: false
    };
    setFilters(clearedFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value && value !== '' && value !== false
  ).length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          🔍 Filtros Avanzados
          {activeFiltersCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {/* Botón de acceso rápido para admin */}
          {user && rol === "admin" && (
            <button
              onClick={() => navigate("/admin/tipos-empresa")}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-md flex items-center gap-1 transition-colors"
              title="Gestionar tipos de empresa"
            >
              🏢 Tipos de Empresa
            </button>
          )}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Limpiar filtros
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {expanded ? 'Ocultar' : 'Mostrar'} filtros
          </button>
        </div>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Filtro por Región */}
          {showRegionFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Región
              </label>
              <select
                value={filters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Todas las regiones</option>
                {regiones.map(region => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro por Ciudad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad
            </label>
            <select
              value={filters.ciudad}
              onChange={(e) => handleFilterChange('ciudad', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Todas las ciudades</option>
              {ciudades.map(ciudad => (
                <option key={ciudad} value={ciudad}>
                  {ciudad}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Tipo de Proveedor */}
          {showTypeFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Proveedor
              </label>
              <select
                value={filters.tipoProveedor}
                onChange={(e) => handleFilterChange('tipoProveedor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Todos los tipos</option>
                <option value="emprendimiento">🚀 Emprendimientos</option>
                <option value="pyme">⭐ PyMEs</option>
                <option value="empresa">🏢 Empresas</option>
                <option value="local">📍 Locales</option>
              </select>
            </div>
          )}

          {/* Filtro por Tipo de Empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Empresa
            </label>
            <select
              value={filters.tipoEmpresa}
              onChange={(e) => handleFilterChange('tipoEmpresa', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="proveedor">🔧 Proveedor</option>
              <option value="pyme">⭐ PyME</option>
              <option value="empresa">🏢 Empresa</option>
              <option value="emprendimiento">🚀 Emprendimiento</option>
              <option value="local">📍 Local</option>
              <option value="premium">💎 Premium</option>
            </select>
          </div>

          {/* Filtro por Verificación */}
          {showVerificationFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filters.verificado}
                onChange={(e) => handleFilterChange('verificado', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Todos los estados</option>
                <option value="verificado">✓ Verificados</option>
                <option value="premium">👑 Premium</option>
                <option value="nuevo">✨ Nuevos</option>
              </select>
            </div>
          )}

          {/* Checkboxes para características especiales */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Características Especiales
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.esLocal}
                  onChange={(e) => handleFilterChange('esLocal', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">📍 Proveedor Local</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.esPyme}
                  onChange={(e) => handleFilterChange('esPyme', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">⭐ PyME</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.esEmprendimiento}
                  onChange={(e) => handleFilterChange('esEmprendimiento', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">🚀 Emprendimiento</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.esPremium}
                  onChange={(e) => handleFilterChange('esPremium', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">👑 Premium</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Resumen de filtros activos */}
      {activeFiltersCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Filtros activos:</span>
            {filters.region && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                📍 {filters.region}
              </span>
            )}
            {filters.ciudad && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                🏙️ {filters.ciudad}
              </span>
            )}
            {filters.tipoProveedor && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {filters.tipoProveedor === 'emprendimiento' && '🚀 Emprendimientos'}
                {filters.tipoProveedor === 'pyme' && '⭐ PyMEs'}
                {filters.tipoProveedor === 'empresa' && '🏢 Empresas'}
                {filters.tipoProveedor === 'local' && '📍 Locales'}
              </span>
            )}
            {filters.tipoEmpresa && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                {filters.tipoEmpresa === 'proveedor' && '🔧 Proveedor'}
                {filters.tipoEmpresa === 'pyme' && '⭐ PyME'}
                {filters.tipoEmpresa === 'empresa' && '🏢 Empresa'}
                {filters.tipoEmpresa === 'emprendimiento' && '🚀 Emprendimiento'}
                {filters.tipoEmpresa === 'local' && '📍 Local'}
                {filters.tipoEmpresa === 'premium' && '💎 Premium'}
              </span>
            )}
            {filters.verificado && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {filters.verificado === 'verificado' && '✓ Verificados'}
                {filters.verificado === 'premium' && '👑 Premium'}
                {filters.verificado === 'nuevo' && '✨ Nuevos'}
              </span>
            )}
            {(filters.esLocal || filters.esPyme || filters.esEmprendimiento || filters.esPremium) && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                Características especiales
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
