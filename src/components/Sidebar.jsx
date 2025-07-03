import React from "react";
import { Link, useLocation } from "react-router-dom";

const linksAdmin = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/proveedores", label: "Proveedores" },
  { to: "/admin/campañas", label: "Campañas" },
  { to: "/admin/productos", label: "Productos" },
  { to: "/admin/categorias", label: "Categorias" },
  { to: "/admin/marcas", label: "Marcas" },
];

const linksProveedor = [
  { to: "/proveedor", label: "Panel" },
  { to: "/proveedor/mi-empresa", label: "Mi Empresa" },
  { to: "/proveedor/solicitar-campana", label: "Solicitar Campaña" },
  { to: "/proveedor/solicitar-producto", label: "Solicitar Producto" }
];

export default function Sidebar({ rol }) {
  const location = useLocation();
  const links = rol === "admin" ? linksAdmin : linksProveedor;

  return (
    <aside className="bg-blue-900 text-white w-56 min-h-screen flex-shrink-0">
      <div className="p-4 text-2xl font-bold tracking-wider border-b border-blue-800">Av. 10 de Julio</div>
      <nav className="mt-4 flex flex-col gap-1">
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`px-6 py-2 hover:bg-blue-800 rounded-r-full transition-all ${
              location.pathname === link.to ? "bg-blue-800 font-semibold" : ""
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}