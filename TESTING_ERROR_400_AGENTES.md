# GUÍA DE TESTING: Error 400 - Login con Agentes

## 🔧 **TESTING DEL FLUJO DE AGENTES**

### **PASO 1: Verificar Estado Actual**
1. Ve a: `http://localhost:5182/debug-agentes`
2. Verifica si hay agentes en el sistema
3. Si no hay agentes, usa el botón "🔧 Crear Agente de Prueba"

### **PASO 2: Crear Agente de Prueba**
Al hacer clic en "Crear Agente de Prueba" se creará:
- **Email:** `agente.prueba@test.com`
- **Contraseña:** `test123456`
- **Estado:** `requiere_registro: true`

### **PASO 3: Probar el Error 400**
1. Ve a: `http://localhost:5182/login`
2. Intenta hacer login con:
   - Email: `agente.prueba@test.com`
   - Contraseña: `test123456`
3. **RESULTADO ESPERADO:** Error 400 + mensaje sugiriendo registro

### **PASO 4: Probar Detección Automática**
Con las mejoras implementadas en LoginPage:
- El sistema debe detectar que es un agente no registrado
- Debe mostrar mensaje azul: "¿Eres un agente nuevo?"
- Debe ofrecer botón: "Ir a Registro de Agente"

### **PASO 5: Probar Registro de Agente**
1. Haz clic en "Ir a Registro de Agente" O ve directo a:
   `http://localhost:5182/registro-agente`
2. Usa las credenciales:
   - Email: `agente.prueba@test.com`
   - Contraseña: `test123456`
   - Confirmar: `test123456`
3. **RESULTADO ESPERADO:** Registro exitoso + redirección a `/agente`

### **PASO 6: Probar Login Normal**
Después del registro:
1. Ve a: `http://localhost:5182/login`
2. Usa las mismas credenciales
3. **RESULTADO ESPERADO:** Login exitoso + redirección a `/agente`

## 🎯 **ESTADOS ESPERADOS**

### **Antes del Registro:**
```json
{
  "email": "agente.prueba@test.com",
  "requiere_registro": true,
  "password_temporal": "test123456"
}
```
- ❌ **Login falla** → Error 400/invalid-credential
- ✅ **Detección funciona** → Sugiere registro
- ✅ **Registro funciona** → Crea cuenta Firebase Auth

### **Después del Registro:**
```json
{
  "email": "agente.prueba@test.com",
  "requiere_registro": false,
  "uid": "firebase_auth_uid",
  "password_temporal": null
}
```
- ✅ **Login funciona** → Acceso normal
- ✅ **Redirección correcta** → Panel agente

## 🐛 **PROBLEMAS COMUNES Y SOLUCIONES**

### **Error: "auth/invalid-credential"**
- **Causa:** Usuario no existe en Firebase Auth
- **Solución:** Usar `/registro-agente` primero

### **Error: "Email no encontrado en el sistema"**
- **Causa:** No hay agente con ese email en Firestore
- **Solución:** Crear agente desde admin o usar debug

### **Error: "Contraseña no coincide"**
- **Causa:** Password temporal fue cambiada o incorrecta
- **Solución:** Verificar credenciales en debug

### **Error: "auth/email-already-in-use"**
- **Causa:** Email ya registrado en Firebase Auth
- **Solución:** Usar login normal o resetear

## 🧪 **SCRIPTS DE TESTING**

### **Testing Manual Completo:**
```bash
# 1. Crear agente de prueba
http://localhost:5182/debug-agentes
→ Click "Crear Agente de Prueba"

# 2. Verificar error 400
http://localhost:5182/login
→ Usar credenciales agente
→ Confirmar error + detección

# 3. Registrar agente
http://localhost:5182/registro-agente
→ Completar registro
→ Confirmar redirección

# 4. Login normal
http://localhost:5182/login
→ Login exitoso
→ Panel agente
```

## ✅ **CHECKLIST DE VERIFICACIÓN**

### **Flujo Básico:**
- [ ] **Debug page funciona** → Lista agentes correctamente
- [ ] **Crear agente funciona** → Genera agente de prueba
- [ ] **Error 400 se reproduce** → Login falla como esperado
- [ ] **Detección automática** → LoginPage sugiere registro
- [ ] **Registro funciona** → Completa proceso sin errores
- [ ] **Login posterior funciona** → Acceso normal después registro

## 🚀 **RESULTADO ESPERADO**

Al final del testing:
1. ✅ **Error 400 entendido** → Causa identificada
2. ✅ **Flujo implementado** → Registro → Login funciona
3. ✅ **UX mejorada** → Usuario guiado correctamente
4. ✅ **Error solucionado** → Login normal después registro

**El error 400 es ESPERADO y CORRECTO antes del registro. La solución funciona correctamente.**
