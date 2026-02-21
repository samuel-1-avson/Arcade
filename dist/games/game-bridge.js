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
 *     ArcadeHub.submitScore(finalScore);
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
  if (window.ArcadeHub && window.ArcadeHub._initialized) {
    console.log('[ArcadeHub] Bridge already initialized');
    return;
  }

  /**
   * ArcadeHub Game Bridge
   */
  var ArcadeHub = {
    _initialized: true,
    _initData: null,
    _initCallbacks: [],
    _scoreSubmitted: false,

    /**
     * Submit a score to the Arcade Hub
     * @param {number} score - The final score achieved
     * @param {object} metadata - Optional additional data
     */
    submitScore: function(score, metadata) {
      if (typeof score !== 'number' || score < 0 || isNaN(score)) {
        console.error('[ArcadeHub] Invalid score:', score);
        return false;
      }

      // Prevent duplicate submissions
      if (this._scoreSubmitted) {
        console.log('[ArcadeHub] Score already submitted for this session');
        return true;
      }

      var data = {
        type: 'GAME_SCORE',
        score: Math.floor(score),
        gameId: this._getGameId(),
        metadata: metadata || {},
        timestamp: Date.now()
      };

      if (window.parent !== window) {
        window.parent.postMessage(data, '*');
        console.log('[ArcadeHub] Score submitted:', data.score);
        this._scoreSubmitted = true;
        return true;
      } else {
        console.log('[ArcadeHub] Score (standalone mode):', data.score);
        return false;
      }
    },

    /**
     * Submit final score and end game
     * @param {number} score - The final score
     * @param {object} metadata - Optional metadata
     */
    gameOver: function(score, metadata) {
      this.submitScore(score, metadata);
      // Also update achievements if implemented in game
      this._updateAchievements(score, metadata);
    },

    /**
     * Notify the hub that the game is ready
     */
    notifyReady: function() {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'GAME_READY',
          gameId: this._getGameId()
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

      if (this._initData) {
        callback(this._initData);
      } else {
        this._initCallbacks.push(callback);
      }
    },

    /**
     * Get the init data received from the hub
     * @returns {object|null}
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
    },

    /**
     * Reset score submission (for testing)
     */
    reset: function() {
      this._scoreSubmitted = false;
    },

    /**
     * Get current game ID from URL
     * @private
     */
    _getGameId: function() {
      var path = window.location.pathname;
      var match = path.match(/\/games\/([^\/]+)/);
      return match ? match[1] : 'unknown';
    },

    /**
     * Update achievements (placeholder for future)
     * @private
     */
    _updateAchievements: function(score, metadata) {
      // This can be extended to track game-specific achievements
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'ACHIEVEMENT_PROGRESS',
          gameId: this._getGameId(),
          score: score,
          metadata: metadata
        }, '*');
      }
    }
  };

  // Listen for messages from parent
  window.addEventListener('message', function(event) {
    if (!event.data || typeof event.data !== 'object') {
      return;
    }

    switch (event.data.type) {
      case 'INIT_GAME':
        ArcadeHub._initData = {
          userId: event.data.userId || 'guest',
          username: event.data.username || 'Guest',
          photoURL: event.data.photoURL || null
        };
        
        ArcadeHub._initCallbacks.forEach(function(callback) {
          try {
            callback(ArcadeHub._initData);
          } catch (e) {
            console.error('[ArcadeHub] Init callback error:', e);
          }
        });
        
        console.log('[ArcadeHub] Initialized:', ArcadeHub._initData);
        break;
        
      case 'GAME_STATE_REQUEST':
        // Hub is asking for current game state
        window.parent.postMessage({
          type: 'GAME_STATE_RESPONSE',
          gameId: ArcadeHub._getGameId(),
          hasScore: ArcadeHub._scoreSubmitted
        }, '*');
        break;
    }
  });

  // Expose globally
  window.ArcadeHub = ArcadeHub;

  // Auto-notify ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      ArcadeHub.notifyReady();
    });
  } else {
    ArcadeHub.notifyReady();
  }

  console.log('[ArcadeHub] Bridge v2.0 initialized');
})();
