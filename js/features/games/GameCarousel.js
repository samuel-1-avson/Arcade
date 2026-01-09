/**
 * GameCarousel - Game Cards and Grid Component
 * Handles game card rendering, filtering, and launching
 */

import { storageManager } from '../engine/StorageManager.js';
import { globalStateManager } from '../services/GlobalStateManager.js';
import { gameLoaderService } from '../services/GameLoaderService.js';
import { eventBus } from '../engine/EventBus.js';
import { GAME_REGISTRY, GAME_ICONS, GAME_IDS } from '../config/gameRegistry.js';

/**
 * GameCarousel manages the game grid and card interactions
 */
class GameCarousel {
    constructor(arcadeHub) {
        this.hub = arcadeHub;
        this.currentFilter = 'all';
        this.games = this.buildGamesList();
        this.highScores = storageManager.getAllHighScores();
    }

    /**
     * Build games list from registry
     */
    buildGamesList() {
        return GAME_IDS.map(id => {
            const game = GAME_REGISTRY[id];
            return {
                id: game.id,
                title: game.name,
                description: game.description,
                difficulty: this.inferDifficulty(game.category),
                path: game.path.replace('./', '').replace('/index.html', '/'),
                icon: this.getEmojiIcon(game.id),
                rating: 5
            };
        });
    }

    /**
     * Infer difficulty from category
     */
    inferDifficulty(category) {
        const difficultyMap = {
            'classic': 'easy',
            'puzzle': 'medium',
            'action': 'medium',
            'strategy': 'hard',
            'music': 'medium',
            'rpg': 'hard'
        };
        return difficultyMap[category] || 'medium';
    }

    /**
     * Get emoji icon for game
     */
    getEmojiIcon(gameId) {
        const emojiMap = {
            'snake': '🐍',
            '2048': '🔢',
            'breakout': '🧱',
            'minesweeper': '💣',
            'tetris': '🟦',
            'pacman': '👻',
            'asteroids': '☄️',
            'tower-defense': '🏰',
            'rhythm': '🎵',
            'roguelike': '⚔️',
            'toonshooter': '🔫'
        };
        return emojiMap[gameId] || '🎮';
    }

    /**
     * Initialize game carousel
     */
    setup() {
        this.setupFilters();
        this.renderGames();
        this.setupEventListeners();
    }

    /**
     * Set up filter buttons
     */
    setupFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderGames(this.currentFilter);
            });
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        eventBus.on('highScoreUpdated', ({ gameId, score }) => {
            this.highScores[gameId] = score;
            this.updateGameCard(gameId);
        });
    }

    /**
     * Render all games with optional filter
     * @param {string} filter - Filter type: 'all', 'easy', 'medium', 'hard'
     */
    renderGames(filter = 'all') {
        const container = document.getElementById('games-container');
        if (!container) return;

        const filtered = filter === 'all' 
            ? this.games 
            : this.games.filter(g => g.difficulty === filter);

        container.innerHTML = filtered
            .map((game, index) => this.createGameCard(game, index))
            .join('');

        // Add click handlers
        container.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const gameId = card.dataset.game;
                const game = this.games.find(g => g.id === gameId);
                if (game) this.launchGame(game);
            });
        });
    }

    /**
     * Create HTML for a game card
     * @param {Object} game - Game data
     * @param {number} index - Card index for animation delay
     * @returns {string} HTML string
     */
    createGameCard(game, index) {
        const stats = globalStateManager.getGameStats(game.id);
        const highScore = stats.highScore || this.highScores[game.id] || 0;
        const svgIcon = GAME_ICONS[game.id] || '';

        return `
            <div class="game-card" data-game="${game.id}" style="animation-delay: ${index * 0.1}s">
                <div class="game-card-inner">
                    <div class="game-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            ${svgIcon}
                        </svg>
                    </div>
                    <div class="game-info">
                        <h3 class="game-title">${game.title}</h3>
                        <p class="game-desc">${game.description}</p>
                        <div class="game-meta">
                            <span class="difficulty ${game.difficulty}">${game.difficulty}</span>
                            ${highScore > 0 ? `<span class="high-score">Best: ${highScore.toLocaleString()}</span>` : ''}
                        </div>
                    </div>
                    <div class="game-play-btn">
                        <span>PLAY</span>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Update a specific game card
     * @param {string} gameId - Game ID to update
     */
    updateGameCard(gameId) {
        const card = document.querySelector(`.game-card[data-game="${gameId}"]`);
        if (!card) return;

        const stats = globalStateManager.getGameStats(gameId);
        const highScore = stats.highScore || 0;
        const scoreEl = card.querySelector('.high-score');
        
        if (highScore > 0) {
            if (scoreEl) {
                scoreEl.textContent = `Best: ${highScore.toLocaleString()}`;
            } else {
                const meta = card.querySelector('.game-meta');
                if (meta) {
                    meta.insertAdjacentHTML('beforeend', 
                        `<span class="high-score">Best: ${highScore.toLocaleString()}</span>`
                    );
                }
            }
        }
    }

    /**
     * Launch a game
     * @param {Object} game - Game to launch
     */
    launchGame(game) {
        gameLoaderService.load(game.id);
    }

    /**
     * Get list of games
     * @returns {Object[]} Games array
     */
    getGames() {
        return this.games;
    }
}

export { GameCarousel };
export default GameCarousel;
