/**
 * Breakout Game - Achievement & Progression System
 * 50 Achievements, XP/Leveling, Daily/Weekly Challenges, Prestige
 */

import { ICONS } from './Icons.js';
import { hubSDK } from '../../js/engine/HubSDK.js';

// Achievement Definitions (50 total)
export const ACHIEVEMENTS = {
    // ===== PROGRESS (10) =====
    first_brick: { id: 'first_brick', name: 'First Blood', desc: 'Break your first brick', icon: ICONS.BRICK, xp: 10, category: 'progress' },
    brick_100: { id: 'brick_100', name: 'Brick Breaker', desc: 'Break 100 bricks', icon: ICONS.BRICK, xp: 50, category: 'progress' },
    brick_500: { id: 'brick_500', name: 'Demolition Expert', desc: 'Break 500 bricks', icon: ICONS.EXPLOSION, xp: 100, category: 'progress' },
    brick_1000: { id: 'brick_1000', name: 'Destroyer of Worlds', desc: 'Break 1000 bricks', icon: ICONS.FIRE, xp: 200, category: 'progress' },
    brick_5000: { id: 'brick_5000', name: 'Legendary Breaker', desc: 'Break 5000 bricks', icon: ICONS.STAR, xp: 500, category: 'progress' },
    first_win: { id: 'first_win', name: 'Victory!', desc: 'Complete your first level', icon: ICONS.TROPHY, xp: 25, category: 'progress' },
    games_10: { id: 'games_10', name: 'Getting Started', desc: 'Play 10 games', icon: ICONS.GAMEPAD, xp: 30, category: 'progress' },
    games_50: { id: 'games_50', name: 'Regular Player', desc: 'Play 50 games', icon: ICONS.GAMEPAD, xp: 75, category: 'progress' },
    games_100: { id: 'games_100', name: 'Dedicated', desc: 'Play 100 games', icon: ICONS.GAMEPAD, xp: 150, category: 'progress' },
    score_10000: { id: 'score_10000', name: 'High Scorer', desc: 'Reach 10,000 total score', icon: ICONS.TROPHY, xp: 100, category: 'progress' },

    // ===== SKILL (10) =====
    perfect_level: { id: 'perfect_level', name: 'Perfect', desc: 'Complete a level without losing a life', icon: ICONS.STAR, xp: 75, category: 'skill' },
    no_miss_5: { id: 'no_miss_5', name: 'Untouchable', desc: 'Complete 5 levels without losing a life', icon: ICONS.STAR, xp: 150, category: 'skill' },
    speed_clear: { id: 'speed_clear', name: 'Speed Demon', desc: 'Clear a level in under 60 seconds', icon: ICONS.BOLT, xp: 100, category: 'skill' },
    combo_10: { id: 'combo_10', name: 'Combo Starter', desc: 'Get a 10-hit combo', icon: ICONS.FIRE, xp: 50, category: 'skill' },
    combo_25: { id: 'combo_25', name: 'Combo Master', desc: 'Get a 25-hit combo', icon: ICONS.FIRE, xp: 100, category: 'skill' },
    combo_50: { id: 'combo_50', name: 'Combo Legend', desc: 'Get a 50-hit combo', icon: ICONS.FIRE, xp: 200, category: 'skill' },
    multi_ball_clear: { id: 'multi_ball_clear', name: 'Juggler', desc: 'Have 5 balls active at once', icon: ICONS.STAR, xp: 75, category: 'skill' },
    no_powerup_win: { id: 'no_powerup_win', name: 'Purist', desc: 'Complete a level without using power-ups', icon: ICONS.TARGET, xp: 125, category: 'skill' },
    one_life: { id: 'one_life', name: 'Living Dangerously', desc: 'Win a level with only 1 life remaining', icon: ICONS.SKULL, xp: 75, category: 'skill' },
    chain_explosion: { id: 'chain_explosion', name: 'Chain Reaction', desc: 'Destroy 5 bricks with one explosion', icon: ICONS.EXPLOSION, xp: 100, category: 'skill' },

    // ===== COLLECTION (10) =====
    powerup_first: { id: 'powerup_first', name: 'Power Up!', desc: 'Collect your first power-up', icon: ICONS.BOLT, xp: 15, category: 'collection' },
    powerup_10: { id: 'powerup_10', name: 'Collector', desc: 'Collect 10 power-ups', icon: ICONS.BOX, xp: 50, category: 'collection' },
    powerup_50: { id: 'powerup_50', name: 'Hoarder', desc: 'Collect 50 power-ups', icon: ICONS.BOX, xp: 100, category: 'collection' },
    powerup_100: { id: 'powerup_100', name: 'Power Addict', desc: 'Collect 100 power-ups', icon: ICONS.DIAMOND, xp: 200, category: 'collection' },
    all_powerups: { id: 'all_powerups', name: 'Full Arsenal', desc: 'Collect every type of power-up', icon: ICONS.STAR, xp: 150, category: 'collection' },
    gold_brick_10: { id: 'gold_brick_10', name: 'Gold Digger', desc: 'Break 10 gold bricks', icon: ICONS.MEDAL, xp: 75, category: 'collection' },
    gold_brick_50: { id: 'gold_brick_50', name: 'Gold Rush', desc: 'Break 50 gold bricks', icon: ICONS.CROWN, xp: 150, category: 'collection' },
    extra_lives_5: { id: 'extra_lives_5', name: 'Life Collector', desc: 'Collect 5 extra life power-ups', icon: ICONS.HEART, xp: 100, category: 'collection' },
    fire_ball_10: { id: 'fire_ball_10', name: 'Pyromaniac', desc: 'Use fire ball 10 times', icon: ICONS.FIRE, xp: 75, category: 'collection' },
    laser_shots_50: { id: 'laser_shots_50', name: 'Trigger Happy', desc: 'Fire 50 laser shots', icon: ICONS.BOLT, xp: 100, category: 'collection' },

    // ===== STORY (10) =====
    world_1_complete: { id: 'world_1_complete', name: 'Neon Escape', desc: 'Complete Neon City', icon: ICONS.GAMEPAD, xp: 200, category: 'story' },
    world_2_complete: { id: 'world_2_complete', name: 'Frozen Victory', desc: 'Complete Crystal Caverns', icon: ICONS.DIAMOND, xp: 250, category: 'story' },
    world_3_complete: { id: 'world_3_complete', name: 'Fire Walker', desc: 'Complete Volcanic Core', icon: ICONS.FIRE, xp: 300, category: 'story' },
    world_4_complete: { id: 'world_4_complete', name: 'Space Captain', desc: 'Complete Space Station', icon: ICONS.STAR, xp: 350, category: 'story' },
    world_5_complete: { id: 'world_5_complete', name: 'Void Conqueror', desc: 'Complete The Void', icon: ICONS.INFINITY, xp: 500, category: 'story' },
    boss_1: { id: 'boss_1', name: 'Glitch Slayer', desc: 'Defeat the Glitch Lord', icon: ICONS.BOSS, xp: 150, category: 'story' },
    boss_2: { id: 'boss_2', name: 'Frost Breaker', desc: 'Defeat the Frost Giant', icon: ICONS.BOSS, xp: 175, category: 'story' },
    boss_3: { id: 'boss_3', name: 'Fire Fighter', desc: 'Defeat the Magma Serpent', icon: ICONS.BOSS, xp: 200, category: 'story' },
    boss_4: { id: 'boss_4', name: 'Machine Breaker', desc: 'Defeat the Mech Guardian', icon: ICONS.BOSS, xp: 225, category: 'story' },
    boss_5: { id: 'boss_5', name: 'Entropy Defier', desc: 'Defeat Entropy', icon: ICONS.BOSS, xp: 300, category: 'story' },

    // ===== SECRET (10) =====
    secret_easter: { id: 'secret_easter', name: 'Easter Egg', desc: 'Find a hidden secret', icon: ICONS.BOX, xp: 100, category: 'secret', hidden: true },
    pacifist: { id: 'pacifist', name: 'Pacifist?', desc: 'Let the ball fall without moving', icon: ICONS.ZEN, xp: 25, category: 'secret', hidden: true },
    night_owl: { id: 'night_owl', name: 'Night Owl', desc: 'Play between midnight and 4am', icon: ICONS.EYE, xp: 50, category: 'secret', hidden: true },
    marathon: { id: 'marathon', name: 'Marathon', desc: 'Play for 2 hours in one session', icon: ICONS.BOLT, xp: 150, category: 'secret', hidden: true },
    all_stars: { id: 'all_stars', name: 'Perfectionist', desc: 'Get 3 stars on all story levels', icon: ICONS.STAR, xp: 500, category: 'secret', hidden: true },
    speed_run: { id: 'speed_run', name: 'Speed Runner', desc: 'Complete all worlds in under 1 hour', icon: ICONS.CLOCK, xp: 300, category: 'secret', hidden: true },
    survivor: { id: 'survivor', name: 'Survivor', desc: 'Reach wave 50 in Endless mode', icon: ICONS.MEDAL, xp: 200, category: 'secret', hidden: true },
    zen_master: { id: 'zen_master', name: 'Zen Master', desc: 'Play Zen mode for 30 minutes', icon: ICONS.ZEN, xp: 75, category: 'secret', hidden: true },
    completionist: { id: 'completionist', name: 'Completionist', desc: 'Unlock all other achievements', icon: ICONS.CROWN, xp: 1000, category: 'secret', hidden: true },
    prestige_master: { id: 'prestige_master', name: 'Prestige Master', desc: 'Reach Prestige level 5', icon: ICONS.DIAMOND, xp: 500, category: 'secret', hidden: true }
};

