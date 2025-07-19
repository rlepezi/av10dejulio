import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import { NotificationService } from '../utils/notificationService';

export default function RegistroCliente() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [perfilCliente, setPerfilCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    rut: '',
    telefono: '',
    email: user?.email || '',
    fechaNacimiento: '',
    direccion: '',
    comuna: '',
    region: 'Metropolitana',
    profesion: '',
    motivoRegistro: '',
    tipoCliente: 'particular', // particular, empresa, mecanico
    aceptaTerminos: false,
    aceptaComunicaciones: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const comunasRM = [
    'Santiago', 'Las Condes', 'Vitacura', 'Providencia', 'Ñuñoa', 'La Reina',
    'Macul', 'Peñalolén', 'La Florida', 'Maipú', 'Pudahuel', 'Quilicura',
    'Renca', 'Cerro Navia', 'Lo Prado', 'Quinta Normal', 'Estación Central',
    'Cerrillos', 'Pedro Aguirre Cerda', 'San Miguel', 'San Joaquín', 'La Cisterna',
    'El Bosque', 'La Pintana', 'San Ramón', 'La Granja', 'Puente Alto',
    'Pirque', 'San José de Maipo', 'Colina', 'Lampa', 'Tiltil', 'Melipilla',
    'Curacaví', 'María Pinto', 'Alhué', 'San Pedro', 'Talagante', 'Peñaflor',
    'Padre Hurtado', 'El Monte', 'Isla de Maipo', 'Buin', 'Paine', 'Calera de Tango'
  ];

  const motivosRegistro = [
    'Gestionar recordatorios de mi vehículo',
    'Encontrar talleres y servicios cerca',
    'Recibir ofertas personalizadas',
    'Controlar gastos del vehículo',
    'Conectar con la comunidad automotriz',
    'Acceder a servicios premium',
    'Otro'
  ];

  useEffect(() => {
    if (user) {
      checkExistingProfile();
    }
  }, [user]);

  const checkExistingProfile = async () => {
    try {
      const perfilQuery = query(
        collection(db, 'perfiles_clientes'),
        where('userId', '==', user.uid)
      );
      const perfilSnapshot = await getDocs(perfilQuery);
      
      if (!perfilSnapshot.empty) {
        const perfil = { id: perfilSnapshot.docs[0].id, ...perfilSnapshot.docs[0].data() };
        setPerfilCliente(perfil);
        
        // Si ya está validado, redirigir al dashboard
        if (perfil.estado === 'activo') {
          navigate('/dashboard/cliente');
          return;
        }
        
        // Si existe pero no está validado, mostrar estado
        setCurrentStep(4); // Paso de estado de validación
      }
    } catch (error) {
      console.error('Error checking existing profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.nombres.trim()) newErrors.nombres = 'Los nombres son requeridos';
        if (!formData.apellidos.trim()) newErrors.apellidos = 'Los apellidos son requeridos';
        if (!formData.rut.trim()) newErrors.rut = 'El RUT es requerido';
        if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';
        if (!formData.email.trim()) newErrors.email = 'El email es requerido';
        break;
      
      case 2:
        if (!formData.direccion.trim()) newErrors.direccion = 'La dirección es requerida';
        if (!formData.comuna) newErrors.comuna = 'La comuna es requerida';
        if (!formData.region) newErrors.region = 'La región es requerida';
        break;
      
      case 3:
        if (!formData.motivoRegistro) newErrors.motivoRegistro = 'Selecciona un motivo de registro';
        if (!formData.aceptaTerminos) newErrors.aceptaTerminos = 'Debes aceptar los términos y condiciones';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const perfilData = {
        ...formData,
        userId: user.uid,
        estado: 'pendiente_validacion',
        fechaRegistro: new Date(),
        fechaActualizacion: new Date()
      };

      await addDoc(collection(db, 'perfiles_clientes'), perfilData);
      
      // Enviar notificación al admin
      await NotificationService.createInAppNotification(
        'admin',
        'validacion',
        'Nuevo cliente registrado',
        `${formData.nombres} ${formData.apellidos} se ha registrado como cliente`,
        {
          clienteNombre: `${formData.nombres} ${formData.apellidos}`,
          email: formData.email,
          origen: 'registro_cliente_fixed'
        }
      );

      setCurrentStep(4); // Mostrar paso de confirmación
      
    } catch (error) {
      console.error('Error submitting registration:', error);
      setErrors({ submit: 'Error al registrar. Por favor, intenta nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Información Personal';
      case 2: return 'Ubicación';
      case 3: return 'Finalizar Registro';
      case 4: return 'Estado de Validación';
      default: return 'Registro de Cliente';
    }
  };

  const getEstadoInfo = () => {
    if (!perfilCliente) return null;
    
    switch (perfilCliente.estado) {
      case 'pendiente_validacion':
        return {
          color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: '⏳',
          title: 'Validación Pendiente',
          message: 'Tu perfil está siendo revisado por nuestro equipo. Te notificaremos cuando esté aprobado.',
          action: null
        };
      case 'rechazado':
        return {
          color: 'bg-red-50 border-red-200 text-red-800',
          icon: '❌',
          title: 'Perfil Rechazado',
          message: perfilCliente.motivoRechazo || 'Tu perfil requiere correcciones.',
          action: () => setCurrentStep(1)
        };
      case 'activo':
        return {
          color: 'bg-green-50 border-green-200 text-green-800',
          icon: '✅',
          title: 'Perfil Aprobado',
          message: 'Tu perfil ha sido validado. Puedes acceder a tu dashboard.',
          action: () => navigate('/dashboard/cliente')
        };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Registro de Cliente</h1>
            <div className="text-sm text-gray-600">
              Paso {currentStep} de {currentStep === 4 ? 4 : 3}
            </div>
          </div>
          
          {currentStep < 4 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{getStepTitle()}</h2>

          {/* Paso 4: Estado de Validación */}
          {currentStep === 4 && (
            <div className="text-center">
              {(() => {
                const estadoInfo = getEstadoInfo();
                return estadoInfo ? (
                  <div className={`border rounded-lg p-8 ${estadoInfo.color}`}>
                    <div className="text-6xl mb-4">{estadoInfo.icon}</div>
                    <h3 className="text-2xl font-bold mb-4">{estadoInfo.title}</h3>
                    <p className="text-lg mb-6">{estadoInfo.message}</p>
                    {estadoInfo.action && (
                      <button
                        onClick={estadoInfo.action}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {perfilCliente?.estado === 'activo' ? 'Ir al Dashboard' : 'Corregir Información'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-8">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-2xl font-bold mb-4">¡Registro Exitoso!</h3>
                    <p className="text-lg mb-6">
                      Tu perfil ha sido enviado para validación. Te notificaremos cuando esté aprobado.
                    </p>
                    <div className="space-y-4">
                      <button
                        onClick={() => navigate('/dashboard/cliente')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mr-4"
                      >
                        Ir al Dashboard
                      </button>
                      <button
                        onClick={() => navigate('/')}
                        className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Volver al Inicio
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Formulario Multi-Step */}
          {currentStep < 4 && (
            <form onSubmit={currentStep === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNextStep(); }}>
              {/* Paso 1: Información Personal */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombres *
                      </label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apellidos *
                      </label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RUT *
                      </label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono *
                      </label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        name="fechaNacimiento"
                        value={formData.fechaNacimiento}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profesión
                    </label>
                    <input
                      type="text"
                      name="profesion"
                      value={formData.profesion}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Ingeniero, Vendedor, Estudiante"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Cliente
                    </label>
                    <select
                      name="tipoCliente"
                      value={formData.tipoCliente}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="particular">Particular</option>
                      <option value="empresa">Empresa</option>
                      <option value="mecanico">Mecánico/Técnico</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Paso 2: Ubicación */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección *
                    </label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comuna *
                      </label>
                      <select
                        name="comuna"
                        value={formData.comuna}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.comuna ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Selecciona una comuna</option>
                        {comunasRM.map((comuna) => (
                          <option key={comuna} value={comuna}>{comuna}</option>
                        ))}
                      </select>
                      {errors.comuna && <p className="text-red-500 text-sm mt-1">{errors.comuna}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Región *
                      </label>
                      <select
                        name="region"
                        value={formData.region}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.region ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="Metropolitana">Región Metropolitana</option>
                        <option value="Valparaíso">Región de Valparaíso</option>
                        <option value="O'Higgins">Región del Libertador Bernardo O'Higgins</option>
                        <option value="Maule">Región del Maule</option>
                        <option value="Biobío">Región del Biobío</option>
                        <option value="Araucanía">Región de La Araucanía</option>
                        <option value="Los Ríos">Región de Los Ríos</option>
                        <option value="Los Lagos">Región de Los Lagos</option>
                        <option value="Aysén">Región de Aysén</option>
                        <option value="Magallanes">Región de Magallanes</option>
                        <option value="Antofagasta">Región de Antofagasta</option>
                        <option value="Atacama">Región de Atacama</option>
                        <option value="Coquimbo">Región de Coquimbo</option>
                        <option value="Tarapacá">Región de Tarapacá</option>
                        <option value="Arica y Parinacota">Región de Arica y Parinacota</option>
                      </select>
                      {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 3: Finalizar */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Por qué te registras en AV10 de Julio? *
                    </label>
                    <select
                      name="motivoRegistro"
                      value={formData.motivoRegistro}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.motivoRegistro ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Selecciona un motivo</option>
                      {motivosRegistro.map((motivo) => (
                        <option key={motivo} value={motivo}>{motivo}</option>
                      ))}
                    </select>
                    {errors.motivoRegistro && <p className="text-red-500 text-sm mt-1">{errors.motivoRegistro}</p>}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name="aceptaTerminos"
                        checked={formData.aceptaTerminos}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                      <label className="text-sm text-gray-700">
                        Acepto los{' '}
                        <a href="/terminos" className="text-blue-600 hover:underline" target="_blank">
                          términos y condiciones
                        </a>{' '}
                        y la{' '}
                        <a href="/privacidad" className="text-blue-600 hover:underline" target="_blank">
                          política de privacidad
                        </a>{' '}
                        de AV10 de Julio *
                      </label>
                    </div>
                    {errors.aceptaTerminos && <p className="text-red-500 text-sm">{errors.aceptaTerminos}</p>}

                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name="aceptaComunicaciones"
                        checked={formData.aceptaComunicaciones}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                      <label className="text-sm text-gray-700">
                        Acepto recibir comunicaciones sobre ofertas, promociones y servicios de AV10 de Julio
                      </label>
                    </div>
                  </div>

                  {/* Resumen */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Resumen de tu registro:</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Nombre:</span> {formData.nombres} {formData.apellidos}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {formData.email}
                      </div>
                      <div>
                        <span className="font-medium">Teléfono:</span> {formData.telefono}
                      </div>
                      <div>
                        <span className="font-medium">Ubicación:</span> {formData.comuna}, {formData.region}
                      </div>
                      <div>
                        <span className="font-medium">Tipo:</span> {formData.tipoCliente}
                      </div>
                      <div>
                        <span className="font-medium">Motivo:</span> {formData.motivoRegistro}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {errors.submit}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ← Anterior
                  </button>
                )}
                
                <div className="ml-auto">
                  {currentStep < 3 ? (
                    <button
                      type="submit"
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
                      {isSubmitting ? 'Registrando...' : '✅ Completar Registro'}
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
