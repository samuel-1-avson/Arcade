/**
 * Tetris Effects System
 * Provides visual effects: particles, screen shake, animations
 */

/**
 * Particle class for visual effects
 */
class Particle {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.vx = config.vx || (Math.random() - 0.5) * 200;
        this.vy = config.vy || (Math.random() - 0.5) * 200 - 100;
        this.color = config.color || '#ffffff';
        this.size = config.size || Math.random() * 4 + 2;
        this.life = config.life || 1;
        this.maxLife = this.life;
        this.gravity = config.gravity || 300;
        this.friction = config.friction || 0.98;
        this.shape = config.shape || 'square'; // 'square', 'circle', 'star'
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 10;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;
        this.vx *= this.friction;
        this.life -= dt;
        this.rotation += this.rotationSpeed * dt;
    }

    render(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        const scale = alpha;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;

        const size = this.size * scale;

        switch (this.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'star':
                this.drawStar(ctx, size);
                break;
            default:
                ctx.fillRect(-size / 2, -size / 2, size, size);
        }

        ctx.restore();
    }

    drawStar(ctx, size) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size / 2;

        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    isDead() {
        return this.life <= 0;
    }
}

/**
 * Floating Text for combo/score display
 */
class FloatingText {
    constructor(x, y, text, config = {}) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = config.color || '#ffffff';
        this.fontSize = config.fontSize || 24;
        this.life = config.life || 1.5;
        this.maxLife = this.life;
        this.vy = config.vy || -50;
        this.scale = 0;
        this.targetScale = 1;
    }

    update(dt) {
        this.y += this.vy * dt;
        this.life -= dt;
        
        // Pop-in animation
        const progress = 1 - (this.life / this.maxLife);
        if (progress < 0.1) {
            this.scale = progress / 0.1 * 1.2;
        } else if (progress < 0.2) {
            this.scale = 1.2 - (progress - 0.1) / 0.1 * 0.2;
        } else {
            this.scale = 1;
        }
    }

    render(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${this.fontSize}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, 0, 0);
        
        // Fill
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillText(this.text, 0, 0);
        
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

/**
 * Screen Shake Effect
 */
class ScreenShake {
    constructor(intensity, duration) {
        this.intensity = intensity;
        this.duration = duration;
        this.elapsed = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    update(dt) {
        this.elapsed += dt;
        
        if (this.isActive()) {
            const progress = this.elapsed / this.duration;
            const decayedIntensity = this.intensity * (1 - progress);
            this.offsetX = (Math.random() - 0.5) * 2 * decayedIntensity;
            this.offsetY = (Math.random() - 0.5) * 2 * decayedIntensity;
        } else {
            this.offsetX = 0;
            this.offsetY = 0;
        }
    }

    isActive() {
        return this.elapsed < this.duration;
    }
}

/**
 * Flash Effect for the canvas
 */
class FlashEffect {
    constructor(color, duration) {
        this.color = color;
        this.duration = duration;
        this.elapsed = 0;
    }

    update(dt) {
        this.elapsed += dt;
    }

    render(ctx, width, height) {
        if (!this.isActive()) return;
        
        const progress = this.elapsed / this.duration;
        const alpha = Math.max(0, 1 - progress);
        
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }

    isActive() {
        return this.elapsed < this.duration;
    }
}

/**
 * Line Clear Animation
 */
class LineClearAnimation {
    constructor(row, cellSize, cols, color) {
        this.row = row;
        this.cellSize = cellSize;
        this.cols = cols;
        this.color = color;
        this.duration = 0.3;
        this.elapsed = 0;
        this.particles = [];
    }

    update(dt) {
        this.elapsed += dt;
        
        // Update particles
        for (const particle of this.particles) {
            particle.update(dt);
        }
        this.particles = this.particles.filter(p => !p.isDead());
    }

    render(ctx) {
        const progress = Math.min(1, this.elapsed / this.duration);
        
        if (progress < 1) {
            // Shrinking line effect
            const y = this.row * this.cellSize;
            const width = this.cols * this.cellSize;
            const scale = 1 - progress;
            
            ctx.save();
            ctx.translate(width / 2, y + this.cellSize / 2);
            ctx.scale(scale, scale);
            
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 20;
            ctx.globalAlpha = 1 - progress;
            ctx.fillRect(-width / 2, -this.cellSize / 2, width, this.cellSize);
            
            ctx.restore();
        }
        
        // Render particles
        for (const particle of this.particles) {
            particle.render(ctx);
        }
    }

