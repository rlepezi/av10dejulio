import React from "react";

export default function Header({ onLogin, onSelect, busqueda, setBusqueda }) {
  return (
    <header className="mb-8">
      {/* Título e icono usuario */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white bg-[#343a40] px-4 py-2 rounded-t-lg">
          🧰 Av. 10 de Julio
        </h2>
        
      </div>
      {/* Buscador y botones */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <input
          type="text"
          placeholder="🔍 Buscar marca o categoría..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="flex-1 mb-0 p-3 border border-gray-300 rounded shadow-sm"
        />
        
      </div>
    </header>
  );
}