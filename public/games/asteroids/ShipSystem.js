/**
 * Asteroids - Ship System
 * Multiple ships with unique stats, upgrades, and customization
 */

// Ship Definitions
import { ICONS } from './AsteroidsIcons.js';

export const SHIPS = {
    CLASSIC: {
        id: 'classic',
        name: 'Classic',
        icon: ICONS.SHIP,
        description: 'The original ship. Balanced and reliable.',
        unlocked: true,
        stats: {
            speed: 200,
            acceleration: 200,
            rotationSpeed: 4,
            maxSpeed: 400,
            friction: 0.98,
            size: 20,
            hp: 3
        },
        colors: {
            primary: '#ffffff',
            secondary: '#00aaff',
            thrust: '#ff6600'
        }
    },
    SPEEDSTER: {
        id: 'speedster',
        name: 'Speedster',
        icon: ICONS.SHIP, // Using standard ship icon but maybe tint it? Or add specific icons later. Reusing SHIP for now.
        description: 'Fastest ship in the fleet. Low durability.',
        unlocked: false,
        unlockCondition: 'Reach Wave 20',
        stats: {
            speed: 350,
            acceleration: 350,
            rotationSpeed: 5,
            maxSpeed: 600,
            friction: 0.96,
            size: 15,
            hp: 1
        },
        colors: {
            primary: '#ffff00',
            secondary: '#ff8800',
            thrust: '#ff0000'
        }
    },
    TANK: {
        id: 'tank',
        name: 'Tank',
        icon: ICONS.SHIP,
        description: 'Heavy armor, slow but durable.',
        unlocked: false,
        unlockCondition: 'Complete Story World 2',
        stats: {
            speed: 120,
            acceleration: 120,
            rotationSpeed: 2.5,
            maxSpeed: 250,
            friction: 0.995,
            size: 28,
            hp: 6
        },
        colors: {
            primary: '#888888',
            secondary: '#4444ff',
            thrust: '#ff4400'
        }
    },
    GHOST: {
        id: 'ghost',
        name: 'Ghost',
        icon: ICONS.SHIP,
        description: 'Can phase through asteroids briefly.',
        unlocked: false,
        unlockCondition: 'Complete Story World 3',
        stats: {
            speed: 220,
            acceleration: 220,
            rotationSpeed: 4.5,
            maxSpeed: 450,
            friction: 0.975,
            size: 18,
            hp: 2,
            phaseAbility: true,
            phaseDuration: 3,
            phaseCooldown: 10
        },
        colors: {
            primary: '#aaaaff',
            secondary: '#8888ff',
            thrust: '#4444ff'
        }
    },
    FIGHTER: {
        id: 'fighter',
        name: 'Fighter',
        icon: ICONS.SHIP,
        description: 'Enhanced weapons and fire rate.',
        unlocked: false,
        unlockCondition: 'Complete Story World 4',
        stats: {
            speed: 200,
            acceleration: 220,
            rotationSpeed: 4.2,
            maxSpeed: 420,
            friction: 0.98,
            size: 22,
            hp: 3,
            fireRateBonus: 1.5,
            damageBonus: 1.25
        },
        colors: {
            primary: '#ff4444',
            secondary: '#ff0000',
            thrust: '#ffaa00'
        }
    },
    ULTIMATE: {
        id: 'ultimate',
        name: 'Ultimate',
        icon: ICONS.SHIP,
        description: 'The pinnacle of spacecraft engineering.',
        unlocked: false,
        unlockCondition: '100% Story Completion',
        stats: {
            speed: 280,
            acceleration: 280,
            rotationSpeed: 4.5,
            maxSpeed: 500,
            friction: 0.97,
            size: 22,
            hp: 5,
            fireRateBonus: 1.3,
            damageBonus: 1.4,
            phaseAbility: true,
            phaseDuration: 2,
            phaseCooldown: 15,
            shieldRegenRate: 0.1
        },
        colors: {
            primary: '#ffdd00',
            secondary: '#ff8800',
            thrust: '#ff4400'
        }
    }
};

