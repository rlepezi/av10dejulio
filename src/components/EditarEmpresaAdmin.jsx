import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, collection, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, storage, auth } from '../firebase';
import LogoUploader from './LogoUploader';
import HorarioManager from './HorarioManager';
import PerfilEmpresaWeb from './PerfilEmpresaWeb';
import { getDocs, collection as getCollection } from 'firebase/firestore';

export default function EditarEmpresaAdmin() {
  // Obtener agentes disponibles
  const [agentes, setAgentes] = useState([]);

  useEffect(() => {
    const fetchAgentes = async () => {
      try {
        const snapshot = await getDocs(getCollection(db, 'agentes'));
        setAgentes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error cargando agentes:', error);
      }
    };
    fetchAgentes();
  }, []);
  const { empresaId } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [credencialesGeneradas, setCredencialesGeneradas] = useState(false);
  const [solicitudPendiente, setSolicitudPendiente] = useState(false);
  const [generandoCredenciales, setGenerandoCredenciales] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [error, setError] = useState('');
  
  // Estados para el modal de credenciales
  const [mostrarModalCredenciales, setMostrarModalCredenciales] = useState(false);
  const [credencialesForm, setCredencialesForm] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [credencialesGeneradasInfo, setCredencialesGeneradasInfo] = useState(null);

  useEffect(() => {
    fetchEmpresa();
  }, [empresaId]);

  const fetchEmpresa = async () => {
    try {
      const docRef = doc(db, 'empresas', empresaId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('📊 Datos de empresa cargados:', data);
        console.log('🕐 Horario de atención:', data.horario_atencion);
        console.log('🕐 Horarios:', data.horarios);
        setEmpresa({ id: docSnap.id, ...data });
        setCredencialesGeneradas(!!data.credencialesGeneradas);
        setSolicitudPendiente(data.estado === 'pendiente_validación');
        
        // Si ya tiene credenciales, cargar la información
        if (data.credencialesGeneradas && data.usuario_empresa) {
          setCredencialesGeneradasInfo(data.usuario_empresa);
        }
      } else {
        setError('Empresa no encontrada');
      }
    } catch (error) {
      console.error('Error cargando empresa:', error);
      setError('Error al cargar la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmpresa = async (campo, valor) => {
    try {
      setSaving(true);
      
      // Si es una actualización múltiple
      if (campo === 'multiple' && typeof valor === 'object') {
        const updateObj = {
          ...valor,
          fecha_actualizacion: new Date()
        };
        
        // Si se valida la empresa, se pueden generar credenciales
        if (valor.estado === 'validada') {
          updateObj.credencialesGeneradas = false;
        }
        
        await updateDoc(doc(db, 'empresas', empresaId), updateObj);
        
        // Actualizar estado local con todos los cambios
        setEmpresa(prev => ({ ...prev, ...valor }));
        
        console.log('✅ Cambios múltiples guardados exitosamente');
      } else {
        // Actualización de un solo campo (comportamiento original)
        const updateObj = {
          [campo]: valor,
          fecha_actualizacion: new Date()
        };
        
        // Si se valida la empresa, se pueden generar credenciales
        if (campo === 'estado' && valor === 'validada') {
          updateObj.credencialesGeneradas = false;
        }
        
        await updateDoc(doc(db, 'empresas', empresaId), updateObj);
        
        setEmpresa(prev => ({ ...prev, [campo]: valor }));
        
        console.log(`✅ Campo '${campo}' actualizado exitosamente`);
      }
      
      // Mostrar mensaje de éxito temporal
      setTimeout(() => setSaving(false), 1000);
    } catch (error) {
      console.error('Error actualizando empresa:', error);
      setError('Error al actualizar la empresa');
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file, campo = 'logo', valor = null) => {
    try {
      setSaving(true);
      
      if (campo === 'galeria') {
        // Actualizar galería
        await updateDoc(doc(db, 'empresas', empresaId), {
          galeria: valor,
          fecha_actualizacion: new Date()
        });
        setEmpresa(prev => ({ ...prev, galeria: valor }));
        setSaving(false);
        return;
      }

      if (file === null) {
        // Eliminar logo
        await updateDoc(doc(db, 'empresas', empresaId), {
          logo: null,
          logo_url: null,
          fecha_actualizacion: new Date()
        });
        setEmpresa(prev => ({ ...prev, logo: null, logo_url: null }));
        setSaving(false);
        return;
      }

      if (typeof file === 'object' && file.logoURL) {
        // Logo automático generado
        await updateDoc(doc(db, 'empresas', empresaId), {
          logo: file.logoURL,
          logo_url: file.logoURL,
          logoAsignado: true,
          fecha_actualizacion: new Date()
        });
        setEmpresa(prev => ({ 
          ...prev, 
          logo: file.logoURL, 
          logo_url: file.logoURL,
          logoAsignado: true 
        }));
        setSaving(false);
        return;
      }

      // Subir nuevo logo
      if (file instanceof File) {
        // Crear nombre único para el archivo
        const timestamp = Date.now();
        const fileName = `logo-${empresaId}-${timestamp}.${file.name.split('.').pop()}`;
        const logoRef = ref(storage, `logos/empresas/${fileName}`);
        
        // Subir archivo
        const snapshot = await uploadBytes(logoRef, file);
        
        // Obtener URLs
        const gsUrl = `gs://${storage.app.options.storageBucket}/${snapshot.ref.fullPath}`;
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        // Actualizar en Firestore
        await updateDoc(doc(db, 'empresas', empresaId), {
          logo: gsUrl,
          logo_url: downloadURL,
          logoAsignado: true,
          fecha_actualizacion: new Date()
        });
        
        // Actualizar estado local
        setEmpresa(prev => ({ 
          ...prev, 
          logo: gsUrl, 
          logo_url: downloadURL,
          logoAsignado: true 
        }));
        
        console.log('✅ Logo subido exitosamente:', { gsUrl, downloadURL });
        setSaving(false);
        return downloadURL;
      }
      
    } catch (error) {
      console.error('Error subiendo logo:', error);
      setError('Error al subir el logo');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Generar credenciales (solo si validada)
  const handleGenerarCredenciales = async () => {
    // Pre-llenar el email con el de la empresa si existe
    const emailEmpresa = empresa.email || empresa.representante?.email || '';
    setCredencialesForm({
      email: emailEmpresa,
      password: '',
      confirmPassword: ''
    });
    setMostrarModalCredenciales(true);
  };

  // Generar contraseña aleatoria
  const generarPasswordAleatoria = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    setCredencialesForm(prev => ({
      ...prev,
      password: password,
      confirmPassword: password
    }));
  };

  // Crear credenciales reales para la empresa
  const crearCredencialesEmpresa = async () => {
    if (!credencialesForm.email || !credencialesForm.password) {
      alert('Debes completar email y contraseña');
      return;
    }

    if (credencialesForm.password !== credencialesForm.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (credencialesForm.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setGenerandoCredenciales(true);
    try {
      // 1. Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        credencialesForm.email, 
        credencialesForm.password
      );

      const nuevoUid = userCredential.user.uid;

      // 2. Crear registro en la colección 'usuarios' usando setDoc con el UID correcto
      await setDoc(doc(db, 'usuarios', nuevoUid), {
        uid: nuevoUid,
        email: credencialesForm.email,
        nombre: empresa.nombre,
        rol: 'proveedor',
        empresaId: empresaId,
        activo: true,
        fechaCreacion: new Date(),
        creadoPorAdmin: true,
        empresa: {
          nombre: empresa.nombre,
          id: empresaId,
          estado: empresa.estado
        }
      });

      // 3. Actualizar la empresa con las credenciales
      await updateDoc(doc(db, 'empresas', empresaId), {
        credencialesGeneradas: true,
        fecha_credenciales: new Date(),
        usuario_empresa: {
          email: credencialesForm.email,
          uid: nuevoUid,
          fecha_asignacion: new Date(),
          admin_asignador: 'admin' // O el email del admin actual
        },
        uid_auth: nuevoUid
      });

      // 4. Actualizar estado local
      setCredencialesGeneradas(true);
      setCredencialesGeneradasInfo({
        email: credencialesForm.email,
        uid: nuevoUid,
        fecha_asignacion: new Date(),
        admin_asignador: 'admin'
      });

      // 5. Cerrar modal y mostrar éxito
      setMostrarModalCredenciales(false);
      setCredencialesForm({ email: '', password: '', confirmPassword: '' });
      
      // Mostrar información de las credenciales creadas
      alert(
        `✅ Credenciales creadas exitosamente!\n\n` +
        `📧 Email: ${credencialesForm.email}\n` +
        `🔑 Contraseña: ${credencialesForm.password}\n\n` +
        `📋 IMPORTANTE:\n` +
        `• Envía estas credenciales a la empresa\n` +
        `• La empresa puede hacer login inmediatamente\n` +
        `• Accederá a su panel de empresa`
      );

    } catch (error) {
      console.error('Error creando credenciales:', error);
      if (error.code === 'auth/email-already-in-use') {
        alert('❌ Error: El email ya está en uso por otro usuario. Usa un email diferente.');
      } else {
        alert(`❌ Error creando credenciales: ${error.message}`);
      }
    } finally {
      setGenerandoCredenciales(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => navigate('/admin/empresas')}
            className="mt-2 text-red-600 underline"
          >
            Volver al listado
          </button>
        </div>
      </div>
    );
  }

  if (!empresa) return null;

  // Acciones de flujo
  const puedeActivar = empresa.estado === 'pendiente';
  const puedeSolicitarPerfil = empresa.estado === 'activa';
  const puedeValidar = empresa.estado === 'pendiente_validación';
  const puedeGenerarCredenciales = empresa.estado === 'validada' && !credencialesGeneradas;

  // Activar empresa (visible en home)
  const handleActivarEmpresa = async () => {
    await handleUpdateEmpresa('estado', 'activa');
  };

  // Solicitar perfil (onboarding)
  const handleSolicitarPerfil = async () => {
    await handleUpdateEmpresa('estado', 'pendiente_validación');
    setSolicitudPendiente(true);
  };

  // Validar empresa (por agente)
  const handleValidarEmpresa = async () => {
    await handleUpdateEmpresa('estado', 'validada');
  };

  const tabs = [
    { id: 'general', label: 'Información General', icon: '📋' },
    { id: 'representante', label: 'Representante', icon: '👤' },
    { id: 'servicios', label: 'Servicios y Marcas', icon: '🛠️' },
    { id: 'logo', label: 'Logo', icon: '🖼️' },
    { id: 'horarios', label: 'Horarios', icon: '🕒' },
    { id: 'agente', label: 'Agente', icon: '🧑‍💼' },
    { id: 'revision', label: 'Revisión Admin', icon: '🔍' },
    { id: 'metadata', label: 'Metadata', icon: '⚙️' },
    { id: 'perfil', label: 'Perfil Web', icon: '🌐' }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Editar Empresa: {empresa.nombre}
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona la información, logo, horarios y perfil web de la empresa
            </p>
            {/* Estado actual y acciones de flujo */}
            <div className="mt-4 flex flex-col gap-2">
              <span className={
                `px-3 py-1 rounded-full text-sm font-semibold ${
                  empresa.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                  empresa.estado === 'activa' ? 'bg-green-100 text-green-800' :
                  empresa.estado === 'pendiente_validación' ? 'bg-blue-100 text-blue-800' :
                  empresa.estado === 'validada' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`
              }>
                Estado: {empresa.estado || 'Sin estado'}
              </span>
              {puedeActivar && (
                <button onClick={handleActivarEmpresa} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mt-2">Activar empresa (visible en home)</button>
              )}
              {puedeSolicitarPerfil && !solicitudPendiente && (
                <button onClick={handleSolicitarPerfil} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mt-2">Solicitar perfil/acceso</button>
              )}
              {puedeValidar && (
                <button onClick={handleValidarEmpresa} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mt-2">Validar empresa (por agente)</button>
              )}
              {puedeGenerarCredenciales && (
                <button onClick={handleGenerarCredenciales} disabled={generandoCredenciales} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 mt-2">
                  {generandoCredenciales ? 'Generando credenciales...' : '🔑 Crear credenciales de login'}
                </button>
              )}
              {credencialesGeneradas && credencialesGeneradasInfo && (
                <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center gap-2 text-indigo-800 mb-2">
                    <span className="text-lg">✅</span>
                    <span className="font-semibold">Credenciales creadas</span>
                  </div>
                  <div className="text-sm text-indigo-700">
                    <p><strong>Email:</strong> {credencialesGeneradasInfo.email}</p>
                    <p><strong>Fecha:</strong> {credencialesGeneradasInfo.fecha_asignacion?.toDate?.()?.toLocaleDateString() || 'N/A'}</p>
                    <p><strong>UID:</strong> {credencialesGeneradasInfo.uid}</p>
                  </div>
                  <button 
                    onClick={() => setMostrarModalCredenciales(true)}
                    className="mt-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                  >
                    🔄 Cambiar credenciales
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saving && (
              <div className="flex items-center gap-2 text-green-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span className="text-sm">Guardando...</span>
              </div>
            )}
            <button
              onClick={() => navigate('/admin/empresas')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>
        {/* Estado de la empresa */}
        <div className="mt-4 flex items-center gap-4">
          {/* Estado visual ya está arriba, se elimina duplicado */}
          {empresa.web ? (
            <a 
              href={empresa.web.startsWith('http') ? empresa.web : `https://${empresa.web}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              🔗 Ver sitio web
            </a>
          ) : (
            <a 
              href={`/perfil-empresa/${empresaId}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-800 text-sm underline"
            >
              🌐 Ver Perfil Público
            </a>
          )}
          {empresa.web ? (
            <a 
              href={empresa.web.startsWith('http') ? empresa.web : `https://${empresa.web}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              🔗 Ver sitio web
            </a>
          ) : (
            <a 
              href={`/perfil-empresa/${empresaId}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-800 text-sm underline"
            >
              🌐 Ver Perfil Público
            </a>
          )}
        </div>
      </div>
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
      {/* Contenido de tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeTab === 'general' && (
          <InformacionGeneral 
            empresa={empresa} 
            onUpdate={handleUpdateEmpresa}
            saving={saving}
          />
        )}
        {activeTab === 'representante' && (
          <InformacionRepresentante 
            empresa={empresa} 
            onUpdate={handleUpdateEmpresa}
            saving={saving}
          />
        )}
        {activeTab === 'servicios' && (
          <ServiciosManager 
            empresa={empresa} 
            onUpdate={handleUpdateEmpresa}
            saving={saving}
          />
        )}
        {activeTab === 'logo' && (
          <LogoUploader 
            empresa={empresa}
            onLogoUpload={handleLogoUpload}
            saving={saving}
          />
        )}
        {activeTab === 'horarios' && (
          <HorarioManagerDetallado 
            empresa={empresa}
            onUpdate={handleUpdateEmpresa}
            saving={saving}
          />
        )}
        {activeTab === 'agente' && (
          <AgenteAsignacion
            empresa={empresa}
            agentes={agentes}
            onUpdate={handleUpdateEmpresa}
            saving={saving}
          />
        )}
        {activeTab === 'revision' && (
          <RevisionAdmin 
            empresa={empresa} 
            onUpdate={handleUpdateEmpresa}
            saving={saving}
          />
        )}
        {activeTab === 'metadata' && (
          <MetadataManager 
            empresa={empresa} 
            onUpdate={handleUpdateEmpresa}
            saving={saving}
          />
        )}
        {activeTab === 'perfil' && (
          <PerfilEmpresaWeb 
            empresa={empresa}
            onUpdate={handleUpdateEmpresa}
          />
        )}
      </div>

      {/* Modal para crear credenciales */}
      {mostrarModalCredenciales && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">🔑 Crear Credenciales de Login</h2>
              <button
                onClick={() => setMostrarModalCredenciales(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de acceso *
                </label>
                <input
                  type="email"
                  value={credencialesForm.email}
                  onChange={(e) => setCredencialesForm(prev => ({...prev, email: e.target.value}))}
                  placeholder="email@empresa.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recomendado: usar el email del representante legal
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={credencialesForm.password}
                    onChange={(e) => setCredencialesForm(prev => ({...prev, password: e.target.value}))}
                    placeholder="Contraseña"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={generarPasswordAleatoria}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    🎲 Generar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 6 caracteres. Usa el botón "Generar" para crear una contraseña segura.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar contraseña *
                </label>
                <input
                  type="text"
                  value={credencialesForm.confirmPassword}
                  onChange={(e) => setCredencialesForm(prev => ({...prev, confirmPassword: e.target.value}))}
                  placeholder="Repite la contraseña"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Información importante */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-lg">ℹ️</span>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Importante:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Se creará un usuario real en el sistema</li>
                      <li>La empresa podrá hacer login inmediatamente</li>
                      <li>Accederá a su panel de empresa</li>
                      <li>Guarda estas credenciales de forma segura</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={() => setMostrarModalCredenciales(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={crearCredencialesEmpresa}
                disabled={generandoCredenciales}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {generandoCredenciales ? '⏳ Creando...' : '✅ Crear Credenciales'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para asignación de agente
function AgenteAsignacion({ empresa, agentes, onUpdate, saving }) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Asignar Agente</h3>
      <select
        value={empresa.agenteAsignado || ''}
        onChange={e => onUpdate('agenteAsignado', e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        disabled={saving}
      >
        <option value="">Sin agente asignado</option>
        {agentes.map(agente => (
          <option key={agente.id} value={agente.id}>
            {agente.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}

// Componente para información general
function InformacionGeneral({ empresa, onUpdate, saving }) {
  const [formData, setFormData] = useState({
    nombre: empresa.nombre || '',
    email: empresa.email || '',
    telefono: empresa.telefono || '',
    direccion: empresa.direccion || '',
    web: empresa.web || '',
    categoria: empresa.categoria || '',
    descripcion: empresa.descripcion || '',
            estado: empresa.estado || 'inactiva',
    tipoEmpresa: empresa.tipoEmpresa || 'proveedor'
  });
  const [mensajeExito, setMensajeExito] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Sincronizar formData cuando cambie la empresa
  useEffect(() => {
    setFormData({
      nombre: empresa.nombre || '',
      email: empresa.email || '',
      telefono: empresa.telefono || '',
      direccion: empresa.direccion || '',
      web: empresa.web || '',
      categoria: empresa.categoria || '',
      descripcion: empresa.descripcion || '',
      estado: empresa.estado || 'inactiva',
      tipoEmpresa: empresa.tipoEmpresa || 'proveedor'
    });
  }, [empresa]);

  const handleSave = async () => {
    try {
      // Filtrar solo los campos que han cambiado
      const cambios = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== empresa[key]) {
          cambios[key] = formData[key];
        }
      });

      // Si no hay cambios, no hacer nada
      if (Object.keys(cambios).length === 0) {
        console.log('No hay cambios para guardar');
        return;
      }

      console.log('Guardando cambios:', cambios);
      
      // Guardar todos los cambios en una sola operación
      await onUpdate('multiple', cambios);
      
      // Mostrar mensaje de éxito
      setMensajeExito('✅ Cambios guardados exitosamente');
      setTimeout(() => setMensajeExito(''), 3000);
      
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      setMensajeExito('❌ Error al guardar los cambios');
      setTimeout(() => setMensajeExito(''), 3000);
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Información General</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la empresa *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="email@empresa.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sitio web
          </label>
          <input
            type="url"
            name="web"
            value={formData.web}
            onChange={handleChange}
            placeholder="https://ejemplo.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar categoría</option>
            <option value="Repuestos">Repuestos</option>
            <option value="Servicios">Servicios</option>
            <option value="Talleres">Talleres</option>
            <option value="Seguros">Seguros</option>
            <option value="Venta de Vehículos">Venta de Vehículos</option>
            <option value="Otros">Otros</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="activa">Activa</option>
            <option value="inactiva">Inactiva</option>
            <option value="en_revision">En Revisión</option>
            <option value="suspendida">Suspendida</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horario de Atención Actual
          </label>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            {empresa.horario_atencion ? (
              <p className="text-gray-800 font-medium">{empresa.horario_atencion}</p>
            ) : (
              <p className="text-gray-500 italic">No hay horarios configurados</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Para modificar horarios, ve a la pestaña "Horarios"
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Empresa
          </label>
          <select
            name="tipoEmpresa"
            value={formData.tipoEmpresa}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="proveedor">Proveedor</option>
            <option value="pyme">PyME</option>
            <option value="empresa">Empresa</option>
            <option value="emprendimiento">Emprendimiento</option>
            <option value="local">Local</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dirección
        </label>
        <input
          type="text"
          name="direccion"
          value={formData.direccion}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción
        </label>
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Descripción de la empresa y sus servicios..."
        />
      </div>

      {/* Mensaje de éxito/error */}
      {mensajeExito && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          mensajeExito.includes('✅') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {mensajeExito}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}

// Componente para información del representante
function InformacionRepresentante({ empresa, onUpdate, saving }) {
  const representante = empresa.representante || {};
  const [formData, setFormData] = useState({
    nombre: representante.nombre || '',
    apellidos: representante.apellidos || '',
    email: representante.email || '',
    telefono: representante.telefono || '',
    cargo: representante.cargo || '',
    cedula: representante.cedula || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUpdate('representante', formData);
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Información del Representante</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombres *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Apellidos *
          </label>
          <input
            type="text"
            name="apellidos"
            value={formData.apellidos}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cargo
          </label>
          <input
            type="text"
            name="cargo"
            value={formData.cargo}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cédula
          </label>
          <input
            type="text"
            name="cedula"
            value={formData.cedula}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar Representante'}
        </button>
      </div>
    </div>
  );
}

// Componente para gestión de servicios y marcas
function ServiciosManager({ empresa, onUpdate, saving }) {
  const [servicios, setServicios] = useState(empresa.servicios || []);
  const [marcas, setMarcas] = useState(empresa.marcas || []);
  const [categorias, setCategorias] = useState(empresa.categorias || []);
  const [nuevoServicio, setNuevoServicio] = useState('');
  const [nuevaMarca, setNuevaMarca] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [activeSection, setActiveSection] = useState('servicios');

  // Servicios predefinidos comunes
  const serviciosPredefinidos = [
    'Reparación de Motor', 'Cambio de Aceite', 'Alineación', 'Balanceado', 
    'Frenos', 'Suspensión', 'Sistema Eléctrico', 'Air Bag', 'Transmisión',
    'Radiador', 'Batería', 'Llantas', 'Pintura', 'Soldadura', 'Tapicería',
    'Vidrios', 'Cerrajería', 'Grúa', 'Lavado', 'Encerado', 'Detallado'
  ];

  // Marcas predefinidas comunes
  const marcasPredefinidas = [
    'Toyota', 'Chevrolet', 'Ford', 'Nissan', 'Hyundai', 'Kia', 'Mazda',
    'Honda', 'Volkswagen', 'Renault', 'Peugeot', 'Citroën', 'Fiat',
    'BMW', 'Mercedes-Benz', 'Audi', 'Volvo', 'Jeep', 'Mitsubishi', 'Subaru'
  ];

  // Categorías predefinidas (tipos de vehículos)
  const categoriasPredefinidas = [
    'Auto', 'Camioneta', 'Camión', 'Bus', 'Moto', 'Pickup', 'SUV', 'Van',
    'Camión de Carga', 'Tractor', 'Maquinaria Pesada', 'Bicicleta'
  ];

  const agregarServicio = (servicio = null) => {
    const servicioAgregar = servicio || nuevoServicio.trim();
    if (servicioAgregar && !servicios.includes(servicioAgregar)) {
      const nuevosServicios = [...servicios, servicioAgregar];
      setServicios(nuevosServicios);
      setNuevoServicio('');
      onUpdate('servicios', nuevosServicios);
    }
  };

  const agregarMarca = (marca = null) => {
    const marcaAgregar = marca || nuevaMarca.trim();
    if (marcaAgregar && !marcas.includes(marcaAgregar)) {
      const nuevasMarcas = [...marcas, marcaAgregar];
      setMarcas(nuevasMarcas);
      setNuevaMarca('');
      onUpdate('marcas', nuevasMarcas);
    }
  };

  const agregarCategoria = (categoria = null) => {
    const categoriaAgregar = categoria || nuevaCategoria.trim();
    if (categoriaAgregar && !categorias.includes(categoriaAgregar)) {
      const nuevasCategorias = [...categorias, categoriaAgregar];
      setCategorias(nuevasCategorias);
      setNuevaCategoria('');
      onUpdate('categorias', nuevasCategorias);
    }
  };

  const eliminarServicio = (index) => {
    const nuevosServicios = servicios.filter((_, i) => i !== index);
    setServicios(nuevosServicios);
    onUpdate('servicios', nuevosServicios);
  };

  const eliminarMarca = (index) => {
    const nuevasMarcas = marcas.filter((_, i) => i !== index);
    setMarcas(nuevasMarcas);
    onUpdate('marcas', nuevasMarcas);
  };

  const eliminarCategoria = (index) => {
    const nuevasCategorias = categorias.filter((_, i) => i !== index);
    setCategorias(nuevasCategorias);
    onUpdate('categorias', nuevasCategorias);
  };

  const handleKeyPress = (e, tipo) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tipo === 'servicio') {
        agregarServicio();
      } else if (tipo === 'marca') {
        agregarMarca();
      } else if (tipo === 'categoria') {
        agregarCategoria();
      }
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Servicios, Marcas y Categorías</h3>
      
      {/* Navegación de secciones */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveSection('servicios')}
            className={`px-4 py-2 font-medium ${
              activeSection === 'servicios'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🛠️ Servicios ({servicios.length})
          </button>
          <button
            onClick={() => setActiveSection('marcas')}
            className={`px-4 py-2 font-medium ${
              activeSection === 'marcas'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🚗 Marcas ({marcas.length})
          </button>
          <button
            onClick={() => setActiveSection('categorias')}
            className={`px-4 py-2 font-medium ${
              activeSection === 'categorias'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🚙 Categorías ({categorias.length})
          </button>
        </div>
      </div>

      {/* Sección de Servicios */}
      {activeSection === 'servicios' && (
        <div>
          {/* Servicios predefinidos */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3">Servicios Comunes</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {serviciosPredefinidos
                .filter(servicio => !servicios.includes(servicio))
                .map((servicio, index) => (
                <button
                  key={index}
                  onClick={() => agregarServicio(servicio)}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors text-left"
                >
                  + {servicio}
                </button>
              ))}
            </div>
          </div>

          {/* Agregar servicio personalizado */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3">Agregar Servicio Personalizado</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevoServicio}
                onChange={(e) => setNuevoServicio(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'servicio')}
                placeholder="Nombre del servicio personalizado..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => agregarServicio()}
                disabled={!nuevoServicio.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Lista de servicios seleccionados */}
          <div>
            <h4 className="text-md font-semibold mb-3">Servicios Seleccionados</h4>
            {servicios.length === 0 ? (
              <p className="text-gray-500 text-center py-6 bg-gray-50 rounded-lg">
                No hay servicios seleccionados
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {servicios.map((servicio, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="flex-1 text-green-800">✓ {servicio}</span>
                    <button
                      onClick={() => eliminarServicio(index)}
                      className="text-red-600 hover:text-red-800 p-1 ml-2"
                      title="Eliminar servicio"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sección de Marcas */}
      {activeSection === 'marcas' && (
        <div>
          {/* Marcas predefinidas */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3">Marcas Comunes</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {marcasPredefinidas
                .filter(marca => !marcas.includes(marca))
                .map((marca, index) => (
                <button
                  key={index}
                  onClick={() => agregarMarca(marca)}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors text-left"
                >
                  + {marca}
                </button>
              ))}
            </div>
          </div>

          {/* Agregar marca personalizada */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3">Agregar Marca Personalizada</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevaMarca}
                onChange={(e) => setNuevaMarca(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'marca')}
                placeholder="Nombre de la marca personalizada..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => agregarMarca()}
                disabled={!nuevaMarca.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Lista de marcas seleccionadas */}
          <div>
            <h4 className="text-md font-semibold mb-3">Marcas Seleccionadas</h4>
            {marcas.length === 0 ? (
              <p className="text-gray-500 text-center py-6 bg-gray-50 rounded-lg">
                No hay marcas seleccionadas
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {marcas.map((marca, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="flex-1 text-blue-800">🚗 {marca}</span>
                    <button
                      onClick={() => eliminarMarca(index)}
                      className="text-red-600 hover:text-red-800 p-1 ml-2"
                      title="Eliminar marca"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sección de Categorías */}
      {activeSection === 'categorias' && (
        <div>
          {/* Categorías predefinidas */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3">Tipos de Vehículos Comunes</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {categoriasPredefinidas
                .filter(categoria => !categorias.includes(categoria))
                .map((categoria, index) => (
                <button
                  key={index}
                  onClick={() => agregarCategoria(categoria)}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-purple-100 hover:text-purple-700 transition-colors text-left"
                >
                  + {categoria}
                </button>
              ))}
            </div>
          </div>

          {/* Agregar categoría personalizada */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3">Agregar Tipo de Vehículo Personalizado</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'categoria')}
                placeholder="Nombre del tipo de vehículo personalizado..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => agregarCategoria()}
                disabled={!nuevaCategoria.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Lista de categorías seleccionadas */}
          <div>
            <h4 className="text-md font-semibold mb-3">Tipos de Vehículos Seleccionados</h4>
            {categorias.length === 0 ? (
              <p className="text-gray-500 text-center py-6 bg-gray-50 rounded-lg">
                No hay tipos de vehículos seleccionados
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {categorias.map((categoria, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <span className="flex-1 text-purple-800">🚙 {categoria}</span>
                    <button
                      onClick={() => eliminarCategoria(index)}
                      className="text-red-600 hover:text-red-800 p-1 ml-2"
                      title="Eliminar tipo de vehículo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para revisión administrativa
function RevisionAdmin({ empresa, onUpdate, saving }) {
  // Validaciones automáticas
  const validaciones = {
    logoValido: empresa.logo && empresa.logo.length > 0,
    webValida: !empresa.web || (empresa.web.startsWith('http') && empresa.web.length > 10),
    imagenesMinimas: empresa.galeria && empresa.galeria.length >= 2,
    serviciosCompletos: empresa.servicios && empresa.servicios.length >= 2,
    marcasDefinidas: empresa.marcas && empresa.marcas.length >= 2,
    categoriasDefinidas: empresa.categorias && empresa.categorias.length >= 2,
    horariosCompletos: empresa.horarios && Object.values(empresa.horarios).some(h => h.abierto),
    informacionCompleta: empresa.nombre && empresa.telefono && empresa.email && empresa.direccion,
    representanteCompleto: empresa.representante && empresa.representante.nombre && empresa.representante.email
  };

  const totalValidaciones = Object.keys(validaciones).length;
  const validacionesCorrectas = Object.values(validaciones).filter(Boolean).length;
  const porcentajeCompleto = Math.round((validacionesCorrectas / totalValidaciones) * 100);

  const handleValidarElement = (elemento, valor) => {
    onUpdate(elemento, valor);
  };

  const estadoGeneral = porcentajeCompleto >= 80 ? 'excelente' : 
                       porcentajeCompleto >= 60 ? 'bueno' : 
                       porcentajeCompleto >= 40 ? 'regular' : 'deficiente';

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">🔍 Revisión Administrativa</h3>
      
      {/* Estado general */}
      <div className="mb-6 p-4 rounded-lg border-2" style={{
        borderColor: estadoGeneral === 'excelente' ? '#22c55e' : 
                    estadoGeneral === 'bueno' ? '#3b82f6' : 
                    estadoGeneral === 'regular' ? '#f59e0b' : '#ef4444',
        backgroundColor: estadoGeneral === 'excelente' ? '#f0fdf4' : 
                        estadoGeneral === 'bueno' ? '#eff6ff' : 
                        estadoGeneral === 'regular' ? '#fffbeb' : '#fef2f2'
      }}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-lg">Estado General del Perfil</h4>
          <span className="text-2xl">
            {estadoGeneral === 'excelente' ? '🟢' : 
             estadoGeneral === 'bueno' ? '🔵' : 
             estadoGeneral === 'regular' ? '🟡' : '🔴'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-200 rounded-full h-3">
            <div 
              className="h-3 rounded-full transition-all duration-300"
              style={{
                width: `${porcentajeCompleto}%`,
                backgroundColor: estadoGeneral === 'excelente' ? '#22c55e' : 
                               estadoGeneral === 'bueno' ? '#3b82f6' : 
                               estadoGeneral === 'regular' ? '#f59e0b' : '#ef4444'
              }}
            />
          </div>
          <span className="font-bold text-lg">{porcentajeCompleto}%</span>
        </div>
        <p className="text-sm mt-2 opacity-75">
          {validacionesCorrectas} de {totalValidaciones} elementos completados
        </p>
      </div>

      {/* Lista de validaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg border-l-4 ${validaciones.logoValido ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium">🖼️ Logo de la Empresa</h5>
              <p className="text-sm text-gray-600">Logo asignado y visible</p>
            </div>
            <span className="text-2xl">{validaciones.logoValido ? '✅' : '❌'}</span>
          </div>
          {!validaciones.logoValido && (
            <p className="text-red-600 text-sm mt-2">⚠️ Subir o asignar logo en la pestaña "Logo"</p>
          )}
        </div>

        <div className={`p-4 rounded-lg border-l-4 ${validaciones.webValida ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium">🌐 Página Web</h5>
              <p className="text-sm text-gray-600">URL válida o perfil público</p>
            </div>
            <span className="text-2xl">{validaciones.webValida ? '✅' : '❌'}</span>
          </div>
          {!validaciones.webValida && empresa.web && (
            <p className="text-red-600 text-sm mt-2">⚠️ URL de página web no es válida</p>
          )}
        </div>

        <div className={`p-4 rounded-lg border-l-4 ${validaciones.imagenesMinimas ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium">📸 Galería de Imágenes</h5>
              <p className="text-sm text-gray-600">Mínimo 2 imágenes del local</p>
            </div>
            <span className="text-2xl">{validaciones.imagenesMinimas ? '✅' : '❌'}</span>
          </div>
          {!validaciones.imagenesMinimas && (
            <p className="text-red-600 text-sm mt-2">
              ⚠️ Faltan imágenes ({empresa.galeria?.length || 0}/2 mínimo)
            </p>
          )}
        </div>

        <div className={`p-4 rounded-lg border-l-4 ${validaciones.serviciosCompletos ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium">🛠️ Servicios Ofrecidos</h5>
              <p className="text-sm text-gray-600">Mínimo 2 servicios definidos</p>
            </div>
            <span className="text-2xl">{validaciones.serviciosCompletos ? '✅' : '❌'}</span>
          </div>
          {!validaciones.serviciosCompletos && (
            <p className="text-red-600 text-sm mt-2">
              ⚠️ Definir servicios ({empresa.servicios?.length || 0}/2 mínimo)
            </p>
          )}
        </div>

        <div className={`p-4 rounded-lg border-l-4 ${validaciones.marcasDefinidas ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium">🚗 Marcas que Trabaja</h5>
              <p className="text-sm text-gray-600">Mínimo 2 marcas definidas</p>
            </div>
            <span className="text-2xl">{validaciones.marcasDefinidas ? '✅' : '❌'}</span>
          </div>
          {!validaciones.marcasDefinidas && (
            <p className="text-red-600 text-sm mt-2">
              ⚠️ Definir marcas ({empresa.marcas?.length || 0}/2 mínimo)
            </p>
          )}
        </div>

        <div className={`p-4 rounded-lg border-l-4 ${validaciones.categoriasDefinidas ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium">🚙 Tipos de Vehículos</h5>
              <p className="text-sm text-gray-600">Mínimo 2 tipos definidos</p>
            </div>
            <span className="text-2xl">{validaciones.categoriasDefinidas ? '✅' : '❌'}</span>
          </div>
          {!validaciones.categoriasDefinidas && (
            <p className="text-red-600 text-sm mt-2">
              ⚠️ Definir tipos de vehículos ({empresa.categorias?.length || 0}/2 mínimo)
            </p>
          )}
        </div>

        <div className={`p-4 rounded-lg border-l-4 ${validaciones.horariosCompletos ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium">🕒 Horarios de Atención</h5>
              <p className="text-sm text-gray-600">Al menos un día con horario</p>
            </div>
            <span className="text-2xl">{validaciones.horariosCompletos ? '✅' : '❌'}</span>
          </div>
          {!validaciones.horariosCompletos && (
            <p className="text-red-600 text-sm mt-2">⚠️ Configurar horarios en la pestaña "Horarios"</p>
          )}
        </div>

        <div className={`p-4 rounded-lg border-l-4 ${validaciones.informacionCompleta ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium">📋 Información General</h5>
              <p className="text-sm text-gray-600">Datos básicos completos</p>
            </div>
            <span className="text-2xl">{validaciones.informacionCompleta ? '✅' : '❌'}</span>
          </div>
          {!validaciones.informacionCompleta && (
            <p className="text-red-600 text-sm mt-2">⚠️ Completar información general</p>
          )}
        </div>

        <div className={`p-4 rounded-lg border-l-4 ${validaciones.representanteCompleto ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium">👤 Representante Legal</h5>
              <p className="text-sm text-gray-600">Datos del representante</p>
            </div>
            <span className="text-2xl">{validaciones.representanteCompleto ? '✅' : '❌'}</span>
          </div>
          {!validaciones.representanteCompleto && (
            <p className="text-red-600 text-sm mt-2">⚠️ Completar datos del representante</p>
          )}
        </div>
      </div>

      {/* Acciones rápidas de validación */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-3">⚡ Acciones Rápidas de Validación</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleValidarElement('logoValidado', true)}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            ✅ Validar Logo
          </button>
          <button
            onClick={() => handleValidarElement('webValidada', true)}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            🌐 Validar Web
          </button>
          <button
            onClick={() => handleValidarElement('imagenesValidadas', true)}
            disabled={saving}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            📸 Validar Imágenes
          </button>
        </div>

        {porcentajeCompleto >= 80 && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-lg">🎉</span>
              <div>
                <p className="font-semibold text-green-800">¡Perfil Listo para Publicación!</p>
                <button
                  onClick={() => {
                    handleValidarElement('perfilPublico', true);
                    handleValidarElement('estado', 'activa');
                  }}
                  disabled={saving}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  🚀 Activar Perfil Público
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vista previa del perfil */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold mb-3">👁️ Vista Previa</h4>
        <div className="flex gap-3">
          <a
            href={`/empresa/${empresa.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🌐 Ver Perfil Público
          </a>
          <a
            href={`/admin/empresas`}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            📋 Volver al Listado
          </a>
        </div>
      </div>
    </div>
  );
}

// Componente para metadata
function MetadataManager({ empresa, onUpdate, saving }) {
  const [formData, setFormData] = useState({
    etapa_proceso: empresa.etapa_proceso || 'pendiente',
    logoAsignado: empresa.logoAsignado || false,
    logoValidado: empresa.logoValidado || false,
    webValidada: empresa.webValidada || false,
    imagenesValidadas: empresa.imagenesValidadas || false,
    galeriaCompleta: empresa.galeriaCompleta || false,
    telefonoValidado: empresa.telefonoValidado || false,
    emailValidado: empresa.emailValidado || false,
    ubicacionVerificada: empresa.ubicacionVerificada || false,
    documentosCompletos: empresa.documentosCompletos || false,
    perfilPublico: empresa.perfilPublico || false,
    agenteAsignado: empresa.agenteAsignado || '',
    notas_admin: empresa.notas_admin || '',
    fecha_verificacion: empresa.fecha_verificacion || '',
    prioridad: empresa.prioridad || 'normal'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSave = () => {
    Object.keys(formData).forEach(key => {
      if (formData[key] !== empresa[key]) {
        onUpdate(key, formData[key]);
      }
    });
  };

  const etapas = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_revision', label: 'En Revisión' },
    { value: 'validacion_documentos', label: 'Validación de Documentos' },
    { value: 'verificacion_datos', label: 'Verificación de Datos' },
    { value: 'asignacion_agente', label: 'Asignación de Agente' },
    { value: 'completado', label: 'Completado' },
    { value: 'rechazado', label: 'Rechazado' }
  ];

  const prioridades = [
    { value: 'baja', label: 'Baja' },
    { value: 'normal', label: 'Normal' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' }
  ];

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Metadata y Control</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Etapa del proceso */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Etapa del Proceso
          </label>
          <select
            name="etapa_proceso"
            value={formData.etapa_proceso}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {etapas.map(etapa => (
              <option key={etapa.value} value={etapa.value}>
                {etapa.label}
              </option>
            ))}
          </select>
        </div>

        {/* Prioridad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prioridad
          </label>
          <select
            name="prioridad"
            value={formData.prioridad}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {prioridades.map(prioridad => (
              <option key={prioridad.value} value={prioridad.value}>
                {prioridad.label}
              </option>
            ))}
          </select>
        </div>

        {/* Agente asignado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agente Asignado
          </label>
          <input
            type="text"
            name="agenteAsignado"
            value={formData.agenteAsignado}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ID o nombre del agente"
          />
        </div>

        {/* Fecha de verificación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Verificación
          </label>
          <input
            type="date"
            name="fecha_verificacion"
            value={formData.fecha_verificacion}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Checkboxes de validación */}
      <div className="mt-6">
        <h4 className="text-md font-semibold mb-3">Estados de Validación</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="logoAsignado"
              checked={formData.logoAsignado}
              onChange={handleChange}
              className="mr-2"
            />
            Logo Asignado
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="logoValidado"
              checked={formData.logoValidado}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-green-600">✓ Logo Validado</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="webValidada"
              checked={formData.webValidada}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-green-600">✓ Web Validada</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="imagenesValidadas"
              checked={formData.imagenesValidadas}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-green-600">✓ Imágenes Validadas</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="galeriaCompleta"
              checked={formData.galeriaCompleta}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-blue-600">📸 Galería Completa</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="telefonoValidado"
              checked={formData.telefonoValidado}
              onChange={handleChange}
              className="mr-2"
            />
            Teléfono Validado
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="emailValidado"
              checked={formData.emailValidado}
              onChange={handleChange}
              className="mr-2"
            />
            Email Validado
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="ubicacionVerificada"
              checked={formData.ubicacionVerificada}
              onChange={handleChange}
              className="mr-2"
            />
            Ubicación Verificada
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="documentosCompletos"
              checked={formData.documentosCompletos}
              onChange={handleChange}
              className="mr-2"
            />
            Documentos Completos
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="perfilPublico"
              checked={formData.perfilPublico}
              onChange={handleChange}
              className="mr-2"
            />
            Perfil Público Activo
          </label>
        </div>
      </div>

      {/* Notas administrativas */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas Administrativas
        </label>
        <textarea
          name="notas_admin"
          value={formData.notas_admin}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Notas internas del administrador..."
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar Metadata'}
        </button>
      </div>
    </div>
  );
}

// Componente para gestión detallada de horarios
function HorarioManagerDetallado({ empresa, onUpdate, saving }) {
  const diasSemana = [
    { key: 'lunes', label: 'Lunes', emoji: '📅' },
    { key: 'martes', label: 'Martes', emoji: '📅' },
    { key: 'miercoles', label: 'Miércoles', emoji: '📅' },
    { key: 'jueves', label: 'Jueves', emoji: '📅' },
    { key: 'viernes', label: 'Viernes', emoji: '📅' },
    { key: 'sabado', label: 'Sábado', emoji: '📅' },
    { key: 'domingo', label: 'Domingo', emoji: '📅' }
  ];

  const horarioInicial = {
    abierto: false,
    apertura: '08:00',
    cierre: '18:00',
    descanso_inicio: '',
    descanso_fin: '',
    turno_continuo: true
  };

  const [horarios, setHorarios] = useState(() => {
    // Buscar horarios en diferentes campos para compatibilidad
    let horariosEmpresa = empresa.horarios || {};
    
    // Si no hay horarios estructurados pero hay horario_atencion, intentar parsearlo
    if (Object.keys(horariosEmpresa).length === 0 && empresa.horario_atencion) {
      console.log('📝 Horario de atención encontrado:', empresa.horario_atencion);
      // Intentar convertir el texto de horarios a estructura
      horariosEmpresa = parsearHorarioTexto(empresa.horario_atencion);
    }
    
    const horariosCompletos = {};
    
    diasSemana.forEach(dia => {
      horariosCompletos[dia.key] = {
        ...horarioInicial,
        ...horariosEmpresa[dia.key]
      };
    });
    
    return horariosCompletos;
  });

  const [configuracionRapida, setConfiguracionRapida] = useState('personalizado');

  // Función para parsear texto de horarios a estructura
  const parsearHorarioTexto = (textoHorarios) => {
    if (!textoHorarios) return {};
    
    console.log('🔄 Parseando horarios del texto:', textoHorarios);
    
    const horariosParseados = {};
    const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    
    // Mapeo de abreviaciones a claves
    const mapeoDias = {
      'lun': 'lunes',
      'mar': 'martes', 
      'mié': 'miercoles',
      'jue': 'jueves',
      'vie': 'viernes',
      'sáb': 'sabado',
      'dom': 'domingo'
    };
    
    // Dividir por comas y procesar cada día
    const partes = textoHorarios.split(',').map(p => p.trim());
    
    partes.forEach(parte => {
      // Buscar el día en la parte
      let diaEncontrado = null;
      let horarioEncontrado = null;
      
      // Buscar abreviación de día
      for (const [abrev, dia] of Object.entries(mapeoDias)) {
        if (parte.toLowerCase().includes(abrev.toLowerCase())) {
          diaEncontrado = dia;
          break;
        }
      }
      
      if (diaEncontrado) {
        // Extraer horario (formato: HH:MM-HH:MM)
        const matchHorario = parte.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
        if (matchHorario) {
          const [_, inicio, fin] = matchHorario;
          horariosParseados[diaEncontrado] = {
            abierto: true,
            apertura: inicio,
            cierre: fin,
            turno_continuo: true,
            descanso_inicio: '',
            descanso_fin: ''
          };
          console.log(`✅ Día ${diaEncontrado}: ${inicio}-${fin}`);
        }
      }
    });
    
    // Completar días no encontrados como cerrados
    diasSemana.forEach(dia => {
      if (!horariosParseados[dia]) {
        horariosParseados[dia] = {
          abierto: false,
          apertura: '09:00',
          cierre: '18:00',
          turno_continuo: true,
          descanso_inicio: '',
          descanso_fin: ''
        };
      }
    });
    
    console.log('📊 Horarios parseados:', horariosParseados);
    return horariosParseados;
  };

  const handleDiaChange = (dia, campo, valor) => {
    const nuevosHorarios = {
      ...horarios,
      [dia]: {
        ...horarios[dia],
        [campo]: valor
      }
    };
    setHorarios(nuevosHorarios);
  };

  const aplicarConfiguracionRapida = (config) => {
    let nuevosHorarios = { ...horarios };

    switch (config) {
      case 'comercial':
        diasSemana.forEach(dia => {
          if (['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].includes(dia.key)) {
            nuevosHorarios[dia.key] = {
              ...horarioInicial,
              abierto: true,
              apertura: '08:00',
              cierre: '18:00',
              turno_continuo: true
            };
          } else if (dia.key === 'sabado') {
            nuevosHorarios[dia.key] = {
              ...horarioInicial,
              abierto: true,
              apertura: '08:00',
              cierre: '13:00',
              turno_continuo: true
            };
          } else {
            nuevosHorarios[dia.key] = { ...horarioInicial, abierto: false };
          }
        });
        break;

      case 'taller':
        diasSemana.forEach(dia => {
          if (['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'].includes(dia.key)) {
            nuevosHorarios[dia.key] = {
              ...horarioInicial,
              abierto: true,
              apertura: '07:00',
              cierre: '17:00',
              descanso_inicio: '12:00',
              descanso_fin: '13:00',
              turno_continuo: false
            };
          } else {
            nuevosHorarios[dia.key] = { ...horarioInicial, abierto: false };
          }
        });
        break;

      case '24h':
        diasSemana.forEach(dia => {
          nuevosHorarios[dia.key] = {
            ...horarioInicial,
            abierto: true,
            apertura: '00:00',
            cierre: '23:59',
            turno_continuo: true
          };
        });
        break;

      case 'cerrado':
        diasSemana.forEach(dia => {
          nuevosHorarios[dia.key] = { ...horarioInicial, abierto: false };
        });
        break;
    }

    setHorarios(nuevosHorarios);
    setConfiguracionRapida(config);
  };

  const copiarHorario = (diaOrigen) => {
    return (diaDestino) => {
      const nuevosHorarios = {
        ...horarios,
        [diaDestino]: { ...horarios[diaOrigen] }
      };
      setHorarios(nuevosHorarios);
    };
  };

  const handleGuardar = () => {
    onUpdate('horarios', horarios);
  };

  const formatearHora = (hora) => {
    if (!hora) return '';
    const [hh, mm] = hora.split(':');
    return `${hh}:${mm}`;
  };

  const obtenerResumenHorario = (horario) => {
    if (!horario.abierto) return 'Cerrado';
    if (horario.turno_continuo) {
      return `${formatearHora(horario.apertura)} - ${formatearHora(horario.cierre)}`;
    } else {
      return `${formatearHora(horario.apertura)}-${formatearHora(horario.descanso_inicio)} | ${formatearHora(horario.descanso_fin)}-${formatearHora(horario.cierre)}`;
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Gestión de Horarios</h3>

      {/* Configuraciones rápidas */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-md font-semibold mb-3">⚡ Configuraciones Rápidas</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => aplicarConfiguracionRapida('comercial')}
            className={`p-3 rounded-lg text-sm font-medium transition-colors ${
              configuracionRapida === 'comercial'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-blue-50'
            }`}
          >
            🏢 Comercial<br/>
            <span className="text-xs opacity-75">L-V 8-18, S 8-13</span>
          </button>
          <button
            onClick={() => aplicarConfiguracionRapida('taller')}
            className={`p-3 rounded-lg text-sm font-medium transition-colors ${
              configuracionRapida === 'taller'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-blue-50'
            }`}
          >
            🔧 Taller<br/>
            <span className="text-xs opacity-75">L-S 7-17 (descanso)</span>
          </button>
          <button
            onClick={() => aplicarConfiguracionRapida('24h')}
            className={`p-3 rounded-lg text-sm font-medium transition-colors ${
              configuracionRapida === '24h'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-blue-50'
            }`}
          >
            🌙 24 Horas<br/>
            <span className="text-xs opacity-75">Todos los días</span>
          </button>
          <button
            onClick={() => aplicarConfiguracionRapida('cerrado')}
            className={`p-3 rounded-lg text-sm font-medium transition-colors ${
              configuracionRapida === 'cerrado'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-red-50'
            }`}
          >
            🚫 Cerrado<br/>
            <span className="text-xs opacity-75">Todos los días</span>
          </button>
        </div>
      </div>

      {/* Vista resumen */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-md font-semibold mb-3">📋 Resumen Semanal</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {diasSemana.map(dia => (
            <div key={dia.key} className="flex justify-between items-center p-2 bg-white rounded">
              <span className="font-medium">{dia.emoji} {dia.label}:</span>
              <span className={`text-sm ${horarios[dia.key].abierto ? 'text-green-600' : 'text-red-600'}`}>
                {obtenerResumenHorario(horarios[dia.key])}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Configuración detallada por día */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold">⚙️ Configuración Detallada</h4>
        
        {diasSemana.map(dia => (
          <div key={dia.key} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold text-gray-800">
                {dia.emoji} {dia.label}
              </h5>
              
              {/* Botones de copia */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Copiar a:</span>
                {diasSemana.filter(d => d.key !== dia.key).map(diaDestino => (
                  <button
                    key={diaDestino.key}
                    onClick={() => copiarHorario(dia.key)(diaDestino.key)}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                    title={`Copiar horario a ${diaDestino.label}`}
                  >
                    {diaDestino.label.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Estado abierto/cerrado */}
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={horarios[dia.key].abierto}
                    onChange={(e) => handleDiaChange(dia.key, 'abierto', e.target.checked)}
                    className="mr-2"
                  />
                  <span className={`font-medium ${horarios[dia.key].abierto ? 'text-green-600' : 'text-red-600'}`}>
                    {horarios[dia.key].abierto ? '✅ Abierto' : '❌ Cerrado'}
                  </span>
                </label>
              </div>

              {horarios[dia.key].abierto && (
                <>
                  {/* Horario de apertura */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      🌅 Apertura
                    </label>
                    <input
                      type="time"
                      value={horarios[dia.key].apertura}
                      onChange={(e) => handleDiaChange(dia.key, 'apertura', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Horario de cierre */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      🌆 Cierre
                    </label>
                    <input
                      type="time"
                      value={horarios[dia.key].cierre}
                      onChange={(e) => handleDiaChange(dia.key, 'cierre', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Turno continuo */}
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={horarios[dia.key].turno_continuo}
                        onChange={(e) => handleDiaChange(dia.key, 'turno_continuo', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">⏰ Turno continuo</span>
                    </label>
                  </div>
                </>
              )}
            </div>

            {/* Horario de descanso (solo si no es turno continuo) */}
            {horarios[dia.key].abierto && !horarios[dia.key].turno_continuo && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">🍽️ Horario de Descanso</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Inicio descanso
                    </label>
                    <input
                      type="time"
                      value={horarios[dia.key].descanso_inicio}
                      onChange={(e) => handleDiaChange(dia.key, 'descanso_inicio', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Fin descanso
                    </label>
                    <input
                      type="time"
                      value={horarios[dia.key].descanso_fin}
                      onChange={(e) => handleDiaChange(dia.key, 'descanso_fin', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleGuardar}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar Horarios'}
        </button>
      </div>
    </div>
  );
}
