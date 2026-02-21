/**
 * Snake Game - Polish & Optimization System
 * Save/Load, Cloud Saves, Replay System, Screenshot Mode, Performance Optimization
 */

// Performance Monitor
export class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.fps = 60;
        this.frameTimes = [];
        this.maxFrameTimes = 60;
        this.lastFrameTime = performance.now();
        
        this.memoryUsage = 0;
        this.drawCalls = 0;
        
        this.optimizationLevel = 'high'; // low, medium, high
        this.targetFPS = 60;
    }
    
    startFrame() {
        this.frameStartTime = performance.now();
    }
    
    endFrame() {
        const now = performance.now();
        const frameTime = now - this.lastFrameTime;
        this.lastFrameTime = now;
        
        this.frameTimes.push(frameTime);
        if (this.frameTimes.length > this.maxFrameTimes) {
            this.frameTimes.shift();
        }
        
        // Calculate FPS
        const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        this.fps = Math.round(1000 / avgFrameTime);
        
        this.frameCount++;
        
        // Auto-optimize if FPS drops
        if (this.fps < 30 && this.optimizationLevel !== 'low') {
            this.downgrade();
        } else if (this.fps > 55 && this.optimizationLevel !== 'high') {
            this.upgrade();
        }
        
        // Memory check (if available)
        if (performance.memory) {
            this.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576);
        }
    }
    
    downgrade() {
        if (this.optimizationLevel === 'high') {
            this.optimizationLevel = 'medium';
            console.log('Performance: Downgrading to medium quality');
        } else if (this.optimizationLevel === 'medium') {
            this.optimizationLevel = 'low';
            console.log('Performance: Downgrading to low quality');
        }
    }
    
    upgrade() {
        if (this.optimizationLevel === 'low') {
            this.optimizationLevel = 'medium';
            console.log('Performance: Upgrading to medium quality');
        } else if (this.optimizationLevel === 'medium') {
            this.optimizationLevel = 'high';
            console.log('Performance: Upgrading to high quality');
        }
    }
    
    getOptimizationSettings() {
        const settings = {
            low: {
                particles: false,
                postProcessing: false,
                shadows: false,
                antialiasing: false,
                maxParticles: 50,
                trailLength: 0
            },
            medium: {
                particles: true,
                postProcessing: false,
                shadows: false,
                antialiasing: true,
                maxParticles: 200,
                trailLength: 5
            },
            high: {
                particles: true,
                postProcessing: true,
                shadows: true,
                antialiasing: true,
                maxParticles: 1000,
                trailLength: 10
            }
        };
        return settings[this.optimizationLevel];
    }
    
    render(ctx) {
        ctx.save();
        ctx.font = '12px monospace';
        ctx.fillStyle = this.fps < 30 ? '#ff4444' : this.fps < 50 ? '#ffaa00' : '#00ff88';
        ctx.textAlign = 'left';
        ctx.fillText(`FPS: ${this.fps}`, 10, 20);
        ctx.fillStyle = '#888';
        ctx.fillText(`Quality: ${this.optimizationLevel}`, 10, 35);
        if (this.memoryUsage > 0) {
            ctx.fillText(`Memory: ${this.memoryUsage}MB`, 10, 50);
        }
        ctx.restore();
    }
}

// Save/Load System
export class SaveSystem {
    constructor(game) {
        this.game = game;
        this.autoSaveInterval = 30000; // 30 seconds
        this.autoSaveTimer = null;
        this.cloudSaveEnabled = false;
        this.cloudProvider = null;
    }
    
    // Create a save state
    createSaveState() {
        return {
            version: '1.0.0',
            timestamp: Date.now(),
            
            // Game State
            gameState: {
                snake: [...this.game.snake],
                direction: this.game.direction,
                score: this.game.score,
                level: this.game.currentLevel,
                gameMode: this.game.gameMode,
                food: { ...this.game.food },
                obstacles: [...this.game.obstacles],
                activePowerUps: { ...this.game.activePowerUps },
                combo: this.game.combo,
                ultimateCharge: this.game.ultimateCharge
            },
            
            // Progression
            progression: {
                xp: this.game.progression?.xp || 0,
                level: this.game.progression?.level || 1,
                unlockedSkills: this.game.progression?.unlockedSkills || [],
                currency: this.game.shop?.currency || 0
            },
            
            // Story Mode
            storyMode: {
                currentWorld: this.game.storyMode?.currentWorld || 0,
                currentLevel: this.game.storyMode?.currentLevel || 0,
                unlockedWorlds: this.game.storyMode?.unlockedWorlds || [true, false, false, false, false]
            },
            
            // Settings
            settings: this.game.ui?.settings || {},
            
            // Achievements
            achievements: {
                unlocked: this.game.achievements?.unlockedAchievements || [],
                xp: this.game.achievements?.xp || 0,
                level: this.game.achievements?.level || 1,
                prestigeLevel: this.game.achievements?.prestigeLevel || 0
            }
        };
    }
    