// Upgrade Categories
export const UPGRADE_CATEGORIES = {
    HULL: {
        id: 'hull',
        name: 'Hull',
        icon: ICONS.SHIELD || ICONS.POWERUP, // Fallback to POWERUP if SHIELD not yet defined in ICONS (actually I defined POWERUP but maybe not SHIELD)
        description: 'Increase maximum HP',
        maxLevel: 5,
        costBase: 100,
        costMultiplier: 1.5,
        effect: { hp: 1 } // +1 HP per level
    },
    ENGINES: {
        id: 'engines',
        name: 'Engines',
        icon: ICONS.POWERUP, // Generic powerup icon for now
        description: 'Increase speed and acceleration',
        maxLevel: 5,
        costBase: 80,
        costMultiplier: 1.5,
        effect: { speed: 0.1, acceleration: 0.1 } // +10% per level
    },
    WEAPONS: {
        id: 'weapons',
        name: 'Weapons',
        icon: ICONS.WEAPON,
        description: 'Increase damage output',
        maxLevel: 5,
        costBase: 120,
        costMultiplier: 1.6,
        effect: { damage: 0.15 } // +15% per level
    },
    SHIELDS: {
        id: 'shields',
        name: 'Shields',
        icon: ICONS.SHIELD || ICONS.POWERUP,
        description: 'Reduce damage taken',
        maxLevel: 5,
        costBase: 150,
        costMultiplier: 1.7,
        effect: { damageReduction: 0.1 } // -10% damage per level
    }
};

/**
 * Ship System Manager
 */
export class ShipSystem {
    constructor(game) {
        this.game = game;
        this.currentShip = 'classic';
        this.unlockedShips = this.loadUnlocked();
        this.upgrades = this.loadUpgrades();
        this.coins = this.loadCoins();
        
        // Ability state
        this.phaseActive = false;
        this.phaseCooldown = 0;
        this.phaseTimer = 0;
        
        // Shield regen state
        this.shieldRegenTimer = 0;
    }

    loadUnlocked() {
        try {
            const data = JSON.parse(localStorage.getItem('asteroids_ships') || '[]');
            return new Set(['classic', ...data]);
        } catch {
            return new Set(['classic']);
        }
    }

    saveUnlocked() {
        const arr = [...this.unlockedShips].filter(s => s !== 'classic');
        localStorage.setItem('asteroids_ships', JSON.stringify(arr));
    }

    loadUpgrades() {
        try {
            return JSON.parse(localStorage.getItem('asteroids_ship_upgrades') || '{}');
        } catch {
            return {};
        }
    }

    saveUpgrades() {
        localStorage.setItem('asteroids_ship_upgrades', JSON.stringify(this.upgrades));
    }

    loadCoins() {
        try {
            return parseInt(localStorage.getItem('asteroids_coins') || '0');
        } catch {
            return 0;
        }
    }

    saveCoins() {
        localStorage.setItem('asteroids_coins', this.coins.toString());
    }

    // Ship Access
    unlockShip(shipId) {
        if (this.unlockedShips.has(shipId)) return false;
        this.unlockedShips.add(shipId);
        this.saveUnlocked();
        this.showUnlockMessage(SHIPS[shipId.toUpperCase()]);
        return true;
    }

    isShipUnlocked(shipId) {
        return this.unlockedShips.has(shipId);
    }

    setCurrentShip(shipId) {
        if (!this.isShipUnlocked(shipId)) return false;
        this.currentShip = shipId;
        return true;
    }

    getCurrentShip() {
        return SHIPS[this.currentShip.toUpperCase()];
    }

    // Stats with upgrades applied
    getEffectiveStats() {
        const ship = this.getCurrentShip();
        const baseStats = { ...ship.stats };
        
        // Apply upgrades
        for (const [category, data] of Object.entries(this.upgrades)) {
            const upgradeInfo = UPGRADE_CATEGORIES[category.toUpperCase()];
            if (!upgradeInfo) continue;
            
            const level = data.level || 0;
            for (const [stat, value] of Object.entries(upgradeInfo.effect)) {
                if (stat === 'hp') {
                    baseStats.hp = (baseStats.hp || 3) + value * level;
                } else if (stat === 'speed' || stat === 'acceleration') {
                    baseStats[stat] *= (1 + value * level);
                } else if (stat === 'damage') {
                    baseStats.damageBonus = (baseStats.damageBonus || 1) * (1 + value * level);
                } else if (stat === 'damageReduction') {
                    baseStats.damageReduction = (baseStats.damageReduction || 0) + value * level;
                }
            }
        }
        
        return baseStats;
    }

