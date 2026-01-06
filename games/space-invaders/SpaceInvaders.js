/**
 * Space Invaders - Classic alien shooter
 */
import { GameEngine, GameState } from '../../js/engine/GameEngine.js';
import { inputManager } from '../../js/engine/InputManager.js';
import { storageManager } from '../../js/engine/StorageManager.js';
import { random } from '../../js/utils/math.js';

// Configuration
const CONFIG = {
    playerWidth: 40,
    playerHeight: 24,
    playerSpeed: 250,
    bulletSpeed: 400,
    alienBulletSpeed: 200,
    alienRows: 5,
    alienCols: 11,
    alienWidth: 30,
    alienHeight: 24,
    alienSpacing: 40,
    alienMoveSpeed: 30,
    alienDropDistance: 20
};

// Alien types and points
const ALIEN_TYPES = [
    { points: 30, color: '#ff00ff' },  // Top row
    { points: 20, color: '#00ffff' },  // Row 2-3
    { points: 10, color: '#00ff00' }   // Row 4-5
];

class SpaceInvaders extends GameEngine {
    constructor() {
        super({
            canvasId: 'game-canvas',
            gameId: 'space-invaders',
            width: 480,
            height: 560,
            pixelPerfect: true
        });

        // Player state
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: CONFIG.playerWidth,
            height: CONFIG.playerHeight,
            speed: CONFIG.playerSpeed
        };

        // Game objects
        this.aliens = [];
        this.playerBullets = [];
        this.alienBullets = [];
        this.shields = [];
        this.particles = [];

        // Alien movement
        this.alienDirection = 1;
        this.alienMoveTimer = 0;
        this.alienMoveInterval = 1.0;
        this.alienMoveStep = CONFIG.alienMoveSpeed;

        // Game state
        this.lives = 3;
        this.wave = 1;
        this.canShoot = true;
        this.shootCooldown = 0.3;
        this.shootTimer = 0;

        // UFO
        this.ufo = null;
        this.ufoTimer = 0;

        // Colors
        this.colors = {
            bg: '#000',
            player: '#00ff00',
            bullet: '#fff',
            alienBullet: '#ff0000',
            shield: '#00ff00'
        };

