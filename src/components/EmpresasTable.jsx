import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Link } from "react-router-dom";

function colorEstado(estado) {
  if (!estado) return "bg-gray-200 text-gray-700";
  switch (estado.toLowerCase()) {
    case "enviado":
      return "bg-yellow-200 text-yellow-800";
    case "activo":
    case "activa":
    case "aprobada":
      return "bg-green-100 text-green-700";
    case "revision":
      return "bg-orange-200 text-orange-800";
    case "cancelado":
      return "bg-red-200 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

const ESTADOS = [
  { label: "Todos", value: "todos" },
  { label: "Enviado", value: "enviado" },
  { label: "Activa", value: "activa" },
  { label: "Revision", value: "revision" },
  { label: "Cancelado", value: "cancelado" }
];

export default function EmpresasTable() {
  const [empresas, setEmpresas] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  useEffect(() => {
    async function fetchEmpresas() {
      const q = query(collection(db, "empresas"), orderBy("fecha_postulacion", "desc"));
      const snap = await getDocs(q);
      setEmpresas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchEmpresas();
  }, []);

  // Filtro por estado
  const empresasFiltradas = empresas.filter(emp =>
    filtroEstado === "todos"
      ? true
      : (emp.estado || "").toLowerCase() === filtroEstado
  );

  return (
    <div className="bg-white rounded shadow p-6">
      <h3 className="text-lg font-bold mb-3">Empresas registradas</h3>

      {/* Botones de filtro */}
      <div className="flex gap-2 mb-4">
        {ESTADOS.map(est => (
          <button
            key={est.value}
            onClick={() => setFiltroEstado(est.value)}
            className={`px-3 py-1 rounded-full text-sm font-semibold border
              ${filtroEstado === est.value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-100 text-gray-700 border-gray-300"}
            `}
          >
            {est.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="border-b p-2">#</th>
              <th className="border-b p-2">Nombre</th>
              <th className="border-b p-2">Mail</th>
              <th className="border-b p-2">Web</th>
              <th className="border-b p-2">Estado</th>
              <th className="border-b p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empresasFiltradas.map((emp, idx) => (
              <tr key={emp.id} className="hover:bg-blue-50">
                <td className="p-2 text-center">{idx + 1}</td>
                <td className="p-2">{emp.nombre}</td>
                <td className="p-2">{emp.email}</td>
                <td className="p-2">
  {emp.web ? (
    <a
      href={emp.web.startsWith("http") ? emp.web : `https://${emp.web}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-700 underline"
    >
      {emp.web}
    </a>
  ) : (
    "-"
  )}
</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${colorEstado(emp.estado)}`}>
                    {emp.estado || "-"}
                  </span>
                </td>
                <td className="p-2">
                  <Link to={`/admin/editar-empresa/${emp.id}`} className="text-blue-700 underline text-sm">Editar</Link>
                </td>
              </tr>
            ))}
            {empresasFiltradas.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-4">No hay resultados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}