/**
 * Snake Game - Achievement & Progression System
 * 75 Achievements, gallery, seasonal events, XP/leveling, daily/weekly challenges, prestige
 */

// Extended Achievement Definitions (75 total)
export const ACHIEVEMENTS = {
    // ===== PROGRESS (15) =====
    first_blood: { id: 'first_blood', name: 'First Bite', desc: 'Eat your first food', icon: '🍎', xp: 10, category: 'progress' },
    snake_10: { id: 'snake_10', name: 'Growing', desc: 'Reach length 10', icon: '🐍', xp: 25, category: 'progress' },
    snake_25: { id: 'snake_25', name: 'Long Boi', desc: 'Reach length 25', icon: '🐍', xp: 50, category: 'progress' },
    snake_50: { id: 'snake_50', name: 'Mega Snake', desc: 'Reach length 50', icon: '🐲', xp: 100, category: 'progress' },
    snake_100: { id: 'snake_100', name: 'Legendary', desc: 'Reach length 100', icon: '🌟', xp: 250, category: 'progress' },
    score_100: { id: 'score_100', name: 'Century', desc: 'Score 100 points', icon: '💯', xp: 15, category: 'progress' },
    score_500: { id: 'score_500', name: 'High Scorer', desc: 'Score 500 points', icon: '🏆', xp: 50, category: 'progress' },
    score_1000: { id: 'score_1000', name: 'Thousand Club', desc: 'Score 1,000 points', icon: '🎖️', xp: 100, category: 'progress' },
    score_5000: { id: 'score_5000', name: 'Elite', desc: 'Score 5,000 points', icon: '💎', xp: 200, category: 'progress' },
    score_10000: { id: 'score_10000', name: 'Legendary Score', desc: 'Score 10,000 points', icon: '👑', xp: 500, category: 'progress' },
    games_10: { id: 'games_10', name: 'Getting Started', desc: 'Play 10 games', icon: '🎮', xp: 25, category: 'progress' },
    games_50: { id: 'games_50', name: 'Regular', desc: 'Play 50 games', icon: '🎮', xp: 75, category: 'progress' },
    games_100: { id: 'games_100', name: 'Dedicated', desc: 'Play 100 games', icon: '🎮', xp: 150, category: 'progress' },
    games_500: { id: 'games_500', name: 'Veteran', desc: 'Play 500 games', icon: '🎮', xp: 300, category: 'progress' },
    games_1000: { id: 'games_1000', name: 'Snake Master', desc: 'Play 1,000 games', icon: '🎮', xp: 500, category: 'progress' },
    
    // ===== COMBO (10) =====
    combo_5: { id: 'combo_5', name: 'Combo Starter', desc: 'Get a 5x combo', icon: '🔥', xp: 20, category: 'combo' },
    combo_10: { id: 'combo_10', name: 'Combo Pro', desc: 'Get a 10x combo', icon: '🔥', xp: 50, category: 'combo' },
    combo_20: { id: 'combo_20', name: 'Combo Master', desc: 'Get a 20x combo', icon: '☄️', xp: 100, category: 'combo' },
    combo_30: { id: 'combo_30', name: 'Combo God', desc: 'Get a 30x combo', icon: '⚡', xp: 200, category: 'combo' },
    combo_50: { id: 'combo_50', name: 'Unstoppable', desc: 'Get a 50x combo', icon: '💥', xp: 400, category: 'combo' },
    combo_breaker: { id: 'combo_breaker', name: 'Heartbreak', desc: 'Lose a 20+ combo', icon: '💔', xp: 25, category: 'combo' },
    speed_eater: { id: 'speed_eater', name: 'Speed Eater', desc: 'Eat 5 food in 3 seconds', icon: '⚡', xp: 75, category: 'combo' },
    perfect_run: { id: 'perfect_run', name: 'Perfect Run', desc: 'Complete a level without breaking combo', icon: '✨', xp: 150, category: 'combo' },
    combo_addict: { id: 'combo_addict', name: 'Combo Addict', desc: 'Maintain combo for 30 seconds', icon: '🔥', xp: 100, category: 'combo' },
    combo_legend: { id: 'combo_legend', name: 'Combo Legend', desc: 'Get 100+ total combo in one game', icon: '🌟', xp: 200, category: 'combo' },
    
    // ===== SURVIVAL (10) =====
    survivor_3: { id: 'survivor_3', name: 'Survivor', desc: 'Play for 3 minutes', icon: '⏱️', xp: 50, category: 'survival' },
    survivor_5: { id: 'survivor_5', name: 'Endurance', desc: 'Play for 5 minutes', icon: '⏱️', xp: 75, category: 'survival' },
    survivor_10: { id: 'survivor_10', name: 'Marathon', desc: 'Play for 10 minutes', icon: '🏃', xp: 150, category: 'survival' },
    survivor_30: { id: 'survivor_30', name: 'Iron Snake', desc: 'Play for 30 minutes', icon: '🦾', xp: 300, category: 'survival' },
    close_call: { id: 'close_call', name: 'Close Call', desc: 'Survive using a shield', icon: '🛡️', xp: 25, category: 'survival' },
    near_death: { id: 'near_death', name: 'Near Death', desc: 'Survive at 1 HP', icon: '💀', xp: 50, category: 'survival' },
    untouchable: { id: 'untouchable', name: 'Untouchable', desc: 'Complete level without taking damage', icon: '🌟', xp: 100, category: 'survival' },
    ghost_run: { id: 'ghost_run', name: 'Ghost Run', desc: 'Phase through 20 obstacles', icon: '👻', xp: 75, category: 'survival' },
    dodge_master: { id: 'dodge_master', name: 'Dodge Master', desc: 'Avoid 50 moving obstacles', icon: '🎯', xp: 100, category: 'survival' },
    immortal: { id: 'immortal', name: 'Immortal', desc: 'Survive 3 deaths with extra lives', icon: '♾️', xp: 150, category: 'survival' },
    
    // ===== POWER-UPS (10) =====
    power_hunter: { id: 'power_hunter', name: 'Power Hunter', desc: 'Collect 5 power-ups', icon: '✨', xp: 40, category: 'powerups' },
    power_collector: { id: 'power_collector', name: 'Power Collector', desc: 'Collect 25 power-ups', icon: '✨', xp: 100, category: 'powerups' },
    power_hoarder: { id: 'power_hoarder', name: 'Power Hoarder', desc: 'Collect 100 power-ups', icon: '💫', xp: 200, category: 'powerups' },
    triple_power: { id: 'triple_power', name: 'Triple Power', desc: 'Have 3 power-ups active', icon: '🎰', xp: 75, category: 'powerups' },
    combo_power: { id: 'combo_power', name: 'Power Fusion', desc: 'Activate a power-up combo', icon: '🌈', xp: 100, category: 'powerups' },
    shield_master: { id: 'shield_master', name: 'Shield Master', desc: 'Block 10 hits with shields', icon: '🛡️', xp: 75, category: 'powerups' },
    speed_demon: { id: 'speed_demon', name: 'Speed Demon', desc: 'Use speed 20 times', icon: '⚡', xp: 50, category: 'powerups' },
    freeze_king: { id: 'freeze_king', name: 'Freeze King', desc: 'Freeze time 15 times', icon: '❄️', xp: 75, category: 'powerups' },
    ultimate_user: { id: 'ultimate_user', name: 'Ultimate User', desc: 'Use ultimate 10 times', icon: '💥', xp: 100, category: 'powerups' },
    power_chain: { id: 'power_chain', name: 'Power Chain', desc: 'Use 5 power-ups in a row', icon: '⛓️', xp: 75, category: 'powerups' },
    
    // ===== STORY MODE (10) =====
    world_1: { id: 'world_1', name: 'Garden Clear', desc: 'Complete World 1', icon: '🌿', xp: 100, category: 'story' },
    world_2: { id: 'world_2', name: 'Ice Conqueror', desc: 'Complete World 2', icon: '❄️', xp: 150, category: 'story' },
    world_3: { id: 'world_3', name: 'Volcano Master', desc: 'Complete World 3', icon: '🌋', xp: 200, category: 'story' },
    world_4: { id: 'world_4', name: 'Cyber King', desc: 'Complete World 4', icon: '🤖', xp: 250, category: 'story' },
    world_5: { id: 'world_5', name: 'Void Champion', desc: 'Complete World 5', icon: '🌌', xp: 400, category: 'story' },
    boss_slayer: { id: 'boss_slayer', name: 'Boss Slayer', desc: 'Defeat your first boss', icon: '👹', xp: 100, category: 'story' },
    boss_master: { id: 'boss_master', name: 'Boss Master', desc: 'Defeat all 5 bosses', icon: '🏆', xp: 300, category: 'story' },
    story_complete: { id: 'story_complete', name: 'Story Complete', desc: 'Finish all story levels', icon: '📖', xp: 500, category: 'story' },
    collectible_hunter: { id: 'collectible_hunter', name: 'Collectible Hunter', desc: 'Find 5 collectibles', icon: '🎁', xp: 75, category: 'story' },
    lore_master: { id: 'lore_master', name: 'Lore Master', desc: 'Collect all lore items', icon: '📜', xp: 200, category: 'story' },
    
    // ===== GAME MODES (10) =====
    classic_win: { id: 'classic_win', name: 'Classic Win', desc: 'Beat Classic mode', icon: '🎮', xp: 150, category: 'modes' },
    time_attack: { id: 'time_attack', name: 'Time Warrior', desc: 'Score 300+ in Time Attack', icon: '⏰', xp: 50, category: 'modes' },
    puzzle_solver: { id: 'puzzle_solver', name: 'Puzzle Solver', desc: 'Complete 5 puzzle levels', icon: '🧩', xp: 75, category: 'modes' },
    zen_master: { id: 'zen_master', name: 'Zen Master', desc: 'Play Zen mode for 10 minutes', icon: '🧘', xp: 50, category: 'modes' },
    speedrunner: { id: 'speedrunner', name: 'Speedrunner', desc: 'Set a personal best time', icon: '🏎️', xp: 75, category: 'modes' },
    battle_royale: { id: 'battle_royale', name: 'Last Snake', desc: 'Win a Battle Royale', icon: '👑', xp: 150, category: 'modes' },
    multiplayer_win: { id: 'multiplayer_win', name: 'Multiplayer Champ', desc: 'Win a multiplayer game', icon: '🎮', xp: 100, category: 'modes' },
    custom_creator: { id: 'custom_creator', name: 'Custom Creator', desc: 'Create a custom game', icon: '🎨', xp: 25, category: 'modes' },
    challenge_complete: { id: 'challenge_complete', name: 'Daily Hero', desc: 'Complete a daily challenge', icon: '📅', xp: 50, category: 'modes' },
    weekly_warrior: { id: 'weekly_warrior', name: 'Weekly Warrior', desc: 'Complete 7 daily challenges', icon: '🗓️', xp: 150, category: 'modes' },
    
    // ===== SECRET (10) =====
    secret_finder: { id: 'secret_finder', name: 'Secret Finder', desc: 'Discover a secret area', icon: '🔮', xp: 100, category: 'secret' },
    secret_master: { id: 'secret_master', name: 'Secret Master', desc: 'Find all 5 secret areas', icon: '🔮', xp: 300, category: 'secret' },
    portal_master: { id: 'portal_master', name: 'Portal Master', desc: 'Use portals 50 times', icon: '🌀', xp: 75, category: 'secret' },
    destroyer: { id: 'destroyer', name: 'Destroyer', desc: 'Destroy 100 obstacles', icon: '💥', xp: 100, category: 'secret' },
    skin_collector: { id: 'skin_collector', name: 'Fashionista', desc: 'Unlock 5 skins', icon: '🎨', xp: 100, category: 'secret' },
    rich_snake: { id: 'rich_snake', name: 'Rich Snake', desc: 'Collect 10,000 coins', icon: '💰', xp: 200, category: 'secret' },
    skill_master: { id: 'skill_master', name: 'Skill Master', desc: 'Unlock all skills', icon: '🌟', xp: 500, category: 'secret' },
    true_ending: { id: 'true_ending', name: 'True Ending', desc: 'Discover the true ending', icon: '✨', xp: 1000, category: 'secret' },
    easter_egg: { id: 'easter_egg', name: 'Easter Egg', desc: 'Find the hidden easter egg', icon: '🥚', xp: 100, category: 'secret' },
    completionist: { id: 'completionist', name: 'Completionist', desc: 'Unlock all achievements', icon: '🏅', xp: 2000, category: 'secret' }
};

