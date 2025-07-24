import React, { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth"; // npm i react-firebase-hooks
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

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

  // Función para verificar si el email corresponde a un agente no registrado
  const verificarAgenteNoRegistrado = async (email) => {
    try {
      const q = query(
        collection(db, 'agentes'),
        where('email', '==', email),
        where('requiere_registro', '==', true)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error verificando agente:', error);
      return false;
    }
  };

  // Función para verificar si el email corresponde a un agente registrado
  const verificarAgenteRegistrado = async (email) => {
    try {
      const q = query(
        collection(db, 'agentes'),
        where('email', '==', email),
        where('requiere_registro', '==', false)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error verificando agente registrado:', error);
      return false;
    }
  };

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      // Verificar el estado del usuario en Firestore antes de permitir el login
      const userDoc = await getDoc(doc(db, "usuarios", cred.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const rol = userData.rol;
        const estado = userData.estado;
        
        // Verificar si el usuario está en estado pendiente (especialmente agentes)
        if (estado === 'pendiente_registro') {
          // Cerrar la sesión inmediatamente para evitar acceso
          await signOut(auth);
          
          if (rol === 'agente') {
            setError(
              <div className="text-left">
                <p className="font-semibold text-red-600 mb-2">❌ Registro pendiente</p>
                <p className="text-sm mb-3">Tu cuenta de agente fue creada pero aún no has completado el registro inicial.</p>
                <p className="text-sm text-gray-600 mb-3">Debes usar el proceso de registro antes de poder hacer login.</p>
                <button
                  onClick={() => navigate('/registro-agente')}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Completar Registro de Agente
                </button>
              </div>
            );
          } else {
            setError("Tu cuenta está pendiente de activación. Contacta al administrador.");
          }
          return;
        }
        
        // Verificar si el usuario está inactivo
        if (estado === 'inactivo' || (userData.activo === false)) {
          await signOut(auth);
          setError("Tu cuenta está desactivada. Contacta al administrador.");
          return;
        }
        
        // Redirección automática según tipo y rol
        if (rol === "admin") {
          navigate("/admin");
        } else if (rol === "agente") {
          navigate("/agente");
        } else if (rol === "proveedor" || tipoLogin === "proveedor" || tipoUsuario === "proveedor") {
          navigate("/dashboard/proveedor");
        } else if (rol === "cliente" || tipoLogin === "cliente" || tipoUsuario === "cliente") {
          navigate("/dashboard/cliente");
        } else {
          navigate("/");
        }
      } else {
        // Si no existe en usuarios, verificar si es agente pendiente
        const esAgenteNoRegistrado = await verificarAgenteNoRegistrado(email);
        
        if (esAgenteNoRegistrado) {
          await signOut(auth);
          setError(
            <div className="text-left">
              <p className="font-semibold text-red-600 mb-2">❌ Registro incompleto</p>
              <p className="text-sm mb-3">Tienes credenciales de agente pero no has completado el registro inicial.</p>
              <p className="text-sm text-gray-600 mb-3">Debes completar tu registro antes de poder hacer login.</p>
              <button
                onClick={() => navigate('/registro-agente')}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                Completar Registro de Agente
              </button>
            </div>
          );
        } else {
          await signOut(auth);
          setError("Usuario no encontrado en el sistema. Contacta al administrador.");
        }
      }
    } catch (err) {
      console.error('Error en login:', err);
      
      // Si es error de usuario no encontrado, verificar si es un agente que necesita registrarse
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        const esAgenteNoRegistrado = await verificarAgenteNoRegistrado(email);
        const esAgenteRegistrado = await verificarAgenteRegistrado(email);
        
        if (esAgenteNoRegistrado) {
          setError(
            <div className="text-left">
              <p className="font-semibold text-blue-600 mb-2">🔑 ¿Eres un agente nuevo?</p>
              <p className="text-sm mb-3">Tienes credenciales de agente pero no has completado el registro inicial.</p>
              <p className="text-sm text-gray-600 mb-3">Usa las credenciales que te proporcionó el administrador.</p>
              <button
                onClick={() => navigate('/registro-agente')}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                Completar Registro de Agente
              </button>
            </div>
          );
        } else if (esAgenteRegistrado) {
          setError(
            <div className="text-left">
              <p className="font-semibold text-orange-600 mb-2">🔐 Agente registrado</p>
              <p className="text-sm mb-3">Eres un agente del sistema pero la contraseña es incorrecta.</p>
              <p className="text-sm text-gray-600">Verifica tu contraseña o contacta al administrador.</p>
            </div>
          );
        } else {
          setError("Credenciales incorrectas. Verifica tu email y contraseña.");
        }
      } else {
        setError("Error de conexión. Intenta nuevamente.");
      }
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
              {typeof error === 'string' ? error : error}
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
            
            {/* Opción especial para agentes */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-700 mb-2">
                <strong>¿Eres un agente de la empresa?</strong>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => navigate("/registro-agente")}
                  className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                >
                  👤 Registro de Agente
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/ayuda-agentes")}
                  className="bg-yellow-100 text-yellow-700 py-2 px-4 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                >
                  🆘 Ayuda
                </button>
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                Usa las credenciales proporcionadas por el administrador
              </div>
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