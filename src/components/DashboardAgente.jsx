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

export default function DashboardAgente() {
  const { user, rol } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [agente, setAgente] = useState(null);
  const [empresasAsignadas, setEmpresasAsignadas] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [visitaForm, setVisitaForm] = useState({
    observaciones: '',
    estado_validacion: 'pendiente',
    ubicacion_verificada: false,
    documentos_validados: false,
    establecimiento_operativo: false,
    fotos_subidas: []
  });
  const [showValidationForm, setShowValidationForm] = useState(false);

  useEffect(() => {
    if (user && rol === 'agente') {
      loadAgenteData();
    }
  }, [user, rol]);

  const loadAgenteData = async () => {
    try {
      setLoading(true);
      
      // Buscar información del agente por email o uid
      const agenteQuery = query(
        collection(db, 'agentes'),
        where('email', '==', user.email)
      );
      const agenteSnapshot = await getDocs(agenteQuery);
      
      if (!agenteSnapshot.empty) {
        const agenteData = { id: agenteSnapshot.docs[0].id, ...agenteSnapshot.docs[0].data() };
        setAgente(agenteData);
        
        // Cargar empresas asignadas a este agente
        await loadEmpresasAsignadas(agenteData.id);
      } else {
        console.error('Agente no encontrado');
        // Si no existe como agente, redirigir
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error loading agente data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmpresasAsignadas = async (agenteId) => {
    try {
      const empresasQuery = query(
        collection(db, 'empresas'),
        where('agenteAsignado', '==', agenteId)
      );
      const empresasSnapshot = await getDocs(empresasQuery);
      
      const empresas = empresasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setEmpresasAsignadas(empresas);
    } catch (error) {
      console.error('Error loading empresas asignadas:', error);
    }
  };

  const handleValidarEmpresa = (empresa) => {
    setSelectedEmpresa(empresa);
    setShowValidationForm(true);
    setVisitaForm({
      observaciones: '',
      estado_validacion: empresa.estado || 'pendiente',
      ubicacion_verificada: false,
      documentos_validados: false,
      establecimiento_operativo: false,
      fotos_subidas: []
    });
  };

  const handleSubmitValidation = async (e) => {
    e.preventDefault();
    
    if (!selectedEmpresa) return;
    
    try {
      const updateData = {
        estado: visitaForm.estado_validacion,
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

      // Si se activa la empresa y se marca como validada completamente, agregar a la comunidad
      if (visitaForm.estado_validacion === 'activa' && 
          visitaForm.ubicacion_verificada && 
          visitaForm.documentos_validados && 
          visitaForm.establecimiento_operativo) {
        updateData.es_comunidad = true;
        updateData.tipo_empresa = 'comunidad';
        updateData.fecha_ingreso_comunidad = serverTimestamp();
        updateData.validado_por_agente = true;
      }

      // Actualizar estado de la empresa
      const empresaRef = doc(db, 'empresas', selectedEmpresa.id);
      await updateDoc(empresaRef, updateData);

      // Crear registro de visita
      await addDoc(collection(db, 'visitas_campo'), {
        agente_id: agente.id,
        agente_nombre: agente.nombre,
        empresa_id: selectedEmpresa.id,
        empresa_nombre: selectedEmpresa.nombre,
        fecha_visita: serverTimestamp(),
        resultado: visitaForm.estado_validacion,
        observaciones: visitaForm.observaciones,
        checklist: {
          ubicacion_verificada: visitaForm.ubicacion_verificada,
          documentos_validados: visitaForm.documentos_validados,
          establecimiento_operativo: visitaForm.establecimiento_operativo
        },
        fotos_adjuntas: visitaForm.fotos_subidas.length
      });

      // Actualizar estadísticas del agente
      const nuevoContador = (agente.visitasRealizadas || 0) + 1;
      const empresasActivadas = visitaForm.estado_validacion === 'activa' 
        ? (agente.empresasActivadas || 0) + 1 
        : (agente.empresasActivadas || 0);

      await updateDoc(doc(db, 'agentes', agente.id), {
        visitasRealizadas: nuevoContador,
        empresasActivadas: empresasActivadas,
        fecha_ultima_actividad: serverTimestamp()
      });

      alert('Validación guardada exitosamente');
      setShowValidationForm(false);
      setSelectedEmpresa(null);
      
      // Recargar datos
      loadAgenteData();
      
    } catch (error) {
      console.error('Error submitting validation:', error);
      alert('Error al guardar la validación');
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'activa':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactiva':
        return 'bg-red-100 text-red-800';
      case 'en_revision':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoPrioridad = (empresa) => {
    const diasAsignacion = empresa.fecha_asignacion_agente 
      ? Math.floor((new Date() - empresa.fecha_asignacion_agente.toDate()) / (1000 * 60 * 60 * 24))
      : 0;
    
    if (diasAsignacion > 7) return 'URGENTE';
    if (diasAsignacion > 3) return 'ALTA';
    return 'NORMAL';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (rol !== 'agente') {
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600">Solo agentes de campo pueden acceder a esta sección.</p>
        </div>
      </DashboardLayout>
    );
  }

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
                {agente?.fecha_ultima_actividad?.toDate()?.toLocaleDateString() || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas del Agente */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Empresas Asignadas</p>
                <p className="text-2xl font-semibold text-gray-900">{empresasAsignadas.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Visitas Realizadas</p>
                <p className="text-2xl font-semibold text-gray-900">{agente?.visitasRealizadas || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Empresas Activadas</p>
                <p className="text-2xl font-semibold text-gray-900">{agente?.empresasActivadas || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tasa de Éxito</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {agente?.visitasRealizadas > 0 
                    ? Math.round(((agente?.empresasActivadas || 0) / agente.visitasRealizadas) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gestión de Notificaciones */}
        <NotificationManager />

        {/* Lista de Empresas Asignadas */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Empresas Asignadas para Validación</h2>
            <p className="text-sm text-gray-600 mt-1">
              Empresas que requieren validación de campo en tu zona
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {empresasAsignadas.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No tienes empresas asignadas actualmente
                    </td>
                  </tr>
                ) : (
                  empresasAsignadas.map((empresa) => (
                    <tr key={empresa.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {empresa.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            RUT: {empresa.rut}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {empresa.direccion}
                        </div>
                        <div className="text-sm text-gray-500">
                          {empresa.ciudad}, {empresa.region}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(empresa.estado)}`}>
                          {empresa.estado || 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getEstadoPrioridad(empresa) === 'URGENTE' ? 'bg-red-100 text-red-800' :
                          getEstadoPrioridad(empresa) === 'ALTA' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getEstadoPrioridad(empresa)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleValidarEmpresa(empresa)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 mr-2"
                        >
                          Validar
                        </button>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(empresa.direccion + ', ' + empresa.ciudad)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Ver Mapa
                        </a>
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
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <form onSubmit={handleSubmitValidation} className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Validar Empresa: {selectedEmpresa.nombre}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowValidationForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
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
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Ubicación verificada (establecimiento existe en la dirección indicada)
                        </span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={visitaForm.documentos_validados}
                          onChange={(e) => setVisitaForm({...visitaForm, documentos_validados: e.target.checked})}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Documentos comerciales válidos (patente, permiso municipal, etc.)
                        </span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={visitaForm.establecimiento_operativo}
                          onChange={(e) => setVisitaForm({...visitaForm, establecimiento_operativo: e.target.checked})}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Establecimiento operativo (funcionando, con horarios activos)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Estado de Validación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado de la Empresa
                    </label>
                    <select
                      value={visitaForm.estado_validacion}
                      onChange={(e) => setVisitaForm({...visitaForm, estado_validacion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="activa">Aprobar y Activar</option>
                      <option value="inactiva">Rechazar</option>
                      <option value="en_revision">Necesita Revisión Adicional</option>
                    </select>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones de la Visita
                    </label>
                    <textarea
                      value={visitaForm.observaciones}
                      onChange={(e) => setVisitaForm({...visitaForm, observaciones: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe tu visita, condiciones del establecimiento, observaciones importantes..."
                      required
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowValidationForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Guardar Validación
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
