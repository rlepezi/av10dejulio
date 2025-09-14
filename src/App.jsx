import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EmpresaDetalleAgente from "./components/EmpresaDetalleAgente";
import AnalyticsService from "./services/AnalyticsService";

// Providers
import AuthProvider from "./components/AuthProvider";

// Componentes principales
import HomePage from "./pages/HomePage";
import VisualizarSolicitud from "./components/VisualizarSolicitud";
import LoginPage from "./components/LoginPage";
import AdminLayout from "./components/AdminLayout";
import DashboardSwitch from "./components/DashboardSwitch";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import DashboardAgente from "./components/DashboardAgente";
import EmpresasAsignadasAgente from "./pages/EmpresasAsignadasAgente";
import RegistrarEmpresaValidada from "./pages/RegistrarEmpresaValidada";

// Componentes para rutas públicas principales
import RegistroCliente from "./components/RegistroCliente";
import ClientValidationStatus from "./components/ClientValidationStatus";
import RegistroAgente from "./components/RegistroAgente";
import RegistroEmpresa from "./components/RegistroEmpresa";
import SolicitudComunidad from "./components/SolicitudComunidad";
import PymesLocalesPage from "./pages/PymesLocalesPage";
import ProveedoresPage from "./pages/ProveedoresPage";
import AreaClientePage from "./pages/AreaClientePage";
import FAQPage from "./pages/FAQPage";
import EducationalResourcesPage from "./pages/EducationalResourcesPage";
import ResourceDetailPage from "./pages/ResourceDetailPage";
import ContactPage from "./pages/ContactPage";
import SegurosPage from "./pages/SegurosPage";
import VulcanizacionesPage from "./pages/VulcanizacionesPage";
import ReciclajePage from "./pages/ReciclajePage";
import DashboardReciclajeCliente from "./pages/DashboardReciclajeCliente";
import DashboardReciclajeProveedor from "./pages/DashboardReciclajeProveedor";
import RegistroEmpresaReciclaje from "./pages/RegistroEmpresaReciclaje";
import RecordatoriosPage from "./pages/RecordatoriosPage";
import RevisionTecnicaPage from "./pages/RevisionTecnicaPage";
import ServiciosRevisionTecnicaPage from "./pages/ServiciosRevisionTecnicaPage";
import MasInformacionProveedorPage from "./pages/MasInformacionProveedorPage";
import PerfilEmpresaPublica from "./pages/PerfilEmpresaPublica";
import DashboardProveedorInterno from "./pages/DashboardProveedorInterno";
import DashboardClienteInterno from "./pages/DashboardClienteInterno";


// Componentes de empresa
import MiEmpresaPage from "./components/MiEmpresaPage";
import SolicitudCampanaPage from "./components/SolicitudCampanaPage";
import SolicitudProductoPage from "./components/SolicitudProductoPage";

// Componentes globales
import QuickFeedbackWidget from "./components/QuickFeedbackWidget";
import NotificationManager from "./components/NotificationManager";
import FirebaseTest from "./components/FirebaseTest";
import TestImageConversion from "./components/TestImageConversion";
import TestLogoUpload from "./components/TestLogoUpload";
import TestLogoDisplay from "./components/TestLogoDisplay";
// import AuthDebug from "./components/AuthDebug"; // DESHABILITADO
import UserCleanupAdmin from "./components/UserCleanupAdmin";

// Inicialización de datos
import { initializeServiceData } from "./utils/initializeData";
import { initializeRecyclingData } from "./utils/initializeRecyclingData";

