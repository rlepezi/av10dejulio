// Servicio de Red de Calidad y Apadrinamiento AV 10 de Julio
// Basado en el documento del proyecto - Apadrinamiento y Red de Calidad

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  getDoc,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';

export class QualityNetworkService {
  
  // Estados de apadrinamiento según el documento
  static SPONSORSHIP_STATUS = {
    PENDING: 'pendiente',
    APPROVED: 'aprobado',
    ACTIVE: 'activo',
    COMPLETED: 'completado',
    REJECTED: 'rechazado',
    EXPIRED: 'expirado'
  };

  // Tipos de apadrinamiento
  static SPONSORSHIP_TYPES = {
    IMAGE_IMPROVEMENT: 'mejora_imagen',
    EQUIPMENT_UPGRADE: 'mejora_equipamiento',
    DIGITAL_TRANSFORMATION: 'transformacion_digital',
    BRANDING: 'branding',
    TRAINING: 'capacitacion',
    NETWORKING: 'networking',
    MARKETING: 'marketing',
    COMPREHENSIVE: 'integral'
  };

  // Niveles de calidad
  static QUALITY_LEVELS = {
    BRONZE: 'bronce',
    SILVER: 'plata',
    GOLD: 'oro',
    PLATINUM: 'platino',
    DIAMOND: 'diamante'
  };

  // Estados de evaluación
  static EVALUATION_STATUS = {
    PENDING: 'pendiente',
    IN_PROGRESS: 'en_progreso',
    COMPLETED: 'completada',
    APPROVED: 'aprobada',
    REJECTED: 'rechazada'
  };

