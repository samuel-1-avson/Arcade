/**
 * Breakout Game - Game Modes System
 * Classic, Story, Time Attack, Zen, Endless, and Puzzle modes
 */

import { ICONS } from './Icons.js';

// Game Mode Definitions
export const GAME_MODES = {
    CLASSIC: {
        id: 'classic',
        name: 'Classic',
        icon: ICONS.GAMEPAD,
        description: 'Standard breakout gameplay. Clear all bricks!',
        lives: 3,
        scoring: 'normal',
        timer: false
    },
    STORY: {
        id: 'story',
        name: 'Story Mode',
        icon: ICONS.BOOK,
        description: '50 levels across 5 worlds. Defeat bosses!',
        lives: 3,
        scoring: 'normal',
        timer: false,
        hasProgression: true
    },
    TIME_ATTACK: {
        id: 'time_attack',
        name: 'Time Attack',
        icon: ICONS.CLOCK,
        description: 'Clear levels as fast as possible!',
        lives: 1,
        scoring: 'time_bonus',
        timer: true,
        timeLimit: 120 // seconds
    },
    ZEN: {
        id: 'zen',
        name: 'Zen Mode',
        icon: ICONS.ZEN,
        description: 'Relaxing gameplay. Infinite lives, no pressure.',
        lives: Infinity,
        scoring: 'normal',
        timer: false,
        noDeath: true,
        ambientSpawns: true
    },
    ENDLESS: {
        id: 'endless',
        name: 'Endless',
        icon: ICONS.INFINITY,
        description: 'Procedurally generated levels. How far can you go?',
        lives: 3,
        scoring: 'wave_bonus',
        timer: false,
        hasWaves: true
    },
    PUZZLE: {
        id: 'puzzle',
        name: 'Puzzle',
        icon: ICONS.PUZZLE,
        description: 'Strategic challenges with limited shots.',
        lives: Infinity,
        scoring: 'moves_bonus',
        timer: false,
        limitedShots: true
    }
};

