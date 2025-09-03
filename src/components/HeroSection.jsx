import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderMenu from './HeaderMenu';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white overflow-hidden">
      {/* Barra de navegación global */}
      <HeaderMenu />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{ pointerEvents: 'none' }}>
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <g fill="none" fillRule="evenodd">
            <g fill="#ffffff" fillOpacity="0.05">
              <circle cx="7" cy="7" r="7"/>
            </g>
          </g>
        </svg>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  200+
                </span>{' '}
                Proveedores
                <br />
                <span className="text-3xl lg:text-5xl">del sector automotriz</span>
              </h1>
              <p className="text-xl lg:text-2xl text-blue-100 max-w-lg">
                Descubre repuestos, servicios y las mejores ofertas en la 
                <strong className="text-yellow-400"> Av. 10 de Julio</strong>
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-yellow-400">200+</div>
                <div className="text-sm text-blue-200">Proveedores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-yellow-400">1000+</div>
                <div className="text-sm text-blue-200">Productos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-yellow-400">50+</div>
                <div className="text-sm text-blue-200">Campañas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-green-400">♻️</div>
                <div className="text-sm text-blue-200">Reciclaje</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4">
              {/* Botones principales de navegación */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/proveedores')}
                  className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 px-8 py-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  Ver Proveedores
                </button>
                <button
                  onClick={() => navigate('/proveedores-locales')}
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3 rounded-lg font-semibold text-lg transition-all"
                >
                  🏪 PyMEs Locales
                </button>
                <button
                  onClick={() => navigate('/servicios/reciclaje')}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  ♻️ Reciclaje
                </button>
              </div>
              
              {/* Botones de acceso/login */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/login?tipo=cliente')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  🔑 <span>Acceso Clientes</span>
                </button>
                <button
                  onClick={() => navigate('/login?tipo=empresa')}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  🏢 <span>Acceso Empresas</span>
                </button>
                <button
                  onClick={() => navigate('/registro-cliente')}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-6 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
                >
                  ➕ <span>Registrarse</span>
                </button>
              </div>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative">
            <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                    <span className="text-blue-900 text-2xl">🚗</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Repuestos Originales y Alternativos</h3>
                    <p className="text-blue-200 text-sm">Calidad garantizada</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl">🛠️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Servicios Especializados</h3>
                    <p className="text-blue-200 text-sm">Técnicos expertos</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-400 rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl">💰</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Mejores Precios</h3>
                    <p className="text-blue-200 text-sm">Ofertas exclusivas</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-orange-400/20 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>

      {/* Sección de Beneficios para Clientes y PyMEs */}
      <div className="bg-white text-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Únete a Nuestra <span className="text-blue-600">Comunidad</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tanto si eres dueño de vehículo como emprendedor automotriz, 
              tenemos beneficios especiales para ti en la Av. 10 de Julio
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Sección Clientes */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 border border-blue-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-3xl">👤</span>
                </div>
                <h3 className="text-2xl font-bold text-blue-900">Para Clientes</h3>
                <p className="text-blue-700">Registra tu vehículo y obtén beneficios únicos</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Recordatorios Inteligentes</h4>
                    <p className="text-gray-600 text-sm">Permiso de circulación, revisión técnica, seguros y mantenciones</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Ofertas Personalizadas</h4>
                    <p className="text-gray-600 text-sm">Promociones según tu marca y modelo de vehículo</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Historial de Gastos</h4>
                    <p className="text-gray-600 text-sm">Controla y planifica los gastos de tu vehículo</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Red de Proveedores Locales</h4>
                    <p className="text-gray-600 text-sm">Acceso directo a talleres y repuestos cerca de ti</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/registro-cliente')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  🚗 Registrar Mi Vehículo
                </button>
                <button
                  onClick={() => navigate('/login?tipo=cliente')}
                  className="w-full bg-white border-2 border-blue-600 text-blue-600 py-3 px-6 rounded-lg font-semibold transition-all hover:bg-blue-50"
                >
                  🔑 Ya Tengo Cuenta - Ingresar
                </button>
              </div>
            </div>

            {/* Sección Proveedores y Empresas */}
            <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-2xl p-8 border border-orange-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-3xl">�</span>
                </div>
                <h3 className="text-2xl font-bold text-orange-900">Para Proveedores y Empresas</h3>
                <p className="text-orange-700">Únete a los 200+ proveedores de nuestra comunidad</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Acceso a Miles de Clientes</h4>
                    <p className="text-gray-600 text-sm">Conecta con propietarios de vehículos que buscan servicios confiables</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Presencia Digital Profesional</h4>
                    <p className="text-gray-600 text-sm">Tu empresa visible en la mayor plataforma automotriz de la zona</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Herramientas de Promoción</h4>
                    <p className="text-gray-600 text-sm">Gestiona campañas y ofertas para aumentar tus ventas</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Validación y Credibilidad</h4>
                    <p className="text-gray-600 text-sm">Forma parte de proveedores verificados y de confianza</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Red de Colaboración</h4>
                    <p className="text-gray-600 text-sm">Conecta con otros proveedores y amplía tu red de negocios</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/registro-proveedor')}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  🏢 Registrar Mi Empresa
                </button>
                <button
                  onClick={() => navigate('/login?tipo=empresa')}
                  className="w-full bg-white border-2 border-orange-600 text-orange-600 py-3 px-6 rounded-lg font-semibold transition-all hover:bg-orange-50"
                >
                  🔑 Ya Tengo Cuenta - Ingresar
                </button>
                <button
                  onClick={() => navigate('/solicitud-comunidad')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  🤝 Unirse a la Comunidad
                </button>
                <button
                  onClick={() => navigate('/proveedores')}
                  className="w-full border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white py-3 px-6 rounded-lg font-semibold transition-all"
                >
                  � Ver Todos los Proveedores
                </button>
              </div>
            </div>
          </div>

          {/* Estadísticas de la Comunidad */}
          <div className="mt-16 bg-gray-50 rounded-2xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Nuestra Red de Proveedores en Números</h3>
              <p className="text-gray-600">Únete a la mayor comunidad automotriz de la Av. 10 de Julio</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">2,500+</div>
                <div className="text-gray-600 text-sm">Vehículos Registrados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">200+</div>
                <div className="text-gray-600 text-sm">Proveedores Verificados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">8,500+</div>
                <div className="text-gray-600 text-sm">Conexiones Realizadas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">98%</div>
                <div className="text-gray-600 text-sm">Satisfacción Cliente</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
