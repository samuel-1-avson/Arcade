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
 * SVG icon paths for each game (24x24 viewBox, stroke-based)
 */
export const GAME_ICONS = {
    snake: '<path d="M12 2c-5 0-8 4-8 8s3 8 8 8c2 0 4-1 5-2"/><circle cx="9" cy="8" r="1"/>',
    '2048': '<rect x="3" y="3" width="18" height="18" rx="2"/><text x="12" y="16" text-anchor="middle" font-size="8" font-weight="bold" fill="currentColor">2K</text>',
    breakout: '<rect x="3" y="18" width="18" height="3" rx="1"/><circle cx="12" cy="14" r="1.5"/><rect x="3" y="3" width="5" height="2" rx="0.5"/><rect x="9" y="3" width="5" height="2" rx="0.5"/><rect x="15" y="3" width="5" height="2" rx="0.5"/><rect x="3" y="6" width="5" height="2" rx="0.5"/><rect x="9" y="6" width="5" height="2" rx="0.5"/><rect x="15" y="6" width="5" height="2" rx="0.5"/>',
    minesweeper: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="12" r="2"/><line x1="15" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="15" y2="15"/><line x1="15" y1="12" x2="17" y2="12"/>',
    tetris: '<rect x="7" y="2" width="4" height="4"/><rect x="11" y="2" width="4" height="4"/><rect x="7" y="6" width="4" height="4"/><rect x="7" y="10" width="4" height="4"/><rect x="3" y="14" width="4" height="4"/><rect x="7" y="14" width="4" height="4"/><rect x="11" y="14" width="4" height="4"/><rect x="15" y="14" width="4" height="4"/>',
    pacman: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 12l8-6" stroke="var(--bg-primary)" stroke-width="3"/><path d="M12 12l8 6" stroke="var(--bg-primary)" stroke-width="3"/><circle cx="12" cy="7" r="1.5"/>',
    asteroids: '<polygon points="12,2 4,20 12,16 20,20"/><circle cx="5" cy="8" r="2"/><circle cx="18" cy="5" r="1.5"/><circle cx="20" cy="12" r="1"/>',
    'tower-defense': '<path d="M4 21V10l8-8 8 8v11"/><rect x="9" y="14" width="6" height="7"/><rect x="7" y="4" width="2" height="3"/><rect x="15" y="4" width="2" height="3"/><circle cx="12" cy="11" r="2"/>',
    rhythm: '<circle cx="6" cy="18" r="3"/><circle cx="18" cy="14" r="3"/><path d="M9 18V6l12-2v10"/>',
    roguelike: '<circle cx="12" cy="8" r="6"/><path d="M9 7v2M15 7v2"/><path d="M12 14v8"/><path d="M8 18h8"/><path d="M4 10l4 2"/><path d="M20 10l-4 2"/>',
    toonshooter: '<circle cx="12" cy="12" r="3"/><line x1="12" y1="5" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="19"/><line x1="5" y1="12" x2="2" y2="12"/><line x1="22" y1="12" x2="19" y2="12"/>'
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