// Puzzle Level Definitions
export const PUZZLE_LEVELS = [
    {
        id: 1,
        name: "One Shot Wonder",
        desc: "Clear all bricks in a single launch",
        goal: { type: 'clear_all', maxShots: 1 },
        layout: {
            rows: 2,
            cols: 5,
            bricks: [
                { row: 0, col: 2, type: 'EXPLOSIVE' },
                { row: 0, col: 1, type: 'NORMAL' },
                { row: 0, col: 3, type: 'NORMAL' },
                { row: 1, col: 0, type: 'NORMAL' },
                { row: 1, col: 1, type: 'EXPLOSIVE' },
                { row: 1, col: 2, type: 'NORMAL' },
                { row: 1, col: 3, type: 'EXPLOSIVE' },
                { row: 1, col: 4, type: 'NORMAL' }
            ]
        }
    },
    {
        id: 2,
        name: "Chain Reaction",
        desc: "Use explosives to clear the path",
        goal: { type: 'clear_all', maxShots: 3 },
        layout: {
            rows: 4,
            cols: 8,
            bricks: [
                { row: 0, col: 3, type: 'GOLD' },
                { row: 0, col: 4, type: 'GOLD' },
                { row: 1, col: 2, type: 'INDESTRUCTIBLE' },
                { row: 1, col: 5, type: 'INDESTRUCTIBLE' },
                { row: 2, col: 3, type: 'EXPLOSIVE' },
                { row: 2, col: 4, type: 'EXPLOSIVE' },
                { row: 3, col: 0, type: 'NORMAL' },
                { row: 3, col: 1, type: 'NORMAL' },
                { row: 3, col: 2, type: 'NORMAL' },
                { row: 3, col: 3, type: 'NORMAL' },
                { row: 3, col: 4, type: 'NORMAL' },
                { row: 3, col: 5, type: 'NORMAL' },
                { row: 3, col: 6, type: 'NORMAL' },
                { row: 3, col: 7, type: 'NORMAL' }
            ]
        }
    },
    {
        id: 3,
        name: "Ghost Hunt",
        desc: "Time your shots to hit the phasing bricks",
        goal: { type: 'clear_all', maxShots: 5 },
        layout: {
            rows: 3,
            cols: 5,
            bricks: [
                { row: 0, col: 0, type: 'GHOST' },
                { row: 0, col: 2, type: 'GHOST' },
                { row: 0, col: 4, type: 'GHOST' },
                { row: 1, col: 1, type: 'NORMAL' },
                { row: 1, col: 3, type: 'NORMAL' },
                { row: 2, col: 0, type: 'GHOST' },
                { row: 2, col: 2, type: 'GHOST' },
                { row: 2, col: 4, type: 'GHOST' }
            ]
        }
    },
    {
        id: 4,
        name: "Moving Target",
        desc: "Hit all moving bricks",
        goal: { type: 'clear_all', maxShots: 4 },
        layout: {
            rows: 4,
            cols: 10,
            bricks: [
                { row: 0, col: 2, type: 'MOVING' },
                { row: 0, col: 7, type: 'MOVING' },
                { row: 1, col: 4, type: 'MOVING' },
                { row: 1, col: 5, type: 'MOVING' },
                { row: 2, col: 1, type: 'INDESTRUCTIBLE' },
                { row: 2, col: 8, type: 'INDESTRUCTIBLE' },
                { row: 3, col: 3, type: 'MOVING' },
                { row: 3, col: 6, type: 'MOVING' }
            ]
        }
    },
    {
        id: 5,
        name: "Precision Required",
        desc: "Navigate through indestructible walls",
        goal: { type: 'clear_all', maxShots: 3 },
        layout: {
            rows: 5,
            cols: 10,
            bricks: [
                { row: 0, col: 4, type: 'GOLD' },
                { row: 0, col: 5, type: 'GOLD' },
                { row: 1, col: 3, type: 'INDESTRUCTIBLE' },
                { row: 1, col: 6, type: 'INDESTRUCTIBLE' },
                { row: 2, col: 2, type: 'INDESTRUCTIBLE' },
                { row: 2, col: 4, type: 'NORMAL' },
                { row: 2, col: 5, type: 'NORMAL' },
                { row: 2, col: 7, type: 'INDESTRUCTIBLE' },
                { row: 3, col: 1, type: 'INDESTRUCTIBLE' },
                { row: 3, col: 8, type: 'INDESTRUCTIBLE' },
                { row: 4, col: 0, type: 'INDESTRUCTIBLE' },
                { row: 4, col: 9, type: 'INDESTRUCTIBLE' }
            ]
        }
    }
];

/**
 * TimeAttackMode - Fast-paced timed gameplay
 */
export class TimeAttackMode {
    constructor(game) {
        this.game = game;
        this.timeLimit = 120;
        this.timeRemaining = this.timeLimit;
        this.isRunning = false;
        this.bestTime = this.loadBestTime();
    }
    
    loadBestTime() {
        return parseFloat(localStorage.getItem('breakout_time_attack_best')) || Infinity;
    }
    
    saveBestTime(time) {
        if (time < this.bestTime) {
            this.bestTime = time;
            localStorage.setItem('breakout_time_attack_best', time.toString());
        }
    }
    
    start() {
        this.timeRemaining = this.timeLimit;
        this.isRunning = true;
    }
    
    update(dt) {
        if (!this.isRunning) return;
        
        this.timeRemaining -= dt;
        
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.isRunning = false;
            this.game.gameOver(false);
        }
    }
    
    complete() {
        this.isRunning = false;
        const timeTaken = this.timeLimit - this.timeRemaining;
        this.saveBestTime(timeTaken);
        
        // Calculate time bonus score
        const timeBonus = Math.floor(this.timeRemaining * 10);
        this.game.addScore(timeBonus);
        
        return { timeTaken, timeBonus, bestTime: this.bestTime };
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    
    render(ctx) {
        if (!this.isRunning && this.timeRemaining === this.timeLimit) return;
        
        const timeColor = this.timeRemaining < 30 ? '#ff0000' : 
                          this.timeRemaining < 60 ? '#ffcc00' : '#00ff88';
        
        ctx.save();
        ctx.fillStyle = timeColor;
        ctx.font = 'bold 24px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = timeColor;
        ctx.shadowBlur = 10;
        ctx.fillText(this.formatTime(this.timeRemaining), ctx.canvas.width / 2, 30);
        ctx.restore();
    }
}

