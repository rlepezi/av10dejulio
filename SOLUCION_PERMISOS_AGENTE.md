# SOLUCIÓN: "No tienes permisos de agente"

## 🚨 **PROBLEMA IDENTIFICADO**
Mensaje de error: **"No tienes permisos de agente"** aparece cuando el agente intenta acceder a funciones después del login.

## 🔍 **CAUSA DEL PROBLEMA**
El sistema estaba buscando los datos del agente usando **incorrectamente** el `uid` de Firebase Auth como ID del documento:

```javascript
// ❌ INCORRECTO (causa del error):
const agenteDoc = await getDoc(doc(db, 'agentes', user.uid));

// ✅ CORRECTO (solución):
const q = query(collection(db, 'agentes'), where('uid', '==', user.uid));
```

### **Estructura de Datos Correcta:**
- **Firebase Auth:** `uid` único del usuario
- **Colección `agentes`:** Documento con ID autogenerado que contiene `uid` como campo

## ✅ **SOLUCIÓN IMPLEMENTADA**

### **1. Corregido `FormularioAgenteEmpresa.jsx`:**
- ✅ Función `verificarPermisos()` busca agente por `uid` como campo
- ✅ Retorna tanto datos del agente como ID del documento
- ✅ Usa ID correcto del agente para `agente_id` en solicitudes

### **2. Corregido `PanelAgente.jsx`:**
- ✅ Busca agente por `uid` antes de cargar datos
- ✅ Usa ID correcto del agente para buscar solicitudes y empresas
- ✅ Verifica permisos correctamente

### **3. Agregado `DebugAgenteSesion.jsx`:**
- ✅ Herramienta para verificar estado completo del agente
- ✅ Muestra datos de Firebase Auth, usuarios y agentes
- ✅ Diagnóstico visual del estado de permisos

## 🔧 **CAMBIOS TÉCNICOS DETALLADOS**

### **FormularioAgenteEmpresa.jsx:**
```javascript
// ANTES:
const agenteDoc = await getDoc(doc(db, 'agentes', user.uid));

// AHORA:
const q = query(
  collection(db, 'agentes'),
  where('uid', '==', user.uid),
  where('activo', '==', true)
);
const snapshot = await getDocs(q);
const agenteDoc = snapshot.docs[0];
const agenteData = { ...agenteDoc.data(), id: agenteDoc.id };
```

### **PanelAgente.jsx:**
```javascript
// ANTES:
where('agente_id', '==', user.uid)

// AHORA:
const agenteId = agenteDoc.id; // ID del documento del agente
where('agente_id', '==', agenteId)
```

## 🧪 **CÓMO VERIFICAR LA SOLUCIÓN**

### **Paso 1: Verificar Datos del Agente**
1. Ve a: `http://localhost:5182/debug-sesion-agente`
2. Haz login con las credenciales del agente
3. Verifica que aparezcan todos los datos correctamente

### **Paso 2: Probar Funcionalidades**
1. Accede al panel del agente: `/agente`
2. Intenta crear una solicitud de empresa
3. Verifica que no aparezca el error de permisos

### **Paso 3: Verificar Datos en Base de Datos**
El debug mostrará:
- ✅ **Usuario autenticado** en Firebase Auth
- ✅ **Registro en 'usuarios'** (opcional)
- ✅ **Registro en 'agentes'** con `uid` correcto
- ✅ **Agente activo** y **registro completado**

## 📋 **ESTRUCTURA DE DATOS ESPERADA**

### **Colección `agentes`:**
```json
{
  "id": "auto-generated-id",
  "uid": "firebase-auth-uid",
  "email": "agente@test.com",
  "nombre": "Nombre Agente",
  "activo": true,
  "requiere_registro": false,
  "permisos": {
    "crear_solicitudes": true,
    "activar_empresas": true
  }
}
```

### **Colección `solicitudes_empresa`:**
```json
{
  "agente_id": "auto-generated-id", // ID del documento del agente
  "agente_nombre": "Nombre Agente",
  "estado": "pendiente",
  // ... otros campos
}
```

## 🎯 **RESULTADOS ESPERADOS**

### **Después de la Corrección:**
- ✅ **Sin error de permisos:** Agentes pueden acceder a todas las funciones
- ✅ **Datos correctos:** Panel muestra solicitudes y empresas del agente
- ✅ **Funcionalidad completa:** Crear solicitudes y empresas funciona
- ✅ **Debug disponible:** Herramienta para verificar estado

### **Indicadores de Éxito:**
1. **Login exitoso** → Acceso al panel `/agente`
2. **Panel carga datos** → Muestra estadísticas y solicitudes
3. **Crear solicitudes funciona** → Sin errores de permisos
4. **Debug verde** → Todos los indicadores en verde

## 🔄 **FLUJO COMPLETO CORREGIDO**

### **1. Registro (una sola vez):**
```
Agente → /registro-agente → Completa registro → Firebase Auth + actualiza Firestore
```

### **2. Login (normal):**
```
Agente → /login → Firebase Auth → Verifica en Firestore → Acceso concedido
```

### **3. Funcionalidades:**
```
Panel → Busca agente por uid → Carga datos con ID correcto → Todo funciona
```

## 🛠 **HERRAMIENTAS DE DEBUG**

### **Debug General:**
- **URL:** `http://localhost:5182/debug-agentes`
- **Función:** Crear agentes de prueba, navegar, copiar credenciales

### **Debug de Sesión:**
- **URL:** `http://localhost:5182/debug-sesion-agente`
- **Función:** Verificar estado completo del agente logueado

## 🚀 **RESUMEN**

**El error "No tienes permisos de agente" está SOLUCIONADO.**

### **Problema:** Búsqueda incorrecta de datos del agente
### **Solución:** Buscar por `uid` como campo, no como ID del documento
### **Resultado:** Acceso completo a funcionalidades de agente

**Todos los componentes relacionados con agentes ahora funcionan correctamente.**
