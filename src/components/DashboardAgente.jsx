import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import DashboardLayout from './DashboardLayout';
import NotificationManager from './NotificationManager';
import pushNotificationService from '../services/PushNotificationService';
import { ESTADOS_EMPRESA, obtenerDescripcionEstado, puedeTransicionar } from '../utils/empresaStandards';
import { useImageUrl } from '../hooks/useImageUrl';

export default function DashboardAgente() {
  const { user, rol } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [agente, setAgente] = useState(null);
  const [empresasAsignadas, setEmpresasAsignadas] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [visitaForm, setVisitaForm] = useState({
    observaciones: '',
    estado_validacion: ESTADOS_EMPRESA.PENDIENTE_VALIDACION,
    ubicacion_verificada: false,
    documentos_validados: false,
    establecimiento_operativo: false,
    fotos_subidas: []
  });
  const [showValidationForm, setShowValidationForm] = useState(false);
  const [submittingValidation, setSubmittingValidation] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  // ✅ Debug logs
  console.log('🔍 DashboardAgente - User:', user?.email, 'Rol:', rol);

  useEffect(() => {
    if (user && rol === 'agente') {
      loadAgenteData();
    } else if (user && rol !== 'agente') {
      setLoading(false);
    }
  }, [user, rol]);

  const loadAgenteData = async () => {
    try {
      console.log('🔍 DashboardAgente - loadAgenteData started');
      setLoading(true);
      
      // Buscar información del agente por email o uid
      const agenteQuery = query(
        collection(db, 'agentes'),
        where('email', '==', user.email)
      );
      console.log('🔍 DashboardAgente - Querying agentes with email:', user.email);
      const agenteSnapshot = await getDocs(agenteQuery);
      
      console.log('🔍 DashboardAgente - Agente snapshot size:', agenteSnapshot.size);
      
      if (!agenteSnapshot.empty) {
        const agenteData = { id: agenteSnapshot.docs[0].id, ...agenteSnapshot.docs[0].data() };
        console.log('🔍 DashboardAgente - Agente data found:', agenteData);
        setAgente(agenteData);
        
        // Cargar empresas asignadas
        await loadEmpresasAsignadas(agenteData.id);
      } else {
        console.log('🔍 DashboardAgente - No agente found for email:', user.email);
        pushNotificationService.showInAppNotification({
          title: '⚠️ Agente No Encontrado',
          body: 'No se encontró información de agente para tu cuenta. Contacta al administrador.',
          icon: '/logo192.png'
        });
      }
    } catch (error) {
      console.error('❌ DashboardAgente - Error loading agente data:', error);
      pushNotificationService.showInAppNotification({
        title: '❌ Error Cargando Datos',
        body: 'No se pudieron cargar los datos del agente',
        icon: '/logo192.png'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmpresasAsignadas = async (agenteId) => {
    try {
      console.log('🔍 DashboardAgente - loadEmpresasAsignadas started for agenteId:', agenteId);
      setLoadingEmpresas(true);
      const empresasQuery = query(
        collection(db, 'empresas'),
        where('agenteAsignado', '==', agenteId)
      );
      const empresasSnapshot = await getDocs(empresasQuery);
      
      console.log('🔍 DashboardAgente - Empresas snapshot size:', empresasSnapshot.size);
      
      const empresas = empresasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('🔍 DashboardAgente - Empresas loaded:', empresas);
      setEmpresasAsignadas(empresas);
    } catch (error) {
      console.error('❌ DashboardAgente - Error loading empresas asignadas:', error);
      pushNotificationService.showInAppNotification({
        title: '❌ Error Cargando Empresas',
        body: 'No se pudieron cargar las empresas asignadas',
        icon: '/logo192.png'
      });
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const handleSubmitValidation = async (e) => {
    e.preventDefault();
    
    if (!selectedEmpresa) return;
    
    // ✅ Validación de permisos para activar empresas
    if (visitaForm.estado_validacion === ESTADOS_EMPRESA.ACTIVA && 
        (!agente.permisos || !agente.permisos.activar_empresas)) {
      pushNotificationService.showInAppNotification({
        title: '⚠️ Permisos Insuficientes',
        body: 'No tienes permisos para activar empresas. Contacta al administrador.',
        icon: '/logo192.png'
      });
      return;
    }
    
    setSubmittingValidation(true);
    
    try {
      const updateData = {
        estado: visitaForm.estado_validacion, // ✅ Campo correcto
        validacion_agente: {
          agente_id: agente.id,
          agente_nombre: agente.nombre,
          fecha_visita: serverTimestamp(),
          observaciones: visitaForm.observaciones,
          ubicacion_verificada: visitaForm.ubicacion_verificada,
          documentos_validados: visitaForm.documentos_validados,
          establecimiento_operativo: visitaForm.establecimiento_operativo,
          fotos_subidas: visitaForm.fotos_subidas
        },
        fecha_ultima_validacion: serverTimestamp()
      };

      // Si se activa la empresa y se marca como validada
      if (visitaForm.estado_validacion === ESTADOS_EMPRESA.ACTIVA) {
        updateData.validada = true;
        updateData.fecha_validacion = serverTimestamp();
      }

      await updateDoc(doc(db, 'empresas', selectedEmpresa.id), updateData);

      // Crear registro de visita
      await addDoc(collection(db, 'visitas_campo'), {
        empresa_id: selectedEmpresa.id,
        empresa_nombre: selectedEmpresa.nombre,
        agente_id: agente.id,
        agente_nombre: agente.nombre,
        fecha_visita: serverTimestamp(),
        estado_validacion: visitaForm.estado_validacion,
        observaciones: visitaForm.observaciones,
        ubicacion_verificada: visitaForm.ubicacion_verificada,
        documentos_validados: visitaForm.documentos_validados,
        establecimiento_operativo: visitaForm.establecimiento_operativo,
        fotos_subidas: visitaForm.fotos_subidas
      });

      pushNotificationService.showInAppNotification({
        title: '✅ Validación Completada',
        body: `Empresa ${selectedEmpresa.nombre} validada exitosamente`,
        icon: '/logo192.png'
      });

      // Recargar empresas
      await loadEmpresasAsignadas(agente.id);
      setShowValidationForm(false);
      setSelectedEmpresa(null);
      setVisitaForm({
        observaciones: '',
        estado_validacion: ESTADOS_EMPRESA.PENDIENTE_VALIDACION,
        ubicacion_verificada: false,
        documentos_validados: false,
        establecimiento_operativo: false,
        fotos_subidas: []
      });
    } catch (error) {
      console.error('Error submitting validation:', error);
      pushNotificationService.showInAppNotification({
        title: '❌ Error en Validación',
        body: 'No se pudo completar la validación. Intenta nuevamente.',
        icon: '/logo192.png'
      });
    } finally {
      setSubmittingValidation(false);
    }
  };

  if (loading) {
    console.log('🔍 DashboardAgente - Rendering loading state');
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (rol !== 'agente') {
    console.log('🔍 DashboardAgente - Rendering access denied, rol:', rol);
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600">Solo agentes de campo pueden acceder a esta sección.</p>
        </div>
      </DashboardLayout>
    );
  }

  console.log('🔍 DashboardAgente - Rendering main dashboard, agente:', agente);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header del Agente */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Panel de Agente de Campo
              </h1>
              <p className="text-gray-600 mt-1">
                {agente?.nombre} - Zona: {agente?.zona}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Última actividad</div>
              <div className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Empresas Asignadas</p>
                <p className="text-2xl font-bold text-gray-900">{empresasAsignadas.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Validadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {empresasAsignadas.filter(e => e.estado === ESTADOS_EMPRESA.VALIDADA).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {empresasAsignadas.filter(e => e.estado === ESTADOS_EMPRESA.PENDIENTE_VALIDACION).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Empresas Asignadas */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Empresas Asignadas</h2>
                <p className="text-sm text-gray-600">Gestiona las validaciones de campo</p>
              </div>
              <button
                onClick={() => navigate('/agente/nueva-empresa')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                + Registrar Nueva Empresa
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingEmpresas ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin h-6 w-6 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Cargando empresas...
                      </div>
                    </td>
                  </tr>
                ) : empresasAsignadas.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className="text-center">
                        <div className="text-gray-400 mb-4">
                          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <p className="text-gray-500 mb-4">No tienes empresas asignadas actualmente.</p>
                        <button
                          onClick={() => navigate('/agente/nueva-empresa')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Registrar Primera Empresa
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  empresasAsignadas.map((empresa) => (
                    <tr key={empresa.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <LogoDisplay logo={empresa.logo_url || empresa.logo} nombre={empresa.nombre} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{empresa.nombre}</div>
                            <div className="text-sm text-gray-500">{empresa.tipo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          empresa.estado === ESTADOS_EMPRESA.ACTIVA 
                            ? 'bg-green-100 text-green-800' 
                            : empresa.estado === ESTADOS_EMPRESA.PENDIENTE_VALIDACION
                            ? 'bg-yellow-100 text-yellow-800'
                            : empresa.estado === ESTADOS_EMPRESA.VALIDADA
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {empresa.estado === ESTADOS_EMPRESA.ACTIVA ? 'Activa' : 
                           empresa.estado === ESTADOS_EMPRESA.PENDIENTE_VALIDACION ? 'Pendiente' : 
                           empresa.estado === ESTADOS_EMPRESA.VALIDADA ? 'Validada' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {empresa.direccion || 'No especificada'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {empresa.telefono || 'No especificado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/agente/empresa/${empresa.id}`)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Ver Detalle
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEmpresa(empresa);
                              setShowValidationForm(true);
                            }}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Validar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Validación */}
        {showValidationForm && selectedEmpresa && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Validar Empresa: {selectedEmpresa.nombre}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowValidationForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Información de la Empresa */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Información de la Empresa</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Nombre:</span> {selectedEmpresa.nombre}
                    </div>
                    <div>
                      <span className="font-medium">Tipo:</span> {selectedEmpresa.tipo}
                    </div>
                    <div>
                      <span className="font-medium">Dirección:</span> {selectedEmpresa.direccion || 'No especificada'}
                    </div>
                    <div>
                      <span className="font-medium">Teléfono:</span> {selectedEmpresa.telefono || 'No especificado'}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmitValidation} className="space-y-6">
                  {/* Estado de Validación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado de Validación
                    </label>
                    <select
                      value={visitaForm.estado_validacion}
                      onChange={(e) => setVisitaForm({...visitaForm, estado_validacion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={ESTADOS_EMPRESA.PENDIENTE_VALIDACION}>Pendiente de Validación</option>
                      <option value={ESTADOS_EMPRESA.EN_VISITA}>En Visita</option>
                      <option value={ESTADOS_EMPRESA.VALIDADA}>Validada</option>
                      <option value={ESTADOS_EMPRESA.ACTIVA}>Activa</option>
                      <option value={ESTADOS_EMPRESA.RECHAZADA}>Rechazada</option>
                    </select>
                  </div>

                  {/* Checklist de Validación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Checklist de Validación
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={visitaForm.ubicacion_verificada}
                          onChange={(e) => setVisitaForm({...visitaForm, ubicacion_verificada: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Ubicación verificada</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={visitaForm.documentos_validados}
                          onChange={(e) => setVisitaForm({...visitaForm, documentos_validados: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Documentos validados</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={visitaForm.establecimiento_operativo}
                          onChange={(e) => setVisitaForm({...visitaForm, establecimiento_operativo: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Establecimiento operativo</span>
                      </label>
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones
                    </label>
                    <textarea
                      value={visitaForm.observaciones}
                      onChange={(e) => setVisitaForm({...visitaForm, observaciones: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe los detalles de la visita y validación..."
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowValidationForm(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingValidation}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      {submittingValidation ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando...
                        </div>
                      ) : (
                        'Guardar Validación'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Componente para mostrar logo con manejo de URLs de Firebase Storage
function LogoDisplay({ logo, nombre }) {
  const { imageUrl, loading, error } = useImageUrl(logo);

  if (!logo) {
    return (
      <img 
        className="h-10 w-10 rounded-full object-cover bg-gray-200" 
        src="/images/no-image-placeholder.png" 
        alt={nombre}
      />
    );
  }

  if (loading) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
        <span className="text-xs text-gray-500">!</span>
      </div>
    );
  }

  return (
    <img 
      className="h-10 w-10 rounded-full object-cover" 
      src={imageUrl} 
      alt={nombre}
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
      }}
    />
  );
}

