/**
 * Keyboard Shortcuts Manager for 2048
 * Handles all keyboard shortcuts with minimal UI feedback
 */

class KeyboardShortcutsManager {
    constructor() {
        this.shortcuts = {
            'r': { name: 'Restart Game', action: () => this.restartGame() },
            'm': { name: 'Toggle Mute', action: () => this.toggleMute() },
            'h': { name: 'Show Hint', action: () => this.showHint() },
            '?': { name: 'Show Help', action: () => this.showHelp() },
            't': { name: 'Cycle Theme', action: () => this.cycleTheme() }
        };
        
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts while typing
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const key = e.key.toLowerCase();
            if (this.shortcuts[key]) {
                e.preventDefault();
                this.shortcuts[key].action();
                this.showFeedback(this.shortcuts[key].name);
            }
        });
    }

    restartGame() {
        if (window.gameManager) {
            window.gameManager.restart();
        }
    }

    toggleMute() {
        if (window.audioManager) {
            const enabled = window.audioManager.toggle();
            this.updateMuteButton(enabled);
        }
    }

    showHint() {
        // Will be implemented with power-ups system
        console.log('Hint system coming soon');
    }

    showHelp() {
        this.createHelpModal();
    }

    cycleTheme() {
        if (window.themeManager) {
            const themes = ['light', 'dark', 'pastel'];
            const currentIndex = themes.indexOf(themeManager.currentTheme);
            const nextIndex = (currentIndex + 1) % themes.length;
            themeManager.setTheme(themes[nextIndex]);
            this.updateThemeButtons();
        }
    }

    updateMuteButton(enabled) {
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.textContent = enabled ? '🔊' : '🔇';
            muteBtn.title = enabled ? 'Mute (M)' : 'Unmute (M)';
        }
    }

    updateThemeButtons() {
        document.querySelectorAll('.theme-btn').forEach((btn, index) => {
            const themes = ['light', 'dark', 'pastel'];
            btn.classList.toggle('active', themes[index] === themeManager.currentTheme);
        });
    }

    showFeedback(message) {
        // Create minimal toast notification
        const toast = document.createElement('div');
        toast.className = 'shortcut-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Fade in
        setTimeout(() => toast.classList.add('show'), 10);

        // Fade out and remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 1500);
    }

    createHelpModal() {
        // Remove existing modal if any
        const existing = document.getElementById('help-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'help-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content help-modal">
                <button class="modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Keyboard Shortcuts</h2>
                <div class="shortcuts-grid">
                    <div class="shortcut-item">
                        <kbd>↑ ↓ ← →</kbd>
                        <span>Move tiles</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>R</kbd>
                        <span>Restart game</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>M</kbd>
                        <span>Toggle mute</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>T</kbd>
                        <span>Cycle theme</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>H</kbd>
                        <span>Show hint</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>?</kbd>
                        <span>Show this help</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Close on Escape
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    getShortcuts() {
        return Object.entries(this.shortcuts).map(([key, data]) => ({
            key,
            name: data.name
        }));
    }
}

// Initialize keyboard shortcuts manager
const keyboardShortcuts = new KeyboardShortcutsManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyboardShortcutsManager;
}
