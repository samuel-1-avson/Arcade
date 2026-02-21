/**
 * Snake Game - Advanced Features
 * Destructible environments, secret areas, Battle Royale, and custom game creator
 */
import { MultiplayerManager } from './MultiplayerManager.js';

// Destructible obstacle types
export const DESTRUCTIBLE_TYPES = {
    wood: { hp: 1, color: '#8B4513', debris: '🪵', points: 5 },
    stone: { hp: 2, color: '#708090', debris: '🪨', points: 10 },
    crystal: { hp: 3, color: '#88CCFF', debris: '💎', points: 25 },
    metal: { hp: 4, color: '#888888', debris: '⚙️', points: 15 },
    ice: { hp: 1, color: '#88FFFF', debris: '❄️', points: 8, meltTime: 30 }
};

export class DestructibleEnvironment {
    constructor(game) {
        this.game = game;
        this.destructibles = [];
    }
    
    // Convert static obstacles to destructible ones
    convertObstacles(obstacles, worldId) {
        return obstacles.map(obs => {
            if (obs.type === 'static' && Math.random() < 0.3) {
                // Convert to destructible based on world
                const types = this.getWorldTypes(worldId);
                const type = types[Math.floor(Math.random() * types.length)];
                const config = DESTRUCTIBLE_TYPES[type];
                
                return {
                    ...obs,
                    type: 'destructible',
                    destructType: type,
                    hp: config.hp,
                    maxHp: config.hp,
                    color: config.color
                };
            }
            return obs;
        });
    }
    
    getWorldTypes(worldId) {
        switch (worldId) {
            case 'garden': return ['wood'];
            case 'ice': return ['ice', 'crystal'];
            case 'volcano': return ['stone', 'metal'];
            case 'cyber': return ['metal', 'crystal'];
            case 'void': return ['crystal', 'stone'];
            default: return ['wood', 'stone'];
        }
    }
    
    damageObstacle(obstacle, damage = 1) {
        if (obstacle.type !== 'destructible') return false;
        
        obstacle.hp -= damage;
        
        // Visual feedback
        this.game.camera?.shake(2, 0.1);
        
        if (obstacle.hp <= 0) {
            return this.destroyObstacle(obstacle);
        }
        
        return false;
    }
    
    destroyObstacle(obstacle) {
        const config = DESTRUCTIBLE_TYPES[obstacle.destructType];
        
        // Spawn debris particles
        this.game.particleSystem?.emitExplosion(
            obstacle.x * this.game.cellSize,
            obstacle.y * this.game.cellSize,
            [0.5, 0.3, 0.1],
            8
        );
        
        // Add points
        this.game.addScore(config.points);
        
        // Remove from obstacles array
        const index = this.game.obstacles.indexOf(obstacle);
        if (index > -1) {
            this.game.obstacles.splice(index, 1);
        }
        
        // Chance to drop power-up
        if (Math.random() < 0.2) {
            this.game.spawnPowerUpAt?.(obstacle.x, obstacle.y);
        }
        
        return true;
    }
    
    render(ctx, cellSize) {
        for (const obs of this.game.obstacles) {
            if (obs.type !== 'destructible') continue;
            
            const config = DESTRUCTIBLE_TYPES[obs.destructType];
            const x = obs.x * cellSize;
            const y = obs.y * cellSize;
            
            // Draw obstacle
            ctx.fillStyle = config.color;
            ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
            
            // Health bar if damaged
            if (obs.hp < obs.maxHp) {
                const healthPercent = obs.hp / obs.maxHp;
                ctx.fillStyle = '#333';
                ctx.fillRect(x, y - 5, cellSize, 3);
                ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : '#ff0000';
                ctx.fillRect(x, y - 5, cellSize * healthPercent, 3);
            }
            
            // Crack effect for damaged obstacles
            if (obs.hp < obs.maxHp) {
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + cellSize * 0.2, y + cellSize * 0.2);
                ctx.lineTo(x + cellSize * 0.5, y + cellSize * 0.5);
                ctx.lineTo(x + cellSize * 0.8, y + cellSize * 0.3);
                ctx.stroke();
            }
        }
    }
}

