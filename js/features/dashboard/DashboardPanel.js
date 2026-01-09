/**
 * DashboardPanel - Dashboard UI Component
 * Handles stats display, leaderboard preview, and daily challenges
 */

import { globalStateManager } from '../services/GlobalStateManager.js';
import { leaderboardService } from '../services/LeaderboardService.js';
import { dailyChallengeService } from '../services/DailyChallengeService.js';
import { eventBus } from '../engine/EventBus.js';
import { GAME_REGISTRY } from '../config/gameRegistry.js';

/**
 * DashboardPanel manages the main dashboard UI
 */
class DashboardPanel {
    constructor(arcadeHub) {
        this.hub = arcadeHub;
    }

    /**
     * Initialize dashboard
     */
    setup() {
        this.updateDashboard();
        this.setupEventListeners();
    }

    /**
     * Update entire dashboard
     */
    async updateDashboard() {
        this.updateStats();
        this.updateLeaderboardPreview();
        this.updateBestGames();
        this.renderDailyChallenges();
    }

    /**
     * Update stats display
     */
    updateStats() {
        const profile = globalStateManager.getProfile();
        const stats = globalStateManager.getStatistics();

        // Update level display
        const levelEl = document.getElementById('player-level');
        if (levelEl) levelEl.textContent = profile.level || 1;

        // Update XP bar
        const progress = globalStateManager.getLevelProgress();
        const xpBar = document.querySelector('.xp-progress-fill');
        if (xpBar) {
            xpBar.style.width = `${progress.progress * 100}%`;
        }

        const xpText = document.querySelector('.xp-text');
        if (xpText) {
            xpText.textContent = `${progress.current} / ${progress.needed} XP`;
        }

        // Update main stats
        const gamesPlayed = document.getElementById('stat-games-played');
        if (gamesPlayed) gamesPlayed.textContent = stats.totalGamesPlayed || 0;

        const totalScore = document.getElementById('stat-total-score');
        if (totalScore) totalScore.textContent = (stats.totalScore || 0).toLocaleString();

        const achievements = document.getElementById('stat-achievements');
        if (achievements) achievements.textContent = profile.totalAchievements || 0;

        const streak = document.getElementById('stat-streak');
        if (streak) streak.textContent = stats.currentStreak || 0;
    }

    /**
     * Update leaderboard preview
     */
    async updateLeaderboardPreview() {
        const container = document.getElementById('leaderboard-preview');
        if (!container) return;

        try {
            const topPlayers = await leaderboardService.getGlobalLeaderboard(5);
            
            if (topPlayers.length === 0) {
                container.innerHTML = '<p class="empty-state">No leaderboard data yet</p>';
                return;
            }

            container.innerHTML = topPlayers.map((player, index) => `
                <div class="leaderboard-row ${player.isCurrentUser ? 'current-user' : ''}">
                    <span class="rank">#${index + 1}</span>
                    <span class="name">${this.escapeHtml(player.name)}</span>
                    <span class="score">${(player.score || 0).toLocaleString()}</span>
                </div>
            `).join('');
        } catch (e) {
            console.error('Failed to load leaderboard:', e);
        }
    }

    /**
     * Update best games display
     */
    updateBestGames() {
        const container = document.getElementById('best-games');
        if (!container) return;

        const stats = globalStateManager.getStatistics();
        const gameStats = Object.entries(stats.gameStats)
            .filter(([_, s]) => s.highScore > 0)
            .sort((a, b) => b[1].highScore - a[1].highScore)
            .slice(0, 3);

        if (gameStats.length === 0) {
            container.innerHTML = '<p class="empty-state">Play some games to see your best scores!</p>';
            return;
        }

        container.innerHTML = gameStats.map(([gameId, stat]) => {
            const game = GAME_REGISTRY[gameId];
            return `
                <div class="best-game-item">
                    <span class="game-name">${game?.name || gameId}</span>
                    <span class="high-score">${stat.highScore.toLocaleString()}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Render daily challenges
     */
    renderDailyChallenges() {
        const container = document.getElementById('daily-challenges');
        if (!container) return;

        const challenges = dailyChallengeService.getChallenges();
        
        if (challenges.length === 0) {
            container.innerHTML = '<p class="empty-state">No challenges today</p>';
            return;
        }

        container.innerHTML = challenges.map(challenge => `
            <div class="challenge-item ${challenge.completed ? 'completed' : ''}">
                <div class="challenge-icon">${challenge.icon || '🎯'}</div>
                <div class="challenge-info">
                    <span class="challenge-title">${this.escapeHtml(challenge.title)}</span>
                    <span class="challenge-desc">${this.escapeHtml(challenge.description)}</span>
                </div>
                <div class="challenge-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(challenge.progress / challenge.target) * 100}%"></div>
                    </div>
                    <span class="progress-text">${challenge.progress}/${challenge.target}</span>
                </div>
                <div class="challenge-reward">
                    <span class="xp-reward">+${challenge.xpReward} XP</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        eventBus.on('globalStateChange', () => {
            this.updateStats();
        });

        eventBus.on('scoreSubmitted', () => {
            this.updateBestGames();
        });

        eventBus.on('challengeUpdated', () => {
            this.renderDailyChallenges();
        });
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

export { DashboardPanel };
export default DashboardPanel;
