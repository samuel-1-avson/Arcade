/**
 * GameLoaderService - SPA Game Manager
 * Loads games into an iframe to maintain Hub state (music, party, etc.)
 */
import { eventBus } from '../engine/EventBus.js';
import { backgroundService } from './BackgroundService.js';
import { transitionService } from './TransitionService.js';
import { audioService } from './AudioService.js';
import { globalStateManager } from './GlobalStateManager.js';
import { leaderboardService } from './LeaderboardService.js';
import { notificationService } from './NotificationService.js';
import { hudService } from './HudService.js';
import { liveEventService } from './LiveEventService.js';
import { artifactService } from './ArtifactService.js';
import { navigationService } from './NavigationService.js';
import { systemMenu } from '../components/SystemMenu.js';

class GameLoaderService {
    constructor() {
        this.activeGameId = null;
        this.viewport = null;
        this.iframe = null;
        this.overlay = null;
        this.initialized = false;
        
        // Monitoring
        this.lastHeartbeat = 0;
        this.healthCheckInterval = null;
        this.handshakeAcknowledged = false;
        
        // Settings Sync
        this.handleSettingsChange = this.handleSettingsChange.bind(this);
    }

    init() {
        if (this.initialized) return;

        this.viewport = document.getElementById('game-viewport');
        this.iframe = document.getElementById('game-frame');
        
        window.addEventListener('message', (event) => this.handleMessage(event));
        
        // Listen for global settings changes
        eventBus.on('globalStateChange', this.handleSettingsChange);

        // Listen for ESC key to toggle Hub Overlay (Pause)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeGameId) {
                this.togglePause();
            }
        });

        // Start Health Monitor
        this._startHealthMonitor();

        // Init HUD
        hudService.init();

        // Init Live Events
        liveEventService.init();

        // Init Artifacts
        artifactService.init();

        // Init System Menu
        systemMenu.init();

        this.initialized = true;
        console.log('GameLoaderService initialized (with Health Monitoring)');
    }

    loadGame(game) {
        if (!this.viewport || !this.iframe) return;

        this.activeGameId = game.id;
        this.handshakeAcknowledged = false;
        this.lastHeartbeat = Date.now();

        const loadLogic = () => {
            this.viewport.classList.remove('hidden');
            this.viewport.classList.add('viewport-active');

            this.iframe.src = game.path;
            this.iframe.focus();
            
            // Send initial settings once loaded
            this.iframe.onload = () => {
                this.syncSettings();
                this.sendToGame('GAME_Resume'); // Ensure it starts unpaused
            };
        };

        // Use transition service if available
        if (transitionService) {
            transitionService.enterGame(loadLogic);
        } else {
            loadLogic();
        }

        // Update Navigation Context
        navigationService.setContext('GAME');
        
        // Update HUD Mode based on game config or default
        // Games can define this in their manifest
        const hudMode = game.hudMode || 'GAME_MINIMAL';
        hudService.setMode(hudMode);
        hudService.show();
        
        backgroundService.setTheme(game.id);
        console.log(`Launched ${game.title} (SPA Mode)`);
    }

    closeGame() {
        if (!this.activeGameId) return;

        const closeLogic = () => {
            backgroundService.setPaused(false);
            backgroundService.setTheme('default');
            this.viewport.classList.add('hidden');
            this.iframe.src = 'about:blank';
            this.activeGameId = null;
            this.handshakeAcknowledged = false;
            
            // Reset Navigation Context
            navigationService.setContext('HUB');
            hudService.setMode('HUB');
            hudService.hide(); // Or keep shown if we want HUB hud immediately
        };

        if (transitionService) {
            transitionService.exitGame();
            setTimeout(closeLogic, 800); // Wait for transition fade back
        } else {
             closeLogic();
        }
    }

    sendToGame(type, payload = {}) {
        if (this.iframe && this.iframe.contentWindow) {
            this.iframe.contentWindow.postMessage({ type, ...payload }, window.location.origin);
        }
    }

    syncSettings() {
        const profile = globalStateManager.getProfile();
        const buffs = artifactService.getActiveBuffs();
        
        this.sendToGame('SETTINGS_UPDATE', {
            ...profile.preferences,
            buffs: buffs
        });
    }

    handleSettingsChange({ type, data }) {
        if (this.activeGameId && (type === 'profile' || type === 'artifact')) {
            // Re-sync on profile or artifact updates
            this.syncSettings();
        }
    }

    togglePause() {
        this.sendToGame('GAME_PAUSE_TOGGLE');
    }

    pauseGame() {
        this.sendToGame('GAME_PAUSE');
    }

    resumeGame() {
        this.sendToGame('GAME_RESUME');
    }

    handleMessage(event) {
        // Security check
        if (event.origin !== window.location.origin && !event.origin.includes('localhost')) return;

        const data = event.data;
        if (!data || !data.type) return;

        const payload = data.payload || {};

        switch (data.type) {
            case 'GAME_EXIT':
                this.closeGame();
                break;
            
            case 'GAME_READY':
            case 'GAME_LOADED':
                console.log(`[Hub] Game ready: ${payload.gameId || this.activeGameId}`);
                if (payload.gameId) this.activeGameId = payload.gameId;
                this.handshakeAcknowledged = true;
                this.lastHeartbeat = Date.now();
                
                // Acknowledge handshake back to game
                this.sendToGame('HUB_HANDSHAKE_ACK', { gameId: this.activeGameId });
                this.syncSettings();
                break;

            case 'GAME_HEARTBEAT':
                this.lastHeartbeat = Date.now();
                break;

            case 'UNLOCK_ACHIEVEMENT':
            case 'ACHIEVEMENT_UNLOCK':
                if (payload.achievementId || payload.id) {
                    const aid = payload.achievementId || payload.id;
                    const gid = payload.gameId || this.activeGameId;
                    globalStateManager.recordAchievement(gid, aid);
                    
                    notificationService.success(`Achievement Unlocked!`);
                    audioService.playSFX('achievement');
                }
                break;

            case 'SUBMIT_SCORE':
                if (payload.score) {
                    const gid = payload.gameId || this.activeGameId;
                    leaderboardService.submitScore(gid, payload.score);
                    
                    // Check live event progress
                    liveEventService.checkProgress(gid, payload.score);
                }
                break;

            case 'SAVE_PROGRESS':
                if (payload.data) {
                    const gid = payload.gameId || this.activeGameId;
                    globalStateManager.saveGameProgress(gid, payload.data);
                    console.log(`[Hub] Progress saved for ${gid}`, payload.data);
                    notificationService.info('Progress Synced');
                }
                break;
        }
    }

    _startHealthMonitor() {
        if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = setInterval(() => {
            if (this.activeGameId && this.handshakeAcknowledged) {
                const now = Date.now();
                const diff = (now - this.lastHeartbeat) / 1000;
                
                if (diff > 15) {
                    console.warn(`[Hub] Game ${this.activeGameId} is unresponsive (No heartbeat for ${Math.round(diff)}s)`);
                    // Optional: Recovery logic or UI warning
                }
            }
        }, 10000);
    }
}

export const gameLoaderService = new GameLoaderService();
export default GameLoaderService;
