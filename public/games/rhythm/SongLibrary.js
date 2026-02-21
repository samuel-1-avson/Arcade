/**
 * Rhythm Game - Song Library
 * Songs with audio file support and beat patterns
 */

// Genre definitions
export const GENRES = {
    POP: 'pop',
    EDM: 'edm',
    ROCK: 'rock',
    CLASSICAL: 'classical'
};

// Song difficulty levels
export const DIFFICULTY = {
    EASY: 1,
    NORMAL: 2,
    HARD: 3,
    EXPERT: 4,
    MASTER: 5
};

/**
 * Generate beat patterns algorithmically based on BPM
 * Creates musically coherent patterns that match the song's rhythm
 */
function generateBeatPattern(bpm, duration, difficulty, options = {}) {
    const beatInterval = 60 / bpm;
    const notes = [];
    let time = 2; // Start after 2 seconds
    
    const density = 0.2 + (difficulty * 0.15);
    const holdChance = options.holdNotes ? 0.1 + (difficulty * 0.05) : 0;
    const slideChance = options.slideNotes ? 0.05 + (difficulty * 0.03) : 0;
    
    // Pattern generators for more musical feel
    const patterns = {
        single: (t, lane) => [{ time: t, lane, type: 'tap' }],
        double: (t, lanes) => lanes.map(lane => ({ time: t, lane, type: 'tap' })),
        roll: (t, startLane, count) => {
            const notes = [];
            for (let i = 0; i < count; i++) {
                notes.push({
                    time: t + (i * beatInterval * 0.25),
                    lane: (startLane + i) % 4,
                    type: 'tap'
                });
            }
            return notes;
        },
        hold: (t, lane, beats) => [{
            time: t,
            lane,
            type: 'hold',
            duration: beats * beatInterval
        }],
        slide: (t, startLane, endLane) => [{
            time: t,
            lane: startLane,
            type: 'slide',
            endLane
        }]
    };
    
    let measureCount = 0;
    
    while (time < duration) {
        measureCount++;
        
        // Every 4 beats, potentially add a pattern
        for (let beat = 0; beat < 4; beat++) {
            const currentTime = time + (beat * beatInterval);
            
            if (Math.random() < density) {
                const lane = Math.floor(Math.random() * 4);
                const rand = Math.random();
                
                if (rand < holdChance && beat < 3) {
                    // Hold note (1-2 beats)
                    const holdBeats = 1 + Math.floor(Math.random() * 2);
                    notes.push(...patterns.hold(currentTime, lane, holdBeats));
                } else if (rand < holdChance + slideChance) {
                    // Slide note
                    const endLane = (lane + 1 + Math.floor(Math.random() * 2)) % 4;
                    notes.push(...patterns.slide(currentTime, lane, endLane));
                } else if (rand < 0.2 && difficulty >= 3) {
                    // Double notes for harder difficulties
                    const lane2 = (lane + 2) % 4;
                    notes.push(...patterns.double(currentTime, [lane, lane2]));
                } else if (rand < 0.15 && difficulty >= 4) {
                    // Roll pattern for expert
                    notes.push(...patterns.roll(currentTime, lane, 4));
                } else {
                    // Single tap
                    notes.push(...patterns.single(currentTime, lane));
                }
            }
            
            // Add off-beat notes for higher difficulties
            if (difficulty >= 3 && Math.random() < density * 0.3) {
                const offBeatTime = currentTime + (beatInterval * 0.5);
                const offLane = Math.floor(Math.random() * 4);
                notes.push({ time: offBeatTime, lane: offLane, type: 'tap' });
            }
        }
        
        time += 4 * beatInterval; // Move to next measure
    }
    
    return notes.sort((a, b) => a.time - b.time);
}

/**
 * Song Library - All available songs
 */
