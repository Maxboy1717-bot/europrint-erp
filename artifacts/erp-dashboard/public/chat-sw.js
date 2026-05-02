self.addEventListener('push', (event) => {
  let payload = { title: 'Chat', body: 'Yangi xabar', url: '/chat' };
  if (event.data) {
    try { payload = { ...payload, ...event.data.json() }; } catch (_) { /* fallback */ }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      data: { url: payload.url, ...(payload.data || {}) },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/chat';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/chat')) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
