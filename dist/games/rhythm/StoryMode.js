/**
 * Rhythm Game - Story Mode
 * Campaign with 20 levels across 4 chapters, boss battles, and narrative
 */

import { SONG_LIBRARY, DIFFICULTY, SongManager } from './SongLibrary.js';

// Chapter themes and narrative
const CHAPTERS = {
    1: {
        id: 1,
        name: 'The Beginning',
        subtitle: 'First Steps',
        description: 'Learn the basics of rhythm and timing',
        color: '#4ade80',
        unlocked: true
    },
    2: {
        id: 2,
        name: 'Rising Star',
        subtitle: 'Building Momentum',
        description: 'Master more complex patterns and hold notes',
        color: '#60a5fa',
        unlocked: false
    },
    3: {
        id: 3,
        name: 'Rhythm Master',
        subtitle: 'The Challenge Begins',
        description: 'Face harder songs with slides and faster beats',
        color: '#fbbf24',
        unlocked: false
    },
    4: {
        id: 4,
        name: 'The Finale',
        subtitle: 'Ultimate Test',
        description: 'Prove yourself as the ultimate rhythm champion',
        color: '#a855f7',
        unlocked: false
    }
};

// Story level definitions
const STORY_LEVELS = [
    // === Chapter 1: The Beginning (Levels 1-5) ===
    {
        id: 1,
        chapter: 1,
        name: 'First Beat',
        description: 'Hit 20 notes to complete',
        songId: 'sunset_drive',
        goal: { type: 'notes', target: 20 },
        modifiers: { speed: 0.8 },
        stars: { one: 50, two: 70, three: 85 }, // Accuracy thresholds
        dialogue: {
            start: 'Welcome, young rhythm seeker. Let the music guide your hands.',
            complete: 'Excellent! You have taken your first step on the path.'
        }
    },
    {
        id: 2,
        chapter: 1,
        name: 'Finding the Rhythm',
        description: 'Achieve 60% accuracy',
        songId: 'sunset_drive',
        goal: { type: 'accuracy', target: 60 },
        modifiers: {},
        stars: { one: 60, two: 75, three: 90 },
        dialogue: {
            start: 'Timing is everything. Feel the beat within you.',
            complete: 'Your sense of rhythm grows stronger!'
        }
    },
    {
        id: 3,
        chapter: 1,
        name: 'Combo Training',
        description: 'Build a 10-note combo',
        songId: 'city_lights',
        goal: { type: 'combo', target: 10 },
        modifiers: {},
        stars: { one: 10, two: 20, three: 30 },
        dialogue: {
            start: 'Chain your hits together. Combos multiply your power!',
            complete: 'The combo flows through you!'
        }
    },
    {
        id: 4,
        chapter: 1,
        name: 'Moonlit Practice',
        description: 'Complete the full song',
        songId: 'moonlight_sonata',
        goal: { type: 'complete', target: 100 },
        modifiers: {},
        stars: { one: 55, two: 70, three: 85 },
        dialogue: {
            start: 'A peaceful melody awaits. Let it wash over you.',
            complete: 'Beautiful... The music speaks to your soul.'
        }
    },
    {
        id: 5,
        chapter: 1,
        name: 'The Metronome',
        description: 'Defeat the boss with 70% accuracy',
        songId: 'digital_dreams',
        goal: { type: 'accuracy', target: 70 },
        isBoss: true,
        modifiers: { speedVariation: true },
        stars: { one: 70, two: 80, three: 90 },
        dialogue: {
            start: 'The Metronome tests all who seek rhythm mastery. Stay focused!',
            complete: 'Chapter complete! The Metronome acknowledges your skill.'
        }
    },
    
    // === Chapter 2: Rising Star (Levels 6-10) ===
    {
        id: 6,
        chapter: 2,
        name: 'Hold the Line',
        description: 'Successfully complete 5 hold notes',
        songId: 'city_lights',
        goal: { type: 'holds', target: 5 },
        modifiers: { holdNotes: true },
        stars: { one: 5, two: 8, three: 12 },
        dialogue: {
            start: 'New challenge: Hold notes require sustained pressure.',
            complete: 'You have learned patience!'
        }
    },
    {
        id: 7,
        chapter: 2,
        name: 'Speed Training',
        description: 'Complete at 1.2x speed',
        songId: 'midnight_rider',
        goal: { type: 'complete', target: 100 },
        modifiers: { speed: 1.2 },
        stars: { one: 50, two: 65, three: 80 },
        dialogue: {
            start: 'The tempo rises. Can you keep up?',
            complete: 'Speed is no longer your enemy!'
        }
    },
    {
        id: 8,
        chapter: 2,
        name: 'Combo Builder',
        description: 'Build a 25-note combo',
        songId: 'digital_dreams',
        goal: { type: 'combo', target: 25 },
        modifiers: {},
        stars: { one: 25, two: 35, three: 50 },
        dialogue: {
            start: 'Push your combo higher. Feel the rhythm!',
            complete: 'Your combo mastery is impressive!'
        }
    },
    {
        id: 9,
        chapter: 2,
        name: 'Starlight Challenge',
        description: 'Score 1000 points',
        songId: 'starlight_serenade',
        goal: { type: 'score', target: 1000 },
        modifiers: {},
        stars: { one: 1000, two: 1500, three: 2000 },
        dialogue: {
            start: 'The stars align for a scoring challenge.',
            complete: 'A stellar performance!'
        }
    },
    {
        id: 10,
        chapter: 2,
        name: 'Beat Drop',
        description: 'Survive the chaotic beats',
        songId: 'neon_pulse',
        goal: { type: 'accuracy', target: 65 },
        isBoss: true,
        modifiers: { randomDrops: true, speed: 1.1 },
        stars: { one: 65, two: 75, three: 88 },
        dialogue: {
            start: 'BEAT DROP incoming! Brace yourself for chaos!',
            complete: 'Chapter 2 conquered! You rise like a star!'
        }
    },
    
    // === Chapter 3: Rhythm Master (Levels 11-15) ===
    {
        id: 11,
        chapter: 3,
        name: 'Slide Into Action',
        description: 'Hit 10 slide notes',
        songId: 'thunder_road',
        goal: { type: 'slides', target: 10 },
        modifiers: { slideNotes: true },
        stars: { one: 10, two: 15, three: 20 },
        dialogue: {
            start: 'Slides require quick lane transitions. Stay nimble!',
            complete: 'You glide through the notes effortlessly!'
        }
    },
    {
        id: 12,
        chapter: 3,
        name: 'Perfect Pursuit',
        description: 'Get 15 Perfect hits',
        songId: 'symphony_of_stars',
        goal: { type: 'perfects', target: 15 },
        modifiers: {},
        stars: { one: 15, two: 25, three: 40 },
        dialogue: {
            start: 'Precision is key. Only Perfect hits count.',
            complete: 'Your timing is sublime!'
        }
    },
    {
        id: 13,
        chapter: 3,
        name: 'Rock Endurance',
        description: 'Complete with less than 10 misses',
        songId: 'thunder_road',
        goal: { type: 'maxMiss', target: 10 },
        modifiers: { speed: 1.15 },
        stars: { one: 10, two: 5, three: 2 },
        dialogue: {
            start: 'Minimize your mistakes. Every miss counts!',
            complete: 'Rock solid performance!'
        }
    },
    {
        id: 14,
        chapter: 3,
        name: 'Mixed Mastery',
        description: 'Clear all note types in one song',
        songId: 'flight_of_fancy',
        goal: { type: 'complete', target: 100 },
        modifiers: { allNoteTypes: true },
        stars: { one: 60, two: 75, three: 88 },
        dialogue: {
            start: 'Taps, holds, and slides - master them all!',
            complete: 'You handle any note with grace!'
        }
    },
    {
        id: 15,
        chapter: 3,
        name: 'Tempo Fury',
        description: 'Survive the speed changes',
        songId: 'neon_pulse',
        goal: { type: 'accuracy', target: 72 },
        isBoss: true,
        modifiers: { tempoChanges: true, speed: 1.25 },
        stars: { one: 72, two: 82, three: 92 },
        dialogue: {
            start: 'TEMPO FURY strikes! The beat will shift without warning!',
            complete: 'Chapter 3 complete! You are truly a Rhythm Master!'
        }
    },
    
    // === Chapter 4: The Finale (Levels 16-20) ===
    {
        id: 16,
        chapter: 4,
        name: 'Expert Territory',
        description: 'Score 2500 points',
        songId: 'bass_cannon',
        goal: { type: 'score', target: 2500 },
        modifiers: {},
        stars: { one: 2500, two: 3500, three: 5000 },
        dialogue: {
            start: 'The final chapter begins. Show no weakness.',
            complete: 'Expert-level score achieved!'
        }
    },
    {
        id: 17,
        chapter: 4,
        name: 'Combo Legend',
        description: 'Build a 50-note combo',
        songId: 'flight_of_fancy',
        goal: { type: 'combo', target: 50 },
        modifiers: { speed: 1.2 },
        stars: { one: 50, two: 75, three: 100 },
        dialogue: {
            start: 'Legendary combos await those with focus.',
            complete: 'The legends will speak of this combo!'
        }
    },
    {
        id: 18,
        chapter: 4,
        name: 'Near Perfection',
        description: 'Achieve 90% accuracy',
        songId: 'symphony_of_stars',
        goal: { type: 'accuracy', target: 90 },
        modifiers: {},
        stars: { one: 90, two: 94, three: 98 },
        dialogue: {
            start: 'Only near-perfection will suffice here.',
            complete: 'Astounding precision!'
        }
    },
    {
        id: 19,
        chapter: 4,
        name: 'The Gauntlet',
        description: 'Survive the ultimate trial',
        songId: 'final_stand',
        goal: { type: 'complete', target: 100 },
        modifiers: { allChaos: true, speed: 1.3 },
        stars: { one: 55, two: 72, three: 88 },
        dialogue: {
            start: 'The Gauntlet tests everything you have learned.',
            complete: 'You have proven yourself worthy!'
        }
    },
    {
        id: 20,
        chapter: 4,
        name: 'Chaos Conductor',
        description: 'Achieve 85% against the final boss',
        songId: 'final_stand',
        goal: { type: 'accuracy', target: 85 },
        isBoss: true,
        modifiers: { allChaos: true, speed: 1.4, noHUD: false },
        stars: { one: 85, two: 92, three: 98 },
        dialogue: {
            start: 'THE CHAOS CONDUCTOR appears! This is your ultimate test!',
            complete: 'VICTORY! You are the RHYTHM CHAMPION!'
        }
    }
];

