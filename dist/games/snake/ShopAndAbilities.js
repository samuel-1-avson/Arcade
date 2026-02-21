/**
 * Snake Game - Power-Up Shop & Active Abilities System
 * Handles in-game shop, active abilities, and purchasable upgrades
 */

// Active Ability Definitions
export const ACTIVE_ABILITIES = {
    dash: {
        id: 'dash',
        name: 'Dash',
        icon: '💨',
        desc: 'Quickly move 3 tiles in current direction',
        cooldown: 5,
        key: 'Digit1',
        execute: (game) => {
            const dir = game.direction;
            const head = game.snake[0];
            if (!head) return; // Safety check
            
            const dirVec = {
                UP: { x: 0, y: -1 },
                DOWN: { x: 0, y: 1 },
                LEFT: { x: -1, y: 0 },
                RIGHT: { x: 1, y: 0 }
            }[dir];
            
            if (!dirVec) return; // Safety check
            
            // Move snake head 3 tiles
            for (let i = 0; i < 3; i++) {
                const newX = head.x + dirVec.x * (i + 1);
                const newY = head.y + dirVec.y * (i + 1);
                
                // Check bounds
                if (newX < 0 || newX >= game.gridSize || 
                    newY < 0 || newY >= game.gridSize) break;
                
                // Check obstacles (skip if invincible)
                if (!game.activePowerUps.invincible) {
                    const hitObstacle = game.obstacles.some(o => 
                        Math.abs(o.x - newX) < 0.5 && Math.abs(o.y - newY) < 0.5
                    );
                    if (hitObstacle) break;
                }
                
                head.x = newX;
                head.y = newY;
            }
            
            // Dash particles
            game.particleSystem?.emit({
                x: head.x * game.cellSize,
                y: head.y * game.cellSize,
                count: 10,
                color: [0.5, 0.8, 1],
                life: 0.3,
                speed: 100
            });
            
            game.camera?.shake(3, 0.2);
        }
    },
    
    shield_burst: {
        id: 'shield_burst',
        name: 'Shield Burst',
        icon: '🛡️',
        desc: 'Create a protective barrier that destroys nearby obstacles',
        cooldown: 10,
        key: 'Digit2',
        execute: (game) => {
            const head = game.snake[0];
            const radius = 3;
            
            // Find and destroy nearby obstacles
            const destroyed = [];
            game.obstacles = game.obstacles.filter(obs => {
                const dist = Math.sqrt(
                    Math.pow(obs.x - head.x, 2) + 
                    Math.pow(obs.y - head.y, 2)
                );
                if (dist <= radius) {
                    destroyed.push(obs);
                    return false;
                }
                return true;
            });
            
            // Particles for each destroyed obstacle
            for (const obs of destroyed) {
                game.particleSystem?.emitExplosion(
                    obs.x * game.cellSize,
                    obs.y * game.cellSize,
                    [0, 1, 0.5],
                    10
                );
                game.addScore(15);
            }
            
            // Grant brief invincibility
            game.activePowerUps.invincible = {
                remaining: 1,
                type: { effect: 'invincible' }
            };
            
            // Visual burst effect
            game.camera?.doFlash([0, 1, 0.5], 0.2);
            game.camera?.shake(5, 0.3);
        }
    },
    
    projectile: {
        id: 'projectile',
        name: 'Venom Shot',
        icon: '🎯',
        desc: 'Fire a projectile that destroys the first obstacle it hits',
        cooldown: 4,
        key: 'Digit3',
        execute: (game) => {
            const head = game.snake[0];
            const dir = game.direction;
            const dirVec = {
                UP: { x: 0, y: -1 },
                DOWN: { x: 0, y: 1 },
                LEFT: { x: -1, y: 0 },
                RIGHT: { x: 1, y: 0 }
            }[dir];
            
            // Create projectile
            if (!game.projectiles) game.projectiles = [];
            
            game.projectiles.push({
                x: head.x * game.cellSize + game.cellSize / 2,
                y: head.y * game.cellSize + game.cellSize / 2,
                vx: dirVec.x * 500,
                vy: dirVec.y * 500,
                lifetime: 2,
                color: '#00ff88'
            });
        }
    },
    
    time_warp: {
        id: 'time_warp',
        name: 'Time Warp',
        icon: '⏰',
        desc: 'Slow down time for 3 seconds',
        cooldown: 15,
        key: 'Digit4',
        execute: (game) => {
            game.camera?.startSlowMotion(0.3, 3);
            game.activePowerUps.bullet_time = {
                remaining: 3,
                type: { effect: 'bullet_time' }
            };
        }
    }
};