    // Upgrade System
    getUpgradeLevel(category) {
        return this.upgrades[category]?.level || 0;
    }

    getUpgradeCost(category) {
        const upgradeInfo = UPGRADE_CATEGORIES[category.toUpperCase()];
        if (!upgradeInfo) return Infinity;
        
        const level = this.getUpgradeLevel(category);
        if (level >= upgradeInfo.maxLevel) return Infinity;
        
        return Math.floor(upgradeInfo.costBase * Math.pow(upgradeInfo.costMultiplier, level));
    }

    canAffordUpgrade(category) {
        return this.coins >= this.getUpgradeCost(category);
    }

    purchaseUpgrade(category) {
        const cost = this.getUpgradeCost(category);
        if (cost === Infinity || this.coins < cost) return false;
        
        this.coins -= cost;
        this.saveCoins();
        
        if (!this.upgrades[category]) {
            this.upgrades[category] = { level: 0 };
        }
        this.upgrades[category].level++;
        this.saveUpgrades();
        
        return true;
    }

    addCoins(amount) {
        this.coins += amount;
        this.saveCoins();
    }

    // Update (called each frame)
    update(dt) {
        // Phase ability cooldown
        if (this.phaseCooldown > 0) {
            this.phaseCooldown -= dt;
        }
        
        // Phase active timer
        if (this.phaseActive) {
            this.phaseTimer -= dt;
            if (this.phaseTimer <= 0) {
                this.deactivatePhase();
            }
        }
        
        // Shield regen
        const stats = this.getEffectiveStats();
        if (stats.shieldRegenRate && this.game.lives < stats.hp) {
            this.shieldRegenTimer += dt;
            if (this.shieldRegenTimer >= 1 / stats.shieldRegenRate) {
                this.shieldRegenTimer = 0;
                // Regen logic could go here
            }
        }
    }

    // Phase Ability
    canPhase() {
        const stats = this.getEffectiveStats();
        return stats.phaseAbility && this.phaseCooldown <= 0 && !this.phaseActive;
    }

    activatePhase() {
        if (!this.canPhase()) return false;
        
        const stats = this.getEffectiveStats();
        this.phaseActive = true;
        this.phaseTimer = stats.phaseDuration;
        
        this.showMessage('PHASE ACTIVE', '#aaaaff');
        return true;
    }

    deactivatePhase() {
        const stats = this.getEffectiveStats();
        this.phaseActive = false;
        this.phaseCooldown = stats.phaseCooldown;
    }

    isPhasing() {
        return this.phaseActive;
    }

    getPhaseCooldownProgress() {
        const stats = this.getEffectiveStats();
        if (!stats.phaseAbility) return 1;
        return 1 - (this.phaseCooldown / stats.phaseCooldown);
    }

    // Damage calculation
    calculateDamage(baseDamage) {
        const stats = this.getEffectiveStats();
        const reduction = stats.damageReduction || 0;
        return Math.max(1, baseDamage * (1 - reduction));
    }

    // Fire rate modifier
    getFireRateMultiplier() {
        const stats = this.getEffectiveStats();
        return stats.fireRateBonus || 1;
    }

    // Damage modifier
    getDamageMultiplier() {
        const stats = this.getEffectiveStats();
        return stats.damageBonus || 1;
    }

    // Rendering
    render(ctx, x, y, angle, thrusting) {
        const ship = this.getCurrentShip();
        const stats = this.getEffectiveStats();
        const colors = ship.colors;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Phase effect
        if (this.phaseActive) {
            ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 100) * 0.2;
        }

        // Ship outline based on ship type
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 2;
        
