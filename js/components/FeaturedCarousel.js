/**
 * Featured Carousel - Premium Game Showcase
 * Cycles through featured games with smooth animations
 */

import { eventBus } from '../engine/EventBus.js';
import { GAME_ICONS } from '../config/gameRegistry.js';

// Featured games data with enhanced descriptions
const FEATURED_GAMES = [
    {
        id: 'snake',
        name: 'Snake',
        icon: GAME_ICONS.snake,
        difficulty: 'easy',
        players: '1 Player',
        description: 'The timeless classic. Eat, grow, survive.',
        color: '#00ff88'
    },
    {
        id: 'tetris',
        name: 'Tetris',
        icon: GAME_ICONS.tetris,
        difficulty: 'medium',
        players: '1 Player',
        description: 'Stack blocks, clear lines, beat the pace.',
        color: '#00f5ff'
    },
    {
        id: 'pacman',
        name: 'Pac-Man',
        icon: GAME_ICONS.pacman,
        difficulty: 'medium',
        players: '1 Player',
        description: 'Navigate mazes, dodge ghosts, chase dots.',
        color: '#ffcc00'
    },
    {
        id: 'tower-defense',
        name: 'Tower Defense',
        icon: GAME_ICONS['tower-defense'],
        difficulty: 'hard',
        players: '1 Player',
        description: 'Strategic warfare against endless waves.',
        color: '#ff0080'
    },
    {
        id: 'toonshooter',
        name: 'Toon Shooter',
        icon: GAME_ICONS.toonshooter,
        difficulty: 'medium',
        players: '2 Players',
        description: 'Frantic multiplayer arena battles.',
        color: '#ff6b35'
    }
];

export class FeaturedCarousel {
    constructor() {
        this.currentIndex = 0;
        this.slider = null;
        this.dots = null;
        this.interval = null;
        this.isPlaying = true;
        this.autoPlayDelay = 4000;
        this.transitionDuration = 500;
    }

    init() {
        this.slider = document.getElementById('featured-slider');
        this.dots = document.getElementById('featured-dots');
        
        if (!this.slider) return;

        this.render();
        this.setupEvents();
        this.startAutoPlay();
        this.updateSlideContent();
    }

    render() {
        // Render slides - minimal design without icons
        this.slider.innerHTML = FEATURED_GAMES.map((game, index) => `
            <div class="featured-slide ${index === 0 ? 'active' : ''}" data-index="${index}" data-game="${game.id}">
                <div class="featured-game-info">
                    <h3 class="featured-game-title">${game.name}</h3>
                    <div class="featured-game-meta">
                        <span class="featured-game-difficulty difficulty-${game.difficulty}">${game.difficulty}</span>
                        <span class="featured-game-players">${game.players}</span>
                        <span class="featured-game-desc">${game.description}</span>
                    </div>
                </div>
                <button class="featured-play-btn" data-game="${game.id}" aria-label="Play ${game.name}">
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
            this.handleNavClick(() => this.prev());
        });

        nextBtn?.addEventListener('click', () => {
            this.handleNavClick(() => this.next());
        });

        // Dots navigation
        this.dots?.addEventListener('click', (e) => {
            if (e.target.classList.contains('featured-dot')) {
                const index = parseInt(e.target.dataset.index);
                this.handleNavClick(() => this.goTo(index));
            }
        });

        // Play buttons
        this.slider?.addEventListener('click', (e) => {
            const playBtn = e.target.closest('.featured-play-btn');
            if (playBtn) {
                const gameId = playBtn.dataset.game;
                this.launchGame(gameId);
            }
        });

        // Pause on hover
        const carousel = this.slider?.closest('.featured-carousel');
        carousel?.addEventListener('mouseenter', () => {
            this.pauseAutoPlay();
        });

        carousel?.addEventListener('mouseleave', () => {
            this.resumeAutoPlay();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.handleNavClick(() => this.prev());
            } else if (e.key === 'ArrowRight') {
                this.handleNavClick(() => this.next());
            }
        });

        // Touch/swipe support
        this.setupTouchEvents();
    }

    setupTouchEvents() {
        let touchStartX = 0;
        let touchEndX = 0;
        const minSwipeDistance = 50;

        this.slider?.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        this.slider?.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX, minSwipeDistance);
        }, { passive: true });
    }

    handleSwipe(startX, endX, minDistance) {
        const swipeDistance = endX - startX;
        if (Math.abs(swipeDistance) > minDistance) {
            if (swipeDistance > 0) {
                this.handleNavClick(() => this.prev());
            } else {
                this.handleNavClick(() => this.next());
            }
        }
    }

    handleNavClick(navAction) {
        this.pauseAutoPlay();
        navAction();
        this.resumeAutoPlay();
    }

    goTo(index) {
        if (index < 0) index = FEATURED_GAMES.length - 1;
        if (index >= FEATURED_GAMES.length) index = 0;

        if (index === this.currentIndex) return;

        this.currentIndex = index;
        
        // Use precise percentage for transform
        const translateX = -(index * 100);
        this.slider.style.transform = `translate3d(${translateX}%, 0, 0)`;

        // Update dots
        this.dots.querySelectorAll('.featured-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        // Update active slide class for styling
        this.slider.querySelectorAll('.featured-slide').forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
    }

    animateSlideChange(fromIndex, toIndex) {
        const slides = this.slider.querySelectorAll('.featured-slide');
        const fromSlide = slides[fromIndex];
        const toSlide = slides[toIndex];

        // Animate out current slide
        if (fromSlide) {
            fromSlide.style.animation = 'none';
            fromSlide.offsetHeight; // Trigger reflow
        }

        // Animate in new slide
        if (toSlide) {
            toSlide.style.animation = 'none';
            toSlide.offsetHeight; // Trigger reflow
            toSlide.style.animation = 'slideContentIn 0.5s ease forwards';
        }
    }

    updateSlideContent() {
        // Ensure first slide has animation
        const firstSlide = this.slider.querySelector('.featured-slide[data-index="0"]');
        if (firstSlide) {
            firstSlide.style.animation = 'slideContentIn 0.5s ease forwards';
        }
    }

    next() {
        this.goTo(this.currentIndex + 1);
    }

    prev() {
        this.goTo(this.currentIndex - 1);
    }

    startAutoPlay() {
        if (this.interval) return;
        this.isPlaying = true;
        this.interval = setInterval(() => {
            this.next();
        }, this.autoPlayDelay);
    }

    pauseAutoPlay() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            this.isPlaying = false;
        }
    }

    resumeAutoPlay() {
        // Small delay before resuming to avoid immediate transition after interaction
        setTimeout(() => {
            this.startAutoPlay();
        }, 500);
    }

    launchGame(gameId) {
        // Add a subtle click animation before launching
        const slide = this.slider.querySelector(`.featured-slide[data-game="${gameId}"]`);
        if (slide) {
            slide.style.transform = 'scale(0.98)';
            setTimeout(() => {
                slide.style.transform = '';
                eventBus.emit('featuredGameSelected', { gameId });
            }, 150);
        } else {
            eventBus.emit('featuredGameSelected', { gameId });
        }
    }

    destroy() {
        this.pauseAutoPlay();
    }
}

// Singleton instance
export const featuredCarousel = new FeaturedCarousel();
export default FeaturedCarousel;
