import React, { useState } from 'react';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { useEmpresaWorkflow } from '../hooks/useEmpresaWorkflow';
import { useAuth } from './AuthProvider';

const PanelValidacionAvanzado = () => {
  const { rol } = useAuth();
  const [filtroEstado, setFiltroEstado] = useState('Enviada');
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [validandoWeb, setValidandoWeb] = useState(false);

  const { 
    cambiarEstado, 
    validarWeb, 
    asignarLogo, 
    loading: workflowLoading 
  } = useEmpresaWorkflow();

  // Obtener empresas pendientes de validación
  const { data: empresasPendientes, loading } = useFirestoreCollection('empresas', {
    where: ['estado', '==', filtroEstado],
    orderBy: ['fechaCreacion', 'desc']
  });

  const validarSitioWeb = async (url) => {
    setValidandoWeb(true);
    try {
      // Simulación de validación web - en producción usar API real
      const response = await fetch(`https://httpbin.org/delay/1`);
      
      // Simulación de resultados
      const validacionWeb = {
        existe: true,
        respondiendo: response.ok,
        tiempoRespuesta: 1200,
        titulo: `Sitio web de empresa`,
        descripcion: 'Descripción del sitio',
        esComercial: true
      };
      
      return validacionWeb;
    } catch (error) {
      console.error('Error validando sitio web:', error);
      return { existe: false, error: error.message };
    } finally {
      setValidandoWeb(false);
    }
  };

  const buscarLogo = async (nombreEmpresa, sitioWeb) => {
    try {
      // Simulación de búsqueda de logo
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `https://via.placeholder.com/150x150?text=${encodeURIComponent(nombreEmpresa.substring(0, 2))}`;
    } catch (error) {
      console.error('Error buscando logo:', error);
      return null;
    }
  };

  const procesarEmpresa = async (empresa, accion) => {
    try {
      switch (accion) {
        case 'validar_web':
          if (empresa.web) {
            const validacionWeb = await validarSitioWeb(empresa.web);
            await validarWeb(empresa.id, validacionWeb);
          }
          break;

        case 'asignar_logo':
          const logoUrl = await buscarLogo(empresa.nombre, empresa.web);
          if (logoUrl) {
            await asignarLogo(empresa.id, logoUrl);
          }
          break;

        case 'activar':
          await cambiarEstado(empresa.id, 'Activa', 'Activación manual por administrador');
          break;

        case 'rechazar':
          const motivo = prompt('Motivo de rechazo:');
          if (motivo) {
            await cambiarEstado(empresa.id, 'Rechazada', motivo);
          }
          break;

        case 'revisar':
          await cambiarEstado(empresa.id, 'En Revisión', 'Marcada para revisión manual');
          break;
      }
      
      // Actualizar estado local
      setEmpresaSeleccionada(null);
      
    } catch (error) {
      console.error('Error procesando empresa:', error);
      alert('Error al procesar la empresa');
    }
  };

  const EmpresaCard = ({ empresa }) => (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{empresa.nombre}</h3>
          <p className="text-sm text-gray-600">{empresa.direccion}</p>
          <p className="text-xs text-gray-500">
            Zona: {empresa.zona} | Creado: {empresa.fechaCreacion?.toDate?.()?.toLocaleDateString() || 'N/A'}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          empresa.estado === 'Enviada' ? 'bg-yellow-100 text-yellow-800' :
          empresa.estado === 'En Revisión' ? 'bg-blue-100 text-blue-800' :
          empresa.estado === 'Activa' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {empresa.estado}
        </span>
      </div>

      {/* Indicadores de validación */}
      <div className="flex space-x-3 mb-3 text-xs">
        <span className={`flex items-center ${empresa.webValidada ? 'text-green-600' : 'text-gray-400'}`}>
          {empresa.webValidada ? '✅' : '❓'} Web
        </span>
        <span className={`flex items-center ${empresa.logoAsignado ? 'text-green-600' : 'text-gray-400'}`}>
          {empresa.logoAsignado ? '✅' : '❓'} Logo
        </span>
        <span className={`flex items-center ${empresa.visitaAgente ? 'text-green-600' : 'text-gray-400'}`}>
          {empresa.visitaAgente ? '✅' : '❓'} Visita
        </span>
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
        <div>📞 {empresa.telefono || 'No disponible'}</div>
        <div>✉️ {empresa.email || 'No disponible'}</div>
        <div>🌐 {empresa.web ? (
          <a href={empresa.web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {empresa.web.length > 30 ? empresa.web.substring(0, 30) + '...' : empresa.web}
          </a>
        ) : 'No disponible'}</div>
        <div>🏷️ {empresa.categoria || 'Sin categoría'}</div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setEmpresaSeleccionada(empresa)}
          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
        >
          👁️ Ver detalles
        </button>
        
        {!empresa.webValidada && empresa.web && (
          <button
            onClick={() => procesarEmpresa(empresa, 'validar_web')}
            disabled={validandoWeb || workflowLoading}
            className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 disabled:opacity-50"
          >
            🔍 Validar web
          </button>
        )}
        
        {!empresa.logoAsignado && (
          <button
            onClick={() => procesarEmpresa(empresa, 'asignar_logo')}
            disabled={workflowLoading}
            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 disabled:opacity-50"
          >
            🖼️ Buscar logo
          </button>
        )}
        
        {empresa.webValidada && empresa.logoAsignado && empresa.estado === 'Enviada' && (
          <button
            onClick={() => procesarEmpresa(empresa, 'activar')}
            disabled={workflowLoading}
            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 disabled:opacity-50"
          >
            ✅ Activar
          </button>
        )}
        
        <button
          onClick={() => procesarEmpresa(empresa, 'rechazar')}
          disabled={workflowLoading}
          className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 disabled:opacity-50"
        >
          ❌ Rechazar
        </button>
      </div>
    </div>
  );

  if (rol !== 'admin') {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Solo administradores pueden acceder al panel de validación</p>
        <p className="text-gray-500 mt-2">Tu rol actual: {rol || 'Sin rol'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">
            🔍 Panel de Validación - Catastro AV10 de Julio
          </h1>
          <p className="text-gray-600 mt-2">
            Validación y activación de empresas del catastro masivo
          </p>
        </div>

        {/* Filtros */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado:
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="Enviada">Enviadas</option>
                <option value="En Revisión">En Revisión</option>
                <option value="Activa">Activas</option>
                <option value="Rechazada">Rechazadas</option>
              </select>
            </div>

            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-yellow-50 p-3 rounded text-center">
                  <div className="font-bold text-yellow-600">
                    {empresasPendientes?.filter(e => e.estado === 'Enviada').length || 0}
                  </div>
                  <div className="text-yellow-800">Pendientes</div>
                </div>
                <div className="bg-blue-50 p-3 rounded text-center">
                  <div className="font-bold text-blue-600">
                    {empresasPendientes?.filter(e => e.estado === 'En Revisión').length || 0}
                  </div>
                  <div className="text-blue-800">En Revisión</div>
                </div>
                <div className="bg-green-50 p-3 rounded text-center">
                  <div className="font-bold text-green-600">
                    {empresasPendientes?.filter(e => e.estado === 'Activa').length || 0}
                  </div>
                  <div className="text-green-800">Activadas</div>
                </div>
                <div className="bg-red-50 p-3 rounded text-center">
                  <div className="font-bold text-red-600">
                    {empresasPendientes?.filter(e => e.estado === 'Rechazada').length || 0}
                  </div>
                  <div className="text-red-800">Rechazadas</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de empresas */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando empresas...</p>
            </div>
          ) : empresasPendientes?.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {empresasPendientes.map(empresa => (
                <EmpresaCard key={empresa.id} empresa={empresa} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay empresas con estado "{filtroEstado}"
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles */}
      {empresaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {empresaSeleccionada.nombre}
                </h2>
                <button
                  onClick={() => setEmpresaSeleccionada(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {/* Detalles completos de la empresa */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Dirección:</strong> {empresaSeleccionada.direccion}
                  </div>
                  <div>
                    <strong>Ciudad:</strong> {empresaSeleccionada.ciudad}
                  </div>
                  <div>
                    <strong>Región:</strong> {empresaSeleccionada.region}
                  </div>
                  <div>
                    <strong>Teléfono:</strong> {empresaSeleccionada.telefono}
                  </div>
                  <div>
                    <strong>Email:</strong> {empresaSeleccionada.email}
                  </div>
                  <div>
                    <strong>Sitio Web:</strong> 
                    {empresaSeleccionada.web && (
                      <a href={empresaSeleccionada.web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                        {empresaSeleccionada.web}
                      </a>
                    )}
                  </div>
                </div>
                
                {empresaSeleccionada.descripcion && (
                  <div>
                    <strong>Descripción:</strong>
                    <p className="mt-1 text-gray-700">{empresaSeleccionada.descripcion}</p>
                  </div>
                )}
                
                {/* Información de validación */}
                {empresaSeleccionada.validacionWeb && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <strong>Validación Web:</strong>
                    <div className="mt-2 text-sm">
                      <div>✅ Existe: {empresaSeleccionada.validacionWeb.existe ? 'Sí' : 'No'}</div>
                      <div>⚡ Respondiendo: {empresaSeleccionada.validacionWeb.respondiendo ? 'Sí' : 'No'}</div>
                      {empresaSeleccionada.validacionWeb.titulo && (
                        <div>📄 Título: {empresaSeleccionada.validacionWeb.titulo}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelValidacionAvanzado;
