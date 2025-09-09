import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { LocationMarkerIcon as MapPinIcon, PhoneIcon, GlobeAltIcon, StarIcon } from '@heroicons/react/outline';

export default function ListadoEmpresasUnificado({
  filtroMarca,
  filtroBusqueda,
  filtroCategoria,
  filtroTipo = 'todos', // todos, proveedor, pyme, emprendimiento, taller, distribuidor
  filtroUbicacion,
  onEmpresaClick
}) {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Solo muestra empresas activas y mapea todos los campos reales
  useEffect(() => {
    const q = query(collection(db, "empresas"), where("estado", "in", ["activa", "validada"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const empresasData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre,
          descripcion: data.descripcion,
          descripcionCompleta: data.descripcionCompleta,
          direccion: data.direccion,
          telefono: data.telefono,
          email: data.email,
          sitioWeb: data.web,
          tipo: data.rubro || data.categoria,
          destacado: data.destacado || false,
          rating: data.rating || 0,
          totalReviews: data.totalReviews || 0,
          marcas: data.marcas || [],
          categorias: [data.categoria || data.rubro],
          imagen: data.logoAsignado ? data.logo : (data.imagenLocal || null),
          galeria: data.galeria || [],
          horarios: data.horarios || {},
          servicios: data.servicios || [],
          fechaRegistro: data.fechaRegistro,
          redesSociales: {
            facebook: data.facebook,
            instagram: data.instagram,
            whatsapp: data.whatsapp
          },
          contactoAdicional: data.contactoAdicional || {},
          comuna: data.comuna,
          region: data.region,
          tipoServicio: data.tipoServicio || 'general', // Campo para identificar tipo de servicio
        };
      });
      setEmpresas(empresasData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtros
  let empresasFiltradas = empresas;

  // Excluir empresas de revisión técnica del listado general
  empresasFiltradas = empresasFiltradas.filter(emp => 
    emp.tipoServicio !== 'revision_tecnica' && 
    !emp.categorias?.includes('Revisión Técnica')
  );

  if (filtroTipo && filtroTipo !== 'todos') {
    empresasFiltradas = empresasFiltradas.filter(emp =>
      emp.tipo && emp.tipo.toLowerCase() === filtroTipo.toLowerCase()
    );
  }

  if (filtroMarca) {
    empresasFiltradas = empresasFiltradas.filter(emp =>
      Array.isArray(emp.marcas) &&
      emp.marcas.some(m => m.trim().toLowerCase() === filtroMarca.trim().toLowerCase())
    );
  }

  if (filtroCategoria) {
    empresasFiltradas = empresasFiltradas.filter(emp =>
      Array.isArray(emp.categorias) &&
      emp.categorias.some(cat => cat.trim().toLowerCase() === filtroCategoria.trim().toLowerCase())
    );
  }

  if (filtroBusqueda && filtroBusqueda.trim() !== "") {
    const q = filtroBusqueda.trim().toLowerCase();
    empresasFiltradas = empresasFiltradas.filter(emp =>
      (emp.nombre && emp.nombre.toLowerCase().includes(q)) ||
      (emp.descripcion && emp.descripcion.toLowerCase().includes(q)) ||
      (emp.direccion && emp.direccion.toLowerCase().includes(q)) ||
      (Array.isArray(emp.marcas) && emp.marcas.some(m => m.toLowerCase().includes(q))) ||
      (Array.isArray(emp.categorias) && emp.categorias.some(cat => cat.toLowerCase().includes(q))) ||
      (Array.isArray(emp.servicios) && emp.servicios.some(s => s.toLowerCase().includes(q)))
    );
  }

  if (filtroUbicacion) {
    empresasFiltradas = empresasFiltradas.filter(emp =>
      (emp.comuna && emp.comuna.toLowerCase().includes(filtroUbicacion.toLowerCase())) ||
      (emp.region && emp.region.toLowerCase().includes(filtroUbicacion.toLowerCase()))
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (empresasFiltradas.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🏪</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron empresas</h3>
        <p className="text-gray-600">
          {filtroBusqueda || filtroMarca || filtroCategoria || filtroTipo !== 'todos'
            ? 'Intenta ajustar los filtros de búsqueda'
            : 'No hay empresas registradas en este momento'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen de resultados */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {empresasFiltradas.length} {empresasFiltradas.length === 1 ? 'empresa encontrada' : 'empresas encontradas'}
        </h2>
        <div className="flex gap-2">
          {[...new Set(empresas.map(emp => emp.tipo))].map((tipo) => {
            const count = empresas.filter(emp => emp.tipo === tipo).length;
            if (!tipo) return null;
            return (
              <button
                key={tipo}
                onClick={() => {}}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filtroTipo === tipo
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {empresasFiltradas.map((empresa) => (
          <div
            key={empresa.id}
            className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => onEmpresaClick && onEmpresaClick(empresa)}
          >
            {/* Imagen principal o logo */}
            <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-t-lg flex items-center justify-center">
              {empresa.imagen ? (
                <img
                  src={empresa.imagen}
                  alt={empresa.nombre}
                  className="w-full h-full object-contain rounded-t-lg"
                />
              ) : empresa.galeria && empresa.galeria.length > 0 ? (
                <img
                  src={empresa.galeria[0]}
                  alt={empresa.nombre}
                  className="w-full h-full object-cover rounded-t-lg"
                />
              ) : (
                <div className="text-center">
                  <div className="text-4xl text-gray-400 mb-2">🏪</div>
                  <p className="text-gray-500 text-sm font-medium">{empresa.nombre}</p>
                </div>
              )}
            </div>

            <div className="p-6">
              {/* Header con badges */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {empresa.tipo}
                  </span>
                  {empresa.destacado && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      ⭐ Destacado
                    </span>
                  )}
                </div>
              </div>

              {/* Nombre y rating */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {empresa.nombre}
              </h3>

              {empresa.rating > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(empresa.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {empresa.rating.toFixed(1)} ({empresa.totalReviews} reseñas)
                  </span>
                </div>
              )}

              {/* Descripción */}
              {empresa.descripcion && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {empresa.descripcion}
                </p>
              )}

              {/* Información de contacto */}
              <div className="space-y-2">
                {empresa.direccion && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {empresa.direccion}
                    </span>
                  </div>
                )}

                {empresa.telefono && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{empresa.telefono}</span>
                  </div>
                )}

                {empresa.sitioWeb && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GlobeAltIcon className="w-4 h-4 flex-shrink-0" />
                    <a
                      href={empresa.sitioWeb}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visitar sitio web
                    </a>
                  </div>
                )}
              </div>

              {/* Marcas y servicios */}
              {empresa.marcas && empresa.marcas.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Marcas:</p>
                  <div className="flex flex-wrap gap-1">
                    {empresa.marcas.slice(0, 3).map((marca, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {marca}
                      </span>
                    ))}
                    {empresa.marcas.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{empresa.marcas.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              )}

              {empresa.servicios && empresa.servicios.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Servicios:</p>
                  <div className="flex flex-wrap gap-1">
                    {empresa.servicios.slice(0, 2).map((servicio, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                      >
                        {servicio}
                      </span>
                    ))}
                    {empresa.servicios.length > 2 && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                        +{empresa.servicios.length - 2} más
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Redes sociales */}
              <div className="flex gap-2 mt-4">
                {empresa.redesSociales?.whatsapp && (
                  <a
                    href={`https://wa.me/${empresa.redesSociales.whatsapp.replace(/[^\d]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    💬
                  </a>
                )}
                {empresa.redesSociales?.facebook && (
                  <a
                    href={`https://facebook.com/${empresa.redesSociales.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    f
                  </a>
                )}
                {empresa.redesSociales?.instagram && (
                  <a
                    href={`https://instagram.com/${empresa.redesSociales.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-800 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ig
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}