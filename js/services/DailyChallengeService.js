/**
 * DailyChallengeService - Hub-Wide Daily & Weekly Challenges
 * Cross-game challenges that reset daily and weekly
 */
import { eventBus } from '../engine/EventBus.js';
import { globalStateManager } from './GlobalStateManager.js';
import { notificationService } from './NotificationService.js';
import { logger, LogCategory } from '../utils/logger.js';

// Daily challenge templates
const DAILY_CHALLENGE_TEMPLATES = [
    { type: 'play_games', desc: 'Play {value} different games', values: [2, 3, 4], track: 'gamesPlayedToday' },
    { type: 'earn_achievements', desc: 'Unlock {value} achievements', values: [1, 2, 3], track: 'achievementsToday' },
    { type: 'total_score', desc: 'Score {value} points across all games', values: [1000, 2500, 5000], track: 'scoreToday' },
    { type: 'play_time', desc: 'Play for {value} minutes', values: [10, 20, 30], track: 'playTimeToday' },
    { type: 'games_played', desc: 'Play {value} game sessions', values: [3, 5, 7], track: 'sessionsToday' }
];

// Weekly challenge templates
const WEEKLY_CHALLENGE_TEMPLATES = [
    { name: 'Game Explorer', desc: 'Play 7 different games this week', target: 7, track: 'uniqueGamesWeek', reward: 300 },
    { name: 'Achievement Spree', desc: 'Unlock 10 achievements this week', target: 10, track: 'achievementsWeek', reward: 400 },
    { name: 'Arcade Marathon', desc: 'Play for 2 hours total this week', target: 7200, track: 'playTimeWeek', reward: 350 },
    { name: 'Score Rush', desc: 'Accumulate 25,000 points this week', target: 25000, track: 'scoreWeek', reward: 450 },
    { name: 'Daily Devotion', desc: 'Complete 5 daily challenges this week', target: 5, track: 'dailiesCompletedWeek', reward: 500 }
];

class DailyChallengeService {
    constructor() {
        this.currentDaily = null;
        this.currentWeekly = null;
        this.progressData = {
            // Daily trackers
            gamesPlayedToday: new Set(),
            achievementsToday: 0,
            scoreToday: 0,
            playTimeToday: 0,
            sessionsToday: 0,
            // Weekly trackers
            uniqueGamesWeek: new Set(),
            achievementsWeek: 0,
            playTimeWeek: 0,
            scoreWeek: 0,
            dailiesCompletedWeek: 0,
            // Metadata
            lastDailyReset: null,
            lastWeeklyReset: null,
            dailyCompleted: false,
            weeklyCompleted: false
        };

        this._loadProgress();
        this._checkAndResetChallenges();
        this._setupEventListeners();
    }

    /**
     * Initialize the challenge service
     */
    init() {
        this._checkAndResetChallenges();
        logger.info(LogCategory.GAME, 'DailyChallengeService initialized');
    }

    // ============ PUBLIC METHODS ============

    /**
     * Get current daily challenge
     * @returns {Object|null}
     */
    getCurrentDaily() {
        if (!this.currentDaily) return null;

        const progress = this._getDailyChallengeProgress();
        return {
            ...this.currentDaily,
            progress,
            completed: this.progressData.dailyCompleted,
            remaining: this._getTimeUntilDailyReset()
        };
    }

    /**
     * Get current weekly challenge
     * @returns {Object|null}
     */
    getCurrentWeekly() {
        if (!this.currentWeekly) return null;

        const progress = this._getWeeklyChallengeProgress();
        return {
            ...this.currentWeekly,
            progress,
            completed: this.progressData.weeklyCompleted,
            remaining: this._getTimeUntilWeeklyReset()
        };
    }

    /**
     * Record a game being played
     * @param {string} gameId
     */
    recordGamePlay(gameId) {
        this.progressData.gamesPlayedToday.add(gameId);
        this.progressData.uniqueGamesWeek.add(gameId);
        this.progressData.sessionsToday++;
        this._checkDailyCompletion();
        this._saveProgress();
    }

    /**
     * Record an achievement unlock
     */
    recordAchievement() {
        this.progressData.achievementsToday++;
        this.progressData.achievementsWeek++;
        this._checkDailyCompletion();
        this._checkWeeklyCompletion();
        this._saveProgress();
    }

    /**
     * Record score earned
     * @param {number} score
     */
    recordScore(score) {
        this.progressData.scoreToday += score;
        this.progressData.scoreWeek += score;
        this._checkDailyCompletion();
        this._checkWeeklyCompletion();
        this._saveProgress();
    }

