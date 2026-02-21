/**
 * Asteroids - Weapon System
 * Multiple weapon types, upgrades, and firing mechanics
 */

// Weapon Definitions
import { ICONS } from './AsteroidsIcons.js';

export const WEAPONS = {
    // Primary Weapons
    PULSE_CANNON: {
        id: 'pulse_cannon',
        name: 'Pulse Cannon',
        type: 'primary',
        icon: ICONS.WEAPON, /* previously 🔫 */
        description: 'Standard rapid-fire energy weapon',
        unlocked: true,
        stats: {
            damage: 1,
            fireRate: 4, // shots per second
            bulletSpeed: 500,
            bulletLifetime: 1.5,
            bulletSize: 3,
            color: '#ffffff'
        }
    },
    SPREAD_GUN: {
        id: 'spread_gun',
        name: 'Spread Gun',
        type: 'primary',
        icon: ICONS.WEAPON, /* previously 🔱 */
        description: 'Fires 3 bullets in a spread pattern',
        unlocked: false,
        unlockCondition: 'Reach Wave 10',
        stats: {
            damage: 0.8,
            fireRate: 2,
            bulletSpeed: 450,
            bulletLifetime: 1.2,
            bulletSize: 3,
            spreadCount: 3,
            spreadAngle: 0.25, // radians
            color: '#ff8800'
        }
    },
    LASER_BEAM: {
        id: 'laser_beam',
        name: 'Laser Beam',
        type: 'primary',
        icon: ICONS.WEAPON, /* previously 📡 */
        description: 'Continuous damage beam with infinite range',
        unlocked: false,
        unlockCondition: 'Complete Story World 2',
        stats: {
            damage: 0.5, // per tick (60 fps)
            fireRate: 60, // continuous
            beamWidth: 4,
            beamColor: '#00ff00',
            beamGlow: '#88ff88'
        }
    },
    PLASMA_RIFLE: {
        id: 'plasma_rifle',
        name: 'Plasma Rifle',
        type: 'primary',
        icon: ICONS.WEAPON, /* previously 🌀 */
        description: 'Charged shots with area damage',
        unlocked: false,
        unlockCondition: 'Complete Story World 3',
        stats: {
            damage: 3,
            fireRate: 1.5,
            bulletSpeed: 600,
            bulletLifetime: 2,
            bulletSize: 8,
            chargeTime: 0.5,
            splashRadius: 50,
            color: '#aa00ff'
        }
    },
    RAIL_GUN: {
        id: 'rail_gun',
        name: 'Rail Gun',
        type: 'primary',
        icon: ICONS.WEAPON, /* previously ⚡ */
        description: 'Piercing projectile that goes through asteroids',
        unlocked: false,
        unlockCondition: 'Complete Story World 4',
        stats: {
            damage: 5,
            fireRate: 0.5,
            bulletSpeed: 1500,
            bulletLifetime: 0.5,
            bulletSize: 3,
            piercing: true,
            color: '#00ffff'
        }
    },
    NOVA_CANNON: {
        id: 'nova_cannon',
        name: 'Nova Cannon',
        type: 'primary',
        icon: ICONS.BOMB || ICONS.WEAPON, /* previously 💥 */
        description: 'Devastating area damage with each shot',
        unlocked: false,
        unlockCondition: 'Complete Story Mode',
        stats: {
            damage: 10,
            fireRate: 0.3,
            bulletSpeed: 400,
            bulletLifetime: 1,
            bulletSize: 15,
            explosionRadius: 100,
            color: '#ff4400'
        }
    },

    // Secondary Weapons
    HOMING_MISSILES: {
        id: 'homing_missiles',
        name: 'Homing Missiles',
        type: 'secondary',
        icon: ICONS.MISSILE, /* previously 🚀 */
        description: 'Lock-on missiles that track targets',
        ammoPerPickup: 5,
        stats: {
            damage: 2,
            speed: 300,
            turnRate: 4,
            lifetime: 4,
            size: 6,
            color: '#ff0088'
        }
    },
    SMART_BOMBS: {
        id: 'smart_bombs',
        name: 'Smart Bombs',
        type: 'secondary',
        icon: ICONS.BOMB, /* previously 💣 */
        description: 'Screen-clearing explosions',
        ammoPerPickup: 1,
        stats: {
            damage: 100,
            radius: 1000, // full screen
            color: '#ff4400'
        }
    },
    MINES: {
        id: 'mines',
        name: 'Space Mines',
        type: 'secondary',
        icon: ICONS.BOMB, /* previously 💠 */
        description: 'Deployable proximity mines',
        ammoPerPickup: 3,
        stats: {
            damage: 4,
            triggerRadius: 60,
            explosionRadius: 80,
            lifetime: 20,
            size: 10,
            color: '#ffff00'
        }
    },
    EMP_PULSE: {
        id: 'emp_pulse',
        name: 'EMP Pulse',
        type: 'secondary',
        icon: ICONS.ENGINE, /* previously ⚡ */
        description: 'Stuns all enemies briefly',
        ammoPerPickup: 2,
        stats: {
            stunDuration: 3,
            radius: 400,
            color: '#00aaff'
        }
    }
};

