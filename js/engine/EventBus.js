/**
 * EventBus - Pub/Sub event system for component communication
 * Allows decoupled communication between game components
 */
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event only once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        };
        this.on(event, wrapper);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    off(event, callback) {
        if (!this.listeners.has(event)) return;

        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Data to pass to listeners
     */
    emit(event, data) {
        if (!this.listeners.has(event)) return;

        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for "${event}":`, error);
            }
        });
    }

    /**
     * Clear all listeners for an event or all events
     * @param {string} [event] - Optional event name to clear
     */
    clear(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}

// Standard game events
export const GameEvents = {
    // Game lifecycle
    GAME_INIT: 'game:init',
    GAME_START: 'game:start',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',
    GAME_OVER: 'game:over',
    GAME_RESET: 'game:reset',

    // Score & progress
    SCORE_UPDATE: 'score:update',
    HIGHSCORE_UPDATE: 'highscore:update',
    LEVEL_UP: 'level:up',

    // Player
    PLAYER_DEATH: 'player:death',
    PLAYER_HIT: 'player:hit',
    PLAYER_POWERUP: 'player:powerup',

    // Achievements
    ACHIEVEMENT_UNLOCK: 'achievement:unlock',
    XP_GAIN: 'xp:gain',

    // Audio
    SOUND_PLAY: 'sound:play',
    MUSIC_PLAY: 'music:play',
    MUSIC_STOP: 'music:stop',

    // UI
    UI_SHOW_OVERLAY: 'ui:showOverlay',
    UI_HIDE_OVERLAY: 'ui:hideOverlay'
};

// Create singleton instance
export const eventBus = new EventBus();
export default EventBus;
