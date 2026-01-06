/**
 * Asteroids - Power-Up System
 * 15 different power-ups with effects, spawning, and management
 */

// Power-Up Definitions
import { ICONS } from './AsteroidsIcons.js';

export const POWER_UPS = {
    // Defensive
    SHIELD: {
        id: 'shield',
        name: 'Shield',
        icon: ICONS.SHIELD || ICONS.POWERUP,
        color: '#00aaff',
        duration: 0, // Permanent until broken
        charges: 3,
        chance: 0.12,
        effect: 'shield',
        description: 'Absorbs up to 3 hits'
    },
    EXTRA_LIFE: {
        id: 'extra_life',
        name: 'Extra Life',
        icon: ICONS.HEART || ICONS.LIVES,
        color: '#ff4444',
        duration: 0, // Instant
        chance: 0.05,
        effect: 'life',
        description: '+1 Life'
    },
    GHOST: {
        id: 'ghost',
        name: 'Ghost',
        icon: ICONS.GHOST || ICONS.SHIP,
        color: '#aaaaff',
        duration: 6,
        chance: 0.06,
        effect: 'phase',
        description: 'Phase through asteroids'
    },

    // Offensive
    RAPID_FIRE: {
        id: 'rapid_fire',
        name: 'Rapid Fire',
        icon: ICONS.ENGINE,
        color: '#ffff00',
        duration: 10,
        chance: 0.10,
        effect: 'rapid',
        description: '3x fire rate'
    },
    MULTI_SHOT: {
        id: 'multi_shot',
        name: 'Multi-Shot',
        icon: ICONS.WEAPON,
        color: '#ff8800',
        duration: 12,
        chance: 0.08,
        effect: 'spread',
        description: 'Fire 3 bullets at once'
    },
    MISSILES: {
        id: 'missiles',
        name: 'Missiles',
        icon: ICONS.MISSILE,
        color: '#ff0088',
        duration: 0,
        uses: 5,
        chance: 0.07,
        effect: 'missiles',
        description: 'Homing missiles (5 uses)'
    },
    LASER: {
        id: 'laser',
        name: 'Laser',
        icon: ICONS.WEAPON, /* previously 🔫 */
        color: '#00ff00',
        duration: 8,
        chance: 0.06,
        effect: 'laser',
        description: 'Continuous laser beam'
    },
    BOMB: {
        id: 'bomb',
        name: 'Bomb',
        icon: ICONS.BOMB,
        color: '#ff4400',
        duration: 0, // Instant
        chance: 0.04,
        effect: 'bomb',
        description: 'Clear all asteroids on screen'
    },
    PIERCING: {
        id: 'piercing',
        name: 'Piercing',
        icon: ICONS.TARGET,
        color: '#ff00ff',
        duration: 10,
        chance: 0.07,
        effect: 'pierce',
        description: 'Bullets pierce through asteroids'
    },

    // Movement
    SPEED_BOOST: {
        id: 'speed_boost',
        name: 'Speed Boost',
        icon: ICONS.ENGINE, /* previously 💨 */
        color: '#00ffff',
        duration: 10,
        chance: 0.08,
        effect: 'speed',
        description: '2x ship speed'
    },

    // Utility
    SLOW_MOTION: {
        id: 'slow_motion',
        name: 'Slow Motion',
        icon: ICONS.CLOCK, /* previously ⏳ */
        color: '#8888ff',
        duration: 8,
        chance: 0.06,
        effect: 'slow',
        description: 'Slow down all asteroids'
    },
    MAGNET: {
        id: 'magnet',
        name: 'Magnet',
        icon: ICONS.MAGNET,
        color: '#ff6666',
        duration: 15,
        chance: 0.07,
        effect: 'magnet',
        description: 'Attract nearby power-ups'
    },
    DOUBLE_POINTS: {
        id: 'double_points',
        name: 'Double Points',
        icon: ICONS.STAR, /* previously ⭐ */
        color: '#ffdd00',
        duration: 20,
        chance: 0.09,
        effect: 'double_score',
        description: '2x score multiplier'
    },
    FREEZE: {
        id: 'freeze',
        name: 'Freeze',
        icon: ICONS.SNOWFLAKE, /* previously ❄️ */
        color: '#88ddff',
        duration: 5,
        chance: 0.05,
        effect: 'freeze',
        description: 'Freeze all asteroids'
    },
    BLACK_HOLE: {
        id: 'black_hole',
        name: 'Black Hole',
        icon: ICONS.BOMB, /* previously 🕳️ - reusing bomb or use generic circular shape */
        color: '#440088',
        duration: 8,
        chance: 0.04,
        effect: 'blackhole',
        description: 'Suck in nearby asteroids'
    }
};

/**
 * Power-Up System Manager
 */
