import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import {
  FaBuilding,
  FaStar,
  FaTags,
  FaDollarSign,
  FaLayerGroup,
  FaBarcode,
  FaLink,
  FaSortNumericUp,
  FaImage,
} from "react-icons/fa";

export default function FormNuevoProducto({ onFinish }) {
  const [empresas, setEmpresas] = useState([]);
  const [todasCategorias, setTodasCategorias] = useState([]);
  const [todasMarcas, setTodasMarcas] = useState([]);
  const [producto, setProducto] = useState({
    idEmpresa: "",
    titulo: "",
    calificacion: "",
    categorias: [],
    marcas: [],
    cantidad: "",
    precio: "",
    imagenUrl: "",
    linkUrl: "",
    estado: "Enviado", // <--- Estado inicial
  });

  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  // Cargar empresas, todas las categorias y todas las marcas
  useEffect(() => {
    const obtenerEmpresasYDatos = async () => {
      const snapshot = await getDocs(collection(db, "empresas"));
      const empresasArr = snapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre,
        categorias: doc.data().categorias || [],
        marcas: doc.data().marcas || [],
      }));
      setEmpresas(empresasArr);

      // Unificar y ordenar todas las categorías y marcas de todas las empresas
      const cats = [];
      const marks = [];
      empresasArr.forEach(e => {
        cats.push(...e.categorias);
        marks.push(...e.marcas);
      });
      setTodasCategorias([...new Set(cats)].sort());
      setTodasMarcas([...new Set(marks)].sort());
    };
    obtenerEmpresasYDatos();
  }, []);

  // Al seleccionar empresa, marcar automáticamente sus categorías y marcas
  useEffect(() => {
    if (producto.idEmpresa) {
      const empresaSel = empresas.find(e => e.id === producto.idEmpresa);
      if (empresaSel) {
        setProducto(p => ({
          ...p,
          categorias: empresaSel.categorias,
          marcas: empresaSel.marcas,
        }));
      }
    }
    // eslint-disable-next-line
  }, [producto.idEmpresa]);

  const validar = () => {
    const errs = {};
    if (!producto.idEmpresa) errs.idEmpresa = "Debe seleccionar una empresa.";
    if (!producto.titulo.trim()) errs.titulo = "El título es obligatorio.";
    if (!producto.categorias.length) errs.categorias = "Debe seleccionar al menos una categoría.";
    if (!producto.marcas.length) errs.marcas = "Debe seleccionar al menos una marca.";
    if (!producto.cantidad || isNaN(Number(producto.cantidad)) || Number(producto.cantidad) < 0)
      errs.cantidad = "Ingrese una cantidad válida.";
    if (!producto.precio || isNaN(Number(producto.precio)) || Number(producto.precio) < 0)
      errs.precio = "Ingrese un precio válido.";
    if (producto.imagenUrl && !/^https?:\/\/.+/i.test(producto.imagenUrl))
      errs.imagenUrl = "Debe ingresar una URL válida (http(s)://...)";
    if (producto.linkUrl && !/^https?:\/\/.+/i.test(producto.linkUrl))
      errs.linkUrl = "Debe ingresar una URL válida (http(s)://...)";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, options } = e.target;
    if (type === "select-multiple") {
      setProducto((p) => ({
        ...p,
        [name]: Array.from(options).filter(o => o.selected).map(o => o.value),
      }));
    } else {
      setProducto((p) => ({ ...p, [name]: value }));
    }
  };

  // Etiquetas categorías
  const toggleCategoria = (categoria) => {
    setProducto((p) => ({
      ...p,
      categorias: p.categorias.includes(categoria)
        ? p.categorias.filter(c => c !== categoria)
        : [...p.categorias, categoria],
    }));
  };

  // Etiquetas marcas
  const toggleMarca = (marca) => {
    setProducto((p) => ({
      ...p,
      marcas: p.marcas.includes(marca)
        ? p.marcas.filter(m => m !== marca)
        : [...p.marcas, marca],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    const errs = validar();
    setErrores(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "productos"), {
        ...producto,
        cantidad: Number(producto.cantidad),
        precio: Number(producto.precio),
        creado: new Date(),
        estado: producto.estado || "Enviado", // <--- Siempre guardar estado "Enviado"
      });
      setSuccessMessage("Producto guardado exitosamente.");
      setProducto({
        idEmpresa: "",
        titulo: "",
        calificacion: "",
        categorias: [],
        marcas: [],
        cantidad: "",
        precio: "",
        imagenUrl: "",
        linkUrl: "",
        estado: "Enviado", // <--- Reset estado después de guardar
      });
      if (onFinish) setTimeout(onFinish, 1000);
    } catch (err) {
      setErrores({ submit: "Error al guardar. Intenta de nuevo." });
    }
    setLoading(false);
  };

  // Para mostrar los errores debajo de cada campo
  const ErrorMsg = ({ field }) =>
    errores[field] && (
      <div className="text-xs text-red-600 mt-1">{errores[field]}</div>
    );

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gradient-to-tr from-gray-50 via-white to-blue-50 p-8 rounded-lg shadow-xl max-w-lg mx-auto border border-blue-100"
      autoComplete="off"
    >
      <h2 className="font-bold text-2xl mb-6 flex items-center gap-2 text-blue-700">
        <FaBarcode className="text-blue-600" />
        Nuevo Producto
      </h2>

      {/* Empresa */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-2">
          <FaBuilding /> Empresa
        </label>
        <select
          name="idEmpresa"
          value={producto.idEmpresa}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        >
          <option value="">Seleccione empresa</option>
          {empresas.map(e => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
        <ErrorMsg field="idEmpresa" />
      </div>

      {/* Título */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-2">
          <FaTags /> Título del producto
        </label>
        <input
          type="text"
          name="titulo"
          value={producto.titulo}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <ErrorMsg field="titulo" />
      </div>

      {/* Calificación */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-2">
          <FaStar /> Calificación
        </label>
        <input
          type="text"
          name="calificacion"
          value={producto.calificacion}
          onChange={handleChange}
          placeholder="Ej: 4.8 (25)"
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Categorías como etiquetas */}
      <div className="mb-6">
        <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
          <FaLayerGroup /> Categorías asociadas
        </label>
        <div className="flex flex-wrap gap-2">
          {todasCategorias.map((cat, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => toggleCategoria(cat)}
              className={`px-3 py-1 rounded-full border text-sm ${
                producto.categorias.includes(cat)
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <ErrorMsg field="categorias" />
      </div>

      {/* Marcas como etiquetas */}
      <div className="mb-6">
        <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
          <FaTags /> Marcas asociadas
        </label>
        <div className="flex flex-wrap gap-2">
          {todasMarcas.map((marca, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => toggleMarca(marca)}
              className={`px-3 py-1 rounded-full border text-sm ${
                producto.marcas.includes(marca)
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {marca}
            </button>
          ))}
        </div>
        <ErrorMsg field="marcas" />
      </div>

      {/* Cantidad */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-2">
          <FaSortNumericUp /> Cantidad
        </label>
        <input
          type="number"
          name="cantidad"
          value={producto.cantidad}
          onChange={handleChange}
          min="0"
          required
          className="w-full p-2 border rounded"
        />
        <ErrorMsg field="cantidad" />
      </div>

      {/* Precio */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-2">
          <FaDollarSign /> Precio
        </label>
        <input
          type="number"
          name="precio"
          value={producto.precio}
          onChange={handleChange}
          min="0"
          required
          className="w-full p-2 border rounded"
        />
        <ErrorMsg field="precio" />
      </div>

      {/* Imagen URL */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-2">
          <FaImage /> Imagen URL
        </label>
        <input
          type="text"
          name="imagenUrl"
          value={producto.imagenUrl}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <ErrorMsg field="imagenUrl" />
      </div>

      {/* Link URL */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-2">
          <FaLink /> Link URL
        </label>
        <input
          type="text"
          name="linkUrl"
          value={producto.linkUrl}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <ErrorMsg field="linkUrl" />
      </div>

      {/* Estado (oculto, sólo para mostrar que el campo está presente) */}
      <input type="hidden" name="estado" value={producto.estado} />

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow font-bold w-full transition disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar Producto"}
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