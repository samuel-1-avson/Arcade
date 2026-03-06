/**
 * Neon Snake Arena v2.0 - Game Configuration
 */

const GameConfig = {
  GAME_ID: 'neon-snake',
  VERSION: '2.0.0',

  // Canvas = exactly GRID_WIDTH * CELL_SIZE so no offset math is needed
  CANVAS: {
    WIDTH: 720,
    HEIGHT: 576,
    GRID_WIDTH: 30,
    GRID_HEIGHT: 24,
    CELL_SIZE: 24,
  },

  TIMING: {
    BASE_SPEED: 160,          // ms per move (lower = faster)
    SPEED_INCREMENT: 4,       // ms shaved off per food eaten
    MIN_SPEED: 55,            // fastest possible
    SPEED_BOOST_MULT: 1.8,    // turbo power-up multiplier
    SLOW_DIVISOR: 1.8,        // slow power-up divisor
    COUNTDOWN_MS: 1000,       // ms per countdown step
  },

  SCORING: {
    BASE_FOOD: 10,
    GOLDEN_FOOD: 50,
    BONUS_FOOD: 30,
    POWERUP_COLLECT: 25,
    COMBO_WINDOW: 3500,       // ms window to extend combo
    COMBO_MAX: 8,             // max combo multiplier level
  },

  FOOD: {
    SPAWN_INTERVAL: 2500,
    GOLDEN_CHANCE: 0.12,
    BONUS_CHANCE: 0.08,
    MAX_ITEMS: 3,
    DESPAWN_TIME: 12000,
    BONUS_DESPAWN_TIME: 5000,
  },

  POWERUPS: {
    SPEED_BOOST: {
      id: 'speedBoost',
      name: 'TURBO',
      emoji: '⚡',
      color: '#ffee00',
      duration: 5000,
      spawnChance: 0.15,
      description: '1.8× movement speed',
    },
    GHOST_MODE: {
      id: 'ghostMode',
      name: 'GHOST',
      emoji: '👻',
      color: '#00e5ff',
      duration: 4000,
      spawnChance: 0.08,
      description: 'Pass through walls',
    },
    SCORE_MULTIPLIER: {
      id: 'scoreMultiplier',
      name: '2× SCORE',
      emoji: '✨',
      color: '#00ff88',
      duration: 10000,
      spawnChance: 0.10,
      multiplier: 2,
      description: 'Double all points',
    },
    SHRINK: {
      id: 'shrink',
      name: 'SHRINK',
      emoji: '🔽',
      color: '#ff4488',
      segmentsRemoved: 5,
      spawnChance: 0.12,
      description: 'Remove 5 segments',
    },
    MAGNET: {
      id: 'magnet',
      name: 'MAGNET',
      emoji: '🧲',
      color: '#cc44ff',
      duration: 8000,
      radius: 6,
      spawnChance: 0.08,
      description: 'Attract nearby food',
    },
    SHIELD: {
      id: 'shield',
      name: 'SHIELD',
      emoji: '🛡',
      color: '#ff8800',
      duration: 0,           // persists until absorbed
      spawnChance: 0.07,
      description: 'Absorb one fatal collision',
    },
    SLOW: {
      id: 'slow',
      name: 'SLOW-MO',
      emoji: '🐌',
      color: '#88ffdd',
      duration: 6000,
      spawnChance: 0.10,
      description: 'Slow down for precision',
    },
  },

  EFFECTS: {
    GLOW_BLUR: 18,
    PARTICLE_COUNT: 20,
    SCREEN_SHAKE_DURATION: 250,
    SCREEN_SHAKE_INTENSITY: 6,
    PULSE_SPEED: 0.003,
  },

  COLORS: {
    SNAKE_HEAD: '#00e5ff',
    SNAKE_BODY_START: '#00b8cc',
    SNAKE_BODY_END: '#003d55',
    SNAKE_GLOW: 'rgba(0, 229, 255, 0.7)',

    FOOD_NORMAL: '#00ff88',
    FOOD_GOLDEN: '#ffdd00',
    FOOD_BONUS: '#ff8844',

    GRID_LINE: 'rgba(0, 229, 255, 0.07)',
    GRID_BORDER: 'rgba(0, 229, 255, 0.5)',

    TEXT_PRIMARY: '#ffffff',
    TEXT_DIM: 'rgba(255,255,255,0.55)',
    TEXT_CYAN: '#00e5ff',
    TEXT_GREEN: '#00ff88',
    TEXT_RED: '#ff0055',
    TEXT_YELLOW: '#ffdd00',
    TEXT_ORANGE: '#ff8800',

    HUD_BG: 'rgba(0, 0, 0, 0.75)',
    BACKGROUND: '#010208',
  },

  INPUT: {
    UP:      ['ArrowUp',    'w', 'W'],
    DOWN:    ['ArrowDown',  's', 'S'],
    LEFT:    ['ArrowLeft',  'a', 'A'],
    RIGHT:   ['ArrowRight', 'd', 'D'],
    PAUSE:   ['Escape', 'p', 'P'],
    RESTART: ['r', 'R'],
    MUTE:    ['m', 'M'],
  },

  MODES: {
    CLASSIC: {
      id: 'classic',
      name: 'Classic',
      icon: '🐍',
      description: 'Avoid walls and your tail',
      wallCollision: true,
      selfCollision: true,
      timeLimit: 0,
      speedAcceleration: true,
    },
    TIME_ATTACK: {
      id: 'timeAttack',
      name: 'Time Attack',
      icon: '⏱',
      description: 'Score as high as possible in 90 seconds',
      wallCollision: true,
      selfCollision: true,
      timeLimit: 90,
      speedAcceleration: false,
    },
    ENDLESS: {
      id: 'endless',
      name: 'Endless',
      icon: '♾',
      description: 'Walls wrap around — no dead ends',
      wallCollision: false,
      selfCollision: true,
      timeLimit: 0,
      speedAcceleration: true,
    },
  },

  LEVELS: {
    FOOD_PER_LEVEL: 5,
    MAX_LEVEL: 20,
  },

  AUDIO: {
    ENABLED: true,
    SFX_VOLUME: 0.65,
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameConfig;
}