    // Save to local storage
    saveLocal(slotName = 'autosave') {
        const saveState = this.createSaveState();
        localStorage.setItem(`snake_save_${slotName}`, JSON.stringify(saveState));
        console.log(`Game saved to slot: ${slotName}`);
        return true;
    }
    
    // Load from local storage
    loadLocal(slotName = 'autosave') {
        const saved = localStorage.getItem(`snake_save_${slotName}`);
        if (!saved) {
            console.log('No save found');
            return false;
        }
        
        try {
            const saveState = JSON.parse(saved);
            this.applySaveState(saveState);
            console.log(`Game loaded from slot: ${slotName}`);
            return true;
        } catch (e) {
            console.error('Failed to load save:', e);
            return false;
        }
    }
    
    // Apply save state to game
    applySaveState(saveState) {
        const gs = saveState.gameState;
        
        // Restore game state
        this.game.snake = gs.snake;
        this.game.direction = gs.direction;
        this.game.score = gs.score;
        this.game.currentLevel = gs.level;
        this.game.gameMode = gs.gameMode;
        this.game.food = gs.food;
        this.game.obstacles = gs.obstacles;
        this.game.activePowerUps = gs.activePowerUps;
        this.game.combo = gs.combo;
        this.game.ultimateCharge = gs.ultimateCharge;
        
        // Restore progression
        if (this.game.progression && saveState.progression) {
            this.game.progression.xp = saveState.progression.xp;
            this.game.progression.level = saveState.progression.level;
            this.game.progression.unlockedSkills = saveState.progression.unlockedSkills;
        }
        
        if (this.game.shop && saveState.progression) {
            this.game.shop.currency = saveState.progression.currency;
        }
        
        // Restore story mode
        if (this.game.storyMode && saveState.storyMode) {
            this.game.storyMode.currentWorld = saveState.storyMode.currentWorld;
            this.game.storyMode.currentLevel = saveState.storyMode.currentLevel;
            this.game.storyMode.unlockedWorlds = saveState.storyMode.unlockedWorlds;
        }
        
        // Restore settings
        if (this.game.ui && saveState.settings) {
            this.game.ui.settings = { ...this.game.ui.settings, ...saveState.settings };
            this.game.ui.applySettings();
        }
        
        // Update UI
        this.game.updateUI();
    }
    
