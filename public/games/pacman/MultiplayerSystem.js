/**
 * Pac-Man Multiplayer System
 * Real-time Co-op and Versus modes using Firebase Realtime Database
 */

// Player colors for Pac-Man characters
const PLAYER_COLORS = {
    PLAYER1: { fill: '#ffff00', stroke: '#cccc00', name: 'Yellow' },  // Classic Pac-Man
    PLAYER2: { fill: '#00ffff', stroke: '#00cccc', name: 'Cyan' },    // Ms. Pac-Man style
    PLAYER3: { fill: '#ff66ff', stroke: '#cc44cc', name: 'Pink' },    // Alternative
    PLAYER4: { fill: '#66ff66', stroke: '#44cc44', name: 'Green' }    // Alternative
};

const PLAYER_COLOR_LIST = Object.values(PLAYER_COLORS);

// Multiplayer game modes
export const MP_MODES = {
    COOP: {
        id: 'coop',
        name: 'Co-op',
        icon: '🤝',
        description: 'Work together! Share lives and clear all dots as a team.',
        maxPlayers: 4,
        sharedLives: true,
        sharedScore: true
    },
    VERSUS: {
        id: 'versus',
        name: 'Versus',
        icon: '⚔️',
        description: 'Compete for points! Highest score wins.',
        maxPlayers: 2,
        sharedLives: false,
        sharedScore: false
    }
};

/**
 * Pac-Man Multiplayer System Class
 */
export class PacManMultiplayer {
    constructor(game) {
        this.game = game;
        this.db = null;
        this.roomRef = null;
        this.roomCode = null;
        this.playerId = null;
        this.playerName = 'Player';
        this.playerColor = PLAYER_COLOR_LIST[0];
        this.playerIndex = 0;
        this.isHost = false;
        this.players = {};
        this.connected = false;
        this.mpMode = MP_MODES.COOP;
        this.listeners = [];
        this.positionUpdateInterval = null;
        this.lastSentPosition = { x: -1, y: -1 };
        
        // Generate unique player ID
        this.playerId = this.generatePlayerId();
        
        // Load player name from storage
        this.playerName = localStorage.getItem('pacman_player_name') || 'Player';
    }

    /**
     * Initialize Firebase RTDB connection
     */
    async init() {
        try {
            if (typeof firebase === 'undefined' || !firebase.database) {
                console.warn('Firebase RTDB not available for multiplayer');
                return false;
            }
            
            this.db = firebase.database();
            return true;
        } catch (error) {
            console.error('Failed to initialize multiplayer:', error);
            return false;
        }
    }

    /**
     * Generate unique player ID
     */
    generatePlayerId() {
        return 'pac_' + Math.random().toString(36).substring(2, 11);
    }

    /**
     * Generate 6-character room code
     */
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Set player name
     */
    setPlayerName(name) {
        this.playerName = name || 'Player';
        localStorage.setItem('pacman_player_name', this.playerName);
    }

