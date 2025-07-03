import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function EditarCategoriaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCategoria() {
      const ref = doc(db, "categorias", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setCategoria({ id: snap.id, ...snap.data() });
      } else {
        setError("Categoría no encontrada");
      }
      setLoading(false);
    }
    fetchCategoria();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateDoc(doc(db, "categorias", id), {
        nombre: categoria.nombre ?? "",
        // Agrega aquí más campos si tu categoría tiene más atributos
      });
      navigate("/admin/categorias");
    } catch (err) {
      setError("Error al guardar cambios: " + err.message);
    }
    setSaving(false);
  }

  if (loading) return <div>Cargando categoría...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <form className="max-w-md mx-auto mt-8 p-4 bg-white rounded shadow" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4">Editar Categoría</h2>
      <div className="mb-2">
        <label className="block font-semibold">Nombre:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="text"
          value={categoria.nombre || ""}
          onChange={e => setCategoria({ ...categoria, nombre: e.target.value })}
        />
      </div>
      {/* Agrega aquí más campos si tu categoría tiene más atributos */}
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
          onClick={() => navigate("/admin/categorias")}
        >
          Cancelar
        </button>
      </div>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </form>
  );
}