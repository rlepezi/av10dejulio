import React, { useState } from 'react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function TestLogoUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Crear nombre único para el archivo
      const timestamp = Date.now();
      const fileName = `test-${Math.random().toString(36).substr(2, 9)}-${timestamp}`;
      const fileExtension = file.name.split('.').pop();
      const fullFileName = `${fileName}.${fileExtension}`;
      
      // Referencia en Firebase Storage
      const storageRef = ref(storage, `logos/empresas/${fullFileName}`);
      
      console.log('📁 Subiendo archivo:', file.name);
      console.log('📍 Ruta en Storage:', storageRef.fullPath);
      
      // Subir archivo
      const snapshot = await uploadBytes(storageRef, file);
      console.log('✅ Archivo subido exitosamente:', snapshot.metadata.fullPath);
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('🔗 URL de descarga:', downloadURL);
      
      // Obtener URL gs://
      const gsUrl = `gs://${storageRef.bucket}/${storageRef.fullPath}`;
      console.log('🏪 URL gs://:', gsUrl);
      
      setUploadedUrl(downloadURL);
      
      // Mostrar información completa
      alert(`Logo subido exitosamente!\n\n` +
            `📁 Archivo: ${file.name}\n` +
            `📍 Ruta Storage: ${storageRef.fullPath}\n` +
            `🏪 URL gs://: ${gsUrl}\n` +
            `🔗 URL Descarga: ${downloadURL}`);
      
    } catch (error) {
      console.error('❌ Error subiendo archivo:', error);
      setError(`Error al subir archivo: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🧪 Prueba de Subida de Logos</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Logo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Formatos: JPG, PNG, GIF. Máximo 5MB
          </p>
        </div>

        {file && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Archivo seleccionado:</h3>
            <p className="text-sm text-gray-600">
              📁 Nombre: {file.name}<br />
              📏 Tamaño: {(file.size / 1024 / 1024).toFixed(2)} MB<br />
              🎨 Tipo: {file.type}
            </p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? '⏳ Subiendo...' : '🚀 Subir Logo'}
        </button>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            ❌ {error}
          </div>
        )}

        {uploadedUrl && (
          <div className="p-4 bg-green-50 border border-green-400 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">✅ Logo subido exitosamente!</h3>
            <div className="space-y-2">
              <img 
                src={uploadedUrl} 
                alt="Logo subido" 
                className="h-32 w-32 object-contain border border-gray-300 rounded"
              />
              <p className="text-sm text-green-700">
                🔗 URL: <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="underline">{uploadedUrl}</a>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">ℹ️ Información de la Prueba</h3>
        <p className="text-sm text-blue-700">
          Este componente prueba la funcionalidad de subida de logos a Firebase Storage.<br />
          Los archivos se guardan en la ruta: <code className="bg-blue-100 px-1 rounded">logos/empresas/</code><br />
          Se generan URLs únicas y se obtienen tanto la referencia gs:// como la URL de descarga.
        </p>
      </div>
    </div>
  );
}
