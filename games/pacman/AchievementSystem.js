/**
 * Pac-Man Achievement System
 * 25 achievements across multiple categories
 */

export const ACHIEVEMENTS = {
    // Progression Achievements
    FIRST_DOT: {
        id: 'first_dot',
        name: 'First Bite',
        description: 'Eat your first dot',
        icon: '🔵',
        category: 'progression',
        points: 10,
        secret: false,
        check: (stats) => stats.dotsEaten >= 1
    },
    LEVEL_COMPLETE: {
        id: 'level_complete',
        name: 'Level Up!',
        description: 'Complete your first level',
        icon: '✅',
        category: 'progression',
        points: 25,
        secret: false,
        check: (stats) => stats.levelsCompleted >= 1
    },
    LEVEL_5: {
        id: 'level_5',
        name: 'Getting Started',
        description: 'Complete 5 levels',
        icon: '🎯',
        category: 'progression',
        points: 50,
        secret: false,
        check: (stats) => stats.levelsCompleted >= 5
    },
    LEVEL_10: {
        id: 'level_10',
        name: 'Veteran Player',
        description: 'Complete 10 levels',
        icon: '🏅',
        category: 'progression',
        points: 100,
        secret: false,
        check: (stats) => stats.levelsCompleted >= 10
    },
    STORY_CHAMPION: {
        id: 'story_champion',
        name: 'Story Champion',
        description: 'Complete all story chapters',
        icon: '👑',
        category: 'progression',
        points: 500,
        secret: false,
        check: (stats) => stats.storyChaptersCompleted >= 5
    },

    // Score Achievements
    SCORE_1K: {
        id: 'score_1k',
        name: 'Penny Pincher',
        description: 'Score 1,000 points',
        icon: '💵',
        category: 'score',
        points: 15,
        secret: false,
        check: (stats) => stats.highScore >= 1000
    },
    SCORE_10K: {
        id: 'score_10k',
        name: 'Point Master',
        description: 'Score 10,000 points',
        icon: '💰',
        category: 'score',
        points: 50,
        secret: false,
        check: (stats) => stats.highScore >= 10000
    },
    SCORE_50K: {
        id: 'score_50k',
        name: 'Score Legend',
        description: 'Score 50,000 points',
        icon: '💎',
        category: 'score',
        points: 150,
        secret: false,
        check: (stats) => stats.highScore >= 50000
    },
    SCORE_100K: {
        id: 'score_100k',
        name: 'Hundred Grand',
        description: 'Score 100,000 points',
        icon: '🏆',
        category: 'score',
        points: 300,
        secret: false,
        check: (stats) => stats.highScore >= 100000
    },
    MILLION_POINTS: {
        id: 'million_points',
        name: 'Millionaire',
        description: 'Score 1,000,000 total points',
        icon: '💫',
        category: 'score',
        points: 1000,
        secret: true,
        check: (stats) => stats.totalScore >= 1000000
    },

    // Ghost Hunting Achievements
    FIRST_GHOST: {
        id: 'first_ghost',
        name: 'Ghost Buster',
        description: 'Eat your first ghost',
        icon: '👻',
        category: 'ghosts',
        points: 20,
        secret: false,
        check: (stats) => stats.ghostsEaten >= 1
    },
    GHOST_10: {
        id: 'ghost_10',
        name: 'Haunter Hunter',
        description: 'Eat 10 ghosts',
        icon: '👾',
        category: 'ghosts',
        points: 40,
        secret: false,
        check: (stats) => stats.ghostsEaten >= 10
    },
    GHOST_50: {
        id: 'ghost_50',
        name: 'Spectral Slayer',
        description: 'Eat 50 ghosts',
        icon: '💀',
        category: 'ghosts',
        points: 100,
        secret: false,
        check: (stats) => stats.ghostsEaten >= 50
    },
    COMBO_KING: {
        id: 'combo_king',
        name: 'Combo King',
        description: 'Eat all 4 ghosts in one power mode',
        icon: '🔥',
        category: 'ghosts',
        points: 75,
        secret: false,
        check: (stats) => stats.maxGhostCombo >= 4
    },
    PERFECT_CHAIN: {
        id: 'perfect_chain',
        name: 'Perfect Chain',
        description: 'Eat 4 ghosts 3 times in one level',
        icon: '⛓️',
        category: 'ghosts',
        points: 200,
        secret: false,
        check: (stats) => stats.perfectChainsInLevel >= 3
    },

    // Speed Achievements
    SPEED_DEMON: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete a level in under 60 seconds',
        icon: '⚡',
        category: 'speed',
        points: 100,
        secret: false,
        check: (stats) => stats.fastestLevel <= 60
    },
    LIGHTNING_FAST: {
        id: 'lightning_fast',
        name: 'Lightning Fast',
        description: 'Complete a level in under 45 seconds',
        icon: '⚡',
        category: 'speed',
        points: 200,
        secret: false,
        check: (stats) => stats.fastestLevel <= 45
    },
    TIME_MASTER: {
        id: 'time_master',
        name: 'Time Master',
        description: 'Complete Speed Run mode',
        icon: '⏱️',
        category: 'speed',
        points: 150,
        secret: false,
        check: (stats) => stats.speedRunCompleted
    },

    // Collection Achievements
    FRUIT_LOVER: {
        id: 'fruit_lover',
        name: 'Fruit Lover',
        description: 'Collect 10 fruits',
        icon: '🍒',
        category: 'collection',
        points: 30,
        secret: false,
        check: (stats) => stats.fruitsCollected >= 10
    },
    FRUIT_FANATIC: {
        id: 'fruit_fanatic',
        name: 'Fruit Fanatic',
        description: 'Collect all fruit types',
        icon: '🍓',
        category: 'collection',
        points: 100,
        secret: false,
        check: (stats) => stats.uniqueFruits >= 8
    },
    POWER_COLLECTOR: {
        id: 'power_collector',
        name: 'Power Collector',
        description: 'Use 25 power-ups',
        icon: '⭐',
        category: 'collection',
        points: 75,
        secret: false,
        check: (stats) => stats.powerUpsUsed >= 25
    },
    MAP_EXPLORER: {
        id: 'map_explorer',
        name: 'Map Explorer',
        description: 'Play on 10 different maps',
        icon: '🗺️',
        category: 'collection',
        points: 150,
        secret: false,
        check: (stats) => stats.mapsPlayed >= 10
    },

    // Challenge Achievements
    NO_DEATH_RUN: {
        id: 'no_death_run',
        name: 'Deathless',
        description: 'Complete 3 levels without dying',
        icon: '💪',
        category: 'challenge',
        points: 150,
        secret: false,
        check: (stats) => stats.levelsWithoutDeath >= 3
    },
    PACIFIST: {
        id: 'pacifist',
        name: 'Pacifist',
        description: 'Complete a level without eating ghosts',
        icon: '☮️',
        category: 'challenge',
        points: 100,
        secret: false,
        check: (stats) => stats.pacifistLevels >= 1
    },
    SURVIVOR_100: {
        id: 'survivor_100',
        name: 'Survivor',
        description: 'Last 100 seconds in Survival mode',
        icon: '🏃',
        category: 'challenge',
        points: 200,
        secret: false,
        check: (stats) => stats.survivalBestTime >= 100
    }
};

