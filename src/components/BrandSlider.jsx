import React from "react";

const marcas = [
  { nombre: "Toyota", logo: "/logos/toyota.png" },
  { nombre: "Hyundai", logo: "/logos/hyundai.png" },
  { nombre: "Chevrolet", logo: "/logos/chevrolet.png" },
  // Agrega más marcas según tus necesidades
];

function BrandSlider() {
  return (
    <div id="marcas" className="py-4 bg-gray-50">
      <h2 className="mb-2 font-semibold text-lg text-center">Marcas Disponibles</h2>
      <div className="overflow-x-auto flex space-x-6 px-4 scrollbar-thin scrollbar-thumb-blue-400">
        {marcas.map(marca => (
          <div key={marca.nombre} className="flex-shrink-0 w-28 flex flex-col items-center">
            <img src={marca.logo} alt={marca.nombre} className="h-12 w-12 object-contain mb-1" />
            <span className="text-xs">{marca.nombre}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BrandSlider;