/**
 * ZenMode - Relaxing infinite gameplay
 */
export class ZenMode {
    constructor(game) {
        this.game = game;
        this.noDeath = true;
        this.ambientSpawns = true;
        this.relaxedPhysics = true;
        this.spawnTimer = 0;
        this.spawnInterval = 15; // seconds between ambient spawns
    }
    
    applySettings() {
        this.game.lives = Infinity;
        this.game.config.ballSpeed *= 0.8; // Slower ball
    }
    
    update(dt) {
        // Wrap ball around screen instead of losing
        for (const ball of this.game.balls) {
            if (ball.y > this.game.canvas.height + ball.radius) {
                ball.y = this.game.canvas.height - 100;
                ball.vy = -Math.abs(ball.vy);
            }
        }
        
        // Ambient power-up spawns
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnAmbientPowerup();
        }
    }
    
    spawnAmbientPowerup() {
        if (this.game.powerupManager) {
            const x = Math.random() * (this.game.canvas.width - 60) + 30;
            this.game.powerupManager.spawn(x, -30);
        }
    }
    
    regenerateBricks() {
        // Slowly regenerate bricks for endless play
        if (this.game.bricks.filter(b => b.alive).length < 10) {
            this.game.createBricks();
        }
    }
}

/**
 * EndlessMode - Procedurally generated waves
 */
export class EndlessMode {
    constructor(game) {
        this.game = game;
        this.wave = 0;
        this.totalBricksCleared = 0;
        this.bestWave = this.loadBestWave();
    }
    
    loadBestWave() {
        return parseInt(localStorage.getItem('breakout_endless_best')) || 0;
    }
    
    saveBestWave() {
        if (this.wave > this.bestWave) {
            this.bestWave = this.wave;
            localStorage.setItem('breakout_endless_best', this.wave.toString());
        }
    }
    
    start() {
        this.wave = 0;
        this.totalBricksCleared = 0;
        this.nextWave();
    }
    
    nextWave() {
        this.wave++;
        
        // Wave bonus
        const waveBonus = this.wave * 50;
        this.game.addScore(waveBonus);
        
        // Generate bricks for this wave
        this.generateWaveBricks();
        
        // Show wave notification
        this.showWaveNotification();
        
        // Increase difficulty
        this.game.config.ballSpeed = Math.min(500, 350 + this.wave * 10);
        
        // Bonus life every 5 waves
        if (this.wave % 5 === 0 && this.wave > 0) {
            this.game.lives++;
            this.game.updateLivesDisplay();
        }
    }
    
    generateWaveBricks() {
        const rows = Math.min(8, 3 + Math.floor(this.wave / 3));
        const cols = 10;
        
        // Determine brick type distribution based on wave
        const types = ['NORMAL'];
        if (this.wave >= 2) types.push('STRONG');
        if (this.wave >= 4) types.push('REINFORCED');
        if (this.wave >= 3) types.push('MOVING');
        if (this.wave >= 5) types.push('EXPLOSIVE');
        if (this.wave >= 7) types.push('ICE');
        if (this.wave >= 10) types.push('REGENERATING');
        if (this.wave >= 8) types.push('GHOST');
        if (this.wave >= 6) types.push('GOLD');
        if (this.wave >= 12) types.push('INDESTRUCTIBLE');
        
        // Pass brick generation info to game
        this.game.generateEndlessWave(rows, cols, types, this.wave);
    }
    
