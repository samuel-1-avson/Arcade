/**
 * Tower Defense - Hero Abilities System
 * Player-activated abilities with cooldowns
 */

export const HERO_ABILITIES = {
    METEOR: 'meteor',
    TIME_FREEZE: 'time_freeze',
    GOLD_RUSH: 'gold_rush'
};

export class HeroAbilities {
    constructor(game) {
        this.game = game;
        
        this.abilities = {
            [HERO_ABILITIES.METEOR]: {
                name: 'Meteor Strike',
                iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M3 21h18"/><path d="M12 3l3 6"/><path d="M12 3l-3 6"/><path d="M12 3v6"/></svg>',
                cooldown: 60,
                currentCooldown: 0,
                description: 'Massive AOE damage at target location',
                damage: 200,
                radius: 100
            },
            [HERO_ABILITIES.TIME_FREEZE]: {
                name: 'Time Freeze',
                iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 8 14"/></svg>',
                cooldown: 90,
                currentCooldown: 0,
                description: 'Slow all enemies by 50% for 10s',
                duration: 10,
                slowAmount: 0.5
            },
            [HERO_ABILITIES.GOLD_RUSH]: {
                name: 'Gold Rush',
                iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10h8M8 14h8" stroke="#000" stroke-width="1.5"/></svg>',
                cooldown: 120,
                currentCooldown: 0,
                description: '3x gold income for 15s',
                duration: 15,
                multiplier: 3
            }
        };

        this.activeEffects = [];
    }

