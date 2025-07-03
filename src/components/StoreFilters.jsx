import React from "react";

function StoreFilters({ filters, setFilters }) {
  return (
    <div className="mb-4 flex gap-4">
      <input
        placeholder="Buscar por nombre..."
        value={filters.nombre}
        onChange={e => setFilters(f => ({ ...f, nombre: e.target.value }))}
        className="border p-2"
      />
      <select
        value={filters.categoria}
        onChange={e => setFilters(f => ({ ...f, categoria: e.target.value }))}
        className="border p-2"
      >
        <option value="">Todas las categorías</option>
        <option value="Taller">Taller</option>
        <option value="Repuestos">Repuestos</option>
        {/* Más categorías si lo deseas */}
      </select>
      {/* Agrega más filtros si lo necesitas */}
    </div>
  );
}
export default StoreFilters;