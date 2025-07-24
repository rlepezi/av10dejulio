import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase.js';

export const testEmpresasConnection = async () => {
  try {
    console.log('🔍 Iniciando test de conexión a empresas...');
    
    // Consulta simple sin filtros
    const simpleQuery = query(collection(db, 'empresas'), limit(10));
    const snapshot = await getDocs(simpleQuery);
    
    console.log('📊 Total empresas encontradas:', snapshot.size);
    
    if (snapshot.size > 0) {
      console.log('🏢 Lista de empresas:');
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ID: ${doc.id}`);
        console.log(`   Nombre: ${data.nombre || 'Sin nombre'}`);
        console.log(`   Estado: "${data.estado}" (tipo: ${typeof data.estado})`);
        console.log(`   Tipo: ${data.tipoEmpresa || 'Sin tipo'}`);
        console.log(`   Ciudad: ${data.ciudad || 'Sin ciudad'}`);
        console.log('   ---');
      });
      
      // Análisis de estados
      const estados = {};
      snapshot.docs.forEach(doc => {
        const estado = doc.data().estado;
        estados[estado] = (estados[estado] || 0) + 1;
      });
      
      console.log('📈 Análisis de estados:');
      Object.entries(estados).forEach(([estado, count]) => {
        console.log(`   "${estado}": ${count} empresas`);
      });
      
    } else {
      console.log('❌ No se encontraron empresas en la colección');
    }
    
    return {
      total: snapshot.size,
      empresas: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };
    
  } catch (error) {
    console.error('❌ Error en test de empresas:', error);
    return { error: error.message };
  }
};

// Ejecutar test si se ejecuta directamente
if (typeof window !== 'undefined') {
  window.testEmpresasConnection = testEmpresasConnection;
}
