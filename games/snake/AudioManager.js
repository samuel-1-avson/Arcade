/**
 * Snake Game - Audio System
 * Dynamic soundtrack, sound effects, spatial audio, voice lines, and ambient soundscapes
 */

// Sound Effect Definitions
export const SOUND_EFFECTS = {
    // Movement
    move: { frequency: 200, duration: 0.05, type: 'square', volume: 0.1 },
    turn: { frequency: 300, duration: 0.08, type: 'sine', volume: 0.15 },
    
    // Food
    eat_normal: { frequency: 440, duration: 0.1, type: 'sine', volume: 0.3, sweep: 880 },
    eat_bonus: { frequency: 523, duration: 0.15, type: 'sine', volume: 0.4, sweep: 1046 },
    eat_powerup: { frequency: 660, duration: 0.2, type: 'triangle', volume: 0.5, sweep: 1320 },
    
    // Power-ups
    powerup_activate: { frequency: 440, duration: 0.3, type: 'sawtooth', volume: 0.4, sweep: 880 },
    powerup_expire: { frequency: 440, duration: 0.2, type: 'sawtooth', volume: 0.3, sweep: 220 },
    shield_hit: { frequency: 200, duration: 0.15, type: 'square', volume: 0.5 },
    
    // Combo
    combo_1: { frequency: 523, duration: 0.1, type: 'sine', volume: 0.3 },
    combo_5: { frequency: 659, duration: 0.12, type: 'sine', volume: 0.35 },
    combo_10: { frequency: 784, duration: 0.15, type: 'sine', volume: 0.4 },
    combo_20: { frequency: 1047, duration: 0.2, type: 'triangle', volume: 0.5 },
    combo_break: { frequency: 200, duration: 0.3, type: 'sawtooth', volume: 0.3, sweep: 100 },
    
    // Abilities
    dash: { frequency: 300, duration: 0.15, type: 'sawtooth', volume: 0.4, sweep: 600 },
    shield_burst: { frequency: 200, duration: 0.3, type: 'square', volume: 0.5, sweep: 400 },
    projectile: { frequency: 800, duration: 0.1, type: 'sawtooth', volume: 0.3 },
    time_warp: { frequency: 100, duration: 0.5, type: 'sine', volume: 0.4, sweep: 50 },
    
    // Ultimate
    ultimate_ready: { frequency: 440, duration: 0.5, type: 'triangle', volume: 0.5, sweep: 880 },
    ultimate_activate: { frequency: 220, duration: 0.8, type: 'sawtooth', volume: 0.6, sweep: 880 },
    
    // Boss
    boss_intro: { frequency: 100, duration: 1, type: 'sawtooth', volume: 0.5, sweep: 50 },
    boss_hit: { frequency: 150, duration: 0.2, type: 'square', volume: 0.5 },
    boss_phase: { frequency: 80, duration: 0.5, type: 'sawtooth', volume: 0.6, sweep: 160 },
    boss_defeat: { frequency: 220, duration: 1, type: 'triangle', volume: 0.6, sweep: 880 },
    
    // UI
    menu_hover: { frequency: 400, duration: 0.05, type: 'sine', volume: 0.1 },
    menu_select: { frequency: 600, duration: 0.1, type: 'sine', volume: 0.2 },
    menu_back: { frequency: 300, duration: 0.1, type: 'sine', volume: 0.15 },
    
    // Game State
    game_start: { frequency: 440, duration: 0.3, type: 'triangle', volume: 0.4, sweep: 880 },
    game_over: { frequency: 200, duration: 0.5, type: 'sawtooth', volume: 0.5, sweep: 50 },
    level_complete: { frequency: 523, duration: 0.5, type: 'triangle', volume: 0.5, sweep: 1047 },
    achievement: { frequency: 659, duration: 0.4, type: 'triangle', volume: 0.5, sweep: 1318 },
    
    // Collectibles
    collectible_pickup: { frequency: 880, duration: 0.3, type: 'triangle', volume: 0.4, sweep: 1760 },
    secret_found: { frequency: 440, duration: 0.6, type: 'sine', volume: 0.5, sweep: 1760 },
    
    // Death
    death: { frequency: 150, duration: 0.4, type: 'sawtooth', volume: 0.5, sweep: 50 },
    death_wall: { frequency: 100, duration: 0.3, type: 'square', volume: 0.5 },
    death_self: { frequency: 120, duration: 0.35, type: 'sawtooth', volume: 0.5, sweep: 60 }
};

