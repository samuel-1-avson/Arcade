/**
 * Asteroids - Game Modes System
 * Classic, Story, Survival, Time Attack, Zen, and Challenge modes
 */

// Game Mode Definitions
import { ICONS } from './AsteroidsIcons.js';

export const GAME_MODES = {
    CLASSIC: {
        id: 'classic',
        name: 'Classic',
        icon: ICONS.CLASSIC || ICONS.MENU,
        description: 'The original Asteroids experience. Survive as long as you can!',
        unlocked: true,
        settings: {
            lives: 3,
            infiniteWaves: true,
            ufoEnabled: true,
            powerUpsEnabled: true,
            scoreMultiplier: 1.0
        }
    },
    STORY: {
        id: 'story',
        name: 'Story',
        icon: ICONS.STORY || ICONS.MENU,
        description: 'Journey through 5 worlds with 50 levels and epic boss battles.',
        unlocked: true,
        settings: {
            lives: 3,
            infiniteWaves: false,
            ufoEnabled: true,
            powerUpsEnabled: true,
            scoreMultiplier: 1.5
        }
    },
    SURVIVAL: {
        id: 'survival',
        name: 'Survival',
        icon: ICONS.SURVIVAL || ICONS.SKULL,
        description: 'One life. Endless waves. How long can you last?',
        unlocked: true,
        settings: {
            lives: 1,
            infiniteWaves: true,
            ufoEnabled: true,
            powerUpsEnabled: true,
            scoreMultiplier: 2.0,
            difficultyRamp: 1.5
        }
    },
    TIME_ATTACK: {
        id: 'time_attack',
        name: 'Time Attack',
        icon: ICONS.TIME_ATTACK || ICONS.CLOCK,
        description: 'Score as high as possible before time runs out!',
        unlocked: true,
        settings: {
            lives: Infinity,
            infiniteWaves: true,
            ufoEnabled: true,
            powerUpsEnabled: true,
            scoreMultiplier: 1.0,
            timeLimit: 180 // 3 minutes default
        }
    },
    ZEN: {
        id: 'zen',
        name: 'Zen',
        icon: ICONS.ZEN || ICONS.MENU,
        description: 'Relaxed gameplay with infinite lives. Just enjoy the space.',
        unlocked: true,
        settings: {
            lives: Infinity,
            infiniteWaves: true,
            ufoEnabled: false,
            powerUpsEnabled: true,
            scoreMultiplier: 0.5,
            slowAsteroids: true,
            ambientMode: true
        }
    },
    CHALLENGE: {
        id: 'challenge',
        name: 'Challenge',
        icon: ICONS.CHALLENGE || ICONS.TROPHY,
        description: 'Daily and weekly challenges with unique objectives.',
        unlocked: true,
        settings: {
            lives: 3,
            infiniteWaves: true,
            ufoEnabled: true,
            powerUpsEnabled: true,
            scoreMultiplier: 2.0
        }
    }
};

// Time Attack Durations
export const TIME_ATTACK_OPTIONS = [
    { duration: 60, name: '1 Minute', icon: ICONS.CLOCK || ICONS.TIME_ATTACK },
    { duration: 180, name: '3 Minutes', icon: ICONS.CLOCK || ICONS.TIME_ATTACK },
    { duration: 300, name: '5 Minutes', icon: ICONS.CLOCK || ICONS.TIME_ATTACK },
    { duration: 600, name: '10 Minutes', icon: ICONS.CLOCK || ICONS.TIME_ATTACK }
];

/**
 * Game Mode Manager
 */
export class GameModeManager {
    constructor(game) {
        this.game = game;
        this.currentMode = null;
        this.modeSettings = {};
        this.timeRemaining = 0;
        this.timeLimit = 0;
        this.survivalStats = {
            highestWave: 0,
            longestTime: 0
        };
        this.loadStats();
    }

    loadStats() {
        try {
            const stats = JSON.parse(localStorage.getItem('asteroids_mode_stats') || '{}');
            this.survivalStats = stats.survival || { highestWave: 0, longestTime: 0 };
        } catch {
            this.survivalStats = { highestWave: 0, longestTime: 0 };
        }
    }

    saveStats() {
        localStorage.setItem('asteroids_mode_stats', JSON.stringify({
            survival: this.survivalStats
        }));
    }

    // Set active mode
    setMode(modeId) {
        const mode = GAME_MODES[modeId.toUpperCase()];
        if (!mode) return false;
        
        this.currentMode = mode;
        this.modeSettings = { ...mode.settings };
        this.game.currentGameMode = modeId; // Keep game state in sync
        
        // Apply mode-specific setup
        this.applyModeSettings();
        
        return true;
    }

