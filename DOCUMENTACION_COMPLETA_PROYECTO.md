# 📚 DOCUMENTACIÓN COMPLETA DEL PROYECTO AV10 DE JULIO

## 🏗️ ARQUITECTURA GENERAL

### Tecnologías Utilizadas
- **Frontend**: React.js 18.2.0 con Vite 4.5.0
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Estilos**: Tailwind CSS 3.4.17
- **Rutas**: React Router DOM 7.6.2
- **Estado**: Context API + React Hooks
- **Autenticación**: Firebase Auth
- **Base de Datos**: Firestore (NoSQL)
- **Almacenamiento**: Firebase Storage
- **Notificaciones**: Firebase Messaging

### Estructura del Proyecto
```
av10dejulio-frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   ├── pages/              # Páginas principales
│   ├── hooks/              # Hooks personalizados
│   ├── utils/              # Utilidades y funciones
│   ├── constants/          # Constantes globales
│   ├── services/           # Servicios de API
│   ├── styles/             # Estilos globales
│   ├── firebase.js         # Configuración de Firebase
│   └── App.jsx             # Componente principal
├── public/                 # Archivos estáticos
├── package.json            # Dependencias del proyecto
└── README.md               # Documentación básica
```

---

## 🔐 SISTEMA DE AUTENTICACIÓN Y ROLES

### Roles de Usuario
```javascript
export const USER_ROLES = {
  ADMIN: 'admin',           // Administrador del sistema
  AGENTE: 'agente',         // Agente de campo
  PROVEEDOR: 'proveedor',   // Empresa proveedora
  CLIENTE: 'cliente',       // Cliente final
  MECANICO: 'mecanico'      // Mecánico especializado
};
```

### Flujo de Autenticación
1. **Login**: Usuario ingresa credenciales
2. **Verificación**: Firebase Auth valida credenciales
3. **Asignación de Rol**: Se consulta Firestore para obtener rol del usuario
4. **Redirección**: Se redirige según el rol y permisos
5. **Protección de Rutas**: Componente `ProtectedRoute` valida acceso

---

## 🏢 SISTEMA DE EMPRESAS

### Estados de Empresa
```javascript
export const ESTADOS_EMPRESA = {
  // Estados Iniciales
  CATALOGADA: 'catalogada',                    // Catastro inicial
  PENDIENTE_VALIDACION: 'pendiente_validacion', // Asignada a agente
  
  // Estados de Validación
  EN_VISITA: 'en_visita',                      // Visita programada
  VALIDADA: 'validada',                        // Validada por agente
  RECHAZADA: 'rechazada',                      // No cumple requisitos
  
  // Estados Operativos
  ACTIVA: 'activa',                            // Visible y operativa
  SUSPENDIDA: 'suspendida',                    // Temporalmente desactivada
  INACTIVA: 'inactiva'                         // Permanentemente desactivada
};
```

### Flujo de Vida de Empresa
1. **Catastro Inicial** → Estado: `catalogada`
2. **Asignación a Agente** → Estado: `pendiente_validacion`
3. **Visita de Validación** → Estado: `en_visita`
4. **Validación en Terreno** → Estado: `validada`
5. **Activación por Admin** → Estado: `activa`
6. **Operación Normal** → Mantiene estado `activa`

---

## 📱 COMPONENTES PRINCIPALES

### 1. Componentes de Autenticación
- **`AuthProvider.jsx`**: Contexto global de autenticación
- **`LoginPage.jsx`**: Página de inicio de sesión
- **`ProtectedRoute.jsx`**: Protección de rutas privadas
- **`AdminRoute.jsx`**: Protección de rutas administrativas

### 2. Componentes de Dashboard
- **`DashboardSwitch.jsx`**: Redirección según rol del usuario
- **`DashboardLayout.jsx`**: Layout común para dashboards
- **`AdminLayout.jsx`**: Layout específico para administradores

### 3. Componentes de Empresas
- **`CrearEmpresaPublica.jsx`**: Formulario de creación de empresas
- **`GestionEmpresas.jsx`**: Panel de gestión de empresas para admin
- **`EmpresaDetalleAgente.jsx`**: Vista detallada para agentes
- **`PerfilEmpresaPublica.jsx`**: Perfil público de empresa

