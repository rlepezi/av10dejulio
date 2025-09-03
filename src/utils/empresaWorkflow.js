// Estados de empresa en el sistema - UNIFICADOS
import { ESTADOS_EMPRESA, FLUJO_EMPRESA, puedeTransicionar, obtenerSiguientesEstados, obtenerDescripcionEstado } from './empresaStandards.js';

export const ESTADOS_EMPRESA_WORKFLOW = ESTADOS_EMPRESA;

export const TRANSICIONES_PERMITIDAS = {
  [ESTADOS_EMPRESA.CATALOGADA]: [
    ESTADOS_EMPRESA.PENDIENTE_VALIDACION
  ],
  [ESTADOS_EMPRESA.PENDIENTE_VALIDACION]: [
    ESTADOS_EMPRESA.EN_VISITA,
    ESTADOS_EMPRESA.RECHAZADA
  ],
  [ESTADOS_EMPRESA.EN_VISITA]: [
    ESTADOS_EMPRESA.VALIDADA,
    ESTADOS_EMPRESA.RECHAZADA
  ],
  [ESTADOS_EMPRESA.VALIDADA]: [
    ESTADOS_EMPRESA.ACTIVA,
    ESTADOS_EMPRESA.RECHAZADA
  ],
  [ESTADOS_EMPRESA.ACTIVA]: [
    ESTADOS_EMPRESA.SUSPENDIDA,
    ESTADOS_EMPRESA.INACTIVA
  ],
  [ESTADOS_EMPRESA.SUSPENDIDA]: [
    ESTADOS_EMPRESA.ACTIVA,
    ESTADOS_EMPRESA.INACTIVA
  ],
  [ESTADOS_EMPRESA.INACTIVA]: [], // Estado final
  [ESTADOS_EMPRESA.RECHAZADA]: [] // Estado final
};

export class EmpresaWorkflow {
  static puedeTransicionar(estadoActual, nuevoEstado) {
    return puedeTransicionar(estadoActual, nuevoEstado, false);
  }
  
  static obtenerSiguientesPasos(estadoActual) {
    return obtenerSiguientesEstados(estadoActual, false);
  }
  
  static obtenerDescripcionEstado(estado) {
    return obtenerDescripcionEstado(estado, false);
  }
  
  static validarRequisitosActivacion(empresa) {
    const requisitos = {
      webValidada: empresa.webValidada === true,
      logoAsignado: empresa.logoAsignado === true,
      informacionCompleta: !!(empresa.nombre && empresa.direccion && empresa.telefono),
      sinConflictos: !empresa.flagConflicto,
      validadaPorAgente: empresa.estado === ESTADOS_EMPRESA.VALIDADA
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
      [`${ESTADOS_EMPRESA.CATALOGADA}-${ESTADOS_EMPRESA.PENDIENTE_VALIDACION}`]: 'Empresa asignada a agente para validación',
      [`${ESTADOS_EMPRESA.PENDIENTE_VALIDACION}-${ESTADOS_EMPRESA.EN_VISITA}`]: 'Agente programó visita de validación',
      [`${ESTADOS_EMPRESA.EN_VISITA}-${ESTADOS_EMPRESA.VALIDADA}`]: 'Agente validó empresa en terreno',
      [`${ESTADOS_EMPRESA.VALIDADA}-${ESTADOS_EMPRESA.ACTIVA}`]: 'Admin activó empresa completamente',
      [`${ESTADOS_EMPRESA.ACTIVA}-${ESTADOS_EMPRESA.SUSPENDIDA}`]: 'Empresa suspendida por administrador',
      [`${ESTADOS_EMPRESA.SUSPENDIDA}-${ESTADOS_EMPRESA.ACTIVA}`]: 'Empresa reactivada por administrador',
      [`${ESTADOS_EMPRESA.ACTIVA}-${ESTADOS_EMPRESA.INACTIVA}`]: 'Empresa desactivada permanentemente'
    };
    
    const razonKey = `${estadoAnterior}-${nuevoEstado}`;
    return razones[razonKey] || motivo || `Cambio de ${estadoAnterior} a ${nuevoEstado}`;
  }
  
  static obtenerFlujoCompleto() {
    return FLUJO_EMPRESA;
  }
  
  static esEstadoFinal(estado) {
    return [ESTADOS_EMPRESA.INACTIVA, ESTADOS_EMPRESA.RECHAZADA].includes(estado);
  }
  
  static esVisibleEnHome(estado) {
    return FLUJO_EMPRESA[estado]?.visible_en_home || false;
  }
  
  static puedeGestionar(estado) {
    return FLUJO_EMPRESA[estado]?.puede_gestionar || false;
  }
}
