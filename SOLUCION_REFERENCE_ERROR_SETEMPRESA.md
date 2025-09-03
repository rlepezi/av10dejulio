# Solución: ReferenceError: setEmpresa is not defined

## Problema
El usuario reportó el siguiente error en `http://localhost:5173/admin/editar-empresa/Wextq8ACpfH45eaM4PWl`:

```
Error al guardar cambios: ReferenceError: setEmpresa is not defined at handleSave (EditarEmpresaAdmin.jsx:539:7)
```

## Causa del Error
El error ocurría en el componente `InformacionGeneral` (sub-componente de `EditarEmpresaAdmin`) en la función `handleSave`. El problema era que:

1. **`setEmpresa`** es una función de estado (state setter) que pertenece al componente padre `EditarEmpresaAdmin`
2. **`InformacionGeneral`** es un sub-componente que no tiene acceso directo a `setEmpresa`
3. El sub-componente estaba intentando llamar `setEmpresa(prev => ({ ...prev, ...cambios }))` directamente
4. Esto viola el patrón de comunicación padre-hijo en React

## Solución Implementada
Se eliminó la llamada directa a `setEmpresa` del sub-componente `InformacionGeneral`:

### Antes (Código problemático):
```javascript
// Guardar todos los cambios en una sola operación
await onUpdate('multiple', cambios);

// Actualizar el estado local
// Actualizar estado local
setEmpresa(prev => ({ ...prev, ...cambios })); // ❌ ERROR: setEmpresa no está definido

// Mostrar mensaje de éxito
setMensajeExito('✅ Cambios guardados exitosamente');
```

### Después (Código corregido):
```javascript
// Guardar todos los cambios en una sola operación
await onUpdate('multiple', cambios);

// Mostrar mensaje de éxito
setMensajeExito('✅ Cambios guardados exitosamente');
```

## ¿Por qué Funciona Ahora?
1. **`onUpdate('multiple', cambios)`** llama a `handleUpdateEmpresa` en el componente padre
2. **`handleUpdateEmpresa`** ya maneja la actualización del estado local con `setEmpresa`:
   ```javascript
   // Si es una actualización múltiple
   if (campo === 'multiple' && typeof valor === 'object') {
     // ... actualización en Firestore ...
     
     // Actualizar estado local con todos los cambios
     setEmpresa(prev => ({ ...prev, ...valor })); // ✅ CORRECTO: en el componente padre
   }
   ```
3. El estado se actualiza correctamente en el componente padre
4. El sub-componente se re-renderiza automáticamente con los nuevos datos a través de props

## Flujo de Datos Correcto
```
InformacionGeneral.handleSave() 
  → onUpdate('multiple', cambios) 
    → EditarEmpresaAdmin.handleUpdateEmpresa() 
      → setEmpresa() [en el padre]
        → Re-render del InformacionGeneral con nuevos datos
```

## Beneficios de la Solución
1. **Resuelve el error** de `ReferenceError: setEmpresa is not defined`
2. **Mantiene la separación de responsabilidades** entre componentes padre e hijo
3. **Preserva la funcionalidad** de actualización múltiple
4. **Sigue las mejores prácticas** de React para comunicación entre componentes
5. **Evita duplicación** de lógica de actualización de estado

## Verificación
- ✅ El error `ReferenceError: setEmpresa is not defined` ya no ocurre
- ✅ Los cambios se guardan correctamente en Firestore
- ✅ El estado local se actualiza correctamente
- ✅ La interfaz se re-renderiza con los nuevos datos
- ✅ Los mensajes de éxito/error se muestran correctamente

## Archivos Modificados
- `src/components/EditarEmpresaAdmin.jsx` - Eliminada la llamada incorrecta a `setEmpresa` en `InformacionGeneral.handleSave()`

## Nota Importante
Esta solución mantiene la funcionalidad existente mientras corrige el error de arquitectura. El componente `InformacionGeneral` sigue funcionando correctamente a través del patrón de comunicación estándar de React (props y callbacks).
