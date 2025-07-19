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
  doc,
  getDocs
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

export function useAgentes(filters = {}) {
  const options = {
    where: filters.activo !== undefined ? ['activo', '==', filters.activo] : null,
    orderBy: ['fechaCreacion', 'desc'],
    realtime: true
  };
  
  return useFirestoreCollection('agentes', options);
}