function App() {
  const [activeUser, setActiveUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Inicializar Analytics
    AnalyticsService.initialize();
    
    // Inicializar datos de servicio si es necesario
    initializeServiceData();
    // Inicializar datos de reciclaje si es necesario
    initializeRecyclingData();

    // Escuchar cambios de autenticación
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setActiveUser(user);
      if (user) {
        // Trackear login
        AnalyticsService.trackUserLogin('user', 'email');
        
        // Escuchar datos del usuario en Firestore
        const userDocRef = collection(db, "usuarios");
        const unsubscribeUserData = onSnapshot(userDocRef, (snapshot) => {
          const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const currentUserData = users.find(u => u.uid === user.uid || u.email === user.email);
          setUserData(currentUserData);
          setIsLoading(false);
        });

        return () => unsubscribeUserData();
      } else {
        // Trackear logout
        AnalyticsService.trackUserLogout('user');
        setUserData(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando AV10 de Julio...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Gestor de notificaciones global */}
          {activeUser && <NotificationManager user={activeUser} />}
          
          {/* Rutas principales de la aplicación */}
          <Routes>
            {/* Página principal */}
            <Route path="/" element={<HomePage />} />
            
            {/* Login */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Dashboard general */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardSwitch />
                </ProtectedRoute>
              } 
            />

            {/* Visualización de solicitud individual en dashboard */}
            <Route path="/dashboard/visualizar-solicitud/:id" element={<VisualizarSolicitud />} />
            
            {/* Rutas de administración */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            
            {/* Rutas de agente */}
            <Route path="/dashboard/agente" element={<DashboardAgente />} />
            <Route path="/agente/empresas-asignadas" element={<DashboardAgente />} />
            <Route path="/agente/nueva-empresa" element={<RegistrarEmpresaValidada />} />
            <Route path="/agente/empresa/:empresaId" element={<EmpresaDetalleAgente />} />
            
            {/* Dashboard de empresa */}
            <Route
              path="/dashboard/proveedor"
              element={
                <ProtectedRoute>
                  <DashboardProveedorInterno />
                </ProtectedRoute>
              }
            />
            
            {/* Rutas de empresa */}
            <Route
              path="/empresa/mi-empresa"
              element={
                <ProtectedRoute>
                  <MiEmpresaPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/empresa/solicitar-campana"
              element={
                <ProtectedRoute>
                  <SolicitudCampanaPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/empresa/solicitar-producto"
              element={
                <ProtectedRoute>
                  <SolicitudProductoPage />
                </ProtectedRoute>
              }
            />
            
            {/* Rutas críticas para navegación desde HeroSection */}
            <Route path="/registro-cliente" element={<RegistroCliente />} />
            <Route path="/status-cliente" element={<ClientValidationStatus />} />
            <Route path="/registro-empresa" element={<RegistroEmpresa />} />
            <Route path="/solicitud-comunidad" element={<SolicitudComunidad />} />
            {/* Páginas públicas de empresas */}
            <Route path="/empresas" element={<PymesLocalesPage />} />
            <Route path="/proveedores" element={<ProveedoresPage />} />
            <Route path="/proveedores-locales" element={<PymesLocalesPage />} />
            <Route path="/empresas-locales" element={<PymesLocalesPage />} />
            <Route path="/area-cliente" element={<AreaClientePage />} />
            <Route path="/recursos" element={<EducationalResourcesPage />} />
            <Route path="/recursos/:resourceId" element={<ResourceDetailPage />} />
            <Route path="/registro-agente" element={<RegistroAgente />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/contacto" element={<ContactPage />} />
            
            {/* Rutas de servicios automotrices */}
            <Route path="/servicios/seguros" element={<SegurosPage />} />
            <Route path="/servicios/revision-tecnica" element={<ServiciosRevisionTecnicaPage />} />
            <Route path="/servicios/vulcanizaciones" element={<VulcanizacionesPage />} />
            <Route path="/servicios/reciclaje" element={<ReciclajePage />} />
        <Route path="/dashboard/reciclaje/cliente" element={<DashboardReciclajeCliente />} />
        <Route path="/dashboard/reciclaje/proveedor" element={<DashboardReciclajeProveedor />} />
        <Route path="/registro/empresa/reciclaje" element={<RegistroEmpresaReciclaje />} />
            <Route path="/mis-recordatorios" element={<RecordatoriosPage />} />
            <Route path="/dashboard/cliente/revision-tecnica" element={<RevisionTecnicaPage />} />
            
            {/* Perfil público de empresa */}
            <Route path="/empresa/:id" element={<PerfilEmpresaPublica />} />
            <Route path="/proveedor/:id" element={<PerfilEmpresaPublica />} />
            <Route path="/empresa/:empresaId" element={<PerfilEmpresaPublica />} />
            <Route path="/perfil-proveedor/:empresaId" element={<DashboardProveedorInterno />} />
            
            {/* Dashboard interno del cliente */}
            <Route path="/dashboard/cliente" element={<DashboardClienteInterno />} />
            <Route path="/dashboard/cliente/:clienteId" element={<DashboardClienteInterno />} />

            

            
                      {/* Test de Firebase para debug */}
          <Route path="/firebase-test" element={<FirebaseTest />} />
          
          {/* Test de conversión de imágenes */}
          <Route path="/test-images" element={<TestImageConversion />} />
          <Route path="/test-logo-upload" element={<TestLogoUpload />} />
          <Route path="/test-logo-display" element={<TestLogoDisplay />} />
          
          {/* Ruta temporal para limpieza de usuarios */}
          <Route path="/admin/cleanup-users" element={<UserCleanupAdmin />} />
            
            {/* Ruta catch-all para manejar rutas no encontradas */}
            <Route path="*" element={<HomePage />} />
          </Routes>

          {/* Widget de feedback global */}
          <QuickFeedbackWidget />
          
          {/* Componente de debug temporal - DESHABILITADO */}
          {/* <AuthDebug /> */}
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
