import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import StarRating from '../components/StarRating';
import ReviewForm from '../components/ReviewForm';
import ReviewsList from '../components/ReviewsList';
import ProviderReputation from '../components/ProviderReputation';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user, rol } = useAuth();
  const [product, setProduct] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      // Obtener producto
      const productDoc = await getDoc(doc(db, 'productos', productId));
      if (!productDoc.exists()) {
        setError('Producto no encontrado');
        return;
      }

      const productData = { id: productDoc.id, ...productDoc.data() };
      setProduct(productData);

      // Obtener proveedor
      if (productData.proveedorId) {
        const providerDoc = await getDoc(doc(db, 'empresas', productData.proveedorId));
        if (providerDoc.exists()) {
          setProvider({ id: providerDoc.id, ...providerDoc.data() });
        }
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    // Actualizar la lista de reseñas
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Producto no encontrado'}
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navegación */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            ← Volver
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Imagen del producto */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {product.imagen ? (
              <img
                src={product.imagen}
                alt={product.nombre}
                className="w-full h-96 object-cover"
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">Sin imagen</span>
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {product.nombre}
            </h1>

            {/* Calificación del producto */}
            <div className="mb-4">
              <ProviderReputation 
                proveedorId={product.proveedorId}
                compact={true}
              />
            </div>

            {/* Precio */}
            {product.precio && (
              <div className="text-3xl font-bold text-green-600 mb-4">
                ${product.precio.toLocaleString()}
              </div>
            )}

            {/* Estado */}
            <div className="mb-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {product.estado === 'activo' ? 'Disponible' : product.estado}
              </span>
            </div>

            {/* Categorías y marcas */}
            {product.categorias && product.categorias.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Categorías:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.categorias.map((categoria, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                    >
                      {categoria}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.marcas && product.marcas.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Marcas:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.marcas.map((marca, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm"
                    >
                      {marca}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Información del proveedor */}
            {provider && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-700 mb-2">Proveedor:</h3>
                <div className="flex items-center gap-3">
                  {provider.logo && (
                    <img
                      src={provider.logo}
                      alt={provider.nombre}
                      className="w-12 h-12 object-contain rounded"
                    />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{provider.nombre}</div>
                    <div className="text-sm text-gray-600">{provider.email}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'description'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Descripción
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'reviews'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Reseñas
              </button>
              <button
                onClick={() => setActiveTab('provider')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'provider'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sobre el Proveedor
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'description' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Descripción del Producto
                </h2>
                <div className="text-gray-700 leading-relaxed">
                  {product.descripcion || 'No hay descripción disponible.'}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Reseñas del Producto
                  </h2>
                  
                  {/* Formulario para nueva reseña */}
                  {user && rol !== 'admin' && provider && user.uid !== provider.userId && (
                    <div className="mb-8">
                      <ReviewForm
                        proveedorId={product.proveedorId}
                        productoId={product.id}
                        onReviewSubmitted={handleReviewSubmitted}
                      />
                    </div>
                  )}
                  
                  {/* Lista de reseñas */}
                  <ReviewsList
                    proveedorId={product.proveedorId}
                    productoId={product.id}
                  />
                </div>
              </div>
            )}

            {activeTab === 'provider' && provider && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Información del Proveedor
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      {provider.logo && (
                        <img
                          src={provider.logo}
                          alt={provider.nombre}
                          className="w-16 h-16 object-contain rounded"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {provider.nombre}
                        </h3>
                        <p className="text-gray-600">{provider.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Teléfono:</span> {provider.telefono}
                      </div>
                      <div>
                        <span className="font-medium">Dirección:</span> {provider.direccion}
                      </div>
                      <div>
                        <span className="font-medium">Ciudad:</span> {provider.ciudad}
                      </div>
                      {provider.web && (
                        <div>
                          <span className="font-medium">Web:</span>{' '}
                          <a
                            href={provider.web}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {provider.web}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <ProviderReputation 
                      proveedorId={provider.id}
                      showReviews={false}
                    />
                  </div>
                </div>

                {/* Reseñas del proveedor */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Reseñas Generales del Proveedor
                  </h3>
                  
                  {/* Formulario para reseña del proveedor */}
                  {user && rol !== 'admin' && user.uid !== provider.userId && (
                    <div className="mb-6">
                      <ReviewForm
                        proveedorId={provider.id}
                        onReviewSubmitted={handleReviewSubmitted}
                      />
                    </div>
                  )}
                  
                  <ReviewsList proveedorId={provider.id} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
