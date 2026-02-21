/**
 * Lazy Image Loader
 * Efficiently loads images only when they enter the viewport
 */

export class LazyImageLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: options.rootMargin || '50px',
            threshold: options.threshold || 0.01,
            placeholder: options.placeholder || null,
            errorPlaceholder: options.errorPlaceholder || null,
            ...options
        };
        
        this.imageCache = new Map();
        this.observer = null;
        this.pendingImages = new Set();
        
        this.init();
    }
    
    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                {
                    rootMargin: this.options.rootMargin,
                    threshold: this.options.threshold
                }
            );
        }
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                this.loadImage(img);
                this.observer.unobserve(img);
            }
        });
    }
    
    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;
        
        // Check cache
        if (this.imageCache.has(src)) {
            img.src = src;
            img.classList.add('loaded');
            return;
        }
        
        // Prevent duplicate loads
        if (this.pendingImages.has(src)) {
            // Wait for existing load to complete
            this.waitForLoad(src, img);
            return;
        }
        
        this.pendingImages.add(src);
        
        // Create a new image to preload
        const preloadImg = new Image();
        
        preloadImg.onload = () => {
            this.imageCache.set(src, true);
            this.pendingImages.delete(src);
            img.src = src;
            img.classList.add('loaded');
            img.dispatchEvent(new CustomEvent('lazyLoaded', { detail: { src } }));
        };
        
        preloadImg.onerror = () => {
            this.pendingImages.delete(src);
            if (this.options.errorPlaceholder) {
                img.src = this.options.errorPlaceholder;
            }
            img.classList.add('error');
            img.dispatchEvent(new CustomEvent('lazyError', { detail: { src } }));
        };
        
        preloadImg.src = src;
    }
    
    waitForLoad(src, img) {
        const checkInterval = setInterval(() => {
            if (this.imageCache.has(src)) {
                clearInterval(checkInterval);
                img.src = src;
                img.classList.add('loaded');
            } else if (!this.pendingImages.has(src)) {
                // Load failed or completed while waiting
                clearInterval(checkInterval);
                this.loadImage(img);
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => clearInterval(checkInterval), 10000);
    }
    
    observe(img) {
        if (!img) return;
        
        // Skip if already loaded or no data-src
        if (!img.dataset.src || img.src === img.dataset.src) return;
        
        if (this.observer) {
            this.observer.observe(img);
        } else {
            // Fallback: load immediately if no IntersectionObserver
            this.loadImage(img);
        }
    }
    
    observeAll(container = document) {
        const images = container.querySelectorAll('img[data-src]');
        images.forEach(img => this.observe(img));
    }
    
    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
    
    // Static helper to create a lazy-loaded image element
    static createImage(src, alt = '', options = {}) {
        const img = document.createElement('img');
        img.dataset.src = src;
        img.alt = alt;
        
        if (options.className) {
            img.className = options.className;
        }
        
        if (options.width) img.width = options.width;
        if (options.height) img.height = options.height;
        if (options.placeholder) img.src = options.placeholder;
        
        return img;
    }
}

// Global instance for app-wide lazy loading
export const lazyImageLoader = new LazyImageLoader({
    rootMargin: '100px', // Start loading 100px before viewport
    placeholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E'
});

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    lazyImageLoader.observeAll();
});

export default LazyImageLoader;