    // Get list of save slots
    getSaveSlots() {
        const slots = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('snake_save_')) {
                const slotName = key.replace('snake_save_', '');
                const saved = JSON.parse(localStorage.getItem(key));
                slots.push({
                    name: slotName,
                    timestamp: saved.timestamp,
                    score: saved.gameState?.score || 0,
                    level: saved.gameState?.level || 1
                });
            }
        }
        return slots.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    // Delete a save slot
    deleteSave(slotName) {
        localStorage.removeItem(`snake_save_${slotName}`);
    }
    
    // Start auto-save
    startAutoSave() {
        this.stopAutoSave();
        this.autoSaveTimer = setInterval(() => {
            this.saveLocal('autosave');
        }, this.autoSaveInterval);
    }
    
    // Stop auto-save
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }
    
    // Cloud save (placeholder for future implementation)
    async saveToCloud() {
        if (!this.cloudSaveEnabled) {
            console.log('Cloud save not enabled');
            return false;
        }
        
        const saveState = this.createSaveState();
        
        // This would connect to a backend service
        try {
            // Simulated cloud save
            console.log('Saving to cloud...');
            localStorage.setItem('snake_cloud_backup', JSON.stringify(saveState));
            console.log('Cloud save complete');
            return true;
        } catch (e) {
            console.error('Cloud save failed:', e);
            return false;
        }
    }
    
    async loadFromCloud() {
        if (!this.cloudSaveEnabled) {
            console.log('Cloud save not enabled');
            return false;
        }
        
        try {
            // Simulated cloud load
            const saved = localStorage.getItem('snake_cloud_backup');
            if (saved) {
                this.applySaveState(JSON.parse(saved));
                return true;
            }
            return false;
        } catch (e) {
            console.error('Cloud load failed:', e);
            return false;
        }
    }
    
    // Open save/load UI
    openSaveLoadUI() {
        if (document.getElementById('save-load-panel')) return;
        
        this.game.togglePause(true);
        
        const panel = document.createElement('div');
        panel.id = 'save-load-panel';
        panel.className = 'glass-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            padding: 30px;
            z-index: 4000;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
        `;
        
        this.renderSaveLoadUI(panel);
        document.body.appendChild(panel);
    }
    
    renderSaveLoadUI(panel) {
        const slots = this.getSaveSlots();
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #00ff88;">💾 Save / Load</h2>
                <button id="close-saveload" class="neu-button" style="padding: 8px 16px;">✕</button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <button id="quick-save" class="neu-button neu-button-primary" style="width: 48%; margin-right: 4%;">
                    Quick Save
                </button>
                <button id="quick-load" class="neu-button" style="width: 48%;">
                    Quick Load
                </button>
            </div>
            
            <h3 style="color: #888; margin-bottom: 10px;">Save Slots</h3>
            <div id="save-slots" style="margin-bottom: 20px;">
                ${slots.length === 0 ? '<p style="color: #666;">No saves found</p>' : ''}
                ${slots.map(slot => `
                    <div class="save-slot" data-slot="${slot.name}" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px;
                        margin-bottom: 10px;
                        background: rgba(255,255,255,0.05);
                        border-radius: 8px;
                    ">
                        <div>
                            <div style="font-weight: bold;">${slot.name}</div>
                            <div style="font-size: 0.8em; color: #888;">
                                Score: ${slot.score} | Level: ${slot.level}
                            </div>
                            <div style="font-size: 0.7em; color: #666;">
                                ${new Date(slot.timestamp).toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <button class="load-slot neu-button" data-slot="${slot.name}" style="padding: 5px 15px; margin-right: 5px;">Load</button>
                            <button class="delete-slot neu-button" data-slot="${slot.name}" style="padding: 5px 15px; background: #ff4444;">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="display: flex; gap: 10px;">
                <input type="text" id="new-slot-name" placeholder="New save name..." style="
                    flex: 1;
                    padding: 10px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid #333;
                    border-radius: 5px;
                    color: #fff;
                ">
                <button id="save-new" class="neu-button neu-button-primary" style="padding: 10px 20px;">Save</button>
            </div>
        `;
        
        // Event listeners
        document.getElementById('close-saveload').onclick = () => {
            panel.remove();
            this.game.togglePause(false);
        };
        
        document.getElementById('quick-save').onclick = () => {
            this.saveLocal('quicksave');
            alert('Quick save complete!');
            this.renderSaveLoadUI(panel);
        };
        
        document.getElementById('quick-load').onclick = () => {
            if (this.loadLocal('quicksave')) {
                panel.remove();
                this.game.togglePause(false);
            } else {
                alert('No quick save found!');
            }
        };
        
        document.getElementById('save-new').onclick = () => {
            const name = document.getElementById('new-slot-name').value.trim();
            if (name) {
                this.saveLocal(name);
                this.renderSaveLoadUI(panel);
            }
        };
        
        document.querySelectorAll('.load-slot').forEach(btn => {
            btn.onclick = () => {
                if (this.loadLocal(btn.dataset.slot)) {
                    panel.remove();
                    this.game.togglePause(false);
                }
            };
        });
        
        document.querySelectorAll('.delete-slot').forEach(btn => {
            btn.onclick = () => {
                if (confirm('Delete this save?')) {
                    this.deleteSave(btn.dataset.slot);
                    this.renderSaveLoadUI(panel);
                }
            };
        });
    }
}

// Replay System
export class ReplaySystem {
    constructor(game) {
        this.game = game;
        this.isRecording = false;
        this.isPlaying = false;
        
        this.currentReplay = null;
        this.playbackFrame = 0;
        this.playbackSpeed = 1;
    }
    
    startRecording() {
        this.isRecording = true;
        this.currentReplay = {
            version: '1.0.0',
            startTime: Date.now(),
            seed: Math.random(),
            gameMode: this.game.gameMode,
            initialState: {
                snake: JSON.parse(JSON.stringify(this.game.snake)),
                direction: this.game.direction,
                food: { ...this.game.food },
                obstacles: [...this.game.obstacles]
            },
            frames: []
        };
        console.log('Replay recording started');
    }
    
    recordFrame(input) {
        if (!this.isRecording || !this.currentReplay) return;
        
        this.currentReplay.frames.push({
            time: Date.now() - this.currentReplay.startTime,
            input: input,
            state: {
                snake: JSON.parse(JSON.stringify(this.game.snake)),
                score: this.game.score,
                combo: this.game.combo
            }
        });
    }
    
    stopRecording() {
        if (!this.isRecording) return null;
        
        this.isRecording = false;
        this.currentReplay.endTime = Date.now();
        this.currentReplay.duration = this.currentReplay.endTime - this.currentReplay.startTime;
        this.currentReplay.finalScore = this.game.score;
        
        console.log('Replay recording stopped, duration:', this.currentReplay.duration);
        
        return this.currentReplay;
    }
    
    saveReplay(name) {
        if (!this.currentReplay) return false;
        
        const replays = this.getSavedReplays();
        replays.push({
            name,
            timestamp: Date.now(),
            duration: this.currentReplay.duration,
            score: this.currentReplay.finalScore,
            data: this.currentReplay
        });
        
        // Keep only last 10 replays
        while (replays.length > 10) {
            replays.shift();
        }
        
        localStorage.setItem('snake_replays', JSON.stringify(replays));
        return true;
    }
    
    getSavedReplays() {
        const saved = localStorage.getItem('snake_replays');
        return saved ? JSON.parse(saved) : [];
    }
    
    loadReplay(index) {
        const replays = this.getSavedReplays();
        if (index >= 0 && index < replays.length) {
            this.currentReplay = replays[index].data;
            return true;
        }
        return false;
    }
    
    startPlayback() {
        if (!this.currentReplay) return false;
        
        this.isPlaying = true;
        this.playbackFrame = 0;
        
        // Restore initial state
        const initial = this.currentReplay.initialState;
        this.game.snake = JSON.parse(JSON.stringify(initial.snake));
        this.game.direction = initial.direction;
        this.game.food = { ...initial.food };
        this.game.obstacles = [...initial.obstacles];
        this.game.score = 0;
        
        console.log('Replay playback started');
        return true;
    }
    
    updatePlayback(dt) {
        if (!this.isPlaying || !this.currentReplay) return;
        
        const elapsedTime = this.playbackFrame * (1000 / 60) * this.playbackSpeed;
        
        // Find frames to apply
        while (this.playbackFrame < this.currentReplay.frames.length) {
            const frame = this.currentReplay.frames[this.playbackFrame];
            if (frame.time <= elapsedTime) {
                // Apply frame state
                this.game.snake = JSON.parse(JSON.stringify(frame.state.snake));
                this.game.score = frame.state.score;
                this.game.combo = frame.state.combo;
                this.playbackFrame++;
            } else {
                break;
            }
        }
        
        // Check if playback complete
        if (this.playbackFrame >= this.currentReplay.frames.length) {
            this.stopPlayback();
        }
    }
    
    stopPlayback() {
        this.isPlaying = false;
        console.log('Replay playback stopped');
    }
    
    getPlaybackProgress() {
        if (!this.currentReplay || this.currentReplay.frames.length === 0) return 0;
        return this.playbackFrame / this.currentReplay.frames.length;
    }
}

// Screenshot Mode
export class ScreenshotMode {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.hideUI = false;
        this.filters = ['none', 'vintage', 'noir', 'vibrant', 'cool', 'warm'];
        this.currentFilter = 'none';
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
    }
    
    activate() {
        this.isActive = true;
        this.game.togglePause(true);
        this.showControls();
    }
    
    deactivate() {
        this.isActive = false;
        this.hideControls();
        this.game.togglePause(false);
    }
    
    showControls() {
        if (document.getElementById('screenshot-controls')) return;
        
        const controls = document.createElement('div');
        controls.id = 'screenshot-controls';
        controls.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            border-radius: 15px;
            padding: 15px 25px;
            display: flex;
            gap: 15px;
            align-items: center;
            z-index: 5000;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
        `;
        
        controls.innerHTML = `
            <button id="ss-capture" class="neu-button neu-button-primary">📷 Capture</button>
            <button id="ss-toggle-ui" class="neu-button">🖼️ Toggle UI</button>
            <select id="ss-filter" class="neu-button" style="padding: 8px;">
                ${this.filters.map(f => `<option value="${f}" ${f === this.currentFilter ? 'selected' : ''}>${f}</option>`).join('')}
            </select>
            <div>
                <label>Zoom: </label>
                <input type="range" id="ss-zoom" min="0.5" max="2" step="0.1" value="${this.zoom}">
            </div>
            <button id="ss-exit" class="neu-button">✕ Exit</button>
        `;
        
        document.body.appendChild(controls);
        
        document.getElementById('ss-capture').onclick = () => this.capture();
        document.getElementById('ss-toggle-ui').onclick = () => {
            this.hideUI = !this.hideUI;
            this.game.render();
        };
        document.getElementById('ss-filter').onchange = (e) => {
            this.currentFilter = e.target.value;
            this.applyFilter();
        };
        document.getElementById('ss-zoom').oninput = (e) => {
            this.zoom = parseFloat(e.target.value);
            this.game.render();
        };
        document.getElementById('ss-exit').onclick = () => this.deactivate();
    }
    
    hideControls() {
        const controls = document.getElementById('screenshot-controls');
        if (controls) controls.remove();
    }
    
    applyFilter() {
        const canvas = this.game.canvas;
        const filters = {
            none: 'none',
            vintage: 'sepia(0.3) contrast(1.1)',
            noir: 'grayscale(1) contrast(1.2)',
            vibrant: 'saturate(1.5) contrast(1.1)',
            cool: 'hue-rotate(30deg) saturate(0.8)',
            warm: 'hue-rotate(-30deg) saturate(1.2)'
        };
        canvas.style.filter = filters[this.currentFilter] || 'none';
    }
    
    capture() {
        const canvas = this.game.canvas;
        
        // Create a temporary canvas for the screenshot
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Apply zoom
        tempCtx.scale(this.zoom, this.zoom);
        tempCtx.drawImage(canvas, 0, 0);
        
        // Convert to data URL and download
        const dataURL = tempCanvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.download = `snake_screenshot_${Date.now()}.png`;
        link.href = dataURL;
        link.click();
        
        // Flash effect
        this.game.camera?.doFlash([1, 1, 1], 0.2);
        this.game.audio?.playSFX('achievement');
    }
}

