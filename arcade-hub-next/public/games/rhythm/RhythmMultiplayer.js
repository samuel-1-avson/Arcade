/**
 * Rhythm Multiplayer System
 * Handles real-time multiplayer battles using Firebase
 * 
 * Modes:
 * - Battle: 1v1 score competition on same song
 * - Co-op: Play together, combined score
 */

export class RhythmMultiplayer {
    constructor(game) {
        this.game = game;
        this.db = null;
        this.roomId = null;
        this.playerId = null;
        this.opponentId = null;
        this.isHost = false;

        // State
        this.status = 'disconnected'; // disconnected, lobby, waiting, playing, finished
        this.mode = 'battle'; // battle, coop
        this.roomRef = null;

        // Opponent state for display
        this.opponentState = {
            name: 'Opponent',
            score: 0,
            combo: 0,
            accuracy: 0,
            hits: { perfect: 0, good: 0, ok: 0, miss: 0 },
            progress: 0,
            isReady: false,
            isFinished: false
        };

        // Chat
        this.chatMessages = [];
        this.onChatCallback = null;
        this.onOpponentUpdateCallback = null;
        this.onGameStartCallback = null;
        this.onOpponentFinishCallback = null;
    }

    /**
     * Initialize Firebase and authenticate
     */
    async init() {
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase not loaded');
        }

        this.db = firebase.database();

        if (!firebase.auth().currentUser) {
            await firebase.auth().signInAnonymously();
        }

