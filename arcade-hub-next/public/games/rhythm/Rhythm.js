/**
 * Rhythm Game - Enhanced Premium Version
 * Improved mechanics, visuals, and controls
 */
import { GameEngine, GameState } from '../../js/engine/GameEngine.js';
import { SongManager, SONG_LIBRARY, DIFFICULTY } from './SongLibrary.js';
import { StoryModeManager } from './StoryMode.js';
import { GameModeManager, GameModeType } from './GameModes.js';
import { AchievementManager } from './AchievementSystem.js';
import { EffectsSystem } from './EffectsSystem.js';
import { RhythmMultiplayer } from './RhythmMultiplayer.js';

// Enhanced Configuration
const LANE_COUNT = 4;
const LANE_WIDTH = 120;
const LANE_GAP = 8;
const NOTE_HEIGHT = 32;
const NOTE_RADIUS = 8;
const HIT_LINE_Y = 500;
const NOTE_SPEED = 400;

// Timing Windows (in pixels)
const PERFECT_WINDOW = 25;
const GOOD_WINDOW = 60;
const OK_WINDOW = 100;

// Lane Colors
const LANE_COLORS = ['#f472b6', '#38bdf8', '#a78bfa', '#34d399'];
const LANE_KEYS = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];

class Rhythm extends GameEngine {
    constructor() {
        super({
            canvasId: 'game-canvas',
            gameId: 'rhythm',
            width: 560,
            height: 600
        });

        // Systems
        this.songManager = new SongManager();
        this.storyManager = new StoryModeManager(this);
        this.modeManager = new GameModeManager(this);
        this.achievementManager = new AchievementManager();
        this.effectsSystem = new EffectsSystem(this.canvas);
        this.multiplayer = new RhythmMultiplayer(this);

        // Game State
        this.notes = [];
        this.currentSongId = null;
        this.currentSong = null;
        this.songTime = 0;
        this.noteIndex = 0;
        this.currentMode = null;
        this.currentModeType = GameModeType.ARCADE;
        this.isMultiplayerGame = false;
        this.mpSelectedSong = null;
        this.isReady = false;

        // Scoring
        this.combo = 0;
        this.maxCombo = 0;
        this.hits = { perfect: 0, good: 0, ok: 0, miss: 0 };
        this.holdsCompleted = 0;
        this.slidesCompleted = 0;
        this.activeHolds = new Map();

        // Input State
        this.lanePressed = [false, false, false, false];
        this.hitEffects = [];

        // Audio
        this.audioContext = null;

        // Settings
        this.settings = this.loadSettings();

        // Countdown state
        this.countdownActive = false;
        this.countdownValue = 3;

        this.init();
    }

    loadSettings() {
        const defaults = { noteSpeed: 1, audioOffset: 0, laneEffects: true, screenFlash: true };
        try {
            const s = localStorage.getItem('rhythm_settings');
            if (s) return { ...defaults, ...JSON.parse(s) };
        } catch (e) {}
        return defaults;
    }

    saveSettings() {
        localStorage.setItem('rhythm_settings', JSON.stringify(this.settings));
    }

    init() {
        // Mode selection
        document.querySelectorAll('.mode-card').forEach(btn => {
            btn.onclick = () => this.selectMode(btn.dataset.mode);
        });

        // SPA Back Button
        document.getElementById('rhythm-back-btn')?.addEventListener('click', () => {
            if (window.GameBridge) {
                window.GameBridge.exitGame();
            } else {
                window.location.href = '../../index.html';
            }
        });

        // Navigation
        document.querySelectorAll('[data-goto]').forEach(btn => {
            btn.onclick = () => this.showScreen(btn.dataset.goto);
        });

        // Song list
        document.getElementById('song-list').onclick = (e) => {
            const item = e.target.closest('.song-item');
            if (item && !item.classList.contains('locked')) {
                this.selectSong(item.dataset.id);
            }
        };

        // Story levels
        document.getElementById('story-chapters').onclick = (e) => {
            const item = e.target.closest('.level-item');
            if (item && !item.classList.contains('locked')) {
                this.startStoryLevel(parseInt(item.dataset.id));
            }
        };

        // Game controls
        document.getElementById('btn-pause').onclick = () => this.pauseGame();
        document.getElementById('btn-resume').onclick = () => this.resumeGame();
        document.getElementById('btn-restart').onclick = () => { this.hideModal('pause'); this.restartSong(); };
        document.getElementById('btn-quit').onclick = () => { this.hideModal('pause'); this.quitToMenu(); };
        document.getElementById('btn-retry').onclick = () => { this.hideModal('results'); this.restartSong(); };
        document.getElementById('btn-menu').onclick = () => { this.hideModal('results'); this.quitToMenu(); };
        document.getElementById('btn-continue').onclick = () => this.continueDialogue();

        // Settings
        document.getElementById('btn-settings').onclick = () => this.showModal('settings');
        document.getElementById('btn-close-settings').onclick = () => this.hideModal('settings');
        this.initSettings();

        // Keyboard
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Touch controls for canvas
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchend', () => this.onTouchEnd());

        // Multiplayer handlers
        this.initMultiplayerUI();

        // Check achievements
        setInterval(() => this.checkAchievements(), 100);

        this.updateMenuStats();
    }

