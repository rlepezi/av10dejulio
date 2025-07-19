import React, { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth"; // npm i react-firebase-hooks
import { doc, getDoc } from "firebase/firestore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState(""); // proveedor, cliente
  const navigate = useNavigate();
  const location = useLocation();
  const [user, loading] = useAuthState(auth);

  // Detectar si vienen desde "login?tipo=proveedor"
  const params = new URLSearchParams(location.search);
  const tipoLogin = params.get("tipo"); // puede ser "proveedor" o "cliente"

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Traer el rol desde Firestore (usuarios/{uid})
      const userDoc = await getDoc(doc(db, "usuarios", cred.user.uid));
      let rol = "";
      if (userDoc.exists()) {
        rol = userDoc.data().rol;
      }
      // Redirección automática según tipo y rol
      if (rol === "admin") {
        navigate("/admin");
      } else if (rol === "proveedor" || tipoLogin === "proveedor" || tipoUsuario === "proveedor") {
        navigate("/dashboard/proveedor");
      } else if (rol === "cliente" || tipoLogin === "cliente" || tipoUsuario === "cliente") {
        navigate("/dashboard/cliente");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError("Credenciales incorrectas");
    }
  }

  async function handleLogout() {
    await signOut(auth);
    setError("");
    setEmail("");
    setPassword("");
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  if (user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white p-6 rounded shadow w-80 text-center">
          <h2 className="text-xl font-bold mb-4">Ya has iniciado sesión</h2>
          <p className="mb-4">Usuario actual: <b>{user.email}</b></p>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 rounded mb-2"
          >
            Cerrar sesión
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full text-blue-700 underline"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        {/* Selector de tipo de usuario */}
        {!tipoLogin && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h3 className="text-lg font-semibold text-center mb-4">¿Qué tipo de usuario eres?</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTipoUsuario("cliente")}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  tipoUsuario === "cliente" 
                    ? "border-blue-500 bg-blue-50 text-blue-700" 
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🚗</div>
                  <div className="font-medium">Cliente</div>
                  <div className="text-sm text-gray-600">Tengo un vehículo</div>
                </div>
              </button>
              
              <button
                onClick={() => setTipoUsuario("proveedor")}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  tipoUsuario === "proveedor" 
                    ? "border-green-500 bg-green-50 text-green-700" 
                    : "border-gray-200 hover:border-green-300"
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🏪</div>
                  <div className="font-medium">Proveedor</div>
                  <div className="text-sm text-gray-600">Tengo un negocio</div>
                </div>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Iniciar sesión
              {(tipoLogin || tipoUsuario) && (
                <span className="block text-sm font-normal text-gray-600 mt-1">
                  como {tipoLogin || tipoUsuario}
                </span>
              )}
            </h2>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors mt-6"
          >
            Iniciar sesión
          </button>
          
          <div className="mt-6 text-center space-y-3">
            <div className="text-sm text-gray-600">
              ¿No tienes cuenta?
            </div>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate("/registro-cliente")}
                className="flex-1 bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                🚗 Registro Cliente
              </button>
              
              <button
                type="button"
                onClick={() => navigate("/registro-proveedor")}
                className="flex-1 bg-green-100 text-green-700 py-2 px-4 rounded-lg hover:bg-green-200 transition-colors text-sm"
              >
                🏪 Registro Proveedor
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-gray-500 hover:text-gray-700 underline text-sm"
            >
              Volver al inicio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}