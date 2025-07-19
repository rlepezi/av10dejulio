import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';

export default function EstadoCliente() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [perfilCliente, setPerfilCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkClientProfile();
    }
  }, [user]);

  const checkClientProfile = async () => {
    try {
      const perfilQuery = query(
        collection(db, 'perfiles_clientes'),
        where('userId', '==', user.uid)
      );
      const perfilSnapshot = await getDocs(perfilQuery);
      
      if (!perfilSnapshot.empty) {
        const perfil = { id: perfilSnapshot.docs[0].id, ...perfilSnapshot.docs[0].data() };
        setPerfilCliente(perfil);
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoInfo = (estado) => {
    const estados = {
      'pendiente_validacion': {
        color: 'yellow',
        titulo: 'Validación Pendiente',
        descripcion: 'Tu solicitud está siendo revisada por nuestro equipo',
        icono: '⏳',
        accion: 'Esperar validación'
      },
      'activo': {
        color: 'green',
        titulo: 'Perfil Activo',
        descripcion: 'Tu perfil ha sido validado. Ya puedes usar todos nuestros servicios',
        icono: '✅',
        accion: 'Ir al Dashboard'
      },
      'rechazado': {
        color: 'red',
        titulo: 'Solicitud Rechazada',
        descripcion: 'Tu solicitud ha sido rechazada. Revisa los comentarios y vuelve a intentar',
        icono: '❌',
        accion: 'Crear nuevo perfil'
      },
      'suspendido': {
        color: 'gray',
        titulo: 'Perfil Suspendido',
        descripcion: 'Tu perfil ha sido suspendido temporalmente',
        icono: '⚠️',
        accion: 'Contactar soporte'
      }
    };

    return estados[estado] || estados['pendiente_validacion'];
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'No disponible';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAccion = () => {
    if (!perfilCliente) {
      navigate('/registro-cliente');
      return;
    }

    switch (perfilCliente.estado) {
      case 'activo':
        navigate('/dashboard/cliente');
        break;
      case 'rechazado':
        navigate('/registro-cliente');
        break;
      case 'suspendido':
        navigate('/contacto');
        break;
      default:
        // Pendiente - no hacer nada
        break;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-6"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!perfilCliente) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📋</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Sin Perfil de Cliente</h1>
              <p className="text-gray-600 mb-6">
                No tienes un perfil de cliente registrado. Para acceder a todos nuestros servicios 
                y gestionar tus vehículos, necesitas crear tu perfil.
              </p>
              <button
                onClick={() => navigate('/registro-cliente')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Crear Mi Perfil
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const estadoInfo = getEstadoInfo(perfilCliente.estado);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-8">
            <div className={`w-16 h-16 bg-${estadoInfo.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <span className="text-4xl">{estadoInfo.icono}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{estadoInfo.titulo}</h1>
            <p className="text-gray-600">{estadoInfo.descripcion}</p>
          </div>

          {/* Timeline del proceso */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-800 mb-4">Proceso de Validación</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Perfil Registrado</p>
                  <p className="text-sm text-gray-600">{formatFecha(perfilCliente.fechaRegistro)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 ${perfilCliente.estado === 'pendiente_validacion' ? 'bg-yellow-500' : 'bg-green-500'} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs">{perfilCliente.estado === 'pendiente_validacion' ? '⏳' : '✓'}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Revisión por Admin</p>
                  <p className="text-sm text-gray-600">
                    {perfilCliente.estado === 'pendiente_validacion' ? 'En proceso...' : formatFecha(perfilCliente.fechaValidacion)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 ${perfilCliente.estado === 'activo' ? 'bg-green-500' : 'bg-gray-300'} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs">{perfilCliente.estado === 'activo' ? '✓' : '○'}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Acceso Completo</p>
                  <p className="text-sm text-gray-600">
                    {perfilCliente.estado === 'activo' ? 'Dashboard y servicios disponibles' : 'Pendiente de validación'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Información del perfil */}
          <div className="border-t pt-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Información Registrada</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Nombre:</span>
                <p className="font-medium">{perfilCliente.nombres} {perfilCliente.apellidos}</p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-medium">{perfilCliente.email}</p>
              </div>
              <div>
                <span className="text-gray-600">Teléfono:</span>
                <p className="font-medium">{perfilCliente.telefono}</p>
              </div>
              <div>
                <span className="text-gray-600">Ubicación:</span>
                <p className="font-medium">{perfilCliente.comuna}, {perfilCliente.region}</p>
              </div>
            </div>
          </div>

          {/* Observaciones del admin */}
          {perfilCliente.observaciones && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-gray-800 mb-2">Comentarios del Administrador</h4>
              <p className="text-gray-700 text-sm">{perfilCliente.observaciones}</p>
            </div>
          )}

          {/* Botón de acción */}
          <div className="text-center">
            {perfilCliente.estado !== 'pendiente_validacion' && (
              <button
                onClick={handleAccion}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  perfilCliente.estado === 'activo'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : perfilCliente.estado === 'rechazado'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {estadoInfo.accion}
              </button>
            )}
            
            {perfilCliente.estado === 'pendiente_validacion' && (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Tu solicitud será revisada en un plazo máximo de 48 horas.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Volver al Inicio
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
