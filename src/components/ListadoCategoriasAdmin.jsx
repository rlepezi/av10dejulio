import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";

export default function ListadoCategoriasAdmin() {
  const [categorias, setCategorias] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [nombreEditando, setNombreEditando] = useState('');
  const [loading, setLoading] = useState(false);

  // Categorías predefinidas sugeridas
  const categoriasSugeridas = [
    '4x4', 'Repuestos', 'Ventas', 'Servicio', 'Seguros', 'Emergencia', 
    'Auto', 'Camioneta', 'Camión', 'Accesorio', 'Neumáticos', 'Lubricantes',
    'Mecánica', 'Electricidad', 'Pintura', 'Chapa', 'Grúas', 'Lavado',
    'Alarmas', 'Audio', 'GNC', 'Aire Acondicionado', 'Suspensión', 'Frenos',
    'Motor', 'Transmisión', 'Escape', 'Cristales', 'Tapicería', 'Tunning'
  ];

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categorias"), (snap) => {
      setCategorias(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const agregarCategoria = async (nombre) => {
    if (!nombre.trim()) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'categorias'), {
        nombre: nombre.trim(),
        fechaCreacion: new Date(),
        activa: true
      });
      setNuevaCategoria('');
      console.log('✅ Categoría agregada:', nombre);
    } catch (error) {
      console.error('❌ Error agregando categoría:', error);
      alert('Error al agregar la categoría');
    } finally {
      setLoading(false);
    }
  };

  const editarCategoria = async (id, nuevoNombre) => {
    if (!nuevoNombre.trim()) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'categorias', id), {
        nombre: nuevoNombre.trim(),
        fechaModificacion: new Date()
      });
      setCategoriaEditando(null);
      setNombreEditando('');
      console.log('✅ Categoría editada:', nuevoNombre);
    } catch (error) {
      console.error('❌ Error editando categoría:', error);
      alert('Error al editar la categoría');
    } finally {
      setLoading(false);
    }
  };

  const eliminarCategoria = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${nombre}"?`)) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'categorias', id));
      console.log('✅ Categoría eliminada:', nombre);
    } catch (error) {
      console.error('❌ Error eliminando categoría:', error);
      alert('Error al eliminar la categoría');
    } finally {
      setLoading(false);
    }
  };

  const agregarCategoriasSugeridas = async () => {
    if (!confirm('¿Deseas agregar todas las categorías sugeridas que no existen aún?')) return;
    
    setLoading(true);
    const categoriasExistentes = categorias.map(c => c.nombre.toLowerCase());
    const categoriasNuevas = categoriasSugeridas.filter(
      cat => !categoriasExistentes.includes(cat.toLowerCase())
    );
    
    try {
      for (const categoria of categoriasNuevas) {
        await addDoc(collection(db, 'categorias'), {
          nombre: categoria,
          fechaCreacion: new Date(),
          activa: true
        });
      }
      console.log(`✅ ${categoriasNuevas.length} categorías agregadas`);
      alert(`Se agregaron ${categoriasNuevas.length} categorías nuevas`);
    } catch (error) {
      console.error('❌ Error agregando categorías sugeridas:', error);
      alert('Error al agregar las categorías sugeridas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Categorías</h2>
        <p className="text-gray-600">Administra las categorías de servicios disponibles en la plataforma</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{categorias.length}</div>
          <div className="text-sm text-blue-600">Total Categorías</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {categorias.filter(c => c.activa !== false).length}
          </div>
          <div className="text-sm text-green-600">Activas</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {categoriasSugeridas.filter(
              cat => !categorias.some(c => c.nombre.toLowerCase() === cat.toLowerCase())
            ).length}
          </div>
          <div className="text-sm text-yellow-600">Sugeridas Pendientes</div>
        </div>
      </div>

      {/* Agregar nueva categoría */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Agregar Nueva Categoría</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={nuevaCategoria}
            onChange={(e) => setNuevaCategoria(e.target.value)}
            placeholder="Nombre de la categoría"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && agregarCategoria(nuevaCategoria)}
            disabled={loading}
          />
          <button
            onClick={() => agregarCategoria(nuevaCategoria)}
            disabled={loading || !nuevaCategoria.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Agregando...' : 'Agregar'}
          </button>
        </div>
      </div>

      {/* Categorías sugeridas */}
      <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Categorías Sugeridas</h3>
          <button
            onClick={agregarCategoriasSugeridas}
            disabled={loading}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition-colors text-sm"
          >
            {loading ? 'Agregando...' : 'Agregar Todas las Sugeridas'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categoriasSugeridas.map(categoria => {
            const existe = categorias.some(c => c.nombre.toLowerCase() === categoria.toLowerCase());
            return (
              <span
                key={categoria}
                className={`px-3 py-1 rounded-full text-sm ${
                  existe 
                    ? 'bg-green-100 text-green-800 line-through' 
                    : 'bg-yellow-100 text-yellow-800 cursor-pointer hover:bg-yellow-200'
                }`}
                onClick={!existe ? () => agregarCategoria(categoria) : undefined}
                title={existe ? 'Ya existe' : 'Clic para agregar'}
              >
                {categoria} {existe ? '✓' : '+'}
              </span>
            );
          })}
        </div>
      </div>

      {/* Lista de categorías */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Fecha Creación
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categorias.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">📂</div>
                  <div>No hay categorías registradas</div>
                  <div className="text-sm mt-2">Agrega algunas categorías para comenzar</div>
                </td>
              </tr>
            ) : (
              categorias.map((categoria) => (
                <tr key={categoria.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b">
                    {categoriaEditando === categoria.id ? (
                      <input
                        type="text"
                        value={nombreEditando}
                        onChange={(e) => setNombreEditando(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') editarCategoria(categoria.id, nombreEditando);
                          if (e.key === 'Escape') {
                            setCategoriaEditando(null);
                            setNombreEditando('');
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{categoria.nombre}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 border-b">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      categoria.activa !== false 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {categoria.activa !== false ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 border-b">
                    {categoria.fechaCreacion ? 
                      new Date(categoria.fechaCreacion.toDate()).toLocaleDateString() : 
                      'No disponible'
                    }
                  </td>
                  <td className="px-4 py-3 text-right border-b">
                    <div className="flex justify-end gap-2">
                      {categoriaEditando === categoria.id ? (
                        <>
                          <button
                            onClick={() => editarCategoria(categoria.id, nombreEditando)}
                            disabled={loading}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-sm"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => {
                              setCategoriaEditando(null);
                              setNombreEditando('');
                            }}
                            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setCategoriaEditando(categoria.id);
                              setNombreEditando(categoria.nombre);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => eliminarCategoria(categoria.id, categoria.nombre)}
                            disabled={loading}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 text-sm"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Procesando...</span>
          </div>
        </div>
      )}
    </div>
  );
}