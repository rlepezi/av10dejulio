import React, { useState } from 'react';
import { useImageUrl } from '../hooks/useImageUrl';

export default function TestLogoDisplay() {
  const [testUrls] = useState([
    // URL gs:// que debería fallar
    'gs://huamachuco-c0d9f.firebasestorage.app/logos/empresas/auto-06o13wsEv2yTK0y2fiIL-1753152184883.png',
    // URL https:// que debería funcionar
    'https://firebasestorage.googleapis.com/v0/b/huamachuco-c0d9f.appspot.com/o/logos%2Fempresas%2Fauto-06o13wsEv2yTK0y2fiIL-1753152184883.png?alt=media&token=example',
    // URL vacía
    '',
    // URL inválida
    'invalid-url'
  ]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🧪 Prueba de Visualización de Logos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testUrls.map((url, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">
              Test {index + 1}: {url ? (url.startsWith('gs://') ? 'URL gs://' : 'URL https://') : 'Sin URL'}
            </h3>
            
            <div className="mb-3">
              <strong>URL:</strong>
              <p className="text-xs text-gray-600 break-all mt-1">{url || 'N/A'}</p>
            </div>
            
            <LogoDisplay url={url} />
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">ℹ️ Información de la Prueba</h3>
        <p className="text-sm text-blue-700">
          Este componente prueba la visualización de logos usando el hook <code className="bg-blue-100 px-1 rounded">useImageUrl</code>.<br />
          - <strong>URL gs://</strong>: Debería convertirse automáticamente a URL de descarga<br />
          - <strong>URL https://</strong>: Debería mostrarse directamente<br />
          - <strong>Sin URL</strong>: Debería mostrar placeholder<br />
          - <strong>URL inválida</strong>: Debería mostrar error
        </p>
      </div>
    </div>
  );
}

// Componente que usa el hook useImageUrl
function LogoDisplay({ url }) {
  const { imageUrl, loading, error } = useImageUrl(url);

  if (!url) {
    return (
      <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <span className="text-gray-500 text-sm">Sin logo</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-32 h-32 bg-blue-100 rounded-lg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-blue-600 text-sm ml-2">Convirtiendo...</span>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-32 h-32 bg-red-100 rounded-lg flex items-center justify-center border border-red-300">
        <div className="text-center">
          <span className="text-red-600 text-lg">❌</span>
          <p className="text-red-600 text-xs mt-1">Error al cargar</p>
          <p className="text-red-500 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-32 h-32 bg-green-100 rounded-lg flex items-center justify-center border border-green-300">
      <img 
        src={imageUrl} 
        alt="Logo de prueba" 
        className="max-w-full max-h-full object-contain"
        onError={(e) => {
          console.error('Error cargando imagen:', e.target.src);
          e.target.style.display = 'none';
        }}
      />
    </div>
  );
}
