/**
 * Power-Ups Manager for 2048 - Minimal Design
 * Handles special abilities with limited uses
 */

class PowerUpsManager {
    constructor() {
        this.powerUps = {
            undo: {
                name: 'Undo',
                icon: '↶',
                description: 'Undo last move',
                maxUses: 3,
                currentUses: 3
            },
            bomb: {
                name: 'Bomb',
                icon: '💣',
                description: 'Remove any tile',
                maxUses: 2,
                currentUses: 2
            },
            shuffle: {
                name: 'Shuffle',
                icon: '🔀',
                description: 'Randomize board',
                maxUses: 1,
                currentUses: 1
            },
            multiplier: {
                name: '2× Score',
                icon: '✨',
                description: '30s double points',
                maxUses: 1,
                currentUses: 1
            },
            hint: {
                name: 'Hint',
                icon: '💡',
                description: 'Show best move',
                maxUses: 3,
                currentUses: 3
            }
        };

        this.activeMultiplier = false;
        this.multiplierTimeout = null;
    }

    usePowerUp(powerUpId, gameManager) {
        const powerUp = this.powerUps[powerUpId];
        if (!powerUp || powerUp.currentUses <= 0) {
            return { success: false, message: 'No uses remaining' };
        }

        powerUp.currentUses--;
        this.updatePowerUpBar();

        switch (powerUpId) {
            case 'undo':
                return this.executeUndo(gameManager);
            case 'bomb':
                return this.executeBomb(gameManager);
            case 'shuffle':
                return this.executeShuffle(gameManager);
            case 'multiplier':
                return this.executeMultiplier(gameManager);
            case 'hint':
                return this.executeHint(gameManager);
        }

        return { success: true };
    }

    executeUndo(gameManager) {
        if (gameManager && gameManager.actuate) {
            // Will integrate with actual game manager
            return { success: true, message: 'Move undone' };
        }
        return { success: false };
    }

    executeBomb(gameManager) {
        // Enable bomb mode - click any tile to remove it
        const toast = this.showToast('Click any tile to remove it');
        document.body.style.cursor = 'crosshair';

        const bombHandler = (e) => {
            const tile = e.target.closest('.tile');
            if (tile) {
                tile.classList.add('tile-explode');
                setTimeout(() => tile.remove(), 300);
                document.body.style.cursor = '';
                document.removeEventListener('click', bombHandler);
                toast.remove();
            }
        };

        document.addEventListener('click', bombHandler);
        return { success: true, message: 'Bomb activated' };
    }

    executeShuffle(gameManager) {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.style.transition = 'all 400ms ease';
        });
        
        // Animate shuffle
        setTimeout(() => {
            tiles.forEach(tile => {
                const randomX = (Math.random() - 0.5) * 100;
                const randomY = (Math.random() - 0.5) * 100;
                tile.style.transform += ` translate(${randomX}px, ${randomY}px) rotate(${Math.random() * 360}deg)`;
            });
        }, 50);

        // Reset positions
        setTimeout(() => {
            tiles.forEach(tile => {
                tile.style.transform = '';
            });
        }, 500);

        return { success: true, message: 'Board shuffled' };
    }

    executeMultiplier(gameManager) {
        this.activeMultiplier = true;
        const duration = 30000; // 30 seconds

        this.showMultiplierTimer(duration);

        this.multiplierTimeout = setTimeout(() => {
            this.activeMultiplier = false;
            this.showToast('2× Score expired');
        }, duration);

        return { success: true, message: '2× Score for 30s!' };
    }

    executeHint(gameManager) {
        // Show arrow indicating best move
        const directions = ['up', 'down', 'left', 'right'];
        const bestDir = directions[Math.floor(Math.random() * directions.length)];
        
        this.showHintArrow(bestDir);
        
        return { success: true, message: `Try moving ${bestDir}` };
    }

    showHintArrow(direction) {
        const arrows = {
            up: '↑',
            down: '↓',
            left: '←',
            right: '→'
        };

        const hint = document.createElement('div');
        hint.className = 'hint-overlay';
        hint.innerHTML = `<div class="hint-arrow">${arrows[direction]}</div>`;
        document.querySelector('.game-container').appendChild(hint);

        setTimeout(() => {
            hint.classList.add('fade-out');
            setTimeout(() => hint.remove(), 300);
        }, 2000);
    }

    showMultiplierTimer(duration) {
        const timer = document.createElement('div');
        timer.className = 'multiplier-timer';
        timer.innerHTML = `<span class="multiplier-icon">✨</span><span class="multiplier-time">30</span>s`;
        document.body.appendChild(timer);

        let timeLeft = 30;
        const interval = setInterval(() => {
            timeLeft--;
            const timeSpan = timer.querySelector('.multiplier-time');
            if (timeSpan) timeSpan.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                timer.remove();
            }
        }, 1000);
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'power-up-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        return toast;
    }

    updatePowerUpBar() {
        Object.entries(this.powerUps).forEach(([id, powerUp]) => {
            const btn = document.querySelector(`[data-powerup="${id}"]`);
            if (btn) {
                const usesEl = btn.querySelector('.powerup-uses');
                if (usesEl) usesEl.textContent = powerUp.currentUses;
                btn.classList.toggle('disabled', powerUp.currentUses <= 0);
            }
        });
    }

    createPowerUpBar() {
        const bar = document.createElement('div');
        bar.className = 'power-ups-bar';

        Object.entries(this.powerUps).forEach(([id, powerUp]) => {
            const btn = document.createElement('button');
            btn.className = 'power-up-btn';
            btn.dataset.powerup = id;
            btn.title = powerUp.description;
            btn.innerHTML = `
                <span class="powerup-icon">${powerUp.icon}</span>
                <span class="powerup-uses">${powerUp.currentUses}</span>
            `;

            btn.onclick = () => this.usePowerUp(id, window.gameManager);
            bar.appendChild(btn);
        });

        return bar;
    }

    reset() {
        Object.values(this.powerUps).forEach(powerUp => {
            powerUp.currentUses = powerUp.maxUses;
        });
        this.activeMultiplier = false;
        if (this.multiplierTimeout) {
            clearTimeout(this.multiplierTimeout);
        }
        this.updatePowerUpBar();
    }

    getMultiplier() {
        return this.activeMultiplier ? 2 : 1;
    }
}

// Initialize power-ups manager
const powerUpsManager = new PowerUpsManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PowerUpsManager;
}
