import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import ProviderCard from "./ProviderCard";
import AdvancedFilters from "./AdvancedFilters";

export default function ListadoEmpresas({
  filtroMarca,
  filtroBusqueda,
  filtroCategoria,
  onEditar,
  usuario
}) {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "empresas"), (snapshot) => {
      setEmpresas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Solo mostrar empresas con estado 'Activa'
  let empresasFiltradas = empresas.filter(emp => emp.estado === "Activa");

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
      (emp.direccion && emp.direccion.toLowerCase().includes(q)) ||
      (Array.isArray(emp.marcas) && emp.marcas.some(m => m.toLowerCase().includes(q))) ||
      (Array.isArray(emp.categorias) && emp.categorias.some(cat => cat.toLowerCase().includes(q)))
    );
  }

  // Aplicar filtros avanzados
  if (advancedFilters.region) {
    empresasFiltradas = empresasFiltradas.filter(emp => emp.region === advancedFilters.region);
  }

  if (advancedFilters.ciudad) {
    empresasFiltradas = empresasFiltradas.filter(emp => emp.ciudad === advancedFilters.ciudad);
  }

  if (advancedFilters.tipoProveedor) {
    switch (advancedFilters.tipoProveedor) {
      case 'emprendimiento':
        empresasFiltradas = empresasFiltradas.filter(emp => {
          const fechaRegistro = emp.fechaRegistro || emp.fechaCreacion;
          const esMuyNueva = fechaRegistro && 
            (new Date() - (fechaRegistro.toDate ? fechaRegistro.toDate() : new Date(fechaRegistro))) < (6 * 30 * 24 * 60 * 60 * 1000);
          return emp.esEmprendimiento || esMuyNueva || (emp.numeroProductos && emp.numeroProductos < 10);
        });
        break;
      case 'pyme':
        empresasFiltradas = empresasFiltradas.filter(emp => {
          const fechaRegistro = emp.fechaRegistro || emp.fechaCreacion;
          const esNueva = fechaRegistro && 
            (new Date() - (fechaRegistro.toDate ? fechaRegistro.toDate() : new Date(fechaRegistro))) < (2 * 365 * 24 * 60 * 60 * 1000);
          return emp.esPyme || esNueva || (emp.numeroProductos && emp.numeroProductos < 50);
        });
        break;
      case 'local':
        empresasFiltradas = empresasFiltradas.filter(emp => 
          emp.esLocal || 
          (emp.region && emp.region.toLowerCase().includes('metropolitana')) ||
          (emp.ciudad && ['santiago', 'providencia', 'las condes', 'vitacura'].includes(emp.ciudad.toLowerCase()))
        );
        break;
      default:
        break;
    }
  }

  if (advancedFilters.verificado) {
    switch (advancedFilters.verificado) {
      case 'verificado':
        empresasFiltradas = empresasFiltradas.filter(emp => emp.verificado);
        break;
      case 'premium':
        empresasFiltradas = empresasFiltradas.filter(emp => emp.esPremium);
        break;
      case 'nuevo':
        empresasFiltradas = empresasFiltradas.filter(emp => emp.esNuevo);
        break;
      default:
        break;
    }
  }

  // Filtros de características especiales
  if (advancedFilters.esLocal) {
    empresasFiltradas = empresasFiltradas.filter(emp => 
      emp.esLocal || 
      (emp.region && emp.region.toLowerCase().includes('metropolitana')) ||
      (emp.ciudad && ['santiago', 'providencia', 'las condes', 'vitacura'].includes(emp.ciudad.toLowerCase()))
    );
  }

  if (advancedFilters.esPyme) {
    empresasFiltradas = empresasFiltradas.filter(emp => {
      const fechaRegistro = emp.fechaRegistro || emp.fechaCreacion;
      const esNueva = fechaRegistro && 
        (new Date() - (fechaRegistro.toDate ? fechaRegistro.toDate() : new Date(fechaRegistro))) < (2 * 365 * 24 * 60 * 60 * 1000);
      return emp.esPyme || esNueva || (emp.numeroProductos && emp.numeroProductos < 50);
    });
  }

  if (advancedFilters.esEmprendimiento) {
    empresasFiltradas = empresasFiltradas.filter(emp => {
      const fechaRegistro = emp.fechaRegistro || emp.fechaCreacion;
      const esMuyNueva = fechaRegistro && 
        (new Date() - (fechaRegistro.toDate ? fechaRegistro.toDate() : new Date(fechaRegistro))) < (6 * 30 * 24 * 60 * 60 * 1000);
      return emp.esEmprendimiento || esMuyNueva || (emp.numeroProductos && emp.numeroProductos < 10);
    });
  }

  if (advancedFilters.esPremium) {
    empresasFiltradas = empresasFiltradas.filter(emp => emp.esPremium);
  }

  if (empresasFiltradas.length === 0)
    return <div className="text-gray-500 mb-6 text-center">No hay empresas para mostrar.</div>;

  const handleViewDetail = (providerId) => {
    // Navegar al perfil del proveedor
    navigate(`/proveedor/${providerId}`);
  };

  const handleViewLocation = (providerId) => {
    // Implementar vista de ubicación del proveedor
    console.log('Ver ubicación del proveedor:', providerId);
  };

  const transformProviderData = (empresa) => {
    return {
      ...empresa,
      rating: empresa.calificacion || 4.2 + Math.random() * 0.8, // Rating simulado
      reviewCount: empresa.numeroReseñas || Math.floor(Math.random() * 50) + 10,
      responseTime: empresa.tiempoRespuesta || '< 2 horas',
      isVerified: empresa.verificado || false,
      isPremium: empresa.esPremium || false,
      isLocal: empresa.esLocal || false,
      isPyme: empresa.esPyme || false,
      isEmprendimiento: empresa.esEmprendimiento || false,
    };
  };

  return (
    <div>
      {/* Filtros Avanzados */}
      <div className="mb-6">
        <AdvancedFilters
          onFiltersChange={setAdvancedFilters}
          showRegionFilter={true}
          showTypeFilter={true}
          showVerificationFilter={true}
        />
      </div>

      <div className="bg-gradient-to-b from-white via-slate-50 to-slate-100 p-6 rounded-xl shadow-inner border border-gray-300 mt-6">
        <div className="text-right text-xs text-gray-500 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3 text-left">🏷️ Tiendas disponibles</h2>
          Mostrando {empresasFiltradas.length} empresa{empresasFiltradas.length !== 1 && "s"}
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {empresasFiltradas.map(empresa => {
            const transformedProvider = transformProviderData(empresa);
            
            return (
              <ProviderCard
                key={empresa.id}
                provider={transformedProvider}
                onViewDetail={handleViewDetail}
                onViewLocation={handleViewLocation}
                showDetailedInfo={true}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}