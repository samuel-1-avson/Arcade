/**
 * Tetris Story Mode
 * Campaign with 20 levels, narrative, and boss battles
 */

// Story narrative text
const STORY_NARRATIVE = {
    intro: {
        title: "The Block Kingdom",
        text: "In a world where order brings peace, chaos has descended from the sky. Blocks of all shapes rain down upon the kingdom. Only you, the Keeper of Order, can arrange them and restore balance..."
    },
    chapter1: {
        title: "Chapter 1: The Awakening",
        text: "The first blocks have begun to fall. Master the basics and prove your worth as the chosen one."
    },
    chapter2: {
        title: "Chapter 2: Rising Challenge",
        text: "The pace quickens. The forces of chaos grow stronger. Adapt or be overwhelmed."
    },
    chapter3: {
        title: "Chapter 3: The Puzzle Trials",
        text: "Ancient puzzles block your path. Use strategy over speed to overcome these trials."
    },
    chapter4: {
        title: "Chapter 4: The Final Battle",
        text: "The Chaos Lord sends endless waves of garbage. Only perfect play can defeat this ultimate challenge."
    },
    victory: {
        title: "Victory!",
        text: "Order has been restored to the Block Kingdom. You are the true Master of Tetris!"
    }
};

// Level Definitions
export const STORY_LEVELS = [
    // Chapter 1: Tutorial (Levels 1-5)
    {
        id: 1,
        chapter: 1,
        name: "First Steps",
        description: "Clear 5 lines to complete",
        goal: { type: 'lines', target: 5 },
        startLevel: 1,
        timeLimit: null,
        presetGrid: null,
        modifiers: {},
        dialogue: {
            start: "Welcome, Keeper. Stack the blocks and clear lines to begin your journey.",
            complete: "Excellent! You show promise."
        },
        stars: { one: 5, two: 5, three: 5 } // Lines needed for stars (cumulative for 'lines' type)
    },
    {
        id: 2,
        chapter: 1,
        name: "Building Speed",
        description: "Clear 10 lines",
        goal: { type: 'lines', target: 10 },
        startLevel: 2,
        timeLimit: null,
        presetGrid: null,
        modifiers: {},
        dialogue: {
            start: "The blocks fall faster now. Stay focused.",
            complete: "Your skills grow stronger."
        },
        stars: { one: 10, two: 10, three: 10 }
    },
    {
        id: 3,
        chapter: 1,
        name: "First Tetris",
        description: "Get your first Tetris (4-line clear)",
        goal: { type: 'tetrises', target: 1 },
        startLevel: 1,
        timeLimit: 180000, // 3 minutes
        presetGrid: null,
        modifiers: {},
        dialogue: {
            start: "The I-piece is your greatest ally. Use it wisely to clear four lines at once.",
            complete: "A true Tetris! The I-piece serves you well."
        },
        stars: { one: 1, two: 2, three: 3 }
    },
    {
        id: 4,
        chapter: 1,
        name: "Combo Training",
        description: "Achieve a 3x combo",
        goal: { type: 'combo', target: 3 },
        startLevel: 1,
        timeLimit: 120000,
        presetGrid: null,
        modifiers: {},
        dialogue: {
            start: "Clear lines consecutively to build combos. Chain your clears!",
            complete: "You understand the power of combos."
        },
        stars: { one: 3, two: 5, three: 8 }
    },
    {
        id: 5,
        chapter: 1,
        name: "Chapter 1 Boss: The Stack",
        description: "Clear 20 lines in 2 minutes",
        goal: { type: 'lines', target: 20 },
        startLevel: 3,
        timeLimit: 120000,
        isBoss: true,
        presetGrid: null,
        modifiers: { speedMultiplier: 1.2 },
        dialogue: {
            start: "Your first true test. The Stack defends the path forward!",
            complete: "The Stack crumbles! Chapter 1 complete."
        },
        stars: { one: 20, two: 25, three: 30 }
    },

    // Chapter 2: Rising Challenge (Levels 6-10)
    {
        id: 6,
        chapter: 2,
        name: "Speed Demon",
        description: "Clear 15 lines at level 5 speed",
        goal: { type: 'lines', target: 15 },
        startLevel: 5,
        timeLimit: null,
        presetGrid: null,
        modifiers: {},
        dialogue: {
            start: "Chaos accelerates. Match its pace!",
            complete: "Speed is now your ally."
        },
        stars: { one: 15, two: 20, three: 25 }
    },
    {
        id: 7,
        chapter: 2,
        name: "Score Hunter",
        description: "Score 5,000 points",
        goal: { type: 'score', target: 5000 },
        startLevel: 3,
        timeLimit: 180000,
        presetGrid: null,
        modifiers: {},
        dialogue: {
            start: "Points reflect your mastery. Aim high!",
            complete: "A respectable score indeed."
        },
        stars: { one: 5000, two: 7500, three: 10000 }
    },
    {
        id: 8,
        chapter: 2,
        name: "The Hold Master",
        description: "Use hold 10 times and clear 15 lines",
        goal: { type: 'lines', target: 15, holdUses: 10 },
        startLevel: 2,
        timeLimit: null,
        presetGrid: null,
        modifiers: { trackHolds: true },
        dialogue: {
            start: "The hold ability lets you save pieces for later. Master it!",
            complete: "Hold mastery achieved."
        },
        stars: { one: 15, two: 20, three: 25 }
    },
    {
        id: 9,
        chapter: 2,
        name: "Back-to-Back",
        description: "Get 2 Tetrises in a row",
        goal: { type: 'backToBack', target: 1 },
        startLevel: 2,
        timeLimit: 240000,
        presetGrid: null,
        modifiers: {},
        dialogue: {
            start: "Chain Tetrises together for massive bonuses!",
            complete: "The back-to-back technique is yours!"
        },
        stars: { one: 1, two: 2, three: 3 }
    },
    {
        id: 10,
        chapter: 2,
        name: "Chapter 2 Boss: The Accelerator",
        description: "Survive 3 minutes as speed increases",
        goal: { type: 'survive', target: 180000 },
        startLevel: 3,
        isBoss: true,
        presetGrid: null,
        modifiers: { speedIncrease: true, speedIncreaseRate: 30000 },
        dialogue: {
            start: "The Accelerator never stops! How long can you endure?",
            complete: "The Accelerator is defeated! Chapter 2 complete."
        },
        stars: { one: 180000, two: 240000, three: 300000 }
    },

    // Chapter 3: Puzzle Trials (Levels 11-15)
    {
        id: 11,
        chapter: 3,
        name: "The Gap",
        description: "Clear the preset blocks in 30 moves",
        goal: { type: 'clearPreset', moveLimit: 30 },
        startLevel: 1,
        timeLimit: null,
        presetGrid: generateGapPuzzle(),
        modifiers: { limitedMoves: true },
        dialogue: {
            start: "The ancient puzzles test your mind, not your speed.",
            complete: "The gap is filled!"
        },
        stars: { one: 30, two: 20, three: 15 } // Fewer moves = better
    },
    {
        id: 12,
        chapter: 3,
        name: "The Tower",
        description: "Clear 4 lines with only T-pieces",
        goal: { type: 'lines', target: 4 },
        startLevel: 1,
        timeLimit: 120000,
        presetGrid: null,
        modifiers: { pieceFilter: ['T'] },
        dialogue: {
            start: "Only T-pieces shall fall. Make do with what you have.",
            complete: "The T is your friend!"
        },
        stars: { one: 4, two: 6, three: 8 }
    },
    {
        id: 13,
        chapter: 3,
        name: "Limited Hold",
        description: "Clear 15 lines with no hold ability",
        goal: { type: 'lines', target: 15 },
        startLevel: 3,
        timeLimit: null,
        presetGrid: null,
        modifiers: { disableHold: true },
        dialogue: {
            start: "Your safety net is gone. Adapt to each piece as it comes.",
            complete: "True skill needs no crutches!"
        },
        stars: { one: 15, two: 20, three: 30 }
    },
    {
        id: 14,
        chapter: 3,
        name: "Invisible Mode",
        description: "Clear 10 lines - pieces become invisible after landing",
        goal: { type: 'lines', target: 10 },
        startLevel: 2,
        timeLimit: 180000,
        presetGrid: null,
        modifiers: { invisible: true },
        dialogue: {
            start: "Your memory shall be tested. Remember where each piece lies.",
            complete: "You see with more than your eyes!"
        },
        stars: { one: 10, two: 15, three: 20 }
    },
    {
        id: 15,
        chapter: 3,
        name: "Chapter 3 Boss: The Maze Master",
        description: "Navigate the preset maze and clear 10 lines",
        goal: { type: 'lines', target: 10 },
        startLevel: 4,
        isBoss: true,
        presetGrid: generateMazePuzzle(),
        modifiers: {},
        dialogue: {
            start: "The Maze Master's puzzle awaits. Thread carefully!",
            complete: "The maze crumbles! Chapter 3 complete."
        },
        stars: { one: 10, two: 15, three: 20 }
    },

    // Chapter 4: Final Battle (Levels 16-20)
    {
        id: 16,
        chapter: 4,
        name: "Garbage Training",
        description: "Clear 10 garbage rows",
        goal: { type: 'clearGarbage', target: 10 },
        startLevel: 3,
        timeLimit: null,
        presetGrid: null,
        modifiers: { garbageRows: 5, garbageInterval: 15000 },
        dialogue: {
            start: "Garbage rises from below. Learn to clear it quickly!",
            complete: "You've mastered garbage clearing!"
        },
        stars: { one: 10, two: 15, three: 20 }
    },
    {
        id: 17,
        chapter: 4,
        name: "Endurance",
        description: "Survive 5 minutes with rising garbage",
        goal: { type: 'survive', target: 300000 },
        startLevel: 4,
        timeLimit: null,
        presetGrid: null,
        modifiers: { garbageRows: 0, garbageInterval: 10000 },
        dialogue: {
            start: "The onslaught begins. Endure!",
            complete: "Your endurance is legendary!"
        },
        stars: { one: 300000, two: 360000, three: 420000 }
    },
    {
        id: 18,
        chapter: 4,
        name: "Score Attack Extreme",
        description: "Score 20,000 points in 3 minutes",
        goal: { type: 'score', target: 20000 },
        startLevel: 5,
        timeLimit: 180000,
        presetGrid: null,
        modifiers: { speedMultiplier: 1.3 },
        dialogue: {
            start: "Every point counts. Go for the high score!",
            complete: "An impressive display of skill!"
        },
        stars: { one: 20000, two: 30000, three: 50000 }
    },
    {
        id: 19,
        chapter: 4,
        name: "Perfect Clear Challenge",
        description: "Achieve a perfect clear (empty board)",
        goal: { type: 'perfectClear', target: 1 },
        startLevel: 1,
        timeLimit: 300000,
        presetGrid: null,
        modifiers: {},
        dialogue: {
            start: "The ultimate feat: clear every single block from the board.",
            complete: "PERFECT! You have achieved true mastery!"
        },
        stars: { one: 1, two: 2, three: 3 }
    },
    {
        id: 20,
        chapter: 4,
        name: "Final Boss: The Chaos Lord",
        description: "Survive the endless assault and score 50,000",
        goal: { type: 'score', target: 50000 },
        startLevel: 5,
        isBoss: true,
        presetGrid: null,
        modifiers: { 
            garbageInterval: 8000,
            speedIncrease: true,
            speedIncreaseRate: 20000,
            speedMultiplier: 1.2
        },
        dialogue: {
            start: "The Chaos Lord sends everything at you! This is the final test!",
            complete: "The Chaos Lord is vanquished! You are the true TETRIS MASTER!"
        },
        stars: { one: 50000, two: 75000, three: 100000 }
    }
];

