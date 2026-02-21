import { logger, LogCategory } from '../utils/logger.js';
/**
 * Rate Limiting Utility
 * Client-side rate limiting to prevent spam and abuse
 */

class RateLimiter {
    constructor() {
        this.actions = new Map();
        this.storageKey = 'arcadeHub_rateLimits';
        this.loadFromStorage();
    }

    /**
     * Load rate limit data from localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                // Convert timestamps back to Date objects
                for (const [key, value] of Object.entries(data)) {
                    this.actions.set(key, {
                        ...value,
                        timestamps: value.timestamps.map(t => new Date(t))
                    });
                }
            }
        } catch (e) {
            logger.warn(LogCategory.SERVICE, '[RateLimiter] Failed to load from storage:', e);
        }
    }

    /**
     * Save rate limit data to localStorage
     */
    saveToStorage() {
        try {
            const data = Object.fromEntries(this.actions);
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            logger.warn(LogCategory.SERVICE, '[RateLimiter] Failed to save to storage:', e);
        }
    }

    /**
     * Check if an action is allowed
     * @param {string} action - Action identifier (e.g., 'chat', 'score_submit')
     * @param {Object} options - Rate limit options
     * @returns {Object} - { allowed: boolean, remaining: number, resetTime: Date }
     */
    checkLimit(action, options = {}) {
        const {
            maxRequests = 10,
            windowMs = 60000, // 1 minute
            blockDurationMs = 300000 // 5 minutes block after exceeding
        } = options;

        const now = new Date();
        const key = `${action}_${this.getCurrentUserId()}`;
        
        let actionData = this.actions.get(key);
        if (!actionData) {
            actionData = {
                timestamps: [],
                blocked: false,
                blockUntil: null
            };
        }

        // Check if currently blocked
        if (actionData.blocked && actionData.blockUntil > now) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: actionData.blockUntil,
                blocked: true,
                reason: 'Rate limit exceeded. Please try again later.'
            };
        }

        // Clear block if expired
        if (actionData.blocked && actionData.blockUntil <= now) {
            actionData.blocked = false;
            actionData.blockUntil = null;
            actionData.timestamps = [];
        }

        // Clean old timestamps outside the window
        const windowStart = new Date(now - windowMs);
        actionData.timestamps = actionData.timestamps.filter(t => t > windowStart);

        // Check if limit exceeded
        if (actionData.timestamps.length >= maxRequests) {
            // Block the user
            actionData.blocked = true;
            actionData.blockUntil = new Date(now.getTime() + blockDurationMs);
            this.actions.set(key, actionData);
            this.saveToStorage();

            const oldestTimestamp = actionData.timestamps[0];
            const resetTime = new Date(oldestTimestamp.getTime() + windowMs);

            return {
                allowed: false,
                remaining: 0,
                resetTime,
                blocked: true,
                reason: `Rate limit exceeded. Limit: ${maxRequests} per ${windowMs / 1000}s. Blocked for ${blockDurationMs / 1000}s.`
            };
        }

        return {
            allowed: true,
            remaining: maxRequests - actionData.timestamps.length,
            resetTime: new Date(now.getTime() + windowMs),
            blocked: false
        };
    }

    /**
     * Record an action
     * @param {string} action - Action identifier
     */
    recordAction(action) {
        const key = `${action}_${this.getCurrentUserId()}`;
        let actionData = this.actions.get(key);
        
        if (!actionData) {
            actionData = {
                timestamps: [],
                blocked: false,
                blockUntil: null
            };
        }

        actionData.timestamps.push(new Date());
        this.actions.set(key, actionData);
        this.saveToStorage();
    }

    /**
     * Execute a function with rate limiting
     * @param {string} action - Action identifier
     * @param {Function} fn - Function to execute
     * @param {Object} options - Rate limit options
     * @returns {Promise} - Result of fn or error
     */
    async execute(action, fn, options = {}) {
        const check = this.checkLimit(action, options);
        
        if (!check.allowed) {
            const error = new Error(check.reason);
            error.rateLimited = true;
            error.resetTime = check.resetTime;
            throw error;
        }

        this.recordAction(action);
        return await fn();
    }

    /**
     * Get current user ID or 'anonymous'
     */
    getCurrentUserId() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            return user ? user.uid : 'anonymous';
        }
        return 'anonymous';
    }

    /**
     * Reset rate limits for an action
     * @param {string} action - Action identifier
     */
    reset(action) {
        const key = `${action}_${this.getCurrentUserId()}`;
        this.actions.delete(key);
        this.saveToStorage();
    }

    /**
     * Clear all rate limits
     */
    clearAll() {
        this.actions.clear();
        localStorage.removeItem(this.storageKey);
    }

    /**
     * Get current status of an action
     * @param {string} action - Action identifier
     * @param {Object} options - Rate limit options
     */
    getStatus(action, options = {}) {
        return this.checkLimit(action, options);
    }
}

// Predefined rate limits for common actions
export const RATE_LIMITS = {
    // Chat messages: 30 per minute
    CHAT: {
        maxRequests: 30,
        windowMs: 60000,
        blockDurationMs: 300000
    },
    
    // Score submissions: 60 per minute
    SCORE_SUBMIT: {
        maxRequests: 60,
        windowMs: 60000,
        blockDurationMs: 600000
    },
    
    // Friend requests: 10 per hour
    FRIEND_REQUEST: {
        maxRequests: 10,
        windowMs: 3600000,
        blockDurationMs: 86400000
    },
    
    // Search: 20 per minute
    SEARCH: {
        maxRequests: 20,
        windowMs: 60000,
        blockDurationMs: 300000
    },
    
    // Tournament creation: 5 per hour
    TOURNAMENT_CREATE: {
        maxRequests: 5,
        windowMs: 3600000,
        blockDurationMs: 86400000
    },
    
    // Profile updates: 10 per minute
    PROFILE_UPDATE: {
        maxRequests: 10,
        windowMs: 60000,
        blockDurationMs: 300000
    },
    
    // API calls: 100 per minute
    API_CALL: {
        maxRequests: 100,
        windowMs: 60000,
        blockDurationMs: 600000
    }
};

// Singleton instance
export const rateLimiter = new RateLimiter();

// Convenience function for common use case
export const withRateLimit = async (action, fn, customOptions = {}) => {
    const defaultOptions = RATE_LIMITS[action] || RATE_LIMITS.API_CALL;
    const options = { ...defaultOptions, ...customOptions };
    return rateLimiter.execute(action, fn, options);
};

export default rateLimiter;
