import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, deleteDoc, updateDoc, query, orderBy } from "firebase/firestore";
import EmpresaMap from "./EmpresaMap";
import CrearEmpresaPublica from "./CrearEmpresaPublica";

function AdminStoreList() {
  const [empresas, setEmpresas] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    categoria: ''
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'table'
  const [mostrarCrearEmpresa, setMostrarCrearEmpresa] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "empresas"), orderBy('nombre'));
    const unsub = onSnapshot(q, snapshot => {
      setEmpresas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const startEdit = (emp) => {
    setEditId(emp.id);
    setEditData(emp);
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleLocationChange = ({ lat, lng }) => {
    setEditData({ ...editData, lat, lng });
  };

  const saveEdit = async () => {
    try {
      const {id, ...rest} = editData;
      await updateDoc(doc(db, "empresas", editId), {
        ...rest,
        fecha_actualizacion: new Date()
      });
      setEditId(null);
      alert('Empresa actualizada exitosamente');
    } catch (error) {
      console.error('Error actualizando empresa:', error);
      alert('Error al actualizar la empresa');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar esta empresa?")) {
      try {
        await deleteDoc(doc(db, "empresas", id));
        alert('Empresa eliminada exitosamente');
      } catch (error) {
        console.error('Error eliminando empresa:', error);
        alert('Error al eliminar la empresa');
      }
    }
  };

  const toggleEstado = async (empresa) => {
    try {
      const nuevoEstado = empresa.estado === 'Activa' ? 'Inactiva' : 'Activa';
      await updateDoc(doc(db, "empresas", empresa.id), {
        estado: nuevoEstado,
        fecha_actualizacion: new Date()
      });
      alert(`Empresa ${nuevoEstado.toLowerCase()} exitosamente`);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado');
    }
  };

  // Filtrar empresas
  const empresasFiltradas = empresas.filter(empresa => {
    const matchBusqueda = !filtros.busqueda || 
      empresa.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      empresa.direccion?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      empresa.categoria?.toLowerCase().includes(filtros.busqueda.toLowerCase());
    
    const matchEstado = !filtros.estado || empresa.estado === filtros.estado;
    const matchCategoria = !filtros.categoria || empresa.categoria === filtros.categoria;

    return matchBusqueda && matchEstado && matchCategoria;
  });

  const categorias = [...new Set(empresas.map(emp => emp.categoria).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Empresas</h2>
        <p className="text-gray-600">Administra y supervisa todas las empresas registradas en el sistema</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-800">{empresas.length}</div>
          <div className="text-blue-600 text-sm">Total Empresas</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-800">
            {empresas.filter(e => e.estado === 'Activa').length}
          </div>
          <div className="text-green-600 text-sm">Empresas Activas</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-800">
            {empresas.filter(e => e.estado === 'Inactiva').length}
          </div>
          <div className="text-red-600 text-sm">Empresas Inactivas</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-800">{categorias.length}</div>
          <div className="text-purple-600 text-sm">Categorías</div>
        </div>
      </div>

      {/* Filtros y controles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Buscar por nombre, dirección o categoría..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="Activa">Activa</option>
              <option value="Inactiva">Inactiva</option>
            </select>
            <select
              value={filtros.categoria}
              onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            >
              📱 Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            >
              📋 Tabla
            </button>
          </div>
        </div>
      </div>

      {/* Botón para crear empresa pública */}
      <div className="mb-6">
        <button
          onClick={() => setMostrarCrearEmpresa(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          ➕ Crear Empresa Pública
        </button>
      </div>

      {/* Resultados */}
      <div className="mb-4">
        <p className="text-gray-600">
          Mostrando {empresasFiltradas.length} de {empresas.length} empresas
        </p>
      </div>

      {/* Vista Grid */}
      {viewMode === 'grid' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empresasFiltradas.map(emp => (
            <div key={emp.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {editId === emp.id ? (
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Editando: {emp.nombre}</h3>
                  <div className="space-y-3">
                    <input 
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      name="nombre" 
                      placeholder="Nombre de la empresa"
                      value={editData.nombre || ""} 
                      onChange={handleEditChange} 
                    />
                    <input 
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      name="direccion" 
                      placeholder="Dirección"
                      value={editData.direccion || ""} 
                      onChange={handleEditChange} 
                    />
                    <input 
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      name="categoria" 
                      placeholder="Categoría"
                      value={editData.categoria || ""} 
                      onChange={handleEditChange} 
                    />
                    <input 
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      name="telefono" 
                      placeholder="Teléfono"
                      value={editData.telefono || ""} 
                      onChange={handleEditChange} 
                    />
                    <input 
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      name="email" 
                      placeholder="Email"
                      value={editData.email || ""} 
                      onChange={handleEditChange} 
                    />
                    <input 
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      name="web" 
                      placeholder="Sitio web"
                      value={editData.web || ""} 
                      onChange={handleEditChange} 
                    />
                    <select 
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      name="estado" 
                      value={editData.estado || ""} 
                      onChange={handleEditChange}
                    >
                      <option value="">Seleccionar estado</option>
                      <option value="Activa">Activa</option>
                      <option value="Inactiva">Inactiva</option>
                    </select>
                  </div>
                  {(editData.lat && editData.lng) && (
                    <div className="mt-4">
                      <EmpresaMap lat={editData.lat} lng={editData.lng} onLocationChange={handleLocationChange} />
                    </div>
                  )}
                  <div className="mt-6 flex gap-3">
                    <button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors" 
                      onClick={saveEdit}
                    >
                      💾 Guardar
                    </button>
                    <button 
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors" 
                      onClick={() => setEditId(null)}
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-900">{emp.nombre}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        emp.estado === 'Activa' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {emp.estado || 'Sin estado'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <span>📍</span> {emp.direccion || 'Sin dirección'}
                      </p>
                      <p className="flex items-center gap-2">
                        <span>🏷️</span> {emp.categoria || 'Sin categoría'}
                      </p>
                      <p className="flex items-center gap-2">
                        <span>📞</span> {emp.telefono || 'Sin teléfono'}
                      </p>
                      {emp.email && (
                        <p className="flex items-center gap-2">
                          <span>📧</span> {emp.email}
                        </p>
                      )}
                      {emp.web && (
                        <p className="flex items-center gap-2">
                          <span>🌐</span> 
                          <a href={emp.web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {emp.web}
                          </a>
                        </p>
                      )}
                    </div>

                    {emp.lat && emp.lng && (
                      <div className="mt-4">
                        <EmpresaMap lat={emp.lat} lng={emp.lng} />
                      </div>
                    )}
                  </div>
                  
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-2">
                    <button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors" 
                      onClick={() => startEdit(emp)}
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                        emp.estado === 'Activa'
                          ? 'bg-red-100 hover:bg-red-200 text-red-700'
                          : 'bg-green-100 hover:bg-green-200 text-green-700'
                      }`} 
                      onClick={() => toggleEstado(emp)}
                    >
                      {emp.estado === 'Activa' ? '⏸️ Desactivar' : '▶️ Activar'}
                    </button>
                    <button 
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors" 
                      onClick={() => handleDelete(emp.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Vista Tabla */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {empresasFiltradas.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{emp.nombre}</div>
                        <div className="text-sm text-gray-500">{emp.direccion}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {emp.categoria || 'Sin categoría'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{emp.telefono}</div>
                      <div className="text-sm text-gray-500">{emp.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        emp.estado === 'Activa' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {emp.estado || 'Sin estado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-900" 
                        onClick={() => startEdit(emp)}
                      >
                        Editar
                      </button>
                      <button 
                        className={emp.estado === 'Activa' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} 
                        onClick={() => toggleEstado(emp)}
                      >
                        {emp.estado === 'Activa' ? 'Desactivar' : 'Activar'}
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900" 
                        onClick={() => handleDelete(emp.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {empresasFiltradas.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400">
            <div className="text-4xl mb-4">🏪</div>
            <div className="text-lg font-medium mb-2">No se encontraron empresas</div>
            <div className="text-sm">
              {filtros.busqueda || filtros.estado || filtros.categoria
                ? "No hay empresas que coincidan con los filtros aplicados"
                : "Aún no hay empresas registradas en el sistema"
              }
            </div>
            {(filtros.busqueda || filtros.estado || filtros.categoria) && (
              <button
                onClick={() => setFiltros({ busqueda: '', estado: '', categoria: '' })}
                className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal Crear Empresa Pública */}
      {mostrarCrearEmpresa && (
        <CrearEmpresaPublica 
          onClose={() => setMostrarCrearEmpresa(false)} 
          onSuccess={() => {
            setMostrarCrearEmpresa(false);
            // El snapshot automáticamente actualizará la lista
          }}
        />
      )}
    </section>
  );
}

export default AdminStoreList;