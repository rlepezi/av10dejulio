# 🛠️ IMPLEMENTACIONES ESPECÍFICAS - MEJORAS TÉCNICAS

---

## 🎯 1. REFACTORIZACIÓN DE APP.JSX

### **❌ Código Actual (Problemático)**
```javascript
// App.jsx - 516 líneas monolíticas
export default function App() {
  // 13 estados locales
  const [view, setView] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [marcaSeleccionada, setMarcaSeleccionada] = useState(null);
  // ... +10 estados más

  // 4 useEffect sin optimizar
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "empresas"), snap => {
      setEmpresas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // Renders condicionales complejos
  if (empresaAEditar) {
    return <div className="min-h-screen">...</div>;
  }
  if (campanaAEditar) {
    return <div className="min-h-screen">...</div>;
  }
  // ... más ifs

  return (
    <AuthProvider>
      <BrowserRouter>
        {/* 100+ líneas de JSX */}
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### **✅ Código Mejorado (Propuesto)**

#### **App.jsx - Simplificado**
```javascript
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from 'react-error-boundary';

import AuthProvider from './providers/AuthProvider';
import AppStateProvider from './providers/AppStateProvider';
import AppRoutes from './routes/AppRoutes';
import ErrorFallback from './components/ErrorFallback';
import Layout from './components/Layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error?.status === 404) return false;
        return failureCount < 3;
      }
    }
  }
});

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppStateProvider>
            <BrowserRouter>
              <Layout>
                <AppRoutes />
              </Layout>
            </BrowserRouter>
          </AppStateProvider>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

#### **routes/AppRoutes.jsx - Rutas Organizadas**
```javascript
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import ProtectedRoute from '../components/ProtectedRoute';

// Lazy loading para optimizar bundle
const HomePage = lazy(() => import('../pages/HomePage'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const ProveedorDashboard = lazy(() => import('../pages/ProveedorDashboard'));
const ProductDetail = lazy(() => import('../pages/ProductDetail'));
const LoginPage = lazy(() => import('../pages/LoginPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/producto/:id" element={<ProductDetail />} />
        
        {/* Rutas protegidas */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/proveedor/*" 
          element={
            <ProtectedRoute role="proveedor">
              <ProveedorDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Suspense>
  );
}
```

---

## 🏪 2. STATE MANAGEMENT CON ZUSTAND

### **store/useAppStore.js - Store Principal**
```javascript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Estados
        empresas: [],
        productos: [],
        campanas: [],
        filters: {
          busqueda: '',
          marca: null,
          categoria: null,
          region: null
        },
        ui: {
          sidebarOpen: false,
          theme: 'light',
          loading: false
        },
        
        // Acciones
        setEmpresas: (empresas) => set({ empresas }),
        setProductos: (productos) => set({ productos }),
        setCampanas: (campanas) => set({ campanas }),
        
        // Filtros
        updateFilters: (newFilters) => set((state) => ({
          filters: { ...state.filters, ...newFilters }
        })),
        clearFilters: () => set((state) => ({
          filters: {
            busqueda: '',
            marca: null,
            categoria: null,
            region: null
          }
        })),
        
        // UI Actions
        toggleSidebar: () => set((state) => ({
          ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
        })),
        setLoading: (loading) => set((state) => ({
          ui: { ...state.ui, loading }
        })),
        
        // Computed values
        getFilteredProducts: () => {
          const { productos, filters } = get();
          return productos.filter(product => {
            if (filters.busqueda) {
              const searchTerm = filters.busqueda.toLowerCase();
              if (!product.nombre.toLowerCase().includes(searchTerm)) {
                return false;
              }
            }
            if (filters.marca && !product.marcas.includes(filters.marca)) {
              return false;
            }
            if (filters.categoria && !product.categorias.includes(filters.categoria)) {
              return false;
            }
            return true;
          });
        },
        
        getFilteredEmpresas: () => {
          const { empresas, filters } = get();
          return empresas.filter(empresa => {
            if (filters.busqueda) {
              const searchTerm = filters.busqueda.toLowerCase();
              if (!empresa.nombre.toLowerCase().includes(searchTerm)) {
                return false;
              }
            }
            if (filters.region && empresa.region !== filters.region) {
              return false;
            }
            return true;
          });
        }
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          filters: state.filters,
          ui: { theme: state.ui.theme }
        })
      }
    )
  )
);

// Store para favoritos
export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favoriteProducts: [],
      favoriteProviders: [],
      
      addFavoriteProduct: (productId) => set(state => ({
        favoriteProducts: [...new Set([...state.favoriteProducts, productId])]
      })),
      
      removeFavoriteProduct: (productId) => set(state => ({
        favoriteProducts: state.favoriteProducts.filter(id => id !== productId)
      })),
      
      isFavoriteProduct: (productId) => {
        const { favoriteProducts } = get();
        return favoriteProducts.includes(productId);
      },
      
      addFavoriteProvider: (providerId) => set(state => ({
        favoriteProviders: [...new Set([...state.favoriteProviders, providerId])]
      })),
      
      removeFavoriteProvider: (providerId) => set(state => ({
        favoriteProviders: state.favoriteProviders.filter(id => id !== providerId)
      })),
      
      isFavoriteProvider: (providerId) => {
        const { favoriteProviders } = get();
        return favoriteProviders.includes(providerId);
      }
    }),
    {
      name: 'favorites-store'
    }
  )
);

// Hooks específicos para componentes
export const useFilters = () => useAppStore(state => state.filters);
export const useUpdateFilters = () => useAppStore(state => state.updateFilters);
export const useFilteredProducts = () => useAppStore(state => state.getFilteredProducts());
export const useFilteredEmpresas = () => useAppStore(state => state.getFilteredEmpresas());
```

