/**
 * Neon Snake Arena - Power-up System
 * Handles power-up spawning, effects, and rendering
 */

class PowerUpSystem {
  constructor(state) {
    this.state = state;
    this.powerUps = [];
    this.spawnTimer = 0;
    this.spawnInterval = 5000; // Base spawn interval
  }
  
  /**
   * Update power-up system
   */
  update(deltaTime) {
    this.spawnTimer += deltaTime;
    
    // Try to spawn power-up
    if (this.spawnTimer >= this.spawnInterval) {
      this.trySpawn();
      this.spawnTimer = 0;
    }
    
    // Update floating animation
    this.time += deltaTime * 0.002;
  }
  
  /**
   * Try to spawn a power-up based on chance
   */
  trySpawn() {
    // Only spawn if no power-up exists on board
    if (this.powerUps.length > 0) return;
    
    // Don't spawn too close to snake head
    const head = this.state.snake.segments[0];
    if (!head) return;
    
    // Random chance check
    const totalChance = Object.values(GameConfig.POWERUPS)
      .reduce((sum, p) => sum + p.spawnChance, 0);
    
    if (Math.random() > totalChance) return;
    
    // Select power-up type based on weights
    const type = this.selectPowerUpType();
    if (type) {
      this.spawn(type);
    }
  }
  
  /**
   * Select power-up type based on spawn chances
   */
  selectPowerUpType() {
    const types = Object.values(GameConfig.POWERUPS);
    const totalWeight = types.reduce((sum, p) => sum + p.spawnChance, 0);
    let random = Math.random() * totalWeight;
    
    for (const type of types) {
      random -= type.spawnChance;
      if (random <= 0) {
        return type.id;
      }
    }
    
    return types[0]?.id;
  }
  
  /**
   * Spawn a power-up
   */
  spawn(typeId) {
    const config = Object.values(GameConfig.POWERUPS).find(p => p.id === typeId);
    if (!config) return null;
    
    const position = this.findValidPosition();
    if (!position) return null;
    
    const powerUp = {
      id: this.generateId(),
      type: typeId,
      x: position.x,
      y: position.y,
      config: config,
      spawnedAt: Date.now(),
      floatOffset: Math.random() * Math.PI * 2,
    };
    
    this.powerUps.push(powerUp);
    this.state.emit('powerUpSpawn', { powerUp });
    
    return powerUp;
  }
  
  /**
   * Find valid spawn position
   */
  findValidPosition() {
    const maxAttempts = 100;
    const gridW = GameConfig.CANVAS.GRID_WIDTH;
    const gridH = GameConfig.CANVAS.GRID_HEIGHT;
    const head = this.state.snake.segments[0];
    
    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.floor(Math.random() * gridW);
      const y = Math.floor(Math.random() * gridH);
      
      // Don't spawn too close to snake head (safety zone)
      if (head) {
        const dist = Math.abs(x - head.x) + Math.abs(y - head.y);
        if (dist < 5) continue;
      }
      
      // Check snake collision
      if (this.state.snake.segments.some(seg => seg.x === x && seg.y === y)) {
        continue;
      }
      
      // Check food collision
      if (this.state.food.some(f => f.x === x && f.y === y)) {
        continue;
      }
      
      // Check other power-ups
      if (this.powerUps.some(p => p.x === x && p.y === y)) {
        continue;
      }
      
      return { x, y };
    }
    
    return null;
  }
  
  /**
   * Check collision with snake head
   */
  checkCollision() {
    const head = this.state.snake.segments[0];
    if (!head) return null;
    
    const index = this.powerUps.findIndex(p => p.x === head.x && p.y === head.y);
    if (index > -1) {
      const powerUp = this.powerUps[index];
      this.powerUps.splice(index, 1);
      return powerUp;
    }
    
    return null;
  }
  
  /**
   * Collect power-up
   */
  collect(powerUp) {
    // Add score
    this.state.addScore(GameConfig.SCORING.POWERUP);
    
    // Activate effect
    this.state.addPowerUp(powerUp.type);
    
    // Emit event
    this.state.emit('powerUpCollect', { powerUp });
    
    return powerUp.config;
  }
  
  /**
   * Force spawn a specific power-up (for testing/debug)
   */
  forceSpawn(typeId) {
    // Remove existing power-ups
    this.powerUps = [];
    return this.spawn(typeId);
  }
  
  /**
   * Clear all power-ups
   */
  clear() {
    this.powerUps = [];
  }
  
  /**
   * Render all power-ups
   */
  render(ctx, time) {
    const cellSize = GameConfig.CANVAS.CELL_SIZE;
    
    for (const powerUp of this.powerUps) {
      this.renderPowerUp(ctx, powerUp, time, cellSize);
    }
  }
  
  /**
   * Render single power-up
   */
  renderPowerUp(ctx, powerUp, time, cellSize) {
    const centerX = powerUp.x * cellSize + cellSize / 2;
    const centerY = powerUp.y * cellSize + cellSize / 2;
    
    // Floating animation
    const floatY = Math.sin(time + powerUp.floatOffset) * 3;
    const scale = 1 + Math.sin(time * 2 + powerUp.floatOffset) * 0.1;
    
    const size = (cellSize * 0.7) * scale;
    const color = powerUp.config.color;
    
    ctx.save();
    ctx.translate(centerX, centerY + floatY);
    
    // Outer glow ring (pulsing)
    const pulseSize = size * (0.8 + Math.sin(time * 3) * 0.1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.globalAlpha = 1;
    
    // Background circle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Colored ring
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Emoji/icon
    ctx.fillStyle = '#ffffff';
    ctx.font = `${size * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText(powerUp.config.emoji, 0, 1); // Slight offset for visual centering
    
    ctx.restore();
  }
  
  /**
   * Render active power-up indicators
   */
  renderActiveIndicators(ctx, y) {
    const active = this.state.getActivePowerUps();
    if (active.length === 0) return;
    
    const iconSize = 30;
    const spacing = 40;
    const startX = 20;
    
    active.forEach((powerUp, index) => {
      const x = startX + index * spacing;
      
      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(x, y, iconSize / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Progress ring
      if (powerUp.expiresAt) {
        const elapsed = Date.now() - powerUp.startedAt;
        const total = powerUp.expiresAt - powerUp.startedAt;
        const progress = 1 - (elapsed / total);
        
        ctx.strokeStyle = powerUp.config.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, iconSize / 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
        ctx.stroke();
      }
      
      // Icon
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(powerUp.config.emoji, x, y);
    });
  }
  
  /**
   * Generate unique ID
   */
  generateId() {
    return `powerup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PowerUpSystem };
}
