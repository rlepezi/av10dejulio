import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { useNavigate } from 'react-router-dom';

export default function ClientesAreaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    comuna: '',
    tipoCliente: '',
    tieneVehiculo: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar información de la empresa del proveedor
      const empresaQuery = query(
        collection(db, 'empresas'),
        where('userId', '==', user.uid)
      );
      const empresaSnapshot = await getDocs(empresaQuery);
      
      if (!empresaSnapshot.empty) {
        const empresaData = { id: empresaSnapshot.docs[0].id, ...empresaSnapshot.docs[0].data() };
        setEmpresa(empresaData);
        
        // Cargar clientes en el área de la empresa
        await loadClientesEnArea(empresaData);
        await loadVehiculos();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClientesEnArea = async (empresaData) => {
    try {
      const clientesQuery = query(
        collection(db, 'perfiles_clientes'),
        where('estado', '==', 'activo'),
        orderBy('fechaRegistro', 'desc')
      );
      const clientesSnapshot = await getDocs(clientesQuery);
      
      let clientesData = clientesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filtrar por área geográfica cercana
      const empresaComuna = empresaData.ciudad || empresaData.comuna;
      if (empresaComuna) {
        clientesData = clientesData.filter(cliente => 
          cliente.comuna === empresaComuna || 
          getComunasCercanas(empresaComuna).includes(cliente.comuna)
        );
      }

      setClientes(clientesData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadVehiculos = async () => {
    try {
      const vehiculosQuery = query(collection(db, 'vehiculos'));
      const vehiculosSnapshot = await getDocs(vehiculosQuery);
      const vehiculosData = vehiculosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVehiculos(vehiculosData);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const getComunasCercanas = (comuna) => {
    const zonasRM = {
      'Santiago': ['Providencia', 'Ñuñoa', 'San Miguel', 'Estación Central', 'Quinta Normal'],
      'Las Condes': ['Vitacura', 'La Reina', 'Providencia', 'Lo Barnechea'],
      'Providencia': ['Las Condes', 'Ñuñoa', 'Santiago', 'Vitacura'],
      'Maipú': ['Pudahuel', 'Cerrillos', 'Estación Central', 'Cerro Navia'],
      'La Florida': ['Puente Alto', 'Peñalolén', 'Macul', 'San Joaquín'],
      'Puente Alto': ['La Florida', 'San Bernardo', 'La Pintana'],
      // Agregar más zonas según necesidad
    };

    return zonasRM[comuna] || [];
  };

  const getVehiculosCliente = (clienteId) => {
    return vehiculos.filter(vehiculo => vehiculo.propietarioId === clienteId);
  };

  const filteredClientes = clientes.filter(cliente => {
    if (filters.comuna && cliente.comuna !== filters.comuna) return false;
    if (filters.tipoCliente && cliente.tipoCliente !== filters.tipoCliente) return false;
    if (filters.tieneVehiculo) {
      const tieneVehiculo = getVehiculosCliente(cliente.id).length > 0;
      if (filters.tieneVehiculo === 'si' && !tieneVehiculo) return false;
      if (filters.tieneVehiculo === 'no' && tieneVehiculo) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600 mb-6">
            Solo los proveedores registrados pueden acceder a esta página.
          </p>
          <button
            onClick={() => navigate('/dashboard/proveedor')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                👥 Clientes en Tu Área
              </h1>
              <p className="text-gray-600 mt-2">
                Clientes registrados cerca de {empresa.ciudad || empresa.comuna}
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/proveedor')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              ← Volver al Dashboard
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Filtros</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comuna
              </label>
              <select
                value={filters.comuna}
                onChange={(e) => setFilters(prev => ({ ...prev, comuna: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las comunas</option>
                {[...new Set(clientes.map(c => c.comuna))].sort().map(comuna => (
                  <option key={comuna} value={comuna}>{comuna}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Cliente
              </label>
              <select
                value={filters.tipoCliente}
                onChange={(e) => setFilters(prev => ({ ...prev, tipoCliente: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los tipos</option>
                <option value="particular">Particular</option>
                <option value="empresa">Empresa</option>
                <option value="mecanico">Mecánico</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Con Vehículo
              </label>
              <select
                value={filters.tieneVehiculo}
                onChange={(e) => setFilters(prev => ({ ...prev, tieneVehiculo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="si">Con vehículo</option>
                <option value="no">Sin vehículo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{filteredClientes.length}</div>
                <div className="text-sm text-gray-600">Clientes Totales</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <span className="text-2xl">🚗</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {filteredClientes.filter(c => getVehiculosCliente(c.id).length > 0).length}
                </div>
                <div className="text-sm text-gray-600">Con Vehículo</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <span className="text-2xl">🏢</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {filteredClientes.filter(c => c.tipoCliente === 'empresa').length}
                </div>
                <div className="text-sm text-gray-600">Empresas</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {filteredClientes.filter(c => {
                    const fechaRegistro = c.fechaRegistro?.toDate?.() || new Date(c.fechaRegistro);
                    const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    return fechaRegistro > hace30Dias;
                  }).length}
                </div>
                <div className="text-sm text-gray-600">Nuevos (30d)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Clientes Registrados ({filteredClientes.length})
          </h2>

          {filteredClientes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes en esta área</h3>
              <p className="text-gray-600">
                Intenta ajustar los filtros o promociona tu negocio para atraer más clientes.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredClientes.map((cliente) => {
                const vehiculosCliente = getVehiculosCliente(cliente.id);
                return (
                  <div key={cliente.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {cliente.nombres?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {cliente.nombres} {cliente.apellidos}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span>📍 {cliente.comuna}</span>
                            <span>📞 {cliente.telefono}</span>
                            <span>📧 {cliente.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          cliente.tipoCliente === 'empresa' 
                            ? 'bg-purple-100 text-purple-800'
                            : cliente.tipoCliente === 'mecanico'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {cliente.tipoCliente}
                        </span>
                      </div>
                    </div>

                    {/* Vehículos del cliente */}
                    {vehiculosCliente.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="font-medium text-gray-900 mb-2">
                          🚗 Vehículos ({vehiculosCliente.length})
                        </h4>
                        <div className="grid md:grid-cols-2 gap-3">
                          {vehiculosCliente.map((vehiculo) => (
                            <div key={vehiculo.id} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {vehiculo.marca} {vehiculo.modelo} {vehiculo.año}
                                </span>
                                <span className="text-sm text-gray-600">
                                  • {vehiculo.patente}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {vehiculo.tipo} • {vehiculo.combustible}
                                {vehiculo.kilometraje && ` • ${vehiculo.kilometraje.toLocaleString()} km`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Información adicional */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Registrado:</span>{' '}
                          {cliente.fechaRegistro?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Profesión:</span>{' '}
                          {cliente.profesion || 'No especificada'}
                        </div>
                        <div>
                          <span className="font-medium">Motivo:</span>{' '}
                          {cliente.motivoRegistro || 'No especificado'}
                        </div>
                      </div>
                    </div>
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
