/**
 * Neon Snake Arena v2.0 - Snake Entity
 * Rendering assumes ctx origin is at grid (0,0) — renderer handles offset.
 */

class Snake {
  constructor(state) {
    this.state = state;
    this.glowPhase = 0;
    this.deathAnim = 0;     // 0 = alive, 1 = fully dead (fading)
    this.deathTimer = 0;
    this.DEATH_DURATION = 600;
  }

  // ── Initialise ───────────────────────────────────────────

  init(startX, startY, length = 3) {
    this.state.initSnake(startX, startY, length);
    this.deathAnim  = 0;
    this.deathTimer = 0;
  }

  // ── Direction ────────────────────────────────────────────

  /**
   * Queue a direction change.  We buffer at most one future direction so
   * fast key-presses are not swallowed.
   */
  queueDirection(dx, dy) {
    const sn   = this.state.snake;
    const last = sn.dirQueue.length > 0
      ? sn.dirQueue[sn.dirQueue.length - 1]
      : sn.nextDirection;

    // Ignore 180° reversals relative to the last queued direction
    if (last.x === -dx && last.y === -dy) return false;
    // Ignore identical to last queued
    if (last.x === dx  && last.y === dy)  return false;

    if (sn.dirQueue.length < 1) {
      sn.dirQueue.push({ x: dx, y: dy });
    } else {
      sn.dirQueue[0] = { x: dx, y: dy };
    }
    return true;
  }

  // ── Move ─────────────────────────────────────────────────

  /**
   * Move the snake one step.
   * Returns null (no collision) or 'wall' | 'self'.
   * A 'shield' collision returns 'shielded' — the caller handles it.
   */
  move() {
    const sn = this.state.snake;

    // Consume next queued direction
    if (sn.dirQueue.length > 0) {
      const queued = sn.dirQueue.shift();
      const cur    = sn.direction;
      if (!(queued.x === -cur.x && queued.y === -cur.y)) {
        sn.nextDirection = queued;
      }
    }

    sn.direction = { ...sn.nextDirection };

    const head = { ...sn.segments[0] };
    head.x += sn.direction.x;
    head.y += sn.direction.y;

    const gw = GameConfig.CANVAS.GRID_WIDTH;
    const gh = GameConfig.CANVAS.GRID_HEIGHT;

    // Endless / ghost mode wrapping
    const wrapMode = this.state.mode === 'endless' || this.state.hasPowerUp('ghostMode');
    if (wrapMode) {
      if (head.x < 0)   { head.x = gw - 1; this.state.recordWallPass(); }
      else if (head.x >= gw) { head.x = 0; this.state.recordWallPass(); }
      if (head.y < 0)   { head.y = gh - 1; this.state.recordWallPass(); }
      else if (head.y >= gh) { head.y = 0; this.state.recordWallPass(); }
    } else {
      // Wall collision
      if (head.x < 0 || head.x >= gw || head.y < 0 || head.y >= gh) {
        return this._handleFatalCollision('wall');
      }
    }

    // Self collision
    for (let i = 1; i < sn.segments.length; i++) {
      const seg = sn.segments[i];
      if (seg.x === head.x && seg.y === head.y) {
        return this._handleFatalCollision('self');
      }
    }

    // Move
    sn.segments.unshift(head);
    if (sn.growing > 0) {
      sn.growing--;
      this.state._updateMaxSegments();
    } else {
      sn.segments.pop();
    }

    this.state.recordMove();
    this.glowPhase += 0.12;
    return null;
  }

  _handleFatalCollision(type) {
    if (this.state.hasPowerUp('shield')) {
      this.state.removePowerUp('shield');
      this.state.triggerFlash();
      this.state.triggerScreenShake(8, 200);
      return 'shielded';
    }
    return type;
  }

  // ── Death animation ──────────────────────────────────────

  startDeathAnim() {
    this.deathAnim  = 0;
    this.deathTimer = this.DEATH_DURATION;
  }

  updateDeathAnim(dt) {
    if (this.deathTimer > 0) {
      this.deathTimer -= dt;
      this.deathAnim = 1 - Math.max(0, this.deathTimer / this.DEATH_DURATION);
    }
  }

  isDying() { return this.deathTimer > 0; }

  // ── Helpers ──────────────────────────────────────────────

  getHead() { return this.state.snake.segments[0]; }

  occupies(x, y) {
    return this.state.snake.segments.some(s => s.x === x && s.y === y);
  }

  // ── Render ───────────────────────────────────────────────

