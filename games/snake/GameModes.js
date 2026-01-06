/**
 * Snake Game - Game Modes System
 * Handles multiplayer, puzzle, zen, speedrun, and custom game modes
 */

// Puzzle Level Definitions
export const PUZZLE_LEVELS = [
    {
        id: 1,
        name: "First Steps",
        desc: "Collect all food in order",
        goal: { type: 'collect_ordered', items: 5 },
        maxMoves: 30,
        layout: {
            snake: { x: 5, y: 15, direction: 'RIGHT', length: 3 },
            food: [
                { x: 10, y: 15, order: 1 },
                { x: 15, y: 15, order: 2 },
                { x: 20, y: 15, order: 3 },
                { x: 25, y: 15, order: 4 },
                { x: 25, y: 10, order: 5 }
            ],
            obstacles: []
        }
    },
    {
        id: 2,
        name: "The Maze",
        desc: "Navigate through the maze to the exit",
        goal: { type: 'reach_goal', target: { x: 27, y: 27 } },
        maxMoves: 50,
        layout: {
            snake: { x: 2, y: 2, direction: 'RIGHT', length: 3 },
            food: [],
            obstacles: [
                // Outer walls with gaps
                ...Array.from({length: 25}, (_, i) => ({ x: 5, y: i + 2 })).filter((_, i) => i !== 10),
                ...Array.from({length: 25}, (_, i) => ({ x: 10, y: i + 2 })).filter((_, i) => i !== 15),
                ...Array.from({length: 25}, (_, i) => ({ x: 15, y: i + 2 })).filter((_, i) => i !== 5),
                ...Array.from({length: 25}, (_, i) => ({ x: 20, y: i + 2 })).filter((_, i) => i !== 20),
                ...Array.from({length: 25}, (_, i) => ({ x: 25, y: i + 2 })).filter((_, i) => i !== 8)
            ]
        }
    },
    {
        id: 3,
        name: "Snake Tetris",
        desc: "Fill the gaps without hitting walls",
        goal: { type: 'fill_area', tiles: 10 },
        maxMoves: 40,
        layout: {
            snake: { x: 15, y: 15, direction: 'UP', length: 5 },
            food: [],
            obstacles: [
                { x: 10, y: 10 }, { x: 11, y: 10 }, { x: 12, y: 10 },
                { x: 10, y: 20 }, { x: 11, y: 20 }, { x: 12, y: 20 },
                { x: 18, y: 10 }, { x: 19, y: 10 }, { x: 20, y: 10 },
                { x: 18, y: 20 }, { x: 19, y: 20 }, { x: 20, y: 20 }
            ]
        }
    },
    {
        id: 4,
        name: "Timing",
        desc: "Collect food while avoiding moving obstacles",
        goal: { type: 'collect_all', count: 5 },
        maxMoves: 100,
        layout: {
            snake: { x: 15, y: 15, direction: 'RIGHT', length: 3 },
            food: [
                { x: 5, y: 5 }, { x: 25, y: 5 }, { x: 5, y: 25 }, 
                { x: 25, y: 25 }, { x: 15, y: 2 }
            ],
            obstacles: [
                { type: 'moving', x: 3, y: 15, path: [{x:3,y:3}, {x:3,y:27}], speed: 5 },
                { type: 'moving', x: 27, y: 15, path: [{x:27,y:27}, {x:27,y:3}], speed: 5 },
                { type: 'moving', x: 15, y: 3, path: [{x:3,y:3}, {x:27,y:3}], speed: 5 },
                { type: 'moving', x: 15, y: 27, path: [{x:27,y:27}, {x:3,y:27}], speed: 5 }
            ]
        }
    },
    {
        id: 5,
        name: "Portal Puzzle",
        desc: "Use portals to reach impossible locations",
        goal: { type: 'collect_all', count: 3 },
        maxMoves: 30,
        layout: {
            snake: { x: 2, y: 15, direction: 'RIGHT', length: 3 },
            food: [
                { x: 28, y: 15 },
                { x: 15, y: 2 },
                { x: 15, y: 28 }
            ],
            obstacles: [
                // Wall blocking direct path
                ...Array.from({length: 26}, (_, i) => ({ x: 15, y: i + 2 }))
            ],
            portals: [
                { entry: { x: 10, y: 15 }, exit: { x: 20, y: 15 } },
                { entry: { x: 15, y: 10 }, exit: { x: 15, y: 20 } }
            ]
        }
    }
];

// Daily Challenge Generator
export class DailyChallenge {
    constructor() {
        this.seed = this.getTodaysSeed();
        this.challenge = this.generateChallenge();
    }
    
    getTodaysSeed() {
        const now = new Date();
        return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    }
    
    seededRandom() {
        this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
        return (this.seed / 0x7fffffff);
    }
    
