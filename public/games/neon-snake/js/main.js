/**
 * Neon Snake Arena - Main Game Controller
 * Orchestrates all game systems and manages game loop
 */

class NeonSnakeGame {
  constructor() {
    // State
    this.state = gameState;
    
    // Systems
    this.snake = null;
    this.food = null;
    this.powerUps = null;
    this.particles = null;
    this.input = null;
    this.renderer = null;
    this.audio = null;
    
    // Game loop
    this.lastTime = 0;
    this.accumulator = 0;
    this.isRunning = false;
    this.animationId = null;
    
    // Auto-save
    this.lastSaveTime = 0;
    
    // Bind methods
    this.gameLoop = this.gameLoop.bind(this);
    this.handleGameOver = this.handleGameOver.bind(this);
    this.handleFoodEaten = this.handleFoodEaten.bind(this);
    this.handlePowerUpCollect = this.handlePowerUpCollect.bind(this);
    
    // Menu
    this.menuOptions = ['Classic', 'Time Attack', 'Endless'];
    this.selectedOption = 0;
    this.inMenu = true;
  }
  
  /**
   * Initialize game
   */
  init() {
    console.log('[NeonSnake] Initializing...');
    
    // Get canvas
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      console.error('[NeonSnake] Canvas not found!');
      return;
    }
    
    // Initialize systems
    this.snake = new Snake(this.state);
    this.food = new FoodSystem(this.state);
    this.powerUps = new PowerUpSystem(this.state);
    this.particles = new ParticleSystem();
    this.input = new InputSystem(this.state);
    this.renderer = new Renderer(canvas, this.state);
    this.audio = new AudioSystem();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize audio on first interaction
    const initAudio = () => {
      this.audio.init();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    
    // Notify hub
    if (window.ArcadeHub) {
      ArcadeHub.notifyReady();
    }
    
    // Start loop
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
    
    console.log('[NeonSnake] Initialized successfully');
  }
  
