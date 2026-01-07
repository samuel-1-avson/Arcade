/**
 * GlobalStateManager - Centralized State Management for Arcade Hub
 * Handles cross-game data, user profiles, and unified statistics
 * Syncs with StorageManager and Firebase for persistence
 */
import { eventBus, GameEvents } from '../engine/EventBus.js';
import { storageManager } from '../engine/StorageManager.js';

// Game IDs for tracking
export const GAME_IDS = [
    'snake', '2048', 'breakout', 'minesweeper',
    'tetris', 'pacman', 'asteroids', 'tower-defense', 'rhythm', 'roguelike', 'toonshooter'
];

// Player titles earned through achievements
export const PLAYER_TITLES = [
    { id: 'newcomer', name: 'Newcomer', requirement: { level: 1 }, color: '#808080' },
    { id: 'rookie', name: 'Rookie', requirement: { level: 5 }, color: '#00ff88' },
    { id: 'player', name: 'Player', requirement: { level: 10 }, color: '#00ffff' },
    { id: 'gamer', name: 'Gamer', requirement: { level: 20 }, color: '#ff00ff' },
    { id: 'veteran', name: 'Veteran', requirement: { level: 35 }, color: '#ffaa00' },
    { id: 'expert', name: 'Expert', requirement: { level: 50 }, color: '#ff4444' },
    { id: 'master', name: 'Master', requirement: { level: 75 }, color: '#ff0000' },
    { id: 'legend', name: 'Legend', requirement: { level: 100 }, color: '#ffd700' },
    { id: 'mythic', name: 'Mythic', requirement: { achievements: 200 }, color: '#ff00ff' },
    { id: 'eternal', name: 'Eternal', requirement: { totalScore: 1000000 }, color: '#ffffff' }
];

// Avatar options as icon IDs
export const AVATAR_OPTIONS = [
    'user', 'gamepad', 'joystick', 'alien', 'robot', 'hero', 'wizard', 'ninja', 'dragon', 'fox',
    'snake', 'target', 'bomb', 'brick', 'castle', 'music', 'sword', 'meteor', 'dinosaur', 'ghost'
];

// Avatar SVG icon paths (stroke-based, 24x24 viewBox)
export const AVATAR_ICONS = {
    user: '<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>',
    gamepad: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M15 10v4M13 12h4"/>',
    joystick: '<path d="M12 14v7"/><path d="M8 21h8"/><circle cx="12" cy="9" r="5"/>',
    alien: '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><circle cx="8" cy="10" r="2"/><circle cx="16" cy="10" r="2"/><path d="M8 15c1 2 3 3 4 3s3-1 4-3"/>',
    robot: '<rect x="5" y="8" width="14" height="13" rx="2"/><rect x="8" y="2" width="8" height="6" rx="1"/><circle cx="9" cy="13" r="1.5"/><circle cx="15" cy="13" r="1.5"/><path d="M9 17h6"/>',
    hero: '<path d="M12 2L2 7l10 5 10-5z"/><path d="M12 12v10"/><path d="M20 7v10"/><path d="M4 7v10"/>',
    wizard: '<path d="M12 2l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6z"/>',
    ninja: '<circle cx="12" cy="12" r="10"/><path d="M4 12h16"/><circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/>',
    dragon: '<path d="M14 4l-4 4 4 4-4 4 4 4"/><path d="M18 4l-4 4 4 4-4 4 4 4"/><circle cx="8" cy="8" r="2"/>',
    fox: '<path d="M12 20c-4 0-8-4-8-8V6l4-4 4 6 4-6 4 4v6c0 4-4 8-8 8z"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><path d="M12 14v2"/>',
    snake: '<path d="M12 2c-5 0-8 4-8 8s3 8 8 8c2 0 4-1 5-2"/><circle cx="9" cy="8" r="1"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    bomb: '<circle cx="12" cy="14" r="8"/><path d="M12 6V2"/><path d="M8 2h8"/>',
    brick: '<rect x="1" y="4" width="22" height="16" rx="1"/><line x1="1" y1="10" x2="23" y2="10"/><line x1="1" y1="16" x2="23" y2="16"/><line x1="8" y1="4" x2="8" y2="10"/><line x1="16" y1="4" x2="16" y2="10"/><line x1="4" y1="10" x2="4" y2="16"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="20" y1="10" x2="20" y2="16"/>',
    castle: '<path d="M3 21h18"/><path d="M5 21V7l4-4v4h6V3l4 4v14"/><path d="M9 21v-6h6v6"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    sword: '<path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/>',
    meteor: '<path d="M4 4l16 16"/><circle cx="18" cy="18" r="4"/><path d="M2 8l2 2"/><path d="M6 2l2 2"/>',
    dinosaur: '<path d="M14 4c2 2 4 6 4 10v6h-4v-4h-4v4H6v-6c0-4 2-8 4-10"/><circle cx="10" cy="8" r="1"/>',
    ghost: '<path d="M12 2C7 2 3 6 3 11v11l3-3 3 3 3-3 3 3 3-3 3 3V11c0-5-4-9-9-9z"/><circle cx="9" cy="10" r="1.5"/><circle cx="15" cy="10" r="1.5"/>'
};

