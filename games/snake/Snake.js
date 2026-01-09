/**
 * Snake Game - Ultimate Edition
 * Features: WebGL graphics, multiple game modes, power-ups, levels, achievements, story mode
 */
import { GameEngine, GameState } from '../../js/engine/GameEngine.js';
import { inputManager } from '../../js/engine/InputManager.js';
import { storageManager } from '../../js/engine/StorageManager.js';
import { eventBus, GameEvents } from '../../js/engine/EventBus.js';
import { randomInt } from '../../js/utils/math.js';
import { WebGLRenderer } from './WebGLRenderer.js';
import { WebGPURenderer } from './WebGPURenderer.js';
import { ParticleSystem, WeatherSystem } from './ParticleSystem.js';
import { Camera } from './Camera.js';
import { PhysicsSystem } from './PhysicsSystem.js';
import { StoryMode } from './StoryMode.js';
import { ProgressionSystem, POWER_COMBOS } from './ProgressionSystem.js';
import { MapGenerator, Portal } from './MapGenerator.js';
import { PowerUpShop, ActiveAbilityManager, CollectibleManager } from './ShopAndAbilities.js';
import { DestructibleEnvironment, SecretAreaManager, BattleRoyaleMode, CustomGameCreator } from './AdvancedFeatures.js';
import { PUZZLE_LEVELS, ZenMode } from './GameModes.js';

import { UIManager, SNAKE_SKINS } from './UIManager.js';
import { AudioManager } from './AudioManager.js';
import { AchievementSystem, ACHIEVEMENTS } from './AchievementSystem.js';
import { PolishSystem } from './PolishSystem.js';
import { TrailSystem, LightingSystem, ScreenEffects, IsometricRenderer } from './EnhancedEffects.js';

import { SNAKE_ICONS } from './SnakeIcons.js';

// Direction constants
const DIRECTION = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// ... (OPPOSITE, GameMode, RenderMode consts unchanged) ...

const OPPOSITE = {
    UP: 'DOWN',
    DOWN: 'UP',
    LEFT: 'RIGHT',
    RIGHT: 'LEFT'
};

const GameMode = {
    CLASSIC: 'classic',
    ENDLESS: 'endless',
    TIME_ATTACK: 'timeAttack',
    STORY: 'story',
    MULTIPLAYER: 'multiplayer',
    PUZZLE: 'puzzle',
    ZEN: 'zen'
};

const RenderMode = {
    CANVAS_2D: '2d',
    ISOMETRIC: 'isometric',
    WEBGL: 'webgl',
    WEBGPU: 'webgpu'
};

// Food Types with icons (Replacing Emojis with SVGs)
const FoodTypes = {
    // Basic Foods
    NORMAL: { id: 'normal', color: '#ff4444', points: 10, icon: SNAKE_ICONS.FOOD, chance: 0.35 },
    BONUS: { id: 'bonus', color: '#ffff00', points: 50, icon: SNAKE_ICONS.BONUS, chance: 0.10 },
    
    // Speed Modifiers
    SPEED: { id: 'speed', color: '#00ffff', points: 15, icon: SNAKE_ICONS.BUFF, chance: 0.06, effect: 'speed', duration: 5 },
    SLOW: { id: 'slow', color: '#9966ff', points: 15, icon: SNAKE_ICONS.DEBUFF, chance: 0.06, effect: 'slow', duration: 5 },
    
    // Score Modifiers
    DOUBLE: { id: 'double', color: '#ff00ff', points: 20, icon: SNAKE_ICONS.BONUS, chance: 0.04, effect: 'double', duration: 10 },
    TRIPLE: { id: 'triple', color: '#ffaa00', points: 25, icon: SNAKE_ICONS.BONUS, chance: 0.02, effect: 'triple', duration: 8 },
    
    // Defense
    SHIELD: { id: 'shield', color: '#00ff00', points: 25, icon: SNAKE_ICONS.DEFENSE, chance: 0.04, effect: 'shield', duration: -1 },
    INVINCIBLE: { id: 'invincible', color: '#ffd700', points: 40, icon: SNAKE_ICONS.DEFENSE, chance: 0.015, effect: 'invincible', duration: 5 },
    
    // Movement
    GHOST: { id: 'ghost', color: '#aaaaff', points: 20, icon: SNAKE_ICONS.UTILITY, chance: 0.04, effect: 'ghost', duration: 6 },
    PHASE: { id: 'phase', color: '#88aaff', points: 25, icon: SNAKE_ICONS.UTILITY, chance: 0.03, effect: 'phase', duration: 8 },
    WARP: { id: 'warp', color: '#cc00ff', points: 35, icon: SNAKE_ICONS.SPECIAL, chance: 0.02, effect: 'warp', duration: 0 },
    
    // Size
    SHRINK: { id: 'shrink', color: '#ff8800', points: 30, icon: SNAKE_ICONS.DEBUFF, chance: 0.03, effect: 'shrink', duration: 0 },
    
    // Attraction
    MAGNET: { id: 'magnet', color: '#ff5588', points: 20, icon: SNAKE_ICONS.UTILITY, chance: 0.04, effect: 'magnet', duration: 8 },
    VACUUM: { id: 'vacuum', color: '#8844ff', points: 35, icon: SNAKE_ICONS.UTILITY, chance: 0.02, effect: 'vacuum', duration: 0 },
    
    // Time
    FREEZE: { id: 'freeze', color: '#88ffff', points: 25, icon: SNAKE_ICONS.CLOCK, chance: 0.03, effect: 'freeze', duration: 5 },
    TIME_SLOW: { id: 'time_slow', color: '#aaffaa', points: 30, icon: SNAKE_ICONS.CLOCK, chance: 0.02, effect: 'bullet_time', duration: 6 },
    
    // Destruction
    FIRE: { id: 'fire', color: '#ff3300', points: 30, icon: SNAKE_ICONS.BUFF, chance: 0.03, effect: 'fire', duration: 10 },
    BOMB: { id: 'bomb', color: '#ff0000', points: 35, icon: SNAKE_ICONS.BUFF, chance: 0.02, effect: 'bomb', duration: 0 },
    LIGHTNING: { id: 'lightning', color: '#ffff88', points: 30, icon: SNAKE_ICONS.BUFF, chance: 0.02, effect: 'chain', duration: 0 },
    
    // Special
    REVERSE: { id: 'reverse', color: '#ff88ff', points: 15, icon: SNAKE_ICONS.SPECIAL, chance: 0.03, effect: 'reverse', duration: 0 },
    CLONE: { id: 'clone', color: '#88ff88', points: 25, icon: SNAKE_ICONS.SPECIAL, chance: 0.02, effect: 'clone', duration: 15 },
    LASER: { id: 'laser', color: '#ff0088', points: 30, icon: SNAKE_ICONS.BUFF, chance: 0.02, effect: 'laser', duration: 8 }
};