    showWaveNotification() {
        const notification = document.createElement('div');
        notification.className = 'wave-notification';
        
        notification.innerHTML = `
            <div class="wave-label">WAVE</div>
            <div class="wave-value">${this.wave}</div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }
    
    onWaveCleared() {
        this.saveBestWave();
        this.nextWave();
    }
    
    render(ctx) {
        ctx.save();
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 16px Orbitron, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`Wave: ${this.wave}`, ctx.canvas.width - 10, 25);
        ctx.fillStyle = '#888';
        ctx.font = '12px Orbitron, sans-serif';
        ctx.fillText(`Best: ${this.bestWave}`, ctx.canvas.width - 10, 45);
        ctx.restore();
    }
}

/**
 * PuzzleMode - Strategic limited-shot challenges
 */
export class PuzzleMode {
    constructor(game) {
        this.game = game;
        this.currentPuzzle = 0;
        this.shotsRemaining = 0;
        this.totalShots = 0;
        this.puzzlesCompleted = this.loadProgress();
    }
    
    loadProgress() {
        const saved = localStorage.getItem('breakout_puzzle_progress');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveProgress() {
        localStorage.setItem('breakout_puzzle_progress', JSON.stringify(this.puzzlesCompleted));
    }
    
    start(puzzleIndex = 0) {
        this.currentPuzzle = puzzleIndex;
        this.loadPuzzle(puzzleIndex);
    }
    
    loadPuzzle(index) {
        if (index >= PUZZLE_LEVELS.length) {
            this.showPuzzleComplete();
            return;
        }
        
        const puzzle = PUZZLE_LEVELS[index];
        this.shotsRemaining = puzzle.goal.maxShots;
        this.totalShots = puzzle.goal.maxShots;
        
        // Pass puzzle to game
        this.game.loadPuzzleLevel(puzzle);
        
        // Show puzzle info
        this.showPuzzleInfo(puzzle);
    }
    
    useShot() {
        this.shotsRemaining--;
        
        if (this.shotsRemaining < 0) {
            // Out of shots - puzzle failed
            this.onPuzzleFailed();
        }
    }
    
    checkCompletion() {
        const puzzle = PUZZLE_LEVELS[this.currentPuzzle];
        const aliveBricks = this.game.bricks.filter(b => b.alive && b.typeId !== 'INDESTRUCTIBLE').length;
        
        if (aliveBricks === 0) {
            this.onPuzzleCleared();
            return true;
        }
        
        if (this.shotsRemaining <= 0 && this.game.balls.length === 0) {
            this.onPuzzleFailed();
            return false;
        }
        
        return null; // Still in progress
    }
    
    onPuzzleCleared() {
        const puzzleId = PUZZLE_LEVELS[this.currentPuzzle].id;
        
        if (!this.puzzlesCompleted.includes(puzzleId)) {
            this.puzzlesCompleted.push(puzzleId);
            this.saveProgress();
        }
        
        // Calculate stars based on shots remaining
        const stars = this.shotsRemaining >= this.totalShots - 1 ? 3 :
                      this.shotsRemaining >= 1 ? 2 : 1;
        
        this.showPuzzleResult(true, stars);
    }
    
    onPuzzleFailed() {
        this.showPuzzleResult(false, 0);
    }
    
    showPuzzleInfo(puzzle) {
        const overlay = document.createElement('div');
        overlay.id = 'puzzle-info';
        overlay.className = 'fullscreen-overlay';
        
        overlay.innerHTML = `
            <div class="puzzle-info-container">
                <div class="puzzle-info-header">PUZZLE ${puzzle.id}</div>
                <h2 class="puzzle-info-title">${puzzle.name}</h2>
                <p class="puzzle-info-desc">${puzzle.desc}</p>
                <div class="puzzle-info-stats">
                    Max Shots: ${puzzle.goal.maxShots}
                </div>
                <button id="start-puzzle" class="btn btn-primary" style="margin-top: 20px; border-radius: 20px; color: #000; font-weight: bold; background: #ffcc00; border-color: #ffcc00;">START</button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        document.getElementById('start-puzzle').addEventListener('click', () => {
            overlay.remove();
            this.game.start();
        });
    }
    
