/**
 * Neon Snake Arena - Renderer
 * Handles all canvas drawing and visual effects
 */

class Renderer {
  constructor(canvas, state) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = state;
    
    // Set canvas size
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Grid animation
    this.gridPulse = 0;
    this.shakeOffset = { x: 0, y: 0 };
  }
  
  resize() {
    const container = this.canvas.parentElement;
    if (container) {
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
    } else {
      this.canvas.width = GameConfig.CANVAS.WIDTH;
      this.canvas.height = GameConfig.CANVAS.HEIGHT;
    }
  }
  
  /**
   * Main render loop
   */
  render(snake, food, powerUps, particles) {
    this.updateEffects();
    
    // Clear canvas
    this.ctx.fillStyle = GameConfig.COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply screen shake
    this.applyScreenShake();
    
    // Draw grid
    this.drawGrid();
    
    // Draw game elements
    particles.render(this.ctx);
    food.render(this.ctx);
    powerUps.render(this.ctx, Date.now() / 1000);
    snake.render(this.ctx);
    
    // Draw HUD
    this.drawHUD();
    
    // Draw active power-up indicators
    powerUps.renderActiveIndicators(this.ctx, 80);
    
    // Draw flash overlay
    this.drawFlashOverlay();
    
    // Reset transform
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  
  /**
   * Update visual effects
   */
  updateEffects() {
    // Grid pulse
    this.gridPulse += 0.02;
    if (this.gridPulse > Math.PI * 2) {
      this.gridPulse = 0;
    }
    
    // Screen shake decay
    if (this.state.effects.screenShake > 0) {
      this.shakeOffset.x = (Math.random() - 0.5) * this.state.effects.screenShake;
      this.shakeOffset.y = (Math.random() - 0.5) * this.state.effects.screenShake;
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
    }
  }
  
  /**
   * Apply screen shake transform
   */
  applyScreenShake() {
    this.ctx.translate(this.shakeOffset.x, this.shakeOffset.y);
  }
  
  /**
   * Draw background grid
   */
  drawGrid() {
    const cellSize = GameConfig.CANVAS.CELL_SIZE;
    const cols = GameConfig.CANVAS.GRID_WIDTH;
    const rows = GameConfig.CANVAS.GRID_HEIGHT;
    
    const offsetX = (this.canvas.width - cols * cellSize) / 2;
    const offsetY = (this.canvas.height - rows * cellSize) / 2;
    
    // Calculate grid glow intensity
    const glowIntensity = 0.1 + Math.sin(this.gridPulse) * 0.05;
    
    this.ctx.strokeStyle = `rgba(0, 229, 255, ${glowIntensity})`;
    this.ctx.lineWidth = 1;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = GameConfig.COLORS.GRID_GLOW;
    
    this.ctx.beginPath();
    
    // Vertical lines
    for (let i = 0; i <= cols; i++) {
      const x = offsetX + i * cellSize;
      this.ctx.moveTo(x, offsetY);
      this.ctx.lineTo(x, offsetY + rows * cellSize);
    }
    
    // Horizontal lines
    for (let i = 0; i <= rows; i++) {
      const y = offsetY + i * cellSize;
      this.ctx.moveTo(offsetX, y);
      this.ctx.lineTo(offsetX + cols * cellSize, y);
    }
    
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    
    // Draw border
    this.ctx.strokeStyle = `rgba(0, 229, 255, ${0.3 + glowIntensity})`;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(offsetX, offsetY, cols * cellSize, rows * cellSize);
  }
  
  /**
   * Draw HUD (Heads Up Display)
   */
  drawHUD() {
    const padding = 20;
    
    // Score
    this.drawText(
      `SCORE: ${this.state.score}`,
      padding,
      padding + 20,
      '#00e5ff',
      '20px "Orbitron", monospace',
      'left'
    );
    
    // High Score
    this.drawText(
      `HIGH: ${this.state.highScore}`,
      this.canvas.width - padding,
      padding + 20,
      'rgba(255, 255, 255, 0.7)',
      '16px "Orbitron", monospace',
      'right'
    );
    
    // Mode
    const modeName = GameConfig.MODES[this.state.mode.toUpperCase()]?.name || 'Classic';
    this.drawText(
      modeName.toUpperCase(),
      this.canvas.width / 2,
      padding + 20,
      '#ffffff',
      '16px "Orbitron", monospace',
      'center'
    );
    
    // Timer (if applicable)
    if (this.state.timeRemaining > 0) {
      const timeText = Math.ceil(this.state.timeRemaining).toString();
      const timeColor = this.state.timeRemaining < 10 ? '#ff0055' : '#ffffff';
      this.drawText(
        `TIME: ${timeText}`,
        this.canvas.width / 2,
        padding + 45,
        timeColor,
        '18px "Orbitron", monospace',
        'center'
      );
    }
    
    // Speed indicator
    const speedPercent = Math.round(
      (1 - (this.state.speed - GameConfig.TIMING.MIN_SPEED) / 
       (GameConfig.TIMING.BASE_SPEED - GameConfig.TIMING.MIN_SPEED)) * 100
    );
    this.drawText(
      `SPEED: ${speedPercent}%`,
      padding,
      this.canvas.height - padding,
      '#00ff88',
      '14px "Orbitron", monospace',
      'left'
    );
    
    // Segments count
    this.drawText(
      `LENGTH: ${this.state.snake.segments.length}`,
      this.canvas.width - padding,
      this.canvas.height - padding,
      '#ffffff',
      '14px "Orbitron", monospace',
      'right'
    );
  }
  
  /**
   * Draw flash overlay
   */
  drawFlashOverlay() {
    if (this.state.effects.flash > 0) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.state.effects.flash * 0.3})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
  
  /**
   * Draw menu overlay
   */
  drawMenu(title, options, selectedIndex) {
    // Darken background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Title
    this.drawText(
      title,
      this.canvas.width / 2,
      this.canvas.height / 3,
      '#00e5ff',
      '48px "Orbitron", monospace',
      'center',
      true
    );
    
    // Options
    const startY = this.canvas.height / 2;
    const lineHeight = 50;
    
    options.forEach((option, index) => {
      const isSelected = index === selectedIndex;
      const color = isSelected ? '#00e5ff' : 'rgba(255, 255, 255, 0.7)';
      const font = isSelected ? 'bold 24px "Orbitron", monospace' : '20px "Orbitron", monospace';
      
      this.drawText(
        (isSelected ? '> ' : '  ') + option,
        this.canvas.width / 2,
        startY + index * lineHeight,
        color,
        font,
        'center'
      );
    });
  }
  
  /**
   * Draw game over screen
   */
  drawGameOver() {
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Game Over text
    this.drawText(
      'GAME OVER',
      this.canvas.width / 2,
      this.canvas.height / 3,
      '#ff0055',
      '64px "Orbitron", monospace',
      'center',
      true
    );
    
    // Score
    this.drawText(
      `Score: ${this.state.score}`,
      this.canvas.width / 2,
      this.canvas.height / 2,
      '#ffffff',
      '32px "Orbitron", monospace',
      'center'
    );
    
    // High score notification
    if (this.state.score >= this.state.highScore && this.state.score > 0) {
      this.drawText(
        'NEW HIGH SCORE!',
        this.canvas.width / 2,
        this.canvas.height / 2 + 50,
        '#ffee00',
        '24px "Orbitron", monospace',
        'center',
        true
      );
    }
    
    // Instructions
    this.drawText(
      'Press R to restart',
      this.canvas.width / 2,
      this.canvas.height * 0.75,
      'rgba(255, 255, 255, 0.5)',
      '18px "Orbitron", monospace',
      'center'
    );
    
    this.drawText(
      'Press ESC to exit',
      this.canvas.width / 2,
      this.canvas.height * 0.75 + 30,
      'rgba(255, 255, 255, 0.5)',
      '18px "Orbitron", monospace',
      'center'
    );
  }
  
  /**
   * Draw pause screen
   */
  drawPause() {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // PAUSED text
    this.drawText(
      'PAUSED',
      this.canvas.width / 2,
      this.canvas.height / 2,
      '#00e5ff',
      '48px "Orbitron", monospace',
      'center',
      true
    );
    
    // Instruction
    this.drawText(
      'Press P or ESC to resume',
      this.canvas.width / 2,
      this.canvas.height / 2 + 60,
      'rgba(255, 255, 255, 0.7)',
      '18px "Orbitron", monospace',
      'center'
    );
  }
  
  /**
   * Helper: Draw text with optional glow
   */
  drawText(text, x, y, color, font, align, glow = false) {
    this.ctx.save();
    this.ctx.font = font;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = 'middle';
    
    if (glow) {
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = color;
    }
    
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }
  
  /**
   * Get canvas coordinates for grid position
   */
  gridToCanvas(gridX, gridY) {
    const cellSize = GameConfig.CANVAS.CELL_SIZE;
    const cols = GameConfig.CANVAS.GRID_WIDTH;
    const rows = GameConfig.CANVAS.GRID_HEIGHT;
    
    const offsetX = (this.canvas.width - cols * cellSize) / 2;
    const offsetY = (this.canvas.height - rows * cellSize) / 2;
    
    return {
      x: offsetX + gridX * cellSize,
      y: offsetY + gridY * cellSize,
    };
  }
  
  /**
   * Get grid position from canvas coordinates
   */
  canvasToGrid(canvasX, canvasY) {
    const cellSize = GameConfig.CANVAS.CELL_SIZE;
    const cols = GameConfig.CANVAS.GRID_WIDTH;
    const rows = GameConfig.CANVAS.GRID_HEIGHT;
    
    const offsetX = (this.canvas.width - cols * cellSize) / 2;
    const offsetY = (this.canvas.height - rows * cellSize) / 2;
    
    return {
      x: Math.floor((canvasX - offsetX) / cellSize),
      y: Math.floor((canvasY - offsetY) / cellSize),
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Renderer };
}
