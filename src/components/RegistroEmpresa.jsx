import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { NotificationService } from '../utils/notificationService';
import { regionesComunas } from '../utils/regionesComunas';

export default function RegistroEmpresa() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [comunasDisponibles, setComunasDisponibles] = useState([]);
  const [formData, setFormData] = useState({
    // Información básica
    nombreEmpresa: '',
    rutEmpresa: '',
    razonSocial: '',
    giroComercial: '',
    rubro: '', // Nuevo campo para rubro específico
    
    // Tipo de empresa unificado
    tipoEmpresa: 'proveedor', // proveedor, pyme, emprendimiento, taller, distribuidor
    sectorAutomotriz: '',
    serviciosPrincipales: [],
    años_experiencia: '',
    
    // Ubicación
    direccion: '',
    comuna: '',
    region: '',
    telefono: '',
    email: '',
    sitioWeb: '',
    
    // Redes sociales
    facebook: '',
    instagram: '',
    whatsapp: '',
    
    // Representante legal
    nombreRepresentante: '',
    rutRepresentante: '',
    cargoRepresentante: '',
    telefonoRepresentante: '',
    emailRepresentante: '',
    
    // Información comercial
    horariosAtencion: '',
    capacidadAtencion: '',
    equipamiento: [],
    certificaciones: [],
    marcasQueManeja: [],
    
    // Servicios web (para proveedores)
    requiereServicioWeb: false,
    tipoServicioWeb: 'basico', // basico, intermedio, completo
    descripcionServicioWeb: '',
    
    // Términos y condiciones
    aceptaTerminos: false,
    aceptaPoliticas: false,
    autorizaDatos: false
  });

  const tiposEmpresa = [
    { value: 'proveedor', label: 'Proveedor', description: 'Distribuidor o fabricante de repuestos y servicios' },
    { value: 'pyme', label: 'PyME', description: 'Pequeña o mediana empresa del rubro automotriz' },
    { value: 'emprendimiento', label: 'Emprendimiento', description: 'Nuevo negocio en el sector automotriz' }
  ];

  const sectoresAutomotriz = [
    'Repuestos y Accesorios',
    'Lubricantes y Fluidos',
    'Neumáticos',
    'Baterías',
    'Sistema de Frenos',
    'Sistema Eléctrico',
    'Carrocería y Pintura',
    'Sistemas de Escape',
    'Filtros',
    'Herramientas',
    'Equipos de Diagnóstico',
    'Servicios de Mantención',
    'Seguros Automotrices',
    'Otros'
  ];

  const rubrosEspecificos = [
    'Repuestos',
    'Lubricantes',
    'Neumáticos',
    'Baterías',
    'Frenos',
    'Eléctrico',
    'Carrocería',
    'Escapes',
    'Filtros',
    'Herramientas',
    'Diagnóstico',
    'Mantención',
    'Seguros',
    'Accesorios',
    'Vulcanización',
    'Mecánica',
    'Pintura',
    'Tapicería',
    'Audio y Alarmas',
    'Climatización',
    'Transmisión',
    'Suspensión',
    'Otros'
  ];

  const serviciosWeb = [
    {
      tipo: 'basico',
      nombre: 'Sitio Web Básico',
      precio: 'Gratis',
      caracteristicas: ['Página de presentación', 'Información de contacto', 'Catálogo básico', 'Integración con AV10']
    },
    {
      tipo: 'intermedio',
      nombre: 'Sitio Web Intermedio',
      precio: '$50.000 CLP',
      caracteristicas: ['Todo lo básico', 'Carrito de compras', 'Sistema de pedidos', 'Gestión de inventario básico', 'SEO optimizado']
    },
    {
      tipo: 'completo',
      nombre: 'Sitio Web Completo',
      precio: '$150.000 CLP',
      caracteristicas: ['Todo lo intermedio', 'Panel administrativo completo', 'Reportes y analytics', 'Integración con sistemas externos', 'Soporte técnico prioritario']
    }
  ];

  useEffect(() => {
    if (formData.region) {
      const regionData = Object.keys(regionesComunas).find(r => r === formData.region);
      setComunasDisponibles(regionData ? regionesComunas[regionData] : []);
      if (formData.comuna && regionData && !regionesComunas[regionData].includes(formData.comuna)) {
        setFormData(prev => ({ ...prev, comuna: '' }));
      }
    }
  }, [formData.region]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.nombreEmpresa && formData.rutEmpresa && formData.tipoEmpresa && formData.sectorAutomotriz && formData.rubro;
      case 2:
        return formData.direccion && formData.comuna && formData.region && formData.telefono && formData.email;
      case 3:
        return formData.nombreRepresentante && formData.rutRepresentante && formData.emailRepresentante;
      case 4:
        return formData.aceptaTerminos && formData.aceptaPoliticas && formData.autorizaDatos;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      // Usar colección unificada para todos los tipos de empresa
      const collectionName = 'solicitudes_empresa';
      
      const solicitudData = {
        ...formData,
        fechaSolicitud: serverTimestamp(),
        estado: 'pendiente',
        etapa: 'revision_inicial',
        // Datos calculados
        esEmprendimiento: formData.tipoEmpresa === 'emprendimiento',
        esPyme: formData.tipoEmpresa === 'pyme',
        esProveedor: formData.tipoEmpresa === 'proveedor',
        requiereValidacion: true,
        puntuacionComplitud: calcularPuntuacionComplitud(formData)
      };

      // Remover campos que no deben ir a Firebase
      delete solicitudData.password;
      delete solicitudData.confirmPassword;

      await addDoc(collection(db, collectionName), solicitudData);

      // Notificación de éxito
      await NotificationService.createInAppNotification(
        'sistema',
        'success',
        'Solicitud enviada exitosamente',
        `Tu solicitud de registro como ${tiposEmpresa.find(t => t.value === formData.tipoEmpresa)?.label} ha sido enviada y será revisada por nuestro equipo.`
      );

      // Redirección con mensaje de éxito
      navigate('/', { 
        state: { 
          message: 'Solicitud enviada exitosamente. Te contactaremos pronto.',
          type: 'success' 
        }
      });
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      alert('Error al enviar la solicitud. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const calcularPuntuacionComplitud = (data) => {
    let puntos = 0;
    const campos = Object.keys(data);
    
    campos.forEach(campo => {
      if (data[campo] && data[campo] !== '' && data[campo] !== false) {
        if (Array.isArray(data[campo]) && data[campo].length > 0) puntos++;
        else if (!Array.isArray(data[campo])) puntos++;
      }
    });
    
    return Math.round((puntos / campos.length) * 100);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Información Básica de la Empresa</h2>
        <p className="text-gray-600">Cuéntanos sobre tu empresa o negocio automotriz</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la Empresa *
          </label>
          <input
            type="text"
            name="nombreEmpresa"
            value={formData.nombreEmpresa}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Repuestos AV10"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            RUT de la Empresa *
          </label>
          <input
            type="text"
            name="rutEmpresa"
            value={formData.rutEmpresa}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="XX.XXX.XXX-X"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Razón Social
        </label>
        <input
          type="text"
          name="razonSocial"
          value={formData.razonSocial}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Razón social de la empresa"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Empresa *
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          {tiposEmpresa.map((tipo) => (
            <div
              key={tipo.value}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                formData.tipoEmpresa === tipo.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, tipoEmpresa: tipo.value }))}
            >
              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  name="tipoEmpresa"
                  value={tipo.value}
                  checked={formData.tipoEmpresa === tipo.value}
                  onChange={handleInputChange}
                  className="mr-3"
                />
                <span className="font-medium">{tipo.label}</span>
              </div>
              <p className="text-sm text-gray-600">{tipo.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sector del Rubro Automotriz *
        </label>
        <select
          name="sectorAutomotriz"
          value={formData.sectorAutomotriz}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Selecciona un sector</option>
          {sectoresAutomotriz.map((sector) => (
            <option key={sector} value={sector}>{sector}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rubro Específico *
        </label>
        <select
          name="rubro"
          value={formData.rubro}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Selecciona un rubro específico</option>
          {rubrosEspecificos.map((rubro) => (
            <option key={rubro} value={rubro}>{rubro}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Giro Comercial
        </label>
        <textarea
          name="giroComercial"
          value={formData.giroComercial}
          onChange={handleInputChange}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Describe brevemente el giro comercial de tu empresa"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ubicación y Contacto</h2>
        <p className="text-gray-600">Información de contacto y ubicación de tu empresa</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dirección *
        </label>
        <input
          type="text"
          name="direccion"
          value={formData.direccion}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Av. 10 de Julio 1234"
          required
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Región *
          </label>
          <select
            name="region"
            value={formData.region}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Selecciona una región</option>
            {Object.keys(regionesComunas).map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comuna *
          </label>
          <select
            name="comuna"
            value={formData.comuna}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
            disabled={!formData.region}
          >
            <option value="">Selecciona una comuna</option>
            {comunasDisponibles.map((comuna) => (
              <option key={comuna} value={comuna}>{comuna}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="+56 9 XXXX XXXX"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="contacto@empresa.cl"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sitio Web
        </label>
        <input
          type="url"
          name="sitioWeb"
          value={formData.sitioWeb}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="https://www.empresa.cl"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Redes Sociales</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facebook
            </label>
            <input
              type="url"
              name="facebook"
              value={formData.facebook}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://facebook.com/empresa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instagram
            </label>
            <input
              type="text"
              name="instagram"
              value={formData.instagram}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="@empresa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp
            </label>
            <input
              type="tel"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="+56 9 XXXX XXXX"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Representante Legal</h2>
        <p className="text-gray-600">Información del representante legal de la empresa</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre Completo *
          </label>
          <input
            type="text"
            name="nombreRepresentante"
            value={formData.nombreRepresentante}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Juan Pérez González"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            RUT *
          </label>
          <input
            type="text"
            name="rutRepresentante"
            value={formData.rutRepresentante}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="XX.XXX.XXX-X"
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cargo
          </label>
          <input
            type="text"
            name="cargoRepresentante"
            value={formData.cargoRepresentante}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Gerente General"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            name="telefonoRepresentante"
            value={formData.telefonoRepresentante}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="+56 9 XXXX XXXX"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <input
          type="email"
          name="emailRepresentante"
          value={formData.emailRepresentante}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="juan.perez@empresa.cl"
          required
        />
      </div>

      {formData.tipoEmpresa === 'proveedor' && (
        <div className="border rounded-lg p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Servicio de Creación de Sitio Web</h3>
          <p className="text-gray-600 mb-4">
            Como proveedor, puedes solicitar la creación de un sitio web profesional integrado con la plataforma AV10.
          </p>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="requiereServicioWeb"
                checked={formData.requiereServicioWeb}
                onChange={handleInputChange}
                className="mr-3"
              />
              <span className="font-medium">Sí, requiero servicio de creación de sitio web</span>
            </label>
          </div>

          {formData.requiereServicioWeb && (
            <div className="space-y-4">
              <div className="grid gap-4">
                {serviciosWeb.map((servicio) => (
                  <div
                    key={servicio.tipo}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.tipoServicioWeb === servicio.tipo
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, tipoServicioWeb: servicio.tipo }))}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="tipoServicioWeb"
                          value={servicio.tipo}
                          checked={formData.tipoServicioWeb === servicio.tipo}
                          onChange={handleInputChange}
                          className="mr-3"
                        />
                        <span className="font-medium">{servicio.nombre}</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">{servicio.precio}</span>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {servicio.caracteristicas.map((caracteristica, index) => (
                        <li key={index} className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          {caracteristica}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción adicional del sitio web requerido
                </label>
                <textarea
                  name="descripcionServicioWeb"
                  value={formData.descripcionServicioWeb}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe cualquier requerimiento específico para tu sitio web..."
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Términos y Condiciones</h2>
        <p className="text-gray-600">Revisa y acepta nuestros términos para completar el registro</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="flex items-start">
          <input
            type="checkbox"
            name="aceptaTerminos"
            checked={formData.aceptaTerminos}
            onChange={handleInputChange}
            className="mt-1 mr-3"
            required
          />
          <div>
            <p className="font-medium">Acepto los Términos y Condiciones *</p>
            <p className="text-sm text-gray-600">
              He leído y acepto los términos y condiciones de uso de la plataforma AV10 de Julio.
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            name="aceptaPoliticas"
            checked={formData.aceptaPoliticas}
            onChange={handleInputChange}
            className="mt-1 mr-3"
            required
          />
          <div>
            <p className="font-medium">Acepto la Política de Privacidad *</p>
            <p className="text-sm text-gray-600">
              Acepto el tratamiento de mis datos personales según la política de privacidad.
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            name="autorizaDatos"
            checked={formData.autorizaDatos}
            onChange={handleInputChange}
            className="mt-1 mr-3"
            required
          />
          <div>
            <p className="font-medium">Autorizo el uso de mis datos *</p>
            <p className="text-sm text-gray-600">
              Autorizo el uso de mi información para fines comerciales y de comunicación relacionados con los servicios de AV10.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">¿Qué sigue después del registro?</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• Tu solicitud será revisada por nuestro equipo en un plazo de 1-2 días hábiles</p>
          <p>• Recibirás un email de confirmación una vez aprobada tu solicitud</p>
          <p>• Podrás acceder a tu panel de control para gestionar tu perfil y productos</p>
          <p>• Un agente de campo se contactará contigo para finalizar el proceso de validación</p>
          {formData.requiereServicioWeb && (
            <p>• Nuestro equipo técnico se contactará contigo para coordinar la creación de tu sitio web</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registro de Empresa - Sector Automotriz
          </h1>
          <p className="text-xl text-gray-600">
            Únete a la red de empresas del sector Av. 10 de Julio
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Paso {currentStep} de 4</span>
            <span className="text-sm font-medium text-gray-600">{Math.round((currentStep / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !validateStep(4)}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      Enviar Solicitud
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
