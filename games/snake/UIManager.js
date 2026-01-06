/**
 * Snake Game - UI/UX Enhancement System
 * Glassmorphism design, settings, skins, stats, tutorial, and accessibility
 */

// Snake Skin Definitions
export const SNAKE_SKINS = {
    default: {
        id: 'default',
        name: 'Classic',
        icon: '🐍',
        colors: { head: '#00ff88', body: '#00cc66', trail: 'rgba(0,255,136,0.3)' },
        unlocked: true,
        cost: 0
    },
    neon: {
        id: 'neon',
        name: 'Neon Glow',
        icon: '💡',
        colors: { head: '#ff00ff', body: '#cc00cc', trail: 'rgba(255,0,255,0.3)' },
        unlocked: false,
        cost: 500,
        glow: true
    },
    fire: {
        id: 'fire',
        name: 'Inferno',
        icon: '🔥',
        colors: { head: '#ff4400', body: '#ff6600', trail: 'rgba(255,100,0,0.4)' },
        unlocked: false,
        cost: 750,
        particles: 'fire'
    },
    ice: {
        id: 'ice',
        name: 'Frozen',
        icon: '❄️',
        colors: { head: '#88ffff', body: '#44aaff', trail: 'rgba(100,200,255,0.3)' },
        unlocked: false,
        cost: 750,
        particles: 'ice'
    },
    gold: {
        id: 'gold',
        name: 'Golden',
        icon: '👑',
        colors: { head: '#ffd700', body: '#ffaa00', trail: 'rgba(255,215,0,0.4)' },
        unlocked: false,
        cost: 1500,
        glow: true
    },
    rainbow: {
        id: 'rainbow',
        name: 'Rainbow',
        icon: '🌈',
        colors: { head: 'rainbow', body: 'rainbow', trail: 'rgba(255,255,255,0.3)' },
        unlocked: false,
        cost: 2500,
        animated: true
    },
    shadow: {
        id: 'shadow',
        name: 'Shadow',
        icon: '🌑',
        colors: { head: '#333333', body: '#111111', trail: 'rgba(0,0,0,0.5)' },
        unlocked: false,
        cost: 1000,
        effect: 'shadow'
    },
    phoenix: {
        id: 'phoenix',
        name: 'Phoenix',
        icon: '🔶',
        colors: { head: '#ff8800', body: '#ff4400', trail: 'rgba(255,100,0,0.5)' },
        unlocked: false,
        cost: 3000,
        particles: 'fire',
        glow: true,
        secret: true
    },
    pixel: {
        id: 'pixel',
        name: 'Retro Pixel',
        icon: '👾',
        colors: { head: '#00ff00', body: '#00aa00', trail: 'none' },
        unlocked: false,
        cost: 800,
        style: 'pixel'
    },
    galaxy: {
        id: 'galaxy',
        name: 'Galaxy',
        icon: '🌌',
        colors: { head: '#8800ff', body: '#4400aa', trail: 'rgba(100,0,200,0.4)' },
        unlocked: false,
        cost: 2000,
        particles: 'stars',
        glow: true
    }
};

// Settings Configuration
export const DEFAULT_SETTINGS = {
    // Audio
    masterVolume: 0.8,
    musicVolume: 0.6,
    sfxVolume: 0.8,
    musicEnabled: true,
    sfxEnabled: true,
    
    // Graphics
    graphicsQuality: 'high', // low, medium, high
    particlesEnabled: true,
    screenShakeEnabled: true,
    postProcessingEnabled: true,
    showFPS: false,
    vsync: true,
    
    // Gameplay
    gridLines: true,
    showTrail: true,
    cameraSmoothing: true,
    controlScheme: 'arrows', // arrows, wasd, both
    touchSensitivity: 0.5,
    
    // Accessibility
    highContrast: false,
    largeText: false,
    colorBlindMode: 'none', // none, protanopia, deuteranopia, tritanopia
    reducedMotion: false,
    screenReader: false,
    
    // Mobile
    hapticFeedback: true,
    hapticIntensity: 0.7,
    touchControls: 'swipe', // swipe, buttons, joystick
    
    // UI
    uiScale: 1.0,
    theme: 'dark', // dark, light, neon
    language: 'en'
};