    initMultiplayerUI() {
        // Create Room
        document.getElementById('btn-create-room')?.addEventListener('click', async () => {
            try {
                const code = await this.multiplayer.createRoom('battle');
                this.showMultiplayerLobby(code, true);
            } catch (e) {
                alert('Failed to create room: ' + e.message);
            }
        });

        // Join Room
        document.getElementById('btn-join-room')?.addEventListener('click', () => {
            document.getElementById('mp-options').classList.add('hidden');
            document.getElementById('join-panel').classList.remove('hidden');
        });

        document.getElementById('btn-cancel-join')?.addEventListener('click', () => {
            document.getElementById('join-panel').classList.add('hidden');
            document.getElementById('mp-options').classList.remove('hidden');
        });

        document.getElementById('btn-confirm-join')?.addEventListener('click', async () => {
            const code = document.getElementById('input-room-code').value.trim().toUpperCase();
            if (!code) return;
            try {
                await this.multiplayer.joinRoom(code);
                this.showMultiplayerLobby(code, false);
            } catch (e) {
                alert('Failed to join: ' + e.message);
            }
        });

        // Ready
        document.getElementById('btn-ready')?.addEventListener('click', () => {
            this.isReady = !this.isReady;
            this.multiplayer.setReady(this.isReady);
            const btn = document.getElementById('btn-ready');
            btn.textContent = this.isReady ? 'Not Ready' : 'Ready';
            btn.classList.toggle('ghost', this.isReady);
            document.getElementById('your-status').textContent = this.isReady ? 'Ready' : 'Not Ready';
            document.getElementById('your-status').classList.toggle('ready', this.isReady);
        });

        // Leave
        document.getElementById('btn-leave-room')?.addEventListener('click', async () => {
            await this.multiplayer.leaveRoom();
            this.resetMultiplayerUI();
        });

        // Chat
        document.getElementById('btn-send-chat')?.addEventListener('click', () => this.sendChat());
        document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.sendChat();
        });

        // Song selection in lobby
        document.getElementById('mp-song-list')?.addEventListener('click', (e) => {
            const item = e.target.closest('.mp-song-item');
            if (item && this.multiplayer.isHost) {
                document.querySelectorAll('.mp-song-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                this.mpSelectedSong = item.dataset.id;
                this.multiplayer.selectSong(this.mpSelectedSong);
            }
        });

        // Multiplayer callbacks
        this.multiplayer.onChatCallback = (msg) => this.addChatMessage(msg);
        this.multiplayer.onOpponentUpdateCallback = (state) => this.updateOpponentDisplay(state);
        this.multiplayer.onGameStartCallback = () => this.startMultiplayerGame();
        this.multiplayer.onOpponentFinishCallback = (state) => this.onOpponentFinish(state);
    }

    showMultiplayerLobby(code, isHost) {
        document.getElementById('mp-options').classList.add('hidden');
        document.getElementById('join-panel').classList.add('hidden');
        document.getElementById('mp-lobby').classList.remove('hidden');
        document.getElementById('lobby-code').textContent = code;

        // Populate song list for host
        if (isHost) {
            const songList = document.getElementById('mp-song-list');
            const songs = this.songManager.getUnlockedSongs();
            songList.innerHTML = songs.map(s => `
                <div class="mp-song-item" data-id="${s.id}">
                    <span class="song-icon">${s.thumbnail}</span>
                    <span class="song-name">${s.name}</span>
                </div>
            `).join('');
            document.getElementById('lobby-song-select').classList.remove('hidden');
        } else {
            document.getElementById('lobby-song-select').classList.add('hidden');
        }

        this.isReady = false;
        document.getElementById('your-status').textContent = 'Not Ready';
        document.getElementById('btn-ready').textContent = 'Ready';
    }

    resetMultiplayerUI() {
        document.getElementById('mp-lobby').classList.add('hidden');
        document.getElementById('join-panel').classList.add('hidden');
        document.getElementById('mp-options').classList.remove('hidden');
        document.getElementById('chat-messages').innerHTML = '';
        document.getElementById('opponent-name').textContent = 'Waiting...';
        document.getElementById('opponent-status').textContent = '';
        document.getElementById('opponent-slot').classList.remove('connected');
        this.isReady = false;
        this.mpSelectedSong = null;
    }

    updateOpponentDisplay(state) {
        const slot = document.getElementById('opponent-slot');
        const nameEl = document.getElementById('opponent-name');
        const statusEl = document.getElementById('opponent-status');

        if (state.name && state.name !== 'Opponent') {
            slot.classList.add('connected');
            slot.querySelector('.player-icon').textContent = '👤';
            nameEl.textContent = state.name;
            statusEl.textContent = state.isReady ? 'Ready' : 'Not Ready';
            statusEl.classList.toggle('ready', state.isReady);
        }
    }

    sendChat() {
        const input = document.getElementById('chat-input');
        const msg = input.value.trim();
        if (msg) {
            this.multiplayer.sendChat(msg);
            input.value = '';
        }
    }

    addChatMessage(msg) {
        const container = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.className = 'chat-msg';
        div.innerHTML = `<span class="name">${msg.name}:</span> <span class="text">${msg.message}</span>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    async startMultiplayerGame() {
        const songId = await this.multiplayer.getSongId();
        if (!songId) return;

        this.currentSongId = songId;
        this.currentSong = this.songManager.getSong(songId);
        this.currentModeType = 'multiplayer';
        this.isMultiplayerGame = true;
        this.startGameWithCountdown();
    }

    onOpponentFinish(state) {
        console.log('[MP] Opponent finished:', state);
    }

    initSettings() {
        const speedInput = document.getElementById('set-speed');
        const speedVal = document.getElementById('val-speed');
        if (speedInput) {
            speedInput.value = this.settings.noteSpeed;
            speedVal.textContent = `${this.settings.noteSpeed.toFixed(1)}x`;
            speedInput.oninput = () => {
                this.settings.noteSpeed = parseFloat(speedInput.value);
                speedVal.textContent = `${this.settings.noteSpeed.toFixed(1)}x`;
                this.saveSettings();
            };
        }

        const offsetInput = document.getElementById('set-offset');
        const offsetVal = document.getElementById('val-offset');
        if (offsetInput) {
            offsetInput.value = this.settings.audioOffset;
            offsetVal.textContent = `${this.settings.audioOffset}ms`;
            offsetInput.oninput = () => {
                this.settings.audioOffset = parseInt(offsetInput.value);
                offsetVal.textContent = `${this.settings.audioOffset}ms`;
                this.saveSettings();
            };
        }
    }

    updateMenuStats() {
        const achEl = document.getElementById('stat-achievements');
        const starsEl = document.getElementById('stat-stars');
        const totalStarsEl = document.getElementById('total-stars');
        
        if (achEl) achEl.textContent = this.achievementManager.unlockedAchievements?.size || 0;
        if (starsEl) starsEl.textContent = this.storyManager.getTotalStars();
        if (totalStarsEl) totalStarsEl.textContent = this.storyManager.getTotalStars();
    }

    // Screen Management
    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`screen-${id}`)?.classList.add('active');
    }

    showModal(id) {
        document.getElementById(`modal-${id}`)?.classList.add('active');
    }

    hideModal(id) {
        document.getElementById(`modal-${id}`)?.classList.remove('active');
    }

    quitToMenu() {
        this.state = GameState.MENU;
        this.showScreen('menu');
        this.updateMenuStats();
    }

    // Mode Selection
    selectMode(mode) {
        this.currentModeType = mode;
        
        switch (mode) {
            case 'story':
                this.showScreen('story');
                this.populateStory();
                break;
            case 'multiplayer':
                this.showScreen('multiplayer');
                break;
            case 'arcade':
            case 'practice':
            case 'zen':
                this.showScreen('songs');
                this.populateSongs();
                break;
            case 'endless':
                this.startEndless();
                break;
            case 'challenge':
                this.startChallenge();
                break;
        }
    }

    populateSongs() {
        const list = document.getElementById('song-list');
        const songs = this.songManager.getAllSongs();
        
        list.innerHTML = songs.map(s => `
            <div class="song-item ${s.unlocked ? '' : 'locked'}" data-id="${s.id}">
                <span class="song-icon">${s.thumbnail}</span>
                <div class="song-info">
                    <div class="song-name">${s.name}</div>
                    <div class="song-artist">${s.artist}</div>
                </div>
                <div class="song-meta">
                    <span class="song-diff" style="color:${SongManager.getDifficultyColor(s.difficulty)}">${SongManager.getDifficultyLabel(s.difficulty)}</span>
                    <div class="song-bpm">${s.bpm} BPM</div>
                </div>
            </div>
        `).join('');
    }

    populateStory() {
        const container = document.getElementById('story-chapters');
        const chapters = this.storyManager.getAllChapters();
        document.getElementById('total-stars').textContent = this.storyManager.getTotalStars();

        container.innerHTML = chapters.map(ch => {
            const levels = this.storyManager.getLevelsByChapter(ch.id);
            const unlocked = this.storyManager.progress.unlockedChapters.includes(ch.id);
            
            return `
                <div class="chapter ${unlocked ? '' : 'locked'}">
                    <div class="chapter-head" style="border-color:${ch.color}">
                        <span>Chapter ${ch.id}: ${ch.name}</span>
                        ${unlocked ? '' : '🔒'}
                    </div>
                    <div class="chapter-levels">
                        ${levels.map(lv => {
                            const lvUnlocked = this.storyManager.isLevelUnlocked(lv.id);
                            const stars = this.storyManager.getLevelStars(lv.id);
                            return `
                                <div class="level-item ${lvUnlocked ? '' : 'locked'} ${lv.isBoss ? 'boss' : ''}" data-id="${lv.id}">
                                    <span class="level-num">${lv.id}</span>
                                    <div class="level-info">
                                        <div class="level-name">${lv.name}</div>
                                        <div class="level-desc">${lv.description}</div>
                                    </div>
                                    <div class="level-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    selectSong(songId) {
        const song = this.songManager.getSong(songId);
        if (!song?.unlocked) return;

        this.currentSongId = songId;
        this.currentSong = song;
        this.currentMode = this.modeManager.setMode(this.currentModeType, this.storyManager);
        this.currentMode.initialize(songId);
        this.startGameWithCountdown();
    }

    startStoryLevel(levelId) {
        if (!this.storyManager.isLevelUnlocked(levelId)) return;
        
        this.currentModeType = 'story';
        this.currentMode = this.modeManager.setMode('story', this.storyManager);
        const data = this.currentMode.initialize(levelId);
        if (!data) return;

        this.currentSongId = data.songId;
        this.currentSong = this.songManager.getSong(data.songId);
        
        this.pendingCallback = () => this.startGameWithCountdown();
        document.getElementById('dialogue-text').textContent = data.dialogue.start;
        this.showModal('dialogue');
    }

    continueDialogue() {
        this.hideModal('dialogue');
        if (this.pendingCallback) {
            this.pendingCallback();
            this.pendingCallback = null;
        }
    }

    startEndless() {
        this.currentModeType = 'endless';
        this.currentMode = this.modeManager.setMode('endless');
        const songs = this.songManager.getUnlockedSongs();
        const song = songs[Math.floor(Math.random() * songs.length)];
        this.currentSongId = song.id;
        this.currentSong = song;
        this.currentMode.initialize(song.id);
        this.startGameWithCountdown();
    }

    startChallenge() {
        this.currentModeType = 'challenge';
        this.currentMode = this.modeManager.setMode('challenge');
        const songs = this.songManager.getUnlockedSongs();
        const song = songs[Math.floor(Math.random() * songs.length)];
        this.currentSongId = song.id;
        this.currentSong = song;
        this.currentMode.initialize(song.id);
        this.startGameWithCountdown();
    }

    startGameWithCountdown() {
        this.showScreen('game');
        
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Update HUD
        document.getElementById('hud-name').textContent = this.currentSong.name;
        document.getElementById('hud-mode').textContent = this.currentModeType.toUpperCase();

        this.reset();
        this.runCountdown();
    }

    runCountdown() {
        const overlay = document.getElementById('countdown');
        const numEl = document.getElementById('countdown-num');
        
        overlay.classList.remove('hidden');
        this.countdownValue = 3;
        numEl.textContent = this.countdownValue;
        
        const tick = () => {
            this.countdownValue--;
            if (this.countdownValue > 0) {
                numEl.textContent = this.countdownValue;
                this.playSound(660);
                setTimeout(tick, 1000);
            } else {
                numEl.textContent = 'GO!';
                this.playSound(880);
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    this.start();
                }, 500);
            }
        };
        
        this.playSound(660);
        setTimeout(tick, 1000);
    }

    pauseGame() {
        if (this.state === GameState.PLAYING) {
            this.pause();
            document.getElementById('pause-song').textContent = this.currentSong.name;
            const progress = Math.round((this.songTime / this.currentSong.duration) * 100);
            document.getElementById('pause-progress').textContent = `${progress}% Complete`;
            this.showModal('pause');
        }
    }

    resumeGame() {
        this.hideModal('pause');
        this.resume();
    }

    restartSong() {
        this.reset();
        this.runCountdown();
    }

    onReset() {
        this.notes = [];
        this.songTime = 0;
        this.noteIndex = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hits = { perfect: 0, good: 0, ok: 0, miss: 0 };
        this.hitEffects = [];
        this.lanePressed = [false, false, false, false];
        this.activeHolds.clear();
        this.holdsCompleted = 0;
        this.slidesCompleted = 0;
        this.effectsSystem.clear();
        this.updateHUD();
        this.updateProgress(0);
    }

    // Input Handling
    onKeyDown(e) {
        const lane = LANE_KEYS.indexOf(e.code);
        if (lane !== -1) {
            e.preventDefault();
            if (this.state === GameState.PLAYING) {
                this.hitLane(lane);
            }
            this.lanePressed[lane] = true;
            this.updateReceptor(lane, true);
        }
        
        if (e.code === 'Escape') {
            e.preventDefault();
            if (this.state === GameState.PLAYING) this.pauseGame();
            else if (this.state === GameState.PAUSED) this.resumeGame();
        }
        
        if (e.code === 'Space' && this.state === GameState.PLAYING) {
            e.preventDefault();
            this.pauseGame();
        }
    }

    onKeyUp(e) {
        const lane = LANE_KEYS.indexOf(e.code);
        if (lane !== -1) {
            this.lanePressed[lane] = false;
            this.updateReceptor(lane, false);
            this.releaseHold(lane);
        }
    }

    updateReceptor(lane, active) {
        const receptor = document.querySelector(`.receptor[data-lane="${lane}"]`);
        if (receptor) {
            receptor.classList.toggle('active', active);
        }
    }

    onTouchStart(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) / rect.width * this.canvas.width;
            const lane = Math.floor((x - this.getLaneStartX()) / LANE_WIDTH);
            if (lane >= 0 && lane < LANE_COUNT && this.state === GameState.PLAYING) {
                this.hitLane(lane);
                this.lanePressed[lane] = true;
                this.updateReceptor(lane, true);
            }
        }
    }

    onTouchEnd() {
        for (let i = 0; i < LANE_COUNT; i++) {
            if (this.lanePressed[i]) this.releaseHold(i);
            this.lanePressed[i] = false;
            this.updateReceptor(i, false);
        }
    }

    getLaneStartX() {
        return (this.canvas.width - LANE_COUNT * LANE_WIDTH) / 2;
    }

    // Hit Detection
    hitLane(lane) {
        let closest = null;
        let closestDist = Infinity;

        for (const note of this.notes) {
            if (note.lane === lane && !note.hit && !note.missed) {
                const dist = Math.abs(note.y - HIT_LINE_Y);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = note;
                }
            }
        }

        if (!closest || closestDist > OK_WINDOW) return;

        let hitType, points;
        if (closestDist <= PERFECT_WINDOW) { 
            hitType = 'perfect'; 
            points = 300; 
            this.hits.perfect++;
        } else if (closestDist <= GOOD_WINDOW) { 
            hitType = 'good'; 
            points = 100; 
            this.hits.good++;
        } else { 
            hitType = 'ok'; 
            points = 50; 
            this.hits.ok++;
        }

        closest.hit = true;

        // Handle note types
        if (closest.type === 'hold') {
            this.activeHolds.set(lane, { note: closest, startTime: this.songTime, hitType });
        } else {
            if (closest.type === 'slide') this.slidesCompleted++;
            this.currentMode?.onNoteHit?.(hitType, closest.type || 'tap');
        }

        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.currentMode?.onCombo?.(this.combo);

        // Scoring
        const speedMult = this.currentMode?.getSpeedMultiplier?.() || 1;
        const comboBonus = Math.min(this.combo, 50) / 10;
        this.addScore(Math.floor(points * (1 + comboBonus) * speedMult));

        // Visual effects
        const x = this.getLaneStartX() + lane * LANE_WIDTH + LANE_WIDTH / 2;
        this.effectsSystem.createHitEffect(x, HIT_LINE_Y, hitType, lane);
        this.effectsSystem.createComboEffect(this.combo);
        
        // Floating hit text
        this.hitEffects.push({ x, y: HIT_LINE_Y, type: hitType, life: 0.6, scale: 1 });
        
        // Show feedback text on screen
        this.showHitFeedback(hitType);

        // Sound
        this.playSound(hitType === 'perfect' ? 880 : hitType === 'good' ? 660 : 440);
        this.updateHUD();
    }

    showHitFeedback(type) {
        const el = document.getElementById('hit-feedback');
        if (!el) return;
        
        el.className = `hit-feedback show ${type}`;
        el.textContent = type.toUpperCase();
        
        setTimeout(() => {
            el.classList.remove('show');
        }, 400);
    }

    releaseHold(lane) {
        const hold = this.activeHolds.get(lane);
        if (!hold) return;
        const dur = this.songTime - hold.startTime;
        if (dur >= (hold.note.duration || 0.5) * 0.8) {
            this.holdsCompleted++;
            this.currentMode?.onNoteHit?.(hold.hitType, 'hold');
        }
        this.activeHolds.delete(lane);
    }

    playSound(freq) {
        if (!this.audioContext) return;
        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            const now = this.audioContext.currentTime;
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.start(now);
            osc.stop(now + 0.06);
        } catch (e) {}
    }

    // Game Loop
    update(dt) {
        const speed = (this.currentMode?.getSpeedMultiplier?.() || 1) * this.settings.noteSpeed;
        this.songTime += dt;
        this.currentMode?.update?.(dt);

        // Spawn notes
        if (this.currentSong) {
            while (this.noteIndex < this.currentSong.patterns.length) {
                const n = this.currentSong.patterns[this.noteIndex];
                const spawnTime = n.time - (HIT_LINE_Y / (NOTE_SPEED * speed));
                if (this.songTime >= spawnTime) {
                    this.notes.push({
                        lane: n.lane,
                        y: -NOTE_HEIGHT,
                        type: n.type || 'tap',
                        duration: n.duration,
                        hit: false,
                        missed: false
                    });
                    this.noteIndex++;
                } else break;
            }
        }

        // Move notes
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];
            note.y += NOTE_SPEED * speed * dt;

            // Miss detection
            if (!note.hit && !note.missed && note.y > HIT_LINE_Y + OK_WINDOW) {
                note.missed = true;
                if (this.currentMode?.shouldCountMiss?.() !== false) {
                    this.hits.miss++;
                    this.combo = 0;
                    this.effectsSystem.breakCombo();
                    this.currentMode?.onNoteMiss?.();
                    
                    const x = this.getLaneStartX() + note.lane * LANE_WIDTH + LANE_WIDTH / 2;
                    this.effectsSystem.createMissEffect(x, HIT_LINE_Y, note.lane);
                    this.showHitFeedback('miss');
                }
                this.updateHUD();
            }

            if (note.y > this.canvas.height + NOTE_HEIGHT) {
                this.notes.splice(i, 1);
            }
        }

        // Update hit effects
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            this.hitEffects[i].life -= dt;
            this.hitEffects[i].y -= 80 * dt;
            this.hitEffects[i].scale += 0.5 * dt;
            if (this.hitEffects[i].life <= 0) this.hitEffects.splice(i, 1);
        }

        this.effectsSystem.update(dt);

        // Update progress
        const progress = this.currentSong ? (this.songTime / this.currentSong.duration) * 100 : 0;
        this.updateProgress(Math.min(progress, 100));

        // End conditions
        if (this.currentMode?.checkEndCondition?.()) {
            this.endSong(false);
        } else if (this.noteIndex >= (this.currentSong?.patterns.length || 0) && this.notes.length === 0) {
            this.endSong(true);
        }
    }

    updateHUD() {
        document.getElementById('hud-score').textContent = this.score.toLocaleString();
        
        const comboEl = document.getElementById('hud-combo');
        comboEl.textContent = this.combo;
        if (this.combo > 0 && this.combo % 10 === 0) {
            comboEl.classList.add('pulse');
            setTimeout(() => comboEl.classList.remove('pulse'), 200);
        }
        
        document.getElementById('hud-acc').textContent = `${this.getAccuracy().toFixed(0)}%`;
    }

    updateProgress(percent) {
        const fill = document.getElementById('progress-fill');
        if (fill) fill.style.width = `${percent}%`;
    }

    getAccuracy() {
        const total = this.hits.perfect + this.hits.good + this.hits.ok + this.hits.miss;
        if (total === 0) return 100;
        return (this.hits.perfect * 100 + this.hits.good * 70 + this.hits.ok * 40) / total;
    }

    endSong(completed) {
        const acc = this.getAccuracy();
        let grade = 'f';
        if (acc >= 95) grade = 's';
        else if (acc >= 90) grade = 'a';
        else if (acc >= 80) grade = 'b';
        else if (acc >= 70) grade = 'c';
        else if (acc >= 60) grade = 'd';

        const results = {
            completed,
            songId: this.currentSongId,
            accuracy: acc,
            grade,
            score: this.score,
            maxCombo: this.maxCombo,
            perfectHits: this.hits.perfect,
            goodHits: this.hits.good,
            okHits: this.hits.ok,
            misses: this.hits.miss,
            holdsCompleted: this.holdsCompleted,
            slidesCompleted: this.slidesCompleted,
            speed: this.currentMode?.getSpeedMultiplier?.() || 1
        };

        this.achievementManager.updateStats(results);
        this.gameOver(completed);
        this.showResults(results);
    }

    showResults(r) {
        document.getElementById('result-song').textContent = this.currentSong.name;
        document.getElementById('result-mode-badge').textContent = this.currentModeType.toUpperCase();
        
        const gradeEl = document.getElementById('result-grade');
        gradeEl.textContent = r.grade.toUpperCase();
        gradeEl.className = `grade ${r.grade}`;
        
        document.getElementById('r-score').textContent = r.score.toLocaleString();
        document.getElementById('r-acc').textContent = `${r.accuracy.toFixed(1)}%`;
        document.getElementById('r-combo').textContent = `${r.maxCombo}x`;
        document.getElementById('r-perfect').textContent = r.perfectHits;
        document.getElementById('r-good').textContent = r.goodHits;
        document.getElementById('r-ok').textContent = r.okHits;
        document.getElementById('r-miss').textContent = r.misses;
        
        this.showModal('results');
    }

    checkAchievements() {
        const a = this.achievementManager.getNextNotification?.();
        if (a) {
            document.getElementById('toast-icon').textContent = a.icon;
            document.getElementById('toast-name').textContent = a.name;
            document.getElementById('toast').classList.add('show');
            setTimeout(() => document.getElementById('toast').classList.remove('show'), 3000);
        }
    }

    // Rendering
    render() {
        const ctx = this.ctx;
        const startX = this.getLaneStartX();

        // Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGrad.addColorStop(0, '#08080c');
        bgGrad.addColorStop(1, '#0a0a10');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Background pulse effect
        this.effectsSystem.renderPulse(ctx, this.canvas.width, this.canvas.height);

        // Draw lanes with gradient backgrounds
        for (let i = 0; i < LANE_COUNT; i++) {
            const x = startX + i * LANE_WIDTH;
            const color = LANE_COLORS[i];

            // Lane glow when pressed
            if (this.lanePressed[i]) {
                const glowGrad = ctx.createLinearGradient(x, 0, x, this.canvas.height);
                glowGrad.addColorStop(0, 'transparent');
                glowGrad.addColorStop(0.7, this.hexToRgba(color, 0.1));
                glowGrad.addColorStop(1, this.hexToRgba(color, 0.2));
                ctx.fillStyle = glowGrad;
                ctx.fillRect(x, 0, LANE_WIDTH, this.canvas.height);
            }

            // Lane dividers
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        // Right edge
        ctx.beginPath();
        ctx.moveTo(startX + LANE_COUNT * LANE_WIDTH, 0);
        ctx.lineTo(startX + LANE_COUNT * LANE_WIDTH, this.canvas.height);
        ctx.stroke();

        // Hit zone with glow
        const hitZoneGrad = ctx.createLinearGradient(0, HIT_LINE_Y - 40, 0, HIT_LINE_Y + 40);
        hitZoneGrad.addColorStop(0, 'transparent');
        hitZoneGrad.addColorStop(0.5, 'rgba(255,255,255,0.06)');
        hitZoneGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = hitZoneGrad;
        ctx.fillRect(startX, HIT_LINE_Y - 40, LANE_COUNT * LANE_WIDTH, 80);

        // Hit line
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(255,255,255,0.3)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(startX, HIT_LINE_Y);
        ctx.lineTo(startX + LANE_COUNT * LANE_WIDTH, HIT_LINE_Y);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw hit receptors on canvas (circles at hit line)
        for (let i = 0; i < LANE_COUNT; i++) {
            const x = startX + i * LANE_WIDTH + LANE_WIDTH / 2;
            const color = LANE_COLORS[i];
            
            ctx.beginPath();
            ctx.arc(x, HIT_LINE_Y, 25, 0, Math.PI * 2);
            
            if (this.lanePressed[i]) {
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = 20;
                ctx.fill();
            } else {
                ctx.strokeStyle = this.hexToRgba(color, 0.4);
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        }

        // Draw notes
        for (const note of this.notes) {
            if (note.hit || note.missed) continue;
            
            const x = startX + note.lane * LANE_WIDTH + 12;
            const w = LANE_WIDTH - 24;
            const color = LANE_COLORS[note.lane];

            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.fillStyle = color;

            if (note.type === 'hold') {
                const h = (note.duration || 0.5) * NOTE_SPEED * (this.currentMode?.getSpeedMultiplier?.() || 1);
                
                // Hold trail
                ctx.globalAlpha = 0.35;
                ctx.beginPath();
                ctx.roundRect(x + 8, note.y - h, w - 16, h, 4);
                ctx.fill();
                
                // Hold head
                ctx.globalAlpha = 1;
            }

            if (note.type === 'slide') {
                // Diamond shape for slide
                const cx = x + w / 2;
                ctx.beginPath();
                ctx.moveTo(cx, note.y);
                ctx.lineTo(x + w, note.y + NOTE_HEIGHT / 2);
                ctx.lineTo(cx, note.y + NOTE_HEIGHT);
                ctx.lineTo(x, note.y + NOTE_HEIGHT / 2);
                ctx.closePath();
                ctx.fill();
            } else {
                // Regular rounded note
                ctx.beginPath();
                ctx.roundRect(x, note.y, w, NOTE_HEIGHT, NOTE_RADIUS);
                ctx.fill();
            }
            
            ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = 1;

        // Draw floating hit text
        for (const e of this.hitEffects) {
            const alpha = e.life / 0.6;
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.scale(e.scale, e.scale);
            ctx.globalAlpha = alpha;
            
            ctx.fillStyle = e.type === 'perfect' ? '#10b981' :
                           e.type === 'good' ? '#38bdf8' :
                           e.type === 'ok' ? '#fbbf24' : '#ef4444';
            ctx.font = '700 20px Inter';
            ctx.textAlign = 'center';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.fillText(e.type.toUpperCase(), 0, 0);
            
            ctx.restore();
        }

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Effects overlay
        this.effectsSystem.render(ctx);
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new Rhythm();
});
