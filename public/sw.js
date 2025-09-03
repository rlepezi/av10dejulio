// Service Worker para Push Notifications - AV10 de Julio
// Versión: 1.0

const CACHE_NAME = 'av10-de-julio-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/logo192.png',
  '/favicon.ico'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker instalándose...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Error instalando Service Worker:', error);
        // Continuar con la instalación aunque falle el cache
        return Promise.resolve();
      })
  );
});

// Manejar notificaciones push
self.addEventListener('push', event => {
  console.log('Push recibido:', event);
  
  let data = {};
  let title = 'AV10 de Julio';
  let body = 'Nueva notificación';
  
  if (event.data) {
    try {
      data = event.data.json();
      title = data.notification?.title || title;
      body = data.notification?.body || body;
    } catch (error) {
      console.error('Error parseando datos de push:', error);
      // Usar datos por defecto si falla el parseo
    }
  }

  const options = {
    body: body,
    icon: '/logo192.png',
    badge: '/favicon.ico',
    tag: data.tag || 'general',
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ],
    requireInteraction: false,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .catch(error => {
        console.error('Error mostrando notificación:', error);
      })
  );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', event => {
  console.log('Click en notificación:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Abrir o enfocar la app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Si hay una ventana abierta, enfocarla
        for (let client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no, abrir nueva ventana
        if (clients.openWindow) {
          const targetUrl = event.notification.data?.url || '/';
          return clients.openWindow(targetUrl);
        }
      })
      .catch(error => {
        console.error('Error manejando click de notificación:', error);
      })
  );
});

// Manejar sincronización en background
self.addEventListener('sync', event => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Aquí se pueden sincronizar datos pendientes
  return Promise.resolve()
    .catch(error => {
      console.error('Error en background sync:', error);
      // No lanzar el error para evitar que falle el sync
    });
}

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker activándose...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .catch(error => {
      console.error('Error activando Service Worker:', error);
      // Continuar con la activación aunque falle la limpieza de cache
      return Promise.resolve();
    })
  );
});

// Interceptar solicitudes de red
self.addEventListener('fetch', event => {
  // Solo interceptar solicitudes GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si hay respuesta en cache, la devolvemos
        if (response) {
          return response;
        }
        
        // Intentar hacer fetch con manejo de errores
        return fetch(event.request)
          .catch(error => {
            console.log('Fetch falló para:', event.request.url, error);
            // Si es una solicitud de página, devolver una página de error básica
            if (event.request.destination === 'document') {
              return new Response(
                '<html><body><h1>Sin conexión</h1><p>Esta página no está disponible sin conexión.</p></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            }
            // Para otros recursos, devolver un error
            throw error;
          });
      })
  );
});


