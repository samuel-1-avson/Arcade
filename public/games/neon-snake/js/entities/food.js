/**
 * Neon Snake Arena v2.0 - Food System
 * ctx origin is at grid (0,0) when render() is called.
 */

class FoodSystem {
  constructor(state) {
    this.state      = state;
    this.lastSpawn  = 0;
    this.pulsePhase = 0;
  }

  // ── Update ───────────────────────────────────────────────

  update(nowMs, deltaMs) {
    // Pulse animation
    this.pulsePhase += GameConfig.EFFECTS.PULSE_SPEED * deltaMs;
    if (this.pulsePhase > Math.PI * 2) this.pulsePhase -= Math.PI * 2;

    // Spawn if needed
    if (nowMs - this.lastSpawn > GameConfig.FOOD.SPAWN_INTERVAL) {
      if (this.state.food.length < GameConfig.FOOD.MAX_ITEMS) {
        this.spawn();
      }
      this.lastSpawn = nowMs;
    }

    // Expire old food
    this.state.food = this.state.food.filter(f => {
      if (f.despawnAt && nowMs > f.despawnAt) {
        this.state.emit('foodDespawn', { food: f });
        return false;
      }
      return true;
    });

    // Magnet pull
    if (this.state.hasPowerUp('magnet')) {
      this._applyMagnet();
    }
  }

  // ── Spawn ────────────────────────────────────────────────

