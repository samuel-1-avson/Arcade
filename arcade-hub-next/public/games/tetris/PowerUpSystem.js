/**
 * Tetris Power-Up System
 * Provides special abilities that spawn as collectible blocks
 */

// Power-Up Types
export const PowerUpType = {
    BOMB: 'bomb',
    LIGHTNING: 'lightning',
    SLOW_MO: 'slow_mo',
    GHOST_WARP: 'ghost_warp',
    COLOR_BLAST: 'color_blast',
    SHUFFLE: 'shuffle',
    SCORE_BOOST: 'score_boost',
    SHIELD: 'shield'
};

// Power-Up Definitions
export const POWER_UPS = {
    [PowerUpType.BOMB]: {
        id: 'bomb',
        name: 'Bomb',
        description: 'Clears a 3x3 area',
        icon: '💣',
        color: '#ff4444',
        duration: 0, // Instant
        rarity: 0.15
    },
    [PowerUpType.LIGHTNING]: {
        id: 'lightning',
        name: 'Lightning',
        description: 'Clears the bottom row',
        icon: '⚡',
        color: '#ffff00',
        duration: 0,
        rarity: 0.12
    },
    [PowerUpType.SLOW_MO]: {
        id: 'slow_mo',
        name: 'Slow-Mo',
        description: 'Reduces gravity by 50% for 10 seconds',
        icon: '⏱️',
        color: '#00ffff',
        duration: 10000,
        rarity: 0.18
    },
    [PowerUpType.GHOST_WARP]: {
        id: 'ghost_warp',
        name: 'Ghost Warp',
        description: 'Teleport piece to ghost position',
        icon: '👻',
        color: '#aa88ff',
        duration: 0,
        rarity: 0.1
    },
    [PowerUpType.COLOR_BLAST]: {
        id: 'color_blast',
        name: 'Color Blast',
        description: 'Clears all blocks of one color',
        icon: '🎨',
        color: '#ff00ff',
        duration: 0,
        rarity: 0.08
    },
    [PowerUpType.SHUFFLE]: {
        id: 'shuffle',
        name: 'Shuffle',
        description: 'Get better pieces in the queue',
        icon: '🔄',
        color: '#00ff88',
        duration: 0,
        rarity: 0.15
    },
    [PowerUpType.SCORE_BOOST]: {
        id: 'score_boost',
        name: 'Score Boost',
        description: '2x points for 15 seconds',
        icon: '⭐',
        color: '#ffaa00',
        duration: 15000,
        rarity: 0.12
    },
    [PowerUpType.SHIELD]: {
        id: 'shield',
        name: 'Shield',
        description: 'Blocks next garbage row (Survival mode)',
        icon: '🛡️',
        color: '#88ff88',
        duration: -1, // Until used
        rarity: 0.1
    }
};

/**
 * Power-Up Block - Represents a power-up on the grid
 */
