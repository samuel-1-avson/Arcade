/**
 * TournamentRecommender - Smart Tournament Recommendation System
 * Suggests tournaments based on user preferences and play history
 */
import { tournamentService } from './TournamentService.js';
import { globalStateManager } from './GlobalStateManager.js';
import { eventBus } from '../engine/EventBus.js';

class TournamentRecommender {
    constructor() {
        this.preferences = null;
        this.lastUpdate = 0;
    }

    /**
     * Get recommended tournaments for the current user
     * @param {number} limit - Max recommendations
     * @returns {Array} Sorted array of recommended tournaments
     */
    getRecommendations(limit = 5) {
        this.preferences = this.analyzeUserPreferences();
        const openTournaments = tournamentService.getOpenTournaments();
        
        if (openTournaments.length === 0) return [];

        // Score and sort tournaments
        const scored = openTournaments
            .map(t => ({
                ...t,
                matchScore: this.calculateMatchScore(t),
                reasons: this.getMatchReasons(t)
            }))
            .sort((a, b) => b.matchScore - a.matchScore);

        return scored.slice(0, limit);
    }

    /**
     * Analyze user's game preferences from play history
     * @returns {Object} User preference profile
     */
    analyzeUserPreferences() {
        const stats = globalStateManager.getStatistics();
        const gameStats = stats.gameStats || {};
        
        // Calculate per-game play counts and scores
        const gamePlays = {};
        const gameScores = {};
        
        Object.entries(gameStats).forEach(([gameId, data]) => {
            gamePlays[gameId] = data.gamesPlayed || 0;
            gameScores[gameId] = data.highScore || 0;
        });

        // Find most-played games
        const sortedGames = Object.entries(gamePlays)
            .sort((a, b) => b[1] - a[1]);
        
        const favoriteGames = sortedGames.slice(0, 3).map(g => g[0]);
        const totalGamesPlayed = Object.values(gamePlays).reduce((a, b) => a + b, 0);

        return {
            favoriteGames,
            gamePlays,
            gameScores,
            totalGamesPlayed,
            experience: this.calculateExperienceLevel(totalGamesPlayed)
        };
    }

    /**
     * Calculate experience level from play count
     * @param {number} totalGames
     * @returns {string} Experience level
     */
    calculateExperienceLevel(totalGames) {
        if (totalGames >= 100) return 'veteran';
        if (totalGames >= 50) return 'experienced';
        if (totalGames >= 20) return 'intermediate';
        if (totalGames >= 5) return 'beginner';
        return 'newcomer';
    }

    /**
     * Calculate match score for a tournament
     * @param {Object} tournament
     * @returns {number} Score 0-1
     */
    calculateMatchScore(tournament) {
        if (!this.preferences) return 0.5;

        let score = 0.5; // Base score

        // Favorite game bonus (+0.3 max)
        if (this.preferences.favoriteGames.includes(tournament.gameId)) {
            score += 0.3;
        }

        // Game played before bonus (+0.1)
        if (this.preferences.gamePlays[tournament.gameId] > 0) {
            score += 0.1;
        }

        // Size preference (prefer fuller tournaments)
        const fillRatio = tournament.participants.length / tournament.size;
        score += fillRatio * 0.1;

        // Not too full (can still join)
        if (fillRatio < 0.9) {
            score += 0.05;
        }

        return Math.min(1, score);
    }

    /**
     * Get human-readable match reasons
     * @param {Object} tournament
     * @returns {Array} Reasons why this tournament matches
     */
    getMatchReasons(tournament) {
        const reasons = [];
        
        if (!this.preferences) return ['Available now'];

        if (this.preferences.favoriteGames.includes(tournament.gameId)) {
            reasons.push('Your favorite game');
        }

        if (this.preferences.gamePlays[tournament.gameId] > 0) {
            reasons.push('Game you\'ve played');
        }

        const fillRatio = tournament.participants.length / tournament.size;
        if (fillRatio >= 0.5) {
            reasons.push('Almost full');
        }

        if (fillRatio < 0.5 && tournament.participants.length > 0) {
            reasons.push('Looking for players');
        }

        if (reasons.length === 0) {
            reasons.push('Available now');
        }

        return reasons;
    }

    /**
     * Get quick-join tournament (highest scoring that isn't full)
     * @returns {Object|null} Best tournament to join
     */
    getQuickJoin() {
        const recommendations = this.getRecommendations(1);
        return recommendations.length > 0 ? recommendations[0] : null;
    }

    /**
     * Get trending tournaments (most participants)
     * @param {number} limit
     * @returns {Array}
     */
    getTrendingTournaments(limit = 3) {
        const openTournaments = tournamentService.getOpenTournaments();
        
        return openTournaments
            .filter(t => t.participants.length > 0)
            .sort((a, b) => b.participants.length - a.participants.length)
            .slice(0, limit);
    }
}

// Singleton instance
export const tournamentRecommender = new TournamentRecommender();
export default TournamentRecommender;
