/**
 * Platformer - Classic side-scrolling platform game
 */
import { GameEngine, GameState } from '../../js/engine/GameEngine.js';
import { inputManager } from '../../js/engine/InputManager.js';
import { storageManager } from '../../js/engine/StorageManager.js';
import { soundEffects } from '../../js/engine/SoundEffects.js';
import { random, clamp } from '../../js/utils/math.js';

// Physics constants
const GRAVITY = 1500;
const JUMP_VELOCITY = -500;
const MOVE_SPEED = 200;
const MAX_FALL_SPEED = 600;

// Tile size
const TILE = 32;

// Tile types
const T = {
    EMPTY: 0,
    GROUND: 1,
    PLATFORM: 2,
    SPIKE: 3,
    COIN: 4,
    SPRING: 5,
    FLAG: 6,
    ENEMY: 7
};

// Level data
const LEVELS = [
    // Level 1 - Tutorial
    {
        width: 25,
        height: 12,
        spawn: { x: 2, y: 9 },
        tiles: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,4,4,0,0,0,0,0,6,0,0],
            [0,0,0,0,4,0,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,2,2,2,0],
            [0,0,0,2,2,2,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ]
    },
    // Level 2 - Spikes
    {
        width: 30,
        height: 12,
        spawn: { x: 2, y: 9 },
        tiles: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,6,0],
            [0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,4,4,4,0,0,0,0,0,0,0,0,2,2,2,0],
            [0,0,0,0,0,0,0,2,2,2,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0],
            [0,0,2,2,2,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,3,3,3,3,1,1,1,1,1,1,1,1,3,3,3,1,1,1,3,3,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ]
    },
    // Level 3 - Enemies
    {
        width: 35,
        height: 12,
        spawn: { x: 2, y: 9 },
        tiles: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,0],
            [0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,4,4,4,0,0,0,0,0,0,0,0],
            [0,0,0,2,2,2,0,0,0,0,7,0,0,0,0,2,2,2,2,0,0,0,0,2,2,2,2,2,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ]
    }
];

class Platformer extends GameEngine {
    constructor() {
        super({
            canvasId: 'game-canvas',
            gameId: 'platformer',
            width: 800,
            height: 400
        });

        // Player
        this.player = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            width: 24,
            height: 32,
            onGround: false,
            facingRight: true
        };

        // Game state
        this.level = 0;
        this.coins = 0;
        this.totalCoins = 0;
        this.lives = 3;
        this.levelTiles = [];
        this.collectibles = [];
        this.enemies = [];
        this.particles = [];

        // Camera
        this.camera = { x: 0, y: 0 };

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
        let touchLeft = false, touchRight = false;
        
        this.canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;

