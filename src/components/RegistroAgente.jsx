import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function RegistroAgente() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmarPassword: ''
  });
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validarFormulario = () => {
    if (!formData.email || !formData.password || !formData.confirmarPassword) {
      setMensaje('Por favor, completa todos los campos');
      return false;
    }

    if (formData.password !== formData.confirmarPassword) {
      setMensaje('Las contraseñas no coinciden');
      return false;
    }

    if (formData.password.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    return true;
  };

  const buscarAgenteEnSistema = async (email) => {
    try {
      // Normalizar el email (trim y lowercase)
      const emailNormalizado = email.trim().toLowerCase();
      console.log('🔍 Buscando agente con email:', emailNormalizado);
      console.log('📧 Email original:', email);
      console.log('📧 Email normalizado:', emailNormalizado);
      
      // Buscar agente que requiere registro
      const qRegistro = query(
        collection(db, 'agentes'),
        where('email', '==', emailNormalizado),
        where('requiere_registro', '==', true)
      );
      const snapshotRegistro = await getDocs(qRegistro);
      
      console.log('📊 Agentes que requieren registro encontrados:', snapshotRegistro.size);
      
      if (!snapshotRegistro.empty) {
        const agenteData = { 
          tipo: 'requiere_registro',
          id: snapshotRegistro.docs[0].id, 
          ...snapshotRegistro.docs[0].data() 
        };
        console.log('✅ Agente encontrado (requiere registro):', agenteData);
        return agenteData;
      }

      // Buscar agente ya registrado
      const qRegistrado = query(
        collection(db, 'agentes'),
        where('email', '==', emailNormalizado),
        where('requiere_registro', '==', false)
      );
      const snapshotRegistrado = await getDocs(qRegistrado);
      
      console.log('📊 Agentes ya registrados encontrados:', snapshotRegistrado.size);
      
      if (!snapshotRegistrado.empty) {
        const agenteData = { 
          tipo: 'ya_registrado',
          id: snapshotRegistrado.docs[0].id, 
          ...snapshotRegistrado.docs[0].data() 
        };
        console.log('✅ Agente encontrado (ya registrado):', agenteData);
        return agenteData;
      }
      
      // Buscar cualquier agente con ese email (sin filtro de requiere_registro)
      const qTodos = query(
        collection(db, 'agentes'),
        where('email', '==', emailNormalizado)
      );
      const snapshotTodos = await getDocs(qTodos);
      
      console.log('📊 Total de agentes con este email (normalizado):', snapshotTodos.size);
      
      if (!snapshotTodos.empty) {
        snapshotTodos.docs.forEach((doc, index) => {
          console.log(`📋 Agente ${index + 1}:`, {
            id: doc.id,
            email: doc.data().email,
            requiere_registro: doc.data().requiere_registro,
            activo: doc.data().activo,
            nombre: doc.data().nombre
          });
        });
      }
      
      // Si no encuentra con email normalizado, buscar con email original
      if (email !== emailNormalizado) {
        console.log('🔄 Buscando con email original (sin normalizar)...');
        const qOriginal = query(
          collection(db, 'agentes'),
          where('email', '==', email)
        );
        const snapshotOriginal = await getDocs(qOriginal);
        
        console.log('📊 Agentes con email original:', snapshotOriginal.size);
        
        if (!snapshotOriginal.empty) {
          console.log('⚠️ ENCONTRADO CON EMAIL SIN NORMALIZAR - Posible problema de normalización');
          snapshotOriginal.docs.forEach((doc, index) => {
            console.log(`📋 Agente sin normalizar ${index + 1}:`, {
              id: doc.id,
              email: doc.data().email,
              requiere_registro: doc.data().requiere_registro,
              activo: doc.data().activo,
              nombre: doc.data().nombre
            });
          });
        }
      }
      
      console.log('❌ No se encontró agente con email:', emailNormalizado);
      return null;
    } catch (error) {
      console.error('Error buscando agente:', error);
      return null;
    }
  };

  const activarAgente = async (agenteData, nuevoUid) => {
    try {
      // Actualizar registro del agente con UID de Firebase Auth
      await updateDoc(doc(db, 'agentes', agenteData.id), {
        uid: nuevoUid,
        requiere_registro: false,
        fecha_activacion: new Date(),
        password_temporal: null // Eliminar contraseña temporal por seguridad
      });

      // Actualizar o crear registro en usuarios
      const qUsuarios = query(
        collection(db, 'usuarios'),
        where('email', '==', agenteData.email)
      );
      const usuariosSnapshot = await getDocs(qUsuarios);
      
      if (!usuariosSnapshot.empty) {
        // Actualizar usuario existente
        const usuarioDoc = usuariosSnapshot.docs[0];
        await updateDoc(doc(db, 'usuarios', usuarioDoc.id), {
          uid: nuevoUid,
          estado: 'activo',
          fecha_activacion: new Date()
        });
      } else {
        // Crear nuevo registro de usuario
        await addDoc(collection(db, 'usuarios'), {
          uid: nuevoUid,
          email: agenteData.email,
          nombre: agenteData.nombre,
          rol: 'agente',
          estado: 'activo',
          activo: true,
          fecha_registro: new Date()
        });
      }
    } catch (error) {
      console.error('Error activando agente:', error);
      throw error;
    }
  };

  // Función de debug para verificar agentes en el sistema
  const debugAgentes = async () => {
    try {
      console.log('🔧 DEBUG: Verificando todos los agentes en el sistema...');
      
      const q = query(collection(db, 'agentes'));
      const snapshot = await getDocs(q);
      
      console.log(`📊 Total de agentes encontrados: ${snapshot.size}`);
      
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`👤 Agente ${index + 1}:`, {
          id: doc.id,
          email: data.email,
          nombre: data.nombre,
          requiere_registro: data.requiere_registro,
          activo: data.activo,
          password_temporal: data.password_temporal ? '***' : 'sin password',
          fecha_creacion: data.fecha_creacion
        });
      });
      
      alert(`Se encontraron ${snapshot.size} agentes. Revisa la consola del navegador para más detalles.`);
    } catch (error) {
      console.error('Error en debug:', error);
      alert('Error en debug: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setProcesando(true);
    setMensaje('');

    try {
      // 1. Buscar si el agente existe en el sistema
      const agenteData = await buscarAgenteEnSistema(formData.email);
      
      if (!agenteData) {
        setMensaje(
          <div className="text-left">
            <p className="font-semibold text-red-600 mb-2">Email no encontrado</p>
            <p className="text-sm mb-3">
              Este email no está registrado como agente en el sistema.
            </p>
            <p className="text-sm text-gray-600">
              Contacta al administrador para que te agregue como agente.
            </p>
          </div>
        );
        setProcesando(false);
        return;
      }

      // 2. Verificar si ya está registrado
      if (agenteData.tipo === 'ya_registrado') {
        setMensaje(
          <div className="text-left">
            <p className="font-semibold text-blue-600 mb-2">¡Ya tienes cuenta registrada!</p>
            <p className="text-sm mb-3">
              Tu email ya está registrado en el sistema. Usa el login normal.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              Ir al Login
            </button>
          </div>
        );
        setProcesando(false);
        return;
      }

      // 3. Verificar que la contraseña coincida con la temporal
      if (agenteData.password_temporal !== formData.password) {
        setMensaje(
          <div className="text-left">
            <p className="font-semibold text-red-600 mb-2">Contraseña incorrecta</p>
            <p className="text-sm mb-3">
              La contraseña no coincide con la asignada por el administrador.
            </p>
            <p className="text-sm text-gray-600">
              Verifica las credenciales o contacta al administrador.
            </p>
          </div>
        );
        setProcesando(false);
        return;
      }

      // 4. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      // 5. Activar agente en el sistema
      await activarAgente(agenteData, userCredential.user.uid);

      // 6. Redirigir al panel del agente
      setMensaje(
        <div className="text-left">
          <p className="font-semibold text-green-600 mb-2">¡Registro completado!</p>
          <p className="text-sm">Redirigiendo a tu panel de agente...</p>
        </div>
      );
      setTimeout(() => {
        navigate('/agente');
      }, 2000);

    } catch (error) {
      console.error('Error en registro:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        // Si el email ya está en uso, verificar si es un agente registrado
        const agenteExistente = await buscarAgenteEnSistema(formData.email);
        
        if (agenteExistente && agenteExistente.tipo === 'ya_registrado') {
          setMensaje(
            <div className="text-left">
              <p className="font-semibold text-blue-600 mb-2">Email ya registrado</p>
              <p className="text-sm mb-3">
                Este email ya tiene una cuenta activa. Usa el login normal.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                Ir al Login
              </button>
            </div>
          );
        } else {
          // Intentar login con las credenciales proporcionadas
          try {
            await signInWithEmailAndPassword(auth, formData.email, formData.password);
            setMensaje(
              <div className="text-left">
                <p className="font-semibold text-green-600 mb-2">Iniciando sesión</p>
                <p className="text-sm">Ya tenías cuenta creada. Redirigiendo...</p>
              </div>
            );
            setTimeout(() => {
              navigate('/agente');
            }, 1500);
          } catch (loginError) {
            setMensaje(
              <div className="text-left">
                <p className="font-semibold text-red-600 mb-2">Email ya registrado</p>
                <p className="text-sm mb-3">
                  Este email ya tiene cuenta pero la contraseña no coincide.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Ir al Login
                </button>
              </div>
            );
          }
        }
      } else if (error.code === 'auth/weak-password') {
        setMensaje('La contraseña debe tener al menos 6 caracteres');
      } else {
        setMensaje('Error en el registro: ' + error.message);
      }
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-green-100 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Registro de Agente
          </h1>
          <p className="text-gray-600">
            Completa tu registro con las credenciales proporcionadas por el administrador
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (Usuario) *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tu.email@empresa.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña proporcionada por admin *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Contraseña temporal"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar contraseña *
            </label>
            <input
              type="password"
              name="confirmarPassword"
              value={formData.confirmarPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirma la contraseña"
              required
              minLength={6}
            />
          </div>

          {mensaje && (
            <div className={`p-4 rounded-lg text-sm ${
              (typeof mensaje === 'string' && (mensaje.includes('exitosamente') || mensaje.includes('Redirigiendo') || mensaje.includes('Iniciando sesión'))) ||
              (typeof mensaje === 'object' && mensaje.props && mensaje.props.children && 
               mensaje.props.children.some(child => 
                 child.props && child.props.children && 
                 (child.props.children.includes('completado') || child.props.children.includes('Iniciando sesión'))
               ))
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {mensaje}
            </div>
          )}

          <button
            type="submit"
            disabled={procesando}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {procesando ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Procesando...
              </div>
            ) : (
              'Completar Registro'
            )}
          </button>

          {/* Botón de debug temporal */}
          <button
            type="button"
            onClick={debugAgentes}
            className="w-full mt-2 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 text-sm"
          >
            🔧 Debug: Ver agentes en sistema
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">📋 Instrucciones:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Usa el email y contraseña que te proporcionó el administrador</li>
            <li>• Después del registro podrás acceder a tu panel de agente</li>
            <li>• Desde tu panel podrás crear solicitudes de empresas</li>
            <li>• Contacta al admin si tienes problemas con las credenciales</li>
          </ul>
          
          <div className="mt-3 pt-3 border-t border-blue-200">
            <button
              onClick={() => navigate('/ayuda-agentes')}
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              🆘 ¿Tienes problemas? Ver guía completa
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Iniciar sesión aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