// Daily Challenge Templates
export const DAILY_CHALLENGE_TYPES = [
    { type: 'score', desc: 'Score {value} points', values: [500, 1000, 2000] },
    { type: 'combo', desc: 'Get a {value}x combo', values: [10, 15, 20] },
    { type: 'length', desc: 'Reach length {value}', values: [20, 30, 50] },
    { type: 'powerups', desc: 'Collect {value} power-ups', values: [5, 10, 15] },
    { type: 'survival', desc: 'Survive for {value} minutes', values: [3, 5, 10] },
    { type: 'no_death', desc: 'Score {value} without dying', values: [300, 500, 1000] },
    { type: 'speed', desc: 'Eat {value} food in 2 minutes', values: [15, 25, 40] },
    { type: 'obstacles', desc: 'Destroy {value} obstacles', values: [10, 20, 30] }
];

// Weekly Challenge Templates
export const WEEKLY_CHALLENGES = [
    { name: 'Score Hunter', desc: 'Score 10,000 total points', target: 10000, type: 'cumulative_score', reward: 500 },
    { name: 'Combo King', desc: 'Get 100 total combo', target: 100, type: 'cumulative_combo', reward: 400 },
    { name: 'Marathon Runner', desc: 'Play for 60 minutes total', target: 3600, type: 'cumulative_time', reward: 600 },
    { name: 'Power Addict', desc: 'Collect 50 power-ups', target: 50, type: 'cumulative_powerups', reward: 450 },
    { name: 'Boss Rush', desc: 'Defeat 3 bosses', target: 3, type: 'cumulative_bosses', reward: 750 }
];