// Secret Areas System
export const SECRET_AREAS = {
    garden_secret: {
        id: 'garden_secret',
        world: 'garden',
        trigger: { x: 5, y: 5, width: 2, height: 2 },
        condition: 'length_20',
        reward: { type: 'coins', amount: 100 },
        hint: 'Grow strong, and the garden will reveal its secrets...'
    },
    ice_secret: {
        id: 'ice_secret',
        world: 'ice',
        trigger: { x: 25, y: 25, width: 3, height: 3 },
        condition: 'no_damage',
        reward: { type: 'ability_unlock', ability: 'time_warp' },
        hint: 'The pure of heart may find the frozen treasure...'
    },
    volcano_secret: {
        id: 'volcano_secret',
        world: 'volcano',
        trigger: { x: 15, y: 2, width: 2, height: 2 },
        condition: 'fire_powerup',
        reward: { type: 'skin_unlock', skin: 'phoenix' },
        hint: 'Only those who embrace the flames can pass...'
    },
    cyber_secret: {
        id: 'cyber_secret',
        world: 'cyber',
        trigger: { x: 1, y: 15, width: 2, height: 2 },
        condition: 'speed_powerup',
        reward: { type: 'coins', amount: 250 },
        hint: 'Move faster than the system can track...'
    },
    void_secret: {
        id: 'void_secret',
        world: 'void',
        trigger: { x: 15, y: 15, width: 3, height: 3 },
        condition: 'collect_all_lore',
        reward: { type: 'ending_unlock', ending: 'true' },
        hint: 'Those who understand the void may transcend it...'
    }
};

export class SecretAreaManager {
    constructor(game) {
        this.game = game;
        this.discoveredSecrets = this.loadDiscovered();
        this.activeHints = [];
    }
    
