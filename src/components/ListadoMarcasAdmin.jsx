import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function ListadoMarcasAdmin() {
  const [marcas, setMarcas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "marcas"), (snap) => {
      setMarcas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Listado de Marcas</h2>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Nombre</th>
            <th className="border px-2 py-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {marcas.map((m) => (
            <tr key={m.id}>
              <td className="border px-2 py-1">{m.nombre ?? "-"}</td>
              <td className="border px-2 py-1">
                <button
                  className="bg-yellow-400 hover:bg-yellow-500 text-xs px-2 py-1 rounded"
                  onClick={() => navigate(`/admin/marcas/${m.id}/editar`)}
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