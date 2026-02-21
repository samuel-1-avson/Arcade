/**
 * Pac-Man Game Modes System
 * Provides 6 unique game modes with different objectives and mechanics
 */

export const GAME_MODES = {
    CLASSIC: {
        id: 'classic',
        name: 'Classic',
        icon: '🕹️',
        description: 'Traditional Pac-Man gameplay. Clear all dots to advance.',
        color: '#ffff00',
        unlocked: true,
        settings: {
            lives: 3,
            powerDuration: 7,
            ghostSpeed: 1.0,
            pacmanSpeed: 1.0,
            powerUpsEnabled: false,
            timeLimit: 0
        }
    },
    SPEED_RUN: {
        id: 'speed_run',
        name: 'Speed Run',
        icon: '⚡',
        description: 'Complete levels as fast as possible. Time is everything!',
        color: '#00ffff',
        unlocked: true,
        settings: {
            lives: 1,
            powerDuration: 5,
            ghostSpeed: 1.2,
            pacmanSpeed: 1.3,
            powerUpsEnabled: true,
            timeLimit: 0,
            showTimer: true
        }
    },
    TIME_ATTACK: {
        id: 'time_attack',
        name: 'Time Attack',
        icon: '⏱️',
        description: 'Score as much as possible in 2 minutes!',
        color: '#ff00ff',
        unlocked: true,
        settings: {
            lives: 99,
            powerDuration: 10,
            ghostSpeed: 0.9,
            pacmanSpeed: 1.1,
            powerUpsEnabled: true,
            timeLimit: 120,
            respawnDots: true
        }
    },
    MAZE_RUNNER: {
        id: 'maze_runner',
        name: 'Maze Runner',
        icon: '🏃',
        description: 'Navigate through procedurally generated mazes!',
        color: '#00ff00',
        unlocked: false,
        unlockCondition: 'Complete 5 levels in Classic mode',
        settings: {
            lives: 3,
            powerDuration: 6,
            ghostSpeed: 1.0,
            pacmanSpeed: 1.0,
            powerUpsEnabled: true,
            proceduralMaze: true,
            timeLimit: 0
        }
    },
    GHOST_HUNTER: {
        id: 'ghost_hunter',
        name: 'Ghost Hunter',
        icon: '👻',
        description: 'Hunt ghosts for points! Power pellets spawn frequently.',
        color: '#ff4444',
        unlocked: false,
        unlockCondition: 'Eat 50 ghosts total',
        settings: {
            lives: 3,
            powerDuration: 12,
            ghostSpeed: 0.8,
            pacmanSpeed: 1.0,
            powerUpsEnabled: true,
            extraPowerPellets: true,
            ghostPoints: 3,
            timeLimit: 0
        }
    },
    SURVIVAL: {
        id: 'survival',
        name: 'Survival',
        icon: '💀',
        description: 'Endless mode with increasing difficulty. How long can you last?',
        color: '#ff8800',
        unlocked: false,
        unlockCondition: 'Score 25,000 points in any mode',
        settings: {
            lives: 1,
            powerDuration: 5,
            ghostSpeed: 1.0,
            pacmanSpeed: 1.0,
            powerUpsEnabled: true,
            endless: true,
            difficultyIncrease: true,
            timeLimit: 0
        }
    }
};

/**
 * Game Mode Manager
 */
export class GameModeManager {
    constructor(game) {
        this.game = game;
        this.currentMode = GAME_MODES.CLASSIC;
        this.modeStats = this.loadModeStats();
        this.timeRemaining = 0;
        this.modeTimer = 0;
        this.difficultyLevel = 1;
    }

    loadModeStats() {
        const saved = localStorage.getItem('pacman_mode_stats');
        return saved ? JSON.parse(saved) : {
            levelsCompleted: 0,
            ghostsEaten: 0,
            highestScore: 0,
            totalPlayTime: 0,
            modesUnlocked: ['classic', 'speed_run', 'time_attack']
        };
    }

    saveModeStats() {
        localStorage.setItem('pacman_mode_stats', JSON.stringify(this.modeStats));
    }

