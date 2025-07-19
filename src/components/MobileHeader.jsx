// Header móvil optimizado para AV10 de Julio
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { useNavigate, useLocation } from 'react-router-dom';

export default function MobileHeader() {
  const { user, rol, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Cerrar sidebar cuando cambie la ruta
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const getNavigationItems = () => {
    const baseItems = [
      { path: '/', label: 'Inicio', icon: 'home' },
      { path: '/productos', label: 'Productos', icon: 'shopping-bag' },
      { path: '/contacto', label: 'Contacto', icon: 'phone' }
    ];

    if (!user) {
      return [
        ...baseItems,
        { path: '/login', label: 'Iniciar Sesión', icon: 'log-in' },
        { path: '/registro-cliente', label: 'Registro Cliente', icon: 'user-plus' },
        { path: '/registro-proveedor', label: 'Registro Proveedor', icon: 'building' }
      ];
    }

    const userItems = {
      admin: [
        { path: '/admin', label: 'Panel Admin', icon: 'settings' },
        { path: '/admin/empresas', label: 'Empresas', icon: 'building' },
        { path: '/admin/solicitudes-cliente', label: 'Solicitudes Cliente', icon: 'users' },
        { path: '/admin/agentes-campo', label: 'Agentes', icon: 'map-pin' }
      ],
      cliente: [
        { path: '/dashboard/cliente', label: 'Mi Dashboard', icon: 'home' },
        { path: '/vehiculos/gestionar', label: 'Mis Vehículos', icon: 'truck' },
        { path: '/status-cliente', label: 'Mi Estado', icon: 'check-circle' }
      ],
      proveedor: [
        { path: '/dashboard/proveedor', label: 'Mi Dashboard', icon: 'home' },
        { path: '/proveedores/mi-empresa', label: 'Mi Empresa', icon: 'building' },
        { path: '/clientes-area', label: 'Clientes del Área', icon: 'users' },
        { path: '/proveedores/solicitar-campana', label: 'Nueva Campaña', icon: 'megaphone' }
      ],
      agente: [
        { path: '/dashboard/agente', label: 'Panel Agente', icon: 'map-pin' },
        { path: '/dashboard/agente', label: 'Empresas Asignadas', icon: 'building' }
      ]
    };

    return [...baseItems, ...(userItems[rol] || [])];
  };

  const getPageTitle = () => {
    const titles = {
      '/': 'AV10 de Julio',
      '/admin': 'Panel Administrativo',
      '/dashboard/cliente': 'Dashboard Cliente',
      '/dashboard/proveedor': 'Dashboard Proveedor',
      '/dashboard/agente': 'Panel Agente',
      '/vehiculos/gestionar': 'Mis Vehículos',
      '/productos': 'Productos',
      '/contacto': 'Contacto'
    };

    return titles[location.pathname] || 'AV10 de Julio';
  };

  const renderIcon = (iconName, className = "w-5 h-5") => {
    const icons = {
      home: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      users: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      building: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      truck: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'map-pin': (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      settings: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      'shopping-bag': (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
        </svg>
      ),
      phone: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      'log-in': (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      ),
      'user-plus': (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      'check-circle': (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      megaphone: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      'log-out': (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      bell: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM9.586 17H3l6.586-6.586a2 2 0 010-2.828l6.414-6.414a2 2 0 012.828 0l2.586 2.586a2 2 0 010 2.828L15 13.414V17z" />
        </svg>
      )
    };

    return icons[iconName] || icons.home;
  };

  return (
    <>
      {/* Header fijo */}
      <header className="header-mobile bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between h-full">
          {/* Hamburger Menu */}
          <button
            onClick={toggleSidebar}
            className={`hamburger ${isSidebarOpen ? 'open' : ''}`}
            aria-label="Abrir menú"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Logo y título */}
          <div className="flex items-center space-x-3">
            <img 
              src="/logo192.png" 
              alt="AV10 de Julio" 
              className="h-8 w-8"
            />
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {getPageTitle()}
            </h1>
          </div>

          {/* Acciones del usuario */}
          <div className="flex items-center space-x-2">
            {user && (
              <>
                {/* Notificaciones */}
                <button className="p-2 text-gray-600 hover:text-gray-900 relative">
                  {renderIcon('bell', 'w-5 h-5')}
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>

                {/* Avatar del usuario */}
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Overlay para cerrar sidebar */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar móvil */}
      <nav className={`sidebar-mobile ${isSidebarOpen ? 'open' : ''}`}>
        <div className="p-4">
          {/* Header del sidebar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo192.png" 
                alt="AV10 de Julio" 
                className="h-8 w-8"
              />
              <span className="text-lg font-bold text-gray-900">AV10 de Julio</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Información del usuario */}
          {user && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {rol}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Enlaces de navegación */}
          <div className="space-y-2">
            {getNavigationItems().map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  navigate(item.path);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {renderIcon(item.icon)}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Logout */}
          {user && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
              >
                {renderIcon('log-out')}
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Espaciador para el header fijo */}
      <div className="h-16 md:hidden" />
    </>
  );
}
