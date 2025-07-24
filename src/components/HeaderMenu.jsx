import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { auth } from "../firebase";
import TicketNotifications from "./TicketNotifications";
import NotificationCenter from "./NotificationCenter";

export default function HeaderMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, rol, loading } = useAuth();
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showServiciosMenu, setShowServiciosMenu] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  // Función para cerrar todos los menús desplegables
  const closeAllMenus = () => {
    setShowServiciosMenu(false);
    setShowAdminMenu(false);
  };

  // Para subrayar el link activo
  const activeClass = (path) =>
    location.pathname === path ? "underline font-bold" : "hover:underline";

  // Solo admin logueado y en proveedores: empresas, campañas, productos
  const isInProveedores =
    location.pathname === "/proveedores" ||
    location.pathname.startsWith("/proveedores/");

  // Proveedores: envía al Dashboard correcto según el rol
  const handleProveedoresClick = () => {
    closeAllMenus();
    
    if (rol === "admin") {
      navigate("/admin");
    } else if (rol === "proveedor") {
      navigate("/dashboard/proveedor");
    } else {
      navigate("/proveedores");
    }
  };

  return (
    <nav className="w-full bg-blue-800 text-white flex items-center px-6 py-3 shadow justify-between z-20">
      <div className="flex items-center gap-4">
        <button className={activeClass("/")} onClick={() => {
          navigate("/");
          closeAllMenus();
        }}>
          Inicio
        </button>
        
        {/* Dashboard por rol */}
        {user && rol !== "admin" && (
          <button
            className={activeClass(
              rol === "proveedor" ? "/dashboard/proveedor" :
              rol === "mecanico" ? "/dashboard/mecanico" :
              "/dashboard/cliente"
            )}
            onClick={() => {
              closeAllMenus();
              
              if (rol === "proveedor") navigate("/dashboard/proveedor");
              else if (rol === "mecanico") navigate("/dashboard/mecanico");
              else navigate("/dashboard/cliente");
            }}
          >
            📊 Mi Dashboard
          </button>
        )}

        {/* Dashboard Admin con menú desplegable */}
        {user && rol === "admin" && (
          <div className="relative">
            <button
              className="hover:underline flex items-center gap-1"
              onClick={() => setShowAdminMenu(!showAdminMenu)}
            >
              📊 Mi Dashboard
              <span className="text-xs">▼</span>
            </button>
            {showAdminMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48 z-50">
                <button
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm font-semibold border-b border-gray-200"
                  onClick={() => {
                    navigate("/admin");
                    setShowAdminMenu(false);
                  }}
                >
                  🏠 Panel Principal
                </button>
                
                {/* Servicios dentro del dashboard admin */}
                <div className="border-b border-gray-200 pb-2 mb-2">
                  <div className="px-4 py-1 text-xs text-gray-500 font-semibold">SERVICIOS</div>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate("/servicios/seguros");
                      setShowAdminMenu(false);
                    }}
                  >
                    🛡️ Seguros
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate("/servicios/revision-tecnica");
                      setShowAdminMenu(false);
                    }}
                  >
                    🔧 Revisión Técnica
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate("/servicios/vulcanizaciones");
                      setShowAdminMenu(false);
                    }}
                  >
                    🏁 Vulcanizaciones
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate("/servicios/reciclaje");
                      setShowAdminMenu(false);
                    }}
                  >
                    ♻️ Reciclaje
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate("/mis-recordatorios");
                      setShowAdminMenu(false);
                    }}
                  >
                    🔔 Mis Recordatorios
                  </button>
                </div>

                {/* Administración */}
                <div className="border-b border-gray-200 pb-2 mb-2">
                  <div className="px-4 py-1 text-xs text-gray-500 font-semibold">ADMINISTRACIÓN</div>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate("/admin/marcas");
                      setShowAdminMenu(false);
                    }}
                  >
                    🏷️ Gestión de Marcas
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate("/admin/tipos-empresa");
                      setShowAdminMenu(false);
                    }}
                  >
                    🏢 Tipos de Empresa
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate("/admin/categorias");
                      setShowAdminMenu(false);
                    }}
                  >
                    📂 Gestión de Categorías
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate("/admin/proveedores");
                      setShowAdminMenu(false);
                    }}
                  >
                    🏪 Gestión de Proveedores
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate("/admin/solicitudes-cliente");
                      setShowAdminMenu(false);
                    }}
                  >
                    👥 Solicitudes de Clientes
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate("/admin/solicitudes-registro");
                      setShowAdminMenu(false);
                    }}
                  >
                    🏪 Solicitudes de Proveedores
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate("/admin/validacion-clientes");
                      setShowAdminMenu(false);
                    }}
                  >
                    ✅ Validación de Clientes
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate("/admin/estadisticas");
                      setShowAdminMenu(false);
                    }}
                  >
                    📊 Panel de Estadísticas
                  </button>
                </div>

                {/* Catastro */}
                <div>
                  <div className="px-4 py-1 text-xs text-gray-500 font-semibold">CATASTRO</div>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate("/admin/catastro-masivo");
                      setShowAdminMenu(false);
                    }}
                  >
                    📊 Catastro Masivo
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate("/admin/panel-validacion");
                      setShowAdminMenu(false);
                    }}
                  >
                    🔍 Panel de Validación
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate("/admin/agentes-campo");
                      setShowAdminMenu(false);
                    }}
                  >
                    👥 Agentes de Campo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Cliente - solo para clientes no admin/proveedor/mecanico */}
        {user && !rol || (user && rol === "cliente") ? (
          <button
            className={activeClass("/status-cliente")}
            onClick={() => {
              navigate("/status-cliente");
              closeAllMenus();
            }}
          >
            👤 Mi Estado
          </button>
        ) : null}

        {/* Proveedores y Empresas - siempre mostrar, ocultar solo si es admin o cliente autenticado */}
        {(!loading && user && (rol === "admin" || rol === "cliente")) ? null : (
          <>
            <button
              className={activeClass("/proveedores")}
              onClick={handleProveedoresClick}
            >
              Proveedores
            </button>
            <button
              className={activeClass("/proveedores-locales")}
              onClick={() => {
                navigate("/proveedores-locales");
                closeAllMenus();
              }}
            >
              🏪 PyME
            </button>
          </>
        )}
        <button
          className={activeClass("/area-cliente")}
          onClick={() => {
            navigate("/area-cliente");
            closeAllMenus();
          }}
        >
          👤 Área Cliente
        </button>
        <button
          className={activeClass("/recursos")}
          onClick={() => {
            navigate("/recursos");
            closeAllMenus();
          }}
        >
          Recursos
        </button>
        <button
          className={activeClass("/faq")}
          onClick={() => {
            navigate("/faq");
            closeAllMenus();
          }}
        >
          FAQ
        </button>
        <button
          className={activeClass("/contacto")}
          onClick={() => {
            navigate("/contacto");
            closeAllMenus();
          }}
        >
          Contacto
        </button>
        
        {/* Servicios Automotrices - siempre mostrar, ocultar solo si es admin autenticado */}
        {(!loading && user && rol === "admin") ? null : (
          <div className="relative">
            <button
              className="hover:underline flex items-center gap-1"
              onClick={() => setShowServiciosMenu(!showServiciosMenu)}
            >
              🚗 Servicios
              <span className="text-xs">▼</span>
            </button>
            {showServiciosMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48 z-50">
                <button
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                  onClick={() => {
                    navigate("/servicios/seguros");
                    setShowServiciosMenu(false);
                  }}
                >
                  🛡️ Seguros
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                  onClick={() => {
                    navigate("/servicios/revision-tecnica");
                    setShowServiciosMenu(false);
                  }}
                >
                  🔧 Revisión Técnica
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                  onClick={() => {
                    navigate("/servicios/vulcanizaciones");
                    setShowServiciosMenu(false);
                  }}
                >
                  🏁 Vulcanizaciones
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                  onClick={() => {
                    navigate("/servicios/reciclaje");
                    setShowServiciosMenu(false);
                  }}
                >
                  ♻️ Reciclaje
                </button>
                {user && (
                  <button
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate("/mis-recordatorios");
                      setShowServiciosMenu(false);
                    }}
                  >
                    🔔 Mis Recordatorios
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {/* Solo admin logueado y en proveedores: empresas, campañas, productos */}
        {user && rol === "admin" && isInProveedores && (
          <>
            <button
              className="hover:underline"
              onClick={() => navigate("/admin/ingresar-empresa")}
            >
              Ingresar empresa
            </button>
            <button
              className="hover:underline"
              onClick={() => navigate("/admin/ingresar-campana")}
            >
              Ingresar campaña
            </button>
            <button
              className="hover:underline"
              onClick={() => navigate("/admin/ingresar-producto")}
            >
              Ingresar producto
            </button>
          </>
        )}

      </div>
      <div className="flex items-center gap-4">
        {/* Centro de Notificaciones para usuarios logueados */}
        {user && <NotificationCenter />}
        
        {rol === 'admin' && <TicketNotifications />}
        {rol === 'admin' && (
          <button
            className="flex items-center gap-1 text-sm hover:underline"
            onClick={() => navigate("/admin/validacion-clientes")}
          >
            ✅ Validar Clientes
          </button>
        )}
        {user && (
          <button
            className="hover:underline text-sm"
            onClick={() => navigate("/mis-consultas")}
          >
            Mis Consultas
          </button>
        )}
        {user && (
          <div className="flex items-center gap-3">
            {/* Información del usuario y menú de perfil */}
            <UserProfileMenu 
              user={user} 
              rol={rol} 
              onLogout={handleLogout}
              navigate={navigate}
            />
          </div>
        )}
      </div>
    </nav>
  );
}

// Componente para el menú de perfil del usuario
function UserProfileMenu({ user, rol, onLogout, navigate }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getDashboardRoute = () => {
    switch(rol) {
      case 'admin': return '/admin';
      case 'proveedor': return '/dashboard/proveedor';
      case 'agente': return '/agente';
      case 'mecanico': return '/dashboard/mecanico';
      case 'cliente': return '/dashboard/cliente';
      default: return '/dashboard/cliente';
    }
  };

  const getRolDisplayName = () => {
    switch(rol) {
      case 'admin': return 'Administrador';
      case 'proveedor': return 'Proveedor';
      case 'agente': return 'Agente de Campo';
      case 'mecanico': return 'Mecánico';
      case 'cliente': return 'Cliente';
      default: return 'Usuario';
    }
  };

  const getRolIcon = () => {
    switch(rol) {
      case 'admin': return '👑';
      case 'proveedor': return '🏪';
      case 'agente': return '👨‍💼';
      case 'mecanico': return '🔧';
      case 'cliente': return '🚗';
      default: return '👤';
    }
  };

  return (
    <div className="relative">
      {/* Botón del perfil */}
      <button
        onClick={() => setShowProfileMenu(!showProfileMenu)}
        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 px-3 py-2 rounded-lg transition-colors"
      >
        <span className="text-lg">{getRolIcon()}</span>
        <div className="text-left hidden md:block">
          <div className="text-xs text-blue-200">Hola,</div>
          <div className="text-sm font-medium truncate max-w-32" title={user.email}>
            {user.displayName || user.email?.split('@')[0] || 'Usuario'}
          </div>
        </div>
        <span className="text-xs">▼</span>
      </button>

      {/* Menú desplegable del perfil */}
      {showProfileMenu && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-64 z-50">
          {/* Header del menú */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                {getRolIcon()}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {user.displayName || user.email?.split('@')[0] || 'Usuario'}
                </div>
                <div className="text-sm text-gray-500">{getRolDisplayName()}</div>
                <div className="text-xs text-gray-400">{user.email}</div>
              </div>
            </div>
          </div>

          {/* Opciones del menú */}
          <div className="py-2">
            <button
              onClick={() => {
                navigate(getDashboardRoute());
                setShowProfileMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-3"
            >
              <span>📊</span>
              <span>Mi Dashboard</span>
            </button>

            <button
              onClick={() => {
                navigate("/");
                setShowProfileMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-3"
            >
              <span>🏠</span>
              <span>Ir al Inicio</span>
            </button>

            <button
              onClick={() => {
                navigate("/mis-consultas");
                setShowProfileMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-3"
            >
              <span>💬</span>
              <span>Mis Consultas</span>
            </button>

            {rol === 'proveedor' && (
              <>
                <button
                  onClick={() => {
                    navigate("/dashboard/proveedor/perfil");
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                >
                  <span>👤</span>
                  <span>Mi Perfil</span>
                </button>
                <button
                  onClick={() => {
                    navigate("/dashboard/proveedor/productos");
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                >
                  <span>📦</span>
                  <span>Mis Productos</span>
                </button>
              </>
            )}

            {rol === 'cliente' && (
              <>
                <button
                  onClick={() => {
                    navigate("/dashboard/cliente/perfil");
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                >
                  <span>👤</span>
                  <span>Mi Perfil</span>
                </button>
                <button
                  onClick={() => {
                    navigate("/dashboard/cliente/vehiculos");
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                >
                  <span>🚗</span>
                  <span>Mis Vehículos</span>
                </button>
              </>
            )}

            {rol === 'agente' && (
              <button
                onClick={() => {
                  navigate("/agente/empresas");
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-3"
              >
                <span>🏢</span>
                <span>Registrar Empresa</span>
              </button>
            )}
          </div>

          {/* Botón de cerrar sesión */}
          <div className="border-t border-gray-200 pt-2">
            <button
              onClick={() => {
                onLogout();
                setShowProfileMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-3"
            >
              <span>🚪</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}