import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import { NotificationService } from '../utils/notificationService';
import { getRegiones, getComunas } from '../utils/regionesComunas';

// Componente para registro sin autenticación
function RegistroSinAuth() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Información Personal
    nombres: '',
    apellidos: '',
    rut: '',
    telefono: '',
    email: '',
    direccion: '',
    comuna: '',
    ciudad: '',
    region: '',
    
    // Información Adicional
    fecha_nacimiento: '',
    profesion: '',
    empresa: '',
    motivo_registro: '',
    servicios_interes: [],
    acepta_terminos: false,
    acepta_notificaciones: true,
    
    // Credenciales para cuenta futura
    password: '',
    confirm_password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [regionesDisponibles, setRegionesDisponibles] = useState([]);
  const [comunasDisponibles, setComunasDisponibles] = useState([]);

  // Cargar regiones al montar el componente
  useEffect(() => {
    setRegionesDisponibles(getRegiones());
  }, []);

  // Actualizar comunas cuando cambie la región
  useEffect(() => {
    if (formData.region) {
      setComunasDisponibles(getComunas(formData.region));
      // Limpiar comuna si no está en la nueva región
      if (formData.comuna && !getComunas(formData.region).includes(formData.comuna)) {
        setFormData(prev => ({ ...prev, comuna: '' }));
      }
    } else {
      setComunasDisponibles([]);
    }
  }, [formData.region]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'servicios_interes') {
        setFormData(prev => ({
          ...prev,
          servicios_interes: checked 
            ? [...prev.servicios_interes, value]
            : prev.servicios_interes.filter(s => s !== value)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.nombres.trim()) newErrors.nombres = 'Los nombres son obligatorios';
      if (!formData.apellidos.trim()) newErrors.apellidos = 'Los apellidos son obligatorios';
      if (!formData.rut.trim()) newErrors.rut = 'El RUT es obligatorio';
      if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es obligatorio';
      if (!formData.email.trim()) newErrors.email = 'El email es obligatorio';
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'El email no es válido';
      }
    } else if (currentStep === 2) {
      if (!formData.direccion.trim()) newErrors.direccion = 'La dirección es obligatoria';
      if (!formData.comuna.trim()) newErrors.comuna = 'La comuna es obligatoria';
      if (!formData.ciudad.trim()) newErrors.ciudad = 'La ciudad es obligatoria';
      if (!formData.region.trim()) newErrors.region = 'La región es obligatoria';
    } else if (currentStep === 3) {
      if (!formData.fecha_nacimiento) newErrors.fecha_nacimiento = 'La fecha de nacimiento es obligatoria';
      if (!formData.motivo_registro.trim()) newErrors.motivo_registro = 'El motivo de registro es obligatorio';
      if (formData.servicios_interes.length === 0) newErrors.servicios_interes = 'Selecciona al menos un servicio de interés';
    } else if (currentStep === 4) {
      if (!formData.password) newErrors.password = 'La contraseña es obligatoria';
      if (formData.password && formData.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      if (formData.password !== formData.confirm_password) newErrors.confirm_password = 'Las contraseñas no coinciden';
      if (!formData.acepta_terminos) newErrors.acepta_terminos = 'Debes aceptar los términos y condiciones';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Verificar si el email ya existe
      const emailQuery = query(
        collection(db, 'solicitudes_cliente'),
        where('email', '==', formData.email)
      );
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        setErrors({ email: 'Ya existe una solicitud con este email' });
        setIsSubmitting(false);
        return;
      }

      // Crear solicitud de cliente sin autenticación
      const { password, confirm_password, ...dataWithoutPasswords } = formData;
      
      const solicitudData = {
        ...dataWithoutPasswords,
        
        fecha_solicitud: new Date(),
        
        // Estados de la solicitud
        estado_general: 'enviada',
        etapa_actual: 'validacion_datos',
        progreso_porcentaje: 0,
        
        // Seguimiento de etapas - Solo 2 etapas simplificadas
        etapas: {
          validacion_datos: {
            estado: 'pendiente',
            fecha_inicio: new Date(),
            fecha_fin: null,
            comentarios: '',
            responsable: null
          },
          confirmacion_final: {
            estado: 'pendiente',
            fecha_inicio: null,
            fecha_fin: null,
            comentarios: '',
            responsable: null
          }
        },
        
        // Información adicional
        documentos_adjuntos: [],
        notas_admin: '',
        agente_asignado: null,
        fecha_entrevista: null,
        puntuacion_evaluacion: null,
        motivo_rechazo: '',
        fecha_aprobacion: null,
        
        // Metadatos
        ip_registro: window.location.hostname,
        user_agent: navigator.userAgent,
        referencia: 'web_directa',
        tipo_registro: 'sin_auth',
        
        // Guardar contraseña encriptada para creación posterior de cuenta
        password_hash: btoa(formData.password) // Base64 simple, en producción usar hash seguro
      };

      const docRef = await addDoc(collection(db, 'solicitudes_cliente'), solicitudData);
      
      // Enviar notificación al admin
      await NotificationService.createInAppNotification(
        'admin',
        'validacion',
        'Nueva Solicitud de Cliente',
        `${formData.nombres} ${formData.apellidos} ha enviado una solicitud de registro`,
        {
          solicitudId: docRef.id,
          clienteNombre: `${formData.nombres} ${formData.apellidos}`,
          clienteEmail: formData.email,
          etapaActual: 'revision_inicial',
          origen: 'registro_cliente'
        }
      );

      setSolicitudEnviada(true);
      
      // Iniciar cuenta regresiva para redirigir al home principal
      const countdownInterval = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            navigate('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error creating client request:', error);
      alert('Error al enviar la solicitud. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (solicitudEnviada) {
    return (
      <div className="text-center space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            ¡Solicitud enviada exitosamente!
          </h2>
          <p className="text-green-700 mb-4">
            Hemos recibido tu solicitud de registro y será procesada en las próximas 24-48 horas.
          </p>
          
          <div className="bg-white border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-green-800 mb-2">¿Qué sigue ahora?</h3>
            <div className="text-sm text-green-700 text-left space-y-1">
              <p>1. 📋 Nuestro equipo revisará tu información</p>
              <p>2. ✉️ Te contactaremos por email para confirmar datos</p>
              <p>3. 👤 Se te asignará un agente de campo local</p>
              <p>4. 📞 Programaremos una breve entrevista (opcional)</p>
              <p>5. 🎉 Una vez aprobado, recibirás tus credenciales de acceso</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-green-600">
              📧 Te enviaremos actualizaciones a: <strong>{formData.email}</strong>
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-blue-800 text-center">
                🔄 Serás redirigido al inicio en <strong>{redirectCountdown}</strong> segundos...
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Ir al Inicio Ahora
              </button>
              <button
                onClick={() => navigate('/registro-proveedor')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Registrar Proveedor
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={currentStep === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNextStep(); }}>
      {currentStep === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Información Personal</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombres *</label>
              <input
                type="text"
                name="nombres"
                value={formData.nombres}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nombres ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ingresa tus nombres"
              />
              {errors.nombres && <p className="text-red-500 text-sm mt-1">{errors.nombres}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos *</label>
              <input
                type="text"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.apellidos ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ingresa tus apellidos"
              />
              {errors.apellidos && <p className="text-red-500 text-sm mt-1">{errors.apellidos}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RUT *</label>
              <input
                type="text"
                name="rut"
                value={formData.rut}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.rut ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="12.345.678-9"
              />
              {errors.rut && <p className="text-red-500 text-sm mt-1">{errors.rut}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.telefono ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+56 9 1234 5678"
              />
              {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="tu@email.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Información de Residencia</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dirección *</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.direccion ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Calle, número, departamento"
              />
              {errors.direccion && <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comuna *</label>
                <input
                  type="text"
                  name="comuna"
                  value={formData.comuna}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.comuna ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Tu comuna"
                />
                {errors.comuna && <p className="text-red-500 text-sm mt-1">{errors.comuna}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad *</label>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.ciudad ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Tu ciudad"
                />
                {errors.ciudad && <p className="text-red-500 text-sm mt-1">{errors.ciudad}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Región *</label>
              <select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.region ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecciona tu región</option>
                <option value="Arica y Parinacota">Arica y Parinacota</option>
                <option value="Tarapacá">Tarapacá</option>
                <option value="Antofagasta">Antofagasta</option>
                <option value="Atacama">Atacama</option>
                <option value="Coquimbo">Coquimbo</option>
                <option value="Valparaíso">Valparaíso</option>
                <option value="Metropolitana">Metropolitana</option>
                <option value="O'Higgins">O'Higgins</option>
                <option value="Maule">Maule</option>
                <option value="Ñuble">Ñuble</option>
                <option value="Biobío">Biobío</option>
                <option value="La Araucanía">La Araucanía</option>
                <option value="Los Ríos">Los Ríos</option>
                <option value="Los Lagos">Los Lagos</option>
                <option value="Aysén">Aysén</option>
                <option value="Magallanes">Magallanes</option>
              </select>
              {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Información Adicional</h2>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={formData.fecha_nacimiento}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.fecha_nacimiento ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fecha_nacimiento && <p className="text-red-500 text-sm mt-1">{errors.fecha_nacimiento}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profesión</label>
                <input
                  type="text"
                  name="profesion"
                  value={formData.profesion}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tu profesión"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Empresa (Opcional)</label>
              <input
                type="text"
                name="empresa"
                value={formData.empresa}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre de tu empresa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Motivo de Registro *</label>
              <textarea
                name="motivo_registro"
                value={formData.motivo_registro}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.motivo_registro ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Cuéntanos por qué quieres registrarte en nuestra plataforma"
              />
              {errors.motivo_registro && <p className="text-red-500 text-sm mt-1">{errors.motivo_registro}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Servicios de Interés *</label>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  'Repuestos y Autopartes',
                  'Mantención Preventiva',
                  'Reparaciones Mecánicas',
                  'Seguros Automotrices',
                  'Revisión Técnica',
                  'Vulcanización',
                  'Servicios de Emergencia',
                  'Reciclaje de Vehículos'
                ].map(servicio => (
                  <label key={servicio} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="servicios_interes"
                      value={servicio}
                      checked={formData.servicios_interes.includes(servicio)}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{servicio}</span>
                  </label>
                ))}
              </div>
              {errors.servicios_interes && <p className="text-red-500 text-sm mt-1">{errors.servicios_interes}</p>}
            </div>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Credenciales y Confirmación</h2>
          
          {/* Configurar contraseña para cuenta futura */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Configura tu contraseña</h3>
            <p className="text-sm text-blue-800">
              Esta contraseña se usará para crear tu cuenta una vez que tu solicitud sea aprobada.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Mínimo 6 caracteres"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña *</label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.confirm_password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Repite tu contraseña"
              />
              {errors.confirm_password && <p className="text-red-500 text-sm mt-1">{errors.confirm_password}</p>}
            </div>
          </div>

          {/* Resumen de información */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-4">Resumen de tu información:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium">Nombre:</span> {formData.nombres} {formData.apellidos}</p>
                <p><span className="font-medium">RUT:</span> {formData.rut}</p>
                <p><span className="font-medium">Email:</span> {formData.email}</p>
                <p><span className="font-medium">Teléfono:</span> {formData.telefono}</p>
                {formData.profesion && <p><span className="font-medium">Profesión:</span> {formData.profesion}</p>}
              </div>
              <div>
                <p><span className="font-medium">Dirección:</span> {formData.direccion}</p>
                <p><span className="font-medium">Comuna:</span> {formData.comuna}</p>
                <p><span className="font-medium">Ciudad:</span> {formData.ciudad}</p>
                <p><span className="font-medium">Región:</span> {formData.region}</p>
                {formData.empresa && <p><span className="font-medium">Empresa:</span> {formData.empresa}</p>}
              </div>
            </div>
          </div>

          {/* Términos y condiciones */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="acepta_terminos"
                checked={formData.acepta_terminos}
                onChange={handleInputChange}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">
                Acepto los <a href="/terminos" target="_blank" className="text-blue-600 hover:underline">términos y condiciones</a> de AV10 de Julio *
              </label>
            </div>
            {errors.acepta_terminos && <p className="text-red-500 text-sm">{errors.acepta_terminos}</p>}

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="acepta_notificaciones"
                checked={formData.acepta_notificaciones}
                onChange={handleInputChange}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">
                Acepto recibir notificaciones sobre recordatorios, ofertas y novedades de la plataforma
              </label>
            </div>
          </div>

          {/* Información del proceso */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">¿Qué sigue después?</h4>
            <div className="text-sm text-green-800 space-y-1">
              <p>1. Recibirás un email de confirmación inmediatamente</p>
              <p>2. Tu solicitud será revisada en 24-48 horas</p>
              <p>3. Te contactaremos para validar la información</p>
              <p>4. Se te asignará un agente de campo de tu zona</p>
              <p>5. Una vez aprobado, se activará tu cuenta con la contraseña elegida</p>
            </div>
          </div>
        </div>
      )}

      {/* Navegación */}
      <div className="flex justify-between mt-8">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={handlePrevStep}
            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
          >
            ← Anterior
          </button>
        )}
        <div className="flex-1"></div>
        
        {/* Indicador de progreso */}
        <div className="flex-1 flex justify-center items-center">
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${
                  step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="ml-3 text-sm text-gray-600">
            Paso {currentStep} de 4
          </span>
        </div>

        <div className="flex-1 flex justify-end">
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Siguiente →
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando Solicitud...' : '📨 Enviar Solicitud'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

export default function RegistroCliente() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [perfilCliente, setPerfilCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Información Personal
    nombres: '',
    apellidos: '',
    rut: '',
    telefono: '',
    email: '',
    direccion: '',
    comuna: '',
    ciudad: '',
    region: '',
    
    // Información Adicional
    fecha_nacimiento: '',
    profesion: '',
    empresa: '',
    motivo_registro: '',
    servicios_interes: [],
    acepta_terminos: false,
    acepta_notificaciones: true
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [solicitudActual, setSolicitudActual] = useState(null);

  // Verificar si el usuario ya tiene un perfil de cliente o solicitud
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Verificar perfil existente
        const perfilQuery = query(
          collection(db, 'perfiles_clientes'),
          where('uid', '==', user.uid)
        );
        const perfilSnapshot = await getDocs(perfilQuery);
        
        if (!perfilSnapshot.empty) {
          const profile = perfilSnapshot.docs[0].data();
          setPerfilCliente(profile);
        } else {
          // Verificar solicitud existente
          const solicitudQuery = query(
            collection(db, 'solicitudes_cliente'),
            where('uid', '==', user.uid)
          );
          const solicitudSnapshot = await getDocs(solicitudQuery);
          
          if (!solicitudSnapshot.empty) {
            const solicitud = { 
              id: solicitudSnapshot.docs[0].id,
              ...solicitudSnapshot.docs[0].data() 
            };
            setSolicitudActual(solicitud);
          }
        }
      } catch (error) {
        console.error('Error checking existing profile:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingProfile();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'servicios_interes') {
        setFormData(prev => ({
          ...prev,
          servicios_interes: checked 
            ? [...prev.servicios_interes, value]
            : prev.servicios_interes.filter(s => s !== value)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.nombres.trim()) newErrors.nombres = 'Los nombres son obligatorios';
      if (!formData.apellidos.trim()) newErrors.apellidos = 'Los apellidos son obligatorios';
      if (!formData.rut.trim()) newErrors.rut = 'El RUT es obligatorio';
      if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es obligatorio';
      if (!formData.email.trim()) newErrors.email = 'El email es obligatorio';
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'El email no es válido';
      }
    } else if (currentStep === 2) {
      if (!formData.direccion.trim()) newErrors.direccion = 'La dirección es obligatoria';
      if (!formData.comuna.trim()) newErrors.comuna = 'La comuna es obligatoria';
      if (!formData.ciudad.trim()) newErrors.ciudad = 'La ciudad es obligatoria';
      if (!formData.region.trim()) newErrors.region = 'La región es obligatoria';
    } else if (currentStep === 3) {
      if (!formData.fecha_nacimiento) newErrors.fecha_nacimiento = 'La fecha de nacimiento es obligatoria';
      if (!formData.motivo_registro.trim()) newErrors.motivo_registro = 'El motivo de registro es obligatorio';
      if (formData.servicios_interes.length === 0) newErrors.servicios_interes = 'Selecciona al menos un servicio de interés';
    } else if (currentStep === 4) {
      if (!formData.acepta_terminos) newErrors.acepta_terminos = 'Debes aceptar los términos y condiciones';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Crear solicitud de cliente con estados y etapas
      const solicitudData = {
        ...formData,
        uid: user.uid,
        email_usuario: user.email,
        fecha_solicitud: new Date(),
        
        // Estados de la solicitud
        estado_general: 'enviada', // enviada, en_revision, validacion_documentos, aprobada, rechazada
        etapa_actual: 'revision_inicial', // revision_inicial, validacion_datos, asignacion_agente, entrevista, aprobacion_final
        progreso_porcentaje: 10,
        
        // Seguimiento de etapas
        etapas: {
          revision_inicial: {
            estado: 'pendiente', // pendiente, en_proceso, completada, rechazada
            fecha_inicio: new Date(),
            fecha_fin: null,
            comentarios: '',
            responsable: null
          },
          validacion_datos: {
            estado: 'pendiente',
            fecha_inicio: null,
            fecha_fin: null,
            comentarios: '',
            responsable: null
          },
          asignacion_agente: {
            estado: 'pendiente',
            fecha_inicio: null,
            fecha_fin: null,
            comentarios: '',
            responsable: null
          },
          entrevista: {
            estado: 'pendiente',
            fecha_inicio: null,
            fecha_fin: null,
            comentarios: '',
            responsable: null
          },
          aprobacion_final: {
            estado: 'pendiente',
            fecha_inicio: null,
            fecha_fin: null,
            comentarios: '',
            responsable: null
          }
        },
        
        // Información adicional
        documentos_adjuntos: [],
        notas_admin: '',
        agente_asignado: null,
        fecha_entrevista: null,
        puntuacion_evaluacion: null,
        motivo_rechazo: '',
        fecha_aprobacion: null,
        
        // Metadatos
        ip_registro: window.location.hostname,
        user_agent: navigator.userAgent,
        referencia: 'web_directa'
      };

      const docRef = await addDoc(collection(db, 'solicitudes_cliente'), solicitudData);
      
      // Enviar notificación al admin
      await NotificationService.createInAppNotification(
        'admin',
        'validacion',
        'Nueva Solicitud de Cliente',
        `${formData.nombres} ${formData.apellidos} ha enviado una solicitud de registro`,
        {
          solicitudId: docRef.id,
          clienteNombre: `${formData.nombres} ${formData.apellidos}`,
          clienteEmail: formData.email,
          etapaActual: 'revision_inicial',
          origen: 'registro_cliente'
        }
      );

      setSolicitudActual({ 
        id: docRef.id, 
        ...solicitudData,
        estado_general: 'enviada'
      });
      
    } catch (error) {
      console.error('Error creating client request:', error);
      alert('Error al enviar la solicitud. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    // Permitir registro sin autenticación previa
    // El usuario será creado durante el proceso
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro de Cliente</h1>
              <p className="text-gray-600">Completa tu información para solicitar acceso a nuestros servicios</p>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ No necesitas tener una cuenta para enviar tu solicitud. El acceso se creará después de la aprobación.
                </p>
              </div>
            </div>

            <RegistroSinAuth />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro de Cliente</h1>
            <p className="text-gray-600">Completa tu perfil para acceder a todos nuestros servicios</p>
          </div>

          {perfilCliente ? (
            <div className="text-center space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-800 mb-2">
                  ¡Tu perfil ya está registrado!
                </h2>
                <p className="text-blue-600 mb-4">
                  Estado: <span className="font-medium capitalize">{perfilCliente.estado_validacion}</span>
                </p>
                {perfilCliente.estado_validacion === 'pendiente' && (
                  <p className="text-sm text-blue-600 mb-4">
                    Tu perfil está siendo revisado por nuestro equipo. Te notificaremos cuando esté aprobado.
                  </p>
                )}
                {perfilCliente.estado_validacion === 'validado' && (
                  <p className="text-sm text-green-600 mb-4">
                    ¡Tu perfil ha sido validado! Ya puedes acceder a tu dashboard.
                  </p>
                )}
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ir al Dashboard
                  </button>
                </div>
              </div>
            </div>
          ) : solicitudActual ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-800 mb-4">
                  Tu solicitud está en proceso
                </h2>
                
                {/* Estado General */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Estado de solicitud:</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      solicitudActual.estado_general === 'enviada' ? 'bg-blue-100 text-blue-800' :
                      solicitudActual.estado_general === 'en_revision' ? 'bg-yellow-100 text-yellow-800' :
                      solicitudActual.estado_general === 'aprobada' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {solicitudActual.estado_general === 'enviada' ? 'Enviada' :
                       solicitudActual.estado_general === 'en_revision' ? 'En Revisión' :
                       solicitudActual.estado_general === 'aprobada' ? 'Aprobada' :
                       'Rechazada'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Progreso:</p>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${solicitudActual.progreso_porcentaje}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-blue-600">
                        {solicitudActual.progreso_porcentaje}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Etapas del Proceso */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Etapas del proceso:</h3>
                  
                  {Object.entries(solicitudActual.etapas || {}).map(([etapaKey, etapa], index) => {
                    const etapaNombres = {
                      revision_inicial: '1. Revisión Inicial',
                      validacion_datos: '2. Validación de Datos',
                      asignacion_agente: '3. Asignación de Agente',
                      entrevista: '4. Entrevista',
                      aprobacion_final: '5. Aprobación Final'
                    };
                    
                    return (
                      <div key={etapaKey} className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          etapa.estado === 'completada' ? 'bg-green-500 text-white' :
                          etapa.estado === 'en_proceso' ? 'bg-blue-500 text-white' :
                          etapa.estado === 'rechazada' ? 'bg-red-500 text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {etapa.estado === 'completada' ? '✓' :
                           etapa.estado === 'rechazada' ? '✗' :
                           index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {etapaNombres[etapaKey]}
                          </p>
                          <p className="text-sm text-gray-600">
                            {etapa.estado === 'completada' ? 'Completada' :
                             etapa.estado === 'en_proceso' ? 'En proceso' :
                             etapa.estado === 'rechazada' ? 'Rechazada' :
                             'Pendiente'}
                            {etapa.fecha_fin && ` - ${new Date(etapa.fecha_fin.toDate()).toLocaleDateString()}`}
                          </p>
                          {etapa.comentarios && (
                            <p className="text-sm text-blue-600 mt-1">{etapa.comentarios}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Información adicional según el estado */}
                {solicitudActual.estado_general === 'enviada' && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      📋 Tu solicitud ha sido recibida y será revisada en las próximas 24-48 horas.
                    </p>
                  </div>
                )}

                {solicitudActual.agente_asignado && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      👤 Agente asignado: {solicitudActual.agente_asignado.nombre}
                    </p>
                    {solicitudActual.fecha_entrevista && (
                      <p className="text-sm text-green-700 mt-1">
                        📅 Entrevista programada: {new Date(solicitudActual.fecha_entrevista.toDate()).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-6 text-center">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ver Mi Dashboard
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={currentStep === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNextStep(); }}>
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Información Personal</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombres *</label>
                      <input
                        type="text"
                        name="nombres"
                        value={formData.nombres}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.nombres ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ingresa tus nombres"
                      />
                      {errors.nombres && <p className="text-red-500 text-sm mt-1">{errors.nombres}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos *</label>
                      <input
                        type="text"
                        name="apellidos"
                        value={formData.apellidos}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.apellidos ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ingresa tus apellidos"
                      />
                      {errors.apellidos && <p className="text-red-500 text-sm mt-1">{errors.apellidos}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">RUT *</label>
                      <input
                        type="text"
                        name="rut"
                        value={formData.rut}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.rut ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="12.345.678-9"
                      />
                      {errors.rut && <p className="text-red-500 text-sm mt-1">{errors.rut}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.telefono ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="+56 9 1234 5678"
                      />
                      {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="tu@email.com"
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Información de Residencia</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dirección *</label>
                      <input
                        type="text"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.direccion ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Calle, número, departamento"
                      />
                      {errors.direccion && <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Comuna *</label>
                        <input
                          type="text"
                          name="comuna"
                          value={formData.comuna}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.comuna ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Tu comuna"
                        />
                        {errors.comuna && <p className="text-red-500 text-sm mt-1">{errors.comuna}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad *</label>
                        <input
                          type="text"
                          name="ciudad"
                          value={formData.ciudad}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.ciudad ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Tu ciudad"
                        />
                        {errors.ciudad && <p className="text-red-500 text-sm mt-1">{errors.ciudad}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Región *</label>
                      <select
                        name="region"
                        value={formData.region}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.region ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Selecciona tu región</option>
                        <option value="Arica y Parinacota">Arica y Parinacota</option>
                        <option value="Tarapacá">Tarapacá</option>
                        <option value="Antofagasta">Antofagasta</option>
                        <option value="Atacama">Atacama</option>
                        <option value="Coquimbo">Coquimbo</option>
                        <option value="Valparaíso">Valparaíso</option>
                        <option value="Metropolitana">Metropolitana</option>
                        <option value="O'Higgins">O'Higgins</option>
                        <option value="Maule">Maule</option>
                        <option value="Ñuble">Ñuble</option>
                        <option value="Biobío">Biobío</option>
                        <option value="La Araucanía">La Araucanía</option>
                        <option value="Los Ríos">Los Ríos</option>
                        <option value="Los Lagos">Los Lagos</option>
                        <option value="Aysén">Aysén</option>
                        <option value="Magallanes">Magallanes</option>
                      </select>
                      {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Información Adicional</h2>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento *</label>
                        <input
                          type="date"
                          name="fecha_nacimiento"
                          value={formData.fecha_nacimiento}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.fecha_nacimiento ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.fecha_nacimiento && <p className="text-red-500 text-sm mt-1">{errors.fecha_nacimiento}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Profesión</label>
                        <input
                          type="text"
                          name="profesion"
                          value={formData.profesion}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Tu profesión"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Empresa (Opcional)</label>
                      <input
                        type="text"
                        name="empresa"
                        value={formData.empresa}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nombre de tu empresa"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Motivo de Registro *</label>
                      <textarea
                        name="motivo_registro"
                        value={formData.motivo_registro}
                        onChange={handleInputChange}
                        rows={3}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.motivo_registro ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Cuéntanos por qué quieres registrarte en nuestra plataforma"
                      />
                      {errors.motivo_registro && <p className="text-red-500 text-sm mt-1">{errors.motivo_registro}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Servicios de Interés *</label>
                      <div className="grid md:grid-cols-2 gap-3">
                        {[
                          'Repuestos y Autopartes',
                          'Mantención Preventiva',
                          'Reparaciones Mecánicas',
                          'Seguros Automotrices',
                          'Revisión Técnica',
                          'Vulcanización',
                          'Servicios de Emergencia',
                          'Reciclaje de Vehículos'
                        ].map(servicio => (
                          <label key={servicio} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              name="servicios_interes"
                              value={servicio}
                              checked={formData.servicios_interes.includes(servicio)}
                              onChange={handleInputChange}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{servicio}</span>
                          </label>
                        ))}
                      </div>
                      {errors.servicios_interes && <p className="text-red-500 text-sm mt-1">{errors.servicios_interes}</p>}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Credenciales y Confirmación</h2>
                  
                  {/* Configurar contraseña para cuenta futura */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2">Configura tu contraseña</h3>
                    <p className="text-sm text-blue-800">
                      Esta contraseña se usará para crear tu cuenta una vez que tu solicitud sea aprobada.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Mínimo 6 caracteres"
                      />
                      {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña *</label>
                      <input
                        type="password"
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.confirm_password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Repite tu contraseña"
                      />
                      {errors.confirm_password && <p className="text-red-500 text-sm mt-1">{errors.confirm_password}</p>}
                    </div>
                  </div>

                  {/* Resumen de información */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4">Resumen de tu información:</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><span className="font-medium">Nombre:</span> {formData.nombres} {formData.apellidos}</p>
                        <p><span className="font-medium">RUT:</span> {formData.rut}</p>
                        <p><span className="font-medium">Email:</span> {formData.email}</p>
                        <p><span className="font-medium">Teléfono:</span> {formData.telefono}</p>
                        {formData.profesion && <p><span className="font-medium">Profesión:</span> {formData.profesion}</p>}
                      </div>
                      <div>
                        <p><span className="font-medium">Dirección:</span> {formData.direccion}</p>
                        <p><span className="font-medium">Comuna:</span> {formData.comuna}</p>
                        <p><span className="font-medium">Ciudad:</span> {formData.ciudad}</p>
                        <p><span className="font-medium">Región:</span> {formData.region}</p>
                        {formData.empresa && <p><span className="font-medium">Empresa:</span> {formData.empresa}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Términos y condiciones */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        name="acepta_terminos"
                        checked={formData.acepta_terminos}
                        onChange={handleInputChange}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="text-sm text-gray-700">
                        Acepto los <a href="/terminos" target="_blank" className="text-blue-600 hover:underline">términos y condiciones</a> de AV10 de Julio *
                      </label>
                    </div>
                    {errors.acepta_terminos && <p className="text-red-500 text-sm">{errors.acepta_terminos}</p>}

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        name="acepta_notificaciones"
                        checked={formData.acepta_notificaciones}
                        onChange={handleInputChange}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="text-sm text-gray-700">
                        Acepto recibir notificaciones sobre recordatorios, ofertas y novedades de la plataforma
                      </label>
                    </div>
                  </div>

                  {/* Información del proceso */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">¿Qué sigue después?</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <p>1. Recibirás un email de confirmación inmediatamente</p>
                      <p>2. Tu solicitud será revisada en 24-48 horas</p>
                      <p>3. Te contactaremos para validar la información</p>
                      <p>4. Se te asignará un agente de campo de tu zona</p>
                      <p>5. Una vez aprobado, se activará tu cuenta con la contraseña elegida</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navegación */}
              <div className="flex justify-between mt-8">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    ← Anterior
                  </button>
                )}
                <div className="flex-1"></div>
                
                {/* Indicador de progreso */}
                <div className="flex-1 flex justify-center items-center">
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4].map(step => (
                      <div
                        key={step}
                        className={`w-3 h-3 rounded-full ${
                          step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-3 text-sm text-gray-600">
                    Paso {currentStep} de 4
                  </span>
                </div>

                <div className="flex-1 flex justify-end">
                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Siguiente →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Enviando Solicitud...' : '📨 Enviar Solicitud'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
