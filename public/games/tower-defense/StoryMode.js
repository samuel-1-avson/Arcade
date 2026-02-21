/**
 * Tower Defense - Story Mode System
 * Manages story campaign with 5 chapters, 15 levels, bosses, and progression
 */

import { MAPS, getMap } from './MapData.js';

// Story chapters and narrative
export const STORY = {
    chapters: [
        {
            id: 1,
            name: 'The Invasion',
            description: 'The evil forces have begun their assault on the kingdom. Learn the basics of tower defense and repel the first wave of invaders.',
            levels: [1, 2, 3],
            boss: {
                name: 'Warlord Grimfang',
                description: 'Leader of the first invasion force',
                abilities: ['Rage Mode: Speed increases when below 50% HP']
            }
        },
        {
            id: 2,
            name: 'The Wasteland',
            description: 'The battle moves to the frozen wastelands. New flying enemies join the fray, and the cold makes defense more challenging.',
            levels: [4, 5, 6],
            boss: {
                name: 'Frostw wing',
                description: 'A massive ice dragon commanding aerial forces',
                abilities: ['Flight', 'Ice Breath: Slows nearby towers']
            }
        },
        {
            id: 3,
            name: 'The Fortress',
            description: 'Deep in volcanic territory, heavily armored enemies emerge. The heat is on as you defend critical chokepoints.',
            levels: [7, 8, 9],
            boss: {
                name: 'Magma Golem',
                description: 'An ancient construct of living lava',
                abilities: ['Heavy Armor', 'Lava Pools: Create hazards on death']
            }
        },
        {
            id: 4,
            name: 'The Necropolis',
            description: 'The undead rise in cursed lands. Healers and spawners make this the most treacherous chapter yet.',
            levels: [10, 11, 12],
            boss: {
                name: 'Lich King Mortis',
                description: 'Master of death and dark magic',
                abilities: ['Summons minions', 'Heals other enemies', 'Teleportation']
            }
        },
        {
            id: 5,
            name: 'The Final Stand',
            description: 'The demon lord himself approaches. All enemy types unite for one last assault. This is the ultimate test of your skills.',
            levels: [13, 14, 15],
            boss: {
                name: 'Demon Lord Infernus',
                description: 'The source of all evil in the realm',
                abilities: ['All enemy abilities', 'Shield at 75%/50%/25% HP', 'Rage Mode', 'Summon reinforcements']
            }
        }
    ]
};

// Dialogue lines for story beats
export const DIALOGUE = {
    intro: {
        speaker: 'Commander',
        text: 'The kingdom is under attack! We must build towers to defend our land from the invading forces. Your tactical skills will be put to the test, recruit!',
        portrait: 'CMD'
    },
    chapter_1_start: {
        speaker: 'Scout',
        text: "Enemy forces spotted on the horizon! They're moving through the plains. Quick, set up our defenses!",
        portrait: 'SCT'
    },
    chapter_1_boss: {
        speaker: 'Warlord Grimfang',
        text: "Fools! Your pathetic towers won't stop my army! Prepare to be crushed!",
        portrait: 'GRM'
    },
    chapter_1_victory: {
        speaker: 'Commander',
        text: "Excellent work! You've repelled the first wave, but this is just the beginning. The enemy won't give up so easily.",
        portrait: 'CMD'
    },
    chapter_2_start: {
        speaker: 'Scout',
        text: "Sir! Flying units detected! Our ground defenses won't be enough. We need anti-air capabilities!",
        portrait: 'SCT'
    },
    chapter_2_boss: {
        speaker: 'Frostwing',
        text: "Your towers will freeze before my icy breath! None can withstand the cold of the north!",
        portrait: 'FRW'
    },
    chapter_2_victory: {
        speaker: 'Commander',
        text: 'The ice dragon falls! But reports indicate heavier armor headed our way from the volcanic regions.',
        portrait: 'CMD'
    },
    chapter_3_start: {
        speaker: 'Engineer',
        text: "These new enemies have thick armor plating! We'll need concentrated fire or specialized towers to penetrate their defenses!",
        portrait: 'ENG'
    },
    chapter_3_boss: {
        speaker: 'Magma Golem',
        text: "[Roars in ancient language] ...Burn... All burn...",
        portrait: 'MGM'
    },
    chapter_3_victory: {
        speaker: 'Commander',
        text: "The golem is defeated, but dark magic stirs in the necropolis. Steel yourself for what comes next.",
        portrait: 'CMD'
    },
    chapter_4_start: {
        speaker: 'Priest',
        text: "Dark magic permeates this place. The dead walk, and their healers restore them endlessly. Target the healers first!",
        portrait: 'PRI'
    },
    chapter_4_boss: {
        speaker: 'Lich King Mortis',
        text: "Death is merely a suggestion in my realm. You cannot kill what is already dead! Rise, my minions!",
        portrait: 'LCH'
    },
    chapter_4_victory: {
        speaker: 'Commander',
        text: "The Lich has fallen! But I sense a greater evil approaching... The Demon Lord himself marches on our position!",
        portrait: 'CMD'
    },
    chapter_5_start: {
        speaker: 'Commander',
        text: "This is it. The final battle. Deploy everything we have! For the kingdom!",
        portrait: 'CMD'
    },
    chapter_5_boss: {
        speaker: 'Demon Lord Infernus',
        text: "I am inevitable. Your resistance is futile. This world will burn, and from its ashes, my dark empire will rise!",
        portrait: 'DLI'
    },
    final_victory: {
        speaker: 'Commander',
        text: "You've done it! The Demon Lord is vanquished! Peace returns to the kingdom, thanks to your incredible tactical prowess. You are a true hero!",
        portrait: 'CMD'
    }
};

