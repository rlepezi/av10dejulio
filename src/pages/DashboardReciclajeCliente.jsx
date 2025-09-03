import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { collection, getDocs, query, where, orderBy, limit, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import HeaderMenu from '../components/HeaderMenu';

export default function DashboardReciclajeCliente() {
  const navigate = useNavigate();
  const { user, rol } = useAuth();
  const [vehiculos, setVehiculos] = useState([]);
  const [empresasReciclaje, setEmpresasReciclaje] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [visitaProgramada, setVisitaProgramada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProductosModal, setShowProductosModal] = useState(false);
  const [showEmpresasModal, setShowEmpresasModal] = useState(false);
  const [showVisitaModal, setShowVisitaModal] = useState(false);
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroProducto, setFiltroProducto] = useState('');

  // Estados para formularios
  const [formVisita, setFormVisita] = useState({
    fecha: '',
    hora: '',
    direccion: '',
    notas: '',
    productos: []
  });

  useEffect(() => {
    if (user && rol === 'cliente') {
      cargarDatosReciclaje();
    }
  }, [user, rol]);

  const cargarDatosReciclaje = async () => {
    try {
      setLoading(true);
      
      // Cargar vehículos del cliente
      const vehiculosQuery = query(
        collection(db, 'vehiculos'),
        where('clienteId', '==', user.uid),
        where('estado', '==', 'activo')
      );
      const vehiculosSnapshot = await getDocs(vehiculosQuery);
      const vehiculosData = vehiculosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVehiculos(vehiculosData);

      // Cargar empresas de reciclaje
      const empresasQuery = query(
        collection(db, 'empresas'),
        where('categorias', 'array-contains', 'reciclaje'),
        where('estado', '==', 'activa'),
        orderBy('fecha_creacion', 'desc'),
        limit(20)
      );
      const empresasSnapshot = await getDocs(empresasQuery);
      const empresasData = empresasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmpresasReciclaje(empresasData);

      // Cargar visita programada si existe
      const visitasQuery = query(
        collection(db, 'visitas_reciclaje'),
        where('clienteId', '==', user.uid),
        where('estado', 'in', ['programada', 'confirmada']),
        orderBy('fecha', 'desc'),
        limit(1)
      );
      const visitasSnapshot = await getDocs(visitasQuery);
      if (!visitasSnapshot.empty) {
        setVisitaProgramada({ id: visitasSnapshot.docs[0].id, ...visitasSnapshot.docs[0].data() });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos de reciclaje:', error);
      setLoading(false);
    }
  };

  // Productos de reciclaje disponibles
  const productosReciclaje = [
    {
      id: 'aceite_motor',
      nombre: 'Aceite de Motor Usado',
      categoria: 'Líquidos',
      impacto: 'alto',
      icono: '🛢️',
      descripcion: 'Aceite de motor usado que debe ser reciclado correctamente',
      precioEstimado: 'Gratis',
      frecuencia: 'Cada cambio de aceite'
    },
    {
      id: 'bateria',
      nombre: 'Batería de Vehículo',
      categoria: 'Electrónicos',
      impacto: 'alto',
      icono: '🔋',
      descripcion: 'Baterías que contienen plomo y ácido',
      precioEstimado: 'Gratis',
      frecuencia: 'Cada 3-5 años'
    },
    {
      id: 'neumaticos',
      nombre: 'Neumáticos Usados',
      categoria: 'Caucho',
      impacto: 'medio',
      icono: '🛞',
      descripcion: 'Neumáticos que se pueden reciclar en nuevos productos',
      precioEstimado: '$2-5 por neumático',
      frecuencia: 'Cada cambio de neumáticos'
    },
    {
      id: 'filtros',
      nombre: 'Filtros Usados',
      categoria: 'Filtros',
      impacto: 'medio',
      icono: '🧽',
      descripcion: 'Filtros de aire, aceite y combustible',
      precioEstimado: 'Gratis',
      frecuencia: 'Cada mantenimiento'
    },
    {
      id: 'liquidos_frenos',
      nombre: 'Líquido de Frenos',
      categoria: 'Líquidos',
      impacto: 'alto',
      icono: '💧',
      descripcion: 'Líquido de frenos usado y contaminado',
      precioEstimado: 'Gratis',
      frecuencia: 'Cada cambio de líquido'
    },
    {
      id: 'refrigerante',
      nombre: 'Refrigerante Usado',
      categoria: 'Líquidos',
      impacto: 'alto',
      icono: '❄️',
      descripcion: 'Refrigerante del sistema de aire acondicionado',
      precioEstimado: 'Gratis',
      frecuencia: 'Cada 2-3 años'
    },
    {
      id: 'repuestos_metal',
      nombre: 'Repuestos Metálicos',
      categoria: 'Metal',
      impacto: 'medio',
      icono: '🔧',
      descripcion: 'Partes metálicas que se pueden fundir y reutilizar',
      precioEstimado: '$0.50-2 por kg',
      frecuencia: 'Según reemplazos'
    },
    {
      id: 'aceite_transmision',
      nombre: 'Aceite de Transmisión',
      categoria: 'Líquidos',
      impacto: 'medio',
      icono: '⚙️',
      descripcion: 'Aceite de transmisión usado',
      precioEstimado: 'Gratis',
      frecuencia: 'Cada cambio de aceite'
    }
  ];

  const seleccionarProducto = (producto) => {
    console.log('🔄 Seleccionando producto:', producto);
    console.log('📦 Productos actuales:', productosSeleccionados);
    
    const yaSeleccionado = productosSeleccionados.find(p => p.id === producto.id);
    if (yaSeleccionado) {
      console.log('❌ Removiendo producto:', producto.nombre);
      const nuevosProductos = productosSeleccionados.filter(p => p.id !== producto.id);
      setProductosSeleccionados(nuevosProductos);
      console.log('✅ Productos después de remover:', nuevosProductos);
    } else {
      console.log('➕ Agregando producto:', producto.nombre);
      const nuevosProductos = [...productosSeleccionados, producto];
      setProductosSeleccionados(nuevosProductos);
      console.log('✅ Productos después de agregar:', nuevosProductos);
    }
  };

  const programarVisita = async () => {
    if (!empresaSeleccionada || productosSeleccionados.length === 0) {
      alert('Debes seleccionar una empresa y al menos un producto para reciclar');
      return;
    }

    try {
      const visitaData = {
        clienteId: user.uid,
        empresaId: empresaSeleccionada.id,
        empresaNombre: empresaSeleccionada.nombre,
        productos: productosSeleccionados,
        fecha: formVisita.fecha,
        hora: formVisita.hora,
        direccion: formVisita.direccion || user.direccion || 'Dirección del cliente',
        notas: formVisita.notas,
        estado: 'programada',
        fechaCreacion: new Date(),
        clienteNombre: user.displayName || user.email
      };

      const docRef = await addDoc(collection(db, 'visitas_reciclaje'), visitaData);
      
      // Actualizar estado local
      setVisitaProgramada({ id: docRef.id, ...visitaData });
      setShowVisitaModal(false);
      
      // Limpiar formulario
      setFormVisita({
        fecha: '',
        hora: '',
        direccion: '',
        notas: '',
        productos: []
      });

      alert('¡Visita programada exitosamente! La empresa se pondrá en contacto contigo.');
    } catch (error) {
      console.error('Error programando visita:', error);
      alert('Error al programar la visita. Intenta nuevamente.');
    }
  };

  const cancelarVisita = async () => {
    if (!visitaProgramada) return;

    try {
      await updateDoc(doc(db, 'visitas_reciclaje', visitaProgramada.id), {
        estado: 'cancelada',
        fechaCancelacion: new Date()
      });

      setVisitaProgramada(null);
      alert('Visita cancelada exitosamente.');
    } catch (error) {
      console.error('Error cancelando visita:', error);
      alert('Error al cancelar la visita. Intenta nuevamente.');
    }
  };

  const getImpactoColor = (impacto) => {
    switch (impacto) {
      case 'alto': return 'bg-red-100 text-red-800';
      case 'medio': return 'bg-yellow-100 text-yellow-800';
      case 'bajo': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Cargando tu dashboard de reciclaje...</p>
        </div>
      </div>
    );
  }

  if (!user || rol !== 'cliente') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Restringido</h1>
          <p className="text-gray-600 mb-6">Solo los clientes pueden acceder a este dashboard</p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <HeaderMenu />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ♻️ Dashboard de Reciclaje
          </h1>
          <p className="text-xl text-gray-600">
            Gestiona el reciclaje de tus vehículos y contribuye a un futuro más sostenible
          </p>
          
          {empresasReciclaje.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm mb-2">
                No hay empresas de reciclaje disponibles. Esto puede ser porque:
              </p>
              <ul className="text-yellow-700 text-sm text-left max-w-md mx-auto">
                <li>• Las empresas aún no se han registrado</li>
                <li>• Los datos de ejemplo no se han cargado</li>
                <li>• Hay un problema de conexión con la base de datos</li>
              </ul>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              >
                🔄 Recargar Página
              </button>
            </div>
          )}
        </div>

        {/* Resumen Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl mb-2">🚗</div>
            <div className="text-2xl font-bold text-blue-600">{vehiculos.length}</div>
            <div className="text-gray-600">Vehículos Activos</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl mb-2">♻️</div>
            <div className="text-2xl font-bold text-green-600">{productosSeleccionados.length}</div>
            <div className="text-gray-600">Productos a Reciclar</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl mb-2">🏭</div>
            <div className="text-2xl font-bold text-purple-600">{empresasReciclaje.length}</div>
            <div className="text-gray-600">Empresas Disponibles</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-2xl font-bold text-orange-600">
              {visitaProgramada ? '1' : '0'}
            </div>
            <div className="text-gray-600">Visitas Programadas</div>
          </div>
        </div>

        {/* Acciones Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Seleccionar Productos */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Seleccionar Productos</h3>
                <p className="text-sm text-gray-600">Elige qué quieres reciclar</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Productos seleccionados: <span className="font-semibold">{productosSeleccionados.length}</span>
              </p>
              {productosSeleccionados.length === 0 ? (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500 text-center">No hay productos seleccionados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {productosSeleccionados.map((producto) => (
                      <span key={producto.id} className="px-3 py-2 bg-green-100 text-green-800 text-sm rounded-lg flex items-center gap-2">
                        <span>{producto.icono}</span>
                        <span className="font-medium">{producto.nombre}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            seleccionarProducto(producto);
                          }}
                          className="ml-2 text-red-600 hover:text-red-800 text-lg"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-green-600 text-center">
                    ✅ {productosSeleccionados.length} producto(s) listo(s) para reciclar
                  </p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowProductosModal(true)}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              {productosSeleccionados.length > 0 ? 'Modificar Selección' : 'Seleccionar Productos'}
            </button>
          </div>

          {/* Buscar Empresas */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Buscar Empresas</h3>
                <p className="text-sm text-gray-600">Encuentra recicladores cercanos</p>
              </div>
            </div>
            
            <div className="mb-4">
              {empresaSeleccionada ? (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">{empresaSeleccionada.nombre}</p>
                  <p className="text-xs text-blue-700">{empresaSeleccionada.direccion}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No has seleccionado una empresa</p>
              )}
            </div>
            
            <button
              onClick={() => setShowEmpresasModal(true)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {empresaSeleccionada ? 'Cambiar Empresa' : 'Buscar Empresas'}
            </button>
          </div>

          {/* Coordinar Visita */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Coordinar Visita</h3>
                <p className="text-sm text-gray-600">Programa la recolección</p>
              </div>
            </div>
            
            <div className="mb-4">
              {visitaProgramada ? (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900">Visita Programada</p>
                  <p className="text-xs text-green-700">
                    {new Date(visitaProgramada.fecha).toLocaleDateString()} - {visitaProgramada.hora}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-500 text-center mb-2">Estado de la solicitud</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${empresaSeleccionada ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span>Empresa: {empresaSeleccionada ? '✅ Seleccionada' : '❌ Pendiente'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${productosSeleccionados.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span>Productos: {productosSeleccionados.length > 0 ? `✅ ${productosSeleccionados.length}` : '❌ Pendiente'}</span>
                      </div>
                    </div>
                  </div>
                  {empresaSeleccionada && productosSeleccionados.length > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 text-center">
                        🎉 ¡Todo listo! Puedes programar tu visita de reciclaje
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                console.log('🔍 Estado para coordinar visita:', {
                  empresaSeleccionada: empresaSeleccionada?.nombre,
                  productosSeleccionados: productosSeleccionados.length,
                  productos: productosSeleccionados.map(p => p.nombre)
                });
                setShowVisitaModal(true);
              }}
              disabled={!empresaSeleccionada || productosSeleccionados.length === 0}
              className={`w-full py-3 px-4 rounded-lg transition-colors ${
                empresaSeleccionada && productosSeleccionados.length > 0
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {visitaProgramada ? 'Modificar Visita' : 'Programar Visita'}
            </button>
          </div>
        </div>

        {/* Estado de Visita Programada */}
        {visitaProgramada && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">📅 Visita Programada</h3>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                {visitaProgramada.estado === 'programada' ? 'Programada' : 'Confirmada'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Empresa</p>
                <p className="text-gray-900">{visitaProgramada.empresaNombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Fecha y Hora</p>
                <p className="text-gray-900">
                  {new Date(visitaProgramada.fecha).toLocaleDateString()} - {visitaProgramada.hora}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Productos</p>
                <p className="text-gray-900">{visitaProgramada.productos.length} productos</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowVisitaModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Modificar Visita
              </button>
              <button
                onClick={cancelarVisita}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancelar Visita
              </button>
            </div>
          </div>
        )}

        {/* Mis Vehículos */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🚗 Mis Vehículos</h3>
          
          {vehiculos.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">🚗</div>
              <p className="text-gray-600 mb-4">No tienes vehículos registrados</p>
              <button
                onClick={() => navigate('/dashboard/cliente')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Registrar Vehículo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehiculos.map((vehiculo) => (
                <div key={vehiculo.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🚗</span>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {vehiculo.marca} {vehiculo.modelo}
                      </h4>
                      <p className="text-sm text-gray-600">{vehiculo.ano}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Placa: {vehiculo.placa}</p>
                  <div className="text-xs text-gray-500">
                    Último mantenimiento: {vehiculo.ultimoMantenimiento ? 
                      new Date(vehiculo.ultimoMantenimiento).toLocaleDateString() : 'No registrado'
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Selección de Productos */}
      {showProductosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">📦 Seleccionar Productos para Reciclar</h3>
              <button
                onClick={() => setShowProductosModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={filtroProducto}
                onChange={(e) => setFiltroProducto(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {productosReciclaje
                .filter(producto => 
                  producto.nombre.toLowerCase().includes(filtroProducto.toLowerCase()) ||
                  producto.categoria.toLowerCase().includes(filtroProducto.toLowerCase())
                )
                .map((producto) => {
                  const seleccionado = productosSeleccionados.find(p => p.id === producto.id);
                  return (
                    <div
                      key={producto.id}
                      onClick={() => seleccionarProducto(producto)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        seleccionado 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{producto.icono}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{producto.nombre}</h4>
                          <p className="text-sm text-gray-600">{producto.categoria}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactoColor(producto.impacto)}`}>
                          {producto.impacto}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{producto.descripcion}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Precio: {producto.precioEstimado}</span>
                        <span>Frecuencia: {producto.frecuencia}</span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Productos seleccionados: <span className="font-semibold">{productosSeleccionados.length}</span>
              </p>
              <button
                onClick={() => setShowProductosModal(false)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirmar Selección
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Búsqueda de Empresas */}
      {showEmpresasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">🏭 Buscar Empresas de Reciclaje</h3>
              <button
                onClick={() => setShowEmpresasModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar empresas por nombre, ubicación o servicios..."
                value={filtroEmpresa}
                onChange={(e) => setFiltroEmpresa(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {empresasReciclaje.length === 0 ? (
                <div className="md:col-span-2 text-center py-8">
                  <div className="text-6xl mb-4">🏭</div>
                  <h4 className="text-xl font-semibold text-gray-700 mb-2">No hay empresas de reciclaje disponibles</h4>
                  <p className="text-gray-500 mb-4">
                    Aún no se han registrado empresas de reciclaje en tu zona.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      💡 <strong>¿Eres una empresa?</strong> Regístrate como proveedora de servicios de reciclaje 
                      para conectar con clientes que buscan reciclar sus residuos automotrices.
                    </p>
                  </div>
                </div>
              ) : (() => {
                const empresasFiltradas = empresasReciclaje.filter(empresa => 
                  empresa.nombre.toLowerCase().includes(filtroEmpresa.toLowerCase()) ||
                  empresa.direccion.toLowerCase().includes(filtroEmpresa.toLowerCase()) ||
                  (empresa.serviciosReciclaje && empresa.serviciosReciclaje.some(servicio => 
                    servicio.toLowerCase().includes(filtroEmpresa.toLowerCase())
                  )) ||
                  (empresa.zonaServicio && empresa.zonaServicio.some(zona => 
                    zona.toLowerCase().includes(filtroEmpresa.toLowerCase())
                  ))
                );
                
                if (empresasFiltradas.length === 0) {
                  return (
                    <div key="no-results" className="md:col-span-2 text-center py-8">
                      <div className="text-4xl mb-4">🔍</div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">No se encontraron resultados</h4>
                      <p className="text-gray-500">
                        No hay empresas que coincidan con tu búsqueda: <strong>"{filtroEmpresa}"</strong>
                      </p>
                    </div>
                  );
                }
                
                return empresasFiltradas.map((empresa) => {
                  const seleccionada = empresaSeleccionada?.id === empresa.id;
                  return (
                    <div
                      key={empresa.id}
                      onClick={() => setEmpresaSeleccionada(empresa)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        seleccionada 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🏭</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{empresa.nombre}</h4>
                            <p className="text-sm text-gray-600">{empresa.direccion}</p>
                          </div>
                        </div>
                        {seleccionada && (
                          <span className="text-blue-600 text-2xl">✓</span>
                        )}
                      </div>
                      
                      {empresa.telefono && (
                        <p className="text-sm text-blue-600 mb-2">📞 {empresa.telefono}</p>
                      )}
                      
                      {empresa.serviciosReciclaje && empresa.serviciosReciclaje.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Recicla:</p>
                          <div className="flex flex-wrap gap-1">
                            {empresa.serviciosReciclaje.slice(0, 4).map((servicio, index) => {
                              const servicioInfo = productosReciclaje.find(p => p.id === servicio);
                              return (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1"
                                >
                                  <span>{servicioInfo?.icono || '♻️'}</span>
                                  <span>{servicioInfo?.nombre || servicio}</span>
                                </span>
                              );
                            })}
                            {empresa.serviciosReciclaje.length > 4 && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                +{empresa.serviciosReciclaje.length - 4} más
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {empresa.zonaServicio && empresa.zonaServicio.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Zonas de servicio:</p>
                          <div className="flex flex-wrap gap-1">
                            {empresa.zonaServicio.slice(0, 3).map((zona, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                              >
                                📍 {zona}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {empresa.rating && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-lg ${
                                    i < Math.floor(empresa.rating) ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                >
                                  ⭐
                                </span>
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {empresa.rating} ({empresa.totalReviews || 0} reseñas)
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/empresa/${empresa.id}`);
                          }}
                          className="flex-1 bg-gray-600 text-white py-2 px-3 rounded text-sm hover:bg-gray-700 transition-colors"
                        >
                          Ver Perfil
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmpresaSeleccionada(empresa);
                          }}
                          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Seleccionar
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>



            <div className="flex justify-between items-center">
              {empresaSeleccionada && (
                <p className="text-sm text-gray-600">
                  Empresa seleccionada: <span className="font-semibold">{empresaSeleccionada.nombre}</span>
                </p>
              )}
              <button
                onClick={() => setShowEmpresasModal(false)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {empresaSeleccionada ? 'Confirmar Selección' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Programación de Visita */}
      {showVisitaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">📅 Programar Visita de Recolección</h3>
              <button
                onClick={() => setShowVisitaModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Empresa Seleccionada</label>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-900">{empresaSeleccionada?.nombre}</p>
                  <p className="text-sm text-blue-700">{empresaSeleccionada?.direccion}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Productos a Reciclar</label>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 mb-2">
                    {productosSeleccionados.length} productos seleccionados
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {productosSeleccionados.map((producto) => (
                      <span key={producto.id} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {producto.icono} {producto.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                  <input
                    type="date"
                    value={formVisita.fecha}
                    onChange={(e) => setFormVisita({...formVisita, fecha: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                  <input
                    type="time"
                    value={formVisita.hora}
                    onChange={(e) => setFormVisita({...formVisita, hora: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección de Recolección</label>
                <input
                  type="text"
                  value={formVisita.direccion}
                  onChange={(e) => setFormVisita({...formVisita, direccion: e.target.value})}
                  placeholder={user.direccion || "Ingresa la dirección de recolección"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notas Adicionales</label>
                <textarea
                  value={formVisita.notas}
                  onChange={(e) => setFormVisita({...formVisita, notas: e.target.value})}
                  placeholder="Instrucciones especiales, acceso al domicilio, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowVisitaModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={programarVisita}
                disabled={!formVisita.fecha || !formVisita.hora}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  formVisita.fecha && formVisita.hora
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Programar Visita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
