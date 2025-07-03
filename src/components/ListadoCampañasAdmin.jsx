import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function ListadoCampanasAdmin() {
  const [campanas, setCampanas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "campanas"), snap => {
      setCampanas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Listado de Campañas</h2>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
          onClick={() => navigate("/admin/campañas/nueva")}
        >
          Nueva Campaña
        </button>
      </div>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Título</th>
            <th className="border px-2 py-1">Nombre</th>
            <th className="border px-2 py-1">Estado</th>
            <th className="border px-2 py-1">Email proveedor</th>
            <th className="border px-2 py-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {campanas.map(c => (
            <tr key={c.id}>
              <td className="border px-2 py-1">{c.titulo ?? "-"}</td>
              <td className="border px-2 py-1">{c.nombre ?? "-"}</td>
              <td className="border px-2 py-1">{c.estado ?? "-"}</td>
              <td className="border px-2 py-1">{c.email ?? "-"}</td>
              <td className="border px-2 py-1">
                <button
                  className="bg-yellow-400 hover:bg-yellow-500 text-xs px-2 py-1 rounded"
                  onClick={() => navigate(`/admin/campañas/${c.id}/editar-campaña`)}
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}