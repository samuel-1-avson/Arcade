/**
 * Neon Snake Arena v2.0 - Particle System
 * Pooled, high-performance particle effects.
 * ctx should be in grid coordinate space when render() is called.
 */

class ParticleSystem {
  constructor() {
    this.particles   = [];
    this.pool        = [];
    this.MAX         = 300;
  }

  // ── Public effects ───────────────────────────────────────

  /** Radial burst at (x,y) in canvas pixels. */
  explode(x, y, color, count = 18, opts = {}) {
    const speed = opts.speed || 4;
    const life  = opts.life  || 900;
    const size  = opts.size  || 4;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * 0.6;
      const spd   = speed * (0.4 + Math.random() * 0.8);
      this._spawn({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: life * (0.7 + Math.random() * 0.5),
        maxLife: life,
        size: size * (0.5 + Math.random() * 0.8),
        color,
        gravity: 0.05,
        type: 'dot',
      });
    }
  }

  /** Ring of particles expanding outward. */
  ring(x, y, color, opts = {}) {
    const count  = opts.count  || 24;
    const radius = opts.radius || 10;
    const life   = opts.life   || 600;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i / count);
      this._spawn({
        x: x + Math.cos(angle) * radius * 0.3,
        y: y + Math.sin(angle) * radius * 0.3,
        vx: Math.cos(angle) * 2.5,
        vy: Math.sin(angle) * 2.5,
        life,
        maxLife: life,
        size: 2.5,
        color,
        type: 'dot',
      });
    }
  }

  /** Floating score text. */
  scoreText(x, y, text, color, opts = {}) {
    this._spawn({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(opts.speed || 1.2),
      life: opts.life || 1100,
      maxLife: opts.life || 1100,
      size: opts.size || 18,
      color,
      type: 'text',
      text,
    });
  }

  /** Large announcement text (level up, combo, etc.) */
  bigText(x, y, text, color) {
    this._spawn({
      x,
      y,
      vx: 0,
      vy: -0.6,
      life: 1400,
      maxLife: 1400,
      size: 28,
      color,
      type: 'text',
      text,
    });
  }

  /** Sparkle trail (e.g., speed-boost). */
  sparkle(x, y, color, count = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd   = Math.random() * 1.5;
      this._spawn({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 300 + Math.random() * 200,
        maxLife: 500,
        size: 2,
        color,
        type: 'dot',
      });
    }
  }

  // ── Update / render ──────────────────────────────────────

  update(deltaMs) {
    const dt = deltaMs / 16;  // normalise to ~60 fps

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x    += p.vx * dt;
      p.y    += p.vy * dt;
      p.vy   += p.gravity * dt;
      p.life -= deltaMs;

      if (p.life <= 0) {
        this.pool.push(this.particles.splice(i, 1)[0]);
      }
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      if (p.type === 'text') {
        this._renderText(ctx, p, alpha);
      } else {
        this._renderDot(ctx, p, alpha);
      }
    }
  }

  clear() {
    for (const p of this.particles) this.pool.push(p);
    this.particles = [];
  }

  // ── Private ──────────────────────────────────────────────

  _spawn(cfg) {
    const p = this.pool.pop() || {};
    p.x        = cfg.x;
    p.y        = cfg.y;
    p.vx       = cfg.vx       || 0;
    p.vy       = cfg.vy       || 0;
    p.life     = cfg.life     || 800;
    p.maxLife  = cfg.maxLife  || p.life;
    p.size     = cfg.size     || 4;
    p.color    = cfg.color    || '#ffffff';
    p.gravity  = cfg.gravity  || 0;
    p.type     = cfg.type     || 'dot';
    p.text     = cfg.text     || null;

    this.particles.push(p);

    // Evict oldest if over limit
    if (this.particles.length > this.MAX) {
      this.pool.push(this.particles.shift());
    }
  }

  _renderDot(ctx, p, alpha) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.shadowBlur  = p.size * 1.5;
    ctx.shadowColor = p.color;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.5, p.size * alpha), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _renderText(ctx, p, alpha) {
    ctx.save();
    ctx.globalAlpha  = Math.max(0, alpha);
    ctx.font         = `bold ${p.size}px "Orbitron", monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur   = 12;
    ctx.shadowColor  = p.color;
    ctx.fillStyle    = p.color;
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ParticleSystem };
}
