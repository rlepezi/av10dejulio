import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import ClientMembershipManager from '../components/ClientMembershipManager';
import ClientMembershipPlans from '../components/ClientMembershipPlans';
import ServiceSimulator from '../components/ServiceSimulator';
import ConsultaVehiculo from '../components/ConsultaVehiculo';
import GestionGastosVehiculo from '../components/GestionGastosVehiculo';
import AuthDebugButton from '../components/AuthDebugButton';
import { useClientMembership } from '../hooks/useClientMembership';

export default function DashboardClienteInterno() {
  const { clienteId } = useParams();
  const { user, rol } = useAuth();
  const navigate = useNavigate();
  
  // Usar el ID del parámetro o el ID del usuario autenticado
  const idCliente = clienteId || user?.uid;
  
  // Hook para membresía del cliente
  const {
    membership,
    loading: membershipLoading,
    puntos,
    beneficios,
    getCurrentPlan,
    getProgressToNextLevel,
    canAccessBenefit,
    registrarServicio
  } = useClientMembership(idCliente);
  
  console.log('DashboardClienteInterno - Debug:', {
    clienteId,
    userUid: user?.uid,
    idCliente,
    user: user
  });
  
  // Estados principales
  const [cliente, setCliente] = useState(null);
  const [vehiculos, setVehiculos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [consejos, setConsejos] = useState([]);
  const [empresasRecomendadas, setEmpresasRecomendadas] = useState([]);
  const [ofertasExclusivas, setOfertasExclusivas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [stats, setStats] = useState({});
  const [membresia, setMembresia] = useState({
    nivel: 'basico',
    puntos: 0,
    beneficios: [],
    proximoNivel: 'premium',
    puntosParaProximo: 100
  });
  
  // Estados para modales
  const [showVehiculoModal, setShowVehiculoModal] = useState(false);
  const [showCitaModal, setShowCitaModal] = useState(false);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [showNotificacionModal, setShowNotificacionModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showConsultaVehiculoModal, setShowConsultaVehiculoModal] = useState(false);
  const [showGestionGastosModal, setShowGestionGastosModal] = useState(false);
  
  // Estados para formularios
  const [nuevoVehiculo, setNuevoVehiculo] = useState({
    marca: '',
    modelo: '',
    año: '',
    patente: '',
    kilometraje: '',
    tipo: 'auto',
    color: '',
    combustible: 'gasolina'
  });
  
  const [nuevaCita, setNuevaCita] = useState({
    fecha: '',
    hora: '',
    servicio: '',
    descripcion: '',
    empresaId: '',
    empresaNombre: ''
  });

    useEffect(() => {
    console.log('🔍 useEffect - Debug completo:', {
      idCliente,
      userUid: user?.uid,
      userEmail: user?.email,
      user: user,
      loading,
      error
    });
    
    if (idCliente && user) {
      console.log('✅ Usuario autenticado, iniciando carga de datos...');
      
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.log('⏰ Timeout alcanzado, forzando carga del dashboard');
          setLoading(false);
        }
      }, 10000); // 10 segundos de timeout

      const cargarDatos = async () => {
        try {
          console.log('🚀 Iniciando carga de datos...');
          await Promise.all([
            fetchCliente(),
            fetchVehiculos(),
            fetchCitas(),
            fetchHistorial(),
            fetchNotificaciones(),
            fetchConsejos()
          ]);
          
          // Después de cargar vehículos, buscar empresas recomendadas
          if (vehiculos.length > 0) {
            await fetchEmpresasRecomendadas();
          }
          
          console.log('✅ Todos los datos cargados exitosamente');
        } catch (error) {
          console.error('❌ Error cargando datos:', error);
          setError(error.message);
        } finally {
          console.log('🏁 Finalizando carga de datos');
          setLoading(false);
          clearTimeout(timeoutId);
        }
      };

      cargarDatos();

      return () => clearTimeout(timeoutId);
    } else if (!user) {
      console.log('❌ Usuario no autenticado, redirigiendo a login...');
      navigate('/login');
    } else {
      console.log('⚠️ Estado intermedio, no hay usuario ni idCliente');
      setLoading(false);
    }
  }, [idCliente, user, navigate, loading, error]);

  // Verificar autenticación
  useEffect(() => {
    if (user) {
      console.log('Usuario autenticado:', user.email, 'UID:', user.uid);
      setAuthChecked(true);
    } else {
      console.log('No hay usuario autenticado');
      setAuthChecked(true);
    }
  }, [user]);

  // Actualizar empresas recomendadas cuando cambien los vehículos
  useEffect(() => {
    if (vehiculos.length > 0) {
      fetchEmpresasRecomendadas();
    } else {
      setEmpresasRecomendadas([]);
    }
  }, [vehiculos]);

  const fetchCliente = async () => {
    try {
      console.log('🔍 fetchCliente - Iniciando búsqueda...');
      console.log('📋 Parámetros de búsqueda:', {
        idCliente,
        userEmail: user?.email,
        userUid: user?.uid
      });
      
      // Primero buscar en la colección usuarios
      console.log('🔎 Buscando en colección usuarios con ID:', idCliente);
      let clienteDoc = await getDoc(doc(db, 'usuarios', idCliente));
      
      if (clienteDoc.exists()) {
        const clienteData = clienteDoc.data();
        console.log('✅ Cliente encontrado en usuarios:', clienteData);
        
        // Si el cliente tiene perfilClienteId, buscar información adicional
        if (clienteData.perfilClienteId) {
          const perfilDoc = await getDoc(doc(db, 'perfiles_clientes', clienteData.perfilClienteId));
          if (perfilDoc.exists()) {
            const perfilData = perfilDoc.data();
            const clienteInfo = {
              id: idCliente,
              nombre: clienteData.nombre || `${perfilData.nombres || ''} ${perfilData.apellidos || ''}`.trim(),
              email: clienteData.email,
              telefono: perfilData.telefono || 'No especificado',
              direccion: perfilData.direccion || 'No especificada',
              rol: clienteData.rol,
              activo: clienteData.activo,
              fechaCreacion: clienteData.fechaCreacion,
              perfilClienteId: clienteData.perfilClienteId,
              ...perfilData
            };
            console.log('Cliente completo cargado:', clienteInfo);
            setCliente(clienteInfo);
            return;
          }
        }
        
        // Si no tiene perfilClienteId o no se encuentra el perfil, usar datos básicos
        const clienteInfo = {
          id: idCliente,
          nombre: clienteData.nombre || 'Cliente',
          email: clienteData.email,
          telefono: 'No especificado',
          direccion: 'No especificada',
          rol: clienteData.rol,
          activo: clienteData.activo,
          fechaCreacion: clienteData.fechaCreacion,
          perfilClienteId: clienteData.perfilClienteId
        };
        console.log('Cliente básico cargado:', clienteInfo);
        setCliente(clienteInfo);
      } else {
        console.log('❌ Cliente no encontrado en usuarios, buscando en perfiles_clientes...');
        
        // Buscar en perfiles_clientes por email
        const perfilesQuery = query(
          collection(db, 'perfiles_clientes'),
          where('email', '==', user?.email),
          limit(1)
        );
        const perfilesSnapshot = await getDocs(perfilesQuery);
        
        if (!perfilesSnapshot.empty) {
          const perfilDoc = perfilesSnapshot.docs[0];
          console.log('Cliente encontrado en perfiles_clientes:', perfilDoc.data());
          
          const clienteInfo = {
            id: perfilDoc.id,
            nombre: `${perfilDoc.data().nombres || ''} ${perfilDoc.data().apellidos || ''}`.trim(),
            email: perfilDoc.data().email,
            telefono: perfilDoc.data().telefono || 'No especificado',
            direccion: perfilDoc.data().direccion || 'No especificada',
            rol: 'cliente'
          };
          setCliente(clienteInfo);
        } else {
          console.log('No se encontró cliente en ninguna colección');
          throw new Error('Cliente no encontrado en el sistema');
        }
      }
    } catch (error) {
      console.error('Error al cargar datos del cliente:', error);
      throw error;
    }
  };

  const fetchVehiculos = async () => {
    try {
      const vehiculosQuery = query(
        collection(db, 'vehiculos'),
        where('clienteId', '==', idCliente),
        orderBy('fechaCreacion', 'desc')
      );
      const vehiculosSnapshot = await getDocs(vehiculosQuery);
      const vehiculosData = vehiculosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVehiculos(vehiculosData);
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
    }
  };

  const fetchCitas = async () => {
    try {
      const citasQuery = query(
        collection(db, 'citas'),
        where('clienteId', '==', idCliente),
        orderBy('fecha', 'desc'),
        limit(10)
      );
      const citasSnapshot = await getDocs(citasQuery);
      const citasData = citasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCitas(citasData);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    }
  };

  const fetchHistorial = async () => {
    try {
      const historialQuery = query(
        collection(db, 'historial_servicios'),
        where('clienteId', '==', idCliente),
        orderBy('fecha', 'desc'),
        limit(20)
      );
      const historialSnapshot = await getDocs(historialQuery);
      const historialData = historialSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistorial(historialData);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  };

  const fetchNotificaciones = async () => {
    try {
      const notifQuery = query(
        collection(db, 'notificaciones'),
        where('clienteId', '==', idCliente),
        where('leida', '==', false),
        orderBy('fecha', 'desc'),
        limit(20)
      );
      const notifSnapshot = await getDocs(notifQuery);
      const notifData = notifSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotificaciones(notifData);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  };

  const fetchConsejos = async () => {
    try {
      // Consejos personalizados basados en vehículos del cliente
      const consejosData = [
        {
          id: 1,
          titulo: 'Mantenimiento Preventivo',
          descripcion: 'Recuerda cambiar el aceite cada 5,000 km para mantener tu motor en óptimas condiciones.',
          categoria: 'mantenimiento',
          prioridad: 'alta'
        },
        {
          id: 2,
          titulo: 'Revisión de Neumáticos',
          descripcion: 'Verifica la presión de tus neumáticos mensualmente para mayor seguridad.',
          categoria: 'seguridad',
          prioridad: 'media'
        },
        {
          id: 3,
          titulo: 'Limpieza del Filtro de Aire',
          descripcion: 'Un filtro de aire limpio mejora el rendimiento y consumo de combustible.',
          categoria: 'rendimiento',
          prioridad: 'baja'
        }
      ];
      setConsejos(consejosData);
    } catch (error) {
      console.error('Error al cargar consejos:', error);
    }
  };

  const fetchEmpresasRecomendadas = async () => {
    try {
      if (vehiculos.length === 0) {
        setEmpresasRecomendadas([]);
        return;
      }

      // Obtener marcas únicas de los vehículos del cliente
      const marcasCliente = [...new Set(vehiculos.map(v => v.marca.toLowerCase()))];
      
      // Buscar empresas que atiendan estas marcas
      const empresasQuery = query(
        collection(db, 'empresas'),
        where('estado_validacion', '==', 'activo'),
        where('visible_en_busqueda', '==', true)
      );
      
      const empresasSnapshot = await getDocs(empresasQuery);
      const empresasData = empresasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filtrar empresas por marcas atendidas y servicios
      const empresasFiltradas = empresasData.filter(empresa => {
        // Verificar si la empresa atiende alguna de las marcas del cliente
        const atiendeMarcas = empresa.marcas_atendidas && 
          empresa.marcas_atendidas.some(marca => 
            marcasCliente.includes(marca.toLowerCase())
          );

        // Verificar si tiene servicios disponibles
        const tieneServicios = empresa.categorias && empresa.categorias.length > 0;

        return atiendeMarcas && tieneServicios;
      });

      // Ordenar por relevancia (más marcas coincidentes primero)
      const empresasOrdenadas = empresasFiltradas.sort((a, b) => {
        const marcasA = a.marcas_atendidas?.filter(marca => 
          marcasCliente.includes(marca.toLowerCase())
        ).length || 0;
        const marcasB = b.marcas_atendidas?.filter(marca => 
          marcasCliente.includes(marca.toLowerCase())
        ).length || 0;
        
        return marcasB - marcasA;
      });

      setEmpresasRecomendadas(empresasOrdenadas.slice(0, 6)); // Mostrar máximo 6 empresas

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

      // Calcular estadísticas y membresía
      const serviciosEsteMes = historial.filter(s => {
        const fecha = new Date(s.fechaCreacion.seconds * 1000);
        const hoy = new Date();
        return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
      });

      const gastoEsteMes = serviciosEsteMes.reduce((total, s) => total + (s.precio || 0), 0);

      setStats({
        vehiculos: vehiculos.length,
        recordatoriosActivos: notificaciones.filter(n => !n.leida).length,
        serviciosEsteMes: serviciosEsteMes.length,
        gastoEsteMes: gastoEsteMes,
        empresasDisponibles: empresasOrdenadas.length,
        ahorroEstimado: Math.round(gastoEsteMes * 0.15) // 15% de ahorro estimado
      });

      // Calcular membresía basada en actividad
      const puntosBase = serviciosEsteMes.length * 25 + vehiculos.length * 50;
      const nivel = puntosBase >= 200 ? 'premium' : puntosBase >= 100 ? 'intermedio' : 'basico';
      
      setMembresia({
        nivel,
        puntos: puntosBase,
        beneficios: getBeneficiosMembresia(nivel),
        proximoNivel: nivel === 'basico' ? 'intermedio' : nivel === 'intermedio' ? 'premium' : 'premium',
        puntosParaProximo: nivel === 'basico' ? 100 : nivel === 'intermedio' ? 200 : 200
      });

    } catch (error) {
      console.error('Error al cargar empresas recomendadas:', error);
      setEmpresasRecomendadas([]);
    }
  };

  const handleVehiculoSubmit = async (e) => {
    e.preventDefault();
    try {
      const vehiculoData = {
        ...nuevoVehiculo,
        clienteId: idCliente,
        fechaCreacion: new Date(),
        estado: 'activo'
      };
      
      await addDoc(collection(db, 'vehiculos'), vehiculoData);
      setNuevoVehiculo({
        marca: '',
        modelo: '',
        año: '',
        patente: '',
        kilometraje: '',
        tipo: 'auto',
        color: '',
        combustible: 'gasolina'
      });
             setShowVehiculoModal(false);
       await fetchVehiculos();
       // Actualizar empresas recomendadas después de agregar vehículo
       if (vehiculos.length + 1 > 0) {
         await fetchEmpresasRecomendadas();
       }
     } catch (error) {
       console.error('Error al crear vehículo:', error);
     }
   };

  const handleCitaSubmit = async (e) => {
    e.preventDefault();
    try {
      const citaData = {
        ...nuevaCita,
        clienteId: idCliente,
        fechaCreacion: new Date(),
        estado: 'pendiente'
      };
      
      await addDoc(collection(db, 'citas'), citaData);
      setNuevaCita({
        fecha: '',
        hora: '',
        servicio: '',
        descripcion: '',
        empresaId: '',
        empresaNombre: ''
      });
      setShowCitaModal(false);
      fetchCitas();
    } catch (error) {
      console.error('Error al crear cita:', error);
    }
  };

  const marcarNotificacionLeida = async (notifId) => {
    try {
      await updateDoc(doc(db, 'notificaciones', notifId), {
        leida: true,
        fechaLectura: new Date()
      });
      fetchNotificaciones();
    } catch (error) {
      console.error('Error al marcar notificación:', error);
    }
  };

  const eliminarVehiculo = async (vehiculoId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
      try {
        await deleteDoc(doc(db, 'vehiculos', vehiculoId));
        fetchVehiculos();
      } catch (error) {
        console.error('Error al eliminar vehículo:', error);
      }
    }
  };

  // Funciones de membresía
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

  // Mostrar estado de verificación de autenticación
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar mensaje
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-4">Debes iniciar sesión para acceder al dashboard</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  // Verificar si el usuario tiene rol asignado
  if (!rol) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Rol No Asignado</h2>
          <p className="text-gray-600 mb-4">Tu cuenta no tiene un rol asignado. Contacta al administrador.</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mr-3"
            >
              Volver al Login
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Ir al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verificar que el usuario sea cliente
  if (rol !== 'cliente') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">Esta área es solo para clientes. Tu rol actual es: {rol}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Cargando dashboard del cliente...</p>
          <p className="text-sm text-gray-500 mt-2">Usuario: {user.email}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard del Cliente
              </h1>
              <p className="text-gray-600">
                Bienvenido, {cliente?.nombre || 'Cliente'}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPerfilModal(true)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Mi Perfil
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Volver al Sitio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda - Resumen */}
          <div className="lg:col-span-1 space-y-6">
            {/* Resumen del Cliente */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mi Información</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Nombre:</span>
                  <p className="text-gray-900">{cliente?.nombre}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Email:</span>
                  <p className="text-gray-900">{cliente?.email}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Teléfono:</span>
                  <p className="text-gray-900">{cliente?.telefono || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Vehículos:</span>
                  <p className="text-gray-900">{vehiculos.length}</p>
                </div>
              </div>
            </div>

            {/* Tarjeta de Membresía */}
            <div className={`bg-gradient-to-r ${getNivelColor(membership?.nivel || 'basico')} text-white rounded-lg shadow p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getNivelIcon(membership?.nivel || 'basico')}</span>
                  <div>
                    <h3 className="text-lg font-bold capitalize">{membership?.nivel || 'básico'}</h3>
                    <p className="text-sm opacity-90">Miembro de la Comunidad</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMembershipModal(true)}
                  className="text-white hover:text-gray-200 text-sm"
                >
                  Ver detalles
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Puntos: {puntos || 0}</span>
                  <span>{getProgressToNextLevel()?.target - (puntos || 0)} para {getProgressToNextLevel()?.nextLevel || 'máximo nivel'}</span>
                </div>
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressToNextLevel()?.percentage || 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                {beneficios?.slice(0, 2).map((beneficio, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span>✓</span>
                    <span>{beneficio}</span>
                  </div>
                ))}
                {beneficios?.length > 2 && (
                  <p className="text-xs opacity-80">+{beneficios.length - 2} beneficios más</p>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                <button
                  onClick={() => setShowPlansModal(true)}
                  className="w-full bg-white bg-opacity-20 text-white py-2 px-4 rounded-lg hover:bg-opacity-30 transition-colors text-sm"
                >
                  Ver Planes Disponibles
                </button>
              </div>
            </div>

            {/* Consejos del Día */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Consejos del Día</h3>
              <div className="space-y-4">
                {consejos.slice(0, 3).map((consejo) => (
                  <div key={consejo.id} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900 text-sm">{consejo.titulo}</h4>
                    <p className="text-gray-600 text-xs mt-1">{consejo.descripcion}</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                      consejo.prioridad === 'alta' ? 'bg-red-100 text-red-800' :
                      consejo.prioridad === 'media' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {consejo.prioridad}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowVehiculoModal(true)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Agregar Vehículo
                </button>
                <button
                  onClick={() => setShowCitaModal(true)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  + Agendar Cita
                </button>
                <button
                  onClick={() => setShowConsultaVehiculoModal(true)}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  🔍 Consultar Vehículo
                </button>
                <button
                  onClick={() => setShowGestionGastosModal(true)}
                  className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  💰 Gestión de Gastos
                </button>
                <button
                  onClick={() => navigate('/empresas')}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Buscar Talleres
                </button>
                <button
                  onClick={() => navigate('/dashboard/reciclaje/cliente')}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                  ♻️ Reciclaje Automotriz
                </button>
              </div>
            </div>

            {/* Simulador de Servicios (solo para testing) */}
            <ServiceSimulator clienteId={idCliente} />
          </div>

          {/* Columna Central - Vehículos y Citas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estadísticas Rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <span className="text-xl">🚗</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mis Vehículos</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.vehiculos || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <span className="text-xl">🔔</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Recordatorios</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.recordatoriosActivos || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <span className="text-xl">🔧</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Servicios (mes)</p>
                    <p className="text-2xl font-bold text-green-600">{stats.serviciosEsteMes || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <span className="text-xl">💰</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ahorro Estimado</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ${(stats.ahorroEstimado || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mis Vehículos */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Mis Vehículos</h3>
                  <button
                    onClick={() => setShowVehiculoModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
              <div className="p-6">
                {vehiculos.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">🚗</div>
                    <p className="text-gray-600 mb-4">No tienes vehículos registrados</p>
                    <button
                      onClick={() => setShowVehiculoModal(true)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Registrar mi primer vehículo
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vehiculos.map((vehiculo) => (
                      <div key={vehiculo.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {vehiculo.marca} {vehiculo.modelo}
                            </h4>
                            <p className="text-sm text-gray-600">{vehiculo.año} • {vehiculo.patente}</p>
                          </div>
                          <button
                            onClick={() => eliminarVehiculo(vehiculo.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            🗑️
                          </button>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-500">Color:</span> {vehiculo.color}
                          </div>
                          <div>
                            <span className="text-gray-500">Combustible:</span> {vehiculo.combustible}
                          </div>
                          <div>
                            <span className="text-gray-500">Kilometraje:</span> {vehiculo.kilometraje} km
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Próximas Citas */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Próximas Citas</h3>
                  <button
                    onClick={() => setShowCitaModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    + Agendar
                  </button>
                </div>
              </div>
              <div className="p-6">
                {citas.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">📅</div>
                    <p className="text-gray-600 mb-4">No tienes citas programadas</p>
                    <button
                      onClick={() => setShowCitaModal(true)}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                    >
                      Agendar mi primera cita
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {citas.map((cita) => (
                      <div key={cita.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">{cita.servicio}</h4>
                            <p className="text-sm text-gray-600">{cita.descripcion}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(cita.fecha).toLocaleDateString()} a las {cita.hora}
                            </p>
                            {cita.empresaNombre && (
                              <p className="text-sm text-blue-600">{cita.empresaNombre}</p>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            cita.estado === 'confirmada' ? 'bg-green-100 text-green-800' :
                            cita.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {cita.estado}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

                         {/* Empresas Recomendadas */}
             {vehiculos.length > 0 && (
               <div className="bg-white rounded-lg shadow">
                 <div className="px-6 py-4 border-b border-gray-200">
                   <h3 className="text-lg font-semibold text-gray-900">🏢 Talleres Recomendados</h3>
                   <p className="text-sm text-gray-600 mt-1">
                     Empresas que atienden tus marcas de vehículos
                   </p>
                 </div>
                 <div className="p-6">
                   {empresasRecomendadas.length === 0 ? (
                     <div className="text-center py-8">
                       <div className="text-gray-400 text-6xl mb-4">🔍</div>
                       <p className="text-gray-600 mb-4">No encontramos talleres que atiendan tus marcas</p>
                       <button
                         onClick={() => navigate('/empresas')}
                         className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                       >
                         Ver todos los talleres
                       </button>
                     </div>
                   ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {empresasRecomendadas.map((empresa) => {
                         // Calcular marcas coincidentes
                         const marcasCoincidentes = empresa.marcas_atendidas?.filter(marca => 
                           vehiculos.some(v => v.marca.toLowerCase() === marca.toLowerCase())
                         ) || [];
                         
                         return (
                           <div key={empresa.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                             <div className="flex justify-between items-start mb-3">
                               <div className="flex-1">
                                 <h4 className="font-semibold text-gray-900 text-lg">{empresa.nombre}</h4>
                                 <p className="text-sm text-gray-600">{empresa.direccion}</p>
                                 {empresa.telefono && (
                                   <p className="text-sm text-blue-600">📞 {empresa.telefono}</p>
                                 )}
                               </div>
                               <div className="text-right">
                                 <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                   ✓ Recomendado
                                 </span>
                               </div>
                             </div>
                             
                             {/* Marcas atendidas */}
                             {marcasCoincidentes.length > 0 && (
                               <div className="mb-3">
                                 <p className="text-xs font-medium text-gray-500 mb-1">Marcas que atiende:</p>
                                 <div className="flex flex-wrap gap-1">
                                   {marcasCoincidentes.map((marca, index) => (
                                     <span
                                       key={index}
                                       className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                     >
                                       {marca}
                                     </span>
                                   ))}
                                 </div>
                               </div>
                             )}
                             
                             {/* Servicios disponibles */}
                             {empresa.categorias && empresa.categorias.length > 0 && (
                               <div className="mb-3">
                                 <p className="text-xs font-medium text-gray-500 mb-1">Servicios:</p>
                                 <div className="flex flex-wrap gap-1">
                                   {empresa.categorias.slice(0, 3).map((categoria, index) => (
                                     <span
                                       key={index}
                                       className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                     >
                                       {categoria}
                                     </span>
                                   ))}
                                   {empresa.categorias.length > 3 && (
                                     <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                       +{empresa.categorias.length - 3}
                                     </span>
                                   )}
                                 </div>
                               </div>
                             )}
                             
                             {/* Acciones */}
                             <div className="flex space-x-2 pt-3 border-t border-gray-100">
                               <button
                                 onClick={() => {
                                   setNuevaCita({
                                     ...nuevaCita,
                                     empresaId: empresa.id,
                                     empresaNombre: empresa.nombre
                                   });
                                   setShowCitaModal(true);
                                 }}
                                 className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors"
                               >
                                 📅 Agendar Cita
                               </button>
                               <button
                                 onClick={() => navigate(`/empresa/${empresa.id}`)}
                                 className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                               >
                                 👁️ Ver Perfil
                               </button>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   )}
                   
                   {empresasRecomendadas.length > 0 && (
                     <div className="mt-6 text-center">
                       <button
                         onClick={() => navigate('/empresas')}
                         className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                       >
                         Ver más talleres
                       </button>
                     </div>
                   )}
                 </div>
               </div>
             )}

             {/* Ofertas Exclusivas */}
             <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg shadow border border-orange-200">
               <div className="px-6 py-4 border-b border-orange-200">
                 <h3 className="text-lg font-semibold text-gray-900">🎁 Ofertas Exclusivas</h3>
                 <p className="text-sm text-gray-600 mt-1">
                   Promociones especiales solo para miembros de la comunidad
                 </p>
               </div>
               <div className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {ofertasExclusivas.map(oferta => (
                     <div key={oferta.id} className="bg-white rounded-lg p-4 border border-orange-200">
                       <div className="flex justify-between items-start mb-3">
                         <h4 className="font-semibold text-gray-800">{oferta.empresa}</h4>
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
                 
                 <div className="mt-6 text-center">
                   <button
                     onClick={() => navigate('/ofertas')}
                     className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                   >
                     Ver todas las ofertas
                   </button>
                 </div>
               </div>
             </div>

             {/* Historial de Servicios */}
             <div className="bg-white rounded-lg shadow">
               <div className="px-6 py-4 border-b border-gray-200">
                 <h3 className="text-lg font-semibold text-gray-900">Historial de Servicios</h3>
               </div>
               <div className="p-6">
                 {historial.length === 0 ? (
                   <div className="text-center py-8">
                     <div className="text-gray-400 text-6xl mb-4">🔧</div>
                     <p className="text-gray-600">Aún no tienes servicios registrados</p>
                   </div>
                 ) : (
                   <div className="space-y-4">
                     {historial.slice(0, 5).map((servicio) => (
                       <div key={servicio.id} className="border border-gray-200 rounded-lg p-4">
                         <div className="flex justify-between items-start">
                           <div>
                             <h4 className="font-semibold text-gray-900">{servicio.servicio}</h4>
                             <p className="text-sm text-gray-600">{servicio.descripcion}</p>
                             <p className="text-sm text-gray-500">
                               {new Date(servicio.fecha).toLocaleDateString()}
                             </p>
                             {servicio.empresaNombre && (
                               <p className="text-sm text-blue-600">{servicio.empresaNombre}</p>
                             )}
                           </div>
                           <div className="text-right">
                             <p className="font-semibold text-gray-900">${servicio.costo || 'N/A'}</p>
                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                               servicio.estado === 'completado' ? 'bg-green-100 text-green-800' :
                               servicio.estado === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                               'bg-gray-100 text-gray-800'
                             }`}>
                               {servicio.estado}
                             </span>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Modal Agregar Vehículo */}
      {showVehiculoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Vehículo</h3>
            <form onSubmit={handleVehiculoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <input
                  type="text"
                  value={nuevoVehiculo.marca}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, marca: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                <input
                  type="text"
                  value={nuevoVehiculo.modelo}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, modelo: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                  <input
                    type="number"
                    value={nuevoVehiculo.año}
                    onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, año: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patente</label>
                  <input
                    type="text"
                    value={nuevoVehiculo.patente}
                    onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, patente: e.target.value.toUpperCase()})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kilometraje</label>
                  <input
                    type="number"
                    value={nuevoVehiculo.kilometraje}
                    onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, kilometraje: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={nuevoVehiculo.tipo}
                    onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, tipo: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="auto">Auto</option>
                    <option value="camioneta">Camioneta</option>
                    <option value="moto">Moto</option>
                    <option value="camion">Camión</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="text"
                    value={nuevoVehiculo.color}
                    onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, color: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Combustible</label>
                  <select
                    value={nuevoVehiculo.combustible}
                    onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, combustible: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="gasolina">Gasolina</option>
                    <option value="diesel">Diesel</option>
                    <option value="electrico">Eléctrico</option>
                    <option value="hibrido">Híbrido</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Guardar Vehículo
                </button>
                <button
                  type="button"
                  onClick={() => setShowVehiculoModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agendar Cita */}
      {showCitaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agendar Cita</h3>
            <form onSubmit={handleCitaSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={nuevaCita.fecha}
                  onChange={(e) => setNuevaCita({...nuevaCita, fecha: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <input
                  type="time"
                  value={nuevaCita.hora}
                  onChange={(e) => setNuevaCita({...nuevaCita, hora: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                <select
                  value={nuevaCita.servicio}
                  onChange={(e) => setNuevaCita({...nuevaCita, servicio: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar servicio</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="reparacion">Reparación</option>
                  <option value="diagnostico">Diagnóstico</option>
                  <option value="cambio_aceite">Cambio de Aceite</option>
                  <option value="alineacion">Alineación</option>
                  <option value="frenos">Sistema de Frenos</option>
                  <option value="electrico">Sistema Eléctrico</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={nuevaCita.descripcion}
                  onChange={(e) => setNuevaCita({...nuevaCita, descripcion: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Describe el problema o servicio que necesitas..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                >
                  Agendar Cita
                </button>
                <button
                  type="button"
                  onClick={() => setShowCitaModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Perfil del Cliente */}
      {showPerfilModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mi Perfil</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  defaultValue={cliente?.nombre}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={cliente?.email}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  defaultValue={cliente?.telefono}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <textarea
                  defaultValue={cliente?.direccion}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowPerfilModal(false)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={() => setShowPerfilModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificaciones Flotantes */}
      {notificaciones.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setShowNotificacionModal(true)}
            className="bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors"
          >
            🔔 {notificaciones.length}
          </button>
        </div>
      )}

      {/* Modal de Notificaciones */}
      {showNotificacionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificaciones</h3>
            <div className="space-y-3">
              {notificaciones.map((notif) => (
                <div key={notif.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{notif.titulo}</h4>
                      <p className="text-sm text-gray-600">{notif.mensaje}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(notif.fecha).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => marcarNotificacionLeida(notif.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Marcar leída
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowNotificacionModal(false)}
              className="w-full mt-4 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Membresía */}
      {showMembershipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Mi Membresía</h3>
              <button
                onClick={() => setShowMembershipModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ClientMembershipManager clienteId={idCliente} />
          </div>
        </div>
      )}

      {/* Modal de Planes de Membresía */}
      {showPlansModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Planes de Membresía</h3>
              <button
                onClick={() => setShowPlansModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ClientMembershipPlans 
              currentPlan={getCurrentPlan()} 
              onUpgrade={(plan) => {
                console.log('Upgrade to plan:', plan);
                // Aquí se implementaría la lógica de upgrade
                alert(`Upgrade a ${plan.name} - Funcionalidad en desarrollo`);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de Consulta de Vehículo */}
      {showConsultaVehiculoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">🔍 Consulta de Vehículo Premium</h3>
              <button
                onClick={() => setShowConsultaVehiculoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ConsultaVehiculo clienteId={idCliente} />
          </div>
        </div>
      )}

      {/* Modal de Gestión de Gastos */}
      {showGestionGastosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">💰 Gestión de Gastos Vehiculares Premium</h3>
              <button
                onClick={() => setShowGestionGastosModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <GestionGastosVehiculo clienteId={idCliente} />
          </div>
        </div>
      )}

      {/* Botón de Debug AuthProvider */}
      <AuthDebugButton />
    </div>
  );
}
