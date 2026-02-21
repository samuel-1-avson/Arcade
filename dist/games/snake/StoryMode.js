/**
 * Snake Game - Story Mode System
 * Handles campaign progression, detailed level data, cutscenes, and boss battles
 */

export const STORY_WORLDS = [
    {
        id: 'garden',
        name: 'The Living Garden',
        description: 'A peaceful start, but something lurks beneath the leaves.',
        theme: { bg: '#0a150a', grid: 'rgba(0,255,100,0.05)', snake: '#00ff88', wall: '#1a3a1a' },
        levels: 10,
        // ENHANCED: Environmental effects
        weather: 'none',
        ambience: 'birds',
        hazardTypes: ['thorns', 'moving_vine'],
        specialFood: { type: 'apple', bonus: 5 },
        // ENHANCED: Environmental storytelling
        loreItems: [
            { level: 2, text: 'A withered sign reads: "BEWARE THE HARVESTER"' },
            { level: 5, text: 'Scorch marks on the ground... something big passed through here.' },
            { level: 8, text: 'An old snake skeleton. How long has this been going on?' }
        ],
        // ENHANCED: Mid-level events
        events: [
            { level: 3, type: 'ambush', message: 'Vines emerge from the ground!' },
            { level: 7, type: 'treasure', message: 'You found a hidden cache of food!' }
        ],
        boss: {
            name: 'The Harvester',
            type: 'lawnmower',
            hp: 3,
            phases: 2
        },
        introCutscene: [
            { speaker: 'Snake', text: "What a beautiful day..." },
            { speaker: 'Snake', text: "Wait, where did all the food go?" },
            { speaker: '???', text: "THE HARVEST HAS BEGUN.", color: '#ff0000' }
        ],
        outroCutscene: [
            { speaker: 'Snake', text: "That machine... it was just the beginning." },
            { speaker: 'Guide', text: "The ice caves to the north. That's where they came from." }
        ]
    },
    {
        id: 'ice',
        name: 'Crystal Caverns',
        description: 'Slippery surfaces and frozen dangers.',
        theme: { bg: '#050812', grid: 'rgba(100,200,255,0.06)', snake: '#00ccff', wall: '#4a6d8c' },
        levels: 10,
        unlockRequirement: 'garden_complete',
        weather: 'snow',
        ambience: 'wind',
        hazardTypes: ['icicle', 'slippery_floor', 'freeze_trap'],
        specialFood: { type: 'ice_crystal', bonus: 8, effect: 'speed_boost' },
        loreItems: [
            { level: 1, text: 'Ice formations create an eerie glow.' },
            { level: 4, text: 'Frozen creatures peer at you from within the walls.' },
            { level: 6, text: 'Ancient runes etched in the ice. "BEWARE THE COLD ONES"' },
            { level: 9, text: "The air grows colder. You're close to the serpent's lair." }
        ],
        events: [
            { level: 2, type: 'blizzard', message: 'A blizzard reduces visibility!' },
            { level: 5, type: 'ice_slide', message: 'The floor is extra slippery!' },
            { level: 8, type: 'miniboss', message: 'A frozen guardian awakens!' }
        ],
        boss: {
            name: 'Cryo Serpent',
            type: 'ice_wyrm',
            hp: 5,
            phases: 2
        },
        introCutscene: [
            { speaker: 'Snake', text: "Brrr... it's cold here." },
            { speaker: 'Guide', text: "Watch your step! The ice is slippery." },
            { speaker: 'Guide', text: "Legend says an ancient serpent sleeps in these caves..." }
        ],
        outroCutscene: [
            { speaker: 'Snake', text: "The serpent... it was protecting something." },
            { speaker: 'Guide', text: "The source of the cold. It comes from deep below." }
        ]
    },
    {
        id: 'volcano',
        name: 'Magma Depths',
        description: 'The floor is lava. Literally.',
        theme: { bg: '#150500', grid: 'rgba(255,50,0,0.06)', snake: '#ff4400', wall: '#8b0000' },
        levels: 10,
        unlockRequirement: 'ice_complete',
        weather: 'fire',
        ambience: 'rumble',
        hazardTypes: ['lava_pool', 'eruption', 'falling_rock', 'fire_jet'],
        specialFood: { type: 'ember', bonus: 10, effect: 'fire_immunity' },
        loreItems: [
            { level: 2, text: 'Obsidian pillars mark an ancient pathway.' },
            { level: 4, text: 'Cave paintings depict a great fire serpent.' },
            { level: 6, text: 'Bones of creatures who ventured too deep.' },
            { level: 8, text: "The heat is unbearable. You must be near the core." }
        ],
        events: [
            { level: 3, type: 'eruption', message: 'The volcano rumbles! Dodge the falling rocks!' },
            { level: 5, type: 'lava_rise', message: 'Lava is rising! Move to higher ground!' },
            { level: 9, type: 'earthquake', message: 'The ground shakes violently!' }
        ],
        boss: {
            name: 'Magma King',
            type: 'fire_elemental',
            hp: 8,
            phases: 3
        },
        introCutscene: [
            { speaker: 'Snake', text: "Is it hot in here or is it just me?" },
            { speaker: 'Guide', text: "This is the heart of the mountain." },
            { speaker: 'Guide', text: "The Magma King has ruled here for centuries." }
        ],
        outroCutscene: [
            { speaker: 'Snake', text: "The fire... it was being controlled." },
            { speaker: 'Guide', text: "There's a signal coming from the city above." }
        ]
    },
    {
        id: 'cyber',
        name: 'Neon Metropolis',
        description: 'A digital realm of glitchy hazards.',
        theme: { bg: '#000510', grid: 'rgba(0,255,255,0.08)', snake: '#00ffaa', wall: '#003344' },
        levels: 10,
        unlockRequirement: 'volcano_complete',
        weather: 'digital',
        ambience: 'synth',
        hazardTypes: ['glitch_zone', 'laser_grid', 'data_stream', 'firewall'],
        specialFood: { type: 'data_packet', bonus: 12, effect: 'ghost' },
        loreItems: [
            { level: 1, text: 'Holographic billboards flicker with corrupted data.' },
            { level: 3, text: 'ERROR 404: REALITY NOT FOUND' },
            { level: 5, text: 'Fragments of code float in the air: "SYSTEM.OVERRIDE()"' },
            { level: 7, text: "User logs: 'Don't trust the AI. It's watching.'" },
            { level: 9, text: 'WARNING: FIREWALL BREACH DETECTED' }
        ],
        events: [
            { level: 2, type: 'virus_attack', message: 'Malware detected! Corruption spreading!' },
            { level: 4, type: 'system_glitch', message: 'Reality is glitching!' },
            { level: 6, type: 'security_alert', message: 'Security drones deployed!' },
            { level: 8, type: 'blackout', message: 'System blackout! Limited visibility!' }
        ],
        boss: {
            name: 'System.EXE',
            type: 'virus',
            hp: 10,
            phases: 3
        },
        introCutscene: [
            { speaker: 'Snake', text: "Everything looks... digital." },
            { speaker: 'System', text: "INTRUDER DETECTED." },
            { speaker: 'System', text: "INITIATING DELETION PROTOCOL." }
        ],
        outroCutscene: [
            { speaker: 'Snake', text: "The program... it wasn't evil. It was scared." },
            { speaker: 'Guide', text: "Something beyond the firewall. Something ancient." }
        ]
    },
    {
        id: 'void',
        name: 'The Void',
        description: 'The edge of existence. Reality breaks down here.',
        theme: { bg: '#000000', grid: 'rgba(100,0,200,0.1)', snake: '#ffffff', wall: '#333333' },
        levels: 10,
        unlockRequirement: 'cyber_complete',
        weather: 'void',
        ambience: 'silence',
        hazardTypes: ['void_tear', 'gravity_well', 'shadow', 'reality_break'],
        specialFood: { type: 'void_essence', bonus: 15, effect: 'invincible' },
        loreItems: [
            { level: 1, text: '...' },
            { level: 3, text: 'echoes of what once was' },
            { level: 5, text: 'THE END IS THE BEGINNING' },
            { level: 7, text: 'Fragments of memories float past. Your memories?' },
            { level: 9, text: 'ENTROPY AWAITS' }
        ],
        events: [
            { level: 2, type: 'reality_shift', message: 'Reality shifts! Everything is inverted!' },
            { level: 4, type: 'void_creatures', message: 'Shadows emerge from the darkness!' },
            { level: 6, type: 'time_loop', message: 'Time loops! You feel déjà vu...' },
            { level: 8, type: 'dimension_collapse', message: 'The dimension is collapsing!' }
        ],
        boss: {
            name: 'Entropy',
            type: 'shadow',
            hp: 15,
            phases: 4
        },
        introCutscene: [
            { speaker: 'Snake', text: "There's nothing here..." },
            { speaker: 'Entropy', text: "EXACTLY." },
            { speaker: 'Entropy', text: "NOTHING. AND EVERYTHING." },
            { speaker: 'Entropy', text: "I AM THE END OF ALL THINGS." }
        ],
        outroCutscene: [
            { speaker: 'Snake', text: "I... I did it?" },
            { speaker: '???', text: "You have proven yourself, little snake." },
            { speaker: '???', text: "The cycle continues. Until next time." },
            { speaker: 'Snake', text: "Wait, what do you mean—" }
        ],
        isEndgame: true
    }
];

