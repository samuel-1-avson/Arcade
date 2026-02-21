/**
 * Roguelike AAA-Grade - Enhanced Dungeon Crawler
 */
import { GameEngine, GameState } from '../../js/engine/GameEngine.js';
import { hubSDK } from '../../js/engine/HubSDK.js';
import { soundEffects } from '../../js/engine/SoundEffects.js';
import { randomInt } from '../../js/utils/math.js';
import { StoryMode, STORY, LEVEL_CONFIG } from './StoryMode.js';
import { GameModes, GAME_MODES } from './GameModes.js';
import { AchievementManager } from './Achievements.js';
import { ICONS } from './Icons.js';

// SVG Icons for industrial aesthetic (Managed in Icons.js)


// Expanded map configuration
const TILE_SIZE = 32;
const MAP_WIDTH = 30;
const MAP_HEIGHT = 20;

const TILE = { WALL: '#', FLOOR: '.', STAIRS: '>', DOOR: '+', TRAP: '^', CHEST: 'C', ALTAR: 'A' };

const MONSTERS = {
    rat: { char: 'r', name: 'Rat', hp: 12, atk: 3, def: 1, xp: 5, color: '#8b4513', tier: 1, speed: 1.2, behavior: 'chase' },
    bat: { char: 'b', name: 'Bat', hp: 10, atk: 4, def: 0, xp: 4, color: '#666', tier: 1, speed: 1.5, behavior: 'erratic' },
    skeleton: { char: 's', name: 'Skeleton', hp: 18, atk: 6, def: 2, xp: 10, color: '#ddd', tier: 1, speed: 0.8, behavior: 'patrol' },
    goblin: { char: 'g', name: 'Goblin', hp: 25, atk: 8, def: 3, xp: 15, color: '#0a0', tier: 2, speed: 1.0, behavior: 'smart' },
    ghost: { char: 'G', name: 'Ghost', hp: 15, atk: 10, def: 0, xp: 20, color: '#adf', tier: 2, speed: 0.7, behavior: 'phase', phase: true },
    orc: { char: 'o', name: 'Orc', hp: 40, atk: 12, def: 5, xp: 25, color: '#060', tier: 3, speed: 0.9, behavior: 'charge' },
    mage: { char: 'M', name: 'Dark Mage', hp: 28, atk: 15, def: 2, xp: 35, color: '#80f', tier: 3, speed: 0.6, behavior: 'ranged', range: 5 },
    mimic: { char: '?', name: 'Mimic', hp: 35, atk: 18, def: 6, xp: 40, color: '#fc0', tier: 3, speed: 0, behavior: 'ambush' },
    troll: { char: 'T', name: 'Troll', hp: 60, atk: 14, def: 8, xp: 45, color: '#363', tier: 4, speed: 0.7, behavior: 'chase', regen: 2 },
    necro: { char: 'N', name: 'Necromancer', hp: 40, atk: 12, def: 4, xp: 50, color: '#406', tier: 4, speed: 0.5, behavior: 'summon' },
    dragon: { char: 'D', name: 'Dragon', hp: 120, atk: 25, def: 12, xp: 150, color: '#f00', tier: 5, speed: 0.8, behavior: 'boss', breath: true }
};

const ITEM_TYPES = {
    potion: { char: '!', color: '#f0f', name: 'Health Potion' },
    gold: { char: '$', color: '#fd0', name: 'Gold' },
    weapon: { char: '/', color: '#8ff', name: 'Weapon' },
    armor: { char: '[', color: '#aaf', name: 'Armor' },
    scroll: { char: '?', color: '#ff8', name: 'Scroll' },
    food: { char: '%', color: '#b62', name: 'Food' },
    key: { char: 'k', color: '#fc0', name: 'Key' },
    ring: { char: '=', color: '#f80', name: 'Ring' }
};

const SCROLL_EFFECTS = {
    fire: { name: 'Scroll of Fire', buff: 'fire_enchant', iconKey: 'fire' },
    shield: { name: 'Scroll of Protection', buff: 'shield', iconKey: 'shield' },
    regen: { name: 'Scroll of Regeneration', buff: 'regen', iconKey: 'heart' },
    haste: { name: 'Scroll of Speed', buff: 'haste', iconKey: 'lightning' },
    reveal: { name: 'Scroll of Reveal', special: 'reveal_map', iconKey: 'eye' },
    teleport: { name: 'Scroll of Teleport', special: 'random_teleport', iconKey: 'spark' },
    fear: { name: 'Scroll of Fear', special: 'fear_enemies', iconKey: 'skull' },
    lightning: { name: 'Scroll of Lightning', special: 'lightning_aoe', iconKey: 'lightning' }
};

const POWERUPS = {
    fire_enchant: { name: 'Fire Enchant', iconKey: 'fire', duration: 10, effect: { bonusDamage: 5, type: 'fire' } },
    shield: { name: 'Shield', iconKey: 'shield', duration: 8, effect: { bonusDef: 10 } },
    regen: { name: 'Regeneration', iconKey: 'heart', duration: 15, effect: { regenPerTurn: 2 } },
    haste: { name: 'Haste', iconKey: 'lightning', duration: 12, effect: { doubleAction: true } },
    invisibility: { name: 'Invisibility', iconKey: 'ghost', duration: 6, effect: { invisible: true } },
    lifesteal: { name: 'Lifesteal', iconKey: 'skull', duration: 10, effect: { lifesteal: 0.2 } },
    crit: { name: 'Critical', iconKey: 'explosion', duration: 8, effect: { critChance: 0.3, critMult: 2 } }
};

const CLASSES = {
    warrior: { name: 'Warrior', iconKey: 'hero_warrior', hp: 150, atk: 14, def: 10, skills: ['power_strike', 'shield_bash', 'war_cry'] },
    rogue: { name: 'Rogue', iconKey: 'hero_rogue', hp: 100, atk: 18, def: 5, skills: ['backstab', 'smoke_bomb', 'steal'] },
    mage: { name: 'Mage', iconKey: 'hero_mage', hp: 80, atk: 10, def: 4, mana: 100, skills: ['fireball', 'frost_nova', 'teleport'] }
};

const SKILLS = {
    power_strike: { name: 'Power Strike', iconKey: 'explosion', cd: 5, dmgMult: 2.5 },
    shield_bash: { name: 'Shield Bash', iconKey: 'shield', cd: 4, stun: 2 },
    war_cry: { name: 'War Cry', iconKey: 'megaphone', cd: 10, buff: { atk: 8, dur: 5 } },
    backstab: { name: 'Backstab', iconKey: 'dagger', cd: 3, dmgMult: 3 },
    smoke_bomb: { name: 'Smoke Bomb', iconKey: 'smoke', cd: 8, invis: 4 },
    steal: { name: 'Steal', iconKey: 'pouch', cd: 6 },
    fireball: { name: 'Fireball', iconKey: 'fire', cd: 4, cost: 15, dmg: 30, range: 6 },
    frost_nova: { name: 'Frost Nova', iconKey: 'frost', cd: 6, cost: 20, slow: 3, aoe: 3 },
    teleport: { name: 'Teleport', iconKey: 'spark', cd: 8, cost: 25, range: 8 }
};

const THEMES = {
    crypt: { wall: '#4a4a4a', floor: '#1a1a1a', accent: '#666' },
    warrens: { wall: '#5a4020', floor: '#2a2010', accent: '#8b4513' },
    ruins: { wall: '#555566', floor: '#222233', accent: '#7777aa' },
    volcanic: { wall: '#4a1a0a', floor: '#1a0a00', accent: '#ff4400' },
    abyss: { wall: '#220033', floor: '#0a000a', accent: '#aa00ff' }
};

// Helper function to get icon SVG
function getIcon(key) {
    return ICONS[key] || '';
}


// A* Pathfinding
class Pathfinder {
    constructor(map) { this.map = map; }
    
