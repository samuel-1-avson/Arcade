/**
 * Roguelike - Game Modes System
 * Implements 5 different game modes with unique rules and mechanics
 */

import { ICONS } from './Icons.js';

// Helper function to get icon SVG
function getIcon(key) {
    return ICONS[key] || '';
}

export const GAME_MODES = {
    CLASSIC: 'classic',
    ENDLESS: 'endless',
    SURVIVAL: 'survival',
    DAILY: 'daily',
    CHALLENGE: 'challenge'
};

// Daily Run seeding
function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function getTodaysSeed() {
    const now = new Date();
    return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

// Challenge presets
export const CHALLENGE_PRESETS = {
    NO_WEAPONS: {
        id: 'no_weapons',
        name: 'Unarmed',
        description: 'Weapons do not spawn. Rely on your base attack only.',
        iconKey: 'fist',
        modifiers: { noWeapons: true },
        scoreMultiplier: 1.5
    },
    DOUBLE_MONSTERS: {
        id: 'double_monsters',
        name: 'Horde Mode',
        description: 'Double the monsters on every floor.',
        iconKey: 'demon',
        modifiers: { monsterMultiplier: 2 },
        scoreMultiplier: 2.0
    },
    NO_POTIONS: {
        id: 'no_potions',
        name: 'No Healing',
        description: 'Health potions do not spawn.',
        iconKey: 'broken_heart',
        modifiers: { noPotions: true },
        scoreMultiplier: 1.75
    },
    DARKNESS: {
        id: 'darkness',
        name: 'Eternal Night',
        description: 'Vision range reduced to 3 tiles.',
        iconKey: 'moon',
        modifiers: { visionRange: 3 },
        scoreMultiplier: 1.5
    },
    GLASS_CANNON: {
        id: 'glass_cannon',
        name: 'Glass Cannon',
        description: 'Deal 3x damage, but have only 25 HP.',
        iconKey: 'diamond',
        modifiers: { damageMultiplier: 3, maxHp: 25 },
        scoreMultiplier: 2.0
    },
    SPEEDRUN: {
        id: 'speedrun',
        name: 'Speed Demon',
        description: 'Complete floors in limited turns or lose HP.',
        iconKey: 'lightning',
        modifiers: { turnLimit: 100, turnPenalty: 5 },
        scoreMultiplier: 1.75
    },
    PACIFIST: {
        id: 'pacifist',
        name: 'Pacifist',
        description: 'Cannot attack. Sneak to the stairs.',
        iconKey: 'dove',
        modifiers: { noAttack: true, stealthMode: true },
        scoreMultiplier: 3.0
    },
    IRON_MAN: {
        id: 'iron_man',
        name: 'Iron Man',
        description: 'No saves, no restarts. True permadeath.',
        iconKey: 'lock',
        modifiers: { noSaves: true, permadeath: true },
        scoreMultiplier: 2.5
    }
};


export class GameModes {
    constructor(game) {
        this.game = game;
        this.currentMode = GAME_MODES.CLASSIC;
        this.modeData = {};
        this.activeChallenge = null;
        this.dailySeed = getTodaysSeed();
    }
    
    setMode(mode, options = {}) {
        this.currentMode = mode;
        this.modeData = {};
        this.activeChallenge = null;
        
        switch (mode) {
            case GAME_MODES.CLASSIC:
                this.applyClassicMode();
                break;
            case GAME_MODES.ENDLESS:
                this.applyEndlessMode();
                break;
            case GAME_MODES.SURVIVAL:
                this.applySurvivalMode();
                break;
            case GAME_MODES.DAILY:
                this.applyDailyMode();
                break;
            case GAME_MODES.CHALLENGE:
                this.applyChallengeMode(options.challenge);
                break;
        }
        
        return this.modeData;
    }
    
    applyClassicMode() {
        this.modeData = {
            name: 'Classic',
            description: 'Standard roguelike experience. Descend as deep as you can!',
            iconKey: 'sword',
            rules: {
                maxFloors: null, // Unlimited
                permadeath: true,
                saveAllowed: true,
                itemSpawnRate: 1.0,
                monsterSpawnRate: 1.0,
                xpMultiplier: 1.0,
                goldMultiplier: 1.0,
                scoreMultiplier: 1.0
            }
        };
    }
    
    applyEndlessMode() {
        this.modeData = {
            name: 'Endless',
            description: 'Infinite difficulty scaling. How deep can you go?',
            iconKey: 'endless',
            rules: {
                maxFloors: null,
                permadeath: true,
                saveAllowed: false,
                itemSpawnRate: 0.9,
                monsterSpawnRate: 1.2,
                xpMultiplier: 1.5,
                goldMultiplier: 1.5,
                scoreMultiplier: 1.5,
                difficultyScaling: 'exponential'
            },
            endlessData: {
                difficultyMultiplier: 1.0,
                bossEveryFloors: 5,
                eliteChance: 0.1
            }
        };
    }
    
    applySurvivalMode() {
        this.modeData = {
            name: 'Survival',
            description: 'No healing, no mercy. Survive or die!',
            iconKey: 'skull',
            rules: {
                maxFloors: null,
                permadeath: true,
                saveAllowed: false,
                noPotions: true,
                noHealOnLevelUp: true,
                hungerSystem: true,
                itemSpawnRate: 0.7,
                monsterSpawnRate: 1.0,
                xpMultiplier: 2.0,
                goldMultiplier: 1.5,
                scoreMultiplier: 2.0
            },
            survivalData: {
                hunger: 100,
                maxHunger: 100,
                hungerDecay: 1, // per turn
                starveDamage: 1
            }
        };
    }
    
    applyDailyMode() {
        this.modeData = {
            name: 'Daily Run',
            description: `Today's challenge: Seed #${this.dailySeed}`,
            iconKey: 'calendar',
            rules: {
                maxFloors: 10,
                permadeath: true,
                saveAllowed: false,
                seed: this.dailySeed,
                itemSpawnRate: 1.0,
                monsterSpawnRate: 1.0,
                xpMultiplier: 1.0,
                goldMultiplier: 1.0,
                scoreMultiplier: 1.5,
                oneAttemptPerDay: true
            },
            dailyData: {
                seed: this.dailySeed,
                modifiers: this.generateDailyModifiers(),
                hasAttempted: this.hasDailyAttempt(),
                bestScore: this.getDailyBestScore()
            }
        };
    }
    
    applyChallengeMode(challenge) {
        const preset = challenge ? CHALLENGE_PRESETS[challenge] : CHALLENGE_PRESETS.NO_WEAPONS;
        this.activeChallenge = preset;
        
        this.modeData = {
            name: preset.name,
            description: preset.description,
            iconKey: preset.iconKey,
            rules: {
                maxFloors: null,
                permadeath: true,
                saveAllowed: false,
                itemSpawnRate: 1.0,
                monsterSpawnRate: 1.0,
                xpMultiplier: 1.0,
                goldMultiplier: 1.0,
                scoreMultiplier: preset.scoreMultiplier,
                ...preset.modifiers
            },
            challengeData: {
                id: preset.id,
                name: preset.name
            }
        };
    }
    
    generateDailyModifiers() {
        // Use seeded random to generate consistent daily modifiers
        let seed = this.dailySeed;
        const rand = () => {
            const result = seededRandom(seed);
            seed++;
            return result;
        };
        
        const modifiers = [];
        
        // Random monster buff
        if (rand() > 0.5) {
            modifiers.push({ type: 'monster_hp', value: 1.25, text: 'Monsters have 25% more HP' });
        }
        
        // Random item modifier
        if (rand() > 0.6) {
            modifiers.push({ type: 'gold_bonus', value: 1.5, text: '50% more gold drops' });
        }
        
        // Random visibility
        if (rand() > 0.7) {
            modifiers.push({ type: 'fog', value: 4, text: 'Reduced visibility' });
        }
        
        // Random bonus
        if (rand() > 0.5) {
            modifiers.push({ type: 'xp_bonus', value: 1.25, text: '25% bonus XP' });
        }
        
        return modifiers;
    }
    
    hasDailyAttempt() {
        try {
            const attempts = JSON.parse(localStorage.getItem('roguelike_daily_attempts') || '{}');
            return !!attempts[this.dailySeed];
        } catch {
            return false;
        }
    }
    
    recordDailyAttempt(score) {
        try {
            const attempts = JSON.parse(localStorage.getItem('roguelike_daily_attempts') || '{}');
            attempts[this.dailySeed] = { score, timestamp: Date.now() };
            localStorage.setItem('roguelike_daily_attempts', JSON.stringify(attempts));
        } catch (e) {
            console.error('Failed to record daily attempt:', e);
        }
    }
    
    getDailyBestScore() {
        try {
            const attempts = JSON.parse(localStorage.getItem('roguelike_daily_attempts') || '{}');
            return attempts[this.dailySeed]?.score || 0;
        } catch {
            return 0;
        }
    }
    
    getModeInfo() {
        return {
            mode: this.currentMode,
            ...this.modeData
        };
    }
    
    getEndlessDifficulty(floor) {
        if (this.currentMode !== GAME_MODES.ENDLESS) return 1.0;
        
        const base = this.modeData.endlessData.difficultyMultiplier;
        // Exponential scaling: difficulty doubles every 10 floors
        return base * Math.pow(1.07, floor);
    }
    
    shouldSpawnBoss(floor) {
        if (this.currentMode === GAME_MODES.ENDLESS) {
            return floor > 0 && floor % this.modeData.endlessData.bossEveryFloors === 0;
        }
        return false;
    }
    
    shouldSpawnElite(floor) {
        if (this.currentMode === GAME_MODES.ENDLESS) {
            return Math.random() < this.modeData.endlessData.eliteChance * (1 + floor * 0.01);
        }
        return false;
    }
    
    updateSurvival(turnsElapsed) {
        if (this.currentMode !== GAME_MODES.SURVIVAL) return null;
        
        const data = this.modeData.survivalData;
        data.hunger -= data.hungerDecay * turnsElapsed;
        
        if (data.hunger <= 0) {
            data.hunger = 0;
            return { starving: true, damage: data.starveDamage };
        }
        
        return { hunger: data.hunger, maxHunger: data.maxHunger };
    }
    
    feedPlayer(foodValue) {
        if (this.currentMode !== GAME_MODES.SURVIVAL) return;
        
        const data = this.modeData.survivalData;
        data.hunger = Math.min(data.maxHunger, data.hunger + foodValue);
    }
    
    calculateFinalScore(baseScore) {
        const multiplier = this.modeData.rules?.scoreMultiplier || 1.0;
        return Math.floor(baseScore * multiplier);
    }
    
    canSave() {
        return this.modeData.rules?.saveAllowed !== false;
    }
    
    showModeUI() {
        const container = document.getElementById('mode-ui-container');
        if (!container) return;
        
        let html = '';
        
        if (this.currentMode === GAME_MODES.SURVIVAL) {
            const data = this.modeData.survivalData;
            const hungerPercent = (data.hunger / data.maxHunger) * 100;
            const hungerColor = hungerPercent > 50 ? '#4a4' : hungerPercent > 25 ? '#aa4' : '#a44';
            
            html += `
                <div class="mode-stat hunger-bar">
                    <span class="mode-label">🍖 Hunger</span>
                    <div class="mode-bar-bg">
                        <div class="mode-bar-fill" style="width: ${hungerPercent}%; background: ${hungerColor}"></div>
                    </div>
                    <span class="mode-value">${Math.floor(data.hunger)}/${data.maxHunger}</span>
                </div>
            `;
        }
        
        if (this.currentMode === GAME_MODES.DAILY) {
            html += `
                <div class="mode-stat daily-info">
                    <span class="mode-icon">${getIcon('calendar')}</span>
                    <span class="mode-label">Daily Run #${this.dailySeed}</span>
                </div>
            `;
        }
        
        if (this.activeChallenge) {
            html += `
                <div class="mode-stat challenge-info">
                    <span class="mode-icon">${getIcon(this.activeChallenge.iconKey)}</span>
                    <span class="mode-label">${this.activeChallenge.name}</span>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }
    
    showModeSelect() {
        let modal = document.getElementById('mode-select-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'mode-select-modal';
            modal.className = 'mode-select-modal';
            document.body.appendChild(modal);
        }
        
        const modes = [
            { mode: GAME_MODES.CLASSIC, iconKey: 'sword', name: 'Classic', desc: 'Standard roguelike. Descend as deep as you can!' },
            { mode: GAME_MODES.ENDLESS, iconKey: 'endless', name: 'Endless', desc: 'Infinite scaling difficulty. Test your limits!' },
            { mode: GAME_MODES.SURVIVAL, iconKey: 'skull', name: 'Survival', desc: 'No healing, hunger system. Pure challenge!' },
            { mode: GAME_MODES.DAILY, iconKey: 'calendar', name: 'Daily Run', desc: 'Compete on the daily leaderboard!' },
            { mode: GAME_MODES.CHALLENGE, iconKey: 'trophy', name: 'Challenge', desc: 'Special modifiers for ultimate tests!' }
        ];
        
        let html = `
            <div class="mode-select-content">
                <div class="mode-select-header">
                    <h2>${getIcon('gamepad')} Select Game Mode</h2>
                    <button class="close-btn" onclick="document.getElementById('mode-select-modal').style.display='none'">✕</button>
                </div>
                <div class="modes-grid">
        `;
        
        for (const m of modes) {
            html += `
                <button class="mode-card" onclick="window.game.gameModes.selectMode('${m.mode}')">
                    <span class="mode-icon-large">${getIcon(m.iconKey)}</span>
                    <span class="mode-name">${m.name}</span>
                    <span class="mode-desc">${m.desc}</span>
                </button>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
        
        modal.innerHTML = html;
        modal.style.display = 'flex';
    }
    
    showChallengeSelect() {
        let modal = document.getElementById('challenge-select-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'challenge-select-modal';
            modal.className = 'challenge-select-modal';
            document.body.appendChild(modal);
        }
        
        let html = `
            <div class="challenge-select-content">
                <div class="challenge-select-header">
                    <h2>${getIcon('trophy')} Select Challenge</h2>
                    <button class="close-btn" onclick="document.getElementById('challenge-select-modal').style.display='none'">✕</button>
                </div>
                <div class="challenges-grid">
        `;
        
        for (const [key, preset] of Object.entries(CHALLENGE_PRESETS)) {
            html += `
                <button class="challenge-card" onclick="window.game.gameModes.selectChallenge('${key}')">
                    <span class="challenge-icon">${getIcon(preset.iconKey)}</span>
                    <span class="challenge-name">${preset.name}</span>
                    <span class="challenge-desc">${preset.description}</span>
                    <span class="challenge-multiplier">${preset.scoreMultiplier}x Score</span>
                </button>
            `;
        }
        
        html += `
                </div>
                <div class="challenge-select-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('challenge-select-modal').style.display='none'">Back</button>
                </div>
            </div>
        `;
        
        modal.innerHTML = html;
        modal.style.display = 'flex';
    }
    
    selectMode(mode) {
        document.getElementById('mode-select-modal').style.display = 'none';
        
        if (mode === GAME_MODES.CHALLENGE) {
            this.showChallengeSelect();
            return;
        }
        
        if (mode === GAME_MODES.DAILY && this.hasDailyAttempt()) {
            alert('You have already attempted today\'s daily run. Come back tomorrow!');
            return;
        }
        
        this.setMode(mode);
        if (this.game) {
            this.game.startWithMode(mode);
        }
    }
    
    selectChallenge(challengeKey) {
        document.getElementById('challenge-select-modal').style.display = 'none';
        
        this.setMode(GAME_MODES.CHALLENGE, { challenge: challengeKey });
        if (this.game) {
            this.game.startWithMode(GAME_MODES.CHALLENGE);
        }
    }
}