class GlobalStateManager {
    constructor() {
        // User profile data
        this.userProfile = {
            id: null,
            displayName: 'Player',
            avatar: 'gamepad',
            title: 'Newcomer',
            titleColor: '#808080',
            level: 1,
            xp: 0,
            totalAchievements: 0,
            favoriteGame: null,
            lastPlayed: null,
            createdAt: null,
            preferences: {
                soundEnabled: true,
                musicEnabled: true,
                notificationsEnabled: true,
                theme: 'neon'
            }
        };

        // Cross-game statistics
        this.statistics = {
            totalGamesPlayed: 0,
            totalPlayTime: 0,
            totalScore: 0,
            gamesCompleted: 0,
            perfectRuns: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastPlayDate: null,
            gameStats: {} // Per-game statistics
        };

        // Per-game achievement counts
        this.gameAchievements = {};

        // Per-game arbitrary save data
        this.gameSaves = {};

        // Cross-game Artifacts
        this.artifacts = [];

        // Callbacks for state changes
        this.onStateChange = null;
        this.onProfileUpdate = null;
        this.onStatsUpdate = null;

        // Initialize
        this._loadFromStorage();
        this._setupEventListeners();
    }

    // ============ INITIALIZATION ============

    /**
     * Initialize the global state manager
     * @param {string} userId - Optional Firebase user ID
     */
    async init(userId = null) {
        if (userId) {
            this.userProfile.id = userId;
        }

        // Sync with StorageManager for backward compatibility
        this._syncFromStorageManager();

        // Check for daily streak
        this._checkStreak();

        // Determine title based on achievements
        this._updateTitle();

        console.log('GlobalStateManager initialized:', this.userProfile.displayName);
        return true;
    }

    // ============ USER PROFILE ============

    /**
     * Get the current user profile
     * @returns {Object}
     */
    getProfile() {
        return { ...this.userProfile };
    }

    /**
     * Update user profile
     * @param {Object} updates - Partial profile updates
     * @param {boolean} silent - If true, skip emitting change events (to prevent sync loops)
     */
    updateProfile(updates, silent = false) {
        this.userProfile = {
            ...this.userProfile,
            ...updates
        };

        this._saveToStorage();
        
        // Only emit events if not a silent update
        if (!silent) {
            this._emitChange('profile', this.userProfile);

            if (this.onProfileUpdate) {
                this.onProfileUpdate(this.userProfile);
            }
        }
    }

    /**
     * Set display name
     * @param {string} name
     */
    setDisplayName(name) {
        if (name && name.trim().length > 0 && name.length <= 20) {
            this.updateProfile({ displayName: name.trim() });
        }
    }

