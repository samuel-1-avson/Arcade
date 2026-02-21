/**
 * Rhythm Game - Game Modes System
 * Multiple game modes: Arcade, Story, Practice, Endless, Challenge, Zen
 */

// Game Mode Types
export const GameModeType = {
    ARCADE: 'arcade',
    STORY: 'story',
    PRACTICE: 'practice',
    ENDLESS: 'endless',
    CHALLENGE: 'challenge',
    ZEN: 'zen'
};

// Mode Configuration
export const MODE_CONFIG = {
    [GameModeType.ARCADE]: {
        name: 'Arcade',
        icon: '🎮',
        description: 'Play any unlocked song freely',
        unlocked: true,
        color: '#60a5fa'
    },
    [GameModeType.STORY]: {
        name: 'Story',
        icon: '📖',
        description: 'Campaign mode with 20 levels',
        unlocked: true,
        color: '#a855f7'
    },
    [GameModeType.PRACTICE]: {
        name: 'Practice',
        icon: '🎯',
        description: 'Slow down, no-fail practice',
        unlocked: true,
        color: '#4ade80'
    },
    [GameModeType.ENDLESS]: {
        name: 'Endless',
        icon: '∞',
        description: 'Marathon of increasing difficulty',
        unlocked: false,
        unlockCondition: 'Complete 5 songs in Arcade',
        color: '#f97316'
    },
    [GameModeType.CHALLENGE]: {
        name: 'Challenge',
        icon: '🏆',
        description: 'Daily challenges with modifiers',
        unlocked: false,
        unlockCondition: 'Complete Story Chapter 1',
        color: '#eab308'
    },
    [GameModeType.ZEN]: {
        name: 'Zen',
        icon: '🧘',
        description: 'Relaxed play, no misses counted',
        unlocked: true,
        color: '#06b6d4'
    }
};

/**
 * Base Game Mode Class
 */
export class GameMode {
    constructor(game) {
        this.game = game;
        this.type = GameModeType.ARCADE;
        this.isActive = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.stats = {};
    }
    
    initialize(songId) {
        this.isActive = true;
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.stats = {
            notesHit: 0,
            notesMissed: 0,
            perfectHits: 0,
            goodHits: 0,
            okHits: 0,
            maxCombo: 0,
            holdsCompleted: 0,
            slidesCompleted: 0
        };
    }
    
    update(dt) {
        if (this.isActive) {
            this.elapsedTime = Date.now() - this.startTime;
        }
    }
    
    onNoteHit(hitType, noteType) {
        this.stats.notesHit++;
        if (hitType === 'perfect') this.stats.perfectHits++;
        else if (hitType === 'good') this.stats.goodHits++;
        else if (hitType === 'ok') this.stats.okHits++;
        
        if (noteType === 'hold') this.stats.holdsCompleted++;
        else if (noteType === 'slide') this.stats.slidesCompleted++;
    }
    
    onNoteMiss() {
        this.stats.notesMissed++;
    }
    
    onCombo(combo) {
        if (combo > this.stats.maxCombo) {
            this.stats.maxCombo = combo;
        }
    }
    
    checkEndCondition() {
        return false; // Override in subclasses
    }
    
    getStats() {
        return { ...this.stats };
    }
    
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    getSpeedMultiplier() {
        return 1.0;
    }
    
    shouldCountMiss() {
        return true;
    }
    
    end() {
        this.isActive = false;
    }
}

/**
 * Arcade Mode - Free play any unlocked song
 */
export class ArcadeMode extends GameMode {
    constructor(game) {
        super(game);
        this.type = GameModeType.ARCADE;
        this.selectedSong = null;
    }
    
    initialize(songId) {
        super.initialize(songId);
        this.selectedSong = songId;
    }
    
    checkEndCondition() {
        // Song complete is handled by the main game
        return false;
    }
}

/**
 * Story Mode - Campaign progression
 */
export class StoryMode extends GameMode {
    constructor(game, storyManager) {
        super(game);
        this.type = GameModeType.STORY;
        this.storyManager = storyManager;
        this.currentLevel = null;
    }
    
    initialize(levelId) {
        const level = this.storyManager.startLevel(levelId);
        if (level) {
            super.initialize(level.songId);
            this.currentLevel = level;
        }
        return level;
    }
    