// Prestige System
export const PRESTIGE_LEVELS = [
    { level: 1, name: 'Bronze', icon: '🥉', requirement: 10000, multiplier: 1.1, color: '#cd7f32' },
    { level: 2, name: 'Silver', icon: '🥈', requirement: 25000, multiplier: 1.25, color: '#c0c0c0' },
    { level: 3, name: 'Gold', icon: '🥇', requirement: 50000, multiplier: 1.5, color: '#ffd700' },
    { level: 4, name: 'Platinum', icon: '💎', requirement: 100000, multiplier: 1.75, color: '#e5e4e2' },
    { level: 5, name: 'Diamond', icon: '💠', requirement: 250000, multiplier: 2.0, color: '#b9f2ff' },
    { level: 6, name: 'Master', icon: '👑', requirement: 500000, multiplier: 2.5, color: '#ff4500' },
    { level: 7, name: 'Grandmaster', icon: '🌟', requirement: 1000000, multiplier: 3.0, color: '#ff00ff' },
    { level: 8, name: 'Legend', icon: '🔱', requirement: 2500000, multiplier: 4.0, color: '#00ffff' },
    { level: 9, name: 'Mythic', icon: '⚜️', requirement: 5000000, multiplier: 5.0, color: '#ff0000' },
    { level: 10, name: 'Eternal', icon: '♾️', requirement: 10000000, multiplier: 10.0, color: '#ffffff' }
];

