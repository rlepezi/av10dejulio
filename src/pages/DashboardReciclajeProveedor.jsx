import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { collection, getDocs, query, where, orderBy, limit, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import HeaderMenu from '../components/HeaderMenu';

export default function DashboardReciclajeProveedor() {
  const navigate = useNavigate();
  const { user, rol } = useAuth();
  const [solicitudesReciclaje, setSolicitudesReciclaje] = useState([]);
  const [visitasProgramadas, setVisitasProgramadas] = useState([]);
  const [historialReciclaje, setHistorialReciclaje] = useState([]);
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSolicitudModal, setShowSolicitudModal] = useState(false);
  const [showVisitaModal, setShowVisitaModal] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [visitaSeleccionada, setVisitaSeleccionada] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('');

  // Estados para formularios
  const [formVisita, setFormVisita] = useState({
    fecha: '',
    hora: '',
    notas: '',
    estado: 'confirmada'
  });

  useEffect(() => {
    if (user && (rol === 'empresa' || rol === 'proveedor')) {
      cargarDatosReciclaje();
      suscribirSolicitudes();
    }
  }, [user, rol]);

  const cargarDatosReciclaje = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Buscando solicitudes para empresa con UID:', user.uid);
      
      // Primero buscar la empresa del usuario actual
      let empresaId = user.uid;
      
      try {
        // Buscar en la colección empresas por email del usuario
        const empresasQuery = query(
          collection(db, 'empresas'),
          where('emailEmpresa', '==', user.email)
        );
        const empresasSnapshot = await getDocs(empresasQuery);
        
        if (!empresasSnapshot.empty) {
          const empresaDoc = empresasSnapshot.docs[0];
          empresaId = empresaDoc.id; // Usar el ID del documento de la empresa
          setEmpresa({ id: empresaDoc.id, ...empresaDoc.data() }); // Guardar datos completos de la empresa
          console.log('✅ Empresa encontrada con ID:', empresaId);
        } else {
          console.log('⚠️ No se encontró empresa por email, usando UID del usuario');
        }
      } catch (error) {
        console.log('❌ Error buscando empresa, usando UID del usuario:', error);
      }
      
      // Cargar solicitudes de reciclaje para esta empresa
      const solicitudesQuery = query(
        collection(db, 'visitas_reciclaje'),
        where('empresaId', '==', empresaId),
        orderBy('fechaCreacion', 'desc')
      );
      
      console.log('🔍 Consultando solicitudes con empresaId:', empresaId);
      const solicitudesSnapshot = await getDocs(solicitudesQuery);
      const solicitudesData = solicitudesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log('📊 Solicitudes encontradas:', solicitudesData.length);
      solicitudesData.forEach(s => console.log('  -', s.empresaNombre, '|', s.estado, '|', s.fecha));
      
      setSolicitudesReciclaje(solicitudesData);

      // Separar por estado
      const programadas = solicitudesData.filter(s => s.estado === 'programada');
      const confirmadas = solicitudesData.filter(s => s.estado === 'confirmada');
      const completadas = solicitudesData.filter(s => s.estado === 'completada');
      const canceladas = solicitudesData.filter(s => s.estado === 'cancelada');

      setVisitasProgramadas([...programadas, ...confirmadas]);
      setHistorialReciclaje([...completadas, ...canceladas]);

      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos de reciclaje:', error);
      setLoading(false);
    }
  };

  const suscribirSolicitudes = () => {
    // Suscribirse a cambios en tiempo real
    let empresaId = user.uid;
    
    // Buscar la empresa del usuario actual
    const empresasQuery = query(
      collection(db, 'empresas'),
      where('emailEmpresa', '==', user.email)
    );
    
    getDocs(empresasQuery).then((empresasSnapshot) => {
      if (!empresasSnapshot.empty) {
        empresaId = empresasSnapshot.docs[0].id;
        console.log('🔄 Suscripción con empresaId:', empresaId);
      }
      
      const solicitudesQuery = query(
        collection(db, 'visitas_reciclaje'),
        where('empresaId', '==', empresaId),
        orderBy('fechaCreacion', 'desc')
      );

      return onSnapshot(solicitudesQuery, (snapshot) => {
        const solicitudesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('🔄 Actualización en tiempo real - Solicitudes:', solicitudesData.length);
        setSolicitudesReciclaje(solicitudesData);

        const programadas = solicitudesData.filter(s => s.estado === 'programada');
        const confirmadas = solicitudesData.filter(s => s.estado === 'confirmada');
        const completadas = solicitudesData.filter(s => s.estado === 'completada');
        const canceladas = solicitudesData.filter(s => s.estado === 'cancelada');

        setVisitasProgramadas([...programadas, ...confirmadas]);
        setHistorialReciclaje([...completadas, ...canceladas]);
      });
    });
  };

  const confirmarVisita = async (solicitudId) => {
    try {
      await updateDoc(doc(db, 'visitas_reciclaje', solicitudId), {
        estado: 'confirmada',
        fechaConfirmacion: new Date(),
        empresaConfirmada: true
      });

      alert('Visita confirmada exitosamente.');
    } catch (error) {
      console.error('Error confirmando visita:', error);
      alert('Error al confirmar la visita. Intenta nuevamente.');
    }
  };

  const completarVisita = async (solicitudId) => {
    try {
      await updateDoc(doc(db, 'visitas_reciclaje', solicitudId), {
        estado: 'completada',
        fechaCompletada: new Date(),
        completada: true
      });

      alert('Visita marcada como completada.');
    } catch (error) {
      console.error('Error completando visita:', error);
      alert('Error al marcar como completada. Intenta nuevamente.');
    }
  };

  const cancelarVisita = async (solicitudId, motivo) => {
    try {
      await updateDoc(doc(db, 'visitas_reciclaje', solicitudId), {
        estado: 'cancelada',
        fechaCancelacion: new Date(),
        motivoCancelacion: motivo || 'Cancelada por la empresa'
      });

      alert('Visita cancelada exitosamente.');
    } catch (error) {
      console.error('Error cancelando visita:', error);
      alert('Error al cancelar la visita. Intenta nuevamente.');
    }
  };

  const actualizarVisita = async () => {
    if (!visitaSeleccionada) return;

    try {
      await updateDoc(doc(db, 'visitas_reciclaje', visitaSeleccionada.id), {
        fecha: formVisita.fecha,
        hora: formVisita.hora,
        notas: formVisita.notas,
        estado: formVisita.estado,
        fechaActualizacion: new Date()
      });

      setShowVisitaModal(false);
      setVisitaSeleccionada(null);
      setFormVisita({
        fecha: '',
        hora: '',
        notas: '',
        estado: 'confirmada'
      });

      alert('Visita actualizada exitosamente.');
    } catch (error) {
      console.error('Error actualizando visita:', error);
      alert('Error al actualizar la visita. Intenta nuevamente.');
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'programada': return 'bg-yellow-100 text-yellow-800';
      case 'confirmada': return 'bg-blue-100 text-blue-800';
      case 'completada': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'programada': return 'Programada';
      case 'confirmada': return 'Confirmada';
      case 'completada': return 'Completada';
      case 'cancelada': return 'Cancelada';
      default: return 'Desconocido';
    }
  };

  const filtrarSolicitudes = () => {
    let filtradas = solicitudesReciclaje;

    if (filtroEstado !== 'todos') {
      filtradas = filtradas.filter(s => s.estado === filtroEstado);
    }

    if (filtroFecha) {
      filtradas = filtradas.filter(s => s.fecha === filtroFecha);
    }

    return filtradas;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Cargando tu dashboard de reciclaje...</p>
        </div>
      </div>
    );
  }

  if (!user || (rol !== 'empresa' && rol !== 'proveedor')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Restringido</h1>
          <p className="text-gray-600 mb-6">Solo las empresas y proveedores pueden acceder a este dashboard</p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  const solicitudesFiltradas = filtrarSolicitudes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <HeaderMenu />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏭 Dashboard de Reciclaje - Proveedor
          </h1>
          <p className="text-xl text-gray-600">
            Gestiona las solicitudes de reciclaje de tus clientes y coordina las visitas de recolección
          </p>
        </div>

        {/* Resumen Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-2xl font-bold text-blue-600">{solicitudesReciclaje.length}</div>
            <div className="text-gray-600">Total Solicitudes</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-2xl font-bold text-yellow-600">
              {solicitudesReciclaje.filter(s => s.estado === 'programada').length}
            </div>
            <div className="text-gray-600">Pendientes</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-600">
              {solicitudesReciclaje.filter(s => s.estado === 'completada').length}
            </div>
            <div className="text-gray-600">Completadas</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-2xl font-bold text-purple-600">
              {visitasProgramadas.length}
            </div>
            <div className="text-gray-600">Visitas Activas</div>
          </div>
        </div>

        {/* Información de Credenciales */}
        {empresa && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-gray-900">🔐 Credenciales</h4>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  empresa?.credenciales?.email && empresa?.credenciales?.password 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {empresa?.credenciales?.email && empresa?.credenciales?.password 
                    ? '✅ Configuradas' 
                    : '⚠️ Pendientes'}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{empresa?.credenciales?.email || 'No configurado'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Contraseña:</span>
                  <span className="font-medium">{empresa?.credenciales?.password ? '••••••••' : 'No configurado'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Último acceso:</span>
                  <span className="font-medium">{empresa?.ultimoAcceso ? new Date(empresa.ultimoAcceso.toDate()).toLocaleDateString('es-ES') : 'Nunca'}</span>
                </div>
              </div>
              {(!empresa?.credenciales?.email || !empresa?.credenciales?.password) && (
                <button 
                  onClick={() => navigate('/dashboard/proveedor')}
                  className="w-full mt-4 bg-orange-600 text-white py-3 rounded-xl font-medium hover:bg-orange-700 transition-all duration-300"
                >
                  🔑 Configurar Credenciales
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-gray-900">🏢 Información de la Empresa</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Nombre:</span>
                  <span className="font-medium">{empresa?.nombre || 'No disponible'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Dirección:</span>
                  <span className="font-medium">{empresa?.direccion || 'No disponible'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Teléfono:</span>
                  <span className="font-medium">{empresa?.telefono || 'No disponible'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    empresa?.estado === 'activa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {empresa?.estado === 'activa' ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/registro/empresa/reciclaje')}
              className="flex items-center justify-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-2xl">♻️</span>
              <div className="text-left">
                <div className="font-medium text-green-900">Actualizar Servicios</div>
                <div className="text-sm text-green-700">Modificar reciclaje</div>
              </div>
            </button>
            
            <button
              onClick={() => setFiltroEstado('programada')}
              className="flex items-center justify-center gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl">⏳</span>
              <div className="text-left">
                <div className="font-medium text-blue-900">Ver Pendientes</div>
                <div className="text-sm text-blue-700">Solicitudes nuevas</div>
              </div>
            </button>
            
            <button
              onClick={() => setFiltroEstado('confirmada')}
              className="flex items-center justify-center gap-3 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <span className="text-2xl">📅</span>
              <div className="text-left">
                <div className="font-medium text-purple-900">Visitas Confirmadas</div>
                <div className="text-sm text-purple-700">Programadas hoy</div>
              </div>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">🔍 Filtros de Búsqueda</h3>
            <div className="flex gap-4">
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="todos">Todos los Estados</option>
                <option value="programada">Programadas</option>
                <option value="confirmada">Confirmadas</option>
                <option value="completada">Completadas</option>
                <option value="cancelada">Canceladas</option>
              </select>
              
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              
              <button
                onClick={() => {
                  setFiltroEstado('todos');
                  setFiltroFecha('');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Solicitudes de Reciclaje */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">📋 Solicitudes de Reciclaje</h3>
          
          {solicitudesFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <p className="text-gray-600 mb-4">No hay solicitudes de reciclaje</p>
              <p className="text-sm text-gray-500 mb-4">
                {solicitudesReciclaje.length === 0 
                  ? 'Aún no has recibido solicitudes de reciclaje de clientes. Esto puede ser porque:'
                  : 'No hay solicitudes que coincidan con los filtros aplicados.'
                }
              </p>
              {solicitudesReciclaje.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <ul className="text-blue-800 text-sm text-left space-y-1">
                    <li>• Los clientes aún no han programado visitas</li>
                    <li>• Tu empresa no aparece en la lista de recicladores</li>
                    <li>• Hay un problema de conexión con la base de datos</li>
                  </ul>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    🔄 Recargar Página
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {solicitudesFiltradas.map((solicitud) => (
                <div key={solicitud.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">👤</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{solicitud.clienteNombre}</h4>
                          <p className="text-sm text-gray-600">{solicitud.direccion}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500">Fecha Programada</p>
                          <p className="text-sm text-gray-900">
                            {new Date(solicitud.fecha).toLocaleDateString()} - {solicitud.hora}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Productos</p>
                          <p className="text-sm text-gray-900">{solicitud.productos.length} productos</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Estado</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(solicitud.estado)}`}>
                            {getEstadoTexto(solicitud.estado)}
                          </span>
                        </div>
                      </div>

                      {solicitud.productos && solicitud.productos.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Productos a Reciclar:</p>
                          <div className="flex flex-wrap gap-1">
                            {solicitud.productos.map((producto, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                {producto.icono} {producto.nombre}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {solicitud.notas && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Notas del Cliente:</p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{solicitud.notas}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    {solicitud.estado === 'programada' && (
                      <>
                        <button
                          onClick={() => confirmarVisita(solicitud.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          ✅ Confirmar Visita
                        </button>
                        <button
                          onClick={() => {
                            setSolicitudSeleccionada(solicitud);
                            setShowSolicitudModal(true);
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          👁️ Ver Detalles
                        </button>
                        <button
                          onClick={() => {
                            const motivo = prompt('Motivo de cancelación:');
                            if (motivo) cancelarVisita(solicitud.id, motivo);
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          ❌ Cancelar
                        </button>
                      </>
                    )}

                    {solicitud.estado === 'confirmada' && (
                      <>
                        <button
                          onClick={() => completarVisita(solicitud.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          ✅ Marcar Completada
                        </button>
                        <button
                          onClick={() => {
                            setVisitaSeleccionada(solicitud);
                            setFormVisita({
                              fecha: solicitud.fecha,
                              hora: solicitud.hora,
                              notas: solicitud.notas || '',
                              estado: solicitud.estado
                            });
                            setShowVisitaModal(true);
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          ✏️ Modificar
                        </button>
                      </>
                    )}

                    {(solicitud.estado === 'completada' || solicitud.estado === 'cancelada') && (
                      <button
                        onClick={() => {
                          setSolicitudSeleccionada(solicitud);
                          setShowSolicitudModal(true);
                        }}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        👁️ Ver Detalles
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximas Visitas */}
        {visitasProgramadas.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">📅 Próximas Visitas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visitasProgramadas
                .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                .slice(0, 6)
                .map((visita) => (
                  <div key={visita.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">👤</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{visita.clienteNombre}</h4>
                        <p className="text-xs text-gray-600">{visita.direccion}</p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(visita.fecha).toLocaleDateString()} - {visita.hora}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(visita.estado)}`}>
                        {getEstadoTexto(visita.estado)}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3">
                      {visita.productos.length} productos a reciclar
                    </p>
                    
                    <button
                      onClick={() => {
                        setVisitaSeleccionada(visita);
                        setFormVisita({
                          fecha: visita.fecha,
                          hora: visita.hora,
                          notas: visita.notas || '',
                          estado: visita.estado
                        });
                        setShowVisitaModal(true);
                      }}
                      className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Gestionar Visita
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Estadísticas Detalladas */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">📊 Estadísticas de Reciclaje</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {solicitudesReciclaje.filter(s => s.estado === 'programada').length}
              </div>
              <div className="text-sm text-blue-700">Nuevas Solicitudes</div>
              <div className="text-xs text-blue-600 mt-1">Esperando confirmación</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {solicitudesReciclaje.filter(s => s.estado === 'confirmada').length}
              </div>
              <div className="text-sm text-green-700">Visitas Confirmadas</div>
              <div className="text-xs text-green-600 mt-1">Listas para realizar</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {solicitudesReciclaje.filter(s => s.estado === 'completada').length}
              </div>
              <div className="text-sm text-purple-700">Reciclaje Completado</div>
              <div className="text-xs text-purple-600 mt-1">Este mes</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-2">
                {solicitudesReciclaje.filter(s => s.estado === 'cancelada').length}
              </div>
              <div className="text-sm text-orange-700">Visitas Canceladas</div>
              <div className="text-xs text-orange-600 mt-1">Total histórico</div>
            </div>
          </div>
        </div>

        {/* Historial */}
        {historialReciclaje.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">📊 Historial de Reciclaje</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Productos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historialReciclaje.slice(0, 10).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.clienteNombre}</div>
                        <div className="text-sm text-gray-500">{item.direccion}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.fecha).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.productos.length} productos
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(item.estado)}`}>
                          {getEstadoTexto(item.estado)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSolicitudSeleccionada(item);
                            setShowSolicitudModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalles de Solicitud */}
      {showSolicitudModal && solicitudSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">📋 Detalles de la Solicitud</h3>
              <button
                onClick={() => setShowSolicitudModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{solicitudSeleccionada.clienteNombre}</p>
                  <p className="text-sm text-gray-600">{solicitudSeleccionada.direccion}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha y Hora</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-900">
                    {new Date(solicitudSeleccionada.fecha).toLocaleDateString()} - {solicitudSeleccionada.hora}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Productos a Reciclar</label>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {solicitudSeleccionada.productos.map((producto, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {producto.icono} {producto.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {solicitudSeleccionada.notas && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notas del Cliente</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-900">{solicitudSeleccionada.notas}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado Actual</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(solicitudSeleccionada.estado)}`}>
                    {getEstadoTexto(solicitudSeleccionada.estado)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Creación</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-900">
                    {new Date(solicitudSeleccionada.fechaCreacion).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSolicitudModal(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Visita */}
      {showVisitaModal && visitaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">✏️ Gestionar Visita</h3>
              <button
                onClick={() => setShowVisitaModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{visitaSeleccionada.clienteNombre}</p>
                  <p className="text-sm text-gray-600">{visitaSeleccionada.direccion}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                  <input
                    type="date"
                    value={formVisita.fecha}
                    onChange={(e) => setFormVisita({...formVisita, fecha: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                  <input
                    type="time"
                    value={formVisita.hora}
                    onChange={(e) => setFormVisita({...formVisita, hora: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={formVisita.estado}
                  onChange={(e) => setFormVisita({...formVisita, estado: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="confirmada">Confirmada</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notas Adicionales</label>
                <textarea
                  value={formVisita.notas}
                  onChange={(e) => setFormVisita({...formVisita, notas: e.target.value})}
                  placeholder="Agregar notas sobre la visita..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowVisitaModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={actualizarVisita}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Actualizar Visita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
