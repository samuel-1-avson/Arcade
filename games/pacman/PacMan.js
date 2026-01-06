import { GameEngine, GameState } from '../../js/engine/GameEngine.js';
import { inputManager } from '../../js/engine/InputManager.js';
import { storageManager } from '../../js/engine/StorageManager.js';
import { ICONS } from './Icons.js';

// Import enhancement systems
import { GAME_MODES, GameModeManager } from './GameModes.js';
import { MAPS, MapManager, TILE, MAZE_COLS, MAZE_ROWS } from './MapSystem.js';
import { POWER_UPS, PowerUpManager } from './PowerUpSystem.js';
import { ACHIEVEMENTS, AchievementSystem } from './AchievementSystem.js';
import { STORY_CHAPTERS, StoryModeManager } from './StoryMode.js';
import { EffectsSystem } from './EffectsSystem.js';
import { PacManMultiplayer } from './MultiplayerSystem.js';

// Grid configuration
const CELL_SIZE = 30;
const COLS = MAZE_COLS;
const ROWS = MAZE_ROWS;

// Direction vectors
const DIRS = {
    UP: { x: 0, y: -1, name: 'up' },
    DOWN: { x: 0, y: 1, name: 'down' },
    LEFT: { x: -1, y: 0, name: 'left' },
    RIGHT: { x: 1, y: 0, name: 'right' }
};

// Ghost modes
const GHOST_MODE = {
    SCATTER: 'scatter',
    CHASE: 'chase',
    FRIGHTENED: 'frightened',
    EATEN: 'eaten'
};

// Fruit types - Icons for UI, Colors/Shapes for Canvas
const FRUITS = [
    { type: 'cherry', icon: ICONS.CHERRY, points: 100, level: 1, color: '#ff0055' },
    { type: 'strawberry', icon: ICONS.STRAWBERRY, points: 300, level: 2, color: '#ff0055' },
    { type: 'orange', icon: ICONS.ORANGE, points: 500, level: 3, color: '#ffaa00' },
    { type: 'apple', icon: ICONS.APPLE, points: 700, level: 4, color: '#ff0055' },
    { type: 'melon', icon: ICONS.MELON, points: 1000, level: 5, color: '#00ff88' },
    { type: 'galaxian', icon: ICONS.GALAXIAN, points: 2000, level: 6, color: '#ffff00' },
    { type: 'bell', icon: ICONS.BELL, points: 3000, level: 7, color: '#ffff00' },
    { type: 'key', icon: ICONS.KEY, points: 5000, level: 8, color: '#00ffff' }
];

export class PacManEnhanced extends GameEngine {
    constructor() {
        super({
            canvasId: 'game-canvas',
            gameId: 'pacman',
            width: COLS * CELL_SIZE,
            height: ROWS * CELL_SIZE,
            pixelPerfect: true
        });

        // Initialize systems
        this.cellSize = CELL_SIZE; // Expose for other systems
        this.modeManager = new GameModeManager(this);
        this.mapManager = new MapManager(this);
        this.powerUpManager = new PowerUpManager(this);
        this.achievementSystem = new AchievementSystem(this);
        this.storyManager = new StoryModeManager(this);
        this.effectsSystem = new EffectsSystem(this);
        this.multiplayer = new PacManMultiplayer(this);

        this.grid = [];
        this.dotsRemaining = 0;
        this.totalDots = 0;

        this.pacman = { x: 14, y: 23, direction: DIRS.LEFT, nextDirection: DIRS.LEFT, mouthAngle: 0.2 };
        this.ghosts = [];
        this.ghostCount = 4;

        this.lives = 3;
        this.level = 1;
        this.powerMode = false;
        this.powerTimer = 0;
        this.powerDuration = 7;
        this.ghostsEaten = 0;
        this.ghostsEatenThisLevel = 0;
        this.deathsThisLevel = 0;
        this.levelStartTime = 0;

        this.pacmanSpeedMultiplier = 1.0;
        this.ghostSpeedMultiplier = 1.0;
        this.timeScale = 1.0;
        this.moveTimer = 0;
        this.basePacmanSpeed = 0.08;
        this.baseGhostSpeed = 0.10;
        this.modeTimer = 0;
        this.currentGhostMode = GHOST_MODE.SCATTER;

        this.powerUpsEnabled = true;
        this.ghostsFrozen = false;
        this.magnetActive = false;
        this.magnetRadius = 0;
        this.hasShield = false;
        this.scoreMultiplier = 1;
        this.chainActive = false;
        this.chainMultiplier = 1;
        this.superMode = false;
        this.visibilityRadius = 0;

        this.currentFruit = null;
        this.fruitTimer = 0;
        this.fruitsCollected = [];

        this.showingMainMenu = true;
        this.notifications = [];

        this.setupUI();
        this.showMainMenu();
    }

    parseMaze() {
        const { grid, dotsCount } = this.mapManager.parseLayout();
        this.dotsRemaining = dotsCount;
        this.totalDots = dotsCount;
        return grid;
    }

    createGhosts() {
        // Red, Pink, Cyan, Orange (Retro Neon)
        const colors = ['#ff0055', '#ff66b3', '#00ffff', '#ffaa00'];
        const names = ['blinky', 'pinky', 'inky', 'clyde'];
        const positions = [{ x: 14, y: 11 }, { x: 14, y: 14 }, { x: 12, y: 14 }, { x: 16, y: 14 }];
        const scatterTargets = [{ x: COLS - 3, y: 0 }, { x: 2, y: 0 }, { x: COLS - 1, y: ROWS - 1 }, { x: 0, y: ROWS - 1 }];

        this.ghosts = [];
        for (let i = 0; i < this.ghostCount; i++) {
            this.ghosts.push({
                name: names[i],
                x: positions[i].x,
                y: positions[i].y,
                color: colors[i],
                direction: DIRS.LEFT,
                mode: GHOST_MODE.SCATTER,
                targetX: scatterTargets[i].x,
                targetY: scatterTargets[i].y,
                scatterTarget: scatterTargets[i],
                moveTimer: 0,
                inHouse: i > 0,
                houseExitTimer: i * 3
            });
        }
    }

