/**
 * Breakout Game - Leaderboard System
 * Score tracking, rankings, and player profiles
 */

import { ICONS } from './Icons.js';

/**
 * LeaderboardManager - Handles high scores and rankings
 */
export class LeaderboardManager {
    constructor(game) {
        this.game = game;
        this.STORAGE_KEY = 'breakout_leaderboards';
        this.PLAYER_KEY = 'breakout_player_profile';
        
        // Load data
        this.leaderboards = this.load();
        this.playerProfile = this.loadPlayerProfile();
    }
    
    // ===== Storage =====
    
    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            return saved ? JSON.parse(saved) : this.createDefaultLeaderboards();
        } catch {
            return this.createDefaultLeaderboards();
        }
    }
    
    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.leaderboards));
        } catch (e) {
            console.warn('Failed to save leaderboards:', e);
        }
    }
    
    loadPlayerProfile() {
        try {
            const saved = localStorage.getItem(this.PLAYER_KEY);
            return saved ? JSON.parse(saved) : this.createDefaultProfile();
        } catch {
            return this.createDefaultProfile();
        }
    }
    
    savePlayerProfile() {
        try {
            localStorage.setItem(this.PLAYER_KEY, JSON.stringify(this.playerProfile));
        } catch (e) {
            console.warn('Failed to save player profile:', e);
        }
    }
    
    createDefaultLeaderboards() {
        return {
            global: [], // All-time high scores
            maps: {}, // Per-map high scores
            daily: { date: null, scores: [] },
            weekly: { week: null, scores: [] }
        };
    }
    
    createDefaultProfile() {
        return {
            name: 'Player',
            gamesPlayed: 0,
            totalScore: 0,
            bestScore: 0,
            bestMap: null,
            mapScores: {},
            lastPlayed: null
        };
    }
    
    // ===== Player Profile =====
    
    setPlayerName(name) {
        this.playerProfile.name = name.trim() || 'Player';
        this.savePlayerProfile();
    }
    
    getPlayerName() {
        return this.playerProfile.name;
    }
    
    // ===== Score Submission =====
    
    submitScore(score, mapId = 'classic', time = null) {
        const entry = {
            name: this.playerProfile.name,
            score,
            mapId,
            time,
            date: new Date().toISOString()
        };
        
        // Update player profile
        this.playerProfile.gamesPlayed++;
        this.playerProfile.totalScore += score;
        if (score > this.playerProfile.bestScore) {
            this.playerProfile.bestScore = score;
            this.playerProfile.bestMap = mapId;
        }
        this.playerProfile.lastPlayed = new Date().toISOString();
        
        // Update map-specific best
        if (!this.playerProfile.mapScores[mapId] || score > this.playerProfile.mapScores[mapId]) {
            this.playerProfile.mapScores[mapId] = score;
        }
        this.savePlayerProfile();
        
        // Add to global leaderboard
        this.addToLeaderboard(this.leaderboards.global, entry);
        
        // Add to map-specific leaderboard
        if (!this.leaderboards.maps[mapId]) {
            this.leaderboards.maps[mapId] = [];
        }
        this.addToLeaderboard(this.leaderboards.maps[mapId], entry);
        
        // Add to daily leaderboard
        this.updateDailyLeaderboard(entry);
        
        // Add to weekly leaderboard
        this.updateWeeklyLeaderboard(entry);
        
        this.save();
        
        // Return rank info
        const globalRank = this.getRank(this.leaderboards.global, score);
        const mapRank = this.getRank(this.leaderboards.maps[mapId], score);
        
        return { globalRank, mapRank, isNewBest: score === this.playerProfile.bestScore };
    }
    
    addToLeaderboard(leaderboard, entry, maxEntries = 100) {
        leaderboard.push(entry);
        leaderboard.sort((a, b) => b.score - a.score);
        if (leaderboard.length > maxEntries) {
            leaderboard.length = maxEntries;
        }
    }
    
    updateDailyLeaderboard(entry) {
        const today = new Date().toDateString();
        if (this.leaderboards.daily.date !== today) {
            this.leaderboards.daily = { date: today, scores: [] };
        }
        this.addToLeaderboard(this.leaderboards.daily.scores, entry, 50);
    }
    
    updateWeeklyLeaderboard(entry) {
        const weekNum = this.getWeekNumber();
        if (this.leaderboards.weekly.week !== weekNum) {
            this.leaderboards.weekly = { week: weekNum, scores: [] };
        }
        this.addToLeaderboard(this.leaderboards.weekly.scores, entry, 100);
    }
    
    getWeekNumber() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now - start;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        return `${now.getFullYear()}_${Math.floor(diff / oneWeek)}`;
    }
    
    getRank(leaderboard, score) {
        for (let i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].score <= score) {
                return i + 1;
            }
        }
        return leaderboard.length + 1;
    }
    
    // ===== Getters =====
    
    getGlobalLeaderboard(limit = 10) {
        return this.leaderboards.global.slice(0, limit);
    }
    
    getMapLeaderboard(mapId, limit = 10) {
        return (this.leaderboards.maps[mapId] || []).slice(0, limit);
    }
    
    getDailyLeaderboard(limit = 10) {
        const today = new Date().toDateString();
        if (this.leaderboards.daily.date !== today) {
            return [];
        }
        return this.leaderboards.daily.scores.slice(0, limit);
    }
    
    getWeeklyLeaderboard(limit = 10) {
        const weekNum = this.getWeekNumber();
        if (this.leaderboards.weekly.week !== weekNum) {
            return [];
        }
        return this.leaderboards.weekly.scores.slice(0, limit);
    }
    
    getPlayerStats() {
        return {
            name: this.playerProfile.name,
            gamesPlayed: this.playerProfile.gamesPlayed,
            totalScore: this.playerProfile.totalScore,
            bestScore: this.playerProfile.bestScore,
            bestMap: this.playerProfile.bestMap,
            averageScore: this.playerProfile.gamesPlayed > 0 
                ? Math.round(this.playerProfile.totalScore / this.playerProfile.gamesPlayed) 
                : 0
        };
    }
    
    // ===== UI =====
    
    showLeaderboard(defaultTab = 'global') {
        const existing = document.getElementById('leaderboard-overlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-overlay';
        
        const tabs = ['global', 'daily', 'weekly'];
        let activeTab = defaultTab;
        
        const renderContent = () => {
            let leaderboard;
            let title;
            
            switch (activeTab) {
                case 'daily':
                    leaderboard = this.getDailyLeaderboard(20);
                    title = "Today's Best";
                    break;
                case 'weekly':
                    leaderboard = this.getWeeklyLeaderboard(20);
                    title = "This Week's Best";
                    break;
                default:
                    leaderboard = this.getGlobalLeaderboard(20);
                    title = 'All-Time Best';
            }
            
            let html = `
                <div class="leaderboard-container">
                    <div class="leaderboard-header">
                        <h2 class="sidebar-title leaderboard-title-clean">LEADERBOARD</h2>
                        <button id="close-leaderboard" class="btn btn-ghost btn-small">✕</button>
                    </div>
                    
                    <div class="leaderboard-tabs">
                        ${tabs.map(tab => `
                            <button class="tab-btn ${tab === activeTab ? 'active' : ''}" data-tab="${tab}">${tab.toUpperCase()}</button>
                        `).join('')}
                    </div>
                    
                    <h3 class="leaderboard-subtitle">${title}</h3>
                    
                    <div class="leaderboard-list-wrapper">
                `;
            
            if (leaderboard.length === 0) {
                html += `<div class="leaderboard-empty-message">No scores yet. Be the first!</div>`;
            } else {
                for (let i = 0; i < leaderboard.length; i++) {
                    const entry = leaderboard[i];
                    const isMe = entry.name === this.playerProfile.name;
                    // Use SVGs for top ranks
                    const medal = i === 0 ? ICONS.CROWN : i === 1 ? ICONS.MEDAL : i === 2 ? ICONS.MEDAL : '';
                    
                    html += `
                        <div class="leaderboard-row ${isMe ? 'leaderboard-row-me' : ''}">
                            <div class="leaderboard-rank-info">
                                <span class="rank-badge ${i < 3 ? 'rank-badge-top' : ''}">
                                    ${medal ? `<span class="rank-medal">${medal}</span>` : (i + 1)}
                                </span>
                                <span class="leaderboard-player-name ${isMe ? 'leaderboard-player-name-me' : ''}">
                                    ${entry.name} ${isMe ? '(You)' : ''}
                                </span>
                            </div>
                            <span class="leaderboard-score">${entry.score.toLocaleString()}</span>
                        </div>
                    `;
                }
            }
            
            html += `</div>`; // Close leaderboard-list-wrapper
            
            // Player stats
            const stats = this.getPlayerStats();
            html += `
                <div class="player-stats-card">
                    <h3 class="player-stats-title">YOUR STATS</h3>
                    <div class="player-stats-grid">
                        <div class="player-stat-item">
                            <div class="player-stat-value player-stat-value-games">${stats.gamesPlayed}</div>
                            <div class="player-stat-label">Games</div>
                        </div>
                        <div class="player-stat-item">
                            <div class="player-stat-value player-stat-value-best">${stats.bestScore.toLocaleString()}</div>
                            <div class="player-stat-label">Best Score</div>
                        </div>
                        <div class="player-stat-item">
                            <div class="player-stat-value player-stat-value-avg">${stats.averageScore.toLocaleString()}</div>
                            <div class="player-stat-label">Average</div>
                        </div>
                    </div>
                </div>
            `;
            
            html += `
                <button id="close-leaderboard" class="btn btn-secondary leaderboard-close-btn">Close</button>
            </div> <!-- Close leaderboard-container -->
            `;
            
            overlay.innerHTML = html;
            
            // Tab event listeners
            overlay.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    activeTab = btn.dataset.tab;
                    renderContent();
                });
            });
            
            document.getElementById('close-leaderboard').addEventListener('click', () => {
                overlay.remove();
            });
        };
        
        document.body.appendChild(overlay);
        renderContent();
    }
    
    showScoreSubmission(score, mapId, onComplete) {
        const rank = this.submitScore(score, mapId);
        
        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-overlay';
        
        let message = '';
        if (rank.isNewBest) {
            message = `<div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: #7dba84;">
                <span class="rank-badge" style="color: #7dba84;">${ICONS.TROPHY}</span> New Personal Best!
            </div>`;
        } else if (rank.globalRank <= 10) {
            message = `<div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: #7dba84;">
                <span class="rank-badge" style="color: #e8eaed;">${ICONS.CROWN}</span> Top 10 Global! Rank #${rank.globalRank}
            </div>`;
        } else if (rank.mapRank <= 10) {
            message = `<div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: #7dba84;">
                <span class="rank-badge" style="color: #c9a857;">${ICONS.STAR}</span> Top 10 on this map! Rank #${rank.mapRank}
            </div>`;
        }
        
        overlay.innerHTML = `
            <div class="leaderboard-container leaderboard-submission-container">
                <h2 class="sidebar-title leaderboard-submission-title">SCORE SUBMITTED!</h2>
                <div class="submission-score">${score.toLocaleString()}</div>
                ${message ? `<div class="submission-message">${message}</div>` : ''}
                <div class="rank-info-text">
                    Global Rank: #${rank.globalRank} | Map Rank: #${rank.mapRank}
                </div>
                <div class="submission-buttons">
                    <button id="view-leaderboard" class="btn btn-primary" style="flex: 1;">View Leaderboard</button>
                    <button id="continue-btn" class="btn btn-ghost" style="flex: 1;">Continue</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        document.getElementById('view-leaderboard').addEventListener('click', () => {
            overlay.remove();
            this.showLeaderboard();
        });
        
        document.getElementById('continue-btn').addEventListener('click', () => {
            overlay.remove();
            if (onComplete) onComplete();
        });
    }
    
    showNamePrompt(callback) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(13, 17, 23, 0.95);
            z-index: 2000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        `;
        
        overlay.innerHTML = `
            <h2 style="color: #e8eaed; margin-bottom: 20px;">Enter Your Name</h2>
            <input type="text" id="name-input" value="${this.playerProfile.name}" maxlength="20" style="
                padding: 15px 20px;
                background: #22262e;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                color: #e8eaed;
                font-size: 1.1rem;
                text-align: center;
                width: 250px;
            ">
            <button id="save-name" style="
                margin-top: 20px;
                padding: 12px 30px;
                background: #6b8aad;
                border: none;
                border-radius: 8px;
                color: #fff;
                cursor: pointer;
            ">Save</button>
        `;
        
        document.body.appendChild(overlay);
        document.getElementById('name-input').focus();
        document.getElementById('name-input').select();
        
        const saveName = () => {
            const name = document.getElementById('name-input').value.trim();
            if (name) {
                this.setPlayerName(name);
            }
            overlay.remove();
            if (callback) callback(this.playerProfile.name);
        };
        
        document.getElementById('save-name').addEventListener('click', saveName);
        document.getElementById('name-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveName();
        });
    }
    
    // Sidebar panel for in-game display
    renderSidebarPanel() {
        const container = document.getElementById('leaderboard-sidebar');
        if (!container) return;
        
        const topScores = this.getGlobalLeaderboard(5);
        let html = '';
        
        if (topScores.length === 0) {
            html = '<div style="color: #6b7280; font-size: 0.75rem; text-align: center;">No scores yet</div>';
        } else {
            for (let i = 0; i < topScores.length; i++) {
                const entry = topScores[i];
                const isMe = entry.name === this.playerProfile.name;
                html += `
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.75rem; ${isMe ? 'color: #6b8aad;' : 'color: #9aa0a6;'}">
                        <span>${i + 1}. ${entry.name}</span>
                        <span>${entry.score.toLocaleString()}</span>
                    </div>
                `;
            }
        }
        
        container.innerHTML = html;
    }
}

export default { LeaderboardManager };
