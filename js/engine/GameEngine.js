/**
 * GameEngine - Base class for all games
 * Provides game loop, state management, canvas setup, and lifecycle methods
 */
import { eventBus, GameEvents } from './EventBus.js';
import { inputManager } from './InputManager.js';
import { audioManager } from './AudioManager.js';
import { storageManager } from './StorageManager.js';

/**
 * Game state enumeration
 */
const GameState = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

/**
 * Base GameEngine class - extend this for each game
 */
class GameEngine {
    /**
     * Create a game engine
     * @param {Object} config - Configuration options
     * @param {string} config.canvasId - ID of canvas element
     * @param {string} config.gameId - Unique game identifier
     * @param {number} [config.width=800] - Canvas width
     * @param {number} [config.height=600] - Canvas height
     * @param {boolean} [config.pixelPerfect=false] - Disable image smoothing
     */
    constructor(config) {
        this.config = {
            width: 800,
            height: 600,
            pixelPerfect: false,
            targetFPS: 60,
            ...config
        };

        if (!config.canvasId) {
            throw new Error('GameEngine requires a canvasId');
        }
        if (!config.gameId) {
            throw new Error('GameEngine requires a gameId');
        }

        this.gameId = config.gameId;
        this.canvas = document.getElementById(config.canvasId);
        
        if (!this.canvas) {
            throw new Error(`Canvas element not found: ${config.canvasId}`);
        }

        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;

        // Initialize context based on type
        if (this.config.contextType === '2d') {
            this.ctx = this.canvas.getContext('2d');
            // Pixel perfect rendering
            if (this.config.pixelPerfect) {
                this.ctx.imageSmoothingEnabled = false;
            }
        } else if (this.config.contextType === 'webgl' || this.config.contextType === '3d') {
            // Let the renderer (Three.js) handle context creation
            this.ctx = null;
        } else {
             // Default to 2d for backward compatibility if not specified, 
             // but if explicitly 'none', do nothing.
             if (this.config.contextType !== 'none') {
                 this.ctx = this.canvas.getContext('2d');
                 if (this.config.pixelPerfect) this.ctx.imageSmoothingEnabled = false;
             }
        }

        // Game state
        this.state = GameState.MENU;
        this.score = 0;
        this.level = 1;
        this.highScore = storageManager.getHighScore(this.gameId);

        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        this.elapsedTime = 0;
        this.animationId = null;
        this.frameTime = 1000 / this.config.targetFPS;

        // Session tracking
        this.sessionStartTime = null;

        // Bind methods
        this._gameLoop = this._gameLoop.bind(this);
        this._onVisibilityChange = this._onVisibilityChange.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);

        // Initialize managers
        inputManager.init(this.canvas);

        // Setup event listeners
        document.addEventListener('visibilitychange', this._onVisibilityChange);
        document.addEventListener('keydown', this._onKeyDown);

