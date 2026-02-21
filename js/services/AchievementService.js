/**
 * AchievementService - Unified Achievement System for Arcade Hub
 * Hub-wide achievement tracking with meta-achievements and cross-game milestones
 */
import { eventBus } from '../engine/EventBus.js';
import { globalStateManager, GAME_IDS } from './GlobalStateManager.js';
import { notificationService } from './NotificationService.js';
import { logger, LogCategory } from '../utils/logger.js';

// Meta-Achievements - Cross-game achievements
export const META_ACHIEVEMENTS = {
    // ===== EXPLORER (Trying Games) =====
    first_steps: {
        id: 'first_steps',
        name: 'First Steps',
        desc: 'Play your first game',
        icon: '👣',
        xp: 25,
        category: 'explorer',
        condition: (stats) => stats.totalGamesPlayed >= 1
    },
    game_tourist: {
        id: 'game_tourist',
        name: 'Game Tourist',
        desc: 'Play 3 different games',
        icon: '🗺️',
        xp: 75,
        category: 'explorer',
        condition: (stats) => stats.gamesPlayed >= 3
    },
    variety_player: {
        id: 'variety_player',
        name: 'Variety Player',
        desc: 'Play 5 different games',
        icon: '🎭',
        xp: 150,
        category: 'explorer',
        condition: (stats) => stats.gamesPlayed >= 5
    },
    arcade_explorer: {
        id: 'arcade_explorer',
        name: 'Arcade Explorer',
        desc: 'Play all available games',
        icon: '🌍',
        xp: 300,
        category: 'explorer',
        condition: (stats) => stats.gamesPlayed >= GAME_IDS.length
    },

    // ===== ACHIEVER (Earning Achievements) =====
    first_achievement: {
        id: 'first_achievement',
        name: 'Achiever',
        desc: 'Unlock your first achievement in any game',
        icon: '🎖️',
        xp: 25,
        category: 'achiever',
        condition: (stats) => stats.totalAchievements >= 1
    },
    achievement_hunter: {
        id: 'achievement_hunter',
        name: 'Achievement Hunter',
        desc: 'Unlock 25 achievements across all games',
        icon: '🏅',
        xp: 200,
        category: 'achiever',
        condition: (stats) => stats.totalAchievements >= 25
    },
    achievement_collector: {
        id: 'achievement_collector',
        name: 'Achievement Collector',
        desc: 'Unlock 50 achievements across all games',
        icon: '🏆',
        xp: 400,
        category: 'achiever',
        condition: (stats) => stats.totalAchievements >= 50
    },
    achievement_master: {
        id: 'achievement_master',
        name: 'Achievement Master',
        desc: 'Unlock 100 achievements across all games',
        icon: '👑',
        xp: 750,
        category: 'achiever',
        condition: (stats) => stats.totalAchievements >= 100
    },
    completionist: {
        id: 'completionist',
        name: 'Completionist',
        desc: 'Unlock 200 achievements across all games',
        icon: '💯',
        xp: 1500,
        category: 'achiever',
        condition: (stats) => stats.totalAchievements >= 200
    },

    // ===== ARCADE MASTER (Multi-Game Excellence) =====
    multi_skilled: {
        id: 'multi_skilled',
        name: 'Multi-Skilled',
        desc: 'Earn 5+ achievements in 2 different games',
        icon: '🎮',
        xp: 150,
        category: 'master',
        condition: (stats) => stats.gamesWithMinAchievements5 >= 2
    },
    arcade_adept: {
        id: 'arcade_adept',
        name: 'Arcade Adept',
        desc: 'Earn 10+ achievements in 3 different games',
        icon: '🕹️',
        xp: 300,
        category: 'master',
        condition: (stats) => stats.gamesWithMinAchievements10 >= 3
    },
    arcade_master: {
        id: 'arcade_master',
        name: 'Arcade Master',
        desc: 'Earn 15+ achievements in 5 different games',
        icon: '🌟',
        xp: 600,
        category: 'master',
        condition: (stats) => stats.gamesWithMinAchievements15 >= 5
    },
    arcade_legend: {
        id: 'arcade_legend',
        name: 'Arcade Legend',
        desc: 'Earn 25+ achievements in 7 different games',
        icon: '⚜️',
        xp: 1000,
        category: 'master',
        condition: (stats) => stats.gamesWithMinAchievements25 >= 7
    },

    // ===== PERFECTIONIST =====
    first_perfect: {
        id: 'first_perfect',
        name: 'Flawless',
        desc: 'Complete a perfect run in any game',
        icon: '✨',
        xp: 100,
        category: 'perfectionist',
        condition: (stats) => stats.perfectRuns >= 1
    },
    perfectionist: {
        id: 'perfectionist',
        name: 'Perfectionist',
        desc: 'Complete perfect runs in 3 different games',
        icon: '💎',
        xp: 350,
        category: 'perfectionist',
        condition: (stats) => stats.perfectRunGames >= 3
    },
    flawless_master: {
        id: 'flawless_master',
        name: 'Flawless Master',
        desc: 'Complete perfect runs in 5 different games',
        icon: '🌠',
        xp: 700,
        category: 'perfectionist',
        condition: (stats) => stats.perfectRunGames >= 5
    },

    // ===== DEDICATION (Time Played) =====
    casual_gamer: {
        id: 'casual_gamer',
        name: 'Casual Gamer',
        desc: 'Play for 1 hour total',
        icon: '⏰',
        xp: 50,
        category: 'dedication',
        condition: (stats) => stats.totalPlayTime >= 3600
    },
    dedicated_player: {
        id: 'dedicated_player',
        name: 'Dedicated Player',
        desc: 'Play for 5 hours total',
        icon: '⏱️',
        xp: 150,
        category: 'dedication',
        condition: (stats) => stats.totalPlayTime >= 18000
    },
    arcade_regular: {
        id: 'arcade_regular',
        name: 'Arcade Regular',
        desc: 'Play for 10 hours total',
        icon: '🕐',
        xp: 300,
        category: 'dedication',
        condition: (stats) => stats.totalPlayTime >= 36000
    },
    arcade_veteran: {
        id: 'arcade_veteran',
        name: 'Arcade Veteran',
        desc: 'Play for 25 hours total',
        icon: '🕰️',
        xp: 600,
        category: 'dedication',
        condition: (stats) => stats.totalPlayTime >= 90000
    },
    arcade_addict: {
        id: 'arcade_addict',
        name: 'Arcade Addict',
        desc: 'Play for 50 hours total',
        icon: '📅',
        xp: 1000,
        category: 'dedication',
        condition: (stats) => stats.totalPlayTime >= 180000
    },

    // ===== STREAK =====
    first_streak: {
        id: 'first_streak',
        name: 'Getting Started',
        desc: 'Play 2 days in a row',
        icon: '🔥',
        xp: 50,
        category: 'streak',
        condition: (stats) => stats.longestStreak >= 2
    },
    week_streak: {
        id: 'week_streak',
        name: 'Week Warrior',
        desc: 'Maintain a 7-day streak',
        icon: '📆',
        xp: 200,
        category: 'streak',
        condition: (stats) => stats.longestStreak >= 7
    },
    month_streak: {
        id: 'month_streak',
        name: 'Monthly Devotion',
        desc: 'Maintain a 30-day streak',
        icon: '📅',
        xp: 500,
        category: 'streak',
        condition: (stats) => stats.longestStreak >= 30
    },

    // ===== SCORE (Total Points) =====
    point_starter: {
        id: 'point_starter',
        name: 'Point Starter',
        desc: 'Score 10,000 points total',
        icon: '💯',
        xp: 50,
        category: 'score',
        condition: (stats) => stats.totalScore >= 10000
    },
    score_hoarder: {
        id: 'score_hoarder',
        name: 'Score Hoarder',
        desc: 'Score 50,000 points total',
        icon: '📊',
        xp: 150,
        category: 'score',
        condition: (stats) => stats.totalScore >= 50000
    },
    high_scorer: {
        id: 'high_scorer',
        name: 'High Scorer',
        desc: 'Score 250,000 points total',
        icon: '📈',
        xp: 400,
        category: 'score',
        condition: (stats) => stats.totalScore >= 250000
    },
    score_legend: {
        id: 'score_legend',
        name: 'Score Legend',
        desc: 'Score 1,000,000 points total',
        icon: '🏅',
        xp: 1000,
        category: 'score',
        condition: (stats) => stats.totalScore >= 1000000
    },

    // ===== LEVEL =====
    level_5: {
        id: 'level_5',
        name: 'Rising Star',
        desc: 'Reach level 5',
        icon: '⭐',
        xp: 0,
        category: 'level',
        condition: (stats) => stats.level >= 5
    },
    level_10: {
        id: 'level_10',
        name: 'Experienced',
        desc: 'Reach level 10',
        icon: '🌟',
        xp: 0,
        category: 'level',
        condition: (stats) => stats.level >= 10
    },
    level_25: {
        id: 'level_25',
        name: 'Skillful',
        desc: 'Reach level 25',
        icon: '✨',
        xp: 0,
        category: 'level',
        condition: (stats) => stats.level >= 25
    },
    level_50: {
        id: 'level_50',
        name: 'Expert',
        desc: 'Reach level 50',
        icon: '💫',
        xp: 0,
        category: 'level',
        condition: (stats) => stats.level >= 50
    },
    level_100: {
        id: 'level_100',
        name: 'Legend',
        desc: 'Reach level 100',
        icon: '👑',
        xp: 0,
        category: 'level',
        condition: (stats) => stats.level >= 100
    }
};

