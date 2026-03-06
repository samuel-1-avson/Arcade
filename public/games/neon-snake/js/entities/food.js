/**
 * Neon Snake Arena - Food System
 * Handles food spawning, types, and collection
 */

class FoodSystem {
  constructor(state) {
    this.state = state;
    this.lastSpawnTime = 0;
    this.pulsePhase = 0;
  }
  
  /**
   * Update food system
   */
  update(currentTime) {
    // Spawn new food if needed
    if (currentTime - this.lastSpawnTime > GameConfig.FOOD.SPAWN_INTERVAL) {
      if (this.state.food.length < GameConfig.FOOD.MAX_ITEMS) {
        this.spawn();
      }
      this.lastSpawnTime = currentTime;
    }
    
    // Update pulse animation
    this.pulsePhase += GameConfig.EFFECTS.PULSE_SPEED * 16;
    if (this.pulsePhase > Math.PI * 2) {
      this.pulsePhase = 0;
    }
    
    // Remove expired food
    const now = Date.now();
    this.state.food = this.state.food.filter(food => {
      if (food.despawnAt && now > food.despawnAt) {
        this.state.emit('foodDespawn', { food });
        return false;
      }
      return true;
    });
  }
  
  /**
   * Spawn a new food item
   */
  spawn() {
    const position = this.findValidPosition();
    if (!position) return null;
    
    const isGolden = Math.random() < GameConfig.FOOD.GOLDEN_CHANCE;
    const food = {
      id: this.generateId(),
      x: position.x,
      y: position.y,
      type: isGolden ? 'golden' : 'normal',
      value: isGolden ? GameConfig.SCORING.GOLDEN_FOOD : GameConfig.SCORING.BASE_FOOD,
      spawnedAt: Date.now(),
      despawnAt: GameConfig.FOOD.DESPAWN_TIME > 0 ? 
        Date.now() + GameConfig.FOOD.DESPAWN_TIME : null,
    };
    
    this.state.addFood(food);
    return food;
  }
  
  /**
   * Find a valid spawn position
   */
  findValidPosition() {
    const maxAttempts = 100;
    const gridW = GameConfig.CANVAS.GRID_WIDTH;
    const gridH = GameConfig.CANVAS.GRID_HEIGHT;
    
    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.floor(Math.random() * gridW);
      const y = Math.floor(Math.random() * gridH);
      
      // Check collision with snake
      if (this.state.snake.segments.some(seg => seg.x === x && seg.y === y)) {
        continue;
      }
      
      // Check collision with existing food
      if (this.state.food.some(f => f.x === x && f.y === y)) {
        continue;
      }
      
      // Check collision with power-ups
      // (Power-ups would be stored separately)
      
      return { x, y };
    }
    
    return null; // No valid position found
  }
  
  /**
   * Check if snake head is on food
   */
  checkCollision() {
    const head = this.state.snake.segments[0];
    if (!head) return null;
    
    for (const food of this.state.food) {
      if (food.x === head.x && food.y === head.y) {
        return food;
      }
    }
    
    return null;
  }
  
  /**
   * Eat food
   */
  eat(food) {
    // Remove food
    this.state.removeFood(food.id);
    
    // Add score
    this.state.addScore(food.value);
    
    // Track stats
    if (food.type === 'golden') {
      this.state.goldenFoodEaten++;
    } else {
      this.state.foodEaten++;
    }
    
    // Grow snake
    this.state.growSnake(1);
    
    // Update speed
    this.state.updateSpeed();
    
    // Emit event
    this.state.emit('foodEaten', { food });
    
    return food.value;
  }
  
  /**
   * Check if there's food within magnet range
   */
  getMagnetTarget() {
    if (!this.state.hasPowerUp('magnet')) return null;
    
    const head = this.state.snake.segments[0];
    const magnetRadius = GameConfig.POWERUPS.MAGNET.radius;
    let closest = null;
    let closestDist = Infinity;
    
    for (const food of this.state.food) {
      const dx = food.x - head.x;
      const dy = food.y - head.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= magnetRadius && dist < closestDist) {
        closestDist = dist;
        closest = food;
      }
    }
    
    return closest;
  }
  
  /**
   * Apply magnet effect - move food towards snake
   */
  applyMagnet() {
    const head = this.state.snake.segments[0];
    const magnetRadius = GameConfig.POWERUPS.MAGNET.radius;
    
    for (const food of this.state.food) {
      const dx = head.x - food.x;
      const dy = head.y - food.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= magnetRadius && dist > 0.5) {
        // Move food towards snake (subtle pull)
        const pullStrength = 0.1;
        food.x += (dx / dist) * pullStrength;
        food.y += (dy / dist) * pullStrength;
      }
    }
  }
  
  /**
   * Render all food items
   */
  render(ctx) {
    const cellSize = GameConfig.CANVAS.CELL_SIZE;
    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.1;
    
    for (const food of this.state.food) {
      const centerX = food.x * cellSize + cellSize / 2;
      const centerY = food.y * cellSize + cellSize / 2;
      
      if (food.type === 'golden') {
        this.renderGoldenFood(ctx, centerX, centerY, cellSize, pulseScale);
      } else {
        this.renderNormalFood(ctx, centerX, centerY, cellSize, pulseScale);
      }
    }
  }
  
  /**
   * Render normal food
   */
  renderNormalFood(ctx, x, y, cellSize, pulseScale) {
    const size = (cellSize * 0.6) * pulseScale;
    const color = GameConfig.COLORS.FOOD_NORMAL;
    
    // Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = GameConfig.COLORS.FOOD_GLOW;
    
    // Main orb
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(x - size * 0.15, y - size * 0.15, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
  }
  
  /**
   * Render golden food
   */
  renderGoldenFood(ctx, x, y, cellSize, pulseScale) {
    const size = (cellSize * 0.7) * pulseScale;
    const color = GameConfig.COLORS.FOOD_GOLDEN;
    
    // Outer glow ring
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    
    ctx.beginPath();
    ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    
    // Main orb
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Star shape inside
    ctx.fillStyle = '#ffffff';
    this.drawStar(ctx, x, y, 5, size * 0.35, size * 0.15);
    
    ctx.shadowBlur = 0;
  }
  
  /**
   * Draw a star shape
   */
  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }
  
  /**
   * Clear all food
   */
  clear() {
    this.state.food = [];
  }
  
  /**
   * Generate unique ID
   */
  generateId() {
    return `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FoodSystem };
}
