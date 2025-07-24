# 🔧 Guía de Depuración: Empresas No Se Visualizan en HomePage

## ❌ **Problema**
Las empresas activas no se están visualizando en la página principal de HomePage.jsx

## 🕵️ **Pasos de Depuración**

### 1. **Abrir Consola del Navegador**
1. Ir a `http://localhost:5174/`
2. Presionar **F12** o **Ctrl+Shift+I**
3. Ir a la pestaña **Console**
4. Recargar la página (**F5**)

### 2. **Revisar Logs en la Consola**
Buscar estos mensajes:

```
🔍 Buscando empresas activas...
🧪 Resultado del test: [objeto con datos]
📊 Empresas con estado "Activa": [número]
📊 Total empresas encontradas: [número]
🏢 Empresa: [nombre] - Estado: "[estado]" - Tipo: [tipo]
✅ Empresas cargadas: [número]
```

### 3. **Casos Posibles y Soluciones**

#### **Caso A: Error de Conexión**
Si ves:
```
❌ Error cargando empresas activas: [error]
```

**Solución**: Problema de conectividad con Firebase
- Verificar que el proyecto Firebase esté configurado correctamente
- Ir a `/firebase-test` para diagnosticar

#### **Caso B: No hay empresas con estado "Activa"**  
Si ves:
```
📊 Empresas con estado "Activa": 0
📊 Empresas con estado "activa": 0
```

**Solución**: Las empresas tienen estados diferentes
- Revisar qué estados aparecen en los logs
- Los estados comunes son: `"activa"`, `"Activa"`, `"pendiente"`, `"rechazada"`

#### **Caso C: Error de índice Firestore**
Si ves:
```
The query requires an index
```

**Solución**: Falta índice en Firestore
- Ir a Firebase Console > Firestore > Indexes
- Crear índice para: Collection `empresas`, Field `estado` ASC, Field `fechaRegistro` DESC

#### **Caso D: Campo fechaRegistro faltante**
Si ves:
```
Field 'fechaRegistro' is missing
```

**Solución**: Algunas empresas no tienen fecha de registro
- Las empresas deben tener campo `fechaRegistro` tipo timestamp

### 4. **Test Manual de Conexión Firebase**

Ir a: `http://localhost:5174/firebase-test`

Verificar que muestre:
- ✅ **Conexión Firebase**: Conectado
- ✅ **Empresas**: X documentos encontrados

### 5. **Verificar Datos en Firebase Console**

1. **Ir a Firebase Console**
2. **Firestore Database > Datos**
3. **Colección `empresas`**
4. **Verificar que existan documentos con**:
   - ✅ Campo `estado`: `"Activa"` o `"activa"`
   - ✅ Campo `nombre`: Con nombre válido
   - ✅ Campo `fechaRegistro`: Con timestamp

### 6. **Estados de Debug Temporales**

En la página principal debería aparecer:
```
Total empresas: X | Filtradas: Y
```

- Si **Total empresas: 0** → Problema de consulta Firebase
- Si **Total empresas: 5 | Filtradas: 0** → Problema de filtros
- Si **Total empresas: 5 | Filtradas: 5** → Las empresas deberían mostrarse

## 🛠️ **Soluciones Rápidas**

### **Solución 1: Reglas de Firestore**
En Firebase Console > Firestore > Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /empresas/{document} {
      allow read: if true;  // Permitir lectura pública
    }
  }
}
```

### **Solución 2: Actualizar Estados de Empresas**
Si las empresas tienen estados diferentes, actualizar en Firebase:
```javascript
// Cambiar todos los estados a "Activa"
UPDATE empresas SET estado = "Activa" WHERE estado != "Activa"
```

### **Solución 3: Crear Datos de Prueba**
Agregar empresa de prueba en Firebase Console:
```javascript
{
  "nombre": "Empresa Test",
  "estado": "Activa",
  "tipoEmpresa": "proveedor", 
  "ciudad": "Santiago",
  "region": "Metropolitana",
  "fechaRegistro": [timestamp actual],
  "descripcion": "Empresa de prueba"
}
```

## 📝 **Reportar Resultados**

Una vez ejecutados los pasos, reportar:
1. **¿Qué aparece en la consola?**
2. **¿Cuántas empresas hay en Firebase?**
3. **¿Qué estados tienen las empresas?**
4. **¿Funciona `/firebase-test`?**

Con esta información se puede identificar exactamente dónde está el problema.
