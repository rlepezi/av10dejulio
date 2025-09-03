# Solución para Error de Imágenes con URLs gs://

## Problema Identificado

El error `net::ERR_UNKNOWN_URL_SCHEME` ocurre cuando el navegador intenta cargar imágenes directamente desde URLs de Firebase Storage (`gs://`). Estas URLs son referencias internas de Firebase y no pueden ser utilizadas directamente en etiquetas `<img>` del navegador.

**Ejemplo del error:**
```
gs://huamachuco-c0d9f.firebasestorage.app/logos/empresas/auto-OgYbz5JETdJGpaCp1vAJ-1753305145319.png:1 
GET gs://huamachuco-c0d9f.firebasestorage.app/logos/empresas/auto-OgYbz5JETdJGpaCp1vAJ-1753305145319.png 
net::ERR_UNKNOWN_URL_SCHEME
```

## Causa Raíz

Cuando se crean empresas a través de "Crear Empresa Pública", el campo `logo` se almacena con la URL interna de Firebase Storage (`gs://`) en lugar de la URL pública de descarga (`https://`). Esto sucede porque:

1. **CrearEmpresaPublica.jsx** espera una URL como input, no un archivo
2. Los usuarios pueden estar pegando URLs `gs://` directamente
3. No hay conversión automática de `gs://` a `https://` en el frontend

## Solución Implementada

### 1. Utilidad de Conversión (`src/utils/imageUtils.js`)

```javascript
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

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
      const path = gsUrl.replace('gs://', '');
      const storageRef = ref(storage, path);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (error) {
      console.error('Error convirtiendo URL de Firebase Storage:', error);
      return null;
    }
  }

  return null;
};
```

### 2. Hook de React (`src/hooks/useImageUrl.js`)

```javascript
import { useState, useEffect } from 'react';
import { convertGsUrlToDownloadUrl } from '../utils/imageUtils';

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

      if (imageUrl.startsWith('https://')) {
        setConvertedUrl(imageUrl);
        setLoading(false);
        setError(null);
        return;
      }

      if (imageUrl.startsWith('gs://')) {
        setLoading(true);
        setError(null);
        
        try {
          const downloadUrl = await convertGsUrlToDownloadUrl(imageUrl);
          setConvertedUrl(downloadUrl);
          setError(null);
        } catch (err) {
          setError('Error al cargar la imagen');
          setConvertedUrl(null);
        } finally {
          setLoading(false);
        }
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
```

### 3. Componentes Actualizados

#### EmpresaDetalleAgente.jsx
- Importa y usa `useImageUrl` hook
- Maneja estados de carga y error para logos
- Aplica la misma lógica para imágenes de galería

#### DashboardAgente.jsx
- Componente `LogoDisplay` que usa `useImageUrl`
- Maneja logos en la tabla de empresas asignadas

#### GestionEmpresas.jsx
- Componente `LogoImage` para manejo de logos
- Actualiza tanto vista de tabla como vista de tarjetas

#### HomePage.jsx
- Componente `LogoImage` para logos en tarjetas de empresas
- Maneja estados de carga y fallback

### 4. Componente de Test (`src/components/TestImageConversion.jsx`)

Componente de prueba para verificar la conversión de URLs:
- Ruta: `/test-images`
- Permite probar URLs `gs://` y `https://`
- Muestra el estado de conversión y vista previa

## Beneficios de la Solución

1. **Transparencia**: Los usuarios no notan la diferencia entre URLs `gs://` y `https://`
2. **Robustez**: Maneja tanto URLs válidas como inválidas
3. **UX Mejorada**: Estados de carga y manejo de errores
4. **Mantenibilidad**: Lógica centralizada en hooks reutilizables
5. **Compatibilidad**: Funciona con URLs existentes y nuevas

## Uso en Componentes

### Básico
```javascript
import { useImageUrl } from '../hooks/useImageUrl';

function MyComponent({ empresa }) {
  const { imageUrl, loading, error } = useImageUrl(empresa.logo);
  
  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!imageUrl) return <div>Sin imagen</div>;
  
  return <img src={imageUrl} alt="Logo" />;
}
```

### Con Componente Reutilizable
```javascript
function LogoImage({ logo, nombre, className }) {
  const { imageUrl, loading, error } = useImageUrl(logo);
  
  // Lógica de renderizado con estados
  // ...
}
```

## Verificación

1. **Navegar a `/test-images`** para probar la conversión
2. **Verificar en consola** que no hay errores `ERR_UNKNOWN_URL_SCHEME`
3. **Comprobar que las imágenes se cargan** correctamente en:
   - Dashboard de agente
   - Detalle de empresa
   - Lista de empresas (admin)
   - Página principal

## Próximos Pasos Recomendados

1. **Auditoría de Base de Datos**: Identificar todas las URLs `gs://` almacenadas
2. **Migración Automática**: Script para convertir URLs existentes a `https://`
3. **Validación en Formularios**: Prevenir entrada de URLs `gs://` en campos de logo
4. **Monitoreo**: Logs para detectar nuevas URLs problemáticas

## Archivos Modificados

- ✅ `src/utils/imageUtils.js` (nuevo)
- ✅ `src/hooks/useImageUrl.js` (nuevo)
- ✅ `src/components/EmpresaDetalleAgente.jsx`
- ✅ `src/components/DashboardAgente.jsx`
- ✅ `src/components/GestionEmpresas.jsx`
- ✅ `src/pages/HomePage.jsx`
- ✅ `src/components/TestImageConversion.jsx` (nuevo)
- ✅ `src/App.jsx` (ruta de test)

## Conclusión

La solución implementada resuelve completamente el error `net::ERR_UNKNOWN_URL_SCHEME` al proporcionar un sistema robusto de conversión de URLs de Firebase Storage. Los usuarios ahora pueden ver las imágenes correctamente sin importar si están almacenadas como URLs `gs://` o `https://`.
