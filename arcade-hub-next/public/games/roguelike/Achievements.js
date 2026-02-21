/**
 * Roguelike - Achievement System
 * Tracks and rewards player accomplishments across all game modes
 */

import { ICONS } from './Icons.js';

function getIcon(key) {
    return ICONS[key] || '';
}

export const ACHIEVEMENTS = {
    // Combat Achievements
    first_blood: {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Defeat your first monster',
        iconKey: 'dagger',
        category: 'combat',
        condition: { type: 'kills', value: 1 },
        reward: { xp: 10 }
    },
    monster_slayer: {
        id: 'monster_slayer',
        name: 'Monster Slayer',
        description: 'Defeat 100 monsters',
        iconKey: 'sword',
        category: 'combat',
        condition: { type: 'kills', value: 100 },
        reward: { xp: 100 }
    },
    mass_extinction: {
        id: 'mass_extinction',
        name: 'Mass Extinction',
        description: 'Defeat 1000 monsters',
        iconKey: 'skull',
        category: 'combat',
        condition: { type: 'kills', value: 1000 },
        reward: { xp: 500, title: 'Exterminator' }
    },
    rat_catcher: {
        id: 'rat_catcher',
        name: 'Rat Catcher',
        description: 'Defeat 50 rats',
        iconKey: 'smoke',
        category: 'combat',
        condition: { type: 'kill_type', monster: 'rat', value: 50 },
        reward: { xp: 50 }
    },
    dragon_slayer: {
        id: 'dragon_slayer',
        name: 'Dragon Slayer',
        description: 'Defeat a Dragon',
        iconKey: 'fire',
        category: 'combat',
        condition: { type: 'kill_type', monster: 'dragon', value: 1 },
        reward: { xp: 200, title: 'Dragonbane' }
    },
    boss_hunter: {
        id: 'boss_hunter',
        name: 'Boss Hunter',
        description: 'Defeat all 5 story bosses',
        iconKey: 'crown',
        category: 'combat',
        condition: { type: 'bosses_defeated', value: 5 },
        reward: { xp: 500, title: 'Boss Slayer' }
    },
    pacifist_floor: {
        id: 'pacifist_floor',
        name: 'Pacifist',
        description: 'Complete a floor without killing any monsters',
        iconKey: 'dove',
        category: 'combat',
        condition: { type: 'pacifist_floor', value: 1 },
        reward: { xp: 75 }
    },
    untouchable: {
        id: 'untouchable',
        name: 'Untouchable',
        description: 'Complete a floor without taking damage',
        iconKey: 'shield',
        category: 'combat',
        condition: { type: 'no_damage_floor', value: 1 },
        reward: { xp: 100 }
    },
    
    // Exploration Achievements
    first_descent: {
        id: 'first_descent',
        name: 'First Descent',
        description: 'Descend to floor 2',
        iconKey: 'dagger',
        category: 'exploration',
        condition: { type: 'floor_reached', value: 2 },
        reward: { xp: 10 }
    },
    deep_diver: {
        id: 'deep_diver',
        name: 'Deep Diver',
        description: 'Reach floor 10',
        iconKey: 'sword',
        category: 'exploration',
        condition: { type: 'floor_reached', value: 10 },
        reward: { xp: 100 }
    },
    abyssal_explorer: {
        id: 'abyssal_explorer',
        name: 'Abyssal Explorer',
        description: 'Reach floor 25',
        iconKey: 'moon',
        category: 'exploration',
        condition: { type: 'floor_reached', value: 25 },
        reward: { xp: 250 }
    },
    bottomless: {
        id: 'bottomless',
        name: 'Bottomless',
        description: 'Reach floor 50',
        iconKey: 'endless',
        category: 'exploration',
        condition: { type: 'floor_reached', value: 50 },
        reward: { xp: 500, title: 'Depth Crawler' }
    },
    treasure_hunter: {
        id: 'treasure_hunter',
        name: 'Treasure Hunter',
        description: 'Collect 50 items',
        iconKey: 'diamond',
        category: 'exploration',
        condition: { type: 'items_collected', value: 50 },
        reward: { xp: 50 }
    },
    gold_hoarder: {
        id: 'gold_hoarder',
        name: 'Gold Hoarder',
        description: 'Collect 1000 gold in total',
        iconKey: 'pouch',
        category: 'exploration',
        condition: { type: 'gold_collected', value: 1000 },
        reward: { xp: 100 }
    },
    wealthy: {
        id: 'wealthy',
        name: 'Wealthy',
        description: 'Collect 10000 gold in total',
        iconKey: 'trophy',
        category: 'exploration',
        condition: { type: 'gold_collected', value: 10000 },
        reward: { xp: 500, title: 'Midas' }
    },
    potion_master: {
        id: 'potion_master',
        name: 'Potion Master',
        description: 'Use 25 potions',
        iconKey: 'heart',
        category: 'exploration',
        condition: { type: 'potions_used', value: 25 },
        reward: { xp: 50 }
    },
    
    // Story Achievements
    chapter_1_complete: {
        id: 'chapter_1_complete',
        name: 'Crypt Clearer',
        description: 'Complete Chapter 1: The Forgotten Crypt',
        iconKey: 'skull',
        category: 'story',
        condition: { type: 'chapter_complete', value: 1 },
        reward: { xp: 100 }
    },
    chapter_2_complete: {
        id: 'chapter_2_complete',
        name: 'Goblin Bane',
        description: 'Complete Chapter 2: Goblin Warrens',
        iconKey: 'demon',
        category: 'story',
        condition: { type: 'chapter_complete', value: 2 },
        reward: { xp: 150 }
    },
    chapter_3_complete: {
        id: 'chapter_3_complete',
        name: 'Ruin Explorer',
        description: 'Complete Chapter 3: Dwarven Ruins',
        iconKey: 'shrine',
        category: 'story',
        condition: { type: 'chapter_complete', value: 3 },
        reward: { xp: 200 }
    },
    chapter_4_complete: {
        id: 'chapter_4_complete',
        name: 'Firewalker',
        description: "Complete Chapter 4: Dragon's Lair",
        iconKey: 'fire',
        category: 'story',
        condition: { type: 'chapter_complete', value: 4 },
        reward: { xp: 250 }
    },
    chapter_5_complete: {
        id: 'chapter_5_complete',
        name: 'Abyssal Champion',
        description: 'Complete Chapter 5: The Abyss',
        iconKey: 'demon',
        category: 'story',
        condition: { type: 'chapter_complete', value: 5 },
        reward: { xp: 500, title: 'Hero of the Realm' }
    },
    perfectionist: {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Get 3 stars on all 15 story levels',
        iconKey: 'star',
        category: 'story',
        condition: { type: 'total_stars', value: 45 },
        reward: { xp: 1000, title: 'Legend' }
    },
    
    // Mode Achievements
    endless_10: {
        id: 'endless_10',
        name: 'Endless Journey',
        description: 'Reach floor 10 in Endless Mode',
        iconKey: 'endless',
        category: 'modes',
        condition: { type: 'endless_floor', value: 10 },
        reward: { xp: 100 }
    },
    survival_5: {
        id: 'survival_5',
        name: 'Survivor',
        description: 'Reach floor 5 in Survival Mode',
        iconKey: 'skull',
        category: 'modes',
        condition: { type: 'survival_floor', value: 5 },
        reward: { xp: 150 }
    },
    daily_complete: {
        id: 'daily_complete',
        name: 'Daily Devotee',
        description: 'Complete a Daily Run',
        iconKey: 'calendar',
        category: 'modes',
        condition: { type: 'daily_complete', value: 1 },
        reward: { xp: 100 }
    },
    challenge_master: {
        id: 'challenge_master',
        name: 'Challenge Master',
        description: 'Complete all 8 challenges',
        iconKey: 'trophy',
        category: 'modes',
        condition: { type: 'challenges_complete', value: 8 },
        reward: { xp: 500, title: 'Challenger' }
    }
};