// Daily Challenge Templates
export const DAILY_CHALLENGE_TYPES = [
    { type: 'break_bricks', desc: 'Break {value} bricks', values: [50, 100, 200] },
    { type: 'collect_powerups', desc: 'Collect {value} power-ups', values: [5, 10, 15] },
    { type: 'score_points', desc: 'Score {value} points', values: [1000, 2500, 5000] },
    { type: 'combo_hits', desc: 'Get a {value}-hit combo', values: [10, 15, 25] },
    { type: 'complete_levels', desc: 'Complete {value} levels', values: [3, 5, 10] },
    { type: 'no_life_loss', desc: 'Complete {value} levels without losing a life', values: [1, 2, 3] },
    { type: 'use_fireball', desc: 'Break {value} bricks with fire ball', values: [10, 25, 50] }
];

// Weekly Challenge Templates
export const WEEKLY_CHALLENGES = [
    { name: 'Brick Crusher', desc: 'Break 500 bricks this week', target: 500, type: 'cumulative_bricks', reward: 300 },
    { name: 'Power Collector', desc: 'Collect 50 power-ups', target: 50, type: 'cumulative_powerups', reward: 250 },
    { name: 'Story Progress', desc: 'Complete 20 story levels', target: 20, type: 'cumulative_levels', reward: 400 },
    { name: 'Combo King', desc: 'Accumulate 200 combo hits', target: 200, type: 'cumulative_combo', reward: 350 },
    { name: 'Boss Hunter', desc: 'Defeat 2 bosses', target: 2, type: 'cumulative_bosses', reward: 500 }
];

