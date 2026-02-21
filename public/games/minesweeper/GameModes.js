import { ICONS } from './Icons.js';

// Game Mode Definitions
export const GAME_MODES = {
    classic: {
        id: 'classic',
        name: 'Classic',
        icon: ICONS.MODE_CLASSIC,
        description: 'Traditional Minesweeper gameplay',
        difficulties: ['easy', 'medium', 'hard'],
        hasTimer: true,
        hasFlags: true,
        hasHints: false
    },
    timeAttack: {
        id: 'timeAttack',
        name: 'Time Attack',
        icon: ICONS.MODE_TIME,
        description: 'Race against the clock for bonus points',
        difficulties: ['easy', 'medium', 'hard'],
        hasTimer: true,
        hasFlags: true,
        hasHints: false,
        timeLimit: { easy: 120, medium: 300, hard: 600 },
        scoreMultiplier: true
    },
    zen: {
        id: 'zen',
        name: 'Zen Mode',
        icon: ICONS.MODE_ZEN,
        description: 'Relaxed gameplay with unlimited hints',
        difficulties: ['easy', 'medium', 'hard'],
        hasTimer: false,
        hasFlags: true,
        hasHints: true,
        noGameOver: true
    },
    puzzle: {
        id: 'puzzle',
        name: 'Puzzle',
        icon: ICONS.MODE_PUZZLE,
        description: 'Solve handcrafted puzzles with unique solutions',
        hasTimer: true,
        hasFlags: true,
        hasHints: false,
        usePredefinedBoards: true
    },
    campaign: {
        id: 'campaign',
        name: 'Campaign',
        icon: ICONS.MODE_CAMPAIGN,
        description: 'Journey through themed worlds',
        hasTimer: true,
        hasFlags: true,
        hasHints: false,
        useStoryMode: true
    },
    custom: {
        id: 'custom',
        name: 'Custom',
        icon: ICONS.MODE_CUSTOM,
        description: 'Create your own challenge',
        hasTimer: true,
        hasFlags: true,
        hasHints: false,
        customSettings: true
    },
    coop: {
        id: 'coop',
        name: 'Co-op',
        icon: ICONS.MODE_COOP,
        description: 'Play with friends online',
        difficulties: ['easy', 'medium', 'hard'],
        hasTimer: true,
        hasFlags: true,
        hasHints: false,
        isMultiplayer: true
    }
};

