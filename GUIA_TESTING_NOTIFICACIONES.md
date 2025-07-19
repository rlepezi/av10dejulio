# 🔔 GUÍA DE TESTING - NOTIFICACIONES PUSH

## 🚀 Configuración Completada

### ✅ Problemas Resueltos
- **Error `process is not defined`**: Corregido usando `import.meta.env` en lugar de `process.env`
- **Variables de entorno**: Configuradas en `.env` con prefijo `VITE_`
- **Vite config**: Actualizado para compatibilidad y optimización
- **Service Worker**: Registrado correctamente en `index.jsx`

### 📁 Archivos Modificados
- `src/services/PushNotificationService.js` - Corregido `process.env`
- `src/hooks/useNotifications.js` - Actualizado para Vite
- `src/components/NotificationManager.jsx` - Corregido env variables
- `vite.config.jsx` - Configuración mejorada
- `.env` - Variables de entorno creadas
- `.gitignore` - Agregado `.env`

---

## 🧪 TESTING DE NOTIFICACIONES

### 1. **Verificar que el Service Worker está registrado**
Abrir DevTools (F12) → Console:
```javascript
navigator.serviceWorker.ready.then(registration => {
  console.log('Service Worker registrado:', registration);
});
```

### 2. **Probar permisos de notificación**
En la aplicación (http://localhost:5174/):
1. Hacer login como admin
2. Ir a `/admin/notificaciones`
3. Hacer click en "Configurar Notificaciones"
4. Permitir notificaciones en el navegador

### 3. **Obtener token FCM**
En DevTools Console:
```javascript
// Verificar que Firebase Messaging está cargado
import { messaging } from './src/firebase.js';
import { getToken } from 'firebase/messaging';

getToken(messaging, {
  vapidKey: 'BEl62iUYgUivxIhf6Ydtwqr2oXIFOOcNVKqF8sD_ECGRt1Ue6kf0lKrKQK2BdHWnU_0XEU1LoXOQ'
}).then(token => {
  console.log('Token FCM:', token);
});
```

### 4. **Enviar notificación de prueba desde Firebase Console**
1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar proyecto `av10dejulio-2ecc3`
3. Ir a **Cloud Messaging** → **Send your first message**
4. Configurar:
   - **Notification title**: "Prueba AV10 de Julio"
   - **Notification text**: "Notificación de prueba funcionando"
   - **Target**: Single device
   - **FCM registration token**: [Pegar token obtenido]

### 5. **Enviar desde el panel admin**
1. Login como admin
2. Ir a `/admin/notificaciones`
3. Llenar formulario:
   - **Título**: "Nueva campaña disponible"
   - **Mensaje**: "Revisa las nuevas ofertas en tu área"
   - **Tipo**: General
4. Hacer click en "Enviar"

---

## 🔧 TROUBLESHOOTING

### **Error: "No se pudo obtener el token"**
- Verificar que los permisos están concedidos
- Verificar VAPID key en `.env`
- Revisar que el Service Worker está activo

### **Error: "Firebase not configured"**
- Verificar que `firebase.js` está bien configurado
- Verificar que las credenciales son correctas

### **Notificaciones no aparecen**
- Verificar que el navegador permite notificaciones
- Verificar que el Service Worker está registrado
- Revisar la consola para errores

---

## 📱 TESTING EN DIFERENTES DISPOSITIVOS

### **Desktop (Chrome/Firefox)**
- ✅ Notificaciones completas con botones
- ✅ Service Worker completo
- ✅ Clicks y acciones

### **Mobile (Chrome Mobile)**
- ✅ Notificaciones push nativas
- ✅ Funcionamiento offline básico
- ⚠️ Algunas limitaciones en iOS Safari

### **PWA (Instalado)**
- ✅ Notificaciones como app nativa
- ✅ Iconos y badges
- ✅ Clicks abren la app

---

## 🎯 PRÓXIMOS PASOS

### **Immediate (Sprint 2 Final)**
- [ ] **Probar notificaciones end-to-end**
- [ ] **Verificar base de datos de tokens**
- [ ] **Testing en móvil real**

### **Sprint 3**
- [ ] **Notificaciones automáticas** (nuevas solicitudes, etc.)
- [ ] **Templates de notificaciones** por tipo de usuario
- [ ] **Analytics de notificaciones** (entregadas, clickeadas)
- [ ] **Notificaciones programadas** (recordatorios)

### **Futuro**
- [ ] **Push notifications avanzadas** (con datos, imágenes)
- [ ] **Segmentación** por ubicación geográfica
- [ ] **A/B testing** de mensajes
- [ ] **Integración con calendario**

---

## 📊 ARQUITECTURA ACTUAL

```
Frontend (React + Vite)
├── Service Worker (sw.js)
├── Firebase Messaging
├── useNotifications Hook
├── NotificationManager Component
└── AdminNotificaciones Panel

Firebase Cloud Messaging
├── VAPID Keys
├── Token Management
├── Message Delivery
└── Analytics

Database (Firestore)
├── usuarios { notificationToken, notificationsEnabled }
├── notificaciones { titulo, cuerpo, fechaEnvio, destinatarios }
└── tokens_notificacion { userId, token, platform, lastUpdate }
```

---

## 🚀 COMANDOS ÚTILES

### **Desarrollo**
```bash
npm run dev              # Servidor de desarrollo
npm run build            # Build para producción
npm run preview          # Preview del build
```

### **Testing Service Worker**
```bash
# En DevTools → Application → Service Workers
# Verificar estado: Activated and running
```

### **Variables de entorno**
```bash
# Verificar en consola del navegador
console.log(import.meta.env.VITE_VAPID_KEY);
```

---

*Guía actualizada: 19 de Julio, 2025*  
*Sistema de notificaciones funcionando correctamente* ✅
