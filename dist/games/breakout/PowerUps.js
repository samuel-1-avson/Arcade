/**
 * Breakout Game - Power-ups System
 * Extended power-up definitions, effects, and management
 */

// Power-up type definitions
export const POWERUP_TYPES = {
    // ===== ORIGINAL POWER-UPS =====
    WIDE_PADDLE: {
        id: 'wide_paddle',
        name: 'Wide Paddle',
        color: '#00ff00',
        symbol: '[W]',
        duration: 10,
        rarity: 'common',
        description: 'Widens the paddle by 50%'
    },
    MULTI_BALL: {
        id: 'multi_ball',
        name: 'Multi-Ball',
        color: '#ff00ff',
        symbol: '[M]',
        duration: 0, // Instant effect
        rarity: 'uncommon',
        description: 'Splits into 3 balls'
    },
    SLOW_BALL: {
        id: 'slow_ball',
        name: 'Slow Motion',
        color: '#00ffff',
        symbol: '[S]',
        duration: 8,
        rarity: 'common',
        description: 'Slows ball movement by 40%'
    },
    FIRE_BALL: {
        id: 'fire_ball',
        name: 'Fire Ball',
        color: '#ff6600',
        symbol: '[F]',
        duration: 5,
        rarity: 'rare',
        description: 'Ball burns through bricks without bouncing'
    },
    
    // ===== NEW POWER-UPS =====
    LASER_PADDLE: {
        id: 'laser_paddle',
        name: 'Laser Paddle',
        color: '#ff0000',
        symbol: '[L]',
        duration: 10,
        rarity: 'rare',
        description: 'Shoot lasers from the paddle'
    },
    MAGNET_PADDLE: {
        id: 'magnet_paddle',
        name: 'Magnet',
        color: '#8800ff',
        symbol: '[G]',
        duration: 8,
        rarity: 'uncommon',
        description: 'Ball sticks to paddle, aim and release'
    },
    SHIELD: {
        id: 'shield',
        name: 'Shield',
        color: '#0088ff',
        symbol: '[H]',
        duration: 0, // Lasts until used
        rarity: 'rare',
        description: 'Creates a safety barrier at the bottom'
    },
    GHOST_BALL: {
        id: 'ghost_ball',
        name: 'Ghost Ball',
        color: '#aaaaff',
        symbol: '[O]',
        duration: 5,
        rarity: 'rare',
        description: 'Ball passes through bricks without bouncing'
    },
    MEGA_BALL: {
        id: 'mega_ball',
        name: 'Mega Ball',
        color: '#ffaa00',
        symbol: '[B]',
        duration: 8,
        rarity: 'uncommon',
        description: 'Ball grows to 2x size'
    },
    SPEED_UP: {
        id: 'speed_up',
        name: 'Speed Boost',
        color: '#ff0088',
        symbol: '[Q]',
        duration: 6,
        rarity: 'common',
        description: 'Ball moves 50% faster (more points!)'
    },
    EXTRA_LIFE: {
        id: 'extra_life',
        name: 'Extra Life',
        color: '#ff4444',
        symbol: '[UP]',
        duration: 0, // Instant
        rarity: 'legendary',
        description: '+1 Life'
    },
    SCORE_BOOST: {
        id: 'score_boost',
        name: 'Score Boost',
        color: '#ffd700',
        symbol: '[2X]',
        duration: 15,
        rarity: 'uncommon',
        description: 'Double points for 15 seconds'
    }
};

// Rarity weights for random power-up spawning
export const RARITY_WEIGHTS = {
    common: 40,
    uncommon: 30,
    rare: 20,
    legendary: 10
};

// Get power-ups by rarity
export function getPowerupsByRarity(rarity) {
    return Object.values(POWERUP_TYPES).filter(p => p.rarity === rarity);
}

