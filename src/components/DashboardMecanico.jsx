import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

export default function DashboardMecanico() {
  const { user } = useAuth();
  const [solicitudesServicio, setSolicitudesServicio] = useState([]);
  const [serviciosActivos, setServiciosActivos] = useState([]);
  const [historialServicios, setHistorialServicios] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('solicitudes');
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Cargar perfil del mecánico
      const perfilQuery = query(
        collection(db, 'mecanicos'),
        where('userId', '==', user.uid)
      );
      const perfilSnapshot = await getDocs(perfilQuery);
      if (!perfilSnapshot.empty) {
        setPerfil({ id: perfilSnapshot.docs[0].id, ...perfilSnapshot.docs[0].data() });
      }

      // Cargar solicitudes de servicio
      const solicitudesQuery = query(
        collection(db, 'solicitudes_servicio'),
        where('estado', '==', 'pendiente'),
        orderBy('fechaCreacion', 'desc')
      );
      const solicitudesSnapshot = await getDocs(solicitudesQuery);
      setSolicitudesServicio(solicitudesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Cargar servicios activos del mecánico
      const serviciosActivosQuery = query(
        collection(db, 'servicios_mecanico'),
        where('mecanicoId', '==', user.uid),
        where('estado', 'in', ['aceptado', 'en_proceso'])
      );
      const serviciosActivosSnapshot = await getDocs(serviciosActivosQuery);
      setServiciosActivos(serviciosActivosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Cargar historial de servicios
      const historialQuery = query(
        collection(db, 'servicios_mecanico'),
        where('mecanicoId', '==', user.uid),
        where('estado', '==', 'completado'),
        orderBy('fechaCompletado', 'desc')
      );
      const historialSnapshot = await getDocs(historialQuery);
      const historialData = historialSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistorialServicios(historialData);

      // Calcular estadísticas
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      
      const serviciosEsteMes = historialData.filter(s => {
        const fecha = new Date(s.fechaCompletado.seconds * 1000);
        return fecha >= inicioMes;
      });

      setStats({
        serviciosCompletados: historialData.length,
        serviciosEsteMes: serviciosEsteMes.length,
        ingresoEsteMes: serviciosEsteMes.reduce((total, s) => total + (s.precio || 0), 0),
        serviciosActivos: serviciosActivosSnapshot.docs.length,
        calificacionPromedio: calcularCalificacionPromedio(historialData)
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularCalificacionPromedio = (servicios) => {
    const serviciosConCalificacion = servicios.filter(s => s.calificacion);
    if (serviciosConCalificacion.length === 0) return 0;
    
    const suma = serviciosConCalificacion.reduce((total, s) => total + s.calificacion, 0);
    return (suma / serviciosConCalificacion.length).toFixed(1);
  };

  const aceptarSolicitud = async (solicitudId) => {
    try {
      // Crear servicio
      const solicitud = solicitudesServicio.find(s => s.id === solicitudId);
      const nuevoServicio = {
        solicitudId,
        mecanicoId: user.uid,
        clienteId: solicitud.userId,
        tipoServicio: solicitud.tipoServicio,
        descripcion: solicitud.descripcion,
        ubicacion: solicitud.ubicacion,
        precio: solicitud.presupuesto,
        estado: 'aceptado',
        fechaAceptado: new Date()
      };

      await addDoc(collection(db, 'servicios_mecanico'), nuevoServicio);
      
      // Actualizar solicitud
      await updateDoc(doc(db, 'solicitudes_servicio', solicitudId), {
        estado: 'aceptada',
        mecanicoId: user.uid
      });

      await loadDashboardData();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const iniciarServicio = async (servicioId) => {
    try {
      await updateDoc(doc(db, 'servicios_mecanico', servicioId), {
        estado: 'en_proceso',
        fechaInicio: new Date()
      });
      await loadDashboardData();
    } catch (error) {
      console.error('Error starting service:', error);
    }
  };

  const completarServicio = async (servicioId, detalles) => {
    try {
      await updateDoc(doc(db, 'servicios_mecanico', servicioId), {
        estado: 'completado',
        fechaCompletado: new Date(),
        detallesCompletado: detalles
      });
      await loadDashboardData();
    } catch (error) {
      console.error('Error completing service:', error);
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
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Mecánico</h1>
        <p className="text-gray-600">Gestiona tus servicios y solicitudes</p>
      </div>

      {/* Estadísticas */}
      <div className="grid md:grid-cols-5 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔧</span>
            <div>
              <p className="text-sm text-gray-600">Servicios Activos</p>
              <p className="text-2xl font-bold text-blue-600">{stats.serviciosActivos}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm text-gray-600">Completados (mes)</p>
              <p className="text-2xl font-bold text-green-600">{stats.serviciosEsteMes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <p className="text-sm text-gray-600">Ingresos (mes)</p>
              <p className="text-2xl font-bold text-yellow-600">
                ${stats.ingresoEsteMes?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="text-sm text-gray-600">Calificación</p>
              <p className="text-2xl font-bold text-purple-600">{stats.calificacionPromedio}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <p className="text-sm text-gray-600">Total Servicios</p>
              <p className="text-2xl font-bold text-red-600">{stats.serviciosCompletados}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="flex space-x-4 p-4 border-b">
          <button
            className={`pb-2 px-4 ${activeTab === 'solicitudes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('solicitudes')}
          >
            📥 Solicitudes ({solicitudesServicio.length})
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'activos' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('activos')}
          >
            🔧 Servicios Activos ({serviciosActivos.length})
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'historial' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('historial')}
          >
            📋 Historial
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'perfil' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('perfil')}
          >
            👤 Mi Perfil
          </button>
        </div>

        <div className="p-6">
          {/* Solicitudes de servicio */}
          {activeTab === 'solicitudes' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Nuevas Solicitudes de Servicio</h3>
              {solicitudesServicio.length === 0 ? (
                <p className="text-gray-500">No hay solicitudes pendientes.</p>
              ) : (
                <div className="space-y-4">
                  {solicitudesServicio.map(solicitud => (
                    <div key={solicitud.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{solicitud.tipoServicio}</h4>
                          <p className="text-sm text-gray-600">{solicitud.descripcion}</p>
                          <p className="text-sm text-gray-600">📍 {solicitud.ubicacion}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            ${solicitud.presupuesto?.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(solicitud.fechaCreacion.seconds * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                          onClick={() => aceptarSolicitud(solicitud.id)}
                        >
                          Aceptar Servicio
                        </button>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                          Ver Detalles
                        </button>
                        <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                          Contactar Cliente
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Servicios activos */}
          {activeTab === 'activos' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Servicios en Proceso</h3>
              {serviciosActivos.length === 0 ? (
                <p className="text-gray-500">No tienes servicios activos.</p>
              ) : (
                <div className="space-y-4">
                  {serviciosActivos.map(servicio => (
                    <div key={servicio.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{servicio.tipoServicio}</h4>
                          <p className="text-sm text-gray-600">{servicio.descripcion}</p>
                          <p className="text-sm text-gray-600">📍 {servicio.ubicacion}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          servicio.estado === 'aceptado' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {servicio.estado === 'aceptado' ? 'Aceptado' : 'En Proceso'}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-gray-600">Precio acordado:</span>
                          <p className="font-semibold">${servicio.precio?.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Fecha acordada:</span>
                          <p className="font-semibold">
                            {servicio.fechaAceptado && 
                              new Date(servicio.fechaAceptado.seconds * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {servicio.estado === 'aceptado' && (
                          <button
                            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                            onClick={() => iniciarServicio(servicio.id)}
                          >
                            Iniciar Servicio
                          </button>
                        )}
                        {servicio.estado === 'en_proceso' && (
                          <button
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            onClick={() => completarServicio(servicio.id, {})}
                          >
                            Completar Servicio
                          </button>
                        )}
                        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                          Contactar Cliente
                        </button>
                        <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                          Subir Fotos
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Historial */}
          {activeTab === 'historial' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Historial de Servicios</h3>
              {historialServicios.length === 0 ? (
                <p className="text-gray-500">No tienes servicios completados aún.</p>
              ) : (
                <div className="space-y-4">
                  {historialServicios.slice(0, 10).map(servicio => (
                    <div key={servicio.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{servicio.tipoServicio}</h4>
                          <p className="text-sm text-gray-600">{servicio.descripcion}</p>
                          <p className="text-sm text-gray-600">
                            Completado: {new Date(servicio.fechaCompletado.seconds * 1000).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            ${servicio.precio?.toLocaleString()}
                          </p>
                          {servicio.calificacion && (
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500">⭐</span>
                              <span className="text-sm">{servicio.calificacion}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {servicio.comentarioCliente && (
                        <div className="bg-gray-50 p-3 rounded mt-2">
                          <span className="text-sm font-medium">Comentario del cliente:</span>
                          <p className="text-sm text-gray-700">{servicio.comentarioCliente}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Perfil */}
          {activeTab === 'perfil' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Mi Perfil Profesional</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2"
                      value={perfil?.nombre || ''}
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Especialidades</label>
                    <div className="flex flex-wrap gap-2">
                      {perfil?.especialidades?.map(esp => (
                        <span key={esp} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {esp}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Experiencia</label>
                    <p className="text-sm text-gray-700">{perfil?.experiencia || 'No especificada'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Zona de Cobertura</label>
                    <p className="text-sm text-gray-700">{perfil?.zonaCobertura || 'No especificada'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Tarifa Base</label>
                    <p className="text-sm text-gray-700">
                      ${perfil?.tarifaBase?.toLocaleString() || 'No especificada'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Disponibilidad</label>
                    <p className="text-sm text-gray-700">{perfil?.horarios || 'No especificada'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                  Editar Perfil
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
