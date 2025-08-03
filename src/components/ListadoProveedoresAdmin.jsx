import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, updateDoc, doc, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Función para obtener ruta de imagen/logo
function getImagePath(value) {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  return `/images/${value}`;
}

function colorEstado(estado) {
  if (!estado) return "bg-gray-100 text-gray-800";
  switch (estado.toLowerCase()) {
    case "enviado":
    case "pendiente":
      return "bg-yellow-100 text-yellow-800";
    case "activo":
    case "activa":
      return "bg-green-100 text-green-800";
    case "revision":
    case "en revisión":
    case "en revision":
      return "bg-orange-100 text-orange-800";
    case "cancelado":
    case "inactivo":
    case "inactiva":
      return "bg-red-100 text-red-800";
    case "suspendido":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function ListadoProveedoresAdmin() {
  const [proveedores, setProveedores] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtros, setFiltros] = useState({
    estado: '',
    busqueda: '',
    tipoVista: 'grid', // 'grid' o 'table'
    mostrar: 'todos' // 'todos', 'empresas', 'solicitudes'
  });
  const [loading, setLoading] = useState(true);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [mostrandoModal, setMostrandoModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 ListadoProveedoresAdmin: Iniciando carga de datos...');
    // Cargar empresas con estado 'activa' o 'validada'
    const qEmpresas = query(
      collection(db, "empresas"),
      where('estado', 'in', ['activa', 'validada']),
      orderBy("fecha_registro", "desc")
    );
    const unsubEmpresas = onSnapshot(qEmpresas, snap => {
      const empresasData = snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        tipo: 'empresa' 
      }));
      console.log('🏢 Empresas cargadas:', empresasData.length, empresasData);
      setProveedores(empresasData);
    }, error => {
      console.error('❌ Error cargando empresas:', error);
      // Intentar consulta sin orderBy si falla
      const qEmpresasSimple = query(
        collection(db, "empresas"),
        where('estado', 'in', ['activa', 'validada'])
      );
      const unsubEmpresasSimple = onSnapshot(qEmpresasSimple, snap => {
        const empresasData = snap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          tipo: 'empresa' 
        }));
        console.log('🏢 Empresas cargadas (sin orden):', empresasData.length, empresasData);
        setProveedores(empresasData);
      });
    });

    // Cargar solicitudes de empresas (incluyendo las de agentes)
    const qSolicitudes = query(collection(db, "solicitudes_empresa"), orderBy("fecha_solicitud", "desc"));
    const unsubSolicitudes = onSnapshot(qSolicitudes, snap => {
      const solicitudesData = snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        tipo: 'solicitud'
      }));
      console.log('📋 Solicitudes cargadas:', solicitudesData.length, solicitudesData);
      setSolicitudes(solicitudesData);
      setLoading(false);
    }, error => {
      console.error('❌ Error cargando solicitudes:', error);
      // Intentar consulta sin orderBy si falla
      const qSolicitudesSimple = collection(db, "solicitudes_empresa");
      const unsubSolicitudesSimple = onSnapshot(qSolicitudesSimple, snap => {
        const solicitudesData = snap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          tipo: 'solicitud'
        }));
        console.log('📋 Solicitudes cargadas (sin orden):', solicitudesData.length, solicitudesData);
        setSolicitudes(solicitudesData);
        setLoading(false);
      });
    });

    return () => {
      unsubEmpresas();
      unsubSolicitudes();
    };
  }, []);

  // Combinar proveedores y solicitudes según el filtro
  const todosLosItems = () => {
    let items = [];
    
    if (filtros.mostrar === 'todos' || filtros.mostrar === 'empresas') {
      // Solo empresas activas o validadas y normalizar tipoEmpresa
      const empresasVisibles = proveedores.filter(p => {
        const estado = (p.estado || '').toLowerCase();
        return estado === 'activa' || estado === 'validada';
      });
      items = [...items, ...empresasVisibles];
    }
    
    if (filtros.mostrar === 'todos' || filtros.mostrar === 'solicitudes') {
      items = [...items, ...solicitudes];
    }
    
    console.log(`📊 Combinando datos: filtro="${filtros.mostrar}", empresas=${proveedores.length}, solicitudes=${solicitudes.length}, total=${items.length}`);
    return items;
  };

  const itemsFiltrados = todosLosItems().filter(item => {
    if (filtros.estado && (item.estado || '').toLowerCase() !== filtros.estado.toLowerCase()) return false;
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      return (
        (item.nombre || '').toLowerCase().includes(busqueda) ||
        (item.nombre_empresa || '').toLowerCase().includes(busqueda) ||
        (item.email || '').toLowerCase().includes(busqueda) ||
        (item.email_empresa || '').toLowerCase().includes(busqueda) ||
        (item.rut || '').toLowerCase().includes(busqueda) ||
        (item.rut_empresa || '').toLowerCase().includes(busqueda) ||
        (item.agente_nombre || '').toLowerCase().includes(busqueda) ||
        (item.tipoEmpresa || '').toLowerCase().includes(busqueda)
      );
    }
    return true;
  });

  console.log(`🔍 Después del filtrado: ${itemsFiltrados.length} items mostrados de ${todosLosItems().length} totales`);
  console.log('📋 Items filtrados:', itemsFiltrados);

  const actualizarEstado = async (proveedorId, nuevoEstado) => {
    try {
      await updateDoc(doc(db, "empresas", proveedorId), {
        estado: nuevoEstado,
        fechaActualizacion: new Date()
      });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const fechaObj = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return fechaObj.toLocaleDateString('es-CL');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando proveedores...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Proveedores y Empresas</h1>
        <p className="text-gray-600">Administra empresas activas y solicitudes de registro (incluyendo las de agentes de campo)</p>
      </div>

      {/* Banner explicativo del nuevo flujo */}
      <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-2xl">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-900 mb-2">
              Vista Unificada: Empresas y Solicitudes
            </h3>
            <div className="text-sm text-green-700 space-y-1">
              <p>• <strong>Empresas Activas</strong>: Proveedores ya registrados y funcionando</p>
              <p>• <strong>Solicitudes</strong>: Nuevas empresas pendientes (web y agentes de campo)</p>
              <p>• <strong>Filtros</strong>: Usa el filtro "Mostrar" para ver solo empresas, solo solicitudes o ambos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-xl">🏢</span>
            </div>
            <div className="ml-3">
              <p className="text-xl font-bold text-gray-900">{proveedores.length}</p>
              <p className="text-gray-600 text-sm">Empresas Activas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-xl">📋</span>
            </div>
            <div className="ml-3">
              <p className="text-xl font-bold text-blue-900">{solicitudes.length}</p>
              <p className="text-blue-600 text-sm">Solicitudes Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-xl">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-xl font-bold text-green-600">
                {proveedores.filter(p => {
                  const estado = (p.estado || '').toLowerCase();
                  return estado === 'activa' || estado === 'validada';
                }).length}
              </p>
              <p className="text-green-600 text-sm">Activas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-xl">⏳</span>
            </div>
            <div className="ml-3">
              <p className="text-xl font-bold text-yellow-600">
                {solicitudes.filter(s => s.estado === 'pendiente' || s.estado === 'en_revision').length}
              </p>
              <p className="text-yellow-600 text-sm">Pendientes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-xl">👨‍💼</span>
            </div>
            <div className="ml-3">
              <p className="text-xl font-bold text-purple-600">
                {solicitudes.filter(s => s.agente_id || s.origen === 'agente_campo').length}
              </p>
              <p className="text-purple-600 text-sm">De Agentes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y controles */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mostrar</label>
              <select
                value={filtros.mostrar}
                onChange={(e) => setFiltros({...filtros, mostrar: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todo (Empresas y Solicitudes)</option>
                <option value="empresas">Solo Empresas Activas</option>
                <option value="solicitudes">Solo Solicitudes</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filtros.estado}
                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="activa">Activos</option>
                <option value="pendiente">Pendientes</option>
                <option value="en_revision">En Revisión</option>
                <option value="activada">Activadas (Visible en Home)</option>
                <option value="credenciales_asignadas">Con Credenciales</option>
                <option value="inactiva">Inactivos</option>
                <option value="rechazada">Rechazadas</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input
                type="text"
                placeholder="Buscar por nombre, email, RUT o agente..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-64"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium text-gray-700">Vista:</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFiltros({...filtros, tipoVista: 'grid'})}
                className={`px-3 py-1 rounded text-sm ${
                  filtros.tipoVista === 'grid' 
                    ? 'bg-white shadow text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📊 Tarjetas
              </button>
              <button
                onClick={() => setFiltros({...filtros, tipoVista: 'table'})}
                className={`px-3 py-1 rounded text-sm ${
                  filtros.tipoVista === 'table' 
                    ? 'bg-white shadow text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📋 Tabla
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-gray-600">
          Mostrando {itemsFiltrados.length} de {todosLosItems().length} elementos 
          ({proveedores.length} empresas activas, {solicitudes.length} solicitudes)
        </p>
        
        {/* Botón de debug */}
        <button
          onClick={async () => {
            console.log('=== DEBUG INFO ===');
            console.log('Proveedores:', proveedores);
            console.log('Solicitudes:', solicitudes);
            console.log('Filtros:', filtros);
            console.log('Items filtrados:', itemsFiltrados);
            console.log('Total items:', todosLosItems());
            
            // Mostrar detalles de la colección empresas en Firestore
            try {
              const snapshot = await getDocs(collection(db, 'empresas'));
              console.log('=== EMPRESAS EN FIRESTORE ===');
              console.log('Total documentos en empresas:', snapshot.size);
              snapshot.docs.forEach(doc => {
                console.log(`Empresa ${doc.id}:`, doc.data());
              });
              
              const snapshotSolicitudes = await getDocs(collection(db, 'solicitudes_empresa'));
              console.log('=== SOLICITUDES EN FIRESTORE ===');
              console.log('Total documentos en solicitudes:', snapshotSolicitudes.size);
              snapshotSolicitudes.docs.forEach(doc => {
                console.log(`Solicitud ${doc.id}:`, doc.data());
              });
            } catch (error) {
              console.error('Error en debug:', error);
            }
          }}
          className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
        >
          🐛 Debug
        </button>
      </div>

      {itemsFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <span className="text-6xl mb-4 block">🔍</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron elementos</h3>
          <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <>
          {/* Vista de tarjetas */}
          {filtros.tipoVista === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itemsFiltrados.map((item) => (
                <div key={`${item.tipo}-${item.id}`} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      {/* Icono según el tipo */}
                      <div className="w-12 h-12 rounded flex items-center justify-center">
                        {item.tipo === 'empresa' ? (
                          item.logo ? (
                            <img
                              src={getImagePath(item.logo)}
                              alt="Logo"
                              className="w-12 h-12 object-contain rounded border bg-gray-50"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center">
                              <span className="text-green-600 text-xl">🏢</span>
                            </div>
                          )
                        ) : (
                          <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                            <span className="text-blue-600 text-xl">📋</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">
                          {item.nombre || item.nombre_empresa || 'Sin nombre'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {item.rut || item.rut_empresa || 'Sin RUT'}
                        </p>
                        {item.tipo === 'solicitud' && (
                          <p className="text-xs text-blue-600 font-medium">
                            {item.agente_nombre ? `Por agente: ${item.agente_nombre}` : 'Solicitud web'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorEstado(item.estado)}`}>
                        {item.estado || 'Sin estado'}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        {item.tipo === 'empresa' ? 'Empresa' : 'Solicitud'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4">📧</span>
                      <span className="ml-2">{item.email || item.email_empresa || 'Sin email'}</span>
                    </div>
                    {item.telefono || item.telefono_empresa ? (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-4">📱</span>
                        <span className="ml-2">{item.telefono || item.telefono_empresa}</span>
                      </div>
                    ) : null}
                    {item.tipo === 'empresa' && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-4">🌐</span>
                        <span className="ml-2">
                          {item.web ? (
                            <a
                              href={item.web.startsWith("http") ? item.web : `https://${item.web}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {item.web}
                            </a>
                          ) : (
                            'Sin sitio web'
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4">📅</span>
                      <span className="ml-2">
                        {item.tipo === 'empresa' ? 
                          `Registrado: ${formatearFecha(item.fecha_registro)}` : 
                          `Solicitado: ${formatearFecha(item.fecha_solicitud)}`
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setProveedorSeleccionado(item);
                        setMostrandoModal(true);
                      }}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Ver Detalles
                    </button>
                    {item.tipo === 'empresa' ? (
                      <button
                        onClick={() => navigate(`/admin/editar-empresa/${item.id}`)}
                        className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
                      >
                        Editar
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/admin/solicitudes-registro`)}
                        className="flex-1 bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
                      >
                        Gestionar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vista de tabla */}
          {filtros.tipoVista === 'table' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo / Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha / Agente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {itemsFiltrados.map((item) => (
                      <tr key={`${item.tipo}-${item.id}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.tipo === 'empresa' ? (
                              item.logo ? (
                                <img
                                  src={getImagePath(item.logo)}
                                  alt="Logo"
                                  className="w-10 h-10 object-contain rounded border bg-gray-50"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center">
                                  <span className="text-green-600">🏢</span>
                                </div>
                              )
                            ) : (
                              <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                                <span className="text-blue-600">📋</span>
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {item.nombre || item.nombre_empresa || 'Sin nombre'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.rut || item.rut_empresa || 'Sin RUT'}
                              </div>
                              <div className="text-xs text-gray-400">
                                {item.tipo === 'empresa' ? 'Empresa Activa' : 'Solicitud'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.email || item.email_empresa || 'Sin email'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.telefono || item.telefono_empresa || 'Sin teléfono'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorEstado(item.estado)}`}>
                            {item.estado || 'Sin estado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            {item.tipo === 'empresa' ? 
                              formatearFecha(item.fecha_registro) : 
                              formatearFecha(item.fecha_solicitud)
                            }
                          </div>
                          {item.agente_nombre && (
                            <div className="text-xs text-purple-600">
                              Agente: {item.agente_nombre}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setProveedorSeleccionado(item);
                                setMostrandoModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Ver
                            </button>
                            {item.tipo === 'empresa' ? (
                              <>
                                <button
                                  onClick={() => navigate(`/admin/editar-empresa/${item.id}`)}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Editar
                                </button>
                                <select
                                  value={item.estado || ''}
                                  onChange={(e) => actualizarEstado(item.id, e.target.value)}
                                  className="text-xs border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="activa">Activo</option>
                                  <option value="inactiva">Inactivo</option>
                                  <option value="suspendida">Suspendido</option>
                                </select>
                              </>
                            ) : (
                              <button
                                onClick={() => navigate(`/admin/solicitudes-registro`)}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                Gestionar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de detalles */}
      {mostrandoModal && proveedorSeleccionado && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalles del Proveedor
                </h3>
                <button
                  onClick={() => setMostrandoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="flex items-center mb-6">
                  {proveedorSeleccionado.logo ? (
                    <img
                      src={getImagePath(proveedorSeleccionado.logo)}
                      alt="Logo"
                      className="w-16 h-16 object-contain rounded border bg-gray-50"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-500 text-2xl">🏢</span>
                    </div>
                  )}
                  <div className="ml-4">
                    <h4 className="text-xl font-semibold">{proveedorSeleccionado.nombre || 'Sin nombre'}</h4>
                    <p className="text-gray-600">{proveedorSeleccionado.rut || 'Sin RUT'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{proveedorSeleccionado.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <p className="text-sm text-gray-900">{proveedorSeleccionado.telefono || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dirección</label>
                    <p className="text-sm text-gray-900">{proveedorSeleccionado.direccion || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorEstado(proveedorSeleccionado.estado)}`}>
                      {proveedorSeleccionado.estado || 'Sin estado'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sitio Web</label>
                    {proveedorSeleccionado.web ? (
                      <a
                        href={proveedorSeleccionado.web.startsWith("http") ? proveedorSeleccionado.web : `https://${proveedorSeleccionado.web}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {proveedorSeleccionado.web}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-900">N/A</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Registro</label>
                    <p className="text-sm text-gray-900">{formatearFecha(proveedorSeleccionado.fechaRegistro)}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    navigate(`/admin/editar-empresa/${proveedorSeleccionado.id}`);
                    setMostrandoModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Editar Proveedor
                </button>
                <button
                  onClick={() => setMostrandoModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}