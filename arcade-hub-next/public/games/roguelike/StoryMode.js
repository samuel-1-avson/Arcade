/**
 * Roguelike - Story Mode System
 * Manages story campaign with 5 chapters, 15 levels, bosses, and progression
 */

// Story chapters and narrative
import { ICONS } from './Icons.js';

function getIcon(key) {
    return ICONS[key] || '';
}

export const STORY = {
    chapters: [
        {
            id: 1,
            name: 'The Forgotten Crypt',
            description: 'Ancient burial grounds awaken. Skeletons stir in the darkness as you search for the cursed artifact.',
            theme: 'crypt',
            levels: [1, 2, 3],
            modifiers: {
                monsterTypes: ['rat', 'bat', 'skeleton'],
                itemSpawnRate: 1.0,
                floorSize: 'small'
            },
            boss: {
                name: 'Skeleton King',
                type: 'skeleton_king',
                char: 'K',
                hp: 150,
                atk: 15,
                def: 8,
                xp: 200,
                color: '#f0f0f0',
                abilities: ['summon_skeletons', 'bone_throw'],
                phases: 2,
                description: 'An ancient monarch risen from death'
            }
        },
        {
            id: 2,
            name: 'Goblin Warrens',
            description: 'A maze of tunnels infested with goblins. Their warlord hoards stolen treasures in the depths.',
            theme: 'warrens',
            levels: [4, 5, 6],
            modifiers: {
                monsterTypes: ['rat', 'goblin', 'orc'],
                itemSpawnRate: 1.2,
                trapDensity: 0.1,
                floorSize: 'medium'
            },
            boss: {
                name: 'Goblin Warlord',
                type: 'goblin_warlord',
                char: 'W',
                hp: 200,
                atk: 18,
                def: 6,
                xp: 300,
                color: '#00cc00',
                abilities: ['rally_troops', 'charge', 'throw_bomb'],
                phases: 2,
                description: 'Cunning leader of the goblin horde'
            }
        },
        {
            id: 3,
            name: 'Dwarven Ruins',
            description: 'Abandoned dwarven halls, now home to stone constructs and ancient guardians.',
            theme: 'ruins',
            levels: [7, 8, 9],
            modifiers: {
                monsterTypes: ['orc', 'troll', 'golem'],
                itemSpawnRate: 1.0,
                secretRoomChance: 0.3,
                floorSize: 'large'
            },
            boss: {
                name: 'Stone Golem',
                type: 'stone_golem',
                char: 'G',
                hp: 300,
                atk: 22,
                def: 15,
                xp: 450,
                color: '#888888',
                abilities: ['ground_pound', 'rock_armor', 'earthquake'],
                phases: 3,
                description: 'An indestructible guardian of dwarven secrets'
            }
        },
        {
            id: 4,
            name: "Dragon's Lair",
            description: 'The volcanic caverns where dragons nest. Fire and brimstone await the brave.',
            theme: 'volcanic',
            levels: [10, 11, 12],
            modifiers: {
                monsterTypes: ['troll', 'dragon', 'fire_elemental'],
                itemSpawnRate: 0.8,
                hazardDensity: 0.15,
                floorSize: 'large'
            },
            boss: {
                name: 'Fire Drake',
                type: 'fire_drake',
                char: 'F',
                hp: 400,
                atk: 28,
                def: 12,
                xp: 600,
                color: '#ff4400',
                abilities: ['fire_breath', 'wing_buffet', 'inferno'],
                phases: 3,
                description: 'A young dragon of terrifying power'
            }
        },
        {
            id: 5,
            name: 'The Abyss',
            description: 'The final descent into darkness. The Demon Lord awaits at the bottom of existence.',
            theme: 'abyss',
            levels: [13, 14, 15],
            modifiers: {
                monsterTypes: ['ghost', 'necromancer', 'demon'],
                itemSpawnRate: 0.7,
                visionRange: 4,
                floorSize: 'huge'
            },
            boss: {
                name: 'Demon Lord',
                type: 'demon_lord',
                char: 'Ω',
                hp: 666,
                atk: 35,
                def: 20,
                xp: 1000,
                color: '#cc00ff',
                abilities: ['dark_blast', 'summon_demons', 'soul_drain', 'phase_shift'],
                phases: 4,
                description: 'The source of all evil in the dungeon'
            }
        }
    ]
};

