/**
 * Friends Module
 * Handles friends list, requests, and search
 */

import { friendsService } from '../../services/FriendsService.js';
import { notificationService } from '../../services/NotificationService.js';
import { AVATAR_ICONS } from '../../services/GlobalStateManager.js';
import { eventBus } from '../../engine/EventBus.js';

export class FriendsManager {
    constructor(app) {
        this.app = app;
        this.searchTimeout = null;
    }

    init() {
        this.setupTabs();
        this.setupSearch();
        this.setupEventListeners();
        this.renderFriendsList();
        this.renderFriendRequests();
    }

    setupTabs() {
        const friendsTabs = document.querySelectorAll('.friends-tab');
        const friendsList = document.getElementById('friends-list');
        const requestsList = document.getElementById('friend-requests-list');

        friendsTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                friendsTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const tabType = tab.dataset.tab;
                if (tabType === 'friends') {
                    friendsList.style.display = 'block';
                    requestsList.style.display = 'none';
                } else {
                    friendsList.style.display = 'none';
                    requestsList.style.display = 'block';
                    this.renderFriendRequests();
                }
            });
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('add-friend-input');
        const searchResults = document.getElementById('friend-search-results');

        searchInput?.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }

            this.searchTimeout = setTimeout(async () => {
                const results = await friendsService.searchUsers(query);
                this.renderSearchResults(results, searchResults);
            }, 300);
        });

        // Hide search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput?.contains(e.target) && !searchResults?.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });

        // Add friend button
        const addFriendBtn = document.getElementById('add-friend-btn');
        addFriendBtn?.addEventListener('click', async () => {
            const query = searchInput.value.trim();
            if (!query) return;
            const results = await friendsService.searchUsers(query);
            if (results.length === 1) {
                await this.sendFriendRequest(results[0].id);
                searchInput.value = '';
            } else if (results.length > 1) {
                this.renderSearchResults(results, searchResults);
            }
        });
    }

    setupEventListeners() {
        eventBus.on('friendsListUpdated', () => this.renderFriendsList());
        eventBus.on('friendRequestsUpdated', ({ incoming }) => {
            this.renderFriendRequests();
            this.updateBadgeCount(incoming.length);
        });
        eventBus.on('friendStatusChanged', (friend) => this.updateFriendStatus(friend));
    }

    renderFriendsList() {
        const container = document.getElementById('friends-list');
        const friendCount = document.getElementById('online-friends-count');
        if (!container) return;

        const friends = friendsService.getFriendsList();

        if (friendCount) {
            friendCount.textContent = friends.length;
            friendCount.style.display = friends.length > 0 ? 'inline' : 'none';
        }

        if (friends.length === 0) {
            container.innerHTML = `
                <div class="friends-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <line x1="19" y1="8" x2="19" y2="14"/>
                        <line x1="22" y1="11" x2="16" y2="11"/>
                    </svg>
                    <p>No friends yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = friends.map(friend => `
            <div class="friend-item" data-friendid="${friend.id}">
                <div class="friend-avatar">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                    <span class="friend-status-dot ${friend.status || 'offline'}"></span>
                </div>
                <div class="friend-info">
                    <div class="friend-name">${friend.name || 'Player'}</div>
                    <div class="friend-status ${friend.status || ''}">${this.getStatusText(friend)}</div>
                </div>
                <div class="friend-actions">
                    <button class="friend-action-btn chat-btn" title="Chat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </button>
                    <button class="friend-action-btn remove-btn" title="Remove">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        container.querySelectorAll('.friend-item').forEach(item => {
            const friendId = item.dataset.friendid;
            item.querySelector('.chat-btn')?.addEventListener('click', () => {
                this.app.openDMChat?.(friendId);
            });
            item.querySelector('.remove-btn')?.addEventListener('click', async () => {
                await friendsService.removeFriend(friendId);
                this.renderFriendsList();
            });
        });
    }

    renderFriendRequests() {
        const container = document.getElementById('friend-requests-list');
        if (!container) return;

        const incoming = friendsService.getIncomingRequests();
        const outgoing = friendsService.getOutgoingRequests();

        if (incoming.length === 0 && outgoing.length === 0) {
            container.innerHTML = `<div class="friends-empty"><p>No pending requests</p></div>`;
            return;
        }

        let html = '';

        if (incoming.length > 0) {
            html += '<div class="request-section"><div class="request-label">Incoming</div>';
            html += incoming.map(req => `
                <div class="friend-item request-item" data-requestid="${req.id}">
                    <div class="friend-avatar">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                    </div>
                    <div class="friend-info">
                        <div class="friend-name">${req.fromName || 'Player'}</div>
                        <div class="friend-status">Wants to be friends</div>
                    </div>
                    <div class="friend-actions" style="opacity:1;">
                        <button class="friend-action-btn accept" title="Accept">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>
                        </button>
                        <button class="friend-action-btn decline" title="Decline">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                </div>
            `).join('');
            html += '</div>';
        }

        if (outgoing.length > 0) {
            html += '<div class="request-section"><div class="request-label" style="margin-top:1rem;">Sent</div>';
            html += outgoing.map(req => `
                <div class="friend-item request-item" data-requestid="${req.id}">
                    <div class="friend-avatar">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                    </div>
                    <div class="friend-info">
                        <div class="friend-name">${req.toName || 'Player'}</div>
                        <div class="friend-status">Pending...</div>
                    </div>
                    <div class="friend-actions" style="opacity:1;">
                        <button class="friend-action-btn decline cancel-btn" title="Cancel">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                </div>
            `).join('');
            html += '</div>';
        }

        container.innerHTML = html;

        // Add event listeners
        container.querySelectorAll('.request-item').forEach(item => {
            const requestId = item.dataset.requestid;
            item.querySelector('.accept')?.addEventListener('click', async () => {
                await friendsService.acceptFriendRequest(requestId);
                this.renderFriendRequests();
                this.renderFriendsList();
            });
            item.querySelector('.decline')?.addEventListener('click', async () => {
                await friendsService.declineFriendRequest(requestId);
                this.renderFriendRequests();
            });
            item.querySelector('.cancel-btn')?.addEventListener('click', async () => {
                await friendsService.cancelFriendRequest(requestId);
                this.renderFriendRequests();
            });
        });
    }

    renderSearchResults(results, container) {
        if (!results || results.length === 0) {
            container.innerHTML = `<div class="search-result-item">No users found</div>`;
            container.style.display = 'block';
            return;
        }

        container.innerHTML = results.map(user => `
            <div class="search-result-item" data-userid="${user.id}">
                <div class="friend-avatar" style="width:28px;height:28px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;">
                        ${AVATAR_ICONS[user.avatar] || '<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>'}
                    </svg>
                </div>
                <div class="friend-info">
                    <div class="friend-name">${user.displayName || 'Player'}</div>
                    <div class="friend-status">Level ${user.level || 1}</div>
                </div>
                <button class="friend-action-btn add-btn" title="Add Friend">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
            </div>
        `).join('');

        container.style.display = 'block';

        // Add click handlers
        container.querySelectorAll('.search-result-item').forEach(item => {
            item.querySelector('.add-btn')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                const userId = item.dataset.userid;
                await this.sendFriendRequest(userId);
                container.style.display = 'none';
            });
        });
    }

    async sendFriendRequest(userId) {
        try {
            await friendsService.sendFriendRequest(userId);
            notificationService.success('Friend Request Sent');
        } catch (err) {
            console.error('Failed to send friend request:', err);
            notificationService.error(err.message || 'Could not send request');
        }
    }

    updateBadgeCount(count) {
        const badge = document.getElementById('request-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline' : 'none';
        }
    }

    updateFriendStatus(friend) {
        const friendEl = document.querySelector(`[data-friendid="${friend.id}"]`);
        if (friendEl) {
            const statusDot = friendEl.querySelector('.friend-status-dot');
            const statusText = friendEl.querySelector('.friend-status');
            if (statusDot) statusDot.className = `friend-status-dot ${friend.status}`;
            if (statusText) {
                statusText.textContent = friend.currentGame || friend.status;
                statusText.className = `friend-status ${friend.status}`;
            }
        }
    }

    getStatusText(friend) {
        if (friend.status === 'in-game') return `Playing ${friend.game || 'a game'}`;
        if (friend.status === 'online') return 'Online';
        return 'Offline';
    }
}

export default FriendsManager;
