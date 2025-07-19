import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../firebase';
import StarRating from './StarRating';
import ReviewsList from './ReviewsList';

const ProviderReputation = ({ 
  proveedorId, 
  showReviews = true, 
  compact = false 
}) => {
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReputationStats();
  }, [proveedorId]);

  const fetchReputationStats = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'reseñas'),
        where('proveedorId', '==', proveedorId),
        where('estado', '==', 'aprobada')
      );
      
      const snapshot = await getDocs(q);
      const reviews = snapshot.docs.map(doc => doc.data());
      
      if (reviews.length === 0) {
        setStats({
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        });
        return;
      }

      // Calcular estadísticas
      const totalReviews = reviews.length;
      const sumRatings = reviews.reduce((sum, review) => sum + review.puntaje, 0);
      const averageRating = sumRatings / totalReviews;
      
      // Distribución de calificaciones
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach(review => {
        distribution[review.puntaje] = (distribution[review.puntaje] || 0) + 1;
      });

      setStats({
        totalReviews,
        averageRating,
        ratingDistribution: distribution
      });
    } catch (err) {
      console.error('Error fetching reputation stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getReputationLevel = (rating) => {
    if (rating >= 4.5) return { label: 'Excelente', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (rating >= 4.0) return { label: 'Muy Bueno', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (rating >= 3.5) return { label: 'Bueno', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (rating >= 3.0) return { label: 'Regular', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { label: 'Necesita Mejorar', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const reputation = getReputationLevel(stats.averageRating);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <StarRating value={stats.averageRating} readonly size="sm" showValue={false} />
        <span className="text-sm text-gray-600">
          {stats.averageRating.toFixed(1)} ({stats.totalReviews} reseñas)
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen de reputación */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Reputación del Proveedor
        </h3>
        
        {stats.totalReviews === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Este proveedor aún no tiene reseñas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calificación promedio */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              <StarRating value={stats.averageRating} readonly size="lg" showValue={false} />
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-3 ${reputation.bgColor} ${reputation.color}`}>
                {reputation.label}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Basado en {stats.totalReviews} reseña{stats.totalReviews !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Distribución de calificaciones */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = stats.ratingDistribution[rating] || 0;
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-8 text-right">{rating}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="w-8 text-gray-600">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lista de reseñas */}
      {showReviews && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Reseñas de Clientes
          </h4>
          <ReviewsList 
            proveedorId={proveedorId} 
            limitCount={5}
          />
        </div>
      )}
    </div>
  );
};

export default ProviderReputation;
