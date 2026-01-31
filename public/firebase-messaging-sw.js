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

// Data-only messages: we display the notification (single source, no duplicate with FCM auto-display)
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const data = payload.data || {};
  const notificationTitle = data.title || "Notification";
  const notificationOptions = {
    body: data.body || "",
    icon: "/favicon/android-chrome-192x192.png",
    data: data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Same behavior as in-app notification click: navigate to notification.link
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const path = event.notification.data?.link || "/dashboard";
  const urlToOpen = path.startsWith("http") ? path : self.location.origin + path;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.focus();
          if (typeof client.navigate === "function") {
            return client.navigate(urlToOpen);
          }
          return Promise.resolve();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});