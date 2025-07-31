import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function ActualizarEmpresaTemp() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState('');

  const actualizarEmpresa = async () => {
    setLoading(true);
    setResultado('');

    const empresaId = 'uAXNtDSJVmydSX70UDK8';
    
    try {
      const empresaRef = doc(db, 'empresas', empresaId);
      
      const datosCompletos = {
        servicios: [
          "Reparación de Motor",
          "Cambio de Aceite", 
          "Alineación",
          "Balanceado",
          "Frenos",
          "Suspensión",
          "Sistema Eléctrico",
          "Air Bag",
          "Transmisión",
          "Radiador"
        ],
        marcas: [
          "Toyota",
          "Chevrolet", 
          "Ford",
          "Nissan",
          "Hyundai",
          "Kia",
          "Mazda",
          "Honda",
          "Volkswagen",
          "Renault"
        ],
        galeria: [
          "https://images.unsplash.com/photo-1486312338219-ce68e2c6b322?w=600&q=80",
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", 
          "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80",
          "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=600&q=80"
        ],
        logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&q=80",
        logoAsignado: true,
        caracteristicas: [
          "Más de 15 años de experiencia",
          "Técnicos certificados",
          "Equipos de última tecnología", 
          "Garantía en todos los trabajos",
          "Atención personalizada",
          "Diagnóstico computarizado"
        ],
        horarios: {
          lunes: { abierto: true, apertura: "08:00", cierre: "18:00", turno_continuo: true },
          martes: { abierto: true, apertura: "08:00", cierre: "18:00", turno_continuo: true },
          miercoles: { abierto: true, apertura: "08:00", cierre: "18:00", turno_continuo: true },
          jueves: { abierto: true, apertura: "08:00", cierre: "18:00", turno_continuo: true },
          viernes: { abierto: true, apertura: "08:00", cierre: "18:00", turno_continuo: true },
          sabado: { abierto: true, apertura: "09:00", cierre: "14:00", turno_continuo: true },
          domingo: { abierto: false }
        },
        descripcionCompleta: "Taller mecánico especializado con más de 15 años de experiencia en el rubro automotriz. Contamos con técnicos certificados y equipos de última tecnología para brindar el mejor servicio. Trabajamos con todas las marcas de vehículos y ofrecemos garantía en todos nuestros trabajos.",
        contactoAdicional: {
          whatsapp: "+56912345678",
          facebook: "TallerMecanico",
          instagram: "@taller_mecanico"
        },
        estado: "activa",
        logoValidado: true,
        webValidada: true,
        imagenesValidadas: true,
        galeriaCompleta: true
      };
      
      await updateDoc(empresaRef, datosCompletos);
      setResultado('✅ Empresa actualizada exitosamente con todos los datos!');
      
    } catch (error) {
      console.error('Error:', error);
      setResultado('❌ Error al actualizar empresa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔧 Actualizar Empresa de Prueba
          </h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              Empresa a actualizar:
            </h3>
            <p className="text-blue-800">
              ID: <code className="bg-blue-100 px-2 py-1 rounded">uAXNtDSJVmydSX70UDK8</code>
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              📋 Datos que se agregarán:
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>Servicios:</strong> 10 servicios automotrices</li>
              <li>• <strong>Marcas:</strong> 10 marcas de vehículos</li>
              <li>• <strong>Galería:</strong> 4 imágenes de alta calidad</li>
              <li>• <strong>Logo:</strong> Logo profesional</li>
              <li>• <strong>Características:</strong> 6 puntos destacados</li>
              <li>• <strong>Horarios:</strong> Horarios completos L-S</li>
              <li>• <strong>Contacto adicional:</strong> WhatsApp y redes sociales</li>
              <li>• <strong>Validaciones:</strong> Todas las validaciones admin</li>
            </ul>
          </div>

          <button
            onClick={actualizarEmpresa}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Actualizando...
              </span>
            ) : (
              '🚀 Actualizar Empresa Completa'
            )}
          </button>

          {resultado && (
            <div className={`mt-4 p-4 rounded-lg ${
              resultado.startsWith('✅') 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <p>{resultado}</p>
              {resultado.startsWith('✅') && (
                <div className="mt-3 flex gap-3">
                  <a 
                    href="http://localhost:5175/empresa/uAXNtDSJVmydSX70UDK8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 underline hover:text-green-800"
                  >
                    👁️ Ver Perfil Actualizado
                  </a>
                  <a 
                    href="http://localhost:5175/admin/empresas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 underline hover:text-green-800"
                  >
                    📋 Ir al Admin
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              ⚠️ Este es un componente temporal para testing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
