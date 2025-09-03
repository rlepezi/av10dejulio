import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { collection, addDoc, updateDoc, doc, getDoc, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import HeaderMenu from '../components/HeaderMenu';

export default function RegistroEmpresaReciclaje() {
  const navigate = useNavigate();
  const { user, rol } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingEmpresa, setLoadingEmpresa] = useState(true);
  const [empresaExistente, setEmpresaExistente] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    descripcion: '',
    categorias: ['reciclaje'],
    serviciosReciclaje: [],
    zonaServicio: [],
    horarios: {
      lunes: { abierto: false, inicio: '09:00', fin: '18:00' },
      martes: { abierto: false, inicio: '09:00', fin: '18:00' },
      miercoles: { abierto: false, inicio: '09:00', fin: '18:00' },
      jueves: { abierto: false, inicio: '09:00', fin: '18:00' },
      viernes: { abierto: false, inicio: '09:00', fin: '18:00' },
      sabado: { abierto: false, inicio: '09:00', fin: '18:00' },
      domingo: { abierto: false, inicio: '09:00', fin: '18:00' }
    },
    condiciones: {
      aceiteGratis: false,
      bateriasGratis: false,
      neumaticosGratis: false,
      otrosGratis: false
    },
    certificaciones: [],
         estado: 'activa'
  });

  const serviciosDisponibles = [
    { id: 'aceite_motor', nombre: 'Aceite de Motor', icono: '🛢️' },
    { id: 'aceite_transmision', nombre: 'Aceite de Transmisión', icono: '⚙️' },
    { id: 'baterias', nombre: 'Baterías', icono: '🔋' },
    { id: 'neumaticos', nombre: 'Neumáticos', icono: '🛞' },
    { id: 'filtros', nombre: 'Filtros', icono: '🧽' },
    { id: 'liquidos_frenos', nombre: 'Líquido de Frenos', icono: '💧' },
    { id: 'liquidos_refrigerante', nombre: 'Refrigerante', icono: '❄️' },
    { id: 'aceite_direccion', nombre: 'Aceite de Dirección', icono: '🎯' },
    { id: 'aceite_diferencial', nombre: 'Aceite Diferencial', icono: '🔧' },
    { id: 'metales', nombre: 'Metales (Aluminio, Hierro)', icono: '🏗️' },
    { id: 'plasticos', nombre: 'Plásticos', icono: '🥤' },
    { id: 'vidrio', nombre: 'Vidrio', icono: '🥃' },
    { id: 'papel_carton', nombre: 'Papel y Cartón', icono: '📦' }
  ];

  const zonasServicio = [
    'Centro', 'Norte', 'Sur', 'Este', 'Oeste',
    'Zona Industrial', 'Zona Comercial', 'Zona Residencial'
  ];

  const certificacionesDisponibles = [
    'ISO 14001 - Gestión Ambiental',
    'Certificación de Reciclaje',
    'Licencia Ambiental',
    'Certificación de Calidad',
    'Normas de Seguridad Industrial'
  ];

  useEffect(() => {
    if (user && (rol === 'empresa' || rol === 'proveedor')) {
      cargarEmpresaExistente();
    }
  }, [user, rol]);

  const cargarEmpresaExistente = async () => {
    try {
      setLoadingEmpresa(true);
      console.log('🔍 Iniciando búsqueda de empresa...');
      console.log('Usuario UID:', user.uid);
      console.log('Usuario Email:', user.email);
      console.log('Usuario Rol:', rol);
      
      // Buscar en múltiples colecciones y por diferentes criterios
      let empresaEncontrada = null;
      
             // 1. Buscar por user.uid en la colección empresas
       console.log('1️⃣ Buscando por UID en colección empresas...');
       try {
         const empresaDoc = await getDoc(doc(db, 'empresas', user.uid));
         if (empresaDoc.exists()) {
           console.log('✅ Empresa encontrada por UID:', empresaDoc.data());
           empresaEncontrada = empresaDoc.data();
         } else {
           console.log('❌ No se encontró empresa por UID');
         }
       } catch (error) {
         console.log('❌ Error buscando por UID:', error);
       }
       
       // 1.5. Si no se encontró, buscar por empresaId en usuarios
       if (!empresaEncontrada) {
         console.log('1.5️⃣ Buscando por empresaId en colección usuarios...');
         try {
           const usuariosQuery = query(
             collection(db, 'usuarios'),
             where('email', '==', user.email)
           );
           const usuariosSnapshot = await getDocs(usuariosQuery);
           
           if (!usuariosSnapshot.empty) {
             const usuarioData = usuariosSnapshot.docs[0].data();
             console.log('✅ Usuario encontrado:', usuarioData);
             
             // Si el usuario tiene empresaId, buscar esa empresa
             if (usuarioData.empresaId) {
               console.log('🎯 Usuario tiene empresaId:', usuarioData.empresaId);
               try {
                 const empresaDoc = await getDoc(doc(db, 'empresas', usuarioData.empresaId));
                 if (empresaDoc.exists()) {
                   console.log('✅ Empresa encontrada por empresaId:', empresaDoc.data());
                   empresaEncontrada = {
                     ...empresaDoc.data(),
                     id: usuarioData.empresaId // Guardar el ID de la empresa para actualizaciones
                   };
                 } else {
                   console.log('❌ No se encontró empresa por empresaId');
                 }
               } catch (error) {
                 console.log('❌ Error buscando empresa por empresaId:', error);
               }
             }
           }
         } catch (error) {
           console.log('❌ Error buscando usuario por email:', error);
         }
       }
      
      // 2. Si no se encontró, buscar por email en empresas
      if (!empresaEncontrada) {
        console.log('2️⃣ Buscando por email en colección empresas...');
        try {
          const empresasQuery = query(
            collection(db, 'empresas'),
            where('emailEmpresa', '==', user.email)
          );
          const empresasSnapshot = await getDocs(empresasQuery);
          
          if (!empresasSnapshot.empty) {
            console.log('✅ Empresa encontrada por email:', empresasSnapshot.docs[0].data());
            empresaEncontrada = empresasSnapshot.docs[0].data();
          } else {
            console.log('❌ No se encontró empresa por email');
          }
        } catch (error) {
          console.log('❌ Error buscando por email:', error);
        }
      }
      
             // 3. Si no se encontró, buscar por email en usuarios
       if (!empresaEncontrada) {
         console.log('3️⃣ Buscando por email en colección usuarios...');
         try {
           const usuariosQuery = query(
             collection(db, 'usuarios'),
             where('email', '==', user.email)
           );
           const usuariosSnapshot = await getDocs(usuariosQuery);
           
           if (!usuariosSnapshot.empty) {
             const usuarioData = usuariosSnapshot.docs[0].data();
             console.log('✅ Usuario encontrado:', usuarioData);
             
             // Si el usuario tiene campo empresa, usar esos datos
             if (usuarioData.empresa) {
               console.log('🎯 Usuario tiene datos de empresa:', usuarioData.empresa);
               console.log('📊 Datos extraídos:', {
                 nombre: usuarioData.empresa.nombre,
                 telefono: usuarioData.empresa.telefono,
                 direccion: usuarioData.empresa.direccion,
                 descripcion: usuarioData.empresa.descripcion
               });
               
               empresaEncontrada = {
                 nombre: usuarioData.empresa.nombre || usuarioData.nombre || 'Mi Empresa',
                 email: usuarioData.email,
                 telefono: usuarioData.empresa.telefono || '',
                 direccion: usuarioData.empresa.direccion || '',
                 descripcion: usuarioData.empresa.descripcion || '',
                 categorias: ['reciclaje'],
                 serviciosReciclaje: [],
                 zonaServicio: [],
                 horarios: formData.horarios,
                 condiciones: formData.condiciones,
                 certificaciones: [],
                 estado: usuarioData.estado || 'activa',
                 uid: usuarioData.id // Guardar el ID del documento usuario
               };
             } else if (usuarioData.rol === 'empresa' || usuarioData.rol === 'proveedor') {
               console.log('🎯 Usuario es empresa/proveedor, creando perfil básico...');
               empresaEncontrada = {
                 nombre: usuarioData.nombre || 'Mi Empresa',
                 email: usuarioData.email,
                 telefono: usuarioData.telefono || '',
                 direccion: usuarioData.direccion || '',
                 descripcion: usuarioData.descripcion || '',
                 categorias: ['reciclaje'],
                 serviciosReciclaje: [],
                 zonaServicio: [],
                 horarios: formData.horarios,
                 condiciones: formData.condiciones,
                 certificaciones: [],
                 estado: 'activa',
                 uid: usuarioData.id
               };
             }
           } else {
             console.log('❌ No se encontró usuario por email');
           }
         } catch (error) {
           console.log('❌ Error buscando usuario:', error);
         }
       }
      
      // 4. Procesar resultado
      if (empresaEncontrada) {
        console.log('🎉 Empresa encontrada/creada:', empresaEncontrada);
        setEmpresaExistente(empresaEncontrada);
        
        // Pre-llenar el formulario
        setFormData(prev => ({
          ...prev,
          nombre: empresaEncontrada.nombre || '',
          direccion: empresaEncontrada.direccion || '',
          telefono: empresaEncontrada.telefono || '',
          email: empresaEncontrada.email || '',
          descripcion: empresaEncontrada.descripcion || '',
          serviciosReciclaje: empresaEncontrada.serviciosReciclaje || [],
          zonaServicio: empresaEncontrada.zonaServicio || [],
          horarios: empresaEncontrada.horarios || prev.horarios,
          condiciones: empresaEncontrada.condiciones || prev.condiciones,
          certificaciones: empresaEncontrada.certificaciones || []
        }));
      } else {
        console.log('❌ No se encontró ninguna empresa para este usuario');
        setEmpresaExistente(null);
      }
      
    } catch (error) {
      console.error('💥 Error general cargando empresa:', error);
      setEmpresaExistente(null);
    } finally {
      setLoadingEmpresa(false);
      console.log('🏁 Finalizada búsqueda de empresa');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServicioChange = (servicioId) => {
    setFormData(prev => ({
      ...prev,
      serviciosReciclaje: prev.serviciosReciclaje.includes(servicioId)
        ? prev.serviciosReciclaje.filter(id => id !== servicioId)
        : [...prev.serviciosReciclaje, servicioId]
    }));
  };

  const handleZonaChange = (zona) => {
    setFormData(prev => ({
      ...prev,
      zonaServicio: prev.zonaServicio.includes(zona)
        ? prev.zonaServicio.filter(z => z !== zona)
        : [...prev.zonaServicio, zona]
    }));
  };

  const handleCertificacionChange = (certificacion) => {
    setFormData(prev => ({
      ...prev,
      certificaciones: prev.certificaciones.includes(certificacion)
        ? prev.certificaciones.filter(c => c !== certificacion)
        : [...prev.certificaciones, certificacion]
    }));
  };

  const handleHorarioChange = (dia, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [dia]: {
          ...prev.horarios[dia],
          [campo]: valor
        }
      }
    }));
  };

  const handleCondicionChange = (condicion) => {
    setFormData(prev => ({
      ...prev,
      condiciones: {
        ...prev.condiciones,
        [condicion]: !prev.condiciones[condicion]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Solo validar campos básicos si es una empresa nueva
    if (!empresaExistente) {
      if (!formData.nombre || !formData.direccion || !formData.telefono) {
        alert('Por favor completa los campos obligatorios');
        return;
      }
    }

    if (formData.serviciosReciclaje.length === 0) {
      alert('Debes seleccionar al menos un servicio de reciclaje');
      return;
    }

    try {
      setLoading(true);
      
             const empresaData = {
         ...formData,
         fechaActualizacion: new Date(),
         empresaId: empresaExistente?.uid || user.uid,
         emailEmpresa: user.email,
         estado: 'activa' // Asegurar que siempre esté activa
       };

       if (empresaExistente) {
         // Actualizar empresa existente - usar el ID correcto de la empresa
         const docId = empresaExistente.id || empresaExistente.uid || user.uid;
         await updateDoc(doc(db, 'empresas', docId), empresaData);
         alert('¡Empresa actualizada exitosamente como proveedora de reciclaje!');
       } else {
         // Crear nueva empresa
         const empresaDataNueva = {
           ...empresaData,
           fechaCreacion: new Date() // Agregar fecha de creación para ordenamiento
         };
         await addDoc(collection(db, 'empresas'), empresaDataNueva);
         alert('¡Empresa registrada exitosamente como proveedora de reciclaje!');
       }

      navigate('/dashboard/proveedor');
    } catch (error) {
      console.error('Error registrando empresa:', error);
      alert('Error al registrar la empresa. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || (rol !== 'empresa' && rol !== 'proveedor')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Restringido</h1>
          <p className="text-gray-600 mb-6">Solo las empresas y proveedores pueden registrarse como proveedores de reciclaje</p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <HeaderMenu />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <div className="text-center mb-8">
           <h1 className="text-4xl font-bold text-gray-900 mb-4">
             ♻️ {empresaExistente ? 'Actualizar Servicios de Reciclaje' : 'Registro de Proveedor de Reciclaje'}
           </h1>
           <p className="text-xl text-gray-600">
             {empresaExistente 
               ? 'Actualiza tus servicios de reciclaje y conecta con más clientes comprometidos con el medio ambiente'
               : 'Únete a la comunidad de reciclaje automotriz como empresa o proveedor y ayuda a crear un futuro más sostenible'
             }
           </p>
           
           {/* Estado de Detección */}
           <div className="mt-4 p-3 rounded-lg">
             {loadingEmpresa ? (
               <span className="text-blue-600">🔄 Verificando empresa...</span>
             ) : empresaExistente ? (
               <span className="text-green-600">✅ Empresa detectada: {empresaExistente.nombre}</span>
             ) : (
               <span className="text-orange-600">⚠️ No se detectó empresa existente</span>
             )}
           </div>
         </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
                     {loadingEmpresa ? (
             <div className="text-center py-12">
               <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
               <p className="text-lg text-gray-600">Verificando información de tu empresa...</p>
               <button
                 onClick={cargarEmpresaExistente}
                 className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
               >
                 🔍 Forzar Búsqueda
               </button>
             </div>
           ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Información Básica - Solo para empresas nuevas */}
              {!empresaExistente && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Información Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción de la Empresa
                    </label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Describe tu empresa y experiencia en reciclaje..."
                    />
                  </div>
                </div>
              </div>
            )}

                         {/* Resumen de Empresa Existente */}
             {empresaExistente && (
               <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                 <h3 className="text-lg font-semibold text-green-900 mb-4">✅ Empresa Detectada Automáticamente</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <p className="text-sm font-medium text-green-700">Nombre:</p>
                     <p className="text-green-900 font-semibold">{empresaExistente.nombre}</p>
                   </div>
                   <div>
                     <p className="text-sm font-medium text-green-700">Teléfono:</p>
                     <p className="text-green-900 font-semibold">{empresaExistente.telefono}</p>
                   </div>
                   <div className="md:col-span-2">
                     <p className="text-sm font-medium text-green-700">Dirección:</p>
                     <p className="text-green-900 font-semibold">{empresaExistente.direccion}</p>
                   </div>
                   {empresaExistente.descripcion && (
                     <div className="md:col-span-2">
                       <p className="text-sm font-medium text-green-700">Descripción:</p>
                       <p className="text-green-900">{empresaExistente.descripcion}</p>
                     </div>
                   )}
                 </div>
                 <p className="text-green-700 text-sm mt-4">
                   🎯 <strong>¡Perfecto!</strong> Hemos detectado tu empresa automáticamente. Solo necesitas completar la información específica de reciclaje a continuación.
                 </p>
               </div>
             )}

            {/* Servicios de Reciclaje */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">♻️ Servicios de Reciclaje</h3>
              <p className="text-gray-600 mb-4">Selecciona los materiales que reciclas:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {serviciosDisponibles.map((servicio) => (
                  <label
                    key={servicio.id}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.serviciosReciclaje.includes(servicio.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.serviciosReciclaje.includes(servicio.id)}
                      onChange={() => handleServicioChange(servicio.id)}
                      className="mr-2 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-2xl mr-2">{servicio.icono}</span>
                    <span className="text-sm font-medium">{servicio.nombre}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Zona de Servicio */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">📍 Zona de Servicio</h3>
              <p className="text-gray-600 mb-4">Selecciona las zonas donde operas:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {zonasServicio.map((zona) => (
                  <label
                    key={zona}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.zonaServicio.includes(zona)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.zonaServicio.includes(zona)}
                      onChange={() => handleZonaChange(zona)}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">{zona}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Condiciones de Reciclaje */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">💰 Condiciones de Reciclaje</h3>
              <p className="text-gray-600 mb-4">Indica qué materiales reciclas gratis:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(formData.condiciones).map(([condicion, valor]) => (
                  <label
                    key={condicion}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      valor ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={valor}
                      onChange={() => handleCondicionChange(condicion)}
                      className="mr-2 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium">
                      {condicion === 'aceiteGratis' && 'Aceite Gratis'}
                      {condicion === 'bateriasGratis' && 'Baterías Gratis'}
                      {condicion === 'neumaticosGratis' && 'Neumáticos Gratis'}
                      {condicion === 'otrosGratis' && 'Otros Gratis'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Horarios de Atención */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">🕒 Horarios de Atención</h3>
              <div className="space-y-3">
                {Object.entries(formData.horarios).map(([dia, horario]) => (
                  <div key={dia} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={horario.abierto}
                        onChange={(e) => handleHorarioChange(dia, 'abierto', e.target.checked)}
                        className="mr-2 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm font-medium capitalize">{dia}</span>
                    </label>
                    
                    {horario.abierto && (
                      <>
                        <input
                          type="time"
                          value={horario.inicio}
                          onChange={(e) => handleHorarioChange(dia, 'inicio', e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm"
                        />
                        <span className="text-gray-500">a</span>
                        <input
                          type="time"
                          value={horario.fin}
                          onChange={(e) => handleHorarioChange(dia, 'fin', e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Certificaciones */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 Certificaciones</h3>
              <p className="text-gray-600 mb-4">Selecciona las certificaciones que posees:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {certificacionesDisponibles.map((certificacion) => (
                  <label
                    key={certificacion}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.certificaciones.includes(certificacion)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.certificaciones.includes(certificacion)}
                      onChange={() => handleCertificacionChange(certificacion)}
                      className="mr-2 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium">{certificacion}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : (empresaExistente ? 'Actualizar Servicios de Reciclaje' : 'Registrar como Proveedor')}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/dashboard/proveedor')}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
