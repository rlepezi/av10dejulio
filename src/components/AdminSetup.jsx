import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

export default function AdminSetup() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);

  const createAdminUser = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      // Crear usuario admin con email y password
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        "admin@av10dejulio.com", 
        "admin123456"
      );
      
      const user = userCredential.user;
      
      // Crear documento en la colección usuarios con rol admin
      await setDoc(doc(db, "usuarios", user.uid), {
        email: user.email,
        rol: "admin",
        nombre: "Administrador",
        created: new Date(),
        activo: true
      });
      
      setMessage("✅ Usuario admin creado exitosamente!");
    } catch (error) {
      console.error("Error creando admin:", error);
      if (error.code === 'auth/email-already-in-use') {
        setMessage("⚠️ El email ya está en uso. Intentando actualizar rol...");
        await updateExistingUserRole();
      } else {
        setMessage(`❌ Error: ${error.message}`);
      }
    }
    
    setLoading(false);
  };

  const updateExistingUserRole = async () => {
    try {
      // Si el usuario actual está logueado, actualizar su rol a admin
      const currentUser = auth.currentUser;
      if (currentUser) {
        await setDoc(doc(db, "usuarios", currentUser.uid), {
          email: currentUser.email,
          rol: "admin",
          nombre: "Administrador",
          updated: new Date(),
          activo: true
        }, { merge: true });
        
        setMessage("✅ Rol actualizado a admin para el usuario actual!");
      } else {
        setMessage("❌ No hay usuario logueado para actualizar");
      }
    } catch (error) {
      setMessage(`❌ Error actualizando rol: ${error.message}`);
    }
  };

  const checkExistingAdmin = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      // Verificar si ya existe un usuario admin
      const currentUser = auth.currentUser;
      if (currentUser) {
        const docSnap = await getDoc(doc(db, "usuarios", currentUser.uid));
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setMessage(`Usuario actual: ${userData.email} - Rol: ${userData.rol}`);
        } else {
          setMessage("Usuario autenticado pero sin documento en usuarios - Crea el documento admin");
        }
      } else {
        setMessage("No hay usuario autenticado");
      }
    } catch (error) {
      setMessage(`Error verificando usuario: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-xs z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Admin Setup</h3>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-gray-500 hover:text-gray-700 text-xs"
        >
          {isMinimized ? '📖' : '📕'}
        </button>
      </div>
      
      {!isMinimized && (
        <>
          <button
            onClick={checkExistingAdmin}
            disabled={loading}
            className="w-full mb-2 bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Verificar Usuario"}
          </button>
          
          <button
            onClick={createAdminUser}
            disabled={loading}
            className="w-full mb-2 bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear/Actualizar Admin"}
          </button>
          
          <button
            onClick={updateExistingUserRole}
            disabled={loading}
            className="w-full mb-2 bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "Hacer Admin Actual"}
          </button>
          
          {message && (
            <div className="text-xs mt-2 p-2 bg-gray-100 rounded max-h-20 overflow-y-auto">
              {message}
            </div>
          )}
          
          <div className="text-xs mt-2 text-gray-600">
            Email: admin@av10dejulio.com<br />
            Pass: admin123456
          </div>
        </>
      )}
    </div>
  );
}
