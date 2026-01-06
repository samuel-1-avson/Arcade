/**
 * AnalyticsService - Game Event Analytics Pipeline
 * Tracks user actions, game events, and performance metrics
 */

import { firebaseService } from '../engine/FirebaseService.js';
import { eventBus } from '../engine/EventBus.js';

// Event types
export const ANALYTICS_EVENTS = {
    // User Events
    USER_SIGNUP: 'user_signup',
    USER_LOGIN: 'user_login',
    USER_LOGOUT: 'user_logout',
    PROFILE_UPDATE: 'profile_update',
    
    // Game Events
    GAME_START: 'game_start',
    GAME_END: 'game_end',
    GAME_PAUSE: 'game_pause',
    GAME_RESUME: 'game_resume',
    
    // Score Events
    SCORE_SUBMIT: 'score_submit',
    HIGH_SCORE: 'high_score',
    
    // Achievement Events
    ACHIEVEMENT_UNLOCK: 'achievement_unlock',
    LEVEL_UP: 'level_up',
    
    // Social Events
    PARTY_CREATE: 'party_create',
    PARTY_JOIN: 'party_join',
    PARTY_LEAVE: 'party_leave',
    
    // Tournament Events
    TOURNAMENT_JOIN: 'tournament_join',
    TOURNAMENT_COMPLETE: 'tournament_complete',
    
    // Challenge Events
    CHALLENGE_START: 'challenge_start',
    CHALLENGE_COMPLETE: 'challenge_complete',
    
    // UI Events
    PAGE_VIEW: 'page_view',
    BUTTON_CLICK: 'button_click',
    MODAL_OPEN: 'modal_open',
    MODAL_CLOSE: 'modal_close',
    
    // Error Events
    ERROR: 'error',
    PERFORMANCE_ISSUE: 'performance_issue'
};

