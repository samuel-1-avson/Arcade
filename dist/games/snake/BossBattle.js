/**
 * Snake Game - Boss Battle System
 * Handles boss fights with unique mechanics, patterns, and phases
 */

export class BossBattle {
    constructor(game, bossData, worldId) {
        this.game = game;
        this.bossData = bossData;
        this.worldId = worldId;
        
        this.hp = bossData.hp;
        this.maxHp = bossData.hp;
        this.phase = 1;
        this.maxPhases = bossData.phases;
        this.isActive = false;
        this.isDefeated = false;
        
        // Boss position and movement
        this.x = 15;
        this.y = 5;
        this.targetX = 15;
        this.targetY = 5;
        this.speed = 3;
        
        // Attack patterns
        this.attackTimer = 0;
        this.attackCooldown = 2;
        this.currentPattern = 0;
        this.patterns = this.getPatterns(bossData.type);
        
        // Projectiles/hazards spawned by boss
        this.hazards = [];
        
        // ENHANCED: Minion system
        this.minions = [];
        this.maxMinions = 5;
        
        // ENHANCED: Rage mode
        this.isRaging = false;
        this.rageTimer = 0;
        this.rageDuration = 0;
        this.enrageTimer = 120; // 2 minutes to defeat or boss enrages
        this.isEnraged = false;
        
        // ENHANCED: Attack telegraph system
        this.telegraph = null;
        this.telegraphTimer = 0;
        
        // ENHANCED: Damage tracking
        this.damageDealt = 0;
        this.hitsTaken = 0;
        
        // Visual state
        this.flashTimer = 0;
        this.shakeAmount = 0;
        this.animationTime = 0;
        this.rotation = 0;
    }
    
    getPatterns(type) {
        const patterns = {
            'lawnmower': [
                { name: 'horizontal_sweep', duration: 3, cooldown: 2 },
                { name: 'spawn_obstacles', count: 5, cooldown: 3 },
                { name: 'charge', speed: 8, cooldown: 4 },
                { name: 'spawn_minions', count: 2, cooldown: 5 },
                { name: 'laser_beam', direction: 'horizontal', cooldown: 4 }
            ],
            'ice_wyrm': [
                { name: 'freeze_zone', radius: 5, duration: 3, cooldown: 3 },
                { name: 'ice_breath', angle: 45, cooldown: 2 },
                { name: 'summon_icicles', count: 8, cooldown: 4 },
                { name: 'spawn_minions', count: 3, cooldown: 5 },
                { name: 'shockwave', radius: 8, cooldown: 4 }
            ],
            'fire_elemental': [
                { name: 'lava_trail', duration: 5, cooldown: 2 },
                { name: 'fireball_barrage', count: 6, cooldown: 3 },
                { name: 'eruption', radius: 8, cooldown: 5 },
                { name: 'meteor_shower', count: 5, cooldown: 6 },
                { name: 'gravity_pull', duration: 3, cooldown: 5 }
            ],
            'virus': [
                { name: 'glitch_zone', tiles: 10, cooldown: 2 },
                { name: 'data_corruption', targetSnake: true, cooldown: 3 },
                { name: 'system_overload', screenEffect: true, cooldown: 5 },
                { name: 'spawn_minions', count: 4, cooldown: 4 },
                { name: 'laser_beam', direction: 'cross', cooldown: 5 }
            ],
            'shadow': [
                { name: 'darkness', visibility: 3, duration: 4, cooldown: 3 },
                { name: 'shadow_clones', count: 3, cooldown: 4 },
                { name: 'void_pull', center: true, cooldown: 5 },
                { name: 'teleport_strike', cooldown: 3 },
                { name: 'soul_drain', duration: 3, cooldown: 6 }
            ]
        };
        return patterns[type] || patterns['lawnmower'];
    }
    
    start() {
        this.isActive = true;
        this.game.camera.shake(10, 0.5);
        this.game.camera.doFlash([1, 0, 0], 0.3);
        
        // Show boss intro
        this.showBossIntro();
    }
    
