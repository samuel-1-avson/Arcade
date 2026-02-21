/**
 * UI Controls Initialization
 * Adds all UI elements to access enhanced features
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', initializeUI);

    function initializeUI() {
        createLevelDisplay();
        createMenuBar();
        createMuteButton();
        createPowerUpsBar();
        
        console.log('✅ 2048 Enhanced UI initialized');
    }

    /**
     * Create level/XP display
     */
    function createLevelDisplay() {
        const container = document.querySelector('.above-game');
        if (!container) return;

        const levelDisplay = document.createElement('div');
        levelDisplay.id = 'level-display';
        levelDisplay.className = 'level-display';
        
        container.insertBefore(levelDisplay, container.firstChild);
        
        // Update initial display
        if (window.levelSystem) {
            levelSystem.updateLevelDisplay();
        }
    }

    /**
     * Create menu bar with feature buttons
     */
    function createMenuBar() {
        const container = document.querySelector('.container');
        if (!container) return;

        const menuBar = document.createElement('div');
        menuBar.className = 'feature-menu-bar';
        menuBar.innerHTML = `
            <button class="feature-btn" onclick="achievementsManager.showGallery()" title="Achievements">
                <span class="btn-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg></span>
                <span class="btn-label">Achievements</span>
            </button>
            <button class="feature-btn" onclick="statisticsManager.showDashboard()" title="Statistics">
                <span class="btn-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg></span>
                <span class="btn-label">Stats</span>
            </button>
            <button class="feature-btn" onclick="dailyChallengeManager.showChallengeModal()" title="Daily Challenge">
                <span class="btn-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg></span>
                <span class="btn-label">Daily</span>
            </button>
            <button class="feature-btn" onclick="leaderboardManager.showLeaderboard()" title="Leaderboard">
                <span class="btn-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41C17.92 5.77 20 8.65 20 12c0 2.08-.81 3.98-2.11 5.39z"/></svg></span>
                <span class="btn-label">Leaderboard</span>
            </button>
            <button class="feature-btn" onclick="gameModesManager.showModeSelector()" title="Game Modes">
                <span class="btn-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg></span>
                <span class="btn-label">Modes</span>
            </button>
            <button class="feature-btn" onclick="shareManager.showShareModal()" title="Share">
                <span class="btn-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg></span>
                <span class="btn-label">Share</span>
            </button>
        `;

        container.insertBefore(menuBar, container.firstChild);
    }

    /**
     * Create mute button
     */
    function createMuteButton() {
        const muteBtn = document.createElement('button');
        muteBtn.id = 'mute-btn';
        muteBtn.textContent = '🔊';
        muteBtn.title = 'Mute (M)';
        muteBtn.onclick = function() {
            if (window.audioManager) {
                const enabled = audioManager.toggle();
                this.textContent = enabled ? '🔊' : '🔇';
                this.title = enabled ? 'Mute (M)' : 'Unmute (M)';
            }
        };

        document.body.appendChild(muteBtn);
    }

    /**
     * Create power-ups bar
     */
    function createPowerUpsBar() {
        const aboveGame = document.querySelector('.above-game');
        if (!aboveGame || !window.powerUpsManager) return;

        const powerUpBar = powerUpsManager.createPowerUpBar();
        aboveGame.appendChild(powerUpBar);
    }

    /**
     * Demo functions for testing (remove in production)
     */
    window.demo2048Features = {
        showAchievements: () => achievementsManager.showGallery(),
        showStats: () => statisticsManager.showDashboard(),
        showChallenge: () => dailyChallengeManager.showChallengeModal(),
        showLeaderboard: () => leaderboardManager.showLeaderboard(),
        showModes: () => gameModesManager.showModeSelector(),
        showShare: () => shareManager.showShareModal(),
        testParticles: () => {
            if (window.particleEffects) {
                particleEffects.create2048Celebration();
            }
        },
        grantXP: (amount) => {
            if (window.levelSystem) {
                levelSystem.addXP(amount || 100);
            }
        },
        unlockAchievement: (id) => {
            if (window.achievementsManager) {
                achievementsManager.unlock(id || 'first128');
            }
        },
        submitScore: (score, tile) => {
            if (window.leaderboardManager) {
                leaderboardManager.submitScore(score || 1000, tile || 128);
            }
        }
    };

    console.log('💡 Demo functions available: window.demo2048Features');
})();
