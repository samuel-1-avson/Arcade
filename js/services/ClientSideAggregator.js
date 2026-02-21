/**
 * Client-Side Leaderboard Aggregator
 * Replaces Cloud Functions leaderboard aggregation for free tier
 * Runs in browser to calculate rankings from Firestore data
 */

import { firebaseService } from '../engine/FirebaseService.js';
import { eventBus } from '../engine/EventBus.js';
import { GAME_IDS } from '../config/gameRegistry.js';
import { logger, LogCategory } from '../utils/logger.js';

class ClientSideAggregator {
    constructor() {
        this.aggregatedLeaderboards = new Map();
        this.lastAggregation = new Map();
        this.aggregationInterval = 5 * 60 * 1000; // 5 minutes
        this.isAggregating = false;
    }

    /**
     * Initialize aggregator
     */
    init() {
        logger.info(LogCategory.ANALYTICS, '[ClientSideAggregator] Initialized');
        
        // Aggregate on score submission
        eventBus.on('scoreSubmitted', () => {
            this.scheduleAggregation();
        });

        // Initial aggregation after 10 seconds
        setTimeout(() => this.aggregateAll(), 10000);
    }

    /**
     * Schedule aggregation with debounce
     */
    scheduleAggregation() {
        if (this.aggregationTimeout) {
            clearTimeout(this.aggregationTimeout);
        }
        
        this.aggregationTimeout = setTimeout(() => {
            this.aggregateAll();
        }, 5000); // Wait 5 seconds after last score
    }

    /**
     * Aggregate all leaderboards
     */
    async aggregateAll() {
        if (this.isAggregating) return;
        this.isAggregating = true;

        logger.info(LogCategory.ANALYTICS, '[ClientSideAggregator] Starting aggregation...');
        
        try {
            // Aggregate each game's leaderboard
            for (const gameId of GAME_IDS) {
                await this.aggregateGameLeaderboard(gameId);
            }

            // Aggregate global leaderboard
            await this.aggregateGlobalLeaderboard();

            logger.info(LogCategory.ANALYTICS, '[ClientSideAggregator] Aggregation complete');
            eventBus.emit('leaderboardsUpdated', { source: 'client-aggregator' });
        } catch (error) {
            logger.error(LogCategory.ANALYTICS, '[ClientSideAggregator] Error:', error);
        } finally {
            this.isAggregating = false;
        }
    }

    /**
     * Aggregate leaderboard for a specific game
     */
    async aggregateGameLeaderboard(gameId) {
        try {
            const db = firebaseService.db;
            if (!db) return;

            // Check if we need to re-aggregate
            const lastAgg = this.lastAggregation.get(gameId);
            if (lastAgg && Date.now() - lastAgg < this.aggregationInterval) {
                return;
            }

            // Fetch all scores for this game
            const snapshot = await db.collection('scores')
                .where('gameId', '==', gameId)
                .orderBy('score', 'desc')
                .limit(100)
                .get();

            // Process scores (keep best per user)
            const userBestScores = new Map();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const userId = data.userId;
                
                if (!userBestScores.has(userId) || userBestScores.get(userId).score < data.score) {
                    userBestScores.set(userId, {
                        userId,
                        userName: data.userName || 'Anonymous',
                        userPhoto: data.userPhoto || null,
                        score: data.score,
                        timestamp: data.timestamp?.toMillis?.() || Date.now()
                    });
                }
            });

            // Convert to array and sort
            const leaderboard = Array.from(userBestScores.values())
                .sort((a, b) => b.score - a.score)
                .slice(0, 50)
                .map((entry, index) => ({
                    rank: index + 1,
                    ...entry
                }));

            // Store aggregated data
            this.aggregatedLeaderboards.set(gameId, leaderboard);
            this.lastAggregation.set(gameId, Date.now());

