import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';

export default function DebugAgentes() {
  const navigate = useNavigate();
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
  const [creandoAgente, setCreandoAgente] = useState(false);

  useEffect(() => {
    cargarAgentes();
  }, []);

  const cargarAgentes = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'agentes'));
      const agentesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAgentes(agentesData);
    } catch (error) {
      console.error('Error cargando agentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const crearAgentePrueba = async () => {
    try {
      setCreandoAgente(true);
      
      const emailPrueba = 'agente.prueba@test.com';
      const passwordPrueba = 'test123456';
      
      // Verificar si ya existe
      const q = query(
        collection(db, 'agentes'),
        where('email', '==', emailPrueba)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        alert('Ya existe un agente de prueba con este email');
        return;
      }
      
      const agenteData = {
        nombre: 'Agente de Prueba',
        email: emailPrueba,
        telefono: '+56912345678',
        zona_asignada: 'Zona de Prueba',
        rol: 'agente',
        activo: true,
        fecha_creacion: new Date(),
        admin_creador: 'debug@system.com',
        password_temporal: passwordPrueba,
        requiere_registro: true,
        permisos: {
          crear_solicitudes: true,
          activar_empresas: true,
          gestionar_perfil: true
        }
      };

      await addDoc(collection(db, 'agentes'), agenteData);
      
      alert(`✅ Agente de prueba creado!\n\n📧 Email: ${emailPrueba}\n🔑 Contraseña: ${passwordPrueba}\n\n🔗 Ahora puedes:\n1. Ir a /registro-agente\n2. Usar estas credenciales\n3. Completar el registro\n4. Después hacer login normal`);
      
      await cargarAgentes(); // Recargar la lista
      
    } catch (error) {
      console.error('Error creando agente de prueba:', error);
      alert('Error creando agente de prueba: ' + error.message);
    } finally {
      setCreandoAgente(false);
    }
  };

  const verificarAgente = async () => {
    if (!email) return;
    
    try {
      const q = query(
        collection(db, 'agentes'),
        where('email', '==', email),
        where('requiere_registro', '==', true)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const agente = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setResultadoBusqueda({ encontrado: true, agente });
      } else {
        setResultadoBusqueda({ encontrado: false, agente: null });
      }
    } catch (error) {
      console.error('Error verificando agente:', error);
      setResultadoBusqueda({ error: error.message });
    }
  };

  if (loading) {
    return <div className="p-4">Cargando agentes...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug: Estado de Agentes</h1>
      
      {/* Navegación rápida */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Navegación Rápida</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate('/registro-agente')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            📝 Ir a Registro de Agente
          </button>
          <button
            onClick={() => navigate('/login')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            🔐 Ir a Login
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            👑 Ir a Admin
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            🏠 Ir a Inicio
          </button>
          <button
            onClick={() => navigate('/debug-sesion-agente')}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
          >
            🔍 Debug Sesión Agente
          </button>
        </div>
      </div>
      
      {/* Flujo de Testing Automático */}
      <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">🧪 Testing del Error 400</h2>
        <p className="text-sm text-gray-600 mb-3">
          Sigue estos pasos para probar y solucionar el error 400:
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">PASO 1</span>
            <span>Crear agente de prueba ↓</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">PASO 2</span>
            <span>Copiar credenciales (botón 📋)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">PASO 3</span>
            <span>Ir a Login e intentar acceso (debería fallar)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">PASO 4</span>
            <span>Ir a Registro de Agente (botón 🚀)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">PASO 5</span>
            <span>Completar registro con credenciales copiadas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">PASO 6</span>
            <span>Probar login normal (debería funcionar)</span>
          </div>
        </div>
      </div>
      
      {/* Crear Agente de Prueba */}
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Crear Agente de Prueba</h2>
        <p className="text-sm text-gray-600 mb-3">
          Si no tienes agentes en el sistema, puedes crear uno de prueba para testing.
        </p>
        <div className="flex gap-2">
          <button
            onClick={crearAgentePrueba}
            disabled={creandoAgente}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {creandoAgente ? 'Creando...' : '🔧 Crear Agente de Prueba'}
          </button>
          <button
            onClick={() => {
              const instrucciones = `🧪 TESTING ERROR 400 - AGENTES

📧 Credenciales de prueba:
Email: agente.prueba@test.com
Contraseña: test123456

📋 Pasos para probar:
1. Crea agente de prueba (botón verde)
2. Ve a /login e intenta acceder (ERROR 400 esperado)
3. Ve a /registro-agente 
4. Usa las credenciales de arriba
5. Completa el registro
6. Ahora ya puedes hacer login normal

🌐 URLs importantes:
- Debug: http://localhost:5182/debug-agentes
- Login: http://localhost:5182/login  
- Registro: http://localhost:5182/registro-agente
- Admin: http://localhost:5182/admin`;
              
              navigator.clipboard.writeText(instrucciones);
              alert('📋 Instrucciones completas copiadas al portapapeles');
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            📋 Copiar Instrucciones
          </button>
        </div>
      </div>
      
      {/* Verificador de email específico */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Verificar Email Específico</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email del agente"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={verificarAgente}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Verificar
          </button>
        </div>
        
        {resultadoBusqueda && (
          <div className="mt-3 p-3 bg-white border rounded">
            {resultadoBusqueda.error ? (
              <p className="text-red-600">Error: {resultadoBusqueda.error}</p>
            ) : resultadoBusqueda.encontrado ? (
              <div className="text-green-600">
                <p><strong>✅ Agente encontrado que requiere registro:</strong></p>
                <pre className="text-sm mt-2 bg-gray-100 p-2 rounded">
                  {JSON.stringify(resultadoBusqueda.agente, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-red-600">❌ No se encontró agente con ese email que requiera registro</p>
            )}
          </div>
        )}
      </div>

      {/* Lista de todos los agentes */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Todos los Agentes ({agentes.length})</h2>
        
        {agentes.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">No hay agentes en la base de datos</p>
            <p className="text-sm text-blue-600">💡 Crea un agente de prueba usando el botón de arriba</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agentes.map((agente) => (
              <div key={agente.id} className="border p-3 rounded bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><strong>Nombre:</strong> {agente.nombre}</p>
                    <p><strong>Email:</strong> {agente.email}</p>
                    <p><strong>Activo:</strong> {agente.activo ? '✅ Sí' : '❌ No'}</p>
                  </div>
                  <div>
                    <p><strong>Requiere Registro:</strong> {agente.requiere_registro ? '🔶 Sí' : '✅ No'}</p>
                    <p><strong>Zona:</strong> {agente.zona_asignada}</p>
                    <p><strong>Fecha Creación:</strong> {agente.fecha_creacion?.toDate?.()?.toLocaleDateString() || 'N/A'}</p>
                  </div>
                </div>
                
                {agente.password_temporal && (
                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm">
                    <p><strong>Contraseña Temporal:</strong> {agente.password_temporal}</p>
                  </div>
                )}

                {/* Botones de acción para pruebas */}
                {agente.requiere_registro && agente.password_temporal && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => navigate('/registro-agente')}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      🚀 Ir a Registro
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`Email: ${agente.email}\nContraseña: ${agente.password_temporal}`);
                        alert('Credenciales copiadas al portapapeles');
                      }}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                    >
                      📋 Copiar Credenciales
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      🔐 Ir a Login
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
