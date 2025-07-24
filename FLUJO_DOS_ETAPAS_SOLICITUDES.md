# FLUJO DE SOLICITUDES DE EMPRESAS - DOS ETAPAS

## Descripción General

Se ha implementado un nuevo flujo de gestión de solicitudes de empresas con **dos etapas** claramente diferenciadas para mejorar el control administrativo y la experiencia del usuario.

## Estados de Solicitudes

### 1. `pendiente`
- **Descripción**: Solicitud recién creada, esperando revisión inicial
- **Acciones disponibles**: 
  - Pasar a revisión
  - Rechazar
  - Activar directamente (solo agentes con permisos)

### 2. `en_revision`
- **Descripción**: Solicitud bajo revisión administrativa
- **Acciones disponibles**:
  - **Activar empresa** (Primera etapa - visible en home)
  - Rechazar

### 3. `activada` ⭐ PRIMERA ETAPA
- **Descripción**: Empresa activada y visible en el home público
- **Características**:
  - Los usuarios pueden encontrar la empresa en búsquedas
  - La empresa aparece en listados públicos
  - Información de contacto visible
  - **AÚN NO** puede gestionar su información
- **Próximo paso**: Asignar credenciales

### 4. `credenciales_asignadas` ⭐ SEGUNDA ETAPA
- **Descripción**: Proceso completado - empresa con acceso total
- **Características**:
  - Empresa visible en el home
  - Tiene usuario y contraseña asignados
  - Puede acceder a su panel de administración
  - Puede gestionar: campañas, horarios, información, galería, etc.

### 5. `rechazada`
- **Descripción**: Solicitud rechazada y no procesada

## Flujo de Trabajo

### Para el Administrador

#### Primera Etapa: Activación
1. Revisar solicitud en estado `pendiente` o `en_revision`
2. Clic en **"🎯 Activar Empresa (Visible en Home)"**
3. La empresa queda **visible en el home** inmediatamente
4. Estado cambia a `activada`

#### Segunda Etapa: Asignación de Credenciales
1. Para solicitudes en estado `activada`
2. Clic en **"🔑 Asignar Credenciales de Acceso"**
3. Llenar formulario:
   - Email de acceso (recomendado: email del representante)
   - Contraseña (manual o generada automáticamente)
   - Confirmar contraseña
4. La empresa puede ahora **gestionar su información**
5. Estado cambia a `credenciales_asignadas`

### Para los Agentes de Campo

Los agentes pueden:
- Crear solicitudes desde terreno
- **Activar directamente** empresas validadas (si tienen permisos)
- Las empresas activadas por agentes quedan en estado `activada` (primera etapa)
- El admin debe completar la segunda etapa asignando credenciales

## Ventajas del Nuevo Flujo

### ✅ Para los Usuarios Finales
- **Disponibilidad inmediata**: Las empresas son visibles tan pronto como se activan
- **Mejor experiencia**: Pueden encontrar proveedores rápidamente
- **Información actualizada**: Los datos de contacto están disponibles inmediatamente

### ✅ Para los Administradores
- **Control de calidad**: Separación entre visibilidad y gestión autónoma
- **Proceso gradual**: Tiempo para verificar credenciales antes de dar acceso total
- **Seguridad**: No se crean usuarios automáticamente sin revisión
- **Flexibilidad**: Puede activar empresas sin presión de completar credenciales inmediatamente

### ✅ Para las Empresas
- **Visibilidad rápida**: Aparecen en búsquedas tan pronto como se activan
- **Acceso controlado**: Reciben credenciales solo después de verificación completa
- **Proceso claro**: Saben exactamente en qué etapa están

## Implementación Técnica

### Nuevos Campos en `empresas`
```javascript
{
  etapa_proceso: 'activada_sin_credenciales' | 'credenciales_asignadas',
  tiene_credenciales_asignadas: boolean,
  usuario_empresa: {
    email: string,
    fecha_asignacion: Date,
    admin_asignador: string
  } | null,
  fecha_credenciales_asignadas: Date
}
```

### Nuevos Campos en `solicitudes_empresa`
```javascript
{
  usuario_asignado: {
    email: string,
    fecha_asignacion: Date
  } | null,
  fecha_credenciales_asignadas: Date,
  admin_credenciales: string
}
```

## Estadísticas Disponibles

El panel de solicitudes ahora muestra:
- **Total**: Todas las solicitudes
- **Pendientes**: Esperando revisión inicial  
- **En Revisión**: Bajo evaluación administrativa
- **Activadas**: Visibles en home, pendientes de credenciales
- **Con Credenciales**: Proceso completado
- **Rechazadas**: No procesadas

## Próximos Pasos Recomendados

1. **Integración con Firebase Auth**: Crear usuarios automáticamente al asignar credenciales
2. **Notificaciones**: Enviar emails cuando se asignan credenciales
3. **Panel de empresa**: Crear interface para que las empresas gestionen su información
4. **Validaciones**: Verificar RUT, dirección, etc.
5. **Analytics**: Seguimiento de conversión de solicitudes

---

**Fecha de implementación**: Julio 2025  
**Versión**: 2.0 - Flujo de dos etapas
