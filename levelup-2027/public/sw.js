/* LEVEL UP 2027 service worker.
 * - Shows push notifications (text is already privacy-filtered by the server).
 * - Opens the right page when a notification is tapped.
 * - Deliberately does NOT cache pages or API responses: private data is never stored offline.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = { title: "LEVEL UP", body: "You have a new notification.", url: "/notifications", tag: undefined };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (_) { /* keep the generic text */ }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, tag: data.tag, icon: "/icon-192.png", badge: "/icon-192.png", data: { url: data.url },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/notifications", self.location.origin);
  if (url.origin !== self.location.origin) return; // only open our own pages
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) { if ("focus" in c) { await c.navigate(url.href).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow(url.href);
  })());
});