    getSpeedMultiplier() {
        if (this.currentLevel?.modifiers?.speed) {
            return this.currentLevel.modifiers.speed;
        }
        return 1.0;
    }
    
    checkEndCondition() {
        // Story levels have specific goals, checked in complete()
        return false;
    }
    
    getGoalProgress() {
        if (!this.currentLevel) return null;
        
        const goal = this.currentLevel.goal;
        let current = 0;
        let target = goal.target;
        
        switch (goal.type) {
            case 'notes':
                current = this.stats.notesHit;
                break;
            case 'accuracy':
                current = this.getAccuracy();
                break;
            case 'combo':
                current = this.stats.maxCombo;
                break;
            case 'score':
                current = this.game.score;
                break;
            case 'holds':
                current = this.stats.holdsCompleted;
                break;
            case 'slides':
                current = this.stats.slidesCompleted;
                break;
            case 'perfects':
                current = this.stats.perfectHits;
                break;
            case 'maxMiss':
                current = this.stats.notesMissed;
                break;
            default:
                current = 0;
        }
        
        return { current, target, type: goal.type };
    }
    
    getAccuracy() {
        const total = this.stats.notesHit + this.stats.notesMissed;
        if (total === 0) return 100;
        return Math.round((this.stats.notesHit / total) * 100);
    }
}

/**
 * Practice Mode - Slow down, no-fail
 */
export class PracticeMode extends GameMode {
    constructor(game) {
        super(game);
        this.type = GameModeType.PRACTICE;
        this.speedMultiplier = 0.7;
        this.loopEnabled = false;
        this.loopStart = 0;
        this.loopEnd = 0;
    }
    
    initialize(songId) {
        super.initialize(songId);
    }
    
    setSpeed(multiplier) {
        this.speedMultiplier = Math.max(0.3, Math.min(1.0, multiplier));
    }
    
    setLoop(start, end) {
        this.loopEnabled = true;
        this.loopStart = start;
        this.loopEnd = end;
    }
    
    clearLoop() {
        this.loopEnabled = false;
    }
    
    getSpeedMultiplier() {
        return this.speedMultiplier;
    }
    
    shouldCountMiss() {
        return false; // No-fail mode
    }
}

/**
 * Endless Mode - Marathon with increasing difficulty
 */
export class EndlessMode extends GameMode {
    constructor(game) {
        super(game);
        this.type = GameModeType.ENDLESS;
        this.songsPlayed = 0;
        this.speedMultiplier = 1.0;
        this.lives = 5;
    }
    
    initialize(songId) {
        super.initialize(songId);
        this.songsPlayed = 0;
        this.speedMultiplier = 1.0;
        this.lives = 5;
    }
    
    onSongComplete() {
        this.songsPlayed++;
        // Increase speed every 2 songs
        if (this.songsPlayed % 2 === 0) {
            this.speedMultiplier = Math.min(2.0, this.speedMultiplier + 0.1);
        }
    }
    
    onNoteMiss() {
        super.onNoteMiss();
        this.lives--;
    }
    
    getSpeedMultiplier() {
        return this.speedMultiplier;
    }
    
    checkEndCondition() {
        return this.lives <= 0;
    }
    
    getStats() {
        return {
            ...super.getStats(),
            songsPlayed: this.songsPlayed,
            lives: this.lives
        };
    }
}

/**
 * Challenge Mode - Daily challenges with modifiers
 */
export class ChallengeMode extends GameMode {
    constructor(game) {
        super(game);
        this.type = GameModeType.CHALLENGE;
        this.challenge = null;
        this.modifiers = [];
    }
    
    initialize(songId) {
        super.initialize(songId);
        this.challenge = this.generateDailyChallenge();
    }
    
    generateDailyChallenge() {
        // Generate challenge based on date
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        
        const challenges = [
            { name: 'Perfect Hunter', goal: 'perfects', target: 30, modifiers: ['strict'] },
            { name: 'Speed Demon', goal: 'accuracy', target: 80, modifiers: ['fast'] },
            { name: 'Combo Master', goal: 'combo', target: 40, modifiers: ['noMiss'] },
            { name: 'Score Attack', goal: 'score', target: 3000, modifiers: ['hidden'] },
            { name: 'Endurance Run', goal: 'complete', target: 100, modifiers: ['marathon'] },
            { name: 'Precision Strike', goal: 'accuracy', target: 95, modifiers: ['slow'] },
            { name: 'No Miss Challenge', goal: 'maxMiss', target: 0, modifiers: ['strict'] }
        ];
        
        const index = seed % challenges.length;
        const challenge = challenges[index];
        
        this.modifiers = challenge.modifiers;
        return challenge;
    }
    