export class StoryMode {
    constructor(game) {
        this.game = game;
        this.currentWorldIndex = 0;
        this.currentLevelIndex = 0;
        this.progress = this.loadProgress();
        this.inCutscene = false;
        this.cutsceneStep = 0;
        this.cutsceneData = null;
        
        // UI Elements
        this.dialogBox = null;
        this.createDialogUI();
    }
    
    loadProgress() {
        const saved = localStorage.getItem('snake_story_progress');
        return saved ? JSON.parse(saved) : {
            unlockedWorlds: ['garden'],
            completedLevels: [], // Array of 'worldId_levelIndex'
            collectibles: []
        };
    }
    
    saveProgress() {
        localStorage.setItem('snake_story_progress', JSON.stringify(this.progress));
    }
    
    startWorld(worldIndex) {
        if (worldIndex >= STORY_WORLDS.length) return;
        
        this.currentWorldIndex = worldIndex;
        const world = STORY_WORLDS[worldIndex];
        
        // Start from first uncompleted level in this world
        let startLevel = 0;
        for (let i = 0; i < world.levels; i++) {
            if (!this.progress.completedLevels.includes(`${world.id}_${i}`)) {
                startLevel = i;
                break;
            }
        }
        
        this.currentLevelIndex = startLevel;
        
        if (world.introCutscene && startLevel === 0) {
            this.playCutscene(world.introCutscene);
        } else {
            this.startLevel(startLevel);
        }
    }
    
