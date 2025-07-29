import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import SearchBarUnificado from '../components/SearchBarUnificado';
import AdBanner from '../components/AdBanner';
import { testEmpresasConnection } from '../utils/testEmpresas';

const HomePage = () => {
  const navigate = useNavigate();
  const [empresasActivas, setEmpresasActivas] = useState([]);
  const [empresasFiltradas, setEmpresasFiltradas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [filtroTipoEmpresa, setFiltroTipoEmpresa] = useState('');

  // Cargar empresas activas
  useEffect(() => {
    const cargarEmpresasActivas = async () => {
      try {
        setLoadingEmpresas(true);
        console.log('🔍 Buscando empresas activas...');
        
        // Ejecutar test de debug primero
        const testResult = await testEmpresasConnection();
        console.log('🧪 Resultado del test:', testResult);
        
        let empresasEncontradas = [];
        
        // Intento 1: Empresas con estado 'activa' (minúscula, como se crea en SolicitudesRegistro)
        try {
          console.log('🔄 Buscando empresas con estado "activa"...');
          const q1 = query(
            collection(db, 'empresas'),
            where('estado', '==', 'activa'),
            limit(8)
          );
          
          const snapshot1 = await getDocs(q1);
          console.log('📊 Empresas con estado "activa":', snapshot1.size);
          
          if (snapshot1.size > 0) {
            empresasEncontradas = snapshot1.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Ordenar manualmente por fecha_registro si existe
            empresasEncontradas.sort((a, b) => {
              const fechaA = a.fecha_registro?.toDate?.() || a.fecha_registro || new Date(0);
              const fechaB = b.fecha_registro?.toDate?.() || b.fecha_registro || new Date(0);
              return fechaB - fechaA;
            });
          }
        } catch (error) {
          console.log('⚠️ Error con primera consulta:', error.message);
        }
        
        // Intento 2: Si no se encontraron, intentar con 'Activa' (mayúscula)
        if (empresasEncontradas.length === 0) {
          try {
            console.log('🔄 Buscando empresas con estado "Activa"...');
            const q2 = query(
              collection(db, 'empresas'),
              where('estado', '==', 'Activa'),
              limit(8)
            );
            
            const snapshot2 = await getDocs(q2);
            console.log('📊 Empresas con estado "Activa":', snapshot2.size);
            
            if (snapshot2.size > 0) {
              empresasEncontradas = snapshot2.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
            }
          } catch (error) {
            console.log('⚠️ Error con segunda consulta:', error.message);
          }
        }
        
        // Intento 3: Si aún no hay resultados, traemos todas las empresas para debug
        if (empresasEncontradas.length === 0) {
          console.log('🔄 Trayendo todas las empresas para análisis...');
          try {
            const q3 = query(
              collection(db, 'empresas'),
              limit(10)
            );
            const snapshot3 = await getDocs(q3);
            console.log('📊 Total empresas encontradas:', snapshot3.size);
            
            // Log de estados para debug
            snapshot3.docs.forEach(doc => {
              const data = doc.data();
              console.log(`🏢 Empresa: ${data.nombre || 'Sin nombre'} - Estado: "${data.estado}" - Tipo: ${typeof data.estado}`);
            });
            
            // Tomar solo las que tienen estado activo (cualquier formato)
            empresasEncontradas = snapshot3.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(empresa => 
                empresa.estado === 'activa' || 
                empresa.estado === 'Activa' ||
                empresa.estado === 'ACTIVA'
              )
              .slice(0, 8);
            
            console.log('✅ Empresas activas filtradas:', empresasEncontradas.length);
          } catch (error) {
            console.error('❌ Error con consulta de debug:', error);
          }
        }
        
        console.log('✅ Empresas finales cargadas:', empresasEncontradas.length);
        setEmpresasActivas(empresasEncontradas);
        
      } catch (error) {
        console.error('❌ Error general cargando empresas activas:', error);
        setEmpresasActivas([]);
      } finally {
        setLoadingEmpresas(false);
      }
    };

    cargarEmpresasActivas();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...empresasActivas];
    
    if (filtroTipoEmpresa) {
      filtered = filtered.filter(empresa => (empresa.tipoEmpresa || '').toLowerCase() === filtroTipoEmpresa.toLowerCase());
    }
    
    console.log('🔍 Empresas después del filtro:', filtered.length);
    console.log('📋 Filtro actual:', filtroTipoEmpresa || 'Sin filtro');
    
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
            Descubre las empresas automotrices activas y verificadas en nuestra plataforma
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
                  onClick={() => navigate(`/empresa/${empresa.id}`)}
                >
                  {/* Logo de la empresa */}
                  <div className="h-32 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    {empresa.logo ? (
                      <img 
                        src={empresa.logo} 
                        alt={empresa.nombre}
                        className="max-h-24 max-w-24 object-contain"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {empresa.nombre ? empresa.nombre.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Información de la empresa */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {empresa.nombre || 'Sin nombre'}
                      </h3>
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
                    
                    {/* Categorías */}
                    {empresa.categorias && empresa.categorias.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {empresa.categorias.slice(0, 2).map((categoria, index) => (
                          <span 
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {categoria}
                          </span>
                        ))}
                        {empresa.categorias.length > 2 && (
                          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            +{empresa.categorias.length - 2} más
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
