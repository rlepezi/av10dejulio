import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import HeaderMenu from '../components/HeaderMenu';

const AreaClientePage = () => {
  const navigate = useNavigate();
  const [estadisticas, setEstadisticas] = useState({
    totalClientes: 0,
    totalEmpresas: 0,
    transaccionesEsteMes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      // Cargar estadísticas de clientes
      const clientesQuery = query(
        collection(db, 'usuarios'),
        where('rol', '==', 'cliente')
      );
      const clientesSnapshot = await getDocs(clientesQuery);
      
      // Cargar estadísticas de empresas activas
      const empresasQuery = query(
        collection(db, 'empresas'),
        where('estado', '==', 'activa')
      );
      const empresasSnapshot = await getDocs(empresasQuery);

      setEstadisticas({
        totalClientes: clientesSnapshot.docs.length,
        totalEmpresas: empresasSnapshot.docs.length,
        transaccionesEsteMes: Math.floor(Math.random() * 150) + 200 // Simulado por ahora
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      // Valores por defecto si hay error
      setEstadisticas({
        totalClientes: 150,
        totalEmpresas: 80,
        transaccionesEsteMes: 320
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderMenu />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="mb-6">
              <span className="bg-yellow-400 text-green-900 px-4 py-2 rounded-full text-sm font-bold">
                ¡ÚNETE A NUESTRA COMUNIDAD!
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              🌟 Área Cliente
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-4xl mx-auto">
              Descubre los increíbles beneficios de ser parte de nuestra comunidad de 
              <strong className="text-yellow-400"> {estadisticas.totalClientes}+ clientes registrados</strong> que 
              ya disfrutan de acceso exclusivo a los mejores servicios automotrices.
            </p>
            
            {/* Estadísticas destacadas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-4xl font-bold text-yellow-400 mb-2">
                  {loading ? '...' : estadisticas.totalClientes}+
                </div>
                <div className="text-green-100">Clientes Registrados</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-4xl font-bold text-yellow-400 mb-2">
                  {loading ? '...' : estadisticas.totalEmpresas}+
                </div>
                <div className="text-green-100">Empresas Verificadas</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-4xl font-bold text-yellow-400 mb-2">
                  {loading ? '...' : estadisticas.transaccionesEsteMes}+
                </div>
                <div className="text-green-100">Consultas Este Mes</div>
              </div>
            </div>

            {/* Botones principales */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/login?tipo=cliente')}
                className="bg-yellow-400 text-green-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors shadow-xl"
              >
                🔑 Ya Soy Cliente - Ingresar
              </button>
              <button
                onClick={() => navigate('/registro-cliente')}
                className="bg-white text-green-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-50 transition-colors shadow-xl"
              >
                ✨ Quiero Ser Cliente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Beneficios de ser Cliente */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            💎 Beneficios Exclusivos Para Clientes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Al registrarte como cliente, tendrás acceso a una red exclusiva de servicios 
            automotrices con beneficios que no encontrarás en ningún otro lugar.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">💰</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Precios Preferenciales</h3>
            <p className="text-gray-600 mb-6">
              Accede a descuentos exclusivos y precios especiales en todos los servicios 
              de nuestras empresas afiliadas.
            </p>
            <div className="bg-green-50 p-4 rounded-lg">
              <span className="text-green-700 font-semibold">Hasta 25% de descuento</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⭐</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Atención Prioritaria</h3>
            <p className="text-gray-600 mb-6">
              Recibe atención preferencial en todos nuestros proveedores afiliados 
              con citas prioritarias y servicio VIP.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <span className="text-blue-700 font-semibold">Servicio VIP garantizado</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🎁</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Promociones Exclusivas</h3>
            <p className="text-gray-600 mb-6">
              Participa en promociones especiales, sorteos y eventos exclusivos 
              solo para miembros de nuestra comunidad.
            </p>
            <div className="bg-purple-50 p-4 rounded-lg">
              <span className="text-purple-700 font-semibold">Eventos mensales</span>
            </div>
          </div>
        </div>

        {/* Testimonios */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            💬 Lo que Dicen Nuestros Clientes
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold">JC</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Juan Carlos M.</div>
                  <div className="text-gray-600 text-sm">Cliente desde 2023</div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Desde que me registré como cliente, he ahorrado más del 30% en servicios 
                automotrices. La atención es excelente y siempre hay promociones increíbles."
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-600 font-bold">MR</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">María Rodriguez</div>
                  <div className="text-gray-600 text-sm">Cliente desde 2022</div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "La calidad de los proveedores es excepcional. Como cliente registrada, 
                siempre recibo el mejor servicio y precios justos."
              </p>
            </div>
          </div>
        </div>

        {/* Por qué las empresas quieren estar aquí */}
        <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-8 mb-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              🎯 ¿Por Qué Tantas Empresas Quieren Estar Aquí?
            </h3>
            <p className="text-xl text-gray-700">
              Porque tenemos una base sólida de <strong>{estadisticas.totalClientes}+ clientes registrados</strong> 
              que buscan activamente servicios automotrices de calidad.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4">📊 Demanda Constante</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> {estadisticas.transaccionesEsteMes}+ consultas mensuales</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Clientes activos todo el año</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Búsquedas específicas por categoría</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4">💎 Clientes de Calidad</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Perfil verificado y confiable</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Buscan calidad, no solo precio</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Leales a buenos proveedores</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action Final */}
        <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 rounded-2xl text-white p-12 text-center">
          <h3 className="text-4xl font-bold mb-6">
            🚀 ¡Únete a Nuestra Comunidad Hoy!
          </h3>
          <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
            Forma parte de la red automotriz más grande de la Av. 10 de Julio. 
            Miles de clientes ya confían en nosotros para encontrar los mejores servicios.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => navigate('/registro-cliente')}
              className="bg-yellow-400 text-green-900 px-10 py-4 rounded-xl font-bold text-xl hover:bg-yellow-300 transition-colors shadow-xl"
            >
              ✨ Registrarme Como Cliente
            </button>
            <button
              onClick={() => navigate('/login?tipo=cliente')}
              className="bg-white text-green-700 px-10 py-4 rounded-xl font-bold text-xl hover:bg-green-50 transition-colors shadow-xl"
            >
              🔑 Ya Tengo Cuenta
            </button>
            <button
              onClick={() => navigate('/proveedores')}
              className="border-2 border-white text-white px-10 py-4 rounded-xl font-bold text-xl hover:bg-white hover:text-green-700 transition-colors"
            >
              🔍 Ver Proveedores
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaClientePage;
