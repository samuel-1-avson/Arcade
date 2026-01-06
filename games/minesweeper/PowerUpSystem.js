/**
 * Minesweeper Power-Up System
 * Provides special abilities to help players through challenging levels
 */

import { ICONS } from './Icons.js';

// Power-Up Definitions
export const POWER_UPS = {
    reveal: {
        id: 'reveal',
        name: 'Safe Reveal',
        cost: 50,
        icon: ICONS.POWER_REVEAL,
        desc: 'Reveal a safe area',
        cooldown: 0
    },
    xray: {
        id: 'xray',
        name: 'X-Ray Vision',
        cost: 150,
        icon: ICONS.POWER_XRAY,
        desc: 'Show all mines for 3 seconds',
        cooldown: 30
    },
    shield: {
        id: 'shield',
        name: 'Mine Shield',
        cost: 100,
        icon: ICONS.POWER_SHIELD,
        desc: 'Protect against one mine',
        cooldown: 0
    },
    timefreeze: {
        id: 'timefreeze',
        name: 'Time Freeze',
        cost: 75,
        icon: ICONS.POWER_TIME,
        desc: 'Stop timer for 10s',
        cooldown: 60
    },
    safezone: {
        id: 'safezone',
        name: 'Safe Zone',
        cost: 125,
        icon: ICONS.FLAG, // Using flag or similar for safezone
        desc: 'Mark a 3x3 area',
        cooldown: 45
    },
    defuse: {
        id: 'defuse',
        name: 'Defuse Kit',
        cost: 200,
        icon: ICONS.SETTINGS,
        desc: 'Remove mine from cell',
        cooldown: 0
    }
};

/**
 * Power-Up System Class
 */
export class PowerUpSystem {
    constructor(game) {
        this.game = game;
        this.unlockedPowerUps = this.loadUnlocked();
        this.inventory = {};
        this.cooldowns = {};
        this.activeEffects = {};
        this.shieldActive = false;
        this.timeFrozen = false;
        this.xrayActive = false;
    }