    // Update cooldowns
    update(dt) {
        // Update cooldowns
        for (const key in this.abilities) {
            const ability = this.abilities[key];
            if (ability.currentCooldown > 0) {
                ability.currentCooldown -= dt;
                if (ability.currentCooldown < 0) ability.currentCooldown = 0;
            }
        }

        // Update active effects
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.timeRemaining -= dt;
            
            if (effect.timeRemaining <= 0) {
                this.deactivateEffect(effect);
                this.activeEffects.splice(i, 1);
            }
        }
    }

    // Check if ability is ready
    isReady(abilityKey) {
        return this.abilities[abilityKey].currentCooldown <= 0;
    }

    // Use Meteor Strike
    useMeteor(x, y) {
        if (!this.isReady(HERO_ABILITIES.METEOR)) return false;

        const ability = this.abilities[HERO_ABILITIES.METEOR];
        ability.currentCooldown = ability.cooldown;

        // Visual effect
        this.createMeteorEffect(x, y);

        // Damage enemies in radius
        for (const enemy of this.game.enemies) {
            const dist = Math.hypot(enemy.x - x, enemy.y - y);
            if (dist < ability.radius) {
                enemy.hp -= ability.damage;
                this.game.spawnExplosion(enemy.x, enemy.y, '#ff6600');
            }
        }

        // Sound effect
        this.game.soundEffects?.explosion();

        // Achievement
        this.checkAbilityAchievement();

        return true;
    }

    // Use Time Freeze
    useTimeFreeze() {
        if (!this.isReady(HERO_ABILITIES.TIME_FREEZE)) return false;

        const ability = this.abilities[HERO_ABILITIES.TIME_FREEZE];
        ability.currentCooldown = ability.cooldown;

        // Add active effect
        this.activeEffects.push({
            type: HERO_ABILITIES.TIME_FREEZE,
            timeRemaining: ability.duration,
            slowAmount: ability.slowAmount
        });

        // Apply slow to all enemies
        for (const enemy of this.game.enemies) {
            if (!enemy.baseSpeed) enemy.baseSpeed = enemy.speed;
            enemy.speed = enemy.baseSpeed * (1 - ability.slowAmount);
            enemy.timeFrozen = true;
        }

        // Visual effect
        this.createTimeFreezeEffect();

        this.checkAbilityAchievement();

        return true;
    }

    // Use Gold Rush
    useGoldRush() {
        if (!this.isReady(HERO_ABILITIES.GOLD_RUSH)) return false;

        const ability = this.abilities[HERO_ABILITIES.GOLD_RUSH];
        ability.currentCooldown = ability.cooldown;

        // Add active effect
        this.activeEffects.push({
            type: HERO_ABILITIES.GOLD_RUSH,
            timeRemaining: ability.duration,
            multiplier: ability.multiplier
        });

        // Apply multiplier
        this.game.goldMultiplier = (this.game.goldMultiplier || 1) * ability.multiplier;

        // Visual effect
        this.createGoldRushEffect();

        this.checkAbilityAchievement();

        return true;
    }

    // Deactivate effect
    deactivateEffect(effect) {
        if (effect.type === HERO_ABILITIES.TIME_FREEZE) {
            // Restore enemy speeds
            for (const enemy of this.game.enemies) {
                if (enemy.timeFrozen) {
                    enemy.speed = enemy.baseSpeed || enemy.speed;
                    enemy.timeFrozen = false;
                }
            }
        } else if (effect.type === HERO_ABILITIES.GOLD_RUSH) {
            // Remove multiplier
            this.game.goldMultiplier = (this.game.goldMultiplier || 1) / effect.multiplier;
        }
    }

    // Check for achievement (use all 3 abilities)
    checkAbilityAchievement() {
        if (!this.game.achievementSystem) return;

        const usedAbilities = Object.keys(this.abilities).filter(key => 
            this.abilities[key].currentCooldown > 0
        );

        if (usedAbilities.length === 3) {
            this.game.achievementSystem.tryUnlock('ability_master');
        }
    }

    // Visual effects
    createMeteorEffect(x, y) {
        const canvas = this.game.canvas;
        const ctx = this.game.ctx;

        // Create particles falling from top
        for (let i = 0; i < 20; i++) {
            const angle = random(0, Math.PI * 2);
            const dist = random(0, 30);
            this.game.particles.push({
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                vx: Math.cos(angle) * random(50, 150),
                vy: Math.sin(angle) * random(50, 150),
                life: random(0.5, 1.0),
                maxLife: 1.0,
                size: random(4, 10),
                color: random(0, 1) > 0.5 ? '#ff6600' : '#ffaa00'
            });
        }

        // Screen shake
        if (this.game.camera) {
            this.game.camera.shake(8, 0.5);
        }
    }

    createTimeFreezeEffect() {
        // Add a blue tint overlay temporarily
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 150, 255, 0.2);
            pointer-events: none;
            z-index: 1000;
            animation: fadeOut 1s ease;
        `;

        if (!document.getElementById('time-freeze-anim')) {
            const style = document.createElement('style');
            style.id = 'time-freeze-anim';
            style.textContent = `
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(overlay);
        setTimeout(() => overlay.remove(), 1000);
    }

    createGoldRushEffect() {
        // Create coin particles
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const x = random(0, this.game.canvas.width);
                const y = 0;
                this.game.particles.push({
                    x, y,
                    vx: random(-50, 50),
                    vy: random(100, 200),
                    life: random(1, 2),
                    maxLife: 2,
                    size: random(3, 6),
                    color: '#ffd700'
                });
            }, i * 50);
        }
    }

    // Render ability UI
    renderUI() {
        const container = document.getElementById('abilities-container');
        if (!container) return;

        let html = '';
        
        for (const key in this.abilities) {
            const ability = this.abilities[key];
            const ready = this.isReady(key);
            const cooldownPercent = ready ? 100 : ((ability.cooldown - ability.currentCooldown) / ability.cooldown) * 100;

            html += `
                <button class="ability-btn ${ready ? 'ready' : 'cooldown'}" data-ability="${key}" title="${ability.description}">
                    <span class="ability-icon">${ability.iconSvg}</span>
                    <span class="ability-info">
                        <span class="ability-name">${ability.name}</span>
                        <span class="ability-key">${key === 'meteor' ? 'Q' : key === 'time_freeze' ? 'W' : 'E'}</span>
                    </span>
                    ${!ready ? `<span class="ability-cooldown">${Math.ceil(ability.currentCooldown)}s</span>` : ''}
                </button>
            `;
        }

        container.innerHTML = html;
    }
}

// Helper function
function random(min, max) {
    return Math.random() * (max - min) + min;
}
