/**
 * Rhythm Game - Achievement System
 * Tracks and manages player achievements
 */

// Achievement Categories
export const AchievementCategory = {
    COMBO: 'combo',
    ACCURACY: 'accuracy',
    PROGRESS: 'progress',
    SPECIAL: 'special',
    HIDDEN: 'hidden'
};

// Achievement Definitions
export const ACHIEVEMENTS = {
    // === Combo Achievements ===
    FIRST_COMBO: {
        id: 'first_combo',
        name: 'First Combo',
        description: 'Build a 10-note combo',
        icon: '🔥',
        category: AchievementCategory.COMBO,
        hidden: false,
        points: 10,
        condition: (stats) => stats.maxCombo >= 10
    },
    COMBO_BUILDER: {
        id: 'combo_builder',
        name: 'Combo Builder',
        description: 'Build a 25-note combo',
        icon: '⚡',
        category: AchievementCategory.COMBO,
        hidden: false,
        points: 25,
        condition: (stats) => stats.maxCombo >= 25
    },
    COMBO_MASTER: {
        id: 'combo_master',
        name: 'Combo Master',
        description: 'Build a 50-note combo',
        icon: '💫',
        category: AchievementCategory.COMBO,
        hidden: false,
        points: 50,
        condition: (stats) => stats.maxCombo >= 50
    },
    COMBO_LEGEND: {
        id: 'combo_legend',
        name: 'Combo Legend',
        description: 'Build a 100-note combo',
        icon: '🌟',
        category: AchievementCategory.COMBO,
        hidden: false,
        points: 100,
        condition: (stats) => stats.maxCombo >= 100
    },
    COMBO_GOD: {
        id: 'combo_god',
        name: 'Combo God',
        description: 'Build a 200-note combo',
        icon: '👑',
        category: AchievementCategory.COMBO,
        hidden: true,
        points: 200,
        condition: (stats) => stats.maxCombo >= 200
    },
    
    // === Accuracy Achievements ===
    SHARPSHOOTER: {
        id: 'sharpshooter',
        name: 'Sharpshooter',
        description: 'Complete a song with 90% accuracy',
        icon: '🎯',
        category: AchievementCategory.ACCURACY,
        hidden: false,
        points: 30,
        condition: (stats) => stats.accuracy >= 90
    },
    PERFECTIONIST: {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Complete a song with 95% accuracy',
        icon: '💎',
        category: AchievementCategory.ACCURACY,
        hidden: false,
        points: 50,
        condition: (stats) => stats.accuracy >= 95
    },
    FLAWLESS: {
        id: 'flawless',
        name: 'Flawless',
        description: 'Complete a song with 100% accuracy',
        icon: '✨',
        category: AchievementCategory.ACCURACY,
        hidden: false,
        points: 100,
        condition: (stats) => stats.accuracy >= 100
    },
    PERFECT_HUNTER: {
        id: 'perfect_hunter',
        name: 'Perfect Hunter',
        description: 'Get 50 Perfect hits in one song',
        icon: '🎪',
        category: AchievementCategory.ACCURACY,
        hidden: false,
        points: 40,
        condition: (stats) => stats.perfectHits >= 50
    },
    ALL_PERFECT: {
        id: 'all_perfect',
        name: 'All Perfect',
        description: 'Complete a song with only Perfect hits',
        icon: '🏆',
        category: AchievementCategory.ACCURACY,
        hidden: true,
        points: 150,
        condition: (stats) => stats.accuracy === 100 && stats.goodHits === 0 && stats.okHits === 0
    },
    
    // === Progress Achievements ===
    FIRST_CLEAR: {
        id: 'first_clear',
        name: 'First Clear',
        description: 'Complete your first song',
        icon: '🎵',
        category: AchievementCategory.PROGRESS,
        hidden: false,
        points: 10,
        condition: (stats) => stats.totalClears >= 1
    },
    SONG_COLLECTOR: {
        id: 'song_collector',
        name: 'Song Collector',
        description: 'Complete 5 different songs',
        icon: '📀',
        category: AchievementCategory.PROGRESS,
        hidden: false,
        points: 25,
        condition: (stats) => stats.uniqueClears >= 5
    },
    MUSIC_LOVER: {
        id: 'music_lover',
        name: 'Music Lover',
        description: 'Complete 10 different songs',
        icon: '💿',
        category: AchievementCategory.PROGRESS,
        hidden: false,
        points: 50,
        condition: (stats) => stats.uniqueClears >= 10
    },
    COMPLETIONIST: {
        id: 'completionist',
        name: 'Completionist',
        description: 'Complete all songs',
        icon: '🌈',
        category: AchievementCategory.PROGRESS,
        hidden: false,
        points: 100,
        condition: (stats) => stats.uniqueClears >= 12
    },
    STORY_STARTER: {
        id: 'story_starter',
        name: 'Story Starter',
        description: 'Complete Chapter 1 of Story Mode',
        icon: '📖',
        category: AchievementCategory.PROGRESS,
        hidden: false,
        points: 30,
        condition: (stats) => stats.storyChaptersCompleted >= 1
    },
    CHAPTER_2: {
        id: 'chapter_2',
        name: 'Rising Star',
        description: 'Complete Chapter 2 of Story Mode',
        icon: '⭐',
        category: AchievementCategory.PROGRESS,
        hidden: false,
        points: 40,
        condition: (stats) => stats.storyChaptersCompleted >= 2
    },
    CHAPTER_3: {
        id: 'chapter_3',
        name: 'Rhythm Master',
        description: 'Complete Chapter 3 of Story Mode',
        icon: '🎭',
        category: AchievementCategory.PROGRESS,
        hidden: false,
        points: 50,
        condition: (stats) => stats.storyChaptersCompleted >= 3
    },
    STORY_COMPLETE: {
        id: 'story_complete',
        name: 'Champion',
        description: 'Complete all Story Mode chapters',
        icon: '👑',
        category: AchievementCategory.PROGRESS,
        hidden: false,
        points: 100,
        condition: (stats) => stats.storyChaptersCompleted >= 4
    },
    BOSS_SLAYER: {
        id: 'boss_slayer',
        name: 'Boss Slayer',
        description: 'Defeat all 4 boss levels',
        icon: '🗡️',
        category: AchievementCategory.PROGRESS,
        hidden: false,
        points: 75,
        condition: (stats) => stats.bossesDefeated >= 4
    },
    STAR_COLLECTOR: {
        id: 'star_collector',
        name: 'Star Collector',
        description: 'Earn 30 stars in Story Mode',
        icon: '🌟',
        category: AchievementCategory.PROGRESS,
        hidden: false,
        points: 60,
        condition: (stats) => stats.totalStars >= 30
    },
    
    // === Special Achievements ===
    FULL_COMBO: {
        id: 'full_combo',
        name: 'Full Combo',
        description: 'Complete a song with no misses',
        icon: '💯',
        category: AchievementCategory.SPECIAL,
        hidden: false,
        points: 50,
        condition: (stats) => stats.lastSongMisses === 0
    },
    SPEED_DEMON: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete a song at 1.5x speed',
        icon: '💨',
        category: AchievementCategory.SPECIAL,
        hidden: false,
        points: 40,
        condition: (stats) => stats.fastestSpeedCleared >= 1.5
    },
    HOLD_MASTER: {
        id: 'hold_master',
        name: 'Hold Master',
        description: 'Successfully hit 30 hold notes',
        icon: '✋',
        category: AchievementCategory.SPECIAL,
        hidden: false,
        points: 30,
        condition: (stats) => stats.totalHolds >= 30
    },
    SLIDE_KING: {
        id: 'slide_king',
        name: 'Slide King',
        description: 'Successfully hit 30 slide notes',
        icon: '👆',
        category: AchievementCategory.SPECIAL,
        hidden: false,
        points: 30,
        condition: (stats) => stats.totalSlides >= 30
    },
    ENDURANCE: {
        id: 'endurance',
        name: 'Endurance',
        description: 'Play for 30 minutes in one session',
        icon: '⏱️',
        category: AchievementCategory.SPECIAL,
        hidden: false,
        points: 35,
        condition: (stats) => stats.sessionTime >= 30 * 60 * 1000
    },
    MARATHON: {
        id: 'marathon',
        name: 'Marathon Runner',
        description: 'Complete 5 songs in Endless Mode',
        icon: '∞',
        category: AchievementCategory.SPECIAL,
        hidden: false,
        points: 45,
        condition: (stats) => stats.endlessBest >= 5
    },
    
    // === Hidden Achievements ===
    NIGHT_OWL: {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Play at midnight',
        icon: '🦉',
        category: AchievementCategory.HIDDEN,
        hidden: true,
        points: 15,
        condition: (stats) => {
            const hour = new Date().getHours();
            return hour === 0 && stats.justPlayed;
        }
    },
    EARLY_BIRD: {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Play at 6 AM',
        icon: '🐦',
        category: AchievementCategory.HIDDEN,
        hidden: true,
        points: 15,
        condition: (stats) => {
            const hour = new Date().getHours();
            return hour === 6 && stats.justPlayed;
        }
    },
    DEDICATED: {
        id: 'dedicated',
        name: 'Dedicated',
        description: 'Play 7 days in a row',
        icon: '📅',
        category: AchievementCategory.HIDDEN,
        hidden: true,
        points: 50,
        condition: (stats) => stats.consecutiveDays >= 7
    },
    CLOSE_CALL: {
        id: 'close_call',
        name: 'Close Call',
        description: 'Win with exactly 1 life in Endless Mode',
        icon: '😅',
        category: AchievementCategory.HIDDEN,
        hidden: true,
        points: 25,
        condition: (stats) => stats.endlessCloseCall
    }
};

