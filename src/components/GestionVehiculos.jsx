import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import { createMarchReminders } from '../utils/initializeData';
import { NotificationService } from '../utils/notificationService';

export default function GestionVehiculos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState(null);
  const [formData, setFormData] = useState({
    patente: '',
    marca: '',
    modelo: '',
    año: '',
    color: '',
    combustible: 'gasolina',
    transmision: 'manual',
    kilometraje: '',
    numeroMotor: '',
    numeroChasis: '',
    valorComercial: '',
    uso: 'particular',
    seguro: '',
    fechaRevisionTecnica: '',
    fechaPermisoCirculacion: '',
    observaciones: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadVehiculos();
  }, [user, navigate]);

  const loadVehiculos = async () => {
    try {
      // Cargar vehículos del usuario - buscar por userId y clienteId
      const vehiculosQueryUserId = query(
        collection(db, 'vehiculos_usuario'),
        where('userId', '==', user.uid)
      );
      const vehiculosQueryClienteId = query(
        collection(db, 'vehiculos_usuario'),
        where('clienteId', '==', user.uid)
      );
      
      const [vehiculosSnapshotUserId, vehiculosSnapshotClienteId] = await Promise.all([
        getDocs(vehiculosQueryUserId),
        getDocs(vehiculosQueryClienteId)
      ]);
      
      // Combinar resultados de ambas consultas
      const vehiculosUserId = vehiculosSnapshotUserId.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const vehiculosClienteId = vehiculosSnapshotClienteId.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Eliminar duplicados basándose en el ID del documento
      const vehiculosUnicos = [...vehiculosUserId];
      vehiculosClienteId.forEach(vehiculo => {
        if (!vehiculosUnicos.find(v => v.id === vehiculo.id)) {
          vehiculosUnicos.push(vehiculo);
        }
      });
      
      setVehiculos(vehiculosUnicos);
    } catch (error) {
      console.error('Error loading vehiculos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para crear recordatorios automáticos basados en fechas de vencimiento
  const createVehicleReminders = async (vehiculoId, vehiculoData) => {
    try {
      const vehiculo = { id: vehiculoId, ...vehiculoData };
      
      // Crear recordatorios si hay fechas definidas
      if (vehiculoData.fechaPermisoCirculacion) {
        const fechaPermiso = new Date(vehiculoData.fechaPermisoCirculacion);
        // Recordatorio 30 días antes del vencimiento
        const fechaRecordatorio = new Date(fechaPermiso);
        fechaRecordatorio.setDate(fechaRecordatorio.getDate() - 30);
        
        if (fechaRecordatorio > new Date()) {
          await NotificationService.notifyVehicleReminder(
            vehiculoData.userId,
            vehiculo,
            'permiso_circulacion',
            fechaPermiso
          );
        }
      }
      
      if (vehiculoData.fechaRevisionTecnica) {
        const fechaRevision = new Date(vehiculoData.fechaRevisionTecnica);
        // Recordatorio 15 días antes del vencimiento
        const fechaRecordatorio = new Date(fechaRevision);
        fechaRecordatorio.setDate(fechaRecordatorio.getDate() - 15);
        
        if (fechaRecordatorio > new Date()) {
          await NotificationService.notifyVehicleReminder(
            vehiculoData.userId,
            vehiculo,
            'revision_tecnica',
            fechaRevision
          );
        }
      }
      
      // Si el vehículo tiene más de 3 años, sugerir SOAP
      const añoActual = new Date().getFullYear();
      if (añoActual - parseInt(vehiculoData.año) >= 3) {
        // Crear recordatorio de SOAP
        const fechaSOAP = new Date();
        fechaSOAP.setMonth(fechaSOAP.getMonth() + 3); // En 3 meses
        
        await NotificationService.notifyVehicleReminder(
          vehiculoData.userId,
          vehiculo,
          'soap',
          fechaSOAP
        );
      }
      
    } catch (error) {
      console.error('Error creating vehicle reminders:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.patente.trim()) newErrors.patente = 'Patente es requerida';
    if (!formData.marca.trim()) newErrors.marca = 'Marca es requerida';
    if (!formData.modelo.trim()) newErrors.modelo = 'Modelo es requerido';
    if (!formData.año) newErrors.año = 'Año es requerido';
    if (!formData.color.trim()) newErrors.color = 'Color es requerido';
    
    // Validar patente formato chileno
    const patenteRegex = /^[A-Z]{2}[A-Z]{2}\d{2}$|^[A-Z]{4}\d{2}$|^\d{4}[A-Z]{2}$/;
    if (formData.patente && !patenteRegex.test(formData.patente.replace(/\s+/g, '').toUpperCase())) {
      newErrors.patente = 'Formato de patente inválido';
    }
    
    // Validar año
    const currentYear = new Date().getFullYear();
    if (formData.año && (formData.año < 1990 || formData.año > currentYear + 1)) {
      newErrors.año = `Año debe estar entre 1990 y ${currentYear + 1}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const vehiculoData = {
        userId: user.uid,
        ...formData,
        patente: formData.patente.toUpperCase().replace(/\s+/g, ''),
        año: parseInt(formData.año),
        kilometraje: formData.kilometraje ? parseInt(formData.kilometraje) : 0,
        valorComercial: formData.valorComercial ? parseInt(formData.valorComercial) : 0,
        fechaRegistro: new Date(),
        activo: true
      };

      if (editingVehiculo) {
        await updateDoc(doc(db, 'vehiculos_usuario', editingVehiculo.id), vehiculoData);
      } else {
        const docRef = await addDoc(collection(db, 'vehiculos_usuario'), vehiculoData);
        
        // Crear recordatorios automáticos para el vehículo nuevo
        await createMarchReminders(user.uid);
        await createVehicleReminders(docRef.id, vehiculoData);
      }
      
      await loadVehiculos();
      resetForm();
      setShowModal(false);
      
      // Notificar al usuario del registro exitoso
      await NotificationService.createInAppNotification(
        user.uid,
        'sistema',
        '🚗 Vehículo Registrado',
        `Tu ${formData.marca} ${formData.modelo} ha sido registrado exitosamente. Recibirás recordatorios automáticos de mantenciones.`,
        { vehiculoPatente: formData.patente }
      );
      
    } catch (error) {
      console.error('Error saving vehiculo:', error);
      alert('Error al guardar vehículo. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patente: '',
      marca: '',
      modelo: '',
      año: '',
      color: '',
      combustible: 'gasolina',
      transmision: 'manual',
      kilometraje: '',
      numeroMotor: '',
      numeroChasis: '',
      valorComercial: '',
      uso: 'particular',
      seguro: '',
      fechaRevisionTecnica: '',
      fechaPermisoCirculacion: '',
      observaciones: ''
    });
    setEditingVehiculo(null);
    setErrors({});
  };

  const handleEdit = (vehiculo) => {
    setEditingVehiculo(vehiculo);
    setFormData({
      ...vehiculo,
      fechaRevisionTecnica: vehiculo.fechaRevisionTecnica ? 
        new Date(vehiculo.fechaRevisionTecnica.seconds * 1000).toISOString().split('T')[0] : '',
      fechaPermisoCirculacion: vehiculo.fechaPermisoCirculacion ? 
        new Date(vehiculo.fechaPermisoCirculacion.seconds * 1000).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (vehiculoId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
      try {
        await deleteDoc(doc(db, 'vehiculos_usuario', vehiculoId));
        await loadVehiculos();
      } catch (error) {
        console.error('Error deleting vehiculo:', error);
        alert('Error al eliminar vehículo');
      }
    }
  };

  const calcularAntiguedad = (año) => {
    return new Date().getFullYear() - año;
  };

  const getEstadoRevision = (fechaRevision) => {
    if (!fechaRevision) return { estado: 'sin_datos', dias: null };
    
    const fecha = new Date(fechaRevision.seconds * 1000);
    const vencimiento = new Date(fecha);
    vencimiento.setFullYear(vencimiento.getFullYear() + 1);
    
    const hoy = new Date();
    const dias = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
    
    if (dias < 0) return { estado: 'vencida', dias: Math.abs(dias) };
    if (dias <= 30) return { estado: 'proxima', dias };
    return { estado: 'vigente', dias };
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
          <p className="text-gray-600">Debes iniciar sesión para gestionar tus vehículos.</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6"></div>
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Mis Vehículos</h1>
            <p className="text-gray-600">Gestiona la información de tus vehículos</p>
          </div>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            + Agregar Vehículo
          </button>
        </div>

        {/* Lista de vehículos */}
        {vehiculos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No tienes vehículos registrados
            </h3>
            <p className="text-gray-500 mb-6">
              Agrega tu primer vehículo para comenzar a recibir recordatorios y gestionar servicios
            </p>
            <button
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              Agregar Mi Primer Vehículo
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehiculos.map(vehiculo => {
              const antiguedad = calcularAntiguedad(vehiculo.año);
              const estadoRevision = getEstadoRevision(vehiculo.fechaRevisionTecnica);
              
              return (
                <div key={vehiculo.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">
                        {vehiculo.marca} {vehiculo.modelo}
                      </h3>
                      <p className="text-gray-600">{vehiculo.año} • {vehiculo.color}</p>
                      <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block">
                        {vehiculo.patente}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => handleEdit(vehiculo)}
                      >
                        ✏️
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleDelete(vehiculo.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kilometraje:</span>
                      <span className="font-medium">{vehiculo.kilometraje?.toLocaleString()} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Combustible:</span>
                      <span className="font-medium">{vehiculo.combustible}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Uso:</span>
                      <span className="font-medium">{vehiculo.uso}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Antigüedad:</span>
                      <span className="font-medium">{antiguedad} años</span>
                    </div>
                  </div>
                  
                  {/* Estado de documentos */}
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Revisión Técnica:</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        estadoRevision.estado === 'vigente' ? 'bg-green-100 text-green-800' :
                        estadoRevision.estado === 'proxima' ? 'bg-yellow-100 text-yellow-800' :
                        estadoRevision.estado === 'vencida' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {estadoRevision.estado === 'vigente' ? '✅ Vigente' :
                         estadoRevision.estado === 'proxima' ? `⚠️ ${estadoRevision.dias} días` :
                         estadoRevision.estado === 'vencida' ? `❌ Vencida ${estadoRevision.dias}d` :
                         '❓ Sin datos'}
                      </span>
                    </div>
                    
                    {vehiculo.seguro && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Seguro:</span>
                        <span className="text-xs text-green-600">✅ {vehiculo.seguro}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button
                      className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700"
                      onClick={() => navigate(`/servicios/revision-tecnica?vehiculo=${vehiculo.id}`)}
                    >
                      🔧 Servicios
                    </button>
                    <button
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                      onClick={() => navigate(`/vehiculos/${vehiculo.id}/historial`)}
                    >
                      📋 Historial
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editingVehiculo ? 'Editar Vehículo' : 'Agregar Nuevo Vehículo'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información básica */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Información Básica</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Patente *</label>
                    <input
                      type="text"
                      className={`w-full border rounded px-3 py-2 uppercase ${errors.patente ? 'border-red-500' : ''}`}
                      placeholder="XXXX00"
                      value={formData.patente}
                      onChange={(e) => setFormData(prev => ({ ...prev, patente: e.target.value }))}
                    />
                    {errors.patente && <p className="text-red-500 text-xs mt-1">{errors.patente}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Marca *</label>
                    <input
                      type="text"
                      className={`w-full border rounded px-3 py-2 ${errors.marca ? 'border-red-500' : ''}`}
                      value={formData.marca}
                      onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                    />
                    {errors.marca && <p className="text-red-500 text-xs mt-1">{errors.marca}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Modelo *</label>
                    <input
                      type="text"
                      className={`w-full border rounded px-3 py-2 ${errors.modelo ? 'border-red-500' : ''}`}
                      value={formData.modelo}
                      onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                    />
                    {errors.modelo && <p className="text-red-500 text-xs mt-1">{errors.modelo}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Año *</label>
                    <input
                      type="number"
                      className={`w-full border rounded px-3 py-2 ${errors.año ? 'border-red-500' : ''}`}
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      value={formData.año}
                      onChange={(e) => setFormData(prev => ({ ...prev, año: e.target.value }))}
                    />
                    {errors.año && <p className="text-red-500 text-xs mt-1">{errors.año}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Color *</label>
                    <input
                      type="text"
                      className={`w-full border rounded px-3 py-2 ${errors.color ? 'border-red-500' : ''}`}
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    />
                    {errors.color && <p className="text-red-500 text-xs mt-1">{errors.color}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Kilometraje</label>
                    <input
                      type="number"
                      className="w-full border rounded px-3 py-2"
                      value={formData.kilometraje}
                      onChange={(e) => setFormData(prev => ({ ...prev, kilometraje: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Características técnicas */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Características Técnicas</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Combustible</label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={formData.combustible}
                      onChange={(e) => setFormData(prev => ({ ...prev, combustible: e.target.value }))}
                    >
                      <option value="gasolina">Gasolina</option>
                      <option value="diesel">Diésel</option>
                      <option value="hibrido">Híbrido</option>
                      <option value="electrico">Eléctrico</option>
                      <option value="gnc">GNC</option>
                      <option value="glp">GLP</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Transmisión</label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={formData.transmision}
                      onChange={(e) => setFormData(prev => ({ ...prev, transmision: e.target.value }))}
                    >
                      <option value="manual">Manual</option>
                      <option value="automatica">Automática</option>
                      <option value="semiautomatica">Semiautomática</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Uso del Vehículo</label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={formData.uso}
                      onChange={(e) => setFormData(prev => ({ ...prev, uso: e.target.value }))}
                    >
                      <option value="particular">Particular</option>
                      <option value="comercial">Comercial</option>
                      <option value="taxi">Taxi</option>
                      <option value="uber">Uber/Cabify</option>
                      <option value="empresa">Empresa</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Documentación */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Documentación y Seguros</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Fecha Revisión Técnica</label>
                    <input
                      type="date"
                      className="w-full border rounded px-3 py-2"
                      value={formData.fechaRevisionTecnica}
                      onChange={(e) => setFormData(prev => ({ ...prev, fechaRevisionTecnica: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Compañía de Seguros</label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2"
                      placeholder="Ej: Mapfre, Zurich, Liberty"
                      value={formData.seguro}
                      onChange={(e) => setFormData(prev => ({ ...prev, seguro: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium mb-1">Observaciones</label>
                <textarea
                  rows="3"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Información adicional sobre el vehículo..."
                  value={formData.observaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : (editingVehiculo ? 'Actualizar' : 'Agregar Vehículo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
