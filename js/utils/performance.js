/**
 * Performance Utilities
 * Debouncing, throttling, RAF scheduling, and metrics
 */

// Debounce function
export function debounce(fn, delay, options = {}) {
    let timeoutId;
    const { leading = false, trailing = true } = options;

    return function(...args) {
        const invokeLeading = leading && !timeoutId;
        
        clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
            timeoutId = null;
            if (trailing) {
                fn.apply(this, args);
            }
        }, delay);

        if (invokeLeading) {
            fn.apply(this, args);
        }
    };
}

// Throttle function
export function throttle(fn, limit, options = {}) {
    let inThrottle;
    let lastResult;
    const { trailing = true } = options;

    return function(...args) {
        if (!inThrottle) {
            lastResult = fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
                if (trailing) {
                    lastResult = fn.apply(this, args);
                }
            }, limit);
        }
        return lastResult;
    };
}

// RequestAnimationFrame scheduler
export class RAFScheduler {
    constructor() {
        this.pending = new Map();
        this.frameId = null;
    }

    schedule(key, fn, priority = 0) {
        // Cancel existing frame for this key
        if (this.pending.has(key)) {
            this.pending.delete(key);
        }

        this.pending.set(key, { fn, priority });

        if (!this.frameId) {
            this.frameId = requestAnimationFrame(() => this.flush());
        }
    }

    flush() {
        this.frameId = null;

        // Sort by priority and execute
        const entries = Array.from(this.pending.entries())
            .sort((a, b) => b[1].priority - a[1].priority);
        
        this.pending.clear();

        // Execute high priority tasks
        const deadline = performance.now() + 16; // ~1 frame
        
        for (const [key, { fn }] of entries) {
            if (performance.now() > deadline) {
                // Schedule remaining for next frame
                for (const [k, v] of entries) {
                    if (!this.pending.has(k)) {
                        this.pending.set(k, v);
                    }
                }
                this.frameId = requestAnimationFrame(() => this.flush());
                break;
            }
            
            try {
                fn();
            } catch (error) {
                console.error('RAFScheduler task error:', error);
            }
        }
    }

    cancel(key) {
        this.pending.delete(key);
    }

    clear() {
        this.pending.clear();
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
    }
}

// Performance metrics collector
export class PerformanceMetrics {
    constructor() {
        this.metrics = [];
        this.observers = [];
    }

    mark(name) {
        performance.mark(`${name}-start`);
    }

    measure(name, startMark = null) {
        if (startMark) {
            performance.mark(`${name}-end`);
            performance.measure(name, `${startMark}-start`, `${name}-end`);
        } else {
            performance.mark(`${name}-end`);
            performance.measure(name, `${name}-start`, `${name}-end`);
        }

        const entries = performance.getEntriesByName(name);
        const latest = entries[entries.length - 1];
        
        this.metrics.push({
            name,
            duration: latest.duration,
            timestamp: Date.now()
        });

        return latest.duration;
    }

    // Measure function execution time
    measureFunction(fn, name) {
        return (...args) => {
            const start = performance.now();
            const result = fn(...args);
            
            if (result instanceof Promise) {
                return result.finally(() => {
                    const duration = performance.now() - start;
                    this.recordMetric(name, duration);
                });
            }
            
            const duration = performance.now() - start;
            this.recordMetric(name, duration);
            return result;
        };
    }

    recordMetric(name, duration) {
        this.metrics.push({ name, duration, timestamp: Date.now() });
    }

    getMetrics(name = null) {
        if (name) {
            return this.metrics.filter(m => m.name === name);
        }
        return [...this.metrics];
    }

    getAverage(name) {
        const metrics = this.getMetrics(name);
        if (metrics.length === 0) return 0;
        return metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
    }

    clear() {
        this.metrics = [];
        performance.clearMarks();
        performance.clearMeasures();
    }

    // Web Vitals
    observeWebVitals(callback) {
        // LCP
        if ('web-vitals' in window) {
            // Use web-vitals library if available
        } else {
            // Fallback to PerformanceObserver
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        callback(entry.name, entry);
                    }
                });
                
                observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
                this.observers.push(observer);
            } catch (e) {
                // PerformanceObserver not supported
            }
        }
    }

    disconnect() {
        this.observers.forEach(obs => obs.disconnect());
        this.observers = [];
    }
}

// Idle callback scheduler
export class IdleScheduler {
    constructor(options = {}) {
        this.options = {
            timeout: 2000,
            ...options
        };
        this.tasks = [];
    }

    schedule(task, priority = 0) {
        this.tasks.push({ task, priority });
        this.tasks.sort((a, b) => b.priority - a.priority);
        this.scheduleFlush();
    }

    scheduleFlush() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback((deadline) => this.flush(deadline), {
                timeout: this.options.timeout
            });
        } else {
            // Fallback to setTimeout
            setTimeout(() => this.flush({ didTimeout: true, timeRemaining: () => 0 }), 1);
        }
    }

    flush(deadline) {
        while (this.tasks.length > 0 && (deadline.timeRemaining() > 0 || deadline.didTimeout)) {
            const { task } = this.tasks.shift();
            try {
                task();
            } catch (error) {
                console.error('IdleScheduler task error:', error);
            }
        }

        if (this.tasks.length > 0) {
            this.scheduleFlush();
        }
    }

    clear() {
        this.tasks = [];
    }
}

// Memoization utility
export function memoize(fn, options = {}) {
    const { maxSize = 100, resolver = JSON.stringify } = options;
    const cache = new Map();

    return function(...args) {
        const key = resolver(args);
        
        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = fn.apply(this, args);
        
        // Manage cache size
        if (cache.size >= maxSize) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }
        
        cache.set(key, result);
        return result;
    };
}

// Singleton instances
export const rafScheduler = new RAFScheduler();
export const idleScheduler = new IdleScheduler();
export const performanceMetrics = new PerformanceMetrics();

export default {
    debounce,
    throttle,
    RAFScheduler,
    PerformanceMetrics,
    IdleScheduler,
    memoize,
    rafScheduler,
    idleScheduler,
    performanceMetrics
};
