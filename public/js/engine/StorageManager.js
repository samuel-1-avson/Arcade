/**
 * StorageManager - Persistent data storage with LocalStorage and Firebase sync
 * Handles high scores, achievements, user stats, and settings
 */
import { eventBus, GameEvents } from './EventBus.js';
import { logger, LogCategory } from '../utils/logger.js';

class StorageManager {
    constructor() {
        this.localData = {
            highScores: {},
            achievements: [],
            stats: {
                gamesPlayed: 0,
                totalPlayTime: 0,
                xp: 0,
                level: 1
            },
            settings: {}
        };

        this.userId = null;
        this.firebaseEnabled = false;

        // Load from localStorage on init
        this._loadLocalData();
    }

    /**
     * Initialize with optional Firebase user ID
     * @param {string} [userId] - Firebase user ID for cloud sync
     */
    init(userId = null) {
        this.userId = userId;
        this.firebaseEnabled = userId !== null && typeof firebase !== 'undefined';

        if (this.firebaseEnabled) {
            this.syncFromCloud();
        }
    }

    // ============ HIGH SCORES ============

    /**
     * Get high score for a game
     * @param {string} gameId - Game identifier
     * @returns {number}
     */
    getHighScore(gameId) {
        return this.localData.highScores[gameId] || 0;
    }

    /**
     * Set high score for a game (only if higher)
     * @param {string} gameId - Game identifier
     * @param {number} score - New score
     * @returns {boolean} Whether this is a new high score
     */
    setHighScore(gameId, score) {
        const currentHigh = this.getHighScore(gameId);
        
        if (score > currentHigh) {
            this.localData.highScores[gameId] = score;
            this._saveLocalData();

            eventBus.emit(GameEvents.HIGHSCORE_UPDATE, { gameId, score, previous: currentHigh });

            if (this.firebaseEnabled) {
                this._syncHighScoreToCloud(gameId, score);
            }

            return true;
        }

        return false;
    }

    /**
     * Get all high scores
     * @returns {Object} Map of gameId -> score
     */
    getAllHighScores() {
        return { ...this.localData.highScores };
    }

    // ============ ACHIEVEMENTS ============

    /**
     * Get unlocked achievements
     * @returns {string[]} Array of achievement IDs
     */
    getAchievements() {
        return [...this.localData.achievements];
    }

    /**
     * Check if an achievement is unlocked
     * @param {string} achievementId 
     * @returns {boolean}
     */
    hasAchievement(achievementId) {
        return this.localData.achievements.includes(achievementId);
    }

    /**
     * Unlock an achievement
     * @param {string} achievementId 
     * @param {number} [xpReward=0] - XP to award
     * @returns {boolean} Whether newly unlocked
     */
    unlockAchievement(achievementId, xpReward = 0) {
        if (this.hasAchievement(achievementId)) {
            return false;
        }

        this.localData.achievements.push(achievementId);
        
        if (xpReward > 0) {
            this.addXP(xpReward);
        }

        this._saveLocalData();

        eventBus.emit(GameEvents.ACHIEVEMENT_UNLOCK, { achievementId, xpReward });

        if (this.firebaseEnabled) {
            this._syncAchievementsToCloud();
        }

        return true;
    }

    // ============ STATS & XP ============

    /**
     * Get user stats
     * @returns {Object}
     */
    getStats() {
        return { ...this.localData.stats };
    }

    /**
     * Add XP and handle level ups
     * @param {number} amount - XP to add
     * @returns {Object} { newXP, level, leveledUp }
     */
    addXP(amount) {
        const stats = this.localData.stats;
        stats.xp += amount;

        // Level up thresholds (exponential)
        const xpForLevel = (level) => Math.floor(100 * Math.pow(1.5, level - 1));

        let leveledUp = false;
        while (stats.xp >= xpForLevel(stats.level)) {
            stats.xp -= xpForLevel(stats.level);
            stats.level++;
            leveledUp = true;
        }

        this._saveLocalData();

        if (leveledUp) {
            eventBus.emit(GameEvents.LEVEL_UP, { level: stats.level });
        }

        eventBus.emit(GameEvents.XP_GAIN, { amount, totalXP: stats.xp, level: stats.level });

        return {
            newXP: stats.xp,
            level: stats.level,
            leveledUp
        };
    }

    /**
     * Increment games played counter
     */
    incrementGamesPlayed() {
        this.localData.stats.gamesPlayed++;
        this._saveLocalData();
    }

    /**
     * Add to total play time
     * @param {number} seconds - Seconds to add
     */
    addPlayTime(seconds) {
        this.localData.stats.totalPlayTime += seconds;
        this._saveLocalData();
        
        // Sync to cloud at end of game session (Game Over)
        // This satisfies "record results" requirement
        if (this.firebaseEnabled) {
            this.syncToCloud();
        }
    }