    /**
     * Set avatar
     * @param {string} avatar - Emoji avatar
     */
    setAvatar(avatar) {
        if (AVATAR_OPTIONS.includes(avatar)) {
            this.updateProfile({ avatar });
        }
    }

    /**
     * Update preferences
     * @param {Object} prefs
     */
    setPreferences(prefs) {
        const newPrefs = {
            ...this.userProfile.preferences,
            ...prefs
        };
        this.userProfile.preferences = newPrefs;
        this._saveToStorage();
        
        // Emit specific preferences event to trigger cloud sync
        this._emitChange('preferences', newPrefs);
        
        if (this.onProfileUpdate) {
            this.onProfileUpdate(this.userProfile);
        }
    }

    // ============ STATISTICS ============

    /**
     * Get all statistics
     * @returns {Object}
     */
    getStatistics() {
        return { ...this.statistics };
    }

    /**
     * Get statistics for a specific game
     * @param {string} gameId
     * @returns {Object}
     */
    getGameStats(gameId) {
        return this.statistics.gameStats[gameId] || {
            played: 0,
            highScore: 0,
            totalScore: 0,
            playTime: 0,
            achievements: 0,
            perfectRuns: 0,
            lastPlayed: null
        };
    }

    /**
     * Update game statistics
     * @param {string} gameId
     * @param {Object} stats
     */
    updateGameStats(gameId, stats) {
        if (!GAME_IDS.includes(gameId)) {
            console.warn('Unknown game ID:', gameId);
            return;
        }

        const current = this.getGameStats(gameId);
        
        this.statistics.gameStats[gameId] = {
            ...current,
            ...stats,
            lastPlayed: Date.now()
        };

        // Update aggregate stats
        this._recalculateAggregates();
        this._saveToStorage();
        this._emitChange('stats', this.statistics);

        if (this.onStatsUpdate) {
            this.onStatsUpdate(this.statistics);
        }
    }

    /**
     * Record a game session
     * @param {string} gameId
     * @param {Object} sessionData - { score, duration, completed, perfect }
     */
    recordGameSession(gameId, sessionData) {
        const gameStats = this.getGameStats(gameId);
        
        // Update game-specific stats
        gameStats.played++;
        gameStats.totalScore += sessionData.score || 0;
        gameStats.playTime += sessionData.duration || 0;
        
        if (sessionData.score > gameStats.highScore) {
            gameStats.highScore = sessionData.score;
        }

        if (sessionData.completed) {
            this.statistics.gamesCompleted++;
        }

        if (sessionData.perfect) {
            gameStats.perfectRuns++;
            this.statistics.perfectRuns++;
        }

        // Update global stats
        this.statistics.totalGamesPlayed++;
        this.statistics.totalScore += sessionData.score || 0;
        this.statistics.totalPlayTime += sessionData.duration || 0;
        this.statistics.lastPlayDate = new Date().toDateString();

        // Update favorite game (most played)
        this._updateFavoriteGame();

        // Update profile
        this.userProfile.lastPlayed = gameId;

        // Save
        this.statistics.gameStats[gameId] = gameStats;
        this._saveToStorage();

        // Emit events
        this._emitChange('session', { gameId, sessionData });
        eventBus.emit('globalStateUpdate', { type: 'session', gameId, data: sessionData });
    }