class AnalyticsService {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = null;
        this.eventQueue = [];
        this.flushInterval = null;
        this.sessionStartTime = Date.now();
        this.pageViewTime = Date.now();
        this.initialized = false;
        this.debugMode = false;
    }

    /**
     * Initialize analytics service
     */
    init() {
        if (this.initialized) return;

        // Set up periodic flush
        this.flushInterval = setInterval(() => {
            this.flush();
        }, 30000); // Flush every 30 seconds

        // Flush on page unload
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
            this.flushSync();
        });

        // Track page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.track(ANALYTICS_EVENTS.GAME_PAUSE, { reason: 'tab_hidden' });
            } else {
                this.track(ANALYTICS_EVENTS.GAME_RESUME, { reason: 'tab_visible' });
            }
        });

        // Listen for global events
        this.setupEventListeners();

        // Track session start
        this.track('session_start', {
            referrer: document.referrer,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            userAgent: navigator.userAgent,
            language: navigator.language
        });

        this.initialized = true;
        console.log('[AnalyticsService] Initialized, session:', this.sessionId);
    }

    /**
     * Set current user ID
     */
    setUserId(userId) {
        this.userId = userId;
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Track an analytics event
     * @param {string} eventType - Event type from ANALYTICS_EVENTS
     * @param {Object} data - Event data
     */
    track(eventType, data = {}) {
        const event = {
            type: eventType,
            data: {
                ...data,
                sessionId: this.sessionId,
                userId: this.userId,
                timestamp: Date.now(),
                url: window.location.pathname,
                sessionDuration: Date.now() - this.sessionStartTime
            }
        };

        // Add to queue
        this.eventQueue.push(event);

        // Log in debug mode
        if (this.debugMode) {
            console.log('[Analytics]', eventType, data);
        }

        // Emit local event
        eventBus.emit('analyticsEvent', event);

        // Flush if queue is large
        if (this.eventQueue.length >= 20) {
            this.flush();
        }
    }

    /**
     * Track a page view
     * @param {string} pageName
     */
    trackPageView(pageName) {
        const timeOnPrevious = Date.now() - this.pageViewTime;
        this.pageViewTime = Date.now();

        this.track(ANALYTICS_EVENTS.PAGE_VIEW, {
            page: pageName,
            previousDuration: timeOnPrevious
        });
    }

    /**
     * Track game session start
     * @param {string} gameId
     * @param {Object} options - Game mode, difficulty, etc.
     */
    trackGameStart(gameId, options = {}) {
        this.track(ANALYTICS_EVENTS.GAME_START, {
            gameId,
            ...options,
            startTime: Date.now()
        });
    }

    /**
     * Track game session end
     * @param {string} gameId
     * @param {Object} results - Score, duration, etc.
     */
    trackGameEnd(gameId, results = {}) {
        this.track(ANALYTICS_EVENTS.GAME_END, {
            gameId,
            ...results,
            endTime: Date.now()
        });
    }

    /**
     * Track score submission
     * @param {string} gameId
     * @param {number} score
     * @param {boolean} isHighScore
     */
    trackScore(gameId, score, isHighScore = false) {
        this.track(ANALYTICS_EVENTS.SCORE_SUBMIT, {
            gameId,
            score,
            isHighScore
        });

        if (isHighScore) {
            this.track(ANALYTICS_EVENTS.HIGH_SCORE, {
                gameId,
                score
            });
        }
    }

    /**
     * Track achievement unlock
     * @param {string} achievementId
     * @param {string} gameId
     */
    trackAchievement(achievementId, gameId) {
        this.track(ANALYTICS_EVENTS.ACHIEVEMENT_UNLOCK, {
            achievementId,
            gameId
        });
    }

    /**
     * Track error
     * @param {string} errorType
     * @param {string} message
     * @param {Object} context
     */
    trackError(errorType, message, context = {}) {
        this.track(ANALYTICS_EVENTS.ERROR, {
            errorType,
            message,
            ...context,
            stack: new Error().stack
        });
    }

    /**
     * Track performance issue
     * @param {string} metric
     * @param {number} value
     * @param {Object} context
     */
    trackPerformance(metric, value, context = {}) {
        this.track(ANALYTICS_EVENTS.PERFORMANCE_ISSUE, {
            metric,
            value,
            ...context
        });
    }

    /**
     * Track button click
     * @param {string} buttonId
     * @param {Object} context
     */
    trackClick(buttonId, context = {}) {
        this.track(ANALYTICS_EVENTS.BUTTON_CLICK, {
            buttonId,
            ...context
        });
    }

    /**
     * Track session end
     */
    trackSessionEnd() {
        this.track('session_end', {
            duration: Date.now() - this.sessionStartTime,
            eventsCount: this.eventQueue.length
        });
    }

    /**
     * Flush events to Firestore
     */
    async flush() {
        if (this.eventQueue.length === 0) return;

        const db = firebaseService.db;
        if (!db) {
            console.warn('[AnalyticsService] Firestore not available, events queued locally');
            return;
        }

        const eventsToSend = [...this.eventQueue];
        this.eventQueue = [];

        try {
            // Batch write for efficiency
            const batch = db.batch();
            const analyticsRef = db.collection('analytics');

            for (const event of eventsToSend) {
                const docRef = analyticsRef.doc();
                batch.set(docRef, {
                    ...event,
                    sentAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            await batch.commit();
            console.log(`[AnalyticsService] Flushed ${eventsToSend.length} events`);
        } catch (error) {
            console.error('[AnalyticsService] Flush error:', error);
            // Re-queue events on failure
            this.eventQueue = [...eventsToSend, ...this.eventQueue];
        }
    }

    /**
     * Synchronous flush for page unload
     */
    flushSync() {
        if (this.eventQueue.length === 0) return;

        // Use sendBeacon for reliable delivery on page unload
        const payload = JSON.stringify({
            events: this.eventQueue,
            sessionId: this.sessionId
        });

        // Store in localStorage as backup
        try {
            const pending = JSON.parse(localStorage.getItem('analytics_pending') || '[]');
            pending.push(...this.eventQueue);
            localStorage.setItem('analytics_pending', JSON.stringify(pending.slice(-100)));
        } catch (e) {
            // Ignore storage errors
        }

        this.eventQueue = [];
    }

    /**
     * Process pending events from localStorage
     */
    async processPending() {
        try {
            const pending = JSON.parse(localStorage.getItem('analytics_pending') || '[]');
            if (pending.length > 0) {
                this.eventQueue = [...pending, ...this.eventQueue];
                localStorage.removeItem('analytics_pending');
                await this.flush();
            }
        } catch (e) {
            console.warn('[AnalyticsService] Failed to process pending:', e);
        }
    }

    /**
     * Set up event bus listeners
     */
    setupEventListeners() {
        // Game events
        eventBus.on('gameLoaded', ({ gameId }) => {
            this.trackGameStart(gameId);
        });

        eventBus.on('gameClosed', ({ gameId, score, duration }) => {
            this.trackGameEnd(gameId, { score, duration });
        });

        // Achievement events
        eventBus.on('achievementUnlocked', ({ achievementId, gameId }) => {
            this.trackAchievement(achievementId, gameId);
        });

        // Score events
        eventBus.on('scoreSubmitted', ({ gameId, score, isHighScore }) => {
            this.trackScore(gameId, score, isHighScore);
        });

        // Auth events
        eventBus.on('userSignedIn', ({ uid }) => {
            this.setUserId(uid);
            this.track(ANALYTICS_EVENTS.USER_LOGIN, { userId: uid });
        });

        eventBus.on('userSignedOut', () => {
            this.track(ANALYTICS_EVENTS.USER_LOGOUT, { userId: this.userId });
            this.userId = null;
        });

        // Party events
        eventBus.on('partyCreated', ({ partyCode }) => {
            this.track(ANALYTICS_EVENTS.PARTY_CREATE, { partyCode });
        });

        eventBus.on('partyJoined', ({ partyCode }) => {
            this.track(ANALYTICS_EVENTS.PARTY_JOIN, { partyCode });
        });

        // Level up
        eventBus.on('globalLevelUp', ({ level }) => {
            this.track(ANALYTICS_EVENTS.LEVEL_UP, { level });
        });
    }

    /**
     * Enable debug mode
     */
    enableDebug() {
        this.debugMode = true;
        console.log('[AnalyticsService] Debug mode enabled');
    }

    /**
     * Disable debug mode
     */
    disableDebug() {
        this.debugMode = false;
    }

    /**
     * Get session info
     */
    getSessionInfo() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            duration: Date.now() - this.sessionStartTime,
            eventsQueued: this.eventQueue.length
        };
    }

    /**
     * Destroy service
     */
    destroy() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        this.flush();
    }
}

export const analyticsService = new AnalyticsService();