// Shop Items
export const SHOP_ITEMS = {
    // Consumables
    extra_life: {
        id: 'extra_life',
        name: 'Extra Life',
        icon: '❤️',
        desc: '+1 Life (Classic mode only)',
        cost: 50,
        type: 'consumable',
        apply: (game) => {
            if (game.gameMode === 'CLASSIC') {
                game.lives++;
            }
        }
    },
    
    instant_shield: {
        id: 'instant_shield',
        name: 'Emergency Shield',
        icon: '🛡️',
        desc: 'Activate shield immediately',
        cost: 30,
        type: 'consumable',
        apply: (game) => {
            game.activePowerUps.shield = {
                remaining: -1,
                type: { effect: 'shield' }
            };
        }
    },
    
    score_boost: {
        id: 'score_boost',
        name: 'Score Boost',
        icon: '⭐',
        desc: '2x points for 30 seconds',
        cost: 40,
        type: 'consumable',
        apply: (game) => {
            game.activePowerUps.double = {
                remaining: 30,
                type: { effect: 'double' }
            };
        }
    },
    
    speed_boost: {
        id: 'speed_boost',
        name: 'Turbo Mode',
        icon: '⚡',
        desc: 'Move faster for 20 seconds',
        cost: 25,
        type: 'consumable',
        apply: (game) => {
            game.activePowerUps.speed = {
                remaining: 20,
                type: { effect: 'speed' }
            };
        }
    },
    
    obstacle_clear: {
        id: 'obstacle_clear',
        name: 'Clear Path',
        icon: '💥',
        desc: 'Remove all obstacles from the map',
        cost: 100,
        type: 'consumable',
        apply: (game) => {
            game.obstacles = [];
            game.camera?.shake(10, 0.5);
        }
    },
    
    // Upgrades (permanent for this run)
    magnet_upgrade: {
        id: 'magnet_upgrade',
        name: 'Food Magnet',
        icon: '🧲',
        desc: 'Attract food from further away',
        cost: 75,
        type: 'upgrade',
        apply: (game) => {
            game.activePowerUps.magnet = {
                remaining: -1,
                type: { effect: 'magnet' }
            };
        }
    },
    
    combo_extender: {
        id: 'combo_extender',
        name: 'Combo Timer+',
        icon: '🔥',
        desc: 'Combos last 50% longer',
        cost: 60,
        type: 'upgrade',
        apply: (game) => {
            game.comboDecayRate = (game.comboDecayRate || 1) * 0.5;
        }
    }
};

export class PowerUpShop {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.currency = 0;
        this.purchasedUpgrades = new Set();
        this.shopElement = null;
        
