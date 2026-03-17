// Service Worker para Panel de Rotisería
const CACHE_NAME = 'rotiseria-panel-v1';

// Instalación
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  self.skipWaiting();
});

// Activación
self.addEventListener('activate', (event) => {
  console.log('[SW] Activado');
  self.clients.claim();
});

// Web Push - Recibir notificaciones
self.addEventListener('push', (event) => {
  console.log('[SW] Push recibido:', event);
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('[SW] Error parseando push:', e);
  }

  const options = {
    body: data.body || '',
    icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/3595/3595455.png',
    badge: data.badge || 'https://cdn-icons-png.flaticon.com/512/3595/3595455.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Rotisería', options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificación clickeada:', event);
  event.notification.close();
  
  const notificationData = event.notification.data;
  const urlToOpen = '/?section=' + (notificationData?.section || 'pedidos');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si hay una ventana abierta, enfocarla
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', data: notificationData });
          return client.focus();
        }
      }
      // Si no, abrir nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Mensajes desde la página principal
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