    /**
     * Load unlocked power-ups from storage
     */
    loadUnlocked() {
        try {
            const saved = localStorage.getItem('minesweeper_powerups_unlocked');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch {}
        
        // Default unlocked power-ups
        return Object.keys(POWER_UPS).filter(id => POWER_UPS[id].unlockedByDefault);
    }

    /**
     * Save unlocked power-ups to storage
     */
    saveUnlocked() {
        localStorage.setItem('minesweeper_powerups_unlocked', JSON.stringify(this.unlockedPowerUps));
    }

    /**
     * Check if a power-up is unlocked
     */
    isUnlocked(powerUpId) {
        return this.unlockedPowerUps.includes(powerUpId);
    }

    /**
     * Unlock a power-up
     */
    unlock(powerUpId) {
        if (!POWER_UPS[powerUpId] || this.isUnlocked(powerUpId)) return false;
        
        this.unlockedPowerUps.push(powerUpId);
        this.saveUnlocked();
        this.showUnlockNotification(POWER_UPS[powerUpId]);
        
        return true;
    }

    /**
     * Initialize inventory for a new game
     */
    initForGame() {
        this.inventory = {};
        this.cooldowns = {};
        this.activeEffects = {};
        this.shieldActive = false;
        this.timeFrozen = false;
        this.xrayActive = false;
        
        // Set up inventory based on unlocked power-ups
        for (const powerUpId of this.unlockedPowerUps) {
            const powerUp = POWER_UPS[powerUpId];
            if (powerUp) {
                this.inventory[powerUpId] = powerUp.usesPerGame;
                this.cooldowns[powerUpId] = 0;
            }
        }
    }

    /**
     * Get remaining uses for a power-up
     */
    getRemainingUses(powerUpId) {
        return this.inventory[powerUpId] || 0;
    }

    /**
     * Check if a power-up can be used
     */
    canUse(powerUpId) {
        if (!this.isUnlocked(powerUpId)) return false;
        if ((this.inventory[powerUpId] || 0) <= 0) return false;
        if ((this.cooldowns[powerUpId] || 0) > 0) return false;
        if (this.game.gameOver) return false;
        return true;
    }

    /**
     * Use a power-up
     */
    use(powerUpId, targetCell = null) {
        if (!this.canUse(powerUpId)) return { success: false, reason: 'Cannot use power-up' };
        
        this.inventory[powerUpId]--;
        
        const powerUp = POWER_UPS[powerUpId];
        if (powerUp.cooldown > 0) {
            this.cooldowns[powerUpId] = powerUp.cooldown;
            this.startCooldownTimer(powerUpId);
        }
        
        // Execute power-up effect
        const result = this.executePowerUp(powerUpId, targetCell);
        
        // Update UI
        this.updateUI();
        
        return { success: true, ...result };
    }

    /**
     * Execute a specific power-up
     */
    executePowerUp(powerUpId, targetCell) {
        switch (powerUpId) {
            case 'reveal':
                return this.executeReveal();
            case 'xray':
                return this.executeXRay();
            case 'shield':
                return this.executeShield();
            case 'timefreeze':
                return this.executeTimeFreeze();
            case 'safezone':
                return this.executeSafeZone(targetCell);
            case 'defuse':
                return this.executeDefuse();
            default:
                return { message: 'Unknown power-up' };
        }
    }

    /**
     * Safe Reveal - Reveal one random safe cell
     */
    executeReveal() {
        if (!this.game.grid) return { message: 'No active game' };
        
        // Find all safe, unrevealed cells
        const safeCells = [];
        for (let row = 0; row < this.game.rows; row++) {
            for (let col = 0; col < this.game.cols; col++) {
                const cell = this.game.grid[row][col];
                if (!cell.mine && !cell.revealed && !cell.flagged) {
                    safeCells.push({ row, col });
                }
            }
        }
        
        if (safeCells.length === 0) {
            return { message: 'No safe cells to reveal' };
        }
        
        // Pick a random safe cell
        const cell = safeCells[Math.floor(Math.random() * safeCells.length)];
        
        // Reveal it with animation
        this.highlightCell(cell.row, cell.col, 'power-up-reveal');
        
        setTimeout(() => {
            if (this.game.revealCell) {
                this.game.revealCell(cell.row, cell.col);
            }
        }, 500);
        
        return { cell, message: 'Safe cell revealed!' };
    }

    /**
     * X-Ray Vision - Show all mines temporarily
     */
    executeXRay() {
        if (!this.game.grid) return { message: 'No active game' };
        
        this.xrayActive = true;
        
        // Highlight all mines
        for (let row = 0; row < this.game.rows; row++) {
            for (let col = 0; col < this.game.cols; col++) {
                const cell = this.game.grid[row][col];
                if (cell.mine && !cell.revealed) {
                    const element = this.getCellElement(row, col);
                    if (element) {
                        element.classList.add('xray-mine');
                    }
                }
            }
        }
        
        // Remove after 3 seconds
        setTimeout(() => {
            this.xrayActive = false;
            document.querySelectorAll('.xray-mine').forEach(el => {
                el.classList.remove('xray-mine');
            });
        }, 3000);
        
        this.showPowerUpMessage(`${ICONS.POWER_XRAY} X-Ray Active!`, 3000);
        
        return { message: 'X-Ray vision activated for 3 seconds!' };
    }

    /**
     * Mine Shield - Protect from one mine click
     */
    executeShield() {
        this.shieldActive = true;
        
        // Add visual indicator
        const board = document.getElementById('game-board');
        if (board) {
            board.classList.add('shield-active');
        }
        
        this.showPowerUpMessage(`${ICONS.POWER_SHIELD} Shield Active!`);
        
        return { message: 'Shield activated! You\'ll survive one mine.' };
    }

    /**
     * Consume the shield (called when hitting a mine)
     */
    consumeShield() {
        if (!this.shieldActive) return false;
        
        this.shieldActive = false;
        
        const board = document.getElementById('game-board');
        if (board) {
            board.classList.remove('shield-active');
            board.classList.add('shield-break');
            setTimeout(() => board.classList.remove('shield-break'), 500);
        }
        
        this.showPowerUpMessage(`${ICONS.POWER_SHIELD} Shield Broken!`, 2000);
        
        return true;
    }

    /**
     * Time Freeze - Pause the timer
     */
    executeTimeFreeze() {
        this.timeFrozen = true;
        
        // Stop the game timer
        if (this.game.stopTimer) {
            this.game.stopTimer();
        }
        
        // Add visual effect
        const container = document.querySelector('.minesweeper-container');
        if (container) {
            container.classList.add('time-frozen');
        }
        
        this.showPowerUpMessage(`${ICONS.POWER_TIME} Time Frozen!`, 15000);
        
        // Resume after 15 seconds
        setTimeout(() => {
            this.timeFrozen = false;
            
            if (container) {
                container.classList.remove('time-frozen');
            }
            
            // Resume timer if game is still active
            if (!this.game.gameOver && this.game.startTimer) {
                this.game.startTimer();
            }
            
            this.showPowerUpMessage(`${ICONS.POWER_TIME} Time Resumed`, 1500);
        }, 15000);
        
        return { message: 'Timer paused for 15 seconds!' };
    }

    /**
     * Safe Zone - Show safe cells in a 3x3 area
     */
    executeSafeZone(targetCell) {
        if (!targetCell) {
            // Enter targeting mode
            this.enterTargetingMode('safezone');
            return { message: 'Click a cell to scan that area', targeting: true };
        }
        
        const { row, col } = targetCell;
        
        // Scan 3x3 area around target
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = row + dr;
                const c = col + dc;
                
                if (r >= 0 && r < this.game.rows && c >= 0 && c < this.game.cols) {
                    const cell = this.game.grid[r][c];
                    const element = this.getCellElement(r, c);
                    
                    if (element && !cell.revealed) {
                        if (cell.mine) {
                            element.classList.add('safezone-danger');
                        } else {
                            element.classList.add('safezone-safe');
                        }
                    }
                }
            }
        }
        