        // Emit init event
        eventBus.emit(GameEvents.GAME_INIT, { gameId: this.gameId });
    }

    // ============ LIFECYCLE METHODS ============

    /**
     * Start the game
     */
    start() {
        if (this.state === GameState.PLAYING) return;

        this.state = GameState.PLAYING;
        this.lastTime = performance.now();
        this.sessionStartTime = Date.now();

        storageManager.incrementGamesPlayed();

        eventBus.emit(GameEvents.GAME_START, { gameId: this.gameId });
        this.onStart();

        this.animationId = requestAnimationFrame(this._gameLoop);
    }

    /**
     * Pause the game
     */
    pause() {
        if (this.state !== GameState.PLAYING) return;

        this.state = GameState.PAUSED;
        cancelAnimationFrame(this.animationId);
        this.animationId = null;

        audioManager.pauseMusic();
        eventBus.emit(GameEvents.GAME_PAUSE, { gameId: this.gameId });
        this.onPause();

        this._showOverlay('paused');
    }

    /**
     * Resume the game
     */
    resume() {
        if (this.state !== GameState.PAUSED) return;

        this.state = GameState.PLAYING;
        this.lastTime = performance.now();

        audioManager.resumeMusic();
        eventBus.emit(GameEvents.GAME_RESUME, { gameId: this.gameId });
        this.onResume();

        this._hideOverlay();
        this.animationId = requestAnimationFrame(this._gameLoop);
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        if (this.state === GameState.PLAYING) {
            this.pause();
        } else if (this.state === GameState.PAUSED) {
            this.resume();
        }
    }

    /**
     * End the game
     * @param {boolean} [isWin=false] - Whether the player won
     */
    gameOver(isWin = false) {
        if (this.state === GameState.GAME_OVER) return;

        this.state = GameState.GAME_OVER;
        cancelAnimationFrame(this.animationId);
        this.animationId = null;

        // Track play time
        if (this.sessionStartTime) {
            const playTime = Math.floor((Date.now() - this.sessionStartTime) / 1000);
            storageManager.addPlayTime(playTime);
        }

        // Check for new high score
        const isNewHighScore = storageManager.setHighScore(this.gameId, this.score);
        if (isNewHighScore) {
            this.highScore = this.score;
        }

        // Award XP based on score
        const xpGained = Math.floor(this.score / 10) + 5;
        storageManager.addXP(xpGained);

        eventBus.emit(GameEvents.GAME_OVER, {
            gameId: this.gameId,
            score: this.score,
            isWin,
            isNewHighScore
        });

        this.onGameOver(isWin, isNewHighScore);
        this._showOverlay('gameOver', { isWin, isNewHighScore });
    }

    /**
     * Reset and restart the game
     */
    reset() {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;

        this.state = GameState.MENU;
        this.score = 0;
        this.level = 1;
        this.elapsedTime = 0;
        this.highScore = storageManager.getHighScore(this.gameId);

        eventBus.emit(GameEvents.GAME_RESET, { gameId: this.gameId });
        this.onReset();

        this._hideOverlay();
    }

    /**
     * Clean up resources
     */
    destroy() {
        cancelAnimationFrame(this.animationId);
        document.removeEventListener('visibilitychange', this._onVisibilityChange);
        document.removeEventListener('keydown', this._onKeyDown);
        inputManager.destroy();
        audioManager.stopMusic();
    }

    // ============ SCORE & LEVEL ============

    /**
     * Add to score
     * @param {number} points - Points to add
     */
    addScore(points) {
        this.score += points;
        eventBus.emit(GameEvents.SCORE_UPDATE, { 
            score: this.score, 
            delta: points,
            gameId: this.gameId 
        });
        this.onScoreUpdate(this.score, points);
        this._updateScoreDisplay();
    }

    /**
     * Set score directly
     * @param {number} score - New score
     */
    setScore(score) {
        const delta = score - this.score;
        this.score = score;
        eventBus.emit(GameEvents.SCORE_UPDATE, { 
            score: this.score, 
            delta,
            gameId: this.gameId 
        });
        this._updateScoreDisplay();
    }

    /**
     * Advance to next level
     */
    nextLevel() {
        this.level++;
        eventBus.emit(GameEvents.LEVEL_UP, { 
            level: this.level,
            gameId: this.gameId 
        });
        this.onLevelUp(this.level);
    }

    // ============ OVERRIDE THESE IN SUBCLASS ============

    /** Called when game starts */
    onStart() {}

    /** Called when game pauses */
    onPause() {}

    /** Called when game resumes */
    onResume() {}

    /** Called when game ends */
    onGameOver(isWin, isNewHighScore) {}

    /** Called when game resets */
    onReset() {}

    /** Called when score updates */
    onScoreUpdate(score, delta) {}

    /** Called when level increases */
    onLevelUp(level) {}

    /**
     * Update game logic - MUST OVERRIDE
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        throw new Error('update() must be implemented by subclass');
    }

    /**
     * Render the game - MUST OVERRIDE
     */
    render() {
        throw new Error('render() must be implemented by subclass');
    }

    // ============ PRIVATE METHODS ============

    _gameLoop(timestamp) {
        if (this.state !== GameState.PLAYING) return;

        // Calculate delta time
        this.deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // Cap delta to prevent spiral of death
        this.deltaTime = Math.min(this.deltaTime, 0.1);
        this.elapsedTime += this.deltaTime;

        // Update game logic
        this.update(this.deltaTime);

        // Clear input state for next frame
        inputManager.update();

        // Render
        this.render();

        // Continue loop
        this.animationId = requestAnimationFrame(this._gameLoop);
    }

    _onVisibilityChange() {
        if (document.hidden && this.state === GameState.PLAYING) {
            this.pause();
        }
    }

    _onKeyDown(e) {
        // Pause on Escape
        if (e.code === 'Escape') {
            if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
                this.togglePause();
            }
        }

        // Restart on game over
        if (this.state === GameState.GAME_OVER) {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                this.reset();
                this.start();
            }
        }

        // Start game from menu
        if (this.state === GameState.MENU) {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                this.start();
            }
        }
    }

    _updateScoreDisplay() {
        const scoreEl = document.querySelector('.score-value');
        if (scoreEl) {
            scoreEl.textContent = this.score.toLocaleString();
        }

        const highScoreEl = document.querySelector('.highscore-value');
        if (highScoreEl) {
            highScoreEl.textContent = this.highScore.toLocaleString();
        }
    }

    _showOverlay(type, data = {}) {
        const overlay = document.querySelector('.game-overlay');
        if (!overlay) return;

        overlay.classList.remove('hidden');

        const title = overlay.querySelector('.overlay-title');
        const score = overlay.querySelector('.overlay-score');
        const message = overlay.querySelector('.overlay-message');

        if (type === 'paused') {
            title.textContent = 'PAUSED';
            title.className = 'overlay-title paused';
            if (score) score.style.display = 'none';
            if (message) message.textContent = 'Press ESC to resume';
        } else if (type === 'gameOver') {
            title.textContent = data.isWin ? 'YOU WIN!' : 'GAME OVER';
            title.className = 'overlay-title game-over';
            if (score) {
                score.style.display = 'block';
                score.textContent = `Score: ${this.score.toLocaleString()}`;
                if (data.isNewHighScore) {
                    score.innerHTML += '<br><span style="color: var(--color-accent)">NEW HIGH SCORE!</span>';
                }
            }
            if (message) message.textContent = 'Press SPACE to play again';
        }
    }

    _hideOverlay() {
        const overlay = document.querySelector('.game-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    // ============ UTILITY METHODS ============

    /**
     * Clear the canvas
     * @param {string} [color] - Optional fill color
     */
    clear(color) {
        if (color) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Draw text centered at position
     * @param {string} text 
     * @param {number} x 
     * @param {number} y 
     * @param {Object} options 
     */
    drawText(text, x, y, options = {}) {
        const {
            font = '16px Orbitron',
            color = '#fff',
            align = 'center',
            baseline = 'middle'
        } = options;

        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        this.ctx.fillText(text, x, y);
    }

    /**
     * Get canvas center point
     * @returns {{ x: number, y: number }}
     */
    getCenter() {
        return {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
        };
    }
}

export default GameEngine;
export { GameEngine, GameState };