    /**
     * Record an achievement unlock
     * @param {string} gameId
     * @param {string} achievementId
     * @param {number} xpReward
     */
    recordAchievement(gameId, achievementId, xpReward = 0) {
        // Update game achievement count
        if (!this.gameAchievements[gameId]) {
            this.gameAchievements[gameId] = [];
        }
        
        if (!this.gameAchievements[gameId].includes(achievementId)) {
            this.gameAchievements[gameId].push(achievementId);
            
            // Update game stats
            const gameStats = this.getGameStats(gameId);
            gameStats.achievements = this.gameAchievements[gameId].length;
            this.statistics.gameStats[gameId] = gameStats;

            // Update total achievements
            this.userProfile.totalAchievements = this._countTotalAchievements();

            // Add XP
            if (xpReward > 0) {
                this.addXP(xpReward);
            }

            // Update title if needed
            this._updateTitle();

            this._saveToStorage();
            this._emitChange('achievement', { gameId, achievementId });
        }
    }

    /**
     * Get games with achievements (for meta-achievement tracking)
     * @returns {number}
     */
    getGamesWithAchievements() {
        return Object.values(this.gameAchievements).filter(arr => arr.length > 0).length;
    }

    /**
     * Get games with N+ achievements
     * @param {number} minCount
     * @returns {number}
     */
    getGamesWithMinAchievements(minCount) {
        return Object.values(this.gameAchievements).filter(arr => arr.length >= minCount).length;
    }

    // ============ GAME SAVES ============

    /**
     * Save arbitrary game progress
     * @param {string} gameId
     * @param {Object} data
     */
    saveGameProgress(gameId, data) {
        if (!GAME_IDS.includes(gameId)) return;
        
        this.gameSaves[gameId] = data;
        this._saveToStorage();
        this._emitChange('save', { gameId, data });
    }

    /**
     * Get saved game progress
     * @param {string} gameId
     * @returns {Object|null}
     */
    getGameProgress(gameId) {
        return this.gameSaves[gameId] || null;
    }

    /**
     * Update game statistics (for cloud sync merging)
     * @param {Object} mergedStats - Merged gameStats from cloud sync
     * @param {boolean} silent - If true, skip emitting change events (to prevent sync loops)
     * @private
     */
    _updateGameStats(mergedStats, silent = false) {
        this.statistics.gameStats = mergedStats;
        this.userProfile.lastModified = Date.now();
        this._saveToStorage();
        if (!silent) {
            this._emitChange('statistics', this.statistics);
        }
    }

    // ============ ARTIFACTS ============

    /**
     * Unlock a permanent artifact
     * @param {string} artifactId
     */
    unlockArtifact(artifactId) {
        if (!this.artifacts.includes(artifactId)) {
            this.artifacts.push(artifactId);
            this._saveToStorage();
            this._emitChange('artifact', { artifactId });
        }
    }

    /**
     * Get owned artifacts
     * @returns {string[]}
     */
    getArtifacts() {
        return [...this.artifacts];
    }

    /**
     * Check if artifact is owned
     * @param {string} artifactId
     * @returns {boolean}
     */
    ownsArtifact(artifactId) {
        return this.artifacts.includes(artifactId);
    }

    // ============ XP & LEVELING ============

    /**
     * Add XP to the user
     * @param {number} amount
     * @returns {Object} { leveledUp, newLevel, xp }
     */
    addXP(amount) {
        this.userProfile.xp += amount;
        
        let leveledUp = false;
        const xpForLevel = (level) => Math.floor(100 * Math.pow(1.5, level - 1));

        while (this.userProfile.xp >= xpForLevel(this.userProfile.level)) {
            this.userProfile.xp -= xpForLevel(this.userProfile.level);
            this.userProfile.level++;
            leveledUp = true;
        }

        if (leveledUp) {
            this._updateTitle();
            eventBus.emit('globalLevelUp', { level: this.userProfile.level });
        }

        this._saveToStorage();
        eventBus.emit('globalXPGain', { amount, level: this.userProfile.level, xp: this.userProfile.xp });

        return {
            leveledUp,
            newLevel: this.userProfile.level,
            xp: this.userProfile.xp
        };
    }