// Puzzle Level Definitions
export const PUZZLE_LEVELS = [
    {
        id: 1,
        name: "The Opening",
        desc: "Find the safe path through the corners",
        difficulty: 'beginner',
        rows: 5,
        cols: 5,
        mines: [
            { row: 1, col: 1 }, { row: 1, col: 3 },
            { row: 3, col: 1 }, { row: 3, col: 3 }
        ],
        hints: ["Start from the edges", "Corners are your friends"],
        stars: { 3: 15, 2: 30, 1: 60 } // seconds for each star rating
    },
    {
        id: 2,
        name: "The Cross",
        desc: "Mines form a hidden cross pattern",
        difficulty: 'beginner',
        rows: 7,
        cols: 7,
        mines: [
            { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 },
            { row: 3, col: 4 }, { row: 3, col: 5 }, { row: 3, col: 6 },
            { row: 0, col: 3 }, { row: 1, col: 3 }, { row: 2, col: 3 },
            { row: 4, col: 3 }, { row: 5, col: 3 }, { row: 6, col: 3 }
        ],
        hints: ["The pattern is symmetric", "Look for the center"],
        stars: { 3: 20, 2: 45, 1: 90 }
    },
    {
        id: 3,
        name: "Diagonal Danger",
        desc: "Mines hide in diagonal lines",
        difficulty: 'intermediate',
        rows: 8,
        cols: 8,
        mines: [
            { row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 },
            { row: 3, col: 3 }, { row: 4, col: 4 }, { row: 5, col: 5 },
            { row: 6, col: 6 }, { row: 7, col: 7 },
            { row: 0, col: 7 }, { row: 1, col: 6 }, { row: 2, col: 5 },
            { row: 5, col: 2 }, { row: 6, col: 1 }, { row: 7, col: 0 }
        ],
        hints: ["Think diagonally", "Both diagonals are dangerous"],
        stars: { 3: 30, 2: 60, 1: 120 }
    },
    {
        id: 4,
        name: "The Frame",
        desc: "A border of danger",
        difficulty: 'intermediate',
        rows: 9,
        cols: 9,
        mines: (() => {
            const mines = [];
            for (let i = 0; i < 9; i++) {
                if (i !== 4) {
                    mines.push({ row: 0, col: i });
                    mines.push({ row: 8, col: i });
                }
                if (i > 0 && i < 8 && i !== 4) {
                    mines.push({ row: i, col: 0 });
                    mines.push({ row: i, col: 8 });
                }
            }
            return mines;
        })(),
        hints: ["Stay away from the edges", "The center is safe"],
        stars: { 3: 40, 2: 80, 1: 150 }
    },
    {
        id: 5,
        name: "Checkerboard",
        desc: "Every other cell is a trap",
        difficulty: 'advanced',
        rows: 6,
        cols: 6,
        mines: (() => {
            const mines = [];
            for (let r = 0; r < 6; r++) {
                for (let c = 0; c < 6; c++) {
                    if ((r + c) % 2 === 0) mines.push({ row: r, col: c });
                }
            }
            return mines;
        })(),
        hints: ["Like a chess board", "Step on the right color"],
        stars: { 3: 25, 2: 50, 1: 100 }
    },
    {
        id: 6,
        name: "The Spiral",
        desc: "Mines spiral toward the center",
        difficulty: 'advanced',
        rows: 9,
        cols: 9,
        mines: [
            { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 }, { row: 0, col: 5 }, { row: 0, col: 6 }, { row: 0, col: 7 },
            { row: 1, col: 7 }, { row: 2, col: 7 }, { row: 3, col: 7 }, { row: 4, col: 7 }, { row: 5, col: 7 },
            { row: 6, col: 7 }, { row: 6, col: 6 }, { row: 6, col: 5 }, { row: 6, col: 4 }, { row: 6, col: 3 }, { row: 6, col: 2 },
            { row: 5, col: 2 }, { row: 4, col: 2 }, { row: 3, col: 2 },
            { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 },
            { row: 3, col: 5 }, { row: 4, col: 4 }
        ],
        hints: ["Start from outside", "Follow the spiral inward"],
        stars: { 3: 60, 2: 120, 1: 180 }
    },
    {
        id: 7,
        name: "The Islands",
        desc: "Safe islands in a sea of danger",
        difficulty: 'expert',
        rows: 10,
        cols: 10,
        mines: (() => {
            const mines = [];
            const safeZones = [
                { r: 1, c: 1 }, { r: 1, c: 8 },
                { r: 4, c: 4 }, { r: 4, c: 5 },
                { r: 5, c: 4 }, { r: 5, c: 5 },
                { r: 8, c: 1 }, { r: 8, c: 8 }
            ];
            for (let r = 0; r < 10; r++) {
                for (let c = 0; c < 10; c++) {
                    if (!safeZones.some(z => z.r === r && z.c === c)) {
                        if (Math.random() > 0.4) mines.push({ row: r, col: c });
                    }
                }
            }
            return mines.slice(0, 50);
        })(),
        hints: ["Find the safe islands", "Corners and center are key"],
        stars: { 3: 90, 2: 180, 1: 300 }
    },
    {
        id: 8,
        name: "The Maze",
        desc: "Navigate the minefield maze",
        difficulty: 'expert',
        rows: 11,
        cols: 11,
        mines: (() => {
            const mines = [];
            // Create maze-like walls of mines
            for (let r = 0; r < 11; r++) {
                for (let c = 0; c < 11; c++) {
                    if (r % 2 === 0 && c % 2 === 0) continue; // Intersections are safe
                    if (r % 2 === 0 && Math.random() > 0.3) mines.push({ row: r, col: c });
                    if (c % 2 === 0 && Math.random() > 0.3) mines.push({ row: r, col: c });
                }
            }
            return mines;
        })(),
        hints: ["Stay on the grid intersections", "Plan your path carefully"],
        stars: { 3: 120, 2: 240, 1: 400 }
    }
];

