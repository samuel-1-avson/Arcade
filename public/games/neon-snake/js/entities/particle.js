/**
 * Neon Snake Arena - Particle System
 * Visual effects and particle management
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.pool = []; // Object pool for performance
    this.maxParticles = 200;
  }
  
  /**
   * Create explosion effect
   */
  explode(x, y, color, count = 15, options = {}) {
    const defaults = {
      speed: 3,
      life: 1000,
      size: 4,
      gravity: 0,
      fade: true,
    };
    const config = { ...defaults, ...options };
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = config.speed * (0.5 + Math.random() * 0.5);
      
      this.spawn({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: config.life * (0.8 + Math.random() * 0.4),
        maxLife: config.life,
        size: config.size * (0.5 + Math.random() * 0.5),
        color: color,
        gravity: config.gravity,
        fade: config.fade,
        type: 'explosion',
      });
    }
  }
  
  /**
   * Create trail effect
   */
  trail(x, y, color, options = {}) {
    const defaults = {
      count: 3,
      speed: 0.5,
      life: 400,
      size: 3,
    };
    const config = { ...defaults, ...options };
    
    for (let i = 0; i < config.count; i++) {
      this.spawn({
        x: x + (Math.random() - 0.5) * 5,
        y: y + (Math.random() - 0.5) * 5,
        vx: (Math.random() - 0.5) * config.speed,
        vy: (Math.random() - 0.5) * config.speed,
        life: config.life,
        maxLife: config.life,
        size: config.size,
        color: color,
        fade: true,
        type: 'trail',
      });
    }
  }
  
  /**
   * Create sparkle effect
   */
  sparkle(x, y, color, options = {}) {
    const defaults = {
      count: 5,
      speed: 1,
      life: 600,
      size: 2,
    };
    const config = { ...defaults, ...options };
    
    for (let i = 0; i < config.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * config.speed;
      
      this.spawn({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: config.life * (0.5 + Math.random()),
        maxLife: config.life,
        size: config.size,
        color: color,
        fade: true,
        type: 'sparkle',
        blink: true,
      });
    }
  }
  
  /**
   * Create text particle
   */
  text(x, y, text, color, options = {}) {
    const defaults = {
      speed: 1,
      life: 1000,
      size: 16,
    };
    const config = { ...defaults, ...options };
    
    this.spawn({
      x: x,
      y: y,
      vx: 0,
      vy: -config.speed,
      life: config.life,
      maxLife: config.life,
      size: config.size,
      color: color,
      fade: true,
      type: 'text',
      text: text,
    });
  }
  
  /**
   * Spawn a particle (from pool or new)
   */
  spawn(config) {
    // Use pooled particle or create new
    let particle = this.pool.pop() || {};
    
    particle.x = config.x;
    particle.y = config.y;
    particle.vx = config.vx || 0;
    particle.vy = config.vy || 0;
    particle.life = config.life || 1000;
    particle.maxLife = config.maxLife || particle.life;
    particle.size = config.size || 4;
    particle.color = config.color || '#ffffff';
    particle.gravity = config.gravity || 0;
    particle.fade = config.fade !== false;
    particle.type = config.type || 'default';
    particle.text = config.text || null;
    particle.blink = config.blink || false;
    
    this.particles.push(particle);
    
    // Limit max particles
    if (this.particles.length > this.maxParticles) {
      const old = this.particles.shift();
      this.pool.push(old);
    }
  }
  
  /**
   * Update all particles
   */
  update(deltaTime) {
    const dt = deltaTime / 16; // Normalize to ~60fps
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Update position
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      
      // Apply gravity
      if (p.gravity !== 0) {
        p.vy += p.gravity * dt;
      }
      
      // Update life
      p.life -= deltaTime;
      
      // Remove dead particles
      if (p.life <= 0) {
        const dead = this.particles.splice(i, 1)[0];
        this.pool.push(dead);
      }
    }
  }
  
  /**
   * Render all particles
   */
  render(ctx) {
    for (const p of this.particles) {
      const alpha = p.fade ? (p.life / p.maxLife) : 1;
      
      if (p.type === 'text') {
        this.renderTextParticle(ctx, p, alpha);
      } else {
        this.renderDefaultParticle(ctx, p, alpha);
      }
    }
  }
  
  /**
   * Render default particle
   */
  renderDefaultParticle(ctx, p, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    
    if (p.blink && Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.globalAlpha = alpha * 0.5;
    }
    
    // Glow
    ctx.shadowBlur = p.size;
    ctx.shadowColor = p.color;
    
    // Draw particle
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  /**
   * Render text particle
   */
  renderTextParticle(ctx, p, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.font = `bold ${p.size}px "Orbitron", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 10;
    ctx.shadowColor = p.color;
    
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  }
  
  /**
   * Clear all particles
   */
  clear() {
    // Return all to pool
    for (const p of this.particles) {
      this.pool.push(p);
    }
    this.particles = [];
  }
  
  /**
   * Get active particle count
   */
  getCount() {
    return this.particles.length;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ParticleSystem };
}