// Prestige Levels
export const PRESTIGE_LEVELS = [
    { level: 1, name: 'Bronze', icon: ICONS.MEDAL, requirement: 5000, multiplier: 1.1, color: '#cd7f32' },
    { level: 2, name: 'Silver', icon: ICONS.MEDAL, requirement: 15000, multiplier: 1.25, color: '#c0c0c0' },
    { level: 3, name: 'Gold', icon: ICONS.MEDAL, requirement: 35000, multiplier: 1.5, color: '#ffd700' },
    { level: 4, name: 'Platinum', icon: ICONS.DIAMOND, requirement: 75000, multiplier: 2.0, color: '#e5e4e2' },
    { level: 5, name: 'Diamond', icon: ICONS.DIAMOND, requirement: 150000, multiplier: 3.0, color: '#b9f2ff' },
    { level: 6, name: 'Master', icon: ICONS.CROWN, requirement: 300000, multiplier: 4.0, color: '#ff8c00' },
    { level: 7, name: 'Grandmaster', icon: ICONS.STAR, requirement: 600000, multiplier: 5.0, color: '#ff00ff' },
    { level: 8, name: 'Legend', icon: ICONS.STAR, requirement: 1000000, multiplier: 7.5, color: '#00ffff' },
    { level: 9, name: 'Mythic', icon: ICONS.CROWN, requirement: 2000000, multiplier: 10.0, color: '#ff0000' },
    { level: 10, name: 'Eternal', icon: ICONS.INFINITY, requirement: 5000000, multiplier: 15.0, color: '#ffffff' }
];

