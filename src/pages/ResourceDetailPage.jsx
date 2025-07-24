import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import HeaderMenu from '../components/HeaderMenu';

const ResourceDetailPage = () => {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [relatedResources, setRelatedResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResourceDetails();
  }, [resourceId]);

  const fetchResourceDetails = async () => {
    setLoading(true);
    try {
      // Obtener el recurso principal
      const resourceDoc = await getDoc(doc(db, 'recursos_educativos', resourceId));
      
      if (!resourceDoc.exists()) {
        setError('Recurso no encontrado');
        return;
      }

      const resourceData = { id: resourceDoc.id, ...resourceDoc.data() };
      setResource(resourceData);

      // Obtener recursos relacionados
      if (resourceData.categoria) {
        const relatedQuery = query(
          collection(db, 'recursos_educativos'),
          where('categoria', '==', resourceData.categoria),
          where('estado', '==', 'activo'),
          limit(4)
        );
        
        const relatedSnapshot = await getDocs(relatedQuery);
        const related = relatedSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(r => r.id !== resourceId);
        
        setRelatedResources(related);
      }
    } catch (err) {
      console.error('Error fetching resource details:', err);
      setError('Error al cargar el recurso');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (fecha) => {
    if (!fecha) return '';
    if (fecha.toDate) return fecha.toDate().toLocaleDateString();
    if (fecha instanceof Date) return fecha.toLocaleDateString();
    return new Date(fecha).toLocaleDateString();
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'blog': return '📝';
      case 'tip': return '💡';
      case 'tutorial': return '🎓';
      case 'video': return '🎥';
      case 'faq': return '❓';
      default: return '📄';
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'blog': return 'Artículo de Blog';
      case 'tip': return 'Tip/Consejo';
      case 'tutorial': return 'Tutorial';
      case 'video': return 'Video';
      case 'faq': return 'Pregunta Frecuente';
      default: return tipo;
    }
  };

  const getCategoriaLabel = (categoria) => {
    switch (categoria) {
      case 'mantenimiento': return 'Mantenimiento Vehicular';
      case 'repuestos': return 'Selección de Repuestos';
      case 'seguridad': return 'Seguridad Vial';
      case 'general': return 'General';
      default: return categoria;
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? `https://www.youtube.com/embed/${match[1]}` : '';
  };

  const formatContent = (content) => {
    if (!content) return '';
    
    // Convertir saltos de línea a párrafos
    return content
      .split('\n')
      .filter(paragraph => paragraph.trim())
      .map((paragraph, index) => (
        <p key={index} className="mb-4 text-gray-800 leading-relaxed">
          {paragraph.trim()}
        </p>
      ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderMenu />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderMenu />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Recurso no encontrado'}
            </h1>
            <button
              onClick={() => navigate('/recursos')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Volver a Recursos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderMenu />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navegación */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/recursos')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            ← Volver a Recursos
          </button>
        </div>

        {/* Header del recurso */}
        <article className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Imagen destacada o video */}
          {resource.tipo === 'video' && resource.videoUrl ? (
            <div className="relative h-64 md:h-96 bg-gray-900">
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
                    <div className="text-6xl mb-4">🎥</div>
                    <div className="text-lg">Video no disponible</div>
                  </div>
                </div>
              )}
            </div>
          ) : resource.imagenUrl ? (
            <img
              src={resource.imagenUrl}
              alt={resource.titulo}
              className="w-full h-64 md:h-96 object-cover"
            />
          ) : (
            <div className="w-full h-64 md:h-96 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">{getTipoIcon(resource.tipo)}</div>
                <div className="text-xl font-medium">{getTipoLabel(resource.tipo)}</div>
              </div>
            </div>
          )}

          <div className="p-8">
            {/* Meta información */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {getTipoIcon(resource.tipo)} {getTipoLabel(resource.tipo)}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                📚 {getCategoriaLabel(resource.categoria)}
              </span>
              <span className="text-sm text-gray-500">
                📅 {formatDate(resource.fechaCreacion)}
              </span>
            </div>

            {/* Título */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {resource.titulo}
            </h1>

            {/* Descripción */}
            {resource.descripcion && (
              <div className="text-xl text-gray-600 mb-8 leading-relaxed">
                {resource.descripcion}
              </div>
            )}

            {/* Tags */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="mb-8">
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contenido principal */}
            <div className="prose prose-lg max-w-none">
              {resource.tipo === 'faq' ? (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded">
                  <div className="flex">
                    <div className="text-2xl mr-3">❓</div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        Pregunta Frecuente
                      </h3>
                      <div className="text-blue-800">
                        {formatContent(resource.contenido)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : resource.tipo === 'tip' ? (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
                  <div className="flex">
                    <div className="text-2xl mr-3">💡</div>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                        Tip Profesional
                      </h3>
                      <div className="text-yellow-800">
                        {formatContent(resource.contenido)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-lg leading-relaxed">
                  {formatContent(resource.contenido)}
                </div>
              )}
            </div>

            {/* Call to action */}
            <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                ¿Te resultó útil este contenido?
              </h3>
              <p className="text-blue-800 mb-4">
                Explora más recursos educativos en nuestro centro de aprendizaje.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/recursos')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Ver más recursos
                </button>
                <button
                  onClick={() => navigate('/proveedores')}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Buscar proveedores
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Recursos relacionados */}
        {relatedResources.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📚 Recursos Relacionados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedResources.map((relatedResource) => (
                <div
                  key={relatedResource.id}
                  onClick={() => navigate(`/recursos/${relatedResource.id}`)}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">{getTipoIcon(relatedResource.tipo)}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {relatedResource.titulo}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {relatedResource.descripcion?.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{getTipoLabel(relatedResource.tipo)}</span>
                        <span>•</span>
                        <span>{formatDate(relatedResource.fechaCreacion)}</span>
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

export default ResourceDetailPage;
