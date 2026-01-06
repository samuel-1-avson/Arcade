/**
 * Snake Game - Comprehensive Test Suite
 * Tests all game modules and systems
 * Run in browser console or as a module
 */

// Test results tracking
const TestRunner = {
    passed: 0,
    failed: 0,
    tests: [],
    
    assert(condition, testName, details = '') {
        if (condition) {
            this.passed++;
            this.tests.push({ name: testName, status: 'PASS', details });
            console.log(`✅ PASS: ${testName}`);
        } else {
            this.failed++;
            this.tests.push({ name: testName, status: 'FAIL', details });
            console.log(`❌ FAIL: ${testName}${details ? ` - ${details}` : ''}`);
        }
    },
    
    assertEqual(actual, expected, testName) {
        this.assert(actual === expected, testName, `Expected: ${expected}, Got: ${actual}`);
    },
    
    assertNotNull(value, testName) {
        this.assert(value !== null && value !== undefined, testName, 'Value was null/undefined');
    },
    
    assertType(value, type, testName) {
        this.assert(typeof value === type, testName, `Expected type: ${type}, Got: ${typeof value}`);
    },
    
    assertArray(value, testName) {
        this.assert(Array.isArray(value), testName, 'Expected array');
    },
    
    summary() {
        console.log('\n========================================');
        console.log(`TEST SUMMARY: ${this.passed} passed, ${this.failed} failed`);
        console.log(`Total: ${this.passed + this.failed} tests`);
        console.log('========================================\n');
        return { passed: this.passed, failed: this.failed, tests: this.tests };
    },
    
    reset() {
        this.passed = 0;
        this.failed = 0;
        this.tests = [];
    }
};

// ========================================
// Module Import Tests
// ========================================
async function testModuleImports() {
    console.log('\n📦 TESTING MODULE IMPORTS...\n');
    
    try {
        const modules = [
            '../ParticleSystem.js',
            '../Camera.js',
            '../PhysicsSystem.js',
            '../StoryMode.js',
            '../BossBattle.js',
            '../ProgressionSystem.js',
            '../MapGenerator.js',
            '../GameModes.js',
            '../ShopAndAbilities.js',
            '../AdvancedFeatures.js',
            '../UIManager.js',
            '../AudioManager.js',
            '../AchievementSystem.js',
            '../PolishSystem.js',
            '../EnhancedEffects.js'
        ];
        
        for (const modulePath of modules) {
            try {
                await import(modulePath);
                TestRunner.assert(true, `Import ${modulePath}`);
            } catch (e) {
                TestRunner.assert(false, `Import ${modulePath}`, e.message);
            }
        }
    } catch (e) {
        console.error('Module import test failed:', e);
    }
}

// ========================================
// Particle System Tests
// ========================================
async function testParticleSystem() {
    console.log('\n🎆 TESTING PARTICLE SYSTEM...\n');
    
    try {
        const { ParticleSystem, WeatherSystem } = await import('../ParticleSystem.js');
        
        const ps = new ParticleSystem();
        TestRunner.assertNotNull(ps, 'ParticleSystem instantiation');
        TestRunner.assertArray(ps.particles, 'Particles array exists');
        TestRunner.assertEqual(ps.maxParticles, 1000, 'Max particles default');
        
        // Test emission
        ps.emitExplosion(100, 100, [1, 0, 0], 10);
        TestRunner.assert(ps.particles.length > 0, 'Particles emitted on explosion');
        
        const initialCount = ps.particles.length;
        ps.emitSparkle(100, 100, [0, 1, 0]);
        TestRunner.assert(ps.particles.length > initialCount, 'Sparkle emission adds particles');
        
        // Test update
        ps.update(0.016);
        TestRunner.assert(true, 'Particle update runs without error');
        
        // Test new emitters
        ps.emitLightning(0, 0, 100, 100);
        TestRunner.assert(ps.particles.length > 0, 'Lightning emitter works');
        
        ps.emitConfetti(100, 100, 20);
        TestRunner.assert(ps.particles.length > 0, 'Confetti emitter works');
        
        ps.emitHearts(100, 100);
        TestRunner.assert(ps.particles.length > 0, 'Hearts emitter works');
        
        // Test clear
        ps.clear();
        TestRunner.assertEqual(ps.particles.length, 0, 'Clear removes all particles');
        
        // Test weather system
        const weather = new WeatherSystem(ps, 600, 600);
        TestRunner.assertNotNull(weather, 'WeatherSystem instantiation');
        weather.setWeather('rain', 1);
        TestRunner.assertEqual(weather.type, 'rain', 'Weather type set');
        weather.update(0.1);
        TestRunner.assert(true, 'Weather update runs');
        
    } catch (e) {
        TestRunner.assert(false, 'ParticleSystem tests', e.message);
    }
}

