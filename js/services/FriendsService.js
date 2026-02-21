/**
 * FriendsService - Social Friends System
 * Manages friend requests, friends list, and online status tracking
 * Uses Firebase Realtime Database for real-time updates
 */

import { eventBus } from '../engine/EventBus.js';
import { globalStateManager } from './GlobalStateManager.js';
import { notificationService } from './NotificationService.js';
import { sanitizeDisplayName, escapeRegExp } from '../utils/sanitize.js';
import { rateLimiter, RATE_LIMITS } from '../utils/rateLimiter.js';
import { logger, LogCategory } from '../utils/logger.js';

class FriendsService {
    constructor() {
        this.db = null;
        this.currentUserId = null;
        this.friends = new Map(); // friendId -> { name, avatar, status, since }
        this.incomingRequests = new Map();
        this.outgoingRequests = new Map();
        this.listeners = [];
        this.initialized = false;
    }

    /**
     * Initialize the friends service
     */
    async init() {
        if (this.initialized) return;

        // Wait for Firebase
        if (typeof firebase !== 'undefined' && firebase.database) {
            this.db = firebase.database();
        } else {
            logger.warn(LogCategory.SOCIAL, '[FriendsService] Firebase RTDB not available');
            return;
        }

        // Get current user ID
        if (firebase.auth().currentUser) {
            this.currentUserId = firebase.auth().currentUser.uid;
            await this.setupListeners();
        }

        // Listen for auth changes
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUserId = user.uid;
                await this.setupListeners();
            } else {
                this.cleanup();
            }
        });

        this.initialized = true;
        logger.info(LogCategory.SOCIAL, '[FriendsService] Initialized');
    }

    /**
     * Set up real-time listeners for friends and requests
     */
    async setupListeners() {
        if (!this.db || !this.currentUserId) return;

        const friendsRef = this.db.ref(`friends/${this.currentUserId}`);

        // Listen for friends list changes
        const friendsListRef = friendsRef.child('list');
        friendsListRef.on('value', (snapshot) => {
            this.friends.clear();
            const data = snapshot.val() || {};
            
            for (const [friendId, friendData] of Object.entries(data)) {
                this.friends.set(friendId, {
                    id: friendId,
                    ...friendData
                });
                
                // Subscribe to friend's presence
                this.subscribeToPresence(friendId);
            }
            
            eventBus.emit('friendsListUpdated', Array.from(this.friends.values()));
        });
        this.listeners.push({ ref: friendsListRef, event: 'value' });

        // Listen for incoming friend requests
        const incomingRef = friendsRef.child('requests/incoming');
        incomingRef.on('value', (snapshot) => {
            this.incomingRequests.clear();
            const data = snapshot.val() || {};
            
            for (const [requestId, requestData] of Object.entries(data)) {
                this.incomingRequests.set(requestId, {
                    id: requestId,
                    ...requestData
                });
            }
            
            eventBus.emit('friendRequestsUpdated', {
                incoming: Array.from(this.incomingRequests.values()),
                outgoing: Array.from(this.outgoingRequests.values())
            });

            // Show notification for new requests
            if (this.incomingRequests.size > 0) {
                const latest = Array.from(this.incomingRequests.values()).pop();
                notificationService.info(`Friend request from ${latest.name}`);
            }
        });
        this.listeners.push({ ref: incomingRef, event: 'value' });

        // Listen for outgoing friend requests
        const outgoingRef = friendsRef.child('requests/outgoing');
        outgoingRef.on('value', (snapshot) => {
            this.outgoingRequests.clear();
            const data = snapshot.val() || {};
            
            for (const [requestId, requestData] of Object.entries(data)) {
                this.outgoingRequests.set(requestId, {
                    id: requestId,
                    ...requestData
                });
            }
            
            eventBus.emit('friendRequestsUpdated', {
                incoming: Array.from(this.incomingRequests.values()),
                outgoing: Array.from(this.outgoingRequests.values())
            });
        });
        this.listeners.push({ ref: outgoingRef, event: 'value' });
    }

    /**
     * Subscribe to a friend's online/offline status
     */
    subscribeToPresence(friendId) {
        if (!this.db) return;

        const presenceRef = this.db.ref(`presence/${friendId}`);
        presenceRef.on('value', (snapshot) => {
            const presence = snapshot.val();
            const friend = this.friends.get(friendId);
            
            if (friend) {
                friend.status = presence?.online ? 'online' : 'offline';
                friend.lastSeen = presence?.lastSeen || null;
                friend.currentGame = presence?.currentGame || null;
                
                this.friends.set(friendId, friend);
                eventBus.emit('friendStatusChanged', friend);
            }
        });
        this.listeners.push({ ref: presenceRef, event: 'value' });
    }

    // ============ FRIEND REQUESTS ============

    /**
     * Send a friend request to another user
     * @param {string} targetUserId - The user ID to send request to
     */
    async sendFriendRequest(targetUserId) {
        if (!this.db || !this.currentUserId) {
            notificationService.error('Please sign in to add friends');
            return false;
        }

        if (targetUserId === this.currentUserId) {
            notificationService.error("You can't add yourself as a friend");
            return false;
        }

        if (this.friends.has(targetUserId)) {
            notificationService.info('Already friends!');
            return false;
        }

        try {
            // Apply rate limiting
            await rateLimiter.execute('FRIEND_REQUEST', async () => {
                const profile = globalStateManager.getProfile();
                const requestId = this.db.ref().push().key;
                const timestamp = firebase.database.ServerValue.TIMESTAMP;

                // Add to sender's outgoing requests
                await this.db.ref(`friends/${this.currentUserId}/requests/outgoing/${requestId}`).set({
                    to: targetUserId,
                    timestamp
                });

                // Add to receiver's incoming requests
                await this.db.ref(`friends/${targetUserId}/requests/incoming/${requestId}`).set({
                    from: this.currentUserId,
                    name: sanitizeDisplayName(profile.displayName),
                    avatar: profile.avatar,
                    timestamp
                });
            }, RATE_LIMITS.FRIEND_REQUEST);

            notificationService.success('Friend request sent!');
            return true;
        } catch (error) {
            if (error.rateLimited) {
                notificationService.error('Please wait before sending more friend requests');
            } else {
                logger.error(LogCategory.SOCIAL, '[FriendsService] Send request error:', error);
                notificationService.error('Failed to send friend request');
            }
            return false;
        }
    }

    /**
     * Search for users by display name or user code
     * @param {string} query - Search query (name or user code)
     */
    async searchUsers(query) {
        if (!query || query.length < 2) return [];
        
        // Sanitize query to prevent injection
        const sanitizedQuery = sanitizeDisplayName(query).slice(0, 20);
        if (!sanitizedQuery) return [];

        try {
            // Apply rate limiting
            return await rateLimiter.execute('SEARCH', async () => {
                // Search in Firestore users collection
                const db = firebase.firestore();
                const snapshot = await db.collection('publicProfiles')
                    .where('displayName', '>=', sanitizedQuery)
                    .where('displayName', '<=', sanitizedQuery + '\uf8ff')
                    .limit(10)
                    .get();

                const results = [];
                snapshot.forEach(doc => {
                    if (doc.id !== this.currentUserId) {
                        const data = doc.data();
                        results.push({
                            id: doc.id,
                            displayName: sanitizeDisplayName(data.displayName || 'Unknown'),
                            avatar: data.avatar,
                            level: data.level || 1
                        });
                    }
                });

                return results;
            }, RATE_LIMITS.SEARCH);
        } catch (error) {
            if (error.rateLimited) {
                notificationService.warning('Please slow down your search');
            } else {
                logger.error(LogCategory.SOCIAL, '[FriendsService] Search error:', error);
            }
            return [];
        }
    }

    /**
     * Accept an incoming friend request
     * @param {string} requestId - The request ID
     */
    async acceptFriendRequest(requestId) {
        if (!this.db || !this.currentUserId) return false;

        const request = this.incomingRequests.get(requestId);
        if (!request) {
            notificationService.error('Request not found');
            return false;
        }

        try {
            const timestamp = firebase.database.ServerValue.TIMESTAMP;
            const myProfile = globalStateManager.getProfile();

            // Add each user to the other's friends list
            const updates = {};
            
            // Add sender to my friends list
            updates[`friends/${this.currentUserId}/list/${request.from}`] = {
                name: sanitizeDisplayName(request.name),
                avatar: request.avatar,
                since: timestamp,
                status: 'accepted'
            };

            // Add me to sender's friends list
            updates[`friends/${request.from}/list/${this.currentUserId}`] = {
                name: sanitizeDisplayName(myProfile.displayName),
                avatar: myProfile.avatar,
                since: timestamp,
                status: 'accepted'
            };

            // Remove the requests
            updates[`friends/${this.currentUserId}/requests/incoming/${requestId}`] = null;
            updates[`friends/${request.from}/requests/outgoing/${requestId}`] = null;

            await this.db.ref().update(updates);

            notificationService.success(`You are now friends with ${request.name}!`);
            return true;
        } catch (error) {
            logger.error(LogCategory.SOCIAL, '[FriendsService] Accept request error:', error);
            notificationService.error('Failed to accept request');
            return false;
        }
    }

    /**
     * Decline an incoming friend request
     * @param {string} requestId - The request ID
     */
    async declineFriendRequest(requestId) {
        if (!this.db || !this.currentUserId) return false;

        const request = this.incomingRequests.get(requestId);
        if (!request) return false;

        try {
            const updates = {};
            updates[`friends/${this.currentUserId}/requests/incoming/${requestId}`] = null;
            updates[`friends/${request.from}/requests/outgoing/${requestId}`] = null;

            await this.db.ref().update(updates);

            notificationService.info('Friend request declined');
            return true;
        } catch (error) {
            logger.error(LogCategory.SOCIAL, '[FriendsService] Decline request error:', error);
            return false;
        }
    }

    /**
     * Cancel an outgoing friend request
     * @param {string} requestId - The request ID
     */
    async cancelFriendRequest(requestId) {
        if (!this.db || !this.currentUserId) return false;

        const request = this.outgoingRequests.get(requestId);
        if (!request) return false;

        try {
            const updates = {};
            updates[`friends/${this.currentUserId}/requests/outgoing/${requestId}`] = null;
            updates[`friends/${request.to}/requests/incoming/${requestId}`] = null;

            await this.db.ref().update(updates);

            notificationService.info('Friend request cancelled');
            return true;
        } catch (error) {
            logger.error(LogCategory.SOCIAL, '[FriendsService] Cancel request error:', error);
            return false;
        }
    }

    /**
     * Remove a friend
     * @param {string} friendId - The friend's user ID
     */
    async removeFriend(friendId) {
        if (!this.db || !this.currentUserId) return false;

        try {
            const updates = {};
            updates[`friends/${this.currentUserId}/list/${friendId}`] = null;
            updates[`friends/${friendId}/list/${this.currentUserId}`] = null;

            await this.db.ref().update(updates);

            notificationService.info('Friend removed');
            return true;
        } catch (error) {
            logger.error(LogCategory.SOCIAL, '[FriendsService] Remove friend error:', error);
            return false;
        }
    }

    // ============ GETTERS ============

    /**
     * Get the friends list
     * @returns {Array} Array of friend objects
     */
    getFriendsList() {
        return Array.from(this.friends.values());
    }

    /**
     * Get online friends
     * @returns {Array} Array of online friend objects
     */
    getOnlineFriends() {
        return this.getFriendsList().filter(f => f.status === 'online');
    }

    /**
     * Get incoming friend requests
     * @returns {Array}
     */
    getIncomingRequests() {
        return Array.from(this.incomingRequests.values());
    }

    /**
     * Get outgoing friend requests
     * @returns {Array}
     */
    getOutgoingRequests() {
        return Array.from(this.outgoingRequests.values());
    }

    /**
     * Check if a user is a friend
     * @param {string} userId
     * @returns {boolean}
     */
    isFriend(userId) {
        return this.friends.has(userId);
    }

    /**
     * Get friend count
     * @returns {number}
     */
    getFriendCount() {
        return this.friends.size;
    }

    // ============ CLEANUP ============

    cleanup() {
        for (const listener of this.listeners) {
            listener.ref.off(listener.event);
        }
        this.listeners = [];
        this.friends.clear();
        this.incomingRequests.clear();
        this.outgoingRequests.clear();
        this.currentUserId = null;
    }
}

export const friendsService = new FriendsService();
export default FriendsService;
