// public/firebase-messaging-sw.js
/* global self importScripts */

importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// IMPORTANT: hard-code your config here (service worker can't read env vars)
firebase.initializeApp({
  apiKey: "AIzaSyCzthRlc5iMmbqZQFmxaZKBBWWXK6aGbrA",
  authDomain: "wannagonna-cb8ef.firebaseapp.com",
  projectId: "wannagonna-cb8ef",
  storageBucket: "wannagonna-cb8ef.firebasestorage.app",
  messagingSenderId: "609157228478",
  appId: "1:609157228478:web:1dfb493bbe4af9b20cfbef",
  measurementId: "G-BJH39J2HW8",
});

const messaging = firebase.messaging();

// Called when a push message is received while the app is in the background
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification?.title || "Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/favicon/android-chrome-192x192.png", // adjust to your icon
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle clicks on notifications
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.click_action || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.postMessage({ type: "NOTIFICATION_CLICKED", data: event.notification.data });
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});