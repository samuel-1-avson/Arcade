/**
 * Asteroids - Ultimate Edition
 * Features: Multiple game modes, power-ups, weapons, ships, achievements, story mode
 */
import { GameEngine, GameState } from '../../js/engine/GameEngine.js';
import { inputManager } from '../../js/engine/InputManager.js';
import { storageManager } from '../../js/engine/StorageManager.js';
import { random, randomInt } from '../../js/utils/math.js';
import GameBridge from '../../js/utils/GameBridge.js';

// Import all systems
import { AchievementSystem, ACHIEVEMENTS } from './AchievementSystem.js';
import { StoryMode, STORY_WORLDS } from './StoryMode.js';
import { GameModeManager, GAME_MODES } from './GameModes.js';
import { PowerUpSystem, POWER_UPS } from './PowerUpSystem.js';
import { WeaponSystem, WEAPONS } from './WeaponSystem.js';
import { ShipSystem, SHIPS } from './ShipSystem.js';
import { EnemySystem, ASTEROID_TYPES, UFO_TYPES, BOSS_TYPES } from './EnemySystem.js';
import { ICONS } from './AsteroidsIcons.js';

// Configuration
const CONFIG = {
    shipSize: 20,
    shipAcceleration: 200,
    shipFriction: 0.98,
    shipMaxSpeed: 400,
    shipRotationSpeed: 4,
    bulletSpeed: 500,
    bulletLifetime: 1.5,
    asteroidSpeed: { min: 30, max: 100 },
    asteroidSizes: { large: 40, medium: 20, small: 10 },
    asteroidPoints: { large: 20, medium: 50, small: 100 },
    startingAsteroids: 4,
    maxBullets: 10
};

class Asteroids extends GameEngine {
    constructor() {
        super({
            canvasId: 'game-canvas',
            gameId: 'asteroids',
            width: 800,
            height: 600
        });

        // Ship
        this.ship = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            vx: 0,
            vy: 0,
            angle: -Math.PI / 2,
            radius: CONFIG.shipSize / 2,
            invincible: false,
            invincibleTimer: 0,
            thrusting: false
        };

        // Game objects
        this.asteroids = [];
        this.bullets = [];
        this.particles = [];
        this.ufos = [];
        this.fragments = [];
        this.missiles = [];

        // Game state
        this.lives = 3;
        this.wave = 0;
        this.infiniteLives = false;
        this.scoreMultiplier = 1.0;
        this.ufoEnabled = true;
        this.powerUpsEnabled = true;
        this.asteroidSpeedMultiplier = 1.0;
        this.ambientMode = false;
        this.difficultyRamp = 1.0;

        // Stats tracking
        this.stats = {
            asteroidsDestroyed: 0,
            ufosDestroyed: 0,
            shotsFired: 0,
            shotsHit: 0,
            powerUpsCollected: 0,
            timeElapsed: 0,
            get accuracy() {
                return this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
            }
        };

        // UFO timing
        this.ufoTimer = 0;
        this.ufoInterval = 20;

        // Screen effects
        this.screenShakeAmount = 0;
        this.flashColor = null;
        this.flashTimer = 0;

        // Tractor beam (for boss)
        this.tractorBeamActive = false;
        this.tractorBeamSource = null;
        this.tractorBeamStrength = 0;

        // Initialize Systems
        this.achievements = new AchievementSystem(this);
        this.storyMode = new StoryMode(this);
        this.modeManager = new GameModeManager(this);
        this.powerUps = new PowerUpSystem(this);
        this.weapons = new WeaponSystem(this);
        this.shipSystem = new ShipSystem(this);
        this.enemies = new EnemySystem(this);

        // Current mode
        this.currentGameMode = 'classic';
        this.inStoryMode = false;
        this.storyLevelConfig = null;

        this.currentGameMode = 'classic';
        this.inStoryMode = false;
        this.storyLevelConfig = null;

