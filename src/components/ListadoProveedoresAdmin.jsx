import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from "firebase/firestore";
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
  const [filtros, setFiltros] = useState({
    estado: '',
    busqueda: '',
    tipoVista: 'grid' // 'grid' o 'table'
  });
  const [loading, setLoading] = useState(true);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [mostrandoModal, setMostrandoModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "empresas"), orderBy("fechaRegistro", "desc"));
    const unsub = onSnapshot(q, snap => {
      setProveedores(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const proveedoresFiltrados = proveedores.filter(proveedor => {
    if (filtros.estado && proveedor.estado !== filtros.estado) return false;
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      return (
        proveedor.nombre?.toLowerCase().includes(busqueda) ||
        proveedor.email?.toLowerCase().includes(busqueda) ||
        proveedor.rut?.toLowerCase().includes(busqueda)
      );
    }
    return true;
  });

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Proveedores</h1>
        <p className="text-gray-600">Administra y supervisa todos los proveedores registrados en el sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">🏢</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{proveedores.length}</p>
              <p className="text-gray-600">Total Proveedores</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-green-600">
                {proveedores.filter(p => p.estado === 'activa').length}
              </p>
              <p className="text-gray-600">Activos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-yellow-600">
                {proveedores.filter(p => p.estado === 'pendiente' || p.estado === 'revision').length}
              </p>
              <p className="text-gray-600">En Revisión</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">❌</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-red-600">
                {proveedores.filter(p => p.estado === 'inactiva' || p.estado === 'cancelado').length}
              </p>
              <p className="text-gray-600">Inactivos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y controles */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4">
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
                <option value="revision">En Revisión</option>
                <option value="inactiva">Inactivos</option>
                <option value="suspendido">Suspendidos</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input
                type="text"
                placeholder="Buscar por nombre, email o RUT..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="mb-4">
        <p className="text-gray-600">
          Mostrando {proveedoresFiltrados.length} de {proveedores.length} proveedores
        </p>
      </div>

      {proveedoresFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <span className="text-6xl mb-4 block">🔍</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron proveedores</h3>
          <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <>
          {/* Vista de tarjetas */}
          {filtros.tipoVista === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proveedoresFiltrados.map((proveedor) => (
                <div key={proveedor.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      {proveedor.logo ? (
                        <img
                          src={getImagePath(proveedor.logo)}
                          alt="Logo"
                          className="w-12 h-12 object-contain rounded border bg-gray-50"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-500">🏢</span>
                        </div>
                      )}
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">{proveedor.nombre || 'Sin nombre'}</h3>
                        <p className="text-sm text-gray-600">{proveedor.rut || 'Sin RUT'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorEstado(proveedor.estado)}`}>
                      {proveedor.estado || 'Sin estado'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4">📧</span>
                      <span className="ml-2">{proveedor.email || 'Sin email'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4">🌐</span>
                      <span className="ml-2">
                        {proveedor.web ? (
                          <a
                            href={proveedor.web.startsWith("http") ? proveedor.web : `https://${proveedor.web}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {proveedor.web}
                          </a>
                        ) : (
                          'Sin sitio web'
                        )}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4">📅</span>
                      <span className="ml-2">Registrado: {formatearFecha(proveedor.fechaRegistro)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setProveedorSeleccionado(proveedor);
                        setMostrandoModal(true);
                      }}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Ver Detalles
                    </button>
                    <button
                      onClick={() => navigate(`/admin/editar-empresa/${proveedor.id}`)}
                      className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
                    >
                      Editar
                    </button>
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
                        Proveedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Registro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {proveedoresFiltrados.map((proveedor) => (
                      <tr key={proveedor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {proveedor.logo ? (
                              <img
                                src={getImagePath(proveedor.logo)}
                                alt="Logo"
                                className="w-10 h-10 object-contain rounded border bg-gray-50"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-500">🏢</span>
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {proveedor.nombre || 'Sin nombre'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {proveedor.rut || 'Sin RUT'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{proveedor.email || 'Sin email'}</div>
                          <div className="text-sm text-gray-500">
                            {proveedor.web ? (
                              <a
                                href={proveedor.web.startsWith("http") ? proveedor.web : `https://${proveedor.web}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {proveedor.web}
                              </a>
                            ) : (
                              'Sin sitio web'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorEstado(proveedor.estado)}`}>
                            {proveedor.estado || 'Sin estado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatearFecha(proveedor.fechaRegistro)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setProveedorSeleccionado(proveedor);
                                setMostrandoModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => navigate(`/admin/editar-empresa/${proveedor.id}`)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Editar
                            </button>
                            <select
                              value={proveedor.estado || ''}
                              onChange={(e) => actualizarEstado(proveedor.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="activa">Activo</option>
                              <option value="inactiva">Inactivo</option>
                              <option value="pendiente">Pendiente</option>
                              <option value="revision">En Revisión</option>
                              <option value="suspendido">Suspendido</option>
                            </select>
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