// Helper functions for preset grids
function generateGapPuzzle() {
    const grid = Array(20).fill(null).map(() => Array(10).fill(null));
    
    // Create a pattern with gaps
    for (let y = 15; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            if ((x + y) % 3 !== 0) {
                grid[y][x] = '#555555';
            }
        }
    }
    
    return grid;
}

function generateMazePuzzle() {
    const grid = Array(20).fill(null).map(() => Array(10).fill(null));
    
    // Create maze-like pattern
    for (let y = 10; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            // Checkerboard with corridors
            if (y % 2 === 0 && x !== 4 && x !== 5) {
                grid[y][x] = '#555555';
            }
            if (y % 2 === 1 && (x === 0 || x === 9)) {
                grid[y][x] = '#555555';
            }
        }
    }
    
    return grid;
}

/**
 * Story Mode Progress Tracker
 */
export class StoryProgress {
    constructor() {
        this.completedLevels = new Set();
        this.levelStars = {};
        this.currentChapter = 1;
        this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem('tetris_story_progress');
            if (saved) {
                const data = JSON.parse(saved);
                this.completedLevels = new Set(data.completedLevels || []);
                this.levelStars = data.levelStars || {};
                this.currentChapter = data.currentChapter || 1;
            }
        } catch (e) {
            console.warn('Failed to load story progress:', e);
        }
    }

    save() {
        try {
            localStorage.setItem('tetris_story_progress', JSON.stringify({
                completedLevels: [...this.completedLevels],
                levelStars: this.levelStars,
                currentChapter: this.currentChapter
            }));
        } catch (e) {
            console.warn('Failed to save story progress:', e);
        }
    }

    completeLevel(levelId, stars) {
        this.completedLevels.add(levelId);
        const currentStars = this.levelStars[levelId] || 0;
        this.levelStars[levelId] = Math.max(currentStars, stars);
        
        // Update current chapter
        const level = STORY_LEVELS.find(l => l.id === levelId);
        if (level && level.chapter >= this.currentChapter) {
            // Check if boss level completed
            if (level.isBoss) {
                this.currentChapter = level.chapter + 1;
            }
        }
        
        this.save();
    }

    isLevelUnlocked(levelId) {
        if (levelId === 1) return true;
        
        // Must complete previous level
        return this.completedLevels.has(levelId - 1);
    }

    getStars(levelId) {
        return this.levelStars[levelId] || 0;
    }

    getTotalStars() {
        return Object.values(this.levelStars).reduce((sum, stars) => sum + stars, 0);
    }

    getMaxStars() {
        return STORY_LEVELS.length * 3;
    }

    getProgress() {
        return {
            completed: this.completedLevels.size,
            total: STORY_LEVELS.length,
            stars: this.getTotalStars(),
            maxStars: this.getMaxStars(),
            currentChapter: this.currentChapter
        };
    }
}

