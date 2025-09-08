import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import HeaderMenu from '../components/HeaderMenu';
import ProviderBadges from '../components/ProviderBadges';
import ProviderReputation from '../components/ProviderReputation';

const ProveedoresPage = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState('todos');

  // Sectores específicos de proveedores (empresas grandes)
  const sectoresProveedores = [
    {
      id: 'concesionarios',
      nombre: 'Concesionarios',
      icono: '🏢',
      descripcion: 'Concesionarios oficiales de marcas automotrices',
      servicios: ['Venta de vehículos nuevos', 'Venta de vehículos usados', 'Servicio técnico oficial', 'Repuestos originales'],
      ejemplos: ['Toyota Chile', 'Honda Chile', 'Nissan Chile', 'Hyundai Chile'],
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      id: 'talleres_especializados',
      nombre: 'Talleres Especializados',
      icono: '🔧',
      descripcion: 'Talleres de alta especialización técnica',
      servicios: ['Diagnóstico computarizado', 'Reparaciones complejas', 'Mantención premium', 'Garantía extendida'],
      ejemplos: ['AutoService Premium', 'Taller Especializado', 'Centro Técnico Avanzado'],
      color: 'bg-green-50 border-green-200 text-green-800'
    },
    {
      id: 'neumaticos',
      nombre: 'Neumáticos',
      icono: '🛞',
      descripcion: 'Distribuidores y especialistas en neumáticos',
      servicios: ['Venta de neumáticos', 'Instalación profesional', 'Balanceo y alineación', 'Garantía de neumáticos'],
      ejemplos: ['Neumáticos Pro', 'Tire Center', 'Distribuidora de Neumáticos'],
      color: 'bg-red-50 border-red-200 text-red-800'
    },
    {
      id: 'repuestos',
      nombre: 'Repuestos',
      icono: '⚙️',
      descripcion: 'Distribuidores de repuestos automotrices',
      servicios: ['Repuestos originales', 'Repuestos alternativos', 'Filtros y lubricantes', 'Accesorios'],
      ejemplos: ['Repuestos Chile', 'Auto Parts Pro', 'Distribuidora de Repuestos'],
      color: 'bg-purple-50 border-purple-200 text-purple-800'
    },
    {
      id: 'seguros',
      nombre: 'Seguros',
      icono: '🛡️',
      descripcion: 'Compañías de seguros automotrices',
      servicios: ['Seguro automotriz', 'Seguro de responsabilidad civil', 'Cobertura completa', 'Asistencia en carretera'],
      ejemplos: ['Seguros Chile', 'Mapfre', 'HDI Seguros', 'Bci Seguros'],
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    },
    {
      id: 'financiamiento',
      nombre: 'Financiamiento',
      icono: '💰',
      descripcion: 'Instituciones financieras para vehículos',
      servicios: ['Créditos automotrices', 'Leasing', 'Arrendamiento', 'Financiamiento directo'],
      ejemplos: ['Banco de Chile', 'Santander', 'Scotiabank', 'Financiera Automotriz'],
      color: 'bg-cyan-50 border-cyan-200 text-cyan-800'
    },
    {
      id: 'tecnologia',
      nombre: 'Tecnología',
      icono: '💻',
      descripcion: 'Tecnología y sistemas automotrices',
      servicios: ['Sistemas de navegación', 'Alarmas y seguridad', 'Audio y multimedia', 'Diagnóstico avanzado'],
      ejemplos: ['Tech Auto', 'Sistemas Automotrices', 'Audio Car Pro'],
      color: 'bg-indigo-50 border-indigo-200 text-indigo-800'
    },
    {
      id: 'servicios_especializados',
      nombre: 'Servicios Especializados',
      icono: '⭐',
      descripcion: 'Servicios especializados de alto nivel',
      servicios: ['Tuning profesional', 'Modificaciones', 'Servicios premium', 'Consultoría técnica'],
      ejemplos: ['Tuning Pro', 'Modificaciones Premium', 'Servicios Especializados'],
      color: 'bg-pink-50 border-pink-200 text-pink-800'
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

      // Filtrar solo proveedores (empresas grandes)
      const proveedoresData = providersData.filter(p => isProveedor(p));
      setProviders(proveedoresData);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const isProveedor = (provider) => {
    // Si existe tipoEmpresa, usarlo como filtro principal
    if (provider.tipoEmpresa) {
      return provider.tipoEmpresa === 'proveedor';
    }
    
    // Fallback: Criterios para considerar proveedor (empresa grande)
    const fechaRegistro = provider.fechaRegistro || provider.fechaCreacion;
    const esEstablecido = fechaRegistro && 
      (new Date() - (fechaRegistro.toDate ? fechaRegistro.toDate() : new Date(fechaRegistro))) > (3 * 365 * 24 * 60 * 60 * 1000);
    
    return provider.esProveedor || 
           esEstablecido || 
           (provider.numeroProductos && provider.numeroProductos >= 100) ||
           (provider.empleados && provider.empleados >= 20) ||
           sectoresProveedores.some(sector => 
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
      const sector = sectoresProveedores.find(s => s.id === selectedSector);
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
        {/* Hero Section - Enfoque en Proveedores */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl text-white p-8 mb-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <span className="bg-white text-blue-900 px-4 py-2 rounded-full text-sm font-bold">
                PROVEEDORES AUTOMOTRICES
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Proveedores
              </span>
              <br />
              <span className="text-2xl lg:text-3xl">Sector Automotriz</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Conecta con proveedores especializados, concesionarios y empresas del sector automotriz
            </p>
            
            {/* Botones de llamada a la acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/registro-proveedor')}
                className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 px-8 py-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                📝 Registrar Mi Empresa
              </button>
              <button
                onClick={() => {
                  const providersSection = document.getElementById('sectores-proveedores');
                  providersSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3 rounded-lg font-semibold text-lg transition-all"
              >
                🔍 Explorar Proveedores
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
              🏢 Proveedores Especializados
            </h2>
            <p className="text-gray-600 mb-6">
              Conectamos empresas del sector automotriz con clientes que buscan servicios especializados, 
              repuestos originales y soluciones profesionales.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl mb-2">🏢</div>
                <h3 className="font-semibold text-gray-800">Empresas Establecidas</h3>
                <p className="text-gray-600 text-sm">Concesionarios y distribuidores</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">⚙️</div>
                <h3 className="font-semibold text-gray-800">Servicios Especializados</h3>
                <p className="text-gray-600 text-sm">Tecnología y repuestos</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🤝</div>
                <h3 className="font-semibold text-gray-800">Red Profesional</h3>
                <p className="text-gray-600 text-sm">Conexiones B2B</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sectores de Proveedores */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8" id="sectores-proveedores">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🔍 Explora Proveedores por Sector
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
              <div className="text-lg mb-1">🏢</div>
              <div className="text-xs font-medium">Todos</div>
            </button>
            {sectoresProveedores.map((sector) => (
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
                const sector = sectoresProveedores.find(s => s.id === selectedSector);
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

        {/* Estadísticas de Proveedores */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">
            📊 Nuestra Red de Proveedores
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{filteredProviders.length}</div>
              <div className="text-sm text-gray-600">Proveedores Activos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                {filteredProviders.filter(p => p.esProveedor || (p.empleados && p.empleados >= 50)).length}
              </div>
              <div className="text-sm text-gray-600">🏢 Empresas Grandes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">8</div>
              <div className="text-sm text-gray-600">🏭 Sectores Cubiertos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">98%</div>
              <div className="text-sm text-gray-600">😊 Satisfacción</div>
            </div>
          </div>
        </div>

        {/* Lista de Proveedores */}
        <div className="mb-6 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {selectedSector === 'todos' 
              ? `${filteredProviders.length} Proveedores Disponibles`
              : `${filteredProviders.length} ${sectoresProveedores.find(s => s.id === selectedSector)?.nombre || 'Proveedores'} Disponibles`
            }
          </h3>
          <p className="text-gray-600">
            Conecta con proveedores especializados y empresas del sector automotriz
          </p>
        </div>

        {filteredProviders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              No se encontraron proveedores en este sector
            </div>
            <button
              onClick={() => setSelectedSector('todos')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Ver todos los proveedores
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
                            className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
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
                      Ver Proveedor
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

        {/* Call to Action Final para Proveedores */}
        <div className="mt-12 space-y-8">
          {/* Para Empresas que quieren unirse */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-3xl font-bold mb-4">
                🏢 ¿Eres una Empresa del Sector Automotriz?
              </h3>
              <p className="text-lg text-blue-100 mb-6">
                <strong>¡Únete a nuestra red de proveedores!</strong> Conecta con clientes profesionales, 
                amplía tu alcance y forma parte de la red más importante del sector automotriz en Chile.
              </p>
              <div className="bg-white/10 rounded-lg p-4 mb-6">
                <h4 className="font-semibold mb-2">🎁 Beneficios:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>✅ Red profesional B2B</div>
                  <div>✅ Herramientas de gestión</div>
                  <div>✅ Soporte especializado</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/registro-proveedor')}
                  className="bg-yellow-400 text-blue-900 px-10 py-4 rounded-xl font-bold text-lg hover:bg-yellow-500 transition-colors shadow-xl transform hover:scale-105"
                >
                  🌟 Registrar Mi Empresa
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
          
          {/* Para personas que buscan servicios profesionales */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-3xl font-bold mb-4">
                🔍 ¿Buscas Servicios Profesionales?
              </h3>
              <p className="text-lg text-indigo-100 mb-6">
                Encuentra proveedores especializados, concesionarios oficiales y empresas 
                del sector automotriz con servicios de alta calidad y garantía.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/registro-cliente')}
                  className="bg-white text-indigo-700 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
                >
                  👤 Registrar Mi Vehículo
                </button>
                <button
                  onClick={() => navigate('/login?tipo=cliente')}
                  className="bg-indigo-400 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-300 transition-colors shadow-lg"
                >
                  🔑 Acceso Clientes
                </button>
                <button
                  onClick={() => {
                    const providersSection = document.getElementById('sectores-proveedores');
                    providersSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-400 transition-colors border-2 border-indigo-400"
                >
                  🔍 Explorar Proveedores
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProveedoresPage;

