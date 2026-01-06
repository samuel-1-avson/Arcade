/**
 * HudService - Manages the Global Overlay HUD
 * Synchronizes Hub state with the in-game overlay.
 */
import { eventBus } from '../engine/EventBus.js';
import { globalStateManager } from './GlobalStateManager.js';
import { economyService } from './EconomyService.js';
import { liveEventService } from './LiveEventService.js';

class HudService {
    constructor() {
        this.container = null;
        this.elements = {};
        this.initialized = false;
        this.isVisible = false;
        
        // HUD Modes: 'HUB', 'GAME_MINIMAL', 'GAME_IMMERSIVE'
        this.currentMode = 'HUB';
    }

    init() {
        if (this.initialized) return;

        this.container = document.getElementById('global-hud');
        if (!this.container) return;

        // Cache elements
        this.elements = {
            avatar: document.getElementById('hud-avatar'),
            name: document.getElementById('hud-name'),
            title: document.getElementById('hud-title'),
            coins: document.getElementById('hud-coins'),
            level: document.getElementById('hud-level'),
            xpFill: document.getElementById('hud-xp-fill'),
            menuBtn: document.getElementById('hud-menu-btn'),
            eventBanner: document.getElementById('hud-event-banner'),
            eventText: document.getElementById('hud-event-text'),
            eventTimer: document.getElementById('hud-event-timer'),
            // Groups for mode switching
            profileGroup: document.querySelector('.hud-profile'),
            statsGroup: document.querySelector('.hud-stats')
        };

        this._setupEventListeners();
        this.initialized = true;
        
        // Initial sync
        this.update();
        
        console.log('HudService initialized');
    }

    setMode(mode) {
        if (!this.container) return;
        this.currentMode = mode;
        this.container.dataset.mode = mode;
        
        console.log(`[HUD] Mode set to: ${mode}`);
        
        // Apply visual changes based on mode
        if (mode === 'GAME_MINIMAL') {
            this.container.classList.add('hud-minimal');
            this.container.classList.remove('hud-immersive');
            // Hide large elements
            if (this.elements.title) this.elements.title.style.display = 'none';
        } else if (mode === 'GAME_IMMERSIVE') {
            this.container.classList.add('hud-immersive');
            this.container.classList.remove('hud-minimal');
        } else {
            // HUB Mode
            this.container.classList.remove('hud-minimal', 'hud-immersive');
            if (this.elements.title) this.elements.title.style.display = 'block';
        }
        
        this.update();
    }

    show() {
        if (!this.container) return;
        this.container.classList.remove('hidden');
        this.isVisible = true;
        this.update();
    }

    hide() {
        if (!this.container) return;
        this.container.classList.add('hidden');
        this.isVisible = false;
    }

    update() {
        if (!this.initialized) return;

        const profile = globalStateManager.getProfile();
        const coins = economyService.getBalance();
        const xpProgress = globalStateManager.getLevelProgress();
        const activeEvent = liveEventService.getActiveEvent();

        if (this.elements.avatar) this.elements.avatar.textContent = profile.avatar || '🎮';
        if (this.elements.name) this.elements.name.textContent = profile.displayName;
        if (this.elements.title) {
            this.elements.title.textContent = profile.title;
            this.elements.title.style.color = profile.titleColor;
        }
        if (this.elements.coins) this.elements.coins.textContent = coins.toLocaleString();
        if (this.elements.level) this.elements.level.textContent = profile.level;
        if (this.elements.xpFill) {
            this.elements.xpFill.style.width = `${xpProgress.progress * 100}%`;
        }

        // Handle Event Banner - Only show in HUB mode typically
        if (activeEvent && this.currentMode === 'HUB') {
            if (this.elements.eventBanner) this.elements.eventBanner.classList.remove('hidden');
            if (this.elements.eventText) this.elements.eventText.textContent = activeEvent.description.toUpperCase();
            this._startEventCountdown(activeEvent);
        } else {
            if (this.elements.eventBanner) this.elements.eventBanner.classList.add('hidden');
        }
    }

    _startEventCountdown(event) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        const updateTimer = () => {
            const now = Date.now();
            const diff = event.expiresAt - now;
            if (diff <= 0) {
                if (this.elements.eventBanner) this.elements.eventBanner.classList.add('hidden');
                clearInterval(this.timerInterval);
                return;
            }
            
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            if (this.elements.eventTimer) {
                this.elements.eventTimer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
        };

        updateTimer();
        this.timerInterval = setInterval(updateTimer, 1000);
    }

    _setupEventListeners() {
        // Sync on state changes
        eventBus.on('globalStateChange', () => this.update());
        eventBus.on('currencyEarned', () => this.update());
        eventBus.on('currencySpent', () => this.update());
        eventBus.on('globalXPGain', () => this.update());
        eventBus.on('liveEventStarted', () => this.update());
        eventBus.on('liveEventCompleted', () => this.update());
        eventBus.on('liveEventExpired', () => this.update());

        // Toggle visibility based on game state
        eventBus.on('tournamentStarted', () => this.show());
        
        // Handle menu button
        if (this.elements.menuBtn) {
            this.elements.menuBtn.onclick = () => {
                // Emit system menu toggle event
                // This allows NavigationService to catch it if registered
                const nav = window.navigationService || document.querySelector('app-shell')?.navigationService;
                // Since we don't have direct access here easily without circular dep, use EventBus
                // But better yet, rely on the click handler setup elsewhere or add specific logic
                console.log('[HUD] Menu Clicked');
                
                // Simulate ESC key for handling logic if simpler
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            };
        }
    }
}

export const hudService = new HudService();
export default HudService;