/**
 * Story Mode Manager
 */
export class StoryMode {
    constructor(game) {
        this.game = game;
        this.progress = new StoryProgress();
        this.currentLevel = null;
        this.levelState = null;
        this.dialogueQueue = [];
        this.showingDialogue = false;
    }

    getLevels() {
        return STORY_LEVELS.map(level => ({
            ...level,
            unlocked: this.progress.isLevelUnlocked(level.id),
            stars: this.progress.getStars(level.id),
            completed: this.progress.completedLevels.has(level.id)
        }));
    }

    getLevelsByChapter(chapter) {
        return this.getLevels().filter(l => l.chapter === chapter);
    }

    getChapters() {
        const chapters = [];
        for (let i = 1; i <= 4; i++) {
            const narrative = STORY_NARRATIVE[`chapter${i}`];
            const levels = this.getLevelsByChapter(i);
            chapters.push({
                number: i,
                title: narrative.title,
                text: narrative.text,
                levels,
                unlocked: levels.some(l => l.unlocked),
                completed: levels.every(l => l.completed)
            });
        }
        return chapters;
    }

    startLevel(levelId) {
        const level = STORY_LEVELS.find(l => l.id === levelId);
        if (!level) return false;
        
        if (!this.progress.isLevelUnlocked(levelId)) {
            console.warn('Level not unlocked:', levelId);
            return false;
        }

        this.currentLevel = level;
        this.levelState = this.createLevelState(level);

        // Show start dialogue
        if (level.dialogue?.start) {
            this.showDialogue(level.dialogue.start);
        }

        // Apply level settings
        this.applyLevelSettings(level);

        return true;
    }

