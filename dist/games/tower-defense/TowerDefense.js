/**
 * Tower Defense - Build towers and stop the enemies
 */
import { GameEngine, GameState } from '../../js/engine/GameEngine.js';
import { storageManager } from '../../js/engine/StorageManager.js';
import { soundEffects } from '../../js/engine/SoundEffects.js';
import { random, randomInt } from '../../js/utils/math.js';
import { MAPS, getMap, calculatePath } from './MapData.js';
import { AchievementSystem } from './AchievementSystem.js';
import { GameModes, GAME_MODES } from './GameModes.js';
import { StoryMode } from './StoryMode.js';
import { HeroAbilities } from './HeroAbilities.js';
import { TowerDefenseMultiplayer } from './TowerDefenseMultiplayer.js';
import { hubSDK } from '../../js/engine/HubSDK.js';

// Grid configuration
const CELL_SIZE = 32;
const COLS = 20;
const ROWS = 15;

// Tower types
// SVG icon templates
const ICONS = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/><path d="M5 3v18"/></svg>',
    cannon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/></svg>',
    ice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
    laser: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    sniper: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>',
    poison: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="m8.5 10 7 4"/><path d="m8.5 14 7-4"/></svg>',
    tesla: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
    gold: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
};

const TOWERS = {
    arrow: {
        name: 'Arrow Tower',
        cost: 50,
        damage: 15,
        range: 100,
        fireRate: 0.5,
        color: '#00ff00',
        projectileSpeed: 400,
        splash: 0,
        iconSvg: ICONS.arrow,
        description: 'Fast firing, low damage'
    },
    cannon: {
        name: 'Cannon Tower',
        cost: 100,
        damage: 40,
        range: 80,
        fireRate: 1.5,
        color: '#ff6600',
        projectileSpeed: 200,
        splash: 40,
        iconSvg: ICONS.cannon,
        description: 'Slow, high splash damage'
    },
    ice: {
        name: 'Ice Tower',
        cost: 75,
        damage: 5,
        range: 90,
        fireRate: 0.8,
        color: '#00ffff',
        projectileSpeed: 300,
        splash: 30,
        slow: 0.5,
        iconSvg: ICONS.ice,
        description: 'Slows enemies'
    },
    laser: {
        name: 'Laser Tower',
        cost: 150,
        damage: 30,
        range: 120,
        fireRate: 0.1,
        color: '#ff00ff',
        isBeam: true,
        iconSvg: ICONS.laser,
        description: 'Continuous beam damage'
    },
    sniper: {
        name: 'Sniper Tower',
        cost: 200,
        damage: 100,
        range: 200,
        fireRate: 2.0,
        color: '#00ffaa',
        projectileSpeed: 800,
        splash: 0,
        iconSvg: ICONS.sniper,
        description: 'Very long range, high damage',
        critChance: 0.25,
        critMultiplier: 2.0
    },
    poison: {
        name: 'Poison Tower',
        cost: 125,
        damage: 10,
        range: 95,
        fireRate: 1.0,
        color: '#88ff00',
        projectileSpeed: 250,
        splash: 35,
        iconSvg: ICONS.poison,
        description: 'Damage over time',
        poisonDuration: 5,
        poisonDamage: 5
    },
    tesla: {
        name: 'Tesla Tower',
        cost: 175,
        damage: 25,
        range: 110,
        fireRate: 1.2,
        color: '#00aaff',
        projectileSpeed: 600,
        splash: 0,
        iconSvg: ICONS.tesla,
        description: 'Chain lightning',
        chainCount: 3,
        chainRange: 70,
        chainDamageReduction: 0.7
    }
};

// Enemy types
const ENEMIES = {
    basic: { 
        hp: 50, 
        speed: 40, 
        reward: 10, 
        color: '#ff0000', 
        size: 12,
        icon: '👹',
        name: 'Basic'
    },
    fast: { 
        hp: 30, 
        speed: 80, 
        reward: 15, 
        color: '#ffff00', 
        size: 10,
        icon: '💨',
        name: 'Fast'
    },
    tank: { 
        hp: 200, 
        speed: 25, 
        reward: 30, 
        color: '#8800ff', 
        size: 16,
        armor: 0.5,
        icon: '🛡️',
        name: 'Tank'
    },
    flying: {
        hp: 60,
        speed: 50,
        reward: 20,
        color: '#00ddff',
        size: 11,
        icon: '🦅',
        name: 'Flying',
        isFlying: true,
        immuneToGround: true
    },
    armored: {
        hp: 150,
        speed: 30,
        reward: 35,
        color: '#888888',
        size: 14,
        armor: 0.7,
        icon: '🏰',
        name: 'Armored'
    },
    healer: {
        hp: 80,
        speed: 35,
        reward: 40,
        color: '#00ff88',
        size: 12,
        icon: '💚',
        name: 'Healer',
        healRange: 80,
        healAmount: 20,
        healRate: 2.0
    },
    speeder: {
        hp: 40,
        speed: 120,
        reward: 18,
        color: '#ff00ff',
        size: 9,
        icon: '⚡',
        name: 'Speeder'
    },
    spawner: {
        hp: 100,
        speed: 35,
        reward: 45,
        color: '#8800ff',
        size: 15,
        icon: '🥚',
        name: 'Spawner',
        spawnCount: 3,
        spawnType: 'basic'
    },
    miniboss: {
        hp: 400,
        speed: 28,
        reward: 75,
        color: '#ff4400',
        size: 20,
        armor: 0.3,
        icon: '👺',
        name: 'Mini-Boss'
    },
    boss: { 
        hp: 1000, 
        speed: 20, 
        reward: 100, 
        color: '#ff0088', 
        size: 24,
        armor: 0.4,
        icon: '👿',
        name: 'Boss',
        isBoss: true
    }
};

// Map layout (0=grass, 1=path, 2=start, 3=end, 4=obstacle)
// Default map - Complex Serpentine
const MAP = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0],
    [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0],
    [0,0,1,0,4,4,4,0,0,0,0,4,4,4,0,1,0,1,0,0],
    [0,0,1,0,4,0,0,0,0,0,0,0,0,4,0,1,0,1,0,0],
    [0,0,1,0,4,0,0,0,0,0,0,0,0,4,0,1,0,1,0,0],
    [0,0,1,0,4,4,4,0,0,0,0,4,4,4,0,1,0,1,0,0],
    [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3]
];

class TowerDefense extends GameEngine {
    constructor() {
        super({
            canvasId: 'game-canvas',
            gameId: 'tower-defense',
            width: COLS * CELL_SIZE,
            height: ROWS * CELL_SIZE
        });

        // Game state
        this.gold = 100;
        this.lives = 20;
        this.wave = 0;
        this.waveInProgress = false;
        this.currentMap = MAP;  // Default map
        this.currentMapId = 1;

        // Game objects
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];

        // Path
        this.path = this.calculatePath();

        // Selection
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.hoverCell = null;

        // Multipliers for game modes
        this.scoreMultiplier = 1.0;
        this.goldMultiplier = 1.0;
        this.waveMultiplier = 1.0;

        // Initialize new systems
        this.achievementSystem = new AchievementSystem(this);
        this.gameModes = new GameModes(this);
        this.storyMode = new StoryMode(this);
        this.multiplayer = new TowerDefenseMultiplayer(this);
        this.isMultiplayer = false; // Flag for multiplayer mode
        this.heroAbilities = new HeroAbilities(this);
        
        // Initialize Hub SDK
        hubSDK.init({ gameId: 'tower-defense' });
        this.hubSDK = hubSDK;

        // Track stats for achievements
        this.stats = {
            towersPlaced: 0,
            towersSold: 0,
            totalKills: 0,
            totalGold: 0,
            totalWaves: 0
        };

