import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CrearEmpresaPublica from './CrearEmpresaPublica';

export default function CrearEmpresaPublicaPage() {
  const [mostrarModal, setMostrarModal] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    setMostrarModal(false);
    navigate('/admin'); // Volver al panel principal
  };

  const handleSuccess = () => {
    setMostrarModal(false);
    navigate('/admin'); // Volver al panel principal después de crear
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal Crear Empresa Pública */}
      {mostrarModal && (
        <CrearEmpresaPublica 
          onClose={handleClose} 
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