// 15 Level configurations for 30x30 grid
// 15 Level configurations for 30x30 grid - Retro Minimal System Theme
const LEVELS = [
    { id: 1, name: 'System Core', speed: 0.14, goal: 8, obstacles: [], theme: { bg: '#0a0a0a', grid: 'rgba(255,255,255,0.03)', snake: '#ff4d00', wall: '#141414' } },
    { id: 2, name: 'Data Stream', speed: 0.13, goal: 10, obstacles: [{x:7,y:7},{x:22,y:7},{x:7,y:22},{x:22,y:22}], theme: { bg: '#0a0a0a', grid: 'rgba(0,188,212,0.03)', snake: '#00bcd4', wall: '#141414' } },
    { id: 3, name: 'Firewall', speed: 0.12, goal: 12, obstacles: [{x:10,y:5},{x:10,y:6},{x:10,y:7},{x:10,y:8},{x:19,y:21},{x:19,y:22},{x:19,y:23},{x:19,y:24},{x:5,y:14},{x:6,y:14},{x:7,y:14},{x:23,y:14},{x:24,y:14}], theme: { bg: '#0a0a0a', grid: 'rgba(255,77,0,0.03)', snake: '#ff4d00', wall: '#1f1f1f' } },
    { id: 4, name: 'Memory Bank', speed: 0.12, goal: 14, obstacles: [{x:14,y:14},{x:15,y:14},{x:14,y:15},{x:15,y:15},{x:5,y:5},{x:24,y:5},{x:5,y:24},{x:24,y:24}], theme: { bg: '#0a0a0a', grid: 'rgba(255,204,0,0.03)', snake: '#ffcc00', wall: '#141414' } },
    { id: 5, name: 'Cold Storage', speed: 0.11, goal: 16, obstacles: [{x:8,y:14},{x:9,y:14},{x:10,y:14},{x:19,y:14},{x:20,y:14},{x:21,y:14},{x:14,y:8},{x:14,y:9},{x:14,y:10},{x:14,y:19},{x:14,y:20},{x:14,y:21}], theme: { bg: '#0a0a0a', grid: 'rgba(255,255,255,0.04)', snake: '#ffffff', wall: '#333333' } },
    { id: 6, name: 'Kernel Panic', speed: 0.10, goal: 18, obstacles: [{x:10,y:10},{x:11,y:10},{x:10,y:11},{x:19,y:10},{x:18,y:10},{x:19,y:11},{x:10,y:19},{x:11,y:19},{x:10,y:18},{x:19,y:19},{x:18,y:19},{x:19,y:18}], theme: { bg: '#0a0a0a', grid: 'rgba(255,0,0,0.03)', snake: '#ff0000', wall: '#141414' } },
    { id: 7, name: 'Neon Proxy', speed: 0.10, goal: 20, obstacles: [{x:7,y:7},{x:8,y:7},{x:7,y:8},{x:22,y:7},{x:21,y:7},{x:22,y:8},{x:7,y:22},{x:8,y:22},{x:7,y:21},{x:22,y:22},{x:21,y:22},{x:22,y:21},{x:14,y:14},{x:15,y:14},{x:14,y:15},{x:15,y:15}], theme: { bg: '#0a0a0a', grid: 'rgba(180,180,180,0.03)', snake: '#b0b0b0', wall: '#141414' } },
    { id: 8, name: 'Void Null', speed: 0.09, goal: 22, obstacles: [{x:5,y:14},{x:6,y:14},{x:24,y:14},{x:23,y:14},{x:14,y:5},{x:14,y:6},{x:14,y:23},{x:14,y:24},{x:10,y:10},{x:19,y:10},{x:10,y:19},{x:19,y:19}], theme: { bg: '#000000', grid: 'rgba(50,50,50,0.1)', snake: '#333333', wall: '#111111' } },
    { id: 9, name: 'Mainframe', speed: 0.09, goal: 24, obstacles: [{x:9,y:9},{x:10,y:9},{x:9,y:10},{x:20,y:9},{x:19,y:9},{x:20,y:10},{x:9,y:20},{x:10,y:20},{x:9,y:19},{x:20,y:20},{x:19,y:20},{x:20,y:19},{x:14,y:14},{x:15,y:14},{x:14,y:15},{x:15,y:15}], theme: { bg: '#0a0a0a', grid: 'rgba(0,255,0,0.03)', snake: '#00ff00', wall: '#141414' } },
    { id: 10, name: 'Crystal Logic', speed: 0.08, goal: 26, obstacles: [{x:7,y:14},{x:8,y:14},{x:21,y:14},{x:22,y:14},{x:14,y:7},{x:14,y:8},{x:14,y:21},{x:14,y:22},{x:10,y:10},{x:19,y:10},{x:10,y:19},{x:19,y:19}], theme: { bg: '#0a0a0a', grid: 'rgba(0,188,212,0.05)', snake: '#00bcd4', wall: '#0a2327' } },
    { id: 11, name: 'Cyber Grid', speed: 0.08, goal: 28, obstacles: [{x:6,y:6},{x:23,y:6},{x:6,y:23},{x:23,y:23},{x:14,y:10},{x:15,y:10},{x:14,y:19},{x:15,y:19},{x:10,y:14},{x:10,y:15},{x:19,y:14},{x:19,y:15}], theme: { bg: '#0a0a0a', grid: 'rgba(255,255,255,0.05)', snake: '#ffffff', wall: '#141414' } },
    { id: 12, name: 'Overheat', speed: 0.07, goal: 30, obstacles: [{x:13,y:13},{x:14,y:13},{x:15,y:13},{x:16,y:13},{x:13,y:14},{x:16,y:14},{x:13,y:15},{x:16,y:15},{x:13,y:16},{x:14,y:16},{x:15,y:16},{x:16,y:16}], theme: { bg: '#0a0a0a', grid: 'rgba(255,77,0,0.05)', snake: '#ff4d00', wall: '#1f0a00' } },
    { id: 13, name: 'Deep Web', speed: 0.07, goal: 32, obstacles: [{x:5,y:10},{x:6,y:10},{x:7,y:10},{x:5,y:19},{x:6,y:19},{x:7,y:19},{x:22,y:10},{x:23,y:10},{x:24,y:10},{x:22,y:19},{x:23,y:19},{x:24,y:19}], theme: { bg: '#020202', grid: 'rgba(0,100,255,0.05)', snake: '#0066ff', wall: '#050510' } },
    { id: 14, name: 'Dark Mode', speed: 0.06, goal: 35, obstacles: [{x:8,y:8},{x:21,y:8},{x:8,y:21},{x:21,y:21},{x:14,y:8},{x:14,y:21},{x:8,y:14},{x:21,y:14},{x:14,y:14}], theme: { bg: '#000000', grid: 'rgba(50,50,50,0.05)', snake: '#555555', wall: '#111111' } },
    { id: 15, name: 'Prism', speed: 0.06, goal: 40, obstacles: [{x:5,y:5},{x:6,y:5},{x:5,y:6},{x:24,y:5},{x:23,y:5},{x:24,y:6},{x:5,y:24},{x:6,y:24},{x:5,y:23},{x:24,y:24},{x:23,y:24},{x:24,y:23},{x:14,y:14},{x:15,y:14},{x:14,y:15},{x:15,y:15}], theme: { bg: '#0a0a0a', grid: 'rgba(255,255,255,0.05)', snake: '#ffffff', wall: '#333333' } },
    { 
        id: 16, 
        name: 'Quantum Lab', 
        speed: 0.12, 
        goal: 15, 
        obstacles: [
            // Static
            { x: 5, y: 5, type: 'static' },
            { x: 24, y: 5, type: 'static' },
            { x: 5, y: 24, type: 'static' },
            { x: 24, y: 24, type: 'static' },
            // Moving
            { type: 'moving', x: 10, y: 10, path: [{x:10,y:10}, {x:20,y:10}], speed: 4, pathIndex: 0, pathProgress: 0 },
            { type: 'moving', x: 20, y: 20, path: [{x:20,y:20}, {x:10,y:20}], speed: 4, pathIndex: 0, pathProgress: 0 },
            { type: 'moving', x: 15, y: 5, path: [{x:15,y:5}, {x:15,y:25}], speed: 6, pathIndex: 0, pathProgress: 0 },
            // Rotating
            { type: 'rotating', center: {x:15,y:15}, radius: 8, angle: 0, speed: 1, x:0, y:0 }
        ], 
        theme: { bg: '#0a0a0a', grid: 'rgba(0,188,212,0.1)', snake: '#00bcd4', wall: '#1f1f1f' } 
    }
];

// ACHIEVEMENTS is now imported from AchievementSystem.js (75 achievements)

/**
 * Enhanced Snake Game Class
 */
class SnakeGame extends GameEngine {
    constructor() {
        super({
            canvasId: 'game-canvas',
            gameId: 'snake',
            width: 600,
            height: 600,
            pixelPerfect: true
        });

        // Grid settings - 30x30 grid
        this.gridSize = 30;
        this.cellSize = this.canvas.width / this.gridSize;
        
        // 3D Isometric mode
        this.isIsometric = false;
        this.tileWidth = 18;  // Width for isometric diamond
        this.tileHeight = 9;  // Height for isometric diamond

        // Game mode
        this.gameMode = GameMode.ENDLESS;
        this.currentLevel = 1;
        this.lives = 3;
        this.timeRemaining = 60;
        this.foodEaten = 0;
        this.levelGoal = 5;

        // Snake state
        this.snake = [];
        this.direction = 'RIGHT';
        this.nextDirection = 'RIGHT';
        this.moveTimer = 0;
        this.baseMoveInterval = 0.15;
        this.moveInterval = this.baseMoveInterval;

        // Food & Power-ups
        this.food = { x: 0, y: 0 };
        this.foodType = FoodTypes.NORMAL;
        this.activePowerUps = {};
        this.powerUpsCollected = 0;
        this.usedPowerUps = false;

        // Combo system
        this.combo = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;

        // Obstacles
        this.obstacles = [];

        // Visual effects
        this.particles = [];
        this.screenShake = 0;
        this.powerUpIndicators = [];

        // Current theme
        this.theme = LEVELS[0].theme;

        // Stats tracking
        this.sessionStats = {
            foodEaten: 0,
            powerUpsUsed: 0,
            maxLength: 3,
            timePlayed: 0
        };

        // Menu state
        this.showingMenu = true;
        this.menuSelection = 0;
        this.menuOptions = ['Endless', 'Classic', 'Time Attack', 'Story', 'Multiplayer', 'Zen'];

        // Render mode
        this.renderMode = RenderMode.CANVAS_2D;
        this.webglRenderer = null;
        
        // Advanced particle system
        this.particleSystem = new ParticleSystem();
        this.weatherSystem = null;
        
        // Camera system
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        
        // Physics system
        this.physics = new PhysicsSystem(this.gridSize, this.cellSize);
        this.enableSmoothMovement = true;
        this.previousDirection = 'RIGHT';
        
        // Smooth movement interpolation
        this.visualSnake = []; // Interpolated positions
        this.moveProgress = 0; // 0-1 progress between grid positions
        
        // Wall bounce mode (power-up)
        this.wallBounceMode = false;
        this.velocity = { x: 1, y: 0 };
        
        // Clone snake (for clone power-up)
        this.cloneSnake = null;
        this.cloneDirection = null;
        
        // Laser beam (for laser power-up)
        this.laserActive = false;
        this.laserTarget = null;
        
        // Ultimate ability
        this.ultimateCharge = 0;
        this.ultimateMax = 50;
        
        // Graphics quality settings
        this.graphicsQuality = 'high'; // low, medium, high
        this.enablePostProcessing = true;
        this.enableParticles = true;
        this.enableScreenShake = true;

        // Initialize
        this.setupUI();
        this.loadAchievements();
        this.initRenderers();
        
        // Initialize Story Mode
        this.storyMode = new StoryMode(this);
        this.customLevelConfig = null;
        
        // Initialize Progression System (skill tree, combos)
        this.progression = new ProgressionSystem(this);
        this.activeCombo = null;
        
        // Initialize Shop and Abilities
        this.shop = new PowerUpShop(this);
        this.abilityManager = new ActiveAbilityManager(this);
        this.collectibleManager = new CollectibleManager(this);
        
        // Initialize Advanced Features
        this.destructibles = new DestructibleEnvironment(this);
        this.secretAreas = new SecretAreaManager(this);
        this.battleRoyale = new BattleRoyaleMode(this);
        this.customGameCreator = new CustomGameCreator(this);
        this.zenMode = new ZenMode(this);
        this.storyMode = new StoryMode(this);
        
        // Map generator
        this.mapGenerator = new MapGenerator(this.gridSize);
        this.portals = [];
        
        // Initialize UI Manager (settings, skins, stats, tutorial)
        this.ui = new UIManager(this);
        this.ui.createAnimatedBackground();
        this.ui.applySettings();
        
        // Initialize Audio Manager (will be resumed on user gesture)
        this.audio = new AudioManager(this);
        this.audio.updateSettings(this.ui.settings);

        this.showMainMenu();
        
        // NOTE: Music will start when user clicks START GAME (user gesture required)
        
        // Initialize Achievement System
        this.achievements = new AchievementSystem(this);
        
        // Initialize Polish System (save/load, replay, screenshot, performance)
        this.polish = new PolishSystem(this);
        
        // ENHANCED Phase 1: Trail and Lighting Systems
        this.trailSystem = new TrailSystem(100);
        this.lighting = new LightingSystem(this.canvas.width, this.canvas.height);
        this.screenEffects = new ScreenEffects(this.canvas);
        this.isometricRenderer = new IsometricRenderer(this.canvas);
        this.use3DView = false; // Toggle for isometric mode
        
        // Show tutorial on first visit
        if (this.ui.shouldShowTutorial()) {
            setTimeout(() => this.ui.startTutorial(), 500);
        }
        if (this.ui.shouldShowTutorial()) {
            setTimeout(() => this.ui.startTutorial(), 500);
        }
        this.levels = LEVELS;
    }
    
