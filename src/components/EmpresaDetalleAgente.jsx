import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function EmpresaDetalleAgente() {
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

  useEffect(() => {
    if (empresa) {
      setHorariosEdit(empresa.horarios || {});
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
      await updateDoc(doc(db, 'empresas', empresaId), {
        servicios: empresa.servicios || [],
        marcas: empresa.marcas || []
      });
    } catch (err) { setError('Error al guardar servicios/marcas'); }
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
    { id: 'notas', label: 'Notas Administrativas', icon: '📝' }
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
      await updateDoc(doc(db, 'empresas', empresaId), {
        estado: 'validada',
        fecha_validacion: new Date()
      });
      setEmpresa(prev => ({ ...prev, estado: 'validada' }));
    } catch (err) {
      setError('Error al validar la empresa');
    } finally {
      setValidando(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Cargando empresa...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }
  if (!empresa) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Empresa: {empresa.nombre}</h1>
            <p className="text-gray-600 mt-1">Detalle y validación de empresa asignada</p>
            <div className="mt-4 flex flex-col gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                empresa.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                empresa.estado === 'activa' ? 'bg-green-100 text-green-800' :
                empresa.estado === 'pendiente_validación' ? 'bg-blue-100 text-blue-800' :
                empresa.estado === 'validada' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
              }`}>
                Estado: {empresa.estado || 'Sin estado'}
              </span>
              {empresa.estado === 'pendiente_validación' && (
                <button onClick={handleValidarEmpresa} disabled={validando} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mt-2">
                  {validando ? 'Validando...' : 'Validar empresa'}
                </button>
              )}
              {empresa.estado === 'validada' && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800 mt-2">Empresa validada</span>
              )}
            </div>
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
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
      </div>
      {/* Contenido de tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeTab === 'general' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Información General</h3>
            <form onSubmit={e => {e.preventDefault(); handleSave();}} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium">Nombre:</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full border rounded px-2 py-1" />
                <label className="block mb-2 font-medium">Email:</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border rounded px-2 py-1" />
                <label className="block mb-2 font-medium">Teléfono:</label>
                <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full border rounded px-2 py-1" />
                <label className="block mb-2 font-medium">Dirección:</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="w-full border rounded px-2 py-1" />
                <label className="block mb-2 font-medium">Sitio web:</label>
                <input type="text" name="web" value={formData.web} onChange={handleChange} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block mb-2 font-medium">Categoría:</label>
                <input type="text" name="categoria" value={formData.categoria} onChange={handleChange} className="w-full border rounded px-2 py-1" />
                <label className="block mb-2 font-medium">Tipo de Empresa:</label>
                <input type="text" name="tipoEmpresa" value={formData.tipoEmpresa} onChange={handleChange} className="w-full border rounded px-2 py-1" />
                <label className="block mb-2 font-medium">Descripción:</label>
                <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} className="w-full border rounded px-2 py-1" />
              </div>
            </form>
            <div className="mt-4">
              <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2">
                {saving ? 'Guardando...' : 'Guardar cambios'}
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
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Servicios y Marcas</h3>
            <div className="mb-4">
              <label className="block font-medium mb-2">Servicios:</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {empresa.servicios?.map((serv, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
                    {serv}
                    <button type="button" onClick={() => handleRemoveServicio(idx)} className="ml-1 text-xs text-red-500">✕</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={servicioInput} onChange={e => setServicioInput(e.target.value)} placeholder="Agregar servicio" className="border rounded px-2 py-1" />
                <button type="button" onClick={handleAddServicio} className="bg-blue-600 text-white px-3 py-1 rounded">Agregar</button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-2">Marcas:</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {empresa.marcas?.map((marca, idx) => (
                  <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                    {marca}
                    <button type="button" onClick={() => handleRemoveMarca(idx)} className="ml-1 text-xs text-red-500">✕</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={marcaInput} onChange={e => setMarcaInput(e.target.value)} placeholder="Agregar marca" className="border rounded px-2 py-1" />
                <button type="button" onClick={handleAddMarca} className="bg-green-600 text-white px-3 py-1 rounded">Agregar</button>
              </div>
            </div>
            <button type="button" onClick={handleSaveServiciosMarcas} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
        {activeTab === 'logo' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Logo y Galería</h3>
            <div className="mb-4">
              <label className="block font-medium mb-2">Logo (URL):</label>
              <input type="text" value={empresa.logo || ''} onChange={handleLogoChange} placeholder="URL del logo" className="border rounded px-2 py-1 w-full mb-2" />
              {empresa.logo ? (
                <img src={empresa.logo} alt="Logo" className="h-20 mb-2" />
              ) : (
                <span className="text-gray-500">Sin logo</span>
              )}
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-2">Galería (URLs):</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {empresa.galeria?.map((img, idx) => (
                  <span key={idx} className="relative">
                    <img src={img} alt={`img-${idx}`} className="h-16 rounded border" />
                    <button type="button" onClick={() => handleRemoveGaleria(idx)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-1 text-xs">✕</button>
                  </span>
                ))}
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
      </div>
    </div>
  );
}
