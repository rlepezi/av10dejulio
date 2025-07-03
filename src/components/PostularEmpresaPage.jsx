import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const regiones = [
  "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso",
  "Metropolitana", "O'Higgins", "Maule", "Ñuble", "Biobío", "La Araucanía",
  "Los Ríos", "Los Lagos", "Aysén", "Magallanes"
];

export default function PostularEmpresaPage() {
  const [data, setData] = useState({
    nombre: "",
    rut: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    region: "",
    descripcion: "",
    categorias: [],
    marcas: [],
    web: "",
    representante_nombre: "",
    representante_email: "",
    representante_telefono: "",
  });
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");
  const [aceptaCondiciones, setAceptaCondiciones] = useState(false);
  const [condicionesError, setCondicionesError] = useState("");
  const navigate = useNavigate();

  // Cargar categorías y marcas desde Firestore
  useEffect(() => {
    async function cargarCategorias() {
      const snap = await getDocs(collection(db, "categorias"));
      setCategoriasDisponibles(snap.docs.map(doc => doc.data().nombre));
    }
    async function cargarMarcas() {
      const snap = await getDocs(collection(db, "marcas"));
      setMarcasDisponibles(snap.docs.map(doc => doc.data().nombre));
    }
    cargarCategorias();
    cargarMarcas();
  }, []);

  // pill buttons para marcas y categorías
  function toggleCategoria(cat) {
    setData(d => ({
      ...d,
      categorias: d.categorias.includes(cat)
        ? d.categorias.filter(c => c !== cat)
        : [...d.categorias, cat]
    }));
  }
  function toggleMarca(marca) {
    setData(d => ({
      ...d,
      marcas: d.marcas.includes(marca)
        ? d.marcas.filter(m => m !== marca)
        : [...d.marcas, marca]
    }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setData(d => ({ ...d, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setCondicionesError("");
    setError("");
    setExito(false);

    if (!aceptaCondiciones) {
      setCondicionesError("Debes aceptar las condiciones para continuar.");
      return;
    }

    setEnviando(true);
    try {
      await addDoc(collection(db, "empresas"), {
        nombre: data.nombre,
        rut: data.rut,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        ciudad: data.ciudad,
        region: data.region,
        descripcion: data.descripcion,
        categorias: data.categorias,
        marcas: data.marcas,
        web: data.web,
        estado: "Enviado",
        fecha_postulacion: serverTimestamp(),
        representante: {
          nombre: data.representante_nombre,
          email: data.representante_email,
          telefono: data.representante_telefono
        },
        origen: "solicitud"
      });
      setExito(true);
      setData({
        nombre: "",
        rut: "",
        email: "",
        telefono: "",
        direccion: "",
        ciudad: "",
        region: "",
        descripcion: "",
        categorias: [],
        marcas: [],
        web: "",
        representante_nombre: "",
        representante_email: "",
        representante_telefono: "",
      });
      setAceptaCondiciones(false);
      setTimeout(() => {
        navigate("/proveedores");
      }, 3000);
    } catch (err) {
      setError("Error al enviar la solicitud. Intenta de nuevo.");
    }
    setEnviando(false);
  }

  if (exito) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow text-center max-w-md">
          <h2 className="text-2xl font-bold text-green-700 mb-2">¡Solicitud enviada!</h2>
          <p className="mb-4">
            Hemos recibido tu postulación y nos pondremos en contacto contigo pronto.<br />
            Serás redirigido automáticamente a la página de información para proveedores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4 text-center">Postula tu empresa</h2>
        {error && <div className="text-red-500 mb-2">{error}</div>}

        <input name="nombre" value={data.nombre} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Nombre de la empresa" required />
        <input name="rut" value={data.rut} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="RUT" required />
        <input name="email" value={data.email} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Correo de contacto" type="email" required />
        <input name="telefono" value={data.telefono} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Teléfono" type="tel" required />
        <input name="direccion" value={data.direccion} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Dirección" />
        <input name="ciudad" value={data.ciudad} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Ciudad" />
        <select name="region" value={data.region} onChange={handleChange} className="mb-2 w-full border p-2 rounded" required>
          <option value="">Selecciona región</option>
          {regiones.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <textarea name="descripcion" value={data.descripcion} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Breve descripción" rows={2} />

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
                  ${data.marcas.includes(marca)
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
                  ${data.categorias.includes(cat)
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-800"}
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <input name="web" value={data.web} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Sitio web (opcional)" />
        {/* Representante */}
        <h3 className="font-semibold mt-4 mb-2">Datos del representante legal</h3>
        <input name="representante_nombre" value={data.representante_nombre} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Nombre representante" required />
        <input name="representante_email" value={data.representante_email} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Email representante" type="email" required />
        <input name="representante_telefono" value={data.representante_telefono} onChange={handleChange} className="mb-4 w-full border p-2 rounded" placeholder="Teléfono representante" required />

        {/* Check de condiciones */}
        <div className="mb-4 flex items-center">
          <input
            id="condiciones"
            type="checkbox"
            checked={aceptaCondiciones}
            onChange={e => setAceptaCondiciones(e.target.checked)}
            className="mr-2"
            required
          />
          <label htmlFor="condiciones" className="text-sm">
            Acepto las <a href="/condiciones" target="_blank" className="underline text-blue-600">condiciones</a> del servicio <span className="text-red-600">*</span>
          </label>
        </div>
        {condicionesError && <div className="text-red-500 mb-2">{condicionesError}</div>}

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar solicitud"}
        </button>
      </form>
    </div>
  );
}