/**
 * Achievement System Manager
 */
export class AchievementSystem {
    constructor(game) {
        this.game = game;
        this.unlockedAchievements = this.loadUnlocked();
        this.stats = this.loadStats();
        this.pendingPopups = [];
    }

    loadUnlocked() {
        const saved = localStorage.getItem('pacman_achievements');
        return saved ? JSON.parse(saved) : [];
    }

    saveUnlocked() {
        localStorage.setItem('pacman_achievements', JSON.stringify(this.unlockedAchievements));
    }

    loadStats() {
        const saved = localStorage.getItem('pacman_achievement_stats');
        return saved ? JSON.parse(saved) : {
            dotsEaten: 0,
            levelsCompleted: 0,
            storyChaptersCompleted: 0,
            highScore: 0,
            totalScore: 0,
            ghostsEaten: 0,
            maxGhostCombo: 0,
            perfectChainsInLevel: 0,
            fastestLevel: Infinity,
            speedRunCompleted: false,
            fruitsCollected: 0,
            uniqueFruits: 0,
            powerUpsUsed: 0,
            mapsPlayed: 0,
            levelsWithoutDeath: 0,
            pacifistLevels: 0,
            survivalBestTime: 0,
            playedMaps: [],
            collectedFruits: []
        };
    }

    saveStats() {
        localStorage.setItem('pacman_achievement_stats', JSON.stringify(this.stats));
    }

    updateStat(key, value, mode = 'set') {
        if (mode === 'add') {
            this.stats[key] = (this.stats[key] || 0) + value;
        } else if (mode === 'max') {
            this.stats[key] = Math.max(this.stats[key] || 0, value);
        } else if (mode === 'min') {
            this.stats[key] = Math.min(this.stats[key] || Infinity, value);
        } else {
            this.stats[key] = value;
        }
        
        this.saveStats();
        this.checkAllAchievements();
    }

    checkAllAchievements() {
        Object.values(ACHIEVEMENTS).forEach(achievement => {
            if (!this.unlockedAchievements.includes(achievement.id)) {
                if (achievement.check(this.stats)) {
                    this.unlock(achievement);
                }
            }
        });
    }

