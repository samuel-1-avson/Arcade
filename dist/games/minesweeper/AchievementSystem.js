/**
 * Minesweeper Achievement System
 * 35+ achievements, XP/leveling, daily challenges, and progression tracking
 */
import { storageManager } from '../../js/engine/StorageManager.js';
import { eventBus, GameEvents } from '../../js/engine/EventBus.js';
import { ICONS } from './Icons.js';

// Achievement Definitions (35 total)
export const ACHIEVEMENTS = {
    // ===== PROGRESS (10) =====
    first_win: { 
        id: 'first_win', 
        name: 'First Victory', 
        desc: 'Win your first game', 
        icon: '🏆', 
        xp: 20, 
        category: 'progress' 
    },
    win_10: { 
        id: 'win_10', 
        name: 'Getting Started', 
        desc: 'Win 10 games', 
        icon: '🎮', 
        xp: 50, 
        category: 'progress' 
    },
    win_50: { 
        id: 'win_50', 
        name: 'Regular Player', 
        desc: 'Win 50 games', 
        icon: '🎮', 
        xp: 100, 
        category: 'progress' 
    },
    win_100: { 
        id: 'win_100', 
        name: 'Veteran', 
        desc: 'Win 100 games', 
        icon: '🎖️', 
        xp: 200, 
        category: 'progress' 
    },
    win_500: { 
        id: 'win_500', 
        name: 'Minesweeper Master', 
        desc: 'Win 500 games', 
        icon: '👑', 
        xp: 500, 
        category: 'progress' 
    },
    easy_complete: { 
        id: 'easy_complete', 
        name: 'Easy Mode', 
        desc: 'Complete an Easy game', 
        icon: '🌱', 
        xp: 15, 
        category: 'progress' 
    },
    medium_complete: { 
        id: 'medium_complete', 
        name: 'Getting Serious', 
        desc: 'Complete a Medium game', 
        icon: '🌿', 
        xp: 30, 
        category: 'progress' 
    },
    hard_complete: { 
        id: 'hard_complete', 
        name: 'Hardcore', 
        desc: 'Complete a Hard game', 
        icon: '🌲', 
        xp: 75, 
        category: 'progress' 
    },
    all_difficulties: { 
        id: 'all_difficulties', 
        name: 'Versatile', 
        desc: 'Win on all difficulty levels', 
        icon: '🎯', 
        xp: 100, 
        category: 'progress' 
    },
    play_1000_games: { 
        id: 'play_1000_games', 
        name: 'Dedicated', 
        desc: 'Play 1000 games total', 
        icon: '💎', 
        xp: 1000, 
        category: 'progress' 
    },

    // ===== SPEED (7) =====
    speed_easy_30: { 
        id: 'speed_easy_30', 
        name: 'Lightning Beginner', 
        desc: 'Win Easy in under 30 seconds', 
        icon: '⚡', 
        xp: 50, 
        category: 'speed' 
    },
    speed_easy_15: { 
        id: 'speed_easy_15', 
        name: 'Instant Win', 
        desc: 'Win Easy in under 15 seconds', 
        icon: '💨', 
        xp: 150, 
        category: 'speed' 
    },
    speed_medium_60: { 
        id: 'speed_medium_60', 
        name: 'Quick Thinker', 
        desc: 'Win Medium in under 60 seconds', 
        icon: '🚀', 
        xp: 100, 
        category: 'speed' 
    },
    speed_medium_45: { 
        id: 'speed_medium_45', 
        name: 'Speed Demon', 
        desc: 'Win Medium in under 45 seconds', 
        icon: '🔥', 
        xp: 200, 
        category: 'speed' 
    },
    speed_hard_180: { 
        id: 'speed_hard_180', 
        name: 'Expert Pace', 
        desc: 'Win Hard in under 3 minutes', 
        icon: '⏱️', 
        xp: 150, 
        category: 'speed' 
    },
    speed_hard_120: { 
        id: 'speed_hard_120', 
        name: 'Speedrunner', 
        desc: 'Win Hard in under 2 minutes', 
        icon: '🏎️', 
        xp: 300, 
        category: 'speed' 
    },
    speed_hard_90: { 
        id: 'speed_hard_90', 
        name: 'Inhuman Reflexes', 
        desc: 'Win Hard in under 90 seconds', 
        icon: '👽', 
        xp: 500, 
        category: 'speed' 
    },

    // ===== STRATEGY (8) =====
    no_flags_win: { 
        id: 'no_flags_win', 
        name: 'Flag Free', 
        desc: 'Win without using any flags', 
        icon: '🎌', 
        xp: 75, 
        category: 'strategy' 
    },
    perfect_flags: { 
        id: 'perfect_flags', 
        name: 'Perfect Flagger', 
        desc: 'Win with only correct flags (no misplaced)', 
        icon: '🎯', 
        xp: 50, 
        category: 'strategy' 
    },
    chord_master: { 
        id: 'chord_master', 
        name: 'Chord Master', 
        desc: 'Use chord reveal 50 times', 
        icon: '🎹', 
        xp: 60, 
        category: 'strategy' 
    },
    chain_20: { 
        id: 'chain_20', 
        name: 'Chain Reaction', 
        desc: 'Reveal 20+ cells in one click', 
        icon: '💥', 
        xp: 40, 
        category: 'strategy' 
    },
    chain_40: { 
        id: 'chain_40', 
        name: 'Cascade Master', 
        desc: 'Reveal 40+ cells in one click', 
        icon: '🌊', 
        xp: 100, 
        category: 'strategy' 
    },
    efficiency_50: { 
        id: 'efficiency_50', 
        name: 'Efficient Solver', 
        desc: 'Win revealing only 50% of safe cells directly', 
        icon: '📊', 
        xp: 75, 
        category: 'strategy' 
    },
    first_click_lucky: { 
        id: 'first_click_lucky', 
        name: 'Lucky Start', 
        desc: 'First click reveals 15+ cells', 
        icon: '🍀', 
        xp: 30, 
        category: 'strategy' 
    },
    corner_start: { 
        id: 'corner_start', 
        name: 'Corner Strategy', 
        desc: 'Win 10 games starting from a corner', 
        icon: '📐', 
        xp: 50, 
        category: 'strategy' 
    },

    // ===== SECRET (10) =====
    midnight_sweep: { 
        id: 'midnight_sweep', 
        name: 'Night Owl', 
        desc: 'Win a game between midnight and 4 AM', 
        icon: '🦉', 
        xp: 40, 
        category: 'secret' 
    },
    lucky_777: { 
        id: 'lucky_777', 
        name: 'Lucky 7s', 
        desc: 'Win in exactly 77 seconds', 
        icon: '7️⃣', 
        xp: 77, 
        category: 'secret' 
    },
    close_call: { 
        id: 'close_call', 
        name: 'Close Call', 
        desc: 'Win with only 1 cell remaining unrevealed', 
        icon: '😰', 
        xp: 60, 
        category: 'secret' 
    },
    daily_warrior: { 
        id: 'daily_warrior', 
        name: 'Daily Warrior', 
        desc: 'Complete 7 daily challenges in a row', 
        icon: '📅', 
        xp: 200, 
        category: 'secret' 
    },
    puzzle_master: { 
        id: 'puzzle_master', 
        name: 'Puzzle Master', 
        desc: 'Complete all puzzle levels', 
        icon: '🧩', 
        xp: 300, 
        category: 'secret' 
    },
    world_traveler: { 
        id: 'world_traveler', 
        name: 'World Traveler', 
        desc: 'Complete all story worlds', 
        icon: '🗺️', 
        xp: 500, 
        category: 'secret' 
    },
    zen_master: { 
        id: 'zen_master', 
        name: 'Zen Master', 
        desc: 'Play Zen mode for 1 hour total', 
        icon: '🧘', 
        xp: 100, 
        category: 'secret' 
    },
    time_attack_1000: { 
        id: 'time_attack_1000', 
        name: 'Time Champion', 
        desc: 'Score 1000+ points in Time Attack', 
        icon: '🏅', 
        xp: 150, 
        category: 'secret' 
    },
    streak_10: { 
        id: 'streak_10', 
        name: 'Hot Streak', 
        desc: 'Win 10 games in a row', 
        icon: '🔥', 
        xp: 200, 
        category: 'secret' 
    },
    completionist: { 
        id: 'completionist', 
        name: 'Completionist', 
        desc: 'Unlock all other achievements', 
        icon: '🏆', 
        xp: 1000, 
        category: 'secret' 
    }
};

