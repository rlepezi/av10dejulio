import React from "react";

// Recibe la marca como prop (ej: "Toyota")
export default function MarcaChip({ marca }) {
  // El path del logo, asumiendo que los nombres son exactos y sin espacios
  const logoPath = `/logo/${marca}.png`;

  // El alt por si no existe el logo
  // Usa loading="lazy" para eficiencia
  return (
    <div className="flex flex-col items-center min-w-[60px]">
      <span className="font-medium text-sm text-indigo-900 mb-1">{marca}</span>
      <img
        src={logoPath}
        alt={marca}
        className="rounded-full w-8 h-8 object-cover border border-gray-200 shadow"
        loading="lazy"
        onError={e => { e.target.style.display = "none"; }}
      />
    </div>
  );
}