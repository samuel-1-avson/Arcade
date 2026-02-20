/**
 * Navigation Module
 * Handles navigation, routing, and section switching
 */

import { eventBus } from '../engine/EventBus.js';
import { gameLoaderService } from '../services/GameLoaderService.js';
import { zenModeService } from '../services/ZenModeService.js';
import { audioService } from '../services/AudioService.js';

export class NavigationManager {
    constructor(app) {
        this.app = app;
        this.navItems = null;
        this.mobileMenuBtn = null;
        this.sidebar = null;
    }

    init() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
        this.sidebar = document.getElementById('hub-sidebar');

        this.setupNavListeners();
        this.setupMobileMenu();
        this.setupKeyboardShortcuts();
    }

    setupNavListeners() {
        this.navItems.forEach(item => {
            if (item) {  // Null check
                item.addEventListener('click', (e) => this.handleNavClick(e.currentTarget));
            }
        });

        // Setup modal close buttons
        this.setupModalCloseButtons();
    }

    setupModalCloseButtons() {
        // Map close button IDs to their modal IDs
        const closeButtonMap = {
            'tournaments-close-btn': 'tournaments-modal',
            'challenges-close-btn': 'challenges-modal',
            'bracket-close-btn': 'bracket-modal',
            'modal-close': 'auth-modal'
        };

        Object.entries(closeButtonMap).forEach(([buttonId, modalId]) => {
            const button = document.getElementById(buttonId);
            const modal = document.getElementById(modalId);
            
            if (button && modal) {
                button.addEventListener('click', () => {
                    modal.classList.add('hidden');
                    audioService.playSFX('click');
                });
            }
        });

        // Also handle backdrop clicks for all modals
        document.querySelectorAll('.modal, .auth-modal').forEach(modal => {
            const backdrop = modal.querySelector('.modal-backdrop, .auth-modal-backdrop');
            if (backdrop) {
                backdrop.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
            }
        });
    }

    handleNavClick(target) {
        const section = target.dataset.section;
        const id = target.id;

        // Highlight Active
        this.navItems.forEach(n => n.classList.remove('active'));
        if (section) {
            document.querySelectorAll(`[data-section="${section}"]`).forEach(n => n.classList.add('active'));
        } else {
            target.classList.add('active');
        }

        // Scroll to Section
        if (section) {
            if (section === 'home') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const el = document.getElementById(`${section}-section`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else if (document.querySelector(`.${section}-section`)) {
                    document.querySelector(`.${section}-section`).scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }

        // Handle Specific Buttons
        this.handleModalButtons(id);
        this.handleMobileButtons(id);

        // Play sound
        audioService.playSFX('click');
    }

    handleModalButtons(id) {
        const modalMap = {
            'nav-leaderboard': 'leaderboard-modal',
            'nav-achievements': 'achievement-gallery',
            'nav-shop': 'shop-modal',
            'nav-settings': 'settings-modal',
            'nav-tournaments': 'tournaments-modal',
            'nav-challenges': 'challenges-modal'
        };

        if (modalMap[id]) {
            const modal = document.getElementById(modalMap[id]);
            if (modal) {
                modal.classList.remove('hidden');
                if (id === 'nav-leaderboard') {
                    this.app.loadLeaderboard('global');
                } else if (id === 'nav-achievements') {
                    this.app.renderAchievementGallery();
                }
            }
        }
    }

    handleMobileButtons(id) {
        if (id === 'mobile-nav-shop') {
            document.getElementById('shop-modal')?.classList.remove('hidden');
        } else if (id === 'mobile-nav-tournaments') {
            document.getElementById('tournaments-modal')?.classList.remove('hidden');
        } else if (id === 'mobile-play-btn') {
            document.getElementById('games-grid')?.scrollIntoView({ behavior: 'smooth' });
        }

        if (id === 'nav-zen-mode') {
            zenModeService.enter();
        }
    }

    setupMobileMenu() {
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => {
                document.getElementById('settings-modal')?.classList.remove('hidden');
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Number keys 1-4 for category filters
            if (e.code >= 'Digit1' && e.code <= 'Digit4') {
                const filters = ['all', 'easy', 'medium', 'hard'];
                const index = parseInt(e.code.replace('Digit', '')) - 1;
                const tab = document.querySelector(`[data-filter="${filters[index]}"]`);
                if (tab) tab.click();
            }

            // ESC to close game
            if (e.key === 'Escape' && gameLoaderService.activeGameId) {
                gameLoaderService.closeGame();
            }
        });
    }

    setActiveSection(section) {
        this.navItems.forEach(n => n.classList.remove('active'));
        document.querySelectorAll(`[data-section="${section}"]`).forEach(n => n.classList.add('active'));
    }
}

export default NavigationManager;
