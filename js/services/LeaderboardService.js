/**
 * LeaderboardService - Global Leaderboard Management
 * Cross-game rankings, personal bests, and score submission
 */
import { eventBus } from '../engine/EventBus.js';
import { firebaseService } from '../engine/FirebaseService.js';
import { globalStateManager, GAME_IDS } from './GlobalStateManager.js';

// Leaderboard time periods
export const TIME_PERIODS = {
    ALL_TIME: 'allTime',
    WEEKLY: 'weekly',
    DAILY: 'daily'
};

class LeaderboardService {
    constructor() {
        this.cache = {};
        this.cacheExpiry = 60000; // 1 minute cache
        this.lastFetch = {};
    }

    /**
     * Initialize the leaderboard service
     */
    init() {
        console.log('LeaderboardService initialized');
    }

    // ============ PUBLIC METHODS ============

    /**
     * Get leaderboard for a specific game
     * @param {string} gameId
     * @param {string} period - 'allTime', 'weekly', 'daily'
     * @param {number} limit
     * @returns {Promise<Object[]>}
     */
    async getGameLeaderboard(gameId, period = TIME_PERIODS.ALL_TIME, limit = 10) {
        const cacheKey = `${gameId}_${period}`;
        
        // Check cache
        if (this._isCacheValid(cacheKey)) {
            return this.cache[cacheKey];
        }

        try {
            // Try to fetch from Firebase - only if DB is available AND user is signed in
            if (firebaseService.db && firebaseService.isSignedIn()) {
                const scores = await firebaseService.getLeaderboard(gameId, limit);
                this.cache[cacheKey] = scores;
                this.lastFetch[cacheKey] = Date.now();
                return scores;
            }
        } catch (e) {
            console.warn('[LeaderboardService] Failed to fetch game leaderboard:', e.message);
        }

        // Fallback to local data
        return this._getLocalLeaderboard(gameId);
    }

    /**
     * Get combined leaderboard across all games (total score)
     * @param {number} limit
     * @returns {Promise<Object[]>}
     */
    async getGlobalLeaderboard(limit = 10) {
        const cacheKey = 'global_allTime';
        
        if (this._isCacheValid(cacheKey)) {
            return this.cache[cacheKey];
        }

        try {
            // Only fetch if DB is available AND user is signed in
            // (Firestore rules require authentication for reading user profiles/scores)
            if (firebaseService.db && firebaseService.isSignedIn()) {
                const db = firebaseService.db;
                const currentUserId = firebaseService.getCurrentUser()?.uid;
                
                // Query users by totalScore (stored at root level, not nested in stats)
                const snapshot = await db.collection('users')
                    .orderBy('totalScore', 'desc')
                    .limit(limit)
                    .get();

                const scores = snapshot.docs.map((doc, index) => {
                    const data = doc.data();
                    return {
                        rank: index + 1,
                        name: data.displayName || 'Player',
                        photoURL: data.photoURL || null,
                        score: data.totalScore || 0,
                        level: data.level || 1,
                        userId: doc.id,
                        isCurrentUser: currentUserId ? doc.id === currentUserId : false
                    };
                });

                console.log(`[LeaderboardService] Fetched ${scores.length} players for global leaderboard`);
                this.cache[cacheKey] = scores;
                this.lastFetch[cacheKey] = Date.now();
                return scores;
            } else {
                console.log('[LeaderboardService] Firebase DB not ready, using local data');
            }
        } catch (e) {
            console.warn('[LeaderboardService] Failed to fetch global leaderboard:', e.message);
        }

        // Fallback to local only
        return this._getLocalGlobalLeaderboard();
    }

    /**
     * Get user's personal ranks across all games
     * @returns {Object}
     */
    async getPersonalRanks() {
        const profile = globalStateManager.getProfile();
        const stats = globalStateManager.getStatistics();
        
        const ranks = {
            global: null,
            byGame: {}
        };

        // Try to get global rank
        try {
            if (firebaseService.isSignedIn()) {
                const globalRank = await this._getUserGlobalRank();
                ranks.global = globalRank;
            }
        } catch (e) {
            console.warn('Failed to get global rank:', e);
        }

        // Get per-game ranks (from local high scores)
        for (const gameId of GAME_IDS) {
            const gameStats = stats.gameStats[gameId];
            if (gameStats && gameStats.highScore > 0) {
                ranks.byGame[gameId] = {
                    score: gameStats.highScore,
                    rank: null // Would need Firebase query per game
                };
            }
        }

        return ranks;
    }