// Achievement categories for display
export const ACHIEVEMENT_CATEGORIES = {
    explorer: { name: 'Explorer', icon: '🗺️', color: '#00aaff' },
    achiever: { name: 'Achiever', icon: '🏆', color: '#ffd700' },
    master: { name: 'Arcade Master', icon: '🎮', color: '#ff00ff' },
    perfectionist: { name: 'Perfectionist', icon: '💎', color: '#00ffff' },
    dedication: { name: 'Dedication', icon: '⏰', color: '#ff8800' },
    streak: { name: 'Streak', icon: '🔥', color: '#ff4400' },
    score: { name: 'Score', icon: '📊', color: '#00ff88' },
    level: { name: 'Level', icon: '⭐', color: '#ffff00' }
};

class AchievementService {
    constructor() {
        this.unlockedMeta = this._loadUnlocked();
        this._setupEventListeners();
    }

    /**
     * Initialize the achievement service
     */
    init() {
        // Initial check for meta achievements
        this.checkMetaAchievements();
        logger.info(LogCategory.GAME, 'AchievementService initialized');
    }

    // ============ PUBLIC METHODS ============

    /**
     * Check all meta-achievements
     * @returns {Object[]} Array of newly unlocked achievements
     */
    checkMetaAchievements() {
        const stats = this._gatherStats();
        const newlyUnlocked = [];

        for (const [id, achievement] of Object.entries(META_ACHIEVEMENTS)) {
            if (!this.unlockedMeta.includes(id) && achievement.condition(stats)) {
                this._unlockMetaAchievement(achievement);
                newlyUnlocked.push(achievement);
            }
        }

        return newlyUnlocked;
    }

