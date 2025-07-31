import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import ProviderBadges from './ProviderBadges';

const FeaturedProviders = ({ title = "🌟 Proveedores Destacados" }) => {
  const navigate = useNavigate();
  const [featuredProviders, setFeaturedProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProviders();
  }, []);

  const fetchFeaturedProviders = async () => {
    try {
      // Obtener proveedores locales, PyMEs y emprendimientos
      const q = query(
        collection(db, 'empresas'),
        where('estado', '==', 'activa'),
        orderBy('fechaRegistro', 'desc'),
        limit(8)
      );
      
      const snapshot = await getDocs(q);
      const providers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Priorizar proveedores locales, PyMEs y emprendimientos
      const prioritized = providers.sort((a, b) => {
        const aScore = getProviderScore(a);
        const bScore = getProviderScore(b);
        return bScore - aScore;
      });

      setFeaturedProviders(prioritized.slice(0, 6));
    } catch (error) {
      console.error('Error fetching featured providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProviderScore = (provider) => {
    let score = 0;
    
    // Prioridad para emprendimientos
    if (isEmprendimiento(provider)) score += 50;
    
    // Prioridad para PyMEs
    if (isPyme(provider)) score += 30;
    
    // Prioridad para locales
    if (isLocal(provider)) score += 20;
    
    // Prioridad para premium
    if (provider.esPremium) score += 40;
    
    // Prioridad para verificados
    if (provider.verificado) score += 15;
    
    // Prioridad para nuevos
    if (provider.esNuevo) score += 10;
    
    return score;
  };

  const isLocal = (provider) => {
    return provider.esLocal || 
           (provider.region && provider.region.toLowerCase().includes('metropolitana')) ||
           (provider.ciudad && ['santiago', 'providencia', 'las condes', 'vitacura'].includes(provider.ciudad.toLowerCase()));
  };

  const isPyme = (provider) => {
    const fechaRegistro = provider.fechaRegistro || provider.fechaCreacion;
    const esNueva = fechaRegistro && 
      (new Date() - (fechaRegistro.toDate ? fechaRegistro.toDate() : new Date(fechaRegistro))) < (2 * 365 * 24 * 60 * 60 * 1000);
    
    return provider.esPyme || esNueva || (provider.numeroProductos && provider.numeroProductos < 50);
  };

  const isEmprendimiento = (provider) => {
    const fechaRegistro = provider.fechaRegistro || provider.fechaCreacion;
    const esMuyNueva = fechaRegistro && 
      (new Date() - (fechaRegistro.toDate ? fechaRegistro.toDate() : new Date(fechaRegistro))) < (6 * 30 * 24 * 60 * 60 * 1000);
    
    return provider.esEmprendimiento || esMuyNueva || (provider.numeroProductos && provider.numeroProductos < 10);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (featuredProviders.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <button
          onClick={() => navigate('/proveedores-locales')}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
        >
          Ver todos →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {featuredProviders.map((provider) => (
          <div
            key={provider.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/proveedor/${provider.id}`)}
          >
            <div className="flex items-start gap-3">
              {provider.logo && (
                <img
                  src={provider.logo}
                  alt={provider.nombre}
                  className="w-12 h-12 object-contain rounded flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {provider.nombre}
                </h4>
                <p className="text-sm text-gray-600 truncate">
                  📍 {provider.ciudad}, {provider.region}
                </p>
                <div className="mt-2">
                  <ProviderBadges empresa={provider} size="sm" />
                </div>
              </div>
            </div>

            {/* Categorías */}
            {provider.categorias && provider.categorias.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-1">
                  {provider.categorias.slice(0, 2).map((categoria, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                    >
                      {categoria}
                    </span>
                  ))}
                  {provider.categorias.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{provider.categorias.length - 2} más
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Call to action */}
      <div className="mt-6 text-center">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm mb-2">
            💡 <strong>¿Eres un emprendimiento o PyME?</strong>
          </p>
          <p className="text-blue-700 text-sm mb-3">
            Únete a nuestra plataforma y destaca tu negocio local
          </p>
          <button
            onClick={() => navigate('/postular-empresa')}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            📝 Postular mi empresa
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProviders;
