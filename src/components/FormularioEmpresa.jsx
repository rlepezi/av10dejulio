import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, doc, updateDoc, getDocs } from "firebase/firestore";
import {
  FaBuilding, FaMapMarkerAlt, FaStar, FaClock, FaGlobe, FaPhone, FaTags, FaImage
} from "react-icons/fa";

export default function FormNuevaEmpresa({ empresaEdit, onFinish }) {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [calificacion, setCalificacion] = useState("");
  const [horario, setHorario] = useState("");
  const [web, setWeb] = useState("");
  const [telefono, setTelefono] = useState("");
  const [logo, setLogo] = useState("");
  const [imagen, setImagen] = useState("");
  const [marcasSeleccionadas, setMarcasSeleccionadas] = useState([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  // Cargar marcas disponibles
  useEffect(() => {
    const obtenerMarcas = async () => {
      const snapshot = await getDocs(collection(db, "marcas"));
      const lista = snapshot.docs.map(doc => doc.data().nombre);
      setMarcasDisponibles(lista);
    };
    obtenerMarcas();
  }, []);

  // Si estamos editando, inicializa los campos
  useEffect(() => {
    if (empresaEdit) {
      setNombre(empresaEdit.nombre || "");
      setDireccion(empresaEdit.direccion || "");
      setCalificacion(empresaEdit.calificacion || "");
      setHorario(empresaEdit.horario || "");
      setWeb(empresaEdit.web || "");
      setTelefono(empresaEdit.telefono || "");
      setLogo(empresaEdit.logo || "");
      setImagen(empresaEdit.imagen || "");
      setMarcasSeleccionadas(empresaEdit.marcas || []);
    }
  }, [empresaEdit]);

  const validar = () => {
    const errs = {};
    if (!nombre.trim()) errs.nombre = "El nombre es obligatorio.";
    if (!direccion.trim()) errs.direccion = "La dirección es obligatoria.";
    if (!web.trim()) {
      errs.web = "La página web es obligatoria.";
    } else {
      try {
        new URL(web);
      } catch {
        errs.web = "Debe ser una URL válida (http(s)://...)";
      }
    }
    if (telefono && !/^[\d\-\s()+]+$/.test(telefono))
      errs.telefono = "El teléfono debe ser válido.";
    if (calificacion && !/^(\d(\.\d)?)(\s*\(\d+\))?$/.test(calificacion))
      errs.calificacion = "Ejemplo válido: 4.8 (25)";
    // Logo e imagen pueden ser vacíos, pero podrías validarlos si quieres que sean requeridos
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    const errs = validar();
    setErrores(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      if (empresaEdit && empresaEdit.id) {
        // Modo edición
        const ref = doc(db, "empresas", empresaEdit.id);
        await updateDoc(ref, {
          nombre,
          direccion,
          calificacion,
          horario,
          web,
          telefono,
          logo,
          imagen,
          marcas: marcasSeleccionadas
        });
        setSuccessMessage("Empresa editada exitosamente.");
      } else {
        // Modo creación - origen: "admin"
        await addDoc(collection(db, "empresas"), {
          nombre,
          direccion,
          calificacion,
          horario,
          web,
          telefono,
          logo,
          imagen,
          marcas: marcasSeleccionadas,
          creado: new Date(),
          origen: "admin"
        });
        setSuccessMessage("Empresa guardada exitosamente.");
        setNombre("");
        setDireccion("");
        setCalificacion("");
        setHorario("");
        setLogo("");
        setImagen("");
        setWeb("");
        setTelefono("");
        setMarcasSeleccionadas([]);
      }
      if (onFinish) setTimeout(onFinish, 1000); // Cierra el formulario después de éxito
    } catch (err) {
      setErrores({ submit: "Error al guardar. Intenta de nuevo." });
    }
    setLoading(false);
  };

  const toggleMarca = (marca) => {
    if (marcasSeleccionadas.includes(marca)) {
      setMarcasSeleccionadas(marcasSeleccionadas.filter(m => m !== marca));
    } else {
      setMarcasSeleccionadas([...marcasSeleccionadas, marca]);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gradient-to-tr from-gray-50 via-white to-blue-50 p-8 rounded-lg shadow-xl max-w-lg mx-auto border border-blue-100"
      autoComplete="off"
    >
      <h2 className="font-bold text-2xl mb-6 flex items-center gap-2 text-blue-700">
        <FaBuilding className="text-blue-600" />
        {empresaEdit ? "Editar Empresa" : "Nueva Empresa"}
      </h2>
      {/* Campos de formulario */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-2">
          <FaBuilding /> Nombre de la empresa
        </label>
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        {errores.nombre && <div className="text-red-600 text-sm">{errores.nombre}</div>}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-2">
          <FaMapMarkerAlt /> Dirección
        </label>
        <input
          type="text"
          value={direccion}
          onChange={e => setDireccion(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        {errores.direccion && <div className="text-red-600 text-sm">{errores.direccion}</div>}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-2">
          <FaStar /> Calificación
        </label>
        <input
          type="text"
          value={calificacion}
          onChange={e => setCalificacion(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Ej: 4.8 (25)"
        />
        {errores.calificacion && <div className="text-red-600 text-sm">{errores.calificacion}</div>}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-2">
          <FaClock /> Horario
        </label>
        <input
          type="text"
          value={horario}
          onChange={e => setHorario(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-2">
          <FaGlobe /> Página web
        </label>
        <input
          type="text"
          value={web}
          onChange={e => setWeb(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        {errores.web && <div className="text-red-600 text-sm">{errores.web}</div>}
      </div>
      {/* Campo para Logo */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-2">
          <FaImage /> Logo (nombre del archivo, ej: logo_empresa.png)
        </label>
        <input
          type="text"
          value={logo}
          onChange={e => setLogo(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="logo_empresa.png"
        />
      </div>
      {/* Campo para Imagen */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-2">
          <FaImage /> Imagen (nombre del archivo, ej: imagen_empresa.png)
        </label>
        <input
          type="text"
          value={imagen}
          onChange={e => setImagen(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="imagen_empresa.png"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-2">
          <FaPhone /> Teléfono
        </label>
        <input
          type="text"
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
          className="w-full border p-2 rounded"
        />
        {errores.telefono && <div className="text-red-600 text-sm">{errores.telefono}</div>}
      </div>
      {/* Marcas disponibles */}
      <div className="mb-6">
        <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
          <FaTags /> Marcas asociadas
        </label>
        <div className="flex flex-wrap gap-2">
          {marcasDisponibles.map((marca, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => toggleMarca(marca)}
              className={`px-3 py-1 rounded-full border text-sm ${
                marcasSeleccionadas.includes(marca)
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {marca}
            </button>
          ))}
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow font-bold w-full transition disabled:opacity-50"
      >
        {loading ? "Guardando..." : empresaEdit ? "Guardar Cambios" : "Guardar Empresa"}
      </button>
      {errores.submit && (
        <div className="mt-4 text-red-600">{errores.submit}</div>
      )}
      {successMessage && (
        <div className="mt-4 text-green-600 font-semibold">{successMessage}</div>
      )}
    </form>
  );
}