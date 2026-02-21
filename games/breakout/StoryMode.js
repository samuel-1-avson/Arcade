/**
 * Breakout Game - Story Mode System
 * 5 Worlds, 50 Levels, Boss Battles, Cutscenes, Campaign Progression
 */

import { ICONS } from './Icons.js';

// Story Worlds Definition
export const STORY_WORLDS = [
    {
        id: 'neon',
        name: 'Neon City',
        description: 'A cyberpunk metropolis of flashing lights and moving bricks.',
        theme: {
            bg: '#0a0a1a',
            paddle: '#00ffff',
            ball: '#ffffff',
            glowColor: '#00ffff'
        },
        colors: ['#ff0055', '#ff6600', '#ffcc00', '#00ff66', '#00ccff', '#9933ff'],
        levels: 10,
        weather: 'none',
        ambience: 'synth',
        hazardTypes: ['moving'],
        specialMechanic: 'Moving bricks that dodge your ball',
        loreItems: [
            { level: 2, text: 'Holographic signs flicker: "WELCOME TO THE GRID"' },
            { level: 5, text: 'Data streams flow through the air around you.' },
            { level: 8, text: 'WARNING: SYSTEM ANOMALY DETECTED' }
        ],
        events: [
            { level: 3, type: 'voltage', message: 'Power surge! Some bricks are electrified!' },
            { level: 7, type: 'blackout', message: 'Brief blackout! Watch your timing!' }
        ],
        boss: {
            name: 'GLITCH LORD',
            type: 'glitch',
            hp: 5,
            phases: 2,
            abilities: ['teleport', 'spawn_minions', 'screen_glitch']
        },
        introCutscene: [
            { speaker: 'SYSTEM', text: 'INITIALIZING BREAKOUT PROTOCOL...' },
            { speaker: 'PLAYER', text: 'What is this place?' },
            { speaker: 'SYSTEM', text: 'WELCOME TO THE GRID. BREAK FREE... IF YOU CAN.' }
        ],
        outroCutscene: [
            { speaker: 'PLAYER', text: 'The Glitch Lord is defeated!' },
            { speaker: 'SYSTEM', text: 'THERMAL ANOMALY DETECTED. PROCEED TO CRYSTAL CAVERNS.' }
        ]
    },
    {
        id: 'ice',
        name: 'Crystal Caverns',
        description: 'Frozen depths where ice bricks slow your ball.',
        theme: {
            bg: '#050812',
            paddle: '#00ccff',
            ball: '#aaeeff',
            glowColor: '#00ccff'
        },
        colors: ['#aaeeff', '#88ddff', '#66ccff', '#44bbff', '#22aaff', '#0099ff'],
        levels: 10,
        unlockRequirement: 'neon_complete',
        weather: 'snow',
        ambience: 'wind',
        hazardTypes: ['ice', 'regenerating'],
        specialMechanic: 'Ice bricks slow your ball on contact',
        loreItems: [
            { level: 1, text: 'Ice crystals hum with ancient power.' },
            { level: 4, text: 'Frozen warriors watch from within the walls.' },
            { level: 6, text: 'Inscriptions read: "THE COLD PRESERVES ALL"' },
            { level: 9, text: 'The temperature drops sharply. Something stirs ahead.' }
        ],
        events: [
            { level: 2, type: 'blizzard', message: 'Blizzard! Visibility reduced!' },
            { level: 5, type: 'freeze', message: 'Flash freeze! Ball slowed temporarily!' },
            { level: 8, type: 'crack', message: 'The ice cracks! Watch for falling debris!' }
        ],
        boss: {
            name: 'FROST GIANT',
            type: 'ice_titan',
            hp: 7,
            phases: 2,
            abilities: ['ice_breath', 'summon_icicles', 'freeze_paddle']
        },
        introCutscene: [
            { speaker: 'PLAYER', text: 'It\'s freezing in here...' },
            { speaker: 'VOICE', text: 'THESE CAVERNS HAVE BEEN SEALED FOR MILLENNIA.' },
            { speaker: 'VOICE', text: 'YOU DARE DISTURB THE FROST GIANT\'S SLUMBER?' }
        ],
        outroCutscene: [
            { speaker: 'PLAYER', text: 'Not so cold anymore.' },
            { speaker: 'SYSTEM', text: 'HEAT SIGNATURE DETECTED BELOW. VOLCANIC ACTIVITY.' }
        ]
    },
    {
        id: 'volcano',
        name: 'Volcanic Core',
        description: 'The heart of the volcano where fire rains from above.',
        theme: {
            bg: '#150500',
            paddle: '#ff4400',
            ball: '#ffcc00',
            glowColor: '#ff4400'
        },
        colors: ['#ff0000', '#ff3300', '#ff6600', '#ff9900', '#ffcc00', '#ffff00'],
        levels: 10,
        unlockRequirement: 'ice_complete',
        weather: 'fire',
        ambience: 'rumble',
        hazardTypes: ['explosive', 'falling'],
        specialMechanic: 'Explosive bricks chain react and fire rains down',
        loreItems: [
            { level: 2, text: 'Obsidian pillars mark paths through the flames.' },
            { level: 4, text: 'Ancient murals depict a serpent of pure fire.' },
            { level: 6, text: 'Bones of creatures who ventured too deep.' },
            { level: 8, text: 'The heat is unbearable. You near the core.' }
        ],
        events: [
            { level: 3, type: 'eruption', message: 'Eruption! Dodge the falling rocks!' },
            { level: 5, type: 'lava_rise', message: 'Lava rising! Clear bricks faster!' },
            { level: 9, type: 'quake', message: 'Earthquake! Screen shakes violently!' }
        ],
        boss: {
            name: 'MAGMA SERPENT',
            type: 'fire_wyrm',
            hp: 9,
            phases: 3,
            abilities: ['fire_breath', 'lava_pools', 'body_slam']
        },
        introCutscene: [
            { speaker: 'PLAYER', text: 'Is it getting hot in here?' },
            { speaker: 'SERPENT', text: 'YOU TRESPASS IN MY DOMAIN, MORTAL.' },
            { speaker: 'SERPENT', text: 'PREPARE TO BE CONSUMED BY FLAME!' }
        ],
        outroCutscene: [
            { speaker: 'PLAYER', text: 'The serpent falls...' },
            { speaker: 'SYSTEM', text: 'ANOMALOUS READINGS FROM ORBIT. SPACE STATION DETECTED.' }
        ]
    },
    {
        id: 'space',
        name: 'Space Station',
        description: 'Zero gravity zones and mechanical defenses await.',
        theme: {
            bg: '#000510',
            paddle: '#aa00ff',
            ball: '#ffffff',
            glowColor: '#aa00ff'
        },
        colors: ['#6600ff', '#8800ff', '#aa00ff', '#cc00ff', '#ee00ff', '#ff00ff'],
        levels: 10,
        unlockRequirement: 'volcano_complete',
        weather: 'stars',
        ambience: 'ambient',
        hazardTypes: ['moving', 'indestructible', 'ghost'],
        specialMechanic: 'Zero-G zones affect ball physics',
        loreItems: [
            { level: 1, text: 'Station logs: "Day 847 - Something is watching us."' },
            { level: 3, text: 'Life support systems failing in sector 7.' },
            { level: 5, text: 'Warning: ROGUE AI DETECTED IN CORE SYSTEMS' },
            { level: 7, text: 'Last transmission: "The machine... it thinks..."' },
            { level: 9, text: 'GUARDIAN PROTOCOL ACTIVATED. INTRUDER ALERT.' }
        ],
        events: [
            { level: 2, type: 'gravity_shift', message: 'Gravity fluctuation! Ball physics altered!' },
            { level: 4, type: 'shield_wall', message: 'Energy shields activated!' },
            { level: 6, type: 'drone_attack', message: 'Defense drones deployed!' },
            { level: 8, type: 'hull_breach', message: 'Hull breach! Watch the vacuum zones!' }
        ],
        boss: {
            name: 'MECH GUARDIAN',
            type: 'robot',
            hp: 12,
            phases: 3,
            abilities: ['laser_grid', 'missile_barrage', 'shield_matrix', 'drone_swarm']
        },
        introCutscene: [
            { speaker: 'PLAYER', text: 'A space station? How did I get here?' },
            { speaker: 'GUARDIAN', text: 'UNAUTHORIZED ENTITY DETECTED.' },
            { speaker: 'GUARDIAN', text: 'INITIATING ELIMINATION PROTOCOL.' }
        ],
        outroCutscene: [
            { speaker: 'PLAYER', text: 'That robot was tough.' },
            { speaker: 'SYSTEM', text: 'DIMENSIONAL RIFT OPENED. THE VOID AWAITS.' },
            { speaker: 'PLAYER', text: 'The void...?' }
        ]
    },
    {
        id: 'void',
        name: 'The Void',
        description: 'Reality itself breaks down. The final challenge awaits.',
        theme: {
            bg: '#000000',
            paddle: '#ffffff',
            ball: '#ffffff',
            glowColor: '#8800ff'
        },
        colors: ['#333333', '#444444', '#555555', '#666666', '#777777', '#888888'],
        levels: 10,
        unlockRequirement: 'space_complete',
        weather: 'void',
        ambience: 'silence',
        hazardTypes: ['ghost', 'regenerating', 'bomb'],
        specialMechanic: 'Reality warps - bricks shift and change',
        loreItems: [
            { level: 1, text: '...' },
            { level: 3, text: 'Echoes of what once was.' },
            { level: 5, text: 'THE END IS THE BEGINNING' },
            { level: 7, text: 'Memories float past... are they yours?' },
            { level: 9, text: 'ENTROPY AWAITS' }
        ],
        events: [
            { level: 2, type: 'reality_warp', message: 'Reality warps! Bricks rearrange!' },
            { level: 4, type: 'shadow_spawn', message: 'Shadows emerge from the darkness!' },
            { level: 6, type: 'time_loop', message: 'Time loops! Déjà vu...' },
            { level: 8, type: 'dimension_tear', message: 'The dimension is tearing apart!' }
        ],
        boss: {
            name: 'ENTROPY',
            type: 'cosmic',
            hp: 15,
            phases: 4,
            abilities: ['reality_warp', 'time_stop', 'shadow_clones', 'void_storm', 'dimension_shift']
        },
        introCutscene: [
            { speaker: 'PLAYER', text: 'There\'s nothing here...' },
            { speaker: 'ENTROPY', text: 'EXACTLY.' },
            { speaker: 'ENTROPY', text: 'NOTHING. AND EVERYTHING.' },
            { speaker: 'ENTROPY', text: 'I AM THE END OF ALL THINGS.' }
        ],
        outroCutscene: [
            { speaker: 'PLAYER', text: 'I... I did it?' },
            { speaker: '???', text: 'You have proven yourself, breaker.' },
            { speaker: '???', text: 'The cycle continues. Until next time.' },
            { speaker: 'PLAYER', text: 'Wait, what do you mean—' }
        ],
        isEndgame: true
    }
];