    createLevelState(level) {
        return {
            startTime: performance.now(),
            elapsedTime: 0,
            linesCleared: 0,
            tetrises: 0,
            score: 0,
            combo: 0,
            maxCombo: 0,
            backToBack: 0,
            perfectClears: 0,
            holdUses: 0,
            piecesPlaced: 0,
            garbageCleared: 0,
            movesUsed: 0,
            completed: false,
            failed: false
        };
    }

    applyLevelSettings(level) {
        // Set starting level
        this.game.level = level.startLevel;
        this.game.updateDropInterval();

        // Apply preset grid if exists
        if (level.presetGrid) {
            this.game.grid = level.presetGrid.map(row => [...row]);
        }

        // Apply modifiers
        if (level.modifiers) {
            if (level.modifiers.disableHold) {
                this.game.holdDisabled = true;
            }
            if (level.modifiers.speedMultiplier) {
                this.game.dropInterval *= (1 / level.modifiers.speedMultiplier);
            }
            if (level.modifiers.invisible) {
                this.game.invisibleMode = true;
            }
            if (level.modifiers.pieceFilter) {
                this.game.pieceFilter = level.modifiers.pieceFilter;
            }
            if (level.modifiers.garbageRows) {
                this.addInitialGarbage(level.modifiers.garbageRows);
            }
        }
    }

