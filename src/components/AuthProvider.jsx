import React, { useEffect, useState, createContext, useContext } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log("Usuario logueado:", firebaseUser.email, "UID:", firebaseUser.uid);
          
          const docSnap = await getDoc(doc(db, "usuarios", firebaseUser.uid));
          if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log("Datos del usuario desde Firestore:", userData);
            setRol(userData.rol);
          } else {
            console.log("No se encontró documento del usuario en Firestore");
            setRol(null);
          }
          setUser(firebaseUser);
        } else {
          console.log("Usuario no logueado");
          setUser(null);
          setRol(null);
        }
      } catch (err) {
        console.error("Error en AuthProvider:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, rol, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}