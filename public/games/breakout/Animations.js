/**
 * Breakout Game - Animation & Particle System
 * Enhanced visual effects for a polished game experience
 */

/**
 * Particle class - Individual particle for effects
 */
class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 200;
        this.vy = options.vy || (Math.random() - 0.5) * 200;
        this.gravity = options.gravity ?? 300;
        this.friction = options.friction ?? 0.98;
        this.life = options.life || 1;
        this.maxLife = this.life;
        this.size = options.size || 4;
        this.color = options.color || '#ffffff';
        this.shape = options.shape || 'circle'; // circle, square, triangle, star
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 10;
        this.shrink = options.shrink ?? true;
        this.fade = options.fade ?? true;
        this.glow = options.glow ?? false;
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
    
    render(ctx) {
        const alpha = this.fade ? this.life / this.maxLife : 1;
        const size = this.shrink ? this.size * (this.life / this.maxLife) : this.size;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.glow) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = size * 2;
        }
        
        ctx.fillStyle = this.color;
        
        switch (this.shape) {
            case 'square':
                ctx.fillRect(-size / 2, -size / 2, size, size);
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.lineTo(-size * 0.866, size * 0.5);
                ctx.lineTo(size * 0.866, size * 0.5);
                ctx.closePath();
                ctx.fill();
                break;
            case 'star':
                this.drawStar(ctx, 0, 0, 5, size, size / 2);
                break;
            default:
                ctx.beginPath();
                ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }
}

/**
 * Trail class - Motion blur trail for balls
 */
class Trail {
    constructor(maxLength = 10) {
        this.points = [];
        this.maxLength = maxLength;
    }
    
    addPoint(x, y, color) {
        this.points.unshift({ x, y, color, alpha: 1 });
        if (this.points.length > this.maxLength) {
            this.points.pop();
        }
    }
    
    update() {
        for (let i = 0; i < this.points.length; i++) {
            this.points[i].alpha = 1 - (i / this.points.length);
        }
    }
    