    getSpeedMultiplier() {
        if (this.modifiers.includes('fast')) return 1.3;
        if (this.modifiers.includes('slow')) return 0.8;
        return 1.0;
    }
    
    shouldCountMiss() {
        return !this.modifiers.includes('noMiss');
    }
    
    getChallengeInfo() {
        return this.challenge;
    }
}

/**
 * Zen Mode - Relaxed experience, no misses
 */
export class ZenMode extends GameMode {
    constructor(game) {
        super(game);
        this.type = GameModeType.ZEN;
    }
    
    initialize(songId) {
        super.initialize(songId);
    }
    
    shouldCountMiss() {
        return false;
    }
    
    onNoteMiss() {
        // Don't track misses in Zen mode
    }
}

/**
 * Game Mode Manager
 */
export class GameModeManager {
    constructor(game) {
        this.game = game;
        this.currentMode = null;
        this.modeConfigs = { ...MODE_CONFIG };
        this.loadUnlocks();
    }
    
    /**
     * Create a mode instance
     */
    createMode(type, storyManager = null) {
        switch (type) {
            case GameModeType.ARCADE:
                return new ArcadeMode(this.game);
            case GameModeType.STORY:
                return new StoryMode(this.game, storyManager);
            case GameModeType.PRACTICE:
                return new PracticeMode(this.game);
            case GameModeType.ENDLESS:
                return new EndlessMode(this.game);
            case GameModeType.CHALLENGE:
                return new ChallengeMode(this.game);
            case GameModeType.ZEN:
                return new ZenMode(this.game);
            default:
                return new ArcadeMode(this.game);
        }
    }
    
    /**
     * Set current mode
     */
    setMode(type, storyManager = null) {
        if (this.currentMode) {
            this.currentMode.end();
        }
        this.currentMode = this.createMode(type, storyManager);
        return this.currentMode;
    }
    
    /**
     * Get current mode
     */
    getMode() {
        return this.currentMode;
    }
    
    /**
     * Check if mode is unlocked
     */
    isModeUnlocked(type) {
        return this.modeConfigs[type]?.unlocked || false;
    }
    
    /**
     * Unlock a mode
     */
    unlockMode(type) {
        if (this.modeConfigs[type]) {
            this.modeConfigs[type].unlocked = true;
            this.saveUnlocks();
        }
    }
    
    /**
     * Get all mode configs
     */
    getAllModes() {
        return Object.entries(this.modeConfigs).map(([type, config]) => ({
            type,
            ...config
        }));
    }
    
    /**
     * Load mode unlocks from storage
     */
    loadUnlocks() {
        try {
            const saved = localStorage.getItem('rhythm_mode_unlocks');
            if (saved) {
                const unlocks = JSON.parse(saved);
                unlocks.forEach(type => {
                    if (this.modeConfigs[type]) {
                        this.modeConfigs[type].unlocked = true;
                    }
                });
            }
        } catch (e) {
            console.warn('Failed to load mode unlocks:', e);
        }
    }
    
    /**
     * Save mode unlocks to storage
     */
    saveUnlocks() {
        try {
            const unlocks = Object.entries(this.modeConfigs)
                .filter(([_, config]) => config.unlocked)
                .map(([type]) => type);
            localStorage.setItem('rhythm_mode_unlocks', JSON.stringify(unlocks));
        } catch (e) {
            console.warn('Failed to save mode unlocks:', e);
        }
    }
    
    /**
     * Check and unlock modes based on progress
     */
    checkUnlocks(arcadeClears, storyProgress) {
        // Unlock Endless after 5 arcade clears
        if (arcadeClears >= 5 && !this.modeConfigs[GameModeType.ENDLESS].unlocked) {
            this.unlockMode(GameModeType.ENDLESS);
        }
        
        // Unlock Challenge after completing Story Chapter 1
        if (storyProgress?.unlockedChapters?.includes(2) && 
            !this.modeConfigs[GameModeType.CHALLENGE].unlocked) {
            this.unlockMode(GameModeType.CHALLENGE);
        }
    }
}

export default GameModeManager;
