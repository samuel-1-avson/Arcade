import { firebaseService } from '../../js/engine/FirebaseService.js';

export class MultiplayerManager {
    constructor(game) {
        this.game = game;
        this.rtdb = null;
        this.roomId = null;
        this.playerId = null;
        this.players = {}; 
        this.isHost = false;
        this.isActive = false;
        this.lastUpdate = 0;
        this.status = 'disconnected'; // disconnected, searching, waiting, playing
    }

    async init() {
         if (!firebaseService.initialized) await firebaseService.init();
         this.rtdb = firebaseService.getRTDB();
         const user = firebaseService.getCurrentUser();
         this.playerId = user ? user.uid : 'anon_' + Math.random().toString(36).substr(2, 9);
    }

    async findMatch() {
         if (!this.rtdb) await this.init();
         
         this.status = 'searching';
         this.updateStatusUI('Finding match...');

         // Try to find a waiting lobby
         const snapshot = await this.rtdb.ref('lobbies')
             .orderByChild('status').equalTo('waiting')
             .limitToFirst(1)
             .once('value');
             
         const lobbies = snapshot.val();
         
         if (lobbies) {
             const id = Object.keys(lobbies)[0];
             await this.joinRoom(id);
         } else {
             await this.createRoom();
         }
    }

    async createRoom() {
        this.updateStatusUI('Creating room...');
        const roomRef = this.rtdb.ref('lobbies').push();
        this.roomId = roomRef.key;
        this.isHost = true;
        
        await roomRef.set({
            status: 'waiting',
            host: this.playerId,
            created: firebase.database.ServerValue.TIMESTAMP,
            players: {
                [this.playerId]: {
                    id: this.playerId,
                    name: 'Host',
                    snake: [],
                    alive: true,
                    color: '#00ff88' 
                }
            }
        });
        
        this.listenToRoom();
        console.log('Room created:', this.roomId);
    }

    async joinRoom(roomId) {
        this.updateStatusUI('Joining room...');
        this.roomId = roomId;
        this.isHost = false;
        
        await this.rtdb.ref(`lobbies/${roomId}/players/${this.playerId}`).set({
            id: this.playerId,
            name: 'Player ' + Math.floor(Math.random()*100),
            snake: [],
            alive: true,
            color: '#ff4488'
        });
        
        this.listenToRoom();
    }

    listenToRoom() {
        this.isActive = true;
        this.status = 'waiting';
        this.updateStatusUI('Waiting for players...');
        
        const roomRef = this.rtdb.ref(`lobbies/${this.roomId}`);
        
        // Listen for player updates
        roomRef.child('players').on('value', snapshot => {
            const data = snapshot.val();
            if (data) {
                this.players = data;
                if (this.status === 'waiting') {
                    const count = Object.keys(data).length;
                    this.updateStatusUI(`Waiting for players... (${count})`);
                }
            }
        });
        
        // Listen for status
        roomRef.child('status').on('value', snapshot => {
            const status = snapshot.val();
            if (status === 'playing' && this.status !== 'playing') {
                this.status = 'playing';
                this.updateStatusUI('GO!', 1000);
            }
        });
        
        // Host logic to start game logic
        if (this.isHost) {
             // Auto-start check
             setInterval(() => {
                 if (this.status === 'waiting') {
                    const count = Object.keys(this.players).length;
                    if (count > 1) { // Need at least 2 players
                        this.rtdb.ref(`lobbies/${this.roomId}`).update({ status: 'playing' });
                    }
                 }
             }, 1000);
        }
    }

    update(dt) {
        if (!this.isActive || !this.roomId) return;
        
        // Send local state every 0.1s
        this.lastUpdate += dt;
        if (this.lastUpdate >= 0.1) {
            this.lastUpdate = 0;
            const snake = this.game.snake;
            if (snake && snake.length > 0) {
                this.rtdb.ref(`lobbies/${this.roomId}/players/${this.playerId}`).update({
                    snake: snake,
                    alive: !!this.game.lives // rudimentary check
                });
            }
        }
    }
    
    getRemoteSnakes() {
        return Object.values(this.players).filter(p => p.id !== this.playerId);
    }
    
    updateStatusUI(text, hideAfter = 0) {
        let el = document.getElementById('mp-status');
        if (!el) {
            el = document.createElement('div');
            el.id = 'mp-status';
            el.style.cssText = `
                position: fixed; top: 20%; left: 50%; transform: translateX(-50%);
                background: rgba(0,0,0,0.8); color: #fff; padding: 10px 20px;
                border: 2px solid #00ff88; border-radius: 5px; font-family: 'Orbitron', sans-serif;
                z-index: 1000; pointer-events: none;
            `;
            document.body.appendChild(el);
        }
        el.textContent = text;
        el.style.display = 'block';
        
        if (hideAfter > 0) {
            setTimeout(() => { el.style.display = 'none'; }, hideAfter);
        }
    }
}