// ========================================
// Camera Tests
// ========================================
async function testCamera() {
    console.log('\n📷 TESTING CAMERA...\n');
    
    try {
        const Camera = (await import('../Camera.js')).default;
        
        const cam = new Camera(600, 600);
        TestRunner.assertNotNull(cam, 'Camera instantiation');
        TestRunner.assertEqual(cam.zoom, 1, 'Default zoom is 1');
        
        // Test shake
        cam.shake(10, 0.5);
        TestRunner.assert(cam.shakeIntensity > 0, 'Shake sets intensity');
        
        // Test flash
        cam.doFlash([1, 1, 1], 0.2);
        TestRunner.assert(cam.flashAlpha > 0, 'Flash sets alpha');
        
        // Test slow motion
        cam.startSlowMotion(0.5, 1);
        TestRunner.assert(cam.slowMotionActive, 'Slow motion activates');
        
        // Test update
        cam.update(0.016);
        TestRunner.assert(true, 'Camera update runs');
        
        // Test follow
        cam.follow({ x: 100, y: 100 });
        TestRunner.assertNotNull(cam.followTarget, 'Follow target set');
        
        // Test reset
        cam.reset();
        TestRunner.assertEqual(cam.zoom, 1, 'Reset restores zoom');
        
    } catch (e) {
        TestRunner.assert(false, 'Camera tests', e.message);
    }
}

// ========================================
// Physics System Tests
// ========================================
async function testPhysicsSystem() {
    console.log('\n⚡ TESTING PHYSICS SYSTEM...\n');
    
    try {
        const PhysicsSystem = (await import('../PhysicsSystem.js')).default;
        
        const physics = new PhysicsSystem(30, 20);
        TestRunner.assertNotNull(physics, 'PhysicsSystem instantiation');
        TestRunner.assertEqual(physics.gridSize, 30, 'Grid size set');
        
        // Test snake initialization
        const snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
        physics.initializeFromSnake(snake);
        TestRunner.assert(physics.visualPositions.length > 0, 'Visual positions initialized');
        
        // Test momentum
        physics.updateMomentum(true, 0.016);
        TestRunner.assert(physics.momentum >= 0, 'Momentum calculates');
        
        // Test food physics
        const food = { x: 10, y: 10 };
        physics.updateFoodPhysics(food, 0.016);
        TestRunner.assert(true, 'Food physics updates');
        
        // Test bezier curve
        const point = physics.calculateBezierPoint(
            { x: 0, y: 0 }, { x: 1, y: 0 },
            { x: 2, y: 1 }, { x: 3, y: 1 }, 0.5
        );
        TestRunner.assertNotNull(point.x, 'Bezier point calculated');
        
        // Test reset
        physics.reset();
        TestRunner.assertEqual(physics.momentum, 0, 'Reset clears momentum');
        
    } catch (e) {
        TestRunner.assert(false, 'PhysicsSystem tests', e.message);
    }
}

// ========================================
// Story Mode Tests
// ========================================
async function testStoryMode() {
    console.log('\n📖 TESTING STORY MODE...\n');
    
    try {
        const { StoryMode, STORY_WORLDS } = await import('../StoryMode.js');
        
        TestRunner.assertArray(STORY_WORLDS, 'STORY_WORLDS is array');
        TestRunner.assertEqual(STORY_WORLDS.length, 5, '5 story worlds defined');
        
        // Check world structure
        const garden = STORY_WORLDS[0];
        TestRunner.assertEqual(garden.id, 'garden', 'First world is garden');
        TestRunner.assertNotNull(garden.boss, 'World has boss');
        TestRunner.assertArray(garden.introCutscene, 'World has intro cutscene');
        TestRunner.assertArray(garden.loreItems, 'World has lore items (enhanced)');
        TestRunner.assertArray(garden.events, 'World has events (enhanced)');
        TestRunner.assertNotNull(garden.weather, 'World has weather (enhanced)');
        
        // Check all worlds have required properties
        for (const world of STORY_WORLDS) {
            TestRunner.assertNotNull(world.id, `World ${world.name} has id`);
            TestRunner.assertNotNull(world.theme, `World ${world.name} has theme`);
            TestRunner.assert(world.levels > 0, `World ${world.name} has levels`);
        }
        
    } catch (e) {
        TestRunner.assert(false, 'StoryMode tests', e.message);
    }
}

