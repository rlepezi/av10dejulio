# 🚀 AV10 de Julio - Configuración para Desarrolladores

## 📋 Requisitos Previos
- Node.js 16+ instalado
- npm o yarn
- Git (opcional)

## 🛠️ Instalación

### 1. Clonar o Descargar el Proyecto
```bash
# Opción A: Clonar desde GitHub
git clone https://github.com/rlepezi/av10dejulio.git
cd av10dejulio

# Opción B: Si tienes el ZIP, extraer y navegar a la carpeta
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Firebase
El proyecto ya tiene la configuración de Firebase en `src/firebase.js`. No necesitas cambiar nada.

### 4. Ejecutar el Proyecto
```bash
# Desarrollo
npm start

# Build para producción
npm run build
```

## 🌐 URLs del Proyecto
- **Frontend Local**: http://localhost:3000
- **Firebase Hosting**: https://av10dejulio-2ecc3.web.app

## 📁 Estructura del Proyecto
```
src/
├── components/          # Componentes React
│   ├── AdminPanel.jsx
│   ├── RegistroCliente.jsx
│   ├── RegistroProveedor.jsx
│   └── ...
├── utils/              # Utilidades y servicios
│   ├── notificationService.js
│   ├── userCreationService.js
│   └── regionesComunas.js
├── firebase.js         # Configuración Firebase
└── App.jsx            # Componente principal
```

## 👥 Roles de Usuario
- **Admin**: admin@av10dejulio.com
- **Cliente**: Registro público
- **Proveedor**: Registro con validación

## 🔥 Firebase Collections
- `solicitudes_cliente` - Solicitudes de registro de clientes
- `solicitudes_proveedor` - Solicitudes de registro de proveedores  
- `perfiles_clientes` - Perfiles de clientes activos
- `empresas` - Perfiles de proveedores activos
- `notificaciones` - Sistema de notificaciones
- `categorias` - Categorías de servicios
- `marcas` - Marcas de vehículos

## 🚀 Funcionalidades Principales
1. **Registro de Clientes** sin autenticación previa
2. **Registro de Proveedores** con validación admin
3. **Panel de Administración** para gestión de solicitudes
4. **Sistema de Notificaciones** integrado
5. **Creación automática de usuarios** en Firebase Auth
6. **Selector dinámico** de regiones y comunas

## 🐛 Solución de Problemas

### Error: Cannot find module
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error de permisos Firebase
Verificar que la configuración en `firebase.js` sea correcta.

### Puerto 3000 ocupado
```bash
npm start -- --port 3001
```

## 📞 Contacto
- Desarrollador: [Tu email]
- Repositorio: https://github.com/rlepezi/av10dejulio