    showPuzzleResult(success, stars) {
        const puzzle = PUZZLE_LEVELS[this.currentPuzzle];
        
        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-overlay';
        
        // Generate stars
        let starsHTML = '';
        if (success) {
            for (let i = 0; i < 3; i++) {
                starsHTML += `<span style="color: ${i < stars ? '#ffd700' : '#444'}; margin: 0 5px;">${ICONS.STAR}</span>`;
            }
        } else {
            starsHTML = `<span style="color: #ff4444;">${ICONS.SKULL}</span>`;
        }
        
        overlay.innerHTML = `
            <h1 style="color: ${success ? '#00ff88' : '#ff4444'}; font-size: 2rem; font-family: 'VT323', monospace; text-transform: uppercase;">
                ${success ? 'PUZZLE COMPLETE!' : 'PUZZLE FAILED'}
            </h1>
            <div style="font-size: 3rem; margin: 20px 0; display: flex; align-items: center; justify-content: center;">${starsHTML}</div>
            <p style="color: #fff; font-family: 'VT323', monospace; font-size: 1.5rem;">${puzzle.name}</p>
            <div style="margin-top: 30px; display: flex; gap: 15px;">
                <button id="retry-puzzle" class="btn btn-secondary">RETRY</button>
                ${success && this.currentPuzzle < PUZZLE_LEVELS.length - 1 ? `
                    <button id="next-puzzle" class="btn btn-primary" style="border-radius: 20px; color: #000; font-weight: bold;">NEXT PUZZLE</button>
                ` : ''}
            </div>
        `;
        document.body.appendChild(overlay);
        
        document.getElementById('retry-puzzle')?.addEventListener('click', () => {
            overlay.remove();
            this.loadPuzzle(this.currentPuzzle);
        });
        
        document.getElementById('next-puzzle')?.addEventListener('click', () => {
            overlay.remove();
            this.start(this.currentPuzzle + 1);
        });
    }
    
    showPuzzleComplete() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle, #1a1a00 0%, #000 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            z-index: 1000;
        `;
        overlay.innerHTML = `
            <div style="width: 80px; height: 80px; color: #ffcc00; margin-bottom: 20px;">${ICONS.PUZZLE}</div>
            <h1 style="color: #ffcc00; margin: 20px 0; font-family: 'VT323', monospace; font-size: 3rem;">ALL PUZZLES COMPLETE!</h1>
            <p style="color: #888; font-family: 'VT323', monospace; font-size: 1.5rem;">You've mastered all ${PUZZLE_LEVELS.length} puzzles!</p>
            <button class="btn btn-primary close-overlay-btn" style="margin-top: 30px; font-weight: bold; color: #000; background: #ffcc00; border-color: #ffcc00;">RETURN TO MENU</button>
        `;
        document.body.appendChild(overlay);
        
        // Add event listener for close button (security fix: no inline onclick)
        overlay.querySelector('.close-overlay-btn').addEventListener('click', () => overlay.remove());
    }
    
    render(ctx) {
        ctx.save();
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 16px Orbitron, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Shots: ${this.shotsRemaining}/${this.totalShots}`, 10, 25);
        ctx.restore();
    }
    
    showPuzzleSelect() {
        const overlay = document.createElement('div');
        overlay.id = 'puzzle-select';
        overlay.className = 'fullscreen-overlay';
        
        let html = `
            <div style="width: 100%; max-width: 900px; display: flex; flex-direction: column; height: 90vh;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h1 style="color: #ffcc00; font-family: 'VT323', monospace;">${ICONS.PUZZLE} Puzzle Mode</h1>
                    <button id="close-puzzle-select" class="btn btn-ghost">✕ Close</button>
                </div>
                <div class="grid-select-container" style="flex: 1;">
        `;
        
        for (let i = 0; i < PUZZLE_LEVELS.length; i++) {
            const puzzle = PUZZLE_LEVELS[i];
            const completed = this.puzzlesCompleted.includes(puzzle.id);
            
            html += `
                <div class="puzzle-select-card" data-index="${i}" style="${completed ? 'border-color: #ffcc00;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #ffcc00; font-size: 1.2rem;">#${puzzle.id}</span>
                        ${completed ? `<span style="color: #ffd700; width: 20px;">${ICONS.STAR}</span>` : ''}
                    </div>
                    <div class="puzzle-preview">${ICONS.PUZZLE}</div>
                    <h3 style="color: #fff; margin: 8px 0; font-size: 1rem; text-align: center;">${puzzle.name}</h3>
                    <div style="color: #00ccff; font-size: 0.8rem; margin-top: 8px; text-align: center;">
                        Shots: ${puzzle.goal.maxShots}
                    </div>
                </div>
            `;
        }
        
        html += '</div></div>';
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        
        // Event listeners
        document.getElementById('close-puzzle-select').addEventListener('click', () => overlay.remove());
        
        overlay.querySelectorAll('.puzzle-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                overlay.remove();
                this.start(index);
            });
            card.addEventListener('mouseenter', () => card.style.transform = 'scale(1.03)');
            card.addEventListener('mouseleave', () => card.style.transform = 'scale(1)');
        });
    }
}