---

## 🎣 3. CUSTOM HOOKS OPTIMIZADOS

### **hooks/useFirebaseCollection.js**
```javascript
import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirebaseCollection(collectionName, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      let q = collection(db, collectionName);

      // Aplicar filtros
      if (options.where) {
        options.where.forEach(([field, operator, value]) => {
          q = query(q, where(field, operator, value));
        });
      }

      // Aplicar ordenamiento
      if (options.orderBy) {
        options.orderBy.forEach(([field, direction = 'asc']) => {
          q = query(q, orderBy(field, direction));
        });
      }

      // Suscribirse a cambios
      unsubscribeRef.current = onSnapshot(q, 
        (snapshot) => {
          const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            _metadata: {
              fromCache: doc.metadata.fromCache,
              hasPendingWrites: doc.metadata.hasPendingWrites
            }
          }));
          
          setData(docs);
          setLoading(false);
        },
        (err) => {
          console.error(`Error fetching ${collectionName}:`, err);
          setError(err);
          setLoading(false);
        }
      );
    } catch (err) {
      setError(err);
      setLoading(false);
    }

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [collectionName, JSON.stringify(options)]);

  const refetch = () => {
    setLoading(true);
    setError(null);
  };

  return { data, loading, error, refetch };
}

// Hook especializado para productos
export function useProducts(filters = {}) {
  const whereConditions = [
    ['estado', '==', 'activo']
  ];

  if (filters.marca) {
    whereConditions.push(['marcas', 'array-contains', filters.marca]);
  }

  if (filters.categoria) {
    whereConditions.push(['categorias', 'array-contains', filters.categoria]);
  }

  return useFirebaseCollection('productos', {
    where: whereConditions,
    orderBy: [['fechaCreacion', 'desc']]
  });
}

// Hook especializado para empresas
export function useEmpresas(filters = {}) {
  const whereConditions = [
    ['estado', '==', 'activo']
  ];

  if (filters.region) {
    whereConditions.push(['region', '==', filters.region]);
  }

  return useFirebaseCollection('empresas', {
    where: whereConditions,
    orderBy: [['calificacion', 'desc']]
  });
}
```

