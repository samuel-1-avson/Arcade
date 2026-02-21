/**
 * Save/Resume System for 2048
 * Auto-saves game state after every move
 */

class SaveManager {
    constructor() {
        this.storageKey = '2048-save-state';
    }

    /**
     * Save current game state
     */
    saveGame(gameState) {
        try {
            const saveData = {
                grid: gameState.grid.cells,
                score: gameState.score,
                over: gameState.over,
                won: gameState.won,
                keepPlaying: gameState.keepPlaying,
                timestamp: Date.now()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.warn('Failed to save game:', e);
            return false;
        }
    }

    /**
     * Load saved game state
     */
    loadGame() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (!savedData) return null;

            const save = JSON.parse(savedData);
            
            // Check if save is not too old (7 days)
            const daysSince = (Date.now() - save.timestamp) / (1000 * 60 * 60 * 24);
            if (daysSince > 7) {
                this.clearSave();
                return null;
            }

            return save;
        } catch (e) {
            console.warn('Failed to load game:', e);
            return null;
        }
    }

    /**
     * Clear saved game
     */
    clearSave() {
        localStorage.removeItem(this.storageKey);
    }

    /**
     * Check if there's a saved game
     */
    hasSave() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    /**
     * Show resume prompt if save exists
     */
    showResumePrompt(onResume, onNewGame) {
        if (!this.hasSave()) {
            onNewGame();
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content resume-modal">
                <h2>Welcome Back!</h2>
                <p>You have a saved game. Would you like to continue?</p>
                <div class="modal-actions">
                    <button class="btn-primary" id="resume-btn">Resume Game</button>
                    <button class="btn-secondary" id="new-game-btn">New Game</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('resume-btn').onclick = () => {
            modal.remove();
            onResume();
        };

        document.getElementById('new-game-btn').onclick = () => {
            modal.remove();
            this.clearSave();
            onNewGame();
        };
    }
}

// Initialize save manager
const saveManager = new SaveManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaveManager;
}
