import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import SearchBarUnificado from '../components/SearchBarUnificado';
import AdBanner from '../components/AdBanner';
import { testEmpresasConnection } from '../utils/testEmpresas';
import { ESTADOS_EMPRESA } from '../utils/empresaStandards';
import { useImageUrl } from '../hooks/useImageUrl';

// Componente para mostrar logo con manejo de URLs de Firebase Storage
function LogoImage({ logo, nombre, className = "max-h-24 max-w-24 object-contain" }) {
  const { imageUrl, loading, error } = useImageUrl(logo);

  if (!logo) {
    return (
      <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
        <span className="text-2xl font-bold text-white">
          {nombre ? nombre.charAt(0).toUpperCase() : '?'}
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
        <span className="text-lg font-bold text-white">!</span>
      </div>
    );
  }

  return (
    <img 
      className={className} 
      src={imageUrl} 
      alt={nombre}
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
      }}
    />
  );
}

const HomePage = () => {
  const navigate = useNavigate();
  const [empresasActivas, setEmpresasActivas] = useState([]);
  const [empresasFiltradas, setEmpresasFiltradas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [filtroTipoEmpresa, setFiltroTipoEmpresa] = useState('');

  // Cargar empresas activas con real-time updates
  useEffect(() => {
    const cargarEmpresasActivas = async () => {
      try {
        setLoadingEmpresas(true);
        console.log('🔍 Configurando listener real-time para empresas activas...');
        
        // Ejecutar test de debug primero
        const testResult = await testEmpresasConnection();
        console.log('🧪 Resultado del test:', testResult);
        
        // Configurar listener real-time para empresas activas
        const q = query(
          collection(db, 'empresas'),
          where('estado', 'in', [ESTADOS_EMPRESA.ACTIVA, ESTADOS_EMPRESA.VALIDADA]),
          orderBy('fecha_creacion', 'desc'),
          limit(20)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          console.log('📊 Empresas activas actualizadas en tiempo real:', snapshot.size);
          
          const empresasEncontradas = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Ordenar por fecha de creación (más recientes primero)
          empresasEncontradas.sort((a, b) => {
            const fechaA = a.fecha_creacion?.toDate?.() || a.fecha_creacion || new Date(0);
            const fechaB = b.fecha_creacion?.toDate?.() || b.fecha_creacion || new Date(0);
            return fechaB - fechaA;
          });
          
          console.log('✅ Empresas activas cargadas:', empresasEncontradas.length);
          setEmpresasActivas(empresasEncontradas);
          setLoadingEmpresas(false);
        }, (error) => {
          console.error('❌ Error en listener real-time:', error);
          setLoadingEmpresas(false);
        });
        
        // Cleanup function
        return unsubscribe;
        
      } catch (error) {
        console.error('❌ Error configurando listener:', error);
        setLoadingEmpresas(false);
      }
    };

    const unsubscribe = cargarEmpresasActivas();
    
    // Cleanup on unmount
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...empresasActivas];
    
    // Excluir empresas de revisión técnica del Home
    filtered = filtered.filter(empresa => 
      empresa.tipoServicio !== 'revision_tecnica' && 
      !empresa.categorias?.includes('Revisión Técnica')
    );
    
    if (filtroTipoEmpresa) {
      filtered = filtered.filter(empresa => (empresa.tipoEmpresa || '').toLowerCase() === filtroTipoEmpresa.toLowerCase());
    }
    
    console.log('🔍 Empresas después del filtro:', filtered.length);
    console.log('📋 Filtro actual:', filtroTipoEmpresa || 'Sin filtro');
    console.log('🚫 Empresas de revisión técnica excluidas del Home');
    
    setEmpresasFiltradas(filtered);
  }, [empresasActivas, filtroTipoEmpresa]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section Principal */}
      <HeroSection />
      
      {/* Barra de búsqueda unificada */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SearchBarUnificado />
        </div>
      </div>
      
      {/* Sección de servicios principales */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Servicios Automotrices
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Encuentra todo lo que necesitas para tu vehículo en un solo lugar
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Seguros */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Seguros</h3>
            <p className="text-gray-600 mb-4">Protege tu vehículo con los mejores seguros</p>
            <a 
              href="/servicios/seguros" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver más →
            </a>
          </div>
          
          {/* Revisión Técnica */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <span className="text-2xl">🔧</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Revisión Técnica</h3>
            <p className="text-gray-600 mb-4">Agenda tu revisión técnica fácil y rápido</p>
            <a 
              href="/servicios/revision-tecnica" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver más →
            </a>
          </div>
          
          {/* Vulcanizaciones */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
              <span className="text-2xl">🏁</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Vulcanizaciones</h3>
            <p className="text-gray-600 mb-4">Servicio de neumáticos y reparaciones</p>
            <a 
              href="/servicios/vulcanizaciones" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver más →
            </a>
          </div>
          
          {/* Reciclaje */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <span className="text-2xl">♻️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reciclaje</h3>
            <p className="text-gray-600 mb-4">Programa de reciclaje automotriz</p>
            <a 
              href="/servicios/reciclaje" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver más →
            </a>
          </div>
        </div>
      </div>
      
      {/* Sección Especial de Reciclaje */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ♻️ Reciclaje Automotriz en AV10 de Julio
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Construyendo una comunidad automotriz sostenible. Conectamos clientes con proveedores de reciclaje 
              para un futuro más verde y responsable.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🌱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Impacto Ambiental</h3>
              <p className="text-gray-600">
                Reducimos la contaminación y promovemos la economía circular en la industria automotriz
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Comunidad Integrada</h3>
              <p className="text-gray-600">
                Clientes y proveedores trabajando juntos por un futuro más sostenible
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Educación</h3>
              <p className="text-gray-600">
                Aprendemos juntos las mejores prácticas de reciclaje automotriz
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <button
              onClick={() => navigate('/servicios/reciclaje')}
              className="bg-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors mr-4"
            >
              ♻️ Conocer Más Sobre Reciclaje
            </button>
            <button
              onClick={() => navigate('/registro-empresa')}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors"
            >
              🏭 Registrarme como Empresa de Reciclaje
            </button>
          </div>
        </div>
      </div>

      {/* Banner publicitario */}
      <div className="bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdBanner />
        </div>
      </div>

      {/* Sección de Empresas Activas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Empresas Verificadas
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre las empresas automotrices activas y verificadas en nuestra plataforma. Haz clic en cualquier empresa para ver su perfil completo en una nueva pestaña.
          </p>
          {/* Debug info - temporal */}
          <div className="mt-4 text-sm text-gray-500">
            Total empresas: {empresasActivas.length} | Filtradas: {empresasFiltradas.length}
          </div>
        </div>

        {/* Filtro por tipo de empresa */}
        <div className="flex justify-center mb-8">
          <div className="max-w-xs">
            <select
              value={filtroTipoEmpresa}
              onChange={(e) => setFiltroTipoEmpresa(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los tipos</option>
              <option value="proveedor">🔧 Proveedores</option>
              <option value="pyme">⭐ PyMEs</option>
              <option value="empresa">🏢 Empresas</option>
              <option value="emprendimiento">🚀 Emprendimientos</option>
              <option value="local">📍 Locales</option>
              <option value="premium">💎 Premium</option>
            </select>
          </div>
        </div>

        {loadingEmpresas ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : empresasFiltradas.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {empresasFiltradas.map((empresa) => (
                <div 
                  key={empresa.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => window.open(`/empresa/${empresa.id}`, '_blank')}
                >
                  {/* Logo de la empresa */}
                  <div className="h-32 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <LogoImage 
                      logo={empresa.logo_url || empresa.logo} 
                      nombre={empresa.nombre}
                      className="max-h-24 max-w-24 object-contain"
                    />
                  </div>
                  
                  {/* Información de la empresa */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {empresa.nombre || 'Sin nombre'}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={
                          `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ` +
                          ((empresa.tipoEmpresa || '').toLowerCase() === 'proveedor'
                            ? 'bg-blue-100 text-blue-800'
                            : (empresa.tipoEmpresa || '').toLowerCase() === 'pyme'
                            ? 'bg-yellow-100 text-yellow-800'
                            : (empresa.tipoEmpresa || '').toLowerCase() === 'empresa'
                            ? 'bg-green-100 text-green-800'
                            : (empresa.tipoEmpresa || '').toLowerCase() === 'emprendimiento'
                            ? 'bg-purple-100 text-purple-800'
                            : (empresa.tipoEmpresa || '').toLowerCase() === 'local'
                            ? 'bg-pink-100 text-pink-800'
                            : (empresa.tipoEmpresa || '').toLowerCase() === 'premium'
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-100 text-gray-800')
                        }>
                          {empresa.tipoEmpresa
                            ? `🏷️ ${empresa.tipoEmpresa.charAt(0).toUpperCase() + empresa.tipoEmpresa.slice(1)}`
                            : '🏷️ Sin tipo'}
                        </span>
                        <span className="text-xs text-gray-500" title="Abrir en nueva pestaña">
                          ↗️
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {empresa.descripcion || 'Empresa de servicios automotrices'}
                    </p>
                    
                    {/* Ubicación */}
                    {empresa.ciudad && (
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <span className="mr-1">📍</span>
                        <span>{empresa.ciudad}, {empresa.region}</span>
                      </div>
                    )}
                    
                    {/* Servicios */}
                    {empresa.servicios && empresa.servicios.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-xs text-gray-500 font-medium mb-1 block w-full">Servicios:</span>
                        {empresa.servicios.slice(0, 2).map((servicio, index) => (
                          <span 
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {servicio}
                          </span>
                        ))}
                        {empresa.servicios.length > 2 && (
                          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            +{empresa.servicios.length - 2} más
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Marcas */}
                    {empresa.marcas && empresa.marcas.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-gray-500 font-medium mb-1 block w-full">Marcas:</span>
                        {empresa.marcas.slice(0, 2).map((marca, index) => (
                          <span 
                            key={index}
                            className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                          >
                            {marca}
                          </span>
                        ))}
                        {empresa.marcas.length > 2 && (
                          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            +{empresa.marcas.length - 2} más
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Botón para ver más empresas */}
            <div className="text-center">
              <button
                onClick={() => navigate('/proveedores')}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Ver Todas las Empresas
                <span className="ml-2">→</span>
              </button>
            </div>
          </>
        ) : empresasActivas.length > 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay empresas del tipo seleccionado
            </h3>
            <p className="text-gray-600 mb-6">
              Intenta cambiar el filtro o selecciona "Todos los tipos"
            </p>
            <button
              onClick={() => setFiltroTipoEmpresa('')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors"
            >
              Mostrar Todas las Empresas
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <span className="text-4xl">🏢</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay empresas activas disponibles
            </h3>
            <p className="text-gray-600 mb-6">
              Estamos verificando nuevas empresas constantemente
            </p>
            <button
              onClick={() => navigate('/registro-proveedor')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors"
            >
              Registrar mi Empresa
            </button>
          </div>
        )}
      </div>
      
      {/* Call to Action para empresas */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Eres una empresa automotriz?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Únete a nuestra comunidad y conecta con miles de clientes
          </p>
          <div className="space-x-4">
            <a
              href="/solicitud-comunidad"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
            >
              Unirse a la Comunidad
            </a>
            <a
              href="/registro-proveedor"
              className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-blue-700"
            >
              Registrar Empresa
            </a>
          </div>
        </div>
      </div>
      
      {/* Footer simple */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">AV10 de Julio</h3>
              <p className="text-gray-300">
                La plataforma automotriz más completa de Chile
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Enlaces</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/contacto" className="hover:text-white">Contacto</a></li>
                <li><a href="/recursos-educativos" className="hover:text-white">Recursos</a></li>
                <li><a href="/faq" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Para Empresas</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/proveedores-locales" className="hover:text-white">Proveedores</a></li>
                <li><a href="/registro-proveedor" className="hover:text-white">Registro</a></li>
                <li><a href="/login" className="hover:text-white">Acceso</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2025 AV10 de Julio. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
