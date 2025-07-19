import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';

export default function ClientValidationStatus() {
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
      // Buscar primero por userId (nuevo formato)
      let perfilQuery = query(
        collection(db, 'perfiles_clientes'),
        where('userId', '==', user.uid)
      );
      let perfilSnapshot = await getDocs(perfilQuery);
      
      // Si no se encuentra, buscar por uid (formato anterior)
      if (perfilSnapshot.empty) {
        perfilQuery = query(
          collection(db, 'perfiles_clientes'),
          where('uid', '==', user.uid)
        );
        perfilSnapshot = await getDocs(perfilQuery);
      }
      
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

  const calcularDiasEspera = (fechaRegistro) => {
    if (!fechaRegistro) return 0;
    const fecha = fechaRegistro.toDate ? fechaRegistro.toDate() : new Date(fechaRegistro);
    const hoy = new Date();
    const diferencia = hoy - fecha;
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (estado) => {
    const colors = {
      'pendiente_validacion': 'bg-yellow-50 border-yellow-200 text-yellow-800',
      'activo': 'bg-green-50 border-green-200 text-green-800',
      'rechazado': 'bg-red-50 border-red-200 text-red-800',
      'suspendido': 'bg-gray-50 border-gray-200 text-gray-800'
    };
    return colors[estado] || colors['pendiente_validacion'];
  };

  const getStatusIcon = (estado) => {
    const icons = {
      'pendiente_validacion': '⏳',
      'activo': '✅',
      'rechazado': '❌',
      'suspendido': '⚠️'
    };
    return icons[estado] || '⏳';
  };

  const getStatusTitle = (estado) => {
    const titles = {
      'pendiente_validacion': 'Solicitud en Revisión',
      'activo': 'Miembro de la Comunidad',
      'rechazado': 'Solicitud Rechazada',
      'suspendido': 'Cuenta Suspendida'
    };
    return titles[estado] || 'Estado Desconocido';
  };

  const getStatusMessage = (estado, diasEspera) => {
    const messages = {
      'pendiente_validacion': `Tu solicitud está siendo revisada por nuestro equipo. Tiempo de espera: ${diasEspera} día${diasEspera !== 1 ? 's' : ''}. Te notificaremos por email y en la app cuando sea aprobada.`,
      'activo': '¡Felicitaciones! Ya eres parte de la comunidad AV10 de Julio. Puedes gestionar tus vehículos y recibir recordatorios personalizados.',
      'rechazado': 'Tu solicitud fue rechazada. Puedes revisar los motivos e intentar registrarte nuevamente.',
      'suspendido': 'Tu cuenta ha sido suspendida temporalmente. Contacta con soporte para más información.'
    };
    return messages[estado] || 'Estado desconocido';
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">👋</div>
            <h2 className="text-2xl font-bold text-blue-800 mb-4">
              ¡Únete a la Comunidad AV10 de Julio!
            </h2>
            <p className="text-blue-700 mb-6">
              Para acceder a todos nuestros servicios automotrices, recordatorios personalizados 
              y gestión de vehículos, necesitas crear tu perfil de cliente.
            </p>
            <button
              onClick={() => navigate('/registro-cliente')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Crear Mi Perfil
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getClientStatus = () => {
    return perfilCliente?.estado || perfilCliente?.estado_validacion || 'pendiente_validacion';
  };

  const diasEspera = calcularDiasEspera(perfilCliente.fechaRegistro);
  const estadoCliente = getClientStatus();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className={`border rounded-lg p-6 ${getStatusColor(estadoCliente)}`}>
          {/* Header del estado */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{getStatusIcon(estadoCliente)}</span>
            <div>
              <h2 className="text-2xl font-bold">
                {getStatusTitle(estadoCliente)}
              </h2>
              <p className="text-sm opacity-75">
                Estado actual de tu cuenta
              </p>
            </div>
          </div>

          {/* Mensaje del estado */}
          <div className="mb-6">
            <p className="text-lg">
              {getStatusMessage(estadoCliente, diasEspera)}
            </p>
          </div>

          {/* Información adicional según el estado */}
          {estadoCliente === 'pendiente_validacion' && (
            <div className="bg-white bg-opacity-50 rounded p-4 mb-4">
              <h3 className="font-semibold mb-2">💡 Mientras esperas puedes:</h3>
              <ul className="space-y-1 text-sm">
                <li>• Explorar nuestros proveedores y servicios</li>
                <li>• Leer recursos y guías automotrices</li>
                <li>• Conocer sobre seguros y revisiones técnicas</li>
                <li>• Contactarnos si tienes preguntas</li>
              </ul>
            </div>
          )}

          {estadoCliente === 'activo' && (
            <div className="bg-white bg-opacity-50 rounded p-4 mb-4">
              <h3 className="font-semibold mb-2">🚀 Ahora puedes:</h3>
              <ul className="space-y-1 text-sm">
                <li>• Gestionar tus vehículos</li>
                <li>• Recibir recordatorios automáticos</li>
                <li>• Acceder a descuentos exclusivos</li>
                <li>• Contactar directamente con proveedores</li>
              </ul>
            </div>
          )}

          {estadoCliente === 'rechazado' && perfilCliente.observaciones && (
            <div className="bg-white bg-opacity-50 rounded p-4 mb-4">
              <h3 className="font-semibold mb-2">📝 Motivo del rechazo:</h3>
              <p className="text-sm">{perfilCliente.observaciones}</p>
            </div>
          )}

          {estadoCliente === 'suspendido' && perfilCliente.observaciones && (
            <div className="bg-white bg-opacity-50 rounded p-4 mb-4">
              <h3 className="font-semibold mb-2">📝 Motivo de la suspensión:</h3>
              <p className="text-sm">{perfilCliente.observaciones}</p>
            </div>
          )}

          {/* Acciones según el estado */}
          <div className="flex gap-3">
            {estadoCliente === 'activo' && (
              <button
                onClick={() => navigate('/dashboard/cliente')}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-semibold"
              >
                Ir a Mi Dashboard
              </button>
            )}
            
            {estadoCliente === 'rechazado' && (
              <button
                onClick={() => navigate('/registro-cliente')}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold"
              >
                Intentar Nuevamente
              </button>
            )}
            
            {perfilCliente.estado === 'suspendido' && (
              <button
                onClick={() => navigate('/contacto')}
                className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 font-semibold"
              >
                Contactar Soporte
              </button>
            )}
            
            <button
              onClick={() => navigate('/recursos')}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Ver Recursos
            </button>
            
            <button
              onClick={() => navigate('/proveedores')}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Explorar Proveedores
            </button>
          </div>

          {/* Información del perfil */}
          <div className="mt-8 pt-6 border-t border-current border-opacity-20">
            <h3 className="font-semibold mb-3">📋 Información Registrada</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="opacity-75">Nombre:</span>
                <p className="font-medium">{perfilCliente.nombres} {perfilCliente.apellidos}</p>
              </div>
              <div>
                <span className="opacity-75">RUT:</span>
                <p className="font-medium">{perfilCliente.rut}</p>
              </div>
              <div>
                <span className="opacity-75">Email:</span>
                <p className="font-medium">{perfilCliente.email}</p>
              </div>
              <div>
                <span className="opacity-75">Teléfono:</span>
                <p className="font-medium">{perfilCliente.telefono}</p>
              </div>
              <div>
                <span className="opacity-75">Ubicación:</span>
                <p className="font-medium">{perfilCliente.comuna}, {perfilCliente.region}</p>
              </div>
              <div>
                <span className="opacity-75">Fecha de registro:</span>
                <p className="font-medium">
                  {perfilCliente.fechaRegistro?.toDate?.()?.toLocaleDateString('es-CL') || 'No disponible'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
