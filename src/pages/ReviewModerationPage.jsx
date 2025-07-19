import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  where,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import DashboardLayout from '../components/DashboardLayout';
import ReviewsList from '../components/ReviewsList';
import AdminRoute from '../components/AdminRoute';

const ReviewModerationPage = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [providers, setProviders] = useState({});
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pendiente');
  const [stats, setStats] = useState({
    total: 0,
    pendiente: 0,
    aprobada: 0,
    rechazada: 0
  });

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [filter]);

  const fetchStats = async () => {
    try {
      const q = query(collection(db, 'reseñas'));
      const snapshot = await getDocs(q);
      
      const statsCount = {
        total: 0,
        pendiente: 0,
        aprobada: 0,
        rechazada: 0
      };

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        statsCount.total++;
        statsCount[data.estado || 'pendiente']++;
      });

      setStats(statsCount);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let q;
      if (filter === 'all') {
        q = query(
          collection(db, 'reseñas'),
          orderBy('fecha', 'desc')
        );
      } else {
        q = query(
          collection(db, 'reseñas'),
          where('estado', '==', filter),
          orderBy('fecha', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setReviews(reviewsData);

      // Obtener información de proveedores y productos
      const providerIds = [...new Set(reviewsData.map(r => r.proveedorId))];
      const productIds = [...new Set(reviewsData.filter(r => r.productoId).map(r => r.productoId))];

      // Fetch providers
      const providersData = {};
      for (const providerId of providerIds) {
        try {
          const providerDoc = await getDoc(doc(db, 'empresas', providerId));
          if (providerDoc.exists()) {
            providersData[providerId] = providerDoc.data();
          }
        } catch (err) {
          console.error('Error fetching provider:', providerId, err);
        }
      }
      setProviders(providersData);

      // Fetch products
      const productsData = {};
      for (const productId of productIds) {
        try {
          const productDoc = await getDoc(doc(db, 'productos', productId));
          if (productDoc.exists()) {
            productsData[productId] = productDoc.data();
          }
        } catch (err) {
          console.error('Error fetching product:', productId, err);
        }
      }
      setProducts(productsData);

    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (fecha) => {
    if (!fecha) return '';
    if (fecha.toDate) return fecha.toDate().toLocaleString();
    if (fecha instanceof Date) return fecha.toLocaleString();
    return new Date(fecha).toLocaleString();
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aprobada':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'rechazada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Moderación de Reseñas
            </h1>
            <p className="text-gray-600">
              Gestiona y modera las reseñas de proveedores y productos
            </p>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
              <div className="text-sm text-blue-700">Total</div>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-900">{stats.pendiente}</div>
              <div className="text-sm text-yellow-700">Pendientes</div>
            </div>
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-900">{stats.aprobada}</div>
              <div className="text-sm text-green-700">Aprobadas</div>
            </div>
            <div className="bg-red-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-900">{stats.rechazada}</div>
              <div className="text-sm text-red-700">Rechazadas</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todas ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pendiente')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                filter === 'pendiente' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pendientes ({stats.pendiente})
            </button>
            <button
              onClick={() => setFilter('aprobada')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                filter === 'aprobada' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Aprobadas ({stats.aprobada})
            </button>
            <button
              onClick={() => setFilter('rechazada')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                filter === 'rechazada' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Rechazadas ({stats.rechazada})
            </button>
          </div>

          {/* Lista de reseñas para moderación */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay reseñas {filter === 'all' ? '' : filter + 's'} en este momento
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div 
                  key={review.id} 
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Información de la reseña */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex text-yellow-400">
                              {'★'.repeat(review.puntaje)}{'☆'.repeat(5 - review.puntaje)}
                            </div>
                            <span className="text-sm text-gray-600">
                              {review.puntaje}/5
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getEstadoColor(review.estado)}`}>
                              {review.estado || 'pendiente'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Por: {review.usuarioNombre || review.usuarioEmail}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDate(review.fecha)}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-800 mb-3 leading-relaxed">
                        {review.comentario}
                      </p>
                    </div>

                    {/* Información del proveedor/producto */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {review.productoId ? 'Producto' : 'Proveedor'}
                      </h4>
                      
                      {review.productoId ? (
                        <div>
                          <div className="text-sm font-medium text-gray-800">
                            {products[review.productoId]?.nombre || 'Producto eliminado'}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Proveedor: {providers[review.proveedorId]?.nombre || 'N/A'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-800">
                          {providers[review.proveedorId]?.nombre || 'Proveedor eliminado'}
                        </div>
                      )}

                      {/* Componente de moderación incorporado */}
                      <div className="mt-4">
                        <ReviewsList 
                          proveedorId={review.proveedorId}
                          productoId={review.productoId}
                          showModeration={true}
                          limitCount={1}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AdminRoute>
  );
};

export default ReviewModerationPage;