### 4. Componentes de Agentes
- **`DashboardAgente.jsx`**: Dashboard principal de agentes
- **`GestionAgentes.jsx`**: Gestión de agentes para admin
- **`FormularioAgenteEmpresa.jsx`**: Formulario de registro por agentes

### 5. Componentes de Solicitudes
- **`SolicitudesRegistro.jsx`**: Gestión de solicitudes de registro
- **`AdminSolicitudesProveedor.jsx`**: Solicitudes de proveedores
- **`AdminSolicitudesCliente.jsx`**: Solicitudes de clientes
- **`AdminSolicitudesComunidad.jsx`**: Solicitudes de comunidad

---

## 🗂️ PÁGINAS PRINCIPALES

### 1. Páginas Públicas
- **`HomePage.jsx`**: Página principal con empresas activas
- **`LocalProvidersPage.jsx`**: Listado de proveedores locales
- **`PymesLocalesPage.jsx`**: Listado de PYMEs locales
- **`FAQPage.jsx`**: Preguntas frecuentes
- **`ContactPage.jsx`**: Página de contacto

### 2. Páginas de Servicios
- **`SegurosPage.jsx`**: Servicios de seguros
- **`RevisionTecnicaPage.jsx`**: Servicios de revisión técnica
- **`VulcanizacionesPage.jsx`**: Servicios de vulcanización
- **`ReciclajePage.jsx`**: Servicios de reciclaje

### 3. Páginas de Dashboard
- **`AdminDashboardPage.jsx`**: Dashboard administrativo
- **`AreaClientePage.jsx`**: Área de cliente
- **`RecordatoriosPage.jsx`**: Gestión de recordatorios

---

## 🔧 UTILIDADES Y SERVICIOS

### 1. Utilidades de Empresas
- **`empresaStandards.js`**: Estándares y normalización de datos
- **`empresaWorkflow.js`**: Flujos de trabajo de empresas
- **`imageUtils.js`**: Utilidades para manejo de imágenes

### 2. Hooks Personalizados
- **`useImageUrl.js`**: Conversión de URLs de Firebase Storage
- **`useMultipleImageUrls.js`**: Manejo de múltiples imágenes

### 3. Servicios de Firebase
- **`firebase.js`**: Configuración principal
- **`addInfo.js`**: Datos de ejemplo y inicialización

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### Colecciones Principales

#### 1. `usuarios`
```javascript
{
  uid: "string",                    // ID único de Firebase Auth
  email: "string",                  // Email del usuario
  rol: "admin|agente|proveedor|cliente|mecanico",
  nombre: "string",                 // Nombre completo
  telefono: "string",               // Teléfono de contacto
  fecha_registro: "timestamp",      // Fecha de registro
  activo: "boolean",                // Estado de la cuenta
  permisos: ["array"],              // Permisos específicos
  ultima_actividad: "timestamp"     // Última actividad
}
```

#### 2. `empresas`
```javascript
{
  nombre: "string",                 // Nombre de la empresa
  email: "string",                  // Email de contacto
  telefono: "string",               // Teléfono de contacto
  direccion: "string",              // Dirección física
  categoria: "string",              // Categoría de negocio
  descripcion: "string",            // Descripción del negocio
  web: "string",                    // Sitio web
  logo: "string",                   // URL del logo (gs://)
  logo_url: "string",               // URL pública del logo (https://)
  estado: "activa|validada|ingresada|...",
  fecha_creacion: "timestamp",      // Fecha de creación
  fecha_actualizacion: "timestamp", // Última actualización
  horarios: {                       // Horarios de atención
    lunes: { activo: boolean, inicio: "string", fin: "string" },
    // ... otros días
  },
  marcas: ["array"],                // Marcas que maneja
  tipoEmpresa: "proveedor|cliente",
  destacado: "boolean",             // Si es empresa destacada
  creado_por: "string"              // Quién la creó
}
```

#### 3. `agentes`
```javascript
{
  email: "string",                  // Email del agente
  nombre: "string",                 // Nombre completo
  telefono: "string",               // Teléfono de contacto
  zona_asignada: "string",          // Zona geográfica asignada
  empresas_asignadas: ["array"],    // IDs de empresas asignadas
  estado: "activo|inactivo",        // Estado del agente
  fecha_registro: "timestamp",      // Fecha de registro
  ultima_actividad: "timestamp",    // Última actividad
  credenciales_asignadas: "boolean" // Si tiene credenciales
}
```

