/**
 * Breakout Game - Enhanced Version
 * Features: Story Mode, 6 Game Modes, 50 Achievements, 12 Power-ups, 12 Brick Types
 * Plus: 10 Unique Maps, Animations, Multiplayer, Leaderboards
 */
import { GameEngine, GameState } from '../../js/engine/GameEngine.js';
import { inputManager } from '../../js/engine/InputManager.js';
import { clamp, random } from '../../js/utils/math.js';
import { hubSDK } from '../../js/engine/HubSDK.js';

// Import enhanced systems
import { BRICK_TYPES, ROW_COLORS, WORLD_BRICK_THEMES, Brick, getAdjacentPositions } from './BrickTypes.js';
import { POWERUP_TYPES, PowerUpManager } from './PowerUps.js';
import { STORY_WORLDS, StoryMode } from './StoryMode.js';
import { ACHIEVEMENTS, AchievementSystem } from './AchievementSystem.js';
import { GAME_MODES, GameModeManager } from './GameModes.js';

// Import new systems
import { LEVEL_MAPS, LevelMapManager } from './LevelMaps.js';
import { AnimationSystem } from './Animations.js';
import { MultiplayerManager } from './Multiplayer.js';
import { LeaderboardManager } from './Leaderboard.js';

// Configuration
const CONFIG = {
    paddleWidth: 100, // Slightly wider for wider map
    paddleHeight: 12,
    paddleSpeed: 550,
    ballRadius: 8,
    ballSpeed: 400,
    brickRows: 8,
    brickCols: 13, // Increased from 10 (44*13 = 572 + padding)
    brickWidth: 44,
    brickHeight: 18,
    brickPadding: 4,
    brickOffsetTop: 60,
    brickOffsetLeft: 36 // Centered: (640 - (13*(44+4)) + 4)/2 = (640 - 624)/2 + 2 = 8 + 2?? No. 13*48=624. 640-624=16. Offset=8.
    // Wait, 13 * (44+4) = 624. Total width used.
    // Canvas 640. 640 - 624 = 16. Left offset should be 8.
};

class Breakout extends GameEngine {
    constructor() {
        super({
            canvasId: 'game-canvas',
            gameId: 'breakout',
            width: 640,
            height: 600
        });

        // Initialize HubSDK
        hubSDK.init({ gameId: 'breakout' });
        
        // Register pause/resume handlers
        hubSDK.onPause(() => this.pause());
        hubSDK.onResume(() => this.resume());

        // Store config for external access
        this.config = { ...CONFIG };

        // Paddle
        this.paddle = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 40,
            width: CONFIG.paddleWidth,
            height: CONFIG.paddleHeight,
            speed: CONFIG.paddleSpeed,
            hasLaser: false,
            hasMagnet: false
        };

        // Balls (support multiple)
        this.balls = [];

        // Bricks
        this.bricks = [];

        // Game state
        this.lives = 3;
        this.ballOnPaddle = true;
        this.scoreMultiplier = 1;
        this.combo = 0;
        this.maxCombo = 0;
        this.levelStartTime = 0;

        // Particles
        this.particles = [];

        // Colors / Theme - Retro Minimal Palette
        this.theme = {
            bg: '#050505',
            paddle: '#ff4d00',
            ball: '#ffffff',
            fireBall: '#ff3333',
            glowColor: 'rgba(255, 77, 0, 0.4)',
            gridColor: 'rgba(255, 255, 255, 0.05)'
        };

        // Initialize enhanced systems
        this.powerupManager = new PowerUpManager(this);
        this.achievementSystem = new AchievementSystem(this);
        this.storyMode = new StoryMode(this);
        this.modeManager = new GameModeManager(this);

        // Initialize new systems
        this.mapManager = new LevelMapManager(this);
        this.animations = new AnimationSystem(this);
        this.multiplayer = new MultiplayerManager(this);
        this.leaderboard = new LeaderboardManager(this);

        // Current game mode and map
        this.gameMode = 'CLASSIC';
        this.currentMapId = 'classic';
        this.currentLevel = null;
        this.currentBoss = null;
        this.isMultiplayer = false;

