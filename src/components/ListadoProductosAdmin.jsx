import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Función para asignar colores según estado
function colorEstado(estado) {
  if (!estado) return "bg-gray-200 text-gray-700";
  switch (estado.toLowerCase()) {
    case "activo":
      return "bg-green-200 text-green-800";
    case "inactivo":
      return "bg-red-200 text-red-800";
    case "pendiente":
      return "bg-yellow-200 text-yellow-800";
    case "agotado":
      return "bg-orange-200 text-orange-800";
    default:
      return "bg-gray-200 text-gray-700";
  }
}

export default function ListadoProductosAdmin() {
  const [productos, setProductos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "productos"), (snap) => {
      setProductos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="p-4">
      {/* Encabezado y botón para ingresar producto */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Listado de Productos</h2>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow"
          onClick={() => navigate("/admin/nuevo-producto")}
        >
          Ingresar producto
        </button>
      </div>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Título</th>
            <th className="border px-2 py-1">Categoría</th>
            <th className="border px-2 py-1">Precio</th>
            <th className="border px-2 py-1">Estado</th>
            <th className="border px-2 py-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id}>
              <td className="border px-2 py-1">{p.titulo ?? "-"}</td>
              <td className="border px-2 py-1">
                {Array.isArray(p.categorias) ? p.categorias.join(", ") : p.categoria ?? "-"}
              </td>
              <td className="border px-2 py-1">
                {p.precio !== undefined ? `$${p.precio}` : "-"}
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
                  onClick={() => navigate(`/admin/editar-producto/${p.id}`)}
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