// Get a random power-up based on weighted rarity
export function getRandomPowerup() {
    const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
        random -= weight;
        if (random <= 0) {
            const powerups = getPowerupsByRarity(rarity);
            return powerups[Math.floor(Math.random() * powerups.length)];
        }
    }
    
    // Fallback
    const allPowerups = Object.values(POWERUP_TYPES);
    return allPowerups[Math.floor(Math.random() * allPowerups.length)];
}

/**
 * PowerUp class - represents a falling power-up
 */
export class PowerUp {
    constructor(x, y, type = null) {
        this.x = x;
        this.y = y;
        this.width = 28;
        this.height = 28;
        this.vy = 100; // Fall speed
        
        // Get power-up type
        this.type = type || getRandomPowerup();
        this.typeId = this.type.id;
        this.color = this.type.color;
        this.symbol = this.type.symbol;
        
        // Animation
        this.rotation = 0;
        this.pulse = 0;
    }
    
    update(dt) {
        // Fall down
        this.y += this.vy * dt;
        
        // Animation
        this.rotation += dt * 2;
        this.pulse += dt * 4;
    }
    
    checkPaddleCollision(paddle) {
        return this.y + this.height / 2 > paddle.y - paddle.height / 2 &&
               this.y - this.height / 2 < paddle.y + paddle.height / 2 &&
               this.x > paddle.x - paddle.width / 2 &&
               this.x < paddle.x + paddle.width / 2;
    }
    
    isOffScreen(canvasHeight) {
        return this.y > canvasHeight + 30;
    }
    
    render(ctx) {
        ctx.save();
        
        // Glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12 + Math.sin(this.pulse) * 4;
        
        // Draw power-up circle
        const radius = this.width / 2 + Math.sin(this.pulse) * 2;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radius);
        gradient.addColorStop(0, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw symbol
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, this.x, this.y);
        
        ctx.restore();
    }
}

/**
 * PowerUpManager - manages active power-ups and their effects
 */
export class PowerUpManager {
    constructor(game) {
        this.game = game;
        this.fallingPowerups = [];
        this.activePowerups = new Map(); // type -> remaining duration
        this.shieldActive = false;
        this.laserCooldown = 0;
        this.lasers = [];
    }
    
    reset() {
        this.fallingPowerups = [];
        this.activePowerups.clear();
        this.shieldActive = false;
        this.laserCooldown = 0;
        this.lasers = [];
    }
    
    spawn(x, y, guaranteedType = null) {
        let type = null;
        if (guaranteedType) {
            type = POWERUP_TYPES[guaranteedType.toUpperCase()] || POWERUP_TYPES[guaranteedType];
        }
        this.fallingPowerups.push(new PowerUp(x, y, type));
    }
    
    update(dt) {
        // Update falling power-ups
        for (let i = this.fallingPowerups.length - 1; i >= 0; i--) {
            const powerup = this.fallingPowerups[i];
            powerup.update(dt);
            
            // Check paddle collision
            if (powerup.checkPaddleCollision(this.game.paddle)) {
                this.activate(powerup.type);
                this.fallingPowerups.splice(i, 1);
                continue;
            }
            
            // Remove if off screen
            if (powerup.isOffScreen(this.game.canvas.height)) {
                this.fallingPowerups.splice(i, 1);
            }
        }
        
        // Update active power-up durations
        for (const [typeId, remaining] of this.activePowerups.entries()) {
            if (remaining > 0) {
                this.activePowerups.set(typeId, remaining - dt);
                if (this.activePowerups.get(typeId) <= 0) {
                    this.deactivate(typeId);
                }
            }
        }
        
        // Update lasers
        this.updateLasers(dt);
        
        // Update laser cooldown
        if (this.laserCooldown > 0) {
            this.laserCooldown -= dt;
        }
    }
    
