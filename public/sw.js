// Service worker — push notifications + network-first caching

const CACHE_VERSION = "ai-assistant-v3";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  // Delete all old caches so stale assets never survive a deploy
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      )
    ).then(() => clients.claim())
  );
});

// Push: show notification
self.addEventListener("push", (e) => {
  let data = { title: "AI Assistant", body: "You have a new notification", tag: "default", url: "/" };
  try {
    if (e.data) data = { ...data, ...e.data.json() };
  } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      data: { url: data.url },
      requireInteraction: false,
    })
  );
});

// Notification click: focus/open the app
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Fetch strategy:
//   - API calls → always network (never cache)
//   - HTML navigation → network first, fall back to cache for offline
//   - Static assets (JS/CSS/images) → cache first (Vercel sets long-lived ETags)
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Skip API calls entirely — never intercept
  if (url.pathname.startsWith("/api") || url.origin !== self.location.origin) return;

  // HTML navigation: network first so new deploys are picked up immediately
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Static assets: cache first, update in background
  e.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(e.request);
      const fetchPromise = fetch(e.request).then((res) => {
        cache.put(e.request, res.clone());
        return res;
      });
      return cached || fetchPromise;
    })
  );
});
