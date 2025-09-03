# Solución: Inconsistencia de Estados de Empresa

## Problema Identificado

El usuario reportó una inconsistencia en la visualización del estado de una empresa específica (`CMZRjheYUp0eoxRLA1fX`):

- **En la vista del agente** (`/agente/empresa/CMZRjheYUp0eoxRLA1fX`): La empresa aparecía como "Validada"
- **En la vista del admin** (`/admin/empresas`): La empresa aparecía como "Activa"

## Análisis del Problema

### Causa Raíz

El problema se debía a que dos componentes diferentes estaban usando sistemas de estados incompatibles:

1. **`EmpresaDetalleAgente.jsx`**: Utilizaba los estados estandarizados de `empresaStandards.js` (como `ESTADOS_EMPRESA.VALIDADA`)

2. **`GestionEmpresas.jsx`**: Utilizaba su propio sistema local de estados con definiciones incompletas:
   ```javascript
   const ESTADOS_EMPRESA = [
     { label: "Todos", value: "todos" },
     { label: "Activa", value: "Activa" },
     { label: "Inactiva", value: "inactiva" },
     { label: "Suspendida", value: "suspendida" }
   ];
   ```

### Estados No Reconocidos

El componente `GestionEmpresas.jsx` no reconocía estados como:
- `validada`
- `pendiente_validacion`
- `en_visita`
- `catalogada`
- `rechazada`

Por lo tanto, cuando una empresa tenía el estado `validada` (estandarizado), el admin lo mostraba como "Sin estado" o lo interpretaba incorrectamente.

## Solución Implementada

### 1. Migración a Estados Estandarizados

**Archivo**: `src/components/GestionEmpresas.jsx`

#### Cambios Realizados:

1. **Importación de estados estandarizados**:
   ```javascript
   import { ESTADOS_EMPRESA, obtenerDescripcionEstado, puedeTransicionar } from "../utils/empresaStandards";
   ```

2. **Actualización de la función `colorEstado`**:
   ```javascript
   function colorEstado(estado) {
     if (!estado) return "bg-gray-200 text-gray-700";
     
     // Normalizar el estado para comparación
     const estadoNormalizado = estado.toLowerCase();
     
     switch (estadoNormalizado) {
       case "activa":
       case "activo":
         return "bg-green-100 text-green-700";
       case "validada":
         return "bg-blue-100 text-blue-700";
       case "pendiente_validacion":
       case "pendiente de validación":
         return "bg-yellow-100 text-yellow-700";
       case "en_visita":
       case "en visita":
         return "bg-purple-100 text-purple-700";
       case "catalogada":
         return "bg-indigo-100 text-indigo-700";
       case "inactiva":
       case "inactivo":
         return "bg-red-200 text-red-800";
       case "suspendida":
       case "suspendido":
         return "bg-orange-200 text-orange-800";
       case "rechazada":
         return "bg-red-300 text-red-900";
       default:
         return "bg-gray-100 text-gray-700";
     }
   }
   ```

3. **Reemplazo de `ESTADOS_EMPRESA` local por `ESTADOS_FILTRO`**:
   ```javascript
   const ESTADOS_FILTRO = [
     { label: "Todos", value: "todos" },
     { label: "Catalogada", value: ESTADOS_EMPRESA.CATALOGADA },
     { label: "Pendiente de Validación", value: ESTADOS_EMPRESA.PENDIENTE_VALIDACION },
     { label: "En Visita", value: ESTADOS_EMPRESA.EN_VISITA },
     { label: "Validada", value: ESTADOS_EMPRESA.VALIDADA },
     { label: "Activa", value: ESTADOS_EMPRESA.ACTIVA },
     { label: "Suspendida", value: ESTADOS_EMPRESA.SUSPENDIDA },
     { label: "Inactiva", value: ESTADOS_EMPRESA.INACTIVA },
     { label: "Rechazada", value: ESTADOS_EMPRESA.RECHAZADA }
   ];
   ```

