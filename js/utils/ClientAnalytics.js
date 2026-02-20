/**
 * Client-Side Analytics
 * Lightweight analytics tracking without external services
 * Stores aggregated data in Firestore for dashboard display
 */

import { eventBus } from '../engine/EventBus.js';
import { firebaseService } from '../engine/FirebaseService.js';

class ClientAnalytics {
    constructor() {
        this.sessionStart = Date.now();
        this.events = [];
        this.metrics = {
            gamesPlayed: new Set(),
            totalPlayTime: 0,
            sessionCount: 0,
            lastActive: Date.now()
        };
        this.flushInterval = 60000; // Flush every minute
        this.maxEvents = 50;
    }

    /**
     * Initialize analytics
     */
    init() {
        console.log('[ClientAnalytics] Initialized');

        // Track page views
        this.trackPageView(window.location.pathname);

        // Listen for game events
        eventBus.on('gameStarted', (data) => this.trackGameStart(data));
        eventBus.on('gameEnded', (data) => this.trackGameEnd(data));
        eventBus.on('scoreSubmitted', (data) => this.trackScoreSubmission(data));
        eventBus.on('achievementUnlocked', (data) => this.trackAchievement(data));
        eventBus.on('socialAction', (data) => this.trackSocialAction(data));

        // Track session
        this.trackSessionStart();

        // Periodic flush
        setInterval(() => this.flush(), this.flushInterval);

        // Flush on page unload
        window.addEventListener('beforeunload', () => this.flush(true));
    }

    /**
     * Track page view
     */
    trackPageView(path) {
        this.track('pageview', {
            path,
            referrer: document.referrer,
            title: document.title
        });
    }

    /**
     * Track game start
     */
    trackGameStart({ gameId, mode }) {
        this.metrics.gamesPlayed.add(gameId);
        this.track('gameStart', { gameId, mode });
    }

    /**
     * Track game end
     */
    trackGameEnd({ gameId, score, duration, won }) {
        this.metrics.totalPlayTime += duration || 0;
        this.track('gameEnd', { 
            gameId, 
            score, 
            duration,
            won
        });
    }

    /**
     * Track score submission
     */
    trackScoreSubmission({ gameId, score, isNewBest }) {
        this.track('scoreSubmit', { gameId, score, isNewBest });
    }

    /**
     * Track achievement
     */
    trackAchievement({ achievementId, gameId }) {
        this.track('achievement', { achievementId, gameId });
    }

    /**
     * Track social action
     */
    trackSocialAction({ type, targetUserId }) {
        this.track('social', { type, targetUserId });
    }

    /**
     * Track generic event
     */
    track(eventName, properties = {}) {
        const event = {
            name: eventName,
            properties: {
                ...properties,
                timestamp: Date.now(),
                sessionId: this.getSessionId(),
                userId: this.getUserId()
            },
            timestamp: Date.now()
        };

        this.events.push(event);

        // Flush if buffer is full
        if (this.events.length >= this.maxEvents) {
            this.flush();
        }
    }

    /**
     * Get session ID
     */
    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        return this.sessionId;
    }

    /**
     * Get user ID
     */
    getUserId() {
        const user = firebaseService.getCurrentUser?.();
        return user?.uid || 'anonymous';
    }

    /**
     * Track session start
     */
    trackSessionStart() {
        this.metrics.sessionCount++;
        this.metrics.lastActive = Date.now();
        
        // Update daily session count in Firestore
        this.updateDailyStats('sessions', 1);
    }

    /**
     * Update daily statistics in Firestore
     */
    async updateDailyStats(metric, increment) {
        try {
            const userId = this.getUserId();
            if (userId === 'anonymous') return;

            const db = firebaseService.db;
            if (!db) return;

            const today = new Date().toISOString().split('T')[0];
            const docRef = db.collection('analytics').doc(`daily_${userId}_${today}`);

            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);
                
                if (doc.exists) {
                    const data = doc.data();
                    transaction.update(docRef, {
                        [metric]: (data[metric] || 0) + increment,
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    transaction.set(docRef, {
                        userId,
                        date: today,
                        [metric]: increment,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            });
        } catch (error) {
            // Silently fail - analytics shouldn't break the app
            console.debug('[ClientAnalytics] Stats update failed:', error.message);
        }
    }

    /**
     * Flush events to Firestore
     */
    async flush(isFinal = false) {
        if (this.events.length === 0) return;

        const eventsToFlush = [...this.events];
        this.events = [];

        try {
            const userId = this.getUserId();
            const db = firebaseService.db;
            
            if (!db || userId === 'anonymous') {
                // Store locally if can't send
                this.storeLocally(eventsToFlush);
                return;
            }

            // Batch write to Firestore
            const batch = db.batch();
            const analyticsRef = db.collection('analytics').doc();
            
            batch.set(analyticsRef, {
                userId,
                sessionId: this.getSessionId(),
                events: eventsToFlush,
                metrics: {
                    gamesPlayed: Array.from(this.metrics.gamesPlayed),
                    totalPlayTime: this.metrics.totalPlayTime
                },
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            await batch.commit();

            // Update user stats
            await this.updateUserStats();

            console.debug('[ClientAnalytics] Flushed', eventsToFlush.length, 'events');

        } catch (error) {
            // Store locally for retry
            this.storeLocally(eventsToFlush);
            console.debug('[ClientAnalytics] Flush failed:', error.message);
        }
    }

    /**
     * Store events locally for later retry
     */
    storeLocally(events) {
        try {
            const existing = JSON.parse(localStorage.getItem('arcadeHub_pendingAnalytics') || '[]');
            const combined = [...existing, ...events].slice(-100); // Keep last 100
            localStorage.setItem('arcadeHub_pendingAnalytics', JSON.stringify(combined));
        } catch (e) {
            // ignore
        }
    }

    /**
     * Update aggregated user stats
     */
    async updateUserStats() {
        try {
            const userId = this.getUserId();
            if (userId === 'anonymous') return;

            const db = firebaseService.db;
            if (!db) return;

            const statsRef = db.collection('userStats').doc(userId);
            
            await statsRef.set({
                totalPlayTime: this.metrics.totalPlayTime,
                gamesPlayed: Array.from(this.metrics.gamesPlayed),
                sessionCount: this.metrics.sessionCount,
                lastActive: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

        } catch (error) {
            // Silently fail
        }
    }

    /**
     * Get aggregated stats for current user
     */
    async getUserStats() {
        try {
            const userId = this.getUserId();
            if (userId === 'anonymous') return null;

            const db = firebaseService.db;
            if (!db) return null;

            const doc = await db.collection('userStats').doc(userId).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get daily activity for current user
     */
    async getDailyActivity(days = 30) {
        try {
            const userId = this.getUserId();
            if (userId === 'anonymous') return [];

            const db = firebaseService.db;
            if (!db) return [];

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const snapshot = await db.collection('analytics')
                .where('userId', '==', userId)
                .where('date', '>=', startDate.toISOString().split('T')[0])
                .orderBy('date', 'desc')
                .limit(days)
                .get();

            return snapshot.docs.map(doc => doc.data());
        } catch (error) {
            return [];
        }
    }

    /**
     * Get analytics status
     */
    getStatus() {
        return {
            eventsPending: this.events.length,
            sessionDuration: Date.now() - this.sessionStart,
            metrics: {
                ...this.metrics,
                gamesPlayed: Array.from(this.metrics.gamesPlayed)
            }
        };
    }
}

// Singleton
export const clientAnalytics = new ClientAnalytics();
export default ClientAnalytics;
