import React, { useState } from 'react';
import { collection, addDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

export default function FormularioAgenteEmpresa({ onSolicitudCreada }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    categoria: '',
    rubro: '', // Nuevo campo para rubro específico
    tipoEmpresa: 'pyme', // Nuevo campo para tipo de empresa
    descripcion: '',
    rut: '',
    contacto_nombre: '',
    contacto_telefono: '',
    // NUEVOS CAMPOS REQUERIDOS
    web: '',
    anos_funcionamiento: '',
    redes_sociales: {
      facebook: '',
      instagram: '',
      linkedin: '',
      twitter: ''
    },
    logo_url: '',
    // Nuevos campos para datos del encargado
    encargado_nombre: '',
    encargado_telefono: '',
    encargado_email: '',
    encargado_fecha_nacimiento: '',
    encargado_cargo: '',
    // Campos de validación del agente
    documentacion_validada: false,
    documento_empresa_verificado: false,
    firma_acuerdo_obtenida: false,
    direccion_verificada: false,
    horarios: {
      lunes: { activo: false, inicio: '09:00', fin: '18:00' },
      martes: { activo: false, inicio: '09:00', fin: '18:00' },
      miercoles: { activo: false, inicio: '09:00', fin: '18:00' },
      jueves: { activo: false, inicio: '09:00', fin: '18:00' },
      viernes: { activo: false, inicio: '09:00', fin: '18:00' },
      sabado: { activo: false, inicio: '09:00', fin: '18:00' },
      domingo: { activo: false, inicio: '09:00', fin: '18:00' }
    },
    activar_inmediatamente: false
  });
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const categorias = [
    'Mecánica',
    'Repuestos',
    'Lubricantes',
    'Neumáticos',
    'Cerrajería',
    'Electrónica',
    'Pintura',
    'Seguros',
    'Otros servicios'
  ];

  const tiposEmpresa = [
    { value: 'proveedor', label: 'Proveedor' },
    { value: 'pyme', label: 'PyME' },
    { value: 'emprendimiento', label: 'Emprendimiento' }
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRedesSocialesChange = (red, valor) => {
    setFormData(prev => ({
      ...prev,
      redes_sociales: {
        ...prev.redes_sociales,
        [red]: valor
      }
    }));
  };

  const handleHorarioChange = (dia, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [dia]: {
          ...prev.horarios[dia],
          [campo]: valor
        }
      }
    }));
  };

  const validarFormulario = () => {
    const camposRequeridos = ['nombre', 'email', 'telefono', 'direccion', 'categoria', 'rubro', 'tipoEmpresa', 'anos_funcionamiento'];
    const camposFaltantes = camposRequeridos.filter(campo => !formData[campo]);
    
    if (camposFaltantes.length > 0) {
      setMensaje(`Faltan los siguientes campos: ${camposFaltantes.join(', ')}`);
      return false;
    }

    // Validación específica para agentes
    if (formData.documentacion_validada) {
      // Si marca que validó documentación, debe completar todos los campos de validación
      const validacionesRequeridas = [
        { campo: 'documento_empresa_verificado', nombre: 'Documento que acredita empresa' },
        { campo: 'firma_acuerdo_obtenida', nombre: 'Firma de acuerdo' },
        { campo: 'direccion_verificada', nombre: 'Verificación de dirección' }
      ];

      const validacionesFaltantes = validacionesRequeridas.filter(
        validacion => !formData[validacion.campo]
      );

      if (validacionesFaltantes.length > 0) {
        setMensaje(`Si marcas "Documentación validada", debes confirmar: ${validacionesFaltantes.map(v => v.nombre).join(', ')}`);
        return false;
      }
    }

    // Validar datos del encargado si están presentes
    if (formData.encargado_nombre && !formData.encargado_telefono) {
      setMensaje('Si ingresas el nombre del encargado, el teléfono es requerido');
      return false;
    }
    
    return true;
  };

  const verificarPermisos = async () => {
    try {
      // Verificar si el usuario es agente y tiene permisos
      // Buscar por uid en lugar de usar el uid como ID del documento
      const q = query(
        collection(db, 'agentes'),
        where('uid', '==', user.uid),
        where('activo', '==', true)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setMensaje('No tienes permisos de agente');
        return false;
      }
      
      const agenteDoc = snapshot.docs[0];
      const agenteData = agenteDoc.data();
      
      if (!agenteData.activo) {
        setMensaje('Tu cuenta de agente está desactivada');
        return false;
      }
      
      // Retornar tanto los datos como el ID del documento
      return {
        ...agenteData,
        id: agenteDoc.id
      };
    } catch (error) {
      console.error('Error verificando permisos:', error);
      setMensaje('Error verificando permisos');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setProcesando(true);
    setMensaje('');

    try {
      // Verificar permisos de agente
      const agenteData = await verificarPermisos();
      if (!agenteData) {
        setProcesando(false);
        return;
      }

      const ahora = new Date();
      
      // Crear solicitud de empresa
      const solicitudData = {
        // Datos básicos de la empresa
        nombre_empresa: formData.nombre,
        email_empresa: formData.email,
        telefono_empresa: formData.telefono,
        direccion_empresa: formData.direccion,
        categoria: formData.categoria,
        descripcion: formData.descripcion,
        rut_empresa: formData.rut,
        
        // NUEVOS CAMPOS REQUERIDOS
        web: formData.web,
        anos_funcionamiento: formData.anos_funcionamiento,
        redes_sociales: formData.redes_sociales,
        logo_url: formData.logo_url,
        
        // Datos de contacto principal
        representante_nombre: formData.contacto_nombre || formData.nombre,
        representante_email: formData.email,
        representante_telefono: formData.contacto_telefono || formData.telefono,
        
        // Datos del encargado (para cumpleaños)
        encargado_nombre: formData.encargado_nombre,
        encargado_telefono: formData.encargado_telefono,
        encargado_email: formData.encargado_email,
        encargado_fecha_nacimiento: formData.encargado_fecha_nacimiento,
        encargado_cargo: formData.encargado_cargo,
        
        // Horarios de atención
        horarios: formData.horarios,
        
        // Estado y procesamiento
        estado: formData.activar_inmediatamente && agenteData.permisos?.activar_empresas ? 'activada' : 'pendiente',
        fecha_solicitud: ahora,
        
        // Información del agente
        agente_id: agenteData.id,
        agente_nombre: agenteData.nombre,
        agente_email: agenteData.email,
        agente_zona: agenteData.zona_asignada,
        tipo_solicitud: 'agente_terreno',
        
        // Validaciones del agente (NUEVO)
        documentacion_validada_por_agente: formData.documentacion_validada,
        documento_empresa_verificado: formData.documento_empresa_verificado,
        firma_acuerdo_obtenida: formData.firma_acuerdo_obtenida,
        direccion_verificada_presencial: formData.direccion_verificada,
        
        // Para distinguir que no requiere visita adicional
        visita_agente_requerida: false, // No es obligatorio para agentes
        validacion_presencial_completada: formData.documentacion_validada,
        
        // Notas del agente
        notas_agente: `Solicitud creada en terreno por agente ${agenteData.nombre}. ${
          formData.documentacion_validada ? 'Documentación validada presencialmente.' : 'Pendiente validación documental.'
        }`
      };

      const solicitudRef = await addDoc(collection(db, 'solicitudes_empresa'), solicitudData);

      // Si el agente puede activar empresas directamente
      if (formData.activar_inmediatamente && agenteData.permisos?.activar_empresas) {
        const empresaData = {
          ...solicitudData,
          estado: 'activa',
          etapa_proceso: 'activada_sin_credenciales', // Primera etapa completada
          fecha_activacion: ahora,
          solicitud_id: solicitudRef.id,
          web: formData.web || '', // Puede estar vacío para crear perfil público
          logo: formData.logo_url || '',
          verificada: false,
          activa: true,
          tiene_credenciales_asignadas: false // Para segunda etapa
        };

        delete empresaData.fecha_solicitud;
        delete empresaData.tipo_solicitud;
        delete empresaData.notas_agente;

        await addDoc(collection(db, 'empresas'), empresaData);
        
        setMensaje('¡Empresa creada y activada exitosamente! (Visible en home, pendiente asignar credenciales)');
      } else {
        setMensaje('Solicitud enviada para revisión. Será procesada por el administrador.');
      }

      // Limpiar formulario
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        direccion: '',
        categoria: '',
        descripcion: '',
        rut: '',
        contacto_nombre: '',
        contacto_telefono: '',
        // NUEVOS CAMPOS REQUERIDOS
        web: '',
        anos_funcionamiento: '',
        redes_sociales: {
          facebook: '',
          instagram: '',
          linkedin: '',
          twitter: ''
        },
        logo_url: '',
        // Nuevos campos para datos del encargado
        encargado_nombre: '',
        encargado_telefono: '',
        encargado_email: '',
        encargado_fecha_nacimiento: '',
        encargado_cargo: '',
        // Campos de validación del agente
        documentacion_validada: false,
        documento_empresa_verificado: false,
        firma_acuerdo_obtenida: false,
        direccion_verificada: false,
        horarios: {
          lunes: { activo: false, inicio: '09:00', fin: '18:00' },
          martes: { activo: false, inicio: '09:00', fin: '18:00' },
          miercoles: { activo: false, inicio: '09:00', fin: '18:00' },
          jueves: { activo: false, inicio: '09:00', fin: '18:00' },
          viernes: { activo: false, inicio: '09:00', fin: '18:00' },
          sabado: { activo: false, inicio: '09:00', fin: '18:00' },
          domingo: { activo: false, inicio: '09:00', fin: '18:00' }
        },
        activar_inmediatamente: false
      });

      // Notificar al componente padre que se creó una solicitud
      if (onSolicitudCreada) {
        setTimeout(() => {
          onSolicitudCreada();
        }, 1500);
      }

    } catch (error) {
      console.error('Error creando solicitud:', error);
      setMensaje('Error al procesar la solicitud: ' + error.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        📋 Registro de Empresa en Terreno
      </h2>
      
      {mensaje && (
        <div className={`p-4 rounded-lg mb-6 ${
          mensaje.includes('exitosamente') ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {mensaje}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información básica */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Empresa *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RUT (opcional)
            </label>
            <input
              type="text"
              name="rut"
              value={formData.rut}
              onChange={handleChange}
              placeholder="12.345.678-9"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contacto Principal
            </label>
            <input
              type="text"
              name="contacto_nombre"
              value={formData.contacto_nombre}
              onChange={handleChange}
              placeholder="Nombre del contacto"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección *
          </label>
          <input
            type="text"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción del Negocio
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe brevemente el negocio y sus servicios..."
          />
        </div>

        {/* Campos de clasificación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>{categoria}</option>
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
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar rubro</option>
              {rubrosEspecificos.map((rubro) => (
                <option key={rubro} value={rubro}>{rubro}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Empresa *
            </label>
            <select
              name="tipoEmpresa"
              value={formData.tipoEmpresa}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {tiposEmpresa.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* NUEVOS CAMPOS REQUERIDOS */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            🌐 Información Adicional de la Empresa
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Página Web
              </label>
              <input
                type="url"
                name="web"
                value={formData.web}
                onChange={handleChange}
                placeholder="https://www.empresa.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Si no tiene sitio web, se creará un perfil público detallado
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Años de Funcionamiento *
              </label>
              <select
                name="anos_funcionamiento"
                value={formData.anos_funcionamiento}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar...</option>
                <option value="menos_1">Menos de 1 año</option>
                <option value="1_2">1-2 años</option>
                <option value="3_5">3-5 años</option>
                <option value="6_10">6-10 años</option>
                <option value="11_20">11-20 años</option>
                <option value="mas_20">Más de 20 años</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL del Logo
              </label>
              <input
                type="url"
                name="logo_url"
                value={formData.logo_url}
                onChange={handleChange}
                placeholder="https://ejemplo.com/logo.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL del logo de la empresa (opcional)
              </p>
            </div>

            {/* Redes Sociales */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Redes Sociales
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Facebook</label>
                  <input
                    type="url"
                    value={formData.redes_sociales.facebook}
                    onChange={(e) => handleRedesSocialesChange('facebook', e.target.value)}
                    placeholder="https://facebook.com/empresa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Instagram</label>
                  <input
                    type="url"
                    value={formData.redes_sociales.instagram}
                    onChange={(e) => handleRedesSocialesChange('instagram', e.target.value)}
                    placeholder="https://instagram.com/empresa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">LinkedIn</label>
                  <input
                    type="url"
                    value={formData.redes_sociales.linkedin}
                    onChange={(e) => handleRedesSocialesChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/empresa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Twitter</label>
                  <input
                    type="url"
                    value={formData.redes_sociales.twitter}
                    onChange={(e) => handleRedesSocialesChange('twitter', e.target.value)}
                    placeholder="https://twitter.com/empresa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Datos del Encargado */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            👤 Datos del Encargado (para comunicación personalizada)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Encargado
              </label>
              <input
                type="text"
                name="encargado_nombre"
                value={formData.encargado_nombre}
                onChange={handleChange}
                placeholder="Ej: Juan Pérez"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo
              </label>
              <input
                type="text"
                name="encargado_cargo"
                value={formData.encargado_cargo}
                onChange={handleChange}
                placeholder="Ej: Gerente, Propietario, Encargado"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono del Encargado
              </label>
              <input
                type="tel"
                name="encargado_telefono"
                value={formData.encargado_telefono}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email del Encargado
              </label>
              <input
                type="email"
                name="encargado_email"
                value={formData.encargado_email}
                onChange={handleChange}
                placeholder="encargado@empresa.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Nacimiento
                <span className="text-xs text-gray-500 ml-1">(para saludos de cumpleaños)</span>
              </label>
              <input
                type="date"
                name="encargado_fecha_nacimiento"
                value={formData.encargado_fecha_nacimiento}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Validación Documental del Agente */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            📋 Validación Presencial (Agente de Campo)
          </h3>
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="documentacion_validada"
                checked={formData.documentacion_validada}
                onChange={handleChange}
                className="rounded text-blue-600 focus:ring-blue-500"
                id="documentacion_validada"
              />
              <label htmlFor="documentacion_validada" className="text-sm font-medium text-gray-700">
                ✅ Documentación validada presencialmente
              </label>
            </div>

            {formData.documentacion_validada && (
              <div className="ml-6 space-y-3 p-3 bg-white rounded border">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Confirma las siguientes validaciones:</strong>
                </p>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="documento_empresa_verificado"
                    checked={formData.documento_empresa_verificado}
                    onChange={handleChange}
                    className="rounded text-green-600"
                    id="documento_empresa_verificado"
                  />
                  <label htmlFor="documento_empresa_verificado" className="text-sm text-gray-700">
                    Documento que acredita la empresa verificado
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="firma_acuerdo_obtenida"
                    checked={formData.firma_acuerdo_obtenida}
                    onChange={handleChange}
                    className="rounded text-green-600"
                    id="firma_acuerdo_obtenida"
                  />
                  <label htmlFor="firma_acuerdo_obtenida" className="text-sm text-gray-700">
                    Firma de acuerdo comercial obtenida
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="direccion_verificada"
                    checked={formData.direccion_verificada}
                    onChange={handleChange}
                    className="rounded text-green-600"
                    id="direccion_verificada"
                  />
                  <label htmlFor="direccion_verificada" className="text-sm text-gray-700">
                    Dirección verificada presencialmente
                  </label>
                </div>
              </div>
            )}

            <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
              💡 <strong>Nota:</strong> Para agentes de campo, la validación presencial es opcional pero recomendada. 
              Si marcas "Documentación validada", la solicitud tendrá prioridad en el procesamiento.
            </div>
          </div>
        </div>

        {/* Horarios */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">🕒 Horarios de Atención</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(formData.horarios).map(([dia, horario]) => (
              <div key={dia} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-gray-700 capitalize">
                    {dia}
                  </label>
                  <input
                    type="checkbox"
                    checked={horario.activo}
                    onChange={(e) => handleHorarioChange(dia, 'activo', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                </div>
                {horario.activo && (
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={horario.inicio}
                      onChange={(e) => handleHorarioChange(dia, 'inicio', e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-gray-500 text-sm py-1">-</span>
                    <input
                      type="time"
                      value={horario.fin}
                      onChange={(e) => handleHorarioChange(dia, 'fin', e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="activar_inmediatamente"
            checked={formData.activar_inmediatamente}
            onChange={handleChange}
            className="rounded text-blue-600 mr-2"
          />
          <label className="text-sm text-gray-700">
            Activar empresa inmediatamente (requiere permisos especiales)
          </label>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                nombre: '',
                email: '',
                telefono: '',
                direccion: '',
                categoria: '',
                rubro: '',
                tipoEmpresa: 'pyme',
                descripcion: '',
                rut: '',
                contacto_nombre: '',
                contacto_telefono: '',
                // NUEVOS CAMPOS REQUERIDOS
                web: '',
                anos_funcionamiento: '',
                redes_sociales: {
                  facebook: '',
                  instagram: '',
                  linkedin: '',
                  twitter: ''
                },
                logo_url: '',
                // Nuevos campos para datos del encargado
                encargado_nombre: '',
                encargado_telefono: '',
                encargado_email: '',
                encargado_fecha_nacimiento: '',
                encargado_cargo: '',
                // Campos de validación del agente
                documentacion_validada: false,
                documento_empresa_verificado: false,
                firma_acuerdo_obtenida: false,
                direccion_verificada: false,
                horarios: {
                  lunes: { activo: false, inicio: '09:00', fin: '18:00' },
                  martes: { activo: false, inicio: '09:00', fin: '18:00' },
                  miercoles: { activo: false, inicio: '09:00', fin: '18:00' },
                  jueves: { activo: false, inicio: '09:00', fin: '18:00' },
                  viernes: { activo: false, inicio: '09:00', fin: '18:00' },
                  sabado: { activo: false, inicio: '09:00', fin: '18:00' },
                  domingo: { activo: false, inicio: '09:00', fin: '18:00' }
                },
                activar_inmediatamente: false
              });
              setMensaje('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={procesando}
          >
            Limpiar
          </button>
          <button
            type="submit"
            disabled={procesando}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {procesando ? 'Procesando...' : 'Enviar Solicitud'}
          </button>
        </div>
      </form>
    </div>
  );
}
