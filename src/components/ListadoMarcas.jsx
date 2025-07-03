import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function ListadoMarcas({ onSelectMarca }) {
  const [marcas, setMarcas] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "empresas"), (snapshot) => {
      const marcasSet = new Set();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (Array.isArray(data.marcas)) {
          data.marcas.forEach(marca => {
            if (typeof marca === "string" && marca.trim()) {
              marcasSet.add(marca.trim());
            }
          });
        }
      });
      setMarcas(Array.from(marcasSet).sort());
    });
    return () => unsubscribe();
  }, []);

  if (marcas.length === 0) return null;

  return (
    <div className="mt-10 px-4">
      <h2 className="text-lg font-bold text-gray-800 mb-3">Marcas disponibles</h2>
      <div className="flex flex-wrap gap-3">
        {marcas.map((marca, idx) => {
          // Normaliza el nombre para buscar el logo en /logo/{nombre}.png, todo en minúscula y sin espacios
          const logoFilename = marca.toLowerCase().replace(/\s+/g, "");
          const logoSrc = `/logos/${logoFilename}.png`;
          return (
            <button
              key={idx}
              onClick={() => onSelectMarca && onSelectMarca(marca)}
              className="bg-fuchsia-800 hover:bg-fuchsia-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-md flex flex-col items-center transition-all duration-200 min-w-[72px]"
              style={{ minHeight: 70 }}
            >
              <span>{marca}</span>
              <img
                src={logoSrc}
                alt={marca}
                className="rounded-full w-8 h-8 mt-2 bg-white object-cover border border-gray-200"
                loading="lazy"
                onError={e => (e.target.style.display = "none")}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}