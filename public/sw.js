const CACHE_VERSION = "sysathos-v3-" + new Date().getTime()
const CACHE_NAME = CACHE_VERSION
const STATIC_CACHE = CACHE_NAME + "-static"
const DYNAMIC_CACHE = CACHE_NAME + "-dynamic"

// Arquivos essenciais para cache
const STATIC_ASSETS = ["/", "/manifest.json", "/favicon.ico"]

// Install event - cacheia arquivos estáticos essenciais
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker version:", CACHE_VERSION)
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static assets")
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        return self.skipWaiting()
      }),
  )
})

// Activate event - limpa caches antigos
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker version:", CACHE_VERSION)
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.startsWith(CACHE_VERSION)) {
              console.log("[SW] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        return self.clients.claim()
      }),
  )
})

// Fetch event - estratégia de caching inteligente
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.origin !== location.origin) {
    return
  }

  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clona a resposta para cachear
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          // Se offline, tenta retornar do cache
          return caches.match(request)
        }),
    )
    return
  }

  if (request.url.includes("/_next/") || request.url.match(/\.(css|js|png|jpg|jpeg|svg|gif|webp|woff|woff2)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then((response) => {
          // Cacheia o novo asset
          const responseClone = response.clone()
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
      }),
    )
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone()
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone)
        })
        return response
      })
      .catch(() => {
        return caches.match(request)
      }),
  )
})

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