export class AchievementManager {
    constructor(game) {
        this.game = game;
        this.stats = this.loadStats();
        this.unlockedAchievements = this.loadUnlocked();
        this.pendingNotifications = [];
    }
    
    loadStats() {
        try {
            const saved = localStorage.getItem('roguelike_stats');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load stats:', e);
        }
        
        return {
            kills: 0,
            killsByType: {},
            bossesDefeated: 0,
            floorsReached: 0,
            highestFloor: 0,
            itemsCollected: 0,
            goldCollected: 0,
            potionsUsed: 0,
            gamesPlayed: 0,
            deaths: 0,
            pacifistFloors: 0,
            noDamageFloors: 0,
            chaptersComplete: [],
            totalStars: 0,
            endlessHighFloor: 0,
            survivalHighFloor: 0,
            dailiesComplete: 0,
            challengesComplete: []
        };
    }
    
    loadUnlocked() {
        try {
            const saved = localStorage.getItem('roguelike_achievements');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load achievements:', e);
        }
        return [];
    }
    
    saveStats() {
        try {
            localStorage.setItem('roguelike_stats', JSON.stringify(this.stats));
        } catch (e) {
            console.error('Failed to save stats:', e);
        }
    }
    
    saveUnlocked() {
        try {
            localStorage.setItem('roguelike_achievements', JSON.stringify(this.unlockedAchievements));
        } catch (e) {
            console.error('Failed to save achievements:', e);
        }
    }
    