4. **Actualización de la función `toggleEstado`**:
   ```javascript
   const toggleEstado = async (empresa) => {
     try {
       // Determinar el nuevo estado basado en el estado actual
       let nuevoEstado;
       if (empresa.estado === ESTADOS_EMPRESA.ACTIVA) {
         nuevoEstado = ESTADOS_EMPRESA.INACTIVA;
       } else if (empresa.estado === ESTADOS_EMPRESA.INACTIVA) {
         nuevoEstado = ESTADOS_EMPRESA.ACTIVA;
       } else if (empresa.estado === ESTADOS_EMPRESA.VALIDADA) {
         nuevoEstado = ESTADOS_EMPRESA.ACTIVA;
       } else if (empresa.estado === ESTADOS_EMPRESA.CATALOGADA) {
         nuevoEstado = ESTADOS_EMPRESA.PENDIENTE_VALIDACION;
       } else {
         nuevoEstado = ESTADOS_EMPRESA.ACTIVA;
       }

       await updateDoc(doc(db, "empresas", empresa.id), {
         estado: nuevoEstado,
         fecha_actualizacion: new Date()
       });
       alert(`Empresa ${obtenerDescripcionEstado(nuevoEstado)} exitosamente`);
     } catch (error) {
       console.error('Error cambiando estado:', error);
       alert('Error al cambiar el estado');
     }
   };
   ```

5. **Actualización de estadísticas**:
   ```javascript
   const estadisticas = {
     total: empresas.length,
     catalogadas: empresas.filter(e => e.estado === ESTADOS_EMPRESA.CATALOGADA).length,
     pendientes: empresas.filter(e => e.estado === ESTADOS_EMPRESA.PENDIENTE_VALIDACION).length,
     enVisita: empresas.filter(e => e.estado === ESTADOS_EMPRESA.EN_VISITA).length,
     validadas: empresas.filter(e => e.estado === ESTADOS_EMPRESA.VALIDADA).length,
     activas: empresas.filter(e => e.estado === ESTADOS_EMPRESA.ACTIVA).length,
     suspendidas: empresas.filter(e => e.estado === ESTADOS_EMPRESA.SUSPENDIDA).length,
     inactivas: empresas.filter(e => e.estado === ESTADOS_EMPRESA.INACTIVA).length,
     rechazadas: empresas.filter(e => e.estado === ESTADOS_EMPRESA.RECHAZADA).length,
     sinWeb: empresas.filter(e => !e.web).length,
     sinLogo: empresas.filter(e => !e.logoAsignado).length
   };
   ```

6. **Actualización de la interfaz de estadísticas**:
   - Agregadas nuevas categorías: Catalogadas, Pendientes, En Visita, Validadas
   - Mejorada la visualización con colores distintivos para cada estado

### 2. Beneficios de la Solución

1. **Consistencia**: Todos los componentes ahora usan el mismo sistema de estados
2. **Visibilidad completa**: El admin puede ver todos los estados posibles de las empresas
3. **Mejor UX**: Colores distintivos y estadísticas más detalladas
4. **Mantenibilidad**: Un solo punto de verdad para los estados de empresa

### 3. Estados Ahora Reconocidos

- ✅ **Catalogada**: Empresas importadas inicialmente
- ✅ **Pendiente de Validación**: Esperando asignación de agente
- ✅ **En Visita**: Agente asignado, en proceso de validación
- ✅ **Validada**: Validada por agente, pendiente activación
- ✅ **Activa**: Empresa activa y visible al público
- ✅ **Suspendida**: Temporalmente suspendida
- ✅ **Inactiva**: Desactivada
- ✅ **Rechazada**: Rechazada por agente o admin

## Verificación

Después de la implementación:

1. **Empresa `CMZRjheYUp0eoxRLA1fX`**: Ahora debería aparecer como "Validada" tanto en la vista del agente como en la del admin
2. **Estadísticas**: El admin verá estadísticas detalladas de todos los estados
3. **Filtros**: El admin puede filtrar por cualquier estado estandarizado
4. **Colores**: Cada estado tiene su color distintivo para mejor identificación

## Conclusión

La inconsistencia se ha resuelto unificando el sistema de estados en toda la aplicación. Ahora tanto agentes como administradores ven los mismos estados con la misma interpretación, eliminando confusiones y mejorando la experiencia de usuario.