    /**
     * Record play time
     * @param {number} seconds
     */
    recordPlayTime(seconds) {
        this.progressData.playTimeToday += seconds;
        this.progressData.playTimeWeek += seconds;
        this._checkDailyCompletion();
        this._checkWeeklyCompletion();
        this._saveProgress();
    }

    /**
     * Get all challenge information for UI
     * @returns {Object}
     */
    getChallengeInfo() {
        return {
            daily: this.getCurrentDaily(),
            weekly: this.getCurrentWeekly(),
            dailyStreak: this.progressData.dailiesCompletedWeek
        };
    }

    // ============ PRIVATE METHODS ============

    /**
     * Load progress from storage
     * @private
     */
    _loadProgress() {
        try {
            const saved = localStorage.getItem('arcadeHub_challenges');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.progressData = {
                    ...this.progressData,
                    ...parsed,
                    gamesPlayedToday: new Set(parsed.gamesPlayedToday || []),
                    uniqueGamesWeek: new Set(parsed.uniqueGamesWeek || [])
                };
                this.currentDaily = parsed.currentDaily || null;
                this.currentWeekly = parsed.currentWeekly || null;
            }
        } catch (e) {
            logger.warn(LogCategory.GAME, 'Failed to load challenge progress:', e);
        }
    }

    /**
     * Save progress to storage
     * @private
     */
    _saveProgress() {
        try {
            localStorage.setItem('arcadeHub_challenges', JSON.stringify({
                ...this.progressData,
                gamesPlayedToday: [...this.progressData.gamesPlayedToday],
                uniqueGamesWeek: [...this.progressData.uniqueGamesWeek],
                currentDaily: this.currentDaily,
                currentWeekly: this.currentWeekly
            }));
        } catch (e) {
            logger.warn(LogCategory.GAME, 'Failed to save challenge progress:', e);
        }
    }

    /**
     * Check and reset challenges if needed
     * @private
     */
    _checkAndResetChallenges() {
        const now = new Date();
        const today = now.toDateString();
        const currentWeek = this._getWeekNumber(now);

        // Check daily reset
        if (this.progressData.lastDailyReset !== today) {
            this._resetDaily();
            this.progressData.lastDailyReset = today;
        }

        // Check weekly reset (Monday)
        const lastWeek = this.progressData.lastWeeklyReset 
            ? this._getWeekNumber(new Date(this.progressData.lastWeeklyReset))
            : null;

        if (lastWeek !== currentWeek) {
            this._resetWeekly();
            this.progressData.lastWeeklyReset = now.toISOString();
        }

        this._saveProgress();
    }

    /**
     * Reset daily challenge
     * @private
     */
    _resetDaily() {
        // Generate new random daily challenge
        const template = DAILY_CHALLENGE_TEMPLATES[
            Math.floor(Math.random() * DAILY_CHALLENGE_TEMPLATES.length)
        ];
        const difficultyIndex = Math.floor(Math.random() * template.values.length);
        const value = template.values[difficultyIndex];

        this.currentDaily = {
            type: template.type,
            description: template.desc.replace('{value}', value),
            target: value,
            track: template.track,
            reward: 50 + (difficultyIndex * 25), // 50, 75, or 100 XP
            generatedAt: new Date().toISOString()
        };

        // Reset daily progress
        this.progressData.gamesPlayedToday = new Set();
        this.progressData.achievementsToday = 0;
        this.progressData.scoreToday = 0;
        this.progressData.playTimeToday = 0;
        this.progressData.sessionsToday = 0;
        this.progressData.dailyCompleted = false;
    }

    /**
     * Reset weekly challenge
     * @private
     */
    _resetWeekly() {
        // Generate new random weekly challenge
        const template = WEEKLY_CHALLENGE_TEMPLATES[
            Math.floor(Math.random() * WEEKLY_CHALLENGE_TEMPLATES.length)
        ];

        this.currentWeekly = {
            name: template.name,
            description: template.desc,
            target: template.target,
            track: template.track,
            reward: template.reward,
            generatedAt: new Date().toISOString()
        };

        // Reset weekly progress
        this.progressData.uniqueGamesWeek = new Set();
        this.progressData.achievementsWeek = 0;
        this.progressData.playTimeWeek = 0;
        this.progressData.scoreWeek = 0;
        this.progressData.dailiesCompletedWeek = 0;
        this.progressData.weeklyCompleted = false;
    }

    /**
     * Get current progress for daily challenge
     * @private
     */
    _getDailyChallengeProgress() {
        if (!this.currentDaily) return 0;

        const track = this.currentDaily.track;
        let current = 0;

        switch (track) {
            case 'gamesPlayedToday':
                current = this.progressData.gamesPlayedToday.size;
                break;
            case 'achievementsToday':
                current = this.progressData.achievementsToday;
                break;
            case 'scoreToday':
                current = this.progressData.scoreToday;
                break;
            case 'playTimeToday':
                current = Math.floor(this.progressData.playTimeToday / 60); // Convert to minutes
                break;
            case 'sessionsToday':
                current = this.progressData.sessionsToday;
                break;
        }

        return Math.min(1, current / this.currentDaily.target);
    }

    /**
     * Get current progress for weekly challenge
     * @private
     */
    _getWeeklyChallengeProgress() {
        if (!this.currentWeekly) return 0;

        const track = this.currentWeekly.track;
        let current = 0;

        switch (track) {
            case 'uniqueGamesWeek':
                current = this.progressData.uniqueGamesWeek.size;
                break;
            case 'achievementsWeek':
                current = this.progressData.achievementsWeek;
                break;
            case 'playTimeWeek':
                current = this.progressData.playTimeWeek;
                break;
            case 'scoreWeek':
                current = this.progressData.scoreWeek;
                break;
            case 'dailiesCompletedWeek':
                current = this.progressData.dailiesCompletedWeek;
                break;
        }

        return Math.min(1, current / this.currentWeekly.target);
    }

    /**
     * Check if daily challenge is completed
     * @private
     */
    _checkDailyCompletion() {
        if (this.progressData.dailyCompleted || !this.currentDaily) return;

        const progress = this._getDailyChallengeProgress();
        if (progress >= 1) {
            this.progressData.dailyCompleted = true;
            this.progressData.dailiesCompletedWeek++;

            // Award XP
            globalStateManager.addXP(this.currentDaily.reward);

            // Show notification
            notificationService.showChallengeComplete({
                name: 'Daily Challenge',
                reward: this.currentDaily.reward
            });

            // Emit event
            eventBus.emit('dailyChallengeComplete', this.currentDaily);

            // Check weekly completion
            this._checkWeeklyCompletion();

            this._saveProgress();
        }
    }

    /**
     * Check if weekly challenge is completed
     * @private
     */
    _checkWeeklyCompletion() {
        if (this.progressData.weeklyCompleted || !this.currentWeekly) return;

        const progress = this._getWeeklyChallengeProgress();
        if (progress >= 1) {
            this.progressData.weeklyCompleted = true;

            // Award XP
            globalStateManager.addXP(this.currentWeekly.reward);

            // Show notification
            notificationService.showChallengeComplete({
                name: `Weekly: ${this.currentWeekly.name}`,
                reward: this.currentWeekly.reward
            });

            // Emit event
            eventBus.emit('weeklyChallengeComplete', this.currentWeekly);

            this._saveProgress();
        }
    }

    /**
     * Get time until daily reset (midnight)
     * @private
     */
    _getTimeUntilDailyReset() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const ms = tomorrow - now;
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }

    /**
     * Get time until weekly reset (Monday)
     * @private
     */
    _getTimeUntilWeeklyReset() {
        const now = new Date();
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        const nextMonday = new Date(now);
        nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
        nextMonday.setHours(0, 0, 0, 0);
        
        const ms = nextMonday - now;
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        return `${days}d ${hours}h`;
    }

    /**
     * Get ISO week number
     * @private
     */
    _getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        // Listen for game sessions
        eventBus.on('globalStateChange', ({ type, data }) => {
            if (type === 'session') {
                this.recordGamePlay(data.gameId);
                if (data.sessionData?.score) {
                    this.recordScore(data.sessionData.score);
                }
                if (data.sessionData?.duration) {
                    this.recordPlayTime(data.sessionData.duration);
                }
            } else if (type === 'achievement') {
                this.recordAchievement();
            }
        });

        // Check reset on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this._checkAndResetChallenges();
            }
        });
    }

    /**
     * Clear all challenge data (for testing)
     */
    clearAll() {
        localStorage.removeItem('arcadeHub_challenges');
        this.currentDaily = null;
        this.currentWeekly = null;
        this.progressData = {
            gamesPlayedToday: new Set(),
            achievementsToday: 0,
            scoreToday: 0,
            playTimeToday: 0,
            sessionsToday: 0,
            uniqueGamesWeek: new Set(),
            achievementsWeek: 0,
            playTimeWeek: 0,
            scoreWeek: 0,
            dailiesCompletedWeek: 0,
            lastDailyReset: null,
            lastWeeklyReset: null,
            dailyCompleted: false,
            weeklyCompleted: false
        };
        this._checkAndResetChallenges();
    }
}

// Singleton instance
export const dailyChallengeService = new DailyChallengeService();
export default DailyChallengeService;
