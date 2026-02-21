/**
 * Firebase Leaderboard System for 2048
 * Global rankings with daily/weekly/all-time periods
 * Note: Requires Firebase configuration
 */

class LeaderboardManager {
    constructor() {
        this.firebaseConfig = null;
        this.db = null;
        this.initialized = false;
        this.currentPeriod = 'alltime';
        this.playerName = this.loadPlayerName();
        this.friendCode = this.generateOrLoadFriendCode();
    }

    /**
     * Initialize Firebase (requires config)
     */
    async initialize(config) {
        this.firebaseConfig = config;
        
        // For now, use localStorage as fallback (demo mode)
        // In production, replace with actual Firebase
        console.log('📊 Leaderboard: Demo mode (localStorage)');
        console.log('💡 Add Firebase config to enable online features');
        
        this.initialized = true;
        return true;
    }

    /**
     * Submit score to leaderboard
     */
    async submitScore(score, highestTile) {
        if (!this.playerName) {
            this.promptForPlayerName(() => {
                this.submitScore(score, highestTile);
            });
            return;
        }

        const entry = {
            playerName: this.playerName,
            friendCode: this.friendCode,
            score: score,
            highestTile: highestTile,
            timestamp: Date.now(),
            date: new Date().toISOString()
        };

        // Save to localStorage (demo mode)
        this.saveToLocalLeaderboard(entry);
        
        // Show success message
        this.showSubmitSuccess(score);
        
        return entry;
    }

    /**
     * Save to local leaderboard (demo mode)
     */
    saveToLocalLeaderboard(entry) {
        // Daily leaderboard
        const dailyKey = this.getDailyKey();
        this.addToLeaderboard('daily-' + dailyKey, entry);
        
        // Weekly leaderboard
        const weeklyKey = this.getWeeklyKey();
        this.addToLeaderboard('weekly-' + weeklyKey, entry);
        
        // All-time leaderboard
        this.addToLeaderboard('alltime', entry);
    }

    addToLeaderboard(key, entry) {
        const storageKey = `2048-leaderboard-${key}`;
        let leaderboard = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        leaderboard.push(entry);
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 100); // Keep top 100
        
