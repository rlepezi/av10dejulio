import { deleteUser } from 'firebase/auth';
import { deleteDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Script temporal para eliminar y recrear usuarios cliente
 * SOLO USAR EN DESARROLLO
 */

export class UserCleanupService {
  
  /**
   * Eliminar usuario cliente por email
   */
  static async deleteClientUser(email) {
    try {
      console.log('🔍 Buscando usuario para eliminar:', email);
      
      // 1. Buscar en la colección usuarios
      const usuariosQuery = query(
        collection(db, 'usuarios'),
        where('email', '==', email)
      );
      const usuariosSnapshot = await getDocs(usuariosQuery);
      
      if (!usuariosSnapshot.empty) {
        const userDoc = usuariosSnapshot.docs[0];
        console.log('✅ Usuario encontrado en usuarios:', userDoc.id);
        
        // Eliminar documento de usuarios
        await deleteDoc(doc(db, 'usuarios', userDoc.id));
        console.log('🗑️ Documento eliminado de usuarios');
      }
      
      // 2. Buscar en perfiles_clientes
      const perfilesQuery = query(
        collection(db, 'perfiles_clientes'),
        where('email', '==', email)
      );
      const perfilesSnapshot = await getDocs(perfilesQuery);
      
      if (!perfilesSnapshot.empty) {
        const perfilDoc = perfilesSnapshot.docs[0];
        console.log('✅ Perfil encontrado en perfiles_clientes:', perfilDoc.id);
        
        // Eliminar documento de perfiles_clientes
        await deleteDoc(doc(db, 'perfiles_clientes', perfilDoc.id));
        console.log('🗑️ Perfil eliminado de perfiles_clientes');
      }
      
      // 3. Buscar en Firebase Auth
      const authUser = auth.currentUser;
      if (authUser && authUser.email === email) {
        console.log('✅ Usuario autenticado encontrado, eliminando...');
        await deleteUser(authUser);
        console.log('🗑️ Usuario de Auth eliminado');
      }
      
      console.log('✅ Usuario eliminado completamente');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Verificar si el usuario existe en las colecciones
   */
  static async checkUserExists(email) {
    try {
      console.log('🔍 Verificando existencia del usuario:', email);
      
      // Buscar en usuarios
      const usuariosQuery = query(
        collection(db, 'usuarios'),
        where('email', '==', email)
      );
      const usuariosSnapshot = await getDocs(usuariosQuery);
      
      // Buscar en perfiles_clientes
      const perfilesQuery = query(
        collection(db, 'perfiles_clientes'),
        where('email', '==', email)
      );
      const perfilesSnapshot = await getDocs(perfilesQuery);
      
      const result = {
        email,
        existsInUsuarios: !usuariosSnapshot.empty,
        existsInPerfiles: !perfilesSnapshot.empty,
        usuariosDoc: usuariosSnapshot.empty ? null : usuariosSnapshot.docs[0].data(),
        perfilesDoc: perfilesSnapshot.empty ? null : perfilesSnapshot.docs[0].data()
      };
      
      console.log('📊 Estado del usuario:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Error verificando usuario:', error);
      return { success: false, error: error.message };
    }
  }
}

