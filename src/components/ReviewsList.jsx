import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  doc,
  updateDoc,
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import StarRating from './StarRating';

const ReviewsList = ({ 
  proveedorId, 
  productoId = null, 
  showModeration = false,
  limitCount = 10 
}) => {
  const { user, rol } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, approved, pending, rejected
  const [updating, setUpdating] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [proveedorId, productoId, filter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let constraints = [
        where('proveedorId', '==', proveedorId)
      ];

      if (productoId) {
        constraints.push(where('productoId', '==', productoId));
      } else {
        constraints.push(where('productoId', '==', null));
      }

      // Filtros para moderación
      if (showModeration && filter !== 'all') {
        constraints.push(where('estado', '==', filter));
      } else if (!showModeration) {
        constraints.push(where('estado', '==', 'aprobada'));
      }

      constraints.push(orderBy('fecha', 'desc'));
      
      if (limitCount) {
        constraints.push(limit(limitCount));
      }

      const q = query(collection(db, 'reseñas'), ...constraints);
      const snapshot = await getDocs(q);
      
      setReviews(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleModerateReview = async (reviewId, newState) => {
    setUpdating(reviewId);
    try {
      await updateDoc(doc(db, 'reseñas', reviewId), {
        estado: newState,
        moderadoPor: user.uid,
        fechaModeracion: new Date()
      });
      
      setReviews(reviews.map(review => 
        review.id === reviewId 
          ? { ...review, estado: newState }
          : review
      ));
    } catch (err) {
      console.error('Error moderating review:', err);
    } finally {
      setUpdating('');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
      return;
    }

    setUpdating(reviewId);
    try {
      await deleteDoc(doc(db, 'reseñas', reviewId));
      setReviews(reviews.filter(review => review.id !== reviewId));
    } catch (err) {
      console.error('Error deleting review:', err);
    } finally {
      setUpdating('');
    }
  };

  const formatDate = (fecha) => {
    if (!fecha) return '';
    if (fecha.toDate) return fecha.toDate().toLocaleDateString();
    if (fecha instanceof Date) return fecha.toLocaleDateString();
    return new Date(fecha).toLocaleDateString();
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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showModeration && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('pendiente')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'pendiente' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('aprobada')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'aprobada' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Aprobadas
          </button>
          <button
            onClick={() => setFilter('rechazada')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'rechazada' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Rechazadas
          </button>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {filter === 'all' || !showModeration 
            ? 'No hay reseñas aún' 
            : `No hay reseñas ${filter}s`}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <StarRating value={review.puntaje} readonly size="sm" showValue={false} />
                    <span className="text-sm text-gray-600">
                      por {review.usuarioNombre || review.usuarioEmail}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(review.fecha)}
                    </span>
                    {showModeration && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getEstadoColor(review.estado)}`}>
                        {review.estado || 'pendiente'}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {review.comentario}
                  </p>
                </div>
                
                {showModeration && rol === 'admin' && (
                  <div className="flex flex-col gap-1 ml-4">
                    {review.estado !== 'aprobada' && (
                      <button
                        onClick={() => handleModerateReview(review.id, 'aprobada')}
                        disabled={updating === review.id}
                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        ✓ Aprobar
                      </button>
                    )}
                    {review.estado !== 'rechazada' && (
                      <button
                        onClick={() => handleModerateReview(review.id, 'rechazada')}
                        disabled={updating === review.id}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        ✗ Rechazar
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      disabled={updating === review.id}
                      className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      🗑 Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
