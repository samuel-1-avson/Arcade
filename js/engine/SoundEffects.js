/**
 * Sound Effects Manager
 * Provides synthesized sound effects using Web Audio API
 * No external audio files needed!
 */

class SoundEffects {
    constructor() {
        this.enabled = true;
        this.volume = 0.5;
        this.audioContext = null;
        
        // Load settings
        this.loadSettings();
    }

    init() {
        if (this.audioContext) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('arcadeHub_settings') || '{}');
            this.enabled = settings.soundEnabled !== false;
            this.volume = settings.soundVolume ?? 0.5;
        } catch (e) {}
    }

    saveSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('arcadeHub_settings') || '{}');
            settings.soundEnabled = this.enabled;
            settings.soundVolume = this.volume;
            localStorage.setItem('arcadeHub_settings', JSON.stringify(settings));
        } catch (e) {}
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.saveSettings();
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }

    toggle() {
        this.enabled = !this.enabled;
        this.saveSettings();
        return this.enabled;
    }

    // Core sound generation
    playNote(frequency, duration, type = 'square', volume = 1) {
        if (!this.enabled) return;
        this.init();
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        const now = this.audioContext.currentTime;
        const finalVolume = this.volume * volume * 0.3;

        gainNode.gain.setValueAtTime(finalVolume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    playNoise(duration, volume = 1) {
        if (!this.enabled) return;
        this.init();
        if (!this.audioContext) return;

        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;
        const finalVolume = this.volume * volume * 0.2;

        gainNode.gain.setValueAtTime(finalVolume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        source.start(now);
    }

    // === GAME SOUND EFFECTS ===

    // General
    click() {
        this.playNote(800, 0.05, 'square', 0.3);
    }

    hover() {
        this.playNote(600, 0.03, 'sine', 0.2);
    }

    // Score / Points
    point() {
        this.playNote(880, 0.1, 'square', 0.4);
    }

    bonus() {
        this.playNote(523, 0.1, 'square', 0.5);
        setTimeout(() => this.playNote(659, 0.1, 'square', 0.5), 100);
        setTimeout(() => this.playNote(784, 0.15, 'square', 0.5), 200);
    }

    levelUp() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playNote(freq, 0.15, 'square', 0.5), i * 100);
        });
    }

    // Negative
    hit() {
        this.playNoise(0.1, 0.6);
    }

    die() {
        this.playNote(200, 0.3, 'sawtooth', 0.6);
        setTimeout(() => this.playNote(150, 0.3, 'sawtooth', 0.5), 150);
        setTimeout(() => this.playNote(100, 0.4, 'sawtooth', 0.4), 300);
    }

    gameOver() {
        const notes = [392, 349, 330, 262];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playNote(freq, 0.3, 'triangle', 0.5), i * 200);
        });
    }

    // Movement
    move() {
        this.playNote(300, 0.03, 'square', 0.2);
    }

    jump() {
        this.init();
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'square';
        const now = this.audioContext.currentTime;

        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);

        gainNode.gain.setValueAtTime(this.volume * 0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        oscillator.start(now);
        oscillator.stop(now + 0.15);
    }

    land() {
        this.playNote(100, 0.05, 'square', 0.3);
    }

    // Actions
    shoot() {
        this.init();
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'square';
        const now = this.audioContext.currentTime;

        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.1);

        gainNode.gain.setValueAtTime(this.volume * 0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }

    explosion() {
        this.playNoise(0.3, 0.8);
    }

    powerUp() {
        const notes = [392, 523, 659, 784];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playNote(freq, 0.1, 'sine', 0.4), i * 50);
        });
    }

    // Tetris specific
    rotate() {
        this.playNote(400, 0.05, 'square', 0.3);
    }

    lineClear() {
        this.playNote(523, 0.1, 'square', 0.4);
        setTimeout(() => this.playNote(659, 0.1, 'square', 0.4), 50);
    }

    tetris() {
        const notes = [523, 659, 784, 1047, 784, 659, 523];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playNote(freq, 0.1, 'square', 0.5), i * 60);
        });
    }

    // Pac-Man specific
    chomp() {
        this.playNote(260, 0.05, 'square', 0.2);
        setTimeout(() => this.playNote(520, 0.05, 'square', 0.2), 50);
    }

    eatGhost() {
        const notes = [200, 300, 400, 500, 600, 700, 800];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playNote(freq, 0.04, 'square', 0.4), i * 30);
        });
    }

    siren() {
        // Background siren for Pac-Man (low priority)
        this.playNote(200, 0.3, 'sine', 0.1);
    }

    // Minesweeper
    flag() {
        this.playNote(600, 0.05, 'square', 0.3);
        setTimeout(() => this.playNote(800, 0.05, 'square', 0.3), 50);
    }

    reveal() {
        this.playNote(400, 0.03, 'sine', 0.2);
    }

    mineExplode() {
        this.playNoise(0.5, 1);
    }

    // Win
    win() {
        const melody = [523, 587, 659, 698, 784, 880, 988, 1047];
        melody.forEach((freq, i) => {
            setTimeout(() => this.playNote(freq, 0.15, 'square', 0.4), i * 100);
        });
    }
}

// Singleton instance
export const soundEffects = new SoundEffects();

// Also export class for custom instances
export { SoundEffects };
