import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ContactForm from '../components/ContactForm';
import {
  ChatIcon,
  LightBulbIcon,
  ExclamationCircleIcon,
  CogIcon,
  PhoneIcon,
  MailIcon,
  LocationMarkerIcon
} from '@heroicons/react/outline';

const ContactPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState('general');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam && ['general', 'suggestion', 'complaint', 'support'].includes(typeParam)) {
      setSelectedType(typeParam);
      setShowForm(true);
    }
  }, [searchParams]);

  const contactTypes = [
    {
      id: 'general',
      title: 'Consulta General',
      description: 'Información sobre productos, servicios o la plataforma',
      icon: ChatIcon,
      color: 'blue'
    },
    {
      id: 'suggestion',
      title: 'Sugerencias',
      description: 'Comparte ideas para mejorar la plataforma',
      icon: LightBulbIcon,
      color: 'yellow'
    },
    {
      id: 'complaint',
      title: 'Reclamos',
      description: 'Reporta problemas o inconvenientes',
      icon: ExclamationCircleIcon,
      color: 'red'
    },
    {
      id: 'support',
      title: 'Soporte Técnico',
      description: 'Ayuda con problemas técnicos de la plataforma',
      icon: CogIcon,
      color: 'green'
    }
  ];

  const getColorClasses = (color, isSelected = false) => {
    const colors = {
      blue: isSelected 
        ? 'border-blue-500 bg-blue-50' 
        : 'border-gray-200 hover:border-blue-300',
      yellow: isSelected 
        ? 'border-yellow-500 bg-yellow-50' 
        : 'border-gray-200 hover:border-yellow-300',
      red: isSelected 
        ? 'border-red-500 bg-red-50' 
        : 'border-gray-200 hover:border-red-300',
      green: isSelected 
        ? 'border-green-500 bg-green-50' 
        : 'border-gray-200 hover:border-green-300'
    };
    return colors[color];
  };

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-600',
      yellow: 'text-yellow-600',
      red: 'text-red-600',
      green: 'text-green-600'
    };
    return colors[color];
  };

  const handleFormSubmitted = () => {
    setShowForm(false);
    // Mostrar mensaje de éxito o redirigir
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Contáctanos
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Estamos aquí para ayudarte. Elige el tipo de consulta que mejor se adapte a tu necesidad 
              y nos pondremos en contacto contigo lo antes posible.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información de contacto */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información de Contacto
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium text-gray-900">+56 2 2345 6789</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <MailIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">contacto@av10dejulio.cl</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <LocationMarkerIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Dirección</p>
                    <p className="font-medium text-gray-900">
                      Av. 10 de Julio 1234<br />
                      Santiago, Chile
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Horarios de Atención
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Lunes - Viernes</span>
                  <span className="font-medium text-gray-900">9:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sábado</span>
                  <span className="font-medium text-gray-900">9:00 - 14:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Domingo</span>
                  <span className="font-medium text-gray-900">Cerrado</span>
                </div>
              </div>
            </div>

            {/* Enlace a tickets del usuario */}
            <div className="mt-6">
              <a
                href="/mis-consultas"
                className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Ver mis consultas anteriores
              </a>
            </div>
          </div>

          {/* Formulario de contacto */}
          <div className="lg:col-span-2">
            {!showForm ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  ¿En qué podemos ayudarte?
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {contactTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.id;
                    
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${getColorClasses(type.color, isSelected)}`}
                      >
                        <div className="flex items-start">
                          <Icon className={`h-6 w-6 mr-3 mt-1 ${getIconColor(type.color)}`} />
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              {type.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {type.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Continuar con {contactTypes.find(t => t.id === selectedType)?.title}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {contactTypes.find(t => t.id === selectedType)?.title}
                  </h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Volver</span>
                    ←
                  </button>
                </div>
                
                <ContactForm
                  type={selectedType}
                  onSubmitted={handleFormSubmitted}
                  className="max-w-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