    activate(type) {
        const game = this.game;
        
        switch (type.id) {
            case 'wide_paddle':
                game.paddle.width = game.config.paddleWidth * 1.5;
                this.activePowerups.set(type.id, type.duration);
                break;
                
            case 'multi_ball':
                // Add 2 more balls
                const originalBall = game.balls[0];
                if (originalBall) {
                    for (let i = 0; i < 2; i++) {
                        const angle = (i === 0 ? -1 : 1) * Math.PI / 6;
                        const cos = Math.cos(angle);
                        const sin = Math.sin(angle);
                        game.balls.push({
                            x: originalBall.x,
                            y: originalBall.y,
                            vx: originalBall.vx * cos - originalBall.vy * sin,
                            vy: originalBall.vx * sin + originalBall.vy * cos,
                            radius: originalBall.radius,
                            speed: originalBall.speed,
                            fireBall: originalBall.fireBall,
                            ghostBall: originalBall.ghostBall,
                            megaBall: originalBall.megaBall
                        });
                    }
                }
                break;
                
            case 'slow_ball':
                game.balls.forEach(b => {
                    b.vx *= 0.6;
                    b.vy *= 0.6;
                    b.speed *= 0.6;
                });
                this.activePowerups.set(type.id, type.duration);
                break;
                
            case 'fire_ball':
                game.balls.forEach(b => b.fireBall = true);
                this.activePowerups.set(type.id, type.duration);
                break;
                
            case 'laser_paddle':
                game.paddle.hasLaser = true;
                this.activePowerups.set(type.id, type.duration);
                break;
                
            case 'magnet_paddle':
                game.paddle.hasMagnet = true;
                this.activePowerups.set(type.id, type.duration);
                break;
                
            case 'shield':
                this.shieldActive = true;
                break;
                
            case 'ghost_ball':
                game.balls.forEach(b => b.ghostBall = true);
                this.activePowerups.set(type.id, type.duration);
                break;
                
            case 'mega_ball':
                game.balls.forEach(b => {
                    b.megaBall = true;
                    b.radius = game.config.ballRadius * 2;
                });
                this.activePowerups.set(type.id, type.duration);
                break;
                
            case 'speed_up':
                game.balls.forEach(b => {
                    b.vx *= 1.5;
                    b.vy *= 1.5;
                    b.speed *= 1.5;
                });
                this.activePowerups.set(type.id, type.duration);
                break;
                
            case 'extra_life':
                game.lives++;
                game.updateLivesDisplay();
                break;
                
            case 'score_boost':
                game.scoreMultiplier = 2;
                this.activePowerups.set(type.id, type.duration);
                break;
        }
        
        // Show pickup effect
        this.showPickupEffect(type);
    }
    
    deactivate(typeId) {
        const game = this.game;
        
        switch (typeId) {
            case 'wide_paddle':
                game.paddle.width = game.config.paddleWidth;
                break;
                
            case 'slow_ball':
            case 'speed_up':
                // Normalize ball speed
                game.balls.forEach(b => {
                    const currentSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                    if (currentSpeed > 0) {
                        const scale = game.config.ballSpeed / currentSpeed;
                        b.vx *= scale;
                        b.vy *= scale;
                        b.speed = game.config.ballSpeed;
                    }
                });
                break;
                
            case 'fire_ball':
                game.balls.forEach(b => b.fireBall = false);
                break;
                
            case 'laser_paddle':
                game.paddle.hasLaser = false;
                break;
                
            case 'magnet_paddle':
                game.paddle.hasMagnet = false;
                // Release any stuck balls
                game.balls.forEach(b => {
                    if (b.stuck) {
                        b.stuck = false;
                    }
                });
                break;
                
            case 'ghost_ball':
                game.balls.forEach(b => b.ghostBall = false);
                break;
                
            case 'mega_ball':
                game.balls.forEach(b => {
                    b.megaBall = false;
                    b.radius = game.config.ballRadius;
                });
                break;
                
            case 'score_boost':
                game.scoreMultiplier = 1;
                break;
        }
        
        this.activePowerups.delete(typeId);
    }
    
    isActive(typeId) {
        return this.activePowerups.has(typeId);
    }
    