    startLevel(levelIndex) {
        const world = STORY_WORLDS[this.currentWorldIndex];
        
        // Configure game for this level
        // In a real implementation, we would load specific map data for each of the 50 levels.
        // For now, we procedurally generate/configure based on world theme and difficulty.
        
        const difficulty = (this.currentWorldIndex * 10 + levelIndex) / 50; // 0 to 1
        
        const levelConfig = {
            id: `story_${world.id}_${levelIndex}`,
            name: `${world.name} - ${levelIndex + 1}`,
            speed: Math.max(0.06, 0.15 - (difficulty * 0.08)), // Faster as you go
            goal: 10 + Math.floor(difficulty * 20),
            theme: world.theme,
            obstacles: this.generateLevelObstacles(world.id, levelIndex)
        };
        
        // Pass configuration to game
        this.game.loadLevel(levelConfig);
        this.game.gameMode = 'STORY';
        this.game.onReset();
    }
    
    generateLevelObstacles(worldId, levelIndex) {
        const obstacles = [];
        const count = 5 + levelIndex * 2;
        const gridSize = 30; // Match game settings
        
        // Generate obstacles avoiding center (spawn)
        for (let i = 0; i < count; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (gridSize - 4)) + 2;
                y = Math.floor(Math.random() * (gridSize - 4)) + 2;
            } while (Math.abs(x - gridSize/2) < 4 && Math.abs(y - gridSize/2) < 4);
            
