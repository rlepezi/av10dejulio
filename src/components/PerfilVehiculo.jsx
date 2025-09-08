import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

const PerfilVehiculo = ({ vehiculo, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('resumen');
  const [gastos, setGastos] = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [revisiones, setRevisiones] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('');

  // Estados para formularios
  const [gastoForm, setGastoForm] = useState({
    tipo: '',
    descripcion: '',
    monto: '',
    fecha: '',
    kilometraje: '',
    proveedor: '',
    observaciones: ''
  });

  const [mantenimientoForm, setMantenimientoForm] = useState({
    tipo: '',
    descripcion: '',
    costo: '',
    fecha: '',
    kilometraje: '',
    proveedor: '',
    proximoMantenimiento: '',
    observaciones: ''
  });

  const [documentoForm, setDocumentoForm] = useState({
    tipo: '',
    numero: '',
    fechaEmision: '',
    fechaVencimiento: '',
    emisor: '',
    observaciones: ''
  });

  useEffect(() => {
    if (vehiculo) {
      loadVehiculoData();
    }
  }, [vehiculo]);

  const loadVehiculoData = async () => {
    try {
      setLoading(true);
      
      // Cargar gastos del vehículo
      const gastosQuery = query(
        collection(db, 'gastos_vehiculos'),
        where('vehiculoId', '==', vehiculo.id),
        orderBy('fecha', 'desc')
      );
      const gastosSnapshot = await getDocs(gastosQuery);
      setGastos(gastosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Cargar mantenimientos del vehículo
      const mantenimientosQuery = query(
        collection(db, 'mantenimientos'),
        where('vehiculoId', '==', vehiculo.id),
        orderBy('fecha', 'desc')
      );
      const mantenimientosSnapshot = await getDocs(mantenimientosQuery);
      setMantenimientos(mantenimientosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Cargar revisiones técnicas del vehículo
      const revisionesQuery = query(
        collection(db, 'revisiones_tecnicas'),
        where('vehiculoId', '==', vehiculo.id),
        orderBy('fecha', 'desc')
      );
      const revisionesSnapshot = await getDocs(revisionesQuery);
      setRevisiones(revisionesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Cargar notificaciones del vehículo
      const notificacionesQuery = query(
        collection(db, 'notificaciones_vehiculos'),
        where('vehiculoId', '==', vehiculo.id),
        orderBy('fecha', 'desc')
      );
      const notificacionesSnapshot = await getDocs(notificacionesQuery);
      setNotificaciones(notificacionesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      console.error('Error cargando datos del vehículo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGastoSubmit = async (e) => {
    e.preventDefault();
    try {
      const gastoData = {
        ...gastoForm,
        vehiculoId: vehiculo.id,
        clienteId: user.uid,
        fecha: new Date(gastoForm.fecha),
        monto: parseFloat(gastoForm.monto),
        kilometraje: parseInt(gastoForm.kilometraje),
        fechaCreacion: new Date()
      };

      await addDoc(collection(db, 'gastos_vehiculos'), gastoData);
      setGastos([gastoData, ...gastos]);
      setGastoForm({
        tipo: '',
        descripcion: '',
        monto: '',
        fecha: '',
        kilometraje: '',
        proveedor: '',
        observaciones: ''
      });
      setShowForm(false);
      alert('Gasto registrado exitosamente');
    } catch (error) {
      console.error('Error registrando gasto:', error);
      alert('Error al registrar el gasto');
    }
  };

  const handleMantenimientoSubmit = async (e) => {
    e.preventDefault();
    try {
      const mantenimientoData = {
        ...mantenimientoForm,
        vehiculoId: vehiculo.id,
        clienteId: user.uid,
        fecha: new Date(mantenimientoForm.fecha),
        costo: parseFloat(mantenimientoForm.costo),
        kilometraje: parseInt(mantenimientoForm.kilometraje),
        proximoMantenimiento: new Date(mantenimientoForm.proximoMantenimiento),
        fechaCreacion: new Date()
      };

      await addDoc(collection(db, 'mantenimientos'), mantenimientoData);
      setMantenimientos([mantenimientoData, ...mantenimientos]);
      setMantenimientoForm({
        tipo: '',
        descripcion: '',
        costo: '',
        fecha: '',
        kilometraje: '',
        proveedor: '',
        proximoMantenimiento: '',
        observaciones: ''
      });
      setShowForm(false);
      alert('Mantenimiento registrado exitosamente');
    } catch (error) {
      console.error('Error registrando mantenimiento:', error);
      alert('Error al registrar el mantenimiento');
    }
  };

  const handleDocumentoSubmit = async (e) => {
    e.preventDefault();
    try {
      const documentoData = {
        ...documentoForm,
        vehiculoId: vehiculo.id,
        clienteId: user.uid,
        fechaEmision: new Date(documentoForm.fechaEmision),
        fechaVencimiento: new Date(documentoForm.fechaVencimiento),
        fechaCreacion: new Date()
      };

      await addDoc(collection(db, 'documentos_vehiculos'), documentoData);
      setDocumentoForm({
        tipo: '',
        numero: '',
        fechaEmision: '',
        fechaVencimiento: '',
        emisor: '',
        observaciones: ''
      });
      setShowForm(false);
      alert('Documento registrado exitosamente');
    } catch (error) {
      console.error('Error registrando documento:', error);
      alert('Error al registrar el documento');
    }
  };

  const calcularGastosTotales = () => {
    return gastos.reduce((total, gasto) => total + (gasto.monto || 0), 0);
  };

  const calcularGastosMes = () => {
    const mesActual = new Date();
    const inicioMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
    
    return gastos
      .filter(gasto => gasto.fecha && gasto.fecha.toDate() >= inicioMes)
      .reduce((total, gasto) => total + (gasto.monto || 0), 0);
  };

  const getProximoMantenimiento = () => {
    const proximos = mantenimientos.filter(m => 
      m.proximoMantenimiento && 
      new Date(m.proximoMantenimiento.toDate()) > new Date()
    );
    return proximos.sort((a, b) => 
      new Date(a.proximoMantenimiento.toDate()) - new Date(b.proximoMantenimiento.toDate())
    )[0];
  };

  const getDocumentosVencidos = () => {
    const hoy = new Date();
    return revisiones.filter(r => 
      r.fechaVencimiento && 
      new Date(r.fechaVencimiento.toDate()) < hoy
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (date.toDate) {
      return date.toDate().toLocaleDateString('es-CL');
    }
    return new Date(date).toLocaleDateString('es-CL');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando perfil del vehículo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              🚗 {vehiculo.marca} {vehiculo.modelo} {vehiculo.año}
            </h2>
            <p className="text-gray-600">
              {vehiculo.patente} • {vehiculo.tipoVehiculo}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'resumen', label: 'Resumen', icon: '📊' },
              { id: 'gastos', label: 'Gastos', icon: '💰' },
              { id: 'mantenimientos', label: 'Mantenimientos', icon: '🔧' },
              { id: 'revisiones', label: 'Revisiones', icon: '🔍' },
              { id: 'documentos', label: 'Documentos', icon: '📄' },
              { id: 'notificaciones', label: 'Notificaciones', icon: '🔔' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido de las tabs */}
        <div className="space-y-6">
          {/* Tab Resumen */}
          {activeTab === 'resumen' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Estadísticas de gastos */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">💰 Gastos Totales</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(calcularGastosTotales())}
                </p>
                <p className="text-sm text-blue-700">
                  Este mes: {formatCurrency(calcularGastosMes())}
                </p>
              </div>

              {/* Próximo mantenimiento */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">🔧 Próximo Mantenimiento</h3>
                {getProximoMantenimiento() ? (
                  <div>
                    <p className="text-lg font-bold text-orange-600">
                      {getProximoMantenimiento().tipo}
                    </p>
                    <p className="text-sm text-orange-700">
                      {formatDate(getProximoMantenimiento().proximoMantenimiento)}
                    </p>
                  </div>
                ) : (
                  <p className="text-orange-600">No programado</p>
                )}
              </div>

              {/* Documentos vencidos */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-900 mb-2">⚠️ Documentos Vencidos</h3>
                <p className="text-2xl font-bold text-red-600">
                  {getDocumentosVencidos().length}
                </p>
                <p className="text-sm text-red-700">
                  Requieren atención
                </p>
              </div>

              {/* Información del vehículo */}
              <div className="bg-gray-50 p-4 rounded-lg md:col-span-2 lg:col-span-3">
                <h3 className="font-semibold text-gray-900 mb-3">📋 Información del Vehículo</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Marca</p>
                    <p className="font-medium">{vehiculo.marca}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Modelo</p>
                    <p className="font-medium">{vehiculo.modelo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Año</p>
                    <p className="font-medium">{vehiculo.año}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Patente</p>
                    <p className="font-medium">{vehiculo.patente}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Gastos */}
          {activeTab === 'gastos' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">💰 Gastos del Vehículo</h3>
                <button
                  onClick={() => {
                    setFormType('gasto');
                    setShowForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  + Agregar Gasto
                </button>
              </div>
              
              <div className="space-y-3">
                {gastos.map((gasto) => (
                  <div key={gasto.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{gasto.tipo}</h4>
                        <p className="text-sm text-gray-600">{gasto.descripcion}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(gasto.fecha)} • {gasto.kilometraje} km
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(gasto.monto)}</p>
                        <p className="text-sm text-gray-600">{gasto.proveedor}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {gastos.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No hay gastos registrados</p>
                )}
              </div>
            </div>
          )}

          {/* Tab Mantenimientos */}
          {activeTab === 'mantenimientos' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">🔧 Mantenimientos del Vehículo</h3>
                <button
                  onClick={() => {
                    setFormType('mantenimiento');
                    setShowForm(true);
                  }}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                >
                  + Agregar Mantenimiento
                </button>
              </div>
              
              <div className="space-y-3">
                {mantenimientos.map((mantenimiento) => (
                  <div key={mantenimiento.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{mantenimiento.tipo}</h4>
                        <p className="text-sm text-gray-600">{mantenimiento.descripcion}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(mantenimiento.fecha)} • {mantenimiento.kilometraje} km
                        </p>
                        {mantenimiento.proximoMantenimiento && (
                          <p className="text-xs text-orange-600">
                            Próximo: {formatDate(mantenimiento.proximoMantenimiento)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(mantenimiento.costo)}</p>
                        <p className="text-sm text-gray-600">{mantenimiento.proveedor}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {mantenimientos.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No hay mantenimientos registrados</p>
                )}
              </div>
            </div>
          )}

          {/* Tab Revisiones */}
          {activeTab === 'revisiones' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">🔍 Revisiones Técnicas</h3>
              <div className="space-y-3">
                {revisiones.map((revision) => (
                  <div key={revision.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {revision.centro?.nombre || 'Centro de Revisión'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {revision.tipoRevision} • {revision.estado}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(revision.fecha)} • {revision.hora}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          revision.estado === 'aprobada' ? 'bg-green-100 text-green-800' :
                          revision.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {revision.estado}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {revisiones.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No hay revisiones registradas</p>
                )}
              </div>
            </div>
          )}

          {/* Tab Documentos */}
          {activeTab === 'documentos' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">📄 Documentos del Vehículo</h3>
                <button
                  onClick={() => {
                    setFormType('documento');
                    setShowForm(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  + Agregar Documento
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { tipo: 'Permiso de Circulación', vencimiento: '2024-12-31', estado: 'vigente' },
                  { tipo: 'Seguro Obligatorio', vencimiento: '2024-11-15', estado: 'por_vencer' },
                  { tipo: 'Revisión Técnica', vencimiento: '2024-10-20', estado: 'vencido' }
                ].map((doc, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{doc.tipo}</h4>
                        <p className="text-sm text-gray-600">
                          Vence: {formatDate(new Date(doc.vencimiento))}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        doc.estado === 'vigente' ? 'bg-green-100 text-green-800' :
                        doc.estado === 'por_vencer' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {doc.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Notificaciones */}
          {activeTab === 'notificaciones' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">🔔 Notificaciones del Vehículo</h3>
              <div className="space-y-3">
                {notificaciones.map((notificacion) => (
                  <div key={notificacion.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{notificacion.titulo}</h4>
                        <p className="text-sm text-gray-600">{notificacion.mensaje}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(notificacion.fecha)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        notificacion.leida ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {notificacion.leida ? 'Leída' : 'Nueva'}
                      </span>
                    </div>
                  </div>
                ))}
                {notificaciones.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No hay notificaciones</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Formularios modales */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {formType === 'gasto' ? 'Agregar Gasto' :
                   formType === 'mantenimiento' ? 'Agregar Mantenimiento' :
                   'Agregar Documento'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {formType === 'gasto' && (
                <form onSubmit={handleGastoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Gasto</label>
                    <select
                      value={gastoForm.tipo}
                      onChange={(e) => setGastoForm({...gastoForm, tipo: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="combustible">Combustible</option>
                      <option value="mantenimiento">Mantenimiento</option>
                      <option value="peaje">Peaje</option>
                      <option value="estacionamiento">Estacionamiento</option>
                      <option value="seguro">Seguro</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descripción</label>
                    <input
                      type="text"
                      value={gastoForm.descripcion}
                      onChange={(e) => setGastoForm({...gastoForm, descripcion: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monto</label>
                    <input
                      type="number"
                      value={gastoForm.monto}
                      onChange={(e) => setGastoForm({...gastoForm, monto: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha</label>
                    <input
                      type="date"
                      value={gastoForm.fecha}
                      onChange={(e) => setGastoForm({...gastoForm, fecha: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kilometraje</label>
                    <input
                      type="number"
                      value={gastoForm.kilometraje}
                      onChange={(e) => setGastoForm({...gastoForm, kilometraje: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                    <input
                      type="text"
                      value={gastoForm.proveedor}
                      onChange={(e) => setGastoForm({...gastoForm, proveedor: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {formType === 'mantenimiento' && (
                <form onSubmit={handleMantenimientoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Mantenimiento</label>
                    <select
                      value={mantenimientoForm.tipo}
                      onChange={(e) => setMantenimientoForm({...mantenimientoForm, tipo: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="preventivo">Preventivo</option>
                      <option value="correctivo">Correctivo</option>
                      <option value="cambio_aceite">Cambio de Aceite</option>
                      <option value="frenos">Frenos</option>
                      <option value="neumaticos">Neumáticos</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descripción</label>
                    <textarea
                      value={mantenimientoForm.descripcion}
                      onChange={(e) => setMantenimientoForm({...mantenimientoForm, descripcion: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Costo</label>
                    <input
                      type="number"
                      value={mantenimientoForm.costo}
                      onChange={(e) => setMantenimientoForm({...mantenimientoForm, costo: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha</label>
                    <input
                      type="date"
                      value={mantenimientoForm.fecha}
                      onChange={(e) => setMantenimientoForm({...mantenimientoForm, fecha: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Próximo Mantenimiento</label>
                    <input
                      type="date"
                      value={mantenimientoForm.proximoMantenimiento}
                      onChange={(e) => setMantenimientoForm({...mantenimientoForm, proximoMantenimiento: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {formType === 'documento' && (
                <form onSubmit={handleDocumentoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Documento</label>
                    <select
                      value={documentoForm.tipo}
                      onChange={(e) => setDocumentoForm({...documentoForm, tipo: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="permiso_circulacion">Permiso de Circulación</option>
                      <option value="seguro_obligatorio">Seguro Obligatorio</option>
                      <option value="revision_tecnica">Revisión Técnica</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número</label>
                    <input
                      type="text"
                      value={documentoForm.numero}
                      onChange={(e) => setDocumentoForm({...documentoForm, numero: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Emisión</label>
                    <input
                      type="date"
                      value={documentoForm.fechaEmision}
                      onChange={(e) => setDocumentoForm({...documentoForm, fechaEmision: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Vencimiento</label>
                    <input
                      type="date"
                      value={documentoForm.fechaVencimiento}
                      onChange={(e) => setDocumentoForm({...documentoForm, fechaVencimiento: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Emisor</label>
                    <input
                      type="text"
                      value={documentoForm.emisor}
                      onChange={(e) => setDocumentoForm({...documentoForm, emisor: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilVehiculo;

