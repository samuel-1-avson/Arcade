/**
 * Tower Defense - Achievement & Progression System
 * 30+ achievements, XP/leveling, achievement gallery
 */

// SVG Icon templates for achievements
const ACH_ICONS = {
    tower: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21V7l8-4 8 4v14"/><path d="M4 10h16"/><rect x="8" y="14" width="3" height="7"/><rect x="13" y="14" width="3" height="7"/></svg>',
    builder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20M4 20V9l8-4 8 4v11"/><path d="M9 20v-6h6v6"/></svg>',
    skull: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="10" r="8"/><path d="M12 18v4M8 22h8"/><circle cx="9" cy="10" r="2"/><circle cx="15" cy="10" r="2"/></svg>',
    gold: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10h8M8 14h8" stroke="#000" stroke-width="1.5"/></svg>',
    wave: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M2 7c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    crown: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 8l2 12h12l2-12L12 2z"/></svg>',
    lightning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    recycle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="M14 16l-3 3 3 3"/><path d="M8.293 13.596 4.875 7.5l4.238-2"/><path d="M2.165 14.805 5.585 8.71"/><path d="m17 6 4.166 7.205-4 2.307"/></svg>',
    rainbow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 17a10 10 0 0 0-20 0"/><path d="M6 17a6 6 0 0 1 12 0"/><path d="M10 17a2 2 0 0 1 4 0"/></svg>',
    lightbulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5"/></svg>',
    explosion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>',
    sword: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m14.5 12.5-5 5"/><path d="M18 8l3-3"/><path d="M17.5 1.5l5 5"/><path d="m2 21 6.5-6.5"/><path d="m9.5 4.5 5 5"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 22V8a2 2 0 0 1 2-2 2 2 0 0 1 2 2v14"/><path d="M8 6h8"/><path d="M8 9h8"/></svg>',
    crossswords: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 12.5L5 22"/><path d="M19.5 4.5l-5 5"/><path d="M5 2l5 5"/><path d="M19 22l-5-5"/></svg>',
    timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    infinity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/></svg>',
    fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    medal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
    brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.54"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.54"/></svg>',
    boss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
    magic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 4-2.586 2.586a2 2 0 0 0-.586 1.414v.586a2 2 0 0 1-2 2H9"/><path d="M4 15l2.586-2.586a2 2 0 0 1 1.414-.586h.586a2 2 0 0 0 2-2V9"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/></svg>'
};