    async initRenderers() {
        // Try to initialize WebGPU renderer (Preferred)
        try {
            if (await WebGPURenderer.isSupported()) {
                // Create dedicated canvas for WebGPU
                if (!this.webgpuCanvas) {
                    this.webgpuCanvas = document.createElement('canvas');
                    this.webgpuCanvas.width = this.canvas.width;
                    this.webgpuCanvas.height = this.canvas.height;
                    // Copy styles but ensure correct positioning
                    this.webgpuCanvas.className = this.canvas.className;
                    this.webgpuCanvas.id = 'webgpu-canvas';
                    this.webgpuCanvas.style.position = 'absolute';
                    this.webgpuCanvas.style.top = '50%';
                    this.webgpuCanvas.style.left = '50%';
                    this.webgpuCanvas.style.transform = 'translate(-50%, -50%)';
                    this.webgpuCanvas.style.zIndex = '0'; // Behind main canvas
                    this.webgpuCanvas.classList.add('hidden');
                    
                    // Setup main canvas for layering
                    const container = this.canvas.parentElement;
                    if (getComputedStyle(container).position === 'static') {
                        container.style.position = 'relative';
                    }
                    
                    // Ensure main canvas is positioned correctly to match
                    // We assume main canvas is already centered or formatted by CSS
                    // Just ensuring z-index is higher
                    this.canvas.style.zIndex = '10';
                    this.canvas.style.position = 'relative'; // Keep flow? Or absolute?
                    // Safe bet: Insert WebGPU canvas before main canvas in the container
                    // and rely on container styling
                    
                    container.insertBefore(this.webgpuCanvas, this.canvas);
                }
                
                this.webgpuRenderer = new WebGPURenderer(this.webgpuCanvas);
                console.log('WebGPU initialized on dedicated canvas');
            }
        } catch (e) {
            console.warn('WebGPU init failed:', e);
        }

        // Try to initialize WebGL renderer (Fallback)
        try {
            this.webglRenderer = new WebGLRenderer(this.canvas);
            if (!this.webglRenderer.gl) {
                this.webglRenderer = null;
                console.log('WebGL not available, using Canvas 2D');
            }
        } catch (e) {
            console.warn('WebGL initialization failed:', e);
            this.webglRenderer = null;
        }
        
        // Initialize weather system
        this.weatherSystem = new WeatherSystem(
            this.particleSystem, 
            this.canvas.width, 
            this.canvas.height
        );
    }
    
    setRenderMode(mode) {
        this.renderMode = mode;
        
        // Update UI button
        const btn = document.getElementById('view-toggle');
        if (btn) {
            switch (mode) {
                case RenderMode.CANVAS_2D:
                    btn.textContent = '2D View';
                    this.isIsometric = false;
                    break;
                case RenderMode.ISOMETRIC:
                    btn.textContent = '3D Iso';
                    this.isIsometric = true;
                    break;
                case RenderMode.WEBGL:
                    btn.textContent = 'WebGL';
                    this.isIsometric = false;
                    this.webgpuCanvas?.classList.add('hidden');
                    break;
                case RenderMode.WEBGPU:
                    btn.textContent = 'WebGPU';
                    this.isIsometric = false;
                    this.webgpuCanvas?.classList.remove('hidden');
                    break;
                default:
                    this.webgpuCanvas?.classList.add('hidden');
                    break;
            }
        }
        
        // Achievement for trying different views
        if (mode === RenderMode.ISOMETRIC || mode === RenderMode.WEBGL || mode === RenderMode.WEBGPU) {
            this.checkAchievement('iso_pioneer');
        }
    }
    
    cycleRenderMode() {
        const modes = [RenderMode.CANVAS_2D, RenderMode.ISOMETRIC];
        if (this.webglRenderer) {
            modes.push(RenderMode.WEBGL);
        }
        if (this.webgpuRenderer && this.webgpuRenderer.initialized) {
            modes.push(RenderMode.WEBGPU);
        }
        
        const currentIndex = modes.indexOf(this.renderMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.setRenderMode(modes[nextIndex]);
    }

    loadAchievements() {
        this.unlockedAchievements = storageManager.getAchievements() || [];
    }

    checkAchievement(id) {
        if (this.unlockedAchievements.includes(id)) return false;
        
        const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === id);
        if (!achievement) return false;

        storageManager.unlockAchievement(id, achievement.xp);
        this.unlockedAchievements.push(id);
        this.showAchievementPopup(achievement);
        return true;
    }