### **hooks/useAuth.js - Auth Hook Mejorado**
```javascript
import { useState, useEffect, createContext, useContext } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          
          // Obtener perfil del usuario
          const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            // Crear perfil básico si no existe
            const basicProfile = {
              email: firebaseUser.email,
              rol: 'user',
              fechaCreacion: new Date(),
              ultimoAcceso: new Date()
            };
            await setDoc(doc(db, 'usuarios', firebaseUser.uid), basicProfile);
            setUserProfile(basicProfile);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    });
    
    return unsubscribe;
  }, []);
  
  const login = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Actualizar último acceso
      await updateDoc(doc(db, 'usuarios', result.user.uid), {
        ultimoAcceso: new Date()
      });
      
      return result;
    } catch (error) {
      setError(error);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (error) {
      setError(error);
      throw error;
    }
  };
  
  const register = async (email, password, additionalData = {}) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Crear perfil completo
      const profile = {
        email,
        ...additionalData,
        fechaCreacion: new Date(),
        ultimoAcceso: new Date(),
        rol: additionalData.rol || 'user'
      };
      
      await setDoc(doc(db, 'usuarios', result.user.uid), profile);
      setUserProfile(profile);
      
      return result;
    } catch (error) {
      setError(error);
      throw error;
    }
  };
  
  const hasRole = (requiredRole) => {
    if (!userProfile) return false;
    
    const roleHierarchy = {
      user: 0,
      proveedor: 1,
      admin: 2
    };
    
    const userLevel = roleHierarchy[userProfile.rol] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  };
  
  const value = {
    user,
    userProfile,
    loading,
    error,
    login,
    logout,
    register,
    hasRole,
    isAuthenticated: !!user,
    isAdmin: userProfile?.rol === 'admin',
    isProveedor: userProfile?.rol === 'proveedor'
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 📊 4. REACT QUERY INTEGRATION

### **hooks/useQueryProducts.js**
```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';

// Query para obtener productos
export function useProductsQuery(filters = {}) {
  return useQuery({
    queryKey: ['productos', filters],
    queryFn: async () => {
      let q = collection(db, 'productos');
      
      // Aplicar filtros
      if (filters.estado) {
        q = query(q, where('estado', '==', filters.estado));
      }
      if (filters.marca) {
        q = query(q, where('marcas', 'array-contains', filters.marca));
      }
      
      q = query(q, orderBy('fechaCreacion', 'desc'));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Mutation para crear producto
export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productData) => {
      const docRef = await addDoc(collection(db, 'productos'), {
        ...productData,
        fechaCreacion: new Date(),
        estado: 'activo'
      });
      return { id: docRef.id, ...productData };
    },
    onSuccess: () => {
      // Invalidar caché de productos
      queryClient.invalidateQueries(['productos']);
    },
    onError: (error) => {
      console.error('Error creating product:', error);
    }
  });
}

// Mutation para actualizar producto
export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      await updateDoc(doc(db, 'productos', id), {
        ...data,
        fechaActualizacion: new Date()
      });
      return { id, ...data };
    },
    onSuccess: (updatedProduct) => {
      // Actualizar caché específico
      queryClient.setQueryData(['productos'], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(product => 
          product.id === updatedProduct.id ? updatedProduct : product
        );
      });
    }
  });
}

// Hook combinado para operaciones de productos
export function useProducts(filters = {}) {
  const productsQuery = useProductsQuery(filters);
  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();
  
  return {
    // Data
    products: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    error: productsQuery.error,
    
    // Actions
    createProduct: createMutation.mutate,
    updateProduct: updateMutation.mutate,
    
    // States
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    
    // Utils
    refetch: productsQuery.refetch
  };
}
```

---

## 🔄 5. COMPONENTES OPTIMIZADOS

### **components/ProductCard.jsx - Con Memoización**
```javascript
import React, { memo, useCallback } from 'react';
import { FaHeart, FaEye, FaStar } from 'react-icons/fa';
import { useFavoritesStore } from '../store/useAppStore';

