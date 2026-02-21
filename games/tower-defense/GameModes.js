/**
 * Tower Defense - Game Modes System
 * Implements 5 different game modes with unique rules and scoring
 */

export const GAME_MODES = {
    CLASSIC: 'classic',
    ENDLESS: 'endless',
    CHALLENGE: 'challenge',
    SPEEDRUN: 'speedrun',
    SURVIVAL: 'survival'
};

export class GameModes {
    constructor(game) {
        this.game = game;
        this.currentMode = GAME_MODES.CLASSIC;
        this.modeData = null;
    }

    // Set game mode and apply mode-specific rules
    setMode(mode, options = {}) {
        this.currentMode = mode;
        this.modeData = options;
        
        switch (mode) {
            case GAME_MODES.CLASSIC:
                this.applyClassicMode();
                break;
            case GAME_MODES.ENDLESS:
                this.applyEndlessMode();
                break;
            case GAME_MODES.CHALLENGE:
                this.applyChallengeMode(options);
                break;
            case GAME_MODES.SPEEDRUN:
                this.applySpeedRunMode();
                break;
            case GAME_MODES.SURVIVAL:
                this.applySurvivalMode();
                break;
        }
    }

    // In Classic mode, standard rules apply
    applyClassicMode() {
        this.game.scoreMultiplier = 1.0;
        this.game.waveMultiplier = 1.0;
        this.game.goldMultiplier = 1.0;
    }

    // In Endless Mode, waves continue indefinitely with increasing difficulty
    applyEndlessMode() {
        this.game.scoreMultiplier = 1.5;
        this.game.waveMultiplier = 1.2; // Enemies get stronger faster
        this.game.goldMultiplier = 1.3;
        this.game.maxWaves = Infinity;
        
        // Track best wave for leaderboard
        try {
            this.bestWave = parseInt(localStorage.getItem('towerdefense_endless_best')) || 0;
        } catch (e) {
            console.warn('Failed to load endless best wave:', e);
            this.bestWave = 0;
        }
    }

    // Challenge Mode applies special restrictions
    applyChallengeMode(options) {
        const {
            restrictedTowers = [],  // Array of tower types that can't be used
            noUpgrades = false,  // Can't upgrade towers
            limitedGold = false, // Start with less gold, earn less
            timeLimit = 0,      // Time limit in seconds (0 = no limit)
            noPause = false     // Can't pause the game
        } = options;

        this.game.restrictedTowers = restrictedTowers;
        this.game.canUpgrade = !noUpgrades;
        this.game.scoreMultiplier = 2.0; // Higher reward for harder challenge
        
        if (limitedGold) {
            this.game.gold = Math.floor(this.game.gold * 0.5);
            this.game.goldMultiplier = 0.7;
        }
        
        if (timeLimit > 0) {
            this.game.timeLimit = timeLimit;
            this.game.timeRemaining = timeLimit;
        }
        
        this.game.canPause = !noPause;
    }

    // Speed Run Mode focuses on completing waves quickly
    applySpeedRunMode() {
        this.game.scoreMultiplier = 1.0;
        this.game.goldMultiplier = 1.5; // More gold to speed up building
        
        // Track time
        this.startTime = Date.now();
        try {
            this.bestTime = parseFloat(localStorage.getItem('towerdefense_speedrun_best')) || Infinity;
        } catch (e) {
            console.warn('Failed to load speedrun best time:', e);
            this.bestTime = Infinity;
        }
    }

    // Survival Mode: Single life, higher rewards
    applySurvivalMode() {
        this.game.lives = 1;
        this.game.scoreMultiplier = 3.0;
        this.game.goldMultiplier = 1.5;
    }

