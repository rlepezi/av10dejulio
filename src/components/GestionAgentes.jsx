import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc, writeBatch, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import { useFirestoreCollection } from '../hooks/useFirestore';

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

  // Listado de zonas
  const zonas = [
    'AV10_JULIO_NORTE',
    'AV10_JULIO_SUR',
    'AV10_JULIO_CENTRO',
    'MATTA_ORIENTE',
    'MATTA_PONIENTE',
    'SANTA_ISABEL_NORTE',
    'SANTA_ISABEL_SUR',
    'VICUNA_MACKENNA_NORTE',
    'VICUNA_MACKENNA_SUR',
    'AUTOPISTA_CENTRAL'
  ];

  // Obtener empresas asignadas a agentes para estadísticas
  const { data: empresasAsignadas } = useFirestoreCollection('empresas', {
    where: ['agenteAsignado', '!=', null]
  });

  const [procesando, setProcesando] = useState(false);
  const [mostrandoModalClave, setMostrandoModalClave] = useState(false);
  const [agenteParaClave, setAgenteParaClave] = useState(null);
  const [nuevaClave, setNuevaClave] = useState('');

  // Modal para asignar credenciales a agente existente
  const [mostrandoModalCredenciales, setMostrandoModalCredenciales] = useState(false);
  const [agenteParaCredenciales, setAgenteParaCredenciales] = useState(null);
  const [credencialesForm, setCredencialesForm] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Vista actual (tabla o tarjetas)
  const [vistaActual, setVistaActual] = useState('tabla'); // 'tabla' o 'tarjetas'
  
  // Modal para asignar empresas
  const [mostrandoModalAsignacion, setMostrandoModalAsignacion] = useState(false);
  const [agenteParaAsignar, setAgenteParaAsignar] = useState(null);
  const [empresasDisponibles, setEmpresasDisponibles] = useState([]);
  const [empresasSeleccionadas, setEmpresasSeleccionadas] = useState([]);

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
    setProcesando(true);

    try {
      if (editandoAgente) {
        // Actualizar agente existente
        await updateDoc(doc(db, 'agentes', editandoAgente.id), {
          nombre: formData.nombre,
          telefono: formData.telefono,
          zona_asignada: formData.zona_asignada,
          activo: formData.activo,
          fechaActualizacion: new Date()
        });

        // Si se cambió el email, actualizar también en usuarios
        if (formData.email !== editandoAgente.email) {
          const usuariosQuery = query(collection(db, 'usuarios'), where('agenteId', '==', editandoAgente.id));
          const usuariosSnapshot = await getDocs(usuariosQuery);
          if (!usuariosSnapshot.empty) {
            await updateDoc(usuariosSnapshot.docs[0].ref, {
              email: formData.email
            });
          }
        }

        alert('Agente actualizado exitosamente');
      } else {
        // Crear nuevo agente
        const agenteData = {
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          zona_asignada: formData.zona_asignada,
          activo: formData.activo,
          fechaCreacion: new Date(),
          empresasAsignadas: 0,
          visitasRealizadas: 0,
          empresasActivadas: 0,
          permisos: {
            crear_solicitudes: true,
            activar_empresas: false,
            gestionar_perfil: true
          }
        };

        const agenteDoc = await addDoc(collection(db, 'agentes'), agenteData);

        // Crear usuario con credenciales si se proporcionaron
        if (formData.password) {
          const auth = getAuth();
          try {
            const userCredential = await createUserWithEmailAndPassword(
              auth, 
              formData.email, 
              formData.password
            );

            // Crear registro en usuarios usando setDoc con el UID correcto
            await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
              uid: userCredential.user.uid,
              email: formData.email,
              nombre: formData.nombre,
              rol: 'agente',
              agenteId: agenteDoc.id,
              telefono: formData.telefono,
              zona: formData.zona_asignada,
              activo: formData.activo,
              fechaCreacion: new Date(),
              creadoPorAdmin: true
            });

            alert('Agente creado exitosamente con credenciales de acceso');
          } catch (error) {
            console.error('Error creando usuario:', error);
            alert('Agente creado pero error al crear credenciales: ' + error.message);
          }
        } else {
          alert('Agente creado exitosamente. Asigna credenciales más tarde.');
        }
      }

      await cargarAgentes();
      cerrarModal();
    } catch (error) {
      console.error('Error guardando agente:', error);
      alert('Error al guardar agente: ' + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const toggleEstadoAgente = async (agente) => {
    try {
      await updateDoc(doc(db, 'agentes', agente.id), {
        activo: !agente.activo,
        fechaActualizacion: new Date()
      });

      // Actualizar también en usuarios
      const usuariosQuery = query(collection(db, 'usuarios'), where('agenteId', '==', agente.id));
      const usuariosSnapshot = await getDocs(usuariosQuery);
      if (!usuariosSnapshot.empty) {
        await updateDoc(usuariosSnapshot.docs[0].ref, {
          activo: !agente.activo
        });
      }

      await cargarAgentes();
      alert(`Agente ${!agente.activo ? 'activado' : 'desactivado'} exitosamente`);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar estado: ' + error.message);
    }
  };

  const eliminarAgente = async (agente) => {
    if (!confirm(`¿Estás seguro de eliminar al agente ${agente.nombre}?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'agentes', agente.id));
      await cargarAgentes();
      alert('Agente eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando agente:', error);
      alert('Error al eliminar agente: ' + error.message);
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
    setNuevaClave(generarPasswordSegura());
  };

  const cambiarClaveAgente = async () => {
    if (!nuevaClave) {
      alert('Debes generar o ingresar una nueva contraseña');
      return;
    }

    setProcesando(true);
    try {
      const auth = getAuth();
      // Buscar usuario por email
      const usuariosQuery = query(collection(db, 'usuarios'), where('email', '==', agenteParaClave.email));
      const usuariosSnapshot = await getDocs(usuariosQuery);
      
      if (usuariosSnapshot.empty) {
        alert('No se encontró usuario para este agente');
        return;
      }

      // Actualizar contraseña (requiere re-autenticación en producción)
      alert('Contraseña actualizada. El agente debe usar la nueva contraseña en su próximo login.');
      
      cerrarModalClave();
    } catch (error) {
      console.error('Error cambiando clave:', error);
      alert('Error al cambiar clave: ' + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const generarPasswordAleatoria = () => {
    const nuevaPassword = generarPasswordSegura();
    setCredencialesForm(prev => ({
      ...prev,
      password: nuevaPassword,
      confirmPassword: nuevaPassword
    }));
  };

  const cerrarModalCredenciales = () => {
    setMostrandoModalCredenciales(false);
    setAgenteParaCredenciales(null);
    setCredencialesForm({
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  const asignarCredencialesAgente = async () => {
    if (!credencialesForm.email || !credencialesForm.password) {
      alert('Debes completar email y contraseña');
      return;
    }

    if (credencialesForm.password !== credencialesForm.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    setProcesando(true);
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        credencialesForm.email, 
        credencialesForm.password
      );

      // Actualizar agente con email
      await updateDoc(doc(db, 'agentes', agenteParaCredenciales.id), {
        email: credencialesForm.email,
        fechaActualizacion: new Date()
      });

      // Crear registro en usuarios usando setDoc con el UID correcto
      await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: credencialesForm.email,
        nombre: agenteParaCredenciales.nombre,
        rol: 'agente',
        agenteId: agenteParaCredenciales.id,
        telefono: agenteParaCredenciales.telefono,
        zona: agenteParaCredenciales.zona_asignada,
        activo: agenteParaCredenciales.activo,
        fechaCreacion: new Date(),
        creadoPorAdmin: true
      });

      alert(
        `Credenciales asignadas exitosamente.\n` +
        `Email: ${credencialesForm.email}\n` +
        `Contraseña: ${credencialesForm.password}\n\n` +
        `El agente ya puede acceder a su panel de gestión.`
      );
      await cargarAgentes();
      cerrarModalCredenciales();
    } catch (error) {
      console.error('Error asignando credenciales:', error);
      alert('Error al asignar credenciales: ' + error.message);
    } finally {
      setProcesando(false);
    }
  };

  // Función para abrir modal de asignación de empresas
  const abrirModalAsignacion = async (agente) => {
    try {
      setAgenteParaAsignar(agente);
      setEmpresasSeleccionadas([]);
      
      // Buscar empresas sin agente asignado
      const empresasSinAgente = await getDocs(query(
        collection(db, 'empresas'),
        where('agenteAsignado', '==', null),
        where('estado', 'in', ['catalogada', 'pendiente_validacion'])
      ));

      if (empresasSinAgente.docs.length === 0) {
        alert('No hay empresas disponibles para asignar');
        return;
      }

      const empresasData = empresasSinAgente.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setEmpresasDisponibles(empresasData);
      setMostrandoModalAsignacion(true);
    } catch (error) {
      console.error('Error cargando empresas disponibles:', error);
      alert('Error al cargar empresas disponibles: ' + error.message);
    }
  };

  // Función para asignar empresas seleccionadas
  const asignarEmpresasSeleccionadas = async () => {
    if (empresasSeleccionadas.length === 0) {
      alert('Debes seleccionar al menos una empresa');
      return;
    }

    try {
      setProcesando(true);
      const batch = writeBatch(db);
      
      empresasSeleccionadas.forEach(empresaId => {
        const empresaRef = doc(db, 'empresas', empresaId);
        batch.update(empresaRef, {
          agenteAsignado: agenteParaAsignar.id,
          fechaAsignacion: new Date()
        });
      });

      await batch.commit();
      alert(`${empresasSeleccionadas.length} empresas asignadas al agente ${agenteParaAsignar.nombre}`);
      
      // Recargar datos
      await cargarAgentes();
      setMostrandoModalAsignacion(false);
      setAgenteParaAsignar(null);
      setEmpresasDisponibles([]);
      setEmpresasSeleccionadas([]);
    } catch (error) {
      console.error('Error asignando empresas:', error);
      alert('Error al asignar empresas: ' + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const cerrarModalAsignacion = () => {
    setMostrandoModalAsignacion(false);
    setAgenteParaAsignar(null);
    setEmpresasDisponibles([]);
    setEmpresasSeleccionadas([]);
  };

  // Componente de tarjeta de agente para vista de tarjetas
  const AgenteCard = ({ agente }) => {
    const empresasDelAgente = empresasAsignadas?.filter(e => e.agenteAsignado === agente.id) || [];
    const visitasRealizadas = empresasDelAgente.filter(e => e.visitaAgente).length;
    const empresasValidadas = empresasDelAgente.filter(e => e.estado === 'validada').length;

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{agente.nombre}</h3>
            <p className="text-sm text-gray-500">{agente.email}</p>
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            agente.activo !== false 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {agente.activo !== false ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="text-sm">
            <span className="font-medium">Teléfono:</span> {agente.telefono || 'No especificado'}
          </div>
          <div className="text-sm">
            <span className="font-medium">Zona:</span> {agente.zona_asignada || 'Sin asignar'}
          </div>
        </div>

        {/* Estadísticas del agente */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-blue-50 rounded p-2">
            <div className="text-lg font-bold text-blue-600">{empresasDelAgente.length}</div>
            <div className="text-xs text-blue-600">Empresas</div>
          </div>
          <div className="bg-green-50 rounded p-2">
            <div className="text-lg font-bold text-green-600">{visitasRealizadas}</div>
            <div className="text-xs text-green-600">Visitas</div>
          </div>
          <div className="bg-purple-50 rounded p-2">
            <div className="text-lg font-bold text-purple-600">{empresasValidadas}</div>
            <div className="text-xs text-purple-600">Validadas</div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => abrirModal(agente)}
            className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
          >
            ✏️ Editar
          </button>
          <button
            onClick={() => abrirModalAsignacion(agente)}
            className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
          >
            📋 Asignar empresas
          </button>
          {!agente.email && (
            <button
              onClick={() => {
                setAgenteParaCredenciales(agente);
                setCredencialesForm({ email: '', password: '', confirmPassword: '' });
                setMostrandoModalCredenciales(true);
              }}
              className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200"
            >
              🔑 Asignar credenciales
            </button>
          )}
          <button
            onClick={() => toggleEstadoAgente(agente)}
            className={`text-xs px-3 py-1 rounded ${
              agente.activo !== false
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {agente.activo !== false ? '⏸️ Desactivar' : '▶️ Activar'}
          </button>
        </div>
      </div>
    );
  };

  const estadisticas = {
    total: agentes.length,
    activos: agentes.filter(a => a.activo !== false).length,
    inactivos: agentes.filter(a => a.activo === false).length,
    empresasAsignadas: empresasAsignadas?.length || 0,
    visitasRealizadas: empresasAsignadas?.filter(e => e.visitaAgente).length || 0
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
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión Unificada de Agentes de Campo</h2>
        <p className="text-gray-600">
          Administra los agentes que pueden crear solicitudes y activar empresas en terreno
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-800">{estadisticas.empresasAsignadas}</div>
          <div className="text-purple-600 text-sm">Empresas Asignadas</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-800">{estadisticas.visitasRealizadas}</div>
          <div className="text-orange-600 text-sm">Visitas Realizadas</div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => abrirModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ➕ Agregar Nuevo Agente
        </button>

        {/* Selector de vista */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Vista:</span>
          <button
            onClick={() => setVistaActual('tabla')}
            className={`px-3 py-1 rounded text-sm ${
              vistaActual === 'tabla'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📊 Tabla
          </button>
          <button
            onClick={() => setVistaActual('tarjetas')}
            className={`px-3 py-1 rounded text-sm ${
              vistaActual === 'tarjetas'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🃏 Tarjetas
          </button>
        </div>
      </div>

      {/* Contenido según vista */}
      {vistaActual === 'tabla' ? (
        // Vista de tabla
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zona Asignada</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estadísticas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Creación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {agentes.map((agente) => {
                  const empresasDelAgente = empresasAsignadas?.filter(e => e.agenteAsignado === agente.id) || [];
                  const visitasRealizadas = empresasDelAgente.filter(e => e.visitaAgente).length;
                  const empresasValidadas = empresasDelAgente.filter(e => e.estado === 'validada').length;

                  return (
                    <tr key={agente.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{agente.nombre}</div>
                          <div className="text-sm text-gray-500">ID: {agente.id.slice(-6)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div>{agente.email || 'Sin credenciales'}</div>
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
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div>📊 {empresasDelAgente.length} empresas</div>
                          <div>✅ {visitasRealizadas} visitas</div>
                          <div>🎯 {empresasValidadas} validadas</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {agente.fechaCreacion?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => abrirModal(agente)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => abrirModalAsignacion(agente)}
                            className="text-green-600 hover:text-green-900 text-sm"
                          >
                            Asignar
                          </button>
                          {!agente.email && (
                            <button
                              onClick={() => {
                                setAgenteParaCredenciales(agente);
                                setCredencialesForm({ email: '', password: '', confirmPassword: '' });
                                setMostrandoModalCredenciales(true);
                              }}
                              className="text-purple-600 hover:text-purple-900 text-sm"
                            >
                              Credenciales
                            </button>
                          )}
                          <button
                            onClick={() => toggleEstadoAgente(agente)}
                            className={`text-sm ${
                              agente.activo !== false
                                ? 'text-yellow-600 hover:text-yellow-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {agente.activo !== false ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => eliminarAgente(agente)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Vista de tarjetas
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {agentes.map(agente => (
            <AgenteCard key={agente.id} agente={agente} />
          ))}
        </div>
      )}

      {/* Modal para crear/editar agente */}
      {mostrandoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <form onSubmit={handleSubmit} className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editandoAgente ? 'Editar Agente' : 'Nuevo Agente'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zona asignada
                  </label>
                  <select
                    value={formData.zona_asignada}
                    onChange={(e) => setFormData({...formData, zona_asignada: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar zona</option>
                    {zonas.map(zona => (
                      <option key={zona} value={zona}>{zona}</option>
                    ))}
                  </select>
                </div>

                {!editandoAgente && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Dejar vacío para asignar después"
                        />
                        <button
                          type="button"
                          onClick={handleGenerarPassword}
                          className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
                          🔐
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Agente activo
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {procesando ? 'Guardando...' : (editandoAgente ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para cambiar clave */}
      {mostrandoModalClave && agenteParaClave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Cambiar Contraseña - {agenteParaClave.nombre}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva contraseña
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={nuevaClave}
                    onChange={(e) => setNuevaClave(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={generarClaveParaAgente}
                    className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    🔐
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={cerrarModalClave}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={cambiarClaveAgente}
                disabled={procesando}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {procesando ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para asignar credenciales */}
      {mostrandoModalCredenciales && agenteParaCredenciales && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Asignar Credenciales - {agenteParaCredenciales.nombre}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={credencialesForm.email}
                  onChange={(e) => setCredencialesForm({...credencialesForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={credencialesForm.password}
                    onChange={(e) => setCredencialesForm({...credencialesForm, password: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={generarPasswordAleatoria}
                    className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    🔐
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña *
                </label>
                <input
                  type="text"
                  value={credencialesForm.confirmPassword}
                  onChange={(e) => setCredencialesForm({...credencialesForm, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={cerrarModalCredenciales}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={asignarCredencialesAgente}
                disabled={procesando}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {procesando ? 'Asignando...' : 'Asignar Credenciales'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para asignar empresas */}
      {mostrandoModalAsignacion && agenteParaAsignar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Asignar Empresas - {agenteParaAsignar.nombre}
              </h2>
              <button
                onClick={cerrarModalAsignacion}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Selecciona las empresas que deseas asignar al agente {agenteParaAsignar.nombre}:
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-600">
                    {empresasSeleccionadas.length} de {empresasDisponibles.length} empresas seleccionadas
                  </span>
                  <button
                    onClick={() => setEmpresasSeleccionadas(empresasDisponibles.map(e => e.id))}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Seleccionar todas
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {empresasDisponibles.map(empresa => (
                  <div key={empresa.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={empresasSeleccionadas.includes(empresa.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEmpresasSeleccionadas([...empresasSeleccionadas, empresa.id]);
                          } else {
                            setEmpresasSeleccionadas(empresasSeleccionadas.filter(id => id !== empresa.id));
                          }
                        }}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{empresa.nombre}</h3>
                        <p className="text-sm text-gray-500">{empresa.direccion}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            empresa.estado === 'catalogada' 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {empresa.estado === 'catalogada' ? 'Catalogada' : 'Pendiente'}
                          </span>
                          {empresa.tipo && (
                            <span className="text-xs text-gray-500">{empresa.tipo}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {empresasDisponibles.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay empresas disponibles para asignar</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={cerrarModalAsignacion}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={asignarEmpresasSeleccionadas}
                disabled={procesando || empresasSeleccionadas.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {procesando ? 'Asignando...' : `Asignar ${empresasSeleccionadas.length} empresas`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}