/**
 * Achievement Manager Class
 */
export class AchievementManager {
    constructor() {
        this.achievements = { ...ACHIEVEMENTS };
        this.unlockedAchievements = new Set();
        this.pendingNotifications = [];
        this.stats = this.loadStats();
        this.loadUnlocks();
    }
    
    /**
     * Load persistent stats from storage
     */
    loadStats() {
        try {
            const saved = localStorage.getItem('rhythm_achievement_stats');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load achievement stats:', e);
        }
        
        return {
            totalClears: 0,
            uniqueClears: 0,
            clearedSongs: [],
            perfectHits: 0,
            goodHits: 0,
            okHits: 0,
            totalMisses: 0,
            maxCombo: 0,
            totalHolds: 0,
            totalSlides: 0,
            storyChaptersCompleted: 0,
            bossesDefeated: 0,
            totalStars: 0,
            fastestSpeedCleared: 1.0,
            endlessBest: 0,
            sessionTime: 0,
            consecutiveDays: 0,
            lastPlayDate: null,
            endlessCloseCall: false,
            lastSongMisses: 0,
            accuracy: 0,
            justPlayed: false
        };
    }
    
    /**
     * Save stats to storage
     */
    saveStats() {
        try {
            localStorage.setItem('rhythm_achievement_stats', JSON.stringify(this.stats));
        } catch (e) {
            console.warn('Failed to save achievement stats:', e);
        }
    }
    