    showBossIntro() {
        // Pause game and show boss name
        this.game.togglePause(true);
        
        const overlay = document.createElement('div');
        overlay.id = 'boss-intro';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            animation: fadeIn 0.3s ease;
        `;
        overlay.innerHTML = `
            <h1 style="font-size: 3em; color: #ff0000; text-shadow: 0 0 20px #ff0000; margin: 0;">
                ${this.bossData.name}
            </h1>
            <p style="font-size: 1.5em; color: #fff; margin-top: 10px;">Phase ${this.phase}/${this.maxPhases}</p>
        `;
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                overlay.remove();
                this.game.togglePause(false);
            }, 300);
        }, 2000);
    }
    
    update(dt) {
        if (!this.isActive || this.isDefeated) return;
        
        this.animationTime += dt;
        this.rotation += dt * 0.5;
        
        // ENHANCED: Enrage timer
        if (!this.isEnraged) {
            this.enrageTimer -= dt;
            if (this.enrageTimer <= 0) {
                this.triggerEnrage();
            }
        }
        
        // ENHANCED: Rage mode update
        if (this.isRaging) {
            this.rageTimer -= dt;
            if (this.rageTimer <= 0) {
                this.isRaging = false;
                this.speed /= 1.5;
                this.attackCooldown /= 0.5;
            }
        }
        
        // ENHANCED: Telegraph system
        if (this.telegraph) {
            this.telegraphTimer -= dt;
            if (this.telegraphTimer <= 0) {
                this.executeQueuedAttack();
                this.telegraph = null;
            }
        }
        
        // Update attack timer
        this.attackTimer += dt;
        if (this.attackTimer >= this.attackCooldown && !this.telegraph) {
            this.prepareAttack();
            this.attackTimer = 0;
        }
        
        // Move boss toward target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.1) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        } else {
            this.pickNewTarget();
        }
        
        // Update hazards
        this.hazards = this.hazards.filter(h => {
            h.lifetime -= dt;
            if (h.lifetime <= 0) return false;
            
            // Move hazards
            if (h.vx !== undefined) {
                h.x += h.vx * dt;
                h.y += h.vy * dt;
            }
            
            // Check collision with snake
            const head = this.game.snake[0];
            if (Math.abs(h.x - head.x) < 1 && Math.abs(h.y - head.y) < 1) {
                if (!this.game.activePowerUps.invincible) {
                    this.game.handleCollision();
                    this.damageDealt++;
                }
            }
            
            return true;
        });
        
        // ENHANCED: Update minions
        this.updateMinions(dt);
        
        // Check if snake hits boss
        const head = this.game.snake[0];
        if (Math.abs(this.x - head.x) < 1.5 && Math.abs(this.y - head.y) < 1.5) {
            this.takeDamage();
        }
        
        // Flash effect decay
        if (this.flashTimer > 0) this.flashTimer -= dt;
    }
    
    // ENHANCED: Minion system
    updateMinions(dt) {
        const head = this.game.snake[0];
        
        this.minions = this.minions.filter(m => {
            m.lifetime -= dt;
            if (m.lifetime <= 0) return false;
            
            // AI: Chase player slowly
            const dx = head.x - m.x;
            const dy = head.y - m.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0.5) {
                m.x += (dx / dist) * m.speed * dt;
                m.y += (dy / dist) * m.speed * dt;
            }
            
            // Check collision with snake
            if (dist < 1) {
                if (!this.game.activePowerUps.invincible) {
                    this.game.handleCollision();
                }
            }
            
            // Animation
            m.animTime += dt;
            
            return true;
        });
    }
    
    // ENHANCED: Prepare attack with telegraph
    prepareAttack() {
        const pattern = this.patterns[this.currentPattern % this.patterns.length];
        this.currentPattern++;
        
        // Show telegraph warning
        this.telegraph = pattern;
        this.telegraphTimer = 0.8; // 0.8 second warning
        
        // Visual feedback
        this.game.camera.shake(2, 0.5);
    }
    
    // ENHANCED: Execute queued attack after telegraph
    executeQueuedAttack() {
        const pattern = this.telegraph;
        this.executeAttack(pattern);
        this.attackCooldown = pattern.cooldown || 2;
        
        // Faster attacks when enraged
        if (this.isEnraged) {
            this.attackCooldown *= 0.6;
        }
    }
    
    // ENHANCED: Enrage trigger
    triggerEnrage() {
        this.isEnraged = true;
        this.speed *= 1.5;
        this.attackCooldown *= 0.5;
        
        this.game.camera.shake(15, 1);
        this.game.camera.doFlash([1, 0, 0], 1);
        
        // Show enrage warning
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3em;
            color: #ff0000;
            text-shadow: 0 0 20px #ff0000;
            z-index: 2000;
            animation: pulse 0.5s infinite;
        `;
        warning.textContent = '⚠️ BOSS ENRAGED! ⚠️';
        document.body.appendChild(warning);
        setTimeout(() => warning.remove(), 2000);
    }
    