// Achievement Definitions (35 total across 6 categories)
export const ACHIEVEMENTS = {
    // ===== PROGRESS (10) =====
    first_tower: { 
        id: 'first_tower', 
        name: 'First Defense', 
        desc: 'Place your first tower', 
        iconSvg: ACH_ICONS.tower, 
        xp: 10, 
        category: 'progress' 
    },
    tower_10: { 
        id: 'tower_10', 
        name: 'Builder', 
        desc: 'Place 10 towers in one game', 
        iconSvg: ACH_ICONS.builder, 
        xp: 30, 
        category: 'progress' 
    },
    tower_25: { 
        id: 'tower_25', 
        name: 'Master Builder', 
        desc: 'Place 25 towers in one game', 
        iconSvg: ACH_ICONS.builder, 
        xp: 75, 
        category: 'progress' 
    },
    kills_100: { 
        id: 'kills_100', 
        name: 'Pest Control', 
        desc: 'Kill 100 enemies', 
        iconSvg: ACH_ICONS.skull, 
        xp: 50, 
        category: 'progress' 
    },
    kills_500: { 
        id: 'kills_500', 
        name: 'Exterminator', 
        desc: 'Kill 500 enemies', 
        iconSvg: ACH_ICONS.skull, 
        xp: 150, 
        category: 'progress' 
    },
    kills_1000: { 
        id: 'kills_1000', 
        name: 'Grim Reaper', 
        desc: 'Kill 1,000 enemies', 
        iconSvg: ACH_ICONS.skull, 
        xp: 300, 
        category: 'progress' 
    },
    gold_10000: { 
        id: 'gold_10000', 
        name: 'Rich Defender', 
        desc: 'Earn 10,000 total gold', 
        iconSvg: ACH_ICONS.gold, 
        xp: 100, 
        category: 'progress' 
    },
    waves_10: { 
        id: 'waves_10', 
        name: 'Wave Warrior', 
        desc: 'Complete 10 waves', 
        iconSvg: ACH_ICONS.wave, 
        xp: 40, 
        category: 'progress' 
    },
    waves_50: { 
        id: 'waves_50', 
        name: 'Wave Master', 
        desc: 'Complete 50 waves', 
        iconSvg: ACH_ICONS.wave, 
        xp: 100, 
        category: 'progress' 
    },
    all_levels: { 
        id: 'all_levels', 
        name: 'Story Complete', 
        desc: 'Complete all 15 story levels', 
        iconSvg: ACH_ICONS.book, 
        xp: 500, 
        category: 'progress' 
    },

    // ===== DEFENSE (6) =====
    perfect_wave: { 
        id: 'perfect_wave', 
        name: 'Perfect Defense', 
        desc: 'Complete a wave without losing any lives', 
        iconSvg: ACH_ICONS.sparkles, 
        xp: 50, 
        category: 'defense' 
    },
    no_damage: { 
        id: 'no_damage', 
        name: 'Impenetrable', 
        desc: 'Complete a level without losing any lives', 
        iconSvg: ACH_ICONS.shield, 
        xp: 100, 
        category: 'defense' 
    },
    last_stand: { 
        id: 'last_stand', 
        name: 'Last Stand', 
        desc: 'Win a level with only 1 life remaining', 
        iconSvg: ACH_ICONS.heart, 
        xp: 75, 
        category: 'defense' 
    },
    perfect_level: { 
        id: 'perfect_level', 
        name: 'Flawless Victory', 
        desc: 'Get 3 stars on a level', 
        iconSvg: ACH_ICONS.star, 
        xp: 60, 
        category: 'defense' 
    },
    all_stars: { 
        id: 'all_stars', 
        name: 'Perfectionist', 
        desc: 'Get 3 stars on all story levels', 
        iconSvg: ACH_ICONS.star, 
        xp: 400, 
        category: 'defense' 
    },
    comeback: { 
        id: 'comeback', 
        name: 'Comeback King', 
        desc: 'Win after being reduced to 1-3 lives', 
        iconSvg: ACH_ICONS.crown, 
        xp: 80, 
        category: 'defense' 
    },

    // ===== STRATEGY (6) =====
    upgrade_max: { 
        id: 'upgrade_max', 
        name: 'Maximum Power', 
        desc: 'Upgrade a tower to level 5', 
        iconSvg: ACH_ICONS.lightning, 
        xp: 50, 
        category: 'strategy' 
    },
    sell_10: { 
        id: 'sell_10', 
        name: 'Recycler', 
        desc: 'Sell 10 towers', 
        iconSvg: ACH_ICONS.recycle, 
        xp: 30, 
        category: 'strategy' 
    },
    tower_synergy: { 
        id: 'tower_synergy', 
        name: 'Synergy Master', 
        desc: 'Have 3 different tower types active', 
        iconSvg: ACH_ICONS.rainbow, 
        xp: 60, 
        category: 'strategy' 
    },
    all_tower_types: { 
        id: 'all_tower_types', 
        name: 'Tower Collector', 
        desc: 'Use all 7 tower types in one game', 
        iconSvg: ACH_ICONS.tower, 
        xp: 100, 
        category: 'strategy' 
    },
    efficient: { 
        id: 'efficient', 
        name: 'Efficient Defense', 
        desc: 'Win with less than 10 towers placed', 
        iconSvg: ACH_ICONS.lightbulb, 
        xp: 75, 
        category: 'strategy' 
    },
    overkill: { 
        id: 'overkill', 
        name: 'Overkill', 
        desc: 'Have 30+ towers in one game', 
        iconSvg: ACH_ICONS.explosion, 
        xp: 80, 
        category: 'strategy' 
    },

    // ===== BOSS (5) =====
    first_boss: { 
        id: 'first_boss', 
        name: 'Boss Slayer', 
        desc: 'Defeat your first boss', 
        iconSvg: ACH_ICONS.sword, 
        xp: 100, 
        category: 'boss' 
    },
    all_bosses: { 
        id: 'all_bosses', 
        name: 'Boss Hunter', 
        desc: 'Defeat all 5 chapter bosses', 
        iconSvg: ACH_ICONS.trophy, 
        xp: 300, 
        category: 'boss' 
    },
    boss_no_damage: { 
        id: 'boss_no_damage', 
        name: 'Perfect Boss Fight', 
        desc: 'Defeat a boss without losing lives', 
        iconSvg: ACH_ICONS.crossswords, 
        xp: 150, 
        category: 'boss' 
    },
    final_boss: { 
        id: 'final_boss', 
        name: 'World Savior', 
        desc: 'Defeat the final boss', 
        iconSvg: ACH_ICONS.crown, 
        xp: 400, 
        category: 'boss' 
    },
    boss_speed: { 
        id: 'boss_speed', 
        name: 'Speed Demon', 
        desc: 'Defeat a boss in under 3 minutes', 
        iconSvg: ACH_ICONS.timer, 
        xp: 120, 
        category: 'boss' 
    },

    // ===== SPEED (3) =====
    speedrun_3min: { 
        id: 'speedrun_3min', 
        name: 'Quick Draw', 
        desc: 'Complete a level in under 3 minutes', 
        iconSvg: ACH_ICONS.lightning, 
        xp: 60, 
        category: 'speed' 
    },
    speedrun_2min: { 
        id: 'speedrun_2min', 
        name: 'Lightning Fast', 
        desc: 'Complete a level in under 2 minutes', 
        iconSvg: ACH_ICONS.lightning, 
        xp: 100, 
        category: 'speed' 
    },
    endless_wave_20: { 
        id: 'endless_wave_20', 
        name: 'Endurance Runner', 
        desc: 'Reach wave 20 in Endless mode', 
        iconSvg: ACH_ICONS.infinity, 
        xp: 150, 
        category: 'speed' 
    },

    // ===== SECRET (5) =====
    all_tower_upgrade: { 
        id: 'all_tower_upgrade', 
        name: 'Full Arsenal', 
        desc: 'Have all tower types at max level', 
        iconSvg: ACH_ICONS.fire, 
        xp: 200, 
        category: 'secret' 
    },
    ability_master: { 
        id: 'ability_master', 
        name: 'Ability Master', 
        desc: 'Use all 3 hero abilities in one level', 
        iconSvg: ACH_ICONS.sparkles, 
        xp: 80, 
        category: 'secret' 
    },
    no_sell: { 
        id: 'no_sell', 
        name: 'No Refunds', 
        desc: 'Win without selling any towers', 
        iconSvg: ACH_ICONS.lock, 
        xp: 100, 
        category: 'secret' 
    },
    genocide: { 
        id: 'genocide', 
        name: 'Genocide', 
        desc: 'Kill 100 enemies in one wave', 
        iconSvg: ACH_ICONS.skull, 
        xp: 150, 
        category: 'secret' 
    },
    completionist: { 
        id: 'completionist', 
        name: 'Completionist', 
        desc: 'Unlock all achievements', 
        iconSvg: ACH_ICONS.medal, 
        xp: 1000, 
        category: 'secret' 
    }
};