#### 4. `solicitudes_empresa`
```javascript
{
  nombre_empresa: "string",         // Nombre de la empresa
  email_empresa: "string",          // Email de contacto
  telefono_empresa: "string",       // Teléfono de contacto
  direccion_empresa: "string",      // Dirección física
  categoria: "string",              // Categoría de negocio
  descripcion: "string",            // Descripción del negocio
  estado: "pendiente|en_revision|aprobada|rechazada",
  fecha_solicitud: "timestamp",     // Fecha de la solicitud
  tipo_solicitud: "proveedor|agente",
  agente_creador: "string",         // Email del agente si aplica
  requiere_visita: "boolean",       // Si requiere visita de validación
  documentacion_validada: "boolean" // Si la documentación está validada
}
```

#### 5. `solicitudes_cliente`
```javascript
{
  nombre: "string",                 // Nombre del cliente
  email: "string",                  // Email del cliente
  telefono: "string",               // Teléfono del cliente
  tipo_servicio: "string",          // Tipo de servicio solicitado
  descripcion: "string",            // Descripción de la necesidad
  estado: "pendiente|en_proceso|completada",
  fecha_solicitud: "timestamp",     // Fecha de la solicitud
  prioridad: "baja|media|alta",     // Prioridad de la solicitud
  empresa_asignada: "string"        // ID de empresa asignada
}
```

#### 6. `visitas_campo`
```javascript
{
  empresa_id: "string",             // ID de la empresa visitada
  agente_id: "string",              // ID del agente que realiza la visita
  fecha_visita: "timestamp",        // Fecha programada de la visita
  estado: "programada|en_proceso|completada|cancelada",
  observaciones: "string",          // Observaciones de la visita
  resultado: "string",              // Resultado de la validación
  fotos: ["array"],                 // URLs de fotos de la visita
  firma_empresa: "string",          // URL de la firma obtenida
  fecha_creacion: "timestamp"       // Fecha de creación del registro
}
```

---

## 🚀 ENDPOINTS Y RUTAS

### Rutas Públicas
- `/` - Página principal
- `/login` - Página de inicio de sesión
- `/registro-cliente` - Registro de clientes
- `/registro-proveedor` - Registro de proveedores
- `/registro-agente` - Registro de agentes
- `/proveedores` - Listado de proveedores
- `/proveedores-locales` - Proveedores locales
- `/pymes-locales` - PYMEs locales
- `/faq` - Preguntas frecuentes
- `/contacto` - Página de contacto

### Rutas de Dashboard
- `/dashboard` - Dashboard general (redirección según rol)
- `/dashboard/agente` - Dashboard de agente
- `/agente/empresas-asignadas` - Empresas asignadas al agente
- `/agente/nueva-empresa` - Crear nueva empresa
- `/agente/empresa/:empresaId` - Detalle de empresa para agente

### Rutas de Administración
- `/admin` - Panel principal de administración
- `/admin/empresas` - Gestión de empresas
- `/admin/agentes-campo` - Gestión de agentes
- `/admin/panel-validacion` - Panel de validación
- `/admin/solicitudes-proveedor` - Solicitudes de proveedores
- `/admin/solicitudes-cliente` - Solicitudes de clientes
- `/admin/solicitudes-comunidad` - Solicitudes de comunidad
- `/admin/editar-empresa/:id` - Editar empresa
- `/admin/categorias` - Gestión de categorías
- `/admin/marcas` - Gestión de marcas

### Rutas de Servicios
- `/servicios/seguros` - Servicios de seguros
- `/servicios/revision-tecnica` - Servicios de revisión técnica
- `/servicios/vulcanizaciones` - Servicios de vulcanización
- `/servicios/reciclaje` - Servicios de reciclaje
- `/mis-recordatorios` - Recordatorios del usuario

### Rutas de Perfil
- `/empresa/:empresaId` - Perfil público de empresa
- `/proveedor/:id` - Perfil de proveedor
- `/area-cliente` - Área de cliente

