/**
 * Tetris Achievement System
 * Tracks and manages player achievements
 */

// Achievement Definitions
export const ACHIEVEMENTS = {
    // Line Clear Achievements
    FIRST_BLOOD: {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Clear your first line',
        icon: '🎯',
        category: 'lines',
        hidden: false,
        points: 10,
        condition: (stats) => stats.totalLines >= 1
    },
    LINE_STARTER: {
        id: 'line_starter',
        name: 'Line Starter',
        description: 'Clear 10 lines total',
        icon: '📊',
        category: 'lines',
        hidden: false,
        points: 25,
        condition: (stats) => stats.totalLines >= 10
    },
    LINE_ENTHUSIAST: {
        id: 'line_enthusiast',
        name: 'Line Enthusiast',
        description: 'Clear 50 lines total',
        icon: '📈',
        category: 'lines',
        hidden: false,
        points: 50,
        condition: (stats) => stats.totalLines >= 50
    },
    LINE_MASTER: {
        id: 'line_master',
        name: 'Line Master',
        description: 'Clear 100 lines total',
        icon: '🏆',
        category: 'lines',
        hidden: false,
        points: 100,
        condition: (stats) => stats.totalLines >= 100
    },
    LINE_LEGEND: {
        id: 'line_legend',
        name: 'Line Legend',
        description: 'Clear 1,000 lines total',
        icon: '👑',
        category: 'lines',
        hidden: false,
        points: 500,
        condition: (stats) => stats.totalLines >= 1000
    },

    // Tetris Achievements
    FIRST_TETRIS: {
        id: 'first_tetris',
        name: 'Tetris Beginner',
        description: 'Get your first Tetris (4-line clear)',
        icon: '🧱',
        category: 'tetris',
        hidden: false,
        points: 50,
        condition: (stats) => stats.totalTetrises >= 1
    },
    TETRIS_ADDICT: {
        id: 'tetris_addict',
        name: 'Tetris Addict',
        description: 'Get 10 Tetrises in one game',
        icon: '🎮',
        category: 'tetris',
        hidden: false,
        points: 100,
        condition: (stats) => stats.tetrisesInGame >= 10
    },
    TETRIS_MASTER: {
        id: 'tetris_master',
        name: 'Tetris Master',
        description: 'Get 50 Tetrises total',
        icon: '🎖️',
        category: 'tetris',
        hidden: false,
        points: 200,
        condition: (stats) => stats.totalTetrises >= 50
    },
    BACK_TO_BACK: {
        id: 'back_to_back',
        name: 'Back-to-Back',
        description: 'Get 2 Tetrises in a row',
        icon: '🔄',
        category: 'tetris',
        hidden: false,
        points: 75,
        condition: (stats) => stats.backToBackTetrises >= 1
    },
    TRIPLE_THREAT: {
        id: 'triple_threat',
        name: 'Triple Threat',
        description: 'Get 3 Tetrises in a row',
        icon: '💫',
        category: 'tetris',
        hidden: true,
        points: 150,
        condition: (stats) => stats.consecutiveTetrises >= 3
    },

    // Combo Achievements
    COMBO_STARTER: {
        id: 'combo_starter',
        name: 'Combo Starter',
        description: 'Achieve a 3x combo',
        icon: '🔥',
        category: 'combo',
        hidden: false,
        points: 30,
        condition: (stats) => stats.maxCombo >= 3
    },
    COMBO_KING: {
        id: 'combo_king',
        name: 'Combo King',
        description: 'Achieve a 10x combo',
        icon: '👊',
        category: 'combo',
        hidden: false,
        points: 100,
        condition: (stats) => stats.maxCombo >= 10
    },
    COMBO_LEGEND: {
        id: 'combo_legend',
        name: 'Combo Legend',
        description: 'Achieve a 20x combo',
        icon: '⚡',
        category: 'combo',
        hidden: true,
        points: 250,
        condition: (stats) => stats.maxCombo >= 20
    },

    // Speed Achievements
    SPEED_DEMON: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Reach level 10',
        icon: '💨',
        category: 'speed',
        hidden: false,
        points: 50,
        condition: (stats) => stats.maxLevel >= 10
    },
    LIGHTNING_FINGERS: {
        id: 'lightning_fingers',
        name: 'Lightning Fingers',
        description: 'Reach level 15',
        icon: '⚡',
        category: 'speed',
        hidden: false,
        points: 100,
        condition: (stats) => stats.maxLevel >= 15
    },
    HYPERSPEED: {
        id: 'hyperspeed',
        name: 'Hyperspeed',
        description: 'Reach level 20',
        icon: '🚀',
        category: 'speed',
        hidden: true,
        points: 200,
        condition: (stats) => stats.maxLevel >= 20
    },

    // Perfect Clear Achievements
    PERFECT: {
        id: 'perfect',
        name: 'Perfect Clear',
        description: 'Clear the entire board',
        icon: '✨',
        category: 'perfect',
        hidden: false,
        points: 150,
        condition: (stats) => stats.perfectClears >= 1
    },
    PERFECTIONIST: {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Get 5 perfect clears lifetime',
        icon: '💎',
        category: 'perfect',
        hidden: true,
        points: 500,
        condition: (stats) => stats.perfectClears >= 5
    },

    // Mode Specific Achievements
    SPRINT_CHAMPION: {
        id: 'sprint_champion',
        name: 'Sprint Champion',
        description: 'Complete Sprint mode under 2 minutes',
        icon: '🏃',
        category: 'modes',
        hidden: false,
        points: 150,
        condition: (stats) => stats.bestSprintTime && stats.bestSprintTime < 120000
    },
    SPRINT_LEGEND: {
        id: 'sprint_legend',
        name: 'Sprint Legend',
        description: 'Complete Sprint mode under 1 minute',
        icon: '🏅',
        category: 'modes',
        hidden: true,
        points: 300,
        condition: (stats) => stats.bestSprintTime && stats.bestSprintTime < 60000
    },
    ULTRA_LEGEND: {
        id: 'ultra_legend',
        name: 'Ultra Legend',
        description: 'Score 50,000 in Ultra mode',
        icon: '⭐',
        category: 'modes',
        hidden: false,
        points: 200,
        condition: (stats) => stats.bestUltraScore >= 50000
    },
    SURVIVOR: {
        id: 'survivor',
        name: 'Survivor',
        description: 'Survive 5 minutes in Survival mode',
        icon: '💀',
        category: 'modes',
        hidden: false,
        points: 150,
        condition: (stats) => stats.bestSurvivalTime >= 300000
    },
    ZEN_MASTER: {
        id: 'zen_master',
        name: 'Zen Master',
        description: 'Play Zen mode for 10 minutes',
        icon: '🧘',
        category: 'modes',
        hidden: false,
        points: 50,
        condition: (stats) => stats.zenPlayTime >= 600000
    },

    // Score Achievements
    SCORE_STARTER: {
        id: 'score_starter',
        name: 'Score Starter',
        description: 'Score 10,000 points',
        icon: '💰',
        category: 'score',
        hidden: false,
        points: 25,
        condition: (stats) => stats.highScore >= 10000
    },
    SCORE_HUNTER: {
        id: 'score_hunter',
        name: 'Score Hunter',
        description: 'Score 50,000 points',
        icon: '💵',
        category: 'score',
        hidden: false,
        points: 75,
        condition: (stats) => stats.highScore >= 50000
    },
    SCORE_MASTER: {
        id: 'score_master',
        name: 'Score Master',
        description: 'Score 100,000 points',
        icon: '💎',
        category: 'score',
        hidden: true,
        points: 200,
        condition: (stats) => stats.highScore >= 100000
    }
};