/**
 * StoryMode class - manages campaign progression
 */
export class StoryMode {
    constructor(game) {
        this.game = game;
        this.currentWorldIndex = 0;
        this.currentLevelIndex = 0;
        this.progress = this.loadProgress();
        this.inCutscene = false;
        this.cutsceneStep = 0;
        this.cutsceneData = null;
        this.currentBoss = null;
        
        // UI Elements
        this.dialogBox = null;
        this.createDialogUI();
    }
    
    loadProgress() {
        const saved = localStorage.getItem('breakout_story_progress');
        return saved ? JSON.parse(saved) : {
            unlockedWorlds: ['neon'],
            completedLevels: [], // Array of 'worldId_levelIndex'
            defeatedBosses: [],
            collectibles: [],
            stars: {} // levelId -> stars (1-3)
        };
    }
    
    saveProgress() {
        localStorage.setItem('breakout_story_progress', JSON.stringify(this.progress));
    }
    
    getWorld(worldId) {
        return STORY_WORLDS.find(w => w.id === worldId);
    }
    
    isWorldUnlocked(worldId) {
        return this.progress.unlockedWorlds.includes(worldId);
    }
    
    isLevelCompleted(worldId, levelIndex) {
        return this.progress.completedLevels.includes(`${worldId}_${levelIndex}`);
    }
    
