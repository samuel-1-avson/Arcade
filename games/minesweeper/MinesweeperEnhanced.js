/**
 * Minesweeper Enhanced - Main Game Module
 * Integrates all enhanced features: modes, achievements, story, power-ups, multiplayer
 */
import { storageManager } from '../../js/engine/StorageManager.js';
import { eventBus, GameEvents } from '../../js/engine/EventBus.js';
import { GameModeManager, GAME_MODES, PUZZLE_LEVELS } from './GameModes.js';
import { AchievementSystem, ACHIEVEMENTS } from './AchievementSystem.js';
import { StoryMode, STORY_WORLDS } from './StoryMode.js';
import { PowerUpSystem, POWER_UPS } from './PowerUpSystem.js';
import { MultiplayerSystem } from './MultiplayerSystem.js';
import { ICONS } from './Icons.js';
import { hubSDK } from '../../js/engine/HubSDK.js';

// Difficulty settings
const DIFFICULTIES = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 }
};

class MinesweeperEnhanced {
    constructor() {
        this.gameId = 'minesweeper';
        hubSDK.init({ gameId: 'minesweeper' });
        this.board = document.getElementById('game-board');
        this.overlay = document.getElementById('game-overlay');
        
        // Game state
        this.grid = [];
        this.difficulty = 'easy';
        this.rows = 9;
        this.cols = 9;
        this.mineCount = 10;
        this.flagCount = 0;
        this.revealed = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.chainRevealCount = 0;
        
        // Timer
        this.startTime = 0;
        this.timerInterval = null;
        
        // High scores per difficulty
        this.highScores = {
            easy: storageManager.getHighScore(`${this.gameId}-easy`) || null,
            medium: storageManager.getHighScore(`${this.gameId}-medium`) || null,
            hard: storageManager.getHighScore(`${this.gameId}-hard`) || null
        };
        
        // Initialize sub-systems
        this.modeManager = new GameModeManager(this);
        this.achievements = new AchievementSystem(this);
        this.storyMode = new StoryMode(this);
        this.powerUps = new PowerUpSystem(this);
        this.multiplayer = new MultiplayerSystem(this);
        
        // Event bus reference
        this.eventBus = eventBus;
        
        // Setup UI and start game
        this.setupUI();
        this.setupEventListeners();
        this.setupMultiplayerHandlers();
        this.updateSidebarUI();
        this.newGame();
    }
    
