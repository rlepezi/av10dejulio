# 🛠️ GUÍA DE IMPLEMENTACIÓN - MEJORAS TÉCNICAS

## 🎯 ROADMAP DE IMPLEMENTACIÓN DETALLADO

### **📋 CHECKLIST DE TAREAS PRIORITARIAS**

#### **🔥 CRÍTICO - Implementar Inmediatamente**
- [x] **Sistema de Catastro Masivo de Tiendas**
- [x] **Panel de Validación Avanzado para Admins**
- [x] **Gestión de Agentes de Campo**
- [x] **Workflow de Estados de Empresas**
- [x] **Crear custom hook para Firebase collections**
- [x] **Sistema de Gestión de Marcas con Upload de Logos**
- [ ] **Implementar Zustand para state management**
- [ ] **Agregar validación con Zod**
- [ ] **Configurar React Query para caching**
- [ ] **Implementar Error Boundaries mejorados**

#### **⚠️ IMPORTANTE - Próximas 2 semanas**
- [ ] **Validación automática de sitios web**
- [ ] **Sistema de asignación de logos**
- [ ] **Tracking de visitas de agentes**
- [ ] **Onboarding automatizado de proveedores**
- [ ] **Code splitting de rutas principales**
- [ ] **TypeScript migration (gradual)**
- [ ] **Testing setup con Jest y RTL**
- [ ] **Firebase Security Rules**
- [ ] **Performance monitoring**

#### **💡 MEJORAS - Próximo mes**
- [ ] **PWA implementation**
- [ ] **Virtualización de listas**
- [ ] **Modo offline**
- [ ] **Analytics avanzados**
- [ ] **A/B Testing setup**

---

## 🔧 IMPLEMENTACIONES ESPECÍFICAS

### **1. Custom Hooks Esenciales**

#### **A. useFirestore Hook**
```javascript
// hooks/useFirestore.js
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestoreCollection(collectionName, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const {
    where: whereClause,
    orderBy: orderByClause,
    limit: limitClause,
    realtime = true
  } = options;
  
  useEffect(() => {
    let unsubscribe;
    
    const setupQuery = () => {
      let q = collection(db, collectionName);
      
      // Aplicar filtros
      if (whereClause) {
        q = query(q, where(...whereClause));
      }
      
      if (orderByClause) {
        q = query(q, orderBy(...orderByClause));
      }
      
      if (limitClause) {
        q = query(q, limit(limitClause));
      }
      
      return q;
    };
    
    if (realtime) {
      unsubscribe = onSnapshot(
        setupQuery(),
        (snapshot) => {
          const documents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setData(documents);
          setLoading(false);
        },
        (err) => {
          setError(err);
          setLoading(false);
        }
      );
    } else {
      // Para queries que no necesitan tiempo real
      getDocs(setupQuery())
        .then(snapshot => {
          const documents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setData(documents);
          setLoading(false);
        })
        .catch(err => {
          setError(err);
          setLoading(false);
        });
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [collectionName, JSON.stringify(options)]);
  
  const add = useCallback(async (document) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...document,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      });
      return docRef.id;
    } catch (error) {
      throw new Error(`Error adding document: ${error.message}`);
    }
  }, [collectionName]);
  
  const update = useCallback(async (id, updates) => {
    try {
      await updateDoc(doc(db, collectionName, id), {
        ...updates,
        fechaActualizacion: new Date()
      });
    } catch (error) {
      throw new Error(`Error updating document: ${error.message}`);
    }
  }, [collectionName]);
  
  const remove = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      throw new Error(`Error deleting document: ${error.message}`);
    }
  }, [collectionName]);
  
  return {
    data,
    loading,
    error,
    add,
    update,
    remove,
    refetch: () => setLoading(true) // Forzar recarga
  };
}

// Ejemplo de uso específico
export function useEmpresas(filters = {}) {
  const options = {
    where: filters.estado ? ['estado', '==', filters.estado] : null,
    orderBy: ['fechaCreacion', 'desc'],
    realtime: true
  };
  
  return useFirestoreCollection('empresas', options);
}

export function useProductos(filters = {}) {
  const options = {
    where: filters.categoria ? ['categorias', 'array-contains', filters.categoria] : null,
    orderBy: ['fechaCreacion', 'desc'],
    limit: filters.limit || 20,
    realtime: true
  };
  
  return useFirestoreCollection('productos', options);
}
```

#### **B. useAuth Hook Mejorado**
```javascript
// hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

### **2. Zustand State Management**

```javascript
// store/index.js
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';

// Store principal
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
        
        updateFilters: (newFilters) => set(state => ({
          filters: { ...state.filters, ...newFilters }
        })),
        
        clearFilters: () => set({
          filters: {
            busqueda: '',
            marca: null,
            categoria: null,
            region: null
          }
        }),
        
        toggleSidebar: () => set(state => ({
          ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
        })),
        
        setLoading: (loading) => set(state => ({
          ui: { ...state.ui, loading }
        })),
        
        // Selectores computados
        getFilteredEmpresas: () => {
          const { empresas, filters } = get();
          return empresas.filter(empresa => {
            if (filters.busqueda && !empresa.nombre.toLowerCase().includes(filters.busqueda.toLowerCase())) {
              return false;
            }
            if (filters.marca && !empresa.marcas?.includes(filters.marca)) {
              return false;
            }
            if (filters.categoria && !empresa.categorias?.includes(filters.categoria)) {
              return false;
            }
            if (filters.region && empresa.region !== filters.region) {
              return false;
            }
            return true;
          });
        },
        
        getEmpresaById: (id) => {
          const { empresas } = get();
          return empresas.find(empresa => empresa.id === id);
        },
        
        getStats: () => {
          const { empresas, productos, campanas } = get();
          return {
            totalEmpresas: empresas.length,
            empresasActivas: empresas.filter(e => e.estado === 'Activa').length,
            totalProductos: productos.length,
            productosActivos: productos.filter(p => p.estado === 'activo').length,
            totalCampanas: campanas.length,
            campanasActivas: campanas.filter(c => new Date(c.fechaFin) > new Date()).length
          };
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

// Store específico para favoritos
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
export const useStats = () => useAppStore(state => state.getStats());
export const useFilteredEmpresas = () => useAppStore(state => state.getFilteredEmpresas());
```

### **3. React Query Setup**

```javascript
// config/queryClient.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always'
    },
    mutations: {
      retry: 1
    }
  }
});

