import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db, messaging } from '../firebase';

const FirebaseTest = () => {
  const [testResults, setTestResults] = useState({
    connection: 'testing...',
    empresas: 'testing...',
    solicitudes_empresa: 'testing...',
    solicitudes_cliente: 'testing...',
    messaging: 'testing...',
    serviceWorker: 'testing...',
    errors: []
  });

  useEffect(() => {
    const testFirebaseConnection = async () => {
      const results = {
        connection: '',
        empresas: '',
        solicitudes_empresa: '',
        solicitudes_cliente: '',
        messaging: '',
        serviceWorker: '',
        errors: []
      };

      try {
        console.log('🔥 Iniciando test de conexión Firebase...');
        console.log('📋 Configuración actual:', {
          projectId: db.app.options.projectId,
          authDomain: db.app.options.authDomain
        });

        // Test básico de conexión
        results.connection = '✅ Conectado';

        // Test Service Worker
        try {
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            const firebaseWorker = registrations.find(reg => 
              reg.active && reg.active.scriptURL.includes('firebase-messaging-sw.js')
            );
            
            if (firebaseWorker) {
              results.serviceWorker = '✅ Firebase Service Worker activo';
            } else {
              results.serviceWorker = '⚠️ Firebase Service Worker no encontrado';
            }
          } else {
            results.serviceWorker = '❌ Service Workers no soportados';
          }
        } catch (error) {
          results.serviceWorker = `❌ Error SW: ${error.message}`;
          results.errors.push(`Service Worker: ${error.message}`);
        }

        // Test Firebase Messaging
        try {
          if (messaging) {
            results.messaging = '✅ Firebase Messaging inicializado';
          } else {
            results.messaging = '⚠️ Firebase Messaging no disponible';
          }
        } catch (error) {
          results.messaging = `❌ Error Messaging: ${error.message}`;
          results.errors.push(`Messaging: ${error.message}`);
        }

        // Test empresas
        try {
          const empresasQuery = query(collection(db, 'empresas'), limit(5));
          const empresasSnapshot = await getDocs(empresasQuery);
          results.empresas = `✅ ${empresasSnapshot.size} documentos encontrados`;
          console.log('🏢 Empresas:', empresasSnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
          })));
        } catch (error) {
          results.empresas = `❌ Error: ${error.message}`;
          results.errors.push(`Empresas: ${error.message}`);
          console.error('❌ Error empresas:', error);
        }

        // Test solicitudes_empresa
        try {
          const solicitudesQuery = query(collection(db, 'solicitudes_empresa'), limit(5));
          const solicitudesSnapshot = await getDocs(solicitudesQuery);
          results.solicitudes_empresa = `✅ ${solicitudesSnapshot.size} documentos encontrados`;
          console.log('📋 Solicitudes empresa:', solicitudesSnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
          })));
        } catch (error) {
          results.solicitudes_empresa = `❌ Error: ${error.message}`;
          results.errors.push(`Solicitudes empresa: ${error.message}`);
          console.error('❌ Error solicitudes empresa:', error);
        }

        // Test solicitudes_cliente
        try {
          const clientesQuery = query(collection(db, 'solicitudes_cliente'), limit(5));
          const clientesSnapshot = await getDocs(clientesQuery);
          results.solicitudes_cliente = `✅ ${clientesSnapshot.size} documentos encontrados`;
          console.log('👥 Solicitudes cliente:', clientesSnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
          })));
        } catch (error) {
          results.solicitudes_cliente = `❌ Error: ${error.message}`;
          results.errors.push(`Solicitudes cliente: ${error.message}`);
          console.error('❌ Error solicitudes cliente:', error);
        }

      } catch (error) {
        results.connection = `❌ Error de conexión: ${error.message}`;
        results.errors.push(`Conexión: ${error.message}`);
        console.error('❌ Error general:', error);
      }

      setTestResults(results);
    };

    testFirebaseConnection();
  }, []);

  const registerServiceWorker = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Firebase Service Worker registrado manualmente:', registration);
        
        // Actualizar estado
        setTestResults(prev => ({
          ...prev,
          serviceWorker: '✅ Firebase Service Worker registrado manualmente'
        }));
        
        return registration;
      }
    } catch (error) {
      console.error('Error registrando Firebase Service Worker manualmente:', error);
      setTestResults(prev => ({
        ...prev,
        serviceWorker: `❌ Error registrando SW: ${error.message}`,
        errors: [...prev.errors, `Service Worker manual: ${error.message}`]
      }));
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🔥 Test de Conexión Firebase</h2>
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">📊 Estado de las Colecciones</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-blue-600">Conexión Firebase</div>
              <div className={testResults.connection.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {testResults.connection}
              </div>
            </div>

            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-blue-600">Service Worker</div>
              <div className={testResults.serviceWorker.includes('✅') ? 'text-green-600' : testResults.serviceWorker.includes('⚠️') ? 'text-yellow-600' : 'text-red-600'}>
                {testResults.serviceWorker}
              </div>
            </div>

            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-blue-600">Firebase Messaging</div>
              <div className={testResults.messaging.includes('✅') ? 'text-green-600' : testResults.messaging.includes('⚠️') ? 'text-yellow-600' : 'text-red-600'}>
                {testResults.messaging}
              </div>
            </div>

            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-blue-600">Empresas</div>
              <div className={testResults.empresas.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {testResults.empresas}
              </div>
            </div>

            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-blue-600">Solicitudes Empresa</div>
              <div className={testResults.solicitudes_empresa.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {testResults.solicitudes_empresa}
              </div>
            </div>

            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-blue-600">Solicitudes Cliente</div>
              <div className={testResults.solicitudes_cliente.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {testResults.solicitudes_cliente}
              </div>
            </div>
          </div>
        </div>

        {testResults.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">❌ Errores Detectados:</h4>
            <ul className="list-disc list-inside space-y-1">
              {testResults.errors.map((error, index) => (
                <li key={index} className="text-red-700 text-sm">{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">🔧 Información de Debug:</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div><strong>Project ID:</strong> {db.app.options.projectId}</div>
            <div><strong>Auth Domain:</strong> {db.app.options.authDomain}</div>
            <div><strong>Database URL:</strong> {db.app.options.databaseURL || 'No configurada'}</div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">💡 Posibles Soluciones:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 mb-4">
            <li>Verificar que las reglas de Firestore permitan lectura pública o autenticada</li>
            <li>Confirmar que el proyecto Firebase esté activo y las colecciones existan</li>
            <li>Revisar la configuración de Firebase en firebase.js</li>
            <li>Verificar que no haya problemas de CORS o red</li>
            <li>Registrar manualmente el Service Worker para notificaciones</li>
          </ul>
          
          <button
            onClick={registerServiceWorker}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            🔧 Registrar Service Worker Manualmente
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirebaseTest;