export class PowerUpSystem {
    constructor(game) {
        this.game = game;
        this.activePowerUps = []; // Currently spawned on screen
        this.activeEffects = {}; // Currently active effects on player
        this.spawnTimer = 0;
        this.spawnInterval = 10; // Base spawn interval in seconds
        this.stats = {
            collected: 0,
            byType: {}
        };
        this.loadStats();
    }

    loadStats() {
        try {
            const data = JSON.parse(localStorage.getItem('asteroids_powerup_stats') || '{}');
            this.stats = {
                collected: data.collected || 0,
                byType: data.byType || {}
            };
        } catch {
            this.stats = { collected: 0, byType: {} };
        }
    }

    saveStats() {
        localStorage.setItem('asteroids_powerup_stats', JSON.stringify(this.stats));
    }

    // Update (called each frame)
    update(dt) {
        // Spawn timer
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnRandomPowerUp();
        }

        // Update spawned power-ups
        for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
            const powerUp = this.activePowerUps[i];
            
            // Move if has velocity
            if (powerUp.vx || powerUp.vy) {
                powerUp.x += powerUp.vx * dt;
                powerUp.y += powerUp.vy * dt;
            }
            
            // Lifetime
            powerUp.lifetime -= dt;
            if (powerUp.lifetime <= 0) {
                this.activePowerUps.splice(i, 1);
                continue;
            }
            
            // Screen wrap
            this.wrapPosition(powerUp);
            
