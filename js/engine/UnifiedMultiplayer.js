/**
 * UnifiedMultiplayer - Base class for all game multiplayer systems
 * Provides common room management, player sync, chat, and lobby functionality
 * 
 * Usage:
 * class MyGameMultiplayer extends UnifiedMultiplayer {
 *     constructor(game) {
 *         super('my-game', game);
 *     }
 *     
 *     getGameConfig() {
 *         return { maxPlayers: 4, modes: ['coop', 'versus'] };
 *     }
 *     
 *     onGameStart() { this.game.startMultiplayerGame(); }
 *     onGameAction(action) { ... }
 * }
 */

// Player colors for visual distinction
export const PLAYER_COLORS = [
    { fill: '#ffff00', stroke: '#cccc00', name: 'Yellow' },
    { fill: '#00ffff', stroke: '#00cccc', name: 'Cyan' },
    { fill: '#ff66ff', stroke: '#cc44cc', name: 'Pink' },
    { fill: '#66ff66', stroke: '#44cc44', name: 'Green' },
    { fill: '#ff9933', stroke: '#cc7722', name: 'Orange' },
    { fill: '#9966ff', stroke: '#7744cc', name: 'Purple' }
];

// Multiplayer modes
export const MP_MODES = {
    COOP: {
        id: 'coop',
        name: 'Co-op',
        icon: '🤝',
        description: 'Work together as a team',
        defaultMaxPlayers: 4
    },
    VERSUS: {
        id: 'versus',
        name: 'Versus',
        icon: '⚔️',
        description: 'Compete against each other',
        defaultMaxPlayers: 2
    },
    SPECTATE: {
        id: 'spectate',
        name: 'Spectate',
        icon: '👁️',
        description: 'Watch others play',
        defaultMaxPlayers: 10
    }
};

// Connection states
export const CONNECTION_STATE = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    IN_LOBBY: 'lobby',
    PLAYING: 'playing',
    SPECTATING: 'spectating',
    ERROR: 'error'
};

/**
 * UnifiedMultiplayer Base Class
 */
export class UnifiedMultiplayer {
    /**
     * @param {string} gameId - Unique game identifier (e.g., 'pacman', 'tetris')
     * @param {Object} game - Reference to the game instance
     */
    constructor(gameId, game) {
        this.gameId = gameId;
        this.game = game;
        
        // Firebase references
        this.db = null;
        this.roomRef = null;
        
        // Room state
        this.roomCode = null;
        this.isHost = false;
        this.mode = MP_MODES.COOP;
        
        // Player state
        this.playerId = this.generatePlayerId();
        this.playerName = this.loadPlayerName();
        this.playerColor = PLAYER_COLORS[0];
        this.playerIndex = 0;
        
        // Room data
        this.players = new Map();
        this.connectionState = CONNECTION_STATE.DISCONNECTED;
        
        // Listeners
        this.listeners = [];
        this.eventCallbacks = new Map();
        
        // Sync intervals
        this.syncInterval = null;
        this.lastSyncTime = 0;
    }

    // ============ ABSTRACT METHODS (Override in subclass) ============

    /**
     * Get game-specific configuration
     * @returns {Object} { maxPlayers, modes, syncRate, ... }
     */
    getGameConfig() {
        return {
            maxPlayers: 4,
            modes: [MP_MODES.COOP, MP_MODES.VERSUS],
            syncRateMs: 50, // Position sync rate in milliseconds
            roomPrefix: this.gameId // e.g., 'pacman_rooms'
        };
    }

