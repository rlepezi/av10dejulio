import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from './AuthProvider';

export default function CrearEmpresaAdmin({ onClose, onSuccess }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');

  const [formData, setFormData] = useState({
    // Información básica
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    comuna: '',
    region: '',
    sitio_web: '',
    descripcion: '',
    
    // Información del representante
    representante_nombre: '',
    representante_apellidos: '',
    representante_email: '',
    representante_telefono: '',
    representante_cargo: '',
    representante_cedula: '',
    
    // Servicios y especialidades
    tipo_empresa: 'Taller Mecánico',
    categorias: [],
    marcas: [],
    servicios: [],
    
    // Horarios
    horarios: {
      lunes: { activo: true, inicio: '09:00', fin: '18:00' },
      martes: { activo: true, inicio: '09:00', fin: '18:00' },
      miercoles: { activo: true, inicio: '09:00', fin: '18:00' },
      jueves: { activo: true, inicio: '09:00', fin: '18:00' },
      viernes: { activo: true, inicio: '09:00', fin: '18:00' },
      sabado: { activo: true, inicio: '09:00', fin: '14:00' },
      domingo: { activo: false, inicio: '10:00', fin: '14:00' }
    },
    
    // Estado y validación
    estado: 'activa',
    validada: true,
    fecha_validacion: serverTimestamp(),
    agente_validador: user?.email || '',
    notas_validacion: 'Empresa creada por administrador'
  });

  const [categorias, setCategorias] = useState([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);
  const [servicioInput, setServicioInput] = useState('');

  const tiposEmpresa = [
    'Taller Mecánico',
    'Vulcanizadora',
    'Lubricentro',
    'Centro de Revisión Técnica',
    'Electricidad Automotriz',
    'Pintura y Carrocería',
    'Lavado de Autos',
    'Grúa y Auxilio',
    'Venta de Repuestos',
    'Accesorios Automotrices'
  ];

  const regiones = [
    'Metropolitana',
    'Valparaíso',
    'Biobío',
    'La Araucanía',
    'Los Lagos',
    'Antofagasta',
    'Atacama',
    'Coquimbo',
    'O\'Higgins',
    'Maule',
    'Ñuble',
    'Los Ríos',
    'Aysén',
    'Magallanes',
    'Arica y Parinacota',
    'Tarapacá'
  ];

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRepresentanteChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [`representante_${name}`]: value
    }));
  };

  const handleHorarioChange = (dia, campo, value) => {
    setFormData(prev => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [dia]: {
          ...prev.horarios[dia],
          [campo]: value
        }
      }
    }));
  };

  const handleCategoriaChange = (categoriaId) => {
    setFormData(prev => ({
      ...prev,
      categorias: prev.categorias.includes(categoriaId)
        ? prev.categorias.filter(id => id !== categoriaId)
        : [...prev.categorias, categoriaId]
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

  const agregarServicio = () => {
    if (servicioInput.trim()) {
      setFormData(prev => ({
        ...prev,
        servicios: [...prev.servicios, servicioInput.trim()]
      }));
      setServicioInput('');
    }
  };

  const eliminarServicio = (index) => {
    setFormData(prev => ({
      ...prev,
      servicios: prev.servicios.filter((_, i) => i !== index)
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setLogoError('El archivo debe ser menor a 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setLogoError('El archivo debe ser una imagen');
        return;
      }

      setLogoFile(file);
      setLogoError('');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const subirLogo = async () => {
    if (!logoFile) return null;

    setLogoUploading(true);
    try {
      const logoRef = ref(storage, `logos-empresas/${Date.now()}-${logoFile.name}`);
      const snapshot = await uploadBytes(logoRef, logoFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setLogoUploaded(true);
      return downloadURL;
    } catch (error) {
      console.error('Error subiendo logo:', error);
      setLogoError('Error subiendo el logo');
      return null;
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Subir logo si existe
      let logoUrl = '';
      if (logoFile) {
        logoUrl = await subirLogo();
        if (!logoUrl) {
          setLoading(false);
          return;
        }
      }

      // Crear datos de la empresa
      const empresaData = {
        ...formData,
        logo_url: logoUrl,
        fecha_creacion: serverTimestamp(),
        creado_por: user?.email || 'admin',
        tipo_creacion: 'admin'
      };

      // Guardar en Firebase
      await addDoc(collection(db, 'empresas'), empresaData);

      alert('Empresa creada exitosamente');
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/admin/empresas');
      }
    } catch (error) {
      console.error('Error creando empresa:', error);
      alert('Error al crear la empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Crear Nueva Empresa</h1>
            <button
              onClick={onClose || (() => navigate('/admin/empresas'))}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              ← Volver a Empresas
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información Básica */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Básica</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Empresa *</label>
                  <select
                    name="tipo_empresa"
                    value={formData.tipo_empresa}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {tiposEmpresa.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
                  <input
                    type="url"
                    name="sitio_web"
                    value={formData.sitio_web}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Región *</label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar región</option>
                    {regiones.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comuna *</label>
                  <input
                    type="text"
                    name="comuna"
                    value={formData.comuna}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe los servicios que ofrece la empresa..."
                  />
                </div>
              </div>
            </div>

            {/* Información del Representante */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Representante</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.representante_nombre}
                    onChange={handleRepresentanteChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    name="apellidos"
                    value={formData.representante_apellidos}
                    onChange={handleRepresentanteChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.representante_email}
                    onChange={handleRepresentanteChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.representante_telefono}
                    onChange={handleRepresentanteChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo *</label>
                  <input
                    type="text"
                    name="cargo"
                    value={formData.representante_cargo}
                    onChange={handleRepresentanteChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cédula/RUT *</label>
                  <input
                    type="text"
                    name="cedula"
                    value={formData.representante_cedula}
                    onChange={handleRepresentanteChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Servicios y Especialidades */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Servicios y Especialidades</h2>
              
              {/* Servicios */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Servicios Ofrecidos</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={servicioInput}
                    onChange={(e) => setServicioInput(e.target.value)}
                    placeholder="Agregar servicio..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarServicio())}
                  />
                  <button
                    type="button"
                    onClick={agregarServicio}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.servicios.map((servicio, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {servicio}
                      <button
                        type="button"
                        onClick={() => eliminarServicio(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Categorías */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Categorías</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {categorias.map(categoria => (
                    <label key={categoria.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.categorias.includes(categoria.id)}
                        onChange={() => handleCategoriaChange(categoria.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{categoria.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Marcas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marcas que Atiende</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {marcasDisponibles.map(marca => (
                    <label key={marca.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.marcas.includes(marca.id)}
                        onChange={() => handleMarcaChange(marca.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{marca.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Horarios */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Horarios de Atención</h2>
              <div className="space-y-3">
                {Object.entries(formData.horarios).map(([dia, config]) => (
                  <div key={dia} className="flex items-center gap-4">
                    <div className="w-24">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.activo}
                          onChange={(e) => handleHorarioChange(dia, 'activo', e.target.checked)}
                          className="rounded"
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
                    </div>
                    {config.activo && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={config.inicio}
                          onChange={(e) => handleHorarioChange(dia, 'inicio', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        <span>a</span>
                        <input
                          type="time"
                          value={config.fin}
                          onChange={(e) => handleHorarioChange(dia, 'fin', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Logo */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Logo de la Empresa</h2>
              <div className="flex items-start gap-6">
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {logoError && <p className="text-red-500 text-sm mt-1">{logoError}</p>}
                  <p className="text-xs text-gray-500 mt-1">Máximo 5MB. Formatos: JPG, PNG, GIF</p>
                </div>
                {logoPreview && (
                  <div className="flex-shrink-0">
                    <img
                      src={logoPreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onClose || (() => navigate('/admin/empresas'))}
                className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || logoUploading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Empresa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
