import React from 'react';
import HeaderMenu from '../components/HeaderMenu';
import SistemaRecordatorios from '../components/SistemaRecordatorios';

const RecordatoriosPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderMenu />
      <div className="container mx-auto px-4 py-8">
        <SistemaRecordatorios />
      </div>
    </div>
  );
};

export default RecordatoriosPage;
