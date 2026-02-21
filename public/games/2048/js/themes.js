/**
 * Enhanced Theme Manager for 2048
 * 8 Beautiful themes with complete color palettes
 */

class ThemeManager {
    constructor() {
        this.currentTheme = this.loadTheme();
        this.themes = {
            // ============================================
            // CLASSIC - Original 2048 look
            // ============================================
            classic: {
                name: 'Classic',
                icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
                colors: {
                    bgPrimary: '#faf8ef',
                    bgSecondary: '#ffffff',
                    bgPanel: '#ffffff',
                    bgBoard: '#bbada0',
                    bgCell: 'rgba(238, 228, 218, 0.35)',
                    textPrimary: '#776e65',
                    textSecondary: '#9a8b7c',
                    textLight: '#f9f6f2',
                    accent: '#8f7a66',
                    accentLight: '#bbada0',
                    success: '#8bac8b',
                    tile2: '#eee4da', tile2Text: '#776e65',
                    tile4: '#ede0c8', tile4Text: '#776e65',
                    tile8: '#f2b179', tile8Text: '#f9f6f2',
                    tile16: '#f59563', tile16Text: '#f9f6f2',
                    tile32: '#f67c5f', tile32Text: '#f9f6f2',
                    tile64: '#f65e3b', tile64Text: '#f9f6f2',
                    tile128: '#edcf72', tile128Text: '#f9f6f2',
                    tile256: '#edcc61', tile256Text: '#f9f6f2',
                    tile512: '#edc850', tile512Text: '#f9f6f2',
                    tile1024: '#edc53f', tile1024Text: '#f9f6f2',
                    tile2048: '#edc22e', tile2048Text: '#f9f6f2',
                    tileSuper: '#3c3a32', tileSuperText: '#f9f6f2',
                    shadow: 'rgba(0,0,0,0.1)'
                }
            },

            // ============================================
            // DARK - Sleek dark mode
            // ============================================
            dark: {
                name: 'Dark',
                icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>',
                colors: {
                    bgPrimary: '#1a1a2e',
                    bgSecondary: '#16213e',
                    bgPanel: '#1e2a4a',
                    bgBoard: '#0f3460',
                    bgCell: 'rgba(255, 255, 255, 0.08)',
                    textPrimary: '#e8e8e8',
                    textSecondary: '#a0aab8',
                    textLight: '#ffffff',
                    accent: '#4a90d9',
                    accentLight: '#5c9ce5',
                    success: '#6bcb77',
                    tile2: '#2d3e50', tile2Text: '#e8e8e8',
                    tile4: '#34495e', tile4Text: '#e8e8e8',
                    tile8: '#3498db', tile8Text: '#ffffff',
                    tile16: '#2980b9', tile16Text: '#ffffff',
                    tile32: '#9b59b6', tile32Text: '#ffffff',
                    tile64: '#8e44ad', tile64Text: '#ffffff',
                    tile128: '#1abc9c', tile128Text: '#ffffff',
                    tile256: '#16a085', tile256Text: '#ffffff',
                    tile512: '#f39c12', tile512Text: '#ffffff',
                    tile1024: '#e74c3c', tile1024Text: '#ffffff',
                    tile2048: '#c0392b', tile2048Text: '#ffffff',
                    tileSuper: '#ecf0f1', tileSuperText: '#1a1a2e',
                    shadow: 'rgba(0,0,0,0.3)'
                }
            },

            // ============================================
            // OCEAN - Calm blue tones
            // ============================================
            ocean: {
                name: 'Ocean',
                icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41C17.92 5.77 20 8.65 20 12c0 2.08-.81 3.98-2.11 5.39z"/></svg>',
                colors: {
                    bgPrimary: '#e8f4fc',
                    bgSecondary: '#ffffff',
                    bgPanel: '#ffffff',
                    bgBoard: '#5da4bd',
                    bgCell: 'rgba(255, 255, 255, 0.25)',
                    textPrimary: '#2c5364',
                    textSecondary: '#5a8a9a',
                    textLight: '#ffffff',
                    accent: '#3b7a8c',
                    accentLight: '#67a8ba',
                    success: '#48b886',
                    tile2: '#d4edfc', tile2Text: '#2c5364',
                    tile4: '#b8dff5', tile4Text: '#2c5364',
                    tile8: '#7ec8e3', tile8Text: '#ffffff',
                    tile16: '#48b1d8', tile16Text: '#ffffff',
                    tile32: '#0097b2', tile32Text: '#ffffff',
                    tile64: '#007e99', tile64Text: '#ffffff',
                    tile128: '#00b4cc', tile128Text: '#ffffff',
                    tile256: '#00a0b4', tile256Text: '#ffffff',
                    tile512: '#008c9e', tile512Text: '#ffffff',
                    tile1024: '#007888', tile1024Text: '#ffffff',
                    tile2048: '#006472', tile2048Text: '#ffffff',
                    tileSuper: '#003844', tileSuperText: '#ffffff',
                    shadow: 'rgba(44, 83, 100, 0.15)'
                }
            },

            // ============================================
            // FOREST - Natural green tones
            // ============================================
            forest: {
                name: 'Forest',
                icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M14 6l-3.2-5h-1.6L6 6h3l-3.8 6h2.2L3.6 18h4.8v4h3.2v-4h4.8l-3.8-6h2.2l-3.8-6h3z"/></svg>',
                colors: {
                    bgPrimary: '#f0f5f0',
                    bgSecondary: '#ffffff',
                    bgPanel: '#ffffff',
                    bgBoard: '#5a7d5a',
                    bgCell: 'rgba(255, 255, 255, 0.2)',
                    textPrimary: '#2d4a2d',
                    textSecondary: '#5a7a5a',
                    textLight: '#ffffff',
                    accent: '#4a6b4a',
                    accentLight: '#6b8e6b',
                    success: '#7cb87c',
                    tile2: '#d8e8d8', tile2Text: '#2d4a2d',
                    tile4: '#c4dbc4', tile4Text: '#2d4a2d',
                    tile8: '#8bc48b', tile8Text: '#ffffff',
                    tile16: '#6bb86b', tile16Text: '#ffffff',
                    tile32: '#569d56', tile32Text: '#ffffff',
                    tile64: '#428a42', tile64Text: '#ffffff',
                    tile128: '#8fbc8f', tile128Text: '#ffffff',
                    tile256: '#78ab78', tile256Text: '#ffffff',
                    tile512: '#619a61', tile512Text: '#ffffff',
                    tile1024: '#4a894a', tile1024Text: '#ffffff',
                    tile2048: '#337833', tile2048Text: '#ffffff',
                    tileSuper: '#1a4a1a', tileSuperText: '#ffffff',
                    shadow: 'rgba(45, 74, 45, 0.15)'
                }
            },

            // ============================================
            // SUNSET - Warm orange/pink tones
            // ============================================
            sunset: {
                name: 'Sunset',
                icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>',
                colors: {
                    bgPrimary: '#fff5f0',
                    bgSecondary: '#ffffff',
                    bgPanel: '#ffffff',
                    bgBoard: '#d4775a',
                    bgCell: 'rgba(255, 255, 255, 0.25)',
                    textPrimary: '#5a3530',
                    textSecondary: '#8a6560',
                    textLight: '#ffffff',
                    accent: '#c45a3a',
                    accentLight: '#e07050',
                    success: '#e8a070',
                    tile2: '#ffe8e0', tile2Text: '#5a3530',
                    tile4: '#ffd8c8', tile4Text: '#5a3530',
                    tile8: '#ffb098', tile8Text: '#ffffff',
                    tile16: '#ff9878', tile16Text: '#ffffff',
                    tile32: '#ff7858', tile32Text: '#ffffff',
                    tile64: '#ff5838', tile64Text: '#ffffff',
                    tile128: '#ffc078', tile128Text: '#ffffff',
                    tile256: '#ffb060', tile256Text: '#ffffff',
                    tile512: '#ffa048', tile512Text: '#ffffff',
                    tile1024: '#ff9030', tile1024Text: '#ffffff',
                    tile2048: '#ff8018', tile2048Text: '#ffffff',
                    tileSuper: '#8a3520', tileSuperText: '#ffffff',
                    shadow: 'rgba(90, 53, 48, 0.15)'
                }
            },

            // ============================================
            // LAVENDER - Soft purple tones
            // ============================================
            lavender: {
                name: 'Lavender',
                icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm-1-8V7h2v2h-2z"/></svg>',
                colors: {
                    bgPrimary: '#f8f5ff',
                    bgSecondary: '#ffffff',
                    bgPanel: '#ffffff',
                    bgBoard: '#9b7cbd',
                    bgCell: 'rgba(255, 255, 255, 0.25)',
                    textPrimary: '#4a3a5a',
                    textSecondary: '#7a6a8a',
                    textLight: '#ffffff',
                    accent: '#8b6bab',
                    accentLight: '#a88bc5',
                    success: '#b898d0',
                    tile2: '#f0e8f8', tile2Text: '#4a3a5a',
                    tile4: '#e4d8f0', tile4Text: '#4a3a5a',
                    tile8: '#c8b0e0', tile8Text: '#ffffff',
                    tile16: '#b898d0', tile16Text: '#ffffff',
                    tile32: '#a880c0', tile32Text: '#ffffff',
                    tile64: '#9868b0', tile64Text: '#ffffff',
                    tile128: '#c090d8', tile128Text: '#ffffff',
                    tile256: '#b080c8', tile256Text: '#ffffff',
                    tile512: '#a070b8', tile512Text: '#ffffff',
                    tile1024: '#9060a8', tile1024Text: '#ffffff',
                    tile2048: '#805098', tile2048Text: '#ffffff',
                    tileSuper: '#4a2870', tileSuperText: '#ffffff',
                    shadow: 'rgba(74, 58, 90, 0.15)'
                }
            },

            // ============================================
            // MIDNIGHT - Deep blue/purple
            // ============================================
            midnight: {
                name: 'Midnight',
                icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
                colors: {
                    bgPrimary: '#0d1b2a',
                    bgSecondary: '#1b263b',
                    bgPanel: '#1b2838',
                    bgBoard: '#415a77',
                    bgCell: 'rgba(255, 255, 255, 0.1)',
                    textPrimary: '#e0e1dd',
                    textSecondary: '#9ca3af',
                    textLight: '#ffffff',
                    accent: '#778da9',
                    accentLight: '#89a0b8',
                    success: '#6dd5c0',
                    tile2: '#2a3f5f', tile2Text: '#e0e1dd',
                    tile4: '#3a4f6f', tile4Text: '#e0e1dd',
                    tile8: '#4a5f7f', tile8Text: '#ffffff',
                    tile16: '#5a6f8f', tile16Text: '#ffffff',
                    tile32: '#6a7f9f', tile32Text: '#ffffff',
                    tile64: '#7a8faf', tile64Text: '#ffffff',
                    tile128: '#60a0c0', tile128Text: '#ffffff',
                    tile256: '#50b0d0', tile256Text: '#ffffff',
                    tile512: '#40c0e0', tile512Text: '#1b2838',
                    tile1024: '#30d0f0', tile1024Text: '#1b2838',
                    tile2048: '#20e0ff', tile2048Text: '#1b2838',
                    tileSuper: '#ffffff', tileSuperText: '#1b2838',
                    shadow: 'rgba(0,0,0,0.4)'
                }
            },

            // ============================================
            // RETRO - Warm vintage tones
            // ============================================
            retro: {
                name: 'Retro',
                icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h2v2H6zm4-4h8v2h-8zm0 4h5v2h-5z"/></svg>',
                colors: {
                    bgPrimary: '#f5e6d3',
                    bgSecondary: '#fff8ef',
                    bgPanel: '#fff8ef',
                    bgBoard: '#8b7355',
                    bgCell: 'rgba(255, 248, 239, 0.3)',
                    textPrimary: '#4a3728',
                    textSecondary: '#7a6758',
                    textLight: '#fff8ef',
                    accent: '#a08060',
                    accentLight: '#c0a080',
                    success: '#b8a060',
                    tile2: '#e8dcc8', tile2Text: '#4a3728',
                    tile4: '#d8c8b0', tile4Text: '#4a3728',
                    tile8: '#c4a87a', tile8Text: '#fff8ef',
                    tile16: '#b8985a', tile16Text: '#fff8ef',
                    tile32: '#a88840', tile32Text: '#fff8ef',
                    tile64: '#987830', tile64Text: '#fff8ef',
                    tile128: '#d0a850', tile128Text: '#fff8ef',
                    tile256: '#c09840', tile256Text: '#fff8ef',
                    tile512: '#b08830', tile512Text: '#fff8ef',
                    tile1024: '#a07820', tile1024Text: '#fff8ef',
                    tile2048: '#906810', tile2048Text: '#fff8ef',
                    tileSuper: '#4a3020', tileSuperText: '#fff8ef',
                    shadow: 'rgba(74, 55, 40, 0.2)'
                }
            }
        };

        this.init();
    }

