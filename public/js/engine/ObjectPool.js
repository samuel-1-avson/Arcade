/**
 * ObjectPool - Reusable object pooling for performance optimization
 * Used for bullets, particles, and other frequently created/destroyed objects
 */
class ObjectPool {
    /**
     * Create an object pool
     * @param {Function} factory - Function that creates new objects
     * @param {Function} reset - Function that resets an object for reuse
     * @param {number} initialSize - Number of objects to pre-create
     */
    constructor(factory, reset, initialSize = 10) {
        this.factory = factory;
        this.reset = reset;
        this.pool = [];
        this.active = [];

        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(factory());
        }
    }

    /**
     * Get an object from the pool (or create new if empty)
     * @returns {Object} A pool object ready for use
     */
    get() {
        let obj;

        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.factory();
        }

        this.reset(obj);
        this.active.push(obj);
        return obj;
    }

    /**
     * Return an object to the pool
     * @param {Object} obj - Object to return
     */
    release(obj) {
        const index = this.active.indexOf(obj);
        if (index > -1) {
            this.active.splice(index, 1);
            this.pool.push(obj);
        }
    }

    /**
     * Release all active objects back to the pool
     */
    releaseAll() {
        while (this.active.length > 0) {
            this.pool.push(this.active.pop());
        }
    }

    /**
     * Get count of active objects
     * @returns {number}
     */
    getActiveCount() {
        return this.active.length;
    }

    /**
     * Get count of available objects in pool
     * @returns {number}
     */
    getAvailableCount() {
        return this.pool.length;
    }

    /**
     * Iterate over active objects
     * @param {Function} callback - Called with each active object
     */
    forEach(callback) {
        // Iterate in reverse for safe removal during iteration
        for (let i = this.active.length - 1; i >= 0; i--) {
            callback(this.active[i], i);
        }
    }

    /**
     * Update all active objects
     * @param {number} dt - Delta time
     * @param {Function} updateFn - Update function (obj, dt) => shouldKeep
     */
    update(dt, updateFn) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const obj = this.active[i];
            const shouldKeep = updateFn(obj, dt);

            if (!shouldKeep) {
                this.active.splice(i, 1);
                this.pool.push(obj);
            }
        }
    }
}

/**
 * Create a particle pool with common defaults
 */
export function createParticlePool(initialSize = 50) {
    return new ObjectPool(
        () => ({
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: 1,
            size: 4,
            color: '#fff',
            alpha: 1
        }),
        (p) => {
            p.life = 0;
            p.alpha = 1;
        },
        initialSize
    );
}

/**
 * Create a bullet pool with common defaults
 */
export function createBulletPool(initialSize = 100) {
    return new ObjectPool(
        () => ({
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: 4,
            damage: 1,
            active: true
        }),
        (b) => {
            b.active = true;
            b.damage = 1;
        },
        initialSize
    );
}

export default ObjectPool;