/**
 * GameModeManager - Manages game mode switching and state
 */
export class GameModeManager {
    constructor(game) {
        this.game = game;
        this.currentMode = GAME_MODES.CLASSIC;
        this.modeHandler = null;
    }
    
    setMode(modeId) {
        const mode = GAME_MODES[modeId.toUpperCase()];
        if (!mode) {
            console.error('Unknown game mode:', modeId);
            return false;
        }
        
        this.currentMode = mode;
        
        // Create appropriate handler
        switch (mode.id) {
            case 'time_attack':
                this.modeHandler = new TimeAttackMode(this.game);
                break;
            case 'zen':
                this.modeHandler = new ZenMode(this.game);
                break;
            case 'endless':
                this.modeHandler = new EndlessMode(this.game);
                break;
            case 'puzzle':
                this.modeHandler = new PuzzleMode(this.game);
                break;
            default:
                this.modeHandler = null;
        }
        
        // Apply mode settings
        this.game.lives = mode.lives === Infinity ? 99 : mode.lives;
        
        return true;
    }
    
    start() {
        if (this.modeHandler?.start) {
            this.modeHandler.start();
        }
        if (this.modeHandler?.applySettings) {
            this.modeHandler.applySettings();
        }
    }
    
    update(dt) {
        if (this.modeHandler?.update) {
            this.modeHandler.update(dt);
        }
    }
    
    render(ctx) {
        if (this.modeHandler?.render) {
            this.modeHandler.render(ctx);
        }
    }
    
    onLevelComplete() {
        if (this.currentMode.id === 'time_attack' && this.modeHandler) {
            return this.modeHandler.complete();
        }
        if (this.currentMode.id === 'endless' && this.modeHandler) {
            this.modeHandler.onWaveCleared();
        }
        if (this.currentMode.id === 'puzzle' && this.modeHandler) {
            return this.modeHandler.checkCompletion();
        }
        return null;
    }
    
    showModeSelect() {
        const overlay = document.createElement('div');
        overlay.id = 'mode-select';
        overlay.className = 'fullscreen-overlay';
        
        let html = `
            <div style="width: 100%; max-width: 900px; display: flex; flex-direction: column; height: 90vh;">
                <h1 style="color: #e8eaed; font-family: 'VT323', monospace; text-align: center; font-size: 3rem; margin-bottom: 30px; text-transform: uppercase;">Select Game Mode</h1>
                <div class="grid-select-container" style="flex: 1;">
        `;
        
        const modes = Object.values(GAME_MODES);
        for (let i = 0; i < modes.length; i++) {
            const mode = modes[i];
            
            html += `
                <div class="select-card" data-mode="${mode.id}" style="
                    border-color: rgba(255,255,255,0.1); 
                    min-height: 250px; 
                    display: flex; 
                    flex-direction: column;
                    justify-content: space-between;
                ">
                    <div>
                        <div class="card-thumbnail" style="font-size: 3rem; margin-bottom: 10px;">${mode.icon}</div>
                        <h3 style="color: #e8eaed; margin: 0 0 8px 0; font-size: 1.5rem; text-align: center;">${mode.name}</h3>
                        <p style="color: #6b7280; font-size: 0.9rem; margin: 0 0 12px 0; text-align: center; line-height: 1.4;">${mode.description}</p>
                    </div>
                    <div style="display: flex; justify-content: center; margin-top: 15px;">
                        <span class="btn btn-secondary" style="font-size: 0.8rem; padding: 5px 10px;">PLAY</span>
                    </div>
                </div>
            `;
        }
        
        html += `</div>
            <div style="display: flex; justify-content: center; margin-top: 20px;">
                <button id="close-mode-select" class="btn btn-ghost">Cancel</button>
            </div>
        </div>`;
        
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        
        // Event listeners
        overlay.querySelectorAll('.select-card').forEach(card => {
            card.addEventListener('click', () => {
                const modeId = card.dataset.mode;
                if (this.setMode(modeId)) {
                    overlay.remove();
                    this.game.start();
                }
            });
            card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-5px)');
            card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0)');
        });
        
        document.getElementById('close-mode-select').addEventListener('click', () => {
            overlay.remove();
        });
    }
}
