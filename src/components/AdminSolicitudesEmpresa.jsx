import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy, where, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import { NotificationService } from '../utils/notificationService';
import { ESTADOS_EMPRESA, ESTADOS_SOLICITUD, obtenerDescripcionEstado, puedeTransicionar } from '../utils/empresaStandards';

export default function AdminSolicitudesEmpresa() {
  const { user } = useAuth();
  const [solicitudesProveedor, setSolicitudesProveedor] = useState([]);
  const [solicitudesEmpresa, setSolicitudesEmpresa] = useState([]);
  const [empresasRegistradas, setEmpresasRegistradas] = useState([]);
  const [filtros, setFiltros] = useState({
    estado: '',
    tipoEmpresa: '',
    busqueda: ''
  });
  const [loading, setLoading] = useState(true);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [mostrandoModal, setMostrandoModal] = useState(false);
  const [tabActivo, setTabActivo] = useState('solicitudes');

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      
      // Cargar solicitudes de proveedores
      const solicitudesProveedorCollection = collection(db, 'solicitudes_proveedor');
      const queryProveedor = query(solicitudesProveedorCollection, orderBy('fechaSolicitud', 'desc'));
      const snapshotProveedor = await getDocs(queryProveedor);
      const solicitudesProveedorData = snapshotProveedor.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        coleccion: 'solicitudes_proveedor'
      }));

      // Cargar solicitudes de empresas
      const solicitudesEmpresaCollection = collection(db, 'solicitudes_empresa');
      const queryEmpresa = query(solicitudesEmpresaCollection, orderBy('fechaSolicitud', 'desc'));
      const snapshotEmpresa = await getDocs(queryEmpresa);
      const solicitudesEmpresaData = snapshotEmpresa.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        coleccion: 'solicitudes_empresa'
      }));

      // Cargar empresas ya registradas
      const empresasCollection = collection(db, 'empresas');
      const queryEmpresas = query(empresasCollection, orderBy('fechaRegistro', 'desc'));
      const snapshotEmpresas = await getDocs(queryEmpresas);
      const empresasData = snapshotEmpresas.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        coleccion: 'empresas'
      }));

      setSolicitudesProveedor(solicitudesProveedorData);
      setSolicitudesEmpresa(solicitudesEmpresaData);
      setEmpresasRegistradas(empresasData);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      NotificationService.showError('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const todasLasSolicitudes = [...solicitudesProveedor, ...solicitudesEmpresa]
    .sort((a, b) => {
      const fechaA = a.fechaSolicitud?.toDate ? a.fechaSolicitud.toDate() : new Date(a.fechaSolicitud);
      const fechaB = b.fechaSolicitud?.toDate ? b.fechaSolicitud.toDate() : new Date(b.fechaSolicitud);
      return fechaB - fechaA;
    });

  // Determinar qué datos mostrar según el tab activo
  let datosAMostrar = [];
  if (tabActivo === 'solicitudes') {
    datosAMostrar = todasLasSolicitudes;
  } else if (tabActivo === 'empresas') {
    datosAMostrar = empresasRegistradas;
  } else if (tabActivo === 'proveedores') {
    datosAMostrar = solicitudesProveedor;
  } else if (tabActivo === 'otras') {
    datosAMostrar = solicitudesEmpresa;
  }

  const datosFiltrados = datosAMostrar.filter(item => {
    if (filtros.estado && item.estado !== filtros.estado) return false;
    if (filtros.tipoEmpresa && item.tipoEmpresa !== filtros.tipoEmpresa) return false;
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      return (
        item.nombreEmpresa?.toLowerCase().includes(busqueda) ||
        item.nombre?.toLowerCase().includes(busqueda) ||
        item.email?.toLowerCase().includes(busqueda) ||
        item.rutEmpresa?.toLowerCase().includes(busqueda) ||
        item.rut?.toLowerCase().includes(busqueda)
      );
    }
    return true;
  });

  const actualizarEstado = async (item, nuevoEstado) => {
    try {
      // Validar transición permitida
      if (!puedeTransicionar(item.estado, nuevoEstado, item.coleccion !== 'empresas')) {
        NotificationService.showError(`No se puede cambiar de "${item.estado}" a "${nuevoEstado}"`);
        return;
      }

      if (item.coleccion === 'empresas') {
        // Para empresas registradas, actualizar el estado en la colección empresas
        await updateDoc(doc(db, 'empresas', item.id), {
          estado: nuevoEstado,
          fechaActualizacion: new Date()
        });
      } else {
        // Para solicitudes, actualizar en su colección correspondiente
        await updateDoc(doc(db, item.coleccion, item.id), {
          estado: nuevoEstado,
          fechaActualizacion: new Date()
        });

        // Si se aprueba una solicitud, crear registro en empresas
        if (nuevoEstado === ESTADOS_SOLICITUD.APROBADA) {
          await crearEmpresaDesdeolicitud(item);
        }
      }
      
      await cargarSolicitudes();
      NotificationService.showSuccess(`Estado actualizado a ${obtenerDescripcionEstado(nuevoEstado, item.coleccion !== 'empresas')}`);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      NotificationService.showError('Error al actualizar el estado');
    }
  };

  const crearEmpresaDesdeolicitud = async (solicitud) => {
    try {
      const nuevaEmpresa = {
        nombre: solicitud.nombreEmpresa,
        rut: solicitud.rutEmpresa,
        email: solicitud.email,
        telefono: solicitud.telefono,
        direccion: solicitud.direccion,
        comuna: solicitud.comuna,
        region: solicitud.region,
        tipoEmpresa: solicitud.tipoEmpresa,
        sectorAutomotriz: solicitud.sectorAutomotriz,
        sitioWeb: solicitud.sitioWeb,
        representante: {
          nombre: solicitud.nombreRepresentante,
          cargo: solicitud.cargoRepresentante,
          email: solicitud.emailRepresentante,
          telefono: solicitud.telefonoRepresentante
        },
        estado: ESTADOS_EMPRESA.ACTIVA,
        fechaRegistro: new Date(),
        fechaAprobacion: new Date(),
        solicitudOriginalId: solicitud.id,
        solicitudColeccion: solicitud.coleccion
      };

      await addDoc(collection(db, 'empresas'), nuevaEmpresa);
      NotificationService.showSuccess('Empresa registrada exitosamente');
    } catch (error) {
      console.error('Error al crear empresa:', error);
      NotificationService.showError('Error al crear el registro de empresa');
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const fechaObj = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return fechaObj.toLocaleString('es-CL');
  };

  const obtenerEstadoColor = (estado) => {
    switch (estado) {
      // Estados de solicitud
      case ESTADOS_SOLICITUD.PENDIENTE: return 'bg-yellow-100 text-yellow-800';
      case ESTADOS_SOLICITUD.EN_REVISION: return 'bg-blue-100 text-blue-800';
      case ESTADOS_SOLICITUD.APROBADA: return 'bg-green-100 text-green-800';
      case ESTADOS_SOLICITUD.RECHAZADA: return 'bg-red-100 text-red-800';
      
      // Estados de empresa
      case ESTADOS_EMPRESA.CATALOGADA: return 'bg-gray-100 text-gray-800';
      case ESTADOS_EMPRESA.PENDIENTE_VALIDACION: return 'bg-yellow-100 text-yellow-800';
      case ESTADOS_EMPRESA.EN_VISITA: return 'bg-orange-100 text-orange-800';
      case ESTADOS_EMPRESA.VALIDADA: return 'bg-blue-100 text-blue-800';
      case ESTADOS_EMPRESA.ACTIVA: return 'bg-green-100 text-green-800';
      case ESTADOS_EMPRESA.SUSPENDIDA: return 'bg-red-100 text-red-800';
      case ESTADOS_EMPRESA.INACTIVA: return 'bg-gray-100 text-gray-800';
      case ESTADOS_EMPRESA.RECHAZADA: return 'bg-red-100 text-red-800';
      
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando solicitudes...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Empresas y Solicitudes</h1>
        <p className="text-gray-600">Administra solicitudes pendientes y empresas ya registradas en el sistema</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'solicitudes', label: 'Solicitudes Pendientes', count: todasLasSolicitudes.filter(s => s.estado === 'pendiente').length },
              { key: 'empresas', label: 'Empresas Registradas', count: empresasRegistradas.length },
              { key: 'proveedores', label: 'Solo Proveedores', count: solicitudesProveedor.length },
              { key: 'otras', label: 'Otras Empresas', count: solicitudesEmpresa.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setTabActivo(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  tabActivo === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_revision">En Revisión</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Empresa</label>
            <select
              value={filtros.tipoEmpresa}
              onChange={(e) => setFiltros({...filtros, tipoEmpresa: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Todos los tipos</option>
              <option value="proveedor">Proveedor</option>
              <option value="taller">Taller</option>
              <option value="distribuidor">Distribuidor</option>
              <option value="pyme">Pyme</option>
              <option value="emprendimiento">Emprendimiento</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Buscar por nombre, email o RUT..."
              value={filtros.busqueda}
              onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Lista de solicitudes */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {tabActivo === 'solicitudes' && 'Solicitudes Pendientes'}
            {tabActivo === 'empresas' && 'Empresas Registradas'}
            {tabActivo === 'proveedores' && 'Solicitudes de Proveedores'}
            {tabActivo === 'otras' && 'Solicitudes de Otras Empresas'}
            ({datosFiltrados.length})
          </h3>
        </div>
        
        {datosFiltrados.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No se encontraron {tabActivo === 'empresas' ? 'empresas' : 'solicitudes'} con los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {tabActivo === 'empresas' ? 'Empresa' : 'Empresa/Solicitud'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha {tabActivo === 'empresas' ? 'Registro' : 'Solicitud'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {datosFiltrados.map((item) => (
                  <tr key={`${item.coleccion}-${item.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.nombreEmpresa || item.nombre || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.email || 'Sin email'}
                        </div>
                        <div className="text-sm text-gray-500">
                          RUT: {item.rutEmpresa || item.rut || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.tipoEmpresa || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${obtenerEstadoColor(item.estado)}`}>
                        {item.estado || 'pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatearFecha(item.fechaSolicitud || item.fechaRegistro)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSolicitudSeleccionada(item);
                            setMostrandoModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver Detalles
                        </button>
                        {(item.estado === 'pendiente' || tabActivo === 'empresas') && (
                          <>
                            {item.estado === 'pendiente' && (
                              <>
                                <button
                                  onClick={() => actualizarEstado(item, 'aprobada')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Aprobar
                                </button>
                                <button
                                  onClick={() => actualizarEstado(item, 'rechazada')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Rechazar
                                </button>
                              </>
                            )}
                            {tabActivo === 'empresas' && (
                              <>
                                <button
                                  onClick={() => actualizarEstado(item, item.estado === 'activa' ? 'inactiva' : 'activa')}
                                  className={item.estado === 'activa' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                                >
                                  {item.estado === 'activa' ? 'Desactivar' : 'Activar'}
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {mostrandoModal && solicitudSeleccionada && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalles de la Solicitud
                </h3>
                <button
                  onClick={() => setMostrandoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                    <p className="text-sm text-gray-900">{solicitudSeleccionada.nombreEmpresa || solicitudSeleccionada.nombre || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">RUT</label>
                    <p className="text-sm text-gray-900">{solicitudSeleccionada.rutEmpresa || solicitudSeleccionada.rut || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{solicitudSeleccionada.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <p className="text-sm text-gray-900">{solicitudSeleccionada.telefono || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dirección</label>
                    <p className="text-sm text-gray-900">{solicitudSeleccionada.direccion || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Región</label>
                    <p className="text-sm text-gray-900">{solicitudSeleccionada.region || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Comuna</label>
                    <p className="text-sm text-gray-900">{solicitudSeleccionada.comuna || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Empresa</label>
                    <p className="text-sm text-gray-900">{solicitudSeleccionada.tipoEmpresa || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Representante</label>
                    <p className="text-sm text-gray-900">
                      {solicitudSeleccionada.nombreRepresentante || 
                       solicitudSeleccionada.representante?.nombre || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cargo</label>
                    <p className="text-sm text-gray-900">
                      {solicitudSeleccionada.cargoRepresentante || 
                       solicitudSeleccionada.representante?.cargo || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Representante</label>
                    <p className="text-sm text-gray-900">
                      {solicitudSeleccionada.emailRepresentante || 
                       solicitudSeleccionada.representante?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sitio Web</label>
                    <p className="text-sm text-gray-900">{solicitudSeleccionada.sitioWeb || 'N/A'}</p>
                  </div>
                  {solicitudSeleccionada.coleccion === 'empresas' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha de Registro</label>
                        <p className="text-sm text-gray-900">{formatearFecha(solicitudSeleccionada.fechaRegistro)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Estado Actual</label>
                        <p className="text-sm text-gray-900">{solicitudSeleccionada.estado || 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                {solicitudSeleccionada.estado === 'pendiente' && (
                  <>
                    <button
                      onClick={() => {
                        actualizarEstado(solicitudSeleccionada, 'aprobada');
                        setMostrandoModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => {
                        actualizarEstado(solicitudSeleccionada, 'rechazada');
                        setMostrandoModal(false);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Rechazar
                    </button>
                  </>
                )}
                {solicitudSeleccionada.coleccion === 'empresas' && (
                  <button
                    onClick={() => {
                      actualizarEstado(solicitudSeleccionada, solicitudSeleccionada.estado === 'activa' ? 'inactiva' : 'activa');
                      setMostrandoModal(false);
                    }}
                    className={`px-4 py-2 rounded-md text-white ${
                      solicitudSeleccionada.estado === 'activa' 
                        ? 'bg-yellow-600 hover:bg-yellow-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {solicitudSeleccionada.estado === 'activa' ? 'Desactivar' : 'Activar'}
                  </button>
                )}
                <button
                  onClick={() => setMostrandoModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
