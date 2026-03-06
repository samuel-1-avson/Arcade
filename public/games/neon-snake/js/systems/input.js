/**
 * Neon Snake Arena v2.0 - Input System
 * Direction changes are queued (one buffered ahead) so fast presses are not lost.
 */

class InputSystem {
  constructor(state, game) {
    this.state  = state;
    this.game   = game;   // reference to main NeonSnakeGame instance
    this.keys   = new Map();

    // Touch tracking
    this.touchStart = null;
    this.touchTime  = 0;
    this.SWIPE_THRESHOLD = 40;
    this.TAP_THRESHOLD   = 180;

    this._onKeyDown    = this._onKeyDown.bind(this);
    this._onKeyUp      = this._onKeyUp.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove  = this._onTouchMove.bind(this);
    this._onTouchEnd   = this._onTouchEnd.bind(this);

    this._listen();
  }

  _listen() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup',   this._onKeyUp);

    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
      canvas.addEventListener('touchmove',  this._onTouchMove,  { passive: false });
      canvas.addEventListener('touchend',   this._onTouchEnd,   { passive: false });
    }

    // D-pad mobile buttons
    document.querySelectorAll('[data-dir]').forEach(btn => {
      btn.addEventListener('touchstart', e => {
        e.preventDefault();
        const dir = btn.dataset.dir;
        this._applyDirection(dir);
      }, { passive: false });
      btn.addEventListener('click', () => {
        this._applyDirection(btn.dataset.dir);
      });
    });

    // Mobile pause button
    const pauseBtn = document.querySelector('.mobile-pause-btn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this._togglePause());
    }
  }

  removeEventListeners() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup',   this._onKeyUp);

    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      canvas.removeEventListener('touchstart', this._onTouchStart);
      canvas.removeEventListener('touchmove',  this._onTouchMove);
      canvas.removeEventListener('touchend',   this._onTouchEnd);
    }
  }

  // ── Keyboard ─────────────────────────────────────────────

  _onKeyDown(e) {
    this.keys.set(e.key, true);

    if (this._isGameKey(e.key)) e.preventDefault();

    // Direction when playing
    if (this.state.status === 'playing') {
      const dir = this._keyToDir(e.key);
      if (dir) this._queueDirection(dir.x, dir.y);
    }

    // Menu navigation
    if (this.state.status === 'menu') {
      this.game.handleMenuKey(e.key);
      return;
    }

    // Pause toggle
    if (GameConfig.INPUT.PAUSE.includes(e.key)) {
      this._togglePause();
      return;
    }

    // Restart from game over
    if (GameConfig.INPUT.RESTART.includes(e.key)) {
      if (this.state.status === 'gameOver') {
        this.game.restart();
      }
      return;
    }

    // Mute toggle
    if (GameConfig.INPUT.MUTE.includes(e.key)) {
      this.game.toggleMute();
    }
  }

  _onKeyUp(e) {
    this.keys.set(e.key, false);
  }

  // ── Touch ────────────────────────────────────────────────

  _onTouchStart(e) {
    e.preventDefault();
    const t = e.touches[0];
    this.touchStart = { x: t.clientX, y: t.clientY };
    this.touchTime  = Date.now();
  }

  _onTouchMove(e) {
    e.preventDefault();
  }

  _onTouchEnd(e) {
    e.preventDefault();
    if (!this.touchStart) return;

    const t  = e.changedTouches[0];
    const dx = t.clientX - this.touchStart.x;
    const dy = t.clientY - this.touchStart.y;
    const dt = Date.now() - this.touchTime;
    this.touchStart = null;

    // Tap -> pause/resume
    if (Math.abs(dx) < this.SWIPE_THRESHOLD && Math.abs(dy) < this.SWIPE_THRESHOLD && dt < this.TAP_THRESHOLD) {
      this._togglePause();
      return;
    }

    // Swipe direction
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > this.SWIPE_THRESHOLD) {
      this._queueDirection(dx > 0 ? 1 : -1, 0);
    } else if (Math.abs(dy) > this.SWIPE_THRESHOLD) {
      this._queueDirection(0, dy > 0 ? 1 : -1);
    }
  }

  // ── Helpers ──────────────────────────────────────────────

  _keyToDir(key) {
    if (GameConfig.INPUT.UP.includes(key))    return { x: 0,  y: -1 };
    if (GameConfig.INPUT.DOWN.includes(key))  return { x: 0,  y:  1 };
    if (GameConfig.INPUT.LEFT.includes(key))  return { x: -1, y:  0 };
    if (GameConfig.INPUT.RIGHT.includes(key)) return { x:  1, y:  0 };
    return null;
  }

  _applyDirection(name) {
    const map = { up: { x:0,y:-1 }, down: { x:0,y:1 }, left: { x:-1,y:0 }, right: { x:1,y:0 } };
    const d   = map[name];
    if (d) this._queueDirection(d.x, d.y);
  }

  _queueDirection(dx, dy) {
    if (this.state.status !== 'playing') return;
    this.game.snake.queueDirection(dx, dy);
    this.state.emit('inputDirection', { dx, dy });
  }

  _togglePause() {
    if (this.state.status === 'playing') {
      this.game.pause();
    } else if (this.state.status === 'paused') {
      this.game.resume();
    }
  }

  _isGameKey(key) {
    return [
      ...GameConfig.INPUT.UP,
      ...GameConfig.INPUT.DOWN,
      ...GameConfig.INPUT.LEFT,
      ...GameConfig.INPUT.RIGHT,
      ...GameConfig.INPUT.PAUSE,
      ' ',
    ].includes(key);
  }

  isPressed(key) {
    return this.keys.get(key) || false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InputSystem };
}