    getWorldProgress(worldId) {
        const world = this.getWorld(worldId);
        if (!world) return 0;
        
        let completed = 0;
        for (let i = 0; i < world.levels; i++) {
            if (this.isLevelCompleted(worldId, i)) completed++;
        }
        return completed / world.levels;
    }
    
    startWorld(worldIndex) {
        if (worldIndex >= STORY_WORLDS.length) return;
        
        const world = STORY_WORLDS[worldIndex];
        if (!this.isWorldUnlocked(world.id)) {
            console.log('World not unlocked:', world.id);
            return;
        }
        
        this.currentWorldIndex = worldIndex;
        
        // Start from first uncompleted level
        let startLevel = 0;
        for (let i = 0; i < world.levels; i++) {
            if (!this.isLevelCompleted(world.id, i)) {
                startLevel = i;
                break;
            }
            if (i === world.levels - 1) {
                startLevel = world.levels - 1; // All completed, start last level
            }
        }
        
        this.currentLevelIndex = startLevel;
        
        // Play intro cutscene if first level
        if (world.introCutscene && startLevel === 0) {
            this.playCutscene(world.introCutscene, () => {
                this.startLevel(startLevel);
            });
        } else {
            this.startLevel(startLevel);
        }
    }
    
    startLevel(levelIndex) {
        const world = STORY_WORLDS[this.currentWorldIndex];
        this.currentLevelIndex = levelIndex;
        
        // Calculate difficulty
        const globalLevel = this.currentWorldIndex * 10 + levelIndex;
        const difficulty = globalLevel / 50; // 0 to 1
        
        // Generate level config
        const levelConfig = {
            id: `story_${world.id}_${levelIndex}`,
            name: `${world.name} ${levelIndex + 1}`,
            world: world,
            worldIndex: this.currentWorldIndex,
            levelIndex: levelIndex,
            theme: world.theme,
            colors: world.colors,
            difficulty: difficulty,
            rows: Math.min(8, 4 + Math.floor(globalLevel / 8)),
            cols: 10,
            brickTypes: this.getLevelBrickTypes(world, levelIndex),
            specialBricks: this.getSpecialBricks(world, levelIndex),
            events: world.events.filter(e => e.level === levelIndex + 1),
            lore: world.loreItems.find(l => l.level === levelIndex + 1),
            goal: 'clear_all', // Clear all bricks
            isBossLevel: levelIndex === world.levels - 1
        };
        
        // Pass to game
        this.game.loadStoryLevel(levelConfig);
    }
    