// Achievement categories for UI display
export const ACHIEVEMENT_CATEGORIES = {
    progress: { name: 'Progress', icon: ICONS.STATS, color: '#00ff88' },
    speed: { name: 'Speed', icon: ICONS.POWER_TIME, color: '#ffcc00' },
    strategy: { name: 'Strategy', icon: ICONS.MODE_PUZZLE, color: '#00ccff' },
    secret: { name: 'Secret', icon: ICONS.QUESTION, color: '#ff00ff' }
};

// Leveling system thresholds
export const LEVEL_THRESHOLDS = [
    0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000,      // 1-10
    5200, 6600, 8200, 10000, 12000, 14500, 17500, 21000, 25000, 30000,  // 11-20
    36000, 43000, 51000, 60000, 70000, 82000, 96000, 112000, 130000, 150000  // 21-30
];

/**
 * Achievement System Class
 */
export class AchievementSystem {
    constructor(game) {
        this.game = game;
        this.unlockedAchievements = this.loadUnlocked();
        this.progress = this.loadProgress();
        this.xp = 0;
        this.level = 1;
        this.loadPlayerData();
        
        // Statistics for achievement tracking
        this.stats = {
            totalWins: 0,
            totalGames: 0,
            currentStreak: 0,
            bestStreak: 0,
            easyWins: 0,
            mediumWins: 0,
            hardWins: 0,
            totalChords: 0,
            flagsPlaced: 0,
            cellsRevealed: 0,
            cornerStarts: 0,
            dailyChallengesCompleted: 0,
            dailyStreak: 0,
            zenTimeSeconds: 0,
            timeAttackBestScore: 0,
            ...this.loadStats()
        };
    }

