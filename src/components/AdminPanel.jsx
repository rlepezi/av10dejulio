import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import AdminStoreList from "./AdminStoreList";
import CampaignList from "./CampaignList";
import CampaignForm from "./CampaignForm";

function AdminPanel({ user }) {
  const [tab, setTab] = useState("overview");
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
        
        // Total de solicitudes pendientes
        const totalSolicitudesPendientes = solicitudesEmpresaSnapshot.size + solicitudesProveedorSnapshot.size;
        
        // Solicitudes clientes pendientes
        const clientesQuery = query(
          collection(db, 'solicitudes_cliente'),
          where('estado', '==', 'pendiente')
        );
        const clientesSnapshot = await getDocs(clientesQuery);
        console.log('👥 Solicitudes cliente pendientes:', clientesSnapshot.size);

        // Campañas
        const campañasSnapshot = await getDocs(collection(db, 'campañas'));
        console.log('📢 Campañas totales:', campañasSnapshot.size);

        const nuevasStats = {
          totalEmpresas: empresasSnapshot.size,
          empresasActivas: empresasActivas.length,
          solicitudesPendientes: totalSolicitudesPendientes,
          clientesPendientes: clientesSnapshot.size,
          totalCampañas: campañasSnapshot.size
        };
        
        console.log('✅ Estadísticas actualizadas:', nuevasStats);
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
    setLoading(true);
    console.log('🔄 Recargando estadísticas manualmente...');
    
    try {
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
      
      // Total de solicitudes pendientes
      const totalSolicitudesPendientes = solicitudesEmpresaSnapshot.size + solicitudesProveedorSnapshot.size;
      
      // Solicitudes clientes pendientes
      const clientesQuery = query(
        collection(db, 'solicitudes_cliente'),
        where('estado', '==', 'pendiente')
      );
      const clientesSnapshot = await getDocs(clientesQuery);
      console.log('👥 Solicitudes cliente pendientes:', clientesSnapshot.size);

      // Campañas
      const campañasSnapshot = await getDocs(collection(db, 'campañas'));
      console.log('📢 Campañas totales:', campañasSnapshot.size);

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

      {/* Navegación de pestañas */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button 
          className={`px-4 py-2 font-medium ${
            tab === "overview" 
              ? "border-b-2 border-blue-500 text-blue-600" 
              : "text-gray-500 hover:text-gray-700"
          }`} 
          onClick={() => setTab("overview")}
        >
          📊 Resumen
        </button>
        <button 
          className={`px-4 py-2 font-medium ${
            tab === "empresas" 
              ? "border-b-2 border-blue-500 text-blue-600" 
              : "text-gray-500 hover:text-gray-700"
          }`} 
          onClick={() => setTab("empresas")}
        >
          🏪 Empresas
        </button>
        <button 
          className={`px-4 py-2 font-medium ${
            tab === "campañas" 
              ? "border-b-2 border-blue-500 text-blue-600" 
              : "text-gray-500 hover:text-gray-700"
          }`} 
          onClick={() => setTab("campañas")}
        >
          📢 Campañas
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

          {/* Accesos rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">🏪 Gestión de Proveedores</h3>
              <div className="space-y-3">
                <Link 
                  to="/admin/solicitudes-registro" 
                  className="block w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-700 transition-colors"
                >
                  📋 Solicitudes Pendientes ({stats.solicitudesPendientes})
                </Link>
                <Link 
                  to="/admin/proveedores" 
                  className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  🏪 Ver Todos los Proveedores
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">👥 Gestión de Clientes</h3>
              <div className="space-y-3">
                <Link 
                  to="/admin/solicitudes-cliente" 
                  className="block w-full text-left px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm text-purple-700 transition-colors"
                >
                  📋 Solicitudes Pendientes ({stats.clientesPendientes})
                </Link>
                <Link 
                  to="/admin/validacion-clientes" 
                  className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  ✅ Validar Clientes
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">📊 Catastro y Datos</h3>
              <div className="space-y-3">
                <Link 
                  to="/admin/catastro-masivo" 
                  className="block w-full text-left px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg text-sm text-green-700 transition-colors"
                >
                  📊 Catastro Masivo
                </Link>
                <Link 
                  to="/admin/panel-validacion" 
                  className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  🔍 Panel de Validación
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">⚙️ Configuración</h3>
              <div className="space-y-3">
                <Link 
                  to="/admin/marcas" 
                  className="block w-full text-left px-4 py-2 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-sm text-yellow-700 transition-colors"
                >
                  🏷️ Gestión de Marcas
                </Link>
                <Link 
                  to="/admin/categorias" 
                  className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  📂 Gestión de Categorías
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">📈 Reportes y Stats</h3>
              <div className="space-y-3">
                <Link 
                  to="/admin/estadisticas" 
                  className="block w-full text-left px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm text-indigo-700 transition-colors"
                >
                  📊 Panel de Estadísticas
                </Link>
                <Link 
                  to="/admin/gestion-tickets" 
                  className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  🎫 Gestión de Tickets
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">🚗 Servicios</h3>
              <div className="space-y-3">
                <Link 
                  to="/servicios/seguros" 
                  className="block w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-700 transition-colors"
                >
                  🛡️ Gestión de Seguros
                </Link>
                <Link 
                  to="/mis-recordatorios" 
                  className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  🔔 Mis Recordatorios
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "empresas" && <AdminStoreList />}
      
      {tab === "campañas" && (
        <div className="space-y-6">
          <CampaignForm />
          <CampaignList />
        </div>
      )}
    </div>
  );
}

export default AdminPanel;