export const SONG_LIBRARY = {
    // === POP Songs ===
    sunset_drive: {
        id: 'sunset_drive',
        name: 'Sunset Drive',
        artist: 'Retro Waves',
        genre: GENRES.POP,
        bpm: 110,
        duration: 75,
        difficulty: DIFFICULTY.EASY,
        unlocked: true,
        thumbnail: '🌅',
        audioFile: null, // Audio file path when available
        patterns: null,  // Will be generated
        description: 'A smooth, easy-going track perfect for beginners'
    },
    city_lights: {
        id: 'city_lights',
        name: 'City Lights',
        artist: 'Neon Echo',
        genre: GENRES.POP,
        bpm: 120,
        duration: 80,
        difficulty: DIFFICULTY.NORMAL,
        unlocked: true,
        thumbnail: '🌃',
        audioFile: null,
        patterns: null,
        description: 'Feel the pulse of the city in this upbeat track'
    },
    starlight_serenade: {
        id: 'starlight_serenade',
        name: 'Starlight Serenade',
        artist: 'Luna Keys',
        genre: GENRES.POP,
        bpm: 100,
        duration: 90,
        difficulty: DIFFICULTY.NORMAL,
        unlocked: false,
        thumbnail: '⭐',
        audioFile: null,
        patterns: null,
        description: 'A dreamy melody under the stars'
    },
    
    // === EDM Songs ===
    neon_pulse: {
        id: 'neon_pulse',
        name: 'Neon Pulse',
        artist: 'DJ Synthwave',
        genre: GENRES.EDM,
        bpm: 140,
        duration: 85,
        difficulty: DIFFICULTY.HARD,
        unlocked: false,
        thumbnail: '💜',
        audioFile: null,
        patterns: null,
        description: 'High-energy beats with rapid patterns'
    },
    digital_dreams: {
        id: 'digital_dreams',
        name: 'Digital Dreams',
        artist: 'Circuit Breaker',
        genre: GENRES.EDM,
        bpm: 128,
        duration: 90,
        difficulty: DIFFICULTY.NORMAL,
        unlocked: true,
        thumbnail: '💠',
        audioFile: null,
        patterns: null,
        description: 'Enter the digital realm'
    },
    bass_cannon: {
        id: 'bass_cannon',
        name: 'Bass Cannon',
        artist: 'SubWoofer',
        genre: GENRES.EDM,
        bpm: 150,
        duration: 80,
        difficulty: DIFFICULTY.EXPERT,
        unlocked: false,
        thumbnail: '🔊',
        audioFile: null,
        patterns: null,
        description: 'Warning: Extreme bass ahead'
    },
    
    // === ROCK Songs ===
    thunder_road: {
        id: 'thunder_road',
        name: 'Thunder Road',
        artist: 'Storm Riders',
        genre: GENRES.ROCK,
        bpm: 135,
        duration: 85,
        difficulty: DIFFICULTY.HARD,
        unlocked: false,
        thumbnail: '⚡',
        audioFile: null,
        patterns: null,
        description: 'Rock hard with relentless energy'
    },
    midnight_rider: {
        id: 'midnight_rider',
        name: 'Midnight Rider',
        artist: 'The Shadows',
        genre: GENRES.ROCK,
        bpm: 125,
        duration: 80,
        difficulty: DIFFICULTY.NORMAL,
        unlocked: true,
        thumbnail: '🏍️',
        audioFile: null,
        patterns: null,
        description: 'A classic rock journey into the night'
    },
    final_stand: {
        id: 'final_stand',
        name: 'Final Stand',
        artist: 'Iron Will',
        genre: GENRES.ROCK,
        bpm: 160,
        duration: 90,
        difficulty: DIFFICULTY.MASTER,
        unlocked: false,
        thumbnail: '🎸',
        audioFile: null,
        patterns: null,
        description: 'The ultimate rock challenge'
    },
    
    // === CLASSICAL Songs ===
    moonlight_sonata: {
        id: 'moonlight_sonata',
        name: 'Moonlight Sonata',
        artist: 'Piano Dreams',
        genre: GENRES.CLASSICAL,
        bpm: 72,
        duration: 120,
        difficulty: DIFFICULTY.EASY,
        unlocked: true,
        thumbnail: '🌙',
        audioFile: null,
        patterns: null,
        description: 'A serene classical masterpiece'
    },
    flight_of_fancy: {
        id: 'flight_of_fancy',
        name: 'Flight of Fancy',
        artist: 'Orchestra Nova',
        genre: GENRES.CLASSICAL,
        bpm: 140,
        duration: 75,
        difficulty: DIFFICULTY.EXPERT,
        unlocked: false,
        thumbnail: '🎻',
        audioFile: null,
        patterns: null,
        description: 'Fast-paced classical with intricate patterns'
    },
    symphony_of_stars: {
        id: 'symphony_of_stars',
        name: 'Symphony of Stars',
        artist: 'Celestial Ensemble',
        genre: GENRES.CLASSICAL,
        bpm: 95,
        duration: 100,
        difficulty: DIFFICULTY.HARD,
        unlocked: false,
        thumbnail: '✨',
        audioFile: null,
        patterns: null,
        description: 'An epic orchestral experience'
    }
};

/**
 * Song Manager Class
 * Handles loading, playing, and managing songs
 */
export class SongManager {
    constructor() {
        this.songs = { ...SONG_LIBRARY };
        this.currentSong = null;
        this.audioContext = null;
        this.audioBuffer = null;
        this.audioSource = null;
        this.isPlaying = false;
        this.startTime = 0;
        this.pauseTime = 0;
        
        // Initialize patterns for all songs
        this.initializePatterns();
    }
    