    findPath(sx, sy, ex, ey) {
        const open = [{ x: sx, y: sy, g: 0, h: 0, f: 0, p: null }];
        const closed = new Set();
        const key = (x, y) => `${x},${y}`;
        
        while (open.length > 0) {
            open.sort((a, b) => a.f - b.f);
            const cur = open.shift();
            
            if (cur.x === ex && cur.y === ey) {
                const path = [];
                let node = cur;
                while (node.p) { path.unshift({ x: node.x, y: node.y }); node = node.p; }
                return path;
            }
            
            closed.add(key(cur.x, cur.y));
            
            for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
                const nx = cur.x + dx, ny = cur.y + dy;
                if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
                if (this.map[ny]?.[nx] === TILE.WALL) continue;
                if (closed.has(key(nx, ny))) continue;
                
                const g = cur.g + 1;
                const h = Math.abs(ex - nx) + Math.abs(ey - ny);
                const existing = open.find(n => n.x === nx && n.y === ny);
                
                if (!existing || g < existing.g) {
                    if (existing) open.splice(open.indexOf(existing), 1);
                    open.push({ x: nx, y: ny, g, h, f: g + h, p: cur });
                }
            }
        }
        return [];
    }
}

class Roguelike extends GameEngine {
    constructor() {
        super({ canvasId: 'game-canvas', gameId: 'roguelike', width: MAP_WIDTH * TILE_SIZE, height: MAP_HEIGHT * TILE_SIZE });
        console.log('Roguelike Constructor Started, hubSDK:', hubSDK);
        
        // Hub Integration
        this.hub = hubSDK;
        this.hub.init({ gameId: 'roguelike' });
        
        this.storyMode = new StoryMode(this);
        this.gameModes = new GameModes(this);
        this.achievements = new AchievementManager(this);
        
        this.playerClass = 'warrior';
        this.player = this.createPlayer();
        this.floor = 1;
        this.map = [];
        this.rooms = [];
        this.monsters = [];
        this.items = [];
        this.decorations = [];
        this.interactables = [];
        this.torches = [];
        this.particles = [];
        this.floatingTexts = [];
        this.visible = [];
        this.explored = [];
        this.theme = THEMES.crypt;
        this.playerTurn = true;
        this.animating = false;
        this.playerAnim = { x: 0, y: 0, tx: 0, ty: 0, t: 0 };
        this.buffs = [];
        this.cooldowns = {};
        this.showMinimap = false;
        this.lightTime = 0;
        
        this.preloadSprites();
        this.setupUI();
        this.showMainMenu();
    }