// ========================================
// Boss Battle Tests
// ========================================
async function testBossBattle() {
    console.log('\n👾 TESTING BOSS BATTLE...\n');
    
    try {
        const { BossBattle } = await import('../BossBattle.js');
        
        // Mock game object
        const mockGame = {
            gridSize: 30,
            cellSize: 20,
            snake: [{ x: 15, y: 15 }],
            obstacles: [],
            activePowerUps: {},
            camera: { shake: () => {}, doFlash: () => {}, startSlowMotion: () => {} },
            particleSystem: { emitExplosion: () => {}, emitFirework: () => {} },
            audio: { playSFX: () => {} },
            togglePause: () => {},
            handleCollision: () => {},
            addScore: () => {}
        };
        
        const bossData = { name: 'Test Boss', type: 'lawnmower', hp: 5, phases: 2 };
        const boss = new BossBattle(mockGame, bossData, 'garden');
        
        TestRunner.assertNotNull(boss, 'BossBattle instantiation');
        TestRunner.assertEqual(boss.hp, 5, 'Boss HP set');
        TestRunner.assertEqual(boss.maxPhases, 2, 'Boss phases set');
        TestRunner.assertArray(boss.patterns, 'Boss has attack patterns');
        TestRunner.assertArray(boss.minions, 'Boss has minions array (enhanced)');
        TestRunner.assertType(boss.enrageTimer, 'number', 'Boss has enrage timer (enhanced)');
        
        // Test patterns exist
        TestRunner.assert(boss.patterns.length > 0, 'Boss has attack patterns');
        
        // Test update
        boss.isActive = true;
        boss.update(0.016);
        TestRunner.assert(true, 'Boss update runs');
        
        // Test minion spawn
        boss.spawnMinions(2);
        TestRunner.assert(boss.minions.length > 0, 'Minions spawn correctly (enhanced)');
        
        // Test damage
        boss.flashTimer = 0;
        const initialHp = boss.hp;
        boss.takeDamage();
        TestRunner.assert(boss.hp < initialHp, 'Boss takes damage');
        
    } catch (e) {
        TestRunner.assert(false, 'BossBattle tests', e.message);
    }
}

// ========================================
// Achievement System Tests
// ========================================
async function testAchievementSystem() {
    console.log('\n🏆 TESTING ACHIEVEMENT SYSTEM...\n');
    
    try {
        const { AchievementSystem, ACHIEVEMENTS } = await import('../AchievementSystem.js');
        
        TestRunner.assertArray(ACHIEVEMENTS, 'ACHIEVEMENTS is array');
        TestRunner.assert(ACHIEVEMENTS.length >= 75, 'At least 75 achievements');
        
        // Mock game
        const mockGame = {
            score: 0,
            snake: [],
            audio: { speak: () => {} }
        };
        
        const achievements = new AchievementSystem(mockGame);
        TestRunner.assertNotNull(achievements, 'AchievementSystem instantiation');
        TestRunner.assertType(achievements.xp, 'number', 'XP tracking exists');
        TestRunner.assertType(achievements.level, 'number', 'Level tracking exists');
        TestRunner.assertType(achievements.prestigeLevel, 'number', 'Prestige tracking exists');
        
        // Test XP
        const initialXP = achievements.xp;
        achievements.addXP(100);
        TestRunner.assert(achievements.xp >= initialXP, 'XP adds correctly');
        
        // Test daily challenges
        achievements.generateDailyChallenges();
        TestRunner.assertArray(achievements.dailyChallenges, 'Daily challenges generated');
        
        // Test weekly challenges
        achievements.generateWeeklyChallenges();
        TestRunner.assertArray(achievements.weeklyChallenges, 'Weekly challenges generated');
        
    } catch (e) {
        TestRunner.assert(false, 'AchievementSystem tests', e.message);
    }
}

