/**
 * Minesweeper Story Mode System
 * 5 themed worlds with 10 levels each, cutscenes, and boss battles
 */

// Story World Definitions
export const STORY_WORLDS = [
    {
        id: 'grassland',
        name: 'Peaceful Meadows',
        description: 'A gentle introduction to the art of mine detection. Green fields hide ancient secrets.',
        theme: {
            bg: '#1a2e1a',
            grid: 'rgba(100, 200, 100, 0.08)',
            cellCovered: 'linear-gradient(135deg, #2d4a2d, #1a3a1a)',
            cellRevealed: 'rgba(30, 60, 30, 0.6)',
            primary: '#00ff88',
            accent: '#88ff00'
        },
        levels: 10,
        baseMines: 8,
        minesPerLevel: 2,
        baseSize: { rows: 8, cols: 8 },
        sizeGrowth: { rows: 0.5, cols: 0.5 },
        specialMechanic: null,
        unlockPowerUp: 'reveal',
        events: [
            { level: 3, type: 'tutorial', message: 'Tip: Right-click to flag suspected mines!' },
            { level: 5, type: 'miniboss', message: 'A hidden garden patch appears...' },
            { level: 8, type: 'bonus', message: 'Bonus: Extra time awarded!' },
            { level: 10, type: 'boss', message: 'The Garden Keeper awakens!' }
        ],
        introCutscene: [
            { speaker: 'Guide', text: 'Welcome, young sweeper. These meadows may look peaceful...' },
            { speaker: 'Guide', text: 'But beneath the surface, danger lurks.' },
            { speaker: 'Player', text: 'I\'m ready. Show me what to do.' }
        ],
        outroCutscene: [
            { speaker: 'Guide', text: 'Impressive! You\'ve cleared the meadows.' },
            { speaker: 'Guide', text: 'But the desert sands hold greater challenges...' }
        ],
        boss: {
            name: 'Garden Keeper',
            type: 'moving_mines',
            description: 'Mines shift positions every 10 seconds',
            hp: 3,
            mechanicDesc: 'Some mines will move to new positions periodically'
        }
    },
    {
        id: 'desert',
        name: 'Scorching Sands',
        description: 'The desert heat plays tricks on your eyes. Sandstorms reveal and conceal.',
        theme: {
            bg: '#2e2410',
            grid: 'rgba(255, 200, 100, 0.06)',
            cellCovered: 'linear-gradient(135deg, #5a4a2a, #3a3418)',
            cellRevealed: 'rgba(60, 50, 30, 0.6)',
            primary: '#ffcc00',
            accent: '#ff8800'
        },
        levels: 10,
        baseMines: 15,
        minesPerLevel: 3,
        baseSize: { rows: 10, cols: 10 },
        sizeGrowth: { rows: 0.5, cols: 0.5 },
        specialMechanic: 'sandstorm',
        unlockPowerUp: 'xray',
        events: [
            { level: 2, type: 'sandstorm', message: 'A sandstorm approaches! Some cells will be revealed!' },
            { level: 5, type: 'miniboss', message: 'An ancient tomb is uncovered...' },
            { level: 7, type: 'sandstorm', message: 'The storm intensifies!' },
            { level: 10, type: 'boss', message: 'The Sand Wyrm emerges!' }
        ],
        introCutscene: [
            { speaker: 'Guide', text: 'The desert is unforgiving.' },
            { speaker: 'Guide', text: 'Sandstorms will occasionally reveal cells for you...' },
            { speaker: 'Guide', text: 'But beware - they may reveal mines too!' }
        ],
        outroCutscene: [
            { speaker: 'Player', text: 'The heat was intense, but I made it.' },
            { speaker: 'Guide', text: 'Now prepare for the cold. The frozen depths await.' }
        ],
        boss: {
            name: 'Sand Wyrm',
            type: 'hidden_mines',
            description: 'Some numbers lie - they show fewer mines than actually exist',
            hp: 4,
            mechanicDesc: 'Numbers may be lower than actual adjacent mines'
        }
    },
    {
        id: 'ocean',
        name: 'Abyssal Depths',
        description: 'Dive deep into underwater caves. Currents shift the dangers around.',
        theme: {
            bg: '#0a1520',
            grid: 'rgba(100, 150, 255, 0.08)',
            cellCovered: 'linear-gradient(135deg, #1a3a5a, #0a2030)',
            cellRevealed: 'rgba(20, 50, 80, 0.6)',
            primary: '#00ccff',
            accent: '#0088ff'
        },
        levels: 10,
        baseMines: 22,
        minesPerLevel: 4,
        baseSize: { rows: 12, cols: 12 },
        sizeGrowth: { rows: 0.4, cols: 0.6 },
        specialMechanic: 'current',
        unlockPowerUp: 'shield',
        events: [
            { level: 3, type: 'current', message: 'Ocean current! Mines may drift...' },
            { level: 5, type: 'miniboss', message: 'A shipwreck guards its treasure...' },
            { level: 6, type: 'current', message: 'Strong current detected!' },
            { level: 8, type: 'darkness', message: 'The depths grow dark...' },
            { level: 10, type: 'boss', message: 'The Kraken stirs!' }
        ],
        introCutscene: [
            { speaker: 'Guide', text: 'Down here, nothing stays still.' },
            { speaker: 'Guide', text: 'Ocean currents will shift mines between your clicks.' },
            { speaker: 'Player', text: 'I\'ll have to think fast then.' }
        ],
        outroCutscene: [
            { speaker: 'Player', text: 'The Kraken is defeated!' },
            { speaker: 'Guide', text: 'But I sense heat rising from below...' }
        ],
        boss: {
            name: 'Kraken',
            type: 'tentacles',
            description: 'Tentacles occasionally cover cells, making them unclickable',
            hp: 5,
            mechanicDesc: 'Random cells become blocked by tentacles'
        }
    },
    {
        id: 'volcano',
        name: 'Volcanic Core',
        description: 'Navigate through magma chambers. Lava tiles spell instant death.',
        theme: {
            bg: '#200a00',
            grid: 'rgba(255, 100, 50, 0.1)',
            cellCovered: 'linear-gradient(135deg, #5a2010, #3a1008)',
            cellRevealed: 'rgba(80, 30, 20, 0.6)',
            primary: '#ff4400',
            accent: '#ff0000'
        },
        levels: 10,
        baseMines: 30,
        minesPerLevel: 5,
        baseSize: { rows: 14, cols: 14 },
        sizeGrowth: { rows: 0.3, cols: 0.5 },
        specialMechanic: 'lava',
        unlockPowerUp: 'timefreeze',
        events: [
            { level: 2, type: 'lava', message: 'Lava tiles forming! Avoid glowing cells!' },
            { level: 4, type: 'eruption', message: 'Minor eruption! New mines placed!' },
            { level: 6, type: 'miniboss', message: 'A fire elemental blocks your path...' },
            { level: 8, type: 'eruption', message: 'Major eruption incoming!' },
            { level: 10, type: 'boss', message: 'The Magma Lord rises!' }
        ],
        introCutscene: [
            { speaker: 'Guide', text: 'Feel that heat? This is the core.' },
            { speaker: 'Guide', text: 'Some cells will turn to lava. Click them and it\'s over.' },
            { speaker: 'Player', text: 'So stay away from the glowing ones. Got it.' }
        ],
        outroCutscene: [
            { speaker: 'Player', text: 'The volcano is stabilized...' },
            { speaker: 'Guide', text: 'One final destination remains. Beyond the stars.' }
        ],
        boss: {
            name: 'Magma Lord',
            type: 'lava_spread',
            description: 'Lava tiles spread each turn, converting safe cells',
            hp: 6,
            mechanicDesc: 'Lava expands over time, shrinking safe zones'
        }
    },
    {
        id: 'space',
        name: 'Asteroid Field',
        description: 'The final frontier. Gravity shifts make nothing as it seems.',
        theme: {
            bg: '#000510',
            grid: 'rgba(200, 100, 255, 0.08)',
            cellCovered: 'linear-gradient(135deg, #1a1030, #0a0818)',
            cellRevealed: 'rgba(30, 20, 50, 0.6)',
            primary: '#aa00ff',
            accent: '#ff00aa'
        },
        levels: 10,
        baseMines: 40,
        minesPerLevel: 6,
        baseSize: { rows: 16, cols: 18 },
        sizeGrowth: { rows: 0.2, cols: 0.3 },
        specialMechanic: 'gravity',
        unlockPowerUp: 'defuse',
        events: [
            { level: 2, type: 'gravity', message: 'Gravity shift! The board rotates!' },
            { level: 4, type: 'meteor', message: 'Meteor shower! New dangers appear!' },
            { level: 5, type: 'miniboss', message: 'An alien probe scans your position...' },
            { level: 7, type: 'gravity', message: 'Intense gravity fluctuations!' },
            { level: 9, type: 'blackhole', message: 'A black hole warps space around you!' },
            { level: 10, type: 'boss', message: 'The Void Entity manifests!' }
        ],
        introCutscene: [
            { speaker: 'Guide', text: 'This is it. The edge of known space.' },
            { speaker: 'Guide', text: 'Gravity here is unstable. The board may rotate.' },
            { speaker: 'Player', text: 'Then I\'ll adapt. I\'ve come too far to fail now.' },
            { speaker: 'Guide', text: 'The Void Entity awaits. Good luck, sweeper.' }
        ],
        outroCutscene: [
            { speaker: 'Player', text: 'It\'s done. The universe is safe.' },
            { speaker: 'Guide', text: 'You\'ve proven yourself a true Minesweeper Master.' },
            { speaker: 'Guide', text: 'But this is not the end... only the beginning.' }
        ],
        boss: {
            name: 'Void Entity',
            type: 'reality_warp',
            description: 'Reality warps - revealed cells may become covered again',
            hp: 8,
            mechanicDesc: 'Some revealed cells randomly become hidden again'
        },
        isEndgame: true
    }
];

