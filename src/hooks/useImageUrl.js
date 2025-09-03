import { useState, useEffect } from 'react';
import { convertGsUrlToDownloadUrl } from '../utils/imageUtils';

/**
 * Hook personalizado para manejar URLs de imagen de Firebase Storage
 * @param {string} imageUrl - URL de la imagen (puede ser gs:// o https://)
 * @returns {Object} { imageUrl: string|null, loading: boolean, error: string|null }
 */
export const useImageUrl = (imageUrl) => {
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const convertUrl = async () => {
      if (!imageUrl) {
        setConvertedUrl(null);
        setLoading(false);
        setError(null);
        return;
      }

      // Si ya es una URL https, no necesitamos convertir
      if (imageUrl.startsWith('https://')) {
        setConvertedUrl(imageUrl);
        setLoading(false);
        setError(null);
        return;
      }

      // Si es una URL gs://, convertirla
      if (imageUrl.startsWith('gs://')) {
        setLoading(true);
        setError(null);
        
        try {
          const downloadUrl = await convertGsUrlToDownloadUrl(imageUrl);
          setConvertedUrl(downloadUrl);
          setError(null);
        } catch (err) {
          console.error('Error convirtiendo URL de imagen:', err);
          setError('Error al cargar la imagen');
          setConvertedUrl(null);
        } finally {
          setLoading(false);
        }
      } else {
        // URL no reconocida
        setConvertedUrl(null);
        setLoading(false);
        setError('Formato de URL no válido');
      }
    };

    convertUrl();
  }, [imageUrl]);

  return {
    imageUrl: convertedUrl,
    loading,
    error
  };
};

/**
 * Hook para manejar múltiples URLs de imagen
 * @param {Array<string>} imageUrls - Array de URLs de imagen
 * @returns {Object} { imageUrls: Array<string|null>, loading: boolean, error: string|null }
 */
export const useMultipleImageUrls = (imageUrls) => {
  const [convertedUrls, setConvertedUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const convertUrls = async () => {
      if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        setConvertedUrls([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const converted = await Promise.all(
          imageUrls.map(async (url) => {
            if (!url) return null;
            if (url.startsWith('https://')) return url;
            if (url.startsWith('gs://')) {
              try {
                return await convertGsUrlToDownloadUrl(url);
              } catch (err) {
                console.error('Error convirtiendo URL:', url, err);
                return null;
              }
            }
            return null;
          })
        );

        setConvertedUrls(converted);
        setError(null);
      } catch (err) {
        console.error('Error convirtiendo múltiples URLs:', err);
        setError('Error al cargar algunas imágenes');
      } finally {
        setLoading(false);
      }
    };

    convertUrls();
  }, [imageUrls]);

  return {
    imageUrls: convertedUrls,
    loading,
    error
  };
};