    getLevelBrickTypes(world, levelIndex) {
        // Start with normal bricks, add more complex types as levels progress
        const types = ['NORMAL'];
        
        if (levelIndex >= 2) types.push('STRONG');
        if (levelIndex >= 4) types.push('REINFORCED');
        
        // Add world-specific hazard bricks
        for (const hazard of world.hazardTypes) {
            if (levelIndex >= 3) {
                switch (hazard) {
                    case 'moving': types.push('MOVING'); break;
                    case 'ice': types.push('ICE'); break;
                    case 'explosive': types.push('EXPLOSIVE'); break;
                    case 'regenerating': types.push('REGENERATING'); break;
                    case 'ghost': types.push('GHOST'); break;
                    case 'falling': types.push('BOMB'); break;
                    case 'indestructible': if (levelIndex >= 5) types.push('INDESTRUCTIBLE'); break;
                }
            }
        }
        
        // Gold bricks appear sometimes
        if (levelIndex >= 1 && Math.random() < 0.3) {
            types.push('GOLD');
        }
        
        return types;
    }
    
    getSpecialBricks(world, levelIndex) {
        // Return positions for special brick types
        const special = [];
        const cols = 10;
        const rows = Math.min(8, 4 + Math.floor((this.currentWorldIndex * 10 + levelIndex) / 8));
        
        // Add gold bricks
        if (levelIndex >= 1) {
            const goldCount = 1 + Math.floor(levelIndex / 3);
            for (let i = 0; i < goldCount; i++) {
                special.push({
                    row: Math.floor(Math.random() * rows),
                    col: Math.floor(Math.random() * cols),
                    type: 'GOLD'
                });
            }
        }
        
        // Add indestructible obstacles for later levels
        if (levelIndex >= 5 && world.hazardTypes.includes('indestructible')) {
            const count = Math.floor((levelIndex - 4) / 2);
            for (let i = 0; i < count; i++) {
                special.push({
                    row: Math.floor(Math.random() * (rows - 1)) + 1,
                    col: Math.floor(Math.random() * cols),
                    type: 'INDESTRUCTIBLE'
                });
            }
        }
        
        return special;
    }
    
    completeLevel(score, livesRemaining, timeBonus = 0) {
        const world = STORY_WORLDS[this.currentWorldIndex];
        const levelId = `${world.id}_${this.currentLevelIndex}`;
        
        // Calculate stars (1-3)
        let stars = 1;
        if (livesRemaining >= 2) stars = 2;
        if (livesRemaining >= 3 && timeBonus > 0) stars = 3;
        
        // Update progress
        if (!this.progress.completedLevels.includes(levelId)) {
            this.progress.completedLevels.push(levelId);
        }
        
        // Update stars (keep best)
        const currentStars = this.progress.stars[levelId] || 0;
        if (stars > currentStars) {
            this.progress.stars[levelId] = stars;
        }
        
        this.saveProgress();
        
        // Check if boss level
        if (this.currentLevelIndex === world.levels - 1) {
            // Trigger boss battle
            this.startBossBattle(world.boss);
        } else {
            // Show level complete, then next level
            this.showLevelComplete(stars, () => {
                this.currentLevelIndex++;
                if (this.currentLevelIndex < world.levels) {
                    this.startLevel(this.currentLevelIndex);
                }
            });
        }
        
        return stars;
    }
    
