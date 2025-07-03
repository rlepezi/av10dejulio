import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function colorEstado(estado) {
  if (!estado) return "bg-gray-200 text-gray-700";
  switch (estado.toLowerCase()) {
    case "enviado":
      return "bg-yellow-200 text-yellow-800";
    case "activo":
    case "activa":
      return "bg-green-200 text-green-800";
    case "revision":
    case "en revisión":
    case "en revision":
      return "bg-orange-200 text-orange-800";
    case "cancelado":
      return "bg-red-200 text-red-800";
    default:
      return "bg-gray-200 text-gray-700";
  }
}

export default function ListadoProveedoresAdmin() {
  const [proveedores, setProveedores] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "empresas"), orderBy("fecha_postulacion", "desc"));
    const unsub = onSnapshot(q, snap => {
      setProveedores(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Listado de Proveedores</h2>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">#</th>
            <th className="border px-2 py-1">Nombre</th>
            <th className="border px-2 py-1">Email</th>
            <th className="border px-2 py-1">Web</th>
            <th className="border px-2 py-1">Estado</th>
            <th className="border px-2 py-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {proveedores.map((p, idx) => (
            <tr key={p.id}>
              <td className="border px-2 py-1 text-center">{idx + 1}</td>
              <td className="border px-2 py-1">{p.nombre ?? "-"}</td>
              <td className="border px-2 py-1">{p.email ?? "-"}</td>
              <td className="border px-2 py-1">
                {p.web ? (
                  <a
                    href={p.web.startsWith("http") ? p.web : `https://${p.web}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 underline"
                  >
                    {p.web}
                  </a>
                ) : (
                  "-"
                )}
              </td>
              <td className="border px-2 py-1">
                <span
                  className={
                    "px-2 py-1 rounded-full text-xs font-semibold " +
                    colorEstado(p.estado)
                  }
                >
                  {p.estado || "-"}
                </span>
              </td>
              <td className="border px-2 py-1">
                <button
                  className="bg-yellow-400 hover:bg-yellow-500 text-xs px-2 py-1 rounded"
                  onClick={() => navigate(`/admin/editar-empresa/${p.id}`)}
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