---

## 🔄 FLUJOS PRINCIPALES

### 1. Flujo de Registro de Empresa
```
Usuario → Solicitud → Revisión Admin → Aprobación → Asignación Agente → Validación → Activación
```

**Detalles del flujo:**
1. **Solicitud**: Usuario completa formulario en `/registro-proveedor`
2. **Revisión**: Admin revisa en `/admin/solicitudes-proveedor`
3. **Aprobación**: Admin aprueba y crea empresa con estado `ingresada`
4. **Asignación**: Se asigna a agente en `/admin/agentes-campo`
5. **Validación**: Agente valida en terreno y cambia estado a `validada`
6. **Activación**: Admin activa y cambia estado a `activa`

### 2. Flujo de Agente de Campo
```
Login → Dashboard → Empresas Asignadas → Detalle Empresa → Validación → Cambio de Estado
```

**Detalles del flujo:**
1. **Login**: Agente inicia sesión
2. **Dashboard**: Ve estadísticas y empresas asignadas
3. **Empresas**: Lista empresas con estado `pendiente_validacion`
4. **Detalle**: Accede a `/agente/empresa/:empresaId`
5. **Validación**: Completa formulario de validación
6. **Estado**: Cambia estado a `validada` o `rechazada`

### 3. Flujo de Administración
```
Login → Panel Admin → Gestión Empresas/Agentes → Validación → Activación
```

**Detalles del flujo:**
1. **Login**: Admin inicia sesión
2. **Panel**: Accede a `/admin`
3. **Gestión**: Gestiona empresas y agentes
4. **Validación**: Revisa empresas en `/admin/panel-validacion`
5. **Activación**: Activa empresas validadas

---

## 🎨 INTERFAZ DE USUARIO

### 1. Diseño Responsivo
- **Mobile First**: Diseño optimizado para dispositivos móviles
- **Tailwind CSS**: Framework de utilidades para estilos
- **Componentes Reutilizables**: Sistema de componentes modular

### 2. Componentes de UI
- **Cards**: Para mostrar empresas y productos
- **Modales**: Para formularios y confirmaciones
- **Tablas**: Para listados administrativos
- **Formularios**: Validación en tiempo real
- **Notificaciones**: Sistema de alertas y mensajes

### 3. Navegación
- **Sidebar**: Menú lateral para dashboards
- **Header**: Navegación superior con menú de usuario
- **Breadcrumbs**: Navegación jerárquica
- **Búsqueda**: Búsqueda global y filtros avanzados

---

## 🔒 SEGURIDAD Y PERMISOS

### 1. Autenticación
- **Firebase Auth**: Sistema robusto de autenticación
- **JWT Tokens**: Manejo seguro de sesiones
- **Protección de Rutas**: Validación de acceso por rol

### 2. Autorización
- **Roles Basados en Usuario**: Diferentes niveles de acceso
- **Validación de Permisos**: Verificación en cada operación
- **Auditoría**: Logs de todas las operaciones críticas

### 3. Validación de Datos
- **Validación Frontend**: Validación en tiempo real
- **Validación Backend**: Reglas de Firestore
- **Sanitización**: Limpieza de datos de entrada

---

## 📊 REPORTES Y ESTADÍSTICAS

### 1. Dashboard de Agente
- **Empresas Asignadas**: Total y por estado
- **Empresas Validadas**: Contador de validaciones exitosas
- **Empresas Pendientes**: Empresas que requieren validación
- **Actividad Reciente**: Últimas acciones realizadas

### 2. Dashboard de Admin
- **Resumen General**: Total de empresas por estado
- **Catastro Inicial**: Empresas con estado `ingresada`
- **Validaciones Pendientes**: Empresas en proceso de validación
- **Empresas Activas**: Empresas operativas en el sistema

### 3. Estadísticas del Sistema
- **Usuarios Registrados**: Por rol y estado
- **Empresas por Categoría**: Distribución por tipo de negocio
- **Solicitudes**: Estado y tiempo de procesamiento
- **Actividad de Agentes**: Rendimiento y productividad

---

## 🚀 DESPLIEGUE Y CONFIGURACIÓN

