import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";

// Importar utilidades de estandarización
import { 
  CAMPOS_EMPRESA, 
  CAMPOS_REPRESENTANTE, 
  ESTADOS_EMPRESA,
  createEmpresaTemplate,
  normalizeEmpresaData,
  validateEmpresaData
} from '../utils/empresaStandards';

const regiones = [
  "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso",
  "Metropolitana", "O'Higgins", "Maule", "Ñuble", "Biobío", "La Araucanía",
  "Los Ríos", "Los Lagos", "Aysén", "Magallanes"
];

export default function FormNuevaEmpresa() {
  const { user } = useAuth();
  const [data, setData] = useState({
    nombre: "",
    direccion: "",
    horario: "",
    web: "",
    telefono: "",
    email: "",
    calificacion: "",
    categorias: [],
    marcas: [],
    // Opcionales:
    rut: "",
    ciudad: "Santiago",
    region: "Metropolitana",
    descripcion: "",
    representante_nombre: "",
    representante_email: "",
    representante_telefono: "",
    // Nuevos campos:
    logo: "",
    imagen: "",
  });
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");
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
    setError("");
    setExito(false);

    if (!user || !user.uid) {
      setError("No se ha detectado un usuario autenticado.");
      return;
    }

    // Validación de campos requeridos (email YA NO es requerido)
    if (
      !data.nombre ||
      !data.direccion ||
      !data.horario ||
      !data.web ||
      !data.telefono ||
      data.categorias.length === 0 ||
      data.marcas.length === 0
    ) {
      setError("Por favor complete todos los campos requeridos: Nombre, Dirección, Horario, Web, Teléfono, Categorías y Marcas.");
      return;
    }

    setEnviando(true);
    try {
      await addDoc(collection(db, "empresas"), {
        nombre: data.nombre,
        direccion: data.direccion,
        horario: data.horario,
        web: data.web,
        telefono: data.telefono,
        email: data.email,
        calificacion: data.calificacion,
        categorias: data.categorias,
        marcas: data.marcas,
        // Opcionales:
        rut: data.rut,
        ciudad: data.ciudad || "Santiago",
        region: data.region || "Metropolitana",
        descripcion: data.descripcion,
        representante: {
          nombre: data.representante_nombre,
          email: data.representante_email,
          telefono: data.representante_telefono
        },
        // Nuevos campos:
        logo: data.logo,
        imagen: data.imagen,
        estado: "Enviado",
        fecha_postulacion: serverTimestamp(),
        origen: "admin",
        rol: "admin",
        uidproveedor: user.uid
      });
      setExito(true);
      setData({
        nombre: "",
        direccion: "",
        horario: "",
        web: "",
        telefono: "",
        email: "",
        calificacion: "",
        categorias: [],
        marcas: [],
        rut: "",
        ciudad: "Santiago",
        region: "Metropolitana",
        descripcion: "",
        representante_nombre: "",
        representante_email: "",
        representante_telefono: "",
        logo: "",
        imagen: ""
      });
      setTimeout(() => {
        navigate("/admin");
      }, 2000);
    } catch (err) {
      setError("Error al registrar la empresa. Intenta de nuevo.");
    }
    setEnviando(false);
  }

  if (exito) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow text-center max-w-md">
          <h2 className="text-2xl font-bold text-green-700 mb-2">¡Empresa registrada!</h2>
          <p className="mb-4">
            La empresa fue registrada exitosamente.<br />
            Serás redirigido automáticamente al dashboard de empresas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4 text-center">Nueva empresa</h2>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {/* Requeridos */}
        <input name="nombre" value={data.nombre} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Nombre de la empresa *" required />
        <input name="direccion" value={data.direccion} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Dirección *" required />
        <input name="horario" value={data.horario} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Horario de atención (ej: Lunes a Viernes 9:00-18:00) *" required />
        <input name="web" value={data.web} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Sitio web *" required />
        <input name="telefono" value={data.telefono} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Teléfono *" type="tel" required />
        {/* Nuevo campo: logo */}
        <input name="logo" value={data.logo} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Logo (ej: logo_empresa.png)" />
        {/* Nuevo campo: imagen */}
        <input name="imagen" value={data.imagen} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Imagen (ej: imagen_empresa.png)" />
        {/* Campo calificación */}
        <input name="calificacion" value={data.calificacion} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Calificación (opcional, ej: 4.3)" />
        {/* Email (opcional) */}
        <input name="email" value={data.email} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Correo de contacto (opcional)" type="email" />
        {/* Marcas asociadas */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">Marcas asociadas *</label>
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
          <label className="block font-semibold mb-1">Categorías asociadas *</label>
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
        {/* Opcionales */}
        <input name="rut" value={data.rut} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="RUT (opcional)" />
        <input name="ciudad" value={data.ciudad} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Ciudad (opcional)" />
        <select name="region" value={data.region} onChange={handleChange} className="mb-2 w-full border p-2 rounded">
          <option value="">Selecciona región</option>
          {regiones.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <textarea name="descripcion" value={data.descripcion} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Breve descripción (opcional)" rows={2} />
        {/* Representante */}
        <h3 className="font-semibold mt-4 mb-2">Datos del representante legal (opcional)</h3>
        <input name="representante_nombre" value={data.representante_nombre} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Nombre representante" />
        <input name="representante_email" value={data.representante_email} onChange={handleChange} className="mb-2 w-full border p-2 rounded" placeholder="Email representante" type="email" />
        <input name="representante_telefono" value={data.representante_telefono} onChange={handleChange} className="mb-4 w-full border p-2 rounded" placeholder="Teléfono representante" />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={enviando}>
          {enviando ? "Enviando..." : "Registrar empresa"}
        </button>
      </form>
    </div>
  );
}