import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function CrearEmpresaPublica({ onClose, onSuccess }) {
  console.log('🚀 CrearEmpresaPublica - VERSIÓN MEJORADA se está cargando');
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    sitio_web: '',
    horario_atencion: '',
    categorias: [],
    marcas: [],
    logo_url: '',
    descripcion: '',
    lat: '',
    lng: ''
  });

  // Estado para horarios estructurados
  const [horarios, setHorarios] = useState({
    lunes: { activo: true, inicio: '09:00', fin: '18:00' },
    martes: { activo: true, inicio: '09:00', fin: '18:00' },
    miercoles: { activo: true, inicio: '09:00', fin: '18:00' },
    jueves: { activo: true, inicio: '09:00', fin: '18:00' },
    viernes: { activo: true, inicio: '09:00', fin: '18:00' },
    sabado: { activo: true, inicio: '09:00', fin: '14:00' },
    domingo: { activo: false, inicio: '10:00', fin: '14:00' }
  });

  const [categorias, setCategorias] = useState([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoUploaded, setLogoUploaded] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');
  
  // Servicios principales predefinidos
  const [serviciosPredefinidos] = useState([
    { 
      id: 'revision_tecnica', 
      nombre: 'Revisión Técnica', 
      icono: '🔧', 
      color: 'blue',
      descripcion: 'Inspección técnica vehicular obligatoria',
      destacado: true
    },
    { 
      id: 'mecanica_general', 
      nombre: 'Mecánica General', 
      icono: '⚙️', 
      color: 'green',
      descripcion: 'Reparación y mantenimiento general de vehículos',
      destacado: true
    },
    { 
      id: 'vulcanizacion', 
      nombre: 'Vulcanización', 
      icono: '🛞', 
      color: 'purple',
      descripcion: 'Reparación y reconstrucción de neumáticos',
      destacado: true
    }
  ]);

  // Servicios adicionales
  const [serviciosAdicionales] = useState([
    { id: 'neumaticos', nombre: 'Neumáticos', icono: '🚗', color: 'red' },
    { id: 'frenos', nombre: 'Frenos', icono: '🛑', color: 'orange' },
    { id: 'suspension', nombre: 'Suspensión', icono: '🔩', color: 'indigo' },
    { id: 'motor', nombre: 'Motor', icono: '🔋', color: 'yellow' },
    { id: 'electricidad', nombre: 'Electricidad', icono: '⚡', color: 'pink' },
    { id: 'aire_acondicionado', nombre: 'Aire Acondicionado', icono: '❄️', color: 'cyan' }
  ]);
  
  const [servicioPersonalizado, setServicioPersonalizado] = useState('');
  const [serviciosPersonalizados, setServiciosPersonalizados] = useState([]);

  useEffect(() => {
    cargarCategorias();
    cargarMarcas();
  }, []);

  // Función para generar texto de horarios para mostrar
  const generarTextoHorarios = () => {
    const diasActivos = Object.entries(horarios)
      .filter(([_, config]) => config.activo)
      .map(([dia, config]) => {
        const nombreDia = dia === 'lunes' ? 'Lun' : 
                          dia === 'martes' ? 'Mar' :
                          dia === 'miercoles' ? 'Mié' :
                          dia === 'jueves' ? 'Jue' :
                          dia === 'viernes' ? 'Vie' :
                          dia === 'sabado' ? 'Sáb' : 'Dom';
        return `${nombreDia} ${config.inicio}-${config.fin}`;
      });
    
    return diasActivos.join(', ');
  };

  // Actualizar texto de horarios cuando cambien los horarios estructurados
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      horario_atencion: generarTextoHorarios()
    }));
  }, [horarios]);

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
      
      // Pre-seleccionar "Multimarca" si existe
      const multimarca = marcasData.find(marca => 
        marca.nombre.toLowerCase().includes('multimarca') || 
        marca.nombre.toLowerCase().includes('multi-marca')
      );
      
      if (multimarca) {
        setFormData(prev => ({
          ...prev,
          marcas: [multimarca.nombre] // Guardar el nombre, no el ID
        }));
      }
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

  const handleMarcaChange = (marcaNombre) => {
    setFormData(prev => ({
      ...prev,
      marcas: prev.marcas.includes(marcaNombre) 
        ? prev.marcas.filter(nombre => nombre !== marcaNombre)
        : [...prev.marcas, marcaNombre]
    }));
  };

  const handleCategoriaChange = (categoriaNombre) => {
    setFormData(prev => ({
      ...prev,
      categorias: prev.categorias.includes(categoriaNombre) 
        ? prev.categorias.filter(nombre => nombre !== categoriaNombre)
        : [...prev.categorias, categoriaNombre]
    }));
  };

  // Funciones para servicios personalizados
  const agregarServicioPersonalizado = () => {
    if (servicioPersonalizado.trim() && !serviciosPersonalizados.includes(servicioPersonalizado.trim())) {
      const nuevoServicio = servicioPersonalizado.trim();
      setServiciosPersonalizados(prev => [...prev, nuevoServicio]);
      setFormData(prev => ({
        ...prev,
        categorias: [...prev.categorias, nuevoServicio]
      }));
      setServicioPersonalizado('');
    }
  };

  const eliminarServicioPersonalizado = (servicio) => {
    setServiciosPersonalizados(prev => prev.filter(s => s !== servicio));
    setFormData(prev => ({
      ...prev,
      categorias: prev.categorias.filter(cat => cat !== servicio)
    }));
  };

  const handleServicioPredefinidoChange = (servicio) => {
    setFormData(prev => ({
      ...prev,
      categorias: prev.categorias.includes(servicio) 
        ? prev.categorias.filter(s => s !== servicio)
        : [...prev.categorias, servicio]
    }));
  };

  const handleServicioAdicionalChange = (servicio) => {
    setFormData(prev => ({
      ...prev,
      categorias: prev.categorias.includes(servicio) 
        ? prev.categorias.filter(s => s !== servicio)
        : [...prev.categorias, servicio]
    }));
  };

  // Función para manejar cambios en horarios
  const handleHorarioChange = (dia, campo, valor) => {
    setHorarios(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [campo]: campo === 'activo' ? valor : valor
      }
    }));
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoUploaded(false);
      setLogoError('');
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Subir logo automáticamente
      try {
        await uploadLogoToStorage(file);
      } catch (error) {
        console.error('Error en subida automática:', error);
      }
    }
  };

  const uploadLogoToStorage = async (file) => {
    if (!file) return null;
    
    setLogoUploading(true);
    setLogoError('');
    
    try {
      // Crear nombre único para el archivo
      const timestamp = Date.now();
      const fileName = `auto-${Math.random().toString(36).substr(2, 9)}-${timestamp}`;
      const fileExtension = file.name.split('.').pop();
      const fullFileName = `${fileName}.${fileExtension}`;
      
      // Referencia en Firebase Storage
      const storageRef = ref(storage, `logos/empresas/${fullFileName}`);
      
      console.log('📁 Subiendo logo:', file.name);
      console.log('📍 Ruta en Storage:', storageRef.fullPath);
      
      // Subir archivo
      const snapshot = await uploadBytes(storageRef, file);
      console.log('✅ Logo subido exitosamente:', snapshot.metadata.fullPath);
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('🔗 URL de descarga obtenida:', downloadURL);
      
      setLogoUploaded(true);
      setLogoUploading(false);
      
      return {
        gsUrl: `gs://${storageRef.bucket}/${storageRef.fullPath}`,
        downloadURL: downloadURL
      };
    } catch (error) {
      console.error('❌ Error subiendo logo:', error);
      setLogoError(`Error al subir logo: ${error.message}`);
      setLogoUploading(false);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones básicas
      if (!formData.nombre || !formData.direccion || formData.categorias.length === 0 || !formData.sitio_web) {
        alert('Por favor complete todos los campos obligatorios (nombre, dirección, servicios, sitio web)');
        setLoading(false);
        return;
      }

      // Validar que el logo esté subido si se seleccionó un archivo
      if (logoFile && !logoUploaded) {
        alert('Por favor espera a que el logo se suba completamente antes de guardar la empresa');
        setLoading(false);
        return;
      }

      let logoData = null;
      
      // Si hay un archivo de logo, subirlo a Storage
      if (logoFile) {
        logoData = await uploadLogoToStorage(logoFile);
      } else if (formData.logo_url) {
        // Si solo hay URL, usar esa
        logoData = {
          gsUrl: formData.logo_url,
          downloadURL: formData.logo_url
        };
      }

      // Las categorías y marcas ya están como nombres, no como IDs
      const categoriasSeleccionadas = formData.categorias; // Ya son nombres
      const marcasSeleccionadas = formData.marcas; // Ya son nombres
      
      console.log('🏷️ Categorías seleccionadas:', formData.categorias);
      console.log('🚗 Marcas seleccionadas:', formData.marcas);

      // Determinar si es empresa de Revisión Técnica
      const esRevisionTecnica = categoriasSeleccionadas.includes('Revisión Técnica');
      
      const empresaData = {
        ...formData,
        estado: 'ingresada', // Estado inicial: ingresada
        tipo_empresa: 'publica', // Empresa pública (visible para todos)
        es_comunidad: false, // No es parte de la comunidad aún
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
        creado_por: 'admin',
        // Campo especial para identificar empresas de revisión técnica
        tipoServicio: esRevisionTecnica ? 'revision_tecnica' : 'general',
        // Mapear campos correctamente
        web: formData.sitio_web,
        categoria: categoriasSeleccionadas.join(', '), // Categoría como string para compatibilidad
        categorias: categoriasSeleccionadas, // Nombres de categorías
        servicios: categoriasSeleccionadas, // Servicios (igual a categorías)
        logo: logoData ? logoData.gsUrl : '', // Guardar la URL gs:// para referencia
        logo_url: logoData ? logoData.downloadURL : formData.logo_url, // URL de descarga para visualización
        horario_atencion: generarTextoHorarios(), // Texto legible para compatibilidad
        horarios: horarios, // Estructura completa de horarios
        marcas: marcasSeleccionadas // Nombres de marcas
      };

      console.log('📝 Datos de empresa a guardar:', empresaData);
      console.log('🕐 Horarios estructurados:', horarios);
      console.log('📝 Texto de horarios:', generarTextoHorarios());
      console.log('🕐 Horario de atención guardado:', empresaData.horario_atencion);

      // Guardar en Firestore
      const docRef = await addDoc(collection(db, 'empresas'), empresaData);
      console.log('✅ Empresa creada exitosamente con ID:', docRef.id);
      
      alert('¡Empresa pública creada exitosamente!');
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('❌ Error creando empresa:', error);
      alert(`Error creando empresa: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header mejorado */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Crear Empresa Pública</h2>
                <p className="text-blue-100 text-sm">Registra una nueva empresa en el directorio</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all duration-200"
            >
              <span className="text-xl font-bold">×</span>
            </button>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="p-6">
            {/* Banner de verificación temporal */}
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 rounded-xl mb-6 text-center">
              <h3 className="text-lg font-bold">✅ VERSIÓN MEJORADA CARGADA</h3>
              <p className="text-sm">Diseño renovado con servicios destacados</p>
            </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información Básica */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">ℹ️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Información Básica</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  placeholder="Ej: Taller Automotriz San Miguel"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Dirección *
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  placeholder="Calle, número, comuna, región"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  placeholder="contacto@empresa.com"
                />
              </div>
            </div>

          </div>

          {/* Información de Negocio */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">🌐</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Información de Negocio</h3>
            </div>
            
            <div className="space-y-6">
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Sitio Web *
                </label>
                <input
                  type="url"
                  name="sitio_web"
                  value={formData.sitio_web}
                  onChange={handleChange}
                  placeholder="https://www.empresa.com"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Descripción de la Empresa
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows="4"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white resize-none"
                  placeholder="Describe los servicios que ofrece tu empresa, años de experiencia, especialidades, etc..."
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Logo de la Empresa
                </label>
                
                {/* Input para archivo mejorado */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Haz clic para subir logo</p>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF • Máximo 5MB</p>
                  </label>
                </div>

                {/* Preview del logo mejorado */}
                {logoPreview && (
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={logoPreview} 
                          alt="Preview del logo" 
                          className="h-24 w-24 object-contain border border-gray-200 rounded-lg"
                        />
                        {logoUploading && (
                          <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Estado del logo */}
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Vista previa del logo</h4>
                        
                        {logoUploading && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium">Subiendo logo...</span>
                          </div>
                        )}
                        
                        {logoUploaded && (
                          <div className="flex items-center gap-2 text-green-600">
                            <span className="text-lg">✅</span>
                            <span className="text-sm font-medium">Logo subido exitosamente</span>
                          </div>
                        )}
                        
                        {logoError && (
                          <div className="flex items-center gap-2 text-red-600">
                            <span className="text-lg">❌</span>
                            <span className="text-sm font-medium">{logoError}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Input para URL (opcional si no hay archivo) */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    O URL del Logo (opcional)
                  </label>
                  <input
                    type="url"
                    name="logo_url"
                    value={formData.logo_url}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/logo.png"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si no subes un archivo, puedes proporcionar una URL
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horarios de Atención *
                </label>
                <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  {Object.entries(horarios).map(([dia, config]) => (
                    <div key={dia} className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 min-w-[80px]">
                        <input
                          type="checkbox"
                          checked={config.activo}
                          onChange={(e) => handleHorarioChange(dia, 'activo', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium capitalize">
                          {dia === 'lunes' ? 'Lunes' : 
                           dia === 'martes' ? 'Martes' :
                           dia === 'miercoles' ? 'Miércoles' :
                           dia === 'jueves' ? 'Jueves' :
                           dia === 'viernes' ? 'Viernes' :
                           dia === 'sabado' ? 'Sábado' : 'Domingo'}
                        </span>
                      </label>
                      
                      {config.activo && (
                        <>
                          <input
                            type="time"
                            value={config.inicio}
                            onChange={(e) => handleHorarioChange(dia, 'inicio', e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                          <span className="text-gray-500">a</span>
                          <input
                            type="time"
                            value={config.fin}
                            onChange={(e) => handleHorarioChange(dia, 'fin', e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </>
                      )}
                      
                      {!config.activo && (
                        <span className="text-gray-400 text-sm">Cerrado</span>
                      )}
                    </div>
                  ))}
                  
                  {/* Resumen de horarios */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        <strong>Resumen:</strong> {generarTextoHorarios()}
                      </p>
                      <button
                        type="button"
                        onClick={() => setHorarios({
                          lunes: { activo: true, inicio: '09:00', fin: '18:00' },
                          martes: { activo: true, inicio: '09:00', fin: '18:00' },
                          miercoles: { activo: true, inicio: '09:00', fin: '18:00' },
                          jueves: { activo: true, inicio: '09:00', fin: '18:00' },
                          viernes: { activo: true, inicio: '09:00', fin: '18:00' },
                          sabado: { activo: true, inicio: '09:00', fin: '14:00' },
                          domingo: { activo: false, inicio: '10:00', fin: '14:00' }
                        })}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                      >
                        🔄 Restaurar por defecto
                      </button>
                    </div>
                  </div>
                </div>
              </div>

          {/* Servicios */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-lg">⚙️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Servicios que Ofrece *</h3>
            </div>
                
                {/* Servicios Principales - Destacados */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-700">Servicios Principales</h4>
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Recomendados</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {serviciosPredefinidos.map(servicio => (
                      <label 
                        key={servicio.id} 
                        className={`group relative flex flex-col items-center p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                          formData.categorias.includes(servicio.nombre)
                            ? `border-${servicio.color}-500 bg-${servicio.color}-50 shadow-md`
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.categorias.includes(servicio.nombre)}
                          onChange={() => handleServicioPredefinidoChange(servicio.nombre)}
                          className="sr-only"
                        />
                        <div className="text-4xl mb-3">{servicio.icono}</div>
                        <h5 className="text-lg font-semibold text-gray-800 mb-2 text-center">
                          {servicio.nombre}
                        </h5>
                        <p className="text-sm text-gray-600 text-center leading-relaxed">
                          {servicio.descripcion}
                        </p>
                        {formData.categorias.includes(servicio.nombre) && (
                          <div className="absolute top-2 right-2">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm">✓</span>
                            </div>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Servicios Adicionales */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">Otros Servicios</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {serviciosAdicionales.map(servicio => (
                      <label 
                        key={servicio.id} 
                        className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          formData.categorias.includes(servicio.nombre)
                            ? `border-${servicio.color}-500 bg-${servicio.color}-50`
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.categorias.includes(servicio.nombre)}
                          onChange={() => handleServicioAdicionalChange(servicio.nombre)}
                          className="sr-only"
                        />
                        <div className="text-2xl mb-2">{servicio.icono}</div>
                        <span className="text-sm font-medium text-gray-700 text-center">
                          {servicio.nombre}
                        </span>
                        {formData.categorias.includes(servicio.nombre) && (
                          <div className="mt-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Servicios Personalizados */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">Agregar Servicio Personalizado</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={servicioPersonalizado}
                        onChange={(e) => setServicioPersonalizado(e.target.value)}
                        placeholder="Ej: Alineación y balanceo, Reparación de aire acondicionado..."
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && agregarServicioPersonalizado()}
                      />
                      <button
                        type="button"
                        onClick={agregarServicioPersonalizado}
                        disabled={!servicioPersonalizado.trim()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        Agregar
                      </button>
                    </div>
                    
                    {/* Lista de servicios personalizados */}
                    {serviciosPersonalizados.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-3">Servicios personalizados agregados:</p>
                        <div className="flex flex-wrap gap-2">
                          {serviciosPersonalizados.map(servicio => (
                            <span 
                              key={servicio} 
                              className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm flex items-center space-x-2 font-medium"
                            >
                              <span>{servicio}</span>
                              <button
                                type="button"
                                onClick={() => eliminarServicioPersonalizado(servicio)}
                                className="text-purple-600 hover:text-purple-800 ml-1 font-bold"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validación y resumen */}
                {formData.categorias.length === 0 && (
                  <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="text-red-400 mr-3">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm text-red-700 font-medium">
                        Debes seleccionar al menos un servicio para continuar
                      </p>
                    </div>
                  </div>
                )}
                
                {formData.categorias.length > 0 && (
                  <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="text-green-400 mr-3">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm text-green-700 font-medium">
                        Servicios seleccionados ({formData.categorias.length})
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.categorias.map(servicio => (
                        <span 
                          key={servicio} 
                          className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {servicio}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Marcas */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Marcas que Atiende *</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {marcasDisponibles.map(marca => (
                <label key={marca.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.marcas.includes(marca.nombre)}
                    onChange={() => handleMarcaChange(marca.nombre)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{marca.nombre}</span>
                </label>
              ))}
            </div>
            {formData.marcas.length === 0 && (
              <p className="text-sm text-red-600 mt-1">Debes seleccionar al menos una marca</p>
            )}
            {formData.marcas.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-2">Marcas seleccionadas:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.marcas.map(marcaNombre => (
                    <span key={marcaNombre} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {marcaNombre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descripción breve de la empresa y sus servicios..."
            />
          </div>

          {/* Coordenadas (Opcional) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitud (Opcional)
              </label>
              <input
                type="number"
                name="lat"
                value={formData.lat}
                onChange={handleChange}
                step="any"
                placeholder="-33.4489"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitud (Opcional)
              </label>
              <input
                type="number"
                name="lng"
                value={formData.lng}
                onChange={handleChange}
                step="any"
                placeholder="-70.6693"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Botones de acción mejorados */}
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || (logoFile && !logoUploaded)}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creando...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Guardar Empresa</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Aviso sobre el logo */}
          {logoFile && !logoUploaded && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <span className="text-lg">⚠️</span>
                <span className="text-sm">
                  <strong>Importante:</strong> Debes esperar a que el logo se suba completamente antes de guardar la empresa.
                </span>
              </div>
            </div>
          )}
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}
