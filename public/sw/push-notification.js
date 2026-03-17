/**
 * NeighborPulse Push Notification Service Worker
 */

self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      const title = payload.title || 'New Notification';
      const options = {
        body: payload.body,
        icon: payload.icon || '/icons/notification-icon.png',
        badge: payload.badge || '/icons/badge-icon.png',
        data: payload.data,
        actions: payload.actions,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.error('Error processing push notification:', e);
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Focus specific window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a window is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // Check for specific URL if provided in data, otherwise default to /alerts
        const urlToOpen = event.notification.data?.url || '/alerts';
        
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        const urlToOpen = event.notification.data?.url || '/alerts';
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
