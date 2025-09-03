import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, deleteDoc, updateDoc, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { ESTADOS_EMPRESA, obtenerDescripcionEstado, puedeTransicionar } from "../utils/empresaStandards";
import { useImageUrl } from '../hooks/useImageUrl';

function getImagePath(value) {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  if (value.startsWith("gs://")) return value; // Firebase Storage URLs will be handled by useImageUrl hook
  return `/images/${value}`;
}

function colorEstado(estado) {
  if (!estado) return "bg-gray-200 text-gray-700";
  
  // Normalizar el estado para comparación
  const estadoNormalizado = estado.toLowerCase();
  
  switch (estadoNormalizado) {
    case "activa":
    case "activo":
      return "bg-green-100 text-green-700";
    case "validada":
      return "bg-blue-100 text-blue-700";
    case "pendiente_validacion":
    case "pendiente de validación":
      return "bg-yellow-100 text-yellow-700";
    case "en_visita":
    case "en visita":
      return "bg-purple-100 text-purple-700";
    case "catalogada":
      return "bg-indigo-100 text-indigo-700";
    case "ingresada":
      return "bg-teal-100 text-teal-700";
    case "inactiva":
    case "inactivo":
      return "bg-red-200 text-red-800";
    case "suspendida":
    case "suspendido":
      return "bg-orange-200 text-orange-800";
    case "rechazada":
      return "bg-red-300 text-red-900";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

const ESTADOS_FILTRO = [
  { label: "Todos", value: "todos" },
  { label: "Catastro Inicial", value: "catastro_inicial" },
  { label: "Catalogada", value: ESTADOS_EMPRESA.CATALOGADA },
  { label: "Ingresada", value: "ingresada" },
  { label: "Pendiente de Validación", value: ESTADOS_EMPRESA.PENDIENTE_VALIDACION },
  { label: "En Visita", value: ESTADOS_EMPRESA.EN_VISITA },
  { label: "Validada", value: ESTADOS_EMPRESA.VALIDADA },
  { label: "Activa", value: ESTADOS_EMPRESA.ACTIVA },
  { label: "Suspendida", value: ESTADOS_EMPRESA.SUSPENDIDA },
  { label: "Inactiva", value: ESTADOS_EMPRESA.INACTIVA },
  { label: "Rechazada", value: ESTADOS_EMPRESA.RECHAZADA }
];

// Componente para mostrar logo con manejo de URLs de Firebase Storage
function LogoImage({ logo, nombre, className = "h-12 w-12 rounded object-cover" }) {
  const { imageUrl, loading, error } = useImageUrl(logo);

  if (!logo) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <span className="text-xs text-gray-500">Sin logo</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <span className="text-xs text-red-500">Error</span>
      </div>
    );
  }

  return (
    <img 
      className={className} 
      src={imageUrl} 
      alt={`Logo de ${nombre}`}
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
      }}
    />
  );
}

