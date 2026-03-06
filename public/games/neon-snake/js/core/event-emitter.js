/**
 * Neon Snake Arena - Event Emitter
 * Lightweight pub/sub for decoupled communication
 */

class EventEmitter {
  constructor() {
    this.events = new Map();
  }
  
  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @param {Object} options - { once: boolean, priority: number }
   */
  on(event, callback, options = {}) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    const listener = {
      callback,
      once: options.once || false,
      priority: options.priority || 0,
    };
    
    const listeners = this.events.get(event);
    listeners.push(listener);
    
    // Sort by priority (higher first)
    listeners.sort((a, b) => b.priority - a.priority);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }
  
  /**
   * Subscribe once to an event
   */
  once(event, callback, options = {}) {
    return this.on(event, callback, { ...options, once: true });
  }
  
  /**
   * Unsubscribe from an event
   */
  off(event, callback) {
    if (!this.events.has(event)) return;
    
    const listeners = this.events.get(event);
    const index = listeners.findIndex(l => l.callback === callback);
    
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
  
  /**
   * Emit an event
   */
  emit(event, data = {}) {
    if (!this.events.has(event)) return;
    
    const listeners = this.events.get(event);
    const toRemove = [];
    
    for (const listener of listeners) {
      try {
        listener.callback(data);
        
        if (listener.once) {
          toRemove.push(listener);
        }
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    }
    
    // Remove once listeners
    for (const listener of toRemove) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * Remove all listeners for an event, or all events
   */
  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
  
  /**
   * Get listener count for an event
   */
  listenerCount(event) {
    if (!this.events.has(event)) return 0;
    return this.events.get(event).length;
  }
  
  /**
   * Check if event has listeners
   */
  hasListeners(event) {
    return this.listenerCount(event) > 0;
  }
}

// Global event bus for cross-module communication
const EventBus = new EventEmitter();

// Predefined game events
const GAME_EVENTS = {
  // Game lifecycle
  GAME_INIT: 'game:init',
  GAME_START: 'game:start',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_OVER: 'game:over',
  GAME_RESET: 'game:reset',
  
  // Snake events
  SNAKE_MOVE: 'snake:move',
  SNAKE_GROW: 'snake:grow',
  SNAKE_SHRINK: 'snake:shrink',
  SNAKE_DIRECTION_CHANGE: 'snake:directionChange',
  
  // Food events
  FOOD_SPAWN: 'food:spawn',
  FOOD_EATEN: 'food:eaten',
  FOOD_DESPAWN: 'food:despawn',
  
  // Power-up events
  POWERUP_SPAWN: 'powerup:spawn',
  POWERUP_COLLECT: 'powerup:collect',
  POWERUP_ACTIVATE: 'powerup:activate',
  POWERUP_EXPIRE: 'powerup:expire',
  
  // Score events
  SCORE_CHANGE: 'score:change',
  HIGH_SCORE: 'score:high',
  
  // UI events
  MENU_OPEN: 'menu:open',
  MENU_CLOSE: 'menu:close',
  MODE_SELECT: 'mode:select',
  
  // Input events
  INPUT_KEYDOWN: 'input:keydown',
  INPUT_KEYUP: 'input:keyup',
  INPUT_SWIPE: 'input:swipe',
  
  // Effect events
  EFFECT_SHAKE: 'effect:shake',
  EFFECT_FLASH: 'effect:flash',
  EFFECT_PARTICLES: 'effect:particles',
  
  // API events
  API_SCORE_SUBMIT: 'api:score:submit',
  API_STATS_UPDATE: 'api:stats:update',
  API_ERROR: 'api:error',
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EventEmitter, EventBus, GAME_EVENTS };
}
