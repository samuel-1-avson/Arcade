/**
 * ChatService - Messaging System
 * Handles direct messages between friends and party chat
 * Uses Firebase Realtime Database for real-time messaging
 */

import { eventBus } from '../engine/EventBus.js';
import { globalStateManager } from './GlobalStateManager.js';
import { notificationService } from './NotificationService.js';
import { sanitizeChatMessage, sanitizeDisplayName, sanitizeHTML } from '../utils/sanitize.js';
import { rateLimiter, RATE_LIMITS } from '../utils/rateLimiter.js';
import { logger, LogCategory } from '../utils/logger.js';

class ChatService {
    constructor() {
        this.db = null;
        this.currentUserId = null;
        this.activeConversations = new Map(); // conversationId -> { messages, listener }
        this.unreadCounts = new Map(); // conversationId -> count
        this.initialized = false;
    }

    /**
     * Initialize the chat service
     */
    async init() {
        if (this.initialized) return;

        // Wait for Firebase
        if (typeof firebase !== 'undefined' && firebase.database) {
            this.db = firebase.database();
        } else {
            logger.warn(LogCategory.SOCIAL, '[ChatService] Firebase RTDB not available');
            return;
        }

        // Get current user ID
        if (firebase.auth().currentUser) {
            this.currentUserId = firebase.auth().currentUser.uid;
            this.listenToUnreadMessages();
        }

        // Listen for auth changes
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUserId = user.uid;
                this.listenToUnreadMessages();
            } else {
                this.cleanup();
            }
        });

        this.initialized = true;
        logger.info(LogCategory.SOCIAL, '[ChatService] Initialized');
    }

    // ============ DIRECT MESSAGES ============

    /**
     * Get conversation ID for two users (consistent regardless of order)
     */
    getConversationId(userId1, userId2) {
        return [userId1, userId2].sort().join('_');
    }

    /**
     * Send a direct message to a friend
     * @param {string} friendId - The friend's user ID
     * @param {string} text - Message content
     */
    async sendDirectMessage(friendId, text) {
        if (!this.db || !this.currentUserId) {
            notificationService.error('Please sign in to send messages');
            return false;
        }

        if (!text || text.trim().length === 0) return false;

        try {
            // Apply rate limiting
            await rateLimiter.execute('CHAT', async () => {
                const profile = globalStateManager.getProfile();
                const conversationId = this.getConversationId(this.currentUserId, friendId);
                const messageRef = this.db.ref(`messages/dm/${conversationId}`).push();
                
                // Sanitize message text to prevent XSS
                const sanitizedText = sanitizeChatMessage(text);
                if (!sanitizedText) {
                    notificationService.error('Message cannot be empty');
                    return false;
                }
                
                await messageRef.set({
                    from: this.currentUserId,
                    fromName: sanitizeDisplayName(profile.displayName),
                    fromAvatar: profile.avatar,
                    text: sanitizedText,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    read: false
                });

                // Update conversation metadata (use sanitized preview)
                const messagePreview = sanitizedText.substring(0, 50);
                await this.db.ref(`conversations/${this.currentUserId}/${conversationId}`).update({
                    lastMessage: messagePreview,
                    lastTimestamp: firebase.database.ServerValue.TIMESTAMP,
                    withUser: friendId
                });

                await this.db.ref(`conversations/${friendId}/${conversationId}`).update({
                    lastMessage: messagePreview,
                    lastTimestamp: firebase.database.ServerValue.TIMESTAMP,
                    withUser: this.currentUserId,
                    unread: firebase.database.ServerValue.increment(1)
                });
            }, RATE_LIMITS.CHAT);

            return true;
        } catch (error) {
            if (error.rateLimited) {
                notificationService.error(error.message);
            } else {
                logger.error(LogCategory.SOCIAL, '[ChatService] Send DM error:', error);
                notificationService.error('Failed to send message');
            }
            return false;
        }
    }

    /**
     * Listen to a conversation for real-time messages
     * @param {string} friendId - The friend's user ID
     * @param {function} callback - Called when messages update
     * @returns {function} Unsubscribe function
     */
    listenToConversation(friendId, callback) {
        if (!this.db || !this.currentUserId) return () => {};

        const conversationId = this.getConversationId(this.currentUserId, friendId);
        const messagesRef = this.db.ref(`messages/dm/${conversationId}`)
            .orderByChild('timestamp')
            .limitToLast(100);

        const listener = messagesRef.on('value', (snapshot) => {
            const messages = [];
            snapshot.forEach((child) => {
                const msgData = child.val();
                // Double-sanitize on receive to prevent stored XSS
                messages.push({
                    id: child.key,
                    from: msgData.from,
                    fromName: sanitizeHTML(msgData.fromName || 'Unknown'),
                    fromAvatar: msgData.fromAvatar,
                    text: sanitizeHTML(msgData.text || ''),
                    timestamp: msgData.timestamp,
                    read: msgData.read,
                    isOwn: msgData.from === this.currentUserId
                });
            });
            
            this.activeConversations.set(conversationId, { messages, listener });
            callback(messages);
        });

        // Mark messages as read
        this.markConversationAsRead(conversationId);

        return () => {
            messagesRef.off('value', listener);
            this.activeConversations.delete(conversationId);
        };
    }

    /**
     * Get conversation history
     * @param {string} friendId
     * @param {number} limit
     */
    async getConversationHistory(friendId, limit = 50) {
        if (!this.db || !this.currentUserId) return [];

        const conversationId = this.getConversationId(this.currentUserId, friendId);
        
        try {
            const snapshot = await this.db.ref(`messages/dm/${conversationId}`)
                .orderByChild('timestamp')
                .limitToLast(limit)
                .once('value');

            const messages = [];
            snapshot.forEach((child) => {
                const msgData = child.val();
                // Sanitize on retrieval to prevent XSS
                messages.push({
                    id: child.key,
                    from: msgData.from,
                    fromName: sanitizeHTML(msgData.fromName || 'Unknown'),
                    fromAvatar: msgData.fromAvatar,
                    text: sanitizeHTML(msgData.text || ''),
                    timestamp: msgData.timestamp,
                    read: msgData.read,
                    isOwn: msgData.from === this.currentUserId
                });
            });

            return messages;
        } catch (error) {
            logger.error(LogCategory.SOCIAL, '[ChatService] Get history error:', error);
            return [];
        }
    }

    /**
     * Mark a conversation as read
     */
    async markConversationAsRead(conversationId) {
        if (!this.db || !this.currentUserId) return;

        try {
            await this.db.ref(`conversations/${this.currentUserId}/${conversationId}/unread`).set(0);
        } catch (error) {
            logger.error(LogCategory.SOCIAL, '[ChatService] Mark read error:', error);
        }
    }

    /**
     * Listen for unread message counts across all conversations
     */
    listenToUnreadMessages() {
        if (!this.db || !this.currentUserId) return;

        const conversationsRef = this.db.ref(`conversations/${this.currentUserId}`);
        conversationsRef.on('value', (snapshot) => {
            let totalUnread = 0;
            this.unreadCounts.clear();

            snapshot.forEach((child) => {
                const data = child.val();
                if (data.unread > 0) {
                    this.unreadCounts.set(child.key, data.unread);
                    totalUnread += data.unread;
                }
            });

            eventBus.emit('unreadMessagesUpdated', {
                total: totalUnread,
                byConversation: Object.fromEntries(this.unreadCounts)
            });
        });
    }

    // ============ PARTY CHAT ============

    /**
     * Send a message to party chat
     * @param {string} partyId - The party ID
     * @param {string} text - Message content
     */
    async sendPartyMessage(partyId, text) {
        if (!this.db || !this.currentUserId) return false;
        
        // Sanitize input
        const sanitizedText = sanitizeChatMessage(text);
        if (!sanitizedText) return false;

        try {
            // Apply rate limiting
            await rateLimiter.execute('CHAT', async () => {
                const profile = globalStateManager.getProfile();
                const messageRef = this.db.ref(`messages/party/${partyId}`).push();
                
                await messageRef.set({
                    from: this.currentUserId,
                    name: sanitizeDisplayName(profile.displayName),
                    avatar: profile.avatar,
                    text: sanitizedText,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            }, RATE_LIMITS.CHAT);

            return true;
        } catch (error) {
            if (error.rateLimited) {
                notificationService.warning('Please slow down your messages');
            } else {
                logger.error(LogCategory.SOCIAL, '[ChatService] Send party message error:', error);
            }
            return false;
        }
    }

    /**
     * Listen to party chat messages
     * @param {string} partyId - The party ID
     * @param {function} callback - Called when messages update
     * @returns {function} Unsubscribe function
     */
    listenToPartyChat(partyId, callback) {
        if (!this.db) return () => {};

        const chatRef = this.db.ref(`messages/party/${partyId}`)
            .orderByChild('timestamp')
            .limitToLast(50);

        const listener = chatRef.on('value', (snapshot) => {
            const messages = [];
            snapshot.forEach((child) => {
                const msgData = child.val();
                // Sanitize on receive to prevent stored XSS
                messages.push({
                    id: child.key,
                    from: msgData.from,
                    name: sanitizeHTML(msgData.name || 'Unknown'),
                    avatar: msgData.avatar,
                    text: sanitizeHTML(msgData.text || ''),
                    timestamp: msgData.timestamp,
                    isOwn: msgData.from === this.currentUserId
                });
            });
            
            callback(messages);
            eventBus.emit('partyChatUpdated', { partyId, messages });
        });

        // Also listen for new messages individually for notifications
        const newMsgListener = chatRef.on('child_added', (snapshot) => {
            const msg = snapshot.val();
            if (msg.from !== this.currentUserId) {
                eventBus.emit('partyChatMessage', {
                    partyId,
                    message: { id: snapshot.key, ...msg }
                });
            }
        });

        return () => {
            chatRef.off('value', listener);
            chatRef.off('child_added', newMsgListener);
        };
    }

    /**
     * Delete party chat history (for party leaders when party ends)
     * @param {string} partyId
     */
    async clearPartyChat(partyId) {
        if (!this.db) return;

        try {
            await this.db.ref(`messages/party/${partyId}`).remove();
        } catch (error) {
            logger.error(LogCategory.SOCIAL, '[ChatService] Clear party chat error:', error);
        }
    }

    // ============ GETTERS ============

    /**
     * Get total unread message count
     */
    getTotalUnread() {
        let total = 0;
        for (const count of this.unreadCounts.values()) {
            total += count;
        }
        return total;
    }

    /**
     * Get recent conversations
     */
    async getRecentConversations() {
        if (!this.db || !this.currentUserId) return [];

        try {
            const snapshot = await this.db.ref(`conversations/${this.currentUserId}`)
                .orderByChild('lastTimestamp')
                .limitToLast(20)
                .once('value');

            const conversations = [];
            snapshot.forEach((child) => {
                conversations.push({
                    id: child.key,
                    ...child.val()
                });
            });

            return conversations.reverse(); // Most recent first
        } catch (error) {
            logger.error(LogCategory.SOCIAL, '[ChatService] Get conversations error:', error);
            return [];
        }
    }

    // ============ CLEANUP ============

    cleanup() {
        for (const [id, data] of this.activeConversations) {
            if (data.listener) {
                this.db?.ref(`messages/dm/${id}`)?.off('value', data.listener);
            }
        }
        this.activeConversations.clear();
        this.unreadCounts.clear();
        this.currentUserId = null;
    }
}

export const chatService = new ChatService();
export default ChatService;