  render(ctx) {
    const segs     = this.state.snake.segments;
    if (segs.length === 0) return;

    const cell     = GameConfig.CANVAS.CELL_SIZE;
    const ghost    = this.state.hasPowerUp('ghostMode');
    const shield   = this.state.hasPowerUp('shield');
    const turbo    = this.state.hasPowerUp('speedBoost');
    const slowmo   = this.state.hasPowerUp('slow');
    const glow     = 0.65 + Math.sin(this.glowPhase) * 0.35;

    const deathAlpha = this.deathAnim > 0 ? Math.max(0, 1 - this.deathAnim * 1.5) : 1;

    ctx.save();
    ctx.globalAlpha = deathAlpha;

    // Draw body in reverse so head is on top
    for (let i = segs.length - 1; i >= 0; i--) {
      const seg = segs[i];
      const px  = seg.x * cell;
      const py  = seg.y * cell;

      if (i === 0) {
        // ── Head ──────────────────────────────────────────
        let headColor = GameConfig.COLORS.SNAKE_HEAD;
        if (ghost)  headColor = GameConfig.POWERUPS.GHOST_MODE.color;
        else if (turbo)  headColor = '#ffee00';
        else if (slowmo) headColor = '#88ffdd';
        else if (shield) headColor = '#ff8800';

        ctx.shadowBlur  = GameConfig.EFFECTS.GLOW_BLUR * glow;
        ctx.shadowColor = headColor;
        ctx.globalAlpha = deathAlpha * (ghost ? 0.7 : 1);

        ctx.fillStyle = headColor;
        this._roundRect(ctx, px + 1, py + 1, cell - 2, cell - 2, 5);

        // Shield ring
        if (shield) {
          ctx.strokeStyle = '#ff8800';
          ctx.lineWidth   = 2;
          ctx.shadowBlur  = 12;
          ctx.shadowColor = '#ff8800';
          ctx.strokeRect(px + 2, py + 2, cell - 4, cell - 4);
        }

        // Eyes
        this._drawEyes(ctx, px, py, cell, ghost);

        ctx.shadowBlur  = 0;

      } else {
        // ── Body ──────────────────────────────────────────
        const t     = i / (segs.length - 1);
        const color = this._lerpColor(
          GameConfig.COLORS.SNAKE_BODY_START,
          GameConfig.COLORS.SNAKE_BODY_END,
          t
        );

        const pad    = i === segs.length - 1 ? 4 : 2;
        const glowA  = Math.max(0, (1 - t) * glow * 0.5);

        ctx.shadowBlur  = glowA > 0.05 ? 8 * glowA : 0;
        ctx.shadowColor = GameConfig.COLORS.SNAKE_GLOW;
        ctx.globalAlpha = deathAlpha * (ghost ? 0.5 : 1);
        ctx.fillStyle   = color;
        ctx.fillRect(px + pad, py + pad, cell - pad * 2, cell - pad * 2);
        ctx.shadowBlur  = 0;
      }
    }

    ctx.restore();
  }

  // ── Drawing helpers ──────────────────────────────────────

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x,     y + h, x,     y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x,     y,     x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  _drawEyes(ctx, px, py, size, ghost) {
    const dir    = this.state.snake.direction;
    const eyeSz  = Math.max(2, size / 5.5);
    const margin = size * 0.22;

    // Position both eyes based on movement direction
    let e1, e2;
    if (dir.x === 1) {        // right → eyes top-right and bottom-right
      e1 = { x: px + size - margin - eyeSz, y: py + margin };
      e2 = { x: px + size - margin - eyeSz, y: py + size - margin - eyeSz };
    } else if (dir.x === -1) { // left  → eyes top-left and bottom-left
      e1 = { x: px + margin, y: py + margin };
      e2 = { x: px + margin, y: py + size - margin - eyeSz };
    } else if (dir.y === -1) { // up    → eyes top-left and top-right
      e1 = { x: px + margin, y: py + margin };
      e2 = { x: px + size - margin - eyeSz, y: py + margin };
    } else {                    // down  → eyes bottom-left and bottom-right
      e1 = { x: px + margin, y: py + size - margin - eyeSz };
      e2 = { x: px + size - margin - eyeSz, y: py + size - margin - eyeSz };
    }

    const eyeColor = ghost ? 'rgba(255,255,255,0.4)' : '#ffffff';
    ctx.fillStyle  = eyeColor;
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#ffffff';
    ctx.fillRect(e1.x, e1.y, eyeSz, eyeSz);
    ctx.fillRect(e2.x, e2.y, eyeSz, eyeSz);
    ctx.shadowBlur = 0;
  }

  _lerpColor(hex1, hex2, t) {
    const c1 = this._hex2rgb(hex1);
    const c2 = this._hex2rgb(hex2);
    const r  = Math.round(c1.r + (c2.r - c1.r) * t);
    const g  = Math.round(c1.g + (c2.g - c1.g) * t);
    const b  = Math.round(c1.b + (c2.b - c1.b) * t);
    return `rgb(${r},${g},${b})`;
  }

  _hex2rgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m
      ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
      : { r: 0, g: 0, b: 0 };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Snake };
}