/**
 * Story Mode Manager
 */
export class StoryModeManager {
    constructor(game) {
        this.game = game;
        this.levels = STORY_LEVELS;
        this.chapters = { ...CHAPTERS };
        this.currentLevel = null;
        this.progress = this.loadProgress();
    }
    
    /**
     * Load progress from storage
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem('rhythm_story_progress');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load story progress:', e);
        }
        
        return {
            currentLevel: 1,
            completedLevels: {},
            unlockedChapters: [1],
            totalStars: 0
        };
    }
    
    /**
     * Save progress to storage
     */
    saveProgress() {
        try {
            localStorage.setItem('rhythm_story_progress', JSON.stringify(this.progress));
        } catch (e) {
            console.warn('Failed to save story progress:', e);
        }
    }
    
    /**
     * Get all levels
     */
    getAllLevels() {
        return this.levels;
    }
    
    /**
     * Get levels by chapter
     */
    getLevelsByChapter(chapterId) {
        return this.levels.filter(l => l.chapter === chapterId);
    }
    
    /**
     * Get level by ID
     */
    getLevel(levelId) {
        return this.levels.find(l => l.id === levelId);
    }
    
    /**
     * Get chapter info
     */
    getChapter(chapterId) {
        return this.chapters[chapterId];
    }
    