    setupUI() {
        // Inject Static Icons
        this.injectStaticIcons();
        
        // Difficulty selector
        const diffSelect = document.getElementById('difficulty-select');
        if (diffSelect) {
            diffSelect.addEventListener('change', (e) => {
                this.difficulty = e.target.value;
                this.newGame();
            });
        }
        
        // Restart button
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.innerHTML = ICONS.REFRESH;
        restartBtn?.addEventListener('click', () => {
            this.newGame();
        });

        // Achievements button icon
        const achievementsBtn = document.getElementById('achievements-btn');
        if (achievementsBtn) achievementsBtn.innerHTML = ICONS.TROPHY;
        achievementsBtn?.addEventListener('click', () => {
            this.achievements.openGallery();
        });

        // SPA Back Button
        document.getElementById('mines-back-btn')?.addEventListener('click', () => {
            if (window.GameBridge) {
                window.GameBridge.exitGame();
            } else {
                window.location.href = '../../index.html';
            }
        });
        
        // Start button in overlay
        document.getElementById('start-btn')?.addEventListener('click', () => {
            this.newGame();
        });
        
        // View achievements button
        document.getElementById('view-achievements-btn')?.addEventListener('click', () => {
            this.achievements.openGallery();
        });
        
        // Prevent context menu on board
        this.board.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Mode selector buttons
        const modeSelector = document.getElementById('mode-selector');
        if (modeSelector) {
            modeSelector.querySelectorAll('.mode-btn').forEach(btn => {
                const mode = btn.dataset.mode;
                // Inject Icon
                const iconContainer = btn.querySelector('.mode-btn-icon');
                if (iconContainer) {
                    const iconKey = `MODE_${mode.toUpperCase()}`;
                    if (ICONS[iconKey]) iconContainer.innerHTML = ICONS[iconKey];
                }
                
                btn.addEventListener('click', () => {
                    this.setGameMode(mode);
                    
                    // Update active state
                    modeSelector.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });
        }
        
        // Custom settings apply button
        document.getElementById('apply-custom-btn')?.addEventListener('click', () => {
            const rows = parseInt(document.getElementById('custom-rows').value) || 10;
            const cols = parseInt(document.getElementById('custom-cols').value) || 10;
            const mines = parseInt(document.getElementById('custom-mines').value) || 15;
            this.modeManager.setCustomSettings(rows, cols, mines);
            this.newGame();
        });
    }

    injectStaticIcons() {
        // Section headers
        document.querySelector('.section-icon-mode') && (document.querySelector('.section-icon-mode').innerHTML = ICONS.MODE_CLASSIC); // Using classic as generic controller icon
        document.querySelector('.section-icon-world') && (document.querySelector('.section-icon-world').innerHTML = ICONS.MODE_CAMPAIGN);
        document.querySelector('.section-icon-settings') && (document.querySelector('.section-icon-settings').innerHTML = ICONS.SETTINGS);
        document.querySelector('.section-icon-powerup') && (document.querySelector('.section-icon-powerup').innerHTML = ICONS.POWER_SHIELD); // Using shield as generic powerup
        document.querySelector('.section-icon-trophy') && (document.querySelector('.section-icon-trophy').innerHTML = ICONS.TROPHY);
        document.querySelector('.section-icon-stats') && (document.querySelector('.section-icon-stats').innerHTML = ICONS.STATS);
        document.querySelector('.section-icon-users') && (document.querySelector('.section-icon-users').innerHTML = ICONS.USERS);

        // Daily Challenge
        const dailyIcon = document.querySelector('.daily-challenge-icon');
        if (dailyIcon) dailyIcon.innerHTML = ICONS.CALENDAR;
    }

    setupEventListeners() {
        // Story mode events
        this.eventBus.on('storyLevelStart', (settings) => {
            this.startStoryLevel(settings);
        });
        
        // Boss mechanics events
        this.eventBus.on('bossMoveMines', () => this.handleBossMoveMines());
        this.eventBus.on('bossSpawnTentacle', () => this.handleBossTentacle());
        this.eventBus.on('bossSpreadLava', () => this.handleBossLava());
        this.eventBus.on('bossRealityWarp', () => this.handleBossWarp());
    }

    setupMultiplayerHandlers() {
        // Co-op mode button opens multiplayer modal
        const coopBtn = document.getElementById('coop-mode-btn');
        if (coopBtn) {
            coopBtn.addEventListener('click', () => {
                this.multiplayer.openModal();
            });
        }
        
        // Start game button (host only)
        document.getElementById('mp-start-btn')?.addEventListener('click', () => {
            this.multiplayer.startGame();
        });
        
        // Leave room button
        document.getElementById('mp-leave-btn')?.addEventListener('click', () => {
            this.multiplayer.leaveRoom();
        });
        
        // Chat send
        document.getElementById('chat-send-btn')?.addEventListener('click', () => {
            const input = document.getElementById('chat-input');
            if (input?.value) {
                this.multiplayer.sendChat(input.value);
                input.value = '';
            }
        });
        
        // Chat enter key
        document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const input = e.target;
                if (input.value) {
                    this.multiplayer.sendChat(input.value);
                    input.value = '';
                }
            }
        });
    }

    setGameMode(modeId) {
        this.modeManager.setMode(modeId);
        
        // Show/hide sections based on mode
        const worldSection = document.getElementById('world-selector-section');
        const customSection = document.getElementById('custom-settings-section');
        const diffSelect = document.getElementById('difficulty-select');
        
        if (worldSection) worldSection.style.display = modeId === 'campaign' ? 'block' : 'none';
        if (customSection) customSection.style.display = modeId === 'custom' ? 'block' : 'none';
        if (diffSelect) diffSelect.style.display = (modeId === 'puzzle' || modeId === 'campaign') ? 'none' : 'block';
        
        // Populate world selector if campaign
        if (modeId === 'campaign') {
            this.populateWorldSelector();
        }
        
        // Start new game with new mode
        this.newGame();
    }

    populateWorldSelector() {
        const container = document.getElementById('world-selector');
        if (!container) return;
        
        const worldData = this.storyMode.getWorldSelectionData();
        container.innerHTML = worldData.map(world => `
            <button class="world-btn ${world.unlocked ? '' : 'locked'} ${world.completed ? 'completed' : ''}"
                    data-world="${world.id}" ${world.unlocked ? '' : 'disabled'}>
                <span class="world-icon">${this.getWorldIcon(world.id)}</span>
                <div class="world-info">
                    <div class="world-name">${world.name}</div>
                    <div class="world-progress">${world.completed ? 'Completed' : `${world.levels} Levels`}</div>
                </div>
                <div class="world-stars">⭐ ${world.starsEarned}/${world.maxStars}</div>
            </button>
        `).join('');
        
        // Add click handlers
        container.querySelectorAll('.world-btn:not(.locked)').forEach(btn => {
            btn.addEventListener('click', () => {
                this.storyMode.startWorld(btn.dataset.world);
            });
        });
    }

    getWorldIcon(worldId) {
        const icons = {
            grassland: ICONS.WORLD_GRASS,
            desert: ICONS.WORLD_DESERT,
            ocean: ICONS.WORLD_OCEAN,
            volcano: ICONS.WORLD_VOLCANO,
            space: ICONS.WORLD_SPACE
        };
        return icons[worldId] || ICONS.MODE_CAMPAIGN;
    }
    
    newGame() {
        // Get settings based on current mode
        const mode = this.modeManager.getCurrentMode();
        let settings;
        
        if (mode.id === 'puzzle') {
            const puzzle = this.modeManager.getCurrentPuzzle();
            settings = { rows: puzzle.rows, cols: puzzle.cols, mines: puzzle.mines.length };
            this.predefinedMines = puzzle.mines;
        } else if (mode.id === 'custom') {
            settings = this.modeManager.customSettings;
            this.predefinedMines = null;
        } else {
            settings = DIFFICULTIES[this.difficulty];
            this.predefinedMines = null;
        }
        
        // Reset state
        this.rows = settings.rows;
        this.cols = settings.cols;
        this.mineCount = settings.mines;
        this.flagCount = 0;
        this.revealed = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.chainRevealCount = 0;
        
        // Stop timer
        this.stopTimer();
        this.updateTimer(0);
        
        // Hide overlay
        this.overlay.classList.add('hidden');
        
        // Initialize grid
        this.initializeGrid();
        this.renderBoard();
        this.updateMinesDisplay();
        this.updateHighScoreDisplay();
        
        // Initialize power-ups for this game
        this.powerUps.initForGame();
        this.powerUps.updateUI();
        
        // Mode-specific setup
        if (mode.id === 'timeAttack') {
            this.modeManager.startTimeAttack(this.difficulty);
        }
        
        // Track games played
        storageManager.incrementGamesPlayed();
        this.achievements.updateStat('totalGames', 1);
    }
    
    startStoryLevel(settings) {
        this.rows = settings.rows;
        this.cols = settings.cols;
        this.mineCount = settings.mines;
        this.predefinedMines = null;
        
        this.flagCount = 0;
        this.revealed = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        
        this.stopTimer();
        this.updateTimer(0);
        this.overlay.classList.add('hidden');
        
        this.initializeGrid();
        this.renderBoard();
        this.updateMinesDisplay();
        
        this.powerUps.initForGame();
        this.powerUps.updateUI();
    }
    
    initializeGrid() {
        this.grid = [];
        
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = {
                    mine: false,
                    revealed: false,
                    flagged: false,
                    question: false,
                    adjacentMines: 0,
                    blocked: false // For boss mechanics
                };
            }
        }
    }
    
    placeMines(excludeRow, excludeCol) {
        // Check for predefined mines (puzzle mode)
        if (this.predefinedMines) {
            for (const mine of this.predefinedMines) {
                this.grid[mine.row][mine.col].mine = true;
            }
        } else {
            // Random placement
            let placed = 0;
            let attempts = 0;
            
            while (placed < this.mineCount && attempts < 10000) {
                const row = Math.floor(Math.random() * this.rows);
                const col = Math.floor(Math.random() * this.cols);
                
                // Don't place mine on first click or adjacent cells
                const isExcluded = Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1;
                
                if (!this.grid[row][col].mine && !isExcluded) {
                    this.grid[row][col].mine = true;
                    placed++;
                }
                attempts++;
            }
        }
        
        // Calculate adjacent mine counts
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.grid[row][col].mine) {
                    this.grid[row][col].adjacentMines = this.countAdjacentMines(row, col);
                }
            }
        }
    }
    
    countAdjacentMines(row, col) {
        let count = 0;
        
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                
                const r = row + dr;
                const c = col + dc;
                
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    if (this.grid[r][c].mine) count++;
                }
            }
        }
        
        return count;
    }
    
    renderBoard() {
        this.board.innerHTML = '';
        this.board.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell covered';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Left click - reveal
                cell.addEventListener('click', () => this.handleLeftClick(row, col));
                
                // Right click - flag
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(row, col);
                });
                
                // Middle click - chord
                cell.addEventListener('mousedown', (e) => {
                    if (e.button === 1) {
                        e.preventDefault();
                        this.handleChord(row, col);
                    }
                });
                
                // Touch support - long press for flag with visual feedback
                let touchTimer;
                cell.addEventListener('touchstart', (e) => {
                    cell.classList.add('touch-active');
                    touchTimer = setTimeout(() => {
                        e.preventDefault();
                        cell.classList.remove('touch-active');
                        this.handleRightClick(row, col);
                    }, 300);
                });
                cell.addEventListener('touchend', () => {
                    clearTimeout(touchTimer);
                    cell.classList.remove('touch-active');
                });
                cell.addEventListener('touchmove', () => {
                    clearTimeout(touchTimer);
                    cell.classList.remove('touch-active');
                });
                cell.addEventListener('touchcancel', () => {
                    clearTimeout(touchTimer);
                    cell.classList.remove('touch-active');
                });
                
                this.board.appendChild(cell);
            }
        }
    }
    
    handleLeftClick(row, col) {
        if (this.gameOver) return;
        
        const cell = this.grid[row][col];
        if (cell.revealed || cell.flagged || cell.blocked) return;
        
        // First click - place mines and start timer
        if (this.firstClick) {
            this.placeMines(row, col);
            this.startTimer();
            this.firstClick = false;
            
            // Check for corner start achievement
            const isCorner = (row === 0 || row === this.rows - 1) && 
                           (col === 0 || col === this.cols - 1);
            if (isCorner) {
                this.achievements.updateStat('cornerStarts', 1);
            }
        }
        
        // Reset chain count for new click chain
        this.chainRevealCount = 0;
        
        this.revealCell(row, col);
        
        // Broadcast to multiplayer team
        if (this.multiplayer.connected) {
            this.multiplayer.broadcastReveal(row, col);
        }
        
        // Check chain reveal achievement after flood fill completes
        this.achievements.checkChainReveal(this.chainRevealCount);
    }
    
    handleRightClick(row, col) {
        if (this.gameOver) return;
        
        const cell = this.grid[row][col];
        if (cell.revealed || cell.blocked) return;
        
        // Cycle: covered -> flagged -> question -> covered
        if (!cell.flagged && !cell.question) {
            cell.flagged = true;
            this.flagCount++;
            this.achievements.updateStat('flagsPlaced', 1);
            
            // Broadcast flag to multiplayer team
            if (this.multiplayer.connected) {
                this.multiplayer.broadcastFlag(row, col, true);
            }
        } else if (cell.flagged) {
            cell.flagged = false;
            cell.question = true;
            this.flagCount--;
            
            // Broadcast unflag to multiplayer team
            if (this.multiplayer.connected) {
                this.multiplayer.broadcastFlag(row, col, false);
            }
        } else {
            cell.question = false;
        }
        
        this.updateCellDisplay(row, col);
        this.updateMinesDisplay();
    }
    
    handleChord(row, col) {
        if (this.gameOver) return;
        
        const cell = this.grid[row][col];
        if (!cell.revealed || cell.adjacentMines === 0) return;
        
        // Count adjacent flags
        let flagCount = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    if (this.grid[r][c].flagged) flagCount++;
                }
            }
        }
        
        // If flags match adjacent mines, reveal all unflagged neighbors
        if (flagCount === cell.adjacentMines) {
            this.chainRevealCount = 0;
            
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const r = row + dr;
                    const c = col + dc;
                    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                        const neighbor = this.grid[r][c];
                        if (!neighbor.revealed && !neighbor.flagged) {
                            this.revealCell(r, c);
                        }
                    }
                }
            }
            
            this.achievements.updateStat('totalChords', 1);
        }
    }
    
    revealCell(row, col) {
        const cell = this.grid[row][col];
        if (cell.revealed || cell.flagged || cell.blocked) return;
        
        cell.revealed = true;
        this.revealed++;
        this.chainRevealCount++;
        
        if (cell.mine) {
            // Check for shield power-up
            if (this.powerUps.consumeShield()) {
                // Shield protected us - mark as safe
                cell.mine = false;
                cell.adjacentMines = this.countAdjacentMines(row, col);
                this.mineCount--;
                this.updateMinesDisplay();
            } else if (!this.modeManager.shouldProtectFromMine()) {
                // Game over
                this.lose(row, col);
                return;
            } else {
                // Zen mode - just mark it as revealed but don't end game
                cell.mine = false;
            }
        }
        
        this.updateCellDisplay(row, col);
        
        // Flood fill for empty cells
        if (cell.adjacentMines === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const r = row + dr;
                    const c = col + dc;
                    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                        this.revealCell(r, c);
                    }
                }
            }
        }
        
        // Update stats
        this.achievements.updateStat('cellsRevealed', 1);
        
        // Check win
        this.checkWin();
    }
    
    updateCellDisplay(row, col) {
        const cell = this.grid[row][col];
        const element = this.board.children[row * this.cols + col];
        
        element.className = 'cell';
        element.innerHTML = ''; // Clear content
        
        if (cell.blocked) {
            element.classList.add('covered', 'blocked');
            return;
        }
        
        if (cell.revealed) {
            element.classList.add('revealed');
            if (cell.mine) {
                element.classList.add('mine');
                element.innerHTML = ICONS.BOMB;
            } else if (cell.adjacentMines > 0) {
                element.textContent = cell.adjacentMines;
                element.classList.add(`n${cell.adjacentMines}`);
            }
        } else if (cell.flagged) {
            element.classList.add('covered', 'flagged');
            element.innerHTML = ICONS.FLAG;
        } else if (cell.question) {
            element.classList.add('covered', 'question');
            element.innerHTML = ICONS.QUESTION;
        } else {
            element.classList.add('covered');
        }
    }
    
    checkWin() {
        const totalSafeCells = this.rows * this.cols - this.mineCount;
        
        if (this.revealed === totalSafeCells) {
            this.win();
        }
    }
    
    win() {
        this.gameOver = true;
        this.gameWon = true;
        this.stopTimer();
        
        const time = this.getElapsedTime();
        const mode = this.modeManager.getCurrentMode();
        
        // Check for high score (faster is better) - classic mode only
        if (mode.id === 'classic') {
            const bestKey = `${this.gameId}-${this.difficulty}`;
            const currentBest = this.highScores[this.difficulty];
            
            if (!currentBest || time < currentBest) {
                this.highScores[this.difficulty] = time;
                storageManager.setHighScore(bestKey, time);
            }
        }
        
        // Calculate score based on time and difficulty
        const score = Math.floor(10000 / Math.max(time, 1) * this.mineCount);
        storageManager.addXP(Math.floor(score / 10));
        
        // Update achievements
        this.achievements.updateStat('totalWins', 1);
        this.achievements.updateStat('currentStreak', 1);
        
        // Difficulty-specific achievement
        if (this.difficulty === 'easy') this.achievements.updateStat('easyWins', 1);
        if (this.difficulty === 'medium') this.achievements.updateStat('mediumWins', 1);
        if (this.difficulty === 'hard') this.achievements.updateStat('hardWins', 1);
        
        // Speed achievements
        this.achievements.checkSpeedAchievements(this.difficulty, time);
        
        // Time-based achievements
        this.achievements.checkTimeBasedAchievements();
        
        // No flags achievement
        this.achievements.checkNoFlagsWin(this.flagCount);
        
        // Close call achievement
        const totalCells = this.rows * this.cols;
        this.achievements.checkCloseCall(totalCells, this.mineCount, this.revealed);
        
        // Time Attack score
        if (mode.id === 'timeAttack') {
            const result = this.modeManager.endTimeAttack(true);
            if (result.score > this.achievements.stats.timeAttackBestScore) {
                this.achievements.updateStat('timeAttackBestScore', result.score, false);
            }
        }
        
        // Story mode completion
        if (mode.id === 'campaign') {
            const stars = this.calculateStars(time);
            this.storyMode.completeLevel(time, stars);
        }
        
        // Flag all remaining mines
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.grid[row][col];
                if (cell.mine && !cell.flagged) {
                    cell.flagged = true;
                    this.updateCellDisplay(row, col);
                }
            }
        }
        
        // Show win animation
        const cells = this.board.querySelectorAll('.cell');
        cells.forEach(c => c.classList.add('win'));
        
        // Submit score to Hub
        this.submitScoreToHub();
        
        // Show overlay
        this.showOverlay(true, time);
        
        // Update UI
        this.updateSidebarUI();
    }
    
    submitScoreToHub() {
        if (typeof hubSDK !== 'undefined') {
            // Calculate score based on time and difficulty
            const baseScore = Math.floor(10000 / Math.max(this.timer, 1) * this.mineCount);
            hubSDK.submitScore(baseScore);
            
            // Also sync achievements
            this.achievements.unlockedAchievements.forEach(id => {
                hubSDK.unlockAchievement(id);
            });
        }
    }
    
    calculateStars(time) {
        if (this.difficulty === 'easy') {
            if (time < 30) return 3;
            if (time < 60) return 2;
            return 1;
        } else if (this.difficulty === 'medium') {
            if (time < 120) return 3;
            if (time < 240) return 2;
            return 1;
        } else {
            if (time < 300) return 3;
            if (time < 600) return 2;
            return 1;
        }
    }
    
    lose(clickedRow, clickedCol) {
        this.gameOver = true;
        this.stopTimer();
        
        // Reset win streak
        this.achievements.stats.currentStreak = 0;
        this.achievements.saveStats();
        
        // Mark clicked mine as exploded
        const clickedElement = this.board.children[clickedRow * this.cols + clickedCol];
        clickedElement.classList.add('exploded');
        
        // Reveal all mines and wrong flags
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.grid[row][col];
                const element = this.board.children[row * this.cols + col];
                
                if (cell.mine && !cell.flagged) {
                    cell.revealed = true;
                    this.updateCellDisplay(row, col);
                } else if (!cell.mine && cell.flagged) {
                    element.classList.remove('flagged');
                    element.classList.add('wrong');
                }
            }
        }
        
        // End Time Attack if active
        const mode = this.modeManager.getCurrentMode();
        if (mode.id === 'timeAttack') {
            this.modeManager.endTimeAttack(false);
        }
        
        this.showOverlay(false, this.getElapsedTime());
    }
    
    showOverlay(isWin, time) {
        const title = this.overlay.querySelector('.overlay-title');
        const score = this.overlay.querySelector('.overlay-score');
        const message = this.overlay.querySelector('.overlay-message');
        
        if (isWin) {
            title.textContent = 'YOU WIN!';
            title.style.color = 'var(--color-success)';
            score.style.display = 'block';
            score.innerHTML = `Time: ${time}s`;
            
            const best = this.highScores[this.difficulty];
            if (time === best) {
                score.innerHTML += '<br><span style="color: var(--color-accent)">NEW RECORD!</span>';
            }
            
            message.textContent = 'Click to play again';
        } else {
            title.textContent = 'GAME OVER';
            title.style.color = 'var(--color-danger)';
            score.style.display = 'none';
            message.textContent = 'You hit a mine! Click to try again';
        }
        
        this.overlay.classList.remove('hidden');
    }
    
    // Timer functions
    startTimer() {
        if (this.powerUps.timeFrozen) return;
        
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            if (!this.powerUps.timeFrozen) {
                this.updateTimer(this.getElapsedTime());
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    getElapsedTime() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
    
    updateTimer(seconds) {
        const el = document.querySelector('.timer-value');
        if (el) {
            el.textContent = String(Math.min(seconds, 999)).padStart(3, '0');
        }
    }
    
    // Display updates
    updateMinesDisplay() {
        const el = document.querySelector('.mines-value');
        if (el) {
            el.textContent = Math.max(0, this.mineCount - this.flagCount);
        }
    }
    
    updateHighScoreDisplay() {
        const el = document.querySelector('.highscore-value');
        if (el) {
            const best = this.highScores[this.difficulty];
            el.textContent = best ? `${best}s` : '---';
        }
    }
    
    updateSidebarUI() {
        // Update level display
        const levelBadge = document.getElementById('level-badge');
        const levelNumber = document.getElementById('level-number');
        const xpFill = document.getElementById('xp-fill');
        
        if (levelBadge) levelBadge.textContent = this.achievements.level;
        if (levelNumber) levelNumber.textContent = this.achievements.level;
        if (xpFill) {
            const progress = this.achievements.getLevelProgress();
            xpFill.style.width = `${progress.percent}%`;
        }
        
        // Update stats
        const stats = this.achievements.stats;
        document.getElementById('stat-wins')?.textContent && (document.getElementById('stat-wins').textContent = stats.totalWins);
        document.getElementById('stat-games')?.textContent && (document.getElementById('stat-games').textContent = stats.totalGames);
        document.getElementById('stat-streak')?.textContent && (document.getElementById('stat-streak').textContent = stats.currentStreak);
        
        const bestTime = this.highScores[this.difficulty];
        const statBest = document.getElementById('stat-best');
        if (statBest) statBest.textContent = bestTime ? `${bestTime}s` : '---';
        
        // Update achievement preview
        this.updateAchievementPreview();
        
        // Update daily challenge
        this.updateDailyChallenge();
    }
    
    updateAchievementPreview() {
        const container = document.getElementById('achievement-preview');
        if (!container) return;
        
        container.innerHTML = '';
        container.className = 'sidebar-achievement-list';
        
        // Get recent unlocks or specific achievements to show
        const allAchievements = Object.values(ACHIEVEMENTS);
        const unlocked = allAchievements.filter(a => this.achievements.isUnlocked(a.id));
        
        // Show last 3 unlocked, or 3 easiest locked if none unlocked
        let showList = [];
        if (unlocked.length > 0) {
            showList = unlocked.slice(-3).reverse();
        } else {
            showList = allAchievements.slice(0, 3);
        }
        
        // Fill up to 3 if needed
        if (showList.length < 3) {
            const potential = allAchievements.filter(a => !showList.includes(a));
            showList = [...showList, ...potential.slice(0, 3 - showList.length)];
        }
        
        showList.forEach(ach => {
            const isUnlocked = this.achievements.isUnlocked(ach.id);
            const item = document.createElement('div');
            item.className = `sidebar-achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
            
            // Get correct icon (SVG vs Emoji fallback handled here)
            let iconHtml = ICONS.LOCK;
            if (isUnlocked) {
                 iconHtml = ach.icon.startsWith('<svg') ? ach.icon : ICONS.TROPHY;
            }
            
            item.innerHTML = `
                <div class="sidebar-achievement-icon">${iconHtml}</div>
                <div class="sidebar-achievement-info">
                    <div class="sidebar-achievement-name">${ach.name}</div>
                    <div class="sidebar-achievement-desc">${isUnlocked ? 'Unlocked!' : 'Locked'}</div>
                </div>
            `;
            container.appendChild(item);
        });
    }
    
    updateDailyChallenge() {
        const daily = this.modeManager.getDailyChallenge();
        
        const descEl = document.getElementById('daily-desc');
        const rewardEl = document.getElementById('daily-reward');
        const timerEl = document.getElementById('daily-timer');
        
        if (descEl) descEl.textContent = daily.desc;
        if (rewardEl) rewardEl.textContent = `Reward: ${daily.reward} XP`;
        
        // Calculate time until reset
        if (timerEl) {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const hoursLeft = Math.ceil((tomorrow - now) / (1000 * 60 * 60));
            timerEl.textContent = `Resets in ${hoursLeft}h`;
        }
    }
    
    // Boss mechanics handlers
    handleBossMoveMines() {
        if (this.gameOver) return;
        
        // Find unrevealed mines and move some
        const mines = [];
        const empty = [];
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.grid[row][col];
                if (cell.mine && !cell.revealed && !cell.flagged) {
                    mines.push({ row, col });
                } else if (!cell.mine && !cell.revealed) {
                    empty.push({ row, col });
                }
            }
        }
        
        // Move up to 2 mines
        const toMove = Math.min(2, mines.length, empty.length);
        for (let i = 0; i < toMove; i++) {
            const mineIdx = Math.floor(Math.random() * mines.length);
            const emptyIdx = Math.floor(Math.random() * empty.length);
            
            const mine = mines[mineIdx];
            const target = empty[emptyIdx];
            
            this.grid[mine.row][mine.col].mine = false;
            this.grid[target.row][target.col].mine = true;
            
            mines.splice(mineIdx, 1);
            empty.splice(emptyIdx, 1);
        }
        
        // Recalculate adjacent counts
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.grid[row][col].mine) {
                    this.grid[row][col].adjacentMines = this.countAdjacentMines(row, col);
                    if (this.grid[row][col].revealed) {
                        this.updateCellDisplay(row, col);
                    }
                }
            }
        }
    }
    
    handleBossTentacle() {
        if (this.gameOver) return;
        
        // Block 2 random unrevealed cells
        const unrevealed = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.grid[row][col].revealed && !this.grid[row][col].blocked) {
                    unrevealed.push({ row, col });
                }
            }
        }
        
        const toBlock = Math.min(2, unrevealed.length);
        for (let i = 0; i < toBlock; i++) {
            const idx = Math.floor(Math.random() * unrevealed.length);
            const cell = unrevealed[idx];
            this.grid[cell.row][cell.col].blocked = true;
            this.updateCellDisplay(cell.row, cell.col);
            unrevealed.splice(idx, 1);
        }
        
        // Unblock after 5 seconds
        setTimeout(() => {
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    if (this.grid[row][col].blocked) {
                        this.grid[row][col].blocked = false;
                        this.updateCellDisplay(row, col);
                    }
                }
            }
        }, 5000);
    }
    
    handleBossLava() {
        // Lava spreads - future implementation
    }
    
    handleBossWarp() {
        if (this.gameOver) return;
        
        // Randomly hide some revealed cells
        const revealed = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.grid[row][col];
                if (cell.revealed && !cell.mine && cell.adjacentMines > 0) {
                    revealed.push({ row, col });
                }
            }
        }
        
        const toHide = Math.min(3, revealed.length);
        for (let i = 0; i < toHide; i++) {
            const idx = Math.floor(Math.random() * revealed.length);
            const cellPos = revealed[idx];
            this.grid[cellPos.row][cellPos.col].revealed = false;
            this.revealed--;
            this.updateCellDisplay(cellPos.row, cellPos.col);
            revealed.splice(idx, 1);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.game = new MinesweeperEnhanced();
});
