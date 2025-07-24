import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, deleteDoc, updateDoc, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { crearTodasLasEmpresas, crearSolicitudesEjemplo, crearSolicitudesClientesEjemplo } from "../addInfo";

function getImagePath(value) {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  return `/images/${value}`;
}

function colorEstado(estado) {
  if (!estado) return "bg-gray-200 text-gray-700";
  switch (estado.toLowerCase()) {
    case "activa":
    case "activo":
      return "bg-green-100 text-green-700";
    case "inactiva":
    case "inactivo":
      return "bg-red-200 text-red-800";
    case "suspendida":
    case "suspendido":
      return "bg-orange-200 text-orange-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

const ESTADOS_EMPRESA = [
  { label: "Todos", value: "todos" },
  { label: "Activa", value: "Activa" },
  { label: "Inactiva", value: "inactiva" },
  { label: "Suspendida", value: "suspendida" }
];

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
      const nuevoEstado = empresa.estado === 'activa' ? 'inactiva' : 'activa';
      await updateDoc(doc(db, "empresas", empresa.id), {
        estado: nuevoEstado,
        fecha_actualizacion: new Date()
      });
      alert(`Empresa ${nuevoEstado} exitosamente`);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado');
    }
  };

  const suspenderEmpresa = async (empresa) => {
    if (window.confirm(`¿Estás seguro de suspender a ${empresa.nombre}?`)) {
      try {
        await updateDoc(doc(db, "empresas", empresa.id), {
          estado: 'suspendida',
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

  const crearDatosEjemplo = async () => {
    if (window.confirm('¿Quieres crear 5 empresas de ejemplo para testing? Esto te ayudará a probar la funcionalidad.')) {
      try {
        await crearTodasLasEmpresas();
        alert('✅ Empresas de ejemplo creadas exitosamente');
      } catch (error) {
        console.error('Error creando empresas de ejemplo:', error);
        alert('❌ Error creando empresas de ejemplo');
      }
    }
  };

  const crearSolicitudesDeEjemplo = async () => {
    if (window.confirm('¿Quieres crear solicitudes de empresas y clientes de ejemplo? Esto ayudará a probar el dashboard.')) {
      try {
        await crearSolicitudesEjemplo();
        await crearSolicitudesClientesEjemplo();
        alert('✅ Solicitudes de ejemplo creadas exitosamente');
      } catch (error) {
        console.error('Error creando solicitudes de ejemplo:', error);
        alert('❌ Error creando solicitudes de ejemplo');
      }
    }
  };

  // Filtrar empresas
  const empresasFiltradas = empresas.filter(empresa => {
    const matchEstado = filtros.estado === "todos" || empresa.estado === filtros.estado;
    
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
    activas: empresas.filter(e => e.estado === 'Activa').length,
    inactivas: empresas.filter(e => e.estado === 'Inactiva').length,
    suspendidas: empresas.filter(e => e.estado === 'Suspendida').length,
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
        
        {/* Botón de debug - temporal para desarrollo */}
        <div className="flex items-center gap-2">
          <button
            onClick={crearDatosEjemplo}
            className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200 transition-colors"
            title="Crear empresas de ejemplo para testing"
          >
            🧪 Crear Empresas
          </button>
          <button
            onClick={crearSolicitudesDeEjemplo}
            className="bg-orange-100 text-orange-700 px-3 py-1 rounded text-sm hover:bg-orange-200 transition-colors"
            title="Crear solicitudes de ejemplo para testing"
          >
            📋 Crear Solicitudes
          </button>
          <button
            onClick={() => {
              console.log('🔍 Estado actual:', { empresas, loading });
              console.log('📊 Empresas filtradas:', empresasFiltradas);
            }}
            className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
            title="Ver estado en consola"
          >
            🔍 Debug Log
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
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-800">{estadisticas.total}</div>
          <div className="text-blue-600 text-sm">Total</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-800">{estadisticas.activas}</div>
          <div className="text-green-600 text-sm">Activas</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-800">{estadisticas.inactivas}</div>
          <div className="text-red-600 text-sm">Inactivas</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-800">{estadisticas.suspendidas}</div>
          <div className="text-orange-600 text-sm">Suspendidas</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-800">{estadisticas.sinWeb}</div>
          <div className="text-yellow-600 text-sm">Sin Web</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-800">{estadisticas.sinLogo}</div>
          <div className="text-purple-600 text-sm">Sin Logo</div>
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
              {ESTADOS_EMPRESA.map(est => (
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
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
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

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Web/Perfil</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {empresasFiltradas.map((empresa) => (
                  <tr key={empresa.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {empresa.logo ? (
                        <img
                          src={getImagePath(empresa.logo)}
                          alt="Logo"
                          className="w-12 h-12 object-contain rounded border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                          Sin Logo
                        </div>
                      )}
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
                        <a
                          href={`/empresa/${empresa.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 text-sm underline"
                        >
                          👤 Ver Perfil
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorEstado(empresa.estado)}`}>
                        {empresa.estado || "Sin estado"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/admin/editar-empresa/${empresa.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleEstado(empresa)}
                          className={`text-sm underline ${
                            empresa.estado === 'activa' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {empresa.estado === 'activa' ? 'Desactivar' : 'Activar'}
                        </button>
                        {empresa.estado !== 'suspendida' && (
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
                  {empresa.logo ? (
                    <img
                      src={getImagePath(empresa.logo)}
                      alt="Logo"
                      className="w-16 h-16 object-contain rounded border"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                      Sin Logo
                    </div>
                  )}
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
                  {empresa.web ? (
                    <a
                      href={empresa.web.startsWith("http") ? empresa.web : `https://${empresa.web}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      🌐 Web
                    </a>
                  ) : (
                    <a
                      href={`/empresa/${empresa.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 text-sm underline"
                    >
                      👤 Perfil
                    </a>
                  )}
                  
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
    </section>
  );
}
