/**
 * Asteroids - Story Mode System
 * 5 worlds, 50 levels, bosses, cutscenes, and campaign progression
 */

// World Definitions (5 worlds, 10 levels each)
export const STORY_WORLDS = [
    {
        id: 'asteroid_belt',
        name: 'The Asteroid Belt',
        description: 'Your journey begins in the dense asteroid fields of the outer rim.',
        theme: { 
            bg: '#000510', 
            asteroidColor: '#888888',
            glowColor: 'rgba(255, 255, 255, 0.3)',
            particleColor: '#ffffff'
        },
        levels: 10,
        baseSpeed: 1.0,
        specialMechanics: [],
        events: [
            { level: 3, type: 'ufo_wave', message: 'UFOs detected!' },
            { level: 5, type: 'miniboss', message: 'A massive asteroid approaches!' },
            { level: 7, type: 'asteroid_storm', message: 'Asteroid storm incoming!' },
            { level: 9, type: 'ufo_squadron', message: 'UFO squadron attacking!' }
        ],
        boss: {
            name: 'Rock Titan',
            type: 'mega_asteroid',
            hp: 10,
            phases: 2,
            attacks: ['split', 'spawn_debris', 'charge'],
            description: 'A colossal asteroid with a crystalline core'
        },
        introCutscene: [
            { speaker: 'Command', text: "Pilot, we're detecting massive asteroid activity in Sector 7." },
            { speaker: 'Command', text: "Your mission: clear a safe passage for the colony ships." },
            { speaker: 'Pilot', text: "Copy that. Engaging thrusters." }
        ],
        outroCutscene: [
            { speaker: 'Pilot', text: "That titan... it wasn't natural." },
            { speaker: 'Command', text: "Our sensors are picking up strange readings from the ice fields." },
            { speaker: 'Command', text: "Proceed with caution, pilot." }
        ]
    },
    {
        id: 'ice_fields',
        name: 'Crystal Caverns',
        description: 'Frozen asteroids that shatter unpredictably.',
        theme: { 
            bg: '#000818', 
            asteroidColor: '#88ccff',
            glowColor: 'rgba(100, 200, 255, 0.4)',
            particleColor: '#aaddff'
        },
        levels: 10,
        baseSpeed: 1.1,
        specialMechanics: ['slippery_flight', 'shatter_fragments'],
        events: [
            { level: 2, type: 'ice_storm', message: 'Ice fragments incoming!' },
            { level: 4, type: 'frozen_ufo', message: 'Frozen UFO awakening!' },
            { level: 6, type: 'crystal_maze', message: 'Navigating crystal maze...' },
            { level: 8, type: 'blizzard', message: 'Visibility reduced!' }
        ],
        boss: {
            name: 'Cryo Colossus',
            type: 'ice_giant',
            hp: 15,
            phases: 3,
            attacks: ['freeze_ray', 'ice_shards', 'cold_snap', 'summon_crystals'],
            description: 'An ancient ice entity that freezes everything in its path'
        },
        introCutscene: [
            { speaker: 'Pilot', text: "It's freezing out here..." },
            { speaker: 'Command', text: "Watch your ship's thermal readings. The cold can slow your systems." },
            { speaker: 'Command', text: "And pilot... be careful. Something sleeps in these ice fields." }
        ],
        outroCutscene: [
            { speaker: 'Pilot', text: "The Cryo Colossus... it was guarding something." },
            { speaker: 'Command', text: "We're detecting volcanic activity nearby. The contrast is... unusual." },
            { speaker: 'Pilot', text: "From ice to fire. Wonderful." }
        ]
    },
    {
        id: 'volcanic_zone',
        name: 'Magma Depths',
        description: 'Volcanic asteroids that explode on destruction.',
        theme: { 
            bg: '#100500', 
            asteroidColor: '#ff4400',
            glowColor: 'rgba(255, 100, 0, 0.5)',
            particleColor: '#ffaa00'
        },
        levels: 10,
        baseSpeed: 1.2,
        specialMechanics: ['explosive_asteroids', 'lava_zones', 'heat_damage'],
        events: [
            { level: 2, type: 'eruption', message: 'Volcanic eruption!' },
            { level: 4, type: 'meteor_shower', message: 'Incoming meteor shower!' },
            { level: 6, type: 'inferno', message: 'Temperature critical!' },
            { level: 8, type: 'magma_wave', message: 'Magma wave approaching!' }
        ],
        boss: {
            name: 'Magma Behemoth',
            type: 'fire_elemental',
            hp: 20,
            phases: 3,
            attacks: ['flame_breath', 'lava_pool', 'explosion', 'summon_flames'],
            description: 'Born from the heart of a dying star'
        },
        introCutscene: [
            { speaker: 'Pilot', text: "Is it just me or did the temperature spike?" },
            { speaker: 'Command', text: "These asteroids have molten cores. One wrong hit and—" },
            { speaker: 'Pilot', text: "Yeah, I get it. Don't blow up." }
        ],
        outroCutscene: [
            { speaker: 'Pilot', text: "That creature... it wasn't just fire. It was alive." },
            { speaker: 'Command', text: "Pilot, there's something you should see. Strange signals from the outer rim." },
            { speaker: 'Command', text: "They're not natural. They're... mathematical." }
        ]
    },
    {
        id: 'alien_territory',
        name: 'Hostile Space',
        description: 'UFO-dominated sector with advanced weaponry.',
        theme: { 
            bg: '#050510', 
            asteroidColor: '#00ff88',
            glowColor: 'rgba(0, 255, 150, 0.4)',
            particleColor: '#00ffaa'
        },
        levels: 10,
        baseSpeed: 1.3,
        specialMechanics: ['ufo_support', 'alien_tech', 'warp_gates'],
        events: [
            { level: 2, type: 'scout_wave', message: 'Scout ships detected!' },
            { level: 4, type: 'ambush', message: 'It\'s a trap!' },
            { level: 6, type: 'carrier_attack', message: 'Enemy carrier approaching!' },
            { level: 8, type: 'fleet_battle', message: 'Full fleet engagement!' }
        ],
        boss: {
            name: 'The Mothership',
            type: 'alien_vessel',
            hp: 30,
            phases: 4,
            attacks: ['beam_cannon', 'spawn_fighters', 'tractor_beam', 'missile_barrage', 'shield_regen'],
            description: 'Command vessel of the alien armada'
        },
        introCutscene: [
            { speaker: 'Command', text: "Pilot, you're entering hostile territory." },
            { speaker: 'Pilot', text: "I've noticed. There are UFOs everywhere." },
            { speaker: '???', text: "LEAVE THIS SPACE. YOU ARE NOT WELCOME.", color: '#00ff00' },
            { speaker: 'Pilot', text: "...I'll take that as a greeting." }
        ],
        outroCutscene: [
            { speaker: 'Pilot', text: "The Mothership is down. But there's more coming." },
            { speaker: 'Command', text: "Wait... we're receiving a transmission." },
            { speaker: '???', text: "YOU HAVE PROVEN YOURSELF. NOW FACE THE VOID.", color: '#aa00ff' }
        ]
    },
    {
        id: 'the_void',
        name: 'The Void',
        description: 'Reality itself bends in this cosmic anomaly.',
        theme: { 
            bg: '#000000', 
            asteroidColor: '#aa00ff',
            glowColor: 'rgba(170, 0, 255, 0.5)',
            particleColor: '#cc44ff'
        },
        levels: 10,
        baseSpeed: 1.5,
        specialMechanics: ['gravity_distortion', 'phase_shift', 'reality_warp', 'mirror_self'],
        events: [
            { level: 2, type: 'gravity_anomaly', message: 'Gravity fluctuating!' },
            { level: 3, type: 'time_dilation', message: 'Time distortion detected!' },
            { level: 5, type: 'mirror_dimension', message: 'Mirror self appearing!' },
            { level: 7, type: 'dimension_rift', message: 'Dimensional rift opening!' },
            { level: 9, type: 'reality_collapse', message: 'Reality collapsing!' }
        ],
        boss: {
            name: 'Entropy',
            type: 'void_entity',
            hp: 50,
            phases: 5,
            attacks: ['void_beam', 'reality_tear', 'summon_shadows', 'time_freeze', 'dimension_shift', 'final_collapse'],
            description: 'The end of all things. The beginning of nothing.'
        },
        introCutscene: [
            { speaker: 'Pilot', text: "This place... it's wrong." },
            { speaker: 'Command', text: "We're losing your signal, pilot. You're on your own." },
            { speaker: 'Entropy', text: "YOU HAVE COME FAR, LITTLE SHIP.", color: '#aa00ff' },
            { speaker: 'Entropy', text: "BUT ALL JOURNEYS END. ALL THINGS END.", color: '#aa00ff' },
            { speaker: 'Pilot', text: "Not today." }
        ],
        outroCutscene: [
            { speaker: 'Entropy', text: "IMPOSSIBLE... YOU CANNOT DESTROY ENTROPY...", color: '#aa00ff' },
            { speaker: 'Pilot', text: "I didn't destroy you. I just moved on." },
            { speaker: 'Command', text: "Pilot... welcome home. You've saved us all." },
            { speaker: 'Pilot', text: "Just another day in the asteroid belt." }
        ],
        isEndgame: true
    }
];

