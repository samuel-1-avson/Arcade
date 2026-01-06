/**
 * Tetris Game Modes System
 * Provides multiple game modes: Marathon, Sprint, Ultra, Zen, Time Attack, Survival
 */

// Game Mode Types
export const GameModeType = {
    MARATHON: 'marathon',
    SPRINT: 'sprint',
    ULTRA: 'ultra',
    ZEN: 'zen',
    TIME_ATTACK: 'time_attack',
    SURVIVAL: 'survival'
};

// Mode Configuration
export const MODE_CONFIG = {
    [GameModeType.MARATHON]: {
        name: 'Marathon',
        icon: '🏃',
        description: 'Classic endless mode with level progression',
        unlocked: true,
        color: '#00ffff'
    },
    [GameModeType.SPRINT]: {
        name: 'Sprint',
        icon: '⚡',
        description: 'Clear 40 lines as fast as possible',
        unlocked: true,
        color: '#ffff00'
    },
    [GameModeType.ULTRA]: {
        name: 'Ultra',
        icon: '⏱️',
        description: 'Score as high as possible in 2 minutes',
        unlocked: true,
        color: '#ff00ff'
    },
    [GameModeType.ZEN]: {
        name: 'Zen',
        icon: '🧘',
        description: 'Relaxed mode - no pressure, no game over',
        unlocked: true,
        color: '#00ff88'
    },
    [GameModeType.TIME_ATTACK]: {
        name: 'Time Attack',
        icon: '🔥',
        description: 'Survive as speed increases every 30 seconds',
        unlocked: false,
        unlockCondition: 'Reach level 10 in Marathon',
        color: '#ff8800'
    },
    [GameModeType.SURVIVAL]: {
        name: 'Survival',
        icon: '💀',
        description: 'Garbage rows rise from below - survive!',
        unlocked: false,
        unlockCondition: 'Complete Sprint mode',
        color: '#ff0044'
    }
};

/**
 * Base Game Mode Class
 */
export class GameMode {
    constructor(game) {
        this.game = game;
        this.type = GameModeType.MARATHON;
        this.isActive = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.stats = {};
    }

    initialize() {
        this.isActive = true;
        this.startTime = performance.now();
        this.elapsedTime = 0;
        this.stats = {
            linesCleared: 0,
            tetrises: 0,
            tSpins: 0,
            maxCombo: 0,
            perfectClears: 0,
            piecesPlaced: 0
        };
    }

    update(dt) {
        if (!this.isActive) return;
        this.elapsedTime = performance.now() - this.startTime;
    }

    onLineClear(lines) {
        this.stats.linesCleared += lines;
        if (lines === 4) this.stats.tetrises++;
    }

    onPiecePlaced() {
        this.stats.piecesPlaced++;
    }

    onCombo(combo) {
        this.stats.maxCombo = Math.max(this.stats.maxCombo, combo);
    }

    onPerfectClear() {
        this.stats.perfectClears++;
    }

    checkWinCondition() {
        return false;
    }

    checkLoseCondition() {
        return false;
    }

    getStats() {
        return { ...this.stats, elapsedTime: this.elapsedTime };
    }

    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }

    renderOverlay(ctx, width, height) {
        // Override in subclasses
    }

    end() {
        this.isActive = false;
    }
}

/**
 * Marathon Mode - Classic endless Tetris with level progression
 */
export class MarathonMode extends GameMode {
    constructor(game) {
        super(game);
        this.type = GameModeType.MARATHON;
        this.targetLines = Infinity;
    }

    initialize() {
        super.initialize();
        this.game.level = 1;
        this.game.dropInterval = this.game.baseDropInterval;
    }

    onLineClear(lines) {
        super.onLineClear(lines);
        
        // Level up every 10 lines
        const newLevel = Math.floor(this.stats.linesCleared / 10) + 1;
        if (newLevel > this.game.level) {
            this.game.level = newLevel;
            this.game.dropInterval = Math.max(0.05, this.game.baseDropInterval - (this.game.level - 1) * 0.08);
            this.game.onLevelUp?.(newLevel);
        }
    }

