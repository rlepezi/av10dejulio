import React, { useState } from 'react';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { collection, addDoc, updateDoc, doc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

const AgentesCampo = () => {
  const { user, rol } = useAuth();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [agenteSeleccionado, setAgenteSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    zona: '',
    activo: true
  });

  // Obtener agentes
  const { data: agentes, loading: loadingAgentes } = useFirestoreCollection('agentes', {
    orderBy: ['fechaCreacion', 'desc']
  });

  // Obtener empresas asignadas a agentes
  const { data: empresasAsignadas } = useFirestoreCollection('empresas', {
    where: ['agenteAsignado', '!=', null]
  });

  const zonas = [
    'AV10_JULIO_NORTE',
    'AV10_JULIO_SUR', 
    'AV10_JULIO_CENTRO',
    'MATTA_ORIENTE',
    'MATTA_PONIENTE',
    'SANTA_ISABEL_NORTE',
    'SANTA_ISABEL_SUR',
    'VICUNA_MACKENNA_NORTE',
    'VICUNA_MACKENNA_SUR',
    'AUTOPISTA_CENTRAL'
  ];

  const crearAgente = async (e) => {
    e.preventDefault();
    try {
      // Crear agente en la colección agentes
      const agenteDoc = await addDoc(collection(db, 'agentes'), {
        ...formData,
        fechaCreacion: new Date(),
        empresasAsignadas: 0,
        visitasRealizadas: 0,
        empresasActivadas: 0
      });

      // Crear usuario con rol "agente" en la colección usuarios
      // Esto permite que el agente pueda hacer login
      await addDoc(collection(db, 'usuarios'), {
        email: formData.email,
        nombre: formData.nombre,
        rol: 'agente',
        agenteId: agenteDoc.id,
        telefono: formData.telefono,
        zona: formData.zona,
        activo: formData.activo,
        fechaCreacion: new Date(),
        creadoPorAdmin: true
      });
      
      setFormData({ nombre: '', email: '', telefono: '', zona: '', activo: true });
      setMostrarFormulario(false);
      alert('Agente creado exitosamente. El agente podrá hacer login con su email.');
    } catch (error) {
      console.error('Error creando agente:', error);
      alert('Error al crear agente: ' + error.message);
    }
  };

  const asignarEmpresasAutomaticamente = async (agenteId, zona) => {
    try {
      // Buscar empresas sin agente en la zona
      const empresasSinAgente = await getDocs(query(
        collection(db, 'empresas'),
        where('agenteAsignado', '==', null),
        where('zona', '==', 'AV10_JULIO'), // Todas están en AV10_JULIO por el catastro
        where('estado', 'in', ['Enviada', 'En Revisión'])
      ));

      if (empresasSinAgente.docs.length === 0) {
        alert('No hay empresas disponibles para asignar en esta zona');
        return;
      }

      const batch = writeBatch(db);
      
      empresasSinAgente.docs.forEach(empresaDoc => {
        batch.update(empresaDoc.ref, {
          agenteAsignado: agenteId,
          fechaAsignacion: new Date()
        });
      });

      await batch.commit();
      
      // Actualizar contador del agente
      await updateDoc(doc(db, 'agentes', agenteId), {
        empresasAsignadas: empresasSinAgente.docs.length
      });

      alert(`${empresasSinAgente.docs.length} empresas asignadas al agente`);
    } catch (error) {
      console.error('Error asignando empresas:', error);
      alert('Error al asignar empresas');
    }
  };

  const AgenteCard = ({ agente }) => {
    const empresasDelAgente = empresasAsignadas?.filter(e => e.agenteAsignado === agente.id) || [];
    const visitasRealizadas = empresasDelAgente.filter(e => e.visitaAgente).length;
    const empresasActivadas = empresasDelAgente.filter(e => e.estado === 'Activa').length;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{agente.nombre}</h3>
            <p className="text-sm text-gray-600">{agente.email}</p>
            <p className="text-sm text-gray-600">{agente.telefono}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            agente.activo 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {agente.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        <div className="mb-4">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            Zona: {agente.zona?.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Métricas del agente */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">
              {empresasDelAgente.length}
            </div>
            <div className="text-xs text-gray-600">Asignadas</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">
              {visitasRealizadas}
            </div>
            <div className="text-xs text-gray-600">Visitadas</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">
              {empresasActivadas}
            </div>
            <div className="text-xs text-gray-600">Activadas</div>
          </div>
        </div>

        {/* Progreso */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progreso de visitas</span>
            <span>{empresasDelAgente.length > 0 ? Math.round((visitasRealizadas / empresasDelAgente.length) * 100) : 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full"
              style={{ 
                width: `${empresasDelAgente.length > 0 ? (visitasRealizadas / empresasDelAgente.length) * 100 : 0}%` 
              }}
            ></div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAgenteSeleccionado(agente)}
            className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
          >
            👁️ Ver empresas
          </button>
          <button
            onClick={() => asignarEmpresasAutomaticamente(agente.id, agente.zona)}
            className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
          >
            📋 Asignar empresas
          </button>
          <button className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200">
            📊 Ver reportes
          </button>
        </div>
      </div>
    );
  };

  if (rol !== 'admin') {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Solo administradores pueden acceder a la gestión de agentes</p>
        <p className="text-gray-500 mt-2">Tu rol actual: {rol || 'Sin rol'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                👥 Gestión de Agentes de Campo
              </h1>
              <p className="text-gray-600 mt-2">
                Administración de agentes y asignación de territorios AV10 de Julio
              </p>
            </div>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              ➕ Nuevo Agente
            </button>
          </div>
        </div>

        {/* Estadísticas generales */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {agentes?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Agentes Totales</div>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {agentes?.filter(a => a.activo).length || 0}
              </div>
              <div className="text-sm text-gray-600">Agentes Activos</div>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {empresasAsignadas?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Empresas Asignadas</div>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">
                {empresasAsignadas?.filter(e => e.visitaAgente).length || 0}
              </div>
              <div className="text-sm text-gray-600">Visitas Realizadas</div>
            </div>
          </div>
        </div>

        {/* Lista de agentes */}
        <div className="p-6">
          {loadingAgentes ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando agentes...</p>
            </div>
          ) : agentes?.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {agentes.map(agente => (
                <AgenteCard key={agente.id} agente={agente} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay agentes registrados
            </div>
          )}
        </div>
      </div>

      {/* Formulario de nuevo agente */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <form onSubmit={crearAgente} className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Nuevo Agente de Campo
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zona asignada
                  </label>
                  <select
                    required
                    value={formData.zona}
                    onChange={(e) => setFormData({...formData, zona: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Seleccionar zona</option>
                    {zonas.map(zona => (
                      <option key={zona} value={zona}>{zona.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Crear Agente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de empresas del agente */}
      {agenteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Empresas - {agenteSeleccionado.nombre}
                </h2>
                <button
                  onClick={() => setAgenteSeleccionado(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {/* Lista de empresas asignadas */}
              <div className="space-y-3">
                {empresasAsignadas
                  ?.filter(e => e.agenteAsignado === agenteSeleccionado.id)
                  .map(empresa => (
                    <div key={empresa.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{empresa.nombre}</h3>
                          <p className="text-sm text-gray-600">{empresa.direccion}</p>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            empresa.visitaAgente 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {empresa.visitaAgente ? '✅ Visitada' : '⏰ Pendiente'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            empresa.estado === 'Activa' ? 'bg-green-100 text-green-800' :
                            empresa.estado === 'En Revisión' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {empresa.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentesCampo;
