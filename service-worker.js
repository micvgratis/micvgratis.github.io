/**
 * Service Worker para MiCVGratis
 * Objetivo: Forzar la actualización de la web cuando hay cambios en GitHub
 * y permitir el funcionamiento offline.
 */

// 1. Nombre de la caché. 
// TRUCO: Cambia el número (v1, v2, v3...) cuando quieras que TODOS vean los cambios al instante.
const CACHE_NAME = 'micvgratis-cache-v5';

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
            console.log('[SW] Instalando nueva versión de caché');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activación: Borra las cachés antiguas para que no ocupen espacio y no den errores
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Borrando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Toma el control de las pestañas abiertas
    );
});

// Estrategia de carga: "Network First" (Red primero, luego caché)
// Esto asegura que si hay internet, el usuario vea lo más nuevo de GitHub.
self.addEventListener('fetch', (event) => {
    // No cachear anuncios de Google ni analíticas externas
    if (event.request.url.includes('adsbygoogle') || event.request.url.includes('google-analytics')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Si la red responde, guardamos una copia actualizada y la devolvemos
                const resClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, resClone);
                });
                return response;
            })
            .catch(() => {
                // Si falla el internet, servimos lo que tengamos en caché
                return caches.match(event.request);
            })
    );
});
