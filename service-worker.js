/**
 * Service Worker para MiCVGratis
 * Objetivo: Forzar la actualización de la web cuando hay cambios en GitHub
 * y permitir el funcionamiento offline.
 */

// 1. Nombre de la caché. 
// TRUCO: Incrementa este número (v8, v9, v10...) cada vez que subas cambios a GitHub.
const CACHE_NAME = 'micvgratis-cache-v10.3';

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/app.html',
    '/style.css',
    '/welcome-style.css',
    '/script.js',
    '/politica-privacidad.html',
    '/terminos-servicio.html',
    '/contacto.html'
];

// Instalación: Guarda los archivos en la memoria del navegador
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Fuerza al nuevo SW a tomar el control de inmediato
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Instalando nueva versión de caché:', CACHE_NAME);
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activación: Borra las cachés antiguas para liberar espacio y evitar conflictos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Borrando caché obsoleta:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) 
    );
});

// Estrategia de carga: "Network First" (Red primero, luego caché)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = event.request.url;
    if (
        url.includes('googlesyndication') || 
        url.includes('adsbygoogle') || 
        url.includes('google-analytics') ||
        url.includes('pagead')
    ) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const resClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, resClone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                });
            })
    );
});
