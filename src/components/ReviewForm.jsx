import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import StarRating from './StarRating';

const ReviewForm = ({ 
  proveedorId, 
  productoId = null, 
  onReviewSubmitted = () => {} 
}) => {
  const { user } = useAuth();
  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [error, setError] = useState('');

  // Verificar si el usuario ya ha hecho una reseña
  useEffect(() => {
    const checkExistingReview = async () => {
      if (!user || !proveedorId) return;

      try {
        let q;
        if (productoId) {
          q = query(
            collection(db, 'reseñas'),
            where('usuarioId', '==', user.uid),
            where('proveedorId', '==', proveedorId),
            where('productoId', '==', productoId)
          );
        } else {
          q = query(
            collection(db, 'reseñas'),
            where('usuarioId', '==', user.uid),
            where('proveedorId', '==', proveedorId),
            where('productoId', '==', null)
          );
        }

        const snapshot = await getDocs(q);
        setHasReviewed(!snapshot.empty);
      } catch (err) {
        console.error('Error checking existing review:', err);
      }
    };

    checkExistingReview();
  }, [user, proveedorId, productoId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Debes iniciar sesión para dejar una reseña');
      return;
    }

    if (puntaje === 0) {
      setError('Por favor selecciona una calificación');
      return;
    }

    if (comentario.trim().length < 10) {
      setError('El comentario debe tener al menos 10 caracteres');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const reviewData = {
        usuarioId: user.uid,
        usuarioEmail: user.email,
        usuarioNombre: user.displayName || user.email,
        proveedorId,
        puntaje,
        comentario: comentario.trim(),
        fecha: serverTimestamp(),
        estado: 'pendiente' // Para moderación
      };

      if (productoId) {
        reviewData.productoId = productoId;
      }

      await addDoc(collection(db, 'reseñas'), reviewData);
      
      setPuntaje(0);
      setComentario('');
      setHasReviewed(true);
      onReviewSubmitted();
      
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Error al enviar la reseña. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          Debes iniciar sesión para dejar una reseña
        </p>
      </div>
    );
  }

  if (hasReviewed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800">
          ✅ Ya has dejado una reseña para este {productoId ? 'producto' : 'proveedor'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Escribir una reseña
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calificación *
          </label>
          <StarRating
            value={puntaje}
            onChange={setPuntaje}
            size="lg"
            showValue={false}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comentario *
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Comparte tu experiencia..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1">
            {comentario.length}/500 caracteres (mínimo 10)
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || puntaje === 0 || comentario.trim().length < 10}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar reseña'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