        this.setupUI();
        this.setupGameBridge();
        this.onReset();
    }

    calculatePath() {
        // Find start position by scanning map for tile type 2
        const map = this.currentMap || MAP;
        const path = [];
        let startX = 0, startY = 0;
        
        // Find start tile (type 2)
        outer: for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (map[y] && map[y][x] === 2) {
                    startX = x;
                    startY = y;
                    break outer;
                }
            }
        }
        
        let x = startX, y = startY;
        const visited = new Set();
        visited.add(`${x},${y}`);
        path.push({ x: x * CELL_SIZE + CELL_SIZE / 2, y: y * CELL_SIZE + CELL_SIZE / 2 });

        // Follow path to end (tile type 3)
        let iterations = 0;
        const maxIterations = COLS * ROWS; // Safety limit
        
        while (map[y] && map[y][x] !== 3 && iterations < maxIterations) {
            iterations++;
            const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            let found = false;

            for (const [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;
                const key = `${nx},${ny}`;

                if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS &&
                    map[ny] && (map[ny][nx] === 1 || map[ny][nx] === 3) && !visited.has(key)) {
                    x = nx;
                    y = ny;
                    visited.add(key);
                    path.push({ x: x * CELL_SIZE + CELL_SIZE / 2, y: y * CELL_SIZE + CELL_SIZE / 2 });
                    found = true;
                    break;
                }
            }
            
            if (!found) break; // No more path to follow
        }

        return path;
    }

    setupUI() {
        document.getElementById('start-btn')?.addEventListener('click', () => {
            if (!this.waveInProgress) {
                this.startWave();
            }
        });

        document.getElementById('restart-btn')?.addEventListener('click', () => {
            this.reset();
        });

        document.getElementById('pause-btn')?.addEventListener('click', () => {
             if (this.canPause !== false) {
                 this.togglePause();
             } else {
                 soundEffects.hit();
             }
        });

        // Story mode button
        document.getElementById('story-btn')?.addEventListener('click', () => {
            this.storyMode.showLevelSelect();
        });

        // Story mode button on overlay
        document.getElementById('story-mode-btn')?.addEventListener('click', () => {
            this.storyMode.showLevelSelect();
        });

        // Achievements button
        document.getElementById('achievements-btn')?.addEventListener('click', () => {
            this.achievementSystem.openGallery();
        });

        // Game mode buttons
        document.getElementById('classic-btn')?.addEventListener('click', () => {
            this.startMode(GAME_MODES.CLASSIC);
        });

        document.getElementById('endless-btn')?.addEventListener('click', () => {
            this.startMode(GAME_MODES.ENDLESS);
        });

        document.getElementById('challenge-btn')?.addEventListener('click', () => {
            this.startMode(GAME_MODES.CHALLENGE, { noUpgrades: true });
        });

        document.getElementById('speedrun-btn')?.addEventListener('click', () => {
            this.startMode(GAME_MODES.SPEEDRUN);
        });

        document.getElementById('survival-btn')?.addEventListener('click', () => {
            this.startMode(GAME_MODES.SURVIVAL);
        });

        // Multiplayer mode button - show options
        document.getElementById('multiplayer-btn')?.addEventListener('click', () => {
            document.querySelector('.overlay-buttons')?.classList.add('hidden');
            document.getElementById('multiplayer-options')?.classList.remove('hidden');
        });

        // Multiplayer back button
        document.getElementById('mp-back-btn')?.addEventListener('click', () => {
            document.querySelector('.overlay-buttons')?.classList.remove('hidden');
            document.getElementById('multiplayer-options')?.classList.add('hidden');
        });

        // Create room
        document.getElementById('create-room-btn')?.addEventListener('click', async () => {
            try {
                const roomId = await this.multiplayer.connect();
                this.isMultiplayer = true;
                this.setupMultiplayerCallbacks();
                this.multiplayer.showLobby((mapId) => {
                    this._hideOverlay();
                    this.startMultiplayerGame(mapId);
                });
            } catch (error) {
                console.error('Failed to create room:', error);
            }
        });

        // Join room - show input
        document.getElementById('join-room-btn')?.addEventListener('click', () => {
            document.getElementById('multiplayer-options')?.classList.add('hidden');
            document.getElementById('join-room-modal')?.classList.remove('hidden');
        });

        // Cancel join
        document.getElementById('cancel-join-btn')?.addEventListener('click', () => {
            document.getElementById('join-room-modal')?.classList.add('hidden');
            document.getElementById('multiplayer-options')?.classList.remove('hidden');
        });

        // Confirm join with room code
        document.getElementById('confirm-join-btn')?.addEventListener('click', async () => {
            const roomCode = document.getElementById('room-code-input')?.value.toUpperCase().trim();
            if (roomCode && roomCode.length === 6) {
                try {
                    await this.multiplayer.connect(roomCode);
                    this.isMultiplayer = true;
                    this.setupMultiplayerCallbacks();
                    this.multiplayer.showLobby((mapId) => {
                        this._hideOverlay();
                        this.startMultiplayerGame(mapId);
                    });
                } catch (error) {
                    console.error('Failed to join room:', error);
                }
            }
        });

        // Tower selection
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.tower;
                this.selectTowerType(type);
            });
        });

        // Canvas click
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));

        // Keyboard shortcuts - Enhanced
        document.addEventListener('keydown', (e) => {
            // Don't process if typing in input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            const keys = { '1': 'arrow', '2': 'cannon', '3': 'ice', '4': 'laser', '5': 'sniper', '6': 'poison', '7': 'tesla' };
            
            // Tower selection via number keys
            if (keys[e.key]) {
                this.selectTowerType(keys[e.key]);
                soundEffects.click();
            }
            // Upgrade tower
            else if ((e.key === 'u' || e.key === 'U') && this.selectedTower) {
                this.upgradeTower();
            }
            // Sell tower (Shift+S to prevent accidental sells)
            else if (e.key === 'Delete' && this.selectedTower) {
                this.sellTower();
            }
            // ESC - Cancel selection / Close modals
            else if (e.key === 'Escape') {
                this.cancelSelection();
                this.hideMapSelector();
            }
            // Space - Start wave (only when overlay is hidden / game mode selected)
            else if (e.key === ' ') {
                e.preventDefault();
                const overlay = document.getElementById('game-overlay');
                const overlayVisible = overlay && !overlay.classList.contains('hidden');
                if (!this.waveInProgress && !overlayVisible) {
                    this.startWave();
                }
            }
            // P - Pause/Unpause
            else if (e.key === 'p' || e.key === 'P') {
                if (this.canPause !== false) {
                    this.togglePause();
                    soundEffects.click();
                }
            }
            // R - Restart (with confirmation)
            else if (e.key === 'r' || e.key === 'R') {
                if (e.shiftKey) {
                    this.reset();
                    soundEffects.click();
                }
            }
            // Hero abilities
            else if (e.key === 'q' || e.key === 'Q') {
                if (this.heroAbilities.isReady('meteor')) {
                    const centerX = this.canvas.width / 2;
                    const centerY = this.canvas.height / 2;
                    this.heroAbilities.useMeteor(centerX, centerY);
                }
            } else if (e.key === 'w' || e.key === 'W') {
                if (!e.ctrlKey) { // Don't trigger on Ctrl+W
                    this.heroAbilities.useTimeFreeze();
                }
            } else if (e.key === 'e' || e.key === 'E') {
                this.heroAbilities.useGoldRush();
            }
        });
        
        // Right-click to cancel tower placement
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.cancelSelection();
        });
        
        // Map Selector
        document.getElementById('map-select-btn')?.addEventListener('click', () => {
            this.showMapSelector();
        });
        
        document.getElementById('map-selector-close')?.addEventListener('click', () => {
            this.hideMapSelector();
        });
    }

    setupGameBridge() {
        if (window.GameBridge) {
            window.GameBridge.on('settings', (settings) => {
                if (settings.soundVolume !== undefined) {
                    soundEffects.setVolume(settings.soundVolume);
                }
                if (settings.soundEnabled !== undefined) {
                    soundEffects.setEnabled(settings.soundEnabled);
                }
            });

            window.GameBridge.on('pause', () => {
                if (this.canPause !== false && !this.paused) {
                    this.togglePause();
                }
            });

            window.GameBridge.on('resume', () => {
                if (this.paused) {
                    this.togglePause();
                }
            });

            window.GameBridge.on('pauseToggle', () => {
                if (this.canPause !== false) {
                    this.togglePause();
                }
            });
        }
    }

    // Show Map Selector Modal
    showMapSelector() {
        const modal = document.getElementById('map-selector');
        if (!modal) return;
        
        modal.classList.remove('hidden');
        this.populateMapSelector();
    }

    // Hide Map Selector Modal
    hideMapSelector() {
        const modal = document.getElementById('map-selector');
        if (modal) modal.classList.add('hidden');
    }

    // Populate Map Selector with available maps
    populateMapSelector() {
        const storyMapsEl = document.getElementById('story-maps');
        const advancedMapsEl = document.getElementById('advanced-maps');
        
        if (!storyMapsEl || !advancedMapsEl) return;
        
        // Clear existing
        storyMapsEl.innerHTML = '';
        advancedMapsEl.innerHTML = '';
        
        // Get all maps from MAPS constant
        Object.values(MAPS).forEach(map => {
            const card = document.createElement('div');
            card.className = 'map-card';
            if (this.currentMapId === map.id) {
                card.classList.add('selected');
            }
            
            const diffClass = `difficulty-${map.difficulty?.replace(/\s+/g, '-').replace('very hard', 'hard')}`;
            
            card.innerHTML = `
                <div class="map-card-name">${map.name}</div>
                <div class="map-card-difficulty ${diffClass}">${map.difficulty || 'Normal'}</div>
                <div class="map-card-desc">${map.description || ''}</div>
            `;
            
            card.addEventListener('click', () => {
                this.selectMap(map.id);
            });
            
            // Put maps 1-15 in story, 16+ in advanced
            if (map.id <= 15) {
                storyMapsEl.appendChild(card);
            } else {
                advancedMapsEl.appendChild(card);
            }
        });
    }

    // Select a map and apply it
    selectMap(mapId) {
        const mapData = getMap(mapId);
        if (!mapData) {
            console.error('Map not found:', mapId);
            return;
        }
        
        this.currentMapId = mapId;
        this.currentMap = mapData.grid;
        this.gold = mapData.startGold || 100;
        this.lives = mapData.startLives || 20;
        
        // Recalculate path
        this.path = this.calculatePath();
        
        // Update displays
        this.updateGoldDisplay();
        this.updateLivesDisplay();
        
        // Hide selector and reset
        this.hideMapSelector();
        this.reset();
        
        // Show feedback
        console.log(`Loaded map: ${mapData.name}`);
    }

    // Start a game mode
    startMode(mode, options = {}) {
        this.gameModes.setMode(mode, options);
        this.gameModes.showModeUI();
        this.reset();
        // After reset (which sets state to MENU), hide overlay and start the game loop
        this._hideOverlay();
        this.start();
    }

    // Load a specific level from story mode
    loadLevel(levelId) {
        const map = getMap(levelId);
        if (!map) {
            console.error('Map not found:', levelId);
            return;
        }

        this.currentMapId = levelId;
        this.currentMap = map.grid;
        this.gold = map.startGold || 150;
        this.lives = map.startLives || 20;
        
        // Track current level for story progression
        this.storyMode.setCurrentLevel(levelId);
        
        // Recalculate path for new map
        this.path = calculatePath(this.currentMap);
        
        // Set game mode to story
        this.gameModes.currentMode = 'story';
        
        this.reset();
        this._hideOverlay();
        this.start();
        
        // Show intro dialogue if available
        const chapter = this.storyMode.getChapterForLevel(levelId);
        if (chapter && chapter.levels[0] === levelId) {
            // First level of chapter
            this.storyMode.showDialogue(`chapter_${chapter.id}_start`);
        }
    }

    // Cancel current selection
    cancelSelection() {
        this.selectedTowerType = null;
        this.selectedTower = null;
        
        // Update UI
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        this.updateTowerInfo(null);
        soundEffects.click();
    }

    // Add gold with multiplier
    addGold(amount) {
        const goldGained = Math.floor(amount * (this.goldMultiplier || 1));
        this.gold += goldGained;
        this.stats.totalGold += goldGained;
        this.achievementSystem.incrementProgress('total_gold', goldGained);
        this.updateGoldDisplay();
        
        // Visual feedback for gold gain
        if (goldGained > 0) {
            this.showFloatingText(`+${goldGained}`, this.canvas.width - 80, 30, '#ffcc00');
        }
    }

    // Add score with multiplier
    addScore(amount) {
        const scoreGained = Math.floor(amount * (this.scoreMultiplier || 1));
        this.score = (this.score || 0) + scoreGained;
        const scoreEl = document.querySelector('.score-value');
        if (scoreEl) scoreEl.textContent = this.score;

        // SDK: Submit score
        if (this.hubSDK) {
            this.hubSDK.submitScore(this.score);
        }
    }
    
    // Show floating text on canvas
    showFloatingText(text, x, y, color = '#fff') {
        this.floatingTexts = this.floatingTexts || [];
        this.floatingTexts.push({
            text, x, y, 
            color,
            alpha: 1.0,
            life: 1.5
        });
    }

    selectTowerType(type) {
        // Mode Restriction: Restricted Towers
        if (this.restrictedTowers && this.restrictedTowers.includes(type)) {
            soundEffects.hit();
            // Show feedback
            const btn = document.querySelector(`.tower-btn[data-tower="${type}"]`);
            if(btn) {
                btn.classList.add('shake');
                setTimeout(() => btn.classList.remove('shake'), 500);
            }
            return;
        }

        const tower = TOWERS[type];
        if (this.gold < tower.cost) return;

        this.selectedTowerType = type;
        this.selectedTower = null;

        // Update UI
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.tower === type);
        });

        this.updateTowerInfo(type);
    }

    updateTowerInfo(type) {
        const infoEl = document.getElementById('tower-info');
        if (!infoEl) return;

        if (type) {
            const tower = TOWERS[type];
            infoEl.innerHTML = `
                <p><strong>${tower.name}</strong></p>
                <p>Damage: ${tower.damage} | Range: ${tower.range}</p>
                <p>Fire Rate: ${(1 / tower.fireRate).toFixed(1)}/s</p>
                ${tower.splash ? `<p>Splash: ${tower.splash}px</p>` : ''}
                ${tower.slow ? `<p>Slow: ${tower.slow * 100}%</p>` : ''}
            `;
        } else if (this.selectedTower) {
            const tower = this.selectedTower;
            const upgradeCost = Math.floor(tower.baseCost * 0.75 * tower.level);
            const sellValue = Math.floor(tower.totalCost * 0.5);
            infoEl.innerHTML = `
                <p><strong>${tower.name}</strong> (Lv.${tower.level})</p>
                <p>Damage: ${tower.damage.toFixed(0)} | Range: ${tower.range.toFixed(0)}</p>
                <div class="tower-actions">
                    <button onclick="window.game.upgradeTower()" ${this.gold < upgradeCost ? 'disabled' : ''}>
                        Upgrade (${upgradeCost})
                    </button>
                    <button onclick="window.game.sellTower()">Sell (${sellValue})</button>
                </div>
            `;
        } else {
            infoEl.innerHTML = '<p>Select a tower and click on the map to place it.</p>';
        }
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const cellX = Math.floor(x / CELL_SIZE);
        const cellY = Math.floor(y / CELL_SIZE);

        // Check if clicking on existing tower
        const existingTower = this.towers.find(t => t.cellX === cellX && t.cellY === cellY);

        if (existingTower) {
            this.selectedTower = existingTower;
            this.selectedTowerType = null;
            document.querySelectorAll('.tower-btn').forEach(btn => btn.classList.remove('selected'));
            this.updateTowerInfo(null);
            return;
        }

        // Place new tower
        if (this.selectedTowerType && this.canPlaceTower(cellX, cellY)) {
            this.placeTower(cellX, cellY);
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        this.hoverCell = {
            x: Math.floor(x / CELL_SIZE),
            y: Math.floor(y / CELL_SIZE)
        };
    }

    canPlaceTower(cellX, cellY) {
        // Check bounds
        if (cellX < 0 || cellX >= COLS || cellY < 0 || cellY >= ROWS) return false;

        // Check if path or obstacle (with fallback to default map)
        const map = this.currentMap || MAP;
        if (!map[cellY]) return false;
        const cellType = map[cellY][cellX];
        if (cellType !== 0) return false;

        // Check if tower already exists
        if (this.towers.some(t => t.cellX === cellX && t.cellY === cellY)) return false;

        return true;
    }

    placeTower(cellX, cellY) {
        const type = this.selectedTowerType;
        const template = TOWERS[type];

        if (this.gold < template.cost) return;

        this.gold -= template.cost;
        soundEffects.click();

        const newTower = {
            type,
            name: template.name,
            cellX,
            cellY,
            x: cellX * CELL_SIZE + CELL_SIZE / 2,
            y: cellY * CELL_SIZE + CELL_SIZE / 2,
            damage: template.damage,
            range: template.range,
            fireRate: template.fireRate,
            color: template.color,
            projectileSpeed: template.projectileSpeed,
            splash: template.splash || 0,
            slow: template.slow || 0,
            isBeam: template.isBeam || false,
            cooldown: 0,
            target: null,
            level: 1,
            baseCost: template.cost,
            totalCost: template.cost
        };
        
        this.towers.push(newTower);
        this.updateGoldDisplay();
        
        // Sync in multiplayer
        if (this.isMultiplayer) {
            this.multiplayer.syncTowerPlaced({
                x: newTower.x,
                y: newTower.y,
                type: newTower.type,
                gridX: cellX,
                gridY: cellY
            });
            this.multiplayer.syncGold(this.gold);
        }
    }

    upgradeTower() {
        if (!this.selectedTower) return;
        
        // Mode Restriction: No Upgrades
        if (this.canUpgrade === false) {
             const infoEl = document.getElementById('tower-info');
             if(infoEl) {
                 const original = infoEl.innerHTML;
                 infoEl.innerHTML = `<p style="color:#ff0055">UPGRADES DISABLED IN THIS MODE</p>`;
                 setTimeout(() => this.updateTowerInfo(null), 1500);
             }
             soundEffects.hit();
             return;
        }

        const tower = this.selectedTower;
        const cost = Math.floor(tower.baseCost * 0.75 * tower.level);

        if (this.gold < cost) return;

        this.gold -= cost;
        tower.level++;
        tower.damage *= 1.3;
        tower.range *= 1.1;
        tower.totalCost += cost;

        soundEffects.powerUp();
        this.updateGoldDisplay();
        this.updateTowerInfo(null);
        
        // Sync in multiplayer
        if (this.isMultiplayer) {
            this.multiplayer.syncTowerUpgraded(null, tower.cellX, tower.cellY);
            this.multiplayer.syncGold(this.gold);
        }
    }

    sellTower() {
        if (!this.selectedTower) return;

        const tower = this.selectedTower;
        const value = Math.floor(tower.totalCost * 0.5);

        this.gold += value;
        this.towers = this.towers.filter(t => t !== tower);
        this.selectedTower = null;

        soundEffects.click();
        this.updateGoldDisplay();
        this.updateTowerInfo(null);
        
        // Sync in multiplayer
        if (this.isMultiplayer) {
            this.multiplayer.syncTowerSold(null, tower.cellX, tower.cellY);
            this.multiplayer.syncGold(this.gold);
        }
    }

    onReset() {
        this.gold = 100;
        this.lives = 20;
        this.wave = 0;
        this.score = 0;
        this.waveInProgress = false;

        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];

        this.selectedTowerType = null;
        this.selectedTower = null;
        
        // Recalculate path for current map
        this.path = this.calculatePath();

        this.updateGoldDisplay();
        this.updateLivesDisplay();
        this.updateWaveDisplay();
        this.updateTowerInfo(null);
        this.updateTowerButtons();

        this.render();
    }

    onStart() {
        // Game already starts from reset, just hide overlay
        this._hideOverlay();
    }

    startWave() {
        if (this.waveInProgress) return;

        this.wave++;
        this.waveInProgress = true;
        this.updateWaveDisplay();
        this._hideOverlay();
        this.start();
        
        // Sync wave start in multiplayer (host only)
        if (this.isMultiplayer) {
            this.multiplayer.syncWaveStart(this.wave);
        }

        // Get wave configuration based on game mode
        let enemyCount, types;

        if (this.gameModes.currentMode === GAME_MODES.ENDLESS) {
            const data = this.gameModes.getEndlessWaveData(this.wave);
            enemyCount = data.enemyCount;
            types = data.types;
        } else {
            // Standard progression
            enemyCount = 5 + this.wave * 2;
            types = ['basic'];
            if (this.wave >= 3) types.push('fast');
            if (this.wave >= 5) types.push('tank');
            if (this.wave >= 8) types.push('flying');
            if (this.wave >= 10) types.push('armored');
            if (this.wave >= 12) types.push('healer');
            if (this.wave >= 15) types.push('spawner');
            if (this.wave % 5 === 0) types.push('boss');
            
            // Story mode specific overrides could go here
            if (this.storyMode) {
                 // Adjust difficulty based on map/chapter
            }
        }

        const interval = Math.max(200, 1000 - this.wave * 20); // Spawn faster as waves progress

        // Track pending enemy spawns to prevent false wave completion
        this.pendingEnemies = enemyCount;

        for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => {
                const type = types[randomInt(0, types.length - 1)];
                this.spawnEnemy(type);
                this.pendingEnemies--;
            }, i * interval);
        }
        
        // Check achievements
        this.achievementSystem.checkProgressAchievements('total_waves');
    }

    spawnEnemy(type) {
        const template = ENEMIES[type];
        // Handle multiple start points if map has them
        const startPoints = this.path[0] ? [this.path[0]] : [];
        
        // If map has multiple paths defined (handled in MapData but simplified here for now)
        // For now just use the calculated path start
        const start = startPoints[randomInt(0, startPoints.length - 1)];

        if (!start) return;

        // Apply wave multiplier to HP
        const waveMult = this.waveMultiplier || 1.0;
        const hpMultiplier = (1 + this.wave * 0.1) * waveMult;

        this.enemies.push({
            type,
            name: template.name,
            x: start.x,
            y: start.y,
            hp: template.hp * hpMultiplier,
            maxHp: template.hp * hpMultiplier,
            speed: template.speed,
            baseSpeed: template.speed,
            reward: template.reward,
            color: template.color,
            size: template.size,
            pathIndex: 0,
            slowTimer: 0,
            poisonTimer: 0,
            poisonDamage: 0,
            isFlying: template.isFlying || false,
            armor: template.armor || 0,
            healCooldown: 0,
            spawnOnDeath: template.spawnType
        });
    }

    update(dt) {
        // Update new systems
        this.heroAbilities.update(dt);
        this.gameModes.updateUI(dt);

        // Update enemies
        this.updateEnemies(dt);

        // Update towers
        this.updateTowers(dt);

        // Update projectiles
        this.updateProjectiles(dt);

        // Update particles
        this.updateParticles(dt);
        
        // Update floating texts
        this.updateFloatingTexts(dt);

        // Update tower button states
        this.updateTowerButtons();
        
        // Update ability UI
        this.heroAbilities.renderUI();

        // Check wave complete - only when no enemies AND no pending spawns
        if (this.waveInProgress && this.enemies.length === 0 && this.pendingEnemies === 0) {
            this.handleWaveComplete();
        }
    }
    
    // Update floating text positions and lifetimes
    updateFloatingTexts(dt) {
        if (!this.floatingTexts) return;
        
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= dt;
            ft.y -= 30 * dt; // Float upward
            ft.alpha = Math.max(0, ft.life / 1.5);
            
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    handleWaveComplete() {
        this.waveInProgress = false;
        
        // Wave complete bonus
        const waveBonus = 20 + this.wave * 5;
        this.addGold(waveBonus);
        
        // Heal player slightly
        if (this.lives < 20) {
            this.lives = Math.min(20, this.lives + 1);
            this.updateLivesDisplay();
        }
        
        this.achievementSystem.incrementProgress('total_waves');
        
        // Show wave complete banner (NOT the full overlay)
        this.showWaveBanner(this.wave, waveBonus);
        
        // Check achievements
        if (this.wave === 10) this.achievementSystem.tryUnlock('waves_10');
        if (this.wave === 50) this.achievementSystem.tryUnlock('waves_50');
        
        // Check for victory in Classic/Story modes (10 waves = victory)
        const mode = this.gameModes.currentMode;
        const victoryWaves = mode === GAME_MODES.CLASSIC || mode === 'story' || !mode ? 10 : 0;
        
        if (victoryWaves > 0 && this.wave >= victoryWaves) {
            // Victory! Player completed all waves for this mode/level
            setTimeout(() => {
                this.gameOver(true);
            }, 2000); // Wait for banner to disappear first
            return;
        }
        
        // For endless/other modes, just let player continue
        // Update start button text
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.textContent = `▶ Start Wave ${this.wave + 1}`;
        }
    }

    updateEnemies(dt) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            // Update slow effect
            if (enemy.slowTimer > 0) {
                enemy.slowTimer -= dt;
                if (enemy.slowTimer <= 0 && !enemy.timeFrozen) {
                    enemy.speed = enemy.baseSpeed;
                }
            }
            
            // Update poison effect
            if (enemy.poisonTimer > 0) {
                enemy.poisonTimer -= dt;
                enemy.hp -= enemy.poisonDamage * dt;
                // Visual feedback for poison could go here
            }
            
            // Update healer logic
            if (enemy.type === 'healer') {
                enemy.healCooldown -= dt;
                if (enemy.healCooldown <= 0) {
                    enemy.healCooldown = 2.0; // Heal every 2s
                    // Heal nearby enemies
                    for (const other of this.enemies) {
                        if (other !== enemy && Math.hypot(other.x - enemy.x, other.y - enemy.y) < 80) {
                            other.hp = Math.min(other.maxHp, other.hp + 20);
                            this.spawnParticle(other.x, other.y, '#00ff88', 2);
                        }
                    }
                }
            }

            // Move along path
            // Flying enemies might skip corners or follow straight line to end?
            // For now they follow path but ignore ground effects (logic handled in tower targeting usually)
            
            const target = this.path[enemy.pathIndex + 1];
            if (!target) {
                // Reached end
                this.enemies.splice(i, 1);
                this.lives--;
                this.updateLivesDisplay();
                soundEffects.hit();
                
                // Survival Mode: Instant Death on Leak
                if (this.lives <= 0 || (this.gameModes.currentMode === 'survival' && this.lives < 1)) {
                    this.lives = 0;
                    this.gameOver(false);
                    return; // Stop processing
                }
                
                // Screen shake
                if (this.camera) this.camera.shake(5, 0.2);

                if (this.lives <= 0) {
                    this.gameOver(false);
                } else if (this.lives === 1) {
                    // Last stand warning
                }
                continue;
            }

            const dx = target.x - enemy.x;
            const dy = target.y - enemy.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 5) {
                enemy.pathIndex++;
            } else {
                enemy.x += (dx / dist) * enemy.speed * dt;
                enemy.y += (dy / dist) * enemy.speed * dt;
            }

            // Check death
            if (enemy.hp <= 0) {
                this.enemies.splice(i, 1);
                
                // Rewards
                this.addGold(enemy.reward);
                this.addScore(enemy.reward * 10);
                this.stats.totalKills++;
                this.achievementSystem.incrementProgress('total_kills');
                
                // Death Effects
                this.spawnExplosion(enemy.x, enemy.y, enemy.color);
                soundEffects.explosion();
                
                // Spawner logic
                if (enemy.spawnOnDeath) {
                    for (let j = 0; j < 3; j++) {
                         this.spawnEnemyChild(enemy.spawnOnDeath, enemy.x, enemy.y, enemy.pathIndex);
                    }
                }
                
                // Boss achievements
                if (enemy.type === 'boss') {
                    this.achievementSystem.tryUnlock('first_boss');
                }
            }
        }
    }

    // Spawn child enemy (for spawner)
    spawnEnemyChild(type, x, y, pathIndex) {
        const template = ENEMIES[type];
        this.enemies.push({
            type,
            name: template.name,
            x: x + randomInt(-10, 10),
            y: y + randomInt(-10, 10),
            hp: template.hp * 0.5, // Weaker than normal
            maxHp: template.hp * 0.5,
            speed: template.speed,
            baseSpeed: template.speed,
            reward: Math.floor(template.reward / 2),
            color: template.color,
            size: Math.max(8, template.size * 0.8),
            pathIndex: pathIndex,
            slowTimer: 0
        });
    }

    updateTowers(dt) {
        for (const tower of this.towers) {
            tower.cooldown -= dt;

            // Find target
            let closestEnemy = null;
            let closestDist = tower.range;

            for (const enemy of this.enemies) {
                const dist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestEnemy = enemy;
                }
            }

            tower.target = closestEnemy;

            // Fire
            if (tower.cooldown <= 0 && closestEnemy) {
                tower.cooldown = tower.fireRate;

                if (tower.isBeam) {
                    // Beam tower damages directly - apply per frame
                    const beamDamage = tower.damage * dt * 3;
                    closestEnemy.hp -= beamDamage;
                    
                    // Visual feedback
                    if (Math.random() < 0.2) {
                        this.spawnParticle(closestEnemy.x, closestEnemy.y, tower.color, 1);
                    }
                } else {
                    // Projectile tower - store TARGET REFERENCE not index!
                    this.projectiles.push({
                        x: tower.x,
                        y: tower.y,
                        target: closestEnemy, // Fixed: use object reference
                        damage: tower.damage,
                        speed: tower.projectileSpeed || 300,
                        splash: tower.splash || 0,
                        slow: tower.slow || 0,
                        color: tower.color,
                        type: tower.type,
                        isCrit: tower.critChance && Math.random() < tower.critChance,
                        poisonDamage: tower.poisonDamage || 0,
                        poisonDuration: tower.poisonDuration || 0
                    });
                    soundEffects.shoot();
                }
            }
        }
    }

    shootProjectile(tower, target) {
        // Critical hit check (Sniper)
        let isCrit = false;
        if (tower.type === 'sniper' && Math.random() < 0.25) {
            isCrit = true;
        }

        this.projectiles.push({
            x: tower.x,
            y: tower.y,
            target: target,
            speed: tower.projectileSpeed,
            damage: tower.damage * (isCrit ? 2.0 : 1.0),
            color: tower.color,
            splash: tower.splash || 0,
            slow: tower.slow || 0,
            type: tower.type,
            isCrit: isCrit,
            poisonDamage: tower.poisonDamage || 0,
            poisonDuration: tower.poisonDuration || 0
        });

        soundEffects.shoot();
        if (tower.type === 'sniper') soundEffects.click(); // Distinct sound for sniper
    }

    updateProjectiles(dt) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            // Check if target exists and is alive
            if (!proj.target || !this.enemies.includes(proj.target)) {
                 this.projectiles.splice(i, 1);
                 continue;
            }
            
            const target = proj.target;

            const dx = target.x - proj.x;
            const dy = target.y - proj.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 10) {
                // Hit target
                // Calculate damage reduction from armor
                let damage = proj.damage;
                if (target.armor > 0 && proj.type !== 'sniper') { // Sniper pierces armor? or maybe High damage overcomes it
                    damage *= (1 - target.armor);
                }
                
                target.hp -= damage;
                
                // Show floating text for crits
                if (proj.isCrit) {
                     // TODO: FloatingText.create(target.x, target.y, 'CRITICAL!', '#ff0000');
                     this.spawnParticle(target.x, target.y, '#ff0000', 5);
                }

                // Splash damage
                if (proj.splash > 0) {
                    this.spawnExplosion(proj.x, proj.y, proj.color, 0.5); // Small explosion
                    for (const enemy of this.enemies) {
                        if (enemy !== target) {
                            const splashDist = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
                            if (splashDist < proj.splash) {
                                enemy.hp -= damage * 0.5;
                            }
                        }
                    }
                }

                // Slow effect
                if (proj.slow > 0) {
                    target.speed = target.baseSpeed * (1 - proj.slow);
                    target.slowTimer = 2; // 2 seconds slow
                }
                
                // Poison effect
                if (proj.type === 'poison') {
                    target.poisonTimer = proj.poisonDuration;
                    target.poisonDamage = proj.poisonDamage;
                }

                this.projectiles.splice(i, 1);
            } else {
                proj.x += (dx / dist) * proj.speed * dt;
                proj.y += (dy / dist) * proj.speed * dt;
            }
        }
    }

    spawnExplosion(x, y, color, scale = 1) {
        for (let i = 0; i < 8; i++) {
            const angle = random(0, Math.PI * 2);
            const speed = random(30, 80);
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.4 * scale,
                maxLife: 0.4 * scale,
                size: random(3, 6) * scale,
                color
            });
        }
    }

    spawnParticle(x, y, color, count = 1) {
        for(let i=0; i<count; i++) {
             const angle = random(0, Math.PI * 2);
             this.particles.push({
                x, y,
                vx: Math.cos(angle) * random(10, 30),
                vy: Math.sin(angle) * random(10, 30),
                life: 0.5,
                maxLife: 0.5,
                size: random(2, 4),
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

    updateGoldDisplay() {
        const el = document.getElementById('gold-display');
        if (el) {
            const span = el.querySelector('span:last-child');
            if (span) span.textContent = this.gold;
        }
    }

    updateLivesDisplay() {
        const el = document.getElementById('lives-display');
        if (el) {
            const span = el.querySelector('span:last-child');
            if (span) span.textContent = this.lives;
        }
    }

    updateWaveDisplay() {
        const el = document.querySelector('.wave-value');
        if (el) el.textContent = this.wave;
    }

    updateTowerButtons() {
        document.querySelectorAll('.tower-btn').forEach(btn => {
            const type = btn.dataset.tower;
            const cost = TOWERS[type].cost;
            btn.classList.toggle('disabled', this.gold < cost);
        });
    }

    render() {
        const ctx = this.ctx;

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw map
        this.renderMap();

        // Draw path preview
        if (this.selectedTowerType && this.hoverCell && this.canPlaceTower(this.hoverCell.x, this.hoverCell.y)) {
            this.renderTowerPreview();
        }

        // Draw towers
        this.renderTowers();

        // Draw enemies
        this.renderEnemies();

        // Draw projectiles
        this.renderProjectiles();

        // Draw particles
        this.renderParticles();
        
        // Draw floating texts
        this.renderFloatingTexts();

        // Draw selected tower range
        if (this.selectedTower) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.selectedTower.x, this.selectedTower.y, this.selectedTower.range, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw control hints on canvas (if game not started)
        if (!this.waveInProgress && this.wave === 0) {
            this.renderControlHints();
        }
    }
    
    // Render floating combat/gold texts
    renderFloatingTexts() {
        if (!this.floatingTexts || this.floatingTexts.length === 0) return;
        
        const ctx = this.ctx;
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px Orbitron, sans-serif';
        
        for (const ft of this.floatingTexts) {
            ctx.globalAlpha = ft.alpha;
            ctx.fillStyle = ft.color;
            ctx.shadowColor = ft.color;
            ctx.shadowBlur = 5;
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
    
    // Render helpful control hints on canvas
    renderControlHints() {
        const ctx = this.ctx;
        ctx.save();
        
        ctx.font = '12px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
        
        const hints = [
            '1-7: Select Tower',
            'CLICK: Place Tower',
            'ESC: Cancel',
            'SPACE: Start Wave'
        ];
        
        const startY = this.canvas.height - 60;
        hints.forEach((hint, i) => {
            ctx.fillText(hint, this.canvas.width / 2, startY + i * 16);
        });
        
        ctx.restore();
    }

    renderMap() {
        const ctx = this.ctx;
        const time = performance.now() / 1000;

        // Dark digital background
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Animated Grid
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
        ctx.lineWidth = 1;
        
        // Draw grid slightly offset based on time for subtle "scanning" effect
        const offset = (time * 10) % CELL_SIZE;
        
        for (let x = 0; x <= this.canvas.width; x += CELL_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= this.canvas.height; y += CELL_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }

        // Render Tiles
        const map = this.currentMap || MAP;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (!map[y]) continue;
                const tile = map[y][x];
                const px = x * CELL_SIZE;
                const py = y * CELL_SIZE;
                const cx = px + CELL_SIZE/2;
                const cy = py + CELL_SIZE/2;

                if (tile === 1 || tile === 2 || tile === 3) {
                    // Path - "Data Stream"
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                    ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                    
                    // Glowing edges for path
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = 'rgba(0, 240, 255, 0.2)';
                    ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
                    ctx.fillRect(px + 4, py + 4, CELL_SIZE - 8, CELL_SIZE - 8);
                    ctx.shadowBlur = 0;

                    if (tile === 2) {
                        // Start Portal
                        const pulse = 1 + Math.sin(time * 5) * 0.2;
                        ctx.fillStyle = '#00ff88';
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = '#00ff88';
                        ctx.beginPath();
                        ctx.arc(cx, cy, 10 * pulse, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 12px Orbitron';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('START', cx, cy - 20);
                        ctx.shadowBlur = 0;
                    } else if (tile === 3) {
                        // End Portal
                        const pulse = 1 + Math.cos(time * 5) * 0.2;
                        ctx.fillStyle = '#ff0055';
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = '#ff0055';
                        ctx.beginPath();
                        ctx.arc(cx, cy, 10 * pulse, 0, Math.PI*2);
                        ctx.fill();
                        
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 12px Orbitron';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('BASE', cx, cy - 20);
                        ctx.shadowBlur = 0;
                    }
                } else if (tile === 4) {
                    // Obstacle - "Glitch Block"
                    ctx.fillStyle = '#1a1a2e';
                    ctx.strokeStyle = '#ff0055';
                    ctx.lineWidth = 1;
                    ctx.fillRect(px + 4, py + 4, CELL_SIZE - 8, CELL_SIZE - 8);
                    
                    // Glitch lines
                    if (Math.random() < 0.05) {
                        ctx.fillStyle = '#ff0055';
                        ctx.fillRect(px + randomInt(4, 28), py + randomInt(4, 28), randomInt(2, 10), 2);
                    }
                    
                    ctx.strokeRect(px + 4, py + 4, CELL_SIZE - 8, CELL_SIZE - 8);
                }
            }
        }
        
        // Draw moving data bits on path
        if (this.path && this.path.length > 0) {
            const pathOffset = (time * 50) % 100; // Moving offset
            ctx.fillStyle = '#00f0ff';
            for (let i = 0; i < this.path.length; i+=2) {
                // Determine direction
                const p = this.path[i];
                 if(Math.random() < 0.3) {
                     ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
                 }
            }
        }
    }

    renderTowerPreview() {
        const ctx = this.ctx;
        const tower = TOWERS[this.selectedTowerType];
        const x = this.hoverCell.x * CELL_SIZE + CELL_SIZE / 2;
        const y = this.hoverCell.y * CELL_SIZE + CELL_SIZE / 2;

        // Range circle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(x, y, tower.range, 0, Math.PI * 2);
        ctx.fill();

        // Tower preview
        ctx.fillStyle = tower.color + '80';
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTowers() {
        const ctx = this.ctx;

        for (const tower of this.towers) {
            const cx = tower.x;
            const cy = tower.y;
            
            // Tower Base - Hexagon or Tech Circle
            ctx.fillStyle = '#0a0a15';
            ctx.strokeStyle = tower.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Glowing core
            ctx.shadowBlur = 10;
            ctx.shadowColor = tower.color;
            ctx.fillStyle = tower.color;
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Turret Head Rotation
            ctx.save();
            ctx.translate(cx, cy);
            
            // Calculate angle to target
            if (tower.target) {
                // Interpolate angle for smooth turning if we stored prevAngle
                // For now just face target
                tower.angle = Math.atan2(tower.target.y - tower.y, tower.target.x - tower.x);
            }
            if (tower.angle) ctx.rotate(tower.angle);
            
            // Draw Turret Barrel based on Type
            ctx.fillStyle = '#fff';
            
            if (tower.type === 'cannon') {
                // Heavy barrel
                ctx.fillRect(0, -6, 20, 12);
                ctx.fillStyle = tower.color;
                ctx.fillRect(4, -4, 12, 8);
            } else if (tower.type === 'sniper') {
                // Long thin barrel
                ctx.fillRect(0, -2, 28, 4);
                // Scope
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(8, -5, 3, 0, Math.PI*2); ctx.fill();
            } else if (tower.type === 'arrow' || tower.type === 'poison') {
                // Triangle / Sharp
                 ctx.beginPath();
                 ctx.moveTo(15, 0);
                 ctx.lineTo(-5, 6);
                 ctx.lineTo(-5, -6);
                 ctx.fill();
            } else if (tower.type === 'tesla' || tower.type === 'laser') {
                // Energy crystal/coil
                ctx.fillStyle = tower.color;
                ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
                // Prongs
                ctx.fillStyle = '#ccc';
                ctx.fillRect(6, -8, 10, 4);
                ctx.fillRect(6, 4, 10, 4);
            } else if (tower.type === 'ice') {
                 // Snowflake / Crystal shape
                 ctx.fillStyle = '#ccffff';
                 ctx.fillRect(-8, -8, 16, 16);
            } else {
                 // Default gun
                 ctx.fillRect(0, -3, 16, 6);
            }
            
            ctx.restore();

            // Level indicator (pips instead of text)
            for (let i = 0; i < tower.level; i++) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(cx - 6 + (i * 5), cy + 16, 3, 3);
            }

            // Beam visuals
            if (tower.isBeam && tower.target) {
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                
                // Main Beam
                ctx.strokeStyle = tower.color;
                ctx.lineWidth = 3 + tower.level;
                ctx.shadowBlur = 15;
                ctx.shadowColor = tower.color;
                ctx.beginPath();
                ctx.moveTo(tower.x, tower.y);
                ctx.lineTo(tower.target.x, tower.target.y);
                ctx.stroke();
                
                // White Core
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.shadowBlur = 0;
                ctx.stroke();
                
                // Impact spark
                this.spawnParticle(tower.target.x, tower.target.y, tower.color, 1);
                
                ctx.restore();
            }
        }
    }

    renderEnemies() {
        const ctx = this.ctx;
        const time = performance.now() / 200;

        for (const enemy of this.enemies) {
            ctx.save();
            ctx.translate(enemy.x, enemy.y);
            
            // Pulse effect for damage
            // ... (requires hit timer mechanism implementation)

            // Draw shape based on attributes
            ctx.strokeStyle = enemy.color;
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; // Dark core
            ctx.lineWidth = 2;
            
            // Shadow for glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = enemy.color;
            
            ctx.beginPath();
            if (enemy.speed > 2) {
                // Fast = Triangle pointing forward
                // Need angle of movement
                const angle = 0; // Simplified for now, really need velocity vector
                ctx.rotate(angle);
                ctx.moveTo(enemy.size, 0);
                ctx.lineTo(-enemy.size, -enemy.size);
                ctx.lineTo(-enemy.size, enemy.size);
            } else if (enemy.armor > 0) {
                // Armored = Square
                ctx.rect(-enemy.size, -enemy.size, enemy.size*2, enemy.size*2);
                 // Shield visual
                ctx.strokeStyle = '#fff';
            } else if (enemy.type === 'boss') {
                // Boss = Hexagon + Pulse
                 const s = enemy.size;
                 ctx.moveTo(s, 0);
                 for (let i = 1; i < 6; i++) {
                     ctx.lineTo(s * Math.cos(i * Math.PI / 3), s * Math.sin(i * Math.PI / 3));
                 }
            } else {
                // Normal = Circle
                ctx.arc(0, 0, enemy.size, 0, Math.PI*2);
            }
            
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            // Inner detail
            ctx.fillStyle = enemy.color;
            ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill();

            // Status Effects
            if (enemy.slowTimer > 0) {
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(0,0, enemy.size + 4, 0, Math.PI*2); ctx.stroke();
            }
            if (enemy.poisonTimer > 0) {
                ctx.fillStyle = '#00ff00';
                ctx.beginPath(); ctx.arc(-5, -5, 2, 0, Math.PI*2); ctx.fill();
            }
            
            ctx.restore();

            // Health bar - sleek floating
            const barWidth = enemy.size * 2 + 4;
            const hpPercent = enemy.hp / enemy.maxHp;
            const barY = enemy.y - enemy.size - 10;
            
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(enemy.x - barWidth/2, barY, barWidth, 4);
            
            ctx.fillStyle = hpPercent > 0.5 ? '#00ff88' : '#ff0055';
            ctx.fillRect(enemy.x - barWidth/2, barY, barWidth * hpPercent, 4);
        }
    }

    renderProjectiles() {
        const ctx = this.ctx;
        
        ctx.shadowBlur = 10;
        for (const proj of this.projectiles) {
            ctx.shadowColor = proj.color;
            ctx.fillStyle = proj.color;
            
            ctx.beginPath();
            if (proj.type === 'arrow' || proj.type === 'sniper') {
                 // Elongated bolt
                 // Need rotation - simplified as circle for now but glowing
                 ctx.arc(proj.x, proj.y, 3, 0, Math.PI*2);
            } else {
                 ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
            }
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    renderParticles() {
        const ctx = this.ctx;

        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            
            // Square digital particles
            ctx.fillRect(p.x, p.y, p.size * alpha, p.size * alpha);
        }
        ctx.globalAlpha = 1;
    }

    _showOverlay() {
        const overlay = document.getElementById('game-overlay');
        if (overlay) overlay.classList.remove('hidden');
    }

    _hideOverlay() {
        const overlay = document.getElementById('game-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    // ============================================
    // VICTORY / DEFEAT / PAUSE SCREENS
    // ============================================

    // Show victory screen with stats and stars
    showVictoryScreen(message = 'Level Complete!') {
        const screen = document.getElementById('victory-screen');
        if (!screen) return;

        // Calculate stars (3 stars = 15+ lives, 2 stars = 10+ lives, 1 star = any completion)
        const stars = this.lives >= 15 ? 3 : (this.lives >= 10 ? 2 : 1);
        
        // Complete level in story mode
        if (this.gameModes.currentMode === 'story' && this.storyMode) {
            this.storyMode.completeLevel(
                this.storyMode.currentLevel,
                this.lives,
                20, // totalLives
                this.elapsedTime || 0
            );
        }
        
        // Update UI elements
        document.getElementById('victory-message').textContent = message;
        document.getElementById('victory-waves').textContent = this.wave;
        document.getElementById('victory-score').textContent = this.score.toLocaleString();
        document.getElementById('victory-lives').textContent = this.lives;
        document.getElementById('victory-gold').textContent = this.gold.toLocaleString();
        
        // Update stars display
        const starsContainer = document.getElementById('victory-stars');
        if (starsContainer) {
            const starSpans = starsContainer.querySelectorAll('.star');
            starSpans.forEach((star, i) => {
                star.classList.toggle('earned', i < stars);
            });
        }
        
        // Show/hide next level button based on mode
        const continueBtn = document.getElementById('victory-continue');
        if (continueBtn) {
            // Show next level button only in story mode and if not last level
            const isStoryMode = this.gameModes.currentMode === 'story';
            const hasNextLevel = this.storyMode && this.storyMode.currentLevel < 15;
            continueBtn.style.display = (isStoryMode && hasNextLevel) ? 'flex' : 'none';
        }
        
        // Stop game and show screen
        this.pause();
        this._hideOverlay();
        screen.classList.remove('hidden');
        
        // Setup button handlers
        this.setupVictoryButtons();
    }

    setupVictoryButtons() {
        document.getElementById('victory-continue')?.addEventListener('click', () => {
            this.hideVictoryScreen();
            // Load next level (handled by StoryMode)
            if (this.storyMode) {
                this.storyMode.loadNextLevel();
            }
        }, { once: true });
        
        document.getElementById('victory-retry')?.addEventListener('click', () => {
            this.hideVictoryScreen();
            // In story mode, reload the current level; otherwise restart the mode
            if (this.gameModes.currentMode === 'story' && this.storyMode) {
                this.loadLevel(this.storyMode.currentLevel);
            } else {
                this.startMode(this.gameModes.currentMode || 'classic');
            }
        }, { once: true });
        
        document.getElementById('victory-menu')?.addEventListener('click', () => {
            this.hideVictoryScreen();
            this.reset();
            this._showOverlay();
        }, { once: true });
    }

    hideVictoryScreen() {
        const screen = document.getElementById('victory-screen');
        if (screen) screen.classList.add('hidden');
    }

    // Show defeat screen with stats
    showDefeatScreen(message = 'The enemies broke through!') {
        const screen = document.getElementById('defeat-screen');
        if (!screen) return;

        // Update UI elements
        document.getElementById('defeat-message').textContent = message;
        document.getElementById('defeat-waves').textContent = this.wave;
        document.getElementById('defeat-score').textContent = this.score.toLocaleString();
        document.getElementById('defeat-kills').textContent = this.stats.totalKills.toLocaleString();
        
        // Stop game and show screen
        this.pause();
        this._hideOverlay();
        screen.classList.remove('hidden');
        
        // Setup button handlers
        this.setupDefeatButtons();
    }

    setupDefeatButtons() {
        document.getElementById('defeat-retry')?.addEventListener('click', () => {
            this.hideDefeatScreen();
            // In story mode, reload the current level; otherwise restart the mode
            if (this.gameModes.currentMode === 'story' && this.storyMode) {
                this.loadLevel(this.storyMode.currentLevel);
            } else {
                this.startMode(this.gameModes.currentMode || 'classic');
            }
        }, { once: true });
        
        document.getElementById('defeat-menu')?.addEventListener('click', () => {
            this.hideDefeatScreen();
            this.reset();
            this._showOverlay();
        }, { once: true });
    }

    hideDefeatScreen() {
        const screen = document.getElementById('defeat-screen');
        if (screen) screen.classList.add('hidden');
    }

    // Show pause menu
    showPauseMenu() {
        const screen = document.getElementById('pause-screen');
        if (!screen) return;

        // Update current stats
        document.getElementById('pause-wave').textContent = this.wave;
        document.getElementById('pause-lives').textContent = this.lives;
        document.getElementById('pause-gold').textContent = this.gold;
        
        screen.classList.remove('hidden');
        
        // Setup button handlers
        this.setupPauseButtons();
    }

    setupPauseButtons() {
        document.getElementById('pause-resume')?.addEventListener('click', () => {
            this.hidePauseMenu();
            this.resume();
        }, { once: true });
        
        document.getElementById('pause-restart')?.addEventListener('click', () => {
            this.hidePauseMenu();
            // In story mode, reload the current level; otherwise restart the mode
            if (this.gameModes.currentMode === 'story' && this.storyMode) {
                this.loadLevel(this.storyMode.currentLevel);
            } else {
                this.startMode(this.gameModes.currentMode || 'classic');
            }
        }, { once: true });
        
        document.getElementById('pause-quit')?.addEventListener('click', () => {
            this.hidePauseMenu();
            this.reset();
            this._showOverlay();
        }, { once: true });
    }

    hidePauseMenu() {
        const screen = document.getElementById('pause-screen');
        if (screen) screen.classList.add('hidden');
    }

    // Override base pause/resume to show pause menu
    togglePause() {
        if (this.state === 'playing') {
            super.pause();
            this.showPauseMenu();
        } else if (this.state === 'paused') {
            this.hidePauseMenu();
            super.resume();
        }
    }

    // Show wave complete banner
    showWaveBanner(waveNumber, bonusGold) {
        const banner = document.getElementById('wave-banner');
        if (!banner) return;

        document.getElementById('wave-banner-title').textContent = `Wave ${waveNumber} Complete!`;
        document.getElementById('wave-banner-bonus').textContent = `+${bonusGold}`;
        
        banner.classList.remove('hidden', 'hiding');
        
        // Auto-hide after 2.5 seconds
        setTimeout(() => {
            banner.classList.add('hiding');
            setTimeout(() => {
                banner.classList.add('hidden');
                banner.classList.remove('hiding');
            }, 400);
        }, 2500);
    }

    // Override game over to show proper screens
    gameOver(isWin) {
        if (isWin) {
            this.showVictoryScreen('Victory! All waves cleared!');
        } else {
            this.showDefeatScreen('Your base was destroyed!');
        }
        
        // Sync game over in multiplayer
        if (this.isMultiplayer) {
            this.multiplayer.syncGameOver(isWin);
        }
    }

    // ============================================
    // MULTIPLAYER
    // ============================================

    setupMultiplayerCallbacks() {
        this.multiplayer.callbacks.onRemoteTowerPlaced = (data) => {
            this.onRemoteTowerPlaced(data);
        };
        this.multiplayer.callbacks.onRemoteTowerUpgraded = (data) => {
            this.onRemoteTowerUpgraded(data);
        };
        this.multiplayer.callbacks.onRemoteTowerSold = (data) => {
            this.onRemoteTowerSold(data);
        };
        this.multiplayer.callbacks.onRemoteWaveStart = (wave) => {
            if (!this.multiplayer.isHost) {
                this.wave = wave - 1;
                this.startWave();
            }
        };
        this.multiplayer.callbacks.onRemoteGameOver = (isWin) => {
            if (!this.multiplayer.isHost) {
                if (isWin) {
                    this.showVictoryScreen('Victory! Co-op complete!');
                } else {
                    this.showDefeatScreen('Your base was destroyed!');
                }
            }
        };
    }

    startMultiplayerGame(mapId = 1) {
        this.isMultiplayer = true;
        this.gameModes.currentMode = 'multiplayer';
        
        // Load map
        const map = getMap(mapId);
        if (map) {
            this.currentMapId = mapId;
            this.currentMap = map.grid;
            this.gold = map.startGold || 150;
            this.lives = map.startLives || 20;
            this.path = calculatePath(this.currentMap);
        }
        
        this.reset();
        this._hideOverlay();
        this.start();
    }

    // Handle tower placed by remote player
    onRemoteTowerPlaced(data) {
        const towerType = TOWERS[data.tower.type];
        if (!towerType) return;

        const tower = {
            x: data.tower.x,
            y: data.tower.y,
            gridX: data.tower.gridX,
            gridY: data.tower.gridY,
            type: data.tower.type,
            range: towerType.range,
            damage: towerType.damage,
            attackSpeed: towerType.attackSpeed,
            lastAttack: 0,
            level: 1,
            kills: 0,
            ability: towerType.ability,
            // Multiplayer tracking
            placedBy: data.playerId,
            playerName: data.playerName,
            playerColor: data.playerColor
        };

        this.towers.push(tower);
        this.currentMap[data.tower.gridY][data.tower.gridX] = 2; // Mark as tower
        soundEffects.click();
    }

    // Handle tower upgraded by remote player
    onRemoteTowerUpgraded(data) {
        const tower = this.towers.find(t => t.gridX === data.gridX && t.gridY === data.gridY);
        if (tower && tower.level < 3) {
            tower.level++;
            tower.damage = Math.floor(tower.damage * 1.4);
            tower.range = Math.floor(tower.range * 1.1);
            soundEffects.levelUp();
        }
    }

    // Handle tower sold by remote player
    onRemoteTowerSold(data) {
        const towerIndex = this.towers.findIndex(t => t.gridX === data.gridX && t.gridY === data.gridY);
        if (towerIndex !== -1) {
            const tower = this.towers[towerIndex];
            this.currentMap[tower.gridY][tower.gridX] = 0;
            this.towers.splice(towerIndex, 1);
            soundEffects.click();
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Wire up SPA Back Button
    const backBtn = document.getElementById('td-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.GameBridge) {
                window.GameBridge.exitGame();
            } else {
                window.location.href = '../../index.html';
            }
        });
    }

    window.game = new TowerDefense();
});