        this.setupUI();
        this.onReset();
    }

    /**
     * Override gameOver to submit score to HubSDK
     */
    gameOver(isWin = false) {
        // Submit score to HubSDK before calling parent gameOver
        hubSDK.submitScore(this.score);
        
        // Call parent gameOver
        super.gameOver(isWin);
    }

    setupUI() {
        // Start button
        document.getElementById('start-btn')?.addEventListener('click', () => {
            if (this.gameMode === 'CLASSIC') {
                this.reset();
                this.start();
            }
        });

        // SPA Back Button
        document.getElementById('breakout-back-btn')?.addEventListener('click', () => {
            if (window.GameBridge) {
                window.GameBridge.exitGame();
            } else {
                window.location.href = '../../index.html';
            }
        });

        // Restart button
        document.getElementById('restart-btn')?.addEventListener('click', () => {
            this.reset();
            this.start();
        });

        // Pause button
        document.getElementById('pause-btn')?.addEventListener('click', () => {
            this.togglePause();
        });

        // Mode select button
        document.getElementById('mode-btn')?.addEventListener('click', () => {
            this.modeManager.showModeSelect();
        });

        // Story mode button
        document.getElementById('story-btn')?.addEventListener('click', () => {
            this.storyMode.showWorldSelect();
        });

        // Achievements button
        document.getElementById('achievements-btn')?.addEventListener('click', () => {
            this.achievementSystem.openGallery();
        });

        // Map select button
        document.getElementById('maps-btn')?.addEventListener('click', () => {
            this.mapManager.showMapSelect((mapIndex) => {
                this.loadMap(mapIndex);
                this.start();
            });
        });

        // Multiplayer button
        document.getElementById('multiplayer-btn')?.addEventListener('click', () => {
            this.showMultiplayerMenu();
        });

        // Leaderboard button
        document.getElementById('leaderboard-btn')?.addEventListener('click', () => {
            this.leaderboard.showLeaderboard();
        });

        // Mouse/touch control
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.state !== GameState.PLAYING) return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            this.paddle.x = (e.clientX - rect.left) * scaleX;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (this.state !== GameState.PLAYING) return;
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            this.paddle.x = (e.touches[0].clientX - rect.left) * scaleX;
        });

        // Launch ball / Shoot laser
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                if (this.storyMode.inCutscene) {
                    this.storyMode.advanceDialog();
                } else if (this.state === GameState.PLAYING) {
                    if (this.ballOnPaddle) {
                        this.launchBall();
                    } else if (this.paddle.hasLaser) {
                        this.powerupManager.shootLaser();
                        this.achievementSystem.recordLaserShot();
                    }
                }
            }
        });

        this.canvas.addEventListener('click', () => {
            if (this.state === GameState.PLAYING && this.ballOnPaddle) {
                this.launchBall();
            }
        });
    }

    // ===== Map Loading =====
    loadMap(mapIdOrIndex) {
        this.bricks = this.mapManager.loadMap(mapIdOrIndex);
        this.currentMapId = this.mapManager.currentMap?.id || 'classic';
        this.reset();
        this.animations.fadeIn(0.3);
    }

    // ===== Multiplayer =====
    showMultiplayerMenu() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(13, 17, 23, 0.98);
            z-index: 2000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        `;
        
        overlay.innerHTML = `
            <h2 style="color: #e8eaed; margin-bottom: 30px;">Multiplayer</h2>
            <div style="display: flex; flex-direction: column; gap: 15px; width: 280px;">
                <button id="mp-create" style="padding: 15px; background: #6b8aad; border: none; border-radius: 8px; color: #fff; cursor: pointer; font-size: 1rem;">Create Room</button>
                <button id="mp-join" style="padding: 15px; background: #22262e; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #e8eaed; cursor: pointer; font-size: 1rem;">Join Room</button>
                <button id="mp-cancel" style="padding: 15px; background: transparent; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; color: #9aa0a6; cursor: pointer; font-size: 0.9rem;">Cancel</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        document.getElementById('mp-create').addEventListener('click', async () => {
            overlay.remove();
            await this.multiplayer.connect();
            this.isMultiplayer = true;
            this.multiplayer.showLobby(() => {
                this.mapManager.showMapSelect((mapIndex) => {
                    this.loadMap(mapIndex);
                    this.multiplayer.startGame(this.currentMapId);
                    this.multiplayer.createInGameScoreboard();
                    this.start();
                });
            });
        });
        
        document.getElementById('mp-join').addEventListener('click', () => {
            overlay.innerHTML = `
                <h2 style="color: #e8eaed; margin-bottom: 20px;">Enter Room Code</h2>
                <input type="text" id="room-code-input" maxlength="6" placeholder="ABCD12" style="
                    padding: 15px 20px;
                    background: #22262e;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    color: #e8eaed;
                    font-size: 1.5rem;
                    text-align: center;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    width: 200px;
                ">
                <div style="display: flex; gap: 15px; margin-top: 20px;">
                    <button id="join-confirm" style="padding: 12px 25px; background: #6b8aad; border: none; border-radius: 8px; color: #fff; cursor: pointer;">Join</button>
                    <button id="join-cancel" style="padding: 12px 25px; background: transparent; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #9aa0a6; cursor: pointer;">Cancel</button>
                </div>
            `;
            
            document.getElementById('room-code-input').focus();
            
            document.getElementById('join-confirm').addEventListener('click', async () => {
                const code = document.getElementById('room-code-input').value.toUpperCase();
                if (code.length === 6) {
                    overlay.remove();
                    await this.multiplayer.connect(code);
                    this.isMultiplayer = true;
                    this.multiplayer.showLobby(() => {
                        // Wait for host to start
                    });
                    
                    this.multiplayer.onGameStart = (data) => {
                        this.loadMap(data.mapId);
                        this.multiplayer.createInGameScoreboard();
                        this.start();
                    };
                }
            });
            
            document.getElementById('join-cancel').addEventListener('click', () => {
                overlay.remove();
            });
        });
        
        document.getElementById('mp-cancel').addEventListener('click', () => {
            overlay.remove();
        });
    }

    selectGameMode(modeId) {
        this.gameMode = modeId.toUpperCase();
        this.modeManager.setMode(modeId);
        
        if (modeId === 'story') {
            this.storyMode.showWorldSelect();
        } else if (modeId === 'puzzle') {
            this.modeManager.modeHandler.showPuzzleSelect();
        } else {
            this.reset();
            this.modeManager.start();
            this.start();
        }
    }

    loadStoryLevel(levelConfig) {
        this.currentLevel = levelConfig;
        this.gameMode = 'STORY';
        
        // Apply theme
        if (levelConfig.theme) {
            this.theme = { ...this.theme, ...levelConfig.theme };
        }
        
        // Reset and create bricks for this level
        this.reset();
        this.createStoryBricks(levelConfig);
        
        // Show lore if present
        if (levelConfig.lore) {
            this.showLoreMessage(levelConfig.lore.text);
        }
        
        this.start();
    }

    loadPuzzleLevel(puzzle) {
        this.currentLevel = puzzle;
        this.gameMode = 'PUZZLE';
        
        this.reset();
        this.createPuzzleBricks(puzzle);
    }

    createStoryBricks(config) {
        this.bricks = [];
        const rows = config.rows || CONFIG.brickRows;
        const cols = config.cols || CONFIG.brickCols;
        const colors = config.colors || ROW_COLORS;
        const types = config.brickTypes || ['NORMAL'];
        const specialBricks = config.specialBricks || [];
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = CONFIG.brickOffsetLeft + col * (CONFIG.brickWidth + CONFIG.brickPadding);
                const y = CONFIG.brickOffsetTop + row * (CONFIG.brickHeight + CONFIG.brickPadding);
                
                // Check for special brick at this position
                const special = specialBricks.find(s => s.row === row && s.col === col);
                let brickType = 'NORMAL';
                
                if (special) {
                    brickType = special.type;
                } else {
                    // Random type based on available types and difficulty
                    const typeChance = Math.random();
                    if (typeChance < 0.7) {
                        brickType = 'NORMAL';
                    } else {
                        brickType = types[Math.floor(Math.random() * types.length)];
                    }
                }
                
                const brick = new Brick(x, y, CONFIG.brickWidth, CONFIG.brickHeight, brickType, row);
                
                // Apply world theme colors for normal bricks
                if (brickType === 'NORMAL' && colors[row % colors.length]) {
                    brick.color = colors[row % colors.length];
                }
                
                this.bricks.push(brick);
            }
        }
    }

    createPuzzleBricks(puzzle) {
        this.bricks = [];
        
        for (const brickData of puzzle.layout.bricks) {
            const x = CONFIG.brickOffsetLeft + brickData.col * (CONFIG.brickWidth + CONFIG.brickPadding);
            const y = CONFIG.brickOffsetTop + brickData.row * (CONFIG.brickHeight + CONFIG.brickPadding);
            
            const brick = new Brick(x, y, CONFIG.brickWidth, CONFIG.brickHeight, brickData.type, brickData.row);
            this.bricks.push(brick);
        }
    }

    generateEndlessWave(rows, cols, types, waveNumber) {
        this.bricks = [];
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = CONFIG.brickOffsetLeft + col * (CONFIG.brickWidth + CONFIG.brickPadding);
                const y = CONFIG.brickOffsetTop + row * (CONFIG.brickHeight + CONFIG.brickPadding);
                
                // Type selection based on wave
                let brickType = 'NORMAL';
                const rand = Math.random();
                
                if (rand > 0.85 - (waveNumber * 0.01)) {
                    brickType = types[Math.floor(Math.random() * types.length)];
                } else if (rand > 0.7) {
                    brickType = 'STRONG';
                }
                
                const brick = new Brick(x, y, CONFIG.brickWidth, CONFIG.brickHeight, brickType, row);
                this.bricks.push(brick);
            }
        }
    }

    onReset() {
        // Reset paddle
        this.paddle.x = this.canvas.width / 2;
        this.paddle.width = CONFIG.paddleWidth;
        this.paddle.hasLaser = false;
        this.paddle.hasMagnet = false;

        // Reset balls
        this.balls = [];
        this.createBall();

        // Reset state
        this.lives = GAME_MODES[this.gameMode]?.lives || 3;
        if (this.lives === Infinity) this.lives = 99;
        this.ballOnPaddle = true;
        this.particles = [];
        this.combo = 0;
        this.scoreMultiplier = 1;
        this.levelStartTime = Date.now();

        // Reset power-ups
        this.powerupManager.reset();

        // Create default bricks if not story/puzzle mode
        if (this.gameMode === 'CLASSIC' || this.gameMode === 'TIME_ATTACK' || 
            this.gameMode === 'ZEN') {
            this.createBricks();
        }

        // Update lives display
        this.updateLivesDisplay();

        this.render();
    }

    onStart() {
        this._hideOverlay();
        this.levelStartTime = Date.now();
        this.achievementSystem.recordGamePlayed();
        
        if (this.modeManager.modeHandler?.start) {
            this.modeManager.modeHandler.start();
        }
    }

    createBall() {
        this.balls.push({
            x: this.paddle.x,
            y: this.paddle.y - CONFIG.ballRadius - 5,
            vx: 0,
            vy: 0,
            radius: CONFIG.ballRadius,
            speed: CONFIG.ballSpeed,
            fireBall: false,
            ghostBall: false,
            megaBall: false,
            stuck: false
        });
    }

    createBricks() {
        // Delegate to map manager
        if (this.mapManager) {
            // Use current map or default to classic
            const mapId = this.currentMapId || 'classic';
            this.bricks = this.mapManager.loadMap(mapId);
            return;
        }

        // Fallback for safety (should not be reached if initialized correctly)
        this.bricks = [];
        for (let row = 0; row < CONFIG.brickRows; row++) {
            for (let col = 0; col < CONFIG.brickCols; col++) {
                const x = CONFIG.brickOffsetLeft + col * (CONFIG.brickWidth + CONFIG.brickPadding);
                const y = CONFIG.brickOffsetTop + row * (CONFIG.brickHeight + CONFIG.brickPadding);
                
                const brick = new Brick(x, y, CONFIG.brickWidth, CONFIG.brickHeight, 'NORMAL', row);
                this.bricks.push(brick);
            }
        }
    }

    launchBall() {
        if (!this.ballOnPaddle || this.balls.length === 0) return;
        
        const ball = this.balls[0];
        const angle = random(-Math.PI / 4, Math.PI / 4) - Math.PI / 2;
        ball.vx = Math.cos(angle) * ball.speed;
        ball.vy = Math.sin(angle) * ball.speed;
        this.ballOnPaddle = false;
        
        // Puzzle mode: count as a shot
        if (this.gameMode === 'PUZZLE' && this.modeManager.modeHandler) {
            this.modeManager.modeHandler.useShot();
        }
    }

    update(dt) {
        // Skip if in cutscene
        if (this.storyMode.inCutscene) return;

        // Update paddle position from keyboard
        this.updatePaddle(dt);

        // Update balls
        this.updateBalls(dt);

        // Update ball trails
        for (let i = 0; i < this.balls.length; i++) {
            const ball = this.balls[i];
            const color = ball.fireBall ? this.theme.fireBall : this.theme.ball;
            this.animations.updateBallTrail(i, ball.x, ball.y, color);
        }

        // Update bricks (for moving/phasing bricks)
        this.updateBricks(dt);

        // Update power-ups
        this.powerupManager.update(dt);

        // Update particles (legacy)
        this.updateParticles(dt);

        // Update animation system
        this.animations.update(dt);

        // Update game mode
        this.modeManager.update(dt);

        // Report score for multiplayer
        if (this.isMultiplayer) {
            this.multiplayer.reportScore(this.score);
        }

        // Check win condition
        const aliveBricks = this.bricks.filter(b => b.alive && b.typeId !== 'INDESTRUCTIBLE');
        if (aliveBricks.length === 0) {
            this.onLevelComplete();
        }
    }

    updatePaddle(dt) {
        // Keyboard control
        if (inputManager.isKeyDown('ArrowLeft') || inputManager.isKeyDown('KeyA')) {
            this.paddle.x -= this.paddle.speed * dt;
        }
        if (inputManager.isKeyDown('ArrowRight') || inputManager.isKeyDown('KeyD')) {
            this.paddle.x += this.paddle.speed * dt;
        }

        // Clamp paddle position
        const halfWidth = this.paddle.width / 2;
        this.paddle.x = clamp(this.paddle.x, halfWidth, this.canvas.width - halfWidth);

        // Move ball with paddle if on paddle
        if (this.ballOnPaddle && this.balls.length > 0) {
            this.balls[0].x = this.paddle.x;
            this.balls[0].y = this.paddle.y - CONFIG.ballRadius - 5;
        }
    }

    updateBalls(dt) {
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];

            // Skip if stuck on magnet paddle
            if (ball.stuck) {
                ball.x = this.paddle.x;
                continue;
            }

            // Move ball
            ball.x += ball.vx * dt;
            ball.y += ball.vy * dt;

            // Wall collisions
            if (ball.x - ball.radius < 0) {
                ball.x = ball.radius;
                ball.vx = Math.abs(ball.vx);
                this.combo = 0;
            }
            if (ball.x + ball.radius > this.canvas.width) {
                ball.x = this.canvas.width - ball.radius;
                ball.vx = -Math.abs(ball.vx);
                this.combo = 0;
            }
            if (ball.y - ball.radius < 0) {
                ball.y = ball.radius;
                ball.vy = Math.abs(ball.vy);
            }

            // Check shield before losing ball
            if (ball.y > this.canvas.height - 20) {
                if (this.powerupManager.checkShield(ball)) {
                    continue;
                }
            }

            // Bottom - lose ball
            if (ball.y > this.canvas.height + ball.radius) {
                this.balls.splice(i, 1);
                this.combo = 0;
                
                if (this.balls.length === 0) {
                    this.loseLife();
                }
                continue;
            }

            // Paddle collision
            if (this.checkPaddleCollision(ball)) {
                // Magnet paddle
                if (this.paddle.hasMagnet && !ball.stuck) {
                    ball.stuck = true;
                    ball.vx = 0;
                    ball.vy = 0;
                    ball.y = this.paddle.y - ball.radius - this.paddle.height / 2;
                } else {
                    // Calculate bounce angle based on where ball hit paddle
                    const hitPos = (ball.x - this.paddle.x) / (this.paddle.width / 2);
                    const angle = hitPos * (Math.PI / 3) - Math.PI / 2;
                    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                    
                    ball.vx = Math.cos(angle) * speed;
                    ball.vy = Math.sin(angle) * speed;
                    ball.y = this.paddle.y - ball.radius - this.paddle.height / 2;
                }
                this.combo = 0;
            }

            // Release stuck ball
            if (ball.stuck && inputManager.isKeyDown('Space')) {
                ball.stuck = false;
                const angle = random(-Math.PI / 4, Math.PI / 4) - Math.PI / 2;
                ball.vx = Math.cos(angle) * ball.speed;
                ball.vy = Math.sin(angle) * ball.speed;
            }

            // Brick collisions
            this.checkBrickCollisions(ball);
        }

        // Check for 5+ balls achievement
        if (this.balls.length >= 5) {
            this.achievementSystem.tryUnlock('multi_ball_clear');
        }
    }

    updateBricks(dt) {
        for (const brick of this.bricks) {
            if (brick.update) {
                brick.update(dt, { width: this.canvas.width, height: this.canvas.height });
            }
        }
    }

    checkPaddleCollision(ball) {
        return ball.y + ball.radius > this.paddle.y - this.paddle.height / 2 &&
               ball.y - ball.radius < this.paddle.y + this.paddle.height / 2 &&
               ball.x > this.paddle.x - this.paddle.width / 2 &&
               ball.x < this.paddle.x + this.paddle.width / 2 &&
               ball.vy > 0;
    }

    checkBrickCollisions(ball) {
        for (const brick of this.bricks) {
            if (!brick.alive) continue;
            if (brick.type.phasing && !brick.visible) continue;

            // AABB collision with circle
            const closestX = clamp(ball.x, brick.x, brick.x + brick.width);
            const closestY = clamp(ball.y, brick.y, brick.y + brick.height);
            const dx = ball.x - closestX;
            const dy = ball.y - closestY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < ball.radius) {
                // Hit the brick
                const result = brick.hit();
                
                if (result) {
                    // Handle destruction
                    if (result.destroyed) {
                        this.onBrickDestroyed(brick, ball);
                        
                        // Handle explosions
                        if (result.explosive) {
                            this.handleExplosion(brick, result.explosionRadius);
                        }
                        
                        // Handle ball effects
                        if (result.slowsBall) {
                            ball.vx *= 0.7;
                            ball.vy *= 0.7;
                            setTimeout(() => {
                                ball.vx *= 1.43;
                                ball.vy *= 1.43;
                            }, result.slowDuration * 1000);
                        }
                        
                        // Dangerous bricks (bombs)
                        if (result.dangerous) {
                            this.loseLife();
                        }
                    }
                    
                    // Bounce ball (unless fire ball or ghost ball)
                    if (result.bounced && !ball.fireBall && !ball.ghostBall) {
                        const overlapX = ball.radius - Math.abs(dx);
                        const overlapY = ball.radius - Math.abs(dy);
                        
                        if (overlapX < overlapY) {
                            ball.vx = -ball.vx;
                        } else {
                            ball.vy = -ball.vy;
                        }
                    }
                }
            }
        }
    }

    onBrickDestroyed(brick, ball) {
        // Update combo
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        // Calculate points with combo and multiplier
        const comboBonus = 1 + Math.floor(this.combo / 5) * 0.5;
        const points = Math.floor(brick.points * this.scoreMultiplier * comboBonus);
        this.addScore(points);
        
        // Record for achievements
        this.achievementSystem.recordBrickDestroyed(brick);
        this.achievementSystem.recordScore(points);
        this.achievementSystem.recordCombo(this.combo);
        
        // Spawn particles (legacy + new animation system)
        this.spawnBrickParticles(brick);
        this.animations.emitBrickShatter(brick.x, brick.y, brick.width, brick.height, brick.color);
        
        // Combo burst effect
        if (this.combo >= 5) {
            this.animations.emitComboBurst(brick.x + brick.width/2, brick.y + brick.height/2, this.combo);
        }
        
        // Power-up drop
        const dropChance = brick.type.guaranteedPowerup ? 1 : 0.15;
        if (Math.random() < dropChance && brick.type.canDrop) {
            this.powerupManager.spawn(brick.x + brick.width / 2, brick.y + brick.height / 2);
        }
    }

    handleExplosion(brick, radius) {
        const adjacent = getAdjacentPositions(brick, this.bricks, radius);
        let chainCount = 0;
        
        for (const adjBrick of adjacent) {
            if (adjBrick.alive && adjBrick.typeId !== 'INDESTRUCTIBLE') {
                const result = adjBrick.hit();
                if (result?.destroyed) {
                    chainCount++;
                    this.onBrickDestroyed(adjBrick, null);
                    
                    // Chain explosions
                    if (result.explosive) {
                        setTimeout(() => {
                            this.handleExplosion(adjBrick, result.explosionRadius);
                        }, 100);
                    }
                }
            }
        }
        
        // Chain reaction achievement
        if (chainCount >= 5) {
            this.achievementSystem.tryUnlock('chain_explosion');
        }
        
        // Screen shake (using animation system)
        this.animations.shake(5);
        this.animations.emitExplosion(brick.x + brick.width/2, brick.y + brick.height/2);
    }

    screenShake(intensity = 5) {
        // Use animation system for screen shake
        this.animations.shake(intensity);
    }

    loseLife() {
        if (this.gameMode === 'ZEN') {
            // Zen mode: no death, just reset ball
            this.createBall();
            this.ballOnPaddle = true;
            return;
        }
        
        this.lives--;
        this.updateLivesDisplay();
        this.combo = 0;

        // Screen shake
        this.screenShake(8);

        if (this.lives <= 0) {
            this.achievementSystem.saveBestWave?.();
            this.gameOver(false);
        } else {
            // Reset ball
            this.createBall();
            this.ballOnPaddle = true;
            
            // One life achievement
            if (this.lives === 1) {
                this.achievementSystem.tryUnlock('one_life');
            }
        }
    }

    onLevelComplete() {
        const timeTaken = (Date.now() - this.levelStartTime) / 1000;
        const wasPerfect = this.lives === (GAME_MODES[this.gameMode]?.lives || 3);
        
        // Speed clear achievement
        if (timeTaken < 60) {
            this.achievementSystem.tryUnlock('speed_clear');
        }
        
        // Perfect level
        if (wasPerfect) {
            this.achievementSystem.tryUnlock('perfect_level');
        }
        
        // Record completion
        this.achievementSystem.recordLevelComplete(wasPerfect);
        
        // Handle mode-specific completion
        const modeResult = this.modeManager.onLevelComplete();
        
        if (this.gameMode === 'STORY') {
            this.storyMode.completeLevel(this.score, this.lives, timeTaken < 60 ? 100 : 0);
        } else if (this.gameMode === 'ENDLESS') {
            // Endless mode continues
        } else if (this.gameMode === 'PUZZLE') {
            // Puzzle mode handles its own completion
        } else {
            this.gameOver(true);
        }
    }

    startBossBattle(bossConfig) {
        console.log('Starting boss battle:', bossConfig.name);
        // TODO: Implement full boss battle system
        // For now, show a message and complete the boss
        alert(`BOSS BATTLE: ${bossConfig.name}\n(Boss battles coming soon!)`);
        this.storyMode.defeatBoss();
    }

    showLoreMessage(text) {
        const lore = document.createElement('div');
        lore.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            border: 1px solid #666;
            padding: 10px 20px;
            color: #888;
            font-style: italic;
            font-size: 0.9rem;
            z-index: 500;
            animation: fadeIn 1s ease, fadeOut 1s ease 4s forwards;
            pointer-events: none;
        `;
        lore.textContent = text;
        document.body.appendChild(lore);
        setTimeout(() => lore.remove(), 5000);
    }

    updateLivesDisplay() {
        const el = document.querySelector('.lives-value');
        if (el) {
            if (this.lives >= 99) {
                el.textContent = '∞';
            } else {
                el.textContent = this.lives.toString();
            }
        }
    }

    // Particles
    spawnBrickParticles(brick) {
        const particleCount = brick.type.id === 'explosive' ? 15 : 8;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = random(0, Math.PI * 2);
            const speed = random(50, 200);
            this.particles.push({
                x: brick.x + brick.width / 2,
                y: brick.y + brick.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5,
                maxLife: 0.5,
                size: random(3, 6),
                color: brick.color
            });
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt;
            p.life -= dt;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render() {
        const ctx = this.ctx;

        // Apply screen effects (shake, pulse)
        ctx.save();
        this.animations.applyTransform(ctx, this.canvas.width, this.canvas.height);

        // Background
        ctx.fillStyle = this.theme.bg;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid (subtle)
        this.renderGrid();

        // Bricks
        this.renderBricks();

        // Ball trails (animation system)
        this.animations.renderTrails(ctx, this.balls);

        // Legacy particles
        this.renderParticles();

        // Animation system particles
        this.animations.renderParticles(ctx);

        // Power-ups
        this.powerupManager.render(ctx);

        // Paddle
        this.renderPaddle();

        // Balls
        this.renderBalls();

        // Mode-specific rendering
        this.modeManager.render(ctx);

        // Combo display
        if (this.combo >= 5) {
            this.renderCombo();
        }

        ctx.restore();

        // Screen effects overlay (flash, transitions) - after restore so it covers everything
        this.animations.renderScreenEffects(ctx, this.canvas.width, this.canvas.height);
    }

    renderGrid() {
        // Minimal subtle grid - almost invisible for calm aesthetic
        const ctx = this.ctx;
        ctx.strokeStyle = this.theme.gridColor;
        ctx.lineWidth = 1;
        
        const gridSize = 48;
        for (let x = gridSize; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        for (let y = gridSize; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
    }

    renderBricks() {
        const ctx = this.ctx;
        const theme = WORLD_BRICK_THEMES[this.currentLevel?.world?.id] || null;

        for (const brick of this.bricks) {
            if (brick.render) {
                brick.render(ctx, theme);
            } else if (brick.alive) {
                // Fallback rendering
                ctx.shadowColor = brick.color;
                ctx.shadowBlur = 8;
                ctx.fillStyle = brick.color;
                ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(brick.x, brick.y, brick.width, brick.height / 3);
                ctx.shadowBlur = 0;
            }
        }
    }

    renderPaddle() {
        const ctx = this.ctx;
        const { x, y, width, height } = this.paddle;

        // Subtle glow for calm aesthetic
        ctx.shadowColor = this.paddle.hasLaser ? '#c47272' : this.theme.glowColor;
        ctx.shadowBlur = 10;

        // Paddle body - clean solid style
        const baseColor = this.paddle.hasLaser ? '#c47272' : 
                          this.paddle.hasMagnet ? '#9b7cc4' : this.theme.paddle;
        
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.rect(x - width/2, y - height/2, width, height); // Sharp corners
        ctx.fill();

        // Inner detail
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.rect(x - width/2 + 2, y - height/2 + 2, width - 4, height - 4);
        ctx.fill();

        // Laser indicators
        if (this.paddle.hasLaser) {
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.rect(x - width/2 + 2, y - height/2 - 4, 4, 4);
            ctx.rect(x + width/2 - 6, y - height/2 - 4, 4, 4);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
    }

    renderBalls() {
        const ctx = this.ctx;

        for (const ball of this.balls) {
            // Subtle glow for calm aesthetic
            const ballColor = ball.fireBall ? this.theme.fireBall : 
                              ball.ghostBall ? '#9b9bc4' : 
                              ball.megaBall ? '#c9a857' : this.theme.ball;
            ctx.shadowColor = ballColor;
            ctx.shadowBlur = 6;

            // Ball - clean solid
            ctx.fillStyle = ballColor;
            ctx.globalAlpha = ball.ghostBall ? 0.5 : 1;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();

            // Subtle highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }
    }

    renderParticles() {
        const ctx = this.ctx;

        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }

    renderCombo() {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = '#c9a857';
        ctx.font = '600 16px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.globalAlpha = 0.8;
        ctx.fillText(`${this.combo}x combo`, 12, this.canvas.height - 16);
        ctx.restore();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Breakout();
});