    renderOverlay(ctx, width, height) {
        // Show elapsed time in corner
        ctx.save();
        ctx.font = '14px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'right';
        ctx.fillText(`Time: ${this.formatTime(this.elapsedTime)}`, width - 10, 20);
        ctx.restore();
    }
}

/**
 * Sprint Mode - Clear 40 lines as fast as possible
 */
export class SprintMode extends GameMode {
    constructor(game) {
        super(game);
        this.type = GameModeType.SPRINT;
        this.targetLines = 40;
        this.splits = [];
        this.bestTime = null;
    }

    initialize() {
        super.initialize();
        this.splits = [];
        this.bestTime = this.loadBestTime();
        this.game.level = 1;
        this.game.dropInterval = 0.5; // Fixed faster speed for sprint
    }

    loadBestTime() {
        try {
            const saved = localStorage.getItem('tetris_sprint_best');
            return saved ? parseFloat(saved) : null;
        } catch {
            return null;
        }
    }

    saveBestTime(time) {
        try {
            localStorage.setItem('tetris_sprint_best', time.toString());
        } catch {}
    }

    onLineClear(lines) {
        super.onLineClear(lines);
        
        // Record splits at milestones
        const milestones = [10, 20, 30, 40];
        for (const milestone of milestones) {
            if (this.stats.linesCleared >= milestone && 
                !this.splits.find(s => s.lines === milestone)) {
                this.splits.push({
                    lines: milestone,
                    time: this.elapsedTime
                });
            }
        }
    }

    checkWinCondition() {
        if (this.stats.linesCleared >= this.targetLines) {
            // Check if new best time
            if (!this.bestTime || this.elapsedTime < this.bestTime) {
                this.bestTime = this.elapsedTime;
                this.saveBestTime(this.elapsedTime);
            }
            return true;
        }
        return false;
    }

    renderOverlay(ctx, width, height) {
        ctx.save();
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        
        // Current time
        ctx.fillStyle = '#ffff00';
        ctx.fillText(this.formatTime(this.elapsedTime), width / 2, 25);
        
        // Lines remaining
        const remaining = Math.max(0, this.targetLines - this.stats.linesCleared);
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillStyle = remaining <= 10 ? '#00ff00' : 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(`${remaining} lines to go`, width / 2, 45);
        
        // Best time comparison
        if (this.bestTime) {
            const diff = this.elapsedTime - this.bestTime;
            ctx.fillStyle = diff < 0 ? '#00ff00' : '#ff0000';
            ctx.fillText(`Best: ${this.formatTime(this.bestTime)}`, width / 2, 65);
        }
        
        ctx.restore();
    }

    getStats() {
        return {
            ...super.getStats(),
            targetLines: this.targetLines,
            splits: this.splits,
            bestTime: this.bestTime,
            isNewRecord: this.bestTime === this.elapsedTime
        };
    }
}

/**
 * Ultra Mode - Highest score in 2 minutes
 */
export class UltraMode extends GameMode {
    constructor(game) {
        super(game);
        this.type = GameModeType.ULTRA;
        this.timeLimit = 120000; // 2 minutes in ms
        this.remainingTime = this.timeLimit;
        this.bestScore = null;
    }

    initialize() {
        super.initialize();
        this.remainingTime = this.timeLimit;
        this.bestScore = this.loadBestScore();
        this.game.level = 1;
        this.game.dropInterval = 0.5; // Faster for scoring
    }

    loadBestScore() {
        try {
            const saved = localStorage.getItem('tetris_ultra_best');
            return saved ? parseInt(saved) : null;
        } catch {
            return null;
        }
    }

    saveBestScore(score) {
        try {
            localStorage.setItem('tetris_ultra_best', score.toString());
        } catch {}
    }

    update(dt) {
        super.update(dt);
        this.remainingTime = Math.max(0, this.timeLimit - this.elapsedTime);
        
        // Speed increases over time
        const timeProgress = this.elapsedTime / this.timeLimit;
        this.game.dropInterval = Math.max(0.15, 0.5 - timeProgress * 0.3);
    }

