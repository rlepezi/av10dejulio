# 🔄 MIGRACIÓN DEL SISTEMA DE ESTADOS DE EMPRESAS

## 📋 RESUMEN DE CAMBIOS

Se ha unificado y simplificado el sistema de estados de empresas para reflejar el ciclo de vida completo desde el catastro inicial hasta la validación por agentes.

---

## 🎯 **NUEVO SISTEMA UNIFICADO**

### **ESTADOS DE EMPRESA**

| Estado | Descripción | Visible en Home | Puede Gestionar | Próximo Paso |
|--------|-------------|----------------|-----------------|--------------|
| `catalogada` | Empresa del catastro inicial (200+ empresas) | ❌ NO | ❌ NO | Asignar a agente |
| `pendiente_validacion` | Asignada a agente para validación | ❌ NO | ❌ NO | Agente programa visita |
| `en_visita` | Agente programó visita de validación | ❌ NO | ❌ NO | Agente valida en terreno |
| `validada` | Agente validó empresa en terreno | ✅ SÍ | ❌ NO | Admin activa completamente |
| `activa` | Empresa visible y operativa | ✅ SÍ | ✅ SÍ | Operación normal |
| `suspendida` | Temporalmente desactivada | ❌ NO | ❌ NO | Reactivar o desactivar |
| `inactiva` | Permanentemente desactivada | ❌ NO | ❌ NO | Estado final |
| `rechazada` | No cumple requisitos | ❌ NO | ❌ NO | Estado final |

### **ESTADOS DE SOLICITUD**

| Estado | Descripción | Próximo Paso |
|--------|-------------|--------------|
| `pendiente` | Solicitud nueva de proveedor | Revisión administrativa |
| `en_revision` | Bajo revisión administrativa | Aprobar para validación |
| `aprobada` | Aprobada para validación por agente | Asignar a agente |
| `rechazada` | Rechazada administrativamente | Estado final |

---

## 🔄 **FLUJO COMPLETO DE VIDA DE EMPRESA**

### **FLUJO 1: CATÁSTRO INICIAL**
```
Admin importa 200+ empresas → estado: 'catalogada'
```

### **FLUJO 2: VALIDACIÓN POR AGENTE**
```
catalogada → pendiente_validacion → en_visita → validada
```

### **FLUJO 3: ACTIVACIÓN COMPLETA**
```
validada → activa (por admin)
```

### **FLUJO 4: OPERACIÓN**
```
activa ↔ suspendida → inactiva
```

---

## 📊 **MIGRACIÓN DE ESTADOS EXISTENTES**

### **Mapeo Automático**
El sistema automáticamente mapea estados antiguos a nuevos:

| Estado Antiguo | Estado Nuevo |
|----------------|--------------|
| `'enviada'` | `'catalogada'` |
| `'pendiente'` | `'pendiente_validacion'` |
| `'en revisión'` | `'pendiente_validacion'` |
| `'validada'` | `'validada'` |
| `'activa'` | `'activa'` |
| `'activada'` | `'activa'` |
| `'suspendida'` | `'suspendida'` |
| `'inactiva'` | `'inactiva'` |
| `'rechazada'` | `'rechazada'` |

---

## 🛠️ **FUNCIONES NUEVAS**

### **Validación de Transiciones**
```javascript
import { puedeTransicionar } from './utils/empresaStandards.js';

// Verificar si se puede cambiar de estado
const puedeCambiar = puedeTransicionar('pendiente_validacion', 'en_visita');
```

### **Obtener Siguientes Estados**
```javascript
import { obtenerSiguientesEstados } from './utils/empresaStandards.js';

// Obtener estados disponibles
const siguientesEstados = obtenerSiguientesEstados('pendiente_validacion');
// Resultado: ['en_visita', 'rechazada']
```

### **Descripción de Estado**
```javascript
import { obtenerDescripcionEstado } from './utils/empresaStandards.js';

// Obtener descripción
const descripcion = obtenerDescripcionEstado('validada');
// Resultado: 'Agente validó empresa en terreno'
```

---

## 📈 **BENEFICIOS DEL NUEVO SISTEMA**

### **✅ Claridad Total**
- Estados únicos y sin ambigüedades
- Flujo claro desde catastro hasta operación
- Separación clara entre validación y operación

### **✅ Flexibilidad**
- Soporte para empresas del catastro inicial
- Soporte para solicitudes nuevas de proveedores
- Estados específicos para cada etapa del proceso

### **✅ Escalabilidad**
- Fácil agregar nuevos estados si es necesario
- Validación automática de transiciones
- Funciones reutilizables para toda la aplicación

### **✅ Compatibilidad**
- Mapeo automático de estados antiguos
- No requiere migración manual de datos
- Funciona con código existente

---

## 🔧 **IMPLEMENTACIÓN EN COMPONENTES**

### **Componentes que usan estados:**
- `DashboardAgente.jsx` - Validación de empresas
- `EmpresaDetalleAgente.jsx` - Cambio de estados
- `AdminSolicitudesEmpresa.jsx` - Gestión de solicitudes
- `HomePage.jsx` - Mostrar empresas activas
- `CatastroMasivo.jsx` - Crear empresas catalogadas

### **Actualizaciones necesarias:**
1. Importar nuevas constantes de estados
2. Usar funciones de validación de transiciones
3. Actualizar lógica de cambio de estados
4. Usar normalización automática de estados

---

## 🚀 **PRÓXIMOS PASOS**

### **Fase 1: Implementación (Completada)**
- ✅ Definir nuevos estados unificados
- ✅ Crear funciones de validación
- ✅ Implementar mapeo automático

### **Fase 2: Migración de Componentes**
- 🔄 Actualizar componentes principales
- 🔄 Implementar nuevas funciones
- 🔄 Probar flujos completos

### **Fase 3: Testing y Validación**
- ⏳ Probar todos los flujos de estados
- ⏳ Validar migración automática
- ⏳ Verificar compatibilidad

---

## 📝 **NOTAS IMPORTANTES**

1. **No hay pérdida de datos**: Los estados antiguos se mapean automáticamente
2. **Compatibilidad total**: El código existente sigue funcionando
3. **Mejora gradual**: Se puede migrar componente por componente
4. **Validación automática**: Las transiciones inválidas se previenen automáticamente

---

## 🎯 **RESULTADO FINAL**

El nuevo sistema proporciona:
- **Claridad total** en el ciclo de vida de empresas
- **Flexibilidad** para manejar diferentes orígenes (catastro vs solicitudes)
- **Escalabilidad** para futuras mejoras
- **Compatibilidad** con el sistema existente

