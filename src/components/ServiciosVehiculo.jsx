import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

export default function ServiciosVehiculo() {
  const { id: vehiculoId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehiculo, setVehiculo] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [tiposServicio, setTiposServicio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tipo: '',
    proveedor: '',
    fecha: '',
    kilometraje: '',
    costo: '',
    descripcion: '',
    proximoServicio: ''
  });

  useEffect(() => {
    if (user && vehiculoId) {
      loadData();
    }
  }, [user, vehiculoId]);

  const loadData = async () => {
    try {
      // Cargar información del vehículo
      const vehiculoDoc = await getDoc(doc(db, 'vehiculos_usuario', vehiculoId));
      if (vehiculoDoc.exists()) {
        const vehiculoData = { id: vehiculoDoc.id, ...vehiculoDoc.data() };
        
        // Verificar que el vehículo pertenece al usuario actual
        if (vehiculoData.userId !== user.uid) {
          navigate('/vehiculos/gestionar');
          return;
        }
        
        setVehiculo(vehiculoData);
      } else {
        navigate('/vehiculos/gestionar');
        return;
      }

      // Cargar servicios del vehículo
      const serviciosQuery = query(
        collection(db, 'servicios_vehiculo'),
        where('vehiculoId', '==', vehiculoId),
        where('userId', '==', user.uid)
      );
      const serviciosSnapshot = await getDocs(serviciosQuery);
      const serviciosData = serviciosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Ordenar por fecha (más reciente primero)
      serviciosData.sort((a, b) => {
        const fechaA = new Date(a.fecha);
        const fechaB = new Date(b.fecha);
        return fechaB - fechaA;
      });
      
      setServicios(serviciosData);

      // Cargar tipos de servicio disponibles
      const tiposSnapshot = await getDocs(collection(db, 'tipos_servicio_vehiculo'));
      setTiposServicio(tiposSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const servicioData = {
        ...formData,
        vehiculoId,
        userId: user.uid,
        vehiculoInfo: {
          patente: vehiculo.patente,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo
        },
        fechaRegistro: new Date(),
        costo: formData.costo ? parseFloat(formData.costo) : 0,
        kilometraje: formData.kilometraje ? parseInt(formData.kilometraje) : 0
      };

      await addDoc(collection(db, 'servicios_vehiculo'), servicioData);
      await loadData(); // Recargar servicios
      setShowForm(false);
      setFormData({
        tipo: '',
        proveedor: '',
        fecha: '',
        kilometraje: '',
        costo: '',
        descripcion: '',
        proximoServicio: ''
      });
      
      alert('Servicio registrado exitosamente');
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error al registrar servicio');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const calcularProximoServicio = (servicio) => {
    if (!servicio.proximoServicio) return null;
    
    const fechaServicio = new Date(servicio.fecha);
    const [numero, unidad] = servicio.proximoServicio.split(' ');
    
    const proximaFecha = new Date(fechaServicio);
    if (unidad.includes('mes')) {
      proximaFecha.setMonth(proximaFecha.getMonth() + parseInt(numero));
    } else if (unidad.includes('año')) {
      proximaFecha.setFullYear(proximaFecha.getFullYear() + parseInt(numero));
    }
    
    return proximaFecha;
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
          <p className="text-gray-600">Debes iniciar sesión para ver los servicios.</p>
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

  if (!vehiculo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Vehículo No Encontrado</h1>
          <p className="text-gray-600">El vehículo solicitado no existe o no tienes permisos para verlo.</p>
          <button
            onClick={() => navigate('/vehiculos/gestionar')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Volver a Mis Vehículos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={() => navigate('/vehiculos/gestionar')}
              className="text-blue-600 hover:text-blue-800 mb-2"
            >
              ← Volver a Mis Vehículos
            </button>
            <h1 className="text-3xl font-bold text-gray-800">
              Servicios - {vehiculo.marca} {vehiculo.modelo}
            </h1>
            <p className="text-gray-600">Patente: {vehiculo.patente}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            + Registrar Servicio
          </button>
        </div>

        {/* Formulario de nuevo servicio */}
        {showForm && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Nuevo Servicio</h3>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Servicio
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="Mantención preventiva">Mantención preventiva</option>
                  <option value="Cambio de aceite">Cambio de aceite</option>
                  <option value="Revisión técnica">Revisión técnica</option>
                  <option value="Reparación">Reparación</option>
                  <option value="Cambio de neumáticos">Cambio de neumáticos</option>
                  <option value="Alineación y balanceo">Alineación y balanceo</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor/Taller
                </label>
                <input
                  type="text"
                  value={formData.proveedor}
                  onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha del Servicio
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kilometraje
                </label>
                <input
                  type="number"
                  value={formData.kilometraje}
                  onChange={(e) => setFormData({ ...formData, kilometraje: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Kilometraje actual"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo (CLP)
                </label>
                <input
                  type="number"
                  value={formData.costo}
                  onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Próximo Servicio
                </label>
                <select
                  value={formData.proximoServicio}
                  onChange={(e) => setFormData({ ...formData, proximoServicio: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Sin programar</option>
                  <option value="3 meses">En 3 meses</option>
                  <option value="6 meses">En 6 meses</option>
                  <option value="1 año">En 1 año</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción/Observaciones
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows="3"
                  placeholder="Detalles del servicio realizado..."
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Guardar Servicio
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de servicios */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Historial de Servicios</h3>
          
          {servicios.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No hay servicios registrados
              </h3>
              <p className="text-gray-600 mb-4">
                Comienza registrando el primer servicio de tu vehículo
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Registrar Primer Servicio
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {servicios.map(servicio => {
                const proximaFecha = calcularProximoServicio(servicio);
                const diasHastaProximo = proximaFecha ? 
                  Math.ceil((proximaFecha - new Date()) / (1000 * 60 * 60 * 24)) : null;

                return (
                  <div key={servicio.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{servicio.tipo}</h4>
                        <p className="text-gray-600">{servicio.proveedor}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{new Date(servicio.fecha).toLocaleDateString()}</p>
                        {servicio.costo > 0 && (
                          <p className="text-green-600 font-medium">{formatCurrency(servicio.costo)}</p>
                        )}
                      </div>
                    </div>

                    {servicio.kilometraje && (
                      <p className="text-sm text-gray-600 mb-2">
                        Kilometraje: {servicio.kilometraje?.toLocaleString()} km
                      </p>
                    )}

                    {servicio.descripcion && (
                      <p className="text-sm text-gray-700 mb-3">{servicio.descripcion}</p>
                    )}

                    {proximaFecha && (
                      <div className={`text-sm p-2 rounded ${
                        diasHastaProximo <= 7 ? 'bg-red-100 text-red-700' :
                        diasHastaProximo <= 30 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        <strong>Próximo servicio:</strong> {proximaFecha.toLocaleDateString()}
                        {diasHastaProximo <= 30 && (
                          <span className="ml-2">
                            ({diasHastaProximo > 0 ? `en ${diasHastaProximo} días` : 'Vencido'})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