    /**
     * Create a new multiplayer room
     */
    async createRoom(mode = 'coop', mapId = 'classic') {
        if (!this.db) {
            const initialized = await this.init();
            if (!initialized) {
                throw new Error('Firebase not available');
            }
        }

        this.roomCode = this.generateRoomCode();
        this.isHost = true;
        this.playerIndex = 0;
        this.playerColor = PLAYER_COLOR_LIST[0];
        this.mpMode = mode === 'versus' ? MP_MODES.VERSUS : MP_MODES.COOP;

        this.roomRef = this.db.ref(`pacman_rooms/${this.roomCode}`);
        
        const roomData = {
            host: this.playerId,
            gameState: 'waiting',
            mode: this.mpMode.id,
            mapId: mapId,
            sharedScore: 0,
            sharedLives: 3,
            dotsCollected: {},
            powerPelletsCollected: {},
            players: {
                [this.playerId]: {
                    name: this.playerName,
                    color: this.playerColor,
                    index: 0,
                    position: { x: 14, y: 23 },
                    direction: 'right',
                    score: 0,
                    lives: 3,
                    isHost: true,
                    lastActive: firebase.database.ServerValue.TIMESTAMP
                }
            },
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        await this.roomRef.set(roomData);
        
        this.setupListeners();
        this.startPositionSync();
        
        this.connected = true;
        
        return this.roomCode;
    }

    /**
     * Join an existing room
     */
    async joinRoom(code) {
        if (!this.db) {
            const initialized = await this.init();
            if (!initialized) {
                throw new Error('Firebase not available');
            }
        }

        this.roomCode = code.toUpperCase();
        this.roomRef = this.db.ref(`pacman_rooms/${this.roomCode}`);
        
        const snapshot = await this.roomRef.once('value');
        if (!snapshot.exists()) {
            throw new Error('Room not found');
        }

        const roomData = snapshot.val();
        
        if (roomData.gameState === 'playing') {
            throw new Error('Game already in progress');
        }
        
        const playerCount = Object.keys(roomData.players || {}).length;
        const maxPlayers = roomData.mode === 'versus' ? 2 : 4;
        
        if (playerCount >= maxPlayers) {
            throw new Error(`Room is full (max ${maxPlayers} players)`);
        }

        this.playerIndex = playerCount;
        this.playerColor = PLAYER_COLOR_LIST[playerCount];
        this.isHost = false;
        this.mpMode = roomData.mode === 'versus' ? MP_MODES.VERSUS : MP_MODES.COOP;

        // Different start positions for each player
        const startPositions = [
            { x: 14, y: 23 },
            { x: 13, y: 23 },
            { x: 14, y: 17 },
            { x: 13, y: 17 }
        ];

        await this.roomRef.child(`players/${this.playerId}`).set({
            name: this.playerName,
            color: this.playerColor,
            index: this.playerIndex,
            position: startPositions[this.playerIndex],
            direction: 'right',
            score: 0,
            lives: 3,
            isHost: false,
            lastActive: firebase.database.ServerValue.TIMESTAMP
        });

        this.setupListeners();
        this.startPositionSync();
        
        this.connected = true;

        return true;
    }

    /**
     * Set up Firebase listeners
     */
    setupListeners() {
        if (!this.roomRef) return;

        // Listen for player changes
        const playersRef = this.roomRef.child('players');
        const playersListener = playersRef.on('value', (snapshot) => {
            this.players = snapshot.val() || {};
            this.game.renderMultiplayerPlayers?.();
        });
        this.listeners.push({ ref: playersRef, event: 'value', callback: playersListener });

        // Listen for game state
        const stateRef = this.roomRef.child('gameState');
        const stateListener = stateRef.on('value', (snapshot) => {
            const state = snapshot.val();
            this.handleGameStateChange(state);
        });
        this.listeners.push({ ref: stateRef, event: 'value', callback: stateListener });

        // Listen for dot collection
        const dotsRef = this.roomRef.child('dotsCollected');
        const dotsListener = dotsRef.on('child_added', (snapshot) => {
            const dotKey = snapshot.key;
            const [x, y] = dotKey.split('_').map(Number);
            this.handleRemoteDotCollected(x, y);
        });
        this.listeners.push({ ref: dotsRef, event: 'child_added', callback: dotsListener });

        // Listen for power pellet collection
        const powerRef = this.roomRef.child('powerPelletsCollected');
        const powerListener = powerRef.on('child_added', (snapshot) => {
            const pelletKey = snapshot.key;
            const playerId = snapshot.val();
            const [x, y] = pelletKey.split('_').map(Number);
            this.handleRemotePowerPellet(x, y, playerId);
        });
        this.listeners.push({ ref: powerRef, event: 'child_added', callback: powerListener });

        // Listen for shared score/lives updates (co-op)
        const sharedScoreRef = this.roomRef.child('sharedScore');
        sharedScoreRef.on('value', (snapshot) => {
            if (this.mpMode.sharedScore && !this.isHost) {
                this.game.score = snapshot.val() || 0;
            }
        });

        const sharedLivesRef = this.roomRef.child('sharedLives');
        sharedLivesRef.on('value', (snapshot) => {
            if (this.mpMode.sharedLives && !this.isHost) {
                this.game.lives = snapshot.val() || 3;
            }
        });

        // Handle disconnect
        this.roomRef.child(`players/${this.playerId}`).onDisconnect().remove();
    }

    /**
     * Start position sync
     */
    startPositionSync() {
        // Sync position at 20fps for smooth movement
        this.positionUpdateInterval = setInterval(() => {
            this.syncPosition();
        }, 50);
    }

    /**
     * Sync player position to Firebase
     */
    syncPosition() {
        if (!this.roomRef || !this.game.pacman) return;

        const pos = this.game.pacman;
        
        // Only send if position changed
        if (pos.x !== this.lastSentPosition.x || pos.y !== this.lastSentPosition.y) {
            this.lastSentPosition = { x: pos.x, y: pos.y };
            
            this.roomRef.child(`players/${this.playerId}`).update({
                position: { x: pos.x, y: pos.y },
                direction: this.game.pacman.direction?.name || 'right',
                lastActive: firebase.database.ServerValue.TIMESTAMP
            });
        }
    }

    /**
     * Broadcast dot collection
     */
    async broadcastDotCollected(x, y) {
        if (!this.roomRef) return;
        
        const dotKey = `${x}_${y}`;
        await this.roomRef.child(`dotsCollected/${dotKey}`).set(this.playerId);
        
        // Update shared score for co-op
        if (this.mpMode.sharedScore && this.isHost) {
            await this.roomRef.child('sharedScore').set(this.game.score);
        }
    }

    /**
     * Handle remote dot collection
     */
    handleRemoteDotCollected(x, y) {
        // Mark dot as collected locally if not already
        if (this.game.grid && this.game.grid[y] && this.game.grid[y][x] === 2) {
            this.game.grid[y][x] = 0;
            this.game.dotsEaten++;
        }
    }

    /**
     * Broadcast power pellet collection
     */
    async broadcastPowerPelletCollected(x, y) {
        if (!this.roomRef) return;
        
        const pelletKey = `${x}_${y}`;
        await this.roomRef.child(`powerPelletsCollected/${pelletKey}`).set(this.playerId);
    }

    /**
     * Handle remote power pellet
     */
    handleRemotePowerPellet(x, y, playerId) {
        // Mark pellet as collected
        if (this.game.grid && this.game.grid[y] && this.game.grid[y][x] === 3) {
            this.game.grid[y][x] = 0;
            
            // In co-op, all players benefit from power mode
            if (this.mpMode.id === 'coop') {
                this.game.activatePowerMode?.();
            }
            // In versus, only the collector gets power mode (handled by remote player)
        }
    }

    /**
     * Broadcast player death (for co-op shared lives)
     */
    async broadcastPlayerDeath() {
        if (!this.roomRef || !this.mpMode.sharedLives) return;
        
        if (this.isHost) {
            await this.roomRef.child('sharedLives').set(this.game.lives);
        }
    }

    /**
     * Start game (host only)
     */
    async startGame() {
        if (!this.isHost || !this.roomRef) return;

        await this.roomRef.update({
            gameState: 'playing',
            dotsCollected: {},
            powerPelletsCollected: {}
        });

        this.game.startGame();
    }

    /**
     * Handle game state changes
     */
    handleGameStateChange(state) {
        switch (state) {
            case 'playing':
                if (!this.isHost) {
                    this.game.startGame();
                }
                break;
            case 'won':
                this.showMultiplayerResult(true);
                break;
            case 'lost':
                this.showMultiplayerResult(false);
                break;
        }
    }

    /**
     * Broadcast game over
     */
    async broadcastGameOver(won) {
        if (!this.roomRef) return;
        await this.roomRef.child('gameState').set(won ? 'won' : 'lost');
    }

    /**
     * Get other players data for rendering
     */
    getOtherPlayers() {
        const others = [];
        for (const [playerId, player] of Object.entries(this.players)) {
            if (playerId !== this.playerId) {
                others.push({
                    ...player,
                    id: playerId
                });
            }
        }
        return others;
    }

    /**
     * Get all player scores for versus mode
     */
    getPlayerScores() {
        return Object.entries(this.players).map(([id, player]) => ({
            name: player.name,
            score: player.score || 0,
            color: player.color,
            isHost: player.isHost
        })).sort((a, b) => b.score - a.score);
    }

    /**
     * Show multiplayer result
     */
    showMultiplayerResult(won) {
        const isVersus = this.mpMode.id === 'versus';
        const scores = this.getPlayerScores();
        
        let content = '';
        if (isVersus) {
            const winner = scores[0];
            const isWinner = this.players[this.playerId]?.score === winner.score;
            content = `
                <div class="pac-main-menu">
                    <h1 class="pac-menu-title" style="font-size: 2.5rem;">${isWinner ? '🏆 YOU WIN!' : '😢 YOU LOSE'}</h1>
                    <div style="margin: 2rem 0;">
                        <h3 style="color: var(--pac-yellow); margin-bottom: 1rem;">Final Scores</h3>
                        ${scores.map((p, i) => `
                            <div style="display: flex; align-items: center; gap: 1rem; padding: 0.5rem; 
                                        background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 0.5rem;">
                                <span style="font-size: 1.5rem;">${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                                <span style="color: ${p.color.fill}">${p.name}</span>
                                <span style="margin-left: auto; font-weight: bold;">${p.score}</span>
                            </div>
                        `).join('')}
                    </div>
                    <button class="pac-menu-btn primary" onclick="game.multiplayer.returnToLobby()">
                        <span class="pac-btn-icon">🔄</span>
                        <span class="pac-btn-title">Play Again</span>
                    </button>
                </div>
            `;
        } else {
            content = `
                <div class="pac-main-menu">
                    <h1 class="pac-menu-title" style="font-size: 2.5rem;">${won ? '🎉 TEAM VICTORY!' : '💀 TEAM DEFEAT'}</h1>
                    <p style="color: var(--text-secondary); margin: 1rem 0;">
                        ${won ? 'Great teamwork! You cleared the maze!' : 'Better luck next time!'}
                    </p>
                    <div style="font-size: 2rem; color: var(--pac-yellow); margin: 1rem 0;">
                        Team Score: ${this.game.score}
                    </div>
                    <button class="pac-menu-btn primary" onclick="game.multiplayer.returnToLobby()">
                        <span class="pac-btn-icon">🔄</span>
                        <span class="pac-btn-title">Play Again</span>
                    </button>
                </div>
            `;
        }

        const overlay = document.getElementById('game-overlay');
        if (overlay) {
            overlay.innerHTML = content;
            overlay.style.display = 'flex';
        }
    }

    /**
     * Return to lobby
     */
    async returnToLobby() {
        if (!this.roomRef) return;

        // Reset game state
        await this.roomRef.update({
            gameState: 'waiting',
            sharedScore: 0,
            sharedLives: 3,
            dotsCollected: {},
            powerPelletsCollected: {}
        });

        this.showLobby();
    }

    /**
     * Show lobby UI
     */
    showLobby() {
        const players = Object.entries(this.players).map(([id, p]) => `
            <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; 
                        background: rgba(255,255,255,0.05); border-radius: 10px; margin-bottom: 0.5rem;">
                <div style="width: 30px; height: 30px; border-radius: 50%; background: ${p.color.fill};"></div>
                <span>${p.name}</span>
                ${p.isHost ? '<span style="color: gold;">👑</span>' : ''}
                ${id === this.playerId ? '<span style="color: #888;">(You)</span>' : ''}
            </div>
        `).join('');

        const content = `
            <div class="pac-main-menu">
                <h1 class="pac-menu-title" style="font-size: 2.5rem;">🎮 ${this.mpMode.name} Mode</h1>
                
                <div style="background: rgba(0,0,0,0.3); padding: 1.5rem; border-radius: 12px; 
                            border: 2px solid var(--pac-yellow); margin: 1rem 0; text-align: center;">
                    <div style="color: #888; font-size: 0.8rem; margin-bottom: 0.5rem;">Room Code</div>
                    <div style="font-size: 2.5rem; font-weight: bold; letter-spacing: 0.3em; color: var(--pac-yellow);">
                        ${this.roomCode}
                    </div>
                </div>
                
                <div style="width: 100%; max-width: 300px; margin: 1rem 0;">
                    <h3 style="color: var(--pac-yellow); margin-bottom: 0.5rem;">Players</h3>
                    ${players}
                </div>
                
                ${this.isHost ? `
                    <button class="pac-menu-btn primary" onclick="game.multiplayer.startGame()" 
                            style="margin-top: 1rem;">
                        <span class="pac-btn-icon">🚀</span>
                        <span class="pac-btn-title">Start Game</span>
                    </button>
                ` : `
                    <p style="color: #888; margin-top: 1rem;">Waiting for host to start...</p>
                `}
                
                <button class="pac-menu-btn" onclick="game.multiplayer.leaveRoom()" style="margin-top: 1rem;">
                    <span class="pac-btn-icon">🚪</span>
                    <span class="pac-btn-title">Leave Room</span>
                </button>
            </div>
        `;

        const overlay = document.getElementById('game-overlay');
        if (overlay) {
            overlay.innerHTML = content;
            overlay.style.display = 'flex';
        }
    }

    /**
     * Leave the room
     */
    async leaveRoom() {
        // Remove listeners
        for (const listener of this.listeners) {
            listener.ref.off(listener.event, listener.callback);
        }
        this.listeners = [];

        // Stop position sync
        if (this.positionUpdateInterval) {
            clearInterval(this.positionUpdateInterval);
            this.positionUpdateInterval = null;
        }

        // Remove player from room
        if (this.roomRef && this.playerId) {
            await this.roomRef.child(`players/${this.playerId}`).remove();
            
            // If host leaves, delete room
            if (this.isHost) {
                await this.roomRef.remove();
            }
        }

        // Reset state
        this.roomRef = null;
        this.roomCode = null;
        this.isHost = false;
        this.connected = false;
        this.players = {};

        // Return to main menu
        this.game.showMainMenu();
    }

    /**
     * Open multiplayer modal
     */
    openModal() {
        let modal = document.getElementById('pacman-mp-modal');
        if (!modal) {
            modal = this.createModal();
        }
        modal.classList.add('show');
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('pacman-mp-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    /**
     * Create multiplayer modal
     */
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'pacman-mp-modal';
        modal.className = 'pacman-mp-modal';
        modal.innerHTML = `
            <div class="mp-modal-content">
                <div class="mp-modal-header">
                    <h2>🎮 Multiplayer</h2>
                    <button class="mp-close-btn" onclick="game.multiplayer.closeModal()">×</button>
                </div>
                
                <div class="mp-modal-body">
                    <div class="mp-section">
                        <label>Your Name</label>
                        <input type="text" id="pac-mp-name" placeholder="Enter your name" 
                               value="${this.playerName}" maxlength="15">
                    </div>
                    
                    <div class="mp-mode-select">
                        <button class="mp-mode-btn active" data-mode="coop">
                            <span class="mode-icon">🤝</span>
                            <span class="mode-name">Co-op</span>
                            <span class="mode-desc">Work together</span>
                        </button>
                        <button class="mp-mode-btn" data-mode="versus">
                            <span class="mode-icon">⚔️</span>
                            <span class="mode-name">Versus</span>
                            <span class="mode-desc">Compete for points</span>
                        </button>
                    </div>
                    
                    <div class="mp-tabs">
                        <button class="mp-tab active" data-tab="create">Create Room</button>
                        <button class="mp-tab" data-tab="join">Join Room</button>
                    </div>
                    
                    <div class="mp-tab-content" id="pac-tab-create">
                        <p>Create a room and invite friends!</p>
                        <button class="pac-menu-btn primary" onclick="game.multiplayer.handleCreate()">
                            <span class="pac-btn-icon">➕</span>
                            <span class="pac-btn-title">Create Room</span>
                        </button>
                    </div>
                    
                    <div class="mp-tab-content hidden" id="pac-tab-join">
                        <p>Enter room code:</p>
                        <input type="text" id="pac-mp-code" placeholder="ABCD12" 
                               maxlength="6" style="text-transform: uppercase; text-align: center; 
                               font-size: 1.5rem; letter-spacing: 0.2em;">
                        <button class="pac-menu-btn primary" onclick="game.multiplayer.handleJoin()">
                            <span class="pac-btn-icon">🚪</span>
                            <span class="pac-btn-title">Join Room</span>
                        </button>
                    </div>
                    
                    <div class="mp-error hidden" id="pac-mp-error"></div>
                </div>
            </div>
        `;

        // Mode selection
        modal.querySelectorAll('.mp-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.mp-mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Tab switching
        modal.querySelectorAll('.mp-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                modal.querySelectorAll('.mp-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const tabName = tab.dataset.tab;
                modal.querySelectorAll('.mp-tab-content').forEach(c => c.classList.add('hidden'));
                document.getElementById(`pac-tab-${tabName}`).classList.remove('hidden');
            });
        });

        document.body.appendChild(modal);
        return modal;
    }

    /**
     * Handle create room
     */
    async handleCreate() {
        const nameInput = document.getElementById('pac-mp-name');
        const errorEl = document.getElementById('pac-mp-error');
        const activeMode = document.querySelector('.mp-mode-btn.active');
        
        this.setPlayerName(nameInput.value);
        const mode = activeMode?.dataset.mode || 'coop';
        
        try {
            errorEl.classList.add('hidden');
            const code = await this.createRoom(mode);
            this.closeModal();
            this.showLobby();
        } catch (error) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    }

    /**
     * Handle join room
     */
    async handleJoin() {
        const nameInput = document.getElementById('pac-mp-name');
        const codeInput = document.getElementById('pac-mp-code');
        const errorEl = document.getElementById('pac-mp-error');
        
        this.setPlayerName(nameInput.value);
        
        const code = codeInput.value.trim().toUpperCase();
        if (code.length !== 6) {
            errorEl.textContent = 'Enter a 6-character room code';
            errorEl.classList.remove('hidden');
            return;
        }
        
        try {
            errorEl.classList.add('hidden');
            await this.joinRoom(code);
            this.closeModal();
            this.showLobby();
        } catch (error) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    }
}