            // Update localStorage cache
            this.cacheLeaderboard(gameId, leaderboard);

        } catch (error) {
            logger.error(LogCategory.ANALYTICS, `[ClientSideAggregator] Error aggregating ${gameId}:`, error);
        }
    }

    /**
     * Aggregate global leaderboard (total scores across all games)
     */
    async aggregateGlobalLeaderboard() {
        try {
            const db = firebaseService.db;
            if (!db) return;

            // Check cache
            const lastAgg = this.lastAggregation.get('global');
            if (lastAgg && Date.now() - lastAgg < this.aggregationInterval) {
                return;
            }

            // Fetch all scores
            const snapshot = await db.collection('scores')
                .orderBy('score', 'desc')
                .limit(200)
                .get();

            // Calculate total score per user across all games
            const userTotals = new Map();

            snapshot.forEach(doc => {
                const data = doc.data();
                const userId = data.userId;
                
                if (!userTotals.has(userId)) {
                    userTotals.set(userId, {
                        userId,
                        userName: data.userName || 'Anonymous',
                        userPhoto: data.userPhoto || null,
                        totalScore: 0,
                        gamesPlayed: new Set()
                    });
                }

                const user = userTotals.get(userId);
                user.totalScore += data.score;
                user.gamesPlayed.add(data.gameId);
            });

            // Convert to array and sort
            const leaderboard = Array.from(userTotals.values())
                .map(entry => ({
                    ...entry,
                    gamesPlayed: entry.gamesPlayed.size
                }))
                .sort((a, b) => b.totalScore - a.totalScore)
                .slice(0, 50)
                .map((entry, index) => ({
                    rank: index + 1,
                    ...entry
                }));

            this.aggregatedLeaderboards.set('global', leaderboard);
            this.lastAggregation.set('global', Date.now());

            this.cacheLeaderboard('global', leaderboard);

        } catch (error) {
            logger.error(LogCategory.ANALYTICS, '[ClientSideAggregator] Error aggregating global:', error);
        }
    }

    /**
     * Cache leaderboard to localStorage
     */
    cacheLeaderboard(gameId, leaderboard) {
        try {
            const cacheKey = `arcadeHub_leaderboard_${gameId}`;
            localStorage.setItem(cacheKey, JSON.stringify({
                data: leaderboard,
                timestamp: Date.now()
            }));
        } catch (e) {
            logger.warn(LogCategory.ANALYTICS, '[ClientSideAggregator] Cache error:', e);
        }
    }

    /**
     * Get cached leaderboard
     */
    getCachedLeaderboard(gameId) {
        try {
            const cacheKey = `arcadeHub_leaderboard_${gameId}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                // Cache valid for 10 minutes
                if (Date.now() - timestamp < 600000) {
                    return data;
                }
            }
        } catch (e) {
            logger.warn(LogCategory.ANALYTICS, '[ClientSideAggregator] Cache read error:', e);
        }
        return null;
    }

    /**
     * Get leaderboard (from memory, cache, or trigger aggregation)
     */
    async getLeaderboard(gameId) {
        // Check memory
        const memory = this.aggregatedLeaderboards.get(gameId);
        if (memory) return memory;

        // Check cache
        const cache = this.getCachedLeaderboard(gameId);
        if (cache) {
            this.aggregatedLeaderboards.set(gameId, cache);
            return cache;
        }

        // Trigger aggregation
        await this.aggregateGameLeaderboard(gameId);
        return this.aggregatedLeaderboards.get(gameId) || [];
    }

    /**
     * Get user's rank for a game
     */
    async getUserRank(gameId, userId) {
        const leaderboard = await this.getLeaderboard(gameId);
        const entry = leaderboard.find(e => e.userId === userId);
        return entry?.rank || null;
    }

    /**
     * Force refresh all leaderboards
     */
    async refreshAll() {
        this.lastAggregation.clear();
        await this.aggregateAll();
    }

    /**
     * Get aggregation status
     */
    getStatus() {
        return {
            isAggregating: this.isAggregating,
            lastAggregation: Object.fromEntries(this.lastAggregation),
            cachedLeaderboards: Array.from(this.aggregatedLeaderboards.keys())
        };
    }
}

// Singleton
export const clientSideAggregator = new ClientSideAggregator();
export default ClientSideAggregator;
