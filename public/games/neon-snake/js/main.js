/**
 * Neon Snake Arena v2.0 - Main Game Controller
 *
 * FIXES:
 * - No more event-loop: selectMode -> setStatus -> gameStart -> startGame -> setStatus (infinite)
 * - Restart works correctly
 * - Countdown state before play
 * - Proper ESC-to-menu flow
 * - PowerUpSystem.time initialised in its constructor
 */

class NeonSnakeGame {
  constructor() {
    this.state     = gameState;

    // Systems (assigned in init())
    this.snake     = null;
    this.food      = null;
    this.powerUps  = null;
    this.particles = null;
    this.input     = null;
    this.renderer  = null;
    this.audio     = null;

    // Game loop
    this.isRunning   = false;
    this.animationId = null;
    this.lastTime    = 0;
    this.accumulator = 0;

    // Menu state
    this.menuOptions  = ['Classic', 'Time Attack', 'Endless'];
    this.selectedMenu = 0;

    // Countdown state
    this.countdownValue  = 3;
    this.countdownTimer  = 0;

    // Game over stats snapshot
    this._gameOverStats = null;

    // Escape key pressed once while paused -> exit to menu
    this._escapePressCount = 0;

    this.gameLoop = this.gameLoop.bind(this);
  }

  // ── Initialise ───────────────────────────────────────────

