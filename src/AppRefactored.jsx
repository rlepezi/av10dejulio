import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { BrowserRouter } from "react-router-dom";

// Providers
import AuthProvider from "./components/AuthProvider";

// Routes modularizadas
import PublicRoutes from "./routes/PublicRoutes";
import AdminRoutes from "./routes/AdminRoutes";
import ProviderRoutes from "./routes/ProviderRoutes";
import ClientRoutes from "./routes/ClientRoutes";
import OtherRoutes from "./routes/OtherRoutes";

// Componentes globales
import QuickFeedbackWidget from "./components/QuickFeedbackWidget";
import NotificationManager from "./components/NotificationManager";

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
          
          {/* Rutas de la aplicación */}
          <PublicRoutes />
          <AdminRoutes />
          <ProviderRoutes />
          <ClientRoutes />
          <OtherRoutes />

          {/* Widget de feedback global */}
          <QuickFeedbackWidget />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