  /**
   * Crear solicitud de apadrinamiento
   */
  static async createSponsorshipRequest(empresaId, datos) {
    try {
      const solicitud = {
        empresaId,
        tipo: datos.tipo,
        descripcion: datos.descripcion,
        justificacion: datos.justificacion,
        impactoEsperado: datos.impactoEsperado,
        presupuestoEstimado: datos.presupuestoEstimado,
        fechaCreacion: serverTimestamp(),
        estado: this.SPONSORSHIP_STATUS.PENDING,
        evaluaciones: [],
        documentos: datos.documentos || [],
        prioridad: datos.prioridad || 'media',
        categoria: datos.categoria || 'general'
      };

      const docRef = await addDoc(collection(db, 'solicitudes_apadrinamiento'), solicitud);
      console.log('✅ Solicitud de apadrinamiento creada:', docRef.id);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error creando solicitud de apadrinamiento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener solicitudes de apadrinamiento por empresa
   */
  static async getSponsorshipRequests(empresaId = null, estado = null) {
    try {
      let q = collection(db, 'solicitudes_apadrinamiento');
      
      if (empresaId) {
        q = query(q, where('empresaId', '==', empresaId));
      }
      
      if (estado) {
        q = query(q, where('estado', '==', estado));
      }

      q = query(q, orderBy('fechaCreacion', 'desc'));
      const snapshot = await getDocs(q);
      
      const solicitudes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, solicitudes };
    } catch (error) {
      console.error('❌ Error obteniendo solicitudes de apadrinamiento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Evaluar solicitud de apadrinamiento (admin/agente)
   */
  static async evaluateSponsorshipRequest(solicitudId, evaluacion) {
    try {
      const solicitudRef = doc(db, 'solicitudes_apadrinamiento', solicitudId);
      
      const evaluacionCompleta = {
        ...evaluacion,
        fechaEvaluacion: serverTimestamp(),
        evaluador: evaluacion.evaluador,
        estado: evaluacion.estado
      };

      await updateDoc(solicitudRef, {
        estado: evaluacion.estado,
        evaluaciones: arrayUnion(evaluacionCompleta),
        fechaEvaluacion: serverTimestamp(),
        comentariosAdmin: evaluacion.comentarios || ''
      });

      // Si es aprobada, crear el programa de apadrinamiento
      if (evaluacion.estado === this.SPONSORSHIP_STATUS.APPROVED) {
        await this.createSponsorshipProgram(solicitudId, evaluacion);
      }

      console.log('✅ Solicitud evaluada');
      return { success: true };
    } catch (error) {
      console.error('❌ Error evaluando solicitud:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear programa de apadrinamiento
   */
  static async createSponsorshipProgram(solicitudId, evaluacion) {
    try {
      const solicitudDoc = await getDoc(doc(db, 'solicitudes_apadrinamiento', solicitudId));
      if (!solicitudDoc.exists()) {
        throw new Error('Solicitud no encontrada');
      }

      const solicitud = solicitudDoc.data();
      
      const programa = {
        solicitudId,
        empresaId: solicitud.empresaId,
        tipo: solicitud.tipo,
        descripcion: solicitud.descripcion,
        fechaInicio: serverTimestamp(),
        fechaEstimadaFin: Timestamp.fromDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)), // 90 días
        estado: this.SPONSORSHIP_STATUS.ACTIVE,
        presupuestoAsignado: evaluacion.presupuestoAsignado || solicitud.presupuestoEstimado,
        recursosAsignados: evaluacion.recursosAsignados || [],
        equipoAsignado: evaluacion.equipoAsignado || [],
        metas: evaluacion.metas || [],
        indicadores: evaluacion.indicadores || [],
        seguimientos: [],
        nivelCalidad: evaluacion.nivelCalidad || this.QUALITY_LEVELS.BRONZE
      };

      const docRef = await addDoc(collection(db, 'programas_apadrinamiento'), programa);
      
      // Actualizar la solicitud con el ID del programa
      await updateDoc(doc(db, 'solicitudes_apadrinamiento', solicitudId), {
        programaId: docRef.id
      });

      console.log('✅ Programa de apadrinamiento creado:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error creando programa de apadrinamiento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener programas de apadrinamiento activos
   */
  static async getActiveSponsorshipPrograms(empresaId = null) {
    try {
      let q = query(
        collection(db, 'programas_apadrinamiento'),
        where('estado', '==', this.SPONSORSHIP_STATUS.ACTIVE),
        orderBy('fechaInicio', 'desc')
      );

      if (empresaId) {
        q = query(q, where('empresaId', '==', empresaId));
      }

      const snapshot = await getDocs(q);
      const programas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, programas };
    } catch (error) {
      console.error('❌ Error obteniendo programas activos:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear seguimiento del programa de apadrinamiento
   */
  static async createProgramFollowUp(programaId, seguimiento) {
    try {
      const programaRef = doc(db, 'programas_apadrinamiento', programaId);
      
      const seguimientoCompleto = {
        ...seguimiento,
        fecha: serverTimestamp(),
        estado: seguimiento.estado || 'en_progreso'
      };

      await updateDoc(programaRef, {
        seguimientos: arrayUnion(seguimientoCompleto)
      });

      console.log('✅ Seguimiento creado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error creando seguimiento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Completar programa de apadrinamiento
   */
  static async completeSponsorshipProgram(programaId, resultados) {
    try {
      const programaRef = doc(db, 'programas_apadrinamiento', programaId);
      
      await updateDoc(programaRef, {
        estado: this.SPONSORSHIP_STATUS.COMPLETED,
        fechaFin: serverTimestamp(),
        resultados: resultados,
        evaluacionFinal: resultados.evaluacionFinal || {},
        impactoLogrado: resultados.impactoLogrado || {},
        recomendaciones: resultados.recomendaciones || []
      });

      // Actualizar nivel de calidad de la empresa
      await this.updateCompanyQualityLevel(resultados.empresaId, resultados.nivelCalidadFinal);

      console.log('✅ Programa de apadrinamiento completado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error completando programa:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar nivel de calidad de la empresa
   */
  static async updateCompanyQualityLevel(empresaId, nuevoNivel) {
    try {
      const empresaRef = doc(db, 'empresas', empresaId);
      await updateDoc(empresaRef, {
        nivelCalidad: nuevoNivel,
        fechaActualizacionCalidad: serverTimestamp(),
        selloCalidad: this.generateQualitySeal(nuevoNivel)
      });

      console.log('✅ Nivel de calidad actualizado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error actualizando nivel de calidad:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generar sello de calidad según el nivel
   */
  static generateQualitySeal(nivel) {
    const sellos = {
      [this.QUALITY_LEVELS.BRONZE]: '🥉 Sello Bronce AV 10 de Julio',
      [this.QUALITY_LEVELS.SILVER]: '🥈 Sello Plata AV 10 de Julio',
      [this.QUALITY_LEVELS.GOLD]: '🥇 Sello Oro AV 10 de Julio',
      [this.QUALITY_LEVELS.PLATINUM]: '💎 Sello Platino AV 10 de Julio',
      [this.QUALITY_LEVELS.DIAMOND]: '💠 Sello Diamante AV 10 de Julio'
    };

    return sellos[nivel] || sellos[this.QUALITY_LEVELS.BRONZE];
  }

  /**
   * Obtener empresas con sellos de calidad
   */
  static async getQualityCertifiedCompanies(nivel = null) {
    try {
      let q = query(
        collection(db, 'empresas'),
        where('estado', '==', 'validada'),
        where('nivelCalidad', '!=', null)
      );

      if (nivel) {
        q = query(q, where('nivelCalidad', '==', nivel));
      }

      q = query(q, orderBy('nivelCalidad', 'desc'));
      const snapshot = await getDocs(q);
      
      const empresas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, empresas };
    } catch (error) {
      console.error('❌ Error obteniendo empresas certificadas:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear red de calidad entre empresas
   */
  static async createQualityNetwork(empresaId, empresasConectadas) {
    try {
      const red = {
        empresaCentral: empresaId,
        empresasConectadas,
        fechaCreacion: serverTimestamp(),
        estado: 'activa',
        beneficios: [],
        actividades: [],
        metricas: {
          empresasConectadas: empresasConectadas.length,
          actividadesRealizadas: 0,
          beneficiosGenerados: 0
        }
      };

      const docRef = await addDoc(collection(db, 'redes_calidad'), red);
      console.log('✅ Red de calidad creada:', docRef.id);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error creando red de calidad:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener redes de calidad de una empresa
   */
  static async getCompanyQualityNetworks(empresaId) {
    try {
      const q = query(
        collection(db, 'redes_calidad'),
        where('empresaCentral', '==', empresaId),
        orderBy('fechaCreacion', 'desc')
      );

      const snapshot = await getDocs(q);
      const redes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, redes };
    } catch (error) {
      console.error('❌ Error obteniendo redes de calidad:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Agregar actividad a la red de calidad
   */
  static async addNetworkActivity(redId, actividad) {
    try {
      const redRef = doc(db, 'redes_calidad', redId);
      
      const actividadCompleta = {
        ...actividad,
        fecha: serverTimestamp(),
        estado: 'completada'
      };

      await updateDoc(redRef, {
        actividades: arrayUnion(actividadCompleta),
        'metricas.actividadesRealizadas': increment(1)
      });

      console.log('✅ Actividad agregada a la red');
      return { success: true };
    } catch (error) {
      console.error('❌ Error agregando actividad:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener estadísticas de la red de calidad
   */
  static async getQualityNetworkStats(empresaId = null) {
    try {
      let q = collection(db, 'redes_calidad');
      
      if (empresaId) {
        q = query(q, where('empresaCentral', '==', empresaId));
      }

      const snapshot = await getDocs(q);
      const redes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const stats = {
        totalRedes: redes.length,
        empresasConectadas: 0,
        actividadesTotales: 0,
        beneficiosGenerados: 0,
        porNivelCalidad: {},
        empresasDestacadas: []
      };

      redes.forEach(red => {
        stats.empresasConectadas += red.metricas.empresasConectadas;
        stats.actividadesTotales += red.metricas.actividadesRealizadas;
        stats.beneficiosGenerados += red.metricas.beneficiosGenerados;
      });

      // Obtener empresas destacadas por nivel de calidad
      const empresasDestacadas = await this.getQualityCertifiedCompanies();
      if (empresasDestacadas.success) {
        stats.empresasDestacadas = empresasDestacadas.empresas.slice(0, 10);
      }

      return { success: true, stats };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de red:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear programa de beneficios para empresas certificadas
   */
  static async createBenefitsProgram(empresaId, beneficios) {
    try {
      const programa = {
        empresaId,
        beneficios,
        fechaCreacion: serverTimestamp(),
        estado: 'activo',
        fechaVencimiento: Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // 1 año
        utilizados: [],
        metricas: {
          totalBeneficios: beneficios.length,
          utilizados: 0,
          disponibles: beneficios.length
        }
      };

      const docRef = await addDoc(collection(db, 'programas_beneficios'), programa);
      console.log('✅ Programa de beneficios creado:', docRef.id);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error creando programa de beneficios:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Utilizar beneficio del programa
   */
  static async useBenefit(programaId, beneficioId, datosUso) {
    try {
      const programaRef = doc(db, 'programas_beneficios', programaId);
      
      const uso = {
        beneficioId,
        fechaUso: serverTimestamp(),
        datosUso,
        estado: 'utilizado'
      };

      await updateDoc(programaRef, {
        utilizados: arrayUnion(uso),
        'metricas.utilizados': increment(1),
        'metricas.disponibles': increment(-1)
      });

      console.log('✅ Beneficio utilizado');
      return { success: true };
    } catch (error) {
      console.error('❌ Error utilizando beneficio:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener programas de beneficios de una empresa
   */
  static async getCompanyBenefitsPrograms(empresaId) {
    try {
      const q = query(
        collection(db, 'programas_beneficios'),
        where('empresaId', '==', empresaId),
        where('estado', '==', 'activo'),
        orderBy('fechaCreacion', 'desc')
      );

      const snapshot = await getDocs(q);
      const programas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, programas };
    } catch (error) {
      console.error('❌ Error obteniendo programas de beneficios:', error);
      return { success: false, error: error.message };
    }
  }
}

export default QualityNetworkService;



