/**
 * HubSDK - Standardized Game-to-Hub Communication (AAA Version)
 * 
 * This is the unified communication bridge for the Arcade Hub.
 * It handles handshakes, state sync, achievements, and scores.
 */
export class HubSDK {
    constructor() {
        this.initialized = false;
        this.gameId = null;
        this.hubOrigin = window.location.origin;
        this.callbacks = {
            onPause: [],
            onResume: [],
            onSettings: [],
            onMute: [],
            onUnmute: []
        };
        
        this.handshakeComplete = false;
        this.heartbeatInterval = null;
        
        // Bind context
        this.handleMessage = this.handleMessage.bind(this);
    }

    /**
     * Initialize the SDK and handshake with the Hub
     * @param {Object} config - { gameId: 'my-game' }
     */
    init(config = {}) {
        if (this.initialized) return;

        this.gameId = config.gameId || this._detectGameId();
        
        // Listen for messages from Hub
        window.addEventListener('message', this.handleMessage);

        // Signal ready to Hub (Master handshake)
        this._send('GAME_READY', { 
            gameId: this.gameId,
            version: '2.0.0-AAA'
        });

        // Start Heartbeat (keeps connection alive and lets Hub monitor health)
        this._startHeartbeat();

        this.initialized = true;
        console.log(`[HubSDK] Master Bridge Initialized for ${this.gameId}`);
    }

    /**
     * Unlock an achievement
     * @param {string} achievementId - Unique ID of the achievement
     */
    unlockAchievement(achievementId) {
        this._send('UNLOCK_ACHIEVEMENT', { 
            gameId: this.gameId, 
            achievementId 
        });
    }

    /**
     * Submit a score to the leaderboard
     * @param {number} score - The score value
     */
    submitScore(score) {
        this._send('SUBMIT_SCORE', { 
            gameId: this.gameId, 
            score 
        });
    }

    /**
     * Save game progress
     * @param {Object} data - Arbitrary save data
     */
    saveProgress(data) {
        this._send('SAVE_PROGRESS', { 
            gameId: this.gameId, 
            data 
        });
    }

    /**
     * Exit game and return to Hub
     */
    exitGame() {
        this._send('GAME_EXIT', { gameId: this.gameId });
    }

    /**
     * Event Listeners
     */
    onPause(callback) { this.callbacks.onPause.push(callback); }
    onResume(callback) { this.callbacks.onResume.push(callback); }
    onSettings(callback) { this.callbacks.onSettings.push(callback); }
    onMute(callback) { this.callbacks.onMute.push(callback); }
    onUnmute(callback) { this.callbacks.onUnmute.push(callback); }

    /**
     * Internal message handler
     * @param {MessageEvent} event 
     */
    handleMessage(event) {
        // Security check
        if (event.origin !== this.hubOrigin && !event.origin.includes('localhost')) return;
        
        const { type, ...payload } = event.data;

        switch (type) {
            case 'GAME_PAUSE':
            case 'PAUSE_GAME':
                this.callbacks.onPause.forEach(cb => cb());
                break;
            case 'GAME_RESUME':
            case 'RESUME_GAME':
                this.callbacks.onResume.forEach(cb => cb());
                break;
            case 'SETTINGS_UPDATE':
                this.callbacks.onSettings.forEach(cb => cb(payload));
                // Auto-mute if audio preferences are here
                if (payload.soundEnabled === false) this.callbacks.onMute.forEach(cb => cb());
                if (payload.soundEnabled === true) this.callbacks.onUnmute.forEach(cb => cb());
                break;
            case 'MUTE_AUDIO':
                this.callbacks.onMute.forEach(cb => cb());
                break;
            case 'UNMUTE_AUDIO':
                this.callbacks.onUnmute.forEach(cb => cb());
                break;
            case 'HUB_HANDSHAKE_ACK':
                this.handshakeComplete = true;
                break;
        }
    }

    /**
     * Internal sender
     * @param {string} type 
     * @param {Object} payload 
     */
    _send(type, payload) {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type, payload: payload || {} }, '*');
        } else {
            console.warn('[HubSDK] No parent window found. Running standalone?');
            // Standalone fallback: redirects if exit is called
            if (type === 'GAME_EXIT') {
                 const hubPath = window.location.pathname.includes('/games/') ? '../../index.html' : './index.html';
                 window.location.href = hubPath;
            }
        }
    }

    /**
     * Heartbeat to let Hub know game is still responsive
     */
    _startHeartbeat() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => {
            this._send('GAME_HEARTBEAT', { 
                gameId: this.gameId,
                timestamp: Date.now() 
            });
        }, 5000);
    }

    /**
     * Try to detect game ID from URL or meta tags
     */
    _detectGameId() {
        const path = window.location.pathname;
        const parts = path.split('/');
        // Assuming /games/{gameId}/index.html
        const id = parts[parts.length - 2];
        return id && id !== 'games' ? id : 'unknown-game';
    }
}

// Export as singleton
export const hubSDK = new HubSDK();

// Backward compatibility with older GameBridge naming
export const GameBridge = {
    init: (cfg) => hubSDK.init(cfg),
    send: (t, p) => hubSDK._send(t, p),
    on: (e, cb) => {
        if (e === 'pause') hubSDK.onPause(cb);
        if (e === 'resume') hubSDK.onResume(cb);
        if (e === 'settings') hubSDK.onSettings(cb);
    },
    unlockAchievement: (id) => hubSDK.unlockAchievement(id),
    submitScore: (s) => hubSDK.submitScore(s),
    exitGame: () => hubSDK.exitGame(),
    ready: () => hubSDK.init() 
};

// Global Exposure for non-module games
if (typeof window !== 'undefined') {
    window.HubSDK = hubSDK;
    window.GameBridge = GameBridge;
}

export default hubSDK;
