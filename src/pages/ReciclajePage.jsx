import React from 'react';
import HeaderMenu from '../components/HeaderMenu';
import ClienteReciclaje from '../components/ClienteReciclaje';

const ReciclajePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderMenu />
      <div className="container mx-auto px-4 py-8">
        <ClienteReciclaje />
      </div>
    </div>
  );
};

export default ReciclajePage;