export class StoryMode {
    constructor(game) {
        this.game = game;
        this.progress = this.loadProgress();
        this.currentLevel = 1; // Track current level for next level progression
    }

    loadProgress() {
        const saved = localStorage.getItem('towerdefense_story_progress');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Default progress: only level 1 unlocked
        return {
            unlockedLevels: [1],
            completedLevels: [],
            stars: {}, // { levelId: stars (1-3) }
            currentChapter: 1
        };
    }

    saveProgress() {
        localStorage.setItem('towerdefense_story_progress', JSON.stringify(this.progress));
    }

    // Check if a level is unlocked
    isLevelUnlocked(levelId) {
        return this.progress.unlockedLevels.includes(levelId);
    }

    // Complete a level and calculate stars
    completeLevel(levelId, livesRemaining, totalLives, timeElapsed) {
        if (!this.progress.completedLevels.includes(levelId)) {
            this.progress.completedLevels.push(levelId);
        }

        // Calculate stars (1-3)
        let stars = 1; // Basic completion
        
        const lifePercent = livesRemaining / totalLives;
        if (lifePercent >= 0.5) stars = 2; // Half or more lives remaining
        if (lifePercent >= 0.8) stars = 3; // 80%+ lives remaining (nearly perfect)
        
        // Store best star count
        if (!this.progress.stars[levelId] || this.progress.stars[levelId] < stars) {
            this.progress.stars[levelId] = stars;
        }

        // Unlock next level
        if (levelId < 15 && !this.progress.unlockedLevels.includes(levelId + 1)) {
            this.progress.unlockedLevels.push(levelId + 1);
        }

        // Update current chapter
        const chapters = STORY.chapters;
        for (let i = 0; i < chapters.length; i++) {
            if (chapters[i].levels.includes(levelId)) {
                const chapterProgress = chapters[i].levels.filter(l => this.progress.completedLevels.includes(l)).length;
                if (chapterProgress === chapters[i].levels.length && i < chapters.length - 1) {
                    this.progress.currentChapter = i + 2;
                }
                break;
            }
        }

        this.saveProgress();
        return stars;
    }

    // Get star count for a level
    getStars(levelId) {
        return this.progress.stars[levelId] || 0;
    }

    // Get total star count
    getTotalStars() {
        return Object.values(this.progress.stars).reduce((sum, stars) => sum + stars, 0);
    }

    // Get chapter for a level
    getChapterForLevel(levelId) {
        for (const chapter of STORY.chapters) {
            if (chapter.levels.includes(levelId)) {
                return chapter;
            }
        }
        return null;
    }

    // Load next level after victory
    loadNextLevel() {
        if (this.currentLevel < 15) {
            const nextLevel = this.currentLevel + 1;
            if (this.isLevelUnlocked(nextLevel)) {
                this.game.loadLevel(nextLevel);
            } else {
                // Show level select if next level is not unlocked
                this.showLevelSelect();
            }
        } else {
            // All levels complete - show story select
            this.showLevelSelect();
        }
    }

    // Set current level (called by game.loadLevel)
    setCurrentLevel(levelId) {
        this.currentLevel = levelId;
    }

