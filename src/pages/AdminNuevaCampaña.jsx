import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, addDoc, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
// Si usas react-icons, puedes descomentar la siguiente línea
// import { FaTags } from "react-icons/fa";

export default function AdminNuevaCampaña() {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [logoURL, setLogoURL] = useState("");
  const [imagenURL, setImagenURL] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [categoriasOptions, setCategoriasOptions] = useState([]);
  const [marcasOptions, setMarcasOptions] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [link, setLink] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Cargar categorías desde Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categorias"), snap => {
      setCategoriasOptions(snap.docs.map(doc =>
        doc.data().nombre || doc.id
      ));
    });
    return () => unsub();
  }, []);

  // Cargar marcas desde Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "marcas"), snap => {
      setMarcasOptions(snap.docs.map(doc =>
        doc.data().nombre || doc.id
      ));
    });
    return () => unsub();
  }, []);

  const toTimestamp = (value) => value ? Timestamp.fromDate(new Date(value)) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!titulo || !descripcion) {
      setError("Completa todos los campos obligatorios");
      return;
    }
    setLoading(true);
    try {
      const data = {
        titulo,
        descripcion,
        logoURL,
        imagenURL,
        categorias,
        marcas,
        fechaInicio: toTimestamp(fechaInicio),
        fechaFin: toTimestamp(fechaFin),
        fecha_creacion: Timestamp.now(),
        link,
        email,
        estado: "en revision",
        origen: "admin",
      };
      const docRef = await addDoc(collection(db, "campanas"), data);
      navigate(`/admin/campañas/${docRef.id}/editar`);
    } catch (err) {
      setError("Error al guardar la campaña");
      setLoading(false);
    }
  };

  // Para tags tipo botón
  const handleArrayChange = (value, arr, setArr) => {
    if (arr.includes(value)) setArr(arr.filter(x => x !== value));
    else setArr([...arr, value]);
  };
  const toggleCategoria = (cat) => handleArrayChange(cat, categorias, setCategorias);
  const toggleMarca = (marca) => handleArrayChange(marca, marcas, setMarcas);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Nueva Campaña (Admin)</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block mb-1 font-semibold">Título *</label>
          <input className="w-full border px-2 py-1 rounded" value={titulo} onChange={e => setTitulo(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Descripción *</label>
          <textarea className="w-full border px-2 py-1 rounded" value={descripcion} onChange={e => setDescripcion(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Logo (URL)</label>
          <input className="w-full border px-2 py-1 rounded" value={logoURL} onChange={e => setLogoURL(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Imagen (URL)</label>
          <input className="w-full border px-2 py-1 rounded" value={imagenURL} onChange={e => setImagenURL(e.target.value)} />
        </div>
        {/* Categorías como tags/botón */}
        <div>
          <label className="block mb-1 font-semibold flex items-center gap-2">
            {/* <FaTags /> */}
            Categorías
          </label>
          <div className="flex flex-wrap gap-2">
            {categoriasOptions.map((cat, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => toggleCategoria(cat)}
                className={`px-3 py-1 rounded-full border text-sm transition ${
                  categorias.includes(cat)
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
          <label className="block mb-1 font-semibold flex items-center gap-2">
            {/* <FaTags /> */}
            Marcas asociadas
          </label>
          <div className="flex flex-wrap gap-2">
            {marcasOptions.map((marca, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => toggleMarca(marca)}
                className={`px-3 py-1 rounded-full border text-sm transition ${
                  marcas.includes(marca)
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
          <input className="w-full border px-2 py-1 rounded" type="datetime-local" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Fecha fin</label>
          <input className="w-full border px-2 py-1 rounded" type="datetime-local" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Link</label>
          <input className="w-full border px-2 py-1 rounded" value={link} onChange={e => setLink(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Email proveedor</label>
          <input className="w-full border px-2 py-1 rounded" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        {error && <div className="text-red-500">{error}</div>}
        <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Campaña"}
        </button>
      </form>
    </div>
  );
}