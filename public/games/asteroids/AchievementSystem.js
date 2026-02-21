/**
 * Asteroids - Achievement System
 * 35 achievements, XP/leveling, daily challenges, achievement gallery
 */

// Achievement Definitions (35 total)
import { ICONS } from './AsteroidsIcons.js';

export const ACHIEVEMENTS = {
    // ===== PROGRESS (8) =====
    first_kill: { id: 'first_kill', name: 'First Blood', desc: 'Destroy your first asteroid', icon: ICONS.ASTEROID, xp: 10, category: 'progress' },
    asteroid_50: { id: 'asteroid_50', name: 'Rock Crusher', desc: 'Destroy 50 asteroids', icon: ICONS.ASTEROID, xp: 25, category: 'progress' },
    asteroid_100: { id: 'asteroid_100', name: 'Asteroid Hunter', desc: 'Destroy 100 asteroids', icon: ICONS.ASTEROID, xp: 50, category: 'progress' },
    asteroid_500: { id: 'asteroid_500', name: 'Space Cleaner', desc: 'Destroy 500 asteroids', icon: ICONS.ASTEROID, xp: 100, category: 'progress' },
    asteroid_1000: { id: 'asteroid_1000', name: 'Extinction Event', desc: 'Destroy 1000 asteroids', icon: ICONS.ASTEROID, xp: 200, category: 'progress' },
    wave_5: { id: 'wave_5', name: 'Wave Rider', desc: 'Reach wave 5', icon: ICONS.LEVEL, xp: 30, category: 'progress' },
    wave_10: { id: 'wave_10', name: 'Veteran Pilot', desc: 'Reach wave 10', icon: ICONS.LEVEL, xp: 75, category: 'progress' },
    wave_20: { id: 'wave_20', name: 'Ace Pilot', desc: 'Reach wave 20', icon: ICONS.LEVEL, xp: 150, category: 'progress' },

    // ===== COMBAT (7) =====
    ufo_hunter: { id: 'ufo_hunter', name: 'UFO Hunter', desc: 'Destroy 10 UFOs', icon: ICONS.UFO, xp: 50, category: 'combat' },
    ufo_master: { id: 'ufo_master', name: 'Alien Nemesis', desc: 'Destroy 50 UFOs', icon: ICONS.UFO, xp: 150, category: 'combat' },
    multi_kill: { id: 'multi_kill', name: 'Multi-Kill', desc: 'Destroy 3 asteroids in 1 second', icon: ICONS.TARGET, xp: 40, category: 'combat' },
    chain_reaction: { id: 'chain_reaction', name: 'Chain Reaction', desc: 'Destroy 5 asteroids in 2 seconds', icon: ICONS.TARGET, xp: 75, category: 'combat' },
    sharpshooter: { id: 'sharpshooter', name: 'Sharpshooter', desc: '20 hits without a miss', icon: ICONS.TARGET, xp: 60, category: 'combat' },
    bullet_hell: { id: 'bullet_hell', name: 'Bullet Hell', desc: 'Have 10 bullets on screen', icon: ICONS.WEAPON, xp: 30, category: 'combat' },
    boss_slayer: { id: 'boss_slayer', name: 'Boss Slayer', desc: 'Defeat your first boss', icon: ICONS.SKULL, xp: 100, category: 'combat' },

    // ===== SURVIVAL (6) =====
    survivor_3: { id: 'survivor_3', name: 'Survivor', desc: 'Survive for 3 minutes', icon: ICONS.CLOCK, xp: 30, category: 'survival' },
    survivor_5: { id: 'survivor_5', name: 'Endurance', desc: 'Survive for 5 minutes', icon: ICONS.CLOCK, xp: 60, category: 'survival' },
    survivor_10: { id: 'survivor_10', name: 'Marathon', desc: 'Survive for 10 minutes', icon: ICONS.CLOCK, xp: 120, category: 'survival' },
    close_call: { id: 'close_call', name: 'Close Call', desc: 'Near miss with an asteroid', icon: ICONS.SHIP, xp: 20, category: 'survival' },
    untouchable: { id: 'untouchable', name: 'Untouchable', desc: 'Complete a wave without damage', icon: ICONS.SHIELD, xp: 50, category: 'survival' },
    phoenix: { id: 'phoenix', name: 'Phoenix', desc: 'Die and respawn 5 times in one game', icon: ICONS.HEART, xp: 25, category: 'survival' },

    // ===== POWER-UPS (6) =====
    power_collector: { id: 'power_collector', name: 'Power Collector', desc: 'Collect 20 power-ups', icon: ICONS.POWERUP, xp: 40, category: 'powerups' },
    power_master: { id: 'power_master', name: 'Power Master', desc: 'Collect 100 power-ups', icon: ICONS.POWERUP, xp: 100, category: 'powerups' },
    shield_breaker: { id: 'shield_breaker', name: 'Shield Breaker', desc: 'Block 10 hits with shields', icon: ICONS.SHIELD, xp: 50, category: 'powerups' },
    rapid_destroyer: { id: 'rapid_destroyer', name: 'Rapid Destroyer', desc: 'Destroy 20 asteroids with rapid fire', icon: ICONS.ENGINE, xp: 45, category: 'powerups' },
    missile_master: { id: 'missile_master', name: 'Missile Master', desc: 'Destroy 30 targets with missiles', icon: ICONS.MISSILE, xp: 60, category: 'powerups' },
    bomb_expert: { id: 'bomb_expert', name: 'Bomb Expert', desc: 'Use 10 screen-clearing bombs', icon: ICONS.BOMB, xp: 55, category: 'powerups' },

    // ===== STORY (4) =====
    story_world1: { id: 'story_world1', name: 'Belt Clearer', desc: 'Complete Asteroid Belt', icon: ICONS.TROPHY, xp: 100, category: 'story' },
    story_world3: { id: 'story_world3', name: 'Fire Walker', desc: 'Complete Volcanic Zone', icon: ICONS.TROPHY, xp: 150, category: 'story' },
    story_complete: { id: 'story_complete', name: 'Space Legend', desc: 'Complete all story worlds', icon: ICONS.TROPHY, xp: 500, category: 'story' },
    all_bosses: { id: 'all_bosses', name: 'Boss Master', desc: 'Defeat all 5 bosses', icon: ICONS.SKULL, xp: 300, category: 'story' },

    // ===== SECRET (4) =====
    score_10k: { id: 'score_10k', name: 'High Scorer', desc: 'Score 10,000 points', icon: ICONS.TROPHY, xp: 50, category: 'secret', hidden: true },
    score_50k: { id: 'score_50k', name: 'Score Master', desc: 'Score 50,000 points', icon: ICONS.TROPHY, xp: 150, category: 'secret', hidden: true },
    hyperdrive: { id: 'hyperdrive', name: 'Lucky Jump', desc: 'Survive a hyperspace jump', icon: ICONS.ENGINE, xp: 40, category: 'secret', hidden: true },
    completionist: { id: 'completionist', name: 'Completionist', desc: 'Unlock all achievements', icon: ICONS.STAR, xp: 1000, category: 'secret', hidden: true }
};

