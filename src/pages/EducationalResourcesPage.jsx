import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import HeaderMenu from '../components/HeaderMenu';

const EducationalResourcesPage = () => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeType, setActiveType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const categorias = [
    { value: 'all', label: 'Todas las Categorías', icon: '📚' },
    { value: 'mantenimiento', label: 'Mantenimiento Vehicular', icon: '🔧' },
    { value: 'repuestos', label: 'Selección de Repuestos', icon: '⚙️' },
    { value: 'seguridad', label: 'Seguridad Vial', icon: '🛡️' },
    { value: 'general', label: 'General', icon: '💡' }
  ];

  const tipos = [
    { value: 'all', label: 'Todos los Tipos', icon: '📄' },
    { value: 'blog', label: 'Artículos', icon: '📝' },
    { value: 'tip', label: 'Tips', icon: '💡' },
    { value: 'tutorial', label: 'Tutoriales', icon: '🎓' },
    { value: 'video', label: 'Videos', icon: '🎥' },
    { value: 'faq', label: 'FAQ', icon: '❓' }
  ];

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [resources, activeCategory, activeType, searchTerm]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'recursos_educativos'),
        where('estado', '==', 'activo'),
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

  const filterResources = () => {
    let filtered = resources;

    if (activeCategory !== 'all') {
      filtered = filtered.filter(resource => resource.categoria === activeCategory);
    }

    if (activeType !== 'all') {
      filtered = filtered.filter(resource => resource.tipo === activeType);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(resource => 
        resource.titulo.toLowerCase().includes(search) ||
        resource.descripcion?.toLowerCase().includes(search) ||
        resource.contenido.toLowerCase().includes(search) ||
        (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(search)))
      );
    }

    setFilteredResources(filtered);
  };

  const formatDate = (fecha) => {
    if (!fecha) return '';
    if (fecha.toDate) return fecha.toDate().toLocaleDateString();
    if (fecha instanceof Date) return fecha.toLocaleDateString();
    return new Date(fecha).toLocaleDateString();
  };

  const getTipoIcon = (tipo) => {
    const tipoObj = tipos.find(t => t.value === tipo);
    return tipoObj ? tipoObj.icon : '📄';
  };

  const getTipoLabel = (tipo) => {
    const tipoObj = tipos.find(t => t.value === tipo);
    return tipoObj ? tipoObj.label : tipo;
  };

  const getCategoriaLabel = (categoria) => {
    const catObj = categorias.find(c => c.value === categoria);
    return catObj ? catObj.label : categoria;
  };

  const handleResourceClick = (resource) => {
    navigate(`/recursos/${resource.id}`);
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? `https://www.youtube.com/embed/${match[1]}` : '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderMenu />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📚 Centro de Recursos Educativos
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Aprende sobre mantenimiento vehicular, selección de repuestos y mucho más 
            con nuestros recursos educativos especializados.
          </p>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar recursos
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título, contenido o tags..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtro por categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categorias.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de contenido
              </label>
              <select
                value={activeType}
                onChange={(e) => setActiveType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tipos.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.icon} {tipo.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtros rápidos */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">Filtros rápidos:</span>
            {categorias.slice(1).map(cat => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resultados */}
        <div className="mb-4 text-sm text-gray-600">
          {loading ? 'Cargando...' : `${filteredResources.length} recursos encontrados`}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium mb-2">No se encontraron recursos</h3>
            <p>Intenta ajustar los filtros o términos de búsqueda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <div
                key={resource.id}
                onClick={() => handleResourceClick(resource)}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              >
                {/* Imagen o video preview */}
                {resource.tipo === 'video' && resource.videoUrl ? (
                  <div className="relative h-48 bg-gray-900">
                    {getYouTubeEmbedUrl(resource.videoUrl) ? (
                      <iframe
                        src={getYouTubeEmbedUrl(resource.videoUrl)}
                        className="w-full h-full"
                        allowFullScreen
                        title={resource.titulo}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🎥</div>
                          <div className="text-sm">Video</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : resource.imagenUrl ? (
                  <img
                    src={resource.imagenUrl}
                    alt={resource.titulo}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-4xl mb-2">{getTipoIcon(resource.tipo)}</div>
                      <div className="text-sm font-medium">{getTipoLabel(resource.tipo)}</div>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Tipo y categoría */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {getTipoIcon(resource.tipo)} {getTipoLabel(resource.tipo)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getCategoriaLabel(resource.categoria)}
                    </span>
                  </div>

                  {/* Título */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {resource.titulo}
                  </h3>

                  {/* Descripción */}
                  {resource.descripcion && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                      {resource.descripcion}
                    </p>
                  )}

                  {/* Tags */}
                  {resource.tags && resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {resource.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                      {resource.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{resource.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Fecha */}
                  <div className="text-xs text-gray-400">
                    {formatDate(resource.fechaCreacion)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recursos destacados o recientes */}
        {!loading && !searchTerm && activeCategory === 'all' && activeType === 'all' && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              🔥 Recursos Más Populares
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredResources.slice(0, 4).map((resource) => (
                <div
                  key={`popular-${resource.id}`}
                  onClick={() => handleResourceClick(resource)}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{getTipoIcon(resource.tipo)}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {resource.titulo}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {resource.descripcion?.substring(0, 120)}...
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{getTipoLabel(resource.tipo)}</span>
                        <span>•</span>
                        <span>{getCategoriaLabel(resource.categoria)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EducationalResourcesPage;
