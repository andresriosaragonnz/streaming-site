// public/sw.js
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || "New Concert Segment Live!";
  const options = {
    body: data.body || "Click to view the stream now.",
    icon: "/icon.png",
    badge: "/badge.png",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