    init() {
        // Create theme switcher UI
        this.createThemeSwitcher();
    }

    createThemeSwitcher() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.buildSwitcher());
        } else {
            this.buildSwitcher();
        }
    }

    buildSwitcher() {
        // Remove old theme switcher
        const oldSwitcher = document.querySelector('.theme-switcher');
        if (oldSwitcher) oldSwitcher.remove();

        // Create new enhanced switcher
        const switcher = document.createElement('div');
        switcher.className = 'theme-switcher-enhanced';
        switcher.innerHTML = `
            <button class="theme-toggle-btn" onclick="themeManager.togglePicker()" title="Change Theme">
                <span class="theme-icon">${this.themes[this.currentTheme]?.icon || '🎨'}</span>
            </button>
            <div class="theme-picker" id="theme-picker">
                <div class="theme-picker-header">Choose Theme</div>
                <div class="theme-grid">
                    ${Object.entries(this.themes).map(([id, theme]) => `
                        <button class="theme-option ${id === this.currentTheme ? 'active' : ''}" 
                                data-theme="${id}" 
                                onclick="themeManager.setTheme('${id}')"
                                title="${theme.name}">
                            <span class="theme-preview" style="background: ${theme.colors.bgBoard}"></span>
                            <span class="theme-option-icon">${theme.icon}</span>
                            <span class="theme-option-name">${theme.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(switcher);
    }

    togglePicker() {
        const picker = document.getElementById('theme-picker');
        if (picker) {
            picker.classList.toggle('open');
        }
    }

    closePicker() {
        const picker = document.getElementById('theme-picker');
        if (picker) {
            picker.classList.remove('open');
        }
    }

    loadTheme() {
        return localStorage.getItem('2048-theme') || 'classic';
    }

    saveTheme(theme) {
        localStorage.setItem('2048-theme', theme);
    }

    setTheme(themeName) {
        if (!this.themes[themeName]) {
            console.warn(`Theme "${themeName}" not found`);
            return;
        }

        this.currentTheme = themeName;
        this.saveTheme(themeName);
        this.apply();

        // Update switcher UI
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeName);
        });

        // Update toggle button icon
        const toggleIcon = document.querySelector('.theme-toggle-btn .theme-icon');
        if (toggleIcon) {
            toggleIcon.innerHTML = this.themes[themeName].icon;
        }

        // Close picker
        this.closePicker();
    }

    apply() {
        const theme = this.themes[this.currentTheme];
        if (!theme) return;

        const root = document.documentElement;

        // Apply all color variables
        Object.entries(theme.colors).forEach(([key, value]) => {
            const cssVarName = '--theme-' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
            root.style.setProperty(cssVarName, value);
        });

        // Update body class
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${this.currentTheme}`);

        // Trigger transition
        document.body.style.transition = 'background-color 300ms ease';

        console.log(`🎨 Theme applied: ${theme.name}`);
    }

    getThemeName() {
        return this.themes[this.currentTheme]?.name || 'Classic';
    }

    getAllThemes() {
        return Object.entries(this.themes).map(([id, theme]) => ({
            id,
            name: theme.name,
            icon: theme.icon,
            active: id === this.currentTheme
        }));
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Apply theme on load
document.addEventListener('DOMContentLoaded', () => {
    themeManager.apply();
});

// Close picker when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-switcher-enhanced')) {
        themeManager.closePicker();
    }
});

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
