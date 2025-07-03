import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import {
  FaTags,
  FaBuilding,
  FaDollarSign,
  FaStar,
  FaSortNumericUp,
} from "react-icons/fa";

export default function ListadoProductos({
  filtroMarca,
  filtroCategoria,
  filtroBusqueda,
  empresas,
  onVerDetalle,
  onEditar,
}) {
  const [productos, setProductos] = useState([]);
  const [empresasMap, setEmpresasMap] = useState({});

  useEffect(() => {
    if (empresas && empresas.length) {
      const map = {};
      empresas.forEach(e => (map[e.id] = e.nombre));
      setEmpresasMap(map);
    }
  }, [empresas]);

  useEffect(() => {
    const q = collection(db, "productos");
    const unsub = onSnapshot(q, (snap) => {
      let arr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filtrar solo los productos "Activos"
      arr = arr.filter(p => (p.estado && p.estado.toLowerCase() === "activo"));

      if (filtroMarca) {
        arr = arr.filter(
          p => Array.isArray(p.marcas) && p.marcas.includes(filtroMarca)
        );
      }
      if (filtroCategoria) {
        arr = arr.filter(
          p => Array.isArray(p.categorias) && p.categorias.includes(filtroCategoria)
        );
      }
      if (filtroBusqueda && filtroBusqueda.trim()) {
        const term = filtroBusqueda.trim().toLowerCase();
        arr = arr.filter(
          p =>
            ((p.nombre && p.nombre.toLowerCase().includes(term)) ||
              (p.titulo && p.titulo.toLowerCase().includes(term))) ||
            (Array.isArray(p.marcas) &&
              p.marcas.some(m => m.toLowerCase().includes(term))) ||
            (Array.isArray(p.categorias) &&
              p.categorias.some(c => c.toLowerCase().includes(term)))
        );
      }

      setProductos(arr);
    });
    return () => unsub();
  }, [filtroMarca, filtroCategoria, filtroBusqueda]);

  if (!productos.length) {
    return (
      <div className="text-center text-gray-500 my-8">
        <FaTags className="inline mb-1" /> No hay productos para mostrar
      </div>
    );
  }

  return (
    <section className="mt-8">
      <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-blue-700">
        <FaTags className="text-blue-600" /> Productos
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {productos.map(producto => (
          <div
            key={producto.id}
            className="bg-white rounded-lg shadow-md p-4 flex flex-col gap-2 border border-blue-100"
          >
            <div className="flex items-center gap-2 mb-1">
              <FaTags className="text-purple-600" />
              <span className="font-semibold text-lg">{producto.nombre || producto.titulo}</span>
            </div>
            {producto.imagenUrl && (
              <img
                src={producto.imagenUrl}
                alt={producto.nombre || producto.titulo}
                className="w-full h-32 object-contain bg-gray-50 rounded mb-1 cursor-pointer"
                onClick={() => {
                  if (producto.linkUrl) {
                    window.open(producto.linkUrl, "_blank", "noopener");
                  }
                }}
                title="Ir al producto"
              />
            )}
            <div className="text-xs text-gray-600 mb-1 flex items-center gap-2">
              <FaBuilding className="text-blue-400" />{" "}
              {empresasMap[producto.idEmpresa] || producto.idEmpresa}
            </div>
            <div className="flex flex-wrap gap-1 mb-1">
              {producto.categorias?.map((cat, i) => (
                <span
                  key={i}
                  className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs"
                >
                  {cat}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 mb-1">
              {producto.marcas?.map((marca, i) => (
                <span
                  key={i}
                  className="inline-block px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs"
                >
                  {marca}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm mt-1">
              <FaDollarSign className="text-green-600" />{" "}
              <span className="font-bold">{producto.precio}</span>
              <FaSortNumericUp className="text-gray-500 ml-2" />{" "}
              <span className="font-mono">{producto.cantidad}</span>
            </div>
            {producto.calificacion && (
              <div className="flex items-center gap-1 text-yellow-700 text-xs mt-1">
                <FaStar className="text-yellow-400" />
                {producto.calificacion}
              </div>
            )}
            {producto.linkUrl && (
              <a
                href={producto.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline text-xs mt-1"
              >
                Ver producto
              </a>
            )}
            {onEditar && (
              <button
                className="mt-2 bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-xs"
                onClick={() => onEditar(producto)}
              >
                Editar
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}