    /**
     * Get all chapters
     */
    getAllChapters() {
        return Object.values(this.chapters);
    }
    
    /**
     * Check if level is unlocked
     */
    isLevelUnlocked(levelId) {
        if (levelId === 1) return true;
        
        const level = this.getLevel(levelId);
        if (!level) return false;
        
        // Check if chapter is unlocked
        if (!this.progress.unlockedChapters.includes(level.chapter)) {
            return false;
        }
        
        // First level of chapter is unlocked if chapter is
        const chapterLevels = this.getLevelsByChapter(level.chapter);
        if (chapterLevels[0]?.id === levelId) {
            return true;
        }
        
        // Otherwise, previous level must be completed
        return this.isLevelCompleted(levelId - 1);
    }
    
    /**
     * Check if level is completed
     */
    isLevelCompleted(levelId) {
        return !!this.progress.completedLevels[levelId];
    }
    
    /**
     * Get level stars (0-3)
     */
    getLevelStars(levelId) {
        const data = this.progress.completedLevels[levelId];
        return data ? data.stars : 0;
    }
    
    /**
     * Start a level
     */
    startLevel(levelId) {
        const level = this.getLevel(levelId);
        if (!level || !this.isLevelUnlocked(levelId)) {
            return null;
        }
        
        this.currentLevel = { ...level };
        return this.currentLevel;
    }
    