    loadDiscovered() {
        const saved = localStorage.getItem('snake_secrets');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveDiscovered() {
        localStorage.setItem('snake_secrets', JSON.stringify(this.discoveredSecrets));
    }
    
    checkSecretArea(headX, headY, worldId) {
        for (const [id, secret] of Object.entries(SECRET_AREAS)) {
            if (secret.world !== worldId) continue;
            if (this.discoveredSecrets.includes(id)) continue;
            
            const t = secret.trigger;
            if (headX >= t.x && headX < t.x + t.width &&
                headY >= t.y && headY < t.y + t.height) {
                
                if (this.checkCondition(secret.condition)) {
                    this.discoverSecret(secret);
                    return secret;
                } else {
                    // Show hint if near but condition not met
                    this.showHint(secret.hint);
                }
            }
        }
        return null;
    }
    
    checkCondition(condition) {
        switch (condition) {
            case 'length_20':
                return this.game.snake.length >= 20;
            case 'no_damage':
                return this.game.lives === 3 && this.game.gameMode === 'CLASSIC';
            case 'fire_powerup':
                return !!this.game.activePowerUps.fire;
            case 'speed_powerup':
                return !!this.game.activePowerUps.speed;
            case 'collect_all_lore':
                const collected = JSON.parse(localStorage.getItem('snake_collectibles') || '[]');
                return collected.filter(c => c.startsWith('lore_')).length >= 5;
            default:
                return true;
        }
    }
    
    discoverSecret(secret) {
        this.discoveredSecrets.push(secret.id);
        this.saveDiscovered();
        
        // Apply reward
        this.applyReward(secret.reward);
        
        // Show discovery popup
        this.showDiscoveryPopup(secret);
    }
    
    applyReward(reward) {
        switch (reward.type) {
            case 'coins':
                this.game.shop?.addCurrency(reward.amount);
                break;
            case 'ability_unlock':
                this.game.abilityManager?.unlockAbility(reward.ability);
                break;
            case 'skin_unlock':
                const skins = JSON.parse(localStorage.getItem('snake_skins') || '[]');
                if (!skins.includes(reward.skin)) {
                    skins.push(reward.skin);
                    localStorage.setItem('snake_skins', JSON.stringify(skins));
                }
                break;
            case 'ending_unlock':
                localStorage.setItem('snake_true_ending', 'true');
                break;
        }
    }
    
    showDiscoveryPopup(secret) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(100,0,200,0.95), rgba(50,0,100,0.95));
            border: 3px solid #ffd700;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            z-index: 2000;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
            box-shadow: 0 0 50px rgba(255, 215, 0, 0.5);
        `;
        
        popup.innerHTML = `
            <h1 style="color: #ffd700; margin: 0;">🔮 SECRET DISCOVERED!</h1>
            <p style="font-size: 1.5em; margin: 20px 0;">${secret.hint}</p>
            <p style="color: #88ff88;">Reward: ${this.getRewardText(secret.reward)}</p>
            <button onclick="this.parentElement.remove()" style="
                padding: 15px 40px;
                margin-top: 20px;
                background: linear-gradient(135deg, #ffd700, #ff8800);
                border: none;
                border-radius: 10px;
                color: #000;
                font-weight: bold;
                font-size: 1.1em;
                cursor: pointer;
            ">Claim Reward</button>
        `;
        
        document.body.appendChild(popup);
        
        this.game.camera?.shake(10, 0.5);
        this.game.camera?.doFlash([1, 0.8, 0], 0.5);
    }
    
    getRewardText(reward) {
        switch (reward.type) {
            case 'coins': return `💰 ${reward.amount} Coins`;
            case 'ability_unlock': return `⚡ New Ability: ${reward.ability}`;
            case 'skin_unlock': return `🎨 New Skin: ${reward.skin}`;
            case 'ending_unlock': return `✨ True Ending Unlocked!`;
            default: return 'Mystery Reward';
        }
    }
    
    showHint(hint) {
        // Only show hint once per second
        if (this.lastHintTime && Date.now() - this.lastHintTime < 1000) return;
        this.lastHintTime = Date.now();
        
        const existing = document.getElementById('secret-hint');
        if (existing) existing.remove();
        
        const hintEl = document.createElement('div');
        hintEl.id = 'secret-hint';
        hintEl.style.cssText = `
            position: fixed;
            bottom: 150px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(100, 0, 200, 0.8);
            padding: 10px 20px;
            border-radius: 10px;
            color: #fff;
            font-family: 'Orbitron', sans-serif;
            font-style: italic;
            z-index: 100;
            animation: fadeIn 0.3s ease;
        `;
        hintEl.textContent = `💭 "${hint}"`;
        
        document.body.appendChild(hintEl);
        
        setTimeout(() => hintEl.remove(), 3000);
    }
    
    renderSecretIndicators(ctx, cellSize, worldId) {
        // Render subtle glow for undiscovered secrets
        for (const [id, secret] of Object.entries(SECRET_AREAS)) {
            if (secret.world !== worldId) continue;
            if (this.discoveredSecrets.includes(id)) continue;
            
            const t = secret.trigger;
            const x = t.x * cellSize;
            const y = t.y * cellSize;
            const w = t.width * cellSize;
            const h = t.height * cellSize;
            
            // Subtle pulsing glow
            ctx.globalAlpha = 0.1 + Math.sin(Date.now() / 500) * 0.05;
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(x, y, w, h);
            ctx.globalAlpha = 1;
        }
    }
}

// Battle Royale Mode
export class BattleRoyaleMode {
    constructor(game) {
        this.game = game;
        this.shrinkTimer = 0;
        this.shrinkInterval = 10; // Shrink every 10 seconds
        this.currentBounds = { x: 0, y: 0, width: 30, height: 30 };
        this.minBounds = { width: 10, height: 10 };
        this.aiSnakes = [];
        this.isActive = false;
        this.isOnline = false;
        this.mpManager = null;
    }
    
    start(config = 5) {
        this.isActive = true;
        this.currentBounds = { x: 0, y: 0, width: this.game.gridSize, height: this.game.gridSize };
        
        if (config === 'online') {
            this.isOnline = true;
            if (!this.mpManager) this.mpManager = new MultiplayerManager(this.game);
            this.mpManager.findMatch();
            return;
        }

        this.isOnline = false;
        this.aiSnakes = [];
        
        // Spawn AI snakes
        const count = typeof config === 'number' ? config : 5;
        for (let i = 0; i < count; i++) {
            this.spawnAISnake(i);
        }
    }

    isReady() {
        if (this.isOnline && this.mpManager) {
            return this.mpManager.status === 'playing';
        }
        return true;
    }
    
    spawnAISnake(index) {
        const gridSize = this.game.gridSize;
        const startX = 5 + Math.floor(Math.random() * (gridSize - 10));
        const startY = 5 + Math.floor(Math.random() * (gridSize - 10));
        
        const colors = ['#ff4488', '#44aaff', '#ffaa44', '#aa44ff', '#44ffaa'];
        
        this.aiSnakes.push({
            id: index,
            snake: [
                { x: startX, y: startY },
                { x: startX - 1, y: startY },
                { x: startX - 2, y: startY }
            ],
            direction: ['UP', 'DOWN', 'LEFT', 'RIGHT'][Math.floor(Math.random() * 4)],
            color: colors[index % colors.length],
            alive: true,
            moveTimer: 0,
            intelligence: 0.3 + Math.random() * 0.5 // How smart the AI is
        });
    }
    
    update(dt) {
        if (!this.isActive) return;
        
        if (this.isOnline) {
            if (this.mpManager) this.mpManager.update(dt);
            // Handle lobby shrink via server? Or locally synced?
            // For MVP, disable shrink in online or sync it
            // Continuing to next logic might conflict.
            return;
        }
        
        // Shrink the play area
        this.shrinkTimer += dt;
        if (this.shrinkTimer >= this.shrinkInterval) {
            this.shrinkTimer = 0;
            this.shrinkPlayArea();
        }
        
        // Update AI snakes
        for (const ai of this.aiSnakes) {
            if (!ai.alive) continue;
            
            ai.moveTimer += dt;
            if (ai.moveTimer >= 0.15) { // AI move speed
                ai.moveTimer = 0;
                this.updateAI(ai);
                this.moveAISnake(ai);
            }
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Check win condition
        const aliveCount = this.aiSnakes.filter(ai => ai.alive).length;
        if (aliveCount === 0) {
            return { winner: 'player', placement: 1 };
        }
        
        return null; // No winner yet
    } 

    render(ctx, cellSize) {
        // I'll leave the instruction to replace the START of the function?
        // Method `render` was NOT in Step 888 view.
        // I must view it first!
    }
    
    shrinkPlayArea() {
        if (this.currentBounds.width <= this.minBounds.width) return;
        
        this.currentBounds.x += 1;
        this.currentBounds.y += 1;
        this.currentBounds.width -= 2;
        this.currentBounds.height -= 2;
        
        // Visual warning
        this.game.camera?.shake(3, 0.2);
        this.game.camera?.doFlash([1, 0, 0], 0.1);
        
        // Create obstacle ring at new boundary
        for (let x = this.currentBounds.x - 1; x <= this.currentBounds.x + this.currentBounds.width; x++) {
            if (x >= 0 && x < this.game.gridSize) {
                this.game.obstacles.push({ x, y: this.currentBounds.y - 1, type: 'zone_damage' });
                this.game.obstacles.push({ x, y: this.currentBounds.y + this.currentBounds.height, type: 'zone_damage' });
            }
        }
        for (let y = this.currentBounds.y; y < this.currentBounds.y + this.currentBounds.height; y++) {
            if (y >= 0 && y < this.game.gridSize) {
                this.game.obstacles.push({ x: this.currentBounds.x - 1, y, type: 'zone_damage' });
                this.game.obstacles.push({ x: this.currentBounds.x + this.currentBounds.width, y, type: 'zone_damage' });
            }
        }
    }
    
    updateAI(ai) {
        const head = ai.snake[0];
        const gridSize = this.game.gridSize;
        
        // Simple AI: avoid walls, obstacles, and try to collect food
        const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        const opposite = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
        
        // Filter out opposite direction
        const valid = directions.filter(d => d !== opposite[ai.direction]);
        
        // Score each direction
        let bestDir = ai.direction;
        let bestScore = -Infinity;
        
        for (const dir of valid) {
            const dirVec = { UP: {x:0,y:-1}, DOWN: {x:0,y:1}, LEFT: {x:-1,y:0}, RIGHT: {x:1,y:0} }[dir];
            const newX = head.x + dirVec.x;
            const newY = head.y + dirVec.y;
            
            let score = 0;
            
            // Avoid walls and out of bounds
            if (newX < this.currentBounds.x || newX >= this.currentBounds.x + this.currentBounds.width ||
                newY < this.currentBounds.y || newY >= this.currentBounds.y + this.currentBounds.height) {
                score -= 1000;
            }
            
            // Avoid obstacles
            if (this.game.obstacles.some(o => o.x === newX && o.y === newY)) {
                score -= 500;
            }
            
            // Avoid self
            if (ai.snake.some(s => s.x === newX && s.y === newY)) {
                score -= 500;
            }
            
            // Avoid other snakes
            for (const other of this.aiSnakes) {
                if (other.id !== ai.id && other.alive) {
                    if (other.snake.some(s => s.x === newX && s.y === newY)) {
                        score -= 500;
                    }
                }
            }
            
            // Move toward food if smart enough
            if (Math.random() < ai.intelligence) {
                const foodDist = Math.abs(this.game.food.x - newX) + Math.abs(this.game.food.y - newY);
                score -= foodDist;
            }
            
            // Add some randomness
            score += Math.random() * 5;
            
            if (score > bestScore) {
                bestScore = score;
                bestDir = dir;
            }
        }
        
        ai.direction = bestDir;
    }
    
    moveAISnake(ai) {
        const head = ai.snake[0];
        const dirVec = { UP: {x:0,y:-1}, DOWN: {x:0,y:1}, LEFT: {x:-1,y:0}, RIGHT: {x:1,y:0} }[ai.direction];
        
        const newHead = {
            x: head.x + dirVec.x,
            y: head.y + dirVec.y
        };
        
        ai.snake.unshift(newHead);
        
        // Check if ate food
        if (newHead.x === this.game.food.x && newHead.y === this.game.food.y) {
            this.game.spawnFood();
        } else {
            ai.snake.pop();
        }
    }
    
    checkCollisions() {
        // Check player in zone
        const playerHead = this.game.snake[0];
        if (playerHead.x < this.currentBounds.x || 
            playerHead.x >= this.currentBounds.x + this.currentBounds.width ||
            playerHead.y < this.currentBounds.y || 
            playerHead.y >= this.currentBounds.y + this.currentBounds.height) {
            // Player takes zone damage
            if (!this.game.activePowerUps.invincible) {
                this.game.handleCollision();
            }
        }
        
        // Check AI collisions
        for (const ai of this.aiSnakes) {
            if (!ai.alive) continue;
            
            const head = ai.snake[0];
            
            // Zone check
            if (head.x < this.currentBounds.x || 
                head.x >= this.currentBounds.x + this.currentBounds.width ||
                head.y < this.currentBounds.y || 
                head.y >= this.currentBounds.y + this.currentBounds.height) {
                ai.alive = false;
                continue;
            }
            
            // Obstacle check
            if (this.game.obstacles.some(o => o.x === head.x && o.y === head.y)) {
                ai.alive = false;
                continue;
            }
            
            // Self collision
            for (let i = 1; i < ai.snake.length; i++) {
                if (ai.snake[i].x === head.x && ai.snake[i].y === head.y) {
                    ai.alive = false;
                    break;
                }
            }
            
            // Collision with player
            for (const segment of this.game.snake) {
                if (segment.x === head.x && segment.y === head.y) {
                    ai.alive = false;
                    break;
                }
            }
        }
    }
    
    render(ctx, cellSize) {
        if (this.isOnline) {
             if (this.mpManager) {
                 // Render Remote Snakes
                 const snakes = this.mpManager.getRemoteSnakes();
                 for (const p of snakes) {
                    if (!p.snake || !p.snake.length) continue;
                    
                    ctx.fillStyle = p.color || '#ff4488';
                    ctx.shadowColor = p.color || '#ff4488';
                    ctx.shadowBlur = 5;
                    
                    for (const segment of p.snake) {
                        ctx.fillRect(segment.x * cellSize + 2, segment.y * cellSize + 2, cellSize - 4, cellSize - 4);
                    }
                    ctx.shadowBlur = 0;
                    
                    if (p.snake[0]) {
                        ctx.fillStyle = '#fff';
                        ctx.font = '10px Arial';
                        ctx.fillText(p.name || 'P', p.snake[0].x * cellSize, p.snake[0].y * cellSize - 5);
                    }
                 }
                 
                 // Alive Count
                 const count = Object.keys(this.mpManager.players).length;
                 ctx.font = 'bold 16px Orbitron, sans-serif';
                 ctx.fillStyle = '#fff';
                 ctx.textAlign = 'left';
                 ctx.fillText(`🟢 Online: ${count}`, 10, 50);
             }
             return;
        }

        // Render zone boundary
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(
            this.currentBounds.x * cellSize,
            this.currentBounds.y * cellSize,
            this.currentBounds.width * cellSize,
            this.currentBounds.height * cellSize
        );
        ctx.setLineDash([]);
        
        // Render danger zone (outside bounds)
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        // Top
        ctx.fillRect(0, 0, ctx.canvas.width, this.currentBounds.y * cellSize);
        // Bottom
        ctx.fillRect(0, (this.currentBounds.y + this.currentBounds.height) * cellSize, 
                     ctx.canvas.width, ctx.canvas.height);
        // Left
        ctx.fillRect(0, this.currentBounds.y * cellSize, 
                     this.currentBounds.x * cellSize, this.currentBounds.height * cellSize);
        // Right
        ctx.fillRect((this.currentBounds.x + this.currentBounds.width) * cellSize, 
                     this.currentBounds.y * cellSize,
                     ctx.canvas.width, this.currentBounds.height * cellSize);
        
        // Render AI snakes
        for (const ai of this.aiSnakes) {
            if (!ai.alive) continue;
            
            ctx.fillStyle = ai.color;
            ctx.shadowColor = ai.color;
            ctx.shadowBlur = 5;
            
            for (const segment of ai.snake) {
                ctx.beginPath();
                ctx.roundRect(
                    segment.x * cellSize + 2,
                    segment.y * cellSize + 2,
                    cellSize - 4,
                    cellSize - 4,
                    3
                );
                ctx.fill();
            }
        }
        
        ctx.shadowBlur = 0;
        
        // Render alive count
        const aliveCount = this.aiSnakes.filter(ai => ai.alive).length + 1; // +1 for player
        ctx.font = 'bold 16px Orbitron, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`🐍 Alive: ${aliveCount}`, 10, 50);
    }
}

// Custom Game Creator
export class CustomGameCreator {
    constructor(game) {
        this.game = game;
        this.customConfig = null;
        this.editorUI = null;
    }
    
    openEditor() {
        if (document.getElementById('custom-game-editor')) return;
        
        this.game.togglePause(true);
        
        const editor = document.createElement('div');
        editor.id = 'custom-game-editor';
        editor.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #00ff88;
            border-radius: 15px;
            padding: 30px;
            width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 3000;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
        `;
        
        editor.innerHTML = `
            <h2 style="color: #00ff88; margin-top: 0;">🎮 Custom Game Creator</h2>
            
            <div class="editor-section">
                <label>Game Speed</label>
                <input type="range" id="custom-speed" min="0.05" max="0.3" step="0.01" value="0.15">
                <span id="speed-value">0.15s</span>
            </div>
            
            <div class="editor-section">
                <label>Grid Size</label>
                <input type="range" id="custom-grid" min="15" max="50" step="5" value="30">
                <span id="grid-value">30</span>
            </div>
            
            <div class="editor-section">
                <label>Starting Length</label>
                <input type="range" id="custom-length" min="3" max="20" step="1" value="3">
                <span id="length-value">3</span>
            </div>
            
            <div class="editor-section">
                <label>Obstacle Count</label>
                <input type="range" id="custom-obstacles" min="0" max="50" step="5" value="0">
                <span id="obstacles-value">0</span>
            </div>
            
            <div class="editor-section">
                <label>Moving Obstacles</label>
                <input type="range" id="custom-moving" min="0" max="10" step="1" value="0">
                <span id="moving-value">0</span>
            </div>
            
            <div class="editor-section">
                <label>Portal Pairs</label>
                <input type="range" id="custom-portals" min="0" max="5" step="1" value="0">
                <span id="portals-value">0</span>
            </div>
            
            <div class="editor-section">
                <label>
                    <input type="checkbox" id="custom-walls"> Wall Wrap-Around
                </label>
            </div>
            
            <div class="editor-section">
                <label>
                    <input type="checkbox" id="custom-ghost"> Ghost Mode (No Self-Collision)
                </label>
            </div>
            
            <div class="editor-section">
                <label>
                    <input type="checkbox" id="custom-infinite-food"> Infinite Food Spawn
                </label>
            </div>
            
            <div class="editor-section">
                <label>Theme</label>
                <select id="custom-theme">
                    <option value="garden">Garden</option>
                    <option value="ice">Ice</option>
                    <option value="volcano">Volcano</option>
                    <option value="cyber">Cyber</option>
                    <option value="void">Void</option>
                </select>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button id="start-custom" style="
                    flex: 1;
                    padding: 15px;
                    background: linear-gradient(135deg, #00ff88, #00aa55);
                    border: none;
                    border-radius: 8px;
                    color: #000;
                    font-weight: bold;
                    cursor: pointer;
                ">Start Game</button>
                <button id="save-custom" style="
                    flex: 1;
                    padding: 15px;
                    background: linear-gradient(135deg, #4488ff, #0044aa);
                    border: none;
                    border-radius: 8px;
                    color: #fff;
                    font-weight: bold;
                    cursor: pointer;
                ">Save Preset</button>
                <button id="close-editor" style="
                    padding: 15px 20px;
                    background: #333;
                    border: none;
                    border-radius: 8px;
                    color: #fff;
                    cursor: pointer;
                ">✕</button>
            </div>
        `;
        
        // Add styles for editor sections
        const style = document.createElement('style');
        style.textContent = `
            .editor-section {
                margin-bottom: 15px;
            }
            .editor-section label {
                display: block;
                margin-bottom: 5px;
                color: #888;
            }
            .editor-section input[type="range"] {
                width: 70%;
            }
            .editor-section span {
                margin-left: 10px;
            }
            .editor-section select {
                width: 100%;
                padding: 8px;
                background: #333;
                border: 1px solid #00ff88;
                color: #fff;
                border-radius: 5px;
            }
        `;
        editor.appendChild(style);
        
        document.body.appendChild(editor);
        this.editorUI = editor;
        
        // Add event listeners
        this.setupEditorListeners();
    }
    
