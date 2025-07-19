import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { useDropzone } from 'react-dropzone';
import { useFileUpload } from '../hooks/useFileUpload';

const AdminMarcas = () => {
  const { rol } = useAuth();
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingMarca, setEditingMarca] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const { uploadImage, deleteFile, uploading, uploadProgress, error } = useFileUpload();

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    sitioWeb: '',
    activa: true
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "marcas"), (snapshot) => {
      const marcasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMarcas(marcasData.sort((a, b) => a.nombre?.localeCompare(b.nombre) || 0));
    });

    return () => unsubscribe();
  }, []);

  // Subir logo a Firebase Storage
  const uploadLogo = async (file, marcaId) => {
    try {
      const result = await uploadImage(file, `logos/marcas`, {
        fileName: `${marcaId}_${Date.now()}.${file.name.split('.').pop()}`
      });
      
      // Actualizar documento en Firestore
      await updateDoc(doc(db, "marcas", marcaId), {
        logoUrl: result.downloadURL,
        logoPath: result.path,
        fechaActualizacion: serverTimestamp()
      });

      return result.downloadURL;
    } catch (error) {
      console.error('Error subiendo logo:', error);
      alert(`Error al subir logo: ${error.message}`);
      throw error;
    }
  };

  // Eliminar logo
  const deleteLogo = async (marca) => {
    try {
      if (marca.logoPath) {
        await deleteFile(marca.logoPath);
      }
      
      await updateDoc(doc(db, "marcas", marca.id), {
        logoUrl: null,
        logoPath: null,
        fechaActualizacion: serverTimestamp()
      });
    } catch (error) {
      console.error('Error eliminando logo:', error);
      alert(`Error al eliminar logo: ${error.message}`);
    }
  };

  // Crear nueva marca
  const createMarca = async () => {
    try {
      setLoading(true);
      await addDoc(collection(db, "marcas"), {
        ...formData,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      });
      
      setFormData({ nombre: '', descripcion: '', sitioWeb: '', activa: true });
      setShowNewForm(false);
    } catch (error) {
      console.error('Error creando marca:', error);
      alert('Error al crear la marca');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar marca
  const updateMarca = async () => {
    try {
      setLoading(true);
      await updateDoc(doc(db, "marcas", editingMarca.id), {
        ...formData,
        fechaActualizacion: serverTimestamp()
      });
      
      setEditingMarca(null);
      setFormData({ nombre: '', descripcion: '', sitioWeb: '', activa: true });
    } catch (error) {
      console.error('Error actualizando marca:', error);
      alert('Error al actualizar la marca');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar marca
  const deleteMarca = async (marca) => {
    if (!confirm(`¿Estás seguro de eliminar la marca "${marca.nombre}"?`)) return;
    
    try {
      // Eliminar logo si existe
      if (marca.logoPath) {
        await deleteLogo(marca);
      }
      
      // Eliminar documento
      await deleteDoc(doc(db, "marcas", marca.id));
    } catch (error) {
      console.error('Error eliminando marca:', error);
      alert('Error al eliminar la marca');
    }
  };

  // Componente de carga de logo
  const LogoUploader = ({ marca }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: {
        'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
      },
      maxFiles: 1,
      onDrop: async (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          try {
            await uploadLogo(acceptedFiles[0], marca.id);
          } catch (error) {
            // Error ya manejado en uploadLogo
          }
        }
      }
    });

    return (
      <div className="flex items-center space-x-3">
        {/* Logo actual */}
        <div className="flex-shrink-0">
          {marca.logoUrl ? (
            <div className="relative group">
              <img
                src={marca.logoUrl}
                alt={`Logo ${marca.nombre}`}
                className="w-16 h-16 object-contain rounded border bg-white shadow"
              />
              <button
                onClick={() => deleteLogo(marca)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-gray-400">
              🏷️
            </div>
          )}
        </div>

        {/* Área de carga */}
        <div className="flex-1">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600">Subiendo... {uploadProgress}%</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600">
                  {isDragActive ? 'Suelta el logo aquí' : 'Clic o arrastra logo'}
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, JPEG, GIF, WEBP (máx. 5MB)</p>
              </div>
            )}
          </div>
          {error && (
            <p className="text-red-500 text-xs mt-1">{error}</p>
          )}
        </div>
      </div>
    );
  };

  // Formulario de marca
  const MarcaForm = ({ isEdit = false }) => (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <h3 className="font-semibold mb-3">
        {isEdit ? 'Editar Marca' : 'Nueva Marca'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nombre de la marca"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sitio Web
          </label>
          <input
            type="url"
            value={formData.sitioWeb}
            onChange={(e) => setFormData(prev => ({ ...prev, sitioWeb: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://www.marca.com"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
            rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Descripción de la marca"
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="activa"
            checked={formData.activa}
            onChange={(e) => setFormData(prev => ({ ...prev, activa: e.target.checked }))}
            className="mr-2"
          />
          <label htmlFor="activa" className="text-sm text-gray-700">
            Marca activa
          </label>
        </div>
      </div>
      
      <div className="flex space-x-2 mt-4">
        <button
          onClick={isEdit ? updateMarca : createMarca}
          disabled={loading || !formData.nombre.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear')}
        </button>
        
        <button
          onClick={() => {
            setEditingMarca(null);
            setShowNewForm(false);
            setFormData({ nombre: '', descripcion: '', sitioWeb: '', activa: true });
          }}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
        >
          Cancelar
        </button>
      </div>
    </div>
  );

  if (rol !== 'admin') {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Solo administradores pueden gestionar marcas</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              🏷️ Administración de Marcas
            </h1>
            <button
              onClick={() => setShowNewForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
            >
              + Nueva Marca
            </button>
          </div>
        </div>

        {/* Formulario nuevo */}
        {showNewForm && (
          <div className="p-6 border-b">
            <MarcaForm />
          </div>
        )}

        {/* Lista de marcas */}
        <div className="p-6">
          <div className="space-y-4">
            {marcas.map((marca) => (
              <div key={marca.id} className="border border-gray-200 rounded-lg p-4">
                {editingMarca?.id === marca.id ? (
                  <MarcaForm isEdit={true} />
                ) : (
                  <div>
                    {/* Información de la marca */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {marca.nombre}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            marca.activa 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {marca.activa ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                        
                        {marca.descripcion && (
                          <p className="text-gray-600 text-sm mb-2">{marca.descripcion}</p>
                        )}
                        
                        {marca.sitioWeb && (
                          <a 
                            href={marca.sitioWeb} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            🌐 {marca.sitioWeb}
                          </a>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingMarca(marca);
                            setFormData({
                              nombre: marca.nombre || '',
                              descripcion: marca.descripcion || '',
                              sitioWeb: marca.sitioWeb || '',
                              activa: marca.activa !== false
                            });
                          }}
                          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm"
                        >
                          ✏️ Editar
                        </button>
                        
                        <button
                          onClick={() => deleteMarca(marca)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                    
                    {/* Gestión de logo */}
                    <LogoUploader marca={marca} />
                  </div>
                )}
              </div>
            ))}
            
            {marcas.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay marcas registradas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMarcas;