/**
 * AchievementSystem class - manages achievements, XP, challenges
 */
export class AchievementSystem {
    constructor(game) {
        this.game = game;
        this.unlockedAchievements = this.loadUnlocked();
        this.progress = this.loadProgress();
        this.xp = this.progress.xp || 0;
        this.level = this.progress.level || 1;
        this.prestigeLevel = this.progress.prestigeLevel || 0;
        this.totalXP = this.progress.totalXP || 0;
        
        // Tracking stats
        this.stats = this.loadStats();
        
        // Daily challenges
        this.dailyChallenges = this.loadDailyChallenges();
        this.weeklyChallenge = this.loadWeeklyChallenge();
        
        // Collected power-up types (for "all powerups" achievement)
        this.collectedPowerupTypes = new Set(this.progress.collectedPowerupTypes || []);
    }
    
    // ===== Persistence =====
    
    loadUnlocked() {
        try {
            const saved = localStorage.getItem('breakout_achievements');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch (e) {
            console.warn('Failed to load achievements from localStorage:', e);
            return new Set();
        }
    }
    
    saveUnlocked() {
        try {
            localStorage.setItem('breakout_achievements', JSON.stringify([...this.unlockedAchievements]));
        } catch (e) {
            console.warn('Failed to save achievements to localStorage:', e);
        }
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem('breakout_achievement_progress');
            return saved ? JSON.parse(saved) : { xp: 0, level: 1, prestigeLevel: 0, totalXP: 0, collectedPowerupTypes: [] };
        } catch (e) {
            console.warn('Failed to load progress from localStorage:', e);
            return { xp: 0, level: 1, prestigeLevel: 0, totalXP: 0, collectedPowerupTypes: [] };
        }
    }
    
    saveProgress() {
        try {
            const progress = {
                xp: this.xp,
                level: this.level,
                prestigeLevel: this.prestigeLevel,
                totalXP: this.totalXP,
                collectedPowerupTypes: [...this.collectedPowerupTypes]
            };
            localStorage.setItem('breakout_achievement_progress', JSON.stringify(progress));
        } catch (e) {
            console.warn('Failed to save progress to localStorage:', e);
        }
    }
    
    loadStats() {
        try {
            const saved = localStorage.getItem('breakout_stats');
            return saved ? JSON.parse(saved) : {
                totalBricksDestroyed: 0,
                totalGamesPlayed: 0,
                totalScore: 0,
                totalPowerupsCollected: 0,
                totalGoldBricks: 0,
                totalLaserShots: 0,
                maxCombo: 0,
                perfectLevels: 0,
                playTime: 0, // seconds
                sessionStart: Date.now()
            };
        } catch (e) {
            console.warn('Failed to load stats from localStorage:', e);
            return {
                totalBricksDestroyed: 0,
                totalGamesPlayed: 0,
                totalScore: 0,
                totalPowerupsCollected: 0,
                totalGoldBricks: 0,
                totalLaserShots: 0,
                maxCombo: 0,
                perfectLevels: 0,
                playTime: 0,
                sessionStart: Date.now()
            };
        }
    }
    
    saveStats() {
        try {
            localStorage.setItem('breakout_stats', JSON.stringify(this.stats));
        } catch (e) {
            console.warn('Failed to save stats to localStorage:', e);
        }
    }
    
    // ===== Achievement Logic =====
    
    tryUnlock(achievementId) {
        if (this.unlockedAchievements.has(achievementId)) return false;
        
        const achievement = ACHIEVEMENTS[achievementId];
        if (!achievement) return false;
        
        this.unlockedAchievements.add(achievementId);
        this.addXP(achievement.xp);
        this.saveUnlocked();
        
        // Sync achievement with HubSDK
        hubSDK.unlockAchievement(achievementId);
        
        this.showAchievementPopup(achievement);
        
        // Check for completionist
        if (this.unlockedAchievements.size === Object.keys(ACHIEVEMENTS).length - 1) {
            this.tryUnlock('completionist');
        }
        
        return true;
    }
    
