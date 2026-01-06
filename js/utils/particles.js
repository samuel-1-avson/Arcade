/**
 * Particle system for visual effects
 */
import ObjectPool from '../engine/ObjectPool.js';
import { random } from './math.js';

/**
 * Particle class
 */
class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.life = 0;
        this.maxLife = 1;
        this.size = 4;
        this.sizeEnd = 0;
        this.color = '#fff';
        this.colorEnd = null;
        this.alpha = 1;
        this.alphaEnd = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.gravity = 0;
        this.friction = 1;
        this.type = 'circle'; // circle, square, star
    }

    update(dt) {
        // Apply gravity
        this.vy += this.gravity * dt;

        // Apply acceleration
        this.vx += this.ax * dt;
        this.vy += this.ay * dt;

        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Update rotation
        this.rotation += this.rotationSpeed * dt;

        // Update life
        this.life += dt;

        // Check if dead
        return this.life < this.maxLife;
    }

    getProgress() {
        return Math.min(this.life / this.maxLife, 1);
    }
}

/**
 * Particle Emitter
 */
export class ParticleEmitter {
    constructor(config = {}) {
        this.x = config.x || 0;
        this.y = config.y || 0;

        // Emission settings
        this.emissionRate = config.emissionRate || 10; // particles per second
        this.maxParticles = config.maxParticles || 100;
        this.burst = config.burst || 0;

        // Particle settings (with min/max ranges)
        this.lifeMin = config.lifeMin || 0.5;
        this.lifeMax = config.lifeMax || 1.5;
        this.speedMin = config.speedMin || 50;
        this.speedMax = config.speedMax || 150;
        this.angleMin = config.angleMin || 0;
        this.angleMax = config.angleMax || Math.PI * 2;
        this.sizeMin = config.sizeMin || 4;
        this.sizeMax = config.sizeMax || 8;
        this.sizeEnd = config.sizeEnd ?? 0;
        this.gravity = config.gravity || 0;
        this.friction = config.friction || 0.98;

        // Color
        this.colors = config.colors || ['#fff'];
        this.alphaStart = config.alphaStart || 1;
        this.alphaEnd = config.alphaEnd || 0;

        // Particle type
        this.type = config.type || 'circle';

        // Object pool
        this.pool = new ObjectPool(
            () => new Particle(),
            (p) => p.reset(),
            this.maxParticles
        );

        this.particles = [];
        this.emissionAccumulator = 0;
        this.isEmitting = true;
    }

    /**
     * Emit a burst of particles
     * @param {number} count - Number of particles to emit
     */
    emit(count) {
        for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
            const particle = this.pool.get();
            this._initParticle(particle);
            this.particles.push(particle);
        }
    }

    _initParticle(particle) {
        particle.x = this.x;
        particle.y = this.y;

        // Random angle and speed
        const angle = random(this.angleMin, this.angleMax);
        const speed = random(this.speedMin, this.speedMax);
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;

        // Random life
        particle.maxLife = random(this.lifeMin, this.lifeMax);

        // Size
        particle.size = random(this.sizeMin, this.sizeMax);
        particle.sizeEnd = this.sizeEnd;

        // Color
        particle.color = this.colors[Math.floor(Math.random() * this.colors.length)];

        // Alpha
        particle.alpha = this.alphaStart;
        particle.alphaEnd = this.alphaEnd;

        // Physics
        particle.gravity = this.gravity;
        particle.friction = this.friction;

        // Type
        particle.type = this.type;
    }

    update(dt) {
        // Emit particles based on rate
        if (this.isEmitting) {
            this.emissionAccumulator += this.emissionRate * dt;
            while (this.emissionAccumulator >= 1 && this.particles.length < this.maxParticles) {
                this.emit(1);
                this.emissionAccumulator--;
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            const alive = particle.update(dt);

            if (!alive) {
                this.pool.release(particle);
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        ctx.save();

        for (const p of this.particles) {
            const progress = p.getProgress();

            // Interpolate size
            const size = p.size + (p.sizeEnd - p.size) * progress;

            // Interpolate alpha
            const alpha = p.alpha + (p.alphaEnd - p.alpha) * progress;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;

            switch (p.type) {
                case 'circle':
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case 'square':
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    ctx.fillRect(-size / 2, -size / 2, size, size);
                    ctx.restore();
                    break;

                case 'star':
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    this._drawStar(ctx, 0, 0, 5, size / 2, size / 4);
                    ctx.restore();
                    break;
            }
        }

        ctx.restore();
    }

    _drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }

        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    start() {
        this.isEmitting = true;
    }

    stop() {
        this.isEmitting = false;
    }

    clear() {
        this.particles.forEach(p => this.pool.release(p));
        this.particles = [];
    }

    get count() {
        return this.particles.length;
    }
}

/**
 * Particle effect presets
 */
export const ParticlePresets = {
    explosion: {
        emissionRate: 0,
        burst: 30,
        lifeMin: 0.3,
        lifeMax: 0.8,
        speedMin: 100,
        speedMax: 300,
        sizeMin: 4,
        sizeMax: 12,
        sizeEnd: 0,
        colors: ['#ff0', '#f80', '#f00', '#fff'],
        alphaEnd: 0,
        friction: 0.95
    },

    fire: {
        emissionRate: 30,
        lifeMin: 0.5,
        lifeMax: 1,
        speedMin: 30,
        speedMax: 80,
        angleMin: -Math.PI * 0.75,
        angleMax: -Math.PI * 0.25,
        sizeMin: 8,
        sizeMax: 16,
        sizeEnd: 2,
        colors: ['#ff0', '#f80', '#f40'],
        alphaEnd: 0,
        gravity: -50
    },

    smoke: {
        emissionRate: 10,
        lifeMin: 1,
        lifeMax: 2,
        speedMin: 20,
        speedMax: 40,
        angleMin: -Math.PI * 0.6,
        angleMax: -Math.PI * 0.4,
        sizeMin: 10,
        sizeMax: 20,
        sizeEnd: 40,
        colors: ['#666', '#888', '#aaa'],
        alphaStart: 0.5,
        alphaEnd: 0,
        gravity: -20
    },

    sparkle: {
        emissionRate: 20,
        lifeMin: 0.3,
        lifeMax: 0.6,
        speedMin: 50,
        speedMax: 100,
        sizeMin: 2,
        sizeMax: 6,
        sizeEnd: 0,
        colors: ['#fff', '#ff0', '#0ff'],
        type: 'star'
    },

    confetti: {
        emissionRate: 0,
        burst: 50,
        lifeMin: 2,
        lifeMax: 4,
        speedMin: 100,
        speedMax: 300,
        angleMin: -Math.PI,
        angleMax: 0,
        sizeMin: 6,
        sizeMax: 12,
        colors: ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'],
        gravity: 200,
        friction: 0.99,
        type: 'square'
    }
};

/**
 * Create a particle emitter from a preset
 * @param {string} presetName 
 * @param {number} x 
 * @param {number} y 
 * @returns {ParticleEmitter}
 */
export function createEmitter(presetName, x = 0, y = 0) {
    const preset = ParticlePresets[presetName] || {};
    return new ParticleEmitter({
        x,
        y,
        ...preset
    });
}

export default {
    ParticleEmitter,
    ParticlePresets,
    createEmitter
};
