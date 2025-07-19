# Sistema de Perfiles Web para Empresas sin Sitio Web

## Descripción
El sistema ahora proporciona una experiencia completa de administración de empresas con funcionalidades especiales para apoyar a PYMEs y emprendimientos que no tienen página web propia.

## Nuevas Funcionalidades

### 1. Gestión Completa de Logos
- **Subida manual**: Los administradores pueden subir logos en formato PNG/JPG
- **Generación automática**: Para empresas sin logo, se puede generar uno automático basado en las iniciales del nombre
- **Vista previa**: Visualización inmediata del logo cargado
- **Eliminación**: Opción para eliminar y reemplazar logos

### 2. Galería de Fotos del Local
- **Múltiples imágenes**: Subida de varias fotos del local, productos o servicios
- **Gestión individual**: Eliminar fotos específicas de la galería
- **Visualización**: Las fotos se muestran en el perfil público
- **Formatos soportados**: JPG, PNG hasta 5MB por imagen

### 3. Gestión de Horarios
- **Configuración por día**: Horarios específicos para cada día de la semana
- **Horarios predefinidos**: Plantillas rápidas (comercial, jornada completa, etc.)
- **Aplicación masiva**: Copiar el mismo horario a múltiples días
- **Estados flexibles**: Marcar días como cerrados

### 4. Perfil Web Público
- **Página completa**: Para empresas sin sitio web, se genera un perfil público completo
- **URL accesible**: `/perfil-empresa/{id}` disponible públicamente
- **Diseño profesional**: Layout moderno y responsivo
- **Información completa**: Logo, galería, servicios, horarios, contacto

### 5. Características del Perfil Público

#### Header Atractivo
- Logo de la empresa
- Nombre y categoría
- Información de contacto destacada
- Diseño con gradiente moderno

#### Secciones Principales
- **Acerca de Nosotros**: Descripción completa de la empresa
- **Servicios**: Lista de servicios ofrecidos con íconos
- **Galería**: Fotos del local con modal de ampliación
- **Características**: Puntos distintivos de la empresa
- **Testimonios**: Reseñas de clientes con calificaciones

#### Sidebar Informativo
- **Horarios**: Visualización clara por días
- **Contacto**: Teléfono, email, WhatsApp
- **Ubicación**: Dirección completa
- **Redes Sociales**: Enlaces a Facebook e Instagram

### 6. Beneficios para PYMEs

#### Sin Costo de Desarrollo Web
- No necesitan contratar desarrolladores
- No requieren hosting ni dominio
- Mantenimiento automático del perfil

#### Presencia Digital Profesional
- URL propia para compartir
- Diseño responsive para móviles
- SEO básico incluido

#### Gestión Centralizada
- Actualización desde el panel de admin
- Cambios reflejados inmediatamente
- Control total del contenido

## Rutas Principales

### Administración
- `/admin/empresas` - Listado de empresas
- `/admin/editar-empresa/{id}` - Edición completa de empresa

### Público
- `/perfil-empresa/{id}` - Perfil público de la empresa

## Flujo de Trabajo

### Para el Administrador:
1. Acceder a `/admin/empresas`
2. Seleccionar "Editar" en una empresa
3. Completar tabs:
   - **General**: Información básica
   - **Logo**: Subir o generar logo automático
   - **Horarios**: Configurar horarios de atención
   - **Perfil Web**: Agregar servicios, galería, testimonios
4. Ver resultado en "Ver Perfil Público"

### Para los Clientes:
1. Acceder al enlace del perfil público
2. Ver información completa de la empresa
3. Contactar directamente (teléfono, WhatsApp, email)
4. Ver galería de fotos del local
5. Conocer horarios de atención

## Tecnologías Utilizadas
- **Frontend**: React + Tailwind CSS
- **Backend**: Firebase Firestore
- **Storage**: Firebase Storage para imágenes
- **Generación de logos**: Canvas API
- **Responsive**: Grid y Flexbox

## Casos de Uso Ideales

### PYMEs Locales
- Talleres mecánicos
- Tiendas de repuestos
- Servicios automotrices
- Pequeños comercios

### Emprendimientos
- Nuevos negocios sin presupuesto web
- Servicios a domicilio
- Profesionales independientes

## Próximas Mejoras
- Integración con Google Maps
- Sistema de reseñas públicas
- Catálogo de productos básico
- Formulario de contacto integrado
- Analytics básicos del perfil

---

Esta implementación convierte la plataforma en una solución completa para empresas de todos los tamaños, especialmente beneficiando a aquellas que no tienen los recursos para desarrollar su propia presencia web.
