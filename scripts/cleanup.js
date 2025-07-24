#!/usr/bin/env node
// Script para limpiar archivos duplicados y temporales

const fs = require('fs');
const path = require('path');

const filesToRemove = [
  'src/pages/LocalProvidersPage.jsx.backup',
  'src/pages/LocalProvidersPage_fixed.jsx', 
  'src/components/RegistroClienteFixed.jsx',
  'src/pages/PerfilEmpresaPublicaNew.jsx',
  'src/components/DebugAgentes.jsx',
  'src/components/DebugAgenteSesion.jsx',
  'src/components/AuthDebug.jsx',
  'src/components/ClientProfileDebug.jsx'
];

const docsToMove = [
  'ADMIN_DASHBOARD_SUMMARY.md',
  'ANALISIS_FLUJOS_COMPLETO.md',
  'ARQUITECTURA_COMUNIDAD.md',
  'DEBUG_EMAIL_NO_ENCONTRADO.md',
  'DIAGNOSTICO_ADMIN.md',
  'EVALUACION_CODIGO_COMPLETA.md',
  'EVALUACION_TECNICA_COMPLETA.md',
  'FLUJO_DOS_ETAPAS_AGENTES.md',
  'FLUJO_DOS_ETAPAS_SOLICITUDES.md',
  'GESTION_UNIFICADA_PROVEEDORES.md',
  'GUIA_CREDENCIALES_AGENTES.md',
  'GUIA_IMPLEMENTACION.md',
  'GUIA_TESTING_NOTIFICACIONES.md',
  'GUIA_TESTING.md',
  'IMPLEMENTACION_FLUJO_DOS_ETAPAS.md',
  'IMPLEMENTACION_SISTEMA_AGENTES.md',
  'IMPLEMENTACION_SISTEMA_COMUNIDAD.md',
  'IMPLEMENTACION_SPRINT_1_COMPLETADO.md',
  'IMPLEMENTACIONES_ESPECIFICAS.md',
  'INSTRUCCIONES.md',
  'LIMPIEZA_COMPONENTES_DEBUG.md',
  'MEJORA_PAGINA_PROVEEDORES.md',
  'MEJORAS_FORMULARIO_AGENTE.md',
  'NAVEGACION_HERO_SOLUCIONADO.md',
  'NAVEGACION_USUARIOS_LOGUEADOS.md',
  'PLAN_REORGANIZACION_ADMIN.md',
  'REDISENO_SOLICITUD_COMUNIDAD.md',
  'RELACION_ADMIN_CLIENTES.md',
  'RESUMEN_ROLES_ETAPAS.md',
  'SISTEMA_PERFILES_EMPRESAS.md',
  'SISTEMA_REVISION_AVANZADA_COMPLETO.md',
  'SOLUCION_DASHBOARD_CLIENTE.md',
  'SOLUCION_EMAIL_NO_ENCONTRADO.md',
  'SOLUCION_ERROR_AUTENTICACION_AGENTES.md',
  'SOLUCION_IMAGENES_404.md',
  'SOLUCION_PERMISOS_AGENTE.md',
  'SOLUCION_VEHICULOS.md',
  'SPRINT_2_COMPLETADO.md',
  'TESTING_ERROR_400_AGENTES.md'
];

console.log('🧹 Iniciando limpieza del proyecto...\n');

// Crear carpeta docs si no existe
const docsPath = path.join(__dirname, 'docs');
if (!fs.existsSync(docsPath)) {
  fs.mkdirSync(docsPath);
  console.log('✅ Carpeta docs/ creada');
}

// Remover archivos duplicados
console.log('🗑️  Removiendo archivos duplicados...');
filesToRemove.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`   ✅ Eliminado: ${file}`);
  } else {
    console.log(`   ⚠️  No encontrado: ${file}`);
  }
});

// Mover archivos .md a docs/
console.log('\n📁 Moviendo documentación a docs/...');
docsToMove.forEach(file => {
  const sourcePath = path.join(__dirname, file);
  const destPath = path.join(docsPath, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.renameSync(sourcePath, destPath);
    console.log(`   ✅ Movido: ${file}`);
  } else {
    console.log(`   ⚠️  No encontrado: ${file}`);
  }
});

console.log('\n🎉 Limpieza completada!');
console.log('\n📝 Próximos pasos:');
console.log('   1. Revisar imports rotos por archivos eliminados');
console.log('   2. Reemplazar console.log con Logger');
console.log('   3. Usar constantes centralizadas');
console.log('   4. Probar la aplicación');
