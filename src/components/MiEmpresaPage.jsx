import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { useAuth } from "./AuthProvider";

export default function MiEmpresaPage() {
  const { user } = useAuth();
  const [empresa, setEmpresa] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);

  useEffect(() => {
    async function fetchData() {
      // Carga empresa del usuario
      const userDoc = await getDoc(doc(db, "usuarios", user.uid));
      const empId = userDoc.data().empresaId;
      const empDoc = await getDoc(doc(db, "empresas", empId));
      setEmpresa({ id: empDoc.id, ...empDoc.data() });
      setForm(empDoc.data());

      // Carga categorías y marcas disponibles
      const catSnap = await getDocs(collection(db, "categorias"));
      setCategoriasDisponibles(catSnap.docs.map(doc => doc.data().nombre));
      const marcasSnap = await getDocs(collection(db, "marcas"));
      setMarcasDisponibles(marcasSnap.docs.map(doc => doc.data().nombre));
    }
    fetchData();
  }, [user]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  // Manejo de chips de categorías
  function toggleCategoria(cat) {
    setForm(f => ({
      ...f,
      categorias: Array.isArray(f.categorias)
        ? (f.categorias.includes(cat)
          ? f.categorias.filter(c => c !== cat)
          : [...f.categorias, cat])
        : [cat]
    }));
  }
  // Manejo de chips de marcas
  function toggleMarca(marca) {
    setForm(f => ({
      ...f,
      marcas: Array.isArray(f.marcas)
        ? (f.marcas.includes(marca)
          ? f.marcas.filter(c => c !== marca)
          : [...f.marcas, marca])
        : [marca]
    }));
  }

  async function handleUpdate(e) {
    e.preventDefault();
    await updateDoc(doc(db, "empresas", empresa.id), {
      ...form,
      // Si accidentalmente es string, lo convertimos a array:
      categorias: typeof form.categorias === 'string'
        ? form.categorias.split(",").map(x => x.trim()).filter(Boolean)
        : form.categorias || [],
      marcas: typeof form.marcas === 'string'
        ? form.marcas.split(",").map(x => x.trim()).filter(Boolean)
        : form.marcas || [],
    });
    setEmpresa({ ...empresa, ...form });
    setMsg("Datos actualizados con éxito");
    setTimeout(() => setMsg(""), 3000);
  }

  if (!empresa) return <div>Cargando...</div>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Editar Información Proveedor</h2>
      {msg && <div className="text-green-600 mb-2">{msg}</div>}
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Nombre</label>
          <input name="nombre" value={form.nombre || ""} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Dirección</label>
          <input name="direccion" value={form.direccion || ""} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Web</label>
          <input name="web" value={form.web || ""} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Teléfono</label>
          <input name="telefono" value={form.telefono || ""} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Email</label>
          <input name="email" value={form.email || ""} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        {/* Categorías */}
        <div>
          <label className="block font-semibold mb-1">Categorías</label>
          <div className="flex flex-wrap gap-2">
            {categoriasDisponibles.map((cat, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => toggleCategoria(cat)}
                className={`px-3 py-1 rounded-full border text-sm
                  ${Array.isArray(form.categorias) && form.categorias.includes(cat)
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-800"}
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        {/* Marcas */}
        <div>
          <label className="block font-semibold mb-1">Marcas</label>
          <div className="flex flex-wrap gap-2">
            {marcasDisponibles.map((marca, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => toggleMarca(marca)}
                className={`px-3 py-1 rounded-full border text-sm
                  ${Array.isArray(form.marcas) && form.marcas.includes(marca)
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700"}
                `}
              >
                {marca}
              </button>
            ))}
          </div>
        </div>
       <div className="flex gap-2 mt-4">
  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Guardar</button>
  <button
    type="button"
    onClick={() => window.history.back()}
    className="bg-gray-400 text-white px-4 py-2 rounded"
  >
    Cancelar
  </button>
</div>
        
      </form>
    </div>
  );
}