export class AchievementSystem {
    constructor(game) {
        this.game = game;
        this.unlockedAchievements = this.loadUnlocked();
        this.progress = this.loadProgress();
        this.xp = 0;
        this.level = 1;
        
        this.loadPlayerData();
    }
    
    loadUnlocked() {
        try {
            const saved = localStorage.getItem('towerdefense_achievements_unlocked');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Failed to load unlocked achievements:', e);
            return [];
        }
    }
    
    saveUnlocked() {
        try {
            localStorage.setItem('towerdefense_achievements_unlocked', JSON.stringify(this.unlockedAchievements));
        } catch (e) {
            console.warn('Failed to save unlocked achievements:', e);
        }
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem('towerdefense_achievement_progress');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn('Failed to load achievement progress:', e);
            return {};
        }
    }
    
    saveProgress() {
        try {
            localStorage.setItem('towerdefense_achievement_progress', JSON.stringify(this.progress));
        } catch (e) {
            console.warn('Failed to save achievement progress:', e);
        }
    }
    
    loadPlayerData() {
        try {
            const saved = localStorage.getItem('towerdefense_player_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.xp = data.xp || 0;
                this.level = data.level || 1;
            }
        } catch (e) {
            console.warn('Failed to load player data:', e);
        }
    }
    
    savePlayerData() {
        try {
            localStorage.setItem('towerdefense_player_data', JSON.stringify({
                xp: this.xp,
                level: this.level
            }));
        } catch (e) {
            console.warn('Failed to save player data:', e);
        }
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
        
        // SDK: Report unlock
        if (this.game.hubSDK) {
            this.game.hubSDK.unlockAchievement(achievementId);
        }
        
        // Check for completionist
        if (this.unlockedAchievements.length === Object.keys(ACHIEVEMENTS).length - 1) {
            setTimeout(() => this.tryUnlock('completionist'), 500);
        }
        
        return true;
    }
    
    addXP(amount) {
        this.xp += amount;
        
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
    
    // Track progress for incremental achievements
    incrementProgress(key, amount = 1) {
        if (!this.progress[key]) {
            this.progress[key] = 0;
        }
        this.progress[key] += amount;
        this.saveProgress();
        
        // Check related achievements
        this.checkProgressAchievements(key);
    }
    
    checkProgressAchievements(key) {
        const thresholds = {
            'total_kills': [
                { count: 100, achievement: 'kills_100' },
                { count: 500, achievement: 'kills_500' },
                { count: 1000, achievement: 'kills_1000' }
            ],
            'total_waves': [
                { count: 10, achievement: 'waves_10' },
                { count: 50, achievement: 'waves_50' }
            ],
            'total_gold': [
                { count: 10000, achievement: 'gold_10000' }
            ],
            'towers_placed': [
                { count: 10, achievement: 'tower_10' },
                { count: 25, achievement: 'tower_25' }
            ],
            'towers_sold': [
                { count: 10, achievement: 'sell_10' }
            ]
        };
        
        if (thresholds[key]) {
            for (const { count, achievement } of thresholds[key]) {
                if (this.progress[key] >= count) {
                    this.tryUnlock(achievement);
                }
            }
        }
    }
    
    // UI Popups
    showAchievementPopup(achievement) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #141414;
            border: 2px solid #ff4d00;
            border-radius: 2px;
            padding: 15px 25px;
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 5000;
            animation: slideIn 0.3s ease, slideOut 0.3s ease 2.7s;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
            box-shadow: 4px 4px 0px rgba(0,0,0,0.5);
        `;
        popup.innerHTML = `
            <span style="font-size: 2.5em; color: #ff4d00;">${achievement.iconSvg}</span>
            <div>
                <div style="font-weight: bold; font-size: 1.1em; color: #ff4d00;">Achievement Unlocked!</div>
                <div>${achievement.name}</div>
                <div style="font-size: 0.8em; color: #555;">+${achievement.xp} XP</div>
            </div>
        `;
        
        // Add animation keyframes if not already present
        if (!document.getElementById('achievement-animations')) {
            const style = document.createElement('style');
            style.id = 'achievement-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 3000);
    }
    
    showLevelUpPopup() {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            background: #0a0a0a;
            border: 2px solid #00bcd4;
            border-radius: 2px;
            padding: 40px 60px;
            text-align: center;
            z-index: 5001;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
            animation: popIn 0.3s ease forwards;
            box-shadow: 6px 6px 0px rgba(0,0,0,0.5);
        `;
        popup.innerHTML = `
            <h1 style="color: #00bcd4; margin: 0;">LEVEL UP!</h1>
            <p style="font-size: 3em; margin: 20px 0;">Level ${this.level}</p>
            <p style="color: #555;">Next Level: ${this.getXPForNextLevel()} XP</p>
        `;
        
        // Add pop animation
        if (!document.getElementById('popup-animations')) {
            const style = document.createElement('style');
            style.id = 'popup-animations';
            style.textContent = `
                @keyframes popIn {
                    0% { transform: translate(-50%, -50%) scale(0); }
                    50% { transform: translate(-50%, -50%) scale(1.1); }
                    100% { transform: translate(-50%, -50%) scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 2000);
    }
    
    // Open Achievement Gallery
    openGallery() {
        if (document.getElementById('achievement-gallery')) return;
        
        const gallery = document.createElement('div');
        gallery.id = 'achievement-gallery';
        gallery.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 900px;
            max-height: 85vh;
            overflow-y: auto;
            background: #0a0a0a;
            border: 2px solid #ff4d00;
            border-radius: 2px;
            padding: 30px;
            z-index: 4000;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
            box-shadow: 6px 6px 0px rgba(0,0,0,0.5);
        `;
        
        const categories = ['progress', 'defense', 'strategy', 'boss', 'speed', 'secret'];
        const categoryIcons = {
            progress: ACH_ICONS.chart,
            defense: ACH_ICONS.shield,
            strategy: ACH_ICONS.brain,
            boss: ACH_ICONS.boss,
            speed: ACH_ICONS.lightning,
            secret: ACH_ICONS.magic
        };
        const categoryNames = {
            progress: 'Progress',
            defense: 'Defense',
            strategy: 'Strategy',
            boss: 'Boss Battles',
            speed: 'Speed',
            secret: 'Secret'
        };
        
        let achievementsHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #ff4d00; display: flex; align-items: center; gap: 12px;">
                    <span style="width: 32px; height: 32px;">${ACH_ICONS.trophy}</span>
                    Achievement Gallery
                </h2>
                <div>
                    <span style="font-size: 1.2em; color: #00bcd4;">${this.unlockedAchievements.length}/${Object.keys(ACHIEVEMENTS).length}</span>
                    <button id="close-gallery" style="
                        margin-left: 15px;
                        padding: 8px 16px;
                        background: transparent;
                        border: 2px solid #ff4d00;
                        border-radius: 2px;
                        color: #ff4d00;
                        cursor: pointer;
                        font-family: 'Orbitron', sans-serif;
                    ">X Close</button>
                </div>
            </div>
            
            <div style="display: flex; gap: 15px; margin-bottom: 25px;">
                <div style="padding: 12px 20px; background: #141414; border: 2px solid #ff4d00; border-radius: 2px; display: flex; align-items: center; gap: 10px;">
                    <span style="width: 24px; height: 24px; color: #ffc107;">${ACH_ICONS.star}</span> Level ${this.level}
                </div>
                <div style="padding: 12px 20px; background: #141414; border: 2px solid #00bcd4; border-radius: 2px;">
                    XP: ${this.xp}/${this.getXPForNextLevel()}
                </div>
            </div>
        `;
        
        for (const category of categories) {
            const categoryAchievements = Object.values(ACHIEVEMENTS).filter(a => a.category === category);
            
            achievementsHTML += `
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #ff4d00; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 8px; display: flex; align-items: center; gap: 10px;">
                        <span style="width: 20px; height: 20px;">${categoryIcons[category]}</span>
                        ${categoryNames[category]}
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px;">
            `;
            
            for (const achievement of categoryAchievements) {
                const unlocked = this.unlockedAchievements.includes(achievement.id);
                achievementsHTML += `
                    <div style="
                        background: ${unlocked ? '#1a1a1a' : '#0d0d0d'};
                        border: 2px solid ${unlocked ? '#ff4d00' : '#333'};
                        border-radius: 2px;
                        padding: 15px;
                        text-align: center;
                        opacity: ${unlocked ? 1 : 0.5};
                    " title="${achievement.desc}">
                        <div style="font-size: 2em; color: ${unlocked ? '#ff4d00' : '#555'}; width: 48px; height: 48px; margin: 0 auto;">
                            ${achievement.iconSvg}
                        </div>
                        <div style="font-size: 0.75em; margin-top: 8px; font-weight: bold; color: ${unlocked ? '#fff' : '#555'};">
                            ${achievement.name}
                        </div>
                        <div style="font-size: 0.65em; color: #666; margin-top: 4px;">
                            ${achievement.desc}
                        </div>
                        <div style="font-size: 0.7em; color: ${unlocked ? '#00bcd4' : '#333'}; margin-top: 6px;">
                            ${unlocked ? `+${achievement.xp} XP` : `<span style="display: flex; align-items: center; justify-content: center; gap: 4px;"><span style="width: 12px; height: 12px;">${ACH_ICONS.lock}</span> Locked</span>`}
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
        };
        
        // Close on click outside
        gallery.onclick = (e) => {
            if (e.target === gallery) {
                gallery.remove();
            }
        };
    }
}