/**
 * Story Mode Manager Class
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
        this.bossHealth = 0;
        this.inBossBattle = false;
        this.specialEffects = [];
    }

    /**
     * Load story progress from storage
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem('minesweeper_story_progress');
            return saved ? JSON.parse(saved) : {
                worldsUnlocked: ['grassland'],
                levelsCompleted: {},
                starsEarned: {},
                powerUpsUnlocked: ['reveal']
            };
        } catch {
            return {
                worldsUnlocked: ['grassland'],
                levelsCompleted: {},
                starsEarned: {},
                powerUpsUnlocked: ['reveal']
            };
        }
    }

    /**
     * Save story progress to storage
     */
    saveProgress() {
        localStorage.setItem('minesweeper_story_progress', JSON.stringify(this.progress));
    }

    /**
     * Get current world
     */
    getCurrentWorld() {
        return STORY_WORLDS[this.currentWorldIndex];
    }

    /**
     * Get current level settings
     */
    getCurrentLevelSettings() {
        const world = this.getCurrentWorld();
        const level = this.currentLevelIndex;
        
        return {
            rows: Math.floor(world.baseSize.rows + level * world.sizeGrowth.rows),
            cols: Math.floor(world.baseSize.cols + level * world.sizeGrowth.cols),
            mines: world.baseMines + level * world.minesPerLevel,
            theme: world.theme,
            specialMechanic: world.specialMechanic,
            worldId: world.id,
            levelNumber: level + 1,
            isBoss: level === world.levels - 1,
            boss: level === world.levels - 1 ? world.boss : null
        };
    }

    /**
     * Start a specific world
     */
    startWorld(worldId) {
        const index = STORY_WORLDS.findIndex(w => w.id === worldId);
        if (index < 0) return false;

        // Check if world is unlocked
        if (!this.progress.worldsUnlocked.includes(worldId)) {
            return false;
        }

        this.currentWorldIndex = index;
        this.currentLevelIndex = 0;
        
        // Play intro cutscene
        const world = this.getCurrentWorld();
        if (world.introCutscene) {
            this.playCutscene(world.introCutscene, () => {
                this.startLevel(0);
            });
        } else {
            this.startLevel(0);
        }

        return true;
    }

    /**
     * Start a specific level
     */
    startLevel(levelIndex) {
        this.currentLevelIndex = levelIndex;
        this.inBossBattle = false;
        
        const settings = this.getCurrentLevelSettings();
        
        // Check for level events
        const world = this.getCurrentWorld();
        const event = world.events.find(e => e.level === levelIndex + 1);
        
        if (event) {
            this.showEventMessage(event);
        }

        // Apply theme
        this.applyTheme(settings.theme);
        
        // Initialize boss battle if needed
        if (settings.isBoss && settings.boss) {
            this.startBossBattle(settings.boss);
        }

        // Emit event to start the game with these settings
        if (this.game.eventBus) {
            this.game.eventBus.emit('storyLevelStart', settings);
        }

        return settings;
    }

    /**
     * Apply world theme to the game
     */
    applyTheme(theme) {
        const root = document.documentElement;
        root.style.setProperty('--story-bg', theme.bg);
        root.style.setProperty('--story-grid', theme.grid);
        root.style.setProperty('--story-primary', theme.primary);
        root.style.setProperty('--story-accent', theme.accent);
        
        // Apply to game container
        const container = document.querySelector('.minesweeper-container');
        if (container) {
            container.classList.add('story-mode');
            container.style.background = theme.bg;
        }
    }

    /**
     * Start a boss battle
     */
    startBossBattle(boss) {
        this.inBossBattle = true;
        this.bossHealth = boss.hp;
        
        // Show boss intro
        this.showBossIntro(boss);
        
        // Apply boss mechanics
        this.applyBossMechanic(boss.type);
    }

    /**
     * Show boss intro animation
     */
    showBossIntro(boss) {
        const overlay = document.createElement('div');
        overlay.className = 'boss-intro-overlay';
        overlay.innerHTML = `
            <div class="boss-intro">
                <div class="boss-name">${boss.name}</div>
                <div class="boss-type">${boss.description}</div>
                <div class="boss-health-bar">
                    <div class="boss-health-fill" style="width: 100%"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        requestAnimationFrame(() => overlay.classList.add('show'));
        
        setTimeout(() => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 500);
        }, 3000);
    }

    /**
     * Apply boss-specific mechanics
     */
    applyBossMechanic(mechanicType) {
        // These mechanics would be implemented in the main game class
        // This method sets up the hooks
        switch (mechanicType) {
            case 'moving_mines':
                this.startMovingMines();
                break;
            case 'hidden_mines':
                this.enableHiddenMines();
                break;
            case 'tentacles':
                this.startTentacles();
                break;
            case 'lava_spread':
                this.startLavaSpread();
                break;
            case 'reality_warp':
                this.startRealityWarp();
                break;
        }
    }

    /**
     * Moving mines mechanic
     */
    startMovingMines() {
        this.movingMinesInterval = setInterval(() => {
            if (this.game.gameOver) {
                clearInterval(this.movingMinesInterval);
                return;
            }
            // Emit event for the main game to handle
            if (this.game.eventBus) {
                this.game.eventBus.emit('bossMoveMines');
            }
        }, 10000);
    }

    /**
     * Hidden mines mechanic (numbers lie)
     */
    enableHiddenMines() {
        if (this.game.eventBus) {
            this.game.eventBus.emit('bossEnableHiddenMines');
        }
    }

    /**
     * Tentacles mechanic
     */
    startTentacles() {
        this.tentacleInterval = setInterval(() => {
            if (this.game.gameOver) {
                clearInterval(this.tentacleInterval);
                return;
            }
            if (this.game.eventBus) {
                this.game.eventBus.emit('bossSpawnTentacle');
            }
        }, 8000);
    }

    /**
     * Lava spread mechanic
     */
    startLavaSpread() {
        this.lavaInterval = setInterval(() => {
            if (this.game.gameOver) {
                clearInterval(this.lavaInterval);
                return;
            }
            if (this.game.eventBus) {
                this.game.eventBus.emit('bossSpreadLava');
            }
        }, 5000);
    }

    /**
     * Reality warp mechanic
     */
    startRealityWarp() {
        this.warpInterval = setInterval(() => {
            if (this.game.gameOver) {
                clearInterval(this.warpInterval);
                return;
            }
            if (this.game.eventBus) {
                this.game.eventBus.emit('bossRealityWarp');
            }
        }, 7000);
    }

    /**
     * Damage the boss
     */
    damageBoss(amount = 1) {
        if (!this.inBossBattle) return;
        
        this.bossHealth -= amount;
        this.updateBossHealthUI();
        
        if (this.bossHealth <= 0) {
            this.defeatBoss();
        }
    }

    /**
     * Update boss health UI
     */
    updateBossHealthUI() {
        const fill = document.querySelector('.boss-health-fill');
        if (fill) {
            const boss = this.getCurrentLevelSettings().boss;
            const percent = (this.bossHealth / boss.hp) * 100;
            fill.style.width = `${percent}%`;
        }
    }

    /**
     * Boss defeated
     */
    defeatBoss() {
        this.inBossBattle = false;
        this.clearBossIntervals();
        
        // Show victory message
        this.showBossDefeated();
    }

    /**
     * Clear all boss mechanic intervals
     */
    clearBossIntervals() {
        [this.movingMinesInterval, this.tentacleInterval, 
         this.lavaInterval, this.warpInterval].forEach(interval => {
            if (interval) clearInterval(interval);
        });
    }

    /**
     * Show boss defeated message
     */
    showBossDefeated() {
        const overlay = document.createElement('div');
        overlay.className = 'boss-defeated-overlay';
        overlay.innerHTML = `
            <div class="boss-defeated">
                <div class="boss-defeated-title">${ICONS.TROPHY} BOSS DEFEATED!</div>
                <div class="boss-defeated-text">You've conquered this world!</div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));
        
        setTimeout(() => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 500);
        }, 3000);
    }

    /**
     * Complete current level
     */
    completeLevel(timeSeconds, stars = 1) {
        const world = this.getCurrentWorld();
        const levelKey = `${world.id}_${this.currentLevelIndex}`;
        
        // Save progress
        this.progress.levelsCompleted[levelKey] = true;
        this.progress.starsEarned[levelKey] = Math.max(
            this.progress.starsEarned[levelKey] || 0, 
            stars
        );
        
        // Check for world completion
        if (this.currentLevelIndex === world.levels - 1) {
            // World completed - unlock next world and power-up
            this.unlockNextWorld();
            
            // Play outro cutscene
            if (world.outroCutscene) {
                this.playCutscene(world.outroCutscene, () => {
                    this.showWorldComplete();
                });
            } else {
                this.showWorldComplete();
            }
        } else {
            // Move to next level
            this.currentLevelIndex++;
            this.saveProgress();
        }

        return { completed: true, stars, worldComplete: this.currentLevelIndex === 0 };
    }

    /**
     * Unlock the next world
     */
    unlockNextWorld() {
        const currentWorld = this.getCurrentWorld();
        
        // Unlock power-up
        if (currentWorld.unlockPowerUp) {
            if (!this.progress.powerUpsUnlocked.includes(currentWorld.unlockPowerUp)) {
                this.progress.powerUpsUnlocked.push(currentWorld.unlockPowerUp);
            }
        }
        
        // Unlock next world
        const nextIndex = this.currentWorldIndex + 1;
        if (nextIndex < STORY_WORLDS.length) {
            const nextWorld = STORY_WORLDS[nextIndex];
            if (!this.progress.worldsUnlocked.includes(nextWorld.id)) {
                this.progress.worldsUnlocked.push(nextWorld.id);
            }
        }
        
        this.saveProgress();
    }

    /**
     * Show world complete message
     */
    showWorldComplete() {
        const world = this.getCurrentWorld();
        const overlay = document.createElement('div');
        overlay.className = 'world-complete-overlay';
        overlay.innerHTML = `
            <div class="world-complete">
                <div class="world-complete-title">${ICONS.TROPHY} World Complete!</div>
                <div class="world-complete-name">${world.name}</div>
                ${world.unlockPowerUp ? `
                    <div class="power-up-unlock">
                        New Power-Up Unlocked!
                    </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));
        
        setTimeout(() => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 500);
        }, 4000);
    }

    /**
     * Show event message
     */
    showEventMessage(event) {
        const toast = document.createElement('div');
        toast.className = `event-toast event-${event.type}`;
        toast.textContent = event.message;
        
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 2500);
    }

    /**
     * Play a cutscene
     */
    playCutscene(cutsceneData, onComplete) {
        this.inCutscene = true;
        this.cutsceneData = cutsceneData;
        this.cutsceneStep = 0;
        this.cutsceneCallback = onComplete;
        
        this.createCutsceneUI();
        // Note: showCutsceneStep is called inside createCutsceneUI
    }

    /**
     * Create cutscene UI
     */
    createCutsceneUI() {
        // Remove any existing cutscene container first
        const existing = document.querySelector('.cutscene-container');
        if (existing) existing.remove();
        
        const container = document.createElement('div');
        container.className = 'cutscene-container';
        container.innerHTML = `
            <div class="cutscene-dialog">
                <div class="cutscene-speaker"></div>
                <div class="cutscene-text"></div>
                <div class="cutscene-continue">Click to continue...</div>
            </div>
        `;
        
        // Store reference for later use
        this.cutsceneContainer = container;
        
        // Add click handler
        container.addEventListener('click', (e) => {
            e.stopPropagation();
            this.advanceCutscene();
        });
        
        document.body.appendChild(container);
        
        // Populate the first step immediately
        this.showCutsceneStep();
        
        // Then show the container
        requestAnimationFrame(() => container.classList.add('show'));
    }

    /**
     * Show current cutscene step
     */
    showCutsceneStep() {
        if (!this.cutsceneData || this.cutsceneStep >= this.cutsceneData.length) return;
        
        const step = this.cutsceneData[this.cutsceneStep];
        
        // Use stored container reference or find it
        const container = this.cutsceneContainer || document.querySelector('.cutscene-container');
        if (!container || !step) return;
        
        const speaker = container.querySelector('.cutscene-speaker');
        const text = container.querySelector('.cutscene-text');
        
        if (speaker && text) {
            speaker.textContent = step.speaker;
            speaker.style.color = step.color || 'var(--color-primary)';
            text.textContent = step.text;
        }
    }

    /**
     * Advance to next cutscene step
     */
    advanceCutscene() {
        // Guard against null cutsceneData (can happen if clicked after cutscene ended)
        if (!this.cutsceneData || !this.inCutscene) {
            return;
        }
        
        this.cutsceneStep++;
        
        if (this.cutsceneStep >= this.cutsceneData.length) {
            this.endCutscene();
        } else {
            this.showCutsceneStep();
        }
    }

    /**
     * End cutscene
     */
    endCutscene() {
        const container = this.cutsceneContainer || document.querySelector('.cutscene-container');
        if (container) {
            container.classList.remove('show');
            setTimeout(() => container.remove(), 500);
        }
        
        this.inCutscene = false;
        this.cutsceneData = null;
        this.cutsceneContainer = null;
        
        if (this.cutsceneCallback) {
            this.cutsceneCallback();
            this.cutsceneCallback = null;
        }
    }

    /**
     * Get world selection data for UI
     */
    getWorldSelectionData() {
        return STORY_WORLDS.map(world => ({
            id: world.id,
            name: world.name,
            description: world.description,
            levels: world.levels,
            unlocked: this.progress.worldsUnlocked.includes(world.id),
            completed: this.isWorldComplete(world.id),
            starsEarned: this.getWorldStars(world.id),
            maxStars: world.levels * 3
        }));
    }

    /**
     * Check if a world is complete
     */
    isWorldComplete(worldId) {
        const world = STORY_WORLDS.find(w => w.id === worldId);
        if (!world) return false;
        
        for (let i = 0; i < world.levels; i++) {
            if (!this.progress.levelsCompleted[`${worldId}_${i}`]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get total stars for a world
     */
    getWorldStars(worldId) {
        const world = STORY_WORLDS.find(w => w.id === worldId);
        if (!world) return 0;
        
        let total = 0;
        for (let i = 0; i < world.levels; i++) {
            total += this.progress.starsEarned[`${worldId}_${i}`] || 0;
        }
        return total;
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.clearBossIntervals();
        
        // Remove story mode styling
        const container = document.querySelector('.minesweeper-container');
        if (container) {
            container.classList.remove('story-mode');
            container.style.background = '';
        }
    }
}

export default StoryMode;
