// Estados de empresa en el sistema
export const ESTADOS_EMPRESA = {
  ENVIADA: 'Enviada',
  EN_REVISION: 'En Revisión', 
  ACTIVA: 'Activa',
  RECHAZADA: 'Rechazada',
  SUSPENDIDA: 'Suspendida',
  VISITADA: 'Visitada'
};

export const TRANSICIONES_PERMITIDAS = {
  [ESTADOS_EMPRESA.ENVIADA]: [
    ESTADOS_EMPRESA.EN_REVISION,
    ESTADOS_EMPRESA.RECHAZADA,
    ESTADOS_EMPRESA.VISITADA
  ],
  [ESTADOS_EMPRESA.EN_REVISION]: [
    ESTADOS_EMPRESA.ACTIVA,
    ESTADOS_EMPRESA.RECHAZADA,
    ESTADOS_EMPRESA.VISITADA
  ],
  [ESTADOS_EMPRESA.VISITADA]: [
    ESTADOS_EMPRESA.EN_REVISION,
    ESTADOS_EMPRESA.ACTIVA,
    ESTADOS_EMPRESA.RECHAZADA
  ],
  [ESTADOS_EMPRESA.ACTIVA]: [
    ESTADOS_EMPRESA.SUSPENDIDA
  ],
  [ESTADOS_EMPRESA.SUSPENDIDA]: [
    ESTADOS_EMPRESA.ACTIVA,
    ESTADOS_EMPRESA.RECHAZADA
  ],
  [ESTADOS_EMPRESA.RECHAZADA]: [] // Estado final
};

export class EmpresaWorkflow {
  static puedeTransicionar(estadoActual, nuevoEstado) {
    const transicionesPermitidas = TRANSICIONES_PERMITIDAS[estadoActual] || [];
    return transicionesPermitidas.includes(nuevoEstado);
  }
  
  static obtenerSiguientesPasos(estadoActual) {
    return TRANSICIONES_PERMITIDAS[estadoActual] || [];
  }
  
  static validarRequisitosActivacion(empresa) {
    const requisitos = {
      webValidada: empresa.webValidada === true,
      logoAsignado: empresa.logoAsignado === true,
      informacionCompleta: !!(empresa.nombre && empresa.direccion && empresa.telefono),
      sinConflictos: !empresa.flagConflicto
    };
    
    const cumpleRequisitos = Object.values(requisitos).every(Boolean);
    
    return {
      puedeActivar: cumpleRequisitos,
      requisitos,
      faltantes: Object.entries(requisitos)
        .filter(([key, value]) => !value)
        .map(([key]) => key)
    };
  }
  
  static generarRazonCambioEstado(estadoAnterior, nuevoEstado, motivo = '') {
    const razones = {
      [`${ESTADOS_EMPRESA.ENVIADA}-${ESTADOS_EMPRESA.EN_REVISION}`]: 'Empresa pasó a revisión manual',
      [`${ESTADOS_EMPRESA.EN_REVISION}-${ESTADOS_EMPRESA.ACTIVA}`]: 'Validación completada exitosamente',
      [`${ESTADOS_EMPRESA.VISITADA}-${ESTADOS_EMPRESA.ACTIVA}`]: 'Visita de agente completada y validada',
      [`${ESTADOS_EMPRESA.ACTIVA}-${ESTADOS_EMPRESA.SUSPENDIDA}`]: 'Empresa suspendida por administrador'
    };
    
    const razonKey = `${estadoAnterior}-${nuevoEstado}`;
    return razones[razonKey] || motivo || `Cambio de ${estadoAnterior} a ${nuevoEstado}`;
  }
}