    startBossBattle(bossData) {
        const world = STORY_WORLDS[this.currentWorldIndex];
        
        // Create boss battle config
        const bossConfig = {
            ...bossData,
            world: world,
            theme: world.theme
        };
        
        // Signal game to start boss mode
        this.game.startBossBattle(bossConfig);
    }
    
    defeatBoss() {
        const world = STORY_WORLDS[this.currentWorldIndex];
        
        // Mark boss as defeated
        if (!this.progress.defeatedBosses.includes(world.boss.name)) {
            this.progress.defeatedBosses.push(world.boss.name);
        }
        
        // Play outro cutscene
        if (world.outroCutscene) {
            this.playCutscene(world.outroCutscene, () => {
                this.unlockNextWorld();
            });
        } else {
            this.unlockNextWorld();
        }
    }
    
    unlockNextWorld() {
        const nextWorldIndex = this.currentWorldIndex + 1;
        
        if (nextWorldIndex < STORY_WORLDS.length) {
            const nextWorld = STORY_WORLDS[nextWorldIndex];
            if (!this.progress.unlockedWorlds.includes(nextWorld.id)) {
                this.progress.unlockedWorlds.push(nextWorld.id);
                this.saveProgress();
                
                // Show unlock notification
                this.showWorldUnlocked(nextWorld);
            }
        } else {
            // Game complete!
            this.showGameComplete();
        }
    }
    
    // ===== UI & Cutscenes =====
    
    createDialogUI() {
        const existing = document.getElementById('breakout-dialog');
        if (existing) {
            this.dialogBox = existing;
            return;
        }
        
        const div = document.createElement('div');
        div.id = 'breakout-dialog';
        div.className = 'story-dialog-box';
        div.style.display = 'none';
        
        div.innerHTML = `
            <h3 id="dialog-speaker" class="dialog-speaker">SPEAKER</h3>
            <p id="dialog-text" class="dialog-text"></p>
            <div class="dialog-hint">
                Press SPACE or Click to continue
            </div>
        `;
        document.body.appendChild(div);
        this.dialogBox = div;
        
        // Add click handler
        div.addEventListener('click', () => this.advanceDialog());
    }
    
    playCutscene(data, callback = null) {
        this.inCutscene = true;
        this.cutsceneData = data;
        this.cutsceneStep = 0;
        this.cutsceneCallback = callback;
        this.showDialogStep();
        
        // Pause game
        if (this.game.pause) this.game.pause();
    }
    
    showDialogStep() {
        if (!this.cutsceneData || this.cutsceneStep >= this.cutsceneData.length) {
            this.endCutscene();
            return;
        }
        
        const step = this.cutsceneData[this.cutsceneStep];
        const speakerEl = document.getElementById('dialog-speaker');
        const textEl = document.getElementById('dialog-text');
        
        if (speakerEl && textEl) {
            speakerEl.textContent = step.speaker;
            speakerEl.style.color = step.color || '#00ffff';
            textEl.textContent = step.text;
            this.dialogBox.style.display = 'block';
        }
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
        if (this.dialogBox) {
            this.dialogBox.style.display = 'none';
        }
        
        // Resume game
        if (this.game.resume) this.game.resume();
        
        // Call callback if exists
        if (this.cutsceneCallback) {
            this.cutsceneCallback();
            this.cutsceneCallback = null;
        }
    }
    
    showLevelComplete(stars, callback) {
        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-overlay';
        
        const starsHTML = `<span style="color: #ffd700; display: inline-flex; align-items: center; justify-content: center;">${(ICONS.STAR + ' ').repeat(stars)}</span>`;
        
        overlay.innerHTML = `
            <h1 class="level-complete-title">
                LEVEL COMPLETE!
            </h1>
            <div class="level-stars">${starsHTML}</div>
            <button id="next-level-btn" class="btn btn-continue">CONTINUE</button>
        `;
        
        document.body.appendChild(overlay);
        
        document.getElementById('next-level-btn').addEventListener('click', () => {
            overlay.remove();
            if (callback) callback();
        });
    }
    
