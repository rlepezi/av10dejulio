import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import ProviderBadges from '../components/ProviderBadges';
import ProviderReputation from '../components/ProviderReputation';
import AdvancedFilters from '../components/AdvancedFilters';
import HeaderMenu from '../components/HeaderMenu';

const LocalProvidersPage = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('nombre');

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [providers, filters, sortBy]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'empresas'),
        where('estado', '==', 'activa'),
        orderBy('nombre')
      );
      
      const snapshot = await getDocs(q);
      const providersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setProviders(providersData);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...providers];

    // Aplicar filtros existentes
    if (filters.search) {
      filtered = filtered.filter(provider => 
        provider.nombre?.toLowerCase().includes(filters.search.toLowerCase()) ||
        provider.descripcion?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'fecha':
          const dateA = new Date(a.fechaRegistro || a.createdAt || 0);
          const dateB = new Date(b.fechaRegistro || b.createdAt || 0);
          return dateB - dateA;
        default:
          return 0;
      }
    });

    setFilteredProviders(filtered);
  };

  const formatDate = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString();
  };

  const getProviderStats = () => {
    return {
      total: filteredProviders.length,
      premium: filteredProviders.filter(p => p.esPremium).length
    };
  };

  const stats = getProviderStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderMenu />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra de navegacion global */}
      <HeaderMenu />
      
      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section - Enfoque en Comunidad Existente */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl text-white p-8 mb-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <span className="bg-yellow-400 text-blue-900 px-4 py-2 rounded-full text-sm font-bold">
                ¡COMUNIDAD ACTIVA!
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              📋 {providers.length}+ Proveedores Automotrices
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-6">
              Descubre mas de <strong className="text-yellow-400">{providers.length} proveedores verificados</strong> que 
              forman parte de nuestra comunidad: vulcanizaciones, talleres mecanicos, centros de pintura, 
              venta de repuestos y servicios especializados.
            </p>

            {/* Estadisticas de la comunidad */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold text-yellow-400">{stats.total}</div>
                <div className="text-sm text-blue-200">Proveedores Totales</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold text-yellow-400">{Math.floor(stats.total * 0.7)}</div>
                <div className="text-sm text-blue-200">Locales Establecidos</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold text-yellow-400">{Math.floor(stats.total * 0.4)}</div>
                <div className="text-sm text-blue-200">PyMEs Activas</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold text-yellow-400">{Math.floor(stats.total * 0.2)}</div>
                <div className="text-sm text-blue-200">Emprendimientos</div>
              </div>
            </div>

            {/* Botones principales de navegacion */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/proveedores')}
                className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
              >
                🔍 Explorar Catálogo
              </button>
              <button
                onClick={() => navigate('/proveedores-locales')}
                className="bg-blue-400 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-300 transition-colors shadow-lg"
              >
                🏪 Ver Empresas
              </button>
              <button
                onClick={() => navigate('/login?tipo=cliente')}
                className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors shadow-lg"
              >
                👤 Área Cliente
              </button>
              <button
                onClick={() => navigate('/login?tipo=empresa')}
                className="bg-green-400 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-300 transition-colors shadow-lg"
              >
                🏢 Área Empresa
              </button>
              <button
                onClick={() => navigate('/registro-cliente')}
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-700 transition-colors"
              >
                ➕ <span>Registrarse</span>
              </button>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative">
            <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-4">🎯 Encuentra lo que Buscas</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-2xl mb-1">🔧</div>
                      <div className="text-sm">Talleres</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-2xl mb-1">🏁</div>
                      <div className="text-sm">Vulcanización</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-2xl mb-1">🎨</div>
                      <div className="text-sm">Pintura</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-2xl mb-1">⚙️</div>
                      <div className="text-sm">Repuestos</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Beneficios de la Comunidad */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">
              💎 Beneficios de Formar Parte de Nuestra Comunidad
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-blue-50 rounded-xl">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Acceso a Clientes</h3>
                <p className="text-gray-600">
                  Conecta con cientos de duenos de vehiculos que buscan servicios confiables en tu area.
                </p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Presencia Digital</h3>
                <p className="text-gray-600">
                  Tu negocio aparecera en nuestra plataforma donde miles de usuarios buscan servicios automotrices.
                </p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-xl">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Herramientas Gratuitas</h3>
                <p className="text-gray-600">
                  Gestion de campanas, analisis de mercado y herramientas de promocion sin costo adicional.
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/registro-pyme')}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                >
                  🚀 Unirse a la Comunidad
                </button>
                <button
                  onClick={() => navigate('/contacto')}
                  className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  💬 Más Información
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Seccion de Estado Actual */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-6 mb-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="text-3xl mr-3">📊</span>
              <h2 className="text-2xl font-bold text-orange-800">Estado Actual de la Comunidad</h2>
            </div>
            <p className="text-lg text-orange-700 mb-6">
              Actualmente tenemos <strong className="text-orange-800">{providers.length} proveedores registrados</strong> 
              y estan <strong>verificados y activos</strong> en la plataforma. Todos ellos pueden solicitar formar parte 
              de promociones y beneficios especiales.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <strong>✅ Verificados:</strong> Información validada
              </div>
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <strong>🎯 Activos:</strong> Reciben consultas diariamente
              </div>
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <strong>💎 Premium:</strong> Acceso a beneficios especiales
              </div>
            </div>
          </div>
        </div>

        {/* Seccion de filtros y listado */}
        <div className="mb-6" id="proveedores-grid">
          <AdvancedFilters 
            onFiltersChange={setFilters}
            totalResults={filteredProviders.length}
          />
        </div>

        {/* Controles de vista y ordenamiento */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {filteredProviders.length} de {providers.length} proveedores
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Ordenar por:</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="nombre">Nombre A-Z</option>
              <option value="fecha">Mas recientes</option>
            </select>
          </div>
        </div>

        {/* Lista de proveedores */}
        {filteredProviders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              🔍 No se encontraron proveedores con los filtros aplicados
            </div>
            <button
              onClick={() => setFilters({})}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <div
                key={provider.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header con informacion basica */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-lg">
                        {provider.nombre ? provider.nombre.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">
                        {provider.nombre || 'Sin nombre'}
                      </h3>
                      <div className="mt-1">
                        <ProviderBadges 
                          provider={provider} 
                          compact={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido principal */}
                <div className="p-4">
                  {/* Descripcion */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {provider.descripcion || 'Proveedor de servicios automotrices'}
                  </p>

                  {/* Categorias */}
                  {provider.categorias && provider.categorias.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {provider.categorias.slice(0, 3).map((categoria, index) => (
                          <span 
                            key={index}
                            className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
                          >
                            {categoria}
                          </span>
                        ))}
                        {provider.categorias.length > 3 && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                            +{provider.categorias.length - 3} mas
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reputacion */}
                  <div className="mb-4">
                    <ProviderReputation 
                      proveedorId={provider.id} 
                      compact={true} 
                      showReviews={false}
                    />
                  </div>
                </div>

                {/* Footer con acciones */}
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate("/proveedor/" + provider.id)}
                      className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded hover:bg-blue-700 transition-colors"
                    >
                      Ver Perfil
                    </button>
                    {provider.web && (
                      <a
                        href={provider.web}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-200 text-gray-700 text-sm py-2 px-3 rounded hover:bg-gray-300 transition-colors"
                      >
                        🌐 Web
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action para nuevos proveedores */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl text-white p-8">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl font-bold mb-4">
              🚀 ¿Tienes un Nuevo Negocio Automotriz?
            </h3>
            <p className="text-lg text-blue-100 mb-6">
              Si aun no estas en nuestro catastro, <strong>registrate ahora</strong> para formar parte 
              de la mayor red de proveedores automotrices de la Av. 10 de Julio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/registro-pyme')}
                className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
              >
                📝 Registrar Mi Negocio
              </button>
              <button
                onClick={() => navigate('/login?tipo=cliente')}
                className="bg-blue-400 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-300 transition-colors shadow-lg"
              >
                🔑 Acceso Clientes
              </button>
              <button
                onClick={() => navigate('/contacto')}
                className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors border-2 border-blue-400"
              >
                💬 Hablar con Asesor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalProvidersPage;