// Dialogue lines for story beats
export const DIALOGUE = {
    intro: {
        speaker: 'Narrator',
        text: 'You stand at the entrance of the ancient dungeon. Legends speak of untold riches... and unspeakable horrors.',
        iconKey: 'scroll'
    },
    
    // Chapter 1
    chapter_1_start: {
        speaker: 'Ghost',
        text: 'Turn back, adventurer... The Skeleton King rules these crypts now. None who enter ever leave.',
        iconKey: 'ghost'
    },
    chapter_1_boss: {
        speaker: 'Skeleton King',
        text: 'ANOTHER SOUL FOR MY ARMY! You will serve me in death, mortal!',
        iconKey: 'skull'
    },
    chapter_1_victory: {
        speaker: 'Narrator',
        text: 'The Skeleton King crumbles. His crown reveals a path deeper into the earth...',
        iconKey: 'scroll'
    },
    
    // Chapter 2
    chapter_2_start: {
        speaker: 'Captured Dwarf',
        text: 'Help! The goblins took everything! Their warlord went mad after finding something in the old mines...',
        iconKey: 'shield'
    },
    chapter_2_boss: {
        speaker: 'Goblin Warlord',
        text: 'YOU WANT MY TREASURE?! I\'LL BURY YOU WITH IT! ATTACK, MY WARRIORS!',
        iconKey: 'demon'
    },
    chapter_2_victory: {
        speaker: 'Captured Dwarf',
        text: 'Thank you! The warlord mentioned "ancient dwarven halls" below. That\'s where they found the artifact...',
        iconKey: 'shield'
    },
    
    // Chapter 3
    chapter_3_start: {
        speaker: 'Dwarven Spirit',
        text: 'These were once my people\'s halls. We created the golems to protect our secrets. Now they protect only silence.',
        iconKey: 'sword_cross'
    },
    chapter_3_boss: {
        speaker: 'Stone Golem',
        text: '*INTRUDER DETECTED* *INITIATING ELIMINATION PROTOCOL*',
        iconKey: 'shrine'
    },
    chapter_3_victory: {
        speaker: 'Dwarven Spirit',
        text: 'The golem was guarding the path to the volcanic depths. Something terrible awakened the dragons below...',
        iconKey: 'sword_cross'
    },
    
    // Chapter 4
    chapter_4_start: {
        speaker: 'Narrator',
        text: 'The heat is unbearable. Rivers of lava flow through ancient volcanic caves. Dragons watch from the shadows.',
        iconKey: 'scroll'
    },
    chapter_4_boss: {
        speaker: 'Fire Drake',
        text: 'YOU DARE ENTER MY DOMAIN?! I WILL REDUCE YOU TO ASH!',
        iconKey: 'fire'
    },
    chapter_4_victory: {
        speaker: 'Dying Dragon',
        text: 'The Demon Lord... he corrupted us... The Abyss... you must end this...',
        iconKey: 'fire'
    },
    
    // Chapter 5
    chapter_5_start: {
        speaker: 'Voice from the Darkness',
        text: 'So, you\'ve come at last. I\'ve been waiting for a worthy soul. Come... embrace the void.',
        iconKey: 'demon'
    },
    chapter_5_boss: {
        speaker: 'Demon Lord',
        text: 'I AM ETERNAL! I HAVE CORRUPTED KINGDOMS! AND YOU... YOU ARE NOTHING!',
        iconKey: 'demon'
    },
    final_victory: {
        speaker: 'Narrator',
        text: 'The Demon Lord is vanquished! Light returns to the dungeon. You emerge a legend, the hero who conquered the Abyss!',
        iconKey: 'trophy'
    }
};

