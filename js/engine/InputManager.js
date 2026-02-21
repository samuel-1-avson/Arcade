/**
 * InputManager - Unified input handling for keyboard, touch, and gamepad
 * Supports both event-based and polling-based input detection
 */
import { eventBus } from './EventBus.js';
import { logger, LogCategory } from '../utils/logger.js';

class InputManager {
    constructor() {
        // Key states (true = pressed)
        this.keys = new Map();
        this.keysJustPressed = new Set();
        this.keysJustReleased = new Set();

        // Touch handling
        this.touches = [];
        this.swipeThreshold = 50;
        this.touchStart = null;

        // Gamepad
        this.gamepadIndex = null;
        this.gamepadState = {
            buttons: {},
            axes: { x: 0, y: 0 }
        };

        // Callbacks
        this.keyCallbacks = new Map();
        this.swipeCallbacks = new Map();

        // Bound methods for cleanup
        this._boundHandlers = {
            keydown: this._onKeyDown.bind(this),
            keyup: this._onKeyUp.bind(this),
            touchstart: this._onTouchStart.bind(this),
            touchmove: this._onTouchMove.bind(this),
            touchend: this._onTouchEnd.bind(this),
            gamepadconnected: this._onGamepadConnected.bind(this),
            gamepaddisconnected: this._onGamepadDisconnected.bind(this)
        };

        this.element = null;
        this.initialized = false;
    }

    /**
     * Initialize input handling on an element
     * @param {HTMLElement} element - Element to attach listeners to
     */
    init(element = document) {
        if (this.initialized) this.destroy();

        this.element = element;

        // Keyboard events
        document.addEventListener('keydown', this._boundHandlers.keydown);
        document.addEventListener('keyup', this._boundHandlers.keyup);

        // Touch events
        element.addEventListener('touchstart', this._boundHandlers.touchstart, { passive: false });
        element.addEventListener('touchmove', this._boundHandlers.touchmove, { passive: false });
        element.addEventListener('touchend', this._boundHandlers.touchend);

        // Gamepad events
        window.addEventListener('gamepadconnected', this._boundHandlers.gamepadconnected);
        window.addEventListener('gamepaddisconnected', this._boundHandlers.gamepaddisconnected);

        this.initialized = true;
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        document.removeEventListener('keydown', this._boundHandlers.keydown);
        document.removeEventListener('keyup', this._boundHandlers.keyup);

        if (this.element) {
            this.element.removeEventListener('touchstart', this._boundHandlers.touchstart);
            this.element.removeEventListener('touchmove', this._boundHandlers.touchmove);
            this.element.removeEventListener('touchend', this._boundHandlers.touchend);
        }

        window.removeEventListener('gamepadconnected', this._boundHandlers.gamepadconnected);
        window.removeEventListener('gamepaddisconnected', this._boundHandlers.gamepaddisconnected);

        this.keys.clear();
        this.keyCallbacks.clear();
        this.swipeCallbacks.clear();
        this.initialized = false;
    }

    /**
     * Check if a key is currently pressed
     * @param {string} key - Key code (e.g., 'ArrowUp', 'KeyW', 'Space')
     * @returns {boolean}
     */
    isKeyDown(key) {
        return this.keys.get(key) === true;
    }

    /**
     * Check if a key was just pressed this frame
     * @param {string} key - Key code
     * @returns {boolean}
     */
    isKeyJustPressed(key) {
        return this.keysJustPressed.has(key);
    }

    /**
     * Check if a key was just released this frame
     * @param {string} key - Key code
     * @returns {boolean}
     */
    isKeyJustReleased(key) {
        return this.keysJustReleased.has(key);
    }

    /**
     * Register a callback for a key press
     * @param {string} key - Key code
     * @param {Function} callback - Callback function
     */
    onKeyPress(key, callback) {
        if (!this.keyCallbacks.has(key)) {
            this.keyCallbacks.set(key, []);
        }
        this.keyCallbacks.get(key).push(callback);
    }

    /**
     * Register a callback for swipe gestures
     * @param {string} direction - 'up', 'down', 'left', 'right'
     * @param {Function} callback - Callback function
     */
    onSwipe(direction, callback) {
        if (!this.swipeCallbacks.has(direction)) {
            this.swipeCallbacks.set(direction, []);
        }
        this.swipeCallbacks.get(direction).push(callback);
    }

