import React, { useState } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

const ContactForm = ({ 
  type = 'general', // general, suggestion, complaint, support
  onSubmitted = () => {},
  className = ''
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nombre: user?.displayName || '',
    email: user?.email || '',
    telefono: '',
    asunto: '',
    categoria: '',
    mensaje: '',
    prioridad: 'media'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const categorias = {
    general: [
      'Información general',
      'Consulta sobre productos',
      'Consulta sobre servicios',
      'Otros'
    ],
    suggestion: [
      'Mejora de funcionalidades',
      'Nueva característica',
      'Mejora de diseño',
      'Mejora de contenido',
      'Otros'
    ],
    complaint: [
      'Problema con proveedor',
      'Problema técnico',
      'Problema de calidad',
      'Problema de servicio',
      'Otros'
    ],
    support: [
      'Problema técnico',
      'Ayuda con cuenta',
      'Ayuda con pedidos',
      'Ayuda con navegación',
      'Otros'
    ]
  };

  const prioridades = [
    { value: 'baja', label: '🟢 Baja', color: 'text-green-600' },
    { value: 'media', label: '🟡 Media', color: 'text-yellow-600' },
    { value: 'alta', label: '🟠 Alta', color: 'text-orange-600' },
    { value: 'urgente', label: '🔴 Urgente', color: 'text-red-600' }
  ];

  const getTitles = () => {
    switch (type) {
      case 'suggestion':
        return {
          title: '💡 Formulario de Sugerencias',
          subtitle: 'Ayúdanos a mejorar con tus ideas y comentarios',
          buttonText: 'Enviar Sugerencia'
        };
      case 'complaint':
        return {
          title: '⚠️ Formulario de Reclamos',
          subtitle: 'Reporta cualquier problema o inconveniente',
          buttonText: 'Enviar Reclamo'
        };
      case 'support':
        return {
          title: '🆘 Formulario de Soporte',
          subtitle: 'Obtén ayuda técnica y resuelve tus dudas',
          buttonText: 'Solicitar Ayuda'
        };
      default:
        return {
          title: '📧 Formulario de Contacto',
          subtitle: 'Contáctanos para cualquier consulta',
          buttonText: 'Enviar Mensaje'
        };
    }
  };

  const { title, subtitle, buttonText } = getTitles();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validaciones
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      setIsSubmitting(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('El email es requerido');
      setIsSubmitting(false);
      return;
    }

    if (!formData.asunto.trim()) {
      setError('El asunto es requerido');
      setIsSubmitting(false);
      return;
    }

    if (!formData.mensaje.trim() || formData.mensaje.trim().length < 10) {
      setError('El mensaje debe tener al menos 10 caracteres');
      setIsSubmitting(false);
      return;
    }

    try {
      const ticketData = {
        ...formData,
        tipo: type,
        estado: 'abierto',
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        usuarioId: user?.uid || null,
        respuestas: [],
        visto: false,
        resuelto: false
      };

      const docRef = await addDoc(collection(db, 'tickets'), ticketData);
      
      setSubmitted(true);
      onSubmitted(docRef.id);
      
      // Reset form
      setFormData({
        nombre: user?.displayName || '',
        email: user?.email || '',
        telefono: '',
        asunto: '',
        categoria: '',
        mensaje: '',
        prioridad: 'media'
      });

    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Error al enviar el formulario. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    const getSuccessMessage = () => {
      switch (type) {
        case 'suggestion':
          return {
            title: '¡Sugerencia recibida!',
            message: 'Agradecemos tu sugerencia para mejorar nuestra plataforma.',
            detail: 'Nuestro equipo revisará tu propuesta y considerará implementarla en futuras actualizaciones.',
            followUp: 'Te mantendremos informado sobre el estado de tu sugerencia.'
          };
        case 'complaint':
          return {
            title: '¡Reclamo registrado!',
            message: 'Hemos registrado tu reclamo y lo estamos investigando.',
            detail: 'Nuestro equipo de atención al cliente revisará tu caso prioritariamente.',
            followUp: 'Te contactaremos dentro de las próximas 24 horas para darte seguimiento.'
          };
        case 'support':
          return {
            title: '¡Solicitud de soporte recibida!',
            message: 'Hemos recibido tu solicitud de ayuda técnica.',
            detail: 'Nuestro equipo técnico está revisando tu consulta para brindarte la mejor solución.',
            followUp: 'Te responderemos con una solución o pasos a seguir muy pronto.'
          };
        default:
          return {
            title: '¡Mensaje enviado correctamente!',
            message: 'Hemos recibido tu consulta.',
            detail: 'Nuestro equipo revisará tu mensaje y te proporcionará la información solicitada.',
            followUp: 'Te contactaremos pronto a través del email proporcionado.'
          };
      }
    };

    const successInfo = getSuccessMessage();

    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            {successInfo.title}
          </h3>
          <p className="text-green-800 mb-3">
            {successInfo.message}
          </p>
          <p className="text-green-700 text-sm mb-3">
            {successInfo.detail}
          </p>
          <p className="text-green-600 text-sm mb-4 font-medium">
            {successInfo.followUp}
          </p>
          
          {user && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-blue-800 text-sm">
                💡 Puedes ver el estado de todas tus consultas en la sección{' '}
                <a href="/mis-consultas" className="font-medium underline hover:text-blue-900">
                  "Mis Consultas"
                </a>
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setSubmitted(false)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Enviar otro mensaje
            </button>
            {user && (
              <a
                href="/mis-consultas"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-center"
              >
                Ver mis consultas
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-gray-600">
            {subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar categoría</option>
                {categorias[type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asunto *
              </label>
              <input
                type="text"
                name="asunto"
                value={formData.asunto}
                onChange={handleInputChange}
                placeholder="Describe brevemente tu consulta"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad
              </label>
              <select
                name="prioridad"
                value={formData.prioridad}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {prioridades.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje *
            </label>
            <textarea
              name="mensaje"
              value={formData.mensaje}
              onChange={handleInputChange}
              rows={6}
              placeholder="Describe detalladamente tu consulta, sugerencia o problema..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.mensaje.length}/1000 caracteres (mínimo 10)
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Enviando...' : buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;
