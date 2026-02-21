/**
 * Tetris Enhanced - Main Game Class
 * Integrates all game systems and manages the game loop
 */
import { GameEngine, GameState } from '../../js/engine/GameEngine.js';
import { GameModeManager, GameModeType } from './GameModes.js';
import { AchievementSystem, ACHIEVEMENT_CATEGORIES } from './AchievementSystem.js';
import { PowerUpSystem, PowerUpType } from './PowerUpSystem.js';
import { EffectsSystem } from './EffectsSystem.js';
import { StoryMode } from './StoryMode.js';
import { TetrisMultiplayer } from './TetrisMultiplayer.js';
import { dailyChallengeSystem } from '../../js/engine/DailyChallengeSystem.js';
import { ICONS } from './Icons.js';

// Grid dimensions
const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 30;

const TETROMINOES = {
    I: { shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], color: '#00f0f0' },
    J: { shape: [[1,0,0], [1,1,1], [0,0,0]], color: '#0000f0' },
    L: { shape: [[0,0,1], [1,1,1], [0,0,0]], color: '#f0a000' },
    O: { shape: [[1,1], [1,1]], color: '#f0f000' },
    S: { shape: [[0,1,1], [1,1,0], [0,0,0]], color: '#00f000' },
    T: { shape: [[0,1,0], [1,1,1], [0,0,0]], color: '#a000f0' },
    Z: { shape: [[1,1,0], [0,1,1], [0,0,0]], color: '#f00000' }
};



class Tetris extends GameEngine {
    constructor() {
        super({
            canvasId: 'game-canvas',
            gameId: 'tetris',
            width: COLS * CELL_SIZE,
            height: ROWS * CELL_SIZE,
            pixelPerfect: true
        });

        // Additional canvases
        this.holdCanvas = document.getElementById('hold-canvas');
        this.holdCtx = this.holdCanvas?.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas?.getContext('2d');

        // Initialize Systems
        this.modeManager = new GameModeManager(this);
        this.achievements = new AchievementSystem(this);
        this.powerUps = new PowerUpSystem(this);
        this.effects = new EffectsSystem(this);
        this.storyMode = new StoryMode(this);
        this.multiplayer = new TetrisMultiplayer(this);

        // Core Game State
        this.grid = [];
        this.currentPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.nextPieces = [];
        this.linesCleared = 0;
        
        // Modifiers & Flags
        this.holdDisabled = false;
        this.invisibleMode = false;
        this.pieceFilter = null;
        this.isPlayingStory = false;

        // Timing
        this.dropTimer = 0;
        this.baseDropInterval = 1.0;
        this.dropInterval = this.baseDropInterval;
        this.lockDelay = 0.5;
        this.lockTimer = 0;
        this.isLocking = false;

        // Input
        this.dasDelay = 0.15;
        this.dasInterval = 0.05;
        this.dasTimer = 0;
        this.dasDirection = 0;
        this.softDropping = false;

        // Scoring context
        this.combo = 0;
        this.backToBack = false;

        this.colors = {
            bg: '#0a0a0f',
            grid: 'rgba(255, 255, 255, 0.05)',
            ghost: 'rgba(255, 255, 255, 0.2)',
            locked: '#333'
        };

        // Daily Challenge State
        this.dailyChallengeActive = false;
        this.dailyTarget = 10000;

        this.bindEvents();
        this.setupUI();
        this.loadDailyStatus();
        this.onReset();
    }

    bindEvents() {
        // Achievement unlocks
        this.onAchievementUnlocked = (achievement) => {
            if (this.effects) {
                this.effects.showMessage(`${ICONS.TROPHY} ${achievement.name}`, 
                    this.canvas.width / 2, 100, { color: '#ffff00', life: 3 });
                this.effects.addFlash('#ffff00', 0.2);
            }
        };

        // Game Mode events
        this.onLevelUp = (level) => {
            this.effects.showLevelUp(level, this.canvas.width / 2, this.canvas.height / 2);
            this.achievements.onLevelUp(level);
        };

        this.onModeWin = (stats) => {
            this.gameOver(true, stats);
        };

        this.onModeLose = (stats) => {
            this.gameOver(false, stats);
        };

        // Story Mode events
        this.onShowDialogue = (text) => {
            this.pause();
            const box = document.getElementById('dialogue-box');
            const content = document.getElementById('dialogue-text');
            if (box && content) {
                content.textContent = text;
                box.style.display = 'block';
            }
        };

        this.onStoryLevelComplete = ({ level, stars, state }) => {
            this.gameOver(true, { level, stars, ...state });
        };

        this.onStoryLevelFailed = ({ level, reason }) => {
            this.gameOver(false, { reason });
        };

        // Power-Up events
        this.onPowerUpSpawned = (type, pos) => {
            this.effects.showMessage('Power-Up!', pos.x * CELL_SIZE, pos.y * CELL_SIZE, 
                { fontSize: 14, color: '#00ff00' });
        };

        this.onPowerUpActivated = (type) => {
            this.updatePowerUpUI();
            const config = this.powerUps.activePowerUps.find(p => p.type === type)?.config 
                || this.powerUps.activePowerUps[this.powerUps.activePowerUps.length-1]?.config;
            
            if (config) {
                this.effects.showMessage(config.name, 
                    this.canvas.width/2, this.canvas.height/2, 
                    { color: config.color, fontSize: 24 });
            }
        };
        
        this.onPowerUpExpired = () => this.updatePowerUpUI();

        this.onBombEffect = (x, y, count) => this.effects.showBombExplosion(x, y, CELL_SIZE);
        this.onLightningEffect = () => this.effects.showLightning(this.canvas.width, this.canvas.height, CELL_SIZE);
        this.onGhostWarpEffect = () => this.effects.addFlash('#aa88ff', 0.1);
        this.onColorBlastEffect = () => this.effects.addFlash('#ff00ff', 0.1);
        this.onShuffleEffect = () => this.effects.addFlash('#00ff88', 0.1);
    }