    /**
     * Complete a level with results
     */
    completeLevel(levelId, results) {
        const level = this.getLevel(levelId);
        if (!level) return null;
        
        // Check goal completion
        let goalMet = false;
        switch (level.goal.type) {
            case 'notes':
                goalMet = results.notesHit >= level.goal.target;
                break;
            case 'accuracy':
                goalMet = results.accuracy >= level.goal.target;
                break;
            case 'combo':
                goalMet = results.maxCombo >= level.goal.target;
                break;
            case 'score':
                goalMet = results.score >= level.goal.target;
                break;
            case 'complete':
                goalMet = results.songComplete;
                break;
            case 'holds':
                goalMet = results.holdsCompleted >= level.goal.target;
                break;
            case 'slides':
                goalMet = results.slidesCompleted >= level.goal.target;
                break;
            case 'perfects':
                goalMet = results.perfectHits >= level.goal.target;
                break;
            case 'maxMiss':
                goalMet = results.misses <= level.goal.target;
                break;
            default:
                goalMet = true;
        }
        
        if (!goalMet) {
            return { success: false, goalMet: false };
        }
        
        // Calculate stars
        let stars = 0;
        const thresholdValue = this.getThresholdValue(level.goal.type, results);
        
        if (thresholdValue >= level.stars.three) stars = 3;
        else if (thresholdValue >= level.stars.two) stars = 2;
        else if (thresholdValue >= level.stars.one) stars = 1;
        
        // Update progress
        const previousStars = this.getLevelStars(levelId);
        if (stars > previousStars) {
            this.progress.completedLevels[levelId] = {
                stars,
                bestScore: Math.max(results.score, this.progress.completedLevels[levelId]?.bestScore || 0),
                bestAccuracy: Math.max(results.accuracy, this.progress.completedLevels[levelId]?.bestAccuracy || 0)
            };
            this.progress.totalStars += (stars - previousStars);
        }
        
        // Unlock next chapter if boss defeated
        if (level.isBoss) {
            const nextChapter = level.chapter + 1;
            if (nextChapter <= 4 && !this.progress.unlockedChapters.includes(nextChapter)) {
                this.progress.unlockedChapters.push(nextChapter);
                this.chapters[nextChapter].unlocked = true;
            }
        }
        
        // Update current level pointer
        if (levelId >= this.progress.currentLevel && levelId < 20) {
            this.progress.currentLevel = levelId + 1;
        }
        
        this.saveProgress();
        
        return {
            success: true,
            goalMet: true,
            stars,
            isNewBest: stars > previousStars,
            dialogue: level.dialogue.complete
        };
    }
    
    /**
     * Get threshold value for star calculation
     */
    getThresholdValue(goalType, results) {
        switch (goalType) {
            case 'accuracy':
            case 'notes':
            case 'complete':
            case 'perfects':
                return results.accuracy;
            case 'combo':
                return results.maxCombo;
            case 'score':
                return results.score;
            case 'holds':
                return results.holdsCompleted;
            case 'slides':
                return results.slidesCompleted;
            case 'maxMiss':
                return results.misses;
            default:
                return results.accuracy;
        }
    }
    
    /**
     * Get total stars earned
     */
    getTotalStars() {
        return this.progress.totalStars;
    }
    
    /**
     * Get completion percentage
     */
    getCompletionPercentage() {
        const completed = Object.keys(this.progress.completedLevels).length;
        return Math.round((completed / this.levels.length) * 100);
    }
    
    /**
     * Reset progress
     */
    resetProgress() {
        this.progress = {
            currentLevel: 1,
            completedLevels: {},
            unlockedChapters: [1],
            totalStars: 0
        };
        
        // Reset chapter unlocks
        Object.values(this.chapters).forEach((ch, i) => {
            ch.unlocked = i === 0;
        });
        
        this.saveProgress();
    }
}

export { CHAPTERS, STORY_LEVELS };
export default StoryModeManager;
