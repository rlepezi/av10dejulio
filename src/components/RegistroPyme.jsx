import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import { NotificationService } from '../utils/notificationService';

export default function RegistroPyme() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Información básica del negocio
    nombreNegocio: '',
    rutEmpresa: '',
    razonSocial: '',
    giroComercial: '',
    
    // Tipo de PyME y sector
    tipoNegocio: 'pyme', // pyme, emprendimiento, local
    sectorAutomotriz: '',
    serviciosPrincipales: [],
    añosExperiencia: '',
    
    // Ubicación y contacto
    direccion: '',
    comuna: '',
    region: '',
    telefono: '',
    email: '',
    sitioweb: '',
    redesSociales: {
      facebook: '',
      instagram: '',
      whatsapp: ''
    },
    
    // Información del propietario/representante
    nombrePropietario: '',
    rutPropietario: '',
    cargoResponsable: '',
    telefonoPropietario: '',
    
    // Detalles del negocio
    horariosAtencion: '',
    capacidadAtencion: '',
    equipamientoDisponible: [],
    certificaciones: [],
    
    // Motivación y objetivos
    motivoRegistro: '',
    objetivosNegocio: '',
    comoConocioPlataforma: '',
    expectativasApoyo: [],
    
    // Documentación
    tieneSitioWeb: false,
    tieneRedes: false,
    tienePatente: false,
    esNegocioFormal: false,
    
    // Términos y condiciones
    aceptaTerminos: false,
    aceptaVisitaValidacion: false,
    aceptaComunicaciones: false
  });
  const [errors, setErrors] = useState({});

  const sectoresAutomotrices = [
    { id: 'vulcanizaciones', nombre: 'Vulcanizaciones', descripcion: 'Reparación de neumáticos, balanceo, alineación' },
    { id: 'mecanica', nombre: 'Mecánica General', descripcion: 'Talleres de reparación y mantención' },
    { id: 'carroceria', nombre: 'Carrocería y Pintura', descripcion: 'Pintura automotriz y trabajos de carrocería' },
    { id: 'desabolladura', nombre: 'Desabolladura', descripcion: 'Reparación de abolladuras y daños menores' },
    { id: 'gruas', nombre: 'Grúas y Remolque', descripcion: 'Servicios de grúa y rescate vehicular' },
    { id: 'electromecanica', nombre: 'Electromecánica', descripcion: 'Especialistas en sistemas eléctricos' },
    { id: 'lubricentros', nombre: 'Lubricentros', descripcion: 'Cambio de aceite y lubricación' },
    { id: 'accesorios', nombre: 'Accesorios y Tuning', descripcion: 'Instalación de accesorios y personalización' },
    { id: 'repuestos', nombre: 'Venta de Repuestos', descripcion: 'Comercialización de repuestos automotrices' },
    { id: 'otros', nombre: 'Otros Servicios', descripcion: 'Otros servicios relacionados al sector automotriz' }
  ];

  const serviciosDisponibles = {
    vulcanizaciones: ['Reparación de neumáticos', 'Balanceo', 'Alineación', 'Venta de neumáticos'],
    mecanica: ['Mantención preventiva', 'Reparaciones motor', 'Sistema eléctrico', 'Frenos', 'Transmisión'],
    carroceria: ['Pintura completa', 'Retoque', 'Pulido', 'Encerado', 'Reparación carrocería'],
    desabolladura: ['Desabolladura sin pintura', 'Reparación paragolpes', 'Enderezado'],
    gruas: ['Grúa 24/7', 'Remolque', 'Rescate vehicular', 'Traslados'],
    electromecanica: ['Diagnóstico computarizado', 'Aire acondicionado', 'Sistema eléctrico', 'Scanner'],
    lubricentros: ['Cambio de aceite', 'Filtros', 'Lubricación', 'Lavado'],
    accesorios: ['Audio car', 'Alarmas', 'Insulfilm', 'Accesorios personalizados']
  };

  const expectativasApoyo = [
    'Conexión con proveedores mayoristas',
    'Capacitación técnica',
    'Herramientas y equipamiento',
    'Marketing digital',
    'Certificación de calidad',
    'Asesoría empresarial',
    'Acceso a créditos',
    'Networking con otros emprendedores'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNestedInputChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const handleArrayInputChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.nombreNegocio.trim()) newErrors.nombreNegocio = 'Nombre del negocio es requerido';
      if (!formData.sectorAutomotriz) newErrors.sectorAutomotriz = 'Sector automotriz es requerido';
      if (!formData.tipoNegocio) newErrors.tipoNegocio = 'Tipo de negocio es requerido';
      if (formData.serviciosPrincipales.length === 0) newErrors.serviciosPrincipales = 'Selecciona al menos un servicio';
    }

    if (step === 2) {
      if (!formData.direccion.trim()) newErrors.direccion = 'Dirección es requerida';
      if (!formData.comuna.trim()) newErrors.comuna = 'Comuna es requerida';
      if (!formData.telefono.trim()) newErrors.telefono = 'Teléfono es requerido';
      if (!formData.email.trim()) newErrors.email = 'Email es requerido';
    }

    if (step === 3) {
      if (!formData.nombrePropietario.trim()) newErrors.nombrePropietario = 'Nombre del propietario es requerido';
      if (!formData.rutPropietario.trim()) newErrors.rutPropietario = 'RUT del propietario es requerido';
      if (!formData.cargoResponsable.trim()) newErrors.cargoResponsable = 'Cargo es requerido';
    }

    if (step === 4) {
      if (!formData.motivoRegistro.trim()) newErrors.motivoRegistro = 'Motivo de registro es requerido';
      if (formData.expectativasApoyo.length === 0) newErrors.expectativasApoyo = 'Selecciona al menos una expectativa';
    }

    if (step === 5) {
      if (!formData.aceptaTerminos) newErrors.aceptaTerminos = 'Debe aceptar términos y condiciones';
      if (!formData.aceptaVisitaValidacion) newErrors.aceptaVisitaValidacion = 'Debe aceptar la visita de validación';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(5)) return;

    try {
      setLoading(true);
      
      const solicitudPyme = {
        userId: user?.uid || null,
        ...formData,
        tipoEmpresa: 'pyme',
        estado: 'pendiente_validacion',
        fechaRegistro: new Date(),
        validadoPor: null,
        fechaValidacion: null,
        observaciones: '',
        requiereVisitaCampo: true,
        prioridad: 'normal',
        origen: 'registro_pyme'
      };

      const docRef = await addDoc(collection(db, 'solicitudes_pymes'), solicitudPyme);
      
      // Notificar al usuario
      if (user) {
        await NotificationService.createInAppNotification(
          user.uid,
          'sistema',
          '🏪 Solicitud PyME Enviada',
          `Tu solicitud para registrar "${formData.nombreNegocio}" ha sido enviada. Un agente de campo te contactará para validar tu negocio.`,
          { solicitudId: docRef.id, tipoSolicitud: 'pyme' }
        );
      }
      
      // TODO: Notificar a agentes de campo de la zona
      
      alert('Solicitud enviada exitosamente. Un agente de campo te contactará pronto para validar tu PyME.');
      navigate('/status-cliente');
      
    } catch (error) {
      console.error('Error sending PyME application:', error);
      alert('Error al enviar solicitud. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Información Básica del Negocio</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Negocio *
                </label>
                <input
                  type="text"
                  value={formData.nombreNegocio}
                  onChange={(e) => handleInputChange('nombreNegocio', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.nombreNegocio ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Ej: Vulcanización San Pedro"
                />
                {errors.nombreNegocio && <p className="text-red-500 text-sm mt-1">{errors.nombreNegocio}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Negocio *
                </label>
                <select
                  value={formData.tipoNegocio}
                  onChange={(e) => handleInputChange('tipoNegocio', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.tipoNegocio ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Seleccionar...</option>
                  <option value="emprendimiento">Emprendimiento (1-2 años)</option>
                  <option value="pyme">PyME Establecida (3+ años)</option>
                  <option value="local">Local de Barrio</option>
                </select>
                {errors.tipoNegocio && <p className="text-red-500 text-sm mt-1">{errors.tipoNegocio}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sector Automotriz *
              </label>
              <select
                value={formData.sectorAutomotriz}
                onChange={(e) => handleInputChange('sectorAutomotriz', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 ${errors.sectorAutomotriz ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Seleccionar sector...</option>
                {sectoresAutomotrices.map(sector => (
                  <option key={sector.id} value={sector.id}>
                    {sector.nombre} - {sector.descripcion}
                  </option>
                ))}
              </select>
              {errors.sectorAutomotriz && <p className="text-red-500 text-sm mt-1">{errors.sectorAutomotriz}</p>}
            </div>

            {formData.sectorAutomotriz && serviciosDisponibles[formData.sectorAutomotriz] && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servicios que Ofreces *
                </label>
                <div className="grid md:grid-cols-2 gap-2">
                  {serviciosDisponibles[formData.sectorAutomotriz].map(servicio => (
                    <label key={servicio} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.serviciosPrincipales.includes(servicio)}
                        onChange={(e) => handleArrayInputChange('serviciosPrincipales', servicio, e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">{servicio}</span>
                    </label>
                  ))}
                </div>
                {errors.serviciosPrincipales && <p className="text-red-500 text-sm mt-1">{errors.serviciosPrincipales}</p>}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RUT Empresa (opcional)
                </label>
                <input
                  type="text"
                  value={formData.rutEmpresa}
                  onChange={(e) => handleInputChange('rutEmpresa', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="12.345.678-9"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Años de Experiencia
                </label>
                <select
                  value={formData.añosExperiencia}
                  onChange={(e) => handleInputChange('añosExperiencia', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Seleccionar...</option>
                  <option value="menos-1">Menos de 1 año</option>
                  <option value="1-3">1-3 años</option>
                  <option value="3-5">3-5 años</option>
                  <option value="5-10">5-10 años</option>
                  <option value="10+">Más de 10 años</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Ubicación y Contacto</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección *
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.direccion ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Av. 10 de Julio 1234"
                />
                {errors.direccion && <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comuna *
                </label>
                <input
                  type="text"
                  value={formData.comuna}
                  onChange={(e) => handleInputChange('comuna', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.comuna ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Comuna"
                />
                {errors.comuna && <p className="text-red-500 text-sm mt-1">{errors.comuna}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.telefono ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="+56 9 1234 5678"
                />
                {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="contacto@minegocio.cl"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sitio Web (opcional)
              </label>
              <input
                type="url"
                value={formData.sitioweb}
                onChange={(e) => handleInputChange('sitioweb', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="https://www.minegocio.cl"
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-800">Redes Sociales (opcional)</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={formData.redesSociales.facebook}
                    onChange={(e) => handleNestedInputChange('redesSociales', 'facebook', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="@minegocio"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={formData.redesSociales.instagram}
                    onChange={(e) => handleNestedInputChange('redesSociales', 'instagram', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="@minegocio"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp Business
                  </label>
                  <input
                    type="text"
                    value={formData.redesSociales.whatsapp}
                    onChange={(e) => handleNestedInputChange('redesSociales', 'whatsapp', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Información del Propietario/Responsable</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.nombrePropietario}
                  onChange={(e) => handleInputChange('nombrePropietario', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.nombrePropietario ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Juan Pérez García"
                />
                {errors.nombrePropietario && <p className="text-red-500 text-sm mt-1">{errors.nombrePropietario}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RUT *
                </label>
                <input
                  type="text"
                  value={formData.rutPropietario}
                  onChange={(e) => handleInputChange('rutPropietario', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.rutPropietario ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="12.345.678-9"
                />
                {errors.rutPropietario && <p className="text-red-500 text-sm mt-1">{errors.rutPropietario}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo/Responsabilidad *
                </label>
                <input
                  type="text"
                  value={formData.cargoResponsable}
                  onChange={(e) => handleInputChange('cargoResponsable', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.cargoResponsable ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Propietario, Gerente, Encargado"
                />
                {errors.cargoResponsable && <p className="text-red-500 text-sm mt-1">{errors.cargoResponsable}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono Personal
                </label>
                <input
                  type="tel"
                  value={formData.telefonoPropietario}
                  onChange={(e) => handleInputChange('telefonoPropietario', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="+56 9 8765 4321"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horarios de Atención
              </label>
              <textarea
                value={formData.horariosAtencion}
                onChange={(e) => handleInputChange('horariosAtencion', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={3}
                placeholder="Lun-Vie: 8:00-18:00, Sáb: 8:00-13:00"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Motivación y Objetivos</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Por qué quieres unirte a AV10 de Julio? *
              </label>
              <textarea
                value={formData.motivoRegistro}
                onChange={(e) => handleInputChange('motivoRegistro', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 ${errors.motivoRegistro ? 'border-red-500' : 'border-gray-300'}`}
                rows={4}
                placeholder="Describe tus motivaciones para formar parte de nuestra comunidad..."
              />
              {errors.motivoRegistro && <p className="text-red-500 text-sm mt-1">{errors.motivoRegistro}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Qué tipo de apoyo esperas de nosotros? *
              </label>
              <div className="grid md:grid-cols-2 gap-2">
                {expectativasApoyo.map(expectativa => (
                  <label key={expectativa} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.expectativasApoyo.includes(expectativa)}
                      onChange={(e) => handleArrayInputChange('expectativasApoyo', expectativa, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">{expectativa}</span>
                  </label>
                ))}
              </div>
              {errors.expectativasApoyo && <p className="text-red-500 text-sm mt-1">{errors.expectativasApoyo}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Cómo conociste nuestra plataforma?
              </label>
              <select
                value={formData.comoConocioPlataforma}
                onChange={(e) => handleInputChange('comoConocioPlataforma', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Seleccionar...</option>
                <option value="redes-sociales">Redes sociales</option>
                <option value="referido">Referido de otro negocio</option>
                <option value="publicidad">Publicidad</option>
                <option value="buscador">Búsqueda en Google</option>
                <option value="volante">Volante o material impreso</option>
                <option value="agente-campo">Agente de campo</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objetivos para tu negocio
              </label>
              <textarea
                value={formData.objetivosNegocio}
                onChange={(e) => handleInputChange('objetivosNegocio', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={3}
                placeholder="¿Qué esperas lograr con tu negocio en el próximo año?"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Confirmación y Términos</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-blue-800 mb-3">Proceso de Validación</h4>
              <p className="text-blue-700 mb-4">
                Para garantizar la calidad de nuestra comunidad, todas las PyMEs deben pasar por un proceso de validación:
              </p>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500">1.</span>
                  <span>Un agente de campo visitará tu negocio para verificar la información</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500">2.</span>
                  <span>Evaluaremos tus servicios y capacidades</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500">3.</span>
                  <span>Te brindaremos feedback y recomendaciones</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500">4.</span>
                  <span>Una vez aprobado, recibirás el sello de calidad AV10 de Julio</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.aceptaTerminos}
                  onChange={(e) => handleInputChange('aceptaTerminos', e.target.checked)}
                  className="mt-1 rounded"
                />
                <span className="text-sm">
                  Acepto los <button type="button" className="text-blue-600 underline">términos y condiciones</button> 
                  de la plataforma AV10 de Julio *
                </span>
              </label>
              {errors.aceptaTerminos && <p className="text-red-500 text-sm">{errors.aceptaTerminos}</p>}

              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.aceptaVisitaValidacion}
                  onChange={(e) => handleInputChange('aceptaVisitaValidacion', e.target.checked)}
                  className="mt-1 rounded"
                />
                <span className="text-sm">
                  Acepto recibir la visita de un agente de campo para la validación de mi negocio *
                </span>
              </label>
              {errors.aceptaVisitaValidacion && <p className="text-red-500 text-sm">{errors.aceptaVisitaValidacion}</p>}

              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.aceptaComunicaciones}
                  onChange={(e) => handleInputChange('aceptaComunicaciones', e.target.checked)}
                  className="mt-1 rounded"
                />
                <span className="text-sm">
                  Acepto recibir comunicaciones sobre ofertas, capacitaciones y oportunidades de negocio
                </span>
              </label>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-green-800 mb-3">¡Casi listo!</h4>
              <p className="text-green-700">
                Una vez que envíes tu solicitud, recibirás un email de confirmación. 
                Nuestro equipo revisará tu información y un agente se contactará contigo 
                en un plazo máximo de 48 horas.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Registro de PyME Automotriz
              </h1>
              <p className="text-gray-600">
                Únete a la comunidad AV10 de Julio y haz crecer tu negocio
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                {[1, 2, 3, 4, 5].map(step => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step <= currentStep ? 'bg-orange-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {step}
                    </div>
                    {step < 5 && (
                      <div className={`w-full h-1 ml-2 ${
                        step < currentStep ? 'bg-orange-600' : 'bg-gray-300'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Básico</span>
                <span>Ubicación</span>
                <span>Propietario</span>
                <span>Motivación</span>
                <span>Confirmación</span>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit}>
              {renderStep()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Enviando...' : 'Enviar Solicitud'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
