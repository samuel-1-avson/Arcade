/**
 * Neon Snake Arena - Input System
 * Handles keyboard and touch input
 */

class InputSystem {
  constructor(state) {
    this.state = state;
    this.keys = new Map();
    this.touchStartPos = null;
    this.touchStartTime = 0;
    this.swipeThreshold = 50;
    this.tapThreshold = 200;
    
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    
    // Touch events
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
      canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
      canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false });
    }
  }
  
  removeEventListeners() {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      canvas.removeEventListener('touchstart', this.boundTouchStart);
      canvas.removeEventListener('touchmove', this.boundTouchMove);
      canvas.removeEventListener('touchend', this.boundTouchEnd);
    }
  }
  
  handleKeyDown(e) {
    const key = e.key;
    this.keys.set(key, true);
    
    // Prevent default for game keys to stop scrolling
    if (this.isGameKey(key)) {
      e.preventDefault();
    }
    
    // Emit event for other systems
    this.state.emit('inputKeyDown', { key, event: e });
    
    // Handle direction input (only when playing)
    if (this.state.status === 'playing') {
      this.handleDirectionInput(key);
    }
    
    // Handle game control keys
    this.handleControlKeys(key);
  }
  
  handleKeyUp(e) {
    this.keys.set(e.key, false);
    this.state.emit('inputKeyUp', { key: e.key });
  }
  
  isGameKey(key) {
    return [
      ...GameConfig.INPUT.UP,
      ...GameConfig.INPUT.DOWN,
      ...GameConfig.INPUT.LEFT,
      ...GameConfig.INPUT.RIGHT,
      ...GameConfig.INPUT.PAUSE,
    ].includes(key);
  }
  
  handleDirectionInput(key) {
    const snake = this.state.snake;
    let dx = 0;
    let dy = 0;
    
    if (GameConfig.INPUT.UP.includes(key)) {
      dy = -1;
    } else if (GameConfig.INPUT.DOWN.includes(key)) {
      dy = 1;
    } else if (GameConfig.INPUT.LEFT.includes(key)) {
      dx = -1;
    } else if (GameConfig.INPUT.RIGHT.includes(key)) {
      dx = 1;
    }
    
    if (dx !== 0 || dy !== 0) {
      // Queue direction change
      if (snake.nextDirection.x === snake.direction.x && 
          snake.nextDirection.y === snake.direction.y) {
        
        // Prevent 180-degree turn
        if (!(dx === -snake.direction.x && dy === -snake.direction.y)) {
          snake.nextDirection = { x: dx, y: dy };
          this.state.emit('inputDirection', { direction: { x: dx, y: dy } });
        }
      }
    }
  }
  
  handleControlKeys(key) {
    // Pause
    if (GameConfig.INPUT.PAUSE.includes(key)) {
      if (this.state.status === 'playing') {
        this.state.setStatus('paused');
      } else if (this.state.status === 'paused') {
        this.state.setStatus('playing');
      }
      return;
    }
    
    // Restart
    if (GameConfig.INPUT.RESTART.includes(key)) {
      if (this.state.status === 'gameOver') {
        this.state.emit('gameRestart', {});
      }
    }
  }
  
  // Touch Handling
  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.touchStartPos = { x: touch.clientX, y: touch.clientY };
    this.touchStartTime = Date.now();
  }
  
  handleTouchMove(e) {
    e.preventDefault();
    // Could add continuous touch tracking here
  }
  
  handleTouchEnd(e) {
    e.preventDefault();
    
    if (!this.touchStartPos) return;
    
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    
    const dx = endX - this.touchStartPos.x;
    const dy = endY - this.touchStartPos.y;
    const dt = Date.now() - this.touchStartTime;
    
    // Check for tap (pause)
    if (Math.abs(dx) < this.swipeThreshold && 
        Math.abs(dy) < this.swipeThreshold &&
        dt < this.tapThreshold) {
      if (this.state.status === 'playing') {
        this.state.setStatus('paused');
      } else if (this.state.status === 'paused') {
        this.state.setStatus('playing');
      }
      return;
    }
    
    // Check for swipe
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (Math.abs(dx) > this.swipeThreshold) {
        const key = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
        this.handleDirectionInput(key);
      }
    } else {
      // Vertical swipe
      if (Math.abs(dy) > this.swipeThreshold) {
        const key = dy > 0 ? 'ArrowDown' : 'ArrowUp';
        this.handleDirectionInput(key);
      }
    }
    
    this.touchStartPos = null;
  }
  
  /**
   * Check if a key is currently pressed
   */
  isPressed(key) {
    return this.keys.get(key) || false;
  }
  
  /**
   * Get all currently pressed keys
   */
  getPressedKeys() {
    const pressed = [];
    for (const [key, value] of this.keys) {
      if (value) pressed.push(key);
    }
    return pressed;
  }
  
  /**
   * Reset all key states
   */
  reset() {
    this.keys.clear();
    this.touchStartPos = null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InputSystem };
}
