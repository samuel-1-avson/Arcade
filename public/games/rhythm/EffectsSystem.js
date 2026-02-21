/**
 * Rhythm Game - Effects System
 * Visual effects: particles, screen effects, and animations
 */

// Particle types
const ParticleType = {
    BURST: 'burst',
    TRAIL: 'trail',
    SPARKLE: 'sparkle',
    RING: 'ring'
};

/**
 * Particle class for individual effect particles
 */
class Particle {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.vx = config.vx || (Math.random() - 0.5) * 200;
        this.vy = config.vy || (Math.random() - 0.5) * 200;
        this.life = config.life || 0.5;
        this.maxLife = this.life;
        this.size = config.size || 4;
        this.color = config.color || '#ffffff';
        this.type = config.type || ParticleType.BURST;
        this.gravity = config.gravity || 0;
        this.friction = config.friction || 0.98;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 5;
    }
    
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.rotation += this.rotationSpeed * dt;
        this.life -= dt;
        return this.life > 0;
    }
    
    get alpha() {
        return Math.max(0, this.life / this.maxLife);
    }
    
    get scale() {
        return 0.5 + (this.life / this.maxLife) * 0.5;
    }
}

/**
 * Effects System Manager
 */
export class EffectsSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.screenEffects = [];
        this.pulseIntensity = 0;
        this.shakeAmount = 0;
        this.shakeDecay = 0.9;
        
        // Lane glow states
        this.laneGlow = [0, 0, 0, 0];
        
        // Combo fire effect
        this.comboFire = {
            active: false,
            particles: [],
            intensity: 0
        };
    }
    
    /**
     * Update all effects
     */
    update(dt) {
        // Update particles
        this.particles = this.particles.filter(p => p.update(dt));
        
        // Update screen shake
        this.shakeAmount *= this.shakeDecay;
        if (this.shakeAmount < 0.1) this.shakeAmount = 0;
        
        // Update pulse
        this.pulseIntensity *= 0.95;
        
        // Update lane glow
        for (let i = 0; i < 4; i++) {
            this.laneGlow[i] *= 0.9;
        }
        
        // Update combo fire
        if (this.comboFire.active) {
            this.comboFire.intensity *= 0.98;
            this.comboFire.particles = this.comboFire.particles.filter(p => p.update(dt));
        }
        
        // Update screen effects
        this.screenEffects = this.screenEffects.filter(e => {
            e.life -= dt;
            return e.life > 0;
        });
    }
    
    /**
     * Create hit effect at position
     */
    createHitEffect(x, y, hitType, laneIndex) {
        const colors = {
            perfect: ['#4ade80', '#22c55e', '#86efac'],
            good: ['#60a5fa', '#3b82f6', '#93c5fd'],
            ok: ['#fbbf24', '#f59e0b', '#fde047'],
            miss: ['#f87171', '#ef4444', '#fca5a5']
        };
        
        const particleCount = hitType === 'perfect' ? 20 : hitType === 'good' ? 12 : 8;
        const colorSet = colors[hitType] || colors.ok;
        
        // Create burst particles
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 100 + Math.random() * 150;
            
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                life: 0.4 + Math.random() * 0.3,
                size: 3 + Math.random() * 4,
                color: colorSet[Math.floor(Math.random() * colorSet.length)],
                type: ParticleType.BURST,
                gravity: 200,
                friction: 0.96
            }));
        }
        
        // Create expanding ring for perfect hits
        if (hitType === 'perfect') {
            this.screenEffects.push({
                type: 'ring',
                x, y,
                radius: 10,
                maxRadius: 80,
                life: 0.3,
                maxLife: 0.3,
                color: colorSet[0]
            });
            
            this.pulseIntensity = 0.3;
        }
        
        // Update lane glow
        if (laneIndex >= 0 && laneIndex < 4) {
            this.laneGlow[laneIndex] = hitType === 'perfect' ? 1 : hitType === 'good' ? 0.7 : 0.4;
        }
    }
    
    /**
     * Create miss effect
     */
    createMissEffect(x, y, laneIndex) {
        // Subtle miss indicator
        for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle(x, y, {
                vx: (Math.random() - 0.5) * 50,
                vy: Math.random() * 50 + 30,
                life: 0.3,
                size: 2,
                color: '#f87171',
                type: ParticleType.BURST,
                gravity: 100,
                friction: 0.95
            }));
        }
        
        // Small screen shake on miss (optional)
        this.shakeAmount = 2;
    }
    
    /**
     * Create combo milestone effect
     */
    createComboEffect(combo) {
        if (combo % 25 === 0 && combo > 0) {
            // Big combo milestone - center screen burst
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            
            for (let i = 0; i < 30; i++) {
                const angle = (i / 30) * Math.PI * 2;
                const speed = 200 + Math.random() * 100;
                
                this.particles.push(new Particle(centerX, centerY, {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.6,
                    size: 5 + Math.random() * 5,
                    color: `hsl(${(combo * 3) % 360}, 70%, 60%)`,
                    type: ParticleType.SPARKLE,
                    friction: 0.97
                }));
            }
            
            this.pulseIntensity = 0.5;
        }
        
        // Activate combo fire at 10+ combo
        if (combo >= 10) {
            this.comboFire.active = true;
            this.comboFire.intensity = Math.min(1, combo / 50);
        }
    }
    
    /**
     * Reset combo fire when combo breaks
     */
    breakCombo() {
        this.comboFire.active = false;
        this.comboFire.intensity = 0;
        this.shakeAmount = 3;
    }
    
    /**
     * Create hold note trail effect
     */
    createHoldTrail(x, y, color) {
        this.particles.push(new Particle(x, y, {
            vx: (Math.random() - 0.5) * 20,
            vy: -Math.random() * 30 - 10,
            life: 0.3,
            size: 3 + Math.random() * 2,
            color: color,
            type: ParticleType.TRAIL,
            friction: 0.99
        }));
    }
    
    /**
     * Create slide note trail effect
     */
    createSlideTrail(x, y, color) {
        this.particles.push(new Particle(x, y, {
            vx: (Math.random() - 0.5) * 40,
            vy: (Math.random() - 0.5) * 40,
            life: 0.2,
            size: 2 + Math.random() * 2,
            color: color,
            type: ParticleType.SPARKLE,
            friction: 0.95
        }));
    }
    
    /**
     * Add beat pulse effect
     */
    addBeatPulse(intensity = 0.2) {
        this.pulseIntensity = Math.min(1, this.pulseIntensity + intensity);
    }
    
    /**
     * Get screen shake offset
     */
    getShakeOffset() {
        if (this.shakeAmount < 0.1) return { x: 0, y: 0 };
        return {
            x: (Math.random() - 0.5) * this.shakeAmount * 2,
            y: (Math.random() - 0.5) * this.shakeAmount * 2
        };
    }
    
    /**
     * Render all effects
     */
    render(ctx) {
        // Save context state
        ctx.save();
        
        // Apply screen shake
        const shake = this.getShakeOffset();
        if (shake.x !== 0 || shake.y !== 0) {
            ctx.translate(shake.x, shake.y);
        }
        
        // Render screen effects (rings, etc)
        for (const effect of this.screenEffects) {
            if (effect.type === 'ring') {
                const progress = 1 - (effect.life / effect.maxLife);
                const radius = effect.radius + (effect.maxRadius - effect.radius) * progress;
                const alpha = effect.life / effect.maxLife;
                
                ctx.strokeStyle = effect.color;
                ctx.globalAlpha = alpha * 0.5;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        ctx.globalAlpha = 1;
        
        // Render particles
        for (const particle of this.particles) {
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            
            const size = particle.size * particle.scale;
            
            if (particle.type === ParticleType.SPARKLE) {
                // Diamond shape
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.lineTo(size, 0);
                ctx.lineTo(0, size);
                ctx.lineTo(-size, 0);
                ctx.closePath();
                ctx.fill();
            } else {
                // Circle
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        // Restore context
        ctx.restore();
    }
    
    /**
     * Render lane glow overlay
     */
    renderLaneGlow(ctx, laneStartX, laneWidth, laneCount, colors) {
        for (let i = 0; i < laneCount; i++) {
            if (this.laneGlow[i] > 0.05) {
                const x = laneStartX + i * laneWidth;
                const gradient = ctx.createLinearGradient(x, 0, x + laneWidth, 0);
                const color = colors[i];
                
                gradient.addColorStop(0, 'transparent');
                gradient.addColorStop(0.5, color);
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.globalAlpha = this.laneGlow[i] * 0.3;
                ctx.fillRect(x, 0, laneWidth, ctx.canvas.height);
            }
        }
        ctx.globalAlpha = 1;
    }
    
    /**
     * Render background pulse effect
     */
    renderPulse(ctx, width, height) {
        if (this.pulseIntensity > 0.01) {
            const gradient = ctx.createRadialGradient(
                width / 2, height / 2, 0,
                width / 2, height / 2, Math.max(width, height) / 2
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${this.pulseIntensity * 0.1})`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }
    }
    
    /**
     * Clear all effects
     */
    clear() {
        this.particles = [];
        this.screenEffects = [];
        this.pulseIntensity = 0;
        this.shakeAmount = 0;
        this.laneGlow = [0, 0, 0, 0];
        this.comboFire.active = false;
        this.comboFire.particles = [];
        this.comboFire.intensity = 0;
    }
}

export default EffectsSystem;