    /**
     * Load unlocked achievements from storage
     */
    loadUnlocks() {
        try {
            const saved = localStorage.getItem('rhythm_achievements_unlocked');
            if (saved) {
                this.unlockedAchievements = new Set(JSON.parse(saved));
            }
        } catch (e) {
            console.warn('Failed to load achievement unlocks:', e);
        }
    }
    
    /**
     * Save unlocked achievements to storage
     */
    saveUnlocks() {
        try {
            localStorage.setItem('rhythm_achievements_unlocked', 
                JSON.stringify([...this.unlockedAchievements]));
        } catch (e) {
            console.warn('Failed to save achievement unlocks:', e);
        }
    }
    
    /**
     * Update stats after a song clear
     */
    updateStats(songResult) {
        this.stats.justPlayed = true;
        
        // Update clear counts
        if (songResult.completed) {
            this.stats.totalClears++;
            if (!this.stats.clearedSongs.includes(songResult.songId)) {
                this.stats.clearedSongs.push(songResult.songId);
                this.stats.uniqueClears = this.stats.clearedSongs.length;
            }
        }
        
        // Update hit stats
        this.stats.perfectHits += songResult.perfectHits || 0;
        this.stats.goodHits += songResult.goodHits || 0;
        this.stats.okHits += songResult.okHits || 0;
        this.stats.totalMisses += songResult.misses || 0;
        this.stats.lastSongMisses = songResult.misses || 0;
        this.stats.accuracy = songResult.accuracy || 0;
        
        // Update combo
        if (songResult.maxCombo > this.stats.maxCombo) {
            this.stats.maxCombo = songResult.maxCombo;
        }
        
        // Update note types
        this.stats.totalHolds += songResult.holdsCompleted || 0;
        this.stats.totalSlides += songResult.slidesCompleted || 0;
        
        // Update speed
        if (songResult.speed > this.stats.fastestSpeedCleared) {
            this.stats.fastestSpeedCleared = songResult.speed;
        }
        
        // Track consecutive days
        this.updateConsecutiveDays();
        
        this.saveStats();
        this.checkAllAchievements();
    }
    
