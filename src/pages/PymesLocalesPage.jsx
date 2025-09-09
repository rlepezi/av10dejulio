import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import HeaderMenu from '../components/HeaderMenu';
import ProviderBadges from '../components/ProviderBadges';
import ProviderReputation from '../components/ProviderReputation';

const PymesLocalesPage = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState('todos');

  // Sectores específicos de PyMEs y emprendimientos locales
  const sectoresPymes = [
    {
      id: 'vulcanizaciones',
      nombre: 'Vulcanizaciones',
      icono: '🏁',
      descripcion: 'Reparación de neumáticos, balanceo, alineación',
      servicios: ['Reparación de neumáticos', 'Balanceo', 'Alineación', 'Venta de neumáticos'],
      ejemplos: ['Vulcanización Express', 'Neumáticos 24/7', 'Centro de Llantas'],
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      id: 'mecanica',
      nombre: 'Talleres Mecánicos',
      icono: '🔧',
      descripcion: 'Talleres de reparación mecánica y mantención',
      servicios: ['Mantención preventiva', 'Reparaciones motor', 'Sistema eléctrico', 'Frenos'],
      ejemplos: ['Taller Don Juan', 'Mecánica Rápida', 'Auto Service'],
      color: 'bg-green-50 border-green-200 text-green-800'
    },
    {
      id: 'lavado',
      nombre: 'Lavado de Autos',
      icono: '🚿',
      descripcion: 'Lavado, encerado y detailing automotriz',
      servicios: ['Lavado completo', 'Encerado', 'Detailing', 'Limpieza interior'],
      ejemplos: ['Car Wash Express', 'Lavado Premium', 'Detailing Pro'],
      color: 'bg-cyan-50 border-cyan-200 text-cyan-800'
    },
    {
      id: 'electricidad',
      nombre: 'Electricidad Automotriz',
      icono: '⚡',
      descripcion: 'Especialistas en sistemas eléctricos',
      servicios: ['Diagnóstico computarizado', 'Aire acondicionado', 'Alarmas', 'Audio'],
      ejemplos: ['Electro Auto', 'Diagnóstico Express', 'Audio Car'],
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    },
    {
      id: 'pintura',
      nombre: 'Pintura y Carrocería',
      icono: '🎨',
      descripcion: 'Pintura automotriz y trabajos de carrocería',
      servicios: ['Pintura completa', 'Retoque', 'Pulido', 'Desabolladura'],
      ejemplos: ['Pintura Express', 'Carrocería Total', 'Retoque Pro'],
      color: 'bg-purple-50 border-purple-200 text-purple-800'
    },
    {
      id: 'lubricentros',
      nombre: 'Lubricentros',
      icono: '🛢️',
      descripción: 'Cambio de aceite y lubricación',
      servicios: ['Cambio de aceite', 'Filtros', 'Lubricación', 'Revisión básica'],
      ejemplos: ['Lubri Express', 'Quick Oil', 'Centro Lubricación'],
      color: 'bg-orange-50 border-orange-200 text-orange-800'
    },
    {
      id: 'accesorios',
      nombre: 'Accesorios',
      icono: '✨',
      descripcion: 'Instalación de accesorios y personalización',
      servicios: ['Insulfilm', 'Fundas', 'Cromados', 'Tuning básico'],
      ejemplos: ['Accesorios Pro', 'Tuning Express', 'Auto Style'],
      color: 'bg-pink-50 border-pink-200 text-pink-800'
    },
    {
      id: 'gruas',
      nombre: 'Grúas y Auxilio',
      icono: '🚛',
      descripción: 'Servicios de grúa y rescate vehicular',
      servicios: ['Grúa 24/7', 'Auxilio mecánico', 'Remolque', 'Rescate'],
      ejemplos: ['Grúa Express', 'Auxilio 24h', 'Rescate Rápido'],
      color: 'bg-red-50 border-red-200 text-red-800'
    }
  ];

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [providers, selectedSector]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'empresas'),
        where('estado', 'in', ['activa', 'validada']),
        orderBy('nombre')
      );
      
      const snapshot = await getDocs(q);
      const providersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filtrar solo PyMEs y emprendimientos
      const pymesData = providersData.filter(p => isPymeOrEmprendimiento(p));
      setProviders(pymesData);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPymeOrEmprendimiento = (provider) => {
    // Excluir empresas de revisión técnica de PyMEs
    if (provider.tipoServicio === 'revision_tecnica' || 
        provider.categorias?.includes('Revisión Técnica')) {
      return false;
    }
    
    // Si existe tipoEmpresa, usarlo como filtro principal
    if (provider.tipoEmpresa) {
      // Mostrar todo EXCEPTO proveedores
      return provider.tipoEmpresa !== 'proveedor';
    }
    
    // Fallback: Criterios legacy para considerar PyME o emprendimiento
    const fechaRegistro = provider.fechaRegistro || provider.fechaCreacion;
    const esNuevo = fechaRegistro && 
      (new Date() - (fechaRegistro.toDate ? fechaRegistro.toDate() : new Date(fechaRegistro))) < (3 * 365 * 24 * 60 * 60 * 1000);
    
    return provider.esPyme || 
           provider.esEmprendimiento || 
           esNuevo || 
           (provider.numeroProductos && provider.numeroProductos < 100) ||
           (provider.empleados && provider.empleados < 20) ||
           sectoresPymes.some(sector => 
             provider.categorias?.some(cat => 
               sector.servicios.some(serv => 
                 cat.toLowerCase().includes(serv.toLowerCase()) ||
                 serv.toLowerCase().includes(cat.toLowerCase())
               )
             ) ||
             provider.nombre.toLowerCase().includes(sector.nombre.toLowerCase())
           );
  };

  const applyFilters = () => {
    let filtered = [...providers];

    if (selectedSector !== 'todos') {
      const sector = sectoresPymes.find(s => s.id === selectedSector);
      if (sector) {
        filtered = filtered.filter(p => {
          const searchTerms = [sector.nombre, ...sector.servicios, sector.descripcion.toLowerCase()];
          return searchTerms.some(term => 
            p.categorias?.some(cat => cat.toLowerCase().includes(term.toLowerCase())) ||
            p.servicios?.some(serv => serv.toLowerCase().includes(term.toLowerCase())) ||
            p.descripcion?.toLowerCase().includes(term.toLowerCase()) ||
            p.nombre.toLowerCase().includes(term.toLowerCase())
          );
        });
      }
    }

    setFilteredProviders(filtered);
  };

  const formatDate = (fecha) => {
    if (!fecha) return '';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString();
  };

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
      {/* Barra de navegación global */}
      <HeaderMenu />
      
      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section - Enfoque en PyMEs y Emprendimientos */}
        <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 rounded-2xl text-white p-8 mb-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <span className="bg-yellow-400 text-blue-900 px-4 py-2 rounded-full text-sm font-bold">
                ¡PARA PyMEs y EMPRENDEDORES!
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                PyMEs Locales
              </span>
              <br />
              <span className="text-2xl lg:text-3xl">Sector Automotriz</span>
            </h1>
            <p className="text-xl text-green-100 mb-8">
              Descubre talleres, vulcanizaciones y servicios especializados en tu zona
            </p>
            
            {/* Botones de llamada a la acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/registro-proveedor')}
                className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 px-8 py-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                📝 Registrar mi PyME
              </button>
              <button
                onClick={() => {
                  const providersSection = document.getElementById('sectores-pymes');
                  providersSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3 rounded-lg font-semibold text-lg transition-all"
              >
                🔍 Explorar PyMEs
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
        {/* Sección informativa */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🚀 Impulsa tu negocio automotriz
            </h2>
            <p className="text-gray-600 mb-6">
              Conectamos PyMEs locales con clientes que necesitan servicios automotrices de calidad. 
              Si tienes un taller, vulcanización o servicio especializado, este es tu espacio.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl mb-2">🏪</div>
                <h3 className="font-semibold text-gray-800">PyMEs Locales</h3>
                <p className="text-gray-600 text-sm">Descubre negocios de barrio</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🔧</div>
                <h3 className="font-semibold text-gray-800">Servicios Especializados</h3>
                <p className="text-gray-600 text-sm">Talleres, vulcanizaciones y más</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🤝</div>
                <h3 className="font-semibold text-gray-800">Apoyo al Emprendimiento</h3>
                <p className="text-gray-600 text-sm">Impulsamos la economía local</p>
              </div>
            </div>
          </div>
        </div>

        {/* Beneficios Especiales para PyMEs */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">
              🎁 Programa Especial para PyMEs y Emprendimientos
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Ayuda para Crear Tu Página Web</h4>
                    <p className="text-gray-600">Te ayudamos a crear tu presencia digital sin costo adicional. Perfil completo con fotos y servicios.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">1 Campaña Semanal Gratis</h4>
                    <p className="text-gray-600">Promociona tus servicios con una campaña publicitaria semanal gratuita para destacar entre la competencia.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Ingreso de Productos Sin Límite</h4>
                    <p className="text-gray-600">Agrega todos tus productos y servicios con fotos, precios y descripciones detalladas.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Asesoría Digital Personalizada</h4>
                    <p className="text-gray-600">Sesiones gratuitas para ayudarte a maximizar tu presencia online y atraer más clientes.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    ⭐
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Acceso Directo a Clientes Locales</h4>
                    <p className="text-gray-600">Conecta con vecinos y clientes de tu sector que buscan servicios confiables y cercanos.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    ⭐
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Herramientas de Gestión Simples</h4>
                    <p className="text-gray-600">Dashboard fácil de usar para gestionar citas, clientes y ventas desde tu celular.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    ⭐
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Red de Colaboración Local</h4>
                    <p className="text-gray-600">Conecta con otros emprendedores de tu sector para colaborar y referir clientes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    ⭐
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Soporte Técnico en Español</h4>
                    <p className="text-gray-600">Equipo de soporte local que entiende las necesidades de los emprendedores chilenos.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/registro-proveedor')}
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  🚀 Comenzar Mi Transformación Digital
                </button>
                <button
                  onClick={() => navigate('/login?tipo=empresa')}
                  className="bg-white text-green-600 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-green-50 transition-all border-2 border-green-600 shadow-lg"
                >
                  🏢 Ya Tengo Cuenta - Ingresar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sectores de PyMEs */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8" id="sectores-pymes">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🔍 Explora PyMEs por Sector
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <button
              onClick={() => setSelectedSector('todos')}
              className={`p-3 rounded-lg border-2 text-center transition-colors ${
                selectedSector === 'todos'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <div className="text-lg mb-1">🏪</div>
              <div className="text-xs font-medium">Todos</div>
            </button>
            {sectoresPymes.map((sector) => (
              <button
                key={sector.id}
                onClick={() => setSelectedSector(sector.id)}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  selectedSector === sector.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                }`}
                title={sector.descripcion}
              >
                <div className="text-lg mb-1">{sector.icono}</div>
                <div className="text-xs font-medium">{sector.nombre}</div>
              </button>
            ))}
          </div>
          
          {/* Descripción del sector seleccionado */}
          {selectedSector !== 'todos' && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              {(() => {
                const sector = sectoresPymes.find(s => s.id === selectedSector);
                return sector ? (
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <span>{sector.icono}</span>
                      {sector.nombre}
                    </h4>
                    <p className="text-blue-800 mb-3">{sector.descripcion}</p>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-blue-700">Servicios típicos:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {sector.servicios.map((servicio, index) => (
                            <span
                              key={index}
                              className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm"
                            >
                              {servicio}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-blue-700">Ejemplos:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {sector.ejemplos.map((ejemplo, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                            >
                              {ejemplo}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* Estadísticas de PyMEs */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">
            📊 Nuestra Comunidad de PyMEs
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{filteredProviders.length}</div>
              <div className="text-sm text-gray-600">PyMEs Activas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {filteredProviders.filter(p => p.esEmprendimiento || (p.fechaRegistro && 
                  (new Date() - (p.fechaRegistro.toDate ? p.fechaRegistro.toDate() : new Date(p.fechaRegistro))) < (6 * 30 * 24 * 60 * 60 * 1000)
                )).length}
              </div>
              <div className="text-sm text-gray-600">🚀 Emprendimientos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">8</div>
              <div className="text-sm text-gray-600">🏭 Sectores Cubiertos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">95%</div>
              <div className="text-sm text-gray-600">😊 Satisfacción</div>
            </div>
          </div>
        </div>

        {/* Lista de PyMEs */}
        <div className="mb-6 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {selectedSector === 'todos' 
              ? `${filteredProviders.length} PyMEs y Emprendimientos Disponibles`
              : `${filteredProviders.length} ${sectoresPymes.find(s => s.id === selectedSector)?.nombre || 'Proveedores'} Disponibles`
            }
          </h3>
          <p className="text-gray-600">
            Conecta directamente con emprendedores locales que entienden tus necesidades
          </p>
        </div>

        {filteredProviders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              No se encontraron PyMEs en este sector
            </div>
            <button
              onClick={() => setSelectedSector('todos')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Ver todas las PyMEs
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
                      <div className="text-xs text-gray-500 mb-1">Servicios:</div>
                      <div className="flex flex-wrap gap-1">
                        {provider.categorias.slice(0, 3).map((categoria, index) => (
                          <span
                            key={index}
                            className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded"
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
                      className="flex-1 bg-green-600 text-white text-sm py-2 px-3 rounded hover:bg-green-700 transition-colors"
                    >
                      Ver PyME
                    </button>
                    {provider.telefono && (
                      <button
                        onClick={() => window.open(`https://wa.me/56${provider.telefono.replace(/[^\d]/g, '')}`, '_blank')}
                        className="bg-green-500 text-white text-sm py-2 px-3 rounded hover:bg-green-600 transition-colors"
                      >
                        📱 WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action Final para PyMEs */}
        <div className="mt-12 space-y-8">
          {/* Para Emprendedores que quieren unirse */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-3xl font-bold mb-4">
                🚀 ¿Tienes una PyME o Emprendimiento Automotriz?
              </h3>
              <p className="text-lg text-green-100 mb-6">
                <strong>¡Te ayudamos a digitalizarte!</strong> Crearemos tu página web, te daremos una campaña semanal gratis 
                y podrás agregar todos tus productos sin costo. Solo necesitas ganas de crecer.
              </p>
              <div className="bg-white/10 rounded-lg p-4 mb-6">
                <h4 className="font-semibold mb-2">🎁 Incluye:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>✅ Página web gratuita</div>
                  <div>✅ 1 campaña semanal</div>
                  <div>✅ Productos ilimitados</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/registro-proveedor')}
                  className="bg-yellow-400 text-blue-900 px-10 py-4 rounded-xl font-bold text-lg hover:bg-yellow-500 transition-colors shadow-xl transform hover:scale-105"
                >
                  🌟 Registrar Mi PyME Gratis
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
          
          {/* Para personas que buscan servicios */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-3xl font-bold mb-4">
                🏠 ¿Buscas Servicios Automotrices Locales?
              </h3>
              <p className="text-lg text-blue-100 mb-6">
                Encuentra emprendedores de tu barrio que ofrecen servicios personalizados, 
                precios justos y la cercanía que necesitas para el cuidado de tu vehículo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/registro-cliente')}
                  className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
                >
                  👤 Registrar Mi Vehículo
                </button>
                <button
                  onClick={() => navigate('/login?tipo=cliente')}
                  className="bg-blue-400 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-300 transition-colors shadow-lg"
                >
                  🔑 Acceso Clientes
                </button>
                <button
                  onClick={() => {
                    const providersSection = document.getElementById('sectores-pymes');
                    providersSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors border-2 border-blue-400"
                >
                  🔍 Explorar PyMEs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PymesLocalesPage;