    isComplete() {
        return this.elapsed >= this.duration && this.particles.length === 0;
    }
}

/**
 * Effects System Manager
 */
export class EffectsSystem {
    constructor(game) {
        this.game = game;
        this.particles = [];
        this.floatingTexts = [];
        this.screenShake = null;
        this.flashEffects = [];
        this.lineClearAnimations = [];
        this.enabled = true;
    }

    reset() {
        this.particles = [];
        this.floatingTexts = [];
        this.screenShake = null;
        this.flashEffects = [];
        this.lineClearAnimations = [];
    }

    update(dt) {
        if (!this.enabled) return;

        // Update particles
        for (const particle of this.particles) {
            particle.update(dt);
        }
        this.particles = this.particles.filter(p => !p.isDead());

        // Update floating texts
        for (const text of this.floatingTexts) {
            text.update(dt);
        }
        this.floatingTexts = this.floatingTexts.filter(t => !t.isDead());

        // Update screen shake
        if (this.screenShake) {
            this.screenShake.update(dt);
            if (!this.screenShake.isActive()) {
                this.screenShake = null;
            }
        }

        // Update flash effects
        for (const flash of this.flashEffects) {
            flash.update(dt);
        }
        this.flashEffects = this.flashEffects.filter(f => f.isActive());

        // Update line clear animations
        for (const anim of this.lineClearAnimations) {
            anim.update(dt);
        }
        this.lineClearAnimations = this.lineClearAnimations.filter(a => !a.isComplete());
    }

    getShakeOffset() {
        if (this.screenShake) {
            return {
                x: this.screenShake.offsetX,
                y: this.screenShake.offsetY
            };
        }
        return { x: 0, y: 0 };
    }

    render(ctx, width, height) {
        if (!this.enabled) return;

        // Render line clear animations
        for (const anim of this.lineClearAnimations) {
            anim.render(ctx);
        }

        // Render particles
        for (const particle of this.particles) {
            particle.render(ctx);
        }

        // Render floating texts
        for (const text of this.floatingTexts) {
            text.render(ctx);
        }

        // Render flash effects
        for (const flash of this.flashEffects) {
            flash.render(ctx, width, height);
        }
    }

    /**
     * Create particles for line clear
     */
    onLineClear(rows, cellSize) {
        const COLS = 10;
        
        for (const row of rows) {
            // Create line clear animation
            const anim = new LineClearAnimation(row, cellSize, COLS, '#ffffff');
            this.lineClearAnimations.push(anim);
            
            // Create particles across the line
            for (let x = 0; x < COLS; x++) {
                const px = x * cellSize + cellSize / 2;
                const py = row * cellSize + cellSize / 2;
                
                // Create 3-5 particles per cell
                const count = 3 + Math.floor(Math.random() * 3);
                for (let i = 0; i < count; i++) {
                    const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff8800'];
                    const particle = new Particle(px, py, {
                        color: colors[Math.floor(Math.random() * colors.length)],
                        vx: (Math.random() - 0.5) * 300,
                        vy: -Math.random() * 200 - 50,
                        size: Math.random() * 4 + 2,
                        life: 0.5 + Math.random() * 0.5,
                        shape: Math.random() > 0.5 ? 'square' : 'circle'
                    });
                    this.particles.push(particle);
                }
            }
        }

        // Screen shake based on lines cleared
        const intensity = rows.length === 4 ? 10 : rows.length * 2;
        this.addScreenShake(intensity, 0.2);

        // Flash effect for Tetris
        if (rows.length === 4) {
            this.addFlash('#ffffff', 0.15);
        }
    }

    /**
     * Show combo text
     */
    showCombo(combo, x, y) {
        if (combo < 2) return;

        const colors = {
            2: '#ffff00',
            3: '#ff8800',
            4: '#ff00ff',
            5: '#00ffff'
        };
        const color = colors[Math.min(combo, 5)] || '#ff0000';

        const text = new FloatingText(x, y, `${combo}x COMBO!`, {
            color,
            fontSize: 16 + Math.min(combo, 10) * 2,
            life: 1 + combo * 0.1
        });
        this.floatingTexts.push(text);
    }

    /**
     * Show score popup
     */
    showScore(score, x, y) {
        const text = new FloatingText(x, y, `+${score}`, {
            color: '#ffff00',
            fontSize: 18,
            life: 1
        });
        this.floatingTexts.push(text);
    }

