/**
 * ZenModeService - Interactive Background Zen Experience
 * Provides 5 calming, interactive full-screen animations
 */

class ZenModeService {
    constructor() {
        this.isActive = false;
        this.currentAnimation = null;
        this.animationId = null;
        this.canvas = null;
        this.ctx = null;
        this.container = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.animations = {};
        
        // Theme colors from app
        this.colors = {
            primary: '#f36',
            accent: '#00ff88',
            cyan: '#00ffff',
            purple: '#a855f7',
            dark: '#0a0a0f',
            darker: '#050508'
        };
    }

    init() {
        this.createContainer();
        this.initAnimations();
        console.log('[ZenMode] Service initialized');
    }

    createContainer() {
        // Create fullscreen overlay
        this.container = document.createElement('div');
        this.container.id = 'zen-mode-container';
        this.container.className = 'zen-mode-container';
        this.container.innerHTML = `
            <canvas id="zen-canvas"></canvas>
            <div class="zen-controls">
                <div class="zen-selector">
                    <button class="zen-anim-btn active" data-animation="aurora" title="Aurora Flow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/>
                            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10"/>
                        </svg>
                        <span>Aurora</span>
                    </button>
                    <button class="zen-anim-btn" data-animation="nebula" title="Particle Nebula">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"/>
                            <circle cx="12" cy="12" r="8" stroke-dasharray="2 4"/>
                        </svg>
                        <span>Nebula</span>
                    </button>
                    <button class="zen-anim-btn" data-animation="geometric" title="Geometric Drift">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12,2 22,20 2,20"/>
                        </svg>
                        <span>Geometric</span>
                    </button>
                    <button class="zen-anim-btn" data-animation="liquid" title="Liquid Gradient">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                        </svg>
                        <span>Liquid</span>
                    </button>
                    <button class="zen-anim-btn" data-animation="starfield" title="Starfield Journey">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12,2 15,8.5 22,9.3 17,14 18,21 12,17.8 6,21 7,14 2,9.3 9,8.5"/>
                        </svg>
                        <span>Starfield</span>
                    </button>
                </div>
                <button class="zen-exit-btn" id="zen-exit-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    <span>Exit Zen Mode</span>
                </button>
            </div>
            <div class="zen-hint">Move your mouse to interact</div>
        `;
        document.body.appendChild(this.container);

        // Setup canvas
        this.canvas = document.getElementById('zen-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // Event listeners
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        this.canvas.addEventListener('touchmove', (e) => {
            this.mouseX = e.touches[0].clientX;
            this.mouseY = e.touches[0].clientY;
        });
        this.canvas.addEventListener('click', (e) => {
            if (this.currentAnimation?.onClick) {
                this.currentAnimation.onClick(e.clientX, e.clientY);
            }
        });

        // Animation selector buttons
        this.container.querySelectorAll('.zen-anim-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.container.querySelectorAll('.zen-anim-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.switchAnimation(btn.dataset.animation);
            });
        });

        // Exit button
        document.getElementById('zen-exit-btn').addEventListener('click', () => this.exit());
    }

    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initAnimations() {
        // ===== 1. AURORA FLOW =====
        this.animations.aurora = {
            name: 'Aurora Flow',
            particles: [],
            time: 0,
            init: () => {
                this.animations.aurora.particles = [];
                for (let i = 0; i < 5; i++) {
                    this.animations.aurora.particles.push({
                        x: Math.random() * this.canvas.width,
                        y: this.canvas.height * 0.4 + Math.random() * this.canvas.height * 0.3,
                        width: 200 + Math.random() * 300,
                        speed: 0.5 + Math.random() * 0.5,
                        hue: 160 + Math.random() * 60,
                        offset: Math.random() * Math.PI * 2
                    });
                }
            },
            render: (ctx, w, h, mx, my) => {
                const a = this.animations.aurora;
                a.time += 0.01;
                
                // Dark gradient background
                const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
                bgGrad.addColorStop(0, '#0a0a1a');
                bgGrad.addColorStop(1, '#050510');
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, w, h);

                // Aurora waves
                a.particles.forEach((p, i) => {
                    const mouseInfluence = (mx / w - 0.5) * 100;
                    const yWave = Math.sin(a.time * p.speed + p.offset) * 50;
                    
                    const grad = ctx.createLinearGradient(p.x - p.width/2, 0, p.x + p.width/2, 0);
                    grad.addColorStop(0, 'transparent');
                    grad.addColorStop(0.3, `hsla(${p.hue + Math.sin(a.time) * 20}, 80%, 50%, 0.3)`);
                    grad.addColorStop(0.5, `hsla(${p.hue}, 90%, 60%, 0.5)`);
                    grad.addColorStop(0.7, `hsla(${p.hue + 40}, 80%, 50%, 0.3)`);
                    grad.addColorStop(1, 'transparent');

                    ctx.beginPath();
                    ctx.moveTo(0, p.y + yWave);
                    
                    for (let x = 0; x <= w; x += 20) {
                        const wave = Math.sin(x * 0.01 + a.time + p.offset) * 30 +
                                    Math.sin(x * 0.02 + a.time * 0.5) * 20;
                        ctx.lineTo(x, p.y + wave + yWave + mouseInfluence * 0.1);
                    }
                    
                    ctx.lineTo(w, h);
                    ctx.lineTo(0, h);
                    ctx.closePath();
                    ctx.fillStyle = grad;
                    ctx.fill();
                });

                // Stars
                for (let i = 0; i < 100; i++) {
                    const sx = (i * 137.5) % w;
                    const sy = (i * 73.7) % (h * 0.5);
                    const twinkle = Math.sin(a.time * 2 + i) * 0.5 + 0.5;
                    ctx.beginPath();
                    ctx.arc(sx, sy, twinkle * 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`;
                    ctx.fill();
                }
            }
        };

        // ===== 2. PARTICLE NEBULA =====
        this.animations.nebula = {
            name: 'Particle Nebula',
            particles: [],
            init: () => {
                this.animations.nebula.particles = [];
                for (let i = 0; i < 200; i++) {
                    this.animations.nebula.particles.push({
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height,
                        vx: 0,
                        vy: 0,
                        size: 1 + Math.random() * 3,
                        hue: 280 + Math.random() * 80,
                        alpha: 0.3 + Math.random() * 0.7
                    });
                }
            },
            render: (ctx, w, h, mx, my) => {
                // Fade trail
                ctx.fillStyle = 'rgba(5, 5, 16, 0.1)';
                ctx.fillRect(0, 0, w, h);

                const n = this.animations.nebula;
                n.particles.forEach(p => {
                    // Attract to mouse
                    const dx = mx - p.x;
                    const dy = my - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const force = Math.min(100 / (dist + 1), 2);
                    
                    p.vx += (dx / dist) * force * 0.1;
                    p.vy += (dy / dist) * force * 0.1;
                    
                    // Damping
                    p.vx *= 0.98;
                    p.vy *= 0.98;
                    
                    p.x += p.vx;
                    p.y += p.vy;
                    
                    // Wrap around
                    if (p.x < 0) p.x = w;
                    if (p.x > w) p.x = 0;
                    if (p.y < 0) p.y = h;
                    if (p.y > h) p.y = 0;

                    // Draw with glow
                    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
                    gradient.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${p.alpha})`);
                    gradient.addColorStop(1, 'transparent');
                    
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                    ctx.fillStyle = gradient;
                    ctx.fill();
                });
            }
        };

        // ===== 3. GEOMETRIC DRIFT =====
        this.animations.geometric = {
            name: 'Geometric Drift',
            shapes: [],
            time: 0,
            init: () => {
                this.animations.geometric.shapes = [];
                for (let i = 0; i < 15; i++) {
                    this.animations.geometric.shapes.push({
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height,
                        size: 30 + Math.random() * 80,
                        rotation: Math.random() * Math.PI * 2,
                        rotSpeed: (Math.random() - 0.5) * 0.02,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        sides: 3 + Math.floor(Math.random() * 4),
                        hue: Math.random() * 360,
                        alpha: 0.1 + Math.random() * 0.2
                    });
                }
            },
            render: (ctx, w, h, mx, my) => {
                const g = this.animations.geometric;
                g.time += 0.01;

                // Background
                ctx.fillStyle = '#0a0a12';
                ctx.fillRect(0, 0, w, h);

                g.shapes.forEach(s => {
                    // React to mouse
                    const dx = mx - s.x;
                    const dy = my - s.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 200) {
                        s.vx -= (dx / dist) * 0.1;
                        s.vy -= (dy / dist) * 0.1;
                    }

                    s.x += s.vx;
                    s.y += s.vy;
                    s.rotation += s.rotSpeed;
                    s.vx *= 0.99;
                    s.vy *= 0.99;

                    // Wrap
                    if (s.x < -s.size) s.x = w + s.size;
                    if (s.x > w + s.size) s.x = -s.size;
                    if (s.y < -s.size) s.y = h + s.size;
                    if (s.y > h + s.size) s.y = -s.size;

                    // Draw polygon
                    ctx.save();
                    ctx.translate(s.x, s.y);
                    ctx.rotate(s.rotation);
                    
                    ctx.beginPath();
                    for (let i = 0; i <= s.sides; i++) {
                        const angle = (i / s.sides) * Math.PI * 2;
                        const px = Math.cos(angle) * s.size;
                        const py = Math.sin(angle) * s.size;
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    
                    ctx.strokeStyle = `hsla(${s.hue + g.time * 10}, 70%, 60%, ${s.alpha + 0.3})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    ctx.fillStyle = `hsla(${s.hue + g.time * 10}, 70%, 50%, ${s.alpha})`;
                    ctx.fill();
                    
                    ctx.restore();
                });
            }
        };

        // ===== 4. LIQUID GRADIENT =====
        this.animations.liquid = {
            name: 'Liquid Gradient',
            time: 0,
            ripples: [],
            onClick: (x, y) => {
                this.animations.liquid.ripples.push({
                    x, y, radius: 0, alpha: 1, hue: Math.random() * 360
                });
            },
            init: () => {
                this.animations.liquid.ripples = [];
            },
            render: (ctx, w, h, mx, my) => {
                const l = this.animations.liquid;
                l.time += 0.005;

                // Animated gradient background
                const t = l.time;
                const cx1 = w * 0.3 + Math.sin(t) * w * 0.2;
                const cy1 = h * 0.3 + Math.cos(t * 0.7) * h * 0.2;
                const cx2 = w * 0.7 + Math.cos(t * 0.8) * w * 0.2;
                const cy2 = h * 0.7 + Math.sin(t * 0.6) * h * 0.2;

                // Mouse influence
                const mcx = mx * 0.3 + w * 0.35;
                const mcy = my * 0.3 + h * 0.35;

                const grad1 = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, w * 0.8);
                grad1.addColorStop(0, `hsla(${280 + Math.sin(t) * 30}, 80%, 40%, 0.8)`);
                grad1.addColorStop(1, 'transparent');

                const grad2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, w * 0.7);
                grad2.addColorStop(0, `hsla(${200 + Math.cos(t) * 40}, 80%, 50%, 0.6)`);
                grad2.addColorStop(1, 'transparent');

                const grad3 = ctx.createRadialGradient(mcx, mcy, 0, mcx, mcy, w * 0.5);
                grad3.addColorStop(0, `hsla(${340 + Math.sin(t * 2) * 20}, 70%, 50%, 0.5)`);
                grad3.addColorStop(1, 'transparent');

                ctx.fillStyle = '#0a0510';
                ctx.fillRect(0, 0, w, h);

                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = grad1;
                ctx.fillRect(0, 0, w, h);
                ctx.fillStyle = grad2;
                ctx.fillRect(0, 0, w, h);
                ctx.fillStyle = grad3;
                ctx.fillRect(0, 0, w, h);
                ctx.globalCompositeOperation = 'source-over';

                // Ripples
                l.ripples = l.ripples.filter(r => {
                    r.radius += 5;
                    r.alpha -= 0.015;
                    
                    if (r.alpha <= 0) return false;

                    ctx.beginPath();
                    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = `hsla(${r.hue}, 80%, 60%, ${r.alpha})`;
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    
                    return true;
                });
            }
        };

        // ===== 5. STARFIELD JOURNEY =====
        this.animations.starfield = {
            name: 'Starfield Journey',
            stars: [],
            speed: 2,
            init: () => {
                this.animations.starfield.stars = [];
                for (let i = 0; i < 400; i++) {
                    this.animations.starfield.stars.push({
                        x: (Math.random() - 0.5) * this.canvas.width * 3,
                        y: (Math.random() - 0.5) * this.canvas.height * 3,
                        z: Math.random() * 2000
                    });
                }
            },
            render: (ctx, w, h, mx, my) => {
                const s = this.animations.starfield;
                
                // Speed based on mouse Y
                s.speed = 2 + (my / h) * 15;

                // Background with slight trail
                ctx.fillStyle = 'rgba(5, 5, 15, 0.2)';
                ctx.fillRect(0, 0, w, h);

                const cx = w / 2;
                const cy = h / 2;

                s.stars.forEach(star => {
                    star.z -= s.speed;
                    
                    if (star.z <= 0) {
                        star.x = (Math.random() - 0.5) * w * 3;
                        star.y = (Math.random() - 0.5) * h * 3;
                        star.z = 2000;
                    }

                    const sx = (star.x / star.z) * 500 + cx;
                    const sy = (star.y / star.z) * 500 + cy;
                    const size = (1 - star.z / 2000) * 3;
                    const alpha = (1 - star.z / 2000);

                    // Draw star with trail
                    const prevZ = star.z + s.speed * 2;
                    const prevSx = (star.x / prevZ) * 500 + cx;
                    const prevSy = (star.y / prevZ) * 500 + cy;

                    const grad = ctx.createLinearGradient(prevSx, prevSy, sx, sy);
                    grad.addColorStop(0, 'transparent');
                    grad.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);

                    ctx.beginPath();
                    ctx.moveTo(prevSx, prevSy);
                    ctx.lineTo(sx, sy);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = size;
                    ctx.stroke();

                    // Star point
                    ctx.beginPath();
                    ctx.arc(sx, sy, size * 0.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.fill();
                });
            }
        };
    }

    switchAnimation(name) {
        if (this.animations[name]) {
            this.currentAnimation = this.animations[name];
            if (this.currentAnimation.init) {
                this.currentAnimation.init();
            }
            // Clear canvas for clean transition
            this.ctx.fillStyle = '#050510';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    enter() {
        if (this.isActive) return;
        this.isActive = true;

        // Hide main UI with transition
        document.body.classList.add('zen-mode-active');
        
        // Show zen container
        this.container.classList.add('visible');
        
        // Start default animation
        this.switchAnimation('aurora');
        this.startLoop();

        console.log('[ZenMode] Entered');
    }

    exit() {
        if (!this.isActive) return;
        this.isActive = false;

        // Show main UI
        document.body.classList.remove('zen-mode-active');
        
        // Hide zen container
        this.container.classList.remove('visible');
        
        // Stop animation loop
        this.stopLoop();

        console.log('[ZenMode] Exited');
    }

    toggle() {
        if (this.isActive) {
            this.exit();
        } else {
            this.enter();
        }
    }

    startLoop() {
        const loop = () => {
            if (!this.isActive) return;
            
            if (this.currentAnimation?.render) {
                this.currentAnimation.render(
                    this.ctx,
                    this.canvas.width,
                    this.canvas.height,
                    this.mouseX,
                    this.mouseY
                );
            }
            
            this.animationId = requestAnimationFrame(loop);
        };
        loop();
    }

    stopLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

export const zenModeService = new ZenModeService();
export default ZenModeService;
