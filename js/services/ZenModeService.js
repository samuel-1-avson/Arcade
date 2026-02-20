/**
 * ZenModeService - Interactive Background Zen Experience
 * Provides 6 calming, interactive full-screen animations with audio
 * Enhanced with: Ambient audio, Connected particles, Breathing mode, Click effects, Keyboard shortcuts
 */

class ZenModeService {
    constructor() {
        this.isActive = false;
        this.currentAnimation = null;
        this.currentAnimationName = 'aurora';
        this.animationId = null;
        this.canvas = null;
        this.ctx = null;
        this.container = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.animations = {};
        this.animationNames = ['aurora', 'nebula', 'geometric', 'liquid', 'starfield', 'breathing'];
        
        // Audio
        this.audioContext = null;
        this.ambientGain = null;
        this.ambientOscillators = [];
        this.audioEnabled = true;
        this.volume = 0.3;
        
        // Click effects
        this.clickEffects = [];
        
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
        this.setupKeyboardShortcuts();
        console.log('[ZenMode] Service initialized with enhanced features');
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
                    <button class="zen-anim-btn active" data-animation="aurora" title="Aurora Flow [1]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/>
                            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10"/>
                        </svg>
                        <span>Aurora</span>
                    </button>
                    <button class="zen-anim-btn" data-animation="nebula" title="Particle Nebula [2]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"/>
                            <circle cx="12" cy="12" r="8" stroke-dasharray="2 4"/>
                        </svg>
                        <span>Nebula</span>
                    </button>
                    <button class="zen-anim-btn" data-animation="geometric" title="Geometric Drift [3]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12,2 22,20 2,20"/>
                        </svg>
                        <span>Geometric</span>
                    </button>
                    <button class="zen-anim-btn" data-animation="liquid" title="Liquid Gradient [4]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                        </svg>
                        <span>Liquid</span>
                    </button>
                    <button class="zen-anim-btn" data-animation="starfield" title="Starfield Journey [5]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12,2 15,8.5 22,9.3 17,14 18,21 12,17.8 6,21 7,14 2,9.3 9,8.5"/>
                        </svg>
                        <span>Starfield</span>
                    </button>
                    <button class="zen-anim-btn" data-animation="breathing" title="Breathing Exercise [6]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="9"/>
                            <circle cx="12" cy="12" r="4"/>
                        </svg>
                        <span>Breathe</span>
                    </button>
                </div>
                <div class="zen-audio-controls">
                    <button class="zen-audio-btn" id="zen-audio-toggle" title="Toggle Audio [M]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="audio-on">
                            <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"/>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                        </svg>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="audio-off" style="display:none;">
                            <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"/>
                            <line x1="23" y1="9" x2="17" y2="15"/>
                            <line x1="17" y1="9" x2="23" y2="15"/>
                        </svg>
                    </button>
                    <input type="range" id="zen-volume" min="0" max="100" value="30" class="zen-volume-slider" title="Volume">
                </div>
                <button class="zen-exit-btn" id="zen-exit-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    <span>Exit [Esc]</span>
                </button>
            </div>
            <div class="zen-hint">Move mouse to interact • Click for effects • Keys 1-6 to switch • Esc to exit</div>
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
            e.preventDefault();
            this.mouseX = e.touches[0].clientX;
            this.mouseY = e.touches[0].clientY;
        });
        this.canvas.addEventListener('click', (e) => {
            this.spawnClickEffect(e.clientX, e.clientY);
            if (this.currentAnimation?.onClick) {
                this.currentAnimation.onClick(e.clientX, e.clientY);
            }
        });
        this.canvas.addEventListener('touchstart', (e) => {
            this.spawnClickEffect(e.touches[0].clientX, e.touches[0].clientY);
        });

        // Animation selector buttons
        this.container.querySelectorAll('.zen-anim-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.container.querySelectorAll('.zen-anim-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.switchAnimation(btn.dataset.animation);
            });
        });

        // Audio controls
        document.getElementById('zen-audio-toggle')?.addEventListener('click', () => this.toggleAudio());
        document.getElementById('zen-volume')?.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            this.updateAudioVolume();
        });

        // Exit button
        document.getElementById('zen-exit-btn').addEventListener('click', () => this.exit());
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            // Number keys 1-6 to switch animations
            if (e.key >= '1' && e.key <= '6') {
                const index = parseInt(e.key) - 1;
                if (this.animationNames[index]) {
                    this.selectAnimationByIndex(index);
                }
            }
            
            // Escape to exit
            if (e.key === 'Escape') {
                this.exit();
            }
            
            // M to toggle audio
            if (e.key === 'm' || e.key === 'M') {
                this.toggleAudio();
            }
            
            // Arrow keys to navigate
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                this.nextAnimation();
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                this.prevAnimation();
            }
            
            // Space to pause/resume (for breathing mode)
            if (e.key === ' ') {
                e.preventDefault();
                // Could implement pause functionality
            }
        });
    }

    selectAnimationByIndex(index) {
        const name = this.animationNames[index];
        if (name) {
            const btns = this.container.querySelectorAll('.zen-anim-btn');
            btns.forEach(b => b.classList.remove('active'));
            btns[index]?.classList.add('active');
            this.switchAnimation(name);
        }
    }

    nextAnimation() {
        const currentIndex = this.animationNames.indexOf(this.currentAnimationName);
        const nextIndex = (currentIndex + 1) % this.animationNames.length;
        this.selectAnimationByIndex(nextIndex);
    }

    prevAnimation() {
        const currentIndex = this.animationNames.indexOf(this.currentAnimationName);
        const prevIndex = (currentIndex - 1 + this.animationNames.length) % this.animationNames.length;
        this.selectAnimationByIndex(prevIndex);
    }

    // ============ AUDIO SYSTEM ============
    initAudio() {
        if (this.audioContext) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.ambientGain = this.audioContext.createGain();
            this.ambientGain.connect(this.audioContext.destination);
            this.ambientGain.gain.value = this.volume;
        } catch (e) {
            console.warn('[ZenMode] Audio not supported:', e);
            this.audioEnabled = false;
        }
    }

    playAmbientSound(type = 'aurora') {
        if (!this.audioEnabled || !this.audioContext) return;

        // Stop existing ambient sounds
        this.stopAmbientSound();

        // Create ambient sound based on animation type
        const sounds = {
            aurora: () => this.createDrone([110, 165, 220], 'sine'),
            nebula: () => this.createDrone([80, 120, 160], 'triangle'),
            geometric: () => this.createDrone([130, 195, 260], 'square', 0.1),
            liquid: () => this.createDrone([100, 150, 200], 'sine'),
            starfield: () => this.createWhiteNoise(),
            breathing: () => this.createBreathingSound()
        };

        if (sounds[type]) {
            sounds[type]();
        }
    }

    createDrone(frequencies, waveType = 'sine', volume = 0.15) {
        frequencies.forEach(freq => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = waveType;
            osc.frequency.value = freq;
            gain.gain.value = volume * this.volume;
            
            // Add slight detune for richness
            osc.detune.value = (Math.random() - 0.5) * 10;
            
            osc.connect(gain);
            gain.connect(this.ambientGain);
            osc.start();
            
            this.ambientOscillators.push({ osc, gain });
        });
    }

    createWhiteNoise() {
        const bufferSize = 2 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        // Filter to make it more like wind
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.05 * this.volume;
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ambientGain);
        source.start();
        
        this.ambientOscillators.push({ osc: source, gain, filter });
    }

    createBreathingSound() {
        // Simple humming tone
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 136.1; // Om frequency
        gain.gain.value = 0.1 * this.volume;
        
        osc.connect(gain);
        gain.connect(this.ambientGain);
        osc.start();
        
        this.ambientOscillators.push({ osc, gain });
    }

    stopAmbientSound() {
        this.ambientOscillators.forEach(({ osc, gain }) => {
            try {
                gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
                setTimeout(() => osc.stop(), 600);
            } catch (e) {}
        });
        this.ambientOscillators = [];
    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        
        const onIcon = this.container.querySelector('.audio-on');
        const offIcon = this.container.querySelector('.audio-off');
        
        if (this.audioEnabled) {
            onIcon.style.display = 'block';
            offIcon.style.display = 'none';
            this.playAmbientSound(this.currentAnimationName);
        } else {
            onIcon.style.display = 'none';
            offIcon.style.display = 'block';
            this.stopAmbientSound();
        }
    }

    updateAudioVolume() {
        if (this.ambientGain) {
            this.ambientGain.gain.value = this.volume;
        }
    }

    // ============ CLICK EFFECTS ============
    spawnClickEffect(x, y) {
        // Spawn multiple particles
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.clickEffects.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                size: 3 + Math.random() * 4,
                hue: Math.random() * 60 + 300 // Pink-purple range
            });
        }
        
        // Central burst
        this.clickEffects.push({
            x, y,
            vx: 0, vy: 0,
            life: 1,
            size: 20,
            hue: 340,
            isRing: true
        });
    }

    renderClickEffects(ctx) {
        this.clickEffects = this.clickEffects.filter(p => {
            p.life -= 0.03;
            if (p.life <= 0) return false;
            
            if (p.isRing) {
                // Expanding ring
                p.size += 8;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.strokeStyle = `hsla(${p.hue}, 100%, 70%, ${p.life * 0.5})`;
                ctx.lineWidth = 3;
                ctx.stroke();
            } else {
                // Moving particle
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.96;
                p.vy *= 0.96;
                p.size *= 0.98;
                
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${p.life})`);
                gradient.addColorStop(1, 'transparent');
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
            
            return true;
        });
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
                a.particles.forEach((p) => {
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

        // ===== 2. PARTICLE NEBULA (with connected particles) =====
        this.animations.nebula = {
            name: 'Particle Nebula',
            particles: [],
            connectionDistance: 100,
            init: () => {
                this.animations.nebula.particles = [];
                for (let i = 0; i < 150; i++) {
                    this.animations.nebula.particles.push({
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height,
                        vx: 0,
                        vy: 0,
                        size: 2 + Math.random() * 3,
                        hue: 280 + Math.random() * 80,
                        alpha: 0.5 + Math.random() * 0.5
                    });
                }
            },
            render: (ctx, w, h, mx, my) => {
                // Fade trail
                ctx.fillStyle = 'rgba(5, 5, 16, 0.15)';
                ctx.fillRect(0, 0, w, h);

                const n = this.animations.nebula;
                const particles = n.particles;
                
                // Draw connections first
                ctx.lineWidth = 0.5;
                for (let i = 0; i < particles.length; i++) {
                    for (let j = i + 1; j < particles.length; j++) {
                        const dx = particles[i].x - particles[j].x;
                        const dy = particles[i].y - particles[j].y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < n.connectionDistance) {
                            const alpha = (1 - dist / n.connectionDistance) * 0.3;
                            ctx.beginPath();
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.strokeStyle = `hsla(${(particles[i].hue + particles[j].hue) / 2}, 80%, 60%, ${alpha})`;
                            ctx.stroke();
                        }
                    }
                }
                
                // Update and draw particles
                particles.forEach(p => {
                    // Attract to mouse
                    const dx = mx - p.x;
                    const dy = my - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const force = Math.min(100 / (dist + 1), 2);
                    
                    p.vx += (dx / dist) * force * 0.08;
                    p.vy += (dy / dist) * force * 0.08;
                    
                    // Damping
                    p.vx *= 0.97;
                    p.vy *= 0.97;
                    
                    p.x += p.vx;
                    p.y += p.vy;
                    
                    // Wrap around
                    if (p.x < 0) p.x = w;
                    if (p.x > w) p.x = 0;
                    if (p.y < 0) p.y = h;
                    if (p.y > h) p.y = 0;

                    // Draw with glow
                    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
                    gradient.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${p.alpha})`);
                    gradient.addColorStop(0.5, `hsla(${p.hue}, 100%, 50%, ${p.alpha * 0.3})`);
                    gradient.addColorStop(1, 'transparent');
                    
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
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
            onClick: (x, y) => {
                // Spawn new shape on click
                this.animations.geometric.shapes.push({
                    x, y,
                    size: 20 + Math.random() * 40,
                    rotation: 0,
                    rotSpeed: (Math.random() - 0.5) * 0.05,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    sides: 3 + Math.floor(Math.random() * 5),
                    hue: Math.random() * 360,
                    alpha: 0.3 + Math.random() * 0.3
                });
            },
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

                // Limit shapes
                if (g.shapes.length > 30) {
                    g.shapes = g.shapes.slice(-30);
                }

                g.shapes.forEach(s => {
                    // React to mouse
                    const dx = mx - s.x;
                    const dy = my - s.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 200) {
                        s.vx -= (dx / dist) * 0.15;
                        s.vy -= (dy / dist) * 0.15;
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
                // Multiple ripples
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        this.animations.liquid.ripples.push({
                            x, y, radius: i * 20, alpha: 1 - i * 0.2, hue: Math.random() * 360, lineWidth: 4 - i
                        });
                    }, i * 100);
                }
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
                    r.radius += 4;
                    r.alpha -= 0.012;
                    
                    if (r.alpha <= 0) return false;

                    ctx.beginPath();
                    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = `hsla(${r.hue}, 80%, 60%, ${r.alpha})`;
                    ctx.lineWidth = r.lineWidth || 3;
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
                for (let i = 0; i < 500; i++) {
                    this.animations.starfield.stars.push({
                        x: (Math.random() - 0.5) * this.canvas.width * 3,
                        y: (Math.random() - 0.5) * this.canvas.height * 3,
                        z: Math.random() * 2000,
                        hue: Math.random() < 0.1 ? 200 + Math.random() * 60 : 0 // Some colored stars
                    });
                }
            },
            render: (ctx, w, h, mx, my) => {
                const s = this.animations.starfield;
                
                // Speed based on mouse Y
                s.speed = 2 + (my / h) * 18;

                // Background with slight trail
                ctx.fillStyle = 'rgba(5, 5, 15, 0.15)';
                ctx.fillRect(0, 0, w, h);

                const cx = w / 2 + (mx - w/2) * 0.1;
                const cy = h / 2 + (my - h/2) * 0.1;

                s.stars.forEach(star => {
                    star.z -= s.speed;
                    
                    if (star.z <= 0) {
                        star.x = (Math.random() - 0.5) * w * 3;
                        star.y = (Math.random() - 0.5) * h * 3;
                        star.z = 2000;
                    }

                    const sx = (star.x / star.z) * 500 + cx;
                    const sy = (star.y / star.z) * 500 + cy;
                    const size = (1 - star.z / 2000) * 4;
                    const alpha = (1 - star.z / 2000);

                    // Draw star with trail
                    const prevZ = star.z + s.speed * 3;
                    const prevSx = (star.x / prevZ) * 500 + cx;
                    const prevSy = (star.y / prevZ) * 500 + cy;

                    const color = star.hue ? `hsla(${star.hue}, 80%, 70%, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
                    
                    const grad = ctx.createLinearGradient(prevSx, prevSy, sx, sy);
                    grad.addColorStop(0, 'transparent');
                    grad.addColorStop(1, color);

                    ctx.beginPath();
                    ctx.moveTo(prevSx, prevSy);
                    ctx.lineTo(sx, sy);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = size;
                    ctx.stroke();

                    // Star point
                    ctx.beginPath();
                    ctx.arc(sx, sy, size * 0.6, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                });
            }
        };

        // ===== 6. BREATHING EXERCISE (NEW) =====
        this.animations.breathing = {
            name: 'Breathing Exercise',
            time: 0,
            phase: 'inhale', // inhale, hold, exhale, rest
            phaseTime: 0,
            phaseDurations: { inhale: 4, hold: 4, exhale: 6, rest: 2 },
            circleSize: 0,
            targetSize: 0,
            particles: [],
            init: () => {
                const b = this.animations.breathing;
                b.time = 0;
                b.phase = 'inhale';
                b.phaseTime = 0;
                b.circleSize = 50;
                b.particles = [];
                for (let i = 0; i < 50; i++) {
                    b.particles.push({
                        angle: (i / 50) * Math.PI * 2,
                        radius: 150 + Math.random() * 50,
                        speed: 0.005 + Math.random() * 0.01,
                        size: 2 + Math.random() * 3,
                        alpha: 0.3 + Math.random() * 0.5
                    });
                }
            },
            render: (ctx, w, h, mx, my) => {
                const b = this.animations.breathing;
                b.time += 1/60;
                b.phaseTime += 1/60;
                
                const cx = w / 2;
                const cy = h / 2;
                
                // Phase management
                const currentDuration = b.phaseDurations[b.phase];
                if (b.phaseTime >= currentDuration) {
                    b.phaseTime = 0;
                    if (b.phase === 'inhale') b.phase = 'hold';
                    else if (b.phase === 'hold') b.phase = 'exhale';
                    else if (b.phase === 'exhale') b.phase = 'rest';
                    else b.phase = 'inhale';
                }
                
                // Target circle size based on phase
                const maxSize = Math.min(w, h) * 0.3;
                const minSize = 50;
                if (b.phase === 'inhale') {
                    b.targetSize = minSize + (maxSize - minSize) * (b.phaseTime / currentDuration);
                } else if (b.phase === 'exhale') {
                    b.targetSize = maxSize - (maxSize - minSize) * (b.phaseTime / currentDuration);
                }
                
                // Smooth circle size
                b.circleSize += (b.targetSize - b.circleSize) * 0.05;
                
                // Background
                ctx.fillStyle = '#050510';
                ctx.fillRect(0, 0, w, h);
                
                // Phase indicator color
                const phaseColors = {
                    inhale: { h: 180, l: 50 },
                    hold: { h: 280, l: 40 },
                    exhale: { h: 220, l: 45 },
                    rest: { h: 260, l: 35 }
                };
                const pc = phaseColors[b.phase];
                
                // Outer particles
                b.particles.forEach(p => {
                    p.angle += p.speed;
                    const baseRadius = b.circleSize + p.radius * (b.circleSize / 150);
                    const x = cx + Math.cos(p.angle) * baseRadius;
                    const y = cy + Math.sin(p.angle) * baseRadius;
                    
                    ctx.beginPath();
                    ctx.arc(x, y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = `hsla(${pc.h}, 60%, ${pc.l}%, ${p.alpha * 0.5})`;
                    ctx.fill();
                });
                
                // Main breathing circle
                const pulseGlow = Math.sin(b.time * 3) * 0.1 + 0.9;
                
                // Outer glow
                const glowGrad = ctx.createRadialGradient(cx, cy, b.circleSize * 0.5, cx, cy, b.circleSize * 1.5);
                glowGrad.addColorStop(0, `hsla(${pc.h}, 80%, 60%, 0.3)`);
                glowGrad.addColorStop(1, 'transparent');
                ctx.beginPath();
                ctx.arc(cx, cy, b.circleSize * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = glowGrad;
                ctx.fill();
                
                // Main circle
                const circleGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.circleSize);
                circleGrad.addColorStop(0, `hsla(${pc.h}, 70%, 70%, ${0.6 * pulseGlow})`);
                circleGrad.addColorStop(0.7, `hsla(${pc.h}, 80%, 50%, ${0.4 * pulseGlow})`);
                circleGrad.addColorStop(1, `hsla(${pc.h}, 90%, 40%, 0.2)`);
                
                ctx.beginPath();
                ctx.arc(cx, cy, b.circleSize, 0, Math.PI * 2);
                ctx.fillStyle = circleGrad;
                ctx.fill();
                
                // Inner circle
                ctx.beginPath();
                ctx.arc(cx, cy, b.circleSize * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${pc.h}, 60%, 80%, 0.6)`;
                ctx.fill();
                
                // Phase text
                const phaseText = {
                    inhale: 'Breathe In...',
                    hold: 'Hold...',
                    exhale: 'Breathe Out...',
                    rest: 'Rest...'
                };
                
                ctx.font = '600 32px system-ui, -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = `hsla(${pc.h}, 60%, 80%, 0.9)`;
                ctx.fillText(phaseText[b.phase], cx, cy + b.circleSize + 60);
                
                // Timer
                const remaining = Math.ceil(currentDuration - b.phaseTime);
                ctx.font = '400 24px system-ui, -apple-system, sans-serif';
                ctx.fillStyle = `hsla(${pc.h}, 50%, 70%, 0.7)`;
                ctx.fillText(remaining, cx, cy + b.circleSize + 100);
            }
        };
    }

    switchAnimation(name) {
        if (this.animations[name]) {
            this.currentAnimationName = name;
            this.currentAnimation = this.animations[name];
            if (this.currentAnimation.init) {
                this.currentAnimation.init();
            }
            // Clear canvas for clean transition
            this.ctx.fillStyle = '#050510';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Switch ambient sound
            if (this.audioEnabled) {
                this.playAmbientSound(name);
            }
        }
    }

    enter() {
        if (this.isActive) return;
        this.isActive = true;

        // Initialize audio on first enter (requires user gesture)
        this.initAudio();

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
        
        // Stop audio
        this.stopAmbientSound();

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
        this.stopLoop(); // Prevent multiple loops
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
            
            // Render click effects on top
            this.renderClickEffects(this.ctx);
            
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