        this.setupUI();
        this.onReset();
    }

    setupUI() {
        document.getElementById('start-btn')?.addEventListener('click', () => {
            this.reset();
            this.start();
        });

        document.getElementById('restart-btn')?.addEventListener('click', () => {
            this.reset();
            this.start();
        });

        document.getElementById('pause-btn')?.addEventListener('click', () => {
            this.togglePause();
        });

        // Touch controls
        let touchX = null;
        this.canvas.addEventListener('touchstart', (e) => {
            touchX = e.touches[0].clientX;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (touchX !== null) {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / rect.width;
                this.player.x = (e.touches[0].clientX - rect.left) * scaleX;
            }
        });

        this.canvas.addEventListener('touchend', () => {
            touchX = null;
            if (this.state === GameState.PLAYING) {
                this.shoot();
            }
        });
    }

    onReset() {
        // Reset player
        this.player.x = this.canvas.width / 2;

        // Reset game state
        this.lives = 3;
        this.wave = 1;
        this.playerBullets = [];
        this.alienBullets = [];
        this.particles = [];
        this.ufo = null;
        this.alienMoveInterval = 1.0;

        // Create aliens and shields
        this.createAliens();
        this.createShields();

        this.updateLivesDisplay();
        this.render();
    }

    onStart() {
        this._hideOverlay();
    }

    createAliens() {
        this.aliens = [];
        const startX = (this.canvas.width - CONFIG.alienCols * CONFIG.alienSpacing) / 2;
        const startY = 80;

        for (let row = 0; row < CONFIG.alienRows; row++) {
            const typeIndex = row === 0 ? 0 : (row < 3 ? 1 : 2);
            const type = ALIEN_TYPES[typeIndex];

            for (let col = 0; col < CONFIG.alienCols; col++) {
                this.aliens.push({
                    x: startX + col * CONFIG.alienSpacing,
                    y: startY + row * (CONFIG.alienHeight + 10),
                    width: CONFIG.alienWidth,
                    height: CONFIG.alienHeight,
                    type: typeIndex,
                    points: type.points,
                    color: type.color,
                    frame: 0
                });
            }
        }
    }

    createShields() {
        this.shields = [];
        const shieldCount = 4;
        const shieldWidth = 60;
        const shieldSpacing = (this.canvas.width - shieldCount * shieldWidth) / (shieldCount + 1);

        for (let i = 0; i < shieldCount; i++) {
            const x = shieldSpacing + i * (shieldWidth + shieldSpacing);
            const y = this.canvas.height - 120;

            // Create shield blocks
            for (let bx = 0; bx < 12; bx++) {
                for (let by = 0; by < 8; by++) {
                    // Create shield shape (arch)
                    const isTop = by < 3;
                    const isMiddle = bx >= 4 && bx < 8 && by >= 5;
                    
                    if (isMiddle) continue;
                    if (isTop && (bx < 1 || bx > 10)) continue;

                    this.shields.push({
                        x: x + bx * 5,
                        y: y + by * 5,
                        width: 5,
                        height: 5,
                        hits: 0
                    });
                }
            }
        }
    }

    update(dt) {
        // Handle input
        this.handleInput(dt);

        // Update shooting cooldown
        if (!this.canShoot) {
            this.shootTimer += dt;
            if (this.shootTimer >= this.shootCooldown) {
                this.canShoot = true;
                this.shootTimer = 0;
            }
        }

        // Update aliens
        this.updateAliens(dt);

        // Update bullets
        this.updateBullets(dt);

        // Update UFO
        this.updateUFO(dt);

        // Update particles
        this.updateParticles(dt);

        // Check collisions
        this.checkCollisions();

        // Check win condition
        if (this.aliens.length === 0) {
            this.nextWave();
        }
    }

    handleInput(dt) {
        if (inputManager.isKeyDown('ArrowLeft') || inputManager.isKeyDown('KeyA')) {
            this.player.x -= this.player.speed * dt;
        }
        if (inputManager.isKeyDown('ArrowRight') || inputManager.isKeyDown('KeyD')) {
            this.player.x += this.player.speed * dt;
        }

        // Clamp player position
        const halfWidth = this.player.width / 2;
        this.player.x = Math.max(halfWidth, Math.min(this.canvas.width - halfWidth, this.player.x));

        // Shoot
        if (inputManager.isKeyDown('Space')) {
            this.shoot();
        }
    }

    shoot() {
        if (!this.canShoot) return;

        this.playerBullets.push({
            x: this.player.x,
            y: this.player.y - this.player.height / 2,
            width: 3,
            height: 12,
            speed: CONFIG.bulletSpeed
        });

        this.canShoot = false;
    }

    updateAliens(dt) {
        if (this.aliens.length === 0) return;

        // Move timer
        this.alienMoveTimer += dt;

        // Animate aliens
        for (const alien of this.aliens) {
            alien.frame = Math.floor(this.elapsedTime * 2) % 2;
        }

        if (this.alienMoveTimer >= this.alienMoveInterval) {
            this.alienMoveTimer = 0;

            // Check if any alien hit edge
            let hitEdge = false;
            for (const alien of this.aliens) {
                if ((this.alienDirection > 0 && alien.x + alien.width / 2 + this.alienMoveStep > this.canvas.width - 20) ||
                    (this.alienDirection < 0 && alien.x - alien.width / 2 - this.alienMoveStep < 20)) {
                    hitEdge = true;
                    break;
                }
            }

            if (hitEdge) {
                // Move down and reverse direction
                for (const alien of this.aliens) {
                    alien.y += CONFIG.alienDropDistance;
                }
                this.alienDirection *= -1;

                // Speed up
                this.alienMoveInterval = Math.max(0.1, this.alienMoveInterval - 0.05);
            } else {
                // Move horizontally
                for (const alien of this.aliens) {
                    alien.x += this.alienMoveStep * this.alienDirection;
                }
            }

            // Random alien shooting
            if (Math.random() < 0.3 && this.aliens.length > 0) {
                this.alienShoot();
            }
        }

        // Check if aliens reached bottom
        for (const alien of this.aliens) {
            if (alien.y + alien.height / 2 > this.player.y - 20) {
                this.gameOver(false);
                return;
            }
        }
    }

    alienShoot() {
        // Find bottom-most alien in each column
        const columns = new Map();

        for (const alien of this.aliens) {
            const col = Math.floor(alien.x / CONFIG.alienSpacing);
            if (!columns.has(col) || alien.y > columns.get(col).y) {
                columns.set(col, alien);
            }
        }

        // Pick a random column
        const shooters = [...columns.values()];
        if (shooters.length > 0) {
            const shooter = shooters[Math.floor(Math.random() * shooters.length)];
            this.alienBullets.push({
                x: shooter.x,
                y: shooter.y + shooter.height / 2,
                width: 3,
                height: 10,
                speed: CONFIG.alienBulletSpeed
            });
        }
    }

    updateBullets(dt) {
        // Player bullets
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            bullet.y -= bullet.speed * dt;

            if (bullet.y + bullet.height < 0) {
                this.playerBullets.splice(i, 1);
            }
        }

        // Alien bullets
        for (let i = this.alienBullets.length - 1; i >= 0; i--) {
            const bullet = this.alienBullets[i];
            bullet.y += bullet.speed * dt;

            if (bullet.y > this.canvas.height) {
                this.alienBullets.splice(i, 1);
            }
        }
    }

    updateUFO(dt) {
        if (this.ufo) {
            this.ufo.x += this.ufo.speed * this.ufo.direction * dt;

            if (this.ufo.x < -50 || this.ufo.x > this.canvas.width + 50) {
                this.ufo = null;
            }
        } else {
            this.ufoTimer += dt;
            if (this.ufoTimer > random(15, 30)) {
                this.ufoTimer = 0;
                this.ufo = {
                    x: this.canvas.width + 25,
                    y: 40,
                    width: 50,
                    height: 20,
                    speed: 100,
                    direction: -1,
                    points: [50, 100, 150, 200, 300][Math.floor(Math.random() * 5)]
                };
            }
        }
    }

    checkCollisions() {
        // Player bullets vs aliens
        for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
            const bullet = this.playerBullets[bi];

            for (let ai = this.aliens.length - 1; ai >= 0; ai--) {
                const alien = this.aliens[ai];

                if (this.checkCollision(bullet, alien)) {
                    this.addScore(alien.points);
                    this.spawnExplosion(alien.x, alien.y, alien.color);
                    this.aliens.splice(ai, 1);
                    this.playerBullets.splice(bi, 1);
                    break;
                }
            }
        }

        // Player bullets vs UFO
        if (this.ufo) {
            for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
                const bullet = this.playerBullets[bi];

                if (this.checkCollision(bullet, this.ufo)) {
                    this.addScore(this.ufo.points);
                    this.spawnExplosion(this.ufo.x, this.ufo.y, '#ff0000');
                    this.ufo = null;
                    this.playerBullets.splice(bi, 1);
                    break;
                }
            }
        }

        // Player bullets vs shields
        for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
            const bullet = this.playerBullets[bi];

            for (let si = this.shields.length - 1; si >= 0; si--) {
                const shield = this.shields[si];

                if (this.checkCollision(bullet, shield)) {
                    this.shields.splice(si, 1);
                    this.playerBullets.splice(bi, 1);
                    break;
                }
            }
        }

        // Alien bullets vs player
        for (let bi = this.alienBullets.length - 1; bi >= 0; bi--) {
            const bullet = this.alienBullets[bi];
            const playerRect = {
                x: this.player.x - this.player.width / 2,
                y: this.player.y - this.player.height / 2,
                width: this.player.width,
                height: this.player.height
            };

            if (this.checkCollision(bullet, playerRect)) {
                this.alienBullets.splice(bi, 1);
                this.loseLife();
                break;
            }
        }

        // Alien bullets vs shields
        for (let bi = this.alienBullets.length - 1; bi >= 0; bi--) {
            const bullet = this.alienBullets[bi];

            for (let si = this.shields.length - 1; si >= 0; si--) {
                const shield = this.shields[si];

                if (this.checkCollision(bullet, shield)) {
                    this.shields.splice(si, 1);
                    this.alienBullets.splice(bi, 1);
                    break;
                }
            }
        }
    }

    checkCollision(a, b) {
        const ax = a.x - (a.width / 2 || 0);
        const ay = a.y - (a.height / 2 || 0);
        const bx = b.x - (b.width / 2 || 0);
        const by = b.y - (b.height / 2 || 0);

        return ax < bx + b.width &&
               ax + a.width > bx &&
               ay < by + b.height &&
               ay + a.height > by;
    }

    loseLife() {
        this.lives--;
        this.updateLivesDisplay();

        if (this.lives <= 0) {
            this.gameOver(false);
        } else {
            // Flash effect
            const wrapper = document.querySelector('.canvas-wrapper');
            wrapper?.classList.add('hit-flash');
            setTimeout(() => wrapper?.classList.remove('hit-flash'), 100);
        }
    }

    updateLivesDisplay() {
        const el = document.querySelector('.lives-value');
        if (el) {
            el.textContent = '🚀'.repeat(Math.max(0, this.lives));
        }
    }

    nextWave() {
        this.wave++;
        this.alienMoveInterval = Math.max(0.3, 1.0 - this.wave * 0.1);
        this.createAliens();
    }

    spawnExplosion(x, y, color) {
        for (let i = 0; i < 10; i++) {
            const angle = random(0, Math.PI * 2);
            const speed = random(50, 150);
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5,
                maxLife: 0.5,
                size: random(3, 6),
                color
            });
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render() {
        const ctx = this.ctx;

        // Background
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Stars background
        this.renderStars();

        // Shields
        this.renderShields();

        // Aliens
        this.renderAliens();

        // UFO
        if (this.ufo) {
            this.renderUFO();
        }

        // Bullets
        this.renderBullets();

        // Player
        this.renderPlayer();

        // Particles
        this.renderParticles();
    }

    renderStars() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';

        for (let i = 0; i < 50; i++) {
            const x = (i * 97 + this.elapsedTime * 5) % this.canvas.width;
            const y = (i * 53) % (this.canvas.height - 100);
            ctx.fillRect(x, y, 1, 1);
        }
    }

    renderPlayer() {
        const ctx = this.ctx;
        const { x, y, width, height } = this.player;

        ctx.shadowColor = this.colors.player;
        ctx.shadowBlur = 10;
        ctx.fillStyle = this.colors.player;

        // Ship body
        ctx.beginPath();
        ctx.moveTo(x, y - height / 2);
        ctx.lineTo(x - width / 2, y + height / 2);
        ctx.lineTo(x + width / 2, y + height / 2);
        ctx.closePath();
        ctx.fill();

        // Cannon
        ctx.fillRect(x - 2, y - height / 2 - 8, 4, 8);

        ctx.shadowBlur = 0;
    }

    renderAliens() {
        const ctx = this.ctx;

        for (const alien of this.aliens) {
            ctx.shadowColor = alien.color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = alien.color;

            const { x, y, width, height, type, frame } = alien;

            // Different alien shapes
            if (type === 0) {
                // Squid
                ctx.fillRect(x - width/2 + 6, y - height/2, width - 12, height * 0.6);
                ctx.fillRect(x - width/2, y - height/2 + height * 0.3, width, height * 0.3);
                // Tentacles
                const legOffset = frame === 0 ? 0 : 3;
                ctx.fillRect(x - width/2, y + height/2 - 6 + legOffset, 4, 6);
                ctx.fillRect(x + width/2 - 4, y + height/2 - 6 - legOffset, 4, 6);
            } else if (type === 1) {
                // Crab
                ctx.fillRect(x - width/2 + 4, y - height/2, width - 8, height * 0.7);
                // Arms
                const armOffset = frame === 0 ? -3 : 3;
                ctx.fillRect(x - width/2, y - height/4 + armOffset, 6, 4);
                ctx.fillRect(x + width/2 - 6, y - height/4 - armOffset, 6, 4);
            } else {
                // Octopus
                ctx.fillRect(x - width/2 + 2, y - height/2, width - 4, height * 0.5);
                ctx.fillRect(x - width/2, y, width, height * 0.3);
                // Tentacles
                for (let i = 0; i < 4; i++) {
                    const tx = x - width/2 + 4 + i * 7;
                    const ty = y + height/2 - 4 + (frame + i) % 2 * 3;
                    ctx.fillRect(tx, ty, 4, 4);
                }
            }

            // Eyes
            ctx.fillStyle = '#000';
            ctx.fillRect(x - 5, y - 2, 3, 3);
            ctx.fillRect(x + 2, y - 2, 3, 3);
        }

        ctx.shadowBlur = 0;
    }

    renderUFO() {
        const ctx = this.ctx;
        const { x, y, width, height } = this.ufo;

        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ff0000';

        // UFO body
        ctx.beginPath();
        ctx.ellipse(x, y, width / 2, height / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dome
        ctx.fillStyle = '#ff6666';
        ctx.beginPath();
        ctx.ellipse(x, y - 5, width / 4, height / 2, 0, 0, Math.PI);
        ctx.fill();

        ctx.shadowBlur = 0;
    }

    renderBullets() {
        const ctx = this.ctx;

        // Player bullets
        ctx.fillStyle = this.colors.bullet;
        ctx.shadowColor = this.colors.bullet;
        ctx.shadowBlur = 5;

        for (const bullet of this.playerBullets) {
            ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
        }

        // Alien bullets
        ctx.fillStyle = this.colors.alienBullet;
        ctx.shadowColor = this.colors.alienBullet;

        for (const bullet of this.alienBullets) {
            ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
        }

        ctx.shadowBlur = 0;
    }

    renderShields() {
        const ctx = this.ctx;
        ctx.fillStyle = this.colors.shield;

        for (const shield of this.shields) {
            ctx.fillRect(shield.x, shield.y, shield.width, shield.height);
        }
    }

    renderParticles() {
        const ctx = this.ctx;

        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }

        ctx.globalAlpha = 1;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SpaceInvaders();
});