    /**
     * Show level up effect
     */
    showLevelUp(level, x, y) {
        // Create burst of particles
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            const particle = new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: `hsl(${(level * 30) % 360}, 100%, 50%)`,
                size: 3 + Math.random() * 3,
                life: 0.8,
                gravity: 0,
                shape: 'star'
            });
            this.particles.push(particle);
        }

        const text = new FloatingText(x, y, `LEVEL ${level}`, {
            color: '#ffffff',
            fontSize: 28,
            life: 2
        });
        this.floatingTexts.push(text);

        this.addScreenShake(5, 0.3);
        this.addFlash('#ffffff', 0.1);
    }

    /**
     * Show perfect clear effect
     */
    showPerfectClear(width, height) {
        const centerX = width / 2;
        const centerY = height / 2;

        // Create massive particle explosion
        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 200 + Math.random() * 300;
            const particle = new Particle(centerX, centerY, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                size: 4 + Math.random() * 4,
                life: 1.5,
                gravity: 100,
                shape: 'star'
            });
            this.particles.push(particle);
        }

        const text = new FloatingText(centerX, centerY, '✨ PERFECT CLEAR ✨', {
            color: '#ffff00',
            fontSize: 32,
            life: 3
        });
        this.floatingTexts.push(text);

        this.addScreenShake(15, 0.5);
        this.addFlash('#ffff00', 0.2);
    }

    /**
     * Show power-up activation effect
     */
    showPowerUpActivation(type, x, y, color) {
        // Ring of particles
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const speed = 80;
            const particle = new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 4,
                life: 0.6,
                gravity: 0,
                shape: 'circle'
            });
            this.particles.push(particle);
        }

        this.addFlash(color, 0.1);
    }

    /**
     * Show bomb explosion effect
     */
    showBombExplosion(x, y, cellSize) {
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;

        // Explosion particles
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 150 + Math.random() * 200;
            const particle = new Particle(centerX, centerY, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: Math.random() > 0.5 ? '#ff4444' : '#ffaa00',
                size: 4 + Math.random() * 4,
                life: 0.8,
                gravity: 200,
                shape: 'circle'
            });
            this.particles.push(particle);
        }

        this.addScreenShake(12, 0.3);
        this.addFlash('#ff4444', 0.15);
    }

    /**
     * Show lightning effect
     */
    showLightning(width, height, cellSize) {
        const bottomY = height - cellSize / 2;

        // Lightning particles across bottom
        for (let x = 0; x < width; x += 20) {
            for (let i = 0; i < 3; i++) {
                const particle = new Particle(x, bottomY, {
                    vx: (Math.random() - 0.5) * 100,
                    vy: -Math.random() * 200 - 100,
                    color: '#ffff00',
                    size: 3 + Math.random() * 3,
                    life: 0.5,
                    gravity: 0,
                    shape: 'circle'
                });
                this.particles.push(particle);
            }
        }

        this.addFlash('#ffff00', 0.1);
        this.addScreenShake(8, 0.2);
    }

    /**
     * Add screen shake effect
     */
    addScreenShake(intensity, duration) {
        // Override if new shake is stronger
        if (this.screenShake && this.screenShake.intensity >= intensity) {
            return;
        }
        this.screenShake = new ScreenShake(intensity, duration);
    }

    /**
     * Add flash effect
     */
    addFlash(color, duration) {
        this.flashEffects.push(new FlashEffect(color, duration));
    }

    /**
     * Create T-spin effect
     */
    showTSpin(x, y, cellSize) {
        const centerX = x * cellSize + cellSize * 1.5;
        const centerY = y * cellSize + cellSize * 1.5;

        // Spinning particles
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const particle = new Particle(centerX, centerY, {
                vx: Math.cos(angle) * 100,
                vy: Math.sin(angle) * 100,
                color: '#ff00ff',
                size: 5,
                life: 0.7,
                gravity: 0,
                shape: 'square'
            });
            this.particles.push(particle);
        }

        const text = new FloatingText(centerX, centerY, 'T-SPIN!', {
            color: '#ff00ff',
            fontSize: 20,
            life: 1.5
        });
        this.floatingTexts.push(text);
    }

    /**
     * Custom message display
     */
    showMessage(text, x, y, config = {}) {
        const floatingText = new FloatingText(x, y, text, {
            color: config.color || '#ffffff',
            fontSize: config.fontSize || 20,
            life: config.life || 2
        });
        this.floatingTexts.push(floatingText);
    }
}