/**
 * Weapon System Manager
 */
export class WeaponSystem {
    constructor(game) {
        this.game = game;
        this.currentPrimary = 'pulse_cannon';
        this.secondaryAmmo = {};
        this.unlockedWeapons = this.loadUnlocked();
        this.fireTimer = 0;
        this.isCharging = false;
        this.chargeTime = 0;
        
        // Laser state
        this.laserActive = false;
        this.laserHits = [];
        
        // Mines deployed
        this.mines = [];
        
        // Upgrade levels
        this.upgrades = this.loadUpgrades();
    }

    loadUnlocked() {
        try {
            const data = JSON.parse(localStorage.getItem('asteroids_weapons') || '[]');
            return new Set(['pulse_cannon', ...data]);
        } catch {
            return new Set(['pulse_cannon']);
        }
    }

    saveUnlocked() {
        const arr = [...this.unlockedWeapons].filter(w => w !== 'pulse_cannon');
        localStorage.setItem('asteroids_weapons', JSON.stringify(arr));
    }

    loadUpgrades() {
        try {
            return JSON.parse(localStorage.getItem('asteroids_weapon_upgrades') || '{}');
        } catch {
            return {};
        }
    }

    saveUpgrades() {
        localStorage.setItem('asteroids_weapon_upgrades', JSON.stringify(this.upgrades));
    }

    // Weapon Access
    unlockWeapon(weaponId) {
        if (this.unlockedWeapons.has(weaponId)) return false;
        this.unlockedWeapons.add(weaponId);
        this.saveUnlocked();
        this.showUnlockMessage(WEAPONS[weaponId.toUpperCase()]);
        return true;
    }

    isWeaponUnlocked(weaponId) {
        return this.unlockedWeapons.has(weaponId);
    }

    setPrimaryWeapon(weaponId) {
        if (!this.isWeaponUnlocked(weaponId)) return false;
        this.currentPrimary = weaponId;
        this.fireTimer = 0;
        this.isCharging = false;
        this.chargeTime = 0;
        this.laserActive = false;
        return true;
    }

    getCurrentWeapon() {
        return WEAPONS[this.currentPrimary.toUpperCase()];
    }

    // Upgrade System
    getUpgradeLevel(weaponId) {
        return this.upgrades[weaponId] || 0;
    }

    upgradeWeapon(weaponId) {
        const currentLevel = this.getUpgradeLevel(weaponId);
        if (currentLevel >= 5) return false; // Max level
        
        this.upgrades[weaponId] = currentLevel + 1;
        this.saveUpgrades();
        return true;
    }

    getUpgradedStats(weaponId) {
        const weapon = WEAPONS[weaponId.toUpperCase()];
        if (!weapon) return null;
        
        const level = this.getUpgradeLevel(weaponId);
        const stats = { ...weapon.stats };
        
        // Apply upgrade bonuses
        if (stats.damage) stats.damage *= (1 + level * 0.15);
        if (stats.fireRate) stats.fireRate *= (1 + level * 0.1);
        if (stats.bulletSpeed) stats.bulletSpeed *= (1 + level * 0.08);
        
        return stats;
    }

    // Firing
    update(dt) {
        this.fireTimer = Math.max(0, this.fireTimer - dt);
        
        // Update charge for plasma rifle
        if (this.isCharging) {
            this.chargeTime += dt;
        }
        
        // Update mines
        this.updateMines(dt);
        
        // Laser hit detection
        if (this.laserActive) {
            this.updateLaser();
        }
    }

