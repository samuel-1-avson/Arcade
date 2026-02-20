const CACHE_NAME = 'arcade-hub-v5';
const STATIC_CACHE = 'arcade-hub-static-v5';
const DYNAMIC_CACHE = 'arcade-hub-dynamic-v5';
const IMAGE_CACHE = 'arcade-hub-images-v5';

// Static assets that should always be cached
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './css/hub.css',
    './css/spa.css',
    './css/party.css',
    './css/overlay-hud.css',
    './css/navigation.css',
    './css/modals.css',
    './css/friends.css',
    './css/zen-mode.css',
    './css/auth-modal.css',
    './css/accessibility.css',
    './css/game-loading.css',
    './css/game-cards.css',
    './css/buttons.css'
];

// JS files to cache
const JS_ASSETS = [
    './js/app.js',
    './js/app/index.js',
    './js/app/ArcadeHub.js',
    './js/app/navigation.js',
    './js/app/gameCards.js',
    './js/app/auth.js',
    './js/app/dashboard.js'
];

// External resources that can be cached
const EXTERNAL_ASSETS = [
    'https://api.dicebear.com/7.x/avataaars/svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(err => console.warn('[SW] Static cache failed:', err))
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheName.startsWith('arcade-hub-') || 
                        (cacheName !== STATIC_CACHE && 
                         cacheName !== DYNAMIC_CACHE && 
                         cacheName !== IMAGE_CACHE)) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Helper to determine cache strategy
function getCacheStrategy(url) {
    const pathname = url.pathname;
    
    // Static assets - cache first
    if (pathname.match(/\.(css|js|json)$/)) {
        return 'cache-first';
    }
    
    // Images - stale while revalidate
    if (pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
        return 'stale-while-revalidate';
    }
    
    // Fonts - cache first
    if (pathname.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
        return 'cache-first';
    }
    
    // HTML - network first
    if (pathname.endsWith('.html') || pathname === '/' || pathname === '') {
        return 'network-first';
    }
    
    // API calls - network only
    if (pathname.includes('/api/') || url.hostname.includes('firebase')) {
        return 'network-only';
    }
    
    // Default - network first
    return 'network-first';
}

// Fetch event - apply caching strategies
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip Firebase and other external APIs (except Dicebear avatars)
    if (url.hostname !== self.location.hostname && 
        !url.hostname.includes('dicebear.com')) {
        return;
    }
    
    const strategy = getCacheStrategy(url);
    
    switch (strategy) {
        case 'cache-first':
            event.respondWith(cacheFirst(event.request));
            break;
        case 'stale-while-revalidate':
            event.respondWith(staleWhileRevalidate(event.request));
            break;
        case 'network-first':
            event.respondWith(networkFirst(event.request));
            break;
        case 'network-only':
            // Don't intercept, let it go to network
            break;
        default:
            event.respondWith(networkFirst(event.request));
    }
});

// Cache First strategy
async function cacheFirst(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Return offline fallback if available
        return cache.match('./index.html');
    }
}

// Network First strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        const cache = await caches.open(DYNAMIC_CACHE);
        const cached = await cache.match(request);
        
        if (cached) {
            return cached;
        }
        
        // Return index.html for navigation requests (SPA fallback)
        if (request.mode === 'navigate') {
            return cache.match('./index.html');
        }
        
        throw error;
    }
}

// Stale While Revalidate strategy (for images)
async function staleWhileRevalidate(request) {
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(request);
    
    // Fetch and update cache in background
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => cached);
    
    // Return cached immediately if available, otherwise wait for network
    return cached || fetchPromise;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-scores') {
        event.waitUntil(syncScores());
    }
});

async function syncScores() {
    // This would sync any queued scores when back online
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({ type: 'SYNC_SCORES' });
    });
}

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        event.waitUntil(
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: './favicon.ico',
                badge: './favicon.ico',
                data: data.data
            })
        );
    }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CACHE_ASSETS') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE).then(cache => {
                return cache.addAll(event.data.assets);
            })
        );
    }
});