export default function GestionEmpresas() {
  const [empresas, setEmpresas] = useState([]);
  const [filtros, setFiltros] = useState({
    estado: "todos",
    busqueda: "",
    categoria: "",
    tieneWeb: "",
    tieneLogoAssignado: ""
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [empresaVistaPrevia, setEmpresaVistaPrevia] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 Iniciando carga de empresas...');
    console.log('🔥 Firebase config:', db);
    
    setLoading(true);
    
    try {
      // Consulta simple sin orderBy para evitar errores de índice
      const q = query(collection(db, "empresas"));
      
      console.log('📡 Configurando listener...');
      const unsub = onSnapshot(q, 
        (snapshot) => {
          console.log('✅ Snapshot recibido');
          console.log('📊 Número de documentos:', snapshot.docs.length);
          console.log('📄 Metadata:', snapshot.metadata);
          
          if (snapshot.empty) {
            console.log('⚠️ La colección está vacía');
          }
          
          const empresasData = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log('� Procesando empresa:', doc.id, data);
            return { 
              id: doc.id, 
              ...data,
              // Asegurar que tenemos campos básicos
              nombre: data.nombre || 'Sin nombre',
              estado: data.estado || 'inactiva',
              categoria: data.categoria || 'Sin categoría'
            };
          });
          
          console.log('✨ Empresas procesadas:', empresasData);
          setEmpresas(empresasData);
          setLoading(false);
        },
        (error) => {
          console.error('❌ Error en snapshot listener:', error);
          console.error('📝 Detalles del error:', error.code, error.message);
          setLoading(false);
          
          // Intentar mostrar un mensaje más específico
          if (error.code === 'permission-denied') {
            console.error('🚫 Sin permisos para leer la colección empresas');
          } else if (error.code === 'unavailable') {
            console.error('🌐 Firebase no disponible - problema de conexión');
          }
        }
      );
      
      return unsub;
    } catch (error) {
      console.error('💥 Error configurando listener:', error);
      setLoading(false);
    }
  }, []);

  const toggleEstado = async (empresa) => {
    try {
      // Determinar el nuevo estado basado en el estado actual
      let nuevoEstado;
      if (empresa.estado === ESTADOS_EMPRESA.ACTIVA) {
        nuevoEstado = ESTADOS_EMPRESA.INACTIVA;
      } else if (empresa.estado === ESTADOS_EMPRESA.INACTIVA) {
        nuevoEstado = ESTADOS_EMPRESA.ACTIVA;
      } else if (empresa.estado === ESTADOS_EMPRESA.VALIDADA) {
        nuevoEstado = ESTADOS_EMPRESA.ACTIVA;
      } else if (empresa.estado === ESTADOS_EMPRESA.CATALOGADA) {
        nuevoEstado = ESTADOS_EMPRESA.PENDIENTE_VALIDACION;
      } else if (empresa.estado === ESTADOS_EMPRESA.INGRESADA) {
        // Para empresas ingresadas, dar opción al admin
        const opcion = window.confirm(
          `Empresa: ${empresa.nombre}\n\n` +
          `Estado actual: Ingresada\n\n` +
          `¿Qué quieres hacer?\n` +
          `• OK = Activar directamente (ir a estado "Activa")\n` +
          `• Cancelar = Asignar a validación (ir a estado "Pendiente de Validación")`
        );
        
        nuevoEstado = opcion ? ESTADOS_EMPRESA.ACTIVA : ESTADOS_EMPRESA.PENDIENTE_VALIDACION;
      } else {
        nuevoEstado = ESTADOS_EMPRESA.ACTIVA;
      }

      await updateDoc(doc(db, "empresas", empresa.id), {
        estado: nuevoEstado,
        fecha_actualizacion: new Date()
      });
      
      const mensaje = nuevoEstado === ESTADOS_EMPRESA.ACTIVA 
        ? `Empresa ${empresa.nombre} activada exitosamente` 
        : `Empresa ${empresa.nombre} asignada a validación exitosamente`;
      
      alert(mensaje);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado');
    }
  };

  const suspenderEmpresa = async (empresa) => {
    if (window.confirm(`¿Estás seguro de suspender a ${empresa.nombre}?`)) {
      try {
        await updateDoc(doc(db, "empresas", empresa.id), {
          estado: ESTADOS_EMPRESA.SUSPENDIDA,
          fecha_suspension: new Date(),
          fecha_actualizacion: new Date()
        });
        alert('Empresa suspendida exitosamente');
      } catch (error) {
        console.error('Error suspendiendo empresa:', error);
        alert('Error al suspender la empresa');
      }
    }
  };

  const eliminarEmpresa = async (empresa) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${empresa.nombre}? Esta acción no se puede deshacer.`)) {
      try {
        await deleteDoc(doc(db, "empresas", empresa.id));
        alert('Empresa eliminada exitosamente');
      } catch (error) {
        console.error('Error eliminando empresa:', error);
        alert('Error al eliminar la empresa');
      }
    }
  };



  // Filtrar empresas
  const empresasFiltradas = empresas.filter(empresa => {
    let matchEstado = filtros.estado === "todos";
    
    if (filtros.estado === "catastro_inicial") {
      // Filtrar por catastro inicial (catalogadas + ingresadas)
      matchEstado = empresa.estado === ESTADOS_EMPRESA.CATALOGADA || empresa.estado === ESTADOS_EMPRESA.INGRESADA;
    } else if (filtros.estado !== "todos") {
      matchEstado = empresa.estado === filtros.estado;
    }
    
    const matchBusqueda = !filtros.busqueda || 
      empresa.nombre?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      empresa.email?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      empresa.direccion?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      empresa.categoria?.toLowerCase().includes(filtros.busqueda.toLowerCase());
    
    const matchCategoria = !filtros.categoria || empresa.categoria === filtros.categoria;
    
    const matchTieneWeb = filtros.tieneWeb === "" || 
      (filtros.tieneWeb === "si" && empresa.web) ||
      (filtros.tieneWeb === "no" && !empresa.web);
    
    const matchTieneLogoAsignado = filtros.tieneLogoAssignado === "" ||
      (filtros.tieneLogoAssignado === "si" && empresa.logoAsignado) ||
      (filtros.tieneLogoAssignado === "no" && !empresa.logoAsignado);

    return matchEstado && matchBusqueda && matchCategoria && matchTieneWeb && matchTieneLogoAsignado;
  });

  const categorias = [...new Set(empresas.map(emp => emp.categoria).filter(Boolean))];
  
  const estadisticas = {
    total: empresas.length,
    // Catastro inicial: incluye tanto catalogadas como ingresadas
    catastroInicial: empresas.filter(e => 
      e.estado === ESTADOS_EMPRESA.CATALOGADA || e.estado === 'ingresada'
    ).length,
    catalogadas: empresas.filter(e => e.estado === ESTADOS_EMPRESA.CATALOGADA).length,
            ingresadas: empresas.filter(e => e.estado === ESTADOS_EMPRESA.INGRESADA).length,
    pendientes: empresas.filter(e => e.estado === ESTADOS_EMPRESA.PENDIENTE_VALIDACION).length,
    enVisita: empresas.filter(e => e.estado === ESTADOS_EMPRESA.EN_VISITA).length,
    validadas: empresas.filter(e => e.estado === ESTADOS_EMPRESA.VALIDADA).length,
    activas: empresas.filter(e => e.estado === ESTADOS_EMPRESA.ACTIVA).length,
    suspendidas: empresas.filter(e => e.estado === ESTADOS_EMPRESA.SUSPENDIDA).length,
    inactivas: empresas.filter(e => e.estado === ESTADOS_EMPRESA.INACTIVA).length,
    rechazadas: empresas.filter(e => e.estado === ESTADOS_EMPRESA.RECHAZADA).length,
    sinWeb: empresas.filter(e => !e.web).length,
    sinLogo: empresas.filter(e => !e.logoAsignado).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando empresas...</p>
          <p className="text-gray-400 text-sm mt-2">Conectando con Firebase...</p>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no hay empresas
  if (!loading && empresas.length === 0) {
    return (
      <section className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Empresas Registradas</h2>
          <p className="text-gray-600">
            Administra empresas y proveedores que ya están registrados en el sistema
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <span className="text-6xl mb-4 block">🏢</span>
          <h3 className="text-lg font-medium text-yellow-900 mb-2">No hay empresas registradas</h3>
          <p className="text-yellow-700 mb-4">
            Parece que aún no se han registrado empresas en el sistema, o hay un problema de conexión con Firebase.
          </p>
          
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-medium text-yellow-900 mb-2">💡 Posibles causas:</h4>
            <ul className="text-yellow-800 text-sm space-y-1">
              <li>• La colección "empresas" está vacía en Firebase</li>
              <li>• Problemas de permisos de lectura en Firebase</li>
              <li>• Problemas de conexión a internet</li>
              <li>• Las empresas están en una colección diferente</li>
            </ul>
          </div>
          
          <div className="space-x-4">
            <button
              onClick={() => navigate("/admin/solicitudes-registro")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              📋 Ver Solicitudes
            </button>
            <button
              onClick={() => navigate("/admin/proveedores")}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              🏪 Vista Unificada
            </button>
            <button
              onClick={crearDatosEjemplo}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              🏗️ Crear Empresas
            </button>
            <button
              onClick={crearSolicitudesDeEjemplo}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              📋 Crear Solicitudes
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔄 Recargar Página
            </button>
          </div>
          
          <div className="mt-6 text-xs text-yellow-600">
            💡 Tip: Revisa la consola del navegador (F12) para más detalles del error
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Empresas Registradas</h2>
          <p className="text-gray-600">
            Administra empresas y proveedores que ya están registrados en el sistema
          </p>
        </div>
        
        {/* Botón Crear Empresa Pública */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/admin/crear-empresa-publica")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            ➕ Crear Empresa Pública
          </button>
        </div>
      </div>

      {/* Banner informativo sobre solicitudes */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-900">
                ¿Buscas solicitudes de agentes y nuevas empresas?
              </h3>
              <p className="text-sm text-blue-700">
                Gestiona solicitudes pendientes, incluyendo las enviadas por agentes de campo
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate("/admin/solicitudes-registro")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              📋 Ver Solicitudes
            </button>
            <button
              onClick={() => navigate("/admin/proveedores")}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              🏪 Vista Unificada
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-800">{estadisticas.total}</div>
          <div className="text-blue-600 text-sm">Total</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{estadisticas.catastroInicial}</div>
          <div className="text-gray-600 text-sm">Catastro Inicial</div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-indigo-800">{estadisticas.catalogadas}</div>
          <div className="text-indigo-600 text-sm">Catalogadas</div>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-teal-800">{estadisticas.ingresadas}</div>
          <div className="text-teal-600 text-sm">Ingresadas</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-800">{estadisticas.pendientes}</div>
          <div className="text-yellow-600 text-sm">Pendientes</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-800">{estadisticas.enVisita}</div>
          <div className="text-purple-600 text-sm">En Visita</div>
        </div>
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-900">{estadisticas.validadas}</div>
          <div className="text-blue-700 text-sm">Validadas</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-800">{estadisticas.activas}</div>
          <div className="text-green-600 text-sm">Activas</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-800">{estadisticas.suspendidas}</div>
          <div className="text-orange-600 text-sm">Suspendidas</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ESTADOS_FILTRO.map(est => (
                <option key={est.value} value={est.value}>{est.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <select
              value={filtros.categoria}
              onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiene Web</label>
            <select
              value={filtros.tieneWeb}
              onChange={(e) => setFiltros({...filtros, tieneWeb: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="si">Con Web</option>
              <option value="no">Sin Web</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiene Logo</label>
            <select
              value={filtros.tieneLogoAssignado}
              onChange={(e) => setFiltros({...filtros, tieneLogoAssignado: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="si">Con Logo</option>
              <option value="no">Sin Logo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <input
              type="text"
              placeholder="Nombre, email, dirección..."
              value={filtros.busqueda}
              onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFiltros({ estado: "todos", busqueda: "", categoria: "", tieneWeb: "", tieneLogoAssignado: "" })}
              className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">
              Empresas ({empresasFiltradas.length})
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
              >
                📋 Tabla
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
              >
                📱 Tarjetas
              </button>
            </div>
          </div>
          
          {/* Información sobre el botón de perfil del proveedor */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-green-600">💡</span>
              <p className="text-sm text-green-800">
                <strong>Acceso rápido al perfil del proveedor:</strong> Usa el botón verde "👤 Ver Perfil Proveedor" 
                para ver exactamente lo que ven los clientes y detectar problemas caso por caso.
              </p>
            </div>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sitio Web</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {empresasFiltradas.map((empresa) => (
                  <tr key={empresa.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <LogoImage 
                        logo={empresa.logo_url || empresa.logo} 
                        nombre={empresa.nombre} 
                        className="w-12 h-12 object-contain rounded border"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{empresa.nombre}</div>
                        <div className="text-sm text-gray-500">{empresa.categoria}</div>
                        <div className="text-sm text-gray-500">{empresa.direccion}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div>{empresa.email}</div>
                        <div className="text-gray-500">{empresa.telefono}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {empresa.web ? (
                        <a
                          href={empresa.web.startsWith("http") ? empresa.web : `https://${empresa.web}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          🌐 Sitio Web
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          Sin sitio web
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorEstado(empresa.estado)}`}>
                        {empresa.estado || "Sin estado"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {/* Botón principal para ver dashboard interno del proveedor */}
                        <button
                          onClick={() => window.open(`/perfil-proveedor/${empresa.id}`, '_blank')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                          title="Ver dashboard interno del proveedor (como lo ve el proveedor)"
                        >
                          👤 Ver Dashboard Proveedor
                        </button>
                        
                        <button
                          onClick={() => setEmpresaVistaPrevia(empresa)}
                          className="text-purple-600 hover:text-purple-800 text-sm underline"
                        >
                          👁️ Vista Previa
                        </button>
                        <button
                          onClick={() => navigate(`/admin/editar-empresa/${empresa.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleEstado(empresa)}
                          className={`text-sm underline ${
                            empresa.estado === ESTADOS_EMPRESA.ACTIVA ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {empresa.estado === ESTADOS_EMPRESA.ACTIVA ? 'Desactivar' : 'Activar'}
                        </button>
                        {empresa.estado !== ESTADOS_EMPRESA.SUSPENDIDA && (
                          <button
                            onClick={() => suspenderEmpresa(empresa)}
                            className="text-orange-600 hover:text-orange-800 text-sm underline"
                          >
                            Suspender
                          </button>
                        )}
                        <button
                          onClick={() => eliminarEmpresa(empresa)}
                          className="text-red-600 hover:text-red-800 text-sm underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Vista de tarjetas
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {empresasFiltradas.map((empresa) => (
              <div key={empresa.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-3">
                  <LogoImage 
                    logo={empresa.logo_url || empresa.logo} 
                    nombre={empresa.nombre} 
                    className="w-16 h-16 object-contain rounded border"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{empresa.nombre}</h3>
                    <p className="text-sm text-gray-500">{empresa.categoria}</p>
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-1 ${colorEstado(empresa.estado)}`}>
                      {empresa.estado || "Sin estado"}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p>📧 {empresa.email}</p>
                  <p>📞 {empresa.telefono}</p>
                  <p>📍 {empresa.direccion}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {/* Botón principal para ver dashboard interno del proveedor */}
                    <button
                      onClick={() => window.open(`/perfil-empresa/${empresa.id}`, '_blank')}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      title="Ver dashboard interno del proveedor (como lo ve el proveedor)"
                    >
                      👤 Ver Dashboard Proveedor
                    </button>
                    
                    <button
                      onClick={() => setEmpresaVistaPrevia(empresa)}
                      className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                    >
                      👁️ Vista Previa
                    </button>
                    {empresa.web ? (
                      <a
                        href={empresa.web.startsWith("http") ? empresa.web : `https://${empresa.web}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        🌐 Web
                      </a>
                    ) : (
                      <a
                        href={`/empresa/${empresa.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        👤 Perfil
                      </a>
                    )}
                  </div>
                  
                  <button
                    onClick={() => navigate(`/admin/editar-empresa/${empresa.id}`)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {empresasFiltradas.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay empresas que coincidan con los filtros</p>
          </div>
        )}
      </div>

      {/* Modal de Vista Previa */}
      {empresaVistaPrevia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Vista Previa: {empresaVistaPrevia.nombre}
                </h2>
                <button
                  onClick={() => setEmpresaVistaPrevia(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Básica */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <LogoImage 
                      logo={empresaVistaPrevia.logo_url || empresaVistaPrevia.logo} 
                      nombre={empresaVistaPrevia.nombre} 
                      className="w-24 h-24 object-contain rounded border"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{empresaVistaPrevia.nombre}</h3>
                      <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${colorEstado(empresaVistaPrevia.estado)}`}>
                        {empresaVistaPrevia.estado || "Sin estado"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div><strong>Categoría:</strong> {empresaVistaPrevia.categoria || 'No especificada'}</div>
                    <div><strong>Dirección:</strong> {empresaVistaPrevia.direccion || 'No especificada'}</div>
                    <div><strong>Teléfono:</strong> {empresaVistaPrevia.telefono || 'No especificado'}</div>
                    <div><strong>Email:</strong> {empresaVistaPrevia.email || 'No especificado'}</div>
                    {empresaVistaPrevia.web && (
                      <div>
                        <strong>Sitio Web:</strong> 
                        <a 
                          href={empresaVistaPrevia.web.startsWith("http") ? empresaVistaPrevia.web : `https://${empresaVistaPrevia.web}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 ml-2 underline"
                        >
                          {empresaVistaPrevia.web}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información Adicional */}
                <div className="space-y-4">
                  {empresaVistaPrevia.descripcion && (
                    <div>
                      <strong>Descripción:</strong>
                      <p className="mt-1 text-gray-700">{empresaVistaPrevia.descripcion}</p>
                    </div>
                  )}
                  
                  {empresaVistaPrevia.horarios && (
                    <div>
                      <strong>Horarios:</strong>
                      <p className="mt-1 text-gray-700">
                        {typeof empresaVistaPrevia.horarios === 'string' 
                          ? empresaVistaPrevia.horarios 
                          : empresaVistaPrevia.horarios?.general || 'No especificados'}
                      </p>
                    </div>
                  )}
                  
                  {empresaVistaPrevia.marcas && empresaVistaPrevia.marcas.length > 0 && (
                    <div>
                      <strong>Marcas:</strong>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {empresaVistaPrevia.marcas.map((marca, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {marca}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setEmpresaVistaPrevia(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cerrar
                </button>
                
                {/* Botón para ver perfil público (como lo ven los clientes) */}
                <a
                  href={`/empresa/${empresaVistaPrevia.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  👤 Ver Perfil Público
                </a>
                
                {/* Botón para ver dashboard interno del proveedor */}
                <a
                  href={`/perfil-proveedor/${empresaVistaPrevia.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  🏢 Ver Dashboard Interno
                </a>
                
                {/* Botón para sitio web (solo si existe) */}
                {empresaVistaPrevia.web && (
                  <a
                    href={empresaVistaPrevia.web.startsWith("http") ? empresaVistaPrevia.web : `https://${empresaVistaPrevia.web}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    🌐 Página Web
                  </a>
                )}
                
                <button
                  onClick={() => {
                    setEmpresaVistaPrevia(null);
                    navigate(`/admin/editar-empresa/${empresaVistaPrevia.id}`);
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  ✏️ Editar Empresa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