    /**
     * Update story progress
     */
    updateStoryProgress(chaptersCompleted, bossesDefeated, totalStars) {
        this.stats.storyChaptersCompleted = chaptersCompleted;
        this.stats.bossesDefeated = bossesDefeated;
        this.stats.totalStars = totalStars;
        this.saveStats();
        this.checkAllAchievements();
    }
    
    /**
     * Update endless mode stats
     */
    updateEndlessStats(songsPlayed, livesRemaining) {
        if (songsPlayed > this.stats.endlessBest) {
            this.stats.endlessBest = songsPlayed;
        }
        if (livesRemaining === 1 && songsPlayed > 0) {
            this.stats.endlessCloseCall = true;
        }
        this.saveStats();
        this.checkAllAchievements();
    }
    
    /**
     * Update session time
     */
    updateSessionTime(time) {
        this.stats.sessionTime = time;
        this.checkAllAchievements();
    }
    
    /**
     * Track consecutive days played
     */
    updateConsecutiveDays() {
        const today = new Date().toDateString();
        const lastPlay = this.stats.lastPlayDate;
        
        if (lastPlay) {
            const lastDate = new Date(lastPlay);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastDate.toDateString() === yesterday.toDateString()) {
                this.stats.consecutiveDays++;
            } else if (lastDate.toDateString() !== today) {
                this.stats.consecutiveDays = 1;
            }
        } else {
            this.stats.consecutiveDays = 1;
        }
        
        this.stats.lastPlayDate = today;
    }
    
    /**
     * Check all achievements
     */
    checkAllAchievements() {
        Object.values(this.achievements).forEach(achievement => {
            if (!this.unlockedAchievements.has(achievement.id)) {
                if (achievement.condition(this.stats)) {
                    this.unlock(achievement.id);
                }
            }
        });
        
        // Reset just played flag
        this.stats.justPlayed = false;
    }
    
    /**
     * Unlock an achievement
     */
    unlock(achievementId) {
        if (this.unlockedAchievements.has(achievementId)) return;
        
        const achievement = this.achievements[achievementId];
        if (!achievement) return;
        
        this.unlockedAchievements.add(achievementId);
        this.saveUnlocks();
        
        // Queue notification
        this.pendingNotifications.push(achievement);
        
        return achievement;
    }
    
    /**
     * Get pending notification
     */
    getNextNotification() {
        return this.pendingNotifications.shift();
    }
    
    /**
     * Check if achievement is unlocked
     */
    isUnlocked(achievementId) {
        return this.unlockedAchievements.has(achievementId);
    }
    
    /**
     * Get all achievements
     */
    getAllAchievements() {
        return Object.values(this.achievements).map(a => ({
            ...a,
            unlocked: this.isUnlocked(a.id)
        }));
    }
    
    /**
     * Get achievements by category
     */
    getByCategory(category) {
        return this.getAllAchievements().filter(a => a.category === category);
    }
    
    /**
     * Get visible achievements (non-hidden or unlocked)
     */
    getVisibleAchievements() {
        return this.getAllAchievements().filter(a => !a.hidden || a.unlocked);
    }
    
    /**
     * Get total points from unlocked achievements
     */
    getTotalPoints() {
        return [...this.unlockedAchievements].reduce((sum, id) => {
            const achievement = this.achievements[id];
            return sum + (achievement?.points || 0);
        }, 0);
    }
    
    /**
     * Get unlock percentage
     */
    getUnlockPercentage() {
        const total = Object.keys(this.achievements).length;
        return Math.round((this.unlockedAchievements.size / total) * 100);
    }
    
    /**
     * Reset all achievements
     */
    reset() {
        this.unlockedAchievements.clear();
        this.stats = this.loadStats();
        this.stats = {
            ...this.stats,
            totalClears: 0,
            uniqueClears: 0,
            clearedSongs: [],
            maxCombo: 0,
            totalHolds: 0,
            totalSlides: 0,
            storyChaptersCompleted: 0,
            bossesDefeated: 0,
            totalStars: 0,
            fastestSpeedCleared: 1.0,
            endlessBest: 0,
            consecutiveDays: 0
        };
        this.saveStats();
        this.saveUnlocks();
    }
}

export default AchievementManager;
