/**
 * Snake Game - Skill Tree & Progression System
 * Handles permanent upgrades, skill unlocks, and power-up combos
 */

// Power-up Combo Definitions
export const POWER_COMBOS = {
    // Ghost + Fire = Phantom Flame
    'ghost+fire': { 
        name: 'Phantom Flame', 
        icon: '👻🔥',
        effect: 'phantom_flame',
        desc: 'Ghost snake leaves a deadly fire trail',
        multiplier: 1.5
    },
    // Speed + Shield = Battering Ram
    'speed+shield': { 
        name: 'Battering Ram', 
        icon: '⚡🛡️',
        effect: 'battering_ram',
        desc: 'Destroy obstacles on contact while moving fast',
        multiplier: 2
    },
    // Magnet + Double = Gold Rush
    'magnet+double': { 
        name: 'Gold Rush', 
        icon: '🧲💎',
        effect: 'gold_rush',
        desc: 'Attract food and get triple points',
        multiplier: 3
    },
    // Freeze + Ghost = Time Wraith
    'freeze+ghost': { 
        name: 'Time Wraith', 
        icon: '⏰👻',
        effect: 'time_wraith',
        desc: 'Freeze time and phase through everything',
        multiplier: 2
    },
    // Fire + Speed = Meteor
    'fire+speed': { 
        name: 'Meteor', 
        icon: '🔥⚡',
        effect: 'meteor',
        desc: 'Blazing fast with explosive trail',
        multiplier: 2.5
    },
    // Shield + Invincible = Fortress
    'shield+invincible': { 
        name: 'Fortress', 
        icon: '🛡️💪',
        effect: 'fortress',
        desc: 'Completely invulnerable with damage reflection',
        multiplier: 2
    },
    // Clone + Laser = Mirror Strike
    'clone+laser': { 
        name: 'Mirror Strike', 
        icon: '🎭🔫',
        effect: 'mirror_strike',
        desc: 'Both snakes fire synchronized lasers',
        multiplier: 3
    },
    // Vacuum + Bomb = Supernova
    'vacuum+bomb': { 
        name: 'Supernova', 
        icon: '🌀💣',
        effect: 'supernova',
        desc: 'Pull everything in then explode massively',
        multiplier: 4
    },
    // Triple + Speed = Hyperdrive
    'triple+speed': { 
        name: 'Hyperdrive', 
        icon: '✖️⚡',
        effect: 'hyperdrive',
        desc: 'Insane speed with 5x point multiplier',
        multiplier: 5
    },
    // Ghost + Magnet = Soul Harvest
    'ghost+magnet': { 
        name: 'Soul Harvest', 
        icon: '👻🧲',
        effect: 'soul_harvest',
        desc: 'Pass through walls while attracting all food',
        multiplier: 2
    },
    // Fire + Bomb = Inferno
    'fire+bomb': { 
        name: 'Inferno', 
        icon: '🔥💣',
        effect: 'inferno',
        desc: 'Everything burns in a massive radius',
        multiplier: 3
    },
    // Slow + Freeze = Absolute Zero
    'slow+freeze': { 
        name: 'Absolute Zero', 
        icon: '🐢⏰',
        effect: 'absolute_zero',
        desc: 'Time nearly stops, enemies frozen solid',
        multiplier: 2
    }
};