    checkLoseCondition() {
        if (this.remainingTime <= 0) {
            // Check for high score
            if (!this.bestScore || this.game.score > this.bestScore) {
                this.bestScore = this.game.score;
                this.saveBestScore(this.game.score);
            }
            return true;
        }
        return false;
    }

    renderOverlay(ctx, width, height) {
        ctx.save();
        
        // Countdown timer - big and bold
        const seconds = Math.ceil(this.remainingTime / 1000);
        ctx.font = 'bold 24px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        
        // Color changes as time runs out
        if (seconds <= 10) {
            ctx.fillStyle = '#ff0000';
        } else if (seconds <= 30) {
            ctx.fillStyle = '#ffaa00';
        } else {
            ctx.fillStyle = '#ff00ff';
        }
        
        ctx.fillText(`${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`, width / 2, 30);
        
        // Best score comparison
        if (this.bestScore) {
            ctx.font = '12px "JetBrains Mono", monospace';
            ctx.fillStyle = this.game.score > this.bestScore ? '#00ff00' : 'rgba(255, 255, 255, 0.5)';
            ctx.fillText(`Best: ${this.bestScore.toLocaleString()}`, width / 2, 50);
        }
        
        ctx.restore();
    }

    getStats() {
        return {
            ...super.getStats(),
            timeLimit: this.timeLimit,
            remainingTime: this.remainingTime,
            bestScore: this.bestScore,
            isNewRecord: this.bestScore === this.game.score
        };
    }
}

/**
 * Zen Mode - No pressure, relaxed gameplay
 */
export class ZenMode extends GameMode {
    constructor(game) {
        super(game);
        this.type = GameModeType.ZEN;
        this.noGravity = false;
        this.infiniteHold = true;
    }

    initialize() {
        super.initialize();
        this.game.level = 1;
        this.game.dropInterval = 2.0; // Very slow
        this.noGravity = false;
    }

    update(dt) {
        super.update(dt);
        
        // In Zen mode, gravity is optional
        if (this.noGravity) {
            this.game.dropTimer = 0;
        }
    }

    toggleGravity() {
        this.noGravity = !this.noGravity;
    }

    // Zen mode never loses
    checkLoseCondition() {
        return false; // Game over disabled
    }

    // Override - allow infinite holds
    canHold() {
        return this.infiniteHold || this.game.canHold;
    }

    renderOverlay(ctx, width, height) {
        ctx.save();
        ctx.font = '14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ff88';
        ctx.fillText('🧘 Zen Mode', width / 2, 25);
        
        if (this.noGravity) {
            ctx.font = '12px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(0, 255, 136, 0.7)';
            ctx.fillText('Gravity: OFF', width / 2, 45);
        }
        
        ctx.restore();
    }
}

/**
 * Time Attack Mode - Speed increases every 30 seconds
 */
export class TimeAttackMode extends GameMode {
    constructor(game) {
        super(game);
        this.type = GameModeType.TIME_ATTACK;
        this.speedIncreaseInterval = 30000; // 30 seconds
        this.currentSpeedLevel = 1;
        this.maxSpeedLevel = 20;
    }

    initialize() {
        super.initialize();
        this.currentSpeedLevel = 1;
        this.game.level = 1;
        this.game.dropInterval = this.game.baseDropInterval;
    }

    update(dt) {
        super.update(dt);
        
        // Increase speed every 30 seconds
        const newSpeedLevel = Math.min(
            this.maxSpeedLevel,
            Math.floor(this.elapsedTime / this.speedIncreaseInterval) + 1
        );
        
        if (newSpeedLevel > this.currentSpeedLevel) {
            this.currentSpeedLevel = newSpeedLevel;
            this.game.level = newSpeedLevel;
            
            // Exponential speed increase
            this.game.dropInterval = Math.max(
                0.02,
                this.game.baseDropInterval * Math.pow(0.85, newSpeedLevel - 1)
            );
            
            this.game.onLevelUp?.(newSpeedLevel);
        }
    }