  setupEventListeners() {
    // Game state events
    this.state.on('gameStart', () => {
      this.startGame();
    });
    
    this.state.on('gameOver', (data) => {
      this.handleGameOver(data);
    });
    
    this.state.on('foodEaten', (data) => {
      this.handleFoodEaten(data);
    });
    
    this.state.on('powerUpCollect', (data) => {
      this.handlePowerUpCollect(data);
    });
    
    this.state.on('newHighScore', () => {
      this.audio.play('highscore');
    });
    
    this.state.on('timeUp', () => {
      this.state.setStatus('gameOver');
    });
    
    // Input events
    this.state.on('inputDirection', () => {
      this.audio.play('move');
    });
    
    // Menu navigation
    window.addEventListener('keydown', (e) => {
      if (!this.inMenu) return;
      
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this.selectedOption = (this.selectedOption - 1 + this.menuOptions.length) % this.menuOptions.length;
        e.preventDefault();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.selectedOption = (this.selectedOption + 1) % this.menuOptions.length;
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === ' ') {
        this.selectMode(this.menuOptions[this.selectedOption]);
        e.preventDefault();
      }
    });
  }
  
  /**
   * Start a new game
   */
  startGame() {
    console.log('[NeonSnake] Starting game:', this.state.mode);
    
    // Reset state
    this.state.reset();
    
    // Initialize snake in center
    const centerX = Math.floor(GameConfig.CANVAS.GRID_WIDTH / 2);
    const centerY = Math.floor(GameConfig.CANVAS.GRID_HEIGHT / 2);
    this.snake.init(centerX, centerY, 3);
    
    // Clear entities
    this.food.clear();
    this.powerUps.clear();
    this.particles.clear();
    
    // Spawn initial food
    this.food.spawn();
    
    // Set status
    this.state.setStatus('playing');
    this.inMenu = false;
    
    // Start timers
    this.state.startTime = Date.now();
    this.lastSaveTime = Date.now();
  }
  
  /**
   * Select game mode from menu
   */
  selectMode(modeName) {
    const modeMap = {
      'Classic': 'classic',
      'Time Attack': 'timeAttack',
      'Endless': 'endless',
    };
    
    const mode = modeMap[modeName];
    if (mode) {
      this.state.setMode(mode);
      this.state.setStatus('playing');
      this.startGame();
    }
  }
  
  /**
   * Main game loop
   */
  gameLoop(currentTime) {
    if (!this.isRunning) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Update
    this.update(deltaTime);
    
    // Render
    this.render();
    
    // Continue loop
    this.animationId = requestAnimationFrame(this.gameLoop);
  }
  
  /**
   * Update game logic
   */
  update(deltaTime) {
    // Skip updates if in menu
    if (this.inMenu) return;
    
    // Update particles
    this.particles.update(deltaTime);
    
    // Update based on game status
    switch (this.state.status) {
      case 'playing':
        this.updatePlaying(deltaTime);
        break;
      case 'paused':
        // Don't update game logic when paused
        break;
      case 'gameOver':
        // Just update particles for visual effects
        break;
    }
  }
  
  /**
   * Update playing state
   */
  updatePlaying(deltaTime) {
    // Update timer
    this.state.updateTime(deltaTime);
    
    // Accumulate time for snake movement
    this.accumulator += deltaTime;
    
    // Move snake based on speed
    while (this.accumulator >= this.state.speed) {
      this.accumulator -= this.state.speed;
      
      // Move snake
      const collision = this.snake.move();
      
      if (collision) {
        this.handleCollision(collision);
        return;
      }
      
      // Check food collision
      const food = this.food.checkCollision();
      if (food) {
        this.eatFood(food);
      }
      
      // Check power-up collision
      const powerUp = this.powerUps.checkCollision();
      if (powerUp) {
        this.collectPowerUp(powerUp);
      }
    }
    
    // Update food system
    this.food.update(Date.now());
    
    // Update power-ups
    this.powerUps.update(deltaTime);
    
    // Apply magnet effect
    if (this.state.hasPowerUp('magnet')) {
      this.food.applyMagnet();
    }
    
    // Auto-save (every 10 seconds)
    if (Date.now() - this.lastSaveTime > GameConfig.API.AUTO_SAVE_INTERVAL) {
      this.saveSession();
      this.lastSaveTime = Date.now();
    }
  }
  
  /**
   * Handle collision
   */
  handleCollision(type) {
    console.log('[NeonSnake] Collision:', type);
    
    // Visual feedback
    const head = this.state.snake.segments[0];
    const canvasPos = this.renderer.gridToCanvas(head.x, head.y);
    
    this.particles.explode(
      canvasPos.x + GameConfig.CANVAS.CELL_SIZE / 2,
      canvasPos.y + GameConfig.CANVAS.CELL_SIZE / 2,
      type === 'wall' ? '#ff0055' : '#ff8800',
      30
    );
    
    this.state.triggerScreenShake();
    this.state.triggerFlash();
    
    // Audio
    this.audio.play('gameover');
    
    // Game over
    this.state.setStatus('gameOver');
  }
  
  /**
   * Eat food
   */
  eatFood(food) {
    const value = this.food.eat(food);
    
    // Visual effects
    const canvasPos = this.renderer.gridToCanvas(food.x, food.y);
    const centerX = canvasPos.x + GameConfig.CANVAS.CELL_SIZE / 2;
    const centerY = canvasPos.y + GameConfig.CANVAS.CELL_SIZE / 2;
    
    this.particles.explode(centerX, centerY, food.type === 'golden' ? '#ffee00' : '#00ff88', 15);
    this.particles.text(centerX, centerY - 20, `+${value}`, '#ffffff');
    
    // Audio
    this.audio.play('eat', { isGolden: food.type === 'golden' });
    
    // Trigger food eaten event effects
    this.state.emit('foodEaten', { food });
  }
  
  /**
   * Collect power-up
   */
  collectPowerUp(powerUp) {
    const config = this.powerUps.collect(powerUp);
    
    // Visual effects
    const canvasPos = this.renderer.gridToCanvas(powerUp.x, powerUp.y);
    const centerX = canvasPos.x + GameConfig.CANVAS.CELL_SIZE / 2;
    const centerY = canvasPos.y + GameConfig.CANVAS.CELL_SIZE / 2;
    
    this.particles.explode(centerX, centerY, config.color, 20);
    this.particles.text(centerX, centerY - 30, config.name, config.color);
    
    // Audio
    this.audio.play('powerup', { powerUpType: powerUp.type });
    
    // Flash effect
    this.state.triggerFlash(300);
  }
  
  /**
   * Render game
   */
  render() {
    if (this.inMenu) {
      this.renderMenu();
    } else {
      this.renderer.render(this.snake, this.food, this.powerUps, this.particles);
      
      // Render pause overlay
      if (this.state.status === 'paused') {
        this.renderer.drawPause();
      }
      
      // Render game over overlay
      if (this.state.status === 'gameOver') {
        this.renderer.drawGameOver();
      }
    }
  }
  
  /**
   * Render main menu
   */
  renderMenu() {
    this.renderer.drawMenu('NEON SNAKE ARENA', this.menuOptions, this.selectedOption);
  }
  
  /**
   * Handle game over
   */
  handleGameOver(data) {
    console.log('[NeonSnake] Game Over - Score:', data.score);
    
    // Submit score to hub
    if (window.ArcadeHub) {
      ArcadeHub.gameOver(data.score, {
        mode: this.state.mode,
        segments: this.state.snake.segments.length,
        duration: Math.floor(this.state.elapsedTime / 1000),
      });
    }
    
    // Save to localStorage
    this.saveHighScore();
  }
  
  /**
   * Handle food eaten event
   */
  handleFoodEaten(data) {
    // Additional effects can be added here
  }
  
  /**
   * Handle power-up collect event
   */
  handlePowerUpCollect(data) {
    // Additional effects can be added here
  }
  
  /**
   * Save high score
   */
  saveHighScore() {
    this.state.saveHighScore();
  }
  
  /**
   * Save session state (for resume)
   */
  saveSession() {
    // Could implement auto-save to localStorage or API
    // For now, just keep in memory
  }
  
  /**
   * Pause game
   */
  pause() {
    if (this.state.status === 'playing') {
      this.state.setStatus('paused');
    }
  }
  
  /**
   * Resume game
   */
  resume() {
    if (this.state.status === 'paused') {
      this.state.setStatus('playing');
      this.lastTime = performance.now();
    }
  }
  
  /**
   * Restart game
   */
  restart() {
    this.startGame();
  }
  
  /**
   * Exit to menu
   */
  exitToMenu() {
    this.state.reset();
    this.inMenu = true;
    this.selectedOption = 0;
  }
  
  /**
   * Exit game
   */
  exit() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (window.ArcadeHub) {
      ArcadeHub.exitGame();
    }
  }
  
  /**
   * Destroy game instance
   */
  destroy() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.input) {
      this.input.removeEventListeners();
    }
  }
}

// Initialize game when DOM is ready
let game = null;

function initGame() {
  if (game) {
    game.destroy();
  }
  game = new NeonSnakeGame();
  game.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

// Handle visibility change (pause when tab hidden)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game && game.state.status === 'playing') {
    game.pause();
  }
});

// Export for debugging
window.NeonSnakeGame = NeonSnakeGame;
window.gameInstance = () => game;