    /**
     * Generate patterns for all songs
     */
    initializePatterns() {
        Object.values(this.songs).forEach(song => {
            if (!song.patterns) {
                song.patterns = generateBeatPattern(
                    song.bpm,
                    song.duration,
                    song.difficulty,
                    {
                        holdNotes: song.difficulty >= 2,
                        slideNotes: song.difficulty >= 3
                    }
                );
            }
        });
    }
    
    /**
     * Get all songs
     */
    getAllSongs() {
        return Object.values(this.songs);
    }
    
    /**
     * Get songs by genre
     */
    getSongsByGenre(genre) {
        return Object.values(this.songs).filter(s => s.genre === genre);
    }
    
    /**
     * Get unlocked songs
     */
    getUnlockedSongs() {
        return Object.values(this.songs).filter(s => s.unlocked);
    }
    
    /**
     * Get song by ID
     */
    getSong(id) {
        return this.songs[id] || null;
    }
    
    /**
     * Unlock a song
     */
    unlockSong(id) {
        if (this.songs[id]) {
            this.songs[id].unlocked = true;
            this.saveSongUnlocks();
        }
    }
    
    /**
     * Load song unlocks from storage
     */
    loadSongUnlocks() {
        try {
            const saved = localStorage.getItem('rhythm_song_unlocks');
            if (saved) {
                const unlocks = JSON.parse(saved);
                unlocks.forEach(id => {
                    if (this.songs[id]) {
                        this.songs[id].unlocked = true;
                    }
                });
            }
        } catch (e) {
            console.warn('Failed to load song unlocks:', e);
        }
    }
    
    /**
     * Save song unlocks to storage
     */
    saveSongUnlocks() {
        try {
            const unlocks = Object.values(this.songs)
                .filter(s => s.unlocked)
                .map(s => s.id);
            localStorage.setItem('rhythm_song_unlocks', JSON.stringify(unlocks));
        } catch (e) {
            console.warn('Failed to save song unlocks:', e);
        }
    }
    
    /**
     * Initialize audio context
     */
    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }
    
    /**
     * Load audio file for a song
     */
    async loadAudio(songId) {
        const song = this.getSong(songId);
        if (!song || !song.audioFile) {
            return null; // No audio file available
        }
        
        this.initAudio();
        
        try {
            const response = await fetch(song.audioFile);
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            return this.audioBuffer;
        } catch (e) {
            console.warn('Failed to load audio:', e);
            return null;
        }
    }
    
    /**
     * Play loaded audio
     */
    playAudio(offset = 0) {
        if (!this.audioBuffer || !this.audioContext) return;
        
        this.stopAudio();
        
        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = this.audioBuffer;
        this.audioSource.connect(this.audioContext.destination);
        this.audioSource.start(0, offset);
        
        this.startTime = this.audioContext.currentTime - offset;
        this.isPlaying = true;
    }
    
    /**
     * Pause audio
     */
    pauseAudio() {
        if (!this.isPlaying) return;
        
        this.pauseTime = this.audioContext.currentTime - this.startTime;
        this.stopAudio();
    }
    
    /**
     * Resume audio
     */
    resumeAudio() {
        if (this.isPlaying) return;
        this.playAudio(this.pauseTime);
    }
    
    /**
     * Stop audio
     */
    stopAudio() {
        if (this.audioSource) {
            try {
                this.audioSource.stop();
            } catch (e) {}
            this.audioSource = null;
        }
        this.isPlaying = false;
    }
    
    /**
     * Get current playback time
     */
    getCurrentTime() {
        if (!this.isPlaying || !this.audioContext) return 0;
        return this.audioContext.currentTime - this.startTime;
    }
    
    /**
     * Generate a metronome click sound
     */
    playClick(frequency = 880, duration = 0.05) {
        if (!this.audioContext) {
            this.initAudio();
        }
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.type = 'sine';
        osc.frequency.value = frequency;
        
        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
    }
    
    /**
     * Get difficulty label
     */
    static getDifficultyLabel(level) {
        const labels = {
            [DIFFICULTY.EASY]: 'Easy',
            [DIFFICULTY.NORMAL]: 'Normal',
            [DIFFICULTY.HARD]: 'Hard',
            [DIFFICULTY.EXPERT]: 'Expert',
            [DIFFICULTY.MASTER]: 'Master'
        };
        return labels[level] || 'Unknown';
    }
    
    /**
     * Get difficulty color
     */
    static getDifficultyColor(level) {
        const colors = {
            [DIFFICULTY.EASY]: '#4ade80',
            [DIFFICULTY.NORMAL]: '#60a5fa',
            [DIFFICULTY.HARD]: '#fbbf24',
            [DIFFICULTY.EXPERT]: '#f87171',
            [DIFFICULTY.MASTER]: '#a855f7'
        };
        return colors[level] || '#888';
    }
}

export default SongManager;
