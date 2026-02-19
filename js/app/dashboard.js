/**
 * Dashboard Module
 * Handles dashboard UI, stats, and profile display
 */

import { globalStateManager, AVATAR_ICONS } from '../services/GlobalStateManager.js';
import { achievementService } from '../services/AchievementService.js';
import { leaderboardService } from '../services/LeaderboardService.js';
import { eventBus } from '../engine/EventBus.js';
import { GAME_ICONS } from '../config/gameRegistry.js';

export class DashboardManager {
    constructor(app, games) {
        this.app = app;
        this.games = games;
    }

    init() {
        this.update();
        eventBus.on('globalStateChange', () => this.update());
    }

    async update() {
        const profile = globalStateManager.getProfile();
        const stats = globalStateManager.getStatistics();
        const levelProgress = globalStateManager.getLevelProgress();

        this.updateProfileCard(profile, stats, levelProgress);
        await this.updateLeaderboardPreview();
        this.updateBestGames(stats);
    }

    updateProfileCard(profile, stats, levelProgress) {
        const avatarEl = document.getElementById('profile-avatar');
        const nameEl = document.getElementById('profile-name');
        const titleEl = document.getElementById('profile-title');
        const levelBadge = document.getElementById('level-badge');
        const xpText = document.getElementById('xp-text');
        const xpFill = document.getElementById('xp-fill');
        const gamesPlayed = document.getElementById('games-played');
        const achievementsCount = document.getElementById('achievements-count');
        const totalPlaytime = document.getElementById('total-playtime');
        const streakCount = document.getElementById('streak-count');

        if (avatarEl) {
            const iconSvg = AVATAR_ICONS[profile.avatar] || '';
            avatarEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>`;
        }
        if (nameEl) nameEl.textContent = profile.displayName;
        if (titleEl) {
            titleEl.textContent = profile.title;
            titleEl.style.color = profile.titleColor;
        }
        if (levelBadge) levelBadge.textContent = `Lv. ${profile.level}`;
        if (xpText) xpText.textContent = `${levelProgress.current} / ${levelProgress.needed} XP`;
        if (xpFill) xpFill.style.width = `${levelProgress.progress * 100}%`;
        if (gamesPlayed) gamesPlayed.textContent = stats.totalGamesPlayed.toLocaleString();
        if (achievementsCount) {
            const metaCount = achievementService.getUnlockedCount();
            achievementsCount.textContent = profile.totalAchievements + metaCount;
        }
        if (totalPlaytime) {
            const hours = Math.floor(stats.totalPlayTime / 3600);
            const minutes = Math.floor((stats.totalPlayTime % 3600) / 60);
            totalPlaytime.textContent = hours > 0 ? `${hours}h` : `${minutes}m`;
        }
        if (streakCount) streakCount.textContent = stats.currentStreak;
    }

    async updateLeaderboardPreview() {
        const container = document.getElementById('leaderboard-preview');
        if (!container) return;

        try {
            const scores = await leaderboardService.getGlobalLeaderboard(3);

            if (scores.length === 0) {
                container.innerHTML = `
                    <div class="leaderboard-empty">
                        <svg class="leaderboard-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="20" x2="18" y2="10"/>
                            <line x1="12" y1="20" x2="12" y2="4"/>
                            <line x1="6" y1="20" x2="6" y2="14"/>
                        </svg>
                        <span>No scores yet. Be the first!</span>
                    </div>`;
                return;
            }

            const rankClasses = ['gold', 'silver', 'bronze'];
            container.innerHTML = scores.map((entry, i) => `
                <div class="leaderboard-item ${entry.isCurrentUser ? 'current-user' : ''}">
                    <span class="leaderboard-rank ${rankClasses[i] || ''}">${entry.rank}</span>
                    <span class="leaderboard-name">${entry.name}</span>
                    <span class="leaderboard-score">${entry.score.toLocaleString()}</span>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load leaderboard preview:', error);
        }
    }

    updateBestGames(stats) {
        const container = document.getElementById('best-games-list');
        if (!container) return;

        const bestGames = [];

        for (const [gameId, gameStats] of Object.entries(stats.gameStats)) {
            if (gameStats.highScore > 0) {
                const game = this.games.find(g => g.id === gameId);
                if (game) {
                    bestGames.push({ ...game, score: gameStats.highScore });
                }
            }
        }

        bestGames.sort((a, b) => b.score - a.score);
        const top3 = bestGames.slice(0, 3);

        if (top3.length === 0) {
            container.innerHTML = '<div class="best-games-empty">Play games to see your best scores!</div>';
            return;
        }

        container.innerHTML = top3.map(game => `
            <div class="best-game-item">
                <span class="best-game-icon">${GAME_ICONS[game.id] || ''}</span>
                <div class="best-game-info">
                    <div class="best-game-name">${game.title}</div>
                    <div class="best-game-score">${game.score.toLocaleString()} pts</div>
                </div>
            </div>
        `).join('');
    }
}

export default DashboardManager;