            if (x < rect.width / 3) {
                touchLeft = true;
            } else if (x > rect.width * 2 / 3) {
                touchRight = true;
            } else {
                this.jump();
            }
        });

        this.canvas.addEventListener('touchend', () => {
            touchLeft = false;
            touchRight = false;
        });

        // Make touch state available
        this.touchState = { get left() { return touchLeft; }, get right() { return touchRight; } };
    }

    loadLevel(levelIndex) {
        if (levelIndex >= LEVELS.length) {
            // Won all levels!
            this.gameOver(true);
            return;
        }

        this.level = levelIndex;
        const level = LEVELS[levelIndex];

        // Reset player position
        this.player.x = level.spawn.x * TILE;
        this.player.y = level.spawn.y * TILE;
        this.player.vx = 0;
        this.player.vy = 0;

        // Parse tiles
        this.levelTiles = [];
        this.collectibles = [];
        this.enemies = [];

        for (let y = 0; y < level.height; y++) {
            this.levelTiles[y] = [];
            for (let x = 0; x < level.width; x++) {
                const tile = level.tiles[y][x];
                this.levelTiles[y][x] = tile;

                if (tile === T.COIN) {
                    this.collectibles.push({ type: 'coin', x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, collected: false });
                    this.levelTiles[y][x] = T.EMPTY;
                } else if (tile === T.FLAG) {
                    this.collectibles.push({ type: 'flag', x: x * TILE + TILE / 2, y: y * TILE });
                    this.levelTiles[y][x] = T.EMPTY;
                } else if (tile === T.ENEMY) {
                    this.enemies.push({
                        x: x * TILE + TILE / 2,
                        y: y * TILE + TILE / 2,
                        vx: 50,
                        width: 28,
                        height: 28,
                        startX: x * TILE,
                        endX: (x + 3) * TILE
                    });
                    this.levelTiles[y][x] = T.EMPTY;
                }
            }
        }

        this.updateLevelDisplay();
    }

    onReset() {
        this.coins = 0;
        this.totalCoins = 0;
        this.lives = 3;
        this.particles = [];

        this.loadLevel(0);
        this.updateCoinsDisplay();
        this.updateLivesDisplay();
        this.render();
    }

    onStart() {
        this._hideOverlay();
    }

    jump() {
        if (this.player.onGround) {
            this.player.vy = JUMP_VELOCITY;
            this.player.onGround = false;
            soundEffects.jump();
        }
    }

    update(dt) {
        // Handle input
        this.handleInput(dt);

        // Update player physics
        this.updatePlayer(dt);

        // Update enemies
        this.updateEnemies(dt);

        // Update camera
        this.updateCamera();

        // Check collectibles
        this.checkCollectibles();

        // Update particles
        this.updateParticles(dt);
    }

    handleInput(dt) {
        this.player.vx = 0;

        if (inputManager.isKeyDown('ArrowLeft') || inputManager.isKeyDown('KeyA') || this.touchState.left) {
            this.player.vx = -MOVE_SPEED;
            this.player.facingRight = false;
        }
        if (inputManager.isKeyDown('ArrowRight') || inputManager.isKeyDown('KeyD') || this.touchState.right) {
            this.player.vx = MOVE_SPEED;
            this.player.facingRight = true;
        }
        if (inputManager.isKeyJustPressed('Space') || inputManager.isKeyJustPressed('ArrowUp') || inputManager.isKeyJustPressed('KeyW')) {
            this.jump();
        }
    }

    updatePlayer(dt) {
        // Apply gravity
        this.player.vy += GRAVITY * dt;
        this.player.vy = Math.min(this.player.vy, MAX_FALL_SPEED);

        // Move horizontally
        this.player.x += this.player.vx * dt;
        this.resolveCollisionX();

        // Move vertically
        this.player.y += this.player.vy * dt;
        this.resolveCollisionY();

        // Check death by falling
        const level = LEVELS[this.level];
        if (this.player.y > level.height * TILE + 100) {
            this.die();
        }
    }

    resolveCollisionX() {
        const player = this.player;
        const left = Math.floor(player.x / TILE);
        const right = Math.floor((player.x + player.width) / TILE);
        const top = Math.floor(player.y / TILE);
        const bottom = Math.floor((player.y + player.height - 1) / TILE);

        for (let y = top; y <= bottom; y++) {
            for (let x = left; x <= right; x++) {
                const tile = this.getTile(x, y);

                if (tile === T.GROUND) {
                    if (player.vx > 0) {
                        player.x = x * TILE - player.width;
                    } else if (player.vx < 0) {
                        player.x = (x + 1) * TILE;
                    }
                } else if (tile === T.SPIKE) {
                    this.die();
                }
            }
        }
    }

    resolveCollisionY() {
        const player = this.player;
        const left = Math.floor(player.x / TILE);
        const right = Math.floor((player.x + player.width - 1) / TILE);
        const top = Math.floor(player.y / TILE);
        const bottom = Math.floor((player.y + player.height) / TILE);

        player.onGround = false;

        for (let y = top; y <= bottom; y++) {
            for (let x = left; x <= right; x++) {
                const tile = this.getTile(x, y);

                if (tile === T.GROUND || tile === T.PLATFORM) {
                    if (player.vy > 0) {
                        // Landing
                        if (tile === T.PLATFORM) {
                            // Only land on platforms from above
                            const prevBottom = (player.y - player.vy * 0.016 + player.height);
                            if (prevBottom <= y * TILE) {
                                player.y = y * TILE - player.height;
                                player.vy = 0;
                                player.onGround = true;
                            }
                        } else {
                            player.y = y * TILE - player.height;
                            player.vy = 0;
                            player.onGround = true;
                        }
                    } else if (player.vy < 0 && tile === T.GROUND) {
                        player.y = (y + 1) * TILE;
                        player.vy = 0;
                    }
                } else if (tile === T.SPRING && player.vy > 0) {
                    player.vy = JUMP_VELOCITY * 1.5;
                    soundEffects.powerUp();
                } else if (tile === T.SPIKE) {
                    this.die();
                }
            }
        }
    }

    getTile(x, y) {
        if (y < 0 || y >= this.levelTiles.length) return T.EMPTY;
        if (x < 0 || x >= this.levelTiles[0].length) return T.EMPTY;
        return this.levelTiles[y][x];
    }

    updateEnemies(dt) {
        for (const enemy of this.enemies) {
            enemy.x += enemy.vx * dt;

            // Bounce at bounds
            if (enemy.x < enemy.startX || enemy.x > enemy.endX) {
                enemy.vx *= -1;
            }

            // Check collision with player
            const player = this.player;
            if (this.checkAABB(
                player.x, player.y, player.width, player.height,
                enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height
            )) {
                // If player is above enemy and falling, kill enemy
                if (player.vy > 0 && player.y + player.height < enemy.y + 10) {
                    enemy.dead = true;
                    player.vy = JUMP_VELOCITY * 0.6;
                    this.addScore(100);
                    soundEffects.hit();
                    this.spawnParticles(enemy.x, enemy.y, '#ff0000');
                } else {
                    this.die();
                }
            }
        }

        // Remove dead enemies
        this.enemies = this.enemies.filter(e => !e.dead);
    }

    checkAABB(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    checkCollectibles() {
        const player = this.player;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        for (const item of this.collectibles) {
            if (item.collected) continue;

            const dist = Math.hypot(playerCenterX - item.x, playerCenterY - item.y);

            if (item.type === 'coin' && dist < 20) {
                item.collected = true;
                this.coins++;
                this.totalCoins++;
                this.addScore(10);
                this.updateCoinsDisplay();
                soundEffects.point();
                this.spawnParticles(item.x, item.y, '#ffd700');
            } else if (item.type === 'flag' && dist < 30) {
                this.completeLevel();
            }
        }
    }

    completeLevel() {
        soundEffects.levelUp();

        // Bonus for remaining lives
        this.addScore(this.lives * 100);

        // Next level
        setTimeout(() => {
            this.loadLevel(this.level + 1);
        }, 500);
    }

    die() {
        this.lives--;
        this.updateLivesDisplay();
        soundEffects.die();

        if (this.lives <= 0) {
            this.gameOver(false);
        } else {
            // Respawn
            const level = LEVELS[this.level];
            this.player.x = level.spawn.x * TILE;
            this.player.y = level.spawn.y * TILE;
            this.player.vx = 0;
            this.player.vy = 0;

            // Flash effect
            const wrapper = document.querySelector('.canvas-wrapper');
            wrapper?.classList.add('death-flash');
            setTimeout(() => wrapper?.classList.remove('death-flash'), 300);
        }
    }

    updateCamera() {
        const level = LEVELS[this.level];
        const levelWidth = level.width * TILE;

        // Follow player
        this.camera.x = this.player.x - this.canvas.width / 2 + this.player.width / 2;

        // Clamp to level bounds
        this.camera.x = clamp(this.camera.x, 0, Math.max(0, levelWidth - this.canvas.width));
    }

    spawnParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = random(0, Math.PI * 2);
            const speed = random(50, 150);
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 100,
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
            p.vy += GRAVITY * 0.5 * dt;
            p.life -= dt;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateCoinsDisplay() {
        const el = document.querySelector('.coins-value');
        if (el) el.textContent = `🪙 ${this.coins}`;
    }

    updateLivesDisplay() {
        const el = document.querySelector('.lives-value');
        if (el) el.textContent = '❤️'.repeat(Math.max(0, this.lives));
    }

    updateLevelDisplay() {
        const el = document.querySelector('.level-value');
        if (el) el.textContent = this.level + 1;
    }

    render() {
        const ctx = this.ctx;

        // Sky background
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a3e');
        gradient.addColorStop(1, '#0a0a1e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);

        // Draw tiles
        this.renderTiles();

        // Draw collectibles
        this.renderCollectibles();

        // Draw enemies
        this.renderEnemies();

        // Draw player
        this.renderPlayer();

        // Draw particles
        this.renderParticles();

        ctx.restore();
    }

    renderTiles() {
        const ctx = this.ctx;
        const startX = Math.floor(this.camera.x / TILE);
        const endX = Math.ceil((this.camera.x + this.canvas.width) / TILE);

        for (let y = 0; y < this.levelTiles.length; y++) {
            for (let x = startX; x <= endX; x++) {
                const tile = this.getTile(x, y);
                const px = x * TILE;
                const py = y * TILE;

                if (tile === T.GROUND) {
                    ctx.fillStyle = '#4a6741';
                    ctx.fillRect(px, py, TILE, TILE);
                    ctx.fillStyle = '#5a7751';
                    ctx.fillRect(px + 2, py + 2, TILE - 4, 4);
                } else if (tile === T.PLATFORM) {
                    ctx.fillStyle = '#8b6914';
                    ctx.fillRect(px, py, TILE, 8);
                } else if (tile === T.SPIKE) {
                    ctx.fillStyle = '#ff4444';
                    ctx.beginPath();
                    ctx.moveTo(px + TILE / 2, py);
                    ctx.lineTo(px + TILE, py + TILE);
                    ctx.lineTo(px, py + TILE);
                    ctx.closePath();
                    ctx.fill();
                } else if (tile === T.SPRING) {
                    ctx.fillStyle = '#ff8800';
                    ctx.fillRect(px + 4, py + TILE - 12, TILE - 8, 12);
                    ctx.fillStyle = '#ffaa00';
                    ctx.fillRect(px + 8, py + TILE - 20, TILE - 16, 8);
                }
            }
        }
    }

    renderCollectibles() {
        const ctx = this.ctx;

        for (const item of this.collectibles) {
            if (item.collected) continue;

            if (item.type === 'coin') {
                const bounce = Math.sin(this.elapsedTime * 5) * 3;
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(item.x, item.y + bounce, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (item.type === 'flag') {
                // Pole
                ctx.fillStyle = '#888';
                ctx.fillRect(item.x - 2, item.y, 4, TILE * 2);

                // Flag
                ctx.fillStyle = '#00ff88';
                ctx.shadowColor = '#00ff88';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(item.x + 2, item.y);
                ctx.lineTo(item.x + 30, item.y + 15);
                ctx.lineTo(item.x + 2, item.y + 30);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }

    renderEnemies() {
        const ctx = this.ctx;

        for (const enemy of this.enemies) {
            ctx.fillStyle = '#ff4444';
            ctx.shadowColor = '#ff4444';
            ctx.shadowBlur = 8;

            // Body
            ctx.fillRect(
                enemy.x - enemy.width / 2,
                enemy.y - enemy.height / 2,
                enemy.width,
                enemy.height
            );

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.fillRect(enemy.x - 8, enemy.y - 8, 6, 6);
            ctx.fillRect(enemy.x + 2, enemy.y - 8, 6, 6);

            ctx.shadowBlur = 0;
        }
    }

    renderPlayer() {
        const ctx = this.ctx;
        const { x, y, width, height, facingRight } = this.player;

        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;

        // Body
        ctx.fillRect(x, y, width, height);

        // Eyes
        ctx.fillStyle = '#fff';
        const eyeX = facingRight ? x + width - 10 : x + 4;
        ctx.fillRect(eyeX, y + 8, 6, 6);

        ctx.shadowBlur = 0;
    }

    renderParticles() {
        const ctx = this.ctx;

        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Platformer();
});
