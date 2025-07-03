import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, doc, updateDoc, getDocs } from "firebase/firestore";

export default function FormNuevaCampana({ campanaEdit, onFinish }) {
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState("Enviado");
  const [email, setEmail] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [idEmpresa, setIdEmpresa] = useState("");
  const [marcasSeleccionadas, setMarcasSeleccionadas] = useState([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);
  const [empresasDisponibles, setEmpresasDisponibles] = useState([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [fechaFin, setFechaFin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  // Cargar marcas, empresas y categorías disponibles
  useEffect(() => {
    getDocs(collection(db, "marcas")).then(snapshot => {
      setMarcasDisponibles(snapshot.docs.map(doc => doc.data().nombre));
    });
    getDocs(collection(db, "empresas")).then(snapshot => {
      setEmpresasDisponibles(snapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre })));
    });
    getDocs(collection(db, "categorias")).then(snapshot => {
      setCategoriasDisponibles(snapshot.docs.map(doc => doc.data().nombre));
    });
  }, []);

  // Si editando, inicializa campos
  useEffect(() => {
    if (campanaEdit) {
      setNombre(campanaEdit.nombre || "");
      setEstado(campanaEdit.estado || "Enviado");
      setEmail(campanaEdit.email || "");
      setTitulo(campanaEdit.titulo || "");
      setDescripcion(campanaEdit.descripcion || "");
      setIdEmpresa(campanaEdit.idEmpresa || "");
      setMarcasSeleccionadas(campanaEdit.marcas || []);
      setCategoriasSeleccionadas(campanaEdit.categorias || []);
      if (campanaEdit.fechaFin) {
        if (typeof campanaEdit.fechaFin === "object" && campanaEdit.fechaFin.seconds) {
          // Timestamp Firestore
          const d = new Date(campanaEdit.fechaFin.seconds * 1000);
          setFechaFin(d.toISOString().slice(0, 10));
        } else {
          setFechaFin(String(campanaEdit.fechaFin).slice(0, 10));
        }
      } else {
        setFechaFin("");
      }
    } else {
      setEstado("Enviado");
    }
  }, [campanaEdit]);

  const validar = () => {
    const errs = {};
    if (!nombre.trim()) errs.nombre = "El nombre es obligatorio.";
    if (!email.trim()) errs.email = "El email es obligatorio.";
    if (!titulo.trim()) errs.titulo = "El título es obligatorio.";
    if (!descripcion.trim()) errs.descripcion = "La descripción es obligatoria.";
    if (!idEmpresa) errs.idEmpresa = "Selecciona una empresa.";
    if (!fechaFin) errs.fechaFin = "Selecciona una fecha de finalización.";
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
      if (campanaEdit && campanaEdit.id) {
        // Edición
        const ref = doc(db, "campanas", campanaEdit.id);
        await updateDoc(ref, {
          nombre,
          estado,
          email,
          titulo,
          descripcion,
          idEmpresa,
          marcas: marcasSeleccionadas,
          categorias: categoriasSeleccionadas,
          fechaFin: fechaFin ? new Date(fechaFin) : null,
        });
        setSuccessMessage("Campaña editada exitosamente.");
      } else {
        // Nuevo: estado siempre "Enviado"
        await addDoc(collection(db, "campanas"), {
          nombre,
          estado: "Enviado",
          email,
          titulo,
          descripcion,
          idEmpresa,
          marcas: marcasSeleccionadas,
          categorias: categoriasSeleccionadas,
          fechaFin: fechaFin ? new Date(fechaFin) : null,
          creada: new Date()
        });
        setSuccessMessage("Campaña creada exitosamente.");
        setNombre("");
        setEstado("Enviado");
        setEmail("");
        setTitulo("");
        setDescripcion("");
        setIdEmpresa("");
        setMarcasSeleccionadas([]);
        setCategoriasSeleccionadas([]);
        setFechaFin("");
      }
      if (onFinish) setTimeout(onFinish, 800);
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

  const toggleCategoria = (cat) => {
    if (categoriasSeleccionadas.includes(cat)) {
      setCategoriasSeleccionadas(categoriasSeleccionadas.filter(c => c !== cat));
    } else {
      setCategoriasSeleccionadas([...categoriasSeleccionadas, cat]);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gradient-to-tr from-gray-50 via-white to-blue-50 p-8 rounded-lg shadow-xl max-w-lg mx-auto border border-blue-100"
      autoComplete="off"
    >
      <h2 className="font-bold text-2xl mb-6 text-blue-700">
        {campanaEdit ? "Editar Campaña" : "Nueva Campaña"}
      </h2>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Nombre *</label>
        <input
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          className={`border rounded px-3 py-2 w-full ${errores.nombre ? "border-red-400" : "border-gray-300"}`}
        />
        {errores.nombre && <span className="text-red-500 text-sm">{errores.nombre}</span>}
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Email del proveedor *</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={`border rounded px-3 py-2 w-full ${errores.email ? "border-red-400" : "border-gray-300"}`}
        />
        {errores.email && <span className="text-red-500 text-sm">{errores.email}</span>}
      </div>

      {/* Estado solo editable si es edición */}
      {campanaEdit &&
        <div className="mb-4">
          <label className="block font-semibold mb-1">Estado</label>
          <select
            value={estado}
            onChange={e => setEstado(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="Enviado">Enviado</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Rechazada">Rechazada</option>
            {/* Agrega más estados si lo necesitas */}
          </select>
        </div>
      }

      <div className="mb-4">
        <label className="block font-semibold mb-1">Título *</label>
        <input
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          className={`border rounded px-3 py-2 w-full ${errores.titulo ? "border-red-400" : "border-gray-300"}`}
        />
        {errores.titulo && <span className="text-red-500 text-sm">{errores.titulo}</span>}
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Descripción *</label>
        <textarea
          rows={2}
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          className={`border rounded px-3 py-2 w-full ${errores.descripcion ? "border-red-400" : "border-gray-300"}`}
        />
        {errores.descripcion && <span className="text-red-500 text-sm">{errores.descripcion}</span>}
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Empresa *</label>
        <select
          value={idEmpresa}
          onChange={e => setIdEmpresa(e.target.value)}
          className={`border rounded px-3 py-2 w-full ${errores.idEmpresa ? "border-red-400" : "border-gray-300"}`}
        >
          <option value="">Selecciona empresa...</option>
          {empresasDisponibles.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.nombre}</option>
          ))}
        </select>
        {errores.idEmpresa && <span className="text-red-500 text-sm">{errores.idEmpresa}</span>}
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Fecha fin *</label>
        <input
          type="date"
          value={fechaFin}
          onChange={e => setFechaFin(e.target.value)}
          className={`border rounded px-3 py-2 w-full ${errores.fechaFin ? "border-red-400" : "border-gray-300"}`}
        />
        {errores.fechaFin && <span className="text-red-500 text-sm">{errores.fechaFin}</span>}
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Marcas asociadas</label>
        <div className="flex flex-wrap gap-2">
          {marcasDisponibles.map((marca, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => toggleMarca(marca)}
              className={`px-3 py-1 rounded-full border text-sm
                ${marcasSeleccionadas.includes(marca)
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700"}
              `}
            >
              {marca}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Categorías asociadas</label>
        <div className="flex flex-wrap gap-2">
          {categoriasDisponibles.map((cat, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => toggleCategoria(cat)}
              className={`px-3 py-1 rounded-full border text-sm
                ${categoriasSeleccionadas.includes(cat)
                  ? "bg-green-600 text-white"
                  : "bg-green-100 text-green-800"}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow font-bold w-full transition disabled:opacity-50"
      >
        {loading ? "Guardando..." : campanaEdit ? "Guardar Cambios" : "Guardar Campaña"}
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