// Daily Challenge Types
export const DAILY_CHALLENGE_TYPES = [
    { type: 'speed_easy', desc: 'Complete Easy in under {value} seconds', values: [45, 60, 90], reward: 50 },
    { type: 'speed_medium', desc: 'Complete Medium in under {value} seconds', values: [180, 240, 300], reward: 100 },
    { type: 'speed_hard', desc: 'Complete Hard in under {value} seconds', values: [400, 500, 600], reward: 200 },
    { type: 'no_flags', desc: 'Win a game without using any flags', reward: 75 },
    { type: 'perfect', desc: 'Win without clicking any mine', reward: 50 },
    { type: 'chain_reveal', desc: 'Reveal {value}+ cells in a single click', values: [15, 25, 40], reward: 100 },
    { type: 'efficiency', desc: 'Win with {value}% or less of cells revealed', values: [60, 50, 40], reward: 150 },
    { type: 'multi_win', desc: 'Win {value} games today', values: [3, 5, 10], reward: 100 }
];

// Weekly Challenge Templates
export const WEEKLY_CHALLENGES = [
    { name: 'Marathon Runner', desc: 'Win 25 games this week', target: 25, type: 'wins', reward: 500 },
    { name: 'Difficulty Master', desc: 'Win on each difficulty level', target: 3, type: 'all_difficulties', reward: 300 },
    { name: 'Speed Demon', desc: 'Achieve 5 sub-60 second wins', target: 5, type: 'speed_wins', reward: 400 },
    { name: 'Perfectionist', desc: 'Win 10 games without hitting any mine', target: 10, type: 'perfect_wins', reward: 600 },
    { name: 'Explorer', desc: 'Reveal 5000 total cells', target: 5000, type: 'cells_revealed', reward: 350 }
];

/**
 * Game Mode Manager Class
 */
export class GameModeManager {
    constructor(game) {
        this.game = game;
        this.currentMode = 'classic';
        this.currentPuzzleIndex = 0;
        this.customSettings = { rows: 10, cols: 10, mines: 15 };
        this.timeAttackScore = 0;
        this.timeRemaining = 0;
        this.timerInterval = null;
        this.hintsUsed = 0;
        this.maxHints = 3;
    }

    /**
     * Switch to a new game mode
     */
    setMode(modeId) {
        if (!GAME_MODES[modeId]) {
            console.error(`Unknown game mode: ${modeId}`);
            return false;
        }

        this.currentMode = modeId;
        const mode = GAME_MODES[modeId];
        
        // Reset mode-specific state
        this.hintsUsed = 0;
        this.timeAttackScore = 0;
        
        // Emit mode change event
        if (this.game.eventBus) {
            this.game.eventBus.emit('modeChange', { mode: modeId });
        }

        return true;
    }

    /**
     * Get current mode configuration
     */
    getCurrentMode() {
        return GAME_MODES[this.currentMode];
    }

    /**
     * Get difficulty settings based on mode
     */
    getDifficultySettings(difficulty) {
        const mode = this.getCurrentMode();
        
        if (this.currentMode === 'custom') {
            return this.customSettings;
        }

        if (this.currentMode === 'puzzle') {
            const puzzle = PUZZLE_LEVELS[this.currentPuzzleIndex];
            return { 
                rows: puzzle.rows, 
                cols: puzzle.cols, 
                mines: puzzle.mines.length,
                predefinedMines: puzzle.mines
            };
        }

        // Standard difficulty settings
        const settings = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };

