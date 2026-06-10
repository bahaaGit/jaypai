// Jaypai Service Worker — tuned for poor connectivity.
// Strategies:
//   - Static assets (_next/static, icons, fonts) → cache-first
//   - Page navigations        → network-first, fall back to cache, then offline.html
//   - API GET requests        → network-first, fall back to cached response
//   - Non-GET (POST/PATCH...)  → always network (never cached)
// Bump CACHE_VERSION to invalidate old caches on deploy.

const CACHE_VERSION = "v1"
const STATIC_CACHE = `jaypai-static-${CACHE_VERSION}`
const PAGES_CACHE = `jaypai-pages-${CACHE_VERSION}`
const API_CACHE = `jaypai-api-${CACHE_VERSION}`
const OFFLINE_URL = "/offline.html"

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
]

// ── Install: precache the offline shell ────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ── Activate: clean up old version caches ──────────────────────────────
self.addEventListener("activate", (event) => {
  const keep = new Set([STATIC_CACHE, PAGES_CACHE, API_CACHE])
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

// ── Fetch routing ──────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET requests.
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return
  }

  // Never cache the service worker itself or auth callbacks.
  if (url.pathname === "/sw.js" || url.pathname.startsWith("/auth")) {
    return
  }

  // 1. Static build assets & icons → cache-first.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|svg|ico)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // 2. API GET → network-first with cache fallback (last-known data offline).
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE))
    return
  }

  // 3. Page navigations → network-first, fall back to cache, then offline page.
  if (request.mode === "navigate") {
    event.respondWith(navigationHandler(request))
    return
  }
})

// ── Strategy implementations ───────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return cached || Response.error()
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    return Response.error()
  }
}

async function navigationHandler(request) {
  const cache = await caches.open(PAGES_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    return (await caches.match(OFFLINE_URL)) || Response.error()
  }
}

// ── Allow the page to trigger an immediate update ──────────────────────
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting()
})