    checkUnlocks() {
        // Maze Runner: Complete 5 levels
        if (this.modeStats.levelsCompleted >= 5 && !this.modeStats.modesUnlocked.includes('maze_runner')) {
            this.modeStats.modesUnlocked.push('maze_runner');
            GAME_MODES.MAZE_RUNNER.unlocked = true;
            this.game.showUnlockNotification('Maze Runner mode unlocked!');
        }

        // Ghost Hunter: Eat 50 ghosts
        if (this.modeStats.ghostsEaten >= 50 && !this.modeStats.modesUnlocked.includes('ghost_hunter')) {
            this.modeStats.modesUnlocked.push('ghost_hunter');
            GAME_MODES.GHOST_HUNTER.unlocked = true;
            this.game.showUnlockNotification('Ghost Hunter mode unlocked!');
        }

        // Survival: Score 25,000 points
        if (this.modeStats.highestScore >= 25000 && !this.modeStats.modesUnlocked.includes('survival')) {
            this.modeStats.modesUnlocked.push('survival');
            GAME_MODES.SURVIVAL.unlocked = true;
            this.game.showUnlockNotification('Survival mode unlocked!');
        }

        this.saveModeStats();
    }

    setMode(modeId) {
        const mode = Object.values(GAME_MODES).find(m => m.id === modeId);
        if (mode && (mode.unlocked || this.modeStats.modesUnlocked.includes(modeId))) {
            this.currentMode = mode;
            this.applyModeSettings();
            return true;
        }
        return false;
    }

    applyModeSettings() {
        const settings = this.currentMode.settings;
        
        this.game.lives = settings.lives;
        this.game.powerDuration = settings.powerDuration;
        this.game.ghostSpeedMultiplier = settings.ghostSpeed;
        this.game.pacmanSpeedMultiplier = settings.pacmanSpeed;
        this.game.powerUpsEnabled = settings.powerUpsEnabled;
        
        if (settings.timeLimit > 0) {
            this.timeRemaining = settings.timeLimit;
        }

        this.difficultyLevel = 1;
    }

    update(dt) {
        this.modeTimer += dt;

        // Time Attack countdown
        if (this.currentMode.settings.timeLimit > 0) {
            this.timeRemaining -= dt;
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.game.gameOver(false);
            }
        }

        // Survival difficulty increase
        if (this.currentMode.settings.difficultyIncrease) {
            const newLevel = Math.floor(this.modeTimer / 30) + 1;
            if (newLevel > this.difficultyLevel) {
                this.difficultyLevel = newLevel;
                this.game.ghostSpeedMultiplier = 1.0 + (newLevel - 1) * 0.1;
                this.game.showNotification(`Difficulty increased to level ${newLevel}!`);
            }
        }
    }

    onLevelComplete() {
        this.modeStats.levelsCompleted++;
        this.checkUnlocks();
        this.saveModeStats();
    }

    onGhostEaten() {
        this.modeStats.ghostsEaten++;
        this.checkUnlocks();
    }

    onScoreUpdate(score) {
        if (score > this.modeStats.highestScore) {
            this.modeStats.highestScore = score;
            this.checkUnlocks();
        }
    }

    getTimeDisplay() {
        if (this.currentMode.settings.timeLimit > 0) {
            const mins = Math.floor(this.timeRemaining / 60);
            const secs = Math.floor(this.timeRemaining % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        if (this.currentMode.settings.showTimer) {
            const mins = Math.floor(this.modeTimer / 60);
            const secs = Math.floor(this.modeTimer % 60);
            const ms = Math.floor((this.modeTimer % 1) * 100);
            return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
        }
        return null;
    }

    getModeColor() {
        return this.currentMode.color;
    }

    isUnlocked(modeId) {
        return this.modeStats.modesUnlocked.includes(modeId);
    }

    getAllModes() {
        return Object.values(GAME_MODES).map(mode => ({
            ...mode,
            unlocked: mode.unlocked || this.modeStats.modesUnlocked.includes(mode.id)
        }));
    }
}
