/**
 * Neon Snake Arena - Game Configuration
 * Centralized game settings and constants
 */

const GameConfig = {
  // Game Identification
  GAME_ID: 'neon-snake',
  VERSION: '1.0.0',
  
  // Canvas Settings
  CANVAS: {
    WIDTH: 800,
    HEIGHT: 600,
    GRID_WIDTH: 40,      // cells
    GRID_HEIGHT: 30,     // cells
    CELL_SIZE: 20,       // pixels
  },
  
  // Game Timing
  TIMING: {
    BASE_SPEED: 150,           // ms per move (lower = faster)
    SPEED_INCREMENT: 5,        // ms faster per food
    MIN_SPEED: 50,             // fastest allowed
    SPEED_BOOST_MULTIPLIER: 2, // 2x speed
  },
  
  // Scoring
  SCORING: {
    BASE_FOOD: 10,
    GOLDEN_FOOD: 50,
    POWERUP: 25,
    SEGMENT_BONUS_THRESHOLD: 10,
    SEGMENT_BONUS: 100,
  },
  
  // Food Settings
  FOOD: {
    SPAWN_INTERVAL: 3000,      // ms (only if max not reached)
    GOLDEN_CHANCE: 0.10,       // 10%
    MAX_ITEMS: 3,
    DESPAWN_TIME: 15000,       // ms (0 = never)
  },
  
  // Power-up Configurations
  POWERUPS: {
    SPEED_BOOST: {
      id: 'speedBoost',
      name: 'Speed Boost',
      emoji: '⚡',
      color: '#ffee00',
      duration: 5000,
      spawnChance: 0.15,
      description: '2x movement speed',
    },
    GHOST_MODE: {
      id: 'ghostMode',
      name: 'Ghost Mode',
      emoji: '👻',
      color: '#00e5ff',
      duration: 3000,
      spawnChance: 0.08,
      description: 'Pass through walls',
    },
    SCORE_MULTIPLIER: {
      id: 'scoreMultiplier',
      name: '2x Score',
      emoji: '✨',
      color: '#00ff88',
      duration: 10000,
      spawnChance: 0.10,
      multiplier: 2,
      description: 'Double points',
    },
    SHRINK: {
      id: 'shrink',
      name: 'Shrink',
      emoji: '🔽',
      color: '#ff0055',
      segmentsRemoved: 5,
      spawnChance: 0.12,
      description: 'Remove 5 segments',
    },
    MAGNET: {
      id: 'magnet',
      name: 'Magnet',
      emoji: '🧲',
      color: '#b300ff',
      duration: 8000,
      radius: 5,  // cells
      spawnChance: 0.08,
      description: 'Attract nearby food',
    },
  },
  
  // Visual Effects
  EFFECTS: {
    GLOW_BLUR: 20,
    GLOW_COLOR: '#00e5ff',
    PARTICLE_COUNT: 15,
    SCREEN_SHAKE_DURATION: 200,
    SCREEN_SHAKE_INTENSITY: 5,
    PULSE_SPEED: 0.002,
  },
  
  // Colors
  COLORS: {
    // Snake
    SNAKE_HEAD: '#00e5ff',
    SNAKE_BODY: '#00b8cc',
    SNAKE_TAIL: '#008a99',
    SNAKE_GLOW: 'rgba(0, 229, 255, 0.5)',
    
    // Food
    FOOD_NORMAL: '#00ff88',
    FOOD_GOLDEN: '#ffee00',
    FOOD_GLOW: 'rgba(0, 255, 136, 0.5)',
    
    // Grid
    GRID_LINE: 'rgba(0, 229, 255, 0.1)',
    GRID_GLOW: 'rgba(0, 229, 255, 0.3)',
    
    // UI
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: 'rgba(255, 255, 255, 0.7)',
    HUD_BG: 'rgba(0, 0, 0, 0.7)',
    
    // Background
    BACKGROUND: '#000000',
    BG_ELEVATED: '#0a0a0a',
  },
  
  // Input Keys
  INPUT: {
    UP: ['ArrowUp', 'w', 'W'],
    DOWN: ['ArrowDown', 's', 'S'],
    LEFT: ['ArrowLeft', 'a', 'A'],
    RIGHT: ['ArrowRight', 'd', 'D'],
    PAUSE: ['Escape', 'p', 'P', ' '],
    RESTART: ['r', 'R'],
  },
  
  // Game Modes
  MODES: {
    CLASSIC: {
      id: 'classic',
      name: 'Classic',
      description: 'Traditional snake - avoid walls and yourself',
      wallCollision: true,
      selfCollision: true,
      timeLimit: 0,  // unlimited
      lives: 1,
    },
    TIME_ATTACK: {
      id: 'timeAttack',
      name: 'Time Attack',
      description: '60 seconds - collect as many orbs as possible',
      wallCollision: true,
      selfCollision: true,
      timeLimit: 60,
      lives: 1,
    },
    ENDLESS: {
      id: 'endless',
      name: 'Endless',
      description: 'No walls - snake wraps around screen',
      wallCollision: false,
      selfCollision: true,
      timeLimit: 0,
      lives: 1,
    },
  },
  
  // Audio Settings
  AUDIO: {
    ENABLED: true,
    VOLUME: {
      MASTER: 1.0,
      SFX: 0.8,
      MUSIC: 0.5,
    },
  },
  
  // API Settings
  API: {
    AUTO_SAVE_INTERVAL: 10000,  // ms
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,          // ms
  },
};

// Freeze config to prevent accidental modifications
Object.freeze(GameConfig);
Object.freeze(GameConfig.CANVAS);
Object.freeze(GameConfig.TIMING);
Object.freeze(GameConfig.SCORING);
Object.freeze(GameConfig.FOOD);
Object.freeze(GameConfig.POWERUPS);
Object.freeze(GameConfig.EFFECTS);
Object.freeze(GameConfig.COLORS);
Object.freeze(GameConfig.INPUT);
Object.freeze(GameConfig.MODES);
Object.freeze(GameConfig.AUDIO);
Object.freeze(GameConfig.API);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameConfig;
}