    setupEditorListeners() {
        // Range input value displays
        const ranges = ['speed', 'grid', 'length', 'obstacles', 'moving', 'portals'];
        for (const name of ranges) {
            const input = document.getElementById(`custom-${name}`);
            const display = document.getElementById(`${name}-value`);
            if (input && display) {
                input.oninput = () => {
                    display.textContent = name === 'speed' ? `${input.value}s` : input.value;
                };
            }
        }
        
        document.getElementById('start-custom').onclick = () => this.startCustomGame();
        document.getElementById('save-custom').onclick = () => this.savePreset();
        document.getElementById('close-editor').onclick = () => this.closeEditor();
    }
    
    closeEditor() {
        if (this.editorUI) {
            this.editorUI.remove();
            this.editorUI = null;
        }
        this.game.togglePause(false);
    }
    
    getConfig() {
        return {
            speed: parseFloat(document.getElementById('custom-speed').value),
            gridSize: parseInt(document.getElementById('custom-grid').value),
            startLength: parseInt(document.getElementById('custom-length').value),
            obstacleCount: parseInt(document.getElementById('custom-obstacles').value),
            movingObstacles: parseInt(document.getElementById('custom-moving').value),
            portalPairs: parseInt(document.getElementById('custom-portals').value),
            wallWrap: document.getElementById('custom-walls').checked,
            ghostMode: document.getElementById('custom-ghost').checked,
            infiniteFood: document.getElementById('custom-infinite-food').checked,
            theme: document.getElementById('custom-theme').value
        };
    }
    