### 1. Variables de Entorno
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. Scripts de Despliegue
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 3. Configuración de Vite
```javascript
// vite.config.jsx
export default {
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}
```

---

## 🧪 TESTING Y CALIDAD

### 1. Componentes de Test
- **`TestImageConversion.jsx`**: Pruebas de conversión de imágenes
- **`TestLogoUpload.jsx`**: Pruebas de carga de logos
- **`TestLogoDisplay.jsx`**: Pruebas de visualización de logos
- **`FirebaseTest.jsx`**: Pruebas de conexión con Firebase

### 2. Estrategias de Testing
- **Testing Manual**: Verificación de funcionalidades críticas
- **Testing de Integración**: Pruebas de flujos completos
- **Testing de UI**: Verificación de componentes visuales
- **Testing de Base de Datos**: Validación de operaciones CRUD

---

## 📈 MONITOREO Y MANTENIMIENTO

### 1. Logs y Auditoría
- **Console Logs**: Para debugging y desarrollo
- **Firebase Analytics**: Métricas de uso y rendimiento
- **Error Tracking**: Captura de errores y excepciones

### 2. Mantenimiento Preventivo
- **Actualizaciones de Dependencias**: Mantener paquetes actualizados
- **Optimización de Performance**: Mejoras continuas de rendimiento
- **Backup de Datos**: Respaldo regular de la base de datos

### 3. Escalabilidad
- **Arquitectura Modular**: Componentes reutilizables
- **Optimización de Consultas**: Consultas eficientes a Firestore
- **Caching**: Almacenamiento en caché de datos frecuentes

---

## 🔮 ROADMAP Y FUTURAS MEJORAS

### 1. Funcionalidades Planificadas
- **Sistema de Notificaciones Push**: Notificaciones en tiempo real
- **API REST**: Endpoints para integración externa
- **Sistema de Pagos**: Integración con pasarelas de pago
- **App Móvil**: Aplicación nativa para iOS y Android

### 2. Mejoras Técnicas
- **TypeScript**: Migración gradual a TypeScript
- **Testing Automatizado**: Implementación de Jest y React Testing Library
- **CI/CD**: Pipeline de integración y despliegue continuo
- **Microservicios**: Arquitectura de microservicios para escalabilidad

### 3. Experiencia de Usuario
- **PWA**: Progressive Web App para mejor experiencia móvil
- **Offline Support**: Funcionalidad offline con Service Workers
- **Accesibilidad**: Mejoras de accesibilidad y usabilidad
- **Internacionalización**: Soporte para múltiples idiomas

---

## 📞 SOPORTE Y CONTACTO

### 1. Documentación Técnica
- **README.md**: Guía básica de instalación
- **Archivos de Solución**: Documentación de problemas resueltos
- **Comentarios en Código**: Explicaciones inline del código

### 2. Recursos de Ayuda
- **Firebase Documentation**: Documentación oficial de Firebase
- **React Documentation**: Guías oficiales de React
- **Tailwind CSS**: Documentación de Tailwind CSS
- **Vite**: Documentación de Vite

### 3. Contacto del Equipo
- **Desarrollador Principal**: [Información de contacto]
- **Administrador del Sistema**: [Información de contacto]
- **Soporte Técnico**: [Información de contacto]

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### ✅ Funcionalidades Implementadas
- [x] Sistema de autenticación con Firebase
- [x] Gestión de roles y permisos
- [x] Dashboard para administradores
- [x] Dashboard para agentes de campo
- [x] Sistema de empresas y estados
- [x] Flujo de validación de empresas
- [x] Gestión de solicitudes
- [x] Sistema de logos y imágenes
- [x] Panel de validación avanzado
- [x] Gestión de categorías y marcas

### 🔄 En Desarrollo
- [ ] Sistema de notificaciones push
- [ ] API REST para integración externa
- [ ] Testing automatizado completo
- [ ] Optimización de performance

### 📋 Pendientes
- [ ] Sistema de pagos
- [ ] App móvil nativa
- [ ] Migración a TypeScript
- [ ] CI/CD pipeline
- [ ] Microservicios

---

*Esta documentación se actualiza regularmente. Última actualización: Diciembre 2024*

*Para contribuciones o sugerencias, contactar al equipo de desarrollo.*
