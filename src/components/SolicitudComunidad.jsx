import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderMenu from './HeaderMenu';

export default function SolicitudComunidad() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');

  const communityRoles = [
    {
      id: 'cliente',
      title: '🚗 Cliente',
      description: 'Propietarios de vehículos que buscan servicios confiables',
      benefits: [
        'Acceso a proveedores verificados',
        'Historial de servicios',
        'Promociones exclusivas',
        'Seguimiento de mantenimiento'
      ],
      action: 'Registrarse como Cliente',
      route: '/registro-cliente'
    },
    {
      id: 'proveedor',
      title: '🏪 Proveedor',
      description: 'Empresas y talleres que ofrecen servicios automotrices',
      benefits: [
        'Acceso a base de clientes',
        'Herramientas de gestión',
        'Promoción digital',
        'Red de contactos profesionales'
      ],
      action: 'Registrarse como Proveedor',
      route: '/registro-proveedor'
    },
    {
      id: 'agente',
      title: '👨‍💼 Agente de Campo',
      description: 'Profesionales que conectan empresas con la comunidad',
      benefits: [
        'Comisiones por registro',
        'Herramientas de trabajo',
        'Capacitación continua',
        'Flexibilidad horaria'
      ],
      action: 'Registrarse como Agente',
      route: '/registro-agente'
    }
  ];

  const handleRoleSelection = (role) => {
    navigate(role.route);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderMenu />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            💎 Únete a la Comunidad AV10 de Julio
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Somos una comunidad integral del sector automotriz que conecta <strong>clientes</strong>, 
            <strong> proveedores</strong> y <strong>agentes de campo</strong> en un ecosistema colaborativo.
          </p>
        </div>

        {/* Community Stats */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Nuestra Comunidad en Números
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-700">Clientes Activos</div>
              <div className="text-sm text-gray-500 mt-1">Propietarios de vehículos</div>
            </div>
            <div className="p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">200+</div>
              <div className="text-gray-700">Proveedores Verificados</div>
              <div className="text-sm text-gray-500 mt-1">Talleres y empresas</div>
            </div>
            <div className="p-6 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-gray-700">Agentes de Campo</div>
              <div className="text-sm text-gray-500 mt-1">Conectores de la comunidad</div>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            ¿Cómo quieres formar parte?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {communityRoles.map((role) => (
              <div key={role.id} className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-blue-300 transition-colors">
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-4">{role.title.split(' ')[0]}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {role.title.slice(2)}
                    </h3>
                    <p className="text-gray-600">{role.description}</p>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Beneficios:</h4>
                    <ul className="space-y-2">
                      {role.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-green-500 mt-1">✓</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleRoleSelection(role)}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    {role.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Community Values */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white p-8 mb-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">¿Por qué AV10 de Julio?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  🤝 <span>Colaboración</span>
                </h3>
                <p className="text-blue-100">
                  Creamos conexiones reales entre todos los actores del ecosistema automotriz, 
                  facilitando relaciones de confianza y beneficio mutuo.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  🔍 <span>Transparencia</span>
                </h3>
                <p className="text-blue-100">
                  Todos nuestros proveedores están verificados y los clientes pueden acceder 
                  a reseñas reales y servicios de calidad garantizada.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  🚀 <span>Crecimiento</span>
                </h3>
                <p className="text-blue-100">
                  Ofrecemos herramientas y oportunidades para que cada miembro de la comunidad 
                  pueda crecer y desarrollarse profesionalmente.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  🌟 <span>Innovación</span>
                </h3>
                <p className="text-blue-100">
                  Incorporamos tecnología y mejores prácticas para hacer más eficiente 
                  y conveniente la experiencia automotriz.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¿Tienes preguntas?
          </h2>
          <p className="text-gray-600 mb-6">
            Nuestro equipo está aquí para ayudarte a encontrar tu lugar en la comunidad.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/contacto')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              💬 Contactar Asesor
            </button>
            <button
              onClick={() => navigate('/recursos')}
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              📚 Ver Recursos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
