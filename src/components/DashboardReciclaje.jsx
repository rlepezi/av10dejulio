import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const DashboardReciclaje = ({ proveedorId }) => {
  const [materialesReciclables, setMaterialesReciclables] = useState([]);
  const [solicitudesRecoleccion, setSolicitudesRecoleccion] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});

  const tiposMateriales = {
    aceite_usado: {
      nombre: "Aceite de Motor Usado",
      precio_kg: 150,
      unidad: "litros",
      descripcion: "Aceite de motor, transmisión y diferencial"
    },
    baterias: {
      nombre: "Baterías de Auto",
      precio_unidad: 5000,
      unidad: "unidades",
      descripcion: "Baterías de plomo-ácido usadas"
    },
    neumaticos: {
      nombre: "Neumáticos Usados",
      precio_unidad: 1000,
      unidad: "unidades",
      descripcion: "Neumáticos para reciclaje o reencauche"
    },
    filtros: {
      nombre: "Filtros Usados",
      precio_kg: 300,
      unidad: "kilogramos",
      descripcion: "Filtros de aceite, aire y combustible"
    },
    chatarra_metalica: {
      nombre: "Chatarra Metálica",
      precio_kg: 400,
      unidad: "kilogramos",
      descripcion: "Partes metálicas, discos de freno, etc."
    }
  };

  const crearSolicitudRecoleccion = async (material, cantidad) => {
    try {
      await addDoc(collection(db, 'solicitudes_reciclaje'), {
        proveedorId,
        material,
        cantidad,
        fecha_solicitud: new Date(),
        estado: 'pendiente',
        valor_estimado: calcularValor(material, cantidad),
        ubicacion: {
          direccion: "Dirección del proveedor",
          coordenadas: { lat: -33.4569, lng: -70.6483 }
        }
      });
      
      alert('Solicitud de recolección creada exitosamente');
      cargarSolicitudes();
    } catch (error) {
      console.error('Error al crear solicitud:', error);
    }
  };

  const calcularValor = (material, cantidad) => {
    const tipo = tiposMateriales[material];
    if (tipo.precio_kg) {
      return tipo.precio_kg * cantidad;
    } else if (tipo.precio_unidad) {
      return tipo.precio_unidad * cantidad;
    }
    return 0;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-green-600 text-white p-6 rounded-lg mb-6">
          <h1 className="text-2xl font-bold">♻️ Centro de Reciclaje Automotriz</h1>
          <p className="mt-2">Gestiona materiales reciclables y genera ingresos adicionales</p>
        </div>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-green-600">Material Disponible</h3>
            <p className="text-2xl font-bold">1,250 kg</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-blue-600">Valor Estimado</h3>
            <p className="text-2xl font-bold">$485,000</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-purple-600">Recolecciones</h3>
            <p className="text-2xl font-bold">12 este mes</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-orange-600">CO₂ Ahorrado</h3>
            <p className="text-2xl font-bold">2.3 ton</p>
          </div>
        </div>

        {/* Materiales Reciclables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventario de Materiales */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">📦 Inventario de Materiales</h2>
            
            {Object.entries(tiposMateriales).map(([key, material]) => (
              <div key={key} className="border-b py-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{material.nombre}</h3>
                    <p className="text-sm text-gray-600">{material.descripcion}</p>
                    <p className="text-sm text-green-600">
                      ${material.precio_kg || material.precio_unidad} por {material.unidad}
                    </p>
                  </div>
                  <div className="text-right">
                    <input
                      type="number"
                      placeholder="Cantidad"
                      className="w-20 px-2 py-1 border rounded text-sm mb-2"
                      id={`cantidad-${key}`}
                    />
                    <button
                      onClick={() => {
                        const cantidad = document.getElementById(`cantidad-${key}`).value;
                        if (cantidad) crearSolicitudRecoleccion(key, parseFloat(cantidad));
                      }}
                      className="block w-full bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Solicitar Recolección
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Solicitudes Pendientes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🚛 Solicitudes de Recolección</h2>
            
            <div className="space-y-3">
              {/* Ejemplo de solicitudes */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">Aceite de Motor Usado</h3>
                    <p className="text-sm text-gray-600">45 litros</p>
                    <p className="text-sm text-green-600">Valor: $6,750</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                      Pendiente
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Solicitud: 15/01/2025</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">Baterías de Auto</h3>
                    <p className="text-sm text-gray-600">3 unidades</p>
                    <p className="text-sm text-green-600">Valor: $15,000</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      Programada
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Recolección: 18/01/2025</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">Neumáticos Usados</h3>
                    <p className="text-sm text-gray-600">8 unidades</p>
                    <p className="text-sm text-green-600">Valor: $8,000</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      Completada
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Pagado: 12/01/2025</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Beneficios del Reciclaje */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">🌱 Impacto Ambiental y Beneficios</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl mb-2">♻️</div>
              <h3 className="font-semibold">Materiales Reciclados</h3>
              <p className="text-2xl font-bold text-green-600">2,450 kg</p>
              <p className="text-sm text-gray-600">Este año</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="font-semibold">Ingresos Generados</h3>
              <p className="text-2xl font-bold text-blue-600">$890,000</p>
              <p className="text-sm text-gray-600">Este año</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl mb-2">🌍</div>
              <h3 className="font-semibold">CO₂ Reducido</h3>
              <p className="text-2xl font-bold text-purple-600">4.8 ton</p>
              <p className="text-sm text-gray-600">Equivalente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardReciclaje;
