import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';

const ClienteReciclaje = () => {
  const { user } = useAuth();
  const [vehiculos, setVehiculos] = useState([]);
  const [historialReciclaje, setHistorialReciclaje] = useState([]);

  const materialesCliente = {
    aceite_usado: {
      nombre: "Aceite de Motor",
      descripcion: "Entrega el aceite usado de tu cambio",
      puntos: 50,
      beneficio: "Descuento en próximo cambio de aceite"
    },
    neumaticos: {
      nombre: "Neumáticos Viejos",
      descripcion: "Al cambiar neumáticos, entrega los usados",
      puntos: 200,
      beneficio: "Crédito para alineación o balanceo"
    },
    bateria: {
      nombre: "Batería Agotada",
      descripcion: "Cambio de batería con reciclaje",
      puntos: 300,
      beneficio: "Descuento en nueva batería"
    },
    filtros: {
      nombre: "Filtros Usados",
      descripcion: "Filtros de aceite, aire y combustible",
      puntos: 30,
      beneficio: "Acumulable para servicios gratuitos"
    }
  };

  const proximosReciclajes = [
    {
      vehiculo: "Toyota Corolla 2018",
      material: "aceite_usado",
      fecha_estimada: "2025-02-15",
      km_actuales: 85000,
      km_proximo_cambio: 90000
    },
    {
      vehiculo: "Toyota Corolla 2018", 
      material: "neumaticos",
      fecha_estimada: "2025-06-01",
      razon: "Desgaste estimado según uso"
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg mb-6">
          <h1 className="text-2xl font-bold">♻️ Mi Centro de Reciclaje</h1>
          <p className="mt-2">Recicla responsablemente y obtén beneficios para tu vehículo</p>
        </div>

        {/* Puntos y Beneficios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-green-600">🏆 Puntos EcoAV10</h3>
            <p className="text-3xl font-bold">1,250</p>
            <p className="text-sm text-gray-600">Puntos acumulados</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-blue-600">💰 Ahorros</h3>
            <p className="text-3xl font-bold">$45,000</p>
            <p className="text-sm text-gray-600">En descuentos obtenidos</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-purple-600">🌱 Impacto</h3>
            <p className="text-3xl font-bold">85 kg</p>
            <p className="text-sm text-gray-600">CO₂ evitado</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Próximos Reciclajes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">📅 Próximos Reciclajes</h2>
            
            {proximosReciclajes.map((item, index) => (
              <div key={index} className="border-b py-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{materialesCliente[item.material].nombre}</h3>
                    <p className="text-sm text-gray-600">{item.vehiculo}</p>
                    <p className="text-sm text-green-600">
                      +{materialesCliente[item.material].puntos} puntos EcoAV10
                    </p>
                    {item.km_actuales && (
                      <p className="text-sm text-orange-600">
                        Próximo cambio en {item.km_proximo_cambio - item.km_actuales} km
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{item.fecha_estimada}</p>
                    <button className="bg-green-600 text-white px-3 py-1 rounded text-sm mt-2 hover:bg-green-700">
                      Programar
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800">💡 Consejo Eco</h3>
              <p className="text-sm text-blue-700">
                El aceite usado se puede reciclar indefinidamente. ¡Una sola gota puede contaminar 1000 litros de agua!
              </p>
            </div>
          </div>

          {/* Materiales Reciclables */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🔄 Materiales que Puedes Reciclar</h2>
            
            {Object.entries(materialesCliente).map(([key, material]) => (
              <div key={key} className="border-b py-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{material.nombre}</h3>
                    <p className="text-sm text-gray-600">{material.descripcion}</p>
                    <p className="text-sm text-green-600">Beneficio: {material.beneficio}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      +{material.puntos} pts
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Historial de Reciclaje */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">📊 Historial de Reciclaje</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Fecha</th>
                  <th className="text-left py-2">Material</th>
                  <th className="text-left py-2">Vehículo</th>
                  <th className="text-left py-2">Puntos</th>
                  <th className="text-left py-2">Beneficio</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">12/01/2025</td>
                  <td className="py-2">Aceite de Motor</td>
                  <td className="py-2">Toyota Corolla</td>
                  <td className="py-2 text-green-600">+50</td>
                  <td className="py-2">$5,000 descuento aplicado</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">08/01/2025</td>
                  <td className="py-2">Filtro de Aceite</td>
                  <td className="py-2">Toyota Corolla</td>
                  <td className="py-2 text-green-600">+30</td>
                  <td className="py-2">Puntos acumulados</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">15/12/2024</td>
                  <td className="py-2">Batería</td>
                  <td className="py-2">Toyota Corolla</td>
                  <td className="py-2 text-green-600">+300</td>
                  <td className="py-2">$15,000 descuento aplicado</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Puntos Canjeables */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">🎁 Canjea tus Puntos EcoAV10</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">Cambio de Aceite</h3>
              <p className="text-sm text-gray-600">Servicio completo</p>
              <p className="text-lg font-bold text-green-600">1,000 puntos</p>
              <button className="w-full bg-green-600 text-white py-2 rounded mt-2 hover:bg-green-700">
                Canjear
              </button>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">Alineación</h3>
              <p className="text-sm text-gray-600">Alineación computarizada</p>
              <p className="text-lg font-bold text-blue-600">800 puntos</p>
              <button className="w-full bg-blue-600 text-white py-2 rounded mt-2 hover:bg-blue-700">
                Canjear
              </button>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">Revisión Completa</h3>
              <p className="text-sm text-gray-600">Check-up vehicular</p>
              <p className="text-lg font-bold text-purple-600">600 puntos</p>
              <button className="w-full bg-purple-600 text-white py-2 rounded mt-2 hover:bg-purple-700">
                Canjear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClienteReciclaje;
