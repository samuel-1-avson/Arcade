/**
 * Asteroids - Enemy System
 * Different asteroid types, UFO variants, and boss entities
 */

// Asteroid Types
export const ASTEROID_TYPES = {
    NORMAL: {
        id: 'normal',
        name: 'Normal',
        color: '#888888',
        strokeColor: '#ffffff',
        hp: 1,
        points: { large: 20, medium: 50, small: 100 },
        behavior: 'standard'
    },
    ICE: {
        id: 'ice',
        name: 'Ice',
        color: '#88ccff',
        strokeColor: '#aaddff',
        hp: 0.8,
        points: { large: 25, medium: 60, small: 120 },
        behavior: 'shatter',
        fragmentCount: 4,
        slippery: true
    },
    FIRE: {
        id: 'fire',
        name: 'Fire',
        color: '#ff4400',
        strokeColor: '#ffaa00',
        hp: 1,
        points: { large: 30, medium: 70, small: 140 },
        behavior: 'burn',
        burnDamage: 0.5,
        burnRadius: 30
    },
    METAL: {
        id: 'metal',
        name: 'Metal',
        color: '#666688',
        strokeColor: '#aaaacc',
        hp: 3,
        points: { large: 40, medium: 90, small: 200 },
        behavior: 'armored',
        armorReduction: 0.5
    },
    CRYSTAL: {
        id: 'crystal',
        name: 'Crystal',
        color: '#aa00ff',
        strokeColor: '#dd88ff',
        hp: 1.5,
        points: { large: 50, medium: 120, small: 250 },
        behavior: 'reflect',
        reflectChance: 0.3
    },
    EXPLOSIVE: {
        id: 'explosive',
        name: 'Explosive',
        color: '#ff8800',
        strokeColor: '#ffcc00',
        hp: 0.5,
        points: { large: 35, medium: 80, small: 180 },
        behavior: 'explode',
        explosionRadius: 80,
        chainReaction: true
    },
    VOID: {
        id: 'void',
        name: 'Void',
        color: '#220044',
        strokeColor: '#6600aa',
        hp: 2,
        points: { large: 60, medium: 150, small: 300 },
        behavior: 'warp',
        warpChance: 0.2
    }
};

// UFO Types
export const UFO_TYPES = {
    SCOUT: {
        id: 'scout',
        name: 'Scout',
        color: '#00ff00',
        size: 15,
        speed: 100,
        hp: 1,
        points: 200,
        shootInterval: 3,
        accuracy: 0.5,
        behavior: 'patrol'
    },
    FIGHTER: {
        id: 'fighter',
        name: 'Fighter',
        color: '#00ff88',
        size: 18,
        speed: 150,
        hp: 2,
        points: 500,
        shootInterval: 1.5,
        accuracy: 0.7,
        behavior: 'aggressive'
    },
    BOMBER: {
        id: 'bomber',
        name: 'Bomber',
        color: '#ffaa00',
        size: 25,
        speed: 60,
        hp: 3,
        points: 750,
        shootInterval: 4,
        accuracy: 0.4,
        behavior: 'bombing',
        dropsMines: true
    },
    ELITE: {
        id: 'elite',
        name: 'Elite',
        color: '#ff0088',
        size: 20,
        speed: 120,
        hp: 5,
        points: 1000,
        shootInterval: 1,
        accuracy: 0.85,
        behavior: 'elite',
        hasShield: true,
        shieldHp: 2
    },
    CARRIER: {
        id: 'carrier',
        name: 'Carrier',
        color: '#8800ff',
        size: 40,
        speed: 40,
        hp: 10,
        points: 2500,
        shootInterval: 5,
        accuracy: 0.3,
        behavior: 'carrier',
        spawnCount: 3,
        spawnInterval: 8
    }
};

