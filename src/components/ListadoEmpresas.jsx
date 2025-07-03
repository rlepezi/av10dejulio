import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function ListadoEmpresas({
  filtroMarca,
  filtroBusqueda,
  filtroCategoria,
  onEditar,
  usuario
}) {
  const [empresas, setEmpresas] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "empresas"), (snapshot) => {
      setEmpresas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Solo mostrar empresas con estado 'Activa'
  let empresasFiltradas = empresas.filter(emp => emp.estado === "Activa");

  if (filtroMarca) {
    empresasFiltradas = empresasFiltradas.filter(emp =>
      Array.isArray(emp.marcas) &&
      emp.marcas.some(m => m.trim().toLowerCase() === filtroMarca.trim().toLowerCase())
    );
  }

  if (filtroCategoria) {
    empresasFiltradas = empresasFiltradas.filter(emp =>
      Array.isArray(emp.categorias) &&
      emp.categorias.some(cat => cat.trim().toLowerCase() === filtroCategoria.trim().toLowerCase())
    );
  }

  if (filtroBusqueda && filtroBusqueda.trim() !== "") {
    const q = filtroBusqueda.trim().toLowerCase();
    empresasFiltradas = empresasFiltradas.filter(emp =>
      (emp.nombre && emp.nombre.toLowerCase().includes(q)) ||
      (emp.direccion && emp.direccion.toLowerCase().includes(q)) ||
      (Array.isArray(emp.marcas) && emp.marcas.some(m => m.toLowerCase().includes(q))) ||
      (Array.isArray(emp.categorias) && emp.categorias.some(cat => cat.toLowerCase().includes(q)))
    );
  }

  if (empresasFiltradas.length === 0)
    return <div className="text-gray-500 mb-6 text-center">No hay empresas para mostrar.</div>;

  return (
    <div className="bg-gradient-to-b from-white via-slate-50 to-slate-100 p-6 rounded-xl shadow-inner border border-gray-300 mt-6">
      <div className="text-right text-xs text-gray-500 mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-3 text-left">🏷️ Tiendas disponibles</h2>
        Mostrando {empresasFiltradas.length} empresa{empresasFiltradas.length !== 1 && "s"}
      </div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {empresasFiltradas.map(emp => (
          <div
            key={emp.id}
            className="relative bg-white rounded-xl shadow-xl hover:shadow-2xl border border-gray-200 transition-all p-0 flex flex-col overflow-hidden"
          >
            {/* Imagen principal tipo banner */}
            <div className="relative w-full h-32 bg-gray-100 flex items-center justify-center">
              {emp.imagen && (
                <img
                  src={`/images/${emp.imagen}`}
                  alt={`Imagen de ${emp.nombre}`}
                  className="w-full h-32 object-cover"
                  style={{ objectPosition: 'center' }}
                  loading="lazy"
                  onError={e => (e.target.style.display = "none")}
                />
              )}
              {/* Logo circular sobre el banner */}
              {emp.logo && (
                <img
                  src={`/images/${emp.logo}`}
                  alt={`Logo de ${emp.nombre}`}
                  className="absolute left-5 top-20 w-16 h-16 rounded-full border-4 border-white shadow-lg bg-white object-contain"
                  style={{ transform: "translateY(-50%)" }}
                  loading="lazy"
                  onError={e => (e.target.style.display = "none")}
                />
              )}
              {/* Botón editar */}
              {usuario && onEditar && (
                <button
                  className="absolute top-3 right-3 bg-blue-600 hover:bg-blue-800 text-white rounded-full p-1 shadow"
                  onClick={() => onEditar(emp)}
                  title="Editar empresa"
                >
                  ✏️
                </button>
              )}
            </div>
            <div className="pt-8 px-6 pb-6">
              {/* Nombre de la empresa */}
              {emp.web ? (
                <a
                  href={emp.web.startsWith('http') ? emp.web : `https://${emp.web}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-lg text-blue-800 hover:underline"
                  title={emp.web}
                >
                  {emp.nombre}
                </a>
              ) : (
                <h3 className="font-bold text-lg text-blue-800">{emp.nombre}</h3>
              )}
              <p className="text-sm text-gray-600 italic flex items-center gap-1 mt-1">
                <span>📍</span> {emp.direccion}
              </p>
              {/* Mapa de la dirección */}
              {emp.direccion && (
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(emp.direccion)}&output=embed`}
                  width="100%"
                  height="100"
                  style={{ border: 0, borderRadius: "8px" }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Mapa de ${emp.nombre}`}
                  className="mb-2 mt-2"
                />
              )}
              {/* Marcas */}
              {emp.marcas?.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold text-fuchsia-700 mb-1">Marcas:</p>
                  <div className="flex flex-wrap gap-1">
                    {emp.marcas.map((marca, idx) => (
                      <span
                        key={idx}
                        className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-xs font-semibold"
                      >
                        {marca}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Categorías */}
              {emp.categorias?.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold text-green-700 mb-1">Categorías:</p>
                  <div className="flex flex-wrap gap-2">
                    {emp.categorias.map((cat, idx) => (
                      <span
                        key={idx}
                        className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}