const ProductCard = memo(({ 
  product, 
  onViewDetail, 
  showProviderInfo = true,
  variant = 'default' 
}) => {
  const { addFavoriteProduct, removeFavoriteProduct, isFavoriteProduct } = useFavoritesStore();
  const isFavorite = isFavoriteProduct(product.id);

  const handleToggleFavorite = useCallback((e) => {
    e.stopPropagation();
    if (isFavorite) {
      removeFavoriteProduct(product.id);
    } else {
      addFavoriteProduct(product.id);
    }
  }, [product.id, isFavorite, addFavoriteProduct, removeFavoriteProduct]);

  const handleViewDetail = useCallback(() => {
    onViewDetail?.(product.id);
  }, [product.id, onViewDetail]);

  const formatPrice = useCallback((price) => {
    if (!price) return 'Consultar precio';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Imagen del producto */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={product.imagenes?.[0] || '/images/no-image.jpg'}
          alt={product.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Badge de stock */}
        {product.stock > 0 && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Stock: {product.stock}
          </div>
        )}
        
        {/* Botón de favorito */}
        <button
          onClick={handleToggleFavorite}
          className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
            isFavorite 
              ? 'bg-red-500 text-white' 
              : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
          }`}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <FaHeart className="w-4 h-4" />
        </button>
      </div>

      {/* Contenido */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.nombre}
        </h3>
        
        {/* Precio */}
        <div className="text-2xl font-bold text-blue-600 mb-2">
          {formatPrice(product.precio)}
        </div>
        
        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`w-4 h-4 ${
                    star <= product.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              ({product.reviewCount} reseñas)
            </span>
          </div>
        )}
        
        {/* Categorías */}
        {product.categorias && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.categorias.slice(0, 2).map((categoria, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
              >
                {categoria}
              </span>
            ))}
          </div>
        )}
        
        {/* Información del proveedor */}
        {showProviderInfo && product.empresa && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
            {product.empresa.logo && (
              <img
                src={product.empresa.logo}
                alt={product.empresa.nombre}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {product.empresa.nombre}
              </p>
              {product.empresa.verified && (
                <p className="text-xs text-green-600">✓ Verificado</p>
              )}
            </div>
          </div>
        )}
        
        {/* Botón de acción */}
        <button
          onClick={handleViewDetail}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <FaEye className="w-4 h-4" />
          Ver Detalles
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Optimización de re-render
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.precio === nextProps.product.precio &&
    prevProps.product.stock === nextProps.product.stock &&
    prevProps.showProviderInfo === nextProps.showProviderInfo
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
```

### **components/ProductList.jsx - Con Virtualización**
```javascript
import React, { useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { useProducts } from '../hooks/useQueryProducts';
import { useAppStore } from '../store/useAppStore';
import ProductCard from './ProductCard';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const CARD_WIDTH = 300;
const CARD_HEIGHT = 400;
const GAP = 20;

function ProductList({ onProductSelect }) {
  const filters = useAppStore(state => state.filters);
  const { products, isLoading, error } = useProducts(filters);

  const { columnCount, containerWidth } = useMemo(() => {
    const container = window.innerWidth - 40; // padding
    const cols = Math.floor((container + GAP) / (CARD_WIDTH + GAP));
    return {
      columnCount: Math.max(1, cols),
      containerWidth: container
    };
  }, []);

  const rowCount = Math.ceil(products.length / columnCount);

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex;
    const product = products[index];

    if (!product) return null;

    return (
      <div
        style={{
          ...style,
          left: style.left + GAP / 2,
          top: style.top + GAP / 2,
          width: style.width - GAP,
          height: style.height - GAP,
        }}
      >
        <ProductCard
          product={product}
          onViewDetail={onProductSelect}
        />
      </div>
    );
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!products.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se encontraron productos</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Grid
        columnCount={columnCount}
        columnWidth={CARD_WIDTH + GAP}
        height={600}
        rowCount={rowCount}
        rowHeight={CARD_HEIGHT + GAP}
        width={containerWidth}
      >
        {Cell}
      </Grid>
    </div>
  );
}

export default ProductList;
```

---

## 🧪 6. TESTING SETUP

### **jest.config.js**
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/firebase.js',
    '!src/**/*.stories.{js,jsx}',
    '!src/**/*.test.{js,jsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### **__tests__/components/ProductCard.test.jsx**
```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductCard from '../../components/ProductCard';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithProviders = (component) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

const mockProduct = {
  id: '1',
  nombre: 'Producto Test',
  precio: 25000,
  stock: 10,
  categorias: ['Categoria 1', 'Categoria 2'],
  empresa: {
    nombre: 'Empresa Test',
    logo: '/logo.jpg',
    verified: true
  },
  rating: 4.5,
  reviewCount: 23,
  imagenes: ['/imagen1.jpg']
};

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    renderWithProviders(
      <ProductCard product={mockProduct} />
    );

    expect(screen.getByText('Producto Test')).toBeInTheDocument();
    expect(screen.getByText('$25.000')).toBeInTheDocument();
    expect(screen.getByText('Stock: 10')).toBeInTheDocument();
    expect(screen.getByText('Empresa Test')).toBeInTheDocument();
    expect(screen.getByText('(23 reseñas)')).toBeInTheDocument();
  });

  it('handles favorite toggle correctly', async () => {
    const { container } = renderWithProviders(
      <ProductCard product={mockProduct} />
    );

    const favoriteButton = screen.getByLabelText('Agregar a favoritos');
    fireEvent.click(favoriteButton);

    await waitFor(() => {
      expect(favoriteButton).toHaveAttribute('aria-label', 'Quitar de favoritos');
    });
  });

  it('calls onViewDetail when view details button is clicked', () => {
    const mockOnViewDetail = jest.fn();
    
    renderWithProviders(
      <ProductCard 
        product={mockProduct} 
        onViewDetail={mockOnViewDetail}
      />
    );

    const viewButton = screen.getByText('Ver Detalles');
    fireEvent.click(viewButton);

    expect(mockOnViewDetail).toHaveBeenCalledWith('1');
  });

  it('displays correct price format', () => {
    renderWithProviders(
      <ProductCard product={mockProduct} />
    );

    expect(screen.getByText('$25.000')).toBeInTheDocument();
  });

  it('shows stock badge when stock is available', () => {
    renderWithProviders(
      <ProductCard product={mockProduct} />
    );

    expect(screen.getByText('Stock: 10')).toBeInTheDocument();
  });
});
```

---

## 🚀 7. OPTIMIZACIONES DE PERFORMANCE

### **utils/performance.js**
```javascript
import { memo, useMemo, useCallback } from 'react';