    generateChallenge() {
        const types = ['speed_run', 'survival', 'score_attack', 'collection', 'no_powerups'];
        const typeIndex = Math.floor(this.seededRandom() * types.length);
        const type = types[typeIndex];
        
        const mapIndex = Math.floor(this.seededRandom() * 16) + 1;
        
        const challenges = {
            speed_run: {
                name: "Speed Run",
                desc: `Complete level ${mapIndex} as fast as possible`,
                goal: { type: 'complete_level', level: mapIndex },
                scoring: 'time',
                modifiers: ['fast_speed']
            },
            survival: {
                name: "Survival",
                desc: "Survive as long as possible with increasing speed",
                goal: { type: 'survive', duration: 300 },
                scoring: 'time_survived',
                modifiers: ['increasing_speed', 'no_walls']
            },
            score_attack: {
                name: "Score Attack",
                desc: "Get the highest score in 2 minutes",
                goal: { type: 'highest_score', timeLimit: 120 },
                scoring: 'score',
                modifiers: ['bonus_food', 'combo_multiplier']
            },
            collection: {
                name: "Collection",
                desc: "Collect 50 food items without dying",
                goal: { type: 'collect_count', count: 50 },
                scoring: 'time',
                modifiers: ['abundant_food']
            },
            no_powerups: {
                name: "Purist",
                desc: "Reach score 1000 with no power-ups",
                goal: { type: 'reach_score', score: 1000 },
                scoring: 'time',
                modifiers: ['no_powerups']
            }
        };
        
        return {
            ...challenges[type],
            type,
            date: new Date().toDateString(),
            mapIndex
        };
    }
}

// Multiplayer Mode Handler
export class MultiplayerMode {
    constructor(game, playerCount = 2) {
        this.game = game;
        this.playerCount = Math.min(4, Math.max(2, playerCount));
        this.players = [];
        this.scores = [];
        this.alive = [];
        
        // Player colors
        this.colors = ['#00ff88', '#ff4488', '#44aaff', '#ffaa44'];
        
        // Player controls
        this.controls = [
            { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' },
            { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
            { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL' },
            { up: 'Numpad8', down: 'Numpad5', left: 'Numpad4', right: 'Numpad6' }
        ];
    }
    
    initialize() {
        const gridSize = this.game.gridSize;
        const spacing = gridSize / (this.playerCount + 1);
        
        this.players = [];
        this.scores = Array(this.playerCount).fill(0);
        this.alive = Array(this.playerCount).fill(true);
        
        for (let i = 0; i < this.playerCount; i++) {
            const startX = Math.floor(spacing * (i + 1));
            const startY = Math.floor(gridSize / 2);
            
            this.players.push({
                id: i,
                snake: [
                    { x: startX, y: startY },
                    { x: startX - 1, y: startY },
                    { x: startX - 2, y: startY }
                ],
                direction: 'RIGHT',
                nextDirection: 'RIGHT',
                color: this.colors[i],
                score: 0,
                alive: true
            });
        }
    }
    
    handleInput(inputManager) {
        for (let i = 0; i < this.players.length; i++) {
            if (!this.players[i].alive) continue;
            
            const controls = this.controls[i];
            const player = this.players[i];
            
            if (inputManager.isKeyJustPressed(controls.up) && player.direction !== 'DOWN') {
                player.nextDirection = 'UP';
            }
            if (inputManager.isKeyJustPressed(controls.down) && player.direction !== 'UP') {
                player.nextDirection = 'DOWN';
            }
            if (inputManager.isKeyJustPressed(controls.left) && player.direction !== 'RIGHT') {
                player.nextDirection = 'LEFT';
            }
            if (inputManager.isKeyJustPressed(controls.right) && player.direction !== 'LEFT') {
                player.nextDirection = 'RIGHT';
            }
        }
    }
    
    update(dt) {
        // Move all players
        for (const player of this.players) {
            if (!player.alive) continue;
            
            player.direction = player.nextDirection;
            const head = player.snake[0];
            const dir = {
                UP: { x: 0, y: -1 },
                DOWN: { x: 0, y: 1 },
                LEFT: { x: -1, y: 0 },
                RIGHT: { x: 1, y: 0 }
            }[player.direction];
            
            const newHead = {
                x: head.x + dir.x,
                y: head.y + dir.y
            };
            
            // Check collisions
            if (this.checkCollision(player.id, newHead)) {
                player.alive = false;
                this.alive[player.id] = false;
                continue;
            }
            
            player.snake.unshift(newHead);
            
            // Check food
            if (newHead.x === this.game.food.x && newHead.y === this.game.food.y) {
                player.score += 10;
                this.scores[player.id] = player.score;
                this.game.spawnFood();
            } else {
                player.snake.pop();
            }
        }
        
        // Check for winner
        const aliveCount = this.players.filter(p => p.alive).length;
        if (aliveCount <= 1 && this.playerCount > 1) {
            return this.getWinner();
        }
        
        return null;
    }
    
    checkCollision(playerId, position) {
        const gridSize = this.game.gridSize;
        
        // Wall collision
        if (position.x < 0 || position.x >= gridSize || 
            position.y < 0 || position.y >= gridSize) {
            return true;
        }
        
        // Obstacle collision
        for (const obs of this.game.obstacles) {
            if (obs.x === position.x && obs.y === position.y) {
                return true;
            }
        }
        
        // Self and other player collision
        for (const player of this.players) {
            if (!player.alive) continue;
            
            for (const segment of player.snake) {
                if (segment.x === position.x && segment.y === position.y) {
                    // Don't count own tail
                    if (player.id === playerId && 
                        segment === player.snake[player.snake.length - 1]) {
                        continue;
                    }
                    return true;
                }
            }
        }
        
        return false;
    }
    
    getWinner() {
        const alive = this.players.filter(p => p.alive);
        if (alive.length === 1) {
            return alive[0];
        }
        // If all dead, highest score wins
        let highest = this.players[0];
        for (const player of this.players) {
            if (player.score > highest.score) {
                highest = player;
            }
        }
        return highest;
    }
    
    render(ctx, cellSize) {
        for (const player of this.players) {
            if (!player.alive) {
                ctx.globalAlpha = 0.3;
            }
            
            for (let i = 0; i < player.snake.length; i++) {
                const segment = player.snake[i];
                const x = segment.x * cellSize;
                const y = segment.y * cellSize;
                
                ctx.fillStyle = player.color;
                ctx.shadowColor = player.color;
                ctx.shadowBlur = i === 0 ? 10 : 3;
                
                ctx.beginPath();
                ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 4);
                ctx.fill();
            }
            
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }
        
        // Render scores
        ctx.font = 'bold 14px Orbitron, sans-serif';
        for (let i = 0; i < this.players.length; i++) {
            ctx.fillStyle = this.colors[i];
            ctx.fillText(`P${i + 1}: ${this.scores[i]}`, 10 + i * 100, 20);
        }
    }
}

// Zen Mode - No death, relaxing gameplay
export class ZenMode {
    constructor(game) {
        this.game = game;
        this.wrapAround = true;
        this.noDeath = true;
        this.ambientSpawns = true;
    }
    
    applySettings() {
        // Make walls permeable
        this.game.wrapAround = true;
        
        // Disable self-collision
        this.game.activePowerUps.ghost = { remaining: -1, type: { effect: 'ghost' } };
        
        // Slower, more relaxing pace
        this.game.moveInterval = 0.2;
        
        // More food on screen
        this.spawnExtraFood();
    }
    
    spawnExtraFood() {
        // Spawn ambient floating particles/food
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                if (this.game.particleSystem) {
                    const x = Math.random() * this.game.canvas.width;
                    const y = Math.random() * this.game.canvas.height;
                    this.game.particleSystem.emit({
                        x, y,
                        count: 3,
                        color: [0.5, 1, 0.7],
                        life: 5,
                        size: 3,
                        speed: 20
                    });
                }
            }, i * 2000);
        }
    }
}