        this.setupIcons();
        this.setupUI();
    }

    setupIcons() {
        // Populate static icons
        document.querySelectorAll('.icon-svg[data-icon]').forEach(el => {
            const iconKey = el.dataset.icon;
            if (ICONS[iconKey]) {
                el.innerHTML = ICONS[iconKey];
            }
        });
    }

    setupUI() {
        // Start button
        document.getElementById('start-btn')?.addEventListener('click', () => {
            this.reset();
            this.start();
        });

        // Back to hub button
        document.getElementById('asteroids-back-btn')?.addEventListener('click', () => {
            if (window.GameBridge) window.GameBridge.exitGame();
            else window.location.href = '../../index.html';
        });

        document.getElementById('restart-btn')?.addEventListener('click', () => {
            this.reset();
            this.start();
        });

        document.getElementById('pause-btn')?.addEventListener('click', () => {
            this.togglePause();
        });

        // Sidebar panel buttons
        document.getElementById('change-ship-btn')?.addEventListener('click', () => {
            this.shipSystem.openShipMenu();
        });

        document.getElementById('change-weapon-btn')?.addEventListener('click', () => {
            this.weapons.openWeaponMenu();
        });

        // Mode list buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleModeChange(btn.dataset.mode);
            });
        });

        document.getElementById('view-achievements-btn')?.addEventListener('click', () => {
            this.achievements.openGallery();
        });

        document.getElementById('story-menu-btn')?.addEventListener('click', () => {
            this.storyMode.openStoryMenu();
        });

        // Create additional UI buttons
        this.createMenuButtons();

        // Touch controls
        this.setupTouchControls();

        // Initial sidebar update
        this.updateSidebar();
    }

    updateSidebar() {
        // Update ship info
        const currentShip = this.shipSystem.getCurrentShip();
        const shipIcon = document.querySelector('.ship-panel .ship-icon');
        const shipName = document.querySelector('.ship-panel .ship-name');
        if (shipIcon && currentShip) {
            shipIcon.innerHTML = currentShip.icon || ICONS.SHIP;
        }
        if (shipName && currentShip) {
            shipName.textContent = currentShip.name || 'Classic';
        }

        // Update weapon info
        const currentWeapon = this.weapons.getCurrentWeapon();
        const weaponIcon = document.querySelector('.weapon-panel .weapon-icon');
        const weaponName = document.querySelector('.weapon-panel .weapon-name');
        if (weaponIcon && currentWeapon) {
            weaponIcon.innerHTML = currentWeapon.icon || ICONS.WEAPON;
        }
        if (weaponName && currentWeapon) {
            weaponName.textContent = currentWeapon.name || 'Pulse Cannon';
        }

        // Update missile count
        const missileCount = document.getElementById('missile-count');
        if (missileCount) {
            missileCount.textContent = this.powerUps.getMissileCount() || 0;
        }

        // Update achievements progress
        const achieveUnlocked = document.getElementById('achievements-unlocked');
        const achieveBar = document.getElementById('achievements-bar');
        if (achieveUnlocked && this.achievements) {
            const unlocked = this.achievements.getUnlockedCount();
            const total = this.achievements.getTotalCount();
            achieveUnlocked.textContent = unlocked;
            if (achieveBar) {
                achieveBar.style.width = `${(unlocked / total) * 100}%`;
            }
        }

        // Update story progress
        const storyCompleted = document.getElementById('story-completed');
        const storyBar = document.getElementById('story-bar');
        if (storyCompleted && this.storyMode) {
            const progress = this.storyMode.getTotalProgress();
            storyCompleted.textContent = progress.completed;
            if (storyBar) {
                storyBar.style.width = `${progress.percentage}%`;
            }
        }

        // Update player level
        const levelBadge = document.getElementById('player-level');
        const currentXP = document.getElementById('current-xp');
        const xpBar = document.getElementById('xp-bar');
        if (levelBadge && this.achievements) {
            levelBadge.textContent = this.achievements.getLevel();
            if (currentXP) {
                currentXP.textContent = this.achievements.getXP();
            }
            if (xpBar) {
                xpBar.style.width = `${this.achievements.getXPProgress()}%`;
            }
        }

        // Update mode display
        document.querySelectorAll('.mode-btn').forEach(btn => {
            const isActive = btn.dataset.mode === this.currentGameMode;
            btn.classList.toggle('active', isActive);
        });
    }

    handleModeChange(modeId) {
        // Special handling for modes with options
        if (modeId === 'time_attack') {
            this.modeManager.showTimeAttackOptions();
            return;
        } 
        if (modeId === 'story') {
            this.storyMode.openStoryMenu();
            return;
        }
        if (modeId === 'challenge') {
            this.modeManager.showChallengeMenu();
            return;
        }

        // Standard mode switch
        if (this.currentGameMode !== modeId) {
            this.currentGameMode = modeId;
            this.modeManager.setMode(modeId);
            this.reset();
            this.start();
            this.updateSidebar();
        }
    }

    updateSidebarStats() {
        // Update session stats
        const accuracyStat = document.getElementById('accuracy-stat');
        const destroyedStat = document.getElementById('destroyed-stat');
        const ufosStat = document.getElementById('ufos-stat');
        const timeStat = document.getElementById('time-stat');

        if (accuracyStat) accuracyStat.textContent = `${this.stats.accuracy}%`;
        if (destroyedStat) destroyedStat.textContent = this.stats.asteroidsDestroyed;
        if (ufosStat) ufosStat.textContent = this.stats.ufosDestroyed;
        if (timeStat) {
            const mins = Math.floor(this.stats.timeElapsed / 60);
            const secs = Math.floor(this.stats.timeElapsed % 60);
            timeStat.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }

    updateSidebarPowerups() {
        const powerupsList = document.getElementById('sidebar-powerups');
        if (!powerupsList) return;

        const activeEffects = Object.entries(this.powerUps.activeEffects);
        
        if (activeEffects.length === 0) {
            powerupsList.innerHTML = '<div class="no-powerups">None active</div>';
            return;
        }

        powerupsList.innerHTML = activeEffects.map(([id, effect]) => {
            const data = effect.data || {};
            const timeStr = effect.duration > 0 ? `${Math.ceil(effect.duration)}s` : 
                           (effect.charges ? `×${effect.charges}` : 
                           (effect.uses ? `×${effect.uses}` : ''));
            return `
                <div class="sidebar-powerup" style="border-left: 3px solid ${data.color || '#00ffff'}">
                    <span class="pu-icon">${data.icon || ICONS.POWERUP}</span>
                    <span class="pu-name">${data.name || id}</span>
                    <span class="pu-time">${timeStr}</span>
                </div>
            `;
        }).join('');
    }

    createMenuButtons() {
        const headerRight = document.querySelector('.game-header-right');
        if (!headerRight) return;



        // Modes button
        const modesBtn = document.createElement('button');
        modesBtn.className = 'icon-btn';
        modesBtn.id = 'modes-btn';
        modesBtn.title = 'Game Modes';
        modesBtn.innerHTML = ICONS.MENU;
        modesBtn.onclick = () => this.showModeMenu();
        headerRight.insertBefore(modesBtn, headerRight.firstChild);
    }

    setupTouchControls() {
        let touchStartAngle = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left - rect.width / 2;
            const y = touch.clientY - rect.top - rect.height / 2;
            touchStartAngle = Math.atan2(y, x);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const y = touch.clientY - rect.top;
            this.ship.thrusting = y < rect.height / 2;
        });

        this.canvas.addEventListener('touchend', () => {
            this.ship.thrusting = false;
            if (this.state === GameState.PLAYING) {
                this.shoot();
            }
        });
    }

    showModeMenu() {
        this.modeManager.openModeMenu();
    }

    showStoryMenu() {
        this.storyMode.openStoryMenu();
    }

    // Story Mode Level Loading
    loadStoryLevel(config) { // Story Mode Level Loading
        this.inStoryMode = true;
        this.currentGameMode = 'story';
        this.storyLevelConfig = config;
        
        // Apply world theme
        this.enemies.setWorldConfig(config.worldId);
        
        // Reset for new level
        this.asteroids = [];
        this.bullets = [];
        this.ufos = [];
        this.particles = [];
        
        // Spawn initial asteroids
        for (let i = 0; i < config.asteroidCount; i++) {
            const asteroid = this.enemies.createAsteroid('large', null, null);
            // Ensure spawn away from ship
            do {
                asteroid.x = random(0, this.canvas.width);
                asteroid.y = random(0, this.canvas.height);
            } while (Math.hypot(asteroid.x - this.ship.x, asteroid.y - this.ship.y) < 150);
            
            // Apply config speed
            asteroid.vx *= config.asteroidSpeed;
            asteroid.vy *= config.asteroidSpeed;
            this.asteroids.push(asteroid);
        }
        
        // UFO settings
        this.ufoEnabled = config.ufoEnabled;
        this.ufoInterval = config.ufoInterval;
        
        // Boss level
        if (config.isBossLevel) {
            setTimeout(() => {
                this.spawnBoss(config.boss.type);
            }, 3000);
        }
        
        this.start();
    }

    start() {
        super.start();
        const overlay = document.getElementById('game-overlay');
        if (overlay) overlay.style.display = 'none';
        
        const timer = document.getElementById('time-attack-timer');
        if (timer) timer.style.display = 'none';
    }

    reset() {
        // Reset ship
        this.ship.x = this.canvas.width / 2;
        this.ship.y = this.canvas.height / 2;
        this.ship.vx = 0;
        this.ship.vy = 0;
        this.ship.angle = -Math.PI / 2;
        this.ship.invincible = true;
        this.ship.invincibleTimer = 3;

        // Reset game objects
        this.asteroids = [];
        this.bullets = [];
        this.particles = [];
        this.ufos = [];
        this.fragments = [];
        this.missiles = [];
        
        // Reset stats
        this.stats.asteroidsDestroyed = 0;
        this.stats.ufosDestroyed = 0;
        this.stats.shotsFired = 0;
        this.stats.shotsHit = 0;
        this.stats.powerUpsCollected = 0;
        this.stats.timeElapsed = 0;

        // Apply ship stats
        const shipStats = this.shipSystem.getEffectiveStats();
        this.lives = shipStats.hp;
        this.wave = 0;

        // Reset systems
        this.powerUps.reset();
        this.weapons.reset();
        this.shipSystem.reset();
        this.enemies.reset();

        this.nextWave();
        this.updateLivesDisplay();
        this.render();
    }

    onStart() {
        this._hideOverlay();
    }

    nextWave() {
        this.wave++;
        let asteroidCount = CONFIG.startingAsteroids + this.wave - 1;
        
        // Difficulty ramping for survival mode
        if (this.difficultyRamp > 1) {
            asteroidCount = Math.floor(asteroidCount * Math.pow(this.difficultyRamp, (this.wave - 1) * 0.1));
        }

        for (let i = 0; i < asteroidCount; i++) {
            this.spawnAsteroid('large');
        }

        // Achievement checks
        if (this.wave === 5) this.achievements.tryUnlock('wave_5');
        if (this.wave === 10) this.achievements.tryUnlock('wave_10');
        if (this.wave === 20) this.achievements.tryUnlock('wave_20');
    }

    spawnAsteroid(size, x = null, y = null, type = null) {
        if (x === null) {
            do {
                x = random(0, this.canvas.width);
                y = random(0, this.canvas.height);
            } while (Math.hypot(x - this.ship.x, y - this.ship.y) < 150);
        }

        const asteroid = this.enemies.createAsteroid(size, x, y, type);
        this.asteroids.push(asteroid);
    }

    update(dt) {
        // Update stats
        this.stats.timeElapsed += dt;

        // Handle input
        this.handleInput(dt);

        // Update ship
        this.updateShip(dt);

        // Update bullets
        this.updateBullets(dt);

        // Update asteroids
        this.updateAsteroids(dt);

        // Update UFOs
        this.updateUFOs(dt);

        // Update missiles
        this.updateMissiles(dt);

        // Update particles
        this.updateParticles(dt);

        // Update fragments
        this.updateFragments(dt);

        // Update systems
        this.powerUps.update(dt);
        this.weapons.update(dt);
        this.shipSystem.update(dt);
        this.modeManager.update(dt);
        
        // Update boss
        if (this.enemies.bossActive) {
            this.enemies.updateBoss(dt);
        }
        
        // Story mode boss update
        if (this.inStoryMode && this.storyMode.bossActive) {
            this.storyMode.updateBoss(dt);
        }

        // Check collisions
        this.checkCollisions();

        // Collect power-ups
        if (this.powerUpsEnabled) {
            this.powerUps.checkCollision(this.ship.x, this.ship.y, this.ship.radius);
        }

        // Black hole effect
        this.powerUps.updateBlackHole(this.asteroids, dt);

        // Tractor beam effect
        if (this.tractorBeamActive) {
            this.applyTractorBeam(dt);
        }

        // Check wave complete
        if (this.asteroids.length === 0 && this.ufos.length === 0 && !this.enemies.bossActive) {
            if (this.inStoryMode) {
                this.storyMode.completeLevel();
            } else {
                this.nextWave();
            }
        }

        // Screen effects decay
        this.screenShakeAmount *= 0.9;
        if (this.flashTimer > 0) this.flashTimer -= dt;

        // Achievement time checks
        const mins = Math.floor(this.stats.timeElapsed / 60);
        if (mins >= 3) this.achievements.tryUnlock('survivor_3');
        if (mins >= 5) this.achievements.tryUnlock('survivor_5');
        if (mins >= 10) this.achievements.tryUnlock('survivor_10');

        // Update daily/weekly progress
        this.achievements.updateDailyProgress('survival', dt / 60);
        this.achievements.updateWeeklyProgress('cumulative_time', dt / 60);

        // Update sidebar UI (throttled to once per second)
        this.sidebarUpdateTimer = (this.sidebarUpdateTimer || 0) + dt;
        if (this.sidebarUpdateTimer >= 0.5) {
            this.sidebarUpdateTimer = 0;
            this.updateSidebarStats();
            this.updateSidebarPowerups();
        }
    }

    handleInput(dt) {
        // Rotation
        if (inputManager.isKeyDown('ArrowLeft') || inputManager.isKeyDown('KeyA')) {
            this.ship.angle -= CONFIG.shipRotationSpeed * dt;
        }
        if (inputManager.isKeyDown('ArrowRight') || inputManager.isKeyDown('KeyD')) {
            this.ship.angle += CONFIG.shipRotationSpeed * dt;
        }

        // Thrust
        this.ship.thrusting = inputManager.isKeyDown('ArrowUp') || inputManager.isKeyDown('KeyW');

        // Shoot
        if (inputManager.isKeyDown('Space')) {
            this.shoot();
        }
        if (inputManager.isKeyJustReleased('Space')) {
            this.weapons.stopFiring();
        }

        // Secondary weapon
        if (inputManager.isKeyJustPressed('KeyE')) {
            this.fireSecondary();
        }

        // Phase ability
        if (inputManager.isKeyJustPressed('ShiftLeft') || inputManager.isKeyJustPressed('ShiftRight')) {
            this.shipSystem.activatePhase();
        }

        // Hyperspace (random teleport)
        if (inputManager.isKeyJustPressed('KeyH')) {
            this.hyperspace();
        }
    }

    updateShip(dt) {
        const shipStats = this.shipSystem.getEffectiveStats();
        const speedMult = this.powerUps.getSpeedMultiplier();

        // Thrust
        if (this.ship.thrusting) {
            const acceleration = (shipStats.acceleration || CONFIG.shipAcceleration) * speedMult;
            this.ship.vx += Math.cos(this.ship.angle) * acceleration * dt;
            this.ship.vy += Math.sin(this.ship.angle) * acceleration * dt;

            // Spawn thrust particles
            if (Math.random() < 0.5) {
                const backAngle = this.ship.angle + Math.PI;
                this.particles.push({
                    x: this.ship.x + Math.cos(backAngle) * 15,
                    y: this.ship.y + Math.sin(backAngle) * 15,
                    vx: Math.cos(backAngle) * random(50, 100) + this.ship.vx * 0.5,
                    vy: Math.sin(backAngle) * random(50, 100) + this.ship.vy * 0.5,
                    life: 0.3,
                    maxLife: 0.3,
                    size: random(2, 4),
                    color: this.shipSystem.getCurrentShip().colors.thrust
                });
            }
        }

        // Friction
        const friction = shipStats.friction || CONFIG.shipFriction;
        this.ship.vx *= friction;
        this.ship.vy *= friction;

        // Clamp speed
        const maxSpeed = (shipStats.maxSpeed || CONFIG.shipMaxSpeed) * speedMult;
        const speed = Math.hypot(this.ship.vx, this.ship.vy);
        if (speed > maxSpeed) {
            this.ship.vx = (this.ship.vx / speed) * maxSpeed;
            this.ship.vy = (this.ship.vy / speed) * maxSpeed;
        }

        // Move
        this.ship.x += this.ship.vx * dt;
        this.ship.y += this.ship.vy * dt;

        // Screen wrap
        this.wrapPosition(this.ship);

        // Invincibility
        if (this.ship.invincible) {
            this.ship.invincibleTimer -= dt;
            if (this.ship.invincibleTimer <= 0) {
                this.ship.invincible = false;
            }
        }
    }

    shoot() {
        const bullets = this.weapons.tryFire(
            this.ship.x, 
            this.ship.y, 
            this.ship.angle,
            this.ship.vx,
            this.ship.vy
        );
        
        for (const bullet of bullets) {
            this.bullets.push(bullet);
            this.stats.shotsFired++;
        }
    }

    fireSecondary() {
        const missile = this.weapons.fireSecondary('homing_missiles', this.ship.x, this.ship.y, this.ship.angle);
        if (missile) {
            this.missiles.push(missile);
        }
    }

    hyperspace() {
        // Random teleport with risk
        this.ship.x = random(50, this.canvas.width - 50);
        this.ship.y = random(50, this.canvas.height - 50);
        this.ship.vx = 0;
        this.ship.vy = 0;
        
        // Small chance of death
        if (Math.random() < 0.1) {
            this.loseLife();
        } else {
            this.achievements.tryUnlock('hyperdrive');
        }
        
        // Visual effect
        this.flashScreen('#0088ff');
    }

    updateBullets(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];

            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;
            bullet.life -= dt;

            // Rail gun trail
            if (bullet.type === 'rail' && bullet.trail) {
                bullet.trail.push({ x: bullet.x, y: bullet.y });
                if (bullet.trail.length > 20) bullet.trail.shift();
            }

            // Remove bullets that leave the screen (no wrapping)
            const outOfBounds = bullet.x < -10 || bullet.x > this.canvas.width + 10 ||
                               bullet.y < -10 || bullet.y > this.canvas.height + 10;

            if (bullet.life <= 0 || outOfBounds) {
                this.bullets.splice(i, 1);
            }
        }
    }

    updateAsteroids(dt) {
        const speedMult = this.powerUps.getAsteroidSpeedMultiplier() * this.asteroidSpeedMultiplier;
        
        for (const asteroid of this.asteroids) {
            if (speedMult > 0) {
                this.enemies.updateAsteroid(asteroid, dt * speedMult);
            }
            this.wrapPosition(asteroid);

            // Update stun
            if (asteroid.stunned) {
                asteroid.stunTimer -= dt;
                if (asteroid.stunTimer <= 0) asteroid.stunned = false;
            }
        }
    }

    updateUFOs(dt) {
        if (!this.ufoEnabled) return;

        // Spawn UFO
        this.ufoTimer += dt;
        if (this.ufoTimer >= this.ufoInterval && this.ufos.length === 0) {
            this.ufoTimer = 0;
            this.spawnUFO();
        }

        // Update UFOs
        for (let i = this.ufos.length - 1; i >= 0; i--) {
            const ufo = this.ufos[i];
            this.enemies.updateUFO(ufo, dt);

            // Remove if off screen
            if (ufo.x < -50 || ufo.x > this.canvas.width + 50) {
                this.ufos.splice(i, 1);
            }
        }
    }

    updateMissiles(dt) {
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const missile = this.missiles[i];
            this.weapons.updateMissile(missile, dt, this.asteroids, this.ufos);

            if (missile.life <= 0) {
                this.missiles.splice(i, 1);
                continue;
            }

            // Check collision with asteroids
            for (let ai = this.asteroids.length - 1; ai >= 0; ai--) {
                const asteroid = this.asteroids[ai];
                if (Math.hypot(missile.x - asteroid.x, missile.y - asteroid.y) < asteroid.radius) {
                    this.destroyAsteroid(ai);
                    this.missiles.splice(i, 1);
                    break;
                }
            }
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

    updateFragments(dt) {
        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const f = this.fragments[i];
            f.x += f.vx * dt;
            f.y += f.vy * dt;
            f.life -= dt;

            if (f.life <= 0) {
                this.fragments.splice(i, 1);
            }
        }
    }

    spawnUFO(type = null) {
        const ufo = this.enemies.createUFO(type);
        this.ufos.push(ufo);
    }

    spawnUFOWave(count, surround = false) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const ufo = this.enemies.createUFO();
                if (surround) {
                    // Position around player
                    const angle = (i / count) * Math.PI * 2;
                    const dist = 300;
                    ufo.x = this.ship.x + Math.cos(angle) * dist;
                    ufo.y = this.ship.y + Math.sin(angle) * dist;
                }
                this.ufos.push(ufo);
            }, i * 500);
        }
    }

    startAsteroidStorm(count) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.spawnAsteroid('medium');
            }, i * 200);
        }
    }

    spawnMiniboss() {
        // Create a large, tough asteroid
        const miniboss = this.enemies.createAsteroid('large', null, null, 'metal');
        miniboss.radius *= 1.5;
        miniboss.hp *= 3;
        miniboss.points *= 5;
        this.asteroids.push(miniboss);
    }

    spawnBoss(bossType) {
        this.enemies.spawnBoss(bossType);
    }

    startSpecialEvent(eventType) {
        this.showMessage(`Event: ${eventType.toUpperCase()}`, '#ffff00');
        // Events handled by story mode
    }

    spawnMine(x, y) {
        // Add mine to game
        this.weapons.deployMine(x, y, {
            triggerRadius: 60,
            explosionRadius: 80,
            lifetime: 15,
            damage: 3,
            size: 10,
            color: '#ffff00'
        });
    }

    spawnWarpEffect(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 0.5,
                maxLife: 0.5,
                size: 5,
                color: '#aa00ff'
            });
        }
    }

    applyTractorBeam(dt) {
        if (!this.tractorBeamSource) return;
        
        const dx = this.tractorBeamSource.x - this.ship.x;
        const dy = this.tractorBeamSource.y - this.ship.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 0) {
            this.ship.vx += (dx / dist) * this.tractorBeamStrength * dt;
            this.ship.vy += (dy / dist) * this.tractorBeamStrength * dt;
        }
    }

    checkCollisions() {
        // Bullets vs asteroids
        for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
            const bullet = this.bullets[bi];
            if (bullet.isEnemy) continue;

            for (let ai = this.asteroids.length - 1; ai >= 0; ai--) {
                const asteroid = this.asteroids[ai];

                if (Math.hypot(bullet.x - asteroid.x, bullet.y - asteroid.y) < asteroid.radius) {
                    this.stats.shotsHit++;
                    
                    // Damage asteroid
                    asteroid.hp -= bullet.damage || 1;
                    
                    if (asteroid.hp <= 0) {
                        this.destroyAsteroid(ai);
                    }
                    
                    if (!bullet.piercing) {
                        this.bullets.splice(bi, 1);
                    }
                    
                    if (!bullet.piercing) break;
                }
            }
        }

        // Bullets vs UFOs
        for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
            const bullet = this.bullets[bi];
            if (bullet.isEnemy) continue;

            for (let ui = this.ufos.length - 1; ui >= 0; ui--) {
                const ufo = this.ufos[ui];

                if (Math.hypot(bullet.x - ufo.x, bullet.y - ufo.y) < ufo.radius) {
                    this.stats.shotsHit++;
                    
                    if (this.enemies.damageUFO(ufo, bullet.damage || 1)) {
                        this.addScore(ufo.points);
                        this.spawnExplosion(ufo.x, ufo.y, ufo.typeData.color);
                        this.ufos.splice(ui, 1);
                        this.stats.ufosDestroyed++;
                        
                        // Achievement tracking
                        this.achievements.incrementProgress('ufos_destroyed', 1);
                        if (this.achievements.getProgress('ufos_destroyed') >= 10) {
                            this.achievements.tryUnlock('ufo_hunter');
                        }
                    }
                    
                    if (!bullet.piercing) {
                        this.bullets.splice(bi, 1);
                        break;
                    }
                }
            }
        }

        // Bullets vs boss
        if (this.enemies.bossActive) {
            for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
                const bullet = this.bullets[bi];
                if (bullet.isEnemy) continue;

                const boss = this.enemies.currentBoss;
                if (Math.hypot(bullet.x - boss.x, bullet.y - boss.y) < boss.size) {
                    this.enemies.damageBoss(bullet.damage || 1);
                    this.bullets.splice(bi, 1);
                }
            }
        }

        // Ship vs asteroids
        if (!this.ship.invincible && !this.shipSystem.isPhasing()) {
            for (const asteroid of this.asteroids) {
                if (Math.hypot(this.ship.x - asteroid.x, this.ship.y - asteroid.y) < asteroid.radius + this.ship.radius) {
                    // Close call achievement
                    const closeCallDist = asteroid.radius + this.ship.radius + 10;
                    if (Math.hypot(this.ship.x - asteroid.x, this.ship.y - asteroid.y) < closeCallDist) {
                        this.achievements.tryUnlock('close_call');
                    }
                    
                    // Check for shield power-up
                    if (this.powerUps.useShieldCharge()) {
                        this.flashScreen('#00aaff');
                        continue;
                    }
                    
                    this.loseLife();
                    return;
                }
            }

            // Ship vs UFO bullets
            for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
                const bullet = this.bullets[bi];
                if (!bullet.isEnemy) continue;

                if (Math.hypot(this.ship.x - bullet.x, this.ship.y - bullet.y) < this.ship.radius) {
                    this.bullets.splice(bi, 1);
                    
                    if (this.powerUps.useShieldCharge()) {
                        this.flashScreen('#00aaff');
                        continue;
                    }
                    
                    this.loseLife();
                    return;
                }
            }

            // Ship vs UFOs
            for (const ufo of this.ufos) {
                if (Math.hypot(this.ship.x - ufo.x, this.ship.y - ufo.y) < ufo.radius + this.ship.radius) {
                    if (this.powerUps.useShieldCharge()) {
                        this.flashScreen('#00aaff');
                        continue;
                    }
                    
                    this.loseLife();
                    return;
                }
            }
        }

        // Laser hit detection
        if (this.weapons.laserActive) {
            // Already handled in weapon system
        }
    }

    destroyAsteroid(index) {
        const asteroid = this.asteroids[index];
        this.asteroids.splice(index, 1);

        // Get points from enemy system
        const points = this.enemies.onAsteroidDestroyed(asteroid);
        const scoreMultiplier = this.powerUps.getScoreMultiplier() * this.scoreMultiplier;
        this.addScore(Math.floor(points * scoreMultiplier));
        
        this.spawnExplosion(asteroid.x, asteroid.y, asteroid.typeData.strokeColor);

        // Spawn power-up chance
        if (this.powerUpsEnabled) {
            this.powerUps.trySpawnFromAsteroid(asteroid.x, asteroid.y);
        }

        // Split into smaller asteroids
        if (asteroid.size === 'large') {
            this.spawnAsteroid('medium', asteroid.x, asteroid.y, asteroid.type);
            this.spawnAsteroid('medium', asteroid.x, asteroid.y, asteroid.type);
        } else if (asteroid.size === 'medium') {
            this.spawnAsteroid('small', asteroid.x, asteroid.y, asteroid.type);
            this.spawnAsteroid('small', asteroid.x, asteroid.y, asteroid.type);
        }

        // Stats & achievements
        this.stats.asteroidsDestroyed++;
        this.achievements.incrementProgress('asteroids_destroyed', 1);
        this.achievements.updateDailyProgress('asteroids', 1);
        this.achievements.updateWeeklyProgress('cumulative_asteroids', 1);
        
        const total = this.achievements.getProgress('asteroids_destroyed');
        if (total === 1) this.achievements.tryUnlock('first_kill');
        if (total >= 50) this.achievements.tryUnlock('asteroid_50');
        if (total >= 100) this.achievements.tryUnlock('asteroid_100');
        if (total >= 500) this.achievements.tryUnlock('asteroid_500');
        if (total >= 1000) this.achievements.tryUnlock('asteroid_1000');

        // Score achievements
        if (this.score >= 10000) this.achievements.tryUnlock('score_10k');
        if (this.score >= 50000) this.achievements.tryUnlock('score_50k');
    }

    clearAllAsteroids() {
        const count = this.asteroids.length;
        for (let i = count - 1; i >= 0; i--) {
            this.destroyAsteroid(i);
        }
        this.screenShake(20);
        this.flashScreen('#ff4400');
    }

    loseLife() {
        if (this.infiniteLives) {
            // Zen mode - just respawn
            this.respawnShip();
            return;
        }

        this.lives--;
        this.updateLivesDisplay();
        this.spawnExplosion(this.ship.x, this.ship.y, '#fff');

        if (this.lives <= 0) {
            // Submit score to Arcade Hub
            if (window.ArcadeHub && typeof this.score === 'number') {
                window.ArcadeHub.submitScore(this.score);
            }
            this.gameOver(false);
        } else {
            this.respawnShip();
            this.achievements.incrementProgress('deaths', 1);
            if (this.achievements.getProgress('deaths') >= 5) {
                this.achievements.tryUnlock('phoenix');
            }
        }
    }

    respawnShip() {
        this.ship.x = this.canvas.width / 2;
        this.ship.y = this.canvas.height / 2;
        this.ship.vx = 0;
        this.ship.vy = 0;
        this.ship.invincible = true;
        this.ship.invincibleTimer = 3;
    }

    spawnExplosion(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = random(0, Math.PI * 2);
            const speed = random(50, 150);
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: random(0.5, 1),
                maxLife: 1,
                size: random(2, 5),
                color
            });
        }
    }

    spawnBossExplosion(boss) {
        // Big explosion
        for (let i = 0; i < 50; i++) {
            const angle = random(0, Math.PI * 2);
            const speed = random(100, 300);
            this.particles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: random(1, 2),
                maxLife: 2,
                size: random(5, 15),
                color: boss.glowColor
            });
        }
        this.screenShake(30);
        this.flashScreen(boss.glowColor);
    }

    screenShake(amount) {
        this.screenShakeAmount = Math.max(this.screenShakeAmount, amount);
    }

    flashScreen(color) {
        this.flashColor = color;
        this.flashTimer = 0.1;
    }

    showMessage(text, color = '#ffffff') {
        const msg = document.createElement('div');
        msg.className = 'game-message';
        msg.textContent = text;
        msg.style.color = color;
        document.body.appendChild(msg);
        
        setTimeout(() => msg.classList.add('show'), 10);
        setTimeout(() => {
            msg.classList.remove('show');
            setTimeout(() => msg.remove(), 500);
        }, 2000);
    }

    wrapPosition(obj) {
        if (obj.x < 0) obj.x = this.canvas.width;
        if (obj.x > this.canvas.width) obj.x = 0;
        if (obj.y < 0) obj.y = this.canvas.height;
        if (obj.y > this.canvas.height) obj.y = 0;
    }

    updateLivesDisplay() {
        const el = document.querySelector('.lives-value');
        if (el) {
            if (this.infiniteLives) {
                el.textContent = '∞';
            } else {
                el.textContent = '▲'.repeat(Math.max(0, this.lives));
            }
        }
    }

    executeBossAttack(attackName, boss) {
        // Delegate to enemy system
    }

    render() {
        const ctx = this.ctx;

        // Apply screen shake
        ctx.save();
        if (this.screenShakeAmount > 0.5) {
            const shakeX = (Math.random() - 0.5) * this.screenShakeAmount;
            const shakeY = (Math.random() - 0.5) * this.screenShakeAmount;
            ctx.translate(shakeX, shakeY);
        }

        // Background
        if (this.ambientMode) {
            ctx.fillStyle = this.modeManager.getZenBackground();
        } else if (this.inStoryMode && this.storyLevelConfig) {
            ctx.fillStyle = this.storyLevelConfig.theme.bg;
        } else {
            ctx.fillStyle = '#000';
        }
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Stars
        this.renderStars();

        // Fragments
        this.renderFragments();

        // Particles
        this.renderParticles();

        // Power-ups
        if (this.powerUpsEnabled) {
            this.powerUps.render(ctx);
        }

        // Asteroids
        this.renderAsteroids();

        // UFOs
        this.renderUFOs();

        // Boss
        this.enemies.renderBoss(ctx);

        // Bullets
        this.renderBullets();

        // Missiles
        this.renderMissiles();

        // Weapons effects (laser, mines)
        this.weapons.render(ctx);

        // Ship
        if (!this.ship.invincible || Math.floor(this.elapsedTime * 10) % 2 === 0) {
            this.shipSystem.render(ctx, this.ship.x, this.ship.y, this.ship.angle, this.ship.thrusting);
        }

        // Phase effect
        if (this.shipSystem.isPhasing()) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = '#aaaaff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.ship.x, this.ship.y, this.ship.radius + 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Tractor beam
        if (this.tractorBeamActive && this.tractorBeamSource) {
            ctx.save();
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(this.tractorBeamSource.x, this.tractorBeamSource.y);
            ctx.lineTo(this.ship.x, this.ship.y);
            ctx.stroke();
            ctx.restore();
        }

        // Screen flash
        if (this.flashTimer > 0 && this.flashColor) {
            ctx.fillStyle = this.flashColor;
            ctx.globalAlpha = this.flashTimer * 5;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    renderStars() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 100; i++) {
            const x = (i * 73) % this.canvas.width;
            const y = (i * 47) % this.canvas.height;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    renderFragments() {
        const ctx = this.ctx;
        for (const f of this.fragments) {
            ctx.fillStyle = f.color;
            ctx.globalAlpha = f.life / 2;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
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

    renderAsteroids() {
        const ctx = this.ctx;
        for (const asteroid of this.asteroids) {
            this.enemies.renderAsteroid(ctx, asteroid);
        }
    }

    renderUFOs() {
        const ctx = this.ctx;
        for (const ufo of this.ufos) {
            this.enemies.renderUFO(ctx, ufo);
        }
    }

    renderBullets() {
        const ctx = this.ctx;
        for (const bullet of this.bullets) {
            // Rail gun trail
            if (bullet.type === 'rail' && bullet.trail) {
                ctx.strokeStyle = bullet.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                for (let i = 0; i < bullet.trail.length; i++) {
                    const t = bullet.trail[i];
                    if (i === 0) ctx.moveTo(t.x, t.y);
                    else ctx.lineTo(t.x, t.y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // Bullet glow for special types
            if (bullet.type === 'plasma' || bullet.type === 'nova') {
                const gradient = ctx.createRadialGradient(bullet.x, bullet.y, 0, bullet.x, bullet.y, bullet.size * 2);
                gradient.addColorStop(0, bullet.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, bullet.size * 2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = bullet.color || (bullet.isEnemy ? '#ff0000' : '#fff');
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.size || 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderMissiles() {
        const ctx = this.ctx;
        for (const missile of this.missiles) {
            ctx.save();
            ctx.translate(missile.x, missile.y);
            ctx.rotate(missile.angle);

            // Missile body
            ctx.fillStyle = missile.color;
            ctx.beginPath();
            ctx.moveTo(missile.size, 0);
            ctx.lineTo(-missile.size, -missile.size / 2);
            ctx.lineTo(-missile.size / 2, 0);
            ctx.lineTo(-missile.size, missile.size / 2);
            ctx.closePath();
            ctx.fill();

            // Trail
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(-missile.size, 0, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Asteroids();
});