    showWorldUnlocked(world) {
        const notification = document.createElement('div');
        notification.className = 'world-unlock-notification';
        notification.style.setProperty('--world-glow', world.theme.glowColor);
        
        notification.innerHTML = `
            <h2 class="world-unlock-title">
                NEW WORLD UNLOCKED!
            </h2>
            <h1 class="world-name">
                ${world.name}
            </h1>
            <p style="color: #888; font-size: 0.9rem;">${world.description}</p>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.5s ease forwards';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
    
    showGameComplete() {
        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-overlay';
        
        overlay.innerHTML = `
            <h1 style="color: #ff00ff; font-family: 'VT323', monospace; font-size: 3rem; margin-bottom: 20px; text-shadow: 0 0 30px #ff00ff;">
                CONGRATULATIONS!
            </h1>
            <h2 style="color: #fff; margin-bottom: 30px;">
                You have conquered The Void!
            </h2>
            <p style="color: #888; max-width: 400px; text-align: center; line-height: 1.6;">
                You have defeated all 5 bosses and proven yourself as the ultimate Brick Breaker.
                Your legend will echo through the Grid forever.
            </p>
            <button class="btn btn-continue close-overlay-btn">RETURN TO MENU</button>
        `;
        document.body.appendChild(overlay);
        
        // Add event listener for close button (security fix: no inline onclick)
        overlay.querySelector('.close-overlay-btn').addEventListener('click', () => overlay.remove());
    }
    
    // World selection UI
    showWorldSelect() {
        const overlay = document.createElement('div');
        overlay.id = 'world-select-overlay';
        overlay.className = 'fullscreen-overlay';
        
        let worldsHTML = '<h1 style="color: #fff; margin-bottom: 30px;">SELECT WORLD</h1>';
        worldsHTML += '<div class="grid-select-container">';
        
        for (let i = 0; i < STORY_WORLDS.length; i++) {
            const world = STORY_WORLDS[i];
            const unlocked = this.isWorldUnlocked(world.id);
            const progress = Math.floor(this.getWorldProgress(world.id) * 100);
            const bossDefeated = this.progress.defeatedBosses.includes(world.boss.name);
            
            // Set dynamic vars on the card
            const glow = unlocked ? world.theme.glowColor : '#333';
            
            worldsHTML += `
                <div class="select-card ${!unlocked ? 'locked' : ''}" data-index="${i}" style="border-color: ${glow};">
                    <h3 style="color: ${glow}; margin: 0 0 10px 0; font-size: 1.2rem; display: flex; align-items: center; justify-content: space-between;">
                        ${world.name} 
                        ${bossDefeated ? `<span style="width: 20px; color: #00ff88;">${ICONS.CHECK}</span>` : ''}
                    </h3>
                    <p style="color: #888; font-size: 0.9rem; margin: 0 0 10px 0;">
                        ${unlocked ? world.description : `<span style="display:flex; align-items:center; gap:5px;">${ICONS.LOCK} LOCKED</span>`}
                    </p>
                    ${unlocked ? `
                        <div style="background: #333; height: 6px; border-radius: 0; overflow: hidden;">
                            <div style="background: ${glow}; width: ${progress}%; height: 100%;"></div>
                        </div>
                        <div style="color: #666; font-size: 0.8rem; margin-top: 5px;">${progress}% Complete</div>
                    ` : ''}
                </div>
            `;
        }
        
        worldsHTML += '</div>';
        worldsHTML += '<button id="close-world-select" class="btn btn-ghost" style="margin-top:20px;">BACK</button>';
        
        overlay.innerHTML = worldsHTML;
        document.body.appendChild(overlay);
        
        // Add event listeners
        overlay.querySelectorAll('.world-card').forEach(card => {
            const index = parseInt(card.dataset.index);
            if (this.isWorldUnlocked(STORY_WORLDS[index].id)) {
                card.addEventListener('click', () => {
                    overlay.remove();
                    this.startWorld(index);
                });
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'scale(1.05)';
                });
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'scale(1)';
                });
            }
        });
        
        document.getElementById('close-world-select').addEventListener('click', () => {
            overlay.remove();
        });
    }
}

// Add CSS animations if not present
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes scaleIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
    `;
    document.head.appendChild(style);
}

export default { STORY_WORLDS, StoryMode };
