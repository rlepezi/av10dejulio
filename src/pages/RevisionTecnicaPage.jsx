import React from 'react';
import HeaderMenu from '../components/HeaderMenu';
import ServicioRevisionTecnica from '../components/ServicioRevisionTecnica';

const RevisionTecnicaPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderMenu />
      <div className="container mx-auto px-4 py-8">
        <ServicioRevisionTecnica />
      </div>
    </div>
  );
};

export default RevisionTecnicaPage;