    /**
     * Get all meta-achievements
     * @returns {Object[]}
     */
    getAllMetaAchievements() {
        return Object.values(META_ACHIEVEMENTS).map(achievement => ({
            ...achievement,
            unlocked: this.unlockedMeta.includes(achievement.id)
        }));
    }

    /**
     * Get meta-achievements by category
     * @param {string} category
     * @returns {Object[]}
     */
    getMetaAchievementsByCategory(category) {
        return Object.values(META_ACHIEVEMENTS)
            .filter(a => a.category === category)
            .map(achievement => ({
                ...achievement,
                unlocked: this.unlockedMeta.includes(achievement.id)
            }));
    }

    /**
     * Get unlocked meta-achievement count
     * @returns {number}
     */
    getUnlockedCount() {
        return this.unlockedMeta.length;
    }

    /**
     * Get total meta-achievement count
     * @returns {number}
     */
    getTotalCount() {
        return Object.keys(META_ACHIEVEMENTS).length;
    }

    /**
     * Get progress for meta-achievements
     * @returns {Object}
     */
    getProgress() {
        const stats = this._gatherStats();
        const progress = {};

        for (const [id, achievement] of Object.entries(META_ACHIEVEMENTS)) {
            progress[id] = {
                ...achievement,
                unlocked: this.unlockedMeta.includes(id),
                progress: this._calculateProgress(achievement, stats)
            };
        }

        return progress;
    }

