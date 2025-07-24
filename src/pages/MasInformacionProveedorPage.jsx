import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import HeaderMenu from '../components/HeaderMenu';

export default function MasInformacionProveedorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleProviderRedirect();
  }, [id]);

  const handleProviderRedirect = async () => {
    try {
      if (!id) {
        // Si no hay ID, mostrar página de información general
        setLoading(false);
        return;
      }

      // Obtener información de la empresa
      const docRef = doc(db, 'empresas', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const empresaData = docSnap.data();
        
        // Si la empresa tiene web propia, redirigir a su sitio
        if (empresaData.web && empresaData.web.trim() !== '') {
          let url = empresaData.web;
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          window.open(url, '_blank');
          // Redirigir de vuelta a la página de proveedores
          navigate('/proveedores-locales');
        } else {
          // Si no tiene web, mostrar perfil público
          navigate(`/empresa/${id}`);
        }
      } else {
        // Empresa no encontrada, mostrar página de información general
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking provider:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderMenu />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando información del proveedor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderMenu />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-green-100 py-10">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">
          Más Información para Proveedores
        </h1>
        <p className="mb-4 text-lg">
          Aquí encontrarás toda la información relevante sobre:
        </p>
        <ul className="list-disc ml-6 mb-6 text-lg text-blue-900">
          <li>Cómo postular tu empresa</li>
          <li>Cómo enviar campañas y productos</li>
          <li>Requisitos y políticas para proveedores</li>
          <li>Beneficios de pertenecer a la plataforma</li>
          <li>Preguntas frecuentes</li>
        </ul>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-blue-900 mb-2">¿Quieres registrar tu empresa?</h3>
          <p className="text-blue-800 mb-3">
            Únete a nuestra plataforma y aumenta la visibilidad de tu negocio
          </p>
          <button 
            onClick={() => navigate('/login?tipo=empresa')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Registrar Mi Empresa
          </button>
        </div>
        
        <p className="text-gray-700">
          Si tienes dudas adicionales, escríbenos a{' '}
          <a className="text-blue-700 underline" href="mailto:soporte@tuplataforma.com">
            soporte@tuplataforma.com
          </a>
        </p>
      </div>
    </div>
    </div>
  );
}