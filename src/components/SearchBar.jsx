import React, { useState } from 'react';
import { SearchIcon, FilterIcon, XIcon } from '@heroicons/react/outline';

const SearchBar = ({ 
  busqueda, 
  setBusqueda, 
  categoriaSeleccionada, 
  setCategoriaSeleccionada,
  marcaSeleccionada,
  setMarcaSeleccionada,
  categoriasDisponibles = [],
  marcasDisponibles = []
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const clearAllFilters = () => {
    setBusqueda('');
    setCategoriaSeleccionada(null);
    setMarcaSeleccionada(null);
    setShowFilters(false);
  };

  const activeFiltersCount = [busqueda, categoriaSeleccionada, marcaSeleccionada].filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
      {/* Barra de búsqueda principal */}
      <div className="relative">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar productos, marcas, proveedores..."
            className="w-full pl-12 pr-24 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Limpiar filtros"
              >
                <XIcon className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Filtros avanzados"
            >
              <FilterIcon className="h-5 w-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Sugerencias rápidas */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Búsquedas populares:</span>
          {['Frenos', 'Aceite', 'Baterías', 'Llantas', 'Filtros'].map((term) => (
            <button
              key={term}
              onClick={() => setBusqueda(term)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros avanzados */}
      {showFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Filtro por categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={categoriaSeleccionada || ''}
                onChange={(e) => setCategoriaSeleccionada(e.target.value || null)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las categorías</option>
                {categoriasDisponibles.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por marca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marca
              </label>
              <select
                value={marcaSeleccionada || ''}
                onChange={(e) => setMarcaSeleccionada(e.target.value || null)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las marcas</option>
                {marcasDisponibles.map((marca) => (
                  <option key={marca} value={marca}>
                    {marca}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtros activos */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Filtros activos:</span>
              {busqueda && (
                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  Búsqueda: "{busqueda}"
                  <button
                    onClick={() => setBusqueda('')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {categoriaSeleccionada && (
                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  Categoría: {categoriaSeleccionada}
                  <button
                    onClick={() => setCategoriaSeleccionada(null)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {marcaSeleccionada && (
                <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                  Marca: {marcaSeleccionada}
                  <button
                    onClick={() => setMarcaSeleccionada(null)}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
