import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import StarRating from './StarRating';
import ReviewsList from './ReviewsList';
import ReviewForm from './ReviewForm';
import ProviderReputation from './ProviderReputation';
import MapaEmpresa from './MapaEmpresa';

export default function PerfilEmpresaMejorado() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [empresa, setEmpresa] = useState(null);
  const [productos, setProductos] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [webPreview, setWebPreview] = useState(null);

  // Función para formatear horarios estructurados
  const formatearHorarios = (horarios) => {
    if (!horarios || typeof horarios === 'string') return horarios || 'No disponibles';
    
    const diasSemana = {
      lunes: 'Lunes',
      martes: 'Martes',
      miercoles: 'Miércoles',
      jueves: 'Jueves',
      viernes: 'Viernes',
      sabado: 'Sábado',
      domingo: 'Domingo'
    };
    
    const horariosFormateados = [];
    
    Object.entries(horarios).forEach(([dia, config]) => {
      if (config && config.abierto) {
        let horarioTexto = `${diasSemana[dia]}: `;
        
        if (config.turno_continuo) {
          horarioTexto += `${config.apertura} - ${config.cierre}`;
        } else {
          horarioTexto += `${config.apertura} - ${config.descanso_inicio}, ${config.descanso_fin} - ${config.cierre}`;
        }
        
        horariosFormateados.push(horarioTexto);
      }
    });
    
    return horariosFormateados.length > 0 
      ? horariosFormateados.join(', ')
      : 'No disponibles';
  };

  // Función para obtener preview de la página web
  const getWebPreview = async (url) => {
    if (!url) return null;
    
    try {
      // Simular preview de página web (en producción usarías una API como LinkPreview)
      const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
      
      // Por ahora, retornamos un objeto mock con información básica
      return {
        url: cleanUrl,
        title: empresa?.nombre || 'Sitio Web',
        description: `Visita el sitio web oficial de ${empresa?.nombre}`,
        image: empresa?.logo_url || '/images/provider-placeholder.png'
      };
    } catch (error) {
      console.error('Error getting web preview:', error);
      return null;
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmpresa();
      fetchProductos();
      fetchCampanas();
      fetchReviews();
    }
  }, [id]);

  const fetchEmpresa = async () => {
    try {
      const empresaDoc = await getDoc(doc(db, 'empresas', id));
      if (empresaDoc.exists()) {
        const empresaData = { id: empresaDoc.id, ...empresaDoc.data() };
        setEmpresa(empresaData);
        
        // Obtener preview de la web si existe
        if (empresaData.web) {
          const preview = await getWebPreview(empresaData.web);
          setWebPreview(preview);
        }
      } else {
        setError('Empresa no encontrada');
      }
    } catch (error) {
      setError('Error al cargar datos de la empresa');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductos = async () => {
    try {
      const productosQuery = query(
        collection(db, 'productos'),
        where('empresaId', '==', id),
        where('estado', '==', 'aprobado'),
        orderBy('fechaCreacion', 'desc'),
        limit(6)
      );
      const productosSnapshot = await getDocs(productosQuery);
      const productosData = productosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProductos(productosData);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const fetchCampanas = async () => {
    try {
      const campanasQuery = query(
        collection(db, 'campanas'),
        where('empresaId', '==', id),
        where('estado', '==', 'aprobada'),
        orderBy('fechaCreacion', 'desc'),
        limit(6)
      );
      const campanasSnapshot = await getDocs(campanasQuery);
      const campanasData = campanasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCampanas(campanasData);
    } catch (error) {
      console.error('Error al cargar campañas:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const reviewsQuery = query(
        collection(db, 'reseñas'),
        where('proveedorId', '==', id),
        where('estado', '==', 'aprobada'),
        orderBy('fecha', 'desc'),
        limit(10)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error al cargar reseñas:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Cargando perfil de empresa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con Logo */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              {/* Logo de la empresa */}
              {empresa?.logo_url && (
                <div className="flex-shrink-0">
                  <img
                    src={empresa.logo_url}
                    alt={`Logo de ${empresa.nombre}`}
                    className="h-16 w-16 rounded-lg object-cover border-2 border-gray-200"
                    onError={(e) => {
                      e.target.src = '/images/provider-placeholder.png';
                    }}
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {empresa?.nombre}
                </h1>
                <p className="text-gray-600 text-lg">
                  {empresa?.rubro || 'Servicios automotrices'}
                </p>
                {/* Reputación */}
                <div className="mt-2">
                  <ProviderReputation proveedorId={id} compact={true} />
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Volver al Sitio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda - Información de la Empresa */}
          <div className="lg:col-span-1 space-y-6">
            {/* Preview de Sitio Web */}
            {webPreview && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-semibold text-lg">Sitio Web Oficial</h3>
                    <p className="text-sm opacity-90">{webPreview.title}</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-3">{webPreview.description}</p>
                  <a
                    href={webPreview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <span className="mr-2">🌐</span>
                    Visitar Sitio Web
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            )}

                         {/* Información de la Empresa */}
             <div className="bg-white rounded-lg shadow p-6">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Empresa</h3>
               <div className="space-y-3">
                 <div>
                   <span className="text-sm font-medium text-gray-500">Rubro:</span>
                   <p className="text-gray-900">{empresa?.rubro || 'No especificado'}</p>
                 </div>
                 <div>
                   <span className="text-sm font-medium text-gray-500">Teléfono:</span>
                   <p className="text-gray-900">{empresa?.telefono || 'No especificado'}</p>
                 </div>
                 <div>
                   <span className="text-sm font-medium text-gray-500">Email:</span>
                   <p className="text-gray-900">{empresa?.email || 'No especificado'}</p>
                 </div>
                 {empresa?.web && (
                   <div>
                     <span className="text-sm font-medium text-gray-500">Sitio Web:</span>
                     <a 
                       href={empresa.web} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-blue-600 hover:text-blue-800 block"
                     >
                       {empresa.web}
                     </a>
                   </div>
                 )}
               </div>
             </div>

             {/* Mapa y Dirección */}
             {empresa?.direccion && (
               <MapaEmpresa 
                 direccion={empresa.direccion} 
                 nombreEmpresa={empresa.nombre} 
               />
             )}

            {/* Descripción */}
            {empresa?.descripcion && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Descripción</h3>
                <p className="text-gray-600">{empresa.descripcion}</p>
              </div>
            )}

            {/* Servicios */}
            {empresa?.servicios && empresa.servicios.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Servicios</h3>
                <div className="space-y-2">
                  {empresa.servicios.map((servicio, index) => (
                    <div key={index} className="flex items-center">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-gray-700">{servicio}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Horarios */}
            {empresa?.horarios && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Horarios de Atención</h3>
                <div className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">🕒</span>
                  <p className="text-gray-600">
                    {typeof empresa.horarios === 'string' 
                      ? empresa.horarios 
                      : formatearHorarios(empresa.horarios)
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Columna Central - Productos, Campañas y Reseñas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Productos Destacados */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Productos Destacados</h3>
              </div>
              <div className="p-6">
                {productos.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">📦</div>
                    <p className="text-gray-600">Aún no hay productos disponibles</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productos.map((producto) => (
                      <div key={producto.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{producto.nombre}</h4>
                        <p className="text-sm text-gray-600 mb-3">{producto.descripcion}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-blue-600">
                            ${producto.precio || 'Consultar'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(producto.fechaCreacion).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Campañas Activas */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Campañas Activas</h3>
              </div>
              <div className="p-6">
                {campanas.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">🎯</div>
                    <p className="text-gray-600">Aún no hay campañas activas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campanas.map((campana) => (
                      <div key={campana.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{campana.nombre}</h4>
                        <p className="text-sm text-gray-600 mb-3">{campana.descripcion}</p>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            <span>Válida hasta: </span>
                            <span className="font-medium">
                              {new Date(campana.fechaFin).toLocaleDateString()}
                            </span>
                          </div>
                          {campana.descuento && (
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                              {campana.descuento}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Evaluaciones y Comentarios */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Evaluaciones de Clientes</h3>
              </div>
              <div className="p-6">
                {/* Estadísticas de reputación */}
                <div className="mb-6">
                  <ProviderReputation proveedorId={id} showReviews={false} />
                </div>

                {/* Lista de reseñas */}
                <div className="mb-6">
                  <ReviewsList proveedorId={id} limitCount={5} />
                </div>

                {/* Formulario para dejar reseña */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Deja tu Evaluación</h4>
                  <ReviewForm proveedorId={id} onReviewSubmitted={fetchReviews} />
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contactar</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="text-blue-600 mr-3">📞</span>
                  <div>
                    <p className="font-medium text-gray-900">Teléfono</p>
                    <p className="text-gray-600">{empresa?.telefono || 'No disponible'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-3">✉️</span>
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-gray-600">{empresa?.email || 'No disponible'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-3">📍</span>
                  <div>
                    <p className="font-medium text-gray-900">Dirección</p>
                    <p className="text-gray-600">{empresa?.direccion || 'No disponible'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