    tryFire(shipX, shipY, shipAngle, shipVX, shipVY) {
        if (this.fireTimer > 0) return [];
        
        const weapon = this.getCurrentWeapon();
        const stats = this.getUpgradedStats(this.currentPrimary);
        
        // Apply power-up fire rate multiplier
        const fireRateMultiplier = this.game.powerUps?.getFireRateMultiplier() || 1;
        
        this.fireTimer = 1 / (stats.fireRate * fireRateMultiplier);
        
        const bullets = [];
        
        switch (this.currentPrimary) {
            case 'pulse_cannon':
                bullets.push(this.createBullet(shipX, shipY, shipAngle, shipVX, shipVY, stats));
                break;
                
            case 'spread_gun':
                const count = stats.spreadCount;
                const angleStep = stats.spreadAngle;
                for (let i = 0; i < count; i++) {
                    const offset = (i - (count - 1) / 2) * angleStep;
                    bullets.push(this.createBullet(shipX, shipY, shipAngle + offset, shipVX, shipVY, stats));
                }
                break;
                
            case 'laser_beam':
                this.laserActive = true;
                break;
                
            case 'plasma_rifle':
                if (!this.isCharging) {
                    this.isCharging = true;
                    this.chargeTime = 0;
                    return [];
                }
                if (this.chargeTime >= stats.chargeTime) {
                    bullets.push(this.createPlasmaBullet(shipX, shipY, shipAngle, stats));
                    this.isCharging = false;
                    this.chargeTime = 0;
                }
                break;
                
            case 'rail_gun':
                bullets.push(this.createRailBullet(shipX, shipY, shipAngle, stats));
                break;
                
            case 'nova_cannon':
                bullets.push(this.createNovaBullet(shipX, shipY, shipAngle, stats));
                break;
        }
        
        // Apply spread from power-up
        const spreadCount = this.game.powerUps?.getSpreadCount() || 1;
        if (spreadCount > 1 && this.currentPrimary === 'pulse_cannon') {
            bullets.push(this.createBullet(shipX, shipY, shipAngle - 0.2, shipVX, shipVY, stats));
            bullets.push(this.createBullet(shipX, shipY, shipAngle + 0.2, shipVX, shipVY, stats));
        }
        
        // Apply piercing from power-up
        if (this.game.powerUps?.isPiercing()) {
            bullets.forEach(b => b.piercing = true);
        }
        
        return bullets;
    }

    stopFiring() {
        this.laserActive = false;
        this.isCharging = false;
    }

    createBullet(x, y, angle, shipVX, shipVY, stats) {
        const tipOffset = 20;
        return {
            x: x + Math.cos(angle) * tipOffset,
            y: y + Math.sin(angle) * tipOffset,
            vx: Math.cos(angle) * stats.bulletSpeed + shipVX * 0.5,
            vy: Math.sin(angle) * stats.bulletSpeed + shipVY * 0.5,
            life: stats.bulletLifetime,
            damage: stats.damage,
            size: stats.bulletSize,
            color: stats.color,
            piercing: stats.piercing || false
        };
    }

    createPlasmaBullet(x, y, angle, stats) {
        return {
            ...this.createBullet(x, y, angle, 0, 0, stats),
            type: 'plasma',
            splashRadius: stats.splashRadius
        };
    }

    createRailBullet(x, y, angle, stats) {
        return {
            ...this.createBullet(x, y, angle, 0, 0, stats),
            type: 'rail',
            piercing: true,
            trail: []
        };
    }

    createNovaBullet(x, y, angle, stats) {
        return {
            ...this.createBullet(x, y, angle, 0, 0, stats),
            type: 'nova',
            explosionRadius: stats.explosionRadius
        };
    }

    // Laser
    updateLaser() {
        if (!this.laserActive) return;
        
        const ship = this.game.ship;
        const stats = this.getUpgradedStats('laser_beam');
        
        // Cast ray and find all asteroids hit
        this.laserHits = [];
        const rayLength = 1000;
        const endX = ship.x + Math.cos(ship.angle) * rayLength;
        const endY = ship.y + Math.sin(ship.angle) * rayLength;
        
        for (const asteroid of this.game.asteroids) {
            if (this.lineCircleIntersect(ship.x, ship.y, endX, endY, asteroid.x, asteroid.y, asteroid.radius)) {
                this.laserHits.push(asteroid);
                // Apply damage
                asteroid.hp = (asteroid.hp || 1) - stats.damage / 60;
                if (asteroid.hp <= 0) {
                    this.game.destroyAsteroid(this.game.asteroids.indexOf(asteroid));
                }
            }
        }
    }

    lineCircleIntersect(x1, y1, x2, y2, cx, cy, r) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const fx = x1 - cx;
        const fy = y1 - cy;
        
        const a = dx * dx + dy * dy;
        const b = 2 * (fx * dx + fy * dy);
        const c = fx * fx + fy * fy - r * r;
        