export class UIManager {
    constructor(game) {
        this.game = game;
        this.settings = this.loadSettings();
        this.currentSkin = this.loadCurrentSkin();
        this.unlockedSkins = this.loadUnlockedSkins();
        this.stats = this.loadStats();
        
        this.tutorialStep = 0;
        this.tutorialActive = false;
        
        this.injectStyles();
        
        // Initialize Map Grid if container exists
        if (document.getElementById('map-grid')) {
            // Defer slightly to ensure game instance has levels ready
            setTimeout(() => this.renderMapGrid(), 100);
        }
    }

    renderMapGrid() {
        const grid = document.getElementById('map-grid');
        const select = document.getElementById('map-select');
        if (!grid || !select) return;

        grid.innerHTML = '';
        const levels = this.game.levels || [];

        levels.forEach(level => {
            const card = document.createElement('div');
            card.className = 'map-card';
            if (select.value == level.id) card.classList.add('selected');

            // Determine icon based on world/name
            let icon = '🗺️';
            if (level.name.includes('Garden')) icon = '🌿';
            else if (level.name.includes('Stone')) icon = '🪨';
            else if (level.name.includes('Maze')) icon = '🧱';
            else if (level.name.includes('Desert')) icon = '🏜️';
            else if (level.name.includes('Frozen')) icon = '❄️';
            else if (level.name.includes('Lava')) icon = '🌋';
            else if (level.name.includes('Neon')) icon = '💜';
            else if (level.name.includes('Space')) icon = '🚀';
            else if (level.name.includes('Jungle')) icon = '🌴';
            else if (level.name.includes('Crystal')) icon = '💎';
            else if (level.name.includes('Cyber')) icon = '🔵';
            else if (level.name.includes('Volcano')) icon = '🔥';
            else if (level.name.includes('Ocean')) icon = '🌊';
            else if (level.name.includes('Shadow')) icon = '⬛';
            else if (level.name.includes('Rainbow')) icon = '🌈';

            card.innerHTML = `
                <div class="map-icon-large">${icon}</div>
                <div class="map-name">${level.id}. ${level.name}</div>
            `;

            card.onclick = () => {
                // Update select
                select.value = level.id;
                // Trigger change event if needed, but we mostly just read value on start
                
                // Update visuals
                document.querySelectorAll('.map-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                // Play sound?
                this.game.audio?.playSound('ui_click');
            };

            grid.appendChild(card);
        });
    }
    
    loadSettings() {
        const saved = localStorage.getItem('snake_settings');
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
    }
    
    saveSettings() {
        localStorage.setItem('snake_settings', JSON.stringify(this.settings));
        this.applySettings();
    }
    
    loadCurrentSkin() {
        return localStorage.getItem('snake_current_skin') || 'default';
    }
    
    saveCurrentSkin(skinId) {
        this.currentSkin = skinId;
        localStorage.setItem('snake_current_skin', skinId);
    }
    
    loadUnlockedSkins() {
        const saved = localStorage.getItem('snake_unlocked_skins');
        return saved ? JSON.parse(saved) : ['default'];
    }
    
    saveUnlockedSkins() {
        localStorage.setItem('snake_unlocked_skins', JSON.stringify(this.unlockedSkins));
    }
    
    loadStats() {
        const saved = localStorage.getItem('snake_stats');
        return saved ? JSON.parse(saved) : {
            gamesPlayed: 0,
            totalScore: 0,
            highScore: 0,
            totalFoodEaten: 0,
            totalPowerUps: 0,
            totalPlayTime: 0,
            longestSnake: 3,
            maxCombo: 0,
            bossesDefeated: 0,
            levelsCompleted: 0,
            deathsByWall: 0,
            deathsByObstacle: 0,
            deathsBySelf: 0,
            achievementsUnlocked: 0
        };
    }
    
    saveStats() {
        localStorage.setItem('snake_stats', JSON.stringify(this.stats));
    }
    
    updateStats(updates) {
        for (const [key, value] of Object.entries(updates)) {
            if (typeof value === 'number') {
                if (key.startsWith('max') || key === 'highScore' || key === 'longestSnake') {
                    this.stats[key] = Math.max(this.stats[key] || 0, value);
                } else {
                    this.stats[key] = (this.stats[key] || 0) + value;
                }
            }
        }
        this.saveStats();
    }
    
    injectStyles() {
        if (document.getElementById('snake-ui-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'snake-ui-styles';
        style.textContent = `
            /* Glassmorphism Base */
            /* Arcade Panel */
            .arcade-panel, .glass-panel {
                background: #000;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: none;
                padding: 20px;
                color: #fff;
                font-family: 'VT323', monospace;
            }
            
            .glass-panel-light {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            /* Neumorphism Buttons */
            .neu-button {
                background: linear-gradient(145deg, #1a1a2e, #16162a);
                box-shadow: 5px 5px 10px #0d0d15, -5px -5px 10px #232345;
                border: none;
                border-radius: 10px;
                padding: 12px 24px;
                color: #fff;
                font-family: 'Orbitron', sans-serif;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .neu-button:hover {
                box-shadow: 3px 3px 6px #0d0d15, -3px -3px 6px #232345;
                transform: translateY(-2px);
            }
            
            .neu-button:active {
                box-shadow: inset 3px 3px 6px #0d0d15, inset -3px -3px 6px #232345;
                transform: translateY(0);
            }
            
            .neu-button-primary {
                background: linear-gradient(145deg, #00ff88, #00cc66);
                box-shadow: 5px 5px 10px rgba(0,0,0,0.3), -5px -5px 10px rgba(0,255,136,0.1);
                color: #000;
            }
            
            /* Animated Background */
            .animated-bg {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: -1;
                background: linear-gradient(135deg, #0a0f0a 0%, #1a1a2e 50%, #0f0f1a 100%);
                overflow: hidden;
            }
            
            .animated-bg::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(0,255,136,0.03) 0%, transparent 50%);
                animation: bgRotate 30s linear infinite;
            }
            
            @keyframes bgRotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            /* Floating particles */
            .bg-particle {
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(0,255,136,0.3);
                border-radius: 50%;
                animation: floatUp 10s linear infinite;
            }
            
            @keyframes floatUp {
                0% { transform: translateY(100vh) scale(0); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-100vh) scale(1); opacity: 0; }
            }
            
            /* Settings Panel Styles */
            .settings-section {
                margin-bottom: 25px;
            }
            
            .settings-section h3 {
                color: #00ff88;
                margin-bottom: 15px;
                font-size: 1.1em;
                border-bottom: 1px solid rgba(0,255,136,0.3);
                padding-bottom: 8px;
            }
            
            .setting-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding: 8px 0;
            }
            
            .setting-label {
                color: #ccc;
                font-size: 0.9em;
            }
            
            /* Custom Range Slider */
            input[type="range"] {
                -webkit-appearance: none;
                width: 150px;
                height: 6px;
                background: rgba(255,255,255,0.1);
                border-radius: 3px;
                outline: none;
            }
            
            input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 18px;
                height: 18px;
                background: linear-gradient(135deg, #00ff88, #00cc66);
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 0 10px rgba(0,255,136,0.5);
            }
            
            /* Custom Toggle Switch */
            .toggle-switch {
                position: relative;
                width: 50px;
                height: 26px;
            }
            
            .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255,255,255,0.1);
                border-radius: 26px;
                transition: 0.3s;
            }
            
            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 20px;
                width: 20px;
                left: 3px;
                bottom: 3px;
                background: #fff;
                border-radius: 50%;
                transition: 0.3s;
            }
            
            input:checked + .toggle-slider {
                background: linear-gradient(135deg, #00ff88, #00cc66);
            }
            
            input:checked + .toggle-slider:before {
                transform: translateX(24px);
            }
            
            /* Stats Dashboard */
            .stat-card {
                background: rgba(0,255,136,0.1);
                border: 1px solid rgba(0,255,136,0.2);
                border-radius: 10px;
                padding: 15px;
                text-align: center;
                margin: 5px;
            }
            
            .stat-value {
                font-size: 2em;
                font-weight: bold;
                color: #00ff88;
            }
            
            .stat-label {
                font-size: 0.8em;
                color: #888;
                margin-top: 5px;
            }
            
            /* Skin Card */
            .skin-card {
                background: rgba(255,255,255,0.05);
                border: 2px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 15px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .skin-card:hover {
                border-color: rgba(0,255,136,0.5);
                transform: translateY(-3px);
            }
            
            .skin-card.selected {
                border-color: #00ff88;
                box-shadow: 0 0 20px rgba(0,255,136,0.3);
            }
            
            .skin-card.locked {
                opacity: 0.5;
            }
            
            .skin-icon {
                font-size: 2.5em;
                margin-bottom: 10px;
            }
            
            /* Tutorial Overlay */
            .tutorial-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 5000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .tutorial-box {
                background: rgba(20,20,40,0.95);
                border: 2px solid #00ff88;
                border-radius: 20px;
                padding: 30px 40px;
                max-width: 500px;
                text-align: center;
            }
            
            .tutorial-highlight {
                position: absolute;
                border: 3px solid #00ff88;
                border-radius: 10px;
                box-shadow: 0 0 30px rgba(0,255,136,0.5);
                animation: pulse 1.5s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { box-shadow: 0 0 20px rgba(0,255,136,0.5); }
                50% { box-shadow: 0 0 40px rgba(0,255,136,0.8); }
            }
            
            /* Accessibility - High Contrast */
            .high-contrast {
                --bg-color: #000;
                --text-color: #fff;
                --accent-color: #ffff00;
            }
            
            .high-contrast .glass-panel {
                background: #000;
                border: 2px solid #fff;
            }
            
            /* Accessibility - Large Text */
            .large-text {
                font-size: 120%;
            }
            
            .large-text .setting-label,
            .large-text .stat-label {
                font-size: 1.1em;
            }
            
            /* Reduced Motion */
            .reduced-motion * {
                animation: none !important;
                transition: none !important;
            }
            
            /* Color Blind Modes */
            .colorblind-protanopia { filter: url('#protanopia-filter'); }
            .colorblind-deuteranopia { filter: url('#deuteranopia-filter'); }
            .colorblind-tritanopia { filter: url('#tritanopia-filter'); }
        `;
        document.head.appendChild(style);
        
        // Add color blind SVG filters
        this.addColorBlindFilters();
    }
    
    addColorBlindFilters() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('style', 'position: absolute; width: 0; height: 0;');
        svg.innerHTML = `
            <defs>
                <filter id="protanopia-filter">
                    <feColorMatrix type="matrix" values="
                        0.567, 0.433, 0, 0, 0
                        0.558, 0.442, 0, 0, 0
                        0, 0.242, 0.758, 0, 0
                        0, 0, 0, 1, 0" />
                </filter>
                <filter id="deuteranopia-filter">
                    <feColorMatrix type="matrix" values="
                        0.625, 0.375, 0, 0, 0
                        0.7, 0.3, 0, 0, 0
                        0, 0.3, 0.7, 0, 0
                        0, 0, 0, 1, 0" />
                </filter>
                <filter id="tritanopia-filter">
                    <feColorMatrix type="matrix" values="
                        0.95, 0.05, 0, 0, 0
                        0, 0.433, 0.567, 0, 0
                        0, 0.475, 0.525, 0, 0
                        0, 0, 0, 1, 0" />
                </filter>
            </defs>
        `;
        document.body.appendChild(svg);
    }
    
    applySettings() {
        const body = document.body;
        
        // Accessibility
        body.classList.toggle('high-contrast', this.settings.highContrast);
        body.classList.toggle('large-text', this.settings.largeText);
        body.classList.toggle('reduced-motion', this.settings.reducedMotion);
        
        // Color blind mode
        body.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
        if (this.settings.colorBlindMode !== 'none') {
            body.classList.add(`colorblind-${this.settings.colorBlindMode}`);
        }
        
        // Apply to game
        if (this.game) {
            this.game.enableParticles = this.settings.particlesEnabled;
            this.game.enableScreenShake = this.settings.screenShakeEnabled;
            this.game.enablePostProcessing = this.settings.postProcessingEnabled;
        }
    }
    
    // Open Settings Panel
    openSettingsPanel() {
        if (document.getElementById('settings-panel')) return;
        
        this.game.togglePause(true);
        
        const panel = document.createElement('div');
        panel.id = 'settings-panel';
        panel.className = 'glass-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            padding: 30px;
            z-index: 4000;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
        `;
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #00ff88;">⚙️ Settings</h2>
                <button id="close-settings" class="neu-button" style="padding: 8px 16px;">✕</button>
            </div>
            
            <div class="settings-tabs" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="neu-button settings-tab active" data-tab="audio">🔊 Audio</button>
                <button class="neu-button settings-tab" data-tab="graphics">🎨 Graphics</button>
                <button class="neu-button settings-tab" data-tab="gameplay">🎮 Gameplay</button>
                <button class="neu-button settings-tab" data-tab="accessibility">♿ Access</button>
            </div>
            
            <div id="settings-content"></div>
            
            <div style="display: flex; gap: 10px; margin-top: 25px;">
                <button id="save-settings" class="neu-button neu-button-primary" style="flex: 1;">Save Settings</button>
                <button id="reset-settings" class="neu-button" style="flex: 1;">Reset to Default</button>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        this.renderSettingsTab('audio');
        this.setupSettingsListeners();
    }
    
    renderSettingsTab(tab) {
        const content = document.getElementById('settings-content');
        if (!content) return;
        
        const s = this.settings;
        
        const tabs = {
            audio: `
                <div class="settings-section">
                    <h3>Volume</h3>
                    <div class="setting-row">
                        <span class="setting-label">Master Volume</span>
                        <input type="range" id="set-masterVolume" min="0" max="1" step="0.1" value="${s.masterVolume}">
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">Music Volume</span>
                        <input type="range" id="set-musicVolume" min="0" max="1" step="0.1" value="${s.musicVolume}">
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">Sound Effects</span>
                        <input type="range" id="set-sfxVolume" min="0" max="1" step="0.1" value="${s.sfxVolume}">
                    </div>
                </div>
                <div class="settings-section">
                    <h3>Toggles</h3>
                    <div class="setting-row">
                        <span class="setting-label">Music Enabled</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="set-musicEnabled" ${s.musicEnabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">Sound Effects Enabled</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="set-sfxEnabled" ${s.sfxEnabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            `,
            graphics: `
                <div class="settings-section">
                    <h3>Quality</h3>
                    <div class="setting-row">
                        <span class="setting-label">Graphics Quality</span>
                        <select id="set-graphicsQuality" class="neu-button" style="padding: 8px;">
                            <option value="low" ${s.graphicsQuality === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${s.graphicsQuality === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="high" ${s.graphicsQuality === 'high' ? 'selected' : ''}>High</option>
                        </select>
                    </div>
                </div>
                <div class="settings-section">
                    <h3>Effects</h3>
                    <div class="setting-row">
                        <span class="setting-label">Particles</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="set-particlesEnabled" ${s.particlesEnabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">Screen Shake</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="set-screenShakeEnabled" ${s.screenShakeEnabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">Post-Processing</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="set-postProcessingEnabled" ${s.postProcessingEnabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">Show FPS</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="set-showFPS" ${s.showFPS ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            `,
            gameplay: `
                <div class="settings-section">
                    <h3>Display</h3>
                    <div class="setting-row">
                        <span class="setting-label">Grid Lines</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="set-gridLines" ${s.gridLines ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">Show Trail</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="set-showTrail" ${s.showTrail ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">Camera Smoothing</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="set-cameraSmoothing" ${s.cameraSmoothing ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                <div class="settings-section">
                    <h3>Controls</h3>
                    <div class="setting-row">
                        <span class="setting-label">Control Scheme</span>
                        <select id="set-controlScheme" class="neu-button" style="padding: 8px;">
                            <option value="arrows" ${s.controlScheme === 'arrows' ? 'selected' : ''}>Arrow Keys</option>
                            <option value="wasd" ${s.controlScheme === 'wasd' ? 'selected' : ''}>WASD</option>
                            <option value="both" ${s.controlScheme === 'both' ? 'selected' : ''}>Both</option>
                        </select>
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">Touch Sensitivity</span>
                        <input type="range" id="set-touchSensitivity" min="0.1" max="1" step="0.1" value="${s.touchSensitivity}">
                    </div>
                </div>
            `,
            accessibility: `
                <div class="settings-section">
                    <h3>Vision</h3>
                    <div class="setting-row">
                        <span class="setting-label">High Contrast</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="set-highContrast" ${s.highContrast ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">Large Text</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="set-largeText" ${s.largeText ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">Color Blind Mode</span>
                        <select id="set-colorBlindMode" class="neu-button" style="padding: 8px;">
                            <option value="none" ${s.colorBlindMode === 'none' ? 'selected' : ''}>None</option>
                            <option value="protanopia" ${s.colorBlindMode === 'protanopia' ? 'selected' : ''}>Protanopia</option>
                            <option value="deuteranopia" ${s.colorBlindMode === 'deuteranopia' ? 'selected' : ''}>Deuteranopia</option>
                            <option value="tritanopia" ${s.colorBlindMode === 'tritanopia' ? 'selected' : ''}>Tritanopia</option>
                        </select>
                    </div>
                </div>
                <div class="settings-section">
                    <h3>Motion</h3>
                    <div class="setting-row">
                        <span class="setting-label">Reduced Motion</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="set-reducedMotion" ${s.reducedMotion ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                <div class="settings-section">
                    <h3>Mobile</h3>
                    <div class="setting-row">
                        <span class="setting-label">Haptic Feedback</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="set-hapticFeedback" ${s.hapticFeedback ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">Haptic Intensity</span>
                        <input type="range" id="set-hapticIntensity" min="0.1" max="1" step="0.1" value="${s.hapticIntensity}">
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">Touch Controls</span>
                        <select id="set-touchControls" class="neu-button" style="padding: 8px;">
                            <option value="swipe" ${s.touchControls === 'swipe' ? 'selected' : ''}>Swipe</option>
                            <option value="buttons" ${s.touchControls === 'buttons' ? 'selected' : ''}>Buttons</option>
                            <option value="joystick" ${s.touchControls === 'joystick' ? 'selected' : ''}>Joystick</option>
                        </select>
                    </div>
                </div>
            `
        };
        
        content.innerHTML = tabs[tab] || '';
        
        // Update tab buttons
        document.querySelectorAll('.settings-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
            btn.classList.toggle('neu-button-primary', btn.dataset.tab === tab);
        });
    }
    
    setupSettingsListeners() {
        // Tab switching
        document.querySelectorAll('.settings-tab').forEach(btn => {
            btn.onclick = () => this.renderSettingsTab(btn.dataset.tab);
        });
        
        // Close button
        document.getElementById('close-settings').onclick = () => this.closeSettingsPanel();
        
        // Save button
        document.getElementById('save-settings').onclick = () => {
            this.gatherSettings();
            this.saveSettings();
            this.closeSettingsPanel();
        };
        
        // Reset button
        document.getElementById('reset-settings').onclick = () => {
            if (confirm('Reset all settings to default?')) {
                this.settings = { ...DEFAULT_SETTINGS };
                this.saveSettings();
                this.renderSettingsTab('audio');
            }
        };
    }
    
    gatherSettings() {
        const getVal = (id) => {
            const el = document.getElementById(id);
            if (!el) return null;
            if (el.type === 'checkbox') return el.checked;
            if (el.type === 'range') return parseFloat(el.value);
            return el.value;
        };
        
        const settingKeys = Object.keys(DEFAULT_SETTINGS);
        for (const key of settingKeys) {
            const val = getVal(`set-${key}`);
            if (val !== null) {
                this.settings[key] = val;
            }
        }
    }
    
    closeSettingsPanel() {
        const panel = document.getElementById('settings-panel');
        if (panel) panel.remove();
        this.game.togglePause(false);
    }
    
    // Open Skins Panel
    openSkinsPanel() {
        if (document.getElementById('skins-panel')) return;
        
        this.game.togglePause(true);
        
        const panel = document.createElement('div');
        panel.id = 'skins-panel';
        panel.className = 'arcade-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 700px;
            max-height: 80vh;
            overflow-y: auto;
            padding: 30px;
            z-index: 4000;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
        `;
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #00ff88;">🎨 Snake Skins</h2>
                <div>
                    <span id="skin-currency" style="margin-right: 20px;">💰 ${this.game.shop?.currency || 0}</span>
                    <button id="close-skins" class="neu-button" style="padding: 8px 16px;">✕</button>
                </div>
            </div>
            <div id="skins-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;"></div>
        `;
        
        document.body.appendChild(panel);
        this.renderSkinsGrid();
        
        document.getElementById('close-skins').onclick = () => this.closeSkinsPanel();
    }
    
    renderSkinsGrid() {
        const grid = document.getElementById('skins-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (const [id, skin] of Object.entries(SNAKE_SKINS)) {
            const isUnlocked = this.unlockedSkins.includes(id);
            const isSelected = this.currentSkin === id;
            const canAfford = (this.game.shop?.currency || 0) >= skin.cost;
            
            const card = document.createElement('div');
            card.className = `skin-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
            card.innerHTML = `
                <div class="skin-icon">${skin.icon}</div>
                <div style="font-weight: bold; margin-bottom: 5px;">${skin.name}</div>
                ${!isUnlocked ? `<div style="color: ${canAfford ? '#00ff88' : '#ff4444'};">💰 ${skin.cost}</div>` : ''}
                ${isSelected ? '<div style="color: #00ff88;">✓ Equipped</div>' : ''}
            `;
            
            card.onclick = () => {
                if (isUnlocked) {
                    this.equipSkin(id);
                } else if (canAfford) {
                    this.purchaseSkin(id, skin.cost);
                }
            };
            
            grid.appendChild(card);
        }
    }
    
    purchaseSkin(skinId, cost) {
        if (this.game.shop && this.game.shop.currency >= cost) {
            this.game.shop.currency -= cost;
            this.game.shop.updateCurrencyDisplay();
            this.unlockedSkins.push(skinId);
            this.saveUnlockedSkins();
            this.equipSkin(skinId);
            this.renderSkinsGrid();
            
            // Update currency display
            const currencyEl = document.getElementById('skin-currency');
            if (currencyEl) currencyEl.textContent = `💰 ${this.game.shop.currency}`;
        }
    }
    
    equipSkin(skinId) {
        this.saveCurrentSkin(skinId);
        this.renderSkinsGrid();
    }
    
    closeSkinsPanel() {
        const panel = document.getElementById('skins-panel');
        if (panel) panel.remove();
        this.game.togglePause(false);
    }
    
    // Open Stats Dashboard
    openStatsDashboard() {
        if (document.getElementById('stats-panel')) return;
        
        this.game.togglePause(true);
        
        const panel = document.createElement('div');
        panel.id = 'stats-panel';
        panel.className = 'arcade-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 700px;
            max-height: 80vh;
            overflow-y: auto;
            padding: 30px;
            z-index: 4000;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
        `;
        
        const s = this.stats;
        const formatTime = (seconds) => {
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
        };
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #00ff88;">📊 Statistics</h2>
                <button id="close-stats" class="neu-button" style="padding: 8px 16px;">✕</button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                <div class="stat-card">
                    <div class="stat-value">${s.gamesPlayed}</div>
                    <div class="stat-label">Games Played</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${s.highScore.toLocaleString()}</div>
                    <div class="stat-label">High Score</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${s.totalScore.toLocaleString()}</div>
                    <div class="stat-label">Total Score</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatTime(s.totalPlayTime)}</div>
                    <div class="stat-label">Play Time</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${s.totalFoodEaten}</div>
                    <div class="stat-label">Food Eaten</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${s.totalPowerUps}</div>
                    <div class="stat-label">Power-Ups Used</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${s.longestSnake}</div>
                    <div class="stat-label">Longest Snake</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${s.maxCombo}x</div>
                    <div class="stat-label">Max Combo</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${s.bossesDefeated}</div>
                    <div class="stat-label">Bosses Defeated</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${s.levelsCompleted}</div>
                    <div class="stat-label">Levels Completed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${s.achievementsUnlocked}</div>
                    <div class="stat-label">Achievements</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${s.deathsByWall + s.deathsByObstacle + s.deathsBySelf}</div>
                    <div class="stat-label">Total Deaths</div>
                </div>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button id="reset-stats" class="neu-button">Reset Statistics</button>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        document.getElementById('close-stats').onclick = () => this.closeStatsDashboard();
        document.getElementById('reset-stats').onclick = () => {
            if (confirm('Reset all statistics? This cannot be undone.')) {
                localStorage.removeItem('snake_stats');
                this.stats = this.loadStats();
                this.closeStatsDashboard();
            }
        };
    }
    
    closeStatsDashboard() {
        const panel = document.getElementById('stats-panel');
        if (panel) panel.remove();
        this.game.togglePause(false);
    }
    
    // Tutorial System
    startTutorial() {
        this.tutorialActive = true;
        this.tutorialStep = 0;
        this.showTutorialStep();
    }
    
    showTutorialStep() {
        const steps = [
            {
                title: 'Welcome to Snake!',
                text: 'Use the arrow keys or WASD to move your snake around the grid.',
                highlight: null
            },
            {
                title: 'Eat Food',
                text: 'Collect the glowing food to grow longer and earn points!',
                highlight: 'food'
            },
            {
                title: 'Avoid Obstacles',
                text: 'Don\'t hit walls, obstacles, or your own tail!',
                highlight: 'walls'
            },
            {
                title: 'Power-Ups',
                text: 'Special food gives you temporary powers like speed, shields, and more!',
                highlight: null
            },
            {
                title: 'Combo System',
                text: 'Eat food quickly to build combos for bonus points!',
                highlight: null
            },
            {
                title: 'Active Abilities',
                text: 'Press 1-4 to use special abilities like Dash and Shield Burst!',
                highlight: null
            },
            {
                title: 'Ultimate Ability',
                text: 'Fill your ultimate bar and press Q to unleash a powerful attack!',
                highlight: null
            },
            {
                title: 'You\'re Ready!',
                text: 'Good luck, and have fun! Press any key to start playing.',
                highlight: null
            }
        ];
        
        const step = steps[this.tutorialStep];
        if (!step) {
            this.endTutorial();
            return;
        }
        
        // Remove existing overlay
        const existing = document.querySelector('.tutorial-overlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'tutorial-overlay';
        overlay.innerHTML = `
            <div class="tutorial-box">
                <h2 style="color: #00ff88; margin-top: 0;">${step.title}</h2>
                <p style="font-size: 1.1em; line-height: 1.6;">${step.text}</p>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                    ${this.tutorialStep > 0 ? '<button id="tut-prev" class="neu-button">← Previous</button>' : ''}
                    <button id="tut-next" class="neu-button neu-button-primary">
                        ${this.tutorialStep < steps.length - 1 ? 'Next →' : 'Start Playing!'}
                    </button>
                </div>
                <div style="margin-top: 15px; color: #888; font-size: 0.8em;">
                    Step ${this.tutorialStep + 1} of ${steps.length}
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        document.getElementById('tut-next').onclick = () => {
            this.tutorialStep++;
            this.showTutorialStep();
        };
        
        const prevBtn = document.getElementById('tut-prev');
        if (prevBtn) {
            prevBtn.onclick = () => {
                this.tutorialStep--;
                this.showTutorialStep();
            };
        }
    }
    
    endTutorial() {
        this.tutorialActive = false;
        const overlay = document.querySelector('.tutorial-overlay');
        if (overlay) overlay.remove();
        
        localStorage.setItem('snake_tutorial_complete', 'true');
    }
    
    shouldShowTutorial() {
        return !localStorage.getItem('snake_tutorial_complete');
    }
    
    // Create animated background
    createAnimatedBackground() {
        const bg = document.createElement('div');
        bg.className = 'animated-bg';
        
        // Add floating particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'bg-particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 10}s`;
            particle.style.animationDuration = `${8 + Math.random() * 6}s`;
            bg.appendChild(particle);
        }
        
        document.body.insertBefore(bg, document.body.firstChild);
    }
    
    // Get current skin colors
    getCurrentSkinColors() {
        const skin = SNAKE_SKINS[this.currentSkin];
        if (!skin) return SNAKE_SKINS.default.colors;
        
        // Handle animated rainbow
        if (skin.animated && skin.colors.head === 'rainbow') {
            const hue = (Date.now() / 20) % 360;
            return {
                head: `hsl(${hue}, 100%, 50%)`,
                body: `hsl(${(hue + 30) % 360}, 100%, 50%)`,
                trail: `hsla(${hue}, 100%, 50%, 0.3)`
            };
        }
        
        return skin.colors;
    }
    
    // Trigger haptic feedback
    triggerHaptic(intensity = 'medium') {
        if (!this.settings.hapticFeedback) return;
        if (!navigator.vibrate) return;
        
        const durations = {
            light: 10,
            medium: 25,
            heavy: 50
        };
        
        const duration = durations[intensity] || 25;
        navigator.vibrate(duration * this.settings.hapticIntensity);
    }
}