// Boss Definitions
export const BOSS_TYPES = {
    ROCK_TITAN: {
        id: 'rock_titan',
        name: 'Rock Titan',
        color: '#666666',
        glowColor: '#ff8800',
        size: 100,
        hp: 10,
        phases: 2,
        attacks: {
            split: { damage: 0, spawnCount: 5 },
            charge: { damage: 2, speed: 500 },
            meteor_shower: { damage: 1, count: 10 }
        }
    },
    CRYO_COLOSSUS: {
        id: 'cryo_colossus',
        name: 'Cryo Colossus',
        color: '#88ccff',
        glowColor: '#00aaff',
        size: 90,
        hp: 15,
        phases: 3,
        attacks: {
            freeze_ray: { damage: 0, freezeDuration: 3 },
            ice_shards: { damage: 1, count: 8 },
            blizzard: { damage: 0.5, duration: 5 }
        }
    },
    MAGMA_BEHEMOTH: {
        id: 'magma_behemoth',
        name: 'Magma Behemoth',
        color: '#ff4400',
        glowColor: '#ffaa00',
        size: 110,
        hp: 20,
        phases: 3,
        attacks: {
            flame_breath: { damage: 2, angle: 0.5 },
            lava_pool: { damage: 1, duration: 10, radius: 100 },
            eruption: { damage: 3, count: 15 }
        }
    },
    MOTHERSHIP: {
        id: 'mothership',
        name: 'Mothership',
        color: '#00ff88',
        glowColor: '#00ffaa',
        size: 150,
        hp: 30,
        phases: 4,
        attacks: {
            beam_cannon: { damage: 3, width: 20 },
            spawn_fighters: { count: 4 },
            tractor_beam: { pullStrength: 200 },
            missile_barrage: { damage: 2, count: 8 }
        }
    },
    ENTROPY: {
        id: 'entropy',
        name: 'Entropy',
        color: '#aa00ff',
        glowColor: '#ff00ff',
        size: 120,
        hp: 50,
        phases: 5,
        attacks: {
            void_beam: { damage: 4, width: 30 },
            reality_tear: { damage: 0, spawnVoidlings: 3 },
            time_freeze: { duration: 2 },
            dimension_shift: { teleport: true },
            final_collapse: { damage: 10, radius: 400 }
        }
    }
};

/**
 * Enemy System Manager
 */
export class EnemySystem {
    constructor(game) {
        this.game = game;
        this.activeTypes = ['normal']; // Start with only normal asteroids
        this.ufoTypes = ['scout']; // Start with only scout UFOs
        this.currentBoss = null;
        this.bossActive = false;
        
        // World-specific enemy configurations
        this.worldConfigs = {
            asteroid_belt: { asteroids: ['normal'], ufos: ['scout', 'fighter'] },
            ice_fields: { asteroids: ['normal', 'ice'], ufos: ['scout', 'fighter'] },
            volcanic_zone: { asteroids: ['normal', 'fire', 'explosive'], ufos: ['scout', 'fighter', 'bomber'] },
            alien_territory: { asteroids: ['normal', 'metal'], ufos: ['scout', 'fighter', 'bomber', 'elite'] },
            the_void: { asteroids: ['normal', 'crystal', 'void'], ufos: ['fighter', 'elite', 'carrier'] }
        };
    }

    // Configure enemies for a world
    setWorldConfig(worldId) {
        const config = this.worldConfigs[worldId];
        if (config) {
            this.activeTypes = config.asteroids;
            this.ufoTypes = config.ufos;
        }
    }