    /**
     * Get starting positions for players
     * @returns {Object[]} Array of { x, y } positions
     */
    getStartPositions() {
        return [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 }
        ];
    }

    /**
     * Called when game should start
     * Override to trigger your game's start logic
     */
    onGameStart() {
        console.log('[UnifiedMultiplayer] Game starting - override this method');
    }

    /**
     * Called when remote player sends an action
     * @param {Object} action - { type, playerId, data }
     */
    onGameAction(action) {
        console.log('[UnifiedMultiplayer] Received action:', action);
    }

    /**
     * Called when a remote player updates their state
     * @param {string} playerId
     * @param {Object} state
     */
    onPlayerStateUpdate(playerId, state) {
        // Override to handle player state updates
    }

    // ============ INITIALIZATION ============

    /**
     * Initialize Firebase RTDB connection
     */
    async init() {
        try {
            if (typeof firebase === 'undefined' || !firebase.database) {
                console.warn('[UnifiedMultiplayer] Firebase RTDB not available');
                return false;
            }
            
            this.db = firebase.database();
            this.connectionState = CONNECTION_STATE.CONNECTED;
            return true;
        } catch (error) {
            console.error('[UnifiedMultiplayer] Init failed:', error);
            this.connectionState = CONNECTION_STATE.ERROR;
            return false;
        }
    }

    // ============ PLAYER MANAGEMENT ============

    generatePlayerId() {
        return `${this.gameId}_${Math.random().toString(36).substring(2, 11)}`;
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    loadPlayerName() {
        return localStorage.getItem(`${this.gameId}_player_name`) || 'Player';
    }

    setPlayerName(name) {
        this.playerName = name?.trim() || 'Player';
        localStorage.setItem(`${this.gameId}_player_name`, this.playerName);
        
        // Update in room if connected
        if (this.roomRef && this.playerId) {
            this.roomRef.child(`players/${this.playerId}/name`).set(this.playerName);
        }
    }

    // ============ ROOM MANAGEMENT ============

    /**
     * Create a new multiplayer room
     * @param {string} modeId - 'coop' or 'versus'
     * @param {Object} options - Additional room options
     */
    async createRoom(modeId = 'coop', options = {}) {
        if (!this.db) {
            const initialized = await this.init();
            if (!initialized) throw new Error('Firebase not available');
        }

        this.roomCode = this.generateRoomCode();
        this.isHost = true;
        this.playerIndex = 0;
        this.playerColor = PLAYER_COLORS[0];
        this.mode = modeId === 'versus' ? MP_MODES.VERSUS : MP_MODES.COOP;

        const config = this.getGameConfig();
        const startPos = this.getStartPositions()[0];

        this.roomRef = this.db.ref(`${config.roomPrefix}_rooms/${this.roomCode}`);
        
        const roomData = {
            host: this.playerId,
            gameId: this.gameId,
            gameState: 'waiting',
            mode: this.mode.id,
            maxPlayers: options.maxPlayers || this.mode.defaultMaxPlayers,
            settings: options.settings || {},
            players: {
                [this.playerId]: {
                    name: this.playerName,
                    color: this.playerColor,
                    index: 0,
                    position: startPos,
                    score: 0,
                    isHost: true,
                    ready: false,
                    lastActive: firebase.database.ServerValue.TIMESTAMP
                }
            },
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        await this.roomRef.set(roomData);
        
        this.setupListeners();
        this.startSyncLoop();
        
        this.connectionState = CONNECTION_STATE.IN_LOBBY;
        this.emitEvent('roomCreated', { roomCode: this.roomCode });
        
        return this.roomCode;
    }

    /**
     * Join an existing room
     * @param {string} code - 6-character room code
     */
    async joinRoom(code) {
        if (!this.db) {
            const initialized = await this.init();
            if (!initialized) throw new Error('Firebase not available');
        }

        this.roomCode = code.toUpperCase();
        const config = this.getGameConfig();
        this.roomRef = this.db.ref(`${config.roomPrefix}_rooms/${this.roomCode}`);
        
        const snapshot = await this.roomRef.once('value');
        if (!snapshot.exists()) {
            throw new Error('Room not found');
        }

        const roomData = snapshot.val();
        
        if (roomData.gameState === 'playing') {
            throw new Error('Game already in progress');
        }
        
        const playerCount = Object.keys(roomData.players || {}).length;
        const maxPlayers = roomData.maxPlayers || 4;
        
        if (playerCount >= maxPlayers) {
            throw new Error(`Room is full (max ${maxPlayers} players)`);
        }

        this.playerIndex = playerCount;
        this.playerColor = PLAYER_COLORS[playerCount % PLAYER_COLORS.length];
        this.isHost = false;
        this.mode = roomData.mode === 'versus' ? MP_MODES.VERSUS : MP_MODES.COOP;

        const startPos = this.getStartPositions()[playerCount] || { x: 0, y: 0 };

        await this.roomRef.child(`players/${this.playerId}`).set({
            name: this.playerName,
            color: this.playerColor,
            index: this.playerIndex,
            position: startPos,
            score: 0,
            isHost: false,
            ready: false,
            lastActive: firebase.database.ServerValue.TIMESTAMP
        });

        this.setupListeners();
        this.startSyncLoop();
        
        this.connectionState = CONNECTION_STATE.IN_LOBBY;
        this.emitEvent('roomJoined', { roomCode: this.roomCode });

        return true;
    }

    /**
     * Leave the current room
     */
    async leaveRoom() {
        this.stopSyncLoop();
        this.removeListeners();

        if (this.roomRef && this.playerId) {
            await this.roomRef.child(`players/${this.playerId}`).remove();
            
            // If host leaves, delete room
            if (this.isHost) {
                await this.roomRef.remove();
            }
        }

        this.roomRef = null;
        this.roomCode = null;
        this.isHost = false;
        this.players.clear();
        this.connectionState = CONNECTION_STATE.DISCONNECTED;
        
        this.emitEvent('roomLeft', {});
    }

    // ============ GAME STATE ============

    /**
     * Set player ready status
     */
    async setReady(ready = true) {
        if (!this.roomRef) return;
        
        await this.roomRef.child(`players/${this.playerId}/ready`).set(ready);
        this.emitEvent('readyChanged', { ready });
    }

    /**
     * Start the game (host only)
     */
    async startGame() {
        if (!this.isHost || !this.roomRef) return;

        await this.roomRef.update({
            gameState: 'playing',
            startedAt: firebase.database.ServerValue.TIMESTAMP
        });
    }

    /**
     * End the game
     * @param {Object} results - Game results { winnerId, scores }
     */
    async endGame(results = {}) {
        if (!this.roomRef) return;

        await this.roomRef.update({
            gameState: 'finished',
            results,
            finishedAt: firebase.database.ServerValue.TIMESTAMP
        });
    }

    // ============ DATA SYNC ============

    /**
     * Send local player state to room
     * @param {Object} state - Player state to sync
     */
    syncState(state) {
        if (!this.roomRef || this.connectionState !== CONNECTION_STATE.PLAYING) return;

        const now = Date.now();
        const config = this.getGameConfig();
        
        // Throttle sync rate
        if (now - this.lastSyncTime < config.syncRateMs) return;
        this.lastSyncTime = now;

        this.roomRef.child(`players/${this.playerId}`).update({
            ...state,
            lastActive: firebase.database.ServerValue.TIMESTAMP
        });
    }

    /**
     * Broadcast a game action to all players
     * @param {string} type - Action type
     * @param {Object} data - Action data
     */
    broadcastAction(type, data = {}) {
        if (!this.roomRef) return;

        this.roomRef.child('actions').push({
            type,
            playerId: this.playerId,
            data,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    /**
     * Send a chat message
     * @param {string} message
     */
    sendChat(message) {
        if (!this.roomRef || !message.trim()) return;

        this.roomRef.child('chat').push({
            playerId: this.playerId,
            playerName: this.playerName,
            message: message.trim(),
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    // ============ LISTENERS ============

    setupListeners() {
        if (!this.roomRef) return;

        // Listen for player changes
        const playersRef = this.roomRef.child('players');
        const playersListener = playersRef.on('value', (snapshot) => {
            const players = snapshot.val() || {};
            this.players.clear();
            for (const [id, data] of Object.entries(players)) {
                this.players.set(id, { id, ...data });
                if (id !== this.playerId) {
                    this.onPlayerStateUpdate(id, data);
                }
            }
            this.emitEvent('playersChanged', { players: Array.from(this.players.values()) });
        });
        this.listeners.push({ ref: playersRef, event: 'value', callback: playersListener });

        // Listen for game state changes
        const stateRef = this.roomRef.child('gameState');
        const stateListener = stateRef.on('value', (snapshot) => {
            const state = snapshot.val();
            this.handleGameStateChange(state);
        });
        this.listeners.push({ ref: stateRef, event: 'value', callback: stateListener });

        // Listen for actions
        const actionsRef = this.roomRef.child('actions');
        const actionsListener = actionsRef.on('child_added', (snapshot) => {
            const action = snapshot.val();
            if (action.playerId !== this.playerId) {
                this.onGameAction(action);
            }
        });
        this.listeners.push({ ref: actionsRef, event: 'child_added', callback: actionsListener });

        // Listen for chat
        const chatRef = this.roomRef.child('chat');
        const chatListener = chatRef.orderByChild('timestamp').limitToLast(50).on('child_added', (snapshot) => {
            const msg = snapshot.val();
            this.emitEvent('chatMessage', msg);
        });
        this.listeners.push({ ref: chatRef, event: 'child_added', callback: chatListener });

        // Handle disconnect
        this.roomRef.child(`players/${this.playerId}`).onDisconnect().remove();
    }

    removeListeners() {
        for (const listener of this.listeners) {
            listener.ref.off(listener.event, listener.callback);
        }
        this.listeners = [];
    }

    handleGameStateChange(state) {
        switch (state) {
            case 'playing':
                if (this.connectionState !== CONNECTION_STATE.PLAYING) {
                    this.connectionState = CONNECTION_STATE.PLAYING;
                    this.onGameStart();
                    this.emitEvent('gameStart', {});
                }
                break;
            case 'finished':
                this.connectionState = CONNECTION_STATE.IN_LOBBY;
                this.emitEvent('gameEnd', {});
                break;
            case 'waiting':
                this.connectionState = CONNECTION_STATE.IN_LOBBY;
                break;
        }
    }

    // ============ SYNC LOOP ============

    startSyncLoop() {
        const config = this.getGameConfig();
        this.syncInterval = setInterval(() => {
            if (this.roomRef && this.playerId) {
                this.roomRef.child(`players/${this.playerId}/lastActive`)
                    .set(firebase.database.ServerValue.TIMESTAMP);
            }
        }, 10000); // Heartbeat every 10 seconds
    }

    stopSyncLoop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    // ============ EVENT SYSTEM ============

    /**
     * Register event callback
     * @param {string} event - Event name
     * @param {Function} callback
     */
    on(event, callback) {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event).push(callback);
    }

    /**
     * Remove event callback
     */
    off(event, callback) {
        const callbacks = this.eventCallbacks.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index !== -1) callbacks.splice(index, 1);
        }
    }

    emitEvent(event, data) {
        const callbacks = this.eventCallbacks.get(event);
        if (callbacks) {
            for (const cb of callbacks) {
                try { cb(data); } catch (e) { console.error(e); }
            }
        }
    }

    // ============ UTILITY ============

    /**
     * Get other players (excluding self)
     */
    getOtherPlayers() {
        return Array.from(this.players.values()).filter(p => p.id !== this.playerId);
    }

    /**
     * Get all players sorted by score
     */
    getPlayersByScore() {
        return Array.from(this.players.values()).sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    /**
     * Check if all players are ready
     */
    allPlayersReady() {
        for (const player of this.players.values()) {
            if (!player.ready) return false;
        }
        return this.players.size > 0;
    }

    /**
     * Get room info for display
     */
    getRoomInfo() {
        return {
            roomCode: this.roomCode,
            gameId: this.gameId,
            mode: this.mode,
            isHost: this.isHost,
            playerCount: this.players.size,
            connectionState: this.connectionState
        };
    }
}

export default UnifiedMultiplayer;