    // ENHANCED: Rage mode trigger on low HP
    triggerRageMode(duration = 5) {
        this.isRaging = true;
        this.rageTimer = duration;
        this.rageDuration = duration;
        this.speed *= 1.5;
        this.attackCooldown *= 0.5;
        
        this.game.camera.shake(10, 0.5);
    }
    
    pickNewTarget() {
        const gridSize = this.game.gridSize;
        this.targetX = 3 + Math.random() * (gridSize - 6);
        this.targetY = 3 + Math.random() * (gridSize - 6);
    }
    
    executeAttack(pattern = null) {
        if (!pattern) {
            pattern = this.patterns[this.currentPattern % this.patterns.length];
            this.currentPattern++;
        }
        
        switch (pattern.name) {
            case 'horizontal_sweep':
                this.horizontalSweep();
                break;
            case 'spawn_obstacles':
                this.spawnObstacles(pattern.count);
                break;
            case 'charge':
                this.chargeAtPlayer(pattern.speed);
                break;
            case 'freeze_zone':
                this.createFreezeZone(pattern.radius);
                break;
            case 'lava_trail':
                this.createLavaTrail();
                break;
            case 'fireball_barrage':
                this.fireballBarrage(pattern.count);
                break;
            case 'glitch_zone':
                this.createGlitchZone(pattern.tiles);
                break;
            case 'darkness':
                this.castDarkness(pattern.visibility, pattern.duration);
                break;
            case 'shadow_clones':
                this.summonClones(pattern.count);
                break;
            // ENHANCED: New attack patterns
            case 'spawn_minions':
                this.spawnMinions(pattern.count);
                break;
            case 'laser_beam':
                this.fireLaserBeam(pattern.direction);
                break;
            case 'shockwave':
                this.createShockwave(pattern.radius);
                break;
            case 'meteor_shower':
                this.meteorShower(pattern.count);
                break;
            case 'gravity_pull':
                this.gravityPull(pattern.duration);
                break;
            case 'teleport_strike':
                this.teleportStrike();
                break;
            case 'soul_drain':
                this.soulDrain(pattern.duration);
                break;
            default:
                this.spawnObstacles(3);
        }
        
        if (!pattern) {
            this.attackCooldown = this.patterns[this.currentPattern - 1]?.cooldown || 2;
        }
    }
    
    horizontalSweep() {
        // Create a line of hazards across the screen
        const y = Math.floor(this.y);
        for (let x = 0; x < this.game.gridSize; x++) {
            this.hazards.push({
                x, y,
                type: 'sweep',
                lifetime: 1.5,
                color: '#ff4400'
            });
        }
        this.game.camera.shake(3, 0.3);
    }
    
