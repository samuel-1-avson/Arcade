/**
 * Enhanced Game Modes Manager for 2048
 * Fully functional game modes with timers, grid sizes, and special rules
 */

class GameModesManager {
    constructor() {
        this.modes = {
            // ============================================
            // CLASSIC MODE - Standard 2048
            // ============================================
            classic: {
                name: 'Classic',
                icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><circle cx="12" cy="12" r="3"/></svg>',
                description: 'Traditional 4×4 game. Reach 2048!',
                gridSize: 4,
                hasTimer: false,
                hasGameOver: true,
                initialTiles: 2,
                targetTile: 2048,
                color: '#8bac8b'
            },

            timeAttack: {
                name: 'Time Attack',
                icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>',
                description: 'Score as high as possible in 3 minutes!',
                gridSize: 4,
                hasTimer: true,
                timeLimit: 180,
                hasGameOver: true,
                initialTiles: 2,
                targetTile: null,
                color: '#e74c3c'
            },

            zen: {
                name: 'Zen Mode',
                icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>',
                description: 'Relax and play. No game over, infinite undo.',
                gridSize: 4,
                hasTimer: false,
                hasGameOver: false,
                initialTiles: 2,
                targetTile: null,
                infiniteUndo: true,
                color: '#9b59b6'
            },

            speed: {
                name: 'Speed Run',
                icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>',
                description: 'Reach 512 as fast as possible!',
                gridSize: 4,
                hasTimer: true,
                hasGameOver: true,
                initialTiles: 2,
                targetTile: 512,
                countUp: true,
                color: '#f39c12'
            },

            challenge: {
                name: 'Challenge',
                icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM13 18h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
                description: 'Tiles start at 4. Extra difficult!',
                gridSize: 4,
                hasTimer: false,
                hasGameOver: true,
                initialTiles: 2,
                startValue: 4,
                targetTile: 2048,
                color: '#e67e22'
            },

            practice: {
                name: 'Practice',
                icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
                description: '3 undos, shows hints. Perfect for learning!',
                gridSize: 4,
                hasTimer: false,
                hasGameOver: true,
                initialTiles: 2,
                undoLimit: 3,
                showHints: true,
                targetTile: 2048,
                color: '#27ae60'
            }
        };

        this.currentMode = this.loadMode();
        this.timer = null;
        this.timeRemaining = 0;
        this.timeElapsed = 0;
        this.isTimerRunning = false;
        this.onTimerUpdate = null;
        this.onTimerEnd = null;

        this.init();
    }

    init() {
        // Load saved mode
        const savedMode = localStorage.getItem('2048-current-mode');
        if (savedMode && this.modes[savedMode]) {
            this.currentMode = savedMode;
        }
    }

    loadMode() {
        return localStorage.getItem('2048-current-mode') || 'classic';
    }

    getMode(modeId) {
        return this.modes[modeId] || this.modes.classic;
    }

    setMode(modeId, startGame = true) {
        if (!this.modes[modeId]) {
            console.warn(`Mode "${modeId}" not found`);
            return false;
        }

        this.currentMode = modeId;
        localStorage.setItem('2048-current-mode', modeId);
        
        // Stop any running timer
        this.stopTimer();
        
        // Update UI
        this.updateModeDisplay();
        
        // Trigger game restart if needed
        if (startGame && window.GameManager) {
            // Restart game with new mode settings
            this.restartWithMode(modeId);
        }

        console.log(`🎮 Mode changed to: ${this.modes[modeId].name}`);
        return true;
    }

    getCurrentMode() {
        return this.getMode(this.currentMode);
    }

    getCurrentModeId() {
        return this.currentMode;
    }

    getAllModes() {
        return Object.entries(this.modes).map(([id, mode]) => ({
            id,
            ...mode,
            active: id === this.currentMode
        }));
    }

    // ============================================
    // TIMER FUNCTIONALITY
    // ============================================
    startTimer() {
        const mode = this.getCurrentMode();
        if (!mode.hasTimer) return;

        this.isTimerRunning = true;
        
        if (mode.countUp) {
            // Count up timer (for speed runs)
            this.timeElapsed = 0;
            this.timer = setInterval(() => {
                this.timeElapsed++;
                this.updateTimerDisplay();
                if (this.onTimerUpdate) this.onTimerUpdate(this.timeElapsed);
            }, 1000);
        } else {
            // Count down timer
            this.timeRemaining = mode.timeLimit;
            this.updateTimerDisplay();
            
            this.timer = setInterval(() => {
                this.timeRemaining--;
                this.updateTimerDisplay();
                
                if (this.onTimerUpdate) this.onTimerUpdate(this.timeRemaining);
                
                if (this.timeRemaining <= 0) {
                    this.stopTimer();
                    if (this.onTimerEnd) this.onTimerEnd();
                    this.showTimeUpMessage();
                }
            }, 1000);
        }

        this.showTimerUI();
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isTimerRunning = false;
    }

    pauseTimer() {
        this.stopTimer();
    }

