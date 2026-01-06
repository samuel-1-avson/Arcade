/**
 * SystemMenu - Unified In-Game Pause & Settings Menu
 */
import { gameLoaderService } from '../services/GameLoaderService.js';
import { navigationService } from '../services/NavigationService.js';
import { audioService } from '../services/AudioService.js';

class SystemMenu {
    constructor() {
        this.container = null;
        this.overlay = null;
        this.isVisible = false;
        
        // Cache bind
        this.toggle = this.toggle.bind(this);
    }

    init() {
        if (document.getElementById('system-menu')) return;

        this.createOverlay();
        
        // Register with Navigation Service
        navigationService.registerSystemMenu(this.toggle);
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'system-menu';
        this.overlay.className = 'system-menu hidden';
        this.overlay.innerHTML = `
            <div class="system-menu-backdrop"></div>
            <div class="system-menu-panel">
                <div class="system-menu-header">
                    <h2>PAUSED</h2>
                    <div class="system-status">
                        <span id="sys-battery">🔋 100%</span>
                        <span id="sys-time">12:00</span>
                    </div>
                </div>
                
                <div class="system-menu-content">
                    <button class="sys-btn primary" id="sys-resume">
                        <span class="icon">▶️</span> Resume Game
                    </button>
                    
                    <div class="sys-divider"></div>
                    
                    <button class="sys-btn" id="sys-settings">
                        <span class="icon">⚙️</span> Settings
                    </button>
                    
                    <button class="sys-btn" id="sys-controls">
                        <span class="icon">🎮</span> Controls
                    </button>
                    
                    <div class="sys-divider"></div>
                    
                    <button class="sys-btn danger" id="sys-exit">
                        <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1em; height: 1em;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg></span> Exit to Hub
                    </button>
                </div>
                
                <div class="system-menu-footer">
                    Game Paused. Press ESC to Resume.
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        // Bind Events
        this.overlay.querySelector('#sys-resume').addEventListener('click', () => this.toggle(false));
        this.overlay.querySelector('#sys-exit').addEventListener('click', () => this.exitGame());
        
        this.overlay.querySelector('.system-menu-backdrop').addEventListener('click', () => this.toggle(false));
        
        // Start Time Update
        setInterval(() => {
            const now = new Date();
            const timeEl = this.overlay.querySelector('#sys-time');
            if (timeEl) timeEl.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }, 10000);
    }

    toggle(forceState = null) {
        if (forceState !== null) {
            this.isVisible = forceState;
        } else {
            this.isVisible = !this.isVisible;
        }

        if (this.isVisible) {
            this.overlay.classList.remove('hidden');
            this.overlay.classList.add('visible');
            gameLoaderService.pauseGame();
            audioService.playSFX('ui_open');
        } else {
            this.overlay.classList.remove('visible');
            setTimeout(() => this.overlay.classList.add('hidden'), 200);
            gameLoaderService.resumeGame();
            audioService.playSFX('ui_close');
        }
    }

    exitGame() {
        this.toggle(false);
        gameLoaderService.closeGame();
        audioService.playSFX('notification');
    }
}

export const systemMenu = new SystemMenu();