    checkAchievements() {
        const stats = this.stats;
        
        // Progress achievements
        if (stats.totalBricksDestroyed >= 1) this.tryUnlock('first_brick');
        if (stats.totalBricksDestroyed >= 100) this.tryUnlock('brick_100');
        if (stats.totalBricksDestroyed >= 500) this.tryUnlock('brick_500');
        if (stats.totalBricksDestroyed >= 1000) this.tryUnlock('brick_1000');
        if (stats.totalBricksDestroyed >= 5000) this.tryUnlock('brick_5000');
        
        if (stats.totalGamesPlayed >= 10) this.tryUnlock('games_10');
        if (stats.totalGamesPlayed >= 50) this.tryUnlock('games_50');
        if (stats.totalGamesPlayed >= 100) this.tryUnlock('games_100');
        
        if (stats.totalScore >= 10000) this.tryUnlock('score_10000');
        
        // Collection achievements
        if (stats.totalPowerupsCollected >= 1) this.tryUnlock('powerup_first');
        if (stats.totalPowerupsCollected >= 10) this.tryUnlock('powerup_10');
        if (stats.totalPowerupsCollected >= 50) this.tryUnlock('powerup_50');
        if (stats.totalPowerupsCollected >= 100) this.tryUnlock('powerup_100');
        
        if (stats.totalGoldBricks >= 10) this.tryUnlock('gold_brick_10');
        if (stats.totalGoldBricks >= 50) this.tryUnlock('gold_brick_50');
        
        if (stats.totalLaserShots >= 50) this.tryUnlock('laser_shots_50');
        
        // Combo achievements
        if (stats.maxCombo >= 10) this.tryUnlock('combo_10');
        if (stats.maxCombo >= 25) this.tryUnlock('combo_25');
        if (stats.maxCombo >= 50) this.tryUnlock('combo_50');
        
        // Check all powerups
        if (this.collectedPowerupTypes.size >= 12) {
            this.tryUnlock('all_powerups');
        }
        
        // Secret achievements
        const hour = new Date().getHours();
        if (hour >= 0 && hour < 4) this.tryUnlock('night_owl');
        
        // Marathon achievement
        const sessionTime = (Date.now() - stats.sessionStart) / 1000 / 60; // minutes
        if (sessionTime >= 120) this.tryUnlock('marathon');
    }
    
    // ===== Stat Tracking =====
    
    recordBrickDestroyed(brick) {
        this.stats.totalBricksDestroyed++;
        
        if (brick.typeId === 'GOLD') {
            this.stats.totalGoldBricks++;
        }
        
        this.updateDailyChallenges('break_bricks', 1);
        this.updateWeeklyChallenge('cumulative_bricks', 1);
        this.checkAchievements();
        this.saveStats();
    }
    
    recordPowerupCollected(powerupType) {
        this.stats.totalPowerupsCollected++;
        this.collectedPowerupTypes.add(powerupType);
        
        this.updateDailyChallenges('collect_powerups', 1);
        this.updateWeeklyChallenge('cumulative_powerups', 1);
        this.checkAchievements();
        this.saveStats();
        this.saveProgress();
    }
    
    recordScore(points) {
        this.stats.totalScore += points;
        this.updateDailyChallenges('score_points', points);
        this.checkAchievements();
        this.saveStats();
    }
    
    recordCombo(comboCount) {
        if (comboCount > this.stats.maxCombo) {
            this.stats.maxCombo = comboCount;
        }
        this.updateDailyChallenges('combo_hits', comboCount);
        this.updateWeeklyChallenge('cumulative_combo', 1);
        this.checkAchievements();
        this.saveStats();
    }
    
    recordLevelComplete(wasPerect, worldId = null) {
        if (wasPerect) {
            this.stats.perfectLevels++;
            this.tryUnlock('perfect_level');
            
            if (this.stats.perfectLevels >= 5) {
                this.tryUnlock('no_miss_5');
            }
        }
        
        this.tryUnlock('first_win');
        this.updateDailyChallenges('complete_levels', 1);
        this.updateWeeklyChallenge('cumulative_levels', 1);
        this.saveStats();
    }
    
    recordGamePlayed() {
        this.stats.totalGamesPlayed++;
        this.checkAchievements();
        this.saveStats();
    }
    
