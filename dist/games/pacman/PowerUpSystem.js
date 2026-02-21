/**
 * Pac-Man Power-Up System
 * 10 unique power-ups with various effects
 */

export const POWER_UPS = {
    SPEED_BOOST: {
        id: 'speed_boost',
        name: 'Speed Boost',
        icon: '⚡',
        color: '#00ffff',
        duration: 5,
        chance: 0.15,
        description: '50% faster movement',
        effect: (game) => {
            game.pacmanSpeedMultiplier = 1.5;
        },
        onEnd: (game) => {
            game.pacmanSpeedMultiplier = game.modeManager?.currentMode.settings.pacmanSpeed || 1.0;
        }
    },

    GHOST_FREEZE: {
        id: 'ghost_freeze',
        name: 'Ghost Freeze',
        icon: '❄️',
        color: '#88ccff',
        duration: 3,
        chance: 0.10,
        description: 'Freeze all ghosts',
        effect: (game) => {
            game.ghostsFrozen = true;
        },
        onEnd: (game) => {
            game.ghostsFrozen = false;
        }
    },

    MAGNET: {
        id: 'magnet',
        name: 'Magnet',
        icon: '🧲',
        color: '#ff4444',
        duration: 6,
        chance: 0.12,
        description: 'Attract nearby dots',
        effect: (game) => {
            game.magnetActive = true;
            game.magnetRadius = 3;
        },
        onEnd: (game) => {
            game.magnetActive = false;
        }
    },

    SHIELD: {
        id: 'shield',
        name: 'Shield',
        icon: '🛡️',
        color: '#44ff44',
        duration: 0, // One-time use
        chance: 0.08,
        description: 'Survive one ghost hit',
        effect: (game) => {
            game.hasShield = true;
        },
        onEnd: () => {}
    },

    DOUBLE_POINTS: {
        id: 'double_points',
        name: 'Double Points',
        icon: '💰',
        color: '#ffcc00',
        duration: 10,
        chance: 0.12,
        description: '2x score multiplier',
        effect: (game) => {
            game.scoreMultiplier = 2;
        },
        onEnd: (game) => {
            game.scoreMultiplier = 1;
        }
    },

    BOMB: {
        id: 'bomb',
        name: 'Bomb',
        icon: '💣',
        color: '#ff6600',
        duration: 0, // Instant
        chance: 0.06,
        description: 'Send ghosts back to house',
        effect: (game) => {
            game.ghosts.forEach(ghost => {
                ghost.mode = 'eaten';
                ghost.targetX = 14;
                ghost.targetY = 14;
            });
            game.addScore(100 * game.ghosts.length);
            game.effectsSystem?.createExplosion(game.pacman.x, game.pacman.y);
        },
        onEnd: () => {}
    },

    TELEPORT: {
        id: 'teleport',
        name: 'Teleport',
        icon: '🌀',
        color: '#cc00ff',
        duration: 0, // Instant
        chance: 0.08,
        description: 'Warp to safe location',
        effect: (game) => {
            const safeSpots = game.findSafeSpots();
            if (safeSpots.length > 0) {
                const spot = safeSpots[Math.floor(Math.random() * safeSpots.length)];
                game.pacman.x = spot.x;
                game.pacman.y = spot.y;
                game.effectsSystem?.createTeleportEffect(spot.x, spot.y);
            }
        },
        onEnd: () => {}
    },

    SLOW_MOTION: {
        id: 'slow_motion',
        name: 'Slow Motion',
        icon: '🐌',
        color: '#8844ff',
        duration: 5,
        chance: 0.10,
        description: 'Slow game time by 50%',
        effect: (game) => {
            game.timeScale = 0.5;
            game.ghostSpeedMultiplier *= 0.5;
        },
        onEnd: (game) => {
            game.timeScale = 1.0;
            game.ghostSpeedMultiplier = game.modeManager?.currentMode.settings.ghostSpeed || 1.0;
        }
    },

    MULTIPLIER_CHAIN: {
        id: 'multiplier_chain',
        name: 'Multiplier Chain',
        icon: '🔥',
        color: '#ff8800',
        duration: 8,
        chance: 0.10,
        description: 'Increasing point multiplier',
        effect: (game) => {
            game.chainMultiplier = 1;
            game.chainActive = true;
        },
        onEnd: (game) => {
            game.chainActive = false;
            game.chainMultiplier = 1;
        }
    },

    SUPER_PAC: {
        id: 'super_pac',
        name: 'Super Pac',
        icon: '⭐',
        color: '#ffff00',
        duration: 6,
        chance: 0.05,
        description: 'Speed + invincibility combo',
        effect: (game) => {
            game.pacmanSpeedMultiplier = 1.3;
            game.superMode = true;
            game.activatePowerMode();
        },
        onEnd: (game) => {
            game.pacmanSpeedMultiplier = game.modeManager?.currentMode.settings.pacmanSpeed || 1.0;
            game.superMode = false;
        }
    }
};

