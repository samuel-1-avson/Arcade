/**
 * Neon Snake Arena - Snake Entity
 * Handles snake movement, collision, and rendering
 */

class Snake {
  constructor(state) {
    this.state = state;
    this.glowIntensity = 0;
    this.glowDirection = 1;
  }
  
  /**
   * Initialize snake at position
   */
  init(startX, startY, length = 3) {
    this.state.initSnake({ x: startX, y: startY }, length);
  }
  
  /**
   * Change direction (with 180-degree prevention)
   */
  setDirection(dx, dy) {
    const current = this.state.snake.direction;
    
    // Prevent 180-degree turns
    if (current.x === -dx && current.y === -dy) {
      return false;
    }
    
    // Prevent rapid direction changes that could cause self-collision
    if (this.state.snake.nextDirection.x !== current.x || 
        this.state.snake.nextDirection.y !== current.y) {
      return false;
    }
    
    this.state.snake.nextDirection = { x: dx, y: dy };
    return true;
  }
  
  /**
   * Move the snake one step
   */
  move() {
    const snake = this.state.snake;
    
    // Apply queued direction change
    snake.direction = { ...snake.nextDirection };
    
    // Calculate new head position
    const head = { ...snake.segments[0] };
    head.x += snake.direction.x;
    head.y += snake.direction.y;
    
    // Handle endless mode wrapping
    if (this.state.mode === 'endless') {
      const gridW = GameConfig.CANVAS.GRID_WIDTH;
      const gridH = GameConfig.CANVAS.GRID_HEIGHT;
      
      if (head.x < 0) {
        head.x = gridW - 1;
        this.state.recordWallPass();
      } else if (head.x >= gridW) {
        head.x = 0;
        this.state.recordWallPass();
      }
      
      if (head.y < 0) {
        head.y = gridH - 1;
        this.state.recordWallPass();
      } else if (head.y >= gridH) {
        head.y = 0;
        this.state.recordWallPass();
      }
    }
    
    // Check wall collision (unless ghost mode)
    if (this.state.mode !== 'endless' && !this.state.hasPowerUp('ghostMode')) {
      if (this.checkWallCollision(head)) {
        return 'wall';
      }
    }
    
    // Check self collision
    if (this.checkSelfCollision(head)) {
      return 'self';
    }
    
    // Move snake
    snake.segments.unshift(head);
    
    // Handle growth
    if (snake.growing > 0) {
      snake.growing--;
      this.state.updateMaxSegments();
    } else {
      snake.segments.pop();
    }
    
    this.state.recordMove();
    
    // Update glow animation
    this.updateGlow();
    
    return null; // No collision
  }
  
  /**
   * Check if position collides with wall
   */
  checkWallCollision(pos) {
    return pos.x < 0 || 
           pos.x >= GameConfig.CANVAS.GRID_WIDTH ||
           pos.y < 0 || 
           pos.y >= GameConfig.CANVAS.GRID_HEIGHT;
  }
  