  init() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) { console.error('[Game] Canvas not found'); return; }

    this.snake     = new Snake(this.state);
    this.food      = new FoodSystem(this.state);
    this.powerUps  = new PowerUpSystem(this.state);
    this.particles = new ParticleSystem();
    this.renderer  = new Renderer(canvas, this.state);
    this.audio     = new AudioSystem();
    this.input     = new InputSystem(this.state, this);

    this._setupStateEvents();
    this._setupAudioInit();

    this.state.setStatus('menu');

    if (window.ArcadeHub) ArcadeHub.notifyReady();

    this.isRunning = true;
    this.lastTime  = performance.now();
    requestAnimationFrame(this.gameLoop);
    console.log('[Game] Neon Snake Arena v2.0 ready');
  }

  // ── State events ─────────────────────────────────────────

  _setupStateEvents() {
    this.state.on('newHighScore', () => {
      this.audio.play('highscore');
    });

    this.state.on('levelUp', ({ level }) => {
      this.audio.play('levelup');
      this.renderer.showLevelUp(level);
      const head = this.snake.getHead();
      if (head) {
        const cx = head.x * GameConfig.CANVAS.CELL_SIZE + GameConfig.CANVAS.CELL_SIZE / 2;
        const cy = head.y * GameConfig.CANVAS.CELL_SIZE + GameConfig.CANVAS.CELL_SIZE / 2;
        this.particles.ring(cx, cy, '#00ff88', { count: 30, radius: 30 });
      }
    });

    this.state.on('powerUpExpired', ({ name }) => {
      // Nothing needed — state.updateSpeed() already called
    });

    this.state.on('timeUp', () => {
      this._triggerGameOver();
    });
  }

  _setupAudioInit() {
    const init = () => {
      this.audio.init();
      document.removeEventListener('click',   init);
      document.removeEventListener('keydown', init);
      document.removeEventListener('touchstart', init);
    };
    document.addEventListener('click',      init);
    document.addEventListener('keydown',    init);
    document.addEventListener('touchstart', init);
  }

  // ── Game loop ────────────────────────────────────────────

  gameLoop(timestamp) {
    if (!this.isRunning) return;

    const dt = Math.min(timestamp - this.lastTime, 100); // cap at 100ms
    this.lastTime = timestamp;

    this._update(dt);
    this._render();

    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  // ── Update ───────────────────────────────────────────────

  _update(dt) {
    switch (this.state.status) {
      case 'menu':     /* menu is purely visual */           break;
      case 'countdown': this._updateCountdown(dt);           break;
      case 'playing':   this._updatePlaying(dt);             break;
      case 'paused':    /* nothing */                        break;
      case 'gameOver':  /* particles only */
        this.particles.update(dt);
        break;
    }
  }

  _updateCountdown(dt) {
    this.countdownTimer -= dt;
    if (this.countdownTimer <= 0) {
      this.countdownValue--;
      this.countdownTimer = GameConfig.TIMING.COUNTDOWN_MS;

      if (this.countdownValue < 0) {
        // Countdown finished — start playing
        this.state.setStatus('playing');
        this.state.startTime = Date.now();
      }
    }
  }

  _updatePlaying(dt) {
    this.state.updateTime(dt);
    this.particles.update(dt);

    // Power-ups update
    this.powerUps.update(dt);

    // Food update
    this.food.update(Date.now(), dt);

    // Snake step (fixed-timestep)
    this.accumulator += dt;
    while (this.accumulator >= this.state.speed) {
      this.accumulator -= this.state.speed;
      this._step();
    }
  }

  _step() {
    // Move snake
    const result = this.snake.move();

    if (result === 'wall' || result === 'self') {
      this._triggerGameOver();
      return;
    }

    if (result === 'shielded') {
      this.audio.play('shield');
      return;
    }

    // Food check
    const food = this.food.checkCollision();
    if (food) {
      this._eatFood(food);
    }

    // Power-up check
    const pu = this.powerUps.checkCollision();
    if (pu) {
      this._collectPowerUp(pu);
    }

    // Move sound
    this.audio.play('move');

    // Turbo trail particles
    if (this.state.hasPowerUp('speedBoost')) {
      const head = this.snake.getHead();
      const cx   = head.x * GameConfig.CANVAS.CELL_SIZE + GameConfig.CANVAS.CELL_SIZE / 2;
      const cy   = head.y * GameConfig.CANVAS.CELL_SIZE + GameConfig.CANVAS.CELL_SIZE / 2;
      this.particles.sparkle(cx, cy, '#ffee00', 3);
    }
  }

  // ── Food ─────────────────────────────────────────────────

  _eatFood(food) {
    const pts = this.food.eat(food);
    const cx  = food.x * GameConfig.CANVAS.CELL_SIZE + GameConfig.CANVAS.CELL_SIZE / 2;
    const cy  = food.y * GameConfig.CANVAS.CELL_SIZE + GameConfig.CANVAS.CELL_SIZE / 2;

    // Particles
    const color = food.type === 'golden' ? '#ffdd00'
                : food.type === 'bonus'  ? '#ff8844'
                : '#00ff88';
    this.particles.explode(cx, cy, color, food.type === 'golden' ? 22 : 14);
    this.particles.scoreText(cx, cy - 18, `+${pts}`, '#ffffff');

    // Combo label if applicable
    if (this.state.combo > 1) {
      this.particles.bigText(cx, cy - 50, `\u00d7${this.state.combo} COMBO!`, '#ffdd00');
      this.audio.play('combo', { level: this.state.combo });
    }

    // Sound
    if (food.type === 'bonus') {
      this.audio.play('bonusEat');
    } else {
      this.audio.play('eat', { golden: food.type === 'golden' });
    }
  }

  // ── Power-up ─────────────────────────────────────────────

  _collectPowerUp(pu) {
    const cfg = this.powerUps.collect(pu);
    const cx  = pu.x * GameConfig.CANVAS.CELL_SIZE + GameConfig.CANVAS.CELL_SIZE / 2;
    const cy  = pu.y * GameConfig.CANVAS.CELL_SIZE + GameConfig.CANVAS.CELL_SIZE / 2;

    this.particles.explode(cx, cy, cfg.color, 20);
    this.particles.bigText(cx, cy - 40, cfg.name, cfg.color);
    this.state.triggerFlash();
    this.audio.play('powerup', { powerType: pu.type });
  }

  // ── Game over ────────────────────────────────────────────

  _triggerGameOver() {
    if (this.state.status === 'gameOver') return;

    // Death explosion
    const head = this.snake.getHead();
    if (head) {
      const cx = head.x * GameConfig.CANVAS.CELL_SIZE + GameConfig.CANVAS.CELL_SIZE / 2;
      const cy = head.y * GameConfig.CANVAS.CELL_SIZE + GameConfig.CANVAS.CELL_SIZE / 2;
      this.particles.explode(cx, cy, '#ff0055', 35, { speed: 6, life: 1200 });
    }
    this.state.triggerScreenShake(8, 300);
    this.audio.play('gameover');

    const finalScore = this.state.score;
    const finalMode  = this.state.mode;

    // Capture stats before state changes
    this._gameOverStats = {
      score:        finalScore,
      length:       this.state.snake.segments.length,
      level:        this.state.level,
      foodEaten:    this.state.foodEaten,
      goldenEaten:  this.state.goldenFoodEaten,
      powerUps:     this.state.stats.powerUpsCollected,
      elapsedMs:    this.state.elapsedTime,
      mode:         finalMode,
      isHighScore:  finalScore > 0 &&
                    finalScore >= (this.state.highScores[finalMode] || 0),
      leaderboard:  null,   // null = loading; [] = empty; [{rank,displayName,score}] = ready
      playerRank:   null,
    };

    this.state.setStatus('gameOver');

    // ── Hub bridge: notify parent (handles DB write when embedded + authenticated)
    if (window.ArcadeHub) {
      ArcadeHub.gameOver(finalScore, {
        mode:     finalMode,
        length:   this.state.snake.segments.length,
        duration: Math.floor(this.state.elapsedTime / 1000),
      });
    }

    // ── Standalone: submit score directly to database
    if (window.ArcadeAPI) {
      ArcadeAPI.submitScore({
        score:    finalScore,
        metadata: { mode: finalMode, duration: Math.floor(this.state.elapsedTime / 1000) },
      });
    }

    // ── Fetch leaderboard for display (always, embedded or standalone)
    if (window.ArcadeAPI) {
      const stats = this._gameOverStats; // capture reference for async callback
      ArcadeAPI.fetchLeaderboard({
        limit:       7,
        playerScore: finalScore,
        onSuccess: (data) => {
          stats.leaderboard = data.entries;
          stats.playerRank  = data.playerRank;
        },
        onError: () => {
          stats.leaderboard = [];
          stats.playerRank  = null;
        },
      });
    } else {
      this._gameOverStats.leaderboard = [];
    }
  }

  // ── Render ───────────────────────────────────────────────

  _render() {
    const nowMs = performance.now();

    switch (this.state.status) {
      case 'menu':
        this.renderer.renderMenu(
          this.menuOptions,
          this.selectedMenu,
          this.state.highScores
        );
        break;

      case 'countdown':
        // Render the live game world behind the countdown
        this.renderer.render(this.snake, this.food, this.powerUps, this.particles, nowMs);
        this.renderer.renderCountdown(this.countdownValue);
        break;

      case 'playing':
        this.renderer.render(this.snake, this.food, this.powerUps, this.particles, nowMs);
        break;

      case 'paused':
        this.renderer.render(this.snake, this.food, this.powerUps, this.particles, nowMs);
        this.renderer.renderPause();
        break;

      case 'gameOver':
        this.renderer.render(this.snake, this.food, this.powerUps, this.particles, nowMs);
        if (this._gameOverStats) {
          this.renderer.renderGameOver(this._gameOverStats);
        }
        break;
    }
  }

  // ── Public controls ──────────────────────────────────────

  /** Called by InputSystem when a menu key is pressed. */
  handleMenuKey(key) {
    if (this.state.status !== 'menu') return;

    if (GameConfig.INPUT.UP.includes(key)) {
      this.selectedMenu = (this.selectedMenu - 1 + this.menuOptions.length) % this.menuOptions.length;
    } else if (GameConfig.INPUT.DOWN.includes(key)) {
      this.selectedMenu = (this.selectedMenu + 1) % this.menuOptions.length;
    } else if (key === 'Enter' || key === ' ') {
      this.selectMode(this.selectedMenu);
    }
  }

  selectMode(index) {
    const modeKeys = Object.keys(GameConfig.MODES);
    const modeId   = GameConfig.MODES[modeKeys[index]]?.id;
    if (!modeId) return;

    this.state.setMode(modeId);
    this._beginGame();
  }

  _beginGame() {
    // Reset all state
    this.state.reset();
    this.state.setMode(this.state.mode);  // re-apply time limit etc.

    // Init entities
    const cx = Math.floor(GameConfig.CANVAS.GRID_WIDTH / 2);
    const cy = Math.floor(GameConfig.CANVAS.GRID_HEIGHT / 2);
    this.snake.init(cx, cy, 3);
    this.food.clear();
    this.powerUps.clear();
    this.particles.clear();
    this.food.spawn();
    this.food.spawn();

    // Start countdown
    this.countdownValue = 3;
    this.countdownTimer = GameConfig.TIMING.COUNTDOWN_MS;
    this.accumulator    = 0;
    this.state.setStatus('countdown');
  }

  restart() {
    this._gameOverStats = null;
    this._beginGame();
  }

  pause() {
    if (this.state.status === 'playing') {
      this.state.setStatus('paused');
      this._escapePressCount = 0;
    }
  }

  resume() {
    if (this.state.status === 'paused') {
      this.state.setStatus('playing');
      this.lastTime    = performance.now();
      this.accumulator = 0;
    }
  }

  exitToMenu() {
    this._gameOverStats = null;
    this.food.clear();
    this.powerUps.clear();
    this.particles.clear();
    this.selectedMenu = 0;
    this.state.reset();
    this.state.setStatus('menu');
  }

  toggleMute() {
    const enabled = this.audio.toggle();
    // Update mute button icon
    const btn = document.getElementById('muteBtn');
    if (btn) {
      btn.textContent = enabled ? '🔊' : '🔇';
      btn.classList.toggle('muted', !enabled);
    }
    return enabled;
  }

  destroy() {
    this.isRunning = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.input) this.input.removeEventListeners();
  }
}

// ── Boot ──────────────────────────────────────────────────

let game = null;

function initGame() {
  if (game) game.destroy();
  game = new NeonSnakeGame();
  game.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

// Pause on tab-hide
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game && game.state.status === 'playing') {
    game.pause();
  }
});

// Handle ESC from game-over to go back to menu
window.addEventListener('keydown', e => {
  if (!game) return;
  if (e.key === 'Escape') {
    if (game.state.status === 'gameOver') {
      game.exitToMenu();
    } else if (game.state.status === 'paused') {
      // Second ESC exits to menu
      game._escapePressCount = (game._escapePressCount || 0) + 1;
      if (game._escapePressCount >= 2) {
        game.exitToMenu();
        game._escapePressCount = 0;
      }
    }
  } else if (e.key === 'r' || e.key === 'R') {
    if (game.state.status === 'paused') {
      game.restart();
    }
  }
});

window.NeonSnakeGame = NeonSnakeGame;
window.gameInstance  = () => game;
