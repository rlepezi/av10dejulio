import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function HeaderMenuSimple() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("🚀 HeaderMenuSimple montado, location:", location.pathname);
    console.log("🚀 Navigate function available:", !!navigate);
  }, [location.pathname]);

  // Para subrayar el link activo
  const activeClass = (path) =>
    location.pathname === path ? "underline font-bold" : "hover:underline";

  const handleClick = (path, buttonName) => {
    console.log(`🔥 ${buttonName} clicked!`);
    console.log("🔥 Current location:", location.pathname);
    console.log("🔥 Target path:", path);
    console.log("🔥 Navigate function:", navigate);
    
    try {
      navigate(path);
      console.log(`🔥 ${buttonName} navigate executed successfully`);
    } catch (error) {
      console.error(`🔥 ${buttonName} navigate error:`, error);
    }
  };

  console.log("🚀 HeaderMenuSimple renderizado en:", location.pathname);

  return (
    <div style={{ position: 'relative', zIndex: 9999 }}>
      <nav className="w-full bg-blue-800 text-white flex items-center px-6 py-3 shadow justify-between z-20">
        <div className="flex items-center gap-4">
          <button 
            className={activeClass("/")} 
            onClick={() => handleClick("/", "Inicio")}
            onMouseDown={() => console.log("🔥 Inicio mousedown")}
            onMouseUp={() => console.log("🔥 Inicio mouseup")}
            style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
          >
            Inicio
          </button>
          
          <button
            className={activeClass("/proveedores")}
            onClick={() => handleClick("/proveedores", "Proveedores")}
            onMouseDown={() => console.log("🔥 Proveedores mousedown")}
            onMouseUp={() => console.log("🔥 Proveedores mouseup")}
            style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
          >
            Proveedores
          </button>
          
          <button
            className={activeClass("/proveedores-locales")}
            onClick={() => handleClick("/proveedores-locales", "Empresas")}
            onMouseDown={() => console.log("🔥 Empresas mousedown")}
            style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
          >
            🏪 PyME
          </button>
          
          <button
            className={activeClass("/recursos")}
            onClick={() => handleClick("/recursos", "Recursos")}
            style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
          >
            Recursos
          </button>
          
          <button
            className={activeClass("/faq")}
            onClick={() => handleClick("/faq", "FAQ")}
            style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
          >
            FAQ
          </button>
          
          <button
            className={activeClass("/contacto")}
            onClick={() => handleClick("/contacto", "Contacto")}
            style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
          >
            Contacto
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            className="bg-white text-blue-800 rounded px-4 py-1 font-semibold hover:bg-gray-100 transition-colors"
            onClick={() => handleClick("/login", "Login")}
            style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
          >
            Iniciar sesión
          </button>
        </div>
      </nav>
    </div>
  );
}