    /**
     * Get aggregated achievements from all games
     * @returns {Object}
     */
    getAggregatedAchievements() {
        const gameAchievements = globalStateManager.gameAchievements;
        const aggregated = {
            total: 0,
            byGame: {},
            byCategory: {}
        };

        for (const [gameId, achievements] of Object.entries(gameAchievements)) {
            aggregated.total += achievements.length;
            aggregated.byGame[gameId] = {
                count: achievements.length,
                achievements
            };
        }

        // Add meta-achievements
        aggregated.byGame['hub'] = {
            count: this.unlockedMeta.length,
            achievements: this.unlockedMeta
        };
        aggregated.total += this.unlockedMeta.length;

        return aggregated;
    }

    // ============ PRIVATE METHODS ============

    /**
     * Load unlocked meta-achievements from storage
     * @private
     */
    _loadUnlocked() {
        try {
            const saved = localStorage.getItem('arcadeHub_metaAchievements');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            logger.warn(LogCategory.GAME, 'Failed to load meta achievements:', e);
            return [];
        }
    }

    /**
     * Save unlocked meta-achievements
     * @private
     */
    _saveUnlocked() {
        try {
            localStorage.setItem('arcadeHub_metaAchievements', JSON.stringify(this.unlockedMeta));
        } catch (e) {
            logger.warn(LogCategory.GAME, 'Failed to save meta achievements:', e);
        }
    }

    /**
     * Unlock a meta-achievement
     * @private
     */
    _unlockMetaAchievement(achievement) {
        if (this.unlockedMeta.includes(achievement.id)) return;

        this.unlockedMeta.push(achievement.id);
        this._saveUnlocked();

        // Add XP via GlobalStateManager
        if (achievement.xp > 0) {
            globalStateManager.addXP(achievement.xp);
        }

        // Show notification
        notificationService.showAchievement({
            name: `🌟 ${achievement.name}`,
            desc: achievement.desc,
            icon: achievement.icon,
            xp: achievement.xp
        });

        // Emit event
        eventBus.emit('metaAchievementUnlock', achievement);
    }

    /**
     * Gather stats for condition checking
     * @private
     */
    _gatherStats() {
        const profile = globalStateManager.getProfile();
        const statistics = globalStateManager.getStatistics();
        const gameStats = statistics.gameStats;

        // Count games played
        let gamesPlayed = 0;
        let perfectRunGames = 0;
        let gamesWithMinAchievements5 = 0;
        let gamesWithMinAchievements10 = 0;
        let gamesWithMinAchievements15 = 0;
        let gamesWithMinAchievements25 = 0;

        for (const [gameId, stats] of Object.entries(gameStats)) {
            if (stats.played > 0) gamesPlayed++;
            if (stats.perfectRuns > 0) perfectRunGames++;
            if (stats.achievements >= 5) gamesWithMinAchievements5++;
            if (stats.achievements >= 10) gamesWithMinAchievements10++;
            if (stats.achievements >= 15) gamesWithMinAchievements15++;
            if (stats.achievements >= 25) gamesWithMinAchievements25++;
        }

        return {
            level: profile.level,
            totalAchievements: profile.totalAchievements + this.unlockedMeta.length,
            totalGamesPlayed: statistics.totalGamesPlayed,
            totalPlayTime: statistics.totalPlayTime,
            totalScore: statistics.totalScore,
            perfectRuns: statistics.perfectRuns,
            currentStreak: statistics.currentStreak,
            longestStreak: statistics.longestStreak,
            gamesPlayed,
            perfectRunGames,
            gamesWithMinAchievements5,
            gamesWithMinAchievements10,
            gamesWithMinAchievements15,
            gamesWithMinAchievements25
        };
    }