    // Get mode-specific display info
    getModeInfo() {
        const modeInfo = {
            [GAME_MODES.CLASSIC]: {
                name: 'Classic',
                icon: '🎮',
                description: 'Standard tower defense gameplay',
                color: '#00ff88'
            },
            [GAME_MODES.ENDLESS]: {
                name: 'Endless',
                icon: '♾️',
                description: 'Survive as long as you can',
                color: '#ff00ff'
            },
            [GAME_MODES.CHALLENGE]: {
                name: 'Challenge',
                icon: '⚡',
                description: 'Special rules and restrictions',
                color: '#ffaa00'
            },
            [GAME_MODES.SPEEDRUN]: {
                name: 'Speed Run',
                icon: '⏱️',
                description: 'Complete as fast as possible',
                color: '#00aaff'
            },
            [GAME_MODES.SURVIVAL]: {
                name: 'Survival',
                icon: '❤️',
                description: 'One life, maximum rewards',
                color: '#ff0000'
            }
        };

        return modeInfo[this.currentMode];
    }

    // Calculate mode-specific score bonuses
    calculateFinalScore(baseScore) {
        let finalScore = Math.floor(baseScore * this.game.scoreMultiplier);

        // Bonus for Endless mode based on waves survived
        if (this.currentMode === GAME_MODES.ENDLESS) {
            const waveBonus = this.game.wave * 100;
            finalScore += waveBonus;
        }

        // Bonus for Speed Run based on time
        if (this.currentMode === GAME_MODES.SPEEDRUN) {
            const elapsedTime = (Date.now() - this.startTime) / 1000;
            const timeBonus = Math.max(0, Math.floor(10000 - elapsedTime * 10));
            finalScore += timeBonus;
            
            // Save best time if improved
            if (elapsedTime < this.bestTime) {
                this.bestTime = elapsedTime;
                try {
                    localStorage.setItem('towerdefense_speedrun_best', this.bestTime.toString());
                } catch (e) {
                    console.warn('Failed to save speedrun best time:', e);
                }
            }
        }

        // Survival mode bonus if won
        if (this.currentMode === GAME_MODES.SURVIVAL && this.game.gameWon) {
            finalScore = Math.floor(finalScore * 2);
        }

        return finalScore;
    }

    // Update for endless mode difficulty scaling
    getEndlessWaveData(wave) {
        // Linear + Exponential scaling
        const difficulty = 1 + (wave * 0.1) + Math.pow(1.05, wave);
        const baseEnemyCount = 10 + wave * 1.5;
        const enemyCount = Math.floor(baseEnemyCount * difficulty * 0.5);
        
        // Ensure minimum count
        const count = Math.max(5, Math.min(enemyCount, 100)); // Cap at 100 per wave
        
        const types = ['basic'];
        if (wave >= 3) types.push('fast');
        if (wave >= 5) types.push('tank');
        if (wave >= 8) types.push('flying');
        if (wave >= 12) types.push('armored');
        if (wave >= 15) types.push('speeder');
        if (wave >= 18) types.push('healer');
        if (wave >= 22) types.push('spawner');
        if (wave >= 25) types.push('miniboss');
        
        // Boss wave every 10 levels
        if (wave % 10 === 0) types.push('boss');
        
        // Extreme difficulty after wave 50
        if (wave >= 50) {
            types.push('boss'); // Bosses can appear normally
        }

        return { enemyCount: count, types };
    }

