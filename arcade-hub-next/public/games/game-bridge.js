/**
 * Arcade Hub Game Integration Bridge
 * 
 * This script enables communication between games and the Arcade Hub.
 * Include this script in your game's index.html to:
 * - Submit scores to the hub
 * - Receive user information
 * - Notify the hub when the game is ready
 * - Handle exit requests
 * 
 * Usage:
 *   <script src="/games/game-bridge.js"></script>
 *   <script>
 *     // When game ends with a score
 *     ArcadeHub.submitScore(1500);
 *     
 *     // When game loads
 *     ArcadeHub.notifyReady();
 *     
 *     // On exit button click
 *     ArcadeHub.exitGame();
 *     
 *     // Listen for init data from hub
 *     ArcadeHub.onInit(function(data) {
 *       console.log('User:', data.username, 'ID:', data.userId);
 *     });
 *   </script>
 */
(function() {
  'use strict';

  // Prevent double initialization
  if (window.ArcadeHub) {
    console.log('[ArcadeHub] Bridge already initialized');
    return;
  }

  /**
   * ArcadeHub Game Bridge
   */
  var ArcadeHub = {
    // Store init data received from parent
    _initData: null,
    
    // Callbacks for init event
    _initCallbacks: [],

    /**
     * Submit a score to the Arcade Hub
     * @param {number} score - The final score achieved
     * @param {object} metadata - Optional additional data (game time, level reached, etc.)
     */
    submitScore: function(score, metadata) {
      if (typeof score !== 'number' || score < 0) {
        console.error('[ArcadeHub] Invalid score:', score);
        return;
      }

      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'GAME_SCORE',
          score: Math.floor(score),
          metadata: metadata || {},
          timestamp: Date.now()
        }, '*');
        console.log('[ArcadeHub] Score submitted:', score);
      } else {
        console.log('[ArcadeHub] Score (standalone mode):', score);
      }
    },

    /**
     * Notify the hub that the game is ready
     */
    notifyReady: function() {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'GAME_READY'
        }, '*');
      }
    },

    /**
     * Request to exit the game and return to hub
     */
    exitGame: function() {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'GAME_EXIT'
        }, '*');
      } else {
        // In standalone mode, redirect to hub
        window.location.href = '/hub/';
      }
    },

    /**
     * Register a callback for init messages from the hub
     * @param {function} callback - Function to call with init data
     */
    onInit: function(callback) {
      if (typeof callback !== 'function') {
        console.error('[ArcadeHub] onInit requires a function');
        return;
      }

      // If we already received init data, call immediately
      if (this._initData) {
        callback(this._initData);
      } else {
        this._initCallbacks.push(callback);
      }
    },

    /**
     * Get the init data received from the hub
     * @returns {object|null} - The init data or null if not received
     */
    getInitData: function() {
      return this._initData;
    },

    /**
     * Check if running inside the Arcade Hub
     * @returns {boolean}
     */
    isEmbedded: function() {
      return window.parent !== window;
    }
  };

  // Listen for messages from parent
  window.addEventListener('message', function(event) {
    // Validate message data
    if (!event.data || typeof event.data !== 'object') {
      return;
    }

    switch (event.data.type) {
      case 'INIT_GAME':
        ArcadeHub._initData = {
          userId: event.data.userId || 'guest',
          username: event.data.username || 'Guest'
        };
        
        // Call all registered callbacks
        ArcadeHub._initCallbacks.forEach(function(callback) {
          try {
            callback(ArcadeHub._initData);
          } catch (e) {
            console.error('[ArcadeHub] Init callback error:', e);
          }
        });
        
        console.log('[ArcadeHub] Initialized with:', ArcadeHub._initData);
        break;
    }
  });

  // Expose globally
  window.ArcadeHub = ArcadeHub;

  // Auto-notify ready after a short delay
  setTimeout(function() {
    ArcadeHub.notifyReady();
  }, 100);

  console.log('[ArcadeHub] Bridge initialized');
})();
