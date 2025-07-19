import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const EducationalNotifications = ({ userRole = 'proveedor', compact = false }) => {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEducationalTips();
  }, [userRole]);

  useEffect(() => {
    if (tips.length > 1) {
      const interval = setInterval(() => {
        setCurrentTipIndex((prevIndex) => 
          prevIndex === tips.length - 1 ? 0 : prevIndex + 1
        );
      }, 10000); // Cambia cada 10 segundos

      return () => clearInterval(interval);
    }
  }, [tips.length]);

  const fetchEducationalTips = async () => {
    setLoading(true);
    try {
      // Obtener tips y recursos educativos relevantes
      const q = query(
        collection(db, 'recursos_educativos'),
        where('estado', '==', 'activo'),
        where('tipo', 'in', ['tip', 'faq']),
        orderBy('fechaCreacion', 'desc'),
        limit(5)
      );
      
      const snapshot = await getDocs(q);
      const tipsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Agregar tips específicos para proveedores
      const providerSpecificTips = [
        {
          id: 'tip-calidad',
          titulo: 'Mejora la Calidad de tus Productos',
          tipo: 'tip',
          categoria: 'repuestos',
          contenido: 'Asegúrate de que todos tus productos cumplan con los estándares de calidad. Esto mejorará tu reputación y aumentará las reseñas positivas.',
          icon: '⭐'
        },
        {
          id: 'tip-fotos',
          titulo: 'Fotografías de Calidad',
          tipo: 'tip',
          categoria: 'general',
          contenido: 'Usa fotografías claras y bien iluminadas de tus productos. Las imágenes de calidad aumentan la confianza del cliente.',
          icon: '📸'
        },
        {
          id: 'tip-descripciones',
          titulo: 'Descripciones Detalladas',
          tipo: 'tip',
          categoria: 'repuestos',
          contenido: 'Incluye información técnica detallada, compatibilidad vehicular y beneficios de cada producto.',
          icon: '📝'
        },
        {
          id: 'tip-atencion',
          titulo: 'Atención al Cliente Excepcional',
          tipo: 'tip',
          categoria: 'general',
          contenido: 'Responde rápidamente a las consultas y mantén una comunicación clara y profesional con tus clientes.',
          icon: '🤝'
        },
        {
          id: 'tip-inventario',
          titulo: 'Gestión de Inventario',
          tipo: 'tip',
          categoria: 'general',
          contenido: 'Mantén actualizado tu inventario y comunica claramente la disponibilidad de productos.',
          icon: '📦'
        }
      ];

      if (userRole === 'proveedor') {
        setTips([...providerSpecificTips, ...tipsData]);
      } else {
        setTips(tipsData);
      }
    } catch (err) {
      console.error('Error fetching educational tips:', err);
      setTips([]);
    } finally {
      setLoading(false);
    }
  };

  const getTipIcon = (tip) => {
    if (tip.icon) return tip.icon;
    
    switch (tip.categoria) {
      case 'mantenimiento': return '🔧';
      case 'repuestos': return '⚙️';
      case 'seguridad': return '🛡️';
      default: return '💡';
    }
  };

  const handleViewAllResources = () => {
    navigate('/recursos');
  };

  const handleViewResource = (resourceId) => {
    navigate(`/recursos/${resourceId}`);
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-blue-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (tips.length === 0) {
    return null;
  }

  const currentTip = tips[currentTipIndex];

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{getTipIcon(currentTip)}</div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 text-sm mb-1">
              {currentTip.titulo}
            </h4>
            <p className="text-blue-800 text-xs leading-relaxed">
              {currentTip.contenido?.substring(0, 120)}...
            </p>
          </div>
        </div>
        
        {tips.length > 1 && (
          <div className="flex justify-center mt-3 gap-1">
            {tips.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTipIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentTipIndex ? 'bg-blue-600' : 'bg-blue-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <h3 className="text-lg font-semibold text-blue-900">
            Consejos Educativos
          </h3>
        </div>
        <button
          onClick={handleViewAllResources}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Ver todos →
        </button>
      </div>

      <div className="relative">
        <div className="flex items-start gap-4">
          <div className="text-3xl">{getTipIcon(currentTip)}</div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-2">
              {currentTip.titulo}
            </h4>
            <p className="text-blue-800 text-sm leading-relaxed mb-3">
              {currentTip.contenido}
            </p>
            
            {currentTip.id.startsWith('tip-') ? (
              <div className="text-xs text-blue-600">
                💡 Consejo para proveedores
              </div>
            ) : (
              <button
                onClick={() => handleViewResource(currentTip.id)}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
              >
                Leer más →
              </button>
            )}
          </div>
        </div>

        {/* Indicadores de navegación */}
        {tips.length > 1 && (
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-1">
              {tips.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTipIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentTipIndex ? 'bg-blue-600' : 'bg-blue-300'
                  }`}
                />
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentTipIndex(
                  currentTipIndex === 0 ? tips.length - 1 : currentTipIndex - 1
                )}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ‹ Anterior
              </button>
              <button
                onClick={() => setCurrentTipIndex(
                  currentTipIndex === tips.length - 1 ? 0 : currentTipIndex + 1
                )}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Siguiente ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recursos relacionados rápidos */}
      <div className="mt-6 pt-4 border-t border-blue-200">
        <div className="text-xs text-blue-700 mb-2 font-medium">
          🔗 Accesos rápidos:
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/recursos?categoria=mantenimiento')}
            className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full hover:bg-blue-200"
          >
            🔧 Mantenimiento
          </button>
          <button
            onClick={() => navigate('/recursos?categoria=repuestos')}
            className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full hover:bg-blue-200"
          >
            ⚙️ Repuestos
          </button>
          <button
            onClick={() => navigate('/recursos?tipo=tutorial')}
            className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full hover:bg-blue-200"
          >
            🎓 Tutoriales
          </button>
          <button
            onClick={() => navigate('/recursos?tipo=faq')}
            className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full hover:bg-blue-200"
          >
            ❓ FAQ
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationalNotifications;