        // Remove indicators after 5 seconds
        setTimeout(() => {
            document.querySelectorAll('.safezone-danger, .safezone-safe').forEach(el => {
                el.classList.remove('safezone-danger', 'safezone-safe');
            });
        }, 5000);
        
        return { message: 'Area scanned! Green = safe, Red = danger' };
    }

    /**
     * Bomb Defuse - Remove one mine from the board
     */
    executeDefuse() {
        if (!this.game.grid) return { message: 'No active game' };
        
        // Find all unrevealed mines
        const mines = [];
        for (let row = 0; row < this.game.rows; row++) {
            for (let col = 0; col < this.game.cols; col++) {
                const cell = this.game.grid[row][col];
                if (cell.mine && !cell.revealed) {
                    mines.push({ row, col });
                }
            }
        }
        
        if (mines.length === 0) {
            return { message: 'No mines to defuse' };
        }
        
        // Pick a random mine
        const mine = mines[Math.floor(Math.random() * mines.length)];
        
        // Remove the mine
        this.game.grid[mine.row][mine.col].mine = false;
        this.game.mineCount--;
        
        // Recalculate adjacent mine counts
        this.recalculateAdjacentMines(mine.row, mine.col);
        
        // Visual effect
        this.highlightCell(mine.row, mine.col, 'power-up-defuse');
        
        // Update mines display
        if (this.game.updateMinesDisplay) {
            this.game.updateMinesDisplay();
        }
        
        this.showPowerUpMessage(`${ICONS.SETTINGS} Mine Defused!`, 2000);
        
        return { cell: mine, message: 'One mine has been defused!' };
    }

    /**
     * Recalculate adjacent mine counts after defusing
     */
    recalculateAdjacentMines(defusedRow, defusedCol) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = defusedRow + dr;
                const c = defusedCol + dc;
                
                if (r >= 0 && r < this.game.rows && c >= 0 && c < this.game.cols) {
                    const cell = this.game.grid[r][c];
                    if (!cell.mine) {
                        // Recalculate
                        cell.adjacentMines = this.countAdjacentMines(r, c);
                        
                        // Update display if revealed
                        if (cell.revealed && this.game.updateCellDisplay) {
                            this.game.updateCellDisplay(r, c);
                        }
                    }
                }
            }
        }
        
        // Also recalculate the defused cell itself
        this.game.grid[defusedRow][defusedCol].adjacentMines = this.countAdjacentMines(defusedRow, defusedCol);
    }

    /**
     * Count adjacent mines (helper)
     */
    countAdjacentMines(row, col) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < this.game.rows && c >= 0 && c < this.game.cols) {
                    if (this.game.grid[r][c].mine) count++;
                }
            }
        }
        return count;
    }

    /**
     * Enter targeting mode for power-ups that need a target
     */
    enterTargetingMode(powerUpId) {
        this.targetingPowerUp = powerUpId;
        
        const board = document.getElementById('game-board');
        if (board) {
            board.classList.add('targeting-mode');
            
            // Add click handler
            this.targetingHandler = (e) => {
                const cell = e.target.closest('.cell');
                if (cell) {
                    const row = parseInt(cell.dataset.row);
                    const col = parseInt(cell.dataset.col);
                    this.exitTargetingMode();
                    this.executePowerUp(this.targetingPowerUp, { row, col });
                }
            };
            
            board.addEventListener('click', this.targetingHandler, { once: true });
        }
    }

    /**
     * Exit targeting mode
     */
    exitTargetingMode() {
        const board = document.getElementById('game-board');
        if (board) {
            board.classList.remove('targeting-mode');
            if (this.targetingHandler) {
                board.removeEventListener('click', this.targetingHandler);
            }
        }
        this.targetingPowerUp = null;
    }

    /**
     * Start cooldown timer for a power-up
     */
    startCooldownTimer(powerUpId) {
        const interval = setInterval(() => {
            this.cooldowns[powerUpId]--;
            this.updateUI();
            
            if (this.cooldowns[powerUpId] <= 0) {
                clearInterval(interval);
            }
        }, 1000);
    }

    /**
     * Get cell element by row/col
     */
    getCellElement(row, col) {
        const board = document.getElementById('game-board');
        if (!board) return null;
        return board.children[row * this.game.cols + col];
    }

    /**
     * Highlight a cell with animation
     */
    highlightCell(row, col, className) {
        const element = this.getCellElement(row, col);
        if (element) {
            element.classList.add(className);
            setTimeout(() => element.classList.remove(className), 1000);
        }
    }

    /**
     * Show power-up message
     */
    showPowerUpMessage(message, duration = 2000) {
        const toast = document.createElement('div');
        toast.className = 'power-up-message';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /**
     * Show unlock notification
     */
    showUnlockNotification(powerUp) {
        const popup = document.createElement('div');
        popup.className = 'power-up-unlock-popup';
        popup.innerHTML = `
            <div class="power-up-unlock-icon">${powerUp.icon}</div>
            <div class="power-up-unlock-info">
                <div class="power-up-unlock-title">Power-Up Unlocked!</div>
                <div class="power-up-unlock-name">${powerUp.name}</div>
                <div class="power-up-unlock-desc">${powerUp.description}</div>
            </div>
        `;
        
        document.body.appendChild(popup);
        requestAnimationFrame(() => popup.classList.add('show'));
        
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 500);
        }, 3500);
    }

    /**
     * Update power-up UI
     */
    updateUI() {
        const container = document.querySelector('.power-up-bar');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (const powerUpId of this.unlockedPowerUps) {
            const powerUp = POWER_UPS[powerUpId];
            const uses = this.inventory[powerUpId] || 0;
            const cooldown = this.cooldowns[powerUpId] || 0;
            const canUse = this.canUse(powerUpId);
            
            const btn = document.createElement('button');
            btn.className = `power-up-btn ${canUse ? '' : 'disabled'}`;
            btn.title = `${powerUp.name}: ${powerUp.description}`;
            btn.innerHTML = `
                <span class="power-up-icon">${powerUp.icon}</span>
                <span class="power-up-uses">${uses}</span>
                ${cooldown > 0 ? `<span class="power-up-cooldown">${cooldown}s</span>` : ''}
            `;
            
            if (canUse) {
                btn.onclick = () => this.use(powerUpId);
            }
            
            container.appendChild(btn);
        }
    }

    /**
     * Create power-up bar UI element
     */
    createPowerUpBar() {
        const bar = document.createElement('div');
        bar.className = 'power-up-bar';
        return bar;
    }

    /**
     * Get all power-ups data for UI
     */
    getAllPowerUps() {
        return Object.values(POWER_UPS).map(powerUp => ({
            ...powerUp,
            unlocked: this.isUnlocked(powerUp.id),
            uses: this.inventory[powerUp.id] || 0,
            cooldown: this.cooldowns[powerUp.id] || 0
        }));
    }
}

export default PowerUpSystem;
