/**
 * Lazy Loading Utilities
 * Images, scripts, and component lazy loading
 */

// Image lazy loading with Intersection Observer
export class LazyImageLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: '50px',
            threshold: 0.01,
            placeholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            ...options
        };
        
        this.observer = null;
        this.imageCache = new Map();
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            // Fallback: load all images immediately
            this.loadAllImages();
            return;
        }

        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            {
                rootMargin: this.options.rootMargin,
                threshold: this.options.threshold
            }
        );

        // Observe all lazy images
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.observer.observe(img);
        });
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadImage(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }

    async loadImage(img) {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;
        
        if (!src) return;

        // Check cache
        if (this.imageCache.has(src)) {
            this.applyImageSource(img, src, srcset);
            return;
        }

        // Show placeholder/skeleton while loading
        img.classList.add('img-loading');

        try {
            await this.preloadImage(src);
            this.imageCache.set(src, true);
            this.applyImageSource(img, src, srcset);
            img.classList.remove('img-loading');
            img.classList.add('img-loaded');
        } catch (error) {
            console.error('Failed to load image:', src, error);
            img.classList.add('img-error');
            img.dispatchEvent(new CustomEvent('lazyLoadError', { detail: { src, error } }));
        }
    }

    applyImageSource(img, src, srcset) {
        img.src = src;
        if (srcset) {
            img.srcset = srcset;
        }
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
    }

    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = resolve;
            image.onerror = reject;
            image.src = src;
        });
    }

    loadAllImages() {
        document.querySelectorAll('img[data-src]').forEach(img => this.loadImage(img));
    }

    observeImage(img) {
        if (this.observer && img.dataset.src) {
            this.observer.observe(img);
        }
    }

    destroy() {
        this.observer?.disconnect();
        this.imageCache.clear();
    }
}

// Script lazy loader
export class LazyScriptLoader {
    static loadedScripts = new Set();

    static async load(src, options = {}) {
        if (this.loadedScripts.has(src)) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = options.async !== false;
            script.defer = options.defer === true;
            
            if (options.module) {
                script.type = 'module';
            }

            script.onload = () => {
                this.loadedScripts.add(src);
                resolve();
            };
            
            script.onerror = reject;
            
            document.head.appendChild(script);
        });
    }

    static loadMultiple(sources) {
        return Promise.all(sources.map(src => this.load(src)));
    }
}

// Component lazy loader
export class LazyComponentLoader {
    constructor() {
        this.cache = new Map();
    }

    async load(path) {
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }

        try {
            const module = await import(path);
            this.cache.set(path, module);
            return module;
        } catch (error) {
            console.error(`Failed to load component: ${path}`, error);
            throw error;
        }
    }

    preload(paths) {
        paths.forEach(path => this.load(path));
    }

    clearCache() {
        this.cache.clear();
    }
}

// Game engine lazy loader
export const gameLoader = new LazyComponentLoader();

export async function loadGameEngine(gameId) {
    const gamePaths = {
        snake: './js/games/SnakeEngine.js',
        tetris: './js/games/TetrisEngine.js',
        pacman: './js/games/PacmanEngine.js',
        pong: './js/games/PongEngine.js',
        breakout: './js/games/BreakoutEngine.js',
        spaceinvaders: './js/games/SpaceInvadersEngine.js',
        asteroids: './js/games/AsteroidsEngine.js',
        flappybird: './js/games/FlappyBirdEngine.js',
        dino: './js/games/DinoEngine.js',
        memory: './js/games/MemoryEngine.js',
        minesweeper: './js/games/MinesweeperEngine.js'
    };

    const path = gamePaths[gameId];
    if (!path) {
        throw new Error(`Unknown game: ${gameId}`);
    }

    return gameLoader.load(path);
}

// Intersection Observer helper for triggering actions
export class ScrollTrigger {
    constructor(callback, options = {}) {
        this.callback = callback;
        this.options = {
            rootMargin: '0px',
            threshold: 0,
            once: true,
            ...options
        };
        
        this.observer = null;
        this.elements = new Set();
    }

    observe(element) {
        if (!this.observer) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                {
                    rootMargin: this.options.rootMargin,
                    threshold: this.options.threshold
                }
            );
        }
        
        this.elements.add(element);
        this.observer.observe(element);
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.callback(entry.target);
                
                if (this.options.once) {
                    this.unobserve(entry.target);
                }
            }
        });
    }

    unobserve(element) {
        this.elements.delete(element);
        this.observer?.unobserve(element);
    }

    disconnect() {
        this.observer?.disconnect();
        this.elements.clear();
    }
}

export default {
    LazyImageLoader,
    LazyScriptLoader,
    LazyComponentLoader,
    gameLoader,
    loadGameEngine,
    ScrollTrigger
};