// Level configurations
export const LEVEL_CONFIG = {
    1: { floors: 1, monsters: 3, difficulty: 1.0 },
    2: { floors: 1, monsters: 4, difficulty: 1.1 },
    3: { floors: 2, monsters: 5, difficulty: 1.2, isBossLevel: true },
    4: { floors: 1, monsters: 4, difficulty: 1.3 },
    5: { floors: 2, monsters: 5, difficulty: 1.4 },
    6: { floors: 2, monsters: 6, difficulty: 1.5, isBossLevel: true },
    7: { floors: 2, monsters: 5, difficulty: 1.6 },
    8: { floors: 2, monsters: 6, difficulty: 1.7 },
    9: { floors: 3, monsters: 7, difficulty: 1.8, isBossLevel: true },
    10: { floors: 2, monsters: 6, difficulty: 2.0 },
    11: { floors: 3, monsters: 7, difficulty: 2.2 },
    12: { floors: 3, monsters: 8, difficulty: 2.5, isBossLevel: true },
    13: { floors: 3, monsters: 7, difficulty: 2.8 },
    14: { floors: 3, monsters: 8, difficulty: 3.0 },
    15: { floors: 4, monsters: 10, difficulty: 3.5, isBossLevel: true, isFinalBoss: true }
};

export class StoryMode {
    constructor(game) {
        this.game = game;
        this.progress = this.loadProgress();
        this.currentLevel = 1;
        this.currentFloor = 1;
        this.inBossFight = false;
        this.dialogQueue = [];
        this.isShowingDialog = false;
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem('roguelike_story_progress');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load story progress:', e);
        }
        