// Achievement Categories
export const ACHIEVEMENT_CATEGORIES = {
    lines: { name: 'Line Clears', icon: '📊', color: '#00ffff' },
    tetris: { name: 'Tetrises', icon: '🧱', color: '#ff00ff' },
    combo: { name: 'Combos', icon: '🔥', color: '#ff8800' },
    speed: { name: 'Speed', icon: '⚡', color: '#ffff00' },
    perfect: { name: 'Perfect Clears', icon: '✨', color: '#00ff88' },
    modes: { name: 'Game Modes', icon: '🎮', color: '#ff0088' },
    score: { name: 'Scoring', icon: '💰', color: '#88ff00' }
};

/**
 * Achievement System Class
 */
export class AchievementSystem {
    constructor(game) {
        this.game = game;
        this.unlockedAchievements = new Set();
        this.stats = this.createEmptyStats();
        this.pendingNotifications = [];
        this.loadData();
    }

    createEmptyStats() {
        return {
            // Lifetime stats
            totalLines: 0,
            totalTetrises: 0,
            perfectClears: 0,
            gamesPlayed: 0,
            totalPlayTime: 0,
            highScore: 0,
            maxLevel: 0,
            maxCombo: 0,
            
            // Current game stats
            linesInGame: 0,
            tetrisesInGame: 0,
            scoreInGame: 0,
            levelInGame: 0,
            comboInGame: 0,
            
            // Special tracking
            backToBackTetrises: 0,
            consecutiveTetrises: 0,
            
            // Mode-specific
            bestSprintTime: null,
            bestUltraScore: 0,
            bestSurvivalTime: 0,
            zenPlayTime: 0
        };
    }

