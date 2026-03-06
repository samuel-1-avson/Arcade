/**
 * Neon Snake Arena v2.0 - Power-up System
 * ctx origin is at grid (0,0) when render() is called.
 * BUG FIX: this.time initialised in constructor.
 */

class PowerUpSystem {
  constructor(state) {
    this.state        = state;
    this.powerUps     = [];
    this.spawnTimer   = 0;
    this.spawnInterval = 6000;
    this.time         = 0;          // FIX: was never initialised before
  }

  // ── Update ───────────────────────────────────────────────

  update(deltaMs) {
    this.time       += deltaMs * 0.001;
    this.spawnTimer += deltaMs;

    if (this.spawnTimer >= this.spawnInterval) {
      this._trySpawn();
      this.spawnTimer = 0;
    }

    // Expire old on-board power-ups (30 s max)
    const now = Date.now();
    this.powerUps = this.powerUps.filter(p => now - p.spawnedAt < 30000);
  }

  // ── Spawn ────────────────────────────────────────────────

  _trySpawn() {
    if (this.powerUps.length >= 2) return;

    const head = this.state.snake.segments[0];
    if (!head) return;

    const type = this._pickType();
    if (type) this._spawn(type);
  }

  _pickType() {
    const types = Object.values(GameConfig.POWERUPS);
    const total = types.reduce((s, p) => s + p.spawnChance, 0);
    let r = Math.random() * total;
    for (const p of types) {
      r -= p.spawnChance;
      if (r <= 0) return p.id;
    }
    return types[0].id;
  }

  _spawn(typeId) {
    const cfg = Object.values(GameConfig.POWERUPS).find(p => p.id === typeId);
    if (!cfg) return null;

    const pos = this._findFreeCell();
    if (!pos) return null;

    const pu = {
      id:          `pu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type:        typeId,
      cfg,
      x:           pos.x,
      y:           pos.y,
      spawnedAt:   Date.now(),
      floatOffset: Math.random() * Math.PI * 2,
    };

    this.powerUps.push(pu);
    this.state.emit('powerUpSpawned', { type: typeId });
    return pu;
  }

  forceSpawn(typeId) {
    this.powerUps = [];
    return this._spawn(typeId);
  }

  clear() {
    this.powerUps  = [];
    this.spawnTimer = 0;
  }

  // ── Collision ────────────────────────────────────────────

  checkCollision() {
    const head = this.state.snake.segments[0];
    if (!head) return null;

    const i = this.powerUps.findIndex(p => p.x === head.x && p.y === head.y);
    if (i > -1) {
      const pu = this.powerUps.splice(i, 1)[0];
      return pu;
    }
    return null;
  }

  collect(pu) {
    this.state.addScore(GameConfig.SCORING.POWERUP_COLLECT);
    this.state.addPowerUp(pu.type);
    this.state.emit('powerUpCollect', { type: pu.type, name: pu.cfg.name });
    return pu.cfg;
  }

  // ── Position helper ──────────────────────────────────────

  _findFreeCell() {
    const gw   = GameConfig.CANVAS.GRID_WIDTH;
    const gh   = GameConfig.CANVAS.GRID_HEIGHT;
    const head = this.state.snake.segments[0];

    for (let i = 0; i < 120; i++) {
      const x = Math.floor(Math.random() * gw);
      const y = Math.floor(Math.random() * gh);

      if (head) {
        if (Math.abs(x - head.x) + Math.abs(y - head.y) < 5) continue;
      }
      if (this.state.snake.segments.some(s => s.x === x && s.y === y)) continue;
      if (this.state.food.some(f => Math.round(f.x) === x && Math.round(f.y) === y)) continue;
      if (this.powerUps.some(p => p.x === x && p.y === y)) continue;
      return { x, y };
    }
    return null;
  }

  // ── Render ───────────────────────────────────────────────

  render(ctx) {
    const cell = GameConfig.CANVAS.CELL_SIZE;
    for (const pu of this.powerUps) {
      this._renderPowerUp(ctx, pu, cell);
    }
  }

  _renderPowerUp(ctx, pu, cell) {
    const t   = this.time;
    const cx  = pu.x * cell + cell / 2;
    const cy  = pu.y * cell + cell / 2;

    const floatY = Math.sin(t * 1.8 + pu.floatOffset) * 3;
    const scale  = 1 + Math.sin(t * 3.5 + pu.floatOffset) * 0.08;
    const size   = cell * 0.7 * scale;
    const r      = size / 2;
    const color  = pu.cfg.color;

    ctx.save();
    ctx.translate(cx, cy + floatY);

    // Outer pulsing ring
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.globalAlpha = 0.45 + Math.sin(t * 4) * 0.15;
    ctx.shadowBlur  = 10;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 1;

    // Background fill
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Colored rim
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2.5;
    ctx.shadowBlur  = 16;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Emoji icon
    ctx.shadowBlur    = 0;
    ctx.font          = `${size * 0.52}px Arial`;
    ctx.textAlign     = 'center';
    ctx.textBaseline  = 'middle';
    ctx.fillStyle     = '#ffffff';
    ctx.fillText(pu.cfg.emoji, 0, 1);

    ctx.restore();
  }

  // ── Active indicator bars (called in screen space) ───────

  renderActiveIndicators(ctx, canvasW) {
    const active = this.state.getActivePowerUps();
    if (active.length === 0) return;

    const iconR   = 16;
    const spacing = 40;
    const startX  = canvasW - (active.length * spacing) - 16;
    const y       = 52;

    active.forEach((pu, i) => {
      const x = startX + i * spacing + iconR;

      // Background circle
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath();
      ctx.arc(x, y, iconR, 0, Math.PI * 2);
      ctx.fill();

      // Timer arc
      if (pu.expiresAt) {
        const elapsed  = Date.now() - pu.startedAt;
        const total    = pu.expiresAt - pu.startedAt;
        const progress = Math.max(0, 1 - elapsed / total);
        const startA   = -Math.PI / 2;
        const endA     = startA + Math.PI * 2 * progress;

        ctx.strokeStyle = pu.cfg.color;
        ctx.lineWidth   = 3;
        ctx.shadowBlur  = 8;
        ctx.shadowColor = pu.cfg.color;
        ctx.beginPath();
        ctx.arc(x, y, iconR, startA, endA);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Emoji
      ctx.font         = '14px Arial';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = '#ffffff';
      ctx.fillText(pu.cfg.emoji, x, y + 1);
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PowerUpSystem };
}
