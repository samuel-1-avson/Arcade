/**
 * PresenceService - Online Status & Activity Tracking
 * Tracks user presence, current activity, and online counts
 */

import { firebaseService } from '../engine/FirebaseService.js';
import { eventBus } from '../engine/EventBus.js';

class PresenceService {
    constructor() {
        this.presenceRef = null;
        this.connectedRef = null;
        this.currentGame = null;
        this.onlineWatchers = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the presence service
     */
    async init() {
        if (this.initialized) return;

        const rtdb = firebaseService.getRTDB();
        if (!rtdb) {
            console.warn('[PresenceService] RTDB not available');
            return;
        }

        // Listen for connection state
        this.connectedRef = rtdb.ref('.info/connected');
        this.connectedRef.on('value', (snapshot) => {
            if (snapshot.val() === true) {
                this.onConnected();
            } else {
                this.onDisconnected();
            }
        });

        this.initialized = true;
        console.log('[PresenceService] Initialized');
    }

    /**
     * Handle connection established
     */
    onConnected() {
        const user = firebaseService.getCurrentUser();
        if (!user) return;

        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return;

        this.presenceRef = rtdb.ref(`presence/${user.uid}`);

        // Set online status
        this.presenceRef.set({
            online: true,
            lastChanged: firebase.database.ServerValue.TIMESTAMP,
            currentGame: this.currentGame,
            displayName: user.displayName || 'Player',
            photoURL: user.photoURL || null
        });

        // Set up disconnect handler - mark offline when connection lost
        this.presenceRef.onDisconnect().set({
            online: false,
            lastChanged: firebase.database.ServerValue.TIMESTAMP,
            currentGame: null
        });

        eventBus.emit('presenceConnected');
        console.log('[PresenceService] Connected, presence set');
    }

    /**
     * Handle disconnection
     */
    onDisconnected() {
        eventBus.emit('presenceDisconnected');
        console.log('[PresenceService] Disconnected');
    }

    /**
     * Set user as online
     */
    async setOnline() {
        if (!this.presenceRef) return;

        try {
            await this.presenceRef.update({
                online: true,
                lastChanged: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('[PresenceService] setOnline error:', error);
        }
    }

    /**
     * Set user as offline
     */
    async setOffline() {
        if (!this.presenceRef) return;

        try {
            await this.presenceRef.update({
                online: false,
                lastChanged: firebase.database.ServerValue.TIMESTAMP,
                currentGame: null
            });
        } catch (error) {
            console.error('[PresenceService] setOffline error:', error);
        }
    }

    /**
     * Set current game being played
     * @param {string|null} gameId
     */
    async setCurrentGame(gameId) {
        this.currentGame = gameId;
        
        if (!this.presenceRef) return;

        try {
            await this.presenceRef.update({
                currentGame: gameId,
                lastChanged: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('[PresenceService] setCurrentGame error:', error);
        }
    }

    /**
     * Set user as in a party
     * @param {string|null} partyCode
     */
    async setInParty(partyCode) {
        if (!this.presenceRef) return;

        try {
            await this.presenceRef.update({
                inParty: partyCode,
                lastChanged: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('[PresenceService] setInParty error:', error);
        }
    }

    /**
     * Get a user's presence
     * @param {string} userId
     * @returns {Promise<Object|null>}
     */
    async getUserPresence(userId) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return null;

        try {
            const snapshot = await rtdb.ref(`presence/${userId}`).once('value');
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error('[PresenceService] getUserPresence error:', error);
            return null;
        }
    }

    /**
     * Watch a user's presence
     * @param {string} userId
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    watchUser(userId, callback) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return () => {};

        const ref = rtdb.ref(`presence/${userId}`);
        
        const onValue = ref.on('value', (snapshot) => {
            callback(snapshot.exists() ? snapshot.val() : null);
        });

        return () => ref.off('value', onValue);
    }

    /**
     * Watch multiple users' presence
     * @param {string[]} userIds
     * @param {Function} callback - Called with { userId: presence }
     * @returns {Function} Unsubscribe function
     */
    watchUsers(userIds, callback) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return () => {};

        const presences = {};
        const unsubscribes = [];

        for (const userId of userIds) {
            const ref = rtdb.ref(`presence/${userId}`);
            
            const onValue = ref.on('value', (snapshot) => {
                presences[userId] = snapshot.exists() ? snapshot.val() : null;
                callback({ ...presences });
            });

            unsubscribes.push(() => ref.off('value', onValue));
        }

        return () => unsubscribes.forEach(fn => fn());
    }

    /**
     * Get count of online users
     * @returns {Promise<number>}
     */
    async getOnlineCount() {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return 0;

        try {
            const snapshot = await rtdb.ref('presence')
                .orderByChild('online')
                .equalTo(true)
                .once('value');
            
            return snapshot.numChildren();
        } catch (error) {
            console.error('[PresenceService] getOnlineCount error:', error);
            return 0;
        }
    }

    /**
     * Subscribe to online count changes
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    watchOnlineCount(callback) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return () => {};

        const ref = rtdb.ref('presence').orderByChild('online').equalTo(true);
        
        const onValue = ref.on('value', (snapshot) => {
            callback(snapshot.numChildren());
        });

        return () => ref.off('value', onValue);
    }

    /**
     * Get users currently playing a specific game
     * @param {string} gameId
     * @returns {Promise<Object[]>}
     */
    async getPlayersInGame(gameId) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return [];

        try {
            const snapshot = await rtdb.ref('presence')
                .orderByChild('currentGame')
                .equalTo(gameId)
                .once('value');
            
            const players = [];
            snapshot.forEach((child) => {
                if (child.val().online) {
                    players.push({ id: child.key, ...child.val() });
                }
            });
            return players;
        } catch (error) {
            console.error('[PresenceService] getPlayersInGame error:', error);
            return [];
        }
    }

    /**
     * Watch players in a game
     * @param {string} gameId
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    watchPlayersInGame(gameId, callback) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return () => {};

        const ref = rtdb.ref('presence').orderByChild('currentGame').equalTo(gameId);
        
        const onValue = ref.on('value', (snapshot) => {
            const players = [];
            snapshot.forEach((child) => {
                if (child.val().online) {
                    players.push({ id: child.key, ...child.val() });
                }
            });
            callback(players);
        });

        return () => ref.off('value', onValue);
    }

    /**
     * Get recently active users
     * @param {number} minutes - Active within last N minutes
     * @param {number} limit - Max users to return
     * @returns {Promise<Object[]>}
     */
    async getRecentlyActive(minutes = 15, limit = 20) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return [];

        const cutoff = Date.now() - (minutes * 60 * 1000);

        try {
            const snapshot = await rtdb.ref('presence')
                .orderByChild('lastChanged')
                .startAt(cutoff)
                .limitToLast(limit)
                .once('value');
            
            const users = [];
            snapshot.forEach((child) => {
                users.push({ id: child.key, ...child.val() });
            });
            
            // Sort by lastChanged descending
            users.sort((a, b) => (b.lastChanged || 0) - (a.lastChanged || 0));
            return users;
        } catch (error) {
            console.error('[PresenceService] getRecentlyActive error:', error);
            return [];
        }
    }

    /**
     * Clean up old presence entries
     * @param {number} hours - Remove entries older than N hours
     */
    async cleanupStale(hours = 24) {
        const rtdb = firebaseService.getRTDB();
        if (!rtdb) return;

        const cutoff = Date.now() - (hours * 60 * 60 * 1000);

        try {
            const snapshot = await rtdb.ref('presence')
                .orderByChild('lastChanged')
                .endAt(cutoff)
                .once('value');

            const updates = {};
            snapshot.forEach((child) => {
                updates[child.key] = null;
            });

            if (Object.keys(updates).length > 0) {
                await rtdb.ref('presence').update(updates);
                console.log(`[PresenceService] Cleaned up ${Object.keys(updates).length} stale entries`);
            }
        } catch (error) {
            console.error('[PresenceService] cleanupStale error:', error);
        }
    }

    /**
     * Destroy presence service
     */
    destroy() {
        if (this.presenceRef) {
            this.presenceRef.off();
            this.presenceRef = null;
        }
        if (this.connectedRef) {
            this.connectedRef.off();
            this.connectedRef = null;
        }
        this.initialized = false;
    }
}

export const presenceService = new PresenceService();
