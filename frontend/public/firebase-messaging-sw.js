// Firebase Cloud Messaging Service Worker
// This file handles background push notifications for web

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
// DATA-ONLY approach: We manually show notification
// This gives us full control over notification display
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  // Extract title and body from data payload
  const title = payload.data?.title || 'Medication Reminder';
  const body = payload.data?.body || 'You have a new notification';

  const notificationOptions = {
    body: body,
    icon: '/icon.png',
    badge: '/badge.png',
    data: payload.data,
    tag: payload.data?.medicationTimeId || 'default', // Prevents duplicate notifications
    requireInteraction: true
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  event.notification.close();

  // Extract medication data from notification
  const medicationTimeId = event.notification.data?.medicationTimeId;
  const medicationId = event.notification.data?.medicationId;

  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          // Navigate to medication detail if we have the ID
          const url = medicationId ? `/?medicationId=${medicationId}` : '/';
          return clients.openWindow(url);
        }
      })
  );
});