    spawnObstacles(count) {
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * this.game.gridSize);
            const y = Math.floor(Math.random() * this.game.gridSize);
            this.game.obstacles.push({ x, y, type: 'boss_spawn', temporary: true, lifetime: 5 });
        }
    }
    
    chargeAtPlayer(speed) {
        const head = this.game.snake[0];
        this.targetX = head.x;
        this.targetY = head.y;
        this.speed = speed;
        setTimeout(() => this.speed = 3, 1000);
    }
    
    createFreezeZone(radius) {
        const cx = Math.floor(this.x);
        const cy = Math.floor(this.y);
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (dx*dx + dy*dy <= radius*radius) {
                    this.hazards.push({
                        x: cx + dx, y: cy + dy,
                        type: 'freeze',
                        lifetime: 3,
                        color: '#88ffff'
                    });
                }
            }
        }
    }
    
    createLavaTrail() {
        // Boss leaves lava behind for a duration
        this.hazards.push({
            x: Math.floor(this.x),
            y: Math.floor(this.y),
            type: 'lava',
            lifetime: 4,
            color: '#ff3300'
        });
    }
    
    fireballBarrage(count) {
        const head = this.game.snake[0];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            this.hazards.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                type: 'fireball',
                lifetime: 3,
                color: '#ff6600'
            });
        }
    }
    
    createGlitchZone(tiles) {
        for (let i = 0; i < tiles; i++) {
            this.hazards.push({
                x: Math.floor(Math.random() * this.game.gridSize),
                y: Math.floor(Math.random() * this.game.gridSize),
                type: 'glitch',
                lifetime: 2,
                color: '#00ff00'
            });
        }
    }
    
    castDarkness(visibility, duration) {
        // Reduce visibility around player
        this.game.darknessEffect = {
            radius: visibility,
            duration: duration
        };
    }
    
    summonClones(count) {
        for (let i = 0; i < count; i++) {
            this.hazards.push({
                x: Math.random() * this.game.gridSize,
                y: Math.random() * this.game.gridSize,
                type: 'clone',
                lifetime: 4,
                color: '#666666',
                isFake: true
            });
        }
    }
    
    // ENHANCED: Spawn minions
    spawnMinions(count) {
        for (let i = 0; i < count && this.minions.length < this.maxMinions; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const dist = 5;
            
            this.minions.push({
                x: this.x + Math.cos(angle) * dist,
                y: this.y + Math.sin(angle) * dist,
                speed: 2,
                lifetime: 15,
                hp: 1,
                color: this.getBossColor(),
                animTime: 0
            });
        }
        
        this.game.camera.shake(3, 0.3);
    }
    
    // ENHANCED: Laser beam attack
    fireLaserBeam(direction) {
        const gridSize = this.game.gridSize;
        
        if (direction === 'horizontal' || direction === 'cross') {
            const y = Math.floor(this.y);
            for (let x = 0; x < gridSize; x++) {
                this.hazards.push({
                    x, y,
                    type: 'laser',
                    lifetime: 0.5,
                    color: '#ff00ff'
                });
            }
        }
        
        if (direction === 'vertical' || direction === 'cross') {
            const x = Math.floor(this.x);
            for (let y = 0; y < gridSize; y++) {
                this.hazards.push({
                    x, y,
                    type: 'laser',
                    lifetime: 0.5,
                    color: '#ff00ff'
                });
            }
        }
        
        this.game.camera.shake(8, 0.3);
        this.game.camera.doFlash([1, 0, 1], 0.1);
    }
    
    // ENHANCED: Shockwave attack
    createShockwave(radius) {
        const cx = Math.floor(this.x);
        const cy = Math.floor(this.y);
        
        // Expand outward over time
        for (let r = 1; r <= radius; r++) {
            setTimeout(() => {
                for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
                    const x = cx + Math.cos(angle) * r;
                    const y = cy + Math.sin(angle) * r;
                    
                    this.hazards.push({
                        x, y,
                        type: 'shockwave',
                        lifetime: 0.3,
                        color: '#ffff00'
                    });
                }
            }, r * 100);
        }
        
        this.game.camera.shake(10, 0.5);
    }
    
    // ENHANCED: Meteor shower attack
    meteorShower(count) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const targetX = Math.floor(Math.random() * this.game.gridSize);
                const targetY = Math.floor(Math.random() * this.game.gridSize);
                
                // Warning indicator
                this.hazards.push({
                    x: targetX,
                    y: targetY,
                    type: 'meteor_warning',
                    lifetime: 1,
                    color: 'rgba(255,0,0,0.5)'
                });
                
                // Actual meteor impact
                setTimeout(() => {
                    this.hazards.push({
                        x: targetX,
                        y: targetY,
                        type: 'meteor',
                        lifetime: 2,
                        color: '#ff3300'
                    });
                    
                    // Explosion particles
                    this.game.particleSystem?.emitExplosion(
                        targetX * this.game.cellSize,
                        targetY * this.game.cellSize,
                        [1, 0.5, 0],
                        15
                    );
                    
                    this.game.camera.shake(5, 0.2);
                }, 1000);
            }, i * 300);
        }
    }
    
    // ENHANCED: Gravity pull attack
    gravityPull(duration) {
        this.game.gravityWell = {
            x: this.x,
            y: this.y,
            strength: 0.5,
            duration: duration
        };
        
        // Visual indicator
        for (let r = 1; r <= 10; r++) {
            this.hazards.push({
                x: this.x,
                y: this.y,
                type: 'gravity',
                radius: r * 2,
                lifetime: duration,
                color: 'rgba(100,0,200,0.3)'
            });
        }
    }
    
    // ENHANCED: Teleport strike attack
    teleportStrike() {
        const head = this.game.snake[0];
        
        // Flash effect
        this.game.camera.doFlash([0.5, 0, 0.5], 0.2);
        
        // Teleport to player
        this.x = head.x;
        this.y = head.y;
        
        // Create hazard at landing spot
        this.hazards.push({
            x: head.x,
            y: head.y,
            type: 'teleport_impact',
            lifetime: 0.5,
            color: '#8800ff'
        });
        
        this.game.camera.shake(8, 0.3);
    }
    
    // ENHANCED: Soul drain attack
    soulDrain(duration) {
        // Create zone around boss that slows player
        this.game.slowZone = {
            x: this.x,
            y: this.y,
            radius: 8,
            factor: 0.5,
            duration: duration
        };
        
        // Visual
        for (let r = 1; r <= 8; r++) {
            this.hazards.push({
                x: this.x,
                y: this.y,
                type: 'soul_drain',
                radius: r,
                lifetime: duration,
                color: 'rgba(50,0,100,0.2)'
            });
        }
    }
    
    takeDamage() {
        if (this.flashTimer > 0) return; // Invincibility frames
        
        this.hp--;
        this.hitsTaken++;
        this.flashTimer = 0.5;
        this.shakeAmount = 5;
        
        this.game.camera.shake(8, 0.4);
        this.game.particleSystem.emitExplosion(
            this.x * this.game.cellSize,
            this.y * this.game.cellSize,
            [1, 0, 0],
            20
        );
        
        // Play damage sound
        this.game.audio?.playSFX('boss_hit');
        
        // Check phase transition
        const phaseHp = this.maxHp / this.maxPhases;
        const newPhase = Math.ceil((this.maxHp - this.hp) / phaseHp) + 1;
        if (newPhase > this.phase && newPhase <= this.maxPhases) {
            this.phase = newPhase;
            this.onPhaseChange();
        }
        
        // ENHANCED: Trigger rage at low HP
        if (this.hp <= this.maxHp * 0.25 && !this.isRaging && !this.isEnraged) {
            this.triggerRageMode(8);
        }
        
        // Check defeat
        if (this.hp <= 0) {
            this.defeat();
        }
    }
    
    onPhaseChange() {
        // Boss gets stronger each phase
        this.speed *= 1.2;
        this.attackCooldown *= 0.8;
        
        this.game.camera.shake(15, 0.8);
        this.game.camera.doFlash([1, 0.5, 0], 0.5);
        
        // Show phase transition
        this.showBossIntro();
    }
    
    defeat() {
        this.isActive = false;
        this.isDefeated = true;
        
        // Epic death sequence
        this.game.camera.startSlowMotion(0.2, 2);
        this.game.camera.shake(20, 1);
        
        // Spawn tons of particles
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.game.particleSystem.emitFirework(
                    this.x * this.game.cellSize + (Math.random() - 0.5) * 100,
                    this.y * this.game.cellSize + (Math.random() - 0.5) * 100
                );
            }, i * 50);
        }
        
        // Award points
        this.game.addScore(this.maxHp * 100);
        
        // Show victory
        setTimeout(() => {
            this.showVictory();
        }, 2500);
    }
    
    showVictory() {
        this.game.togglePause(true);
        
        const overlay = document.createElement('div');
        overlay.id = 'boss-victory';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;
        overlay.innerHTML = `
            <h1 style="font-size: 4em; color: #ffd700; text-shadow: 0 0 30px #ffd700;">
                VICTORY!
            </h1>
            <h2 style="font-size: 2em; color: #fff;">${this.bossData.name} Defeated</h2>
            <p style="color: #aaa; margin-top: 20px;">+${this.maxHp * 100} Points</p>
            <button id="continue-story" style="
                margin-top: 30px;
                padding: 15px 40px;
                font-size: 1.2em;
                background: linear-gradient(135deg, #00ff88, #00cc66);
                border: none;
                border-radius: 10px;
                color: #000;
                cursor: pointer;
            ">Continue</button>
        `;
        document.body.appendChild(overlay);
        
        document.getElementById('continue-story').onclick = () => {
            overlay.remove();
            this.game.togglePause(false);
            this.game.storyMode.unlockNextWorld();
        };
    }
    
    render(ctx) {
        if (!this.isActive && !this.isDefeated) return;
        
        const cellSize = this.game.cellSize;
        const x = this.x * cellSize;
        const y = this.y * cellSize;
        
        // ENHANCED: Render telegraph warning
        if (this.telegraph) {
            ctx.save();
            ctx.globalAlpha = 0.3 + Math.sin(this.animationTime * 20) * 0.2;
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            
            // Draw warning indicator based on attack type
            if (this.telegraph.name === 'horizontal_sweep') {
                ctx.strokeRect(0, this.y * cellSize - cellSize, this.game.gridSize * cellSize, cellSize * 3);
            } else if (this.telegraph.name === 'charge') {
                const head = this.game.snake[0];
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(head.x * cellSize, head.y * cellSize);
                ctx.stroke();
            } else {
                // Generic warning circle
                ctx.beginPath();
                ctx.arc(x, y, cellSize * 5, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }
        
        // Render hazards
        for (const hazard of this.hazards) {
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = hazard.color;
            
            if (hazard.radius) {
                // Circular hazards
                ctx.beginPath();
                ctx.arc(hazard.x * cellSize, hazard.y * cellSize, hazard.radius * cellSize, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(
                    hazard.x * cellSize + 2,
                    hazard.y * cellSize + 2,
                    cellSize - 4,
                    cellSize - 4
                );
            }
        }
        ctx.globalAlpha = 1;
        
        // ENHANCED: Render minions
        for (const minion of this.minions) {
            const pulse = 1 + Math.sin(minion.animTime * 10) * 0.1;
            
            ctx.fillStyle = this.darkenColor(minion.color, 0.7);
            ctx.shadowColor = minion.color;
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.arc(minion.x * cellSize, minion.y * cellSize, cellSize * 0.4 * pulse, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
        }
        
        if (this.isDefeated) return;
        
        // Boss body
        const flash = this.flashTimer > 0 && Math.sin(this.flashTimer * 30) > 0;
        const rageGlow = this.isRaging || this.isEnraged;
        
        ctx.fillStyle = flash ? '#ffffff' : this.getBossColor();
        ctx.shadowColor = rageGlow ? '#ff0000' : this.getBossColor();
        ctx.shadowBlur = (rageGlow ? 30 : 20) + Math.sin(this.animationTime * 5) * 10;
        
        // Draw boss (larger than normal cell)
        const size = cellSize * 2;
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Boss face/icon
        ctx.font = `${size * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.getBossIcon(), x, y);
        
        // ENHANCED: Rage indicator
        if (this.isRaging || this.isEnraged) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, size / 2 + 5 + Math.sin(this.animationTime * 10) * 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
        
        // Health bar
        this.renderHealthBar(ctx, x, y - size);
        
        // ENHANCED: Enrage timer bar
        if (!this.isEnraged && this.enrageTimer < 30) {
            this.renderEnrageTimer(ctx, x, y - size - 20);
        }
    }
    
    // ENHANCED: Render enrage timer
    renderEnrageTimer(ctx, x, y) {
        const width = 80;
        const height = 5;
        const progress = this.enrageTimer / 120;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(x - width / 2, y, width, height);
        
        ctx.fillStyle = progress > 0.3 ? '#ff6600' : '#ff0000';
        ctx.fillRect(x - width / 2, y, width * progress, height);
    }
    
    // Helper to darken color
    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.floor(parseInt(hex.substr(0, 2), 16) * factor);
        const g = Math.floor(parseInt(hex.substr(2, 2), 16) * factor);
        const b = Math.floor(parseInt(hex.substr(4, 2), 16) * factor);
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    getBossColor() {
        const colors = {
            'lawnmower': '#44aa44',
            'ice_wyrm': '#44aaff',
            'fire_elemental': '#ff4400',
            'virus': '#44ff44',
            'shadow': '#8800ff'
        };
        return colors[this.bossData.type] || '#ff0000';
    }
    
    getBossIcon() {
        const icons = {
            'lawnmower': '🚜',
            'ice_wyrm': '🐉',
            'fire_elemental': '🔥',
            'virus': '👾',
            'shadow': '👤'
        };
        return icons[this.bossData.type] || '👹';
    }
    
    renderHealthBar(ctx, x, y) {
        const width = 100;
        const height = 10;
        
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(x - width/2, y, width, height);
        
        // Health fill
        const healthPercent = this.hp / this.maxHp;
        const gradient = ctx.createLinearGradient(x - width/2, y, x - width/2 + width * healthPercent, y);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(1, '#ff6600');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - width/2, y, width * healthPercent, height);
        
        // Border
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(x - width/2, y, width, height);
        
        // Phase indicators
        for (let i = 1; i < this.maxPhases; i++) {
            const px = x - width/2 + (width * i / this.maxPhases);
            ctx.strokeStyle = '#000';
            ctx.beginPath();
            ctx.moveTo(px, y);
            ctx.lineTo(px, y + height);
            ctx.stroke();
        }
    }
}
