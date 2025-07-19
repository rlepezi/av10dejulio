import React, { useState } from 'react';
import { 
  ChatIcon,
  LightBulbIcon,
  ExclamationCircleIcon,
  XIcon
} from '@heroicons/react/outline';

const QuickFeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const feedbackTypes = [
    {
      id: 'suggestion',
      title: 'Sugerencia',
      description: 'Comparte una idea para mejorar',
      icon: LightBulbIcon,
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      id: 'complaint',
      title: 'Reclamo',
      description: 'Reporta un problema',
      icon: ExclamationCircleIcon,
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      id: 'general',
      title: 'Consulta',
      description: 'Haz una pregunta',
      icon: ChatIcon,
      color: 'bg-blue-500 hover:bg-blue-600'
    }
  ];

  const handleTypeSelect = (type) => {
    // Redirigir a la página de contacto con el tipo preseleccionado
    window.location.href = `/contacto?type=${type}`;
  };

  return (
    <>
      {/* Botón flotante */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
          aria-label="Feedback rápido"
        >
          {isOpen ? (
            <XIcon className="h-6 w-6" />
          ) : (
            <ChatIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Widget expandido */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Cómo podemos ayudarte?
              </h3>
              <p className="text-sm text-gray-600">
                Selecciona el tipo de mensaje que quieres enviar
              </p>
            </div>

            <div className="space-y-2">
              {feedbackTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className={`w-full flex items-center p-3 rounded-lg text-white transition-colors ${type.color}`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">{type.title}</div>
                      <div className="text-sm opacity-90">{type.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200">
              <a
                href="/contacto"
                className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Ver todas las opciones
              </a>
            </div>
          </div>

          {/* Overlay para cerrar */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
        </div>
      )}
    </>
  );
};

export default QuickFeedbackWidget;
