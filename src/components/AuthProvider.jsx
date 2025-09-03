import React, { useEffect, useState, createContext, useContext } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";

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
          
          // Buscar en la colección usuarios por UID
          let docSnap = await getDoc(doc(db, "usuarios", firebaseUser.uid));
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log("✅ Usuario encontrado en usuarios por UID:", userData);
            setRol(userData.rol);
          } else {
            console.log("❌ Usuario no encontrado en usuarios por UID, buscando por email...");
            
            // Buscar por email en la colección usuarios
            const usuariosQuery = query(
              collection(db, "usuarios"),
              where("email", "==", firebaseUser.email),
              limit(1)
            );
            const usuariosSnapshot = await getDocs(usuariosQuery);
            
            if (!usuariosSnapshot.empty) {
              const userDoc = usuariosSnapshot.docs[0];
              const userData = userDoc.data();
              console.log("✅ Usuario encontrado en usuarios por email:", userData);
              console.log("⚠️ UID en Firestore:", userDoc.id, "vs UID de Auth:", firebaseUser.uid);
              setRol(userData.rol);
            } else {
              console.log("❌ Usuario no encontrado en usuarios por email ni UID");
              setRol(null);
            }
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