        localStorage.setItem(storageKey, JSON.stringify(leaderboard));
    }

    /**
     * Get leaderboard for period
     */
    async getLeaderboard(period = 'alltime', limit = 50) {
        let key = period;
        
        if (period === 'daily') {
            key = 'daily-' + this.getDailyKey();
        } else if (period === 'weekly') {
            key = 'weekly-' + this.getWeeklyKey();
        }
        
        const storageKey = `2048-leaderboard-${key}`;
        const leaderboard = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        return leaderboard.slice(0, limit);
    }

    /**
     * Get player's rank
     */
    async getPlayerRank(period = 'alltime') {
        const leaderboard = await this.getLeaderboard(period, 100);
        const playerEntries = leaderboard.filter(e => e.friendCode === this.friendCode);
        
        if (playerEntries.length === 0) return null;
        
        const bestEntry = playerEntries[0];
        const rank = leaderboard.indexOf(bestEntry) + 1;
        
        return { rank, entry: bestEntry };
    }

    /**
     * Add friend by code
     */
    addFriend(friendCode) {
        const friends = this.loadFriends();
        
        if (friendCode === this.friendCode) {
            alert("You can't add yourself as a friend!");
            return false;
        }
        
        if (friends.includes(friendCode)) {
            alert('Friend already added!');
            return false;
        }
        
        friends.push(friendCode);
        localStorage.setItem('2048-friends', JSON.stringify(friends));
        
        this.showToast('Friend added!');
        return true;
    }

    /**
     * Get friends leaderboard
     */
    async getFriendsLeaderboard(period = 'alltime') {
        const allScores = await this.getLeaderboard(period, 100);
        const friends = this.loadFriends();
        friends.push(this.friendCode); // Include self
        
        const friendsScores = allScores.filter(e => friends.includes(e.friendCode));
        return friendsScores;
    }

    /**
     * Show leaderboard modal
     */
    async showLeaderboard() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'leaderboard-modal';
        
        modal.innerHTML = `
            <div class="modal-content leaderboard-modal">
                <button class="modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2><svg viewBox="0 0 24 24" width="24" height="24" fill="#ff4d00" style="vertical-align: text-bottom; margin-right: 10px;"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1l0 0c0 2.61 1.67 4.83 4 5.65V15c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-1.35c2.33-.82 4-3.04 4-5.65v-1c0-1.1-.9-2-2-2zM5 8v-1h2v1c0 2.4-1.72 4.39-4 4.88C3.17 11.23 3 9.66 3 8zm14 0c0 1.66-.17 3.23-.88 4.88-2.28-.49-4-2.48-4-4.88v-1h2v1z"/></svg> Global Leaderboard</h2>
                
                <div class="leaderboard-header">
                    <div class="player-info-card" style="flex:1;">
                        <div class="player-name" style="font-weight:bold; font-size:18px;"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="vertical-align: bottom; margin-right: 5px;"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> ${this.playerName || 'Anonymous'}</div>
                        <div class="friend-code" style="color:#888; font-size:14px; margin-top:5px;">
                            ID: <span class="code-value" style="font-family:monospace; padding:2px 6px;">${this.friendCode}</span>
                        </div>
                    </div>
                    <button class="btn-secondary" onclick="leaderboardManager.copyFriendCode()" title="Copy Friend Code"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right:5px;"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copy</button>
                    <button class="btn-secondary" onclick="leaderboardManager.showPlayerNameDialog()" title="Edit Name"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right:5px;"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg> Edit</button>
                </div>

                <div class="leaderboard-tabs">
                    <button class="tab-btn active" data-period="alltime">All Time</button>
                    <button class="tab-btn" data-period="weekly">This Week</button>
                    <button class="tab-btn" data-period="daily">Today</button>
                    <button class="tab-btn" data-period="friends">Friends</button>
                </div>

                <div class="leaderboard-list" id="leaderboard-list">
                    <div class="loading" style="text-align:center; padding:20px; color:#888;">Cannot connect to leaderboard server...</div>
                </div>

                <div class="leaderboard-actions" style="margin-top:20px; text-align:center; border-top:1px solid #333; padding-top:15px;">
                    <button class="btn-primary" onclick="leaderboardManager.showAddFriendDialog()">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="margin-right:5px; vertical-align:text-bottom;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Add Friend
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup tabs
        modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const period = e.target.dataset.period;
                this.updateLeaderboardContent(period);
            });
        });
        
        // Load initial data
        this.updateLeaderboardContent('alltime');
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    /**
     * Update leaderboard content
     */
    async updateLeaderboardContent(period) {
        const container = document.getElementById('leaderboard-list');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">Loading...</div>';
        
        let leaderboard;
        if (period === 'friends') {
            leaderboard = await this.getFriendsLeaderboard('alltime');
        } else {
            leaderboard = await this.getLeaderboard(period, 50);
        }
        
        if (leaderboard.length === 0) {
            container.innerHTML = '<div class="no-data">No scores yet. Be the first!</div>';
            return;
        }
        
        const playerRank = await this.getPlayerRank(period === 'friends' ? 'alltime' : period);
        
        container.innerHTML = leaderboard.map((entry, index) => {
            const rank = index + 1;
            const isPlayer = entry.friendCode === this.friendCode;
            
            let medalIcon = '';
            if (rank === 1) medalIcon = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#FFD700"><circle cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" fill="#000" font-weight="bold" font-size="12">1</text></svg>';
            else if (rank === 2) medalIcon = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#C0C0C0"><circle cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" fill="#000" font-weight="bold" font-size="12">2</text></svg>';
            else if (rank === 3) medalIcon = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#CD7F32"><circle cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" fill="#000" font-weight="bold" font-size="12">3</text></svg>';
            else medalIcon = `<span style="font-size: 18px; color: #888;">#${rank}</span>`;
            
            return `
                <div class="leaderboard-entry ${isPlayer ? 'is-player' : ''}">
                    <div class="entry-rank">${medalIcon}</div>
                    <div class="entry-info">
                        <div class="entry-name">${entry.playerName}${isPlayer ? ' (You)' : ''}</div>
                        <div class="entry-details" style="color: #666;">Highest: ${entry.highestTile}</div>
                    </div>
                    <div class="entry-score">${entry.score.toLocaleString()}</div>
                </div>
            `;
        }).join('');
    }

    /**
     * Helper functions
     */
    getDailyKey() {
        const now = new Date();
        return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    }

    getWeeklyKey() {
        const now = new Date();
        const week = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
        return `week-${week}`;
    }

    generateOrLoadFriendCode() {
        let code = localStorage.getItem('2048-friend-code');
        if (!code) {
            code = this.generateFriendCode();
            localStorage.setItem('2048-friend-code', code);
        }
        return code;
    }

    generateFriendCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }

    loadPlayerName() {
        return localStorage.getItem('2048-player-name') || null;
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'leaderboard-toast';
        toast.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="margin-right:10px;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> ${message}`;
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => toast.classList.add('show'));
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    loadFriends() {
        return JSON.parse(localStorage.getItem('2048-friends') || '[]');
    }

    copyFriendCode() {
        navigator.clipboard.writeText(this.friendCode);
        this.showToast('Friend code copied! 📋');
    }

    promptForPlayerName(callback) {
        const name = prompt('Enter your player name:', 'Player');
        if (name && name.trim()) {
            this.savePlayerName(name.trim());
            if (callback) callback();
        }
    }

    showPlayerNameDialog() {
        this.promptForPlayerName(() => {
            document.getElementById('leaderboard-modal')?.remove();
            this.showLeaderboard();
        });
    }

    showAddFriendDialog() {
        const code = prompt('Enter friend code:');
        if (code && code.trim()) {
            this.addFriend(code.trim().toUpperCase());
            this.updateLeaderboardContent('friends');
        }
    }

    showSubmitSuccess(score) {
        this.showToast(`Score ${score.toLocaleString()} submitted! 🎉`);
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'leaderboard-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
}

// Initialize leaderboard manager
const leaderboardManager = new LeaderboardManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderboardManager;
}
