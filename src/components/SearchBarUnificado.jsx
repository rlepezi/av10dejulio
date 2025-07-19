import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { SearchIcon, FilterIcon, XIcon } from '@heroicons/react/outline';

const SearchBarUnificado = ({ 
  onResultsChange,
  placeholder = "Buscar empresas, productos, campañas...",
  showFilters = true
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filtros, setFiltros] = useState({
    tipo: 'todos', // todos, empresas, productos, campañas
    tipoEmpresa: 'todos', // todos, proveedor, pyme, emprendimiento, taller, distribuidor
    categoria: '',
    marca: '',
    region: '',
    verificado: 'todos' // todos, verificado, premium
  });

  // Estados para datos
  const [empresas, setEmpresas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [campañas, setCampañas] = useState([]);
  const [solicitudesAprobadas, setSolicitudesAprobadas] = useState([]);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);

  // Cargar empresas legacy
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "empresas"), (snapshot) => {
      const empresasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        tipo: 'empresa',
        origen: 'legacy'
      }));
      setEmpresas(empresasData);
    });
    return () => unsubscribe();
  }, []);

  // Cargar productos
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "productos"), (snapshot) => {
      const productosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        tipo: 'producto'
      }));
      setProductos(productosData);
    });
    return () => unsubscribe();
  }, []);

  // Cargar campañas
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "campañas"), (snapshot) => {
      const campañasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        tipo: 'campaña'
      }));
      setCampañas(campañasData);
    });
    return () => unsubscribe();
  }, []);

  // Cargar solicitudes aprobadas
  useEffect(() => {
    const qProveedores = query(
      collection(db, "solicitudes_proveedor"),
      where("estado", "==", "aprobada")
    );
    
    const qEmpresas = query(
      collection(db, "solicitudes_empresa"),
      where("estado", "==", "aprobada")
    );

    const unsubProveedores = onSnapshot(qProveedores, (snapshot) => {
      const proveedoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        tipo: 'empresa',
        origen: 'nuevo',
        tipoEmpresa: 'proveedor'
      }));
      setSolicitudesAprobadas(prev => [
        ...prev.filter(s => s.origen !== 'nuevo' || s.tipoEmpresa !== 'proveedor'),
        ...proveedoresData
      ]);
    });

    const unsubEmpresas = onSnapshot(qEmpresas, (snapshot) => {
      const empresasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        tipo: 'empresa',
        origen: 'nuevo'
      }));
      setSolicitudesAprobadas(prev => [
        ...prev.filter(s => s.origen !== 'nuevo' || s.tipoEmpresa === 'proveedor'),
        ...empresasData
      ]);
    });

    return () => {
      unsubProveedores();
      unsubEmpresas();
    };
  }, []);

  // Extraer categorías y marcas disponibles
  useEffect(() => {
    const todasCategorias = new Set();
    const todasMarcas = new Set();

    // De empresas legacy
    empresas.forEach(empresa => {
      if (empresa.categorias) {
        empresa.categorias.forEach(cat => todasCategorias.add(cat));
      }
      if (empresa.marcas) {
        empresa.marcas.forEach(marca => todasMarcas.add(marca));
      }
    });

    // De productos
    productos.forEach(producto => {
      if (producto.categoria) todasCategorias.add(producto.categoria);
      if (producto.marca) todasMarcas.add(producto.marca);
    });

    // De solicitudes aprobadas
    solicitudesAprobadas.forEach(solicitud => {
      if (solicitud.sectorAutomotriz) todasCategorias.add(solicitud.sectorAutomotriz);
      if (solicitud.marcasQueManeja) {
        solicitud.marcasQueManeja.forEach(marca => todasMarcas.add(marca));
      }
    });

    setCategoriasDisponibles(Array.from(todasCategorias).sort());
    setMarcasDisponibles(Array.from(todasMarcas).sort());
  }, [empresas, productos, solicitudesAprobadas]);

  // Realizar búsqueda unificada
  useEffect(() => {
    const resultados = realizarBusquedaUnificada();
    onResultsChange && onResultsChange(resultados);
  }, [busqueda, filtros, empresas, productos, campañas, solicitudesAprobadas]);

  const realizarBusquedaUnificada = () => {
    let resultados = [];

    // Formatear empresas legacy
    const empresasFormateadas = empresas
      .filter(emp => emp.estado === "Activa")
      .map(emp => formatearEmpresa(emp, 'legacy'));

    // Formatear solicitudes aprobadas
    const solicitudesFormateadas = solicitudesAprobadas
      .map(sol => formatearEmpresa(sol, 'nuevo'));

    // Combinar todas las empresas
    const todasEmpresas = [...empresasFormateadas, ...solicitudesFormateadas];

    // Agregar según filtros de tipo
    if (filtros.tipo === 'todos' || filtros.tipo === 'empresas') {
      resultados.push(...todasEmpresas);
    }

    if (filtros.tipo === 'todos' || filtros.tipo === 'productos') {
      resultados.push(...productos.map(formatearProducto));
    }

    if (filtros.tipo === 'todos' || filtros.tipo === 'campañas') {
      resultados.push(...campañas.map(formatearCampaña));
    }

    // Aplicar filtros
    resultados = aplicarFiltros(resultados);

    return resultados;
  };

  const formatearEmpresa = (empresa, origen) => ({
    id: `empresa-${origen}-${empresa.id}`,
    tipo: 'empresa',
    titulo: empresa.nombre || empresa.nombreEmpresa,
    subtitulo: empresa.descripcion || empresa.giroComercial,
    descripcion: `${empresa.direccion || ''}, ${empresa.comuna || ''}`.trim().replace(/^,/, ''),
    imagen: empresa.imagen || empresa.logo,
    tipoEmpresa: empresa.tipoEmpresa || determinarTipoEmpresa(empresa),
    verificado: empresa.verificado || (origen === 'nuevo'),
    premium: empresa.esPremium || false,
    categorias: empresa.categorias || [empresa.sectorAutomotriz].filter(Boolean),
    marcas: empresa.marcas || empresa.marcasQueManeja || [],
    region: empresa.region,
    comuna: empresa.comuna,
    telefono: empresa.telefono,
    email: empresa.email,
    sitioWeb: empresa.sitioWeb,
    origen,
    fechaRegistro: empresa.fechaRegistro || empresa.fechaSolicitud,
    rating: empresa.rating || 0,
    url: `/empresa/${empresa.id}`,
    searchText: `${empresa.nombre || empresa.nombreEmpresa} ${empresa.descripcion || empresa.giroComercial} ${empresa.direccion || ''} ${(empresa.categorias || []).join(' ')} ${(empresa.marcas || []).join(' ')}`
  });

  const formatearProducto = (producto) => ({
    id: `producto-${producto.id}`,
    tipo: 'producto',
    titulo: producto.nombre,
    subtitulo: producto.marca,
    descripcion: producto.descripcion,
    imagen: producto.imagen,
    precio: producto.precio,
    categoria: producto.categoria,
    marca: producto.marca,
    empresa: producto.empresa,
    disponible: producto.disponible,
    url: `/producto/${producto.id}`,
    searchText: `${producto.nombre} ${producto.marca} ${producto.descripcion} ${producto.categoria} ${producto.empresa}`
  });

  const formatearCampaña = (campaña) => ({
    id: `campaña-${campaña.id}`,
    tipo: 'campaña',
    titulo: campaña.titulo,
    subtitulo: campaña.empresa,
    descripcion: campaña.descripcion,
    imagen: campaña.imagen,
    descuento: campaña.descuento,
    fechaInicio: campaña.fechaInicio,
    fechaFin: campaña.fechaFin,
    empresa: campaña.empresa,
    activa: new Date() >= new Date(campaña.fechaInicio) && new Date() <= new Date(campaña.fechaFin),
    url: `/campaña/${campaña.id}`,
    searchText: `${campaña.titulo} ${campaña.descripcion} ${campaña.empresa}`
  });

  const determinarTipoEmpresa = (empresa) => {
    if (empresa.esPyme) return 'pyme';
    if (empresa.esEmprendimiento) return 'emprendimiento';
    if (empresa.esTaller) return 'taller';
    if (empresa.esDistribuidor) return 'distribuidor';
    return 'proveedor';
  };

  const aplicarFiltros = (items) => {
    let filtrados = [...items];

    // Filtro por búsqueda de texto
    if (busqueda.trim()) {
      const terminos = busqueda.toLowerCase().trim().split(' ');
      filtrados = filtrados.filter(item =>
        terminos.every(termino =>
          item.searchText.toLowerCase().includes(termino)
        )
      );
    }

    // Filtro por tipo de empresa
    if (filtros.tipoEmpresa !== 'todos') {
      filtrados = filtrados.filter(item =>
        item.tipo !== 'empresa' || item.tipoEmpresa === filtros.tipoEmpresa
      );
    }

    // Filtro por categoría
    if (filtros.categoria) {
      filtrados = filtrados.filter(item => {
        if (item.tipo === 'empresa') {
          return item.categorias && item.categorias.includes(filtros.categoria);
        }
        if (item.tipo === 'producto') {
          return item.categoria === filtros.categoria;
        }
        return true;
      });
    }

    // Filtro por marca
    if (filtros.marca) {
      filtrados = filtrados.filter(item => {
        if (item.tipo === 'empresa') {
          return item.marcas && item.marcas.includes(filtros.marca);
        }
        if (item.tipo === 'producto') {
          return item.marca === filtros.marca;
        }
        return true;
      });
    }

    // Filtro por región
    if (filtros.region) {
      filtrados = filtrados.filter(item =>
        item.tipo !== 'empresa' || item.region === filtros.region
      );
    }

    // Filtro por verificación
    if (filtros.verificado !== 'todos') {
      filtrados = filtrados.filter(item => {
        if (item.tipo !== 'empresa') return true;
        if (filtros.verificado === 'verificado') return item.verificado;
        if (filtros.verificado === 'premium') return item.premium;
        return true;
      });
    }

    return filtrados;
  };

  const handleInputChange = (e) => {
    setBusqueda(e.target.value);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const clearAllFilters = () => {
    setBusqueda('');
    setFiltros({
      tipo: 'todos',
      tipoEmpresa: 'todos',
      categoria: '',
      marca: '',
      region: '',
      verificado: 'todos'
    });
    setShowAdvancedFilters(false);
  };

  const activeFiltersCount = [
    busqueda,
    filtros.tipo !== 'todos' ? filtros.tipo : null,
    filtros.tipoEmpresa !== 'todos' ? filtros.tipoEmpresa : null,
    filtros.categoria,
    filtros.marca,
    filtros.region,
    filtros.verificado !== 'todos' ? filtros.verificado : null
  ].filter(Boolean).length;

  const sugerenciasRapidas = [
    { label: 'Frenos', tipo: 'categoria' },
    { label: 'Toyota', tipo: 'marca' },
    { label: 'Aceite', tipo: 'categoria' },
    { label: 'Baterías', tipo: 'categoria' },
    { label: 'Talleres', tipo: 'tipoEmpresa', valor: 'taller' },
    { label: 'PyMEs', tipo: 'tipoEmpresa', valor: 'pyme' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
      {/* Barra de búsqueda principal */}
      <div className="relative">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full pl-12 pr-24 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Limpiar filtros"
              >
                <XIcon className="h-5 w-5" />
              </button>
            )}
            {showFilters && (
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`relative p-2 rounded-lg transition-colors ${
                  showAdvancedFilters || activeFiltersCount > 0
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Filtros avanzados"
              >
                <FilterIcon className="h-5 w-5" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Sugerencias rápidas */}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500">Búsquedas populares:</span>
          {sugerenciasRapidas.map((sugerencia, index) => (
            <button
              key={index}
              onClick={() => {
                if (sugerencia.tipo === 'categoria') {
                  setBusqueda(sugerencia.label);
                } else if (sugerencia.tipo === 'marca') {
                  setBusqueda(sugerencia.label);
                } else if (sugerencia.tipo === 'tipoEmpresa') {
                  handleFiltroChange('tipoEmpresa', sugerencia.valor);
                }
              }}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
            >
              {sugerencia.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros avanzados */}
      {showAdvancedFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Filtro por tipo de contenido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de contenido
              </label>
              <select
                value={filtros.tipo}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todo</option>
                <option value="empresas">Empresas</option>
                <option value="productos">Productos</option>
                <option value="campañas">Campañas</option>
              </select>
            </div>

            {/* Filtro por tipo de empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de empresa
              </label>
              <select
                value={filtros.tipoEmpresa}
                onChange={(e) => handleFiltroChange('tipoEmpresa', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todas</option>
                <option value="proveedor">Proveedores</option>
                <option value="pyme">PyMEs</option>
                <option value="emprendimiento">Emprendimientos</option>
                <option value="taller">Talleres</option>
                <option value="distribuidor">Distribuidores</option>
              </select>
            </div>

            {/* Filtro por categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={filtros.categoria}
                onChange={(e) => handleFiltroChange('categoria', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las categorías</option>
                {categoriasDisponibles.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por marca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marca
              </label>
              <select
                value={filtros.marca}
                onChange={(e) => handleFiltroChange('marca', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las marcas</option>
                {marcasDisponibles.map((marca) => (
                  <option key={marca} value={marca}>
                    {marca}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por verificación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verificación
              </label>
              <select
                value={filtros.verificado}
                onChange={(e) => handleFiltroChange('verificado', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todas</option>
                <option value="verificado">Solo verificadas</option>
                <option value="premium">Solo premium</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBarUnificado;
