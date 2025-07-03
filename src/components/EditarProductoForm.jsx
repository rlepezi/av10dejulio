import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function EditarProductoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);

  useEffect(() => {
    // Cargar producto
    async function fetchProducto() {
      const ref = doc(db, "productos", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProducto({ id: snap.id, ...snap.data() });
      } else {
        setError("Producto no encontrado");
      }
      setLoading(false);
    }
    // Cargar categorías y marcas
    async function cargarCategoriasYMarcas() {
      const snapCats = await getDocs(collection(db, "categorias"));
      setCategoriasDisponibles(snapCats.docs.map(doc => doc.data().nombre));
      const snapMarcas = await getDocs(collection(db, "marcas"));
      setMarcasDisponibles(snapMarcas.docs.map(doc => doc.data().nombre));
    }
    fetchProducto();
    cargarCategoriasYMarcas();
  }, [id]);

  // Métodos tipo "pill"
  function toggleCategoria(cat) {
    setProducto(prod => ({
      ...prod,
      categorias: Array.isArray(prod.categorias)
        ? (prod.categorias.includes(cat)
            ? prod.categorias.filter(c => c !== cat)
            : [...prod.categorias, cat]
          )
        : [cat]
    }));
  }

  function toggleMarca(marca) {
    setProducto(prod => ({
      ...prod,
      marcas: Array.isArray(prod.marcas)
        ? (prod.marcas.includes(marca)
            ? prod.marcas.filter(m => m !== marca)
            : [...prod.marcas, marca]
          )
        : [marca]
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateDoc(doc(db, "productos", id), {
        nombre: producto.nombre ?? "",
        descripcion: producto.descripcion ?? "",
        precio: producto.precio ?? 0,
        categorias: producto.categorias || [],
        marcas: producto.marcas || [],
        // agrega más campos según tu estructura, por ejemplo:
        // imagen: producto.imagen ?? "",
        // stock: producto.stock ?? 0,
        // proveedorId: producto.proveedorId ?? "",
        // estado: producto.estado ?? "Activa",
      });
      navigate("/admin/productos");
    } catch (err) {
      setError("Error al guardar cambios: " + err.message);
    }
    setSaving(false);
  }

  if (loading) return <div>Cargando producto...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <form className="max-w-lg mx-auto mt-8 p-4 bg-white rounded shadow" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4">Editar Producto</h2>
      <div className="mb-2">
        <label className="block font-semibold">Nombre:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="text"
          value={producto.nombre || ""}
          onChange={e => setProducto({ ...producto, nombre: e.target.value })}
        />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Descripción:</label>
        <textarea
          className="w-full border px-2 py-1 rounded"
          rows={2}
          value={producto.descripcion || ""}
          onChange={e => setProducto({ ...producto, descripcion: e.target.value })}
        />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Precio:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="number"
          min="0"
          value={producto.precio ?? ""}
          onChange={e => setProducto({ ...producto, precio: e.target.value === "" ? "" : Number(e.target.value) })}
        />
      </div>
      {/* Marcas asociadas */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Marcas asociadas</label>
        <div className="flex flex-wrap gap-2">
          {marcasDisponibles.map((marca, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => toggleMarca(marca)}
              className={`px-3 py-1 rounded-full border text-sm
                ${producto.marcas && producto.marcas.includes(marca)
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700"}
              `}
            >
              {marca}
            </button>
          ))}
        </div>
      </div>
      {/* Categorías asociadas */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Categorías asociadas</label>
        <div className="flex flex-wrap gap-2">
          {categoriasDisponibles.map((cat, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => toggleCategoria(cat)}
              className={`px-3 py-1 rounded-full border text-sm
                ${producto.categorias && producto.categorias.includes(cat)
                  ? "bg-green-600 text-white"
                  : "bg-green-100 text-green-800"}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      {/* Agrega aquí más campos si tu producto tiene más atributos */}
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
          onClick={() => navigate("/admin/productos")}
        >
          Cancelar
        </button>
      </div>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </form>
  );
}