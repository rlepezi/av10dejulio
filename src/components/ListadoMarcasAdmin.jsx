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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Listado de Marcas</h2>
        <button
          className="bg-green-700 hover:bg-green-800 text-white text-sm px-4 py-2 rounded shadow"
          onClick={() => navigate("/admin/marcas/nueva")}
        >
          Ingresar Marca
        </button>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow border border-blue-100">
        <table className="min-w-full divide-y divide-blue-100">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase">Logo</th>
              <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase">Nombre</th>
              <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {marcas.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-lg text-gray-500">
                  No hay marcas registradas.
                </td>
              </tr>
            ) : (
              marcas.map((m) => (
                <tr key={m.id} className="hover:bg-blue-50 transition">
                  <td className="py-2 px-3 align-middle">
                    {m.logo ? (
                      <img
                        src={m.logo}
                        alt="Logo Marca"
                        className="h-12 w-12 object-contain rounded shadow border bg-white"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xl">
                        <span role="img" aria-label="Sin logo">🏷️</span>
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-3 align-middle font-semibold text-blue-900 text-base">
                    {m.nombre ?? "-"}
                  </td>
                  <td className="py-2 px-3 align-middle">
                    <button
                      className="bg-yellow-400 hover:bg-yellow-500 text-xs px-3 py-1 rounded mr-2"
                      onClick={() => navigate(`/admin/marcas/${m.id}/editar`)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}