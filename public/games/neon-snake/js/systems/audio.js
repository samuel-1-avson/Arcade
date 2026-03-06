/**
 * Neon Snake Arena - Audio System
 * Handles sound effects and music
 */

class AudioSystem {
  constructor() {
    this.enabled = GameConfig.AUDIO.ENABLED;
    this.volume = GameConfig.AUDIO.VOLUME.MASTER;
    this.sfxVolume = GameConfig.AUDIO.VOLUME.SFX;
    
    this.sounds = new Map();
    this.context = null;
    this.initialized = false;
    
    // Oscillator frequencies for synthesized sounds
    this.frequencies = {
      eat: 440,      // A4
      powerup: 880,  // A5
      gameover: 220, // A3
      move: 110,     // A2
    };
  }
  
  /**
   * Initialize audio context (must be called after user interaction)
   */
  init() {
    if (this.initialized) return;
    
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      console.log('[Audio] Initialized');
    } catch (e) {
      console.warn('[Audio] Web Audio API not supported:', e);
      this.enabled = false;
    }
  }
  
  /**
   * Play a sound effect
   */
  play(type, options = {}) {
    if (!this.enabled || !this.initialized) return;
    
    // Resume context if suspended (browser policy)
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    
    switch (type) {
      case 'eat':
        this.playEat(options.isGolden);
        break;
      case 'powerup':
        this.playPowerUp(options.powerUpType);
        break;
      case 'gameover':
        this.playGameOver();
        break;
      case 'move':
        this.playMove();
        break;
      case 'highscore':
        this.playHighScore();
        break;
      default:
        console.warn('[Audio] Unknown sound type:', type);
    }
  }
  
  /**
   * Play eat sound
   */
  playEat(isGolden = false) {
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    if (isGolden) {
      // Higher pitched, longer sound for golden food
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
      
      gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      osc.start(now);
      osc.stop(now + 0.3);
      
      // Add a second tone for richness
      const osc2 = this.context.createOscillator();
      const gain2 = this.context.createGain();
      osc2.connect(gain2);
      gain2.connect(this.context.destination);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1100, now);
      
      gain2.gain.setValueAtTime(0.2 * this.sfxVolume, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      osc2.start(now);
      osc2.stop(now + 0.2);
    } else {
      // Simple blip for normal food
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }
  
  /**
   * Play power-up sound (distinct for each type)
   */
  playPowerUp(type) {
    const now = this.context.currentTime;
    const configs = {
      speedBoost: { freq: 880, type: 'square', duration: 0.15 },
      ghostMode: { freq: 660, type: 'sine', duration: 0.4 },
      scoreMultiplier: { freq: 1100, type: 'triangle', duration: 0.3 },
      shrink: { freq: 330, type: 'sawtooth', duration: 0.2 },
      magnet: { freq: 550, type: 'sine', duration: 0.25 },
    };
    
    const config = configs[type] || configs.speedBoost;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.type = config.type;
    osc.frequency.setValueAtTime(config.freq, now);
    osc.frequency.exponentialRampToValueAtTime(config.freq * 2, now + config.duration);
    
    gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
    
    osc.start(now);
    osc.stop(now + config.duration);
  }
  
  /**
   * Play game over sound
   */
  playGameOver() {
    const now = this.context.currentTime;
    const duration = 0.8;
    
    // Descending tone sequence
    const frequencies = [440, 415, 392, 370, 349, 330, 311, 294];
    
    frequencies.forEach((freq, i) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.connect(gain);
      gain.connect(this.context.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.3 * this.sfxVolume, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.1);
      
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.15);
    });
  }
  
  /**
   * Play move tick sound (very subtle)
   */
  playMove() {
    // Only play occasionally to avoid annoyance
    if (Math.random() > 0.3) return;
    
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, now);
    
    gain.gain.setValueAtTime(0.02 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    
    osc.start(now);
    osc.stop(now + 0.02);
  }
  
  /**
   * Play high score celebration
   */
  playHighScore() {
    const now = this.context.currentTime;
    
    // Victory arpeggio
    const notes = [523, 659, 784, 1047]; // C major chord
    
    notes.forEach((freq, i) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.connect(gain);
      gain.connect(this.context.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.3 * this.sfxVolume, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.5);
      
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.6);
    });
  }
  
  /**
   * Set master volume
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
  
  /**
   * Set SFX volume
   */
  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }
  
  /**
   * Enable/disable audio
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled && !this.initialized) {
      this.init();
    }
  }
  
  /**
   * Toggle mute
   */
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioSystem };
}