    renderOverlay(ctx, width, height) {
        ctx.save();
        
        // Time until next speed increase
        const timeIntoLevel = this.elapsedTime % this.speedIncreaseInterval;
        const timeUntilSpeedUp = this.speedIncreaseInterval - timeIntoLevel;
        const secondsUntil = Math.ceil(timeUntilSpeedUp / 1000);
        
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = secondsUntil <= 5 ? '#ff0000' : '#ff8800';
        ctx.fillText(`🔥 Speed Up: ${secondsUntil}s`, width / 2, 25);
        
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(255, 136, 0, 0.7)';
        ctx.fillText(`Speed Level: ${this.currentSpeedLevel}/${this.maxSpeedLevel}`, width / 2, 45);
        
        ctx.restore();
    }

    getStats() {
        return {
            ...super.getStats(),
            speedLevel: this.currentSpeedLevel,
            maxSpeedLevel: this.maxSpeedLevel
        };
    }
}

/**
 * Survival Mode - Garbage rows rise from below
 */
export class SurvivalMode extends GameMode {
    constructor(game) {
        super(game);
        this.type = GameModeType.SURVIVAL;
        this.garbageInterval = 10000; // Every 10 seconds
        this.lastGarbageTime = 0;
        this.garbageRowsAdded = 0;
        this.garbageWarning = false;
    }

    initialize() {
        super.initialize();
        this.lastGarbageTime = 0;
        this.garbageRowsAdded = 0;
        this.garbageWarning = false;
        this.game.level = 1;
        this.game.dropInterval = 0.6;
    }

    update(dt) {
        super.update(dt);
        
        // Check if it's time to add garbage
        const timeSinceGarbage = this.elapsedTime - this.lastGarbageTime;
        
        // Warning when garbage is coming (3 seconds before)
        this.garbageWarning = (this.garbageInterval - timeSinceGarbage) <= 3000;
        
        if (timeSinceGarbage >= this.garbageInterval) {
            this.addGarbageRow();
            this.lastGarbageTime = this.elapsedTime;
            
            // Speed up garbage rate over time
            this.garbageInterval = Math.max(5000, 10000 - this.garbageRowsAdded * 500);
        }
        
        // Gradually increase drop speed
        const minutesPlayed = this.elapsedTime / 60000;
        this.game.dropInterval = Math.max(0.2, 0.6 - minutesPlayed * 0.05);
    }

    addGarbageRow() {
        const grid = this.game.grid;
        const COLS = grid[0].length;
        
        // Check if top row has blocks (would cause game over)
        if (grid[0].some(cell => cell !== null)) {
            return; // Don't add garbage if it would cause immediate game over
        }
        
        // Shift all rows up
        grid.shift();
        
        // Create garbage row with one random hole
        const holePosition = Math.floor(Math.random() * COLS);
        const garbageRow = Array(COLS).fill('#555555');
        garbageRow[holePosition] = null;
        
        grid.push(garbageRow);
        this.garbageRowsAdded++;
        
        // Push current piece up if needed
        if (this.game.currentPiece && this.game.currentPiece.y > 0) {
            this.game.currentPiece.y--;
        }
    }

    renderOverlay(ctx, width, height) {
        ctx.save();
        
        const timeSinceGarbage = this.elapsedTime - this.lastGarbageTime;
        const timeUntilGarbage = this.garbageInterval - timeSinceGarbage;
        const secondsUntil = Math.ceil(timeUntilGarbage / 1000);
        
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        
        if (this.garbageWarning) {
            // Flashing warning
            const flash = Math.floor(this.elapsedTime / 200) % 2;
            ctx.fillStyle = flash ? '#ff0044' : '#ffffff';
            ctx.fillText('⚠️ GARBAGE INCOMING!', width / 2, 25);
        } else {
            ctx.fillStyle = '#ff0044';
            ctx.fillText(`💀 Next Garbage: ${secondsUntil}s`, width / 2, 25);
        }
        
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(255, 0, 68, 0.7)';
        ctx.fillText(`Rows Survived: ${this.garbageRowsAdded}`, width / 2, 45);
        
        ctx.restore();
    }

    getStats() {
        return {
            ...super.getStats(),
            garbageRowsAdded: this.garbageRowsAdded,
            survivalTime: this.elapsedTime
        };
    }
}