// Speedrun Mode
export class SpeedrunMode {
    constructor(game) {
        this.game = game;
        this.startTime = 0;
        this.splits = [];
        this.ghostReplay = null;
        this.isRecording = true;
        this.recordedInputs = [];
    }
    
    start() {
        this.startTime = performance.now();
        this.splits = [];
        this.recordedInputs = [];
        this.isRecording = true;
    }
    
    recordInput(direction, timestamp) {
        if (this.isRecording) {
            this.recordedInputs.push({
                direction,
                time: timestamp - this.startTime
            });
        }
    }
    
    addSplit(name) {
        const time = performance.now() - this.startTime;
        this.splits.push({ name, time });
        return time;
    }
    
    finish() {
        const totalTime = performance.now() - this.startTime;
        this.isRecording = false;
        
        // Save as ghost if best time
        const bestTime = localStorage.getItem('snake_speedrun_best');
        if (!bestTime || totalTime < parseFloat(bestTime)) {
            localStorage.setItem('snake_speedrun_best', totalTime.toString());
            localStorage.setItem('snake_speedrun_ghost', JSON.stringify(this.recordedInputs));
        }
        
        return {
            totalTime,
            splits: this.splits,
            isPersonalBest: !bestTime || totalTime < parseFloat(bestTime)
        };
    }
    
    loadGhost() {
        const ghost = localStorage.getItem('snake_speedrun_ghost');
        if (ghost) {
            this.ghostReplay = JSON.parse(ghost);
        }
        return this.ghostReplay;
    }
    
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const remainingMs = Math.floor((ms % 1000) / 10);
        
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs.toString().padStart(2, '0')}`;
    }
    
    renderTimer(ctx) {
        const elapsed = performance.now() - this.startTime;
        
        ctx.font = 'bold 24px monospace';
        ctx.fillStyle = '#00ff88';
        ctx.textAlign = 'right';
        ctx.fillText(this.formatTime(elapsed), ctx.canvas.width - 10, 30);
        
        // Render splits
        ctx.font = '12px monospace';
        let y = 50;
        for (const split of this.splits) {
            ctx.fillText(`${split.name}: ${this.formatTime(split.time)}`, ctx.canvas.width - 10, y);
            y += 15;
        }
    }
}
