import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, getDocs, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const regiones = [
  "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso",
  "Metropolitana", "O'Higgins", "Maule", "Ñuble", "Biobío", "La Araucanía",
  "Los Ríos", "Los Lagos", "Aysén", "Magallanes"
];

const estados = [
  "En revisión",
  "Activa"
];

export default function EditarProveedorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proveedor, setProveedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);

  useEffect(() => {
    // Cargar proveedor
    async function fetchProveedor() {
      const ref = doc(db, "empresas", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProveedor({ id: snap.id, ...snap.data() });
      } else {
        setError("Proveedor no encontrado");
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
    fetchProveedor();
    cargarCategoriasYMarcas();
  }, [id]);

  // Métodos tipo "pill"
  function toggleCategoria(cat) {
    setProveedor(prov => ({
      ...prov,
      categorias: Array.isArray(prov.categorias)
        ? (prov.categorias.includes(cat)
            ? prov.categorias.filter(c => c !== cat)
            : [...prov.categorias, cat]
          )
        : [cat]
    }));
  }

  function toggleMarca(marca) {
    setProveedor(prov => ({
      ...prov,
      marcas: Array.isArray(prov.marcas)
        ? (prov.marcas.includes(marca)
            ? prov.marcas.filter(m => m !== marca)
            : [...prov.marcas, marca]
          )
        : [marca]
    }));
  }

  // CREAR USUARIO EN AUTH Y COLECCION USUARIOS SI SE CONFIRMA
  async function crearUsuarioSiNoExiste(email, empresaId, nombre) {
    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, "123456");
      await setDoc(doc(db, "usuarios", userCredential.user.uid), {
        email,
        nombre,
        empresaId,
        rol: "proveedor",
        creadoPorAprobacion: true,
      });
      window.alert(`¡Usuario proveedor creado exitosamente para ${email} con clave 123456!`);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        window.alert("El usuario ya existe en Firebase Auth.");
      } else {
        window.alert("Error al crear usuario: " + err.message);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      // Detectar si estaba en revisión y se va a activar
      const prevEstado = proveedor.estado;
      await updateDoc(doc(db, "empresas", id), {
        nombre: proveedor.nombre ?? "",
        rut: proveedor.rut ?? "",
        email: proveedor.email ?? "",
        telefono: proveedor.telefono ?? "",
        direccion: proveedor.direccion ?? "",
        ciudad: proveedor.ciudad ?? "",
        region: proveedor.region ?? "",
        descripcion: proveedor.descripcion ?? "",
        categorias: proveedor.categorias || [],
        marcas: proveedor.marcas || [],
        web: proveedor.web ?? "",
        horario: proveedor.horario ?? "",
        // NUEVOS CAMPOS:
        logo: proveedor.logo ?? "",
        imagen: proveedor.imagen ?? "",
        estado: proveedor.estado,
        representante: {
          nombre: proveedor.representante?.nombre || "",
          email: proveedor.representante?.email || "",
          telefono: proveedor.representante?.telefono || "",
        },
        origen: proveedor.origen ?? "",
        rol: proveedor.rol  ?? "",
      });

      // Si se pasa a "Activa", pide confirmación para crear usuario
      if (proveedor.estado === "Activa") {
        const confirmar = window.confirm(
          `¿Crear usuario con rol proveedor para el correo ${proveedor.email} y clave "123456"?`
        );
        if (confirmar) {
          await crearUsuarioSiNoExiste(proveedor.email, id, proveedor.nombre);
        }
      }

      navigate("/admin/proveedores");
    } catch (err) {
      setError("Error al guardar cambios: " + err.message);
    }
    setSaving(false);
  }

  if (loading) return <div>Cargando proveedor...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <form className="max-w-lg mx-auto mt-8 p-4 bg-white rounded shadow" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4">Editar Empresa / Proveedor</h2>
      <div className="mb-2">
        <label className="block font-semibold">Estado:</label>
        <select
          className="w-full border px-2 py-1 rounded"
          value={proveedor.estado || "En revisión"}
          onChange={e => setProveedor({ ...proveedor, estado: e.target.value })}
        >
          {estados.map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Nombre:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="text"
          value={proveedor.nombre || ""}
          onChange={e => setProveedor({ ...proveedor, nombre: e.target.value })}
        />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">RUT:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="text"
          value={proveedor.rut || ""}
          onChange={e => setProveedor({ ...proveedor, rut: e.target.value })}
        />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Email:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="email"
          value={proveedor.email || ""}
          onChange={e => setProveedor({ ...proveedor, email: e.target.value })}
        />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Teléfono:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="tel"
          value={proveedor.telefono || ""}
          onChange={e => setProveedor({ ...proveedor, telefono: e.target.value })}
        />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Dirección:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="text"
          value={proveedor.direccion || ""}
          onChange={e => setProveedor({ ...proveedor, direccion: e.target.value })}
        />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Ciudad:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="text"
          value={proveedor.ciudad || ""}
          onChange={e => setProveedor({ ...proveedor, ciudad: e.target.value })}
        />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Región:</label>
        <select
          className="w-full border px-2 py-1 rounded"
          value={proveedor.region || ""}
          onChange={e => setProveedor({ ...proveedor, region: e.target.value })}
        >
          <option value="">Selecciona región</option>
          {regiones.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Horario:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="text"
          value={proveedor.horario || ""}
          onChange={e => setProveedor({ ...proveedor, horario: e.target.value })}
        />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Descripción:</label>
        <textarea
          className="w-full border px-2 py-1 rounded"
          rows={2}
          value={proveedor.descripcion || ""}
          onChange={e => setProveedor({ ...proveedor, descripcion: e.target.value })}
        />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Web:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="text"
          value={proveedor.web || ""}
          onChange={e => setProveedor({ ...proveedor, web: e.target.value })}
        />
      </div>
      {/* Nuevo campo: Logo */}
      <div className="mb-2">
        <label className="block font-semibold">Logo (ej: logo_empresa.png):</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="text"
          value={proveedor.logo || ""}
          onChange={e => setProveedor({ ...proveedor, logo: e.target.value })}
        />
      </div>
      {/* Nuevo campo: Imagen */}
      <div className="mb-2">
        <label className="block font-semibold">Imagen (ej: imagen_empresa.png):</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="text"
          value={proveedor.imagen || ""}
          onChange={e => setProveedor({ ...proveedor, imagen: e.target.value })}
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
                ${proveedor.marcas && proveedor.marcas.includes(marca)
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
                ${proveedor.categorias && proveedor.categorias.includes(cat)
                  ? "bg-green-600 text-white"
                  : "bg-green-100 text-green-800"}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      {/* Representante */}
      <h3 className="mt-4 mb-2 font-semibold">Datos del representante legal</h3>
      <div className="mb-2">
        <label className="block">Nombre:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="text"
          value={proveedor.representante?.nombre || ""}
          onChange={e => setProveedor({ ...proveedor, representante: { ...proveedor.representante, nombre: e.target.value } })}
        />
      </div>
      <div className="mb-2">
        <label className="block">Email:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="email"
          value={proveedor.representante?.email || ""}
          onChange={e => setProveedor({ ...proveedor, representante: { ...proveedor.representante, email: e.target.value } })}
        />
      </div>
      <div className="mb-2">
        <label className="block">Teléfono:</label>
        <input
          className="w-full border px-2 py-1 rounded"
          type="tel"
          value={proveedor.representante?.telefono || ""}
          onChange={e => setProveedor({ ...proveedor, representante: { ...proveedor.representante, telefono: e.target.value } })}
        />
      </div>
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
          onClick={() => navigate("/admin/proveedores")}
        >
          Cancelar
        </button>
      </div>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </form>
  );
}