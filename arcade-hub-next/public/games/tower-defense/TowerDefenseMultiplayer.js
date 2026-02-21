/**
 * Tower Defense - Multiplayer System
 * Cooperative gameplay with room-based synchronization
 * Uses BroadcastChannel for local tab-to-tab communication
 */

/**
 * TowerDefenseMultiplayer - Handles cooperative multiplayer
 */
export class TowerDefenseMultiplayer {
    constructor(game) {
        this.game = game;
        this.channel = null;
        this.roomId = null;
        this.playerId = this.generatePlayerId();
        this.playerName = `Player ${Math.floor(Math.random() * 9999)}`;
        this.playerColor = this.generatePlayerColor();
        this.isHost = false;
        this.connected = false;
        this.players = new Map();
        this.callbacks = {};
        this.lobbyElement = null;
    }

    generatePlayerId() {
        return 'p_' + Math.random().toString(36).substr(2, 9);
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    generatePlayerColor() {
        const colors = ['#00e5ff', '#ff1a6c', '#00ff88', '#ffc107', '#aa55ff', '#ff5500'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    setPlayerName(name) {
        this.playerName = name.trim() || this.playerName;
        if (this.connected) {
            this.send({ type: 'name_change', playerId: this.playerId, playerName: this.playerName });
        }
    }

    // ============================================
    // CONNECTION
    // ============================================

    connect(roomId = null) {
        return new Promise((resolve, reject) => {
            try {
                this.roomId = roomId || this.generateRoomCode();
                this.channel = new BroadcastChannel(`towerdefense_room_${this.roomId}`);
                this.isHost = !roomId; // Host creates room (no roomId provided)

                this.channel.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                this.connected = true;

                // Add self to players
                this.players.set(this.playerId, {
                    id: this.playerId,
                    name: this.playerName,
                    color: this.playerColor,
                    isHost: this.isHost,
                    ready: false
                });

                // Announce join
                this.send({
                    type: 'player_join',
                    playerId: this.playerId,
                    playerName: this.playerName,
                    playerColor: this.playerColor,
                    isHost: this.isHost
                });

                // If joining, request sync from host
                if (!this.isHost) {
                    setTimeout(() => {
                        this.send({ type: 'sync_request', playerId: this.playerId });
                    }, 100);
                }

                resolve(this.roomId);
            } catch (error) {
                reject(error);
            }
        });
    }

    disconnect() {
        if (this.channel) {
            this.send({ type: 'player_leave', playerId: this.playerId });
            this.channel.close();
            this.channel = null;
        }
        this.connected = false;
        this.players.clear();
        this.roomId = null;
        this.hideLobby();
    }

    send(data) {
        if (this.channel && this.connected) {
            this.channel.postMessage(data);
        }
    }

    // ============================================
    // MESSAGE HANDLING
    // ============================================

    handleMessage(data) {
        // Ignore own messages (except for debugging)
        if (data.playerId === this.playerId && data.type !== 'full_sync') return;

        switch (data.type) {
            case 'player_join':
                this.handlePlayerJoin(data);
                break;
            case 'player_leave':
                this.handlePlayerLeave(data);
                break;
            case 'player_ready':
                this.handlePlayerReady(data);
                break;
            case 'name_change':
                this.handleNameChange(data);
                break;
            case 'game_start':
                this.handleGameStart(data);
                break;
            case 'tower_placed':
                this.handleTowerPlaced(data);
                break;
            case 'tower_upgraded':
                this.handleTowerUpgraded(data);
                break;
            case 'tower_sold':
                this.handleTowerSold(data);
                break;
            case 'wave_start':
                this.handleWaveStart(data);
                break;
            case 'gold_update':
                this.handleGoldUpdate(data);
                break;
            case 'lives_update':
                this.handleLivesUpdate(data);
                break;
            case 'game_over':
                this.handleGameOver(data);
                break;
            case 'chat':
                this.handleChat(data);
                break;
            case 'sync_request':
                if (this.isHost) this.sendFullSync();
                break;
            case 'full_sync':
                this.handleFullSync(data);
                break;
        }

        this.updateLobbyUI();
    }

    handlePlayerJoin(data) {
        if (!this.players.has(data.playerId)) {
            this.players.set(data.playerId, {
                id: data.playerId,
                name: data.playerName,
                color: data.playerColor,
                isHost: data.isHost,
                ready: false
            });
            this.addChatMessage('System', `${data.playerName} joined the room`);
            
            // If we're host, send sync to new player
            if (this.isHost) {
                setTimeout(() => this.sendFullSync(), 100);
            }
        }
    }

    handlePlayerLeave(data) {
        const player = this.players.get(data.playerId);
        if (player) {
            this.addChatMessage('System', `${player.name} left the room`);
            this.players.delete(data.playerId);
        }
    }

    handlePlayerReady(data) {
        const player = this.players.get(data.playerId);
        if (player) {
            player.ready = data.ready;
        }
    }

    handleNameChange(data) {
        const player = this.players.get(data.playerId);
        if (player) {
            player.name = data.playerName;
        }
    }

    handleGameStart(data) {
        this.hideLobby();
        if (this.callbacks.onGameStart) {
            this.callbacks.onGameStart(data.mapId);
        }
    }

    handleTowerPlaced(data) {
        if (this.callbacks.onRemoteTowerPlaced) {
            this.callbacks.onRemoteTowerPlaced(data);
        }
    }

    handleTowerUpgraded(data) {
        if (this.callbacks.onRemoteTowerUpgraded) {
            this.callbacks.onRemoteTowerUpgraded(data);
        }
    }

    handleTowerSold(data) {
        if (this.callbacks.onRemoteTowerSold) {
            this.callbacks.onRemoteTowerSold(data);
        }
    }

    handleWaveStart(data) {
        if (this.callbacks.onRemoteWaveStart) {
            this.callbacks.onRemoteWaveStart(data.wave);
        }
    }

    handleGoldUpdate(data) {
        if (this.game && !this.isHost) {
            this.game.gold = data.gold;
            this.game.updateGoldDisplay();
        }
    }

    handleLivesUpdate(data) {
        if (this.game && !this.isHost) {
            this.game.lives = data.lives;
            this.game.updateLivesDisplay();
        }
    }

    handleGameOver(data) {
        if (this.callbacks.onRemoteGameOver) {
            this.callbacks.onRemoteGameOver(data.isWin);
        }
    }

    handleChat(data) {
        const player = this.players.get(data.playerId);
        const name = player ? player.name : 'Unknown';
        this.addChatMessage(name, data.message);
    }

    handleFullSync(data) {
        // Sync player list
        if (data.players) {
            data.players.forEach(p => {
                if (!this.players.has(p.id)) {
                    this.players.set(p.id, p);
                }
            });
        }
    }

    sendFullSync() {
        this.send({
            type: 'full_sync',
            playerId: this.playerId,
            players: Array.from(this.players.values())
        });
    }

    // ============================================
    // GAME EVENTS - Called by TowerDefense.js
    // ============================================

    setReady(ready) {
        const player = this.players.get(this.playerId);
        if (player) {
            player.ready = ready;
        }
        this.send({ type: 'player_ready', playerId: this.playerId, ready });
        this.updateLobbyUI();
    }

    startGame(mapId = 1) {
        if (!this.isHost) return;
        
        // Check if all players are ready
        const allReady = Array.from(this.players.values()).every(p => p.ready);
        if (!allReady) {
            this.addChatMessage('System', 'All players must be ready to start!');
            return;
        }

        this.send({ type: 'game_start', playerId: this.playerId, mapId });
        this.hideLobby();
        if (this.callbacks.onGameStart) {
            this.callbacks.onGameStart(mapId);
        }
    }

    syncTowerPlaced(tower) {
        this.send({
            type: 'tower_placed',
            playerId: this.playerId,
            playerName: this.playerName,
            playerColor: this.playerColor,
            tower: {
                x: tower.x,
                y: tower.y,
                type: tower.type,
                gridX: tower.gridX,
                gridY: tower.gridY
            }
        });
    }

    syncTowerUpgraded(towerId, gridX, gridY) {
        this.send({
            type: 'tower_upgraded',
            playerId: this.playerId,
            towerId,
            gridX,
            gridY
        });
    }

    syncTowerSold(towerId, gridX, gridY) {
        this.send({
            type: 'tower_sold',
            playerId: this.playerId,
            towerId,
            gridX,
            gridY
        });
    }

    syncWaveStart(wave) {
        if (this.isHost) {
            this.send({ type: 'wave_start', playerId: this.playerId, wave });
        }
    }

    syncGold(gold) {
        if (this.isHost) {
            this.send({ type: 'gold_update', playerId: this.playerId, gold });
        }
    }

    syncLives(lives) {
        if (this.isHost) {
            this.send({ type: 'lives_update', playerId: this.playerId, lives });
        }
    }

    syncGameOver(isWin) {
        if (this.isHost) {
            this.send({ type: 'game_over', playerId: this.playerId, isWin });
        }
    }

    sendChat(message) {
        if (!message.trim()) return;
        this.send({ type: 'chat', playerId: this.playerId, message: message.trim() });
        this.addChatMessage(this.playerName, message.trim());
    }

    // ============================================
    // LOBBY UI
    // ============================================

    showLobby(onStart) {
        this.callbacks.onGameStart = onStart;

        // Remove existing lobby if any
        this.hideLobby();

        const lobby = document.createElement('div');
        lobby.id = 'multiplayer-lobby';
        lobby.className = 'multiplayer-lobby';
        lobby.innerHTML = `
            <div class="lobby-content">
                <div class="lobby-header">
                    <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 1.25em; height: 1.25em; vertical-align: middle; margin-right: 8px;"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="12" x2="6" y2="12"/><line x1="10" y1="12" x2="10" y2="12"/><circle cx="17" cy="12" r="2"/></svg>Multiplayer Lobby</h2>
                    <button class="lobby-close-btn" id="lobby-close">✕</button>
                </div>

                <div class="lobby-room-info">
                    <div class="room-code-label">Room Code</div>
                    <div class="room-code" id="room-code">${this.roomId}</div>
                    <button class="copy-btn" id="copy-code" title="Copy to clipboard"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
                </div>

                <div class="lobby-players">
                    <h3>Players <span id="player-count">(${this.players.size}/4)</span></h3>
                    <div class="player-list" id="player-list">
                        <!-- Players will be added here -->
                    </div>
                </div>

                <div class="lobby-chat">
                    <div class="chat-messages" id="chat-messages">
                        <div class="chat-message system">Welcome to the lobby! Share the room code with friends.</div>
                    </div>
                    <div class="chat-input-row">
                        <input type="text" id="chat-input" placeholder="Type a message..." maxlength="100">
                        <button id="chat-send">Send</button>
                    </div>
                </div>

                <div class="lobby-actions">
                    <button class="btn btn-secondary" id="ready-btn">
                        <span>✓</span>
                        <span>Ready</span>
                    </button>
                    ${this.isHost ? `
                        <button class="btn btn-primary" id="start-game-btn">
                            <span>▶</span>
                            <span>Start Game</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(lobby);
        this.lobbyElement = lobby;

        // Setup event listeners
        document.getElementById('lobby-close')?.addEventListener('click', () => {
            this.disconnect();
        });

        document.getElementById('copy-code')?.addEventListener('click', () => {
            navigator.clipboard.writeText(this.roomId);
            const btn = document.getElementById('copy-code');
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><polyline points="20 6 9 17 4 12"/></svg>';
            setTimeout(() => btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>', 1500);
        });

        document.getElementById('ready-btn')?.addEventListener('click', () => {
            const player = this.players.get(this.playerId);
            const newReady = !player?.ready;
            this.setReady(newReady);
            
            const btn = document.getElementById('ready-btn');
            btn.classList.toggle('ready', newReady);
            btn.querySelector('span:last-child').textContent = newReady ? 'Unready' : 'Ready';
        });

        document.getElementById('start-game-btn')?.addEventListener('click', () => {
            this.startGame(1);
        });

        document.getElementById('chat-send')?.addEventListener('click', () => {
            const input = document.getElementById('chat-input');
            this.sendChat(input.value);
            input.value = '';
        });

        document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const input = document.getElementById('chat-input');
                this.sendChat(input.value);
                input.value = '';
            }
        });

        this.updateLobbyUI();
    }

    hideLobby() {
        if (this.lobbyElement) {
            this.lobbyElement.remove();
            this.lobbyElement = null;
        }
    }

    updateLobbyUI() {
        const playerList = document.getElementById('player-list');
        const playerCount = document.getElementById('player-count');
        
        if (!playerList) return;

        playerCount.textContent = `(${this.players.size}/4)`;

        playerList.innerHTML = '';
        this.players.forEach(player => {
            const div = document.createElement('div');
            div.className = `player-item ${player.ready ? 'ready' : ''}`;
            div.innerHTML = `
                <span class="player-color" style="background: ${player.color}"></span>
                <span class="player-name">${player.name}${player.isHost ? ' <svg viewBox="0 0 24 24" fill="currentColor" style="width: 14px; height: 14px; color: #ffc107;"><path d="M12 2L4 8l2 12h12l2-12L12 2z"/></svg>' : ''}</span>
                <span class="player-status">${player.ready ? '✓ Ready' : 'Waiting...'}</span>
            `;
            playerList.appendChild(div);
        });

        // Update start button state for host
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            const allReady = Array.from(this.players.values()).every(p => p.ready);
            startBtn.disabled = !allReady || this.players.size < 1;
        }
    }

    addChatMessage(name, message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const div = document.createElement('div');
        div.className = `chat-message ${name === 'System' ? 'system' : ''}`;
        div.innerHTML = name === 'System' 
            ? message
            : `<strong>${name}:</strong> ${message}`;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Get player color for tower rendering
    getPlayerColor(playerId) {
        const player = this.players.get(playerId);
        return player ? player.color : '#ffffff';
    }
}

export default TowerDefenseMultiplayer;
