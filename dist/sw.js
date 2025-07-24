// Service Worker para Push Notifications - AV10 de Julio
// Versión: 1.0

const CACHE_NAME = 'av10-de-julio-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
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
  );
});

// Manejar notificaciones push
self.addEventListener('push', event => {
  console.log('Push recibido:', event);
  
  if (!event.data) {
    console.log('Push sin datos');
    return;
  }

  const data = event.data.json();
  const title = data.notification?.title || 'AV10 de Julio';
  const options = {
    body: data.notification?.body || 'Nueva notificación',
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
  return Promise.resolve();
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
  );
});

// Interceptar solicitudes de red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si hay respuesta en cache, la devolvemos
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Manejar push notifications
self.addEventListener('push', event => {
  console.log('Push message recibido:', event);
  
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
        title: 'AV10 de Julio',
        body: event.data.text() || 'Nueva notificación',
        icon: '/logo192.png',
        badge: '/logo192.png'
      };
    }
  }

  const defaultOptions = {
    title: 'AV10 de Julio',
    body: 'Nueva notificación disponible',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir App',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/logo192.png'
      }
    ]
  };

  const options = { ...defaultOptions, ...notificationData };

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Manejar clicks en las notificaciones
self.addEventListener('notificationclick', event => {
  console.log('Notification click recibido:', event);
  
  event.notification.close();

  if (event.action === 'open') {
    // Abrir la aplicación
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Simplemente cerrar la notificación (ya se cerró arriba)
    return;
  } else {
    // Click en el cuerpo de la notificación
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Si hay una ventana abierta, enfocarla
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          // Si no hay ventana abierta, abrir una nueva
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

// Manejar sincronización en background
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Background sync ejecutándose');
    event.waitUntil(
      // Aquí se pueden enviar datos pendientes cuando se restaure la conexión
      Promise.resolve()
    );
  }
});
