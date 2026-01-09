// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body || '',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/badge-72.png',
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: getActionsForType(data.data?.type),
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'LFF', options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/';

  // Navigate based on notification type
  if (data.questId) {
    url = `/quests/${data.questId}`;
  } else if (data.eventId) {
    url = `/events/${data.eventId}`;
  } else if (data.contentId) {
    url = `/content/${data.contentId}`;
  } else if (data.tokenId) {
    url = '/mypage';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

function getActionsForType(type) {
  switch (type) {
    case 'QUEST_APPROVED':
    case 'QUEST_REJECTED':
      return [
        { action: 'view', title: 'View Quest' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'NFT_MINTED':
      return [
        { action: 'view', title: 'View NFT' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    default:
      return [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
  }
}
