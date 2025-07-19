import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';

export default function DashboardCliente() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehiculos, setVehiculos] = useState([]);
  const [recordatorios, setRecordatorios] = useState([]);
  const [serviciosRecientes, setServiciosRecientes] = useState([]);
  const [perfilCliente, setPerfilCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (user) {
      checkClientProfile();
    }
  }, [user]);

  const checkClientProfile = async () => {
    try {
      // Verificar si el cliente tiene perfil validado
      // Buscar primero por userId (nuevo formato)
      let perfilQuery = query(
        collection(db, 'perfiles_clientes'),
        where('userId', '==', user.uid)
      );
      let perfilSnapshot = await getDocs(perfilQuery);
      
      // Si no se encuentra, buscar por uid (formato anterior)
      if (perfilSnapshot.empty) {
        perfilQuery = query(
          collection(db, 'perfiles_clientes'),
          where('uid', '==', user.uid)
        );
        perfilSnapshot = await getDocs(perfilQuery);
      }
      
      if (perfilSnapshot.empty) {
        // No tiene perfil, redirigir a registro
        navigate('/registro-cliente');
        return;
      }
      
      const perfil = { id: perfilSnapshot.docs[0].id, ...perfilSnapshot.docs[0].data() };
      setPerfilCliente(perfil);
      
      // Verificar el estado (puede estar en 'estado' o 'estado_validacion')
      const estadoCliente = perfil.estado || perfil.estado_validacion;
      
      if (estadoCliente !== 'activo') {
        // Perfil no validado, redirigir a registro (mostrará estado)
        navigate('/registro-cliente');
        return;
      }
      
      // Si llegó aquí, el perfil está validado, cargar dashboard
      await loadDashboardData();
      
    } catch (error) {
      console.error('Error checking client profile:', error);
      navigate('/registro-cliente');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Cargar vehículos del usuario
      const vehiculosQuery = query(
        collection(db, 'vehiculos_usuario'),
        where('userId', '==', user.uid)
      );
      const vehiculosSnapshot = await getDocs(vehiculosQuery);
      const vehiculosData = vehiculosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVehiculos(vehiculosData);

      // Cargar recordatorios próximos
      const recordatoriosQuery = query(
        collection(db, 'recordatorios'),
        where('userId', '==', user.uid),
        where('estado', '==', 'activo'),
        orderBy('fechaProxima', 'asc')
      );
      const recordatoriosSnapshot = await getDocs(recordatoriosQuery);
      const recordatoriosData = recordatoriosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecordatorios(recordatoriosData.slice(0, 5)); // Solo los próximos 5

      // Cargar servicios recientes
      const serviciosQuery = query(
        collection(db, 'servicios_usuario'),
        where('userId', '==', user.uid),
        orderBy('fechaCreacion', 'desc')
      );
      const serviciosSnapshot = await getDocs(serviciosQuery);
      const serviciosData = serviciosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServiciosRecientes(serviciosData.slice(0, 3));

      // Calcular estadísticas
      setStats({
        vehiculos: vehiculosData.length,
        recordatoriosActivos: recordatoriosData.length,
        serviciosEsteMes: serviciosData.filter(s => {
          const fecha = new Date(s.fechaCreacion.seconds * 1000);
          const hoy = new Date();
          return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
        }).length,
        gastoEsteMes: serviciosData
          .filter(s => {
            const fecha = new Date(s.fechaCreacion.seconds * 1000);
            const hoy = new Date();
            return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
          })
          .reduce((total, s) => total + (s.precio || 0), 0)
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const diasHastaRecordatorio = (fecha) => {
    if (!fecha) return null;
    const fechaRecordatorio = new Date(fecha.seconds * 1000);
    const hoy = new Date();
    const diferencia = fechaRecordatorio - hoy;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6"></div>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Mi Dashboard</h1>
        <p className="text-gray-600">Gestiona tus vehículos y servicios automotrices</p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚗</span>
            <div>
              <p className="text-sm text-gray-600">Mis Vehículos</p>
              <p className="text-2xl font-bold text-blue-600">{stats.vehiculos}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="text-sm text-gray-600">Recordatorios</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.recordatoriosActivos}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔧</span>
            <div>
              <p className="text-sm text-gray-600">Servicios (mes)</p>
              <p className="text-2xl font-bold text-green-600">{stats.serviciosEsteMes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <p className="text-sm text-gray-600">Gasto (mes)</p>
              <p className="text-2xl font-bold text-purple-600">
                ${stats.gastoEsteMes?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Accesos rápidos */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">🚀 Accesos Rápidos</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                className="p-4 border rounded-lg hover:shadow-md transition-shadow text-left"
                onClick={() => navigate('/servicios/seguros')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🛡️</span>
                  <h3 className="font-semibold">Seguros</h3>
                </div>
                <p className="text-sm text-gray-600">Cotiza y contrata seguros automotrices</p>
              </button>
              
              <button
                className="p-4 border rounded-lg hover:shadow-md transition-shadow text-left"
                onClick={() => navigate('/servicios/revision-tecnica')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🔧</span>
                  <h3 className="font-semibold">Revisión Técnica</h3>
                </div>
                <p className="text-sm text-gray-600">Agenda tu revisión técnica</p>
              </button>
              
              <button
                className="p-4 border rounded-lg hover:shadow-md transition-shadow text-left"
                onClick={() => navigate('/servicios/vulcanizaciones')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🏁</span>
                  <h3 className="font-semibold">Vulcanizaciones</h3>
                </div>
                <p className="text-sm text-gray-600">Encuentra vulcanizadoras cercanas</p>
              </button>
              
              <button
                className="p-4 border rounded-lg hover:shadow-md transition-shadow text-left"
                onClick={() => navigate('/servicios/reciclaje')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">♻️</span>
                  <h3 className="font-semibold">Reciclaje</h3>
                </div>
                <p className="text-sm text-gray-600">Recicla repuestos y aceites</p>
              </button>
              
              <button
                className="p-4 border rounded-lg hover:shadow-md transition-shadow text-left"
                onClick={() => navigate('/mis-recordatorios')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🔔</span>
                  <h3 className="font-semibold">Recordatorios</h3>
                </div>
                <p className="text-sm text-gray-600">Gestiona mantenimientos y servicios</p>
              </button>
              
              <button
                className="p-4 border rounded-lg hover:shadow-md transition-shadow text-left"
                onClick={() => navigate('/productos')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🛍️</span>
                  <h3 className="font-semibold">Repuestos</h3>
                </div>
                <p className="text-sm text-gray-600">Busca repuestos y productos</p>
              </button>
            </div>
          </div>

          {/* Mis vehículos */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">🚗 Mis Vehículos</h2>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => navigate('/vehiculos/agregar')}
              >
                + Agregar Vehículo
              </button>
            </div>
            
            {vehiculos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No tienes vehículos registrados</p>
                <button
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                  onClick={() => navigate('/vehiculos/agregar')}
                >
                  Agregar mi primer vehículo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {vehiculos.map(vehiculo => (
                  <div key={vehiculo.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">
                          {vehiculo.marca} {vehiculo.modelo} {vehiculo.año}
                        </h3>
                        <p className="text-sm text-gray-600">Patente: {vehiculo.patente}</p>
                        <p className="text-sm text-gray-600">
                          Kilometraje: {vehiculo.kilometraje?.toLocaleString()} km
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          onClick={() => navigate(`/vehiculos/${vehiculo.id}/servicios`)}
                        >
                          Ver Servicios
                        </button>
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          onClick={() => navigate(`/vehiculos/${vehiculo.id}/editar`)}
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recordatorios próximos */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">🔔 Próximos Recordatorios</h2>
              <button
                className="text-blue-600 hover:text-blue-800 text-sm"
                onClick={() => navigate('/mis-recordatorios')}
              >
                Ver todos
              </button>
            </div>
            
            {recordatorios.length === 0 ? (
              <p className="text-gray-500 text-sm">No tienes recordatorios próximos</p>
            ) : (
              <div className="space-y-3">
                {recordatorios.map(recordatorio => {
                  const dias = diasHastaRecordatorio(recordatorio.fechaProxima);
                  return (
                    <div key={recordatorio.id} className="border-l-4 border-blue-400 pl-3">
                      <h4 className="font-medium text-sm">{recordatorio.titulo}</h4>
                      <p className="text-xs text-gray-600">{recordatorio.descripcion}</p>
                      <p className={`text-xs font-medium ${
                        dias <= 7 ? 'text-red-600' : 
                        dias <= 14 ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {dias <= 0 ? 'Vencido' : `En ${dias} días`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Servicios recientes */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">📋 Servicios Recientes</h2>
              <button
                className="text-blue-600 hover:text-blue-800 text-sm"
                onClick={() => navigate('/mis-servicios')}
              >
                Ver historial
              </button>
            </div>
            
            {serviciosRecientes.length === 0 ? (
              <p className="text-gray-500 text-sm">No tienes servicios recientes</p>
            ) : (
              <div className="space-y-3">
                {serviciosRecientes.map(servicio => (
                  <div key={servicio.id} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{servicio.tipo}</h4>
                        <p className="text-xs text-gray-600">{servicio.proveedor}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(servicio.fechaCreacion.seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        servicio.estado === 'completado' ? 'bg-green-100 text-green-800' :
                        servicio.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {servicio.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tips y consejos */}
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3">💡 Tip del Día</h2>
            <div className="space-y-3">
              <div className="bg-white bg-opacity-70 rounded p-3">
                <h4 className="font-medium text-sm mb-1">Mantenimiento Preventivo</h4>
                <p className="text-xs text-gray-700">
                  Revisa el aceite de motor cada 5,000 km para mantener tu vehículo en óptimas condiciones.
                </p>
              </div>
              <button
                className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700"
                onClick={() => navigate('/recursos-educativos')}
              >
                Ver más consejos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