    /**
     * Calculate progress toward an achievement
     * @private
     */
    _calculateProgress(achievement, stats) {
        // Parse the condition to estimate progress
        const condStr = achievement.condition.toString();
        
        // Try to extract numbers from condition
        const numMatch = condStr.match(/>=\s*(\d+)/);
        if (numMatch) {
            const target = parseInt(numMatch[1]);
            
            // Figure out which stat
            if (condStr.includes('totalGamesPlayed')) {
                return Math.min(1, stats.totalGamesPlayed / target);
            }
            if (condStr.includes('gamesPlayed')) {
                return Math.min(1, stats.gamesPlayed / target);
            }
            if (condStr.includes('totalAchievements')) {
                return Math.min(1, stats.totalAchievements / target);
            }
            if (condStr.includes('totalPlayTime')) {
                return Math.min(1, stats.totalPlayTime / target);
            }
            if (condStr.includes('totalScore')) {
                return Math.min(1, stats.totalScore / target);
            }
            if (condStr.includes('perfectRuns')) {
                return Math.min(1, stats.perfectRuns / target);
            }
            if (condStr.includes('longestStreak')) {
                return Math.min(1, stats.longestStreak / target);
            }
            if (condStr.includes('level')) {
                return Math.min(1, stats.level / target);
            }
            if (condStr.includes('perfectRunGames')) {
                return Math.min(1, stats.perfectRunGames / target);
            }
            if (condStr.includes('gamesWithMinAchievements5')) {
                return Math.min(1, stats.gamesWithMinAchievements5 / target);
            }
            if (condStr.includes('gamesWithMinAchievements10')) {
                return Math.min(1, stats.gamesWithMinAchievements10 / target);
            }
            if (condStr.includes('gamesWithMinAchievements15')) {
                return Math.min(1, stats.gamesWithMinAchievements15 / target);
            }
            if (condStr.includes('gamesWithMinAchievements25')) {
                return Math.min(1, stats.gamesWithMinAchievements25 / target);
            }
        }

        return 0;
    }

    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        // Check achievements on various events
        eventBus.on('globalStateChange', () => {
            this.checkMetaAchievements();
        });

        eventBus.on('globalLevelUp', () => {
            this.checkMetaAchievements();
        });

        // Periodically check (in case events missed)
        setInterval(() => {
            this.checkMetaAchievements();
        }, 30000); // Every 30 seconds

        // Debounced cloud sync (every 60 seconds or on page unload)
        setInterval(() => {
            this.syncToCloud();
        }, 60000);