    // Laser system
    shootLaser() {
        if (this.laserCooldown > 0 || !this.game.paddle.hasLaser) return;
        
        const paddle = this.game.paddle;
        this.lasers.push({
            x: paddle.x - paddle.width / 4,
            y: paddle.y - paddle.height,
            width: 4,
            height: 15,
            vy: -500
        });
        this.lasers.push({
            x: paddle.x + paddle.width / 4,
            y: paddle.y - paddle.height,
            width: 4,
            height: 15,
            vy: -500
        });
        
        this.laserCooldown = 0.2; // 200ms between shots
    }
    
    updateLasers(dt) {
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.y += laser.vy * dt;
            
            // Check brick collisions
            for (const brick of this.game.bricks) {
                if (!brick.alive) continue;
                
                if (laser.x > brick.x && 
                    laser.x < brick.x + brick.width &&
                    laser.y > brick.y && 
                    laser.y < brick.y + brick.height) {
                    
                    const result = brick.hit ? brick.hit() : { destroyed: true, points: 10 };
                    if (result && result.destroyed) {
                        this.game.addScore(result.points * this.game.scoreMultiplier);
                    }
                    this.lasers.splice(i, 1);
                    break;
                }
            }
            
            // Remove if off screen
            if (laser.y < -20) {
                this.lasers.splice(i, 1);
            }
        }
    }
    
    // Shield check
    checkShield(ball) {
        if (!this.shieldActive) return false;
        
        const shieldY = this.game.canvas.height - 10;
        if (ball.y + ball.radius > shieldY && ball.vy > 0) {
            ball.vy = -Math.abs(ball.vy);
            ball.y = shieldY - ball.radius;
            this.shieldActive = false; // Shield breaks after one use
            return true;
        }
        return false;
    }
    
    showPickupEffect(type) {
        // Create a brief text popup
        const popup = document.createElement('div');
        popup.className = 'powerup-popup';
        popup.textContent = `${type.symbol} ${type.name}`;
        popup.style.cssText = `
            position: fixed;
            left: 50%;
            top: 40%;
            transform: translate(-50%, -50%);
            background: ${type.color};
            color: #000;
            padding: 10px 20px;
            border-radius: 20px;
            font-family: 'Orbitron', sans-serif;
            font-weight: bold;
            font-size: 1.2rem;
            z-index: 1000;
            animation: popupAnim 1s ease forwards;
            pointer-events: none;
        `;
        document.body.appendChild(popup);
        
        setTimeout(() => popup.remove(), 1000);
    }
    
    render(ctx) {
        // Render falling power-ups
        for (const powerup of this.fallingPowerups) {
            powerup.render(ctx);
        }
        
        // Render lasers
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        for (const laser of this.lasers) {
            ctx.fillRect(laser.x - laser.width / 2, laser.y, laser.width, laser.height);
        }
        ctx.shadowBlur = 0;
        
        // Render shield
        if (this.shieldActive) {
            const shieldY = this.game.canvas.height - 10;
            ctx.strokeStyle = '#0088ff';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#0088ff';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(0, shieldY);
            ctx.lineTo(this.game.canvas.width, shieldY);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }
    
    // Get active power-ups for UI display
    getActivePowerupsDisplay() {
        const display = [];
        for (const [typeId, remaining] of this.activePowerups.entries()) {
            const type = Object.values(POWERUP_TYPES).find(t => t.id === typeId);
            if (type) {
                display.push({
                    name: type.name,
                    symbol: type.symbol,
                    color: type.color,
                    remaining: Math.ceil(remaining)
                });
            }
        }
        if (this.shieldActive) {
            display.push({
                name: 'Shield',
                symbol: '🛡️',
                color: '#0088ff',
                remaining: '∞'
            });
        }
        return display;
    }
}

// Add popup animation styles
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes popupAnim {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
            40% { transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -100%) scale(0.8); }
        }
    `;
    document.head.appendChild(style);
}

export default { POWERUP_TYPES, PowerUp, PowerUpManager, getRandomPowerup };
