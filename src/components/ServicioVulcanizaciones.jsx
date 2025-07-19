import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

export default function ServicioVulcanizaciones() {
  const { user, rol } = useAuth();
  const [vulcanizadoras, setVulcanizadoras] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [misServicios, setMisServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('buscar');
  const [showModal, setShowModal] = useState(false);
  const [selectedVulcanizadora, setSelectedVulcanizadora] = useState(null);
  const [filtros, setFiltros] = useState({
    servicio: '',
    ubicacion: '',
    emergencia: false,
    precio: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar vulcanizadoras
      const vulcanizadorasSnapshot = await getDocs(collection(db, 'vulcanizadoras'));
      setVulcanizadoras(vulcanizadorasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Cargar tipos de servicios
      const serviciosSnapshot = await getDocs(collection(db, 'tipos_servicios_vulcanizadora'));
      setServicios(serviciosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      if (user) {
        // Cargar servicios del usuario
        const misServiciosQuery = query(
          collection(db, 'servicios_vulcanizadora'),
          where('userId', '==', user.uid)
        );
        const misServiciosSnapshot = await getDocs(misServiciosQuery);
        setMisServicios(misServiciosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const solicitarServicio = async (solicitud) => {
    try {
      const nuevoServicio = {
        userId: user.uid,
        vulcanizadoraId: solicitud.vulcanizadoraId,
        tipoServicio: solicitud.tipoServicio,
        descripcion: solicitud.descripcion,
        ubicacion: solicitud.ubicacion,
        emergencia: solicitud.emergencia,
        estado: 'solicitado',
        fechaSolicitud: new Date(),
        precioEstimado: solicitud.precioEstimado
      };

      await addDoc(collection(db, 'servicios_vulcanizadora'), nuevoServicio);
      await loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Error requesting service:', error);
    }
  };

  const vulcanizadorasFiltradas = vulcanizadoras.filter(vulc => {
    if (filtros.servicio && !vulc.servicios?.includes(filtros.servicio)) return false;
    if (filtros.ubicacion && !vulc.comuna?.toLowerCase().includes(filtros.ubicacion.toLowerCase())) return false;
    if (filtros.emergencia && !vulc.emergencia24h) return false;
    return true;
  });

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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">🏁 Vulcanizaciones</h1>
        
        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            className={`pb-2 px-4 ${activeTab === 'buscar' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('buscar')}
          >
            Buscar Servicios
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'emergencia' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('emergencia')}
          >
            🆘 Emergencia
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'servicios' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('servicios')}
          >
            Mis Servicios
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
        {activeTab === 'buscar' && (
          <div className="space-y-6">
            {/* Filtros */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Filtrar Servicios</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Servicio</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={filtros.servicio}
                    onChange={(e) => setFiltros(prev => ({ ...prev, servicio: e.target.value }))}
                  >
                    <option value="">Todos los servicios</option>
                    <option value="parche">Parche de Neumático</option>
                    <option value="cambio_neumatico">Cambio de Neumático</option>
                    <option value="balanceado">Balanceado</option>
                    <option value="alineacion">Alineación</option>
                    <option value="rotacion">Rotación de Neumáticos</option>
                    <option value="valvula">Cambio de Válvula</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ubicación</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Comuna o sector"
                    value={filtros.ubicacion}
                    onChange={(e) => setFiltros(prev => ({ ...prev, ubicacion: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Disponibilidad</label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={filtros.emergencia}
                      onChange={(e) => setFiltros(prev => ({ ...prev, emergencia: e.target.checked }))}
                    />
                    <span className="text-sm">24 horas</span>
                  </label>
                </div>
                <div className="flex items-end">
                  <button
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                    onClick={() => {
                      // Filtros se aplican automáticamente
                    }}
                  >
                    Buscar
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de vulcanizadoras */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Vulcanizadoras Disponibles ({vulcanizadorasFiltradas.length})
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vulcanizadorasFiltradas.map(vulcanizadora => (
                  <div key={vulcanizadora.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{vulcanizadora.nombre}</h4>
                        <p className="text-sm text-gray-600">{vulcanizadora.direccion}</p>
                        <p className="text-sm text-gray-600">{vulcanizadora.comuna}</p>
                        <p className="text-sm text-gray-600">{vulcanizadora.telefono}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm">{vulcanizadora.rating || 4.3}</span>
                        </div>
                        <p className="text-sm text-gray-600">{vulcanizadora.distancia || '1.2'} km</p>
                      </div>
                    </div>
                    
                    {/* Servicios disponibles */}
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {vulcanizadora.servicios?.map(servicio => (
                          <span key={servicio} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {servicio}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Información adicional */}
                    <div className="space-y-1 mb-3 text-sm">
                      <div className="flex justify-between">
                        <span>Horarios:</span>
                        <span className="font-medium">{vulcanizadora.horarios || 'L-S 8-20'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tiempo respuesta:</span>
                        <span className="font-medium">{vulcanizadora.tiempoRespuesta || '15'} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Precio desde:</span>
                        <span className="font-medium">${vulcanizadora.precioBase?.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {/* Badges especiales */}
                    <div className="flex gap-1 mb-3">
                      {vulcanizadora.emergencia24h && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          24h
                        </span>
                      )}
                      {vulcanizadora.servicioDomicilio && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          A domicilio
                        </span>
                      )}
                      {vulcanizadora.promociones && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          Promociones
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                        onClick={() => {
                          setSelectedVulcanizadora(vulcanizadora);
                          setShowModal(true);
                        }}
                      >
                        Solicitar Servicio
                      </button>
                      <button className="bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-300">
                        📞
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'emergencia' && (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">🆘</span>
                <div>
                  <h3 className="text-xl font-bold text-red-800">Servicio de Emergencia</h3>
                  <p className="text-red-700">Disponible las 24 horas, los 7 días de la semana</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">¿Qué incluye?</h4>
                  <ul className="space-y-1 text-sm">
                    <li>✅ Asistencia en carretera</li>
                    <li>✅ Cambio de neumático pinchado</li>
                    <li>✅ Reparación temporal en sitio</li>
                    <li>✅ Remolque a vulcanizadora más cercana</li>
                    <li>✅ Tiempo de respuesta: 15-30 minutos</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Tarifas de Emergencia</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Servicio base (07:00-22:00):</span>
                      <span className="font-medium">$25.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recargo nocturno (22:00-07:00):</span>
                      <span className="font-medium">+$10.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fin de semana/festivos:</span>
                      <span className="font-medium">+$5.000</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button className="bg-red-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-red-700">
                  🚨 Llamar Emergencia
                </button>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                  📍 Compartir Ubicación
                </button>
              </div>
            </div>
            
            {/* Vulcanizadoras 24h */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Vulcanizadoras 24 Horas</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {vulcanizadoras
                  .filter(v => v.emergencia24h)
                  .map(vulcanizadora => (
                    <div key={vulcanizadora.id} className="border rounded-lg p-4 bg-red-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{vulcanizadora.nombre}</h4>
                          <p className="text-sm text-gray-600">{vulcanizadora.comuna}</p>
                        </div>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                          24h
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">📞 {vulcanizadora.telefono}</p>
                          <p className="text-sm text-gray-600">{vulcanizadora.distancia || '2.1'} km</p>
                        </div>
                        <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                          Llamar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'servicios' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Historial de Servicios</h3>
            {misServicios.length === 0 ? (
              <p className="text-gray-500">No tienes servicios registrados.</p>
            ) : (
              <div className="space-y-4">
                {misServicios
                  .sort((a, b) => b.fechaSolicitud?.seconds - a.fechaSolicitud?.seconds)
                  .map(servicio => {
                    const vulcanizadora = vulcanizadoras.find(v => v.id === servicio.vulcanizadoraId);
                    
                    return (
                      <div key={servicio.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{vulcanizadora?.nombre}</h4>
                            <p className="text-sm text-gray-600">{servicio.tipoServicio}</p>
                            <p className="text-sm text-gray-600">
                              {servicio.fechaSolicitud && 
                                new Date(servicio.fechaSolicitud.seconds * 1000).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            servicio.estado === 'solicitado' ? 'bg-blue-100 text-blue-800' :
                            servicio.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-800' :
                            servicio.estado === 'completado' ? 'bg-green-100 text-green-800' :
                            servicio.estado === 'cancelado' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {servicio.estado}
                          </span>
                        </div>
                        
                        {servicio.descripcion && (
                          <p className="text-sm text-gray-700 mb-3">{servicio.descripcion}</p>
                        )}
                        
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Ubicación:</span>
                            <p className="font-medium">{servicio.ubicacion}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Precio:</span>
                            <p className="font-medium">
                              {servicio.precioFinal ? 
                                `$${servicio.precioFinal.toLocaleString()}` :
                                `Est. $${servicio.precioEstimado?.toLocaleString()}`
                              }
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Emergencia:</span>
                            <p className="font-medium">
                              {servicio.emergencia ? '🆘 Sí' : '✅ Normal'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                            Ver Detalles
                          </button>
                          {servicio.estado === 'completado' && (
                            <button className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700">
                              Calificar Servicio
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
      </div>

      {/* Modal de solicitud */}
      {showModal && selectedVulcanizadora && (
        <SolicitudModal
          vulcanizadora={selectedVulcanizadora}
          servicios={servicios}
          onClose={() => setShowModal(false)}
          onSubmit={solicitarServicio}
        />
      )}
    </div>
  );
}

// Modal component para solicitud de servicio
function SolicitudModal({ vulcanizadora, servicios, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    tipoServicio: '',
    descripcion: '',
    ubicacion: '',
    emergencia: false,
    precioEstimado: 0
  });

  const [mostrarUbicacion, setMostrarUbicacion] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      vulcanizadoraId: vulcanizadora.id
    });
  };

  const obtenerUbicacion = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            ubicacion: `${latitude}, ${longitude}`
          }));
          setMostrarUbicacion(true);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('No se pudo obtener la ubicación. Por favor, ingresa manualmente.');
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Solicitar Servicio - {vulcanizadora.nombre}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Servicio</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.tipoServicio}
              onChange={(e) => {
                const servicio = e.target.value;
                const precio = vulcanizadora.precios?.[servicio] || vulcanizadora.precioBase || 15000;
                setFormData(prev => ({ 
                  ...prev, 
                  tipoServicio: servicio,
                  precioEstimado: precio 
                }));
              }}
              required
            >
              <option value="">Seleccionar servicio</option>
              <option value="parche">Parche de Neumático</option>
              <option value="cambio_neumatico">Cambio de Neumático</option>
              <option value="balanceado">Balanceado</option>
              <option value="alineacion">Alineación</option>
              <option value="rotacion">Rotación de Neumáticos</option>
              <option value="valvula">Cambio de Válvula</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Descripción del Problema</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              rows="3"
              placeholder="Describe tu problema o necesidad..."
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Ubicación</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border rounded px-3 py-2"
                placeholder="Dirección o coordenadas"
                value={formData.ubicacion}
                onChange={(e) => setFormData(prev => ({ ...prev, ubicacion: e.target.value }))}
                required
              />
              <button
                type="button"
                className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                onClick={obtenerUbicacion}
              >
                📍
              </button>
            </div>
            {mostrarUbicacion && (
              <p className="text-xs text-green-600 mt-1">✅ Ubicación obtenida automáticamente</p>
            )}
          </div>
          
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.emergencia}
                onChange={(e) => {
                  const esEmergencia = e.target.checked;
                  setFormData(prev => ({ 
                    ...prev, 
                    emergencia: esEmergencia,
                    precioEstimado: esEmergencia ? prev.precioEstimado * 1.5 : prev.precioEstimado / 1.5
                  }));
                }}
              />
              <span className="text-sm">🆘 Servicio de emergencia (+50%)</span>
            </label>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="flex justify-between items-center">
              <span className="font-medium">Precio estimado:</span>
              <span className="text-lg font-bold">
                ${Math.round(formData.precioEstimado).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              El precio final puede variar según la evaluación técnica
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
              Solicitar Servicio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
