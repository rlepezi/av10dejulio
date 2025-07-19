import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import useNotifications from '../hooks/useNotifications';

const AdminNotificaciones = ({ user }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({
    titulo: '',
    cuerpo: '',
    tipo: 'general', // general, admin, proveedor, cliente, agente
    url: ''
  });

  const { token, requestPermission, sendTestNotification } = useNotifications(user);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const usuariosRef = collection(db, 'usuarios');
      const q = query(
        usuariosRef, 
        where('notificationsEnabled', '==', true),
        orderBy('lastTokenUpdate', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      const usuariosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const enviarNotificacion = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Guardar notificación en la base de datos
      const notificacionData = {
        ...mensaje,
        fechaEnvio: new Date(),
        enviadoPor: user.uid,
        estado: 'enviada',
        destinatarios: usuarios.length
      };

      await addDoc(collection(db, 'notificaciones'), notificacionData);

      // En un entorno real, aquí harías una llamada a tu backend
      // que use Firebase Admin SDK para enviar a múltiples tokens
      console.log('Notificación guardada:', notificacionData);
      console.log('Tokens destinatarios:', usuarios.map(u => u.notificationToken));

      alert(`Notificación enviada a ${usuarios.length} usuarios`);
      
      // Limpiar formulario
      setMensaje({
        titulo: '',
        cuerpo: '',
        tipo: 'general',
        url: ''
      });

    } catch (error) {
      console.error('Error al enviar notificación:', error);
      alert('Error al enviar notificación');
    } finally {
      setLoading(false);
    }
  };

  const configurarNotificaciones = async () => {
    const granted = await requestPermission();
    if (granted) {
      alert('Notificaciones configuradas correctamente');
      cargarUsuarios(); // Recargar para incluir el token del admin
    } else {
      alert('Permisos de notificación denegados');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Gestión de Notificaciones Push
        </h2>

        {/* Estado de configuración */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Estado de configuración</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Token personal:</span> 
              {token ? (
                <span className="text-green-600 ml-2">✓ Configurado</span>
              ) : (
                <span className="text-red-600 ml-2">✗ No configurado</span>
              )}
            </p>
            <p className="text-sm">
              <span className="font-medium">Usuarios con notificaciones:</span> 
              <span className="ml-2 font-bold">{usuarios.length}</span>
            </p>
          </div>
          
          {!token && (
            <button
              onClick={configurarNotificaciones}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Configurar Notificaciones
            </button>
          )}
        </div>

        {/* Formulario de envío */}
        <form onSubmit={enviarNotificacion} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título de la notificación
            </label>
            <input
              type="text"
              value={mensaje.titulo}
              onChange={(e) => setMensaje({...mensaje, titulo: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Nueva campaña disponible"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje
            </label>
            <textarea
              value={mensaje.cuerpo}
              onChange={(e) => setMensaje({...mensaje, cuerpo: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Contenido de la notificación..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de notificación
              </label>
              <select
                value={mensaje.tipo}
                onChange={(e) => setMensaje({...mensaje, tipo: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="admin">Solo Administradores</option>
                <option value="proveedor">Solo Proveedores</option>
                <option value="cliente">Solo Clientes</option>
                <option value="agente">Solo Agentes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de destino (opcional)
              </label>
              <input
                type="url"
                value={mensaje.url}
                onChange={(e) => setMensaje({...mensaje, url: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading || usuarios.length === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Enviando...' : `Enviar a ${usuarios.length} usuarios`}
            </button>

            {token && (
              <button
                type="button"
                onClick={sendTestNotification}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
              >
                Enviar Prueba Personal
              </button>
            )}
          </div>
        </form>

        {/* Lista de usuarios */}
        {usuarios.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Usuarios con notificaciones activas</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
              {usuarios.map(usuario => (
                <div key={usuario.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <div>
                    <span className="font-medium">{usuario.email}</span>
                    <span className="ml-2 text-sm text-gray-500">({usuario.rol})</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {usuario.lastTokenUpdate?.toDate?.()?.toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotificaciones;