// Object Pooling for performance
export class ObjectPool {
    constructor(createFn, resetFn, initialSize = 100) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.activeCount = 0;
        
        // Pre-allocate objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }
    
    acquire() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        this.activeCount++;
        return obj;
    }
    
    release(obj) {
        if (this.resetFn) {
            this.resetFn(obj);
        }
        this.pool.push(obj);
        this.activeCount--;
    }
    
    releaseAll(objects) {
        for (const obj of objects) {
            this.release(obj);
        }
    }
    
    getStats() {
        return {
            poolSize: this.pool.length,
            activeCount: this.activeCount,
            totalCreated: this.pool.length + this.activeCount
        };
    }
}

// Main Polish System Class  
export class PolishSystem {
    constructor(game) {
        this.game = game;
        
        this.performance = new PerformanceMonitor();
        this.saveSystem = new SaveSystem(game);
        this.replaySystem = new ReplaySystem(game);
        this.screenshotMode = new ScreenshotMode(game);
        
        // Object pools for particles
        this.particlePool = new ObjectPool(
            () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, color: [1,1,1], size: 1 }),
            (p) => { p.life = 0; }
        );
        
        // Start auto-save if in game
        this.saveSystem.startAutoSave();
    }
    
    update(dt) {
        this.performance.startFrame();
        
        // Update replay if playing
        if (this.replaySystem.isPlaying) {
            this.replaySystem.updatePlayback(dt);
        }
        
        this.performance.endFrame();
    }
    
    render(ctx) {
        // Render FPS if enabled
        if (this.game.ui?.settings?.showFPS) {
            this.performance.render(ctx);
        }
    }
    
    startRecording() {
        this.replaySystem.startRecording();
    }
    
    stopRecording() {
        return this.replaySystem.stopRecording();
    }
    
    openScreenshotMode() {
        this.screenshotMode.activate();
    }
    
    openSaveLoad() {
        this.saveSystem.openSaveLoadUI();
    }
    
    getOptimizationSettings() {
        return this.performance.getOptimizationSettings();
    }
    
    cleanup() {
        this.saveSystem.stopAutoSave();
        this.replaySystem.stopPlayback();
    }
}