/**
 * Power-Up Manager Class
 */
export class PowerUpManager {
    constructor(game) {
        this.game = game;
        this.activePowerUps = [];
        this.spawnedPowerUps = [];
        this.spawnTimer = 0;
        this.spawnInterval = 15; // Seconds between spawns
        this.stats = this.loadStats();
    }

    loadStats() {
        const saved = localStorage.getItem('pacman_powerup_stats');
        return saved ? JSON.parse(saved) : {
            totalCollected: 0,
            typesCounts: {}
        };
    }

    saveStats() {
        localStorage.setItem('pacman_powerup_stats', JSON.stringify(this.stats));
    }

    update(dt) {
        // Update active power-ups
        for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
            const active = this.activePowerUps[i];
            active.timeRemaining -= dt;

            if (active.timeRemaining <= 0) {
                active.powerUp.onEnd(this.game);
                this.activePowerUps.splice(i, 1);
                this.game.showNotification(`${active.powerUp.name} expired`);
            }
        }

        // Spawn timer
        if (this.game.powerUpsEnabled) {
            this.spawnTimer += dt;
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnTimer = 0;
                this.trySpawnPowerUp();
            }
        }

        // Animate spawned power-ups
        this.spawnedPowerUps.forEach(pu => {
            pu.animTime = (pu.animTime || 0) + dt;
        });
    }

    trySpawnPowerUp() {
        if (this.spawnedPowerUps.length >= 2) return;

        // Find empty spot
        const spots = this.game.findEmptySpots();
        if (spots.length === 0) return;

        const spot = spots[Math.floor(Math.random() * spots.length)];

        // Random power-up weighted by chance
        const powerUp = this.getRandomPowerUp();
        if (powerUp) {
            this.spawnedPowerUps.push({
                ...powerUp,
                x: spot.x,
                y: spot.y,
                animTime: 0
            });
        }
    }

    getRandomPowerUp() {
        const roll = Math.random();
        let cumulative = 0;

        const powerUps = Object.values(POWER_UPS);
        for (const pu of powerUps) {
            cumulative += pu.chance;
            if (roll <= cumulative) {
                return { ...pu };
            }
        }

        return powerUps[0];
    }

    checkCollection(pacmanX, pacmanY) {
        for (let i = this.spawnedPowerUps.length - 1; i >= 0; i--) {
            const pu = this.spawnedPowerUps[i];
            if (pu.x === pacmanX && pu.y === pacmanY) {
                this.collectPowerUp(pu);
                this.spawnedPowerUps.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    collectPowerUp(powerUp) {
        // Apply effect
        powerUp.effect(this.game);

        // Track duration-based power-ups
        if (powerUp.duration > 0) {
            this.activePowerUps.push({
                powerUp,
                timeRemaining: powerUp.duration
            });
        }

        // Stats
        this.stats.totalCollected++;
        this.stats.typesCounts[powerUp.id] = (this.stats.typesCounts[powerUp.id] || 0) + 1;
        this.saveStats();

        // Notification
        this.game.showNotification(`${powerUp.icon} ${powerUp.name}!`);
        this.game.addScore(25);

        // Effects
        this.game.effectsSystem?.createPowerUpCollect(powerUp);

        // Achievement check
        this.game.achievementSystem?.checkPowerUpAchievements(this.stats);
    }

    getActivePowerUps() {
        return this.activePowerUps.map(a => ({
            ...a.powerUp,
            timeRemaining: a.timeRemaining
        }));
    }

    getSpawnedPowerUps() {
        return this.spawnedPowerUps;
    }

    hasActivePowerUp(id) {
        return this.activePowerUps.some(a => a.powerUp.id === id);
    }

    clearAll() {
        this.activePowerUps.forEach(a => a.powerUp.onEnd(this.game));
        this.activePowerUps = [];
        this.spawnedPowerUps = [];
        this.spawnTimer = 0;
    }

    render(ctx, cellSize) {
        const time = this.game.elapsedTime || 0;

        this.spawnedPowerUps.forEach(pu => {
            const px = pu.x * cellSize + cellSize / 2;
            const py = pu.y * cellSize + cellSize / 2;

            // Glow effect
            const glowSize = 8 + Math.sin(pu.animTime * 4) * 2;
            const gradient = ctx.createRadialGradient(px, py, 0, px, py, glowSize);
            gradient.addColorStop(0, pu.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fillRect(px - glowSize, py - glowSize, glowSize * 2, glowSize * 2);

            // Icon
            ctx.font = `${cellSize * 0.8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pu.icon, px, py);

            // Bobbing animation
            const bobOffset = Math.sin(pu.animTime * 3) * 2;
            ctx.save();
            ctx.translate(0, bobOffset);
            ctx.restore();
        });
    }
}