/**
 * Game Mode Manager - Handles mode switching and state
 */
export class GameModeManager {
    constructor(game) {
        this.game = game;
        this.currentMode = null;
        this.unlockedModes = this.loadUnlockedModes();
        
        // Mode class mapping
        this.modeClasses = {
            [GameModeType.MARATHON]: MarathonMode,
            [GameModeType.SPRINT]: SprintMode,
            [GameModeType.ULTRA]: UltraMode,
            [GameModeType.ZEN]: ZenMode,
            [GameModeType.TIME_ATTACK]: TimeAttackMode,
            [GameModeType.SURVIVAL]: SurvivalMode
        };
    }

    loadUnlockedModes() {
        try {
            const saved = localStorage.getItem('tetris_unlocked_modes');
            if (saved) {
                return new Set(JSON.parse(saved));
            }
        } catch {}
        
        // Default unlocked modes
        return new Set([
            GameModeType.MARATHON,
            GameModeType.SPRINT,
            GameModeType.ULTRA,
            GameModeType.ZEN
        ]);
    }

    saveUnlockedModes() {
        try {
            localStorage.setItem('tetris_unlocked_modes', 
                JSON.stringify([...this.unlockedModes]));
        } catch {}
    }

    unlockMode(modeType) {
        if (!this.unlockedModes.has(modeType)) {
            this.unlockedModes.add(modeType);
            this.saveUnlockedModes();
            return true;
        }
        return false;
    }

    isModeUnlocked(modeType) {
        return this.unlockedModes.has(modeType);
    }

    getModeConfig(modeType) {
        const config = { ...MODE_CONFIG[modeType] };
        config.unlocked = this.isModeUnlocked(modeType);
        return config;
    }

    getAllModes() {
        return Object.keys(GameModeType).map(key => ({
            type: GameModeType[key],
            ...this.getModeConfig(GameModeType[key])
        }));
    }

    setMode(modeType) {
        if (!this.isModeUnlocked(modeType)) {
            console.warn(`Mode ${modeType} is not unlocked`);
            return false;
        }

        const ModeClass = this.modeClasses[modeType];
        if (!ModeClass) {
            console.error(`Unknown mode: ${modeType}`);
            return false;
        }

        this.currentMode = new ModeClass(this.game);
        return true;
    }

    getCurrentMode() {
        return this.currentMode;
    }

    initialize() {
        if (this.currentMode) {
            this.currentMode.initialize();
        }
    }

    update(dt) {
        if (this.currentMode) {
            this.currentMode.update(dt);
            
            // Check win/lose conditions
            if (this.currentMode.checkWinCondition()) {
                this.game.onModeWin?.(this.currentMode.getStats());
            }
            
            if (this.currentMode.checkLoseCondition()) {
                this.game.onModeLose?.(this.currentMode.getStats());
            }
        }
    }

    onLineClear(lines) {
        if (this.currentMode) {
            this.currentMode.onLineClear(lines);
        }
        
        // Check for mode unlocks
        this.checkUnlocks();
    }

    onPiecePlaced() {
        this.currentMode?.onPiecePlaced();
    }

    onCombo(combo) {
        this.currentMode?.onCombo(combo);
    }

    onPerfectClear() {
        this.currentMode?.onPerfectClear();
    }

    checkUnlocks() {
        // Unlock Time Attack after reaching level 10 in Marathon
        if (this.currentMode?.type === GameModeType.MARATHON && 
            this.game.level >= 10) {
            this.unlockMode(GameModeType.TIME_ATTACK);
        }
        
        // Unlock Survival after completing Sprint
        if (this.currentMode?.type === GameModeType.SPRINT &&
            this.currentMode.checkWinCondition()) {
            this.unlockMode(GameModeType.SURVIVAL);
        }
    }

    renderOverlay(ctx, width, height) {
        this.currentMode?.renderOverlay(ctx, width, height);
    }

    end() {
        this.currentMode?.end();
    }

    getStats() {
        return this.currentMode?.getStats() || {};
    }
}
