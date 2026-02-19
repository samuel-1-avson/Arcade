/**
 * Game Cards Module
 * Renders game cards and handles game launching
 */

import { globalStateManager } from '../services/GlobalStateManager.js';
import { economyService } from '../services/EconomyService.js';
import { audioService } from '../services/AudioService.js';
import { gameLoaderService } from '../services/GameLoaderService.js';
import { GAME_ICONS } from '../config/gameRegistry.js';
import { LazyImageLoader } from '../utils/lazyLoad.js';

export class GameCardsManager {
    constructor(app, games) {
        this.app = app;
        this.games = games;
        this.grid = null;
        this.currentFilter = 'all';
        this.imageLoader = new LazyImageLoader({
            rootMargin: '100px',
            threshold: 0.1
        });
    }

    init() {
        this.grid = document.getElementById('games-grid');
        this.setupFilters();
        this.render();
        this.imageLoader.init();
    }

    setupFilters() {
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentFilter = tab.dataset.filter;
                this.render();
            });
        });
    }

    render() {
        if (!this.grid) return;

        this.grid.innerHTML = '';

        const filteredGames = this.currentFilter === 'all'
            ? this.games
            : this.games.filter(g => g.difficulty === this.currentFilter);

        filteredGames.forEach((game, index) => {
            const card = this.createCard(game, index);
            this.grid.appendChild(card);
        });
    }

    createCard(game, index) {
        const card = document.createElement('article');
        card.className = 'game-card';
        card.style.animationDelay = `${index * 0.05}s`;
        
        // Accessibility attributes
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', game.comingSoon ? '-1' : '0');
        card.setAttribute('aria-label', this.buildAriaLabel(game));
        
        const stats = globalStateManager.getStatistics();
        const highScore = stats.gameStats[game.id]?.highScore || 0;
        const difficultyClass = `difficulty-${game.difficulty}`;
        const svgIcon = GAME_ICONS[game.id] || '';

        // Star rating
        const starIcon = '<svg class="star-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/></svg>';
        const starRating = Array(game.rating || 3).fill(starIcon).join('');

        // Trophy icon
        const trophyIcon = '<svg class="trophy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';

        // Support for lazy-loaded image or SVG icon
        const iconHtml = game.image ? this.renderLazyImage(game.image, game.title) : `
            <div class="game-card-svg-icon" aria-hidden="true">
                ${svgIcon}
            </div>
        `;

        card.innerHTML = `
            <div class="game-card-icon-wrapper">
                ${iconHtml}
                <span class="game-card-difficulty ${difficultyClass}">${game.difficulty}</span>
            </div>
            <div class="game-card-content">
                <h3 class="game-card-title" id="game-title-${game.id}">${game.title}</h3>
                <p class="game-card-description">${game.description}</p>
                <div class="game-card-meta">
                    <div class="game-card-highscore">
                        ${trophyIcon}
                        <span class="score-label">High Score:</span>
                        <span class="score" aria-label="High score ${highScore.toLocaleString()}">${highScore.toLocaleString()}</span>
                    </div>
                    <div class="game-card-rating" aria-label="Rating ${game.rating || 3} out of 5 stars">
                        ${starRating}
                    </div>
                </div>
            </div>
            ${!game.comingSoon ? `
            <div class="game-card-play-overlay">
                <button class="play-btn" aria-label="Play ${game.title}" aria-describedby="game-title-${game.id}">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5,3 19,12 5,21"/></svg>
                </button>
            </div>
            ` : `
            <div class="game-card-play-overlay coming-soon-overlay">
                <span class="coming-soon-label">COMING SOON</span>
            </div>
            `}
        `;

        // Apply equipped card skin
        const skin = economyService.getEquippedCardSkin();
        if (skin) {
            card.classList.add(skin.cssClass);
        }

        if (!game.comingSoon) {
            // Click and keyboard handlers
            const activate = () => this.launchGame(game);
            card.addEventListener('click', activate);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activate();
                }
            });
            card.addEventListener('mouseenter', () => audioService.playSFX('hover'));
            card.style.cursor = 'pointer';
        } else {
            card.style.opacity = '0.7';
        }

        return card;
    }

    renderLazyImage(src, alt) {
        return `
            <div class="game-card-image-wrapper">
                <img 
                    data-src="${src}" 
                    alt="${alt} game preview"
                    class="game-card-image lazy-load"
                    loading="lazy"
                >
            </div>
        `;
    }

    buildAriaLabel(game) {
        const stats = globalStateManager.getStatistics();
        const highScore = stats.gameStats[game.id]?.highScore || 0;
        return `${game.title}. ${game.difficulty} difficulty. ${game.description}. High score: ${highScore.toLocaleString()}. ${game.comingSoon ? 'Coming soon' : 'Press Enter to play'}`;
    }

    launchGame(game) {
        audioService.playSFX('click');
        gameLoaderService.loadGame(game);
    }

    updateHighScores() {
        this.render();
    }

    destroy() {
        this.imageLoader?.destroy();
    }
}

export default GameCardsManager;
