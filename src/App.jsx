import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EmpresaDetalleAgente from "./components/EmpresaDetalleAgente";

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
import RegistroAgente from "./components/RegistroAgente";
import RegistroProveedor from "./components/RegistroProveedor";
import SolicitudComunidad from "./components/SolicitudComunidad";
import LocalProvidersPage from "./pages/LocalProvidersPage";
import PymesLocalesPage from "./pages/PymesLocalesPage";
import AreaClientePage from "./pages/AreaClientePage";
import FAQPage from "./pages/FAQPage";
import EducationalResourcesPage from "./pages/EducationalResourcesPage";
import ResourceDetailPage from "./pages/ResourceDetailPage";
import ContactPage from "./pages/ContactPage";
import SegurosPage from "./pages/SegurosPage";
import RevisionTecnicaPage from "./pages/RevisionTecnicaPage";
import VulcanizacionesPage from "./pages/VulcanizacionesPage";
import ReciclajePage from "./pages/ReciclajePage";
import RecordatoriosPage from "./pages/RecordatoriosPage";
import MasInformacionProveedorPage from "./pages/MasInformacionProveedorPage";
import PerfilEmpresaPublica from "./pages/PerfilEmpresaPublica";

// Componentes globales
import QuickFeedbackWidget from "./components/QuickFeedbackWidget";
import NotificationManager from "./components/NotificationManager";
import FirebaseTest from "./components/FirebaseTest";

// Inicialización de datos
import { initializeServiceData } from "./utils/initializeData";

function App() {
  const [activeUser, setActiveUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Inicializar datos de servicio si es necesario
    initializeServiceData();

    // Escuchar cambios de autenticación
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setActiveUser(user);
      if (user) {
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
            <Route path="/agente/empresas-asignadas" element={<EmpresasAsignadasAgente />} />
            <Route path="/agente/nueva-empresa" element={<RegistrarEmpresaValidada />} />
            <Route path="/agente/empresa/:empresaId" element={<EmpresaDetalleAgente />} />
            
            {/* Rutas críticas para navegación desde HeroSection */}
            <Route path="/registro-cliente" element={<RegistroCliente />} />
            <Route path="/registro-proveedor" element={<RegistroProveedor />} />
            <Route path="/solicitud-comunidad" element={<SolicitudComunidad />} />
            <Route path="/proveedores" element={<LocalProvidersPage />} />
            <Route path="/proveedores-locales" element={<PymesLocalesPage />} />
            <Route path="/area-cliente" element={<AreaClientePage />} />
            <Route path="/recursos" element={<EducationalResourcesPage />} />
            <Route path="/recursos/:resourceId" element={<ResourceDetailPage />} />
            <Route path="/registro-agente" element={<RegistroAgente />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/contacto" element={<ContactPage />} />
            
            {/* Rutas de servicios automotrices */}
            <Route path="/servicios/seguros" element={<SegurosPage />} />
            <Route path="/servicios/revision-tecnica" element={<RevisionTecnicaPage />} />
            <Route path="/servicios/vulcanizaciones" element={<VulcanizacionesPage />} />
            <Route path="/servicios/reciclaje" element={<ReciclajePage />} />
            <Route path="/mis-recordatorios" element={<RecordatoriosPage />} />
            
            {/* Perfil público de proveedor */}
            <Route path="/proveedor/:id" element={<MasInformacionProveedorPage />} />
            <Route path="/empresa/:empresaId" element={<PerfilEmpresaPublica />} />
            
            {/* Test de Firebase para debug */}
            <Route path="/firebase-test" element={<FirebaseTest />} />
            
            {/* Ruta catch-all para manejar rutas no encontradas */}
            <Route path="*" element={<HomePage />} />
          </Routes>

          {/* Widget de feedback global */}
          <QuickFeedbackWidget />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
