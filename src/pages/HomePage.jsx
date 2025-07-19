import React from 'react';
import HeroSection from '../components/HeroSection';
import SearchBarUnificado from '../components/SearchBarUnificado';
import AdBanner from '../components/AdBanner';

const HomePage = () => {
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
