const CACHE_NAME = "mediqit-pwa-v4";
const PRECACHE = [
  "/",
  "/index.html",
  "/about.html",
  "/contact.html",
  "/privacy.html",
  "/offline.html",
  "/styles.css?v=20261012-pwa4",
  "/page.css?v=20261012-pwa1",
  "/privacy.css?v=20261012-pwa1",
  "/script.js?v=20261012-pwa1",
  "/pwa.js?v=20261012-pwa1",
  "/assets/mediqit-wordmark-v1.png",
  "/assets/mediqit-app-192.png",
  "/assets/mediqit-app-512.png",
  "/assets/family-hero-v2.webp",
  "/assets/bp-monitor-v1.webp",
  "/assets/first-aid-kit-v1.webp",
  "/assets/family-care-v1.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/"))
    return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(
          async () =>
            (await caches.match(request)) || caches.match("/offline.html"),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
