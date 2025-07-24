import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

export default function DebugAgenteSesion() {
  const { user } = useAuth();
  const [datosAgente, setDatosAgente] = useState(null);
  const [datosUsuario, setDatosUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      verificarDatosAgente();
    }
  }, [user]);

  const verificarDatosAgente = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Verificar datos en colección usuarios
      const qUsuarios = query(
        collection(db, 'usuarios'),
        where('uid', '==', user.uid)
      );
      const usuariosSnapshot = await getDocs(qUsuarios);
      
      if (!usuariosSnapshot.empty) {
        setDatosUsuario(usuariosSnapshot.docs[0].data());
      }

      // 2. Verificar datos en colección agentes
      const qAgentes = query(
        collection(db, 'agentes'),
        where('uid', '==', user.uid)
      );
      const agentesSnapshot = await getDocs(qAgentes);
      
      if (!agentesSnapshot.empty) {
        const agenteDoc = agentesSnapshot.docs[0];
        setDatosAgente({
          id: agenteDoc.id,
          ...agenteDoc.data()
        });
      } else {
        setError('No se encontraron datos de agente para este usuario');
      }

    } catch (err) {
      console.error('Error verificando datos:', err);
      setError('Error verificando datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">No hay usuario autenticado</h2>
          <p className="text-red-600">Debes hacer login primero para ver esta información.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center">
          <p>Verificando datos del agente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug: Sesión de Agente</h1>
      
      {/* Información del usuario de Firebase Auth */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">🔐 Usuario de Firebase Auth</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>UID:</strong> {user.uid}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
          <div>
            <p><strong>Email Verificado:</strong> {user.emailVerified ? '✅ Sí' : '❌ No'}</p>
            <p><strong>Fecha Creación:</strong> {new Date(user.metadata.creationTime).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Información de la colección usuarios */}
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">👤 Datos en colección 'usuarios'</h2>
        {datosUsuario ? (
          <div className="bg-white p-3 rounded border">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(datosUsuario, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-gray-600">No se encontraron datos en la colección 'usuarios'</p>
        )}
      </div>

      {/* Información de la colección agentes */}
      <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">🕵️ Datos en colección 'agentes'</h2>
        {datosAgente ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p><strong>ID Documento:</strong> {datosAgente.id}</p>
                <p><strong>Nombre:</strong> {datosAgente.nombre}</p>
                <p><strong>Email:</strong> {datosAgente.email}</p>
                <p><strong>Activo:</strong> {datosAgente.activo ? '✅ Sí' : '❌ No'}</p>
              </div>
              <div>
                <p><strong>Zona:</strong> {datosAgente.zona_asignada}</p>
                <p><strong>Requiere Registro:</strong> {datosAgente.requiere_registro ? '🔶 Sí' : '✅ No'}</p>
                <p><strong>Fecha Creación:</strong> {datosAgente.fecha_creacion?.toDate?.()?.toLocaleString() || 'N/A'}</p>
                <p><strong>UID Firebase:</strong> {datosAgente.uid}</p>
              </div>
            </div>
            
            {datosAgente.permisos && (
              <div className="bg-white p-3 rounded border">
                <h3 className="font-semibold mb-2">Permisos:</h3>
                <pre className="text-sm">
                  {JSON.stringify(datosAgente.permisos, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-red-100 border border-red-300 p-3 rounded">
            <p className="text-red-700 font-semibold">❌ No se encontraron datos de agente</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}
      </div>

      {/* Diagnóstico */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">🔍 Diagnóstico</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${user ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>Usuario autenticado en Firebase Auth</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${datosUsuario ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            <span>Registro en colección 'usuarios'</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${datosAgente ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>Registro en colección 'agentes'</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${datosAgente?.activo ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>Agente activo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${!datosAgente?.requiere_registro ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            <span>Registro completado</span>
          </div>
        </div>

        {datosAgente && datosAgente.activo && !datosAgente.requiere_registro ? (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
            <p className="text-green-800 font-semibold">✅ Todo está configurado correctamente</p>
            <p className="text-green-700 text-sm">El agente debería poder acceder a todas las funciones.</p>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
            <p className="text-red-800 font-semibold">❌ Hay problemas de configuración</p>
            <p className="text-red-700 text-sm">El agente puede tener acceso limitado o nulo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
