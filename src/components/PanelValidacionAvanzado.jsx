import React, { useState } from 'react';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { useEmpresaWorkflow } from '../hooks/useEmpresaWorkflow';
import { useAuth } from './AuthProvider';
import { crearEmpresasIngresadas } from '../addInfo';
import { useImageUrl } from '../hooks/useImageUrl';
import CrearEmpresaPublica from './CrearEmpresaPublica';

const PanelValidacionAvanzado = () => {
  const { rol } = useAuth();
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [validandoWeb, setValidandoWeb] = useState(false);
  const [creandoEmpresas, setCreandoEmpresas] = useState(false);
  const [mostrarCrearEmpresa, setMostrarCrearEmpresa] = useState(false);

  const { 
    cambiarEstado, 
    validarWeb, 
    asignarLogo, 
    loading: workflowLoading 
  } = useEmpresaWorkflow();

  // Obtener todas las empresas para validación
  const { data: todasLasEmpresas, loading } = useFirestoreCollection('empresas', {
    orderBy: ['fecha_creacion', 'desc']
  });

  // Debug: Log de empresas obtenidas
  console.log('🔍 Empresas obtenidas de Firestore:', todasLasEmpresas);
  console.log('🔍 Empresas con estado "ingresada":', todasLasEmpresas?.filter(e => e.estado === 'ingresada'));

  // Función para convertir horarios a texto legible
  const convertirHorariosATexto = (horarios) => {
    if (typeof horarios === 'string') return horarios;
    if (!horarios || typeof horarios !== 'object') return 'Horarios no disponibles';
    
    // Si es el formato antiguo con .general
    if (horarios.general) return horarios.general;
    
    // Si es el nuevo formato estructurado
    if (horarios.lunes || horarios.martes) {
      return Object.entries(horarios)
        .filter(([_, config]) => config && config.activo)
        .map(([dia, config]) => {
          const nombreDia = dia === 'lunes' ? 'Lun' : 
                            dia === 'martes' ? 'Mar' :
                            dia === 'miercoles' ? 'Mié' :
                            dia === 'jueves' ? 'Jue' :
                            dia === 'viernes' ? 'Vie' :
                            dia === 'sabado' ? 'Sáb' : 'Dom';
          return `${nombreDia} ${config.inicio}-${config.fin}`;
        }).join(', ');
    }
    
    return 'Horarios no disponibles';
  };

  // Función para normalizar datos de empresa
  const normalizarEmpresa = (empresa) => {
    const empresaNormalizada = {
      id: empresa.id,
      nombre: empresa.nombre,
      direccion: empresa.direccion,
      telefono: empresa.telefono,
      email: empresa.email,
      // Manejar diferentes nombres de campos para web
      web: empresa.web || empresa.sitio_web,
      // Manejar diferentes nombres de campos para logo
      logo: empresa.logo || empresa.logo_url,
      logoAsignado: empresa.logoAsignado || !!(empresa.logo || empresa.logo_url),
      webValidada: empresa.webValidada || false,
      visitaAgente: empresa.visitaAgente || false,
      estado: empresa.estado,
      // Manejar diferentes nombres de campos para categoría
      categoria: empresa.categoria || empresa.rubro,
      // Manejar diferentes nombres de campos para zona
      zona: empresa.zona || empresa.ciudad,
      region: empresa.region,
      ciudad: empresa.ciudad,
      // Manejar diferentes nombres de campos para fechas
      fechaCreacion: empresa.fechaCreacion || empresa.fecha_creacion,
      // Campos adicionales para empresas manuales
      tipo_empresa: empresa.tipo_empresa,
      es_comunidad: empresa.es_comunidad,
      marcas: empresa.marcas || [],
      horarios: convertirHorariosATexto(empresa.horarios || empresa.horario_atencion),
      descripcion: empresa.descripcion,
      creado_por: empresa.creado_por,
      // Campos adicionales específicos
      lat: empresa.lat,
      lng: empresa.lng
    };
    
    // Debug: Log de normalización
    console.log('🔧 Normalizando empresa:', empresa.nombre, empresaNormalizada);
    console.log('🕐 Horarios originales:', empresa.horarios);
    console.log('🕐 Horarios normalizados:', empresaNormalizada.horarios);
    
    return empresaNormalizada;
  };

  // Filtrar empresas según el estado seleccionado
  const empresasPendientes = todasLasEmpresas?.filter(empresa => {
    const cumpleFiltro = filtroEstado === 'todos' 
      ? ['ingresada', 'validada', 'En Revisión', 'activa', 'Rechazada'].includes(empresa.estado)
      : empresa.estado === filtroEstado;
    
    // Debug: Log de filtrado
    console.log(`🔍 Empresa ${empresa.nombre} (${empresa.estado}) - Cumple filtro: ${cumpleFiltro}`);
    
    return cumpleFiltro;
  }).map(normalizarEmpresa) || [];

  // Debug: Log de empresas filtradas y normalizadas
  console.log('🔍 Empresas filtradas y normalizadas:', empresasPendientes);

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

  const abrirCrearEmpresa = () => {
    setMostrarCrearEmpresa(true);
  };

  const cerrarCrearEmpresa = () => {
    setMostrarCrearEmpresa(false);
  };

  const crearEmpresasEjemplo = async () => {
    if (window.confirm('¿Quieres crear 5 empresas de ejemplo con estado "ingresada" para testing del panel de validación?')) {
      setCreandoEmpresas(true);
      try {
        await crearEmpresasIngresadas();
        alert('✅ Empresas de ejemplo creadas exitosamente. Recarga la página para verlas.');
      } catch (error) {
        console.error('Error creando empresas de ejemplo:', error);
        alert('❌ Error creando empresas de ejemplo');
      } finally {
        setCreandoEmpresas(false);
      }
    }
  };

  const procesarEmpresa = async (empresa, accion) => {
    try {
      switch (accion) {
        case 'validar_web':
          const sitioWeb = empresa.web || empresa.sitio_web;
          if (sitioWeb) {
            const validacionWeb = await validarSitioWeb(sitioWeb);
            await validarWeb(empresa.id, validacionWeb);
          }
          break;

        case 'asignar_logo':
          const logoUrl = await buscarLogo(empresa.nombre, empresa.web || empresa.sitio_web);
          if (logoUrl) {
            await asignarLogo(empresa.id, logoUrl);
          }
          break;

        case 'activar':
          await cambiarEstado(empresa.id, 'activa', 'Activación manual por administrador');
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
          empresa.estado === 'ingresada' ? 'bg-teal-100 text-teal-800' :
          empresa.estado === 'validada' ? 'bg-blue-100 text-blue-800' :
          empresa.estado === 'En Revisión' ? 'bg-yellow-100 text-yellow-800' :
          empresa.estado === 'activa' ? 'bg-green-100 text-green-800' :
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
        {empresa.tipo_empresa && (
          <div>🏢 Tipo: {empresa.tipo_empresa}</div>
        )}
        {empresa.creado_por && (
          <div>👤 Creado por: {empresa.creado_por}</div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setEmpresaSeleccionada(empresa)}
          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
        >
          👁️ Ver detalles
        </button>
        
        {!empresa.webValidada && (empresa.web || empresa.sitio_web) && (
          <button
            onClick={() => procesarEmpresa(empresa, 'validar_web')}
            disabled={validandoWeb || workflowLoading}
            className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 disabled:opacity-50"
          >
            🔍 Validar web
          </button>
        )}
        
        {!empresa.logoAsignado && !empresa.logo && (
          <button
            onClick={() => procesarEmpresa(empresa, 'asignar_logo')}
            disabled={workflowLoading}
            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 disabled:opacity-50"
          >
            🖼️ Buscar logo
          </button>
        )}
        
        {empresa.webValidada && empresa.logoAsignado && (empresa.estado === 'ingresada' || empresa.estado === 'validada') && (
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
                 <option value="todos">Todos los Estados</option>
                 <option value="ingresada">Ingresadas</option>
                 <option value="validada">Validadas</option>
                 <option value="En Revisión">En Revisión</option>
                 <option value="Activa">Activas</option>
                 <option value="Rechazada">Rechazadas</option>
               </select>
             </div>

                           <div className="flex gap-2">
                <button
                  onClick={abrirCrearEmpresa}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  🏢 Crear Empresa Pública
                </button>
                
                <button
                  onClick={crearEmpresasEjemplo}
                  disabled={creandoEmpresas}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {creandoEmpresas ? '🔄 Creando...' : '➕ Crear Empresas Ejemplo'}
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  🔄 Recargar
                </button>
              </div>

            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                 <div className="bg-teal-50 p-3 rounded text-center">
                   <div className="font-bold text-teal-600">
                     {todasLasEmpresas?.filter(e => e.estado === 'ingresada').length || 0}
                   </div>
                   <div className="text-teal-800">Ingresadas</div>
                 </div>
                 <div className="bg-blue-50 p-3 rounded text-center">
                   <div className="font-bold text-blue-600">
                     {todasLasEmpresas?.filter(e => e.estado === 'validada').length || 0}
                   </div>
                   <div className="text-blue-800">Validadas</div>
                 </div>
                 <div className="bg-yellow-50 p-3 rounded text-center">
                   <div className="font-bold text-yellow-600">
                     {todasLasEmpresas?.filter(e => e.estado === 'En Revisión').length || 0}
                   </div>
                   <div className="text-yellow-800">En Revisión</div>
                 </div>
                 <div className="bg-green-50 p-3 rounded text-center">
                   <div className="font-bold text-green-600">
                     {todasLasEmpresas?.filter(e => e.estado === 'activa').length || 0}
                   </div>
                   <div className="text-green-800">Activadas</div>
                 </div>
                 <div className="bg-red-50 p-3 rounded text-center">
                   <div className="font-bold text-red-600">
                     {todasLasEmpresas?.filter(e => e.estado === 'Rechazada').length || 0}
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
               {filtroEstado === 'todos' 
                 ? 'No hay empresas en proceso de validación'
                 : `No hay empresas con estado "${filtroEstado}"`
               }
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
                   {empresaSeleccionada.tipo_empresa && (
                     <div>
                       <strong>Tipo de Empresa:</strong> {empresaSeleccionada.tipo_empresa}
                     </div>
                   )}
                   {empresaSeleccionada.creado_por && (
                     <div>
                       <strong>Creado por:</strong> {empresaSeleccionada.creado_por}
                     </div>
                   )}
                   {empresaSeleccionada.es_comunidad !== undefined && (
                     <div>
                       <strong>Es Comunidad:</strong> {empresaSeleccionada.es_comunidad ? 'Sí' : 'No'}
                     </div>
                   )}
                 </div>
                
                                 {empresaSeleccionada.descripcion && (
                   <div>
                     <strong>Descripción:</strong>
                     <p className="mt-1 text-gray-700">{empresaSeleccionada.descripcion}</p>
                   </div>
                 )}
                 
                 {empresaSeleccionada.marcas && empresaSeleccionada.marcas.length > 0 && (
                   <div>
                     <strong>Marcas:</strong>
                     <div className="mt-1 flex flex-wrap gap-1">
                       {empresaSeleccionada.marcas.map((marca, index) => (
                         <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                           {marca}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}
                 
                 {empresaSeleccionada.horarios && (
                   <div>
                     <strong>Horarios:</strong>
                     <p className="mt-1 text-gray-700">{empresaSeleccionada.horarios}</p>
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

      {/* Modal de Crear Empresa Pública */}
      {mostrarCrearEmpresa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Crear Empresa Pública
                </h2>
                <button
                  onClick={cerrarCrearEmpresa}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <CrearEmpresaPublica 
                onClose={cerrarCrearEmpresa}
                onSuccess={() => {
                  cerrarCrearEmpresa();
                  window.location.reload(); // Recargar para mostrar la nueva empresa
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelValidacionAvanzado;
