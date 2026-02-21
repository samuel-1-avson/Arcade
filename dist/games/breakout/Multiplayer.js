/**
 * Breakout Game - Multiplayer System
 * Room-based cooperative gameplay with WebSocket synchronization
 */

import { ICONS } from './Icons.js';

/**
 * MultiplayerManager - Handles room-based multiplayer
 */
export class MultiplayerManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.roomId = null;
        this.playerId = this.generatePlayerId();
        this.playerName = localStorage.getItem('breakout_player_name') || 'Player';
        this.players = new Map();
        this.isHost = false;
        this.connected = false;
        this.gameState = null;
        
        // Callbacks
        this.onPlayerJoin = null;
        this.onPlayerLeave = null;
        this.onGameStart = null;
        this.onBrickSync = null;
        this.onScoreUpdate = null;
    }
    
    generatePlayerId() {
        return 'p_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }
    
    setPlayerName(name) {
        this.playerName = name.trim() || 'Player';
        localStorage.setItem('breakout_player_name', this.playerName);
    }
    
    // ===== Connection Management =====
    
    /**
     * Connect to multiplayer server
     * For this demo, we'll use BroadcastChannel for local tab-to-tab communication
     * In production, replace with WebSocket to a real server
     */
    connect(roomId = null) {
        return new Promise((resolve, reject) => {
            try {
                // Use BroadcastChannel for local multiplayer demo
                // This allows multiple browser tabs to communicate
                this.roomId = roomId || this.generateRoomCode();
                this.socket = new BroadcastChannel(`breakout_room_${this.roomId}`);
                this.isHost = !roomId;
                
                this.socket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };
                
                this.connected = true;
                
                // Announce join
                this.send({
                    type: 'player_join',
                    playerId: this.playerId,
                    playerName: this.playerName,
                    isHost: this.isHost
                });
                
                // Add self to players
                this.players.set(this.playerId, {
                    id: this.playerId,
                    name: this.playerName,
                    score: 0,
                    isHost: this.isHost,
                    ready: false
                });
                
                resolve(this.roomId);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    disconnect() {
        if (this.socket) {
            this.send({ type: 'player_leave', playerId: this.playerId });
            this.socket.close();
            this.socket = null;
        }
        this.connected = false;
        this.roomId = null;
        this.players.clear();
    }
    
    // ===== Messaging =====
    
    send(data) {
        if (!this.socket) return;
        this.socket.postMessage(data);
    }
    
    handleMessage(data) {
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
            case 'game_start':
                this.handleGameStart(data);
                break;
            case 'brick_hit':
                this.handleBrickHit(data);
                break;
            case 'score_update':
                this.handleScoreUpdate(data);
                break;
            case 'game_end':
                this.handleGameEnd(data);
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
    }
    
    // ===== Event Handlers =====
    
    handlePlayerJoin(data) {
        if (data.playerId === this.playerId) return;
        
        this.players.set(data.playerId, {
            id: data.playerId,
            name: data.playerName,
            score: 0,
            isHost: data.isHost,
            ready: false
        });
        
        // If we're host, send current state
        if (this.isHost) {
            this.sendFullSync();
        }
        
        if (this.onPlayerJoin) this.onPlayerJoin(data);
        this.updateLobbyUI();
    }
    
    handlePlayerLeave(data) {
        this.players.delete(data.playerId);
        if (this.onPlayerLeave) this.onPlayerLeave(data);
        this.updateLobbyUI();
    }
    
    handlePlayerReady(data) {
        const player = this.players.get(data.playerId);
        if (player) {
            player.ready = data.ready;
            this.updateLobbyUI();
        }
    }
    
    handleGameStart(data) {
        this.gameState = 'playing';
        if (this.onGameStart) this.onGameStart(data);
    }
    
    handleBrickHit(data) {
        // Sync brick destruction
        if (data.playerId !== this.playerId && this.onBrickSync) {
            this.onBrickSync(data);
        }
    }
    
    handleScoreUpdate(data) {
        const player = this.players.get(data.playerId);
        if (player) {
            player.score = data.score;
            if (this.onScoreUpdate) this.onScoreUpdate(data);
            this.updateScoreboardUI();
        }
    }
    
    handleGameEnd(data) {
        this.gameState = 'ended';
        this.showGameEndResults(data);
    }
    
    handleChat(data) {
        this.addChatMessage(data.playerName, data.message);
    }
    
    handleFullSync(data) {
        // Update players list
        for (const player of data.players) {
            this.players.set(player.id, player);
        }
        this.updateLobbyUI();
    }
    
    sendFullSync() {
        this.send({
            type: 'full_sync',
            players: Array.from(this.players.values())
        });
    }
    
    // ===== Game Actions =====
    
    setReady(ready) {
        const player = this.players.get(this.playerId);
        if (player) {
            player.ready = ready;
        }
        this.send({
            type: 'player_ready',
            playerId: this.playerId,
            ready
        });
        this.updateLobbyUI();
    }
    
    startGame(mapId) {
        if (!this.isHost) return;
        
        this.send({
            type: 'game_start',
            mapId,
            hostPlayerId: this.playerId
        });
        
        // Also trigger locally
        this.handleGameStart({ mapId });
    }
    
    reportBrickHit(brickIndex, destroyed) {
        this.send({
            type: 'brick_hit',
            playerId: this.playerId,
            brickIndex,
            destroyed
        });
    }
    
    reportScore(score) {
        const player = this.players.get(this.playerId);
        if (player) {
            player.score = score;
        }
        this.send({
            type: 'score_update',
            playerId: this.playerId,
            score
        });
        this.updateScoreboardUI();
    }
    
    endGame(winnerId = null) {
        this.send({
            type: 'game_end',
            winnerId,
            scores: Array.from(this.players.values()).map(p => ({
                id: p.id,
                name: p.name,
                score: p.score
            }))
        });
    }
    
    sendChat(message) {
        this.send({
            type: 'chat',
            playerId: this.playerId,
            playerName: this.playerName,
            message
        });
        this.addChatMessage(this.playerName, message);
    }
    
    // ===== UI =====
    
    showLobby(onStart) {
        const existing = document.getElementById('multiplayer-lobby');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.id = 'multiplayer-lobby';
        overlay.className = 'fullscreen-overlay';
        
        overlay.innerHTML = `
            <h2 class="lobby-header">Multiplayer Lobby</h2>
            <div class="lobby-code-container">
                Room Code: <span id="room-code" class="lobby-code">${this.roomId}</span>
                <button id="copy-code-btn" class="btn btn-ghost btn-small" style="margin-left: 10px;">Copy</button>
            </div>
            
            <div class="lobby-container">
                <div class="lobby-column">
                    <h3 class="lobby-section-title">PLAYERS</h3>
                    <div id="players-list" class="lobby-list"></div>
                </div>
                
                <div class="lobby-column">
                    <h3 class="lobby-section-title">CHAT</h3>
                    <div id="chat-messages" class="chat-container"></div>
                    <div class="chat-input-row">
                        <input type="text" id="chat-input" class="chat-input" placeholder="Type a message...">
                        <button id="chat-send" class="btn btn-primary" style="padding: 10px 20px;">Send</button>
                    </div>
                </div>
            </div>
            
            <div class="lobby-controls">
                <button id="ready-btn" class="btn btn-primary">Ready</button>
                ${this.isHost ? '<button id="start-game-btn" class="btn btn-primary">Start Game</button>' : ''}
                <button id="leave-lobby-btn" class="btn btn-ghost">Leave</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.updateLobbyUI();
        
        // Event listeners
        document.getElementById('copy-code-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(this.roomId);
            document.getElementById('copy-code-btn').textContent = 'Copied!';
            setTimeout(() => {
                document.getElementById('copy-code-btn').textContent = 'Copy';
            }, 2000);
        });
        
        document.getElementById('ready-btn').addEventListener('click', () => {
            const player = this.players.get(this.playerId);
            const newReady = !player?.ready;
            this.setReady(newReady);
            document.getElementById('ready-btn').textContent = newReady ? 'Not Ready' : 'Ready';
            document.getElementById('ready-btn').style.background = newReady ? '#c47272' : '#7dba84';
        });
        
        document.getElementById('start-game-btn')?.addEventListener('click', () => {
            overlay.remove();
            if (onStart) onStart();
        });
        
        document.getElementById('leave-lobby-btn').addEventListener('click', () => {
            this.disconnect();
            overlay.remove();
        });
        
        document.getElementById('chat-send').addEventListener('click', () => {
            const input = document.getElementById('chat-input');
            if (input.value.trim()) {
                this.sendChat(input.value.trim());
                input.value = '';
            }
        });
        
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('chat-send').click();
            }
        });
    }
    
    updateLobbyUI() {
        const list = document.getElementById('players-list');
        if (!list) return;
        
        let html = '';
        for (const player of this.players.values()) {
            const isMe = player.id === this.playerId;
            html += `
                <div class="player-row">
                    <span class="player-row-name" style="color: ${isMe ? 'var(--accent-blue)' : '#e8eaed'};">
                        ${player.name} ${player.isHost ? `<span style="width: 16px; color: #ffd700;">${ICONS.CROWN}</span>` : ''} ${isMe ? '(You)' : ''}
                    </span>
                    <span class="player-row-status" style="color: ${player.ready ? '#7dba84' : '#c47272'};">
                        ${player.ready ? `<span style="width: 14px;">${ICONS.UNLOCK}</span> Ready` : 'Waiting'}
                    </span>
                </div>
            `;
        }
        list.innerHTML = html || '<div style="color: #6b7280; text-align: center;">Waiting for players...</div>';
    }
    
    updateScoreboardUI() {
        const scoreboard = document.getElementById('multiplayer-scoreboard');
        if (!scoreboard) return;
        
        const sorted = Array.from(this.players.values()).sort((a, b) => b.score - a.score);
        let html = '';
        for (let i = 0; i < sorted.length; i++) {
            const p = sorted[i];
            html += `
                <div style="display: flex; justify-content: space-between; padding: 5px 0; ${p.id === this.playerId ? 'color: #6b8aad;' : ''}">
                    <span>${i + 1}. ${p.name}</span>
                    <span>${p.score}</span>
                </div>
            `;
        }
        scoreboard.innerHTML = html;
    }
    
    addChatMessage(name, message) {
        const chat = document.getElementById('chat-messages');
        if (!chat) return;
        
        const msg = document.createElement('div');
        msg.style.cssText = 'margin-bottom: 8px; font-size: 0.8rem;';
        msg.innerHTML = `<span style="color: #6b8aad;">${name}:</span> <span style="color: #e8eaed;">${message}</span>`;
        chat.appendChild(msg);
        chat.scrollTop = chat.scrollHeight;
    }
    
    showGameEndResults(data) {
        const sorted = data.scores.sort((a, b) => b.score - a.score);
        const winner = sorted[0];
        
        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-overlay';
        
        let html = `<h2 style="color: #e8eaed; margin-bottom: 20px;">Game Over!</h2>`;
        html += `<div style="font-size: 1.5rem; color: #c9a857; margin-bottom: 30px; display: flex; align-items: center; gap: 10px;"><span style="width: 30px;">${ICONS.TROPHY}</span> ${winner.name} Wins!</div>`;
        html += `<div style="background: #111; border: 1px solid #333; padding: 20px; min-width: 300px;">`;
        
        for (let i = 0; i < sorted.length; i++) {
            const p = sorted[i];
            html += `
                <div class="player-row">
                    <span style="color: ${i === 0 ? '#c9a857' : '#e8eaed'};">${i + 1}. ${p.name}</span>
                    <span style="color: #6b8aad;">${p.score}</span>
                </div>
            `;
        }
        
        html += `</div>`;
        html += `<button onclick="this.parentElement.remove()" class="btn btn-primary" style="margin-top: 30px;">Close</button>`;
        
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
    }
    
    createInGameScoreboard() {
        const existing = document.getElementById('multiplayer-scoreboard');
        if (existing) return;
        
        const panel = document.createElement('div');
        panel.id = 'multiplayer-scoreboard';
        panel.className = 'mp-scoreboard-overlay';
        
        document.body.appendChild(panel);
        this.updateScoreboardUI();
    }
    
    removeInGameScoreboard() {
        document.getElementById('multiplayer-scoreboard')?.remove();
    }
}

export default { MultiplayerManager };
