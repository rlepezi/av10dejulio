import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import AdminStoreList from "./AdminStoreList";
import CampaignList from "./CampaignList";
import CampaignForm from "./CampaignForm";
import CrearEmpresaPublica from "./CrearEmpresaPublica";
import QuickAccessPanel from "./QuickAccessPanel";
import AdminSolicitudesProducto from "./AdminSolicitudesProducto";
import AdminSolicitudesCampana from "./AdminSolicitudesCampana";

function AdminPanel({ user }) {
  const [tab, setTab] = useState("overview");
  const [mostrarCrearEmpresa, setMostrarCrearEmpresa] = useState(false);
  const [stats, setStats] = useState({
    totalEmpresas: 0,
    empresasActivas: 0,
    solicitudesPendientes: 0,
    clientesPendientes: 0,
    totalCampañas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        console.log('📊 Cargando estadísticas del dashboard...');
        
        // Empresas
        const empresasSnapshot = await getDocs(collection(db, 'empresas'));
        const empresasActivas = empresasSnapshot.docs.filter(doc => {
          const estado = doc.data().estado;
          return estado === 'activa' || estado === 'Activa';
        });
        console.log('🏢 Empresas encontradas:', empresasSnapshot.size, 'Activas:', empresasActivas.length);
        
        // Solicitudes de empresas/proveedores pendientes (colección principal)
        const solicitudesEmpresaQuery = query(
          collection(db, 'solicitudes_empresa'),
          where('estado', 'in', ['pendiente', 'en_revision'])
        );
        const solicitudesEmpresaSnapshot = await getDocs(solicitudesEmpresaQuery);
        console.log('📋 Solicitudes empresa pendientes:', solicitudesEmpresaSnapshot.size);
        
        // Solicitudes de proveedores (colección adicional)
        const solicitudesProveedorQuery = query(
          collection(db, 'solicitudes_proveedor'),
          where('estado_general', 'in', ['enviada', 'en_revision'])
        );
        const solicitudesProveedorSnapshot = await getDocs(solicitudesProveedorQuery);
        console.log('📋 Solicitudes proveedor pendientes:', solicitudesProveedorSnapshot.size);
        
        // Solicitudes de campañas
        const solicitudesCampanaQuery = query(
          collection(db, 'solicitudes_campana'),
          where('estado', 'in', ['pendiente', 'en_revision'])
        );
        const solicitudesCampanaSnapshot = await getDocs(solicitudesCampanaQuery);
        console.log('📢 Solicitudes campaña pendientes:', solicitudesCampanaSnapshot.size);
        
        // Solicitudes de productos
        const solicitudesProductoQuery = query(
          collection(db, 'solicitudes_producto'),
          where('estado', 'in', ['pendiente', 'en_revision'])
        );
        const solicitudesProductoSnapshot = await getDocs(solicitudesProductoQuery);
        console.log('📦 Solicitudes producto pendientes:', solicitudesProductoSnapshot.size);
        
        // Clientes pendientes
        const clientesSnapshot = await getDocs(collection(db, 'clientes'));
        console.log('👥 Clientes totales:', clientesSnapshot.size);
        
        // Campañas
        const campañasSnapshot = await getDocs(collection(db, 'campañas'));
        console.log('📢 Campañas totales:', campañasSnapshot.size);

        const totalSolicitudesPendientes = 
          solicitudesEmpresaSnapshot.size + 
          solicitudesProveedorSnapshot.size + 
          solicitudesCampanaSnapshot.size + 
          solicitudesProductoSnapshot.size;

        const nuevasStats = {
          totalEmpresas: empresasSnapshot.size,
          empresasActivas: empresasActivas.length,
          solicitudesPendientes: totalSolicitudesPendientes,
          clientesPendientes: clientesSnapshot.size,
          totalCampañas: campañasSnapshot.size
        };
        
        console.log('✅ Estadísticas recargadas:', nuevasStats);
        setStats(nuevasStats);
      } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, []);

  const recargarEstadisticas = async () => {
    try {
      setLoading(true);
      console.log('🔄 Recargando estadísticas...');
      
      // Empresas
      const empresasSnapshot = await getDocs(collection(db, 'empresas'));
      const empresasActivas = empresasSnapshot.docs.filter(doc => {
        const estado = doc.data().estado;
        return estado === 'activa' || estado === 'Activa';
      });
      
      // Solicitudes de empresas/proveedores pendientes
      const solicitudesEmpresaQuery = query(
        collection(db, 'solicitudes_empresa'),
        where('estado', 'in', ['pendiente', 'en_revision'])
      );
      const solicitudesEmpresaSnapshot = await getDocs(solicitudesEmpresaQuery);
      
      // Solicitudes de proveedores
      const solicitudesProveedorQuery = query(
        collection(db, 'solicitudes_proveedor'),
        where('estado_general', 'in', ['enviada', 'en_revision'])
      );
      const solicitudesProveedorSnapshot = await getDocs(solicitudesProveedorQuery);
      
      // Solicitudes de campañas
      const solicitudesCampanaQuery = query(
        collection(db, 'solicitudes_campana'),
        where('estado', 'in', ['pendiente', 'en_revision'])
      );
      const solicitudesCampanaSnapshot = await getDocs(solicitudesCampanaQuery);
      
      // Solicitudes de productos
      const solicitudesProductoQuery = query(
        collection(db, 'solicitudes_producto'),
        where('estado', 'in', ['pendiente', 'en_revision'])
      );
      const solicitudesProductoSnapshot = await getDocs(solicitudesProductoQuery);
      
      // Clientes
      const clientesSnapshot = await getDocs(collection(db, 'clientes'));
      
      // Campañas
      const campañasSnapshot = await getDocs(collection(db, 'campañas'));

      const totalSolicitudesPendientes = 
        solicitudesEmpresaSnapshot.size + 
        solicitudesProveedorSnapshot.size + 
        solicitudesCampanaSnapshot.size + 
        solicitudesProductoSnapshot.size;

      const nuevasStats = {
        totalEmpresas: empresasSnapshot.size,
        empresasActivas: empresasActivas.length,
        solicitudesPendientes: totalSolicitudesPendientes,
        clientesPendientes: clientesSnapshot.size,
        totalCampañas: campañasSnapshot.size
      };
      
      console.log('✅ Estadísticas recargadas:', nuevasStats);
      setStats(nuevasStats);
    } catch (error) {
      console.error('❌ Error recargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600">
            Bienvenido, {user?.email}. Gestiona todo el sistema desde aquí.
          </p>
        </div>
        <button
          onClick={recargarEstadisticas}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Cargando...
            </>
          ) : (
            <>
              🔄 Actualizar Estadísticas
            </>
          )}
        </button>
      </div>

      {/* Pestañas de navegación */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "overview"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => setTab("overview")}
        >
          📊 Resumen
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "empresas"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => setTab("empresas")}
        >
          🏢 Empresas
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "campañas"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => setTab("campañas")}
        >
          📢 Solicitudes Campañas
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "productos"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => setTab("productos")}
        >
          📦 Productos
        </button>
      </div>

      {/* Contenido de pestañas */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Estadísticas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-800">
                {loading ? '...' : stats.totalEmpresas}
              </div>
              <div className="text-blue-600 text-sm">Total Empresas</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-800">
                {loading ? '...' : stats.empresasActivas}
              </div>
              <div className="text-green-600 text-sm">Empresas Activas</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-800">
                {loading ? '...' : stats.solicitudesPendientes}
              </div>
              <div className="text-yellow-600 text-sm">Solicitudes Proveedores</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-800">
                {loading ? '...' : stats.clientesPendientes}
              </div>
              <div className="text-purple-600 text-sm">Clientes Pendientes</div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-indigo-800">
                {loading ? '...' : stats.totalCampañas}
              </div>
              <div className="text-indigo-600 text-sm">Campañas Activas</div>
            </div>
          </div>

          {/* Panel de Acceso Rápido */}
          <QuickAccessPanel />

          {/* Accesos rápidos */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🚀 Acciones Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Link
                to="/admin/empresas"
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">🏢</div>
                <div className="font-medium">Gestionar Empresas</div>
                <div className="text-sm opacity-90">Ver y editar perfiles</div>
              </Link>
              
              <Link
                to="/admin/solicitudes-empresas"
                className="bg-yellow-600 hover:bg-yellow-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">📋</div>
                <div className="font-medium">Solicitudes Empresas</div>
                <div className="text-sm opacity-90">Revisar pendientes</div>
              </Link>
              
              <button
                onClick={() => setTab("campañas")}
                className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">📢</div>
                <div className="font-medium">Solicitudes Campañas</div>
                <div className="text-sm opacity-90">Aprobar campañas</div>
              </button>
              
              <button
                onClick={() => setTab("productos")}
                className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">📦</div>
                <div className="font-medium">Solicitudes Productos</div>
                <div className="text-sm opacity-90">Aprobar productos</div>
              </button>
              
              <Link
                to="/admin/estadisticas"
                className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="font-medium">Estadísticas</div>
                <div className="text-sm opacity-90">Ver métricas</div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {tab === "empresas" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Gestión de Empresas</h2>
            <button
              onClick={() => setMostrarCrearEmpresa(!mostrarCrearEmpresa)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {mostrarCrearEmpresa ? "Ocultar Formulario" : "Crear Nueva Empresa"}
            </button>
          </div>
          
          {mostrarCrearEmpresa && (
            <div className="bg-white rounded-lg shadow p-6">
              <CrearEmpresaPublica />
            </div>
          )}
          
          <AdminStoreList />
        </div>
      )}

      {tab === "campañas" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Gestión de Solicitudes de Campañas</h2>
            <div className="text-sm text-gray-600">
              Revisa y aprueba las campañas que los proveedores solicitan publicar
            </div>
          </div>
          
          {console.log('🔍 Renderizando pestaña de campañas')}
          <AdminSolicitudesCampana />
        </div>
      )}

      {tab === "productos" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Gestión de Solicitudes de Productos</h2>
            <div className="text-sm text-gray-600">
              Revisa y aprueba los productos que los proveedores solicitan publicar
            </div>
          </div>
          
          {console.log('🔍 Renderizando pestaña de productos')}
          <AdminSolicitudesProducto />
        </div>
      )}
    </div>
  );
}

export default AdminPanel;