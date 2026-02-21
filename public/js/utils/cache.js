import { logger, LogCategory } from '../utils/logger.js';
/**
 * Cache Management Utilities
 * Smart caching with TTL and memory management
 */

export class MemoryCache {
    constructor(options = {}) {
        this.options = {
            maxSize: 100,
            defaultTTL: 5 * 60 * 1000, // 5 minutes
            ...options
        };
        
        this.cache = new Map();
        this.accessOrder = [];
    }

    set(key, value, ttl = this.options.defaultTTL) {
        // Evict oldest if at capacity
        if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
            this.evictLRU();
        }

        const entry = {
            value,
            expires: ttl ? Date.now() + ttl : null,
            accessed: Date.now()
        };

        this.cache.set(key, entry);
        this.updateAccessOrder(key);
    }

    get(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return undefined;
        }

        // Check expiration
        if (entry.expires && Date.now() > entry.expires) {
            this.delete(key);
            return undefined;
        }

        entry.accessed = Date.now();
        this.updateAccessOrder(key);
        
        return entry.value;
    }

    getWithFallback(key, fallback, ttl) {
        const cached = this.get(key);
        if (cached !== undefined) {
            return cached;
        }

        const value = fallback();
        this.set(key, value, ttl);
        return value;
    }

    async getAsyncWithFallback(key, fallback, ttl) {
        const cached = this.get(key);
        if (cached !== undefined) {
            return cached;
        }

        const value = await fallback();
        this.set(key, value, ttl);
        return value;
    }

    delete(key) {
        this.cache.delete(key);
        this.accessOrder = this.accessOrder.filter(k => k !== key);
    }

    has(key) {
        const entry = this.cache.get(key);
        if (!entry) return false;
        
        if (entry.expires && Date.now() > entry.expires) {
            this.delete(key);
            return false;
        }
        
        return true;
    }

    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }

    evictLRU() {
        if (this.accessOrder.length === 0) return;
        
        const oldestKey = this.accessOrder.shift();
        this.cache.delete(oldestKey);
    }

    updateAccessOrder(key) {
        this.accessOrder = this.accessOrder.filter(k => k !== key);
        this.accessOrder.push(key);
    }

    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expires && now > entry.expires) {
                this.delete(key);
            }
        }
    }

    get size() {
        return this.cache.size;
    }

    keys() {
        return Array.from(this.cache.keys());
    }
}

// LocalStorage cache with size management
export class PersistentCache {
    constructor(namespace, options = {}) {
        this.namespace = namespace;
        this.options = {
            maxItems: 50,
            defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
            ...options
        };
    }

    getKey(key) {
        return `${this.namespace}:${key}`;
    }

    set(key, value, ttl = this.options.defaultTTL) {
        const fullKey = this.getKey(key);
        const entry = {
            value,
            expires: ttl ? Date.now() + ttl : null,
            stored: Date.now()
        };

        try {
            localStorage.setItem(fullKey, JSON.stringify(entry));
            this.manageSize();
        } catch (e) {
            // Storage full - clear old entries and retry
            if (e.name === 'QuotaExceededError') {
                this.cleanup(0.5); // Remove 50% of items
                try {
                    localStorage.setItem(fullKey, JSON.stringify(entry));
                } catch (e2) {
                    logger.warn(LogCategory.PERF, 'PersistentCache: Storage quota exceeded');
                }
            }
        }
    }

    get(key) {
        const fullKey = this.getKey(key);
        const data = localStorage.getItem(fullKey);
        
        if (!data) return undefined;

        try {
            const entry = JSON.parse(data);
            
            // Check expiration
            if (entry.expires && Date.now() > entry.expires) {
                localStorage.removeItem(fullKey);
                return undefined;
            }

            return entry.value;
        } catch (e) {
            localStorage.removeItem(fullKey);
            return undefined;
        }
    }

    delete(key) {
        localStorage.removeItem(this.getKey(key));
    }

    clear() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this.namespace + ':')) {
                keys.push(key);
            }
        }
        keys.forEach(key => localStorage.removeItem(key));
    }

    manageSize() {
        const keys = this.getAllKeys();
        if (keys.length <= this.options.maxItems) return;

        // Remove oldest items
        const items = keys.map(key => {
            const data = localStorage.getItem(key);
            try {
                const entry = JSON.parse(data);
                return { key, stored: entry.stored };
            } catch (e) {
                return { key, stored: 0 };
            }
        });

        items.sort((a, b) => a.stored - b.stored);
        
        const toRemove = items.slice(0, items.length - this.options.maxItems);
        toRemove.forEach(item => localStorage.removeItem(item.key));
    }

    cleanup(percentToRemove = 0.3) {
        const keys = this.getAllKeys();
        const now = Date.now();
        const expiredKeys = [];
        const validItems = [];

        keys.forEach(key => {
            const data = localStorage.getItem(key);
            try {
                const entry = JSON.parse(data);
                if (entry.expires && now > entry.expires) {
                    expiredKeys.push(key);
                } else {
                    validItems.push({ key, stored: entry.stored });
                }
            } catch (e) {
                expiredKeys.push(key);
            }
        });

        // Remove expired
        expiredKeys.forEach(key => localStorage.removeItem(key));

        // Remove oldest if still over limit
        validItems.sort((a, b) => a.stored - b.stored);
        const toRemove = Math.floor(validItems.length * percentToRemove);
        validItems.slice(0, toRemove).forEach(item => {
            localStorage.removeItem(item.key);
        });
    }

    getAllKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this.namespace + ':')) {
                keys.push(key);
            }
        }
        return keys;
    }
}

// Request deduplication cache
export class RequestDeduplicator {
    constructor() {
        this.pending = new Map();
    }

    async execute(key, requestFn) {
        // If request is already pending, return the existing promise
        if (this.pending.has(key)) {
            return this.pending.get(key);
        }

        // Create new request
        const promise = requestFn().finally(() => {
            this.pending.delete(key);
        });

        this.pending.set(key, promise);
        return promise;
    }

    isPending(key) {
        return this.pending.has(key);
    }

    cancel(key) {
        this.pending.delete(key);
    }

    clear() {
        this.pending.clear();
    }
}

// Cache instances for different use cases
export const userCache = new MemoryCache({ maxSize: 50, defaultTTL: 5 * 60 * 1000 });
export const gameCache = new MemoryCache({ maxSize: 20, defaultTTL: 10 * 60 * 1000 });
export const leaderboardCache = new MemoryCache({ maxSize: 10, defaultTTL: 60 * 1000 });
export const requestDeduplicator = new RequestDeduplicator();

export default {
    MemoryCache,
    PersistentCache,
    RequestDeduplicator,
    userCache,
    gameCache,
    leaderboardCache,
    requestDeduplicator
};
