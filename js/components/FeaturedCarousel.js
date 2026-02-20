/**
 * Featured Carousel - Minimal game showcase
 * Cycles through featured games with auto-play
 */

import { eventBus } from '../engine/EventBus.js';
import { GAME_ICONS } from '../config/gameRegistry.js';

// Featured games data
const FEATURED_GAMES = [
    {
        id: 'snake',
        name: 'Snake',
        icon: GAME_ICONS.snake,
        difficulty: 'easy',
        players: '1 Player',
        description: 'Classic arcade'
    },
    {
        id: 'tetris',
        name: 'Tetris',
        icon: GAME_ICONS.tetris,
        difficulty: 'medium',
        players: '1 Player',
        description: 'Stack & clear'
    },
    {
        id: 'pacman',
        name: 'Pac-Man',
        icon: GAME_ICONS.pacman,
        difficulty: 'medium',
        players: '1 Player',
        description: 'Eat dots'
    },
    {
        id: 'tower-defense',
        name: 'Tower Defense',
        icon: GAME_ICONS['tower-defense'],
        difficulty: 'hard',
        players: '1 Player',
        description: 'Strategic'
    },
    {
        id: 'toonshooter',
        name: 'Toon Shooter',
        icon: GAME_ICONS.toonshooter,
        difficulty: 'medium',
        players: '2 Players',
        description: 'Multiplayer'
    }
];

export class FeaturedCarousel {
    constructor() {
        this.currentIndex = 0;
        this.slider = null;
        this.dots = null;
        this.interval = null;
        this.isPlaying = true;
    }

    init() {
        this.slider = document.getElementById('featured-slider');
        this.dots = document.getElementById('featured-dots');
        
        if (!this.slider) return;

        this.render();
        this.setupEvents();
        this.startAutoPlay();
    }

    render() {
        // Render slides
        this.slider.innerHTML = FEATURED_GAMES.map((game, index) => `
            <div class="featured-slide" data-index="${index}">
                <div class="featured-game-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        ${game.icon}
                    </svg>
                </div>
                <div class="featured-game-info">
                    <h3 class="featured-game-title">${game.name}</h3>
                    <div class="featured-game-meta">
                        <span class="featured-game-difficulty difficulty-${game.difficulty}">${game.difficulty}</span>
                        <span class="featured-game-players">${game.players}</span>
                        <span>${game.description}</span>
                    </div>
                </div>
                <button class="btn btn-primary featured-play-btn" data-game="${game.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Play
                </button>
            </div>
        `).join('');

        // Render dots
        this.dots.innerHTML = FEATURED_GAMES.map((_, index) => `
            <button class="featured-dot ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="Go to slide ${index + 1}"></button>
        `).join('');
    }

    setupEvents() {
        // Navigation buttons
        const prevBtn = document.getElementById('featured-prev');
        const nextBtn = document.getElementById('featured-next');

        prevBtn?.addEventListener('click', () => {
            this.pauseAutoPlay();
            this.prev();
            this.resumeAutoPlay();
        });

        nextBtn?.addEventListener('click', () => {
            this.pauseAutoPlay();
            this.next();
            this.resumeAutoPlay();
        });

        // Dots
        this.dots?.addEventListener('click', (e) => {
            if (e.target.classList.contains('featured-dot')) {
                this.pauseAutoPlay();
                const index = parseInt(e.target.dataset.index);
                this.goTo(index);
                this.resumeAutoPlay();
            }
        });

        // Play buttons
        this.slider?.addEventListener('click', (e) => {
            const playBtn = e.target.closest('.featured-play-btn');
            if (playBtn) {
                const gameId = playBtn.dataset.game;
                eventBus.emit('featuredGameSelected', { gameId });
            }
        });

        // Pause on hover
        this.slider?.parentElement?.addEventListener('mouseenter', () => {
            this.pauseAutoPlay();
        });

        this.slider?.parentElement?.addEventListener('mouseleave', () => {
            this.resumeAutoPlay();
        });
    }

    goTo(index) {
        if (index < 0) index = FEATURED_GAMES.length - 1;
        if (index >= FEATURED_GAMES.length) index = 0;

        this.currentIndex = index;
        this.slider.style.transform = `translateX(-${index * 100}%)`;

        // Update dots
        this.dots.querySelectorAll('.featured-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    next() {
        this.goTo(this.currentIndex + 1);
    }

    prev() {
        this.goTo(this.currentIndex - 1);
    }

    startAutoPlay() {
        if (this.interval) return;
        this.interval = setInterval(() => {
            this.next();
        }, 4000); // Change every 4 seconds
    }

    pauseAutoPlay() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    resumeAutoPlay() {
        this.startAutoPlay();
    }

    destroy() {
        this.pauseAutoPlay();
    }
}

// Singleton instance
export const featuredCarousel = new FeaturedCarousel();
export default FeaturedCarousel;