export class AchievementSystem {
    constructor(game) {
        this.game = game;
        this.unlockedAchievements = this.loadUnlocked();
        this.progress = this.loadProgress();
        this.xp = 0;
        this.level = 1;
        this.prestigeLevel = 0;
        
        this.dailyChallenge = this.loadDailyChallenge();
        this.weeklyChallenge = this.loadWeeklyChallenge();
        
        this.loadPlayerData();
    }
    
    loadUnlocked() {
        const saved = localStorage.getItem('snake_achievements_unlocked');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveUnlocked() {
        localStorage.setItem('snake_achievements_unlocked', JSON.stringify(this.unlockedAchievements));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('snake_achievement_progress');
        return saved ? JSON.parse(saved) : {};
    }
    
    saveProgress() {
        localStorage.setItem('snake_achievement_progress', JSON.stringify(this.progress));
    }
    
    loadPlayerData() {
        const saved = localStorage.getItem('snake_player_data');
        if (saved) {
            const data = JSON.parse(saved);
            this.xp = data.xp || 0;
            this.level = data.level || 1;
            this.prestigeLevel = data.prestigeLevel || 0;
        }
    }
    
    savePlayerData() {
        localStorage.setItem('snake_player_data', JSON.stringify({
            xp: this.xp,
            level: this.level,
            prestigeLevel: this.prestigeLevel
        }));
    }
    
    // Check and unlock an achievement
    tryUnlock(achievementId) {
        if (this.unlockedAchievements.includes(achievementId)) return false;
        
        const achievement = ACHIEVEMENTS[achievementId];
        if (!achievement) return false;
        
        this.unlockedAchievements.push(achievementId);
        this.saveUnlocked();
        
        // Award XP
        this.addXP(achievement.xp);
        
        // Show notification
        this.showAchievementPopup(achievement);
        
        // Play sound
        this.game.audio?.playSFX('achievement');
        this.game.audio?.speak(achievementId);
        
        // Update UI stats
        this.game.ui?.updateStats({ achievementsUnlocked: 1 });
        
        // Check for completionist
        if (this.unlockedAchievements.length === Object.keys(ACHIEVEMENTS).length - 1) {
            this.tryUnlock('completionist');
        }
        
        return true;
    }
    
    addXP(amount) {
        const multiplier = this.getPrestigeMultiplier();
        this.xp += Math.floor(amount * multiplier);
        
        // Check for level up
        while (this.xp >= this.getXPForNextLevel()) {
            this.xp -= this.getXPForNextLevel();
            this.level++;
            this.showLevelUpPopup();
        }
        
        this.savePlayerData();
    }
    
    getXPForNextLevel() {
        return Math.floor(100 * Math.pow(1.3, this.level - 1));
    }
    
    getPrestigeMultiplier() {
        if (this.prestigeLevel === 0) return 1;
        const prestige = PRESTIGE_LEVELS[this.prestigeLevel - 1];
        return prestige ? prestige.multiplier : 1;
    }
    
    canPrestige() {
        const totalXP = this.getTotalXP();
        const nextPrestige = PRESTIGE_LEVELS[this.prestigeLevel];
        return nextPrestige && totalXP >= nextPrestige.requirement;
    }
    
    getTotalXP() {
        // Calculate total XP earned across all levels
        let total = this.xp;
        for (let l = 1; l < this.level; l++) {
            total += Math.floor(100 * Math.pow(1.3, l - 1));
        }
        return total;
    }
    
    prestige() {
        if (!this.canPrestige()) return false;
        
        this.prestigeLevel++;
        this.xp = 0;
        this.level = 1;
        
        // Reset some progress but keep achievements
        localStorage.removeItem('snake_stats');
        
        this.savePlayerData();
        this.showPrestigePopup();
        
        return true;
    }
    
    // Daily Challenge
    loadDailyChallenge() {
        const saved = localStorage.getItem('snake_daily_challenge');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.date === new Date().toDateString()) {
                return data;
            }
        }
        return this.generateDailyChallenge();
    }
    
    generateDailyChallenge() {
        const seed = new Date().getDate() + new Date().getMonth() * 31;
        const template = DAILY_CHALLENGE_TYPES[seed % DAILY_CHALLENGE_TYPES.length];
        const difficulty = Math.floor((seed * 7) % 3);
        const value = template.values[difficulty];
        
        const challenge = {
            date: new Date().toDateString(),
            type: template.type,
            desc: template.desc.replace('{value}', value),
            target: value,
            progress: 0,
            completed: false,
            reward: 50 + difficulty * 25
        };
        
        localStorage.setItem('snake_daily_challenge', JSON.stringify(challenge));
        return challenge;
    }
    
    updateDailyProgress(type, amount) {
        if (this.dailyChallenge.completed) return;
        if (this.dailyChallenge.type !== type) return;
        
        this.dailyChallenge.progress += amount;
        
        if (this.dailyChallenge.progress >= this.dailyChallenge.target) {
            this.dailyChallenge.completed = true;
            this.completeDailyChallenge();
        }
        
        localStorage.setItem('snake_daily_challenge', JSON.stringify(this.dailyChallenge));
    }
    
    completeDailyChallenge() {
        this.game.shop?.addCurrency(this.dailyChallenge.reward);
        this.tryUnlock('challenge_complete');
        
        // Track for weekly warrior
        const completedDays = parseInt(localStorage.getItem('snake_weekly_days') || '0') + 1;
        localStorage.setItem('snake_weekly_days', completedDays.toString());
        
        if (completedDays >= 7) {
            this.tryUnlock('weekly_warrior');
            localStorage.setItem('snake_weekly_days', '0');
        }
        
        this.showDailyChallengeComplete();
    }
    
    // Weekly Challenge
    loadWeeklyChallenge() {
        const saved = localStorage.getItem('snake_weekly_challenge');
        if (saved) {
            const data = JSON.parse(saved);
            const weekNumber = this.getWeekNumber();
            if (data.week === weekNumber) {
                return data;
            }
        }
        return this.generateWeeklyChallenge();
    }
    
    getWeekNumber() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now - start;
        return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
    }
    
    generateWeeklyChallenge() {
        const weekNumber = this.getWeekNumber();
        const template = WEEKLY_CHALLENGES[weekNumber % WEEKLY_CHALLENGES.length];
        
        const challenge = {
            week: weekNumber,
            ...template,
            progress: 0,
            completed: false
        };
        
        localStorage.setItem('snake_weekly_challenge', JSON.stringify(challenge));
        return challenge;
    }
    
    updateWeeklyProgress(type, amount) {
        if (this.weeklyChallenge.completed) return;
        if (this.weeklyChallenge.type !== type) return;
        
        this.weeklyChallenge.progress += amount;
        
        if (this.weeklyChallenge.progress >= this.weeklyChallenge.target) {
            this.weeklyChallenge.completed = true;
            this.completeWeeklyChallenge();
        }
        
        localStorage.setItem('snake_weekly_challenge', JSON.stringify(this.weeklyChallenge));
    }
    
    completeWeeklyChallenge() {
        this.game.shop?.addCurrency(this.weeklyChallenge.reward);
        this.showWeeklyChallengeComplete();
    }
    
    // UI Popups
    showAchievementPopup(achievement) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(0,255,136,0.9), rgba(0,100,50,0.9));
            border-radius: 15px;
            padding: 15px 25px;
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 5000;
            animation: slideIn 0.3s ease, slideOut 0.3s ease 2.7s;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
            box-shadow: 0 5px 25px rgba(0,255,136,0.3);
        `;
        popup.innerHTML = `
            <span style="font-size: 2.5em;">${achievement.icon}</span>
            <div>
                <div style="font-weight: bold; font-size: 1.1em;">Achievement Unlocked!</div>
                <div>${achievement.name}</div>
                <div style="font-size: 0.8em; color: rgba(255,255,255,0.7);">+${achievement.xp} XP</div>
            </div>
        `;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 3000);
    }
    
    showLevelUpPopup() {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(100,0,200,0.95), rgba(50,0,100,0.95));
            border: 3px solid #00ff88;
            border-radius: 20px;
            padding: 40px 60px;
            text-align: center;
            z-index: 5000;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
            animation: popIn 0.3s ease;
        `;
        popup.innerHTML = `
            <h1 style="color: #00ff88; margin: 0;">LEVEL UP!</h1>
            <p style="font-size: 3em; margin: 20px 0;">Level ${this.level}</p>
            <p style="color: #888;">XP Multiplier: ${this.getPrestigeMultiplier()}x</p>
        `;
        
        document.body.appendChild(popup);
        this.game.camera?.shake(5, 0.3);
        setTimeout(() => popup.remove(), 2000);
    }
    
    showPrestigePopup() {
        const prestige = PRESTIGE_LEVELS[this.prestigeLevel - 1];
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, ${prestige.color}55, #000);
            border: 3px solid ${prestige.color};
            border-radius: 20px;
            padding: 50px 80px;
            text-align: center;
            z-index: 5000;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
        `;
        popup.innerHTML = `
            <h1 style="color: ${prestige.color}; margin: 0; font-size: 2.5em;">PRESTIGE</h1>
            <p style="font-size: 4em; margin: 20px 0;">${prestige.icon}</p>
            <p style="font-size: 1.5em;">${prestige.name}</p>
            <p style="color: #888;">Points Multiplier: ${prestige.multiplier}x</p>
            <button onclick="this.parentElement.remove()" style="
                margin-top: 20px;
                padding: 15px 40px;
                background: ${prestige.color};
                border: none;
                border-radius: 10px;
                color: #000;
                font-weight: bold;
                cursor: pointer;
            ">Continue</button>
        `;
        
        document.body.appendChild(popup);
        this.game.camera?.shake(10, 1);
    }
    
    showDailyChallengeComplete() {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(255,200,0,0.9), rgba(200,100,0,0.9));
            border-radius: 15px;
            padding: 15px 25px;
            z-index: 5000;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
            animation: slideIn 0.3s ease, slideOut 0.3s ease 2.7s;
        `;
        popup.innerHTML = `
            <div style="font-weight: bold;">📅 Daily Challenge Complete!</div>
            <div>+${this.dailyChallenge.reward} coins</div>
        `;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 3000);
    }
    
    showWeeklyChallengeComplete() {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(200,0,200,0.9), rgba(100,0,150,0.9));
            border-radius: 15px;
            padding: 15px 25px;
            z-index: 5000;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
            animation: slideIn 0.3s ease, slideOut 0.3s ease 2.7s;
        `;
        popup.innerHTML = `
            <div style="font-weight: bold;">🗓️ Weekly Challenge Complete!</div>
            <div>+${this.weeklyChallenge.reward} coins</div>
        `;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 3000);
    }
    
    // Open Achievement Gallery
    openGallery() {
        if (document.getElementById('achievement-gallery')) return;
        
        this.game.togglePause(true);
        
        const gallery = document.createElement('div');
        gallery.id = 'achievement-gallery';
        gallery.className = 'glass-panel';
        gallery.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            padding: 30px;
            z-index: 4000;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
        `;
        
        const categories = ['progress', 'combo', 'survival', 'powerups', 'story', 'modes', 'secret'];
        const categoryNames = {
            progress: '📈 Progress',
            combo: '🔥 Combo',
            survival: '⏱️ Survival',
            powerups: '✨ Power-Ups',
            story: '📖 Story',
            modes: '🎮 Game Modes',
            secret: '🔮 Secret'
        };
        
        let achievementsHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #00ff88;">🏆 Achievement Gallery</h2>
                <div>
                    <span>${this.unlockedAchievements.length}/${Object.keys(ACHIEVEMENTS).length}</span>
                    <button id="close-gallery" class="neu-button" style="margin-left: 15px; padding: 8px 16px;">✕</button>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <div style="padding: 10px 15px; background: rgba(0,255,136,0.2); border-radius: 10px;">
                    <span style="font-size: 1.5em;">⭐</span> Level ${this.level}
                </div>
                <div style="padding: 10px 15px; background: rgba(100,0,200,0.2); border-radius: 10px;">
                    XP: ${this.xp}/${this.getXPForNextLevel()}
                </div>
                ${this.prestigeLevel > 0 ? `
                    <div style="padding: 10px 15px; background: linear-gradient(135deg, ${PRESTIGE_LEVELS[this.prestigeLevel - 1].color}33, transparent); border-radius: 10px;">
                        ${PRESTIGE_LEVELS[this.prestigeLevel - 1].icon} ${PRESTIGE_LEVELS[this.prestigeLevel - 1].name}
                    </div>
                ` : ''}
                ${this.canPrestige() ? `
                    <button id="prestige-btn" class="neu-button neu-button-primary" style="padding: 10px 20px;">
                        🌟 Prestige Available!
                    </button>
                ` : ''}
            </div>
        `;
        
        for (const category of categories) {
            const categoryAchievements = Object.values(ACHIEVEMENTS).filter(a => a.category === category);
            
            achievementsHTML += `
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #888; margin-bottom: 10px;">${categoryNames[category]}</h3>
                    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;">
            `;
            
            for (const achievement of categoryAchievements) {
                const unlocked = this.unlockedAchievements.includes(achievement.id);
                achievementsHTML += `
                    <div class="achievement-card" style="
                        background: ${unlocked ? 'rgba(0,255,136,0.15)' : 'rgba(50,50,50,0.5)'};
                        border: 2px solid ${unlocked ? 'rgba(0,255,136,0.5)' : 'rgba(100,100,100,0.3)'};
                        border-radius: 10px;
                        padding: 15px;
                        text-align: center;
                        opacity: ${unlocked ? 1 : 0.5};
                    " title="${achievement.desc}">
                        <div style="font-size: 2em; filter: ${unlocked ? 'none' : 'grayscale(100%)'};">
                            ${achievement.icon}
                        </div>
                        <div style="font-size: 0.7em; margin-top: 5px; color: ${unlocked ? '#fff' : '#666'};">
                            ${achievement.name}
                        </div>
                        <div style="font-size: 0.6em; color: #00ff88;">
                            ${unlocked ? `+${achievement.xp} XP` : '🔒'}
                        </div>
                    </div>
                `;
            }
            
            achievementsHTML += `</div></div>`;
        }
        
        gallery.innerHTML = achievementsHTML;
        document.body.appendChild(gallery);
        
        document.getElementById('close-gallery').onclick = () => {
            gallery.remove();
            this.game.togglePause(false);
        };
        
        const prestigeBtn = document.getElementById('prestige-btn');
        if (prestigeBtn) {
            prestigeBtn.onclick = () => {
                if (confirm('Prestige? Your stats will reset but you gain a permanent multiplier!')) {
                    this.prestige();
                    gallery.remove();
                    this.game.togglePause(false);
                }
            };
        }
    }
}
