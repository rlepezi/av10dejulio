import React from 'react';
import HeaderMenu from '../components/HeaderMenu';
import ServicioVulcanizaciones from '../components/ServicioVulcanizaciones';

const VulcanizacionesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderMenu />
      <div className="container mx-auto px-4 py-8">
        <ServicioVulcanizaciones />
      </div>
    </div>
  );
};

export default VulcanizacionesPage;