export class PowerUpBlock {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.config = POWER_UPS[type];
        this.animationPhase = 0;
    }

    update(dt) {
        this.animationPhase += dt * 3;
    }

    render(ctx, cellSize) {
        const px = this.x * cellSize;
        const py = this.y * cellSize;
        const padding = 2;
        const size = cellSize - padding * 2;

        ctx.save();

        // Pulsing glow effect
        const pulseScale = 1 + Math.sin(this.animationPhase) * 0.1;
        const glowIntensity = 10 + Math.sin(this.animationPhase * 2) * 5;

        ctx.shadowColor = this.config.color;
        ctx.shadowBlur = glowIntensity;

        // Background
        ctx.fillStyle = this.config.color;
        ctx.globalAlpha = 0.3 + Math.sin(this.animationPhase) * 0.1;
        ctx.fillRect(px + padding, py + padding, size, size);

        // Border
        ctx.globalAlpha = 1;
        ctx.strokeStyle = this.config.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + padding, py + padding, size, size);

        // Icon
        ctx.shadowBlur = 0;
        ctx.font = `${Math.floor(size * 0.6)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(this.config.icon, px + cellSize / 2, py + cellSize / 2);

        ctx.restore();
    }
}

/**
 * Active Power-Up Effect
 */
export class ActivePowerUp {
    constructor(type, startTime) {
        this.type = type;
        this.config = POWER_UPS[type];
        this.startTime = startTime;
        this.duration = this.config.duration;
        this.isExpired = false;
    }

    getRemainingTime() {
        if (this.duration <= 0) return 0;
        const elapsed = performance.now() - this.startTime;
        return Math.max(0, this.duration - elapsed);
    }

    isActive() {
        if (this.duration === 0) return false; // Instant effect
        if (this.duration === -1) return true; // Until used
        return this.getRemainingTime() > 0;
    }

    update() {
        if (this.duration > 0 && this.getRemainingTime() <= 0) {
            this.isExpired = true;
        }
    }
}

/**
 * Power-Up System Manager
 */
export class PowerUpSystem {
    constructor(game) {
        this.game = game;
        this.powerUpBlocks = [];
        this.activePowerUps = [];
        this.spawnChance = 0.03; // 3% chance per line clear
        this.enabled = true;
        
        // Effect modifiers
        this.scoreMultiplier = 1;
        this.gravityMultiplier = 1;
        this.hasShield = false;
    }

    reset() {
        this.powerUpBlocks = [];
        this.activePowerUps = [];
        this.scoreMultiplier = 1;
        this.gravityMultiplier = 1;
        this.hasShield = false;
    }

    update(dt) {
        // Update power-up blocks animation
        for (const block of this.powerUpBlocks) {
            block.update(dt);
        }

        // Update active power-ups
        for (const powerUp of this.activePowerUps) {
            powerUp.update();
        }

        // Remove expired power-ups
        const expiredPowerUps = this.activePowerUps.filter(p => p.isExpired);
        for (const powerUp of expiredPowerUps) {
            this.onPowerUpExpired(powerUp);
        }
        this.activePowerUps = this.activePowerUps.filter(p => !p.isExpired);

        // Update modifiers based on active power-ups
        this.updateModifiers();
    }

    updateModifiers() {
        // Reset modifiers
        this.scoreMultiplier = 1;
        this.gravityMultiplier = 1;

        for (const powerUp of this.activePowerUps) {
            if (!powerUp.isActive()) continue;

            switch (powerUp.type) {
                case PowerUpType.SCORE_BOOST:
                    this.scoreMultiplier = 2;
                    break;
                case PowerUpType.SLOW_MO:
                    this.gravityMultiplier = 0.5;
                    break;
                case PowerUpType.SHIELD:
                    this.hasShield = true;
                    break;
            }
        }
    }

    onPowerUpExpired(powerUp) {
        this.game.onPowerUpExpired?.(powerUp.type);
    }

    /**
     * Try to spawn a power-up when lines are cleared
     */
    trySpawnPowerUp(clearedRows) {
        if (!this.enabled) return;

        for (const row of clearedRows) {
            if (Math.random() < this.spawnChance) {
                this.spawnRandomPowerUp();
                break; // Only one power-up per clear
            }
        }
    }

    /**
     * Spawn a random power-up on the grid
     */
    spawnRandomPowerUp() {
        const grid = this.game.grid;
        const COLS = grid[0].length;
        
        // Find valid spawn positions (empty cells in top half)
        const validPositions = [];
        for (let y = 0; y < Math.floor(grid.length / 2); y++) {
            for (let x = 0; x < COLS; x++) {
                if (grid[y][x] === null) {
                    // Check no existing power-up here
                    if (!this.powerUpBlocks.find(p => p.x === x && p.y === y)) {
                        validPositions.push({ x, y });
                    }
                }
            }
        }

        if (validPositions.length === 0) return;

        // Select random position
        const pos = validPositions[Math.floor(Math.random() * validPositions.length)];

        // Select power-up type based on rarity
        const type = this.selectRandomPowerUpType();
        
        const powerUpBlock = new PowerUpBlock(type, pos.x, pos.y);
        this.powerUpBlocks.push(powerUpBlock);

        this.game.onPowerUpSpawned?.(type, pos);
    }

    selectRandomPowerUpType() {
        const types = Object.keys(POWER_UPS);
        const totalRarity = types.reduce((sum, t) => sum + POWER_UPS[t].rarity, 0);
        
        let random = Math.random() * totalRarity;
        for (const type of types) {
            random -= POWER_UPS[type].rarity;
            if (random <= 0) {
                return type;
            }
        }
        
        return types[0];
    }

    /**
     * Check if a line contains power-ups and collect them
     */
    collectPowerUpsInRow(row) {
        const collected = this.powerUpBlocks.filter(p => p.y === row);
        
        for (const powerUp of collected) {
            this.activatePowerUp(powerUp.type);
        }

        this.powerUpBlocks = this.powerUpBlocks.filter(p => p.y !== row);
        
        return collected.length > 0;
    }

    /**
     * Update power-up positions when rows are cleared
     */
    onRowsCleared(clearedRows) {
        // Collect power-ups in cleared rows
        for (const row of clearedRows) {
            this.collectPowerUpsInRow(row);
        }

        // Move remaining power-ups down
        const sortedRows = [...clearedRows].sort((a, b) => a - b);
        
        for (const powerUp of this.powerUpBlocks) {
            let dropAmount = 0;
            for (const clearedRow of sortedRows) {
                if (powerUp.y < clearedRow) {
                    dropAmount++;
                }
            }
            powerUp.y += dropAmount;
        }
    }

    /**
     * Activate a power-up effect
     */
    activatePowerUp(type) {
        const config = POWER_UPS[type];
        
        // Create active power-up for duration-based effects
        if (config.duration !== 0) {
            const activePowerUp = new ActivePowerUp(type, performance.now());
            this.activePowerUps.push(activePowerUp);
        }

        // Execute instant effects
        switch (type) {
            case PowerUpType.BOMB:
                this.executeBomb();
                break;
            case PowerUpType.LIGHTNING:
                this.executeLightning();
                break;
            case PowerUpType.GHOST_WARP:
                this.executeGhostWarp();
                break;
            case PowerUpType.COLOR_BLAST:
                this.executeColorBlast();
                break;
            case PowerUpType.SHUFFLE:
                this.executeShuffle();
                break;
        }

        this.game.onPowerUpActivated?.(type);
    }

    executeBomb() {
        const grid = this.game.grid;
        const piece = this.game.currentPiece;
        if (!piece) return;

        // Get center of current piece
        const centerX = piece.x + Math.floor(piece.shape[0].length / 2);
        const centerY = piece.y + Math.floor(piece.shape.length / 2);

        // Clear 3x3 area
        let clearedCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
                    if (grid[y][x] !== null) {
                        grid[y][x] = null;
                        clearedCount++;
                    }
                }
            }
        }

        // Trigger effect visualization
        this.game.onBombEffect?.(centerX, centerY, clearedCount);
    }

    executeLightning() {
        const grid = this.game.grid;
        const bottomRow = grid.length - 1;
        
        // Clear entire bottom row
        let clearedCount = 0;
        for (let x = 0; x < grid[bottomRow].length; x++) {
            if (grid[bottomRow][x] !== null) {
                grid[bottomRow][x] = null;
                clearedCount++;
            }
        }

        // Don't shift rows - let the game handle that
        if (clearedCount > 0) {
            // Shift all rows down
            grid.splice(bottomRow, 1);
            grid.unshift(Array(grid[0].length).fill(null));
        }

        this.game.onLightningEffect?.(clearedCount);
    }

    executeGhostWarp() {
        const piece = this.game.currentPiece;
        if (!piece) return;

        const ghostY = this.game.getGhostY();
        if (ghostY !== piece.y) {
            piece.y = ghostY;
            this.game.onGhostWarpEffect?.();
        }
    }

    executeColorBlast() {
        const grid = this.game.grid;
        
        // Find most common color
        const colorCounts = {};
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                const color = grid[y][x];
                if (color && color !== '#555555') { // Exclude garbage
                    colorCounts[color] = (colorCounts[color] || 0) + 1;
                }
            }
        }

        const mostCommon = Object.entries(colorCounts)
            .sort((a, b) => b[1] - a[1])[0];
        
        if (!mostCommon) return;
        const targetColor = mostCommon[0];

        // Clear all blocks of that color
        let clearedCount = 0;
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x] === targetColor) {
                    grid[y][x] = null;
                    clearedCount++;
                }
            }
        }

        this.game.onColorBlastEffect?.(targetColor, clearedCount);
    }

    executeShuffle() {
        const game = this.game;
        if (!game.nextPieces || game.nextPieces.length < 3) return;

        // Prioritize I and T pieces
        const priorityPieces = ['I', 'T', 'L', 'J'];
        const shuffled = [];
        
        for (let i = 0; i < Math.min(3, game.nextPieces.length); i++) {
            const priority = priorityPieces[Math.floor(Math.random() * priorityPieces.length)];
            shuffled.push(priority);
        }

        // Replace first 3 pieces
        for (let i = 0; i < shuffled.length; i++) {
            game.nextPieces[i] = shuffled[i];
        }

        game.renderNextPieces?.();
        this.game.onShuffleEffect?.();
    }

    /**
     * Use shield to block garbage row
     */
    useShield() {
        if (!this.hasShield) return false;

        // Find and expire the shield power-up
        const shieldPowerUp = this.activePowerUps.find(p => p.type === PowerUpType.SHIELD);
        if (shieldPowerUp) {
            shieldPowerUp.isExpired = true;
        }

        this.hasShield = false;
        return true;
    }

    /**
     * Get current score multiplier
     */
    getScoreMultiplier() {
        return this.scoreMultiplier;
    }

    /**
     * Get current gravity multiplier
     */
    getGravityMultiplier() {
        return this.gravityMultiplier;
    }

    /**
     * Check if shield is active
     */
    hasActiveShield() {
        return this.hasShield;
    }

    /**
     * Get all active power-ups
     */
    getActivePowerUps() {
        return this.activePowerUps.filter(p => p.isActive());
    }

    /**
     * Render power-up blocks on grid
     */
    renderPowerUpBlocks(ctx, cellSize) {
        for (const block of this.powerUpBlocks) {
            block.render(ctx, cellSize);
        }
    }

    /**
     * Render active power-up indicators
     */
    renderActiveIndicators(ctx, width, height) {
        const active = this.getActivePowerUps();
        if (active.length === 0) return;

        ctx.save();

        const indicatorWidth = 120;
        const indicatorHeight = 24;
        const padding = 5;
        const startY = 100;

        for (let i = 0; i < active.length; i++) {
            const powerUp = active[i];
            const x = width - indicatorWidth - 10;
            const y = startY + i * (indicatorHeight + padding);

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.roundRect(x, y, indicatorWidth, indicatorHeight, 5);
            ctx.fill();

            // Progress bar
            if (powerUp.duration > 0) {
                const progress = powerUp.getRemainingTime() / powerUp.duration;
                ctx.fillStyle = powerUp.config.color;
                ctx.globalAlpha = 0.5;
                ctx.fillRect(x + 2, y + 2, (indicatorWidth - 4) * progress, indicatorHeight - 4);
                ctx.globalAlpha = 1;
            }

            // Border
            ctx.strokeStyle = powerUp.config.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x, y, indicatorWidth, indicatorHeight, 5);
            ctx.stroke();

            // Icon and name
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(`${powerUp.config.icon} ${powerUp.config.name}`, x + 8, y + 16);

            // Time remaining
            if (powerUp.duration > 0) {
                const seconds = Math.ceil(powerUp.getRemainingTime() / 1000);
                ctx.textAlign = 'right';
                ctx.fillText(`${seconds}s`, x + indicatorWidth - 8, y + 16);
            }
        }

        ctx.restore();
    }
}
