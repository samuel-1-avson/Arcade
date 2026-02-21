/**
 * Audio Manager for 2048 - Calm & Minimal Sounds
 * Uses Web Audio API for synthesized sounds
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.enabled = this.loadSetting('audio-enabled', true);
        this.volume = this.loadSetting('audio-volume', 0.3); // Default low volume
        this.musicEnabled = this.loadSetting('music-enabled', false);
        
        this.init();
    }

    init() {
        try {
            // Create Audio Context on first user interaction
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.volume;
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    loadSetting(key, defaultValue) {
        const saved = localStorage.getItem(`2048-${key}`);
        return saved !== null ? JSON.parse(saved) : defaultValue;
    }

    saveSetting(key, value) {
        localStorage.setItem(`2048-${key}`, JSON.stringify(value));
    }

    /**
     * Play a gentle merge sound based on tile value
     * Higher tiles = higher pitch, but always calm
     */
    playMergeSound(tileValue) {
        if (!this.enabled || !this.audioContext) return;

        // Map tile values to frequencies (calm range: 200-600Hz)
        const frequencies = {
            2: 220,    // A3
            4: 246,    // B3
            8: 261,    // C4
            16: 293,   // D4
            32: 329,   // E4
            64: 349,   // F4
            128: 392,  // G4
            256: 440,  // A4
            512: 493,  // B4
            1024: 523, // C5
            2048: 587, // D5
        };

        const frequency = frequencies[tileValue] || 600;
        
        // Create oscillator for a soft, warm tone
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine'; // Soft, pure tone
        oscillator.frequency.value = frequency;

        // Gentle envelope: quick attack, medium decay
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    /**
     * Play a calm victory sound when reaching 2048
     */
    playVictorySound() {
        if (!this.enabled || !this.audioContext) return;

        const notes = [261, 329, 392, 523]; // C-E-G-C chord
        const startTime = this.audioContext.currentTime;

        notes.forEach((frequency, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;

            // Staggered, gentle arpeggio
            const noteStart = startTime + index * 0.1;
            gainNode.gain.setValueAtTime(0, noteStart);
            gainNode.gain.linearRampToValueAtTime(0.2, noteStart + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + 0.8);

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            oscillator.start(noteStart);
            oscillator.stop(noteStart + 1);
        });
    }

    /**
     * Play a soft click sound for UI interactions
     */
    playClickSound() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = 800;

        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    /**
     * Play a subtle slide/move sound
     */
    playMoveSound() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.06);

        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.06);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.08);
    }

    /**
     * Play sound for spawning a new tile
     */
    playSpawnSound() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = 600;

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.12);
    }

    /**
     * Play game over sound - calm descending notes
     */
    playGameOverSound() {
        if (!this.enabled || !this.audioContext) return;

        const notes = [392, 349, 293, 261]; // G-F-D-C (descending)
        const startTime = this.audioContext.currentTime;

        notes.forEach((frequency, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;

            const noteStart = startTime + index * 0.15;
            gainNode.gain.setValueAtTime(0, noteStart);
            gainNode.gain.linearRampToValueAtTime(0.15, noteStart + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + 0.5);

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            oscillator.start(noteStart);
            oscillator.stop(noteStart + 0.6);
        });
    }

    /**
     * Toggle audio on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        this.saveSetting('audio-enabled', this.enabled);
        return this.enabled;
    }

    /**
     * Set volume (0-1)
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
        this.saveSetting('audio-volume', this.volume);
    }

    /**
     * Check if audio is enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Get current volume
     */
    getVolume() {
        return this.volume;
    }
}

// Initialize audio manager
const audioManager = new AudioManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
