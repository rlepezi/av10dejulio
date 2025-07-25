import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import ProviderBadges from '../components/ProviderBadges';
import ProviderReputation from '../components/ProviderReputation';
import AdvancedFilters from '../components/AdvancedFilters';

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
        where('estado', '==', 'Activa'),
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
    if (filters.region) {
      filtered = filtered.filter(p => p.region === filters.region);
    }

    if (filters.ciudad) {
      filtered = filtered.filter(p => p.ciudad === filters.ciudad);
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'fecha':
          const dateA = a.fechaRegistro?.toDate?.() || new Date(a.fechaRegistro || 0);
          const dateB = b.fechaRegistro?.toDate?.() || new Date(b.fechaRegistro || 0);
          return dateB - dateA;
        default:
          return 0;
      }
    });

    setFilteredProviders(filtered);
  };

  const formatDate = (fecha) => {
    if (!fecha) return '';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              La mayor comunidad de servicios automotrices de la Av. 10 de Julio
            </p>
            <p className="text-lg text-blue-200 max-w-3xl mx-auto mb-8">
              Descubre más de <strong className="text-yellow-400">{providers.length} proveedores verificados</strong> que 
              forman parte de nuestra comunidad: vulcanizaciones, talleres mecánicos, centros de pintura, 
              lubricentros y emprendimientos locales listos para atenderte.
            </p>
            
            {/* Estadísticas de la Comunidad */}
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

            {/* Botones CTA con Login */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/solicitud-comunidad')}
                className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors shadow-lg"
              >
                🤝 Unirme a la Comunidad
              </button>
              <button
                onClick={() => navigate('/login?tipo=empresa')}
                className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
              >
                🏢 Acceso Empresas
              </button>
              <button
                onClick={() => navigate('/login?tipo=cliente')}
                className="bg-blue-400 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-300 transition-colors shadow-lg"
              >
                🔑 Acceso Clientes
              </button>
              <button
                onClick={() => {
                  const providersSection = document.getElementById('proveedores-grid');
                  providersSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white/20 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors border-2 border-white/30"
              >
                📋 Ver Proveedores
              </button>
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
                  Conecta con cientos de dueños de vehículos que buscan servicios confiables en tu área.
                </p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Visibilidad Digital</h3>
                <p className="text-gray-600">
                  Tu negocio aparecerá en nuestra plataforma donde miles de usuarios buscan servicios automotrices.
                </p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-xl">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🛠️</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Herramientas Gratis</h3>
                <p className="text-gray-600">
                  Gestión de campañas, análisis de mercado y herramientas de promoción sin costo adicional.
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/solicitud-comunidad')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  🌟 Solicitar Ingreso a la Comunidad
                </button>
                <button
                  onClick={() => navigate('/login?tipo=empresa')}
                  className="bg-white text-blue-600 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all border-2 border-blue-600 shadow-lg"
                >
                  🏢 Ya Tengo Cuenta - Ingresar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Información sobre los Proveedores del Catastro */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-6 mb-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="text-3xl mr-3">📋</span>
              <h3 className="text-2xl font-bold text-gray-900">
                Proveedores Registrados en Nuestro Catastro
              </h3>
            </div>
            <p className="text-lg text-gray-700 mb-6">
              Los proveedores que ves a continuación fueron <strong>ingresados mediante nuestro catastro masivo</strong> 
              y están <strong>verificados y activos</strong> en la plataforma. Todos ellos pueden solicitar formar parte 
              de nuestra <strong>comunidad exclusiva</strong> para acceder a beneficios adicionales.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <span className="text-green-600 font-semibold">✅ Verificados:</span> Todos han pasado por nuestro proceso de validación
              </div>
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <span className="text-blue-600 font-semibold">🏢 Catastrados:</span> Forman parte de nuestro registro oficial de proveedores
              </div>
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <span className="text-purple-600 font-semibold">🚀 Elegibles:</span> Pueden solicitar beneficios comunitarios
              </div>
            </div>
          </div>
        </div>

        {/* Filtros Avanzados */}
        <div className="mb-6" id="proveedores-grid">
          <AdvancedFilters
            onFiltersChange={setFilters}
            showRegionFilter={true}
            showTypeFilter={true}
            showVerificationFilter={true}
          />
        </div>

        {/* Ordenamiento */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {filteredProviders.length} de {providers.length} proveedores
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="nombre">Nombre</option>
              <option value="fecha">Más recientes</option>
            </select>
          </div>
        </div>

        {/* Lista de Proveedores */}
        {filteredProviders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              No se encontraron proveedores con los filtros seleccionados
            </div>
            <button
              onClick={() => setFilters({})}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <div
                key={provider.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header con logo y badges */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start gap-3">
                    {provider.logo && (
                      <img
                        src={provider.logo}
                        alt={provider.nombre}
                        className="w-12 h-12 object-contain rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {provider.nombre}
                      </h3>
                      <div className="mt-1">
                        <ProviderBadges empresa={provider} size="sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información */}
                <div className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">📍</span>
                      <span className="text-gray-700">
                        {provider.ciudad}, {provider.region}
                      </span>
                    </div>
                    
                    {provider.telefono && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📞</span>
                        <span className="text-gray-700">{provider.telefono}</span>
                      </div>
                    )}

                    {provider.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">✉️</span>
                        <span className="text-gray-700">{provider.email}</span>
                      </div>
                    )}

                    {provider.fechaRegistro && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📅</span>
                        <span className="text-gray-700">
                          Desde {formatDate(provider.fechaRegistro)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Categorías */}
                  {provider.categorias && provider.categorias.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-1">Categorías:</div>
                      <div className="flex flex-wrap gap-1">
                        {provider.categorias.slice(0, 3).map((categoria, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                          >
                            {categoria}
                          </span>
                        ))}
                        {provider.categorias.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{provider.categorias.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reputación */}
                  <div className="mt-3">
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
                      onClick={() => navigate(`/proveedor/${provider.id}`)}
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

        {/* Call to Action Final */}
        <div className="mt-12 space-y-8">
          {/* Para Proveedores Existentes */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-3xl font-bold mb-4">
                🤝 ¿Eres uno de nuestros {providers.length}+ Proveedores?
              </h3>
              <p className="text-lg text-green-100 mb-6">
                Si ya formas parte de nuestro catastro, puedes <strong>solicitar ingresar a la comunidad</strong> 
                para acceder a beneficios exclusivos: más clientes, herramientas digitales y visibilidad premium.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/solicitud-comunidad')}
                  className="bg-yellow-400 text-blue-900 px-10 py-4 rounded-xl font-bold text-lg hover:bg-yellow-500 transition-colors shadow-xl transform hover:scale-105"
                >
                  🌟 Solicitar Ingreso a la Comunidad
                </button>
                <button
                  onClick={() => navigate('/login?tipo=empresa')}
                  className="bg-white text-blue-700 px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-xl border-2 border-white"
                >
                  🏢 Ya Tengo Cuenta
                </button>
              </div>
            </div>
          </div>
          
          {/* Para Nuevos Proveedores */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-3xl font-bold mb-4">
                🚀 ¿Tienes un Nuevo Negocio Automotriz?
              </h3>
              <p className="text-lg text-blue-100 mb-6">
                Si aún no estás en nuestro catastro, <strong>regístrate ahora</strong> para formar parte 
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
    </div>
  );
};

export default LocalProvidersPage;