// Daily Challenge Templates
export const DAILY_CHALLENGE_TYPES = [
    { type: 'score', desc: 'Score {value} points', values: [5000, 10000, 20000] },
    { type: 'asteroids', desc: 'Destroy {value} asteroids', values: [50, 100, 200] },
    { type: 'wave', desc: 'Reach wave {value}', values: [5, 10, 15] },
    { type: 'survival', desc: 'Survive for {value} minutes', values: [3, 5, 10] },
    { type: 'ufo', desc: 'Destroy {value} UFOs', values: [3, 5, 10] },
    { type: 'powerup', desc: 'Collect {value} power-ups', values: [5, 10, 15] },
    { type: 'accuracy', desc: 'Maintain {value}% accuracy', values: [60, 70, 80] },
    { type: 'no_damage', desc: 'Complete {value} waves without damage', values: [1, 2, 3] }
];

// Weekly Challenge Templates
export const WEEKLY_CHALLENGES = [
    { name: 'Rock Destroyer', desc: 'Destroy 500 asteroids this week', target: 500, type: 'cumulative_asteroids', reward: 500 },
    { name: 'UFO Invasion', desc: 'Destroy 30 UFOs this week', target: 30, type: 'cumulative_ufo', reward: 400 },
    { name: 'Power Hungry', desc: 'Collect 50 power-ups this week', target: 50, type: 'cumulative_powerups', reward: 350 },
    { name: 'Score Champion', desc: 'Accumulate 100,000 points this week', target: 100000, type: 'cumulative_score', reward: 600 },
    { name: 'Survival Expert', desc: 'Survive 30 total minutes this week', target: 30, type: 'cumulative_time', reward: 450 }
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
        this.dailyChallenge = null;
        this.weeklyChallenge = null;
        this.loadPlayerData();
        this.generateDailyChallenge();
        this.generateWeeklyChallenge();
    }

    // Persistence
    loadUnlocked() {
        try {
            return JSON.parse(localStorage.getItem('asteroids_achievements') || '[]');
        } catch { return []; }
    }

    saveUnlocked() {
        localStorage.setItem('asteroids_achievements', JSON.stringify(this.unlockedAchievements));
    }

    loadProgress() {
        try {
            return JSON.parse(localStorage.getItem('asteroids_achievement_progress') || '{}');
        } catch { return {}; }
    }

    saveProgress() {
        localStorage.setItem('asteroids_achievement_progress', JSON.stringify(this.progress));
    }

    loadPlayerData() {
        try {
            const data = JSON.parse(localStorage.getItem('asteroids_player') || '{}');
            this.xp = data.xp || 0;
            this.level = data.level || 1;
        } catch {
            this.xp = 0;
            this.level = 1;
        }
    }

    savePlayerData() {
        localStorage.setItem('asteroids_player', JSON.stringify({
            xp: this.xp,
            level: this.level
        }));
    }

    // Achievement Unlocking
    tryUnlock(achievementId) {
        if (this.unlockedAchievements.includes(achievementId)) return false;
        
        const achievement = ACHIEVEMENTS[achievementId];
        if (!achievement) return false;

        this.unlockedAchievements.push(achievementId);
        this.saveUnlocked();
        this.addXP(achievement.xp);
        this.showAchievementPopup(achievement);
        
        // Check for completionist
        if (this.unlockedAchievements.length === Object.keys(ACHIEVEMENTS).length - 1) {
            this.tryUnlock('completionist');
        }
        
        return true;
    }

    isUnlocked(achievementId) {
        return this.unlockedAchievements.includes(achievementId);
    }

    // Progress Tracking
    incrementProgress(key, amount = 1) {
        if (!this.progress[key]) this.progress[key] = 0;
        this.progress[key] += amount;
        this.saveProgress();
        return this.progress[key];
    }

    getProgress(key) {
        return this.progress[key] || 0;
    }

    // XP & Leveling
    addXP(amount) {
        this.xp += amount;
        const xpNeeded = this.getXPForNextLevel();
        
        if (this.xp >= xpNeeded) {
            this.xp -= xpNeeded;
            this.level++;
            this.showLevelUpPopup();
        }
        
        this.savePlayerData();
    }

    getXPForNextLevel() {
        return Math.floor(100 * Math.pow(1.5, this.level - 1));
    }

    getXPProgress() {
        return (this.xp / this.getXPForNextLevel()) * 100;
    }

    getUnlockedCount() {
        return this.unlockedAchievements.length;
    }

    getTotalCount() {
        return Object.keys(ACHIEVEMENTS).length;
    }

    getLevel() {
        return this.level;
    }

    getXP() {
        return this.xp;
    }

    // Daily Challenge
    generateDailyChallenge() {
        const today = new Date().toDateString();
        const saved = localStorage.getItem('asteroids_daily');
        
        if (saved) {
            const data = JSON.parse(saved);
            if (data.date === today) {
                this.dailyChallenge = data.challenge;
                return;
            }
        }

        // Generate new challenge based on date seed
        const seed = this.hashCode(today);
        const typeIndex = Math.abs(seed) % DAILY_CHALLENGE_TYPES.length;
        const template = DAILY_CHALLENGE_TYPES[typeIndex];
        const valueIndex = Math.abs(seed >> 8) % template.values.length;
        const value = template.values[valueIndex];

        this.dailyChallenge = {
            type: template.type,
            desc: template.desc.replace('{value}', value),
            target: value,
            progress: 0,
            completed: false,
            reward: value * 5 // XP reward
        };

        localStorage.setItem('asteroids_daily', JSON.stringify({
            date: today,
            challenge: this.dailyChallenge
        }));
    }

    generateWeeklyChallenge() {
        const weekNum = this.getWeekNumber();
        const saved = localStorage.getItem('asteroids_weekly');

        if (saved) {
            const data = JSON.parse(saved);
            if (data.week === weekNum) {
                this.weeklyChallenge = data.challenge;
                return;
            }
        }

        const index = weekNum % WEEKLY_CHALLENGES.length;
        this.weeklyChallenge = { ...WEEKLY_CHALLENGES[index], progress: 0, completed: false };
        
        localStorage.setItem('asteroids_weekly', JSON.stringify({
            week: weekNum,
            challenge: this.weeklyChallenge
        }));
    }

    updateDailyProgress(type, amount) {
        if (!this.dailyChallenge || this.dailyChallenge.completed) return;
        if (this.dailyChallenge.type !== type) return;

        this.dailyChallenge.progress += amount;
        if (this.dailyChallenge.progress >= this.dailyChallenge.target) {
            this.dailyChallenge.completed = true;
            this.addXP(this.dailyChallenge.reward);
            this.showDailyChallengeComplete();
        }

        localStorage.setItem('asteroids_daily', JSON.stringify({
            date: new Date().toDateString(),
            challenge: this.dailyChallenge
        }));
    }

    updateWeeklyProgress(type, amount) {
        if (!this.weeklyChallenge || this.weeklyChallenge.completed) return;
        if (this.weeklyChallenge.type !== type) return;

        this.weeklyChallenge.progress += amount;
        if (this.weeklyChallenge.progress >= this.weeklyChallenge.target) {
            this.weeklyChallenge.completed = true;
            this.addXP(this.weeklyChallenge.reward);
            this.showWeeklyChallengeComplete();
        }

        localStorage.setItem('asteroids_weekly', JSON.stringify({
            week: this.getWeekNumber(),
            challenge: this.weeklyChallenge
        }));
    }

    // Utilities
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }

    getWeekNumber() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now - start;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        return Math.floor(diff / oneWeek);
    }

    // UI Popups
    showAchievementPopup(achievement) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-title">Achievement Unlocked!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.desc}</div>
                <div class="achievement-xp">+${achievement.xp} XP</div>
            </div>
        `;
        document.body.appendChild(popup);
        
        setTimeout(() => popup.classList.add('show'), 10);
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 500);
        }, 4000);
    }

    showLevelUpPopup() {
        const popup = document.createElement('div');
        popup.className = 'level-popup';
        popup.innerHTML = `
            <div class="level-icon">${ICONS.STAR}</div>
            <div class="level-text">LEVEL UP!</div>
            <div class="level-number">Level ${this.level}</div>
        `;
        document.body.appendChild(popup);
        
        setTimeout(() => popup.classList.add('show'), 10);
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 500);
        }, 3000);
    }

    showDailyChallengeComplete() {
        const popup = document.createElement('div');
        popup.className = 'challenge-popup daily';
        popup.innerHTML = `
            <div class="challenge-icon">${ICONS.CALENDAR}</div>
            <div class="challenge-text">Daily Challenge Complete!</div>
            <div class="challenge-reward">+${this.dailyChallenge.reward} XP</div>
        `;
        document.body.appendChild(popup);
        
        setTimeout(() => popup.classList.add('show'), 10);
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 500);
        }, 3500);
    }

    showWeeklyChallengeComplete() {
        const popup = document.createElement('div');
        popup.className = 'challenge-popup weekly';
        popup.innerHTML = `
            <div class="challenge-icon">${ICONS.CALENDAR}</div>
            <div class="challenge-text">Weekly Challenge Complete!</div>
            <div class="challenge-reward">+${this.weeklyChallenge.reward} XP</div>
        `;
        document.body.appendChild(popup);
        
        setTimeout(() => popup.classList.add('show'), 10);
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 500);
        }, 3500);
    }

    // Achievement Gallery
    openGallery() {
        const overlay = document.createElement('div');
        overlay.className = 'achievement-gallery-overlay';
        
        const categories = ['progress', 'combat', 'survival', 'powerups', 'story', 'secret'];
        const categoryNames = {
            progress: 'Progress',
            combat: 'Combat',
            survival: 'Survival',
            powerups: 'Power-Ups',
            story: 'Story',
            secret: 'Secret'
        };

        let galleryHTML = `
            <div class="achievement-gallery">
                <div class="gallery-header">
                    <h2>🏆 Achievement Gallery</h2>
                    <div class="gallery-stats">
                        <span>${this.unlockedAchievements.length}/${Object.keys(ACHIEVEMENTS).length} Unlocked</span>
                        <span>Level ${this.level}</span>
                        <span>${this.xp}/${this.getXPForNextLevel()} XP</span>
                    </div>
                    <button class="gallery-close">✕</button>
                </div>
                <div class="gallery-content">
        `;

        for (const category of categories) {
            const achievements = Object.values(ACHIEVEMENTS).filter(a => a.category === category);
            galleryHTML += `
                <div class="gallery-category">
                    <h3>${categoryNames[category]}</h3>
                    <div class="gallery-grid">
            `;
            
            for (const achievement of achievements) {
                const unlocked = this.isUnlocked(achievement.id);
                const hidden = achievement.hidden && !unlocked;
                
                galleryHTML += `
                    <div class="gallery-item ${unlocked ? 'unlocked' : ''} ${hidden ? 'hidden' : ''}">
                        <div class="gallery-item-icon">${hidden ? '?' : achievement.icon}</div>
                        <div class="gallery-item-name">${hidden ? '???' : achievement.name}</div>
                        <div class="gallery-item-desc">${hidden ? 'Hidden achievement' : achievement.desc}</div>
                        ${unlocked ? `<div class="gallery-item-xp">+${achievement.xp} XP</div>` : ''}
                    </div>
                `;
            }
            
            galleryHTML += '</div></div>';
        }

        galleryHTML += '</div></div>';
        overlay.innerHTML = galleryHTML;
        document.body.appendChild(overlay);

        overlay.querySelector('.gallery-close').onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    // Stats Summary
    getStats() {
        return {
            totalAchievements: Object.keys(ACHIEVEMENTS).length,
            unlockedCount: this.unlockedAchievements.length,
            level: this.level,
            xp: this.xp,
            xpProgress: this.getXPProgress(),
            dailyChallenge: this.dailyChallenge,
            weeklyChallenge: this.weeklyChallenge,
            progress: this.progress
        };
    }
}