    addInitialGarbage(rows) {
        for (let i = 0; i < rows; i++) {
            const holePosition = Math.floor(Math.random() * 10);
            const garbageRow = Array(10).fill('#555555');
            garbageRow[holePosition] = null;
            
            this.game.grid.pop();
            this.game.grid.unshift(Array(10).fill(null));
            this.game.grid[this.game.grid.length - 1 - i] = garbageRow;
        }
    }

    update(dt) {
        if (!this.currentLevel || !this.levelState) return;
        if (this.levelState.completed || this.levelState.failed) return;

        this.levelState.elapsedTime = performance.now() - this.levelState.startTime;

        // Check time limit
        if (this.currentLevel.timeLimit) {
            if (this.levelState.elapsedTime >= this.currentLevel.timeLimit) {
                this.failLevel('Time\'s up!');
                return;
            }
        }

        // Check goal completion
        if (this.checkGoalMet()) {
            this.completeLevel();
        }

        // Handle garbage spawn
        if (this.currentLevel.modifiers?.garbageInterval) {
            const interval = this.currentLevel.modifiers.garbageInterval;
            const garbageCount = Math.floor(this.levelState.elapsedTime / interval);
            const previousCount = Math.floor((this.levelState.elapsedTime - dt * 1000) / interval);
            
            if (garbageCount > previousCount) {
                this.spawnGarbageRow();
            }
        }

        // Handle speed increase
        if (this.currentLevel.modifiers?.speedIncrease) {
            const rate = this.currentLevel.modifiers.speedIncreaseRate;
            const speedLevel = Math.floor(this.levelState.elapsedTime / rate) + 1;
            this.game.level = this.currentLevel.startLevel + speedLevel - 1;
            this.game.updateDropInterval();
        }
    }

    checkGoalMet() {
        const goal = this.currentLevel.goal;
        const state = this.levelState;

        switch (goal.type) {
            case 'lines':
                return state.linesCleared >= goal.target;
            case 'tetrises':
                return state.tetrises >= goal.target;
            case 'score':
                return state.score >= goal.target;
            case 'combo':
                return state.maxCombo >= goal.target;
            case 'backToBack':
                return state.backToBack >= goal.target;
            case 'survive':
                return state.elapsedTime >= goal.target;
            case 'perfectClear':
                return state.perfectClears >= goal.target;
            case 'clearPreset':
                return this.isPresetCleared();
            case 'clearGarbage':
                return state.garbageCleared >= goal.target;
            default:
                return false;
        }
    }

    isPresetCleared() {
        // Check if all preset blocks are cleared
        return this.game.grid.every(row => 
            row.every(cell => cell === null || cell === '#555555')
        );
    }

    spawnGarbageRow() {
        const grid = this.game.grid;
        
        // Check if top row has blocks
        if (grid[0].some(cell => cell !== null)) {
            this.failLevel('Board full!');
            return;
        }

        // Shift all rows up
        grid.shift();
        
        // Add garbage row
        const holePosition = Math.floor(Math.random() * 10);
        const garbageRow = Array(10).fill('#555555');
        garbageRow[holePosition] = null;
        grid.push(garbageRow);
    }

    onLineClear(lineCount) {
        if (!this.levelState) return;
        
        this.levelState.linesCleared += lineCount;
        if (lineCount === 4) {
            this.levelState.tetrises++;
        }
    }

    onScore(points) {
        if (!this.levelState) return;
        this.levelState.score += points;
    }

    onCombo(combo) {
        if (!this.levelState) return;
        this.levelState.combo = combo;
        this.levelState.maxCombo = Math.max(this.levelState.maxCombo, combo);
    }

    onBackToBack() {
        if (!this.levelState) return;
        this.levelState.backToBack++;
    }

    onPerfectClear() {
        if (!this.levelState) return;
        this.levelState.perfectClears++;
    }

    onHoldUse() {
        if (!this.levelState) return;
        this.levelState.holdUses++;
    }

    onPiecePlaced() {
        if (!this.levelState) return;
        this.levelState.piecesPlaced++;
        this.levelState.movesUsed++;

        // Check move limit
        if (this.currentLevel.modifiers?.limitedMoves) {
            if (this.levelState.movesUsed >= this.currentLevel.goal.moveLimit) {
                if (!this.checkGoalMet()) {
                    this.failLevel('Out of moves!');
                }
            }
        }
    }

    onGarbageClear() {
        if (!this.levelState) return;
        this.levelState.garbageCleared++;
    }

