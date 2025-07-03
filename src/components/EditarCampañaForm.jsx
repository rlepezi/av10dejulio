import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function EditarCampanaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campana, setCampana] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCampana() {
      const ref = doc(db, "campanas", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setCampana({ id: snap.id, ...snap.data() });
      } else {
        setError("Campaña no encontrada");
      }
      setLoading(false);
    }
    fetchCampana();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateDoc(doc(db, "campanas", id), {
        titulo: campana.titulo,
        descripcion: campana.descripcion,
        estado: campana.estado,
        fechaFin: campana.fechaFin,
        // Agrega aquí más campos si tu campaña tiene más información
      });
      navigate("/admin/campañas");
    } catch (err) {
      setError("Error al guardar cambios");
    }
    setSaving(false);
  }

  if (loading) return <div>Cargando campaña...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <form className="max-w-md mx-auto mt-8 p-4 bg-white rounded shadow" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4">Editar Campaña</h2>
      <div className="mb-2">
        <label className="block font-semibold">Título:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="text"
          value={campana.titulo || ""}
          onChange={e => setCampana({ ...campana, titulo: e.target.value })}
        />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Descripción:</label>
        <textarea
          className="w-full border px-2 py-1 rounded"
          value={campana.descripcion || ""}
          onChange={e => setCampana({ ...campana, descripcion: e.target.value })}
        />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Estado:</label>
        <select
          className="w-full border px-2 py-1 rounded"
          value={campana.estado || ""}
          onChange={e => setCampana({ ...campana, estado: e.target.value })}
        >
          <option value="">Selecciona estado</option>
          <option value="Activa">Activa</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Rechazada">Rechazada</option>
          {/* Agrega más estados si es necesario */}
        </select>
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Fecha Fin:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="date"
          value={campana.fechaFin ? (
            typeof campana.fechaFin === "string"
              ? campana.fechaFin
              : new Date(campana.fechaFin.seconds * 1000).toISOString().substr(0, 10)
          ) : ""}
          onChange={e => setCampana({ ...campana, fechaFin: e.target.value })}
        />
      </div>
      {/* Agrega aquí más campos según tu modelo de campaña */}
      <div className="flex gap-2 mt-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          type="submit"
          disabled={saving}
        >
          Guardar
        </button>
        <button
          type="button"
          className="bg-gray-400 text-white px-4 py-2 rounded"
          onClick={() => navigate("/admin/campañas")}
        >
          Cancelar
        </button>
      </div>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </form>
  );
}