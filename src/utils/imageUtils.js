import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Convierte una URL de Firebase Storage (gs://) a una URL pública de descarga (https://)
 * @param {string} gsUrl - URL de Firebase Storage (gs://bucket/path)
 * @returns {Promise<string>} URL pública de descarga
 */
export const convertGsUrlToDownloadUrl = async (gsUrl) => {
  if (!gsUrl || typeof gsUrl !== 'string') {
    return null;
  }

  // Si ya es una URL https, devolverla tal como está
  if (gsUrl.startsWith('https://')) {
    return gsUrl;
  }

  // Si es una URL gs://, convertirla
  if (gsUrl.startsWith('gs://')) {
    try {
      // Extraer el path del bucket
      const path = gsUrl.replace('gs://', '');
      const storageRef = ref(storage, path);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (error) {
      console.error('Error convirtiendo URL de Firebase Storage:', error);
      return null;
    }
  }

  // Si no es ninguno de los formatos esperados, devolver null
  return null;
};

/**
 * Función helper para obtener la URL de imagen correcta
 * @param {string} imageUrl - URL de la imagen (puede ser gs:// o https://)
 * @returns {Promise<string|null>} URL pública de descarga o null si hay error
 */
export const getImageUrl = async (imageUrl) => {
  if (!imageUrl) return null;
  
  try {
    const downloadUrl = await convertGsUrlToDownloadUrl(imageUrl);
    return downloadUrl;
  } catch (error) {
    console.error('Error obteniendo URL de imagen:', error);
    return null;
  }
};

/**
 * Función para convertir múltiples URLs de imagen en paralelo
 * @param {Array<string>} imageUrls - Array de URLs de imagen
 * @returns {Promise<Array<string|null>>} Array de URLs convertidas
 */
export const convertMultipleImageUrls = async (imageUrls) => {
  if (!Array.isArray(imageUrls)) return [];
  
  try {
    const convertedUrls = await Promise.all(
      imageUrls.map(url => convertGsUrlToDownloadUrl(url))
    );
    return convertedUrls;
  } catch (error) {
    console.error('Error convirtiendo múltiples URLs:', error);
    return imageUrls.map(() => null);
  }
};
