import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const linksAdmin = [
  { to: "", label: "🏠 Panel Principal", icon: "🏠", section: "main" },
  
  // Servicios
  { to: "servicios/seguros", label: "🛡️ Seguros", icon: "🛡️", section: "servicios" },
  { to: "servicios/revision-tecnica", label: "🔧 Revisión Técnica", icon: "🔧", section: "servicios" },
  { to: "servicios/vulcanizaciones", label: "🏁 Vulcanizaciones", icon: "🏁", section: "servicios" },
  { to: "servicios/reciclaje", label: "♻️ Reciclaje", icon: "♻️", section: "servicios" },
  { to: "recordatorios", label: "🔔 Mis Recordatorios", icon: "🔔", section: "servicios" },
  
  // Solicitudes y Gestión de Empresas
  { to: "solicitudes-registro", label: "📋 Solicitudes de Registro", icon: "📋", section: "admin" },
  { to: "empresas", label: "🏢 Empresas Registradas", icon: "🏢", section: "admin" },
  
  // Gestión de Clientes y Comunidad
  { to: "solicitudes-cliente", label: "� Solicitudes de Clientes", icon: "�", section: "admin" },
  { to: "validacion-clientes", label: "✅ Validación de Clientes", icon: "✅", section: "admin" },
  { to: "solicitudes-comunidad", label: "🤝 Solicitudes de Comunidad", icon: "🤝", section: "admin" },
  
  // Configuración del Sistema
  { to: "marcas", label: "🏷️ Gestión de Marcas", icon: "🏷️", section: "admin" },
  { to: "tipos-empresa", label: "🏢 Tipos de Empresa", icon: "🏢", section: "admin" },
  { to: "categorias", label: "� Gestión de Categorías", icon: "�", section: "admin" },
  
  // Moderación y Control
  { to: "moderacion-reseñas", label: "⭐ Moderación Reseñas", icon: "⭐", section: "admin" },
  { to: "gestion-tickets", label: "🎫 Gestión de Tickets", icon: "🎫", section: "admin" },
  { to: "notificaciones", label: "📱 Notificaciones Push", icon: "📱", section: "admin" },
  
  // Análisis y Configuración
  { to: "estadisticas", label: "� Panel de Estadísticas", icon: "�", section: "admin" },
  { to: "recursos-educativos", label: "� Recursos Educativos", icon: "�", section: "admin" },
  { to: "configuracion-sistema", label: "⚙️ Configuración Sistema", icon: "⚙️", section: "admin" },
  
  // Catastro
  { to: "catastro-masivo", label: "📊 Catastro Masivo", icon: "📊", section: "catastro" },
  { to: "panel-validacion", label: "🔍 Panel de Validación", icon: "🔍", section: "catastro" },
  { to: "agentes-campo", label: "👥 Agentes de Campo", icon: "👥", section: "catastro" },
  { to: "gestion-agentes", label: "🔑 Gestión de Agentes", icon: "🔑", section: "catastro" },
];

const linksProveedor = [
  { to: "/proveedor", label: "Panel", icon: "📊" },
  { to: "/proveedor/mi-empresa", label: "Mi Empresa", icon: "🏢" },
  { to: "/proveedor/solicitar-campana", label: "Solicitar Campaña", icon: "📢" },
  { to: "/proveedor/solicitar-producto", label: "Solicitar Producto", icon: "📦" }
];

export default function Sidebar({ rol }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const links = rol === "admin" ? linksAdmin : linksProveedor;
  
  // Determinar si estamos en el contexto de admin
  const isInAdminContext = location.pathname.startsWith('/admin');

  // Función para agrupar enlaces por sección
  const groupLinksBySection = (links) => {
    const grouped = {};
    links.forEach(link => {
      const section = link.section || 'default';
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(link);
    });
    return grouped;
  };

  const sectionTitles = {
    main: "PANEL PRINCIPAL",
    servicios: "SERVICIOS",
    admin: "ADMINISTRACIÓN",
    catastro: "CATASTRO"
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Función para manejar la navegación
  const handleNavigation = (to) => {
    if (rol === "admin" && isInAdminContext) {
      // Navegar de forma relativa dentro del contexto de admin
      navigate(to === "" ? "/admin" : `/admin/${to}`);
    } else {
      // Navegación normal
      navigate(to);
    }
  };

  return (
    <aside className={`bg-blue-900 text-white min-h-screen flex-shrink-0 overflow-y-auto transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className={`p-4 border-b border-blue-800 flex items-center justify-between ${
        isCollapsed ? 'px-2' : ''
      }`}>
        {!isCollapsed && (
          <div className="text-xl font-bold tracking-wider">
            🚗 AV10 de Julio
            <div className="text-xs font-normal text-blue-200 mt-1">Panel de Administración</div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
          title={isCollapsed ? "Expandir menú" : "Contraer menú"}
        >
          {isCollapsed ? "☰" : "◀"}
        </button>
      </div>
      
      <nav className="mt-4">
        {rol === "admin" ? (
          Object.entries(groupLinksBySection(linksAdmin)).map(([section, sectionLinks]) => (
            <div key={section} className="mb-4">
              {section !== 'main' && !isCollapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-blue-200 uppercase tracking-wider border-t border-blue-800 mt-4 pt-4">
                  {sectionTitles[section]}
                </div>
              )}
              <div className="flex flex-col gap-1">
                {sectionLinks.map(link => {
                  const currentPath = isInAdminContext 
                    ? (link.to === "" ? "/admin" : `/admin/${link.to}`)
                    : link.to;
                  const isActive = location.pathname === currentPath;
                  
                  return (
                    <button
                      key={link.to}
                      onClick={() => handleNavigation(link.to)}
                      className={`w-full px-4 py-2 mx-2 hover:bg-blue-800 rounded-lg transition-all text-sm flex items-center gap-3 ${
                        isActive
                          ? "bg-blue-800 font-semibold border-l-4 border-blue-300" 
                          : "hover:border-l-4 hover:border-blue-400"
                      } ${isCollapsed ? 'justify-center px-2' : ''}`}
                      title={isCollapsed ? link.label : ''}
                    >
                      <span className="text-lg">{link.icon}</span>
                      {!isCollapsed && <span className="text-left">{link.label.replace(link.icon, '').trim()}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col gap-1 mt-4">
            {links.map(link => {
              const isActive = location.pathname === link.to;
              
              return (
                <button
                  key={link.to}
                  onClick={() => navigate(link.to)}
                  className={`w-full px-4 py-2 mx-2 hover:bg-blue-800 rounded-lg transition-all flex items-center gap-3 ${
                    isActive ? "bg-blue-800 font-semibold" : ""
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  title={isCollapsed ? link.label : ''}
                >
                  <span className="text-lg">{link.icon}</span>
                  {!isCollapsed && <span className="text-left">{link.label}</span>}
                </button>
              );
            })}
          </div>
        )}
      </nav>
    </aside>
  );
}