    /**
     * Clear just-pressed/released states (call at end of update loop)
     */
    update() {
        this.keysJustPressed.clear();
        this.keysJustReleased.clear();

        // Poll gamepad if connected
        if (this.gamepadIndex !== null) {
            this._pollGamepad();
        }
    }

    /**
     * Get normalized direction from arrow keys or WASD
     * @returns {{ x: number, y: number }}
     */
    getDirection() {
        let x = 0, y = 0;

        // Arrow keys
        if (this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA')) x -= 1;
        if (this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD')) x += 1;
        if (this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW')) y -= 1;
        if (this.isKeyDown('ArrowDown') || this.isKeyDown('KeyS')) y += 1;

        // Gamepad axes
        if (this.gamepadIndex !== null) {
            if (Math.abs(this.gamepadState.axes.x) > 0.2) {
                x = this.gamepadState.axes.x;
            }
            if (Math.abs(this.gamepadState.axes.y) > 0.2) {
                y = this.gamepadState.axes.y;
            }
        }

        return { x, y };
    }

    // Private methods

    _onKeyDown(e) {
        // Prevent default for game-related keys
        const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
        if (gameKeys.includes(e.code)) {
            e.preventDefault();
        }

        if (!this.keys.get(e.code)) {
            this.keysJustPressed.add(e.code);
        }
        this.keys.set(e.code, true);

        // Trigger callbacks
        if (this.keyCallbacks.has(e.code)) {
            this.keyCallbacks.get(e.code).forEach(cb => cb(e));
        }

        eventBus.emit('input:keydown', { code: e.code, key: e.key });
    }

    _onKeyUp(e) {
        this.keys.set(e.code, false);
        this.keysJustReleased.add(e.code);

        eventBus.emit('input:keyup', { code: e.code, key: e.key });
    }

    _onTouchStart(e) {
        if (e.touches.length === 1) {
            this.touchStart = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                time: Date.now()
            };
        }
    }

    _onTouchMove(e) {
        // Prevent scrolling during game
        e.preventDefault();
    }

    _onTouchEnd(e) {
        if (!this.touchStart) return;

        const touch = e.changedTouches[0];
        const dx = touch.clientX - this.touchStart.x;
        const dy = touch.clientY - this.touchStart.y;
        const dt = Date.now() - this.touchStart.time;

        // Only register as swipe if quick enough and moved enough
        if (dt < 300 && (Math.abs(dx) > this.swipeThreshold || Math.abs(dy) > this.swipeThreshold)) {
            let direction;

            if (Math.abs(dx) > Math.abs(dy)) {
                direction = dx > 0 ? 'right' : 'left';
            } else {
                direction = dy > 0 ? 'down' : 'up';
            }

            // Trigger callbacks
            if (this.swipeCallbacks.has(direction)) {
                this.swipeCallbacks.get(direction).forEach(cb => cb());
            }

            eventBus.emit('input:swipe', { direction, dx, dy });
        } else if (dt < 200 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
            // Tap
            eventBus.emit('input:tap', { x: touch.clientX, y: touch.clientY });
        }

        this.touchStart = null;
    }

    _onGamepadConnected(e) {
        logger.info(LogCategory.GAME, 'Gamepad connected:', e.gamepad.id);
        this.gamepadIndex = e.gamepad.index;
    }

    _onGamepadDisconnected(e) {
        if (e.gamepad.index === this.gamepadIndex) {
            logger.info(LogCategory.GAME, 'Gamepad disconnected');
            this.gamepadIndex = null;
        }
    }

    _pollGamepad() {
        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[this.gamepadIndex];

        if (!gamepad) return;

        // Left stick
        this.gamepadState.axes.x = gamepad.axes[0];
        this.gamepadState.axes.y = gamepad.axes[1];

        // D-pad or buttons
        this.gamepadState.buttons = {
            a: gamepad.buttons[0]?.pressed,
            b: gamepad.buttons[1]?.pressed,
            x: gamepad.buttons[2]?.pressed,
            y: gamepad.buttons[3]?.pressed,
            start: gamepad.buttons[9]?.pressed,
            select: gamepad.buttons[8]?.pressed
        };
    }
}

// Create singleton instance
export const inputManager = new InputManager();
export default InputManager;