    showAchievementPopup(achievement) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-title">Achievement Unlocked!</div>
                <div class="achievement-name">${achievement.name}</div>
            </div>
        `;
        document.body.appendChild(popup);
        setTimeout(() => popup.classList.add('show'), 10);
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 300);
        }, 3000);
    }

    setupUI() {
        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.selectMode(mode);
            });
        });

        // Start button
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }

        // Pause button
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }

        // Restart button
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.reset();
                this.start();
            });
        }

        // Back to menu button
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => this.showMainMenu());
        }

        // SPA Back Button
        document.getElementById('snake-back-btn')?.addEventListener('click', () => {
            if (window.GameBridge) {
                window.GameBridge.exitGame();
            } else {
                window.location.href = '../../index.html';
            }
        });

        // View toggle button (2D/3D/WebGL)
        const viewBtn = document.getElementById('view-toggle');
        if (viewBtn) {
            viewBtn.addEventListener('click', () => this.cycleRenderMode());
        }

        // Shop button listener removed

        // Mobile touch controls
        document.querySelectorAll('.touch-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const dir = btn.dataset.dir.toUpperCase();
                this.tryChangeDirection(dir);
                if (this.state === GameState.MENU || this.state === GameState.GAME_OVER) {
                    this.reset();
                    this.start();
                }
            });
        });

        // Swipe controls
        inputManager.onSwipe('up', () => this.tryChangeDirection('UP'));
        inputManager.onSwipe('down', () => this.tryChangeDirection('DOWN'));
        inputManager.onSwipe('left', () => this.tryChangeDirection('LEFT'));
        inputManager.onSwipe('right', () => this.tryChangeDirection('RIGHT'));
    }

    showMainMenu() {
        this.showingMenu = true;
        this.state = GameState.MENU;
        
        const mainMenu = document.getElementById('main-menu');
        const gameUI = document.getElementById('game-ui');
        const achievementsPanel = document.getElementById('achievements-panel');
        const abilityBar = document.getElementById('ability-bar');
        
        if (mainMenu) mainMenu.classList.remove('hidden');
        if (gameUI) gameUI.classList.add('hidden');
        if (achievementsPanel) achievementsPanel.classList.add('hidden');
        if (abilityBar) abilityBar.style.display = 'none';
        
        this.renderMenuBackground();
    }

    selectMode(mode) {
        console.log('Selecting mode:', mode);
        this.gameMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Update mode description
        const desc = document.getElementById('mode-description');
        if (desc) {
            const descriptions = {
                endless: 'Endless - Play until you die. How long can you survive?',
                classic: 'Classic - 3 lives, 15 levels. Complete all levels to win!',
                timeAttack: 'Time Attack - 60 seconds. Get the highest score possible!',
                story: 'Story Mode - Embark on an epic journey with bosses and lore.',
                multiplayer: 'Battle Royale - Be the last snake slithering!',
                puzzle: 'Puzzle Mode - Solve spatial challenges.',
                zen: 'Zen Mode - Relax. No death, just vibes.'
            };
            desc.textContent = descriptions[mode] || descriptions['endless'];
        }
    }

    startGame() {
        console.log('Starting game with mode:', this.gameMode);
        // ... (startGame logic remains same)
        this.showingMenu = false;
        
        if (this.audio) {
            this.audio.resume();
            this.audio.startMusic('menu');
        }
        
        const mapSelect = document.getElementById('map-select');
        if (mapSelect) {
            this.startingLevel = parseInt(mapSelect.value) || 1;
        } else {
            this.startingLevel = 1;
        }
        
        const mainMenu = document.getElementById('main-menu');
        const gameUI = document.getElementById('game-ui');
        
        if (mainMenu) mainMenu.classList.add('hidden');
        if (gameUI) gameUI.classList.remove('hidden');
        
        const abilityBar = document.getElementById('ability-bar');
        if (abilityBar) abilityBar.style.display = 'flex';
        
        this.setupModeUI();
        
        this.reset();
        this.start();
    }

    setupModeUI() {
        const livesEl = document.getElementById('lives-display');
        const timerEl = document.getElementById('timer-display');
        const levelEl = document.querySelector('.hud-left');
        
        if (livesEl) livesEl.classList.toggle('hidden', this.gameMode !== GameMode.CLASSIC);
        if (timerEl) timerEl.parentElement.classList.toggle('hidden', this.gameMode !== GameMode.TIME_ATTACK);
        if (levelEl) levelEl.classList.toggle('hidden', this.gameMode === GameMode.ENDLESS);

        this.updateModeUI();
    }

    updateModeUI() {
        // Lives
        const livesValue = document.querySelector('.lives-value');
        if (livesValue) {
            livesValue.innerHTML = '';
            // Create heart icons
            for (let i = 0; i < this.lives; i++) {
                livesValue.insertAdjacentHTML('beforeend', SNAKE_ICONS.HEART);
            }
        }
        
        // Timer
        const timerValue = document.querySelector('.timer-value');
        if (timerValue) timerValue.textContent = Math.ceil(this.timeRemaining);
        
        // Level name
        const levelName = document.getElementById('level-display-text');
        if (levelName) {
            if (this.gameMode === GameMode.PUZZLE && this.customLevelConfig) {
                 levelName.textContent = `Puz ${this.customLevelConfig.id}: ${this.customLevelConfig.name} (${this.customLevelConfig.desc})`;
            } else if (LEVELS[this.currentLevel - 1]) {
                 levelName.textContent = `Lvl ${this.currentLevel}: ${LEVELS[this.currentLevel - 1].name}`;
            }
        }
        
        // Level progress
        const progressBar = document.getElementById('level-progress-bar');
        if (progressBar) {
            let progress = 0;
            if (this.gameMode === GameMode.PUZZLE && this.customLevelConfig) {
                 const goal = this.customLevelConfig.goal;
                 const target = goal.items || goal.count || 1;
                 progress = (this.foodEaten / target) * 100;
            } else {
                 progress = (this.foodEaten / this.levelGoal) * 100;
            }
            progressBar.style.width = `${Math.min(100, progress)}%`;
        }

        // Power-up indicators
        this.updatePowerUpDisplay();
    }

    updatePowerUpDisplay() {
        const container = document.getElementById('powerup-active-bar');
        if (!container) return;
        
        container.innerHTML = '';
        for (const [type, data] of Object.entries(this.activePowerUps)) {
            if (data.remaining > 0 || data.remaining === -1) {
                 const foodType = Object.values(FoodTypes).find(f => f.effect === type);
                 const icon = foodType ? foodType.icon : SNAKE_ICONS.BUFF;
                 
                 const indicator = document.createElement('div');
                 indicator.className = 'powerup-indicator';
                 
                 const timeText = data.remaining === -1 ? '∞' : Math.ceil(data.remaining) + 's';
                 indicator.innerHTML = `${icon} ${timeText}`;
                 container.appendChild(indicator);
            }
        }
    }

    // Customize loading for Story Mode levels
    loadLevel(config) {
        this.customLevelConfig = config;
        this.currentLevel = 0; 
    }

    onReset() {
        // Use selected starting level
        this.currentLevel = this.startingLevel || 1;
        
        // Reset defaults
        this.wrapAround = false;

        // Reset based on mode
        if (this.gameMode === GameMode.CLASSIC) {
            this.lives = 3;
        } else if (this.gameMode === GameMode.TIME_ATTACK) {
            this.timeRemaining = 60;
        } else if (this.gameMode === GameMode.MULTIPLAYER) {
            // Start Online Battle Royale
            if (this.battleRoyale) this.battleRoyale.start('online');
        } else if (this.gameMode === GameMode.ZEN) {
            // Apply Zen settings
            if (this.zenMode) this.zenMode.applySettings();
            this.wrapAround = true; 
        } else if (this.gameMode === GameMode.STORY) {
            // Initialize Story Mode World if not already inside a specific story level
            if (!this.customLevelConfig || !String(this.customLevelConfig.id).startsWith('story_')) {
                 this.storyMode.startWorld(this.storyMode.currentWorldIndex || 0);
                 return; // Stop recursive reset
            }
        }

        // Apply level config
        let levelConfig;
        if (this.gameMode === GameMode.STORY && this.customLevelConfig) {
            levelConfig = this.customLevelConfig;
        } else if (this.gameMode === GameMode.PUZZLE) {
            // Puzzle Mode
            const puzzle = PUZZLE_LEVELS[this.currentLevel - 1] || PUZZLE_LEVELS[0];
            this.customLevelConfig = puzzle;
            levelConfig = {
                 name: puzzle.name,
                 speed: 0.12,
                 goal: puzzle.goal.items || 10,
                 obstacles: puzzle.layout.obstacles || [],
                 theme: LEVELS[6].theme, // Neon theme for puzzles
                 snakeStart: puzzle.layout.snake
            };
        } else {
             levelConfig = LEVELS[this.currentLevel - 1] || LEVELS[0];
             this.customLevelConfig = null;
        }

        this.moveInterval = levelConfig.speed;
        this.levelGoal = levelConfig.goal;
        
        // Deep copy obstacles to support modification
        this.obstacles = levelConfig.obstacles.map(o => ({...o}));
        this.obstacles.forEach(o => {
             if (o.path) o.path = o.path.map(p => ({...p}));
        });
        
        this.theme = levelConfig.theme;

        // Initialize snake
        let startX = Math.floor(this.gridSize / 2);
        let startY = Math.floor(this.gridSize / 2);
        let startDir = 'RIGHT';
        let startLength = 3;

        if (levelConfig.snakeStart) {
            startX = levelConfig.snakeStart.x;
            startY = levelConfig.snakeStart.y;
            startDir = levelConfig.snakeStart.direction || 'RIGHT';
            startLength = levelConfig.snakeStart.length || 3;
        }

        this.snake = [];
        const dirVec = { 
            'RIGHT': {x:-1, y:0}, 'LEFT': {x:1, y:0}, 
            'UP': {x:0, y:1}, 'DOWN': {x:0, y:-1} 
        }[startDir];

        for (let i = 0; i < startLength; i++) {
            this.snake.push({
                x: startX + (dirVec.x * i),
                y: startY + (dirVec.y * i)
            });
        }

        this.direction = startDir;
        this.nextDirection = startDir;
        this.moveTimer = 0;
        this.particles = [];
        this.screenShake = 0;
        this.foodEaten = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.activePowerUps = {};
        this.usedPowerUps = false;
        this.powerUpsCollected = 0;

        // Session stats
        this.sessionStats = {
            foodEaten: 0,
            powerUpsUsed: 0,
            maxLength: 3,
            timePlayed: 0
        };
        
        // Reset physics system
        if (this.physics) {
            this.physics.reset();
            this.physics.initializeFromSnake(this.snake);
        }
        
        // Reset animation state
        this.elapsedTime = 0;
        this.moveProgress = 0;
        this.previousDirection = 'RIGHT';
        this.ultimateCharge = 0;
        this.cloneSnake = null;
        this.laserActive = false;

        this.spawnFood();
        this.updateModeUI();
        this.render();
    }

    onStart() {
        this._hideOverlay();
    }

    togglePause(force) {
        if (force !== undefined) {
             this.isPaused = force;
             // We don't change state to PAUSED to keep UI rendering, just logic pause
        } else {
             this.isPaused = !this.isPaused;
        }
    }

    update(dt) {
        // Handle Story Mode Cutscene Input (works while paused)
        if (this.storyMode && this.storyMode.inCutscene) {
            if (inputManager.isKeyJustPressed('Space') || inputManager.isKeyJustPressed('Enter')) {
                this.storyMode.advanceDialog();
            }
            // Don't return here, let pause check handle game loop stoppage
        }

        if (this.isPaused) return;

        if (this.showingMenu) {
            this.renderMenuBackground();
            return;
        }

        // Handle input
        this.handleInput();

        // Update Battle Royale AI
        if (this.gameMode === GameMode.MULTIPLAYER && this.battleRoyale) {
            const result = this.battleRoyale.update(dt);
            
            // Wait for Online Match to start
            if (this.battleRoyale.isOnline && !this.battleRoyale.isReady()) {
                return;
            }

            if (result && result.winner === 'player') {
                this.gameOver(true); // Player won!
            }
        }

        // Update timers
        this.sessionStats.timePlayed += dt;
        
        // Time Attack mode timer (freeze power-up pauses it)
        if (this.gameMode === GameMode.TIME_ATTACK && !this.activePowerUps.freeze) {
            this.timeRemaining -= dt;
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.checkAchievement('time_attack');
                this.gameOver(false);
                return;
            }
        }

        // Combo timer
        if (this.combo > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }

        // Power-up timers
        for (const [type, data] of Object.entries(this.activePowerUps)) {
            if (data.remaining > 0) {
                data.remaining -= dt;
                if (data.remaining <= 0) {
                    this.deactivatePowerUp(type);
                }
            }
        }

        // Screen shake decay
        if (this.screenShake > 0) {
            this.screenShake -= dt * 10;
        }

        // Calculate effective speed
        let effectiveInterval = this.moveInterval;
        if (this.activePowerUps.speed) effectiveInterval *= 0.5;
        if (this.activePowerUps.slow) effectiveInterval *= 2;
        if (this.activePowerUps.bullet_time) effectiveInterval *= 1.5; // Slightly faster in slow-mo

        // Update dynamic obstacles
        if (this.physics && this.obstacles.length > 0) {
            this.obstacles.forEach((obs, index) => {
                if (obs.type === 'moving') {
                    this.obstacles[index] = this.physics.updateMovingObstacle(obs, dt);
                } else if (obs.type === 'rotating') {
                    this.obstacles[index] = this.physics.updateRotatingObstacle(obs, dt);
                } else if (obs.type === 'falling') {
                    this.obstacles[index] = this.physics.updateFallingHazard(obs, dt);
                }
            });
        }

        // Magnet effect - move food toward snake
        if (this.activePowerUps.magnet) {
            const head = this.snake[0];
            const dx = head.x - this.food.x;
            const dy = head.y - this.food.y;
            if (Math.abs(dx) > 0) this.food.x += Math.sign(dx);
            if (Math.abs(dy) > 0) this.food.y += Math.sign(dy);
        }
        
        // Update clone snake
        if (this.cloneSnake && this.cloneSnake.length > 0) {
            this.updateCloneSnake(dt);
        }
        
        // Update laser targeting
        if (this.laserActive && this.activePowerUps.laser) {
            this.laserTarget = { ...this.food };
        } else if (!this.activePowerUps.laser) {
            this.laserActive = false;
        }

        // Move snake
        this.moveTimer += dt;
        this.moveProgress = this.moveTimer / effectiveInterval; // 0-1 progress for interpolation
        
        if (this.moveTimer >= effectiveInterval) {
            this.moveTimer = 0;
            this.moveProgress = 0;
            this.previousDirection = this.direction;
            this.moveSnake();
        }
        
        // Update physics system
        if (this.enableSmoothMovement) {
            this.physics.updateVisualPositions(this.snake, dt, this.moveProgress);
            this.physics.updateMomentum(true, dt);
        }
        
        // Update food physics (bouncing animation)
        if (this.physics) {
            this.foodVisualPos = this.physics.updateFoodPhysics(this.food, dt);
        }
        
        // Track elapsed time for animations
        this.elapsedTime = (this.elapsedTime || 0) + dt;

        // Update particles (new system)
        if (this.enableParticles) {
            this.particleSystem.update(dt);
        }
        
        // Update weather
        if (this.weatherSystem) {
            this.weatherSystem.update(dt);
        }
        
        // Update legacy particles
        this.updateParticles(dt);
        
        // Update UI
        this.updateModeUI();

        // Check time-based achievements
        if (this.sessionStats.timePlayed >= 180) {
            this.checkAchievement('survivor_3');
        }
        
        if (this.sessionStats.timePlayed >= 600) {
            this.checkAchievement('survivor_10');
        }
        
        // Update boss if in boss battle
        if (this.currentBoss && this.currentBoss.isActive) {
            this.currentBoss.update(dt);
        }
    }
    
    updateCloneSnake(dt) {
        if (!this.cloneSnake || this.cloneSnake.length === 0) return;
        
        // Clone moves in mirrored direction
        const dir = DIRECTION[OPPOSITE[this.cloneDirection]];
        
        // Move clone
        const head = this.cloneSnake[0];
        const newHead = {
            x: head.x + dir.x,
            y: head.y + dir.y
        };
        
        // Wrap around
        if (newHead.x < 0) newHead.x = this.gridSize - 1;
        if (newHead.x >= this.gridSize) newHead.x = 0;
        if (newHead.y < 0) newHead.y = this.gridSize - 1;
        if (newHead.y >= this.gridSize) newHead.y = 0;
        
        this.cloneSnake.unshift(newHead);
        this.cloneSnake.pop();
        
        // Update direction periodically
        if (Math.random() < 0.1) {
            this.cloneDirection = ['UP', 'DOWN', 'LEFT', 'RIGHT'][Math.floor(Math.random() * 4)];
        }
    }

    handleInput() {
        // Cutscene handling
        if (this.storyMode && this.storyMode.inCutscene) {
            if (inputManager.isKeyJustPressed('Space') || inputManager.isKeyJustPressed('Enter')) {
                this.storyMode.advanceDialog();
            }
            return;
        }

        if (inputManager.isKeyJustPressed('ArrowUp') || inputManager.isKeyJustPressed('KeyW')) {
            this.tryChangeDirection('UP');
        }
        if (inputManager.isKeyJustPressed('ArrowDown') || inputManager.isKeyJustPressed('KeyS')) {
            this.tryChangeDirection('DOWN');
        }
        if (inputManager.isKeyJustPressed('ArrowLeft') || inputManager.isKeyJustPressed('KeyA')) {
            this.tryChangeDirection('LEFT');
        }
        if (inputManager.isKeyJustPressed('ArrowRight') || inputManager.isKeyJustPressed('KeyD')) {
            this.tryChangeDirection('RIGHT');
        }
        
        // Ultimate ability
        if (inputManager.isKeyJustPressed('KeyQ')) {
            this.activateUltimate();
        }
        
        // Cycle view mode
        if (inputManager.isKeyJustPressed('KeyV')) {
            this.cycleRenderMode();
        }
    }
    
    activateUltimate() {
        if (this.ultimateCharge < this.ultimateMax) return;
        
        this.ultimateCharge = 0;
        
        // Serpent Storm - clear all obstacles
        const obstacleCount = this.obstacles.length;
        
        // Massive particle explosion
        for (const obs of this.obstacles) {
            this.particleSystem.emitFirework(
                obs.x * this.cellSize + this.cellSize / 2,
                obs.y * this.cellSize + this.cellSize / 2
            );
        }
        
        this.obstacles = [];
        
        // Add points
        this.addScore(obstacleCount * 25);
        
        // Camera effects
        this.camera.shake(10, 0.5);
        this.camera.doFlash([1, 0, 1], 0.3);
        this.camera.startSlowMotion(0.3, 0.8);
        
        // Grant temporary invincibility
        this.activePowerUps.invincible = {
            remaining: 3,
            type: FoodTypes.INVINCIBLE
        };
    }

    tryChangeDirection(newDirection) {
        if (OPPOSITE[newDirection] !== this.direction) {
            this.nextDirection = newDirection;
        }
    }

    moveSnake() {
        this.direction = this.nextDirection;

        const head = this.snake[0];
        const dir = DIRECTION[this.direction];
        const newHead = {
            x: head.x + dir.x,
            y: head.y + dir.y
        };

        // Wall collision
        if (newHead.x < 0 || newHead.x >= this.gridSize ||
            newHead.y < 0 || newHead.y >= this.gridSize) {
            
            if (this.wrapAround) {
                // Zen Mode / Wrap Logic
                if (newHead.x < 0) newHead.x = this.gridSize - 1;
                else if (newHead.x >= this.gridSize) newHead.x = 0;
                
                if (newHead.y < 0) newHead.y = this.gridSize - 1;
                else if (newHead.y >= this.gridSize) newHead.y = 0;
            } else {
                this.handleCollision();
                return;
            }
        }

        // Obstacle collision (enhanced for dynamic obstacles)
        const obstacleIndex = this.obstacles.findIndex(o => {
            // Check for collision overlap with allowance for moving obstacles
            return Math.abs(o.x - newHead.x) < 0.7 && Math.abs(o.y - newHead.y) < 0.7;
        });
        
        if (obstacleIndex !== -1) {
            if (this.activePowerUps.fire) {
                // Fire destroys obstacle
                this.obstacles.splice(obstacleIndex, 1);
                this.spawnParticles(newHead.x * this.cellSize, newHead.y * this.cellSize, '#ff3300', 12);
                this.addScore(20);
            } else {
                this.handleCollision();
                return;
            }
        }

        // Self collision (unless ghost mode)
        if (!this.activePowerUps.ghost) {
            for (const segment of this.snake) {
                if (newHead.x === segment.x && newHead.y === segment.y) {
                    this.handleCollision();
                    return;
                }
            }
        }

        this.snake.unshift(newHead);

        // Check food collision
        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            this.eatFood();
        } else {
            this.snake.pop();
        }

        if (this.gameMode === GameMode.PUZZLE) {
            this.checkPuzzleWin();
        }
    }

    checkPuzzleWin() {
        if (!this.customLevelConfig || !this.customLevelConfig.goal) return;
        const goal = this.customLevelConfig.goal;
        const head = this.snake[0];

        if (goal.type === 'reach_goal') {
            if (head.x === goal.target.x && head.y === goal.target.y) {
                this.nextLevel();
            }
        } else if (goal.type === 'collect_ordered' || goal.type === 'collect_all') {
            // handled in eatFood mostly, but check here just in case items matches
            // If strictly count based, eatFood handled it via levelGoal?
            // But customLevelConfig.goal.items might be different property than levelGoal number
            const target = goal.items || goal.count || 0;
            if (this.foodEaten >= target) {
                this.nextLevel();
            }
        }
    }

    handleCollision() {
        // Invincible check - complete immunity
        if (this.activePowerUps.invincible) {
            this.camera.shake(2, 0.1);
            return;
        }
        
        // Shield check
        if (this.activePowerUps.shield) {
            this.deactivatePowerUp('shield');
            this.checkAchievement('close_call'); // Shield save achievement
            this.screenShake = 3;
            this.camera.shake(5, 0.3);
            this.particleSystem.emitExplosion(
                this.snake[0].x * this.cellSize,
                this.snake[0].y * this.cellSize,
                [0, 1, 0],
                15
            );
            return;
        }

        if (this.gameMode === GameMode.CLASSIC) {
            this.lives--;
            if (this.lives > 0) {
                this.screenShake = 5;
                this.spawnDeathParticles();
                // Respawn snake but keep level progress
                setTimeout(() => {
                    const startX = Math.floor(this.gridSize / 2);
                    const startY = Math.floor(this.gridSize / 2);
                    this.snake = [
                        { x: startX, y: startY },
                        { x: startX - 1, y: startY },
                        { x: startX - 2, y: startY }
                    ];
                    this.direction = 'RIGHT';
                    this.nextDirection = 'RIGHT';
                    this.updateModeUI();
                }, 500);
                return;
            }
        }

        this.die();
    }

    eatFood() {
        // Combo system
        this.combo++;
        this.comboTimer = 2;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        // Build ultimate charge
        this.ultimateCharge = Math.min(this.ultimateMax, this.ultimateCharge + 1);

        // Calculate points
        let points = this.foodType.points;
        if (this.activePowerUps.double) points *= 2;
        if (this.activePowerUps.triple) points *= 3;
        points += Math.floor(this.combo * 2); // Combo bonus

        this.addScore(points);
        this.foodEaten++;
        this.sessionStats.foodEaten++;
        this.sessionStats.maxLength = Math.max(this.sessionStats.maxLength, this.snake.length);

        // Spawn particles
        this.spawnEatParticles();
        this.showScorePopup(points);

        // Apply power-up effects
        if (this.foodType.effect) {
            this.activatePowerUp(this.foodType);
        }

        // Check achievements (use lowercase keys matching AchievementSystem)
        if (this.sessionStats.foodEaten === 1) {
            this.checkAchievement('first_blood');
        }
        // Length achievements
        if (this.snake.length >= 10) this.checkAchievement('snake_10');
        if (this.snake.length >= 25) this.checkAchievement('snake_25');
        if (this.snake.length >= 50) this.checkAchievement('snake_50');
        if (this.snake.length >= 100) this.checkAchievement('snake_100');
        // Score achievements
        if (this.score >= 500) this.checkAchievement('score_500');
        if (this.score >= 1000) this.checkAchievement('score_1000');
        if (this.score >= 2500) this.checkAchievement('score_2500');
        if (this.score >= 5000) this.checkAchievement('score_5000');
        // Combo achievements
        if (this.combo >= 5) this.checkAchievement('combo_5');
        if (this.combo >= 10) this.checkAchievement('combo_10');
        if (this.combo >= 20) this.checkAchievement('combo_20');
        // Power-up achievements
        if (this.powerUpsCollected >= 5) this.checkAchievement('power_hunter');
        if (this.powerUpsCollected >= 15) this.checkAchievement('power_collector');

        // Check level completion (Classic mode)
        if (this.gameMode === GameMode.CLASSIC && this.foodEaten >= this.levelGoal) {
            this.levelComplete();
        } else if (this.gameMode === GameMode.STORY && this.foodEaten >= this.levelGoal) {
            this.storyMode.completeLevel();
        }
        // Increase speed in endless mode
        if (this.gameMode === GameMode.ENDLESS && this.snake.length % 5 === 0) {
            this.moveInterval = Math.max(0.05, this.moveInterval - 0.01);
            this.level++;
        }

        this.spawnFood();
    }

    activatePowerUp(foodType) {
        this.usedPowerUps = true;
        this.powerUpsCollected++;
        this.sessionStats.powerUpsUsed++;
        
        // Build ultimate charge
        this.ultimateCharge = Math.min(this.ultimateMax, this.ultimateCharge + 2);

        const effect = foodType.effect;
        
        // Spawn particles for power-up collection
        if (this.enableParticles) {
            this.particleSystem.emitExplosion(
                this.food.x * this.cellSize + this.cellSize / 2,
                this.food.y * this.cellSize + this.cellSize / 2,
                this.hexToRgb(foodType.color),
                12
            );
        }
        
        // Instant effects
        if (effect === 'shrink') {
            for (let i = 0; i < 3 && this.snake.length > 3; i++) {
                this.snake.pop();
            }
            this.camera.shake(3, 0.2);
            return;
        }
        
        if (effect === 'warp') {
            // Teleport to random empty location
            const emptyCells = [];
            for (let x = 2; x < this.gridSize - 2; x++) {
                for (let y = 2; y < this.gridSize - 2; y++) {
                    const isSnake = this.snake.some(s => s.x === x && s.y === y);
                    const isObstacle = this.obstacles.some(o => o.x === x && o.y === y);
                    if (!isSnake && !isObstacle) emptyCells.push({ x, y });
                }
            }
            if (emptyCells.length > 0) {
                const newPos = emptyCells[randomInt(0, emptyCells.length - 1)];
                const dx = newPos.x - this.snake[0].x;
                const dy = newPos.y - this.snake[0].y;
                this.snake.forEach(seg => { seg.x += dx; seg.y += dy; });
                this.particleSystem.emitFirework(newPos.x * this.cellSize, newPos.y * this.cellSize);
                this.camera.doFlash([0.8, 0, 1], 0.15);
            }
            return;
        }
        
        if (effect === 'bomb') {
            // Clear all obstacles in radius
            const head = this.snake[0];
            const radius = 5;
            let destroyed = 0;
            
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const obs = this.obstacles[i];
                const dist = Math.abs(obs.x - head.x) + Math.abs(obs.y - head.y);
                if (dist <= radius) {
                    this.particleSystem.emitExplosion(
                        obs.x * this.cellSize,
                        obs.y * this.cellSize,
                        [1, 0.3, 0]
                    );
                    this.obstacles.splice(i, 1);
                    destroyed++;
                }
            }
            
            if (destroyed > 0) {
                this.addScore(destroyed * 10);
                this.camera.shake(8, 0.4);
                this.camera.doFlash([1, 0.5, 0], 0.2);
            }
            return;
        }
        
        if (effect === 'chain') {
            // Lightning chain - collect all food items (spawn new foods)
            for (let i = 0; i < 5; i++) {
                this.addScore(20);
                const x = randomInt(2, this.gridSize - 2);
                const y = randomInt(2, this.gridSize - 2);
                this.particleSystem.emit({
                    x: x * this.cellSize,
                    y: y * this.cellSize,
                    count: 5,
                    radial: true,
                    speed: 100,
                    color: [1, 1, 0.5],
                    life: 0.3,
                    size: 4
                });
            }
            this.camera.doFlash([1, 1, 0.5], 0.1);
            return;
        }
        
        if (effect === 'reverse') {
            // Reverse snake direction
            this.snake.reverse();
            this.direction = OPPOSITE[this.direction];
            this.nextDirection = this.direction;
            this.camera.shake(3, 0.2);
            return;
        }
        
        if (effect === 'vacuum') {
            // Suck in and collect extra food
            for (let i = 0; i < 3; i++) {
                this.addScore(30);
                this.snake.push({ ...this.snake[this.snake.length - 1] });
            }
            this.particleSystem.emitShockwave(
                this.snake[0].x * this.cellSize,
                this.snake[0].y * this.cellSize,
                [0.5, 0.3, 1]
            );
            return;
        }
        
        if (effect === 'clone') {
            // Create a clone snake
            this.cloneSnake = this.snake.map(s => ({ x: s.x, y: s.y }));
            this.cloneDirection = this.direction;
        }
        
        if (effect === 'laser') {
            // Activate laser targeting
            this.laserActive = true;
            this.laserTarget = { ...this.food };
        }

        // Duration-based effects
        this.activePowerUps[effect] = {
            remaining: foodType.duration,
            type: foodType
        };
    }
    
    hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') return [0.5, 0.5, 0.5];
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255
        ] : [0.5, 0.5, 0.5];
    }

    deactivatePowerUp(type) {
        delete this.activePowerUps[type];
    }

    completeLevel() {
        this.currentLevel++;
        
        if (this.currentLevel > LEVELS.length) {
            // Won the game!
            this.checkAchievement('story_complete');
            this.checkAchievement('classic_win');
            if (!this.usedPowerUps) this.checkAchievement('untouchable');
            this.gameOver(true);
            return;
        }

        // Level up achievements
        if (this.currentLevel >= 5) this.checkAchievement('world_1');
        if (this.currentLevel >= 10) this.checkAchievement('world_2');

        // Apply new level config
        const levelConfig = LEVELS[this.currentLevel - 1];
        this.moveInterval = levelConfig.speed;
        this.levelGoal = levelConfig.goal;
        this.obstacles = [...levelConfig.obstacles];
        this.theme = levelConfig.theme;
        this.foodEaten = 0;

        // Show level transition
        this.showLevelTransition(levelConfig);
        
        // Respawn snake
        const startX = Math.floor(this.gridSize / 2);
        const startY = Math.floor(this.gridSize / 2);
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        this.direction = 'RIGHT';
        this.nextDirection = 'RIGHT';

        this.spawnFood();
    }

    showLevelTransition(levelConfig) {
        const overlay = document.getElementById('level-transition');
        if (overlay) {
            overlay.querySelector('.level-name').textContent = levelConfig.name;
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.add('hidden'), 2000);
        }
    }

    spawnFood() {
        if (this.gameMode === GameMode.PUZZLE && this.customLevelConfig) {
            const layout = this.customLevelConfig.layout;
            const goal = this.customLevelConfig.goal;
            
            if (goal.type === 'collect_ordered') {
                 // Sort and pick next based on foodEaten index
                 // Assuming layout.food structure: [{x,y,order}, ...]
                 const foods = layout.food.slice().sort((a,b) => a.order - b.order);
                 const next = foods[this.foodEaten];
                 
                 if (next) {
                     this.food = { x: next.x, y: next.y, type: 'apple' };
                     return;
                 }
            } else if (goal.type === 'reaching_goal') { // Note: using 'reach_goal' elsewhere, check config
                 this.food = { x: -100, y: -100 }; // No food
                 return;
            } else if (goal.type === 'reach_goal') {
                 this.food = { x: -100, y: -100 }; // No food
                 return;
            } else if (goal.type === 'collect_all') {
                // Collect all logic: Spawn one by one or random? 
                // Level 4/5 have array. 
                // Simple: Spawn first available that isn't snake/obstacle location?
                // Or just iterate standard logic but restrict to 'layout.food' positions
                // For MVP, let's spawn the one at valid index (like ordered but unordered)
                const next = layout.food[this.foodEaten]; 
                if (next) {
                    this.food = { x: next.x, y: next.y, type: 'apple' };
                    return;
                }
            }
        }

        const emptyCells = [];

        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const isSnake = this.snake.some(s => s.x === x && s.y === y);
                const isObstacle = this.obstacles.some(o => o.x === x && o.y === y);
                if (!isSnake && !isObstacle) {
                    emptyCells.push({ x, y });
                }
            }
        }

        if (emptyCells.length === 0) {
            this.gameOver(true);
            return;
        }

        const randomCell = emptyCells[randomInt(0, emptyCells.length - 1)];
        this.food = randomCell;

        // Determine food type
        const rand = Math.random();
        let cumulative = 0;
        for (const type of Object.values(FoodTypes)) {
            cumulative += type.chance;
            if (rand < cumulative) {
                this.foodType = type;
                break;
            }
        }
    }

    die() {
        this.screenShake = 5;
        this.spawnDeathParticles();

        const wrapper = document.querySelector('.canvas-wrapper');
        if (wrapper) {
            wrapper.classList.add('shake');
            setTimeout(() => wrapper.classList.remove('shake'), 300);
        }

        setTimeout(() => this.gameOver(false), 300);
    }

    render() {
        const ctx = this.ctx;
        
        // Update camera
        const adjustedDt = this.camera.update(this.deltaTime || 0.016);
        
        // WebGPU rendering path
        if (this.renderMode === RenderMode.WEBGPU && this.webgpuRenderer && this.webgpuRenderer.initialized) {
            // Render 3D scene to WebGPU canvas
            this.webgpuRenderer.renderScene(this);
            
            // Clear 2D canvas for UI overlay (make transparent)
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw UI elements on 2D canvas
            if (this.combo > 1) {
                this.drawCombo();
            }
            this.drawUltimateBar();
            return;
        }

        // WebGL rendering path
        if (this.renderMode === RenderMode.WEBGL && this.webglRenderer) {
            const gameState = {
                snake: this.snake,
                food: this.food,
                foodType: this.foodType,
                obstacles: this.obstacles,
                theme: this.theme,
                gridSize: this.gridSize,
                direction: this.direction,
                screenShake: this.screenShake,
                activePowerUps: this.activePowerUps,
                combo: this.combo
            };
            
            this.webglRenderer.render(gameState, this.deltaTime || 0.016);
            
            // Draw 2D overlay elements on top
            if (this.combo > 1) {
                this.drawCombo();
            }
            
            // Draw ultimate charge bar
            this.drawUltimateBar();
            return;
        }
        
        // Canvas 2D / Isometric rendering
        ctx.save();
        
        // Apply camera transform
        this.camera.apply(ctx);
        
        // Legacy screen shake (for non-camera shake)
        if (this.screenShake > 0 && this.enableScreenShake) {
            ctx.translate(
                (Math.random() - 0.5) * this.screenShake,
                (Math.random() - 0.5) * this.screenShake
            );
        }

        // Background
        ctx.fillStyle = this.theme.bg;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.renderMode === RenderMode.ISOMETRIC || this.isIsometric) {
            this.renderIsometric();
        } else {
            this.render2D();
        }
        
        // Restore camera transform
        this.camera.restore(ctx);

        // 2D Overlay elements (drawn after camera restore)
        if (this.combo > 1) {
            this.drawCombo();
        }
        
        // Ultimate charge bar
        this.drawUltimateBar();
        
        // Clone snake
        if (this.cloneSnake && this.cloneSnake.length > 0) {
            this.drawCloneSnake();
        }
        
        // Laser effect
        if (this.laserActive && this.laserTarget) {
            this.drawLaser();
        }

        ctx.restore();
    }
    
    drawUltimateBar() {
        if (this.ultimateCharge <= 0) return;
        
        const ctx = this.ctx;
        const barWidth = 200;
        const barHeight = 8;
        const x = (this.canvas.width - barWidth) / 2;
        const y = this.canvas.height - 30;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
        
        // Fill
        const fillWidth = (this.ultimateCharge / this.ultimateMax) * barWidth;
        const gradient = ctx.createLinearGradient(x, y, x + fillWidth, y);
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(1, '#00ffff');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, fillWidth, barHeight);
        
        // Glow when full
        if (this.ultimateCharge >= this.ultimateMax) {
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(x - 1, y - 1, barWidth + 2, barHeight + 2);
            ctx.shadowBlur = 0;
        }
        
        // Label
        ctx.font = '10px Orbitron, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(this.ultimateCharge >= this.ultimateMax ? 'ULTIMATE READY [Q]' : 'ULTIMATE', this.canvas.width / 2, y - 5);
        
        // Draw Puzzle Goal
        if (this.gameMode === GameMode.PUZZLE && this.customLevelConfig && this.customLevelConfig.goal.type === 'reach_goal') {
             const target = this.customLevelConfig.goal.target;
             const tx = target.x * cellSize;
             const ty = target.y * cellSize;
             
             // Draw swirling portal or flag
             ctx.fillStyle = `hsl(${Date.now() / 10 % 360}, 100%, 50%)`;
             ctx.fillRect(tx, ty, cellSize, cellSize);
             
             ctx.strokeStyle = '#fff';
             ctx.lineWidth = 2;
             ctx.strokeRect(tx, ty, cellSize, cellSize);
        }
    }
    
    drawCloneSnake() {
        const ctx = this.ctx;
        const cellSize = this.cellSize;
        
        ctx.globalAlpha = 0.5;
        
        for (let i = 0; i < this.cloneSnake.length; i++) {
            const seg = this.cloneSnake[i];
            const x = seg.x * cellSize;
            const y = seg.y * cellSize;
            
            ctx.fillStyle = '#88ff88';
            ctx.shadowColor = '#88ff88';
            ctx.shadowBlur = 5;
            
            const padding = 2;
            const radius = 4;
            this.roundRect(x + padding, y + padding, cellSize - padding * 2, cellSize - padding * 2, radius);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
    
    drawLaser() {
        const ctx = this.ctx;
        const head = this.snake[0];
        const startX = head.x * this.cellSize + this.cellSize / 2;
        const startY = head.y * this.cellSize + this.cellSize / 2;
        const endX = this.laserTarget.x * this.cellSize + this.cellSize / 2;
        const endY = this.laserTarget.y * this.cellSize + this.cellSize / 2;
        
        // Laser beam
        ctx.strokeStyle = '#ff0088';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff0088';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Core
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }

    render2D() {
        this.drawGrid();
        this.drawObstacles();
        this.drawFood();
        this.drawSnake();
        
        // Render boss if active
        if (this.currentBoss) {
            this.currentBoss.render(this.ctx);
        }
        
        // Use new particle system
        if (this.enableParticles) {
            this.particleSystem.render(this.ctx);
        }
        
        // Legacy particles
        this.drawParticles();

        // Render Battle Royale AI
        if (this.gameMode === GameMode.MULTIPLAYER && this.battleRoyale) {
            this.battleRoyale.render(this.ctx, this.cellSize);
        }
    }

    // 3D Isometric rendering
    renderIsometric() {
        const ctx = this.ctx;
        const tileW = this.tileWidth;
        const tileH = this.tileHeight;
        const offsetX = this.canvas.width / 2;
        const offsetY = 50;  // Adjusted for better centering

        // Draw floor tiles with subtle gradient
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const iso = this.toIso(x, y, offsetX, offsetY, tileW, tileH);
                this.drawIsoTile(iso.x, iso.y, tileW, tileH, this.theme.grid, false);
            }
        }

        // Draw walls (border) - only corners for visual clarity
        for (let i = 0; i < this.gridSize; i++) {
            const top = this.toIso(i, -1, offsetX, offsetY, tileW, tileH);
            this.drawIsoCube(top.x, top.y, tileW, tileH, this.theme.wall || '#444', 6);
            const bottom = this.toIso(i, this.gridSize, offsetX, offsetY, tileW, tileH);
            this.drawIsoCube(bottom.x, bottom.y, tileW, tileH, this.theme.wall || '#444', 6);
            const left = this.toIso(-1, i, offsetX, offsetY, tileW, tileH);
            this.drawIsoCube(left.x, left.y, tileW, tileH, this.theme.wall || '#444', 6);
            const right = this.toIso(this.gridSize, i, offsetX, offsetY, tileW, tileH);
            this.drawIsoCube(right.x, right.y, tileW, tileH, this.theme.wall || '#444', 6);
        }

        // Draw obstacles as raised blocks
        for (const obs of this.obstacles) {
            const iso = this.toIso(obs.x, obs.y, offsetX, offsetY, tileW, tileH);
            this.drawIsoCube(iso.x, iso.y, tileW, tileH, this.theme.wall || '#555', 10);
        }

        // Draw food as glowing 3D cube
        const foodIso = this.toIso(this.food.x, this.food.y, offsetX, offsetY, tileW, tileH);
        ctx.shadowColor = this.foodType.color;
        ctx.shadowBlur = 15;
        this.drawIsoCube(foodIso.x, foodIso.y, tileW, tileH, this.foodType.color, 8);
        ctx.shadowBlur = 0;
        // Icon rendering removed to avoid SVG text leakage
        // ctx.font = `${Math.floor(tileW * 0.8)}px Arial`;
        // ctx.textAlign = 'center';
        // ctx.textBaseline = 'middle';
        // ctx.fillText(this.foodType.icon, foodIso.x, foodIso.y - 12);

        // Draw snake as 3D cubes (draw from tail to head for proper z-order)
        for (let i = this.snake.length - 1; i >= 0; i--) {
            const seg = this.snake[i];
            const iso = this.toIso(seg.x, seg.y, offsetX, offsetY, tileW, tileH);
            const height = i === 0 ? 12 : 8;
            const alpha = 1 - (i / this.snake.length) * 0.4;
            ctx.globalAlpha = this.activePowerUps.ghost ? 0.5 : alpha;
            ctx.shadowColor = this.theme.snake;
            ctx.shadowBlur = i === 0 ? 10 : 3;
            this.drawIsoCube(iso.x, iso.y, tileW, tileH, this.theme.snake, height);
            ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;

        this.drawParticles();
    }

    toIso(x, y, offsetX, offsetY, tileW, tileH) {
        return {
            x: (x - y) * (tileW / 2) + offsetX,
            y: (x + y) * (tileH / 2) + offsetY
        };
    }

    drawIsoTile(x, y, w, h, color, filled = true) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w / 2, y + h / 2);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x - w / 2, y + h / 2);
        ctx.closePath();
        if (filled) {
            ctx.fillStyle = color;
            ctx.fill();
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }

    drawIsoCube(x, y, w, h, color, height) {
        const ctx = this.ctx;
        
        // Parse color to get variants
        const baseColor = color;
        const darkColor = this.shadeColor(color, -30);
        const lightColor = this.shadeColor(color, 20);

        // Top face
        ctx.beginPath();
        ctx.moveTo(x, y - height);
        ctx.lineTo(x + w / 2, y + h / 2 - height);
        ctx.lineTo(x, y + h - height);
        ctx.lineTo(x - w / 2, y + h / 2 - height);
        ctx.closePath();
        ctx.fillStyle = lightColor;
        ctx.fill();

        // Left face
        ctx.beginPath();
        ctx.moveTo(x - w / 2, y + h / 2 - height);
        ctx.lineTo(x, y + h - height);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x - w / 2, y + h / 2);
        ctx.closePath();
        ctx.fillStyle = darkColor;
        ctx.fill();

        // Right face
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h / 2 - height);
        ctx.lineTo(x, y + h - height);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + w / 2, y + h / 2);
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
    }

    shadeColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, Math.max(0, (num >> 16) + amt));
        const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
        const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    }

    toggleView() {
        this.isIsometric = !this.isIsometric;
        const btn = document.getElementById('view-toggle');
        if (btn) btn.textContent = this.isIsometric ? '2D View' : '3D View';
        if (this.isIsometric) this.checkAchievement('iso_pioneer');
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = this.theme.grid;
        ctx.lineWidth = 1;

        for (let i = 0; i <= this.gridSize; i++) {
            const pos = i * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, this.canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(this.canvas.width, pos);
            ctx.stroke();
        }
    }

    drawObstacles() {
        const ctx = this.ctx;
        ctx.fillStyle = '#444';
        ctx.shadowColor = '#222';
        ctx.shadowBlur = 5;

        for (const obs of this.obstacles) {
            // Handle moving obstacles
            let x, y;
            if (obs.path && obs.pathProgress !== undefined) {
                x = obs.x * this.cellSize;
                y = obs.y * this.cellSize;
            } else {
                x = obs.x * this.cellSize;
                y = obs.y * this.cellSize;
            }
            ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
        }
        ctx.shadowBlur = 0;
    }

    drawSnake() {
        const ctx = this.ctx;
        const cellSize = this.cellSize;
        const time = this.elapsedTime || 0;

        // Ghost effect
        if (this.activePowerUps.ghost) {
            ctx.globalAlpha = 0.6;
        }
        
        // Invincible glow effect
        if (this.activePowerUps.invincible) {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 20 + Math.sin(time * 10) * 10;
        }

        // Use physics system for smooth positions if enabled
        const useSmooth = this.enableSmoothMovement && this.physics.visualPositions.length > 0;

        this.snake.forEach((segment, index) => {
            let x, y;
            
            if (useSmooth && this.physics.visualPositions[index]) {
                // Use smooth interpolated position
                const vis = this.physics.visualPositions[index];
                x = vis.x - cellSize / 2;
                y = vis.y - cellSize / 2;
                
                // Add wiggle effect for body segments
                if (index > 0) {
                    const wiggle = this.physics.calculateWiggle(index, time, this.snake.length);
                    x += wiggle.x;
                    y += wiggle.y;
                }
            } else {
                // Fallback to grid position
                x = segment.x * cellSize;
                y = segment.y * cellSize;
            }

            const t = index / this.snake.length;
            ctx.fillStyle = this.theme.snake;
            ctx.globalAlpha = this.activePowerUps.ghost ? 0.6 : (1 - t * 0.3);
            
            // Invincible rainbow effect
            if (this.activePowerUps.invincible) {
                const hue = (time * 100 + index * 20) % 360;
                ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
            }

            if (!this.activePowerUps.invincible) {
                ctx.shadowColor = this.theme.snake;
                ctx.shadowBlur = index === 0 ? 15 : 5;
            }

            // Get stretch/squash for head
            const stretch = this.physics.calculateStretchSquash(
                index, 
                this.direction, 
                this.previousDirection, 
                this.moveProgress
            );

            const padding = 2;
            const radius = 4;
            const width = (cellSize - padding * 2) * stretch.scaleX;
            const height = (cellSize - padding * 2) * stretch.scaleY;
            const offsetX = (cellSize - padding * 2 - width) / 2;
            const offsetY = (cellSize - padding * 2 - height) / 2;
            
            this.roundRect(x + padding + offsetX, y + padding + offsetY, width, height, radius);
            ctx.fill();

            if (index === 0) {
                this.drawEyes(segment);
            }

            ctx.shadowBlur = 0;
        });

        ctx.globalAlpha = 1;
    }

    drawEyes(head) {
        const ctx = this.ctx;
        const cellSize = this.cellSize;
        const x = head.x * cellSize + cellSize / 2;
        const y = head.y * cellSize + cellSize / 2;

        const eyeOffset = 4;
        const eyeSize = 3;

        let leftEye, rightEye;
        switch (this.direction) {
            case 'UP':
                leftEye = { x: x - eyeOffset, y: y - eyeOffset };
                rightEye = { x: x + eyeOffset, y: y - eyeOffset };
                break;
            case 'DOWN':
                leftEye = { x: x - eyeOffset, y: y + eyeOffset };
                rightEye = { x: x + eyeOffset, y: y + eyeOffset };
                break;
            case 'LEFT':
                leftEye = { x: x - eyeOffset, y: y - eyeOffset };
                rightEye = { x: x - eyeOffset, y: y + eyeOffset };
                break;
            default:
                leftEye = { x: x + eyeOffset, y: y - eyeOffset };
                rightEye = { x: x + eyeOffset, y: y + eyeOffset };
        }

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(leftEye.x, leftEye.y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightEye.x, rightEye.y, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(leftEye.x, leftEye.y, eyeSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightEye.x, rightEye.y, eyeSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFood() {
        const ctx = this.ctx;
        const cellSize = this.cellSize;
        const x = this.food.x * cellSize + cellSize / 2;
        const y = this.food.y * cellSize + cellSize / 2;
        const radius = cellSize / 2 - 3;
        
        // Use physics system for bouncing animation
        let drawX = x;
        let drawY = y;
        if (this.foodVisualPos) {
            drawX = this.foodVisualPos.x;
            drawY = this.foodVisualPos.y;
        }

        const pulse = 1 + Math.sin((this.elapsedTime || 0) * 5) * 0.1;
        const pulseRadius = radius * pulse;

        ctx.shadowColor = this.foodType.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.foodType.color;
        ctx.beginPath();
        ctx.arc(drawX, drawY, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Icon rendering removed to avoid SVG text leakage
        // ctx.font = `${cellSize * 0.6}px Arial`;
        // ctx.textAlign = 'center';
        // ctx.textBaseline = 'middle';
        // ctx.fillText(this.foodType.icon, drawX, drawY);
    }

    drawCombo() {
        const ctx = this.ctx;
        ctx.save();
        ctx.font = 'bold 20px Orbitron, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = `hsl(${this.combo * 30}, 100%, 60%)`;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fillText(`${this.combo}x COMBO`, this.canvas.width - 10, 25);
        ctx.restore();
    }

    roundRect(x, y, width, height, radius) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    spawnParticles(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * 100,
                vy: Math.sin(angle) * 100,
                life: 0.5,
                maxLife: 0.5,
                size: 4,
                color
            });
        }
    }

    spawnEatParticles() {
        const x = this.food.x * this.cellSize + this.cellSize / 2;
        const y = this.food.y * this.cellSize + this.cellSize / 2;
        this.spawnParticles(x, y, this.foodType.color, 8);
    }

    spawnDeathParticles() {
        const head = this.snake[0];
        const x = head.x * this.cellSize + this.cellSize / 2;
        const y = head.y * this.cellSize + this.cellSize / 2;

        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.8,
                maxLife: 0.8,
                size: 6,
                color: this.theme.snake
            });
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            p.vx *= 0.95;
            p.vy *= 0.95;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawParticles() {
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

    showScorePopup(points) {
        const wrapper = document.querySelector('.canvas-wrapper');
        if (!wrapper) return;

        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${points}`;
        if (this.combo > 1) {
            popup.style.color = `hsl(${this.combo * 30}, 100%, 60%)`;
        }
        popup.style.left = `${this.food.x * this.cellSize}px`;
        popup.style.top = `${this.food.y * this.cellSize}px`;

        wrapper.appendChild(popup);
        setTimeout(() => popup.remove(), 800);
    }

    renderMenuBackground() {
        const ctx = this.ctx;
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Animated grid
        const time = Date.now() / 1000;
        ctx.strokeStyle = `rgba(0, 255, 136, ${0.05 + Math.sin(time) * 0.02})`;
        ctx.lineWidth = 1;

        for (let i = 0; i <= this.gridSize; i++) {
            const pos = i * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, this.canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(this.canvas.width, pos);
            ctx.stroke();
        }

        // Floating snake animation
        const snakeX = Math.sin(time * 0.5) * 50 + 200;
        const snakeY = Math.cos(time * 0.3) * 30 + 200;
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(snakeX, snakeY, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        requestAnimationFrame(() => {
            if (this.showingMenu) this.renderMenuBackground();
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SnakeGame();
});
