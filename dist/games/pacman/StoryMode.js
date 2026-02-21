/**
 * Pac-Man Story Mode
 * 5 chapters with 25 total levels, narrative elements, and unique objectives
 */

export const STORY_CHAPTERS = {
    CHAPTER_1: {
        id: 1,
        name: 'The Awakening',
        icon: '🌅',
        description: 'Pac-Man awakens in Maze World and discovers his hunger for dots.',
        color: '#ffff00',
        unlocked: true,
        levels: [
            {
                id: 1,
                name: 'First Steps',
                objective: 'Eat all dots to complete the level',
                objectiveType: 'clear_dots',
                targetValue: 0,
                map: 'classic',
                dialogue: {
                    intro: [
                        { speaker: 'Pac-Man', text: 'Where am I? This maze feels... familiar.' },
                        { speaker: 'Narrator', text: 'Welcome to Maze World, Pac-Man. Collect all the dots to proceed.' }
                    ],
                    outro: [
                        { speaker: 'Pac-Man', text: 'That was satisfying! But I sense something lurking...' }
                    ]
                },
                ghostCount: 2,
                ghostSpeed: 0.8,
                rewards: { points: 1000 }
            },
            {
                id: 2,
                name: 'Ghost Encounter',
                objective: 'Clear the maze while avoiding 3 ghosts',
                objectiveType: 'clear_dots',
                targetValue: 0,
                map: 'classic',
                dialogue: {
                    intro: [
                        { speaker: 'Blinky', text: 'There you are, yellow one! You won\'t escape us!' },
                        { speaker: 'Pac-Man', text: 'Ghosts! I need to be careful around them.' }
                    ],
                    outro: [
                        { speaker: 'Pac-Man', text: 'I made it! Those ghosts are relentless.' }
                    ]
                },
                ghostCount: 3,
                ghostSpeed: 0.9,
                rewards: { points: 1500 }
            },
            {
                id: 3,
                name: 'Power Discovery',
                objective: 'Eat a power pellet and defeat 2 ghosts',
                objectiveType: 'eat_ghosts',
                targetValue: 2,
                map: 'classic',
                dialogue: {
                    intro: [
                        { speaker: 'Narrator', text: 'Those glowing orbs contain immense power...' },
                        { speaker: 'Pac-Man', text: 'I feel stronger near them. Let me try eating one!' }
                    ],
                    outro: [
                        { speaker: 'Pac-Man', text: 'Incredible! With power pellets, I can fight back!' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 0.9,
                rewards: { points: 2000, unlock: 'ghost_hunter_tip' }
            },
            {
                id: 4,
                name: 'Fruit Feast',
                objective: 'Collect 3 fruits while clearing the maze',
                objectiveType: 'collect_fruits',
                targetValue: 3,
                map: 'classic',
                dialogue: {
                    intro: [
                        { speaker: 'Narrator', text: 'Bonus fruits appear for skilled players...' },
                        { speaker: 'Pac-Man', text: 'Those fruits look delicious!' }
                    ],
                    outro: [
                        { speaker: 'Pac-Man', text: 'The fruits give me extra energy!' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 1.0,
                fruitsToSpawn: 4,
                rewards: { points: 2500 }
            },
            {
                id: 5,
                name: 'Maze Master',
                objective: 'Complete the level in under 90 seconds',
                objectiveType: 'time_limit',
                targetValue: 90,
                map: 'classic',
                dialogue: {
                    intro: [
                        { speaker: 'Narrator', text: 'Prove your mastery of the classic maze!' },
                        { speaker: 'Pac-Man', text: 'Speed is the key. I can do this!' }
                    ],
                    outro: [
                        { speaker: 'Pac-Man', text: 'Chapter complete! But the adventure has just begun...' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 1.0,
                rewards: { points: 5000, unlockChapter: 2 }
            }
        ]
    },

    CHAPTER_2: {
        id: 2,
        name: 'Ghost Uprising',
        icon: '👻',
        description: 'The ghosts grow stronger and more aggressive. Face new challenges!',
        color: '#ff4444',
        unlocked: false,
        levels: [
            {
                id: 1,
                name: 'Aggressive Pursuit',
                objective: 'Survive against faster ghosts',
                objectiveType: 'clear_dots',
                map: 'neon_city',
                dialogue: {
                    intro: [
                        { speaker: 'Blinky', text: 'We\'ve trained! You won\'t escape this time!' },
                        { speaker: 'Pac-Man', text: 'A new maze? And they seem faster...' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 1.2,
                rewards: { points: 3000 }
            },
            {
                id: 2,
                name: 'Pinky\'s Trap',
                objective: 'Eat all dots with Pinky predicting your moves',
                objectiveType: 'clear_dots',
                map: 'neon_city',
                dialogue: {
                    intro: [
                        { speaker: 'Pinky', text: 'I know where you\'re going before you do!' },
                        { speaker: 'Pac-Man', text: 'She anticipates my movements. I need to be unpredictable!' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 1.1,
                specialGhost: { name: 'pinky', behavior: 'aggressive_predict' },
                rewards: { points: 3500 }
            },
            {
                id: 3,
                name: 'Inky\'s Ambush',
                objective: 'Navigate while Inky flanks from all sides',
                objectiveType: 'clear_dots',
                map: 'haunted_mansion',
                dialogue: {
                    intro: [
                        { speaker: 'Inky', text: 'Working with Blinky, we\'ll corner you!' },
                        { speaker: 'Pac-Man', text: 'They\'re coordinating! This is dangerous.' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 1.1,
                specialGhost: { name: 'inky', behavior: 'flanker' },
                rewards: { points: 4000, unlock: 'haunted_mansion_map' }
            },
            {
                id: 4,
                name: 'Clyde\'s Chaos',
                objective: 'Deal with Clyde\'s unpredictable behavior',
                objectiveType: 'clear_dots',
                map: 'haunted_mansion',
                dialogue: {
                    intro: [
                        { speaker: 'Clyde', text: 'I don\'t even know what I\'m doing! Hehe!' },
                        { speaker: 'Pac-Man', text: 'This one is... strange. Hard to predict.' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 1.0,
                specialGhost: { name: 'clyde', behavior: 'erratic' },
                rewards: { points: 4500 }
            },
            {
                id: 5,
                name: 'Ghost Gauntlet',
                objective: 'Eat 8 ghosts in one level',
                objectiveType: 'eat_ghosts',
                targetValue: 8,
                map: 'haunted_mansion',
                dialogue: {
                    intro: [
                        { speaker: 'All Ghosts', text: 'Together we are unstoppable!' },
                        { speaker: 'Pac-Man', text: 'Time to show them who\'s boss!' }
                    ],
                    outro: [
                        { speaker: 'Pac-Man', text: 'The ghosts retreat... for now.' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 1.1,
                extraPowerPellets: true,
                rewards: { points: 6000, unlockChapter: 3 }
            }
        ]
    },

    CHAPTER_3: {
        id: 3,
        name: 'The Fruit Kingdom',
        icon: '🍒',
        description: 'Enter the realm of bonus fruits and discover new powers!',
        color: '#ff6600',
        unlocked: false,
        levels: [
            {
                id: 1,
                name: 'Cherry Orchard',
                objective: 'Collect 5 cherries',
                objectiveType: 'collect_fruits',
                targetValue: 5,
                fruitType: 'cherry',
                map: 'candy_land',
                dialogue: {
                    intro: [
                        { speaker: 'Narrator', text: 'Welcome to the Fruit Kingdom, land of bonuses!' },
                        { speaker: 'Pac-Man', text: 'Everything here looks delicious!' }
                    ]
                },
                ghostCount: 3,
                ghostSpeed: 1.0,
                fruitsToSpawn: 6,
                rewards: { points: 3500, unlock: 'candy_land_map' }
            },
            {
                id: 2,
                name: 'Strawberry Fields',
                objective: 'Score 10,000 points from fruits alone',
                objectiveType: 'fruit_score',
                targetValue: 10000,
                map: 'candy_land',
                dialogue: {
                    intro: [
                        { speaker: 'Pac-Man', text: 'These fruits are worth so many points!' }
                    ]
                },
                ghostCount: 3,
                ghostSpeed: 1.0,
                fruitsToSpawn: 10,
                rewards: { points: 4000 }
            },
            {
                id: 3,
                name: 'Power Pellet Garden',
                objective: 'Use power pellets 5 times',
                objectiveType: 'use_power',
                targetValue: 5,
                map: 'jungle_temple',
                dialogue: {
                    intro: [
                        { speaker: 'Narrator', text: 'The ancient temple holds many power pellets.' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 1.0,
                extraPowerPellets: true,
                rewards: { points: 4500, unlock: 'jungle_temple_map' }
            },
            {
                id: 4,
                name: 'Golden Fruit',
                objective: 'Find and collect the legendary golden fruit',
                objectiveType: 'collect_special',
                targetValue: 1,
                specialItem: 'golden_fruit',
                map: 'jungle_temple',
                dialogue: {
                    intro: [
                        { speaker: 'Narrator', text: 'Legend speaks of a golden fruit worth 10,000 points...' },
                        { speaker: 'Pac-Man', text: 'I must find it!' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 1.1,
                rewards: { points: 15000 }
            },
            {
                id: 5,
                name: 'Fruit Fiesta',
                objective: 'Collect one of every fruit type',
                objectiveType: 'collect_all_fruits',
                targetValue: 8,
                map: 'candy_land',
                dialogue: {
                    intro: [
                        { speaker: 'Pac-Man', text: 'A feast awaits! Time to collect them all!' }
                    ],
                    outro: [
                        { speaker: 'Pac-Man', text: 'The Fruit Kingdom crown is mine!' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 1.0,
                fruitsToSpawn: 12,
                rewards: { points: 8000, unlockChapter: 4 }
            }
        ]
    },

    CHAPTER_4: {
        id: 4,
        name: 'Shadow Realm',
        icon: '🌑',
        description: 'Enter the dark dimension where visibility is limited.',
        color: '#440066',
        unlocked: false,
        levels: [
            {
                id: 1,
                name: 'Dim Corridors',
                objective: 'Navigate with reduced visibility',
                objectiveType: 'clear_dots',
                map: 'haunted_mansion',
                dialogue: {
                    intro: [
                        { speaker: 'Narrator', text: 'The Shadow Realm consumes all light...' },
                        { speaker: 'Pac-Man', text: 'I can barely see ahead!' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 0.9,
                visibility: 4, // Cell visibility radius
                rewards: { points: 4000 }
            },
            {
                id: 2,
                name: 'Sonic Navigation',
                objective: 'Use sound cues to avoid ghosts',
                objectiveType: 'clear_dots',
                map: 'crystal_cave',
                dialogue: {
                    intro: [
                        { speaker: 'Pac-Man', text: 'I can hear them coming... Focus!' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 1.0,
                visibility: 3,
                audioHints: true,
                rewards: { points: 4500, unlock: 'crystal_cave_map' }
            },
            {
                id: 3,
                name: 'Light Bearer',
                objective: 'Collect light orbs to restore vision',
                objectiveType: 'collect_orbs',
                targetValue: 10,
                map: 'crystal_cave',
                dialogue: {
                    intro: [
                        { speaker: 'Narrator', text: 'Light orbs temporarily restore your sight.' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 1.0,
                visibility: 2,
                lightOrbs: true,
                rewards: { points: 5000 }
            },
            {
                id: 4,
                name: 'Shadow Ghosts',
                objective: 'Survive against invisible ghosts',
                objectiveType: 'clear_dots',
                map: 'space_station',
                dialogue: {
                    intro: [
                        { speaker: '???', text: 'You cannot see us, but we see you...' },
                        { speaker: 'Pac-Man', text: 'Invisible ghosts?! Where are they?!' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 1.0,
                invisibleGhosts: true,
                rewards: { points: 6000, unlock: 'space_station_map' }
            },
            {
                id: 5,
                name: 'Realm of Shadows',
                objective: 'Complete with minimal visibility and fast ghosts',
                objectiveType: 'clear_dots',
                map: 'space_station',
                dialogue: {
                    intro: [
                        { speaker: 'Shadow King', text: 'None escape my realm!' },
                        { speaker: 'Pac-Man', text: 'I will bring light to this darkness!' }
                    ],
                    outro: [
                        { speaker: 'Pac-Man', text: 'The shadows fade... One challenge remains.' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 1.2,
                visibility: 2,
                rewards: { points: 10000, unlockChapter: 5 }
            }
        ]
    },

    CHAPTER_5: {
        id: 5,
        name: 'Final Showdown',
        icon: '⚔️',
        description: 'Face the Ghost King and save Maze World forever!',
        color: '#ff0000',
        unlocked: false,
        levels: [
            {
                id: 1,
                name: 'The Gauntlet',
                objective: 'Clear 3 maze variants in sequence',
                objectiveType: 'multi_maze',
                targetValue: 3,
                maps: ['volcano', 'clockwork', 'digital_grid'],
                dialogue: {
                    intro: [
                        { speaker: 'Ghost King', text: 'You dare approach my domain?!' },
                        { speaker: 'Pac-Man', text: 'It ends here, Ghost King!' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 1.2,
                rewards: { points: 8000 }
            },
            {
                id: 2,
                name: 'Elite Guard',
                objective: 'Defeat enhanced ghosts with special abilities',
                objectiveType: 'eat_ghosts',
                targetValue: 12,
                map: 'dragon_castle',
                dialogue: {
                    intro: [
                        { speaker: 'Elite Blinky', text: 'We are the Ghost King\'s elite!' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 1.3,
                eliteGhosts: true,
                rewards: { points: 10000, unlock: 'dragon_castle_map' }
            },
            {
                id: 3,
                name: 'Trap Master',
                objective: 'Navigate through trap-filled maze',
                objectiveType: 'clear_dots',
                map: 'laboratory',
                dialogue: {
                    intro: [
                        { speaker: 'Ghost King', text: 'Let\'s see you handle my traps!' }
                    ]
                },
                ghostCount: 4,
                ghostSpeed: 1.1,
                trapMaze: true,
                rewards: { points: 8000, unlock: 'laboratory_map' }
            },
            {
                id: 4,
                name: 'Ghost Army',
                objective: 'Survive waves of ghosts',
                objectiveType: 'survive_time',
                targetValue: 120,
                map: 'volcano',
                dialogue: {
                    intro: [
                        { speaker: 'Ghost King', text: 'Face my endless army!' },
                        { speaker: 'Pac-Man', text: '120 seconds. I can do this!' }
                    ]
                },
                ghostCount: 6,
                ghostSpeed: 1.2,
                ghostWaves: true,
                rewards: { points: 12000, unlock: 'volcano_map' }
            },
            {
                id: 5,
                name: 'The Ghost King',
                objective: 'Defeat the Ghost King boss',
                objectiveType: 'boss_battle',
                map: 'rainbow_road',
                dialogue: {
                    intro: [
                        { speaker: 'Ghost King', text: 'ENOUGH! I will end you myself!' },
                        { speaker: 'Pac-Man', text: 'This is it. For Maze World!' }
                    ],
                    outro: [
                        { speaker: 'Ghost King', text: 'Impossible... Defeated by a yellow circle...' },
                        { speaker: 'Pac-Man', text: 'Maze World is free! Peace is restored!' },
                        { speaker: 'Narrator', text: 'Congratulations! You have completed Pac-Man Story Mode!' }
                    ]
                },
                bossSettings: {
                    health: 20,
                    phases: 3,
                    attacks: ['ghost_summon', 'power_drain', 'speed_boost', 'invisibility']
                },
                rewards: { points: 50000, unlock: 'rainbow_road_map', title: 'Maze Champion' }
            }
        ]
    }
};

/**
 * Story Mode Manager
 */
export class StoryModeManager {
    constructor(game) {
        this.game = game;
        this.currentChapter = null;
        this.currentLevel = null;
        this.progress = this.loadProgress();
        this.levelStats = {
            startTime: 0,
            ghostsEaten: 0,
            deaths: 0,
            fruitsCollected: 0,
            powerUpsUsed: 0
        };
        this.dialogueQueue = [];
        this.showingDialogue = false;
    }

    loadProgress() {
        const saved = localStorage.getItem('pacman_story_progress');
        return saved ? JSON.parse(saved) : {
            chaptersUnlocked: [1],
            chaptersCompleted: [],
            levelsCompleted: {},
            totalStars: 0,
            bestTimes: {}
        };
    }

    saveProgress() {
        localStorage.setItem('pacman_story_progress', JSON.stringify(this.progress));
    }

    startChapter(chapterId) {
        const chapter = STORY_CHAPTERS[`CHAPTER_${chapterId}`];
        if (!chapter || !this.progress.chaptersUnlocked.includes(chapterId)) {
            return false;
        }

        this.currentChapter = chapter;
        return true;
    }

    startLevel(levelIndex) {
        if (!this.currentChapter || levelIndex >= this.currentChapter.levels.length) {
            return false;
        }

        this.currentLevel = this.currentChapter.levels[levelIndex];
        this.resetLevelStats();

        // Apply level settings
        this.game.ghostCount = this.currentLevel.ghostCount;
        this.game.ghostSpeedMultiplier = this.currentLevel.ghostSpeed;

        if (this.currentLevel.visibility) {
            this.game.visibilityRadius = this.currentLevel.visibility;
        }

        if (this.currentLevel.map) {
            this.game.mapManager?.setMap(this.currentLevel.map);
        }

        // Show intro dialogue
        if (this.currentLevel.dialogue?.intro) {
            this.showDialogue(this.currentLevel.dialogue.intro);
        }

        return true;
    }

    resetLevelStats() {
        this.levelStats = {
            startTime: Date.now(),
            ghostsEaten: 0,
            deaths: 0,
            fruitsCollected: 0,
            powerUpsUsed: 0,
            objectiveProgress: 0
        };
    }

    showDialogue(dialogueArray, callback = null) {
        this.dialogueQueue = [...dialogueArray];
        this.showingDialogue = true;
        this.dialogueCallback = callback;
        this.showNextDialogue();
    }

    showNextDialogue() {
        if (this.dialogueQueue.length === 0) {
            this.showingDialogue = false;
            this.hideDialogueUI();
            if (this.dialogueCallback) {
                this.dialogueCallback();
            }
            return;
        }

        const dialogue = this.dialogueQueue.shift();
        this.displayDialogueUI(dialogue);
    }

    displayDialogueUI(dialogue) {
        const container = document.getElementById('dialogue-container') || this.createDialogueContainer();
        
        container.innerHTML = `
            <div class="dialogue-box">
                <div class="dialogue-speaker">${dialogue.speaker}</div>
                <div class="dialogue-text">${dialogue.text}</div>
                <div class="dialogue-continue">Click or press SPACE to continue</div>
            </div>
        `;
        container.style.display = 'flex';
    }

    createDialogueContainer() {
        const container = document.createElement('div');
        container.id = 'dialogue-container';
        container.className = 'dialogue-container';
        container.addEventListener('click', () => this.showNextDialogue());
        document.body.appendChild(container);
        return container;
    }

    hideDialogueUI() {
        const container = document.getElementById('dialogue-container');
        if (container) {
            container.style.display = 'none';
        }
    }

    updateObjective(type, value = 1) {
        if (!this.currentLevel) return;

        const objective = this.currentLevel.objectiveType;

        switch (objective) {
            case 'eat_ghosts':
                if (type === 'ghost_eaten') {
                    this.levelStats.ghostsEaten += value;
                    this.levelStats.objectiveProgress = this.levelStats.ghostsEaten;
                }
                break;
            case 'collect_fruits':
                if (type === 'fruit_collected') {
                    this.levelStats.fruitsCollected += value;
                    this.levelStats.objectiveProgress = this.levelStats.fruitsCollected;
                }
                break;
            case 'time_limit':
            case 'survive_time':
                const elapsed = (Date.now() - this.levelStats.startTime) / 1000;
                this.levelStats.objectiveProgress = elapsed;
                break;
            case 'use_power':
                if (type === 'power_used') {
                    this.levelStats.powerUpsUsed += value;
                    this.levelStats.objectiveProgress = this.levelStats.powerUpsUsed;
                }
                break;
        }

        this.game.updateObjectiveUI?.();
    }

    checkObjectiveComplete() {
        if (!this.currentLevel) return false;

        const target = this.currentLevel.targetValue;
        const progress = this.levelStats.objectiveProgress;

        switch (this.currentLevel.objectiveType) {
            case 'clear_dots':
                return this.game.dotsRemaining === 0;
            case 'eat_ghosts':
                return this.levelStats.ghostsEaten >= target;
            case 'collect_fruits':
                return this.levelStats.fruitsCollected >= target;
            case 'time_limit':
                return this.game.dotsRemaining === 0 && progress <= target;
            case 'survive_time':
                return progress >= target;
            case 'use_power':
                return this.levelStats.powerUpsUsed >= target && this.game.dotsRemaining === 0;
            default:
                return this.game.dotsRemaining === 0;
        }
    }

    completeLevel() {
        if (!this.currentLevel || !this.currentChapter) return;

        const chapterId = this.currentChapter.id;
        const levelId = this.currentLevel.id;
        const key = `${chapterId}-${levelId}`;

        // Mark as completed
        if (!this.progress.levelsCompleted[key]) {
            this.progress.levelsCompleted[key] = true;
        }

        // Calculate stars (1-3 based on performance)
        const stars = this.calculateStars();
        
        // Apply rewards
        if (this.currentLevel.rewards) {
            if (this.currentLevel.rewards.points) {
                this.game.addScore(this.currentLevel.rewards.points);
            }
            if (this.currentLevel.rewards.unlockChapter) {
                const nextChapter = this.currentLevel.rewards.unlockChapter;
                if (!this.progress.chaptersUnlocked.includes(nextChapter)) {
                    this.progress.chaptersUnlocked.push(nextChapter);
                    this.game.showNotification(`Chapter ${nextChapter} Unlocked!`);
                }
            }
            if (this.currentLevel.rewards.unlock) {
                this.game.mapManager?.unlockMap(this.currentLevel.rewards.unlock);
            }
        }

        // Show outro dialogue
        if (this.currentLevel.dialogue?.outro) {
            this.showDialogue(this.currentLevel.dialogue.outro, () => {
                this.showLevelCompleteScreen(stars);
            });
        } else {
            this.showLevelCompleteScreen(stars);
        }

        // Check chapter completion
        const allLevelsComplete = this.currentChapter.levels.every(
            (_, idx) => this.progress.levelsCompleted[`${chapterId}-${idx + 1}`]
        );

        if (allLevelsComplete && !this.progress.chaptersCompleted.includes(chapterId)) {
            this.progress.chaptersCompleted.push(chapterId);
            this.game.achievementSystem?.onStoryChapterComplete();
        }

        this.saveProgress();
    }

    calculateStars() {
        const elapsed = (Date.now() - this.levelStats.startTime) / 1000;
        const deaths = this.levelStats.deaths;
        
        let stars = 1; // Base star for completion

        if (deaths === 0) stars++;
        if (elapsed < 120) stars++;

        return Math.min(3, stars);
    }

    showLevelCompleteScreen(stars) {
        const screen = document.createElement('div');
        screen.className = 'level-complete-screen';
        screen.innerHTML = `
            <div class="level-complete-content">
                <h2>Level Complete!</h2>
                <div class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
                <div class="level-stats">
                    <p>Time: ${Math.floor((Date.now() - this.levelStats.startTime) / 1000)}s</p>
                    <p>Ghosts Eaten: ${this.levelStats.ghostsEaten}</p>
                    <p>Deaths: ${this.levelStats.deaths}</p>
                </div>
                <div class="level-complete-buttons">
                    <button class="btn-next">Next Level</button>
                    <button class="btn-retry">Retry</button>
                    <button class="btn-menu">Chapter Select</button>
                </div>
            </div>
        `;

        document.body.appendChild(screen);

        screen.querySelector('.btn-next')?.addEventListener('click', () => {
            screen.remove();
            this.nextLevel();
        });

        screen.querySelector('.btn-retry')?.addEventListener('click', () => {
            screen.remove();
            this.restartLevel();
        });

        screen.querySelector('.btn-menu')?.addEventListener('click', () => {
            screen.remove();
            this.showChapterSelect();
        });
    }

    nextLevel() {
        if (!this.currentChapter || !this.currentLevel) return;

        const nextIndex = this.currentLevel.id; // id is 1-indexed, so this is already next index
        if (nextIndex < this.currentChapter.levels.length) {
            this.startLevel(nextIndex);
            this.game.reset();
            this.game.start();
        } else {
            this.showChapterSelect();
        }
    }

    restartLevel() {
        if (!this.currentChapter || !this.currentLevel) return;
        this.startLevel(this.currentLevel.id - 1);
        this.game.reset();
        this.game.start();
    }

    showChapterSelect() {
        // Implemented in UI
        this.game.showStoryMenu?.();
    }

    getChapters() {
        return Object.values(STORY_CHAPTERS).map(chapter => ({
            ...chapter,
            unlocked: this.progress.chaptersUnlocked.includes(chapter.id),
            completed: this.progress.chaptersCompleted.includes(chapter.id),
            levelsComplete: chapter.levels.filter(
                (_, idx) => this.progress.levelsCompleted[`${chapter.id}-${idx + 1}`]
            ).length
        }));
    }

    getCurrentObjectiveText() {
        if (!this.currentLevel) return '';
        
        const progress = this.levelStats.objectiveProgress;
        const target = this.currentLevel.targetValue;

        switch (this.currentLevel.objectiveType) {
            case 'eat_ghosts':
                return `Ghosts: ${progress}/${target}`;
            case 'collect_fruits':
                return `Fruits: ${progress}/${target}`;
            case 'time_limit':
                return `Time: ${Math.floor(progress)}s / ${target}s`;
            case 'survive_time':
                return `Survive: ${Math.floor(progress)}s / ${target}s`;
            default:
                return this.currentLevel.objective;
        }
    }

    isActive() {
        return this.currentLevel !== null;
    }
}