    setupUI() {
        // Inject Icons
        const backBtn = document.getElementById('pac-back-btn');
        if (backBtn) backBtn.innerHTML = `${ICONS.HOME} BACK`;

        const title = document.querySelector('.pac-nav-title');
        if (title) title.innerHTML = `${ICONS.PACMAN} PAC-MAN`;

        const menuBtn = document.getElementById('menu-btn'); if(menuBtn) menuBtn.innerHTML = ICONS.MENU;
        const pauseBtn = document.getElementById('pause-btn'); if(pauseBtn) pauseBtn.innerHTML = ICONS.PAUSE;
        const restartBtn = document.getElementById('restart-btn'); if(restartBtn) restartBtn.innerHTML = ICONS.RESTART;

        // Listeners
        document.getElementById('btn-classic')?.addEventListener('click', () => this.selectMode('classic'));
        document.getElementById('btn-story')?.addEventListener('click', () => this.showStoryMenu());
        document.getElementById('btn-modes')?.addEventListener('click', () => this.showModeSelect());
        document.getElementById('btn-maps')?.addEventListener('click', () => this.showMapSelect());
        document.getElementById('btn-achievements')?.addEventListener('click', () => this.showAchievementsPanel());
        document.getElementById('btn-multiplayer')?.addEventListener('click', () => this.multiplayer.openModal());

        document.getElementById('start-btn')?.addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn')?.addEventListener('click', () => { this.reset(); this.start(); });
        document.getElementById('pause-btn')?.addEventListener('click', () => this.togglePause());
        document.getElementById('menu-btn')?.addEventListener('click', () => this.showMainMenu());

        this.setupTouchControls();
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.storyManager.showingDialogue) {
                this.storyManager.showNextDialogue();
            }
        });
        document.getElementById('pac-back-btn')?.addEventListener('click', () => {
            if (window.GameBridge) window.GameBridge.exitGame();
            else window.location.href = '../../index.html';
        });
    }

    setupTouchControls() {
        let touchStartX = 0, touchStartY = 0;
        this.canvas.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; });
        this.canvas.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) > Math.abs(dy)) this.pacman.nextDirection = dx > 0 ? DIRS.RIGHT : DIRS.LEFT;
            else this.pacman.nextDirection = dy > 0 ? DIRS.DOWN : DIRS.UP;
        });
    }

    showMainMenu() {
        this.showingMainMenu = true;
        this.state = GameState.MENU;
        const overlay = document.getElementById('game-overlay');
        if (overlay) {
            overlay.innerHTML = `
                <div class="pac-main-menu">
                    <h1 class="pac-menu-title">PAC-MAN</h1>
                    <p class="pac-menu-subtitle">ENHANCED EDITION</p>
                    <div class="pac-menu-buttons">
                        <button class="pac-menu-btn primary" id="btn-classic">
                            <span class="pac-btn-icon">${ICONS.MODE_CLASSIC}</span>
                            <div class="pac-btn-content">
                                <span class="pac-btn-title">Classic Mode</span>
                                <span class="pac-btn-desc">Traditional gameplay</span>
                            </div>
                        </button>
                        <button class="pac-menu-btn" id="btn-story">
                            <span class="pac-btn-icon">${ICONS.MODE_STORY}</span>
                            <div class="pac-btn-content">
                                <span class="pac-btn-title">Story Mode</span>
                                <span class="pac-btn-desc">Adventure campaign</span>
                            </div>
                        </button>
                        <button class="pac-menu-btn" id="btn-multiplayer">
                            <span class="pac-btn-icon">${ICONS.MODE_MULTIPLAYER}</span>
                            <div class="pac-btn-content">
                                <span class="pac-btn-title">Multiplayer</span>
                                <span class="pac-btn-desc">Co-op & Versus</span>
                            </div>
                        </button>
                        <button class="pac-menu-btn" id="btn-modes">
                            <span class="pac-btn-icon">${ICONS.MODE_CUSTOM}</span>
                            <div class="pac-btn-content">
                                <span class="pac-btn-title">Game Modes</span>
                                <span class="pac-btn-desc">Survival, Speedrun</span>
                            </div>
                        </button>
                        <button class="pac-menu-btn" id="btn-maps">
                            <span class="pac-btn-icon">${ICONS.MODE_MAPS}</span>
                            <div class="pac-btn-content">
                                <span class="pac-btn-title">Select Map</span>
                                <span class="pac-btn-desc">15 Themes</span>
                            </div>
                        </button>
                        <button class="pac-menu-btn" id="btn-achievements">
                            <span class="pac-btn-icon">${ICONS.TROPHY}</span>
                            <div class="pac-btn-content">
                                <span class="pac-btn-title">Achievements</span>
                                <span class="pac-btn-desc">Unlock rewards</span>
                            </div>
                        </button>
                    </div>
                </div>`;
            overlay.style.display = 'flex';
            this.setupUI(); // Re-bind
        }
    }

    showModeSelect() {
        this.showingModeSelect = true;
        const modes = this.modeManager.getAllModes();
        const overlay = document.getElementById('game-overlay');
        if (overlay) {
            overlay.innerHTML = `
                <div class="pac-select-panel">
                    <h2 class="pac-panel-title">Game Modes</h2>
                    <div class="pac-grid">
                        ${modes.map(mode => `
                            <div class="pac-grid-card ${mode.unlocked ? '' : 'locked'}" data-mode="${mode.id}" style="--card-color:${mode.color}">
                                <span class="pac-card-icon">${ICONS.MODE_CUSTOM}</span>
                                <span class="pac-card-name">${mode.name}</span>
                                <span class="pac-card-desc">${mode.unlocked ? mode.description : mode.unlockCondition}</span>
                            </div>`).join('')}
                    </div>
                    <button class="pac-back-link" id="btn-back-menu">Back</button>
                </div>`;
            overlay.style.display = 'flex';
            overlay.querySelectorAll('.pac-grid-card').forEach(c => c.addEventListener('click', () => { if(this.modeManager.isUnlocked(c.dataset.mode)) this.selectMode(c.dataset.mode); }));
            overlay.querySelector('#btn-back-menu')?.addEventListener('click', () => this.showMainMenu());
        }
    }

    showMapSelect() {
        this.showingMapSelect = true;
        const maps = this.mapManager.getAllMaps();
        const overlay = document.getElementById('game-overlay');
        if (overlay) {
            overlay.innerHTML = `
                <div class="pac-select-panel">
                    <h2 class="pac-panel-title">Select Map</h2>
                    <div class="pac-grid">
                        ${maps.map(map => `
                            <div class="pac-grid-card ${map.unlocked ? '' : 'locked'}" data-map="${map.id}" style="--card-color:${typeof map.theme.wall === 'string' ? map.theme.wall : '#ff00ff'}">
                                <span class="pac-card-icon">${ICONS.MODE_MAPS}</span>
                                <span class="pac-card-name">${map.name}</span>
                            </div>`).join('')}
                    </div>
                    <button class="pac-back-link" id="btn-back-menu">Back</button>
                </div>`;
            overlay.style.display = 'flex';
            overlay.querySelectorAll('.pac-grid-card').forEach(c => c.addEventListener('click', () => { if(this.mapManager.isUnlocked(c.dataset.map)) { this.mapManager.setMap(c.dataset.map); this.showMainMenu(); }}));
            overlay.querySelector('#btn-back-menu')?.addEventListener('click', () => this.showMainMenu());
        }
    }

    showStoryMenu() {
        this.showingStorySelect = true;
        const chapters = this.storyManager.getChapters();
        const overlay = document.getElementById('game-overlay');
        if (overlay) {
            overlay.innerHTML = `
                <div class="pac-select-panel">
                    <h2 class="pac-panel-title">Story Mode</h2>
                    <div class="pac-chapter-list">
                        ${chapters.map(ch => `
                            <div class="pac-chapter-card ${ch.unlocked ? '' : 'locked'} ${ch.completed ? 'completed' : ''}" data-chapter="${ch.id}" style="--chapter-color:${ch.color}">
                                <span class="pac-chapter-icon">${ICONS.MODE_STORY}</span>
                                <div class="pac-chapter-info">
                                    <span class="pac-chapter-name">Chapter ${ch.id}: ${ch.name}</span>
                                    <span class="pac-chapter-desc">${ch.unlocked ? ch.description : '???'}</span>
                                    <span class="pac-chapter-progress">${ch.unlocked ? `${ch.levelsComplete}/${ch.levels.length} levels` : 'Locked'}</span>
                                </div>
                            </div>`).join('')}
                    </div>
                    <button class="pac-back-link" id="btn-back-menu">Back</button>
                </div>`;
            overlay.style.display = 'flex';
            overlay.querySelectorAll('.pac-chapter-card').forEach(c => c.addEventListener('click', () => { if(this.storyManager.progress.chaptersUnlocked.includes(parseInt(c.dataset.chapter))) this.showChapterLevels(parseInt(c.dataset.chapter)); }));
            overlay.querySelector('#btn-back-menu')?.addEventListener('click', () => this.showMainMenu());
        }
    }

    showChapterLevels(chapterId) {
        this.storyManager.startChapter(chapterId);
        const chapter = this.storyManager.currentChapter;
        const overlay = document.getElementById('game-overlay');
        if (overlay) {
            overlay.innerHTML = `
                <div class="pac-select-panel">
                    <h2 class="pac-panel-title">Chapter ${chapter.id}</h2>
                    <div class="pac-grid">
                        ${chapter.levels.map((l, idx) => `
                            <div class="pac-grid-card ${this.storyManager.progress.levelsCompleted[`${chapterId}-${idx+1}`] ? 'completed' : ''}" data-level="${idx}">
                                <span class="pac-card-icon">${ICONS.STAR}</span>
                                <span class="pac-card-name">Level ${idx+1}</span>
                                <span class="pac-card-desc">${l.name}</span>
                            </div>`).join('')}
                    </div>
                    <button class="pac-back-link" id="btn-back-story">Back</button>
                </div>`;
            overlay.style.display = 'flex';
            overlay.querySelectorAll('.pac-grid-card').forEach(c => c.addEventListener('click', () => this.startStoryLevel(parseInt(c.dataset.level))));
            overlay.querySelector('#btn-back-story')?.addEventListener('click', () => this.showStoryMenu());
        }
    }

    showAchievementsPanel() {
        this.showingAchievements = true;
        const achievements = this.achievementSystem.getAll();
        const progress = this.achievementSystem.getProgress();
        const overlay = document.getElementById('game-overlay');
        if (overlay) {
            overlay.innerHTML = `
                <div class="pac-achievements">
                    <h2 class="pac-panel-title">Achievements</h2>
                    <div style="text-align:center;margin-bottom:10px;">${progress.unlocked} / ${progress.total} (${progress.percentage}%)</div>
                    <div class="pac-progress-bar"><div class="pac-progress-fill" style="width:${progress.percentage}%"></div></div>
                    <div class="pac-achievement-list">
                        ${achievements.map(a => `
                            <div class="pac-achievement-item ${a.unlocked ? 'unlocked' : 'locked'}">
                                <span class="pac-achievement-icon">${a.unlocked ? ICONS.TROPHY : ICONS.LOCK}</span>
                                <div class="pac-achievement-info">
                                    <span class="pac-achievement-name">${a.unlocked || !a.secret ? a.name : '???'}</span>
                                    <span class="pac-achievement-desc">${a.unlocked || !a.secret ? a.description : 'Secret'}</span>
                                </div>
                                <span class="pac-achievement-pts">${a.points}</span>
                            </div>`).join('')}
                    </div>
                    <button class="pac-back-link" id="btn-back-menu">Back</button>
                </div>`;
            overlay.style.display = 'flex';
            overlay.querySelector('#btn-back-menu')?.addEventListener('click', () => this.showMainMenu());
        }
    }

    selectMode(modeId) { if (this.modeManager.setMode(modeId)) this.startGame(); }
    startStoryLevel(idx) { if (this.storyManager.startLevel(idx)) { this.showingMainMenu = false; this.reset(); this.start(); } }
    startGame() { this.showingMainMenu = false; this._hideOverlay(); this.reset(); this.start(); }
    _hideOverlay() { const o = document.getElementById('game-overlay'); if (o) { o.style.display = 'none'; o.innerHTML = ''; } }
    _showOverlay() { const o = document.getElementById('game-overlay'); if (o) o.style.display = 'flex'; }
    
    onReset() {
        this.grid = this.parseMaze();
        this.pacman.x = 14; this.pacman.y = 23; this.pacman.direction = DIRS.LEFT; this.pacman.nextDirection = DIRS.LEFT;
        this.createGhosts();
        this.modeManager.applyModeSettings();
        if (!this.storyManager.isActive()) this.lives = this.modeManager.currentMode.settings.lives;
        this.powerMode = false; this.powerTimer = 0; this.ghostsEaten = 0; this.ghostsEatenThisLevel = 0; this.deathsThisLevel = 0;
        this.currentGhostMode = GHOST_MODE.SCATTER; this.modeTimer = 0; this.levelStartTime = Date.now();
        this.ghostsFrozen = false; this.magnetActive = false; this.hasShield = false; this.scoreMultiplier = 1; 
        this.chainActive = false; this.chainMultiplier = 1; this.superMode = false; this.visibilityRadius = 0;
        this.powerUpManager.clearAll(); this.effectsSystem.clear();
        this.currentFruit = null; this.fruitTimer = 0;
        this.updateLivesDisplay(); this.updatePowerUpDisplay();
        this.render();
    }

    onStart() { this._hideOverlay(); this.levelStartTime = Date.now(); }
    
    onPause() {
        const overlay = document.getElementById('game-overlay');
        if (overlay) {
            overlay.innerHTML = `
                <div class="pac-main-menu">
                    <h1 class="pac-menu-title" style="font-size: 3.5rem;">PAUSED</h1>
                    <div style="display:flex;flex-direction:column;gap:15px;width:280px;">
                        <button class="pac-menu-btn primary" id="btn-resume" style="justify-content:center;">${ICONS.PLAY} RESUME</button>
                        <button class="pac-menu-btn" id="btn-pause-restart" style="justify-content:center;">${ICONS.RESTART} RESTART</button>
                        <button class="pac-menu-btn" id="btn-pause-menu" style="justify-content:center;">${ICONS.MENU} MENU</button>
                    </div>
                </div>`;
            overlay.style.display = 'flex';
            document.getElementById('btn-resume')?.addEventListener('click', () => this.resume());
            document.getElementById('btn-pause-restart')?.addEventListener('click', () => { this.reset(); this.start(); });
            document.getElementById('btn-pause-menu')?.addEventListener('click', () => { this.reset(); this.showMainMenu(); });
        }
    }
    
    onResume() { this._hideOverlay(); }

    update(dt) {
        if (this.storyManager.showingDialogue) return;
        dt *= this.timeScale;
        this.handleInput();
        this.modeManager.update(dt);
        if (!this.powerMode) this.updateGhostMode(dt);
        if (this.powerMode) { this.powerTimer -= dt; if (this.powerTimer <= 0) this.endPowerMode(); }
        
        this.moveTimer += dt;
        if (this.moveTimer >= (this.basePacmanSpeed / this.pacmanSpeedMultiplier)) {
            this.moveTimer = 0;
            this.movePacman();
        }

        if (!this.ghostsFrozen) {
            this.ghosts.forEach(ghost => {
                if (ghost.moveTimer === undefined) ghost.moveTimer = 0;
                if (ghost.inHouse) {
                    ghost.houseExitTimer -= dt;
                    if (ghost.houseExitTimer <= 0) { ghost.inHouse = false; ghost.y = 11; ghost.x = 14; }
                    return;
                }
                ghost.moveTimer += dt;
                let speed = this.baseGhostSpeed / this.ghostSpeedMultiplier;
                if (ghost.mode === GHOST_MODE.FRIGHTENED) speed *= 1.5;
                if (ghost.mode === GHOST_MODE.EATEN) speed *= 0.5;
                if (ghost.moveTimer >= speed) { ghost.moveTimer = 0; this.moveGhost(ghost); }
            });
        }
        
        this.checkGhostCollisions();
        if (this.powerUpsEnabled) this.powerUpManager.update(dt);
        this.effectsSystem.update(dt);
        this.updateFruit(dt);
        if (this.magnetActive) this.attractDots();
        if (this.chainActive) this.chainMultiplier = Math.min(10, this.chainMultiplier + dt * 0.5);
        this.pacman.mouthAngle += dt * 10;
        this.notifications = this.notifications.filter(n => { n.life -= dt; return n.life > 0; });
        if (this.storyManager.isActive()) this.storyManager.updateObjective('time');
        this.updateModeUI();
    }

    handleInput() {
        if (inputManager.isKeyDown('ArrowUp') || inputManager.isKeyDown('KeyW')) this.pacman.nextDirection = DIRS.UP;
        else if (inputManager.isKeyDown('ArrowDown') || inputManager.isKeyDown('KeyS')) this.pacman.nextDirection = DIRS.DOWN;
        else if (inputManager.isKeyDown('ArrowLeft') || inputManager.isKeyDown('KeyA')) this.pacman.nextDirection = DIRS.LEFT;
        else if (inputManager.isKeyDown('ArrowRight') || inputManager.isKeyDown('KeyD')) this.pacman.nextDirection = DIRS.RIGHT;
    }

    movePacman() {
        const { x, y, direction, nextDirection } = this.pacman;
        if (this.canMove(x, y, nextDirection)) this.pacman.direction = nextDirection;
        if (this.canMove(x, y, this.pacman.direction)) {
            this.pacman.x += this.pacman.direction.x;
            this.pacman.y += this.pacman.direction.y;
            if (this.pacman.x < 0) this.pacman.x = COLS - 1;
            if (this.pacman.x >= COLS) this.pacman.x = 0;
            this.checkTile();
        }
    }

    checkTile() {
        const tile = this.grid[this.pacman.y]?.[this.pacman.x];
        if (tile === TILE.DOT) {
            this.grid[this.pacman.y][this.pacman.x] = TILE.EMPTY;
            this.collectDot();
        } else if (tile === TILE.POWER) {
            this.grid[this.pacman.y][this.pacman.x] = TILE.EMPTY;
            this.collectPowerPellet();
        }
        this.powerUpManager.checkCollection(this.pacman.x, this.pacman.y);
        if (this.currentFruit && this.currentFruit.x === this.pacman.x && this.currentFruit.y === this.pacman.y) {
            this.collectFruit();
        }
        if (this.dotsRemaining === 0) this.completeLevel();
    }

    collectDot() {
        const points = 10 * this.scoreMultiplier * (this.chainActive ? Math.floor(this.chainMultiplier) : 1);
        this.addScore(points);
        this.dotsRemaining--;
        this.effectsSystem.createDotCollect(this.pacman.x, this.pacman.y, CELL_SIZE);
        this.achievementSystem.onDotEaten();
    }

    collectPowerPellet() {
        const points = 50 * this.scoreMultiplier;
        this.addScore(points);
        this.dotsRemaining--;
        this.activatePowerMode();
        this.effectsSystem.createPowerPelletCollect(this.pacman.x, this.pacman.y, CELL_SIZE);
        if (this.storyManager.isActive()) this.storyManager.updateObjective('power_used');
    }

    activatePowerMode() {
        this.powerMode = true;
        this.powerTimer = this.powerDuration;
        this.ghostsEaten = 0;
        this.ghosts.forEach(ghost => {
            if (ghost.mode !== GHOST_MODE.EATEN && !ghost.inHouse) {
                ghost.mode = GHOST_MODE.FRIGHTENED;
                ghost.direction = {
                    x: -ghost.direction.x,
                    y: -ghost.direction.y,
                    name: this.getOppositeDirName(ghost.direction.name)
                };
            }
        });
    }

    endPowerMode() {
        this.powerMode = false;
        this.ghosts.forEach(g => { if (g.mode === GHOST_MODE.FRIGHTENED) g.mode = this.currentGhostMode; });
    }

    getOppositeDirName(name) {
        const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
        return opposites[name] || 'left';
    }

    canMove(x, y, dir) {
        const newX = (x + dir.x + COLS) % COLS;
        const newY = y + dir.y;
        if (newY < 0 || newY >= ROWS) return false;
        const tile = this.grid[newY]?.[newX];
        return tile !== TILE.WALL && tile !== TILE.GHOST_HOUSE;
    }

    updateGhostMode(dt) {
        this.modeTimer += dt;
        const scatterTime = 7, chaseTime = 20, cycleTime = scatterTime + chaseTime;
        const timeInCycle = this.modeTimer % cycleTime;
        const newMode = timeInCycle < scatterTime ? GHOST_MODE.SCATTER : GHOST_MODE.CHASE;
        if (newMode !== this.currentGhostMode) {
            this.currentGhostMode = newMode;
            this.ghosts.forEach(ghost => {
                if (ghost.mode !== GHOST_MODE.FRIGHTENED && ghost.mode !== GHOST_MODE.EATEN) ghost.mode = newMode;
            });
        }
    }

    moveGhost(ghost) {
        this.updateGhostTarget(ghost);
        const availableDirs = [];
        const opposite = { x: -ghost.direction.x, y: -ghost.direction.y, name: this.getOppositeDirName(ghost.direction.name) };
        for (const [name, dir] of Object.entries(DIRS)) {
            if (dir.x === opposite.x && dir.y === opposite.y) continue;
            if (this.canGhostMove(ghost.x, ghost.y, dir)) availableDirs.push({ name, dir });
        }
        if (availableDirs.length === 0) { ghost.direction = opposite; return; }
        if (availableDirs.length === 1) { ghost.direction = availableDirs[0].dir; }
        else {
            if (ghost.mode === GHOST_MODE.FRIGHTENED) {
                const choice = availableDirs[Math.floor(Math.random() * availableDirs.length)];
                ghost.direction = choice.dir;
            } else {
                let bestDir = availableDirs[0].dir;
                let bestDist = Infinity;
                for (const { dir } of availableDirs) {
                    const dist = Math.hypot(ghost.x + dir.x - ghost.targetX, ghost.y + dir.y - ghost.targetY);
                    if (dist < bestDist) { bestDist = dist; bestDir = dir; }
                }
                ghost.direction = bestDir;
            }
        }
        ghost.x += ghost.direction.x;
        ghost.y += ghost.direction.y;
        if (ghost.x < 0) ghost.x = COLS - 1;
        if (ghost.x >= COLS) ghost.x = 0;
        if (ghost.mode === GHOST_MODE.EATEN && ghost.x === 14 && ghost.y === 14) ghost.mode = this.currentGhostMode;
    }

    canGhostMove(x, y, dir) {
        const newX = (x + dir.x + COLS) % COLS;
        const newY = y + dir.y;
        if (newY < 0 || newY >= ROWS) return false;
        const tile = this.grid[newY]?.[newX];
        return tile !== TILE.WALL;
    }

    updateGhostTarget(ghost) {
        switch (ghost.mode) {
            case GHOST_MODE.SCATTER:
                ghost.targetX = ghost.scatterTarget.x;
                ghost.targetY = ghost.scatterTarget.y;
                break;
            case GHOST_MODE.CHASE:
                switch (ghost.name) {
                    case 'blinky': ghost.targetX = this.pacman.x; ghost.targetY = this.pacman.y; break;
                    case 'pinky': ghost.targetX = this.pacman.x + this.pacman.direction.x * 4; ghost.targetY = this.pacman.y + this.pacman.direction.y * 4; break;
                    case 'inky':
                        const blinky = this.ghosts[0];
                        const aheadX = this.pacman.x + this.pacman.direction.x * 2;
                        const aheadY = this.pacman.y + this.pacman.direction.y * 2;
                        ghost.targetX = aheadX + (aheadX - blinky.x);
                        ghost.targetY = aheadY + (aheadY - blinky.y);
                        break;
                    case 'clyde':
                        const dist = Math.hypot(ghost.x - this.pacman.x, ghost.y - this.pacman.y);
                        if (dist < 8) { ghost.targetX = ghost.scatterTarget.x; ghost.targetY = ghost.scatterTarget.y; }
                        else { ghost.targetX = this.pacman.x; ghost.targetY = this.pacman.y; }
                        break;
                }
                break;
            case GHOST_MODE.EATEN: ghost.targetX = 14; ghost.targetY = 14; break;
        }
    }

    checkGhostCollisions() {
        for (const ghost of this.ghosts) {
            if (ghost.inHouse) continue;
            if (ghost.x === this.pacman.x && ghost.y === this.pacman.y) {
                if (ghost.mode === GHOST_MODE.FRIGHTENED) this.eatGhost(ghost);
                else if (ghost.mode !== GHOST_MODE.EATEN) {
                    if (this.hasShield) {
                        this.hasShield = false;
                        ghost.mode = GHOST_MODE.EATEN;
                        this.showNotification('Shield absorbed hit!');
                    } else if (!this.superMode) {
                        this.loseLife();
                        return;
                    }
                }
            }
        }
    }

    eatGhost(ghost) {
        ghost.mode = GHOST_MODE.EATEN;
        this.ghostsEaten++;
        this.ghostsEatenThisLevel++;
        const points = 200 * Math.pow(2, this.ghostsEaten - 1) * this.scoreMultiplier;
        this.addScore(points);
        this.effectsSystem.createGhostEaten(ghost.x, ghost.y, CELL_SIZE, points);
        this.achievementSystem.onGhostEaten(this.ghostsEaten);
        this.modeManager.onGhostEaten();
        if (this.storyManager.isActive()) this.storyManager.updateObjective('ghost_eaten');
        if (this.ghostsEaten === 4) this.achievementSystem.onPowerChain(4);
    }

    loseLife() {
        this.lives--;
        this.deathsThisLevel++;
        this.updateLivesDisplay();
        this.effectsSystem.createPacmanDeath(this.pacman.x, this.pacman.y, CELL_SIZE);
        if (this.lives <= 0) this.gameOver(false);
        else {
            this.pacman.x = 14; this.pacman.y = 23; this.pacman.direction = DIRS.LEFT;
            this.createGhosts();
            this.powerMode = false;
            this.powerUpManager.clearAll();
        }
    }

    completeLevel() {
        const levelTime = (Date.now() - this.levelStartTime) / 1000;
        this.effectsSystem.createLevelComplete();
        if (this.storyManager.isActive()) {
            if (this.storyManager.checkObjectiveComplete()) this.storyManager.completeLevel();
        } else {
            this.level++;
            this.modeManager.onLevelComplete();
            this.achievementSystem.onLevelComplete(levelTime, this.ghostsEatenThisLevel, this.deathsThisLevel);
            setTimeout(() => this.nextLevel(), 1500);
        }
    }

    nextLevel() {
        this.grid = this.parseMaze();
        this.pacman.x = 14; this.pacman.y = 23; 
        this.createGhosts();
        this.basePacmanSpeed = Math.max(0.05, this.basePacmanSpeed - 0.003);
        this.baseGhostSpeed = Math.max(0.06, this.baseGhostSpeed - 0.003);
        this.ghostsEatenThisLevel = 0;
        this.deathsThisLevel = 0;
        this.levelStartTime = Date.now();
        this.powerUpManager.clearAll();
    }

    updateFruit(dt) {
        if (!this.currentFruit) {
            const dotsEaten = this.totalDots - this.dotsRemaining;
            if ((dotsEaten === 70 || dotsEaten === 170) && !this.fruitSpawnedThisThreshold) {
                this.spawnFruit();
                this.fruitSpawnedThisThreshold = true;
            }
            if (dotsEaten !== 70 && dotsEaten !== 170) this.fruitSpawnedThisThreshold = false;
        } else {
            this.fruitTimer -= dt;
            if (this.fruitTimer <= 0) this.currentFruit = null;
        }
    }

    spawnFruit() {
        const fruitIndex = Math.min(this.level - 1, FRUITS.length - 1);
        const fruit = FRUITS[fruitIndex];
        this.currentFruit = { ...fruit, x: 14, y: 17 };
        this.fruitTimer = 10;
    }

    collectFruit() {
        const points = this.currentFruit.points * this.scoreMultiplier;
        this.addScore(points);
        this.effectsSystem.createFruitCollect(this.currentFruit.x, this.currentFruit.y, CELL_SIZE, points);
        this.achievementSystem.onFruitCollected(this.currentFruit.type);
        if (this.storyManager.isActive()) this.storyManager.updateObjective('fruit_collected');
        this.currentFruit = null;
    }

    attractDots() {
        const { x, y } = this.pacman;
        for (let dy = -this.magnetRadius; dy <= this.magnetRadius; dy++) {
            for (let dx = -this.magnetRadius; dx <= this.magnetRadius; dx++) {
                const tx = x + dx, ty = y + dy;
                if (ty >= 0 && ty < ROWS && tx >= 0 && tx < COLS) {
                    if (this.grid[ty][tx] === TILE.DOT) {
                        this.grid[ty][tx] = TILE.EMPTY;
                        this.collectDot();
                    }
                }
            }
        }
    }

    findSafeSpots() {
        const spots = [];
        const ghostPositions = this.ghosts.map(g => ({ x: g.x, y: g.y }));
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.grid[y][x] !== TILE.WALL && this.grid[y][x] !== TILE.GHOST_HOUSE) {
                    const isSafe = ghostPositions.every(g => Math.hypot(x - g.x, y - g.y) > 5);
                    if (isSafe) spots.push({ x, y });
                }
            }
        }
        return spots;
    }

    findEmptySpots() {
        const spots = [];
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.grid[y][x] === TILE.EMPTY) spots.push({ x, y });
            }
        }
        return spots;
    }

    addScore(points) {
        super.addScore(points);
        this.modeManager.onScoreUpdate(this.score);
        this.achievementSystem.onScoreUpdate(this.score, this.score);
    }

    updateLivesDisplay() {
        const el = document.querySelector('.lives-value');
        if (el) el.innerHTML = ICONS.PACMAN.repeat(Math.max(0, Math.min(this.lives, 5)));
    }

    updatePowerUpDisplay() {
        const container = document.querySelector('#ui-powerup-list');
        if (!container) return;
        const active = this.powerUpManager.getActivePowerUps();
        if(active.length === 0) {
            container.innerHTML = '<div style="color:var(--text-muted);font-size:0.9rem;">No active power-ups</div>';
            return;
        }
        container.innerHTML = active.map(pu => `
            <div class="pac-active-powerup" style="border-color:${pu.color};color:${pu.color}">
                <span>${pu.icon}</span>
                <span>${pu.name} ${pu.timeRemaining.toFixed(1)}s</span>
            </div>
        `).join('');
    }

    updateModeUI() {
        const timerDisplay = this.modeManager.getTimeDisplay();
        const timerEl = document.querySelector('.mode-timer');
        if (timerEl && timerDisplay) {
            timerEl.textContent = timerDisplay;
            timerEl.style.display = 'block';
        } else if (timerEl) {
            timerEl.style.display = 'none';
        }
        this.updatePowerUpDisplay();
        if (this.storyManager.isActive()) {
            const objEl = document.querySelector('.pac-objective');
            if (objEl) objEl.textContent = this.storyManager.getCurrentObjectiveText();
        }
    }

    showNotification(text, duration = 2) {
        this.notifications.push({ text, life: duration });
    }
    showUnlockNotification(text) {
        this.showNotification(`UNLOCK: ${text}`, 3);
        this.effectsSystem.createAchievementUnlock();
    }

    render() {
        const ctx = this.ctx;
        const theme = this.mapManager.getCurrentTheme();
        
        // Background
        ctx.fillStyle = theme.background;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid lines optional, keeping clean for retro
        if (theme.gridLines) {
            ctx.strokeStyle = theme.gridColor || 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 0.5;
            for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x*CELL_SIZE, 0); ctx.lineTo(x*CELL_SIZE, ROWS*CELL_SIZE); ctx.stroke(); }
            for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y*CELL_SIZE); ctx.lineTo(COLS*CELL_SIZE, y*CELL_SIZE); ctx.stroke(); }
        }

        if (this.visibilityRadius > 0) this.renderWithVisibility(theme);
        else this.renderMaze(theme);

        this.renderFruit();
        this.powerUpManager.render(ctx, CELL_SIZE); // Assuming this uses primitives
        this.renderGhosts(theme);
        this.renderPacman(theme);
        this.effectsSystem.render(ctx);
        this.renderNotifications();
    }

    renderMaze(theme) {
        const ctx = this.ctx;
        const wallColor = this.mapManager.getWallColor(this.elapsedTime);
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tile = this.grid[y][x];
                const px = x * CELL_SIZE, py = y * CELL_SIZE;
                if (tile === TILE.WALL) {
                    ctx.fillStyle = wallColor;
                    ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                    // Inner line for retro detail
                    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
                    ctx.strokeRect(px+4, py+4, CELL_SIZE-8, CELL_SIZE-8);
                } else if (tile === TILE.DOT) {
                    ctx.fillStyle = theme.dot;
                    ctx.fillRect(px + CELL_SIZE/2 - 2, py + CELL_SIZE/2 - 2, 4, 4);
                } else if (tile === TILE.POWER) {
                    if (Math.floor(this.elapsedTime * 4) % 2 === 0) {
                        ctx.fillStyle = theme.power;
                        ctx.beginPath();
                        ctx.arc(px + CELL_SIZE/2, py + CELL_SIZE/2, 6, 0, Math.PI*2);
                        ctx.fill();
                    }
                }
            }
        }
    }

    renderWithVisibility(theme) {
        // Simplified visibility render
        this.renderMaze(theme); // Render normally then overlay darkness
        const ctx = this.ctx;
        const { x, y } = this.pacman;
        const px = x * CELL_SIZE + CELL_SIZE/2;
        const py = y * CELL_SIZE + CELL_SIZE/2;
        
        ctx.save();
        ctx.globalCompositeOperation = 'destination-in';
        const grad = ctx.createRadialGradient(px, py, CELL_SIZE, px, py, this.visibilityRadius * CELL_SIZE);
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();
    }

    renderFruit() {
        if (!this.currentFruit) return;
        const ctx = this.ctx;
        const px = this.currentFruit.x * CELL_SIZE + CELL_SIZE / 2;
        const py = this.currentFruit.y * CELL_SIZE + CELL_SIZE / 2;
        const bob = Math.sin(this.elapsedTime * 4) * 2;
        
        ctx.fillStyle = this.currentFruit.color || '#ff0000';
        // Draw simple shape based on type or just a generic fruit shape
        ctx.beginPath();
        if(this.currentFruit.type === 'cherry' || this.currentFruit.type === 'apple') {
            ctx.arc(px, py + bob, 8, 0, Math.PI*2);
        } else if (this.currentFruit.type === 'strawberry' || this.currentFruit.type === 'bell') {
            ctx.moveTo(px, py + bob - 8);
            ctx.lineTo(px + 6, py + bob + 6);
            ctx.lineTo(px - 6, py + bob + 6);
        } else {
            ctx.rect(px - 6, py + bob - 6, 12, 12);
        }
        ctx.fill();
    }

    renderPacman(theme) {
        const ctx = this.ctx;
        const { x, y, direction } = this.pacman;
        const px = x * CELL_SIZE + CELL_SIZE / 2;
        const py = y * CELL_SIZE + CELL_SIZE / 2;
        let rotation = 0;
        if (direction === DIRS.DOWN) rotation = Math.PI / 2;
        else if (direction === DIRS.LEFT) rotation = Math.PI;
        else if (direction === DIRS.UP) rotation = -Math.PI / 2;
        
        const mouthSize = 0.2 + Math.abs(Math.sin(this.pacman.mouthAngle)) * 0.3;
        
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(rotation);
        
        if (this.powerMode || this.superMode) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffff00';
        }

        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, 0, CELL_SIZE / 2 - 2, mouthSize, Math.PI * 2 - mouthSize);
        ctx.lineTo(0, 0);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    renderGhosts(theme) {
        const ctx = this.ctx;
        for (const ghost of this.ghosts) {
            if (ghost.inHouse && ghost.y > 11) continue;
            const px = ghost.x * CELL_SIZE + CELL_SIZE / 2;
            const py = ghost.y * CELL_SIZE + CELL_SIZE / 2;
            
            let color = ghost.color;
            if (ghost.mode === GHOST_MODE.FRIGHTENED) {
                color = this.powerTimer < 2 && Math.floor(this.elapsedTime * 10) % 2 === 0 ? '#fff' : '#00f';
            } else if (ghost.mode === GHOST_MODE.EATEN) {
                this.renderGhostEyes(px, py, ghost.direction);
                continue;
            }

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(px, py - 4, CELL_SIZE / 2 - 2, Math.PI, 0);
            ctx.lineTo(px + CELL_SIZE/2 - 2, py + CELL_SIZE/2 - 2);
            // Wavy feet
            for(let i=1; i<=3; i++) {
                ctx.lineTo(px + CELL_SIZE/2 - 2 - (i*((CELL_SIZE-4)/3)), py + CELL_SIZE/2 - 2 - (i%2==0?0:3));
            }
            ctx.lineTo(px - CELL_SIZE/2 + 2, py + CELL_SIZE/2 - 2);
            ctx.fill();
            
            this.renderGhostEyes(px, py, ghost.direction, ghost.mode === GHOST_MODE.FRIGHTENED);
        }
    }

    renderGhostEyes(px, py, direction, frightened = false) {
        const ctx = this.ctx;
        if (frightened) {
            ctx.fillStyle = '#ffccac';
            ctx.fillRect(px - 6, py - 6, 4, 4);
            ctx.fillRect(px + 2, py - 6, 4, 4);
        } else {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(px - 4, py - 4, 4, 0, Math.PI*2);
            ctx.arc(px + 4, py - 4, 4, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#00f';
            ctx.beginPath();
            ctx.arc(px - 4 + direction.x*1.5, py - 4 + direction.y*1.5, 2, 0, Math.PI*2);
            ctx.arc(px + 4 + direction.x*1.5, py - 4 + direction.y*1.5, 2, 0, Math.PI*2);
            ctx.fill();
        }
    }

    renderNotifications() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        this.notifications.forEach((n, i) => {
            const alpha = Math.min(1, n.life);
            const y = 60 + i * 30;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = '20px "VT323", monospace'; // Use new retro font
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffff00';
            ctx.shadowBlur = 0;
            ctx.fillText(n.text.toUpperCase(), centerX, y);
            ctx.restore();
        });
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    window.game = new PacManEnhanced();
});
