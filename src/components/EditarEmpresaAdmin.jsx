import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import LogoUploader from './LogoUploader';
import HorarioManager from './HorarioManager';
import PerfilEmpresaWeb from './PerfilEmpresaWeb';

export default function EditarEmpresaAdmin() {
  const { empresaId } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmpresa();
  }, [empresaId]);

  const fetchEmpresa = async () => {
    try {
      const docRef = doc(db, 'empresas', empresaId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setEmpresa({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError('Empresa no encontrada');
      }
    } catch (error) {
      console.error('Error cargando empresa:', error);
      setError('Error al cargar la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmpresa = async (campo, valor) => {
    try {
      setSaving(true);
      await updateDoc(doc(db, 'empresas', empresaId), {
        [campo]: valor,
        fecha_actualizacion: new Date()
      });
      
      setEmpresa(prev => ({ ...prev, [campo]: valor }));
      
      // Mostrar mensaje de éxito temporal
      setTimeout(() => setSaving(false), 1000);
    } catch (error) {
      console.error('Error actualizando empresa:', error);
      setError('Error al actualizar la empresa');
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file, campo = 'logo', valor = null) => {
    try {
      setSaving(true);
      
      if (campo === 'galeria') {
        // Actualizar galería
        await updateDoc(doc(db, 'empresas', empresaId), {
          galeria: valor,
          fecha_actualizacion: new Date()
        });
        setEmpresa(prev => ({ ...prev, galeria: valor }));
        return;
      }
      
      if (file === null) {
        // Eliminar logo
        await updateDoc(doc(db, 'empresas', empresaId), {
          logo: null,
          logoAsignado: false,
          fecha_actualizacion: new Date()
        });
        setEmpresa(prev => ({ ...prev, logo: null, logoAsignado: false }));
        return null;
      }
      
      if (file.logoURL) {
        // Logo automático
        await updateDoc(doc(db, 'empresas', empresaId), {
          logo: file.logoURL,
          logoAsignado: true,
          logoAutomatico: file.esAutomatico || false,
          fecha_actualizacion: new Date()
        });
        setEmpresa(prev => ({ ...prev, logo: file.logoURL, logoAsignado: true }));
        return file.logoURL;
      }
      
      // Subir archivo normal
      const logoRef = ref(storage, `logos/empresas/${empresaId}-${Date.now()}`);
      await uploadBytes(logoRef, file);
      const logoURL = await getDownloadURL(logoRef);
      
      await updateDoc(doc(db, 'empresas', empresaId), {
        logo: logoURL,
        logoAsignado: true,
        fecha_actualizacion: new Date()
      });
      
      setEmpresa(prev => ({ ...prev, logo: logoURL, logoAsignado: true }));
      
      return logoURL;
    } catch (error) {
      console.error('Error subiendo logo:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando empresa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => navigate('/admin/empresas')}
            className="mt-2 text-red-600 underline"
          >
            Volver al listado
          </button>
        </div>
      </div>
    );
  }

  if (!empresa) return null;

  const tabs = [
    { id: 'general', label: 'Información General', icon: '📋' },
    { id: 'logo', label: 'Logo', icon: '🖼️' },
    { id: 'horarios', label: 'Horarios', icon: '🕒' },
    { id: 'perfil', label: 'Perfil Web', icon: '🌐' }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Editar Empresa: {empresa.nombre}
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona la información, logo, horarios y perfil web de la empresa
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
              onClick={() => navigate('/admin/empresas')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>
        
        {/* Estado de la empresa */}
        <div className="mt-4 flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            empresa.estado === 'Activa' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {empresa.estado || 'Sin estado'}
          </span>
          {empresa.web ? (
            <a 
              href={empresa.web.startsWith('http') ? empresa.web : `https://${empresa.web}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              🔗 Ver sitio web
            </a>
          ) : (
            <a 
              href={`/perfil-empresa/${empresaId}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-800 text-sm underline"
            >
              🌐 Ver Perfil Público
            </a>
          )}
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
          <InformacionGeneral 
            empresa={empresa} 
            onUpdate={handleUpdateEmpresa}
            saving={saving}
          />
        )}
        
        {activeTab === 'logo' && (
          <LogoUploader 
            empresa={empresa}
            onLogoUpload={handleLogoUpload}
            saving={saving}
          />
        )}
        
        {activeTab === 'horarios' && (
          <HorarioManager 
            empresa={empresa}
            onUpdate={handleUpdateEmpresa}
            saving={saving}
          />
        )}
        
        {activeTab === 'perfil' && (
          <PerfilEmpresaWeb 
            empresa={empresa}
            onUpdate={handleUpdateEmpresa}
          />
        )}
      </div>
    </div>
  );
}

// Componente para información general
function InformacionGeneral({ empresa, onUpdate, saving }) {
  const [formData, setFormData] = useState({
    nombre: empresa.nombre || '',
    email: empresa.email || '',
    telefono: empresa.telefono || '',
    direccion: empresa.direccion || '',
    web: empresa.web || '',
    categoria: empresa.categoria || '',
    descripcion: empresa.descripcion || '',
    estado: empresa.estado || 'Inactiva'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    Object.keys(formData).forEach(key => {
      if (formData[key] !== empresa[key]) {
        onUpdate(key, formData[key]);
      }
    });
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Información General</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la empresa *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sitio web
          </label>
          <input
            type="url"
            name="web"
            value={formData.web}
            onChange={handleChange}
            placeholder="https://ejemplo.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar categoría</option>
            <option value="Repuestos">Repuestos</option>
            <option value="Servicios">Servicios</option>
            <option value="Talleres">Talleres</option>
            <option value="Seguros">Seguros</option>
            <option value="Venta de Vehículos">Venta de Vehículos</option>
            <option value="Otros">Otros</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Activa">Activa</option>
            <option value="Inactiva">Inactiva</option>
            <option value="En Revisión">En Revisión</option>
            <option value="Suspendida">Suspendida</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dirección
        </label>
        <input
          type="text"
          name="direccion"
          value={formData.direccion}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción
        </label>
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Descripción de la empresa y sus servicios..."
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
