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
  const [solicitudesAprobadas, setSolicitudesAprobadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empresasUnificadas, setEmpresasUnificadas] = useState([]);

  // Cargar empresas existentes (legacy)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "empresas"), (snapshot) => {
      const empresasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        origen: 'legacy',
        tipo: determinarTipoEmpresa(doc.data())
      }));
      setEmpresas(empresasData);
    });
    return () => unsubscribe();
  }, []);

  // Cargar solicitudes aprobadas de proveedores
  useEffect(() => {
    const q = query(
      collection(db, "solicitudes_proveedor"),
      where("estado", "==", "aprobada")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const solicitudesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        origen: 'nuevo_proveedor',
        tipo: 'proveedor'
      }));
      setSolicitudesAprobadas(prev => [...prev.filter(s => s.origen !== 'nuevo_proveedor'), ...solicitudesData]);
    });
    return () => unsubscribe();
  }, []);

  // Cargar solicitudes aprobadas de empresas (pymes, etc.)
  useEffect(() => {
    const q = query(
      collection(db, "solicitudes_empresa"),
      where("estado", "==", "aprobada")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const solicitudesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        origen: 'nueva_empresa',
        tipo: doc.data().tipoEmpresa || 'pyme'
      }));
      setSolicitudesAprobadas(prev => [...prev.filter(s => s.origen !== 'nueva_empresa'), ...solicitudesData]);
    });
    return () => unsubscribe();
  }, []);

  // Unificar todas las empresas
  useEffect(() => {
    const unificadas = [
      ...empresas.map(emp => formatearEmpresaLegacy(emp)),
      ...solicitudesAprobadas.map(sol => formatearEmpresaNueva(sol))
    ];
    
    setEmpresasUnificadas(unificadas);
    setLoading(false);
  }, [empresas, solicitudesAprobadas]);

  const determinarTipoEmpresa = (empresa) => {
    if (empresa.esPyme) return 'pyme';
    if (empresa.esEmprendimiento) return 'emprendimiento';
    if (empresa.esTaller) return 'taller';
    if (empresa.esDistribuidor) return 'distribuidor';
    return 'proveedor';
  };

  const formatearEmpresaLegacy = (empresa) => ({
    id: empresa.id,
    nombre: empresa.nombre || empresa.nombreEmpresa,
    descripcion: empresa.descripcion || empresa.giroComercial,
    direccion: empresa.direccion,
    comuna: empresa.comuna,
    region: empresa.region,
    telefono: empresa.telefono,
    email: empresa.email,
    sitioWeb: empresa.sitioWeb || empresa.sitio_web,
    tipo: empresa.tipo,
    verificado: empresa.verificado || false,
    premium: empresa.esPremium || false,
    rating: empresa.rating || 0,
    totalReviews: empresa.totalReviews || 0,
    marcas: empresa.marcas || [],
    categorias: empresa.categorias || [],
    imagen: empresa.imagen || empresa.logo,
    horarios: empresa.horariosAtencion || empresa.horarios,
    servicios: empresa.serviciosPrincipales || [],
    origen: 'legacy',
    fechaRegistro: empresa.fechaRegistro || empresa.fechaCreacion
  });

  const formatearEmpresaNueva = (solicitud) => ({
    id: solicitud.id,
    nombre: solicitud.nombreEmpresa,
    descripcion: solicitud.giroComercial,
    direccion: solicitud.direccion,
    comuna: solicitud.comuna,
    region: solicitud.region,
    telefono: solicitud.telefono,
    email: solicitud.email,
    sitioWeb: solicitud.sitioWeb,
    tipo: solicitud.tipo,
    verificado: true, // Las aprobadas están verificadas
    premium: false,
    rating: 0,
    totalReviews: 0,
    marcas: solicitud.marcasQueManeja || [],
    categorias: [solicitud.sectorAutomotriz],
    imagen: null,
    horarios: solicitud.horariosAtencion,
    servicios: solicitud.serviciosPrincipales || [],
    origen: solicitud.origen,
    fechaRegistro: solicitud.fechaSolicitud,
    representante: {
      nombre: solicitud.nombreRepresentante,
      cargo: solicitud.cargoRepresentante,
      telefono: solicitud.telefonoRepresentante,
      email: solicitud.emailRepresentante
    },
    redesSociales: {
      facebook: solicitud.facebook,
      instagram: solicitud.instagram,
      whatsapp: solicitud.whatsapp
    }
  });

  // Aplicar filtros
  let empresasFiltradas = empresasUnificadas.filter(empresa => empresa.nombre);

  // Filtro por tipo
  if (filtroTipo && filtroTipo !== 'todos') {
    empresasFiltradas = empresasFiltradas.filter(emp => emp.tipo === filtroTipo);
  }

  // Filtro por marca
  if (filtroMarca) {
    empresasFiltradas = empresasFiltradas.filter(emp =>
      Array.isArray(emp.marcas) &&
      emp.marcas.some(m => m.trim().toLowerCase() === filtroMarca.trim().toLowerCase())
    );
  }

  // Filtro por categoría
  if (filtroCategoria) {
    empresasFiltradas = empresasFiltradas.filter(emp =>
      Array.isArray(emp.categorias) &&
      emp.categorias.some(cat => cat.trim().toLowerCase() === filtroCategoria.trim().toLowerCase())
    );
  }

  // Filtro por búsqueda
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

  // Filtro por ubicación
  if (filtroUbicacion) {
    empresasFiltradas = empresasFiltradas.filter(emp =>
      (emp.comuna && emp.comuna.toLowerCase().includes(filtroUbicacion.toLowerCase())) ||
      (emp.region && emp.region.toLowerCase().includes(filtroUbicacion.toLowerCase()))
    );
  }

  const getTipoBadge = (tipo) => {
    const badges = {
      proveedor: { label: 'Proveedor', color: 'bg-blue-100 text-blue-800' },
      pyme: { label: 'PyME', color: 'bg-green-100 text-green-800' },
      emprendimiento: { label: 'Emprendimiento', color: 'bg-purple-100 text-purple-800' },
      taller: { label: 'Taller', color: 'bg-orange-100 text-orange-800' },
      distribuidor: { label: 'Distribuidor', color: 'bg-indigo-100 text-indigo-800' }
    };
    
    const badge = badges[tipo] || badges.proveedor;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getOrigenBadge = (origen) => {
    if (origen === 'legacy') return null;
    
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
        Nuevo
      </span>
    );
  };

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
          {['todos', 'proveedor', 'pyme', 'emprendimiento', 'taller', 'distribuidor'].map((tipo) => {
            const count = empresasUnificadas.filter(emp => tipo === 'todos' || emp.tipo === tipo).length;
            if (count === 0 && tipo !== 'todos') return null;
            
            return (
              <button
                key={tipo}
                onClick={() => {}} // Implementar cambio de filtro
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filtroTipo === tipo
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tipo === 'todos' ? 'Todas' : tipo.charAt(0).toUpperCase() + tipo.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {empresasFiltradas.map((empresa) => (
          <div
            key={`${empresa.origen}-${empresa.id}`}
            className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => onEmpresaClick && onEmpresaClick(empresa)}
          >
            {/* Imagen o placeholder */}
            <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-t-lg flex items-center justify-center">
              {empresa.imagen ? (
                <img
                  src={empresa.imagen}
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
                  {getTipoBadge(empresa.tipo)}
                  {getOrigenBadge(empresa.origen)}
                  {empresa.verificado && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      ✓ Verificado
                    </span>
                  )}
                  {empresa.premium && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      ⭐ Premium
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
                      {empresa.direccion}, {empresa.comuna}
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

              {/* Servicios principales */}
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

              {/* Footer con acciones */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {empresa.fechaRegistro && (
                    <span>
                      Desde {new Date(empresa.fechaRegistro.toDate ? empresa.fechaRegistro.toDate() : empresa.fechaRegistro).getFullYear()}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
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
                  {empresa.email && (
                    <a
                      href={`mailto:${empresa.email}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ✉️
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
