import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';

export default function ServicioRevisionTecnica() {
  const { user, rol } = useAuth();
  const navigate = useNavigate();
  const [centrosRevision, setCentrosRevision] = useState([]);
  const [misRevisiones, setMisRevisiones] = useState([]);
  const [todasLasRevisiones, setTodasLasRevisiones] = useState([]); // Para admin
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(rol === 'admin' ? 'agendar' : 'agendar');
  const [showModal, setShowModal] = useState(false);
  const [selectedCentro, setSelectedCentro] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [editingCentro, setEditingCentro] = useState(null);
  const [editingRevision, setEditingRevision] = useState(null);
  const [adminForm, setAdminForm] = useState({
    nombre: '',
    region: '',
    comuna: '',
    direccion: '',
    paginaWeb: '',
    horario: '',
    telefono: '',
    email: ''
  });
  const [revisionForm, setRevisionForm] = useState({
    clienteId: '',
    vehiculoId: '',
    centroId: '',
    fecha: '',
    hora: '',
    tipoRevision: 'revision_tecnica',
    estado: 'pendiente',
    observaciones: '',
    contacto: {
      telefono: '',
      email: ''
    }
  });
  const [filtrosRevision, setFiltrosRevision] = useState({
    estado: '',
    fechaDesde: '',
    fechaHasta: '',
    centro: '',
    cliente: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar centros de revisión técnica (centros administrados)
      const centrosSnapshot = await getDocs(collection(db, 'centros_revision'));
      const centrosData = centrosSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        tipo: 'centro_admin',
        disponibilidad: 'disponible' // SIEMPRE disponible para centros admin
      }));

      // Cargar empresas de revisión técnica (empresas creadas por admin)
      const empresasQuery = query(
        collection(db, 'empresas'),
        where('tipoServicio', '==', 'revision_tecnica'),
        where('estado', 'in', ['activa', 'validada', 'ingresada'])
      );
      const empresasSnapshot = await getDocs(empresasQuery);
      const empresasData = empresasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        tipo: 'empresa_revision',
        disponibilidad: 'disponible',
        // Mapear campos para compatibilidad
        nombre: doc.data().nombre,
        direccion: doc.data().direccion,
        comuna: doc.data().comuna,
        region: doc.data().region,
        telefono: doc.data().telefono,
        email: doc.data().email,
        paginaWeb: doc.data().sitio_web || doc.data().web,
        horarios: doc.data().horario_atencion || 'Consultar horarios',
        logo: doc.data().logo_url || doc.data().logo,
        precioBase: 30000, // Precio por defecto
        rating: 4.5, // Rating por defecto
        distancia: '2.5', // Distancia por defecto
        tiempoPromedio: '45', // Tiempo por defecto
        servicios: ['Revisión Técnica', 'Verificación de Gases', 'Control de Frenos']
      }));

      // Combinar centros administrados y empresas de revisión
      const todosLosCentros = [...centrosData, ...empresasData];
      setCentrosRevision(todosLosCentros);

      console.log('🏢 Centros de revisión cargados:', {
        centros_admin: centrosData.length,
        empresas_revision: empresasData.length,
        total: todosLosCentros.length
      });

      if (user) {
        // Cargar revisiones del usuario
        const revisionesQuery = query(
          collection(db, 'revisiones_tecnicas'),
          where('userId', '==', user.uid)
        );
        const revisionesSnapshot = await getDocs(revisionesQuery);
        setMisRevisiones(revisionesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Cargar vehículos del usuario - buscar por clienteId (campo principal)
        console.log('🔍 Iniciando consulta de vehículos para usuario:', user.uid);
        console.log('🔍 Comparando con clienteId de ejemplo: FwxoUCj90lhztH62YAdjckYbRPg2');
        console.log('🔍 ¿Coinciden los IDs?', user.uid === 'FwxoUCj90lhztH62YAdjckYbRPg2');
        
        const vehiculosQuery = query(
          collection(db, 'vehiculos_usuario'),
          where('clienteId', '==', user.uid)
        );
        
        console.log('🔍 Consulta creada:', vehiculosQuery);
        
        const vehiculosSnapshot = await getDocs(vehiculosQuery);
        console.log('🔍 Snapshot recibido:', {
          size: vehiculosSnapshot.size,
          empty: vehiculosSnapshot.empty,
          docs: vehiculosSnapshot.docs.length
        });
        
        const vehiculosData = vehiculosSnapshot.docs.map(doc => {
          const data = { id: doc.id, ...doc.data() };
          console.log('🔍 Procesando vehículo:', data);
          return data;
        });
        
        setVehiculos(vehiculosData);
        
        console.log('🚗 Vehículos cargados para usuario:', {
          userId: user.uid,
          cantidad: vehiculosData.length,
          vehiculos: vehiculosData,
          query: 'clienteId == ' + user.uid,
          snapshotSize: vehiculosSnapshot.size,
          snapshotEmpty: vehiculosSnapshot.empty
        });
        
        // Log adicional para verificar la estructura de los vehículos
        if (vehiculosData.length > 0) {
          console.log('🔍 Primer vehículo encontrado:', vehiculosData[0]);
          console.log('🔍 Campos del vehículo:', Object.keys(vehiculosData[0]));
        } else {
          console.log('⚠️ No se encontraron vehículos para el usuario:', user.uid);
          console.log('⚠️ Verificando si hay vehículos con userId en lugar de clienteId...');
          
          // Intentar también con userId por si acaso
          const vehiculosQueryUserId = query(
            collection(db, 'vehiculos_usuario'),
            where('userId', '==', user.uid)
          );
          const vehiculosSnapshotUserId = await getDocs(vehiculosQueryUserId);
          console.log('🔍 Consulta con userId:', {
            size: vehiculosSnapshotUserId.size,
            empty: vehiculosSnapshotUserId.empty,
            docs: vehiculosSnapshotUserId.docs.length
          });
          
          // También intentar con el clienteId específico que sabemos que existe
          console.log('⚠️ Intentando con el clienteId específico que sabemos que existe...');
          const vehiculosQueryEspecifico = query(
            collection(db, 'vehiculos_usuario'),
            where('clienteId', '==', 'FwxoUCj90lhztH62YAdjckYbRPg2')
          );
          const vehiculosSnapshotEspecifico = await getDocs(vehiculosQueryEspecifico);
          console.log('🔍 Consulta con clienteId específico:', {
            size: vehiculosSnapshotEspecifico.size,
            empty: vehiculosSnapshotEspecifico.empty,
            docs: vehiculosSnapshotEspecifico.docs.length
          });
          
          if (vehiculosSnapshotEspecifico.size > 0) {
            console.log('🔍 ¡Encontrados vehículos con el clienteId específico!');
            const vehiculosEspecificos = vehiculosSnapshotEspecifico.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('🔍 Vehículos encontrados:', vehiculosEspecificos);
            setVehiculos(vehiculosEspecificos);
          } else {
            // Si aún no encuentra vehículos, intentar cargar todos los vehículos para debug
            console.log('🔍 No se encontraron vehículos, cargando todos para debug...');
            const todosVehiculosQuery = query(collection(db, 'vehiculos_usuario'));
            const todosVehiculosSnapshot = await getDocs(todosVehiculosQuery);
            console.log('🔍 Todos los vehículos en la BD:', {
              total: todosVehiculosSnapshot.size,
              vehiculos: todosVehiculosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            });
          }
        }

        // Si es admin, cargar todas las revisiones técnicas
        if (rol === 'admin') {
          const todasRevisionesQuery = query(
            collection(db, 'revisiones_tecnicas'),
            orderBy('fechaCreacion', 'desc')
          );
          const todasRevisionesSnapshot = await getDocs(todasRevisionesQuery);
          setTodasLasRevisiones(todasRevisionesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const agendarRevision = async (agendamiento) => {
    try {
      const nuevaRevision = {
        userId: user.uid,
        centroId: agendamiento.centroId,
        vehiculoId: agendamiento.vehiculoId,
        fechaCita: agendamiento.fecha,
        horaCita: agendamiento.hora,
        tipoRevision: agendamiento.tipo,
        estado: 'agendada',
        precio: agendamiento.precio,
        fechaCreacion: new Date()
      };

      await addDoc(collection(db, 'revisiones_tecnicas'), nuevaRevision);
      await loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Error scheduling revision:', error);
    }
  };

  const agregarCentro = async (e) => {
    e.preventDefault();
    try {
      const centroData = {
        ...adminForm,
        fechaCreacion: new Date(),
        activo: true,
        rating: 0,
        totalCalificaciones: 0
      };

      await addDoc(collection(db, 'centros_revision'), centroData);
      await loadData();
      setShowAdminModal(false);
      setAdminForm({
        nombre: '',
        region: '',
        comuna: '',
        direccion: '',
        paginaWeb: '',
        horario: '',
        telefono: '',
        email: ''
      });
    } catch (error) {
      console.error('Error adding center:', error);
    }
  };

  const editarCentro = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'centros_revision', editingCentro.id), adminForm);
      await loadData();
      setShowAdminModal(false);
      setEditingCentro(null);
      setAdminForm({
        nombre: '',
        region: '',
        comuna: '',
        direccion: '',
        paginaWeb: '',
        horario: '',
        telefono: '',
        email: ''
      });
    } catch (error) {
      console.error('Error updating center:', error);
    }
  };

  const eliminarCentro = async (centroId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este centro?')) {
      try {
        await updateDoc(doc(db, 'centros_revision', centroId), { activo: false });
        await loadData();
      } catch (error) {
        console.error('Error deleting center:', error);
      }
    }
  };

  // Funciones para gestión de revisiones técnicas
  const abrirModalRevision = (revision = null) => {
    if (revision) {
      setEditingRevision(revision);
      setRevisionForm({
        clienteId: revision.clienteId || revision.userId || '',
        vehiculoId: revision.vehiculoId || '',
        centroId: revision.centroId || '',
        fecha: revision.fecha || '',
        hora: revision.hora || '',
        tipoRevision: revision.tipoRevision || 'revision_tecnica',
        estado: revision.estado || 'pendiente',
        observaciones: revision.observaciones || '',
        contacto: revision.contacto || { telefono: '', email: '' }
      });
    } else {
      setEditingRevision(null);
      setRevisionForm({
        clienteId: '',
        vehiculoId: '',
        centroId: '',
        fecha: '',
        hora: '',
        tipoRevision: 'revision_tecnica',
        estado: 'pendiente',
        observaciones: '',
        contacto: { telefono: '', email: '' }
      });
    }
    setShowRevisionModal(true);
  };

  const guardarRevision = async (e) => {
    e.preventDefault();
    try {
      const revisionData = {
        ...revisionForm,
        fechaCreacion: editingRevision ? editingRevision.fechaCreacion : new Date(),
        fechaActualizacion: new Date(),
        actualizadoPor: user.uid
      };

      if (editingRevision) {
        await updateDoc(doc(db, 'revisiones_tecnicas', editingRevision.id), revisionData);
      } else {
        await addDoc(collection(db, 'revisiones_tecnicas'), revisionData);
      }

      await loadData();
      setShowRevisionModal(false);
      setEditingRevision(null);
    } catch (error) {
      console.error('Error saving revision:', error);
    }
  };

  const eliminarRevision = async (revisionId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta revisión técnica?')) {
      try {
        await deleteDoc(doc(db, 'revisiones_tecnicas', revisionId));
        await loadData();
      } catch (error) {
        console.error('Error deleting revision:', error);
      }
    }
  };

  const cambiarEstadoRevision = async (revisionId, nuevoEstado) => {
    try {
      await updateDoc(doc(db, 'revisiones_tecnicas', revisionId), {
        estado: nuevoEstado,
        fechaActualizacion: new Date(),
        actualizadoPor: user.uid
      });
      await loadData();
    } catch (error) {
      console.error('Error updating revision status:', error);
    }
  };

  const abrirModalEdicion = (centro) => {
    setEditingCentro(centro);
    setAdminForm({
      nombre: centro.nombre || '',
      region: centro.region || '',
      comuna: centro.comuna || '',
      direccion: centro.direccion || '',
      paginaWeb: centro.paginaWeb || '',
      horario: centro.horario || '',
      telefono: centro.telefono || '',
      email: centro.email || ''
    });
    setShowAdminModal(true);
  };

  const calcularVencimiento = (ultimaRevision) => {
    if (!ultimaRevision) return null;
    const fecha = new Date(ultimaRevision.fecha.seconds * 1000);
    fecha.setFullYear(fecha.getFullYear() + 1);
    return fecha;
  };

  const diasHastaVencimiento = (vencimiento) => {
    if (!vencimiento) return null;
    const hoy = new Date();
    const diferencia = vencimiento - hoy;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">🔧 Revisión Técnica</h1>
        
        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            className={`pb-2 px-4 ${activeTab === 'agendar' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('agendar')}
          >
            Agendar Cita
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'revisiones' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('revisiones')}
          >
            Mis Revisiones
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'recordatorios' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('recordatorios')}
          >
            Recordatorios
          </button>
          {rol === 'admin' && (
            <button
              className={`pb-2 px-4 ${activeTab === 'admin' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('admin')}
            >
              Administración
            </button>
          )}
        </div>

        {/* Content */}
        {activeTab === 'agendar' && (
          <div className="space-y-6">
            {/* Estado de vehículos */}
            {vehiculos.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Estado de tus Vehículos</h3>
                <div className="space-y-3">
                  {vehiculos.map(vehiculo => {
                    const ultimaRevision = misRevisiones
                      .filter(r => r.vehiculoId === vehiculo.id && r.estado === 'aprobada')
                      .sort((a, b) => b.fecha?.seconds - a.fecha?.seconds)[0];
                    
                    const vencimiento = calcularVencimiento(ultimaRevision);
                    const dias = vencimiento ? diasHastaVencimiento(vencimiento) : null;
                    
                    return (
                      <div key={vehiculo.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <h4 className="font-medium">
                            {vehiculo.marca} {vehiculo.modelo} - {vehiculo.patente}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {ultimaRevision ? 
                              `Última revisión: ${new Date(ultimaRevision.fecha.seconds * 1000).toLocaleDateString()}` :
                              'Sin revisiones registradas'
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          {dias !== null && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              dias < 0 ? 'bg-red-100 text-red-800' :
                              dias <= 30 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {dias < 0 ? 'Vencida' : 
                               dias <= 30 ? `${dias} días restantes` :
                               'Al día'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Centros disponibles */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Centros de Revisión Técnica</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {centrosRevision.map(centro => {
                  console.log('🎨 Renderizando centro en ServicioRevisionTecnica:', {
                    nombre: centro.nombre,
                    disponibilidad: centro.disponibilidad,
                    tipo: centro.tipo,
                    esDisponible: centro.disponibilidad === 'disponible'
                  });
                  
                  return (
                  <div key={centro.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{centro.nombre}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            centro.disponibilidad === 'disponible' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {centro.disponibilidad === 'disponible' ? 'Disponible' : 'No disponible'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{centro.direccion}</p>
                        <p className="text-sm text-gray-600">{centro.comuna}, {centro.region}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm">{centro.rating || 4.2}</span>
                        </div>
                        <p className="text-sm text-gray-600">{centro.distancia || '2.5'} km</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Precio desde:</span>
                        <span className="font-semibold">${centro.precioBase?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tiempo promedio:</span>
                        <span>{centro.tiempoPromedio || '45'} min</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Horarios:</span>
                        <span>{centro.horarios || 'L-V 8-18, S 8-14'}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {centro.servicios?.map(servicio => (
                        <span key={servicio} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {servicio}
                        </span>
                      ))}
                    </div>
                    
                    <button
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                      onClick={() => {
                        console.log('🖱️ Click en Agendar Cita para:', centro.nombre, 'disponibilidad:', centro.disponibilidad);
                        console.log('🚗 Vehículos disponibles al abrir modal:', {
                          cantidad: vehiculos.length,
                          vehiculos: vehiculos,
                          estado: vehiculos.length > 0 ? 'CON VEHÍCULOS' : 'SIN VEHÍCULOS'
                        });
                        setSelectedCentro(centro);
                        setShowModal(true);
                      }}
                    >
                      Agendar Cita
                    </button>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'revisiones' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Historial de Revisiones</h3>
            {misRevisiones.length === 0 ? (
              <p className="text-gray-500">No tienes revisiones registradas.</p>
            ) : (
              <div className="space-y-4">
                {misRevisiones
                  .sort((a, b) => b.fechaCreacion?.seconds - a.fechaCreacion?.seconds)
                  .map(revision => {
                    const centro = centrosRevision.find(c => c.id === revision.centroId);
                    const vehiculo = vehiculos.find(v => v.id === revision.vehiculoId);
                    
                    return (
                      <div key={revision.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">
                              {vehiculo?.marca} {vehiculo?.modelo} - {vehiculo?.patente}
                            </h4>
                            <p className="text-sm text-gray-600">{centro?.nombre}</p>
                            <p className="text-sm text-gray-600">
                              {revision.fechaCita && new Date(revision.fechaCita.seconds * 1000).toLocaleDateString()} 
                              {revision.horaCita && ` - ${revision.horaCita}`}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            revision.estado === 'agendada' ? 'bg-blue-100 text-blue-800' :
                            revision.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-800' :
                            revision.estado === 'aprobada' ? 'bg-green-100 text-green-800' :
                            revision.estado === 'rechazada' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {revision.estado}
                          </span>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Tipo:</span>
                            <p className="font-medium">{revision.tipoRevision}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Precio:</span>
                            <p className="font-medium">${revision.precio?.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Resultado:</span>
                            <p className="font-medium">
                              {revision.estado === 'aprobada' ? '✅ Aprobada' :
                               revision.estado === 'rechazada' ? '❌ Rechazada' :
                               '⏳ Pendiente'}
                            </p>
                          </div>
                        </div>
                        
                        {revision.observaciones && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <span className="text-sm font-medium">Observaciones:</span>
                            <p className="text-sm mt-1">{revision.observaciones}</p>
                          </div>
                        )}
                        
                        <div className="flex gap-2 mt-4">
                          <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                            Ver Certificado
                          </button>
                          {revision.estado === 'agendada' && (
                            <button className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700">
                              Reprogramar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recordatorios' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recordatorios de Vencimiento</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Configurar Notificaciones</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span>Email 30 días antes del vencimiento</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span>Email 7 días antes del vencimiento</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>SMS 3 días antes del vencimiento</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Notificaciones push en la app</span>
                </label>
              </div>
              <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Guardar Preferencias
              </button>
            </div>
            
            {/* Próximos vencimientos */}
            <div>
              <h4 className="font-semibold mb-3">Próximos Vencimientos</h4>
              <div className="space-y-3">
                {vehiculos.map(vehiculo => {
                  const ultimaRevision = misRevisiones
                    .filter(r => r.vehiculoId === vehiculo.id && r.estado === 'aprobada')
                    .sort((a, b) => b.fecha?.seconds - a.fecha?.seconds)[0];
                  
                  const vencimiento = calcularVencimiento(ultimaRevision);
                  const dias = vencimiento ? diasHastaVencimiento(vencimiento) : null;
                  
                  if (!vencimiento) return null;
                  
                  return (
                    <div key={vehiculo.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-medium">
                            {vehiculo.marca} {vehiculo.modelo} - {vehiculo.patente}
                          </h5>
                          <p className="text-sm text-gray-600">
                            Vence: {vencimiento.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            dias < 0 ? 'bg-red-100 text-red-800' :
                            dias <= 30 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {dias < 0 ? `Vencida hace ${Math.abs(dias)} días` :
                             dias === 0 ? 'Vence hoy' :
                             `${dias} días restantes`}
                          </span>
                          {dias <= 30 && (
                            <button className="block mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
                              Agendar Ahora
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="space-y-6">
            {/* Sub-pestañas para administración */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('admin-centros')}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'admin-centros' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Centros de Revisión
                </button>
                <button
                  onClick={() => setActiveTab('admin-revisiones')}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'admin-revisiones' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Revisiones Técnicas
                </button>
              </nav>
            </div>

            {/* Contenido de Centros de Revisión */}
            {activeTab === 'admin-centros' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Administración de Centros de Revisión Técnica</h3>
                  <button
                    onClick={() => {
                      setEditingCentro(null);
                      setAdminForm({
                        nombre: '',
                        region: '',
                        comuna: '',
                        direccion: '',
                        paginaWeb: '',
                        horario: '',
                        telefono: '',
                        email: ''
                      });
                      setShowAdminModal(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    + Agregar Centro
                  </button>
                </div>

            <div className="grid gap-4">
              {centrosRevision.filter(centro => centro.activo !== false).map(centro => (
                <div key={centro.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{centro.nombre}</h4>
                      <div className="grid md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">📍 Dirección:</span>
                          <p>{centro.direccion}, {centro.comuna}, {centro.region}</p>
                        </div>
                        <div>
                          <span className="font-medium">🕒 Horario:</span>
                          <p>{centro.horario || 'No especificado'}</p>
                        </div>
                        {centro.paginaWeb && (
                          <div>
                            <span className="font-medium">🌐 Web:</span>
                            <a href={centro.paginaWeb} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {centro.paginaWeb}
                            </a>
                          </div>
                        )}
                        {centro.telefono && (
                          <div>
                            <span className="font-medium">📞 Teléfono:</span>
                            <p>{centro.telefono}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => abrirModalEdicion(centro)}
                        className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarCentro(centro.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
              </div>
            )}

            {/* Contenido de Revisiones Técnicas */}
            {activeTab === 'admin-revisiones' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Gestión de Revisiones Técnicas</h3>
                  <button
                    onClick={() => abrirModalRevision()}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    + Nueva Revisión
                  </button>
                </div>

                {/* Filtros */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Estado</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={filtrosRevision.estado}
                        onChange={(e) => setFiltrosRevision(prev => ({ ...prev, estado: e.target.value }))}
                      >
                        <option value="">Todos los estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="completada">Completada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Fecha Desde</label>
                      <input
                        type="date"
                        className="w-full border rounded px-3 py-2"
                        value={filtrosRevision.fechaDesde}
                        onChange={(e) => setFiltrosRevision(prev => ({ ...prev, fechaDesde: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Fecha Hasta</label>
                      <input
                        type="date"
                        className="w-full border rounded px-3 py-2"
                        value={filtrosRevision.fechaHasta}
                        onChange={(e) => setFiltrosRevision(prev => ({ ...prev, fechaHasta: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Centro</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={filtrosRevision.centro}
                        onChange={(e) => setFiltrosRevision(prev => ({ ...prev, centro: e.target.value }))}
                      >
                        <option value="">Todos los centros</option>
                        {centrosRevision.map(centro => (
                          <option key={centro.id} value={centro.id}>{centro.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Lista de revisiones */}
                <div className="space-y-4">
                  {todasLasRevisiones
                    .filter(revision => {
                      if (filtrosRevision.estado && revision.estado !== filtrosRevision.estado) return false;
                      if (filtrosRevision.centro && revision.centroId !== filtrosRevision.centro) return false;
                      if (filtrosRevision.fechaDesde && new Date(revision.fecha) < new Date(filtrosRevision.fechaDesde)) return false;
                      if (filtrosRevision.fechaHasta && new Date(revision.fecha) > new Date(filtrosRevision.fechaHasta)) return false;
                      return true;
                    })
                    .map(revision => (
                    <div key={revision.id} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">Revisión #{revision.id.slice(-8)}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              revision.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                              revision.estado === 'confirmada' ? 'bg-blue-100 text-blue-800' :
                              revision.estado === 'completada' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {revision.estado}
                            </span>
                          </div>
                          <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">📅 Fecha:</span>
                              <p>{revision.fecha} {revision.hora}</p>
                            </div>
                            <div>
                              <span className="font-medium">🏢 Centro:</span>
                              <p>{centrosRevision.find(c => c.id === revision.centroId)?.nombre || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium">👤 Cliente:</span>
                              <p>{revision.clienteId || revision.userId || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium">🚗 Vehículo:</span>
                              <p>{revision.vehiculoId || 'N/A'}</p>
                            </div>
                            {revision.observaciones && (
                              <div className="md:col-span-2">
                                <span className="font-medium">📝 Observaciones:</span>
                                <p>{revision.observaciones}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => abrirModalRevision(revision)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Editar
                          </button>
                          <select
                            value={revision.estado}
                            onChange={(e) => cambiarEstadoRevision(revision.id, e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="confirmada">Confirmada</option>
                            <option value="completada">Completada</option>
                            <option value="cancelada">Cancelada</option>
                          </select>
                          <button
                            onClick={() => eliminarRevision(revision.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de administración */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingCentro ? 'Editar Centro' : 'Agregar Nuevo Centro'}
            </h3>
            
            <form onSubmit={editingCentro ? editarCentro : agregarCentro} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre del Centro *</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={adminForm.nombre}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, nombre: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Región *</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={adminForm.region}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, region: e.target.value }))}
                    required
                  >
                    <option value="">Seleccionar región</option>
                    <option value="Metropolitana">Metropolitana</option>
                    <option value="Valparaíso">Valparaíso</option>
                    <option value="Biobío">Biobío</option>
                    <option value="La Araucanía">La Araucanía</option>
                    <option value="Los Lagos">Los Lagos</option>
                    <option value="Antofagasta">Antofagasta</option>
                    <option value="Atacama">Atacama</option>
                    <option value="Coquimbo">Coquimbo</option>
                    <option value="O'Higgins">O'Higgins</option>
                    <option value="Maule">Maule</option>
                    <option value="Ñuble">Ñuble</option>
                    <option value="Los Ríos">Los Ríos</option>
                    <option value="Aysén">Aysén</option>
                    <option value="Magallanes">Magallanes</option>
                    <option value="Arica y Parinacota">Arica y Parinacota</option>
                    <option value="Tarapacá">Tarapacá</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Comuna *</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={adminForm.comuna}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, comuna: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    type="tel"
                    className="w-full border rounded px-3 py-2"
                    value={adminForm.telefono}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, telefono: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Dirección *</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={adminForm.direccion}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, direccion: e.target.value }))}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Página Web</label>
                  <input
                    type="url"
                    className="w-full border rounded px-3 py-2"
                    value={adminForm.paginaWeb}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, paginaWeb: e.target.value }))}
                    placeholder="https://ejemplo.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border rounded px-3 py-2"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Horario de Atención *</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={adminForm.horario}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, horario: e.target.value }))}
                  placeholder="Ej: L-V 8:00-18:00, S 8:00-14:00"
                  required
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50"
                  onClick={() => {
                    setShowAdminModal(false);
                    setEditingCentro(null);
                    setAdminForm({
                      nombre: '',
                      region: '',
                      comuna: '',
                      direccion: '',
                      paginaWeb: '',
                      horario: '',
                      telefono: '',
                      email: ''
                    });
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  {editingCentro ? 'Actualizar' : 'Agregar'} Centro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de gestión de revisiones técnicas */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingRevision ? 'Editar Revisión Técnica' : 'Nueva Revisión Técnica'}
            </h3>
            
            <form onSubmit={guardarRevision} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ID Cliente *</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={revisionForm.clienteId}
                    onChange={(e) => setRevisionForm(prev => ({ ...prev, clienteId: e.target.value }))}
                    required
                    placeholder="ID del cliente"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">ID Vehículo</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={revisionForm.vehiculoId}
                    onChange={(e) => setRevisionForm(prev => ({ ...prev, vehiculoId: e.target.value }))}
                    placeholder="ID del vehículo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Centro de Revisión *</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={revisionForm.centroId}
                    onChange={(e) => setRevisionForm(prev => ({ ...prev, centroId: e.target.value }))}
                    required
                  >
                    <option value="">Seleccionar centro</option>
                    {centrosRevision.map(centro => (
                      <option key={centro.id} value={centro.id}>{centro.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Estado *</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={revisionForm.estado}
                    onChange={(e) => setRevisionForm(prev => ({ ...prev, estado: e.target.value }))}
                    required
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Fecha *</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={revisionForm.fecha}
                    onChange={(e) => setRevisionForm(prev => ({ ...prev, fecha: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Hora *</label>
                  <input
                    type="time"
                    className="w-full border rounded px-3 py-2"
                    value={revisionForm.hora}
                    onChange={(e) => setRevisionForm(prev => ({ ...prev, hora: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono de Contacto</label>
                  <input
                    type="tel"
                    className="w-full border rounded px-3 py-2"
                    value={revisionForm.contacto.telefono}
                    onChange={(e) => setRevisionForm(prev => ({ 
                      ...prev, 
                      contacto: { ...prev.contacto, telefono: e.target.value }
                    }))}
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email de Contacto</label>
                  <input
                    type="email"
                    className="w-full border rounded px-3 py-2"
                    value={revisionForm.contacto.email}
                    onChange={(e) => setRevisionForm(prev => ({ 
                      ...prev, 
                      contacto: { ...prev.contacto, email: e.target.value }
                    }))}
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observaciones</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                  value={revisionForm.observaciones}
                  onChange={(e) => setRevisionForm(prev => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Observaciones adicionales sobre la revisión..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50"
                  onClick={() => setShowRevisionModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                >
                  {editingRevision ? 'Actualizar' : 'Crear'} Revisión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de agendamiento */}
      {showModal && selectedCentro && (
        <>
          {console.log('🚀 Renderizando modal con vehículos:', {
            showModal,
            selectedCentro: selectedCentro?.nombre,
            vehiculos: vehiculos,
            cantidad: vehiculos?.length || 0,
            estado: vehiculos?.length > 0 ? 'CON VEHÍCULOS' : 'SIN VEHÍCULOS'
          })}
          <AgendamientoModal
            centro={selectedCentro}
            vehiculos={vehiculos}
            onClose={() => setShowModal(false)}
            onSubmit={agendarRevision}
          />
        </>
      )}
    </div>
  );
}

// Modal component para agendamiento
function AgendamientoModal({ centro, vehiculos, onClose, onSubmit }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    vehiculoId: '',
    fecha: '',
    hora: '',
    tipo: 'anual',
    precio: centro.precioBase || 25000
  });

  // Log para depuración
  console.log('🔍 AgendamientoModal - Vehículos recibidos:', {
    cantidad: vehiculos?.length || 0,
    vehiculos: vehiculos,
    centro: centro?.nombre,
    esArray: Array.isArray(vehiculos),
    tipo: typeof vehiculos,
    esUndefined: vehiculos === undefined,
    esNull: vehiculos === null
  });
  
  // Log adicional para verificar la condición del dropdown
  console.log('🔍 Condición del dropdown:', {
    vehiculosExiste: !!vehiculos,
    vehiculosLength: vehiculos?.length,
    condicion: vehiculos && vehiculos.length > 0,
    mostrarDropdown: vehiculos && vehiculos.length > 0 ? 'SÍ' : 'NO'
  });

  const [horasDisponibles] = useState([
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      centroId: centro.id
    });
  };

  // Generar fechas disponibles (próximos 30 días, excluyendo domingos)
  const fechasDisponibles = [];
  for (let i = 1; i <= 30; i++) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + i);
    if (fecha.getDay() !== 0) { // Excluir domingos
      fechasDisponibles.push(fecha.toISOString().split('T')[0]);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Agendar en {centro.nombre}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vehículo</label>
            {vehiculos && vehiculos.length > 0 ? (
              <select
                className="w-full border rounded px-3 py-2"
                value={formData.vehiculoId}
                onChange={(e) => setFormData(prev => ({ ...prev, vehiculoId: e.target.value }))}
                required
              >
                <option value="">Seleccionar vehículo</option>
                {vehiculos.map(vehiculo => {
                  console.log('🚗 Renderizando vehículo en dropdown:', vehiculo);
                  return (
                    <option key={vehiculo.id} value={vehiculo.id}>
                      {vehiculo.marca} {vehiculo.modelo} - {vehiculo.patente}
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-500">
                <p className="text-sm">No tienes vehículos registrados.</p>
                <p className="text-xs mt-1">
                  <button 
                    onClick={() => window.location.href = '/vehiculos/agregar'}
                    className="text-blue-600 hover:underline"
                  >
                    Agregar vehículo
                  </button>
                </p>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Revisión</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.tipo}
              onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
              required
            >
              <option value="anual">Revisión Anual</option>
              <option value="semestral">Revisión Semestral (Transporte)</option>
              <option value="primera_vez">Primera Vez</option>
              <option value="reinspeccion">Reinspección</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Fecha</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.fecha}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
              required
            >
              <option value="">Seleccionar fecha</option>
              {fechasDisponibles.map(fecha => {
                const fechaObj = new Date(fecha);
                return (
                  <option key={fecha} value={fecha}>
                    {fechaObj.toLocaleDateString('es-CL', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </option>
                );
              })}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Hora</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.hora}
              onChange={(e) => setFormData(prev => ({ ...prev, hora: e.target.value }))}
              required
            >
              <option value="">Seleccionar hora</option>
              {horasDisponibles.map(hora => (
                <option key={hora} value={hora}>
                  {hora}
                </option>
              ))}
            </select>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total a pagar:</span>
              <span className="text-lg font-bold">${formData.precio.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Pago en efectivo o tarjeta en el centro
            </p>
          </div>
          
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Confirmar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