// HOC para memoización avanzada
export function withMemoization(Component, arePropsEqual) {
  return memo(Component, arePropsEqual);
}

// Hook para debouncing
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook para throttling
export function useThrottle(value, limit) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// Lazy loading de imágenes
export function useLazyImage(src, fallback = '/images/placeholder.jpg') {
  const [imageSrc, setImageSrc] = useState(fallback);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    img.src = src;
  }, [src]);

  return { imageSrc, isLoaded };
}
```

---

## 📊 8. MONITORING Y ANALYTICS

### **utils/analytics.js**
```javascript
class AnalyticsService {
  constructor() {
    this.events = [];
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  track(event, properties = {}) {
    const eventData = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        url: window.location.href
      }
    };

    this.events.push(eventData);
    
    // Enviar a servicio de analytics
    this.sendToAnalytics(eventData);
  }

  async sendToAnalytics(eventData) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
    } catch (error) {
      console.error('Error sending analytics:', error);
    }
  }

  // Eventos específicos
  trackProductView(productId, productName) {
    this.track('product_view', {
      productId,
      productName
    });
  }

  trackSearch(query, resultCount) {
    this.track('search', {
      query,
      resultCount
    });
  }

  trackFilterApplied(filterType, filterValue) {
    this.track('filter_applied', {
      filterType,
      filterValue
    });
  }
}

export const analytics = new AnalyticsService();

// Hook para usar analytics
export function useAnalytics() {
  return {
    trackProductView: analytics.trackProductView.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackFilterApplied: analytics.trackFilterApplied.bind(analytics)
  };
}
```

---

Este documento proporciona implementaciones específicas y listas para usar que resuelven los problemas críticos identificados en la evaluación. Cada sección incluye código completo, optimizado y con mejores prácticas implementadas.

Los próximos pasos serían:
1. **Implementar estos cambios gradualmente**
2. **Crear tests para cada componente**
3. **Monitorear performance en desarrollo**
4. **Deploy gradual con feature flags**
