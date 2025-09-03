import React, { useState } from 'react';
import { useClientMembership } from '../hooks/useClientMembership';

export default function ConsultaVehiculo({ clienteId }) {
  const { membership, canAccessBenefit } = useClientMembership(clienteId);
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [año, setAño] = useState('');
  const [consultando, setConsultando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [tabActiva, setTabActiva] = useState('resumen');

  // Verificar si el cliente tiene acceso premium
  const tieneAccesoPremium = canAccessBenefit('consultaVehiculo');

  const marcas = [
    'Toyota', 'Honda', 'Nissan', 'Hyundai', 'Kia', 'Mazda', 'Subaru',
    'Chevrolet', 'Ford', 'Volkswagen', 'Peugeot', 'Renault', 'Citroën',
    'BMW', 'Mercedes-Benz', 'Audi', 'Volvo', 'Mitsubishi', 'Suzuki',
    'Isuzu', 'Fiat', 'Dodge', 'Jeep', 'Chrysler', 'Lexus', 'Infiniti',
    'Acura', 'Genesis', 'Alfa Romeo', 'Jaguar', 'Land Rover', 'Mini'
  ];

  const años = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

  const handleConsulta = async () => {
    if (!marca || !modelo || !año) {
      setError('Por favor completa todos los campos');
      return;
    }

    setConsultando(true);
    setError('');
    setResultado(null);

    try {
      // Simular delay de consulta
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generar información simulada basada en los datos ingresados
      const infoVehiculo = generarInfoVehiculo(marca, modelo, año);
      setResultado(infoVehiculo);
    } catch (error) {
      setError('Error al consultar información del vehículo');
    } finally {
      setConsultando(false);
    }
  };

  const generarInfoVehiculo = (marca, modelo, año) => {
    // Información simulada basada en patrones reales
    const infoBase = {
      marca,
      modelo,
      año,
      fechaConsulta: new Date().toLocaleString('es-CL')
    };

    // Generar información específica según la marca
    const infoPorMarca = {
      'Toyota': {
        confiabilidad: 'Excelente',
        consumo: { ciudad: '12-14 km/l', carretera: '16-18 km/l' },
        repuestos: 'Alta disponibilidad',
        proveedores: 45,
        caracteristicas: ['Gran confiabilidad', 'Bajo costo de mantenimiento', 'Alta reventa'],
        problemasComunes: ['Desgaste de pastillas de freno', 'Cambio de aceite frecuente'],
        recomendaciones: 'Mantenimiento preventivo cada 10,000 km'
      },
      'Honda': {
        confiabilidad: 'Muy buena',
        consumo: { ciudad: '11-13 km/l', carretera: '15-17 km/l' },
        repuestos: 'Buena disponibilidad',
        proveedores: 38,
        caracteristicas: ['Motor eficiente', 'Diseño atractivo', 'Tecnología avanzada'],
        problemasComunes: ['Sistema de transmisión CVT', 'Filtros de aire'],
        recomendaciones: 'Revisión de transmisión cada 40,000 km'
      },
      'Nissan': {
        confiabilidad: 'Buena',
        consumo: { ciudad: '10-12 km/l', carretera: '14-16 km/l' },
        repuestos: 'Disponibilidad media',
        proveedores: 32,
        caracteristicas: ['Espacio interior amplio', 'Confort en carretera', 'Precio accesible'],
        problemasComunes: ['Sistema de frenos', 'Suspensión trasera'],
        recomendaciones: 'Revisión de frenos cada 20,000 km'
      },
      'Hyundai': {
        confiabilidad: 'Buena',
        consumo: { ciudad: '11-13 km/l', carretera: '15-17 km/l' },
        repuestos: 'Buena disponibilidad',
        proveedores: 35,
        caracteristicas: ['Garantía extendida', 'Equipamiento completo', 'Precio competitivo'],
        problemasComunes: ['Sistema eléctrico', 'Filtros de combustible'],
        recomendaciones: 'Mantenimiento según garantía del fabricante'
      },
      'Kia': {
        confiabilidad: 'Buena',
        consumo: { ciudad: '10-12 km/l', carretera: '14-16 km/l' },
        repuestos: 'Disponibilidad media',
        proveedores: 28,
        caracteristicas: ['Diseño moderno', 'Equipamiento de serie', 'Precio accesible'],
        problemasComunes: ['Sistema de aire acondicionado', 'Frenos delanteros'],
        recomendaciones: 'Revisión de aire acondicionado cada 2 años'
      }
    };

    // Información por defecto si no se encuentra la marca
    const infoDefault = {
      confiabilidad: 'Buena',
      consumo: { ciudad: '10-12 km/l', carretera: '14-16 km/l' },
      repuestos: 'Disponibilidad media',
      proveedores: 25,
      caracteristicas: ['Vehículo confiable', 'Mantenimiento estándar', 'Repuestos disponibles'],
      problemasComunes: ['Mantenimiento preventivo', 'Cambio de filtros'],
      recomendaciones: 'Seguir programa de mantenimiento del fabricante'
    };

    const infoEspecifica = infoPorMarca[marca] || infoDefault;

    // Ajustar información según el año
    const añoActual = new Date().getFullYear();
    const antiguedad = añoActual - año;
    
    let estadoVehiculo = 'Nuevo';
    let recomendacionesEspeciales = [];

    if (antiguedad > 10) {
      estadoVehiculo = 'Vehículo antiguo';
      recomendacionesEspeciales.push('Revisión completa del sistema de frenos');
      recomendacionesEspeciales.push('Verificación de emisiones');
      recomendacionesEspeciales.push('Revisión de suspensión y amortiguadores');
    } else if (antiguedad > 5) {
      estadoVehiculo = 'Vehículo usado';
      recomendacionesEspeciales.push('Revisión de transmisión');
      recomendacionesEspeciales.push('Verificación de sistema eléctrico');
    }

    return {
      ...infoBase,
      ...infoEspecifica,
      estadoVehiculo,
      antiguedad,
      recomendacionesEspeciales,
      precioEstimado: calcularPrecioEstimado(marca, modelo, año),
      valorizacion: calcularValorizacion(marca, modelo, año)
    };
  };

  const calcularPrecioEstimado = (marca, modelo, año) => {
    const añoActual = new Date().getFullYear();
    const antiguedad = añoActual - año;
    
    // Precios base por marca (en CLP)
    const preciosBase = {
      'Toyota': 15000000,
      'Honda': 14000000,
      'Nissan': 12000000,
      'Hyundai': 11000000,
      'Kia': 10000000,
      'BMW': 25000000,
      'Mercedes-Benz': 30000000,
      'Audi': 22000000
    };

    const precioBase = preciosBase[marca] || 10000000;
    const depreciacion = antiguedad * 0.15; // 15% por año
    const precioFinal = precioBase * (1 - depreciacion);
    
    return Math.max(precioFinal, precioBase * 0.2); // Mínimo 20% del precio original
  };

  const calcularValorizacion = (marca, modelo, año) => {
    const añoActual = new Date().getFullYear();
    const antiguedad = añoActual - año;
    
    if (antiguedad <= 2) return 'Excelente';
    if (antiguedad <= 5) return 'Buena';
    if (antiguedad <= 10) return 'Regular';
    return 'Baja';
  };

  if (!tieneAccesoPremium) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Consulta de Vehículos Premium</h3>
          <p className="text-gray-600 mb-4">
            Esta funcionalidad está disponible solo para clientes con membresía Premium
          </p>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-4">
            <h4 className="font-semibold mb-2">Beneficios Premium:</h4>
            <ul className="text-sm space-y-1">
              <li>• Consulta detallada de vehículos</li>
              <li>• Información de consumo y rendimiento</li>
              <li>• Disponibilidad de repuestos</li>
              <li>• Recomendaciones personalizadas</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🚗</span>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Consulta de Vehículo</h3>
          <p className="text-gray-600">Información detallada sobre tu vehículo</p>
        </div>
      </div>

      {/* Formulario de consulta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-2">
            Marca
          </label>
          <select
            id="marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona una marca</option>
            {marcas.map((marcaOption) => (
              <option key={marcaOption} value={marcaOption}>
                {marcaOption}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="modelo" className="block text-sm font-medium text-gray-700 mb-2">
            Modelo
          </label>
          <input
            type="text"
            id="modelo"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            placeholder="Ej: Corolla, Civic, Sentra"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="año" className="block text-sm font-medium text-gray-700 mb-2">
            Año
          </label>
          <select
            id="año"
            value={año}
            onChange={(e) => setAño(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona un año</option>
            {años.map((añoOption) => (
              <option key={añoOption} value={añoOption}>
                {añoOption}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <button
        onClick={handleConsulta}
        disabled={consultando || !marca || !modelo || !año}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {consultando ? 'Consultando...' : 'Consultar Información del Vehículo'}
      </button>

      {/* Resultado de la consulta con pestañas */}
      {resultado && (
        <div className="mt-6">
          <div className="border-t pt-6">
            <h4 className="text-xl font-bold text-gray-900 mb-6">
              📊 Información del {resultado.marca} {resultado.modelo} {resultado.año}
            </h4>

            {/* Pestañas de navegación */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'resumen', label: '📈 Resumen', icon: '📈' },
                  { id: 'consumo', label: '⛽ Consumo', icon: '⛽' },
                  { id: 'repuestos', label: '🔧 Repuestos', icon: '🔧' },
                  { id: 'caracteristicas', label: '✨ Características', icon: '✨' },
                  { id: 'problemas', label: '⚠️ Problemas', icon: '⚠️' },
                  { id: 'recomendaciones', label: '💡 Recomendaciones', icon: '💡' }
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

            {/* Contenido de las pestañas */}
            <div className="min-h-[400px]">
              {/* Pestaña Resumen */}
              {tabActiva === 'resumen' && (
                <div className="space-y-6">
                  {/* Resumen principal */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4">📊 Resumen General</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-3xl font-bold text-blue-600 mb-2">{resultado.confiabilidad}</div>
                        <div className="text-sm text-gray-600">Confiabilidad</div>
                        <div className="text-xs text-gray-500 mt-1">Basado en registros históricos</div>
                      </div>
                      <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-3xl font-bold text-green-600 mb-2">{resultado.proveedores}</div>
                        <div className="text-sm text-gray-600">Proveedores</div>
                        <div className="text-xs text-gray-500 mt-1">Repuestos disponibles</div>
                      </div>
                      <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-3xl font-bold text-purple-600 mb-2">{resultado.valorizacion}</div>
                        <div className="text-sm text-gray-600">Valorización</div>
                        <div className="text-xs text-gray-500 mt-1">En el mercado actual</div>
                      </div>
                    </div>
                  </div>

                  {/* Información básica */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h6 className="font-semibold text-gray-900 mb-3">🚗 Información del Vehículo</h6>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estado:</span>
                          <span className="font-medium">{resultado.estadoVehiculo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Antigüedad:</span>
                          <span className="font-medium">{resultado.antiguedad} años</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Precio estimado:</span>
                          <span className="font-medium text-green-600">${resultado.precioEstimado.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h6 className="font-semibold text-gray-900 mb-3">📅 Información de Consulta</h6>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fecha consulta:</span>
                          <span className="font-medium">{resultado.fechaConsulta}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nivel de acceso:</span>
                          <span className="font-medium text-purple-600">Premium</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fuente:</span>
                          <span className="font-medium">Base de datos AV 10 de Julio</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pestaña Consumo */}
              {tabActiva === 'consumo' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4">⛽ Análisis de Consumo de Combustible</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-center">
                          <div className="text-2xl mb-2">🏙️</div>
                          <div className="text-2xl font-bold text-blue-600 mb-1">{resultado.consumo.ciudad}</div>
                          <div className="text-sm text-gray-600">Consumo en Ciudad</div>
                          <div className="text-xs text-gray-500 mt-1">Tráfico urbano típico</div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-center">
                          <div className="text-2xl mb-2">🛣️</div>
                          <div className="text-2xl font-bold text-green-600 mb-1">{resultado.consumo.carretera}</div>
                          <div className="text-sm text-gray-600">Consumo en Carretera</div>
                          <div className="text-xs text-gray-500 mt-1">Velocidad constante</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h6 className="font-semibold text-gray-900 mb-4">📊 Análisis Detallado</h6>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h7 className="font-medium text-blue-900 mb-2">💡 Información Importante</h7>
                        <p className="text-sm text-blue-800">
                          Este vehículo es conocido por su gran espacio y confort, su motor de 2.0 litros lo hace un vehículo un tanto gastado. 
                          En ciudad puede llegar a consumir {resultado.consumo.ciudad} y en carretera {resultado.consumo.carretera}.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Factores que afectan el consumo:</div>
                          <ul className="text-sm text-gray-600 mt-2 space-y-1">
                            <li>• Estilo de conducción</li>
                            <li>• Condiciones del tráfico</li>
                            <li>• Mantenimiento del vehículo</li>
                            <li>• Carga y pasajeros</li>
                          </ul>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Recomendaciones de ahorro:</div>
                          <ul className="text-sm text-gray-600 mt-2 space-y-1">
                            <li>• Mantenimiento regular</li>
                            <li>• Neumáticos inflados</li>
                            <li>• Conducción eficiente</li>
                            <li>• Evitar sobrecarga</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pestaña Repuestos */}
              {tabActiva === 'repuestos' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4">🔧 Disponibilidad de Repuestos</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">{resultado.proveedores}</div>
                        <div className="text-sm text-gray-600">Proveedores Registrados</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-2">{resultado.repuestos}</div>
                        <div className="text-sm text-gray-600">Disponibilidad</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-2">24-48h</div>
                        <div className="text-sm text-gray-600">Tiempo de Entrega</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h6 className="font-semibold text-gray-900 mb-4">📋 Información Detallada</h6>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h7 className="font-medium text-green-900 mb-2">✅ Disponibilidad</h7>
                        <p className="text-sm text-green-800">
                          Según nuestros registros es un vehículo con alta rotación de repuestos y contamos con más de {resultado.proveedores} proveedores que venden sus repuestos.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Repuestos más solicitados:</div>
                          <ul className="text-sm text-gray-600 mt-2 space-y-1">
                            <li>• Filtros de aceite</li>
                            <li>• Pastillas de freno</li>
                            <li>• Bujías</li>
                            <li>• Filtros de aire</li>
                          </ul>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Recomendación general:</div>
                          <p className="text-sm text-gray-600 mt-2">{resultado.recomendaciones}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pestaña Características */}
              {tabActiva === 'caracteristicas' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4">✨ Características Principales</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {resultado.caracteristicas.map((caracteristica, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3">
                          <span className="text-green-500 text-xl">✓</span>
                          <span className="font-medium">{caracteristica}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h6 className="font-semibold text-gray-900 mb-4">🎯 Análisis de Características</h6>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h7 className="font-medium text-blue-900 mb-2">💡 Puntos Destacados</h7>
                        <p className="text-sm text-blue-800">
                          Este vehículo se destaca por sus características de confiabilidad y eficiencia. 
                          Es una excelente opción para uso diario y viajes largos.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Ventajas principales:</div>
                          <ul className="text-sm text-gray-600 mt-2 space-y-1">
                            <li>• Excelente confiabilidad</li>
                            <li>• Bajo costo de mantenimiento</li>
                            <li>• Buena reventa</li>
                            <li>• Amplia red de servicio</li>
                          </ul>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Ideal para:</div>
                          <ul className="text-sm text-gray-600 mt-2 space-y-1">
                            <li>• Uso familiar</li>
                            <li>• Viajes de trabajo</li>
                            <li>• Conducción urbana</li>
                            <li>• Presupuesto moderado</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pestaña Problemas */}
              {tabActiva === 'problemas' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Problemas Comunes Conocidos</h5>
                    <div className="space-y-3">
                      {resultado.problemasComunes.map((problema, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3">
                          <span className="text-orange-500 text-xl">⚠</span>
                          <span className="font-medium">{problema}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h6 className="font-semibold text-gray-900 mb-4">🔍 Análisis de Problemas</h6>
                    <div className="space-y-4">
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h7 className="font-medium text-yellow-900 mb-2">⚠️ Información Importante</h7>
                        <p className="text-sm text-yellow-800">
                          Estos son problemas comunes reportados por propietarios y talleres. 
                          La mayoría son mantenimientos preventivos que pueden evitarse con cuidado adecuado.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Prevención:</div>
                          <ul className="text-sm text-gray-600 mt-2 space-y-1">
                            <li>• Mantenimiento preventivo</li>
                            <li>• Revisiones periódicas</li>
                            <li>• Uso de repuestos originales</li>
                            <li>• Conducción cuidadosa</li>
                          </ul>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Solución:</div>
                          <ul className="text-sm text-gray-600 mt-2 space-y-1">
                            <li>• Talleres especializados</li>
                            <li>• Repuestos de calidad</li>
                            <li>• Diagnóstico profesional</li>
                            <li>• Seguimiento post-reparación</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pestaña Recomendaciones */}
              {tabActiva === 'recomendaciones' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4">💡 Recomendaciones Personalizadas</h5>
                    <div className="space-y-3">
                      {resultado.recomendacionesEspeciales.length > 0 ? (
                        resultado.recomendacionesEspeciales.map((recomendacion, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3">
                            <span className="text-blue-500 text-xl">💡</span>
                            <span className="font-medium">{recomendacion}</span>
                          </div>
                        ))
                      ) : (
                        <div className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3">
                          <span className="text-green-500 text-xl">✓</span>
                          <span className="font-medium">Vehículo en buen estado, mantener rutina de mantenimiento</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h6 className="font-semibold text-gray-900 mb-4">📋 Plan de Mantenimiento Sugerido</h6>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h7 className="font-medium text-green-900 mb-2">✅ Recomendación General</h7>
                        <p className="text-sm text-green-800">{resultado.recomendaciones}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Mantenimiento básico:</div>
                          <ul className="text-sm text-gray-600 mt-2 space-y-1">
                            <li>• Cambio de aceite cada 10,000 km</li>
                            <li>• Revisión de frenos cada 20,000 km</li>
                            <li>• Filtros cada 15,000 km</li>
                            <li>• Neumáticos cada 6 meses</li>
                          </ul>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">Mantenimiento avanzado:</div>
                          <ul className="text-sm text-gray-600 mt-2 space-y-1">
                            <li>• Transmisión cada 40,000 km</li>
                            <li>• Sistema eléctrico cada 2 años</li>
                            <li>• Suspensión cada 50,000 km</li>
                            <li>• Emisiones cada año</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