        switch (this.currentShip) {
            case 'classic':
                this.drawClassicShip(ctx, stats.size);
                break;
            case 'speedster':
                this.drawSpeedsterShip(ctx, stats.size);
                break;
            case 'tank':
                this.drawTankShip(ctx, stats.size);
                break;
            case 'ghost':
                this.drawGhostShip(ctx, stats.size);
                break;
            case 'fighter':
                this.drawFighterShip(ctx, stats.size);
                break;
            case 'ultimate':
                this.drawUltimateShip(ctx, stats.size);
                break;
            default:
                this.drawClassicShip(ctx, stats.size);
        }

        // Thrust flame
        if (thrusting) {
            ctx.strokeStyle = colors.thrust;
            this.drawThrust(ctx, stats.size);
        }

        ctx.restore();
    }

    drawClassicShip(ctx, size) {
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(-size * 0.75, -size * 0.6);
        ctx.lineTo(-size * 0.4, 0);
        ctx.lineTo(-size * 0.75, size * 0.6);
        ctx.closePath();
        ctx.stroke();
    }

    drawSpeedsterShip(ctx, size) {
        ctx.beginPath();
        ctx.moveTo(size * 1.2, 0);
        ctx.lineTo(-size * 0.5, -size * 0.4);
        ctx.lineTo(-size * 0.3, 0);
        ctx.lineTo(-size * 0.5, size * 0.4);
        ctx.closePath();
        ctx.stroke();
        
        // Speed lines
        ctx.beginPath();
        ctx.moveTo(-size * 0.2, -size * 0.3);
        ctx.lineTo(size * 0.4, -size * 0.15);
        ctx.moveTo(-size * 0.2, size * 0.3);
        ctx.lineTo(size * 0.4, size * 0.15);
        ctx.stroke();
    }

    drawTankShip(ctx, size) {
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(-size * 0.6, -size * 0.8);
        ctx.lineTo(-size * 0.8, -size * 0.6);
        ctx.lineTo(-size * 0.6, 0);
        ctx.lineTo(-size * 0.8, size * 0.6);
        ctx.lineTo(-size * 0.6, size * 0.8);
        ctx.closePath();
        ctx.stroke();
        
        // Shield bars
        ctx.strokeStyle = '#4444ff';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.9, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
    }

    drawGhostShip(ctx, size) {
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(-size * 0.6, -size * 0.5);
        ctx.bezierCurveTo(-size * 0.8, 0, -size * 0.8, 0, -size * 0.6, size * 0.5);
        ctx.closePath();
        ctx.stroke();
        
        // Ghost aura
        ctx.strokeStyle = 'rgba(170, 170, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.9, size * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawFighterShip(ctx, size) {
        // Main body
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(-size * 0.5, -size * 0.5);
        ctx.lineTo(-size * 0.3, 0);
        ctx.lineTo(-size * 0.5, size * 0.5);
        ctx.closePath();
        ctx.stroke();
        
        // Wings
        ctx.beginPath();
        ctx.moveTo(-size * 0.2, -size * 0.5);
        ctx.lineTo(-size * 0.6, -size * 0.9);
        ctx.lineTo(-size * 0.7, -size * 0.5);
        ctx.moveTo(-size * 0.2, size * 0.5);
        ctx.lineTo(-size * 0.6, size * 0.9);
        ctx.lineTo(-size * 0.7, size * 0.5);
        ctx.stroke();
        
        // Weapon mounts
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(size * 0.3, -size * 0.3, 3, 0, Math.PI * 2);
        ctx.arc(size * 0.3, size * 0.3, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawUltimateShip(ctx, size) {
        // Hexagonal body
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const r = i === 0 ? size * 1.2 : size * 0.7;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Inner glow
        ctx.strokeStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        
        // Crown
        ctx.fillStyle = '#ffdd00';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawThrust(ctx, size) {
        ctx.beginPath();
        ctx.moveTo(-size * 0.4, -size * 0.25);
        ctx.lineTo(-size - Math.random() * size * 0.5, 0);
        ctx.lineTo(-size * 0.4, size * 0.25);
        ctx.stroke();
    }

    // UI
    showUnlockMessage(ship) {
        const msg = document.createElement('div');
        msg.className = 'ship-unlock-message';
        msg.innerHTML = `
            <div class="unlock-icon">${ship.icon}</div>
            <div class="unlock-text">
                <div class="unlock-title">NEW SHIP UNLOCKED!</div>
                <div class="unlock-name">${ship.name}</div>
            </div>
        `;
        document.body.appendChild(msg);
        
        setTimeout(() => msg.classList.add('show'), 10);
        setTimeout(() => {
            msg.classList.remove('show');
            setTimeout(() => msg.remove(), 500);
        }, 3500);
    }

    showMessage(text, color) {
        const msg = document.createElement('div');
        msg.className = 'ship-message';
        msg.textContent = text;
        msg.style.color = color;
        document.body.appendChild(msg);
        
        setTimeout(() => msg.classList.add('show'), 10);
        setTimeout(() => {
            msg.classList.remove('show');
            setTimeout(() => msg.remove(), 300);
        }, 1500);
    }

    openShipMenu() {
        const overlay = document.createElement('div');
        overlay.className = 'ship-menu-overlay';
        
        let menuHTML = `
            <div class="ship-menu">
                <div class="ship-menu-header">
                    <h2>${ICONS.SHIP} Ship Selection</h2>
                    <div class="coins-display">💰 ${this.coins.toLocaleString()}</div>
                </div>
                <div class="ship-grid">
        `;

        for (const ship of Object.values(SHIPS)) {
            const unlocked = this.isShipUnlocked(ship.id);
            const current = this.currentShip === ship.id;
            
            menuHTML += `
                <div class="ship-card ${unlocked ? 'unlocked' : 'locked'} ${current ? 'current' : ''}"
                     data-ship="${ship.id}">
                    <div class="ship-icon">${ship.icon}</div>
                    <div class="ship-name">${ship.name}</div>
                    <div class="ship-desc">${ship.description}</div>
                    <div class="ship-stats">
                        <span>SPD: ${Math.round(ship.stats.speed / 40)}/10</span>
                        <span>HP: ${ship.stats.hp}</span>
                    </div>
                    ${!unlocked ? `<div class="ship-unlock">🔒 ${ship.unlockCondition}</div>` : ''}
                    ${current ? '<div class="ship-equipped">EQUIPPED</div>' : ''}
                </div>
            `;
        }

        // Upgrades section
        menuHTML += `
            </div>
            <h3>${ICONS.POWERUP} Upgrades</h3>
            <div class="upgrade-grid">
        `;

        for (const upgrade of Object.values(UPGRADE_CATEGORIES)) {
            const level = this.getUpgradeLevel(upgrade.id);
            const cost = this.getUpgradeCost(upgrade.id);
            const canAfford = this.canAffordUpgrade(upgrade.id);
            const maxed = level >= upgrade.maxLevel;
            
            menuHTML += `
                <div class="upgrade-card ${canAfford && !maxed ? 'available' : ''} ${maxed ? 'maxed' : ''}"
                     data-upgrade="${upgrade.id}">
                    <div class="upgrade-icon">${upgrade.icon}</div>
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-level">${level}/${upgrade.maxLevel}</div>
                    ${maxed ? '<div class="upgrade-maxed">MAXED</div>' : `<div class="upgrade-cost">💰 ${cost.toLocaleString()}</div>`}
                </div>
            `;
        }

        menuHTML += '</div><button class="ship-close">Close</button></div>';
        overlay.innerHTML = menuHTML;
        document.body.appendChild(overlay);

        // Event handlers
        overlay.querySelector('.ship-close').onclick = () => overlay.remove();
        
        overlay.querySelectorAll('.ship-card.unlocked').forEach(card => {
            card.onclick = () => {
                this.setCurrentShip(card.dataset.ship);
                overlay.remove();
                this.openShipMenu(); // Refresh
            };
        });

        overlay.querySelectorAll('.upgrade-card.available').forEach(card => {
            card.onclick = () => {
                if (this.purchaseUpgrade(card.dataset.upgrade)) {
                    overlay.remove();
                    this.openShipMenu(); // Refresh
                }
            };
        });
        
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    reset() {
        this.phaseActive = false;
        this.phaseCooldown = 0;
        this.phaseTimer = 0;
        this.shieldRegenTimer = 0;
    }
}
