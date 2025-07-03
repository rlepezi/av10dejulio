import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";

export default function EditarProductoPage() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProducto() {
      const snap = await getDoc(doc(db, "productos", id));
      setForm(snap.data());
    }
    fetchProducto();
  }, [id]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleUpdate(e) {
    e.preventDefault();
    await updateDoc(doc(db, "productos", id), form);
    setMsg("¡Guardado!");
    setTimeout(() => navigate(-1), 1500); // Regresa a la pantalla anterior
  }

  if (!form) return <div>Cargando...</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Editar producto</h2>
      {msg && <div className="text-green-600 mb-2">{msg}</div>}
      <form onSubmit={handleUpdate}>
        <div className="mb-2">
          <label className="block font-semibold mb-1">Título</label>
          <input
            name="titulo"
            value={form.titulo || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div className="mb-2">
          <label className="block font-semibold mb-1">Marcas</label>
          <input
            name="marcas"
            value={Array.isArray(form.marcas) ? form.marcas.join(", ") : (form.marcas || "")}
            onChange={e =>
              setForm(f => ({
                ...f,
                marcas: e.target.value.split(",").map(m => m.trim()).filter(Boolean),
              }))
            }
            className="w-full border p-2 rounded"
            placeholder="Ej: Marca1, Marca2"
          />
        </div>
        <div className="mb-2">
          <label className="block font-semibold mb-1">Categorías</label>
          <input
            name="categorias"
            value={Array.isArray(form.categorias) ? form.categorias.join(", ") : (form.categorias || "")}
            onChange={e =>
              setForm(f => ({
                ...f,
                categorias: e.target.value.split(",").map(c => c.trim()).filter(Boolean),
              }))
            }
            className="w-full border p-2 rounded"
            placeholder="Ej: Categoría1, Categoría2"
          />
        </div>
        <div className="mb-2">
          <label className="block font-semibold mb-1">Precio</label>
          <input
            name="precio"
            type="number"
            value={form.precio ?? ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            min="0"
            required
          />
        </div>
        <div className="mb-2">
          <label className="block font-semibold mb-1">Imagen URL</label>
          <input
            name="imagenUrl"
            value={form.imagenUrl || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="https://..."
          />
        </div>
        <div className="mb-2">
          <label className="block font-semibold mb-1">URL del producto</label>
          <input
            name="urlProducto"
            value={form.urlProducto || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="https://..."
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Estado</label>
          <select
            name="estado"
            value={form.estado || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Seleccione estado</option>
            <option value="Enviado">Enviado</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Agotado">Agotado</option>
          </select>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">
          Guardar
        </button>
      </form>
    </div>
  );
}