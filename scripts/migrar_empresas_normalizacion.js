// MIGRACIÓN DE CAMPOS CLAVE EN EMPRESAS (tipoEmpresa, rubro, estado)
// Ejecuta este script con Node.js o desde un entorno seguro con permisos de admin
// Asegúrate de tener backup antes de ejecutar en producción

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');
const { normalizeEmpresaData } = require('../src/utils/empresaStandards');
const firebaseConfig = require('../src/firebaseConfig'); // Ajusta la ruta según tu proyecto

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrarEmpresas() {
  const empresasRef = collection(db, 'empresas');
  const snapshot = await getDocs(empresasRef);
  let actualizadas = 0;

  for (const empresaDoc of snapshot.docs) {
    const data = empresaDoc.data();
    const normalizada = normalizeEmpresaData(data);

    // Solo actualiza si hay diferencias relevantes
    if (
      data.tipoEmpresa !== normalizada.tipoEmpresa ||
      data.rubro !== normalizada.rubro ||
      data.estado !== normalizada.estado
    ) {
      await updateDoc(doc(db, 'empresas', empresaDoc.id), {
        tipoEmpresa: normalizada.tipoEmpresa,
        rubro: normalizada.rubro,
        estado: normalizada.estado
      });
      actualizadas++;
      console.log(`Empresa ${empresaDoc.id} actualizada.`);
    }
  }
  console.log(`Migración completada. Empresas actualizadas: ${actualizadas}`);
}

migrarEmpresas().catch(console.error);
