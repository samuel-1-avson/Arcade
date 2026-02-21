/**
 * Particle Effects System for 2048
 * Minimal, calm particle animations
 */

class ParticleEffectsSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationFrame = null;
        
        this.init();
    }

    init() {
        // Create overlay canvas for particles
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'particle-canvas';
        this.canvas.className = 'particle-canvas';
        this.ctx = this.canvas.getContext('2d');
        
        // Position over game container
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.position = 'relative';
            gameContainer.appendChild(this.canvas);
            this.resizeCanvas();
        }
        
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.startAnimation();
    }

    resizeCanvas() {
        const container = document.querySelector('.game-container');
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }
    }

    /**
     * Create merge particles when tiles combine
     */
    createMergeEffect(x, y, tileValue) {
        const particleCount = 8;
        const color = this.getTileColor(tileValue);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 2;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 3,
                color: color,
                alpha: 1,
                life: 1,
                decay: 0.02
            });
        }
    }

    /**
     * Create celebration particles for 2048
     */
    create2048Celebration() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 4;
            
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2, // Slight upward bias
                size: 4 + Math.random() * 4,
                color: this.getRandomCelebrationColor(),
                alpha: 1,
                life: 1,
                decay: 0.01
            });
        }
    }

    /**
     * Create gentle score popup particles
     */
    createScorePopup(x, y, score) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -1 - Math.random(),
                size: 2,
                color: '#a8d5ba',
                alpha: 1,
                life: 1,
                decay: 0.015,
                text: `+${score}`,
                isText: true
            });
        }
    }

    /**
     * Update and render particles
     */
    update() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Apply gravity (very gentle)
            p.vy += 0.1;
            
            // Update life
            p.life -= p.decay;
            p.alpha = p.life;
            
            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // Render particle
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            
            if (p.isText) {
                this.ctx.fillStyle = p.color;
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillText(p.text, p.x, p.y);
            } else {
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }
    }

    /**
     * Animation loop
     */
    startAnimation() {
        const animate = () => {
            this.update();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    /**
     * Get color for tile value
     */
    getTileColor(value) {
        const colors = {
            2: '#eee4da',
            4: '#ede0c8',
            8: '#f2b179',
            16: '#f59563',
            32: '#f67c5f',
            64: '#f65e3b',
            128: '#edcf72',
            256: '#edcc61',
            512: '#edc850',
            1024: '#edc53f',
            2048: '#edc22e'
        };
        return colors[value] || '#3c3a32';
    }

    /**
     * Get random celebration color
     */
    getRandomCelebrationColor() {
        const colors = ['#a8d5ba', '#f9d089', '#f5a3a3', '#c4b5fd', '#93c5fd', '#fecaca'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Initialize particle effects
const particleEffects = new ParticleEffectsSystem();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleEffectsSystem;
}
