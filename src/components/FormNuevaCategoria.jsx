import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function FormNuevaCategoria({ onFinish }) {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await addDoc(collection(db, "categorias"), {
        nombre: nombre.trim(),
        // Puedes agregar más campos si los necesitas, por ejemplo: descripcion, estado, etc.
      });
      if (onFinish) {
        onFinish();
      } else {
        navigate("/admin/categorias");
      }
    } catch (err) {
      setError("Error al crear la categoría: " + err.message);
    }
    setSaving(false);
  }

  return (
    <form className="max-w-md mx-auto mt-8 p-4 bg-white rounded shadow" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4">Nueva Categoría</h2>
      <div className="mb-2">
        <label className="block font-semibold">Nombre:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
        />
      </div>
      {/* Agrega aquí más campos si tu categoría necesita más atributos */}
      <div className="flex gap-2 mt-4">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          type="submit"
          disabled={saving}
        >
          Crear
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