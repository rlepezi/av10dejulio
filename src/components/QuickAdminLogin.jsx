import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function QuickAdminLogin() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);

  const loginAsAdmin = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      await signInWithEmailAndPassword(auth, "admin@av10dejulio.com", "admin123456");
      setMessage("✅ Login exitoso como admin!");
    } catch (error) {
      console.error("Error en login:", error);
      setMessage(`❌ Error: ${error.message}`);
    }
    
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      setMessage("✅ Logout exitoso!");
    } catch (error) {
      setMessage(`❌ Error logout: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-xs z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Quick Admin Login</h3>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-gray-500 hover:text-gray-700 text-xs"
        >
          {isMinimized ? '🔓' : '🔒'}
        </button>
      </div>
      
      {!isMinimized && (
        <>
          <button
            onClick={loginAsAdmin}
            disabled={loading}
            className="w-full mb-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Iniciando..." : "Login Admin"}
          </button>
          
          <button
            onClick={logout}
            disabled={loading}
            className="w-full mb-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "Saliendo..." : "Logout"}
          </button>
          
          {message && (
            <div className="text-xs mt-2 p-2 bg-gray-100 rounded">
              {message}
            </div>
          )}
        </>
      )}
    </div>
  );
}