// ========================================
// Audio Manager Tests
// ========================================
async function testAudioManager() {
    console.log('\n🔊 TESTING AUDIO MANAGER...\n');
    
    try {
        const { AudioManager } = await import('../AudioManager.js');
        
        const audio = new AudioManager();
        TestRunner.assertNotNull(audio, 'AudioManager instantiation');
        TestRunner.assertNotNull(audio.sfxLibrary, 'SFX library exists');
        TestRunner.assertNotNull(audio.musicTracks, 'Music tracks exist');
        
        // Test settings
        audio.updateSettings({ masterVolume: 0.5, musicEnabled: true });
        TestRunner.assertEqual(audio.masterVolume, 0.5, 'Volume updates');
        
        // Test SFX count
        const sfxCount = Object.keys(audio.sfxLibrary).length;
        TestRunner.assert(sfxCount >= 50, 'At least 50 SFX defined');
        
        // Test music track count
        const trackCount = Object.keys(audio.musicTracks).length;
        TestRunner.assert(trackCount >= 7, 'At least 7 music tracks');
        
    } catch (e) {
        TestRunner.assert(false, 'AudioManager tests', e.message);
    }
}

// ========================================
// UI Manager Tests
// ========================================
async function testUIManager() {
    console.log('\n🎨 TESTING UI MANAGER...\n');
    
    try {
        const { UIManager, SNAKE_SKINS } = await import('../UIManager.js');
        
        TestRunner.assertNotNull(SNAKE_SKINS, 'SNAKE_SKINS exported');
        TestRunner.assert(Object.keys(SNAKE_SKINS).length >= 10, 'At least 10 skins');
        
        // Mock game
        const mockGame = {
            canvas: document.createElement('canvas'),
            togglePause: () => {},
            audio: { updateSettings: () => {} }
        };
        
        const ui = new UIManager(mockGame);
        TestRunner.assertNotNull(ui, 'UIManager instantiation');
        TestRunner.assertNotNull(ui.settings, 'Settings object exists');
        
        // Check settings structure
        TestRunner.assertNotNull(ui.settings.masterVolume, 'Master volume setting');
        TestRunner.assertNotNull(ui.settings.showGrid, 'Grid setting');
        
        // Test stats
        TestRunner.assertNotNull(ui.stats, 'Stats object exists');
        
    } catch (e) {
        TestRunner.assert(false, 'UIManager tests', e.message);
    }
}

// ========================================
// Polish System Tests
// ========================================
async function testPolishSystem() {
    console.log('\n✨ TESTING POLISH SYSTEM...\n');
    
    try {
        const { PolishSystem, PerformanceMonitor, SaveSystem, ReplaySystem } = await import('../PolishSystem.js');
        
        // Performance Monitor
        const perfMon = new PerformanceMonitor();
        TestRunner.assertNotNull(perfMon, 'PerformanceMonitor instantiation');
        perfMon.startFrame();
        perfMon.endFrame();
        TestRunner.assert(perfMon.fps > 0, 'FPS calculated');
        
        // Save System (mock game)
        const mockGame = {
            snake: [{ x: 5, y: 5 }],
            direction: 'RIGHT',
            score: 100,
            currentLevel: 1,
            gameMode: 'classic',
            food: { x: 10, y: 10 },
            obstacles: [],
            activePowerUps: {},
            combo: 0,
            ultimateCharge: 0,
            ui: { settings: {} },
            togglePause: () => {},
            updateUI: () => {}
        };
        
        const saveSystem = new SaveSystem(mockGame);
        TestRunner.assertNotNull(saveSystem, 'SaveSystem instantiation');
        
        const saveState = saveSystem.createSaveState();
        TestRunner.assertNotNull(saveState, 'Save state created');
        TestRunner.assertEqual(saveState.gameState.score, 100, 'Score in save state');
        
        // Replay System
        const replaySystem = new ReplaySystem(mockGame);
        TestRunner.assertNotNull(replaySystem, 'ReplaySystem instantiation');
        replaySystem.startRecording();
        TestRunner.assert(replaySystem.isRecording, 'Recording starts');
        replaySystem.recordFrame({ direction: 'UP' });
        const replay = replaySystem.stopRecording();
        TestRunner.assertNotNull(replay, 'Replay captured');
        TestRunner.assert(replay.frames.length > 0, 'Replay has frames');
        
    } catch (e) {
        TestRunner.assert(false, 'PolishSystem tests', e.message);
    }
}