// Skill Tree Definition
export const SKILL_TREE = {
    // Starting Skills (Tier 0)
    core: {
        id: 'core',
        name: 'Core',
        tier: 0,
        skills: [
            { 
                id: 'base_speed', 
                name: 'Swift Start', 
                desc: '+10% base movement speed',
                icon: '🏃',
                maxLevel: 3,
                cost: [100, 250, 500],
                effect: { type: 'speed_bonus', value: 0.1 }
            },
            { 
                id: 'base_points', 
                name: 'Hunger', 
                desc: '+15% points from food',
                icon: '🍎',
                maxLevel: 3,
                cost: [100, 250, 500],
                effect: { type: 'point_bonus', value: 0.15 }
            }
        ]
    },
    
    // Defense Skills (Tier 1)
    defense: {
        id: 'defense',
        name: 'Defense',
        tier: 1,
        requires: ['base_speed', 'base_points'],
        skills: [
            { 
                id: 'thick_skin', 
                name: 'Thick Skin', 
                desc: 'Start each game with a shield',
                icon: '🛡️',
                maxLevel: 1,
                cost: [500],
                effect: { type: 'start_shield', value: true }
            },
            { 
                id: 'extra_life', 
                name: 'Second Chance', 
                desc: '+1 life in Classic mode',
                icon: '❤️',
                maxLevel: 2,
                cost: [750, 1500],
                effect: { type: 'extra_lives', value: 1 }
            },
            { 
                id: 'shield_duration', 
                name: 'Endurance', 
                desc: 'Shield lasts 2 more hits',
                icon: '🔰',
                maxLevel: 2,
                cost: [600, 1200],
                effect: { type: 'shield_hits', value: 2 }
            }
        ]
    },
    
    // Offense Skills (Tier 1)
    offense: {
        id: 'offense',
        name: 'Offense',
        tier: 1,
        requires: ['base_speed', 'base_points'],
        skills: [
            { 
                id: 'power_duration', 
                name: 'Power Surge', 
                desc: 'Power-ups last 25% longer',
                icon: '⏱️',
                maxLevel: 3,
                cost: [400, 800, 1600],
                effect: { type: 'powerup_duration', value: 0.25 }
            },
            { 
                id: 'combo_master', 
                name: 'Combo Master', 
                desc: 'Combos decay 20% slower',
                icon: '🔥',
                maxLevel: 3,
                cost: [300, 600, 1200],
                effect: { type: 'combo_decay', value: 0.2 }
            },
            { 
                id: 'critical_bite', 
                name: 'Critical Bite', 
                desc: '10% chance for 3x points on food',
                icon: '💥',
                maxLevel: 3,
                cost: [500, 1000, 2000],
                effect: { type: 'crit_chance', value: 0.1 }
            }
        ]
    },
    
    // Ultimate Skills (Tier 2)
    ultimate: {
        id: 'ultimate',
        name: 'Ultimate',
        tier: 2,
        requires: ['thick_skin', 'power_duration'],
        skills: [
            { 
                id: 'ult_charge', 
                name: 'Rapid Charge', 
                desc: 'Ultimate charges 20% faster',
                icon: '⚡',
                maxLevel: 3,
                cost: [800, 1600, 3200],
                effect: { type: 'ult_charge_rate', value: 0.2 }
            },
            { 
                id: 'ult_power', 
                name: 'Devastating Force', 
                desc: 'Ultimate effect is 30% stronger',
                icon: '💪',
                maxLevel: 2,
                cost: [1500, 3000],
                effect: { type: 'ult_power', value: 0.3 }
            }
        ]
    },
    
    // Mastery Skills (Tier 3)
    mastery: {
        id: 'mastery',
        name: 'Mastery',
        tier: 3,
        requires: ['ult_charge', 'ult_power'],
        skills: [
            { 
                id: 'combo_fusion', 
                name: 'Power Fusion', 
                desc: 'Unlock power-up combos',
                icon: '🌟',
                maxLevel: 1,
                cost: [5000],
                effect: { type: 'enable_combos', value: true }
            },
            { 
                id: 'perfect_control', 
                name: 'Perfect Control', 
                desc: 'Slightly tighter turning radius',
                icon: '🎯',
                maxLevel: 1,
                cost: [3000],
                effect: { type: 'turn_precision', value: true }
            },
            { 
                id: 'endless_hunger', 
                name: 'Endless Hunger', 
                desc: 'Score multiplier grows with length',
                icon: '🐲',
                maxLevel: 1,
                cost: [10000],
                effect: { type: 'length_multiplier', value: true }
            }
        ]
    }
};

export class ProgressionSystem {
    constructor(game) {
        this.game = game;
        this.progress = this.loadProgress();
    }
    
    loadProgress() {
        const saved = localStorage.getItem('snake_progression');
        return saved ? JSON.parse(saved) : {
            xp: 0,
            totalXp: 0,
            level: 1,
            skillPoints: 0,
            unlockedSkills: {},
            currency: 0
        };
    }
    
    saveProgress() {
        localStorage.setItem('snake_progression', JSON.stringify(this.progress));
    }
    
    addXp(amount) {
        this.progress.xp += amount;
        this.progress.totalXp += amount;
        
        // Check for level up
        const xpNeeded = this.getXpForNextLevel();
        while (this.progress.xp >= xpNeeded) {
            this.progress.xp -= xpNeeded;
            this.levelUp();
        }
        
        this.saveProgress();
    }
    
