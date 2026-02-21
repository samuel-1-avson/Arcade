/**
 * AudioService - Centralized Audio Management
 * Handles Background Music (BGM) and Sound Effects (SFX)
 */
import { globalStateManager } from './GlobalStateManager.js';
import { logger, LogCategory } from '../utils/logger.js';

class AudioService {
    constructor() {
        this.bgm = null;
        this.sfx = {};
        this.isMuted = {
            music: false,
            sound: false
        };
        this.volume = {
            music: 0.5,
            sound: 0.7
        };
        
        // Sound library
        this.sounds = {
            hover: 'assets/audio/hover.mp3',
            click: 'assets/audio/click.mp3',
            success: 'assets/audio/success.mp3',
            error: 'assets/audio/error.mp3',
            levelUp: 'assets/audio/levelup.mp3',
            achievement: 'assets/audio/achievement.mp3',
            notification: 'assets/audio/notification.mp3'
        };

        this.initialized = false;
        
        // Web Audio Context
        this.ctx = null;
        this.mainBus = null;
        this.reverbNode = null;
        this.ambienceNodes = [];
    }

    init() {
        if (this.initialized) return;

        // Load preferences
        const prefs = globalStateManager.getProfile().preferences;
        this.isMuted.music = !prefs.musicEnabled;
        this.isMuted.sound = !prefs.soundEnabled;

        // Preload core SFX (using simple oscillators for now if files missing, 
        // but structured for real assets)
        // In a real AAA app, we'd preload the actual buffer here.
        // Initialize Web Audio
        try {
            // Web Audio Context - Initialize lazily
            this.ctx = null;
        } catch (e) {
            logger.warn(LogCategory.AUDIO, 'Web Audio support check failed', e);
        }

        this.initialized = true;
        logger.info(LogCategory.AUDIO, 'AudioService initialized (waiting for user gesture)');

        // Add unlock listeners
        const unlockHandler = () => {
            this._tryInitContext();
            // Remove listeners after first successful interaction
            window.removeEventListener('click', unlockHandler);
            window.removeEventListener('keydown', unlockHandler);
            window.removeEventListener('touchstart', unlockHandler);
        };

        window.addEventListener('click', unlockHandler);
        window.addEventListener('keydown', unlockHandler);
        window.addEventListener('touchstart', unlockHandler);
    }

    _tryInitContext() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(e => logger.warn(LogCategory.AUDIO, 'Audio resume failed', e));
            }
            return;
        }

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            
            this.mainBus = this.ctx.createGain();
            this.mainBus.connect(this.ctx.destination);
            
            // Create Reverb for Space Feel
            this.reverbNode = this._createReverb();
            this.reverbNode.connect(this.mainBus);
            
            // Start Ambience
            this._startAmbience();
            
            logger.info(LogCategory.AUDIO, 'AudioContext started successfully');
        } catch (e) {
            logger.warn(LogCategory.AUDIO, 'AudioContext init failed', e);
        }

        this.initialized = true;
        logger.info(LogCategory.AUDIO, 'AudioService initialized with AAA Audio');

        // Subscribe to preference changes
        // checking periodically or hooking into save event in GlobalStateManager
        // For now, we update when play is called or via specific setter
    }

    /**
     * Play a sound effect
     * @param {string} name - Key from this.sounds
     */
    playSFX(name) {
        if (this.isMuted.sound) return;

        // For this demo, since we don't have actual files, we will simulate 
        // with a generated beep if the file fails, or just log meant-to-play.
        // real implementation would use: new Audio(this.sounds[name]).play()
        
        // We will try to establish a AudioContext for synthesized sounds fallback
        // to ensure the user hears *something* immediately.
        try {
            this._playSynthSound(name);
        } catch (e) {
            logger.warn(LogCategory.AUDIO, 'Audio play failed', e);
        }
    }

    /**
     * Play background music
     * @param {string} trackUrl 
     */
    playBGM(trackUrl) {
        if (this.isMuted.music) return;
        
        if (this.bgm) {
            this.bgm.pause();
        }

        this.bgm = new Audio(trackUrl);
        this.bgm.loop = true;
        this.bgm.volume = this.volume.music;
        this.bgm.play().catch(e => logger.info(LogCategory.AUDIO, 'Autoplay prevented', e));
    }

    setMusicEnabled(enabled) {
        this.isMuted.music = !enabled;
        if (!enabled && this.bgm) {
            this.bgm.pause();
        } else if (enabled && this.bgm) {
            this.bgm.play();
        }
    }

    setSoundEnabled(enabled) {
        this.isMuted.sound = !enabled;
    }

    /**
     * Simple synthesizer fallback for UI sounds so we don't need external assets immediately
     */

    _createReverb() {
        const convolver = this.ctx.createConvolver();
        const rate = this.ctx.sampleRate;
        const length = rate * 3.0; // 3 seconds reverb
        const decay = 2.0;
        const impulse = this.ctx.createBuffer(2, length, rate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const n = length - i;
            left[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
            right[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
        }

        convolver.buffer = impulse;
        return convolver;
    }

    _startAmbience() {
        if (!this.ctx || this.isMuted.music) return;
        
        // Create a deep space drone using 3 oscillators
        const frequencies = [55, 110, 165]; // A1, A2, E3
        
        frequencies.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const panner = this.ctx.createStereoPanner();
            
            osc.type = i === 0 ? 'sine' : 'triangle';
            osc.frequency.value = freq;
            
            // Detune slowly for "drift"
            const lfo = this.ctx.createOscillator();
            lfo.frequency.value = 0.1 + (Math.random() * 0.1);
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.value = 5;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.detune);
            lfo.start();

            gain.gain.value = 0.03; // Very quiet
            panner.pan.value = (Math.random() * 2) - 1;

            osc.connect(gain);
            gain.connect(panner);
            panner.connect(this.reverbNode); // Send to reverb
            
            osc.start();
            
            this.ambienceNodes.push({ osc, gain, lfo });
        });
    }

    _playSynthSound(type) {
        if (!this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Route through reverb for "Space UI" feel
        osc.connect(gain);
        gain.connect(this.mainBus);
        gain.connect(this.reverbNode); 

        const now = this.ctx.currentTime;
        
        switch (type) {
             case 'hover':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
                gain.gain.setValueAtTime(0.02, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
                
            case 'click':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'success':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(554, now + 0.1); // C#
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
                
            case 'notification':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
        }
    }
}

export const audioService = new AudioService();
export default AudioService;
