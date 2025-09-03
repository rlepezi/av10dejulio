import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
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
  const [empresasRecomendadas, setEmpresasRecomendadas] = useState([]);
  const [ofertasExclusivas, setOfertasExclusivas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [membresia, setMembresia] = useState({
    nivel: 'basico',
    puntos: 0,
    beneficios: [],
    proximoNivel: 'premium',
    puntosParaProximo: 100
  });

  useEffect(() => {
    if (user) {
      checkClientProfile();
    }
  }, [user]);

  const checkClientProfile = async () => {
    try {
      // Verificar si el cliente tiene perfil validado
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
        navigate('/registro-cliente');
        return;
      }
      
      const perfil = { id: perfilSnapshot.docs[0].id, ...perfilSnapshot.docs[0].data() };
      setPerfilCliente(perfil);
      
      const estadoCliente = perfil.estado || perfil.estado_validacion;
      
      if (estadoCliente !== 'activo') {
        navigate('/registro-cliente');
        return;
      }
      
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
      setRecordatorios(recordatoriosData.slice(0, 5));

      // Cargar servicios recientes
      const serviciosQuery = query(
        collection(db, 'servicios_usuario'),
        where('userId', '==', user.uid),
        orderBy('fechaCreacion', 'desc')
      );
      const serviciosSnapshot = await getDocs(serviciosQuery);
      const serviciosData = serviciosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServiciosRecientes(serviciosData.slice(0, 3));

      // Cargar empresas recomendadas de la comunidad
      const empresasQuery = query(
        collection(db, 'empresas'),
        where('estado_comunidad', '==', 'activo'),
        where('estado', '==', 'activa'),
        limit(6)
      );
      const empresasSnapshot = await getDocs(empresasQuery);
      const empresasData = empresasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmpresasRecomendadas(empresasData);

      // Simular ofertas exclusivas (en el futuro vendrán de la base de datos)
      setOfertasExclusivas([
        {
          id: 1,
          empresa: 'Taller Mecánico Central',
          descripcion: '20% descuento en cambio de aceite',
          validez: '31 Dic 2024',
          puntosRequeridos: 50
        },
        {
          id: 2,
          empresa: 'Vulcanizadora Express',
          descripcion: '2x1 en vulcanizaciones',
          validez: '15 Ene 2025',
          puntosRequeridos: 100
        },
        {
          id: 3,
          empresa: 'Auto Parts Premium',
          descripcion: '15% descuento en repuestos',
          validez: '28 Dic 2024',
          puntosRequeridos: 75
        }
      ]);

      // Calcular estadísticas
      const serviciosEsteMes = serviciosData.filter(s => {
        const fecha = new Date(s.fechaCreacion.seconds * 1000);
        const hoy = new Date();
        return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
      });

      const gastoEsteMes = serviciosEsteMes.reduce((total, s) => total + (s.precio || 0), 0);

      setStats({
        vehiculos: vehiculosData.length,
        recordatoriosActivos: recordatoriosData.length,
        serviciosEsteMes: serviciosEsteMes.length,
        gastoEsteMes: gastoEsteMes,
        empresasDisponibles: empresasData.length,
        ahorroEstimado: Math.round(gastoEsteMes * 0.15) // 15% de ahorro estimado
      });

      // Calcular membresía basada en actividad
      const puntosBase = serviciosEsteMes.length * 25 + vehiculosData.length * 50;
      const nivel = puntosBase >= 200 ? 'premium' : puntosBase >= 100 ? 'intermedio' : 'basico';
      
      setMembresia({
        nivel,
        puntos: puntosBase,
        beneficios: getBeneficiosMembresia(nivel),
        proximoNivel: nivel === 'basico' ? 'intermedio' : nivel === 'intermedio' ? 'premium' : 'premium',
        puntosParaProximo: nivel === 'basico' ? 100 : nivel === 'intermedio' ? 200 : 200
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBeneficiosMembresia = (nivel) => {
    const beneficios = {
      basico: [
        'Acceso a empresas verificadas',
        'Recordatorios de mantenimiento',
        'Historial de servicios básico'
      ],
      intermedio: [
        'Todos los beneficios básicos',
        'Descuentos del 10-15%',
        'Soporte prioritario',
        'Acceso a ofertas exclusivas'
      ],
      premium: [
        'Todos los beneficios intermedios',
        'Descuentos del 20-25%',
        'Soporte VIP',
        'Ofertas personalizadas',
        'Acceso anticipado a promociones'
      ]
    };
    return beneficios[nivel] || beneficios.basico;
  };

  const diasHastaRecordatorio = (fecha) => {
    if (!fecha) return null;
    const fechaRecordatorio = new Date(fecha.seconds * 1000);
    const hoy = new Date();
    const diferencia = fechaRecordatorio - hoy;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  };

  const getNivelColor = (nivel) => {
    switch (nivel) {
      case 'premium': return 'from-purple-500 to-pink-500';
      case 'intermedio': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getNivelIcon = (nivel) => {
    switch (nivel) {
      case 'premium': return '👑';
      case 'intermedio': return '⭐';
      default: return '🔰';
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header con información de membresía */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                ¡Bienvenido a la Comunidad! 👋
              </h1>
              <p className="text-xl text-gray-600">
                Gestiona tus vehículos y disfruta de beneficios exclusivos
              </p>
            </div>
            
            {/* Tarjeta de Membresía */}
            <div className={`bg-gradient-to-r ${getNivelColor(membresia.nivel)} text-white rounded-2xl p-6 shadow-xl min-w-[300px]`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{getNivelIcon(membresia.nivel)}</span>
                <div>
                  <h3 className="text-xl font-bold capitalize">{membresia.nivel}</h3>
                  <p className="text-sm opacity-90">Nivel de Membresía</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Puntos: {membresia.puntos}</span>
                  <span>{membresia.puntosParaProximo - membresia.puntos} para {membresia.proximoNivel}</span>
                </div>
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((membresia.puntos / membresia.puntosParaProximo) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                {membresia.beneficios.slice(0, 2).map((beneficio, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span>✓</span>
                    <span>{beneficio}</span>
                  </div>
                ))}
                {membresia.beneficios.length > 2 && (
                  <p className="text-xs opacity-80">+{membresia.beneficios.length - 2} beneficios más</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <span className="text-2xl">🚗</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mis Vehículos</p>
                <p className="text-3xl font-bold text-blue-600">{stats.vehiculos}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 p-3 rounded-xl">
                <span className="text-2xl">🔔</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Recordatorios</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.recordatoriosActivos}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <span className="text-2xl">🔧</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Servicios (mes)</p>
                <p className="text-3xl font-bold text-green-600">{stats.serviciosEsteMes}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-xl">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ahorro Estimado</p>
                <p className="text-3xl font-bold text-purple-600">
                  ${stats.ahorroEstimado?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Empresas Recomendadas de la Comunidad */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">🏢 Empresas de la Comunidad</h2>
              <p className="text-gray-600">Proveedores verificados y recomendados para ti</p>
            </div>
            <button
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
              onClick={() => navigate('/proveedores')}
            >
              Ver Todas
            </button>
          </div>
          
          {empresasRecomendadas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Cargando empresas recomendadas...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {empresasRecomendadas.slice(0, 4).map(empresa => (
                <div key={empresa.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <span className="text-xl">🏪</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{empresa.nombre}</h3>
                      <p className="text-sm text-gray-600 mb-2">{empresa.servicios?.join(', ') || 'Servicios automotrices'}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          ✓ Verificado
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Comunidad
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ofertas Exclusivas */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl shadow-lg p-8 border border-orange-200 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">🎁 Ofertas Exclusivas</h2>
              <p className="text-gray-600">Promociones especiales solo para miembros de la comunidad</p>
            </div>
            <button
              className="bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors"
              onClick={() => navigate('/ofertas')}
            >
              Ver Todas
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {ofertasExclusivas.map(oferta => (
              <div key={oferta.id} className="bg-white rounded-xl p-4 border border-orange-200">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-800">{oferta.empresa}</h3>
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    {oferta.puntosRequeridos} pts
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{oferta.descripcion}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Válido hasta: {oferta.validez}</span>
                  <button className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700">
                    Aprovechar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Accesos rápidos */}
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
    </div>
  );
}