    /**
     * Get XP needed for next level
     * @returns {Object} { current, needed, progress }
     */
    getLevelProgress() {
        const stats = this.localData.stats;
        const xpForLevel = (level) => Math.floor(100 * Math.pow(1.5, level - 1));
        const needed = xpForLevel(stats.level);

        return {
            current: stats.xp,
            needed,
            progress: stats.xp / needed
        };
    }

    // ============ SETTINGS ============

    /**
     * Get a setting value
     * @param {string} key 
     * @param {*} defaultValue 
     * @returns {*}
     */
    getSetting(key, defaultValue = null) {
        return this.localData.settings[key] ?? defaultValue;
    }

    /**
     * Set a setting value
     * @param {string} key 
     * @param {*} value 
     */
    setSetting(key, value) {
        this.localData.settings[key] = value;
        this._saveLocalData();
    }

    // ============ CLOUD SYNC ============

    /**
     * Sync all data to Firebase
     */
    async syncToCloud() {
        if (!this.firebaseEnabled || !this.userId) return;

        try {
            const db = firebase.firestore();
            await db.collection('users').doc(this.userId).set({
                highScores: this.localData.highScores,
                achievements: this.localData.achievements,
                stats: this.localData.stats,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            logger.info(LogCategory.STORAGE, 'Data synced to cloud');
        } catch (error) {
            logger.error(LogCategory.STORAGE, 'Failed to sync to cloud:', error);
        }
    }

    /**
     * Sync data from Firebase
     */
    async syncFromCloud() {
        if (!this.firebaseEnabled || !this.userId) return;

        try {
            const db = firebase.firestore();
            const doc = await db.collection('users').doc(this.userId).get();

            if (doc.exists) {
                const cloudData = doc.data();

                // Merge high scores (keep highest)
                for (const [gameId, score] of Object.entries(cloudData.highScores || {})) {
                    if (score > (this.localData.highScores[gameId] || 0)) {
                        this.localData.highScores[gameId] = score;
                    }
                }

                // Merge achievements (union)
                const allAchievements = new Set([
                    ...this.localData.achievements,
                    ...(cloudData.achievements || [])
                ]);
                this.localData.achievements = [...allAchievements];

                // Merge stats (use higher values)
                if (cloudData.stats) {
                    this.localData.stats.gamesPlayed = Math.max(
                        this.localData.stats.gamesPlayed,
                        cloudData.stats.gamesPlayed || 0
                    );
                    this.localData.stats.totalPlayTime = Math.max(
                        this.localData.stats.totalPlayTime,
                        cloudData.stats.totalPlayTime || 0
                    );
                    this.localData.stats.xp = Math.max(
                        this.localData.stats.xp,
                        cloudData.stats.xp || 0
                    );
                    this.localData.stats.level = Math.max(
                        this.localData.stats.level,
                        cloudData.stats.level || 1
                    );
                }

                this._saveLocalData();
                logger.info(LogCategory.STORAGE, 'Data synced from cloud');
            }
        } catch (error) {
            logger.error(LogCategory.STORAGE, 'Failed to sync from cloud:', error);
        }
    }

    // ============ PRIVATE METHODS ============

    _loadLocalData() {
        try {
            const saved = localStorage.getItem('arcadeHub_gameData');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.localData = {
                    ...this.localData,
                    ...parsed
                };
            }
        } catch (e) {
            logger.warn(LogCategory.STORAGE, 'Failed to load local data:', e);
        }
    }

    _saveLocalData() {
        try {
            localStorage.setItem('arcadeHub_gameData', JSON.stringify(this.localData));
        } catch (e) {
            logger.warn(LogCategory.STORAGE, 'Failed to save local data:', e);
        }
    }

    async _syncHighScoreToCloud(gameId, score) {
        if (!this.firebaseEnabled || !this.userId) return;

        try {
            const db = firebase.firestore();
            
            // Update user's high score
            await db.collection('users').doc(this.userId).set({
                [`highScores.${gameId}`]: score,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Update leaderboard (via Cloud Function for validation)
            // This would typically call a Cloud Function
            // await firebase.functions().httpsCallable('submitScore')({ gameId, score });
        } catch (error) {
            logger.error(LogCategory.STORAGE, 'Failed to sync high score to cloud:', error);
        }
    }

    async _syncAchievementsToCloud() {
        if (!this.firebaseEnabled || !this.userId) return;

        try {
            const db = firebase.firestore();
            await db.collection('users').doc(this.userId).set({
                achievements: this.localData.achievements,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            logger.error(LogCategory.STORAGE, 'Failed to sync achievements to cloud:', error);
        }
    }

    /**
     * Clear all local data (for testing)
     */
    clearAllData() {
        this.localData = {
            highScores: {},
            achievements: [],
            stats: {
                gamesPlayed: 0,
                totalPlayTime: 0,
                xp: 0,
                level: 1
            },
            settings: {}
        };
        localStorage.removeItem('arcadeHub_gameData');
    }
}

// Create singleton instance
export const storageManager = new StorageManager();
export default StorageManager;
