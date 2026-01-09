/**
 * Game Registry - Single source of truth for all games in Arcade Hub
 * 
 * This module centralizes all game definitions to ensure consistency
 * across the frontend services and backend Cloud Functions.
 * 
 * When adding a new game:
 * 1. Add entry to GAME_REGISTRY below
 * 2. Add icon to GAME_ICONS
 * 3. Deploy updated Cloud Functions if score validation is needed
 */

/**
 * Complete registry of all games
 * @type {Object.<string, GameDefinition>}
 */
export const GAME_REGISTRY = {
    snake: {
        id: 'snake',
        name: 'Snake',
        path: './games/snake/index.html',
        maxScore: 1_000_000,
        category: 'classic',
        description: 'Classic snake game - eat food and grow!'
    },
    '2048': {
        id: '2048',
        name: '2048',
        path: './games/2048/index.html',
        maxScore: 10_000_000,
        category: 'puzzle',
        description: 'Slide tiles and combine to reach 2048'
    },
    breakout: {
        id: 'breakout',
        name: 'Breakout',
        path: './games/breakout/index.html',
        maxScore: 500_000,
        category: 'classic',
        description: 'Break all the bricks with your paddle'
    },
    minesweeper: {
        id: 'minesweeper',
        name: 'Minesweeper',
        path: './games/minesweeper/index.html',
        maxScore: 100_000,
        category: 'puzzle',
        description: 'Clear the minefield without hitting a mine'
    },
    tetris: {
        id: 'tetris',
        name: 'Tetris',
        path: './games/tetris/index.html',
        maxScore: 5_000_000,
        category: 'classic',
        description: 'Stack falling blocks and clear lines'
    },
    pacman: {
        id: 'pacman',
        name: 'Pac-Man',
        path: './games/pacman/index.html',
        maxScore: 2_000_000,
        category: 'classic',
        description: 'Eat pellets and avoid ghosts'
    },
    asteroids: {
        id: 'asteroids',
        name: 'Asteroids',
        path: './games/asteroids/index.html',
        maxScore: 1_000_000,
        category: 'action',
        description: 'Destroy asteroids in space'
    },
    'tower-defense': {
        id: 'tower-defense',
        name: 'Tower Defense',
        path: './games/tower-defense/index.html',
        maxScore: 10_000_000,
        category: 'strategy',
        description: 'Build towers to defend against waves'
    },
    rhythm: {
        id: 'rhythm',
        name: 'Rhythm',
        path: './games/rhythm/index.html',
        maxScore: 1_000_000,
        category: 'music',
        description: 'Hit the beats in time with the music'
    },
    roguelike: {
        id: 'roguelike',
        name: 'Roguelike',
        path: './games/roguelike/index.html',
        maxScore: 500_000,
        category: 'rpg',
        description: 'Dungeon crawler with permadeath'
    },
    toonshooter: {
        id: 'toonshooter',
        name: 'Toon Shooter',
        path: './games/toonshooter/index.html',
        maxScore: 1_000_000,
        category: 'action',
        description: 'Cartoon-style shooter'
    }
};

/**
 * SVG icons for each game (complete SVG elements)
 */
export const GAME_ICONS = {
    snake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12c0-4 3-7 7-7s7 3 7 7-3 7-7 7"/><path d="M9 9.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" fill="currentColor"/><path d="M18 12l3-3m0 6l-3-3"/></svg>',
    '2048': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    breakout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><line x1="12" y1="4" x2="12" y2="2"/></svg>',
    minesweeper: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>',
    tetris: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="10" y="4" width="6" height="6" rx="1"/><rect x="10" y="10" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/></svg>',
    pacman: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><circle cx="14" cy="10" r="1.5" fill="currentColor"/></svg>',
    asteroids: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/></svg>',
    'tower-defense': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/><rect x="10" y="10" width="4" height="3"/></svg>',
    rhythm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    roguelike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2L22 9.5 14.5 17 7 9.5 14.5 2z"/><path d="M9.5 7L2 14.5 9.5 22 17 14.5"/></svg>',
    toonshooter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M22 12h-4"/><path d="M6 12H2"/><path d="M12 6V2"/><path d="M12 22v-4"/></svg>'
};

/**
 * Get array of all game IDs
 * @returns {string[]}
 */
export const GAME_IDS = Object.keys(GAME_REGISTRY);

/**
 * Get game definition by ID
 * @param {string} gameId 
 * @returns {GameDefinition|undefined}
 */
export function getGame(gameId) {
    return GAME_REGISTRY[gameId];
}

/**
 * Get game icon SVG path
 * @param {string} gameId 
 * @returns {string}
 */
export function getGameIcon(gameId) {
    return GAME_ICONS[gameId] || GAME_ICONS.snake;
}

/**
 * Get games by category
 * @param {string} category 
 * @returns {GameDefinition[]}
 */
export function getGamesByCategory(category) {
    return Object.values(GAME_REGISTRY).filter(g => g.category === category);
}

/**
 * Get unique categories
 * @returns {string[]}
 */
export function getCategories() {
    return [...new Set(Object.values(GAME_REGISTRY).map(g => g.category))];
}

/**
 * Check if a game ID is valid
 * @param {string} gameId 
 * @returns {boolean}
 */
export function isValidGameId(gameId) {
    return gameId in GAME_REGISTRY;
}

/**
 * Get max score for validation
 * @param {string} gameId 
 * @returns {number}
 */
export function getMaxScore(gameId) {
    const game = GAME_REGISTRY[gameId];
    return game ? game.maxScore : 1_000_000; // Default max
}

/**
 * @typedef {Object} GameDefinition
 * @property {string} id - Unique game identifier
 * @property {string} name - Display name
 * @property {string} path - Path to game HTML file
 * @property {number} maxScore - Maximum valid score for anti-cheat
 * @property {string} category - Game category
 * @property {string} description - Short description
 */
