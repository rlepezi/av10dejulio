import React, { useState } from 'react';
import { useImageUrl } from '../hooks/useImageUrl';

export default function TestImageConversion() {
  const [testUrl, setTestUrl] = useState('');
  const [testResults, setTestResults] = useState([]);

  const testUrls = [
    'gs://huamachuco-c0d9f.firebasestorage.app/logos/empresas/auto-OgYbz5JETdGDpaCp1vAJ-1753305145319.png',
    'https://example.com/test-image.jpg',
    'gs://invalid-bucket/path/to/image.png',
    ''
  ];

  const runTests = () => {
    const results = testUrls.map(url => ({
      original: url,
      testUrl: url
    }));
    setTestResults(results);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🧪 Test de Conversión de URLs de Imagen</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">URLs de Prueba</h2>
        <div className="space-y-2">
          {testUrls.map((url, index) => (
            <div key={index} className="p-3 bg-gray-100 rounded">
              <strong>Test {index + 1}:</strong> {url || '(URL vacía)'}
              <TestImageDisplay url={url} />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Probar URL Personalizada</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="Ingresa una URL gs:// o https://"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={() => setTestUrl('')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Limpiar
          </button>
        </div>
        {testUrl && <TestImageDisplay url={testUrl} />}
      </div>

      <button
        onClick={runTests}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Ejecutar Todos los Tests
      </button>

      {testResults.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Resultados de los Tests</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="p-3 bg-gray-100 rounded">
                <strong>Test {index + 1}:</strong> {result.original || '(URL vacía)'}
                <TestImageDisplay url={result.testUrl} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TestImageDisplay({ url }) {
  const { imageUrl, loading, error } = useImageUrl(url);

  return (
    <div className="mt-2 p-2 bg-white rounded border">
      <div className="text-sm text-gray-600 mb-2">
        <strong>Estado:</strong> {loading ? '🔄 Cargando...' : error ? '❌ Error' : imageUrl ? '✅ Convertido' : '⚠️ Sin URL'}
      </div>
      
      {error && (
        <div className="text-red-600 text-sm mb-2">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {imageUrl && (
        <div className="text-green-600 text-sm mb-2">
          <strong>URL Convertida:</strong> {imageUrl}
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <strong>URL Original:</strong>
          <div className="text-xs text-gray-500 break-all">{url || 'N/A'}</div>
        </div>
        
        <div className="text-sm">
          <strong>URL Final:</strong>
          <div className="text-xs text-gray-500 break-all">{imageUrl || 'N/A'}</div>
        </div>
      </div>
      
      {imageUrl && (
        <div className="mt-2">
          <strong>Vista Previa:</strong>
          <div className="mt-1">
            <img 
              src={imageUrl} 
              alt="Test" 
              className="max-w-32 max-h-32 object-contain border rounded"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="hidden max-w-32 max-h-32 bg-red-100 border border-red-300 rounded flex items-center justify-center text-red-600 text-xs">
              Error al cargar imagen
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
