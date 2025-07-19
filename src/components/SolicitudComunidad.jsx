import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export default function SolicitudComunidad() {
  const [formData, setFormData] = useState({
    // Datos básicos de la empresa
    nombre_empresa: '',
    rut_empresa: '',
    direccion: '',
    telefono: '',
    email: '',
    sitio_web: '',
    
    // Representante legal
    nombre_representante: '',
    rut_representante: '',
    cargo_representante: '',
    telefono_representante: '',
    email_representante: '',
    
    // Información del negocio
    categoria: '',
    marcas: [],
    descripcion_servicios: '',
    años_experiencia: '',
    numero_empleados: '',
    horario_atencion: '',
    
    // Documentación
    logo_url: '',
    documento_constitucion: '',
    certificado_vigencia: '',
    autorizacion_sectorial: '',
    
    // Motivación
    motivacion: '',
    beneficios_esperados: ''
  });

  const [categorias, setCategorias] = useState([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  useEffect(() => {
    cargarCategorias();
    cargarMarcas();
  }, []);

  const cargarCategorias = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'categorias'));
      const categoriasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const cargarMarcas = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'marcas'));
      const marcasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMarcasDisponibles(marcasData);
    } catch (error) {
      console.error('Error cargando marcas:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMarcaChange = (marcaId) => {
    setFormData(prev => ({
      ...prev,
      marcas: prev.marcas.includes(marcaId) 
        ? prev.marcas.filter(id => id !== marcaId)
        : [...prev.marcas, marcaId]
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const solicitudData = {
        ...formData,
        estado_general: 'pendiente_revision',
        tipo_solicitud: 'comunidad',
        fecha_solicitud: new Date(),
        fecha_actualizacion: new Date(),
        etapas: {
          documentos: 'pendiente',
          validacion_comercial: 'pendiente',
          visita_campo: 'pendiente',
          decision_final: 'pendiente'
        },
        progreso_porcentaje: 25,
        observaciones_admin: '',
        requiere_visita_campo: true
      };

      await addDoc(collection(db, 'solicitudes_comunidad'), solicitudData);
      
      alert('¡Solicitud enviada exitosamente! Recibirá una respuesta en los próximos días hábiles.');
      
      // Limpiar formulario
      setFormData({
        nombre_empresa: '',
        rut_empresa: '',
        direccion: '',
        telefono: '',
        email: '',
        sitio_web: '',
        nombre_representante: '',
        rut_representante: '',
        cargo_representante: '',
        telefono_representante: '',
        email_representante: '',
        categoria: '',
        marcas: [],
        descripcion_servicios: '',
        años_experiencia: '',
        numero_empleados: '',
        horario_atencion: '',
        logo_url: '',
        documento_constitucion: '',
        certificado_vigencia: '',
        autorizacion_sectorial: '',
        motivacion: '',
        beneficios_esperados: ''
      });
      setCurrentStep(1);
      
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      alert('Error al enviar la solicitud. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Información de la Empresa</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la Empresa *
          </label>
          <input
            type="text"
            name="nombre_empresa"
            value={formData.nombre_empresa}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            RUT de la Empresa *
          </label>
          <input
            type="text"
            name="rut_empresa"
            value={formData.rut_empresa}
            onChange={handleChange}
            placeholder="12.345.678-9"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección *
          </label>
          <input
            type="text"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sitio Web
          </label>
          <input
            type="url"
            name="sitio_web"
            value={formData.sitio_web}
            onChange={handleChange}
            placeholder="https://ejemplo.com"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Representante Legal</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre Completo *
          </label>
          <input
            type="text"
            name="nombre_representante"
            value={formData.nombre_representante}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            RUT *
          </label>
          <input
            type="text"
            name="rut_representante"
            value={formData.rut_representante}
            onChange={handleChange}
            placeholder="12.345.678-9"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cargo *
          </label>
          <input
            type="text"
            name="cargo_representante"
            value={formData.cargo_representante}
            onChange={handleChange}
            placeholder="Gerente General, Propietario, etc."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <input
            type="tel"
            name="telefono_representante"
            value={formData.telefono_representante}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email_representante"
            value={formData.email_representante}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Información del Negocio</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría *
          </label>
          <select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Seleccionar categoría</option>
            {categorias.map(categoria => (
              <option key={categoria.id} value={categoria.nombre}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Años de Experiencia *
          </label>
          <input
            type="number"
            name="años_experiencia"
            value={formData.años_experiencia}
            onChange={handleChange}
            min="0"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Empleados *
          </label>
          <select
            name="numero_empleados"
            value={formData.numero_empleados}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Seleccionar</option>
            <option value="1-5">1-5 empleados</option>
            <option value="6-10">6-10 empleados</option>
            <option value="11-25">11-25 empleados</option>
            <option value="26-50">26-50 empleados</option>
            <option value="51+">Más de 50 empleados</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horario de Atención *
          </label>
          <input
            type="text"
            name="horario_atencion"
            value={formData.horario_atencion}
            onChange={handleChange}
            placeholder="Lun-Vie 9:00-18:00"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción de Servicios *
          </label>
          <textarea
            name="descripcion_servicios"
            value={formData.descripcion_servicios}
            onChange={handleChange}
            rows="4"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describa detalladamente los servicios que ofrece su empresa..."
            required
          />
        </div>
      </div>

      {/* Marcas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Marcas que Atiende *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {marcasDisponibles.map(marca => (
            <label key={marca.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.marcas.includes(marca.id)}
                onChange={() => handleMarcaChange(marca.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{marca.nombre}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Documentación y Motivación</h3>
      
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL del Logo de la Empresa *
          </label>
          <input
            type="url"
            name="logo_url"
            value={formData.logo_url}
            onChange={handleChange}
            placeholder="https://ejemplo.com/logo.png"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Documento de Constitución (URL) *
          </label>
          <input
            type="url"
            name="documento_constitucion"
            value={formData.documento_constitucion}
            onChange={handleChange}
            placeholder="https://ejemplo.com/constitucion.pdf"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Certificado de Vigencia (URL) *
          </label>
          <input
            type="url"
            name="certificado_vigencia"
            value={formData.certificado_vigencia}
            onChange={handleChange}
            placeholder="https://ejemplo.com/vigencia.pdf"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Autorización Sectorial (URL - si aplica)
          </label>
          <input
            type="url"
            name="autorizacion_sectorial"
            value={formData.autorizacion_sectorial}
            onChange={handleChange}
            placeholder="https://ejemplo.com/autorizacion.pdf"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿Por qué quiere formar parte de nuestra comunidad? *
          </label>
          <textarea
            name="motivacion"
            value={formData.motivacion}
            onChange={handleChange}
            rows="4"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Explique su motivación para unirse a la comunidad AV10 de Julio..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿Qué beneficios espera obtener? *
          </label>
          <textarea
            name="beneficios_esperados"
            value={formData.beneficios_esperados}
            onChange={handleChange}
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describa qué beneficios espera obtener al formar parte de la comunidad..."
            required
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Solicitud para Unirse a la Comunidad AV10 de Julio
        </h2>
        <p className="text-gray-600">
          Complete este formulario para formar parte de nuestra red de empresas automotrices.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Paso {currentStep} de {totalSteps}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {Math.round((currentStep / totalSteps) * 100)}% Completado
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

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
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