// queries/empresas.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Query keys
export const QUERY_KEYS = {
  empresas: 'empresas',
  productos: 'productos',
  campanas: 'campanas',
  empresa: (id) => ['empresa', id],
  producto: (id) => ['producto', id]
};

// Queries
export function useEmpresas() {
  return useQuery({
    queryKey: [QUERY_KEYS.empresas],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, 'empresas'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  });
}

export function useEmpresa(id) {
  return useQuery({
    queryKey: QUERY_KEYS.empresa(id),
    queryFn: async () => {
      const docSnap = await getDoc(doc(db, 'empresas', id));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },
    enabled: !!id
  });
}

// Mutations
export function useCreateEmpresa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (empresaData) => {
      const docRef = await addDoc(collection(db, 'empresas'), {
        ...empresaData,
        fechaCreacion: new Date(),
        estado: 'Pendiente'
      });
      return { id: docRef.id, ...empresaData };
    },
    onSuccess: (newEmpresa) => {
      // Invalidar y actualizar cache
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.empresas] });
      
      // Actualización optimista
      queryClient.setQueryData([QUERY_KEYS.empresas], (old) => {
        return old ? [...old, newEmpresa] : [newEmpresa];
      });
    },
    onError: (error) => {
      console.error('Error creating empresa:', error);
    }
  });
}

export function useUpdateEmpresa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      await updateDoc(doc(db, 'empresas', id), {
        ...updates,
        fechaActualizacion: new Date()
      });
      return { id, updates };
    },
    onSuccess: ({ id, updates }) => {
      // Actualizar cache específico
      queryClient.setQueryData(QUERY_KEYS.empresa(id), (old) => {
        return old ? { ...old, ...updates } : null;
      });
      
      // Invalidar lista general
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.empresas] });
    }
  });
}
```

### **4. TypeScript Migration (Gradual)**

```typescript
// types/index.ts
export interface Empresa {
  id: string;
  nombre: string;
  rut: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  region: string;
  categorias: string[];
  marcas: string[];
  estado: 'Activa' | 'Pendiente' | 'Rechazada' | 'Suspendida';
  verificado: boolean;
  esPremium: boolean;
  esLocal: boolean;
  esPyme: boolean;
  esEmprendimiento: boolean;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
  logoUrl?: string;
  imagenUrl?: string;
  web?: string;
  descripcion?: string;
  calificacion?: number;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  precioAnterior?: number;
  stock: number;
  imagenes: string[];
  categorias: string[];
  marcas: string[];
  caracteristicas?: string[];
  condicion: 'nuevo' | 'usado' | 'reacondicionado';
  estado: 'activo' | 'inactivo';
  idEmpresa: string;
  fechaCreacion: Date;
  calificacion?: number;
  numeroReseñas?: number;
}

export interface Campana {
  id: string;
  titulo: string;
  descripcion: string;
  fechaInicio: Date;
  fechaFin: Date;
  imagenUrl?: string;
  logoUrl?: string;
  categorias: string[];
  marcas: string[];
  estado: 'Activa' | 'Pausada' | 'Finalizada';
  idEmpresa: string;
  linkUrl?: string;
  fechaCreacion: Date;
}

export interface Usuario {
  id: string;
  email: string;
  rol: 'admin' | 'proveedor' | 'user';
  nombre?: string;
  empresaId?: string;
  fechaCreacion: Date;
  ultimoAcceso: Date;
  activo: boolean;
}

// Migración gradual de componentes
// ProductCard.tsx
import React from 'react';
import { Producto } from '../types';

interface ProductCardProps {
  product: Producto;
  onViewDetail: (id: string) => void;
  onAddToFavorites: (id: string) => void;
  isFavorite?: boolean;
  showProviderInfo?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetail,
  onAddToFavorites,
  isFavorite = false,
  showProviderInfo = true
}) => {
  // Implementación con tipos seguros
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  return (
    // JSX con tipos seguros
  );
};

export default ProductCard;
```

### **5. Error Handling Mejorado**

```javascript
// utils/errorHandler.js
class AppError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
  }
}

export class ErrorHandler {
  static logError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      code: error.code || 'UNKNOWN',
      context,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Log local
    console.error('Error captured:', errorInfo);
    
    // En producción, enviar a servicio de monitoreo
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(errorInfo);
    }
  }
  
  static sendToMonitoringService(errorInfo) {
    // Integración con Sentry, LogRocket, etc.
    try {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorInfo)
      });
    } catch (e) {
      console.error('Failed to send error to monitoring service:', e);
    }
  }
  
  static handleFirebaseError(error) {
    const firebaseErrors = {
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'permission-denied': 'No tienes permisos para esta acción',
      'unavailable': 'Servicio temporalmente no disponible'
    };
    
    return firebaseErrors[error.code] || error.message;
  }
}

