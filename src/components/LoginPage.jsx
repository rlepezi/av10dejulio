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
  const navigate = useNavigate();
  const location = useLocation();
  const [user, loading] = useAuthState(auth);

  // Detectar si vienen desde "login?tipo=proveedor"
  const params = new URLSearchParams(location.search);
  const tipoLogin = params.get("tipo"); // puede ser "proveedor" o undefined

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
      } else if (rol === "proveedor" || tipoLogin === "proveedor") {
        navigate("/dashboard/proveedor");
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
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow w-80">
        <h2 className="text-xl font-bold mb-4 text-center">Iniciar sesión</h2>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <input
          type="email"
          required
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="mb-2 w-full border p-2 rounded"
        />
        <input
          type="password"
          required
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="mb-4 w-full border p-2 rounded"
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
          Ingresar
        </button>
      </form>
    </div>
  );
}