    /**
     * Get XP progress for current level
     * @returns {Object} { current, needed, progress }
     */
    getLevelProgress() {
        const xpForLevel = (level) => Math.floor(100 * Math.pow(1.5, level - 1));
        const needed = xpForLevel(this.userProfile.level);
        
        return {
            current: this.userProfile.xp,
            needed,
            progress: this.userProfile.xp / needed
        };
    }

    // ============ STREAK TRACKING ============

    /**
     * Check and update daily streak
     * @private
     */
    _checkStreak() {
        const today = new Date().toDateString();
        const lastPlay = this.statistics.lastPlayDate;

        if (!lastPlay) {
            // First time playing
            this.statistics.currentStreak = 0;
            return;
        }

        const lastDate = new Date(lastPlay);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Already played today
            return;
        } else if (diffDays === 1) {
            // Consecutive day
            this.statistics.currentStreak++;
            if (this.statistics.currentStreak > this.statistics.longestStreak) {
                this.statistics.longestStreak = this.statistics.currentStreak;
            }
            eventBus.emit('streakContinued', { streak: this.statistics.currentStreak });
        } else {
            // Streak broken
            this.statistics.currentStreak = 0;
        }

        this._saveToStorage();
    }

    // ============ PRIVATE METHODS ============

    /**
     * Load state from localStorage
     * @private
     */
    _loadFromStorage() {
        try {
            const saved = localStorage.getItem('arcadeHub_globalState');
            if (saved) {
                const parsed = JSON.parse(saved);
                
                // Merge with defaults (for backward compatibility)
                this.userProfile = { ...this.userProfile, ...parsed.userProfile };
                this.statistics = { ...this.statistics, ...parsed.statistics };
                this.gameAchievements = parsed.gameAchievements || {};
                this.gameSaves = parsed.gameSaves || {};
                this.artifacts = parsed.artifacts || [];
            }
        } catch (e) {
            console.warn('Failed to load global state:', e);
        }
    }

    /**
     * Save state to localStorage
     * @private
     */
    _saveToStorage() {
        try {
            localStorage.setItem('arcadeHub_globalState', JSON.stringify({
                userProfile: this.userProfile,
                statistics: this.statistics,
                gameAchievements: this.gameAchievements,
                gameSaves: this.gameSaves,
                artifacts: this.artifacts
            }));
        } catch (e) {
            console.warn('Failed to save global state:', e);
        }
    }

    /**
     * Sync with existing StorageManager data (backward compatibility)
     * @private
     */
    _syncFromStorageManager() {
        const existingStats = storageManager.getStats();
        const existingScores = storageManager.getAllHighScores();
        const existingAchievements = storageManager.getAchievements();

        // Merge stats
        this.statistics.totalGamesPlayed = Math.max(
            this.statistics.totalGamesPlayed,
            existingStats.gamesPlayed || 0
        );
        this.statistics.totalPlayTime = Math.max(
            this.statistics.totalPlayTime,
            existingStats.totalPlayTime || 0
        );

        // Merge XP and level
        this.userProfile.xp = Math.max(this.userProfile.xp, existingStats.xp || 0);
        this.userProfile.level = Math.max(this.userProfile.level, existingStats.level || 1);

        // Import high scores
        for (const [gameId, score] of Object.entries(existingScores)) {
            const gs = this.getGameStats(gameId);
            if (score > gs.highScore) {
                gs.highScore = score;
                this.statistics.gameStats[gameId] = gs;
            }
        }

        // Import achievement count
        this.userProfile.totalAchievements = Math.max(
            this.userProfile.totalAchievements,
            existingAchievements.length
        );

        this._saveToStorage();
    }

    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        // Listen for game events
        eventBus.on(GameEvents.HIGHSCORE_UPDATE, ({ gameId, score }) => {
            const gs = this.getGameStats(gameId);
            if (score > gs.highScore) {
                gs.highScore = score;
                this.statistics.gameStats[gameId] = gs;
                this._saveToStorage();
            }
        });

        eventBus.on(GameEvents.ACHIEVEMENT_UNLOCK, ({ achievementId, xpReward, gameId }) => {
            if (gameId) {
                this.recordAchievement(gameId, achievementId, xpReward);
            }
        });
    }

    /**
     * Recalculate aggregate statistics
     * @private
     */
    _recalculateAggregates() {
        let totalScore = 0;
        let perfectRuns = 0;

        for (const stats of Object.values(this.statistics.gameStats)) {
            totalScore += stats.totalScore || 0;
            perfectRuns += stats.perfectRuns || 0;
        }

        this.statistics.totalScore = totalScore;
        this.statistics.perfectRuns = perfectRuns;
    }

    /**
     * Update favorite game based on play count
     * @private
     */
    _updateFavoriteGame() {
        let maxPlayed = 0;
        let favorite = null;

        for (const [gameId, stats] of Object.entries(this.statistics.gameStats)) {
            if (stats.played > maxPlayed) {
                maxPlayed = stats.played;
                favorite = gameId;
            }
        }

        this.userProfile.favoriteGame = favorite;
    }

    /**
     * Count total achievements across all games
     * @private
     */
    _countTotalAchievements() {
        let total = 0;
        for (const achievements of Object.values(this.gameAchievements)) {
            total += achievements.length;
        }
        return total;
    }

    /**
     * Update player title based on level/achievements
     * @private
     */
    _updateTitle() {
        let bestTitle = PLAYER_TITLES[0];

        for (const title of PLAYER_TITLES) {
            const req = title.requirement;
            let qualifies = true;

            if (req.level && this.userProfile.level < req.level) qualifies = false;
            if (req.achievements && this.userProfile.totalAchievements < req.achievements) qualifies = false;
            if (req.totalScore && this.statistics.totalScore < req.totalScore) qualifies = false;

            if (qualifies) {
                bestTitle = title;
            }
        }

        this.userProfile.title = bestTitle.name;
        this.userProfile.titleColor = bestTitle.color;
    }

    /**
     * Emit state change event
     * @private
     */
    _emitChange(type, data) {
        if (this.onStateChange) {
            this.onStateChange(type, data);
        }
        eventBus.emit('globalStateChange', { type, data });
    }

    /**
     * Clear all data (for testing)
     */
    clearAllData() {
        localStorage.removeItem('arcadeHub_globalState');
        this.userProfile = {
            id: null,
            displayName: 'Player',
            avatar: '🎮',
            title: 'Newcomer',
            titleColor: '#808080',
            level: 1,
            xp: 0,
            totalAchievements: 0,
            favoriteGame: null,
            lastPlayed: null,
            createdAt: null,
            preferences: {
                soundEnabled: true,
                musicEnabled: true,
                notificationsEnabled: true,
                theme: 'neon'
            }
        };
        this.statistics = {
            totalGamesPlayed: 0,
            totalPlayTime: 0,
            totalScore: 0,
            gamesCompleted: 0,
            perfectRuns: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastPlayDate: null,
            gameStats: {}
        };
        this.gameAchievements = {};
        this.gameSaves = {};
    }

    /**
     * Export state for backup
     * @returns {Object}
     */
    exportState() {
        return {
            userProfile: this.userProfile,
            statistics: this.statistics,
            gameAchievements: this.gameAchievements,
            gameSaves: this.gameSaves,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import state from backup
     * @param {Object} data
     */
    importState(data) {
        if (data.userProfile) this.userProfile = { ...this.userProfile, ...data.userProfile };
        if (data.statistics) this.statistics = { ...this.statistics, ...data.statistics };
        if (data.gameAchievements) this.gameAchievements = data.gameAchievements;
        if (data.gameSaves) this.gameSaves = data.gameSaves;
        
        this._saveToStorage();
        this._emitChange('import', data);
    }
}

// Singleton instance
export const globalStateManager = new GlobalStateManager();
export default GlobalStateManager;
