/**
 * Neon Snake Arena v2.0 - Game State
 * Clean state machine — does NOT auto-emit gameStart on setStatus.
 * Game flow is driven explicitly from main.js.
 */

class GameState {
  constructor() {
    // ── Status ────────────────────────────────────────────
    // Values: 'menu' | 'countdown' | 'playing' | 'paused' | 'gameOver'
    this.status = 'menu';
    this.mode   = 'classic';

    // ── Score ─────────────────────────────────────────────
    this.score      = 0;
    this.highScores = { classic: 0, timeAttack: 0, endless: 0 };

    // ── Snake ─────────────────────────────────────────────
    this.snake = {
      segments:      [],
      direction:     { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
      dirQueue:      [],   // up to 1 buffered future direction
      growing:       0,
    };

    // ── Entities ──────────────────────────────────────────
    this.food       = [];
    this.foodEaten  = 0;
    this.goldenFoodEaten = 0;

    // ── Power-ups ─────────────────────────────────────────
    this.activePowerUps    = new Map();
    this.powerUpsCollected = 0;

    // ── Timing ────────────────────────────────────────────
    this.speed         = GameConfig.TIMING.BASE_SPEED;
    this.startTime     = 0;
    this.elapsedTime   = 0;
    this.timeRemaining = 0;

    // ── Combo ─────────────────────────────────────────────
    this.combo          = 1;
    this.lastEatTime    = 0;
    this.comboExpireTimer = 0;

    // ── Level ─────────────────────────────────────────────
    this.level     = 1;
    this.levelFood = 0;   // food eaten this level

    // ── Stats ─────────────────────────────────────────────
    this.stats = {
      totalMoves:      0,
      distanceTraveled: 0,
      wallsPassed:     0,
      maxSegments:     0,
      powerUpsCollected: 0,
    };

    // ── Effects ───────────────────────────────────────────
    this.effects = {
      screenShake: 0,
      flash:       0,
    };

    // ── Events ────────────────────────────────────────────
    this._listeners = new Map();

    this._loadHighScores();
  }

  // ── Event bus ───────────────────────────────────────────

  on(event, cb) {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event).push(cb);
  }

  off(event, cb) {
    const list = this._listeners.get(event);
    if (list) {
      const i = list.indexOf(cb);
      if (i > -1) list.splice(i, 1);
    }
  }

  emit(event, data) {
    const list = this._listeners.get(event);
    if (!list) return;
    list.forEach(cb => {
      try { cb(data); } catch (e) { console.error('[State] Event error:', event, e); }
    });
  }

  // ── Status ───────────────────────────────────────────────

  setStatus(newStatus) {
    const prev = this.status;
    if (prev === newStatus) return;
    this.status = newStatus;
    this.emit('statusChange', { prev, next: newStatus });
  }

  // ── Mode ─────────────────────────────────────────────────

  setMode(modeId) {
    const cfg = GameConfig.MODES[modeId.toUpperCase()];
    if (!cfg) return;
    this.mode = modeId;
    this.timeRemaining = cfg.timeLimit || 0;
    this.emit('modeChange', { mode: modeId });
  }

  // ── Reset ────────────────────────────────────────────────