    // Show dialogue popup
    showDialogue(dialogueKey) {
        const dialogue = DIALOGUE[dialogueKey];
        if (!dialogue) return;

        const overlay = document.createElement('div');
        overlay.id = 'story-dialogue';
        overlay.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.7));
            padding: 20px;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
            z-index: 5000;
            animation: slideUp 0.3s ease;
        `;

        overlay.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto; display: flex; gap: 20px; align-items: center;">
                <div style="font-size: 4em; flex-shrink: 0;">
                    ${dialogue.portrait}
                </div>
                <div style="flex: 1;">
                    <div style="color: #ffc800; font-weight: bold; font-size: 1.1em; margin-bottom: 8px;">
                        ${dialogue.speaker}
                    </div>
                    <div style="font-size: 0.95em; line-height: 1.6;">
                        ${dialogue.text}
                    </div>
                </div>
                <button id="dialogue-continue" style="
                    padding: 12px 24px;
                    background: #ffc800;
                    border: none;
                    border-radius: 8px;
                    color: #000;
                    font-weight: bold;
                    font-family: 'Orbitron', sans-serif;
                    cursor: pointer;
                    flex-shrink: 0;
                ">Continue</button>
            </div>
        `;

        // Add animation
        if (!document.getElementById('dialogue-animations')) {
            const style = document.createElement('style');
            style.id = 'dialogue-animations';
            style.textContent = `
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(overlay);

        document.getElementById('dialogue-continue').onclick = () => {
            overlay.remove();
            // Resume game if it was paused for dialogue
            if (this.game && this.game.state === 'paused') {
                this.game.resume();
            }
        };
    }

    // Show level select screen - Premium Industrial Grade Design
    showLevelSelect() {
        const levelSelect = document.createElement('div');
        levelSelect.id = 'level-select';
        levelSelect.className = 'story-overlay';
        levelSelect.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(3, 3, 8, 0.97);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            z-index: 4000;
            overflow-y: auto;
            padding: 40px 20px;
            font-family: 'Inter', 'Orbitron', sans-serif;
            animation: fadeInOverlay 0.4s ease-out;
        `;

        // Calculate progress
        const totalStars = this.getTotalStars();
        const progressPercent = (totalStars / 45) * 100;

        let html = `
            <style>
                @keyframes fadeInOverlay {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUpCard {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulseGlow {
                    0%, 100% { box-shadow: 0 0 15px rgba(0, 229, 255, 0.3); }
                    50% { box-shadow: 0 0 30px rgba(0, 229, 255, 0.5); }
                }
                .story-level-card {
                    animation: slideUpCard 0.5s ease-out backwards;
                    position: relative;
                    overflow: hidden;
                }
                .story-level-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, transparent 60%, rgba(0, 229, 255, 0.1) 100%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                }
                .story-level-card:hover::before {
                    opacity: 1;
                }
                .story-level-card.unlocked:hover {
                    transform: translateY(-6px) scale(1.02);
                    box-shadow: 0 8px 30px rgba(0, 229, 255, 0.4) !important;
                    border-color: #00e5ff !important;
                }
                .chapter-section {
                    animation: slideUpCard 0.6s ease-out backwards;
                }
                .progress-fill {
                    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .star-display {
                    display: inline-flex;
                    gap: 2px;
                }
                .star-display .star {
                    font-size: 1.1em;
                    transition: transform 0.2s ease;
                }
                .star-display .star.filled {
                    color: #ffc107;
                    text-shadow: 0 0 8px rgba(255, 193, 7, 0.5);
                }
                .star-display .star.empty {
                    color: #3a3a4a;
                }
                .boss-badge {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: linear-gradient(135deg, #ff1a6c, #ff5e00);
                    color: #fff;
                    font-size: 0.65rem;
                    font-weight: 700;
                    padding: 3px 8px;
                    border-radius: 20px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .close-story-btn {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .close-story-btn:hover {
                    transform: scale(1.05);
                    background: #ff1a6c !important;
                    border-color: #ff1a6c !important;
                    box-shadow: 0 0 20px rgba(255, 26, 108, 0.4);
                }
            </style>
            
            <div style="max-width: 1200px; margin: 0 auto;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 20px;">
                    <div>
                        <h1 style="
                            font-family: 'Orbitron', sans-serif;
                            font-size: 2.2rem;
                            font-weight: 900;
                            color: #fff;
                            margin: 0 0 8px 0;
                            letter-spacing: 0.05em;
                            text-transform: uppercase;
                            background: linear-gradient(135deg, #fff, #00e5ff);
                            -webkit-background-clip: text;
                            background-clip: text;
                            -webkit-text-fill-color: transparent;
                        "><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 1.5em; height: 1.5em; vertical-align: middle; margin-right: 8px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>Story Campaign</h1>
                        <p style="color: #8899aa; margin: 0; font-size: 0.9rem;">
                            Defend the kingdom across 5 epic chapters
                        </p>
                    </div>
                    <button id="close-level-select" class="close-story-btn" style="
                        padding: 12px 24px;
                        background: rgba(255, 26, 108, 0.15);
                        border: 2px solid #ff1a6c;
                        border-radius: 12px;
                        color: #ff1a6c;
                        cursor: pointer;
                        font-family: 'Orbitron', sans-serif;
                        font-weight: 700;
                        font-size: 0.85rem;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    "><span>✕</span><span>Close</span></button>
                </div>
                
                <!-- Progress Card -->
                <div style="
                    margin-bottom: 32px; 
                    padding: 24px;
                    background: rgba(15, 15, 30, 0.7);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 193, 7, 0.3);
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <span style="font-size: 2rem; color: #ffc107;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 32px; height: 32px;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 22V8a2 2 0 0 1 2-2 2 2 0 0 1 2 2v14"/><path d="M8 6h8"/><path d="M8 9h8"/></svg></span>
                            <div>
                                <div style="font-family: 'Orbitron', sans-serif; font-size: 1.5rem; font-weight: 700; color: #ffc107;">
                                    ${totalStars} <span style="font-size: 0.8em; color: #8899aa;">/ 45 Stars</span>
                                </div>
                            </div>
                        </div>
                        <div style="color: #8899aa; font-size: 0.9rem;">
                            <span style="color: #00ff88; font-weight: 600;">${this.progress.completedLevels.length}</span> / 15 Levels Complete
                        </div>
                    </div>
                    <div style="
                        width: 100%;
                        height: 10px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 999px;
                        overflow: hidden;
                        border: 1px solid rgba(255, 255, 255, 0.05);
                    ">
                        <div class="progress-fill" style="
                            height: 100%;
                            width: ${progressPercent}%;
                            background: linear-gradient(90deg, #00e5ff, #00ff88);
                            border-radius: 999px;
                            box-shadow: 0 0 15px rgba(0, 229, 255, 0.5);
                        "></div>
                    </div>
                </div>
        `;

        // Render chapters
        STORY.chapters.forEach((chapter, chapterIndex) => {
            const chapterUnlocked = this.isLevelUnlocked(chapter.levels[0]);
            const chapterStars = chapter.levels.reduce((sum, l) => sum + this.getStars(l), 0);
            const chapterComplete = chapter.levels.every(l => this.progress.completedLevels.includes(l));
            
            html += `
                <div class="chapter-section" style="
                    margin-bottom: 40px; 
                    opacity: ${chapterUnlocked ? 1 : 0.5};
                    animation-delay: ${chapterIndex * 0.1}s;
                ">
                    <!-- Chapter Header -->
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding-bottom: 12px;
                        margin-bottom: 16px;
                        border-bottom: 1px solid ${chapterUnlocked ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
                    ">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="
                                width: 36px;
                                height: 36px;
                                display: grid;
                                place-items: center;
                                background: ${chapterComplete ? 'linear-gradient(135deg, #00ff88, #00e5ff)' : chapterUnlocked ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
                                border-radius: 8px;
                                font-family: 'Orbitron', sans-serif;
                                font-weight: 900;
                                font-size: 1rem;
                                color: ${chapterComplete ? '#000' : chapterUnlocked ? '#ffc107' : '#5a6a7a'};
                            ">${chapter.id}</span>
                            <div>
                                <h2 style="
                                    font-family: 'Orbitron', sans-serif;
                                    font-size: 1.1rem;
                                    font-weight: 700;
                                    color: ${chapterUnlocked ? '#fff' : '#5a6a7a'};
                                    margin: 0;
                                    display: flex;
                                    align-items: center;
                                    gap: 8px;
                                ">
                                    ${chapter.name}
                                    ${!chapterUnlocked ? '<span style="font-size: 0.9em;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>' : ''}
                                    ${chapterComplete ? '<span style="color: #00ff88;">✓</span>' : ''}
                                </h2>
                            </div>
                        </div>
                        <div class="star-display">
                            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, i) => 
                                `<span class="star ${i < chapterStars ? 'filled' : 'empty'}">★</span>`
                            ).join('')}
                        </div>
                    </div>
                    
                    <!-- Chapter Description -->
                    <p style="color: #8899aa; margin: 0 0 20px 0; font-size: 0.9rem; line-height: 1.5;">
                        ${chapter.description}
                    </p>
                    
                    <!-- Boss Info -->
                    ${chapterUnlocked ? `
                        <div style="
                            display: inline-flex;
                            align-items: center;
                            gap: 8px;
                            padding: 8px 16px;
                            background: rgba(255, 26, 108, 0.1);
                            border: 1px solid rgba(255, 26, 108, 0.3);
                            border-radius: 8px;
                            margin-bottom: 16px;
                            font-size: 0.8rem;
                            color: #ff5c9d;
                        ">
                            <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg></span>
                            <span>Boss: <strong style="color: #fff;">${chapter.boss.name}</strong></span>
                        </div>
                    ` : ''}
                    
                    <!-- Level Grid -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
            `;

            chapter.levels.forEach((levelId, levelIndex) => {
                const map = getMap(levelId);
                const unlocked = this.isLevelUnlocked(levelId);
                const completed = this.progress.completedLevels.includes(levelId);
                const stars = this.getStars(levelId);
                const isBoss = map.bossLevel;

                const difficultyColors = {
                    'Easy': '#00ff88',
                    'Medium': '#ffc107',
                    'Hard': '#ff8800',
                    'Very Hard': '#ff1a6c',
                    'Expert': '#aa00ff',
                    'Master': '#ff0032',
                    'Legendary': '#ffd700'
                };
                const diffColor = difficultyColors[map.difficulty] || '#8899aa';

                html += `
                    <div class="story-level-card ${unlocked ? 'unlocked' : 'locked'}" data-level="${levelId}" style="
                        background: ${completed ? 'rgba(0, 255, 136, 0.08)' : 'rgba(18, 18, 35, 0.7)'};
                        border: 1px solid ${unlocked ? (completed ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 255, 255, 0.1)') : 'rgba(255, 255, 255, 0.05)'};
                        border-radius: 14px;
                        padding: 20px;
                        cursor: ${unlocked ? 'pointer' : 'not-allowed'};
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        animation-delay: ${(chapterIndex * 0.1) + (levelIndex * 0.05)}s;
                    ">
                        ${isBoss ? '<span class="boss-badge">Boss Level</span>' : ''}
                        
                        <div style="display: flex; align-items: flex-start; gap: 16px;">
                            <div style="
                                font-size: 2.2rem;
                                width: 50px;
                                height: 50px;
                                display: grid;
                                place-items: center;
                                background: ${unlocked ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)'};
                                border-radius: 10px;
                                flex-shrink: 0;
                            ">
                                ${isBoss ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: #ff4d00;"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>' : unlocked ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: #00bcd4;"><path d="M4 21V7l8-4 8 4v14"/><path d="M4 10h16"/><rect x="8" y="14" width="3" height="7"/><rect x="13" y="14" width="3" height="7"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: #555;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'}
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="
                                    font-family: 'Orbitron', sans-serif;
                                    font-weight: 700;
                                    font-size: 0.95rem;
                                    color: ${unlocked ? '#fff' : '#5a6a7a'};
                                    margin-bottom: 4px;
                                ">
                                    Level ${levelId}: ${map.name}
                                </div>
                                <div style="font-size: 0.8rem; color: #6a7a8a; line-height: 1.4; margin-bottom: 10px;">
                                    ${map.description || 'Complete this level to progress'}
                                </div>
                                
                                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                                    <div class="star-display">
                                        ${[1, 2, 3].map((_, i) => 
                                            `<span class="star ${i < stars ? 'filled' : 'empty'}">★</span>`
                                        ).join('')}
                                    </div>
                                    <span style="
                                        font-size: 0.7rem;
                                        font-weight: 600;
                                        text-transform: uppercase;
                                        letter-spacing: 0.05em;
                                        padding: 3px 10px;
                                        border-radius: 20px;
                                        background: ${diffColor}20;
                                        color: ${diffColor};
                                        border: 1px solid ${diffColor}40;
                                    ">${map.difficulty}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `</div></div>`;
        });

        html += `</div>`;
        levelSelect.innerHTML = html;
        document.body.appendChild(levelSelect);

        // Add click handlers
        document.getElementById('close-level-select').onclick = () => {
            levelSelect.style.animation = 'fadeInOverlay 0.3s ease-out reverse';
            setTimeout(() => levelSelect.remove(), 280);
        };

        // ESC key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                levelSelect.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        document.querySelectorAll('.story-level-card.unlocked').forEach(card => {
            card.onclick = () => {
                const levelId = parseInt(card.dataset.level);
                levelSelect.style.animation = 'fadeInOverlay 0.2s ease-out reverse';
                setTimeout(() => {
                    levelSelect.remove();
                    this.game.loadLevel(levelId);
                }, 180);
            };
        });
    }
}