    loadData() {
        try {
            const savedAchievements = localStorage.getItem('tetris_achievements');
            if (savedAchievements) {
                this.unlockedAchievements = new Set(JSON.parse(savedAchievements));
            }

            const savedStats = localStorage.getItem('tetris_achievement_stats');
            if (savedStats) {
                this.stats = { ...this.stats, ...JSON.parse(savedStats) };
            }
        } catch (e) {
            console.warn('Failed to load achievement data:', e);
        }
    }

    saveData() {
        try {
            localStorage.setItem('tetris_achievements', 
                JSON.stringify([...this.unlockedAchievements]));
            localStorage.setItem('tetris_achievement_stats', 
                JSON.stringify(this.stats));
        } catch (e) {
            console.warn('Failed to save achievement data:', e);
        }
    }

    resetGameStats() {
        this.stats.linesInGame = 0;
        this.stats.tetrisesInGame = 0;
        this.stats.scoreInGame = 0;
        this.stats.levelInGame = 0;
        this.stats.comboInGame = 0;
        this.stats.consecutiveTetrises = 0;
    }

    onGameStart() {
        this.resetGameStats();
        this.stats.gamesPlayed++;
        this.saveData();
    }

    onGameEnd(score, level, mode) {
        this.stats.highScore = Math.max(this.stats.highScore, score);
        this.stats.maxLevel = Math.max(this.stats.maxLevel, level);
        
        // Mode-specific tracking
        if (mode === 'survival') {
            // Survival time is tracked elsewhere
        }
        
        this.checkAllAchievements();
        this.saveData();
    }

    onLineClear(lineCount) {
        this.stats.totalLines += lineCount;
        this.stats.linesInGame += lineCount;
        
        if (lineCount === 4) {
            this.stats.totalTetrises++;
            this.stats.tetrisesInGame++;
            this.stats.consecutiveTetrises++;
            
            // Track back-to-back
            if (this.stats.consecutiveTetrises >= 2) {
                this.stats.backToBackTetrises++;
            }
        } else {
            this.stats.consecutiveTetrises = 0;
        }
        
        this.checkAllAchievements();
        this.saveData();
    }

    onCombo(comboCount) {
        this.stats.comboInGame = comboCount;
        this.stats.maxCombo = Math.max(this.stats.maxCombo, comboCount);
        this.checkAllAchievements();
    }

    onPerfectClear() {
        this.stats.perfectClears++;
        this.checkAllAchievements();
        this.saveData();
    }