// Level Generation Config
export function generateLevelConfig(worldIndex, levelIndex) {
    const world = STORY_WORLDS[worldIndex];
    const levelNum = levelIndex + 1;
    const isBossLevel = levelNum === 10;
    const isMiniboss = levelNum === 5;

    return {
        worldId: world.id,
        worldName: world.name,
        levelNumber: levelNum,
        totalLevels: world.levels,
        theme: world.theme,
        
        // Difficulty scaling
        asteroidCount: 4 + Math.floor(levelNum * 0.8) + (worldIndex * 2),
        asteroidSpeed: world.baseSpeed * (1 + levelNum * 0.05),
        asteroidSpawnRate: Math.max(3, 8 - levelNum * 0.3),
        
        // UFO settings
        ufoEnabled: levelNum >= 3 || worldIndex >= 3,
        ufoInterval: Math.max(10, 25 - levelNum - worldIndex * 3),
        ufoAggression: 0.3 + (worldIndex * 0.15) + (levelNum * 0.02),
        
        // Special mechanics from world
        mechanics: world.specialMechanics,
        
        // Events for this level
        event: world.events.find(e => e.level === levelNum) || null,
        
        // Boss/Miniboss
        isBossLevel,
        isMiniboss,
        boss: isBossLevel ? world.boss : null,
        
        // Win condition
        goal: isBossLevel 
            ? { type: 'defeat_boss' }
            : { type: 'clear_waves', waves: 3 + Math.floor(levelNum / 2) }
    };
}

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
        this.currentCutscene = null;
        this.dialogUI = null;
        this.bossActive = false;
        this.boss = null;
    }

    loadProgress() {
        try {
            return JSON.parse(localStorage.getItem('asteroids_story_progress') || '{}');
        } catch {
            return {};
        }
    }

    saveProgress() {
        localStorage.setItem('asteroids_story_progress', JSON.stringify(this.progress));
    }

    // World/Level Access
    isWorldUnlocked(worldIndex) {
        if (worldIndex === 0) return true;
        const prevWorld = STORY_WORLDS[worldIndex - 1];
        return this.progress[`${prevWorld.id}_complete`] === true;
    }

    isLevelUnlocked(worldIndex, levelIndex) {
        if (!this.isWorldUnlocked(worldIndex)) return false;
        if (levelIndex === 0) return true;
        
        const world = STORY_WORLDS[worldIndex];
        return this.progress[`${world.id}_level_${levelIndex}`] === true;
    }

    getWorldProgress(worldIndex) {
        const world = STORY_WORLDS[worldIndex];
        let completed = 0;
        for (let i = 0; i < world.levels; i++) {
            if (this.progress[`${world.id}_level_${i + 1}`]) completed++;
        }
        return { completed, total: world.levels };
    }

    getTotalProgress() {
        let completed = 0;
        let total = 0;
        for (const world of STORY_WORLDS) {
            total += world.levels;
            for (let i = 0; i < world.levels; i++) {
                if (this.progress[`${world.id}_level_${i + 1}`]) completed++;
            }
        }
        return { completed, total, percentage: Math.floor((completed / total) * 100) };
    }

    // Start a level
    startWorld(worldIndex) {
        if (!this.isWorldUnlocked(worldIndex)) return false;
        
        this.currentWorldIndex = worldIndex;
        this.currentLevelIndex = 0;
        
        const world = STORY_WORLDS[worldIndex];
        if (world.introCutscene && !this.progress[`${world.id}_intro_seen`]) {
            this.playCutscene(world.introCutscene, () => {
                this.progress[`${world.id}_intro_seen`] = true;
                this.saveProgress();
                this.startLevel(0);
            });
        } else {
            this.startLevel(0);
        }
        
        return true;
    }

    startLevel(levelIndex) {
        this.currentLevelIndex = levelIndex;
        const config = generateLevelConfig(this.currentWorldIndex, levelIndex);
        
        // Apply level config to game
        this.game.loadStoryLevel(config);
        
        // Check for level event
        if (config.event) {
            setTimeout(() => {
                this.showEventMessage(config.event.message);
                this.triggerEvent(config.event);
            }, 3000);
        }
    }

    completeLevel() {
        const world = STORY_WORLDS[this.currentWorldIndex];
        const levelNum = this.currentLevelIndex + 1;
        
        this.progress[`${world.id}_level_${levelNum}`] = true;
        this.saveProgress();
        
        // Boss level completed = world complete
        if (levelNum === world.levels) {
            this.progress[`${world.id}_complete`] = true;
            this.saveProgress();
            
            if (world.outroCutscene) {
                this.playCutscene(world.outroCutscene, () => {
                    this.showWorldComplete(world);
                });
            } else {
                this.showWorldComplete(world);
            }
        } else {
            // Show level complete and advance
            this.showLevelComplete(levelNum, () => {
                this.startLevel(this.currentLevelIndex + 1);
            });
        }
    }

    // Events
    triggerEvent(event) {
        switch (event.type) {
            case 'ufo_wave':
                this.game.spawnUFOWave(3);
                break;
            case 'asteroid_storm':
                this.game.startAsteroidStorm(10);
                break;
            case 'miniboss':
                this.game.spawnMiniboss();
                break;
            case 'ufo_squadron':
                this.game.spawnUFOWave(5);
                break;
            // World-specific events
            case 'ice_storm':
                this.game.startSpecialEvent('ice_shards');
                break;
            case 'blizzard':
                this.game.startSpecialEvent('low_visibility');
                break;
            case 'eruption':
                this.game.startSpecialEvent('volcanic');
                break;
            case 'meteor_shower':
                this.game.startSpecialEvent('meteors');
                break;
            case 'ambush':
                this.game.spawnUFOWave(4, true); // Surround
                break;
            case 'gravity_anomaly':
                this.game.startSpecialEvent('gravity');
                break;
            case 'dimension_rift':
                this.game.startSpecialEvent('rift');
                break;
        }
    }

    // Boss Battle
    startBossBattle(bossData) {
        this.bossActive = true;
        this.boss = {
            ...bossData,
            currentHp: bossData.hp,
            currentPhase: 1,
            attackTimer: 0,
            stunned: false
        };
        
        this.showBossIntro(bossData);
    }

    updateBoss(dt) {
        if (!this.bossActive || !this.boss) return;

        // Boss AI and attacks
        this.boss.attackTimer -= dt;
        if (this.boss.attackTimer <= 0 && !this.boss.stunned) {
            this.executeBossAttack();
            this.boss.attackTimer = 3 - (this.boss.currentPhase * 0.3);
        }

        // Check phase transitions
        const hpPercent = this.boss.currentHp / this.boss.hp;
        const expectedPhase = Math.ceil((1 - hpPercent) * this.boss.phases) + 1;
        if (expectedPhase > this.boss.currentPhase && expectedPhase <= this.boss.phases) {
            this.transitionBossPhase(expectedPhase);
        }
    }

    executeBossAttack() {
        const attacks = this.boss.attacks;
        const attack = attacks[Math.floor(Math.random() * Math.min(attacks.length, this.boss.currentPhase + 1))];
        this.game.executeBossAttack(attack, this.boss);
    }

    transitionBossPhase(newPhase) {
        this.boss.currentPhase = newPhase;
        this.boss.stunned = true;
        this.showMessage(`Phase ${newPhase}!`, '#ff4444');
        
        setTimeout(() => {
            this.boss.stunned = false;
        }, 2000);
    }

    damageBoss(amount) {
        if (!this.bossActive || !this.boss) return false;
        
        this.boss.currentHp -= amount;
        
        if (this.boss.currentHp <= 0) {
            this.defeatBoss();
            return true;
        }
        
        return false;
    }

    defeatBoss() {
        this.bossActive = false;
        this.game.spawnBossExplosion(this.boss);
        this.showMessage('BOSS DEFEATED!', '#00ff00');
        
        setTimeout(() => {
            this.completeLevel();
        }, 3000);
    }

    // Cutscene System
    createDialogUI() {
        if (this.dialogUI) return;
        
        this.dialogUI = document.createElement('div');
        this.dialogUI.className = 'story-dialog-overlay';
        this.dialogUI.innerHTML = `
            <div class="story-dialog">
                <div class="dialog-speaker"></div>
                <div class="dialog-text"></div>
                <div class="dialog-continue">Click or press SPACE to continue</div>
            </div>
        `;
        document.body.appendChild(this.dialogUI);
        
        this.dialogUI.onclick = () => this.advanceDialog();
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.inCutscene) {
                e.preventDefault();
                this.advanceDialog();
            }
        });
    }

    playCutscene(dialogues, onComplete) {
        this.createDialogUI();
        this.inCutscene = true;
        this.currentCutscene = dialogues;
        this.cutsceneStep = 0;
        this.onCutsceneComplete = onComplete;
        
        this.dialogUI.classList.add('show');
        this.showDialogStep();
    }

    showDialogStep() {
        const step = this.currentCutscene[this.cutsceneStep];
        const speaker = this.dialogUI.querySelector('.dialog-speaker');
        const text = this.dialogUI.querySelector('.dialog-text');
        
        speaker.textContent = step.speaker;
        speaker.style.color = step.color || '#00ffff';
        text.textContent = step.text;
        
        // Typewriter effect
        text.style.opacity = '0';
        setTimeout(() => {
            text.style.opacity = '1';
        }, 100);
    }

    advanceDialog() {
        this.cutsceneStep++;
        
        if (this.cutsceneStep >= this.currentCutscene.length) {
            this.endCutscene();
        } else {
            this.showDialogStep();
        }
    }

    endCutscene() {
        this.inCutscene = false;
        this.dialogUI.classList.remove('show');
        
        if (this.onCutsceneComplete) {
            this.onCutsceneComplete();
        }
    }

    // UI Messages
    showEventMessage(message) {
        this.showMessage(message, '#ffff00');
    }

    showMessage(text, color = '#ffffff') {
        const msg = document.createElement('div');
        msg.className = 'story-message';
        msg.textContent = text;
        msg.style.color = color;
        document.body.appendChild(msg);
        
        setTimeout(() => msg.classList.add('show'), 10);
        setTimeout(() => {
            msg.classList.remove('show');
            setTimeout(() => msg.remove(), 500);
        }, 2500);
    }

    showBossIntro(boss) {
        const intro = document.createElement('div');
        intro.className = 'boss-intro';
        intro.innerHTML = `
            <div class="boss-warning">⚠️ WARNING ⚠️</div>
            <div class="boss-name">${boss.name}</div>
            <div class="boss-desc">${boss.description}</div>
            <div class="boss-hp-preview">HP: ${boss.hp} | Phases: ${boss.phases}</div>
        `;
        document.body.appendChild(intro);
        
        setTimeout(() => intro.classList.add('show'), 10);
        setTimeout(() => {
            intro.classList.remove('show');
            setTimeout(() => intro.remove(), 500);
        }, 4000);
    }

    showLevelComplete(levelNum, onContinue) {
        const complete = document.createElement('div');
        complete.className = 'level-complete-overlay';
        complete.innerHTML = `
            <div class="level-complete">
                <div class="complete-icon">✓</div>
                <div class="complete-title">Level ${levelNum} Complete!</div>
                <button class="complete-btn">Continue</button>
            </div>
        `;
        document.body.appendChild(complete);
        
        complete.querySelector('.complete-btn').onclick = () => {
            complete.remove();
            if (onContinue) onContinue();
        };
        
        setTimeout(() => complete.classList.add('show'), 10);
    }

    showWorldComplete(world) {
        const complete = document.createElement('div');
        complete.className = 'world-complete-overlay';
        complete.innerHTML = `
            <div class="world-complete">
                <div class="complete-icon">🏆</div>
                <div class="complete-title">${world.name} Complete!</div>
                <div class="complete-desc">You have conquered this region of space.</div>
                ${world.isEndgame ? '<div class="complete-final">Congratulations! You have completed the story!</div>' : ''}
                <button class="complete-btn">Return to Menu</button>
            </div>
        `;
        document.body.appendChild(complete);
        
        complete.querySelector('.complete-btn').onclick = () => {
            complete.remove();
            this.game.showStoryMenu();
        };
        
        setTimeout(() => complete.classList.add('show'), 10);
    }

    // Story Menu UI
    openStoryMenu() {
        const overlay = document.createElement('div');
        overlay.className = 'story-menu-overlay';
        
        const progress = this.getTotalProgress();
        let menuHTML = `
            <div class="story-menu">
                <div class="story-header">
                    <h2>🚀 Story Campaign</h2>
                    <div class="story-progress">
                        <span>${progress.completed}/${progress.total} Levels (${progress.percentage}%)</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                        </div>
                    </div>
                    <button class="story-close">✕</button>
                </div>
                <div class="worlds-container">
        `;

        STORY_WORLDS.forEach((world, index) => {
            const unlocked = this.isWorldUnlocked(index);
            const worldProgress = this.getWorldProgress(index);
            const complete = this.progress[`${world.id}_complete`];
            
            menuHTML += `
                <div class="world-card ${unlocked ? 'unlocked' : 'locked'} ${complete ? 'complete' : ''}" 
                     data-world="${index}">
                    <div class="world-number">${index + 1}</div>
                    <div class="world-info">
                        <div class="world-name">${world.name}</div>
                        <div class="world-desc">${world.description}</div>
                        <div class="world-progress">
                            ${unlocked ? `${worldProgress.completed}/${worldProgress.total} levels` : '🔒 Locked'}
                        </div>
                    </div>
                    ${complete ? '<div class="world-complete-badge">✓</div>' : ''}
                </div>
            `;
        });

        menuHTML += '</div></div>';
        overlay.innerHTML = menuHTML;
        document.body.appendChild(overlay);

        // Event handlers
        overlay.querySelector('.story-close').onclick = () => overlay.remove();
        overlay.querySelectorAll('.world-card.unlocked').forEach(card => {
            card.onclick = () => {
                const worldIndex = parseInt(card.dataset.world);
                overlay.remove();
                this.startWorld(worldIndex);
            };
        });
        
        setTimeout(() => overlay.classList.add('show'), 10);
    }
}
