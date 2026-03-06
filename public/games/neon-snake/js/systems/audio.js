/**
 * Neon Snake Arena v2.0 - Audio System
 * Synthesised sounds via Web Audio API.
 */

class AudioSystem {
  constructor() {
    this.ctx         = null;
    this.initialized = false;
    this.muted       = false;
    this.vol         = GameConfig.AUDIO.SFX_VOLUME;

    // Simple rate-limit for move ticks
    this._lastMove = 0;
  }

  // ── Init ─────────────────────────────────────────────────

  init() {
    if (this.initialized) return;
    try {
      this.ctx         = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('[Audio] Not available:', e);
    }
  }

  // ── Public API ───────────────────────────────────────────

  play(type, opts = {}) {
    if (this.muted || !this.initialized) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    switch (type) {
      case 'eat':       this._eat(opts.golden);         break;
      case 'bonusEat':  this._bonusEat();               break;
      case 'powerup':   this._powerUp(opts.powerType);  break;
      case 'gameover':  this._gameOver();               break;
      case 'highscore': this._highScore();              break;
      case 'levelup':   this._levelUp();                break;
      case 'shield':    this._shieldAbsorb();           break;
      case 'move':      this._moveTick();               break;
      case 'combo':     this._combo(opts.level);        break;
    }
  }

  toggle() {
    this.muted = !this.muted;
    return !this.muted;
  }

  setMuted(v) { this.muted = v; }

  // ── Private sounds ───────────────────────────────────────

  _eat(golden = false) {
    const now = this.ctx.currentTime;
    if (golden) {
      this._tone(880, 'sine',     0.28, now,       0.14, 1760);
      this._tone(1100,'triangle', 0.18, now + 0.04, 0.20, 1100);
    } else {
      this._tone(580, 'sine',     0.20, now,       0.08, 1100);
    }
  }

  _bonusEat() {
    const now = this.ctx.currentTime;
    this._tone(700,  'triangle', 0.22, now,        0.07, 900);
    this._tone(900,  'triangle', 0.18, now + 0.06, 0.07, 1200);
    this._tone(1100, 'triangle', 0.14, now + 0.12, 0.08, 1400);
  }

  _powerUp(type) {
    const now = this.ctx.currentTime;
    const cfgs = {
      speedBoost:      { f: 660,  t: 'square',   d: 0.15 },
      ghostMode:       { f: 550,  t: 'sine',      d: 0.40 },
      scoreMultiplier: { f: 880,  t: 'triangle',  d: 0.30 },
      shrink:          { f: 330,  t: 'sawtooth',  d: 0.20 },
      magnet:          { f: 440,  t: 'sine',      d: 0.28 },
      shield:          { f: 770,  t: 'square',    d: 0.20 },
      slow:            { f: 380,  t: 'sine',      d: 0.35 },
    };
    const c = cfgs[type] || cfgs.speedBoost;
    this._tone(c.f, c.t, 0.24, now, c.d, c.f * 2);
  }

  _shieldAbsorb() {
    const now = this.ctx.currentTime;
    // Metallic clang
    this._tone(200, 'sawtooth', 0.3, now,        0.15, 80);
    this._tone(150, 'square',   0.2, now + 0.05, 0.20, 60);
  }

  _gameOver() {
    const now  = this.ctx.currentTime;
    const freq = [440, 415, 392, 370, 349, 330, 311, 294];
    freq.forEach((f, i) => {
      this._tone(f, 'sawtooth', 0.28, now + i * 0.09, 0.12, f);
    });
  }

  _highScore() {
    const now   = this.ctx.currentTime;
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => {
      this._tone(f, 'triangle', 0.28, now + i * 0.10, 0.50);
    });
  }

  _levelUp() {
    const now   = this.ctx.currentTime;
    const notes = [440, 554, 659, 880];
    notes.forEach((f, i) => {
      this._tone(f, 'triangle', 0.22, now + i * 0.07, 0.35);
    });
  }

  _combo(level = 2) {
    const now = this.ctx.currentTime;
    const f   = 440 + (level - 1) * 80;
    this._tone(f, 'square', 0.15, now, 0.10, f * 1.5);
  }

  _moveTick() {
    const now = Date.now();
    if (now - this._lastMove < 120) return;   // rate-limit
    this._lastMove = now;
    if (Math.random() > 0.25) return;         // only sometimes

    const t = this.ctx.currentTime;
    this._tone(80, 'sine', 0.015, t, 0.025);
  }

  // ── Tone helper ──────────────────────────────────────────

  _tone(freq, type, gain, startTime, duration, endFreq) {
    try {
      const osc = this.ctx.createOscillator();
      const g   = this.ctx.createGain();

      osc.connect(g);
      g.connect(this.ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), startTime + duration);
      }

      g.gain.setValueAtTime(gain * this.vol, startTime);
      g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);
    } catch (e) { /* ignore */ }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioSystem };
}
