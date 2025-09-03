import React, { useState, useEffect } from 'react';
import { useClientMembership } from '../hooks/useClientMembership';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export default function GestionGastosVehiculo({ clienteId }) {
  const { membership, canAccessBenefit } = useClientMembership(clienteId);
  const [gastos, setGastos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabActiva, setTabActiva] = useState('ingresar');
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [nuevoGasto, setNuevoGasto] = useState({
    categoria: '',
    descripcion: '',
    monto: '',
    fecha: new Date().toISOString().slice(0, 10),
    vehiculoId: '',
    vehiculo: '',
    proveedor: '',
    kilometraje: ''
  });

  // Verificar si el cliente tiene acceso premium
  const tieneAccesoPremium = canAccessBenefit('gestionGastos');

  const categoriasGastos = [
    { id: 'mantenimiento', nombre: 'Mantenimiento', icono: '🔧', color: 'blue' },
    { id: 'combustible', nombre: 'Combustible', icono: '⛽', color: 'green' },
    { id: 'neumaticos', nombre: 'Neumáticos', icono: '🛞', color: 'purple' },
    { id: 'aceite', nombre: 'Aceite', icono: '🛢️', color: 'orange' },
    { id: 'seguro', nombre: 'Seguro', icono: '🛡️', color: 'red' },
    { id: 'lavado', nombre: 'Lavado', icono: '🧽', color: 'cyan' },
    { id: 'frenos', nombre: 'Frenos', icono: '🛑', color: 'yellow' },
    { id: 'peajes', nombre: 'Peajes', icono: '🛣️', color: 'indigo' },
    { id: 'viajes', nombre: 'Viajes', icono: '✈️', color: 'pink' },
    { id: 'otros', nombre: 'Otros', icono: '📋', color: 'gray' }
  ];

  // Cargar gastos y vehículos del cliente
  useEffect(() => {
    if (!clienteId || !tieneAccesoPremium) {
      setLoading(false);
      return;
    }

    const cargarDatos = async () => {
      try {
        setLoading(true);
        console.log('Cargando datos para clienteId:', clienteId);
        
        // Cargar gastos
        const gastosRef = collection(db, 'gastos_vehiculos');
        const qGastos = query(
          gastosRef,
          where('clienteId', '==', clienteId),
          orderBy('fecha', 'desc')
        );
        
        const gastosSnapshot = await getDocs(qGastos);
        const gastosData = gastosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setGastos(gastosData);

        // Cargar vehículos
        const vehiculosRef = collection(db, 'vehiculos');
        const qVehiculos = query(
          vehiculosRef,
          where('clienteId', '==', clienteId)
        );
        
        const vehiculosSnapshot = await getDocs(qVehiculos);
        console.log('Vehículos encontrados:', vehiculosSnapshot.docs.length);
        
        const vehiculosData = vehiculosSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Vehículo individual:', { id: doc.id, ...data });
          return {
            id: doc.id,
            ...data
          };
        });
        
        console.log('Vehículos cargados:', vehiculosData);
        setVehiculos(vehiculosData);
        
      } catch (err) {
        console.error('Error loading data:', err);
        console.error('Error details:', err.message);
        setError(`Error al cargar los datos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [clienteId, tieneAccesoPremium]);

  // Manejar cambio de vehículo seleccionado
  const handleVehiculoChange = (vehiculoId) => {
    const vehiculoSeleccionado = vehiculos.find(v => v.id === vehiculoId);
    setNuevoGasto(prev => ({
      ...prev,
      vehiculoId,
      kilometraje: vehiculoSeleccionado?.kilometraje || ''
    }));
  };

  const handleIngresarGasto = async (e) => {
    e.preventDefault();
    
    if (!nuevoGasto.categoria || !nuevoGasto.descripcion || !nuevoGasto.monto) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      // Obtener información del vehículo seleccionado
      const vehiculoSeleccionado = vehiculos.find(v => v.id === nuevoGasto.vehiculoId);
      const nombreVehiculo = vehiculoSeleccionado 
        ? `${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo} ${vehiculoSeleccionado.año}`
        : nuevoGasto.vehiculo || 'Vehículo no especificado';

      const gastoData = {
        ...nuevoGasto,
        clienteId,
        monto: parseFloat(nuevoGasto.monto),
        kilometraje: nuevoGasto.kilometraje ? parseInt(nuevoGasto.kilometraje) : null,
        fechaCreacion: new Date(),
        mes: nuevoGasto.fecha.slice(0, 7), // YYYY-MM
        vehiculo: nombreVehiculo,
        vehiculoId: nuevoGasto.vehiculoId || null
      };

      await addDoc(collection(db, 'gastos_vehiculos'), gastoData);
      
      // Actualizar lista de gastos
      setGastos(prev => [gastoData, ...prev]);
      
      // Limpiar formulario
      setNuevoGasto({
        categoria: '',
        descripcion: '',
        monto: '',
        fecha: new Date().toISOString().slice(0, 10),
        vehiculoId: '',
        vehiculo: '',
        proveedor: '',
        kilometraje: ''
      });
      
      setError('');
      alert('Gasto registrado exitosamente');
    } catch (err) {
      console.error('Error adding expense:', err);
      setError('Error al registrar el gasto');
    }
  };

  // Filtrar gastos por mes seleccionado
  const gastosDelMes = gastos.filter(gasto => gasto.mes === mesSeleccionado);
  
  // Obtener mes anterior para comparación
  const mesAnterior = new Date(mesSeleccionado + '-01');
  mesAnterior.setMonth(mesAnterior.getMonth() - 1);
  const mesAnteriorStr = mesAnterior.toISOString().slice(0, 7);
  const gastosMesAnterior = gastos.filter(gasto => gasto.mes === mesAnteriorStr);

  // Calcular totales
  const totalMesActual = gastosDelMes.reduce((sum, gasto) => sum + gasto.monto, 0);
  const totalMesAnterior = gastosMesAnterior.reduce((sum, gasto) => sum + gasto.monto, 0);
  const diferencia = totalMesActual - totalMesAnterior;
  const porcentajeCambio = totalMesAnterior > 0 ? ((diferencia / totalMesAnterior) * 100) : 0;

  // Calcular gastos por categoría
  const gastosPorCategoria = categoriasGastos.map(categoria => {
    const gastosCategoria = gastosDelMes.filter(gasto => gasto.categoria === categoria.id);
    const total = gastosCategoria.reduce((sum, gasto) => sum + gasto.monto, 0);
    const cantidad = gastosCategoria.length;
    
    return {
      ...categoria,
      total,
      cantidad,
      gastos: gastosCategoria
    };
  }).filter(cat => cat.total > 0);

  // Obtener última mantención
  const ultimaMantenimiento = gastos
    .filter(gasto => gasto.categoria === 'mantenimiento')
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];

  // Generar consejos basados en gastos
  const generarConsejos = () => {
    const consejos = [];
    
    if (ultimaMantenimiento) {
      const diasDesdeMantenimiento = Math.floor((new Date() - new Date(ultimaMantenimiento.fecha)) / (1000 * 60 * 60 * 24));
      
      if (diasDesdeMantenimiento > 90) {
        consejos.push({
          tipo: 'warning',
          mensaje: `Han pasado ${diasDesdeMantenimiento} días desde tu última mantención. Considera programar una revisión.`,
          icono: '⚠️'
        });
      }
    }

    // Consejo sobre combustible
    const gastoCombustible = gastosDelMes.filter(g => g.categoria === 'combustible').reduce((sum, g) => sum + g.monto, 0);
    if (gastoCombustible > totalMesActual * 0.4) {
      consejos.push({
        tipo: 'info',
        mensaje: 'Tu gasto en combustible representa más del 40% del total. Considera optimizar rutas o revisar eficiencia.',
        icono: '💡'
      });
    }

    // Consejo sobre neumáticos
    const gastoNeumaticos = gastosDelMes.filter(g => g.categoria === 'neumaticos').reduce((sum, g) => sum + g.monto, 0);
    if (gastoNeumaticos > 0) {
      consejos.push({
        tipo: 'success',
        mensaje: 'Has invertido en neumáticos este mes. Recuerda rotarlos cada 10,000 km para mayor duración.',
        icono: '✅'
      });
    }

    return consejos;
  };

  if (!tieneAccesoPremium) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Gestión de Gastos Vehiculares Premium</h3>
          <p className="text-gray-600 mb-4">
            Esta funcionalidad está disponible solo para clientes con membresía Premium
          </p>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-4">
            <h4 className="font-semibold mb-2">Beneficios Premium:</h4>
            <ul className="text-sm space-y-1">
              <li>• Registro detallado de gastos vehiculares</li>
              <li>• Análisis mensual y comparaciones</li>
              <li>• Consejos personalizados de mantenimiento</li>
              <li>• Seguimiento de kilometraje y servicios</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">💰</span>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Gestión de Gastos Vehiculares</h3>
          <p className="text-gray-600">Controla y analiza tus gastos mensuales</p>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'ingresar', label: '➕ Ingresar Gasto', icono: '➕' },
            { id: 'resumen', label: '📊 Resumen', icono: '📊' },
            { id: 'categorias', label: '📋 Por Categoría', icono: '📋' },
            { id: 'consejos', label: '💡 Consejos', icono: '💡' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                tabActiva === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Selector de mes */}
      <div className="mb-6">
        <label htmlFor="mes" className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Mes
        </label>
        <input
          type="month"
          id="mes"
          value={mesSeleccionado}
          onChange={(e) => setMesSeleccionado(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Contenido de las pestañas */}
      <div className="min-h-[400px]">
                 {/* Pestaña Ingresar Gasto */}
         {tabActiva === 'ingresar' && (
           <div className="max-w-2xl">
             <h4 className="text-lg font-semibold text-gray-900 mb-4">➕ Registrar Nuevo Gasto</h4>
             
             {/* Debug info - temporal */}
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
               <h5 className="font-semibold text-blue-800 mb-2">🔍 Debug Info</h5>
               <div className="text-xs text-blue-700 space-y-1">
                 <p><strong>Cliente ID:</strong> {clienteId}</p>
                 <p><strong>Vehículos cargados:</strong> {vehiculos.length}</p>
                 <p><strong>Acceso Premium:</strong> {tieneAccesoPremium ? 'Sí' : 'No'}</p>
                 <p><strong>Loading:</strong> {loading ? 'Sí' : 'No'}</p>
                 {vehiculos.length > 0 && (
                   <div>
                     <p><strong>Vehículos:</strong></p>
                     <ul className="ml-4">
                       {vehiculos.map((v, i) => (
                         <li key={i}>
                           {v.marca} {v.modelo} {v.año} - {v.patente}
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}
               </div>
             </div>

             {vehiculos.length === 0 && (
               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                 <div className="flex items-center gap-3">
                   <span className="text-2xl">⚠️</span>
                   <div>
                     <h5 className="font-semibold text-yellow-800">No tienes vehículos registrados</h5>
                     <p className="text-sm text-yellow-700">
                       Para registrar gastos vehiculares, primero necesitas agregar al menos un vehículo a tu perfil.
                     </p>
                     <button 
                       type="button"
                       onClick={() => window.location.href = '/dashboard/cliente'}
                       className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                     >
                       🚗 Agregar Vehículo
                     </button>
                   </div>
                 </div>
               </div>
             )}
            <form onSubmit={handleIngresarGasto} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    id="categoria"
                    value={nuevoGasto.categoria}
                    onChange={(e) => setNuevoGasto({...nuevoGasto, categoria: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categoriasGastos.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.icono} {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-2">
                    Monto (CLP) *
                  </label>
                  <input
                    type="number"
                    id="monto"
                    value={nuevoGasto.monto}
                    onChange={(e) => setNuevoGasto({...nuevoGasto, monto: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    required
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <input
                  type="text"
                  id="descripcion"
                  value={nuevoGasto.descripcion}
                  onChange={(e) => setNuevoGasto({...nuevoGasto, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Cambio de aceite, combustible, etc."
                  required
                />
              </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
                     Fecha
                   </label>
                   <input
                     type="date"
                     id="fecha"
                     value={nuevoGasto.fecha}
                     onChange={(e) => setNuevoGasto({...nuevoGasto, fecha: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   />
                 </div>

                 <div>
                   <label htmlFor="vehiculoId" className="block text-sm font-medium text-gray-700 mb-2">
                     Vehículo
                   </label>
                   <select
                     id="vehiculoId"
                     value={nuevoGasto.vehiculoId}
                     onChange={(e) => handleVehiculoChange(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   >
                     <option value="">Selecciona un vehículo</option>
                     {vehiculos.map((vehiculo) => (
                       <option key={vehiculo.id} value={vehiculo.id}>
                         🚗 {vehiculo.marca} {vehiculo.modelo} {vehiculo.año} - {vehiculo.patente}
                       </option>
                     ))}
                   </select>
                   {vehiculos.length === 0 && (
                     <p className="text-sm text-gray-500 mt-1">
                       No tienes vehículos registrados. 
                       <button 
                         type="button"
                         onClick={() => window.location.href = '/dashboard/cliente'}
                         className="text-blue-600 hover:text-blue-800 underline ml-1"
                       >
                         Agregar vehículo
                       </button>
                     </p>
                   )}
                 </div>
               </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="proveedor" className="block text-sm font-medium text-gray-700 mb-2">
                    Proveedor/Taller
                  </label>
                  <input
                    type="text"
                    id="proveedor"
                    value={nuevoGasto.proveedor}
                    onChange={(e) => setNuevoGasto({...nuevoGasto, proveedor: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Taller Mecánico Central"
                  />
                </div>

                                 <div>
                   <label htmlFor="kilometraje" className="block text-sm font-medium text-gray-700 mb-2">
                     Kilometraje
                   </label>
                   <input
                     type="number"
                     id="kilometraje"
                     value={nuevoGasto.kilometraje}
                     onChange={(e) => setNuevoGasto({...nuevoGasto, kilometraje: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="0"
                     min="0"
                   />
                   {nuevoGasto.vehiculoId && (() => {
                     const vehiculoSeleccionado = vehiculos.find(v => v.id === nuevoGasto.vehiculoId);
                     return vehiculoSeleccionado && (
                       <p className="text-sm text-gray-500 mt-1">
                         Kilometraje actual del vehículo: {vehiculoSeleccionado.kilometraje?.toLocaleString() || 'No registrado'} km
                       </p>
                     );
                   })()}
                 </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                💰 Registrar Gasto
              </button>
            </form>
          </div>
        )}

        {/* Pestaña Resumen */}
        {tabActiva === 'resumen' && (
          <div className="space-y-6">
            {/* Resumen principal */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Resumen del Mes</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    ${totalMesActual.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Mes Actual</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(mesSeleccionado + '-01').toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    ${totalMesAnterior.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Mes Anterior</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(mesAnteriorStr + '-01').toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <div className={`text-3xl font-bold mb-2 ${diferencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {diferencia >= 0 ? '+' : ''}${diferencia.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Diferencia</div>
                  <div className={`text-xs mt-1 ${diferencia >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {porcentajeCambio >= 0 ? '+' : ''}{porcentajeCambio.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de gastos del mes */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h5 className="font-semibold text-gray-900 mb-4">📋 Gastos Registrados</h5>
              {gastosDelMes.length > 0 ? (
                <div className="space-y-3">
                  {gastosDelMes.map((gasto) => {
                    const categoria = categoriasGastos.find(cat => cat.id === gasto.categoria);
                    return (
                      <div key={gasto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{categoria?.icono}</span>
                          <div>
                            <p className="font-medium text-gray-900">{gasto.descripcion}</p>
                            <p className="text-sm text-gray-600">
                              {categoria?.nombre} • {new Date(gasto.fecha).toLocaleDateString('es-CL')}
                            </p>
                          </div>
                        </div>
                                                 <div className="text-right">
                           <p className="font-semibold text-gray-900">${gasto.monto.toLocaleString()}</p>
                           {gasto.vehiculo && (
                             <p className="text-xs text-gray-500">🚗 {gasto.vehiculo}</p>
                           )}
                           {gasto.kilometraje && (
                             <p className="text-xs text-gray-400">{gasto.kilometraje.toLocaleString()} km</p>
                           )}
                         </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📊</div>
                  <p className="text-gray-600">No hay gastos registrados para este mes</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pestaña Por Categoría */}
        {tabActiva === 'categorias' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">📋 Gastos por Categoría</h4>
            {gastosPorCategoria.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gastosPorCategoria.map((categoria) => (
                  <div key={categoria.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{categoria.icono}</span>
                        <h5 className="font-semibold text-gray-900">{categoria.nombre}</h5>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ${categoria.total.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {categoria.cantidad} {categoria.cantidad === 1 ? 'gasto' : 'gastos'}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {categoria.gastos.map((gasto) => (
                        <div key={gasto.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{gasto.descripcion}</span>
                          <span className="font-medium">${gasto.monto.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📋</div>
                <p className="text-gray-600">No hay gastos registrados para este mes</p>
              </div>
            )}
          </div>
        )}

        {/* Pestaña Consejos */}
        {tabActiva === 'consejos' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">💡 Consejos Personalizados</h4>
            
            {/* Última mantención */}
            {ultimaMantenimiento && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h5 className="font-semibold text-gray-900 mb-3">🔧 Última Mantención</h5>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{ultimaMantenimiento.descripcion}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(ultimaMantenimiento.fecha).toLocaleDateString('es-CL')} • 
                      ${ultimaMantenimiento.monto.toLocaleString()}
                    </p>
                    {ultimaMantenimiento.proveedor && (
                      <p className="text-sm text-gray-500">Taller: {ultimaMantenimiento.proveedor}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl">🔧</div>
                  </div>
                </div>
              </div>
            )}

            {/* Consejos generados */}
            <div className="space-y-4">
              {generarConsejos().map((consejo, index) => (
                <div key={index} className={`rounded-lg p-4 ${
                  consejo.tipo === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  consejo.tipo === 'info' ? 'bg-blue-50 border border-blue-200' :
                  'bg-green-50 border border-green-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{consejo.icono}</span>
                    <p className={`font-medium ${
                      consejo.tipo === 'warning' ? 'text-yellow-800' :
                      consejo.tipo === 'info' ? 'text-blue-800' :
                      'text-green-800'
                    }`}>
                      {consejo.mensaje}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Consejos generales */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h5 className="font-semibold text-gray-900 mb-3">📚 Consejos Generales</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h6 className="font-medium text-gray-900">Mantenimiento Preventivo:</h6>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Cambio de aceite cada 10,000 km</li>
                    <li>• Revisión de frenos cada 20,000 km</li>
                    <li>• Filtros de aire cada 15,000 km</li>
                    <li>• Neumáticos cada 6 meses</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h6 className="font-medium text-gray-900">Ahorro de Combustible:</h6>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Mantén neumáticos inflados</li>
                    <li>• Evita aceleraciones bruscas</li>
                    <li>• Planifica rutas eficientes</li>
                    <li>• Reduce peso innecesario</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
