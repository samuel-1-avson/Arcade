/**
 * DailyChallengeSystem - Shared logic for daily gamemodes
 * deterministically generates seeds and tracks completion
 */
import { storageManager } from './StorageManager.js';

class DailyChallengeSystem {
    constructor() {
        this.currentDate = new Date().toISOString().split('T')[0];
    }

    /**
     * Get the deterministic seed for today (or a specific date)
     * @param {string} [dateString] - YYYY-MM-DD, defaults to today
     * @returns {number} Integer seed
     */
    getSeed(dateString = null) {
        const date = dateString || this.currentDate;
        // Simple hash of the date string
        let hash = 0;
        for (let i = 0; i < date.length; i++) {
            const char = date.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Get completion status for a game
     * @param {string} gameId 
     * @returns {Object} { completed: boolean, highScore: number, attempts: number }
     */
    getStatus(gameId) {
        const key = `daily_${gameId}_${this.currentDate}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored);
        }
        return { completed: false, highScore: 0, attempts: 0 };
    }

    /**
     * Register a result for a daily challenge
     * @param {string} gameId 
     * @param {number} score 
     * @param {number} targetScore - Score needed to 'complete' the challenge
     */
    submitResult(gameId, score, targetScore) {
        const status = this.getStatus(gameId);
        
        status.attempts++;
        status.highScore = Math.max(status.highScore, score);
        
        if (score >= targetScore) {
            status.completed = true;
        }

        const key = `daily_${gameId}_${this.currentDate}`;
        localStorage.setItem(key, JSON.stringify(status));
        
        return status;
    }

    /**
     * Check if user played yesterday (for streaks)
     * @param {string} gameId 
     */
    checkStreak(gameId) {
        // Implementation for streak tracking could go here
        // Checking previous keys: `daily_${gameId}_${yesterdayDate}`
        return 0; 
    }
}

export const dailyChallengeSystem = new DailyChallengeSystem();
export default dailyChallengeSystem;
