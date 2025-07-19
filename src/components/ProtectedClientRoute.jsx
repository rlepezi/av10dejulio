import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';

export default function ProtectedClientRoute({ children }) {
  const { user, rol } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [perfilCliente, setPerfilCliente] = useState(null);

  useEffect(() => {
    if (user && rol !== 'admin' && rol !== 'proveedor' && rol !== 'mecanico') {
      checkClientStatus();
    } else {
      setLoading(false);
    }
  }, [user, rol]);

  const checkClientStatus = async () => {
    try {
      console.log('ProtectedClientRoute: Checking client status for user:', user.uid);
      
      // Buscar primero por userId (nuevo formato)
      let perfilQuery = query(
        collection(db, 'perfiles_clientes'),
        where('userId', '==', user.uid)
      );
      let perfilSnapshot = await getDocs(perfilQuery);
      
      console.log('ProtectedClientRoute: Query by userId found:', perfilSnapshot.size, 'documents');
      
      // Si no se encuentra, buscar por uid (formato anterior)
      if (perfilSnapshot.empty) {
        perfilQuery = query(
          collection(db, 'perfiles_clientes'),
          where('uid', '==', user.uid)
        );
        perfilSnapshot = await getDocs(perfilQuery);
        console.log('ProtectedClientRoute: Query by uid found:', perfilSnapshot.size, 'documents');
      }
      
      if (perfilSnapshot.empty) {
        console.log('ProtectedClientRoute: No profile found, redirecting to registro-cliente');
        // No tiene perfil, redirigir a registro
        navigate('/registro-cliente');
        return;
      }
      
      const perfil = { id: perfilSnapshot.docs[0].id, ...perfilSnapshot.docs[0].data() };
      setPerfilCliente(perfil);
      console.log('ProtectedClientRoute: Profile found:', perfil);
      
      // Verificar el estado (puede estar en 'estado' o 'estado_validacion')
      const estadoCliente = perfil.estado || perfil.estado_validacion;
      console.log('ProtectedClientRoute: Client status:', estadoCliente);
      
      if (estadoCliente !== 'activo') {
        console.log('ProtectedClientRoute: Client not active, redirecting to registro-cliente');
        // Perfil no validado, redirigir a registro (mostrará estado)
        navigate('/registro-cliente');
        return;
      }
      
      console.log('ProtectedClientRoute: Client is active, allowing access');
      
    } catch (error) {
      console.error('Error checking client status:', error);
      navigate('/registro-cliente');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si es admin, proveedor o mecánico, permitir acceso directo
  if (rol === 'admin' || rol === 'proveedor' || rol === 'mecanico') {
    return children;
  }

  // Si es cliente validado, permitir acceso
  if (perfilCliente) {
    const estadoCliente = perfilCliente.estado || perfilCliente.estado_validacion;
    if (estadoCliente === 'activo') {
      return children;
    }
  }

  // Si llegó aquí, no debería mostrar nada (ya fue redirigido)
  return null;
}

// HOC para rutas específicas de servicios
export function withClientProtection(Component) {
  return function ProtectedComponent(props) {
    return (
      <ProtectedClientRoute>
        <Component {...props} />
      </ProtectedClientRoute>
    );
  };
}