    calculateStars() {
        const level = this.currentLevel;
        const state = this.levelState;
        const stars = level.stars;

        let value;
        switch (level.goal.type) {
            case 'lines':
            case 'tetrises':
            case 'score':
            case 'combo':
            case 'backToBack':
            case 'perfectClear':
            case 'clearGarbage':
                value = this.getGoalValue();
                break;
            case 'survive':
                value = state.elapsedTime;
                break;
            case 'clearPreset':
                value = state.movesUsed;
                // For move-based: lower is better
                if (value <= stars.three) return 3;
                if (value <= stars.two) return 2;
                if (value <= stars.one) return 1;
                return 1;
            default:
                value = 0;
        }

        // Higher is better
        if (value >= stars.three) return 3;
        if (value >= stars.two) return 2;
        if (value >= stars.one) return 1;
        return 1;
    }

    getGoalValue() {
        const goal = this.currentLevel.goal;
        const state = this.levelState;

        switch (goal.type) {
            case 'lines': return state.linesCleared;
            case 'tetrises': return state.tetrises;
            case 'score': return state.score;
            case 'combo': return state.maxCombo;
            case 'backToBack': return state.backToBack;
            case 'survive': return state.elapsedTime;
            case 'perfectClear': return state.perfectClears;
            case 'clearGarbage': return state.garbageCleared;
            default: return 0;
        }
    }

    completeLevel() {
        if (!this.currentLevel || !this.levelState) return;
        
        this.levelState.completed = true;
        const stars = this.calculateStars();
        
        this.progress.completeLevel(this.currentLevel.id, stars);

        // Show completion dialogue
        if (this.currentLevel.dialogue?.complete) {
            this.showDialogue(this.currentLevel.dialogue.complete);
        }

        // Callback to game
        this.game.onStoryLevelComplete?.({
            level: this.currentLevel,
            stars,
            state: this.levelState
        });
    }

    failLevel(reason = 'Game Over') {
        if (!this.currentLevel || !this.levelState) return;
        
        this.levelState.failed = true;

        this.game.onStoryLevelFailed?.({
            level: this.currentLevel,
            reason,
            state: this.levelState
        });
    }

    showDialogue(text) {
        this.game.onShowDialogue?.(text);
    }

    getProgress() {
        return this.progress.getProgress();
    }

    getCurrentLevelInfo() {
        if (!this.currentLevel) return null;
        
        return {
            level: this.currentLevel,
            state: this.levelState,
            goalProgress: this.getGoalProgress(),
            timeRemaining: this.getTimeRemaining()
        };
    }

    getGoalProgress() {
        if (!this.currentLevel || !this.levelState) return 0;
        
        const goal = this.currentLevel.goal;
        const current = this.getGoalValue();
        const target = goal.target || 1;
        
        return Math.min(1, current / target);
    }

    getTimeRemaining() {
        if (!this.currentLevel?.timeLimit) return null;
        return Math.max(0, this.currentLevel.timeLimit - this.levelState.elapsedTime);
    }

    reset() {
        this.currentLevel = null;
        this.levelState = null;
        
        // Reset game modifiers
        this.game.holdDisabled = false;
        this.game.invisibleMode = false;
        this.game.pieceFilter = null;
    }

    getNarrative() {
        return STORY_NARRATIVE;
    }

    /**
     * Render level HUD overlay
     */
    renderHUD(ctx, width, height) {
        if (!this.currentLevel || !this.levelState) return;

        ctx.save();

        // Goal progress bar
        const barWidth = 150;
        const barHeight = 12;
        const barX = width / 2 - barWidth / 2;
        const barY = 8;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 30);

        // Progress bar background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Progress bar fill
        const progress = this.getGoalProgress();
        ctx.fillStyle = progress >= 1 ? '#00ff00' : '#00ffff';
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);

        // Goal text
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(this.currentLevel.description, width / 2, barY + barHeight + 15);

        // Time remaining
        if (this.currentLevel.timeLimit) {
            const remaining = this.getTimeRemaining();
            const seconds = Math.ceil(remaining / 1000);
            ctx.fillStyle = seconds <= 10 ? '#ff0000' : '#ffffff';
            ctx.textAlign = 'right';
            ctx.fillText(`${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`, width - 10, barY + 10);
        }

        // Move counter for limited moves
        if (this.currentLevel.modifiers?.limitedMoves) {
            const remaining = this.currentLevel.goal.moveLimit - this.levelState.movesUsed;
            ctx.textAlign = 'left';
            ctx.fillStyle = remaining <= 5 ? '#ff0000' : '#ffffff';
            ctx.fillText(`Moves: ${remaining}`, 10, barY + 10);
        }

        ctx.restore();
    }
}
