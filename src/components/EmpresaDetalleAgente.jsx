import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import DashboardLayout from './DashboardLayout';
import { useAuth } from './AuthProvider';
import { serverTimestamp } from 'firebase/firestore';
import pushNotificationService from '../services/PushNotificationService';
import { ESTADOS_EMPRESA, obtenerDescripcionEstado, puedeTransicionar } from '../utils/empresaStandards';
import { useImageUrl } from '../hooks/useImageUrl';

export default function EmpresaDetalleAgente() {
  const { user, rol } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    web: '',
    categoria: '',
    descripcion: '',
    tipoEmpresa: '',
    estado: '',
    representante: {
      nombre: '',
      apellidos: '',
      email: '',
      telefono: '',
      cargo: '',
      cedula: ''
    }
  });
  const { empresaId } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [validando, setValidando] = useState(false);
  const [saving, setSaving] = useState(false);
  // Helpers para chips y galería
  const [servicioInput, setServicioInput] = useState('');
  const [marcaInput, setMarcaInput] = useState('');
  const [galeriaInput, setGaleriaInput] = useState('');
  const [horariosEdit, setHorariosEdit] = useState({});
  const [notaAdmin, setNotaAdmin] = useState('');

  // Hook para manejar la URL del logo
  const { imageUrl: logoUrl, loading: logoLoading, error: logoError } = useImageUrl(empresa?.logo_url || empresa?.logo);

  useEffect(() => {
    if (empresa) {
      // Inicializar horarios correctamente
      let horariosIniciales = {};
      if (empresa.horarios) {
        // Si ya tiene horarios estructurados, usarlos
        if (typeof empresa.horarios === 'object' && !Array.isArray(empresa.horarios)) {
          horariosIniciales = empresa.horarios;
        } else {
          // Si tiene horario como string, crear estructura básica
          horariosIniciales = {
            'Lunes': { abierto: false, inicio: '09:00', fin: '18:00' },
            'Martes': { abierto: false, inicio: '09:00', fin: '18:00' },
            'Miércoles': { abierto: false, inicio: '09:00', fin: '18:00' },
            'Jueves': { abierto: false, inicio: '09:00', fin: '18:00' },
            'Viernes': { abierto: false, inicio: '09:00', fin: '18:00' },
            'Sábado': { abierto: false, inicio: '09:00', fin: '14:00' },
            'Domingo': { abierto: false, inicio: '09:00', fin: '14:00' }
          };
        }
      } else {
        // Crear estructura de horarios por defecto
        horariosIniciales = {
          'Lunes': { abierto: false, inicio: '09:00', fin: '18:00' },
          'Martes': { abierto: false, inicio: '09:00', fin: '18:00' },
          'Miércoles': { abierto: false, inicio: '09:00', fin: '18:00' },
          'Jueves': { abierto: false, inicio: '09:00', fin: '18:00' },
          'Viernes': { abierto: false, inicio: '09:00', fin: '18:00' },
          'Sábado': { abierto: false, inicio: '09:00', fin: '14:00' },
          'Domingo': { abierto: false, inicio: '09:00', fin: '14:00' }
        };
      }
      setHorariosEdit(horariosIniciales);
      setNotaAdmin(empresa.notas_admin || '');
    }
  }, [empresa]);

  const handleAddServicio = () => {
    if (servicioInput.trim()) {
      setEmpresa(prev => ({ ...prev, servicios: [...(prev.servicios || []), servicioInput.trim()] }));
      setServicioInput('');
    }
  };
  const handleRemoveServicio = idx => {
    setEmpresa(prev => ({ ...prev, servicios: prev.servicios.filter((_, i) => i !== idx) }));
  };
  const handleAddMarca = () => {
    if (marcaInput.trim()) {
      setEmpresa(prev => ({ ...prev, marcas: [...(prev.marcas || []), marcaInput.trim()] }));
      setMarcaInput('');
    }
  };
  const handleRemoveMarca = idx => {
    setEmpresa(prev => ({ ...prev, marcas: prev.marcas.filter((_, i) => i !== idx) }));
  };
  const handleAddGaleria = () => {
    if (galeriaInput.trim()) {
      setEmpresa(prev => ({ ...prev, galeria: [...(prev.galeria || []), galeriaInput.trim()] }));
      setGaleriaInput('');
    }
  };
  const handleRemoveGaleria = idx => {
    setEmpresa(prev => ({ ...prev, galeria: prev.galeria.filter((_, i) => i !== idx) }));
  };
  const handleLogoChange = e => {
    setEmpresa(prev => ({ ...prev, logo: e.target.value }));
  };
  const handleHorarioChange = (dia, field, value) => {
    setHorariosEdit(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [field]: value
      }
    }));
  };
  const handleNotaAdminChange = e => setNotaAdmin(e.target.value);
  const handleSaveServiciosMarcas = async () => {
    setSaving(true);
    try {
      // Asegurar que las marcas se guarden como strings
      const marcasNormalizadas = empresa.marcas?.map(marca => 
        typeof marca === 'string' ? marca : marca.nombre || marca.id || marca
      ) || [];
      
      await updateDoc(doc(db, 'empresas', empresaId), {
        servicios: empresa.servicios || [],
        marcas: marcasNormalizadas
      });
      
      // Actualizar el estado local
      setEmpresa(prev => ({ 
        ...prev, 
        servicios: empresa.servicios || [],
        marcas: marcasNormalizadas
      }));
    } catch (err) { 
      console.error('Error al guardar servicios/marcas:', err);
      setError('Error al guardar servicios/marcas'); 
    }
    setSaving(false);
  };
  const handleSaveLogoGaleria = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'empresas', empresaId), {
        logo: empresa.logo || '',
        galeria: empresa.galeria || []
      });
    } catch (err) { setError('Error al guardar logo/galería'); }
    setSaving(false);
  };
  const handleSaveHorarios = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'empresas', empresaId), {
        horarios: horariosEdit
      });
      setEmpresa(prev => ({ ...prev, horarios: horariosEdit }));
    } catch (err) { setError('Error al guardar horarios'); }
    setSaving(false);
  };
  const handleSaveNotaAdmin = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'empresas', empresaId), {
        notas_admin: notaAdmin
      });
      setEmpresa(prev => ({ ...prev, notas_admin: notaAdmin }));
    } catch (err) { setError('Error al guardar nota'); }
    setSaving(false);
  };
  // Tabs para agente (solo secciones relevantes)
  const tabs = [
    { id: 'general', label: 'Información General', icon: '📋' },
    { id: 'representante', label: 'Representante', icon: '👤' },
    { id: 'servicios', label: 'Servicios y Marcas', icon: '🛠️' },
    { id: 'logo', label: 'Logo y Galería', icon: '🖼️' },
    { id: 'horarios', label: 'Horarios', icon: '🕒' },
    { id: 'notas', label: 'Notas Administrativas', icon: '📝' },
    { id: 'validacion', label: 'Validación', icon: '✅' }
  ];
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const docRef = doc(db, 'empresas', empresaId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEmpresa({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Empresa no encontrada');
        }
      } catch (err) {
        setError('Error al cargar la empresa');
      } finally {
        setLoading(false);
      }
    };
    fetchEmpresa();
  }, [empresaId]);

  useEffect(() => {
    if (empresa) {
      setFormData({
        nombre: empresa.nombre || '',
        email: empresa.email || '',
        telefono: empresa.telefono || '',
        direccion: empresa.direccion || '',
        web: empresa.web || '',
        categoria: empresa.categoria || '',
        descripcion: empresa.descripcion || '',
        tipoEmpresa: empresa.tipoEmpresa || '',
        estado: empresa.estado || '',
        representante: empresa.representante || {
          nombre: '',
          apellidos: '',
          email: '',
          telefono: '',
          cargo: '',
          cedula: ''
        }
      });
    }
  }, [empresa]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('representante.')) {
      const repField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        representante: {
          ...prev.representante,
          [repField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'empresas', empresaId), {
        ...formData,
        representante: { ...formData.representante }
      });
      setEmpresa(prev => ({ ...prev, ...formData }));
    } catch (err) {
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleValidarEmpresa = async () => {
    setValidando(true);
    try {
      // Validar que se puede hacer la transición
      if (!puedeTransicionar(empresa?.estado, ESTADOS_EMPRESA.VALIDADA)) {
        pushNotificationService.showInAppNotification({
          title: '⚠️ Transición No Permitida',
          body: `No se puede cambiar de "${empresa?.estado}" a "${ESTADOS_EMPRESA.VALIDADA}"`,
          icon: '/logo192.png'
        });
        return;
      }

      await updateDoc(doc(db, 'empresas', empresaId), {
        estado: ESTADOS_EMPRESA.VALIDADA,
        fecha_validacion: serverTimestamp(),
        visitaAgente: true,
        validada: true,
        fecha_ultima_validacion: serverTimestamp()
      });
      
      setEmpresa(prev => ({ 
        ...prev, 
        estado: ESTADOS_EMPRESA.VALIDADA, 
        visitaAgente: true, 
        validada: true 
      }));

      pushNotificationService.showInAppNotification({
        title: '✅ Empresa Validada',
        body: `${empresa?.nombre} ha sido validada exitosamente`,
        icon: '/logo192.png'
      });
    } catch (err) {
      console.error('Error al validar empresa:', err);
      pushNotificationService.showInAppNotification({
        title: '❌ Error en Validación',
        body: 'No se pudo validar la empresa. Intenta nuevamente.',
        icon: '/logo192.png'
      });
    } finally {
      setValidando(false);
    }
  };

  // Validación de rol
  if (rol !== 'agente') {
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600">Solo agentes de campo pueden acceder a esta sección.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📋 Detalle de Empresa
              </h1>
              <p className="text-gray-600 mt-1">
                {empresa?.nombre || 'Cargando...'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {saving && (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span className="text-sm">Guardando...</span>
                </div>
              )}
              <button
                onClick={() => navigate('/agente/empresas-asignadas')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← Volver
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              
              <div className="p-6">
                {/* Contenido de tabs */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    {/* Información General */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Empresa</label>
                        <input
                          type="text"
                          name="nombre"
                          value={empresa?.nombre || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={empresa?.email || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                        <input
                          type="tel"
                          name="telefono"
                          value={empresa?.telefono || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                        <input
                          type="text"
                          name="direccion"
                          value={empresa?.direccion || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sitio Web</label>
                        <input
                          type="url"
                          name="web"
                          value={empresa?.web || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                        <input
                          type="text"
                          name="categoria"
                          value={empresa?.categoria || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                      <textarea
                        name="descripcion"
                        value={empresa?.descripcion || ''}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                      >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'representante' && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Representante</h3>
                    <form onSubmit={e => {e.preventDefault(); handleSave();}} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block mb-2 font-medium">Nombre:</label>
                        <input type="text" name="representante.nombre" value={formData.representante.nombre} onChange={handleChange} className="w-full border rounded px-2 py-1" />
                        <label className="block mb-2 font-medium">Apellidos:</label>
                        <input type="text" name="representante.apellidos" value={formData.representante.apellidos} onChange={handleChange} className="w-full border rounded px-2 py-1" />
                        <label className="block mb-2 font-medium">Email:</label>
                        <input type="email" name="representante.email" value={formData.representante.email} onChange={handleChange} className="w-full border rounded px-2 py-1" />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium">Teléfono:</label>
                        <input type="text" name="representante.telefono" value={formData.representante.telefono} onChange={handleChange} className="w-full border rounded px-2 py-1" />
                        <label className="block mb-2 font-medium">Cargo:</label>
                        <input type="text" name="representante.cargo" value={formData.representante.cargo} onChange={handleChange} className="w-full border rounded px-2 py-1" />
                        <label className="block mb-2 font-medium">Cédula:</label>
                        <input type="text" name="representante.cedula" value={formData.representante.cedula} onChange={handleChange} className="w-full border rounded px-2 py-1" />
                      </div>
                    </form>
                    <div className="mt-4">
                      <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2">
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'servicios' && (
                  <div className="space-y-6">
                    {/* Servicios */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Servicios</label>
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={servicioInput}
                          onChange={(e) => setServicioInput(e.target.value)}
                          placeholder="Agregar servicio..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleAddServicio}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Agregar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {empresa?.servicios?.map((servicio, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                            {servicio}
                            <button onClick={() => handleRemoveServicio(idx)} className="text-blue-600 hover:text-blue-800">×</button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Marcas */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Marcas</label>
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={marcaInput}
                          onChange={(e) => setMarcaInput(e.target.value)}
                          placeholder="Agregar marca..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleAddMarca}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Agregar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {empresa?.marcas?.map((marca, idx) => (
                          <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                            {typeof marca === 'string' ? marca : marca.nombre || marca.id || 'Marca sin nombre'}
                            <button onClick={() => handleRemoveMarca(idx)} className="text-green-600 hover:text-green-800">×</button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveServiciosMarcas}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                      >
                        {saving ? 'Guardando...' : 'Guardar Servicios y Marcas'}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'logo' && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Logo y Galería</h3>
                    <div className="mb-4">
                      <label className="block font-medium mb-2">Logo (URL):</label>
                      <input type="text" value={empresa?.logo || ''} onChange={handleLogoChange} placeholder="URL del logo" className="border rounded px-2 py-1 w-full mb-2" />
                                  {empresa?.logo_url || empresa?.logo ? (
              <div className="relative">
                {logoLoading ? (
                  <div className="h-20 mb-2 flex items-center justify-center bg-gray-100 rounded">
                    <span className="text-gray-500">Cargando logo...</span>
                  </div>
                ) : logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-20 mb-2 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : (
                  <div className="h-20 mb-2 flex items-center justify-center bg-gray-100 rounded">
                    <span className="text-gray-500">Error al cargar logo</span>
                  </div>
                )}
                {logoError && (
                  <span className="text-red-500 text-sm">Error: {logoError}</span>
                )}
              </div>
            ) : (
              <span className="text-gray-500">Sin logo</span>
            )}
                    </div>
                    <div className="mb-4">
                      <label className="block font-medium mb-2">Galería (URLs):</label>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {empresa.galeria?.map((img, idx) => {
                          const { imageUrl: galleryImgUrl, loading: galleryImgLoading } = useImageUrl(img);
                          return (
                            <span key={idx} className="relative">
                              {galleryImgLoading ? (
                                <div className="h-16 w-16 bg-gray-100 rounded border flex items-center justify-center">
                                  <span className="text-xs text-gray-500">...</span>
                                </div>
                              ) : galleryImgUrl ? (
                                <img src={galleryImgUrl} alt={`img-${idx}`} className="h-16 rounded border" />
                              ) : (
                                <div className="h-16 w-16 bg-gray-100 rounded border flex items-center justify-center">
                                  <span className="text-xs text-red-500">Error</span>
                                </div>
                              )}
                              <button type="button" onClick={() => handleRemoveGaleria(idx)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-1 text-xs">✕</button>
                            </span>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" value={galeriaInput} onChange={e => setGaleriaInput(e.target.value)} placeholder="Agregar URL de imagen" className="border rounded px-2 py-1" />
                        <button type="button" onClick={handleAddGaleria} className="bg-indigo-600 text-white px-3 py-1 rounded">Agregar</button>
                      </div>
                    </div>
                    <button type="button" onClick={handleSaveLogoGaleria} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                )}
                {activeTab === 'horarios' && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Horarios</h3>
                    {Object.keys(horariosEdit).length ? (
                      <form onSubmit={e => {e.preventDefault(); handleSaveHorarios();}}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(horariosEdit).map(([dia, horario], i) => (
                            <div key={i} className="border rounded p-3 mb-2">
                              <div className="font-medium mb-2">{dia}</div>
                              <label className="flex items-center gap-2 mb-2">
                                <input type="checkbox" checked={horario.abierto} onChange={e => handleHorarioChange(dia, 'abierto', e.target.checked)} /> Abierto
                              </label>
                              {horario.abierto && (
                                <div className="flex gap-2">
                                  <input type="time" value={horario.inicio} onChange={e => handleHorarioChange(dia, 'inicio', e.target.value)} className="border rounded px-2 py-1" />
                                  <span>-</span>
                                  <input type="time" value={horario.fin} onChange={e => handleHorarioChange(dia, 'fin', e.target.value)} className="border rounded px-2 py-1" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <button type="submit" disabled={saving} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                      </form>
                    ) : <span className="text-gray-500">Sin horarios definidos</span>}
                  </div>
                )}
                {activeTab === 'notas' && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Notas Administrativas</h3>
                    <textarea value={notaAdmin} onChange={handleNotaAdminChange} className="w-full border rounded px-2 py-1 mb-2" rows={3} placeholder="Agregar nota administrativa" />
                    <button type="button" onClick={handleSaveNotaAdmin} disabled={saving} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                      {saving ? 'Guardando...' : 'Guardar nota'}
                    </button>
                  </div>
                )}
                {activeTab === 'validacion' && (
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">Validación de Empresa</h3>
                      <p className="text-yellow-700 mb-4">
                        Esta sección permite validar la información de la empresa y cambiar su estado.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Estado Actual</label>
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            empresa?.estado === ESTADOS_EMPRESA.ACTIVA 
                              ? 'bg-green-100 text-green-800' 
                              : empresa?.estado === ESTADOS_EMPRESA.PENDIENTE_VALIDACION
                              ? 'bg-yellow-100 text-yellow-800'
                              : empresa?.estado === ESTADOS_EMPRESA.VALIDADA
                              ? 'bg-blue-100 text-blue-800'
                              : empresa?.estado === ESTADOS_EMPRESA.CATALOGADA
                              ? 'bg-gray-100 text-gray-800'
                              : empresa?.estado === ESTADOS_EMPRESA.EN_VISITA
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {empresa?.estado === ESTADOS_EMPRESA.ACTIVA ? 'Activa' : 
                             empresa?.estado === ESTADOS_EMPRESA.PENDIENTE_VALIDACION ? 'Pendiente de Validación' : 
                             empresa?.estado === ESTADOS_EMPRESA.VALIDADA ? 'Validada' : 
                             empresa?.estado === ESTADOS_EMPRESA.CATALOGADA ? 'Catalogada' :
                             empresa?.estado === ESTADOS_EMPRESA.EN_VISITA ? 'En Visita' :
                             empresa?.estado === ESTADOS_EMPRESA.SUSPENDIDA ? 'Suspendida' :
                             empresa?.estado === ESTADOS_EMPRESA.INACTIVA ? 'Inactiva' :
                             empresa?.estado === ESTADOS_EMPRESA.RECHAZADA ? 'Rechazada' : 'Inactiva'}
                          </span>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Cambiar Estado</label>
                          <select
                            value={empresa?.estado || ESTADOS_EMPRESA.PENDIENTE_VALIDACION}
                            onChange={(e) => setEmpresa(prev => ({ ...prev, estado: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={ESTADOS_EMPRESA.CATALOGADA}>Catalogada</option>
                            <option value={ESTADOS_EMPRESA.PENDIENTE_VALIDACION}>Pendiente de Validación</option>
                            <option value={ESTADOS_EMPRESA.EN_VISITA}>En Visita</option>
                            <option value={ESTADOS_EMPRESA.VALIDADA}>Validada</option>
                            <option value={ESTADOS_EMPRESA.ACTIVA}>Activa</option>
                            <option value={ESTADOS_EMPRESA.SUSPENDIDA}>Suspendida</option>
                            <option value={ESTADOS_EMPRESA.INACTIVA}>Inactiva</option>
                            <option value={ESTADOS_EMPRESA.RECHAZADA}>Rechazada</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={handleValidarEmpresa}
                            disabled={validando}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                          >
                            {validando ? 'Validando...' : 'Validar Empresa'}
                          </button>
                          
                          <button
                            onClick={async () => {
                              try {
                                setValidando(true);
                                await updateDoc(doc(db, 'empresas', empresaId), {
                                  estado: ESTADOS_EMPRESA.VALIDADA,
                                  validada: true,
                                  fecha_validacion: serverTimestamp(),
                                  agente_validador: user.email,
                                  fecha_ultima_validacion: serverTimestamp()
                                });
                                
                                pushNotificationService.showInAppNotification({
                                  title: '✅ Empresa Validada',
                                  body: `La empresa ${empresa.nombre} ha sido marcada como validada`,
                                  icon: '/logo192.png'
                                });
                                
                                // Recargar datos de la empresa
                                const empresaDoc = await getDoc(doc(db, 'empresas', empresaId));
                                if (empresaDoc.exists()) {
                                  setEmpresa({ id: empresaDoc.id, ...empresaDoc.data() });
                                }
                              } catch (error) {
                                console.error('Error validando empresa:', error);
                                pushNotificationService.showInAppNotification({
                                  title: '❌ Error al Validar',
                                  body: 'No se pudo validar la empresa. Intenta nuevamente.',
                                  icon: '/logo192.png'
                                });
                              } finally {
                                setValidando(false);
                              }
                            }}
                            disabled={validando || empresa?.estado === 'validada'}
                            className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                              empresa?.estado === 'validada'
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            Marcar como Validada
                          </button>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p><strong>Pendiente:</strong> Empresa en proceso de validación</p>
                          <p><strong>Validada:</strong> Empresa verificada por agente</p>
                          <p><strong>Activa:</strong> Empresa disponible para usuarios</p>
                          <p><strong>Inactiva:</strong> Empresa temporalmente deshabilitada</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
