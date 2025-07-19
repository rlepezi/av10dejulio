import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';

export default function DashboardProveedorMejorado() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState(null);
  const [stats, setStats] = useState({
    clientesRegistrados: 0,
    vehiculosEnArea: 0,
    solicitudesRecientes: 0,
    reseñasPromedio: 0,
    serviciosCompletados: 0
  });
  const [clientesRecientes, setClientesRecientes] = useState([]);
  const [solicitudesServicio, setSolicitudesServicio] = useState([]);

  useEffect(() => {
    if (user) {
      loadProviderData();
    }
  }, [user]);

  const loadProviderData = async () => {
    setLoading(true);
    try {
      // Cargar información de la empresa
      const empresaQuery = query(
        collection(db, 'empresas'),
        where('userId', '==', user.uid)
      );
      const empresaSnapshot = await getDocs(empresaQuery);
      
      if (!empresaSnapshot.empty) {
        const empresaData = { id: empresaSnapshot.docs[0].id, ...empresaSnapshot.docs[0].data() };
        setEmpresa(empresaData);
        
        // Cargar estadísticas y datos específicos del proveedor
        await loadStats(empresaData);
        await loadClientesRecientes(empresaData);
        await loadSolicitudesServicio(empresaData);
      }
    } catch (error) {
      console.error('Error loading provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (empresaData) => {
    try {
      // Cargar clientes registrados en el área
      const clientesQuery = query(
        collection(db, 'perfiles_clientes'),
        where('comuna', '==', empresaData.ciudad || empresaData.comuna),
        where('estado', '==', 'activo')
      );
      const clientesSnapshot = await getDocs(clientesQuery);
      
      // Cargar vehículos en el área
      const vehiculosQuery = query(collection(db, 'vehiculos'));
      const vehiculosSnapshot = await getDocs(vehiculosQuery);
      const vehiculosEnArea = vehiculosSnapshot.docs.filter(doc => {
        const vehiculo = doc.data();
        return vehiculo.ubicacion?.comuna === empresaData.ciudad || vehiculo.ubicacion?.comuna === empresaData.comuna;
      });

      setStats(prev => ({
        ...prev,
        clientesRegistrados: clientesSnapshot.size,
        vehiculosEnArea: vehiculosEnArea.length,
        // Simular otras estadísticas por ahora
        solicitudesRecientes: Math.floor(Math.random() * 20) + 5,
        reseñasPromedio: 4.2 + Math.random() * 0.7,
        serviciosCompletados: Math.floor(Math.random() * 100) + 50
      }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadClientesRecientes = async (empresaData) => {
    try {
      const clientesQuery = query(
        collection(db, 'perfiles_clientes'),
        where('comuna', '==', empresaData.ciudad || empresaData.comuna),
        where('estado', '==', 'activo'),
        orderBy('fechaRegistro', 'desc'),
        limit(5)
      );
      const clientesSnapshot = await getDocs(clientesQuery);
      const clientes = clientesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClientesRecientes(clientes);
    } catch (error) {
      console.error('Error loading recent clients:', error);
    }
  };

  const loadSolicitudesServicio = async (empresaData) => {
    try {
      // Generar solicitudes simuladas basadas en el tipo de negocio
      const tiposServicio = getTiposServicio(empresaData);
      const solicitudesSimuladas = tiposServicio.map((tipo, index) => ({
        id: `solicitud_${index}`,
        cliente: `Cliente ${index + 1}`,
        servicio: tipo,
        fecha: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        estado: ['pendiente', 'en_proceso', 'completado'][Math.floor(Math.random() * 3)],
        vehiculo: {
          marca: ['Toyota', 'Chevrolet', 'Hyundai', 'Nissan'][Math.floor(Math.random() * 4)],
          modelo: ['Corolla', 'Spark', 'Accent', 'Versa'][Math.floor(Math.random() * 4)],
          año: 2015 + Math.floor(Math.random() * 9)
        },
        urgencia: ['baja', 'media', 'alta'][Math.floor(Math.random() * 3)]
      }));
      setSolicitudesServicio(solicitudesSimuladas.slice(0, 5));
    } catch (error) {
      console.error('Error loading service requests:', error);
    }
  };

  const getTiposServicio = (empresa) => {
    const serviciosPorTipo = {
      'vulcanizacion': ['Reparación de neumático', 'Balanceo', 'Alineación', 'Cambio de neumáticos'],
      'mecanica': ['Mantención preventiva', 'Reparación motor', 'Cambio de aceite', 'Reparación frenos'],
      'carroceria': ['Pintura completa', 'Retoque de pintura', 'Pulido', 'Reparación rayones'],
      'desabolladura': ['Desabolladura PDR', 'Reparación paragolpes', 'Enderezado', 'Reparación menor'],
      'grua': ['Servicio de grúa', 'Remolque', 'Rescate vehicular', 'Traslado'],
      'lubricentro': ['Cambio de aceite', 'Cambio de filtros', 'Lubricación', 'Lavado de motor']
    };

    const categorias = empresa.categorias || [];
    let servicios = [];
    
    categorias.forEach(categoria => {
      const cat = categoria.toLowerCase();
      Object.keys(serviciosPorTipo).forEach(tipo => {
        if (cat.includes(tipo)) {
          servicios = [...servicios, ...serviciosPorTipo[tipo]];
        }
      });
    });

    return servicios.length > 0 ? servicios : ['Servicio general', 'Consulta técnica', 'Cotización'];
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'en_proceso':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completado':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getUrgenciaColor = (urgencia) => {
    switch (urgencia) {
      case 'alta':
        return 'bg-red-100 text-red-800';
      case 'media':
        return 'bg-orange-100 text-orange-800';
      case 'baja':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Perfil de Empresa No Encontrado</h2>
          <p className="text-gray-600 mb-6">
            No se encontró información de tu empresa. Por favor, completa tu perfil de proveedor.
          </p>
          <button
            onClick={() => navigate('/registro-proveedor')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Completar Perfil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header del Dashboard */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {empresa.logo && (
                <img
                  src={empresa.logo}
                  alt={empresa.nombre}
                  className="w-16 h-16 object-contain rounded-lg border border-gray-200"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{empresa.nombre}</h1>
                <p className="text-gray-600">{empresa.ciudad}, {empresa.region}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    empresa.estado === 'Activa' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {empresa.estado || 'Pendiente'}
                  </span>
                  {empresa.esPremium && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      👑 Premium
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{stats.reseñasPromedio.toFixed(1)} ⭐</div>
              <div className="text-sm text-gray-600">{stats.serviciosCompletados} servicios</div>
            </div>
          </div>
        </div>

        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.clientesRegistrados}</div>
                <div className="text-sm text-gray-600">Clientes en Área</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <span className="text-2xl">🚗</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.vehiculosEnArea}</div>
                <div className="text-sm text-gray-600">Vehículos Locales</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.solicitudesRecientes}</div>
                <div className="text-sm text-gray-600">Solicitudes Mes</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <span className="text-2xl">⭐</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.reseñasPromedio.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Calificación</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.serviciosCompletados}</div>
                <div className="text-sm text-gray-600">Servicios Total</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Clientes Recientes en el Área */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">👥 Clientes Registrados Cerca</h2>
              <button
                onClick={() => navigate('/clientes-area')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Ver Todos →
              </button>
            </div>
            
            {clientesRecientes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">👥</div>
                <p className="text-gray-600">No hay clientes registrados en tu área todavía</p>
                <button
                  onClick={() => navigate('/proveedores-locales')}
                  className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Promocionar mi Negocio
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {clientesRecientes.map((cliente) => (
                  <div key={cliente.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {cliente.nombres?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {cliente.nombres} {cliente.apellidos}
                      </div>
                      <div className="text-sm text-gray-600">
                        {cliente.comuna} • Registrado {new Date(cliente.fechaRegistro?.toDate()).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {cliente.tipoCliente || 'Particular'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Solicitudes de Servicio */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">📋 Solicitudes de Servicio</h2>
              <button
                onClick={() => navigate('/solicitudes-servicio')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Gestionar →
              </button>
            </div>

            <div className="space-y-4">
              {solicitudesServicio.map((solicitud) => (
                <div key={solicitud.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{solicitud.servicio}</h4>
                      <p className="text-sm text-gray-600">{solicitud.cliente}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgenciaColor(solicitud.urgencia)}`}>
                        {solicitud.urgencia}
                      </span>
                      <span className={`px-2 py-1 rounded border text-xs font-medium ${getEstadoColor(solicitud.estado)}`}>
                        {solicitud.estado}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      {solicitud.vehiculo.marca} {solicitud.vehiculo.modelo} {solicitud.vehiculo.año}
                    </span>
                    <span>{solicitud.fecha.toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {solicitudesServicio.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📋</div>
                <p className="text-gray-600">No hay solicitudes pendientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">🚀 Acciones Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/mi-empresa')}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">🏢</div>
              <div className="font-medium text-gray-900">Mi Empresa</div>
              <div className="text-sm text-gray-600">Editar perfil</div>
            </button>

            <button
              onClick={() => navigate('/campañas')}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">📢</div>
              <div className="font-medium text-gray-900">Campañas</div>
              <div className="text-sm text-gray-600">Crear ofertas</div>
            </button>

            <button
              onClick={() => navigate('/productos')}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">📦</div>
              <div className="font-medium text-gray-900">Productos</div>
              <div className="text-sm text-gray-600">Gestionar catálogo</div>
            </button>

            <button
              onClick={() => navigate('/contacto')}
              className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">💬</div>
              <div className="font-medium text-gray-900">Soporte</div>
              <div className="text-sm text-gray-600">Ayuda técnica</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
