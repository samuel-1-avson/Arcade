/**
 * Tetris Multiplayer Manager
 * Handles real-time 1v1 matchmaking and state synchronization using Firebase.
 */
export class TetrisMultiplayer {
    constructor(game) {
        this.game = game;
        this.db = firebase.database(); // Assumes globally available firebase instance
        this.roomId = null;
        this.playerId = null;
        this.opponentId = null;
        this.isHost = false;
        
        // State
        this.status = 'disconnected'; // disconnected, lobby, waiting, playing, spectating
        this.opponentState = {
            grid: [],
            score: 0,
            lines: 0,
            level: 1,
            isDead: false
        };
        
        this.garbageQueue = [];
    }

    /**
     * Initialize multiplayer: Auth anonymous user if needed
     */
    async init() {
        if (!firebase.auth().currentUser) {
            await firebase.auth().signInAnonymously();
        }
        this.playerId = firebase.auth().currentUser.uid;
        console.log('[Multiplayer] Initialized with ID:', this.playerId);
    }

    /**
     * Create a new private room
     */
    async createRoom() {
        await this.init();
        const roomRef = this.db.ref('tetris_rooms').push();
        this.roomId = roomRef.key;
        this.isHost = true;
        this.status = 'waiting';

        await roomRef.set({
            hostId: this.playerId,
            status: 'waiting', // waiting, playing, finished
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });

        // Listen for opponent
        roomRef.child('players').on('child_added', (snapshot) => {
            if (snapshot.key !== this.playerId) {
                this.onOpponentJoined(snapshot.key);
            }
        });

        this.subscribeToRoom();
        return this.roomId;
    }

    /**
     * Join an existing room
     * @param {string} roomId 
     */
    async joinRoom(roomId) {
        await this.init();
        const roomRef = this.db.ref(`tetris_rooms/${roomId}`);
        const snapshot = await roomRef.once('value');

        if (!snapshot.exists()) {
            throw new Error('Room not found');
        }

        if (snapshot.val().status !== 'waiting') {
            throw new Error('Room is full or game in progress');
        }

        this.roomId = roomId;
        this.isHost = false;
        this.opponentId = snapshot.val().hostId;
        this.status = 'waiting';

        // Add self to players
        await roomRef.child(`players/${this.playerId}`).set({
            status: 'ready',
            name: 'Player 2'
        });

        this.subscribeToRoom();
        return true;
    }

    /**
     * Setup listeners for the current room
     */
    subscribeToRoom() {
        const roomRef = this.db.ref(`tetris_rooms/${this.roomId}`);

        // Listen for game status changes
        roomRef.child('status').on('value', (snap) => {
            const status = snap.val();
            if (status === 'playing' && this.status !== 'playing') {
                this.onGameStart();
            }
        });

        // Listen for opponent state updates
        roomRef.child('state').on('child_changed', (snap) => {
            if (snap.key !== this.playerId) {
                this.updateOpponentState(snap.val());
            }
        });

        // Listen for attacks
        roomRef.child(`attacks/${this.playerId}`).on('child_added', (snap) => {
            this.receiveAttack(snap.val());
            snap.ref.remove(); // Consume attack
        });
    }

    onOpponentJoined(opponentId) {
        console.log('[Multiplayer] Opponent joined:', opponentId);
        this.opponentId = opponentId;
        // Auto-start for now, or wait for ready
        this.startGame();
    }

    startGame() {
        this.db.ref(`tetris_rooms/${this.roomId}`).update({
            status: 'playing'
        });
    }

    onGameStart() {
        console.log('[Multiplayer] Game Starting!');
        this.status = 'playing';
        this.game.startMultiplayerGame();
    }

    /**
     * Send local state to opponent
     * Optimization: Only send grid every few seconds or on major events, 
     * send score/lines more frequently.
     */
    sendState(state) {
        if (!this.roomId || this.status !== 'playing') return;

        // Compress grid: map to simple 0/1 or color codes
        const compressedGrid = state.grid.map(row => 
            row.map(cell => cell ? 1 : 0)
        );

        this.db.ref(`tetris_rooms/${this.roomId}/state/${this.playerId}`).set({
            grid: compressedGrid,
            score: state.score,
            lines: state.lines,
            level: state.level,
            isDead: state.isDead
        });
    }

    updateOpponentState(state) {
        this.opponentState = state;
        // Signal game renderer to redraw opponent view
    }

    /**
     * Send garbage lines to opponent
     * @param {number} lines Amount of garbage lines
     */
    sendAttack(lines) {
        if (!this.roomId || !this.opponentId) return;
        
        this.db.ref(`tetris_rooms/${this.roomId}/attacks/${this.opponentId}`).push({
            lines: lines,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    receiveAttack(attackData) {
        console.log('[Multiplayer] Received attack:', attackData);
        this.garbageQueue.push(attackData.lines);
        // Visual warning effect?
    }

    reportLoss() {
        if (this.roomId) {
            this.db.ref(`tetris_rooms/${this.roomId}/state/${this.playerId}`).update({
                isDead: true
            });
        }
    }
}