    preloadSprites() {
        this.baseSprites = {};
        this.tintCache = {};
        
        // Map entity types to icon keys
        this.iconMapping = {
            // Monsters
            rat: 'demon', bat: 'demon', skeleton: 'skull', goblin: 'demon',
            ghost: 'ghost', orc: 'boss', mage: 'wand', mimic: 'chest',
            troll: 'boss', necro: 'skull', dragon: 'boss',
            // Items
            potion: 'heart', gold: 'trophy', weapon: 'sword',
            armor: 'shield', scroll: 'scroll', food: 'pouch',
            key: 'lock', ring: 'diamond'
        };

        Object.entries(ICONS).forEach(([key, svg]) => {
            const img = new Image();
            // Inject dimensions and replace colors
            let colored = svg.replace('<svg ', '<svg width="24" height="24" ');
            colored = colored.replace(/currentColor/g, '#ffffff').replace(/stroke="none"/g, 'stroke="#ffffff"'); 
            const blob = new Blob([colored], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(blob);
            img.src = url;
            this.baseSprites[key] = img;
        });
    }

    getTintedSprite(key, color) {
        if (!this.baseSprites[key] || !this.baseSprites[key].complete) return null;
        if (!key) return null;
        
        const cacheKey = `${key}-${color}`;
        if (this.tintCache[cacheKey]) return this.tintCache[cacheKey];
        
        const img = this.baseSprites[key];
        if (img.width === 0) return null; // Not loaded

        const canvas = document.createElement('canvas');
        canvas.width = TILE_SIZE;
        canvas.height = TILE_SIZE;
        const ctx = canvas.getContext('2d');
        
        // Draw image centered with padding
        const p = 4;
        ctx.drawImage(img, p, p, TILE_SIZE - p*2, TILE_SIZE - p*2);
        
        // Tint using source-in
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        
        this.tintCache[cacheKey] = canvas;
        return canvas;
    }

    drawSprite(ctx, key, x, y, color, scale = 1) {
        const sprite = this.getTintedSprite(key, color);
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        const cx = px + TILE_SIZE/2;
        const cy = py + TILE_SIZE/2;
        
        if (sprite) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            const size = TILE_SIZE * scale;
            const offset = (TILE_SIZE - size) / 2;
            ctx.drawImage(sprite, px + offset, py + offset, size, size);
            ctx.shadowBlur = 0;
        } else {
            // ASCII Character Fallback (Classic Roguelike Style)
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.font = `bold ${Math.floor(20 * scale)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            let char = '?';
            
            // Map keys to characters
            if (key?.includes('hero')) char = '@';
            else if (key?.includes('demon')) char = '&';
            else if (key?.includes('boss')) char = 'W'; // Warlord
            else if (key?.includes('skull')) char = 'z'; // Zombie/Skeleton
            else if (key?.includes('ghost')) char = 'G';
            else if (key === 'chest') char = '=';
            else if (key === 'shrine') char = 'A'; // Altar
            else if (key === 'map') char = '>';
            else if (key === 'heart' || key === 'potion') char = '!';
            else if (key === 'sword') char = '/';
            else if (key === 'shield') char = '[';
            else if (key === 'trophy' || key === 'pouch') char = '$';
            else if (key === 'scroll') char = '~';
            else if (key === 'key') char = 'k';
            else if (key === 'diamond') char = '*';
            else if (key === 'wand') char = '/';
            else char = key ? key.charAt(0).toUpperCase() : '?';

            // Special handling to avoid '?' if possible
            if (char === '?' && key) char = key.charAt(0).toUpperCase();

            ctx.fillText(char, cx, cy);
            ctx.shadowBlur = 0;
        }
    }

    createPlayer(classId = 'warrior') {
        const c = CLASSES[classId] || CLASSES.warrior;
        return {
            x: 0, y: 0, hp: c.hp, maxHp: c.hp, atk: c.atk, def: c.def,
            level: 1, xp: 0, xpToLevel: 15, gold: 0,
            weapon: null, armor: null,
            mana: c.mana || 0, maxMana: c.mana || 0,
            class: classId, skills: c.skills || [],
            invisible: 0, potions: 2
        };
    }

    setupUI() {
        document.getElementById('menu-btn')?.addEventListener('click', () => this.showMainMenu());
        
        // SPA Back Button
        document.getElementById('rogue-back-btn')?.addEventListener('click', () => {
            if (window.GameBridge) {
                window.GameBridge.exitGame();
            } else {
                window.location.href = '../../index.html';
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (this.animating) return;
            if (this.state !== GameState.PLAYING || !this.playerTurn) return;
            
            let dx = 0, dy = 0;
            switch (e.code) {
                case 'ArrowUp': case 'KeyW': dy = -1; break;
                case 'ArrowDown': case 'KeyS': dy = 1; break;
                case 'ArrowLeft': case 'KeyA': dx = -1; break;
                case 'ArrowRight': case 'KeyD': dx = 1; break;
                case 'Space': this.pickupItem(); return;
                case 'Period': this.descendStairs(); return;
                case 'KeyM': this.toggleMinimap(); return;
                case 'KeyI': this.toggleInventory(); return;
                case 'Digit1': case 'Digit2': case 'Digit3':
                    this.useSkill(parseInt(e.code.replace('Digit', '')) - 1); return;
                case 'KeyQ': this.usePotion(); return;
            }
            if (dx || dy) { e.preventDefault(); this.movePlayer(dx, dy); }
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.animating || this.state !== GameState.PLAYING || !this.playerTurn) return;
            const r = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - r.left) * (this.canvas.width / r.width) / TILE_SIZE);
            const y = Math.floor((e.clientY - r.top) * (this.canvas.height / r.height) / TILE_SIZE);
            const dx = Math.sign(x - this.player.x), dy = Math.sign(y - this.player.y);
            if (Math.abs(x - this.player.x) <= 1 && Math.abs(y - this.player.y) <= 1) this.movePlayer(dx, dy);
        });
    }

    showMainMenu() {
        this.state = GameState.MENU;
        const o = document.getElementById('game-overlay');
        if (o) {
            o.classList.remove('hidden');
            o.innerHTML = `
                <div class="overlay-content">
                    <h1 class="overlay-title">${getIcon('sword')} ROGUELIKE</h1>
                    <p class="overlay-subtitle">Descend into darkness. Conquer the abyss.</p>
                    <div class="overlay-buttons">
                        <button class="menu-btn primary" onclick="window.game?.showClassSelect()">
                            <span class="btn-icon">${getIcon('play')}</span>
                            <span class="btn-text">NEW GAME</span>
                        </button>
                        <button class="menu-btn" onclick="window.game?.storyMode?.showLevelSelect()">
                            <span class="btn-icon">${getIcon('scroll')}</span>
                            <span class="btn-text">STORY MODE</span>
                        </button>
                        <button class="menu-btn" onclick="window.game?.gameModes?.showModeSelect()">
                            <span class="btn-icon">${getIcon('gamepad')}</span>
                            <span class="btn-text">GAME MODES</span>
                        </button>
                        <button class="menu-btn" onclick="window.game?.achievements?.showAchievementGallery()">
                            <span class="btn-icon">${getIcon('trophy')}</span>
                            <span class="btn-text">ACHIEVEMENTS</span>
                        </button>
                    </div>
                </div>`;
        }
    }

    showClassSelect() {
        const o = document.getElementById('game-overlay');
        if (!o) return;
        o.innerHTML = `
            <div class="overlay-content">
                <h1 class="overlay-title">Choose Your Hero</h1>
                <div class="class-grid">
                    ${Object.entries(CLASSES).map(([id, c]) => `
                        <div class="class-card" onclick="window.game.selectClass('${id}')">
                            <span class="class-icon">${getIcon(c.iconKey)}</span>
                            <span class="class-name">${c.name}</span>
                            <span class="class-stats">HP: ${c.hp} | ATK: ${c.atk} | DEF: ${c.def}</span>
                            <div class="class-skills">
                                ${c.skills.map(s => `
                                    <div class="skill-preview-icon" title="${SKILLS[s]?.name}">
                                        ${getIcon(SKILLS[s]?.iconKey)}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="menu-btn" onclick="window.game.showMainMenu()"><span class="btn-icon">←</span><span class="btn-text">BACK</span></button>
            </div>`;
    }


    selectClass(id) {
        this.playerClass = id;
        this.player = this.createPlayer(id);
        // Apply any pre-set mode (default to classic if not set)
        if (!this.gameModes.modeData?.name) {
            this.gameModes.setMode(GAME_MODES.CLASSIC);
        }
        this.applyModeToPlayer();
        this.reset();
        this.start();
    }

    startStoryLevel(config, chapter) {
        // Store story mode config
        this.storyConfig = config;
        this.storyChapter = chapter;
        this.isStoryMode = true;
        
        // Apply chapter theme
        if (chapter && THEMES[chapter.theme]) {
            this.theme = THEMES[chapter.theme];
        }
        
        // Set floor to story level floor count
        this.storyFloorCount = config.floors || 1;
        this.storyCurrentFloor = 1;
        
        // Show class selection for story mode
        this.showClassSelect();
    }

    startStoryGame() {
        // Called after class selection in story mode
        this.player = this.createPlayer(this.playerClass);
        this.floor = 1;
        this.generateStoryFloor();
        this.start();
    }

    generateStoryFloor() {
        // Generate floor with story-specific settings
        this.generateFloor();
        
        const config = this.storyConfig;
        const chapter = this.storyChapter;
        
        if (!config || !chapter) return;
        
        // Check if this is a boss level
        if (config.isBossLevel && this.storyCurrentFloor >= this.storyFloorCount) {
            this.spawnStoryBoss(chapter.boss);
        }
        
        // Apply vision range from chapter modifiers
        if (chapter.modifiers?.visionRange) {
            this.visionRange = chapter.modifiers.visionRange;
        }
    }

    spawnStoryBoss(bossData) {
        if (!bossData) return;
        
        const room = this.rooms[this.rooms.length - 1];
        const x = room.x + Math.floor(room.w / 2);
        const y = room.y + Math.floor(room.h / 2);
        
        this.monsters.push({
            x, y,
            type: bossData.type,
            char: bossData.char,
            name: bossData.name,
            hp: bossData.hp,
            maxHp: bossData.hp,
            atk: bossData.atk,
            def: bossData.def,
            xp: bossData.xp,
            color: bossData.color,
            tier: 5,
            speed: 0.8,
            behavior: 'boss',
            isBoss: true,
            abilities: bossData.abilities || [],
            patrolPath: [{ x, y }],
            patrolIndex: 0,
            alertLevel: 100,
            lastKnownX: 0,
            lastKnownY: 0,
            anim: { x, y, tx: x, ty: y, t: 1 }
        });
        
        this.log(`${bossData.name} appears!`, 'crit');
    }

    startWithMode(mode) {
        // Hide mode select modal
        const modal = document.getElementById('mode-select-modal');
        if (modal) modal.style.display = 'none';
        
        // Set mode if not already set
        if (this.gameModes.currentMode !== mode) {
            this.gameModes.setMode(mode);
        }
        
        // Show class selection
        this.showClassSelect();
    }

    applyModeToPlayer() {
        const rules = this.gameModes.modeData?.rules;
        if (!rules) return;
        
        // Apply Glass Cannon challenge
        if (rules.maxHp) {
            this.player.maxHp = rules.maxHp;
            this.player.hp = rules.maxHp;
        }
        
        // Apply damage multiplier
        if (rules.damageMultiplier) {
            this.player.damageMultiplier = rules.damageMultiplier;
        }
        
        // Apply no heal on level up (survival)
        if (rules.noHealOnLevelUp) {
            this.player.noHealOnLevelUp = true;
        }
        
        // Initialize turn counter for speedrun
        if (rules.turnLimit) {
            this.floorTurns = 0;
            this.turnLimit = rules.turnLimit;
            this.turnPenalty = rules.turnPenalty || 5;
        }
        
        // Vision range limitation
        if (rules.visionRange) {
            this.visionRange = rules.visionRange;
        } else {
            this.visionRange = 8; // Default
        }
    }

    getModeSpawnRate(type) {
        const rules = this.gameModes.modeData?.rules;
        if (!rules) return 1.0;
        
        if (type === 'item') return rules.itemSpawnRate || 1.0;
        if (type === 'monster') return rules.monsterSpawnRate || 1.0;
        return 1.0;
    }

    onReset() {
        this.player = this.createPlayer(this.playerClass);
        this.applyModeToPlayer();
        this.floor = 1;
        this.floorTurns = 0;
        this.particles = [];
        this.floatingTexts = [];
        this.buffs = [];
        this.cooldowns = [];
        this.generateFloor();
        this.updateUI();
    }

    onStart() {
        const o = document.getElementById('game-overlay');
        if (o) o.classList.add('hidden');
        this.log('You descend into darkness...', 'info');
        this.updateClassDisplay();
    }

    generateFloor() {
        this.map = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(TILE.WALL));
        this.explored = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(false));
        this.visible = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(false));
        this.monsters = [];
        this.items = [];
        this.decorations = [];
        this.interactables = [];
        this.torches = [];
        this.rooms = [];
        
        // Generate rooms
        const numRooms = 8 + Math.floor(this.floor / 2);
        for (let i = 0; i < numRooms * 30 && this.rooms.length < numRooms; i++) {
            const w = randomInt(5, 10), h = randomInt(4, 8);
            const x = randomInt(1, MAP_WIDTH - w - 1), y = randomInt(1, MAP_HEIGHT - h - 1);
            if (!this.rooms.some(r => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y)) {
                this.rooms.push({ x, y, w, h, type: this.getRoomType() });
                this.carveRoom(x, y, w, h);
            }
        }
        
        // Connect rooms
        for (let i = 1; i < this.rooms.length; i++) {
            const a = this.rooms[i - 1], b = this.rooms[i];
            this.carveCorridor(a.x + Math.floor(a.w / 2), a.y + Math.floor(a.h / 2),
                              b.x + Math.floor(b.w / 2), b.y + Math.floor(b.h / 2));
        }
        
        // Place player
        const start = this.rooms[0];
        this.player.x = start.x + Math.floor(start.w / 2);
        this.player.y = start.y + Math.floor(start.h / 2);
        this.playerAnim = { x: this.player.x, y: this.player.y, tx: this.player.x, ty: this.player.y, t: 1 };
        
        // Place stairs
        const end = this.rooms[this.rooms.length - 1];
        this.map[end.y + Math.floor(end.h / 2)][end.x + Math.floor(end.w / 2)] = TILE.STAIRS;
        
        // Spawn content
        this.spawnMonsters();
        this.spawnItems();
        this.addDecorations();
        this.updateVisibility();
    }

    getRoomType() {
        const r = Math.random();
        if (r < 0.1) return 'treasure';
        if (r < 0.2) return 'trap';
        if (r < 0.25) return 'arena';
        return 'normal';
    }

    carveRoom(x, y, w, h) {
        for (let py = y; py < y + h; py++)
            for (let px = x; px < x + w; px++)
                if (py >= 0 && py < MAP_HEIGHT && px >= 0 && px < MAP_WIDTH)
                    this.map[py][px] = TILE.FLOOR;
    }

    carveCorridor(x1, y1, x2, y2) {
        let x = x1, y = y1;
        while (x !== x2 || y !== y2) {
            if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT)
                this.map[y][x] = TILE.FLOOR;
            if (Math.random() < 0.5 && x !== x2) x += x < x2 ? 1 : -1;
            else if (y !== y2) y += y < y2 ? 1 : -1;
            else if (x !== x2) x += x < x2 ? 1 : -1;
        }
        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) this.map[y][x] = TILE.FLOOR;
    }

    spawnMonsters() {
        const rules = this.gameModes.modeData?.rules || {};
        const monsterRate = rules.monsterSpawnRate || 1.0;
        const monsterMult = rules.monsterMultiplier || 1;
        
        const baseCount = 5 + this.floor * 2;
        const count = Math.floor(baseCount * monsterRate * monsterMult);
        const maxTier = Math.min(Math.floor(this.floor / 3) + 1, 5);
        const types = Object.entries(MONSTERS).filter(([_, m]) => m.tier <= maxTier).map(([k]) => k);
        
        // Check for endless mode boss spawn
        if (this.gameModes.shouldSpawnBoss(this.floor)) {
            this.spawnBoss();
        }
        
        // Endless mode difficulty scaling
        const endlessDifficulty = this.gameModes.getEndlessDifficulty(this.floor);
        
        for (let i = 0; i < count; i++) {
            const room = this.rooms[randomInt(1, this.rooms.length - 1)];
            const x = randomInt(room.x + 1, room.x + room.w - 2);
            const y = randomInt(room.y + 1, room.y + room.h - 2);
            
            if (this.map[y]?.[x] === TILE.FLOOR && !this.getMonsterAt(x, y)) {
                const type = types[randomInt(0, types.length - 1)];
                const t = MONSTERS[type];
                const difficulty = (1 + this.floor * 0.1) * endlessDifficulty;
                
                // Elite monster check
                const isElite = this.gameModes.shouldSpawnElite(this.floor);
                const eliteMult = isElite ? 1.5 : 1.0;
                
                this.monsters.push({
                    x, y, type, ...t,
                    hp: Math.floor(t.hp * difficulty * eliteMult),
                    maxHp: Math.floor(t.hp * difficulty * eliteMult),
                    atk: Math.floor(t.atk * difficulty * eliteMult),
                    isElite,
                    patrolPath: this.generatePatrolPath(x, y, room),
                    patrolIndex: 0, alertLevel: 0, lastKnownX: 0, lastKnownY: 0,
                    anim: { x, y, tx: x, ty: y, t: 1 }
                });
            }
        }
    }
    
    spawnBoss() {
        const room = this.rooms[this.rooms.length - 1];
        const x = room.x + Math.floor(room.w / 2);
        const y = room.y + Math.floor(room.h / 2);
        
        const bossFloor = Math.floor(this.floor / 5);
        const bossTypes = ['skeleton_king', 'goblin_warlord', 'stone_golem', 'fire_drake', 'demon_lord'];
        const bossType = bossTypes[Math.min(bossFloor - 1, bossTypes.length - 1)] || 'dragon';
        const t = MONSTERS.dragon; // Use dragon as template
        
        this.monsters.push({
            x, y, type: 'boss',
            char: 'B', name: `Floor ${this.floor} Boss`,
            hp: 100 + this.floor * 20, maxHp: 100 + this.floor * 20,
            atk: 15 + this.floor * 2, def: 8 + this.floor,
            xp: 100 * this.floor, color: '#ff0',
            tier: 5, speed: 0.8, behavior: 'boss',
            isBoss: true,
            patrolPath: [{ x, y }],
            patrolIndex: 0, alertLevel: 100, lastKnownX: 0, lastKnownY: 0,
            anim: { x, y, tx: x, ty: y, t: 1 }
        });
        
        this.log(`A powerful boss appears on floor ${this.floor}!`, 'crit');
    }

    generatePatrolPath(x, y, room) {
        const path = [{ x, y }];
        for (let i = 0; i < 3; i++) {
            path.push({
                x: randomInt(room.x + 1, room.x + room.w - 2),
                y: randomInt(room.y + 1, room.y + room.h - 2)
            });
        }
        return path;
    }

    spawnItems() {
        const rules = this.gameModes.modeData?.rules || {};
        const itemRate = rules.itemSpawnRate || 1.0;
        
        for (const room of this.rooms) {
            const mult = room.type === 'treasure' ? 3 : 1;
            
            // Potions (skip if noPotions is true)
            if (!rules.noPotions && Math.random() < 0.3 * mult * itemRate) {
                const x = randomInt(room.x + 1, room.x + room.w - 2);
                const y = randomInt(room.y + 1, room.y + room.h - 2);
                if (this.map[y]?.[x] === TILE.FLOOR)
                    this.items.push({ x, y, type: 'potion', value: 30 + this.floor * 5 });
            }
            
            // Gold (apply gold multiplier)
            const goldMult = rules.goldMultiplier || 1.0;
            if (Math.random() < 0.5 * mult * itemRate) {
                const x = randomInt(room.x + 1, room.x + room.w - 2);
                const y = randomInt(room.y + 1, room.y + room.h - 2);
                if (this.map[y]?.[x] === TILE.FLOOR)
                    this.items.push({ x, y, type: 'gold', value: Math.floor(randomInt(10, 25) * this.floor * goldMult) });
            }
            
            // Weapons (skip if noWeapons is true)
            if (!rules.noWeapons && Math.random() < 0.12 * mult * itemRate) {
                const x = randomInt(room.x + 1, room.x + room.w - 2);
                const y = randomInt(room.y + 1, room.y + room.h - 2);
                if (this.map[y]?.[x] === TILE.FLOOR) {
                    const bonus = randomInt(2, 5) + Math.floor(this.floor / 2);
                    this.items.push({ x, y, type: 'weapon', value: bonus, name: `+${bonus} Blade` });
                }
            }
            
            // Scrolls
            if (Math.random() < 0.15 * mult * itemRate) {
                const x = randomInt(room.x + 1, room.x + room.w - 2);
                const y = randomInt(room.y + 1, room.y + room.h - 2);
                if (this.map[y]?.[x] === TILE.FLOOR) {
                    const scrollKeys = Object.keys(SCROLL_EFFECTS);
                    const scrollType = scrollKeys[randomInt(0, scrollKeys.length - 1)];
                    this.items.push({ x, y, type: 'scroll', scrollType, ...SCROLL_EFFECTS[scrollType] });
                }
            }
            
            // Armor (skip if noWeapons - treat as equipment ban)
            if (!rules.noWeapons && Math.random() < 0.08 * mult * itemRate) {
                const x = randomInt(room.x + 1, room.x + room.w - 2);
                const y = randomInt(room.y + 1, room.y + room.h - 2);
                if (this.map[y]?.[x] === TILE.FLOOR) {
                    const bonus = randomInt(2, 4) + Math.floor(this.floor / 3);
                    this.items.push({ x, y, type: 'armor', value: bonus, name: `+${bonus} Armor` });
                }
            }
            
            // Food items for Survival mode
            if (rules.hungerSystem && Math.random() < 0.25 * mult) {
                const x = randomInt(room.x + 1, room.x + room.w - 2);
                const y = randomInt(room.y + 1, room.y + room.h - 2);
                if (this.map[y]?.[x] === TILE.FLOOR) {
                    this.items.push({ x, y, type: 'food', value: randomInt(20, 40), name: 'Rations' });
                }
            }
        }
        
        // Spawn chests in treasure rooms
        for (const room of this.rooms.filter(r => r.type === 'treasure')) {
            const cx = room.x + Math.floor(room.w / 2);
            const cy = room.y + Math.floor(room.h / 2);
            if (this.map[cy]?.[cx] === TILE.FLOOR) {
                this.interactables.push({ x: cx, y: cy, type: 'chest', opened: false, icon: 'C' });
            }
        }
        
        // Spawn shrines in some rooms
        for (const room of this.rooms) {
            if (Math.random() < 0.08) {
                const sx = room.x + Math.floor(room.w / 2);
                const sy = room.y + Math.floor(room.h / 2);
                if (this.map[sy]?.[sx] === TILE.FLOOR && !this.interactables.find(i => i.x === sx && i.y === sy)) {
                    const shrineTypes = ['healing', 'power', 'defense', 'experience'];
                    this.interactables.push({ x: sx, y: sy, type: 'shrine', shrineType: shrineTypes[randomInt(0, 3)], used: false, icon: 'A' });
                }
            }
        }
        
        // Spawn torches for lighting
        this.torches = [];
        for (const room of this.rooms) {
            const numTorches = randomInt(1, 3);
            for (let i = 0; i < numTorches; i++) {
                const edge = randomInt(0, 3);
                let tx, ty;
                if (edge === 0) { tx = room.x; ty = randomInt(room.y, room.y + room.h - 1); }
                else if (edge === 1) { tx = room.x + room.w - 1; ty = randomInt(room.y, room.y + room.h - 1); }
                else if (edge === 2) { tx = randomInt(room.x, room.x + room.w - 1); ty = room.y; }
                else { tx = randomInt(room.x, room.x + room.w - 1); ty = room.y + room.h - 1; }
                this.torches.push({ x: tx, y: ty, flicker: Math.random() * Math.PI * 2 });
            }
        }
    }

    addDecorations() {
        const decos = ['%', 'x', '*', '.', ','];
        for (const room of this.rooms) {
            const count = randomInt(1, 4);
            for (let i = 0; i < count; i++) {
                const x = randomInt(room.x, room.x + room.w - 1);
                const y = randomInt(room.y, room.y + room.h - 1);
                if (this.map[y]?.[x] === TILE.FLOOR)
                    this.decorations.push({ x, y, char: decos[randomInt(0, decos.length - 1)] });
            }
        }
    }

    movePlayer(dx, dy) {
        if (this.player.invisible > 0) this.player.invisible--;
        
        const nx = this.player.x + dx, ny = this.player.y + dy;
        if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) return;
        if (this.map[ny][nx] === TILE.WALL) return;
        
        const m = this.getMonsterAt(nx, ny);
        if (m) {
            // Pacifist challenge: cannot attack
            const rules = this.gameModes.modeData?.rules;
            if (rules?.noAttack) {
                this.log('You cannot attack in Pacifist mode!', 'info');
                return;
            }
            this.attackMonster(m);
            this.endTurn();
            return;
        }
        
        this.player.x = nx;
        this.player.y = ny;
        this.animateMove(this.playerAnim, nx, ny, true);
        soundEffects.move?.();
        
        if (this.map[ny][nx] === TILE.TRAP) {
            const dmg = randomInt(5, 15);
            this.takeDamage(dmg);
            this.log(`Trap! -${dmg} HP`, 'damage');
            this.spawnFloatingText(nx, ny, `-${dmg}`, '#f00');
        }
        
        this.updateVisibility();
        this.endTurn();
    }

    animateMove(obj, tx, ty, isPlayer = false) {
        obj.tx = tx;
        obj.ty = ty;
        obj.t = 0;
        if (isPlayer) this.animating = true;
    }

    attackMonster(m) {
        const weaponBonus = this.player.weapon?.value || 0;
        let dmg = Math.max(1, this.player.atk + weaponBonus - m.def + randomInt(-2, 3));
        
        // Check for crit
        const critBuff = this.buffs.find(b => b.effect.critChance);
        if (critBuff && Math.random() < critBuff.effect.critChance) {
            dmg = Math.floor(dmg * (critBuff.effect.critMult || 2));
            this.log('CRITICAL HIT!', 'crit');
            this.spawnFloatingText(m.x, m.y, `💥${dmg}`, '#f80');
        } else {
            this.spawnFloatingText(m.x, m.y, `-${dmg}`, '#f44');
        }
        
        // Lifesteal
        const lsBuff = this.buffs.find(b => b.effect.lifesteal);
        if (lsBuff) {
            const heal = Math.floor(dmg * lsBuff.effect.lifesteal);
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
        }
        
        m.hp -= dmg;
        m.alertLevel = 100;
        this.log(`Hit ${m.name} for ${dmg}!`, 'damage');
        soundEffects.hit?.();
        this.shakeScreen();
        
        if (m.hp <= 0) {
            this.log(`${m.name} slain!`, 'info');
            this.monsters = this.monsters.filter(x => x !== m);
            this.gainXP(m.xp);
            this.achievements.recordKill(m.type);
            soundEffects.explosion?.();
            this.spawnParticle(m.x, m.y, 'blood');
        }
    }

    monsterTurn() {
        const pathfinder = new Pathfinder(this.map);
        
        for (const m of this.monsters) {
            if (m.regen) m.hp = Math.min(m.maxHp, m.hp + m.regen);
            
            const canSee = this.visible[m.y]?.[m.x];
            const dist = Math.hypot(this.player.x - m.x, this.player.y - m.y);
            
            if (canSee && !this.player.invisible) {
                m.alertLevel = 100;
                m.lastKnownX = this.player.x;
                m.lastKnownY = this.player.y;
            } else if (m.alertLevel > 0) {
                m.alertLevel -= 10;
            }
            
            if (m.alertLevel <= 0 && m.behavior === 'patrol' && m.patrolPath?.length) {
                const target = m.patrolPath[m.patrolIndex];
                if (m.x === target.x && m.y === target.y) {
                    m.patrolIndex = (m.patrolIndex + 1) % m.patrolPath.length;
                }
                const path = pathfinder.findPath(m.x, m.y, target.x, target.y);
                if (path.length > 0) this.moveMonster(m, path[0].x, path[0].y);
                continue;
            }
            
            if (m.alertLevel > 0) {
                if (dist <= 1.5 && !m.phase) {
                    this.monsterAttack(m);
                } else if (m.behavior === 'ranged' && m.range && dist <= m.range && canSee) {
                    this.monsterRangedAttack(m);
                } else if (m.behavior !== 'ambush') {
                    const path = pathfinder.findPath(m.x, m.y, m.lastKnownX, m.lastKnownY);
                    if (path.length > 0 && !this.getMonsterAt(path[0].x, path[0].y)) {
                        this.moveMonster(m, path[0].x, path[0].y);
                    }
                }
            }
        }
        
        this.updateBuffs();
        this.updateCooldowns();
        this.updateUI();
        this.playerTurn = true;
    }

    moveMonster(m, nx, ny) {
        if (this.map[ny]?.[nx] !== TILE.WALL && !this.getMonsterAt(nx, ny) && (nx !== this.player.x || ny !== this.player.y)) {
            m.x = nx;
            m.y = ny;
            if (m.anim) this.animateMove(m.anim, nx, ny);
        }
    }

    monsterAttack(m) {
        const armor = this.player.armor?.value || 0;
        const shieldBuff = this.buffs.find(b => b.effect.bonusDef);
        const bonusDef = shieldBuff?.effect.bonusDef || 0;
        const dmg = Math.max(1, m.atk - this.player.def - armor - bonusDef + randomInt(-2, 2));
        
        this.takeDamage(dmg);
        this.log(`${m.name} hits you for ${dmg}!`, 'damage');
        this.spawnFloatingText(this.player.x, this.player.y, `-${dmg}`, '#f00');
        soundEffects.hit?.();
    }

    monsterRangedAttack(m) {
        const dmg = Math.max(1, m.atk - this.player.def + randomInt(-2, 2));
        this.takeDamage(dmg);
        this.log(`${m.name} fires at you for ${dmg}!`, 'damage');
        this.spawnParticle(m.x, m.y, 'magic');
    }

    takeDamage(dmg) {
        this.player.hp -= dmg;
        this.flashDamage();
        if (this.player.hp <= 0) this.die();
    }

    endTurn() {
        this.playerTurn = false;
        this.floorTurns = (this.floorTurns || 0) + 1;
        
        // Survival mode: update hunger
        const rules = this.gameModes.modeData?.rules;
        if (rules?.hungerSystem) {
            const survData = this.gameModes.modeData.survivalData;
            if (survData) {
                survData.hunger -= survData.hungerDecay;
                if (survData.hunger <= 0) {
                    survData.hunger = 0;
                    this.takeDamage(survData.starveDamage);
                    this.log('Starving! Find food!', 'damage');
                }
                this.gameModes.showModeUI();
            }
        }
        
        // Speedrun mode: turn limit penalty
        if (this.turnLimit && this.floorTurns > this.turnLimit) {
            const extraTurns = this.floorTurns - this.turnLimit;
            if (extraTurns % 5 === 0) {
                this.takeDamage(this.turnPenalty);
                this.log(`Time penalty! -${this.turnPenalty} HP`, 'damage');
            }
        }
        
        this.updateUI();
        setTimeout(() => this.monsterTurn(), 150);
    }

    getMonsterAt(x, y) { return this.monsters.find(m => m.x === x && m.y === y); }

    pickupItem() {
        const item = this.items.find(i => i.x === this.player.x && i.y === this.player.y);
        if (!item) return;
        
        this.items = this.items.filter(i => i !== item);
        this.achievements.recordItemCollected();
        
        if (item.type === 'potion') {
            this.player.potions++;
            this.log(`Got potion! (${this.player.potions})`, 'pickup');
        } else if (item.type === 'gold') {
            this.player.gold += item.value;
            this.log(`+${item.value} gold!`, 'pickup');
            this.achievements.recordGoldCollected(item.value);
        } else if (item.type === 'weapon') {
            this.player.weapon = item;
            this.log(`Equipped ${item.name}!`, 'pickup');
        } else if (item.type === 'armor') {
            this.player.armor = item;
            this.log(`Equipped ${item.name}!`, 'pickup');
        } else if (item.type === 'scroll') {
            this.useScroll(item);
        } else if (item.type === 'food') {
            const rules = this.gameModes.modeData?.rules;
            if (rules?.hungerSystem) {
                this.gameModes.feedPlayer(item.value);
                this.log(`Ate ${item.name}! +${item.value} hunger`, 'heal');
                this.gameModes.showModeUI();
            } else {
                // In non-survival mode, food heals HP
                const heal = Math.min(item.value, this.player.maxHp - this.player.hp);
                this.player.hp += heal;
                this.log(`Ate ${item.name}! +${heal} HP`, 'heal');
            }
        }
        
        soundEffects.point?.();
        this.updateUI();
        
        // Check for interactables at player position
        this.interactWithObject();
    }

    useScroll(scroll) {
        this.log(`Read ${scroll.name}!`, 'pickup');
        soundEffects.powerUp?.();
        
        if (scroll.buff && POWERUPS[scroll.buff]) {
            const powerup = POWERUPS[scroll.buff];
            this.buffs.push({
                name: powerup.name,
                iconKey: powerup.iconKey,
                duration: powerup.duration,
                effect: powerup.effect
            });
            this.log(`${powerup.name} activated!`, 'info');
            this.updateBuffsUI();
        }
        
        if (scroll.special) {
            switch (scroll.special) {
                case 'reveal_map':
                    for (let y = 0; y < MAP_HEIGHT; y++)
                        for (let x = 0; x < MAP_WIDTH; x++)
                            if (this.map[y][x] !== TILE.WALL) this.explored[y][x] = true;
                    this.log('The map is revealed!', 'info');
                    break;
                case 'random_teleport':
                    const floors = [];
                    for (let y = 0; y < MAP_HEIGHT; y++)
                        for (let x = 0; x < MAP_WIDTH; x++)
                            if (this.map[y][x] === TILE.FLOOR && !this.getMonsterAt(x, y))
                                floors.push({x, y});
                    if (floors.length > 0) {
                        const dest = floors[randomInt(0, floors.length - 1)];
                        this.player.x = dest.x;
                        this.player.y = dest.y;
                        this.playerAnim = { x: dest.x, y: dest.y, tx: dest.x, ty: dest.y, t: 1 };
                        this.spawnParticle(dest.x, dest.y, 'magic');
                        this.log('You teleport!', 'info');
                    }
                    break;
                case 'fear_enemies':
                    for (const m of this.monsters) {
                        if (Math.hypot(m.x - this.player.x, m.y - this.player.y) < 8) {
                            m.alertLevel = 0;
                            m.stunned = 3;
                        }
                    }
                    this.log('Enemies flee in terror!', 'info');
                    break;
                case 'lightning_aoe':
                    for (const m of this.monsters) {
                        if (Math.hypot(m.x - this.player.x, m.y - this.player.y) < 5) {
                            const dmg = 20 + this.floor * 3;
                            m.hp -= dmg;
                            this.spawnFloatingText(m.x, m.y, `⚡${dmg}`, '#ff0');
                            this.spawnParticle(m.x, m.y, 'magic');
                            if (m.hp <= 0) {
                                this.monsters = this.monsters.filter(x => x !== m);
                                this.gainXP(m.xp);
                            }
                        }
                    }
                    this.log('Lightning strikes nearby enemies!', 'crit');
                    break;
            }
        }
    }

    interactWithObject() {
        const obj = this.interactables.find(i => i.x === this.player.x && i.y === this.player.y);
        if (!obj) return;
        
        if (obj.type === 'chest' && !obj.opened) {
            obj.opened = true;
            obj.icon = 'O';
            this.log('You open the chest!', 'pickup');
            soundEffects.powerUp?.();
            
            // Random loot
            const lootType = randomInt(0, 3);
            if (lootType === 0) {
                const gold = randomInt(30, 80) * this.floor;
                this.player.gold += gold;
                this.log(`Found ${gold} gold!`, 'pickup');
            } else if (lootType === 1) {
                this.player.potions += 2;
                this.log('Found 2 potions!', 'pickup');
            } else if (lootType === 2) {
                const bonus = randomInt(3, 6) + Math.floor(this.floor / 2);
                this.player.weapon = { type: 'weapon', value: bonus, name: `+${bonus} Legendary Blade` };
                this.log(`Found ${this.player.weapon.name}!`, 'pickup');
            } else {
                const scrollKeys = Object.keys(SCROLL_EFFECTS);
                const scrollType = scrollKeys[randomInt(0, scrollKeys.length - 1)];
                const scroll = { type: 'scroll', scrollType, ...SCROLL_EFFECTS[scrollType] };
                this.useScroll(scroll);
            }
        } else if (obj.type === 'shrine' && !obj.used) {
            obj.used = true;
            this.log(`You pray at the ${obj.shrineType} shrine...`, 'info');
            soundEffects.powerUp?.();
            
            switch (obj.shrineType) {
                case 'healing':
                    this.player.hp = this.player.maxHp;
                    this.player.maxHp += 20;
                    this.log('You feel rejuvenated! +20 Max HP', 'heal');
                    break;
                case 'power':
                    this.player.atk += 5;
                    this.log('Power surges through you! +5 ATK', 'crit');
                    break;
                case 'defense':
                    this.player.def += 4;
                    this.log('Your skin hardens! +4 DEF', 'info');
                    break;
                case 'experience':
                    this.gainXP(50 * this.floor);
                    this.log(`Wisdom flows into you! +${50 * this.floor} XP`, 'level');
                    break;
            }
        }
        this.updateUI();
    }



    usePotion() {
        if (this.player.potions <= 0) return;
        this.player.potions--;
        const heal = Math.min(50, this.player.maxHp - this.player.hp);
        this.player.hp += heal;
        this.log(`Healed ${heal} HP!`, 'heal');
        this.spawnFloatingText(this.player.x, this.player.y, `+${heal}`, '#0f0');
        this.updateUI();
    }

    useSkill(idx) {
        const skillId = this.player.skills[idx];
        if (!skillId) return;
        const skill = SKILLS[skillId];
        if (!skill) return;
        
        if (this.cooldowns[skillId] > 0) {
            this.log(`${skill.name} on cooldown!`, 'info');
            return;
        }
        
        if (skill.cost && this.player.mana < skill.cost) {
            this.log('Not enough mana!', 'info');
            return;
        }
        
        if (skill.cost) this.player.mana -= skill.cost;
        this.cooldowns[skillId] = skill.cd;
        
        this.log(`Used ${skill.name}!`, 'info');
        soundEffects.powerUp?.();
        
        if (skill.buff) {
            this.buffs.push({ name: skill.name, icon: skill.icon, duration: skill.buff.dur, effect: { atk: skill.buff.atk } });
            this.player.atk += skill.buff.atk;
        }
        
        if (skill.invis) this.player.invisible = skill.invis;
        
        if (skill.dmgMult) {
            const m = this.monsters.find(x => Math.hypot(x.x - this.player.x, x.y - this.player.y) <= 1.5);
            if (m) {
                const weaponBonus = this.player.weapon?.value || 0;
                const dmg = Math.floor((this.player.atk + weaponBonus) * skill.dmgMult);
                m.hp -= dmg;
                this.log(`${skill.name} hits for ${dmg}!`, 'crit');
                this.spawnFloatingText(m.x, m.y, `💥${dmg}`, '#f80');
                if (m.hp <= 0) {
                    this.monsters = this.monsters.filter(x => x !== m);
                    this.gainXP(m.xp);
                }
            }
        }
        
        if (skill.aoe) {
            for (const m of this.monsters) {
                if (Math.hypot(m.x - this.player.x, m.y - this.player.y) <= skill.aoe) {
                    m.stunned = skill.slow || 0;
                }
            }
        }
        
        this.updateUI();
        this.endTurn();
    }

    descendStairs() {
        if (this.map[this.player.y][this.player.x] !== TILE.STAIRS) {
            this.log('No stairs here.', 'info');
            return;
        }
        
        this.floor++;
        this.addScore(150 * this.floor);
        this.log(`Floor ${this.floor}...`, 'level');
        this.achievements.recordFloorReached(this.floor);
        soundEffects.levelUp?.();
        
        // Auto-save
        this.saveProgress();
        
        this.generateFloor();
        this.updateUI();
    }

    saveProgress() {
        if (!this.hub) return;
        const progress = {
            floor: this.floor,
            player: this.player,
            stats: this.achievements.getStats(),
            mode: this.gameModes?.currentMode || 'classic'
        };
        this.hub.saveProgress(progress);
    }

    gainXP(amount) {
        this.player.xp += amount;
        while (this.player.xp >= this.player.xpToLevel) {
            this.player.xp -= this.player.xpToLevel;
            this.player.level++;
            this.player.xpToLevel = Math.floor(this.player.xpToLevel * 1.4);
            this.player.maxHp += 15;
            this.player.hp = this.player.maxHp;
            this.player.atk += 3;
            this.player.def += 2;
            this.log(`LEVEL ${this.player.level}!`, 'level');
            soundEffects.levelUp?.();
        }
    }

    die() {
        this.log('You have fallen...', 'damage');
        soundEffects.die?.();
        this.achievements.recordDeath();
        const score = this.player.gold + this.floor * 100 + this.player.xp; // Better score calc
        this.hub.submitScore(score);
        this.addScore(score);
        this.gameOver(false);
    }

    updateBuffs() {
        const regen = this.buffs.find(b => b.effect.regenPerTurn);
        if (regen) this.player.hp = Math.min(this.player.maxHp, this.player.hp + regen.effect.regenPerTurn);
        
        this.buffs = this.buffs.filter(b => {
            b.duration--;
            if (b.duration <= 0) {
                if (b.effect.atk) this.player.atk -= b.effect.atk;
                return false;
            }
            return true;
        });
        
        this.updateBuffsUI();
    }

    updateCooldowns() {
        for (const k in this.cooldowns) if (this.cooldowns[k] > 0) this.cooldowns[k]--;
    }

    updateVisibility() {
        const range = this.visionRange || 8;
        for (let y = 0; y < MAP_HEIGHT; y++)
            for (let x = 0; x < MAP_WIDTH; x++)
                this.visible[y][x] = false;
        
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const x = this.player.x + dx, y = this.player.y + dy;
                if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) continue;
                if (Math.hypot(dx, dy) > range) continue;
                if (this.hasLOS(this.player.x, this.player.y, x, y)) {
                    this.visible[y][x] = true;
                    this.explored[y][x] = true;
                }
            }
        }
    }

    hasLOS(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
        let err = dx - dy, x = x1, y = y1;
        while (true) {
            if (x === x2 && y === y2) return true;
            if (this.map[y]?.[x] === TILE.WALL && (x !== x1 || y !== y1)) return false;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x += sx; }
            if (e2 < dx) { err += dx; y += sy; }
        }
    }

    log(msg, type = 'info') {
        const log = document.getElementById('floating-log');
        if (!log) return;
        const e = document.createElement('div');
        e.className = `log-entry ${type}`;
        e.textContent = msg;
        log.insertBefore(e, log.firstChild);
        while (log.children.length > 8) log.removeChild(log.lastChild);
        setTimeout(() => e.remove(), 4000);
    }

    spawnFloatingText(x, y, text, color) {
        this.floatingTexts.push({ x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE, text, color, life: 40 });
    }

    spawnParticle(x, y, type) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x * TILE_SIZE + TILE_SIZE / 2,
                y: y * TILE_SIZE + TILE_SIZE / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 30,
                color: type === 'blood' ? '#f00' : type === 'magic' ? '#80f' : '#ff0'
            });
        }
    }

    shakeScreen() {
        this.canvas.parentElement?.classList.add('shake');
        setTimeout(() => this.canvas.parentElement?.classList.remove('shake'), 200);
    }

    flashDamage() {
        const flash = document.getElementById('damage-flash');
        if (flash) {
            flash.classList.add('active');
            setTimeout(() => flash.classList.remove('active'), 150);
        }
    }

    toggleMinimap() {
        this.showMinimap = !this.showMinimap;
        const mc = document.getElementById('minimap-container');
        if (mc) mc.classList.toggle('visible', this.showMinimap);
    }

    toggleInventory() {
        const m = document.getElementById('inventory-modal');
        if (m) m.style.display = m.style.display === 'none' ? 'flex' : 'none';
    }

    updateClassDisplay() {
        const c = CLASSES[this.playerClass];
        const icon = document.getElementById('class-icon');
        const name = document.getElementById('class-name');
        if (icon) icon.innerHTML = getIcon(c?.iconKey) || getIcon('sword');
        if (name) name.textContent = c?.name || 'Warrior';
        
        this.player.skills.forEach((s, i) => {
            const slot = document.getElementById(`skill-${i + 1}`);
            if (slot && SKILLS[s]) {
                const iconEl = slot.querySelector('.skill-icon');
                if (iconEl) iconEl.innerHTML = getIcon(SKILLS[s].iconKey) || '';
            }
        });
    }

    updateBuffsUI() {
        const container = document.getElementById('buffs-bar');
        if (!container) return;
        
        container.innerHTML = this.buffs.map(b => `
            <div class="buff-item" title="${b.name}">
                ${getIcon(b.iconKey)}
                <span class="buff-duration">${b.duration}</span>
            </div>
        `).join('');
    }

    updateUI() {
        const hp = this.player.hp / this.player.maxHp * 100;
        const xp = this.player.xp / this.player.xpToLevel * 100;
        
        const hpFill = document.getElementById('hp-fill');
        const xpFill = document.getElementById('xp-fill');
        if (hpFill) hpFill.style.width = `${hp}%`;
        if (xpFill) xpFill.style.width = `${xp}%`;
        
        const hpText = document.querySelector('.hp-text');
        const xpText = document.querySelector('.xp-text');
        if (hpText) hpText.textContent = `${this.player.hp}/${this.player.maxHp}`;
        if (xpText) xpText.textContent = `${this.player.xp}/${this.player.xpToLevel}`;
        
        const setValue = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };
        setValue('.floor-value', this.floor);
        setValue('.gold-value', this.player.gold);
        setValue('.level-value', this.player.level);
        setValue('#stat-atk', this.player.atk + (this.player.weapon?.value || 0));
        setValue('#stat-def', this.player.def + (this.player.armor?.value || 0));
        setValue('#potion-count', this.player.potions);
        
        // Update skill cooldowns
        this.player.skills.forEach((s, i) => {
            const slot = document.getElementById(`skill-${i + 1}`);
            if (slot) {
                const cd = this.cooldowns[s] || 0;
                slot.classList.toggle('on-cooldown', cd > 0);
                const cdEl = slot.querySelector('.skill-cooldown');
                if (cdEl) cdEl.textContent = cd > 0 ? cd : '';
            }
        });
    }

    update(dt) {
        // Animate player movement
        if (this.playerAnim.t < 1) {
            this.playerAnim.t = Math.min(1, this.playerAnim.t + dt * 10);
            this.playerAnim.x = this.lerp(this.playerAnim.x, this.playerAnim.tx, this.playerAnim.t);
            this.playerAnim.y = this.lerp(this.playerAnim.y, this.playerAnim.ty, this.playerAnim.t);
        }
        // Always allow input after a brief delay
        if (this.playerAnim.t >= 0.5) this.animating = false;
        
        // Animate monsters
        for (const m of this.monsters) {
            if (m.anim && m.anim.t < 1) {
                m.anim.t = Math.min(1, m.anim.t + dt * 6);
                m.anim.x = this.lerp(m.anim.x, m.anim.tx, m.anim.t);
                m.anim.y = this.lerp(m.anim.y, m.anim.ty, m.anim.t);
            }
        }
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });
        
        // Update floating texts
        this.floatingTexts = this.floatingTexts.filter(t => {
            t.y -= 1;
            t.life--;
            return t.life > 0;
        });
        
        // Update light time for torch flicker
        this.lightTime += dt * 3;
        
        this.renderMinimap();
    }

    lerp(a, b, t) { return a + (b - a) * Math.min(1, t); }

    renderMinimap() {
        if (!this.showMinimap) return;
        const mc = document.getElementById('minimap-canvas');
        if (!mc) return;
        const ctx = mc.getContext('2d');
        const scale = 5;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, mc.width, mc.height);
        
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (!this.explored[y]?.[x]) continue;
                ctx.fillStyle = this.map[y][x] === TILE.WALL ? '#333' : '#1a1a1a';
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
        
        for (const m of this.monsters) {
            if (this.visible[m.y]?.[m.x]) {
                ctx.fillStyle = '#f00';
                ctx.fillRect(m.x * scale, m.y * scale, scale, scale);
            }
        }
        
        ctx.fillStyle = '#0f8';
        ctx.fillRect(this.player.x * scale, this.player.y * scale, scale, scale);
    }

    render() {
        const ctx = this.ctx;
        
        // Clear background
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw tiles (Floor & Wall)
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (!this.explored[y]?.[x]) continue;
                
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;
                const visible = this.visible[y][x];
                
                ctx.globalAlpha = visible ? 1 : 0.3;
                const tile = this.map[y][x];
                
                // Draw floor
                ctx.fillStyle = this.theme.floor;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                
                 // Subtle floor grid
                ctx.strokeStyle = 'rgba(255,255,255,0.03)';
                ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

                if (tile === TILE.WALL) {
                    // Draw wall with gradient
                    ctx.fillStyle = this.theme.wall;
                    ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    
                    // Wall Highlight
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, 4);
                } else if (tile === TILE.STAIRS) {
                     this.drawSprite(ctx, 'map', x, y, this.theme.accent);
                }
            }
        }
        
        ctx.globalAlpha = 1;
        
        // Draw decorations
        for (const d of this.decorations) {
            if (!this.visible[d.y]?.[d.x]) continue;
            ctx.globalAlpha = 0.3;
            // Map decoration chars to simple shapes or dots
            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.arc(d.x * TILE_SIZE + 16, d.y * TILE_SIZE + 16, 2, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Draw items
        for (const item of this.items) {
             if (!this.visible[item.y]?.[item.x]) continue;
             const type = ITEM_TYPES[item.type];
             const icon = this.iconMapping[item.type] || 'pouch';
             this.drawSprite(ctx, icon, item.x, item.y, type.color, 0.8);
        }

        // Draw interactables
        for (const obj of this.interactables) {
            if (!this.visible[obj.y]?.[obj.x]) continue;
            let icon = 'chest';
            let color = '#fc0';
            if (obj.type === 'shrine') { icon = 'shrine'; color = '#0ff'; }
            if (obj.opened) { color = '#666'; } // Dim opened chest
            
            this.drawSprite(ctx, icon, obj.x, obj.y, color);
        }

        // Draw torches
        for (const torch of this.torches || []) {
            if (!this.visible[torch.y]?.[torch.x]) continue;
            const tx = torch.x * TILE_SIZE + TILE_SIZE / 2;
            const ty = torch.y * TILE_SIZE + TILE_SIZE / 2;
            const flicker = 0.8 + 0.2 * Math.sin(this.lightTime + torch.flicker);
            
            // Glow
            const gradient = ctx.createRadialGradient(tx, ty, 0, tx, ty, TILE_SIZE * 3);
            gradient.addColorStop(0, `rgba(255, 120, 20, ${0.4 * flicker})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(tx - TILE_SIZE * 3, ty - TILE_SIZE * 3, TILE_SIZE * 6, TILE_SIZE * 6);
            
            ctx.fillStyle = '#ff9900';
            ctx.beginPath();
            ctx.arc(tx, ty, 3, 0, Math.PI*2);
            ctx.fill();
        }

        // Draw monsters
        for (const m of this.monsters) {
             if (!this.visible[m.y]?.[m.x]) continue;
             const ax = m.anim ? m.anim.x : m.x;
             const ay = m.anim ? m.anim.y : m.y;
             
             // Interpolated position
             const icon = this.iconMapping[m.type] || 'demon';
             this.drawSprite(ctx, icon, ax, ay, m.color);
             
             // HP Bar
             const bx = ax * TILE_SIZE + 4;
             const by = ay * TILE_SIZE - 4;
             const hpPct = m.hp / m.maxHp;
             if (hpPct < 1) {
                 ctx.fillStyle = '#300';
                 ctx.fillRect(bx, by, TILE_SIZE - 8, 3);
                 ctx.fillStyle = '#f00';
                 ctx.fillRect(bx, by, (TILE_SIZE - 8) * hpPct, 3);
             }
             
             // Alert status
             if (m.alertLevel >= 100) {
                 ctx.fillStyle = 'red';
                 ctx.font = 'bold 12px sans-serif';
                 ctx.fillText('!', ax * TILE_SIZE + 24, ay * TILE_SIZE);
             }
        }

        // Draw player
        const pClass = CLASSES[this.playerClass] || CLASSES.warrior;
        this.drawSprite(ctx, pClass.iconKey || 'hero_warrior', this.playerAnim.x, this.playerAnim.y, '#00ff88', 1.3);

        // Player HP Bar (if damaged)
        if (this.player.hp < this.player.maxHp) {
            const bx = this.playerAnim.x * TILE_SIZE + 4;
            const by = this.playerAnim.y * TILE_SIZE - 6;
             ctx.fillStyle = '#000';
             ctx.fillRect(bx, by, TILE_SIZE - 8, 4);
             ctx.fillStyle = '#0f8';
             ctx.fillRect(bx, by, (TILE_SIZE - 8) * (this.player.hp / this.player.maxHp), 4);
        }
        
        // Draw particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life / 30;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // Draw floating texts
        for (const t of this.floatingTexts) {
            ctx.globalAlpha = t.life / 40;
            ctx.fillStyle = t.color;
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(t.text, t.x, t.y);
        }
        ctx.globalAlpha = 1;
    }
}

// Safe instantiation for module support
function initRoguelike() {
    if (window.game) return;
    console.log('--- Initializing Roguelike Game Instance ---');
    try {
        window.game = new Roguelike();
        console.log('Roguelike Instance Created Successfully');
    } catch (err) {
        console.error('CRITICAL: Failed to initialize Roguelike:', err);
    }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initRoguelike();
} else {
    document.addEventListener('DOMContentLoaded', initRoguelike);
}

