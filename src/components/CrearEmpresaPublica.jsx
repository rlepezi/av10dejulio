import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function CrearEmpresaPublica({ onClose, onSuccess }) {
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

      const empresaData = {
        ...formData,
        estado: 'ingresada', // Estado inicial: ingresada
        tipo_empresa: 'publica', // Empresa pública (visible para todos)
        es_comunidad: false, // No es parte de la comunidad aún
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
        creado_por: 'admin',
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Crear Empresa Pública</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Información Básica</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Información de Negocio */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Información de Negocio</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sitio Web *
                </label>
                <input
                  type="url"
                  name="sitio_web"
                  value={formData.sitio_web}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo de la Empresa
                </label>
                
                {/* Input para archivo */}
                <div className="mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos: JPG, PNG, GIF. Máximo 5MB
                  </p>
                </div>

                {/* Preview del logo */}
                {logoPreview && (
                  <div className="mb-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={logoPreview} 
                        alt="Preview del logo" 
                        className="h-20 w-20 object-contain border border-gray-300 rounded"
                      />
                      
                      {/* Estado del logo */}
                      <div className="flex-1">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servicios *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border border-gray-300 rounded-md bg-gray-50">
                  {categorias.map(categoria => (
                    <label key={categoria.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.categorias.includes(categoria.nombre)}
                        onChange={() => handleCategoriaChange(categoria.nombre)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{categoria.nombre}</span>
                    </label>
                  ))}
                </div>
                {formData.categorias.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">Debes seleccionar al menos un servicio</p>
                )}
                {formData.categorias.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Servicios seleccionados:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.categorias.map(catNombre => (
                        <span key={catNombre} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {catNombre}
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

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (logoFile && !logoUploaded)}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 font-medium text-lg shadow-lg"
            >
              {loading ? '⏳ Creando...' : '💾 Guardar Empresa'}
            </button>
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
  );
}