    applyModeSettings() {
        const game = this.game;
        const settings = this.modeSettings;
        
        game.lives = settings.lives;
        game.infiniteLives = settings.lives === Infinity;
        game.scoreMultiplier = settings.scoreMultiplier;
        game.ufoEnabled = settings.ufoEnabled;
        game.powerUpsEnabled = settings.powerUpsEnabled;
        
        // Time Attack setup
        if (this.currentMode.id === 'time_attack') {
            this.timeLimit = settings.timeLimit;
            this.timeRemaining = settings.timeLimit;
            this.showTimeAttackTimer();
        }
        
        // Zen mode setup
        if (this.currentMode.id === 'zen') {
            game.asteroidSpeedMultiplier = 0.5;
            game.ambientMode = true;
        }
        
        // Survival mode setup
        if (this.currentMode.id === 'survival') {
            game.difficultyRamp = settings.difficultyRamp;
        }
    }

    // Update (called each frame)
    update(dt) {
        if (!this.currentMode) return;
        
        // Time Attack countdown
        if (this.currentMode.id === 'time_attack') {
            this.timeRemaining -= dt;
            this.updateTimeDisplay();
            
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.onTimeUp();
            }
        }
    }

    // Time Attack methods
    setTimeAttackDuration(seconds) {
        this.modeSettings.timeLimit = seconds;
        this.timeLimit = seconds;
        this.timeRemaining = seconds;
    }

    showTimeAttackTimer() {
        let timer = document.getElementById('time-attack-timer');
        if (!timer) {
            timer = document.createElement('div');
            timer.id = 'time-attack-timer';
            timer.className = 'time-attack-timer';
            document.querySelector('.game-container')?.appendChild(timer);
        }
        timer.style.display = 'block';
        this.updateTimeDisplay();
    }

    updateTimeDisplay() {
        const timer = document.getElementById('time-attack-timer');
        if (!timer) return;
        
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = Math.floor(this.timeRemaining % 60);
        timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Warning when low time
        if (this.timeRemaining <= 30) {
            timer.classList.add('warning');
        }
        if (this.timeRemaining <= 10) {
            timer.classList.add('critical');
        }
    }

    onTimeUp() {
        const timer = document.getElementById('time-attack-timer');
        if (timer) timer.textContent = "TIME'S UP!";
        
        // Show results
        this.showTimeAttackResults();
        this.game.gameOver(true); // Count as win
    }

    showTimeAttackResults() {
        const overlay = document.createElement('div');
        overlay.className = 'time-attack-results';
        overlay.innerHTML = `
            <div class="results-content">
                <h2>⏱️ Time Attack Complete!</h2>
                <div class="results-score">
                    <span class="score-label">Final Score</span>
                    <span class="score-value">${this.game.score.toLocaleString()}</span>
                </div>
                <div class="results-stats">
                    <div class="stat">
                        <span>Asteroids Destroyed</span>
                        <span>${this.game.stats.asteroidsDestroyed}</span>
                    </div>
                    <div class="stat">
                        <span>UFOs Destroyed</span>
                        <span>${this.game.stats.ufosDestroyed}</span>
                    </div>
                    <div class="stat">
                        <span>Accuracy</span>
                        <span>${this.game.stats.accuracy}%</span>
                    </div>
                </div>
                <button class="btn-play-again">Play Again</button>
                <button class="btn-menu">Main Menu</button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        overlay.querySelector('.btn-play-again').onclick = () => {
            overlay.remove();
            this.game.reset();
            this.game.start();
        };
        
        overlay.querySelector('.btn-menu').onclick = () => {
            overlay.remove();
            this.game.showModeMenu();
        };
        
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    // Survival mode tracking
    updateSurvivalStats(wave, timeElapsed) {
        if (wave > this.survivalStats.highestWave) {
            this.survivalStats.highestWave = wave;
        }
        if (timeElapsed > this.survivalStats.longestTime) {
            this.survivalStats.longestTime = timeElapsed;
        }
        this.saveStats();
    }

    // Zen mode features
    getZenBackground() {
        // Returns ambient star field colors that shift slowly
        const time = Date.now() / 5000;
        const r = Math.floor(Math.sin(time) * 20 + 20);
        const g = Math.floor(Math.sin(time + 2) * 20 + 20);
        const b = Math.floor(Math.sin(time + 4) * 40 + 40);
        return `rgb(${r}, ${g}, ${b})`;
    }

    // Mode Selection UI
    openModeMenu() {
        const overlay = document.createElement('div');
        overlay.className = 'mode-menu-overlay';
        
        let menuHTML = `
            <div class="mode-menu">
                <div class="mode-header">
                    <h2>${ICONS.MENU} Select Game Mode</h2>
                    <button class="mode-close">✕</button>
                </div>
                <div class="mode-grid">
        `;

        Object.values(GAME_MODES).forEach(mode => {
            menuHTML += `
                <div class="mode-card ${mode.unlocked ? 'unlocked' : 'locked'}" data-mode="${mode.id}">
                    <div class="mode-icon">${mode.icon}</div>
                    <div class="mode-name">${mode.name}</div>
                    <div class="mode-desc">${mode.description}</div>
                    ${mode.id === 'survival' ? `
                        <div class="mode-stats">
                            Best: Wave ${this.survivalStats.highestWave} | ${this.formatTime(this.survivalStats.longestTime)}
                        </div>
                    ` : ''}
                </div>
            `;
        });

        menuHTML += '</div></div>';
        overlay.innerHTML = menuHTML;
        document.body.appendChild(overlay);

        // Event handlers
        overlay.querySelector('.mode-close').onclick = () => overlay.remove();
        overlay.querySelectorAll('.mode-card.unlocked').forEach(card => {
            card.onclick = () => {
                const modeId = card.dataset.mode;
                overlay.remove();
                
                // Special handling for modes that need sub-selection
                if (modeId === 'time_attack') {
                    this.showTimeAttackOptions();
                } else if (modeId === 'story') {
                    this.game.storyMode.openStoryMenu();
                } else if (modeId === 'challenge') {
                    this.showChallengeMenu();
                } else {
                    this.setMode(modeId);
                    this.game.reset();
                    this.game.start();
                }
            };
        });
        
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    showTimeAttackOptions() {
        const overlay = document.createElement('div');
        overlay.className = 'time-attack-options-overlay';
        
        let optionsHTML = `
            <div class="time-options">
                <h3>${ICONS.CLOCK} Select Duration</h3>
                <div class="time-grid">
        `;

        TIME_ATTACK_OPTIONS.forEach(opt => {
            optionsHTML += `
                <div class="time-option" data-duration="${opt.duration}">
                    <div class="time-icon">${opt.icon}</div>
                    <div class="time-name">${opt.name}</div>
                </div>
            `;
        });

        optionsHTML += '</div><button class="time-back">← Back</button></div>';
        overlay.innerHTML = optionsHTML;
        document.body.appendChild(overlay);

        overlay.querySelector('.time-back').onclick = () => {
            overlay.remove();
        };

        overlay.querySelectorAll('.time-option').forEach(opt => {
            opt.onclick = () => {
                const duration = parseInt(opt.dataset.duration);
                overlay.remove();
                this.setMode('time_attack');
                this.setTimeAttackDuration(duration);
                this.game.reset();
                this.game.start();
            };
        });
        
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    showChallengeMenu() {
        const achievements = this.game.achievements;
        const daily = achievements.dailyChallenge;
        const weekly = achievements.weeklyChallenge;

        const overlay = document.createElement('div');
        overlay.className = 'challenge-menu-overlay';
        overlay.innerHTML = `
            <div class="challenge-menu">
                <h3>🏆 Challenges</h3>
                
                <div class="challenge-section">
                    <h4>${ICONS.CALENDAR} Daily Challenge</h4>
                    <div class="challenge-card ${daily?.completed ? 'completed' : ''}">
                        <div class="challenge-desc">${daily?.desc || 'No challenge available'}</div>
                        <div class="challenge-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${daily ? (daily.progress / daily.target * 100) : 0}%"></div>
                            </div>
                            <span>${daily?.progress || 0}/${daily?.target || 0}</span>
                        </div>
                        <div class="challenge-reward">Reward: +${daily?.reward || 0} XP</div>
                    </div>
                </div>
                
                <div class="challenge-section">
                    <h4>${ICONS.CALENDAR} Weekly Challenge</h4>
                    <div class="challenge-card ${weekly?.completed ? 'completed' : ''}">
                        <div class="challenge-name">${weekly?.name || 'No challenge'}</div>
                        <div class="challenge-desc">${weekly?.desc || ''}</div>
                        <div class="challenge-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${weekly ? (weekly.progress / weekly.target * 100) : 0}%"></div>
                            </div>
                            <span>${weekly?.progress || 0}/${weekly?.target || 0}</span>
                        </div>
                        <div class="challenge-reward">Reward: +${weekly?.reward || 0} XP</div>
                    </div>
                </div>
                
                <button class="challenge-play">Start Challenge Run</button>
                <button class="challenge-back">← Back</button>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('.challenge-back').onclick = () => {
            overlay.remove();
        };

        overlay.querySelector('.challenge-play').onclick = () => {
            overlay.remove();
            this.setMode('challenge');
            this.game.reset();
            this.game.start();
        };
        
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}
