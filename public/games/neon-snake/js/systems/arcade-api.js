/**
 * Neon Snake Arena — Arcade API Client
 *
 * Handles leaderboard fetching and standalone score submission.
 *
 * When the game is embedded in the hub, score submission is handled by
 * game-client.tsx (which receives the GAME_SCORE postMessage from game-bridge.js).
 * This file adds:
 *   1. Leaderboard fetch after every game over (always, for all contexts)
 *   2. Direct score submission when playing standalone (not embedded)
 */

(function () {
  'use strict';

  var GAME_ID   = 'neon-snake';
  var LB_URL    = '/api/games/' + GAME_ID + '/leaderboard';
  var SCORE_URL = '/api/games/' + GAME_ID + '/scores';

  var ArcadeAPI = {
    // ── Leaderboard ────────────────────────────────────────

    /**
     * Fetch the top leaderboard entries.
     * @param {object}   opts
     * @param {number}   opts.limit       - how many entries (default 7, max 20)
     * @param {number}   opts.playerScore - player's current score (for rank calc)
     * @param {function} opts.onSuccess   - callback({ entries, playerRank, total })
     * @param {function} opts.onError     - optional callback(err)
     */
    fetchLeaderboard: function (opts) {
      opts = opts || {};
      var limit       = opts.limit       || 7;
      var playerScore = opts.playerScore;
      var onSuccess   = opts.onSuccess   || function () {};
      var onError     = opts.onError     || function () {};

      var url = LB_URL + '?limit=' + limit;
      if (typeof playerScore === 'number') {
        url += '&score=' + Math.floor(playerScore);
      }

      fetch(url)
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (data) {
          onSuccess({
            entries:    Array.isArray(data.entries)     ? data.entries    : [],
            playerRank: typeof data.playerRank === 'number' ? data.playerRank : null,
            total:      typeof data.total      === 'number' ? data.total      : 0,
          });
        })
        .catch(function (err) {
          console.warn('[ArcadeAPI] Leaderboard fetch failed:', err);
          onError(err);
          // Return empty so game over screen doesn't get stuck on "Loading..."
          onSuccess({ entries: [], playerRank: null, total: 0 });
        });
    },

    // ── Score submission ───────────────────────────────────

    /**
     * Submit score to the database.
     * Only calls the API route when NOT embedded in the hub.
     * When embedded, the hub's game-client handles it via postMessage.
     *
     * @param {object}   opts
     * @param {number}   opts.score       - final score
     * @param {string}   opts.displayName - player name (hub provides via INIT_GAME)
     * @param {object}   opts.metadata    - extra data (mode, duration, etc.)
     * @param {function} opts.onSuccess   - optional callback({ userId })
     */
    submitScore: function (opts) {
      opts = opts || {};

      // Hub handles submission when embedded — skip to avoid duplicates
      if (window.ArcadeHub && window.ArcadeHub.isEmbedded()) {
        return;
      }

      var score    = Math.floor(opts.score || 0);
      var name     = opts.displayName || 'Guest';
      var metadata = opts.metadata || {};
      var cb       = opts.onSuccess || function () {};

      // Get display name from hub init data if available (hub provides name even standalone)
      if (window.ArcadeHub && window.ArcadeHub.getInitData && window.ArcadeHub.getInitData()) {
        var initData = window.ArcadeHub.getInitData();
        if (initData && initData.username && initData.username !== 'Guest') {
          name = initData.username;
        }
      }

      fetch(SCORE_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ score: score, displayName: name, metadata: metadata }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            console.log('[ArcadeAPI] Score submitted (standalone), userId:', data.userId);
            cb(data);
          } else {
            console.warn('[ArcadeAPI] Score submit failed:', data.error);
          }
        })
        .catch(function (err) {
          console.warn('[ArcadeAPI] Score submit error:', err);
        });
    },
  };

  window.ArcadeAPI = ArcadeAPI;
  console.log('[ArcadeAPI] Loaded — game:', GAME_ID);
})();
