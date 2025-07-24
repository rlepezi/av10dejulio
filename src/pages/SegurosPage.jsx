import React from 'react';
import HeaderMenu from '../components/HeaderMenu';
import ServicioSeguros from '../components/ServicioSeguros';

const SegurosPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderMenu />
      <div className="container mx-auto px-4 py-8">
        <ServicioSeguros />
      </div>
    </div>
  );
};

export default SegurosPage;
