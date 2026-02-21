/**
 * AudioManager - Sound effect and music management using Howler.js
 * Handles loading, playing, and controlling audio with volume/mute support
 */
import { eventBus, GameEvents } from './EventBus.js';
import { logger, LogCategory } from '../utils/logger.js';

class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.bgMusic = null;
        this.currentMusicId = null;

        this.isMuted = false;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.5;

        // Load settings from localStorage
        this._loadSettings();

        // Listen for audio events
        eventBus.on(GameEvents.SOUND_PLAY, ({ id, options }) => this.play(id, options));
        eventBus.on(GameEvents.MUSIC_PLAY, ({ id, loop }) => this.playMusic(id, loop));
        eventBus.on(GameEvents.MUSIC_STOP, () => this.stopMusic());
    }

    /**
     * Load a manifest of sounds
     * @param {Object} manifest - Sound definitions { id: { src, volume?, loop? } }
     * @returns {Promise} Resolves when all sounds are loaded
     */
    async loadSounds(manifest) {
        const loadPromises = [];

        for (const [id, config] of Object.entries(manifest)) {
            const promise = new Promise((resolve, reject) => {
                // Using Howler.js if available, fallback to Audio
                if (typeof Howl !== 'undefined') {
                    const sound = new Howl({
                        src: Array.isArray(config.src) ? config.src : [config.src],
                        volume: config.volume ?? this.sfxVolume,
                        loop: config.loop ?? false,
                        preload: true,
                        onload: () => resolve(),
                        onloaderror: (_, error) => {
                            logger.warn(LogCategory.AUDIO, `Failed to load sound: ${id}`, error);
                            resolve(); // Don't fail completely
                        }
                    });
                    this.sounds.set(id, sound);
                } else {
                    // Fallback to HTMLAudioElement
                    const audio = new Audio(config.src);
                    audio.volume = config.volume ?? this.sfxVolume;
                    audio.loop = config.loop ?? false;
                    audio.preload = 'auto';
                    audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                    audio.addEventListener('error', () => {
                        logger.warn(LogCategory.AUDIO, `Failed to load sound: ${id}`);
                        resolve();
                    }, { once: true });
                    this.sounds.set(id, audio);
                }
            });
            loadPromises.push(promise);
        }

        return Promise.all(loadPromises);
    }

    /**
     * Play a sound effect
     * @param {string} id - Sound ID
     * @param {Object} options - Play options { volume?, rate? }
     */
    play(id, options = {}) {
        if (this.isMuted) return;

        const sound = this.sounds.get(id);
        if (!sound) {
            logger.warn(LogCategory.AUDIO, `Sound not found: ${id}`);
            return;
        }

        if (typeof Howl !== 'undefined' && sound instanceof Howl) {
            const soundId = sound.play();
            if (options.volume !== undefined) {
                sound.volume(options.volume, soundId);
            }
            if (options.rate !== undefined) {
                sound.rate(options.rate, soundId);
            }
        } else {
            // HTMLAudioElement fallback
            const clone = sound.cloneNode();
            clone.volume = options.volume ?? sound.volume;
            if (options.rate) clone.playbackRate = options.rate;
            clone.play().catch(() => {});
        }
    }

    /**
     * Play background music
     * @param {string} id - Music ID
     * @param {boolean} loop - Whether to loop
     */
    playMusic(id, loop = true) {
        if (this.currentMusicId === id) return;

        this.stopMusic();

        const music = this.sounds.get(id);
        if (!music) {
            logger.warn(LogCategory.AUDIO, `Music not found: ${id}`);
            return;
        }

        this.bgMusic = music;
        this.currentMusicId = id;

        if (typeof Howl !== 'undefined' && music instanceof Howl) {
            music.loop(loop);
            music.volume(this.isMuted ? 0 : this.musicVolume);
            music.play();
        } else {
            music.loop = loop;
            music.volume = this.isMuted ? 0 : this.musicVolume;
            music.play().catch(() => {});
        }
    }

    /**
     * Stop background music
     */
    stopMusic() {
        if (this.bgMusic) {
            if (typeof Howl !== 'undefined' && this.bgMusic instanceof Howl) {
                this.bgMusic.stop();
            } else {
                this.bgMusic.pause();
                this.bgMusic.currentTime = 0;
            }
            this.bgMusic = null;
            this.currentMusicId = null;
        }
    }

    /**
     * Pause background music
     */
    pauseMusic() {
        if (this.bgMusic) {
            if (typeof Howl !== 'undefined' && this.bgMusic instanceof Howl) {
                this.bgMusic.pause();
            } else {
                this.bgMusic.pause();
            }
        }
    }

    /**
     * Resume background music
     */
    resumeMusic() {
        if (this.bgMusic && !this.isMuted) {
            if (typeof Howl !== 'undefined' && this.bgMusic instanceof Howl) {
                this.bgMusic.play();
            } else {
                this.bgMusic.play().catch(() => {});
            }
        }
    }

    /**
     * Set sound effects volume
     * @param {number} volume - Volume level (0-1)
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this._saveSettings();
    }

    /**
     * Set music volume
     * @param {number} volume - Volume level (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));

        if (this.bgMusic && !this.isMuted) {
            if (typeof Howl !== 'undefined' && this.bgMusic instanceof Howl) {
                this.bgMusic.volume(this.musicVolume);
            } else {
                this.bgMusic.volume = this.musicVolume;
            }
        }

        this._saveSettings();
    }

    /**
     * Toggle mute state
     */
    toggleMute() {
        this.isMuted = !this.isMuted;

        if (this.bgMusic) {
            if (typeof Howl !== 'undefined' && this.bgMusic instanceof Howl) {
                this.bgMusic.volume(this.isMuted ? 0 : this.musicVolume);
            } else {
                this.bgMusic.volume = this.isMuted ? 0 : this.musicVolume;
            }
        }

        this._saveSettings();
        return this.isMuted;
    }

    /**
     * Mute all audio
     */
    mute() {
        this.isMuted = true;
        if (this.bgMusic) {
            if (typeof Howl !== 'undefined' && this.bgMusic instanceof Howl) {
                this.bgMusic.volume(0);
            } else {
                this.bgMusic.volume = 0;
            }
        }
        this._saveSettings();
    }

    /**
     * Unmute all audio
     */
    unmute() {
        this.isMuted = false;
        if (this.bgMusic) {
            if (typeof Howl !== 'undefined' && this.bgMusic instanceof Howl) {
                this.bgMusic.volume(this.musicVolume);
            } else {
                this.bgMusic.volume = this.musicVolume;
            }
        }
        this._saveSettings();
    }

    // Private methods

    _loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('arcadeHub_audioSettings'));
            if (settings) {
                this.isMuted = settings.isMuted ?? false;
                this.sfxVolume = settings.sfxVolume ?? 0.7;
                this.musicVolume = settings.musicVolume ?? 0.5;
            }
        } catch (e) {
            // Use defaults
        }
    }

    _saveSettings() {
        try {
            localStorage.setItem('arcadeHub_audioSettings', JSON.stringify({
                isMuted: this.isMuted,
                sfxVolume: this.sfxVolume,
                musicVolume: this.musicVolume
            }));
        } catch (e) {
            // localStorage might be unavailable
        }
    }
}

// Create singleton instance
export const audioManager = new AudioManager();
export default AudioManager;