    // Asteroid Creation
    createAsteroid(size, x, y, type = null) {
        // Random type if not specified
        if (!type) {
            type = this.activeTypes[Math.floor(Math.random() * this.activeTypes.length)];
        }
        
        const typeData = ASTEROID_TYPES[type.toUpperCase()] || ASTEROID_TYPES.NORMAL;
        const sizeConfig = {
            large: { radius: 40, speedMult: 0.6 },
            medium: { radius: 20, speedMult: 1.0 },
            small: { radius: 10, speedMult: 1.4 }
        };
        const sizeData = sizeConfig[size];

        // Generate random polygon shape
        const vertices = [];
        const numVertices = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < numVertices; i++) {
            const angle = (i / numVertices) * Math.PI * 2;
            const r = sizeData.radius * (0.7 + Math.random() * 0.3);
            vertices.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r
            });
        }

        const baseSpeed = 30 + Math.random() * 70;
        const angle = Math.random() * Math.PI * 2;

        return {
            x,
            y,
            vx: Math.cos(angle) * baseSpeed * sizeData.speedMult,
            vy: Math.sin(angle) * baseSpeed * sizeData.speedMult,
            radius: sizeData.radius,
            size,
            type: typeData.id,
            typeData,
            hp: typeData.hp,
            points: typeData.points[size],
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 4,
            vertices,
            stunned: false,
            stunTimer: 0,
            burning: typeData.behavior === 'burn'
        };
    }

    // Update asteroid behavior
    updateAsteroid(asteroid, dt) {
        if (asteroid.stunned) {
            asteroid.stunTimer -= dt;
            if (asteroid.stunTimer <= 0) {
                asteroid.stunned = false;
            }
            return;
        }

        // Base movement
        asteroid.x += asteroid.vx * dt;
        asteroid.y += asteroid.vy * dt;
        asteroid.rotation += asteroid.rotationSpeed * dt;

        // Type-specific behaviors
        switch (asteroid.typeData.behavior) {
            case 'warp':
                // Random teleportation chance
                if (Math.random() < asteroid.typeData.warpChance * dt) {
                    asteroid.x = Math.random() * this.game.canvas.width;
                    asteroid.y = Math.random() * this.game.canvas.height;
                    this.game.spawnWarpEffect(asteroid.x, asteroid.y);
                }
                break;

            case 'burn':
                // Create fire particles
                if (Math.random() < 0.3) {
                    this.game.particles.push({
                        x: asteroid.x + (Math.random() - 0.5) * asteroid.radius,
                        y: asteroid.y + (Math.random() - 0.5) * asteroid.radius,
                        vx: (Math.random() - 0.5) * 50,
                        vy: -Math.random() * 50,
                        life: 0.5,
                        maxLife: 0.5,
                        size: 3 + Math.random() * 3,
                        color: '#ff6600'
                    });
                }
                break;
        }
    }

    // Handle asteroid destruction
    onAsteroidDestroyed(asteroid, bulletDamage = 1) {
        const type = asteroid.typeData;

        switch (type.behavior) {
            case 'explode':
                // Create explosion that damages nearby
                this.createExplosion(asteroid.x, asteroid.y, type.explosionRadius);
                
                // Chain reaction - damage nearby explosive asteroids
                if (type.chainReaction) {
                    for (const other of this.game.asteroids) {
                        if (other !== asteroid && other.typeData.behavior === 'explode') {
                            const dist = Math.hypot(other.x - asteroid.x, other.y - asteroid.y);
                            if (dist < type.explosionRadius) {
                                other.hp -= 1;
                            }
                        }
                    }
                }
                break;

            case 'shatter':
                // Create extra fragments
                const fragmentCount = type.fragmentCount || 2;
                for (let i = 0; i < fragmentCount; i++) {
                    const fragment = {
                        x: asteroid.x,
                        y: asteroid.y,
                        vx: (Math.random() - 0.5) * 200,
                        vy: (Math.random() - 0.5) * 200,
                        radius: 5,
                        life: 2,
                        color: type.color
                    };
                    this.game.fragments.push(fragment);
                }
                break;

            case 'reflect':
                // Low chance to spawn projectile back at player
                if (Math.random() < type.reflectChance) {
                    const angle = Math.atan2(
                        this.game.ship.y - asteroid.y,
                        this.game.ship.x - asteroid.x
                    );
                    this.game.bullets.push({
                        x: asteroid.x,
                        y: asteroid.y,
                        vx: Math.cos(angle + Math.PI) * 300,
                        vy: Math.sin(angle + Math.PI) * 300,
                        life: 2,
                        isEnemy: true,
                        color: type.color
                    });
                }
                break;
        }

        return asteroid.points;
    }

    // Create explosion effect
    createExplosion(x, y, radius) {
        // Damage ship if in range
        const shipDist = Math.hypot(this.game.ship.x - x, this.game.ship.y - y);
        if (shipDist < radius && !this.game.ship.invincible) {
            // Use powerup shield if available
            if (!this.game.powerUps?.useShieldCharge()) {
                this.game.loseLife();
            }
        }

        // Visual explosion
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200;
            this.game.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.8,
                maxLife: 0.8,
                size: 4 + Math.random() * 4,
                color: '#ff6600'
            });
        }

        this.game.screenShake(10);
    }

    // UFO Creation
    createUFO(type = null) {
        if (!type) {
            type = this.ufoTypes[Math.floor(Math.random() * this.ufoTypes.length)];
        }

        const typeData = UFO_TYPES[type.toUpperCase()] || UFO_TYPES.SCOUT;
        const fromRight = Math.random() > 0.5;

        return {
            x: fromRight ? this.game.canvas.width + 25 : -25,
            y: 50 + Math.random() * (this.game.canvas.height - 100),
            vx: (fromRight ? -1 : 1) * typeData.speed,
            vy: (Math.random() - 0.5) * typeData.speed * 0.3,
            type: typeData.id,
            typeData,
            radius: typeData.size,
            hp: typeData.hp,
            points: typeData.points,
            shootTimer: typeData.shootInterval,
            spawnTimer: typeData.spawnInterval || 0,
            shieldHp: typeData.shieldHp || 0,
            stunned: false,
            stunTimer: 0
        };
    }

    // Update UFO behavior
    updateUFO(ufo, dt) {
        if (ufo.stunned) {
            ufo.stunTimer -= dt;
            if (ufo.stunTimer <= 0) {
                ufo.stunned = false;
            }
            return;
        }

        const type = ufo.typeData;

        // Movement based on behavior
        switch (type.behavior) {
            case 'patrol':
                // Standard side-to-side with vertical oscillation
                ufo.vy = Math.sin(Date.now() / 1000) * 50;
                break;

            case 'aggressive':
                // Move towards player
                const angleToPlayer = Math.atan2(
                    this.game.ship.y - ufo.y,
                    this.game.ship.x - ufo.x
                );
                ufo.vx = Math.cos(angleToPlayer) * type.speed * 0.8;
                ufo.vy = Math.sin(angleToPlayer) * type.speed * 0.8;
                break;

            case 'bombing':
                // Slow, drops mines
                if (Math.random() < 0.02) {
                    this.game.spawnMine(ufo.x, ufo.y);
                }
                break;

            case 'carrier':
                // Spawns smaller UFOs
                ufo.spawnTimer -= dt;
                if (ufo.spawnTimer <= 0) {
                    ufo.spawnTimer = type.spawnInterval;
                    for (let i = 0; i < type.spawnCount; i++) {
                        const scout = this.createUFO('scout');
                        scout.x = ufo.x;
                        scout.y = ufo.y + (Math.random() - 0.5) * 50;
                        this.game.ufos.push(scout);
                    }
                }
                break;
        }

        // Apply velocity
        ufo.x += ufo.vx * dt;
        ufo.y += ufo.vy * dt;

        // Keep on screen vertically
        if (ufo.y < 50) ufo.y = 50;
        if (ufo.y > this.game.canvas.height - 50) ufo.y = this.game.canvas.height - 50;

        // Shooting
        ufo.shootTimer -= dt;
        if (ufo.shootTimer <= 0) {
            ufo.shootTimer = type.shootInterval;
            this.ufoShoot(ufo);
        }
    }

    ufoShoot(ufo) {
        const type = ufo.typeData;
        const angleToPlayer = Math.atan2(
            this.game.ship.y - ufo.y,
            this.game.ship.x - ufo.x
        );
        
        // Add inaccuracy
        const inaccuracy = (1 - type.accuracy) * Math.PI * 0.5;
        const shootAngle = angleToPlayer + (Math.random() - 0.5) * inaccuracy;

        this.game.bullets.push({
            x: ufo.x,
            y: ufo.y,
            vx: Math.cos(shootAngle) * 200,
            vy: Math.sin(shootAngle) * 200,
            life: 2,
            isEnemy: true,
            color: type.color
        });
    }

    // Damage UFO
    damageUFO(ufo, damage = 1) {
        // Shield first
        if (ufo.shieldHp > 0) {
            ufo.shieldHp -= damage;
            return false;
        }

        ufo.hp -= damage;
        return ufo.hp <= 0;
    }

    // Boss Management
    spawnBoss(bossType) {
        const bossData = BOSS_TYPES[bossType.toUpperCase()];
        if (!bossData) return null;

        this.bossActive = true;
        this.currentBoss = {
            ...bossData,
            x: this.game.canvas.width / 2,
            y: -bossData.size,
            targetY: 150,
            currentHp: bossData.hp,
            phase: 1,
            attackTimer: 3,
            currentAttack: null,
            entering: true,
            stunned: false,
            stunTimer: 0
        };

        return this.currentBoss;
    }

    updateBoss(dt) {
        if (!this.bossActive || !this.currentBoss) return;
        const boss = this.currentBoss;

        // Entry animation
        if (boss.entering) {
            boss.y += 50 * dt;
            if (boss.y >= boss.targetY) {
                boss.y = boss.targetY;
                boss.entering = false;
            }
            return;
        }

        if (boss.stunned) {
            boss.stunTimer -= dt;
            if (boss.stunTimer <= 0) boss.stunned = false;
            return;
        }

        // Attack timing
        boss.attackTimer -= dt;
        if (boss.attackTimer <= 0) {
            this.executeBossAttack();
            boss.attackTimer = 2 + Math.random() * 2;
        }

        // Slow lateral movement
        boss.x += Math.sin(Date.now() / 2000) * 30 * dt;
    }

    executeBossAttack() {
        const boss = this.currentBoss;
        const attacks = Object.keys(boss.attacks);
        const maxAttackIndex = Math.min(boss.phase + 1, attacks.length);
        const attackName = attacks[Math.floor(Math.random() * maxAttackIndex)];
        const attack = boss.attacks[attackName];

        boss.currentAttack = attackName;

        switch (attackName) {
            case 'split':
            case 'meteor_shower':
                // Spawn asteroids
                const count = attack.count || attack.spawnCount || 5;
                for (let i = 0; i < count; i++) {
                    setTimeout(() => {
                        const asteroid = this.createAsteroid(
                            'medium',
                            boss.x + (Math.random() - 0.5) * 100,
                            boss.y + boss.size / 2
                        );
                        asteroid.vy = 100 + Math.random() * 100;
                        this.game.asteroids.push(asteroid);
                    }, i * 200);
                }
                break;

            case 'charge':
                // Charge at player
                const chargeAngle = Math.atan2(
                    this.game.ship.y - boss.y,
                    this.game.ship.x - boss.x
                );
                boss.chargeVx = Math.cos(chargeAngle) * attack.speed;
                boss.chargeVy = Math.sin(chargeAngle) * attack.speed;
                boss.charging = true;
                setTimeout(() => {
                    boss.charging = false;
                    boss.x = this.game.canvas.width / 2;
                    boss.y = boss.targetY;
                }, 1000);
                break;

            case 'beam_cannon':
            case 'void_beam':
            case 'flame_breath':
                // Beam attack
                boss.beamActive = true;
                boss.beamAngle = Math.atan2(
                    this.game.ship.y - boss.y,
                    this.game.ship.x - boss.x
                );
                setTimeout(() => {
                    boss.beamActive = false;
                }, 1500);
                break;

            case 'spawn_fighters':
                // Spawn UFOs
                for (let i = 0; i < attack.count; i++) {
                    const ufo = this.createUFO('fighter');
                    ufo.x = boss.x + (Math.random() - 0.5) * 100;
                    ufo.y = boss.y + boss.size / 2;
                    this.game.ufos.push(ufo);
                }
                break;

            case 'tractor_beam':
                // Pull player
                this.game.tractorBeamActive = true;
                this.game.tractorBeamSource = { x: boss.x, y: boss.y };
                this.game.tractorBeamStrength = attack.pullStrength;
                setTimeout(() => {
                    this.game.tractorBeamActive = false;
                }, 3000);
                break;
        }
    }

    damageBoss(damage = 1) {
        if (!this.bossActive || !this.currentBoss) return false;

        this.currentBoss.currentHp -= damage;
        
        // Phase check
        const hpPercent = this.currentBoss.currentHp / this.currentBoss.hp;
        const newPhase = Math.ceil((1 - hpPercent) * this.currentBoss.phases) + 1;
        
        if (newPhase > this.currentBoss.phase && newPhase <= this.currentBoss.phases) {
            this.currentBoss.phase = newPhase;
            this.currentBoss.stunned = true;
            this.currentBoss.stunTimer = 2;
            this.game.showMessage(`Phase ${newPhase}!`, '#ff4444');
        }

        // Defeat check
        if (this.currentBoss.currentHp <= 0) {
            this.defeatBoss();
            return true;
        }

        return false;
    }

    defeatBoss() {
        this.bossActive = false;
        this.game.spawnBossExplosion(this.currentBoss);
        this.game.addScore(this.currentBoss.hp * 500);
        this.currentBoss = null;
    }

    // Rendering
    renderAsteroid(ctx, asteroid) {
        const type = asteroid.typeData;

        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);
        ctx.rotate(asteroid.rotation);

        // Glow effect for special types
        if (type.behavior !== 'standard') {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, asteroid.radius * 1.5);
            gradient.addColorStop(0, type.color + '44');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, asteroid.radius * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Main shape
        ctx.fillStyle = type.color + '44';
        ctx.strokeStyle = type.strokeColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(asteroid.vertices[0].x, asteroid.vertices[0].y);
        for (let i = 1; i < asteroid.vertices.length; i++) {
            ctx.lineTo(asteroid.vertices[i].x, asteroid.vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Stunned effect
        if (asteroid.stunned) {
            ctx.strokeStyle = '#00aaff';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 50) * 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, asteroid.radius * 1.2, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    renderUFO(ctx, ufo) {
        const type = ufo.typeData;

        ctx.save();
        ctx.translate(ufo.x, ufo.y);

        // Shield effect
        if (ufo.shieldHp > 0) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, ufo.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // UFO shape
        ctx.strokeStyle = type.color;
        ctx.lineWidth = 2;
        
        // Body ellipse
        ctx.beginPath();
        ctx.ellipse(0, 0, ufo.radius, ufo.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Dome
        ctx.beginPath();
        ctx.ellipse(0, -ufo.radius * 0.2, ufo.radius * 0.5, ufo.radius * 0.3, 0, 0, Math.PI);
        ctx.stroke();

        // Carrier-specific: hangar bay
        if (type.behavior === 'carrier') {
            ctx.fillStyle = '#8800ff44';
            ctx.beginPath();
            ctx.ellipse(0, ufo.radius * 0.2, ufo.radius * 0.3, ufo.radius * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Stunned effect
        if (ufo.stunned) {
            ctx.strokeStyle = '#00aaff';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 50) * 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, ufo.radius + 15, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    renderBoss(ctx) {
        if (!this.bossActive || !this.currentBoss) return;
        const boss = this.currentBoss;

        ctx.save();
        ctx.translate(boss.x, boss.y);

        // Glow
        const gradient = ctx.createRadialGradient(0, 0, boss.size * 0.5, 0, 0, boss.size * 1.5);
        gradient.addColorStop(0, boss.glowColor + '66');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, boss.size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Main body
        ctx.fillStyle = boss.color;
        ctx.strokeStyle = boss.glowColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, boss.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Phase indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Phase ${boss.phase}/${boss.phases}`, 0, -boss.size - 20);

        // HP bar
        const hpWidth = boss.size * 2;
        const hpHeight = 10;
        ctx.fillStyle = '#333333';
        ctx.fillRect(-hpWidth / 2, boss.size + 20, hpWidth, hpHeight);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(-hpWidth / 2, boss.size + 20, hpWidth * (boss.currentHp / boss.hp), hpHeight);

        // Beam attack
        if (boss.beamActive) {
            ctx.strokeStyle = boss.glowColor;
            ctx.lineWidth = 20;
            ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 30) * 0.3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(boss.beamAngle) * 1000, Math.sin(boss.beamAngle) * 1000);
            ctx.stroke();
        }

        ctx.restore();
    }

    reset() {
        this.activeTypes = ['normal'];
        this.ufoTypes = ['scout'];
        this.currentBoss = null;
        this.bossActive = false;
    }
}
