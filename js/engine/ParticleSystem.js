/**
 * ParticleSystem - Universal particle effects for AAA visuals
 * Drop-in module for any game extending GameEngine
 */

// Particle presets for common effects
const PARTICLE_PRESETS = {
    explosion: {
        count: 20,
        speed: { min: 100, max: 300 },
        life: { min: 0.3, max: 0.8 },
        size: { min: 2, max: 6 },
        colors: ['#ff6600', '#ffaa00', '#ff3300', '#ffff00'],
        gravity: 200,
        fadeOut: true
    },
    sparkle: {
        count: 8,
        speed: { min: 50, max: 150 },
        life: { min: 0.2, max: 0.5 },
        size: { min: 1, max: 3 },
        colors: ['#ffffff', '#ffff00', '#00ffff'],
        gravity: 0,
        fadeOut: true
    },
    collectItem: {
        count: 12,
        speed: { min: 80, max: 200 },
        life: { min: 0.3, max: 0.6 },
        size: { min: 2, max: 4 },
        colors: ['#00ff00', '#00ffaa', '#88ff88'],
        gravity: -100,
        fadeOut: true
    },
    hit: {
        count: 6,
        speed: { min: 100, max: 200 },
        life: { min: 0.15, max: 0.3 },
        size: { min: 2, max: 5 },
        colors: ['#ff0000', '#ff4444', '#ff8888'],
        gravity: 0,
        fadeOut: true
    },
    dust: {
        count: 4,
        speed: { min: 20, max: 60 },
        life: { min: 0.4, max: 0.8 },
        size: { min: 1, max: 3 },
        colors: ['#888888', '#aaaaaa', '#cccccc'],
        gravity: -20,
        fadeOut: true
    },
    trail: {
        count: 1,
        speed: { min: 0, max: 10 },
        life: { min: 0.1, max: 0.2 },
        size: { min: 2, max: 4 },
        colors: ['#00ffff'],
        gravity: 0,
        fadeOut: true
    },
    levelUp: {
        count: 40,
        speed: { min: 100, max: 400 },
        life: { min: 0.5, max: 1.2 },
        size: { min: 3, max: 8 },
        colors: ['#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#00ff00'],
        gravity: 100,
        fadeOut: true
    }
};

class ParticleSystem {
    constructor(maxParticles = 500) {
        this.particles = [];
        this.maxParticles = maxParticles;
    }

    /**
     * Emit particles at a position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string|Object} preset - Preset name or custom config
     * @param {Object} overrides - Override preset values
     */
    emit(x, y, preset = 'explosion', overrides = {}) {
        const config = typeof preset === 'string' 
            ? { ...PARTICLE_PRESETS[preset], ...overrides }
            : { ...preset, ...overrides };

        const count = Math.min(config.count, this.maxParticles - this.particles.length);

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = this._randomRange(config.speed.min, config.speed.max);
            const life = this._randomRange(config.life.min, config.life.max);
            const size = this._randomRange(config.size.min, config.size.max);
            const color = config.colors[Math.floor(Math.random() * config.colors.length)];

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life,
                maxLife: life,
                size,
                color,
                gravity: config.gravity || 0,
                fadeOut: config.fadeOut !== false
            });
        }
    }

    /**
     * Emit particles in a specific direction
     */
    emitDirectional(x, y, angle, spread, preset = 'trail', overrides = {}) {
        const config = typeof preset === 'string' 
            ? { ...PARTICLE_PRESETS[preset], ...overrides }
            : { ...preset, ...overrides };

        const count = Math.min(config.count, this.maxParticles - this.particles.length);

        for (let i = 0; i < count; i++) {
            const particleAngle = angle + (Math.random() - 0.5) * spread;
            const speed = this._randomRange(config.speed.min, config.speed.max);
            const life = this._randomRange(config.life.min, config.life.max);
            const size = this._randomRange(config.size.min, config.size.max);
            const color = config.colors[Math.floor(Math.random() * config.colors.length)];

            this.particles.push({
                x,
                y,
                vx: Math.cos(particleAngle) * speed,
                vy: Math.sin(particleAngle) * speed,
                life,
                maxLife: life,
                size,
                color,
                gravity: config.gravity || 0,
                fadeOut: config.fadeOut !== false
            });
        }
    }

    /**
     * Update all particles
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Apply velocity
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // Apply gravity
            p.vy += p.gravity * dt;

            // Decay life
            p.life -= dt;

            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Render all particles
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        for (const p of this.particles) {
            const alpha = p.fadeOut ? (p.life / p.maxLife) : 1;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    }

    /**
     * Get particle count
     */
    get count() {
        return this.particles.length;
    }

    _randomRange(min, max) {
        return min + Math.random() * (max - min);
    }
}

export { ParticleSystem, PARTICLE_PRESETS };
export default ParticleSystem;