    unlock(achievement) {
        if (this.unlockedAchievements.includes(achievement.id)) return;

        this.unlockedAchievements.push(achievement.id);
        this.saveUnlocked();

        // Queue popup
        this.pendingPopups.push(achievement);
        
        // Show popup if first in queue
        if (this.pendingPopups.length === 1) {
            this.showPopup(achievement);
        }
    }

    showPopup(achievement) {
        // Create popup element
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-title">Achievement Unlocked!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
                <div class="achievement-points">+${achievement.points} pts</div>
            </div>
        `;

        document.body.appendChild(popup);

        // Animate in
        setTimeout(() => popup.classList.add('show'), 10);

        // Remove after delay
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => {
                popup.remove();
                
                // Show next popup if queued
                this.pendingPopups.shift();
                if (this.pendingPopups.length > 0) {
                    this.showPopup(this.pendingPopups[0]);
                }
            }, 300);
        }, 3000);
    }

    // Event handlers
    onDotEaten() {
        this.updateStat('dotsEaten', 1, 'add');
    }

    onGhostEaten(comboCount) {
        this.updateStat('ghostsEaten', 1, 'add');
        this.updateStat('maxGhostCombo', comboCount, 'max');
    }

    onPowerChain(count) {
        if (count >= 4) {
            this.stats.perfectChainsInLevel = (this.stats.perfectChainsInLevel || 0) + 1;
            this.saveStats();
            this.checkAllAchievements();
        }
    }

    onLevelComplete(levelTime, ghostsEatenThisLevel, deathsThisLevel) {
        this.updateStat('levelsCompleted', 1, 'add');
        this.updateStat('fastestLevel', levelTime, 'min');

        if (deathsThisLevel === 0) {
            this.updateStat('levelsWithoutDeath', 1, 'add');
        } else {
            this.stats.levelsWithoutDeath = 0;
            this.saveStats();
        }

        if (ghostsEatenThisLevel === 0) {
            this.updateStat('pacifistLevels', 1, 'add');
        }

        // Reset per-level counters
        this.stats.perfectChainsInLevel = 0;
        this.saveStats();
    }

    onStoryChapterComplete() {
        this.updateStat('storyChaptersCompleted', 1, 'add');
    }

    onScoreUpdate(score, total) {
        this.updateStat('highScore', score, 'max');
        this.updateStat('totalScore', total, 'set');
    }

    onFruitCollected(fruitType) {
        this.updateStat('fruitsCollected', 1, 'add');
        
        if (!this.stats.collectedFruits.includes(fruitType)) {
            this.stats.collectedFruits.push(fruitType);
            this.stats.uniqueFruits = this.stats.collectedFruits.length;
            this.saveStats();
        }
    }

    onPowerUpUsed() {
        this.updateStat('powerUpsUsed', 1, 'add');
    }

    checkPowerUpAchievements(powerUpStats) {
        this.stats.powerUpsUsed = powerUpStats.totalCollected;
        this.saveStats();
        this.checkAllAchievements();
    }

    onMapPlayed(mapId) {
        if (!this.stats.playedMaps.includes(mapId)) {
            this.stats.playedMaps.push(mapId);
            this.stats.mapsPlayed = this.stats.playedMaps.length;
            this.saveStats();
        }
    }

    onSurvivalTime(time) {
        this.updateStat('survivalBestTime', time, 'max');
    }

    onSpeedRunComplete() {
        this.stats.speedRunCompleted = true;
        this.saveStats();
        this.checkAllAchievements();
    }

    // Get achievement data
    getAll() {
        return Object.values(ACHIEVEMENTS).map(a => ({
            ...a,
            unlocked: this.unlockedAchievements.includes(a.id)
        }));
    }

    getUnlocked() {
        return this.unlockedAchievements.map(id => ACHIEVEMENTS[id.toUpperCase()] || 
            Object.values(ACHIEVEMENTS).find(a => a.id === id));
    }

    getProgress() {
        return {
            unlocked: this.unlockedAchievements.length,
            total: Object.keys(ACHIEVEMENTS).length,
            percentage: Math.round((this.unlockedAchievements.length / Object.keys(ACHIEVEMENTS).length) * 100)
        };
    }

    getTotalPoints() {
        return this.unlockedAchievements.reduce((sum, id) => {
            const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === id);
            return sum + (achievement?.points || 0);
        }, 0);
    }

    getByCategory(category) {
        return Object.values(ACHIEVEMENTS)
            .filter(a => a.category === category)
            .map(a => ({
                ...a,
                unlocked: this.unlockedAchievements.includes(a.id)
            }));
    }

    getStats() {
        return { ...this.stats };
    }
}