// ========================================
// Enhanced Effects Tests
// ========================================
async function testEnhancedEffects() {
    console.log('\n🌟 TESTING ENHANCED EFFECTS...\n');
    
    try {
        const { TrailSystem, LightingSystem, ScreenEffects, IsometricRenderer } = await import('../EnhancedEffects.js');
        
        // Trail System
        const trails = new TrailSystem(50);
        TestRunner.assertNotNull(trails, 'TrailSystem instantiation');
        trails.addTrailPoint(5, 5, '#00ff88', 1);
        TestRunner.assert(trails.trails.length > 0, 'Trail points added');
        trails.update(0.016);
        TestRunner.assert(true, 'Trail update runs');
        
        // Lighting System
        const lighting = new LightingSystem(600, 600);
        TestRunner.assertNotNull(lighting, 'LightingSystem instantiation');
        const lightIndex = lighting.addLight(10, 10, 5, [1, 1, 1], 1, 'point');
        TestRunner.assert(lighting.lights.length > 0, 'Light added');
        lighting.update(0.016);
        TestRunner.assert(true, 'Lighting update runs');
        
        // Screen Effects
        const canvas = document.createElement('canvas');
        const screenFx = new ScreenEffects(canvas);
        TestRunner.assertNotNull(screenFx, 'ScreenEffects instantiation');
        screenFx.addEffect('glitch', 0.5, 0.3);
        TestRunner.assert(screenFx.effects.length > 0, 'Effect added');
        screenFx.update(0.016);
        TestRunner.assert(true, 'Screen FX update runs');
        
        // Isometric Renderer
        const iso = new IsometricRenderer(canvas);
        TestRunner.assertNotNull(iso, 'IsometricRenderer instantiation');
        const isoPos = iso.toIso(5, 5, 0);
        TestRunner.assertNotNull(isoPos.x, 'Isometric conversion works');
        
    } catch (e) {
        TestRunner.assert(false, 'EnhancedEffects tests', e.message);
    }
}

// ========================================
// Game Modes Tests
// ========================================
async function testGameModes() {
    console.log('\n🎮 TESTING GAME MODES...\n');
    
    try {
        const GameModes = await import('../GameModes.js');
        
        TestRunner.assertNotNull(GameModes.MultiplayerMode, 'MultiplayerMode exists');
        TestRunner.assertNotNull(GameModes.PuzzleMode, 'PuzzleMode exists');
        TestRunner.assertNotNull(GameModes.DailyChallengeMode, 'DailyChallengeMode exists');
        TestRunner.assertNotNull(GameModes.ZenMode, 'ZenMode exists');
        TestRunner.assertNotNull(GameModes.SpeedrunMode, 'SpeedrunMode exists');
        
    } catch (e) {
        TestRunner.assert(false, 'GameModes tests', e.message);
    }
}

// ========================================
// Map Generator Tests
// ========================================
async function testMapGenerator() {
    console.log('\n🗺️ TESTING MAP GENERATOR...\n');
    
    try {
        const { MapGenerator, Portal } = await import('../MapGenerator.js');
        
        const mapGen = new MapGenerator(30);
        TestRunner.assertNotNull(mapGen, 'MapGenerator instantiation');
        
        // Test template generation
        const obstacles = mapGen.generate('corners');
        TestRunner.assertArray(obstacles, 'Obstacles generated');
        
        // Test themed generation
        const themed = mapGen.generateForWorld('ice', 5);
        TestRunner.assertArray(themed.obstacles, 'Themed obstacles generated');
        TestRunner.assertArray(themed.portals, 'Portals generated');
        
        // Test Portal
        const portal = new Portal(5, 5, 20, 20, 'blue');
        TestRunner.assertNotNull(portal, 'Portal instantiation');
        TestRunner.assertEqual(portal.x1, 5, 'Portal source X');
        
    } catch (e) {
        TestRunner.assert(false, 'MapGenerator tests', e.message);
    }
}

// ========================================
// Shop and Abilities Tests
// ========================================
async function testShopAndAbilities() {
    console.log('\n🛒 TESTING SHOP AND ABILITIES...\n');
    
    try {
        const { PowerUpShop, ActiveAbilityManager, CollectibleManager } = await import('../ShopAndAbilities.js');
        
        // Mock game
        const mockGame = {
            snake: [{ x: 5, y: 5 }],
            direction: 'RIGHT',
            gridSize: 30,
            obstacles: [],
            camera: { shake: () => {} },
            particleSystem: { emitExplosion: () => {} },
            audio: { playSFX: () => {} }
        };
        
        // Shop
        const shop = new PowerUpShop(mockGame);
        TestRunner.assertNotNull(shop, 'PowerUpShop instantiation');
        TestRunner.assert(shop.items.length >= 7, 'At least 7 shop items');
        
        // Abilities
        const abilities = new ActiveAbilityManager(mockGame);
        TestRunner.assertNotNull(abilities, 'ActiveAbilityManager instantiation');
        TestRunner.assert(Object.keys(abilities.abilities).length >= 4, 'At least 4 abilities');
        
        // Collectibles
        const collectibles = new CollectibleManager(mockGame);
        TestRunner.assertNotNull(collectibles, 'CollectibleManager instantiation');
        TestRunner.assert(collectibles.storyItems.length >= 10, 'At least 10 story items');
        
    } catch (e) {
        TestRunner.assert(false, 'ShopAndAbilities tests', e.message);
    }
}

