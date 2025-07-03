import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy } from "firebase/firestore";
import { useAuth } from "./AuthProvider";

export default function Notificaciones() {
  const { user } = useAuth();
  const [notis, setNotis] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notificaciones"),
      where("paraUid", "==", user.uid),
      orderBy("fecha", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setNotis(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  async function marcarLeida(id) {
    await updateDoc(doc(db, "notificaciones", id), { leida: true });
  }

  if (!user || notis.length === 0) return null;

  return (
    <div className="mb-4">
      <h2 className="font-semibold text-gray-700 mb-2">Notificaciones</h2>
      <ul>
        {notis.map(n => (
          <li key={n.id} className={`mb-1 ${n.leida ? "text-gray-400" : "font-semibold"}`}>
            <span>{n.titulo} - {n.mensaje}</span>
            {!n.leida && (
              <button className="ml-2 text-blue-700 underline" onClick={() => marcarLeida(n.id)}>
                Marcar como leída
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}