    loadDailyStatus() {
        const status = dailyChallengeSystem.getStatus('tetris');
        const statusEl = document.getElementById('daily-status');
        const startBtn = document.getElementById('daily-start-btn');
        
        if (statusEl && startBtn) {
            if (status.completed) {
                statusEl.textContent = 'COMPLETED ✅';
                statusEl.style.color = '#00ff00';
                startBtn.textContent = 'PLAY AGAIN';
            } else {
                statusEl.textContent = 'NOT COMPLETED';
                statusEl.style.color = '#888';
                startBtn.textContent = 'PLAY DAILY';
            }
        }
    }

    startDailyChallenge() {
        console.log('[Game] Starting Daily Challenge');
        this.dailyChallengeActive = true;
        this.dailyTarget = 10000;
        this.setMode(GameModeType.MARATHON);
        this.start();
    }

    setupUI() {
        console.log('Setting up UI...');
        
        // Inject Icons
        document.getElementById('achievements-btn').innerHTML = ICONS.TROPHY;
        document.getElementById('sound-btn').innerHTML = ICONS.SOUND_ON;
        document.getElementById('pause-btn').innerHTML = ICONS.PAUSE;
        
        // Sidebar Init
        document.querySelector('.mode-icon').innerHTML = ICONS.MODE_MARATHON;

        // SPA Back Button
        document.getElementById('tetris-back-btn')?.addEventListener('click', () => {
            if (window.GameBridge) {
                window.GameBridge.exitGame();
            } else {
                window.location.href = '../../index.html';
            }
        });
        
        // Helper to safe-bind events
        const bind = (id, action) => {
            const el = document.getElementById(id);
            if (el) {
                // Remove old listener if any (simple hack: clone node or just rely on this being called once)
                // For now, we assume setupUI is called once per instantiation
                el.addEventListener('click', (e) => {
                    console.log(`[UI] Clicked: ${id}`);
                    e.target.blur(); // Remove focus
                    action(e);
                });
            } else {
                console.warn(`[UI] Element not found: ${id}`);
            }
        };

        // Main Menu Buttons
        bind('play-btn', () => {
             console.log('[UI] Starting Marathon Mode');
             this.setMode(GameModeType.MARATHON);
             this.start();
        });

        bind('modes-btn', () => {
            this.showModeSelection();
        });

        bind('story-btn', () => {
            this.showStoryMenu();
        });

        bind('daily-start-btn', () => {
             this.startDailyChallenge();
        });

        // Multiplayer Controls
        bind('multiplayer-btn', () => {
            document.getElementById('start-screen').style.display = 'none';
            document.getElementById('multiplayer-lobby').style.display = 'flex';
        });

        bind('create-room-btn', async () => {
            const btn = document.getElementById('create-room-btn');
            btn.disabled = true;
            btn.innerText = 'CREATING...';
            
            try {
                const roomId = await this.multiplayer.createRoom();
                document.getElementById('lobby-initial').style.display = 'none';
                document.getElementById('lobby-waiting').style.display = 'block';
                document.getElementById('current-room-id').innerText = roomId;
            } catch (e) {
                console.error(e);
                alert('Failed to create room: ' + e.message);
                btn.disabled = false;
                btn.innerText = 'CREATE ROOM';
            }
        });

        bind('join-room-btn', async () => {
            const input = document.getElementById('room-id-input');
            const roomId = input.value.trim();
            if (!roomId) return;

            const btn = document.getElementById('join-room-btn');
            btn.disabled = true;
            btn.innerText = '...';

            try {
                await this.multiplayer.joinRoom(roomId);
                document.getElementById('lobby-initial').style.display = 'none';
                document.getElementById('lobby-waiting').style.display = 'block';
                document.getElementById('current-room-id').innerText = roomId;
                document.querySelector('#lobby-waiting p').innerText = 'Waiting for host to start...';
            } catch (e) {
                console.error(e);
                alert('Failed to join: ' + e.message);
                btn.disabled = false;
                btn.innerText = 'JOIN';
            }
        });

        bind('lobby-back-btn', () => {
            // Leave room logic here if needed
            document.getElementById('multiplayer-lobby').style.display = 'none';
            document.getElementById('start-screen').style.display = 'flex';
            
            // Reset lobby UI
            document.getElementById('lobby-initial').style.display = 'flex';
            document.getElementById('lobby-waiting').style.display = 'none';
            document.getElementById('lobby-results').style.display = 'none';
            
            // Reset buttons
            document.getElementById('create-room-btn').disabled = false;
            document.getElementById('create-room-btn').innerText = 'CREATE ROOM';
            document.getElementById('join-room-btn').disabled = false;
            document.getElementById('join-room-btn').innerText = 'JOIN';
        });

        // In-game controls
        bind('pause-btn', () => this.togglePause());
        
        bind('restart-btn', () => {
            this.reset();
            this.start();
        });
        
        bind('resume-btn', () => this.togglePause()); // Resume logic triggers unpause
        
        bind('quit-btn', () => {
            this.reset();
            this.showStartScreen();
        });
        
        bind('retry-btn', () => {
            this.reset();
            this.start();
        });
        
        bind('menu-btn', () => {
            this.reset();
            this.showStartScreen();
        });

        // Dialogue
        const nextBtn = document.querySelector('.dialogue-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                document.getElementById('dialogue-box').style.display = 'none';
                this.resume();
            });
        }

        // Story Menu Back
        bind('story-back-btn', () => {
            document.getElementById('story-menu').style.display = 'none';
            document.getElementById('start-screen').style.display = 'flex';
        });

        // Achievements
        bind('achievements-btn', () => this.showAchievements());
        
        const closeModal = document.querySelector('.close-modal');
        if (closeModal) closeModal.addEventListener('click', () => {
            document.getElementById('achievements-modal').style.display = 'none';
        });
        
        // Change Mode button in sidebar
        bind('change-mode-btn', () => {
            this.pause();
            this.showModeSelection();
        });
        
        // Touch controls
        this.setupTouchControls();

        // Keyboard
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Render Key Icons in Footer
        const keys = document.querySelectorAll('.key-group');
        if(keys.length >= 5) {
             // Basic replacement if structure matches index.html
             // indexes: 0:Move, 1:Rotate, 2:Soft, 3:Hard, 4:Hold
             keys[0].querySelector('.key:nth-child(1)').innerHTML = ICONS.KEY_ARROW_LEFT;
             keys[0].querySelector('.key:nth-child(2)').innerHTML = ICONS.KEY_ARROW_RIGHT;
             keys[1].querySelector('.key').innerHTML = ICONS.KEY_ROTATE; // Up arrow or rotate icon
             keys[2].querySelector('.key').innerHTML = ICONS.KEY_ARROW_DOWN;
        }
    }

    // ... (touch controls) ...

    setMode(modeType) {
        console.log(`[Game] Setting mode: ${modeType}`);
        if (this.modeManager.setMode(modeType)) {
            this.isPlayingStory = false;
            this.updateModeUI(modeType);
            this.reset();
            return true;
        }
        return false;
    }



    showStartScreen() {
        console.log('[UI] Showing start screen');
        this.state = GameState.MENU;
        this.hideAllOverlays();
        document.getElementById('start-screen').style.display = 'flex';
    }

    showModeSelection() {
        const menu = document.getElementById('mode-menu');
        const grid = menu.querySelector('.mode-grid');
        grid.innerHTML = '';
        
        this.modeManager.getAllModes().forEach(mode => {
            const el = document.createElement('div');
            el.className = `menu-card ${mode.unlocked ? '' : 'locked'}`;
            // Map mode type to ICON
            let icon = ICONS.MODE_MARATHON;
            if (mode.type === GameModeType.SPRINT) icon = ICONS.MODE_SPRINT;
            if (mode.type === GameModeType.ULTRA) icon = ICONS.MODE_ULTRA;
            if (mode.type === GameModeType.ZEN) icon = ICONS.MODE_ZEN;
            if (mode.type === GameModeType.SURVIVAL) icon = ICONS.MODE_SURVIVAL;

            el.innerHTML = `
                <span class="mode-icon">${icon}</span>
                <h4>${mode.name}</h4>
                <p>${mode.description}</p>
                ${!mode.unlocked ? `<p style="grid-column:2; color:#ff4444; font-size: 0.7rem; margin-top:5px;">${ICONS.LOCK} ${mode.unlockCondition}</p>` : ''}
            `;
            el.onclick = () => {
                if (mode.unlocked) {
                    this.setMode(mode.type);
                    this.hideAllOverlays();
                    this.start();
                }
            };
            grid.appendChild(el);
        });

        this.hideAllOverlays();
        menu.style.display = 'flex'; // Flex to center content
    }

    showStoryMenu() {
        console.log('[UI] Showing story menu');
        const menu = document.getElementById('story-menu');
        const selector = document.querySelector('.chapter-selector');
        
        // Show chapters
        const chapters = this.storyMode.getChapters();
        selector.innerHTML = chapters.map((c, i) => `
            <button class="chapter-btn ${c.unlocked ? '' : 'locked'} ${i+1 === this.storyMode.progress.currentChapter ? 'active' : ''}" 
                ${!c.unlocked ? 'disabled' : ''}
                onclick="window.game.switchChapter(${i+1})">
                Chapter ${c.number}
            </button>
        `).join('');
        
        // Show levels for current chapter (default to current progression)
        this.renderStoryLevels(this.storyMode.progress.currentChapter);

        this.hideAllOverlays();
        menu.style.display = 'flex';
    }

    switchChapter(chapterNum) {
        this.renderStoryLevels(chapterNum);
        // visual update for active button
        const buttons = document.querySelectorAll('.chapter-btn');
        buttons.forEach((btn, idx) => {
            if (idx + 1 === chapterNum) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    renderStoryLevels(chapter) {
        const grid = document.getElementById('level-grid');
        const levels = this.storyMode.getLevelsByChapter(chapter);
        
        grid.innerHTML = levels.map(l => `
            <div class="level-node ${l.unlocked ? 'unlocked' : 'locked'} ${l.completed ? 'completed' : ''}"
                 onclick="window.game.startStoryLevel(${l.id})">
                <span style="font-weight:bold; font-size: 1.2rem;">${l.id}</span>
                <div class="stars">
                    ${Array(3).fill(0).map((_, i) => 
                        `<span style="color:${i < l.stars ? '#ffee00' : '#444'}; width:14px; height:14px; display:inline-block;">${ICONS.STAR}</span>`
                    ).join('')}
                </div>
            </div>
        `).join('');
    }

    startStoryLevel(levelId) {
        console.log('[Game] Requesting Story Level:', levelId);
        if (this.storyMode.startLevel(levelId)) {
            this.isPlayingStory = true;
            this.hideAllOverlays();
            
            // Reset game state for new level
            this.reset();
            
            // Ensure visual updates
            this.updateScore();
            if (this.storyMode.currentLevel.presetGrid) {
                this.drawGrid(); // Immediate draw
            }
            
            this.start();
        } else {
            console.warn('[Game] Cannot start locked level:', levelId);
            // Visual feedback for locked level (shake or sound) within the UI
        }
    }

    startMultiplayerGame() {
        console.log('[Game] Starting Multiplayer Match!');
        this.hideAllOverlays();
        this.reset();
        this.setMode(GameModeType.MARATHON); // Base rules on Marathon for now
        this.start();
        
        // Show opponent board placeholder
        // TODO: Implement actual opponent rendering
    }

    start() {
        console.log('[Game] Starting...');
        this.hideAllOverlays();
        if (!this.currentPiece) {
            this.spawnPiece();
        }
        super.start();
    }

    hideAllOverlays() {
        const overlays = ['start-screen', 'mode-menu', 'story-menu', 'pause-screen', 'game-over-screen', 'multiplayer-lobby'];
        overlays.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }

    setupTouchControls() {
        const touchMap = {
            'left': () => {
                this.moveHorizontal(-1);
                this.dasDirection = -1;
            },
            'right': () => {
                this.moveHorizontal(1);
                this.dasDirection = 1;
            },
            'rotate': () => this.rotate(1),
            'down': () => this.moveDown(),
            'drop': () => this.hardDrop(),
            'hold': () => this.hold()
        };
        // Add listeners if elements exist
        // ... (can add real implementation if needed, but for now just function existence prevents crash)
    }

    showAchievements() {
        const list = document.getElementById('full-achievements-list');
        const all = this.achievements.getAllAchievements();
        const unlocked = all.filter(a => a.unlocked).length;
        const totalPoints = this.achievements.getTotalPoints();
        
        document.getElementById('total-unlocked').textContent = `${unlocked}/${all.length}`;
        document.getElementById('total-points').textContent = totalPoints;

        list.innerHTML = all.map(a => `
            <div class="achievement-card ${a.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon" style="color: ${ACHIEVEMENT_CATEGORIES[a.category].color}">
                    ${a.icon}
                </div>
                <div class="achievement-info">
                    <div class="achievement-title">${a.name}</div>
                    <div class="achievement-desc">${a.description}</div>
                </div>
                ${a.unlocked ? `<div class="check">${ICONS.CHECK}</div>` : ''}
            </div>
        `).join('');
        
        document.getElementById('achievements-modal').style.display = 'flex';
    }

    updateModeUI(modeType) {
        const config = this.modeManager.getModeConfig(modeType);
        const display = document.querySelector('.mode-display');
        if (display) {
            const icon = display.querySelector('.mode-icon');
            const name = display.querySelector('.mode-name');
            if(icon) {
                 // Update icon safely
                 let iconSvg = ICONS.MODE_MARATHON;
                 if (modeType === GameModeType.SPRINT) iconSvg = ICONS.MODE_SPRINT;
                 if (modeType === GameModeType.ULTRA) iconSvg = ICONS.MODE_ULTRA;
                 if (modeType === GameModeType.ZEN) iconSvg = ICONS.MODE_ZEN;
                 if (modeType === GameModeType.SURVIVAL) iconSvg = ICONS.MODE_SURVIVAL;
                 icon.innerHTML = iconSvg;
            }
            if(name) name.textContent = config.name;
        }
    }

    updatePowerUpUI() {
        const container = document.getElementById('active-power-ups');
        const active = this.powerUps.getActivePowerUps();
        
        if (active.length === 0) {
            container.innerHTML = '<div class="empty-power-ups">No active effects</div>';
            return;
        }

        container.innerHTML = active.map(p => `
            <div class="active-power-up-item" style="color: ${p.config.color}">
                <span>${p.config.icon} ${p.config.name}</span>
                <span>${Math.ceil(p.getRemainingTime()/1000)}s</span>
            </div>
        `).join('');
    }

    // --- Core Game Logic ---

    onReset() {
        // Reset flags
        this.holdDisabled = false;
        this.invisibleMode = false;
        this.pieceFilter = null;
        
        // Reset State
        this.grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
        this.currentPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.nextPieces = [];
        this.linesCleared = 0;
        this.level = 1;
        this.score = 0;
        
        // Reset sub-systems
        this.powerUps.reset();
        this.effects.reset();
        this.achievements.onGameStart();
        if (this.isPlayingStory) {
            // Story mode reset handled by StoryMode.js
        } else {
            this.modeManager.initialize();
        }

        // Reset Timing
        this.dropTimer = 0;
        this.dropInterval = this.baseDropInterval;
        this.lockTimer = 0;
        this.isLocking = false;
        this.combo = 0;
        this.backToBack = false;

        this.fillBag();
        this.updateStatsDisplay();
        this.render();
        this.renderHoldPiece();
        this.renderNextPieces();
        
        // Clear side canvases if empty
        if (!this.holdPiece && this.holdCtx) {
            this.holdCtx.clearRect(0, 0, 80, 80);
        }
    }

    update(dt) {
        if (this.state !== GameState.PLAYING) return;

        // Update systems
        this.effects.update(dt);
        this.powerUps.update(dt);
        
        if (this.isPlayingStory) {
            this.storyMode.update(dt);
        } else {
            this.modeManager.update(dt);
        }

        if (!this.currentPiece) return;

        // Handle DAS
        if (this.dasDirection !== 0) {
            this.dasTimer += dt;
            if (this.dasTimer >= this.dasDelay) {
                if ((this.dasTimer - this.dasDelay) % this.dasInterval < dt) {
                    this.moveHorizontal(this.dasDirection);
                }
            }
        }

        // Gravity with modifiers
        const gravityMult = this.powerUps.getGravityMultiplier();
        const dropSpeed = (this.softDropping ? this.dropInterval / 20 : this.dropInterval) * gravityMult;
        
        this.dropTimer += dt;
        if (this.dropTimer >= dropSpeed) {
            this.dropTimer = 0;
            this.moveDown();
        }

        // Lock Delay
        if (this.isLocking) {
            this.lockTimer += dt;
            if (this.lockTimer >= this.lockDelay) {
                this.lockPiece();
            }
        }
    }

    render() {
        const ctx = this.ctx;
        const shake = this.effects.getShakeOffset();

        ctx.save();
        ctx.translate(shake.x, shake.y);

        // Clear
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();
        this.drawLockedPieces();
        this.powerUps.renderPowerUpBlocks(ctx, CELL_SIZE);
        this.drawGhostPiece();
        this.drawCurrentPiece();
        
        // Render Effects
        this.effects.render(ctx, this.canvas.width, this.canvas.height);

        // Render Mode Overlays
        if (this.isPlayingStory) {
            this.storyMode.renderHUD(ctx, this.canvas.width, this.canvas.height);
        } else {
            this.modeManager.renderOverlay(ctx, this.canvas.width, this.canvas.height);
        }

        // Render achievement notifications
        if (this.achievements.hasNotifications()) {
            const notif = this.achievements.getNextNotification();
            this.effects.showMessage(`${ICONS.TROPHY} ${notif.name}`, this.canvas.width/2, 100, {
                color: '#ffff00', life: 3
            });
        }

        ctx.restore();
    }

    drawBlock(x, y, color, ctx = this.ctx, size = CELL_SIZE) {
        const padding = 1; // Small gap for grid effect
        const px = x * size + padding;
        const py = y * size + padding;
        const blockSize = size - padding * 2;

        // Retro Flat Style
        ctx.fillStyle = color;
        ctx.fillRect(px, py, blockSize, blockSize);

        // Inner Border for retro detail
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeRect(px + 1, py + 1, blockSize - 2, blockSize - 2);

        // Optional: Scanline effect or texture could go here
    }

    updateDropInterval() {
        // Standard Tetris speed curve: (0.8-((Level-1)*0.007))^(Level-1)
        // Simplified for this engine: Base * (0.85 ^ (Level-1))
        this.dropInterval = this.baseDropInterval * Math.pow(0.85, this.level - 1);
        console.log(`[Game] Level ${this.level}, Drop Interval: ${this.dropInterval.toFixed(3)}s`);
    }

    fillBag() {
        const pieces = Object.keys(TETROMINOES);
        
        // Apply filter if story mode requires (e.g., only 'T' pieces)
        const availablePieces = this.pieceFilter ? 
            pieces.filter(p => this.pieceFilter.includes(p)) : pieces;

        while (this.nextPieces.length < 7) {
            const bag = [...availablePieces].sort(() => Math.random() - 0.5);
            this.nextPieces.push(...bag);
        }
    }

    spawnPiece() {
        this.fillBag();
        const type = this.nextPieces.shift();
        const tetro = TETROMINOES[type];

        this.currentPiece = {
            type,
            shape: tetro.shape.map(row => [...row]),
            color: tetro.color,
            x: Math.floor((COLS - tetro.shape[0].length) / 2),
            y: 0,
            rotation: 0
        };

        if (!this.isValidPosition(this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver(false);
            return;
        }

        this.canHold = true;
        this.isLocking = false;
        this.lockTimer = 0;
        
        // Trigger Shuffle Power-Up check
        if (!this.isPlayingStory && !this.pieceFilter) {
            // Logic handled within PowerUpSystem if needed
        }

        this.renderNextPieces();
    }

    lockPiece() {
        if (!this.currentPiece) return;

        const { shape, color, x, y } = this.currentPiece;
        let tSpin = false;

        // Check T-Spin (Classic rules: 3 corners occupied)
        if (this.currentPiece.type === 'T') {
            let corners = 0;
            // Check 4 corners relative to center (1,1 of 3x3 shape)
            const offsets = [[0,0], [2,0], [0,2], [2,2]];
            offsets.forEach(([ox, oy]) => {
                const cx = x + ox;
                const cy = y + oy;
                if (cx < 0 || cx >= COLS || cy >= ROWS || (cy >= 0 && this.grid[cy][cx])) {
                    corners++;
                }
            });
            if (corners >= 3) tSpin = true;
        }

        // Add to grid
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const gridY = y + row;
                    const gridX = x + col;
                    if (gridY >= 0) {
                        this.grid[gridY][gridX] = color;
                    }
                }
            }
        }

        // Notify systems
        const mode = this.getCurrentModeHandler();
        mode?.onPiecePlaced();
        if (this.isPlayingStory) this.storyMode.onPiecePlaced();

        if (tSpin) {
            this.effects.showTSpin(x, y, CELL_SIZE);
            this.score += 400 * this.level; // T-Spin bonus
        }

        this.checkForClears();
        this.spawnPiece();
    }

    checkForClears() {
        const linesToClear = [];
        for (let row = ROWS - 1; row >= 0; row--) {
            if (this.grid[row].every(cell => cell !== null)) {
                linesToClear.push(row);
            }
        }

        if (linesToClear.length === 0) {
            this.combo = 0;
            return;
        }

        // Power-Up Collection
        this.powerUps.onRowsCleared(linesToClear);
        this.powerUps.trySpawnPowerUp(linesToClear);

        // Scoring
        let points = [0, 100, 300, 500, 800][linesToClear.length] * this.level;
        if (this.combo > 0) points += 50 * this.combo * this.level;
        
        // Back-to-Back
        if (linesToClear.length === 4) {
            if (this.backToBack) {
                points = Math.floor(points * 1.5);
                this.effects.showMessage('Back-to-Back!', 150, 100, { color: '#ffff00' });
            }
            this.backToBack = true;
            this.achievements.onLineClear(4);
            if(this.isPlayingStory) this.storyMode.onBackToBack();
        } else {
            this.backToBack = false;
        }

        // Multipliers
        points *= this.powerUps.getScoreMultiplier();
        this.addScore(points); // From GameEngine
        
        // Stats
        this.linesCleared += linesToClear.length;
        this.combo++;
        
        // Notify Systems
        this.effects.onLineClear(linesToClear, CELL_SIZE);
        this.effects.showCombo(this.combo, this.canvas.width/2, 150);
        this.effects.showScore(points, this.canvas.width/2, 100);

        this.achievements.onLineClear(linesToClear.length);
        this.achievements.onCombo(this.combo);
        
        const mode = this.getCurrentModeHandler();
        mode?.onLineClear(linesToClear.length);
        mode?.onCombo(this.combo);

        if (this.isPlayingStory) {
            this.storyMode.onLineClear(linesToClear.length);
            this.storyMode.onScore(points);
            this.storyMode.onCombo(this.combo);
        }

        // Remove lines
        for (const row of linesToClear) {
            this.grid.splice(row, 1);
            this.grid.unshift(Array(COLS).fill(null));
        }

        // Check Perfect Clear
        const isPerfect = this.grid.every(row => row.every(c => c === null));
        if (isPerfect) {
            this.addScore(3000 * this.level);
            this.effects.showPerfectClear(this.canvas.width, this.canvas.height);
            this.achievements.onPerfectClear();
            mode?.onPerfectClear();
            if (this.isPlayingStory) this.storyMode.onPerfectClear();
        }

        this.updateStatsDisplay();
    }

    getCurrentModeHandler() {
        return this.isPlayingStory ? this.storyMode : this.modeManager;
    }

    // Input Handling
    handleKeyDown(e) {
        if (this.state !== GameState.PLAYING) return;
        
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.moveHorizontal(-1);
                this.dasDirection = -1;
                this.dasTimer = 0;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveHorizontal(1);
                this.dasDirection = 1;
                this.dasTimer = 0;
                break;
            case 'ArrowUp':
            case 'KeyX':
                this.rotate(1);
                break;
            case 'KeyZ':
            case 'ControlLeft':
                this.rotate(-1);
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.softDropping = true;
                break;
            case 'Space':
                this.hardDrop();
                break;
            case 'KeyC':
            case 'ShiftLeft':
                this.hold();
                break;
        }
    }

    handleKeyUp(e) {
        switch (e.code) {
            case 'ArrowLeft': case 'KeyA':
                if (this.dasDirection === -1) this.dasDirection = 0;
                break;
            case 'ArrowRight': case 'KeyD':
                if (this.dasDirection === 1) this.dasDirection = 0;
                break;
            case 'ArrowDown': case 'KeyS':
                this.softDropping = false;
                break;
        }
    }

    // Actions
    moveHorizontal(dir) {
        if (!this.currentPiece) return;
        const newX = this.currentPiece.x + dir;
        if (this.isValidPosition(newX, this.currentPiece.y)) {
            this.currentPiece.x = newX;
            if (this.isLocking) this.lockTimer = 0;
        }
    }

    moveDown() {
        if (!this.currentPiece) return false;
        const newY = this.currentPiece.y + 1;
        if (this.isValidPosition(this.currentPiece.x, newY)) {
            this.currentPiece.y = newY;
            this.isLocking = false;
            this.lockTimer = 0;
            if (this.softDropping) this.addScore(1);
            return true;
        } else {
            if (!this.isLocking) {
                this.isLocking = true;
                this.lockTimer = 0;
            }
            return false;
        }
    }

    rotate(dir) {
        if (!this.currentPiece) return;
        
        const originalShape = this.currentPiece.shape;
        const originalRotation = this.currentPiece.rotation;
        
        // Rotate matrix
        this.currentPiece.shape = this.rotateMatrix(this.currentPiece.shape, dir);
        this.currentPiece.rotation = (this.currentPiece.rotation + (dir > 0 ? 1 : 3)) % 4;

        // Wall kicks
        const kicks = this.currentPiece.type === 'I' ? WALL_KICKS.I : WALL_KICKS.normal;
        const tests = kicks[dir > 0 ? originalRotation : this.currentPiece.rotation];

        for (const [dx, dy] of tests) {
            if (this.isValidPosition(this.currentPiece.x + dx, this.currentPiece.y - dy)) {
                this.currentPiece.x += dx;
                this.currentPiece.y -= dy;
                if (this.isLocking) this.lockTimer = 0;
                return;
            }
        }

        // Revert
        this.currentPiece.shape = originalShape;
        this.currentPiece.rotation = originalRotation;
    }

    rotateMatrix(matrix, dir) {
        const N = matrix.length;
        const rotated = Array(N).fill(null).map(() => Array(N).fill(0));
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
                if (dir > 0) rotated[x][N - 1 - y] = matrix[y][x];
                else rotated[N - 1 - x][y] = matrix[y][x];
            }
        }
        return rotated;
    }

    hold() {
        if (!this.currentPiece || !this.canHold || this.holdDisabled) return;
        
        if (this.holdPiece) {
            const temp = this.currentPiece.type;
            this.currentPiece = null; // Forces spawn of next or hold
            this.nextPieces.unshift(this.holdPiece);
            this.holdPiece = temp;
        } else {
            this.holdPiece = this.currentPiece.type;
            this.currentPiece = null;
        }
        
        this.canHold = false;
        this.spawnPiece();
        this.renderHoldPiece();
        if(this.isPlayingStory) this.storyMode.onHoldUse();
    }

    hardDrop() {
        if (!this.currentPiece) return;
        let dist = 0;
        while (this.isValidPosition(this.currentPiece.x, this.currentPiece.y + 1)) {
            this.currentPiece.y++;
            dist++;
        }
        this.addScore(dist * 2);
        this.lockPiece();
        this.effects.addScreenShake(dist > 10 ? 5 : 2, 0.1);
    }

    isValidPosition(x, y, shape = this.currentPiece?.shape) {
        if (!shape) return false;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const nx = x + col;
                    const ny = y + row;
                    if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
                    if (ny >= 0 && this.grid[ny][nx]) return false;
                }
            }
        }
        return true;
    }

    getGhostY() {
        if (!this.currentPiece) return 0;
        let ghostY = this.currentPiece.y;
        while (this.isValidPosition(this.currentPiece.x, ghostY + 1)) {
            ghostY++;
        }
        return ghostY;
    }

    // Drawing Helpers (Standard/Logic)
    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;
        
        // Vertical
        for (let x = 0; x <= COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * CELL_SIZE, 0);
            ctx.lineTo(x * CELL_SIZE, ROWS * CELL_SIZE);
            ctx.stroke();
        }
        
        // Horizontal
        for (let y = 0; y <= ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * CELL_SIZE);
            ctx.lineTo(COLS * CELL_SIZE, y * CELL_SIZE);
            ctx.stroke();
        }
    }

    drawLockedPieces() {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const cell = this.grid[y][x];
                if (cell) this.drawBlock(x, y, cell);
            }
        }
    }

    drawCurrentPiece() {
        if (!this.currentPiece) return;
        if (this.invisibleMode && this.isLocking) {
            // Hint for invisible mode? Maybe flicker
            if (Math.random() > 0.5) return; 
        }

        const { shape, color, x, y } = this.currentPiece;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.drawBlock(x + col, y + row, color);
                }
            }
        }
    }

    drawGhostPiece() {
        if (!this.currentPiece || this.invisibleMode) return;
        const ghostY = this.getGhostY();
        if (ghostY === this.currentPiece.y) return;

        const { shape, x } = this.currentPiece;
        this.ctx.globalAlpha = 0.2;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.drawBlock(x + col, ghostY + row, '#ffffff');
                }
            }
        }
        this.ctx.globalAlpha = 1;
    }

    // UI Updates
    updateStatsDisplay() {
        document.querySelector('.score-value').textContent = this.score.toLocaleString();
        document.querySelector('.level-value').textContent = this.level;
        document.querySelector('.lines-value').textContent = this.linesCleared;
        
        document.getElementById('stat-tetrises').textContent = this.achievements.stats.tetrisesInGame;
        document.getElementById('stat-combo').textContent = this.achievements.stats.maxCombo;
        
        // Update highscore
        const hs = Math.max(this.score, this.achievements.stats.highScore);
        document.querySelector('.highscore-value').textContent = hs.toLocaleString();
    }

    // Helper to allow rendering next/hold
    renderExternally(ctx, type, width, height) {
        ctx.clearRect(0, 0, width, height);
        // ... (Similar logic to old Tetris.js render methods but generalized)
        if (!type || !TETROMINOES[type]) return;
        
        const tetro = TETROMINOES[type];
        const shape = tetro.shape;
        const color = tetro.color;
        const bs = 16;
        const ox = (width - shape[0].length * bs) / 2;
        const oy = (height - shape.length * bs) / 2;

        for (let r=0; r<shape.length; r++) {
            for (let c=0; c<shape[r].length; c++) {
                if(shape[r][c]) {
                    // Retro Flat Style
                    ctx.fillStyle = color;
                    ctx.fillRect(ox + c*bs, oy + r*bs, bs, bs);
                    
                    // Inner Border
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                    ctx.strokeRect(ox + c*bs + 1, oy + r*bs + 1, bs-2, bs-2);
                }
            }
        }
    }

    renderHoldPiece() {
        if (!this.holdCtx) return;
        this.holdCtx.clearRect(0, 0, 80, 80); // Fix: Clear before drawing
        
        if (this.holdPiece) {
            this.renderExternally(this.holdCtx, this.holdPiece, 80, 80);
        }
    }

    renderNextPieces() {
        if (!this.nextCtx) return;
        this.nextCtx.clearRect(0, 0, 80, 240); // Fix: Clear before drawing
        
        for (let i = 0; i < Math.min(3, this.nextPieces.length); i++) {
            const type = this.nextPieces[i];
            const tetro = TETROMINOES[type];
            if (!tetro) continue;
            
            // Draw slightly smaller manually to stack them
            const shape = tetro.shape;
            const color = tetro.color;
            const bs = 16; // Slightly larger for better visibility
            const ox = (80 - shape[0].length * bs) / 2;
            const oy = 20 + i * 65; // Adjusted spacing

            for (let r=0; r<shape.length; r++) {
                for (let c=0; c<shape[r].length; c++) {
                    if (shape[r][c]) {
                        // Retro Flat Style
                        this.nextCtx.fillStyle = color;
                        this.nextCtx.fillRect(ox + c*bs, oy + r*bs, bs, bs);
                        
                        // Inner Border
                        this.nextCtx.lineWidth = 2;
                        this.nextCtx.strokeStyle = 'rgba(0,0,0,0.3)';
                        this.nextCtx.strokeRect(ox + c*bs + 1, oy + r*bs + 1, bs - 2, bs - 2);
                    }
                }
            }
        }
    }

    onGameOver(isWin, isNewHighScore) {
        // Submit score to Arcade Hub
        if (window.ArcadeHub && typeof this.score === 'number') {
            window.ArcadeHub.submitScore(this.score);
        }
        
        if (this.dailyChallengeActive) {
            dailyChallengeSystem.submitResult('tetris', this.score, this.dailyTarget);
            this.loadDailyStatus();
            
            if (this.score >= this.dailyTarget) {
                 this.effects.showMessage('DAILY CHALLENGE COMPLETE!', 
                    this.canvas.width/2, this.canvas.height/2, 
                    { color: '#00ff00', fontSize: 30, life: 4 });
            }
            this.dailyChallengeActive = false;
        }
    }
}

// Global initialization
const init = () => {
    console.log('Initializing Tetris...');
    try {
        window.game = new Tetris();
        window.game.showStartScreen();
        console.log('Tetris initialized successfully');
    } catch (e) {
        console.error('Failed to initialize Tetris:', e);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