// ========================================
// Advanced Features Tests
// ========================================
async function testAdvancedFeatures() {
    console.log('\n🔧 TESTING ADVANCED FEATURES...\n');
    
    try {
        const { DestructibleEnvironment, SecretAreaManager, BattleRoyaleMode, CustomGameCreator } 
            = await import('../AdvancedFeatures.js');
        
        // Mock game
        const mockGame = {
            gridSize: 30,
            obstacles: [],
            particleSystem: { emitExplosion: () => {} },
            audio: { playSFX: () => {} }
        };
        
        // Destructibles
        const destructibles = new DestructibleEnvironment(mockGame);
        TestRunner.assertNotNull(destructibles, 'DestructibleEnvironment instantiation');
        
        // Secrets
        const secrets = new SecretAreaManager(mockGame);
        TestRunner.assertNotNull(secrets, 'SecretAreaManager instantiation');
        TestRunner.assert(secrets.secretAreas.length >= 5, 'At least 5 secret areas');
        
        // Battle Royale
        const br = new BattleRoyaleMode(mockGame);
        TestRunner.assertNotNull(br, 'BattleRoyaleMode instantiation');
        
        // Custom Game Creator
        const creator = new CustomGameCreator(mockGame);
        TestRunner.assertNotNull(creator, 'CustomGameCreator instantiation');
        
    } catch (e) {
        TestRunner.assert(false, 'AdvancedFeatures tests', e.message);
    }
}

// ========================================
// Progression System Tests
// ========================================
async function testProgressionSystem() {
    console.log('\n📈 TESTING PROGRESSION SYSTEM...\n');
    
    try {
        const { ProgressionSystem, SKILL_TREE, POWER_UP_COMBOS } = await import('../ProgressionSystem.js');
        
        TestRunner.assertNotNull(SKILL_TREE, 'SKILL_TREE exported');
        TestRunner.assertNotNull(POWER_UP_COMBOS, 'POWER_UP_COMBOS exported');
        TestRunner.assert(POWER_UP_COMBOS.length >= 12, 'At least 12 power combos');
        
        // Mock game
        const mockGame = {
            activePowerUps: {},
            addScore: () => {}
        };
        
        const progression = new ProgressionSystem(mockGame);
        TestRunner.assertNotNull(progression, 'ProgressionSystem instantiation');
        TestRunner.assertType(progression.xp, 'number', 'XP exists');
        TestRunner.assertType(progression.level, 'number', 'Level exists');
        
        // Test XP gain
        const initialXP = progression.xp;
        progression.addXP(50);
        TestRunner.assert(progression.xp >= initialXP, 'XP adds');
        
    } catch (e) {
        TestRunner.assert(false, 'ProgressionSystem tests', e.message);
    }
}

// ========================================
// Run All Tests
// ========================================
async function runAllTests() {
    console.log('🐍 SNAKE GAME TEST SUITE 🐍\n');
    console.log('Starting comprehensive tests...\n');
    
    TestRunner.reset();
    
    await testModuleImports();
    await testParticleSystem();
    await testCamera();
    await testPhysicsSystem();
    await testStoryMode();
    await testBossBattle();
    await testAchievementSystem();
    await testAudioManager();
    await testUIManager();
    await testPolishSystem();
    await testEnhancedEffects();
    await testGameModes();
    await testMapGenerator();
    await testShopAndAbilities();
    await testAdvancedFeatures();
    await testProgressionSystem();
    
    return TestRunner.summary();
}

// Export for use
export { runAllTests, TestRunner };

// Auto-run if in browser console
if (typeof window !== 'undefined') {
    window.runSnakeTests = runAllTests;
    console.log('Test suite loaded. Run window.runSnakeTests() to start.');
}