// Voice Line Definitions
export const VOICE_LINES = {
    // Achievement voice lines (text-to-speech)
    first_blood: "First bite!",
    snake_10: "Growing strong!",
    snake_25: "Impressive length!",
    snake_50: "Incredible!",
    speed_demon: "Speed demon!",
    combo_master: "Combo master!",
    survivor: "Survivor!",
    power_hunter: "Power hunter!",
    boss_slayer: "Boss slayer!",
    
    // Gameplay
    combo_5: "Nice combo!",
    combo_10: "Amazing!",
    combo_20: "Unbelievable!",
    ultimate_ready: "Ultimate ready!",
    low_health: "Watch out!",
    
    // Boss
    boss_appear: "Boss incoming!",
    boss_phase: "Phase two!",
    boss_defeated: "Victory!",
    
    // General
    game_start: "Let's go!",
    game_over: "Game over.",
    new_high_score: "New high score!"
};

// Music Track Definitions (procedurally generated)
export const MUSIC_TRACKS = {
    menu: {
        bpm: 90,
        key: 'C',
        style: 'ambient',
        layers: ['pad', 'arpeggio'],
        mood: 'calm'
    },
    garden: {
        bpm: 110,
        key: 'G',
        style: 'chiptune',
        layers: ['bass', 'lead', 'drums'],
        mood: 'happy'
    },
    ice: {
        bpm: 100,
        key: 'Am',
        style: 'ambient',
        layers: ['pad', 'bells', 'bass'],
        mood: 'mysterious'
    },
    volcano: {
        bpm: 130,
        key: 'Dm',
        style: 'intense',
        layers: ['bass', 'lead', 'drums', 'fx'],
        mood: 'aggressive'
    },
    cyber: {
        bpm: 140,
        key: 'Em',
        style: 'synthwave',
        layers: ['synth_bass', 'arpeggio', 'drums', 'pad'],
        mood: 'energetic'
    },
    void: {
        bpm: 80,
        key: 'Bm',
        style: 'dark_ambient',
        layers: ['drone', 'fx', 'whispers'],
        mood: 'eerie'
    },
    boss: {
        bpm: 150,
        key: 'Dm',
        style: 'intense',
        layers: ['heavy_bass', 'lead', 'drums', 'fx'],
        mood: 'epic'
    }
};

// Note frequencies for music generation
const NOTE_FREQUENCIES = {
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77
};

// Scale patterns
const SCALES = {
    'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
    'Am': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    'Dm': ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
    'Em': ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
    'Bm': ['B', 'C#', 'D', 'E', 'F#', 'G', 'A']
};

export class AudioManager {
    constructor(game) {
        this.game = game;
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        
        this.currentTrack = null;
        this.musicNodes = [];
        this.isPlaying = false;
        
        this.spatialListener = null;
        
        // Voice synthesis
        this.speechSynthesis = window.speechSynthesis;
        this.voiceEnabled = true;
        
        // Settings from UI
        this.masterVolume = 0.8;
        this.musicVolume = 0.6;
        this.sfxVolume = 0.8;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        
        this.initAudioContext();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            
            // Music gain
            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.masterGain);
            