        const discriminant = b * b - 4 * a * c;
        return discriminant >= 0;
    }

    // Secondary Weapons
    addSecondaryAmmo(weaponId, amount) {
        this.secondaryAmmo[weaponId] = (this.secondaryAmmo[weaponId] || 0) + amount;
    }

    getSecondaryAmmo(weaponId) {
        return this.secondaryAmmo[weaponId] || 0;
    }

    fireSecondary(type, shipX, shipY, shipAngle) {
        if (!this.secondaryAmmo[type] || this.secondaryAmmo[type] <= 0) return null;
        
        this.secondaryAmmo[type]--;
        const weapon = WEAPONS[type.toUpperCase()];
        
        switch (type) {
            case 'homing_missiles':
                return this.createMissile(shipX, shipY, shipAngle, weapon.stats);
            case 'smart_bombs':
                this.detonateSmartBomb();
                return null;
            case 'mines':
                this.deployMine(shipX, shipY, weapon.stats);
                return null;
            case 'emp_pulse':
                this.triggerEMP(shipX, shipY, weapon.stats);
                return null;
        }
        
        return null;
    }

    createMissile(x, y, angle, stats) {
        return {
            type: 'missile',
            x,
            y,
            vx: Math.cos(angle) * stats.speed,
            vy: Math.sin(angle) * stats.speed,
            angle,
            speed: stats.speed,
            turnRate: stats.turnRate,
            life: stats.lifetime,
            damage: stats.damage,
            size: stats.size,
            color: stats.color,
            target: null
        };
    }

    updateMissile(missile, dt, asteroids, ufos) {
        // Find nearest target
        if (!missile.target) {
            let minDist = Infinity;
            const targets = [...asteroids, ...ufos];
            for (const target of targets) {
                const dist = Math.hypot(target.x - missile.x, target.y - missile.y);
                if (dist < minDist) {
                    minDist = dist;
                    missile.target = target;
                }
            }
        }
        
        // Turn towards target
        if (missile.target) {
            const targetAngle = Math.atan2(missile.target.y - missile.y, missile.target.x - missile.x);
            let angleDiff = targetAngle - missile.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            missile.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), missile.turnRate * dt);
            
            missile.vx = Math.cos(missile.angle) * missile.speed;
            missile.vy = Math.sin(missile.angle) * missile.speed;
        }
        
        missile.x += missile.vx * dt;
        missile.y += missile.vy * dt;
        missile.life -= dt;
    }

    detonateSmartBomb() {
        // Clear all asteroids
        this.game.clearAllAsteroids();
        
        // Visual effect
        this.game.screenShake(20);
        this.game.flashScreen('#ff4400');
    }

    deployMine(x, y, stats) {
        this.mines.push({
            x,
            y,
            triggerRadius: stats.triggerRadius,
            explosionRadius: stats.explosionRadius,
            life: stats.lifetime,
            damage: stats.damage,
            size: stats.size,
            color: stats.color,
            armed: false
        });
    }

    updateMines(dt) {
        for (let i = this.mines.length - 1; i >= 0; i--) {
            const mine = this.mines[i];
            mine.life -= dt;
            
            // Arm after 1 second
            if (!mine.armed && mine.life < this.mines[i].life - 1) {
                mine.armed = true;
            }
            
            // Check trigger
            if (mine.armed) {
                for (const asteroid of this.game.asteroids) {
                    const dist = Math.hypot(asteroid.x - mine.x, asteroid.y - mine.y);
                    if (dist < mine.triggerRadius) {
                        this.explodeMine(mine);
                        this.mines.splice(i, 1);
                        break;
                    }
                }
            }
            
            // Expire
            if (mine.life <= 0) {
                this.mines.splice(i, 1);
            }
        }
    }

    explodeMine(mine) {
        // Damage asteroids in radius
        for (let i = this.game.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.game.asteroids[i];
            const dist = Math.hypot(asteroid.x - mine.x, asteroid.y - mine.y);
            if (dist < mine.explosionRadius) {
                asteroid.hp = (asteroid.hp || 1) - mine.damage;
                if (asteroid.hp <= 0) {
                    this.game.destroyAsteroid(i);
                }
            }
        }
        
        // Visual effect
        this.game.spawnExplosion(mine.x, mine.y, mine.color);
    }

    triggerEMP(x, y, stats) {
        // Stun all enemies
        for (const asteroid of this.game.asteroids) {
            const dist = Math.hypot(asteroid.x - x, asteroid.y - y);
            if (dist < stats.radius) {
                asteroid.stunned = true;
                asteroid.stunTimer = stats.stunDuration;
            }
        }
        
        for (const ufo of this.game.ufos) {
            const dist = Math.hypot(ufo.x - x, ufo.y - y);
            if (dist < stats.radius) {
                ufo.stunned = true;
                ufo.stunTimer = stats.stunDuration;
            }
        }
        
        // Visual effect
        this.game.flashScreen('#00aaff');
    }

    // Rendering
    render(ctx) {
        // Render laser
        if (this.laserActive) {
            const ship = this.game.ship;
            const stats = this.getUpgradedStats('laser_beam');
            
            ctx.save();
            ctx.strokeStyle = stats.beamColor;
            ctx.lineWidth = stats.beamWidth;
            ctx.globalAlpha = 0.8 + Math.sin(Date.now() / 50) * 0.2;
            ctx.beginPath();
            ctx.moveTo(ship.x, ship.y);
            const endX = ship.x + Math.cos(ship.angle) * 1000;
            const endY = ship.y + Math.sin(ship.angle) * 1000;
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Glow
            ctx.strokeStyle = stats.beamGlow;
            ctx.lineWidth = stats.beamWidth * 2;
            ctx.globalAlpha = 0.3;
            ctx.stroke();
            ctx.restore();
        }
        
        // Render mines
        for (const mine of this.mines) {
            ctx.save();
            ctx.translate(mine.x, mine.y);
            
            // Outer ring
            ctx.strokeStyle = mine.armed ? mine.color : '#666666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, mine.size, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner dot (blinks when armed)
            if (mine.armed && Math.floor(Date.now() / 200) % 2 === 0) {
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(0, 0, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        // Render charging effect for plasma
        if (this.isCharging && this.currentPrimary === 'plasma_rifle') {
            const ship = this.game.ship;
            const stats = this.getUpgradedStats('plasma_rifle');
            const progress = Math.min(1, this.chargeTime / stats.chargeTime);
            
            ctx.save();
            ctx.fillStyle = `rgba(170, 0, 255, ${progress * 0.8})`;
            ctx.beginPath();
            ctx.arc(
                ship.x + Math.cos(ship.angle) * 20,
                ship.y + Math.sin(ship.angle) * 20,
                5 + progress * 10,
                0, Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }
    }

    // UI
    showUnlockMessage(weapon) {
        const msg = document.createElement('div');
        msg.className = 'weapon-unlock-message';
        msg.innerHTML = `
            <div class="unlock-icon">${weapon.icon}</div>
            <div class="unlock-text">
                <div class="unlock-title">NEW WEAPON UNLOCKED!</div>
                <div class="unlock-name">${weapon.name}</div>
            </div>
        `;
        document.body.appendChild(msg);
        
        setTimeout(() => msg.classList.add('show'), 10);
        setTimeout(() => {
            msg.classList.remove('show');
            setTimeout(() => msg.remove(), 500);
        }, 3500);
    }

    openWeaponMenu() {
        const overlay = document.createElement('div');
        overlay.className = 'weapon-menu-overlay';
        
        let menuHTML = `
            <div class="weapon-menu">
                <h2>${ICONS.WEAPON} Weapon Selection</h2>
                <div class="weapon-grid">
        `;

        const primaryWeapons = Object.values(WEAPONS).filter(w => w.type === 'primary');
        for (const weapon of primaryWeapons) {
            const unlocked = this.isWeaponUnlocked(weapon.id);
            const current = this.currentPrimary === weapon.id;
            const level = this.getUpgradeLevel(weapon.id);
            
            menuHTML += `
                <div class="weapon-card ${unlocked ? 'unlocked' : 'locked'} ${current ? 'current' : ''}"
                     data-weapon="${weapon.id}">
                    <div class="weapon-icon">${weapon.icon}</div>
                    <div class="weapon-name">${weapon.name}</div>
                    <div class="weapon-desc">${weapon.description}</div>
                    ${unlocked ? `<div class="weapon-level">Level ${level + 1}/6</div>` : `<div class="weapon-unlock">${ICONS.LOCK} ${weapon.unlockCondition}</div>`}
                    ${current ? `<div class="weapon-equipped">EQUIPPED</div>` : ''}
                </div>
            `;
        }

        menuHTML += '</div><button class="weapon-close">Close</button></div>';
        overlay.innerHTML = menuHTML;
        document.body.appendChild(overlay);

        overlay.querySelector('.weapon-close').onclick = () => overlay.remove();
        overlay.querySelectorAll('.weapon-card.unlocked').forEach(card => {
            card.onclick = () => {
                const weaponId = card.dataset.weapon;
                this.setPrimaryWeapon(weaponId);
                overlay.remove();
            };
        });
        
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    reset() {
        this.fireTimer = 0;
        this.isCharging = false;
        this.chargeTime = 0;
        this.laserActive = false;
        this.laserHits = [];
        this.mines = [];
    }
}
