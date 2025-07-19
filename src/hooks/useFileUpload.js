import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadFile = async (file, path, options = {}) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      // Validaciones
      if (!file) throw new Error('No se proporcionó archivo');
      
      // Validar tipo de archivo si se especifica
      if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de archivo no permitido. Permitidos: ${options.allowedTypes.join(', ')}`);
      }

      // Validar tamaño si se especifica (en bytes)
      if (options.maxSize && file.size > options.maxSize) {
        throw new Error(`Archivo muy grande. Máximo permitido: ${options.maxSize / 1024 / 1024}MB`);
      }

      // Crear nombre único si no se especifica
      const fileName = options.fileName || `${Date.now()}_${file.name}`;
      const fullPath = `${path}/${fileName}`;
      
      // Crear referencia
      const fileRef = ref(storage, fullPath);
      
      // Simular progreso (Firebase no provee progreso real para archivos pequeños)
      setUploadProgress(25);
      
      // Subir archivo
      const snapshot = await uploadBytes(fileRef, file);
      setUploadProgress(75);
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref);
      setUploadProgress(100);
      
      // Resultado
      const result = {
        downloadURL,
        path: fullPath,
        fileName,
        size: file.size,
        type: file.type
      };

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const deleteFile = async (path) => {
    try {
      setError(null);
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const uploadImage = async (file, folder, options = {}) => {
    const imageOptions = {
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      maxSize: 5 * 1024 * 1024, // 5MB
      ...options
    };
    
    return uploadFile(file, folder, imageOptions);
  };

  return {
    uploading,
    uploadProgress,
    error,
    uploadFile,
    uploadImage,
    deleteFile
  };
};