  spawn() {
    const pos = this._findFreeCell();
    if (!pos) return null;

    const rng  = Math.random();
    let type, value, despawn;

    if (rng < GameConfig.FOOD.BONUS_CHANCE) {
      type    = 'bonus';
      value   = GameConfig.SCORING.BONUS_FOOD;
      despawn = Date.now() + GameConfig.FOOD.BONUS_DESPAWN_TIME;
    } else if (rng < GameConfig.FOOD.BONUS_CHANCE + GameConfig.FOOD.GOLDEN_CHANCE) {
      type    = 'golden';
      value   = GameConfig.SCORING.GOLDEN_FOOD;
      despawn = GameConfig.FOOD.DESPAWN_TIME > 0 ? Date.now() + GameConfig.FOOD.DESPAWN_TIME : null;
    } else {
      type    = 'normal';
      value   = GameConfig.SCORING.BASE_FOOD;
      despawn = GameConfig.FOOD.DESPAWN_TIME > 0 ? Date.now() + GameConfig.FOOD.DESPAWN_TIME : null;
    }

    const food = {
      id:        `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x:         pos.x,
      y:         pos.y,
      type,
      value,
      spawnedAt: Date.now(),
      despawnAt: despawn,
      phase:     Math.random() * Math.PI * 2,  // individual pulse offset
    };

    this.state.addFood(food);
    return food;
  }

  // ── Collision ────────────────────────────────────────────

  checkCollision() {
    const head = this.state.snake.segments[0];
    if (!head) return null;
    // Use rounded position for magnet-moved food
    return this.state.food.find(
      f => Math.round(f.x) === head.x && Math.round(f.y) === head.y
    ) || null;
  }

  eat(food) {
    this.state.removeFood(food.id);

    if (food.type === 'golden') this.state.goldenFoodEaten++;
    else this.state.foodEaten++;

    // Update combo before scoring
    this.state.extendCombo();

    const pts = this.state.addScore(food.value);

    // Grow snake
    const grow = food.type === 'golden' ? 2 : 1;
    this.state.growSnake(grow);

    // Speed & level
    this.state.updateSpeed();
    this.state.checkLevelUp();

    return pts;
  }

  clear() {
    this.state.food = [];
    this.lastSpawn  = 0;
  }

  // ── Magnet ───────────────────────────────────────────────

  _applyMagnet() {
    const head   = this.state.snake.segments[0];
    const radius = GameConfig.POWERUPS.MAGNET.radius;

    for (const f of this.state.food) {
      const dx   = head.x - f.x;
      const dy   = head.y - f.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.5 && dist <= radius) {
        const pull = 0.12;
        f.x += (dx / dist) * pull;
        f.y += (dy / dist) * pull;
      }
    }
  }

  // ── Position ─────────────────────────────────────────────

  _findFreeCell() {
    const gw = GameConfig.CANVAS.GRID_WIDTH;
    const gh = GameConfig.CANVAS.GRID_HEIGHT;
    for (let i = 0; i < 120; i++) {
      const x = Math.floor(Math.random() * gw);
      const y = Math.floor(Math.random() * gh);
      if (this.state.snake.segments.some(s => s.x === x && s.y === y)) continue;
      if (this.state.food.some(f => Math.round(f.x) === x && Math.round(f.y) === y)) continue;
      return { x, y };
    }
    return null;
  }

  // ── Render ───────────────────────────────────────────────

  render(ctx, nowMs) {
    const cell  = GameConfig.CANVAS.CELL_SIZE;
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.12;

    for (const f of this.state.food) {
      const cx = f.x * cell + cell / 2;
      const cy = f.y * cell + cell / 2;

      // Individual pulse (each food has slight phase offset)
      const fp   = 1 + Math.sin(this.pulsePhase + f.phase) * 0.1;
      const size = cell * 0.58 * fp;

      switch (f.type) {
        case 'golden': this._drawGolden(ctx, cx, cy, size, pulse); break;
        case 'bonus':  this._drawBonus(ctx, cx, cy, size, f, nowMs); break;
        default:       this._drawNormal(ctx, cx, cy, size); break;
      }
    }
  }

  _drawNormal(ctx, cx, cy, size) {
    const r = size / 2;
    ctx.save();
    ctx.shadowBlur  = 14;
    ctx.shadowColor = GameConfig.COLORS.FOOD_NORMAL;
    ctx.fillStyle   = GameConfig.COLORS.FOOD_NORMAL;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // Highlight
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawGolden(ctx, cx, cy, size, pulse) {
    const r = size / 2;
    ctx.save();
    // Outer ring
    ctx.shadowBlur  = 20;
    ctx.shadowColor = GameConfig.COLORS.FOOD_GOLDEN;
    ctx.strokeStyle = GameConfig.COLORS.FOOD_GOLDEN;
    ctx.lineWidth   = 2;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.4 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Main orb
    ctx.fillStyle = GameConfig.COLORS.FOOD_GOLDEN;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // Star
    ctx.shadowBlur = 0;
    ctx.fillStyle  = '#ffffff';
    this._drawStar(ctx, cx, cy, 5, r * 0.55, r * 0.25);
    ctx.restore();
  }

  _drawBonus(ctx, cx, cy, size, food, nowMs) {
    const r = size / 2;
    // Urgency flicker when close to despawn
    let alpha = 1;
    if (food.despawnAt) {
      const remaining = food.despawnAt - nowMs;
      if (remaining < 2000) {
        alpha = 0.5 + 0.5 * Math.sin(nowMs * 0.01);
      }
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowBlur  = 18;
    ctx.shadowColor = GameConfig.COLORS.FOOD_BONUS;
    ctx.fillStyle   = GameConfig.COLORS.FOOD_BONUS;
    // Diamond shape
    ctx.beginPath();
    ctx.moveTo(cx,     cy - r);
    ctx.lineTo(cx + r, cy    );
    ctx.lineTo(cx,     cy + r);
    ctx.lineTo(cx - r, cy    );
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle  = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawStar(ctx, cx, cy, spikes, outerR, innerR) {
    let rot  = -Math.PI / 2;
    const step = Math.PI / spikes;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      ctx.lineTo(cx + Math.cos(rot) * r, cy + Math.sin(rot) * r);
      rot += step;
    }
    ctx.closePath();
    ctx.fill();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FoodSystem };
}