        return {
            unlockedLevels: [1],
            completedLevels: [],
            stars: {},
            totalStars: 0,
            highestLevel: 1,
            bossesDefeated: [],
            currentChapter: 1
        };
    }
    
    saveProgress() {
        try {
            localStorage.setItem('roguelike_story_progress', JSON.stringify(this.progress));
        } catch (e) {
            console.error('Failed to save story progress:', e);
        }
    }
    
    isLevelUnlocked(levelId) {
        return this.progress.unlockedLevels.includes(levelId);
    }
    
    isLevelCompleted(levelId) {
        return this.progress.completedLevels.includes(levelId);
    }
    
    getStars(levelId) {
        return this.progress.stars[levelId] || 0;
    }
    
    getTotalStars() {
        return Object.values(this.progress.stars).reduce((a, b) => a + b, 0);
    }
    
    getChapterForLevel(levelId) {
        for (const chapter of STORY.chapters) {
            if (chapter.levels.includes(levelId)) {
                return chapter;
            }
        }
        return null;
    }
    
    getChapterProgress(chapterId) {
        const chapter = STORY.chapters.find(c => c.id === chapterId);
        if (!chapter) return { completed: 0, total: 0 };
        
        const completed = chapter.levels.filter(l => this.isLevelCompleted(l)).length;
        return { completed, total: chapter.levels.length };
    }
    
    startLevel(levelId) {
        if (!this.isLevelUnlocked(levelId)) {
            console.warn('Level not unlocked:', levelId);
            return false;
        }
        
        this.currentLevel = levelId;
        this.currentFloor = 1;
        this.inBossFight = false;
        
        const chapter = this.getChapterForLevel(levelId);
        const config = LEVEL_CONFIG[levelId];
        
        // Show intro dialogue for first level of chapter
        if (chapter && chapter.levels[0] === levelId) {
            const dialogKey = `chapter_${chapter.id}_start`;
            if (DIALOGUE[dialogKey]) {
                this.showDialogue(dialogKey);
            }
        }
        
        // Apply chapter modifiers
        if (chapter) {
            this.applyChapterModifiers(chapter);
        }
        
        return { config, chapter };
    }
    
    applyChapterModifiers(chapter) {
        if (!this.game || !chapter.modifiers) return;
        
        // Store modifiers for the game to use
        this.activeModifiers = {
            allowedMonsters: chapter.modifiers.monsterTypes || null,
            itemMultiplier: chapter.modifiers.itemSpawnRate || 1.0,
            trapChance: chapter.modifiers.trapDensity || 0,
            secretChance: chapter.modifiers.secretRoomChance || 0.1,
            visionRange: chapter.modifiers.visionRange || 6,
            theme: chapter.theme
        };
    }
    
    advanceFloor() {
        const config = LEVEL_CONFIG[this.currentLevel];
        this.currentFloor++;
        
        // Check if this is the boss floor
        if (config.isBossLevel && this.currentFloor >= config.floors) {
            this.startBossFight();
            return 'boss';
        }
        
        // Check if level complete
        if (this.currentFloor > config.floors) {
            return 'level_complete';
        }
        
        return 'continue';
    }
    
    startBossFight() {
        const chapter = this.getChapterForLevel(this.currentLevel);
        if (!chapter || !chapter.boss) return;
        
        this.inBossFight = true;
        
        // Show boss dialogue
        const dialogKey = `chapter_${chapter.id}_boss`;
        if (DIALOGUE[dialogKey]) {
            this.showDialogue(dialogKey);
        }
        
        return chapter.boss;
    }
    
    completeLevel(hpPercent, turnsUsed, itemsCollected) {
        const levelId = this.currentLevel;
        
        // Calculate stars
        let stars = 1;
        if (hpPercent >= 0.5) stars++;
        if (hpPercent >= 0.8) stars++;
        
        // Update progress
        if (!this.progress.completedLevels.includes(levelId)) {
            this.progress.completedLevels.push(levelId);
        }
        
        // Update stars if better
        if (!this.progress.stars[levelId] || this.progress.stars[levelId] < stars) {
            this.progress.stars[levelId] = stars;
        }
        
        // Unlock next level
        const nextLevel = levelId + 1;
        if (nextLevel <= 15 && !this.progress.unlockedLevels.includes(nextLevel)) {
            this.progress.unlockedLevels.push(nextLevel);
        }
        
        // Update highest level
        if (levelId > this.progress.highestLevel) {
            this.progress.highestLevel = levelId;
        }
        
        // Check for chapter completion
        const chapter = this.getChapterForLevel(levelId);
        const config = LEVEL_CONFIG[levelId];
        
        if (config.isBossLevel && chapter) {
            if (!this.progress.bossesDefeated.includes(chapter.boss.type)) {
                this.progress.bossesDefeated.push(chapter.boss.type);
            }
            
            // Show victory dialogue
            const dialogKey = config.isFinalBoss ? 'final_victory' : `chapter_${chapter.id}_victory`;
            if (DIALOGUE[dialogKey]) {
                this.showDialogue(dialogKey);
            }
            
            // Update chapter progress
            this.progress.currentChapter = Math.min(5, chapter.id + 1);
        }
        
        this.saveProgress();
        
        return { stars, nextLevel };
    }
    
    showDialogue(dialogKey) {
        const dialogue = DIALOGUE[dialogKey];
        if (!dialogue) return;
        
        this.dialogQueue.push(dialogue);
        
        if (!this.isShowingDialog) {
            this.displayNextDialog();
        }
    }
    
    displayNextDialog() {
        if (this.dialogQueue.length === 0) {
            this.isShowingDialog = false;
            this.onDialogComplete?.();
            return;
        }
        
        this.isShowingDialog = true;
        const dialogue = this.dialogQueue.shift();
        
        // Create dialog overlay
        let overlay = document.getElementById('story-dialog-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'story-dialog-overlay';
            overlay.className = 'story-dialog-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="story-dialog">
                <div class="dialog-portrait">${getIcon(dialogue.iconKey)}</div>
                <div class="dialog-content">
                    <div class="dialog-speaker">${dialogue.speaker}</div>
                    <div class="dialog-text">${dialogue.text}</div>
                </div>
                <div class="dialog-continue">Click to continue...</div>
            </div>
        `;
        
        overlay.style.display = 'flex';
        
        const closeDialog = () => {
            overlay.removeEventListener('click', closeDialog);
            overlay.style.display = 'none';
            setTimeout(() => this.displayNextDialog(), 100);
        };
        
        overlay.addEventListener('click', closeDialog);
    }
    
    showLevelSelect() {
        // Create level select modal
        let modal = document.getElementById('level-select-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'level-select-modal';
            modal.className = 'level-select-modal';
            document.body.appendChild(modal);
        }
        
        let html = `
            <div class="level-select-content">
                <div class="level-select-header">
                    <h2>${getIcon('scroll')} Story Mode</h2>
                    <div class="total-stars">${getIcon('star')} ${this.getTotalStars()} / 45</div>
                    <button class="close-btn" onclick="document.getElementById('level-select-modal').style.display='none'">✕</button>
                </div>
                <div class="chapters-container">
        `;
        
        for (const chapter of STORY.chapters) {
            const chapterProgress = this.getChapterProgress(chapter.id);
            const isUnlocked = chapter.levels.some(l => this.isLevelUnlocked(l));
            const isComplete = chapterProgress.completed === chapterProgress.total;
            
            html += `
                <div class="chapter-card ${isUnlocked ? '' : 'locked'} ${isComplete ? 'complete' : ''}">
                    <div class="chapter-header">
                        <span class="chapter-number">Chapter ${chapter.id}</span>
                        <span class="chapter-title">${chapter.name}</span>
                    </div>
                    <p class="chapter-desc">${chapter.description}</p>
                    <div class="chapter-levels">
            `;
            
            for (const levelId of chapter.levels) {
                const unlocked = this.isLevelUnlocked(levelId);
                const completed = this.isLevelCompleted(levelId);
                const stars = this.getStars(levelId);
                const config = LEVEL_CONFIG[levelId];
                
                html += `
                    <button class="level-btn ${unlocked ? '' : 'locked'} ${completed ? 'completed' : ''}"
                            ${unlocked ? `onclick="window.game.storyMode.startLevelFromUI(${levelId})"` : 'disabled'}>
                        <span class="level-number">${levelId}</span>
                        ${config.isBossLevel ? `<span class="boss-icon">${getIcon('crown')}</span>` : ''}
                        <div class="level-stars">
                            ${Array(stars).fill(getIcon('star')).join('')}${Array(3 - stars).fill(getIcon('starEmpty')).join('')}
                        </div>
                    </button>
                `;
            }
            
            html += `
                    </div>
                    <div class="chapter-boss">
                        <span class="boss-label">Boss:</span>
                        <span class="boss-name">${chapter.boss.name}</span>
                        ${this.progress.bossesDefeated.includes(chapter.boss.type) ? ' ✓' : ''}
                    </div>
                </div>
            `;
        }
        
        html += `
                </div>
                <div class="level-select-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('level-select-modal').style.display='none'">Back</button>
                </div>
            </div>
        `;
        
        modal.innerHTML = html;
        modal.style.display = 'flex';
    }
    
    startLevelFromUI(levelId) {
        document.getElementById('level-select-modal').style.display = 'none';
        
        const result = this.startLevel(levelId);
        if (result && this.game) {
            this.game.startStoryLevel(result.config, result.chapter);
        }
    }
    
    resetProgress() {
        this.progress = {
            unlockedLevels: [1],
            completedLevels: [],
            stars: {},
            totalStars: 0,
            highestLevel: 1,
            bossesDefeated: [],
            currentChapter: 1
        };
        this.saveProgress();
    }
}