        return settings[difficulty] || settings.easy;
    }

    /**
     * Start Time Attack mode
     */
    startTimeAttack(difficulty) {
        const mode = GAME_MODES.timeAttack;
        this.timeRemaining = mode.timeLimit[difficulty];
        this.timeAttackScore = 0;
        
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimeDisplay();
            
            if (this.timeRemaining <= 0) {
                this.endTimeAttack(false);
            }
        }, 1000);
    }

    /**
     * Update time display for Time Attack
     */
    updateTimeDisplay() {
        const el = document.querySelector('.time-attack-display');
        if (el) {
            el.textContent = this.formatTime(this.timeRemaining);
            if (this.timeRemaining <= 30) {
                el.classList.add('warning');
            }
            if (this.timeRemaining <= 10) {
                el.classList.add('critical');
            }
        }
    }

    /**
     * Format time for display
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * End Time Attack mode
     */
    endTimeAttack(won) {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        if (won) {
            // Calculate score with time bonus
            const timeBonus = Math.floor(this.timeRemaining * 10);
            this.timeAttackScore += timeBonus;
        }

        return { won, score: this.timeAttackScore, timeRemaining: this.timeRemaining };
    }

    /**
     * Add score in Time Attack mode
     */
    addTimeAttackScore(points) {
        if (this.currentMode === 'timeAttack') {
            this.timeAttackScore += points;
        }
    }

    /**
     * Use a hint in Zen mode
     */
    useHint() {
        const mode = this.getCurrentMode();
        if (!mode.hasHints) return null;

        if (this.hintsUsed >= this.maxHints) {
            return { success: false, message: 'No hints remaining' };
        }

        this.hintsUsed++;
        
        // Find a safe, unrevealed cell
        const safeCell = this.findSafeCell();
        
        return { 
            success: true, 
            cell: safeCell, 
            hintsRemaining: this.maxHints - this.hintsUsed 
        };
    }

    /**
     * Find a safe cell for hints
     */
    findSafeCell() {
        if (!this.game.grid) return null;

        for (let row = 0; row < this.game.rows; row++) {
            for (let col = 0; col < this.game.cols; col++) {
                const cell = this.game.grid[row][col];
                if (!cell.mine && !cell.revealed && !cell.flagged) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    /**
     * Check if game should end on mine click (Zen mode protection)
     */
    shouldProtectFromMine() {
        const mode = this.getCurrentMode();
        return mode.noGameOver === true;
    }

    /**
     * Set custom game settings
     */
    setCustomSettings(rows, cols, mines) {
        // Validate settings
        rows = Math.max(5, Math.min(30, rows));
        cols = Math.max(5, Math.min(50, cols));
        const maxMines = Math.floor(rows * cols * 0.35);
        mines = Math.max(1, Math.min(maxMines, mines));

        this.customSettings = { rows, cols, mines };
        return this.customSettings;
    }

    /**
     * Get current puzzle level
     */
    getCurrentPuzzle() {
        return PUZZLE_LEVELS[this.currentPuzzleIndex] || PUZZLE_LEVELS[0];
    }

    /**
     * Move to next puzzle
     */
    nextPuzzle() {
        this.currentPuzzleIndex = (this.currentPuzzleIndex + 1) % PUZZLE_LEVELS.length;
        return this.getCurrentPuzzle();
    }

    /**
     * Select a specific puzzle
     */
    selectPuzzle(puzzleId) {
        const index = PUZZLE_LEVELS.findIndex(p => p.id === puzzleId);
        if (index >= 0) {
            this.currentPuzzleIndex = index;
            return this.getCurrentPuzzle();
        }
        return null;
    }

    /**
     * Calculate star rating for completed puzzle
     */
    getPuzzleStarRating(timeTaken) {
        const puzzle = this.getCurrentPuzzle();
        if (!puzzle || !puzzle.stars) return 1;

        if (timeTaken <= puzzle.stars[3]) return 3;
        if (timeTaken <= puzzle.stars[2]) return 2;
        return 1;
    }

    /**
     * Generate daily challenge based on date
     */
    getDailyChallenge() {
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        
        // Use seeded random to pick challenge type
        const seededRandom = (seed) => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };

        const challengeIndex = Math.floor(seededRandom(seed) * DAILY_CHALLENGE_TYPES.length);
        const challenge = { ...DAILY_CHALLENGE_TYPES[challengeIndex] };
        
        // Pick specific value if challenge has multiple options
        if (challenge.values) {
            const valueIndex = Math.floor(seededRandom(seed + 1) * challenge.values.length);
            challenge.targetValue = challenge.values[valueIndex];
            challenge.desc = challenge.desc.replace('{value}', challenge.targetValue);
        }

        challenge.date = today.toISOString().split('T')[0];
        return challenge;
    }

    /**
     * Get weekly challenge based on week number
     */
    getWeeklyChallenge() {
        const today = new Date();
        const weekNumber = Math.ceil((today - new Date(today.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
        const challengeIndex = weekNumber % WEEKLY_CHALLENGES.length;
        
        return { ...WEEKLY_CHALLENGES[challengeIndex], week: weekNumber };
    }

    /**
     * Clean up mode resources
     */
    cleanup() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
}

export default GameModeManager;