    onLevelUp(level) {
        this.stats.levelInGame = level;
        this.stats.maxLevel = Math.max(this.stats.maxLevel, level);
        this.checkAllAchievements();
    }

    onSprintComplete(time) {
        if (!this.stats.bestSprintTime || time < this.stats.bestSprintTime) {
            this.stats.bestSprintTime = time;
        }
        this.checkAllAchievements();
        this.saveData();
    }

    onUltraComplete(score) {
        this.stats.bestUltraScore = Math.max(this.stats.bestUltraScore, score);
        this.checkAllAchievements();
        this.saveData();
    }

    onSurvivalEnd(time) {
        this.stats.bestSurvivalTime = Math.max(this.stats.bestSurvivalTime, time);
        this.checkAllAchievements();
        this.saveData();
    }

    updateZenPlayTime(dt) {
        this.stats.zenPlayTime += dt;
        this.checkAllAchievements();
    }

    checkAllAchievements() {
        for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
            if (!this.unlockedAchievements.has(achievement.id)) {
                if (achievement.condition(this.stats)) {
                    this.unlockAchievement(achievement);
                }
            }
        }
    }

    unlockAchievement(achievement) {
        if (this.unlockedAchievements.has(achievement.id)) return;
        
        this.unlockedAchievements.add(achievement.id);
        this.saveData();
        
        // Add to pending notifications
        this.pendingNotifications.push({
            ...achievement,
            unlockedAt: Date.now()
        });
        
        // Callback to game
        this.game.onAchievementUnlocked?.(achievement);
    }

    getNextNotification() {
        return this.pendingNotifications.shift();
    }

    hasNotifications() {
        return this.pendingNotifications.length > 0;
    }

    isUnlocked(achievementId) {
        return this.unlockedAchievements.has(achievementId);
    }

    getAchievement(achievementId) {
        return Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
    }

    getAchievementsByCategory(category) {
        return Object.values(ACHIEVEMENTS)
            .filter(a => a.category === category)
            .map(a => ({
                ...a,
                unlocked: this.isUnlocked(a.id)
            }));
    }

    getAllAchievements() {
        return Object.values(ACHIEVEMENTS).map(a => ({
            ...a,
            unlocked: this.isUnlocked(a.id)
        }));
    }

    getUnlockedCount() {
        return this.unlockedAchievements.size;
    }

    getTotalCount() {
        return Object.keys(ACHIEVEMENTS).length;
    }

    getTotalPoints() {
        return [...this.unlockedAchievements].reduce((total, id) => {
            const achievement = this.getAchievement(id);
            return total + (achievement?.points || 0);
        }, 0);
    }

    getMaxPoints() {
        return Object.values(ACHIEVEMENTS).reduce((total, a) => total + a.points, 0);
    }

    getProgress() {
        return {
            unlocked: this.getUnlockedCount(),
            total: this.getTotalCount(),
            points: this.getTotalPoints(),
            maxPoints: this.getMaxPoints(),
            percentage: Math.round((this.getUnlockedCount() / this.getTotalCount()) * 100)
        };
    }

    getStats() {
        return { ...this.stats };
    }

    // Render achievement notification
    renderNotification(ctx, width, height, achievement) {
        const notifWidth = 250;
        const notifHeight = 60;
        const x = (width - notifWidth) / 2;
        const y = 80;

        ctx.save();

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.strokeStyle = ACHIEVEMENT_CATEGORIES[achievement.category]?.color || '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, notifWidth, notifHeight, 10);
        ctx.fill();
        ctx.stroke();

        // Icon
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(achievement.icon, x + 15, y + 38);

        // Title
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Achievement Unlocked!', x + 50, y + 22);

        // Name
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillStyle = ACHIEVEMENT_CATEGORIES[achievement.category]?.color || '#ffffff';
        ctx.fillText(achievement.name, x + 50, y + 42);

        // Points
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffff00';
        ctx.fillText(`+${achievement.points}`, x + notifWidth - 15, y + 42);

        ctx.restore();
    }
}