    // Show mode-specific UI elements
    showModeUI() {
        // Remove existing if any
        this.cleanup();

        const modeInfo = this.getModeInfo();
        const modeColor = modeInfo.color;

        let uiHTML = `
            <div id="mode-indicator" class="glass" style="
                position: fixed;
                top: 90px;
                left: 20px;
                border: 1px solid ${modeColor};
                border-left: 4px solid ${modeColor};
                border-radius: var(--radius-md);
                padding: 12px 20px;
                color: ${modeColor};
                z-index: 100;
                display: flex;
                align-items: center;
                gap: 10px;
                box-shadow: 0 0 15px ${modeColor}40;
            ">
                <span style="font-size: 1.5em; filter: drop-shadow(0 0 5px ${modeColor});">${modeInfo.icon}</span>
                <div style="display: flex; flex-direction: column;">
                    <span class="font-display" style="font-size: 0.7em; opacity: 0.8;">CURRENT MODE</span>
                    <strong class="font-heading" style="font-size: 1.1em; letter-spacing: 0.05em;">${modeInfo.name}</strong>
                </div>
            </div>
        `;

        // Add speedrun timer
        if (this.currentMode === GAME_MODES.SPEEDRUN) {
            uiHTML += `
                <div id="speedrun-timer" class="glass" style="
                    position: fixed;
                    top: 90px;
                    right: 20px;
                    border: 1px solid #00aaff;
                    border-radius: var(--radius-md);
                    padding: 10px 20px;
                    color: #00aaff;
                    z-index: 100;
                    font-family: 'Orbitron', monospace;
                    font-size: 1.2em;
                    text-shadow: 0 0 10px rgba(0, 170, 255, 0.5);
                ">
                    ⏱️ <span id="timer-display">0:00</span>
                </div>
            `;
        }

        // Add endless wave counter
        if (this.currentMode === GAME_MODES.ENDLESS) {
            uiHTML += `
                <div id="endless-stats" class="glass" style="
                    position: fixed;
                    top: 170px;
                    left: 20px;
                    border: 1px solid #ff00ff;
                    border-radius: var(--radius-md);
                    padding: 10px 15px;
                    color: #ff00ff;
                    z-index: 100;
                    font-family: 'Orbitron', monospace;
                    font-size: 0.9em;
                ">
                    BEST: <span style="color: #fff;">WAVE ${this.bestWave}</span>
                </div>
            `;
        }

        // Insert UI
        const container = document.createElement('div');
        container.id = 'mode-ui-container';
        container.innerHTML = uiHTML;
        document.body.appendChild(container);
    }

    // Update UI elements (call in game loop)
    updateUI(deltaTime) {
        if (this.currentMode === GAME_MODES.SPEEDRUN) {
            const elapsedTime = (Date.now() - this.startTime) / 1000;
            const minutes = Math.floor(elapsedTime / 60);
            const seconds = Math.floor(elapsedTime % 60);
            const timerDisplay = document.getElementById('timer-display');
            if (timerDisplay) {
                timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }

        if (this.currentMode === GAME_MODES.CHALLENGE && this.game.timeLimit) {
            this.game.timeRemaining -= deltaTime;
            if (this.game.timeRemaining <= 0) {
                this.game.gameOver(false);
            }
        }

        if (this.currentMode === GAME_MODES.ENDLESS) {
            if (this.game.wave > this.bestWave) {
                this.bestWave = this.game.wave;
                try {
                    localStorage.setItem('towerdefense_endless_best', this.bestWave.toString());
                } catch (e) {
                    console.warn('Failed to save endless best wave:', e);
                }
                
                const endlessStats = document.getElementById('endless-stats');
                if (endlessStats) {
                    endlessStats.innerHTML = `Best: Wave ${this.bestWave}`;
                }
            }
        }
    }

    // Clean up mode UI
    cleanup() {
        const container = document.getElementById('mode-ui-container');
        if (container) container.remove();
        
        // Fallback for old elements
        const elements = ['mode-indicator', 'speedrun-timer', 'endless-stats'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }
}

// Predefined challenge mode configurations
export const CHALLENGE_PRESETS = {
    NO_BASIC: {
        name: 'No Basic Towers',
        description: 'Arrow towers are disabled',
        restrictedTowers: ['arrow'],
        scoreMultiplier: 1.5
    },
    NO_UPGRADES: {
        name: 'No Upgrades',
        description: 'Towers cannot be upgraded',
        noUpgrades: true,
        scoreMultiplier: 1.8
    },
    BUDGET: {
        name: 'Budget Defense',
        description: 'Start with half gold, earn less',
        limitedGold: true,
        scoreMultiplier: 2.0
    },
    TIME_ATTACK: {
        name: 'Time Attack',
        description: 'Complete in 5 minutes',
        timeLimit: 300,
        scoreMultiplier: 2.5
    },
    HARDCORE: {
        name: 'Hardcore',
        description: 'No pause, limited gold, no upgrades',
        noUpgrades: true,
        limitedGold: true,
        noPause: true,
        scoreMultiplier: 3.0
    }
};