    /**
     * Load unlocked achievements from storage
     */
    loadUnlocked() {
        try {
            const saved = localStorage.getItem('minesweeper_achievements');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }

    /**
     * Save unlocked achievements to storage
     */
    saveUnlocked() {
        localStorage.setItem('minesweeper_achievements', JSON.stringify(this.unlockedAchievements));
    }

    /**
     * Load achievement progress from storage
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem('minesweeper_achievement_progress');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    }

    /**
     * Save achievement progress to storage
     */
    saveProgress() {
        localStorage.setItem('minesweeper_achievement_progress', JSON.stringify(this.progress));
    }

    /**
     * Load player data (XP, level) from storage
     */
    loadPlayerData() {
        try {
            const saved = localStorage.getItem('minesweeper_player_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.xp = data.xp || 0;
                this.level = data.level || 1;
            }
        } catch {
            this.xp = 0;
            this.level = 1;
        }
    }

    /**
     * Save player data to storage
     */
    savePlayerData() {
        localStorage.setItem('minesweeper_player_data', JSON.stringify({
            xp: this.xp,
            level: this.level
        }));
    }

    /**
     * Load stats from storage
     */
    loadStats() {
        try {
            const saved = localStorage.getItem('minesweeper_stats');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    }

    /**
     * Save stats to storage
     */
    saveStats() {
        localStorage.setItem('minesweeper_stats', JSON.stringify(this.stats));
    }

    /**
     * Check if an achievement is unlocked
     */
    isUnlocked(achievementId) {
        return this.unlockedAchievements.includes(achievementId);
    }

    /**
     * Try to unlock an achievement
     */
    tryUnlock(achievementId) {
        if (this.isUnlocked(achievementId)) return false;
        
        const achievement = ACHIEVEMENTS[achievementId];
        if (!achievement) return false;

        this.unlockedAchievements.push(achievementId);
        this.saveUnlocked();
        
        // Award XP
        this.addXP(achievement.xp);
        
        // Show popup
        this.showAchievementPopup(achievement);
        
        // Emit event
        if (eventBus) {
            eventBus.emit(GameEvents.ACHIEVEMENT_UNLOCKED, { achievement });
        }

        // Check for completionist
        this.checkCompletionist();

        return true;
    }

    /**
     * Add XP and check for level up
     */
    addXP(amount) {
        this.xp += amount;
        
        // Check for level up
        while (this.level < LEVEL_THRESHOLDS.length && this.xp >= LEVEL_THRESHOLDS[this.level]) {
            this.level++;
            this.showLevelUpPopup();
        }
        
        this.savePlayerData();
        
        // Also sync with global storage
        storageManager?.addXP(amount);
    }

    /**
     * Get XP progress to next level
     */
    getLevelProgress() {
        const currentThreshold = LEVEL_THRESHOLDS[this.level - 1] || 0;
        const nextThreshold = LEVEL_THRESHOLDS[this.level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
        const progress = this.xp - currentThreshold;
        const needed = nextThreshold - currentThreshold;
        return { progress, needed, percent: (progress / needed) * 100 };
    }

    /**
     * Update a stat and check related achievements
     */
    updateStat(statName, value, increment = true) {
        if (increment) {
            this.stats[statName] = (this.stats[statName] || 0) + value;
        } else {
            this.stats[statName] = value;
        }
        this.saveStats();
        this.checkStatAchievements(statName);
    }

    /**
     * Check achievements based on stat updates
     */
    checkStatAchievements(statName) {
        const stats = this.stats;

        switch (statName) {
            case 'totalWins':
                if (stats.totalWins >= 1) this.tryUnlock('first_win');
                if (stats.totalWins >= 10) this.tryUnlock('win_10');
                if (stats.totalWins >= 50) this.tryUnlock('win_50');
                if (stats.totalWins >= 100) this.tryUnlock('win_100');
                if (stats.totalWins >= 500) this.tryUnlock('win_500');
                break;

            case 'totalGames':
                if (stats.totalGames >= 1000) this.tryUnlock('play_1000_games');
                break;

            case 'currentStreak':
                if (stats.currentStreak >= 10) this.tryUnlock('streak_10');
                break;

            case 'easyWins':
                if (stats.easyWins >= 1) this.tryUnlock('easy_complete');
                this.checkAllDifficulties();
                break;

            case 'mediumWins':
                if (stats.mediumWins >= 1) this.tryUnlock('medium_complete');
                this.checkAllDifficulties();
                break;

            case 'hardWins':
                if (stats.hardWins >= 1) this.tryUnlock('hard_complete');
                this.checkAllDifficulties();
                break;

            case 'totalChords':
                if (stats.totalChords >= 50) this.tryUnlock('chord_master');
                break;

            case 'cornerStarts':
                if (stats.cornerStarts >= 10) this.tryUnlock('corner_start');
                break;

            case 'dailyChallengesCompleted':
                if (stats.dailyStreak >= 7) this.tryUnlock('daily_warrior');
                break;

            case 'zenTimeSeconds':
                if (stats.zenTimeSeconds >= 3600) this.tryUnlock('zen_master');
                break;

            case 'timeAttackBestScore':
                if (stats.timeAttackBestScore >= 1000) this.tryUnlock('time_attack_1000');
                break;
        }
    }

    /**
     * Check if all difficulty achievements are unlocked
     */
    checkAllDifficulties() {
        if (this.stats.easyWins > 0 && 
            this.stats.mediumWins > 0 && 
            this.stats.hardWins > 0) {
            this.tryUnlock('all_difficulties');
        }
    }

    /**
     * Check completionist achievement
     */
    checkCompletionist() {
        const totalAchievements = Object.keys(ACHIEVEMENTS).length;
        const unlockedCount = this.unlockedAchievements.length;
        
        // -1 because completionist itself shouldn't count
        if (unlockedCount >= totalAchievements - 1) {
            this.tryUnlock('completionist');
        }
    }

    /**
     * Check speed-based achievements after a win
     */
    checkSpeedAchievements(difficulty, timeSeconds) {
        switch (difficulty) {
            case 'easy':
                if (timeSeconds < 30) this.tryUnlock('speed_easy_30');
                if (timeSeconds < 15) this.tryUnlock('speed_easy_15');
                break;
            case 'medium':
                if (timeSeconds < 60) this.tryUnlock('speed_medium_60');
                if (timeSeconds < 45) this.tryUnlock('speed_medium_45');
                break;
            case 'hard':
                if (timeSeconds < 180) this.tryUnlock('speed_hard_180');
                if (timeSeconds < 120) this.tryUnlock('speed_hard_120');
                if (timeSeconds < 90) this.tryUnlock('speed_hard_90');
                break;
        }

        // Check for lucky 777
        if (timeSeconds === 77) {
            this.tryUnlock('lucky_777');
        }
    }

    /**
     * Check midnight achievement
     */
    checkTimeBasedAchievements() {
        const hour = new Date().getHours();
        if (hour >= 0 && hour < 4) {
            this.tryUnlock('midnight_sweep');
        }
    }

    /**
     * Check chain reveal achievement
     */
    checkChainReveal(cellCount) {
        if (cellCount >= 20) this.tryUnlock('chain_20');
        if (cellCount >= 40) this.tryUnlock('chain_40');
        if (this.game.revealed === 0 && cellCount >= 15) {
            // First click revealed 15+ cells
            this.tryUnlock('first_click_lucky');
        }
    }

    /**
     * Check close call achievement
     */
    checkCloseCall(totalCells, mineCount, revealedCells) {
        const safeCells = totalCells - mineCount;
        const remaining = safeCells - revealedCells;
        if (remaining === 1) {
            this.tryUnlock('close_call');
        }
    }

    /**
     * Check no flags win
     */
    checkNoFlagsWin(flagsUsed) {
        if (flagsUsed === 0) {
            this.tryUnlock('no_flags_win');
        }
    }

    /**
     * Check perfect flags (no wrong flags)
     */
    checkPerfectFlags(wrongFlags) {
        if (wrongFlags === 0) {
            this.tryUnlock('perfect_flags');
        }
    }

    /**
     * Show achievement unlock popup
     */
    showAchievementPopup(achievement) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-title">Achievement Unlocked!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-xp">+${achievement.xp} XP</div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Animate in
        requestAnimationFrame(() => {
            popup.classList.add('show');
        });
        
        // Remove after delay
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 500);
        }, 3000);
    }

    /**
     * Show level up popup
     */
    showLevelUpPopup() {
        const popup = document.createElement('div');
        popup.className = 'level-up-popup';
        popup.innerHTML = `
            <div class="level-up-icon">${ICONS.TROPHY}</div>
            <div class="level-up-text">Level Up!</div>
            <div class="level-up-number">Level ${this.level}</div>
        `;
        
        document.body.appendChild(popup);
        
        requestAnimationFrame(() => {
            popup.classList.add('show');
        });
        
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 500);
        }, 2500);
    }

    /**
     * Get all achievements organized by category
     */
    getAchievementsByCategory() {
        const categories = {};
        
        for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
            const category = achievement.category;
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push({
                ...achievement,
                unlocked: this.isUnlocked(id)
            });
        }
        
        return categories;
    }

    /**
     * Get achievement unlock percentage
     */
    getUnlockPercentage() {
        const total = Object.keys(ACHIEVEMENTS).length;
        const unlocked = this.unlockedAchievements.length;
        return Math.round((unlocked / total) * 100);
    }

    /**
     * Open achievement gallery modal
     */
    openGallery() {
        const modal = document.createElement('div');
        modal.className = 'achievement-gallery-modal';
        
        const categories = this.getAchievementsByCategory();
        
        let html = `
            <div class="achievement-gallery">
                <div class="gallery-header">
                    <h2>🏆 Achievements</h2>
                    <div class="gallery-progress">
                        ${this.unlockedAchievements.length}/${Object.keys(ACHIEVEMENTS).length} Unlocked
                        (${this.getUnlockPercentage()}%)
                    </div>
                    <button class="gallery-close">&times;</button>
                </div>
                <div class="gallery-content">
        `;
        
        for (const [categoryId, achievements] of Object.entries(categories)) {
            const categoryInfo = ACHIEVEMENT_CATEGORIES[categoryId];
            html += `
                <div class="achievement-category">
                    <h3 style="color: ${categoryInfo.color}">
                        ${categoryInfo.icon} ${categoryInfo.name}
                    </h3>
                    <div class="achievement-grid">
            `;
            
            for (const achievement of achievements) {
                const lockedClass = achievement.unlocked ? '' : 'locked';
                html += `
                    <div class="achievement-card ${lockedClass}" title="${achievement.desc}">
                        <div class="achievement-card-icon">${achievement.unlocked ? (achievement.icon.startsWith('<svg') ? achievement.icon : ICONS.TROPHY) : ICONS.LOCK}</div>
                        <div class="achievement-card-name">${achievement.name}</div>
                        <div class="achievement-card-xp">+${achievement.xp} XP</div>
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
        
        modal.innerHTML = html;
        document.body.appendChild(modal);
        
        // Close button
        modal.querySelector('.gallery-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        // Animate in
        requestAnimationFrame(() => modal.classList.add('show'));
    }
}

export default AchievementSystem;
