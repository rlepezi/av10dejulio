import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const categorias = [
    { value: 'all', label: 'Todas las Categorías', icon: '❓' },
    { value: 'mantenimiento', label: 'Mantenimiento Vehicular', icon: '🔧' },
    { value: 'repuestos', label: 'Selección de Repuestos', icon: '⚙️' },
    { value: 'seguridad', label: 'Seguridad Vial', icon: '🛡️' },
    { value: 'general', label: 'General', icon: '💡' },
    { value: 'plataforma', label: 'Uso de la Plataforma', icon: '💻' }
  ];

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    try {
      // Obtener FAQs de la base de datos
      const q = query(
        collection(db, 'recursos_educativos'),
        where('tipo', '==', 'faq'),
        where('estado', '==', 'activo'),
        orderBy('orden', 'asc'),
        orderBy('fechaCreacion', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const faqsFromDB = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // FAQs predefinidas comunes
      const defaultFAQs = [
        {
          id: 'faq-que-es-plataforma',
          titulo: '¿Qué es la plataforma Av. 10 de Julio?',
          contenido: 'Somos una plataforma digital que conecta a más de 200 proveedores del sector automotriz de la Av. 10 de Julio con clientes que buscan repuestos y servicios de calidad. Facilitamos la búsqueda y comparación de productos, permitiendo a los usuarios encontrar exactamente lo que necesitan.',
          categoria: 'plataforma',
          orden: 1
        },
        {
          id: 'faq-como-buscar-repuestos',
          titulo: '¿Cómo puedo buscar repuestos específicos?',
          contenido: 'Puedes buscar repuestos usando nuestros filtros por marca vehicular, categoría de producto, o utilizando la barra de búsqueda. También puedes navegar por proveedores específicos y ver sus catálogos completos.',
          categoria: 'repuestos',
          orden: 2
        },
        {
          id: 'faq-como-contactar-proveedor',
          titulo: '¿Cómo contacto a un proveedor?',
          contenido: 'En cada perfil de proveedor encontrarás información de contacto incluyendo teléfono, email y dirección. También puedes ver su ubicación en el mapa integrado para visitarlos directamente.',
          categoria: 'plataforma',
          orden: 3
        },
        {
          id: 'faq-mantenimiento-preventivo',
          titulo: '¿Con qué frecuencia debo hacer mantenimiento preventivo?',
          contenido: 'El mantenimiento preventivo debe realizarse según las especificaciones del fabricante, generalmente cada 5,000-10,000 km o cada 6 meses. Incluye cambio de aceite, filtros, revisión de frenos y sistema eléctrico.',
          categoria: 'mantenimiento',
          orden: 4
        },
        {
          id: 'faq-elegir-aceite-motor',
          titulo: '¿Cómo elegir el aceite correcto para mi motor?',
          contenido: 'Debes considerar la viscosidad recomendada por el fabricante (ej: 5W-30), el tipo de motor (gasolina/diésel), la edad del vehículo y las condiciones de manejo. Consulta el manual del propietario o pregunta a un especialista.',
          categoria: 'mantenimiento',
          orden: 5
        },
        {
          id: 'faq-cuando-cambiar-frenos',
          titulo: '¿Cuándo debo cambiar las pastillas de freno?',
          contenido: 'Las pastillas de freno deben cambiarse cuando el grosor sea menor a 3mm, escuches chirridos al frenar, sientas vibraciones en el pedal, o notes que el vehículo se desvía al frenar. La revisión debe ser cada 20,000-30,000 km.',
          categoria: 'mantenimiento',
          orden: 6
        },
        {
          id: 'faq-repuestos-originales-vs-alternativos',
          titulo: '¿Repuestos originales vs alternativos?',
          contenido: 'Los repuestos originales garantizan compatibilidad total pero son más costosos. Los alternativos de calidad pueden ofrecer buen rendimiento a menor precio. Busca marcas reconocidas y verifica garantías.',
          categoria: 'repuestos',
          orden: 7
        },
        {
          id: 'faq-seguridad-conduccion',
          titulo: '¿Cuáles son los elementos básicos de seguridad?',
          contenido: 'Mantén siempre en buen estado: neumáticos (presión y desgaste), frenos, luces, cinturones de seguridad, espejos y limpiaparabrisas. Revisa regularmente el sistema de suspensión y dirección.',
          categoria: 'seguridad',
          orden: 8
        }
      ];

      // Combinar FAQs de la base de datos con las predefinidas
      const allFAQs = [...defaultFAQs, ...faqsFromDB].sort((a, b) => a.orden - b.orden);
      setFaqs(allFAQs);
    } catch (err) {
      console.error('Error fetching FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.categoria === activeCategory;
    const matchesSearch = !searchTerm || 
      faq.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.contenido.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const toggleExpanded = (faqId) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const getCategoriaIcon = (categoria) => {
    const cat = categorias.find(c => c.value === categoria);
    return cat ? cat.icon : '❓';
  };

  const getCategoriaLabel = (categoria) => {
    const cat = categorias.find(c => c.value === categoria);
    return cat ? cat.label : categoria;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ❓ Preguntas Frecuentes
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Encuentra respuestas a las preguntas más comunes sobre mantenimiento vehicular, 
            repuestos y el uso de nuestra plataforma.
          </p>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar en preguntas frecuentes
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar pregunta o respuesta..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtro por categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categorias.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtros rápidos */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">Filtros rápidos:</span>
            {categorias.slice(1).map(cat => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resultados */}
        <div className="mb-4 text-sm text-gray-600">
          {loading ? 'Cargando...' : `${filteredFAQs.length} preguntas encontradas`}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredFAQs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🤔</div>
            <h3 className="text-xl font-medium mb-2">No se encontraron preguntas</h3>
            <p>Intenta ajustar los filtros o términos de búsqueda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => (
              <div
                key={faq.id}
                className="bg-white rounded-lg shadow-sm border overflow-hidden"
              >
                <button
                  onClick={() => toggleExpanded(faq.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xl mt-1">{getCategoriaIcon(faq.categoria)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {faq.titulo}
                      </h3>
                      <div className="text-sm text-gray-500 mt-1">
                        {getCategoriaLabel(faq.categoria)}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl text-gray-400">
                    {expandedFaq === faq.id ? '−' : '+'}
                  </div>
                </button>
                
                {expandedFaq === faq.id && (
                  <div className="px-6 py-4 border-t bg-gray-50">
                    <div className="text-gray-800 leading-relaxed">
                      {faq.contenido.split('\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-3 last:mb-0">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Call to action */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            ¿No encontraste lo que buscabas?
          </h2>
          <p className="text-blue-800 mb-6">
            Explora nuestros recursos educativos o contacta directamente con nuestros proveedores especializados.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => window.location.href = '/recursos'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              📚 Ver Recursos Educativos
            </button>
            <button
              onClick={() => window.location.href = '/proveedores'}
              className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 font-medium"
            >
              🏪 Buscar Proveedores
            </button>
          </div>
        </div>

        {/* Categorías populares */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📂 Categorías Populares
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorias.slice(1).map(categoria => {
              const count = faqs.filter(faq => faq.categoria === categoria.value).length;
              return (
                <button
                  key={categoria.value}
                  onClick={() => setActiveCategory(categoria.value)}
                  className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{categoria.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {categoria.label}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {count} pregunta{count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
