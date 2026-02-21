/**
 * Achievements System for 2048
 * Tracks player progress with 20+ achievements
 */

class AchievementsManager {
    constructor() {
        this.achievements = {
            // Tile Milestones - target icon
            first128: { name: 'First 128', description: 'Reach the 128 tile', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6" fill="black"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>', unlocked: false },
            first256: { name: 'First 256', description: 'Reach the 256 tile', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>', unlocked: false },
            first512: { name: 'First 512', description: 'Reach the 512 tile', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>', unlocked: false },
            first1024: { name: 'First 1024', description: 'Reach the 1024 tile', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 7.5L9 2H15L12 7.5M7.06 8.62L3 5.75L6.15 11.23L7.06 8.62M16.94 8.62L21 5.75L17.85 11.23L16.94 8.62M6.15 12.77L3 18.25L7.06 15.38L6.15 12.77M17.85 12.77L21 18.25L16.94 15.38L17.85 12.77M12 13.5L15 19H9L12 13.5Z"/></svg>', unlocked: false },
            first2048: { name: 'Winner!', description: 'Reach the 2048 tile', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 12h-2v-3h-4v3H8v-5h2v3h2v-3h2v5zm4-6H5V5h14v4z"/></svg>', unlocked: false },
            first4096: { name: 'Overachiever', description: 'Reach the 4096 tile', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM6.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>', unlocked: false },

            // Score Achievements
            score5k: { name: '5K Club', description: 'Score 5,000 points', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V5h14v14z"/><path d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"/></svg>', unlocked: false },
            score10k: { name: 'Ten Grand', description: 'Score 10,000 points', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 3.5L18.5 20H5.5L12 5.5z"/></svg>', unlocked: false },
            score25k: { name: 'Legend', description: 'Score 25,000 points', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/></svg>', unlocked: false },

            // Skill Achievements
            speedDemon: { name: 'Speed Demon', description: 'Reach 512 in under 2 minutes', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/></svg>', unlocked: false },
            efficient: { name: 'Efficient', description: 'Win with under 500 moves', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>', unlocked: false },
            comboMaster: { name: 'Combo Master', description: '5+ merges in one move', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17.66 7.93L12 2.27 6.34 7.93c-3.12 3.12-3.12 8.19 0 11.31C7.9 20.8 9.95 21.58 12 21.58c2.05 0 4.1-.78 5.66-2.34 3.12-3.12 3.12-8.19 0-11.31zM12 19.59c-1.6 0-3.11-.62-4.24-1.76C6.62 16.69 6 15.19 6 13.59s.62-3.11 1.76-4.24L12 5.1l4.24 4.24c2.34 2.34 2.34 6.14 0 8.49-1.13 1.13-2.64 1.76-4.24 1.76z"/></svg>', unlocked: false },

            // Play Achievements
            games10: { name: 'Getting Started', description: 'Play 10 games', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>', unlocked: false },
            games50: { name: 'Dedicated', description: 'Play 50 games', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>', unlocked: false },
            games100: { name: 'Century', description: 'Play 100 games', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>', unlocked: false },

            // Mode Achievements
            zenMaster: { name: 'Zen Master', description: 'Play 10 Zen mode games', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><circle cx="12" cy="12" r="5"/><path d="M12 2C6.48 2 2 6.48 2 12s4.47 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>', unlocked: false },
            timeWarrior: { name: 'Time Warrior', description: 'Win Time Attack mode', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>', unlocked: false },
            gridMaster: { name: 'Grid Master', description: 'Win on 5×5 grid', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM11 7h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2zm-4-4h2v2H7zm0-4h2v2H7zm0 8h2v2H7zm8 0h2v2h-2zm0-4h2v2h-2zm0-4h2v2h-2z"/></svg>', unlocked: false },

            // Special Achievements
            undoless: { name: 'No Regrets', description: 'Win without using undo', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>', unlocked: false },
            perfect: { name: 'Perfect Game', description: 'Win with no tiles above 2048', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.45l8.2 14.16H3.8L12 5.45zM11 10h2v4h-2zm0 5h2v2h-2z"/></svg>', unlocked: false },
            powerless: { name: 'Raw Skill', description: 'Win without power-ups', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>', unlocked: false }
        };

        this.loadAchievements();
    }

    loadAchievements() {
        const saved = localStorage.getItem('2048-achievements');
        if (saved) {
            const unlocked = JSON.parse(saved);
            Object.keys(unlocked).forEach(key => {
                if (this.achievements[key]) {
                    this.achievements[key].unlocked = unlocked[key];
                }
            });
        }
    }

    saveAchievements() {
        const unlocked = {};
        Object.entries(this.achievements).forEach(([key, ach]) => {
            unlocked[key] = ach.unlocked;
        });
        localStorage.setItem('2048-achievements', JSON.stringify(unlocked));
    }

    checkAchievements(gameState) {
        const checks = {
            first128: () => gameState.highestTile >= 128,
            first256: () => gameState.highestTile >= 256,
            first512: () => gameState.highestTile >= 512,
            first1024: () => gameState.highestTile >= 1024,
            first2048: () => gameState.highestTile >= 2048,
            first4096: () => gameState.highestTile >= 4096,
            score5k: () => gameState.score >= 5000,
            score10k: () => gameState.score >= 10000,
            score25k: () => gameState.score >= 25000,
            speedDemon: () => gameState.highestTile >= 512 && gameState.timeElapsed < 120,
            efficient: () => gameState.won && gameState.moves < 500,
            comboMaster: () => gameState.maxCombo >= 5,
            games10: () => gameState.totalGames >= 10,
            games50: () => gameState.totalGames >= 50,
            games100: () => gameState.totalGames >= 100
        };

        Object.entries(checks).forEach(([id, condition]) => {
            if (!this.achievements[id].unlocked && condition()) {
                this.unlock(id);
            }
        });
    }

    unlock(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement || achievement.unlocked) return;

        achievement.unlocked = true;
        this.saveAchievements();
        this.showUnlockNotification(achievement);

        if (window.audioManager) {
            window.audioManager.playVictorySound();
        }
    }

    showUnlockNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-toast';
        notification.innerHTML = `
            <div class="achievement-icon" style="font-size: 32px;">${achievement.icon}</div>
            <div class="achievement-info">
                <div style="font-size: 12px; text-transform: uppercase; color: #8f7a66;">Achievement Unlocked!</div>
                <div class="achievement-name" style="font-weight: bold; font-size: 16px;">${achievement.name}</div>
                <div class="achievement-desc" style="font-size: 14px;">${achievement.description}</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animation timing
        requestAnimationFrame(() => notification.classList.add('show'));
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }

    showGallery() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        const achievementsHTML = Object.entries(this.achievements).map(([id, ach]) => `
            <div class="achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${ach.unlocked ? ach.icon : '<svg viewBox="0 0 24 24" width="32" height="32" fill="#888"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>'}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${ach.name}</div>
                    <div class="achievement-desc">${ach.description}</div>
                </div>
            </div>
        `).join('');

        const unlockedCount = Object.values(this.achievements).filter(a => a.unlocked).length;
        const totalCount = Object.keys(this.achievements).length;
        const percent = Math.round((unlockedCount / totalCount) * 100);

        modal.innerHTML = `
            <div class="modal-content achievements-modal">
                <button class="modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2><svg viewBox="0 0 24 24" width="24" height="24" fill="#ff4d00" style="vertical-align: text-bottom; margin-right: 10px;"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1l0 0c0 2.61 1.67 4.83 4 5.65V15c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-1.35c2.33-.82 4-3.04 4-5.65v-1c0-1.1-.9-2-2-2zM5 8v-1h2v1c0 2.4-1.72 4.39-4 4.88C3.17 11.23 3 9.66 3 8zm14 0c0 1.66-.17 3.23-.88 4.88-2.28-.49-4-2.48-4-4.88v-1h2v1z"/></svg> Achievements</h2>
                
                <div class="achievements-progress">
                    <div style="flex: 1;">
                        <span style="font-weight: bold; font-size: 18px;">${unlockedCount} / ${totalCount}</span>
                        <span style="color: #999; margin-left: 5px;">(${percent}% Complete)</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-fill" style="width: ${percent}%"></div>
                    </div>
                </div>

                <div class="achievements-grid">
                    ${achievementsHTML}
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn-primary" onclick="this.parentElement.parentElement.remove()">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    getUnlockedCount() {
        return Object.values(this.achievements).filter(a => a.unlocked).length;
    }

    getTotalCount() {
        return Object.keys(this.achievements).length;
    }
}

// Initialize achievements manager
const achievementsManager = new AchievementsManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchievementsManager;
}
