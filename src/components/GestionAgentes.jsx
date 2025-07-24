import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

export default function GestionAgentes() {
  const { user } = useAuth();
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrandoModal, setMostrandoModal] = useState(false);
  const [editandoAgente, setEditandoAgente] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    zona_asignada: '',
    password: '',
    generar_password: false,
    enviar_email: false,
    activo: true
  });
  const [procesando, setProcesando] = useState(false);
  const [mostrandoModalClave, setMostrandoModalClave] = useState(false);
  const [agenteParaClave, setAgenteParaClave] = useState(null);
  const [nuevaClave, setNuevaClave] = useState('');

  useEffect(() => {
    cargarAgentes();
  }, []);

  const cargarAgentes = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'agentes'), orderBy('nombre'));
      const snapshot = await getDocs(q);
      const agentesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAgentes(agentesData);
    } catch (error) {
      console.error('Error cargando agentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generarPasswordSegura = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return password;
  };

  const handleGenerarPassword = () => {
    const nuevaPassword = generarPasswordSegura();
    setFormData(prev => ({
      ...prev,
      password: nuevaPassword,
      generar_password: true
    }));
  };

  const abrirModal = (agente = null) => {
    if (agente) {
      setEditandoAgente(agente);
      setFormData({
        nombre: agente.nombre || '',
        email: agente.email || '',
        telefono: agente.telefono || '',
        zona_asignada: agente.zona_asignada || '',
        password: '',
        generar_password: false,
        enviar_email: false,
        activo: agente.activo !== false
      });
    } else {
      setEditandoAgente(null);
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        zona_asignada: '',
        password: '',
        generar_password: false,
        enviar_email: false,
        activo: true
      });
    }
    setMostrandoModal(true);
  };

  const cerrarModal = () => {
    setMostrandoModal(false);
    setEditandoAgente(null);
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      zona_asignada: '',
      password: '',
      generar_password: false,
      enviar_email: false,
      activo: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email || (!editandoAgente && !formData.password)) {
      alert('Por favor, completa todos los campos requeridos. La contraseña es obligatoria para nuevos agentes.');
      return;
    }

    if (!editandoAgente && formData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setProcesando(true);

      if (editandoAgente) {
        // Actualizar agente existente
        const agenteData = {
          nombre: formData.nombre,
          telefono: formData.telefono,
          zona_asignada: formData.zona_asignada,
          activo: formData.activo,
          fecha_actualizacion: new Date(),
          admin_responsable: user?.email
        };

        await updateDoc(doc(db, 'agentes', editandoAgente.id), agenteData);
        alert('Agente actualizado exitosamente');
      } else {
        // Crear nuevo agente
        // NOTA: En un entorno de producción, la creación de usuarios debería 
        // hacerse a través de Firebase Admin SDK en el backend para no interferir 
        // con la sesión del admin actual.
        
        // Por ahora, crearemos el registro del agente con las credenciales
        // y mostraremos las instrucciones para que el agente se registre
        
        // Normalizar email
        const emailNormalizado = formData.email.trim().toLowerCase();
        
        const agenteData = {
          nombre: formData.nombre,
          email: emailNormalizado,
          telefono: formData.telefono,
          zona_asignada: formData.zona_asignada,
          rol: 'agente',
          activo: formData.activo,
          fecha_creacion: new Date(),
          admin_creador: user?.email,
          password_temporal: formData.password, // Guardar para mostrar al admin
          requiere_registro: true, // Indica que el agente debe registrarse
          permisos: {
            crear_solicitudes: true,
            activar_empresas: true,
            gestionar_perfil: true
          }
        };

        const agenteRef = await addDoc(collection(db, 'agentes'), agenteData);
        
        // También crear registro en la colección usuarios con estado pendiente
        await addDoc(collection(db, 'usuarios'), {
          email: emailNormalizado,
          nombre: formData.nombre,
          rol: 'agente',
          estado: 'pendiente_registro', // El agente debe completar el registro
          fecha_creacion: new Date(),
          agente_id: agenteRef.id
        });

        alert(`✅ Agente creado exitosamente!\n\n📋 CREDENCIALES PARA EL AGENTE:\n👤 Email: ${emailNormalizado}\n🔑 Contraseña: ${formData.password}\n\n⚠️ INSTRUCCIONES:\n• Envía estas credenciales al agente\n• El agente debe registrarse en la plataforma con estos datos\n• Una vez registrado, podrá acceder a su panel\n\n📧 Email normalizado: ${emailNormalizado}`);
      }

      await cargarAgentes();
      cerrarModal();
    } catch (error) {
      console.error('Error guardando agente:', error);
      if (error.code === 'auth/email-already-in-use') {
        alert('Este email ya está registrado en el sistema');
      } else if (error.code === 'auth/weak-password') {
        alert('La contraseña debe tener al menos 6 caracteres');
      } else {
        alert('Error al guardar el agente: ' + error.message);
      }
    } finally {
      setProcesando(false);
    }
  };

  const toggleEstadoAgente = async (agente) => {
    try {
      await updateDoc(doc(db, 'agentes', agente.id), {
        activo: !agente.activo,
        fecha_actualizacion: new Date()
      });
      await cargarAgentes();
      alert(`Agente ${!agente.activo ? 'activado' : 'desactivado'} exitosamente`);
    } catch (error) {
      console.error('Error cambiando estado del agente:', error);
      alert('Error al cambiar el estado del agente');
    }
  };

  const eliminarAgente = async (agente) => {
    if (window.confirm(`¿Estás seguro de eliminar al agente ${agente.nombre}? Esta acción no se puede deshacer.`)) {
      try {
        await deleteDoc(doc(db, 'agentes', agente.id));
        await cargarAgentes();
        alert('Agente eliminado exitosamente');
      } catch (error) {
        console.error('Error eliminando agente:', error);
        alert('Error al eliminar el agente');
      }
    }
  };

  const abrirModalClave = (agente) => {
    setAgenteParaClave(agente);
    setNuevaClave('');
    setMostrandoModalClave(true);
  };

  const cerrarModalClave = () => {
    setMostrandoModalClave(false);
    setAgenteParaClave(null);
    setNuevaClave('');
  };

  const generarClaveParaAgente = () => {
    const nuevaClave = generarPasswordSegura();
    setNuevaClave(nuevaClave);
  };

  const cambiarClaveAgente = async () => {
    if (!nuevaClave || nuevaClave.length < 6) {
      alert('La nueva clave debe tener al menos 6 caracteres');
      return;
    }

    try {
      setProcesando(true);
      
      // Actualizar la contraseña temporal en el registro del agente
      await updateDoc(doc(db, 'agentes', agenteParaClave.id), {
        password_temporal: nuevaClave,
        ultima_actualizacion_clave: new Date(),
        admin_que_cambio_clave: user?.email,
        requiere_cambio_clave: true // Flag para indicar que debe cambiar su contraseña
      });

      alert(`✅ Nueva contraseña temporal asignada para ${agenteParaClave.nombre}:\n\n📧 Email: ${agenteParaClave.email}\n🔑 Nueva contraseña: ${nuevaClave}\n\n⚠️ IMPORTANTE:\n• El agente debe usar esta nueva contraseña en su próximo acceso\n• Si ya está registrado, debe cambiar su contraseña desde su perfil\n• Si no está registrado, debe usar /registro-agente con estas credenciales`);
      
      await cargarAgentes();
      cerrarModalClave();
    } catch (error) {
      console.error('Error cambiando clave:', error);
      alert('Error al cambiar la clave del agente');
    } finally {
      setProcesando(false);
    }
  };

  const estadisticas = {
    total: agentes.length,
    activos: agentes.filter(a => a.activo !== false).length,
    inactivos: agentes.filter(a => a.activo === false).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando agentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Agentes de Campo</h2>
        <p className="text-gray-600">
          Administra los agentes que pueden crear solicitudes y activar empresas en terreno
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-800">{estadisticas.total}</div>
          <div className="text-blue-600 text-sm">Total Agentes</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-800">{estadisticas.activos}</div>
          <div className="text-green-600 text-sm">Agentes Activos</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-800">{estadisticas.inactivos}</div>
          <div className="text-red-600 text-sm">Agentes Inactivos</div>
        </div>
      </div>

      {/* Botón agregar */}
      <div className="mb-6">
        <button
          onClick={() => abrirModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ➕ Agregar Nuevo Agente
        </button>
      </div>

      {/* Lista de agentes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zona Asignada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Creación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {agentes.map((agente) => (
                <tr key={agente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{agente.nombre}</div>
                      <div className="text-sm text-gray-500">ID: {agente.id.slice(-6)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div>{agente.email}</div>
                      <div className="text-gray-500">{agente.telefono}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {agente.zona_asignada || 'Sin asignar'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      agente.activo !== false 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {agente.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {agente.fecha_creacion?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => abrirModal(agente)}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => abrirModalClave(agente)}
                        className="text-purple-600 hover:text-purple-800 text-sm underline"
                        title="Cambiar contraseña del agente"
                      >
                        🔑 Clave
                      </button>
                      <button
                        onClick={() => toggleEstadoAgente(agente)}
                        className={`text-sm underline ${
                          agente.activo !== false 
                            ? 'text-red-600 hover:text-red-800' 
                            : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        {agente.activo !== false ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => eliminarAgente(agente)}
                        className="text-red-600 hover:text-red-800 text-sm underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {agentes.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay agentes registrados</p>
            <button
              onClick={() => abrirModal()}
              className="mt-2 text-blue-600 hover:text-blue-800 underline"
            >
              Agregar el primer agente
            </button>
          </div>
        )}
      </div>

      {/* Modal de agregar/editar agente */}
      {mostrandoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editandoAgente ? 'Editar Agente' : 'Agregar Nuevo Agente'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={editandoAgente} // No permitir cambiar email en edición
                />
              </div>

              {!editandoAgente && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={!editandoAgente}
                        minLength={6}
                        placeholder="Ingresa contraseña (mínimo 6 caracteres)"
                      />
                      <button
                        type="button"
                        onClick={handleGenerarPassword}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        title="Generar contraseña segura automáticamente"
                      >
                        🎲 Generar
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      El agente podrá iniciar sesión inmediatamente con estas credenciales
                    </p>
                  </div>

                  {formData.password && formData.password.length >= 6 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 mb-2">✅ Credenciales listas</h4>
                      <div className="bg-white p-3 rounded border font-mono text-sm">
                        <strong>Usuario:</strong> {formData.email || '(ingresa email)'}<br/>
                        <strong>Contraseña:</strong> {formData.password}
                      </div>
                      <p className="text-sm text-green-700 mt-2">
                        📱 Envía estas credenciales al agente de forma segura (WhatsApp, email, etc.)
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zona asignada
                </label>
                <input
                  type="text"
                  value={formData.zona_asignada}
                  onChange={(e) => setFormData(prev => ({ ...prev, zona_asignada: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Santiago Centro, Las Condes, etc."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="activo" className="ml-2 text-sm text-gray-700">
                  Agente activo
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  disabled={procesando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {procesando ? 'Guardando...' : (editandoAgente ? 'Actualizar' : 'Crear Agente')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Información sobre permisos */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">🔐 Permisos de los Agentes:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Crear solicitudes de registro de empresas</li>
          <li>• Activar empresas directamente desde terreno</li>
          <li>• Gestionar su perfil y zona asignada</li>
          <li>• Ver empresas de su zona</li>
        </ul>
      </div>

      {/* Modal para cambiar contraseña */}
      {mostrandoModalClave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🔑 Cambiar Contraseña - {agenteParaClave?.nombre}
              </h3>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Agente:</strong> {agenteParaClave?.nombre}<br/>
                    <strong>Email:</strong> {agenteParaClave?.email}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={nuevaClave}
                      onChange={(e) => setNuevaClave(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      minLength={6}
                      placeholder="Ingresa nueva contraseña (mín. 6 caracteres)"
                    />
                    <button
                      type="button"
                      onClick={generarClaveParaAgente}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Generar contraseña segura"
                    >
                      🎲
                    </button>
                  </div>
                </div>

                {nuevaClave && nuevaClave.length >= 6 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800 mb-2">
                      <strong>Nuevas credenciales:</strong>
                    </p>
                    <div className="bg-white p-2 rounded border font-mono text-sm">
                      <strong>Usuario:</strong> {agenteParaClave?.email}<br/>
                      <strong>Contraseña:</strong> {nuevaClave}
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Importante:</strong> Envía las nuevas credenciales al agente de forma segura.
                    El agente podrá usar la nueva contraseña inmediatamente.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={cerrarModalClave}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={procesando}
                >
                  Cancelar
                </button>
                <button
                  onClick={cambiarClaveAgente}
                  disabled={procesando || !nuevaClave || nuevaClave.length < 6}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {procesando ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
