// Bump a CHAQUE release pour forcer Chrome a purger l'ancien cache PWA (voir 24-hebergement-production).
const CACHE_NAME = "riw-app-shell-v0.1.1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/favicon-64.png",
  "/icons/icon-180.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/index.html")));
    return;
  }

  if (isCacheableStatic(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});

function isCacheableStatic(pathname) {
  return pathname.startsWith("/assets/")
    || pathname.startsWith("/icons/")
    || pathname.endsWith(".js")
    || pathname.endsWith(".css")
    || pathname.endsWith(".json")
    || pathname.endsWith(".glb")
    || pathname.endsWith(".webmanifest")
    || pathname.endsWith(".wasm");
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}