import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function ListadoCampanas({ filtroMarca, filtroBusqueda, onVerDetalle }) {
  const [campanas, setCampanas] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "campanas"), (snapshot) => {
      setCampanas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  function estaVigente(fechaFin) {
    if (!fechaFin) return false;
    let fin;
    if (typeof fechaFin === "object" && fechaFin.seconds) {
      fin = new Date(fechaFin.seconds * 1000);
    } else {
      fin = new Date(fechaFin);
    }
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    fin.setHours(0,0,0,0);
    return fin >= hoy;
  }

  let campanasFiltradas = campanas.filter(
    camp => camp.fechaFin && estaVigente(camp.fechaFin) && camp.estado === "Activa"
  );

  if (filtroMarca) {
    campanasFiltradas = campanasFiltradas.filter(camp =>
      Array.isArray(camp.marcas) &&
      camp.marcas.some(m => m.trim().toLowerCase() === filtroMarca.trim().toLowerCase())
    );
  }

  if (filtroBusqueda && filtroBusqueda.trim() !== "") {
    const q = filtroBusqueda.trim().toLowerCase();
    campanasFiltradas = campanasFiltradas.filter(camp =>
      (camp.titulo && camp.titulo.toLowerCase().includes(q)) ||
      (camp.descripcion && camp.descripcion.toLowerCase().includes(q)) ||
      (Array.isArray(camp.marcas) && camp.marcas.some(m => m.toLowerCase().includes(q))) ||
      (Array.isArray(camp.categorias) && camp.categorias.some(cat => cat.toLowerCase().includes(q)))
    );
  }

  if (campanasFiltradas.length === 0) {
    return (
      <div className="text-gray-500 text-sm px-4 mt-8">No hay campañas disponibles.</div>
    );
  }

  return (
    <div className="mt-8 px-4 w-full">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {campanasFiltradas.map(camp => {
          const imagen = camp.imagenURL || camp.imagenUrl || "";
          const imagenSrc = imagen
            ? imagen.startsWith("http") ? imagen : `/images/${imagen}`
            : "";

          // Logo circular
          const logo = camp.logoURL || camp.logoUrl || "";
          const logoSrc = logo
            ? logo.startsWith("http") ? logo : `/images/${logo}`
            : "";

          return (
            <div
              key={camp.id}
              className="bg-white rounded-lg shadow-lg p-0 border border-blue-100 cursor-pointer hover:shadow-xl transition"
              onClick={() => onVerDetalle && onVerDetalle(camp.id)}
              title="Ver detalle de campaña"
            >
              <div className="relative">
                {imagenSrc ? (
                  <img
                    src={imagenSrc}
                    alt={camp.titulo || "Campaña"}
                    className="w-full h-56 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-56 flex items-center justify-center bg-gray-100 rounded-t-lg text-gray-400 text-4xl">
                    Sin imagen
                  </div>
                )}
                {logoSrc && (
                  <img
                    src={logoSrc}
                    alt="Logo"
                    className="absolute left-1/2 -bottom-8 transform -translate-x-1/2 w-16 h-16 object-cover rounded-full border-4 border-white shadow-md bg-white"
                    style={{ zIndex: 2 }}
                  />
                )}
              </div>
              <div style={{ height: "2.5rem" }}></div> {/* Espacio para el logo */}
            </div>
          );
        })}
      </div>
    </div>
  );
}