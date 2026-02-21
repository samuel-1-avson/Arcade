/**
 * Level and XP System for 2048
 * Progression system with unlockable rewards
 */

class LevelSystem {
    constructor() {
        this.currentLevel = 1;
        this.currentXP = 0;
        this.totalXP = 0;
        this.maxLevel = 20;
        
        this.loadProgress();
    }

    loadProgress() {
        const saved = localStorage.getItem('2048-level-progress');
        if (saved) {
            const data = JSON.parse(saved);
            this.currentLevel = data.currentLevel || 1;
            this.currentXP = data.currentXP || 0;
            this.totalXP = data.totalXP || 0;
        }
    }

    saveProgress() {
        const data = {
            currentLevel: this.currentLevel,
            currentXP: this.currentXP,
            totalXP: this.totalXP
        };
        localStorage.setItem('2048-level-progress', JSON.stringify(data));
    }

    /**
     * Calculate XP required for a specific level
     * Exponential growth: Level 1=100, Level 2=250, Level 3=450...
     */
    getXPForLevel(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    /**
     * Get XP needed for next level
     */
    getXPForNextLevel() {
        return this.getXPForLevel(this.currentLevel + 1);
    }

    /**
     * Add XP and check for level up
     */
    addXP(amount) {
        this.currentXP += amount;
        this.totalXP += amount;
        
        const xpNeeded = this.getXPForNextLevel();
        
        if (this.currentXP >= xpNeeded && this.currentLevel < this.maxLevel) {
            this.levelUp();
        }
        
        this.saveProgress();
        this.updateLevelDisplay();
    }

    /**
     * Level up with celebration
     */
    levelUp() {
        this.currentLevel++;
        this.currentXP -= this.getXPForLevel(this.currentLevel);
        
        this.showLevelUpNotification();
        this.grantLevelRewards();
        
        if (window.audioManager) {
            window.audioManager.playVictorySound();
        }
    }

    /**
     * Grant rewards for leveling up
     */
    grantLevelRewards() {
        const rewards = this.getRewardsForLevel(this.currentLevel);
        
        // Grant rewards (these would integrate with other systems)
        if (rewards.powerUps && window.powerUpsManager) {
            // Restore one power-up use for each
            Object.keys(window.powerUpsManager.powerUps).forEach(id => {
                if (window.powerUpsManager.powerUps[id].currentUses < 
                    window.powerUpsManager.powerUps[id].maxUses) {
                    window.powerUpsManager.powerUps[id].currentUses++;
                }
            });
        }
        
        if (rewards.theme && window.themeManager) {
            // Unlock special theme (future feature)
            console.log('Unlocked theme:', rewards.theme);
        }
    }

    /**
     * Define rewards for each level
     */
    getRewardsForLevel(level) {
        const rewards = {
            2: { powerUps: 1, description: '1 Power-Up restored' },
            3: { powerUps: 1, description: '1 Power-Up restored' },
            5: { powerUps: 2, description: '2 Power-Ups restored' },
            7: { theme: 'special1', description: 'Unlocked special theme' },
            10: { powerUps: 3, description: '3 Power-Ups restored' },
            12: { theme: 'special2', description: 'Unlocked special theme' },
            15: { powerUps: 5, description: 'All Power-Ups restored!' },
            18: { theme: 'special3', description: 'Unlocked special theme' },
            20: { maxLevel: true, description: 'Max level reached! 🎉' }
        };
        
        return rewards[level] || { powerUps: 1, description: '1 Power-Up restored' };
    }

    /**
     * Show level up notification
     */
    showLevelUpNotification() {
        const rewards = this.getRewardsForLevel(this.currentLevel);
        
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div class="level-up-icon" style="font-size:36px; animation: bounce 1s infinite;">⭐</div>
            <div class="level-up-content">
                <div class="level-up-title" style="font-weight:bold; color:#edc22e; text-transform:uppercase;">Level Up!</div>
                <div class="level-up-level" style="font-size:24px; font-weight:bold;">Level ${this.currentLevel}</div>
                <div class="level-up-reward" style="background:#8f7a66; color:white; padding:2px 10px; border-radius:12px; display:inline-block; margin-top:5px; font-size:14px;">${rewards.description}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add minimal confetti if possible (future enhancement)
        
        requestAnimationFrame(() => notification.classList.add('show'));
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }

    /**
     * Update level display in UI
     */
    updateLevelDisplay() {
        const levelDisplay = document.getElementById('level-display');
        if (levelDisplay) {
            const progress = (this.currentXP / this.getXPForNextLevel()) * 100;
            levelDisplay.innerHTML = `
                <div class="level-info">
                    <span class="level-number">Lv ${this.currentLevel}</span>
                    <span class="level-xp">${this.currentXP}/${this.getXPForNextLevel()} XP</span>
                </div>
                <div class="level-progress-bar">
                    <div class="level-progress-fill" style="width: ${progress}%"></div>
                </div>
            `;
        }
    }

    /**
     * Convert score to XP (score / 100 = XP)
     */
    scoreToXP(score) {
        return Math.floor(score / 100);
    }

    /**
     * Get current level info
     */
    getLevelInfo() {
        return {
            level: this.currentLevel,
            currentXP: this.currentXP,
            xpForNext: this.getXPForNextLevel(),
            totalXP: this.totalXP,
            progress: (this.currentXP / this.getXPForNextLevel()) * 100
        };
    }

    /**
     * Reset progress
     */
    reset() {
        if (confirm('Reset all level progress? This cannot be undone.')) {
            this.currentLevel = 1;
            this.currentXP = 0;
            this.totalXP = 0;
            this.saveProgress();
            this.updateLevelDisplay();
        }
    }
}

// Initialize level system
const levelSystem = new LevelSystem();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LevelSystem;
}
