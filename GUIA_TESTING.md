# Guía de Testing - Sistema Unificado AV10 de Julio

## 🧪 Casos de Prueba Prioritarios

### 1. **Registro Unificado de Empresas**

#### Test: Registro de Proveedor
```
✅ Navegar a /registro-empresa
✅ Seleccionar tipo "Proveedor Automotriz"
✅ Completar formulario paso a paso
✅ Validar que aparezcan opciones de servicio web
✅ Verificar envío exitoso
✅ Confirmar redirección y mensaje de éxito
```

#### Test: Registro de PyME
```
✅ Navegar a /registro-empresa
✅ Seleccionar tipo "PyME Automotriz"
✅ Completar formulario (sin opciones web)
✅ Verificar campos específicos para PyME
✅ Confirmar envío a colección correcta
```

#### Test: Compatibilidad Legacy
```
✅ Navegar a /registro-proveedor (debe mostrar form unificado)
✅ Navegar a /registro-pyme (debe mostrar form unificado)
✅ Navegar a /postular-empresa (debe mostrar form unificado)
```

### 2. **Búsqueda Unificada**

#### Test: Vista Unificada
```
✅ Navegar a / (home)
✅ Activar "Búsqueda Unificada"
✅ Buscar término general (ej: "Toyota")
✅ Verificar resultados combinados: empresas + productos + campañas
✅ Aplicar filtros por tipo de contenido
✅ Verificar filtros por tipo de empresa
```

#### Test: Vista Clásica
```
✅ Navegar a / (home)
✅ Activar "Vista Clásica"
✅ Verificar funcionalidad original
✅ Confirmar listados separados funcionando
✅ Toggle entre vistas funcional
```

### 3. **Listado Unificado de Empresas**

#### Test: Integración de Fuentes
```
✅ Verificar que aparezcan empresas legacy
✅ Verificar solicitudes aprobadas de proveedores
✅ Verificar solicitudes aprobadas de empresas
✅ Confirmar badges diferenciadores
✅ Validar filtros por tipo de empresa
```

#### Test: Funcionalidad de Cards
```
✅ Click en empresa debe funcionar
✅ Enlaces de contacto (WhatsApp, email) operativos
✅ Información completa mostrada
✅ Badges de verificación correctos
```

### 4. **Flujo Completo Admin**

#### Test: Gestión de Solicitudes
```
✅ Login como admin
✅ Navegar a /admin/solicitudes-proveedor
✅ Verificar nuevas solicitudes aparecen
✅ Aprobar una solicitud
✅ Verificar que aparece en listado público
✅ Verificar badges "Verificado"
```

#### Test: Panel de Admin
```
✅ Verificar todas las rutas admin funcionan
✅ Confirmar funcionalidades existentes
✅ Validar nuevas opciones integradas
```

## 🔧 Testing Técnico

### Validaciones de Base de Datos

#### Estructura de Solicitudes
```javascript
// Verificar en Firebase Console
colecciones: {
  "solicitudes_proveedor": {
    // Solicitudes de proveedores con servicios web
    tipoEmpresa: "proveedor",
    requiereServicioWeb: true/false,
    tipoServicioWeb: "basico|intermedio|completo"
  },
  "solicitudes_empresa": {
    // Otras empresas (pyme, emprendimiento, etc.)
    tipoEmpresa: "pyme|emprendimiento|taller|distribuidor"
  }
}
```

#### Campos Críticos
```
✅ nombreEmpresa (requerido)
✅ tipoEmpresa (requerido)
✅ sectorAutomotriz (requerido)
✅ regionesComunas (válidas)
✅ fechaSolicitud (timestamp)
✅ estado: "pendiente" (inicial)
```

### Performance Testing

#### Búsqueda Unificada
```
✅ Tiempo de respuesta < 2 segundos
✅ Filtros responsive en tiempo real
✅ Memoria: sin memory leaks
✅ Scroll infinito si muchos resultados
```

#### Listados
```
✅ Carga inicial < 3 segundos
✅ Imágenes con lazy loading
✅ Paginación efectiva si >50 items
```

## 🐛 Casos Edge y Errores Comunes

### Registro de Empresa

#### Errores Esperados
```
❌ Campos requeridos vacíos → Mensaje claro
❌ Email duplicado → "Ya existe solicitud con este email"
❌ Conexión Firebase fallida → Reintento automático
❌ Región/comuna inválida → Validación en frontend
```

#### Casos Edge
```
🔍 Formulario muy largo → Progress bar visible
🔍 Usuario sale y vuelve → Datos no perdidos (localStorage)
🔍 Conexión lenta → Loading states apropiados
🔍 JavaScript deshabilitado → Graceful degradation
```

### Búsqueda Unificada

#### Casos Complejos
```
🔍 Búsqueda vacía → Mostrar todo ordenado
🔍 Sin resultados → Mensaje útil + sugerencias
🔍 Muchos filtros activos → Performance OK
🔍 Caracteres especiales → Sanitización correcta
```

### Compatibilidad

#### Navegadores
```
✅ Chrome (últimas 2 versiones)
✅ Firefox (últimas 2 versiones)
✅ Safari (macOS/iOS)
✅ Edge (últimas 2 versiones)
```

#### Dispositivos
```
✅ Desktop (1920x1080+)
✅ Tablet (768px - 1024px)
✅ Mobile (320px - 767px)
✅ Touch interactions
```

## 📊 Métricas a Monitorear

### Adopción
- % usuarios que usan búsqueda unificada vs clásica
- Tiempo promedio en registro unificado vs legacy
- Tasa de completación de formularios

### Performance
- Tiempo de carga de búsqueda unificada
- Tiempo de respuesta de filtros
- Errores de JavaScript (console.log)

### Funcionalidad
- Solicitudes enviadas exitosamente
- Solicitudes aprobadas por admin
- Empresas apareciendo en listado público

## 🚀 Checklist de Deploy

### Pre-Deploy
```
✅ Todos los tests manuales pasados
✅ No hay errores en console
✅ Performance aceptable
✅ Responsive design OK
✅ Datos de prueba limpiados
```

### Post-Deploy
```
✅ Verificar en producción
✅ Monitor de errores activado
✅ Analytics configurado
✅ Backup de Firebase realizado
✅ Documentación actualizada
```

### Rollback Plan
```
1. Revertir App.jsx a versión anterior
2. Reactivar rutas legacy
3. Deshabilitar componentes nuevos
4. Mantener datos intactos
```

---

## 📞 Contacto para Issues

En caso de problemas durante testing:
1. Verificar console de navegador
2. Revisar Firebase Console
3. Consultar logs de errores
4. Documentar pasos para reproducir

**Prioridad Alta**: Registro de empresas, login/logout, búsqueda básica
**Prioridad Media**: Filtros avanzados, responsive design
**Prioridad Baja**: Animaciones, optimizaciones menores
