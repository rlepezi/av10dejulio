import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function EditarMarcaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [marca, setMarca] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMarca() {
      const ref = doc(db, "marcas", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setMarca({ id: snap.id, ...snap.data() });
      } else {
        setError("Marca no encontrada");
      }
      setLoading(false);
    }
    fetchMarca();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateDoc(doc(db, "marcas", id), {
        nombre: marca.nombre ?? "",
        // Agrega aquí más campos si tu marca tiene más atributos
      });
      navigate("/admin/marcas");
    } catch (err) {
      setError("Error al guardar cambios: " + err.message);
    }
    setSaving(false);
  }

  if (loading) return <div>Cargando marca...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <form className="max-w-md mx-auto mt-8 p-4 bg-white rounded shadow" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4">Editar Marca</h2>
      <div className="mb-2">
        <label className="block font-semibold">Nombre:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="text"
          value={marca.nombre || ""}
          onChange={e => setMarca({ ...marca, nombre: e.target.value })}
        />
      </div>
      {/* Agrega aquí más campos si tu marca tiene más atributos */}
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
          onClick={() => navigate("/admin/marcas")}
        >
          Cancelar
        </button>
      </div>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </form>
  );
}