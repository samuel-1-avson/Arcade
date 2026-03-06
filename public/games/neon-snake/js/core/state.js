/**
 * Neon Snake Arena - State Management
 * Centralized game state with event emission
 */

class GameState {
  constructor() {
    this.status = 'menu';
    this.mode = 'classic';
    this.score = 0;
    this.highScore = 0;
    this.sessionHighScore = 0;
    this.level = 1;
    this.speed = GameConfig.TIMING.BASE_SPEED;
    this.baseSpeed = GameConfig.TIMING.BASE_SPEED;
    
    this.snake = {
      segments: [],
      direction: { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
      growing: 0,
    };
    
    this.food = [];
    this.foodEaten = 0;
    this.goldenFoodEaten = 0;
    
    this.activePowerUps = new Map();
    this.powerUpsCollected = 0;
    
    this.startTime = 0;
    this.elapsedTime = 0;
    this.timeRemaining = 0;
    this.lastMoveTime = 0;
    
    this.stats = {
      totalMoves: 0,
      distanceTraveled: 0,
      wallsPassed: 0,
      nearMisses: 0,
      maxSegments: 0,
    };
    
    this.effects = {
      screenShake: 0,
      flash: 0,
      pulse: 0,
    };
    
    this.listeners = new Map();
    this.loadHighScore();
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
  
  setStatus(status) {
    const oldStatus = this.status;
    this.status = status;
    this.emit('statusChange', { oldStatus, newStatus: status });
    
    if (status === 'playing') {
      this.emit('gameStart', { mode: this.mode });
    } else if (status === 'gameOver') {
      this.emit('gameOver', {
        score: this.score,
        stats: { ...this.stats },
        isHighScore: this.score > this.sessionHighScore && this.score > 0,
      });
    } else if (status === 'paused') {
      this.emit('gamePause', {});
    }
  }
  
  setMode(mode) {
    if (GameConfig.MODES[mode.toUpperCase()]) {
      this.mode = mode;
      const modeConfig = GameConfig.MODES[mode.toUpperCase()];
      this.timeRemaining = modeConfig.timeLimit;
      this.emit('modeChange', { mode, config: modeConfig });
    }
  }
  
  addScore(points) {
    if (this.hasPowerUp('scoreMultiplier')) {
      points *= GameConfig.POWERUPS.SCORE_MULTIPLIER.multiplier;
    }
    
    this.score += Math.floor(points);
    
    if (this.score > this.sessionHighScore) {
      this.sessionHighScore = this.score;
    }
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
      this.emit('newHighScore', { score: this.highScore });
    }
    
    this.emit('scoreChange', { score: this.score, added: points });
  }
  
  reset() {
    this.status = 'menu';
    this.score = 0;
    this.level = 1;
    this.speed = this.baseSpeed;
    this.snake = {
      segments: [],
      direction: { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
      growing: 0,
    };
    this.food = [];
    this.foodEaten = 0;
    this.goldenFoodEaten = 0;
    this.activePowerUps.clear();
    this.powerUpsCollected = 0;
    this.elapsedTime = 0;
    this.timeRemaining = GameConfig.MODES[this.mode.toUpperCase()]?.timeLimit || 0;
    this.lastMoveTime = 0;
    this.stats = {
      totalMoves: 0,
      distanceTraveled: 0,
      wallsPassed: 0,
      nearMisses: 0,
      maxSegments: 0,
    };
    this.effects = {
      screenShake: 0,
      flash: 0,
      pulse: 0,
    };
  }
  
  initSnake(startPos, length = 3) {
    this.snake.segments = [];
    for (let i = 0; i < length; i++) {
      this.snake.segments.push({
        x: startPos.x - i,
        y: startPos.y,
      });
    }
    this.snake.direction = { x: 1, y: 0 };
    this.snake.nextDirection = { x: 1, y: 0 };
    this.updateMaxSegments();
  }
  
  growSnake(amount = 1) {
    this.snake.growing += amount;
  }
  
  shrinkSnake(amount = 1) {
    const removeCount = Math.min(amount, this.snake.segments.length - 3);
    for (let i = 0; i < removeCount; i++) {
      this.snake.segments.pop();
    }
    this.updateMaxSegments();
  }
  
  updateMaxSegments() {
    if (this.snake.segments.length > this.stats.maxSegments) {
      this.stats.maxSegments = this.snake.segments.length;
    }
  }
  
  addPowerUp(powerUpId) {
    const config = Object.values(GameConfig.POWERUPS).find(p => p.id === powerUpId);
    if (!config) return;
    
    const now = Date.now();
    const expiresAt = config.duration ? now + config.duration : null;
    
    this.activePowerUps.set(powerUpId, {
      id: powerUpId,
      startedAt: now,
      expiresAt: expiresAt,
      config: config,
    });
    
    this.powerUpsCollected++;
    
    if (powerUpId === 'shrink') {
      this.shrinkSnake(config.segmentsRemoved);
      this.activePowerUps.delete(powerUpId);
    }
    
    this.emit('powerUpActivated', { powerUp: config });
    
    if (config.duration && powerUpId !== 'shrink') {
      setTimeout(() => {
        this.removePowerUp(powerUpId);
      }, config.duration);
    }
  }
  
  removePowerUp(powerUpId) {
    if (this.activePowerUps.has(powerUpId)) {
      const powerUp = this.activePowerUps.get(powerUpId);
      this.activePowerUps.delete(powerUpId);
      this.emit('powerUpExpired', { powerUp: powerUp.config });
    }
  }
  
  hasPowerUp(powerUpId) {
    return this.activePowerUps.has(powerUpId);
  }
  
  getActivePowerUps() {
    return Array.from(this.activePowerUps.values());
  }
  
  updateSpeed() {
    const newSpeed = Math.max(
      GameConfig.TIMING.MIN_SPEED,
      this.baseSpeed - (this.foodEaten * GameConfig.TIMING.SPEED_INCREMENT)
    );
    
    if (this.hasPowerUp('speedBoost')) {
      this.speed = newSpeed / GameConfig.TIMING.SPEED_BOOST_MULTIPLIER;
    } else {
      this.speed = newSpeed;
    }
  }
  
  addFood(foodItem) {
    this.food.push(foodItem);
    this.emit('foodSpawned', { food: foodItem });
  }
  
  removeFood(foodId) {
    const index = this.food.findIndex(f => f.id === foodId);
    if (index > -1) {
      const food = this.food[index];
      this.food.splice(index, 1);
      return food;
    }
    return null;
  }
  
  loadHighScore() {
    try {
      const stored = localStorage.getItem(`neon-snake-highscore-${this.mode}`);
      if (stored) {
        this.highScore = parseInt(stored, 10);
      }
    } catch (e) {
      console.warn('Could not load high score:', e);
    }
  }
  
  saveHighScore() {
    try {
      localStorage.setItem(`neon-snake-highscore-${this.mode}`, this.highScore.toString());
    } catch (e) {
      console.warn('Could not save high score:', e);
    }
  }
  
  updateTime(deltaTime) {
    this.elapsedTime += deltaTime;
    
    if (this.timeRemaining > 0) {
      this.timeRemaining -= deltaTime / 1000;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.emit('timeUp', {});
      }
    }
  }
  
  triggerScreenShake(intensity, duration) {
    intensity = intensity || GameConfig.EFFECTS.SCREEN_SHAKE_INTENSITY;
    duration = duration || GameConfig.EFFECTS.SCREEN_SHAKE_DURATION;
    this.effects.screenShake = intensity;
    setTimeout(() => {
      this.effects.screenShake = 0;
    }, duration);
  }
  
  triggerFlash(duration) {
    duration = duration || 200;
    this.effects.flash = 1;
    const fade = () => {
      this.effects.flash -= 0.1;
      if (this.effects.flash > 0) {
        requestAnimationFrame(fade);
      } else {
        this.effects.flash = 0;
      }
    };
    fade();
  }
  
  recordMove() {
    this.stats.totalMoves++;
    this.stats.distanceTraveled++;
  }
  
  recordWallPass() {
    this.stats.wallsPassed++;
  }
  
  serialize() {
    return {
      status: this.status,
      mode: this.mode,
      score: this.score,
      level: this.level,
      speed: this.speed,
      snake: {
        segments: [...this.snake.segments],
        direction: { ...this.snake.direction },
        nextDirection: { ...this.snake.nextDirection },
        growing: this.snake.growing,
      },
      food: [...this.food],
      activePowerUps: Array.from(this.activePowerUps.entries()),
      elapsedTime: this.elapsedTime,
      timeRemaining: this.timeRemaining,
      stats: { ...this.stats },
    };
  }
  
  deserialize(data) {
    this.status = data.status;
    this.mode = data.mode;
    this.score = data.score;
    this.level = data.level;
    this.speed = data.speed;
    this.snake = { ...data.snake };
    this.food = [...data.food];
    this.activePowerUps = new Map(data.activePowerUps);
    this.elapsedTime = data.elapsedTime;
    this.timeRemaining = data.timeRemaining;
    this.stats = { ...data.stats };
  }
}

const gameState = new GameState();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameState, gameState };
}