            // SFX gain
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.masterGain);
            
            // Spatial audio listener
            if (this.audioContext.listener) {
                this.spatialListener = this.audioContext.listener;
            }
            
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }
    
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    // Update settings from UI
    updateSettings(settings) {
        this.masterVolume = settings.masterVolume ?? this.masterVolume;
        this.musicVolume = settings.musicVolume ?? this.musicVolume;
        this.sfxVolume = settings.sfxVolume ?? this.sfxVolume;
        this.musicEnabled = settings.musicEnabled ?? this.musicEnabled;
        this.sfxEnabled = settings.sfxEnabled ?? this.sfxEnabled;
        
        if (this.masterGain) this.masterGain.gain.value = this.masterVolume;
        if (this.musicGain) this.musicGain.gain.value = this.musicEnabled ? this.musicVolume : 0;
        if (this.sfxGain) this.sfxGain.gain.value = this.sfxEnabled ? this.sfxVolume : 0;
    }
    
    // Play a sound effect
    playSFX(effectName, options = {}) {
        if (!this.audioContext || !this.sfxEnabled) return;
        
        const effect = SOUND_EFFECTS[effectName];
        if (!effect) return;
        
        this.resume();
        
        const now = this.audioContext.currentTime;
        
        // Create oscillator
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = effect.type || 'sine';
        oscillator.frequency.setValueAtTime(effect.frequency, now);
        
        // Frequency sweep
        if (effect.sweep) {
            oscillator.frequency.exponentialRampToValueAtTime(
                effect.sweep, 
                now + effect.duration
            );
        }
        
        // Create gain for envelope
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(effect.volume * (options.volume || 1), now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + effect.duration);
        
        // Spatial audio
        if (options.x !== undefined && options.y !== undefined) {
            const panner = this.audioContext.createStereoPanner();
            // Map game coordinates to stereo pan (-1 to 1)
            const pan = ((options.x / this.game.gridSize) * 2 - 1) * 0.5;
            panner.pan.setValueAtTime(pan, now);
            oscillator.connect(panner);
            panner.connect(gainNode);
        } else {
            oscillator.connect(gainNode);
        }
        
        gainNode.connect(this.sfxGain);
        
        oscillator.start(now);
        oscillator.stop(now + effect.duration);
    }
    
    // Play combo sound based on combo count
    playComboSound(combo) {
        if (combo >= 20) {
            this.playSFX('combo_20');
            this.speak('combo_20');
        } else if (combo >= 10) {
            this.playSFX('combo_10');
            this.speak('combo_10');
        } else if (combo >= 5) {
            this.playSFX('combo_5');
            this.speak('combo_5');
        } else {
            this.playSFX('combo_1');
        }
    }
    
    // Voice line using Web Speech API
    speak(lineKey) {
        if (!this.speechSynthesis || !this.voiceEnabled) return;
        
        const text = VOICE_LINES[lineKey];
        if (!text) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = this.masterVolume * 0.7;
        utterance.rate = 1.1;
        utterance.pitch = 1;
        
        // Use a suitable voice if available
        const voices = this.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) {
            utterance.voice = englishVoice;
        }
        
        this.speechSynthesis.speak(utterance);
    }
    
    // Start playing music for a track
    startMusic(trackName) {
        if (!this.audioContext || !this.musicEnabled) return;
        
        this.stopMusic();
        this.resume();
        
        const track = MUSIC_TRACKS[trackName];
        if (!track) return;
        
        this.currentTrack = trackName;
        this.isPlaying = true;
        
        // Generate and play procedural music
        this.generateMusic(track);
    }
    
    generateMusic(track) {
        const now = this.audioContext.currentTime;
        const beatDuration = 60 / track.bpm;
        
        // Generate different layers based on track style
        for (const layer of track.layers) {
            this.generateLayer(layer, track, beatDuration, now);
        }
    }
    
    generateLayer(layerType, track, beatDuration, startTime) {
        const scale = SCALES[track.key] || SCALES['C'];
        
        switch (layerType) {
            case 'bass':
            case 'synth_bass':
            case 'heavy_bass':
                this.generateBassLine(scale, beatDuration, startTime, layerType);
                break;
            case 'lead':
                this.generateMelody(scale, beatDuration, startTime);
                break;
            case 'arpeggio':
                this.generateArpeggio(scale, beatDuration, startTime);
                break;
            case 'drums':
                this.generateDrums(beatDuration, startTime);
                break;
            case 'pad':
            case 'drone':
                this.generatePad(scale, beatDuration, startTime);
                break;
            case 'bells':
                this.generateBells(scale, beatDuration, startTime);
                break;
            case 'fx':
            case 'whispers':
                this.generateFX(beatDuration, startTime);
                break;
        }
    }
    
    generateBassLine(scale, beatDuration, startTime, type) {
        const pattern = [0, 0, 4, 4, 3, 3, 4, 0]; // Scale degrees
        const duration = beatDuration * 8 * pattern.length;
        
        // Create looping bass
        const scheduleLoop = (loopStart) => {
            if (!this.isPlaying) return;
            
            pattern.forEach((degree, i) => {
                const note = scale[degree % scale.length];
                const freq = NOTE_FREQUENCIES[note + '3'] || 130.81;
                
                const osc = this.audioContext.createOscillator();
                osc.type = type === 'heavy_bass' ? 'sawtooth' : 'triangle';
                osc.frequency.value = freq;
                
                const gain = this.audioContext.createGain();
                const noteStart = loopStart + i * beatDuration;
                gain.gain.setValueAtTime(0.2, noteStart);
                gain.gain.exponentialRampToValueAtTime(0.01, noteStart + beatDuration * 0.9);
                
                osc.connect(gain);
                gain.connect(this.musicGain);
                
                osc.start(noteStart);
                osc.stop(noteStart + beatDuration);
                
                this.musicNodes.push(osc);
            });
            
            // Schedule next loop
            setTimeout(() => scheduleLoop(loopStart + duration), (duration - 0.5) * 1000);
        };
        
        scheduleLoop(startTime);
    }
    
    generateMelody(scale, beatDuration, startTime) {
        const scheduleLoop = (loopStart) => {
            if (!this.isPlaying) return;
            
            // Generate random melody based on scale
            for (let i = 0; i < 8; i++) {
                if (Math.random() > 0.3) {
                    const degree = Math.floor(Math.random() * scale.length);
                    const octave = Math.random() > 0.5 ? '5' : '4';
                    const note = scale[degree];
                    const freq = NOTE_FREQUENCIES[note + octave] || 440;
                    
                    const osc = this.audioContext.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    
                    const gain = this.audioContext.createGain();
                    const noteStart = loopStart + i * beatDuration;
                    const noteDuration = beatDuration * (Math.random() > 0.7 ? 2 : 1);
                    
                    gain.gain.setValueAtTime(0.15, noteStart);
                    gain.gain.exponentialRampToValueAtTime(0.01, noteStart + noteDuration * 0.8);
                    
                    osc.connect(gain);
                    gain.connect(this.musicGain);
                    
                    osc.start(noteStart);
                    osc.stop(noteStart + noteDuration);
                    
                    this.musicNodes.push(osc);
                }
            }
            
            setTimeout(() => scheduleLoop(loopStart + beatDuration * 8), beatDuration * 7.5 * 1000);
        };
        
        scheduleLoop(startTime);
    }
    
    generateArpeggio(scale, beatDuration, startTime) {
        const scheduleLoop = (loopStart) => {
            if (!this.isPlaying) return;
            
            const arpPattern = [0, 2, 4, 2]; // Scale degrees for arpeggio
            const noteDuration = beatDuration / 4;
            
            for (let bar = 0; bar < 4; bar++) {
                arpPattern.forEach((degree, i) => {
                    const note = scale[degree % scale.length];
                    const freq = NOTE_FREQUENCIES[note + '5'] || 523.25;
                    
                    const osc = this.audioContext.createOscillator();
                    osc.type = 'triangle';
                    osc.frequency.value = freq;
                    
                    const gain = this.audioContext.createGain();
                    const noteStart = loopStart + bar * beatDuration + i * noteDuration;
                    
                    gain.gain.setValueAtTime(0.1, noteStart);
                    gain.gain.exponentialRampToValueAtTime(0.01, noteStart + noteDuration * 0.9);
                    
                    osc.connect(gain);
                    gain.connect(this.musicGain);
                    
                    osc.start(noteStart);
                    osc.stop(noteStart + noteDuration);
                    
                    this.musicNodes.push(osc);
                });
            }
            
            setTimeout(() => scheduleLoop(loopStart + beatDuration * 4), beatDuration * 3.5 * 1000);
        };
        
        scheduleLoop(startTime);
    }
    
    generateDrums(beatDuration, startTime) {
        const scheduleLoop = (loopStart) => {
            if (!this.isPlaying) return;
            
            // Kick pattern
            for (let i = 0; i < 4; i++) {
                this.playDrumHit('kick', loopStart + i * beatDuration);
            }
            
            // Snare on 2 and 4
            this.playDrumHit('snare', loopStart + beatDuration);
            this.playDrumHit('snare', loopStart + beatDuration * 3);
            
            // Hi-hat
            for (let i = 0; i < 8; i++) {
                this.playDrumHit('hihat', loopStart + i * beatDuration / 2);
            }
            
            setTimeout(() => scheduleLoop(loopStart + beatDuration * 4), beatDuration * 3.5 * 1000);
        };
        
        scheduleLoop(startTime);
    }
    
    playDrumHit(type, time) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        switch (type) {
            case 'kick':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(150, time);
                osc.frequency.exponentialRampToValueAtTime(50, time + 0.1);
                gain.gain.setValueAtTime(0.5, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
                break;
            case 'snare':
                osc.type = 'triangle';
                osc.frequency.value = 200;
                gain.gain.setValueAtTime(0.3, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
                break;
            case 'hihat':
                osc.type = 'square';
                osc.frequency.value = 8000;
                gain.gain.setValueAtTime(0.05, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
                break;
        }
        
        osc.connect(gain);
        gain.connect(this.musicGain);
        
        osc.start(time);
        osc.stop(time + 0.2);
        
        this.musicNodes.push(osc);
    }
    
    generatePad(scale, beatDuration, startTime) {
        const scheduleLoop = (loopStart) => {
            if (!this.isPlaying) return;
            
            // Play a chord pad
            const chord = [0, 2, 4]; // Root, third, fifth
            
            chord.forEach(degree => {
                const note = scale[degree % scale.length];
                const freq = NOTE_FREQUENCIES[note + '4'] || 261.63;
                
                const osc = this.audioContext.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                const gain = this.audioContext.createGain();
                const duration = beatDuration * 8;
                
                gain.gain.setValueAtTime(0, loopStart);
                gain.gain.linearRampToValueAtTime(0.08, loopStart + 1);
                gain.gain.linearRampToValueAtTime(0.08, loopStart + duration - 1);
                gain.gain.linearRampToValueAtTime(0, loopStart + duration);
                
                osc.connect(gain);
                gain.connect(this.musicGain);
                
                osc.start(loopStart);
                osc.stop(loopStart + duration);
                
                this.musicNodes.push(osc);
            });
            
            setTimeout(() => scheduleLoop(loopStart + beatDuration * 8), beatDuration * 7 * 1000);
        };
        
        scheduleLoop(startTime);
    }
    
    generateBells(scale, beatDuration, startTime) {
        const scheduleLoop = (loopStart) => {
            if (!this.isPlaying) return;
            
            // Occasional bell hits
            for (let i = 0; i < 4; i++) {
                if (Math.random() > 0.5) {
                    const degree = Math.floor(Math.random() * scale.length);
                    const note = scale[degree];
                    const freq = NOTE_FREQUENCIES[note + '5'] || 523.25;
                    
                    const osc = this.audioContext.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    
                    const gain = this.audioContext.createGain();
                    const noteStart = loopStart + i * beatDuration * 2;
                    
                    gain.gain.setValueAtTime(0.12, noteStart);
                    gain.gain.exponentialRampToValueAtTime(0.01, noteStart + 1);
                    
                    osc.connect(gain);
                    gain.connect(this.musicGain);
                    
                    osc.start(noteStart);
                    osc.stop(noteStart + 1);
                    
                    this.musicNodes.push(osc);
                }
            }
            
            setTimeout(() => scheduleLoop(loopStart + beatDuration * 8), beatDuration * 7 * 1000);
        };
        
        scheduleLoop(startTime);
    }
    
    generateFX(beatDuration, startTime) {
        const scheduleLoop = (loopStart) => {
            if (!this.isPlaying) return;
            
            // Random ambient FX
            if (Math.random() > 0.7) {
                const osc = this.audioContext.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = 50 + Math.random() * 100;
                
                const gain = this.audioContext.createGain();
                const duration = 2 + Math.random() * 2;
                
                gain.gain.setValueAtTime(0, loopStart);
                gain.gain.linearRampToValueAtTime(0.03, loopStart + duration / 2);
                gain.gain.linearRampToValueAtTime(0, loopStart + duration);
                
                osc.connect(gain);
                gain.connect(this.musicGain);
                
                osc.start(loopStart);
                osc.stop(loopStart + duration);
                
                this.musicNodes.push(osc);
            }
            
            setTimeout(() => scheduleLoop(loopStart + beatDuration * 4), beatDuration * 3.5 * 1000);
        };
        
        scheduleLoop(startTime);
    }
    
    // Stop all music
    stopMusic() {
        this.isPlaying = false;
        
        for (const node of this.musicNodes) {
            try {
                node.stop();
                node.disconnect();
            } catch (e) {
                // Already stopped
            }
        }
        
        this.musicNodes = [];
        this.currentTrack = null;
    }
    
    // Fade out music
    fadeOutMusic(duration = 1) {
        if (!this.musicGain) return;
        
        const now = this.audioContext.currentTime;
        this.musicGain.gain.linearRampToValueAtTime(0, now + duration);
        
        setTimeout(() => {
            this.stopMusic();
            this.musicGain.gain.value = this.musicVolume;
        }, duration * 1000);
    }
    
    // Ambient soundscape
    startAmbience(type) {
        if (!this.audioContext) return;
        
        this.resume();
        
        switch (type) {
            case 'wind':
                this.createWindAmbience();
                break;
            case 'rain':
                this.createRainAmbience();
                break;
            case 'fire':
                this.createFireAmbience();
                break;
            case 'digital':
                this.createDigitalAmbience();
                break;
        }
    }
    
    createWindAmbience() {
        // Create filtered noise for wind
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.05;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        
        noise.start();
        
        this.musicNodes.push(noise);
    }
    
    createRainAmbience() {
        // Higher frequency noise for rain
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.03;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        
        noise.start();
        
        this.musicNodes.push(noise);
    }
    
    createFireAmbience() {
        // Crackling fire
        const scheduleLoop = (loopStart) => {
            if (!this.isPlaying) return;
            
            for (let i = 0; i < 10; i++) {
                if (Math.random() > 0.3) {
                    const osc = this.audioContext.createOscillator();
                    osc.type = 'sawtooth';
                    osc.frequency.value = 80 + Math.random() * 50;
                    
                    const gain = this.audioContext.createGain();
                    const start = loopStart + Math.random() * 2;
                    const duration = 0.05 + Math.random() * 0.1;
                    
                    gain.gain.setValueAtTime(0.02 + Math.random() * 0.02, start);
                    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
                    
                    osc.connect(gain);
                    gain.connect(this.musicGain);
                    
                    osc.start(start);
                    osc.stop(start + duration);
                    
                    this.musicNodes.push(osc);
                }
            }
            
            setTimeout(() => scheduleLoop(loopStart + 2), 1500);
        };
        
        scheduleLoop(this.audioContext.currentTime);
    }
    
    createDigitalAmbience() {
        // Glitchy digital sounds
        const scheduleLoop = (loopStart) => {
            if (!this.isPlaying) return;
            
            for (let i = 0; i < 5; i++) {
                if (Math.random() > 0.6) {
                    const osc = this.audioContext.createOscillator();
                    osc.type = 'square';
                    osc.frequency.value = 200 + Math.random() * 2000;
                    
                    const gain = this.audioContext.createGain();
                    const start = loopStart + Math.random() * 3;
                    const duration = 0.02 + Math.random() * 0.05;
                    
                    gain.gain.setValueAtTime(0.01, start);
                    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
                    
                    osc.connect(gain);
                    gain.connect(this.musicGain);
                    
                    osc.start(start);
                    osc.stop(start + duration);
                    
                    this.musicNodes.push(osc);
                }
            }
            
            setTimeout(() => scheduleLoop(loopStart + 3), 2500);
        };
        
        scheduleLoop(this.audioContext.currentTime);
    }
    
    // Cleanup
    dispose() {
        this.stopMusic();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}
