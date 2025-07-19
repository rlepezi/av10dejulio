import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Servicio para crear usuarios en Firebase Authentication desde el admin
 * cuando se aprueban solicitudes de cliente
 */

export class UserCreationService {
  
  /**
   * Crear usuario de cliente a partir de una solicitud aprobada
   */
  static async createClientUser(solicitudData) {
    try {
      // Extraer datos de la solicitud
      const {
        nombres,
        apellidos,
        email,
        password_hash,
        telefono,
        direccion,
        comuna,
        region,
        rut,
        fecha_nacimiento,
        genero
      } = solicitudData;

      // Decodificar la contraseña (recordar que está en base64)
      const password = atob(password_hash);

      // Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Crear perfil de cliente en Firestore
      const perfilClienteData = {
        uid: user.uid,
        email: user.email,
        nombres,
        apellidos,
        telefono,
        direccion,
        comuna,
        region,
        rut,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        genero: genero || '',
        
        // Información de perfil
        userId: user.uid, // Para compatibilidad con DashboardCliente
        fecha_registro: new Date(),
        fechaRegistro: new Date(), // Para compatibilidad con AdminValidacionClientes
        estado: 'pendiente_validacion', // Campo consistente usado en toda la app
        tipo_usuario: 'cliente',
        fecha_activacion: new Date(),
        
        // Configuraciones por defecto
        notificaciones_email: true,
        notificaciones_push: true,
        acepta_promociones: true,
        
        // Vehiculos (array vacío inicialmente)
        vehiculos: [],
        
        // Estadísticas
        total_solicitudes: 0,
        total_servicios_completados: 0,
        calificacion_promedio: null,
        
        // Metadatos
        creado_desde_solicitud: true,
        solicitud_original_id: solicitudData.id || null,
        ip_registro: solicitudData.ip_registro || null,
        user_agent: solicitudData.user_agent || null
      };

      // Guardar en la colección perfiles_clientes
      const docRef = await addDoc(collection(db, 'perfiles_clientes'), perfilClienteData);

      return {
        success: true,
        user: user,
        profileId: docRef.id,
        uid: user.uid,
        email: user.email
      };

    } catch (error) {
      console.error('Error creating client user:', error);
      
      let errorMessage = 'Error al crear el usuario';
      
      // Manejar errores específicos de Firebase
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'El email ya está registrado en el sistema';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El email no es válido';
      }

      return {
        success: false,
        error: errorMessage,
        code: error.code
      };
    }
  }

  /**
   * Crear usuario de proveedor a partir de una solicitud aprobada
   */
  static async createProviderUser(solicitudData) {
    try {
      // Extraer datos de la solicitud
      const {
        nombres_representante,
        apellidos_representante,
        email_empresa,
        password_hash,
        nombre_empresa,
        rut_empresa,
        telefono_empresa,
        direccion_empresa,
        comuna,
        region,
        categorias_servicios,
        marcas_vehiculos,
        descripcion_negocio,
        horario_atencion
      } = solicitudData;

      // Decodificar la contraseña
      const password = atob(password_hash);

      // Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email_empresa, password);
      const user = userCredential.user;

      // Crear perfil de empresa en Firestore
      const empresaData = {
        uid: user.uid,
        email: user.email,
        
        // Información de la empresa
        nombre: nombre_empresa,
        rut: rut_empresa,
        telefono: telefono_empresa,
        direccion: direccion_empresa,
        comuna,
        region,
        descripcion: descripcion_negocio,
        horario_atencion,
        
        // Información del representante
        representante: {
          nombres: nombres_representante,
          apellidos: apellidos_representante,
          email: solicitudData.email_representante || email_empresa,
          telefono: solicitudData.telefono_representante || telefono_empresa,
          cargo: solicitudData.cargo_representante || 'Propietario'
        },
        
        // Servicios y capacidades
        categorias: categorias_servicios || [],
        marcas_atendidas: marcas_vehiculos || [],
        
        // Estado y configuración
        fecha_registro: new Date(),
        estado_validacion: 'activo',
        tipo_usuario: 'proveedor',
        fecha_activacion: new Date(),
        verificado: true,
        
        // Configuraciones
        acepta_notificaciones: solicitudData.acepta_notificaciones !== false,
        visible_en_busqueda: true,
        acepta_servicios_emergencia: false,
        
        // Estadísticas iniciales
        total_servicios_completados: 0,
        calificacion_promedio: null,
        total_clientes_atendidos: 0,
        
        // Metadatos
        creado_desde_solicitud: true,
        solicitud_original_id: solicitudData.id || null,
        ip_registro: solicitudData.ip_registro || null,
        user_agent: solicitudData.user_agent || null
      };

      // Guardar en la colección empresas
      const docRef = await addDoc(collection(db, 'empresas'), empresaData);

      return {
        success: true,
        user: user,
        profileId: docRef.id,
        uid: user.uid,
        email: user.email
      };

    } catch (error) {
      console.error('Error creating provider user:', error);
      
      let errorMessage = 'Error al crear el usuario proveedor';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'El email ya está registrado en el sistema';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El email no es válido';
      }

      return {
        success: false,
        error: errorMessage,
        code: error.code
      };
    }
  }

  /**
   * Verificar si un email ya existe en Authentication
   */
  static async checkEmailExists(email) {
    try {
      // No hay método directo para verificar email, intentamos crear un usuario temporal
      // Esto es solo una verificación, no crear realmente el usuario
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return methods.length > 0;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  }
}

export default UserCreationService;
