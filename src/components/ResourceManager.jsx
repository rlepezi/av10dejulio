import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import DashboardLayout from './DashboardLayout';
import AdminRoute from './AdminRoute';

const ResourceManager = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'blog', // blog, tip, tutorial, video, faq
    categoria: 'mantenimiento', // mantenimiento, repuestos, general, seguridad
    contenido: '',
    descripcion: '',
    videoUrl: '',
    imagenUrl: '',
    tags: '',
    orden: 0,
    estado: 'activo'
  });

  const tiposRecurso = [
    { value: 'blog', label: 'Artículo de Blog' },
    { value: 'tip', label: 'Tip/Consejo' },
    { value: 'tutorial', label: 'Tutorial' },
    { value: 'video', label: 'Video' },
    { value: 'faq', label: 'Pregunta Frecuente' }
  ];

  const categorias = [
    { value: 'mantenimiento', label: 'Mantenimiento Vehicular' },
    { value: 'repuestos', label: 'Selección de Repuestos' },
    { value: 'seguridad', label: 'Seguridad Vial' },
    { value: 'general', label: 'General' }
  ];

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'recursos_educativos'),
        orderBy('orden', 'asc'),
        orderBy('fechaCreacion', 'desc')
      );
      const snapshot = await getDocs(q);
      setResources(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    } catch (err) {
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.contenido.trim()) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    try {
      const resourceData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        orden: parseInt(formData.orden) || 0,
        fechaActualizacion: serverTimestamp(),
        actualizadoPor: user.uid
      };

      if (editingResource) {
        await updateDoc(doc(db, 'recursos_educativos', editingResource.id), resourceData);
      } else {
        resourceData.fechaCreacion = serverTimestamp();
        resourceData.creadoPor = user.uid;
        await addDoc(collection(db, 'recursos_educativos'), resourceData);
      }

      resetForm();
      fetchResources();
    } catch (err) {
      console.error('Error saving resource:', err);
      alert('Error al guardar el recurso');
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setFormData({
      ...resource,
      tags: Array.isArray(resource.tags) ? resource.tags.join(', ') : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este recurso?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'recursos_educativos', resourceId));
      fetchResources();
    } catch (err) {
      console.error('Error deleting resource:', err);
      alert('Error al eliminar el recurso');
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      tipo: 'blog',
      categoria: 'mantenimiento',
      contenido: '',
      descripcion: '',
      videoUrl: '',
      imagenUrl: '',
      tags: '',
      orden: 0,
      estado: 'activo'
    });
    setEditingResource(null);
    setShowForm(false);
  };

  const formatDate = (fecha) => {
    if (!fecha) return '';
    if (fecha.toDate) return fecha.toDate().toLocaleDateString();
    if (fecha instanceof Date) return fecha.toLocaleDateString();
    return new Date(fecha).toLocaleDateString();
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'borrador':
        return 'bg-yellow-100 text-yellow-800';
      case 'archivado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'blog':
        return '📝';
      case 'tip':
        return '💡';
      case 'tutorial':
        return '🎓';
      case 'video':
        return '🎥';
      case 'faq':
        return '❓';
      default:
        return '📄';
    }
  };

  return (
    <AdminRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Gestión de Recursos Educativos
              </h1>
              <p className="text-gray-600">
                Administra contenido educativo para usuarios
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Nuevo Recurso
            </button>
          </div>

          {/* Formulario */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingResource ? 'Editar Recurso' : 'Nuevo Recurso'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Recurso
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {tiposRecurso.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categorias.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="activo">Activo</option>
                      <option value="borrador">Borrador</option>
                      <option value="archivado">Archivado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción Breve
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción corta para mostrar en listados..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenido *
                  </label>
                  <textarea
                    value={formData.contenido}
                    onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contenido completo del recurso..."
                    required
                  />
                </div>

                {formData.tipo === 'video' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL del Video
                    </label>
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL de Imagen
                    </label>
                    <input
                      type="url"
                      value={formData.imagenUrl}
                      onChange={(e) => setFormData({ ...formData, imagenUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (separados por comas)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="mantenimiento, aceite, filtros"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Orden
                    </label>
                    <input
                      type="number"
                      value={formData.orden}
                      onChange={(e) => setFormData({ ...formData, orden: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    {editingResource ? 'Actualizar' : 'Crear'} Recurso
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de recursos */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recurso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {resources.map((resource) => (
                      <tr key={resource.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-start">
                            <span className="text-2xl mr-3">{getTipoIcon(resource.tipo)}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {resource.titulo}
                              </div>
                              {resource.descripcion && (
                                <div className="text-sm text-gray-500 mt-1">
                                  {resource.descripcion.substring(0, 100)}...
                                </div>
                              )}
                              {resource.tags && resource.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {resource.tags.slice(0, 3).map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {resource.tags.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      +{resource.tags.length - 3} más
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {tiposRecurso.find(t => t.value === resource.tipo)?.label || resource.tipo}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {categorias.find(c => c.value === resource.categoria)?.label || resource.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(resource.estado)}`}>
                            {resource.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(resource.fechaCreacion)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(resource)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(resource.id)}
                              className="text-red-600 hover:text-red-900"
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

              {resources.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No hay recursos educativos creados aún
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AdminRoute>
  );
};

export default ResourceManager;