    recordBossDefeated(bossIndex) {
        const bossAchievements = ['boss_1', 'boss_2', 'boss_3', 'boss_4', 'boss_5'];
        if (bossIndex >= 0 && bossIndex < bossAchievements.length) {
            this.tryUnlock(bossAchievements[bossIndex]);
        }
        this.updateWeeklyChallenge('cumulative_bosses', 1);
    }
    
    recordWorldComplete(worldIndex) {
        const worldAchievements = ['world_1_complete', 'world_2_complete', 'world_3_complete', 'world_4_complete', 'world_5_complete'];
        if (worldIndex >= 0 && worldIndex < worldAchievements.length) {
            this.tryUnlock(worldAchievements[worldIndex]);
        }
    }
    
    recordLaserShot() {
        this.stats.totalLaserShots++;
        this.saveStats();
        this.checkAchievements();
    }
    
    // ===== XP & Leveling =====
    
    addXP(amount) {
        const multiplier = this.getPrestigeMultiplier();
        const adjustedXP = Math.floor(amount * multiplier);
        
        this.xp += adjustedXP;
        this.totalXP += adjustedXP;
        
        // Check level up
        while (this.xp >= this.getXPForNextLevel()) {
            this.xp -= this.getXPForNextLevel();
            this.level++;
            this.showLevelUpPopup();
        }
        
        this.saveProgress();
    }
    
    getXPForNextLevel() {
        return Math.floor(100 * Math.pow(1.2, this.level - 1));
    }
    
    getPrestigeMultiplier() {
        if (this.prestigeLevel === 0) return 1;
        const prestige = PRESTIGE_LEVELS.find(p => p.level === this.prestigeLevel);
        return prestige ? prestige.multiplier : 1;
    }
    
    canPrestige() {
        const nextPrestige = PRESTIGE_LEVELS.find(p => p.level === this.prestigeLevel + 1);
        return nextPrestige && this.totalXP >= nextPrestige.requirement;
    }
    
    prestige() {
        if (!this.canPrestige()) return false;
        
        this.prestigeLevel++;
        this.level = 1;
        this.xp = 0;
        // totalXP persists
        
        this.saveProgress();
        this.showPrestigePopup();
        
        if (this.prestigeLevel >= 5) {
            this.tryUnlock('prestige_master');
        }
        
        return true;
    }
    
    // ===== Daily Challenges =====
    
    loadDailyChallenges() {
        const saved = localStorage.getItem('breakout_daily_challenges');
        if (saved) {
            const data = JSON.parse(saved);
            // Check if still valid (same day)
            const today = new Date().toDateString();
            if (data.date === today) {
                return data.challenges;
            }
        }
        return this.generateDailyChallenges();
    }
    
    generateDailyChallenges() {
        const challenges = [];
        const usedTypes = new Set();
        
        for (let i = 0; i < 3; i++) {
            let template;
            do {
                template = DAILY_CHALLENGE_TYPES[Math.floor(Math.random() * DAILY_CHALLENGE_TYPES.length)];
            } while (usedTypes.has(template.type));
            
            usedTypes.add(template.type);
            const value = template.values[Math.floor(Math.random() * template.values.length)];
            
            challenges.push({
                type: template.type,
                desc: template.desc.replace('{value}', value),
                target: value,
                progress: 0,
                completed: false,
                reward: 50 + i * 25
            });
        }
        
        // Save
        localStorage.setItem('breakout_daily_challenges', JSON.stringify({
            date: new Date().toDateString(),
            challenges
        }));
        
        return challenges;
    }
    
    updateDailyChallenges(type, amount) {
        for (const challenge of this.dailyChallenges) {
            if (challenge.type === type && !challenge.completed) {
                challenge.progress += amount;
                if (challenge.progress >= challenge.target) {
                    challenge.completed = true;
                    this.addXP(challenge.reward);
                    this.showChallengeCompletePopup('Daily', challenge);
                }
            }
        }
        this.saveDailyChallenges();
    }
    
    saveDailyChallenges() {
        localStorage.setItem('breakout_daily_challenges', JSON.stringify({
            date: new Date().toDateString(),
            challenges: this.dailyChallenges
        }));
    }
    
    // ===== Weekly Challenge =====
    