    resumeTimer() {
        if (this.getCurrentMode().hasTimer && !this.isTimerRunning) {
            this.startTimer();
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showTimerUI() {
        let timerEl = document.getElementById('game-timer');
        if (!timerEl) {
            timerEl = document.createElement('div');
            timerEl.id = 'game-timer';
            timerEl.className = 'game-timer';
            
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
                gameContainer.parentNode.insertBefore(timerEl, gameContainer);
            }
        }
        timerEl.style.display = 'block';
        this.updateTimerDisplay();
    }

    hideTimerUI() {
        const timerEl = document.getElementById('game-timer');
        if (timerEl) {
            timerEl.style.display = 'none';
        }
    }

    updateTimerDisplay() {
        const timerEl = document.getElementById('game-timer');
        if (!timerEl) return;

        const mode = this.getCurrentMode();
        const time = mode.countUp ? this.timeElapsed : this.timeRemaining;
        const timeStr = this.formatTime(time);
        
        // Add warning class for low time
        const isLowTime = !mode.countUp && this.timeRemaining <= 30;
        
        timerEl.innerHTML = `
            <span class="timer-icon">${mode.countUp ? '⏱️' : '⏰'}</span>
            <span class="timer-value ${isLowTime ? 'timer-warning' : ''}">${timeStr}</span>
        `;
    }

    showTimeUpMessage() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content time-up-modal">
                <h2>⏰ Time's Up!</h2>
                <p>Your final score: <strong id="final-score">0</strong></p>
                <button class="modal-btn primary" onclick="this.closest('.modal-overlay').remove(); gameModesManager.restartWithMode('${this.currentMode}')">
                    Play Again
                </button>
                <button class="modal-btn secondary" onclick="this.closest('.modal-overlay').remove(); gameModesManager.showModeSelector()">
                    Change Mode
                </button>
            </div>
        `;
        document.body.appendChild(modal);

        // Get score from game
        const scoreEl = document.querySelector('.score-container');
        if (scoreEl) {
            const scoreDisplay = modal.querySelector('#final-score');
            if (scoreDisplay) {
                scoreDisplay.textContent = scoreEl.textContent.replace(/\D/g, '') || '0';
            }
        }
    }

    // ============================================
    // GAME RESTART WITH MODE
    // ============================================
    restartWithMode(modeId) {
        const mode = this.getMode(modeId);
        
        // Stop timer
        this.stopTimer();
        
        // Hide timer for non-timer modes
        if (!mode.hasTimer) {
            this.hideTimerUI();
        }

        // Restart the game manager
        if (window.gameManager) {
            try {
                window.gameManager.restart();
            } catch (e) {
                console.error('Game manager restart failed:', e);
            }
        } else if (window.GameManager) {
            // Fallback to button click if instance not found but class exists
            try {
                const restartBtn = document.querySelector('.restart-button');
                if (restartBtn) {
                    restartBtn.click();
                }
            } catch (e) {
                console.log('Game restart via button failed:', e);
            }
        }

        // Start timer for timer modes
        if (mode.hasTimer) {
            setTimeout(() => this.startTimer(), 500);
        }

        // Update display
        this.updateModeDisplay();
    }

    // ============================================
    // MODE DISPLAY
    // ============================================
    updateModeDisplay() {
        const mode = this.getCurrentMode();
        
        // Update sidebar mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.currentMode);
        });

        // Update any mode indicator
        const modeIndicator = document.getElementById('current-mode-indicator');
        if (modeIndicator) {
            modeIndicator.innerHTML = `${mode.icon} ${mode.name}`;
        }

        // Show/hide timer
        if (mode.hasTimer) {
            this.showTimerUI();
        } else {
            this.hideTimerUI();
        }
    }

    // ============================================
    // MODE SELECTOR MODAL
    // ============================================
    showModeSelector() {
        // Remove existing modal
        document.querySelectorAll('.modal-overlay').forEach(m => m.remove());

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        const modesHTML = this.getAllModes().map(mode => `
            <div class="mode-card ${mode.active ? 'active' : ''}" data-mode="${mode.id}">
                <div class="mode-card-header" style="background: ${mode.color}">
                    <span class="mode-card-icon">${mode.icon}</span>
                </div>
                <div class="mode-card-body">
                    <div class="mode-card-name">${mode.name}</div>
                    <div class="mode-card-desc">${mode.description}</div>
                    <div class="mode-card-info">
                        <span class="mode-grid-size">${mode.gridSize}×${mode.gridSize}</span>
                        ${mode.hasTimer ? '<span class="mode-timer-badge">⏱️ Timer</span>' : ''}
                        ${!mode.hasGameOver ? '<span class="mode-zen-badge">∞ Zen</span>' : ''}
                    </div>
                </div>
            </div>
        `).join('');

        modal.innerHTML = `
            <div class="modal-content mode-selector-modal">
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                <h2>🎮 Select Game Mode</h2>
                <div class="modes-grid">
                    ${modesHTML}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add click handlers
        modal.querySelectorAll('.mode-card').forEach(card => {
            card.onclick = () => {
                const modeId = card.dataset.mode;
                this.setMode(modeId, true);
                modal.remove();
            };
        });

        // Close on backdrop click
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    // ============================================
    // HELPER METHODS
    // ============================================
    canUndo() {
        const mode = this.getCurrentMode();
        return mode.infiniteUndo || (mode.undoLimit && mode.undoLimit > 0);
    }

    hasGameOver() {
        return this.getCurrentMode().hasGameOver;
    }

    getGridSize() {
        return this.getCurrentMode().gridSize;
    }

    getTargetTile() {
        return this.getCurrentMode().targetTile;
    }

    getStartValue() {
        return this.getCurrentMode().startValue || 2;
    }
}

// Initialize game modes manager
const gameModesManager = new GameModesManager();
window.gameModesManager = gameModesManager;

// Expose selectMode function for sidebar buttons
window.selectMode = function(modeId) {
    gameModesManager.setMode(modeId, true);
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameModesManager;
}
