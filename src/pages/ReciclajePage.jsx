import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export default function ReciclajePage() {
  const navigate = useNavigate();
  const { user, rol } = useAuth();
  const [empresasReciclaje, setEmpresasReciclaje] = useState([]);
  const [consejosReciclaje, setConsejosReciclaje] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatosReciclaje();
  }, []);

  const cargarDatosReciclaje = async () => {
    try {
      // Cargar empresas de reciclaje
      const empresasQuery = query(
        collection(db, 'empresas'),
        where('categorias', 'array-contains', 'reciclaje'),
        where('estado', '==', 'activa'),
        orderBy('fechaCreacion', 'desc'),
        limit(10)
      );
      const empresasSnapshot = await getDocs(empresasQuery);
      const empresasData = empresasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmpresasReciclaje(empresasData);

      // Consejos de reciclaje
      setConsejosReciclaje([
        {
          id: 1,
          titulo: 'Aceite de Motor Usado',
          descripcion: 'Nunca viertas aceite usado en el desagüe. Llévalo a centros de reciclaje autorizados.',
          categoria: 'aceite',
          impacto: 'alto',
          icono: '🛢️'
        },
        {
          id: 2,
          titulo: 'Baterías de Vehículos',
          descripcion: 'Las baterías contienen plomo y ácido. Entrégalas en talleres o centros de reciclaje.',
          categoria: 'baterias',
          impacto: 'alto',
          icono: '🔋'
        },
        {
          id: 3,
          titulo: 'Neumáticos Usados',
          descripcion: 'Los neumáticos se pueden reciclar en asfalto, césped artificial y más productos.',
          categoria: 'neumaticos',
          impacto: 'medio',
          icono: '🛞'
        },
        {
          id: 4,
          titulo: 'Filtros de Aire y Combustible',
          descripcion: 'Los filtros usados contienen metales pesados. Recíclalos correctamente.',
          categoria: 'filtros',
          impacto: 'medio',
          icono: '🧽'
        },
        {
          id: 5,
          titulo: 'Líquidos de Frenos y Refrigerante',
          descripcion: 'Estos líquidos son tóxicos. Nunca los mezcles con otros residuos.',
          categoria: 'liquidos',
          impacto: 'alto',
          icono: '💧'
        },
        {
          id: 6,
          titulo: 'Repuestos Metálicos',
          descripcion: 'El metal se puede fundir y reutilizar infinitamente. Sepáralo del resto.',
          categoria: 'metal',
          impacto: 'medio',
          icono: '🔧'
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos de reciclaje:', error);
      setLoading(false);
    }
  };

  const getImpactoColor = (impacto) => {
    switch (impacto) {
      case 'alto': return 'bg-red-100 text-red-800';
      case 'medio': return 'bg-yellow-100 text-yellow-800';
      case 'bajo': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactoTexto = (impacto) => {
    switch (impacto) {
      case 'alto': return 'Alto Impacto';
      case 'medio': return 'Medio Impacto';
      case 'bajo': return 'Bajo Impacto';
      default: return 'Impacto';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Cargando información de reciclaje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              ♻️ Reciclaje Automotriz
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              {!user ? (
                'Construyendo una comunidad automotriz sostenible en AV10 de Julio. Conectamos clientes con proveedores de reciclaje para un futuro más verde.'
              ) : rol === 'cliente' ? (
                `¡Hola ${user.displayName || 'Cliente'}! Accede a tu dashboard para gestionar el reciclaje de tus vehículos y conectar con proveedores sostenibles.`
              ) : rol === 'empresa' || rol === 'proveedor' ? (
                `¡Hola ${user.displayName || 'Proveedor'}! Accede a tu dashboard para ofrecer servicios de reciclaje y conectar con clientes comprometidos con el medio ambiente.`
              ) : (
                'Construyendo una comunidad automotriz sostenible en AV10 de Julio. Conectamos clientes con proveedores de reciclaje para un futuro más verde.'
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                // Usuario no logueado - mostrar ambas opciones
                <>
                  <button
                    onClick={() => navigate('/registro-cliente')}
                    className="bg-white text-green-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Soy Cliente - Quiero Reciclar
                  </button>
                  <button
                    onClick={() => navigate('/registro-empresa')}
                    className="bg-green-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-400 transition-colors"
                  >
                    Soy Proveedor - Ofrezco Reciclaje
                  </button>
                </>
              ) : rol === 'cliente' ? (
                // Usuario logueado como cliente
                <button
                  onClick={() => navigate('/dashboard/reciclaje/cliente')}
                  className="bg-white text-green-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                >
                  ♻️ Ir a Mi Dashboard de Reciclaje
                </button>
              ) : rol === 'empresa' || rol === 'proveedor' ? (
                // Usuario logueado como empresa/proveedor
                <button
                  onClick={() => navigate('/dashboard/reciclaje/proveedor')}
                  className="bg-green-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-400 transition-colors"
                >
                  🏭 Ir a Mi Dashboard de Reciclaje
                </button>
              ) : (
                // Usuario logueado pero rol no identificado
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-400 transition-colors"
                >
                  🔑 Ir a Mi Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Información Personalizada para Usuarios Logueados */}
      {user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-green-200">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {rol === 'cliente' ? '♻️ Tu Panel de Reciclaje' : '🏭 Tu Panel de Servicios de Reciclaje'}
              </h2>
              <p className="text-gray-600">
                {rol === 'cliente' 
                  ? 'Accede a tu dashboard para gestionar el reciclaje de tus vehículos y encontrar proveedores sostenibles.'
                  : 'Accede a tu dashboard para ofrecer servicios de reciclaje y conectar con clientes comprometidos.'
                }
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {rol === 'cliente' ? '🚗 Mis Vehículos' : '🏭 Mis Servicios'}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {rol === 'cliente' 
                    ? 'Gestiona tus vehículos y programa recordatorios de mantenimiento.'
                    : 'Gestiona tus servicios de reciclaje y actualiza tu catálogo.'
                  }
                </p>
                <button
                  onClick={() => navigate(rol === 'cliente' ? '/dashboard/reciclaje/cliente' : '/dashboard/reciclaje/proveedor')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Ir al Dashboard
                </button>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {rol === 'cliente' ? '🔍 Buscar Proveedores' : '👥 Ver Clientes'}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {rol === 'cliente' 
                    ? 'Encuentra empresas de reciclaje cercanas y confiables.'
                    : 'Conecta con clientes que buscan servicios de reciclaje.'
                  }
                </p>
                <button
                  onClick={() => navigate(rol === 'cliente' ? '/empresas' : '/dashboard/proveedor')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  {rol === 'cliente' ? 'Buscar Empresas' : 'Ver Clientes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas de Impacto */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            🌱 Nuestro Impacto Ambiental
          </h2>
          <p className="text-xl text-gray-600">
            Juntos estamos transformando la industria automotriz en AV10 de Julio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🛢️</span>
            </div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">2,500+</h3>
            <p className="text-gray-600">Litros de aceite reciclados</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔋</span>
            </div>
            <h3 className="text-2xl font-bold text-blue-600 mb-2">500+</h3>
            <p className="text-gray-600">Baterías procesadas</p>
          </div>
          
          <div className="text-center">
            <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🛞</span>
            </div>
            <h3 className="text-2xl font-bold text-yellow-600 mb-2">1,200+</h3>
            <p className="text-gray-600">Neumáticos reciclados</p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏭</span>
            </div>
            <h3 className="text-2xl font-bold text-purple-600 mb-2">25+</h3>
            <p className="text-gray-600">Empresas comprometidas</p>
          </div>
        </div>
      </div>

      {/* Cómo Funciona */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🔄 ¿Cómo Funciona el Reciclaje?
            </h2>
            <p className="text-xl text-gray-600">
              Un proceso simple y efectivo para todos los miembros de la comunidad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Identifica</h3>
              <p className="text-gray-600">
                Identifica los residuos automotrices que necesitas reciclar: aceite, baterías, neumáticos, etc.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Conecta</h3>
              <p className="text-gray-600">
                Encuentra proveedores de reciclaje cercanos en nuestra comunidad que puedan procesar tus residuos.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Recicla</h3>
              <p className="text-gray-600">
                Entrega tus residuos de forma segura y contribuye a un futuro más sostenible para todos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Consejos de Reciclaje */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            💡 Guía de Reciclaje Automotriz
          </h2>
          <p className="text-xl text-gray-600">
            Aprende cómo reciclar correctamente cada tipo de residuo automotriz
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {consejosReciclaje.map((consejo) => (
            <div key={consejo.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{consejo.icono}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getImpactoColor(consejo.impacto)}`}>
                  {getImpactoTexto(consejo.impacto)}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{consejo.titulo}</h3>
              <p className="text-gray-600 text-sm">{consejo.descripcion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Empresas de Reciclaje */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🏭 Empresas de Reciclaje en la Comunidad
            </h2>
            <p className="text-xl text-gray-600">
              Conecta con proveedores comprometidos con el medio ambiente
            </p>
          </div>

          {empresasReciclaje.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏭</div>
              <p className="text-gray-600 mb-4">Aún no hay empresas de reciclaje registradas</p>
              <p className="text-gray-500 mb-6">¿Eres una empresa de reciclaje? ¡Únete a nuestra comunidad!</p>
              <button
                onClick={() => navigate('/registro-empresa')}
                className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Registrarme como Empresa de Reciclaje
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {empresasReciclaje.map((empresa) => (
                <div key={empresa.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-3 rounded-lg">
                        <span className="text-2xl">🏭</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{empresa.nombre}</h3>
                        <p className="text-sm text-gray-600">{empresa.direccion}</p>
                      </div>
                    </div>
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      ♻️ Reciclaje
                    </span>
                  </div>
                  
                  {empresa.telefono && (
                    <p className="text-sm text-blue-600 mb-3">📞 {empresa.telefono}</p>
                  )}
                  
                  {empresa.categorias && empresa.categorias.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">Servicios de reciclaje:</p>
                      <div className="flex flex-wrap gap-1">
                        {empresa.categorias
                          .filter(cat => cat !== 'reciclaje')
                          .slice(0, 3)
                          .map((categoria, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {categoria}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/empresa/${empresa.id}`)}
                      className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-green-700 transition-colors"
                    >
                      Ver Perfil
                    </button>
                    <button
                      onClick={() => navigate(`/contacto?empresa=${empresa.id}`)}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Contactar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            🌍 Únete a la Revolución del Reciclaje
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Cada residuo reciclado es un paso hacia un futuro más sostenible. 
            Sé parte del cambio en AV10 de Julio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              // Usuario no logueado - mostrar ambas opciones
              <>
                <button
                  onClick={() => navigate('/registro-cliente')}
                  className="bg-white text-green-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                >
                  Comenzar a Reciclar
                </button>
                <button
                  onClick={() => navigate('/registro-empresa')}
                  className="bg-green-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-400 transition-colors"
                >
                  Ofrecer Servicios de Reciclaje
                </button>
              </>
            ) : rol === 'cliente' ? (
              // Usuario logueado como cliente
              <button
                onClick={() => navigate('/dashboard/reciclaje/cliente')}
                className="bg-white text-green-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                ♻️ Ir a Mi Dashboard de Reciclaje
              </button>
            ) : rol === 'empresa' || rol === 'proveedor' ? (
              // Usuario logueado como empresa/proveedor
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/dashboard/reciclaje/proveedor')}
                  className="bg-green-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-400 transition-colors"
                >
                  🏭 Ir a Mi Dashboard de Reciclaje
                </button>
                <button
                  onClick={() => navigate('/registro/empresa/reciclaje')}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-500 transition-colors"
                >
                  ✨ Actualizar Servicios de Reciclaje
                </button>
              </div>
            ) : (
              // Usuario logueado pero rol no identificado
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-400 transition-colors"
              >
                🔑 Ir a Mi Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
