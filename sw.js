const CACHE_NAME = 'arcade-hub-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './css/hub.css',
    './css/spa.css'
];

// JS files that should always be fetched fresh (network-first)
const NETWORK_FIRST = [
    '/js/',
    '/services/',
    '/engine/'
];

self.addEventListener('install', (event) => {
    // Force this service worker to become active immediately
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    // Clean up old caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Take control of all pages immediately
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Exclude external resources (Google, Firebase, etc.) from SW handling
    if (url.origin !== self.location.origin) {
        return; // Allow the browser to handle external requests directly
    }

    // Network-first for JS files (always get latest)
    const isNetworkFirst = NETWORK_FIRST.some(path => url.pathname.includes(path));
    
    if (isNetworkFirst) {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(event.request))
        );
        return;
    }
    
    // Cache-first for static assets
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});