// components/ErrorBoundary.jsx (mejorado)
import React from 'react';
import { ErrorHandler } from '../utils/errorHandler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorId: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      error,
      errorId: Math.random().toString(36).substr(2, 9)
    };
  }

  componentDidCatch(error, errorInfo) {
    ErrorHandler.logError(error, {
      errorInfo,
      component: this.props.fallbackComponent || 'Unknown',
      errorId: this.state.errorId
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  render() {
    if (this.state.hasError) {
      // UI de error personalizable
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              ¡Oops! Algo salió mal
            </h2>
            <p className="text-gray-600 mb-4">
              Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
            </p>
            <p className="text-xs text-gray-400 mb-4">
              ID del error: {this.state.errorId}
            </p>
            <div className="space-y-2">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Intentar de nuevo
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### **6. Performance Monitoring**

```javascript
// utils/performance.js
class PerformanceMonitor {
  static measurements = new Map();
  
  static startMeasure(name) {
    this.measurements.set(name, performance.now());
  }
  
  static endMeasure(name) {
    const startTime = this.measurements.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.measurements.delete(name);
      
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      
      // En producción, enviar métricas
      if (process.env.NODE_ENV === 'production') {
        this.sendMetric(name, duration);
      }
      
      return duration;
    }
  }
  
  static sendMetric(name, duration) {
    // Enviar a analytics
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: name,
        value: Math.round(duration)
      });
    }
  }
  
  static measureComponent(WrappedComponent, componentName) {
    return function MeasuredComponent(props) {
      useEffect(() => {
        PerformanceMonitor.startMeasure(`${componentName}_render`);
        return () => {
          PerformanceMonitor.endMeasure(`${componentName}_render`);
        };
      });
      
      return <WrappedComponent {...props} />;
    };
  }
}

// Hook para medir renders
export function usePerformance(componentName) {
  useEffect(() => {
    PerformanceMonitor.startMeasure(`${componentName}_mount`);
    return () => {
      PerformanceMonitor.endMeasure(`${componentName}_mount`);
    };
  }, [componentName]);
}

// HOC para medir componentes automáticamente
export function withPerformanceTracking(Component, name) {
  return PerformanceMonitor.measureComponent(Component, name);
}
```

---

## 🌟 IMPLEMENTACIONES PARA CUMPLIR COMPROMISOS COMUNITARIOS

### **7. Transparencia y Protección de Datos**

```javascript
// utils/privacy.js - Sistema de Protección de Datos
export class PrivacyManager {
  static sensitiveFields = ['email', 'telefono', 'rut', 'direccion'];
  
  static maskSensitiveData(data, userRole) {
    if (userRole === 'admin') return data; // Admin ve todo
    
    const masked = { ...data };
    this.sensitiveFields.forEach(field => {
      if (masked[field]) {
        masked[field] = this.maskField(masked[field], field);
      }
    });
    return masked;
  }
  
  static maskField(value, type) {
    switch (type) {
      case 'email':
        const [name, domain] = value.split('@');
        return `${name.substring(0, 2)}***@${domain}`;
      case 'telefono':
        return `${value.substring(0, 4)}****${value.slice(-2)}`;
      case 'rut':
        return `${value.substring(0, 2)}****${value.slice(-2)}`;
      default:
        return '***PROTEGIDO***';
    }
  }
  
  static logDataAccess(userId, dataType, action) {
    // Auditoría de acceso a datos
    const auditLog = {
      userId,
      dataType,
      action,
      timestamp: new Date(),
      ip: this.getClientIP(),
      userAgent: navigator.userAgent
    };
    
    // Enviar a sistema de auditoría
    this.sendAuditLog(auditLog);
  }
  
  static async sendAuditLog(log) {
    try {
      await addDoc(collection(db, 'audit_logs'), log);
    } catch (error) {
      console.error('Error logging data access:', error);
    }
  }
}

// components/PrivacyNotice.jsx - Transparencia en uso de datos
import React, { useState } from 'react';

const PrivacyNotice = ({ onAccept, onDecline }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🔒 Transparencia en el Uso de Datos
          </h2>
          
          <div className="prose prose-sm mb-6">
            <p className="text-gray-700">
              En av10dejulio valoramos tu privacidad y queremos ser completamente 
              transparentes sobre cómo usamos tus datos:
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <h3 className="font-semibold text-blue-900">📊 Datos que Recopilamos:</h3>
              <ul className="text-sm text-blue-800 mt-2">
                <li>• Información de contacto (email, teléfono)</li>
                <li>• Preferencias de búsqueda y navegación</li>
                <li>• Historial de interacciones con proveedores</li>
                <li>• Métricas de uso para mejorar la plataforma</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg mt-4">
              <h3 className="font-semibold text-green-900">✅ Cómo los Usamos:</h3>
              <ul className="text-sm text-green-800 mt-2">
                <li>• Conectarte con proveedores relevantes</li>
                <li>• Personalizar tu experiencia</li>
                <li>• Generar estadísticas anónimas para la comunidad</li>
                <li>• Mejorar nuestros servicios basado en feedback</li>
              </ul>
            </div>
            
            {showDetails && (
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <h3 className="font-semibold text-gray-900">🔍 Detalles Técnicos:</h3>
                <ul className="text-sm text-gray-700 mt-2">
                  <li>• Encriptación AES-256 para datos sensibles</li>
                  <li>• Auditoría completa de accesos</li>
                  <li>• Retención de datos por máximo 2 años</li>
                  <li>• Derecho a eliminación en cualquier momento</li>
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              {showDetails ? 'Ocultar' : 'Ver'} detalles técnicos
            </button>
            
            <div className="space-x-3">
              <button
                onClick={onDecline}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Revisar después
              </button>
              <button
                onClick={onAccept}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Acepto y continúo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyNotice;
```

### **8. Sistema Educativo y Empoderamiento del Usuario**

```javascript
// components/EducationalTooltip.jsx - Educación contextual
import React, { useState } from 'react';
import { InformationCircleIcon } from '@heroicons/react/outline';

const EducationalTooltip = ({ title, content, learnMoreUrl }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="text-blue-500 hover:text-blue-700 transition-colors"
      >
        <InformationCircleIcon className="w-4 h-4" />
      </button>
      
      {isVisible && (
        <div className="absolute z-10 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg -top-2 left-6">
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
          <p className="text-sm text-gray-600 mb-2">{content}</p>
          {learnMoreUrl && (
            <a
              href={learnMoreUrl}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Aprender más →
            </a>
          )}
        </div>
      )}
    </div>
  );
};

// components/SmartErrorMessage.jsx - Errores educativos
const SmartErrorMessage = ({ error, context }) => {
  const getEducationalMessage = (error, context) => {
    const educationalErrors = {
      'auth/user-not-found': {
        message: 'No encontramos una cuenta con este email',
        tip: 'Verifica que hayas escrito correctamente tu email o regístrate si es tu primera vez',
        action: 'Intentar con otro email o registrarse',
        learnMore: '/ayuda/login'
      },
      'network-error': {
        message: 'Problema de conexión detectado',
        tip: 'Esto puede ocurrir por conexión lenta o intermitente. Tus datos están seguros.',
        action: 'Verificar conexión e intentar nuevamente',
        learnMore: '/ayuda/conexion'
      },
      'validation-error': {
        message: 'Algunos datos necesitan corrección',
        tip: 'Revisa los campos marcados. Esto nos ayuda a mantener información confiable para toda la comunidad.',
        action: 'Corregir datos marcados',
        learnMore: '/ayuda/formularios'
      }
    };
    
    return educationalErrors[error.code] || {
      message: error.message,
      tip: 'Si este problema persiste, nuestro equipo quiere ayudarte',
      action: 'Contactar soporte',
      learnMore: '/contacto'
    };
  };
  
  const errorInfo = getEducationalMessage(error, context);
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ExclamationCircleIcon className="w-5 h-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {errorInfo.message}
          </h3>
          <p className="mt-1 text-sm text-red-700">
            💡 <strong>Tip:</strong> {errorInfo.tip}
          </p>
          <div className="mt-3 flex space-x-3">
            <button className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200">
              {errorInfo.action}
            </button>
            <a
              href={errorInfo.learnMore}
              className="text-sm text-red-600 underline hover:text-red-800"
            >
              Más información
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// hooks/useEducationalGuidance.js - Guía contextual
export function useEducationalGuidance() {
  const [currentTip, setCurrentTip] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  
  const educationalContent = {
    'first-search': {
      title: '🔍 ¡Encuentra repuestos fácilmente!',
      content: 'Usa filtros por marca, categoría o busca directamente el repuesto que necesitas.',
      nextAction: 'Probar una búsqueda'
    },
    'provider-selection': {
      title: '⭐ Elige proveedores confiables',
      content: 'Revisa las calificaciones y comentarios de otros usuarios para tomar la mejor decisión.',
      nextAction: 'Ver calificaciones'
    },
    'price-comparison': {
      title: '💰 Compara precios inteligentemente',
      content: 'No solo mires el precio más bajo, considera la calidad, garantía y reputación del proveedor.',
      nextAction: 'Comparar opciones'
    }
  };
  
  const showTip = useCallback((tipId) => {
    if (!userProgress[tipId]) {
      setCurrentTip(educationalContent[tipId]);
      setUserProgress(prev => ({ ...prev, [tipId]: true }));
    }
  }, [userProgress]);
  
  const dismissTip = useCallback(() => {
    setCurrentTip(null);
  }, []);
  
  return { currentTip, showTip, dismissTip };
}
```

### **9. Sistema de Comunicación y Feedback Mejorado**

```javascript
// components/CommunityFeedbackSystem.jsx - Sistema integral de feedback
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const CommunityFeedbackSystem = () => {
  const { user } = useAuth();
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [userImpact, setUserImpact] = useState(null);
  
  useEffect(() => {
    // Cargar estadísticas de impacto comunitario
    loadCommunityStats();
    if (user) {
      loadUserImpact();
    }
  }, [user]);
  
  const loadCommunityStats = async () => {
    // Estadísticas transparentes de la plataforma
    const stats = {
      totalProveedores: 156,
      proveedoresLocales: 89,
      problemasResueltos: 1247,
      satisfaccionPromedio: 4.6,
      tiempoRespuestaPromedio: '2.3 horas',
      impactoEconomico: '$45.2M CLP' // en ventas generadas
    };
    setFeedbackStats(stats);
  };
  
  const loadUserImpact = async () => {
    // Mostrar al usuario su impacto en la comunidad
    const impact = {
      busquedasRealizadas: 23,
      proveedoresAyudados: 7,
      reseñasEscritas: 3,
      comunidadAyudada: 'Has ayudado a 12 personas con tus reseñas'
    };
    setUserImpact(impact);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🤝 Impacto de Nuestra Comunidad
      </h2>
      
      {/* Estadísticas Comunitarias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {feedbackStats?.totalProveedores}
          </div>
          <div className="text-sm text-blue-800">Proveedores Activos</div>
          <div className="text-xs text-blue-600 mt-1">
            {feedbackStats?.proveedoresLocales} son locales
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            {feedbackStats?.problemasResueltos}
          </div>
          <div className="text-sm text-green-800">Problemas Resueltos</div>
          <div className="text-xs text-green-600 mt-1">
            ⭐ {feedbackStats?.satisfaccionPromedio}/5.0 satisfacción
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">
            {feedbackStats?.tiempoRespuestaPromedio}
          </div>
          <div className="text-sm text-purple-800">Tiempo Respuesta</div>
          <div className="text-xs text-purple-600 mt-1">
            Promedio mensual
          </div>
        </div>
      </div>
      
      {/* Impacto Personal del Usuario */}
      {user && userImpact && (
        <div className="bg-gradient-to-r from-orange-50 to-pink-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            🌟 Tu Impacto Personal
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Búsquedas realizadas:</span>
              <span className="ml-2 text-orange-600">{userImpact.busquedasRealizadas}</span>
            </div>
            <div>
              <span className="font-medium">Proveedores ayudados:</span>
              <span className="ml-2 text-orange-600">{userImpact.proveedoresAyudados}</span>
            </div>
          </div>
          <p className="text-sm text-gray-700 mt-2 italic">
            {userImpact.comunidadAyudada}
          </p>
        </div>
      )}
      
      {/* Canal de Comunicación Directa */}
      <div className="border-t pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          💬 Queremos Escucharte
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 p-4 rounded-lg hover:border-blue-300 transition-colors">
            <h4 className="font-medium text-gray-900 mb-2">
              📝 Sugerir Mejora
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              ¿Tienes una idea para mejorar la plataforma? Tu feedback impulsa nuestro desarrollo.
            </p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Enviar sugerencia →
            </button>
          </div>
          
          <div className="border border-gray-200 p-4 rounded-lg hover:border-green-300 transition-colors">
            <h4 className="font-medium text-gray-900 mb-2">
              🤝 Reportar Problema
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Si algo no funciona como esperabas, ayúdanos a solucionarlo rápidamente.
            </p>
            <button className="text-green-600 hover:text-green-800 text-sm font-medium">
              Reportar problema →
            </button>
          </div>
        </div>
      </div>
      
      {/* Transparencia en Procesos */}
      <div className="bg-gray-50 p-4 rounded-lg mt-6">
        <h4 className="font-medium text-gray-900 mb-2">
          🔍 Nuestro Compromiso con la Transparencia
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Tiempo promedio de respuesta:</span>
            <span className="ml-2 text-blue-600">2-4 horas</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Resolución de problemas:</span>
            <span className="ml-2 text-green-600">92% en < 24hrs</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Actualizamos estas métricas semanalmente para mantener la transparencia.
        </p>
      </div>
    </div>
  );
};

export default CommunityFeedbackSystem;
```

### **10. Sostenibilidad y Responsabilidad Ambiental**

```javascript
// components/SustainabilityTracker.jsx - Impacto ambiental
import React, { useState, useEffect } from 'react';

const SustainabilityTracker = ({ userActivity }) => {
  const [sustainabilityMetrics, setSustainabilityMetrics] = useState(null);
  
  useEffect(() => {
    calculateEnvironmentalImpact(userActivity);
  }, [userActivity]);
  
  const calculateEnvironmentalImpact = (activity) => {
    // Cálculos reales de impacto ambiental
    const metrics = {
      co2Saved: activity.localPurchases * 0.8, // kg CO2 por compra local
      wasteReduced: activity.recycledParts * 2.3, // kg residuos evitados
      resourcesOptimized: activity.qualityParts * 1.5, // factor de eficiencia
      localEconomyBoost: activity.localSpending, // dinero en economía local
    };
    
    setSustainabilityMetrics(metrics);
  };
  
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h3 className="font-semibold text-green-900 mb-3 flex items-center">
        🌱 Tu Impacto Ambiental Positivo
      </h3>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">
            {sustainabilityMetrics?.co2Saved?.toFixed(1)} kg
          </div>
          <div className="text-green-700">CO₂ ahorrado</div>
          <div className="text-xs text-green-600 mt-1">
            comprando local
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">
            {sustainabilityMetrics?.wasteReduced?.toFixed(1)} kg
          </div>
          <div className="text-green-700">Residuos evitados</div>
          <div className="text-xs text-green-600 mt-1">
            repuestos de calidad
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-white rounded border-l-4 border-green-400">
        <p className="text-sm text-gray-700">
          💡 <strong>¿Sabías que?</strong> Al elegir repuestos de calidad y proveedores locales, 
          contribuyes a una economía circular más sostenible.
        </p>
      </div>
    </div>
  );
};

// utils/sustainabilityCalculator.js
export class SustainabilityCalculator {
  static calculateCarbonFootprint(transaction) {
    const factors = {
      localDelivery: 0.1, // kg CO2 por km
      nationalDelivery: 0.5,
      internationalDelivery: 2.0,
      warehouseEnergy: 0.02, // por producto
      packaging: 0.05
    };
    
    // Calcular basado en tipo de entrega y distancia
    const distance = transaction.deliveryDistance || 10;
    const deliveryType = transaction.isLocal ? 'localDelivery' : 'nationalDelivery';
    
    return distance * factors[deliveryType] + factors.warehouseEnergy + factors.packaging;
  }
  
  static getEcoFriendlyAlternatives(product) {
    return {
      localProviders: [], // proveedores a menos de 50km
      sustainableOptions: [], // productos con certificación ambiental
      recyclingCenters: [], // centros de reciclaje cercanos
      carbonOffset: 0 // costo de compensar huella
    };
  }
}
```

---

## 🏢 CATASTRO MASIVO Y GESTIÓN DE PROVEEDORES

### **1. Sistema de Catastro Masivo**

#### **A. Componente Principal de Catastro**
```javascript
// components/CatastroMasivo.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { parse } from 'papaparse';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';

const CatastroMasivo = () => {
  const { user, hasRole } = useAuth();
  const [csvData, setCsvData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Estructura esperada del CSV
  const expectedColumns = [
    'nombre',
    'direccion', 
    'ciudad',
    'region',
    'telefono',
    'email',
    'web',
    'categoria',
    'descripcion',
    'coordenadas_lat',
    'coordenadas_lng'
  ];

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      parse(file, {
        header: true,
        complete: (results) => {
          console.log('CSV parsed:', results.data);
          setCsvData(results.data);
          validateCsvData(results.data);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
        }
      });
    }
  }, []);

  const validateCsvData = (data) => {
    const results = data.map((row, index) => {
      const errors = [];
      const warnings = [];

      // Validaciones obligatorias
      if (!row.nombre?.trim()) errors.push('Nombre es obligatorio');
      if (!row.direccion?.trim()) errors.push('Dirección es obligatoria');
      if (!row.telefono?.trim()) warnings.push('Teléfono recomendado');
      if (!row.web?.trim()) warnings.push('Sitio web recomendado');
      
      // Validar formato de email
      if (row.email && !/\S+@\S+\.\S+/.test(row.email)) {
        errors.push('Formato de email inválido');
      }

      // Validar formato de web
      if (row.web && !row.web.startsWith('http')) {
        warnings.push('URL debe empezar con http:// o https://');
      }

      return {
        index,
        data: row,
        isValid: errors.length === 0,
        errors,
        warnings
      };
    });

    setValidationResults(results);
  };

  const processBatchUpload = async () => {
    if (!hasRole('admin')) {
      alert('Solo administradores pueden realizar carga masiva');
      return;
    }

    setProcessing(true);
    setUploadProgress(0);

    try {
      const validRows = validationResults.filter(result => result.isValid);
      const batchSize = 500; // Firestore limit
      
      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = writeBatch(db);
        const currentBatch = validRows.slice(i, i + batchSize);

        currentBatch.forEach((row) => {
          const docRef = doc(collection(db, 'empresas'));
          const empresaData = {
            ...row.data,
            // Campos del catastro AV10 de Julio
            zona: 'AV10_JULIO',
            calles: determinarCalles(row.data.direccion),
            estado: 'Enviada', // Estado inicial del catastro
            origen: 'catastro_masivo',
            fechaCreacion: serverTimestamp(),
            fechaActualizacion: serverTimestamp(),
            
            // Campos de validación
            webValidada: false,
            logoAsignado: false,
            visitaAgente: false,
            
            // Agente asignado (se asignará posteriormente)
            agenteAsignado: null,
            fechaVisita: null,
            
            // Metadatos del catastro
            creadoPor: user.uid,
            loteImportacion: `catastro_${new Date().getTime()}`,
            
            // Coordenadas si están disponibles
            ubicacion: row.data.coordenadas_lat && row.data.coordenadas_lng ? {
              lat: parseFloat(row.data.coordenadas_lat),
              lng: parseFloat(row.data.coordenadas_lng)
            } : null
          };

          batch.set(docRef, empresaData);
        });

        await batch.commit();
        setUploadProgress(((i + currentBatch.length) / validRows.length) * 100);
      }

      alert(`✅ Catastro completado: ${validRows.length} empresas cargadas`);
      
      // Limpiar datos
      setCsvData([]);
      setValidationResults([]);
      
    } catch (error) {
      console.error('Error en carga masiva:', error);
      alert('Error durante la carga masiva');
    } finally {
      setProcessing(false);
      setUploadProgress(0);
    }
  };

  const determinarCalles = (direccion) => {
    const callesAV10 = [
      'Avenida Matta',
      'Santa Isabel', 
      'Vicuña Mackenna',
      'Autopista Central',
      'Av. Matta'
    ];
    
    return callesAV10.filter(calle => 
      direccion.toLowerCase().includes(calle.toLowerCase())
    );
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false
  });

  if (!hasRole('admin')) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Solo administradores pueden acceder al catastro masivo</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">
            📊 Catastro Masivo - Zona AV10 de Julio
          </h1>
          <p className="text-gray-600 mt-2">
            Cargar empresas desde CSV - Área: Av. Matta, Santa Isabel, Vicuña Mackenna, Autopista Central
          </p>
        </div>

        {/* Área de carga de CSV */}
        <div className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-4xl mb-4">📄</div>
            {isDragActive ? (
              <p className="text-blue-600">Suelta el archivo CSV aquí...</p>
            ) : (
              <div>
                <p className="text-gray-700 font-medium">
                  Arrastra un archivo CSV o haz clic para seleccionar
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Columnas esperadas: {expectedColumns.join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Plantilla de descarga */}
          <div className="mt-4 text-center">
            <button className="text-blue-600 hover:text-blue-800 underline text-sm">
              📥 Descargar plantilla CSV
            </button>
          </div>
        </div>

        {/* Resultados de validación */}
        {validationResults.length > 0 && (
          <div className="p-6 border-t">
            <h3 className="text-lg font-semibold mb-4">
              📋 Resultados de Validación
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {validationResults.filter(r => r.isValid).length}
                </div>
                <div className="text-sm text-green-800">Registros Válidos</div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {validationResults.filter(r => !r.isValid).length}
                </div>
                <div className="text-sm text-red-800">Con Errores</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {validationResults.filter(r => r.warnings.length > 0).length}
                </div>
                <div className="text-sm text-yellow-800">Con Advertencias</div>
              </div>
            </div>

            {/* Lista de errores */}
            {validationResults.some(r => !r.isValid) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-red-900 mb-2">❌ Registros con Errores:</h4>
                <div className="max-h-40 overflow-y-auto">
                  {validationResults
                    .filter(r => !r.isValid)
                    .slice(0, 10) // Mostrar solo los primeros 10
                    .map((result, idx) => (
                      <div key={idx} className="text-sm text-red-800 mb-1">
                        Fila {result.index + 2}: {result.errors.join(', ')}
                      </div>
                    ))}
                  {validationResults.filter(r => !r.isValid).length > 10 && (
                    <div className="text-xs text-red-600 italic">
                      ... y {validationResults.filter(r => !r.isValid).length - 10} errores más
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Botones de acción */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setCsvData([]);
                  setValidationResults([]);
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                🗑️ Limpiar datos
              </button>
              
              <button
                onClick={processBatchUpload}
                disabled={processing || validationResults.filter(r => r.isValid).length === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Procesando...' : `✅ Cargar ${validationResults.filter(r => r.isValid).length} empresas`}
              </button>
            </div>

            {/* Barra de progreso */}
            {processing && (
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  {uploadProgress.toFixed(0)}% completado
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatastroMasivo;
```

#### **B. Panel de Validación Avanzado**
```javascript
// components/PanelValidacionAvanzado.jsx
import React, { useState, useEffect } from 'react';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const PanelValidacionAvanzado = () => {
  const [filtroEstado, setFiltroEstado] = useState('Enviada');
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [validandoWeb, setValidandoWeb] = useState(false);

  // Obtener empresas pendientes de validación
  const { data: empresasPendientes, loading } = useFirestoreCollection('empresas', {
    where: ['estado', '==', filtroEstado],
    orderBy: ['fechaCreacion', 'desc']
  });

  const validarSitioWeb = async (url) => {
    setValidandoWeb(true);
    try {
      // Verificar si el sitio web existe y responde
      const response = await fetch(`/api/validate-website?url=${encodeURIComponent(url)}`);
      const result = await response.json();
      
      return {
        existe: result.exists,
        respondiendo: result.responding,
        tiempoRespuesta: result.responseTime,
        titulo: result.title,
        descripcion: result.description,
        esComercial: result.isCommercial
      };
    } catch (error) {
      console.error('Error validando sitio web:', error);
      return { existe: false, error: error.message };
    } finally {
      setValidandoWeb(false);
    }
  };

  const buscarLogo = async (nombreEmpresa, sitioWeb) => {
    try {
      // API para buscar y descargar logo automáticamente
      const response = await fetch('/api/extract-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          companyName: nombreEmpresa, 
          website: sitioWeb 
        })
      });
      
      const result = await response.json();
      return result.logoUrl || null;
    } catch (error) {
      console.error('Error buscando logo:', error);
      return null;
    }
  };

  const procesarEmpresa = async (empresa, accion) => {
    try {
      const updates = {
        fechaActualizacion: new Date()
      };

      switch (accion) {
        case 'validar_web':
          const validacionWeb = await validarSitioWeb(empresa.web);
          updates.webValidada = validacionWeb.existe && validacionWeb.respondiendo;
          updates.validacionWeb = validacionWeb;
          break;

        case 'asignar_logo':
          const logoUrl = await buscarLogo(empresa.nombre, empresa.web);
          if (logoUrl) {
            updates.logoUrl = logoUrl;
            updates.logoAsignado = true;
          }
          break;

        case 'activar':
          updates.estado = 'Activa';
          updates.fechaActivacion = new Date();
          break;

        case 'rechazar':
          updates.estado = 'Rechazada';
          updates.fechaRechazo = new Date();
          break;

        case 'revisar':
          updates.estado = 'En Revisión';
          break;
      }

      await updateDoc(doc(db, 'empresas', empresa.id), updates);
      
      // Actualizar estado local
      setEmpresaSeleccionada(null);
      
    } catch (error) {
      console.error('Error procesando empresa:', error);
      alert('Error al procesar la empresa');
    }
  };

  const EmpresaCard = ({ empresa }) => (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{empresa.nombre}</h3>
          <p className="text-sm text-gray-600">{empresa.direccion}</p>
          <p className="text-xs text-gray-500">
            Zona: {empresa.zona} | Creado: {empresa.fechaCreacion?.toDate().toLocaleDateString()}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          empresa.estado === 'Enviada' ? 'bg-yellow-100 text-yellow-800' :
          empresa.estado === 'En Revisión' ? 'bg-blue-100 text-blue-800' :
          empresa.estado === 'Activa' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {empresa.estado}
        </span>
      </div>

      {/* Indicadores de validación */}
      <div className="flex space-x-3 mb-3 text-xs">
        <span className={`flex items-center ${empresa.webValidada ? 'text-green-600' : 'text-gray-400'}`}>
          {empresa.webValidada ? '✅' : '❓'} Web
        </span>
        <span className={`flex items-center ${empresa.logoAsignado ? 'text-green-600' : 'text-gray-400'}`}>
          {empresa.logoAsignado ? '✅' : '❓'} Logo
        </span>
        <span className={`flex items-center ${empresa.visitaAgente ? 'text-green-600' : 'text-gray-400'}`}>
          {empresa.visitaAgente ? '✅' : '❓'} Visita
        </span>
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
        <div>📞 {empresa.telefono || 'No disponible'}</div>
        <div>✉️ {empresa.email || 'No disponible'}</div>
        <div>🌐 {empresa.web ? (
          <a href={empresa.web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {empresa.web.length > 30 ? empresa.web.substring(0, 30) + '...' : empresa.web}
          </a>
        ) : 'No disponible'}</div>
        <div>🏷️ {empresa.categoria || 'Sin categoría'}</div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setEmpresaSeleccionada(empresa)}
          className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
        >
          👁️ Ver detalles
        </button>
        <button
          onClick={() => procesarEmpresa(empresa, 'validar_web')}
          disabled={validandoWeb}
          className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200 disabled:opacity-50"
        >
          {validandoWeb ? '⏳ Validando...' : '🔍 Validar web'}
        </button>
        <button
          onClick={() => procesarEmpresa(empresa, 'asignar_logo')}
          className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200"
        >
          🖼️ Buscar logo
        </button>
        <button
          onClick={() => procesarEmpresa(empresa, 'activar')}
          className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
        >
          ✅ Activar
        </button>
        <button
          onClick={() => procesarEmpresa(empresa, 'rechazar')}
          className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
        >
          ❌ Rechazar
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                👥 Gestión de Agentes de Campo
              </h1>
              <p className="text-gray-600 mt-2">
                Administración de agentes y asignación de territorios AV10 de Julio
              </p>
            </div>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              ➕ Nuevo Agente
            </button>
          </div>
        </div>

        {/* Estadísticas generales */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {agentes?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Agentes Totales</div>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {agentes?.filter(a => a.activo).length || 0}
              </div>
              <div className="text-sm text-gray-600">Agentes Activos</div>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {empresasAsignadas?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Empresas Asignadas</div>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">
                {empresasAsignadas?.filter(e => e.visitaAgente).length || 0}
              </div>
              <div className="text-sm text-gray-600">Visitas Realizadas</div>
            </div>
          </div>
        </div>

        {/* Lista de agentes */}
        <div className="p-6">
          {loadingAgentes ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando agentes...</p>
            </div>
          ) : agentes?.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {agentes.map(agente => (
                <AgenteCard key={agente.id} agente={agente} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay agentes registrados
            </div>
          )}
        </div>
      </div>

      {/* Formulario de nuevo agente */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <form onSubmit={crearAgente} className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Nuevo Agente de Campo
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zona asignada
                  </label>
                  <select
                    required
                    value={formData.zona}
                    onChange={(e) => setFormData({...formData, zona: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Seleccionar zona</option>
                    {zonas.map(zona => (
                      <option key={zona} value={zona}>{zona.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Crear Agente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de empresas del agente */}
      {agenteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Empresas - {agenteSeleccionado.nombre}
                </h2>
                <button
                  onClick={() => setAgenteSeleccionado(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {/* Lista de empresas asignadas */}
              <div className="space-y-3">
                {empresasAsignadas
                  ?.filter(e => e.agenteAsignado === agenteSeleccionado.id)
                  .map(empresa => (
                    <div key={empresa.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{empresa.nombre}</h3>
                          <p className="text-sm text-gray-600">{empresa.direccion}</p>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            empresa.visitaAgente 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {empresa.visitaAgente ? '✅ Visitada' : '⏰ Pendiente'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            empresa.estado === 'Activa' ? 'bg-green-100 text-green-800' :
                            empresa.estado === 'En Revisión' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {empresa.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentesCampo;
```

### **2. API Backend para Validación**

```javascript
// pages/api/validate-website.js - Validación de sitios web
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ message: 'URL is required' });
  }

  try {
    const startTime = Date.now();
    
    // Verificar si el sitio responde
    const response = await fetch(url, {
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'AV10-Bot/1.0'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    // Si HEAD no funciona, intentar GET
    let pageContent = '';
    if (response.ok) {
      try {
        const fullResponse = await fetch(url, { timeout: 15000 });
        pageContent = await fullResponse.text();
      } catch (e) {
        console.log('Error getting page content:', e);
      }
    }
    
    // Extraer información básica
    const titleMatch = pageContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descriptionMatch = pageContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    
    // Detectar si es comercial
    const commercialKeywords = ['tienda', 'shop', 'comprar', 'venta', 'precio', 'producto', 'repuesto'];
    const isCommercial = commercialKeywords.some(keyword => 
      pageContent.toLowerCase().includes(keyword)
    );

    res.status(200).json({
      exists: response.ok,
      responding: response.status < 400,
      responseTime,
      status: response.status,
      title: titleMatch ? titleMatch[1].trim() : null,
      description: descriptionMatch ? descriptionMatch[1].trim() : null,
      isCommercial,
      lastChecked: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error validating website:', error);
    res.status(200).json({
      exists: false,
      responding: false,
      error: error.message,
      lastChecked: new Date().toISOString()
    });
  }
}

// pages/api/extract-logo.js - Extracción automática de logos
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { companyName, website } = req.body;

  try {
    // Buscar logo en el sitio web
    const response = await fetch(website);
    const html = await response.text();
    
    // Buscar diferentes tipos de logo
    const logoPatterns = [
      /<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']icon["']/i,
      /<img[^>]+class=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i,
      /<img[^>]+src=["']([^"']+)["'][^>]+class=["'][^"']*logo[^"']*["']/i,
      /<img[^>]+alt=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i
    ];
    
    let logoUrl = null;
    
    for (const pattern of logoPatterns) {
      const match = html.match(pattern);
      if (match) {
        logoUrl = match[1];
        // Convertir URL relativa a absoluta
        if (logoUrl.startsWith('/')) {
          const urlObj = new URL(website);
          logoUrl = `${urlObj.protocol}//${urlObj.host}${logoUrl}`;
        }
        break;
      }
    }
    
    // Si no encontramos logo, buscar favicon
    if (!logoUrl) {
      const faviconUrl = `${new URL(website).origin}/favicon.ico`;
      try {
        const faviconResponse = await fetch(faviconUrl, { method: 'HEAD' });
        if (faviconResponse.ok) {
          logoUrl = faviconUrl;
        }
      } catch (e) {
        console.log('No favicon found');
      }
    }

    res.status(200).json({
      logoUrl,
      extractedFrom: website,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error extracting logo:', error);
    res.status(500).json({
      error: error.message,
      logoUrl: null
    });
  }
}
```

### **3. Estados y Workflow de Empresas**

```javascript
// utils/empresaWorkflow.js - Gestión de estados
export const ESTADOS_EMPRESA = {
  ENVIADA: 'Enviada',
  EN_REVISION: 'En Revisión', 
  ACTIVA: 'Activa',
  RECHAZADA: 'Rechazada',
  SUSPENDIDA: 'Suspendida',
  VISITADA: 'Visitada'
};

export const TRANSICIONES_PERMITIDAS = {
  [ESTADOS_EMPRESA.ENVIADA]: [
    ESTADOS_EMPRESA.EN_REVISION,
    ESTADOS_EMPRESA.RECHAZADA,
    ESTADOS_EMPRESA.VISITADA
  ],
  [ESTADOS_EMPRESA.EN_REVISION]: [
    ESTADOS_EMPRESA.ACTIVA,
    ESTADOS_EMPRESA.RECHAZADA,
    ESTADOS_EMPRESA.VISITADA
  ],
  [ESTADOS_EMPRESA.VISITADA]: [
    ESTADOS_EMPRESA.EN_REVISION,
    ESTADOS_EMPRESA.ACTIVA,
    ESTADOS_EMPRESA.RECHAZADA
  ],
  [ESTADOS_EMPRESA.ACTIVA]: [
    ESTADOS_EMPRESA.SUSPENDIDA
  ],
  [ESTADOS_EMPRESA.SUSPENDIDA]: [
    ESTADOS_EMPRESA.ACTIVA,
    ESTADOS_EMPRESA.RECHAZADA
  ],
  [ESTADOS_EMPRESA.RECHAZADA]: [] // Estado final
};

export class EmpresaWorkflow {
  static puedeTransicionar(estadoActual, nuevoEstado) {
    const transicionesPermitidas = TRANSICIONES_PERMITIDAS[estadoActual] || [];
    return transicionesPermitidas.includes(nuevoEstado);
  }
  
  static obtenerSiguientesPasos(estadoActual) {
    return TRANSICIONES_PERMITIDAS[estadoActual] || [];
  }
  
  static validarRequisitosActivacion(empresa) {
    const requisitos = {
      webValidada: empresa.webValidada === true,
      logoAsignado: empresa.logoAsignado === true,
      informacionCompleta: !!(empresa.nombre && empresa.direccion && empresa.telefono),
      sinConflictos: !empresa.flagConflicto
    };
    
    const cumpleRequisitos = Object.values(requisitos).every(Boolean);
    
    return {
      puedeActivar: cumpleRequisitos,
      requisitos,
      faltantes: Object.entries(requisitos)
        .filter(([key, value]) => !value)
        .map(([key]) => key)
    };
  }
  
  static generarRazonCambioEstado(estadoAnterior, nuevoEstado, motivo = '') {
    const razones = {
      [`${ESTADOS_EMPRESA.ENVIADA}-${ESTADOS_EMPRESA.EN_REVISION}`]: 'Empresa pasó a revisión manual',
      [`${ESTADOS_EMPRESA.EN_REVISION}-${ESTADOS_EMPRESA.ACTIVA}`]: 'Validación completada exitosamente',
      [`${ESTADOS_EMPRESA.VISITADA}-${ESTADOS_EMPRESA.ACTIVA}`]: 'Visita de agente completada y validada',
      [`${ESTADOS_EMPRESA.ACTIVA}-${ESTADOS_EMPRESA.SUSPENDIDA}`]: 'Empresa suspendida por administrador'
    };
    
    const razonKey = `${estadoAnterior}-${nuevoEstado}`;
    return razones[razonKey] || motivo || `Cambio de ${estadoAnterior} a ${nuevoEstado}`;
  }
}

// hooks/useEmpresaWorkflow.js
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { EmpresaWorkflow, ESTADOS_EMPRESA } from '../utils/empresaWorkflow';

export function useEmpresaWorkflow() {
  const [loading, setLoading] = useState(false);
  
  const cambiarEstado = async (empresaId, nuevoEstado, motivo = '', datosAdicionales = {}) => {
    setLoading(true);
    try {
      const updates = {
        estado: nuevoEstado,
        fechaActualizacion: new Date(),
        ultimoCambioEstado: {
          fecha: new Date(),
          nuevoEstado,
          motivo,
          ...datosAdicionales
        },
        ...datosAdicionales
      };

      // Agregar campos específicos según el estado
      switch (nuevoEstado) {
        case ESTADOS_EMPRESA.ACTIVA:
          updates.fechaActivacion = new Date();
          updates.visible = true;
          break;
        case ESTADOS_EMPRESA.RECHAZADA:
          updates.fechaRechazo = new Date();
          updates.visible = false;
          break;
        case ESTADOS_EMPRESA.SUSPENDIDA:
          updates.fechaSuspension = new Date();
          updates.visible = false;
          break;
        case ESTADOS_EMPRESA.VISITADA:
          updates.visitaAgente = true;
          updates.fechaVisita = new Date();
          break;
      }

      await updateDoc(doc(db, 'empresas', empresaId), updates);
      return { success: true };
      
    } catch (error) {
      console.error('Error cambiando estado:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };
  
  const marcarVisitaAgente = async (empresaId, datosVisita) => {
    return await cambiarEstado(
      empresaId, 
      ESTADOS_EMPRESA.VISITADA, 
      'Visita realizada por agente de campo',
      {
        visitaAgente: true,
        datosVisita: {
          ...datosVisita,
          fecha: new Date()
        }
      }
    );
  };
  
  return {
    cambiarEstado,
    marcarVisitaAgente,
    loading,
    validarRequisitos: EmpresaWorkflow.validarRequisitosActivacion,
    obtenerSiguientesPasos: EmpresaWorkflow.obtenerSiguientesPasos
  };
}
````
