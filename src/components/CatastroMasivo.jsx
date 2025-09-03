import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { parse } from 'papaparse';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

const CatastroMasivo = () => {
  const { user, rol } = useAuth();
  const [csvData, setCsvData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Estructura esperada del CSV
  const expectedColumns = [
    'nombre',
    'direccion', 
    'ciudad',
    'region',
    'telefono',
    'email',
    'web',
    'categoria',
    'descripcion',
    'coordenadas_lat',
    'coordenadas_lng'
  ];

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      parse(file, {
        header: true,
        complete: (results) => {
          console.log('CSV parsed:', results.data);
          setCsvData(results.data);
          validateCsvData(results.data);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
        }
      });
    }
  }, []);

  const validateCsvData = (data) => {
    const results = data.map((row, index) => {
      const errors = [];
      const warnings = [];

      // Validaciones obligatorias
      if (!row.nombre?.trim()) errors.push('Nombre es obligatorio');
      if (!row.direccion?.trim()) errors.push('Dirección es obligatoria');
      if (!row.telefono?.trim()) warnings.push('Teléfono recomendado');
      if (!row.web?.trim()) warnings.push('Sitio web recomendado');
      
      // Validar formato de email
      if (row.email && !/\S+@\S+\.\S+/.test(row.email)) {
        errors.push('Formato de email inválido');
      }

      // Validar formato de web
      if (row.web && !row.web.startsWith('http')) {
        warnings.push('URL debe empezar con http:// o https://');
      }

      return {
        index,
        data: row,
        isValid: errors.length === 0,
        errors,
        warnings
      };
    });

    setValidationResults(results);
  };

  const processBatchUpload = async () => {
    if (rol !== 'admin') {
      alert('Solo administradores pueden realizar carga masiva');
      return;
    }

    setProcessing(true);
    setUploadProgress(0);

    try {
      const validRows = validationResults.filter(result => result.isValid);
      const batchSize = 500; // Firestore limit
      
      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = writeBatch(db);
        const currentBatch = validRows.slice(i, i + batchSize);

        currentBatch.forEach((row) => {
          const docRef = doc(collection(db, 'empresas'));
          const empresaData = {
            ...row.data,
            // Campos del catastro AV10 de Julio
            zona: 'AV10_JULIO',
            calles: determinarCalles(row.data.direccion),
            estado: 'catalogada', // Estado inicial del catastro (nuevo sistema)
            origen: 'catastro_masivo',
            fechaCreacion: serverTimestamp(),
            fechaActualizacion: serverTimestamp(),
            
            // Campos de validación
            webValidada: false,
            logoAsignado: false,
            visitaAgente: false,
            
            // Agente asignado (se asignará posteriormente)
            agenteAsignado: null,
            fechaVisita: null,
            
            // Metadatos del catastro
            creadoPor: user.uid,
            loteImportacion: `catastro_${new Date().getTime()}`,
            
            // Coordenadas si están disponibles
            ubicacion: row.data.coordenadas_lat && row.data.coordenadas_lng ? {
              lat: parseFloat(row.data.coordenadas_lat),
              lng: parseFloat(row.data.coordenadas_lng)
            } : null
          };

          batch.set(docRef, empresaData);
        });

        await batch.commit();
        setUploadProgress(((i + currentBatch.length) / validRows.length) * 100);
      }

      alert(`✅ Catastro completado: ${validRows.length} empresas cargadas`);
      
      // Limpiar datos
      setCsvData([]);
      setValidationResults([]);
      
    } catch (error) {
      console.error('Error en carga masiva:', error);
      alert('Error durante la carga masiva');
    } finally {
      setProcessing(false);
      setUploadProgress(0);
    }
  };

  const determinarCalles = (direccion) => {
    const callesAV10 = [
      'Avenida Matta',
      'Santa Isabel', 
      'Vicuña Mackenna',
      'Autopista Central',
      'Av. Matta'
    ];
    
    return callesAV10.filter(calle => 
      direccion.toLowerCase().includes(calle.toLowerCase())
    );
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false
  });

  if (rol !== 'admin') {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Solo administradores pueden acceder al catastro masivo</p>
        <p className="text-gray-500 mt-2">Tu rol actual: {rol || 'Sin rol'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">
            📊 Catastro Masivo - Zona AV10 de Julio
          </h1>
          <p className="text-gray-600 mt-2">
            Cargar empresas desde CSV - Área: Av. Matta, Santa Isabel, Vicuña Mackenna, Autopista Central
          </p>
        </div>

        {/* Área de carga de CSV */}
        <div className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-4xl mb-4">📄</div>
            {isDragActive ? (
              <p className="text-blue-600">Suelta el archivo CSV aquí...</p>
            ) : (
              <div>
                <p className="text-gray-700 font-medium">
                  Arrastra un archivo CSV o haz clic para seleccionar
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Columnas esperadas: {expectedColumns.join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Plantilla de descarga */}
          <div className="mt-4 text-center">
            <button className="text-blue-600 hover:text-blue-800 underline text-sm">
              📥 Descargar plantilla CSV
            </button>
          </div>
        </div>

        {/* Resultados de validación */}
        {validationResults.length > 0 && (
          <div className="p-6 border-t">
            <h3 className="text-lg font-semibold mb-4">
              📋 Resultados de Validación
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {validationResults.filter(r => r.isValid).length}
                </div>
                <div className="text-sm text-green-800">Registros Válidos</div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {validationResults.filter(r => !r.isValid).length}
                </div>
                <div className="text-sm text-red-800">Con Errores</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {validationResults.filter(r => r.warnings.length > 0).length}
                </div>
                <div className="text-sm text-yellow-800">Con Advertencias</div>
              </div>
            </div>

            {/* Lista de errores */}
            {validationResults.some(r => !r.isValid) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-red-900 mb-2">❌ Registros con Errores:</h4>
                <div className="max-h-40 overflow-y-auto">
                  {validationResults
                    .filter(r => !r.isValid)
                    .slice(0, 10) // Mostrar solo los primeros 10
                    .map((result, idx) => (
                      <div key={idx} className="text-sm text-red-800 mb-1">
                        Fila {result.index + 2}: {result.errors.join(', ')}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setCsvData([]);
                  setValidationResults([]);
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                🗑️ Limpiar datos
              </button>
              
              <button
                onClick={processBatchUpload}
                disabled={processing || validationResults.filter(r => r.isValid).length === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Procesando...' : `✅ Cargar ${validationResults.filter(r => r.isValid).length} empresas`}
              </button>
            </div>

            {/* Barra de progreso */}
            {processing && (
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  {uploadProgress.toFixed(0)}% completado
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatastroMasivo;
