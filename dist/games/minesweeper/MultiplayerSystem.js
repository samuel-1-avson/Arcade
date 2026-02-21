/**
 * Minesweeper Multiplayer System
 * Real-time cooperative gameplay using Firebase Realtime Database
 */

import { ICONS } from './Icons.js';

// Player colors for cursor visualization
const PLAYER_COLORS = [
    '#00ff88', // Green (host)
    '#ff6b6b', // Red
    '#4ecdc4', // Teal
    '#ffe66d'  // Yellow
];

/**
 * Multiplayer System Class
 */
export class MultiplayerSystem {
    constructor(game) {
        this.game = game;
        this.db = null;
        this.roomRef = null;
        this.roomCode = null;
        this.playerId = null;
        this.playerName = 'Player';
        this.playerColor = PLAYER_COLORS[0];
        this.isHost = false;
        this.players = {};
        this.connected = false;
        this.cursorUpdateInterval = null;
        this.listeners = [];
        
        // Generate a unique player ID
        this.playerId = this.generatePlayerId();
        
        // Load player name from storage
        this.playerName = localStorage.getItem('minesweeper_player_name') || 'Player';
    }

    /**
     * Initialize Firebase RTDB connection
     */
    async init() {
        try {
            // Check if Firebase is available
            if (typeof firebase === 'undefined' || !firebase.database) {
                console.warn('Firebase RTDB not available');
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
     * Generate a unique player ID
     */
    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substring(2, 11);
    }

    /**
     * Generate a 6-digit room code
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
        localStorage.setItem('minesweeper_player_name', this.playerName);
    }

    /**
     * Create a new multiplayer room
     */
    async createRoom(difficulty = 'easy') {
        if (!this.db) {
            const initialized = await this.init();
            if (!initialized) {
                throw new Error('Firebase not available');
            }
        }

        // Generate unique room code
        this.roomCode = this.generateRoomCode();
        this.isHost = true;
        this.playerColor = PLAYER_COLORS[0];

        // Create room in Firebase
        this.roomRef = this.db.ref(`minesweeper_rooms/${this.roomCode}`);
        
        const roomData = {
            host: this.playerId,
            gameState: 'waiting',
            difficulty: difficulty,
            board: null,
            players: {
                [this.playerId]: {
                    name: this.playerName,
                    color: this.playerColor,
                    cursor: { row: -1, col: -1 },
                    lastActive: firebase.database.ServerValue.TIMESTAMP,
                    isHost: true
                }
            },
            chat: [],
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        await this.roomRef.set(roomData);
        
        // Set up listeners
        this.setupListeners();
        this.startCursorUpdates();
        
        this.connected = true;
        this.updateUI();
        
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
        this.roomRef = this.db.ref(`minesweeper_rooms/${this.roomCode}`);
        
        // Check if room exists
        const snapshot = await this.roomRef.once('value');
        if (!snapshot.exists()) {
            throw new Error('Room not found');
        }

        const roomData = snapshot.val();
        
        // Check if game already started
        if (roomData.gameState === 'playing') {
            throw new Error('Game already in progress');
        }
        
        // Check player count
        const playerCount = Object.keys(roomData.players || {}).length;
        if (playerCount >= 4) {
            throw new Error('Room is full (max 4 players)');
        }

        // Assign color based on position
        this.playerColor = PLAYER_COLORS[playerCount];
        this.isHost = false;

        // Add player to room
        await this.roomRef.child(`players/${this.playerId}`).set({
            name: this.playerName,
            color: this.playerColor,
            cursor: { row: -1, col: -1 },
            lastActive: firebase.database.ServerValue.TIMESTAMP,
            isHost: false
        });

        // Set up listeners
        this.setupListeners();
        this.startCursorUpdates();
        
        this.connected = true;
        this.updateUI();

        return true;
    }

    /**
     * Set up Firebase listeners for real-time updates
     */
    setupListeners() {
        if (!this.roomRef) return;

        // Listen for player changes
        const playersRef = this.roomRef.child('players');
        const playersListener = playersRef.on('value', (snapshot) => {
            this.players = snapshot.val() || {};
            this.renderPlayerCursors();
            this.updatePlayerList();
        });
        this.listeners.push({ ref: playersRef, event: 'value', callback: playersListener });

        // Listen for game state changes
        const stateRef = this.roomRef.child('gameState');
        const stateListener = stateRef.on('value', (snapshot) => {
            const state = snapshot.val();
            this.handleGameStateChange(state);
        });
        this.listeners.push({ ref: stateRef, event: 'value', callback: stateListener });

        // Listen for board updates
        const boardRef = this.roomRef.child('board');
        const boardListener = boardRef.on('value', (snapshot) => {
            const board = snapshot.val();
            if (board && !this.isHost) {
                this.syncBoardState(board);
            }
        });
        this.listeners.push({ ref: boardRef, event: 'value', callback: boardListener });

        // Listen for cell reveals
        const revealRef = this.roomRef.child('lastReveal');
        const revealListener = revealRef.on('value', (snapshot) => {
            const reveal = snapshot.val();
            if (reveal && reveal.playerId !== this.playerId) {
                this.handleRemoteReveal(reveal);
            }
        });
        this.listeners.push({ ref: revealRef, event: 'value', callback: revealListener });

        // Listen for flags
        const flagRef = this.roomRef.child('lastFlag');
        const flagListener = flagRef.on('value', (snapshot) => {
            const flag = snapshot.val();
            if (flag && flag.playerId !== this.playerId) {
                this.handleRemoteFlag(flag);
            }
        });
        this.listeners.push({ ref: flagRef, event: 'value', callback: flagListener });

        // Listen for chat messages
        const chatRef = this.roomRef.child('chat');
        const chatListener = chatRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            this.displayChatMessage(message);
        });
        this.listeners.push({ ref: chatRef, event: 'child_added', callback: chatListener });

        // Handle disconnect
        this.roomRef.child(`players/${this.playerId}`).onDisconnect().remove();
    }

    /**
     * Start the game (host only)
     */
    async startGame() {
        if (!this.isHost || !this.roomRef) return;

        // Update game state
        await this.roomRef.update({
            gameState: 'playing'
        });

        // Start the game locally (this will trigger grid creation)
        this.game.newGame();
        
        // Wait a moment for the board to be created
        setTimeout(() => {
            this.broadcastBoardState();
        }, 100);
    }

    /**
     * Broadcast the current board state to all players
     */
    async broadcastBoardState() {
        if (!this.roomRef || !this.game.grid) return;

        // Serialize the board (only mine positions, not revealed state)
        const board = {
            rows: this.game.rows,
            cols: this.game.cols,
            mineCount: this.game.mineCount,
            mines: []
        };

        for (let row = 0; row < this.game.rows; row++) {
            for (let col = 0; col < this.game.cols; col++) {
                if (this.game.grid[row][col].mine) {
                    board.mines.push({ row, col });
                }
            }
        }

        await this.roomRef.child('board').set(board);
    }

    /**
     * Sync board state from host
     */
    syncBoardState(board) {
        if (!board || this.isHost) return;

        // Apply the board settings
        this.game.rows = board.rows;
        this.game.cols = board.cols;
        this.game.mineCount = board.mineCount;
        
        // Reinitialize the grid
        this.game.initializeGrid();
        
        // Place mines at specified positions
        for (const mine of board.mines) {
            this.game.grid[mine.row][mine.col].mine = true;
        }
        
        // Calculate adjacent mine counts
        for (let row = 0; row < this.game.rows; row++) {
            for (let col = 0; col < this.game.cols; col++) {
                if (!this.game.grid[row][col].mine) {
                    this.game.grid[row][col].adjacentMines = this.game.countAdjacentMines(row, col);
                }
            }
        }
        
        // Render the board
        this.game.renderBoard();
        this.game.updateMinesDisplay();
    }

    /**
     * Broadcast a cell reveal
     */
    async broadcastReveal(row, col) {
        if (!this.roomRef) return;

        await this.roomRef.child('lastReveal').set({
            playerId: this.playerId,
            playerName: this.playerName,
            row,
            col,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    /**
     * Handle a remote cell reveal
     */
    handleRemoteReveal(reveal) {
        if (!reveal || !this.game.grid) return;
        
        const { row, col, playerName } = reveal;
        
        // Skip if already revealed
        if (this.game.grid[row]?.[col]?.revealed) return;
        
        // Show notification
        this.showTeamAction(`${playerName} revealed a cell`);
        
        // Reveal the cell locally
        this.game.revealCell(row, col);
    }

    /**
     * Broadcast a flag toggle
     */
    async broadcastFlag(row, col, flagged) {
        if (!this.roomRef) return;

        await this.roomRef.child('lastFlag').set({
            playerId: this.playerId,
            playerName: this.playerName,
            row,
            col,
            flagged,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    /**
     * Handle a remote flag
     */
    handleRemoteFlag(flag) {
        if (!flag || !this.game.grid) return;
        
        const { row, col, flagged, playerName } = flag;
        
        const cell = this.game.grid[row]?.[col];
        if (!cell || cell.revealed) return;
        
        // Show notification
        this.showTeamAction(`${playerName} ${flagged ? 'flagged' : 'unflagged'} a cell`);
        
        // Apply the flag locally
        cell.flagged = flagged;
        this.game.flagCount += flagged ? 1 : -1;
        this.game.updateCellDisplay(row, col);
        this.game.updateMinesDisplay();
    }

    /**
     * Handle game state changes
     */
    handleGameStateChange(state) {
        switch (state) {
            case 'playing':
                // Game started
                if (!this.isHost) {
                    this.game.overlay?.classList.add('hidden');
                    this.game.startTimer();
                }
                break;
            case 'won':
                this.showTeamResult(true);
                break;
            case 'lost':
                this.showTeamResult(false);
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
     * Show team win/lose result
     */
    showTeamResult(won) {
        const overlay = document.createElement('div');
        overlay.className = 'multiplayer-result-overlay';
        overlay.innerHTML = `
            <div class="multiplayer-result">
                <div class="result-icon">${won ? ICONS.TROPHY : ICONS.BOMB}</div>
                <div class="result-title">${won ? 'TEAM VICTORY!' : 'TEAM DEFEAT'}</div>
                <div class="result-subtitle">${won ? 'Great teamwork!' : 'Better luck next time!'}</div>
                <button class="result-btn" onclick="this.parentElement.parentElement.remove()">Continue</button>
            </div>
        `;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));
    }

    /**
     * Update cursor position
     */
    updateCursor(row, col) {
        if (!this.roomRef) return;
        
        this.roomRef.child(`players/${this.playerId}/cursor`).set({
            row, col
        });
    }

    /**
     * Start periodic cursor updates
     */
    startCursorUpdates() {
        // Track mouse position over the board
        const board = document.getElementById('game-board');
        if (!board) return;

        board.addEventListener('mousemove', (e) => {
            const cell = e.target.closest('.cell');
            if (cell) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                this.updateCursor(row, col);
            }
        });

        board.addEventListener('mouseleave', () => {
            this.updateCursor(-1, -1);
        });

        // Keep-alive updates
        this.cursorUpdateInterval = setInterval(() => {
            if (this.roomRef) {
                this.roomRef.child(`players/${this.playerId}/lastActive`).set(
                    firebase.database.ServerValue.TIMESTAMP
                );
            }
        }, 5000);
    }

    /**
     * Render other players' cursors
     */
    renderPlayerCursors() {
        // Remove existing cursors
        document.querySelectorAll('.player-cursor').forEach(el => el.remove());

        const board = document.getElementById('game-board');
        if (!board) return;

        for (const [playerId, player] of Object.entries(this.players)) {
            // Skip self
            if (playerId === this.playerId) continue;
            
            const { cursor, color, name } = player;
            if (!cursor || cursor.row < 0 || cursor.col < 0) continue;

            const cellIndex = cursor.row * this.game.cols + cursor.col;
            const cell = board.children[cellIndex];
            if (!cell) continue;

            // Create cursor element
            const cursorEl = document.createElement('div');
            cursorEl.className = 'player-cursor';
            cursorEl.style.borderColor = color;
            cursorEl.innerHTML = `<span class="cursor-name" style="background: ${color}">${name}</span>`;
            cell.appendChild(cursorEl);
        }
    }

    /**
     * Update the player list UI
     */
    updatePlayerList() {
        const container = document.getElementById('player-list');
        if (!container) return;

        container.innerHTML = Object.entries(this.players).map(([id, player]) => `
            <div class="player-item ${id === this.playerId ? 'self' : ''}">
                <div class="player-color" style="background: ${player.color}"></div>
                <div class="player-name">${player.name}${player.isHost ? `<span class="host-icon">${ICONS.STAR}</span>` : ''}</div>
                ${id === this.playerId ? '<span class="player-you">(You)</span>' : ''}
            </div>
        `).join('');
    }

    /**
     * Send a chat message
     */
    async sendChat(message) {
        if (!this.roomRef || !message.trim()) return;

        await this.roomRef.child('chat').push({
            playerId: this.playerId,
            playerName: this.playerName,
            playerColor: this.playerColor,
            message: message.trim(),
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    /**
     * Display a chat message
     */
    displayChatMessage(msg) {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        const isOwn = msg.playerId === this.playerId;
        const msgEl = document.createElement('div');
        msgEl.className = `chat-message ${isOwn ? 'own' : ''}`;
        msgEl.innerHTML = `
            <span class="chat-name" style="color: ${msg.playerColor}">${msg.playerName}:</span>
            <span class="chat-text">${this.escapeHtml(msg.message)}</span>
        `;
        container.appendChild(msgEl);
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Show a team action notification
     */
    showTeamAction(message) {
        const toast = document.createElement('div');
        toast.className = 'team-action-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    /**
     * Update the multiplayer UI
     */
    updateUI() {
        // Show/hide multiplayer panel
        const panel = document.getElementById('multiplayer-panel');
        if (panel) {
            panel.style.display = this.connected ? 'block' : 'none';
        }

        // Update room code display
        const codeDisplay = document.getElementById('room-code-display');
        if (codeDisplay && this.roomCode) {
            codeDisplay.textContent = this.roomCode;
        }

        // Show start button for host
        const startBtn = document.getElementById('mp-start-btn');
        if (startBtn) {
            startBtn.style.display = this.isHost ? 'block' : 'none';
        }
    }

    /**
     * Leave the current room
     */
    async leaveRoom() {
        // Remove listeners
        for (const listener of this.listeners) {
            listener.ref.off(listener.event, listener.callback);
        }
        this.listeners = [];

        // Stop cursor updates
        if (this.cursorUpdateInterval) {
            clearInterval(this.cursorUpdateInterval);
            this.cursorUpdateInterval = null;
        }

        // Remove player from room
        if (this.roomRef && this.playerId) {
            await this.roomRef.child(`players/${this.playerId}`).remove();
            
            // If host leaves, delete the room
            if (this.isHost) {
                await this.roomRef.remove();
            }
        }

        // Remove cursors
        document.querySelectorAll('.player-cursor').forEach(el => el.remove());

        // Reset state
        this.roomRef = null;
        this.roomCode = null;
        this.isHost = false;
        this.connected = false;
        this.players = {};

        this.updateUI();
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Open the multiplayer modal
     */
    openModal() {
        let modal = document.getElementById('multiplayer-modal');
        if (!modal) {
            modal = this.createModal();
        }
        modal.classList.add('show');
    }

    /**
     * Close the multiplayer modal
     */
    closeModal() {
        const modal = document.getElementById('multiplayer-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    /**
     * Create the multiplayer modal
     */
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'multiplayer-modal';
        modal.className = 'multiplayer-modal';
        modal.innerHTML = `
            <div class="mp-modal-content">
                <div class="mp-modal-header">
                    <h2>${ICONS.MODE_COOP} Co-op Multiplayer</h2>
                    <button class="mp-modal-close" onclick="game.multiplayer.closeModal()">×</button>
                </div>
                
                <div class="mp-modal-body">
                    <div class="mp-section">
                        <label>Your Name</label>
                        <input type="text" id="mp-player-name" placeholder="Enter your name" 
                               value="${this.playerName}" maxlength="20">
                    </div>
                    
                    <div class="mp-tabs">
                        <button class="mp-tab active" data-tab="create">Create Room</button>
                        <button class="mp-tab" data-tab="join">Join Room</button>
                    </div>
                    
                    <div class="mp-tab-content" id="tab-create">
                        <p>Start a new game and invite friends!</p>
                        <select id="mp-difficulty">
                            <option value="easy">Easy (9×9)</option>
                            <option value="medium">Medium (16×16)</option>
                            <option value="hard">Hard (30×16)</option>
                        </select>
                        <button class="mp-btn primary" onclick="game.multiplayer.handleCreate()">
                            Create Room
                        </button>
                    </div>
                    
                    <div class="mp-tab-content hidden" id="tab-join">
                        <p>Enter room code to join:</p>
                        <input type="text" id="mp-room-code" placeholder="ABCD12" 
                               maxlength="6" style="text-transform: uppercase">
                        <button class="mp-btn primary" onclick="game.multiplayer.handleJoin()">
                            Join Room
                        </button>
                    </div>
                    
                    <div class="mp-error hidden" id="mp-error"></div>
                </div>
            </div>
        `;

        // Tab switching
        modal.querySelectorAll('.mp-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                modal.querySelectorAll('.mp-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const tabName = tab.dataset.tab;
                modal.querySelectorAll('.mp-tab-content').forEach(c => c.classList.add('hidden'));
                document.getElementById(`tab-${tabName}`).classList.remove('hidden');
            });
        });

        document.body.appendChild(modal);
        return modal;
    }

    /**
     * Handle create room button
     */
    async handleCreate() {
        const nameInput = document.getElementById('mp-player-name');
        const difficultySelect = document.getElementById('mp-difficulty');
        const errorEl = document.getElementById('mp-error');
        
        this.setPlayerName(nameInput.value);
        
        try {
            errorEl.classList.add('hidden');
            const code = await this.createRoom(difficultySelect.value);
            this.closeModal();
            this.showRoomCreated(code);
        } catch (error) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    }

    /**
     * Handle join room button
     */
    async handleJoin() {
        const nameInput = document.getElementById('mp-player-name');
        const codeInput = document.getElementById('mp-room-code');
        const errorEl = document.getElementById('mp-error');
        
        this.setPlayerName(nameInput.value);
        
        const code = codeInput.value.trim().toUpperCase();
        if (code.length !== 6) {
            errorEl.textContent = 'Please enter a 6-character room code';
            errorEl.classList.remove('hidden');
            return;
        }
        
        try {
            errorEl.classList.add('hidden');
            await this.joinRoom(code);
            this.closeModal();
        } catch (error) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    }

    /**
     * Show room created popup with code
     */
    showRoomCreated(code) {
        const popup = document.createElement('div');
        popup.className = 'room-created-popup';
        popup.innerHTML = `
            <div class="room-created-content">
                <h3>🎮 Room Created!</h3>
                <p>Share this code with friends:</p>
                <div class="room-code-large">${code}</div>
                <button class="mp-btn" onclick="navigator.clipboard.writeText('${code}'); this.textContent='Copied!'">
                    📋 Copy Code
                </button>
                <button class="mp-btn primary" onclick="this.parentElement.parentElement.remove()">
                    Continue
                </button>
                <p class="room-status">Waiting for players to join...</p>
            </div>
        `;
        document.body.appendChild(popup);
        requestAnimationFrame(() => popup.classList.add('show'));
    }
}

export default MultiplayerSystem;
