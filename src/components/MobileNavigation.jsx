import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { useMobileDetection } from '../hooks/useMobileDetection';

export default function MobileNavigation() {
  const { user, rol } = useAuth();
  const { isMobile } = useMobileDetection();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Detectar scroll para cambiar estilo del header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.mobile-menu')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!isMobile) return null;

  const navigationItems = [
    {
      label: 'Inicio',
      path: '/',
      icon: '🏠',
      public: true
    },
    {
      label: 'Empresas',
      path: '/empresas',
      icon: '🏢',
      public: true
    },
    {
      label: 'Servicios',
      path: '/servicios',
      icon: '🔧',
      public: true,
      submenu: [
        { label: 'Seguros', path: '/servicios/seguros', icon: '🛡️' },
        { label: 'Revisión Técnica', path: '/servicios/revision-tecnica', icon: '🔧' },
        { label: 'Vulcanizaciones', path: '/servicios/vulcanizaciones', icon: '🏁' },
        { label: 'Reciclaje', path: '/servicios/reciclaje', icon: '♻️' }
      ]
    },
    {
      label: 'Recursos',
      path: '/recursos',
      icon: '📚',
      public: true
    },
    {
      label: 'FAQ',
      path: '/faq',
      icon: '❓',
      public: true
    },
    {
      label: 'Contacto',
      path: '/contacto',
      icon: '📞',
      public: true
    }
  ];

  const userMenuItems = [
    {
      label: 'Mi Dashboard',
      path: '/dashboard',
      icon: '📊',
      roles: ['cliente', 'proveedor', 'admin', 'agente']
    },
    {
      label: 'Mi Perfil',
      path: '/dashboard/perfil',
      icon: '👤',
      roles: ['cliente', 'proveedor', 'admin', 'agente']
    },
    {
      label: 'Configuración',
      path: '/dashboard/configuracion',
      icon: '⚙️',
      roles: ['cliente', 'proveedor', 'admin', 'agente']
    }
  ];

  const getFilteredItems = (items) => {
    if (!user) {
      return items.filter(item => item.public);
    }
    return items.filter(item => 
      item.public || 
      (item.roles && item.roles.includes(rol))
    );
  };

  const isActivePath = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Header móvil */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-lg' : 'bg-transparent'
      }`}>
        <div className="flex items-center justify-between p-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AV</span>
            </div>
            <span className="font-bold text-lg text-gray-900">10 de Julio</span>
          </Link>

          {/* Botón de menú */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <div className={`w-6 h-6 flex flex-col justify-center space-y-1 transition-all duration-300 ${
              isOpen ? 'rotate-45' : ''
            }`}>
              <div className={`h-0.5 bg-gray-700 transition-all duration-300 ${
                isOpen ? 'rotate-90 translate-y-1' : ''
              }`}></div>
              <div className={`h-0.5 bg-gray-700 transition-all duration-300 ${
                isOpen ? 'opacity-0' : ''
              }`}></div>
              <div className={`h-0.5 bg-gray-700 transition-all duration-300 ${
                isOpen ? '-rotate-90 -translate-y-1' : ''
              }`}></div>
            </div>
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menú lateral */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 mobile-menu ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header del menú */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Menú</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Información del usuario */}
            {user && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.email}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {rol}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navegación principal */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Navegación
              </h3>
              <nav className="space-y-1">
                {getFilteredItems(navigationItems).map((item) => (
                  <div key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActivePath(item.path)
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                    
                    {/* Submenú */}
                    {item.submenu && isActivePath(item.path) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                              isActivePath(subItem.path)
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-sm">{subItem.icon}</span>
                            <span>{subItem.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              {/* Menú de usuario */}
              {user && (
                <>
                  <div className="mt-8">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Mi Cuenta
                    </h3>
                    <nav className="space-y-1">
                      {getFilteredItems(userMenuItems).map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                            isActivePath(item.path)
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      ))}
                    </nav>
                  </div>

                  {/* Botón de logout */}
                  <div className="mt-8 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        // Aquí iría la lógica de logout
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <span className="text-lg">🚪</span>
                      <span className="font-medium">Cerrar Sesión</span>
                    </button>
                  </div>
                </>
              )}

              {/* Botones de registro/login si no está logueado */}
              {!user && (
                <div className="mt-8 space-y-3">
                  <Link
                    to="/login"
                    className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/registro-cliente"
                    className="block w-full border border-blue-600 text-blue-600 text-center py-2 px-4 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

