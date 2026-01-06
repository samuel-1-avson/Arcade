/**
 * StreamService - Real-time Data Streaming Pipeline
 * Handles live leaderboards, event broadcasting, and player action streams
 */

import { firebaseService } from '../engine/FirebaseService.js';
import { eventBus } from '../engine/EventBus.js';

class StreamService {
    constructor() {
        this.activeStreams = new Map(); // streamId -> unsubscribe function
        this.listeners = new Map(); // channel -> callback[]
        this.batchBuffer = []; // For batched publishing
        this.batchTimeout = null;
        this.initialized = false;
    }

    /**
     * Initialize the stream service
     */
    init() {
        if (this.initialized) return;

        this.initialized = true;
        console.log('[StreamService] Initialized');
    }

    // ==================== LEADERBOARD STREAMING ====================

    /**
     * Subscribe to live leaderboard updates
     * @param {string} gameId - Game to watch
     * @param {Function} callback - Called with updated scores
     * @param {number} limit - Max scores to fetch (default: 10)
     * @returns {Function} Unsubscribe function
     */
    subscribeToLeaderboard(gameId, callback, limit = 10) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) {
            console.warn('[StreamService] RTDB not available');
            return () => {};
        }

        const ref = rtdb.ref(`liveLeaderboards/${gameId}`).orderByChild('score').limitToLast(limit);
        
        const onValue = ref.on('value', (snapshot) => {
            const scores = [];
            snapshot.forEach((child) => {
                scores.push({ id: child.key, ...child.val() });
            });
            // Sort descending and call callback
            scores.sort((a, b) => b.score - a.score);
            callback(scores);
        });

        const streamId = `leaderboard_${gameId}`;
        this.activeStreams.set(streamId, () => ref.off('value', onValue));

        return () => this.unsubscribe(streamId);
    }

    /**
     * Publish a score to live leaderboard
     * @param {string} gameId
     * @param {number} score
     * @param {Object} playerInfo - { name, avatar, userId }
     */
    async publishScore(gameId, score, playerInfo) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return;

        try {
            const scoreData = {
                ...playerInfo,
                score,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };

            // Use push for new entry or set with specific key
            const key = playerInfo.oderId || rtdb.ref().child(`liveLeaderboards/${gameId}`).push().key;
            await rtdb.ref(`liveLeaderboards/${gameId}/${key}`).set(scoreData);
            
            console.log('[StreamService] Published score:', gameId, score);
        } catch (error) {
            console.error('[StreamService] Publish score error:', error);
        }
    }

    // ==================== GAME ROOM STREAMING ====================

    /**
     * Subscribe to a game room for multiplayer
     * @param {string} roomCode
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    subscribeToGameRoom(roomCode, callback) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return () => {};

        const ref = rtdb.ref(`gameRooms/${roomCode}`);
        
        const onValue = ref.on('value', (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            } else {
                callback(null);
            }
        });

        const streamId = `room_${roomCode}`;
        this.activeStreams.set(streamId, () => ref.off('value', onValue));

        return () => this.unsubscribe(streamId);
    }

    /**
     * Publish player action to game room
     * @param {string} roomCode
     * @param {string} actionType
     * @param {Object} data
     */
    async publishRoomAction(roomCode, actionType, data) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return;

        const user = firebaseService.getCurrentUser();
        if (!user) return;

        try {
            await rtdb.ref(`gameRooms/${roomCode}/actions`).push({
                userId: user.uid,
                type: actionType,
                data,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('[StreamService] Room action error:', error);
        }
    }

    // ==================== LIVE EVENT STREAMING ====================

    /**
     * Subscribe to a live event
     * @param {string} eventId
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    subscribeToLiveEvent(eventId, callback) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return () => {};

        const ref = rtdb.ref(`liveEvents/${eventId}`);
        
        const onValue = ref.on('value', (snapshot) => {
            if (snapshot.exists()) {
                callback({ id: eventId, ...snapshot.val() });
            } else {
                callback(null);
            }
        });

        const streamId = `event_${eventId}`;
        this.activeStreams.set(streamId, () => ref.off('value', onValue));

        return () => this.unsubscribe(streamId);
    }

    /**
     * Subscribe to all active live events
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    subscribeToActiveEvents(callback) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return () => {};

        const ref = rtdb.ref('liveEvents').orderByChild('active').equalTo(true);
        
        const onValue = ref.on('value', (snapshot) => {
            const events = [];
            snapshot.forEach((child) => {
                events.push({ id: child.key, ...child.val() });
            });
            callback(events);
        });

        const streamId = 'active_events';
        this.activeStreams.set(streamId, () => ref.off('value', onValue));

        return () => this.unsubscribe(streamId);
    }

    /**
     * Join a live event
     * @param {string} eventId
     * @param {Object} playerInfo
     */
    async joinLiveEvent(eventId, playerInfo) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return;

        const user = firebaseService.getCurrentUser();
        if (!user) return;

        try {
            await rtdb.ref(`liveEvents/${eventId}/participants/${user.uid}`).set({
                ...playerInfo,
                joinedAt: firebase.database.ServerValue.TIMESTAMP,
                progress: 0
            });
        } catch (error) {
            console.error('[StreamService] Join event error:', error);
        }
    }

    /**
     * Update progress in a live event
     * @param {string} eventId
     * @param {number} progress
     */
    async updateEventProgress(eventId, progress) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return;

        const user = firebaseService.getCurrentUser();
        if (!user) return;

        try {
            await rtdb.ref(`liveEvents/${eventId}/participants/${user.uid}/progress`).set(progress);
        } catch (error) {
            console.error('[StreamService] Update progress error:', error);
        }
    }

    // ==================== NOTIFICATION STREAMING ====================

    /**
     * Subscribe to user notifications
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    subscribeToNotifications(callback) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return () => {};

        const user = firebaseService.getCurrentUser();
        if (!user) return () => {};

        const ref = rtdb.ref(`notifications/${user.uid}`).orderByChild('timestamp').limitToLast(20);
        
        const onChildAdded = ref.on('child_added', (snapshot) => {
            callback({
                type: 'added',
                notification: { id: snapshot.key, ...snapshot.val() }
            });
        });

        const streamId = `notifications_${user.uid}`;
        this.activeStreams.set(streamId, () => ref.off('child_added', onChildAdded));

        return () => this.unsubscribe(streamId);
    }

    /**
     * Push a notification to a user
     * @param {string} userId
     * @param {Object} notification
     */
    async pushNotification(userId, notification) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return;

        try {
            await rtdb.ref(`notifications/${userId}`).push({
                ...notification,
                read: false,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('[StreamService] Push notification error:', error);
        }
    }

    // ==================== PLAYER ACTION STREAMING ====================

    /**
     * Subscribe to player actions in a game (for spectating)
     * @param {string} gameId
     * @param {string} playerId
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    subscribeToPlayerActions(gameId, playerId, callback) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return () => {};

        const ref = rtdb.ref(`streams/${gameId}/${playerId}/actions`).limitToLast(50);
        
        const onChildAdded = ref.on('child_added', (snapshot) => {
            callback(snapshot.val());
        });

        const streamId = `actions_${gameId}_${playerId}`;
        this.activeStreams.set(streamId, () => ref.off('child_added', onChildAdded));

        return () => this.unsubscribe(streamId);
    }

    /**
     * Publish player action for streaming
     * @param {string} gameId
     * @param {Object} action
     */
    publishAction(gameId, action) {
        // Add to batch buffer
        this.batchBuffer.push({
            gameId,
            action: {
                ...action,
                timestamp: Date.now()
            }
        });

        // Debounce batch publishing
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }

        this.batchTimeout = setTimeout(() => {
            this.flushBatch();
        }, 100); // Flush every 100ms
    }

    /**
     * Flush batched actions
     */
    async flushBatch() {
        if (this.batchBuffer.length === 0) return;

        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return;

        const user = firebaseService.getCurrentUser();
        if (!user) return;

        const updates = {};
        
        for (const item of this.batchBuffer) {
            const key = rtdb.ref().push().key;
            updates[`streams/${item.gameId}/${user.uid}/actions/${key}`] = item.action;
        }

        try {
            await rtdb.ref().update(updates);
        } catch (error) {
            console.error('[StreamService] Batch publish error:', error);
        }

        this.batchBuffer = [];
    }

    // ==================== CHAT STREAMING ====================

    /**
     * Subscribe to room chat
     * @param {string} roomCode
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    subscribeToChat(roomCode, callback) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return () => {};

        const ref = rtdb.ref(`gameRooms/${roomCode}/chat`).limitToLast(100);
        
        const onChildAdded = ref.on('child_added', (snapshot) => {
            callback({ id: snapshot.key, ...snapshot.val() });
        });

        const streamId = `chat_${roomCode}`;
        this.activeStreams.set(streamId, () => ref.off('child_added', onChildAdded));

        return () => this.unsubscribe(streamId);
    }

    /**
     * Send a chat message
     * @param {string} roomCode
     * @param {string} message
     */
    async sendChatMessage(roomCode, message) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return;

        const user = firebaseService.getCurrentUser();
        if (!user) return;

        try {
            await rtdb.ref(`gameRooms/${roomCode}/chat`).push({
                userId: user.uid,
                userName: user.displayName || 'Player',
                message,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('[StreamService] Chat error:', error);
        }
    }

    // ==================== UTILITIES ====================

    /**
     * Unsubscribe from a stream
     * @param {string} streamId
     */
    unsubscribe(streamId) {
        const unsubscribeFn = this.activeStreams.get(streamId);
        if (unsubscribeFn) {
            unsubscribeFn();
            this.activeStreams.delete(streamId);
        }
    }

    /**
     * Unsubscribe from all streams
     */
    unsubscribeAll() {
        for (const [streamId, unsubscribeFn] of this.activeStreams) {
            unsubscribeFn();
        }
        this.activeStreams.clear();
    }

    /**
     * Get count of active streams
     */
    getActiveStreamCount() {
        return this.activeStreams.size;
    }

    /**
     * Clean up old data from RTDB (call periodically)
     * @param {string} path
     * @param {number} maxAgeMs
     */
    async cleanupOldData(path, maxAgeMs = 24 * 60 * 60 * 1000) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return;

        const cutoff = Date.now() - maxAgeMs;
        
        try {
            const snapshot = await rtdb.ref(path)
                .orderByChild('timestamp')
                .endAt(cutoff)
                .once('value');

            const updates = {};
            snapshot.forEach((child) => {
                updates[child.key] = null;
            });

            if (Object.keys(updates).length > 0) {
                await rtdb.ref(path).update(updates);
                console.log(`[StreamService] Cleaned up ${Object.keys(updates).length} old entries from ${path}`);
            }
        } catch (error) {
            console.error('[StreamService] Cleanup error:', error);
        }
    }
}

export const streamService = new StreamService();
