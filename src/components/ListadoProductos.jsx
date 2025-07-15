import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import {
  FaTags,
  FaBuilding,
  FaDollarSign,
  FaStar,
  FaSortNumericUp,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

// Carrusel de imágenes para cada producto
function CarruselImagenes({ imagenes = [], alt = "", interval = 3500 }) {
  const [idx, setIdx] = useState(0);
  const timer = useRef(null);
  const total = imagenes.length;

  useEffect(() => {
    if (total <= 1) return;
    timer.current = setInterval(() => {
      setIdx(prev => (prev + 1) % total);
    }, interval);
    return () => clearInterval(timer.current);
  }, [total, interval]);

  if (!total) return (
    <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded">
      <span className="text-gray-400 text-xs">Sin imágenes</span>
    </div>
  );

  return (
    <div className="relative w-full h-40 flex items-center justify-center bg-gray-50 rounded mb-2 overflow-hidden">
      <img
        src={imagenes[idx]}
        alt={alt}
        className="object-contain w-full h-full transition-all"
        loading="lazy"
      />
      {total > 1 && (
        <>
          <button
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full p-1 text-lg"
            onClick={e => { e.stopPropagation(); setIdx(idx === 0 ? total - 1 : idx - 1); }}
            aria-label="Anterior"
            tabIndex={0}
            type="button"
          >
            <FaChevronLeft />
          </button>
          <button
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full p-1 text-lg"
            onClick={e => { e.stopPropagation(); setIdx((idx + 1) % total); }}
            aria-label="Siguiente"
            tabIndex={0}
            type="button"
          >
            <FaChevronRight />
          </button>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {imagenes.map((_, i) => (
              <span
                key={i}
                className={`inline-block w-2 h-2 rounded-full ${i === idx ? "bg-blue-500" : "bg-white/70 border border-blue-400"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Componente para mostrar el logo de la empresa
function LogoEmpresa({ logoUrl, nombre }) {
  if (!logoUrl) {
    // fallback: círculo con iniciales
    const iniciales = nombre
      ? nombre
          .split(" ")
          .map(w => w.charAt(0))
          .join("")
          .toUpperCase()
      : "?";
    return (
      <div
        className="w-10 h-10 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-base text-gray-600 font-semibold shadow"
        title={nombre}
      >
        {iniciales}
      </div>
    );
  }
  return (
    <img
      src={logoUrl}
      alt={nombre}
      className="w-10 h-10 rounded-full object-contain bg-white border border-gray-200 shadow"
      title={nombre}
      loading="lazy"
    />
  );
}

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
      empresas.forEach(e => {
        map[e.id] = {
          nombre: e.nombre,
          logoUrl: e.logoUrl || e.logo || null,
        };
      });
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
        {productos.map(producto => {
          // Soporta múltiples imágenes: producto.imagenes (array) o producto.imagenUrl (string)
          let imagenes = [];
          if (producto.imagenes && Array.isArray(producto.imagenes) && producto.imagenes.length) {
            imagenes = producto.imagenes;
          } else if (producto.imagenUrl) {
            imagenes = [producto.imagenUrl];
          }

          // Empresa info
          const empresa = empresasMap[producto.idEmpresa] || {};
          return (
            <div
              key={producto.id}
              className="bg-white rounded-xl shadow-lg p-5 flex flex-col gap-2 border border-blue-100 hover:shadow-xl transition group"
            >
              <div className="flex items-center gap-2 mb-1">
                <FaTags className="text-purple-600" />
                <span className="font-semibold text-lg">{producto.nombre || producto.titulo}</span>
              </div>
              <div className="cursor-pointer"
                onClick={() => onVerDetalle && onVerDetalle(producto.id)}
                title="Ver detalles del producto"
              >
                <CarruselImagenes imagenes={imagenes} alt={producto.nombre || producto.titulo} />
              </div>
              <div className="my-1 flex items-center gap-2">
                <LogoEmpresa logoUrl={empresa.logoUrl} nombre={empresa.nombre || producto.idEmpresa} />
                <span className="text-xs text-gray-600 flex items-center gap-1">
                  <FaBuilding className="text-blue-400" />{" "}
                  {empresa.nombre || producto.idEmpresa}
                </span>
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
              <div className="mt-2">
                <div className="flex items-center gap-2 text-sm">
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
                {/* Características */}
                {producto.caracteristicas && Array.isArray(producto.caracteristicas) && (
                  <ul className="mt-2 list-disc pl-5 text-xs text-gray-700 space-y-1">
                    {producto.caracteristicas.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                )}
              </div>
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
              <div className="flex justify-between mt-2">
                {onEditar && (
                  <button
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-xs"
                    onClick={() => onEditar(producto)}
                  >
                    Editar
                  </button>
                )}
                {onVerDetalle && (
                  <button
                    className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded text-xs"
                    onClick={() => onVerDetalle(producto.id)}
                  >
                    Ver detalles
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}