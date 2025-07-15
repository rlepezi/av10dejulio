import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

// Función para obtener la ruta de imagen/logo
function getImagePath(value) {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  return `/images/${value}`;
}

const ESTADOS = [
  { label: "Todas", value: "todas", color: "bg-gray-100 text-gray-700 border-gray-300" },
  { label: "En revisión", value: "en revisión", color: "bg-orange-200 text-orange-800 border-orange-300" },
  { label: "Activa", value: "activa", color: "bg-green-200 text-green-800 border-green-400" },
  { label: "Finalizada", value: "finalizada", color: "bg-blue-200 text-blue-800 border-blue-400" },
  { label: "Terminada", value: "terminada", color: "bg-gray-300 text-gray-900 border-gray-400" },
  { label: "Pausada", value: "pausada", color: "bg-yellow-200 text-yellow-800 border-yellow-400" }
];

// Función para asignar colores según estado
function colorEstado(estado) {
  if (!estado) return "bg-gray-200 text-gray-700";
  switch ((estado || "").toLowerCase()) {
    case "en revisión":
    case "en revision":
      return "bg-orange-200 text-orange-800";
    case "activa":
      return "bg-green-200 text-green-800";
    case "finalizada":
      return "bg-blue-200 text-blue-800";
    case "terminada":
      return "bg-gray-300 text-gray-900";
    case "pausada":
      return "bg-yellow-200 text-yellow-800";
    case "cancelada":
      return "bg-red-200 text-red-800";
    default:
      return "bg-gray-200 text-gray-700";
  }
}

export default function ListadoCampanasAdmin() {
  const [campanas, setCampanas] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "campanas"), async (snap) => {
      const now = dayjs();
      const updates = [];
      const arr = snap.docs.map(docSnap => {
        const data = docSnap.data();
        const fechaInicio = data.fechaInicio ? dayjs(data.fechaInicio.toDate ? data.fechaInicio.toDate() : data.fechaInicio) : null;
        const fechaFin = data.fechaFin ? dayjs(data.fechaFin.toDate ? data.fechaFin.toDate() : data.fechaFin) : null;
        let dias = "-";
        if (fechaInicio && fechaFin) {
          dias = fechaFin.diff(fechaInicio, "day") + 1;
        }

        // Si la campaña está vencida y no está en estado Terminada, actualizar
        let estado = data.estado;
        if (fechaFin && now.isAfter(fechaFin, "day") && estado !== "Terminada") {
          estado = "Terminada";
          updates.push(updateDoc(doc(db, "campanas", docSnap.id), { estado }));
        }

        return {
          id: docSnap.id,
          ...data,
          fechaInicio,
          fechaFin,
          dias,
          estado,
        };
      });

      // Ejecutar actualizaciones de estado en paralelo si corresponde
      if (updates.length > 0) {
        await Promise.allSettled(updates);
      }

      setCampanas(arr);
    });
    return () => unsub();
  }, []);

  function formatFecha(fecha) {
    if (!fecha) return "-";
    return dayjs(fecha).format("YYYY-MM-DD");
  }

  // Filtrar por estado usando el filtro de botones
  const campanasFiltradas = campanas
    .filter(c =>
      filtroEstado === "todas"
        ? true
        : (c.estado || "").toLowerCase() === filtroEstado
    )
    .sort((a, b) => {
      // Ordenar primero las activas, luego por fechaInicio descendente
      if ((a.estado || "").toLowerCase() === "activa" && (b.estado || "").toLowerCase() !== "activa") return -1;
      if ((b.estado || "").toLowerCase() === "activa" && (a.estado || "").toLowerCase() !== "activa") return 1;
      // Si ambos son activos o ninguno lo es, ordenar por fechaInicio descendente
      if (a.fechaInicio && b.fechaInicio) {
        return dayjs(b.fechaInicio).unix() - dayjs(a.fechaInicio).unix();
      }
      return 0;
    });

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h2 className="text-xl font-bold">Listado de Campañas</h2>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
          onClick={() => navigate("/admin/campañas/nueva")}
        >
          Nueva Campaña
        </button>
      </div>

      {/* Botones de filtro con colores */}
      <div className="flex gap-2 mb-4">
        {ESTADOS.map(est => (
          <button
            key={est.value}
            onClick={() => setFiltroEstado(est.value)}
            className={`
              px-3 py-1 rounded-full text-sm font-semibold border transition
              ${filtroEstado === est.value
                ? `${est.color} border-2`
                : `${est.color.replace("bg-", "bg-opacity-50 bg-")} border`}
            `}
            style={filtroEstado === est.value ? { boxShadow: "0 0 0 2px #2563eb33" } : {}}
          >
            {est.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-2 py-1">#</th>
              <th className="border px-2 py-1">Título</th>
              <th className="border px-2 py-1">Imagen</th>
              <th className="border px-2 py-1">Logo</th>
              <th className="border px-2 py-1">Nombre</th>
              <th className="border px-2 py-1">Estado</th>
              <th className="border px-2 py-1">Email proveedor</th>
              <th className="border px-2 py-1">Fecha Ini</th>
              <th className="border px-2 py-1">Fecha Fin</th>
              <th className="border px-2 py-1">Días</th>
              <th className="border px-2 py-1">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {campanasFiltradas.map((c, idx) => (
              <tr key={c.id}>
                <td className="border px-2 py-1 text-center">{idx + 1}</td>
                <td className="border px-2 py-1">{c.titulo ?? "-"}</td>
                <td className="border px-2 py-1 text-center">
                  {c.imagenURL ? (
                    <img
                      src={getImagePath(c.imagenURL)}
                      alt="Imagen"
                      className="w-20 h-10 object-contain mx-auto border rounded bg-white"
                    />
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="border px-2 py-1 text-center">
                  {c.logoURL ? (
                    <img
                      src={getImagePath(c.logoURL)}
                      alt="Logo"
                      className="w-10 h-10 object-contain mx-auto border rounded bg-white"
                    />
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="border px-2 py-1">{c.nombre ?? "-"}</td>
                <td className="border px-2 py-1">
                  <span className={"px-2 py-1 rounded-full text-xs font-semibold " + colorEstado(c.estado)}>
                    {c.estado || "-"}
                  </span>
                </td>
                <td className="border px-2 py-1">{c.email ?? "-"}</td>
                <td className="border px-2 py-1">{formatFecha(c.fechaInicio)}</td>
                <td className="border px-2 py-1">{formatFecha(c.fechaFin)}</td>
                <td className="border px-2 py-1 text-center">{c.dias}</td>
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
            {campanasFiltradas.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center text-gray-500 py-4">No hay resultados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}