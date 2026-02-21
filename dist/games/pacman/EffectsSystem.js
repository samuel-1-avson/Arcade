/**
 * Pac-Man Effects System
 * Visual effects including particles, screen shake, glow effects, and animations
 */

/**
 * Particle class for individual particles
 */
class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 4;
        this.vy = options.vy || (Math.random() - 0.5) * 4;
        this.life = options.life || 1;
        this.maxLife = this.life;
        this.size = options.size || 3;
        this.color = options.color || '#ffff00';
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 0.98;
        this.shrink = options.shrink !== false;
        this.glow = options.glow || false;
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life -= dt;

        if (this.shrink) {
            this.size *= 0.98;
        }

        return this.life > 0 && this.size > 0.1;
    }

    render(ctx) {
        const alpha = Math.min(1, this.life / this.maxLife);
        
        if (this.glow) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

/**
 * Effects System Manager
 */
export class EffectsSystem {
    constructor(game) {
        this.game = game;
        this.particles = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        this.flashEffect = { alpha: 0, color: '#ffffff', duration: 0 };
        this.trailPoints = [];
        this.glowEffects = [];
        this.textPopups = [];
        this.time = 0;
    }

    update(dt) {
        this.time += dt;

        // Update particles
        this.particles = this.particles.filter(p => p.update(dt));

        // Update screen shake
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= dt;
            const t = this.screenShake.duration;
            this.screenShake.x = (Math.random() - 0.5) * 2 * this.screenShake.intensity * t;
            this.screenShake.y = (Math.random() - 0.5) * 2 * this.screenShake.intensity * t;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
        }

        // Update flash
        if (this.flashEffect.duration > 0) {
            this.flashEffect.duration -= dt;
            this.flashEffect.alpha = this.flashEffect.duration * 0.5;
        }

        // Update trail
        if (this.game.powerMode && this.game.pacman) {
            const cellSize = this.game.cellSize || 30;
            this.trailPoints.push({
                x: this.game.pacman.x * cellSize + cellSize / 2,
                y: this.game.pacman.y * cellSize + cellSize / 2,
                life: 0.5
            });
        }
        this.trailPoints = this.trailPoints.filter(p => {
            p.life -= dt;
            return p.life > 0;
        });

        // Update glow effects
        this.glowEffects = this.glowEffects.filter(g => {
            g.life -= dt;
            return g.life > 0;
        });

        // Update text popups
        this.textPopups = this.textPopups.filter(t => {
            t.life -= dt;
            t.y -= 30 * dt;
            return t.life > 0;
        });
    }

    render(ctx) {
        const shakeX = this.screenShake.x;
        const shakeY = this.screenShake.y;

        ctx.save();
        ctx.translate(shakeX, shakeY);

        // Render trail
        this.renderTrail(ctx);

        // Render glow effects
        this.renderGlowEffects(ctx);

        // Render particles
        this.particles.forEach(p => p.render(ctx));

        // Render text popups
        this.renderTextPopups(ctx);

        ctx.restore();

        // Render flash overlay
        if (this.flashEffect.alpha > 0) {
            ctx.fillStyle = this.flashEffect.color;
            ctx.globalAlpha = this.flashEffect.alpha;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.globalAlpha = 1;
        }
    }

    renderTrail(ctx) {
        if (this.trailPoints.length < 2) return;

        ctx.save();
        for (let i = 0; i < this.trailPoints.length; i++) {
            const point = this.trailPoints[i];
            const alpha = point.life * 2;
            const size = 6 * point.life;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffff00';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffff00';
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    renderGlowEffects(ctx) {
        this.glowEffects.forEach(glow => {
            const alpha = glow.life / glow.maxLife;
            const size = glow.size * (1 + (1 - alpha) * 0.5);

            ctx.save();
            ctx.globalAlpha = alpha * 0.5;
            ctx.shadowBlur = 20;
            ctx.shadowColor = glow.color;
            ctx.fillStyle = glow.color;
            ctx.beginPath();
            ctx.arc(glow.x, glow.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    renderTextPopups(ctx) {
        this.textPopups.forEach(popup => {
            const alpha = Math.min(1, popup.life * 2);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${popup.size}px 'Orbitron', sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = popup.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = popup.color;
            ctx.fillText(popup.text, popup.x, popup.y);
            ctx.restore();
        });
    }

    // Effect creation methods
    createDotCollect(x, y, cellSize) {
        const px = x * cellSize + cellSize / 2;
        const py = y * cellSize + cellSize / 2;

        for (let i = 0; i < 4; i++) {
            this.particles.push(new Particle(px, py, {
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                size: 2,
                life: 0.3,
                color: '#ffff00',
                glow: true
            }));
        }
    }

    createPowerPelletCollect(x, y, cellSize) {
        const px = x * cellSize + cellSize / 2;
        const py = y * cellSize + cellSize / 2;

        // Burst of particles
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            const speed = 3 + Math.random() * 2;
            this.particles.push(new Particle(px, py, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4,
                life: 0.5,
                color: '#ffff00',
                glow: true
            }));
        }

        // Screen shake
        this.addScreenShake(8, 0.3);

        // Flash
        this.addFlash('#ffff00', 0.2);

        // Glow effect
        this.glowEffects.push({
            x: px,
            y: py,
            size: 30,
            color: '#ffff00',
            life: 0.5,
            maxLife: 0.5
        });
    }

    createGhostEaten(x, y, cellSize, points) {
        const px = x * cellSize + cellSize / 2;
        const py = y * cellSize + cellSize / 2;

        // Ghost dissolution particles
        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(px, py, {
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5 - 2,
                size: 4 + Math.random() * 3,
                life: 0.6,
                color: '#0088ff',
                glow: true,
                gravity: -0.1
            }));
        }

        // Points popup
        this.textPopups.push({
            x: px,
            y: py,
            text: `+${points}`,
            size: 14,
            color: '#00ffff',
            life: 1
        });

        // Screen shake
        this.addScreenShake(5, 0.15);
    }

    createPacmanDeath(x, y, cellSize) {
        const px = x * cellSize + cellSize / 2;
        const py = y * cellSize + cellSize / 2;

        // Death particles
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 / 30) * i;
            const speed = 2 + Math.random() * 3;
            this.particles.push(new Particle(px, py, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4,
                life: 1,
                color: '#ffff00',
                glow: true,
                gravity: 0.1
            }));
        }

        // Big screen shake
        this.addScreenShake(12, 0.5);

        // Red flash
        this.addFlash('#ff0000', 0.3);
    }

    createLevelComplete() {
        const width = this.game.canvas.width;
        const height = this.game.canvas.height;

        // Celebration particles
        for (let i = 0; i < 100; i++) {
            const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
            this.particles.push(new Particle(
                Math.random() * width,
                height + 20,
                {
                    vx: (Math.random() - 0.5) * 4,
                    vy: -5 - Math.random() * 5,
                    size: 4 + Math.random() * 4,
                    life: 2,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    glow: true,
                    gravity: 0.05
                }
            ));
        }

        // Flash
        this.addFlash('#ffffff', 0.5);
    }

    createFruitCollect(x, y, cellSize, points) {
        const px = x * cellSize + cellSize / 2;
        const py = y * cellSize + cellSize / 2;

        // Sparkle particles
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const speed = 2 + Math.random();
            this.particles.push(new Particle(px, py, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3,
                life: 0.5,
                color: '#ff6600',
                glow: true
            }));
        }

        // Points popup
        this.textPopups.push({
            x: px,
            y: py,
            text: `+${points}`,
            size: 16,
            color: '#ff6600',
            life: 1.2
        });
    }

    createPowerUpCollect(powerUp) {
        const cellSize = this.game.cellSize || 30;
        const px = this.game.pacman.x * cellSize + cellSize / 2;
        const py = this.game.pacman.y * cellSize + cellSize / 2;

        // Ring effect
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 / 16) * i;
            const speed = 3;
            this.particles.push(new Particle(px, py, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 5,
                life: 0.6,
                color: powerUp.color,
                glow: true
            }));
        }

        // Glow
        this.glowEffects.push({
            x: px,
            y: py,
            size: 40,
            color: powerUp.color,
            life: 0.6,
            maxLife: 0.6
        });

        // Text
        this.textPopups.push({
            x: px,
            y: py - 20,
            text: powerUp.icon + ' ' + powerUp.name,
            size: 12,
            color: powerUp.color,
            life: 1.5
        });
    }

    createExplosion(x, y) {
        const cellSize = this.game.cellSize || 30;
        const px = x * cellSize + cellSize / 2;
        const py = y * cellSize + cellSize / 2;

        // Big explosion
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            this.particles.push(new Particle(px, py, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                life: 0.8,
                color: Math.random() > 0.5 ? '#ff6600' : '#ffcc00',
                glow: true,
                gravity: 0.05
            }));
        }

        this.addScreenShake(15, 0.4);
        this.addFlash('#ff6600', 0.2);
    }

    createTeleportEffect(x, y) {
        const cellSize = this.game.cellSize || 30;
        const px = x * cellSize + cellSize / 2;
        const py = y * cellSize + cellSize / 2;

        // Spiral particles
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i + this.time * 5;
            const radius = 20;
            this.particles.push(new Particle(
                px + Math.cos(angle) * radius,
                py + Math.sin(angle) * radius,
                {
                    vx: -Math.cos(angle) * 2,
                    vy: -Math.sin(angle) * 2,
                    size: 4,
                    life: 0.5,
                    color: '#cc00ff',
                    glow: true
                }
            ));
        }

        this.addFlash('#cc00ff', 0.15);
    }

    createAchievementUnlock() {
        const width = this.game.canvas.width;
        const height = this.game.canvas.height;

        // Golden sparkles
        for (let i = 0; i < 50; i++) {
            this.particles.push(new Particle(
                Math.random() * width,
                Math.random() * height,
                {
                    vx: (Math.random() - 0.5) * 2,
                    vy: -1 - Math.random() * 2,
                    size: 3 + Math.random() * 3,
                    life: 1.5,
                    color: '#ffcc00',
                    glow: true
                }
            ));
        }

        this.addFlash('#ffcc00', 0.3);
    }

    addScreenShake(intensity, duration) {
        this.screenShake.intensity = intensity;
        this.screenShake.duration = duration;
    }

    addFlash(color, duration) {
        this.flashEffect.color = color;
        this.flashEffect.duration = duration;
        this.flashEffect.alpha = duration;
    }

    addTextPopup(x, y, text, color = '#ffffff', size = 14) {
        const cellSize = this.game.cellSize || 30;
        this.textPopups.push({
            x: x * cellSize + cellSize / 2,
            y: y * cellSize + cellSize / 2,
            text,
            color,
            size,
            life: 1
        });
    }

    clear() {
        this.particles = [];
        this.trailPoints = [];
        this.glowEffects = [];
        this.textPopups = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        this.flashEffect = { alpha: 0, color: '#ffffff', duration: 0 };
    }
}
