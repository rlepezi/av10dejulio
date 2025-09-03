import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { EmpresaWorkflow } from '../utils/empresaWorkflow';
import { ESTADOS_EMPRESA } from '../utils/empresaStandards';

export function useEmpresaWorkflow() {
  const [loading, setLoading] = useState(false);
  
  const cambiarEstado = async (empresaId, nuevoEstado, motivo = '', datosAdicionales = {}) => {
    setLoading(true);
    try {
      const updates = {
        estado: nuevoEstado,
        fechaActualizacion: new Date(),
        ultimoCambioEstado: {
          fecha: new Date(),
          nuevoEstado,
          motivo,
          ...datosAdicionales
        },
        ...datosAdicionales
      };

      // Agregar campos específicos según el estado
      switch (nuevoEstado) {
        case ESTADOS_EMPRESA.ACTIVA:
          updates.fechaActivacion = new Date();
          updates.visible = true;
          break;
        case ESTADOS_EMPRESA.RECHAZADA:
          updates.fechaRechazo = new Date();
          updates.visible = false;
          break;
        case ESTADOS_EMPRESA.SUSPENDIDA:
          updates.fechaSuspension = new Date();
          updates.visible = false;
          break;
        case ESTADOS_EMPRESA.VISITADA:
          updates.visitaAgente = true;
          updates.fechaVisita = new Date();
          break;
      }

      await updateDoc(doc(db, 'empresas', empresaId), updates);
      return { success: true };
      
    } catch (error) {
      console.error('Error cambiando estado:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };
  
  const marcarVisitaAgente = async (empresaId, datosVisita) => {
    return await cambiarEstado(
      empresaId, 
      ESTADOS_EMPRESA.VISITADA, 
      'Visita realizada por agente de campo',
      {
        visitaAgente: true,
        datosVisita: {
          ...datosVisita,
          fecha: new Date()
        }
      }
    );
  };
  
  const validarWeb = async (empresaId, resultadoValidacion) => {
    setLoading(true);
    try {
      const updates = {
        webValidada: resultadoValidacion.existe && resultadoValidacion.respondiendo,
        validacionWeb: resultadoValidacion,
        fechaActualizacion: new Date()
      };

      await updateDoc(doc(db, 'empresas', empresaId), updates);
      return { success: true };
    } catch (error) {
      console.error('Error validando web:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const asignarLogo = async (empresaId, logoUrl) => {
    setLoading(true);
    try {
      const updates = {
        logoUrl,
        logoAsignado: true,
        fechaActualizacion: new Date()
      };

      await updateDoc(doc(db, 'empresas', empresaId), updates);
      return { success: true };
    } catch (error) {
      console.error('Error asignando logo:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };
  
  return {
    cambiarEstado,
    marcarVisitaAgente,
    validarWeb,
    asignarLogo,
    loading,
    validarRequisitos: EmpresaWorkflow.validarRequisitosActivacion,
    obtenerSiguientesPasos: EmpresaWorkflow.obtenerSiguientesPasos
  };
}