        window.addEventListener('beforeunload', () => {
            this.syncToCloudSync();
        });
    }

    // ============ CLOUD SYNC METHODS ============

    /**
     * Sync all meta-achievements to Firestore using batched writes
     * This is more efficient than individual writes
     */
    async syncToCloud() {
        // Dynamic import to avoid circular dependency
        const { firebaseService } = await import('../engine/FirebaseService.js');
        
        const db = firebaseService.db;
        const user = firebaseService.getCurrentUser();
        
        if (!db || !user || this.unlockedMeta.length === 0) {
            return { synced: 0, skipped: 0 };
        }

        try {
            const batch = db.batch();
            const userRef = db.collection('users').doc(user.uid);
            let syncedCount = 0;

            // Batch all meta-achievements
            for (const achievementId of this.unlockedMeta) {
                const achievement = META_ACHIEVEMENTS[achievementId];
                if (!achievement) continue;

                const achRef = userRef.collection('achievements').doc(`meta_${achievementId}`);
                batch.set(achRef, {
                    id: achievementId,
                    name: achievement.name,
                    desc: achievement.desc,
                    category: achievement.category,
                    xp: achievement.xp,
                    unlockedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                syncedCount++;
            }

            // Also update user's total achievement count
            batch.update(userRef, {
                'stats.totalMetaAchievements': this.unlockedMeta.length,
                lastAchievementSync: firebase.firestore.FieldValue.serverTimestamp()
            });

            await batch.commit();
            logger.info(LogCategory.GAME, `[AchievementService] Synced ${syncedCount} achievements to cloud`);
            
            return { synced: syncedCount, skipped: 0 };
        } catch (error) {
            logger.error(LogCategory.GAME, '[AchievementService] Cloud sync error:', error);
            return { synced: 0, error: error.message };
        }
    }

    /**
     * Synchronous version for page unload (stores pending sync)
     */
    syncToCloudSync() {
        if (this.unlockedMeta.length === 0) return;
        
        try {
            // Store pending achievements for sync on next load
            const pending = JSON.parse(localStorage.getItem('pendingAchievementSync') || '[]');
            const newPending = this.unlockedMeta.filter(id => !pending.includes(id));
            if (newPending.length > 0) {
                localStorage.setItem('pendingAchievementSync', 
                    JSON.stringify([...new Set([...pending, ...newPending])]));
            }
        } catch (e) {
            logger.warn(LogCategory.GAME, '[AchievementService] Failed to queue sync:', e);
        }
    }

    /**
     * Process any pending achievement syncs from previous sessions
     */
    async processPendingSync() {
        try {
            const pending = JSON.parse(localStorage.getItem('pendingAchievementSync') || '[]');
            if (pending.length === 0) return;

            // Merge pending into current unlocked
            for (const id of pending) {
                if (!this.unlockedMeta.includes(id)) {
                    this.unlockedMeta.push(id);
                }
            }

            // Sync to cloud
            await this.syncToCloud();
            
            // Clear pending
            localStorage.removeItem('pendingAchievementSync');
            logger.info(LogCategory.GAME, `[AchievementService] Processed ${pending.length} pending achievement syncs`);
        } catch (e) {
            logger.warn(LogCategory.GAME, '[AchievementService] Failed to process pending sync:', e);
        }
    }

    /**
     * Batch unlock multiple achievements at once
     * More efficient than unlocking one at a time
     * @param {string[]} achievementIds - Array of achievement IDs to unlock
     */
    async batchUnlockAchievements(achievementIds) {
        const newlyUnlocked = [];
        let totalXP = 0;

        for (const id of achievementIds) {
            const achievement = META_ACHIEVEMENTS[id];
            if (!achievement || this.unlockedMeta.includes(id)) continue;

            this.unlockedMeta.push(id);
            newlyUnlocked.push(achievement);
            totalXP += achievement.xp || 0;
        }

        if (newlyUnlocked.length === 0) return { unlocked: 0, xp: 0 };

        // Save to localStorage
        this._saveUnlocked();

        // Add XP all at once
        if (totalXP > 0) {
            globalStateManager.addXP(totalXP);
        }

        // Show notifications for each
        for (const achievement of newlyUnlocked) {
            notificationService.showAchievement({
                name: `🌟 ${achievement.name}`,
                desc: achievement.desc,
                icon: achievement.icon,
                xp: achievement.xp
            });
        }

        // Emit batch event
        eventBus.emit('batchAchievementsUnlocked', {
            achievements: newlyUnlocked,
            totalXP
        });

        // Trigger cloud sync
        this.syncToCloud();

        return { unlocked: newlyUnlocked.length, xp: totalXP };
    }

    /**
     * Clear all unlocked achievements (for testing)
     */
    clearAll() {
        this.unlockedMeta = [];
        localStorage.removeItem('arcadeHub_metaAchievements');
    }
}

// Singleton instance
export const achievementService = new AchievementService();
export default AchievementService;
