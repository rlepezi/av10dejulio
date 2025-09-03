import React, { useState } from 'react';
import { UserCleanupService } from '../utils/deleteUser';
import { UserCreationService } from '../utils/userCreationService';

export default function UserCleanupAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userStatus, setUserStatus] = useState(null);

  const checkUser = async () => {
    if (!email) {
      setMessage('❌ Por favor ingresa un email');
      return;
    }

    setLoading(true);
    setMessage('🔍 Verificando usuario...');
    
    try {
      const status = await UserCleanupService.checkUserExists(email);
      setUserStatus(status);
      setMessage('✅ Verificación completada. Revisa la consola para más detalles.');
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async () => {
    if (!email) {
      setMessage('❌ Por favor ingresa un email');
      return;
    }

    setLoading(true);
    setMessage('🗑️ Eliminando usuario...');
    
    try {
      const result = await UserCleanupService.deleteClientUser(email);
      if (result.success) {
        setMessage('✅ Usuario eliminado correctamente');
        setUserStatus(null);
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const recreateUser = async () => {
    if (!email || !password) {
      setMessage('❌ Por favor ingresa email y contraseña');
      return;
    }

    setLoading(true);
    setMessage('🔄 Recreando usuario...');
    
    try {
      // Crear datos de solicitud simulados
      const solicitudData = {
        nombres: email.split('@')[0],
        apellidos: 'Cliente',
        email: email,
        password_hash: btoa(password), // Codificar en base64
        telefono: 'No especificado',
        direccion: 'No especificada',
        comuna: 'No especificada',
        region: 'No especificada',
        rut: 'No especificado',
        fecha_nacimiento: null,
        genero: ''
      };

      const result = await UserCreationService.createClientUser(solicitudData);
      
      if (result.success) {
        setMessage('✅ Usuario recreado correctamente. Ahora debería poder iniciar sesión.');
        setUserStatus(null);
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🔄 Limpieza y Recreación de Usuarios Cliente</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email del Usuario
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="clepez@gmail.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nueva Contraseña (para recrear)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nueva contraseña"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={checkUser}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            🔍 Verificar Usuario
          </button>
          
          <button
            onClick={deleteUser}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            🗑️ Eliminar Usuario
          </button>
          
          <button
            onClick={recreateUser}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            🔄 Recrear Usuario
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-md ${
            message.includes('✅') ? 'bg-green-100 text-green-800' :
            message.includes('❌') ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {message}
          </div>
        )}

        {userStatus && (
          <div className="bg-gray-100 p-4 rounded-md">
            <h3 className="font-semibold mb-2">📊 Estado del Usuario:</h3>
            <div className="text-sm space-y-1">
              <div><strong>Email:</strong> {userStatus.email}</div>
              <div><strong>En usuarios:</strong> {userStatus.existsInUsuarios ? '✅ Sí' : '❌ No'}</div>
              <div><strong>En perfiles:</strong> {userStatus.existsInPerfiles ? '✅ Sí' : '❌ No'}</div>
              {userStatus.usuariosDoc && (
                <div><strong>UID en usuarios:</strong> {userStatus.usuariosDoc.uid}</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Instrucciones:</h3>
        <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
          <li>Ingresa el email del usuario a limpiar</li>
          <li>Haz clic en "Verificar Usuario" para ver su estado actual</li>
          <li>Haz clic en "Eliminar Usuario" para limpiarlo completamente</li>
          <li>Ingresa una nueva contraseña y haz clic en "Recrear Usuario"</li>
          <li>El usuario ahora debería poder iniciar sesión correctamente</li>
        </ol>
      </div>
    </div>
  );
}