    getXpForNextLevel() {
        return Math.floor(100 * Math.pow(1.5, this.progress.level - 1));
    }
    
    levelUp() {
        this.progress.level++;
        this.progress.skillPoints += 1;
        
        // Show level up notification
        this.showLevelUpNotification();
    }
    
    showLevelUpNotification() {
        const div = document.createElement('div');
        div.className = 'level-up-notification';
        div.innerHTML = `
            <h2>LEVEL UP!</h2>
            <p>Level ${this.progress.level}</p>
            <p>+1 Skill Point</p>
        `;
        div.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(0,255,136,0.9), rgba(0,100,50,0.9));
            padding: 30px 50px;
            border-radius: 20px;
            text-align: center;
            z-index: 2000;
            animation: levelUpPop 0.5s ease;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
            box-shadow: 0 0 50px rgba(0, 255, 136, 0.5);
        `;
        document.body.appendChild(div);
        
        setTimeout(() => {
            div.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => div.remove(), 500);
        }, 2000);
    }
    
    addCurrency(amount) {
        this.progress.currency += amount;
        this.saveProgress();
    }
    
    canUnlockSkill(skillId) {
        // Find the skill
        for (const category of Object.values(SKILL_TREE)) {
            const skill = category.skills.find(s => s.id === skillId);
            if (skill) {
                const currentLevel = this.progress.unlockedSkills[skillId] || 0;
                
                // Check if already maxed
                if (currentLevel >= skill.maxLevel) return false;
                
                // Check cost
                const cost = skill.cost[currentLevel];
                if (this.progress.currency < cost) return false;
                
                // Check requirements
                if (category.requires) {
                    for (const reqId of category.requires) {
                        if (!this.progress.unlockedSkills[reqId]) return false;
                    }
                }
                
                return true;
            }
        }
        return false;
    }
    
    unlockSkill(skillId) {
        if (!this.canUnlockSkill(skillId)) return false;
        
        for (const category of Object.values(SKILL_TREE)) {
            const skill = category.skills.find(s => s.id === skillId);
            if (skill) {
                const currentLevel = this.progress.unlockedSkills[skillId] || 0;
                const cost = skill.cost[currentLevel];
                
                this.progress.currency -= cost;
                this.progress.unlockedSkills[skillId] = currentLevel + 1;
                this.saveProgress();
                
                return true;
            }
        }
        return false;
    }
    
    getSkillEffect(effectType) {
        let totalValue = 0;
        let isEnabled = false;
        
        for (const category of Object.values(SKILL_TREE)) {
            for (const skill of category.skills) {
                const level = this.progress.unlockedSkills[skill.id] || 0;
                if (level > 0 && skill.effect.type === effectType) {
                    if (typeof skill.effect.value === 'boolean') {
                        isEnabled = skill.effect.value;
                    } else {
                        totalValue += skill.effect.value * level;
                    }
                }
            }
        }
        
        return typeof isEnabled === 'boolean' && isEnabled ? true : totalValue;
    }
    
    // Check for active power-up combos
    checkCombos(activePowerUps) {
        if (!this.getSkillEffect('enable_combos')) return null;
        
        const activeEffects = Object.keys(activePowerUps);
        
        for (const [comboKey, combo] of Object.entries(POWER_COMBOS)) {
            const [effect1, effect2] = comboKey.split('+');
            if (activeEffects.includes(effect1) && activeEffects.includes(effect2)) {
                return combo;
            }
        }
        
        return null;
    }
    
    // Apply all passive skill effects to game
    applyPassiveEffects() {
        const game = this.game;
        
        // Speed bonus
        const speedBonus = this.getSkillEffect('speed_bonus');
        if (speedBonus) {
            game.moveInterval *= (1 - speedBonus);
        }
        
        // Start with shield
        if (this.getSkillEffect('start_shield')) {
            game.activePowerUps.shield = { remaining: -1, type: { effect: 'shield' } };
        }
        
        // Extra lives
        const extraLives = this.getSkillEffect('extra_lives');
        if (extraLives && game.gameMode === 'CLASSIC') {
            game.lives += extraLives;
        }
    }
}