  reset() {
    this.score      = 0;
    this.speed      = GameConfig.TIMING.BASE_SPEED;
    this.elapsedTime = 0;
    this.combo       = 1;
    this.lastEatTime = 0;
    this.comboExpireTimer = 0;
    this.level       = 1;
    this.levelFood   = 0;
    this.foodEaten   = 0;
    this.goldenFoodEaten = 0;

    const modeCfg = GameConfig.MODES[this.mode.toUpperCase()];
    this.timeRemaining = modeCfg ? (modeCfg.timeLimit || 0) : 0;

    this.snake = {
      segments:      [],
      direction:     { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
      dirQueue:      [],
      growing:       0,
    };
    this.food = [];
    this.activePowerUps.clear();
    this.powerUpsCollected = 0;

    this.stats = {
      totalMoves:        0,
      distanceTraveled:  0,
      wallsPassed:       0,
      maxSegments:       0,
      powerUpsCollected: 0,
    };

    this.effects = { screenShake: 0, flash: 0 };
  }

  // ── Snake initialisation ─────────────────────────────────

  initSnake(startX, startY, length = 3) {
    this.snake.segments = [];
    for (let i = 0; i < length; i++) {
      this.snake.segments.push({ x: startX - i, y: startY });
    }
    this.snake.direction     = { x: 1, y: 0 };
    this.snake.nextDirection = { x: 1, y: 0 };
    this.snake.dirQueue      = [];
    this.snake.growing       = 0;
    this._updateMaxSegments();
  }

  growSnake(amount = 1) {
    this.snake.growing += amount;
  }

  shrinkSnake(amount = 1) {
    const remove = Math.min(amount, this.snake.segments.length - 3);
    for (let i = 0; i < remove; i++) this.snake.segments.pop();
    this._updateMaxSegments();
  }

  _updateMaxSegments() {
    if (this.snake.segments.length > this.stats.maxSegments) {
      this.stats.maxSegments = this.snake.segments.length;
    }
  }

  // ── Scoring ──────────────────────────────────────────────

  addScore(base) {
    let pts = base;

    // Score multiplier power-up
    if (this.hasPowerUp('scoreMultiplier')) {
      pts *= GameConfig.POWERUPS.SCORE_MULTIPLIER.multiplier;
    }

    // Combo bonus: each extra combo level adds 50% of base
    if (this.combo > 1) {
      pts = Math.round(pts * (1 + (this.combo - 1) * 0.5));
    }

    pts = Math.floor(pts);
    this.score += pts;

    if (this.score > (this.highScores[this.mode] || 0)) {
      this.highScores[this.mode] = this.score;
      this._saveHighScores();
      this.emit('newHighScore', { score: this.score });
    }

    this.emit('scoreChange', { score: this.score, added: pts });
    return pts;
  }

  // ── Combo ────────────────────────────────────────────────

  extendCombo() {
    const now = Date.now();
    if (now - this.lastEatTime < GameConfig.SCORING.COMBO_WINDOW) {
      this.combo = Math.min(this.combo + 1, GameConfig.SCORING.COMBO_MAX);
    } else {
      this.combo = 1;
    }
    this.lastEatTime = now;
    this.emit('comboChange', { combo: this.combo });
  }

  resetCombo() {
    if (this.combo > 1) {
      this.combo = 1;
      this.emit('comboChange', { combo: 1 });
    }
  }

  // ── Speed ────────────────────────────────────────────────

  updateSpeed() {
    const modeCfg = GameConfig.MODES[this.mode.toUpperCase()];
    if (modeCfg && !modeCfg.speedAcceleration) {
      this.speed = GameConfig.TIMING.BASE_SPEED;
      return;
    }

    let base = Math.max(
      GameConfig.TIMING.MIN_SPEED,
      GameConfig.TIMING.BASE_SPEED - this.foodEaten * GameConfig.TIMING.SPEED_INCREMENT
    );

    if (this.hasPowerUp('speedBoost')) {
      base = base / GameConfig.TIMING.SPEED_BOOST_MULT;
    } else if (this.hasPowerUp('slow')) {
      base = base * GameConfig.TIMING.SLOW_DIVISOR;
    }

    this.speed = Math.max(GameConfig.TIMING.MIN_SPEED, base);
  }

  // ── Level ────────────────────────────────────────────────

  checkLevelUp() {
    this.levelFood++;
    if (this.levelFood >= GameConfig.LEVELS.FOOD_PER_LEVEL) {
      this.levelFood = 0;
      if (this.level < GameConfig.LEVELS.MAX_LEVEL) {
        this.level++;
        this.emit('levelUp', { level: this.level });
        return true;
      }
    }
    return false;
  }

  // ── Power-ups ────────────────────────────────────────────

  addPowerUp(id) {
    const cfg = Object.values(GameConfig.POWERUPS).find(p => p.id === id);
    if (!cfg) return;

    const now = Date.now();
    const expiresAt = cfg.duration ? now + cfg.duration : null;

    if (id === 'shrink') {
      this.shrinkSnake(cfg.segmentsRemoved);
      this.emit('powerUpActivated', { id, name: cfg.name });
      return;
    }

    this.activePowerUps.set(id, {
      id,
      cfg,
      startedAt: now,
      expiresAt,
    });

    this.powerUpsCollected++;
    this.stats.powerUpsCollected++;
    this.updateSpeed();
    this.emit('powerUpActivated', { id, name: cfg.name });

    if (expiresAt) {
      setTimeout(() => this.removePowerUp(id), cfg.duration);
    }
  }

  removePowerUp(id) {
    if (this.activePowerUps.has(id)) {
      const pu = this.activePowerUps.get(id);
      this.activePowerUps.delete(id);
      this.updateSpeed();
      this.emit('powerUpExpired', { id, name: pu.cfg.name });
    }
  }

  hasPowerUp(id) {
    return this.activePowerUps.has(id);
  }

  getActivePowerUps() {
    return Array.from(this.activePowerUps.values());
  }

  // ── Food ─────────────────────────────────────────────────

  addFood(food) {
    this.food.push(food);
  }

  removeFood(id) {
    const i = this.food.findIndex(f => f.id === id);
    if (i > -1) { this.food.splice(i, 1); return true; }
    return false;
  }

  // ── Time ─────────────────────────────────────────────────

  updateTime(deltaMs) {
    this.elapsedTime += deltaMs;

    // Decay combo if window expired
    if (this.combo > 1 && Date.now() - this.lastEatTime > GameConfig.SCORING.COMBO_WINDOW) {
      this.resetCombo();
    }

    if (this.timeRemaining > 0) {
      this.timeRemaining -= deltaMs / 1000;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.emit('timeUp', {});
      }
    }
  }

  // ── Effects ──────────────────────────────────────────────

  triggerScreenShake(intensity, duration) {
    intensity = intensity || GameConfig.EFFECTS.SCREEN_SHAKE_INTENSITY;
    duration  = duration  || GameConfig.EFFECTS.SCREEN_SHAKE_DURATION;
    this.effects.screenShake = intensity;
    setTimeout(() => { this.effects.screenShake = 0; }, duration);
  }

  triggerFlash() {
    this.effects.flash = 1;
    const fade = () => {
      this.effects.flash -= 0.1;
      if (this.effects.flash > 0) requestAnimationFrame(fade);
      else this.effects.flash = 0;
    };
    requestAnimationFrame(fade);
  }

  // ── Stats ────────────────────────────────────────────────

  recordMove() {
    this.stats.totalMoves++;
    this.stats.distanceTraveled++;
  }

  recordWallPass() {
    this.stats.wallsPassed++;
  }

  // ── Persistence ──────────────────────────────────────────

  _loadHighScores() {
    try {
      const raw = localStorage.getItem('neon-snake-v2-highscores');
      if (raw) {
        const data = JSON.parse(raw);
        Object.assign(this.highScores, data);
      }
    } catch (e) { /* ignore */ }
  }

  _saveHighScores() {
    try {
      localStorage.setItem('neon-snake-v2-highscores', JSON.stringify(this.highScores));
    } catch (e) { /* ignore */ }
  }
}

const gameState = new GameState();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameState, gameState };
}