    loadWeeklyChallenge() {
        const saved = localStorage.getItem('breakout_weekly_challenge');
        if (saved) {
            const data = JSON.parse(saved);
            // Check if still valid (same week)
            const weekNum = this.getWeekNumber();
            if (data.week === weekNum) {
                return data.challenge;
            }
        }
        return this.generateWeeklyChallenge();
    }
    
    getWeekNumber() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now - start;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        return Math.floor(diff / oneWeek);
    }
    
    generateWeeklyChallenge() {
        const template = WEEKLY_CHALLENGES[Math.floor(Math.random() * WEEKLY_CHALLENGES.length)];
        const challenge = {
            ...template,
            progress: 0,
            completed: false
        };
        
        localStorage.setItem('breakout_weekly_challenge', JSON.stringify({
            week: this.getWeekNumber(),
            challenge
        }));
        
        return challenge;
    }
    
    updateWeeklyChallenge(type, amount) {
        if (this.weeklyChallenge.type === type && !this.weeklyChallenge.completed) {
            this.weeklyChallenge.progress += amount;
            if (this.weeklyChallenge.progress >= this.weeklyChallenge.target) {
                this.weeklyChallenge.completed = true;
                this.addXP(this.weeklyChallenge.reward);
                this.showChallengeCompletePopup('Weekly', this.weeklyChallenge);
            }
            this.saveWeeklyChallenge();
        }
    }
    
    saveWeeklyChallenge() {
        localStorage.setItem('breakout_weekly_challenge', JSON.stringify({
            week: this.getWeekNumber(),
            challenge: this.weeklyChallenge
        }));
    }
    
    // ===== UI Popups =====
    
    showAchievementPopup(achievement) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        
        popup.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-text">
                <h4 style="margin:0; color:#ffd700; font-size:0.8rem;">ACHIEVEMENT UNLOCKED</h4>
                <div style="font-size:1.1rem; font-weight:bold; color:#fff;">${achievement.name}</div>
                <div style="font-size:0.9rem; color:#888;">${achievement.desc}</div>
                <div style="font-size:0.8rem; color:#00ff88; margin-top:2px;">+${achievement.xp} XP</div>
            </div>
        `;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 4000);
    }
    
    showLevelUpPopup() {
        const popup = document.createElement('div');
        popup.className = 'level-up-popup';
        
        popup.innerHTML = `
            <div class="level-up-title">Level Up!</div>
            <div style="font-size: 4rem; font-weight: bold; color: #fff; margin: 10px 0;">${this.level}</div>
            <div class="level-up-stats">
                <div class="level-stat">
                    <div class="level-stat-label">Total XP</div>
                    <div class="level-stat-value">${this.totalXP.toLocaleString()}</div>
                </div>
                <div class="level-stat">
                    <div class="level-stat-label">Next Level</div>
                    <div class="level-stat-value">${this.getXPForNextLevel().toLocaleString()}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 3000);
    }
    
    showPrestigePopup() {
        const prestige = PRESTIGE_LEVELS.find(p => p.level === this.prestigeLevel);
        const color = prestige.color;
        
        const popup = document.createElement('div');
        popup.className = 'fullscreen-overlay';
        
        popup.innerHTML = `
            <div class="level-up-popup" style="border-color: ${color}; box-shadow: 0 0 50px ${color}66;">
                <div class="icon" style="width: 64px; height: 64px; margin: 0 auto; color: ${color};">${prestige.icon}</div>
                <div style="color: ${color}; font-size: 2.5rem; font-weight: bold; margin: 15px 0;">
                    PRESTIGE ${this.prestigeLevel}
                </div>
                <div style="color: #fff; font-size: 1.5rem;">${prestige.name}</div>
                <div style="color: #888; font-size: 1.1rem; margin-top: 10px;">
                    XP Multiplier: ${prestige.multiplier}x
                </div>
                <button id="prestige-continue" class="btn" style="
                    margin-top: 20px;
                    background: ${color};
                    color: #000;
                    border: none;
                    text-transform: uppercase;
                ">Continue</button>
            </div>
        `;
        
        document.body.appendChild(popup);
        document.getElementById('prestige-continue').addEventListener('click', () => popup.remove());
    }
    
    showChallengeCompletePopup(type, challenge) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.style.top = 'auto';
        popup.style.bottom = '100px';
        popup.style.left = '50%';
        popup.style.right = 'auto';
        popup.style.transform = 'translateX(-50%)';
        popup.style.borderColor = '#00ccff';
        popup.style.animation = 'slideUp 0.5s ease, fadeOut 0.5s ease 2.5s forwards';
        
        popup.innerHTML = `
            <div style="text-align: center; width: 100%;">
                <div style="color: #00ccff; font-weight: bold; font-size: 1.1rem; text-transform: uppercase;">${type} Challenge Complete!</div>
                <div style="color: #fff; font-size: 1.2rem; margin-top: 5px;">${challenge.name || challenge.desc}</div>
                <div style="color: #00ff88; font-size: 1rem; margin-top: 5px;">+${challenge.reward} XP</div>
            </div>
        `;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 3000);
    }
    
    // ===== Gallery =====
    
    openGallery() {
        const overlay = document.createElement('div');
        overlay.id = 'achievement-gallery';
        overlay.className = 'fullscreen-overlay';
        
        const categories = ['progress', 'skill', 'collection', 'story', 'secret'];
        let html = `
            <div style="width: 100%; max-width: 900px; display: flex; flex-direction: column; height: 90vh;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h1 style="color: #fff; font-family: 'VT323', monospace; font-size: 3rem; text-transform: uppercase; text-shadow: 0 0 10px rgba(0,255,136,0.5);">Achievements</h1>
                    <button id="close-gallery" class="btn btn-ghost">✕ Close</button>
                </div>
                <div style="color: #888; margin-bottom: 20px; font-size: 1.2rem; text-align: center;">
                    ${this.unlockedAchievements.size} / ${Object.keys(ACHIEVEMENTS).length} Unlocked
                </div>
                <div class="grid-select-container" style="flex: 1; padding: 0 20px;">
        `;
        
        for (const category of categories) {
            const achievements = Object.values(ACHIEVEMENTS).filter(a => a.category === category);
            html += `
                <h2 style="color: #00ffff; font-size: 1.5rem; margin: 30px 0 15px; text-transform: uppercase; border-bottom: 1px solid #333; padding-bottom: 5px; width: 100%;">${category}</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; width: 100%;">
            `;
            
            for (const achievement of achievements) {
                const unlocked = this.unlockedAchievements.has(achievement.id);
                const hidden = achievement.hidden && !unlocked;
                
                html += `
                    <div style="
                        background: ${unlocked ? '#0a1a0f' : '#111'};
                        border: 1px solid ${unlocked ? '#00ff88' : '#333'};
                        padding: 15px;
                        opacity: ${unlocked ? 1 : 0.6};
                        font-family: 'VT323', monospace;
                        display: flex;
                        gap: 12px;
                    ">
                        <div class="icon" style="min-width: 24px; color: ${unlocked ? '#00ff88' : '#666'};">${hidden ? ICONS.LOCK : achievement.icon}</div>
                        <div>
                            <div style="color: ${unlocked ? '#fff' : '#888'}; font-size: 1.1rem; font-weight: bold; margin-bottom: 5px;">${hidden ? '???' : achievement.name}</div>
                            <div style="color: #666; font-size: 0.9rem; line-height: 1.2;">${hidden ? 'Hidden achievement' : achievement.desc}</div>
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
        }
        
        html += '</div></div>';
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        
        document.getElementById('close-gallery').addEventListener('click', () => overlay.remove());
    }
    
    // Get progress display for UI
    getProgressDisplay() {
        return {
            level: this.level,
            xp: this.xp,
            xpNeeded: this.getXPForNextLevel(),
            prestigeLevel: this.prestigeLevel,
            prestigeInfo: PRESTIGE_LEVELS.find(p => p.level === this.prestigeLevel),
            achievementsUnlocked: this.unlockedAchievements.size,
            totalAchievements: Object.keys(ACHIEVEMENTS).length,
            dailyChallenges: this.dailyChallenges,
            weeklyChallenge: this.weeklyChallenge
        };
    }
}

// Add CSS animations
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translate(-50%, 100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes scaleIn {
            from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes fadeOut {
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

export default { ACHIEVEMENTS, AchievementSystem, PRESTIGE_LEVELS };