        this.createShopUI();
    }
    
    createShopUI() {
        if (document.getElementById('powerup-shop')) return;
        
        const shop = document.createElement('div');
        shop.id = 'powerup-shop';
        shop.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #00ff88;
            border-radius: 15px;
            padding: 20px;
            min-width: 400px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 3000;
            display: none;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
            box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
        `;
        
        shop.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #00ff88;">🛒 Power-Up Shop</h2>
                <div id="shop-currency" style="font-size: 1.2em;">💰 0</div>
            </div>
            <div id="shop-items"></div>
            <button id="close-shop" style="
                width: 100%;
                padding: 10px;
                margin-top: 15px;
                background: linear-gradient(135deg, #ff4444, #cc0000);
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 1em;
                cursor: pointer;
            ">Close Shop [Tab]</button>
        `;
        
        document.body.appendChild(shop);
        this.shopElement = shop;
        
        document.getElementById('close-shop').onclick = () => this.close();
    }
    
    open() {
        if (!this.shopElement) return;
        
        this.isOpen = true;
        this.game.togglePause(true);
        this.shopElement.style.display = 'block';
        this.renderItems();
        this.updateCurrencyDisplay();
    }
    
    close() {
        if (!this.shopElement) return;
        
        this.isOpen = false;
        this.game.togglePause(false);
        this.shopElement.style.display = 'none';
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    addCurrency(amount) {
        this.currency += amount;
        this.updateCurrencyDisplay();
    }
    
    updateCurrencyDisplay() {
        const el = document.getElementById('shop-currency');
        if (el) el.textContent = `💰 ${this.currency}`;
    }
    
    renderItems() {
        const container = document.getElementById('shop-items');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (const [id, item] of Object.entries(SHOP_ITEMS)) {
            const purchased = this.purchasedUpgrades.has(id);
            const canAfford = this.currency >= item.cost;
            const disabled = purchased || !canAfford;
            
            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px;
                margin-bottom: 10px;
                background: ${disabled ? 'rgba(50,50,50,0.8)' : 'rgba(0,255,136,0.1)'};
                border: 1px solid ${disabled ? '#333' : '#00ff88'};
                border-radius: 8px;
                opacity: ${disabled ? 0.5 : 1};
            `;
            
            itemDiv.innerHTML = `
                <div>
                    <span style="font-size: 1.5em; margin-right: 10px;">${item.icon}</span>
                    <strong>${item.name}</strong>
                    <p style="margin: 5px 0 0 0; font-size: 0.8em; color: #888;">${item.desc}</p>
                </div>
                <button class="buy-btn" data-id="${id}" style="
                    padding: 8px 20px;
                    background: ${disabled ? '#333' : 'linear-gradient(135deg, #00ff88, #00aa55)'};
                    border: none;
                    border-radius: 5px;
                    color: ${disabled ? '#666' : '#000'};
                    font-weight: bold;
                    cursor: ${disabled ? 'not-allowed' : 'pointer'};
                " ${disabled ? 'disabled' : ''}>
                    ${purchased ? 'Owned' : `💰 ${item.cost}`}
                </button>
            `;
            
            container.appendChild(itemDiv);
        }
        
        // Add click handlers
        container.querySelectorAll('.buy-btn:not([disabled])').forEach(btn => {
            btn.onclick = () => this.purchase(btn.dataset.id);
        });
    }
    
    purchase(itemId) {
        const item = SHOP_ITEMS[itemId];
        if (!item || this.currency < item.cost) return;
        
        this.currency -= item.cost;
        
        if (item.type === 'upgrade') {
            this.purchasedUpgrades.add(itemId);
        }
        
        item.apply(this.game);
        this.updateCurrencyDisplay();
        this.renderItems();
        
        // Purchase feedback
        this.game.camera?.shake(2, 0.1);
    }
}

export class ActiveAbilityManager {
    constructor(game) {
        this.game = game;
        this.unlockedAbilities = ['dash']; // Start with dash
        this.cooldowns = {};
        this.abilityUI = null;
        
        this.createAbilityUI();
    }
    
    createAbilityUI() {
        return; // UI Disabled as requested
        /*
        if (document.getElementById('ability-bar')) return;
        
        const bar = document.createElement('div');
        bar.id = 'ability-bar';
        bar.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: none;
            flex-direction: row;
            gap: 10px;
            z-index: 100;
        `;
        
        document.body.appendChild(bar);
        this.abilityUI = bar;
        this.renderAbilities();
        */
    }
    
    renderAbilities() {
        if (!this.abilityUI) return;
        
        this.abilityUI.innerHTML = '';
        
        for (const abilityId of this.unlockedAbilities) {
            const ability = ACTIVE_ABILITIES[abilityId];
            if (!ability) continue;
            
            const cooldown = this.cooldowns[abilityId] || 0;
            const isReady = cooldown <= 0;
            
            const btn = document.createElement('div');
            btn.className = 'ability-btn';
            btn.dataset.ability = abilityId;
            btn.style.cssText = `
                width: 50px;
                height: 50px;
                background: ${isReady ? 'rgba(0,255,136,0.3)' : 'rgba(50,50,50,0.8)'};
                border: 2px solid ${isReady ? '#00ff88' : '#333'};
                border-radius: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: ${isReady ? 'pointer' : 'not-allowed'};
                position: relative;
                font-size: 1.5em;
            `;
            
            btn.innerHTML = `
                <span>${ability.icon}</span>
                <span style="font-size: 0.4em; position: absolute; bottom: 2px;">${ability.key.replace('Digit', '')}</span>
                ${cooldown > 0 ? `<div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.5em;
                    color: #ff4444;
                ">${Math.ceil(cooldown)}s</div>` : ''}
            `;
            
            if (isReady) {
                btn.onclick = () => this.useAbility(abilityId);
            }
            
            this.abilityUI.appendChild(btn);
        }
    }
    
    update(dt, inputManager) {
        // Update cooldowns
        for (const abilityId of Object.keys(this.cooldowns)) {
            if (this.cooldowns[abilityId] > 0) {
                this.cooldowns[abilityId] -= dt;
            }
        }
        
        // Check for ability key presses
        for (const abilityId of this.unlockedAbilities) {
            const ability = ACTIVE_ABILITIES[abilityId];
            if (ability && inputManager.isKeyJustPressed(ability.key)) {
                this.useAbility(abilityId);
            }
        }
        
        this.renderAbilities();
    }
    
    useAbility(abilityId) {
        // Only allow ability use when playing
        // Note: 'boss_battle' might be a sub-state or mode, but 'playing' is the primary engine state
        if (this.game.state !== 'playing' && this.game.state !== 'boss_battle') return;

        const ability = ACTIVE_ABILITIES[abilityId];
        if (!ability) return;
        
        // Check cooldown
        if ((this.cooldowns[abilityId] || 0) > 0) return;
        
        // Execute ability
        ability.execute(this.game);
        
        // Start cooldown
        this.cooldowns[abilityId] = ability.cooldown;
        
        this.renderAbilities();
    }
    
    unlockAbility(abilityId) {
        if (!this.unlockedAbilities.includes(abilityId)) {
            this.unlockedAbilities.push(abilityId);
            this.renderAbilities();
        }
    }
}

// Collectible Story Items
export const STORY_COLLECTIBLES = {
    lore_1: { id: 'lore_1', name: 'Ancient Scroll', icon: '📜', world: 'garden', 
              lore: 'The garden was once a paradise, until THE HARVEST began...' },
    lore_2: { id: 'lore_2', name: 'Frozen Memory', icon: '❄️', world: 'ice', 
              lore: 'Deep in the ice, the ancients sleep. Do not wake them.' },
    lore_3: { id: 'lore_3', name: 'Ember Fragment', icon: '🔥', world: 'volcano', 
              lore: 'The Magma King was once a guardian. Corruption changed him.' },
    lore_4: { id: 'lore_4', name: 'Data Core', icon: '💾', world: 'cyber', 
              lore: 'System.EXE was designed to protect. Now it only destroys.' },
    lore_5: { id: 'lore_5', name: 'Void Essence', icon: '🌌', world: 'void', 
              lore: 'Entropy is not evil. It is simply... the end of all things.' },
    artifact_1: { id: 'artifact_1', name: 'Golden Apple', icon: '🍎', world: 'garden', 
                  effect: { type: 'bonus_points', value: 100 } },
    artifact_2: { id: 'artifact_2', name: 'Crystal Heart', icon: '💎', world: 'ice', 
                  effect: { type: 'extra_life', value: 1 } },
    artifact_3: { id: 'artifact_3', name: 'Phoenix Feather', icon: '🪶', world: 'volcano', 
                  effect: { type: 'revive', value: true } },
    artifact_4: { id: 'artifact_4', name: 'Quantum Key', icon: '🔑', world: 'cyber', 
                  effect: { type: 'unlock_secret', value: true } },
    artifact_5: { id: 'artifact_5', name: 'Origin Stone', icon: '💠', world: 'void', 
                  effect: { type: 'ultimate_upgrade', value: true } }
};

export class CollectibleManager {
    constructor(game) {
        this.game = game;
        this.collected = this.loadCollected();
        this.activeCollectible = null;
    }
    
    loadCollected() {
        const saved = localStorage.getItem('snake_collectibles');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveCollected() {
        localStorage.setItem('snake_collectibles', JSON.stringify(this.collected));
    }
    
    spawnCollectible(worldId) {
        // Find collectibles for this world that haven't been collected
        const available = Object.values(STORY_COLLECTIBLES).filter(c => 
            c.world === worldId && !this.collected.includes(c.id)
        );
        
        if (available.length === 0) return null;
        
        // 20% chance to spawn
        if (Math.random() > 0.2) return null;
        
        const collectible = available[Math.floor(Math.random() * available.length)];
        
        // Find valid spawn position
        const gridSize = this.game.gridSize;
        let x, y;
        do {
            x = Math.floor(Math.random() * (gridSize - 4)) + 2;
            y = Math.floor(Math.random() * (gridSize - 4)) + 2;
        } while (
            (Math.abs(x - gridSize/2) < 4 && Math.abs(y - gridSize/2) < 4) ||
            this.game.obstacles.some(o => o.x === x && o.y === y)
        );
        
        this.activeCollectible = {
            ...collectible,
            x, y,
            animTime: 0
        };
        
        return this.activeCollectible;
    }
    
    checkCollection(headX, headY) {
        if (!this.activeCollectible) return null;
        
        if (Math.abs(headX - this.activeCollectible.x) < 1 && 
            Math.abs(headY - this.activeCollectible.y) < 1) {
            const collected = this.activeCollectible;
            this.collected.push(collected.id);
            this.saveCollected();
            this.activeCollectible = null;
            
            // Show collection popup
            this.showCollectionPopup(collected);
            
            return collected;
        }
        
        return null;
    }
    
    showCollectionPopup(collectible) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            z-index: 2000;
            animation: popIn 0.3s ease;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
        `;
        
        popup.innerHTML = `
            <div style="font-size: 3em; margin-bottom: 10px;">${collectible.icon}</div>
            <h2 style="color: #ffd700; margin: 0;">${collectible.name}</h2>
            <p style="color: #888; font-style: italic; margin: 15px 0;">"${collectible.lore || 'A mysterious artifact...'}"</p>
            <button onclick="this.parentElement.remove()" style="
                padding: 10px 30px;
                background: linear-gradient(135deg, #ffd700, #ff8800);
                border: none;
                border-radius: 8px;
                color: #000;
                font-weight: bold;
                cursor: pointer;
            ">Collect</button>
        `;
        
        document.body.appendChild(popup);
        
        this.game.camera?.shake(5, 0.3);
        this.game.camera?.doFlash([1, 0.8, 0], 0.2);
        
        setTimeout(() => popup.remove(), 5000);
    }
    
    update(dt) {
        if (this.activeCollectible) {
            this.activeCollectible.animTime += dt;
        }
    }
    
    render(ctx, cellSize) {
        if (!this.activeCollectible) return;
        
        const c = this.activeCollectible;
        const x = c.x * cellSize + cellSize / 2;
        const y = c.y * cellSize + cellSize / 2;
        
        // Floating animation
        const floatY = Math.sin(c.animTime * 3) * 5;
        
        // Glow
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15 + Math.sin(c.animTime * 5) * 5;
        
        // Icon
        ctx.font = `${cellSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.icon, x, y + floatY);
        
        ctx.shadowBlur = 0;
    }
}
