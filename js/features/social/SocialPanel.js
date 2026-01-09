/**
 * SocialPanel - Friends, Chat, and Party UI Component
 * Handles social interactions including friends list, DM chat, and party system
 */

import { friendsService } from '../services/FriendsService.js';
import { chatService } from '../services/ChatService.js';
import { partyService } from '../services/PartyService.js';
import { eventBus } from '../engine/EventBus.js';
import { globalStateManager } from '../services/GlobalStateManager.js';
import { notificationService } from '../services/NotificationService.js';

/**
 * SocialPanel manages all social UI components
 */
class SocialPanel {
    constructor(arcadeHub) {
        this.hub = arcadeHub;
        this.currentDMFriend = null;
        this.dmUnsubscribe = null;
    }

    /**
     * Initialize social panel
     */
    setup() {
        this.setupFriendsUI();
        this.setupPartyChatUI();
        this.setupEventListeners();
    }

    /**
     * Set up friends list UI
     */
    setupFriendsUI() {
        // Search functionality
        const searchInput = document.getElementById('friend-search-input');
        const searchBtn = document.getElementById('friend-search-btn');
        const resultsContainer = document.getElementById('friend-search-results');

        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', async () => {
                const query = searchInput.value.trim();
                if (query.length < 2) return;
                
                searchBtn.disabled = true;
                try {
                    const results = await friendsService.searchUsers(query);
                    this.renderSearchResults(results, resultsContainer);
                } catch (e) {
                    console.error('Search failed:', e);
                } finally {
                    searchBtn.disabled = false;
                }
            });
        }

        // Initial render
        this.renderFriendsList();
        this.renderFriendRequests();
    }

    /**
     * Render search results
     */
    renderSearchResults(results, container) {
        if (!container) return;
        
        if (results.length === 0) {
            container.innerHTML = '<p class="no-results">No users found</p>';
            return;
        }

        container.innerHTML = results.map(user => `
            <div class="search-result-item" data-user-id="${user.id}">
                <span class="user-name">${this.escapeHtml(user.displayName)}</span>
                <button class="btn-add-friend" data-user-id="${user.id}">
                    Add Friend
                </button>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.btn-add-friend').forEach(btn => {
            btn.addEventListener('click', () => {
                this.sendFriendRequest(btn.dataset.userId);
            });
        });
    }

    /**
     * Send friend request
     */
    async sendFriendRequest(userId) {
        try {
            await friendsService.sendFriendRequest(userId);
            notificationService.showToast('Friend request sent!', 'success');
        } catch (e) {
            console.error('Failed to send request:', e);
            notificationService.showToast('Failed to send request', 'error');
        }
    }

    /**
     * Render friends list
     */
    renderFriendsList() {
        const container = document.getElementById('friends-list');
        if (!container) return;

        const friends = friendsService.getFriendsList();
        
        if (friends.length === 0) {
            container.innerHTML = '<p class="empty-state">No friends yet</p>';
            return;
        }

        container.innerHTML = friends.map(friend => `
            <div class="friend-item ${friend.status === 'online' ? 'online' : ''}" 
                 data-friend-id="${friend.id}">
                <div class="friend-avatar">
                    <span class="status-dot ${friend.status}"></span>
                </div>
                <div class="friend-info">
                    <span class="friend-name">${this.escapeHtml(friend.name)}</span>
                    <span class="friend-status">${this.getFriendStatusText(friend)}</span>
                </div>
                <div class="friend-actions">
                    <button class="btn-dm" data-friend-id="${friend.id}" 
                            data-friend-name="${this.escapeHtml(friend.name)}">
                        Chat
                    </button>
                </div>
            </div>
        `).join('');

        // Add DM button handlers
        container.querySelectorAll('.btn-dm').forEach(btn => {
            btn.addEventListener('click', () => {
                this.openDMChat(btn.dataset.friendId, btn.dataset.friendName);
            });
        });
    }

    /**
     * Get friend status text
     */
    getFriendStatusText(friend) {
        if (friend.status === 'online') {
            return friend.currentGame ? `Playing ${friend.currentGame}` : 'Online';
        }
        return 'Offline';
    }

    /**
     * Render friend requests
     */
    renderFriendRequests() {
        const container = document.getElementById('friend-requests');
        if (!container) return;

        const incoming = friendsService.getIncomingRequests();
        
        if (incoming.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <h4>Friend Requests (${incoming.length})</h4>
            ${incoming.map(req => `
                <div class="request-item" data-request-id="${req.id}">
                    <span class="request-name">${this.escapeHtml(req.fromName)}</span>
                    <div class="request-actions">
                        <button class="btn-accept" data-request-id="${req.id}">Accept</button>
                        <button class="btn-decline" data-request-id="${req.id}">Decline</button>
                    </div>
                </div>
            `).join('')}
        `;

        // Add handlers
        container.querySelectorAll('.btn-accept').forEach(btn => {
            btn.addEventListener('click', async () => {
                await friendsService.acceptFriendRequest(btn.dataset.requestId);
                this.renderFriendRequests();
                this.renderFriendsList();
            });
        });

        container.querySelectorAll('.btn-decline').forEach(btn => {
            btn.addEventListener('click', async () => {
                await friendsService.declineFriendRequest(btn.dataset.requestId);
                this.renderFriendRequests();
            });
        });

        this.updateRequestBadge();
    }

    /**
     * Update friend request badge
     */
    updateRequestBadge() {
        const badge = document.getElementById('friend-request-badge');
        const count = friendsService.getIncomingRequests().length;
        
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline' : 'none';
        }
    }

    /**
     * Open DM chat modal
     */
    openDMChat(friendId, friendName) {
        this.currentDMFriend = friendId;
        
        const modal = document.getElementById('dm-chat-modal');
        if (!modal) return;

        const titleEl = modal.querySelector('.chat-friend-name');
        if (titleEl) titleEl.textContent = friendName;

        modal.classList.add('open');

        // Subscribe to messages
        if (this.dmUnsubscribe) this.dmUnsubscribe();
        this.dmUnsubscribe = chatService.listenToConversation(friendId, (messages) => {
            this.renderDMMessages(friendId, messages);
        });

        // Set up send handler
        const sendBtn = modal.querySelector('.dm-send-btn');
        const input = modal.querySelector('.dm-input');
        
        const sendMessage = async () => {
            const text = input.value.trim();
            if (!text) return;
            
            input.value = '';
            await chatService.sendDirectMessage(friendId, text);
        };

        sendBtn?.addEventListener('click', sendMessage);
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // Close handler
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn?.addEventListener('click', () => {
            modal.classList.remove('open');
            if (this.dmUnsubscribe) {
                this.dmUnsubscribe();
                this.dmUnsubscribe = null;
            }
        });
    }

    /**
     * Render DM messages
     */
    renderDMMessages(friendId, messages) {
        const container = document.getElementById('dm-messages');
        if (!container) return;

        const currentUserId = globalStateManager.getProfile().id;

        container.innerHTML = messages.map(msg => `
            <div class="dm-message ${msg.senderId === currentUserId ? 'sent' : 'received'}">
                <div class="message-content">${this.escapeHtml(msg.text)}</div>
                <div class="message-time">${this.formatTime(msg.timestamp)}</div>
            </div>
        `).join('');

        container.scrollTop = container.scrollHeight;
    }

    /**
     * Set up party chat UI
     */
    setupPartyChatUI() {
        const container = document.getElementById('party-chat');
        if (!container) return;

        const sendBtn = container.querySelector('.party-send-btn');
        const input = container.querySelector('.party-chat-input');

        const sendMessage = async () => {
            const text = input.value.trim();
            if (!text) return;
            
            const party = partyService.getCurrentParty();
            if (!party) return;

            input.value = '';
            await chatService.sendPartyMessage(party.code, text);
        };

        sendBtn?.addEventListener('click', sendMessage);
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    /**
     * Render party chat messages
     */
    renderPartyChatMessages(messages) {
        const container = document.getElementById('party-messages');
        if (!container) return;

        const currentUserId = globalStateManager.getProfile().id;

        container.innerHTML = messages.map(msg => `
            <div class="party-message ${msg.userId === currentUserId ? 'own' : ''}">
                <span class="message-author">${this.escapeHtml(msg.userName)}</span>
                <span class="message-text">${this.escapeHtml(msg.text)}</span>
            </div>
        `).join('');

        container.scrollTop = container.scrollHeight;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        eventBus.on('friendsUpdated', () => {
            this.renderFriendsList();
        });

        eventBus.on('friendRequestReceived', () => {
            this.renderFriendRequests();
        });

        eventBus.on('partyChatMessage', ({ messages }) => {
            this.renderPartyChatMessages(messages);
        });
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format timestamp to readable time
     */
    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp.toDate?.() || new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

export { SocialPanel };
export default SocialPanel;
