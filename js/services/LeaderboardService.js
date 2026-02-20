/**
 * LeaderboardService - Global Leaderboard Management
 * Cross-game rankings, personal bests, and score submission
 */
import { eventBus } from '../engine/EventBus.js';
import { firebaseService } from '../engine/FirebaseService.js';
import { globalStateManager, GAME_IDS } from './GlobalStateManager.js';
import { publicProfileService } from './PublicProfileService.js';
import { leaderboardCache, requestDeduplicator } from '../utils/cache.js';

// Leaderboard time periods
export const TIME_PERIODS = {
    ALL_TIME: 'allTime',
    WEEKLY: 'weekly',
    DAILY: 'daily'
};

class LeaderboardService {
    constructor() {
        this.cache = {};
        this.cacheExpiry = 300000; // 5 minute cache
        this.lastFetch = {};
        this.paginationState = new Map(); // Store cursors for pagination
    }

    /**
     * Initialize the leaderboard service
     */
    init() {
        console.log('LeaderboardService initialized');
    }

    // ============ PUBLIC METHODS ============

    /**
     * Get leaderboard for a specific game with pagination support
     * @param {string} gameId
     * @param {string} period - 'allTime', 'weekly', 'daily'
     * @param {Object} options - { limit: number, page: number, useCache: boolean }
     * @returns {Promise<{scores: Object[], nextCursor: any, hasMore: boolean}>}
     */
    async getGameLeaderboard(gameId, period = TIME_PERIODS.ALL_TIME, options = {}) {
        const { limit = 20, page = 1, useCache = true } = options;
        const cacheKey = `${gameId}_${period}_page${page}`;
        
        // Check MemoryCache first (Phase 3 enhancement)
        if (useCache) {
            const cached = leaderboardCache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        try {
            // Use request deduplication to prevent duplicate concurrent requests
            const fetchKey = `leaderboard_${cacheKey}`;
            return await requestDeduplicator.execute(fetchKey, async () => {
                if (firebaseService.db) {
                    const db = firebaseService.db;
                    const currentUserId = firebaseService.getCurrentUser()?.uid;
                    
                    let query = db.collection('scores')
                        .where('gameId', '==', gameId)
                        .orderBy('score', 'desc')
                        .limit(limit);

                    // Apply cursor for pagination
                    const cursorKey = `${gameId}_${period}`;
                    const cursors = this.paginationState.get(cursorKey) || [];
                    if (page > 1 && cursors[page - 2]) {
                        query = query.startAfter(cursors[page - 2]);
                    }

                    const snapshot = await query.get();
                    const scores = [];
                    
                    snapshot.docs.forEach((doc, index) => {
                        const data = doc.data();
                        scores.push({
                            rank: (page - 1) * limit + index + 1,
                            name: data.displayName || 'Player',
                            avatar: data.avatar || 'gamepad',
                            score: data.score || 0,
                            userId: data.userId,
                            isCurrentUser: currentUserId ? data.userId === currentUserId : false,
                            timestamp: data.timestamp?.toDate?.() || data.timestamp
                        });
                    });

                    // Store cursor for next page
                    if (snapshot.docs.length > 0) {
                        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
                        if (!cursors[page - 1]) {
                            cursors[page - 1] = lastDoc;
                            this.paginationState.set(cursorKey, cursors);
                        }
                    }

                    const result = {
                        scores,
                        nextCursor: snapshot.docs.length === limit ? page + 1 : null,
                        hasMore: snapshot.docs.length === limit,
                        page
                    };

                    // Cache with short TTL for leaderboard freshness
                    leaderboardCache.set(cacheKey, result, 60000); // 1 minute
                    
                    return result;
                }
                
                // Fallback to local data
                return {
                    scores: this._getLocalLeaderboard(gameId),
                    nextCursor: null,
                    hasMore: false,
                    page: 1
                };
            });
        } catch (e) {
            console.warn('[LeaderboardService] Failed to fetch game leaderboard:', e.message);
            return {
                scores: this._getLocalLeaderboard(gameId),
                nextCursor: null,
                hasMore: false,
                page: 1
            };
        }
    }

    /**
     * Get paginated global leaderboard
     * @param {Object} options - { limit: number, page: number }
     * @returns {Promise<{scores: Object[], nextCursor: any, hasMore: boolean}>}
     */
    async getGlobalLeaderboardPaginated(options = {}) {
        const { limit = 20, page = 1 } = options;
        const cacheKey = `global_paginated_page${page}`;
        
        const cached = leaderboardCache.get(cacheKey);
        if (cached) return cached;

        try {
            const fetchKey = `global_leaderboard_${page}`;
            return await requestDeduplicator.execute(fetchKey, async () => {
                if (!firebaseService.db) {
                    return {
                        scores: this._getLocalGlobalLeaderboard(),
                        nextCursor: null,
                        hasMore: false,
                        page: 1
                    };
                }

                const db = firebaseService.db;
                const currentUserId = firebaseService.getCurrentUser()?.uid;
                
                let query = db.collection('publicProfiles')
                    .orderBy('totalScore', 'desc')
                    .limit(limit);

                // Apply cursor
                const cursors = this.paginationState.get('global') || [];
                if (page > 1 && cursors[page - 2]) {
                    query = query.startAfter(cursors[page - 2]);
                }

                const snapshot = await query.get();
                const scores = snapshot.docs.map((doc, index) => {
                    const data = doc.data();
                    return {
                        rank: (page - 1) * limit + index + 1,
                        name: data.displayName || 'Player',
                        avatar: data.avatar || 'gamepad',
                        score: data.totalScore || 0,
                        level: data.level || 1,
                        title: data.title || 'Player',
                        userId: doc.id,
                        isCurrentUser: currentUserId ? doc.id === currentUserId : false
                    };
                });

                // Store cursor
                if (snapshot.docs.length > 0) {
                    cursors[page - 1] = snapshot.docs[snapshot.docs.length - 1];
                    this.paginationState.set('global', cursors);
                }

                const result = {
                    scores,
                    nextCursor: snapshot.docs.length === limit ? page + 1 : null,
                    hasMore: snapshot.docs.length === limit,
                    page
                };

                leaderboardCache.set(cacheKey, result, 60000);
                return result;
            });
        } catch (e) {
            console.warn('[LeaderboardService] Failed to fetch paginated leaderboard:', e);
            return {
                scores: this._getLocalGlobalLeaderboard(),
                nextCursor: null,
                hasMore: false,
                page: 1
            };
        }
    }

    /**
     * Get combined leaderboard across all games (total score)
     * @param {number} limit
     * @returns {Promise<Object[]>}
     */
    async getGlobalLeaderboard(limit = 10) {
        const result = await this.getGlobalLeaderboardPaginated({ limit, page: 1 });
        return result.scores;
    }

    /**
     * Reset pagination state for a leaderboard
     * @param {string} gameId - 'global' for global leaderboard
     */
    resetPagination(gameId = 'global') {
        this.paginationState.delete(gameId);
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
     * Falls back to client-side validation if Cloud Functions unavailable
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
                // Validate score client-side first (anti-cheat)
                const validation = this._validateScoreClientSide(gameId, score);
                if (!validation.valid) {
                    console.warn('[LeaderboardService] Score validation failed:', validation.errors);
                    return { submitted: false, isNewBest: false, error: validation.errors };
                }
                
                // Try Cloud Functions first (if available)
                try {
                    const result = await firebaseService.submitScoreWithTransaction(gameId, score, metadata);
                    isNewBest = result.isNewBest || false;
                } catch (cloudError) {
                    // Cloud Functions not available, use direct Firestore write
                    console.log('[LeaderboardService] Using client-side submission (Cloud Functions unavailable)');
                    const result = await this._submitScoreDirect(gameId, score, metadata);
                    isNewBest = result.isNewBest || false;
                }
                
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

    /**
     * Client-side score validation (fallback when Cloud Functions unavailable)
     * @private
     */
    _validateScoreClientSide(gameId, score) {
        const result = { valid: false, errors: [] };
        
        // Must be a number
        if (typeof score !== 'number' || isNaN(score)) {
            result.errors.push('Score must be a number');
            return result;
        }
        
        // Must be non-negative
        if (score < 0) {
            result.errors.push('Score cannot be negative');
            return result;
        }
        
        // Must be integer
        if (!Number.isInteger(score)) {
            result.errors.push('Score must be an integer');
            return result;
        }
        
        // Game-specific max scores (anti-cheat)
        const maxScores = {
            'snake': 1000000,
            '2048': 10000000,
            'breakout': 500000,
            'tetris': 5000000,
            'minesweeper': 100000,
            'pacman': 2000000,
            'asteroids': 1000000,
            'tower-defense': 10000000,
            'rhythm': 1000000,
            'roguelike': 500000,
            'toonshooter': 1000000
        };
        
        const maxScore = maxScores[gameId] || 1000000;
        if (score > maxScore) {
            result.errors.push(`Score exceeds maximum for ${gameId}`);
            return result;
        }
        
        result.valid = true;
        return result;
    }

    /**
     * Direct Firestore score submission (fallback when Cloud Functions unavailable)
     * @private
     */
    async _submitScoreDirect(gameId, score, metadata = {}) {
        if (!firebaseService.db || !firebaseService.isSignedIn()) {
            return { submitted: false, isNewBest: false };
        }

        const user = firebaseService.getCurrentUser();
        const scoreDoc = {
            gameId,
            score,
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userPhoto: user.photoURL || null,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            verified: false, // Mark as unverified (no server validation)
            ...metadata
        };

        // Add to scores collection
        await firebaseService.db.collection('scores').add(scoreDoc);

        // Update personal best
        const userRef = firebaseService.db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        const currentBest = userDoc.exists ? (userDoc.data().highScores?.[gameId] || 0) : 0;
        
        const isNewBest = score > currentBest;
        if (isNewBest) {
            await userRef.set({
                highScores: { [gameId]: score }
            }, { merge: true });
        }

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
            
            // Count users with higher score using publicProfiles
            const db = firebaseService.db;
            const snapshot = await db.collection('publicProfiles')
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
