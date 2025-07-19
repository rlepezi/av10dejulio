import React, { useState } from 'react';

const DIAS_SEMANA = [
  { id: 'lunes', label: 'Lunes' },
  { id: 'martes', label: 'Martes' },
  { id: 'miercoles', label: 'Miércoles' },
  { id: 'jueves', label: 'Jueves' },
  { id: 'viernes', label: 'Viernes' },
  { id: 'sabado', label: 'Sábado' },
  { id: 'domingo', label: 'Domingo' }
];

const HORARIOS_PREDEFINIDOS = [
  { label: 'Horario Comercial (9:00 - 18:00)', inicio: '09:00', fin: '18:00' },
  { label: 'Jornada Completa (8:00 - 17:00)', inicio: '08:00', fin: '17:00' },
  { label: 'Medio Día (9:00 - 13:00)', inicio: '09:00', fin: '13:00' },
  { label: 'Tarde (14:00 - 20:00)', inicio: '14:00', fin: '20:00' },
  { label: 'Extendido (7:00 - 21:00)', inicio: '07:00', fin: '21:00' }
];

export default function HorarioManager({ empresa, onUpdate, saving }) {
  const [horarios, setHorarios] = useState(empresa.horarios || {
    lunes: { activo: true, inicio: '09:00', fin: '18:00' },
    martes: { activo: true, inicio: '09:00', fin: '18:00' },
    miercoles: { activo: true, inicio: '09:00', fin: '18:00' },
    jueves: { activo: true, inicio: '09:00', fin: '18:00' },
    viernes: { activo: true, inicio: '09:00', fin: '18:00' },
    sabado: { activo: false, inicio: '09:00', fin: '13:00' },
    domingo: { activo: false, inicio: '10:00', fin: '14:00' }
  });

  const [aplicarATodos, setAplicarATodos] = useState(false);
  const [horarioModelo, setHorarioModelo] = useState({ inicio: '09:00', fin: '18:00' });

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

  const aplicarHorarioATodos = () => {
    if (!aplicarATodos) return;

    const nuevosHorarios = { ...horarios };
    DIAS_SEMANA.forEach(dia => {
      if (nuevosHorarios[dia.id]) {
        nuevosHorarios[dia.id] = {
          ...nuevosHorarios[dia.id],
          inicio: horarioModelo.inicio,
          fin: horarioModelo.fin
        };
      }
    });
    setHorarios(nuevosHorarios);
  };

  const aplicarHorarioPredefinido = (horarioPred) => {
    const nuevosHorarios = { ...horarios };
    DIAS_SEMANA.forEach(dia => {
      nuevosHorarios[dia.id] = {
        ...nuevosHorarios[dia.id],
        inicio: horarioPred.inicio,
        fin: horarioPred.fin,
        activo: dia.id !== 'domingo' // Mantener domingo inactivo por defecto
      };
    });
    setHorarios(nuevosHorarios);
  };

  const guardarHorarios = () => {
    onUpdate('horarios', horarios);
  };

  const formatearHorarioTexto = () => {
    const diasActivos = DIAS_SEMANA.filter(dia => horarios[dia.id]?.activo);
    if (diasActivos.length === 0) return 'Sin horarios definidos';

    // Agrupar días con el mismo horario
    const gruposHorarios = {};
    diasActivos.forEach(dia => {
      const horario = horarios[dia.id];
      const key = `${horario.inicio}-${horario.fin}`;
      if (!gruposHorarios[key]) {
        gruposHorarios[key] = { dias: [], horario };
      }
      gruposHorarios[key].dias.push(dia.label);
    });

    return Object.values(gruposHorarios).map(grupo => {
      const diasTexto = grupo.dias.length === 1 
        ? grupo.dias[0]
        : grupo.dias.length === grupo.dias.length 
          ? grupo.dias.join(', ')
          : `${grupo.dias[0]} a ${grupo.dias[grupo.dias.length - 1]}`;
      
      return `${diasTexto}: ${grupo.horario.inicio} - ${grupo.horario.fin}`;
    }).join(' | ');
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Gestión de Horarios</h3>
      
      {/* Resumen actual */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Horarios Actuales:</h4>
        <p className="text-blue-800 text-sm">{formatearHorarioTexto()}</p>
      </div>

      {/* Herramientas rápidas */}
      <div className="mb-6 space-y-4">
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Herramientas Rápidas</h4>
          
          {/* Horarios predefinidos */}
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Aplicar horario predefinido:</label>
            <div className="flex flex-wrap gap-2">
              {HORARIOS_PREDEFINIDOS.map((horario, index) => (
                <button
                  key={index}
                  onClick={() => aplicarHorarioPredefinido(horario)}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {horario.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aplicar a todos */}
          <div className="mt-4 p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="aplicarATodos"
                checked={aplicarATodos}
                onChange={(e) => setAplicarATodos(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="aplicarATodos" className="text-sm font-medium text-gray-700">
                Aplicar el mismo horario a todos los días activos
              </label>
            </div>
            
            {aplicarATodos && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Desde:</label>
                  <input
                    type="time"
                    value={horarioModelo.inicio}
                    onChange={(e) => setHorarioModelo(prev => ({ ...prev, inicio: e.target.value }))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Hasta:</label>
                  <input
                    type="time"
                    value={horarioModelo.fin}
                    onChange={(e) => setHorarioModelo(prev => ({ ...prev, fin: e.target.value }))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <button
                  onClick={aplicarHorarioATodos}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configuración por día */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Configuración Detallada por Día</h4>
        
        {DIAS_SEMANA.map(dia => (
          <div key={dia.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-20">
                  <span className="font-medium text-gray-900">{dia.label}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={horarios[dia.id]?.activo || false}
                    onChange={(e) => handleDiaChange(dia.id, 'activo', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-600">Abierto</span>
                </div>

                {horarios[dia.id]?.activo && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Desde:</label>
                      <input
                        type="time"
                        value={horarios[dia.id]?.inicio || '09:00'}
                        onChange={(e) => handleDiaChange(dia.id, 'inicio', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Hasta:</label>
                      <input
                        type="time"
                        value={horarios[dia.id]?.fin || '18:00'}
                        onChange={(e) => handleDiaChange(dia.id, 'fin', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {!horarios[dia.id]?.activo && (
                <span className="text-sm text-gray-500 italic">Cerrado</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Notas adicionales */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h5 className="font-medium text-yellow-900 mb-2">📝 Notas sobre horarios:</h5>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Los horarios se muestran a los clientes en la información de la empresa</li>
          <li>• Puedes tener diferentes horarios para cada día de la semana</li>
          <li>• Los días marcados como "Cerrado" no mostrarán horarios</li>
          <li>• Se recomienda mantener horarios consistentes y actualizados</li>
        </ul>
      </div>

      {/* Botón guardar */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={guardarHorarios}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar Horarios'}
        </button>
      </div>
    </div>
  );
}