            // Magnet effect - attract to player
            if (this.hasEffect('magnet')) {
                const dx = this.game.ship.x - powerUp.x;
                const dy = this.game.ship.y - powerUp.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 200 && dist > 0) {
                    const strength = 150 / dist;
                    powerUp.x += (dx / dist) * strength * dt * 60;
                    powerUp.y += (dy / dist) * strength * dt * 60;
                }
            }
        }

        // Update active effects durations
        for (const [effectId, effect] of Object.entries(this.activeEffects)) {
            if (effect.duration > 0) {
                effect.duration -= dt;
                if (effect.duration <= 0) {
                    this.deactivateEffect(effectId);
                }
            }
        }

        // Update visual effects for active power-ups
        this.updateEffects(dt);
    }

    // Spawning
    spawnRandomPowerUp() {
        const powerUpList = Object.values(POWER_UPS);
        
        // Weighted random selection based on chance
        const totalChance = powerUpList.reduce((sum, p) => sum + p.chance, 0);
        let random = Math.random() * totalChance;
        
        let selectedPowerUp = powerUpList[0];
        for (const powerUp of powerUpList) {
            random -= powerUp.chance;
            if (random <= 0) {
                selectedPowerUp = powerUp;
                break;
            }
        }

        this.spawnPowerUp(selectedPowerUp);
    }

    spawnPowerUp(powerUpData, x = null, y = null) {
        // Random position if not specified
        if (x === null) {
            x = Math.random() * this.game.canvas.width;
            y = Math.random() * this.game.canvas.height;
        }

        const powerUp = {
            ...powerUpData,
            x,
            y,
            radius: 15,
            lifetime: 15, // Seconds before despawning
            rotation: 0,
            pulse: 0
        };

        this.activePowerUps.push(powerUp);
    }

    // Spawn from asteroid destruction (chance-based)
    trySpawnFromAsteroid(x, y) {
        if (Math.random() < 0.15) { // 15% chance
            this.spawnRandomPowerUp();
            const powerUp = this.activePowerUps[this.activePowerUps.length - 1];
            if (powerUp) {
                powerUp.x = x;
                powerUp.y = y;
            }
        }
    }

    // Collection
    checkCollision(shipX, shipY, shipRadius) {
        for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
            const powerUp = this.activePowerUps[i];
            const dist = Math.hypot(powerUp.x - shipX, powerUp.y - shipY);
            
            if (dist < powerUp.radius + shipRadius) {
                this.collectPowerUp(powerUp, i);
            }
        }
    }

    collectPowerUp(powerUp, index) {
        this.activePowerUps.splice(index, 1);
        this.activateEffect(powerUp);
        
        // Stats
        this.stats.collected++;
        this.stats.byType[powerUp.id] = (this.stats.byType[powerUp.id] || 0) + 1;
        this.saveStats();

        // Achievement progress
        this.game.achievements?.incrementProgress('powerups_collected', 1);
        this.game.achievements?.updateDailyProgress('powerup', 1);
        this.game.achievements?.updateWeeklyProgress('cumulative_powerups', 1);

        // Show collection effect
        this.showCollectionEffect(powerUp);
    }

    // Effect Activation
    activateEffect(powerUp) {
        const effect = powerUp.effect;

        switch (effect) {
            case 'life':
                this.game.lives++;
                this.game.updateLivesDisplay();
                this.showMessage('+1 Life!', powerUp.color);
                break;

            case 'bomb':
                this.game.clearAllAsteroids();
                this.showMessage('BOMB!', powerUp.color);
                this.game.achievements?.incrementProgress('bombs_used', 1);
                break;

            case 'shield':
                this.activeEffects.shield = {
                    charges: powerUp.charges,
                    duration: -1 // Permanent until depleted
                };
                this.showMessage('Shield Active!', powerUp.color);
                break;

            case 'missiles':
                this.activeEffects.missiles = {
                    uses: powerUp.uses,
                    duration: -1
                };
                this.showMessage(`${powerUp.uses} Missiles!`, powerUp.color);
                break;

            default:
                // Duration-based effects
                this.activeEffects[effect] = {
                    duration: powerUp.duration,
                    data: powerUp
                };
                this.showMessage(`${powerUp.name}!`, powerUp.color);
                this.updatePowerUpUI();
                break;
        }
    }

    deactivateEffect(effectId) {
        delete this.activeEffects[effectId];
        this.updatePowerUpUI();
    }

    hasEffect(effectId) {
        return !!this.activeEffects[effectId];
    }

    getEffectData(effectId) {
        return this.activeEffects[effectId];
    }

    // Shield mechanics
    useShieldCharge() {
        if (!this.activeEffects.shield) return false;
        
        this.activeEffects.shield.charges--;
        if (this.activeEffects.shield.charges <= 0) {
            this.deactivateEffect('shield');
            this.showMessage('Shield Depleted!', '#888888');
        }
        
        this.game.achievements?.incrementProgress('shield_hits', 1);
        return true;
    }

    getShieldCharges() {
        return this.activeEffects.shield?.charges || 0;
    }

    // Missile mechanics
    useMissile() {
        if (!this.activeEffects.missiles) return false;
        
        this.activeEffects.missiles.uses--;
        if (this.activeEffects.missiles.uses <= 0) {
            this.deactivateEffect('missiles');
        }
        return true;
    }

    getMissileCount() {
        return this.activeEffects.missiles?.uses || 0;
    }

    // Apply effects to game mechanics
    getFireRateMultiplier() {
        return this.hasEffect('rapid') ? 3.0 : 1.0;
    }

    getSpeedMultiplier() {
        return this.hasEffect('speed') ? 2.0 : 1.0;
    }

    getScoreMultiplier() {
        return this.hasEffect('double_score') ? 2.0 : 1.0;
    }

    getAsteroidSpeedMultiplier() {
        if (this.hasEffect('freeze')) return 0;
        if (this.hasEffect('slow')) return 0.4;
        return 1.0;
    }

    isPhasing() {
        return this.hasEffect('phase');
    }

    isPiercing() {
        return this.hasEffect('pierce');
    }

    isLaserActive() {
        return this.hasEffect('laser');
    }

    getSpreadCount() {
        return this.hasEffect('spread') ? 3 : 1;
    }

    // Black hole effect
    updateBlackHole(asteroids, dt) {
        if (!this.hasEffect('blackhole')) return;
        
        const ship = this.game.ship;
        const range = 200;
        
        for (const asteroid of asteroids) {
            const dx = ship.x - asteroid.x;
            const dy = ship.y - asteroid.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < range && dist > 30) {
                const strength = (range - dist) / range * 200;
                asteroid.vx += (dx / dist) * strength * dt;
                asteroid.vy += (dy / dist) * strength * dt;
                
                // Damage asteroids that get too close
                if (dist < 50) {
                    asteroid.hp = (asteroid.hp || 1) - dt;
                    if (asteroid.hp <= 0) {
                        this.game.destroyAsteroid(asteroids.indexOf(asteroid));
                    }
                }
            }
        }
    }

    // Visual effects update
    updateEffects(dt) {
        // Update rotation and pulse for active power-ups
        for (const powerUp of this.activePowerUps) {
            powerUp.rotation += dt * 2;
            powerUp.pulse = Math.sin(Date.now() / 200) * 0.3 + 1;
        }
    }

    // UI
    updatePowerUpUI() {
        let container = document.getElementById('powerup-indicators');
        if (!container) {
            container = document.createElement('div');
            container.id = 'powerup-indicators';
            container.className = 'powerup-indicators';
            document.querySelector('.game-container')?.appendChild(container);
        }

        container.innerHTML = '';
        
        for (const [effectId, effect] of Object.entries(this.activeEffects)) {
            if (effect.duration <= 0 && effectId !== 'shield' && effectId !== 'missiles') continue;
            
            const powerUpData = effect.data || POWER_UPS[effectId.toUpperCase()];
            if (!powerUpData) continue;
            
            const indicator = document.createElement('div');
            indicator.className = 'powerup-indicator';
            indicator.style.borderColor = powerUpData.color;
            indicator.innerHTML = `
                <span class="powerup-icon">${powerUpData.icon}</span>
                ${effect.duration > 0 ? `<span class="powerup-time">${Math.ceil(effect.duration)}s</span>` : ''}
                ${effect.charges ? `<span class="powerup-charges">×${effect.charges}</span>` : ''}
                ${effect.uses ? `<span class="powerup-uses">×${effect.uses}</span>` : ''}
            `;
            container.appendChild(indicator);
        }
    }

    showCollectionEffect(powerUp) {
        // Spawn particles
        for (let i = 0; i < 10; i++) {
            this.game.particles.push({
                x: powerUp.x,
                y: powerUp.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 0.5,
                maxLife: 0.5,
                size: 4,
                color: powerUp.color
            });
        }
    }

    showMessage(text, color) {
        const msg = document.createElement('div');
        msg.className = 'powerup-message';
        msg.textContent = text;
        msg.style.color = color;
        document.body.appendChild(msg);
        
        setTimeout(() => msg.classList.add('show'), 10);
        setTimeout(() => {
            msg.classList.remove('show');
            setTimeout(() => msg.remove(), 300);
        }, 1500);
    }

    wrapPosition(obj) {
        if (obj.x < 0) obj.x = this.game.canvas.width;
        if (obj.x > this.game.canvas.width) obj.x = 0;
        if (obj.y < 0) obj.y = this.game.canvas.height;
        if (obj.y > this.game.canvas.height) obj.y = 0;
    }

    // Rendering
    render(ctx) {
        for (const powerUp of this.activePowerUps) {
            ctx.save();
            ctx.translate(powerUp.x, powerUp.y);
            ctx.rotate(powerUp.rotation);
            
            // Glow effect
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, powerUp.radius * 2);
            gradient.addColorStop(0, powerUp.color + '88');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, powerUp.radius * 2 * powerUp.pulse, 0, Math.PI * 2);
            ctx.fill();
            
            // Power-up circle
            ctx.fillStyle = powerUp.color;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, powerUp.radius * powerUp.pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Icon
            ctx.fillStyle = '#ffffff';
            ctx.font = `${powerUp.radius}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // ctx.fillText(powerUp.icon, 0, 0); // Replaced with SVG drawing or just keeping symbol might not work if it's an SVG string.
            // Since icon is now SVG string, we can't fillText. We need to render SVG or simplify.
            // For canvas rendering, we can't easily draw SVG string.
            // We should use an image or map the icon type to a canvas drawing function.
            // OR for now, since this is "Retro Minimal", we can draw a symbol based on type.
            
            this.drawPowerUpIcon(ctx, powerUp.id);
            
            // Blinking when about to expire
            if (powerUp.lifetime < 3 && Math.floor(Date.now() / 200) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }
            
            ctx.restore();
        }



        // Render shield effect around ship
        if (this.hasEffect('shield')) {
            const ship = this.game.ship;
            ctx.save();
            ctx.strokeStyle = '#00aaff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
            ctx.beginPath();
            ctx.arc(ship.x, ship.y, ship.radius + 15, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Render black hole effect
        if (this.hasEffect('blackhole')) {
            const ship = this.game.ship;
            ctx.save();
            const gradient = ctx.createRadialGradient(ship.x, ship.y, 30, ship.x, ship.y, 200);
            gradient.addColorStop(0, '#440088');
            gradient.addColorStop(0.5, 'rgba(68, 0, 136, 0.3)');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(ship.x, ship.y, 200, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Render laser beam
        if (this.hasEffect('laser')) {
            const ship = this.game.ship;
            ctx.save();
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 50) * 0.3;
            ctx.beginPath();
            ctx.moveTo(ship.x, ship.y);
            const endX = ship.x + Math.cos(ship.angle) * 1000;
            const endY = ship.y + Math.sin(ship.angle) * 1000;
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Laser glow
            ctx.strokeStyle = '#88ff88';
            ctx.lineWidth = 8;
            ctx.globalAlpha = 0.3;
            ctx.stroke();
            ctx.restore();
        }
    }

    drawPowerUpIcon(ctx, type) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        switch(type) {
            case 'shield':
                ctx.rect(-6, -6, 12, 12);
                break;
            case 'extra_life':
                 ctx.moveTo(0, -5); ctx.lineTo(5, 0); ctx.lineTo(0, 5); ctx.lineTo(-5, 0); ctx.closePath();
                break;
            default:
                 // Default circle or letter
                 ctx.arc(0, 0, 6, 0, Math.PI*2);
        }
        ctx.stroke();
    }

    // Reset
    reset() {
        this.activePowerUps = [];
        this.activeEffects = {};
        this.spawnTimer = 0;
        this.updatePowerUpUI();
    }
}