    startCustomGame() {
        this.customConfig = this.getConfig();
        this.closeEditor();
        
        // Apply config to game
        this.applyConfig(this.customConfig);
        
        this.game.gameMode = 'CUSTOM';
        this.game.onReset();
        this.game.start();
    }
    
    applyConfig(config) {
        // Update game settings
        this.game.moveInterval = config.speed;
        this.game.gridSize = config.gridSize;
        this.game.cellSize = this.game.canvas.width / config.gridSize;
        
        // Generate obstacles
        const obstacles = [];
        for (let i = 0; i < config.obstacleCount; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (config.gridSize - 4)) + 2;
                y = Math.floor(Math.random() * (config.gridSize - 4)) + 2;
            } while (Math.abs(x - config.gridSize/2) < 4 && Math.abs(y - config.gridSize/2) < 4);
            obstacles.push({ x, y, type: 'static' });
        }
        
        // Add moving obstacles
        for (let i = 0; i < config.movingObstacles; i++) {
            const startX = Math.floor(Math.random() * (config.gridSize - 10)) + 5;
            const startY = Math.floor(Math.random() * (config.gridSize - 10)) + 5;
            obstacles.push({
                type: 'moving',
                x: startX,
                y: startY,
                path: [
                    { x: startX, y: startY },
                    { x: startX + 5, y: startY }
                ],
                speed: 3,
                pathIndex: 0,
                pathProgress: 0
            });
        }
        
        this.game.obstacles = obstacles;
        
        // Apply ghost mode
        if (config.ghostMode) {
            this.game.activePowerUps.ghost = { remaining: -1, type: { effect: 'ghost' } };
        }
    }
    
    savePreset() {
        const config = this.getConfig();
        const presets = JSON.parse(localStorage.getItem('snake_custom_presets') || '[]');
        
        const name = prompt('Enter preset name:', `Preset ${presets.length + 1}`);
        if (!name) return;
        
        presets.push({ name, config });
        localStorage.setItem('snake_custom_presets', JSON.stringify(presets));
        
        alert(`Preset "${name}" saved!`);
    }
    
    loadPresets() {
        return JSON.parse(localStorage.getItem('snake_custom_presets') || '[]');
    }
}
