/**
 * Snake Game - Enhanced Particle System
 * GPU-accelerated particles with physics
 */

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 1000;
        this.pool = [];
        
        // Pre-allocate particle pool
        for (let i = 0; i < this.maxParticles; i++) {
            this.pool.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: 0, y: 0,
            vx: 0, vy: 0,
            ax: 0, ay: 0,
            life: 0, maxLife: 1,
            size: 4,
            startSize: 4, endSize: 0,
            color: [1, 1, 1],
            startColor: [1, 1, 1],
            endColor: [1, 1, 1],
            alpha: 1,
            rotation: 0,
            rotationSpeed: 0,
            type: 'circle',
            active: false
        };
    }

    getParticle() {
        for (const p of this.pool) {
            if (!p.active) {
                p.active = true;
                return p;
            }
        }
        // Pool exhausted, create new
        const p = this.createParticle();
        this.pool.push(p);
        return p;
    }

    // Emit particles with configuration
    emit(config) {
        const count = config.count || 1;
        
        for (let i = 0; i < count; i++) {
            const p = this.getParticle();
            
            // Position
            p.x = config.x + (Math.random() - 0.5) * (config.spread || 0);
            p.y = config.y + (Math.random() - 0.5) * (config.spread || 0);
            
            // Velocity
            if (config.direction !== undefined) {
                const angle = config.direction + (Math.random() - 0.5) * (config.angleSpread || 0);
                const speed = (config.speed || 100) * (0.8 + Math.random() * 0.4);
                p.vx = Math.cos(angle) * speed;
                p.vy = Math.sin(angle) * speed;
            } else if (config.radial) {
                const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
                const speed = (config.speed || 100) * (0.8 + Math.random() * 0.4);
                p.vx = Math.cos(angle) * speed;
                p.vy = Math.sin(angle) * speed;
            } else {
                p.vx = (config.vx || 0) + (Math.random() - 0.5) * (config.velocitySpread || 0);
                p.vy = (config.vy || 0) + (Math.random() - 0.5) * (config.velocitySpread || 0);
            }
            
            // Acceleration (gravity, etc.)
            p.ax = config.ax || 0;
            p.ay = config.ay || 0;
            
            // Life
            p.life = config.life || 1;
            p.maxLife = p.life;
            
            // Size
            p.startSize = config.size || 4;
            p.endSize = config.endSize !== undefined ? config.endSize : 0;
            p.size = p.startSize;
            
            // Color
            p.startColor = config.color ? [...config.color] : [1, 1, 1];
            p.endColor = config.endColor ? [...config.endColor] : p.startColor;
            p.color = [...p.startColor];
            
            // Alpha
            p.alpha = 1;
            
            // Rotation
            p.rotation = config.rotation || 0;
            p.rotationSpeed = config.rotationSpeed || 0;
            
            // Type
            p.type = config.type || 'circle';
            
            // Drag
            p.drag = config.drag !== undefined ? config.drag : 0.98;
            
            this.particles.push(p);
        }
    }

    // Preset emitters
    emitExplosion(x, y, color, count = 15) {
        this.emit({
            x, y,
            count,
            radial: true,
            speed: 150,
            life: 0.6,
            size: 6,
            endSize: 0,
            color,
            drag: 0.95
        });
    }

    emitSparkle(x, y, color, count = 8) {
        this.emit({
            x, y,
            count,
            radial: true,
            speed: 80,
            life: 0.4,
            size: 3,
            endSize: 0,
            color,
            drag: 0.9
        });
    }

    emitTrail(x, y, color) {
        this.emit({
            x, y,
            count: 1,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            life: 0.3,
            size: 4,
            endSize: 0,
            color,
            drag: 0.95
        });
    }

    emitFirework(x, y) {
        const colors = [
            [1, 0.3, 0.3],
            [0.3, 1, 0.3],
            [0.3, 0.3, 1],
            [1, 1, 0.3],
            [1, 0.3, 1]
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        this.emit({
            x, y,
            count: 30,
            radial: true,
            speed: 200,
            life: 0.8,
            size: 4,
            endSize: 1,
            color,
            endColor: [color[0] * 0.5, color[1] * 0.5, color[2] * 0.5],
            drag: 0.96,
            ay: 100 // Gravity
        });
    }

    emitShockwave(x, y, color) {
        this.emit({
            x, y,
            count: 20,
            radial: true,
            speed: 300,
            life: 0.3,
            size: 2,
            color,
            drag: 0.9
        });
    }

    emitFire(x, y) {
        this.emit({
            x, y,
            count: 3,
            spread: 10,
            direction: -Math.PI / 2,
            angleSpread: 0.5,
            speed: 50,
            life: 0.5,
            size: 8,
            endSize: 2,
            color: [1, 0.6, 0.1],
            endColor: [0.5, 0.1, 0.1],
            drag: 0.98,
            ay: -50
        });
    }

    emitSnow(canvasWidth, canvasHeight) {
        this.emit({
            x: Math.random() * canvasWidth,
            y: -10,
            count: 1,
            vx: Math.random() * 20 - 10,
            vy: 50 + Math.random() * 30,
            life: 5,
            size: 3,
            color: [1, 1, 1],
            drag: 0.999
        });
    }

    emitRain(canvasWidth) {
        this.emit({
            x: Math.random() * canvasWidth,
            y: -10,
            count: 1,
            vx: -20,
            vy: 400,
            life: 2,
            size: 2,
            color: [0.5, 0.7, 1],
            type: 'line',
            drag: 1
        });
    }
    
    // ENHANCED: Lightning bolt effect
    emitLightning(x1, y1, x2, y2) {
        const segments = 8;
        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const px = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 20;
            const py = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 20;
            
            this.emit({
                x: px, y: py,
                count: 3,
                radial: true,
                speed: 100,
                life: 0.15,
                size: 4,
                color: [0.6, 0.8, 1],
                drag: 0.8
            });
        }
    }
    
    // ENHANCED: Electric arc effect
    emitElectricity(x, y) {
        for (let i = 0; i < 5; i++) {
            this.emit({
                x, y,
                count: 1,
                direction: Math.random() * Math.PI * 2,
                speed: 200 + Math.random() * 100,
                life: 0.1,
                size: 2,
                color: [0.5, 0.8, 1],
                drag: 0.7
            });
        }
    }
    
    // ENHANCED: Confetti celebration
    emitConfetti(x, y, count = 50) {
        const colors = [
            [1, 0.3, 0.3],
            [0.3, 1, 0.3],
            [0.3, 0.3, 1],
            [1, 1, 0.3],
            [1, 0.3, 1],
            [0.3, 1, 1]
        ];
        
        for (let i = 0; i < count; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.emit({
                x, y,
                count: 1,
                direction: -Math.PI / 2,
                angleSpread: 1.5,
                speed: 300 + Math.random() * 200,
                life: 2 + Math.random(),
                size: 4 + Math.random() * 4,
                color,
                drag: 0.99,
                ay: 200,
                rotationSpeed: (Math.random() - 0.5) * 10,
                type: Math.random() > 0.5 ? 'square' : 'circle'
            });
        }
    }
    
    // ENHANCED: Heart particles
    emitHearts(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            this.emit({
                x: x + (Math.random() - 0.5) * 30,
                y,
                count: 1,
                vx: (Math.random() - 0.5) * 30,
                vy: -50 - Math.random() * 50,
                life: 1.5,
                size: 8,
                color: [1, 0.3, 0.5],
                drag: 0.98,
                ay: -30,
                type: 'heart'
            });
        }
    }
    
    // ENHANCED: Magic trail effect
    emitMagicTrail(x, y, color = [0.5, 0, 1]) {
        this.emit({
            x, y,
            count: 3,
            spread: 5,
            vx: (Math.random() - 0.5) * 10,
            vy: -20 - Math.random() * 20,
            life: 0.8,
            size: 5,
            endSize: 0,
            color,
            endColor: [color[0] * 0.5, color[1] * 0.5, color[2] * 0.5],
            drag: 0.95,
            type: 'star'
        });
    }
    
    // ENHANCED: Boss death explosion
    emitBossDeath(x, y) {
        // Multiple waves
        for (let wave = 0; wave < 5; wave++) {
            this.emit({
                x, y,
                count: 30,
                radial: true,
                speed: 200 + wave * 50,
                life: 1.5,
                size: 8,
                endSize: 0,
                color: [1, 0.5, 0],
                endColor: [1, 0, 0],
                drag: 0.95,
                ay: 50
            });
        }
        
        // Core explosion
        this.emit({
            x, y,
            count: 50,
            radial: true,
            speed: 400,
            life: 1,
            size: 12,
            endSize: 2,
            color: [1, 1, 1],
            endColor: [1, 0.5, 0],
            drag: 0.9
        });
    }
    
    // ENHANCED: Warp/teleport effect
    emitWarp(x, y, color = [0.5, 0, 1]) {
        // Imploding particles
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            const dist = 50;
            
            const p = this.getParticle();
            p.x = x + Math.cos(angle) * dist;
            p.y = y + Math.sin(angle) * dist;
            p.vx = -Math.cos(angle) * 100;
            p.vy = -Math.sin(angle) * 100;
            p.life = 0.5;
            p.maxLife = 0.5;
            p.size = 6;
            p.startSize = 6;
            p.endSize = 0;
            p.startColor = [...color];
            p.endColor = [1, 1, 1];
            p.color = [...p.startColor];
            p.drag = 0.95;
            p.active = true;
            this.particles.push(p);
        }
    }
    
    // ENHANCED: Fire trail
    emitFireTrail(x, y) {
        this.emit({
            x, y,
            count: 2,
            spread: 3,
            vx: (Math.random() - 0.5) * 10,
            vy: -30 - Math.random() * 30,
            life: 0.5,
            size: 10,
            endSize: 0,
            color: [1, 0.6, 0.1],
            endColor: [1, 0, 0],
            drag: 0.97,
            ay: -100
        });
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Update life
            p.life -= dt;
            if (p.life <= 0) {
                p.active = false;
                this.particles.splice(i, 1);
                continue;
            }
            
            const t = 1 - (p.life / p.maxLife);
            
            // Update physics
            p.vx += p.ax * dt;
            p.vy += p.ay * dt;
            p.vx *= p.drag;
            p.vy *= p.drag;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            
            // Update rotation
            p.rotation += p.rotationSpeed * dt;
            
            // Interpolate size
            p.size = p.startSize + (p.endSize - p.startSize) * t;
            
            // Interpolate color
            for (let c = 0; c < 3; c++) {
                p.color[c] = p.startColor[c] + (p.endColor[c] - p.startColor[c]) * t;
            }
            
            // Alpha fadeout
            p.alpha = p.life / p.maxLife;
        }
    }

    render(ctx) {
        ctx.save();
        
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = `rgb(${Math.floor(p.color[0] * 255)}, ${Math.floor(p.color[1] * 255)}, ${Math.floor(p.color[2] * 255)})`;
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            
            if (p.type === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'square') {
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            } else if (p.type === 'line') {
                ctx.strokeStyle = ctx.fillStyle;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, -p.size);
                ctx.lineTo(0, p.size);
                ctx.stroke();
            } else if (p.type === 'star') {
                this.drawStar(ctx, 0, 0, 5, p.size, p.size / 2);
            } else if (p.type === 'heart') {
                this.drawHeart(ctx, 0, 0, p.size);
            } else if (p.type === 'diamond') {
                ctx.beginPath();
                ctx.moveTo(0, -p.size);
                ctx.lineTo(p.size * 0.6, 0);
                ctx.lineTo(0, p.size);
                ctx.lineTo(-p.size * 0.6, 0);
                ctx.closePath();
                ctx.fill();
            } else if (p.type === 'triangle') {
                ctx.beginPath();
                ctx.moveTo(0, -p.size);
                ctx.lineTo(p.size * 0.866, p.size * 0.5);
                ctx.lineTo(-p.size * 0.866, p.size * 0.5);
                ctx.closePath();
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    drawHeart(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y + size * 0.3);
        ctx.bezierCurveTo(x, y - size * 0.3, x - size, y - size * 0.3, x - size, y + size * 0.3);
        ctx.bezierCurveTo(x - size, y + size * 0.6, x, y + size, x, y + size);
        ctx.bezierCurveTo(x, y + size, x + size, y + size * 0.6, x + size, y + size * 0.3);
        ctx.bezierCurveTo(x + size, y - size * 0.3, x, y - size * 0.3, x, y + size * 0.3);
        ctx.fill();
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;
        
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

    clear() {
        for (const p of this.particles) {
            p.active = false;
        }
        this.particles = [];
    }

    get count() {
        return this.particles.length;
    }
}

// Weather system using particles
export class WeatherSystem {
    constructor(particleSystem, canvasWidth, canvasHeight) {
        this.particles = particleSystem;
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.type = 'none';
        this.intensity = 1;
        this.timer = 0;
    }

    setWeather(type, intensity = 1) {
        this.type = type;
        this.intensity = intensity;
    }

    update(dt) {
        this.timer += dt;
        
        const spawnRate = 0.02 / this.intensity;
        
        switch (this.type) {
            case 'rain':
                if (this.timer > spawnRate) {
                    this.timer = 0;
                    for (let i = 0; i < 3 * this.intensity; i++) {
                        this.particles.emitRain(this.width);
                    }
                }
                break;
                
            case 'snow':
                if (this.timer > spawnRate * 2) {
                    this.timer = 0;
                    for (let i = 0; i < 2 * this.intensity; i++) {
                        this.particles.emitSnow(this.width, this.height);
                    }
                }
                break;
                
            case 'fire':
                if (this.timer > 0.05) {
                    this.timer = 0;
                    const x = Math.random() * this.width;
                    this.particles.emitFire(x, this.height + 10);
                }
                break;
        }
    }
}

export default ParticleSystem;