            // Add dynamic obstacles based on world
            let type = 'static';
            if (worldId === 'industrial' && i % 3 === 0) type = 'moving';
            if (worldId === 'void' && i % 4 === 0) type = 'fading'; // Conceptual
            
            obstacles.push({ x, y, type });
        }
        
        return obstacles;
    }
    
    completeLevel() {
        const world = STORY_WORLDS[this.currentWorldIndex];
        const levelId = `${world.id}_${this.currentLevelIndex}`;
        
        if (!this.progress.completedLevels.includes(levelId)) {
            this.progress.completedLevels.push(levelId);
            this.saveProgress();
        }
        
        // Check for boss battle
        if (this.currentLevelIndex === world.levels - 1) {
            this.startBossBattle(world.boss);
        } else {
            // Next level
            this.currentLevelIndex++;
            if (this.currentLevelIndex < world.levels) {
                this.startLevel(this.currentLevelIndex);
            } else {
                // World Complete
                this.unlockNextWorld();
            }
        }
    }
    
    startBossBattle(bossData) {
        // Import and create boss battle
        import('./BossBattle.js').then(module => {
            const world = STORY_WORLDS[this.currentWorldIndex];
            this.currentBoss = new module.BossBattle(this.game, bossData, world.id);
            this.game.currentBoss = this.currentBoss;
            this.currentBoss.start();
        });
    }
    
    unlockNextWorld() {
        const nextWorldIndex = this.currentWorldIndex + 1;
        if (nextWorldIndex < STORY_WORLDS.length) {
            const nextWorld = STORY_WORLDS[nextWorldIndex];
            if (!this.progress.unlockedWorlds.includes(nextWorld.id)) {
                this.progress.unlockedWorlds.push(nextWorld.id);
                this.saveProgress();
                alert(`UNLOCKED WORLD: ${nextWorld.name}`);
            }
            this.startWorld(nextWorldIndex);
        } else {
            alert("CAMPAIGN COMPLETE! YOU ARE THE SNAKE GOD!");
        }
    }
    
    // UI & Cutscenes
    createDialogUI() {
        const existing = document.getElementById('story-dialog');
        if (existing) {
            this.dialogBox = existing;
            return;
        }
        
        const div = document.createElement('div');
        div.id = 'story-dialog';
        div.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            max-width: 600px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #fff;
            padding: 20px;
            color: #fff;
            font-family: 'Orbitron', sans-serif;
            display: none;
            z-index: 1000;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
        `;
        div.innerHTML = `
            <h3 id="dialog-speaker" style="margin: 0 0 10px 0; color: #00ff88;">Snake</h3>
            <p id="dialog-text" style="margin: 0; font-size: 1.1em; line-height: 1.5;"></p>
            <div style="text-align: right; margin-top: 10px; font-size: 0.8em; color: #888;">Press SPACE to continue</div>
        `;
        document.body.appendChild(div);
        this.dialogBox = div;
    }
    
    playCutscene(data) {
        this.inCutscene = true;
        this.cutsceneData = data;
        this.cutsceneStep = 0;
        this.showDialogStep();
        this.game.togglePause(true); // Pause game logic
    }
    
    showDialogStep() {
        if (!this.cutsceneData[this.cutsceneStep]) {
            this.endCutscene();
            return;
        }
        
        const step = this.cutsceneData[this.cutsceneStep];
        const speakerEl = document.getElementById('dialog-speaker');
        const textEl = document.getElementById('dialog-text');
        
        speakerEl.textContent = step.speaker;
        speakerEl.style.color = step.color || '#00ff88';
        textEl.textContent = step.text;
        
        this.dialogBox.style.display = 'block';
    }
    
    advanceDialog() {
        if (!this.inCutscene) return;
        
        this.cutsceneStep++;
        if (this.cutsceneStep >= this.cutsceneData.length) {
            this.endCutscene();
        } else {
            this.showDialogStep();
        }
    }
    
    endCutscene() {
        this.inCutscene = false;
        this.dialogBox.style.display = 'none';
        this.game.togglePause(false); // Unpause
        this.startLevel(this.currentLevelIndex);
    }
}