  /**
   * Check if position collides with snake body
   */
  checkSelfCollision(pos) {
    // Skip head (index 0)
    for (let i = 1; i < this.state.snake.segments.length; i++) {
      const segment = this.state.snake.segments[i];
      if (segment.x === pos.x && segment.y === pos.y) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Grow the snake
   */
  grow(amount = 1) {
    this.state.growSnake(amount);
  }
  
  /**
   * Shrink the snake
   */
  shrink(amount = 1) {
    this.state.shrinkSnake(amount);
  }
  
  /**
   * Get head position
   */
  getHead() {
    return this.state.snake.segments[0];
  }
  
  /**
   * Check if snake head is at position
   */
  isHeadAt(x, y) {
    const head = this.getHead();
    return head.x === x && head.y === y;
  }
  
  /**
   * Check if snake occupies position
   */
  occupies(x, y, includeHead = true) {
    const startIndex = includeHead ? 0 : 1;
    for (let i = startIndex; i < this.state.snake.segments.length; i++) {
      const seg = this.state.snake.segments[i];
      if (seg.x === x && seg.y === y) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Update glow animation
   */
  updateGlow() {
    this.glowIntensity += 0.05 * this.glowDirection;
    if (this.glowIntensity >= 1) {
      this.glowIntensity = 1;
      this.glowDirection = -1;
    } else if (this.glowIntensity <= 0.5) {
      this.glowIntensity = 0.5;
      this.glowDirection = 1;
    }
  }
  
  /**
   * Render the snake
   */
  render(ctx) {
    const segments = this.state.snake.segments;
    const cellSize = GameConfig.CANVAS.CELL_SIZE;
    
    if (segments.length === 0) return;
    
    // Get active power-up colors
    const ghostMode = this.state.hasPowerUp('ghostMode');
    const speedBoost = this.state.hasPowerUp('speedBoost');
    
    // Render body segments (in reverse for proper layering)
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      const x = seg.x * cellSize;
      const y = seg.y * cellSize;
      
      // Determine segment type and color
      let color, glowColor, glowSize;
      
      if (i === 0) {
        // Head
        color = GameConfig.COLORS.SNAKE_HEAD;
        glowColor = GameConfig.COLORS.SNAKE_GLOW;
        glowSize = GameConfig.EFFECTS.GLOW_BLUR * this.glowIntensity;
        
        if (ghostMode) {
          color = GameConfig.POWERUPS.GHOST_MODE.color;
          glowColor = color;
        } else if (speedBoost) {
          color = GameConfig.POWERUPS.SPEED_BOOST.color;
        }
      } else if (i === segments.length - 1) {
        // Tail
        color = GameConfig.COLORS.SNAKE_TAIL;
        glowColor = 'transparent';
        glowSize = 0;
      } else {
        // Body
        const progress = i / segments.length;
        color = this.interpolateColor(
          GameConfig.COLORS.SNAKE_BODY,
          GameConfig.COLORS.SNAKE_TAIL,
          progress
        );
        glowColor = GameConfig.COLORS.SNAKE_GLOW;
        glowSize = GameConfig.EFFECTS.GLOW_BLUR * 0.5 * (1 - progress);
      }
      
      // Apply ghost mode transparency
      ctx.globalAlpha = ghostMode ? 0.6 : 1;
      
      // Draw glow
      if (glowSize > 0) {
        ctx.shadowBlur = glowSize;
        ctx.shadowColor = glowColor;
      }
      
      // Draw segment
      ctx.fillStyle = color;
      
      if (i === 0) {
        // Draw head as rounded rectangle
        this.roundRect(ctx, x + 1, y + 1, cellSize - 2, cellSize - 2, 4);
        
        // Draw eyes
        this.drawEyes(ctx, x, y, cellSize);
      } else {
        // Draw body
        const padding = i === segments.length - 1 ? 3 : 2;
        ctx.fillRect(
          x + padding,
          y + padding,
          cellSize - padding * 2,
          cellSize - padding * 2
        );
      }
      
      // Reset shadow
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    
    // Draw direction indicator (subtle arrow on head)
    this.drawDirectionIndicator(ctx);
  }
  
  /**
   * Draw rounded rectangle
   */
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }
  
  /**
   * Draw snake eyes
   */
  drawEyes(ctx, x, y, size) {
    const dir = this.state.snake.direction;
    const eyeSize = size / 5;
    const offset = size / 3;
    
    let eye1X = x + offset;
    let eye1Y = y + offset;
    let eye2X = x + size - offset - eyeSize;
    let eye2Y = y + offset;
    
    // Adjust based on direction
    if (dir.x === 1) { // Right
      eye1Y = y + offset;
      eye2Y = y + size - offset - eyeSize;
    } else if (dir.x === -1) { // Left
      eye1X = x + size - offset - eyeSize;
      eye2X = x + offset;
      eye1Y = y + offset;
      eye2Y = y + size - offset - eyeSize;
    } else if (dir.y === -1) { // Up
      eye1X = x + offset;
      eye2X = x + size - offset - eyeSize;
      eye1Y = y + size - offset - eyeSize;
      eye2Y = y + size - offset - eyeSize;
    }
    
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#ffffff';
    
    ctx.fillRect(eye1X, eye1Y, eyeSize, eyeSize);
    ctx.fillRect(eye2X, eye2Y, eyeSize, eyeSize);
    
    ctx.shadowBlur = 0;
  }
  
  /**
   * Draw direction indicator
   */
  drawDirectionIndicator(ctx) {
    const head = this.getHead();
    const dir = this.state.snake.direction;
    const cellSize = GameConfig.CANVAS.CELL_SIZE;
    
    const centerX = head.x * cellSize + cellSize / 2;
    const centerY = head.y * cellSize + cellSize / 2;
    
    const length = cellSize * 0.8;
    const endX = centerX + dir.x * length;
    const endY = centerY + dir.y * length;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    ctx.setLineDash([]);
  }
  
  /**
   * Interpolate between two colors
   */
  interpolateColor(color1, color2, factor) {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  /**
   * Convert hex to rgb
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Snake };
}