    render(ctx, radius) {
        for (let i = this.points.length - 1; i >= 0; i--) {
            const p = this.points[i];
            const size = radius * (1 - i / this.points.length * 0.5);
            
            ctx.globalAlpha = p.alpha * 0.3;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    clear() {
        this.points = [];
    }
}

/**
 * AnimationSystem - Manages all visual effects
 */
export class AnimationSystem {
    constructor(game) {
        this.game = game;
        this.particles = [];
        this.trails = new Map(); // Ball ID -> Trail
        this.screenEffects = [];
        this.pendingTransitions = [];
        
        // Screen effect state
        this.flashAlpha = 0;
        this.flashColor = '#ffffff';
        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;
        this.pulseScale = 1;
        this.pulseDecay = 0.95;
    }
    
    // ===== Particle Emitters =====
    
    /**
     * Brick shatter effect - fragments fly out
     */
    emitBrickShatter(x, y, width, height, color) {
        const fragmentCount = 12;
        const shapes = ['square', 'triangle'];
        
        for (let i = 0; i < fragmentCount; i++) {
            const angle = (i / fragmentCount) * Math.PI * 2 + Math.random() * 0.5;
            const speed = 150 + Math.random() * 150;
            
            this.particles.push(new Particle(
                x + width / 2 + (Math.random() - 0.5) * width,
                y + height / 2 + (Math.random() - 0.5) * height,
                {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 50,
                    gravity: 400,
                    life: 0.6 + Math.random() * 0.4,
                    size: 3 + Math.random() * 4,
                    color,
                    shape: shapes[Math.floor(Math.random() * shapes.length)],
                    glow: true
                }
            ));
        }
    }
    
    /**
     * Explosion effect - for explosive bricks
     */
    emitExplosion(x, y, radius = 50) {
        const particleCount = 30;
        const colors = ['#ff6644', '#ffaa44', '#ffdd44', '#ffffff'];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 100 + Math.random() * 200;
            
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 100,
                life: 0.5 + Math.random() * 0.5,
                size: 5 + Math.random() * 8,
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: 'circle',
                glow: true
            }));
        }
        
        // Add screen shake
        this.shake(8);
        this.flash('#ff6644', 0.3);
    }
    
    /**
     * Power-up collect effect
     */
    emitPowerupCollect(x, y, color) {
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 80 + Math.random() * 80;
            
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30,
                gravity: 50,
                life: 0.8,
                size: 4 + Math.random() * 4,
                color,
                shape: 'star',
                glow: true
            }));
        }
        
        this.flash(color, 0.15);
    }
    
    /**
     * Combo burst effect
     */
    emitComboBurst(x, y, comboCount) {
        const intensity = Math.min(comboCount / 10, 3);
        const particleCount = 10 + comboCount * 2;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100 * intensity;
            
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 0,
                friction: 0.95,
                life: 0.5 + Math.random() * 0.5,
                size: 2 + Math.random() * 3,
                color: `hsl(${45 + Math.random() * 30}, 80%, 60%)`,
                shape: 'circle',
                glow: true
            }));
        }
        
        if (comboCount >= 10) {
            this.pulse(1.02);
        }
    }
    
    /**
     * Sparkle effect - ambient particles
     */
    emitSparkle(x, y, color = '#ffffff') {
        this.particles.push(new Particle(x, y, {
            vx: (Math.random() - 0.5) * 30,
            vy: -20 - Math.random() * 40,
            gravity: -10,
            life: 0.8 + Math.random() * 0.4,
            size: 2 + Math.random() * 2,
            color,
            shape: 'star',
            glow: true
        }));
    }
    
    // ===== Ball Trails =====
    
    updateBallTrail(ballId, x, y, color) {
        if (!this.trails.has(ballId)) {
            this.trails.set(ballId, new Trail(8));
        }
        this.trails.get(ballId).addPoint(x, y, color);
    }
    
    removeBallTrail(ballId) {
        this.trails.delete(ballId);
    }
    
    clearTrails() {
        this.trails.clear();
    }
    
    // ===== Screen Effects =====
    
    shake(intensity = 5) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }
    
    flash(color = '#ffffff', alpha = 0.3) {
        this.flashColor = color;
        this.flashAlpha = Math.max(this.flashAlpha, alpha);
    }
    
    pulse(scale = 1.02) {
        this.pulseScale = Math.max(this.pulseScale, scale);
    }
    
    // ===== Transitions =====
    
    fadeIn(duration = 0.5, callback) {
        this.pendingTransitions.push({
            type: 'fadeIn',
            duration,
            elapsed: 0,
            callback
        });
    }
    
    fadeOut(duration = 0.5, callback) {
        this.pendingTransitions.push({
            type: 'fadeOut',
            duration,
            elapsed: 0,
            callback
        });
    }
    
    // ===== Update & Render =====
    
    update(dt) {
        // Update particles
        this.particles = this.particles.filter(p => p.update(dt));
        
        // Update trails
        for (const trail of this.trails.values()) {
            trail.update();
        }
        
        // Decay screen effects
        this.shakeIntensity *= this.shakeDecay;
        if (this.shakeIntensity < 0.1) this.shakeIntensity = 0;
        
        this.flashAlpha *= 0.9;
        if (this.flashAlpha < 0.01) this.flashAlpha = 0;
        
        this.pulseScale = 1 + (this.pulseScale - 1) * this.pulseDecay;
        if (Math.abs(this.pulseScale - 1) < 0.001) this.pulseScale = 1;
        
        // Update transitions
        for (let i = this.pendingTransitions.length - 1; i >= 0; i--) {
            const t = this.pendingTransitions[i];
            t.elapsed += dt;
            if (t.elapsed >= t.duration) {
                if (t.callback) t.callback();
                this.pendingTransitions.splice(i, 1);
            }
        }
    }
    
    getShakeOffset() {
        if (this.shakeIntensity <= 0) return { x: 0, y: 0 };
        return {
            x: (Math.random() - 0.5) * this.shakeIntensity * 2,
            y: (Math.random() - 0.5) * this.shakeIntensity * 2
        };
    }
    
    renderTrails(ctx, balls) {
        for (const ball of balls) {
            const trail = this.trails.get(ball.id || 0);
            if (trail) {
                trail.render(ctx, ball.radius);
            }
        }
    }
    
    renderParticles(ctx) {
        for (const particle of this.particles) {
            particle.render(ctx);
        }
    }
    
    renderScreenEffects(ctx, width, height) {
        // Flash overlay
        if (this.flashAlpha > 0) {
            ctx.fillStyle = this.flashColor;
            ctx.globalAlpha = this.flashAlpha;
            ctx.fillRect(0, 0, width, height);
            ctx.globalAlpha = 1;
        }
        
        // Transition overlays
        for (const t of this.pendingTransitions) {
            const progress = t.elapsed / t.duration;
            let alpha = 0;
            
            if (t.type === 'fadeIn') {
                alpha = 1 - progress;
            } else if (t.type === 'fadeOut') {
                alpha = progress;
            }
            
            ctx.fillStyle = '#0d1117';
            ctx.globalAlpha = alpha;
            ctx.fillRect(0, 0, width, height);
            ctx.globalAlpha = 1;
        }
    }
    
    // Apply transform for pulse/shake
    applyTransform(ctx, canvasWidth, canvasHeight) {
        const shake = this.getShakeOffset();
        
        if (this.pulseScale !== 1 || shake.x !== 0 || shake.y !== 0) {
            ctx.translate(canvasWidth / 2 + shake.x, canvasHeight / 2 + shake.y);
            ctx.scale(this.pulseScale, this.pulseScale);
            ctx.translate(-canvasWidth / 2, -canvasHeight / 2);
            return true;
        }
        return false;
    }
    
    clear() {
        this.particles = [];
        this.trails.clear();
        this.screenEffects = [];
        this.pendingTransitions = [];
        this.flashAlpha = 0;
        this.shakeIntensity = 0;
        this.pulseScale = 1;
    }
}

/**
 * Tween utilities for smooth animations
 */
export const Easing = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeOutBack: t => 1 + (--t) * t * (2.70158 * t + 1.70158),
    easeOutElastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    easeOutBounce: t => {
        const n1 = 7.5625, d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        else return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
};

/**
 * Tween class for animating values
 */
export class Tween {
    constructor(from, to, duration, easing = Easing.easeOutQuad, onUpdate, onComplete) {
        this.from = from;
        this.to = to;
        this.duration = duration;
        this.easing = easing;
        this.onUpdate = onUpdate;
        this.onComplete = onComplete;
        this.elapsed = 0;
        this.active = true;
    }
    
    update(dt) {
        if (!this.active) return false;
        
        this.elapsed += dt;
        const progress = Math.min(this.elapsed / this.duration, 1);
        const easedProgress = this.easing(progress);
        
        const value = this.from + (this.to - this.from) * easedProgress;
        if (this.onUpdate) this.onUpdate(value);
        
        if (progress >= 1) {
            this.active = false;
            if (this.onComplete) this.onComplete();
        }
        
        return this.active;
    }
}

export default { AnimationSystem, Easing, Tween };