        this.playerId = firebase.auth().currentUser.uid;
        console.log('[RhythmMP] Initialized with ID:', this.playerId);
        return true;
    }

    /**
     * Create a new multiplayer room
     */
    async createRoom(mode = 'battle', songId = null) {
        await this.init();

        // Generate readable room code
        const code = this.generateRoomCode();
        const roomRef = this.db.ref(`rhythm_rooms/${code}`);

        this.roomId = code;
        this.roomRef = roomRef;
        this.isHost = true;
        this.mode = mode;
        this.status = 'waiting';

        await roomRef.set({
            hostId: this.playerId,
            mode: mode,
            songId: songId,
            status: 'waiting',
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            players: {
                [this.playerId]: {
                    name: 'Host',
                    isReady: false,
                    isHost: true
                }
            }
        });

        // Set disconnect cleanup
        roomRef.onDisconnect().remove();

        this.subscribeToRoom();
        return code;
    }

    /**
     * Join an existing room by code
     */
    async joinRoom(roomCode) {
        await this.init();

        const roomRef = this.db.ref(`rhythm_rooms/${roomCode}`);
        const snapshot = await roomRef.once('value');

        if (!snapshot.exists()) {
            throw new Error('Room not found');
        }

        const room = snapshot.val();

        if (room.status !== 'waiting') {
            throw new Error('Game already in progress');
        }

        const playerCount = Object.keys(room.players || {}).length;
        if (playerCount >= 2) {
            throw new Error('Room is full');
        }

        this.roomId = roomCode;
        this.roomRef = roomRef;
        this.isHost = false;
        this.mode = room.mode;
        this.opponentId = room.hostId;
        this.status = 'lobby';

        // Add self to players
        await roomRef.child(`players/${this.playerId}`).set({
            name: 'Player 2',
            isReady: false,
            isHost: false
        });

        // Cleanup on disconnect
        roomRef.child(`players/${this.playerId}`).onDisconnect().remove();

        this.subscribeToRoom();
        return room;
    }

    /**
     * Subscribe to room updates
     */
    subscribeToRoom() {
        if (!this.roomRef) return;

        // Watch for player changes
        this.roomRef.child('players').on('value', (snapshot) => {
            const players = snapshot.val() || {};
            const playerIds = Object.keys(players);

            // Find opponent
            for (const id of playerIds) {
                if (id !== this.playerId) {
                    this.opponentId = id;
                    const oppData = players[id];
                    this.opponentState.name = oppData.name || 'Opponent';
                    this.opponentState.isReady = oppData.isReady || false;

                    if (this.onOpponentUpdateCallback) {
                        this.onOpponentUpdateCallback(this.opponentState);
                    }
                }
            }

            // Check if both ready
            if (playerIds.length === 2) {
                const allReady = playerIds.every(id => players[id].isReady);
                if (allReady && this.isHost && this.status !== 'playing') {
                    this.startGame();
                }
            }
        });

        // Watch for game start
        this.roomRef.child('status').on('value', (snapshot) => {
            const status = snapshot.val();
            if (status === 'playing' && this.status !== 'playing') {
                this.onGameStart();
            }
            if (status === 'finished') {
                this.onGameEnd();
            }
        });

        // Watch opponent game state
        this.roomRef.child('gameState').on('child_changed', (snapshot) => {
            if (snapshot.key !== this.playerId) {
                this.updateOpponentGameState(snapshot.val());
            }
        });

        // Watch chat
        this.roomRef.child('chat').orderByChild('timestamp').limitToLast(50).on('child_added', (snapshot) => {
            const msg = snapshot.val();
            this.chatMessages.push(msg);
            if (this.onChatCallback) {
                this.onChatCallback(msg);
            }
        });
    }

    /**
     * Set player ready status
     */
    async setReady(ready = true) {
        if (!this.roomRef) return;
        await this.roomRef.child(`players/${this.playerId}/isReady`).set(ready);
    }

    /**
     * Set player name
     */
    async setPlayerName(name) {
        if (!this.roomRef) return;
        await this.roomRef.child(`players/${this.playerId}/name`).set(name);
    }

    /**
     * Select song (host only)
     */
    async selectSong(songId) {
        if (!this.isHost || !this.roomRef) return;
        await this.roomRef.child('songId').set(songId);
    }

    /**
     * Start the game (host triggers)
     */
    async startGame() {
        if (!this.isHost || !this.roomRef) return;

        await this.roomRef.update({
            status: 'playing',
            startedAt: firebase.database.ServerValue.TIMESTAMP
        });
    }

    /**
     * Handle game start
     */
    onGameStart() {
        this.status = 'playing';
        console.log('[RhythmMP] Game starting!');

        if (this.onGameStartCallback) {
            this.onGameStartCallback();
        }
    }

    /**
     * Handle game end
     */
    onGameEnd() {
        this.status = 'finished';
        console.log('[RhythmMP] Game ended');
    }

    /**
     * Send local game state to opponent
     */
    sendGameState(state) {
        if (!this.roomRef || this.status !== 'playing') return;

        this.roomRef.child(`gameState/${this.playerId}`).set({
            score: state.score,
            combo: state.combo,
            accuracy: state.accuracy,
            progress: state.progress,
            hits: state.hits,
            isFinished: state.isFinished || false,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    /**
     * Update local copy of opponent state
     */
    updateOpponentGameState(state) {
        this.opponentState = { ...this.opponentState, ...state };

        if (this.onOpponentUpdateCallback) {
            this.onOpponentUpdateCallback(this.opponentState);
        }

        if (state.isFinished && this.onOpponentFinishCallback) {
            this.onOpponentFinishCallback(this.opponentState);
        }
    }

    /**
     * Send final results
     */
    async sendResults(results) {
        if (!this.roomRef) return;

        await this.roomRef.child(`results/${this.playerId}`).set({
            score: results.score,
            accuracy: results.accuracy,
            maxCombo: results.maxCombo,
            grade: results.grade,
            hits: results.hits,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });

        // Mark as finished
        this.sendGameState({ ...results, isFinished: true });
    }

    /**
     * Get current song ID
     */
    async getSongId() {
        if (!this.roomRef) return null;
        const snapshot = await this.roomRef.child('songId').once('value');
        return snapshot.val();
    }

    /**
     * Send chat message
     */
    async sendChat(message) {
        if (!this.roomRef || !message.trim()) return;

        await this.roomRef.child('chat').push({
            playerId: this.playerId,
            name: this.isHost ? 'Host' : 'Player 2',
            message: message.trim(),
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    /**
     * Leave the room
     */
    async leaveRoom() {
        if (this.roomRef) {
            // Remove player
            await this.roomRef.child(`players/${this.playerId}`).remove();

            // If host, delete room
            if (this.isHost) {
                await this.roomRef.remove();
            }

            // Unsubscribe
            this.roomRef.off();
        }

        this.roomId = null;
        this.roomRef = null;
        this.opponentId = null;
        this.status = 'disconnected';
        this.chatMessages = [];
    }

    /**
     * Generate readable room code
     */
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }

    /**
     * Check if connected to a room
     */
    isConnected() {
        return this.roomId !== null && this.status !== 'disconnected';
    }

    /**
     * Get room info
     */
    getRoomInfo() {
        return {
            roomId: this.roomId,
            isHost: this.isHost,
            mode: this.mode,
            status: this.status,
            opponentState: this.opponentState
        };
    }
}
