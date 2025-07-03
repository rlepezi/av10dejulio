import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, onSnapshot } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";

export default function EditarCampanaPage() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [categoriasOptions, setCategoriasOptions] = useState([]);
  const [marcasOptions, setMarcasOptions] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCampana() {
      const snap = await getDoc(doc(db, "campanas", id));
      setForm({ ...snap.data(), categorias: snap.data().categorias || [], marcas: snap.data().marcas || [] });
      setLoading(false);
    }
    fetchCampana();
  }, [id]);

  useEffect(() => {
    const unsubCategorias = onSnapshot(collection(db, "categorias"), snap => {
      setCategoriasOptions(snap.docs.map(doc =>
        doc.data().nombre || doc.id
      ));
    });
    const unsubMarcas = onSnapshot(collection(db, "marcas"), snap => {
      setMarcasOptions(snap.docs.map(doc =>
        doc.data().nombre || doc.id
      ));
    });
    return () => {
      unsubCategorias();
      unsubMarcas();
    };
  }, []);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleArrayChange(value, arrName) {
    setForm(f => ({
      ...f,
      [arrName]: f[arrName].includes(value)
        ? f[arrName].filter(x => x !== value)
        : [...f[arrName], value]
    }));
  }

  function handleEstadoChange(e) {
    setForm(f => ({ ...f, estado: e.target.value }));
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setSaving(true);
    await updateDoc(doc(db, "campanas", id), form);
    setMsg("¡Guardado!");
    setTimeout(() => navigate("/admin/campañas"), 1500);
  }

  if (loading || !form) return <div className="p-4">Cargando...</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Editar Campaña</h2>
      {msg && <div className="text-green-600 mb-2">{msg}</div>}
      <form onSubmit={handleUpdate} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block mb-1 font-semibold">Título *</label>
          <input className="w-full border px-2 py-1 rounded" name="titulo" value={form.titulo || ""} onChange={handleChange} required />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Descripción *</label>
          <textarea className="w-full border px-2 py-1 rounded" name="descripcion" value={form.descripcion || ""} onChange={handleChange} required />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Logo (URL)</label>
          <input className="w-full border px-2 py-1 rounded" name="logoURL" value={form.logoURL || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Imagen (URL)</label>
          <input className="w-full border px-2 py-1 rounded" name="imagenURL" value={form.imagenURL || ""} onChange={handleChange} />
        </div>
        {/* Categorías como tags/botón */}
        <div>
          <label className="block mb-1 font-semibold">Categorías</label>
          <div className="flex flex-wrap gap-2">
            {categoriasOptions.map((cat, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => handleArrayChange(cat, "categorias")}
                className={`px-3 py-1 rounded-full border text-sm transition ${
                  form.categorias && form.categorias.includes(cat)
                    ? "bg-green-600 text-white border-green-700"
                    : "bg-gray-100 text-gray-700 border-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        {/* Marcas como tags/botón */}
        <div>
          <label className="block mb-1 font-semibold">Marcas asociadas</label>
          <div className="flex flex-wrap gap-2">
            {marcasOptions.map((marca, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => handleArrayChange(marca, "marcas")}
                className={`px-3 py-1 rounded-full border text-sm transition ${
                  form.marcas && form.marcas.includes(marca)
                    ? "bg-indigo-600 text-white border-indigo-700"
                    : "bg-gray-100 text-gray-700 border-gray-300"
                }`}
              >
                {marca}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block mb-1 font-semibold">Fecha inicio</label>
          <input
            className="w-full border px-2 py-1 rounded"
            name="fechaInicio"
            type="datetime-local"
            value={
              form.fechaInicio
                ? (form.fechaInicio.seconds
                    ? new Date(form.fechaInicio.seconds * 1000)
                    : new Date(form.fechaInicio)
                  ).toISOString().slice(0, 16)
                : ""
            }
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Fecha fin</label>
          <input
            className="w-full border px-2 py-1 rounded"
            name="fechaFin"
            type="datetime-local"
            value={
              form.fechaFin
                ? (form.fechaFin.seconds
                    ? new Date(form.fechaFin.seconds * 1000)
                    : new Date(form.fechaFin)
                  ).toISOString().slice(0, 16)
                : ""
            }
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Link</label>
          <input className="w-full border px-2 py-1 rounded" name="link" value={form.link || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Email proveedor</label>
          <input className="w-full border px-2 py-1 rounded" name="email" type="email" value={form.email || ""} onChange={handleChange} />
        </div>
        {/* Estado de campaña */}
        <div>
          <label className="block mb-1 font-semibold">Estado de campaña</label>
          <select className="w-full border px-2 py-1 rounded" name="estado" value={form.estado || ""} onChange={handleEstadoChange}>
            <option value="en revision">En revisión</option>
            <option value="Activa">Activa</option>
            <option value="Finalizada">Finalizada</option>
            <option value="Pausada">Pausada</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" disabled={saving}>
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>
    </div>
  );
}