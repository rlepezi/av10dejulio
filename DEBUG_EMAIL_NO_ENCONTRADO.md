# DEBUG: PROBLEMA DE AGENTE "EMAIL NO ENCONTRADO"

## 🚨 PROBLEMA REPORTADO

Al intentar registrarse como agente por primera vez con las credenciales proporcionadas por el admin, aparece el error:

```
Email no encontrado
Este email no está registrado como agente en el sistema.
Contacta al administrador para que te agregue como agente.
```

Pero desde el admin SÍ se ve el agente como activo.

## 🔍 PASOS PARA DEBUGGEAR

### **Paso 1: Verificar agentes en el sistema**
1. Ve a `/registro-agente`
2. Haz clic en el botón **"🔧 Debug: Ver agentes en sistema"**
3. Revisa la consola del navegador (F12 → Console)
4. Anota cuántos agentes aparecen y sus propiedades

### **Paso 2: Comparar datos del agente**
Verifica estos campos en la consola:
- ✅ **email**: ¿Coincide exactamente con el que intentas usar?
- ✅ **requiere_registro**: ¿Está en `true`?
- ✅ **activo**: ¿Está en `true`?
- ✅ **password_temporal**: ¿Existe?

### **Paso 3: Probar el proceso de búsqueda**
1. Ingresa el email exacto en el formulario
2. Haz clic "Completar Registro"
3. Revisa la consola para ver los logs de búsqueda:
   ```
   🔍 Buscando agente con email: [email]
   📊 Agentes que requieren registro encontrados: [número]
   ```

## 🔧 POSIBLES CAUSAS Y SOLUCIONES

### **Causa 1: Email con espacios o caracteres especiales**
```javascript
// PROBLEMA: "juan@empresa.com " (espacio al final)
// SOLUCIÓN: Trim en la búsqueda
```

### **Causa 2: Case sensitivity**
```javascript
// PROBLEMA: Admin creó "Juan@Empresa.com" pero buscas "juan@empresa.com"
// SOLUCIÓN: Normalizar a lowercase
```

### **Causa 3: Campo requiere_registro no establecido**
```javascript
// PROBLEMA: requiere_registro es undefined en lugar de true
// SOLUCIÓN: Verificar creación desde admin
```

### **Causa 4: Error de conectividad con Firestore**
```javascript
// PROBLEMA: Query no se ejecuta correctamente
// SOLUCIÓN: Verificar reglas de Firestore
```

## 🛠️ VERSIÓN MEJORADA DE BÚSQUEDA

He agregado una versión mejorada de `buscarAgenteEnSistema` que:

1. **Hace logs detallados** de cada paso de búsqueda
2. **Normaliza el email** (trim + lowercase)
3. **Busca sin filtros** si no encuentra con filtros
4. **Muestra todos los agentes** con ese email para comparar

## 📋 QUÉ HACER AHORA

1. **Prueba el botón de debug** en `/registro-agente`
2. **Revisa la consola** para ver qué agentes existen
3. **Compara el email exacto** que intentas usar vs el que aparece en el sistema
4. **Verifica el campo `requiere_registro`** del agente
5. **Reporta los resultados** para ajustar la solución

## 🚀 SOLUCIÓN TEMPORAL

Si necesitas acceso inmediato:

1. **Admin puede cambiar** `requiere_registro` a `false` temporalmente
2. **Agente usa login normal** en lugar de registro
3. **Después se corrige** el flujo de registro

## 📝 LOGS ESPERADOS

Cuando funcione correctamente, deberías ver:

```
🔍 Buscando agente con email: juan@empresa.com
📊 Agentes que requieren registro encontrados: 1
✅ Agente encontrado (requiere registro): {id: "xxx", email: "juan@empresa.com", requiere_registro: true}
```

Si ves `0` agentes encontrados, entonces hay un problema en la creación o búsqueda.
