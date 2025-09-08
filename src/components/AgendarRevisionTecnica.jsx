import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import { initializeCentrosRevision } from '../utils/initRevisionTecnicaData';

const AgendarRevisionTecnica = () => {
  const { user, rol } = useAuth();
  const [centrosRevision, setCentrosRevision] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [misRevisiones, setMisRevisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('agendar');
  const [showModal, setShowModal] = useState(false);
  const [selectedCentro, setSelectedCentro] = useState(null);
  const [filtros, setFiltros] = useState({
    comuna: '',
    tipoVehiculo: '',
    horario: '',
    disponibilidad: 'disponible'
  });

  // Verificar autenticación y rol
  if (!user || rol !== 'cliente') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-4">Esta funcionalidad es solo para clientes autenticados</p>
          <p className="text-sm text-gray-500">Por favor, inicia sesión como cliente para acceder a esta funcionalidad</p>
        </div>
      </div>
    );
  }

  // Estados para el formulario de agendamiento
  const [formData, setFormData] = useState({
    vehiculoId: '',
    centroId: '',
    fecha: '',
    hora: '',
    tipoRevision: 'revision_tecnica',
    observaciones: '',
    contacto: {
      telefono: '',
      email: ''
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Inicializar centros de revisión técnica si no existen
      await initializeCentrosRevision();
      
      // Cargar centros de revisión técnica
      const centrosSnapshot = await getDocs(collection(db, 'centros_revision'));
      setCentrosRevision(centrosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      if (user) {
        // Cargar vehículos del usuario
        const vehiculosQuery = query(
          collection(db, 'vehiculos'),
          where('clienteId', '==', user.uid)
        );
        const vehiculosSnapshot = await getDocs(vehiculosQuery);
        setVehiculos(vehiculosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Cargar revisiones del usuario
        const revisionesQuery = query(
          collection(db, 'revisiones_tecnicas'),
          where('userId', '==', user.uid),
          orderBy('fechaCreacion', 'desc')
        );
        const revisionesSnapshot = await getDocs(revisionesQuery);
        setMisRevisiones(revisionesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const agendarRevision = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Debes estar logueado para agendar una cita');
      return;
    }

    try {
      const agendamiento = {
        ...formData,
        userId: user.uid,
        estado: 'pendiente',
        fechaCreacion: new Date(),
        centro: centrosRevision.find(c => c.id === formData.centroId),
        vehiculo: vehiculos.find(v => v.id === formData.vehiculoId)
      };

      await addDoc(collection(db, 'revisiones_tecnicas'), agendamiento);
      
      // Actualizar la lista de revisiones
      setMisRevisiones([agendamiento, ...misRevisiones]);
      
      // Limpiar formulario
      setFormData({
        vehiculoId: '',
        centroId: '',
        fecha: '',
        hora: '',
        tipoRevision: 'revision_tecnica',
        observaciones: '',
        contacto: {
          telefono: '',
          email: ''
        }
      });
      
      setShowModal(false);
      alert('¡Cita agendada exitosamente!');
    } catch (error) {
      console.error('Error agendando cita:', error);
      alert('Error al agendar la cita. Inténtalo de nuevo.');
    }
  };

  const filteredCentros = centrosRevision.filter(centro => {
    if (filtros.comuna && !centro.comuna?.toLowerCase().includes(filtros.comuna.toLowerCase())) {
      return false;
    }
    if (filtros.tipoVehiculo && !centro.tiposVehiculo?.includes(filtros.tipoVehiculo)) {
      return false;
    }
    if (filtros.horario && !centro.horarios?.includes(filtros.horario)) {
      return false;
    }
    if (filtros.disponibilidad === 'disponible' && centro.disponibilidad === 'no_disponible') {
      return false;
    }
    return true;
  });

  const formatDate = (fecha) => {
    if (!fecha) return '';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString('es-CL');
  };

  const formatTime = (fecha) => {
    if (!fecha) return '';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          🔧 Revisión Técnica
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('agendar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'agendar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Agendar Cita
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'historial'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mis Citas
          </button>
        </div>
      </div>

      {activeTab === 'agendar' && (
        <div className="space-y-6">
          {/* Filtros de búsqueda */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Buscar Centros de Revisión</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comuna</label>
                <input
                  type="text"
                  placeholder="Ej: Las Condes, Providencia..."
                  value={filtros.comuna}
                  onChange={(e) => setFiltros({...filtros, comuna: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Vehículo</label>
                <select
                  value={filtros.tipoVehiculo}
                  onChange={(e) => setFiltros({...filtros, tipoVehiculo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="automovil">Automóvil</option>
                  <option value="camioneta">Camioneta</option>
                  <option value="moto">Motocicleta</option>
                  <option value="bus">Bus</option>
                  <option value="camion">Camión</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
                <select
                  value={filtros.horario}
                  onChange={(e) => setFiltros({...filtros, horario: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="mañana">Mañana (8:00 - 12:00)</option>
                  <option value="tarde">Tarde (12:00 - 18:00)</option>
                  <option value="noche">Noche (18:00 - 20:00)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disponibilidad</label>
                <select
                  value={filtros.disponibilidad}
                  onChange={(e) => setFiltros({...filtros, disponibilidad: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="disponible">Disponibles</option>
                  <option value="todos">Todos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de centros */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Centros Disponibles ({filteredCentros.length})
              </h3>
            </div>

            {filteredCentros.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🔍</div>
                <p>No se encontraron centros que coincidan con los filtros</p>
                <button
                  onClick={() => setFiltros({comuna: '', tipoVehiculo: '', horario: '', disponibilidad: 'disponible'})}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCentros.map((centro) => (
                  <div key={centro.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{centro.nombre}</h4>
                        <p className="text-sm text-gray-600">{centro.comuna}, {centro.region}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        centro.disponibilidad === 'disponible' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {centro.disponibilidad === 'disponible' ? 'Disponible' : 'No disponible'}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{centro.direccion}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📞</span>
                        <span>{centro.telefono}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🕒</span>
                        <span>{centro.horarios}</span>
                      </div>
                      {centro.tiposVehiculo && (
                        <div className="flex items-center gap-2">
                          <span>🚗</span>
                          <span>{centro.tiposVehiculo.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedCentro(centro);
                          setFormData({...formData, centroId: centro.id});
                          setShowModal(true);
                        }}
                        disabled={centro.disponibilidad !== 'disponible'}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                          centro.disponibilidad === 'disponible'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Agendar Cita
                      </button>
                      <button
                        onClick={() => window.open(`https://maps.google.com/?q=${centro.direccion}`, '_blank')}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                      >
                        🗺️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'historial' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Historial de Citas</h3>
          {misRevisiones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <p>No tienes citas agendadas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {misRevisiones.map((revision) => {
                const centro = centrosRevision.find(c => c.id === revision.centroId);
                const vehiculo = vehiculos.find(v => v.id === revision.vehiculoId);
                
                return (
                  <div key={revision.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {centro?.nombre || 'Centro no encontrado'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.año}` : 'Vehículo no encontrado'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        revision.estado === 'confirmada' 
                          ? 'bg-green-100 text-green-800'
                          : revision.estado === 'pendiente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {revision.estado}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Fecha:</span> {formatDate(revision.fechaCreacion)}
                      </div>
                      <div>
                        <span className="font-medium">Hora:</span> {revision.hora}
                      </div>
                      <div>
                        <span className="font-medium">Tipo:</span> {revision.tipoRevision}
                      </div>
                    </div>
                    
                    {revision.observaciones && (
                      <div className="mt-3 text-sm text-gray-600">
                        <span className="font-medium">Observaciones:</span> {revision.observaciones}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de agendamiento */}
      {showModal && selectedCentro && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Agendar Cita - {selectedCentro.nombre}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={agendarRevision} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo</label>
                <select
                  value={formData.vehiculoId}
                  onChange={(e) => setFormData({...formData, vehiculoId: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar vehículo</option>
                  {vehiculos.map(vehiculo => (
                    <option key={vehiculo.id} value={vehiculo.id}>
                      {vehiculo.marca} {vehiculo.modelo} {vehiculo.año}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <select
                  value={formData.hora}
                  onChange={(e) => setFormData({...formData, hora: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar hora</option>
                  <option value="08:00">08:00</option>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="12:00">12:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de contacto</label>
                <input
                  type="tel"
                  value={formData.contacto.telefono}
                  onChange={(e) => setFormData({
                    ...formData, 
                    contacto: {...formData.contacto, telefono: e.target.value}
                  })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones (opcional)</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detalles adicionales sobre la revisión..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Agendar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendarRevisionTecnica;