    isUnlocked(achievementId) {
        return this.unlockedAchievements.includes(achievementId);
    }
    
    unlock(achievementId) {
        if (this.isUnlocked(achievementId)) return false;
        
        const achievement = ACHIEVEMENTS[achievementId];
        if (!achievement) return false;
        
        this.unlockedAchievements.push(achievementId);
        this.saveUnlocked();
        
        // Queue notification
        this.pendingNotifications.push(achievement);
        this.showNextNotification();
        
        // Apply rewards
        if (achievement.reward) {
            if (achievement.reward.xp && this.game) {
                this.game.gainXP?.(achievement.reward.xp);
            }
        }
        
        // Hub Integration
        if (this.game && this.game.hub) {
            this.game.hub.unlockAchievement(achievementId);
        }
        
        return true;
    }
    
    showNextNotification() {
        if (this.pendingNotifications.length === 0 || this.isShowingNotification) return;
        
        this.isShowingNotification = true;
        const achievement = this.pendingNotifications.shift();
        
        // Create notification element
        let notification = document.getElementById('achievement-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'achievement-notification';
            notification.className = 'achievement-notification';
            document.body.appendChild(notification);
        }
        
        notification.innerHTML = `
            <div class="achievement-popup">
                <div class="achievement-icon">${getIcon(achievement.iconKey)}</div>
                <div class="achievement-info">
                    <div class="achievement-unlocked">Achievement Unlocked!</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                </div>
            </div>
        `;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            this.isShowingNotification = false;
            setTimeout(() => this.showNextNotification(), 300);
        }, 3000);
    }
    
    // Stat tracking methods
    recordKill(monsterType) {
        this.stats.kills++;
        this.stats.killsByType[monsterType] = (this.stats.killsByType[monsterType] || 0) + 1;
        this.checkAchievements();
        this.saveStats();
    }
    
    recordBossKill() {
        this.stats.bossesDefeated++;
        this.checkAchievements();
        this.saveStats();
    }
    
    recordFloorReached(floor, mode = 'classic') {
        this.stats.floorsReached++;
        if (floor > this.stats.highestFloor) {
            this.stats.highestFloor = floor;
        }
        if (mode === 'endless' && floor > this.stats.endlessHighFloor) {
            this.stats.endlessHighFloor = floor;
        }
        if (mode === 'survival' && floor > this.stats.survivalHighFloor) {
            this.stats.survivalHighFloor = floor;
        }
        this.checkAchievements();
        this.saveStats();
    }
    
    recordItemCollected() {
        this.stats.itemsCollected++;
        this.checkAchievements();
        this.saveStats();
    }
    
    recordGoldCollected(amount) {
        this.stats.goldCollected += amount;
        this.checkAchievements();
        this.saveStats();
    }
    
    recordPotionUsed() {
        this.stats.potionsUsed++;
        this.checkAchievements();
        this.saveStats();
    }
    
    recordPacifistFloor() {
        this.stats.pacifistFloors++;
        this.checkAchievements();
        this.saveStats();
    }
    
    recordNoDamageFloor() {
        this.stats.noDamageFloors++;
        this.checkAchievements();
        this.saveStats();
    }
    
    recordChapterComplete(chapter) {
        if (!this.stats.chaptersComplete.includes(chapter)) {
            this.stats.chaptersComplete.push(chapter);
        }
        this.checkAchievements();
        this.saveStats();
    }
    
    recordStars(stars) {
        this.stats.totalStars = stars;
        this.checkAchievements();
        this.saveStats();
    }
    
    recordDailyComplete() {
        this.stats.dailiesComplete++;
        this.checkAchievements();
        this.saveStats();
    }
    
    recordChallengeComplete(challengeId) {
        if (!this.stats.challengesComplete.includes(challengeId)) {
            this.stats.challengesComplete.push(challengeId);
        }
        this.checkAchievements();
        this.saveStats();
    }
    
    recordDeath() {
        this.stats.deaths++;
        this.saveStats();
    }
    
    recordGamePlayed() {
        this.stats.gamesPlayed++;
        this.saveStats();
    }
    
    checkAchievements() {
        for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
            if (this.isUnlocked(id)) continue;
            
            const condition = achievement.condition;
            let unlocked = false;
            
            switch (condition.type) {
                case 'kills':
                    unlocked = this.stats.kills >= condition.value;
                    break;
                case 'kill_type':
                    unlocked = (this.stats.killsByType[condition.monster] || 0) >= condition.value;
                    break;
                case 'bosses_defeated':
                    unlocked = this.stats.bossesDefeated >= condition.value;
                    break;
                case 'floor_reached':
                    unlocked = this.stats.highestFloor >= condition.value;
                    break;
                case 'items_collected':
                    unlocked = this.stats.itemsCollected >= condition.value;
                    break;
                case 'gold_collected':
                    unlocked = this.stats.goldCollected >= condition.value;
                    break;
                case 'potions_used':
                    unlocked = this.stats.potionsUsed >= condition.value;
                    break;
                case 'pacifist_floor':
                    unlocked = this.stats.pacifistFloors >= condition.value;
                    break;
                case 'no_damage_floor':
                    unlocked = this.stats.noDamageFloors >= condition.value;
                    break;
                case 'chapter_complete':
                    unlocked = this.stats.chaptersComplete.includes(condition.value);
                    break;
                case 'total_stars':
                    unlocked = this.stats.totalStars >= condition.value;
                    break;
                case 'endless_floor':
                    unlocked = this.stats.endlessHighFloor >= condition.value;
                    break;
                case 'survival_floor':
                    unlocked = this.stats.survivalHighFloor >= condition.value;
                    break;
                case 'daily_complete':
                    unlocked = this.stats.dailiesComplete >= condition.value;
                    break;
                case 'challenges_complete':
                    unlocked = this.stats.challengesComplete.length >= condition.value;
                    break;
            }
            
            if (unlocked) {
                this.unlock(id);
            }
        }
    }
    
    getProgress(achievementId) {
        const achievement = ACHIEVEMENTS[achievementId];
        if (!achievement) return { current: 0, target: 0, percent: 0 };
        
        const condition = achievement.condition;
        let current = 0;
        
        switch (condition.type) {
            case 'kills':
                current = this.stats.kills;
                break;
            case 'kill_type':
                current = this.stats.killsByType[condition.monster] || 0;
                break;
            case 'bosses_defeated':
                current = this.stats.bossesDefeated;
                break;
            case 'floor_reached':
                current = this.stats.highestFloor;
                break;
            case 'items_collected':
                current = this.stats.itemsCollected;
                break;
            case 'gold_collected':
                current = this.stats.goldCollected;
                break;
            case 'potions_used':
                current = this.stats.potionsUsed;
                break;
            case 'chapter_complete':
                current = this.stats.chaptersComplete.includes(condition.value) ? 1 : 0;
                break;
            case 'total_stars':
                current = this.stats.totalStars;
                break;
            case 'challenges_complete':
                current = this.stats.challengesComplete.length;
                break;
            default:
                current = 0;
        }
        
        const target = condition.value;
        const percent = Math.min(100, Math.floor((current / target) * 100));
        
        return { current, target, percent };
    }
    
    showAchievementGallery() {
        let modal = document.getElementById('achievement-gallery-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'achievement-gallery-modal';
            modal.className = 'achievement-gallery-modal';
            document.body.appendChild(modal);
        }
        
        const categories = ['combat', 'exploration', 'story', 'modes'];
        const categoryNames = {
            combat: `${getIcon('sword')} Combat`,
            exploration: `${getIcon('map')} Exploration`, // Placeholder if map icon missing, just use sword? Or I add map. or 'scroll'
            story: `${getIcon('scroll')} Story`,
            modes: `${getIcon('gamepad')} Modes`
        };
        
        const unlockedCount = this.unlockedAchievements.length;
        const totalCount = Object.keys(ACHIEVEMENTS).length;
        
        let html = `
            <div class="achievement-gallery-content">
                <div class="gallery-header">
                    <h2>${getIcon('trophy')} Achievements</h2>
                    <div class="gallery-progress">${unlockedCount}/${totalCount} Unlocked</div>
                    <button class="close-btn" onclick="document.getElementById('achievement-gallery-modal').style.display='none'">✕</button>
                </div>
                <div class="achievement-categories">
        `;
        
        for (const category of categories) {
            const categoryAchievements = Object.values(ACHIEVEMENTS).filter(a => a.category === category);
            
            html += `
                <div class="achievement-category">
                    <h3>${categoryNames[category]}</h3>
                    <div class="achievement-grid">
            `;
            
            for (const achievement of categoryAchievements) {
                const unlocked = this.isUnlocked(achievement.id);
                const progress = this.getProgress(achievement.id);
                
                html += `
                    <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                        <div class="achievement-icon">${unlocked ? getIcon(achievement.iconKey) : getIcon('lock')}</div>
                        <div class="achievement-details">
                            <div class="achievement-name">${unlocked ? achievement.name : '???'}</div>
                            <div class="achievement-desc">${unlocked ? achievement.description : 'Keep playing to unlock!'}</div>
                            ${!unlocked && progress.target > 1 ? `
                                <div class="achievement-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${progress.percent}%"></div>
                                    </div>
                                    <span class="progress-text">${progress.current}/${progress.target}</span>
                                </div>
                            ` : ''}
                        </div>
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
                <div class="gallery-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('achievement-gallery-modal').style.display='none'">Close</button>
                </div>
            </div>
        `;
        
        modal.innerHTML = html;
        modal.style.display = 'flex';
    }
    
    getStats() {
        return { ...this.stats };
    }
    
    resetAll() {
        this.stats = {
            kills: 0,
            killsByType: {},
            bossesDefeated: 0,
            floorsReached: 0,
            highestFloor: 0,
            itemsCollected: 0,
            goldCollected: 0,
            potionsUsed: 0,
            gamesPlayed: 0,
            deaths: 0,
            pacifistFloors: 0,
            noDamageFloors: 0,
            chaptersComplete: [],
            totalStars: 0,
            endlessHighFloor: 0,
            survivalHighFloor: 0,
            dailiesComplete: 0,
            challengesComplete: []
        };
        this.unlockedAchievements = [];
        this.saveStats();
        this.saveUnlocked();
    }
}
