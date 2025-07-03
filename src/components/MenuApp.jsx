import React, { useEffect, useState } from "react";
import { FaBuilding, FaBullhorn, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

export default function MenuApp({ onSelect }) {
  const [user, setUser] = useState(null);
  const auth = getAuth();

  // Escuchar cambios de sesión
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      alert("Error al iniciar sesión: " + err.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      alert("Error al cerrar sesión: " + err.message);
    }
  };

  return (
    <nav className="flex flex-wrap gap-4 mb-8 justify-center">
      <button
        className="flex items-center gap-2 bg-green-600 hover:bg-green-800 text-white px-4 py-2 rounded-full shadow transition disabled:opacity-50"
        onClick={() => onSelect("empresa")}
        disabled={!user}
      >
        <FaBuilding /> Nueva Empresa
      </button>

      <button
        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-700 text-white px-4 py-2 rounded-full shadow transition disabled:opacity-50"
        onClick={() => onSelect("campana")}
        disabled={!user}
      >
        <FaBullhorn /> Nueva Campaña
      </button>

      {user ? (
        <button
          className="flex items-center gap-2 bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded-full shadow transition"
          onClick={logout}
        >
          <FaSignOutAlt /> Cerrar Sesión
        </button>
      ) : (
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-800 text-white px-4 py-2 rounded-full shadow transition"
          onClick={login}
        >
          <FaSignInAlt /> Iniciar Sesión
        </button>
      )}
    </nav>
  );
}