    /**
     * Get top players summary for dashboard
     * @returns {Promise<Object>}
     */
    async getDashboardSummary() {
        const profile = globalStateManager.getProfile();
        const stats = globalStateManager.getStatistics();

        // Get top 3 for display
        const topGlobal = await this.getGlobalLeaderboard(3);

        // Find best game
        let bestGame = null;
        let bestScore = 0;
        for (const [gameId, gameStats] of Object.entries(stats.gameStats)) {
            if (gameStats.highScore > bestScore) {
                bestScore = gameStats.highScore;
                bestGame = gameId;
            }
        }

        return {
            topPlayers: topGlobal,
            personalBest: {
                gameId: bestGame,
                score: bestScore
            },
            totalScore: stats.totalScore,
            level: profile.level,
            rank: null // Would need Firebase query
        };
    }

    /**
     * Submit score to leaderboard
     * Uses transaction-based update for atomic high score handling
     * @param {string} gameId
     * @param {number} score
     * @param {Object} metadata
     * @returns {Promise<{submitted: boolean, isNewBest: boolean}>}
     */
    async submitScore(gameId, score, metadata = {}) {
        // Update local state first
        globalStateManager.recordGameSession(gameId, {
            score,
            duration: metadata.duration || 0,
            completed: metadata.completed || false,
            perfect: metadata.perfect || false
        });

        let isNewBest = false;

        // Submit to Firebase if signed in
        try {
            if (firebaseService.isSignedIn()) {
                // Use transaction-based submission for atomic updates
                const result = await firebaseService.submitScoreWithTransaction(gameId, score, metadata);
                isNewBest = result.isNewBest || false;
                
                // Invalidate cache
                this._invalidateCache(gameId);
            }
        } catch (e) {
            console.warn('Failed to submit score to Firebase:', e);
        }

        // Emit event with isNewBest flag
        eventBus.emit('scoreSubmitted', { gameId, score, isNewBest });

        return { submitted: true, isNewBest };
    }

    // ============ PRIVATE METHODS ============

    /**
     * Check if cache is still valid
     * @private
     */
    _isCacheValid(key) {
        if (!this.cache[key] || !this.lastFetch[key]) return false;
        return Date.now() - this.lastFetch[key] < this.cacheExpiry;
    }

    /**
     * Invalidate cache for a game
     * @private
     */
    _invalidateCache(gameId) {
        Object.keys(this.cache).forEach(key => {
            if (key.startsWith(gameId) || key.startsWith('global')) {
                delete this.cache[key];
                delete this.lastFetch[key];
            }
        });
    }

    /**
     * Get local leaderboard (single user)
     * @private
     */
    _getLocalLeaderboard(gameId) {
        const stats = globalStateManager.getStatistics();
        const profile = globalStateManager.getProfile();
        const gameStats = stats.gameStats[gameId];

        if (!gameStats || gameStats.highScore <= 0) {
            return [];
        }

        return [{
            rank: 1,
            name: profile.displayName,
            score: gameStats.highScore,
            level: profile.level,
            isCurrentUser: true
        }];
    }

    /**
     * Get local global leaderboard (single user)
     * @private
     */
    _getLocalGlobalLeaderboard() {
        const stats = globalStateManager.getStatistics();
        const profile = globalStateManager.getProfile();

        if (stats.totalScore <= 0) {
            return [];
        }

        return [{
            rank: 1,
            name: profile.displayName,
            score: stats.totalScore,
            level: profile.level,
            isCurrentUser: true
        }];
    }

    /**
     * Get user's global rank
     * @private
     */
    async _getUserGlobalRank() {
        if (!firebaseService.isSignedIn() || !firebaseService.db) {
            return null;
        }

        try {
            const user = firebaseService.getCurrentUser();
            const stats = globalStateManager.getStatistics();
            
            // Count users with higher score (field is at root level, not nested)
            const db = firebaseService.db;
            const snapshot = await db.collection('users')
                .where('totalScore', '>', stats.totalScore)
                .get();

            return snapshot.size + 1;
        } catch (e) {
            console.warn('[LeaderboardService] Failed to get user rank:', e.message);
            return null;
        }
    }

    /**
     * Clear all cache
     */
    clearCache() {
        this.cache = {};
        this.lastFetch = {};
    }
}

// Singleton instance
export const leaderboardService = new LeaderboardService();
export default LeaderboardService;
